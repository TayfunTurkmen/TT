import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";

type Props = { locale: string };

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <header className="border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:flex sm:h-16 sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-0">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-baseline gap-1.5 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[var(--text)] sm:gap-2 sm:text-lg"
          >
            <span className="shrink-0 text-[var(--accent)]">⟨</span>
            <span className="min-w-0 truncate transition-colors group-hover:text-[var(--accent)] sm:truncate-none">
              Tayfun Türkmen
            </span>
            <span className="shrink-0 text-[var(--accent)]">⟩</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle lightLabel={t("themeLight")} darkLabel={t("themeDark")} />
            <LocaleSwitch locale={locale} />
            <a
              href={`/api/rss?locale=${locale}`}
              className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
              rel="noopener noreferrer"
            >
              {t("rss")}
            </a>
          </div>
        </div>
        <nav className="mt-2 flex flex-wrap items-center gap-1 text-sm font-medium sm:mt-0 sm:justify-end sm:gap-3">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("home")}
          </Link>
          <Link
            href="/blog"
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("blog")}
          </Link>
          <Link
            href="/about"
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("about")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
