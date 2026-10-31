"use server";

import { generateDraft, translateDraft, type GeneratedDraft, type LocaleCode } from "@/lib/auto-blog";
import { buildWebDualDrafts } from "@/lib/auto-blog-web";
import { syncDemoSitePostsToAdminDb } from "@/lib/site-post-sync";
import { extractKeywords } from "@/lib/web-fetch";
import {
  autoPublishScheduledPosts,
  deleteBlogPostsBySlug,
  deleteBlogPost,
  deleteContactMessage,
  getAdminBlogPost,
  logCronRun,
  publishBlogPostsBySlug,
  saveAdminAiSettings,
  saveAdminSmtpSettings,
  savePublicSiteSettings,
  upsertBlogPost,
} from "@/lib/d1";
import { attemptAdminLogin, endAdminSession, getClientIp, isAdminAuthenticated } from "@/lib/admin-auth";
import { isLikelyBotSubmission } from "@/lib/form-guard";
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type AdminResult =
  | {
      ok: true;
      message:
        | "saved"
        | "unlocked"
        | "bulkSaved"
        | "settingsSaved"
        | "publishedNow"
        | "deleted"
        | "cronRun"
        | "bulkDeleted"
        | "synced";
    }
  | { ok: false; error: "auth" | "blocked" | "config" | "locked" | "invalid" | "db" | "twoFactor" };

export type AdminTwoFactorSetupResult =
  | { ok: true; secret: string; otpauthUri: string }
  | { ok: false; error: "locked" };

export async function unlockAdmin(formData: FormData): Promise<AdminResult> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username.trim() || !password) return { ok: false, error: "invalid" };
  if (isLikelyBotSubmission(formData)) return { ok: false, error: "auth" };

  const ip = getClientIp(await headers());
  const result = await attemptAdminLogin({
    username,
    password,
    totp: String(formData.get("totp") ?? ""),
    ip,
  });
  if (result === "config") return { ok: false, error: "config" };
  if (result === "blocked") return { ok: false, error: "blocked" };
  if (result !== "ok") return { ok: false, error: "auth" };
  return { ok: true, message: "unlocked" };
}

export async function logoutAdmin(): Promise<void> {
  await endAdminSession();
}

/**
 * Generates a fresh 2FA secret for the admin to copy into ADMIN_TOTP_SECRET.
 * Nothing is stored server side; the secret only takes effect once it is set in the environment.
 */
export async function createTwoFactorSecret(): Promise<AdminTwoFactorSetupResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };
  const secret = generateTotpSecret();
  return { ok: true, secret, otpauthUri: buildTotpUri({ secret, username: "admin" }) };
}

/** Lets the admin confirm an authenticator app works before saving the secret to the environment. */
export async function checkTwoFactorCode(secret: string, code: string): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };
  if (!/^[A-Z2-7]{16,}$/.test(String(secret))) return { ok: false, error: "invalid" };
  if (!verifyTotpCode(secret, String(code))) return { ok: false, error: "twoFactor" };
  return { ok: true, message: "settingsSaved" };
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function pairLocale(locale: LocaleCode): LocaleCode {
  return locale === "en" ? "tr" : "en";
}

function autoExcerptFromContent(content: string, locale: LocaleCode): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const slice = plain.slice(0, 158).trim();
  if (slice) return slice;
  return locale === "tr"
    ? "Bu yazı web geliştirme ve siber güvenlik odağında pratik notlar içerir."
    : "This post shares practical notes focused on web development and cybersecurity.";
}

function buildSeoTags(
  locale: LocaleCode,
  title: string,
  excerpt: string,
  content: string,
  manualTags: string[],
): string[] {
  const auto = extractKeywords(`${title} ${excerpt} ${content.slice(0, 4000)}`, locale, 6);
  const base = locale === "tr" ? ["seo", "blog", "web", "guvenlik"] : ["seo", "blog", "web", "security"];
  return [...new Set([...manualTags, ...base, ...auto])].slice(0, 12);
}

