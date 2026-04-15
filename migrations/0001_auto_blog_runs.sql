CREATE TABLE IF NOT EXISTS auto_blog_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  locale TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
