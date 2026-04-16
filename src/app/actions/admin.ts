"use server";

import { generateDraft, translateDraft, type GeneratedDraft, type LocaleCode } from "@/lib/auto-blog";
import { buildWebDualDrafts } from "@/lib/auto-blog-web";
import {
  autoPublishScheduledPosts,
  clearAdminLoginFailures,
  deleteBlogPostsBySlug,
  deleteBlogPost,
  getAdminBlogPost,
  getAdminSecuritySettings,
  isAdminLoginBlocked,
  logCronRun,
  publishBlogPostsBySlug,
  registerAdminLoginFailure,
  registerInitialAdmin,
  savePublicSiteSettings,
  saveTurnstileSecret,
  upsertBlogPost,
  verifyAdminUser,
} from "@/lib/d1";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE = "admin_ok";

export type AdminResult =
  | {
      ok: true;
      message:
        | "saved"
        | "unlocked"
        | "registered"
        | "bulkSaved"
        | "settingsSaved"
        | "publishedNow"
        | "deleted"
        | "cronRun";
    }
  | { ok: false; error: "auth" | "locked" | "invalid" | "db" | "exists" };

function getClientIpFromHeaders(
  h: Headers,
): string {
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

async function verifyTurnstileIfEnabled(formData: FormData, ip: string): Promise<boolean> {
  const settings = await getAdminSecuritySettings();
  if (!settings.turnstileSecretKey) return true;
  const token = String(formData.get("cf-turnstile-response") ?? "").trim();
  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.set("secret", settings.turnstileSecretKey);
    body.set("response", token);
    body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function unlockAdmin(formData: FormData): Promise<AdminResult> {
  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { ok: false, error: "invalid" };
  const attemptKey = `${username}|${ip}`;
  const blockedSeconds = await isAdminLoginBlocked(attemptKey);
  if (blockedSeconds > 0) return { ok: false, error: "auth" };

  const turnstileOk = await verifyTurnstileIfEnabled(formData, ip);
  if (!turnstileOk) {
    await registerAdminLoginFailure(attemptKey);
    return { ok: false, error: "auth" };
  }
  const ok = await verifyAdminUser(username, password);
  if (!ok) {
    await registerAdminLoginFailure(attemptKey);
    return { ok: false, error: "auth" };
  }
  await clearAdminLoginFailures(attemptKey);

  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return { ok: true, message: "unlocked" };
}

export async function setupInitialAdmin(formData: FormData): Promise<AdminResult> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await registerInitialAdmin(username, password);

  if (result === "db") return { ok: false, error: "db" };
  if (result === "invalid") return { ok: false, error: "invalid" };
  if (result === "exists") return { ok: false, error: "exists" };

  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return { ok: true, message: "registered" };
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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

  const locale = String(formData.get("locale") ?? "en");
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
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
  const sourceDraft: GeneratedDraft = {
    title,
    excerpt,
    content,
    tags,
    seoTitle: title,
    seoDescription: excerpt,
  };

  const manualSlug = toSlug(rawSlug || title);
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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

  const originalLocale = String(formData.get("originalLocale") ?? "");
  const originalSlug = String(formData.get("originalSlug") ?? "");
  const existing = await getAdminBlogPost(originalLocale, originalSlug);
  if (!existing) return { ok: false, error: "invalid" };

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const content = String(formData.get("content") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";
  const scheduleDate = String(formData.get("scheduleDate") ?? "").trim();

  if (!title || !content) return { ok: false, error: "invalid" };

  const ok = await upsertBlogPost({
    slug: existing.slug,
    locale: existing.locale,
    title,
    excerpt,
    content,
    tags,
    published,
    scheduledFor: scheduleDate ? `${scheduleDate}T09:00:00Z` : null,
    metaTitle: title,
    metaDescription: excerpt,
  });
  if (!ok) return { ok: false, error: "db" };

  const otherLocale = pairLocale(existing.locale as LocaleCode);
  const translated = await translateDraft(
    {
      title,
      excerpt,
      content,
      tags,
      seoTitle: title,
      seoDescription: excerpt,
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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

  const adsenseClient = String(formData.get("adsenseClient") ?? "").trim() || null;
  const analyticsMeasurementId =
    String(formData.get("analyticsMeasurementId") ?? "").trim() || null;
  const adSlotBlogList = String(formData.get("adSlotBlogList") ?? "").trim() || null;
  const adSlotBlogPost = String(formData.get("adSlotBlogPost") ?? "").trim() || null;
  const turnstileSiteKey = String(formData.get("turnstileSiteKey") ?? "").trim() || null;
  const turnstileSecretKey = String(formData.get("turnstileSecretKey") ?? "").trim();

  const ok = await savePublicSiteSettings({
    adsenseClient,
    analyticsMeasurementId,
    adSlotBlogList,
    adSlotBlogPost,
    turnstileSiteKey,
  });
  const secOk = turnstileSecretKey ? await saveTurnstileSecret(turnstileSecretKey) : true;
  if (!ok || !secOk) return { ok: false, error: "db" };
  return { ok: true, message: "settingsSaved" };
}

export async function publishAdminPost(locale: string, slug: string): Promise<AdminResult> {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

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
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };
  const safeSlug = String(slug).trim();
  if (!safeSlug) return { ok: false, error: "invalid" };

  const ok = await deleteBlogPostsBySlug(safeSlug);
  if (!ok) return { ok: false, error: "db" };
  return { ok: true, message: "deleted" };
}

export async function runCronNow(): Promise<AdminResult> {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

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

export async function generateEditorDraft(formData: FormData): Promise<
  | { ok: true; title: string; excerpt: string; content: string; tags: string }
  | { ok: false; error: "locked" | "invalid" | "db" }
> {
  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

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
