-- 운영 에러 로그(모니터링). 운영자 /admin에서 최근 오류 확인.
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place TEXT, message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_errlog_created ON error_logs(created_at);
