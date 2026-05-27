// ============================================================
// game_engine.jsx  —  공통 게임 엔진 유틸리티
// 모든 게임 컴포넌트가 사용하는 공유 레이어
// ============================================================

// ── 언어 설정 (전역 — game_registry · game_hub · 각 게임 파일이 참조) ──
const GAME_LANG = new URLSearchParams(location.search).get('lang') || 'ko';
const t = (ko, en) => GAME_LANG === 'en' ? en : ko;

const GameEngine = (() => {
  const TOKEN_KEY = 'game_token';

  // ── 인증 헤더 ──────────────────────────────────────────
  function authHeader() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  // ── 유저 + 게임 상태 조회 ───────────────────────────────
  async function getMe() {
    const res = await fetch('/api/game/me', { headers: authHeader() });
    return res.json();
  }

  // ── 세션 저장 + EXP 적립 ──────────────────────────────
  async function saveSession({ gameId, moduleType, score, durationSec, metadata }) {
    const res = await fetch('/api/game/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        game_id: gameId,
        module_type: moduleType,
        score,
        duration_sec: durationSec,
        metadata,
      }),
    });
    return res.json();
  }

  // ── 게임 세션 이력 조회 ─────────────────────────────────
  async function getRecentSessions(limit = 20) {
    const res = await fetch(`/api/game/sessions?limit=${limit}`, { headers: authHeader() });
    return res.json();
  }

  // ── 게임 완료 AI 피드백 ──────────────────────────────────
  async function getSessionFeedback(gameId, score, moduleType) {
    const res = await fetch('/api/game/session-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ game_id: gameId, score, module_type: moduleType }),
    });
    return res.json();
  }

  // ── SCT 문장 AI 변환 ────────────────────────────────────
  async function transformSentence(text) {
    const res = await fetch('/api/game/ai-transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ text }),
    });
    return res.json();
  }

  // ── 정원 시각 상태 업데이트 ─────────────────────────────
  async function updateVisual(phq9Score) {
    const res = await fetch('/api/game/visual', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ phq9_score: phq9Score }),
    });
    return res.json();
  }

  // ── 레벨 정보 계산 ──────────────────────────────────────
  const LEVELS = [
    { level:1, name: t('씨앗',     'Seed'),      emoji:'🌱', minExp:0,    maxExp:100  },
    { level:2, name: t('새싹',     'Sprout'),    emoji:'🌿', minExp:100,  maxExp:250  },
    { level:3, name: t('꽃봉오리', 'Bud'),       emoji:'🌸', minExp:250,  maxExp:500  },
    { level:4, name: t('꽃피움',   'Blooming'),  emoji:'🌺', minExp:500,  maxExp:900  },
    { level:5, name: t('만개',     'Full Bloom'),emoji:'🌳', minExp:900,  maxExp:1500 },
    { level:6, name: t('정원사',   'Gardener'),  emoji:'🏡', minExp:1500, maxExp:9999 },
  ];

  function getLevelInfo(exp) {
    const info = [...LEVELS].reverse().find(l => exp >= l.minExp) || LEVELS[0];
    const nextLevel = LEVELS[info.level] || null; // level is 1-indexed, array 0-indexed
    const progress = nextLevel
      ? Math.round(((exp - info.minExp) / (info.maxExp - info.minExp)) * 100)
      : 100;
    return { ...info, nextLevel, progress, currentExp: exp };
  }

  // ── 정원 상태 → 배경 스타일 매핑 ──────────────────────
  const GARDEN_THEMES = {
    foggy: {
      sky:    ['#9BA8B0', '#C5CFD6', '#D8DFE4'],
      ground: '#7A8A7A',
      label:  t('안개가 자욱한 정원', 'Foggy Garden'),
      desc:   t('지금은 많이 힘드시죠. 함께 조금씩 걷어내요.', "It's been tough. Let's clear the fog together."),
    },
    clearing: {
      sky:    ['#7FA8C8', '#A8C8E0', '#C8DFF0'],
      ground: '#5E8A4E',
      label:  t('맑아지는 정원', 'Clearing Garden'),
      desc:   t('안개가 걷히고 있어요. 잘 하고 계세요.', "The fog is lifting. You're doing great."),
    },
    blooming: {
      sky:    ['#4A8EC2', '#7BB8D8', '#A8D4E8'],
      ground: '#4A7A3E',
      label:  t('꽃이 피는 정원', 'Blooming Garden'),
      desc:   t('정원이 활짝 피어있어요. 오늘도 수고했어요.', 'Your garden is in full bloom. Well done today.'),
    },
  };

  function getGardenTheme(visualStatus) {
    return GARDEN_THEMES[visualStatus] || GARDEN_THEMES.clearing;
  }

  // ── 업적 정보 ───────────────────────────────────────────
  const ACHIEVEMENTS = {
    // ── 기본 ─────────────────────────────────────────────
    first_play:      { name: t('첫 발걸음',    'First Steps'),         emoji: '🚶', desc: t('처음으로 게임을 플레이했어요',       'Played a game for the first time') },
    // ── 연속 출석 ─────────────────────────────────────────
    streak_3:        { name: t('3일 연속',     '3-Day Streak'),        emoji: '🔥', desc: t('3일 연속 방문했어요',               'Visited 3 days in a row') },
    streak_7:        { name: t('일주일의 기적', "Week's Miracle"),      emoji: '🔥', desc: t('7일 연속 방문했어요',               'Visited 7 days in a row') },
    streak_14:       { name: t('두 주의 여정', 'Two-Week Journey'),    emoji: '🔥', desc: t('14일 연속 방문했어요',              'Visited 14 days in a row') },
    perfect_week:    { name: t('완벽한 한 주', 'Perfect Week'),        emoji: '🌟', desc: t('7일 모두 빠짐없이 정원에 왔어요',   'Visited every day for 7 days') },
    // ── 레벨 ─────────────────────────────────────────────
    level_3:         { name: t('꽃봉오리',     'Bud'),                 emoji: '🌸', desc: t('레벨 3에 도달했어요',               'Reached level 3') },
    level_5:         { name: t('만개',         'Full Bloom'),          emoji: '🌳', desc: t('레벨 5에 도달했어요',               'Reached level 5') },
    // ── 경험치 ───────────────────────────────────────────
    exp_500:         { name: t('성실한 정원사', 'Diligent Gardener'),   emoji: '🏅', desc: t('경험치 500 달성',                   'Reached 500 EXP') },
    exp_1000:        { name: t('숙련된 정원사', 'Skilled Gardener'),    emoji: '🥇', desc: t('경험치 1000 달성',                  'Reached 1,000 EXP') },
    // ── 게임별 숙련 ───────────────────────────────────────
    breath_master:   { name: t('호흡 명인',    'Breath Master'),       emoji: '💧', desc: t('호흡 훈련을 10회 완료했어요',       'Completed 10 breathing sessions') },
    cbt_master:      { name: t('생각 교정사',  'Thought Reformer'),    emoji: '🌱', desc: t('생각 교정을 5회 완료했어요',        'Completed 5 thought reframing sessions') },
    burnout_fighter: { name: t('번아웃 극복',  'Burnout Fighter'),     emoji: '⚡', desc: t('번아웃 미션을 5일 완료했어요',      'Completed burnout missions for 5 days') },
    // ── 감정 수채화 ───────────────────────────────────────
    mood_7:          { name: t('감정 탐험가',  'Emotion Explorer'),    emoji: '🎨', desc: t('7일 연속 감정을 기록했어요',        'Logged emotions 7 days in a row') },
    mood_30:         { name: t('감정 예술가',  'Emotion Artist'),      emoji: '🖼️', desc: t('감정 기록을 30번 완료했어요',       'Completed 30 emotion logs') },
    // ── 감사 일기 ─────────────────────────────────────────
    gratitude_7:     { name: t('별빛 수집가',  'Starlight Collector'), emoji: '🌠', desc: t('7일 연속 감사 일기를 썼어요',       'Wrote a gratitude journal 7 days in a row') },
    // ── 탐험 ─────────────────────────────────────────────
    all_games:       { name: t('정원 탐험가',  'Garden Explorer'),     emoji: '🗺️', desc: t('5가지 이상 게임을 모두 경험했어요', 'Experienced 5 or more games') },
  };

  function getAchievementInfo(id) {
    return ACHIEVEMENTS[id] || { name: id, emoji: '🏆', desc: '' };
  }

  // ── 시간 포맷 ───────────────────────────────────────────
  function formatDuration(sec) {
    if (sec < 60) return t(`${sec}초`, `${sec}s`);
    return t(`${Math.floor(sec / 60)}분 ${sec % 60}초`, `${Math.floor(sec / 60)}m ${sec % 60}s`);
  }

  function formatRelativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t('방금 전', 'Just now');
    if (min < 60) return t(`${min}분 전`, `${min}m ago`);
    const hr = Math.floor(min / 60);
    if (hr < 24) return t(`${hr}시간 전`, `${hr}h ago`);
    return t(`${Math.floor(hr / 24)}일 전`, `${Math.floor(hr / 24)}d ago`);
  }

  // ── 검사 점수 저장 ──────────────────────────────────────
  async function saveScore(testType, score) {
    const res = await fetch('/api/game/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ test_type: testType, score }),
    });
    return res.json();
  }

  // ── 크레딧 잔액 실시간 조회 ───────────────────────────
  async function getCredits() {
    const res = await fetch('/api/game/credits', { headers: authHeader() });
    return res.json();
  }

  // ── 게임 크레딧 차감 ────────────────────────────────────
  // returns: { success, data: { balance, spent } } | { success:false, error, errorCode, balance }
  async function spendCredit(gameId, amount) {
    if (!amount || amount <= 0) return { success: true, data: { balance: null, spent: 0 } };
    const res = await fetch('/api/game/spend-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ game_id: gameId, amount }),
    });
    return res.json();
  }

  // ── 리더보드 조회 ────────────────────────────────────────
  async function getLeaderboard() {
    const res = await fetch('/api/game/leaderboard', { headers: authHeader() });
    return res.json();
  }

  // ── AI 일일 코치 메시지 ──────────────────────────────────
  async function getDailyTip(context) {
    const res = await fetch('/api/game/daily-tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(context),
    });
    return res.json();
  }

  // ── 감정 체크인 기록 조회 ────────────────────────────────
  async function getMoodHistory(days = 30) {
    const res = await fetch(`/api/game/mood-history?days=${days}`, { headers: authHeader() });
    return res.json();
  }

  // ── 감정 AI 주간 리포트 ──────────────────────────────────
  async function getEmotionReport() {
    const res = await fetch('/api/game/emotion-report', { headers: authHeader() });
    return res.json();
  }

  // ── 게임 통계 조회 ───────────────────────────────────────
  async function getGameStats() {
    const res = await fetch('/api/game/stats', { headers: authHeader() });
    return res.json();
  }

  // ── 번아웃 히스토리 조회 ─────────────────────────────────
  async function getBurnoutHistory() {
    const res = await fetch('/api/game/burnout-history', { headers: authHeader() });
    return res.json();
  }

  // ── 스트릭 복구권 사용 ───────────────────────────────────
  async function recoverStreak() {
    const res = await fetch('/api/game/streak/recover', { method: 'POST', headers: authHeader() });
    return res.json();
  }

  // ── 캠페인 진행 조회 ─────────────────────────────────────
  async function getCampaign() {
    const res = await fetch('/api/game/campaign', { headers: authHeader() });
    return res.json();
  }

  // ── 캠페인 챕터 보상 수령 ────────────────────────────────
  async function claimCampaign(chapterId) {
    const res = await fetch('/api/game/campaign/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ chapter_id: chapterId }),
    });
    return res.json();
  }

  // ── 인증 헤더 포함 범용 fetch ────────────────────────────
  async function apiFetch(path, init = {}) {
    return fetch(path, { ...init, headers: { ...authHeader(), ...(init.headers || {}) } });
  }

  return {
    getMe, saveSession, transformSentence, updateVisual,
    getCredits, spendCredit, saveScore,
    getLeaderboard, getDailyTip, getMoodHistory, getEmotionReport, getGameStats, getBurnoutHistory,
    getRecentSessions, getSessionFeedback,
    recoverStreak, getCampaign, claimCampaign, apiFetch,
    getLevelInfo, getGardenTheme, getAchievementInfo,
    formatDuration, formatRelativeTime,
    LEVELS,
  };
})();

// 마음풀 URL (maumgame은 마음풀에서 JWT SSO로 진입)
const PHYWEB_URL = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  return 'https://maumful.com';  // 마음풀 메인 홈페이지
})();
// 별칭 (기존 코드 호환)
const MAUMFUL_URL = PHYWEB_URL;
