-- 마음부부 스키마 — maumful-db에 ADD만 (기존 테이블 무영향, IF NOT EXISTS)
-- ⚠️ 적용 전 collision 확인: 아래 6개 이름이 maumful-db에 없어야 함
-- 적용: npx wrangler d1 execute maumful-db --remote --file=migrations/0001_maumbubu.sql

CREATE TABLE IF NOT EXISTS couple_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a_id INTEGER NOT NULL,
  user_b_id INTEGER,                        -- 배우자 미가입 시 NULL (혼자 사용 가능)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relation_memory (
  relation_id INTEGER PRIMARY KEY,
  recurring_topics TEXT,
  psychology_profile TEXT,
  christian_profile TEXT,
  success_patterns TEXT,
  partner_perspective TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consent_sessions (
  id TEXT PRIMARY KEY,
  relation_id INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,
  consenter_id INTEGER,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS translation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  track TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  activity TEXT NOT NULL,
  status TEXT NOT NULL,
  reaction TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_hash TEXT NOT NULL,
  room TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  empathy_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bubu_consent_relation ON consent_sessions(relation_id, status);
CREATE INDEX IF NOT EXISTS idx_bubu_activity_relation ON activity_log(relation_id);
CREATE INDEX IF NOT EXISTS idx_bubu_community_room ON community_posts(room, created_at);
CREATE INDEX IF NOT EXISTS idx_bubu_relation_users ON couple_relations(user_a_id, user_b_id);
