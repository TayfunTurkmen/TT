import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    alternates: { canonical: `/${locale}/about` },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
        {t("title")}
      </h1>
      <p className="mt-8 text-lg leading-relaxed text-[var(--muted)]">{t("body")}</p>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text)]">
          {t("summaryTitle")}
        </h2>
        <p className="mt-3 text-[var(--muted)]">{t("summaryBody")}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text)]">
          {t("experienceTitle")}
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>{t("exp1")}</li>
          <li>{t("exp2")}</li>
          <li>{t("exp3")}</li>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text)]">
          {t("educationTitle")}
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>{t("edu1")}</li>
          <li>{t("edu2")}</li>
          <li>{t("edu3")}</li>
        </ul>
      </section>

      <a
        href="https://www.linkedin.com/in/ttayfun/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#041016] transition hover:brightness-110"
      >
        {t("linkedinCta")}
      </a>
    </div>
  );
}
