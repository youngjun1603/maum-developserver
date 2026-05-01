-- ============================================================
-- maumgame 0002_weekly_reports.sql
-- 번아웃 회복 주간 리포트 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_reports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avg_energy          REAL    NOT NULL DEFAULT 0,       -- 평균 에너지 점수 (0~100)
  completed_missions  INTEGER NOT NULL DEFAULT 0,       -- 완료한 미션 수
  burnout_delta       TEXT    NOT NULL DEFAULT '0%',    -- 번아웃 변화율 (예: "-5%")
  week_start          DATE    NOT NULL,                 -- 해당 주 시작일 (YYYY-MM-DD)
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_date ON weekly_reports(created_at);
