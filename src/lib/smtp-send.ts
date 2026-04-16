import nodemailer from "nodemailer";
import type { AdminSmtpSettings } from "@/lib/d1";

export async function sendContactNotificationEmail(params: {
  smtp: AdminSmtpSettings;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { smtp } = params;
  if (!smtp.smtpHost || !smtp.smtpUser || !smtp.smtpPass || !smtp.smtpFrom) {
    throw new Error("smtp-incomplete");
  }
  const port = Number.parseInt(String(smtp.smtpPort || "587"), 10) || 587;
  const useSecure = smtp.smtpSecure || port === 465;
  const transporter = nodemailer.createTransport({
    host: smtp.smtpHost,
    port,
    secure: useSecure,
    auth: {
      user: smtp.smtpUser,
      pass: smtp.smtpPass,
    },
  });
  await transporter.sendMail({
    from: smtp.smtpFrom,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
}
