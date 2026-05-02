-- test_history에 점수 컬럼 추가 (검사 점수 트렌드 추적용)
ALTER TABLE test_history ADD COLUMN score INTEGER;
ALTER TABLE test_history ADD COLUMN level TEXT;
