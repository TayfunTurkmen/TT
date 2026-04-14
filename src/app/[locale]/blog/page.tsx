import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `/${locale}/blog`,
    },
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getAllPosts(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--text)]">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">{t("subtitle")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-16 text-[var(--muted)]">{t("empty")}</p>
      ) : (
        <ul className="mt-12 space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="group rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 transition hover:border-[var(--accent)]/40">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text)]">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="underline-offset-4 group-hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <time
                    dateTime={post.date}
                    className="font-mono text-xs text-[var(--muted)]"
                  >
                    {post.date}
                  </time>
                </div>
                {post.excerpt ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                ) : null}
                {post.tags && post.tags.length > 0 ? (
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
                    {t("topics")}: {post.tags.join(" · ")}
                  </p>
                ) : null}
                <div className="mt-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-[var(--accent-2)] hover:underline"
                  >
                    {t("read")} →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
