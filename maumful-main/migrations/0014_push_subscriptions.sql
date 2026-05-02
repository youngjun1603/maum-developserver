-- Web Push 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  service    TEXT NOT NULL DEFAULT 'maumful',
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service)
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id, service);
