import { Link } from "@/i18n/routing";
import { localizeCategory } from "@/lib/cms";
import type { Post } from "@/lib/posts";

export function BlogCard({ post, locale, featured = false }: { post: Post; locale: string; featured?: boolean }) {
  const imageIsUrl = post.featuredImage?.startsWith("http") || post.featuredImage?.startsWith("/");

  return (
    <article className="group h-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)] transition hover:border-[var(--accent)]/50">
      {imageIsUrl ? (
        <img
          src={post.featuredImage}
          alt=""
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`blog-image ${post.featuredImage ?? "demo-1"}`} aria-hidden>
          <span>{post.category ? localizeCategory(post.category, locale) : "Blog"}</span>
        </div>
      )}
      <div className={featured ? "p-5 sm:p-6" : "p-4"}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <time dateTime={post.date}>{post.date}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes ?? 3} min</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--text)]">
          <Link href={`/blog/${post.slug}`} className="underline-offset-4 group-hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{post.excerpt}</p> : null}
        {post.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
