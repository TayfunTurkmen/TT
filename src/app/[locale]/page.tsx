import { BlogCard } from "@/components/BlogCard";
import { LogoMarquee, type MarqueeLogo } from "@/components/LogoMarquee";
import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
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

const portfolioItems: MarqueeLogo[] = [
  { name: "Prof. Dr. Ali Ayyıldız", logo: "/profdraliayyildiz.png", link: "https://www.profdraliayyildiz.com" },
  { name: "AAIC LTD", logo: "/aaicltd.png", link: "https://www.aaicltd.co.uk" },
  { name: "HPS Health", logo: "/hpshealth.png", link: "https://www.hpshealth.co.uk" },
  { name: "MediGoAcademy", logo: "/medigoacademy.png", link: "https://www.medigoacademy.com" },
  { name: "Sende Konut Al", logo: "/sendekonutal.png", link: "https://www.sendekonutal.com/tr" },
  { name: "Kitapol", logo: "/kitapol.png", link: "https://www.kitapol.com.tr" },
  { name: "Misyonum Sağlık", logo: "/misyonumsaglikvebeslenme.png", link: "https://www.misyonumsaglikvebeslenme.com" },
  { name: "Endova", logo: "/endova.png" },
  { name: "Mintekder", logo: "/mintekder.png" },
];

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const services = [
  {
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
    title: { tr: "Web Tasarım", en: "Web Design" },
    body: {
      tr: "Hızlı, erişilebilir ve kurumsal kimliğe uygun web siteleri.",
      en: "Fast, accessible websites that fit your brand.",
    },
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: { tr: "Yapay Zekâ", en: "AI" },
    body: {
      tr: "İş akışlarını hızlandıran yapay zekâ entegrasyonları ve otomasyonlar.",
      en: "AI integrations and automations that speed up everyday work.",
    },
  },
  {
    icon: (
      <svg {...iconProps}>
        <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
        <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
      </svg>
    ),
    title: { tr: "Veri", en: "Data" },
    body: {
      tr: "Veriyi düzenleyen, raporlayan ve karar almayı kolaylaştıran sistemler.",
      en: "Systems that organize and report data for clearer decisions.",
    },
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: { tr: "Ağlar & Güvenlik", en: "Networking & Security" },
    body: {
      tr: "Sertleştirilmiş altyapı ve güvenlik öncelikli mimari.",
      en: "Hardened infrastructure and security-first architecture.",
    },
  },
];

function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent-ink)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h2>
      {lead ? <p className="mt-3 text-[var(--muted)] sm:text-[1.05rem]">{lead}</p> : null}
    </div>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = await getAllPosts(locale);
  const tr = locale === "tr";
  const lang = tr ? "tr" : "en";
  const latest = posts.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div aria-hidden className="hero-backdrop" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pt-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)] shadow-[var(--shadow-sm)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {tr ? "Web Tasarım · Yapay Zekâ · Veri · Ağlar" : "Web Design · AI · Data · Networking"}
          </p>
          <h1 className="mt-6 max-w-4xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
            {tr ? "Dijital deneyimler tasarlıyorum." : "Designing digital experiences."}
            <span className="block text-[var(--muted)]">
              {tr ? "Akıllı ve güvenli sistemler kuruyorum." : "Building smart, secure systems."}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {tr
              ? "Ben Tayfun Türkmen. Kurumsal web siteleri, yapay zekâ destekli çözümler ve güvenlik odaklı altyapılar geliştiriyorum."
              : "I'm Tayfun Türkmen. I build corporate websites, AI-powered solutions and security-first infrastructure."}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/contact" className="btn-primary">
              {tr ? "İletişime geç" : "Get in touch"}
              <span aria-hidden>→</span>
            </Link>
            <a href="#portfolio" className="btn-secondary">
              {tr ? "Referanslar" : "Selected work"}
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow={tr ? "Uzmanlık" : "Expertise"}
          title={tr ? "Neler yapıyorum" : "What I do"}
          lead={tr ? "Tasarımdan altyapıya, uçtan uca dijital çözümler." : "End-to-end digital work, from design to infrastructure."}
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div key={service.title.en} className="bg-[var(--bg)] p-6 sm:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--accent-ink)]">
                {service.icon}
              </span>
              <h3 className="mt-5 text-[0.95rem] font-semibold text-[var(--text)]">{service.title[lang]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{service.body[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* References */}
      <section id="portfolio" className="scroll-mt-16 border-y border-[var(--border)] bg-[var(--surface)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={tr ? "Referanslar" : "References"}
            title={tr ? "Birlikte çalıştığım markalar" : "Brands I've worked with"}
            lead={tr ? "Geliştirdiğim kurumsal web siteleri ve dijital çözümler." : "Corporate websites and digital solutions I've built."}
          />
        </div>
        <div className="mx-auto mt-10 max-w-6xl sm:px-6">
          <LogoMarquee items={portfolioItems} label={tr ? "Referans logoları" : "Client logos"} />
        </div>
      </section>

      {/* Latest posts */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Blog"
            title={tr ? "Son yazılar" : "Latest writing"}
            lead={tr ? "Web teknolojileri ve yapay zekâ üzerine notlar." : "Notes on web technologies and AI."}
          />
          <Link
            href="/blog"
            className="text-sm font-medium text-[var(--muted)] underline-offset-4 transition hover:text-[var(--text)] hover:underline"
          >
            {tr ? "Tüm yazılar →" : "All posts →"}
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="relative isolate overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-10 sm:px-12 sm:py-14">
          <div aria-hidden className="hero-backdrop" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                {tr ? "Aklınızda bir proje mi var?" : "Have a project in mind?"}
              </h2>
              <p className="mt-3 text-[var(--muted)]">
                {tr
                  ? "Web sitesi, yapay zekâ entegrasyonu veya teknik danışmanlık için konuşalım."
                  : "Let's talk about a website, an AI integration or technical consulting."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                {tr ? "İletişime geç" : "Get in touch"}
              </Link>
              <Link href="/consulting" className="btn-secondary">
                {tr ? "Danışmanlık" : "Consulting"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
