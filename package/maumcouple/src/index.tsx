// ============================================================
// maumcouple  src/index.tsx
// 마음커플 — BIG5 / LOST 커플 비교 분석 플랫폼
// maumful D1/KV 공유 · JWT SSO (마음게임과 동일 패턴)
// ============================================================
import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ── Bindings ──────────────────────────────────────────────
interface Bindings {
  DB:               D1Database
  KV:               KVNamespace
  ANTHROPIC_API_KEY?: string
  JWT_SECRET?:      string
}

// ── 타입 ──────────────────────────────────────────────────
interface CoupleUser {
  id: number; email: string; nickname: string | null; credits: number; locale: string
}
interface TestResult {
  test_type: string; result_json: string | null; performed_at: string
}
interface CoupleSession {
  id: number; session_code: string
  host_user_id: number; guest_user_id: number | null
  test_type: string
  host_result_json: string | null; guest_result_json: string | null
  status: string; ai_report_text: string | null
  compatibility_score: number; credits_spent: number
  created_at: string; expires_at: string
}

// ── JWT 검증 (maumful / maumgame 과 동일 시크릿) ──────────
async function verifyJWT(token: string, secret: string): Promise<number | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [hdr, payload, sig] = parts
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const decode = (s: string) =>
      Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC', key, decode(sig),
      new TextEncoder().encode(`${hdr}.${payload}`)
    )
    if (!valid) return null
    const p = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (p.exp && Date.now() / 1000 > p.exp) return null
    return Number(p.sub || p.id) || null
  } catch { return null }
}

async function getCoupleUserId(req: Request, env: Bindings): Promise<number | null> {
  const secret = (await env.KV.get('JWT_SECRET')) ?? env.JWT_SECRET
  if (!secret) return null
  const auth  = req.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ')
    ? auth.slice(7)
    : new URL(req.url).searchParams.get('t') || ''
  if (!token) return null
  // BUG-2 FIX: couple/game 토큰 타입 검증
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.type && !['couple', 'game', undefined].includes(payload.type)) return null
  } catch { return null }
  return verifyJWT(token, secret)
}

// ── 마스터 계정 확인 ──────────────────────────────────────
function isMasterAccount(email?: string | null) {
  return !!email && ['limyj007@gmail.com'].includes(email.toLowerCase())
}

// ── 6자리 세션 코드 생성 ──────────────────────────────────
function genSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동되는 문자 제외
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => chars[b % chars.length]).join('')
}

// ── Anthropic API 키 조회 ─────────────────────────────────
async function getAnthropicKey(env: Bindings): Promise<string | null> {
  return env.ANTHROPIC_API_KEY ?? null
}

// ── 테스트 타입별 비용 계산 ────────────────────────────────
function calcCost(testType: string, isMaster: boolean): number {
  if (isMaster) return 0
  // 포함된 검사 수에 따라 과금: 단독 20cr, 2개 35cr, 3개 45cr
  const count = testType.split('+').length
  if (count >= 3) return 45
  if (count === 2) return 35
  return 20
}

// ── 크레딧 차감 ──────────────────────────────────────────
async function spendCredits(
  db: D1Database, userId: number, amount: number, reason: string, refId?: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  const result = await db.prepare(
    'UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?'
  ).bind(amount, userId, amount).run()

  if (!result.meta.changes) {
    const u = await db.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
    return { ok: false, balance: u?.credits ?? 0, error: 'insufficient_credits' }
  }

  const updated = await db.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  const newBalance = updated!.credits

  await db.prepare(
    'INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)'
  ).bind(userId, 'spend', amount, reason, newBalance, refId ?? null).run()

  return { ok: true, balance: newBalance }
}

