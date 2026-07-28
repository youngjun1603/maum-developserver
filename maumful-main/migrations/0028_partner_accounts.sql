-- 파트너 담당자 포털 계정 (제휴사 담당자가 직접 로그인해 자기 정산만 조회)
-- 격리: 계정은 하나의 partner_code에 귀속. 포털 토큰(typ=partner)은 이 코드만 조회 가능.
CREATE TABLE IF NOT EXISTS partner_accounts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_code   TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  is_active      INTEGER NOT NULL DEFAULT 1,
  must_change_pw INTEGER NOT NULL DEFAULT 0,
  last_login_at  TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_code  ON partner_accounts(partner_code);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_email ON partner_accounts(email);
