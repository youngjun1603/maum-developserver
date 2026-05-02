-- ============================================================
-- maumcouple 0002_relationship_checkins.sql
-- 관계 성장 체크인 테이블 (월 1회 관계 만족도 기록)
-- ============================================================

CREATE TABLE IF NOT EXISTS relationship_checkins (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score  INTEGER NOT NULL,       -- 10문항 × 1~5점 = 10~50점
  answers_json TEXT,                  -- 문항별 점수 JSON
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON relationship_checkins(user_id, created_at DESC);