// ── 커플 AI 프롬프트 빌더 (BIG5 + LOST + DSI) ────────────
function buildCouplePrompt(
  hostName: string, guestName: string,
  hostBig5: Record<string, number> | null,
  guestBig5: Record<string, number> | null,
  hostLost: Record<string, unknown> | null,
  guestLost: Record<string, unknown> | null,
  hostDsi: Record<string, unknown> | null,
  guestDsi: Record<string, unknown> | null
): string {
  const NL = '\n'
  let prompt = `당신은 커플·부부 심리 분석 전문가입니다. 두 사람의 심리검사 결과를 바탕으로 따뜻하고 실질적인 커플 분석 리포트를 작성해주세요.${NL}${NL}`

  prompt += `[분석 대상]${NL}파트너 A: ${hostName}${NL}파트너 B: ${guestName}${NL}${NL}`

  if (hostBig5 && guestBig5) {
    const labels: Record<string, string> = { O:'개방성', C:'성실성', E:'외향성', A:'친화성', N:'신경성' }
    prompt += `[BIG5 성격검사 결과]${NL}`
    for (const key of ['O','C','E','A','N']) {
      const hv = hostBig5[key] ?? 0; const gv = guestBig5[key] ?? 0
      prompt += `${labels[key]}: ${hostName} ${hv}점 / ${guestName} ${gv}점 (차이: ${Math.abs(Number(hv)-Number(gv)).toFixed(2)}점)${NL}`
    }
    prompt += NL
  }

  if (hostLost && guestLost) {
    prompt += `[LOST 행동 운영체계]${NL}`
    prompt += `${hostName}: ${(hostLost as Record<string, string>).typeCode ?? '?'} — ${(hostLost as Record<string, string>).typeName ?? ''}${NL}`
    prompt += `${guestName}: ${(guestLost as Record<string, string>).typeCode ?? '?'} — ${(guestLost as Record<string, string>).typeName ?? ''}${NL}${NL}`
  }

  if (hostDsi && guestDsi) {
    const SCALE_MAX: Record<string, number> = { '자기입장 유지': 50, '정서반응성': 35, '정서적 단절': 20, '융합·관계의존': 20 }
    const hScales = (hostDsi.scales ?? {}) as Record<string, number>
    const gScales = (guestDsi.scales ?? {}) as Record<string, number>
    const hTotal  = hostDsi.total ?? 0
    const gTotal  = guestDsi.total ?? 0
    prompt += `[자아분화(SDRI) 검사 결과 — Bowen 이론 기반]${NL}`
    prompt += `총점: ${hostName} ${hTotal}점 / ${guestName} ${gTotal}점 (만점 125점)${NL}`
    for (const scale of Object.keys(SCALE_MAX)) {
      const hv = hScales[scale] ?? 0; const gv = gScales[scale] ?? 0; const max = SCALE_MAX[scale]
      const hPct = Math.round((hv / max) * 100); const gPct = Math.round((gv / max) * 100)
      prompt += `  • ${scale}: ${hostName} ${hv}/${max}(${hPct}%) / ${guestName} ${gv}/${max}(${gPct}%)${NL}`
    }
    prompt += `[자아분화 척도 해석 참고]${NL}`
    prompt += `- 자기입장 유지 높음: 압력 속에서도 자기 기준 유지 → 건강한 분화${NL}`
    prompt += `- 정서반응성 높음: 갈등 상황에서 감정 반응성 높음 → 상호 촉발 위험${NL}`
    prompt += `- 정서적 단절 높음: 갈등 시 정서적 거리두기 경향 → 회피 패턴${NL}`
    prompt += `- 융합·관계의존 높음: 상대 감정에 과도하게 동화 → 공생 패턴${NL}${NL}`
  }

  prompt += `[리포트 작성 지침]${NL}다음 순서로 작성해주세요:${NL}`
  prompt += `1. 궁합 점수 (0~100점 숫자만): SCORE:XX${NL}`
  prompt += `2. 두 사람의 심리 특성 요약 (각 3줄 이내)${NL}`
  prompt += `3. 강점 영역: 두 사람이 잘 맞는 부분 3가지${NL}`
  prompt += `4. 성장 영역: 함께 노력하면 좋을 부분 2가지 (긍정적 표현으로)${NL}`

  if (hostDsi && guestDsi) {
    prompt += `5. 자아분화 관점 통찰: 두 사람의 분화 수준 차이가 관계에 미치는 영향과 발전 방향${NL}`
    prompt += `6. 관계 발전 제안: 부부/커플 상담에서 활용할 수 있는 구체적 실천 팁 3가지${NL}`
    prompt += `7. 대화 시작 질문: 두 사람이 함께 탐색할 주제 2가지${NL}`
  } else {
    prompt += `5. 관계 발전 제안: 구체적인 실천 팁 3가지${NL}`
    prompt += `6. 대화 시작 질문: 두 사람이 함께 해볼 대화 주제 2가지${NL}`
  }

  prompt += `${NL}전체 분량은 700자 이내, 따뜻하고 희망적인 톤으로 작성하세요.${NL}`
  prompt += `진단명·병명은 절대 사용하지 마세요. 전문 상담 연계는 마지막에 한 번만 언급하세요.`
  return prompt
}

