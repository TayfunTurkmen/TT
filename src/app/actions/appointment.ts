"use server";

import { getClientIp } from "@/lib/admin-auth";
import { getAdminSmtpSettings, insertAppointmentRequest, pingD1 } from "@/lib/d1";
import { verifySimpleFormGuard } from "@/lib/form-guard";
import { hasContactNotificationTransport, sendContactNotificationEmail } from "@/lib/smtp-send";
import { headers } from "next/headers";

export type AppointmentRequestResult =
  | { ok: true }
  | { ok: false; error: "bot" | "invalid" | "date" | "db" | "config" };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Accepts today (with a day of slack for time zones) up to one year ahead. */
function isBookableDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const day = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(day)) return false;
  const now = Date.now();
  return day >= now - 2 * DAY_MS && day <= now + 366 * DAY_MS;
}

export async function submitAppointmentRequest(formData: FormData): Promise<AppointmentRequestResult> {
  if (!(await pingD1())) return { ok: false, error: "config" };
  if (!verifySimpleFormGuard(formData)) return { ok: false, error: "bot" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!name || name.length > 120) return { ok: false, error: "invalid" };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "invalid" };
  }
  if (!TIME_PATTERN.test(preferredTime)) return { ok: false, error: "invalid" };
  if (topic.length < 10 || topic.length > 4000) return { ok: false, error: "invalid" };
  if (locale !== "en" && locale !== "tr") return { ok: false, error: "invalid" };
  if (!isBookableDate(preferredDate)) return { ok: false, error: "date" };

  const h = await headers();
  const ip = getClientIp(h);
  const saved = await insertAppointmentRequest({
    name,
    email,
    preferredDate,
    preferredTime,
    topic,
    locale,
    ip,
    userAgent: h.get("user-agent"),
  });
  if (!saved) return { ok: false, error: "db" };

  const smtp = await getAdminSmtpSettings();
  const notify = smtp.contactNotifyEmail?.trim();
  if (notify && hasContactNotificationTransport(smtp)) {
    try {
      await sendContactNotificationEmail({
        smtp,
        to: notify,
        subject: `[tayfunturkmen.com] Randevu talebi: ${name}`,
        text: `From: ${name} <${email}>\nTarih: ${preferredDate} ${preferredTime}\nLocale: ${locale}\nIP: ${ip}\n\n---\n\n${topic}\n\nOnaylamak için: /admin → Randevular`,
        replyTo: { email, name },
      });
    } catch (error) {
      console.warn(
        "Appointment notification email failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  return { ok: true };
}
