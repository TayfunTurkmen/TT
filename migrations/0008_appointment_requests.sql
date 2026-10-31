CREATE TABLE IF NOT EXISTS appointment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
