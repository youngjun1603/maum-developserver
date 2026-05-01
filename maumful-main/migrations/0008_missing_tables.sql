-- ============================================================
-- 0008_missing_tables.sql
-- chat_sessions, referrals 테이블 생성 (코드 참조 누락분)
-- ============================================================

-- ① AI 채팅 세션 로그 (크레딧 차감 내역 추적)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type      TEXT,                                -- 연동 검사 유형 (nullable)
  lang           TEXT NOT NULL DEFAULT 'ko',
  credits_spent  INTEGER NOT NULL DEFAULT 5,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_date ON chat_sessions(created_at);

-- ② 친구 초대(레퍼럴) 테이블
CREATE TABLE IF NOT EXISTS referrals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 초대한 사람
  referee_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 초대받은 사람
  referrer_bonus  INTEGER NOT NULL DEFAULT 30,  -- 초대자 보너스 크레딧
  referee_bonus   INTEGER NOT NULL DEFAULT 10,  -- 피초대자 보너스 크레딧
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','completed','cancelled')),
  completed_at    DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referee_id)  -- 1인 1회만 적용 가능
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status   ON referrals(status);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0008_missing_tables');
