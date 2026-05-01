-- ===================================
-- 심리검사 시스템 v3.1 - API 설정 테이블 추가
-- 0003_add_api_settings.sql
-- ===================================

-- API 설정 테이블 (관리자가 등록하는 외부 API 키 관리)
CREATE TABLE IF NOT EXISTS api_settings (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  key_name  TEXT UNIQUE NOT NULL,          -- 설정 키 이름 (예: ANTHROPIC_API_KEY)
  key_value TEXT NOT NULL,                 -- 암호화된 API 키 값
  is_active INTEGER DEFAULT 1,            -- 활성 여부 (1: 활성, 0: 비활성)
  description TEXT,                        -- 설명
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_api_settings_key_name ON api_settings(key_name);
CREATE INDEX IF NOT EXISTS idx_api_settings_is_active ON api_settings(is_active);

-- 마이그레이션 로그
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0003_add_api_settings');
