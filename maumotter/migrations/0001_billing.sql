-- 마음수달 유료/쿼터 + 쿠폰(스마트스토어) + 제휴(?ref). maumotter-db에 적용.
-- 통역 단위 = 세션 1건(세션 시작 시 1쿼터 차감). 마음곁과 동일 엔진.
-- D1 제약: 신규 테이블만 추가.

CREATE TABLE IF NOT EXISTS subscriptions (
  maum_user_id  INTEGER PRIMARY KEY,
  plan          TEXT NOT NULL,            -- 'light' | 'pro'
  monthly_quota INTEGER NOT NULL,         -- 30 | 100 (세션 기준)
  expires_at    TEXT NOT NULL,
  updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS packs (
  maum_user_id INTEGER PRIMARY KEY,
  remaining    INTEGER NOT NULL DEFAULT 0,
  expires_at   TEXT,
  updated_at   TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usage_monthly (
  maum_user_id INTEGER NOT NULL,
  ym           TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (maum_user_id, ym)
);
CREATE TABLE IF NOT EXISTS coupons (
  code            TEXT PRIMARY KEY,
  type            TEXT NOT NULL,          -- 'sub_light' | 'sub_pro' | 'pack10'
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redeemed_count  INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER NOT NULL DEFAULT 1,
  valid_until     TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  source          TEXT,
  batch_id        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL,
  maum_user_id INTEGER NOT NULL,
  type         TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  UNIQUE (code, maum_user_id)
);
CREATE INDEX IF NOT EXISTS idx_credm_user ON coupon_redemptions(maum_user_id);
CREATE TABLE IF NOT EXISTS referrals (
  maum_user_id INTEGER PRIMARY KEY,
  ref          TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_referrals_ref ON referrals(ref);
