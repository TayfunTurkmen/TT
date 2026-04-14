"use server";

import { generatePostMarkdown } from "@/lib/auto-blog";
import { cookies } from "next/headers";

const COOKIE = "studio_ok";

export type StudioResult =
  | { ok: true; markdown?: string }
  | { ok: false; error: "disabled" | "auth" | "locked" | "topic" };

export async function unlockStudio(formData: FormData): Promise<StudioResult> {
  const expected = process.env.AUTO_BLOG_PANEL_SECRET;
  if (!expected) return { ok: false, error: "disabled" };

  const secret = String(formData.get("secret") ?? "");
  if (secret !== expected) return { ok: false, error: "auth" };

  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  return { ok: true };
}

export async function generateStudioDraft(
  formData: FormData,
): Promise<StudioResult> {
  if (!process.env.AUTO_BLOG_PANEL_SECRET) return { ok: false, error: "disabled" };

  const jar = await cookies();
  if (jar.get(COOKIE)?.value !== "1") return { ok: false, error: "locked" };

  const topic = String(formData.get("topic") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");
  if (topic.length < 3) return { ok: false, error: "topic" };

  const markdown = await generatePostMarkdown({ topic, locale });
  return { ok: true, markdown };
}
