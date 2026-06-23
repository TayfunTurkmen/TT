import type { Post } from "@/lib/posts";

export type LocaleCode = "en" | "tr";

export type Category = {
  slug: string;
  title: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
  seoTitle: Record<LocaleCode, string>;
  seoDescription: Record<LocaleCode, string>;
};

export type Author = {
  slug: string;
  name: string;
  role: Record<LocaleCode, string>;
  bio: Record<LocaleCode, string>;
  avatar: string;
  socials: Array<{ label: string; href: string }>;
};

export type DemoPost = Post & {
  category: string;
  author: string;
  updatedAt: string;
  readingMinutes: number;
  views: number;
  featuredImage: string;
  status: "published";
};

export const categories: Category[] = [
  {
    slug: "web-development",
    title: { en: "Web Development", tr: "Web Geliştirme" },
    description: {
      en: "Practical notes on frontend, backend, architecture, and maintainable product engineering.",
      tr: "Frontend, backend, mimari ve sürdürülebilir ürün geliştirme üzerine pratik notlar.",
    },
    seoTitle: { en: "Web Development Articles", tr: "Web Geliştirme Yazıları" },
    seoDescription: {
      en: "Performance, architecture, React, Next.js, and production web development articles.",
      tr: "Performans, mimari, React, Next.js ve üretim ortamı web geliştirme yazıları.",
    },
  },
  {
    slug: "cybersecurity",
    title: { en: "Cybersecurity", tr: "Siber Güvenlik" },
    description: {
      en: "Security-first engineering, threat modeling, hardening, and safer application delivery.",
      tr: "Güvenlik odaklı mühendislik, tehdit modelleme, sıkılaştırma ve güvenli uygulama teslimi.",
    },
    seoTitle: { en: "Cybersecurity Field Notes", tr: "Siber Güvenlik Notları" },
    seoDescription: {
      en: "Actionable cybersecurity articles for developers and technical site owners.",
      tr: "Geliştiriciler ve teknik site sahipleri için uygulanabilir siber güvenlik yazıları.",
    },
  },
  {
    slug: "seo",
    title: { en: "SEO", tr: "SEO" },
    description: {
      en: "Search-friendly publishing, structured data, internal linking, and content quality.",
      tr: "Arama uyumlu yayıncılık, yapılandırılmış veri, iç linkleme ve içerik kalitesi.",
    },
    seoTitle: { en: "SEO and Content Strategy", tr: "SEO ve İçerik Stratejisi" },
    seoDescription: {
      en: "SEO-first blog operations without sacrificing reader experience.",
      tr: "Okur deneyiminden ödün vermeyen SEO odaklı blog operasyonları.",
    },
  },
  {
    slug: "performance",
    title: { en: "Performance", tr: "Performans" },
    description: {
      en: "Core Web Vitals, image strategy, caching, and fast editorial interfaces.",
      tr: "Core Web Vitals, görsel stratejisi, cache ve hızlı editoryal arayüzler.",
    },
    seoTitle: { en: "Web Performance Guides", tr: "Web Performans Rehberleri" },
    seoDescription: {
      en: "Guides for faster loading, stable layouts, and better Lighthouse scores.",
      tr: "Daha hızlı yükleme, stabil layout ve daha iyi Lighthouse skorları için rehberler.",
    },
  },
  {
    slug: "personal-notes",
    title: { en: "Personal Notes", tr: "Kişisel Notlar" },
    description: {
      en: "Career notes, tool choices, and durable lessons from day-to-day technical work.",
      tr: "Kariyer notları, araç tercihleri ve günlük teknik işlerden kalıcı dersler.",
    },
    seoTitle: { en: "Personal Technology Notes", tr: "Kişisel Teknoloji Notları" },
    seoDescription: {
      en: "Personal essays on software, security, learning, and sustainable technical work.",
      tr: "Yazılım, güvenlik, öğrenme ve sürdürülebilir teknik çalışma üzerine kişisel yazılar.",
    },
  },
];

export const authors: Author[] = [
  {
    slug: "tayfun-turkmen",
    name: "Tayfun Türkmen",
    role: {
      en: "Cyber Security | Full Stack Developer",
      tr: "Siber Güvenlik | Full-Stack Geliştirici",
    },
    bio: {
      en: "I write about secure web development, practical automation, SEO-ready publishing, and the engineering choices behind resilient products.",
      tr: "Güvenli web geliştirme, pratik otomasyon, SEO uyumlu yayıncılık ve dayanıklı ürünlerin arkasındaki mühendislik kararları üzerine yazıyorum.",
    },
    avatar: "TT",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "GitHub", href: "https://github.com/" },
    ],
  },
];

