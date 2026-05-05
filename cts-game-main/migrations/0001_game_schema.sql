-- ============================================================
-- maumgame 0001_game_schema.sql
-- phyweb D1 인스턴스에 추가 적용 (users 테이블 참조)
-- ============================================================

-- ① 사용자별 정원 진행 상태
CREATE TABLE IF NOT EXISTS user_game_status (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  garden_level   INTEGER  NOT NULL DEFAULT 1,
  total_exp      INTEGER  NOT NULL DEFAULT 0,
  visual_status  TEXT     NOT NULL DEFAULT 'clearing'
                 CHECK(visual_status IN ('foggy','clearing','blooming')),
  streak_days    INTEGER  NOT NULL DEFAULT 0,          -- 연속 출석일
  last_played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unlocked_games TEXT     NOT NULL DEFAULT '["garden"]' -- JSON 배열
);

-- ② 게임 세션 로그 (매 플레이 기록)
CREATE TABLE IF NOT EXISTS game_session_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id      TEXT     NOT NULL,                      -- 'garden' | 'breathing' | 'efmt'
  module_type  TEXT     NOT NULL,                      -- 'CBT' | 'EFMT' | 'RELAX'
  score        INTEGER  NOT NULL DEFAULT 0,
  exp_gained   INTEGER  NOT NULL DEFAULT 0,
  duration_sec INTEGER  NOT NULL DEFAULT 0,
  metadata     TEXT,                                   -- JSON (게임별 추가 데이터)
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ③ 업적(배지) 시스템
CREATE TABLE IF NOT EXISTS game_achievements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT    NOT NULL,                     -- 'first_play' | 'streak_7' 등
  earned_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- ④ AI 변환 캐시 (SCT → 긍정 문장)
CREATE TABLE IF NOT EXISTS game_ai_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_text  TEXT    NOT NULL,
  result_text  TEXT    NOT NULL,
  game_id      TEXT    NOT NULL DEFAULT 'garden',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑤ 인덱스
CREATE INDEX IF NOT EXISTS idx_game_sessions_user    ON game_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game    ON game_session_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_date    ON game_session_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_game_achievements_usr ON game_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_game_ai_cache_user    ON game_ai_cache(user_id);
