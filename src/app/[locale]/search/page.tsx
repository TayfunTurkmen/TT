import { BlogCard } from "@/components/BlogCard";
import { getAllPosts } from "@/lib/posts";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "tr" ? "Arama" : "Search", alternates: { canonical: `/${locale}/search` } };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  const tr = locale === "tr";
  const needle = q.toLowerCase().trim();
  const posts = await getAllPosts(locale);
  const results = needle
    ? posts.filter((post) => `${post.title} ${post.excerpt ?? ""} ${post.content} ${post.category ?? ""} ${(post.tags ?? []).join(" ")}`.toLowerCase().includes(needle))
    : [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">{tr ? "Arama" : "Search"}</h1>
      <form className="mt-5 flex max-w-2xl gap-2">
        <input name="q" defaultValue={q} placeholder={tr ? "Ne arıyorsunuz?" : "What are you looking for?"} className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm" />
        <button className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">{tr ? "Ara" : "Search"}</button>
      </form>
      {needle && results.length === 0 ? (
        <section className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-6">
          <p className="font-bold text-[var(--text)]">{tr ? "Sonuç yok" : "No results"}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{tr ? "Popüler aramalar: SEO, güvenlik, performans." : "Popular searches: SEO, security, performance."}</p>
        </section>
      ) : null}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
      </div>
    </div>
  );
}
