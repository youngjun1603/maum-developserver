-- ============================================================
-- maumcouple 0001_couple_schema.sql
-- maumful D1 인스턴스에 추가 적용 (users, test_history 참조)
-- ============================================================

-- ① test_history에 result_json 컬럼 추가 (BIG5/LOST 결과 저장용)
--    이미 존재하면 오류 무시 (wrangler d1 execute는 에러 스킵 불가 → 별도 실행)
ALTER TABLE test_history ADD COLUMN result_json TEXT;

-- ② 커플 세션 테이블
CREATE TABLE IF NOT EXISTS couple_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  session_code     TEXT    UNIQUE NOT NULL,
  host_user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  test_type        TEXT    NOT NULL DEFAULT 'BIG5+LOST+DSI'
                   CHECK(test_type IN ('BIG5','LOST','DSI','BIG5+LOST','BIG5+DSI','LOST+DSI','BIG5+LOST+DSI')),
  host_result_json TEXT,
  guest_result_json TEXT,
  status           TEXT    NOT NULL DEFAULT 'waiting'
                   CHECK(status IN ('waiting','both_done','reported','expired')),
  ai_report_text   TEXT,
  compatibility_score INTEGER DEFAULT 0,
  credits_spent    INTEGER NOT NULL DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,  -- BUG-1 FIX: updated_at 추가
  expires_at       DATETIME DEFAULT (datetime('now', '+72 hours'))
);

-- ③ 인덱스
CREATE INDEX IF NOT EXISTS idx_couple_code        ON couple_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_couple_host        ON couple_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_couple_guest       ON couple_sessions(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_couple_status      ON couple_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_history_type  ON test_history(user_id, test_type);
