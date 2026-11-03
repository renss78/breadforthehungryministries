CREATE TABLE IF NOT EXISTS draft_items (
  message_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (message_id, kind)
);
