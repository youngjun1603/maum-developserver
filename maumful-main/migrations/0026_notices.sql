-- 공지사항 (2026-07-20)
-- 이용약관·개인정보처리방침이 약속한 고지 수단(서비스 종료 30일 전, 약관 개정 7일 전)의 실체.
-- 어드민에서 등록 → 사용자는 목록 페이지에서 보고, is_important=1이면 대시보드 상단 배너로도 노출.
CREATE TABLE IF NOT EXISTS notices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  content      TEXT    NOT NULL,
  is_important INTEGER NOT NULL DEFAULT 0,  -- 1 = 대시보드 상단 배너 노출
  is_published INTEGER NOT NULL DEFAULT 1,  -- 0 = 임시저장(사용자에게 안 보임)
  created_at   TEXT    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT    DEFAULT CURRENT_TIMESTAMP
);

-- 공개 목록 조회(발행된 것만 최신순) 최적화
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published, created_at DESC);
