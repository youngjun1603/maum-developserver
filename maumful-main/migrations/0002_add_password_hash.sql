-- ===================================
-- 심리검사 시스템 v2.1 - 비밀번호 해시 컬럼 추가
-- 0002_add_password_hash.sql
-- ===================================

-- users 테이블에 password_hash 컬럼 추가
-- bcrypt 해시값 저장 (예: $2b$10$... 형식, 최대 72바이트 입력, 출력 60자)
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- 마이그레이션 로그 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0002_add_password_hash');
