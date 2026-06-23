import { BlogCard } from "@/components/BlogCard";
import { getAllPosts } from "@/lib/posts";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return {
    title: `#${slug}`,
    description: `Posts tagged ${slug}`,
    alternates: { canonical: `/${locale}/tag/${slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const posts = (await getAllPosts(locale)).filter((post) => post.tags?.includes(slug));
  const tr = locale === "tr";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">{tr ? "Etiket" : "Tag"}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">#{slug}</h1>
      </header>
      {posts.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-5 text-[var(--muted)]">
          {tr ? "Bu etikete ait yazı bulunamadı." : "No posts found for this tag."}
        </p>
      )}
    </div>
  );
}
