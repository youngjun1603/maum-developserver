-- 회원 프로필 확장: 성별·연령대·핸드폰번호
ALTER TABLE users ADD COLUMN gender    TEXT;   -- '남성' | '여성' | '선택안함'
ALTER TABLE users ADD COLUMN age_range TEXT;   -- '10대' | '20대' | '30대' | '40대' | '50대' | '60대이상'
ALTER TABLE users ADD COLUMN phone     TEXT;   -- '010-XXXX-XXXX'
