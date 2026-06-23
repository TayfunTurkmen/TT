// nodemailer is dynamically imported inside to prevent edge startup crash
import type { AdminSmtpSettings } from "@/lib/d1";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

function resolveBrevoApiKey(smtp: AdminSmtpSettings): string | null {
  const explicit = smtp.brevoApiKey?.trim();
  if (explicit) return explicit;

  const host = smtp.smtpHost?.toLowerCase() ?? "";
  if (host.includes("brevo") || host.includes("sendinblue")) {
    return smtp.smtpPass?.trim() || null;
  }

  return null;
}

function extractEmailAddress(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const bracketMatch = trimmed.match(/<([^>]+)>/);
  const email = (bracketMatch?.[1] ?? trimmed).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function canUseBrevo(smtp: AdminSmtpSettings): boolean {
  return Boolean(resolveBrevoApiKey(smtp) && extractEmailAddress(smtp.smtpFrom));
}

function canUseSmtp(smtp: AdminSmtpSettings): boolean {
  return Boolean(smtp.smtpHost && smtp.smtpUser && smtp.smtpPass && smtp.smtpFrom);
}

export function hasContactNotificationTransport(smtp: AdminSmtpSettings): boolean {
  return canUseBrevo(smtp) || canUseSmtp(smtp);
}

export async function sendContactNotificationEmail(params: {
  smtp: AdminSmtpSettings;
  to: string;
  subject: string;
  text: string;
  replyTo?: {
    email: string;
    name: string;
  };
}): Promise<void> {
  const { smtp } = params;
  if (canUseBrevo(smtp)) {
    const apiKey = resolveBrevoApiKey(smtp);
    const senderEmail = extractEmailAddress(smtp.smtpFrom);
    if (!apiKey || !senderEmail) throw new Error("brevo-incomplete");

    const payload: Record<string, unknown> = {
      sender: { email: senderEmail, name: "Tayfun Türkmen" },
      to: [{ email: params.to }],
      subject: params.subject,
      textContent: params.text,
      tags: ["contact"],
    };

    if (params.replyTo?.email) {
      payload.replyTo = {
        email: params.replyTo.email,
        name: params.replyTo.name,
      };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let code = "";
      try {
        const data = (await response.json()) as { code?: unknown };
        if (data?.code) code = `:${String(data.code)}`;
      } catch {
        // Keep the thrown error compact; logs should not include request details.
      }
      throw new Error(`brevo-send-failed:${response.status}${code}`);
    }
    return;
  }

  if (!canUseSmtp(smtp)) {
    throw new Error("smtp-incomplete");
  }
  const { smtpHost, smtpUser, smtpPass, smtpFrom } = smtp;
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error("smtp-incomplete");
  }
  const port = Number.parseInt(String(smtp.smtpPort || "587"), 10) || 587;
  const useSecure = smtp.smtpSecure || port === 465;
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: useSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  } satisfies SMTPTransport.Options);
  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
}