// ── 메인 앱 ───────────────────────────────────────────────
const app = new Hono<{ Bindings: Bindings }>()
app.use('/api/*', cors())

// ── HTML 서빙 ─────────────────────────────────────────────
const HTML = (v: string) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>마음커플 — 커플 심리 분석</title>
  <meta name="description" content="BIG5·LOST 심리검사 결과로 커플 궁합과 관계 패턴을 분석해보세요.">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; background: #FDF7F9; -webkit-font-smoothing: antialiased; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" src="/static/couple_hub.jsx?v=${v}"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    // URL ?t= 파라미터로 maumful JWT 토큰 수신 (SSO — 별도 로그인 불필요)
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    const codeParam = urlParams.get('code'); // 파트너 초대코드
    if (t) {
      localStorage.setItem('couple_token', t);
      const nextUrl = codeParam ? '/?code=' + encodeURIComponent(codeParam) : '/';
      window.history.replaceState({}, '', nextUrl);
    }
  </script>
</body>
</html>`

app.get('/favicon.ico', () => fetch('https://maumful.limyj007.workers.dev/favicon.ico'))
app.get('/favicon.png', () => fetch('https://maumful.limyj007.workers.dev/favicon.png'))
app.get('/', c => c.html(HTML(Date.now().toString(36))))

// ═══════════════════════════════════════════════════════════
// 커플 API
// ═══════════════════════════════════════════════════════════

// ── GET /api/couple/me ─────────────────────────────────────
// 유저 정보 + BIG5/LOST 최근 결과 + 활성 커플 세션 조회
app.get('/api/couple/me', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare(
    'SELECT id, email, nickname, credits, locale FROM users WHERE id=?'
  ).bind(userId).first<CoupleUser>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  // BIG5 / LOST / DSI 최근 결과 (result_json 포함)
  const testResults = await DB.prepare(
    `SELECT test_type, result_json, performed_at
     FROM test_history
     WHERE user_id=? AND test_type IN ('BIG5','LOST','DSI') AND result_json IS NOT NULL
     ORDER BY performed_at DESC LIMIT 6`
  ).bind(userId).all<TestResult>()

  const latestBig5 = testResults.results.find(r => r.test_type === 'BIG5') ?? null
  const latestLost = testResults.results.find(r => r.test_type === 'LOST') ?? null
  const latestDsi  = testResults.results.find(r => r.test_type === 'DSI')  ?? null

  // 이 유저가 host/guest로 있는 활성 세션
  const activeSession = await DB.prepare(
    `SELECT * FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?)
       AND status IN ('waiting','both_done')
       AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, userId).first<CoupleSession>()

  // 완료된 리포트 최근 3개
  const recentReports = await DB.prepare(
    `SELECT id, session_code, test_type, status, ai_report_text,
            compatibility_score, created_at, host_user_id, guest_user_id
     FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?) AND status='reported'
     ORDER BY created_at DESC LIMIT 3`
  ).bind(userId, userId).all<CoupleSession>()

  const isMaster = isMasterAccount(user.email)

  return c.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, nickname: user.nickname, credits: user.credits },
      testResults: {
        // NEW-BUG-3 FIX: JSON.parse 예외처리 추가
        big5: latestBig5 ? (() => { try { return { ...latestBig5, data: JSON.parse(latestBig5.result_json!) }; } catch { return null; } })() : null,
        lost: latestLost ? (() => { try { return { ...latestLost, data: JSON.parse(latestLost.result_json!) }; } catch { return null; } })() : null,
        dsi:  latestDsi  ? (() => { try { return { ...latestDsi,  data: JSON.parse(latestDsi.result_json!)  }; } catch { return null; } })() : null,
        hasEnoughData: !!(latestBig5 || latestLost || latestDsi),
      },
      activeSession,
      recentReports: recentReports.results,
      isMaster,
    },
  })
})

