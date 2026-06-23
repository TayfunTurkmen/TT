import { Link } from "@/i18n/routing";
import { categories } from "@/lib/cms";
import type { Post } from "@/lib/posts";
import { AdSlot } from "./AdSlot";

export function BlogSidebar({
  locale,
  posts,
  adsenseClient,
  adSlot,
}: {
  locale: string;
  posts: Post[];
  adsenseClient: string | null;
  adSlot: string;
}) {
  const popular = [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  const safeLocale = locale === "tr" ? "tr" : "en";
  return (
    <aside className="space-y-5">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          {safeLocale === "tr" ? "Kategoriler" : "Categories"}
        </h2>
        <nav className="mt-3 grid gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg)]"
            >
              <span>{category.title[safeLocale]}</span>
              <span className="text-xs text-[var(--muted)]">
                {posts.filter((post) => post.category === category.slug).length}
              </span>
            </Link>
          ))}
        </nav>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          {safeLocale === "tr" ? "Popüler" : "Popular"}
        </h2>
        <ol className="mt-3 space-y-3">
          {popular.map((post) => (
            <li key={post.slug} className="text-sm">
              <Link href={`/blog/${post.slug}`} className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
                {post.title}
              </Link>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{post.views?.toLocaleString(safeLocale)} views</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-[var(--chip)] p-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          {safeLocale === "tr" ? "Bülten" : "Newsletter"}
        </h2>
        <form className="mt-3 space-y-3">
          <input
            type="email"
            placeholder={safeLocale === "tr" ? "E-posta adresi" : "Email address"}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
            <input type="checkbox" required className="mt-1" />
            <span>{safeLocale === "tr" ? "KVKK/GDPR kapsamında ileti almayı kabul ediyorum." : "I consent to receive email updates under GDPR/KVKK."}</span>
          </label>
          <button type="submit" className="w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white">
            {safeLocale === "tr" ? "Abone ol" : "Subscribe"}
          </button>
        </form>
      </section>
      <AdSlot client={adsenseClient} slot={adSlot} format="auto" />
    </aside>
  );
}
