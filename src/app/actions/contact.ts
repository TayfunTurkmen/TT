"use server";

import {
  getAdminSmtpSettings,
  insertContactMessage,
  pingD1,
} from "@/lib/d1";
import { verifySimpleFormGuard } from "@/lib/form-guard";
import { hasContactNotificationTransport, sendContactNotificationEmail } from "@/lib/smtp-send";
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
  | { ok: false; error: "bot" | "invalid" | "db" | "config" };

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  if (!(await pingD1())) return { ok: false, error: "config" };
  if (!verifySimpleFormGuard(formData)) return { ok: false, error: "bot" };

  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const userAgent = h.get("user-agent");

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
  if (notify && hasContactNotificationTransport(smtp)) {
    try {
      await sendContactNotificationEmail({
        smtp,
        to: notify,
        subject: `[tayfunturkmen.com] ${name}`,
        text: `From: ${name} <${email}>\nLocale: ${locale}\nIP: ${ip}\n\n---\n\n${body}\n`,
        replyTo: { email, name },
      });
    } catch (error) {
      console.warn(
        "Contact notification email failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  return { ok: true };
}
