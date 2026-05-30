// ============================================================
// maumcouple  src/index.tsx
// 마음커플 — BIG5 / LOST 커플 비교 분석 플랫폼
// maumful D1/KV 공유 · JWT SSO (마음게임과 동일 패턴)
// ============================================================
import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ── Bindings ──────────────────────────────────────────────
interface Bindings {
  DB:                D1Database
  KV:                KVNamespace
  ANTHROPIC_API_KEY?: string
  JWT_SECRET?:       string
  RESEND_API_KEY?:   string
  VAPID_PRIVATE_KEY?: string
  VAPID_PUBLIC_KEY?:  string
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
  const secret = (await env.KV.get('JWT_SECRET')) ?? env.JWT_SECRET ?? 'dev_secret_change_in_production'
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

// ── VAPID JWT 서명 (ES256) ────────────────────────────────
async function signVapidJwt(privateKeyB64u: string, audience: string): Promise<string> {
  const b64uDec = (s: string) => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0))
  const b64uEnc = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const raw = b64uDec(privateKeyB64u)
  // PKCS#8 DER 래핑 (P-256 EC private key, 32 bytes)
  const pkcs8 = new Uint8Array([
    0x30,0x41,0x02,0x01,0x00,0x30,0x13,0x06,0x07,
    0x2a,0x86,0x48,0xce,0x3d,0x02,0x01,0x06,0x08,
    0x2a,0x86,0x48,0xce,0x3d,0x03,0x01,0x07,0x04,
    0x27,0x30,0x25,0x02,0x01,0x01,0x04,0x20,...raw,
  ])
  const key = await crypto.subtle.importKey('pkcs8', pkcs8, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign'])
  const now = Math.floor(Date.now() / 1000)
  const hdr = btoa(JSON.stringify({typ:'JWT',alg:'ES256'})).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const pay = btoa(JSON.stringify({aud:audience,exp:now+43200,sub:'mailto:noreply@maumful.com'})).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
  const sig = await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, key, new TextEncoder().encode(`${hdr}.${pay}`))
  return `${hdr}.${pay}.${b64uEnc(sig)}`
}

// ── Web Push 발송 (VAPID 인증, 페이로드 없음) ─────────────
async function sendWebPush(endpoint: string, privKey: string, pubKey: string): Promise<boolean> {
  try {
    const origin = new URL(endpoint).origin
    const jwt = await signVapidJwt(privKey, origin)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `vapid t=${jwt},k=${pubKey}`, 'TTL': '86400', 'Content-Length': '0' },
    })
    return res.status < 300
  } catch { return false }
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
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/static/icon-192.png">
  <meta name="theme-color" content="#E05A8A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="마음커플">
  <meta property="og:title" content="마음커플 — 커플 심리 분석">
  <meta property="og:description" content="BIG5·LOST 심리검사 결과로 커플 궁합과 관계 패턴을 분석해보세요.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/static/icon-512.png">
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
</head>
<body>
  <div id="root"></div>
  <script>
    // SSO 토큰 처리 — React 마운트 전 실행 필수
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    const codeParam = urlParams.get('code');
    if (t) {
      localStorage.setItem('couple_token', t);
      const nextUrl = codeParam ? '/?code=' + encodeURIComponent(codeParam) : '/';
      window.history.replaceState({}, '', nextUrl);
    }
  </script>
  <script src="/static/compiled/couple_hub.js?v=${v}"></script>
