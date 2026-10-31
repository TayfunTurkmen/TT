import { Link } from "@/i18n/routing";
import { localizeCategory } from "@/lib/cms";
import type { Post } from "@/lib/posts";

export function BlogCard({ post, locale, featured = false }: { post: Post; locale: string; featured?: boolean }) {
  const imageIsUrl = post.featuredImage?.startsWith("http") || post.featuredImage?.startsWith("/");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-2 transition duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
      {imageIsUrl ? (
        <img
          src={post.featuredImage}
          alt=""
          className="aspect-[16/9] w-full rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`blog-image ${post.featuredImage ?? "demo-1"}`} aria-hidden>
          <span>{post.category ? localizeCategory(post.category, locale) : "Blog"}</span>
        </div>
      )}
      <div className={`flex flex-1 flex-col ${featured ? "p-4 sm:p-5" : "p-3 pt-4"}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <time dateTime={post.date}>{post.date}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes ?? 3} min</span>
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug tracking-tight text-[var(--text)] sm:text-[1.05rem]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{post.excerpt}</p> : null}
        {post.tags?.length ? (
          <div className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="rounded-md bg-[var(--chip)] px-2 py-0.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--text)]"
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
