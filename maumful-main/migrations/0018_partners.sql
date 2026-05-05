-- 파트너 채널 테이블
-- partner_code: 영문 대문자+언더스코어 (예: KAKAO_HEALTH, NAVER_CAFE)
CREATE TABLE IF NOT EXISTS partners (
  code              TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  sso_secret        TEXT,           -- HMAC-SHA256 서명 검증용 시크릿 (null이면 SSO 미지원)
  revenue_share_rate REAL NOT NULL DEFAULT 0.0,  -- 마음풀 직접결제 수익 쉐어 비율 (0.0~1.0)
  welcome_message   TEXT,           -- 파트너 진입 시 환영 메시지
  featured_tests    TEXT,           -- 파트너 추천 검사 목록 (쉼표 구분, 예: PHQ9,BURNOUT)
  primary_color     TEXT,           -- 파트너 브랜드 컬러 (예: #FEE500)
  logo_url          TEXT,           -- 파트너 로고 이미지 URL
  contact_email     TEXT,           -- 정산 담당자 이메일
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- users 테이블에 파트너 유입 채널 추가
ALTER TABLE users ADD COLUMN partner_code TEXT;

-- credit_charges 테이블에 파트너 코드 승계 (마음풀 직접결제 귀속)
ALTER TABLE credit_charges ADD COLUMN partner_code TEXT;
