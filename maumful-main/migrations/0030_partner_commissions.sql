-- 0030_partner_commissions.sql
-- ⚠️ 역기록(back-record) 파일 — 원격 maumful-db 에 이 테이블이 **이미 존재**하며 정상 작동 중이다.
--    (2026-09-19 실측: 테이블 존재·적립 누락 0건·금전 손실 없음). 코드
--    (accruePartnerCommission/reversePartnerCommission · /api/admin/partner-commissions ·
--     /api/partner-portal/commissions)가 쭉 써왔으나 CREATE 마이그레이션 파일만 누락돼 있었다
--    (0029_external_grants 와 동일 패턴). DB 재구축 시 누락 방지를 위해 원격 DDL 을 그대로 기록한다.
-- ⚠️ 이 파일은 원격 프로덕션에 **적용하지 마라**(이미 존재). IF NOT EXISTS 라 재실행해도 무해하지만,
--    신규/스테이징 DB 구축용 기록이다. charge_id PK = INSERT OR IGNORE 멱등의 근거(중복 적립 방지).
-- ⚠️ 원격 실제 스키마에는 status 에 CHECK 제약이 **없다**(SQLite 는 사후 CHECK 추가 불가 → 그대로 둔다).
--    지시서 초안의 CHECK(status IN ('pending','settled','reversed')) 는 신규 구축 시에만 선택적으로 적용.

CREATE TABLE IF NOT EXISTS partner_commissions (
  charge_id      INTEGER PRIMARY KEY,                       -- credit_charges.id. INSERT OR IGNORE 멱등의 근거
  partner_code   TEXT    NOT NULL,                          -- credit_charges.partner_code (대문자)
  user_id        INTEGER NOT NULL,
  charge_amount  INTEGER NOT NULL,                          -- SUM() 대상
  rate           REAL    NOT NULL,                          -- 적립 시점 revenue_share_rate 스냅샷
  share_amount   INTEGER NOT NULL,                          -- Math.round(amount * rate)
  currency       TEXT    NOT NULL DEFAULT 'KRW',
  status         TEXT    NOT NULL DEFAULT 'pending',        -- pending | settled | reversed (원격엔 CHECK 없음)
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),-- date(created_at) 필터·정렬 기준
  settled_at     TEXT,
  settlement_ref TEXT
);

-- 조회 최적화 인덱스(신규 DB 구축 시). 조회는 partner_code+기간, 정산은 partner_code+status.
CREATE INDEX IF NOT EXISTS idx_partner_commissions_code   ON partner_commissions(partner_code, created_at);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_status ON partner_commissions(status);
