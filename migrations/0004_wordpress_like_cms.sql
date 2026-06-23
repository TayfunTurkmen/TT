CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_media_id INTEGER NULL,
  bio TEXT NOT NULL DEFAULT '',
  socials_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  seo_title TEXT NULL,
  meta_description TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER NULL,
  height INTEGER NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NULL,
  created_by INTEGER NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  category_id INTEGER NULL,
  featured_media_id INTEGER NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '[]',
  content_markdown TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  scheduled_for TEXT NULL,
  published_at TEXT NULL,
  reading_minutes INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT NULL,
  meta_description TEXT NULL,
  canonical_url TEXT NULL,
  og_image_media_id INTEGER NULL,
  noindex INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (featured_media_id) REFERENCES media(id),
  FOREIGN KEY (og_image_media_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '[]',
  content_markdown TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title TEXT NULL,
  meta_description TEXT NULL,
  noindex INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  parent_id INTEGER NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_hash TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL,
  parent_id INTEGER NULL,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'custom',
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS ad_placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 0,
  sticky INTEGER NOT NULL DEFAULT 0,
  min_height INTEGER NOT NULL DEFAULT 112,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seo_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  canonical_url TEXT NULL,
  robots TEXT NOT NULL DEFAULT 'index,follow',
  schema_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  consent_at TEXT NOT NULL DEFAULT (datetime('now')),
  provider TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL,
  status_code INTEGER NOT NULL CHECK (status_code IN (301, 302)),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ga4_measurement_id TEXT NULL,
  search_console_token TEXT NULL,
  meta_pixel_id TEXT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
