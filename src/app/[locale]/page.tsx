import { BlogCard } from "@/components/BlogCard";
import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: `Tayfun Türkmen | ${locale === "tr" ? "Web Tasarım • Yapay Zekâ • Veri • Ağlar" : "Web Design • AI • Data • Networking"}`,
    description: t("description"),
    alternates: { canonical: `/${locale}`, languages: { en: "/en", tr: "/tr" } },
  };
}

const portfolioItems = [
  { name: "Prof. Dr. Ali Ayyıldız", logo: "/profdraliayyildiz.png", link: "https://www.profdraliayyildiz.com" },
  { name: "AAIC LTD", logo: "/aaicltd.png", link: "https://www.aaicltd.co.uk" },
  { name: "HPS Health", logo: "/hpshealth.png", link: "https://www.hpshealth.co.uk" },
  { name: "MediGoAcademy", logo: "/medigoacademy.png", link: "https://www.medigoacademy.com" },
  { name: "Sahibinden Konut Al", logo: "/sahibindenkonutal.png", link: "https://www.sahibindenkonutal.com" },
  { name: "Kitapol", logo: "/kitapol.png", link: "https://www.kitapol.com.tr" },
  { name: "Misyonum Sağlık", logo: "/misyonumsaglikvebeslenme.png", link: "https://www.misyonumsaglikvebeslenme.com" },
  { name: "Endova", logo: "/endova.png", link: "#" },
  { name: "Mintekder", logo: "/mintekder.png", link: "#" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = await getAllPosts(locale);
  const tr = locale === "tr";
  const latest = posts.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero — minimal, image-led */}
      <section className="relative isolate h-[clamp(16rem,32vh,24rem)] overflow-hidden border-b border-[var(--border)] bg-[var(--bg)] sm:h-[clamp(18rem,36vh,28rem)]">
        <Image
          src="/tayfun-turkmen-cover.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="select-none object-cover object-[50%_42%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-6 sm:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">
                {tr ? "Web · Güvenlik · Sistemler" : "Web · Security · Systems"}
              </p>
              <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Tayfun Türkmen
              </h1>
            </div>
            <nav
              aria-label={tr ? "Ana sayfa işlemleri" : "Homepage actions"}
              className="flex items-center gap-5 text-sm font-medium"
            >
              <a
                href="#portfolio"
                className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                {tr ? "Referanslar" : "Work"}
              </a>
              <Link
                href="/contact"
                className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
              >
                {tr ? "İletişim" : "Contact"}
              </Link>
            </nav>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="border-y border-[var(--border)] bg-[var(--chip)] px-4 py-12 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="brand-microcopy text-[0.68rem] font-semibold uppercase text-[var(--muted)]">
              {tr ? "ÖNE ÇIKAN İŞLER" : "SELECTED WORK"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
              {tr ? "Referanslar ve Çalışmalar" : "References & Work"}
            </h2>
            <p className="mt-4 text-[var(--muted)] max-w-2xl mx-auto">
              {tr ? "Geliştirdiğimiz kurumsal web siteleri ve dijital çözümler." : "Corporate websites and digital solutions we've developed."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 items-center justify-items-center gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {portfolioItems.map((item) => (
              <a
                key={item.name}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex aspect-[4/3] w-full items-center justify-center rounded-md border border-black/10 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[var(--accent)] hover:shadow-md sm:p-6"
              >
                <img
                  src={item.logo}
                  alt={item.name}
                  className="max-h-[72%] max-w-[82%] object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Insights (Blog) */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">
              {tr ? "Son yazılar" : "Latest Insights"}
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              {tr ? "Web teknolojileri ve yapay zekâ üzerine makaleler." : "Articles on web technologies and AI."}
            </p>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-[var(--accent)] hover:underline mb-2">
            {tr ? "Tümünü oku →" : "Read All →"}
          </Link>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
        </div>
      </section>
    </div>
  );
}
