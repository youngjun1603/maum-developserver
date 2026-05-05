-- maumgame 0005_campaign.sql
-- 스토리 캠페인 챕터 보상 수령 이력 테이블
CREATE TABLE IF NOT EXISTS game_campaign_progress (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  chapter_id   TEXT    NOT NULL,
  rewarded_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_user ON game_campaign_progress(user_id);
