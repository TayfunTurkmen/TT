import { Link } from "@/i18n/routing";
import { getDemoPosts } from "@/lib/cms";

export default function NotFound() {
  const posts = getDemoPosts("en").slice(0, 3);
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="font-mono text-sm text-[var(--accent)]">404</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text)]">
        Page not found
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        The page may have moved. Search the blog or jump back into a popular article.
      </p>
      <form action="/en/search" className="mx-auto mt-6 flex max-w-md gap-2">
        <input name="q" className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm" placeholder="Search articles" />
        <button className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">Search</button>
      </form>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[#041016]"
      >
        Go home
      </Link>
      <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4 text-sm font-semibold text-[var(--text)] hover:text-[var(--accent)]">
            {post.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
