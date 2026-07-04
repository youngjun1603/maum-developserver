-- 마음부부 Stage B: 선택적 공유 브리지 + 안전 플래그 (maumful-db ADD only, IF NOT EXISTS)
-- 적용: npx wrangler d1 execute maumful-db --remote --file=migrations/0002_share.sql

CREATE TABLE IF NOT EXISTS shared_items (
  id TEXT PRIMARY KEY,                       -- 랜덤 토큰
  relation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,                   -- message | mediate_view | perspective_view | activity_invite
  payload TEXT NOT NULL,                     -- 공유 승인된 내용만 (JSON)
  status TEXT NOT NULL DEFAULT 'sent',       -- sent | viewed | accepted
  created_at TEXT DEFAULT (datetime('now')),
  viewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_bubu_shared_relation ON shared_items(relation_id, created_at);

-- 안전 플래그(T1/T2) — 공유 차단·이후 세션 민감도에 사용
CREATE TABLE IF NOT EXISTS relation_safety (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  tier TEXT NOT NULL,                        -- T1 | T2
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bubu_safety_relation ON relation_safety(relation_id, created_at);