const enBodies = [
  "A durable personal blog starts with trust signals: clear navigation, useful author pages, policies that are easy to find, and articles that answer a real question. The technical stack matters, but the publishing discipline matters more.\n\n## A practical baseline\n\nKeep the layout readable, make categories understandable, and avoid empty archive pages. Search engines and readers both reward sites that make intent obvious.\n\n## Operational checklist\n\n- Publish original posts with a clear point of view\n- Keep policy pages visible in the footer\n- Separate advertising from editorial content\n- Review internal links before publishing",
  "Security-first blogging is less about adding a badge and more about reducing avoidable risk. Admin sessions should be short-lived, uploads should be constrained, and forms should have rate limits plus spam protection.\n\n## Admin surface\n\nTreat the CMS as a privileged product. Use role-aware actions, store only hashed passwords, and keep dangerous operations explicit.\n\n## Reader surface\n\nSanitize rendered content, use HTTPS, set conservative headers, and never let embeds bypass your content rules.",
  "Core Web Vitals are editorial infrastructure. A blog that shifts around while ads load feels cheap even when the writing is excellent. Reserve ad space, lazy-load below-the-fold media, and keep fonts predictable.\n\n## Stable ad containers\n\nAd containers should have a minimum height and a visible label. This reduces layout shift and helps users distinguish ads from content.\n\n## Image strategy\n\nUse modern formats, write meaningful alt text, and avoid oversized hero images on list pages.",
  "A useful SEO workflow starts before the article is written. Pick one primary question, draft the H1 around the human topic, and let metadata summarize the promise without stuffing keywords.\n\n## Structure\n\nUse one H1, descriptive H2 sections, breadcrumbs, canonical URLs, and schema where it helps machines understand the page.\n\n## Quality\n\nThin pages do not become valuable because they have metadata. The article still has to help.",
  "A block editor should make the common path faster without hiding the source of truth. Markdown remains portable, while blocks give authors a friendlier drafting surface.\n\n## Useful blocks\n\nHeadings, paragraphs, images, quotes, code, tables, FAQ, callouts, and ad slots cover most editorial needs.\n\n## Guardrails\n\nThe editor should preview reading time, table of contents, SEO fields, and missing alt text before publish.",
  "Related posts work best when they combine topic overlap with recency. A simple algorithm can score category match, shared tags, and freshness without introducing a heavy recommendation system.\n\n## Editorial value\n\nRelated links keep readers moving through useful material and help search engines discover deeper pages.\n\n## Implementation\n\nStart simple, measure clicks, and tune the scoring only when the site has enough traffic.",
  "A newsletter form is a trust moment. Ask for only the email address, explain the purpose, and include a consent checkbox for privacy compliance.\n\n## Integration options\n\nMailchimp, Brevo, and Resend all fit a small blog. Keep the local subscriber list exportable so the owner is not locked in.\n\n## Deliverability\n\nUse double opt-in when possible and make unsubscribe paths obvious.",
  "A good search page is not just an input field. It should search titles, excerpts, content, categories, and tags, then offer helpful suggestions when nothing matches.\n\n## Empty states\n\nNo-result pages should point readers to popular posts or broad categories instead of ending the journey.\n\n## Performance\n\nFor a small blog, server-side filtering is enough. Add a dedicated search index only when content volume demands it.",
  "Cookie consent should be understandable. Readers need clear choices for necessary, analytics, and advertising cookies before tracking scripts run.\n\n## Preference model\n\nStore preferences locally, expose a reset option, and make the policy page easy to reach.\n\n## AdSense readiness\n\nDo not promise approval. Build a clean, transparent site that respects policies and user experience.",
  "A personal blog becomes memorable when it has a consistent editorial voice. Categories organize the site, but the author page gives the work context.\n\n## Author trust\n\nA real bio, social links, and topic focus help readers understand why the site exists.\n\n## Long-term publishing\n\nUpdate older posts, keep redirects clean, and avoid leaving unfinished pages indexed.",
];

