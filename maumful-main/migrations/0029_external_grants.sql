-- 외부 서비스 통합결제 grant 큐 (마음풀에서 팔고 외부 서비스에 지급 전달)
-- ⚠️ 기존 코드(deliverGrant)가 이 테이블을 INSERT/UPDATE 하는데 CREATE가 어디에도 없었음
--    → 수달·곁 grant가 실제론 실패 상태였음. 이 마이그레이션으로 정상화.
-- order_id(=mf_charge_<chargeId>) PK로 멱등. code = phyweb 등 쿠폰형 서비스가 돌려준 등록코드 저장.
CREATE TABLE IF NOT EXISTS external_grants (
  order_id     TEXT PRIMARY KEY,
  user_id      INTEGER,
  email        TEXT,
  service      TEXT NOT NULL,
  grant_type   TEXT NOT NULL,
  amount       INTEGER,
  status       TEXT NOT NULL DEFAULT 'pending',   -- pending | delivered | failed
  code         TEXT,                              -- 쿠폰형(phyweb) 응답 코드
  attempts     INTEGER NOT NULL DEFAULT 0,
  delivered_at DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_external_grants_status ON external_grants(status);
CREATE INDEX IF NOT EXISTS idx_external_grants_user   ON external_grants(user_id);
