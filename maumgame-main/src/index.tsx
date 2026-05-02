import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ── 타입 ───────────────────────────────────────────────────
type Bindings = {
  DB:               D1Database
  KV:               KVNamespace
  JWT_SECRET?:      string
  ANTHROPIC_API_KEY?: string
  RESEND_API_KEY?:  string
  MAUMFUL_URL?:      string
  SERVICE_URL?:     string
}

type GameUser = {
  id: number; email: string; nickname: string | null
  credits: number; locale: string
}
type GameStatus = {
  user_id: number; garden_level: number; total_exp: number
  visual_status: string; streak_days: number
  last_played_at: string; unlocked_games: string
}

// ── 레벨 테이블 ────────────────────────────────────────────
const LEVEL_TABLE = [
  { level:1, name:'씨앗',   minExp:0,    maxExp:100  },
  { level:2, name:'새싹',   minExp:100,  maxExp:250  },
  { level:3, name:'꽃봉오리',minExp:250,  maxExp:500  },
  { level:4, name:'꽃피움', minExp:500,  maxExp:900  },
  { level:5, name:'만개',   minExp:900,  maxExp:1500 },
  { level:6, name:'정원사', minExp:1500, maxExp:9999 },
]
function getLevelInfo(exp: number) {
  const info = LEVEL_TABLE.findLast(l => exp >= l.minExp) || LEVEL_TABLE[0]
  return info
}

// ── PHQ-9 점수 → 정원 상태 ─────────────────────────────────
function calcVisualStatus(phq9Score: number | null): 'foggy'|'clearing'|'blooming' {
  if (phq9Score === null) return 'clearing'
  if (phq9Score >= 15) return 'foggy'
  if (phq9Score >= 5)  return 'clearing'
  return 'blooming'
}

// ── 마스터(테스트) 계정 ─────────────────────────────────────
const MASTER_EMAILS = ['limyj007@gmail.com']
function isMasterAccount(email: string | null | undefined): boolean {
  return !!email && MASTER_EMAILS.includes(email.toLowerCase())
}

// ── JWT 검증 (phyweb 과 동일 시크릿) ─────────────────────
async function verifyJWT(token: string, secret: string): Promise<number|null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [hdr, payload, sig] = parts
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name:'HMAC', hash:'SHA-256' }, false, ['verify']
    )
    const decode = (s: string) => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, decode(sig), new TextEncoder().encode(`${hdr}.${payload}`))
    if (!valid) return null
    const p = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')))
    if (p.exp && Date.now()/1000 > p.exp) return null
    return Number(p.sub || p.id || p.userId) || null
  } catch { return null }
}

async function getGameUserId(req: Request, env: Bindings): Promise<number|null> {
  // KV에 저장된 secret 우선 사용 (maumful과 동일한 방식)
  const secret = (env.KV ? await (env.KV as KVNamespace).get('JWT_SECRET') : null) ?? env.JWT_SECRET
  if (!secret) return null
  const auth = req.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : new URL(req.url).searchParams.get('t') || ''
  if (!token) return null
  return verifyJWT(token, secret)
}

// ── 메인 앱 ────────────────────────────────────────────────
const app = new Hono<{ Bindings: Bindings }>()
// 정적 파일은 Cloudflare Assets가 자동 처리 ([assets] 설정)
app.use('/api/*', cors())

