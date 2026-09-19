-- 0003_external_orders.sql (maumotter-db)
-- ⚠️ 역기록(back-record) — 원격 maumotter-db 에 이미 존재(2026-09-19 실측). 마음풀 통합결제
--    grant 수신 멱등원장. 코드(/api/grant·/api/grant/revoke)가 order_id PK 로 멱등 판정하는데
--    CREATE 마이그레이션 파일만 누락돼 있었다(R-03 partner_commissions 와 동일 패턴).
-- ⚠️ 프로덕션엔 이미 있어 적용 불필요(IF NOT EXISTS). 신규/스테이징 DB 구축용 기록.
--    지시서 초안의 created_at·amount 컬럼·CHECK 는 실제 원격 스키마엔 **없다** → 실제대로 기록.
CREATE TABLE IF NOT EXISTS external_orders (
  order_id     TEXT PRIMARY KEY,          -- grant 토큰 orderId. 멱등의 유일 근거
  email        TEXT,
  maum_user_id INTEGER,
  grant_type   TEXT,                       -- PLAN|PACK 키
  status       TEXT DEFAULT 'applied',     -- applied|revoked (CHECK 없음)
  applied_at   TEXT,
  revoked_at   TEXT
);
