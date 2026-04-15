import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

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

type AdminUserRow = {
  username: string;
  password_hash: string;
  salt: string;
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
  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS auto_blog_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL, locale TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS blog_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, locale TEXT NOT NULL, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(slug, locale))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    return true;
  } catch {
    return false;
  }
}

export async function logAutoBlogRun(topic: string, locale: string) {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    await db
      .prepare("INSERT INTO auto_blog_runs (topic, locale) VALUES (?, ?)")
      .bind(topic, locale)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function pingD1() {
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db
      .prepare("SELECT datetime('now') AS now")
      .bind()
      .first<{ now: string }>();
    return row?.now ?? null;
  } catch {
    return null;
  }
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
  if (!(await ensureD1Schema())) return false;
  try {
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
  } catch {
    return false;
  }
}

export async function listPublishedBlogPosts(locale: string): Promise<DbPost[]> {
  const db = getDb();
  if (!db) return [];
  if (!(await ensureD1Schema())) return [];
  try {
    const rows = await db
      .prepare(
        "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts WHERE locale = ? AND published = 1 ORDER BY updated_at DESC",
      )
      .bind(locale)
      .all<RawDbPost>();
    return rows.results.map(mapDbPost);
  } catch {
    return [];
  }
}

function derivePasswordHash(password: string, saltHex: string): string {
  return scryptSync(password, Buffer.from(saltHex, "hex"), 64).toString("hex");
}

export async function hasAdminUser(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    const row = await db
      .prepare("SELECT username FROM admin_users LIMIT 1")
      .bind()
      .first<{ username: string }>();
    return Boolean(row?.username);
  } catch {
    return false;
  }
}

export async function registerInitialAdmin(
  username: string,
  password: string,
): Promise<"ok" | "exists" | "invalid" | "db"> {
  const db = getDb();
  if (!db) return "db";
  if (!(await ensureD1Schema())) return "db";

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || password.length < 8) return "invalid";

  const exists = await hasAdminUser();
  if (exists) return "exists";

  const salt = randomBytes(16).toString("hex");
  const passwordHash = derivePasswordHash(password, salt);
  try {
    await db
      .prepare("INSERT INTO admin_users (username, password_hash, salt) VALUES (?, ?, ?)")
      .bind(cleanUsername, passwordHash, salt)
      .run();
    return "ok";
  } catch {
    return "db";
  }
}

export async function verifyAdminUser(
  username: string,
  password: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;

  const cleanUsername = username.trim().toLowerCase();
  try {
    const row = await db
      .prepare(
        "SELECT username, password_hash, salt FROM admin_users WHERE username = ? LIMIT 1",
      )
      .bind(cleanUsername)
      .first<AdminUserRow>();

    if (!row) return false;

    const candidate = derivePasswordHash(password, row.salt);
    return timingSafeEqual(
      Buffer.from(candidate, "hex"),
      Buffer.from(row.password_hash, "hex"),
    );
  } catch {
    return false;
  }
}

export async function getPublishedBlogPost(
  locale: string,
  slug: string,
): Promise<DbPost | null> {
  const db = getDb();
  if (!db) return null;
  if (!(await ensureD1Schema())) return null;
  try {
    const row = await db
      .prepare(
        "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts WHERE locale = ? AND slug = ? AND published = 1 LIMIT 1",
      )
      .bind(locale, slug)
      .first<RawDbPost>();
    return row ? mapDbPost(row) : null;
  } catch {
    return null;
  }
}

export async function listAdminBlogPosts(limit = 100): Promise<DbPost[]> {
  const db = getDb();
  if (!db) return [];
  if (!(await ensureD1Schema())) return [];
  try {
    const rows = await db
      .prepare(
        "SELECT slug, locale, title, excerpt, content, tags_json, published, created_at, updated_at FROM blog_posts ORDER BY updated_at DESC LIMIT ?",
      )
      .bind(limit)
      .all<RawDbPost>();
    return rows.results.map(mapDbPost);
  } catch {
    return [];
  }
}