async function saveTwoLocales(params: {
  baseLocale: LocaleCode;
  draft: GeneratedDraft;
  published: boolean;
  scheduleDate: string | null;
  baseSlug?: string;
}) {
  const { baseLocale, draft, published, scheduleDate, baseSlug } = params;
  const targetLocale = pairLocale(baseLocale);
  const translated = await translateDraft(draft, baseLocale, targetLocale);
  const scheduledFor = scheduleDate ? `${scheduleDate}T09:00:00Z` : null;
  const sharedSlug = baseSlug ?? toSlug(draft.title);

  const primaryOk = await upsertBlogPost({
    slug: sharedSlug,
    locale: baseLocale,
    title: draft.title,
    excerpt: draft.excerpt,
    content: draft.content,
    tags: draft.tags,
    published,
    scheduledFor,
    metaTitle: draft.seoTitle,
    metaDescription: draft.seoDescription,
  });
  if (!primaryOk) return false;

  const translatedOk = await upsertBlogPost({
    slug: sharedSlug,
    locale: targetLocale,
    title: translated.title,
    excerpt: translated.excerpt,
    content: translated.content,
    tags: translated.tags,
    published,
    scheduledFor,
    metaTitle: translated.seoTitle,
    metaDescription: translated.seoDescription,
  });
  if (!translatedOk) return false;

  return true;
}

async function saveTwoLocalesWeb(params: {
  sharedSlug: string;
  baseLocale: LocaleCode;
  base: GeneratedDraft;
  other: GeneratedDraft;
  published: boolean;
  scheduleDate: string | null;
}) {
  const { sharedSlug, baseLocale, base, other, published, scheduleDate } = params;
  const otherLocale = pairLocale(baseLocale);
  const scheduledFor = scheduleDate ? `${scheduleDate}T09:00:00Z` : null;

  const primaryOk = await upsertBlogPost({
    slug: sharedSlug,
    locale: baseLocale,
    title: base.title,
    excerpt: base.excerpt,
    content: base.content,
    tags: base.tags,
    published,
    scheduledFor,
    metaTitle: base.seoTitle,
    metaDescription: base.seoDescription,
  });
  if (!primaryOk) return false;

  const otherOk = await upsertBlogPost({
    slug: sharedSlug,
    locale: otherLocale,
    title: other.title,
    excerpt: other.excerpt,
    content: other.content,
    tags: other.tags,
    published,
    scheduledFor,
    metaTitle: other.seoTitle,
    metaDescription: other.seoDescription,
  });
  return otherOk;
}

