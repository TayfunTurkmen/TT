import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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

export function getAllPosts(locale: string): Post[] {
  return readPostsForLocale(locale);
}

export function getPost(locale: string, slug: string): Post | null {
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

export function getAllSlugs(locale: string): string[] {
  const dir = path.join(postsDir, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
