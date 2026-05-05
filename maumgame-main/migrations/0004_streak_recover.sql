-- maumgame 0004_streak_recover.sql
-- 스트릭 복구권 컬럼 추가 (7일 연속 마일스톤 도달 시 지급)
ALTER TABLE user_game_status ADD COLUMN streak_recover INTEGER NOT NULL DEFAULT 0;
