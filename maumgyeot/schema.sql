-- 마음곁 도메인 스키마 (maumgyeot-db). 계정(users)은 공용 maum-auth에 있음.
-- D1 제약: DROP/RENAME COLUMN·타입변경 불가 → 변경은 ALTER TABLE ADD COLUMN.

-- 반려동물 프로필 (보호자 계정에 종속)
CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maum_user_id INTEGER NOT NULL,        -- 보호자 (공용 maum-auth)
  name TEXT NOT NULL,
  species TEXT NOT NULL,                 -- 'cat' | 'dog' (종 분리 기준)
  breed TEXT,
  age INTEGER,
  personality TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pets_user ON pets(maum_user_id);

-- 관찰 (1건 = 1통역 요청)
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  species TEXT NOT NULL,
  signals_json TEXT,                     -- 선택한 행동 신호 코드 배열
  context TEXT,                          -- 맥락 자유 텍스트
  media_note TEXT,                       -- 영상 원본 비저장; 참고 메모만
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_obs_pet ON observations(pet_id);

-- 통역 리포트
CREATE TABLE IF NOT EXISTS pet_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER NOT NULL,
  pet_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  report_json TEXT NOT NULL,
  health_flag INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rep_user ON pet_reports(maum_user_id);
CREATE INDEX IF NOT EXISTS idx_rep_pet ON pet_reports(pet_id);