// ── GET /api/couple/credits ────────────────────────────────
app.get('/api/couple/credits', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const user = await DB.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  return c.json({ success: true, data: { balance: user?.credits ?? 0 } })
})

// ── POST /api/couple/session ───────────────────────────────
// 커플 세션 생성 (host)
app.post('/api/couple/session', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare(
    'SELECT email, credits FROM users WHERE id=?'
  ).bind(userId).first<{ email: string; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const { test_type = 'BIG5+LOST+DSI' } = await c.req.json().catch(() => ({})) as { test_type?: string }

  const VALID_TYPES = ['BIG5','LOST','DSI','BIG5+LOST','BIG5+DSI','LOST+DSI','BIG5+LOST+DSI']
  if (!VALID_TYPES.includes(test_type)) return c.json({ success: false, error: '지원하지 않는 검사 조합' }, 400)

  const COST = calcCost(test_type, isMasterAccount(user.email))

  if (!isMasterAccount(user.email) && user.credits < COST) {
    return c.json({
      success: false,
      error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`,
      balance: user.credits, needsCharge: true,
    }, 402)
  }

  // NEW-BUG-4 FIX: 기존 세션이 있더라도 test_type이 같을 때만 재사용
  const existing = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE host_user_id=? AND status='waiting' AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first<CoupleSession>()
  if (existing && existing.test_type === test_type) {
    return c.json({ success: true, data: { session: existing, isExisting: true } })
  }
  // test_type이 다르면 기존 세션을 expired 처리 후 새로 생성
  if (existing && existing.test_type !== test_type) {
    await DB.prepare(
      `UPDATE couple_sessions SET status='expired', updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).bind(existing.id).run()
  }

  // host의 최근 결과 가져오기 (선택된 test_type에 포함된 검사만)
  const types = test_type.split('+')
  const big5Row = types.includes('BIG5') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null
  const lostRow = types.includes('LOST') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null
  const dsiRow  = types.includes('DSI') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null

  const hostResult: Record<string, unknown> = {}
  // NEW-BUG-3 FIX: JSON.parse 예외처리
  try { if (big5Row) hostResult.big5 = JSON.parse(big5Row.result_json) } catch {}
  try { if (lostRow) hostResult.lost = JSON.parse(lostRow.result_json) } catch {}
  try { if (dsiRow)  hostResult.dsi  = JSON.parse(dsiRow.result_json)  } catch {}

  // BUG-3 FIX: 코드 생성을 크레딧 차감 전에 실행 (실패해도 환불 불필요)
  let code = ''
  for (let i = 0; i < 10; i++) {
    const c2 = genSessionCode()
    const dup = await DB.prepare('SELECT id FROM couple_sessions WHERE session_code=?').bind(c2).first()
    if (!dup) { code = c2; break }
  }
  if (!code) return c.json({ success: false, error: '코드 생성 실패. 다시 시도해주세요.' }, 500)

  // 크레딧 차감 (코드 확보 후 진행)
  if (COST > 0) {
    const result = await spendCredits(DB, userId, COST, 'couple', code)
    if (!result.ok) return c.json({ success: false, error: '크레딧 차감 실패', balance: result.balance }, 402)
  }

  // 세션 생성
  const created = await DB.prepare(
    `INSERT INTO couple_sessions (session_code, host_user_id, test_type, host_result_json, status, credits_spent)
     VALUES (?,?,?,?,?,?)`
  ).bind(code, userId, test_type, JSON.stringify(hostResult), 'waiting', COST).run()

  const session = await DB.prepare('SELECT * FROM couple_sessions WHERE id=?')
    .bind(created.meta.last_row_id).first<CoupleSession>()

  return c.json({ success: true, data: { session, cost: COST } })
})

// ── POST /api/couple/join ──────────────────────────────────
// 파트너 코드 입력 → 세션 참여 (guest)
app.post('/api/couple/join', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { code } = await c.req.json().catch(() => ({})) as { code?: string }
  if (!code || code.length !== 6) return c.json({ success: false, error: '올바른 코드를 입력해주세요.' }, 400)

  const session = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(code.toUpperCase()).first<CoupleSession>()

  if (!session) return c.json({ success: false, error: '유효하지 않은 코드입니다. 코드를 다시 확인해주세요.' }, 404)
  if (session.host_user_id === userId) return c.json({ success: false, error: '본인이 만든 세션입니다. 파트너에게 코드를 공유해주세요.' }, 400)
  if (session.guest_user_id && session.guest_user_id !== userId) return c.json({ success: false, error: '이미 다른 파트너가 참여한 세션입니다.' }, 409)
  if (session.status !== 'waiting') return c.json({ success: false, error: '이미 완료된 세션입니다.' }, 400)

  // guest 결과 가져오기 (세션 test_type 기준)
  const gTypes = session.test_type.split('+')
  const gBig5 = gTypes.includes('BIG5') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null
  const gLost = gTypes.includes('LOST') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null
  const gDsi  = gTypes.includes('DSI') ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first<{ result_json: string }>() : null

  const guestResult: Record<string, unknown> = {}
  // NEW-BUG-3 FIX: JSON.parse 예외처리
  try { if (gBig5) guestResult.big5 = JSON.parse(gBig5.result_json) } catch {}
  try { if (gLost) guestResult.lost = JSON.parse(gLost.result_json) } catch {}
  try { if (gDsi)  guestResult.dsi  = JSON.parse(gDsi.result_json)  } catch {}

  // 세션 업데이트
  // BUG-8 FIX: 양쪽 모두 실제 데이터가 있는지 확인 (빈 {} 제외)
  const hostHasData = (() => {
    try { return Object.keys(JSON.parse(session.host_result_json || '{}')).length > 0 } catch { return false }
  })()
  const guestHasData = Object.keys(guestResult).length > 0
  const newStatus = (hostHasData && guestHasData) ? 'both_done' : 'waiting'
  await DB.prepare(
    `UPDATE couple_sessions SET guest_user_id=?, guest_result_json=?, status=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).bind(userId, JSON.stringify(guestResult), newStatus, session.id).run()

  const updated = await DB.prepare('SELECT * FROM couple_sessions WHERE id=?').bind(session.id).first<CoupleSession>()
  return c.json({ success: true, data: { session: updated, guestJoined: true } })
})

// ── GET /api/couple/session/:code ─────────────────────────
// 세션 상태 폴링
app.get('/api/couple/session/:code', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const code = c.req.param('code')
  const session = await DB.prepare(
    'SELECT * FROM couple_sessions WHERE session_code=?'
  ).bind(code.toUpperCase()).first<CoupleSession>()

  if (!session) return c.json({ success: false, error: '세션 없음' }, 404)
  if (session.host_user_id !== userId && session.guest_user_id !== userId) {
    return c.json({ success: false, error: '접근 권한 없음' }, 403)
  }

  // 파트너 닉네임 조회
  const otherId = session.host_user_id === userId ? session.guest_user_id : session.host_user_id
  let partnerName = '파트너'
  if (otherId) {
    const other = await DB.prepare('SELECT nickname, email FROM users WHERE id=?')
      .bind(otherId).first<{ nickname: string | null; email: string }>()
    partnerName = other?.nickname || other?.email?.split('@')[0] || '파트너'
  }

  return c.json({ success: true, data: { session, partnerName, myRole: session.host_user_id === userId ? 'host' : 'guest' } })
})

// ── POST /api/couple/report ────────────────────────────────
// AI 커플 리포트 생성
app.post('/api/couple/report', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { session_code } = await c.req.json().catch(() => ({})) as { session_code?: string }
  if (!session_code) return c.json({ success: false, error: '세션 코드 필요' }, 400)

  const session = await DB.prepare(
    'SELECT * FROM couple_sessions WHERE session_code=?'
  ).bind(session_code.toUpperCase()).first<CoupleSession>()

  if (!session) return c.json({ success: false, error: '세션 없음' }, 404)
  if (session.host_user_id !== userId && session.guest_user_id !== userId) {
    return c.json({ success: false, error: '접근 권한 없음' }, 403)
  }
  if (session.status !== 'both_done') {
    return c.json({ success: false, error: '아직 두 사람 모두 준비되지 않았습니다.' }, 400)
  }
  if (session.ai_report_text) {
    return c.json({ success: true, data: { report: session.ai_report_text, compatibility_score: session.compatibility_score, cached: true } })
  }

  // 두 사람 정보 조회
  const host = await DB.prepare('SELECT nickname, email FROM users WHERE id=?').bind(session.host_user_id).first<{ nickname: string | null; email: string }>()
  const guest = session.guest_user_id
    ? await DB.prepare('SELECT nickname, email FROM users WHERE id=?').bind(session.guest_user_id).first<{ nickname: string | null; email: string }>()
    : null

  const hostName  = host?.nickname  || host?.email?.split('@')[0]  || 'A'
  const guestName = guest?.nickname || guest?.email?.split('@')[0] || 'B'

  // NEW-BUG-3 FIX: JSON.parse 예외처리
  const hostData  = (() => { try { return session.host_result_json  ? JSON.parse(session.host_result_json)  : {} } catch { return {} } })()
  const guestData = (() => { try { return session.guest_result_json ? JSON.parse(session.guest_result_json) : {} } catch { return {} } })()

  const prompt = buildCouplePrompt(
    hostName, guestName,
    hostData.big5  ?? null, guestData.big5  ?? null,
    hostData.lost  ?? null, guestData.lost  ?? null,
    hostData.dsi   ?? null, guestData.dsi   ?? null
  )

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, stream: false, messages: [{ role: 'user', content: prompt }] }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[Couple Report] Anthropic error:', res.status, errText)
    return c.json({ error: 'AI 오류', detail: errText, httpStatus: res.status }, 502)
  }

  const aiData = await res.json() as { content: Array<{ type: string; text: string }> }
  const reportText = aiData.content?.find(b => b.type === 'text')?.text ?? ''

  // SCORE:XX 파싱
  const scoreMatch = reportText.match(/SCORE:(\d+)/)
  const compatScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 70
  const cleanReport = reportText.replace(/SCORE:\d+\n?/, '').trim()

  // 리포트 저장
  await DB.prepare(
    `UPDATE couple_sessions SET ai_report_text=?, compatibility_score=?, status='reported', updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(cleanReport, compatScore, session.id).run()

  return c.json({ success: true, data: { report: cleanReport, compatibility_score: compatScore } })
})

// ── POST /api/couple/save-result ──────────────────────────
// maumful 프론트가 검사 완료 시 result_json 저장 (연동 API)
app.post('/api/couple/save-result', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { test_type, result_json } = await c.req.json().catch(() => ({})) as {
    test_type?: string; result_json?: Record<string, unknown>
  }
  if (!test_type || !result_json) return c.json({ success: false, error: '파라미터 부족' }, 400)
  if (!['BIG5', 'LOST', 'DSI'].includes(test_type)) return c.json({ success: false, error: '지원하지 않는 검사 유형' }, 400)

  // 가장 최근 test_history 레코드 업데이트
  await DB.prepare(
    `UPDATE test_history SET result_json=? WHERE id=(
       SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1
     )`
  ).bind(JSON.stringify(result_json), userId, test_type).run()

  return c.json({ success: true })
})

