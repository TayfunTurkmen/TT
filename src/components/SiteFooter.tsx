import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { paymentLogoBand, seller } from "@/lib/business";
import { categories } from "@/lib/cms";
import { LINKEDIN_PROFILE_URL } from "@/lib/social";

type Props = { locale: string };

const linkClass = "text-[var(--muted)] transition-colors hover:text-[var(--text)]";
const headingClass = "mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text)]";

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tr = locale === "tr";

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--footer-bg)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-[var(--text)]">Tayfun Türkmen</p>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">
            {tr ? "Web tasarım, yapay zekâ, veri ve ağ sistemleri." : "Web design, AI, data and network systems."}
          </p>
          {seller.address || seller.phone || seller.email ? (
            <address className="mt-4 space-y-1 not-italic leading-relaxed text-[var(--muted)]">
              {seller.address ? <p>{seller.address}</p> : null}
              {seller.phone ? (
                <p>
                  <a href={`tel:${seller.phone.replace(/\s+/g, "")}`} className={linkClass}>
                    {seller.phone}
                  </a>
                </p>
              ) : null}
              {seller.email ? (
                <p>
                  <a href={`mailto:${seller.email}`} className={linkClass}>
                    {seller.email}
                  </a>
                </p>
              ) : null}
            </address>
          ) : null}
          <div className="mt-5 flex items-center gap-2">
            <a
              href={LINKEDIN_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>
            <a
              href={`/api/rss?locale=${locale}`}
              aria-label="RSS"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 11a9 9 0 0 1 9 9" />
                <path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" />
              </svg>
            </a>
          </div>
        </div>
        <nav className="grid content-start gap-2.5">
          <p className={headingClass}>{tr ? "Kategoriler" : "Categories"}</p>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className={linkClass}>
              {category.title[tr ? "tr" : "en"]}
            </Link>
          ))}
        </nav>
        <nav className="grid content-start gap-2.5">
          <p className={headingClass}>{tr ? "Sayfalar" : "Pages"}</p>
          <Link href="/about" className={linkClass}>{tr ? "Hakkımda" : "About"}</Link>
          <Link href="/consulting" className={linkClass}>{tr ? "Danışmanlık" : "Consulting"}</Link>
          <Link href="/blog" className={linkClass}>Blog</Link>
          <Link href="/contact" className={linkClass}>{tr ? "İletişim" : "Contact"}</Link>
        </nav>
        <nav className="grid content-start gap-2.5">
          <p className={headingClass}>{tr ? "Yasal" : "Legal"}</p>
          <Link href="/distance-sales-agreement" className={linkClass}>{tr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement"}</Link>
          <Link href="/pre-information" className={linkClass}>{tr ? "Ön Bilgilendirme Formu" : "Pre-Information Form"}</Link>
          <Link href="/cancellation-refund" className={linkClass}>{tr ? "İptal ve İade Koşulları" : "Cancellation & Refunds"}</Link>
          <Link href="/privacy-policy" className={linkClass}>{tr ? "Gizlilik Politikası" : "Privacy Policy"}</Link>
          <Link href="/cookie-policy" className={linkClass}>{tr ? "Çerez Politikası" : "Cookie Policy"}</Link>
          <Link href="/terms" className={linkClass}>{tr ? "Kullanım Şartları" : "Terms"}</Link>
        </nav>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 text-xs text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Tayfun Türkmen. {t("rights")}</p>
          <div className="flex flex-wrap items-center gap-2" aria-label={tr ? "Güvenli ödeme" : "Secure payment"}>
            <span className="mr-1 inline-flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {tr ? "Güvenli ödeme" : "Secure payment"}
            </span>
            {paymentLogoBand ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paymentLogoBand} alt="iyzico ile Öde · Visa · Mastercard · Troy" className="h-6 w-auto" />
            ) : (
              ["iyzico ile Öde", "Visa", "Mastercard", "Troy", "American Express"].map((brand) => (
                <span key={brand} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 font-medium text-[var(--text)]">
                  {brand}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
