-- 마음세대 3단계-f — 공유 브리지(웹뷰) + 커뮤니티
-- 마음부부 ADDENDUM 01 §1을 상속하되, **웹뷰 열람**이 이 앱의 차이다:
--   미가입 상대(70~80대 부모)가 앱 설치·가입 없이 링크로 열람할 수 있어야 실효성이 있다(DEV_01 §4).
--   → shared_items.id를 URL-safe 랜덤 토큰으로 쓰고, /s/<token> 공개 라우트가 이걸로만 조회한다.

CREATE TABLE IF NOT EXISTS sedae_shared_items (
  id TEXT PRIMARY KEY,                      -- 랜덤 토큰(URL-safe) = 열람 링크의 열쇠
  relation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,                  -- 'message' | 'mediate_view' | 'perspective_view' | 'activity_invite'
  payload TEXT NOT NULL,                    -- ⚠️ 공유 승인된 내용만(JSON). 통역 이력·관계 기억·수신 통역 결과는 절대 넣지 않는다.
  sender_label TEXT,                        -- 웹뷰에 보여줄 발신자 표시(예: "아들") — 실명·이메일 금지
  status TEXT NOT NULL DEFAULT 'sent',      -- sent | viewed | accepted | revoked
  created_at TEXT DEFAULT (datetime('now')),
  viewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sedae_shared_rel ON sedae_shared_items(relation_id, created_at);

-- 커뮤니티 — 성인 전용(청소년 방은 1차 출시 제외: 그루밍 등 접촉 위험).
-- ⚠️ AI 사전 검수 통과분만 저장한다(사후 삭제 구조 아님). user_id 직접 저장 금지 — author_hash만.
CREATE TABLE IF NOT EXISTS sedae_community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room TEXT NOT NULL,                       -- teen_parent | retire_dad | holiday | caregiving | kangaroo
  author_hash TEXT NOT NULL,                -- SHA-256('sedae:'+uid) 앞 24자 — 익명
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sedae_community_room ON sedae_community_posts(room, created_at);