// ── PATCH /api/couple/session/:code/cancel ─────────────────
// 세션 취소 (host만 가능, waiting 상태만)
app.patch('/api/couple/session/:code/cancel', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const code = c.req.param('code').toUpperCase()
  const session = await DB.prepare(
    'SELECT * FROM couple_sessions WHERE session_code=?'
  ).bind(code).first<CoupleSession>()

  if (!session) return c.json({ success: false, error: '세션 없음' }, 404)
  if (session.host_user_id !== userId) return c.json({ success: false, error: 'host만 취소 가능합니다' }, 403)
  if (session.status === 'reported') return c.json({ success: false, error: '완료된 세션은 취소할 수 없습니다' }, 400)
  if (session.status === 'expired') return c.json({ success: false, error: '이미 만료된 세션입니다' }, 400)

  // 세션 만료 처리 (credits는 환불하지 않음 — 서비스 정책)
  await DB.prepare(
    `UPDATE couple_sessions SET status='expired', updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(session.id).run()

  return c.json({ success: true, message: '세션이 취소되었습니다.' })
})

// ── GET /api/couple/partner-info/:code (공개 — 인증 불필요) ──
app.get('/api/couple/partner-info/:code', async (c) => {
  const { DB } = c.env
  const code = c.req.param('code').toUpperCase()
  const session = await DB.prepare(
    `SELECT session_code, test_type, host_user_id, status, expires_at
     FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(code).first<{ session_code: string; test_type: string; host_user_id: number; status: string }>()

  if (!session) return c.json({ success: false, error: '유효하지 않은 링크입니다.' }, 404)
  if (session.status !== 'waiting') return c.json({ success: false, error: '이미 파트너가 참여한 세션입니다.' }, 400)

  const host = await DB.prepare('SELECT nickname, email FROM users WHERE id=?')
    .bind(session.host_user_id).first<{ nickname: string | null; email: string }>()
  const hostName = host?.nickname || host?.email?.split('@')[0] || '파트너'

  return c.json({ success: true, data: { session_code: code, test_type: session.test_type, host_name: hostName } })
})

