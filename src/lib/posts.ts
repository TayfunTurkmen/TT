import matter from "gray-matter";
import {
  getPublishedBlogPost,
  listPublishedBlogPosts,
  type DbPost,
} from "@/lib/d1";
import { getDemoPosts } from "@/lib/cms";

export type PostFrontmatter = {
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
};

export type Post = PostFrontmatter & {
  slug: string;
  content: string;
  locale: string;
  seoTitle?: string;
  seoDescription?: string;
  category?: string;
  author?: string;
  updatedAt?: string;
  readingMinutes?: number;
  views?: number;
  featuredImage?: string;
};

function getPostsDir(path: typeof import("node:path")) {
  try {
    return path.join(process.cwd(), "content", "posts");
  } catch {
    return null;
  }
}

async function readPostsForLocale(locale: string): Promise<Post[]> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = getPostsDir(path);
    if (!dir || !fs.existsSync(path.join(dir, locale))) return [];

    const locDir = path.join(dir, locale);
    return fs
      .readdirSync(locDir)
      .filter((f: string) => f.endsWith(".md"))
      .map((filename: string) => {
        const slug = filename.replace(/\.md$/, "");
        const raw = fs.readFileSync(path.join(locDir, filename), "utf8");
        const { data, content } = matter(raw);
        const fm = data as Partial<PostFrontmatter>;
        return {
          slug,
          locale,
          title: fm.title ?? slug,
          date: fm.date ?? new Date().toISOString().slice(0, 10),
          excerpt: fm.excerpt,
          tags: fm.tags ?? [],
          content,
        };
      })
      .sort((a: Post, b: Post) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

function dbToPost(p: DbPost): Post {
  return {
    slug: p.slug,
    locale: p.locale,
    title: p.title,
    excerpt: p.excerpt,
    tags: p.tags,
    content: p.content,
    date: (p.publishedAt ?? p.updatedAt ?? p.createdAt).slice(0, 10),
    seoTitle: p.metaTitle ?? undefined,
    seoDescription: p.metaDescription ?? undefined,
    category: p.category ?? undefined,
    author: p.author ?? undefined,
    featuredImage: p.featuredImage ?? undefined,
  };
}

export async function getAllPosts(locale: string): Promise<Post[]> {
  const demoPosts = getDemoPosts(locale);
  const diskPosts = await readPostsForLocale(locale);
  const dbPosts = (await listPublishedBlogPosts(locale)).map(dbToPost);
  const merged = new Map<string, Post>();

  for (const post of demoPosts) merged.set(post.slug, post);
  for (const post of diskPosts) merged.set(post.slug, post);
  for (const post of dbPosts) merged.set(post.slug, post);

  return Array.from(merged.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function getDiskPost(locale: string, slug: string): Promise<Post | null> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = getPostsDir(path);
    if (!dir) return null;
    const file = path.join(dir, locale, `${slug}.md`);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const fm = data as Partial<PostFrontmatter>;
    return {
      slug,
      locale,
      title: fm.title ?? slug,
      date: fm.date ?? new Date().toISOString().slice(0, 10),
      excerpt: fm.excerpt,
      tags: fm.tags ?? [],
      content,
    };
  } catch {
    return null;
  }
}

export async function getPost(locale: string, slug: string): Promise<Post | null> {
  const dbPost = await getPublishedBlogPost(locale, slug);
  if (dbPost) return dbToPost(dbPost);
  return (await getDiskPost(locale, slug)) ?? getDemoPosts(locale).find((post) => post.slug === slug) ?? null;
}

export async function getAllSlugs(locale: string): Promise<string[]> {
  const fromDisk = new Set<string>();
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = getPostsDir(path);
    if (dir) {
      const locDir = path.join(dir, locale);
      if (fs.existsSync(locDir)) {
        for (const f of fs.readdirSync(locDir).filter((n: string) => n.endsWith(".md"))) {
          fromDisk.add(f.replace(/\.md$/, ""));
        }
      }
    }
  } catch {}

  for (const p of await listPublishedBlogPosts(locale)) {
    fromDisk.add(p.slug);
  }

  for (const p of getDemoPosts(locale)) {
    fromDisk.add(p.slug);
  }

  return Array.from(fromDisk.values());
}