// ── HTML 서빙 ──────────────────────────────────────────────
const HTML = (v: string) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>마음의 정원 — 마음풀</title>
  <meta name="description" content="심리검사 결과를 바탕으로 나만의 마음 정원을 가꾸는 치유 게임">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/static/icon-192.png">
  <meta name="theme-color" content="#4A7C59">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="마음게임">
  <meta property="og:title" content="마음의 정원 — 마음풀">
  <meta property="og:description" content="심리검사 결과를 바탕으로 나만의 마음 정원을 가꾸는 치유 게임">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/static/icon-512.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Noto Sans KR',sans-serif;background:#FDFCF7;color:#2C2C20;-webkit-font-smoothing:antialiased}
    #root{min-height:100vh}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}
    @keyframes grow{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1);transform-origin:bottom}}
    @keyframes shimmer{0%{opacity:.3}50%{opacity:.7}100%{opacity:.3}}
  </style>
  <meta http-equiv="Cache-Control" content="no-cache">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="/static/game_engine.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/game_registry.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/garden.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/efmt.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/gratitude.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/tree.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/burnout.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/games/mood.jsx?v=${v}"></script>
  <script type="text/babel" src="/static/game_hub.jsx?v=${v}"></script>
  <script>
    // URL ?t= 파라미터로 maumful JWT 토큰 수신 (SSO — 별도 로그인 불필요)
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    const gameParam = urlParams.get('game');
    if (t) {
      localStorage.setItem('game_token', t);
      // ?game= 파라미터는 보존하여 game_hub.jsx가 자동 실행할 수 있도록
      const nextUrl = gameParam ? '/?game=' + encodeURIComponent(gameParam) : '/';
      window.history.replaceState({}, '', nextUrl);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  </script>
</body>
</html>`

app.get('/favicon.ico', async (c) => {
  // maumful과 동일한 favicon 사용
  return fetch('https://maumful.limyj007.workers.dev/favicon.ico')
})

app.get('/favicon.png', async (c) => {
  return fetch('https://maumful.limyj007.workers.dev/favicon.png')
})

app.get('/', c => c.html(HTML(Date.now().toString(36))))

// ══════════════════════════════════════════════════════════
// 게임 API
// ══════════════════════════════════════════════════════════

// ── GET /api/game/me ───────────────────────────────────────
// 유저 정보 + 게임 상태 + 최근 세션 + 연동된 검사 조회
app.get('/api/game/me', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  // phyweb users 테이블에서 유저 정보
  const user = await DB.prepare(
    'SELECT id, email, nickname, credits, locale FROM users WHERE id=?'
  ).bind(userId).first<GameUser>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  // 게임 상태 조회 (없으면 자동 생성)
  let status = await DB.prepare(
    'SELECT * FROM user_game_status WHERE user_id=?'
  ).bind(userId).first<GameStatus>()

  if (!status) {
    // PHQ-9 최신 점수로 초기 visual_status 결정
    const phq9 = await DB.prepare(
      "SELECT performed_at FROM test_history WHERE user_id=? AND test_type='PHQ9' ORDER BY performed_at DESC LIMIT 1"
    ).bind(userId).first<{ performed_at: string }>()

    // PHQ-9 점수를 실제로 가져오려면 결과 테이블 필요 (현재 phyweb은 프라이버시상 저장 안함)
    // → 수행 이력만으로 'clearing' 기본값 사용, 게임 내에서 사용자가 직접 입력한 score 기반 조정
    const vs = phq9 ? 'clearing' : 'clearing'
    await DB.prepare(
      "INSERT INTO user_game_status (user_id, visual_status) VALUES (?, ?)"
    ).bind(userId, vs).run()
    status = await DB.prepare('SELECT * FROM user_game_status WHERE user_id=?').bind(userId).first<GameStatus>()
  }

  // 최근 세션 5개
  const sessions = await DB.prepare(
    'SELECT game_id, module_type, score, exp_gained, duration_sec, created_at FROM game_session_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 5'
  ).bind(userId).all()

  // 수행한 검사 목록
  const tests = await DB.prepare(
    'SELECT DISTINCT test_type FROM test_history WHERE user_id=? ORDER BY performed_at DESC'
  ).bind(userId).all()

  // 업적
  const achievements = await DB.prepare(
    'SELECT achievement_id, earned_at FROM game_achievements WHERE user_id=?'
  ).bind(userId).all()

  // 게임 내 자가 입력 검사 점수
  const testScoresRaw = await DB.prepare(
    'SELECT test_type, score FROM user_test_scores WHERE user_id=?'
  ).bind(userId).all().catch(() => ({ results: [] }))
  const userTestScores: Record<string, number> = {}
  for (const r of testScoresRaw.results as { test_type: string; score: number }[]) {
    userTestScores[r.test_type] = r.score
  }

  // 최근 7일 플레이 날짜 (streak 캘린더용)
  const playDatesRaw = await DB.prepare(
    "SELECT DISTINCT date(created_at) as play_date FROM game_session_logs WHERE user_id=? AND created_at >= date('now','-6 days')"
  ).bind(userId).all()
  const recentPlayDates = (playDatesRaw.results as { play_date: string }[]).map(r => r.play_date)

  // 오늘 세션 목록 (데일리 퀘스트 진행 확인용)
  const todaySessionsRaw = await DB.prepare(
    "SELECT game_id, module_type, score FROM game_session_logs WHERE user_id=? AND date(created_at)=date('now')"
  ).bind(userId).all()
  const todaySessions = (todaySessionsRaw.results as { game_id: string; module_type: string; score: number }[])

  const levelInfo = getLevelInfo(status?.total_exp || 0)

  // 마스터 계정: 모든 게임 해금 + 모든 검사 완료 처리
  const allGames = ['garden', 'mood', 'efmt', 'gratitude', 'tree', 'burnout']
  const allTests = ['PHQ9', 'GAD7', 'DASS21', 'BIG5', 'LOST', 'SCT', 'DSI', 'BURNOUT']
  const master   = isMasterAccount(user.email)

  return c.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, nickname: user.nickname, credits: user.credits },
      gameStatus: {
        ...status,
        levelInfo: master ? { ...getLevelInfo(9999), currentExp: 9999 } : levelInfo,
        garden_level: master ? 6 : (status?.garden_level || 1),
        unlockedGames: master ? allGames : JSON.parse(status?.unlocked_games || '["garden"]'),
      },
      recentSessions: sessions.results,
      completedTests: master ? allTests : (tests.results as { test_type: string }[]).map(r => r.test_type),
      achievements: achievements.results,
      isMaster: master,
      userTestScores: master ? { PHQ9: 0, BURNOUT: 30, GAD7: 0 } : userTestScores,
      recentPlayDates,
      todaySessions,
    },
  })
})

// ── GET /api/game/stats ────────────────────────────────────
// 게임별 플레이 횟수 + 베스트 스코어 + 이번 주 요약
app.get('/api/game/stats', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const [perGame, weekSummary, monthSummary] = await Promise.all([
    DB.prepare(
      `SELECT game_id, COUNT(*) as play_count, MAX(score) as best_score,
              SUM(exp_gained) as total_exp, MAX(created_at) as last_played
       FROM game_session_logs WHERE user_id=? GROUP BY game_id ORDER BY play_count DESC`
    ).bind(userId).all(),
    DB.prepare(
      `SELECT COUNT(*) as play_count, COALESCE(SUM(exp_gained),0) as exp_gained
       FROM game_session_logs WHERE user_id=? AND created_at >= date('now','-6 days')`
    ).bind(userId).first<{ play_count: number; exp_gained: number }>(),
    DB.prepare(
      `SELECT COUNT(*) as play_count, COALESCE(SUM(exp_gained),0) as exp_gained
       FROM game_session_logs WHERE user_id=? AND created_at >= date('now','-29 days')`
    ).bind(userId).first<{ play_count: number; exp_gained: number }>(),
  ])

  return c.json({
    success: true,
    data: {
      perGame: perGame.results,
      week:  { playCount: weekSummary?.play_count || 0,  expGained: weekSummary?.exp_gained || 0 },
      month: { playCount: monthSummary?.play_count || 0, expGained: monthSummary?.exp_gained || 0 },
    },
  })
})

// ── POST /api/game/session ─────────────────────────────────
// 게임 세션 저장 + 경험치 적립 + 레벨업 체크 + 업적 확인
app.post('/api/game/session', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const body = await c.req.json() as {
    game_id: string; module_type: string
    score: number; duration_sec: number; metadata?: Record<string, unknown>
  }
  const { game_id, module_type, score, duration_sec, metadata } = body

  // EXP 계산 (점수 + 시간 기반)
  const baseExp   = Math.floor(score * 0.5)
  const timeBonus = Math.min(Math.floor(duration_sec / 10), 20)
  const expGained = baseExp + timeBonus + 10 // 완료 보너스 10

  // 세션 기록
  await DB.prepare(
    'INSERT INTO game_session_logs (user_id, game_id, module_type, score, exp_gained, duration_sec, metadata) VALUES (?,?,?,?,?,?,?)'
  ).bind(userId, game_id, module_type, score, expGained, duration_sec, metadata ? JSON.stringify(metadata) : null).run()

  // EXP 누적 + 레벨업 체크
  const oldStatus = await DB.prepare('SELECT * FROM user_game_status WHERE user_id=?').bind(userId).first<GameStatus>()
  if (!oldStatus) return c.json({ success: false, error: '게임 상태 없음' }, 404)

  const newExp   = (oldStatus.total_exp || 0) + expGained
  const oldLevel = getLevelInfo(oldStatus.total_exp || 0)
  const newLevel = getLevelInfo(newExp)
  const leveledUp = newLevel.level > oldLevel.level

  // 연속 출석 계산 — 달력 날짜(UTC) 기준
  const lastPlayed    = new Date(oldStatus.last_played_at || 0)
  const now           = new Date()
  const lastPlayedDay = lastPlayed.toISOString().slice(0, 10)
  const todayDay      = now.toISOString().slice(0, 10)

  let newStreak: number
  if (lastPlayedDay === todayDay) {
    // 오늘 이미 플레이했으면 streak 변경 없음 (당일 중복 증가 방지)
    newStreak = oldStatus.streak_days || 1
  } else {
    const diffDays = Math.floor((now.getTime() - lastPlayed.getTime()) / 86400000)
    newStreak = diffDays <= 1 ? (oldStatus.streak_days || 0) + 1 : 1
  }

  // 레벨별 해금 게임 목록 (game_registry의 unlockLevel 기준)
  const UNLOCK_MAP: Record<number, string[]> = {
    1: ['garden', 'mood'],
    2: ['garden', 'mood', 'efmt', 'gratitude', 'burnout'],
    3: ['garden', 'mood', 'efmt', 'gratitude', 'burnout'],
    4: ['garden', 'mood', 'efmt', 'gratitude', 'burnout', 'tree'],
    5: ['garden', 'mood', 'efmt', 'gratitude', 'burnout', 'tree'],
    6: ['garden', 'mood', 'efmt', 'gratitude', 'burnout', 'tree'],
  }
  const unlockedGames = JSON.stringify(UNLOCK_MAP[newLevel.level] || ['garden'])

  await DB.prepare(
    'UPDATE user_game_status SET total_exp=?, garden_level=?, streak_days=?, last_played_at=CURRENT_TIMESTAMP, unlocked_games=? WHERE user_id=?'
  ).bind(newExp, newLevel.level, newStreak, unlockedGames, userId).run()

  // 업적 체크
  const newAchievements: string[] = []
  const earnedIds = ((await DB.prepare('SELECT achievement_id FROM game_achievements WHERE user_id=?').bind(userId).all()).results as { achievement_id: string }[]).map(r => r.achievement_id)
  const sessionCount = ((await DB.prepare('SELECT COUNT(*) AS cnt FROM game_session_logs WHERE user_id=?').bind(userId).first<{ cnt: number }>())?.cnt || 0)

  // 게임별 세션 카운트 (업적용)
  const breathCount  = ((await DB.prepare("SELECT COUNT(*) AS cnt FROM game_session_logs WHERE user_id=? AND module_type='breathing'").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  const cbtCount     = ((await DB.prepare("SELECT COUNT(*) AS cnt FROM game_session_logs WHERE user_id=? AND module_type='cbt'").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  const burnoutDays  = ((await DB.prepare("SELECT COUNT(DISTINCT date(created_at)) AS cnt FROM game_session_logs WHERE user_id=? AND game_id='burnout'").bind(userId).first<{ cnt: number }>())?.cnt || 0)

  // 신규 업적용 카운트
  // 감정 수채화 — 최근 7일 연속 기록 (7일 전~오늘, 7개 모두 채워야 통과)
  const mood7Days    = ((await DB.prepare("SELECT COUNT(DISTINCT date(created_at)) AS cnt FROM game_session_logs WHERE user_id=? AND game_id='mood' AND created_at >= date('now','-6 days')").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  // 감정 수채화 — 누적 30회
  const mood30Total  = ((await DB.prepare("SELECT COUNT(*) AS cnt FROM game_session_logs WHERE user_id=? AND game_id='mood'").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  // 감사 일기 — 최근 7일 연속
  const grat7Days    = ((await DB.prepare("SELECT COUNT(DISTINCT date(created_at)) AS cnt FROM game_session_logs WHERE user_id=? AND game_id='gratitude' AND created_at >= date('now','-6 days')").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  // 탐험 — 5가지 이상 게임 플레이
  const uniqueGames  = ((await DB.prepare("SELECT COUNT(DISTINCT game_id) AS cnt FROM game_session_logs WHERE user_id=?").bind(userId).first<{ cnt: number }>())?.cnt || 0)
  // 완벽한 한 주 — 최근 7일 전부 플레이
  const week7Days    = ((await DB.prepare("SELECT COUNT(DISTINCT date(created_at)) AS cnt FROM game_session_logs WHERE user_id=? AND created_at >= date('now','-6 days')").bind(userId).first<{ cnt: number }>())?.cnt || 0)

  const checks: [string, boolean][] = [
    ['first_play',      sessionCount === 1],
    // 연속 출석
    ['streak_3',        newStreak >= 3  && !earnedIds.includes('streak_3')],
    ['streak_7',        newStreak >= 7  && !earnedIds.includes('streak_7')],
    ['streak_14',       newStreak >= 14 && !earnedIds.includes('streak_14')],
    ['perfect_week',    week7Days >= 7  && !earnedIds.includes('perfect_week')],
    // 레벨
    ['level_3',         newLevel.level >= 3 && !earnedIds.includes('level_3')],
    ['level_5',         newLevel.level >= 5 && !earnedIds.includes('level_5')],
    // 경험치
    ['exp_500',         newExp >= 500  && !earnedIds.includes('exp_500')],
    ['exp_1000',        newExp >= 1000 && !earnedIds.includes('exp_1000')],
    // 게임별 숙련
    ['breath_master',   breathCount >= 10 && !earnedIds.includes('breath_master')],
    ['cbt_master',      cbtCount >= 5     && !earnedIds.includes('cbt_master')],
    ['burnout_fighter', burnoutDays >= 5  && !earnedIds.includes('burnout_fighter')],
    // 감정 수채화
    ['mood_7',          mood7Days >= 7    && !earnedIds.includes('mood_7')],
    ['mood_30',         mood30Total >= 30 && !earnedIds.includes('mood_30')],
    // 감사 일기
    ['gratitude_7',     grat7Days >= 7    && !earnedIds.includes('gratitude_7')],
    // 탐험
    ['all_games',       uniqueGames >= 5  && !earnedIds.includes('all_games')],
  ]
  for (const [id, cond] of checks) {
    if (cond && !earnedIds.includes(id)) {
      await DB.prepare('INSERT OR IGNORE INTO game_achievements (user_id, achievement_id) VALUES (?,?)').bind(userId, id).run()
      newAchievements.push(id)
    }
  }

  return c.json({
    success: true,
    data: {
      expGained,
      newExp,
      levelInfo: newLevel,
      leveledUp,
      newStreak,
      newAchievements,
    },
  })
})

// ── PATCH /api/game/visual ─────────────────────────────────
// PHQ-9 점수 기반 정원 시각 상태 업데이트 (게임 시작 시 호출)
app.patch('/api/game/visual', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { phq9_score } = await c.req.json() as { phq9_score: number | null }
  const vs = calcVisualStatus(phq9_score)
  await DB.prepare('UPDATE user_game_status SET visual_status=? WHERE user_id=?').bind(vs, userId).run()
  return c.json({ success: true, data: { visual_status: vs } })
})

// ── POST /api/game/ai-transform ────────────────────────────
// SCT 부정 문장 → 긍정 확언 변환 (Claude API)
app.post('/api/game/ai-transform', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { text } = await c.req.json() as { text: string }
  if (!text || text.trim().length < 2) return c.json({ success: false, error: '텍스트 필요' }, 400)

  // 캐시 확인 (테이블 없어도 무시)
  try {
    const cached = await DB.prepare(
      'SELECT result_text FROM game_ai_cache WHERE user_id=? AND source_text=? LIMIT 1'
    ).bind(userId, text.trim()).first<{ result_text: string }>()
    if (cached) return c.json({ success: true, data: { result: cached.result_text, cached: true } })
  } catch { /* game_ai_cache 테이블 미생성 시 무시 */ }

  const apiKey = c.env.ANTHROPIC_API_KEY
  if (!apiKey) return c.json({ success: false, error: 'ANTHROPIC_API_KEY 미설정 — Cloudflare 환경변수 등록 필요' }, 500)

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `당신은 인지행동치료(CBT) 전문가입니다. 사용자의 부정적인 문장을 받으면, 인지적 왜곡이 교정된 건강하고 현실적인 자기 확언 문장 하나로 변환해 주세요. 너무 낙관적이지 않고 수용적이며 따뜻한 어조여야 합니다. 변환된 문장만 출력하세요.`,
        messages: [{ role: 'user', content: `다음 문장을 긍정적인 자기 확언으로 바꿔주세요: "${text.trim()}"` }],
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[ai-transform] Anthropic error:', res.status, errBody.slice(0, 200))
      const msg = res.status === 401 ? 'API 키가 유효하지 않습니다'
                : res.status === 404 ? '모델을 찾을 수 없습니다'
                : `AI 서비스 오류 (${res.status})`
      return c.json({ success: false, error: msg }, 502)
    }
    const d = await res.json() as { content: { text: string }[] }
    const result = d.content?.[0]?.text?.trim() || ''

    // 캐시 저장 (테이블 없어도 무시)
    try {
      await DB.prepare('INSERT INTO game_ai_cache (user_id, source_text, result_text) VALUES (?,?,?)').bind(userId, text.trim(), result).run()
    } catch { /* game_ai_cache 테이블 미생성 시 무시 */ }

    return c.json({ success: true, data: { result, cached: false } })
  } catch (e: any) {
    console.error('[ai-transform] error:', e?.message)
    return c.json({ success: false, error: e?.message || 'AI 변환 실패' }, 500)
  }
})

// ── GET /api/game/leaderboard ──────────────────────────────
app.get('/api/game/leaderboard', async (c) => {
  const { DB } = c.env
  const rows = await DB.prepare(`
    SELECT u.nickname, u.email, gs.garden_level, gs.total_exp, gs.streak_days
    FROM user_game_status gs
    JOIN users u ON gs.user_id = u.id
    ORDER BY gs.total_exp DESC LIMIT 20
  `).all()
  return c.json({ success: true, data: rows.results })
})

// ══════════════════════════════════════════════════════════
// 크레딧 시스템 (phyweb 공유 DB 기반)
// ══════════════════════════════════════════════════════════

// ── 원자적 크레딧 차감 (Race Condition 방지) ───────────────
// phyweb 과 동일한 패턴: WHERE credits >= ? → 잔액 부족이면 0 rows affected
async function spendCreditsGame(
  db: D1Database, userId: number, amount: number, gameId: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const result = await db.prepare(
    'UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?'
  ).bind(amount, userId, amount).run()

  if (!result.meta.changes || result.meta.changes === 0) {
    const user = await db.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
    if (!user) return { ok: false, balance: 0, error: 'user_not_found' }
    return { ok: false, balance: user.credits, error: 'insufficient_credits' }
  }

  const updated = await db.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  const newBalance = updated!.credits

  // credit_transactions 에 게임 차감 기록 (phyweb 마이페이지에서도 볼 수 있음)
  await db.prepare(
    'INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)'
  ).bind(userId, 'spend', amount, 'game', newBalance, gameId).run()

  return { ok: true, balance: newBalance }
}

// ── POST /api/game/spend-credit ────────────────────────────
// 게임 입장 직전 호출 — creditCost > 0 인 게임만
// 프론트는 이 API 성공 응답을 받은 후에만 게임을 시작함
app.post('/api/game/spend-credit', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { game_id, amount } = await c.req.json() as { game_id: string; amount: number }
  if (!game_id || typeof amount !== 'number' || amount <= 0) {
    return c.json({ success: false, error: '잘못된 요청' }, 400)
  }

  // 중복 차감 방지: 최근 10분 내 동일 게임 차감 이력 확인
  const recentSpend = await DB.prepare(
    "SELECT id FROM credit_transactions WHERE user_id=? AND reason='game' AND ref_id=? AND created_at >= datetime('now','-10 minutes')"
  ).bind(userId, game_id).first()
  if (recentSpend) {
    return c.json({ success: false, error: '이미 차감된 세션입니다', alreadyPaid: true }, 409)
  }

  const result = await spendCreditsGame(DB, userId, amount, game_id)
  if (!result.ok) {
    return c.json({
      success: false,
      error: result.error === 'insufficient_credits' ? '크레딧이 부족합니다' : '처리 실패',
      balance: result.balance,
      errorCode: result.error,
    }, result.error === 'insufficient_credits' ? 402 : 500)
  }

  return c.json({ success: true, data: { balance: result.balance, spent: amount } })
})

// ── GET /api/game/credits ──────────────────────────────────
// 실시간 잔액 조회 (게임 진입 전 프론트 확인용)
app.get('/api/game/credits', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const user = await DB.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)
  return c.json({ success: true, data: { balance: user.credits } })
})

// ── POST /api/game/scores ──────────────────────────────────
// 게임 내 자가 입력 검사 점수 저장 (PHQ9, BURNOUT 등)
app.post('/api/game/scores', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { test_type, score } = await c.req.json() as { test_type: string; score: number }
  if (!test_type || typeof score !== 'number') return c.json({ success: false, error: '잘못된 요청' }, 400)

  await DB.prepare(
    'INSERT INTO user_test_scores (user_id, test_type, score, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id, test_type) DO UPDATE SET score=excluded.score, updated_at=CURRENT_TIMESTAMP'
  ).bind(userId, test_type, score).run()

  // PHQ-9 점수 저장 시 정원 시각 상태도 동기화
  if (test_type === 'PHQ9') {
    const vs = calcVisualStatus(score)
    await DB.prepare('UPDATE user_game_status SET visual_status=? WHERE user_id=?').bind(vs, userId).run()
  }

  return c.json({ success: true })
})

// ── POST /api/game/daily-tip ──────────────────────────────
// AI 개인화 코치 메시지 (하루 1회 캐시)
app.post('/api/game/daily-tip', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const apiKey = c.env.ANTHROPIC_API_KEY
  if (!apiKey) return c.json({ success: false, error: 'AI 키 미설정' }, 500)

  const today    = new Date().toISOString().slice(0, 10)
  const cacheKey = `daily_tip_${today}`

  // 당일 캐시 확인
  try {
    const cached = await DB.prepare(
      'SELECT result_text FROM game_ai_cache WHERE user_id=? AND source_text=? LIMIT 1'
    ).bind(userId, cacheKey).first<{ result_text: string }>()
    if (cached) return c.json({ success: true, data: { message: cached.result_text, cached: true } })
  } catch { /* game_ai_cache 테이블 없으면 무시 */ }

  const body = await c.req.json().catch(() => ({})) as {
    streakDays?: number; level?: number
    testScores?: Record<string, number>; recentTests?: string[]
  }
  const { streakDays = 0, level = 1, testScores = {}, recentTests = [] } = body

  const levelNames = ['씨앗','새싹','꽃봉오리','꽃피움','만개','정원사']
  const parts = [
    `레벨: Lv.${level} ${levelNames[level-1] || '씨앗'}`,
    streakDays > 1 ? `${streakDays}일 연속 방문 중` : '오늘 방문',
    testScores.PHQ9     !== undefined ? `PHQ-9: ${testScores.PHQ9}점`      : '',
    testScores.BURNOUT  !== undefined ? `번아웃: ${testScores.BURNOUT}점`  : '',
    testScores.GAD7     !== undefined ? `GAD-7: ${testScores.GAD7}점`      : '',
    recentTests.length > 0 ? `완료 검사: ${recentTests.join(', ')}` : '',
  ].filter(Boolean)

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `당신은 심리 치유 게임 '마음의 정원'의 AI 코치입니다. 사용자 상태를 보고 따뜻하고 개인화된 오늘의 메시지를 한 문장으로 작성하세요. 40자 이내, 이모지 1개 포함, 자연스러운 한국어.`,
        messages: [{ role: 'user', content: `사용자 상태: ${parts.join(' / ')}` }],
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[daily-tip] Anthropic error:', res.status, errBody.slice(0, 200))
      return c.json({ success: false, error: `AI 호출 실패 (${res.status})`, detail: errBody.slice(0, 200) }, 502)
    }
    const d = await res.json() as { content: { text: string }[] }
    const message = d.content?.[0]?.text?.trim() || ''

    try {
      await DB.prepare('INSERT INTO game_ai_cache (user_id, source_text, result_text) VALUES (?,?,?)')
        .bind(userId, cacheKey, message).run()
    } catch { /* ignore */ }

    return c.json({ success: true, data: { message, cached: false } })
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || '실패' }, 500)
  }
})

// ── GET /api/game/mood-history ────────────────────────────
// 감정 체크인 기록 조회 (최근 N일)
app.get('/api/game/mood-history', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const days = Math.min(90, parseInt(c.req.query('days') || '30', 10))
  const today = new Date().toISOString().slice(0, 10)

  const rows = await DB.prepare(`
    SELECT date(created_at) as date, score, metadata
    FROM game_session_logs
    WHERE user_id=? AND game_id='mood' AND module_type='checkin'
      AND created_at >= date('now', '-' || ? || ' days')
    ORDER BY created_at DESC
  `).bind(userId, days).all()

  const seen = new Set<string>()
  const entries: { date: string; emotion: string; intensity: number; note: string | null }[] = []

  for (const row of (rows.results as { date: string; score: number; metadata: string | null }[])) {
    if (seen.has(row.date)) continue
    seen.add(row.date)
    let meta: Record<string, unknown> = {}
    try { meta = row.metadata ? JSON.parse(row.metadata) : {} } catch { /* ignore */ }
    entries.push({
      date:      row.date,
      emotion:   (meta.emotion as string)  || 'calm',
      intensity: (meta.intensity as number) || 3,
      note:      (meta.note as string | null) || null,
    })
  }

  return c.json({ success: true, data: entries, todayDone: entries.some(e => e.date === today) })
})

// ── GET /api/game/burnout-history ────────────────────────
// 번아웃 게임 플레이 점수 이력 (최근 10회)
app.get('/api/game/burnout-history', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const rows = await DB.prepare(`
    SELECT date(created_at) as date, score, metadata, created_at
    FROM game_session_logs
    WHERE user_id=? AND game_id='burnout'
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(userId).all()

  const entries = (rows.results as { date: string; score: number; metadata: string | null; created_at: string }[])
    .map(row => {
      let meta: Record<string, unknown> = {}
      try { meta = row.metadata ? JSON.parse(row.metadata) : {} } catch { /* ignore */ }
      return {
        date:          row.date,
        score:         row.score,
        burnout_score: (meta.burnout_score as number) ?? null,
        city_level:    (meta.city_level as string) ?? null,
      }
    })

  return c.json({ success: true, data: entries })
})

