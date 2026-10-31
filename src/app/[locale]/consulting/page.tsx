import { ConsultingPurchase } from "@/components/ConsultingPurchase";
import { Link } from "@/i18n/routing";
import { consultingPackage, formatTry } from "@/lib/business";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "consulting" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/consulting` },
  };
}

export default async function ConsultingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "consulting" });
  const minutes = consultingPackage.minutes;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent-ink)]">{t("badge")}</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--muted)]">{t("lead")}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-1">
          {[
            { title: t("feature1Title"), body: t("feature1Body") },
            { title: t("feature2Title"), body: t("feature2Body") },
            { title: t("feature3Title"), body: t("feature3Body") },
          ].map((item) => (
            <div key={item.title} className="bg-[var(--bg)] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-[var(--text)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-md)] sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{t("packageTitle", { minutes })}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{t("packageDesc")}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight text-[var(--text)]">
              {formatTry(consultingPackage.priceTry, locale)}
            </span>
            <span className="text-sm text-[var(--muted)]">/ {t("perSession", { minutes })}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{t("taxIncluded")}</p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--text)]">
            {[t("include1"), t("include2"), t("include3")].map((item) => (
              <li key={item} className="flex gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-[var(--success)]">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <ConsultingPurchase paymentLink={consultingPackage.paymentLink} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
            {t("paymentNote")}{" "}
            <Link href="/cancellation-refund" className="underline underline-offset-4 hover:text-[var(--text)]">
              {t("refundLink")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
