-- 0004_external_orders.sql (maumgyeot-db)
-- ⚠️ 역기록(back-record) — 원격 maumgyeot-db 에 이미 존재(2026-09-19 실측). 내용은 수달
--    maumotter/migrations/0003_external_orders.sql 과 동일(번호만 다름). 마음풀 통합결제 grant
--    수신 멱등원장. CREATE 파일만 누락돼 있었다(R-03 과 동일 패턴).
-- ⚠️ 프로덕션엔 이미 있어 적용 불필요(IF NOT EXISTS). 신규/스테이징 DB 구축용 기록.
CREATE TABLE IF NOT EXISTS external_orders (
  order_id     TEXT PRIMARY KEY,
  email        TEXT,
  maum_user_id INTEGER,
  grant_type   TEXT,
  status       TEXT DEFAULT 'applied',
  applied_at   TEXT,
  revoked_at   TEXT
);
