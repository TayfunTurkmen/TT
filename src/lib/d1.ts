import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Stmt = {
  bind: (...values: unknown[]) => {
    run: () => Promise<unknown>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
  };
};

type D1Like = {
  prepare: (query: string) => D1Stmt;
  exec: (query: string) => Promise<unknown>;
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