</body>
</html>`

app.get('/favicon.ico', (c) => {
  const base = new URL(c.req.url).hostname.includes('lightoflife')
    ? 'https://jesusmaum.com'
    : 'https://maumful.com'
  return fetch(`${base}/favicon.ico`)
})
app.get('/favicon.png', (c) => {
  const base = new URL(c.req.url).hostname.includes('lightoflife')
    ? 'https://jesusmaum.com'
    : 'https://maumful.com'
  return fetch(`${base}/favicon.png`)
})
app.get('/static/icon-192.png', (c) => {
  const base = new URL(c.req.url).hostname.includes('lightoflife')
    ? 'https://jesusmaum.com'
    : 'https://maumful.com'
  return fetch(`${base}/static/icon-192.png`)
})
app.get('/manifest.json', (c) => {
  const isLightoflife = new URL(c.req.url).hostname.includes('lightoflife')
  return c.json({
    name: isLightoflife ? 'CTS 커플 케어' : '마음커플',
    short_name: isLightoflife ? '커플 케어' : '마음커플',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF0F6',
    theme_color: '#E05A8A',
    icons: [{ src: '/static/icon-192.png', sizes: '192x192', type: 'image/png' }],
  })
})
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

  // 호스트에게 Web Push 알림 전송 (VAPID 구성된 경우)
  if (c.env.VAPID_PRIVATE_KEY && c.env.VAPID_PUBLIC_KEY) {
    const hostSub = await DB.prepare(
      `SELECT endpoint FROM push_subscriptions WHERE user_id=? AND service='maumcouple'`
    ).bind(session.host_user_id).first<{ endpoint: string }>()
    if (hostSub) {
      sendWebPush(hostSub.endpoint, c.env.VAPID_PRIVATE_KEY, c.env.VAPID_PUBLIC_KEY).catch(() => {})
    }
  }

  return c.json({ success: true, data: { session: updated, guestJoined: true } })
})

// ── GET /api/couple/vapid-key ─────────────────────────────
app.get('/api/couple/vapid-key', (c) => {
  return c.json({ success: true, key: c.env.VAPID_PUBLIC_KEY || '' })
})

// ── POST /api/couple/push-subscribe ──────────────────────
app.post('/api/couple/push-subscribe', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const { endpoint, p256dh, auth } = await c.req.json().catch(() => ({})) as { endpoint?: string; p256dh?: string; auth?: string }
  if (!endpoint || !p256dh || !auth) return c.json({ success: false, error: '잘못된 구독 정보' }, 400)
  await DB.prepare(`
    INSERT INTO push_subscriptions (user_id, service, endpoint, p256dh, auth_key)
    VALUES (?, 'maumcouple', ?, ?, ?)
    ON CONFLICT(user_id, service) DO UPDATE SET endpoint=excluded.endpoint, p256dh=excluded.p256dh, auth_key=excluded.auth_key
  `).bind(userId, endpoint, p256dh, auth).run()
  return c.json({ success: true })
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

// ── POST /api/couple/coach ────────────────────────────────
// AI 관계 코칭 채팅 (하루 3회 무료, 이후 2cr/회)
app.post('/api/couple/coach', async (c) => {
  const { DB, KV } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email, nickname, credits FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const { messages } = await c.req.json().catch(() => ({})) as {
    messages?: Array<{ role: string; content: string }>
  }
  if (!messages?.length) return c.json({ success: false, error: '메시지 필요' }, 400)

  const isMaster = isMasterAccount(user.email)
  const FREE_LIMIT = 3
  const PAID_COST  = 2

  // KST 기준 일일 카운터
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  const counterKey = `couple_coach:${userId}:${today}`
  const usedToday  = parseInt((await KV.get(counterKey)) || '0', 10)

  if (!isMaster) {
    if (usedToday >= FREE_LIMIT) {
      if (user.credits < PAID_COST) {
        return c.json({ success: false, error: `크레딧 부족 (필요: ${PAID_COST}cr)`, needsCharge: true, usedToday }, 402)
      }
      await spendCredits(DB, userId, PAID_COST, 'couple-coach')
    }
  }

  // 사용자 BIG5 컨텍스트
  const name = user.nickname || user.email.split('@')[0]
  let personalCtx = ''
  try {
    const big5Row = await DB.prepare(
      `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
    ).bind(userId).first<{ result_json: string }>()
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json) as Record<string, number>
      const traits: string[] = []
      if ((b.E || 50) > 60) traits.push('외향적')
      else if ((b.E || 50) < 40) traits.push('내향적')
      if ((b.A || 50) > 65) traits.push('친화력 높음')
      if ((b.N || 50) > 65) traits.push('감수성 예민')
      if ((b.C || 50) > 65) traits.push('계획적')
      if (traits.length) personalCtx = `\n[내담자 특성] ${name}: ${traits.join(', ')}`
    }
  } catch {}

  const systemPrompt = `당신은 따뜻하고 공감적인 커플·연애 관계 코치입니다.${personalCtx}

내담자의 연애 고민이나 관계 문제에 대해 전문적이고 실질적인 조언을 해주세요.
- 심리학 기반 근거 있는 조언 (애착 이론, 비폭력 소통 등)
- 진단명·병명 절대 사용 금지
- 따뜻하고 비판하지 않는 톤
- 답변은 200자 이내, 간결하게
- 필요 시 구체적인 대화 예시나 실천 방법 제안`

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return c.json({ error: 'AI 오류', detail: errText }, 502)
  }

  const aiData = await res.json() as { content: Array<{ type: string; text: string }> }
  const replyText = aiData.content?.find(b => b.type === 'text')?.text ?? ''

  if (!isMaster) {
    await KV.put(counterKey, String(usedToday + 1), { expirationTtl: 86400 })
  }

  return c.json({
    success: true,
    data: {
      reply: replyText,
      usedToday: usedToday + 1,
      freeLimit: FREE_LIMIT,
      isPaid: usedToday >= FREE_LIMIT,
      creditsSpent: (!isMaster && usedToday >= FREE_LIMIT) ? PAID_COST : 0,
    },
  })
})