const trBodies = [
  "Dayanıklı bir kişisel blog güven sinyalleriyle başlar: anlaşılır gezinme, faydalı yazar sayfaları, kolay bulunan politika metinleri ve gerçek bir soruya yanıt veren yazılar. Teknik yığın önemlidir, fakat yayın disiplini daha da önemlidir.\n\n## Pratik temel\n\nOkunabilir düzen kur, kategorileri anlaşılır yap ve boş arşiv sayfalarını yayında bırakma. Hem arama motorları hem okurlar niyeti net olan siteleri sever.\n\n## Operasyon listesi\n\n- Net bakış açısı olan özgün yazılar yayınla\n- Politika sayfalarını footer içinde görünür tut\n- Reklamı editoryal içerikten ayır\n- Yayından önce iç linkleri kontrol et",
  "Güvenlik odaklı blog, bir rozet eklemekten çok kaçınılabilir riskleri azaltmakla ilgilidir. Yönetici oturumları kısa ömürlü olmalı, yüklemeler sınırlandırılmalı, formlar hız sınırı ve spam koruması taşımalıdır.\n\n## Yönetici yüzeyi\n\nCMS tarafını ayrıcalıklı bir ürün gibi düşün. Rol bazlı işlemler kullan, şifreleri yalnızca hash olarak sakla ve riskli işlemleri açık hale getir.\n\n## Okur yüzeyi\n\nRender edilen içeriği temizle, HTTPS kullan, güvenli başlıklar ayarla ve gömülü içeriklerin kuralları aşmasına izin verme.",
  "Core Web Vitals editoryal altyapının parçasıdır. Reklamlar yüklenirken zıplayan bir blog, yazı iyi olsa bile ucuz hissettirir. Reklam alanını önceden ayır, aşağıdaki görselleri lazy-load et ve fontları öngörülebilir tut.\n\n## Stabil reklam konteynerleri\n\nReklam alanları minimum yüksekliğe ve görünür etikete sahip olmalıdır. Bu yaklaşım CLS riskini azaltır ve reklamı içerikten ayırır.\n\n## Görsel stratejisi\n\nModern formatlar kullan, anlamlı alt metin yaz ve liste sayfalarında gereksiz büyük hero görsellerden kaçın.",
  "Faydalı SEO akışı yazı yazılmadan önce başlar. Bir ana soru seç, H1'i insanın aradığı konuya göre kur ve metadata alanlarını anahtar kelime doldurmadan vaadi özetlemek için kullan.\n\n## Yapı\n\nTek H1, açıklayıcı H2 başlıkları, breadcrumb, canonical URL ve gerektiği yerde schema kullan.\n\n## Kalite\n\nZayıf sayfalar metadata sayesinde değerli olmaz. Yazının gerçekten yardımcı olması gerekir.",
  "Blok editör ortak yolu hızlandırmalı ama gerçeğin kaynağını gizlememelidir. Markdown taşınabilir kalır; bloklar ise yazara daha rahat taslak deneyimi verir.\n\n## Faydalı bloklar\n\nBaşlık, paragraf, görsel, alıntı, kod, tablo, FAQ, callout ve reklam blokları çoğu editoryal ihtiyacı karşılar.\n\n## Koruma çizgileri\n\nEditör yayın öncesi okuma süresi, içindekiler, SEO alanları ve eksik alt text uyarılarını göstermelidir.",
  "Benzer yazılar en iyi konu örtüşmesi ile güncelliği birlikte kullandığında çalışır. Basit bir algoritma kategori eşleşmesi, ortak etiketler ve tazelik üzerinden puan verebilir.\n\n## Editoryal değer\n\nBenzer bağlantılar okuru faydalı içerikte tutar ve arama motorlarının derin sayfaları keşfetmesine yardım eder.\n\n## Uygulama\n\nBasit başla, tıklamaları ölç ve yalnızca yeterli trafik oluştuğunda puanlamayı iyileştir.",
  "Bülten formu bir güven anıdır. Yalnızca e-posta iste, amacı açıkla ve KVKK/GDPR uyumu için onay kutusu ekle.\n\n## Entegrasyon seçenekleri\n\nMailchimp, Brevo ve Resend küçük bir blog için uygundur. Site sahibi bağımlı kalmasın diye yerel abone listesi dışa aktarılabilir olmalıdır.\n\n## Teslim edilebilirlik\n\nMümkünse çift onay kullan ve abonelikten çıkış yolunu açık tut.",
  "İyi arama sayfası sadece giriş alanı değildir. Başlık, özet, içerik, kategori ve etiketlerde arama yapmalı; sonuç yoksa faydalı öneriler sunmalıdır.\n\n## Boş durumlar\n\nSonuçsuz sayfalar yolculuğu bitirmek yerine popüler yazılara veya geniş kategorilere yönlendirmelidir.\n\n## Performans\n\nKüçük blog için sunucu tarafı filtreleme yeterlidir. İçerik hacmi artınca ayrı arama indeksi eklenebilir.",
  "Çerez onayı anlaşılır olmalıdır. Okur, izleme scriptleri çalışmadan önce zorunlu, analiz ve reklam çerezleri için net tercihler yapabilmelidir.\n\n## Tercih modeli\n\nTercihleri yerelde sakla, sıfırlama seçeneği sun ve politika sayfasını kolay erişilebilir yap.\n\n## AdSense hazırlığı\n\nOnay garantisi verilmez. Politikaları ve kullanıcı deneyimini önemseyen temiz, şeffaf bir site kurulur.",
  "Kişisel blog tutarlı bir editoryal sesle akılda kalır. Kategoriler siteyi düzenler; yazar sayfası ise çalışmanın bağlamını verir.\n\n## Yazar güveni\n\nGerçek biyografi, sosyal bağlantılar ve konu odağı okurun sitenin neden var olduğunu anlamasına yardım eder.\n\n## Uzun vadeli yayın\n\nEski yazıları güncelle, yönlendirmeleri temiz tut ve tamamlanmamış sayfaları indekse açık bırakma.",
];

