-- ============================================================
-- 0007_subscriptions.sql — 구독 플랜 시스템
-- ============================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_key          TEXT    NOT NULL,          -- 'basic' | 'standard' | 'pro'
  billing_key       TEXT,                       -- 토스 빌링키 (자동결제)
  customer_key      TEXT,                       -- 토스 customerKey
  status            TEXT    NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active','cancelled','expired','past_due')),
  monthly_credits   INTEGER NOT NULL,
  price             INTEGER NOT NULL,
  current_period_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  next_billing_date DATETIME,
  cancelled_at      DATETIME,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)   -- 1인 1구독
);

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  plan_key      TEXT    NOT NULL,
  amount        INTEGER NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'paid'
                CHECK(status IN ('paid','failed','refunded')),
  pg_tid        TEXT,
  billing_date  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user        ON subscription_invoices(user_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0007_subscriptions');
