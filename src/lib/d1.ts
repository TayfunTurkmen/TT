import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Stmt = {
  bind: (...values: unknown[]) => {
    run: () => Promise<unknown>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  };
};

type D1Like = {
  prepare: (query: string) => D1Stmt;
  exec: (query: string) => Promise<unknown>;
};

export type DbPost = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

function getDb(): D1Like | null {
  try {
    const { env } = getCloudflareContext();
    return (env as Record<string, unknown>).BLOG_DB as D1Like | null;
  } catch {
    return null;
  }
}

export async function ensureD1Schema() {
  const db = getDb();
  if (!db) return false;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS auto_blog_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      locale TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(slug, locale)
    );
  `);

  return true;
}

export async function logAutoBlogRun(topic: string, locale: string) {
  const db = getDb();
  if (!db) return false;

  await ensureD1Schema();
  await db
    .prepare("INSERT INTO auto_blog_runs (topic, locale) VALUES (?, ?)")
    .bind(topic, locale)
    .run();

  return true;
}

export async function pingD1() {
  const db = getDb();
  if (!db) return null;

  const row = await db
    .prepare("SELECT datetime('now') AS now")
    .bind()
    .first<{ now: string }>();

  return row?.now ?? null;
}

type RawDbPost = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  tags_json: string;
  published: number;
  created_at: string;
  updated_at: string;
};

function mapDbPost(post: RawDbPost): DbPost {
  return {
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: JSON.parse(post.tags_json || "[]") as string[],
    published: Boolean(post.published),
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

export async function upsertBlogPost(input: {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}) {
  const db = getDb();
  if (!db) return false;
  await ensureD1Schema();

  await db
    .prepare(
      `
      INSERT INTO blog_posts (slug, locale, title, excerpt, content, tags_json, published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug, locale) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        content = excluded.content,
        tags_json = excluded.tags_json,
        published = excluded.published,
        updated_at = datetime('now')
    `,
    )
    .bind(
      input.slug,
      input.locale,
      input.title,
      input.excerpt,
      input.content,
      JSON.stringify(input.tags),
      input.published ? 1 : 0,
    )
    .run();

  return true;
}

export async function listPublishedBlogPosts(locale: string): Promise<DbPost[]> {
  const db = getDb();
  if (!db) return [];
  await ensureD1Schema();

  const rows = await db
    .prepare(
      "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts WHERE locale = ? AND published = 1 ORDER BY updated_at DESC",
    )
    .bind(locale)
    .all<RawDbPost>();

  return rows.results.map(mapDbPost);
}

export async function getPublishedBlogPost(
  locale: string,
  slug: string,
): Promise<DbPost | null> {
  const db = getDb();
  if (!db) return null;
  await ensureD1Schema();

  const row = await db
    .prepare(
      "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts WHERE locale = ? AND slug = ? AND published = 1 LIMIT 1",
    )
    .bind(locale, slug)
    .first<RawDbPost>();

  return row ? mapDbPost(row) : null;
}

export async function listAdminBlogPosts(limit = 100): Promise<DbPost[]> {
  const db = getDb();
  if (!db) return [];
  await ensureD1Schema();

  const rows = await db
    .prepare(
      "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts ORDER BY updated_at DESC LIMIT ?",
    )
    .bind(limit)
    .all<RawDbPost>();

  return rows.results.map(mapDbPost);
}
