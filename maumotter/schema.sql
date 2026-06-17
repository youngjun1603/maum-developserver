-- 마음수달 D1 스키마 (MVP)
-- 적용: Cloudflare 대시보드 → D1 → maumotter-db → Console 에 붙여넣기 실행.
-- ⚠️ 운영 중 변경은 ALTER TABLE ADD COLUMN 만 (DROP/RENAME/타입변경 불가).
-- MVP는 users 를 이 DB에 둠. 마음곁 합류 시 users → 공용 maum-auth 로 분리(maum_user_id 유지).

-- 계정(부모) — maum_user_id = users.id (JWT payload), 향후 maum-auth 로 이관
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- PBKDF2(salt:hash) hex
  name         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

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
