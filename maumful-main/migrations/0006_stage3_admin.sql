-- ============================================================
-- 0006_stage3_admin.sql  —  3단계: 정산 + 온보딩 + 리뷰 보완
-- ============================================================

CREATE TABLE IF NOT EXISTS settlements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id      INTEGER NOT NULL REFERENCES counseling_centers(id),
  period_start   DATE    NOT NULL,
  period_end     DATE    NOT NULL,
  total_revenue  INTEGER NOT NULL DEFAULT 0,
  commission_amt INTEGER NOT NULL DEFAULT 0,
  payout_amt     INTEGER NOT NULL DEFAULT 0,
  appt_count     INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending','processing','completed','failed')),
  bank_name      TEXT,
  account_number TEXT,
  account_holder TEXT,
  processed_at   DATETIME,
  note           TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS center_onboarding_requests (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER REFERENCES users(id),
  center_name      TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  contact_email    TEXT NOT NULL,
  contact_phone    TEXT,
  address          TEXT,
  specialty_tags   TEXT,
  description      TEXT,
  counselor_count  INTEGER DEFAULT 1,
  website_url      TEXT,
  business_reg_num TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK(status IN ('pending','reviewing','approved','rejected')),
  admin_note       TEXT,
  reviewed_at      DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counselor_earnings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  counselor_id   INTEGER NOT NULL REFERENCES counselors(id),
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  gross_amount   INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  commission_amt INTEGER NOT NULL,
  net_amount     INTEGER NOT NULL,
  settlement_id  INTEGER REFERENCES settlements(id),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settlements_center   ON settlements(center_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status   ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_status    ON center_onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_earnings_counselor   ON counselor_earnings(counselor_id);

-- 기존 테이블 컬럼 추가 (이미 있으면 오류 무시)
ALTER TABLE counseling_reviews    ADD COLUMN is_public       INTEGER DEFAULT 1;
ALTER TABLE counseling_reviews    ADD COLUMN counselor_reply TEXT;
ALTER TABLE counseling_reviews    ADD COLUMN admin_hidden    INTEGER DEFAULT 0;
ALTER TABLE counselors            ADD COLUMN bank_name       TEXT;
ALTER TABLE counselors            ADD COLUMN account_number  TEXT;
ALTER TABLE counselors            ADD COLUMN account_holder  TEXT;
ALTER TABLE counseling_centers    ADD COLUMN approved_at     DATETIME;
ALTER TABLE counseling_centers    ADD COLUMN rejected_reason TEXT;
ALTER TABLE appointments          ADD COLUMN completed_at    DATETIME;
ALTER TABLE appointments          ADD COLUMN earning_processed INTEGER DEFAULT 0;
