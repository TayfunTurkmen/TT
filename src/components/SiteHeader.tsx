import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";

type Props = { locale: string };

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] shadow-[0_1px_20px_rgba(24,24,27,0.04)] backdrop-blur-2xl">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:flex sm:h-[4.25rem] sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0">
        <div className="flex flex-1 items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-2 text-sm font-semibold text-[var(--text)] sm:gap-3 sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="h-8 w-auto text-[var(--text)] sm:h-9">
              <polygon points="6,15 80,15 75,22 13,22" fill="currentColor"/>
              <polygon points="84,15 97,15 92,22 79,22" fill="var(--accent)"/>
              <path d="M 15,30 L 42,30 Q 46,30 46,34 L 46,85 L 39,92 L 39,37 L 15,37 Z" fill="currentColor"/>
              <path d="M 85,30 L 58,30 Q 54,30 54,34 L 54,85 L 61,92 L 61,37 L 85,37 Z" fill="currentColor"/>
            </svg>
            <div className="flex flex-col items-start justify-center">
              <span className="leading-none font-semibold uppercase tracking-[0.18em] sm:tracking-[0.28em]">TAYFUN TÜRKMEN</span>
              <span className="brand-microcopy mt-1 hidden whitespace-nowrap text-[0.62rem] font-medium uppercase text-[var(--muted)] sm:block">
                {locale === "tr" ? "Web Tasarım • Yapay Zekâ • Veri • Ağlar" : "Web Design • AI • Data • Networking"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle lightLabel={t("themeLight")} darkLabel={t("themeDark")} />
            <LocaleSwitch locale={locale} />
          </div>
        </div>
        
        <div className="flex min-w-0 items-center gap-3">
          <nav className="mt-3 flex min-w-0 snap-x items-center gap-1 overflow-x-auto whitespace-nowrap text-[0.82rem] font-medium [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:mt-0 sm:justify-end sm:gap-1 [&::-webkit-scrollbar]:hidden">
            <Link
              href="/"
              className="shrink-0 snap-start rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
            >
              {t("home")}
            </Link>
            <Link
              href="/blog"
              className="shrink-0 snap-start rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
            >
              {t("blog")}
            </Link>
            <Link
              href="/about"
              className="shrink-0 snap-start rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              className="shrink-0 snap-start rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
            >
              {locale === "tr" ? "İletişim" : "Contact"}
            </Link>
          </nav>
          
          <div className="hidden items-center gap-1 border-l border-[var(--border)] pl-3 sm:flex">
            <ThemeToggle lightLabel={t("themeLight")} darkLabel={t("themeDark")} />
            <LocaleSwitch locale={locale} />
            <a
              href={`/api/rss?locale=${locale}`}
              className="shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
              rel="noopener noreferrer"
              aria-label="RSS Feed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
