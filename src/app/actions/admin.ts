"use server";

import { generateDraft } from "@/lib/auto-blog";
import { registerInitialAdmin, upsertBlogPost, verifyAdminUser } from "@/lib/d1";
import { cookies } from "next/headers";

const COOKIE = "admin_ok";

export type AdminResult =
  | { ok: true; message: "saved" | "unlocked" | "registered" | "bulkSaved" }
  | { ok: false; error: "auth" | "locked" | "invalid" | "db" | "exists" };

export async function unlockAdmin(formData: FormData): Promise<AdminResult> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { ok: false, error: "invalid" };
  const ok = await verifyAdminUser(username, password);
  if (!ok) return { ok: false, error: "auth" };

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
  const slug = toSlug(rawSlug || title);

  if (!slug || !title || !content || (locale !== "en" && locale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  const ok = await upsertBlogPost({
    slug,
    locale,
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
  const startDateRaw = String(formData.get("startDate") ?? "");
  const intervalDays = Number(String(formData.get("intervalDays") ?? "1")) || 1;

  const topics = rawTopics
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!topics.length || (locale !== "en" && locale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  const baseDate = startDateRaw ? new Date(`${startDateRaw}T09:00:00Z`) : new Date();

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    const draft = await generateDraft({ topic, locale });
    const slug = toSlug(topic);
    const planned = addDays(baseDate, i * Math.max(1, intervalDays))
      .toISOString()
      .slice(0, 19) + "Z";

    const ok = await upsertBlogPost({
      slug,
      locale,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      tags: draft.tags,
      published: false,
      scheduledFor: planned,
      metaTitle: draft.seoTitle,
      metaDescription: draft.seoDescription,
    });
    if (!ok) return { ok: false, error: "db" };
  }

  return { ok: true, message: "bulkSaved" };
}
