-- AI 해석 품질 피드백 수집 (통합 심층 해석 등) — 프롬프트 개선 데이터셋
CREATE TABLE IF NOT EXISTS ai_feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL,                 -- 'integrated' | 'analyze' 등
  rating     TEXT NOT NULL,                 -- 'up' | 'down'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_feature ON ai_feedback(feature, created_at);
