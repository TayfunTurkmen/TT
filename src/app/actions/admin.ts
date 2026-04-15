"use server";

import { upsertBlogPost } from "@/lib/d1";
import { cookies } from "next/headers";

const COOKIE = "admin_ok";

export type AdminResult =
  | { ok: true; message: "saved" | "unlocked" }
  | { ok: false; error: "disabled" | "auth" | "locked" | "invalid" };

export async function unlockAdmin(formData: FormData): Promise<AdminResult> {
  const expected = process.env.BLOG_ADMIN_SECRET;
  if (!expected) return { ok: false, error: "disabled" };

  const secret = String(formData.get("secret") ?? "");
  if (secret !== expected) return { ok: false, error: "auth" };

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
  if (!process.env.BLOG_ADMIN_SECRET) return { ok: false, error: "disabled" };

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
  const slug = toSlug(rawSlug || title);

  if (!slug || !title || !content || (locale !== "en" && locale !== "tr")) {
    return { ok: false, error: "invalid" };
  }

  await upsertBlogPost({
    slug,
    locale,
    title,
    excerpt,
    content,
    tags,
    published,
  });

  return { ok: true, message: "saved" };
}
