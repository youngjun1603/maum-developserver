-- ============================================================
-- maumgame 0003_test_scores.sql
-- 게임 내 자가 입력 검사 점수 저장 (maumful 프라이버시 정책 우회)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_test_scores (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type  TEXT    NOT NULL,   -- 'PHQ9' | 'BURNOUT' | 'GAD7' 등
  score      INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, test_type)
);

CREATE INDEX IF NOT EXISTS idx_test_scores_user ON user_test_scores(user_id);
