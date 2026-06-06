-- 쿠폰 시스템 (크레딧 지급 쿠폰: 1회용 고유코드 + 공용 캠페인코드)
CREATE TABLE IF NOT EXISTS coupons (
  code            TEXT PRIMARY KEY,                 -- 정규화(대문자) 코드
  type            TEXT NOT NULL DEFAULT 'credit',   -- 'credit' (향후 'discount')
  value           INTEGER NOT NULL,                 -- 지급 크레딧
  max_redemptions INTEGER,                          -- 전체 사용 한도 (NULL=무제한)
  redeemed_count  INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER NOT NULL DEFAULT 1,       -- v1: 1인 1회(UNIQUE로 보장)
  valid_from      TEXT,                             -- ISO; NULL=시작 제한 없음
  valid_until     TEXT,                             -- ISO; NULL=만료 없음
  active          INTEGER NOT NULL DEFAULT 1,
  source          TEXT,                             -- 외부 사이트/캠페인 라벨
  batch_id        TEXT,                             -- 일괄발행 그룹 식별자
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  created_by      INTEGER
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL,
  user_id         INTEGER NOT NULL,
  credits_granted INTEGER NOT NULL,
  redeemed_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(code, user_id)                             -- 1인 1회 보장
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_batch  ON coupons(batch_id);
CREATE INDEX IF NOT EXISTS idx_coupons_source ON coupons(source);
