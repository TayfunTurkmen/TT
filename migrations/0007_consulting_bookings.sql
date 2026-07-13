CREATE TABLE IF NOT EXISTS consulting_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('30', '60')),
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_session_id TEXT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_consulting_bookings_status ON consulting_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consulting_bookings_stripe_session ON consulting_bookings(stripe_session_id);