export async function saveAdminPost(formData: FormData): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const locale = String(formData.get("locale") ?? "en");
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const manualTags = String(formData.get("tags") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const content = String(formData.get("content") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";
  const scheduleDate = String(formData.get("scheduleDate") ?? "").trim();
  if (!title || !content || (locale !== "en" && locale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  const baseLocale = locale as LocaleCode;
  const effectiveExcerpt = excerpt || autoExcerptFromContent(content, baseLocale);
  const tags = buildSeoTags(baseLocale, title, effectiveExcerpt, content, manualTags);
  const sourceDraft: GeneratedDraft = {
    title,
    excerpt: effectiveExcerpt,
    content,
    tags,
    seoTitle: title,
    seoDescription: effectiveExcerpt,
  };

  const manualSlug = toSlug(title);
  if (!manualSlug) return { ok: false, error: "invalid" };

  const ok = await saveTwoLocales({
    baseLocale,
    draft: sourceDraft,
    published,
    scheduleDate: scheduleDate || null,
    baseSlug: manualSlug,
  });
  if (!ok) return { ok: false, error: "db" };

  return { ok: true, message: "saved" };
}

export async function updateAdminPost(formData: FormData): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const originalLocale = String(formData.get("originalLocale") ?? "");
  const originalSlug = String(formData.get("originalSlug") ?? "");
  const existing = await getAdminBlogPost(originalLocale, originalSlug);
  if (!existing) return { ok: false, error: "invalid" };

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const manualTags = String(formData.get("tags") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const content = String(formData.get("content") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";
  const scheduleDate = String(formData.get("scheduleDate") ?? "").trim();

  if (!title || !content) return { ok: false, error: "invalid" };
  const locale = existing.locale as LocaleCode;
  const effectiveExcerpt = excerpt || autoExcerptFromContent(content, locale);
  const tags = buildSeoTags(locale, title, effectiveExcerpt, content, manualTags);

  const ok = await upsertBlogPost({
    slug: existing.slug,
    locale,
    title,
    excerpt: effectiveExcerpt,
    content,
    tags,
    published,
    scheduledFor: scheduleDate ? `${scheduleDate}T09:00:00Z` : null,
    metaTitle: title,
    metaDescription: effectiveExcerpt,
    category: existing.category,
    author: existing.author,
    featuredImage: existing.featuredImage,
  });
  if (!ok) return { ok: false, error: "db" };

  const otherLocale = pairLocale(existing.locale as LocaleCode);
  const translated = await translateDraft(
    {
      title,
      excerpt: effectiveExcerpt,
      content,
      tags,
      seoTitle: title,
      seoDescription: effectiveExcerpt,
    },
    existing.locale as LocaleCode,
    otherLocale,
  );
  const otherOk = await upsertBlogPost({
    slug: existing.slug,
    locale: otherLocale,
    title: translated.title,
    excerpt: translated.excerpt,
    content: translated.content,
    tags: translated.tags,
    published,
    scheduledFor: scheduleDate ? `${scheduleDate}T09:00:00Z` : null,
    metaTitle: translated.seoTitle,
    metaDescription: translated.seoDescription,
    category: existing.category,
    author: existing.author,
    featuredImage: existing.featuredImage,
  });
  if (!otherOk) return { ok: false, error: "db" };

  revalidatePath("/[locale]/admin", "page");
  return { ok: true, message: "saved" };
}

function addDays(base: Date, days: number): Date {
  const x = new Date(base);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export async function generateBulkAiDrafts(formData: FormData): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const locale = String(formData.get("locale") ?? "en");
  const rawTopics = String(formData.get("topics") ?? "");
  const runNow = String(formData.get("runNow") ?? "") === "1";
  const startDateRaw = String(formData.get("startDate") ?? "");
  const intervalDays = Number(String(formData.get("intervalDays") ?? "1")) || 1;
  const useWebResearch = String(formData.get("useWebResearch") ?? "") === "on";
  const rawWebUrls = String(formData.get("webSourceUrls") ?? "");
  const webUrls = rawWebUrls
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5);

  const topics = rawTopics
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!topics.length || (locale !== "en" && locale !== "tr")) {
    return { ok: false, error: "invalid" };
  }
  if (useWebResearch && !webUrls.length) {
    return { ok: false, error: "invalid" };
  }

  const baseDate = startDateRaw ? new Date(`${startDateRaw}T09:00:00Z`) : new Date();
  const baseLocale = locale as LocaleCode;

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    const plannedDate = runNow
      ? null
      : addDays(baseDate, i * Math.max(1, intervalDays))
          .toISOString()
          .slice(0, 10);

    if (useWebResearch && webUrls.length) {
      const web = await buildWebDualDrafts(topic, baseLocale, webUrls);
      if (!web.ok) return { ok: false, error: "invalid" };

      const ok = await saveTwoLocalesWeb({
        sharedSlug: web.sharedSlug,
        baseLocale,
        base: web.base,
        other: web.other,
        published: false,
        scheduleDate: plannedDate,
      });
      if (!ok) return { ok: false, error: "db" };
      continue;
    }

    const draft = await generateDraft({ topic, locale: baseLocale });
    const ok = await saveTwoLocales({
      baseLocale,
      draft,
      published: false,
      scheduleDate: plannedDate,
    });
    if (!ok) return { ok: false, error: "db" };
  }

  return { ok: true, message: "bulkSaved" };
}

export async function saveMarketingSettings(formData: FormData): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const analyticsMeasurementId =
    String(formData.get("analyticsMeasurementId") ?? "").trim() || null;
  const aiApiBaseUrl = String(formData.get("aiApiBaseUrl") ?? "").trim() || null;
  const aiModel = String(formData.get("aiModel") ?? "").trim() || null;
  const aiApiKeyRaw = String(formData.get("aiApiKey") ?? "").trim();

  const ok = await savePublicSiteSettings({
    analyticsMeasurementId,
  });
  const aiOk = await saveAdminAiSettings({
    aiApiBaseUrl,
    aiModel,
    aiApiKey: aiApiKeyRaw ? aiApiKeyRaw : undefined,
  });
  if (!ok || !aiOk) return { ok: false, error: "db" };
  return { ok: true, message: "settingsSaved" };
}

export async function saveSmtpSettings(formData: FormData): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const brevoApiKeyRaw = String(formData.get("brevoApiKey") ?? "").trim();
  const smtpHost = String(formData.get("smtpHost") ?? "").trim() || null;
  const smtpPort = String(formData.get("smtpPort") ?? "587").trim() || "587";
  const smtpUser = String(formData.get("smtpUser") ?? "").trim() || null;
  const smtpFrom = String(formData.get("smtpFrom") ?? "").trim() || null;
  const contactNotifyEmail = String(formData.get("contactNotifyEmail") ?? "").trim() || null;
  const smtpSecure = String(formData.get("smtpSecure") ?? "") === "on";
  const smtpPassRaw = String(formData.get("smtpPass") ?? "").trim();

  const ok = await saveAdminSmtpSettings({
    brevoApiKey: brevoApiKeyRaw ? brevoApiKeyRaw : undefined,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpFrom,
    smtpSecure,
    contactNotifyEmail,
    smtpPass: smtpPassRaw ? smtpPassRaw : undefined,
  });
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "settingsSaved" };
}

