-- ============================================================
-- 심리검사 앱 B2C 전환 마이그레이션
-- 0004_b2c_migration.sql
-- 기존 상담사(B2B) 구조 → 일반 회원(B2C) 구조로 전환
-- ============================================================

-- ① 기존 B2B 테이블 제거
DROP TABLE IF EXISTS usage_history;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payments;   -- B2B 구조(user_phone FK) 제거, credit_charges 로 대체

-- ② users 테이블 재생성 (B2C 구조)
-- SQLite는 컬럼 DROP을 지원하지 않으므로, 테이블 재생성 방식 사용
CREATE TABLE IF NOT EXISTS users_v2 (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT,                           -- 소셜 로그인은 NULL
  social_provider     TEXT,                           -- 'google' | 'apple' | 'kakao' | NULL
  social_id           TEXT,                           -- 소셜 로그인의 외부 ID
  nickname            TEXT,
  locale              TEXT NOT NULL DEFAULT 'ko',     -- 'ko' | 'en'
  country_code        TEXT NOT NULL DEFAULT 'KR',     -- ISO 3166-1 alpha-2
  credits             INTEGER NOT NULL DEFAULT 45,    -- 기본 20 + AI채팅 보너스 25
  is_email_verified   INTEGER NOT NULL DEFAULT 0,
  email_verify_token  TEXT,
  pw_reset_token      TEXT,
  pw_reset_expires_at DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기존 users 데이터 중 관리자 계정만 마이그레이션 (선택적)
-- 실제 운영 중인 경우 필요에 따라 이 줄을 활성화
-- INSERT OR IGNORE INTO users_v2 (email, nickname, credits)
--   SELECT phone || '@admin.local', name, 999999 FROM users WHERE phone = 'limyj007';

DROP TABLE IF EXISTS users;
ALTER TABLE users_v2 RENAME TO users;

-- ③ 크레딧 입출금 내역 테이블
CREATE TABLE IF NOT EXISTS credit_transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK(type IN ('gain','spend')),
  amount       INTEGER NOT NULL,                      -- 항상 양수, type으로 방향 구분
  reason       TEXT NOT NULL,                         -- 'signup_bonus' | 'chat_bonus' | 'test' | 'chat' | 'charge' | 'referral'
  balance_after INTEGER NOT NULL,
  ref_id       TEXT,                                  -- 연관 결제 ID 등 참조값 (선택)
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ④ 크레딧 유료 충전 내역 테이블
CREATE TABLE IF NOT EXISTS credit_charges (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_key     TEXT NOT NULL,                      -- 'starter_kr' | 'standard_kr' | 'starter_global' 등
  credits         INTEGER NOT NULL,
  amount          INTEGER NOT NULL,                   -- 결제 금액 (최소 단위: 원 or 센트)
  currency        TEXT NOT NULL DEFAULT 'KRW',        -- 'KRW' | 'USD' | 'EUR'
  pg              TEXT NOT NULL,                      -- 'toss' | 'stripe'
  pg_tid          TEXT,                               -- PG사 거래 ID (webhook 수신 후 저장)
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','completed','failed','refunded')),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME
);

-- ⑤ 검사 수행 내역 테이블 (결과 데이터는 저장하지 않음 — 프라이버시 원칙)
CREATE TABLE IF NOT EXISTS test_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type      TEXT NOT NULL,                       -- 'SCT'|'DSI'|'PHQ9'|'GAD7'|'DASS21'|'BIG5'|'BURNOUT'|'LOST'
  lang           TEXT NOT NULL DEFAULT 'ko',
  credits_spent  INTEGER NOT NULL DEFAULT 10,
  performed_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑥ AI 채팅 세션 내역 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type     TEXT,
  lang          TEXT NOT NULL DEFAULT 'ko',
  msg_count     INTEGER NOT NULL DEFAULT 1,
  credits_spent INTEGER NOT NULL DEFAULT 5,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑦ 친구 초대 테이블
CREATE TABLE IF NOT EXISTS referrals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_bonus  INTEGER NOT NULL DEFAULT 30,
  referee_bonus   INTEGER NOT NULL DEFAULT 10,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','completed')),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑧ 이메일 인증 / 비밀번호 재설정 토큰 (단기 유효)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  type       TEXT NOT NULL CHECK(type IN ('email_verify','pw_reset')),
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑨ 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_social         ON users(social_provider, social_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_social_unique ON users(social_provider, social_id)
  WHERE social_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_tx_user       ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created    ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_charges_user  ON credit_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_charges_status ON credit_charges(status);
CREATE INDEX IF NOT EXISTS idx_test_history_user    ON test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user   ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token    ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires  ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer   ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee    ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status     ON referrals(status);

-- ⑩ 마이그레이션 기록
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004_b2c_migration');