// ── GET /api/couple/checkins ──────────────────────────────
// 관계 성장 체크인 기록 조회 (최근 6개)
app.get('/api/couple/checkins', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const rows = await DB.prepare(
    `SELECT id, total_score, answers_json, created_at
     FROM relationship_checkins WHERE user_id=?
     ORDER BY created_at DESC LIMIT 6`
  ).bind(userId).all<{ id: number; total_score: number; answers_json: string; created_at: string }>()

  // 이번 달 체크인 여부
  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const donThisMonth = rows.results.some(r => r.created_at.startsWith(thisMonth))

  return c.json({ success: true, data: { checkins: rows.results, doneThisMonth: donThisMonth } })
})

// ── POST /api/couple/checkin ───────────────────────────────
// 관계 성장 체크인 저장 (무료, 월 1회 제한)
app.post('/api/couple/checkin', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { answers } = await c.req.json().catch(() => ({})) as { answers?: Record<string, number> }
  if (!answers || typeof answers !== 'object') return c.json({ success: false, error: '답변 데이터 필요' }, 400)

  // 이번 달 체크인 중복 방지 (KST 기준)
  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const existing = await DB.prepare(
    `SELECT id FROM relationship_checkins WHERE user_id=? AND created_at >= ? AND created_at < ?`
  ).bind(userId, `${thisMonth}-01`, `${thisMonth}-32`).first()
  if (existing) return c.json({ success: false, error: '이번 달 체크인은 이미 완료했습니다.', doneThisMonth: true }, 409)

  const values = Object.values(answers).map(Number).filter(v => v >= 1 && v <= 5)
  if (values.length < 5) return c.json({ success: false, error: '충분한 답변이 필요합니다.' }, 400)
  const totalScore = values.reduce((a, b) => a + b, 0)

  await DB.prepare(
    `INSERT INTO relationship_checkins (user_id, total_score, answers_json) VALUES (?,?,?)`
  ).bind(userId, totalScore, JSON.stringify(answers)).run()

  return c.json({ success: true, data: { totalScore, maxScore: values.length * 5 } })
})