const postSeeds = [
  ["wordpress-like-personal-blog", "Building a WordPress-like Personal Blog Without the Bloat", "WordPress benzeri şişkin olmayan kişisel blog kurmak", "web-development", ["cms", "nextjs", "blog"]],
  ["security-first-blog-admin", "Security Checklist for a Personal Blog Admin Panel", "Kişisel blog admin paneli için güvenlik listesi", "cybersecurity", ["security", "admin", "xss"]],
  ["adsense-ready-layout", "AdSense-ready Layouts Without Hurting Readers", "Okuru yormayan AdSense uyumlu düzenler", "seo", ["adsense", "ux", "policy"]],
  ["core-web-vitals-editorial-sites", "Core Web Vitals for Editorial Websites", "Editoryal siteler için Core Web Vitals", "performance", ["performance", "lighthouse", "images"]],
  ["seo-publishing-workflow", "A Practical SEO Publishing Workflow", "Pratik SEO yayın akışı", "seo", ["seo", "schema", "metadata"]],
  ["block-editor-design", "Designing a Useful Block Editor", "Kullanışlı blok editör tasarlamak", "web-development", ["editor", "markdown", "cms"]],
  ["related-posts-algorithm", "A Simple Related Posts Algorithm", "Basit benzer yazılar algoritması", "web-development", ["related-posts", "internal-links", "content"]],
  ["newsletter-consent", "Newsletter Forms with Consent Built In", "Onay akışı olan bülten formları", "personal-notes", ["newsletter", "gdpr", "kvkk"]],
  ["site-search-empty-states", "Search Pages and Helpful Empty States", "Arama sayfaları ve faydalı boş durumlar", "performance", ["search", "ux", "empty-state"]],
  ["cookie-consent-blog", "Cookie Consent That Readers Understand", "Okurun anlayacağı çerez onayı", "cybersecurity", ["cookies", "privacy", "analytics"]],
] as const;

export function getDemoPosts(locale: string): DemoPost[] {
  const safeLocale: LocaleCode = locale === "tr" ? "tr" : "en";
  return postSeeds.map(([slug, enTitle, trTitle, category, tags], index) => {
    const title = safeLocale === "tr" ? trTitle : enTitle;
    const content = safeLocale === "tr" ? trBodies[index] : enBodies[index];
    const date = new Date(Date.UTC(2026, 4, 20 - index)).toISOString().slice(0, 10);
    const excerpt =
      safeLocale === "tr"
        ? `${title} için uygulanabilir, SEO uyumlu ve güvenlik odaklı bir rehber.`
        : `A practical, SEO-friendly, security-aware guide for ${title.toLowerCase()}.`;
    return {
      slug,
      locale: safeLocale,
      title,
      date,
      updatedAt: date,
      excerpt,
      tags: [...tags],
      content,
      seoTitle: title,
      seoDescription: excerpt,
      category,
      author: "tayfun-turkmen",
      readingMinutes: Math.max(3, Math.ceil(content.split(/\s+/).length / 180)),
      views: 2400 - index * 137,
      featuredImage: `demo-${index + 1}`,
      status: "published",
    };
  });
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug) ?? null;
}

export function getAuthor(slug: string) {
  return authors.find((author) => author.slug === slug) ?? null;
}

export function localizeCategory(slug: string, locale: string) {
  const category = getCategory(slug);
  const safeLocale: LocaleCode = locale === "tr" ? "tr" : "en";
  return category?.title[safeLocale] ?? slug;
}

export function estimateReadingMinutes(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 180));
}

export function extractHeadings(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      depth: match[1].length,
      title: match[2].trim(),
      id: match[2]
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
}

export function scoreRelatedPosts(post: Post, allPosts: Post[]) {
  const tags = new Set(post.tags ?? []);
  return allPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const sharedTags = (candidate.tags ?? []).filter((tag) => tags.has(tag)).length;
      const categoryScore =
        "category" in candidate && "category" in post && candidate.category === post.category ? 3 : 0;
      return { post: candidate, score: sharedTags + categoryScore };
    })
    .sort((a, b) => b.score - a.score || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, 3)
    .map((item) => item.post);
}
