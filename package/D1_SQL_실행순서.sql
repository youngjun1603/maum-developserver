-- ============================================================
-- Cloudflare D1 콘솔에서 순서대로 실행하세요
-- 대상 DB: maumful-db
-- ============================================================

-- [STEP 1] test_history에 result_json 컬럼 추가
-- ※ 이미 있으면 "duplicate column name" 에러 → 무시하고 다음 진행
ALTER TABLE test_history ADD COLUMN result_json TEXT;

-- [STEP 2] couple_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS couple_sessions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  session_code        TEXT    UNIQUE NOT NULL,
  host_user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  test_type           TEXT    NOT NULL DEFAULT 'BIG5+LOST+DSI',
  host_result_json    TEXT,
  guest_result_json   TEXT,
  status              TEXT    NOT NULL DEFAULT 'waiting',
  ai_report_text      TEXT,
  compatibility_score INTEGER DEFAULT 0,
  credits_spent       INTEGER NOT NULL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at          DATETIME DEFAULT (datetime('now', '+72 hours'))
);

-- [STEP 3] 인덱스 생성 (하나씩 실행)
CREATE INDEX IF NOT EXISTS idx_couple_code   ON couple_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_couple_host   ON couple_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_couple_guest  ON couple_sessions(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_couple_status ON couple_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_result   ON test_history(user_id, test_type);

-- [STEP 4] 생성 확인
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- [STEP 5] 테이블 구조 확인
PRAGMA table_info(couple_sessions);

-- [배포 후 검증]
-- BIG5 result_json 저장 확인
SELECT user_id, test_type, result_json, performed_at
FROM test_history WHERE result_json IS NOT NULL
ORDER BY performed_at DESC LIMIT 5;

-- 커플 세션 확인
SELECT session_code, test_type, status, credits_spent, created_at
FROM couple_sessions ORDER BY created_at DESC LIMIT 5;
