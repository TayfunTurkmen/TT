import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", tr: "/tr" },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="relative overflow-hidden">
      <div className="hero-orbit -right-24 -top-24 sm:right-10 sm:top-0" aria-hidden />
      <section className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--chip)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
          {t("badge")}
        </p>
        <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="mt-5 max-w-xl text-base text-[var(--muted)]">{t("sub")}</p>
        <p className="mt-3 text-sm text-[var(--muted)]">{t("minimalMeta")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#041016] transition hover:brightness-110"
          >
            {t("ctaBlog")}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--chip)]"
          >
            {t("ctaAbout")}
          </Link>
        </div>
      </section>
    </div>
  );
}
