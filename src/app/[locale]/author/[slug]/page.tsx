import { BlogCard } from "@/components/BlogCard";
import { getAuthor } from "@/lib/cms";
import { getAllPosts } from "@/lib/posts";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const author = getAuthor(slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio[locale === "tr" ? "tr" : "en"],
    alternates: { canonical: `/${locale}/author/${slug}` },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const author = getAuthor(slug);
  if (!author) notFound();
  const safe = locale === "tr" ? "tr" : "en";
  const posts = (await getAllPosts(locale)).filter((post) => (post.author ?? "tayfun-turkmen") === slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-black text-white">{author.avatar}</div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text)]">{author.name}</h1>
            <p className="mt-1 font-semibold text-[var(--accent)]">{author.role[safe]}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">{author.bio[safe]}</p>
            <div className="mt-3 flex gap-2">
              {author.socials.map((social) => <a key={social.label} href={social.href} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text)]">{social.label}</a>)}
            </div>
          </div>
        </div>
      </header>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => <BlogCard key={post.slug} post={post} locale={locale} />)}
      </div>
    </div>
  );
}