// ── 번아웃 회복 미션 API ──────────────────────────────────
app.post('/api/recovery/missions', async (c) => {
  const { burnoutScore = 50 } = await c.req.json().catch(() => ({}))
  const missions = burnoutScore >= 60
    ? ['walk_10', 'drink_water', 'family_time', 'meditation']
    : ['stretch_5', 'deep_breath', 'gratitude', 'drink_water']
  return c.json({ success: true, missions })
})

app.get('/api/recovery/weekly-report/:userId', async (c) => {
  const { DB } = c.env
  const userId = c.req.param('userId')
  const rows = await DB.prepare(
    `SELECT avg_energy, completed_missions, burnout_delta
     FROM weekly_reports WHERE user_id=? ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first().catch(() => null)
  return c.json({
    success: true,
    avgEnergy:          rows?.avg_energy ?? 68,
    completedMissions:  rows?.completed_missions ?? 0,
    burnoutDelta:       rows?.burnout_delta ?? '0%',
    cta: '더 깊은 회복이 필요하면 상담 예약을 추천합니다.',
  })
})

// ── GET /api/game/emotion-report ─────────────────────────
// 최근 7일 감정 기록 → AI 주간 패턴 분석 (주 1회 캐시)
app.get('/api/game/emotion-report', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  // 최근 7일 감정 기록
  const rows = await DB.prepare(`
    SELECT date(created_at) as date, score, metadata
    FROM game_session_logs
    WHERE user_id=? AND game_id='mood' AND module_type='checkin'
      AND created_at >= date('now', '-6 days')
    ORDER BY created_at ASC
  `).bind(userId).all<{ date: string; score: number; metadata: string | null }>()

  const seen = new Set<string>()
  const entries: { date: string; emotion: string; intensity: number }[] = []
  for (const row of rows.results) {
    if (seen.has(row.date)) continue
    seen.add(row.date)
    let meta: Record<string, unknown> = {}
    try { meta = row.metadata ? JSON.parse(row.metadata) : {} } catch { /**/ }
    entries.push({
      date:      row.date,
      emotion:   (meta.emotion as string) || 'calm',
      intensity: (meta.intensity as number) || 3,
    })
  }

  if (entries.length < 3) {
    return c.json({ success: true, data: { report: null, entries, insufficient: true } })
  }

  // 이번 주 월요일 기준 캐시 키 (KST)
  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const dayOfWeek = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1 // 0=Mon
  const mondayKST = new Date(now)
  mondayKST.setUTCDate(now.getUTCDate() - dayOfWeek)
  const cacheKey = `emotion_report_${mondayKST.toISOString().slice(0, 10)}`

  try {
    const cached = await DB.prepare('SELECT result_text FROM game_ai_cache WHERE user_id=? AND source_text=? LIMIT 1')
      .bind(userId, cacheKey).first<{ result_text: string }>()
    if (cached) return c.json({ success: true, data: { report: cached.result_text, entries, cached: true } })
  } catch { /**/ }

  const apiKey = c.env.ANTHROPIC_API_KEY
  if (!apiKey) return c.json({ success: false, error: 'AI 키 미설정' }, 500)

  const emoLabel: Record<string, string> = {
    happy:'행복', calm:'평온', tired:'피곤', anxious:'불안', sad:'슬픔', angry:'화남'
  }
  const summary = entries.map(e =>
    `${e.date}: ${emoLabel[e.emotion] || e.emotion} (강도 ${e.intensity}/5)`
  ).join(', ')

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 160,
        system: `당신은 감정 흐름 분석 전문가입니다. 사용자의 최근 감정 기록을 보고 따뜻하고 통찰력 있는 주간 감정 패턴 분석을 3문장으로 작성하세요. 한국어로, 공감적으로, 위로가 되도록.`,
        messages: [{ role: 'user', content: `최근 감정 기록: ${summary}` }],
      }),
    })
    if (!res.ok) return c.json({ success: false, error: `AI 오류 (${res.status})` }, 502)
    const d = await res.json() as { content: { text: string }[] }
    const report = d.content?.[0]?.text?.trim() || ''
    try {
      await DB.prepare('INSERT INTO game_ai_cache (user_id, source_text, result_text) VALUES (?,?,?)')
        .bind(userId, cacheKey, report).run()
    } catch { /**/ }
    return c.json({ success: true, data: { report, entries, cached: false } })
  } catch (e: unknown) {
    return c.json({ success: false, error: (e as Error)?.message || '실패' }, 500)
  }
})

// ── GET /api/game/ai-diary ────────────────────────────────
// 오늘의 감정+감사 기록 기반 AI 마음 일기 (일 1회 생성, KST 기준)
app.get('/api/game/ai-diary', async (c) => {
  const { DB } = c.env
  const userId = await getGameUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const todayKST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  const cacheKey = `diary_${todayKST}`

  const cached = await DB.prepare(
    `SELECT result_text FROM game_ai_cache WHERE user_id=? AND source_text=? AND game_id='diary' LIMIT 1`
  ).bind(userId, cacheKey).first<{ result_text: string }>().catch(() => null)
  if (cached) return c.json({ success: true, data: { diary: cached.result_text, date: todayKST, cached: true } })

  const apiKey = c.env.ANTHROPIC_API_KEY
  if (!apiKey) return c.json({ success: false, error: 'AI 키 미설정' }, 500)

  // 오늘 감정 기록
  const moodRow = await DB.prepare(`
    SELECT metadata FROM game_session_logs
    WHERE user_id=? AND game_id='mood' AND module_type='checkin'
      AND date(created_at, '+9 hours') = ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId, todayKST).first<{ metadata: string | null }>().catch(() => null)

  // 최근 3개 감사 일기
  const gratRows = await DB.prepare(`
    SELECT metadata FROM game_session_logs
    WHERE user_id=? AND game_id='gratitude'
    ORDER BY created_at DESC LIMIT 3
  `).bind(userId).all<{ metadata: string | null }>().catch(() => ({ results: [] }))

  const emoLabel: Record<string, string> = {
    happy:'행복', calm:'평온', tired:'피곤', anxious:'불안', sad:'슬픔', angry:'화남'
  }
  let context = ''
  if (moodRow?.metadata) {
    try {
      const m = JSON.parse(moodRow.metadata) as Record<string, unknown>
      const emo = emoLabel[(m.emotion as string) || ''] || (m.emotion as string) || '평온'
      const intensity = m.intensity as number || 3
      const memo = m.memo as string || ''
      context += `오늘 감정: ${emo} (강도 ${intensity}/5)${memo ? `, 메모: "${memo}"` : ''}. `
    } catch { /**/ }
  }
  if (gratRows.results.length > 0) {
    const thanks: string[] = []
    for (const row of gratRows.results) {
      try {
        const m = JSON.parse(row.metadata || '{}') as Record<string, unknown>
        const answers = m.answers as Record<string, string> | undefined
        if (answers) {
          const vals = Object.values(answers).filter(Boolean).slice(0, 2)
          if (vals.length) thanks.push(...vals)
        }
      } catch { /**/ }
    }
    if (thanks.length) context += `감사한 것: ${thanks.slice(0, 3).join(', ')}.`
  }

  if (!context.trim()) {
    return c.json({ success: true, data: { diary: null, date: todayKST, noData: true } })
  }

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: `당신은 사용자의 감정 기록을 보고 따뜻한 1인칭 마음 일기를 2-3문장으로 작성합니다. "오늘 나는..."으로 시작하며, 공감적이고 치유적인 언어를 사용하세요. 100자 이내로 작성.`,
        messages: [{ role: 'user', content: context }],
      }),
    })
    if (!res.ok) return c.json({ success: false, error: `AI 오류 (${res.status})` }, 502)
    const d = await res.json() as { content: { text: string }[] }
    const diary = d.content?.[0]?.text?.trim() || ''
    await DB.prepare(
      `INSERT INTO game_ai_cache (user_id, source_text, result_text, game_id) VALUES (?,?,?,?)`
    ).bind(userId, cacheKey, diary, 'diary').run().catch(() => {})
    return c.json({ success: true, data: { diary, date: todayKST, cached: false } })
  } catch (e: unknown) {
    return c.json({ success: false, error: (e as Error)?.message || '실패' }, 500)
  }
})

