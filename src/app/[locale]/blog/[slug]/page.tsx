import { AdSlot } from "@/components/AdSlot";
import { BlogCard } from "@/components/BlogCard";
import { BlogSidebar } from "@/components/BlogSidebar";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Link } from "@/i18n/routing";
import { estimateReadingMinutes, extractHeadings, getAuthor, localizeCategory, scoreRelatedPosts } from "@/lib/cms";
import { getPublicSiteSettings } from "@/lib/d1";
import { getAllPosts, getPost } from "@/lib/posts";
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
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/blog/${slug}` },
    openGraph: { type: "article", title, description, url: `https://tayfunturkmen.com/${locale}/blog/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

function injectInArticleAds(markdown: string, adMarker: string) {
  const paragraphs = markdown.split(/\n\n+/);
  if (paragraphs.length < 3) return markdown;
  const first = [...paragraphs];
  first.splice(1, 0, adMarker);
  first.splice(Math.floor(first.length / 2), 0, adMarker);
  return first.join("\n\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getPost(locale, slug);
  if (!post) notFound();
  const settings = await getPublicSiteSettings();
  const posts = await getAllPosts(locale);
  const headings = extractHeadings(post.content);
  const related = scoreRelatedPosts(post, posts);
  const author = getAuthor(post.author ?? "tayfun-turkmen");
  const tr = locale === "tr";
  const readingMinutes = post.readingMinutes ?? estimateReadingMinutes(post.content);
  const canonical = `https://tayfunturkmen.com/${locale}/blog/${slug}`;
  const imageIsUrl = post.featuredImage?.startsWith("http") || post.featuredImage?.startsWith("/");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? post.title,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    inLanguage: locale,
    author: { "@type": "Person", name: author?.name ?? "Tayfun Türkmen" },
    publisher: { "@type": "Person", name: "Tayfun Türkmen" },
    mainEntityOfPage: canonical,
    url: canonical,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://tayfunturkmen.com/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `https://tayfunturkmen.com/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--chip)]">
        <div className="h-full w-1/3 bg-[var(--accent)]" />
      </div>
      <nav className="mt-5 text-sm text-[var(--muted)]">
        <Link href="/">{tr ? "Ana sayfa" : "Home"}</Link> / <Link href="/blog">Blog</Link> / <span>{post.title}</span>
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <header>
            <Link href="/blog" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">← {t("back")}</Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              {post.category ? localizeCategory(post.category, locale) : "Blog"}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight text-[var(--text)] sm:text-5xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              <span>{author?.name ?? "Tayfun Türkmen"}</span>
              <time dateTime={post.date}>{post.date}</time>
              <span>{tr ? "Güncellendi" : "Updated"} {post.updatedAt ?? post.date}</span>
              <span>{readingMinutes} min</span>
            </div>
          </header>

          {imageIsUrl ? (
            <img
              src={post.featuredImage}
              alt=""
              className="mt-8 aspect-[16/9] w-full rounded-lg object-cover"
            />
          ) : (
            <div className={`blog-image mt-8 rounded-lg ${post.featuredImage ?? "demo-1"}`} aria-hidden>
              <span>{post.category ? localizeCategory(post.category, locale) : "Blog"}</span>
            </div>
          )}

          <div className="mt-8">
            <AdSlot client={settings.adsenseClient} slot={settings.adSlotBlogPost} format="horizontal" />
          </div>

          {headings.length ? (
            <aside className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4">
              <h2 className="text-sm font-bold text-[var(--text)]">{tr ? "İçindekiler" : "Table of contents"}</h2>
              <ol className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {headings.map((heading) => <li key={heading.id} className={heading.depth === 3 ? "pl-4" : ""}>{heading.title}</li>)}
              </ol>
            </aside>
          ) : null}

          <div className="mt-8">
            <MarkdownContent markdown={injectInArticleAds(post.content, "")} />
          </div>

          <div className="mt-8">
            <AdSlot client={settings.adsenseClient} slot={settings.adSlotBlogPost} format="rectangle" />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags?.map((tag) => <Link key={tag} href={`/tag/${tag}`} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">#{tag}</Link>)}
          </div>

          <section className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--chip)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text)]">{tr ? "Yorumlar" : "Comments"}</h2>
            <form className="mt-4 grid gap-3">
              <input placeholder={tr ? "Adınız" : "Your name"} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm" />
              <textarea rows={4} placeholder={tr ? "Yorumunuz" : "Your comment"} className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm" />
              <button className="w-fit rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">{tr ? "Yorumu gönder" : "Submit comment"}</button>
            </form>
          </section>

          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text)]">{tr ? "Benzer yazılar" : "Related posts"}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {related.map((item) => <BlogCard key={item.slug} post={item} locale={locale} />)}
            </div>
          </section>
        </article>
        <BlogSidebar locale={locale} posts={posts} adsenseClient={settings.adsenseClient} adSlot={settings.adSlotBlogPost} />
      </div>
    </div>
  );
}
