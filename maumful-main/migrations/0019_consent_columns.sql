-- ============================================================
-- 0019_consent_columns.sql
-- 이용약관·개인정보 동의 기록 컬럼 추가
-- 개인정보보호법 제22조: 동의 사실·내용 보관 의무
-- ============================================================

ALTER TABLE users ADD COLUMN terms_agreed_at     DATETIME;
ALTER TABLE users ADD COLUMN privacy_agreed_at   DATETIME;
ALTER TABLE users ADD COLUMN marketing_agreed    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN marketing_agreed_at DATETIME;
ALTER TABLE users ADD COLUMN consent_ip          TEXT;