// ── POST /api/couple/date-course ──────────────────────────
// AI 데이트 코스 추천 (1cr)
app.post('/api/couple/date-course', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email, credits, nickname FROM users WHERE id=?')
    .bind(userId).first<{ email: string; credits: number; nickname: string | null }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const { region, mood, duration, budget } = await c.req.json().catch(() => ({})) as {
    region?: string; mood?: string; duration?: string; budget?: string
  }
  if (!region || !mood || !duration || !budget) {
    return c.json({ success: false, error: '지역, 분위기, 시간, 예산을 모두 선택해주세요.' }, 400)
  }

  const isMaster = isMasterAccount(user.email)
  const COST = 1
  if (!isMaster && user.credits < COST) {
    return c.json({ success: false, error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`, needsCharge: true }, 402)
  }

  // 커플 BIG5/LOST 데이터 가져오기 (개인화 추천)
  const [big5Row, lostRow] = await Promise.all([
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first<{ result_json: string }>(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first<{ result_json: string }>(),
  ])

  const name = user.nickname || user.email.split('@')[0]
  let personalityCtx = ''
  try {
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json) as Record<string, number>
      const isExtrovert = (b.E || 50) > 55
      const isOpenMinded = (b.O || 50) > 55
      personalityCtx = `\n[성격 참고] ${name}은(는) ${isExtrovert ? '외향적' : '내향적'}이고 ${isOpenMinded ? '새로운 경험을 좋아함' : '익숙한 환경을 선호함'}.`
    }
    if (lostRow) {
      const l = JSON.parse(lostRow.result_json) as Record<string, string>
      if (l.typeCode) personalityCtx += ` LOST 유형: ${l.typeCode}.`
    }
  } catch {}

  const prompt = `당신은 커플 데이트 플래너입니다. 아래 조건에 맞는 데이트 코스를 추천해주세요.${personalityCtx}

[조건]
- 지역: ${region}
- 분위기: ${mood}
- 소요 시간: ${duration}
- 예산: ${budget}

[작성 형식 — 반드시 이 형식으로만 작성]
📍 추천 장소
1. [장소명] — 한줄 설명 (소요시간)
2. [장소명] — 한줄 설명 (소요시간)
3. [장소명] — 한줄 설명 (소요시간)

🗺️ 추천 동선
장소1 → 장소2 → 장소3 흐름 설명 (2줄 이내)

✨ 오늘의 데이트 포인트
이 코스의 특별한 점 한 가지 (2줄 이내)

💬 함께 나눌 대화 주제
대화 제안 한 가지

전체 300자 이내로 간결하게 작성하세요.`

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, stream: false, messages: [{ role: 'user', content: prompt }] }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return c.json({ error: 'AI 오류', detail: errText }, 502)
  }

  const aiData = await res.json() as { content: Array<{ type: string; text: string }> }
  const courseText = aiData.content?.find(b => b.type === 'text')?.text ?? ''

  if (COST > 0 && !isMaster) {
    await spendCredits(DB, userId, COST, 'date-course')
  }

  return c.json({ success: true, data: { course: courseText, region, mood, duration, budget } })
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

// ── GET /api/couple/partner-moments ─────────────────────────
// 파트너의 최근 마음게임 기록 (감정 수채화 + 별빛 감사 일기)
app.get('/api/couple/partner-moments', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  // 가장 최근 커플 세션에서 파트너 ID 찾기 (상태 무관)
  const session = await DB.prepare(
    `SELECT host_user_id, guest_user_id FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?)
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, userId).first<{ host_user_id: number; guest_user_id: number | null }>()

  if (!session) return c.json({ success: true, data: { hasPartner: false } })

  const partnerId = session.host_user_id === userId ? session.guest_user_id : session.host_user_id
  if (!partnerId) return c.json({ success: true, data: { hasPartner: false } })

  const partner = await DB.prepare('SELECT nickname, email FROM users WHERE id=?')
    .bind(partnerId).first<{ nickname: string | null; email: string }>()
  const partnerName = partner?.nickname || partner?.email?.split('@')[0] || '파트너'

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  const [moodRows, gratRows] = await Promise.all([
    DB.prepare(
      `SELECT metadata, created_at FROM game_session_logs
       WHERE user_id=? AND game_id='mood' AND created_at > ?
       ORDER BY created_at DESC LIMIT 7`
    ).bind(partnerId, sevenDaysAgo).all<{ metadata: string; created_at: string }>(),
    DB.prepare(
      `SELECT metadata, created_at FROM game_session_logs
       WHERE user_id=? AND game_id='gratitude'
       ORDER BY created_at DESC LIMIT 3`
    ).bind(partnerId).all<{ metadata: string; created_at: string }>(),
  ])

  const parse = (row: { metadata: string; created_at: string }) => {
    try { return { ...JSON.parse(row.metadata), created_at: row.created_at } }
    catch { return { created_at: row.created_at } }
  }

  return c.json({
    success: true,
    data: {
      hasPartner: true,
      partnerName,
      moodEntries: moodRows.results.map(parse),
      gratEntries: gratRows.results.map(parse),
    },
  })
})

