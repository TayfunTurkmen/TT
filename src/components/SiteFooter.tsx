import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { categories } from "@/lib/cms";

type Props = { locale: string };

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--footer-bg)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 text-sm text-[var(--muted)] sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-semibold text-[var(--text)]">Tayfun Türkmen</p>
          <p className="mt-2">© {new Date().getFullYear()} - {t("rights")}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed">{t("built")}</p>
        </div>
        <nav className="grid gap-2">
          <p className="text-xs font-semibold uppercase text-[var(--text)]">
            {locale === "tr" ? "Kategoriler" : "Categories"}
          </p>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="hover:text-[var(--accent)]">
              {category.title[locale === "tr" ? "tr" : "en"]}
            </Link>
          ))}
        </nav>
        <nav className="grid gap-2">
          <p className="text-xs font-semibold uppercase text-[var(--text)]">
            {locale === "tr" ? "Sayfalar" : "Pages"}
          </p>
          <Link href="/about" className="hover:text-[var(--accent)]">{locale === "tr" ? "Hakkımda" : "About"}</Link>
          <Link href="/contact" className="hover:text-[var(--accent)]">{locale === "tr" ? "İletişim" : "Contact"}</Link>
          <Link href="/privacy-policy" className="hover:text-[var(--accent)]">{locale === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}</Link>
          <Link href="/cookie-policy" className="hover:text-[var(--accent)]">{locale === "tr" ? "Çerez Politikası" : "Cookie Policy"}</Link>
          <Link href="/terms" className="hover:text-[var(--accent)]">{locale === "tr" ? "Kullanım Şartları" : "Terms"}</Link>
        </nav>
      </div>
    </footer>
  );
}
