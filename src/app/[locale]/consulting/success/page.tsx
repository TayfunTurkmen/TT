import { getStripeClient } from "@/lib/stripe";
import { getAdminConsultingSettings, getConsultingBookingByPublicId } from "@/lib/d1";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "consulting" });
  return {
    title: t("successTitle"),
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/consulting/success` },
  };
}

export default async function ConsultingSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "consulting" });

  let verified = false;
  if (sessionId) {
    const consulting = await getAdminConsultingSettings();
    if (consulting.stripeSecretKey) {
      try {
        const stripe = getStripeClient(consulting.stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid" && session.client_reference_id) {
          const booking = await getConsultingBookingByPublicId(session.client_reference_id);
          verified = Boolean(booking && booking.status === "paid");
        }
      } catch {
        verified = false;
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20 text-2xl">
        ✓
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text)]">
        {verified ? t("successTitle") : t("successPendingTitle")}
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        {verified ? t("successBody") : t("successPendingBody")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#041016]"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
