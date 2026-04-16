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
  scheduledFor: string | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminUserRow = {
  username: string;
  password_hash: string;
  salt: string;
};

type SiteSettingRow = {
  setting_key: string;
  setting_value: string;
};

export type PublicSiteSettings = {
  adsenseClient: string | null;
  analyticsMeasurementId: string | null;
  adSlotBlogList: string;
  adSlotBlogPost: string;
  turnstileSiteKey: string | null;
};

export type CronRun = {
  id: number;
  source: string;
  ok: boolean;
  publishedCount: number;
  error: string | null;
  createdAt: string;
};

export type AdminSecuritySettings = {
  turnstileSiteKey: string | null;
  turnstileSecretKey: string | null;
};

export type AdminAiSettings = {
  aiApiBaseUrl: string | null;
  aiApiKey: string | null;
  aiModel: string | null;
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
        "CREATE TABLE IF NOT EXISTS blog_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, locale TEXT NOT NULL, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', published INTEGER NOT NULL DEFAULT 0, scheduled_for TEXT NULL, published_at TEXT NULL, meta_title TEXT NULL, meta_description TEXT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(slug, locale))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS cron_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL DEFAULT 'api', ok INTEGER NOT NULL DEFAULT 0, published_count INTEGER NOT NULL DEFAULT 0, error TEXT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS admin_login_attempts (attempt_key TEXT PRIMARY KEY, fail_count INTEGER NOT NULL DEFAULT 0, blocked_until TEXT NULL, last_failed_at TEXT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .bind()
      .run();

    const alterStatements = [
      "ALTER TABLE blog_posts ADD COLUMN scheduled_for TEXT NULL",
      "ALTER TABLE blog_posts ADD COLUMN published_at TEXT NULL",
      "ALTER TABLE blog_posts ADD COLUMN meta_title TEXT NULL",
      "ALTER TABLE blog_posts ADD COLUMN meta_description TEXT NULL",
    ];
    for (const sql of alterStatements) {
      try {
        await db.prepare(sql).bind().run();
      } catch {
        // ignore if column already exists
      }
    }

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
  scheduled_for: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
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
    scheduledFor: post.scheduled_for,
    publishedAt: post.published_at,
    metaTitle: post.meta_title,
    metaDescription: post.meta_description,
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
  scheduledFor?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}) {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    await db
      .prepare(
        `
        INSERT INTO blog_posts (slug, locale, title, excerpt, content, tags_json, published, scheduled_for, published_at, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug, locale) DO UPDATE SET
          title = excluded.title,
          excerpt = excluded.excerpt,
          content = excluded.content,
          tags_json = excluded.tags_json,
          published = excluded.published,
          scheduled_for = excluded.scheduled_for,
          published_at = excluded.published_at,
          meta_title = excluded.meta_title,
          meta_description = excluded.meta_description,
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
        input.scheduledFor ?? null,
        input.published ? new Date().toISOString() : null,
        input.metaTitle ?? null,
        input.metaDescription ?? null,
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
        "SELECT slug, locale, title, excerpt, content, tags_json, published, scheduled_for, published_at, meta_title, meta_description, created_at, updated_at FROM blog_posts WHERE locale = ? AND published = 1 ORDER BY COALESCE(published_at, updated_at) DESC",
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
        "SELECT slug, locale, title, excerpt, content, tags_json, published, scheduled_for, published_at, meta_title, meta_description, created_at, updated_at FROM blog_posts WHERE locale = ? AND slug = ? AND published = 1 LIMIT 1",
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
        "SELECT slug, locale, title, excerpt, content, tags_json, published, scheduled_for, published_at, meta_title, meta_description, created_at, updated_at FROM blog_posts ORDER BY updated_at DESC LIMIT ?",
      )
      .bind(limit)
      .all<RawDbPost>();
    return rows.results.map(mapDbPost);
  } catch {
    return [];
  }
}

export async function getAdminBlogPost(
  locale: string,
  slug: string,
): Promise<DbPost | null> {
  const db = getDb();
  if (!db) return null;
  if (!(await ensureD1Schema())) return null;
  try {
    const row = await db
      .prepare(
        "SELECT slug, locale, title, excerpt, content, tags_json, published, scheduled_for, published_at, meta_title, meta_description, created_at, updated_at FROM blog_posts WHERE locale = ? AND slug = ? LIMIT 1",
      )
      .bind(locale, slug)
      .first<RawDbPost>();
    return row ? mapDbPost(row) : null;
  } catch {
    return null;
  }
}

export async function autoPublishScheduledPosts(limit = 20): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  if (!(await ensureD1Schema())) return 0;

  try {
    const rows = await db
      .prepare(
        "SELECT slug, locale FROM blog_posts WHERE published = 0 AND scheduled_for IS NOT NULL AND datetime(scheduled_for) <= datetime('now') ORDER BY datetime(scheduled_for) ASC LIMIT ?",
      )
      .bind(limit)
      .all<{ slug: string; locale: string }>();

    if (!rows.results.length) return 0;

    for (const row of rows.results) {
      await db
        .prepare(
          "UPDATE blog_posts SET published = 1, published_at = datetime('now'), updated_at = datetime('now') WHERE slug = ? AND locale = ?",
        )
        .bind(row.slug, row.locale)
        .run();
    }

    return rows.results.length;
  } catch {
    return 0;
  }
}

export async function publishBlogPost(locale: string, slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;

  try {
    await db
      .prepare(
        "UPDATE blog_posts SET published = 1, published_at = datetime('now'), scheduled_for = NULL, updated_at = datetime('now') WHERE slug = ? AND locale = ?",
      )
      .bind(slug, locale)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function publishBlogPostsBySlug(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    await db
      .prepare(
        "UPDATE blog_posts SET published = 1, published_at = datetime('now'), scheduled_for = NULL, updated_at = datetime('now') WHERE slug = ?",
      )
      .bind(slug)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function deleteBlogPost(locale: string, slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;

  try {
    await db
      .prepare("DELETE FROM blog_posts WHERE slug = ? AND locale = ?")
      .bind(slug, locale)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function deleteBlogPostsBySlug(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    await db
      .prepare("DELETE FROM blog_posts WHERE slug = ?")
      .bind(slug)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function isAdminLoginBlocked(attemptKey: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  if (!(await ensureD1Schema())) return 0;

  try {
    const row = await db
      .prepare(
        "SELECT CAST((julianday(blocked_until) - julianday('now')) * 86400 AS INTEGER) AS seconds_left FROM admin_login_attempts WHERE attempt_key = ? AND blocked_until IS NOT NULL LIMIT 1",
      )
      .bind(attemptKey)
      .first<{ seconds_left: number | null }>();
    const seconds = Number(row?.seconds_left ?? 0);
    return seconds > 0 ? seconds : 0;
  } catch {
    return 0;
  }
}

export async function registerAdminLoginFailure(attemptKey: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    const existing = await db
      .prepare("SELECT fail_count FROM admin_login_attempts WHERE attempt_key = ? LIMIT 1")
      .bind(attemptKey)
      .first<{ fail_count: number }>();
    const failCount = Number(existing?.fail_count ?? 0) + 1;
    const blockMinutes = failCount >= 10 ? 60 : failCount >= 5 ? 15 : 0;
    await db
      .prepare(
        "INSERT INTO admin_login_attempts (attempt_key, fail_count, blocked_until, last_failed_at, updated_at) VALUES (?, ?, CASE WHEN ? > 0 THEN datetime('now', '+' || ? || ' minutes') ELSE NULL END, datetime('now'), datetime('now')) ON CONFLICT(attempt_key) DO UPDATE SET fail_count = excluded.fail_count, blocked_until = excluded.blocked_until, last_failed_at = excluded.last_failed_at, updated_at = datetime('now')",
      )
      .bind(attemptKey, failCount, blockMinutes, blockMinutes)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function clearAdminLoginFailures(attemptKey: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  try {
    await db
      .prepare("DELETE FROM admin_login_attempts WHERE attempt_key = ?")
      .bind(attemptKey)
      .run();
    return true;
  } catch {
    return false;
  }
}

type RawCronRun = {
  id: number;
  source: string;
  ok: number;
  published_count: number;
  error: string | null;
  created_at: string;
};

function mapCronRun(row: RawCronRun): CronRun {
  return {
    id: row.id,
    source: row.source,
    ok: Boolean(row.ok),
    publishedCount: row.published_count,
    error: row.error,
    createdAt: row.created_at,
  };
}

export async function logCronRun(input: {
  source: string;
  ok: boolean;
  publishedCount: number;
  error?: string | null;
}): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;

  try {
    await db
      .prepare(
        "INSERT INTO cron_runs (source, ok, published_count, error) VALUES (?, ?, ?, ?)",
      )
      .bind(
        input.source || "api",
        input.ok ? 1 : 0,
        Math.max(0, input.publishedCount || 0),
        input.error ?? null,
      )
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function listCronRuns(limit = 20): Promise<CronRun[]> {
  const db = getDb();
  if (!db) return [];
  if (!(await ensureD1Schema())) return [];

  try {
    const rows = await db
      .prepare(
        "SELECT id, source, ok, published_count, error, created_at FROM cron_runs ORDER BY id DESC LIMIT ?",
      )
      .bind(Math.max(1, Math.min(limit, 100)))
      .all<RawCronRun>();
    return rows.results.map(mapCronRun);
  } catch {
    return [];
  }
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseSiteSettings(rows: SiteSettingRow[]): PublicSiteSettings {
  const map = new Map(rows.map((row) => [row.setting_key, row.setting_value]));
  const envAds = normalizeNullable(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  const envGa = normalizeNullable(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  return {
    adsenseClient: normalizeNullable(map.get("adsenseClient")) ?? envAds,
    analyticsMeasurementId:
      normalizeNullable(map.get("analyticsMeasurementId")) ?? envGa,
    adSlotBlogList: normalizeNullable(map.get("adSlotBlogList")) ?? "1234567890",
    adSlotBlogPost: normalizeNullable(map.get("adSlotBlogPost")) ?? "1234567891",
    turnstileSiteKey: normalizeNullable(map.get("turnstileSiteKey")),
  };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const db = getDb();
  if (!db) return parseSiteSettings([]);
  if (!(await ensureD1Schema())) return parseSiteSettings([]);
  try {
    const rows = await db
      .prepare(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('adsenseClient', 'analyticsMeasurementId', 'adSlotBlogList', 'adSlotBlogPost', 'turnstileSiteKey')",
      )
      .bind()
      .all<SiteSettingRow>();
    return parseSiteSettings(rows.results);
  } catch {
    return parseSiteSettings([]);
  }
}

export async function savePublicSiteSettings(input: {
  adsenseClient: string | null;
  analyticsMeasurementId: string | null;
  adSlotBlogList: string | null;
  adSlotBlogPost: string | null;
  turnstileSiteKey?: string | null;
  turnstileSecretKey?: string | null;
}): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;

  const settings: Array<[string, string | null]> = [
    ["adsenseClient", normalizeNullable(input.adsenseClient)],
    ["analyticsMeasurementId", normalizeNullable(input.analyticsMeasurementId)],
    ["adSlotBlogList", normalizeNullable(input.adSlotBlogList)],
    ["adSlotBlogPost", normalizeNullable(input.adSlotBlogPost)],
    ["turnstileSiteKey", normalizeNullable(input.turnstileSiteKey)],
  ];

  try {
    for (const [key, value] of settings) {
      if (!value) {
        await db
          .prepare("DELETE FROM site_settings WHERE setting_key = ?")
          .bind(key)
          .run();
        continue;
      }
      await db
        .prepare(
          "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now')",
        )
        .bind(key, value)
        .run();
    }
    return true;
  } catch {
    return false;
  }
}

export async function getAdminSecuritySettings(): Promise<AdminSecuritySettings> {
  const db = getDb();
  if (!db) return { turnstileSiteKey: null, turnstileSecretKey: null };
  if (!(await ensureD1Schema())) return { turnstileSiteKey: null, turnstileSecretKey: null };
  try {
    const rows = await db
      .prepare(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('turnstileSiteKey', 'turnstileSecretKey')",
      )
      .bind()
      .all<SiteSettingRow>();
    const map = new Map(rows.results.map((row) => [row.setting_key, row.setting_value]));
    return {
      turnstileSiteKey: normalizeNullable(map.get("turnstileSiteKey")),
      turnstileSecretKey: normalizeNullable(map.get("turnstileSecretKey")),
    };
  } catch {
    return { turnstileSiteKey: null, turnstileSecretKey: null };
  }
}

export async function saveTurnstileSecret(secret: string | null): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  const value = normalizeNullable(secret);
  try {
    if (!value) {
      await db
        .prepare("DELETE FROM site_settings WHERE setting_key = 'turnstileSecretKey'")
        .bind()
        .run();
      return true;
    }
    await db
      .prepare(
        "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES ('turnstileSecretKey', ?, datetime('now')) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now')",
      )
      .bind(value)
      .run();
    return true;
  } catch {
    return false;
  }
}

async function saveSiteSetting(key: string, value: string | null): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await ensureD1Schema())) return false;
  const normalized = normalizeNullable(value);
  try {
    if (!normalized) {
      await db.prepare("DELETE FROM site_settings WHERE setting_key = ?").bind(key).run();
      return true;
    }
    await db
      .prepare(
        "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now')",
      )
      .bind(key, normalized)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function getAdminAiSettings(): Promise<AdminAiSettings> {
  const db = getDb();
  if (!db) return { aiApiBaseUrl: null, aiApiKey: null, aiModel: null };
  if (!(await ensureD1Schema())) return { aiApiBaseUrl: null, aiApiKey: null, aiModel: null };
  try {
    const rows = await db
      .prepare(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('aiApiBaseUrl', 'aiApiKey', 'aiModel')",
      )
      .bind()
      .all<SiteSettingRow>();
    const map = new Map(rows.results.map((row) => [row.setting_key, row.setting_value]));
    return {
      aiApiBaseUrl: normalizeNullable(map.get("aiApiBaseUrl")),
      aiApiKey: normalizeNullable(map.get("aiApiKey")),
      aiModel: normalizeNullable(map.get("aiModel")),
    };
  } catch {
    return { aiApiBaseUrl: null, aiApiKey: null, aiModel: null };
  }
}

export async function saveAdminAiSettings(input: {
  aiApiBaseUrl: string | null;
  aiModel: string | null;
  aiApiKey?: string | null;
}): Promise<boolean> {
  const baseOk = await saveSiteSetting("aiApiBaseUrl", input.aiApiBaseUrl);
  if (!baseOk) return false;
  const modelOk = await saveSiteSetting("aiModel", input.aiModel);
  if (!modelOk) return false;
  if (input.aiApiKey !== undefined) {
    const keyOk = await saveSiteSetting("aiApiKey", input.aiApiKey);
    if (!keyOk) return false;
  }
  return true;
}
