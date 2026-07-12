-- 검사 ↔ 게임 루프 계측 (③ 검사→게임 처방, ⑥ 게임→검사 제안)
-- 검사 완료·게임 플레이는 test_history·game_session_logs에 이미 있으므로,
-- 여기엔 "그 사이의 클릭"만 남긴다. 집계 전용이라 개인 식별 정보는 넣지 않는다.
CREATE TABLE IF NOT EXISTS loop_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event      TEXT     NOT NULL,   -- report_view | rx_click | suggestion_view | suggestion_click
  meta       TEXT,                -- rx_click=게임 id / suggestion_*=검사 코드
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_loop_events_created ON loop_events(created_at);
CREATE INDEX IF NOT EXISTS idx_loop_events_user    ON loop_events(user_id, event);
