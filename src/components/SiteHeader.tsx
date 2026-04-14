import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LocaleSwitch } from "./LocaleSwitch";

type Props = { locale: string };

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <header className="border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--text)]"
        >
          <span className="text-[var(--accent)]">⟨</span>
          <span className="transition-colors group-hover:text-[var(--accent)]">
            Tayfun Türkmen
          </span>
          <span className="text-[var(--accent)]">⟩</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("home")}
          </Link>
          <Link
            href="/blog"
            className="rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("blog")}
          </Link>
          <Link
            href="/about"
            className="rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
          >
            {t("about")}
          </Link>
          <Link
            href="/studio"
            className="hidden rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)] sm:inline"
          >
            {t("studio")}
          </Link>
          <span className="mx-1 hidden h-4 w-px bg-[var(--border)] sm:inline" aria-hidden />
          <LocaleSwitch locale={locale} />
          <a
            href={`/api/rss?locale=${locale}`}
            className="rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
            rel="noopener noreferrer"
          >
            {t("rss")}
          </a>
        </nav>
      </div>
    </header>
  );
}
