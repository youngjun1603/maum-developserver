-- 마음 시리즈 공용 인증 D1: maum-auth
-- 적용: Cloudflare 대시보드 → D1 → maum-auth → Console 에 붙여넣기 실행.
-- 이 D1은 마음수달·마음곁(향후 마음게임·마음커플) Worker에 동일하게 바인딩(AUTH_DB).
-- 계정(통합 마음 ID)만 보유. 각 서비스 도메인 데이터는 각자 D1에서 maum_user_id 로 참조.
-- ⚠️ 운영 중 변경은 ALTER TABLE ADD COLUMN 만.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,   -- = maum_user_id (JWT payload)
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                        -- PBKDF2(saltHex:hashHex)
  name          TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- 2026-09-19 역기록(R-07): 원격 maum-auth.users 에 운영 중 추가돼 이미 존재하는 컬럼.
--   수달·곁 isEmailVerified 가 참조(컬럼 없으면 fail-open=true 였음). 실제 원격 = nullable INTEGER DEFAULT 0.
--   운영 반영은 ALTER 만(위 CREATE 는 기존 DB 에 적용 안 됨).
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
