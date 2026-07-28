-- 제휴 진입 레이어 (2026-07-22) — partners에 진입화면 config 컬럼 + 퍼널 로그
-- 경량 진입 페이지(/p)가 이 값을 읽어 렌더. 값 없으면 코드에서 fallback(파트너명 기반 기본문구).
-- 모두 nullable → 기존 파트너 무영향. 어드민/DB로 편집 = 배포 없이 진입화면 변경.
ALTER TABLE partners ADD COLUMN entry_headline TEXT;   -- 헤드라인(줄바꿈 \n 허용)
ALTER TABLE partners ADD COLUMN entry_subcopy  TEXT;   -- 서브카피
ALTER TABLE partners ADD COLUMN entry_benefit  TEXT;   -- 제휴 전용 혜택 문구(null=숨김)
ALTER TABLE partners ADD COLUMN entry_cta_label TEXT;  -- CTA 버튼 문구
ALTER TABLE partners ADD COLUMN entry_cta_go    TEXT;  -- CTA 딥링크 대상(코어 ?go= 값, 예: test:PHQ9)

-- 진입 퍼널 로그(진입→CTA클릭→가입→결제 측정용). 비로그인도 기록(fire-and-forget).
CREATE TABLE IF NOT EXISTS partner_entry_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_code  TEXT NOT NULL,
  event         TEXT NOT NULL,           -- 'entry_view' | 'cta_click' (향후 signup/purchase)
  variant       TEXT,                    -- A/B 변형 키(향후)
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partner_entry_events ON partner_entry_events(partner_code, event, created_at);
