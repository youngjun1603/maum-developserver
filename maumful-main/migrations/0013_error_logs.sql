-- 서버 에러 로그 테이블 (최근 500개 유지)
CREATE TABLE IF NOT EXISTS error_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  service     TEXT NOT NULL DEFAULT 'maumful',  -- maumful | maumgame | maumcouple
  status_code INTEGER,
  method      TEXT,
  path        TEXT,
  message     TEXT,
  stack       TEXT,
  user_id     INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
