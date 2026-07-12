-- 주간 리포트 이메일 수신 설정 (opt-out 방식)
-- 정보통신망법: 수신거부 수단 제공 필수. users 테이블은 CTS 본체 소유이므로 게임 전용 테이블로 분리한다.
CREATE TABLE IF NOT EXISTS game_email_prefs (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  optout     INTEGER  NOT NULL DEFAULT 0,   -- 1 = 주간 리포트 수신거부
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
