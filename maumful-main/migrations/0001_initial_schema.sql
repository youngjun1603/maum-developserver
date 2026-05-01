-- ===================================
-- 심리검사 시스템 v2.0 - 구독 시스템 DB 스키마
-- 0001_initial_schema.sql
-- ===================================

-- 사용자 (상담사) 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,           -- 전화번호 (기본 식별자)
  name TEXT NOT NULL,                   -- 상담사 이름
  counselor_type TEXT DEFAULT 'psychological', -- 상담 유형 (psychological, biblical)
  subscription_type TEXT DEFAULT 'free', -- 구독 유형 (free, pay_per_use, basic, professional, basic_annual, professional_annual)
  subscription_status TEXT DEFAULT 'active', -- 구독 상태 (active, expired, cancelled)
  subscription_start_date DATETIME,     -- 구독 시작일
  subscription_end_date DATETIME,       -- 구독 종료일
  quota_total INTEGER DEFAULT 5,        -- 총 쿼터 (무료: 5회, basic: 30회, professional: 100회, annual: 360/1200회)
  quota_used INTEGER DEFAULT 0,         -- 사용한 쿼터
  quota_reset_date DATETIME,            -- 쿼터 리셋 날짜 (월간 구독의 경우)
  is_approved BOOLEAN DEFAULT 0,        -- 관리자 승인 여부 (기존 로직 유지)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 구독 내역 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT NOT NULL,             -- 사용자 전화번호 (FK)
  plan_type TEXT NOT NULL,              -- 플랜 유형 (pay_per_use, basic, professional, basic_annual, professional_annual)
  plan_name TEXT NOT NULL,              -- 플랜 이름 (표시용)
  start_date DATETIME NOT NULL,         -- 구독 시작일
  end_date DATETIME NOT NULL,           -- 구독 종료일
  status TEXT DEFAULT 'active',         -- 구독 상태 (active, expired, cancelled)
  auto_renewal BOOLEAN DEFAULT 1,       -- 자동 갱신 여부
  quota_total INTEGER DEFAULT 0,        -- 할당된 쿼터
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES users(phone)
);

-- 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT NOT NULL,             -- 사용자 전화번호 (FK)
  subscription_id INTEGER,              -- 구독 ID (FK, nullable for pay_per_use)
  payment_type TEXT NOT NULL,           -- 결제 유형 (subscription, pay_per_use, upgrade)
  plan_type TEXT NOT NULL,              -- 플랜 유형
  amount INTEGER NOT NULL,              -- 결제 금액 (원)
  payment_method TEXT,                  -- 결제 수단 (card, bank_transfer, etc.)
  pg_name TEXT,                         -- PG사 이름 (toss, iamport, stripe)
  pg_transaction_id TEXT,               -- PG사 거래 ID
  status TEXT DEFAULT 'pending',        -- 결제 상태 (pending, completed, failed, refunded)
  paid_at DATETIME,                     -- 결제 완료 시각
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES users(phone),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- 사용 기록 테이블
CREATE TABLE IF NOT EXISTS usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_phone TEXT NOT NULL,             -- 사용자 전화번호 (FK)
  link_id TEXT NOT NULL,                -- 생성된 링크 ID
  test_type TEXT NOT NULL,              -- 검사 유형 (SCT, DSI, PHQ9, GAD7, DASS21, BIG5)
  action TEXT NOT NULL,                 -- 액션 (link_generated, test_completed)
  quota_consumed INTEGER DEFAULT 1,     -- 소비된 쿼터 (일반적으로 1)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES users(phone)
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_phone ON subscriptions(user_phone);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_phone ON payments(user_phone);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_usage_history_user_phone ON usage_history(user_phone);
CREATE INDEX IF NOT EXISTS idx_usage_history_created_at ON usage_history(created_at);

-- 초기 관리자 사용자 생성 (기존 하드코딩된 관리자)
INSERT OR IGNORE INTO users (phone, name, counselor_type, subscription_type, subscription_status, quota_total, quota_used, is_approved)
VALUES ('limyj007', 'System Admin', 'psychological', 'professional', 'active', 999999, 0, 1);
