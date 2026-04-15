import { AdSlot } from "@/components/AdSlot";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Link } from "@/i18n/routing";
import { getPublicSiteSettings } from "@/lib/d1";
import { getPost } from "@/lib/posts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) return {};
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? post.title;
  const canonicalPath = `/${locale}/blog/${slug}`;
  const canonical = `https://tayfunturkmen.com${canonicalPath}`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: "Tayfun Türkmen",
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getPost(locale, slug);
  const settings = await getPublicSiteSettings();
  if (!post) notFound();
  const canonical = `https://tayfunturkmen.com/${locale}/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? post.title,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: "Tayfun Türkmen",
    },
    publisher: {
      "@type": "Person",
      name: "Tayfun Türkmen",
    },
    mainEntityOfPage: canonical,
    url: canonical,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
      <div className="mt-10">
        <AdSlot
          client={settings.adsenseClient}
          slot={settings.adSlotBlogPost}
          format="auto"
        />
      </div>
    </article>
  );
}
