-- ============================================================
-- 0005_counseling.sql
-- 상담센터 예약 시스템 (1단계)
-- ============================================================

-- ① 상담센터 테이블
CREATE TABLE IF NOT EXISTS counseling_centers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  logo_emoji      TEXT DEFAULT '🏥',
  description     TEXT,
  address         TEXT,
  specialty_tags  TEXT,                       -- JSON 배열: '["우울","불안","가족"]'
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','active','suspended')),
  contact_email   TEXT,
  contact_phone   TEXT,
  website_url     TEXT,
  commission_rate INTEGER DEFAULT 10,         -- 플랫폼 수수료 %
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ② 상담사 테이블
CREATE TABLE IF NOT EXISTS counselors (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id       INTEGER NOT NULL REFERENCES counseling_centers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  photo_emoji     TEXT DEFAULT '👤',
  title           TEXT,                       -- 직함: "임상심리사 2급"
  bio             TEXT,
  specialties     TEXT,                       -- JSON 배열
  credentials     TEXT,                       -- JSON 배열: 자격증 목록
  fee_per_session INTEGER NOT NULL DEFAULT 80000,  -- 원
  session_minutes INTEGER DEFAULT 50,
  available_types TEXT DEFAULT '["video","phone","visit"]', -- JSON
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK(status IN ('active','inactive')),
  avg_rating      REAL DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ③ 상담사 가용 시간 슬롯 (반복 패턴)
CREATE TABLE IF NOT EXISTS counselor_schedules (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  counselor_id    INTEGER NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 0=일,1=월…
  start_time      TEXT NOT NULL,              -- "09:00"
  end_time        TEXT NOT NULL,              -- "18:00"
  slot_minutes    INTEGER DEFAULT 60
);

-- ④ 예약 테이블
CREATE TABLE IF NOT EXISTS appointments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id    INTEGER NOT NULL REFERENCES counselors(id),
  center_id       INTEGER NOT NULL REFERENCES counseling_centers(id),
  scheduled_at    DATETIME NOT NULL,
  duration_min    INTEGER DEFAULT 50,
  session_type    TEXT NOT NULL DEFAULT 'video'
                  CHECK(session_type IN ('video','phone','visit')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','confirmed','completed','cancelled','no_show')),
  fee_amount      INTEGER NOT NULL,
  pg              TEXT DEFAULT 'toss',
  pg_tid          TEXT,
  paid_at         DATETIME,
  video_room_id   TEXT,                       -- Jitsi room name
  video_room_url  TEXT,
  user_memo       TEXT,
  counselor_note  TEXT,
  cancelled_at    DATETIME,
  cancel_reason   TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑤ 리뷰 테이블
CREATE TABLE IF NOT EXISTS counseling_reviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id  INTEGER NOT NULL REFERENCES appointments(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  counselor_id    INTEGER NOT NULL REFERENCES counselors(id),
  rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  content         TEXT,
  is_anonymous    INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ⑥ 인덱스
CREATE INDEX IF NOT EXISTS idx_counselors_center    ON counselors(center_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user    ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_counselor ON appointments(counselor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reviews_counselor    ON counseling_reviews(counselor_id);

-- ⑦ 데모 데이터: 상담센터 3곳 (모두 제휴 진행중)
INSERT OR IGNORE INTO counseling_centers (id, name, logo_emoji, description, address, specialty_tags, status, contact_email, contact_phone, commission_rate)
VALUES
(1, '마음숲 심리상담센터', '🌲',
 '우울·불안·대인관계 전문. 따뜻하고 안전한 공간에서 내면의 회복을 돕습니다.',
 '서울 강남구 테헤란로 123',
 '["우울","불안","대인관계","자존감","직장스트레스"]',
 'pending', 'contact@maumsup.kr', '02-1234-5678', 10),

(2, '행복한마음 심리치유센터', '🌻',
 '가족·부부 상담과 트라우마 치료 전문. 15년 임상 경험의 전문 상담사들이 함께합니다.',
 '서울 서초구 방배로 456',
 '["가족","부부","트라우마","PTSD","아동청소년"]',
 'pending', 'info@happymind.kr', '02-9876-5432', 10),

(3, '서울 인지행동 상담클리닉', '🧩',
 'CBT·마음챙김 기반 인지행동치료 전문 클리닉. 번아웃·강박·공황 전문.',
 '서울 마포구 홍대입구로 789',
 '["번아웃","강박","공황","CBT","마음챙김"]',
 'pending', 'hello@cbt-seoul.kr', '02-5555-1234', 10);

-- ⑧ 데모 데이터: 상담사 5명
INSERT OR IGNORE INTO counselors (id, center_id, name, photo_emoji, title, bio, specialties, credentials, fee_per_session, session_minutes, available_types, avg_rating, review_count)
VALUES
(1, 1, '김하은', '👩', '상담심리사 1급',
 '10년간 우울·불안 전문 상담. 따뜻하고 비판 없는 공간을 만들어 드립니다. 서울대 심리학 박사.',
 '["우울","불안","자존감","대인관계"]',
 '["상담심리사 1급","임상심리사 2급"]',
 90000, 50, '["video","phone","visit"]', 4.9, 127),

(2, 1, '박준서', '👨', '임상심리사 1급',
 '직장인 스트레스와 번아웃 전문. CBT·ACT 통합 접근법을 활용합니다.',
 '["직장스트레스","번아웃","자존감"]',
 '["임상심리사 1급","직업상담사"]',
 80000, 50, '["video","phone"]', 4.7, 89),

(3, 2, '이수민', '👩', '가족상담사 수퍼바이저',
 '15년 가족·부부 상담 경험. 갈등 해결과 소통 회복을 돕습니다.',
 '["가족","부부","이혼","자녀양육"]',
 '["가족상담사 수퍼바이저","부부상담전문가"]',
 100000, 60, '["video","visit"]', 4.8, 203),

(4, 2, '최지영', '👩', '아동청소년 상담전문가',
 '트라우마와 PTSD 전문. EMDR 공인 치료사. 안전하고 신뢰로운 치유 공간을 제공합니다.',
 '["트라우마","PTSD","아동청소년"]',
 '["EMDR 공인치료사","놀이치료사 2급"]',
 120000, 60, '["video","visit"]', 4.9, 156),

(5, 3, '정민호', '👨', 'CBT 전문 상담사',
 '인지행동치료 10년 경력. 공황장애·강박장애 전문. 근거기반 치료를 지향합니다.',
 '["공황","강박","CBT","마음챙김"]',
 '["임상심리사 2급","CBT 전문자격"]',
 85000, 50, '["video","phone"]', 4.6, 74);

-- ⑨ 데모 스케줄 (월~금 09:00~18:00)
INSERT OR IGNORE INTO counselor_schedules (counselor_id, day_of_week, start_time, end_time)
SELECT id, dow, '09:00', '18:00'
FROM counselors, (SELECT 1 AS dow UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5)
WHERE counselors.id IN (1,2,3,4,5);

INSERT OR IGNORE INTO counselor_schedules (counselor_id, day_of_week, start_time, end_time)
SELECT id, 6, '10:00', '15:00'
FROM counselors WHERE counselors.id IN (1,3,5);
