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