// ── GET /api/couple/admin/stats ────────────────────────────
// 관리자 통계 (마스터 계정 전용)
// ── GET /api/couple/timeline ──────────────────────────────
// 관계 활동 타임라인 (체크인 + 커플 세션 + AI 리포트 + 데이트 코스)
app.get('/api/couple/timeline', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const [sessions, checkins] = await Promise.all([
    DB.prepare(`
      SELECT cs.code, cs.status, cs.compatibility_score, cs.created_at, cs.test_types,
             CASE WHEN cs.host_user_id=? THEN u2.nickname ELSE u1.nickname END AS partner_name
      FROM couple_sessions cs
      LEFT JOIN users u1 ON u1.id = cs.host_user_id
      LEFT JOIN users u2 ON u2.id = cs.guest_user_id
      WHERE (cs.host_user_id=? OR cs.guest_user_id=?)
        AND cs.status IN ('both_done','reported','expired')
      ORDER BY cs.created_at DESC LIMIT 20
    `).bind(userId, userId, userId).all<{
      code: string; status: string; compatibility_score: number | null;
      created_at: string; test_types: string | null; partner_name: string | null
    }>(),
    DB.prepare(`
      SELECT total_score, answers_json, created_at
      FROM relationship_checkins WHERE user_id=?
      ORDER BY created_at DESC LIMIT 10
    `).bind(userId).all<{ total_score: number; created_at: string }>(),
  ])

  type TimelineItem = {
    type: string; date: string; title: string; subtitle: string; score?: number | null; emoji: string
  }
  const items: TimelineItem[] = []

  for (const s of sessions.results) {
    if (s.status === 'reported' && s.compatibility_score != null) {
      items.push({
        type: 'report',
        date: s.created_at,
        title: '커플 궁합 리포트',
        subtitle: s.partner_name ? `${s.partner_name}님과의 분석` : '파트너와의 분석',
        score: s.compatibility_score,
        emoji: '💕',
      })
    } else if (s.status === 'both_done' || s.status === 'expired') {
      items.push({
        type: 'session',
        date: s.created_at,
        title: '커플 검사 완료',
        subtitle: s.partner_name ? `${s.partner_name}님과 함께` : '검사 완료',
        emoji: '🧪',
      })
    }
  }

  for (const ch of checkins.results) {
    const pct = Math.round((ch.total_score / 50) * 100)
    const label = pct >= 80 ? '매우 건강해요' : pct >= 60 ? '건강해요' : pct >= 40 ? '보통이에요' : '개선이 필요해요'
    items.push({
      type: 'checkin',
      date: ch.created_at,
      title: '관계 성장 체크인',
      subtitle: `${ch.total_score}/50점 — ${label}`,
      score: ch.total_score,
      emoji: '📊',
    })
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return c.json({ success: true, data: items })
})

// ── POST /api/couple/invite-email ─────────────────────────
// 파트너 이메일로 세션 초대 링크 발송
app.post('/api/couple/invite-email', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { email, session_code } = await c.req.json() as { email: string; session_code: string }
  if (!email || !session_code) return c.json({ success: false, error: '이메일과 세션 코드 필요' }, 400)

  // 이메일 유효성 간단 체크
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return c.json({ success: false, error: '올바른 이메일 주소를 입력하세요' }, 400)

  // 세션 소유자 확인
  const session = await DB.prepare(
    'SELECT session_code, host_user_id FROM couple_sessions WHERE session_code=? AND status=?'
  ).bind(session_code, 'waiting').first<{ session_code: string; host_user_id: number }>()
  if (!session || session.host_user_id !== userId)
    return c.json({ success: false, error: '유효하지 않은 세션입니다' }, 404)

  // 발신자 닉네임
  const me = await DB.prepare('SELECT nickname, email FROM users WHERE id=?').bind(userId).first<{ nickname: string | null; email: string }>()
  const myName = me?.nickname || me?.email?.split('@')[0] || '파트너'

  const base = 'https://couple.maumful.com'
  const inviteUrl = `${base}/?code=${session_code}`

  if (!c.env.RESEND_API_KEY)
    return c.json({ success: false, error: 'RESEND_API_KEY 미설정 — 이메일 발송 불가' }, 500)

  const html = `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;background:#FFF8F9;padding:0;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#D4587A,#E8829E);padding:32px 24px;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">💕</div>
    <h1 style="color:white;font-size:20px;margin:0;font-weight:700">마음커플 초대가 도착했어요</h1>
  </div>
  <div style="padding:28px 28px 24px">
    <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">
      안녕하세요! <strong>${myName}</strong>님이 마음커플에서 심리 궁합 분석을 함께 해보자고 초대했어요.
    </p>
    <div style="background:white;border-radius:12px;padding:18px 20px;margin-bottom:24px;border:1px solid #F0D8E0;text-align:center">
      <div style="font-size:12px;color:#B07088;margin-bottom:6px">초대코드</div>
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#D4587A;font-family:monospace">${session_code}</div>
    </div>
    <a href="${inviteUrl}" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#D4587A,#E8829E);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:16px">
      💕 검사 시작하기
    </a>
    <p style="font-size:12px;color:#A09098;text-align:center;line-height:1.6">
      로그인 없이 바로 참여할 수 있어요.<br>위 버튼을 클릭하거나 <a href="https://couple.maumful.com" style="color:#D4587A">couple.maumful.com</a>에서 코드를 입력하세요.
    </p>
  </div>
  <div style="padding:12px 28px 20px;text-align:center">
    <p style="font-size:11px;color:#C0A8B0">마음커플 — 커플 심리 분석 서비스</p>
  </div>
</div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: '마음커플 <noreply@maumful.com>', to: [email], subject: `💕 ${myName}님이 마음커플에 초대했어요`, html }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[invite-email] Resend 오류:', err)
      return c.json({ success: false, error: '이메일 발송 실패' }, 500)
    }
    return c.json({ success: true })
  } catch (e) {
    console.error('[invite-email] 예외:', e)
    return c.json({ success: false, error: '이메일 발송 실패' }, 500)
  }
})

// ── 감정 번역기 ────────────────────────────────────────────
app.post('/api/couple/emotion-translate', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email, credits FROM users WHERE id=?')
    .bind(userId).first<{ email: string; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const COST = 1
  const isMaster = isMasterAccount(user.email)
  if (!isMaster && user.credits < COST)
    return c.json({ success: false, error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`, needsCharge: true }, 402)

  const { situation, message } = await c.req.json() as { situation?: string; message: string }
  if (!message?.trim()) return c.json({ success: false, error: '메시지를 입력해주세요' }, 400)

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ success: false, error: 'AI 서비스 미설정' }, 500)

  const prompt = `당신은 연인 사이의 말 뒤에 숨겨진 감정을 분석하는 시스템입니다.
입력된 말만 근거로 분석하며, 추측·과장 없이 3가지 항목을 출력합니다.

[출력 형식 — 반드시 아래 형식, 다른 내용 추가 금지]
**진짜 감정**: (1문장)
**진짜 원하는 것**: (1문장)
**추천 반응**: (2문장 이내, 따뜻하고 구체적으로)
`
  const userMsg = situation
    ? `상황: ${situation}\n\n상대방이 한 말: "${message}"`
    : `상대방이 한 말: "${message}"`

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        temperature: 0,
        system: prompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })
    if (!res.ok) return c.json({ success: false, error: 'AI 오류' }, 500)
    const json = await res.json() as { content: Array<{ text: string }> }
    const result = json.content?.[0]?.text || ''
    // AI 성공 후 차감 (실패 시 차감 없음)
    if (!isMaster) await DB.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').bind(COST, userId).run()
    return c.json({ success: true, result })
  } catch (e) {
    return c.json({ success: false, error: 'AI 연결 오류' }, 500)
  }
})

