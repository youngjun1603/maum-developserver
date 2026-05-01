-- ============================================================
-- 0009_referrals_fix.sql
-- referrals 테이블 구조 보정
-- 0004에서 생성 시 UNIQUE(referee_id) 와 completed_at 이 없는 경우 보완
-- ============================================================

-- completed_at 컬럼 추가 (이미 있으면 오류 무시)
ALTER TABLE referrals ADD COLUMN completed_at DATETIME;

-- referee_id 중복 방지 인덱스 (UNIQUE 제약 대신 unique index 로 보완)
-- SQLite 는 기존 테이블에 UNIQUE 제약 추가 불가 → CREATE UNIQUE INDEX 로 대체
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referee_unique ON referrals(referee_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0009_referrals_fix');
