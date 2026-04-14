import { MarkdownContent } from "@/components/MarkdownContent";
import { Link, routing } from "@/i18n/routing";
import { getAllSlugs, getPost } from "@/lib/posts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of getAllSlugs(locale)) {
      out.push({ locale, slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = getPost(locale, slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link
        href="/blog"
        className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {t("back")}
      </Link>
      <header className="mt-8">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
          {post.date}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
          {post.title}
        </h1>
        {post.tags && post.tags.length > 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            {t("topics")}: {post.tags.join(" · ")}
          </p>
        ) : null}
      </header>
      <div className="mt-10">
        <MarkdownContent markdown={post.content} />
      </div>
    </article>
  );
}