// ── 싸움 중재 AI ────────────────────────────────────────────
app.post('/api/couple/fight-mediate', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email, credits FROM users WHERE id=?')
    .bind(userId).first<{ email: string; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const COST = 2
  const isMaster = isMasterAccount(user.email)
  if (!isMaster && user.credits < COST)
    return c.json({ success: false, error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`, needsCharge: true }, 402)

  const { situation, myFeel, partnerFeel } = await c.req.json() as { situation: string; myFeel: string; partnerFeel: string }
  if (!situation?.trim()) return c.json({ success: false, error: '상황을 입력해주세요' }, 400)

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ success: false, error: 'AI 서비스 미설정' }, 500)

  const prompt = `당신은 커플 사이의 갈등을 중립적으로 중재하는 시스템입니다.
어느 한쪽 편을 들지 않으며, 두 사람의 감정이 모두 타당함을 전제합니다.
입력된 내용만 근거로 분석하며, 아래 형식만 출력합니다.

[출력 형식 — 반드시 이 순서, 이 제목]
**A 입장에서 보면**: (이 사람이 왜 그렇게 느꼈는지 1~2문장, 공감적으로)
**B 입장에서 보면**: (이 사람이 왜 그렇게 느꼈는지 1~2문장, 공감적으로)
**두 사람의 공통점**: (둘 다 원하는 것을 1문장으로)
**화해 시작 문구**: (A가 먼저 건넬 수 있는 말 1문장, B가 먼저 건넬 수 있는 말 1문장)
`
  const parts = [`싸운 상황: ${situation}`]
  if (myFeel?.trim()) parts.push(`내가 느낀 감정: ${myFeel}`)
  if (partnerFeel?.trim()) parts.push(`상대방이 느낀 감정(추정): ${partnerFeel}`)

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        temperature: 0,
        system: prompt,
        messages: [{ role: 'user', content: parts.join('\n') }],
      }),
    })
    if (!res.ok) return c.json({ success: false, error: 'AI 오류' }, 500)
    const json = await res.json() as { content: Array<{ text: string }> }
    const result = json.content?.[0]?.text || ''
    if (!isMaster) await DB.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').bind(COST, userId).run()
    return c.json({ success: true, result })
  } catch (e) {
    return c.json({ success: false, error: 'AI 연결 오류' }, 500)
  }
})

// ── 카톡 대화 분석 ─────────────────────────────────────────
app.post('/api/couple/kakao-analyze', async (c) => {
  const { DB } = c.env
  const userId = await getCoupleUserId(c.req.raw, c.env)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT email, credits FROM users WHERE id=?')
    .bind(userId).first<{ email: string; credits: number }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const COST = 3
  const isMaster = isMasterAccount(user.email)
  if (!isMaster && user.credits < COST)
    return c.json({ success: false, error: `크레딧 부족 (보유: ${user.credits}, 필요: ${COST})`, needsCharge: true }, 402)

  const { stats, sample } = await c.req.json() as {
    stats: { names: string[]; counts: Record<string, number>; chars: Record<string, number>; total: number; days: number }
    sample: string
  }
  if (!stats?.names?.length) return c.json({ success: false, error: '대화 데이터가 없습니다' }, 400)

  const apiKey = await getAnthropicKey(c.env)
  if (!apiKey) return c.json({ success: false, error: 'AI 서비스 미설정' }, 500)

  const prompt = `당신은 커플의 카카오톡 대화 통계를 바탕으로 따뜻하고 통찰 있는 리포트를 작성하는 시스템입니다.
수치에 과도한 의미 부여를 하지 않으며, 두 사람을 비교·평가하지 않습니다.
아래 형식만 출력합니다.

[출력 형식]
**대화 스타일**: (두 사람의 대화 패턴을 2~3문장으로, 통계 수치 인용)
**눈에 띄는 점**: (특징적인 부분 1가지, 1~2문장)
**함께 성장하는 포인트**: (관계에 도움이 될 제안 1가지, 긍정적으로)
`

  const statsText = stats.names.map(n =>
    `${n}: 메시지 ${stats.counts[n] || 0}개, 글자수 ${(stats.chars[n] || 0).toLocaleString()}자`
  ).join(' / ')

  const userMsg = `분석 기간: ${stats.days}일, 총 메시지: ${stats.total}개\n참여자별 통계: ${statsText}\n\n대화 샘플(최근 30개):\n${sample}`

  try {
    const res = await fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        temperature: 0,
        system: prompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })
    if (!res.ok) return c.json({ success: false, error: 'AI 오류' }, 500)
    const json = await res.json() as { content: Array<{ text: string }> }
    const result = json.content?.[0]?.text || ''
    if (!isMaster) await DB.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').bind(COST, userId).run()
    return c.json({ success: true, result })
  } catch (e) {
    return c.json({ success: false, error: 'AI 연결 오류' }, 500)
  }
})

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

// ── 주간 커플 인사이트 이메일 ──────────────────────────────
async function sendCoupleInsightEmail(
  env: Bindings,
  to: string,
  name: string,
  data: { checkinScore: number | null; prevScore: number | null; partnerName: string | null; sessionStatus: string }
): Promise<void> {
  if (!env.RESEND_API_KEY) return
  const { checkinScore, prevScore, partnerName, sessionStatus } = data
  const displayName = name || '회원'

  const scoreLine = checkinScore != null
    ? `<p style="font-size:15px;color:#333;margin:0 0 8px">📊 이번 달 관계 건강도: <strong style="color:#E05A8A">${checkinScore}점</strong>${prevScore != null ? ` (지난달 대비 ${checkinScore >= prevScore ? `+${checkinScore - prevScore}` : checkinScore - prevScore}점)` : ''}</p>`
    : `<p style="font-size:14px;color:#888;margin:0 0 8px">💡 이번 달 관계 성장 체크인을 아직 하지 않았어요.</p>`

  const partnerLine = partnerName
    ? `<p style="font-size:14px;color:#555;margin:0 0 8px">💕 파트너 <strong>${partnerName}</strong>님과 함께하고 있어요</p>`
    : `<p style="font-size:14px;color:#888;margin:0 0 8px">아직 파트너가 연결되지 않았어요. 코드를 공유해 보세요!</p>`

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#fdf2f8;margin:0;padding:20px">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">
  <div style="background:linear-gradient(135deg,#E05A8A,#f472b6);padding:28px 24px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">💕</div>
    <h1 style="margin:0;font-size:20px;color:white;font-weight:700">이번 주 마음커플 인사이트</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">${displayName}님을 위한 관계 요약</p>
  </div>
  <div style="padding:24px">
    ${partnerLine}
    ${scoreLine}
    <div style="background:#fdf2f8;border-radius:12px;padding:16px;margin:16px 0">
      <p style="font-size:13px;color:#9d4f7c;font-weight:700;margin:0 0 8px">💬 이번 주 대화 질문</p>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.6">파트너에게 물어보세요: <em>"요즘 당신에게 가장 고마운 순간은 언제였나요?"</em></p>
    </div>
    <div style="text-align:center;margin-top:20px">
      <a href="https://couple.maumful.com" style="display:inline-block;background:linear-gradient(135deg,#E05A8A,#f472b6);color:white;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px">마음커플 열기 →</a>
    </div>
  </div>
  <div style="padding:16px 24px;border-top:1px solid #f0f0f0;text-align:center">
    <p style="font-size:11px;color:#bbb;margin:0">마음커플 · <a href="https://couple.maumful.com" style="color:#E05A8A">수신 거부</a></p>
  </div>
</div>
</body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: '마음커플 <noreply@maumful.com>',
      to,
      subject: `💕 ${displayName}님의 이번 주 관계 인사이트`,
      html,
    }),
  }).catch(e => console.error('[Email] 발송 실패', e))
}

// ── BUG-6 FIX: export default 단일 객체로 통합 (Hono + Cron 핸들러)
// Cron WHERE 조건 정리: reported 상태는 IN 목록에 없으므로 AND 조건 불필요
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext) {
    // 매월 1일 — 만료 세션 정리
    if (event.cron === '0 3 1 * *') {
      const result = await env.DB.prepare(
        `UPDATE couple_sessions
            SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE status IN ('waiting', 'both_done')
            AND expires_at < datetime('now')`
      ).run()
      console.log(`[Cron] 만료 세션 정리: ${result.meta.changes}건`)
      return
    }

    // 매주 월요일 08:00 KST (일요일 23:00 UTC) — 주간 인사이트 이메일
    if (event.cron === '0 23 * * 0') {
      if (!env.RESEND_API_KEY) { console.log('[Cron] RESEND_API_KEY 미설정 — 이메일 발송 건너뜀'); return }

      // 활성 커플 세션 또는 최근 체크인 기록이 있는 사용자 조회
      const users = await env.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.nickname
        FROM users u
        WHERE u.id IN (
          SELECT DISTINCT host_user_id FROM couple_sessions WHERE status IN ('waiting','both_done','reported') AND created_at > datetime('now','-30 days')
          UNION
          SELECT DISTINCT guest_user_id FROM couple_sessions WHERE guest_user_id IS NOT NULL AND status IN ('both_done','reported') AND created_at > datetime('now','-30 days')
        )
        AND u.email IS NOT NULL
        LIMIT 200
      `).all<{ id: number; email: string; nickname: string | null }>()

      let sent = 0
      for (const u of users.results) {
        try {
          // 이번 달 + 지난달 체크인 조회
          const checkins = await env.DB.prepare(
            `SELECT total_score, created_at FROM relationship_checkins WHERE user_id=? ORDER BY created_at DESC LIMIT 2`
          ).bind(u.id).all<{ total_score: number; created_at: string }>()

          // 가장 최근 커플 세션 파트너 이름 조회
          const session = await env.DB.prepare(
            `SELECT host_user_id, guest_user_id FROM couple_sessions WHERE (host_user_id=? OR guest_user_id=?) AND status IN ('both_done','reported') ORDER BY created_at DESC LIMIT 1`
          ).bind(u.id, u.id).first<{ host_user_id: number; guest_user_id: number | null }>()

          let partnerName: string | null = null
          if (session) {
            const partnerId = session.host_user_id === u.id ? session.guest_user_id : session.host_user_id
            if (partnerId) {
              const partner = await env.DB.prepare('SELECT nickname FROM users WHERE id=?').bind(partnerId).first<{ nickname: string | null }>()
              partnerName = partner?.nickname || null
            }
          }

          await sendCoupleInsightEmail(env, u.email, u.nickname || '회원', {
            checkinScore: checkins.results[0]?.total_score ?? null,
            prevScore:    checkins.results[1]?.total_score ?? null,
            partnerName,
            sessionStatus: 'active',
          })
          sent++
          // 과도한 API 호출 방지
          await new Promise(r => setTimeout(r, 100))
        } catch (e) {
          console.error(`[Cron] 이메일 발송 실패 uid=${u.id}`, e)
        }
      }
      console.log(`[Cron] 주간 인사이트 이메일 발송: ${sent}건`)
    }
  },
}
