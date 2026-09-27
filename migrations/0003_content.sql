CREATE TABLE IF NOT EXISTS administrators (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS content_releases (
 revision INTEGER PRIMARY KEY,
 document TEXT NOT NULL,
 published_by TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
