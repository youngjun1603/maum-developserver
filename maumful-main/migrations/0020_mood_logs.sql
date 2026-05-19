-- ============================================================
-- 0020_mood_logs.sql
-- AI 상담 감정 추적 로그 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS mood_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score  INTEGER NOT NULL CHECK(mood_score BETWEEN 0 AND 100),
  test_type   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, created_at);
