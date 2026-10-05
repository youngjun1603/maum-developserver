-- 0031: 파트너 정산 포털 인증 강화 (이메일 인증 + 비밀번호 변경)
-- 추가형·기존 행 무영향. must_change_pw 컬럼은 0028에 이미 존재 → 재추가하지 않음.
-- 전원 재인증 정책: 기존 계정 포함 is_email_verified 기본 0 →
--   첫 로그인 전 이메일 인증 필요(재발송 버튼 + 운영자 수동인증 escape hatch 제공).
-- ⚠️ SQLite는 ADD COLUMN에 IF NOT EXISTS 미지원 → 이 마이그레이션은 1회만 적용.
--    재적용 시 "duplicate column name" 에러(무해)이므로 중복 실행 주의.
-- ⚠️ 적용은 반드시 코드 배포 '이전'에 (컬럼 부재 상태로 게이트 코드가 올라가면
--    로그인 조회가 실패할 수 있으나, 코드가 fail-open으로 방어하므로 잠금은 없음).
ALTER TABLE partner_accounts ADD COLUMN is_email_verified INTEGER NOT NULL DEFAULT 0;