// ── POST /api/couple/partner-submit (공개 — 인증 불필요) ────
app.post('/api/couple/partner-submit', async (c) => {
  const { DB } = c.env
  const { session_code, results } = await c.req.json().catch(() => ({})) as {
    session_code?: string; results?: Record<string, unknown>
  }
  if (!session_code || !results) return c.json({ success: false, error: '파라미터 부족' }, 400)

  const session = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(session_code.toUpperCase()).first<CoupleSession>()

  if (!session) return c.json({ success: false, error: '유효하지 않은 링크입니다.' }, 404)
  if (session.status !== 'waiting') return c.json({ success: false, error: '이미 파트너가 참여한 세션입니다.' }, 400)
  if (session.guest_result_json) return c.json({ success: false, error: '이미 제출된 결과가 있습니다.' }, 409)

  const hostHasData = (() => {
    try { return Object.keys(JSON.parse(session.host_result_json || '{}')).length > 0 } catch { return false }
  })()
  const newStatus = hostHasData ? 'both_done' : 'waiting'

  await DB.prepare(
    `UPDATE couple_sessions SET guest_result_json=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(JSON.stringify(results), newStatus, session.id).run()

  return c.json({ success: true, data: { status: newStatus } })
})

// ── POST /api/couple/solo-analysis ────────────────────────
// 나 혼자 심리검사 결과 기반 AI 이상형 성향 분석 (5cr)
app.post('/api/couple/solo-analysis', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare(
    'SELECT email, nickname, credits FROM users WHERE id=?'
  ).bind(userId).first<{ email: string; nickname: string | null; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const isMaster = isMasterAccount(user.email)
  const COST = 5
  if (!isMaster && user.credits < COST) {
    return c.json({ success: false, error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`, needsCharge: true }, 402)
  }

  const [big5Row, lostRow, dsiRow] = await Promise.all([
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first<{ result_json: string }>(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first<{ result_json: string }>(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first<{ result_json: string }>(),
  ])

  if (!big5Row && !lostRow && !dsiRow) {
    return c.json({ success: false, error: '검사 결과가 없습니다. 마음풀에서 먼저 검사를 완료해주세요.' }, 400)
  }

  const name = user.nickname || user.email.split('@')[0]
  let prompt = `당신은 연애·관계 심리 전문가입니다. 아래 심리검사 결과를 바탕으로 이 사람의 연애 성향과 이상적인 파트너 유형을 분석해주세요.\n\n[분석 대상] ${name}\n\n`

  try {
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json) as Record<string, number>
      const labels: Record<string, string> = { O:'개방성', C:'성실성', E:'외향성', A:'친화성', N:'신경성' }
      prompt += `[BIG5 성격검사]\n`
      for (const key of ['O','C','E','A','N']) prompt += `${labels[key]}: ${b[key] ?? 0}점\n`
      prompt += '\n'
    }
    if (lostRow) {
      const l = JSON.parse(lostRow.result_json) as Record<string, string>
      prompt += `[LOST 행동유형]\n유형: ${l.typeCode ?? '?'} — ${l.typeName ?? ''}\n\n`
    }
    if (dsiRow) {
      const d = JSON.parse(dsiRow.result_json) as { total?: number }
      prompt += `[자아분화(SDRI)]\n총점: ${d.total ?? 0}점 (만점 125점)\n\n`
    }
  } catch {}

  prompt += `[분석 지침]\n다음 세 가지를 각각 3~4줄로 작성해주세요:\n`
  prompt += `1. 나의 연애 강점: 이 사람이 관계에서 잘하는 것과 매력 포인트\n`
  prompt += `2. 잘 맞는 파트너 유형: 이 사람과 궁합이 좋은 성격·행동 특성 (구체적으로)\n`
  prompt += `3. 함께 성장할 포인트: 더 좋은 관계를 위한 개인 성장 방향 (긍정적 표현으로)\n`
  prompt += `\n전체 500자 이내, 따뜻하고 실용적인 톤으로 작성하세요. 진단명·병명은 사용하지 마세요.`

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, stream: false, messages: [{ role: 'user', content: prompt }] }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return c.json({ error: 'AI 오류', detail: errText }, 502)
  }

  const aiData = await res.json() as { content: Array<{ type: string; text: string }> }
  const reportText = aiData.content?.find(b => b.type === 'text')?.text ?? ''

  if (COST > 0 && !isMaster) {
    await spendCredits(DB, userId, COST, 'solo-analysis')
  }

  return c.json({ success: true, data: { report: reportText } })
})

