"use server";

import {
  getAdminConsultingSettings,
  getAdminSmtpSettings,
  insertConsultingBooking,
  setConsultingBookingStripeSession,
} from "@/lib/d1";
import { verifySimpleFormGuard } from "@/lib/form-guard";
import { getStripeClient, packageLabel, type ConsultingPackage } from "@/lib/stripe";
import { hasContactNotificationTransport, sendContactNotificationEmail } from "@/lib/smtp-send";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";

function getClientIpFromHeaders(h: Headers): string {
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

function getSiteOrigin(h: Headers): string {
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function newPublicId(): string {
  return randomBytes(16).toString("hex");
}

export type ConsultingCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: "config" | "bot" | "invalid" | "db" | "stripe" };

export async function createConsultingCheckout(
  formData: FormData,
): Promise<ConsultingCheckoutResult> {
  const consulting = await getAdminConsultingSettings();
  if (!consulting.consultingEnabled || !consulting.stripeSecretKey) {
    return { ok: false, error: "config" };
  }

  if (!verifySimpleFormGuard(formData)) return { ok: false, error: "bot" };

  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const userAgent = h.get("user-agent");
  const origin = getSiteOrigin(h);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const pkg = String(formData.get("package") ?? "") as ConsultingPackage;
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!name || name.length > 120) return { ok: false, error: "invalid" };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "invalid" };
  }
  if (pkg !== "30" && pkg !== "60") return { ok: false, error: "invalid" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return { ok: false, error: "invalid" };
  if (!/^\d{2}:\d{2}$/.test(preferredTime)) return { ok: false, error: "invalid" };
  if (topic.length > 4000) return { ok: false, error: "invalid" };
  if (locale !== "en" && locale !== "tr") return { ok: false, error: "invalid" };

  const amountCents = pkg === "30" ? consulting.consultingPrice30 : consulting.consultingPrice60;
  const publicId = newPublicId();

  const saved = await insertConsultingBooking({
    publicId,
    name,
    email,
    package: pkg,
    preferredDate,
    preferredTime,
    topic,
    locale,
    amountCents,
    currency: consulting.consultingCurrency,
    ip,
    userAgent,
  });
  if (!saved) return { ok: false, error: "db" };

  try {
    const stripe = getStripeClient(consulting.stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: publicId,
      metadata: {
        bookingId: publicId,
        package: pkg,
        preferredDate,
        preferredTime,
        locale,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: consulting.consultingCurrency,
            unit_amount: amountCents,
            product_data: {
              name: packageLabel(pkg, locale),
              description:
                locale === "tr"
                  ? `Tercih edilen tarih: ${preferredDate} ${preferredTime}`
                  : `Preferred slot: ${preferredDate} ${preferredTime}`,
            },
          },
        },
      ],
      success_url: `${origin}/${locale}/consulting/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/consulting?cancelled=1`,
    });

    if (!session.url || !session.id) return { ok: false, error: "stripe" };

    await setConsultingBookingStripeSession(publicId, session.id);
    return { ok: true, checkoutUrl: session.url };
  } catch (error) {
    console.warn(
      "Stripe checkout session failed",
      error instanceof Error ? error.message : "unknown",
    );
    return { ok: false, error: "stripe" };
  }
}

export async function notifyConsultingBookingPaid(booking: {
  name: string;
  email: string;
  package: "30" | "60";
  preferredDate: string;
  preferredTime: string;
  topic: string;
  locale: string;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const smtp = await getAdminSmtpSettings();
  const notify = smtp.contactNotifyEmail?.trim();
  if (!notify || !hasContactNotificationTransport(smtp)) return;

  const amount = (booking.amountCents / 100).toFixed(2);
  const text = [
    "Paid consulting booking",
    "",
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Package: ${booking.package} min`,
    `Preferred: ${booking.preferredDate} ${booking.preferredTime}`,
    `Locale: ${booking.locale}`,
    `Amount: ${amount} ${booking.currency.toUpperCase()}`,
    "",
    "Topic:",
    booking.topic || "(none)",
  ].join("\n");

  try {
    await sendContactNotificationEmail({
      smtp,
      to: notify,
      subject: `[tayfunturkmen.com] Paid consulting · ${booking.name}`,
      text,
      replyTo: { email: booking.email, name: booking.name },
    });
  } catch (error) {
    console.warn(
      "Consulting booking notification failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}
