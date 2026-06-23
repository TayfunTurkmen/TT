import { BlogCard } from "@/components/BlogCard";
import { BlogSidebar } from "@/components/BlogSidebar";
import { categories } from "@/lib/cms";
import { getPublicSiteSettings } from "@/lib/d1";
import { getAllPosts } from "@/lib/posts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; tag?: string; q?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: `/${locale}/blog` },
  };
}

export default async function BlogIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const settings = await getPublicSiteSettings();
  const tr = locale === "tr";
  const allPosts = await getAllPosts(locale);
  const q = (query.q ?? "").toLowerCase().trim();
  const filtered = allPosts
    .filter((post) => !query.category || post.category === query.category)
    .filter((post) => !query.tag || post.tags?.includes(query.tag))
    .filter((post) => {
      if (!q) return true;
      return `${post.title} ${post.excerpt ?? ""} ${post.content} ${(post.tags ?? []).join(" ")}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (query.sort === "popular" || query.sort === "views") return (b.views ?? 0) - (a.views ?? 0);
      return a.date < b.date ? 1 : -1;
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg leading-8 text-[var(--muted)]">{t("subtitle")}</p>
      </header>

      <form className="mt-8 grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4 md:grid-cols-[1fr_180px_160px_150px]">
        <input name="q" defaultValue={query.q ?? ""} placeholder={tr ? "Yazılarda ara" : "Search posts"} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
        <select name="category" defaultValue={query.category ?? ""} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]">
          <option value="">{tr ? "Tüm kategoriler" : "All categories"}</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.title[tr ? "tr" : "en"]}</option>)}
        </select>
        <input name="tag" defaultValue={query.tag ?? ""} placeholder={tr ? "Etiket" : "Tag"} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
        <select name="sort" defaultValue={query.sort ?? "new"} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]">
          <option value="new">{tr ? "Yeni" : "Newest"}</option>
          <option value="popular">{tr ? "Popüler" : "Popular"}</option>
          <option value="views">{tr ? "En çok okunan" : "Most read"}</option>
        </select>
        <button className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white md:col-span-4">
          {tr ? "Filtrele" : "Filter"}
        </button>
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-8">
              <p className="font-bold text-[var(--text)]">{tr ? "Sonuç bulunamadı" : "No results found"}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{tr ? "Aramayı genişletmeyi veya popüler yazılara bakmayı deneyin." : "Try a broader search or browse popular posts."}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {filtered.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
            </div>
          )}
          <nav className="mt-8 flex justify-center gap-2 text-sm text-[var(--muted)]" aria-label="Pagination">
            <span className="rounded-md border border-[var(--border)] px-3 py-2">1</span>
          </nav>
        </section>
        <BlogSidebar locale={locale} posts={allPosts} adsenseClient={settings.adsenseClient} adSlot={settings.adSlotBlogList} />
      </div>
    </div>
  );
}
