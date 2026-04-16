import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";

type Props = { locale: string };

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <header className="border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:min-h-16 sm:px-6 sm:py-0">
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
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto overscroll-x-contain pb-0.5 text-sm font-medium [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:gap-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
          <span className="mx-1 hidden h-4 w-px shrink-0 bg-[var(--border)] sm:inline" aria-hidden />
          <ThemeToggle lightLabel={t("themeLight")} darkLabel={t("themeDark")} />
          <LocaleSwitch locale={locale} />
          <a
            href={`/api/rss?locale=${locale}`}
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
            rel="noopener noreferrer"
          >
            {t("rss")}
          </a>
        </nav>
      </div>
    </header>
  );
}
