-- 마음세대 (부모-자녀 세대 통역) — D1 델타
-- 마음풀 생태계 공유 DB(maumful-db)에 테이블만 추가. 신규 D1 없음.
-- 마음부부 스키마를 파생하되, 이 앱의 근본 차이는 **다중 관계**다:
--   부부는 관계가 1개지만, 부모-자녀는 사용자당 복수 관계가 기본(아버지·어머니는 완전히 다른 관계이고,
--   부모 사용자는 자녀 여럿과 각각의 관계를 가진다). 기억·통역맥락·안전플래그 전부 relation 단위로 분리된다.

-- ── 다중 관계 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sedae_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_type TEXT NOT NULL DEFAULT 'parent_child',
  owner_id INTEGER NOT NULL,         -- 관계를 만든 사용자
  owner_role TEXT NOT NULL,          -- 'child' | 'parent'  (누가 사용자인가)
  counterpart_label TEXT NOT NULL,   -- 관계 선택 UI 표시명: "아버지" / "어머니" / "큰딸" 등
  counterpart_id INTEGER,            -- 상대 계정 (미가입 NULL — 기본 상태)
  counterpart_context TEXT,          -- "70대, 은퇴 2년차" 등 요약 (사용자가 수정 가능)
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sedae_relations_owner ON sedae_relations(owner_id);

-- ── 관계 기억 ────────────────────────────────────────────────
-- ⚠️ 마음부부 ADDENDUM 02의 v2 구조를 상속: (relation_id, user_id) 복합키.
--    relation_id 단일키면 상대의 기억이 내 통역 프롬프트에 주입된다(마음부부에서 실제 발생했던 결함).
--    이 앱에선 더 위험하다 — 아이가 입력한 학대 정황 요약이 부모 계정 통역에 새면 아이가 위험해진다.
-- ★ 이중 폭풍 장기 기억 필드(past_patterns·life_stage)가 이 앱의 핵심 차별화.
CREATE TABLE IF NOT EXISTS sedae_relation_memory (
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,          -- 기억의 소유자 = 통역을 실행한 사용자
  recurring_topics TEXT,
  psychology_profile TEXT,           -- 분화 상태(융합↔단절 경향) 포함
  christian_profile TEXT,
  success_patterns TEXT,
  partner_perspective TEXT,
  past_patterns TEXT,                -- ★ 과거(청소년기 등) 형성 패턴 요약
  life_stage TEXT,                   -- ★ 현재 생애 국면: cohabit(동거)/distant(원거리)/caregiving(간병)
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (relation_id, user_id)
);

-- ── 통역 로그 (원문·결과 미저장 — 프라이버시 원칙 상속) ──────
CREATE TABLE IF NOT EXISTS sedae_translation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  track TEXT NOT NULL,
  mode TEXT NOT NULL,
  age_tier TEXT,                     -- teen | adult | senior (집계용)
  created_at TEXT DEFAULT (datetime('now'))
);

-- ── 안전 플래그 (T1/T2 감지 기록) ────────────────────────────
-- 공유 차단은 relation 전체에 적용(피해자가 감지된 관계에선 어느 쪽도 공유 불가) — ADDENDUM 02 원칙.
CREATE TABLE IF NOT EXISTS sedae_relation_safety (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,          -- 감지된 세션의 사용자
  tier TEXT NOT NULL,                -- 'T1' | 'T2'
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sedae_safety_rel ON sedae_relation_safety(relation_id, created_at);

-- ── 회복 활동 기록 (자유서술 note 미저장 — 프라이버시 원칙 상속) ──
CREATE TABLE IF NOT EXISTS sedae_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  activity TEXT NOT NULL,
  status TEXT NOT NULL,
  reaction TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