export async function deleteContactMessageAdmin(id: number): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };
  const safeId = Number(id);
  if (!Number.isFinite(safeId) || safeId < 1) return { ok: false, error: "invalid" };
  const ok = await deleteContactMessage(safeId);
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "deleted" };
}



export async function publishAdminPost(locale: string, slug: string): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const safeLocale = String(locale);
  const safeSlug = String(slug).trim();
  if (!safeSlug || (safeLocale !== "en" && safeLocale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  const source = await getAdminBlogPost(safeLocale, safeSlug);
  if (!source) return { ok: false, error: "invalid" };
  const otherLocale = pairLocale(safeLocale as LocaleCode);
  const other = await getAdminBlogPost(otherLocale, safeSlug);
  if (!other) {
    const translated = await translateDraft(
      {
        title: source.title,
        excerpt: source.excerpt,
        content: source.content,
        tags: source.tags,
        seoTitle: source.metaTitle ?? source.title,
        seoDescription: source.metaDescription ?? source.excerpt,
      },
      safeLocale as LocaleCode,
      otherLocale,
    );
    const created = await upsertBlogPost({
      slug: safeSlug,
      locale: otherLocale,
      title: translated.title,
      excerpt: translated.excerpt,
      content: translated.content,
      tags: translated.tags,
      published: false,
      scheduledFor: null,
      metaTitle: translated.seoTitle,
      metaDescription: translated.seoDescription,
    });
    if (!created) return { ok: false, error: "db" };
  }

  const ok = await publishBlogPostsBySlug(safeSlug);
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "publishedNow" };
}

export async function deleteAdminPost(locale: string, slug: string): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const safeLocale = String(locale);
  const safeSlug = String(slug).trim();
  if (!safeSlug || (safeLocale !== "en" && safeLocale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  const ok = await deleteBlogPost(safeLocale, safeSlug);
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "deleted" };
}

export async function deleteAdminPostGroup(slug: string): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };
  const safeSlug = String(slug).trim();
  if (!safeSlug) return { ok: false, error: "invalid" };

  const ok = await deleteBlogPostsBySlug(safeSlug);
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "deleted" };
}

export async function bulkDeleteAdminPostGroups(slugs: string[]): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };
  const clean = [...new Set(slugs.map((s) => String(s).trim()).filter(Boolean))];
  if (!clean.length) return { ok: false, error: "invalid" };

  for (const slug of clean) {
    const ok = await deleteBlogPostsBySlug(slug);
    if (!ok) return { ok: false, error: "db" };
  }
  return { ok: true, message: "bulkDeleted" };
}

export async function runCronNow(): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  try {
    const publishedCount = await autoPublishScheduledPosts(100);
    await logCronRun({
      source: "admin-manual",
      ok: true,
      publishedCount,
      error: null,
    });
    return { ok: true, message: "cronRun" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "manual-cron-failed";
    await logCronRun({
      source: "admin-manual",
      ok: false,
      publishedCount: 0,
      error: message,
    });
    return { ok: false, error: "db" };
  }
}

export async function syncSitePostsToAdmin(): Promise<AdminResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  try {
    const ok = await syncDemoSitePostsToAdminDb();
    if (!ok) return { ok: false, error: "db" };
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/blog", "page");
    return { ok: true, message: "synced" };
  } catch {
    return { ok: false, error: "db" };
  }
}

export async function generateEditorDraft(formData: FormData): Promise<
  | { ok: true; title: string; excerpt: string; content: string; tags: string }
  | { ok: false; error: "locked" | "invalid" | "db" }
> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "locked" };

  const locale = String(formData.get("locale") ?? "en");
  const topic = String(formData.get("topic") ?? "").trim();
  const sourceUrlsRaw = String(formData.get("sourceUrls") ?? "");
  const sourceUrls = sourceUrlsRaw
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!topic || (locale !== "en" && locale !== "tr")) return { ok: false, error: "invalid" };

  try {
    const draft = await generateDraft({
      topic,
      locale,
      sourceUrls: sourceUrls.length ? sourceUrls : undefined,
    });
    return {
      ok: true,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      tags: draft.tags.join(", "),
    };
  } catch {
    return { ok: false, error: "db" };
  }
}
