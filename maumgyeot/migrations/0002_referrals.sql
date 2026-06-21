-- 마음곁 제휴(어필리에이트) 유입 추적. maumgyeot-db에 적용.
-- ?ref=파트너 로 들어온 방문자가 가입하면 1행 기록 → 파트너별 가입·전환(유료) 정산 통계.

CREATE TABLE IF NOT EXISTS referrals (
  maum_user_id INTEGER PRIMARY KEY,   -- 가입자(공용 maum-auth). 최초 1회만 귀속(first-touch)
  ref          TEXT NOT NULL,         -- 파트너 식별자(?ref 값)
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_referrals_ref ON referrals(ref);