// ── GET /api/couple/admin/stats ────────────────────────────
// 관리자 통계 (마스터 계정 전용)
app.get('/api/couple/admin/stats', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email FROM users WHERE id=?').bind(userId).first<{ email: string }>()
  if (!isMasterAccount(user?.email)) return c.json({ success: false, error: '권한 없음' }, 403)

  const today = new Date().toISOString().slice(0, 10)

  const [total, todayCount, reported, avgScore, byType, recentSessions] = await DB.batch([
    DB.prepare('SELECT COUNT(*) AS cnt FROM couple_sessions'),
    DB.prepare(`SELECT COUNT(*) AS cnt FROM couple_sessions WHERE DATE(created_at)=?`).bind(today),
    DB.prepare(`SELECT COUNT(*) AS cnt FROM couple_sessions WHERE status='reported'`),
    DB.prepare(`SELECT ROUND(AVG(compatibility_score),1) AS avg FROM couple_sessions WHERE status='reported' AND compatibility_score > 0`),
    DB.prepare(`SELECT test_type, COUNT(*) AS cnt FROM couple_sessions GROUP BY test_type ORDER BY cnt DESC`),
    DB.prepare(`SELECT cs.id, cs.session_code, cs.test_type, cs.status, cs.compatibility_score, cs.credits_spent, cs.created_at,
                  hu.email AS host_email, gu.email AS guest_email
                FROM couple_sessions cs
                LEFT JOIN users hu ON cs.host_user_id = hu.id
                LEFT JOIN users gu ON cs.guest_user_id = gu.id
                ORDER BY cs.created_at DESC LIMIT 10`),
  ])

  return c.json({
    success: true,
    data: {
      total:    (total.results[0] as Record<string, number>).cnt,
      today:    (todayCount.results[0] as Record<string, number>).cnt,
      reported: (reported.results[0] as Record<string, number>).cnt,
      avgScore: (avgScore.results[0] as Record<string, number>).avg ?? 0,
      byType:   byType.results,
      recent:   recentSessions.results,
    },
  })
})

// ── BUG-6 FIX: export default 단일 객체로 통합 (Hono + Cron 핸들러)
// Cron WHERE 조건 정리: reported 상태는 IN 목록에 없으므로 AND 조건 불필요
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext) {
    const result = await env.DB.prepare(
      `UPDATE couple_sessions
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('waiting', 'both_done')
          AND expires_at < datetime('now')`
    ).run()
    console.log(`[Cron] 만료 세션 정리: ${result.meta.changes}건`)
  },
}
