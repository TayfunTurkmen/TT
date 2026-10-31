import pg from "pg";

// Keep timestamps as strings to match ISO strings used throughout the application
pg.types.setTypeParser(1114, (str) => str);
pg.types.setTypeParser(1184, (str) => str);

let pool: pg.Pool | null = null;
let schemaInitialized = false;
let schemaInitPromise: Promise<boolean> | null = null;

export function getPostgresPool(): pg.Pool | null {
  const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!connectionString) return null;

  if (!pool) {
    const isSsl = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
    pool = new pg.Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err);
    });
  }

  return pool;
}

export async function initPostgresSchema(p: pg.Pool): Promise<boolean> {
  if (schemaInitialized) return true;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      await p.query(`
        CREATE TABLE IF NOT EXISTS auto_blog_runs (
          id SERIAL PRIMARY KEY,
          topic TEXT NOT NULL,
          locale TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          slug TEXT NOT NULL,
          locale TEXT NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL,
          tags_json TEXT NOT NULL DEFAULT '[]',
          published INTEGER NOT NULL DEFAULT 0,
          scheduled_for TEXT NULL,
          published_at TEXT NULL,
          meta_title TEXT NULL,
          meta_description TEXT NULL,
          category TEXT NULL,
          author TEXT NULL,
          featured_image TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(slug, locale)
        );

        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          totp_secret TEXT NULL,
          totp_enabled INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS site_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS cron_runs (
          id SERIAL PRIMARY KEY,
          source TEXT NOT NULL DEFAULT 'api',
          ok INTEGER NOT NULL DEFAULT 0,
          published_count INTEGER NOT NULL DEFAULT 0,
          error TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS admin_login_attempts (
          attempt_key TEXT PRIMARY KEY,
          fail_count INTEGER NOT NULL DEFAULT 0,
          blocked_until TEXT NULL,
          last_failed_at TEXT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          body TEXT NOT NULL,
          locale TEXT NOT NULL,
          ip TEXT NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS appointment_requests (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          preferred_date TEXT NOT NULL,
          preferred_time TEXT NOT NULL,
          topic TEXT NOT NULL DEFAULT '',
          locale TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          ip TEXT NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          decided_at TEXT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_published ON blog_posts(locale, published);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_slug ON blog_posts(locale, slug);
      `);

      schemaInitialized = true;
      return true;
    } catch (err) {
      console.error("Failed to initialize PostgreSQL schema:", err);
      schemaInitPromise = null;
      return false;
    }
  })();

  return schemaInitPromise;
}

export function translateQuery(sql: string): string {
  let translated = sql;

  // 1. sqlite_master check
  if (translated.includes("sqlite_master")) {
    return "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('auto_blog_runs', 'blog_posts', 'admin_users', 'site_settings', 'cron_runs', 'admin_login_attempts', 'contact_messages', 'appointment_requests')";
  }

  // 2. admin_login_attempts CASE datetime with interval
  translated = translated.replace(
    /datetime\('now',\s*'\+'\s*\|\|\s*\?\s*\|\|\s*'\s*minutes'\)/gi,
    "NOW() + (? || ' minutes')::interval"
  );

  // 3. datetime(scheduled_for)
  translated = translated.replace(/datetime\(scheduled_for\)/gi, "scheduled_for::timestamptz");

  // 4. datetime('now')
  translated = translated.replace(/datetime\('now'\)/gi, "NOW()");

  // 5. Replace ? with $1, $2, ...
  let index = 1;
  translated = translated.replace(/\?/g, () => `$${index++}`);

  return translated;
}

export function createPostgresD1Adapter(p: pg.Pool) {
  return {
    prepare(rawSql: string) {
      const sql = translateQuery(rawSql);
      return {
        bind(...values: unknown[]) {
          const normalizedValues = values.map((val) => {
            if (typeof val === "boolean") return val ? 1 : 0;
            return val;
          });

          return {
            async run() {
              await initPostgresSchema(p);
              const res = await p.query(sql, normalizedValues);
              return res;
            },
            async first<T = Record<string, unknown>>() {
              await initPostgresSchema(p);
              const res = await p.query(sql, normalizedValues);
              return (res.rows[0] as T) ?? null;
            },
            async all<T = Record<string, unknown>>() {
              await initPostgresSchema(p);
              const res = await p.query(sql, normalizedValues);
              return { results: res.rows as T[] };
            },
          };
        },
      };
    },
    async exec(script: string) {
      await initPostgresSchema(p);
      return p.query(script);
    },
  };
}

export function getPostgresDb() {
  const p = getPostgresPool();
  if (!p) return null;
  return createPostgresD1Adapter(p);
}
