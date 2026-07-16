-- A. AI 해석 피드백 활용: 👎 사유 수집 (프롬프트 개선 데이터셋)
-- 기존 ai_feedback(0023)에 사유 컬럼 추가. 기존 행·기능 영향 없음(NULL 허용).
--   feature는 'integrated'(통합) / 'analyze:PHQ9' 등(단일, 검사코드 포함)으로 세분화해 기록.
--   reason: 'generic'(너무 일반적) | 'mismatch'(내 결과와 안 맞음) | 'long'(너무 길다) | 'other'
ALTER TABLE ai_feedback ADD COLUMN reason TEXT;
