"use server";

import {
  getAdminSecuritySettings,
  getAdminSmtpSettings,
  insertContactMessage,
} from "@/lib/d1";
import { sendContactNotificationEmail } from "@/lib/smtp-send";
import { verifyTurnstileResponse } from "@/lib/turnstile";
import { headers } from "next/headers";

function getClientIpFromHeaders(h: Headers): string {
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

export type ContactFormResult =
  | { ok: true }
  | { ok: false; error: "turnstile" | "invalid" | "db" | "config" };

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  const settings = await getAdminSecuritySettings();
  if (!settings.turnstileSiteKey || !settings.turnstileSecretKey) {
    return { ok: false, error: "config" };
  }

  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const userAgent = h.get("user-agent");
  const token = String(formData.get("cf-turnstile-response") ?? "");
  const turnstileOk = await verifyTurnstileResponse(settings.turnstileSecretKey, token, ip);
  if (!turnstileOk) return { ok: false, error: "turnstile" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("message") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!name || name.length > 120) return { ok: false, error: "invalid" };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "invalid" };
  }
  if (body.length < 10 || body.length > 8000) return { ok: false, error: "invalid" };
  if (locale !== "en" && locale !== "tr") return { ok: false, error: "invalid" };

  const saved = await insertContactMessage({
    name,
    email,
    body,
    locale,
    ip,
    userAgent,
  });
  if (!saved) return { ok: false, error: "db" };

  const smtp = await getAdminSmtpSettings();
  const notify = smtp.contactNotifyEmail?.trim();
  if (notify && smtp.smtpHost && smtp.smtpUser && smtp.smtpPass && smtp.smtpFrom) {
    try {
      await sendContactNotificationEmail({
        smtp,
        to: notify,
        subject: `[tayfunturkmen.com] ${name}`,
        text: `From: ${name} <${email}>\nLocale: ${locale}\nIP: ${ip}\n\n---\n\n${body}\n`,
      });
    } catch {
      // Message is stored; email delivery may fail in some serverless environments.
    }
  }

  return { ok: true };
}
