CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
  notification_sent INTEGER NOT NULL DEFAULT 0 CHECK (notification_sent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status, created_at DESC);
