-- ADDENDUM 02 §1 — 관계 기억의 사용자 분리 (프라이버시 결함 수정)
--
-- 문제: relation_memory가 relation_id 단일 키라, 부부 양쪽이 모두 앱을 쓰면
--       A의 통역에서 추출된 관계 기억이 B의 통역 프롬프트에 주입된다.
--       ("수신 통역 결과 공유 금지" 원칙을 데이터 층에서 위반)
--       공유 브리지(ADDENDUM 01)로 배우자가 가입하는 순간부터 실제 발생.
-- 수정: 기억 키를 (relation_id, user_id) 복합키로. 기억의 소유자 = 통역을 실행한 사용자.
--
-- ⚠️ 기존 relation_memory 테이블은 삭제하지 않는다(보존 규칙). 코드만 v2를 바라본다.

CREATE TABLE IF NOT EXISTS relation_memory_v2 (
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,                 -- 이 기억의 소유자 (통역을 실행한 사용자)
  recurring_topics TEXT,
  psychology_profile TEXT,
  christian_profile TEXT,
  success_patterns TEXT,
  partner_perspective TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (relation_id, user_id)
);

-- 기존 데이터 이관: 기존 기억은 관계의 user_a(원 사용자) 소유로 귀속
INSERT OR IGNORE INTO relation_memory_v2
  (relation_id, user_id, recurring_topics, psychology_profile, christian_profile,
   success_patterns, partner_perspective, updated_at)
SELECT m.relation_id, r.user_a_id, m.recurring_topics, m.psychology_profile,
       m.christian_profile, m.success_patterns, m.partner_perspective, m.updated_at
FROM relation_memory m JOIN couple_relations r ON r.id = m.relation_id;
