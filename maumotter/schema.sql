-- 마음수달 도메인 D1 스키마 (MVP) — DB 바인딩(maumotter-db)
-- 적용: Cloudflare 대시보드 → D1 → maumotter-db → Console 에 붙여넣기 실행.
-- ⚠️ 운영 중 변경은 ALTER TABLE ADD COLUMN 만 (DROP/RENAME/타입변경 불가).
-- ※ 계정(users)은 이 DB에 없음 → 공용 maum-auth D1(AUTH_DB) 사용. `_shared/maum-auth-schema.sql` 참조.
--   여기 테이블들은 maum_user_id(= maum-auth.users.id)로 부모를 참조.

-- 아이 프로필 (부모 계정 종속)
CREATE TABLE IF NOT EXISTS children (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  maum_user_id INTEGER NOT NULL,
  name         TEXT NOT NULL,            -- 애칭 권장
  age          INTEGER,
  gender       TEXT,
  interests    TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_children_user ON children(maum_user_id);

-- 대화 세션
CREATE TABLE IF NOT EXISTS sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id     INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  started_at   TEXT DEFAULT (datetime('now')),
  ended_at     TEXT,
  status       TEXT DEFAULT 'open'       -- open | done | aborted
);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON sessions(child_id);

-- 발화 (아이 / 또또)
CREATE TABLE IF NOT EXISTS utterances (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER NOT NULL,
  role         TEXT NOT NULL,            -- child | otter
  content      TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_utterances_session ON utterances(session_id);

-- 통역 리포트 (세션 종료 시 1건)
CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER NOT NULL,
  child_id     INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  report_json  TEXT NOT NULL,
  crisis_flag  INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_child ON reports(child_id);
