import { BlogCard } from "@/components/BlogCard";
import { categories, getCategory } from "@/lib/cms";
import { getAllPosts } from "@/lib/posts";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return categories.flatMap((category) => ["en", "tr"].map((locale) => ({ locale, slug: category.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const safe = locale === "tr" ? "tr" : "en";
  return {
    title: category.seoTitle[safe],
    description: category.seoDescription[safe],
    alternates: { canonical: `/${locale}/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = getCategory(slug);
  if (!category) notFound();
  const safe = locale === "tr" ? "tr" : "en";
  const posts = (await getAllPosts(locale)).filter((post) => post.category === slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">{safe === "tr" ? "Kategori" : "Category"}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">{category.title[safe]}</h1>
        <p className="mt-3 text-lg leading-8 text-[var(--muted)]">{category.description[safe]}</p>
      </header>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
      </div>
    </div>
  );
}
