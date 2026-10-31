import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { HeaderNav } from "./HeaderNav";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";

type Props = { locale: string };

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const tr = locale === "tr";
  const items = [
    { href: "/blog", label: t("blog") },
    { href: "/about", label: t("about") },
    { href: "/consulting", label: t("consulting") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Tayfun Türkmen"
          className="flex shrink-0 items-center gap-2.5 text-[var(--text)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" aria-hidden className="h-7 w-auto">
            <polygon points="6,15 80,15 75,22 13,22" fill="currentColor"/>
            <polygon points="84,15 97,15 92,22 79,22" fill="var(--accent)"/>
            <path d="M 15,30 L 42,30 Q 46,30 46,34 L 46,85 L 39,92 L 39,37 L 15,37 Z" fill="currentColor"/>
            <path d="M 85,30 L 58,30 Q 54,30 54,34 L 54,85 L 61,92 L 61,37 L 85,37 Z" fill="currentColor"/>
          </svg>
          <span className="hidden text-[0.8rem] font-semibold uppercase leading-none tracking-[0.22em] min-[360px]:inline">
            Tayfun Türkmen
          </span>
        </Link>

        <div className="hidden min-w-0 md:block">
          <HeaderNav items={items} label={tr ? "Ana menü" : "Main menu"} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle lightLabel={t("themeLight")} darkLabel={t("themeDark")} />
          <LocaleSwitch locale={locale} />
          <Link href="/contact" className="btn-primary hidden min-h-9 px-3.5 py-1.5 sm:inline-flex">
            {tr ? "İletişim" : "Contact"}
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-2 py-1.5 md:hidden">
        <HeaderNav
          items={[...items, { href: "/contact", label: tr ? "İletişim" : "Contact" }]}
          label={tr ? "Ana menü" : "Main menu"}
        />
      </div>
    </header>
  );
}
