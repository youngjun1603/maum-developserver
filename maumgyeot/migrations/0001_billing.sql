-- 마음곁 유료/쿼터 + 쿠폰(스마트스토어 연동) 스키마. maumgyeot-db에 적용.
-- D1 제약: 신규 테이블만 추가(기존 컬럼 변경 없음). ADD COLUMN only 원칙 준수.

-- 구독(쿠폰으로 부여) — 1인 1행. 만료 지나면 무효.
CREATE TABLE IF NOT EXISTS subscriptions (
  maum_user_id  INTEGER PRIMARY KEY,
  plan          TEXT NOT NULL,            -- 'light' | 'pro'
  monthly_quota INTEGER NOT NULL,         -- 30 | 100
  expires_at    TEXT NOT NULL,            -- ISO; 이 시각 이후 구독쿼터 0
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 회차권(팩) 잔여 — 1인 1행 누적.
CREATE TABLE IF NOT EXISTS packs (
  maum_user_id INTEGER PRIMARY KEY,
  remaining    INTEGER NOT NULL DEFAULT 0,
  expires_at   TEXT,                      -- ISO; 지나면 잔여 무효
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- 월 사용량(무료+구독 쿼터 차감 카운터). ym = 'YYYYMM'.
CREATE TABLE IF NOT EXISTS usage_monthly (
  maum_user_id INTEGER NOT NULL,
  ym           TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (maum_user_id, ym)
);

-- 쿠폰(어드민/스마트스토어 발행) — CTS 쿠폰 구조 차용.
CREATE TABLE IF NOT EXISTS coupons (
  code            TEXT PRIMARY KEY,
  type            TEXT NOT NULL,          -- 'sub_light' | 'sub_pro' | 'pack10'
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redeemed_count  INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER NOT NULL DEFAULT 1,
  valid_until     TEXT,                   -- ISO; null = 무기한
  active          INTEGER NOT NULL DEFAULT 1,
  source          TEXT,                   -- 'smartstore' | 'partner:xxx' 등
  batch_id        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- 쿠폰 사용 이력(중복 등록 방지).
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL,
  maum_user_id INTEGER NOT NULL,
  type         TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  UNIQUE (code, maum_user_id)
);
CREATE INDEX IF NOT EXISTS idx_credm_user ON coupon_redemptions(maum_user_id);