// ── 주간 이메일 발송 헬퍼 ────────────────────────────────────
async function sendWeeklySummaryEmail(
  env: Bindings,
  to: string,
  nickname: string,
  stats: { playCount: number; expGained: number; topEmotion: string | null; levelName: string; streak: number }
): Promise<void> {
  const key = env.RESEND_API_KEY
  if (!key) return

  const emojiMap: Record<string, string> = { happy:'😊', calm:'😌', tired:'😴', anxious:'😰', sad:'😢', angry:'😤' }
  const emojiLabel: Record<string, string> = { happy:'행복', calm:'평온', tired:'피곤', anxious:'불안', sad:'슬픔', angry:'화남' }
  const topEmoji = stats.topEmotion ? emojiMap[stats.topEmotion] || '💭' : ''
  const topLabel = stats.topEmotion ? emojiLabel[stats.topEmotion] || stats.topEmotion : ''

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Apple SD Gothic Neo',sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 20px;">
  <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4A7A5A,#6BA880);padding:32px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🌿</div>
      <div style="font-size:22px;font-weight:700;color:white;">지난 한 주, 수고했어요</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:6px;">${nickname}님의 마음 정원 주간 리포트</div>
    </div>
    <div style="padding:28px 24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#EAF5EC;border-radius:16px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#4A7A5A;">${stats.playCount}</div>
          <div style="font-size:11px;color:#6A8A6A;margin-top:2px;">게임 플레이</div>
        </div>
        <div style="background:#FFF8EC;border-radius:16px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#D4954A;">+${stats.expGained}</div>
          <div style="font-size:11px;color:#A07040;margin-top:2px;">경험치 획득</div>
        </div>
        ${stats.streak > 0 ? `
        <div style="background:#FCF0F3;border-radius:16px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#B5556A;">🔥${stats.streak}</div>
          <div style="font-size:11px;color:#8A4A5A;margin-top:2px;">연속 방문</div>
        </div>` : ''}
        ${stats.topEmotion ? `
        <div style="background:#F0EEF8;border-radius:16px;padding:16px;text-align:center;">
          <div style="font-size:28px;">${topEmoji}</div>
          <div style="font-size:11px;color:#7A6EA8;margin-top:2px;">${topLabel}</div>
        </div>` : ''}
      </div>
      <div style="background:#F5F0E8;border-radius:14px;padding:14px 16px;margin-bottom:24px;">
        <div style="font-size:13px;color:#5A6A5A;line-height:1.7;">
          현재 <strong style="color:#4A7A5A">${stats.levelName}</strong> 정원사예요.
          이번 주도 마음을 가꿔줘서 고마워요. 작은 실천이 정원을 점점 풍성하게 만들고 있어요 🌸
        </div>
      </div>
      <a href="https://game.maumful.com"
        style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#4A7A5A,#6BA880);color:white;text-decoration:none;border-radius:14px;font-weight:700;font-size:15px;">
        오늘도 정원 가꾸러 가기 →
      </a>
    </div>
    <div style="padding:16px 24px;text-align:center;border-top:1px solid #F0EAE0;">
      <div style="font-size:11px;color:#A0A090;">마음풀 · game.maumful.com</div>
    </div>
  </div>
</div>
</body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: '마음게임 <noreply@maumful.com>',
      to: [to],
      subject: `🌿 ${nickname}님, 지난 한 주 마음 정원 리포트가 도착했어요`,
      html,
    }),
  }).catch(() => { /**/ })
}

