import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  getPublishedBlogPost,
  listPublishedBlogPosts,
  type DbPost,
} from "@/lib/d1";

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
};

const postsDir = path.join(process.cwd(), "content", "posts");

function readPostsForLocale(locale: string): Post[] {
  const dir = path.join(postsDir, locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, filename), "utf8");
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
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function dbToPost(p: DbPost): Post {
  return {
    slug: p.slug,
    locale: p.locale,
    title: p.title,
    excerpt: p.excerpt,
    tags: p.tags,
    content: p.content,
    date: p.updatedAt?.slice(0, 10) ?? p.createdAt.slice(0, 10),
  };
}

export async function getAllPosts(locale: string): Promise<Post[]> {
  const diskPosts = readPostsForLocale(locale);
  const dbPosts = (await listPublishedBlogPosts(locale)).map(dbToPost);
  const merged = new Map<string, Post>();

  for (const post of diskPosts) merged.set(post.slug, post);
  for (const post of dbPosts) merged.set(post.slug, post);

  return Array.from(merged.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getDiskPost(locale: string, slug: string): Post | null {
  const file = path.join(postsDir, locale, `${slug}.md`);
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
}

export async function getPost(locale: string, slug: string): Promise<Post | null> {
  const dbPost = await getPublishedBlogPost(locale, slug);
  if (dbPost) return dbToPost(dbPost);
  return getDiskPost(locale, slug);
}

export async function getAllSlugs(locale: string): Promise<string[]> {
  const fromDisk = new Set<string>();
  const dir = path.join(postsDir, locale);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      fromDisk.add(f.replace(/\.md$/, ""));
    }
  }

  for (const p of await listPublishedBlogPosts(locale)) {
    fromDisk.add(p.slug);
  }

  return Array.from(fromDisk.values());
}
