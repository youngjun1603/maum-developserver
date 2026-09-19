-- 0004_empathy.sql — 공감 반응(🤍) 멱등 처리 테이블 (R-26)
-- community_posts.empathy_count 를 직접 +1 하면 새로고침·따닥 클릭으로 무한 증가한다.
-- (post_id, author_hash) 유니크로 1인 1회만 반영. author_hash = hashAuthor(uid) 결과
-- (community_posts 와 동일하게 user_id 직접 저장 금지 — 익명 해시만).
CREATE TABLE IF NOT EXISTS community_empathy (
  post_id    INTEGER NOT NULL,
  author_hash TEXT   NOT NULL,          -- hashAuthor(uid) 결과 (user_id 직접 저장 금지)
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, author_hash)
);