// ── 번아웃 주간 리포트 자동 생성 + 주간 이메일 발송 (Cron) ──
async function handleScheduled(env: Bindings) {
  const { DB } = env

  // 지난 7일간 활동한 사용자 (이메일 인증 완료자만)
  const activeUsers = await DB.prepare(`
    SELECT DISTINCT gsl.user_id, u.email, u.nickname, ugs.total_exp, ugs.garden_level, ugs.streak_days
    FROM game_session_logs gsl
    JOIN users u ON gsl.user_id = u.id
    LEFT JOIN user_game_status ugs ON gsl.user_id = ugs.user_id
    WHERE gsl.created_at >= date('now', '-7 days')
      AND u.is_email_verified = 1
  `).all<{ user_id: number; email: string; nickname: string | null; total_exp: number; garden_level: number; streak_days: number }>()

  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const dayOfWeek = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - dayOfWeek)
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const levelNames: Record<number, string> = { 1:'씨앗', 2:'새싹', 3:'꽃봉오리', 4:'꽃피움', 5:'만개', 6:'정원사' }

  for (const u of activeUsers.results) {
    // 지난 7일 세션 통계
    const sessions = await DB.prepare(`
      SELECT game_id, score, metadata FROM game_session_logs
      WHERE user_id=? AND created_at >= date('now', '-7 days')
    `).bind(u.user_id).all<{ game_id: string; score: number; metadata: string | null }>()

    let totalExp = 0, missionCount = 0
    const emotionCounts: Record<string, number> = {}

    for (const s of sessions.results) {
      totalExp += s.score || 0
      try {
        const meta = s.metadata ? JSON.parse(s.metadata) : {}
        if (s.game_id === 'burnout') {
          if (typeof meta.completedMissions === 'number') missionCount += meta.completedMissions
          // 번아웃 주간 리포트 데이터도 수집
          let totalEnergy = 0, energyCount = 0
          if (typeof meta.energy === 'number') { totalEnergy += meta.energy; energyCount++ }
          const avgEnergy = energyCount > 0 ? Math.round(totalEnergy / energyCount) : 50
          await DB.prepare('DELETE FROM weekly_reports WHERE user_id=? AND week_start=?')
            .bind(u.user_id, weekStartStr).run()
          await DB.prepare(
            'INSERT INTO weekly_reports (user_id, avg_energy, completed_missions, burnout_delta, week_start) VALUES (?,?,?,?,?)'
          ).bind(u.user_id, avgEnergy, missionCount, '0%', weekStartStr).run().catch(() => { /**/ })
        }
        if (s.game_id === 'mood' && meta.emotion) {
          const e = meta.emotion as string
          emotionCounts[e] = (emotionCounts[e] || 0) + 1
        }
      } catch { /**/ }
    }

    const topEmotion = Object.keys(emotionCounts).sort((a, b) => emotionCounts[b] - emotionCounts[a])[0] || null
    const levelName = levelNames[u.garden_level || 1] || '씨앗'
    const nickname = u.nickname || u.email.split('@')[0]

    // 주간 이메일 발송 (Resend)
    await sendWeeklySummaryEmail(env, u.email, nickname, {
      playCount: sessions.results.length,
      expGained: Math.round(totalExp / 10), // EXP 단위로 환산
      topEmotion,
      levelName,
      streak: u.streak_days || 0,
    })

    console.log(`[Cron] 주간 이메일 발송: ${u.email} (${sessions.results.length}회 플레이)`)
  }

  console.log(`[Cron] 총 ${activeUsers.results.length}명에게 주간 리포트 발송 완료`)
}

export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Bindings) {
    await handleScheduled(env)
  },
}
