import { ConsultingBookingForm } from "@/components/ConsultingBookingForm";
import { formatMoney } from "@/lib/stripe";
import { getPublicConsultingSettings, getPublicSiteSettings } from "@/lib/d1";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cancelled?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "consulting" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/consulting` },
  };
}

export default async function ConsultingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { cancelled } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "consulting" });
  const site = await getPublicSiteSettings();
  const consulting = await getPublicConsultingSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-2)]">
        {t("badge")}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--muted)]">{t("lead")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { title: t("feature1Title"), body: t("feature1Body") },
          { title: t("feature2Title"), body: t("feature2Body") },
          { title: t("feature3Title"), body: t("feature3Body") },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[var(--border)] bg-[var(--chip)] p-4"
          >
            <h2 className="text-sm font-semibold text-[var(--text)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
          </div>
        ))}
      </div>

      {consulting.enabled ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          {t("pricingSummary", {
            price30: formatMoney(consulting.price30, consulting.currency, locale),
            price60: formatMoney(consulting.price60, consulting.currency, locale),
          })}
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--chip)] p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text)]">
          {t("formTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("formLead")}</p>
        <div className="mt-5">
          <ConsultingBookingForm
            enabled={consulting.enabled}
            turnstileSiteKey={site.turnstileSiteKey}
            price30={consulting.price30}
            price60={consulting.price60}
            currency={consulting.currency}
            cancelled={cancelled === "1"}
          />
        </div>
      </div>
    </div>
  );
}
