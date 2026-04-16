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
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {t("cvTitle")}
          </h2>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--chip)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--chip)]">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                      <path d="M10 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 10.5c-3.3 0-6 2-6 4.5v1h12v-1c0-2.5-2.7-4.5-6-4.5Z" />
                    </svg>
                  </span>
                  {t("cvNameLabel")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{t("cvNameValue")}</p>
              </article>
              <article className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--chip)]">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-9Zm3 1.5v1h8V7H6Zm0 3v1h5v-1H6Z" />
                    </svg>
                  </span>
                  {t("cvRoleLabel")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{t("cvRoleValue")}</p>
              </article>
              <article className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--chip)]">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3A1.5 1.5 0 0 1 13 3.5V4h2.5A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4H7v-.5ZM8.5 4h3v-.5h-3V4Z" />
                    </svg>
                  </span>
                  {t("cvExperienceLabel")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{t("cvExperienceValue")}</p>
              </article>
              <article className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--chip)]">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                      <path d="M10 2.5a5 5 0 0 0-5 5c0 3.6 5 10 5 10s5-6.4 5-10a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                    </svg>
                  </span>
                  {t("cvLocationLabel")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{t("cvLocationValue")}</p>
              </article>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4" aria-label={t("cvStackAria")}>
              <li className="list-none">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--accent)]"
                  title="Next.js"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.918-2.593-2.425-3.418c-1.331-1.877-2.424-3.428-2.429-3.428-.005-.002-.005 1.612-.005 3.583 0 3.914-.01 3.564.095 3.928.134.471.428.88.816 1.129.164.105.41.194.59.237.214.052.72.065 9.38.065h9.15l.207-.106a1.68 1.68 0 0 0 .9-1.12c.074-.265.074-17.7 0-17.965a1.67 1.67 0 0 0-.9-1.12l-.207-.106H12.57l-.038.002z" />
                  </svg>
                </span>
              </li>
              <li className="list-none">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--accent-2)]"
                  title="React"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 1 10.42 1 12.004c0 1.59.96 3.1 2.742 4.183-.602 2.295-.213 4.702.974 5.527.323.186.697.278 1.107.278 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 23 13.59 23 12.004c0-1.59-.96-3.1-2.742-4.183.603-2.293.213-4.702-.973-5.527-.325-.186-.697-.278-1.108-.278zm-1.165 1.748c.145.05.27.14.37.26.79.915 1.16 2.86.748 5.42-.37 2.15-1.19 4.19-2.3 5.65-.11.14-.25.25-.41.32-.15.07-.32.11-.49.11-.65 0-1.55-.52-2.65-1.45-1.1-.93-2.2-2.18-3.14-3.57.94-1.39 2.04-2.64 3.14-3.57 1.1-.93 2-1.45 2.65-1.45.17 0 .34.04.49.11z" />
                  </svg>
                </span>
              </li>
              <li className="list-none">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                  title="TypeScript"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.813 5.813 0 0 0-1.425-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.101-.304.226-.393.371a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.581.274.923.416.47.197.892.407 1.266.628.374.222.695.473.963.748.268.276.472.598.614.963.142.365.214.78.214 1.247 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.565.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a7.01 7.01 0 0 0 1.413.679 4.746 4.746 0 0 0 1.592.285c.415 0 .735-.07.96-.21.225-.14.337-.36.337-.66a.756.756 0 0 0-.125-.39 1.14 1.14 0 0 0-.364-.326 5.068 5.068 0 0 0-.651-.337c-.26-.12-.598-.26-.997-.42a6.292 6.292 0 0 1-1.13-.675 2.57 2.57 0 0 1-.755-.916 2.55 2.55 0 0 1-.27-1.211c0-.484.099-.906.296-1.266.198-.36.48-.66.844-.9.364-.24.805-.42 1.32-.54.515-.12 1.098-.18 1.748-.18zm-6.387 1.23h2.55v8.175h3.51v2.205h-6.06z" />
                  </svg>
                </span>
              </li>
              <li className="list-none">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--accent)]"
                  title={t("cvIconSecurityTitle")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </span>
              </li>
              <li className="list-none">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
                  title={t("cvIconAutomationTitle")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V4.875c0-.621.504-1.125 1.125-1.125h4.125c.621 0 1.125.504 1.125 1.125v4.125c0 .621.504 1.125 1.125 1.125h4.125c.621 0 1.125.504 1.125 1.125v4.125c0 .621-.504 1.125-1.125 1.125h-4.125a3 3 0 01-3-3m-13.5 0a3 3 0 003 3h4.125c.621 0 1.125-.504 1.125-1.125v-4.125c0-.621.504-1.125 1.125-1.125h4.125c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H9.375a3 3 0 00-3 3v1.125z"
                    />
                  </svg>
                </span>
              </li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  );
}
