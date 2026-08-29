import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ============================================================
// 타입 정의
// ============================================================
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  ANTHROPIC_API_KEY?: string
  AI_MODEL?: string                 // AI 모델 ID (기본값: claude-sonnet-4-6)
  AI_PROXY_URL?: string             // AI egress 프록시 URL(전용 IP). 미설정 시 기존 게이트웨이 폴백
  TOSS_SECRET_KEY?: string        // 토스페이먼츠 결제 요청 시크릿
  TOSS_BILLING_KEY?: string       // 토스페이먼츠 빌링키 발급용 시크릿 (구독 결제)
  TOSS_CLIENT_KEY?: string        // 토스페이먼츠 클라이언트 키 (브라우저용)
  TOSS_WEBHOOK_SECRET?: string    // 토스 Webhook 서명 검증
  STRIPE_SECRET_KEY?: string      // Stripe 결제 요청 시크릿
  STRIPE_WEBHOOK_SECRET?: string  // Stripe Webhook 서명 검증
  ADMIN_SECRET?: string
  ADMIN_ALLOWED_IPS?: string      // 콤마 구분 허용 IP (미설정 시 모두 허용)
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string      // 이메일 발신자 주소 (예: noreply@your-domain.com)
  SERVICE_URL?: string            // 서비스 도메인 (예: https://maumful.kr)
  COUNSELING_NOTIFY_EMAIL?: string // 상담 알림 수신 이메일
  GOOGLE_CLIENT_ID?: string       // Google OAuth 클라이언트 ID
  GA_MEASUREMENT_ID?: string      // Google Analytics 4 측정 ID (G-XXXXXXXXXX)
  NAVER_SITE_KEY?: string         // 네이버 서치어드바이저 인증 코드
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  KAKAO_REST_API_KEY?: string
  KAKAO_APP_KEY?: string         // 카카오 JavaScript 앱 키 (프론트엔드용)
  NAVER_CLIENT_ID?: string       // 네이버 로그인 클라이언트 ID
  NAVER_CLIENT_SECRET?: string   // 네이버 로그인 클라이언트 시크릿 (wrangler secret put)
}

type User = {
  id: number
  email: string
  password_hash: string | null
  social_provider: string | null
  social_id: string | null
  nickname: string | null
  locale: string
  country_code: string
  credits: number
  is_email_verified: number
  partner_code: string | null
  gender: string | null
  age_range: string | null
  phone: string | null
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ── 전역 에러 핸들러 + 에러 로그 저장 ──────────────────────
async function logError(db: D1Database, opts: {
  service?: string; status?: number; method?: string; path?: string
  message: string; stack?: string; userId?: number
}) {
  try {
    // 최근 500개 초과 시 오래된 항목 자동 정리
    await db.prepare(
      `INSERT INTO error_logs (service,status_code,method,path,message,stack,user_id)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(
      opts.service || 'maumful', opts.status ?? null,
      opts.method ?? null, opts.path ?? null,
      opts.message.slice(0, 500), (opts.stack ?? '').slice(0, 1000),
      opts.userId ?? null
    ).run()
    // 오래된 로그 정리 (최근 500개만 유지)
    await db.prepare(
      `DELETE FROM error_logs WHERE id NOT IN (SELECT id FROM error_logs ORDER BY created_at DESC LIMIT 500)`
    ).run()
  } catch { /* 로그 저장 실패는 무시 */ }
}

app.onError(async (err, c) => {
  const db = c.env?.DB
  if (db) {
    await logError(db, {
      status: 500,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      message: err.message || String(err),
      stack: err.stack,
    }).catch(() => {})
  }
  console.error('[UnhandledError]', c.req.method, new URL(c.req.url).pathname, err.message)
  return c.json({ success: false, error: '서버 오류가 발생했습니다.' }, 500)
})
// 정적 파일은 Cloudflare Assets가 자동 처리 ([assets] 설정)

// ============================================================
// Rate Limiting 미들웨어 (Cloudflare KV 기반)
// ─ 인증 엔드포인트: IP당 분당 10회
// ─ AI 엔드포인트:   유저당 분당 20회
// ─ 일반 API:        IP당 분당 60회
// ============================================================
async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSec = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const kvKey  = `rl:${key}`
  const now    = Math.floor(Date.now() / 1000)
  const bucket = Math.floor(now / windowSec)        // 윈도우 버킷
  const fullKey = `${kvKey}:${bucket}`

  try {
    const raw = await kv.get(fullKey)
    const count = raw ? parseInt(raw) : 0
    if (count >= limit) return { allowed: false, remaining: 0 }
    // 비동기로 카운터 증가 (응답 지연 최소화)
    kv.put(fullKey, String(count + 1), { expirationTtl: windowSec * 2 }).catch(() => {})
    return { allowed: true, remaining: limit - count - 1 }
  } catch {
    return { allowed: true, remaining: limit }   // KV 오류 시 통과 (가용성 우선)
  }
}

// 관리자 IP 화이트리스트 체크
function isAdminIp(c: { req: { header: (k: string) => string | undefined }, env: Bindings }): boolean {
  const allowedIps = (c.env as unknown as Record<string, string>).ADMIN_ALLOWED_IPS   // 콤마 구분 IP 목록
  if (!allowedIps) return true    // 미설정 시 허용 (개발 환경 대응)
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
  return allowedIps.split(',').map(ip => ip.trim()).includes(clientIp)
}

// ============================================================
// 유틸리티
// ============================================================

async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
  const buf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256
  )
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:sha256:100000:${salt}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, , iterStr, salt, expected] = stored.split(':')
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
    const buf = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: parseInt(iterStr), hash: 'SHA-256' }, key, 256
    )
    const actual = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (actual.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
    return diff === 0
  } catch { return false }
}

// JWT HS256 (Cloudflare Workers Web Crypto)
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const toB64 = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const header = toB64({ alg: 'HS256', typ: 'JWT' })
  const body   = toB64(payload)
  const enc    = new TextEncoder()
  const key    = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig    = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${header}.${body}.${sigB64}`
}

// 마음 시리즈 SSO 토큰(payload_b64u.sig_b64u, HMAC-SHA256). 마음수달/곁이 동일 MAUM_SSO_SECRET로 검증.
async function signSso(secret: string, payload: Record<string, unknown>): Promise<string> {
  const b64u = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = b64u(JSON.stringify(payload))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return payloadB64 + '.' + sig
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.')
    const enc  = new TextEncoder()
    const key  = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigB = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const ok   = await crypto.subtle.verify('HMAC', key, sigB, enc.encode(`${header}.${body}`))
    if (!ok) return null
    const p = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    if (p.exp && p.exp < Date.now() / 1000) return null
    return p
  } catch { return null }
}

// ── 마스터(테스트) 계정 ─────────────────────────────────────
const MASTER_EMAILS = ['limyj007@gmail.com']
function isMasterAccount(email: string | null | undefined): boolean {
  return !!email && MASTER_EMAILS.includes(email.toLowerCase())
}

async function getJwtSecret(kv: KVNamespace): Promise<string> {
  return (await kv.get('JWT_SECRET')) ?? 'dev_secret_change_in_production'
}

async function getAuthUserId(req: Request, kv: KVNamespace): Promise<number | null> {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const secret  = await getJwtSecret(kv)
  const payload = await verifyJwt(auth.slice(7), secret)
  if (!payload || typeof payload.sub !== 'number') return null
  return payload.sub
}

// 크레딧 차감
// Race Condition 방지: WHERE credits >= ? 조건으로 단일 UPDATE 사용
// SELECT 후 UPDATE 패턴 제거 → 동시 요청이 와도 DB 레벨에서 원자적으로 처리
async function spendCredits(
  db: D1Database, userId: number, amount: number, reason: string, refId?: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  // credits >= amount 조건을 WHERE에 포함 → 잔액 부족이면 0 rows affected
  const result = await db.prepare(
    'UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?'
  ).bind(amount, userId, amount).run()

  if (!result.meta.changes || result.meta.changes === 0) {
    // 변경된 행 없음 → 사용자 없거나 잔액 부족
    const user = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>()
    if (!user) return { ok: false, balance: 0, error: 'user_not_found' }
    return { ok: false, balance: user.credits, error: 'insufficient_credits' }
  }

  // 차감 후 잔액 조회 (변경된 행이 있으므로 반드시 존재)
  const updated = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>()
  const newBalance = updated!.credits

  await db.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)')
    .bind(userId, 'spend', amount, reason, newBalance, refId ?? null).run()

  return { ok: true, balance: newBalance }
}

// 크레딧 지급 (원자적 UPDATE, SELECT 없이 처리)
async function gainCredits(
  db: D1Database, userId: number, amount: number, reason: string, refId?: string
): Promise<number> {
  // ⚠️ 크레딧 증감과 원장 기록을 원자적으로(D1 batch = 단일 트랜잭션). 예전엔 UPDATE→SELECT→INSERT
  //    3문장이 비원자적이라, 결제 지급 중 원장 INSERT만 실패하면 "크레딧은 줬는데 throw"가 되어
  //    호출부에서 롤백 시 이중지급 위험이 있었다. 이제 둘 다 성공 or 둘 다 실패.
  //    balance_after는 같은 트랜잭션의 갱신값을 서브쿼리로 읽어 정확히 기록(레이스 제거).
  await db.batch([
    db.prepare('UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(amount, userId),
    db.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,(SELECT credits FROM users WHERE id=?),?)')
      .bind(userId, 'gain', amount, reason, userId, refId ?? null),
  ])

  const updated = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>()
  return updated?.credits ?? 0
}

// API 키 복호화 (기존 로직 유지)
function decryptApiKey(encrypted: string, secret: string): string {
  const key   = secret.padEnd(32, '0').slice(0, 32)
  const kB    = new TextEncoder().encode(key)
  const bytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes.map((b, i) => b ^ kB[i % kB.length]))
}

async function getAnthropicKey(db: D1Database, env: Bindings): Promise<string | null> {
  // Cloudflare Secret (env) 만 사용 — DB 조회 제거 (구 키 오염 방지)
  return env.ANTHROPIC_API_KEY ?? null
}

// AI 모델 ID — 환경변수 AI_MODEL 우선, 없으면 최신 안정 버전 사용
// Cloudflare 대시보드 > Workers > Settings > Variables > AI_MODEL 에서 변경 가능
// 사용 가능 모델은 /api/admin/test-ai 로 진단
function getAiModel(env: Bindings): string {
  return env.AI_MODEL ?? 'claude-sonnet-4-6'
}

// AI 호출 엔드포인트 — 전용 egress 프록시(공유 Worker IP 차단 회피용).
//   AI_PROXY_URL 미설정 시 기존 AI Gateway로 폴백(=기존 동작 100% 동일). 시크릿만 지우면 즉시 원복.
function aiEndpoint(env: Bindings): string {
  return env.AI_PROXY_URL ?? 'https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages'
}

// 랜덤 토큰 생성
function randomToken(bytes = 32): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================
// 지역 설정 API
// ============================================================
app.get('/api/config/region', (c) => {
  const country = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
  const lang    = (c.req.header('accept-language') ?? 'ko').slice(0, 2).toLowerCase()
  const isKorea = country === 'KR' || lang === 'ko'

  const globalTests = ['PHQ9', 'GAD7', 'DASS21', 'BIG5', 'LOST', 'RIASEC', 'VALUES']
  // 무료검사(PHQ9·GAD7)를 맨 앞에 배치
  const koreaTests  = ['PHQ9', 'GAD7', 'DASS21', 'BIG5', 'LOST', 'SCT', 'DSI', 'BURNOUT', 'RIASEC', 'VALUES']

  return c.json({
    country,
    lang: isKorea ? 'ko' : 'en',
    pg: isKorea ? 'toss' : 'stripe',
    currency: isKorea ? 'KRW' : 'USD',
    availableTests: isKorea ? koreaTests : globalTests,
    crisisLine: isKorea
      ? { label: '자살예방상담전화', number: '1393' }
      : { label: 'Crisis Lifeline', number: '988' },
    creditPrices: isKorea
      ? {
          starter:  { credits: 50,  amount: 2900  },
          standard: { credits: 120, amount: 5900  },
          premium:  { credits: 300, amount: 12900 },
          pro:      { credits: 700, amount: 24900 },
        }
      : {
          starter:  { credits: 50,  amount: 299   },
          standard: { credits: 120, amount: 599   },
          premium:  { credits: 300, amount: 1299  },
          pro:      { credits: 700, amount: 2499  },
        },
  })
})

// ============================================================
// 인증 API
// ============================================================

// 회원가입
app.post('/api/auth/register', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `register:${ip}`, 5, 3600) // 시간당 5회
  if (!rl.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)

  const body = await c.req.json()
  const { email, password, nickname, locale = 'ko', partnerCode, marketingAgreed = false,
          gender = null, age_range = null, phone = null } = body

  if (!email || !password)
    return c.json({ success: false, error: '이메일과 비밀번호는 필수입니다.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return c.json({ success: false, error: '유효하지 않은 이메일입니다.' }, 400)
  if (password.length < 8)
    return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400)

  const existing = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first()
  if (existing) return c.json({ success: false, error: '이미 가입된 이메일입니다.' }, 409)

  const passwordHash = await hashPassword(password)
  const country      = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
  const consentIp    = c.req.header('cf-connecting-ip') || ip

  // 파트너 코드 검증 (있는 경우에만)
  const validPartner = partnerCode
    ? await DB.prepare("SELECT code FROM partners WHERE code=? AND is_active=1").bind(String(partnerCode).toUpperCase()).first<{ code: string }>()
    : null
  const resolvedPartnerCode = validPartner?.code ?? null

  const now = new Date().toISOString()

  // 가입 보너스: 20 크레딧 + 동의 기록 저장
  const result = await DB.prepare(`
    INSERT INTO users (email, password_hash, nickname, locale, country_code, credits, is_email_verified, partner_code,
                       terms_agreed_at, privacy_agreed_at, marketing_agreed, marketing_agreed_at, consent_ip,
                       gender, age_range, phone)
    VALUES (?, ?, ?, ?, ?, 20, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    email.toLowerCase(), passwordHash, nickname ?? email.split('@')[0], locale, country, resolvedPartnerCode,
    now,                          // terms_agreed_at
    now,                          // privacy_agreed_at
    marketingAgreed ? 1 : 0,      // marketing_agreed
    marketingAgreed ? now : null,  // marketing_agreed_at
    consentIp,                    // consent_ip
    gender || null,               // gender
    age_range || null,            // age_range
    phone || null,                // phone
  ).run()

  const userId = result.meta.last_row_id as number

  await DB.batch([
    DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)')
      .bind(userId, 'gain', 20, 'signup_bonus', 20),
  ])

  // 이메일 인증 생략 (추후 활성화 예정)
  // 이메일 인증 토큰 생성 및 발송
  const verifyToken = randomToken()
  const expiresAt   = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  await DB.prepare(
    'INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(userId, verifyToken, 'email_verify', expiresAt).run()
  await sendVerifyEmail(c.env, email.toLowerCase(), nickname ?? email.split('@')[0], verifyToken)

  return c.json({
    success: true,
    message: '가입 완료! 이메일로 발송된 인증 링크를 확인해주세요. (6시간 이내)',
    data: { userId, email: email.toLowerCase(), credits: 20, requiresVerification: true },
  }, 201)
})

// 이메일 인증
// 인증 결과 페이지(브라우저에서 직접 열리는 링크라 raw JSON 대신 HTML)
function verifyResultHtml(ok: boolean, title: string, msg: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>이메일 인증 · 마음풀</title></head>
<body style="margin:0;font-family:'Noto Sans KR',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F7F5;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
  <div style="background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.06);max-width:420px;width:100%;padding:44px 28px;text-align:center">
    <div style="font-size:52px;margin-bottom:14px">${ok ? '✅' : '⚠️'}</div>
    <h1 style="font-size:20px;color:${ok ? '#1C4D38' : '#B45309'};margin:0 0 10px">${title}</h1>
    <p style="font-size:14px;color:#5A5A5A;line-height:1.75;margin:0 0 26px">${msg}</p>
    <a href="https://maumful.com/" style="display:inline-block;background:#2F7D5B;color:#fff;text-decoration:none;padding:13px 30px;border-radius:12px;font-weight:700;font-size:15px">마음풀로 이동 →</a>
  </div>
</body></html>`
}
app.get('/api/auth/verify/:token', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  const row   = await DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token = ? AND type = 'email_verify'
  `).bind(token).first<{ id: number; user_id: number; expires_at: string; used_at: string | null }>()

  if (!row) return c.html(verifyResultHtml(false, '인증 링크 오류', '유효하지 않은 인증 링크예요. 회원가입을 다시 진행하거나 로그인 화면에서 인증 메일을 다시 받아 주세요.'))

  // ⚠️ 멱등 — 이미 사용됨(메일 클라이언트/보안 스캐너의 링크 프리페치 포함)이거나 이미 인증된 계정이면
  //    에러가 아니라 '인증 완료'로 안내한다. 예전엔 프리페치가 토큰을 먼저 소진해 사용자 클릭 시 에러가 났다.
  const u = await DB.prepare('SELECT is_email_verified FROM users WHERE id = ?').bind(row.user_id).first<{ is_email_verified: number }>()
  if (row.used_at || u?.is_email_verified) {
    if (!u?.is_email_verified) await DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(row.user_id).run()
    return c.html(verifyResultHtml(true, '이메일 인증 완료', '이미 인증이 완료된 이메일이에요. 이제 마음풀에 로그인하실 수 있어요.'))
  }

  if (new Date(row.expires_at) < new Date())
    return c.html(verifyResultHtml(false, '링크 만료', '인증 링크가 만료됐어요(발송 후 6시간). 로그인 화면에서 인증 메일을 다시 요청해 주세요.'))

  await DB.batch([
    DB.prepare('UPDATE users SET is_email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(row.user_id),
    DB.prepare('UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?').bind(row.id),
  ])
  return c.html(verifyResultHtml(true, '이메일 인증 완료', '이메일 인증이 완료됐어요. 이제 마음풀에 로그인하실 수 있어요.'))
})

// 이메일 로그인
app.post('/api/auth/login', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `login:${ip}`, 10, 60) // 분당 10회
  if (!rl.allowed) return c.json({ success: false, error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429)

  const { email, password } = await c.req.json()

  if (!email || !password)
    return c.json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' }, 400)

  const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email.toLowerCase()).first<User>()
  if (!user)
    return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
  if (!user.password_hash)
    return c.json({ success: false, error: '소셜 로그인 계정입니다.' }, 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid)
    return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)


  // ── 이메일 인증 강제 (2026-07-19 활성화) ──
  //   기존 회원은 그랜드파더링(is_email_verified=1)했고, 이 시점 이후 신규 이메일가입만 인증 필수.
  //   소셜 로그인(구글·카카오·네이버)은 가입 시 is_email_verified=1이라 무관.
  //   프론트는 requiresVerification를 받아 '인증 필요 + 재발송' 안내(/api/auth/resend-verify).
  if (user.is_email_verified === 0) {
    return c.json({ success: false, error: '이메일 인증이 필요합니다. 가입 시 받은 인증 메일을 확인해 주세요.', requiresVerification: true, email: user.email }, 403)
  }

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessToken  = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshToken = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 })

  return c.json({
    success: true,
    data: {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits },
      emailVerified: user.is_email_verified === 1,
    },
  })
})

// ============================================================
// 파트너 채널 SSO 로그인
// ============================================================
// 파트너가 자신의 사용자를 마음풀에 자동 로그인시키는 엔드포인트.
// 파트너 서버는 { uid, email?, nick?, exp } payload를 JSON 직렬화 후
// Base64Url 인코딩하고 HMAC-SHA256(sso_secret, payload_b64u)로 서명.
// 최종 sso_token = payload_b64u + "." + sig_b64u
app.post('/api/auth/partner-sso', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `partner_sso:${ip}`, 20, 60)
  if (!rl.allowed) return c.json({ success: false, error: '요청이 너무 많습니다.' }, 429)

  const { partnerCode, ssoToken } = await c.req.json() as { partnerCode?: string; ssoToken?: string }
  if (!partnerCode || !ssoToken)
    return c.json({ success: false, error: 'partnerCode, ssoToken 필수' }, 400)

  const partner = await DB.prepare(
    "SELECT code, name, sso_secret FROM partners WHERE code=? AND is_active=1"
  ).bind(partnerCode.toUpperCase()).first<{ code: string; name: string; sso_secret: string | null }>()

  if (!partner)       return c.json({ success: false, error: '유효하지 않은 파트너 코드' }, 404)
  if (!partner.sso_secret) return c.json({ success: false, error: '이 파트너는 SSO를 지원하지 않습니다.' }, 403)

  // 토큰 검증: payload_b64u.sig_b64u
  const dotIdx = ssoToken.lastIndexOf('.')
  if (dotIdx < 0) return c.json({ success: false, error: '잘못된 SSO 토큰 형식' }, 400)
  const payloadB64 = ssoToken.slice(0, dotIdx)
  const receivedSig = ssoToken.slice(dotIdx + 1)

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(partner.sso_secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  if (receivedSig !== expectedSig)
    return c.json({ success: false, error: '서명 검증 실패' }, 401)

  // payload 파싱
  let payload: { uid: string; email?: string; nick?: string; exp?: number }
  try {
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    payload = JSON.parse(json)
  } catch {
    return c.json({ success: false, error: '페이로드 파싱 실패' }, 400)
  }

  // 만료 확인
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000))
    return c.json({ success: false, error: 'SSO 토큰이 만료되었습니다.' }, 401)
  if (!payload.uid)
    return c.json({ success: false, error: 'uid 필드 필수' }, 400)

  const socialProvider = `partner_${partner.code.toLowerCase()}`
  const socialId       = String(payload.uid)

  // 기존 파트너 계정 조회 또는 신규 생성
  let user = await DB.prepare(
    "SELECT * FROM users WHERE social_provider=? AND social_id=?"
  ).bind(socialProvider, socialId).first<User>()

  let isNewUser = false
  if (!user) {
    isNewUser = true
    const country  = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
    const nickname = payload.nick ?? (payload.email ? payload.email.split('@')[0] : `${partner.name}유저`)
    const email    = payload.email ?? null
    const r = await DB.prepare(`
      INSERT INTO users (email, password_hash, social_provider, social_id, nickname, locale, country_code, credits, is_email_verified, partner_code)
      VALUES (?, NULL, ?, ?, ?, 'ko', ?, 20, 1, ?)
    `).bind(email, socialProvider, socialId, nickname, country, partner.code).run()
    const newId = r.meta.last_row_id as number
    await DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)')
      .bind(newId, 'gain', 20, 'signup_bonus', 20).run()
    user = await DB.prepare("SELECT * FROM users WHERE id=?").bind(newId).first<User>()
  }

  if (!user) return c.json({ success: false, error: '사용자 생성 실패' }, 500)

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessToken  = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshToken = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 })

  return c.json({
    success: true,
    data: {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits },
      isNewUser,
    },
  })
})

// ============================================================
// 파트너 공개 설정 조회 (프론트에서 브랜딩/환영메시지 표시용)
// ============================================================
app.get('/api/partner/config', async (c) => {
  const { DB } = c.env
  const code = (c.req.query('p') ?? '').toUpperCase()
  if (!code) return c.json({ success: false, error: 'p 파라미터 필수' }, 400)

  let partner
  try {
    partner = await DB.prepare(
      "SELECT code, name, welcome_message, featured_tests, primary_color, logo_url, entry_headline, entry_subcopy, entry_benefit, entry_cta_label, entry_cta_go FROM partners WHERE code=? AND is_active=1"
    ).bind(code).first()
  } catch {
    // ⚠️ entry_* 컬럼이 아직 없는 환경(migration 0027 미적용) → 기본 컬럼만으로 폴백(회귀 방지).
    //    entry_* 없으면 partner_entry가 파트너명 기반 기본문구로 렌더. migration 적용되면 자동 활성화.
    partner = await DB.prepare(
      "SELECT code, name, welcome_message, featured_tests, primary_color, logo_url FROM partners WHERE code=? AND is_active=1"
    ).bind(code).first()
  }
  if (!partner) return c.json({ success: false, error: '파트너를 찾을 수 없습니다.' }, 404)
  return c.json({ success: true, data: partner })
})

// 제휴 진입 퍼널 로그 (진입→CTA→가입→결제 측정). 비로그인 허용·fire-and-forget·실패 무해.
app.post('/api/partner/entry-log', async (c) => {
  const { DB } = c.env
  let b: { code?: string; event?: string; variant?: string }
  try { b = await c.req.json() } catch { return c.json({ ok: false }, 400) }
  const code = (b.code || '').toUpperCase().slice(0, 40)
  const event = (b.event || '').slice(0, 30)
  if (!code || !event) return c.json({ ok: false }, 400)
  try {
    await DB.prepare('INSERT INTO partner_entry_events (partner_code, event, variant) VALUES (?,?,?)')
      .bind(code, event, b.variant ? String(b.variant).slice(0, 20) : null).run()
  } catch { /* 테이블 없거나 실패해도 무해 */ }
  return c.json({ ok: true })
})

// 토큰 갱신
app.post('/api/auth/refresh', async (c) => {
  const { KV } = c.env
  const { refreshToken } = await c.req.json()
  if (!refreshToken) return c.json({ success: false, error: 'refresh token 필요' }, 400)

  const secret  = await getJwtSecret(KV)
  const payload = await verifyJwt(refreshToken, secret)
  if (!payload || payload.type !== 'refresh' || typeof payload.sub !== 'number')
    return c.json({ success: false, error: '유효하지 않은 토큰' }, 401)

  const stored = await KV.get(`refresh:${payload.sub}`)
  if (stored !== refreshToken) return c.json({ success: false, error: '만료된 토큰' }, 401)

  const now         = Math.floor(Date.now() / 1000)
  const accessToken = await signJwt({ sub: payload.sub, iat: now, exp: now + 3600 }, secret)
  return c.json({ success: true, data: { accessToken } })
})

// 로그아웃
app.post('/api/auth/logout', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (userId) await KV.delete(`refresh:${userId}`)
  return c.json({ success: true })
})

// 이메일 인증 재발송
app.post('/api/auth/resend-verify', async (c) => {
  const { DB, KV } = c.env
  const { email } = await c.req.json()
  if (!email) return c.json({ success: false, error: '이메일을 입력해주세요.' }, 400)

  // Rate Limit: 이메일당 1시간에 3회
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `resend-verify:${ip}`, 3, 3600)
  if (!rl.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)

  const user = await DB.prepare(
    'SELECT id, nickname, is_email_verified FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<{ id: number; nickname: string | null; is_email_verified: number }>()

  // 보안: 존재 여부 노출하지 않음
  if (!user) return c.json({ success: true, message: '인증 메일을 발송했습니다.' })
  if (user.is_email_verified === 1) return c.json({ success: false, error: '이미 인증된 이메일입니다.' }, 400)

  // 기존 미사용 토큰 무효화
  await DB.prepare(
    "UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND type = 'email_verify' AND used_at IS NULL"
  ).bind(user.id).run()

  // 새 토큰 생성 (6시간)
  const token     = randomToken()
  const expiresAt = new Date(Date.now() + 6 * 3600 * 1000).toISOString()
  await DB.prepare('INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES (?,?,?,?)')
    .bind(user.id, token, 'email_verify', expiresAt).run()

  // 메일 발송
  await sendVerifyEmail(c.env, email.toLowerCase(), user.nickname || '', token)

  return c.json({ success: true, message: '인증 메일을 발송했습니다. 받은 편지함을 확인해주세요.' })
})

// 구글 로그인
app.post('/api/auth/google', async (c) => {
  const { DB, KV } = c.env
  const { idToken } = await c.req.json()
  if (!idToken) return c.json({ success: false, error: 'idToken 필요' }, 400)

  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  if (!verifyRes.ok) return c.json({ success: false, error: '구글 토큰 검증 실패' }, 401)
  const info = await verifyRes.json() as { sub: string; email: string; name?: string }

  let user = await DB.prepare('SELECT * FROM users WHERE social_provider = ? AND social_id = ?')
    .bind('google', info.sub).first<User>()

  if (!user) {
    const existing = await DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(info.email.toLowerCase()).first<User>()

    if (existing) {
      await DB.prepare('UPDATE users SET social_provider=?,social_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind('google', info.sub, existing.id).run()
      user = { ...existing, social_provider: 'google', social_id: info.sub }
    } else {
      const country = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
      const r = await DB.prepare(
        'INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,1,20)'
      ).bind(info.email.toLowerCase(), 'google', info.sub, info.name ?? info.email.split('@')[0], 'ko', country).run()
      const newId = r.meta.last_row_id as number
      await DB.batch([
        DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)').bind(newId,'gain',20,'signup_bonus',20),
      ])
      user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(newId).first<User>() as User
    }
  }

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessToken  = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshToken = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 })

  return c.json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits } } })
})

// 카카오 로그인
app.post('/api/auth/kakao', async (c) => {
  const { DB, KV } = c.env
  const { accessToken } = await c.req.json()
  if (!accessToken) return c.json({ success: false, error: 'accessToken 필요' }, 400)

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!userRes.ok) return c.json({ success: false, error: '카카오 토큰 검증 실패' }, 401)
  const info = await userRes.json() as {
    id: number
    kakao_account?: {
      email?: string
      profile?: { nickname?: string }
    }
  }

  const kakaoId  = String(info.id)
  const email    = info.kakao_account?.email
  const nickname = info.kakao_account?.profile?.nickname

  let user = await DB.prepare('SELECT * FROM users WHERE social_provider = ? AND social_id = ?')
    .bind('kakao', kakaoId).first<User>()

  if (!user) {
    if (email) {
      const existing = await DB.prepare('SELECT * FROM users WHERE email = ?')
        .bind(email.toLowerCase()).first<User>()
      if (existing) {
        await DB.prepare('UPDATE users SET social_provider=?,social_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind('kakao', kakaoId, existing.id).run()
        user = { ...existing, social_provider: 'kakao', social_id: kakaoId }
      }
    }
    if (!user) {
      const country  = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
      const emailVal = email?.toLowerCase() ?? `kakao_${kakaoId}@kakao.local`
      const r = await DB.prepare(
        'INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,?,20)'
      ).bind(emailVal, 'kakao', kakaoId, nickname ?? '카카오사용자', 'ko', country, email ? 1 : 0).run()
      const newId = r.meta.last_row_id as number
      await DB.batch([
        DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)').bind(newId, 'gain', 20, 'signup_bonus', 20),
      ])
      user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(newId).first<User>() as User
    }
  }

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessTok    = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshTok   = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshTok, { expirationTtl: 30 * 86400 })

  return c.json({ success: true, data: { accessToken: accessTok, refreshToken: refreshTok, user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits } } })
})

// 카카오 로그인 — OAuth 2.0 Authorization URL 반환
app.get('/api/auth/kakao/url', (c) => {
  const clientId = c.env.KAKAO_REST_API_KEY
  if (!clientId) return c.json({ success: false, error: '카카오 로그인 미설정' }, 500)
  const serviceUrl = (c.env as unknown as Record<string,string>).SERVICE_URL || ''
  const redirectUri = `${serviceUrl}/api/auth/kakao/callback`
  const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
  return c.json({ success: true, url })
})

// 카카오 로그인 — OAuth 콜백 (code → token → user → JWT → postMessage)
app.get('/api/auth/kakao/callback', async (c) => {
  const { DB, KV } = c.env
  const code     = c.req.query('code')
  const clientId = c.env.KAKAO_REST_API_KEY

  const errPage = (msg: string) => new Response(
    `<!DOCTYPE html><html><body><script>window.opener?.postMessage({type:'kakao_error',error:${JSON.stringify(msg)}},window.location.origin);window.close();</script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )

  if (!code || !clientId) return errPage('설정 오류')

  // code → access_token
  const serviceUrl = (c.env as unknown as Record<string,string>).SERVICE_URL || ''
  const redirectUri = `${serviceUrl}/api/auth/kakao/callback`
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirectUri, code }),
  }).catch(() => null)
  if (!tokenRes?.ok) return errPage('토큰 발급 실패')

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) return errPage('액세스 토큰 없음')

  // access_token → user info
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  }).catch(() => null)
  if (!userRes?.ok) return errPage('사용자 정보 조회 실패')

  const info = await userRes.json() as {
    id: number
    kakao_account?: { email?: string; profile?: { nickname?: string } }
  }

  const kakaoId  = String(info.id)
  const email    = info.kakao_account?.email
  const nickname = info.kakao_account?.profile?.nickname

  let user = await DB.prepare('SELECT * FROM users WHERE social_provider=? AND social_id=?')
    .bind('kakao', kakaoId).first<User>()

  if (!user) {
    if (email) {
      const existing = await DB.prepare('SELECT * FROM users WHERE email=?')
        .bind(email.toLowerCase()).first<User>()
      if (existing) {
        await DB.prepare('UPDATE users SET social_provider=?,social_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind('kakao', kakaoId, existing.id).run()
        user = { ...existing, social_provider: 'kakao', social_id: kakaoId }
      }
    }
    if (!user) {
      const country  = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
      const emailVal = email?.toLowerCase() ?? `kakao_${kakaoId}@kakao.local`
      const r = await DB.prepare(
        'INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,?,20)'
      ).bind(emailVal, 'kakao', kakaoId, nickname ?? '카카오사용자', 'ko', country, email ? 1 : 0).run()
      const newId = r.meta.last_row_id as number
      await DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)')
        .bind(newId, 'gain', 20, 'signup_bonus', 20).run()
      user = await DB.prepare('SELECT * FROM users WHERE id=?').bind(newId).first<User>() as User
    }
  }

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessToken  = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshToken = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 })

  const loginData = JSON.stringify({
    type: 'kakao_login',
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits },
  })

  return new Response(
    `<!DOCTYPE html><html><body><script>window.opener?.postMessage(${loginData},window.location.origin);window.close();</script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
})

// 네이버 로그인 — OAuth 2.0 Authorization URL 반환
app.get('/api/auth/naver/url', (c) => {
  const clientId = c.env.NAVER_CLIENT_ID
  if (!clientId) return c.json({ success: false, error: '네이버 로그인 미설정' }, 500)
  const serviceUrl = (c.env as unknown as Record<string,string>).SERVICE_URL || ''
  const redirectUri = `${serviceUrl}/api/auth/naver/callback`
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('')
  const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  return c.json({ success: true, url, state })
})

// 네이버 로그인 — OAuth 콜백 (code → token → user → JWT → postMessage)
app.get('/api/auth/naver/callback', async (c) => {
  const { DB, KV } = c.env
  const code      = c.req.query('code')
  const clientId  = c.env.NAVER_CLIENT_ID
  const clientSecret = c.env.NAVER_CLIENT_SECRET

  const errPage = (msg: string) => new Response(
    `<!DOCTYPE html><html><body><script>window.opener?.postMessage({type:'naver_error',error:${JSON.stringify(msg)}},window.location.origin);window.close();</script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )

  if (!code || !clientId || !clientSecret) return errPage('설정 오류')

  // code → access_token
  const serviceUrl = (c.env as unknown as Record<string,string>).SERVICE_URL || ''
  const redirectUri = `${serviceUrl}/api/auth/naver/callback`
  const tokenRes = await fetch(
    `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${c.req.query('state') || ''}`,
    { method: 'GET', headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret } }
  ).catch(() => null)
  if (!tokenRes?.ok) return errPage('토큰 발급 실패')

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) return errPage('액세스 토큰 없음')

  // access_token → user info
  const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  }).catch(() => null)
  if (!userRes?.ok) return errPage('사용자 정보 조회 실패')

  const userData = await userRes.json() as {
    resultcode: string
    response?: { id: string; email?: string; name?: string; nickname?: string }
  }
  if (userData.resultcode !== '00' || !userData.response) return errPage('사용자 정보 오류')

  const naverId  = userData.response.id
  const email    = userData.response.email
  const nickname = userData.response.name || userData.response.nickname

  let user = await DB.prepare('SELECT * FROM users WHERE social_provider=? AND social_id=?')
    .bind('naver', naverId).first<User>()

  if (!user) {
    if (email) {
      const existing = await DB.prepare('SELECT * FROM users WHERE email=?')
        .bind(email.toLowerCase()).first<User>()
      if (existing) {
        await DB.prepare('UPDATE users SET social_provider=?,social_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind('naver', naverId, existing.id).run()
        user = { ...existing, social_provider: 'naver', social_id: naverId }
      }
    }
    if (!user) {
      const country  = (c.req.header('cf-ipcountry') ?? 'KR').toUpperCase()
      const emailVal = email?.toLowerCase() ?? `naver_${naverId}@naver.local`
      const r = await DB.prepare(
        'INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,?,20)'
      ).bind(emailVal, 'naver', naverId, nickname ?? '네이버사용자', 'ko', country, email ? 1 : 0).run()
      const newId = r.meta.last_row_id as number
      await DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)')
        .bind(newId, 'gain', 20, 'signup_bonus', 20).run()
      user = await DB.prepare('SELECT * FROM users WHERE id=?').bind(newId).first<User>() as User
    }
  }

  const secret       = await getJwtSecret(KV)
  const now          = Math.floor(Date.now() / 1000)
  const accessToken  = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret)
  const refreshToken = await signJwt({ sub: user.id, type: 'refresh', iat: now, exp: now + 30 * 86400 }, secret)
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 })

  const loginData = JSON.stringify({
    type: 'naver_login',
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits },
  })

  return new Response(
    `<!DOCTYPE html><html><body><script>window.opener?.postMessage(${loginData},window.location.origin);window.close();</script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
})

// 비밀번호 찾기 — 재설정 메일 요청
app.post('/api/auth/forgot-password', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `forgot-pw:${ip}`, 3, 3600) // 시간당 3회
  if (!rl.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)

  const { email } = await c.req.json()
  if (!email) return c.json({ success: false, error: '이메일을 입력해주세요.' }, 400)

  const user = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first<{ id: number }>()
  // 보안: 존재 여부 노출하지 않음
  if (!user) return c.json({ success: true, message: '이메일이 존재하면 재설정 링크를 발송합니다.' })

  const resetToken = randomToken()
  const expiresAt  = new Date(Date.now() + 3600 * 1000).toISOString() // 1시간
  await DB.prepare('INSERT INTO auth_tokens (user_id,token,type,expires_at) VALUES (?,?,?,?)')
    .bind(user.id, resetToken, 'pw_reset', expiresAt).run()

  // 비밀번호 재설정 메일 발송
  const userForEmail = await DB.prepare('SELECT nickname FROM users WHERE id=?').bind(user.id).first<{ nickname: string | null }>()
  await sendPasswordResetEmail(c.env, email.toLowerCase(), userForEmail?.nickname || '', resetToken)
    .catch(e => console.error('[ForgotPw] 메일 발송 실패:', e))

  return c.json({
    success: true,
    message: '비밀번호 재설정 링크를 발송했습니다.',
    ...(!c.env.RESEND_API_KEY ? { _dev: { resetToken } } : {}),
  })
})

// 비밀번호 재설정
app.post('/api/auth/reset-password', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `reset-pw:${ip}`, 5, 3600) // 시간당 5회
  if (!rl.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)

  const { token, newPassword } = await c.req.json()
  if (!token || !newPassword) return c.json({ success: false, error: '토큰과 새 비밀번호가 필요합니다.' }, 400)
  if (newPassword.length < 8) return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400)

  const row = await DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token = ? AND type = 'pw_reset'
  `).bind(token).first<{ id: number; user_id: number; expires_at: string; used_at: string | null }>()

  if (!row || row.used_at || new Date(row.expires_at) < new Date())
    return c.json({ success: false, error: '유효하지 않거나 만료된 링크입니다.' }, 400)

  const newHash = await hashPassword(newPassword)
  await DB.batch([
    DB.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(newHash, row.user_id),
    DB.prepare('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.id),
  ])
  return c.json({ success: true, message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' })
})

// POST /api/auth/change-password — 로그인 상태에서 비밀번호 변경
app.post('/api/auth/change-password', async (c) => {
  const { DB, KV } = c.env
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `change-pw:${ip}`, 5, 3600)
  if (!rl.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)

  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { currentPassword, newPassword } = await c.req.json().catch(() => ({})) as { currentPassword?: string; newPassword?: string }
  if (!currentPassword || !newPassword)
    return c.json({ success: false, error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }, 400)
  if (newPassword.length < 8)
    return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400)

  const user = await DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(userId).first<{ password_hash: string | null }>()
  if (!user?.password_hash)
    return c.json({ success: false, error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' }, 400)

  const valid = await verifyPassword(currentPassword, user.password_hash)
  if (!valid)
    return c.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' }, 401)

  const newHash = await hashPassword(newPassword)
  await DB.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(newHash, userId).run()

  return c.json({ success: true, message: '비밀번호가 변경되었습니다.' })
})

// ============================================================
// 내 계정 API
// ============================================================
app.get('/api/user/me', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const user = await DB.prepare(
    'SELECT id,email,nickname,locale,country_code,credits,is_email_verified,social_provider,created_at FROM users WHERE id=?'
  ).bind(userId).first()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)
  return c.json({ success: true, data: user })
})

app.get('/api/user/credits', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const user = await DB.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()

  // 트랜잭션 + 충전 금액 JOIN (영수증용)
  const txns = await DB.prepare(`
    SELECT ct.type, ct.amount, ct.reason, ct.balance_after, ct.created_at, ct.ref_id,
           cc.amount AS pg_amount, cc.currency AS pg_currency, cc.status AS pg_status, cc.completed_at AS pg_completed_at
    FROM credit_transactions ct
    LEFT JOIN credit_charges cc ON ct.ref_id = cc.pg_tid AND ct.reason = 'charge'
    WHERE ct.user_id = ?
    ORDER BY ct.created_at DESC
    LIMIT 50
  `).bind(userId).all()

  return c.json({ success: true, data: { balance: user?.credits ?? 0, transactions: txns.results } })
})

// ── 고객 셀프 환불 ────────────────────────────────────────
// 미사용 크레딧(현재 잔액 ≥ 구매 크레딧) · 구매 7일 이내에만. 토스 결제 취소(실환불) + 크레딧 회수.
// 안전: status 원자적 선점(completed→refunded)으로 이중환불 방지, 각 단계 실패 시 롤백.
app.post('/api/credits/refund', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  let body: { pgTid?: string }
  try { body = await c.req.json() } catch { return c.json({ success: false, error: '잘못된 요청' }, 400) }
  const pgTid = (body.pgTid || '').trim()
  if (!pgTid) return c.json({ success: false, error: '환불할 결제를 찾을 수 없어요.' }, 400)

  const charge = await DB.prepare(
    "SELECT id, credits, amount, status, package_key, completed_at FROM credit_charges WHERE pg_tid=? AND user_id=? AND pg='toss'"
  ).bind(pgTid, userId).first<{ id: number; credits: number; amount: number; status: string; package_key: string; completed_at: string | null }>()
  if (!charge) return c.json({ success: false, error: '결제 내역을 찾을 수 없어요.' }, 404)
  if (charge.status === 'refunded') return c.json({ success: false, error: '이미 환불된 결제예요.' }, 400)
  if (charge.status !== 'completed') return c.json({ success: false, error: '환불할 수 없는 결제 상태예요.' }, 400)
  // 외부 서비스 상품 중 수달·곁 등은 셀프 환불 대상 아님(고객센터). phyweb는 아래에서 코드 등록여부로 분기 처리.
  const refPkg = PACKAGES[charge.package_key]
  if (refPkg?.service && refPkg.service !== 'phyweb') return c.json({ success: false, error: '이 상품은 고객센터(support@maumful.com)로 환불을 요청해 주세요.' }, 400)

  // 7일 이내 (completed_at은 UTC 'YYYY-MM-DD HH:MM:SS')
  const doneMs = charge.completed_at ? Date.parse(charge.completed_at.replace(' ', 'T') + 'Z') : NaN
  if (isNaN(doneMs) || (Date.now() - doneMs) > 7 * 86400 * 1000) {
    return c.json({ success: false, error: '구매 후 7일이 지나 환불할 수 없어요.' }, 400)
  }

  // ── phyweb 이용권 상품: 코드 미등록이면 셀프환불(카드취소 + phyweb 코드 void), 등록됐으면 약관§8로 거부 ──
  if (refPkg?.service === 'phyweb') {
    const secret = c.env.MAUM_SSO_SECRET
    const tossKey = c.env.TOSS_SECRET_KEY
    if (!secret || !tossKey) return c.json({ success: false, error: '환불 설정 오류 — 고객센터(support@maumful.com)로 문의해 주세요.' }, 500)
    const orderId = `mf_charge_${charge.id}`
    const signTok = () => signSso(secret, { service: 'phyweb', grantType: refPkg.grantType, orderId, exp: Math.floor(Date.now() / 1000) + 300 })
    // 1) 등록 여부 확인 — 등록됐으면 거부(청약철회 제한). ⚠️ 확인 불가 시 환불 보류(과다환불 방지, fail-safe)
    let st: any = null
    try { st = await fetch('https://phyweb.pages.dev/api/grant/status?token=' + encodeURIComponent(await signTok())).then(r => r.json()).catch(() => null) } catch { st = null }
    if (!st || st.ok !== true) return c.json({ success: false, error: '일시적으로 환불 가능 여부를 확인할 수 없어요. 잠시 후 다시 시도하거나 고객센터(support@maumful.com)로 문의해 주세요.' }, 503)
    if (st.redeemed) return c.json({ success: false, error: 'phyweb에 이용권 코드를 이미 등록하셔서 환불할 수 없어요(등록 후 청약철회 제한).' }, 400)
    // 2) 원자적 선점
    const claim = await DB.prepare("UPDATE credit_charges SET status='refunded' WHERE id=? AND status='completed'").bind(charge.id).run()
    if (claim.meta.changes === 0) return c.json({ success: false, error: '이미 처리 중이거나 환불된 결제예요.' }, 409)
    const rollback = async () => { await DB.prepare("UPDATE credit_charges SET status='completed' WHERE id=? AND status='refunded'").bind(charge.id).run() }
    // 3) 토스 카드취소(돈 먼저 — 실패 시 깔끔히 롤백, phyweb 미변경)
    try {
      const cancelRes = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(tossKey + ':'), 'Idempotency-Key': 'refund_' + pgTid },
        body: JSON.stringify({ cancelReason: '고객 요청(phyweb 이용권 미등록 환불)' }),
      })
      if (!cancelRes.ok) {
        let msg = '결제 취소에 실패했어요. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.'
        try { const e = await cancelRes.json() as { message?: unknown }; if (typeof e?.message === 'string' && e.message.trim()) msg = e.message } catch {}
        await rollback(); return c.json({ success: false, error: msg }, 400)
      }
    } catch (e) {
      let cancelled = false
      try { const inq = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}`, { headers: { 'Authorization': 'Basic ' + btoa(tossKey + ':') } }); if (inq.ok) { const p = await inq.json() as { status?: string }; if (p?.status === 'CANCELED' || p?.status === 'PARTIAL_CANCELED') cancelled = true } } catch {}
      if (!cancelled) { await rollback(); console.error('[Refund phyweb] 토스 취소 오류(미취소) 롤백:', e, pgTid); return c.json({ success: false, error: '결제 취소 확인에 실패했어요. 고객센터로 문의해 주세요.' }, 400) }
    }
    // 4) 돈 환불됨 → phyweb 코드 void(best-effort). 등록 race(409)면 로그만 남김(관리자 조정).
    try {
      const rv = await fetch('https://phyweb.pages.dev/api/grant/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: await signTok() }) })
      if (!rv.ok) console.error('[Refund phyweb] revoke 비정상(등록 race 가능) order:', orderId, 'http:', rv.status)
    } catch (e) { console.error('[Refund phyweb] revoke 오류:', e, orderId) }
    return c.json({ success: true, refunded: true, service: 'phyweb', message: 'phyweb 이용권 결제가 환불되었습니다.' })
  }

  // 미사용(관대 정책): 현재 잔액 ≥ 구매 크레딧
  const u = await DB.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  if (!u || u.credits < charge.credits) {
    return c.json({ success: false, error: `크레딧을 사용하셔서 환불할 수 없어요. 미사용(잔액 ${charge.credits} 이상)일 때만 환불돼요.` }, 400)
  }

  // 원자적 선점: completed → refunded (이중환불 방지). status CHECK 제약상 중간상태 없이 직접 전이.
  const claim = await DB.prepare("UPDATE credit_charges SET status='refunded' WHERE id=? AND status='completed'").bind(charge.id).run()
  if (claim.meta.changes === 0) return c.json({ success: false, error: '이미 처리 중이거나 환불된 결제예요.' }, 409)

  // 크레딧 회수(잔액 가드). 실패 시 선점 롤백.
  const claw = await DB.prepare('UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?').bind(charge.credits, userId, charge.credits).run()
  if (claw.meta.changes === 0) {
    await DB.prepare("UPDATE credit_charges SET status='completed' WHERE id=? AND status='refunded'").bind(charge.id).run()
    return c.json({ success: false, error: '환불 직전 크레딧이 사용되어 환불할 수 없어요.' }, 400)
  }

  // 토스 결제 취소(실제 카드 환불). 실패 시 크레딧·상태 모두 롤백(돈 안 나갔으니 원복).
  const tossKey = c.env.TOSS_SECRET_KEY
  const rollback = async () => {
    await DB.prepare('UPDATE users SET credits = credits + ? WHERE id=?').bind(charge.credits, userId).run()
    await DB.prepare("UPDATE credit_charges SET status='completed' WHERE id=? AND status='refunded'").bind(charge.id).run()
  }
  if (!tossKey) { await rollback(); return c.json({ success: false, error: '서버 설정 오류' }, 500) }
  try {
    const cancelRes = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(tossKey + ':'), 'Idempotency-Key': 'refund_' + pgTid },
      body: JSON.stringify({ cancelReason: '고객 요청(미사용 크레딧 환불)' }),
    })
    if (!cancelRes.ok) {
      let msg = '결제 취소에 실패했어요. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.'
      try { const e = await cancelRes.json() as { message?: unknown }; if (typeof e?.message === 'string' && e.message.trim()) msg = e.message } catch {}
      await rollback()
      console.error('[Refund] 토스 취소 실패:', cancelRes.status, msg, 'pg_tid:', pgTid)
      return c.json({ success: false, error: msg }, 400)
    }
  } catch (e) {
    // ⚠️ 취소요청은 던졌는데 응답이 유실됐을 수 있다 → 실제로 취소됐는지 재조회 후 판단.
    //    이미 취소됐는데 롤백하면 "돈은 환불됐는데 크레딧 복구"(이중혜택)가 된다.
    let actuallyCancelled = false
    try {
      const inq = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}`, {
        headers: { 'Authorization': 'Basic ' + btoa(tossKey + ':') },
      })
      if (inq.ok) { const p = await inq.json() as { status?: string }; if (p?.status === 'CANCELED' || p?.status === 'PARTIAL_CANCELED') actuallyCancelled = true }
    } catch { /* 재조회도 실패 → 미취소로 간주해 롤백(다음 재시도는 Idempotency-Key로 중복취소 안 됨) */ }
    if (!actuallyCancelled) {
      await rollback()
      console.error('[Refund] 토스 취소 오류(미취소 확인) — 롤백:', e, 'pg_tid:', pgTid)
      return c.json({ success: false, error: '환불 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' }, 502)
    }
    console.error('[Refund] 취소요청 응답 유실이나 실제 취소 확인 — 환불 유효 처리. pg_tid:', pgTid)
    // 취소 확정 → 롤백하지 않고 아래 성공 처리로 진행
  }

  // 성공(돈 이미 환불됨) — 원장 기록 + 파트너 되돌림. 여기서 실패해도 환불은 유효하므로 성공 처리한다.
  // ⚠️ type은 CHECK(type IN ('gain','spend'))라 'loss'가 아니라 'spend'를 써야 한다(안 그러면 INSERT가 500).
  try {
    await DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,(SELECT credits FROM users WHERE id=?),?)')
      .bind(userId, 'spend', charge.credits, 'refund', userId, pgTid).run()
    reversePartnerCommission(DB, charge.id).catch(() => {})
  } catch (e) { console.error('[Refund] 원장 기록 실패(환불은 완료됨):', e, 'pg_tid:', pgTid) }

  return c.json({ success: true, message: `${charge.credits} 크레딧 환불 완료 · ${Number(charge.amount).toLocaleString()}원이 카드로 환불돼요(카드사에 따라 수일 소요).` })
})

app.patch('/api/user/me', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { nickname, locale } = await c.req.json()
  const sets: string[] = []; const vals: unknown[] = []
  if (nickname) { sets.push('nickname=?'); vals.push(nickname) }
  if (locale && ['ko','en'].includes(locale)) { sets.push('locale=?'); vals.push(locale) }
  if (!sets.length) return c.json({ success: false, error: '변경 항목 없음' }, 400)
  sets.push('updated_at=CURRENT_TIMESTAMP'); vals.push(userId)
  await DB.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ success: true })
})

app.delete('/api/user/me', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  // 개인 식별 정보 익명화 (GDPR)
  await DB.prepare(`
    UPDATE users SET
      email='deleted_'||id||'@deleted.local',
      password_hash=NULL, social_provider=NULL, social_id=NULL,
      nickname='탈퇴 회원', email_verify_token=NULL,
      -- ⚠️ 인증 플래그를 내린다. 안 내리면 탈퇴 회원이 계속 메일 발송 대상으로 남는다.
      --    (마음게임 주간 리포트 cron 대상 조건이 is_email_verified=1 → 매주 deleted_*@deleted.local로 발송 시도)
      is_email_verified=0,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(userId).run()
  await KV.delete(`refresh:${userId}`)
  return c.json({ success: true, message: '탈퇴 완료' })
})

// ============================================================
// 심리검사 API
// ============================================================
// 무료 검사 목록 (PHQ-9, GAD-7, Big5) — 크레딧 차감 없음
const FREE_TESTS_SERVER = ['PHQ9', 'GAD7']

app.post('/api/test/start', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { testType, lang = 'ko' } = await c.req.json()
  if (!testType) return c.json({ success: false, error: 'testType 필요' }, 400)

  // 마스터 계정 또는 무료 검사: 크레딧 차감 없이 바로 처리
  const userRow = await DB.prepare('SELECT email, credits FROM users WHERE id=?').bind(userId).first<{ email: string; credits: number }>()
  if (FREE_TESTS_SERVER.includes(testType) || isMasterAccount(userRow?.email)) {
    // await 필수 — 미대기 시 직후 save-score/save-result가 행을 못 찾아 점수·결과가 유실될 수 있음(리포트 의존)
    await DB.prepare('INSERT INTO test_history (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)')
      .bind(userId, testType, lang, 0).run().catch(() => {})
    return c.json({ success: true, data: { testType, creditsSpent: 0, balance: userRow?.credits ?? 0, isFree: true } })
  }

  // 유료 검사: 크레딧 10 차감
  const COST = 10
  const result = await spendCredits(DB, userId, COST, 'test')
  if (!result.ok) {
    return c.json({
      success: false,
      error: result.error === 'insufficient_credits'
        ? `크레딧 부족 (보유: ${result.balance}, 필요: ${COST})`
        : '오류 발생',
      balance: result.balance,
      needsCharge: true,
    }, 402)
  }
  // await 필수 — 위와 동일(행 미커밋 시 점수·결과 유실)
  await DB.prepare('INSERT INTO test_history (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)')
    .bind(userId, testType, lang, COST).run().catch(() => {})

  return c.json({ success: true, data: { testType, creditsSpent: COST, balance: result.balance, isFree: false } })
})

app.get('/api/test/history', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  // id·리포트 보유 플래그 추가(리포트 화면 진입용). 기존 소비자는 추가 필드를 무시하므로 무영향.
  const h = await DB.prepare(
    `SELECT id, test_type, lang, credits_spent, performed_at, score, level,
            CASE WHEN result_json IS NOT NULL THEN 1 ELSE 0 END AS has_result,
            CASE WHEN ai_analysis IS NOT NULL THEN 1 ELSE 0 END AS has_analysis
     FROM test_history WHERE user_id=? ORDER BY performed_at DESC LIMIT 50`
  ).bind(userId).all()
  return c.json({ success: true, data: h.results })
})

// ── POST /api/test/save-score ─────────────────────────────
// 검사 완료 후 점수/등급 저장 (가장 최근 행 업데이트)
app.post('/api/test/save-score', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { test_type, score, level } = await c.req.json().catch(() => ({})) as {
    test_type?: string; score?: number; level?: string
  }
  if (!test_type || score === undefined) return c.json({ success: false, error: '파라미터 부족' }, 400)

  await DB.prepare(
    `UPDATE test_history SET score=?, level=?
     WHERE id=(SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1)`
  ).bind(score, level ?? null, userId, test_type).run()

  return c.json({ success: true })
})

// ── POST /api/test/save-analysis ──────────────────────────
// 생성된 AI 해석을 최근 검사행에 저장 → 리포트에서 재열람(재생성 비용 0·내용 동일)
app.post('/api/test/save-analysis', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { test_type, ai_analysis } = await c.req.json().catch(() => ({})) as { test_type?: string; ai_analysis?: string }
  if (!test_type || !ai_analysis) return c.json({ success: false, error: '파라미터 부족' }, 400)

  await DB.prepare(
    `UPDATE test_history SET ai_analysis=?
     WHERE id=(SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1)`
  ).bind(String(ai_analysis).slice(0, 8000), userId, test_type).run()

  return c.json({ success: true })
})

// ── POST /api/loop-event ──────────────────────────────────
// 검사↔게임 루프 계측. 집계 전용(개인정보 미저장), 실패해도 화면에 영향 없음.
const LOOP_EVENTS = ['report_view', 'rx_click', 'suggestion_view', 'suggestion_click']
app.post('/api/loop-event', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: true })   // 비로그인은 조용히 무시

  let body: { event?: string; meta?: string }
  try { body = await c.req.json() } catch { return c.json({ success: true }) }
  if (!body.event || !LOOP_EVENTS.includes(body.event)) return c.json({ success: true })

  try {
    await DB.prepare('INSERT INTO loop_events (user_id, event, meta) VALUES (?,?,?)')
      .bind(userId, body.event, (body.meta ?? '').slice(0, 40) || null).run()
  } catch (e) {
    console.error('[loop-event] insert failed:', e)   // 계측 실패가 기능을 막지 않는다
  }
  return c.json({ success: true })
})

// ── GET /api/test/report?id= ──────────────────────────────
// 내 검사 리포트(본인 소유 행만). 점수·수준·상세결과·AI해석 + 직전 회차(변화 흐름)
app.get('/api/test/report', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const id = Number(c.req.query('id'))
  if (!id) return c.json({ success: false, error: 'id가 필요합니다.' }, 400)

  const row = await DB.prepare(
    'SELECT id, test_type, lang, score, level, result_json, ai_analysis, performed_at FROM test_history WHERE id=? AND user_id=?'
  ).bind(id, userId).first<{ id: number; test_type: string; lang: string; score: number | null; level: string | null; result_json: string | null; ai_analysis: string | null; performed_at: string }>()
  if (!row) return c.json({ success: false, error: '리포트를 찾을 수 없어요.' }, 404)

  const prev = await DB.prepare(
    'SELECT score, performed_at FROM test_history WHERE user_id=? AND test_type=? AND performed_at < ? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 1'
  ).bind(userId, row.test_type, row.performed_at).first<{ score: number; performed_at: string }>()

  let result: unknown = null
  try { result = row.result_json ? JSON.parse(row.result_json) : null } catch { /* 파싱 실패는 null */ }

  // ② 마음게임 실천 기록(같은 DB) — 리포트 "게임으로 본 나의 변화" 섹션. 없으면 null.
  const game = await buildGameSummary(DB, userId)

  return c.json({
    success: true,
    data: {
      id: row.id, test_type: row.test_type, lang: row.lang,
      score: row.score, level: row.level, result,
      ai_analysis: row.ai_analysis, performed_at: row.performed_at,
      prev: prev ? { score: prev.score, performed_at: prev.performed_at } : null,
      game: game ? { totalSessions: game.totalSessions, streakDays: game.streakDays, level: game.level, byGame: game.byGame, mood: game.mood } : null,
    },
  })
})

// ============================================================
// AI 분석 프롬프트 빌더 — B2C 친화적 양식 (심리상담 / 기독교 상담)
// ============================================================
type AnalyzeRequest = { testType: string; counselingType: string; responses: Record<string, unknown>; category?: string; lang?: string }

// ⑥ AI 해석 시스템 프롬프트(페르소나+출력형식) — 안정적 프리픽스로 분리해 system 파라미터 + prompt caching 대상으로.
//   (프롬프트가 커지면 캐시 자동 적용. 현재 길이<최소캐시토큰이면 무해한 미적용.)
function buildAnalysisSystem(req: AnalyzeRequest): string {
  const lang       = req.lang ?? 'ko'
  const isBiblical = req.counselingType === 'biblical'

  const sysKo = isBiblical
    ? '당신은 마음풀의 기독교 상담 안내자입니다. 검사를 받은 본인에게 직접 이야기하듯, 성경 말씀과 따뜻한 신앙적 공감으로 마음을 비춰 드립니다. "당신"을 주어로 존댓말로 쓰고(제3자·상담사 시점 금지), 진단적 표현은 절대 사용하지 마세요.'
    : '당신은 마음풀의 심리 안내자입니다. 검사를 받은 본인에게 직접 이야기하듯, 판단 없이 따뜻하게 결과를 비춰 드립니다. "당신"을 주어로 존댓말로 쓰고(제3자·상담사 시점 금지), 임상적·진단적 표현은 절대 사용하지 마세요.'
  const sysEn = 'You are a compassionate psychological guide for Maumful. Speak directly TO the person who took the test ("you"), warmly and without judgment. Never use clinical diagnostic language or third-person/counselor framing.'
  const ctx = lang === 'ko' ? sysKo : sysEn

  const psychFormat = `
아래 5개 섹션을 순서대로, 검사를 받은 당신에게 직접 이야기하듯 작성해 주세요. 임상 진단명·병명은 절대 사용하지 마세요.

[지금의 마음]
판단 없이 당신의 지금 상태를 1~2문장. "~하신 것 같아요", "~한 마음이 느껴져요" 처럼 부드럽게.

[눈에 띄는 부분]
주목할 응답 2~3가지를 짚어 드리되, 어떤 문항(또는 어떤 응답)이 그렇게 보이게 했는지 근거를 함께 밝혀 주세요. (예: "수면 문항과 흥미 문항에 높게 답하신 점이…") 마지막에 "이 부분은 스스로 조금 더 들여다보면 좋아요" 같은 한 문장.

[스스로에게 건네보세요]
- 자문 질문: 스스로에게 던져볼 만한 열린 질문 2개
- 살펴볼 부분: 놓치기 쉬운 내 마음의 신호 1~2가지

[오늘의 작은 실천]
부담 없이 해볼 수 있는 작은 것 1~2가지. 치료나 약물 언급 금지.

[이어서 물어보기]
이 결과에 대해 AI 상담에서 더 나눠볼 만한 질문 2~3개를, 당신이 상담사에게 직접 건네듯 한 문장씩. 각 줄은 반드시 "- "(하이픈+공백)으로 시작하고, 다른 설명 없이 질문만.`

  const biblicalFormat = `
아래 5개 섹션을 순서대로, 당신에게 직접 건네는 따뜻하고 신앙적인 언어로 작성해 주세요.

[마음 살피기]
당신의 마음 상태를 공감적으로 1~2문장. 판단 없이 감정을 비춰 드리기.

[말씀 묵상]
- 연결 말씀: 정확히 아는 구절만 전문으로 (책명 장:절 형식). 구절 내용이나 장·절이 조금이라도 확실하지 않으면 이 줄을 통째로 생략하고, 말씀의 위로를 당신의 말로 전하세요. 성경 구절·숫자·사건을 지어내지 마세요.
- 말씀 의미: 이 말씀이 지금 당신에게 주는 위로 2~3문장
- 삶으로: 이 말씀을 오늘 당신의 삶에 어떻게 품어볼지 한 문장

[스스로 묵상하기]
- 묵상 질문: 스스로에게 던져볼 신앙적 열린 질문 2가지
- 기도 제목: 스스로를 위해 올릴 기도 1~2가지

[소망의 한마디]
당신에게 건네는 격려와 성경적 소망 한 문장.

[이어서 물어보기]
이 결과에 대해 AI 상담에서 더 나눠볼 만한 질문 2~3개를, 당신이 상담자에게 직접 건네듯 한 문장씩. 각 줄은 반드시 "- "(하이픈+공백)으로 시작하고, 다른 설명 없이 질문만.`

  const psychFormatEn = `
Please write these 5 sections in order, speaking directly to you (the person who took the test). Never use clinical diagnoses or medical labels.

[How You Are Now]
1–2 gentle sentences about where you seem to be. Use "You may be feeling..." or "It seems you..."

[What Stands Out]
2–3 of your noteworthy responses, briefly — and say which items or answers led you to see it this way. End with: "These are worth gently exploring on your own."

[Ask Yourself]
- Reflective questions: 2 open questions to ask yourself
- Watch for: 1–2 easily-missed signals in how you feel

[Small Steps for Today]
1–2 small, manageable practices. No mention of treatment or medication.

[Ask Next]
2–3 questions worth bringing to AI counseling about this result, each phrased as if you were asking a counselor directly. Each line MUST start with "- " (hyphen + space), question only, no other text.`

  const fmt = lang === 'en' ? psychFormatEn : (isBiblical ? biblicalFormat : psychFormat)
  // ⚠️ 프론트가 마크다운 미렌더(pre-wrap)라 ##·**·--- 기호가 그대로 노출됨 → 마크다운 금지 지시
  const noMd = lang === 'en'
    ? '\n\nFormatting: plain text only. Do NOT use any markdown (#, ##, **, ---, >, `). Write section titles exactly in [Title] bracket form as above.'
    : '\n\n출력 형식(중요): 마크다운 기호(#, ##, **, ---, >, `)를 절대 쓰지 마세요. 섹션 제목은 위 [제목] 대괄호 형태 그대로, 본문은 일반 문장으로만 작성하세요.'
  return ctx + '\n' + fmt + noMd
}

function buildAnalysisPrompt(req: AnalyzeRequest): string {
  const lang = req.lang ?? 'ko'
  const r    = req.responses
  // ⑥ 페르소나·출력형식은 buildAnalysisSystem으로 이전. 이 함수는 검사 데이터(user 메시지)만 반환.
  //    아래 24개 브랜치는 무변경 — ctx/fmt를 빈 문자열로 두어 자연히 데이터만 남게 함.
  const ctx = ''
  const fmt = ''
  const NL = '\n'

  // PHQ-9
  if (req.testType === 'PHQ9') {
    const total = r.total as number
    const level = r.level as string
    const items = (r.items as Array<{question:string;score:number}>) ?? []
    if (lang === 'ko') {
      const formatted = items.map((item, idx) => (idx+1) + '. ' + item.question + ': ' + item.score + '점').join(NL)
      return ctx + NL + NL + 'PHQ-9 우울 자가점검 결과' + NL + '총점: ' + total + '/27 (' + level + ')' + NL + NL + '문항별 응답:' + NL + formatted + NL + fmt
    }
    const formatted = items.map((item, idx) => (idx+1) + '. ' + item.question + ': ' + item.score).join(NL)
    return ctx + NL + NL + 'PHQ-9 Depression Screening' + NL + 'Total: ' + total + '/27 (' + level + ')' + NL + NL + 'Responses:' + NL + formatted + NL + fmt
  }

  // GAD-7
  if (req.testType === 'GAD7') {
    const total = r.total as number
    const level = r.level as string
    const items = (r.items as Array<{question:string;score:number}>) ?? []
    if (lang === 'ko') {
      const formatted = items.map((item, idx) => (idx+1) + '. ' + item.question + ': ' + item.score + '점').join(NL)
      return ctx + NL + NL + 'GAD-7 불안 자가점검 결과' + NL + '총점: ' + total + '/21 (' + level + ')' + NL + NL + '문항별 응답:' + NL + formatted + NL + fmt
    }
    const formatted = items.map((item, idx) => (idx+1) + '. ' + item.question + ': ' + item.score).join(NL)
    return ctx + NL + NL + 'GAD-7 Anxiety Screening' + NL + 'Total: ' + total + '/21 (' + level + ')' + NL + NL + 'Responses:' + NL + formatted + NL + fmt
  }

  // DASS-21
  if (req.testType === 'DASS21') {
    const dep = r.depression as {score:number;level:string}
    const anx = r.anxiety   as {score:number;level:string}
    const str = r.stress    as {score:number;level:string}
    if (lang === 'ko') return ctx + NL + NL + 'DASS-21 결과' + NL + '우울: ' + (dep?.score) + '점 (' + (dep?.level) + ') · 불안: ' + (anx?.score) + '점 (' + (anx?.level) + ') · 스트레스: ' + (str?.score) + '점 (' + (str?.level) + ')' + NL + fmt
    return ctx + NL + NL + 'DASS-21 Results' + NL + 'Depression: ' + (dep?.score) + ' (' + (dep?.level) + ') · Anxiety: ' + (anx?.score) + ' (' + (anx?.level) + ') · Stress: ' + (str?.score) + ' (' + (str?.level) + ')' + NL + fmt
  }

  // BIG5
  if (req.testType === 'BIG5') {
    const factors = r.factors as Record<string,number>
    const formatted = Object.entries(factors ?? {}).map(([k,v]) => k + ': ' + v + '/5').join(NL)
    if (lang === 'ko') return ctx + NL + NL + 'Big5 성격검사 결과' + NL + formatted + NL + fmt
    return ctx + NL + NL + 'Big Five Personality Assessment' + NL + formatted + NL + fmt
  }

  // LOST
  if (req.testType === 'LOST') {
    const typeCode = r.typeCode as string
    const typeName = r.typeName as string
    const axisAvg  = r.axisAvg  as Record<string,number>
    const axisText = Object.entries(axisAvg ?? {}).map(([k,v]) => k + ': ' + Number(v).toFixed(2)).join(NL)
    if (lang === 'ko') return ctx + NL + NL + 'LOST 행동 운영체계 검사' + NL + '유형: ' + typeCode + ' (' + typeName + ')' + NL + NL + '축별 점수:' + NL + axisText + NL + fmt
    return ctx + NL + NL + 'LOST Behavioral Style Assessment' + NL + 'Type: ' + typeCode + ' (' + typeName + ')' + NL + NL + 'Axis Scores:' + NL + axisText + NL + fmt
  }

  // SRCI — 자기반응 완성 검사
  if (req.testType === 'SCT') {
    const sample     = (r.completionSample as Array<{scale:string;prompt:string;answer:string}>) ?? []
    const sampleText = sample.map(s => '[' + s.scale + '] ' + s.prompt + ' → ' + s.answer).join(NL)
    if (lang === 'ko') return ctx + NL + NL + 'SRCI 자기반응 완성 검사 결과 (문장완성형 25문항)' + NL + NL + '소척도별 응답 예시:' + NL + sampleText + NL + fmt
    return ctx + NL + NL + 'SRCI Self-Response Completion Inventory (25 sentence-completion items)' + NL + NL + 'Sample Responses by Subscale:' + NL + sampleText + NL + fmt
  }

  // SDRI — 자기분화 반응성 검사
  if (req.testType === 'DSI') {
    const scales    = (r.scales as Record<string,number>) ?? {}
    const total     = (r.total  as number) ?? 0
    if (lang === 'ko') {
      const scaleText = Object.entries(scales).map(([k,v]) => k + ': ' + v + '점').join(NL)
      return ctx + NL + NL + 'SDRI 자기분화 반응성 검사 결과' + NL + '총점: ' + total + '점' + NL + NL + '소척도별 점수:' + NL + scaleText + NL + fmt
    }
    const scaleText = Object.entries(scales).map(([k,v]) => k + ': ' + v).join(NL)
    return ctx + NL + NL + 'SDRI Self-Differentiation Reactivity Inventory' + NL + 'Total: ' + total + NL + NL + 'Subscale Scores:' + NL + scaleText + NL + fmt
  }

  // K-MBI+ 번아웃
  if (req.testType === 'BURNOUT') {
    const totalScore = r.totalScore as number
    const level      = r.level as string
    const domains    = r.domains as Array<{name:string;score:number;max:number;percentage:number;level:string}>
    const domainText = (domains ?? []).map(d => d.name + ': ' + d.score + '/' + d.max + ' (' + d.percentage + '%) - ' + d.level).join(NL)
    if (lang === 'ko') return ctx + NL + NL + 'K-MBI+ 소진 자가점검 결과' + NL + '전체 소진 지수: ' + totalScore + '/240 (' + level + ')' + NL + NL + '영역별 결과:' + NL + domainText + NL + fmt
    return ctx + NL + NL + 'K-MBI+ Burnout Self-Assessment' + NL + 'Overall Burnout Index: ' + totalScore + '/240 (' + level + ')' + NL + NL + 'Domain Results:' + NL + domainText + NL + fmt
  }

  // Holland RIASEC 직업 흥미
  if (req.testType === 'RIASEC') {
    const dominantType = r.dominant_type as string
    const scores       = r.scores as Record<string, number>
    if (lang === 'ko') {
      const typeNamesKo: Record<string, string> = { R:'실재형', I:'탐구형', A:'예술형', S:'사회형', E:'진취형', C:'관습형' }
      const scoresText = Object.entries(scores).sort(([,a],[,b]) => b - a).map(([t,s]) => typeNamesKo[t] + '(' + t + '): ' + s + '/25').join(', ')
      return ctx + NL + NL + 'Holland RIASEC 직업 흥미 검사 결과' + NL + '우세 유형: ' + dominantType + '형 (' + dominantType.split('').map(t => typeNamesKo[t]).join('·') + ')' + NL + '유형별 점수: ' + scoresText + NL + fmt
    }
    const typeNamesEn: Record<string, string> = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' }
    const scoresText = Object.entries(scores).sort(([,a],[,b]) => b - a).map(([t,s]) => typeNamesEn[t] + '(' + t + '): ' + s + '/25').join(', ')
    return ctx + NL + NL + 'Holland RIASEC Career Interest Assessment' + NL + 'Dominant Type: ' + dominantType + ' (' + dominantType.split('').map((t: string) => typeNamesEn[t]).join('·') + ')' + NL + 'Scores: ' + scoresText + NL + fmt
  }

  // 직업가치관
  if (req.testType === 'VALUES') {
    const scores  = r.scores as Record<string, number>
    const sorted  = Object.entries(scores).sort(([,a],[,b]) => b - a)
    if (lang === 'ko') {
      const top3    = sorted.slice(0, 3).map(([k,s]) => k + ': ' + s + '점').join(', ')
      const allText = sorted.map(([k,s]) => k + ': ' + s + '점').join(NL)
      return ctx + NL + NL + '직업가치관 검사 결과' + NL + '상위 3개 가치: ' + top3 + NL + NL + '전체 가치요인:' + NL + allText + NL + fmt
    }
    const valuesNamesEn: Record<string, string> = {
      achievement: 'Achievement', service: 'Service & Contribution', stability: 'Job Security',
      autonomy: 'Autonomy', creativity: 'Creativity', influence: 'Influence & Leadership',
      knowledge: 'Knowledge & Learning', balance: 'Work-Life Balance', social: 'Social Recognition',
      economic: 'Economic Reward',
    }
    const top3    = sorted.slice(0, 3).map(([k,s]) => (valuesNamesEn[k] || k) + ': ' + s).join(', ')
    const allText = sorted.map(([k,s]) => (valuesNamesEn[k] || k) + ': ' + s).join(NL)
    return ctx + NL + NL + 'Work Values Assessment' + NL + 'Top 3 Values: ' + top3 + NL + NL + 'All Value Factors (20–100 scale):' + NL + allText + NL + fmt
  }

  if (lang === 'en') return ctx + NL + NL + 'Assessment: ' + req.testType + NL + 'Results: ' + JSON.stringify(r, null, 2) + NL + fmt
  return ctx + NL + NL + '검사: ' + req.testType + NL + '결과: ' + JSON.stringify(r, null, 2) + NL + fmt
}
// ============================================================
// 🛟 위기 하드 브레이크 (안전 가드는 프롬프트가 아니라 코드로 강제 — feedback_safety_guard_in_code)
//   검사 점수로 위기 신호를 결정론적으로 판정하고, 위기 시에만 해석 스트림 끝에
//   위기자원 블록을 "코드가" 덧붙인다(AI가 안내를 누락해도 반드시 노출). 신호 없으면 무동작=기존 동일.
// ============================================================
function isCrisisScore(
  testType: string,
  score: number | null,
  level: string | null,
  result: Record<string, unknown> | null,
  items?: Array<{ score: number }>,
): boolean {
  // 심각도 레벨 판정 — 실제 앱 레벨 문자열과 일치시킴(app.jsx: "전문 지원 필요"=Severe,
  //   "적극적 지원 필요"=Moderately/Extremely Severe). "지원 필요"(Moderate)·"관리 필요"는 제외.
  //   영어("Severe"/"Moderately Severe"/"Extremely Severe")도 /severe/i로 포함.
  const sev = (l: string | null) => !!l && /전문\s*지원\s*필요|적극적\s*지원\s*필요|severe/i.test(l)
  if (testType === 'PHQ9') {
    // 9번 문항(자살사고)에 조금이라도('며칠' 이상) 응답 → 임상 표준상 최우선 위기신호(단일 해석 경로)
    if (items && items.length >= 9 && Number(items[8]?.score) >= 1) return true
    if (score != null && score >= 20) return true      // 고도 우울(총점 기준)
    // ⚠️ 통합해석은 문항 배열이 없다(결과 서버 미저장 원칙). 대신 레벨로 총점≥15(적극적 지원 필요)까지 커버.
    if (sev(level)) return true
  }
  if (testType === 'GAD7') {
    if (score != null && score >= 15) return true      // 심각 불안
    if (sev(level)) return true
  }
  if (testType === 'DASS21') {
    const dep = result?.depression as { score?: number; level?: string } | undefined
    if (dep && Number(dep.score) >= 21) return true     // DASS-21 우울 심각
    if (dep && sev(dep.level ?? null)) return true
    if (sev(level)) return true
  }
  return false
}

// 단일 해석(/api/ai-analyze) 요청 본문에서 위기 판정 — responses에 문항 배열이 옴
function crisisFromAnalyze(body: AnalyzeRequest): boolean {
  const r = body.responses || {}
  if (body.testType === 'PHQ9') {
    const items = (r.items as Array<{ score: number }>) ?? []
    return isCrisisScore('PHQ9', (r.total as number) ?? null, (r.level as string) ?? null, null, items)
  }
  if (body.testType === 'GAD7') return isCrisisScore('GAD7', (r.total as number) ?? null, (r.level as string) ?? null, null)
  if (body.testType === 'DASS21') return isCrisisScore('DASS21', null, (r.level as string) ?? null, { depression: r.depression })
  return false
}

// 통합 해석(/api/ai-analyze/integrated) — 저장된 test_history 메타(점수·레벨)만 사용. 문항 배열 없음 → 총점 기준.
function crisisFromIntegrated(tests: IntegratedTest[]): boolean {
  return tests.some((t) => isCrisisScore(t.testType, t.score, t.level, t.result))
}

// 위기자원 블록(코드 생성) — 진단·처방 없이, 24시간 긴급자원으로 연결. 프론트 pre-wrap이라 마크다운 금지.
function buildCrisisBlock(lang: string): string {
  if (lang === 'en') {
    return '\n\n[Immediate Support]\n' +
      "If things feel overwhelming right now, please know you don't have to carry this alone. Support is available any time, day or night.\n" +
      '· 988 Suicide & Crisis Lifeline (call or text 988)\n' +
      'You matter, and reaching out is a sign of strength.'
  }
  return '\n\n[긴급 도움말]\n' +
    '지금 많이 힘드시다면, 그 마음을 혼자 감당하지 않으셔도 괜찮아요. 24시간 언제든 곁에서 이야기를 들어줄 곳이 있어요.\n' +
    '· 자살예방 상담전화 109 (24시간)\n' +
    '· 정신건강 위기상담 1577-0199\n' +
    '지금 이 순간의 당신이 소중합니다. 연락하는 것은 약함이 아니라 용기예요.'
}

// 업스트림 SSE를 그대로 흘려보내고, 스트림이 끝날 때 위기자원 블록을 합성 델타로 1개 덧붙인다.
//   프론트는 content_block_delta의 delta.text만 누적하므로, 해석 끝에 위기자원이 반드시 렌더된다.
function appendCrisisSse(upstreamBody: ReadableStream<Uint8Array>, crisisText: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return upstreamBody.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) { controller.enqueue(chunk) },   // 업스트림 청크는 무변경 통과
    flush(controller) {
      const payload = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: crisisText } })
      controller.enqueue(enc.encode('data: ' + payload + '\n\n'))
    },
  }))
}

app.post('/api/ai-analyze', async (c) => {
  const { DB, KV } = c.env

  // 인증 필수 — 미로그인 시 401
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  // Rate Limit (마스터 계정 면제)
  const analyzeUser = await DB.prepare('SELECT email FROM users WHERE id=?').bind(userId).first<{ email: string }>()
  if (!isMasterAccount(analyzeUser?.email)) {
    const rl = await checkRateLimit(KV, `analyze:${userId}`, 10, 60)
    if (!rl.allowed) return c.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429)
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  let body: AnalyzeRequest
  try { body = await c.req.json() } catch { return c.json({ error: '잘못된 요청' }, 400) }

  const prompt = buildAnalysisPrompt(body)
  const systemPrompt = buildAnalysisSystem(body)
  // ③ 단일 해석 sonnet 우선(품질↑, 통합해석과 일치). haiku는 모델 불가 시 폴백. temperature 0.3은 sonnet-4-6 허용.
  const ANALYZE_FALLBACKS = [
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ]
  let upstream!: Response
  let analyzedModel = ANALYZE_FALLBACKS[0]
  for (const model of [...new Set(ANALYZE_FALLBACKS)]) {
    upstream = await fetch(aiEndpoint(c.env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model, max_tokens: 1500, temperature: 0.3, stream: true,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    // 403은 다른 모델 재시도 안 함 — 403은 IP/키 레벨(엣지 차단 등)이라 모델을 바꿔도 동일하게 막힌다.
    //   무의미한 재시도로 차단 IP를 더 두드리지 않도록 즉시 중단. 404(모델 없음)만 폴백.
    if (upstream.ok || upstream.status !== 404) { analyzedModel = model; break }
    analyzedModel = model
  }
  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '')
    console.error('[ai-analyze] Anthropic error:', upstream.status, analyzedModel, errBody.slice(0, 300))
    return c.json({ error: `AI 서비스 오류 (${upstream.status}, 모델: ${analyzedModel})`, detail: errBody.slice(0, 500) }, 502)
  }
  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  // 🛟 위기 하드 브레이크 — 위기 신호가 있을 때만 위기자원을 코드로 덧붙인다(없으면 기존 스트림 그대로).
  const crisisText = crisisFromAnalyze(body) ? buildCrisisBlock(body.lang ?? 'ko') : ''
  const outBody = crisisText && upstream.body ? appendCrisisSse(upstream.body, crisisText) : upstream.body
  return new Response(outBody, { headers: sseHeaders })
})

// ============================================================
// ① 통합 심층 해석 — 여러 검사를 "한 사람"으로 종합 (기존 /api/ai-analyze와 완전 별개·추가)
//   근거구속(④)·system+prompt caching(⑥)·실행연계 추천(⑦)·우울/불안 안전분기 반영.
//   데이터는 이미 저장된 test_history 메타만 사용(검사 결과 서버 미저장 원칙 유지).
// ============================================================
type IntegratedTest = { testType: string; score: number | null; level: string | null; result: Record<string, unknown> | null; prevScore: number | null }

// ============================================================
// ② 마음게임 행동 데이터 (같은 maumful-db 공유) — 검사=스냅샷, 게임=종단 행동
//    통합해석 프롬프트 + 검사 리포트 양쪽에서 사용. 실패해도 null(무영향).
// ============================================================
const GAME_NAME: Record<string, string> = {
  mood: '감정 수채화', garden: '마음의 정원', efmt: '감정꽃 찾기', gratitude: '별빛 감사일기',
  tree: '내면의 나무', burnout: '번아웃 회복', focus: '마음 집중력', worry: '걱정상자',
}

type GameSummary = {
  totalSessions: number; streakDays: number; level: number
  byGame: { id: string; name: string; count: number }[]
  mood: { count: number; recentAvg: number | null; prevAvg: number | null; topEmotions: string[] } | null
  text: string
}

async function buildGameSummary(db: D1Database, userId: number): Promise<GameSummary | null> {
  try {
    const byGameRes = await db.prepare(
      `SELECT game_id, COUNT(*) AS cnt FROM game_session_logs
       WHERE user_id=? AND created_at > datetime('now','-30 days')
       GROUP BY game_id ORDER BY cnt DESC`
    ).bind(userId).all<{ game_id: string; cnt: number }>()
    const byGame = (byGameRes.results ?? []).map((r) => ({ id: r.game_id, name: GAME_NAME[r.game_id] || r.game_id, count: r.cnt }))
    const totalSessions = byGame.reduce((s, g) => s + g.count, 0)
    if (totalSessions === 0) return null

    const status = await db.prepare('SELECT garden_level, streak_days FROM user_game_status WHERE user_id=?')
      .bind(userId).first<{ garden_level: number; streak_days: number }>()

    // 감정 수채화 30일 기록 — 최근/이전 절반 강도 비교 + 자주 기록된 감정
    let mood: GameSummary['mood'] = null
    const moodRes = await db.prepare(
      `SELECT metadata FROM game_session_logs
       WHERE user_id=? AND game_id='mood' AND created_at > datetime('now','-30 days')
       ORDER BY created_at DESC LIMIT 30`
    ).bind(userId).all<{ metadata: string | null }>()
    const moods = (moodRes.results ?? [])
      .map((r) => { try { return r.metadata ? JSON.parse(r.metadata) as { emotion?: string; intensity?: number } : null } catch { return null } })
      .filter((m): m is { emotion?: string; intensity?: number } => !!m)
    if (moods.length > 0) {
      const ints = moods.map((m) => Number(m.intensity)).filter((n) => Number.isFinite(n))
      const half = Math.ceil(ints.length / 2)
      const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : null)
      // 감정 라벨 위생 처리 — 깨진 문자(U+FFFD)·과도한 길이는 제외. 손상된 값이 프롬프트/리포트에 새는 것 방지.
      const cleanEmotion = (e?: string) => {
        const s = (e ?? '').trim()
        if (!s || s.length > 20 || s.includes('�')) return null
        return s
      }
      const counts: Record<string, number> = {}
      for (const m of moods) {
        const e = cleanEmotion(m.emotion)
        if (e) counts[e] = (counts[e] || 0) + 1
      }
      mood = {
        count: moods.length,
        recentAvg: avg(ints.slice(0, half)),
        prevAvg: ints.length > 1 ? avg(ints.slice(half)) : null,
        topEmotions: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e),
      }
    }

    const lines = [
      `최근 30일 게임 활동: ${byGame.map((g) => `${g.name} ${g.count}회`).join(', ')} (총 ${totalSessions}회)`,
      `연속 실천 ${status?.streak_days ?? 0}일 · 정원 레벨 ${status?.garden_level ?? 1}`,
    ]
    if (mood) {
      lines.push(`감정 기록 ${mood.count}회 — 최근 평균 강도 ${mood.recentAvg}${mood.prevAvg != null ? ` (이전 ${mood.prevAvg})` : ''}${mood.topEmotions.length ? `, 자주 기록된 감정: ${mood.topEmotions.join('·')}` : ''}`)
    }

    return {
      totalSessions, streakDays: status?.streak_days ?? 0, level: status?.garden_level ?? 1,
      byGame, mood, text: lines.join('\n'),
    }
  } catch (e) {
    console.error('[buildGameSummary] error:', e)
    return null   // 게임 데이터 실패는 해석·리포트에 영향 없음
  }
}

function summarizeIntegratedResult(testType: string, r: Record<string, unknown> | null): string {
  if (!r) return ''
  try {
    // BIG5: save-result가 calcBig5() 반환값(=factors 객체 그 자체)을 저장 → 최상위 숫자 값이 곧 요인 점수
    if (testType === 'BIG5') {
      const fx = Object.entries(r).filter(([, v]) => typeof v === 'number')
      if (fx.length) return 'BIG5 ' + fx.map(([k, v]) => k + ' ' + v).join(', ')
    }
    if (testType === 'LOST' && r.typeCode) {
      const nm = (r.typeInfo as { name?: string } | undefined)?.name
      return '행동유형 ' + r.typeCode + (nm ? '(' + nm + ')' : '')
    }
    if (testType === 'DSI' && r.scales) return (r.total != null ? '총점 ' + r.total + ', ' : '') + Object.entries(r.scales as Record<string, number>).map(([k, v]) => k + ' ' + v).join(', ')
  } catch { /* 요약 실패 무시 */ }
  return ''
}

function buildIntegratedPrompt(tests: IntegratedTest[], lang: string, counselingType: string, moodSummary: string, gameText = ''): { system: string; user: string } {
  const isBiblical = counselingType === 'biblical'
  const NL = '\n'
  const moodLine = moodSummary ? (NL + (lang === 'en' ? 'Mood trend (AI counseling logs): ' : '기분 추이(AI 상담 기록): ') + moodSummary) : ''
  // ② 게임 행동 데이터 — 검사(스냅샷)와 달리 실제 실천 기록. 없으면 완전 생략(기존 동작 동일).
  const gameLine = gameText ? (NL + (lang === 'en' ? 'Healing-game behavior (last 30 days):' : '치유게임 실천 기록(최근 30일):') + NL + gameText) : ''
  const testLines = tests.map((t) => {
    let line = '- ' + t.testType + ': 점수 ' + (t.score ?? 'N/A') + (t.level ? ' (' + t.level + ')' : '')
    if (t.prevScore != null && t.score != null) {
      const d = t.score - t.prevScore
      line += ' [지난번 ' + t.prevScore + ' 대비 ' + (d > 0 ? '+' : '') + d + ']'
    }
    const sum = summarizeIntegratedResult(t.testType, t.result)
    if (sum) line += ' | ' + sum
    return line
  }).join(NL)

  const assets = '마음풀 자산: 치유게임(마음정원·감정날씨·감사일기·마음나무·번아웃회복·기분기록·집중·걱정상자), 후속검사(PHQ-9·GAD-7·DASS-21·BIG5·LOST·SDRI 자기분화·K-MBI 번아웃), CBT 8주 플랜(우울·불안·번아웃 이력 시), AI 상담(검사 결과 기반 대화)'

  if (lang === 'en') {
    const systemEn = 'You are a warm psychological guide for Maumful. Integrate MULTIPLE assessment results into ONE coherent picture of the person, finding connections across tests. Base every statement ONLY on the provided scores/levels; never infer missing data. Never use clinical diagnoses. If depression/anxiety scores are high or severe, gently include a line pointing to professional help. Write only these sections: [Integrated Profile] 2-3 sentences on the core cross-test pattern. [Connections] 2-3 ways the tests interact. [Strengths & Resources]. [Watch Areas]. [Change Over Time] (only if prior scores given). [Next Steps] specific items from — ' + assets + '. End with: "This is a reference for self-understanding and does not replace professional consultation."'
    const gameRuleEn = gameText ? ' If healing-game behavior data is given, weave it into [Change Over Time] as evidence of what the person actually practices, and make [Next Steps] build on the games they already play.' : ''
    return { system: systemEn + gameRuleEn + '\nFormatting: plain text only, no markdown (#, ##, **, ---, >). Section titles in [Title] bracket form.', user: 'Assessment results:' + NL + testLines + moodLine + gameLine }
  }

  const persona = isBiblical
    ? '당신은 마음풀의 기독교 상담 안내자입니다. 따뜻한 신앙적 언어로, 진단적 표현 없이 살핍니다.'
    : '당신은 마음풀의 심리 안내자입니다. 판단 없이 따뜻하게, 임상·진단적 표현 없이 안내합니다.'
  const systemKo = persona + NL +
    '여러 검사 결과를 "한 사람"으로 통합 해석하는 것이 당신의 핵심 역할입니다. 검사를 따로 보지 말고, 서로 어떻게 연결·상호작용하는지 찾아 하나의 그림으로 엮으세요.' + NL +
    '규칙: (1) 제공된 점수·수준에 근거해서만 해석하고 없는 정보는 추측하지 마세요. (2) 진단명·병명 금지. (3) 우울(PHQ-9)·불안(GAD-7)이 높거나 심각 수준이면, 부드럽게 전문 도움과 긴급자원(자살예방 상담 109 · 정신건강 위기상담 1577-0199, 24시간)을 안내하는 문장을 자연스럽게 포함하세요.' + NL + NL +
    '아래 섹션만 작성하세요:' + NL +
    '[통합 프로파일] 여러 검사를 관통하는 핵심 패턴 2~3문장. "~처럼 보입니다" 어법.' + NL +
    '[검사 간 연결] 검사들이 서로 어떻게 맞물리는지 2~3가지.' + NL +
    '[강점과 자원] 결과에서 읽히는 강점 1~2가지.' + NL +
    '[주의 깊게 볼 부분] 놓치기 쉬운 신호 1~2가지.' + NL +
    '[변화 흐름] 지난번 대비 점수 변화가 있으면 그 흐름을 1~2문장. (변화 데이터가 없으면 이 섹션 생략)' + NL +
    '[다음 단계 추천] 이 사람에게 맞는 것을 아래에서 구체적으로 2~3개. ' + assets + NL +
    '마지막 문장: "본 해석은 자기이해를 위한 참고 자료이며 전문가 상담을 대체하지 않습니다."' + NL +
    (gameText
      ? '치유게임 실천 기록이 주어지면: 검사는 "그 시점의 나", 게임은 "실제로 해온 행동"입니다. [변화 흐름]에서 점수 변화와 실천 기록(빈도·연속일·감정 강도 추이)을 함께 엮고, [다음 단계 추천]은 이미 하고 있는 게임을 이어가는 방향으로 구체화하세요. 실천이 적으면 질책 대신 작게 시작할 방법을 제안하세요.' + NL
      : '') +
    '출력 형식(중요): 마크다운 기호(#, ##, **, ---, >, `) 절대 금지. 섹션 제목은 [제목] 대괄호 형태 그대로, 본문은 일반 문장으로만.'
  return { system: systemKo, user: '검사 결과:' + NL + testLines + moodLine + gameLine }
}

app.post('/api/ai-analyze/integrated', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const u = await DB.prepare('SELECT email FROM users WHERE id=?').bind(userId).first<{ email: string }>()
  if (!isMasterAccount(u?.email)) {
    const rl = await checkRateLimit(KV, `analyze-int:${userId}`, 5, 60)
    if (!rl.allowed) return c.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429)
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) return c.json({ error: 'API 키 미설정' }, 500)

  let body: { counselingType?: string; lang?: string }
  try { body = await c.req.json() } catch { body = {} }
  const lang = body.lang ?? 'ko'
  const counselingType = body.counselingType ?? 'psychological'

  // 검사별 최신+직전 결과 수집 (이미 저장된 test_history 메타만 — 서버 미저장 원칙 유지)
  const rowsRes = await DB.prepare(
    'SELECT test_type, score, level, result_json, performed_at FROM test_history WHERE user_id=? ORDER BY performed_at DESC LIMIT 60'
  ).bind(userId).all<{ test_type: string; score: number | null; level: string | null; result_json: string | null }>()
  const byType = new Map<string, Array<{ score: number | null; level: string | null; result_json: string | null }>>()
  for (const r of (rowsRes.results ?? [])) {
    const arr = byType.get(r.test_type) ?? []
    arr.push(r); byType.set(r.test_type, arr)
  }
  const tests: IntegratedTest[] = [...byType.entries()].map(([testType, arr]) => ({
    testType,
    score: arr[0].score ?? null,
    level: arr[0].level ?? null,
    result: arr[0].result_json ? (() => { try { return JSON.parse(arr[0].result_json as string) } catch { return null } })() : null,
    prevScore: arr[1]?.score ?? null,
  }))
  if (tests.length < 2) return c.json({ error: '통합 해석은 서로 다른 검사 2개 이상을 완료하면 이용할 수 있어요.' }, 400)

  // ② 기분 추이(mood_logs) 요약 — 최근/이전 절반 평균 비교 (기록 3회 이상일 때만)
  let moodSummary = ''
  try {
    const moodRes = await DB.prepare('SELECT mood_score FROM mood_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(userId).all<{ mood_score: number }>()
    const scores = (moodRes.results ?? []).map((m) => m.mood_score)
    if (scores.length >= 3) {
      const half = Math.ceil(scores.length / 2)
      const avg = (a: number[]) => Math.round(a.reduce((s, x) => s + x, 0) / a.length)
      moodSummary = (lang === 'en' ? 'recent avg ' : '최근 평균 ') + avg(scores.slice(0, half)) + '/100' + (lang === 'en' ? ', earlier ' : ', 이전 ') + avg(scores.slice(half)) + '/100 (' + scores.length + (lang === 'en' ? ' logs)' : '회 기록)')
    }
  } catch { /* mood 요약 실패는 무시 */ }

  // ② 마음게임 행동 데이터(같은 DB) — 없으면 null → 프롬프트에서 완전 생략
  const game = await buildGameSummary(DB, userId)

  const { system, user } = buildIntegratedPrompt(tests, lang, counselingType, moodSummary, game?.text ?? '')

  // ── 무료 1회 → 이후 유료(프리미엄 프리미엄, 2026-07-18). 마스터는 무제한 무료. ──
  //   스트리밍 엔드포인트라 스트림 시작 전 선결제. upstream 실패(502) 시 환불, 무료분은 성공 시점에 소진.
  const isMasterUser = isMasterAccount(u?.email)
  const INTEGRATED_COST = 40
  const integratedFreeKey = `integrated_free_used:${userId}`
  const integratedUsedFree = isMasterUser ? 1 : (parseInt((await KV.get(integratedFreeKey)) || '0', 10) || 0)
  const integratedIsFree = !isMasterUser && integratedUsedFree < 1
  let integratedCharged = false
  if (!isMasterUser && !integratedIsFree) {
    const spent = await spendCredits(DB, userId, INTEGRATED_COST, 'integrated_analyze')
    if (!spent.ok) return c.json({ error: '통합 심층 해석은 첫 1회 무료 후 이용권이 필요해요. 마음풀에서 구매해 주세요.', balance: spent.balance, needPurchase: true, product: 'integrated_one' }, 402)
    integratedCharged = true
  }

  // ⚠️ sonnet-4-6/haiku-4-5는 temperature 허용. 모델을 sonnet-5/opus-4.7+로 올릴 땐 temperature 제거 필수(안 그러면 400).
  // system 배열의 cache_control은 현 프롬프트 길이(<2048토큰)에선 캐시 미적용(에러 아님) — 프롬프트가 커지면 자동 적용.
  const INTEGRATED_FALLBACKS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001']
  let upstream!: Response
  for (const model of INTEGRATED_FALLBACKS) {
    upstream = await fetch(aiEndpoint(c.env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        // 게임 행동 데이터가 붙으면서 출력이 길어져 1800에서 마지막 면책 문장이 잘림(E2E 확인) → 2400
        max_tokens: 2400,
        temperature: 0.4,
        stream: true,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
      }),
    })
    // 403은 IP/키 레벨이라 모델 바꿔도 동일 → 재시도 안 함(차단 IP 부하 축소). 404만 폴백.
    if (upstream.ok || upstream.status !== 404) break
  }
  if (!upstream.ok) {
    if (integratedCharged) await gainCredits(DB, userId, INTEGRATED_COST, 'integrated_refund')   // 스트림 실패 → 환불
    const errBody = await upstream.text().catch(() => '')
    console.error('[ai-analyze-integrated] error:', upstream.status, errBody.slice(0, 300))
    return c.json({ error: 'AI 서비스 오류 (' + upstream.status + ')' }, 502)
  }
  if (integratedIsFree) c.executionCtx.waitUntil(KV.put(integratedFreeKey, '1'))   // 무료 1회 소진(스트림 시작 성공)
  // 🛟 위기 하드 브레이크 — 통합 대상 검사 중 위기 신호가 있으면 위기자원을 코드로 덧붙인다(없으면 기존 그대로).
  const crisisTextInt = crisisFromIntegrated(tests) ? buildCrisisBlock(lang) : ''
  const outBodyInt = crisisTextInt && upstream.body ? appendCrisisSse(upstream.body, crisisTextInt) : upstream.body
  return new Response(outBodyInt, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
})

// ============================================================
// ⑩ AI 해석 품질 피드백 (👍/👎) — 프롬프트 개선용. 실패해도 UX 무영향.
// ============================================================
app.post('/api/ai-feedback', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)
  const b = await c.req.json().catch(() => ({})) as { feature?: string; rating?: string; reason?: string }
  if (!b.feature || (b.rating !== 'up' && b.rating !== 'down')) return c.json({ error: '파라미터 부족' }, 400)
  // A(a2): 👎 사유(선택). down일 때만 저장, 화이트리스트 밖은 무시. (기존 up/down 흐름 그대로)
  const REASONS = ['generic', 'mismatch', 'long', 'other']
  const reason = (b.rating === 'down' && b.reason && REASONS.includes(b.reason)) ? b.reason : null
  try {
    await DB.prepare('INSERT INTO ai_feedback (user_id, feature, rating, reason) VALUES (?, ?, ?, ?)')
      .bind(userId, String(b.feature).slice(0, 40), b.rating, reason).run()
  } catch (e) { console.error('[ai-feedback] insert error:', e); return c.json({ success: false }, 200) }
  return c.json({ success: true })
})

// A(a1): 어드민 — AI 해석 피드백 집계 (기능별 👍/👎 비율 + 👎 사유 분포)
app.get('/api/admin/feedback-metrics', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const days = Math.min(180, Math.max(7, Number(c.req.query('days') || 30)))
  const since = `-${days} days`
  try {
    const [byFeature, reasons] = await DB.batch([
      DB.prepare(`SELECT feature,
                    SUM(CASE WHEN rating='up' THEN 1 ELSE 0 END) AS up,
                    SUM(CASE WHEN rating='down' THEN 1 ELSE 0 END) AS down,
                    COUNT(*) AS total
                  FROM ai_feedback WHERE created_at >= date('now', ?)
                  GROUP BY feature ORDER BY total DESC`).bind(since),
      DB.prepare(`SELECT COALESCE(reason,'(미기재)') AS reason, COUNT(*) AS c
                  FROM ai_feedback WHERE rating='down' AND created_at >= date('now', ?)
                  GROUP BY reason ORDER BY c DESC`).bind(since),
    ])
    return c.json({ success: true, data: { days, byFeature: byFeature.results ?? [], downReasons: reasons.results ?? [] } })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// ============================================================
// AI 채팅 — 크레딧 차감 + 실패 시 환불
// ============================================================
// ============================================================
// 게임 SSO 토큰 발급 — 마음게임 전용 장기 토큰 (7일)
// accessToken(1시간)과 별도로 게임 진입 시 사용
// ============================================================
app.get('/api/game-token', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const secret = await getJwtSecret(KV)
  const now    = Math.floor(Date.now() / 1000)
  // 7일 유효 게임 전용 토큰
  const gameToken = await signJwt(
    { sub: userId, type: 'game', iat: now, exp: now + 7 * 86400 },
    secret
  )
  return c.json({ success: true, gameToken })
})

// ── 커플 전용 7일 토큰 발급 ────────────────────────────────
app.get('/api/couple-token', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const secret = await getJwtSecret(KV)
  const now    = Math.floor(Date.now() / 1000)
  const coupleToken = await signJwt(
    { sub: userId, type: 'couple', iat: now, exp: now + 7 * 86400 },
    secret
  )
  return c.json({ success: true, coupleToken })
})

// 마음부부(bubu.maumful.com) 진입 SSO — couple-token과 동일 방식, type:'bubu'
app.get('/api/bubu-token', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const secret = await getJwtSecret(KV)
  const now    = Math.floor(Date.now() / 1000)
  const bubuToken = await signJwt(
    { sub: userId, type: 'bubu', iat: now, exp: now + 7 * 86400 },
    secret
  )
  return c.json({ success: true, bubuToken })
})

// ── 마음세대(부모-자녀 세대 통역) SSO 토큰 — 마음부부와 동일 패턴 ──
// sedae.maumful.com 진입용. 워커가 공유 KV의 JWT_SECRET으로 검증한다.
app.get('/api/sedae-token', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const secret = await getJwtSecret(KV)
  const now    = Math.floor(Date.now() / 1000)
  const sedaeToken = await signJwt(
    { sub: userId, type: 'sedae', iat: now, exp: now + 7 * 86400 },
    secret
  )
  return c.json({ success: true, sedaeToken })
})

// ── 마음 시리즈(마음수달 등) SSO 토큰 — 마음풀 계정으로 단일로그인 진입 ──
// MAUM_SSO_SECRET(시크릿) 미설정 시 503 → 프론트는 일반 링크로 폴백(무영향).
app.get('/api/maum-sso-token', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
  const secret = (c.env as Record<string, any>).MAUM_SSO_SECRET
  if (!secret) return c.json({ success: false, error: 'SSO 미설정' }, 503)
  const u = await DB.prepare('SELECT email FROM users WHERE id=?').bind(userId).first<{ email: string }>()
  if (!u?.email) return c.json({ success: false, error: '이메일이 없는 계정' }, 400)
  const now = Math.floor(Date.now() / 1000)
  const ssoToken = await signSso(secret, { uid: userId, email: String(u.email).toLowerCase(), exp: now + 300 })
  return c.json({ success: true, ssoToken })
})

// ── BIG5/LOST/DSI 결과 저장 (마음커플 연동용) ─────────────
app.post('/api/test/save-result', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)

  const { test_type, result_json } = await c.req.json().catch(() => ({})) as {
    test_type?: string; result_json?: Record<string, unknown>
  }
  if (!test_type || !result_json) return c.json({ error: '파라미터 부족' }, 400)
  // 리포트용 전 검사 저장(A안). BIG5/LOST/DSI는 마음커플·통합해석이 참조하는 기존 형태 유지 — 프론트가 그 3종 형태를 그대로 보냄.
  if (!['BIG5', 'LOST', 'DSI', 'RIASEC', 'VALUES', 'PHQ9', 'GAD7', 'DASS21', 'BURNOUT', 'SCT'].includes(test_type)) return c.json({ error: '지원하지 않는 유형' }, 400)

  const resultStr = JSON.stringify(result_json)
  const upd = await DB.prepare(
    `UPDATE test_history SET result_json=? WHERE id=(
       SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1
     )`
  ).bind(resultStr, userId, test_type).run()

  // 기존 행이 없으면 (BIG5 무료 검사 등 startTest 미호출 케이스) 새 행 삽입
  if (upd.meta.changes === 0) {
    await DB.prepare(
      `INSERT INTO test_history (user_id, test_type, lang, credits_spent, result_json) VALUES (?, ?, 'ko', 0, ?)`
    ).bind(userId, test_type, resultStr).run()
  }

  return c.json({ success: true })
})

// ── GET /api/user/daily-context ───────────────────────────
// 3개 서비스 데이터 종합 → AI 개인화 인사말 + 채팅 컨텍스트 생성
app.get('/api/user/daily-context', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인 필요' }, 401)

  const user = await DB.prepare('SELECT nickname FROM users WHERE id=?').bind(userId).first<{ nickname: string }>()
  const name = user?.nickname || '회원'

  // 1. 최근 검사 이력 (타입별 최신 1건)
  const testRows = await DB.prepare(
    `SELECT test_type, score, level, performed_at FROM test_history
     WHERE user_id=? AND score IS NOT NULL AND performed_at > datetime('now','-60 days')
     GROUP BY test_type HAVING performed_at = MAX(performed_at)
     ORDER BY performed_at DESC LIMIT 8`
  ).bind(userId).all<{ test_type: string; score: number; level: string; performed_at: string }>()

  // 2. 최근 7일 감정 기록 (마음게임 mood)
  const moodRows = await DB.prepare(
    `SELECT score, metadata, created_at FROM game_session_logs
     WHERE user_id=? AND game_id='mood' AND created_at > datetime('now','-7 days')
     ORDER BY created_at DESC LIMIT 5`
  ).bind(userId).all<{ score: number; metadata: string; created_at: string }>()

  // 3. 최근 관계 체크인 (마음커플)
  const checkin = await DB.prepare(
    `SELECT total_score, created_at FROM relationship_checkins
     WHERE user_id=? ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first<{ total_score: number; created_at: string }>()

  const tests = testRows.results || []
  const moods = moodRows.results || []
  const hasData = tests.length > 0 || moods.length > 0

  if (!hasData) {
    return c.json({ success: true, hasData: false, greeting: null, chatContext: null })
  }

  // 컨텍스트 문자열 구성
  const parts: string[] = []
  if (tests.length > 0) {
    const testSummary = tests.map(t => {
      const days = Math.floor((Date.now() - new Date(t.performed_at).getTime()) / 86400000)
      return `${t.test_type}(${days}일 전, ${t.score}점${t.level ? '/' + t.level : ''})`
    }).join(', ')
    parts.push(`최근 검사: ${testSummary}`)
  }
  if (moods.length > 0) {
    const MOOD_MAP: Record<number, string> = { 1:'기쁨', 2:'평온', 3:'무감각', 4:'슬픔', 5:'불안', 6:'화남', 7:'지침' }
    const moodList = moods.map(m => {
      try { const meta = JSON.parse(m.metadata || '{}'); return MOOD_MAP[meta.mood] || '기록됨' } catch { return '기록됨' }
    }).join(', ')
    parts.push(`최근 감정 기록: ${moodList}`)
  }
  if (checkin) {
    const days = Math.floor((Date.now() - new Date(checkin.created_at).getTime()) / 86400000)
    parts.push(`관계 체크인: ${checkin.total_score}/50점 (${days}일 전)`)
  }
  const chatContext = parts.join('\n')

  // AI 인사말 생성
  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) {
    return c.json({ success: true, hasData: true, greeting: `${name}님, 오늘 마음은 어떠세요?`, chatContext })
  }

  const aiPrompt = `마음풀 앱 사용자 데이터:\n${chatContext}\n이름: ${name}\n\n위 데이터를 참고해 AI 상담사 첫 인사말을 1~2문장으로 작성하세요.\n규칙: 수치 직접 언급 금지, 따뜻한 어조, 오늘 상태 묻는 열린 질문으로 마무리, 진단 표현 금지`

  let greeting = `${name}님, 오늘 하루 마음은 어떠세요?`
  try {
    const aiRes = await fetch(aiEndpoint(c.env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, messages: [{ role: 'user', content: aiPrompt }] }),
    })
    if (aiRes.ok) {
      const j = await aiRes.json() as { content: Array<{ text: string }> }
      if (j.content?.[0]?.text) greeting = j.content[0].text.trim()
    }
  } catch { /* 기본 인사말 유지 */ }

  return c.json({ success: true, hasData: true, greeting, chatContext })
})

// ── GET /api/test/recent-summary ──────────────────────────
// 최근 검사 결과 요약 (예약 시 상담사 공유용)
app.get('/api/test/recent-summary', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인 필요' }, 401)

  const rows = await DB.prepare(
    `SELECT test_type, score, ai_analysis, performed_at FROM test_history WHERE user_id=? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 5`
  ).bind(userId).all<{ test_type: string; score: number; ai_analysis: string | null; performed_at: string }>()

  const tests = rows.results || []
  if (tests.length === 0) return c.json({ success: true, summary: null, tests: [] })

  const summary = tests.map(r =>
    `${r.test_type} (${r.performed_at.slice(0,10)}): ${r.score}점${r.ai_analysis ? ' — ' + r.ai_analysis.slice(0,80) : ''}`
  ).join('\n')

  return c.json({ success: true, summary, tests })
})

// ── POST /api/test/external-result ───────────────────────
// 외부 검사 결과 수동 입력 (다른 기관/앱에서 받은 결과)
app.post('/api/test/external-result', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인 필요' }, 401)

  const body = await c.req.json().catch(() => ({})) as {
    testType?: string
    score?: number
    note?: string
    conductedAt?: string
  }
  const { testType, score, note, conductedAt } = body

  const ALLOWED_TYPES = ['PHQ9','GAD7','BURNOUT','BIG5','LOST','DSI','DASS21','SRCI','CUSTOM']
  if (!testType || !ALLOWED_TYPES.includes(testType)) {
    return c.json({ error: '지원하지 않는 검사 유형입니다' }, 400)
  }
  if (score === undefined || score === null || typeof score !== 'number') {
    return c.json({ error: '점수를 입력해 주세요' }, 400)
  }

  const performedAt = conductedAt || new Date().toISOString()
  const aiAnalysis = note ? note.slice(0, 500) : null

  await DB.prepare(
    `INSERT INTO test_history (user_id, test_type, lang, credits_spent, score, ai_analysis, performed_at, source) VALUES (?, ?, 'ko', 0, ?, ?, ?, 'external')`
  ).bind(userId, testType, score, aiAnalysis, performedAt).run()

  return c.json({ success: true })
})

// ── POST /api/test/analyze-pdf ────────────────────────────
// 외부 검사 PDF 텍스트 → AI 비임상 해석 + 게임/재검사 추천
app.post('/api/test/analyze-pdf', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인 필요' }, 401)

  const body = await c.req.json().catch(() => ({})) as {
    testType?: string; pdfText?: string; fileName?: string
  }
  const { testType = 'EXTERNAL', pdfText, fileName } = body

  if (!pdfText || pdfText.trim().length < 50) {
    return c.json({ error: 'PDF에서 텍스트를 충분히 추출할 수 없었습니다. 스캔 이미지 PDF는 지원되지 않습니다.' }, 400)
  }
  if (pdfText.length > 20000) {
    return c.json({ error: 'PDF가 너무 큽니다. 결과지 핵심 페이지만 포함해 주세요.' }, 400)
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) return c.json({ error: 'AI 서비스 미설정' }, 500)

  const PDF_COST = 3
  const creditResult = await spendCredits(DB, userId, PDF_COST, 'pdf_analyze')
  if (!creditResult.ok) {
    return c.json({ error: `크레딧이 부족합니다. (필요: ${PDF_COST}cr, 보유: ${creditResult.balance}cr)`, needsCharge: true }, 402)
  }

  const systemPrompt = `당신은 심리검사 결과를 입력된 정보만 근거로 설명하는 해설 시스템입니다.
당신의 역할은 창의적 해석이 아니라, 아래 규칙을 일관되게 적용하는 것입니다.

[절대 금지 규칙]
- 입력에 없는 정보 추론·추측 금지 (점수에 명시된 것만 해석)
- 진단명·질환명·DSM 기준 언급 금지
- "~장애", "~증", "~병" 등 의학 용어 금지
- 약물·치료 권유 금지
- 점수 근거 없는 임상 표현 금지

[표준 어휘집 — 반드시 이 표현만 사용]
높은 불안/걱정 → "불안 경향"
높은 우울/의욕저하 → "우울 경향"
높은 피로/탈진 → "소진 경향"
대인관계 어려움 → "관계 어려움"
감정 기복 → "감정 조절의 어려움"
충동적 반응 → "즉각 반응 경향"
내향성 → "내향적 성향"
외향성 → "외향적 성향"
(위 표현 외 임의 조어 금지)

[점수 구간 해석 테이블 — AI 임의 판단 금지, 이 테이블만 적용]
PHQ-9: 0-4=정상 범위, 5-9=경미한 우울 경향, 10-14=중등도 우울 경향, 15-19=중등도-고도 우울 경향, 20+=고도 우울 경향
GAD-7: 0-4=정상 범위, 5-9=경미한 불안 경향, 10-14=중등도 불안 경향, 15+=고도 불안 경향
BURNOUT(K-MBI 기준): 0-25=낮음, 26-50=보통, 51-75=높음, 76+=매우 높음
DASS-21 우울: 0-9=정상, 10-12=경미, 13-20=중등도, 21+=심각
DASS-21 불안: 0-7=정상, 8-9=경미, 10-14=중등도, 15+=심각
DASS-21 스트레스: 0-14=정상, 15-18=경미, 19-25=중등도, 26+=심각
BIG5: 각 요인 점수 70%+ = "높음", 30%-70% = "보통", 30%- = "낮음"
MBTI: 입력된 유형 그대로 설명. 유형 변형·추측 금지.
(위 테이블에 없는 척도는 입력 텍스트에 명시된 수준·표현만 그대로 인용)

[고정 출력 구조 — 반드시 이 순서, 이 제목, 섹션 추가·삭제 금지]
**주요 특성** — 입력 점수/결과에서 확인된 특성 2~3가지. 위 표준 어휘만 사용. 각 항목 1문장.
**일상 패턴** — 대인관계·업무·감정 조절 영역에서 나타날 수 있는 패턴. 추측이 아닌 점수 기반. 2~3문장.
**강점** — 이 결과에서 비롯되는 긍정적 측면. 1~2문장.
**관심 영역** — 균형을 위해 살펴볼 부분. 비판 아닌 가능성 언어. 1~2문장.
**추천 활동** — 아래 게임 목록 중 이 결과와 맞는 것 2~3개. 각 항목에 한 줄 이유 포함.
마지막 문장: "본 해석은 자기이해를 위한 참고 자료이며 전문가 상담을 대체하지 않습니다."

게임 목록: mood(감정 온도계), garden(마음 정원), efmt(감정꽃), gratitude(감사 일기), tree(마음나무), burnout(번아웃 테스트), worry(걱정 풍선), focus(마음 집중력)

출력 마지막에 아래 형식 그대로 (키·형식 변경 금지):
GAMES:["game1","game2"]
FOLLOWUP:["PHQ9","GAD7"]
(FOLLOWUP: 이 결과와 관련 깊은 마음풀 검사 — PHQ9/GAD7/BURNOUT/BIG5/LOST/DSI)`

  const truncated = pdfText.slice(0, 15000)
  const userMsg = `검사 종류: ${testType}${fileName ? ` (${fileName})` : ''}\n\n=== 검사 결과 내용 ===\n${truncated}`

  let aiRes: Response
  try {
    aiRes = await fetch(aiEndpoint(c.env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })
  } catch (e: unknown) {
    console.error('[analyze-pdf] AI 연결 오류:', e)   // 기술 상세는 서버 로그로만
    await gainCredits(DB, userId, PDF_COST, 'pdf_analyze_refund')
    return c.json({ error: 'AI 분석이 일시적으로 지연되고 있어요. 잠시 후 다시 시도해 주세요. (사용하신 크레딧은 자동 환불됐어요)' }, 500)
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => '(응답 없음)')
    console.error('[analyze-pdf] upstream', aiRes.status, errText.slice(0, 300))
    await gainCredits(DB, userId, PDF_COST, 'pdf_analyze_refund')
    return c.json({ error: 'AI 분석에 실패했어요. 잠시 후 다시 시도해 주세요. (사용하신 크레딧은 자동 환불됐어요)' }, 500)
  }

  let aiJson: { content: Array<{ text: string }> }
  try {
    aiJson = await aiRes.json() as { content: Array<{ text: string }> }
  } catch (e: unknown) {
    console.error('[analyze-pdf] 응답 파싱 오류:', e)
    await gainCredits(DB, userId, PDF_COST, 'pdf_analyze_refund')
    return c.json({ error: 'AI 응답을 처리하지 못했어요. 잠시 후 다시 시도해 주세요. (사용하신 크레딧은 자동 환불됐어요)' }, 500)
  }
  const rawText = aiJson.content?.[0]?.text || ''

  // GAMES / FOLLOWUP 파싱
  const gamesMatch = rawText.match(/GAMES:\[([^\]]*)\]/)
  const followupMatch = rawText.match(/FOLLOWUP:\[([^\]]*)\]/)
  const suggestedGames: string[] = gamesMatch
    ? gamesMatch[1].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean)
    : ['mood', 'garden']
  const followUpTests: string[] = followupMatch
    ? followupMatch[1].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean)
    : []

  // GAMES:/FOLLOWUP: 줄 제거한 순수 분석 텍스트
  const analysis = rawText.replace(/GAMES:\[[^\]]*\]/g, '').replace(/FOLLOWUP:\[[^\]]*\]/g, '').trim()

  // test_history 저장 (외부 + AI 분석 포함)
  try {
    await DB.prepare(
      `INSERT INTO test_history (user_id, test_type, lang, credits_spent, ai_analysis, performed_at, source) VALUES (?, ?, 'ko', 0, ?, CURRENT_TIMESTAMP, 'external')`
    ).bind(userId, testType.toUpperCase().slice(0, 20), analysis.slice(0, 1000)).run()
  } catch {
    // source 컬럼 없는 구버전 스키마 fallback
    await DB.prepare(
      `INSERT INTO test_history (user_id, test_type, lang, credits_spent, ai_analysis, performed_at) VALUES (?, ?, 'ko', 0, ?, CURRENT_TIMESTAMP)`
    ).bind(userId, testType.toUpperCase().slice(0, 20), analysis.slice(0, 1000)).run()
  }

  return c.json({ success: true, analysis, suggestedGames, followUpTests })
})

// ── AI 상담 감정 점수 기록 ────────────────────────────────────
app.post('/api/chat/mood-log', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false }, 401)
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ success: false }, 400)
  const { moodScore, testType } = body
  const score = Math.round(Number(moodScore))
  if (isNaN(score) || score < 0 || score > 100) return c.json({ success: false }, 400)
  await DB.prepare('INSERT INTO mood_logs (user_id, mood_score, test_type) VALUES (?, ?, ?)')
    .bind(userId, score, testType ?? null).run()
  return c.json({ success: true })
})

// ── AI 상담 감정 추이 조회 ────────────────────────────────────
app.get('/api/chat/mood-trend', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const rawDays = parseInt(c.req.query('days') || '14')
  const days = Math.min(isNaN(rawDays) ? 14 : rawDays, 90)
  const rows = await DB.prepare(
    `SELECT DATE(created_at) AS day, ROUND(AVG(mood_score)) AS avg_score, COUNT(*) AS cnt
     FROM mood_logs WHERE user_id=? AND created_at >= DATE('now', ? || ' days')
     GROUP BY day ORDER BY day`
  ).bind(userId, `-${days}`).all<{ day: string; avg_score: number; cnt: number }>()
  return c.json({ success: true, data: rows.results || [] })
})

// ── 장기 트렌드 예측 ─────────────────────────────────────────
app.get('/api/test/trend-prediction', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const testType = c.req.query('type') || 'PHQ9'
  const rows = await DB.prepare(
    `SELECT score, performed_at FROM test_history WHERE user_id=? AND test_type=? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 10`
  ).bind(userId, testType).all<{ score: number; performed_at: string }>()
  const data = (rows.results || []).reverse() // 오래된 순
  if (data.length < 3) return c.json({ success: false, error: '예측에는 최소 3회 이상의 검사 이력이 필요합니다.', count: data.length })

  // 선형 회귀로 다음 점수 예측
  const n = data.length
  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.score)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((a, x, i) => a + (x - xMean) * (ys[i] - yMean), 0) /
                xs.reduce((a, x) => a + (x - xMean) ** 2, 0)
  const intercept = yMean - slope * xMean
  const predictedRaw = Math.round(intercept + slope * n)
  const predicted = Math.max(0, Math.min(100, predictedRaw))

  const latest = ys[ys.length - 1]
  const trend = slope > 0.5 ? '악화' : slope < -0.5 ? '호전' : '안정'
  const diff = predicted - latest
  const diffText = diff > 0 ? `+${diff}점 예상` : diff < 0 ? `${diff}점 예상` : '현 수준 유지'

  // AI 코멘트 생성
  const apiKey = await getAnthropicKey(DB, c.env)
  let comment = ''
  if (apiKey) {
    const prompt = `사용자의 ${testType} 검사 점수 추이: ${data.map(d => `${d.performed_at.slice(0,10)} ${d.score}점`).join(', ')}. 트렌드: ${trend}. 예측 점수: ${predicted}점. 이 정보를 바탕으로 비임상적이고 따뜻한 응원 메시지를 2문장으로 작성하세요. 진단 표현 금지.`
    try {
      const aiRes = await fetch(aiEndpoint(c.env), {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, messages: [{ role: 'user', content: prompt }] })
      })
      const aiData = await aiRes.json() as any
      comment = aiData?.content?.[0]?.text || ''
    } catch { /* 실패 시 코멘트 없이 반환 */ }
  }

  return c.json({
    success: true,
    testType, data,
    predicted, trend, diffText,
    slope: parseFloat(slope.toFixed(2)),
    comment,
  })
})

// ── GET /api/test/cbt-plan ────────────────────────────────
// PHQ9/GAD7/BURNOUT 점수 기반 맞춤형 8주 자기관리 플랜 생성 (7일 KV 캐시)
app.get('/api/test/cbt-plan', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  // 최근 검사 점수 수집 (test_type별 최신 score — MAX(performed_at)이 SELECT에 있으면 SQLite가 해당 행의 score 반환)
  const scores = await DB.prepare(
    `SELECT test_type, score, MAX(performed_at) as latest
     FROM test_history
     WHERE user_id=? AND test_type IN ('PHQ9','GAD7','BURNOUT','DASS21')
       AND score IS NOT NULL
     GROUP BY test_type`
  ).bind(userId).all<{ test_type: string; score: number }>()

  if (!scores.results.length) {
    return c.json({ success: false, error: '검사 이력이 없습니다. 먼저 PHQ-9 또는 GAD-7 검사를 수행해 주세요.' })
  }

  const scoreMap: Record<string, number> = {}
  for (const r of scores.results) scoreMap[r.test_type] = r.score

  const cacheKey = `cbt_plan:${userId}`
  const todayKST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)

  // 30일 캐시 확인
  const cached = await KV.get(cacheKey, 'json') as { plan: unknown[]; summary: string; scores: Record<string, number>; generatedAt: string } | null
  if (cached && cached.generatedAt >= new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10)) {
    return c.json({ success: true, ...cached, cached: true })
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) return c.json({ success: false, error: 'AI 키 미설정' }, 500)

  const scoreDesc = Object.entries(scoreMap).map(([t, s]) => `${t} ${s}점`).join(', ')
  const prompt = `사용자의 심리검사 점수: ${scoreDesc}.

이 점수를 바탕으로 사용자에게 맞춤형 8주 자기관리 플랜을 JSON 형식으로 작성하세요.
각 주차는 다음 필드를 포함해야 합니다:
- week: 주차 번호 (1~8)
- title: 이번 주 핵심 주제 (한글 10자 이내)
- theme: 구체적 테마 설명 (20자 이내)
- practice: 매일 실천할 활동 1가지 (30자 이내)
- game: 추천 게임 ID (mood/garden/efmt/gratitude/burnout/focus/worry/tree 중 하나)
- tip: 따뜻한 한줄 응원 (30자 이내)

그리고 summary 필드: 이 플랜의 전체 목표를 2문장으로 설명 (임상 표현 금지, 비임상적 언어 사용).

JSON만 반환하세요. 형식:
{"summary":"...","plan":[{"week":1,"title":"...","theme":"...","practice":"...","game":"...","tip":"..."},...]}`

  try {
    const aiRes = await fetch(aiEndpoint(c.env), {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!aiRes.ok) return c.json({ success: false, error: `AI 오류 (${aiRes.status})` }, 502)
    const aiData = await aiRes.json() as any
    const raw = (aiData?.content?.[0]?.text || '').trim()

    // JSON 파싱 (마크다운 코드블록 감싸짐 처리)
    let jsonStr: string
    if (raw.startsWith('{')) {
      jsonStr = raw
    } else {
      const si = raw.indexOf('{')
      const ei = raw.lastIndexOf('}')
      if (si === -1 || ei === -1) return c.json({ success: false, error: 'AI 응답에서 JSON을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 502)
      jsonStr = raw.slice(si, ei + 1)
    }
    const parsed = JSON.parse(jsonStr) as { summary: string; plan: unknown[] }

    const result = { plan: parsed.plan, summary: parsed.summary, scores: scoreMap, generatedAt: todayKST }
    await KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 30 * 86400 })

    return c.json({ success: true, ...result, cached: false })
  } catch (e: unknown) {
    console.error('[cbt-plan] 생성 오류:', e)
    return c.json({ success: false, error: '플랜을 만들지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500)
  }
})

// 대화 기억 조회
app.get('/api/ai-chat/memory', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const memStore = await KV.get(`chat_mem:${userId}`, 'json') as Record<string, { date: string; points: string[] }> | null
  if (!memStore) return c.json({ success: true, memories: {} })
  return c.json({ success: true, memories: Object.fromEntries(
    Object.entries(memStore).map(([k, v]) => [k, { date: v.date, count: v.points.length }])
  )})
})

// 대화 기억 삭제
app.delete('/api/ai-chat/memory', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  await KV.delete(`chat_mem:${userId}`)
  return c.json({ success: true })
})

// ── 🛟 AI 상담 채팅용 위기 하드 브레이크 ─────────────────────────────
//   검사와 달리 자유서술이라 키워드 기반. 오탐(과장표현 "힘들어 죽겠다")을 줄이기 위해
//   '자살사고/자해 의도'가 명확한 고신뢰 키워드만 매칭한다. ⚠️ NFC 정규화 필수
//   (자모 분리 NFD 한글은 완성형 정규식에 매칭 안 돼 1차 방어가 통째로 우회됨 — CLAUDE.md).
function chatCrisisKeywordHit(text: string): boolean {
  if (!text) return false
  const t = text.normalize('NFC')
  const ko = /자살|자해|목숨.{0,5}끊|스스로.{0,5}(해치|해할)|죽고\s*싶|죽고\s*파|죽어\s*버리|죽을\s*까|살고\s*싶지\s*않|살\s*의욕.{0,3}없|살기\s*싫|사라지고\s*싶|없어지고\s*싶|뛰어\s*내리|목\s*매/
  const en = /suicid|kill(ing)?\s+myself|want(ing)?\s+to\s+die|end(ing)?\s+(my|it\s+all)|take\s+my\s+(own\s+)?life|self[-\s]?harm|don'?t\s+want\s+to\s+(live|be\s+here|exist)|better\s+off\s+dead/i
  return ko.test(t) || en.test(t)
}

// 채팅 선행 위기 안내(코드 보장) — 따뜻한 한 문단 + 24시간 자원. 검사용 [긴급 도움말] 박스와 달리
//   대화 흐름에 맞춘 인사형. AI 응답보다 먼저 노출돼 위기자원이 반드시 도달하게 한다.
function buildChatCrisisPrefix(lang: string): string {
  if (lang === 'en') {
    return "I hear how much pain you're in right now, and I'm really glad you reached out. You don't have to face this alone — the 988 Suicide & Crisis Lifeline (call or text 988) is there any time, day or night.\n\n"
  }
  return '지금 많이 힘드시죠. 그 마음을 꺼내 주셔서 고맙고, 혼자 견디지 않으셔도 괜찮아요. 24시간 언제든 곁에서 들어줄 곳이 있어요 — 자살예방 상담전화 109, 정신건강 위기상담 1577-0199.\n\n'
}

// 업스트림 SSE 앞에 위기 안내 델타를 1개 선행 삽입한다(prepend).
//   ⚠️ 채팅은 프론트가 [MOOD:N]을 "문자열 끝"에서만 제거하므로 append(끝 삽입)는 MOOD 태그를 노출시킴 →
//   반드시 prepend. AI 응답과 [MOOD:N]은 그대로 뒤에 붙어 MOOD 파싱이 정상 동작한다.
function prependCrisisSse(upstreamBody: ReadableStream<Uint8Array>, crisisText: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return upstreamBody.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      const payload = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: crisisText } })
      controller.enqueue(enc.encode('data: ' + payload + '\n\n'))
    },
    transform(chunk, controller) { controller.enqueue(chunk) },
  }))
}

app.post('/api/ai-chat', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  // 비로그인 허용 — IP 기반 Rate Limit으로 제한
  const isGuest = !userId

  // KST(UTC+9) 기준 날짜 — UTC 사용 시 자정~09:00 KST 구간에서 전날 카운터가 이월됨
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  // 오류 환불 시 카운터 감소에 쓸 핸들러 범위 변수
  let chatDailyKey = ''
  let chatIsMaster = false

  if (isGuest) {
    // 비로그인: IP 기반 평생 2회 체험 (TTL 없음 — 누적 추적)
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const guestKey = `ai_guest_total:${ip}`
    const guestUsed = parseInt(await KV.get(guestKey) || '0', 10)
    const GUEST_TOTAL_LIMIT = 3
    if (guestUsed >= GUEST_TOTAL_LIMIT) {
      return c.json({
        success: false,
        error: `비로그인 AI 상담은 ${GUEST_TOTAL_LIMIT}회까지 체험할 수 있습니다. 회원가입하면 매일 5회 무료 + 가입 보너스 20 크레딧이 지급됩니다!`,
        totalUsed: guestUsed, totalLimit: GUEST_TOTAL_LIMIT,
        needsSignup: true,
        errorCode: 'guest_limit_exceeded',
      }, 429)
    }
    await KV.put(guestKey, String(guestUsed + 1))  // TTL 없음 — 평생 누적
    // 비로그인은 크레딧 차감 없이 바로 AI 호출로 진행
  } else {
    // 로그인: 마스터 계정 무제한
    const userRow = await DB.prepare('SELECT email, credits FROM users WHERE id=?').bind(userId).first<{ email: string; credits: number }>()
    chatIsMaster = isMasterAccount(userRow?.email)

    if (!chatIsMaster) {
      // 분당 Rate Limit
      const rl = await checkRateLimit(KV, `chat:${userId}`, 20, 60)
      if (!rl.allowed) return c.json({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429)

      const COST = 2
      const hasCredits = (userRow?.credits ?? 0) >= COST

      if (hasCredits) {
        // 크레딧 보유: 소진될 때까지 무제한 (일일 한도 없음)
        const result = await spendCredits(DB, userId, COST, 'chat')
        if (!result.ok) {
          return c.json({
            success: false,
            error: `크레딧 부족 (보유: ${result.balance}, 필요: ${COST})`,
            balance: result.balance,
            needsCharge: true,
          }, 402)
        }
      } else {
        // 크레딧 없음: 일일 5회 무료 제공
        chatDailyKey = `ai_daily:${userId}:${today}`
        const dailyUsed = parseInt(await KV.get(chatDailyKey) || '0', 10)
        const dailyLimit = 5

        if (dailyUsed >= dailyLimit) {
          return c.json({
            success: false,
            error: `오늘 무료 AI 상담 횟수(${dailyLimit}회)를 모두 사용했습니다.`,
            dailyUsed, dailyLimit,
            needsCharge: true,
            errorCode: 'daily_limit_exceeded',
          }, 429)
        }

        await KV.put(chatDailyKey, String(dailyUsed + 1), { expirationTtl: 86400 })
      }
    }
    // 마스터 계정: 횟수 제한·크레딧 차감 없이 바로 통과
  }

  // 크레딧 차감 + 카운터를 모두 되돌리는 환불 헬퍼
  async function refundChat() {
    if (!isGuest && userId && !chatIsMaster) {
      if (chatDailyKey) {
        // 무료 사용자 카운터 복구
        const cnt = parseInt(await KV.get(chatDailyKey) || '1', 10)
        await KV.put(chatDailyKey, String(Math.max(0, cnt - 1)), { expirationTtl: 86400 })
      } else {
        // 크레딧 차감 복구
        await gainCredits(DB, userId, 2, 'refund_api_error')
      }
    }
  }

  const { messages, testContext, dailyContext } = await c.req.json()
  const { testType, counselingType = 'psychological', summary, lang = 'ko' } = testContext ?? {}
  const dailyCtxPart = dailyContext ? `\n\n[사용자 최근 활동 데이터]\n${dailyContext}` : ''

  // ── 대화 기억 로드 (이전 세션 맥락 주입) ────────────────────
  const memKey = userId ? `chat_mem:${userId}` : null
  let memoryContext = ''
  let hasMemory = false
  if (memKey) {
    const memStore = await KV.get(memKey, 'json') as Record<string, { date: string; points: string[] }> | null
    const typeKey = testType || 'GENERAL'
    const mem = memStore?.[typeKey]
    if (mem?.points?.length) {
      hasMemory = true
      memoryContext = `\n\n[이전 상담 기억 (${mem.date})]\n${mem.points.map((p: string) => `・${p}`).join('\n')}`
    }
    // 현재 대화 저장 (4번 이상 주고받은 경우 — 이 요청 이전의 히스토리 기반)
    if (messages.length >= 4) {
      const msgArr = messages as Array<{role:string;content:string}>
      const userPts = msgArr
        .filter(m => m.role === 'user').slice(-5)
        .map(m => String(m.content).slice(0, 120))
      const lastAi = msgArr.filter(m => m.role === 'assistant').slice(-1)[0]
      if (lastAi) userPts.push(`[AI요약] ${String(lastAi.content).slice(0, 200)}`)
      const updated = { ...(memStore || {}), [typeKey]: { date: today, points: userPts } }
      const saveP = KV.put(memKey, JSON.stringify(updated), { expirationTtl: 30 * 86400 })
      try { c.executionCtx.waitUntil(saveP) } catch { saveP.catch(() => {}) }
    }
  }

  // 3회 이상 측정된 검사 유형의 트렌드 맥락 생성 (로그인 사용자만)
  let trendContext = ''
  if (userId && testType && testType !== 'GENERAL') {
    const trendRows = await DB.prepare(
      `SELECT score, performed_at FROM test_history WHERE user_id=? AND test_type=? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 5`
    ).bind(userId, testType).all<{ score: number; performed_at: string }>()
    const rows = trendRows.results || []
    if (rows.length >= 3) {
      const oldest = rows[rows.length - 1]
      const latest = rows[0]
      const diff = latest.score - oldest.score
      const trend = diff > 0 ? `+${diff}점 악화` : diff < 0 ? `${diff}점 호전` : '변화 없음'
      trendContext = `\n\n[누적 트렌드 - ${testType} 최근 ${rows.length}회]: ${rows.map(r => `${r.performed_at.slice(0,10)} ${r.score}점`).reverse().join(' → ')} (${trend})`
    }
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) {
    await refundChat()
    return c.json({ error: 'API 키 미설정' }, 500)
  }

  // 프롬프트 캐싱: 정적 지침(cache_control 마킹) + 동적 검사결과 분리
  const staticKoBiblical = `당신은 기독교 상담 전문가입니다. 따뜻하고 공감적인 태도로 상담하세요.

상담 원칙:
- 진단명이나 병명을 절대 단정하지 마세요
- "의료적 진단이 필요합니다"는 표현 대신 "전문가와 이야기 나눠보세요"로 표현하세요
- 성경 말씀은 강요하지 말고 위로의 맥락에서 자연스럽게 인용하세요
- 약물 복용이나 처방은 절대 언급하지 마세요
- 트렌드 데이터가 있으면 변화 추이를 자연스럽게 언급하고 격려하세요

말하는 방식 (매우 중요):
- 제목·라벨·번호·불릿을 쓰지 마세요. "공감/말씀/제안" 같은 소제목을 붙이지 말고, 사람이 말하듯 이어지는 문장으로만 쓰세요.
- "정확한 자기 인식이네요", "믿음이 좋으시네요" 같은 평가나 칭찬으로 시작하지 마세요. 상대의 말에서 감정이 가장 많이 묻어 있는 한 조각을 그대로 되짚어 주세요.
- 성경 구절은 따로 떼어 인용하지 말고, 위로하는 말 안에 자연스럽게 녹여 주세요. 어색한 상황이면 넣지 않아도 됩니다.
- ⚠️ 성경을 인용할 땐 내용·숫자·사건이 반드시 정확해야 합니다(예: 하나님은 엿새 동안 일하시고 이레째 되는 날 안식하셨습니다). 조금이라도 확실하지 않으면 인용하지 말고 당신의 말로 위로하세요. 구절이나 성경 속 사실을 지어내지 마세요.
- 신앙을 강요하거나 "기도하면 해결된다"는 식으로 말하지 마세요. 고통을 신앙으로 덮지 말고, 먼저 그 고통 곁에 머무르세요.
- 신앙의 바탕은 규칙이 아니라 관계입니다. 하나님은 사람과 교제하며 함께 살고 싶어 사람을 지으셨고, 원죄의 값을 예수님이 십자가에서 대신 치르심으로 사람을 자녀 삼는 길을 여셨습니다. 그러니 위로와 쉼은 규정상 허용되는 것이 아니라 아버지 되신 하나님의 마음에서 나옵니다.
- 지쳐 있는 사람에게 쉼을 말하는 것은 합당하며 하나님이 기뻐하시는 방향입니다. 다만 쉼을 권할 때 상대의 신앙이나 봉사 태도를 평가하지 마세요("계속 짐을 지는 건 신앙적으로 건강하지 않습니다" 같은 표현 금지). 쉼은 아버지가 자녀에게 주고 싶어 하시는 것이라고, 관계 안에서 말해 주세요.
- 봉사와 헌신을 성과나 의무로 다루지 마세요.
- 상대의 상태에 따라 답의 무게를 바꾸세요:
  · 감정이 격하거나 무너져 있을 때 → 공감만 하고 끝내세요. 말씀도 제안도 얹지 마세요.
  · 이야기가 막혀 있을 때 → 공감한 뒤 열린 질문 하나만 건네세요.
  · 스스로 방향을 찾고 있을 때 → 공감한 뒤 작은 제안 하나를 조심스럽게 건네세요.
- 제안은 처방이 아니라 권유입니다. "~하세요"보다 "혹시 ~하면 어떨까 싶어요"처럼, 부담되면 안 해도 된다는 여지를 남기세요.
- 질문은 한 번에 최대 하나. 2~3문단, 350자 안팎으로 쓰세요.

이런 식으로 답하세요:
(사용자) 기도해도 아무 응답이 없는 것 같아요. 하나님이 저를 잊으신 것 같아요.
(답변) 기도의 자리에 앉아 아무 대답도 듣지 못한 채 보낸 시간이 참 외로우셨겠어요. 하나님이 나를 잊으신 것 같다는 말은, 그만큼 오래 혼자 버텨오셨다는 뜻으로 들려요.

(사용자) 할 일이 너무 많은데 다 제 책임 같아서 버거워요.
(답변) 다 내 책임 같다는 마음이 제일 무거우셨을 것 같아요. 짐 진 자를 쉬게 하시겠다는 말씀 앞에서도, 정작 그 짐을 혼자 들고 계셨던 거네요. 그중에 정말 오늘 안에 끝나야 하는 건 몇 개나 될까요?

(사용자) 몇 년째 봉사를 쉬지 않고 해왔는데 지쳤어요. 쉬면 하나님께 죄송할 것 같아요. 쉬어도 될까요?
(답변) 쉬고 싶다는 마음보다 죄송함이 먼저 올라온다는 게, 그동안 얼마나 애써 오셨는지를 말해 주는 것 같아요. 하나님은 일을 잘 해내는 사람이 필요해서가 아니라 함께 지내고 싶어서 당신을 지으셨고, 예수님을 통해 당신을 자녀로 삼으셨어요. 아버지가 지친 자녀에게 바라시는 건 더 버티는 게 아니라 쉬어 가는 거예요. 쉬는 동안에도 그 관계는 조금도 줄어들지 않아요.

위기 대응 (위의 어떤 형식 지시보다 우선):
사용자가 위기 신호(자해, 죽고 싶다, 사라지고 싶다 등)를 보이면, 말투나 분량과 상관없이 반드시 "자살예방상담전화 1393"을 그 답변 안에서 안내하세요. 이때는 말씀 인용이나 제안을 미루고 안전을 먼저 다루세요. 기도나 믿음을 권하는 말로 전문 도움 안내를 대신하지 마세요.

답변 맨 마지막에 빈 줄 후 [MOOD:N] 한 줄 추가. N은 0~100 정수 (0=극심한 고통, 50=보통, 100=매우 양호). 이 태그는 사용자에게 보이지 않으므로 설명하지 마세요. 형식을 자유롭게 쓰더라도 이 태그는 반드시 넣으세요.`

  const staticKoGeneral = `당신은 따뜻하고 전문적인 마음 돌봄 상담사입니다.

상담 원칙:
- 진단명이나 병명을 절대 단정하지 마세요 (예: "우울증입니다" 금지)
- "의료적 진단이 필요합니다" 대신 "전문가와 이야기 나눠보시면 도움이 될 것 같아요"로 표현하세요
- 약물 복용이나 처방은 절대 언급하지 마세요
- 트렌드 데이터가 있으면 변화 흐름을 자연스럽게 언급하고 격려하세요

말하는 방식 (매우 중요):
- 제목·라벨·번호·불릿을 쓰지 마세요. "공감/탐색/제안" 같은 소제목을 붙이지 말고, 사람이 말하듯 이어지는 문장으로만 쓰세요.
- "정확한 자기 인식이네요", "좋은 통찰이에요" 같은 평가나 칭찬으로 시작하지 마세요. 상대의 말에서 감정이 가장 많이 묻어 있는 한 조각을 그대로 되짚어 주세요.
- 상대의 상태에 따라 답의 무게를 바꾸세요:
  · 감정이 격하거나 무너져 있을 때 → 공감만 하고 끝내세요. 질문도 제안도 하지 마세요.
  · 이야기가 막혀 있을 때 → 공감한 뒤 열린 질문 하나만 건네세요.
  · 스스로 방향을 찾고 있을 때 → 공감한 뒤 작은 제안 하나를 조심스럽게 건네세요.
- 제안은 처방이 아니라 권유입니다. "~하세요"보다 "혹시 ~하면 어떨까 싶어요"처럼, 부담되면 안 해도 된다는 여지를 남기세요.
- 질문은 한 번에 최대 하나. 2~3문단, 350자 안팎으로 쓰세요.

이런 식으로 답하세요:
(사용자) 요즘 아침에 눈 뜨는 게 너무 무서워요. 하루가 시작되는 게.
(답변) 눈을 뜨는 순간이 무섭다는 말이, 하루를 버텨낼 힘이 이미 바닥났다는 뜻처럼 들려요. 그 아침을 지금까지 혼자 여러 번 맞으셨겠네요.

(사용자) 할 일이 너무 많은데 뭐부터 해야 할지 모르겠어요. 다 제 책임 같아서요.
(답변) 다 내 책임 같다는 마음이 제일 무거우셨을 것 같아요. 그 무게를 며칠째 혼자 들고 계셨던 거네요. 그중에 정말 오늘 안에 끝나야 하는 건 몇 개나 될까요?

위기 대응 (위의 어떤 형식 지시보다 우선):
사용자가 위기 신호(자해, 죽고 싶다, 사라지고 싶다 등)를 보이면, 말투나 분량과 상관없이 반드시 "자살예방상담전화 1393"을 그 답변 안에서 안내하세요. 이때는 질문이나 제안을 미루고 안전을 먼저 다루세요.

답변 맨 마지막에 빈 줄 후 [MOOD:N] 한 줄 추가. N은 0~100 정수 (0=극심한 고통, 50=보통, 100=매우 양호). 이 태그는 사용자에게 보이지 않으므로 설명하지 마세요. 형식을 자유롭게 쓰더라도 이 태그는 반드시 넣으세요.`

  const dynamicKo = `검사 결과 맥락:
${summary ?? (counselingType === 'biblical' ? '검사 결과 없음 — 신앙 안에서의 마음 돌봄 상담으로 진행하세요.' : '검사 결과 없음 — 일반적인 마음 돌봄 상담으로 진행하세요.')}${trendContext}${memoryContext}${dailyCtxPart}`

  const systemContentKo = [
    {
      type: 'text' as const,
      text: counselingType === 'biblical' ? staticKoBiblical : staticKoGeneral,
      cache_control: { type: 'ephemeral' as const },
    },
    {
      type: 'text' as const,
      text: dynamicKo,
    },
  ]

  const staticEnBiblical = `You are a compassionate Christian counselor. Provide warm, empathetic support grounded in faith.

Counseling principles:
- Never label or diagnose a condition (e.g., never say "you have depression")
- Say "it might help to speak with a professional" instead of "you need medical diagnosis"
- Quote scripture gently for comfort, never as a requirement
- Never mention medication or prescriptions
- When trend data is available, acknowledge the change naturally and encourage progress

How to speak (very important):
- Do not use headings, labels, numbers, or bullets. Never write section titles like "Empathy/Scripture/Suggest". Write in flowing sentences, the way a person actually speaks.
- Do not open with praise or evaluation ("That's great self-awareness", "Your faith is strong"). Instead, reflect back the part of what they said that carries the most feeling.
- Do not set scripture apart as a quoted block. Let it live inside your words of comfort, and leave it out entirely when it would feel forced.
- ⚠️ When you reference scripture, the content, numbers, and events must be accurate (e.g. God worked six days and rested on the seventh). If you are even slightly unsure, do not reference it — comfort them in your own words instead. Never invent a verse or a biblical fact.
- Never push faith or imply that praying will fix it. Do not cover pain with faith — stay beside the pain first.
- Faith rests on a relationship, not on rules. God made people to live in fellowship with him, and through Jesus paying the price of sin on the cross he opened the way to make them his children. So comfort and rest are not concessions the rules permit — they come from the heart of a Father.
- Telling an exhausted person to rest is right, and it is a direction God delights in. But when you offer rest, never evaluate their faith or how they serve (avoid phrasing like "carrying that load is not spiritually healthy"). Say it from inside the relationship: rest is something a Father wants to give his child.
- Never treat service or devotion as performance or obligation.
- Let the weight of your reply follow their state:
  · When emotion is raw or they are falling apart → offer empathy only. No scripture, no suggestion.
  · When the story feels stuck → empathy, then one open question.
  · When they are already looking for a direction → empathy, then one small suggestion, offered gently.
- A suggestion is an invitation, not a prescription. Prefer "I wonder if it might help to..." over "You should...", and leave room to decline.
- At most one question per reply. Two or three short paragraphs, around 350 characters.

Reply like this:
(user) I pray and hear nothing back. I think God has forgotten me.
(reply) Sitting in prayer and hearing nothing back must have been such a lonely place to be. Saying God has forgotten you sounds like you've been holding on by yourself for a long time.

(user) There's too much to do and it all feels like my responsibility.
(reply) That feeling that it all rests on you sounds like the heaviest part. Even before the One who offers rest to the weary, you've been carrying that weight alone. Of everything on that list, how much truly has to be done today?

(user) I've served for years without a break and I'm exhausted. I feel guilty toward God for wanting to rest. Is it okay to rest?
(reply) That guilt arriving before the tiredness even gets a word in says a lot about how hard you've been trying. God didn't make you because he needed someone to get things done — he made you to share life with you, and through Jesus he made you his child. What a Father wants for a worn-out child isn't more endurance, it's rest. That relationship doesn't shrink while you rest.

Crisis response (this overrides any formatting instruction above):
If the user signals a crisis (self-harm, wanting to disappear, suicidal ideation), you must include "988 Suicide & Crisis Lifeline (call or text 988)" in that reply, regardless of tone or length. Put safety first and hold back scripture or suggestions. Never let prayer or an encouragement to trust God stand in place of directing them to professional help.

After your response, add a blank line then [MOOD:N] on the last line. N is 0-100 integer (0=severe distress, 50=neutral, 100=excellent). This tag is hidden from users — do not explain it. Even when writing freely, always include this tag.`

  const staticEnGeneral = `You are a warm and professional mental wellness counselor.

Counseling principles:
- Never diagnose or label a condition (e.g., never say "you have depression")
- Say "it might help to speak with a professional" instead of "you need medical diagnosis"
- Never mention medication or prescriptions
- When trend data is available, acknowledge the change naturally and encourage progress

How to speak (very important):
- Do not use headings, labels, numbers, or bullets. Never write section titles like "Empathy/Explore/Suggest". Write in flowing sentences, the way a person actually speaks.
- Do not open with praise or evaluation ("That's great self-awareness", "What a good insight"). Instead, reflect back the part of what they said that carries the most feeling.
- Let the weight of your reply follow their state:
  · When emotion is raw or they are falling apart → offer empathy only. No question, no suggestion.
  · When the story feels stuck → empathy, then one open question.
  · When they are already looking for a direction → empathy, then one small suggestion, offered gently.
- A suggestion is an invitation, not a prescription. Prefer "I wonder if it might help to..." over "You should...", and leave room to decline.
- At most one question per reply. Two or three short paragraphs, around 350 characters.

Reply like this:
(user) I'm scared to open my eyes in the morning. Just the day starting.
(reply) When you say opening your eyes feels frightening, it sounds like the strength to get through the day is already gone. You've been meeting those mornings alone for a while now.

(user) There's too much to do and it all feels like my responsibility.
(reply) That feeling that it all rests on you sounds like the heaviest part. You've been carrying that weight by yourself for days now. Of everything on that list, how much truly has to be done today?

Crisis response (this overrides any formatting instruction above):
If the user signals a crisis (self-harm, wanting to disappear, suicidal ideation), you must include "988 Suicide & Crisis Lifeline (call or text 988)" in that reply, regardless of tone or length. Put safety first and hold back questions or suggestions.

After your response, add a blank line then [MOOD:N] on the last line. N is 0-100 integer (0=severe distress, 50=neutral, 100=excellent). This tag is hidden from users — do not explain it. Even when writing freely, always include this tag.`

  const dynamicEn = `Assessment context:
${summary ?? (counselingType === 'biblical' ? 'No test result — proceed as faith-based wellness counseling.' : 'No test result — proceed as general wellness counseling.')}${trendContext}${memoryContext}${dailyCtxPart}`

  const systemContentEn = [
    {
      type: 'text' as const,
      text: counselingType === 'biblical' ? staticEnBiblical : staticEnGeneral,
      cache_control: { type: 'ephemeral' as const },
    },
    {
      type: 'text' as const,
      text: dynamicEn,
    },
  ]

  // messages 기본 검증
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: '메시지가 없습니다.' }, 400)
  }

  // 모델 폴백: 환경변수 모델이 404/403이면 순서대로 재시도
  const MODEL_FALLBACKS = [
    getAiModel(c.env),
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
  ]
  const reqBody = { max_tokens: 800, stream: true, system: lang === 'ko' ? systemContentKo : systemContentEn, messages }

  let res!: Response
  let usedModel = MODEL_FALLBACKS[0]
  for (const model of [...new Set(MODEL_FALLBACKS)]) {
    let retries = 0
    while (true) {
      res = await fetch(aiEndpoint(c.env), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'prompt-caching-2024-07-31' },
        body: JSON.stringify({ model, ...reqBody }),
      })
      const isOverloaded = res.status === 529 || res.status === 500
      if (res.ok || !isOverloaded || retries >= 2) break
      retries++
      await new Promise(r => setTimeout(r, retries * 1500))
    }
    // 403은 IP/키 레벨이라 모델 바꿔도 동일 → 재시도 안 함(차단 IP 부하 축소). 404만 폴백.
    if (res.ok || res.status !== 404) { usedModel = model; break }
    usedModel = model
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[ai-chat] Anthropic error:', res.status, usedModel, errBody.slice(0, 300))
    await refundChat()
    const msg = res.status === 404 ? `AI 모델(${usedModel})을 찾을 수 없습니다. Anthropic API 키를 확인하세요.`
              : res.status === 401 ? 'AI API 키가 유효하지 않습니다. 관리자에게 문의하세요.'
              : res.status === 400 ? 'AI 요청 형식 오류입니다. 다시 시도해주세요.'
              : res.status === 403 ? `AI 모델(${usedModel}) 접근 권한이 없습니다. Anthropic 플랜을 확인하세요.`
              : res.status === 529 ? 'AI 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.'
              : `AI 서비스 오류 (${res.status}): ${errBody.slice(0, 200)}`
    return c.json({ error: msg, status: res.status, model: usedModel, detail: errBody.slice(0, 500) }, 502)
  }

  if (!isGuest && userId) {
    DB.prepare('INSERT INTO chat_sessions (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)')
      .bind(userId, testType ?? null, lang, 5).run().catch(() => {})
  }

  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  // 🛟 위기 하드 브레이크(채팅) — 직전 사용자 메시지에 위기 신호가 있으면 위기자원을 코드로 선행 노출.
  //   프롬프트 위기 지시가 불이행돼도(기독교 트랙 실측 2/5) 반드시 도달. 신호 없으면 기존 스트림 그대로.
  const lastUserMsg = Array.isArray(messages)
    ? [...(messages as Array<{ role?: string; content?: unknown }>)].reverse().find((m) => m?.role === 'user')
    : null
  const chatCrisis = !!lastUserMsg && chatCrisisKeywordHit(String(lastUserMsg.content ?? ''))
  const chatOutBody = chatCrisis && res.body ? prependCrisisSse(res.body, buildChatCrisisPrefix(lang)) : res.body
  return new Response(chatOutBody, { headers: sseHeaders })
})

// ============================================================
// 결제 Webhook
// ============================================================
// ── 패키지 정의 (credits: 지급량, amount: 결제금액, currency 단위에 맞게)
// KRW: 원 단위 / USD: 센트 단위 (Stripe 기준)
const PACKAGES: Record<string, { credits: number; amount: number; label: string; product?: boolean; service?: 'otter' | 'gyeot' | 'phyweb'; grantType?: string }> = {
  starter_kr:  { credits: 50,  amount: 4900,  label: '스타터' },
  standard_kr: { credits: 120, amount: 9900,  label: '표준'   },
  premium_kr:  { credits: 300, amount: 15000, label: '프리미엄' },
  pro_kr:      { credits: 700, amount: 25000, label: '대용량' },
  starter_g:   { credits: 50,  amount: 299,   label: 'Starter'  },
  standard_g:  { credits: 120, amount: 599,   label: 'Standard' },
  premium_g:   { credits: 300, amount: 1299,  label: 'Premium'  },
  pro_g:       { credits: 700, amount: 2499,  label: 'Pro'      },
  // ── 단품 상품(하이브리드: 화면=상품, 백엔드=크레딧 지급). KR 상품제 ──
  test_one:  { credits: 10, amount: 2000, label: '심리검사 1회(해석 포함)', product: true },
  ai_10:     { credits: 20, amount: 2900, label: 'AI 상담 10회권',          product: true },
  pdf_one:   { credits: 3,  amount: 1000, label: 'PDF 결과해석',            product: true },
  allinone:  { credits: 33, amount: 3900, label: '올인원(검사+AI10회+PDF)', product: true },
  // ── 서비스별 프리미엄 상품(모두 마음풀 users.credits 지급 → 각 서비스가 차감) ──
  //    프리미엄 포지셔닝(2026-07-18): 저가 지양. 부부·세대는 통역이 maumful 크레딧을 쓴다(세대는 성인만).
  integrated_one: { credits: 40, amount: 4500, label: '통합 심층 해석 1회', product: true },
  //   3단계 회차팩(공용 크레딧 곡선 단조감소: 132→98→89 /cr). 회당 평균 2.5cr → 10/20/40회.
  bubu_pack10:    { credits: 25,  amount: 3300, label: '마음부부 통역 10회팩(라이트)', product: true },
  bubu_pack20:    { credits: 50,  amount: 4900, label: '마음부부 통역 20회팩(스탠다드)', product: true },
  bubu_pack40:    { credits: 100, amount: 8900, label: '마음부부 통역 40회팩(프로)', product: true },
  sedae_pack10:   { credits: 25,  amount: 3300, label: '마음세대 통역 10회팩(라이트·성인)', product: true },
  sedae_pack20:   { credits: 50,  amount: 4900, label: '마음세대 통역 20회팩(스탠다드·성인)', product: true },
  sedae_pack40:   { credits: 100, amount: 8900, label: '마음세대 통역 40회팩(프로·성인)', product: true },
  // ── 외부 서비스 상품(마음풀 판매 → 서명 grant로 수달·곁에 지급). credits=0(내부 크레딧 안 줌) ──
  otter_light:  { credits: 0, amount: 7900,  label: '마음수달 라이트(월 30세션)', product: true, service: 'otter', grantType: 'sub_light' },
  otter_pro:    { credits: 0, amount: 14900, label: '마음수달 프로(월 100세션)',  product: true, service: 'otter', grantType: 'sub_pro' },
  otter_pack10: { credits: 0, amount: 6900,  label: '마음수달 10회팩',            product: true, service: 'otter', grantType: 'pack10' },
  gyeot_light:  { credits: 0, amount: 7900,  label: '마음곁 라이트(월 30세션)',   product: true, service: 'gyeot', grantType: 'sub_light' },
  gyeot_pro:    { credits: 0, amount: 14900, label: '마음곁 프로(월 100세션)',    product: true, service: 'gyeot', grantType: 'sub_pro' },
  gyeot_pack10: { credits: 0, amount: 6900,  label: '마음곁 10회팩',              product: true, service: 'gyeot', grantType: 'pack10' },
  // ── phyweb 상담사 구독(마음풀에서 판매 → phyweb에 grant/쿠폰코드 전달). 같은 사업자(마음서비스)라 결제창 공유 ──
  //    grantType = phyweb planType(TOSS_PLAN_CONFIG 키와 동일). 월간=1개월 이용권(비자동갱신), 연간=1년.
  phyweb_solo:         { credits: 0, amount: 19900,  label: 'phyweb 상담사 Solo(1개월)',         product: true, service: 'phyweb', grantType: 'solo' },
  phyweb_basic:        { credits: 0, amount: 29900,  label: 'phyweb 상담사 Basic(1개월)',        product: true, service: 'phyweb', grantType: 'basic' },
  phyweb_professional: { credits: 0, amount: 49900,  label: 'phyweb 상담사 Professional(1개월)', product: true, service: 'phyweb', grantType: 'professional' },
  phyweb_solo_annual:  { credits: 0, amount: 190000, label: 'phyweb 상담사 Solo(연간)',          product: true, service: 'phyweb', grantType: 'solo_annual' },
  phyweb_basic_annual: { credits: 0, amount: 250000, label: 'phyweb 상담사 Basic(연간)',         product: true, service: 'phyweb', grantType: 'basic_annual' },
  phyweb_professional_annual: { credits: 0, amount: 450000, label: 'phyweb 상담사 Professional(연간)', product: true, service: 'phyweb', grantType: 'professional_annual' },
}
// 외부 서비스 grant 수신 URL(각 워커 루트 도메인). 결제 성공 → signSso 서명 → POST /api/grant.
const SERVICE_API: Record<string, string> = { otter: 'https://maumotter.com', gyeot: 'https://maumgyeot.com', phyweb: 'https://phyweb.pages.dev' }
// 결제 성공분을 외부 서비스로 지급 전달. external_grants 큐에 기록 후 서명 POST. 실패해도 결제는 유지(재시도).
async function deliverGrant(env: any, charge: { chargeId: number; user_id: number; package_key: string }): Promise<void> {
  const DB = env.DB
  const pkg = PACKAGES[charge.package_key]
  if (!pkg?.service || !pkg.grantType) return
  const u = await DB.prepare('SELECT email FROM users WHERE id=?').bind(charge.user_id).first<{ email: string }>()
  const email = String(u?.email || '').toLowerCase()
  const orderId = `mf_charge_${charge.chargeId}`
  await DB.prepare("INSERT INTO external_grants (order_id,user_id,email,service,grant_type,amount,status) VALUES (?,?,?,?,?,?,'pending') ON CONFLICT(order_id) DO NOTHING")
    .bind(orderId, charge.user_id, email, pkg.service, pkg.grantType, pkg.amount).run()
  const secret = env.MAUM_SSO_SECRET
  if (!secret || !email) return   // 지급 근거 부족 → pending 유지(재시도)
  try {
    const token = await signSso(secret, { email, service: pkg.service, grantType: pkg.grantType, orderId, amount: pkg.amount, exp: Math.floor(Date.now() / 1000) + 300 })
    const res = await fetch(`${SERVICE_API[pkg.service]}/api/grant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    if (res.ok) {
      // 쿠폰형 서비스(phyweb 등)는 응답 body의 code를 저장 → 결제완료 화면에서 노출. 직접적용(수달·곁)은 code 없음.
      let code: string | null = null
      try { const j = await res.json() as any; code = j?.code ?? j?.data?.code ?? null } catch {}
      await DB.prepare("UPDATE external_grants SET status='delivered', code=COALESCE(?,code), attempts=attempts+1, delivered_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(code, orderId).run()
      // phyweb 이용권 코드는 이메일로도 발송(결제화면을 놓쳐도 확인 가능). RESEND 미설정이면 no-op.
      if (code && pkg.service === 'phyweb' && email) {
        const html = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#2D6A4F;margin:0 0 12px">phyweb 유료 이용권 코드</h2>
          <p style="color:#444;font-size:14px">결제해 주셔서 감사합니다. 아래 코드를 phyweb에서 등록하시면 유료 구독이 적용됩니다.</p>
          <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#1E2621;background:#F2F9F5;border:1px dashed #52B788;border-radius:12px;padding:16px;text-align:center;margin:16px 0">${code}</div>
          <p style="color:#54605A;font-size:13px;line-height:1.7"><b>등록 방법</b><br>① phyweb 로그인 → ② 대시보드 구독 카드 → ③ ‘이용권 코드 등록’에 위 코드 입력</p>
          <p style="color:#8B948D;font-size:12px">유효기간 1년 · 1회 사용 · 코드 등록 후에는 청약철회가 제한됩니다.</p>
        </div>`
        try { await sendEmail(env, email, '[마음풀] phyweb 유료 이용권 코드', html) } catch {}
      }
    } else {
      await DB.prepare("UPDATE external_grants SET status='failed', attempts=attempts+1 WHERE order_id=?").bind(orderId).run()
    }
  } catch {
    await DB.prepare("UPDATE external_grants SET status='failed', attempts=attempts+1 WHERE order_id=?").bind(orderId).run()
  }
}
// 미전달/실패 grant 재시도(관리자). 결제는 됐으나 전달 실패분(수달·곁 다운 등)을 재지급.
app.post('/api/admin/deliver-pending-grants', async (c) => {
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const secret = (c.env as any).MAUM_SSO_SECRET
  if (!secret) return c.json({ error: 'MAUM_SSO_SECRET 미설정' }, 503)
  const rows = await c.env.DB.prepare("SELECT order_id,email,service,grant_type,amount FROM external_grants WHERE status IN ('pending','failed') AND attempts < 8 ORDER BY created_at LIMIT 50").all<any>()
  let delivered = 0, failed = 0
  for (const r of (rows.results ?? [])) {
    if (!r.email || !SERVICE_API[r.service]) continue
    try {
      const token = await signSso(secret, { email: r.email, service: r.service, grantType: r.grant_type, orderId: r.order_id, amount: r.amount, exp: Math.floor(Date.now() / 1000) + 300 })
      const res = await fetch(`${SERVICE_API[r.service]}/api/grant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      if (res.ok) { let code: string | null = null; try { const j = await res.json() as any; code = j?.code ?? j?.data?.code ?? null } catch {} await c.env.DB.prepare("UPDATE external_grants SET status='delivered',code=COALESCE(?,code),attempts=attempts+1,delivered_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(code, r.order_id).run(); delivered++ }
      else { await c.env.DB.prepare("UPDATE external_grants SET status='failed',attempts=attempts+1 WHERE order_id=?").bind(r.order_id).run(); failed++ }
    } catch { await c.env.DB.prepare("UPDATE external_grants SET status='failed',attempts=attempts+1 WHERE order_id=?").bind(r.order_id).run(); failed++ }
  }
  return c.json({ ok: true, delivered, failed, scanned: (rows.results ?? []).length })
})

// 결제 후 외부 서비스 지급 상태·쿠폰코드 조회(본인 것만). phyweb 등 쿠폰형 상품 등록코드 노출용.
//  chargeId 지정 시 그 건, 없으면 service의 최신 1건(성공 리다이렉트엔 chargeId가 없어 최신 조회 사용).
app.get('/api/payment/grant-code', async (c) => {
  const userId = await getAuthUserId(c.req.raw, c.env.KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
  const chargeId = parseInt(c.req.query('chargeId') || '', 10)
  const service = (c.req.query('service') || '').replace(/[^a-z]/gi, '')
  let row: any = null
  if (chargeId) {
    row = await c.env.DB.prepare(
      "SELECT service, grant_type, code, status, created_at FROM external_grants WHERE order_id=? AND user_id=?"
    ).bind(`mf_charge_${chargeId}`, userId).first<any>()
  } else if (service) {
    row = await c.env.DB.prepare(
      "SELECT service, grant_type, code, status, created_at FROM external_grants WHERE user_id=? AND service=? ORDER BY created_at DESC LIMIT 1"
    ).bind(userId, service).first<any>()
  } else {
    return c.json({ success: false, error: 'chargeId 또는 service 필요' }, 400)
  }
  if (!row) return c.json({ success: true, data: null })
  return c.json({ success: true, data: { service: row.service, grantType: row.grant_type, code: row.code || null, status: row.status, created_at: row.created_at } })
})

// 내 외부서비스 이용권 코드 목록(마이페이지) — phyweb 등 쿠폰형. 결제화면을 놓쳐도 다시 확인 + 환불 트리거.
app.get('/api/payment/my-grant-codes', async (c) => {
  const userId = await getAuthUserId(c.req.raw, c.env.KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
  const rows = await c.env.DB.prepare(
    `SELECT eg.service, eg.grant_type, eg.code, eg.status, eg.created_at,
            cc.pg_tid AS pg_tid, cc.amount AS charge_amount, cc.status AS charge_status, cc.completed_at
     FROM external_grants eg
     LEFT JOIN credit_charges cc ON eg.order_id LIKE 'mf_charge_%' AND cc.id = CAST(SUBSTR(eg.order_id, 11) AS INTEGER)
     WHERE eg.user_id=? AND eg.code IS NOT NULL AND eg.code!='' ORDER BY eg.created_at DESC LIMIT 50`
  ).bind(userId).all()
  return c.json({ success: true, data: (rows.results ?? []).map((r: any) => ({
    service: r.service, grantType: r.grant_type, code: r.code, status: r.status, created_at: r.created_at,
    pgTid: r.pg_tid || null, amount: r.charge_amount || null, chargeStatus: r.charge_status || null, completedAt: r.completed_at || null,
  })) })
})

// ── 구독 플랜 정의 ─────────────────────────────────────────
const SUBSCRIPTION_PLANS: Record<string, {
  name: string; monthlyCredits: number; price: number; currency: string
  features: string[]
}> = {
  basic:    { name: '베이직',   monthlyCredits: 60,  price: 3900,  currency: 'KRW', features: ['월 60 크레딧', '심리검사 6회', 'AI 채팅 무제한', '마음 게임 무료'] },
  standard: { name: '스탠다드', monthlyCredits: 150, price: 8900,  currency: 'KRW', features: ['월 150 크레딧', '심리검사 15회', 'AI 채팅 무제한', '마음 게임 무료', '상담 예약 할인 10%'] },
  pro:      { name: '프로',     monthlyCredits: 400, price: 19900, currency: 'KRW', features: ['월 400 크레딧', '심리검사 무제한', 'AI 채팅 무제한', '마음 게임 무료', '상담 예약 할인 20%', '전문가 월간 리포트'] },
}

// ── GET /api/subscription/plans ───────────────────────────
app.get('/api/subscription/plans', (c) => {
  return c.json({ success: true, data: SUBSCRIPTION_PLANS })
})

// ── GET /api/subscription/me ───────────────────────────────
app.get('/api/subscription/me', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const sub = await DB.prepare(
    'SELECT * FROM user_subscriptions WHERE user_id=? AND status="active" ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first()
  return c.json({ success: true, data: sub || null })
})

// ── POST /api/subscription/checkout ───────────────────────
// 토스 빌링키 발급 흐름 시작
app.post('/api/subscription/checkout', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { planKey } = await c.req.json() as { planKey: string }
  const plan = SUBSCRIPTION_PLANS[planKey]
  if (!plan) return c.json({ success: false, error: '잘못된 플랜' }, 400)

  const user = await DB.prepare('SELECT email, nickname FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  const serviceUrl = c.env.SERVICE_URL || 'http://localhost:3000'
  const customerKey = `maumful_user_${userId}`
  const successUrl  = `${serviceUrl}/api/subscription/toss/success?planKey=${planKey}&userId=${userId}`
  const failUrl     = `${serviceUrl}/?sub=fail`

  const tossClientKey = c.env.TOSS_CLIENT_KEY
  if (!tossClientKey) return c.json({ success: false, error: 'TOSS_CLIENT_KEY 미설정. wrangler secret put TOSS_CLIENT_KEY' }, 500)

  // 토스 빌링키 발급: 클라이언트 리다이렉트 방식
  return c.json({
    success: true,
    data: {
      authUrl: `https://api.tosspayments.com/v1/billing/authorizations/card?customerKey=${customerKey}&successUrl=${encodeURIComponent(successUrl)}&failUrl=${encodeURIComponent(failUrl)}`,
      clientKey: tossClientKey,
      customerKey,
      planKey,
      plan,
    },
  })
})

// ── GET /api/subscription/toss/success ────────────────────
app.get('/api/subscription/toss/success', async (c) => {
  const { DB } = c.env
  const { authKey, customerKey, planKey, userId } = c.req.query() as Record<string, string>

  // customerKey와 userId 일치 여부 검증 (URL 파라미터 조작 방지)
  if (!userId || !customerKey || customerKey !== `maumful_user_${userId}`) {
    return c.redirect('/?sub=fail&msg=요청오류')
  }

  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) return c.redirect('/?sub=fail&msg=서버오류')

  try {
    // 빌링키 발급 확인
    const res = await fetch('https://api.tosspayments.com/v1/billing/authorizations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(tossKey + ':') },
      body: JSON.stringify({ authKey, customerKey }),
    })
    if (!res.ok) return c.redirect('/?sub=fail&msg=빌링키발급실패')
    const billing = await res.json() as { billingKey: string }

    const plan = SUBSCRIPTION_PLANS[planKey]
    if (!plan || !billing.billingKey) return c.redirect('/?sub=fail&msg=플랜오류')

    const uId = parseInt(userId)
    const nextBillingDate = new Date(); nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // DB에 구독 기록 생성
    // user_subscriptions 테이블 필요 (0007_subscriptions.sql 참조)
    try {
      await DB.prepare(`
        INSERT OR REPLACE INTO user_subscriptions
        (user_id, plan_key, billing_key, customer_key, status, monthly_credits, price, next_billing_date)
        VALUES (?,?,?,?,'active',?,?,?)
      `).bind(uId, planKey, billing.billingKey, customerKey, plan.monthlyCredits, plan.price,
               nextBillingDate.toISOString()).run()
    } catch {
      // user_subscriptions 테이블 없으면 무시 (마이그레이션 필요)
    }

    // 첫 달 크레딧 즉시 지급
    await DB.prepare('UPDATE users SET credits = credits + ? WHERE id=?').bind(plan.monthlyCredits, uId).run()
    await DB.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) SELECT ?,?,?,?,credits FROM users WHERE id=?')
      .bind(uId, 'gain', plan.monthlyCredits, `subscription_${planKey}`, uId).run()

    return c.redirect('/?sub=success&plan=' + planKey)
  } catch (e) {
    console.error('[구독] 오류:', e)
    return c.redirect('/?sub=fail&msg=처리오류')
  }
})

// ── DELETE /api/subscription/cancel ───────────────────────
app.delete('/api/subscription/cancel', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  try {
    await DB.prepare("UPDATE user_subscriptions SET status='cancelled', cancelled_at=CURRENT_TIMESTAMP WHERE user_id=? AND status='active'")
      .bind(userId).run()
    return c.json({ success: true, message: '구독이 해지되었습니다. 현재 기간 만료 후 갱신되지 않습니다.' })
  } catch {
    return c.json({ success: false, error: '구독 정보 없음' }, 404)
  }
})


app.post('/api/webhook/toss', async (c) => {
  const { DB } = c.env
  const rawBody = await c.req.text()

  // ── 웹훅 검증 방식 (2026-07-21 변경) ──────────────────────────────
  // 토스 웹훅 등록 콘솔에는 서명 시크릿/Authorization 설정란이 없다(실측). 즉 토스는 이
  // 요청에 서명 헤더를 실어 주지 않는다. 예전 코드는 Authorization: Basic 헤더를 강제해
  // 실제 라이브 웹훅이 전부 401/503으로 막혔다.
  // → 진짜 검증은 아래 "이중 방어 ②"가 한다: 본문을 믿지 않고 토스 API에 결제를 되물어
  //   (TOSS_SECRET_KEY) status=DONE·금액을 재확인하고, 지급 근거는 요청이 아니라 우리 DB
  //   (orderId→chargeId의 pending 행)에서만 찾는다. 위조 본문으로는 크레딧을 못 받는다.
  // (선택) TOSS_WEBHOOK_SECRET을 URL에 심어 두고 토스가 그대로 전달하는 환경이라면, 헤더가
  //   실제로 온 경우에 한해 추가 대조한다 — 안 와도 ②로 안전하므로 막지 않는다(정상 웹훅 차단 방지).
  const tossSecret = c.env.TOSS_WEBHOOK_SECRET
  const authHeader = c.req.header('Authorization')
  if (tossSecret && authHeader && authHeader !== 'Basic ' + btoa(tossSecret + ':')) {
    console.error('[Toss Webhook] Authorization 헤더 불일치 — 차단')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) } catch { return c.json({ error: 'invalid json' }, 400) }
  // 토스 웹훅 페이로드는 결제 객체가 최상위로 오거나 data 안에 올 수 있다(버전차) → 둘 다 대응.
  const evt = (body.data && typeof body.data === 'object') ? (body.data as Record<string, unknown>) : body
  if (evt.status !== 'DONE') return c.json({ ok: true })

  const pgTid = evt.paymentKey as string
  if (!pgTid) return c.json({ error: 'paymentKey 누락' }, 400)

  // 중복 처리 방지 (success 콜백이 이미 처리했을 수 있다)
  const existing = await DB.prepare('SELECT id FROM credit_charges WHERE pg_tid=?').bind(pgTid).first()
  if (existing) return c.json({ ok: true, msg: 'already_processed' })

  // ── 이중 방어 ②: 토스에 실제 결제인지 되묻는다 ────────────────────
  // 서명이 뚫리더라도 여기서 막힌다. 요청 본문(metadata)은 신뢰하지 않는다.
  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) { console.error('[Toss Webhook] TOSS_SECRET_KEY 미설정'); return c.json({ error: 'server' }, 500) }
  let pay: { status?: string; orderId?: string; totalAmount?: number }
  try {
    const inq = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}`, {
      headers: { 'Authorization': 'Basic ' + btoa(tossKey + ':') },
    })
    if (!inq.ok) {
      console.error('[Toss Webhook] 결제 조회 실패 — 지급 거부. paymentKey:', pgTid, 'status:', inq.status)
      return c.json({ error: 'payment not found' }, 400)
    }
    pay = await inq.json()
  } catch (e) {
    console.error('[Toss Webhook] 결제 조회 오류:', e)
    return c.json({ error: 'inquiry failed' }, 502)  // 502면 토스가 재시도
  }
  if (pay.status !== 'DONE') return c.json({ ok: true, msg: 'not_done' })

  // 지급 근거는 요청이 아니라 **우리 DB**. orderId는 checkout이 `charge_<chargeId>_<ts>`로 만든다.
  const m = /^charge_(\d+)_/.exec(String(pay.orderId ?? ''))
  if (!m) { console.error('[Toss Webhook] orderId 형식 불일치:', pay.orderId); return c.json({ error: 'bad orderId' }, 400) }
  const chargeId = parseInt(m[1])
  const charge = await DB.prepare('SELECT user_id, credits, amount, status, package_key FROM credit_charges WHERE id=? AND pg=?')
    .bind(chargeId, 'toss').first<{ user_id: number; credits: number; amount: number; status: string; package_key: string }>()
  if (!charge) { console.error('[Toss Webhook] charge 없음:', chargeId); return c.json({ error: 'charge not found' }, 404) }

  // 금액 위조 차단 — 토스가 말하는 실제 결제금액과 주문 시 확정한 금액이 같아야 한다.
  if (Number(pay.totalAmount) !== Number(charge.amount)) {
    console.error('[Toss Webhook] 금액 불일치 — 지급 거부. 토스:', pay.totalAmount, 'DB:', charge.amount, 'chargeId:', chargeId)
    return c.json({ error: 'amount mismatch' }, 400)
  }

  // 원자적 선점 — pending일 때만 완료 처리. success 콜백과 동시에 와도 한 번만 지급된다.
  const upd = await DB.prepare('UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE id=? AND status=?')
    .bind('completed', pgTid, chargeId, 'pending').run()
  if (upd.meta.changes === 0) return c.json({ ok: true, msg: 'already_processed' })

  // 외부 서비스 상품(수달·곁)이면 크레딧 대신 서명 grant 전달, 아니면 기존 크레딧 지급.
  try {
    if (PACKAGES[charge.package_key]?.service) {
      await deliverGrant(c.env, { chargeId, user_id: charge.user_id, package_key: charge.package_key })
      console.log('[Toss Webhook] 외부 grant 전달 —', charge.package_key, 'chargeId:', chargeId)
    } else {
      await gainCredits(DB, charge.user_id, charge.credits, 'charge', pgTid)
      console.log('[Toss Webhook] 크레딧 지급 완료 — userId:', charge.user_id, 'credits:', charge.credits, 'chargeId:', chargeId)
    }
  } catch (grantErr) {
    // ⚠️ 지급 실패 — 내부 크레딧은 pending으로 롤백하고 500 반환 → 토스가 재시도해 치유. (gainCredits 원자적이라 이중지급 없음)
    console.error('[Toss Webhook] 지급 실패 — chargeId:', chargeId, grantErr)
    if (!PACKAGES[charge.package_key]?.service) {
      await DB.prepare("UPDATE credit_charges SET status='pending', pg_tid=NULL WHERE id=? AND status='completed'").bind(chargeId).run()
    }
    return c.json({ error: 'grant failed, will retry' }, 500)
  }
  completeReferral(DB, charge.user_id).catch(err => console.error('[Referral] 완료 실패 userId=' + charge.user_id, err))
  accruePartnerCommission(DB, chargeId).catch(err => console.error('[PartnerShare] 적립 실패 chargeId=' + chargeId, err))

  // 영수증 이메일 (비동기)
  const twUser = await DB.prepare('SELECT email, nickname FROM users WHERE id=?').bind(charge.user_id).first<{ email: string; nickname: string | null }>()
  if (twUser) sendReceiptEmail(c.env, twUser.email, twUser.nickname || '', charge.credits, charge.amount, 'KRW', pgTid).catch(() => {})

  return c.json({ ok: true })
})

app.post('/api/webhook/stripe', async (c) => {
  const { DB } = c.env
  const rawBody = await c.req.text()

  // ── Stripe Webhook 서명 검증 (HMAC-SHA256) ──────────────────
  const stripeSecret = c.env.STRIPE_WEBHOOK_SECRET
  if (stripeSecret) {
    const sigHeader = c.req.header('stripe-signature') ?? ''
    // stripe-signature: t=timestamp,v1=hmac_hash
    const tMatch  = sigHeader.match(/t=(\d+)/)
    const v1Match = sigHeader.match(/v1=([a-f0-9]+)/)

    if (!tMatch || !v1Match) {
      console.error('[Stripe Webhook] stripe-signature 헤더 형식 오류')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const timestamp = tMatch[1]
    const received  = v1Match[1]

    // Stripe 서명: HMAC-SHA256(timestamp.rawBody, secret)
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(stripeSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(timestamp + '.' + rawBody))
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')

    // 타이밍 공격 방지 비교
    if (received.length !== expected.length) {
      console.error('[Stripe Webhook] 서명 불일치 — 위조 요청 차단')
      return c.json({ error: 'Unauthorized' }, 401)
    }
    let diff = 0
    for (let i = 0; i < received.length; i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) {
      console.error('[Stripe Webhook] 서명 불일치 — 위조 요청 차단')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Timestamp 허용 범위: 5분 이내 (리플레이 공격 방지)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp)
    if (age > 300) {
      console.error('[Stripe Webhook] 타임스탬프 만료 — 리플레이 공격 차단')
      return c.json({ error: 'Request too old' }, 400)
    }
  } else {
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET 미설정 — 서명 검증 건너뜀')
  }

  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) } catch { return c.json({ error: 'invalid json' }, 400) }
  if (body.type !== 'checkout.session.completed') return c.json({ ok: true })

  const session = body.data as Record<string, Record<string, unknown>>
  const obj = session?.object ?? {}
  const meta = (obj.metadata ?? {}) as Record<string, string>
  const { userId, packageKey } = meta

  if (!userId || !packageKey) return c.json({ error: 'metadata 누락' }, 400)
  const pkg = PACKAGES[packageKey]; if (!pkg) return c.json({ error: '잘못된 패키지' }, 400)

  const pgTid = obj.id as string
  if (!pgTid) return c.json({ error: 'session.id 누락' }, 400)

  const existing = await DB.prepare('SELECT id FROM credit_charges WHERE pg_tid=?').bind(pgTid).first()
  if (existing) return c.json({ ok: true, msg: 'already_processed' })

  await DB.prepare('UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE pg=? AND status=? AND user_id=?')
    .bind('completed', pgTid, 'stripe', 'pending', parseInt(userId)).run()
  await gainCredits(DB, parseInt(userId), pkg.credits, 'charge', pgTid)
  console.log('[Stripe Webhook] 크레딧 지급 완료 — userId:', userId, 'credits:', pkg.credits)
  completeReferral(DB, parseInt(userId)).catch(err => console.error('[Referral] 완료 실패 userId=' + userId, err))

  // 영수증 이메일 (비동기)
  const swUser = await DB.prepare('SELECT email, nickname FROM users WHERE id=?').bind(parseInt(userId)).first<{ email: string; nickname: string | null }>()
  if (swUser) sendReceiptEmail(c.env, swUser.email, swUser.nickname || '', pkg.credits, pkg.amount, 'USD', pgTid).catch(() => {})

  return c.json({ ok: true })
})

// ============================================================
// 결제창 생성 API
// ============================================================

// ── 토스페이먼츠 결제창 파라미터 반환 ─────────────────────────
// 흐름: 프론트 → POST /api/payment/toss/checkout
//      → clientKey + orderId 반환 → 프론트 SDK로 결제창 오픈
//      → 결제 완료 → successUrl redirect → GET /api/payment/toss/success
//      → 토스 Webhook POST /api/webhook/toss (크레딧 이중 지급 방지용)
// 결제위젯 렌더용 클라이언트 키 반환(공개키라 노출 무해). 프론트가 위젯 초기화 시 사용.
app.get('/api/payment/toss/client-key', async (c) => {
  const clientKey = c.env.TOSS_CLIENT_KEY
  if (!clientKey) return c.json({ success: false, error: 'TOSS_CLIENT_KEY 미설정' }, 500)
  return c.json({ success: true, clientKey })
})

app.post('/api/payment/toss/checkout', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) return c.json({ success: false, error: '토스페이먼츠 키 미설정. wrangler secret put TOSS_SECRET_KEY' }, 500)

  const { packageKey } = await c.req.json()
  const pkg = PACKAGES[packageKey]
  if (!pkg) return c.json({ success: false, error: '잘못된 패키지' }, 400)

  const user = await DB.prepare('SELECT email, nickname, partner_code FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null; partner_code: string | null }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  // pending 레코드 생성 — partner_code를 함께 저장해야 결제 완료 시 파트너 수익쉐어가 적립된다(누락 시 영영 안 쌓임).
  const r = await DB.prepare(
    'INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg,partner_code) VALUES (?,?,?,?,?,?,?)'
  ).bind(userId, packageKey, pkg.credits, pkg.amount, 'KRW', 'toss', user.partner_code ?? null).run()
  const chargeId = r.meta.last_row_id as number
  const orderId  = `charge_${chargeId}_${Date.now()}`
  const serviceUrl = c.env.SERVICE_URL || 'http://localhost:3000'

  const tossClientKey = c.env.TOSS_CLIENT_KEY
  if (!tossClientKey) return c.json({ success: false, error: 'TOSS_CLIENT_KEY 미설정. wrangler secret put TOSS_CLIENT_KEY' }, 500)

  // 토스는 클라이언트 SDK 방식 — 서버에서 파라미터만 반환
  return c.json({
    success: true,
    data: {
      clientKey:     tossClientKey,
      customerKey:   `maumful_user_${userId}`,
      orderId,
      orderName:     pkg.product ? pkg.label : `${pkg.label} 크레딧 ${pkg.credits}개`,
      amount:        pkg.amount,
      customerName:  user.nickname || user.email.split('@')[0],
      customerEmail: user.email,
      successUrl:    `${serviceUrl}/api/payment/toss/success?chargeId=${chargeId}&orderId=${orderId}`,
      failUrl:       `${serviceUrl}/api/payment/toss/fail?chargeId=${chargeId}`,
      chargeId,
    },
  })
})

// 토스 결제 성공 콜백 (브라우저 redirect)
app.get('/api/payment/toss/success', async (c) => {
  const { DB } = c.env
  const { paymentKey, orderId, amount } = c.req.query() as Record<string, string>
  if (!paymentKey || !orderId) return c.redirect('/?payment=fail&msg=파라미터오류')
  const amountNum = parseInt(amount)
  if (isNaN(amountNum) || amountNum <= 0) return c.redirect('/?payment=fail&msg=파라미터오류')
  // ⚠️ chargeId는 URL 파라미터(사용자가 리다이렉트에서 바꿔치기 가능)를 믿지 않고 orderId에서 파싱한다.
  //    orderId는 아래 confirm에서 토스가 실제 결제와 대조하므로 위조 불가. (웹훅과 동일 원칙)
  const cm = /^charge_(\d+)_/.exec(orderId)
  if (!cm) return c.redirect('/?payment=fail&msg=주문번호오류')
  const chargeIdNum = parseInt(cm[1])

  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) return c.redirect('/?payment=fail&msg=서버오류')

  try {
    // 토스 결제 승인 API (v2 결제위젯 규격) — paymentKey는 body에. 시크릿키(gsk)로 Basic 인증.
    const confirmRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + btoa(tossKey + ':'),
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount: amountNum }),
    })

    if (!confirmRes.ok) {
      // 토스 에러 응답 형태가 일정치 않아(때때로 message가 객체) 문자열만 안전하게 뽑는다.
      // 예전엔 err.message가 객체면 사용자에게 "[object Object]"가 노출됐다.
      let failMsg = '결제 승인에 실패했어요. 다시 시도해 주세요.'
      try {
        const err = await confirmRes.json() as { message?: unknown; code?: unknown }
        if (typeof err?.message === 'string' && err.message.trim()) failMsg = err.message
        else if (typeof err?.code === 'string' && err.code.trim()) failMsg = err.code
      } catch { /* 본문 파싱 실패 시 기본 메시지 */ }
      console.error('[Toss] 결제 승인 실패 status:', confirmRes.status, 'msg:', failMsg)
      await DB.prepare("UPDATE credit_charges SET status='failed' WHERE id=? AND status='pending'").bind(chargeIdNum).run()
      return c.redirect(`/?payment=fail&msg=${encodeURIComponent(failMsg)}`)
    }

    // 중복 처리 방지
    const existing = await DB.prepare('SELECT id FROM credit_charges WHERE pg_tid=?').bind(paymentKey).first()
    if (!existing) {
      const charge = await DB.prepare(
        'SELECT user_id, credits, amount, package_key FROM credit_charges WHERE id=? AND status=? AND pg=?'
      ).bind(chargeIdNum, 'pending', 'toss').first<{ user_id: number; credits: number; amount: number; package_key: string }>()

      if (charge) {
        // ⚠️ 금액 위조 차단 — 토스가 승인한 실제 결제금액과 주문 시 확정한 패키지 금액이 같아야 한다.
        //    (chargeId를 orderId에서 파싱하므로 사실상 항상 일치하지만, 이중 방어로 명시 확인.)
        if (Number(amountNum) !== Number(charge.amount)) {
          console.error('[Toss] 금액 불일치 — 지급 거부. 결제:', amountNum, 'DB:', charge.amount, 'chargeId:', chargeIdNum)
          return c.redirect('/?payment=fail&msg=금액불일치')
        }

        // ⚠️ 원자적 선점 — pending일 때만 완료 처리하고, 바뀐 행이 있을 때만 지급한다.
        //    예전엔 SELECT(pending) → UPDATE(id만)이라 웹훅과 동시에 오면 둘 다 지급될 수 있었다(중복 지급).
        const upd = await DB.prepare(
          'UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE id=? AND status=?'
        ).bind('completed', paymentKey, chargeIdNum, 'pending').run()
        if (upd.meta.changes === 0) {
          // 웹훅이 먼저 지급함 — 결제 자체는 성공이므로 성공 화면으로 보낸다(재지급 없음).
          console.log('[Toss] 이미 처리됨(웹훅 선처리) chargeId:', chargeIdNum)
          return c.redirect('/?payment=success')
        }

        try {
          if (PACKAGES[charge.package_key]?.service) {
            await deliverGrant(c.env, { chargeId: chargeIdNum, user_id: charge.user_id, package_key: charge.package_key })
            console.log('[Toss] 외부 grant 전달:', charge.package_key)
          } else {
            const newBalance = await gainCredits(DB, charge.user_id, charge.credits, 'charge', paymentKey)
            console.log('[Toss] 크레딧 지급:', charge.user_id, '+', charge.credits, '→', newBalance)
          }
        } catch (grantErr) {
          // ⚠️ 지급 실패 — 돈만 받고 끝나면 안 된다. 내부 크레딧은 gainCredits가 원자적이라(아무것도 안 됨)
          //    completed를 pending으로 되돌려 웹훅/재시도가 치유하게 한다. 외부 grant는 external_grants 큐가
          //    재시도하므로 completed 유지.
          console.error('[Toss] 지급 실패 — chargeId:', chargeIdNum, grantErr)
          if (!PACKAGES[charge.package_key]?.service) {
            await DB.prepare("UPDATE credit_charges SET status='pending', pg_tid=NULL WHERE id=? AND status='completed'").bind(chargeIdNum).run()
          }
          return c.redirect('/?payment=success&pending=1')
        }
        completeReferral(DB, charge.user_id).catch(() => {})
        accruePartnerCommission(DB, chargeIdNum).catch(() => {})

        // 영수증 이메일 — 실패해도 결제·지급은 유효하므로 성공 화면을 유지한다(성공을 실패로 뒤집지 않음).
        try {
          const user = await DB.prepare('SELECT email, nickname FROM users WHERE id=?')
            .bind(charge.user_id).first<{ email: string; nickname: string | null }>()
          const pkg  = PACKAGES[charge.package_key]
          if (user && pkg) {
            await sendReceiptEmail(c.env, user.email, user.nickname || '', charge.credits, pkg.amount, 'KRW', paymentKey)
          }
        } catch (mailErr) {
          console.error('[Toss] 영수증 메일 실패(결제·지급은 정상):', mailErr)
        }
      }
    }

    return c.redirect('/?payment=success')
  } catch (e) {
    console.error('[Toss] 처리 오류:', e)
    return c.redirect('/?payment=fail&msg=처리오류')
  }
})

// 토스 결제 실패 콜백
app.get('/api/payment/toss/fail', async (c) => {
  const { DB } = c.env
  const { code, message, chargeId } = c.req.query() as Record<string, string>
  if (chargeId) {
    const cid = parseInt(chargeId)
    if (!isNaN(cid)) {
      await DB.prepare('UPDATE credit_charges SET status=? WHERE id=? AND status=?')
        .bind('failed', cid, 'pending').run()
    }
  }
  console.error('[Toss] 결제 실패:', code, message)
  return c.redirect(`/?payment=fail&msg=${encodeURIComponent(message || '결제취소')}`)
})

// ── Stripe Checkout Session 생성 ─────────────────────────────
// 흐름: 프론트 → POST /api/payment/stripe/checkout
//      → checkoutUrl 반환 → 프론트가 window.location = checkoutUrl
//      → 결제 완료 → success_url redirect
//      → Stripe Webhook POST /api/webhook/stripe (크레딧 지급)
app.post('/api/payment/stripe/checkout', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const stripeKey = c.env.STRIPE_SECRET_KEY
  if (!stripeKey) return c.json({ success: false, error: 'Stripe 키 미설정. wrangler secret put STRIPE_SECRET_KEY' }, 500)

  const { packageKey } = await c.req.json()
  const pkg = PACKAGES[packageKey]
  if (!pkg) return c.json({ success: false, error: '잘못된 패키지' }, 400)

  const user = await DB.prepare('SELECT email, nickname FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  // pending 레코드 생성
  const r = await DB.prepare(
    'INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg) VALUES (?,?,?,?,?,?)'
  ).bind(userId, packageKey, pkg.credits, pkg.amount, 'USD', 'stripe').run()
  const chargeId = r.meta.last_row_id as number
  const serviceUrl = c.env.SERVICE_URL || 'http://localhost:3000'

  try {
    const params = new URLSearchParams({
      'payment_method_types[]':                           'card',
      'line_items[0][price_data][currency]':              'usd',
      'line_items[0][price_data][unit_amount]':           String(pkg.amount),
      'line_items[0][price_data][product_data][name]':    `${pkg.label} — ${pkg.credits} Credits`,
      'line_items[0][quantity]':                          '1',
      'mode':                                             'payment',
      'customer_email':                                   user.email,
      'metadata[userId]':                                 String(userId),
      'metadata[packageKey]':                             packageKey,
      'metadata[chargeId]':                               String(chargeId),
      'payment_intent_data[metadata][userId]':            String(userId),
      'payment_intent_data[metadata][packageKey]':        packageKey,
      'payment_intent_data[metadata][chargeId]':          String(chargeId),
      'success_url':                                      `${serviceUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url':                                       `${serviceUrl}/?payment=cancel`,
    })

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + stripeKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    })

    if (!sessionRes.ok) {
      const err = await sessionRes.json() as { error: { message: string } }
      console.error('[Stripe] 세션 생성 실패:', err)   // 기술 상세는 서버 로그로만
      return c.json({ success: false, error: 'Could not start the payment. Please try again in a moment.' }, 502)
    }

    const session = await sessionRes.json() as { id: string; url: string }
    console.log('[Stripe] Checkout 세션 생성:', session.id)
    return c.json({ success: true, data: { checkoutUrl: session.url, sessionId: session.id, chargeId } })

  } catch (e) {
    console.error('[Stripe] 세션 생성 오류:', e)
    return c.json({ success: false, error: '결제 세션 생성 실패' }, 500)
  }
})

// Stripe 결제 완료 후 잔액 확인 (프론트가 success_url 도달 후 호출)
app.get('/api/payment/stripe/verify', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const user = await DB.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
  return c.json({ success: true, data: { credits: user?.credits ?? 0 } })
})

// ============================================================
// 이메일 발송 (Resend API)
// ============================================================
async function sendEmail(env: Bindings, to: string, subject: string, html: string): Promise<boolean> {
  const key = env.RESEND_API_KEY
  if (!key) { console.warn('[Email] RESEND_API_KEY 미설정'); return false }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      // 발신자: RESEND_FROM_EMAIL 환경변수 없으면 기본값 사용
      // wrangler secret put RESEND_FROM_EMAIL 으로 등록 (예: noreply@your-domain.com)
      body:    JSON.stringify({
        from: (env as unknown as Record<string,string>).RESEND_FROM_EMAIL || '마음풀 <noreply@maumful.com>',
        to: [to], subject, html
      }),
    })
    if (!res.ok) { console.error('[Email] 오류:', await res.text()); return false }
    return true
  } catch (e) { console.error('[Email] 발송 실패:', e); return false }
}

async function sendVerifyEmail(env: Bindings, to: string, nickname: string, token: string): Promise<void> {
  const url  = `${env.SERVICE_URL || 'http://localhost:3000'}/api/auth/verify/${token}`
  const name = nickname || to.split('@')[0]
  await sendEmail(env, to, '마음풀 — 이메일 인증',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">🌿 마음풀</h2>
      <p>안녕하세요 <strong>${name}</strong>님,</p>
      <p>아래 버튼을 눌러 이메일 인증을 완료해주세요. <em>(6시간 이내)</em></p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">이메일 인증하기</a>
      <p style="color:#999;font-size:12px">버튼이 작동하지 않으면: ${url}</p>
    </div>`
  )
}

async function sendPasswordResetEmail(env: Bindings, to: string, nickname: string, token: string): Promise<void> {
  const url  = `${env.SERVICE_URL || 'http://localhost:3000'}/?reset_token=${token}`
  const name = nickname || to.split('@')[0]
  await sendEmail(env, to, '마음풀 — 비밀번호 재설정',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">🌿 마음풀</h2>
      <p>안녕하세요 <strong>${name}</strong>님, 비밀번호 재설정 링크입니다. <em>(1시간 이내)</em></p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">비밀번호 재설정</a>
      <p style="color:#999;font-size:12px">본인이 요청하지 않았다면 무시하세요.</p>
    </div>`
  )
}

async function sendReceiptEmail(env: Bindings, to: string, nickname: string, credits: number, amount: number, currency: string, txId: string): Promise<void> {
  const amountStr = currency === 'KRW' ? `₩${amount.toLocaleString()}` : `$${(amount / 100).toFixed(2)}`
  const name = nickname || to.split('@')[0]
  await sendEmail(env, to, '마음풀 — 크레딧 충전 완료',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">🌿 마음풀</h2>
      <p>안녕하세요 <strong>${name}</strong>님, 크레딧 충전이 완료되었습니다!</p>
      <div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:16px 0">
        <p style="margin:4px 0">✦ 충전 크레딧: <strong>${credits}개</strong></p>
        <p style="margin:4px 0">💳 결제 금액: <strong>${amountStr}</strong></p>
        <p style="margin:4px 0;color:#aaa;font-size:12px">거래 ID: ${txId}</p>
      </div>
      <p style="color:#999;font-size:12px">문의: support@maumful.kr</p>
    </div>`
  )
}

// ============================================================
// 기존 인증 API에 이메일 발송 연결 (register / forgot-password)
// ── 이미 register/forgot-password API가 위에 구현되어 있으므로
//    이메일 함수는 해당 핸들러 내에서 직접 호출
// ============================================================

// 멤버십 플랜 오픈 알림 신청 (KV 저장)
app.post('/api/credits/notify-plan', async (c) => {
  const { KV } = c.env
  try {
    const { plan, email } = await c.req.json()
    if (!plan || !email) return c.json({ success: false }, 400)
    const key = `plan_notify:${email.toLowerCase()}`
    const existing = await KV.get(key)
    const list: string[] = existing ? JSON.parse(existing) : []
    if (!list.includes(plan)) list.push(plan)
    await KV.put(key, JSON.stringify(list), { expirationTtl: 90 * 86400 })
    return c.json({ success: true })
  } catch { return c.json({ success: false }) }
})

// prepare-charge (기존 → 금액 포함으로 업그레이드)
app.post('/api/credits/prepare-charge', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const { packageKey, pg } = await c.req.json()
  const pkg = PACKAGES[packageKey]; if (!pkg) return c.json({ success: false, error: '잘못된 패키지' }, 400)

  // 유저의 유입 파트너 코드 승계
  const userRow = await DB.prepare('SELECT partner_code FROM users WHERE id=?').bind(userId).first<{ partner_code: string | null }>()
  const partnerCode = userRow?.partner_code ?? null

  const r = await DB.prepare('INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg,partner_code) VALUES (?,?,?,?,?,?,?)')
    .bind(userId, packageKey, pkg.credits, pkg.amount, pg === 'stripe' ? 'USD' : 'KRW', pg, partnerCode).run()
  return c.json({ success: true, data: { chargeId: r.meta.last_row_id, credits: pkg.credits, amount: pkg.amount } })
})

// ============================================================
// 관리자 API 미들웨어 — ADMIN_SECRET 헤더 검증
// ============================================================
// 호출 방법: Authorization: Bearer <ADMIN_SECRET 값>
// wrangler secret put ADMIN_SECRET 으로 등록
function requireAdmin(c: { req: { header: (k: string) => string | undefined }, env: Bindings }) {
  const adminSecret = c.env.ADMIN_SECRET
  if (!adminSecret) {
    console.error('[Admin] ADMIN_SECRET 미설정 — 접근 차단')
    return 'ADMIN_SECRET_NOT_SET'
  }
  const auth = c.req.header('Authorization') ?? ''
  if (auth !== 'Bearer ' + adminSecret) return 'Unauthorized'
  return null // 통과
}


// ============================================================
// 친구 초대 API
// ============================================================

// 내 초대 코드 조회 (없으면 자동 생성)
app.get('/api/referral/code', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  // KV에서 기존 코드 조회
  const kvKey = `referral_code:${userId}`
  let code = await KV.get(kvKey)

  if (!code) {
    // 없으면 생성 (userId + 랜덤 6자)
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
    code = `PSY${userId}${rand}`
    await KV.put(kvKey, code)               // 만료 없이 영구 보관
    await KV.put(`referral_user:${code}`, String(userId))  // 역방향 조회
  }

  // 초대 통계
  const stats = await DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'completed' THEN referrer_bonus ELSE 0 END) AS earned
    FROM referrals WHERE referrer_id = ?
  `).bind(userId).first<{ total: number; completed: number; earned: number }>()

  const serviceUrl = (c.env as unknown as Record<string,string>).SERVICE_URL || 'http://localhost:3000'

  return c.json({
    success: true,
    data: {
      code,
      inviteUrl: `${serviceUrl}/?ref=${code}`,
      stats: {
        totalInvited:    stats?.total ?? 0,
        completed:       stats?.completed ?? 0,
        totalEarned:     stats?.earned ?? 0,
      },
      rewards: {
        referrerBonus: 30,   // 피초대자 첫 결제 완료 시 지급
        refereeBonus:  10,   // 초대 링크로 가입 시 즉시 지급
      },
    },
  })
})

// 초대 코드로 가입 처리 (회원가입 API 완료 후 별도 호출)
// 흐름: 가입 완료 → POST /api/referral/apply { code }
//      → referee +10 크레딧 즉시 지급
//      → referrals 테이블에 pending 레코드 생성
//      → 피초대자 첫 결제 완료(Webhook) 시 referrer +30 크레딧
app.post('/api/referral/apply', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const { code } = await c.req.json()
  if (!code) return c.json({ success: false, error: '초대 코드가 필요합니다.' }, 400)

  // 이미 초대 적용 여부 확인
  const alreadyApplied = await DB.prepare('SELECT id FROM referrals WHERE referee_id = ?').bind(userId).first()
  if (alreadyApplied) return c.json({ success: false, error: '이미 초대 코드를 적용했습니다.' }, 409)

  // 초대자 조회
  const referrerIdStr = await KV.get(`referral_user:${code.toUpperCase()}`)
  if (!referrerIdStr) return c.json({ success: false, error: '유효하지 않은 초대 코드입니다.' }, 404)

  const referrerId = parseInt(referrerIdStr)
  if (referrerId === userId) return c.json({ success: false, error: '본인의 초대 코드는 사용할 수 없습니다.' }, 400)

  // referrals 레코드 생성
  await DB.prepare(
    'INSERT INTO referrals (referrer_id, referee_id, referrer_bonus, referee_bonus, status) VALUES (?,?,30,10,"pending")'
  ).bind(referrerId, userId).run()

  // 피초대자 +10 크레딧 즉시 지급
  const newBalance = await gainCredits(DB, userId, 10, 'referral', code)

  return c.json({
    success: true,
    message: '초대 코드 적용 완료! 10 크레딧이 지급되었습니다.',
    data: { credits: 10, balance: newBalance },
  })
})

// 초대 완료 처리 — 피초대자 첫 결제 시 호출 (Webhook 내부에서 사용)
async function completeReferral(db: D1Database, refereeId: number): Promise<void> {
  const ref = await db.prepare(
    'SELECT id, referrer_id, referrer_bonus FROM referrals WHERE referee_id = ? AND status = "pending"'
  ).bind(refereeId).first<{ id: number; referrer_id: number; referrer_bonus: number }>()

  if (!ref) return

  await db.prepare('UPDATE referrals SET status = "completed" WHERE id = ?').bind(ref.id).run()
  await gainCredits(db, ref.referrer_id, ref.referrer_bonus, 'referral', `referee_${refereeId}`)
}

// ── 파트너(제휴코드) 수익 쉐어 적립 — 완료된 charge를 원장(partner_commissions)에 기록 ──
//   ⚠️ 비차단(호출부에서 .catch) — 절대 결제 흐름을 막지 않는다. charge_id PK로 멱등(success+webhook 중복 방지).
//   율은 **적립 시점 스냅샷**(partners.revenue_share_rate가 나중에 바뀌어도 과거 정산 불변).
//   귀속 기간(commission_start/end)이 설정돼 있으면 그 안의 결제만 적립. 개인 친구초대(referrals·크레딧)와는 별개.
async function accruePartnerCommission(db: D1Database, chargeId: number): Promise<void> {
  const ch = await db.prepare(
    "SELECT id, user_id, amount, currency, partner_code, status, date(COALESCE(completed_at, created_at)) AS cday FROM credit_charges WHERE id=?"
  ).bind(chargeId).first<{ id: number; user_id: number; amount: number; currency: string | null; partner_code: string | null; status: string; cday: string | null }>()
  if (!ch || ch.status !== 'completed' || !ch.partner_code) return
  const p = await db.prepare("SELECT revenue_share_rate, commission_start, commission_end, is_active FROM partners WHERE code=?")
    .bind(ch.partner_code).first<{ revenue_share_rate: number; commission_start: string | null; commission_end: string | null; is_active: number }>()
  if (!p || !p.is_active || !p.revenue_share_rate || p.revenue_share_rate <= 0) return
  const day = ch.cday || new Date().toISOString().slice(0, 10)
  if (p.commission_start && day < p.commission_start) return   // 귀속 기간 밖
  if (p.commission_end && day > p.commission_end) return
  const rate = p.revenue_share_rate
  const share = Math.round(ch.amount * rate)
  await db.prepare("INSERT OR IGNORE INTO partner_commissions (charge_id, partner_code, user_id, charge_amount, rate, share_amount, currency) VALUES (?,?,?,?,?,?,?)")
    .bind(ch.id, ch.partner_code, ch.user_id, ch.amount, rate, share, ch.currency || 'KRW').run()
}
// 환불 시 원장 회수 — 이미 정산(지급)된 건은 건드리지 않는다(수기 조정).
async function reversePartnerCommission(db: D1Database, chargeId: number): Promise<void> {
  await db.prepare("UPDATE partner_commissions SET status='reversed' WHERE charge_id=? AND status!='settled'").bind(chargeId).run()
}

// 내 초대 목록 조회
app.get('/api/referral/list', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  const list = await DB.prepare(`
    SELECT
      r.id, r.status, r.referrer_bonus, r.referee_bonus, r.created_at,
      u.nickname AS referee_nickname,
      SUBSTR(u.email, 1, 3) || '***' AS referee_email_masked
    FROM referrals r
    JOIN users u ON u.id = r.referee_id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(userId).all()

  return c.json({ success: true, data: list.results })
})

// ============================================================
// 관리자 통계 대시보드 API
// ============================================================

// 공통 관리자 인증 래퍼
function adminGuard(c: Parameters<typeof requireAdmin>[0]): string | null {
  if (!isAdminIp(c)) return 'Forbidden'
  return requireAdmin(c)
}

// ── 공지사항 ─────────────────────────────────────────────
// 공개 조회(비로그인 허용). 발행된 것만 최신순. 테이블이 없어도 빈 목록으로 응답해 기존 화면에 영향 없음.
app.get('/api/notices', async (c) => {
  const { DB } = c.env
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10) || 50, 100)
  try {
    const rows = await DB.prepare(
      'SELECT id, title, content, is_important, created_at FROM notices WHERE is_published=1 ORDER BY is_important DESC, created_at DESC LIMIT ?'
    ).bind(limit).all()
    return c.json({ success: true, data: rows.results ?? [] })
  } catch {
    return c.json({ success: true, data: [] })
  }
})

// 어드민 CRUD
app.get('/api/admin/notices', async (c) => {
  const denied = adminGuard(c); if (denied) return c.json({ success: false, error: denied }, 403)
  const { DB } = c.env
  try {
    const rows = await DB.prepare(
      'SELECT id, title, content, is_important, is_published, created_at, updated_at FROM notices ORDER BY created_at DESC LIMIT 200'
    ).all()
    return c.json({ success: true, data: rows.results ?? [] })
  } catch {
    return c.json({ success: false, error: '공지 테이블이 없습니다. 마이그레이션 0026을 적용해 주세요.' }, 500)
  }
})

app.post('/api/admin/notices', async (c) => {
  const denied = adminGuard(c); if (denied) return c.json({ success: false, error: denied }, 403)
  const { DB } = c.env
  let b: { title?: string; content?: string; is_important?: boolean; is_published?: boolean }
  try { b = await c.req.json() } catch { return c.json({ success: false, error: '잘못된 요청' }, 400) }
  const title = (b.title || '').trim()
  const content = (b.content || '').trim()
  if (!title || !content) return c.json({ success: false, error: '제목과 내용을 입력해 주세요.' }, 400)
  if (title.length > 200) return c.json({ success: false, error: '제목은 200자 이내로 입력해 주세요.' }, 400)
  const r = await DB.prepare(
    'INSERT INTO notices (title, content, is_important, is_published) VALUES (?, ?, ?, ?)'
  ).bind(title, content, b.is_important ? 1 : 0, b.is_published === false ? 0 : 1).run()
  return c.json({ success: true, id: r.meta?.last_row_id })
})

app.put('/api/admin/notices/:id', async (c) => {
  const denied = adminGuard(c); if (denied) return c.json({ success: false, error: denied }, 403)
  const { DB } = c.env
  const id = parseInt(c.req.param('id'), 10)
  if (!id) return c.json({ success: false, error: '잘못된 id' }, 400)
  let b: { title?: string; content?: string; is_important?: boolean; is_published?: boolean }
  try { b = await c.req.json() } catch { return c.json({ success: false, error: '잘못된 요청' }, 400) }
  const title = (b.title || '').trim()
  const content = (b.content || '').trim()
  if (!title || !content) return c.json({ success: false, error: '제목과 내용을 입력해 주세요.' }, 400)
  await DB.prepare(
    'UPDATE notices SET title=?, content=?, is_important=?, is_published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(title, content, b.is_important ? 1 : 0, b.is_published === false ? 0 : 1, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/notices/:id', async (c) => {
  const denied = adminGuard(c); if (denied) return c.json({ success: false, error: denied }, 403)
  const { DB } = c.env
  const id = parseInt(c.req.param('id'), 10)
  if (!id) return c.json({ success: false, error: '잘못된 id' }, 400)
  await DB.prepare('DELETE FROM notices WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

// ── 클라이언트 에러 로그 수집 ────────────────────────────
app.post('/api/debug/client-error', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ ok: false }, 401)

  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { return c.json({ ok: false }, 400) }

  const key = `client_err:${userId}:${Date.now()}`
  await KV.put(key, JSON.stringify({ userId, ...body }), { expirationTtl: 86400 * 7 })
  return c.json({ ok: true })
})

// ── 클라이언트 에러 로그 조회 (마스터 전용) ──────────────
app.get('/api/debug/client-errors', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: 'unauthorized' }, 401)

  const user = await DB.prepare('SELECT email FROM users WHERE id=?').bind(userId).first<{ email: string }>()
  if (!isMasterAccount(user?.email)) return c.json({ error: 'forbidden' }, 403)

  const { prefix } = c.req.query() as { prefix?: string }
  const listResult = await KV.list({ prefix: prefix || 'client_err:', limit: 200 })
  const errors = (await Promise.all(
    listResult.keys.map(k => KV.get(k.name, 'json').catch(() => null))
  )).filter(Boolean).reverse()

  return c.json({ errors, total: errors.length })
})

// GET /api/admin/stats — 핵심 KPI 요약
app.get('/api/admin/stats', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  try {
    const now       = new Date()
    const today     = now.toISOString().slice(0, 10)             // YYYY-MM-DD
    const month1st  = now.toISOString().slice(0, 7) + '-01'     // 이번 달 1일

    const [users, activeToday, newThisMonth, credits, tests, chats, charges, referrals] = await DB.batch([
      // 전체 회원 수
      DB.prepare('SELECT COUNT(*) AS cnt FROM users WHERE email NOT LIKE "deleted_%"'),
      // 오늘 로그인 (credit_transactions 기준)
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS cnt FROM credit_transactions WHERE DATE(created_at) = ?`).bind(today),
      // 이번 달 신규 가입 (+ 오늘 신규)
      DB.prepare(`SELECT COUNT(*) AS cnt, SUM(CASE WHEN DATE(created_at)=? THEN 1 ELSE 0 END) AS today FROM users WHERE created_at >= ? AND email NOT LIKE "deleted_%"`).bind(today, month1st),
      // 전체 발행 크레딧 합계 (gain)
      DB.prepare(`SELECT COALESCE(SUM(amount),0) AS total, COALESCE(SUM(CASE WHEN reason='charge' THEN amount ELSE 0 END),0) AS paid FROM credit_transactions WHERE type='gain'`),
      // 검사 수행 수 (전체 / 오늘)
      DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN DATE(performed_at)=? THEN 1 ELSE 0 END) AS today FROM test_history`).bind(today),
      // AI 채팅 수 (전체 / 오늘)
      DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN DATE(created_at)=? THEN 1 ELSE 0 END) AS today FROM chat_sessions`).bind(today),
      // 결제 완료 (이번 달)
      DB.prepare(`SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS revenue FROM credit_charges WHERE status='completed' AND created_at >= ?`).bind(month1st),
      // 친구 초대 완료 수
      DB.prepare(`SELECT COUNT(*) AS cnt FROM referrals WHERE status='completed'`),
    ])

    const u  = (users.results[0]  as Record<string,number>)
    const at = (activeToday.results[0] as Record<string,number>)
    const nm = (newThisMonth.results[0] as Record<string,number>)
    const cr = (credits.results[0] as Record<string,number>)
    const te = (tests.results[0]  as Record<string,number>)
    const ch = (chats.results[0]  as Record<string,number>)
    const pg = (charges.results[0] as Record<string,number>)
    const rf = (referrals.results[0] as Record<string,number>)

    return c.json({
      success: true,
      data: {
        users: {
          total:       u?.cnt ?? 0,
          today:       nm?.today ?? 0,
          activeToday: at?.cnt ?? 0,
          newThisMonth: nm?.cnt ?? 0,
        },
        credits: {
          totalIssued:  cr?.total ?? 0,
          totalPaid:    cr?.paid ?? 0,
        },
        tests: {
          total: te?.total ?? 0,
          today: te?.today ?? 0,
        },
        chats: {
          total: ch?.total ?? 0,
          today: ch?.today ?? 0,
        },
        revenue: {
          thisMonthCount:   pg?.cnt ?? 0,
          thisMonthAmount:  pg?.revenue ?? 0,
        },
        referrals: {
          completed: rf?.cnt ?? 0,
        },
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// GET /api/admin/stats/daily?days=30 — 일별 추이
app.get('/api/admin/stats/daily', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const days = Math.min(parseInt(c.req.query('days') || '30'), 90)

  try {
    const [signups, tests, chats, revenue] = await DB.batch([
      DB.prepare(`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM users WHERE created_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(performed_at) AS day, COUNT(*) AS cnt
        FROM test_history WHERE performed_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM chat_sessions WHERE created_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(completed_at) AS day,
               COUNT(*) AS cnt,
               COALESCE(SUM(amount),0) AS amount
        FROM credit_charges
        WHERE status='completed' AND completed_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
    ])

    return c.json({
      success: true,
      data: {
        signups:  signups.results,
        tests:    tests.results,
        chats:    chats.results,
        revenue:  revenue.results,
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// GET /api/admin/stats/tests — 검사 유형별 통계
app.get('/api/admin/stats/tests', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  try {
    const result = await DB.prepare(`
      SELECT test_type, lang,
             COUNT(*) AS cnt,
             COALESCE(SUM(credits_spent),0) AS credits
      FROM test_history
      GROUP BY test_type, lang
      ORDER BY cnt DESC
    `).all()

    return c.json({ success: true, data: result.results })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// GET /api/admin/loop-metrics?days=30 — 검사 ↔ 게임 루프 퍼널
// "검사를 한 사람이 게임까지 가는가", "게임을 한 사람이 검사로 돌아오는가"를 본다.
app.get('/api/admin/loop-metrics', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const days = Math.min(180, Math.max(7, Number(c.req.query('days') || 30)))
  const since = `-${days} days`

  try {
    const [tested, reportViews, rxClicks, played, sugViews, sugClicks, rxByGame, sugByTest] = await DB.batch([
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM test_history WHERE performed_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM loop_events WHERE event='report_view' AND created_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM loop_events WHERE event='rx_click' AND created_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM game_session_logs WHERE created_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM loop_events WHERE event='suggestion_view' AND created_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM loop_events WHERE event='suggestion_click' AND created_at >= date('now', ?)`).bind(since),
      DB.prepare(`SELECT meta, COUNT(*) AS c FROM loop_events WHERE event='rx_click' AND created_at >= date('now', ?) GROUP BY meta ORDER BY c DESC`).bind(since),
      DB.prepare(`SELECT meta, COUNT(*) AS c FROM loop_events WHERE event='suggestion_click' AND created_at >= date('now', ?) GROUP BY meta ORDER BY c DESC`).bind(since),
    ])

    // 루프가 실제로 닫혔는가 — 제안을 누른 뒤 그 검사를 실제로 완료한 사람 수
    const closed = await DB.prepare(`
      SELECT COUNT(DISTINCT e.user_id) AS c
      FROM loop_events e
      JOIN test_history t
        ON t.user_id = e.user_id AND t.test_type = e.meta AND t.performed_at > e.created_at
      WHERE e.event='suggestion_click' AND e.created_at >= date('now', ?)
    `).bind(since).first<{ c: number }>()

    const n = (r: D1Result) => ((r.results?.[0] as { c: number } | undefined)?.c ?? 0)
    return c.json({
      success: true,
      data: {
        days,
        forward: {   // ③ 검사 → 게임
          tested: n(tested), reportView: n(reportViews), rxClick: n(rxClicks), played: n(played),
          byGame: rxByGame.results ?? [],
        },
        reverse: {   // ⑥ 게임 → 검사
          played: n(played), suggestionView: n(sugViews), suggestionClick: n(sugClicks),
          testCompleted: closed?.c ?? 0,
          byTest: sugByTest.results ?? [],
        },
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// GET /api/admin/users?page=1&limit=20&search=email — 회원 목록
app.get('/api/admin/users', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const page   = Math.max(1, parseInt(c.req.query('page')  || '1'))
  const limit  = Math.min(50, parseInt(c.req.query('limit') || '20'))
  const search = (c.req.query('search') || '').trim()
  const offset = (page - 1) * limit

  try {
    const whereClause = search
      ? `WHERE (u.email LIKE ? OR u.nickname LIKE ?) AND u.email NOT LIKE 'deleted_%'`
      : `WHERE u.email NOT LIKE 'deleted_%'`
    const bindParams: unknown[] = search
      ? [`%${search}%`, `%${search}%`, limit, offset]
      : [limit, offset]

    const [countResult, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) AS cnt FROM users u ${whereClause}`)
        .bind(...(search ? [`%${search}%`, `%${search}%`] : [])),
      DB.prepare(`
        SELECT
          u.id, u.email, u.nickname, u.locale, u.country_code,
          u.credits, u.is_email_verified, u.social_provider, u.created_at,
          (SELECT COUNT(*) FROM test_history th WHERE th.user_id = u.id) AS test_count,
          (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.user_id = u.id) AS chat_count,
          (SELECT COALESCE(SUM(amount),0) FROM credit_charges cc WHERE cc.user_id = u.id AND cc.status='completed') AS total_paid
        FROM users u
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindParams),
    ])

    const total = (countResult.results[0] as Record<string,number>)?.cnt ?? 0

    return c.json({
      success: true,
      data: {
        users:      rows.results,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// POST /api/admin/users/:id/credits — 크레딧 수동 지급/회수
app.post('/api/admin/users/:id/credits', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const userId = parseInt(c.req.param('id'))
  const { amount, reason = 'admin_grant', type = 'gain' } = await c.req.json()

  if (!amount || amount <= 0) return c.json({ success: false, error: '금액은 1 이상이어야 합니다.' }, 400)
  if (!['gain', 'spend'].includes(type)) return c.json({ success: false, error: 'type은 gain 또는 spend' }, 400)

  try {
    const user = await DB.prepare('SELECT id, credits, email FROM users WHERE id = ?').bind(userId).first<{ id:number; credits:number; email:string }>()
    if (!user) return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404)

    let newBalance: number
    if (type === 'gain') {
      newBalance = await gainCredits(DB, userId, amount, reason)
    } else {
      const result = await spendCredits(DB, userId, amount, reason)
      if (!result.ok) return c.json({ success: false, error: result.error || '차감 실패', balance: result.balance }, 400)
      newBalance = result.balance
    }

    return c.json({
      success: true,
      message: `${user.email} — ${type === 'gain' ? '+' : '-'}${amount} 크레딧 처리 완료`,
      data: { userId, newBalance },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// GET /api/admin/payments?page=1 — 결제 내역
app.get('/api/admin/payments', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const page  = Math.max(1, parseInt(c.req.query('page')  || '1'))
  const limit = Math.min(50, parseInt(c.req.query('limit') || '20'))
  const offset = (page - 1) * limit

  try {
    const [countResult, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) AS cnt FROM credit_charges`),
      DB.prepare(`
        SELECT cc.*, u.email, u.nickname
        FROM credit_charges cc
        JOIN users u ON u.id = cc.user_id
        ORDER BY cc.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset),
    ])

    const total = (countResult.results[0] as Record<string,number>)?.cnt ?? 0

    return c.json({
      success: true,
      data: {
        payments:   rows.results,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500)
  }
})

// ── 관리자 환불 처리 ─────────────────────────────────────────
app.post('/api/admin/payments/:id/refund', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const chargeId = parseInt(c.req.param('id'))
  if (!chargeId) return c.json({ success: false, error: '유효하지 않은 chargeId' }, 400)

  const charge = await DB.prepare(
    `SELECT id, user_id, credits, amount, currency, status, package_key FROM credit_charges WHERE id=?`
  ).bind(chargeId).first<{ id:number; user_id:number; credits:number; amount:number; currency:string; status:string; package_key:string }>()

  if (!charge) return c.json({ success: false, error: '결제 내역 없음' }, 404)
  if (charge.status !== 'completed') return c.json({ success: false, error: `환불 불가 — 현재 상태: ${charge.status}` }, 400)

  // ⚠️ 원자적 선점(completed→refunded) — 동시요청·더블클릭 시 이중 회수 방지(고객 환불과 동일 패턴).
  const claim = await DB.prepare("UPDATE credit_charges SET status='refunded', completed_at=CURRENT_TIMESTAMP WHERE id=? AND status='completed'").bind(chargeId).run()
  if (claim.meta.changes === 0) return c.json({ success: false, error: '이미 환불됐거나 환불 불가한 상태예요.' }, 409)

  // 크레딧 회수(잔액 가드). 이미 사용해 회수 못 하면 선점 롤백 + 경고(카드 환불 전에 반드시 확인).
  const claw = await DB.prepare('UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?').bind(charge.credits, charge.user_id, charge.credits).run()
  if (claw.meta.changes === 0) {
    await DB.prepare("UPDATE credit_charges SET status='completed' WHERE id=? AND status='refunded'").bind(chargeId).run()
    return c.json({ success: false, error: `⚠️ 크레딧이 이미 사용되어 자동 회수할 수 없어요(잔액 부족). 카드 환불 전에 수동 확인이 필요합니다.` }, 400)
  }
  await DB.prepare('INSERT INTO credit_transactions (user_id, type, amount, reason, balance_after, ref_id) VALUES (?,?,?,?,(SELECT credits FROM users WHERE id=?),?)')
    .bind(charge.user_id, 'spend', charge.credits, 'admin_refund', charge.user_id, chargeId).run()
  reversePartnerCommission(DB, chargeId).catch(() => {})

  // phyweb 이용권 상품이면 phyweb 코드도 void(관리자 환불+수동 카드환불 후 코드가 살아있지 않도록). best-effort.
  const admPkg = PACKAGES[charge.package_key]
  if (admPkg?.service === 'phyweb') {
    const ssoSecret = (c.env as any).MAUM_SSO_SECRET
    if (ssoSecret) {
      try {
        const token = await signSso(ssoSecret, { service: 'phyweb', grantType: admPkg.grantType, orderId: `mf_charge_${chargeId}`, exp: Math.floor(Date.now() / 1000) + 300 })
        const rv = await fetch('https://phyweb.pages.dev/api/grant/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
        if (!rv.ok) console.error('[Admin Refund phyweb] revoke 비정상(등록됨일 수 있음):', rv.status, chargeId)
      } catch (e) { console.error('[Admin Refund phyweb] revoke 오류:', e, chargeId) }
    }
    return c.json({ success: true, message: `phyweb 이용권 환불 처리 — 코드 void 시도 완료. ⚠️ 카드 환불은 토스 상점관리자에서 직접 취소하세요(${charge.amount.toLocaleString()} ${charge.currency}).` })
  }

  return c.json({ success: true, message: `크레딧 회수 완료 — ${charge.credits}cr. ⚠️ 카드 환불은 토스 상점관리자에서 직접 취소하세요(${charge.amount.toLocaleString()} ${charge.currency}).` })
})

// ============================================================
// 관리자 API 설정
// ============================================================
app.get('/api/admin/api-settings', async (c) => {
  const { DB } = c.env
  if (!isAdminIp(c)) return c.json({ success: false, error: 'Forbidden' }, 403)
  const denied = requireAdmin(c)
  if (denied) return c.json({ success: false, error: denied }, 401)
  try {
    await DB.prepare('CREATE TABLE IF NOT EXISTS api_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key_name TEXT UNIQUE NOT NULL, key_value TEXT NOT NULL, is_active INTEGER DEFAULT 1, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run()
    const rows = await DB.prepare('SELECT id,key_name,is_active,description,created_at,updated_at FROM api_settings ORDER BY id').all()
    return c.json({ success: true, data: rows.results })
  } catch (e) { return c.json({ success: false, error: (e as Error).message }, 500) }
})

app.post('/api/admin/api-settings', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const { key_name, key_value, description } = await c.req.json()
  if (!key_name || !key_value) return c.json({ success: false, error: '키와 값 필수' }, 400)
  const secret = (c.env as unknown as Record<string, string>).ADMIN_SECRET
  if (!secret) return c.json({ success: false, error: 'ADMIN_SECRET 미설정' }, 500)
  const kB  = new TextEncoder().encode(secret.padEnd(32,'0').slice(0,32))
  const vB  = new TextEncoder().encode(key_value)
  const enc = btoa(String.fromCharCode(...vB.map((b,i) => b ^ kB[i % kB.length])))
  await DB.prepare('INSERT INTO api_settings (key_name,key_value,is_active,description,updated_at) VALUES (?,?,1,?,CURRENT_TIMESTAMP) ON CONFLICT(key_name) DO UPDATE SET key_value=excluded.key_value,is_active=1,description=excluded.description,updated_at=CURRENT_TIMESTAMP')
    .bind(key_name, enc, description ?? '').run()
  return c.json({ success: true, message: `${key_name} 저장됨` })
})

// GET /api/admin/test-ai?secret=XXXX — Anthropic 모델 진단 (브라우저 직접 접근용)
// GET /api/admin/error-logs — 최근 에러 로그 조회
app.get('/api/admin/error-logs', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const limit  = Math.min(100, parseInt(c.req.query('limit') || '50', 10))
  const service = c.req.query('service') // 필터: maumful | maumgame | maumcouple
  const rows = await DB.prepare(
    service
      ? `SELECT * FROM error_logs WHERE service=? ORDER BY created_at DESC LIMIT ?`
      : `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?`
  ).bind(...(service ? [service, limit] : [limit])).all()

  return c.json({ success: true, data: rows.results })
})

// DELETE /api/admin/error-logs — 에러 로그 전체 삭제
app.delete('/api/admin/error-logs', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  await DB.prepare('DELETE FROM error_logs').run()
  return c.json({ success: true })
})

app.get('/api/admin/test-ai', async (c) => {
  const { DB } = c.env
  const adminSecret = c.env.ADMIN_SECRET
  if (!adminSecret) return c.html('<h2 style="font-family:sans-serif;color:red">서버 설정 오류: ADMIN_SECRET 미설정</h2>', 500)
  const qSecret = c.req.query('secret') ?? ''
  if (qSecret !== adminSecret) {
    return c.html('<h2 style="font-family:sans-serif;color:red">접근 거부: secret 파라미터가 올바르지 않습니다.</h2>', 403)
  }

  const apiKey = await getAnthropicKey(DB, c.env)
  if (!apiKey) return c.html('<h2 style="font-family:sans-serif;color:red">Anthropic API 키가 설정되지 않았습니다.</h2>', 500)

  const candidates = [
    'claude-sonnet-4-6',
    'claude-opus-4-7',
    'claude-haiku-4-5-20251001',
    'claude-haiku-4-5',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307',
  ]
  const rows: string[] = []
  for (const model of candidates) {
    let status = ''
    let color = ''
    try {
      const r = await fetch(aiEndpoint(c.env), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }),
      })
      const body = await r.text().catch(() => '')
      if (r.ok) { status = '✅ 사용 가능'; color = '#16a34a' }
      else { status = `❌ ${r.status} — ${body.slice(0, 150)}`; color = '#dc2626' }
    } catch (e: unknown) {
      status = `⚠️ 오류: ${e instanceof Error ? e.message : String(e)}`; color = '#d97706'
    }
    rows.push(`<tr><td style="padding:8px 16px;font-weight:600">${model}</td><td style="padding:8px 16px;color:${color}">${status}</td></tr>`)
  }
  const current = getAiModel(c.env)
  return c.html(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>AI 모델 진단</title></head><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
<h2>🔍 Anthropic 모델 접근 진단</h2>
<p>현재 기본 모델: <strong style="color:#2563eb">${current}</strong></p>
<table border="1" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#e5e7eb">
<thead><tr style="background:#f3f4f6"><th style="padding:8px 16px;text-align:left">모델 ID</th><th style="padding:8px 16px;text-align:left">상태</th></tr></thead>
<tbody>${rows.join('')}</tbody></table>
<p style="margin-top:24px;color:#6b7280;font-size:14px">✅ 사용 가능 모델을 Cloudflare 대시보드 → Workers → Settings → Variables → <strong>AI_MODEL</strong> 에 등록하세요.</p>
</body></html>`)
})

// ============================================================
// 쿠폰 시스템 (크레딧 지급 쿠폰: 1회용 고유코드 + 공용 캠페인코드)
// 전부 신규 엔드포인트 — 기존 기능 무영향. gainCredits 재사용.
// ============================================================
function normalizeCoupon(s: unknown): string {
  return String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}
function genCouponCode(len = 10): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동문자 O,0,I,1 제외
  const buf = crypto.getRandomValues(new Uint8Array(len))
  let s = ''
  for (let i = 0; i < len; i++) s += A[buf[i] % A.length]
  return s
}
// 사용자: 쿠폰 등록(사용)
app.post('/api/coupon/redeem', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)

  // 무차별 대입 방지: 사용자+IP 분당 5회
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
  const rl = await checkRateLimit(KV, `coupon:${userId}:${ip}`, 5, 60)
  if (!rl.allowed) return c.json({ success: false, error: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429)

  const body = await c.req.json().catch(() => ({} as any))
  const code = normalizeCoupon(body.code)
  if (!code || code.length < 4) return c.json({ success: false, error: '쿠폰 코드를 입력해주세요.' }, 400)

  const cp = await DB.prepare('SELECT * FROM coupons WHERE code=?').bind(code).first<any>()
  if (!cp || cp.active !== 1) return c.json({ success: false, error: '유효하지 않은 쿠폰입니다.' }, 404)

  const nowIso = new Date().toISOString()
  if (cp.valid_from && nowIso < cp.valid_from) return c.json({ success: false, error: '아직 사용할 수 없는 쿠폰입니다.' }, 400)
  if (cp.valid_until && nowIso > cp.valid_until) return c.json({ success: false, error: '유효기간이 지난 쿠폰입니다.' }, 400)

  // 1인 1회 사전 체크 (최종 보장은 UNIQUE(code,user_id))
  const dup = await DB.prepare('SELECT 1 FROM coupon_redemptions WHERE code=? AND user_id=?').bind(code, userId).first()
  if (dup) return c.json({ success: false, error: '이미 등록한 쿠폰입니다.' }, 409)

  // 전체 한도 원자적 차감 (조건부 UPDATE)
  if (cp.max_redemptions != null) {
    const upd = await DB.prepare('UPDATE coupons SET redeemed_count = redeemed_count + 1 WHERE code=? AND redeemed_count < max_redemptions').bind(code).run()
    if (!((upd as any).meta?.changes)) return c.json({ success: false, error: '쿠폰이 모두 소진되었습니다.' }, 409)
  } else {
    await DB.prepare('UPDATE coupons SET redeemed_count = redeemed_count + 1 WHERE code=?').bind(code).run()
  }

  // 사용 기록 (동시중복 시 UNIQUE 위반 → 한도 롤백)
  try {
    await DB.prepare('INSERT INTO coupon_redemptions (code,user_id,credits_granted) VALUES (?,?,?)').bind(code, userId, cp.value).run()
  } catch {
    if (cp.max_redemptions != null) await DB.prepare('UPDATE coupons SET redeemed_count = redeemed_count - 1 WHERE code=?').bind(code).run()
    return c.json({ success: false, error: '이미 등록한 쿠폰입니다.' }, 409)
  }

  const balance = await gainCredits(DB, userId, cp.value, `coupon:${code}`, code)
  return c.json({ success: true, credits: cp.value, balance, message: `🎟️ ${cp.value} 크레딧이 지급되었습니다!` })
})

// 관리자: 쿠폰 발행 (관리자 패널 — adminGuard로 기존 admin과 동일 인증)
app.post('/api/admin/coupon/create', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const b = await c.req.json().catch(() => ({} as any))
  const value = parseInt(b.value, 10)
  if (!value || value < 1) return c.json({ success: false, error: '지급 크레딧(value)이 필요합니다.' }, 400)
  const source = (typeof b.source === 'string' ? b.source : '').slice(0, 80) || null
  const validUntil = typeof b.valid_until === 'string' && b.valid_until ? b.valid_until : null
  const batchId = 'B' + Date.now().toString(36).toUpperCase()
  const mode = b.mode === 'campaign' ? 'campaign' : 'single'

  if (mode === 'campaign') {
    const code = normalizeCoupon(b.code) || genCouponCode(8)
    const maxR = b.max_redemptions != null ? (parseInt(b.max_redemptions, 10) || null) : null
    try {
      await DB.prepare('INSERT INTO coupons (code,type,value,max_redemptions,valid_until,source,batch_id,created_by) VALUES (?,?,?,?,?,?,?,?)')
        .bind(code, 'credit', value, maxR, validUntil, source, batchId, null).run()
    } catch {
      return c.json({ success: false, error: '이미 존재하는 코드입니다. 다른 코드를 입력하세요.' }, 409)
    }
    return c.json({ success: true, mode, codes: [code], batchId })
  }

  // single: 1회용 고유코드 N개 일괄
  const count = Math.min(Math.max(parseInt(b.count, 10) || 1, 1), 1000)
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    for (let t = 0; t < 4; t++) {
      const code = genCouponCode(10)
      try {
        await DB.prepare('INSERT INTO coupons (code,type,value,max_redemptions,valid_until,source,batch_id,created_by) VALUES (?,?,?,1,?,?,?,?)')
          .bind(code, 'credit', value, validUntil, source, batchId, null).run()
        codes.push(code)
        break
      } catch { /* 코드 충돌 → 재생성 */ }
    }
  }
  return c.json({ success: true, mode, count: codes.length, codes, batchId })
})

// 관리자: 발행 배치 목록 / CSV 내보내기
app.get('/api/admin/coupon/list', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const batch = c.req.query('batch')
  if (c.req.query('csv') && batch) {
    const rows = await DB.prepare('SELECT code,value,redeemed_count,max_redemptions,source,valid_until,active FROM coupons WHERE batch_id=? ORDER BY code').bind(batch).all()
    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s   // CSV 이스케이프(쉼표·따옴표·줄바꿈)
    }
    const lines = ['code,value,redeemed,max,source,valid_until,active',
      ...(rows.results as any[]).map(r => [esc(r.code), r.value, r.redeemed_count, esc(r.max_redemptions), esc(r.source), esc(r.valid_until), r.active].join(','))]
    return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="coupons_${batch}.csv"` } })
  }

  const batches = await DB.prepare(
    `SELECT batch_id, MAX(source) source, MAX(value) value, COUNT(*) total,
            SUM(redeemed_count) redeemed, MIN(created_at) created_at, MAX(valid_until) valid_until
     FROM coupons GROUP BY batch_id ORDER BY created_at DESC LIMIT 100`
  ).all()
  return c.json({ success: true, batches: batches.results })
})

// ── TWA 도메인 인증 (Android 앱 연동) ─────────────────────
// SHA256 fingerprint는 Play Console 앱 서명 설정에서 확인 후 업데이트
app.get('/.well-known/assetlinks.json', (c) => {
  const links = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.maumful.app',
        sha256_cert_fingerprints: [
          'EA:98:3F:BC:39:E6:FE:EC:83:52:4C:43:6A:7F:0A:F5:CF:40:26:D6:FF:C4:62:0B:1E:19:77:D9:7B:6B:BC:91'
        ]
      }
    }
  ]
  return c.json(links, 200, { 'Content-Type': 'application/json' })
})

// ============================================================
// 제휴 진입 레이어 (/p) — 경량 페이지. partner_entry.js만 로드(코어 app.js 미로드).
// 흐름: ?p=코드&sso_token= → SSO 자동로그인 + config 전환화면 → 코어로 딥링크
// ============================================================
app.get('/p', (c) => {
  const v = Date.now()
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>마음풀 · 제휴 진입</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <meta name="theme-color" content="#2D6A4F">
  <link rel="stylesheet" href="/static/tailwind.css?v=${v}">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>body{margin:0;-webkit-font-smoothing:antialiased;word-break:keep-all}:focus-visible{outline:2px solid #2D6A4F;outline-offset:2px}</style>
</head>
<body>
  <div id="root"></div>
  <script src="/static/compiled/partner_entry.js?v=${v}"></script>
</body>
</html>`)
})

// 파트너 담당자 정산 포털 (독립 경량 페이지 · 코어 미로드)
app.get('/partner', (c) => {
  const v = Date.now()
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>마음풀 · 제휴 정산 포털</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <meta name="theme-color" content="#2D6A4F">
  <link rel="stylesheet" href="/static/tailwind.css?v=${v}">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>body{margin:0;-webkit-font-smoothing:antialiased;word-break:keep-all}:focus-visible{outline:2px solid #2D6A4F;outline-offset:2px}</style>
</head>
<body>
  <div id="root"></div>
  <script src="/static/compiled/partner_portal.js?v=${v}"></script>
</body>
</html>`)
})

// ============================================================
// 메인 페이지
// ============================================================
app.get('/', (c) => {
  const v = Date.now()
  const googleClientId  = c.env.GOOGLE_CLIENT_ID || ''
  const kakaoAppKey     = c.env.KAKAO_APP_KEY || ''
  const gaId            = c.env.GA_MEASUREMENT_ID || ''
  const naverKey        = c.env.NAVER_SITE_KEY || ''
  const naverClientId   = c.env.NAVER_CLIENT_ID || ''
  const siteUrl        = 'https://maumful.com'
  const res = c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>마음풀 — 온라인 심리검사 & AI 마음 상담</title>
  <meta name="description" content="PHQ-9·GAD-7·Big5 등 10종 심리검사를 무료로 시작하세요. AI 상담으로 내 마음을 더 깊이 이해하고, 제휴 상담사와 직접 연결됩니다.">
  <meta name="keywords" content="심리검사,PHQ-9,GAD-7,BIG5,우울자가진단,불안검사,번아웃,온라인심리상담,AI상담,마음건강">
  <meta name="robots" content="index, follow, noimageai">
  <link rel="canonical" href="${siteUrl}/">
  ${naverKey ? `<meta name="naver-site-verification" content="${naverKey}">` : ''}

  <!-- PWA -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2D6A4F">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="마음풀">
  <link rel="apple-touch-icon" href="/static/icon-192.png">

  <!-- Open Graph (SNS 공유) -->
  <meta property="og:title" content="마음풀 — 마음을 읽어 전하는 심리검사·관계 통역">
  <meta property="og:description" content="심리검사로 나를, 커플·부부·세대·아이의 마음은 관계 통역으로 읽어 전해요. 10종 심리검사·AI 상담 무료 시작.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/">
  <meta property="og:image" content="${siteUrl}/static/og-share.png?v=20260731">
  <meta property="og:image:width" content="1080">
  <meta property="og:image:height" content="1080">
  <meta property="og:image:alt" content="마음풀 — 마음의 무게를 가볍게">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="마음풀">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="마음풀 — 마음을 읽어 전하는 심리검사·관계 통역">
  <meta name="twitter:description" content="심리검사로 나를, 커플·부부·세대·아이의 마음은 관계 통역으로. 10종 무료 시작.">
  <meta name="twitter:image" content="${siteUrl}/static/og-share.png?v=20260731">

  <!-- JSON-LD 구조화 데이터 -->
  <script type="application/ld+json">{
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "마음풀",
        "url": "${siteUrl}",
        "logo": "${siteUrl}/static/icon-512.png",
        "description": "온라인 심리검사와 AI 마음 상담 서비스",
        "contactPoint": { "@type": "ContactPoint", "email": "support@maumful.com", "contactType": "customer support" }
      },
      {
        "@type": "WebApplication",
        "name": "마음풀",
        "url": "${siteUrl}",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "description": "PHQ-9·GAD-7·Big5 등 10종 심리검사와 AI 상담 서비스",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW", "description": "가입 즉시 20 크레딧 무료 지급" },
        "featureList": ["PHQ-9 우울 자가점검","GAD-7 불안 검사","BIG5 성격검사","DASS-21","번아웃 검사","AI 상담","제휴 상담사 연결"]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "심리검사 비용은 얼마인가요?", "acceptedAnswer": { "@type": "Answer", "text": "가입 즉시 20 크레딧이 무료 지급되며, PHQ-9·GAD-7·DASS-21은 무료로 이용할 수 있습니다." } },
          { "@type": "Question", "name": "검사 결과는 의료적 진단인가요?", "acceptedAnswer": { "@type": "Answer", "text": "검사 결과는 자기이해를 위한 참고 자료이며 의료적 진단을 대체하지 않습니다." } },
          { "@type": "Question", "name": "개인정보는 안전하게 보호되나요?", "acceptedAnswer": { "@type": "Answer", "text": "검사 데이터는 암호화하여 저장되며 제3자에게 제공하지 않습니다." } }
        ]
      }
    ]
  }</script>

  <!-- 폰트 프리로드 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/static/style.css?v=${v}">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <link rel="stylesheet" href="/static/tailwind.css?v=${v}">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- jsPDF: PDF 내보내기 전용, async 로드로 초기 렌더 블로킹 방지 -->
  <script async src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script async src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <!-- 토스페이먼츠 SDK (크레딧 결제) -->
  <script src="https://js.tosspayments.com/v1"></script>
  ${googleClientId ? `<script src="https://accounts.google.com/gsi/client" async defer></script>` : ''}
  <script>window.GOOGLE_CLIENT_ID = ${JSON.stringify(googleClientId)};</script>
  ${kakaoAppKey ? `<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" crossorigin="anonymous"></script>` : ''}
  <script>window.KAKAO_APP_KEY = ${JSON.stringify(kakaoAppKey)};</script>
  <script>window.NAVER_CLIENT_ID = ${JSON.stringify(naverClientId)};</script>
  ${gaId ? `
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});</script>` : ''}
</head>
<body>
  <div id="root">
    <!-- SEO 폴백: JS 미실행 크롤러용 핵심 콘텐츠 (React 마운트 시 대체됨) -->
    <noscript>
      <h1>마음풀 — 온라인 심리검사 & AI 마음 상담</h1>
      <p>PHQ-9·GAD-7·Big5 등 10종 심리검사를 무료로 시작하세요. AI 상담으로 내 마음을 더 깊이 이해하고, 제휴 상담사와 직접 연결됩니다.</p>
      <h2>주요 서비스</h2>
      <ul>
        <li>심리검사 — PHQ-9 우울 자가점검, GAD-7 불안 검사, DASS-21, Big5 성격검사, 번아웃 검사</li>
        <li>AI 마음 상담 — 검사 결과와 연동된 맞춤 대화로 마음을 돌봅니다</li>
        <li>전문 상담사 연결 — 화상·전화·대면 1:1 상담</li>
        <li>마음 게임 — 마음의 정원, 감정꽃 찾기 등 치유 게임</li>
        <li>마음커플 — BIG5 궁합 분석, AI 커플 리포트, 관계 건강도 체크인</li>
      </ul>
      <p>가입 즉시 20 크레딧 무료 지급. 위기 상황 시 자살예방상담전화 109 · 정신건강위기상담전화 1577-0199.</p>
    </noscript>
  </div>
  <!-- esbuild 사전 컴파일 JS (Babel standalone 불필요) -->
  <script src="/static/compiled/landing.js?v=${v}"></script>
  <script src="/static/compiled/counseling.js?v=${v}"></script>
  <script src="/static/compiled/counseling_admin.js?v=${v}"></script>
  <script src="/static/compiled/app.js?v=${v}"></script>
  <script>
    // ── 전역 에러 캡처 (화면보호 환경 대비) ──────────────
    window.__ERR_LOG = [];
    function __captureErr(type, msg, src, line, col, err) {
      var entry = {
        t: new Date().toISOString(),
        type: type,
        msg: String(msg).slice(0, 500),
        src: (src || '').replace(location.origin, ''),
        line: line, col: col,
        stack: err && err.stack ? String(err.stack).slice(0, 1000) : null,
        ua: navigator.userAgent.slice(0, 100)
      };
      window.__ERR_LOG.unshift(entry);
      if (window.__ERR_LOG.length > 100) window.__ERR_LOG.pop();
      // 백엔드 전송 (토큰 있을 때만, fire-and-forget)
      try {
        var tok = localStorage.getItem('access_token');
        if (tok) {
          fetch('/api/debug/client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
            body: JSON.stringify(entry)
          }).catch(function(){});
        }
      } catch(e) {}
    }
    window.onerror = function(msg, src, line, col, err) {
      __captureErr('error', msg, src, line, col, err);
      return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
      var reason = e.reason;
      __captureErr('promise', reason && reason.message ? reason.message : String(reason), '', 0, 0, reason instanceof Error ? reason : null);
    });
    // Service Worker 등록 (PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  </script>
</body>
</html>`)
  res.headers.set('X-Robots-Tag', 'noimageai')
  return res
})

// ============================================================
// 상담센터 API — /api/counseling/*
// ============================================================

// ── 헬퍼: Jitsi 룸 ID 생성 ───────────────────────────────
function genJitsiRoom(): string {
  const adj  = ['calm','safe','warm','clear','bright','gentle','quiet','still']
  const noun = ['forest','river','sky','garden','dawn','wave','leaf','path']
  const a = adj[Math.floor(Math.random() * adj.length)]
  const n = noun[Math.floor(Math.random() * noun.length)]
  const r = Math.random().toString(36).slice(2, 7)
  return `maumful-${a}-${n}-${r}`
}

// ── 예약 확정 이메일 ─────────────────────────────────────
async function sendAppointmentEmail(
  env: Bindings,
  to: string,
  nickname: string,
  opts: {
    counselorName: string
    centerName: string
    scheduledAt: string
    durationMin: number
    sessionType: string
    feeAmount: number
    videoUrl: string | null
  }
): Promise<void> {
  const typeLabel: Record<string, string> = { video: '화상 상담', phone: '전화 상담', visit: '방문 상담' }
  const feeStr = opts.feeAmount.toLocaleString('ko-KR') + '원'
  const dt     = new Date(opts.scheduledAt).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
  const name   = nickname || to.split('@')[0]
  const videoBlock = opts.videoUrl
    ? `<a href="${opts.videoUrl}" style="display:inline-block;margin:12px 0;padding:12px 28px;background:#2D6A4F;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">📹 화상 상담 입장하기</a>`
    : ''
  await sendEmail(env, to, `🌿 마음풀 — ${opts.counselorName} 상담사 예약 확정`,
    `<div style="font-family:'Noto Sans KR',sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#FAFAF8">
      <div style="background:#2D6A4F;color:white;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <h2 style="margin:0 0 4px;font-size:20px">🌿 마음풀 상담 예약 확정</h2>
        <p style="margin:0;opacity:.8;font-size:13px">아래 내용을 확인하세요</p>
      </div>
      <p>안녕하세요 <strong>${name}</strong>님,<br>상담 예약이 확정되었습니다.</p>
      <div style="background:white;border-radius:12px;padding:20px;margin:16px 0;border:1px solid rgba(0,0,0,.08)">
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:7px 0;color:#888">상담사</td><td style="font-weight:600">${opts.counselorName} · ${opts.centerName}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">일시</td><td style="border-top:1px solid #f0f0f0;font-weight:600">${dt}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">소요시간</td><td style="border-top:1px solid #f0f0f0">${opts.durationMin}분</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">유형</td><td style="border-top:1px solid #f0f0f0">${typeLabel[opts.sessionType] || opts.sessionType}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">결제금액</td><td style="border-top:1px solid #f0f0f0;font-weight:700;color:#2D6A4F">${feeStr}</td></tr>
        </table>
      </div>
      ${videoBlock}
      <p style="color:#888;font-size:12px;margin-top:24px">취소·변경: 상담 24시간 전까지 전액 환불 가능 · 문의: support@maumful.kr</p>
    </div>`
  )
}

// ── GET /api/counseling/centers ───────────────────────────
app.get('/api/counseling/centers', async (c) => {
  const { DB } = c.env
  const rows = await DB.prepare(
    'SELECT id,name,logo_emoji,description,address,specialty_tags,status,contact_email,contact_phone,commission_rate FROM counseling_centers ORDER BY id'
  ).all()
  return c.json({ success: true, data: rows.results })
})

// ── GET /api/nearby-counseling ────────────────────────────
app.get('/api/nearby-counseling', async (c) => {
  const lat = c.req.query('lat')
  const lng = c.req.query('lng')
  const radius = Number(c.req.query('radius') || 3000)
  if (!lat || !lng) return c.json({ error: 'Missing location' }, 400)
  const key = c.env.KAKAO_REST_API_KEY
  if (!key) return c.json({ error: 'Kakao key not configured' }, 500)
  const { DB } = c.env

  const [affiliatedRows] = await Promise.all([
    DB.prepare(
      `SELECT co.id, co.name, co.title, co.photo_emoji, co.fee_per_session, co.avg_rating, ce.name as center_name
       FROM counselors co LEFT JOIN counseling_centers ce ON co.center_id=ce.id
       WHERE co.status='active' ORDER BY co.avg_rating DESC LIMIT 5`
    ).all<any>(),
  ])

  const queries = ['정신건강의학과', '심리상담센터', '정신건강복지센터']
  const seen = new Set<string>()
  const external: any[] = []
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=5`,
        { headers: { Authorization: `KakaoAK ${key}` } }
      )
      if (!res.ok) continue
      const data: any = await res.json()
      for (const p of (data.documents || [])) {
        if (!seen.has(p.id)) { seen.add(p.id); external.push(p) }
      }
    } catch {}
  }
  external.sort((a, b) => Number(a.distance || 0) - Number(b.distance || 0))
  return c.json({ affiliated: affiliatedRows.results || [], external: external.slice(0, 15) })
})

// ── GET /api/counseling/counselors ────────────────────────
app.get('/api/counseling/counselors', async (c) => {
  const { DB } = c.env
  const centerId = c.req.query('centerId')
  const q = centerId
    ? 'SELECT co.*,ce.name as center_name FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.center_id=? AND co.status="active" ORDER BY co.avg_rating DESC'
    : 'SELECT co.*,ce.name as center_name FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.status="active" ORDER BY co.avg_rating DESC'
  const rows = centerId
    ? await DB.prepare(q).bind(parseInt(centerId)).all()
    : await DB.prepare(q).all()
  return c.json({ success: true, data: rows.results })
})

// ── GET /api/counseling/counselors/:id/slots ──────────────
app.get('/api/counseling/counselors/:id/slots', async (c) => {
  const { DB } = c.env
  const counselorId = parseInt(c.req.param('id'))
  const dateStr = c.req.query('date') // YYYY-MM-DD

  if (!dateStr) return c.json({ success: false, error: 'date 파라미터 필요' }, 400)

  const date = new Date(dateStr)
  const dow  = date.getDay()

  // 해당 요일 스케줄
  const schedule = await DB.prepare(
    'SELECT start_time,end_time,slot_minutes FROM counselor_schedules WHERE counselor_id=? AND day_of_week=?'
  ).bind(counselorId, dow).first<{ start_time: string; end_time: string; slot_minutes: number }>()

  if (!schedule) return c.json({ success: true, data: [] })

  // 해당 날짜 기존 예약
  const booked = await DB.prepare(
    'SELECT scheduled_at FROM appointments WHERE counselor_id=? AND DATE(scheduled_at)=? AND status NOT IN ("cancelled")'
  ).bind(counselorId, dateStr).all()
  const bookedTimes = new Set((booked.results as { scheduled_at: string }[]).map(r => r.scheduled_at.slice(11, 16)))

  // 슬롯 생성
  const slots: { time: string; available: boolean }[] = []
  const [sh, sm] = schedule.start_time.split(':').map(Number)
  const [eh, em] = schedule.end_time.split(':').map(Number)
  const endMin = eh * 60 + em
  const slotMin = schedule.slot_minutes || 50
  for (let cur = sh * 60 + sm; cur + slotMin <= endMin; cur += slotMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    const time = `${h}:${m}`
    slots.push({ time, available: !bookedTimes.has(time) })
  }
  return c.json({ success: true, data: slots })
})

// ── POST /api/counseling/appointments/prepare ─────────────
// 예약 DB 생성 + 토스 결제 파라미터 반환
app.post('/api/counseling/appointments/prepare', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const body = await c.req.json() as {
    counselorId: number
    scheduledAt: string   // ISO 날짜+시간
    sessionType: string
    userMemo?: string
    shareTestResult?: boolean
    testSummary?: string
  }
  const { counselorId, scheduledAt, sessionType, userMemo, shareTestResult, testSummary } = body

  const counselor = await DB.prepare(
    'SELECT co.*,ce.name as center_name,ce.commission_rate FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.id=?'
  ).bind(counselorId).first<{
    id: number; center_id: number; name: string; center_name: string
    fee_per_session: number; session_minutes: number; commission_rate: number
  }>()
  if (!counselor) return c.json({ success: false, error: '상담사 없음' }, 404)

  const user = await DB.prepare('SELECT email,nickname FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null }>()
  if (!user) return c.json({ success: false, error: '사용자 없음' }, 404)

  // 중복 예약 확인
  const conflict = await DB.prepare(
    'SELECT id FROM appointments WHERE counselor_id=? AND scheduled_at=? AND status NOT IN ("cancelled")'
  ).bind(counselorId, scheduledAt).first()
  if (conflict) return c.json({ success: false, error: '이미 예약된 시간입니다' }, 409)

  // Jitsi 룸 생성 (화상 상담만)
  const videoRoomId  = sessionType === 'video' ? genJitsiRoom() : null
  const videoRoomUrl = videoRoomId ? `https://meet.jit.si/${videoRoomId}` : null

  // 검사 결과 공유 동의 시 최근 검사 요약 조회
  let finalTestSummary: string | null = null
  if (shareTestResult) {
    if (testSummary) {
      finalTestSummary = testSummary
    } else {
      const recentTests = await DB.prepare(
        `SELECT test_type, score, ai_analysis, performed_at FROM test_history WHERE user_id=? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 3`
      ).bind(userId).all<{ test_type: string; score: number; ai_analysis: string | null; performed_at: string }>()
      if (recentTests.results && recentTests.results.length > 0) {
        finalTestSummary = recentTests.results.map(r =>
          `${r.test_type} (${r.performed_at.slice(0,10)}): ${r.score}점${r.ai_analysis ? ' — ' + r.ai_analysis.slice(0,80) : ''}`
        ).join('\n')
      }
    }
  }

  // 예약 레코드 생성 (pending)
  const r = await DB.prepare(`
    INSERT INTO appointments (user_id,counselor_id,center_id,scheduled_at,duration_min,session_type,status,fee_amount,video_room_id,video_room_url,user_memo,test_summary)
    VALUES (?,?,?,?,?,?,'pending',?,?,?,?,?)
  `).bind(userId, counselorId, counselor.center_id, scheduledAt, counselor.session_minutes, sessionType, counselor.fee_per_session, videoRoomId, videoRoomUrl, userMemo || null, finalTestSummary).run()

  const appointmentId = r.meta.last_row_id as number
  const orderId = `appt_${appointmentId}_${Date.now()}`
  const serviceUrl = c.env.SERVICE_URL || 'http://localhost:3000'

  // 토스 클라이언트 키 반환 (SDK 방식)
  const tossClientKey = (c.env as unknown as Record<string,string>).TOSS_CLIENT_KEY || 'test_ck_OyL0qZ4G1VOgAKo3MaZVKX2m'

  return c.json({
    success: true,
    data: {
      appointmentId,
      orderId,
      amount:        counselor.fee_per_session,
      orderName:     `${counselor.name} 상담사 ${sessionType === 'video' ? '화상' : sessionType === 'phone' ? '전화' : '방문'} 상담 (${counselor.session_minutes}분)`,
      customerName:  user.nickname || user.email.split('@')[0],
      customerEmail: user.email,
      successUrl:    `${serviceUrl}/api/counseling/appointments/toss/success?appointmentId=${appointmentId}&orderId=${orderId}`,
      failUrl:       `${serviceUrl}/api/counseling/appointments/toss/fail?appointmentId=${appointmentId}`,
      tossClientKey,
      videoRoomUrl,
    },
  })
})

// ── GET /api/counseling/appointments/toss/success ─────────
app.get('/api/counseling/appointments/toss/success', async (c) => {
  const { DB } = c.env
  const { paymentKey, orderId, amount, appointmentId } = c.req.query() as Record<string, string>
  if (!paymentKey || !orderId || !appointmentId) return c.redirect('/?counseling=fail&msg=파라미터오류')
  const amountNum = parseInt(amount)
  const apptId = parseInt(appointmentId)
  if (isNaN(amountNum) || amountNum <= 0 || isNaN(apptId)) return c.redirect('/?counseling=fail&msg=파라미터오류')

  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) return c.redirect('/?counseling=fail&msg=서버오류')

  try {
    const confirmRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(tossKey + ':') },
      body: JSON.stringify({ paymentKey, orderId, amount: amountNum }),
    })
    if (!confirmRes.ok) {
      const err = await confirmRes.json() as { message: string }
      await DB.prepare("UPDATE appointments SET status='cancelled' WHERE id=? AND status='pending'")
        .bind(apptId).run()
      return c.redirect(`/?counseling=fail&msg=${encodeURIComponent(err.message || '결제실패')}`)
    }

    // 예약 확정 처리
    const appt = await DB.prepare(
      'SELECT ap.*,co.name as counselor_name,co.session_minutes,ce.name as center_name FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id WHERE ap.id=?'
    ).bind(apptId).first<{
      user_id: number; counselor_name: string; center_name: string
      scheduled_at: string; duration_min: number; session_type: string
      fee_amount: number; video_room_url: string | null; session_minutes: number
    }>()

    if (appt) {
      await DB.prepare("UPDATE appointments SET status='confirmed',pg_tid=?,paid_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(paymentKey, parseInt(appointmentId)).run()

      // 예약 확정 이메일 발송
      const user = await DB.prepare('SELECT email,nickname FROM users WHERE id=?')
        .bind(appt.user_id).first<{ email: string; nickname: string | null }>()
      if (user) {
        await sendAppointmentEmail(c.env, user.email, user.nickname || '', {
          counselorName: appt.counselor_name,
          centerName:    appt.center_name,
          scheduledAt:   appt.scheduled_at,
          durationMin:   appt.duration_min,
          sessionType:   appt.session_type,
          feeAmount:     appt.fee_amount,
          videoUrl:      appt.video_room_url,
        })
      }
    }

    return c.redirect(`/?counseling=success&appointmentId=${appointmentId}`)
  } catch (e) {
    console.error('[Counseling Toss] 오류:', e)
    return c.redirect('/?counseling=fail&msg=서버오류')
  }
})

// ── GET /api/counseling/appointments/toss/fail ────────────
app.get('/api/counseling/appointments/toss/fail', async (c) => {
  const { DB } = c.env
  const { appointmentId } = c.req.query() as Record<string, string>
  if (appointmentId) {
    const aid = parseInt(appointmentId)
    if (!isNaN(aid)) {
      await DB.prepare("UPDATE appointments SET status='cancelled' WHERE id=? AND status='pending'")
        .bind(aid).run()
    }
  }
  return c.redirect('/?counseling=fail')
})

// ── GET /api/counseling/appointments ─────────────────────
// 내 예약 목록
app.get('/api/counseling/appointments', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const rows = await DB.prepare(`
    SELECT ap.id,ap.scheduled_at,ap.duration_min,ap.session_type,ap.status,
           ap.fee_amount,ap.video_room_url,ap.video_room_id,ap.user_memo,ap.pg_tid,ap.paid_at,
           co.name as counselor_name,co.photo_emoji,co.title as counselor_title,
           ce.name as center_name
    FROM appointments ap
    JOIN counselors co ON ap.counselor_id=co.id
    JOIN counseling_centers ce ON ap.center_id=ce.id
    WHERE ap.user_id=?
    ORDER BY ap.scheduled_at DESC
    LIMIT 50
  `).bind(userId).all()

  return c.json({ success: true, data: rows.results })
})

// ── PATCH /api/counseling/appointments/:id/cancel ─────────
app.patch('/api/counseling/appointments/:id/cancel', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const apptId = parseInt(c.req.param('id'))
  const appt = await DB.prepare(
    'SELECT * FROM appointments WHERE id=? AND user_id=?'
  ).bind(apptId, userId).first<{ status: string; scheduled_at: string; pg_tid: string | null; fee_amount: number }>()

  if (!appt) return c.json({ success: false, error: '예약 없음' }, 404)
  if (appt.status === 'cancelled') return c.json({ success: false, error: '이미 취소됨' }, 400)

  // 24시간 전 체크
  const scheduledMs = new Date(appt.scheduled_at).getTime()
  const nowMs       = Date.now()
  const canRefund   = scheduledMs - nowMs > 24 * 60 * 60 * 1000

  await DB.prepare("UPDATE appointments SET status='cancelled',cancelled_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(apptId).run()

  return c.json({
    success: true,
    data: {
      refundable: canRefund,
      message: canRefund ? '환불 처리가 진행됩니다 (1~3 영업일)' : '24시간 이내 취소는 환불이 불가합니다',
    },
  })
})

// ── GET /api/counseling/appointments/:id ──────────────────
app.get('/api/counseling/appointments/:id', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const apptId = parseInt(c.req.param('id'))
  const row = await DB.prepare(`
    SELECT ap.*,co.name as counselor_name,co.photo_emoji,co.title as counselor_title,ce.name as center_name
    FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id
    WHERE ap.id=? AND ap.user_id=?
  `).bind(apptId, userId).first()
  if (!row) return c.json({ success: false, error: '없음' }, 404)
  return c.json({ success: true, data: row })
})


// ============================================================
// 3단계 어드민 API — 상담 플랫폼 전용
// ============================================================

// ── 어드민 상담 통계 ─────────────────────────────────────
app.get('/api/admin/counseling/stats', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const today = new Date().toISOString().slice(0, 10)
  const month1st = new Date().toISOString().slice(0, 7) + '-01'

  const [centers, counselors, appts, revenue, reviews, onboarding] = await DB.batch([
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) AS pending FROM counseling_centers'),
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) AS active FROM counselors'),
    DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN DATE(created_at)=? THEN 1 ELSE 0 END) AS today FROM appointments`).bind(today),
    DB.prepare(`SELECT COALESCE(SUM(fee_amount),0) AS total_revenue, COALESCE(SUM(CASE WHEN created_at>=? THEN fee_amount ELSE 0 END),0) AS month_revenue FROM appointments WHERE status IN ('confirmed','completed') AND paid_at IS NOT NULL`).bind(month1st),
    DB.prepare('SELECT COUNT(*) AS total, AVG(rating) AS avg_rating FROM counseling_reviews WHERE admin_hidden=0'),
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) AS pending FROM center_onboarding_requests'),
  ])

  return c.json({ success: true, data: {
    centers: centers.results[0],
    counselors: counselors.results[0],
    appointments: appts.results[0],
    revenue: revenue.results[0],
    reviews: reviews.results[0],
    onboarding: onboarding.results[0],
  }})
})

// ── 어드민: 센터 목록 + 상태 변경 ─────────────────────────
app.get('/api/admin/counseling/centers', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const rows = await DB.prepare(`
    SELECT cc.*, COUNT(DISTINCT co.id) AS counselor_count,
           COUNT(DISTINCT ap.id) AS appt_count
    FROM counseling_centers cc
    LEFT JOIN counselors co ON co.center_id=cc.id AND co.status='active'
    LEFT JOIN appointments ap ON ap.center_id=cc.id AND ap.status IN ('confirmed','completed')
    GROUP BY cc.id ORDER BY cc.created_at DESC
  `).all()
  return c.json({ success: true, data: rows.results })
})

app.patch('/api/admin/counseling/centers/:id/status', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const { status, rejected_reason } = await c.req.json() as { status: string; rejected_reason?: string }
  if (!['pending','active','suspended'].includes(status)) return c.json({ success: false, error: '잘못된 상태' }, 400)

  const approvedAt = status === 'active' ? 'CURRENT_TIMESTAMP' : 'NULL'
  await DB.prepare(`UPDATE counseling_centers SET status=?,approved_at=${status==='active'?'CURRENT_TIMESTAMP':'NULL'},rejected_reason=? WHERE id=?`)
    .bind(status, rejected_reason || null, id).run()
  return c.json({ success: true })
})

// ── 어드민: 상담사 관리 ───────────────────────────────────
app.get('/api/admin/counseling/counselors', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const rows = await DB.prepare(`
    SELECT co.*, ce.name AS center_name, ce.status AS center_status,
           COUNT(DISTINCT ap.id) AS total_appts,
           COALESCE(SUM(CASE WHEN ap.status='completed' THEN ap.fee_amount ELSE 0 END),0) AS total_earned
    FROM counselors co
    JOIN counseling_centers ce ON co.center_id=ce.id
    LEFT JOIN appointments ap ON ap.counselor_id=co.id
    GROUP BY co.id ORDER BY co.created_at DESC
  `).all()
  return c.json({ success: true, data: rows.results })
})

app.patch('/api/admin/counseling/counselors/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const body = await c.req.json() as Record<string, unknown>
  const allowed = ['status','fee_per_session','session_minutes','title','bio','specialties','available_types']
  const sets: string[] = []
  const vals: unknown[] = []
  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k}=?`); vals.push(body[k]); }
  }
  if (sets.length === 0) return c.json({ success: false, error: '변경 사항 없음' }, 400)
  vals.push(id)
  await DB.prepare(`UPDATE counselors SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ success: true })
})

// ── 어드민: 전체 예약 조회 ────────────────────────────────
app.get('/api/admin/counseling/appointments', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const status = c.req.query('status') || ''
  const page   = parseInt(c.req.query('page') || '1')
  const limit  = 20
  const offset = (page - 1) * limit

  const where = status ? `WHERE ap.status=?` : ''
  const binds: unknown[] = status ? [status, limit, offset] : [limit, offset]

  const rows = await DB.prepare(`
    SELECT ap.id, ap.scheduled_at, ap.session_type, ap.status, ap.fee_amount, ap.paid_at,
           ap.video_room_id, ap.earning_processed,
           u.email AS user_email, u.nickname AS user_nickname,
           co.name AS counselor_name, co.photo_emoji,
           ce.name AS center_name
    FROM appointments ap
    JOIN users u ON ap.user_id=u.id
    JOIN counselors co ON ap.counselor_id=co.id
    JOIN counseling_centers ce ON ap.center_id=ce.id
    ${where}
    ORDER BY ap.created_at DESC LIMIT ? OFFSET ?
  `).bind(...binds).all()

  return c.json({ success: true, data: rows.results, page, limit })
})

app.patch('/api/admin/counseling/appointments/:id/complete', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const appt = await DB.prepare(
    'SELECT ap.*,co.commission_rate as cr_rate,ce.commission_rate as center_rate FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id WHERE ap.id=?'
  ).bind(id).first<{ id:number; counselor_id:number; center_id:number; fee_amount:number; center_rate:number; status:string; earning_processed:number }>()

  if (!appt) return c.json({ success: false, error: '예약 없음' }, 404)
  if (appt.status === 'completed') return c.json({ success: false, error: '이미 완료됨' }, 400)

  const commRate    = appt.center_rate || 10
  const commAmt     = Math.round(appt.fee_amount * commRate / 100)
  const netAmt      = appt.fee_amount - commAmt

  await DB.batch([
    DB.prepare("UPDATE appointments SET status='completed',completed_at=CURRENT_TIMESTAMP,earning_processed=1 WHERE id=?").bind(id),
    DB.prepare('INSERT INTO counselor_earnings (counselor_id,appointment_id,gross_amount,commission_rate,commission_amt,net_amount) VALUES (?,?,?,?,?,?)').bind(appt.counselor_id, id, appt.fee_amount, commRate, commAmt, netAmt),
    DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=?),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?").bind(appt.counselor_id, appt.counselor_id, appt.counselor_id),
  ])

  return c.json({ success: true, data: { net_amount: netAmt, commission_amt: commAmt } })
})

// ── 어드민: 정산 관리 ─────────────────────────────────────
app.get('/api/admin/counseling/settlements', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const rows = await DB.prepare(`
    SELECT s.*, cc.name AS center_name, cc.logo_emoji
    FROM settlements s JOIN counseling_centers cc ON s.center_id=cc.id
    ORDER BY s.created_at DESC LIMIT 50
  `).all()
  return c.json({ success: true, data: rows.results })
})

app.post('/api/admin/counseling/settlements', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const { center_id, period_start, period_end } = await c.req.json() as Record<string,string>

  // 해당 기간 완료 예약 집계
  const center = await DB.prepare('SELECT commission_rate FROM counseling_centers WHERE id=?').bind(parseInt(center_id)).first<{ commission_rate:number }>()
  if (!center) return c.json({ success: false, error: '센터 없음' }, 404)

  const agg = await DB.prepare(`
    SELECT COUNT(*) AS appt_count, COALESCE(SUM(fee_amount),0) AS total_revenue
    FROM appointments
    WHERE center_id=? AND status='completed' AND DATE(completed_at) BETWEEN ? AND ?
      AND earning_processed=1
  `).bind(parseInt(center_id), period_start, period_end).first<{ appt_count:number; total_revenue:number }>()

  if (!agg || agg.appt_count === 0) return c.json({ success: false, error: '정산할 완료 예약 없음' }, 400)

  const commRate  = center.commission_rate || 10
  const commAmt   = Math.round(agg.total_revenue * commRate / 100)
  const payoutAmt = agg.total_revenue - commAmt

  const r = await DB.prepare(`
    INSERT INTO settlements (center_id,period_start,period_end,total_revenue,commission_amt,payout_amt,appt_count)
    VALUES (?,?,?,?,?,?,?)
  `).bind(parseInt(center_id), period_start, period_end, agg.total_revenue, commAmt, payoutAmt, agg.appt_count).run()

  return c.json({ success: true, data: { settlement_id: r.meta.last_row_id, payout_amt: payoutAmt, appt_count: agg.appt_count } })
})

app.patch('/api/admin/counseling/settlements/:id/process', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const { note } = await c.req.json() as { note?: string }
  await DB.prepare("UPDATE settlements SET status='completed',processed_at=CURRENT_TIMESTAMP,note=? WHERE id=?")
    .bind(note || null, id).run()
  return c.json({ success: true })
})

// ── 어드민: 온보딩 신청 관리 ─────────────────────────────
app.get('/api/admin/counseling/onboarding', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const rows = await DB.prepare('SELECT * FROM center_onboarding_requests ORDER BY created_at DESC LIMIT 50').all()
  return c.json({ success: true, data: rows.results })
})

app.patch('/api/admin/counseling/onboarding/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const { status, admin_note } = await c.req.json() as { status: string; admin_note?: string }
  if (!['reviewing','approved','rejected'].includes(status)) return c.json({ success: false, error: '잘못된 상태' }, 400)

  await DB.prepare("UPDATE center_onboarding_requests SET status=?,admin_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(status, admin_note || null, id).run()

  // 승인 시 실제 센터 자동 생성
  if (status === 'approved') {
    const req = await DB.prepare('SELECT * FROM center_onboarding_requests WHERE id=?')
      .bind(id).first<{ center_name:string; contact_email:string; contact_phone:string; address:string; specialty_tags:string; description:string }>()
    if (req) {
      await DB.prepare(`
        INSERT INTO counseling_centers (name,description,address,specialty_tags,status,contact_email,contact_phone,approved_at)
        VALUES (?,?,?,?,'active',?,?,CURRENT_TIMESTAMP)
      `).bind(req.center_name, req.description || '', req.address || '', req.specialty_tags || '[]', req.contact_email, req.contact_phone || '').run()
    }
  }
  return c.json({ success: true })
})


// ══════════════════════════════════════════════════════════════
// 어드민: 상담센터 CRUD
// ══════════════════════════════════════════════════════════════

// ── POST /api/admin/counseling/centers  (센터 신규 등록) ──────
app.post('/api/admin/counseling/centers', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const body = await c.req.json() as {
    name: string; description?: string; address?: string
    specialty_tags?: string; contact_email?: string; contact_phone?: string
    logo_emoji?: string; commission_rate?: number; status?: string
  }
  if (!body.name?.trim()) return c.json({ success: false, error: '센터명은 필수입니다' }, 400)

  const result = await DB.prepare(`
    INSERT INTO counseling_centers
      (name, description, address, specialty_tags, contact_email, contact_phone,
       logo_emoji, commission_rate, status, approved_at)
    VALUES (?,?,?,?,?,?,?,?,?,CASE WHEN ? = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END)
  `).bind(
    body.name.trim(),
    body.description || '',
    body.address || '',
    body.specialty_tags || '[]',
    body.contact_email || '',
    body.contact_phone || '',
    body.logo_emoji || '🏥',
    body.commission_rate ?? 10,
    body.status || 'active',
    body.status || 'active'
  ).run()

  return c.json({ success: true, data: { id: result.meta.last_row_id } })
})

// ── PUT /api/admin/counseling/centers/:id  (센터 수정) ────────
app.put('/api/admin/counseling/centers/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const body = await c.req.json() as Record<string, unknown>
  const allowed = ['name','description','address','specialty_tags','contact_email',
                   'contact_phone','logo_emoji','commission_rate','status']
  const sets: string[] = []
  const vals: unknown[] = []

  for (const k of allowed) {
    if (body[k] !== undefined) {
      sets.push(`${k}=?`)
      vals.push(body[k])
      // 상태를 active로 변경 시 approved_at 자동 설정
      if (k === 'status' && body[k] === 'active') {
        sets.push('approved_at=CURRENT_TIMESTAMP')
      }
    }
  }
  if (sets.length === 0) return c.json({ success: false, error: '변경 사항 없음' }, 400)

  vals.push(id)
  await DB.prepare(`UPDATE counseling_centers SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ success: true })
})

// ── DELETE /api/admin/counseling/centers/:id  (센터 삭제) ─────
app.delete('/api/admin/counseling/centers/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))

  // 소속 상담사 있으면 삭제 불가
  const counselorCount = await DB.prepare(
    'SELECT COUNT(*) AS cnt FROM counselors WHERE center_id=?'
  ).bind(id).first<{ cnt: number }>()
  if ((counselorCount?.cnt ?? 0) > 0)
    return c.json({ success: false, error: '소속 상담사가 있어 삭제할 수 없습니다. 상담사를 먼저 이전하거나 삭제하세요.' }, 409)

  await DB.prepare('DELETE FROM counseling_centers WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

// ══════════════════════════════════════════════════════════════
// 어드민: 상담사 CRUD + 스케줄
// ══════════════════════════════════════════════════════════════

// ── POST /api/admin/counseling/counselors  (상담사 등록) ──────
app.post('/api/admin/counseling/counselors', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const body = await c.req.json() as {
    center_id: number; name: string; title?: string; bio?: string
    specialties?: string; available_types?: string
    fee_per_session?: number; session_minutes?: number
    photo_emoji?: string; status?: string; contact_email?: string
  }
  if (!body.center_id || !body.name?.trim())
    return c.json({ success: false, error: '소속 센터와 이름은 필수입니다' }, 400)

  // 센터 존재 확인
  const center = await DB.prepare('SELECT id FROM counseling_centers WHERE id=?')
    .bind(body.center_id).first()
  if (!center) return c.json({ success: false, error: '존재하지 않는 센터입니다' }, 404)

  const result = await DB.prepare(`
    INSERT INTO counselors
      (center_id, name, title, bio, specialties, available_types,
       fee_per_session, session_minutes, photo_emoji, status, contact_email, avg_rating, review_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0)
  `).bind(
    body.center_id,
    body.name.trim(),
    body.title || '',
    body.bio || '',
    body.specialties || '[]',
    body.available_types || '["visit"]',
    body.fee_per_session ?? 50000,
    body.session_minutes ?? 50,
    body.photo_emoji || '👤',
    body.status || 'active',
    body.contact_email || ''
  ).run()

  return c.json({ success: true, data: { id: result.meta.last_row_id } })
})

// ── PUT /api/admin/counseling/counselors/:id  (상담사 수정) ───
app.put('/api/admin/counseling/counselors/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const body = await c.req.json() as Record<string, unknown>
  const allowed = ['center_id','name','title','bio','specialties','available_types',
                   'fee_per_session','session_minutes','photo_emoji','status','contact_email']
  const sets: string[] = []
  const vals: unknown[] = []

  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k}=?`); vals.push(body[k]); }
  }
  if (sets.length === 0) return c.json({ success: false, error: '변경 사항 없음' }, 400)

  vals.push(id)
  await DB.prepare(`UPDATE counselors SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ success: true })
})

// ── DELETE /api/admin/counseling/counselors/:id  (상담사 삭제) ─
app.delete('/api/admin/counseling/counselors/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))

  // 확정된 예약이 있으면 삭제 불가
  const activeAppts = await DB.prepare(
    "SELECT COUNT(*) AS cnt FROM appointments WHERE counselor_id=? AND status IN ('pending','confirmed')"
  ).bind(id).first<{ cnt: number }>()
  if ((activeAppts?.cnt ?? 0) > 0)
    return c.json({ success: false, error: '진행 중인 예약이 있어 삭제할 수 없습니다.' }, 409)

  // 스케줄도 함께 삭제
  await DB.prepare('DELETE FROM counselor_schedules WHERE counselor_id=?').bind(id).run()
  await DB.prepare('DELETE FROM counselors WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

// ── GET /api/admin/counseling/counselors/:id/schedules  (스케줄 조회) ─
app.get('/api/admin/counseling/counselors/:id/schedules', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const rows = await DB.prepare(
    'SELECT * FROM counselor_schedules WHERE counselor_id=? ORDER BY day_of_week'
  ).bind(id).all()
  return c.json({ success: true, data: rows.results })
})

// ── POST /api/admin/counseling/counselors/:id/schedules  (스케줄 저장) ─
app.post('/api/admin/counseling/counselors/:id/schedules', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const counselorId = parseInt(c.req.param('id'))
  const { schedules } = await c.req.json() as {
    schedules: Array<{ day_of_week: number; start_time: string; end_time: string; slot_minutes: number }>
  }
  if (!Array.isArray(schedules)) return c.json({ success: false, error: '스케줄 배열 필요' }, 400)

  // 기존 스케줄 삭제 후 재삽입 (upsert 방식)
  await DB.prepare('DELETE FROM counselor_schedules WHERE counselor_id=?').bind(counselorId).run()

  for (const s of schedules) {
    if (s.day_of_week < 0 || s.day_of_week > 6) continue
    await DB.prepare(
      'INSERT INTO counselor_schedules (counselor_id,day_of_week,start_time,end_time,slot_minutes) VALUES (?,?,?,?,?)'
    ).bind(counselorId, s.day_of_week, s.start_time, s.end_time, s.slot_minutes || 50).run()
  }
  return c.json({ success: true })
})

// ── 리뷰 API (일반 사용자) ────────────────────────────────
app.post('/api/counseling/reviews', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const { appointment_id, rating, content, is_anonymous } = await c.req.json() as {
    appointment_id: number; rating: number; content?: string; is_anonymous?: boolean
  }
  if (rating < 1 || rating > 5) return c.json({ success: false, error: '평점은 1~5' }, 400)

  const appt = await DB.prepare('SELECT * FROM appointments WHERE id=? AND user_id=? AND status="completed"')
    .bind(appointment_id, userId).first<{ id:number; counselor_id:number }>()
  if (!appt) return c.json({ success: false, error: '완료된 예약이 없거나 접근 불가' }, 404)

  const existing = await DB.prepare('SELECT id FROM counseling_reviews WHERE appointment_id=?').bind(appointment_id).first()
  if (existing) return c.json({ success: false, error: '이미 리뷰를 작성했습니다' }, 409)

  await DB.prepare('INSERT INTO counseling_reviews (appointment_id,user_id,counselor_id,rating,content,is_anonymous) VALUES (?,?,?,?,?,?)')
    .bind(appointment_id, userId, appt.counselor_id, rating, content || null, is_anonymous ? 1 : 0).run()

  await DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?")
    .bind(appt.counselor_id, appt.counselor_id, appt.counselor_id).run()

  return c.json({ success: true })
})

app.get('/api/counseling/reviews/:counselorId', async (c) => {
  const { DB } = c.env
  const counselorId = parseInt(c.req.param('counselorId'))
  const page  = parseInt(c.req.query('page') || '1')
  const limit = 10
  const rows  = await DB.prepare(`
    SELECT cr.id, cr.rating, cr.content, cr.is_anonymous, cr.counselor_reply, cr.created_at,
           CASE WHEN cr.is_anonymous=1 THEN '익명' ELSE COALESCE(u.nickname, u.email) END AS reviewer_name
    FROM counseling_reviews cr JOIN users u ON cr.user_id=u.id
    WHERE cr.counselor_id=? AND cr.admin_hidden=0 AND cr.is_public=1
    ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
  `).bind(counselorId, limit, (page - 1) * limit).all()
  return c.json({ success: true, data: rows.results, page })
})

// ── 어드민: 전체 리뷰 조회 ────────────────────────────────
app.get('/api/admin/counseling/reviews', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const page  = parseInt(c.req.query('page') || '1')
  const limit = 20
  const rows = await DB.prepare(`
    SELECT cr.id, cr.rating, cr.content, cr.is_anonymous, cr.admin_hidden, cr.created_at,
           co.name AS counselor_name, co.id AS counselor_id,
           CASE WHEN cr.is_anonymous=1 THEN '익명' ELSE COALESCE(u.nickname, u.email) END AS reviewer_name
    FROM counseling_reviews cr
    JOIN counselors co ON cr.counselor_id=co.id
    JOIN users u ON cr.user_id=u.id
    ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, (page - 1) * limit).all()
  const total = await DB.prepare('SELECT COUNT(*) AS cnt FROM counseling_reviews').first<{ cnt: number }>()
  return c.json({ success: true, data: rows.results, total: total?.cnt || 0, page })
})

// ── 어드민: 리뷰 숨김/공개 토글 ──────────────────────────
app.patch('/api/admin/counseling/reviews/:id/visibility', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const id = parseInt(c.req.param('id'))
  const { hidden } = await c.req.json() as { hidden: boolean }
  await DB.prepare('UPDATE counseling_reviews SET admin_hidden=? WHERE id=?').bind(hidden ? 1 : 0, id).run()
  // 해당 상담사 avg_rating 재계산
  const rev = await DB.prepare('SELECT counselor_id FROM counseling_reviews WHERE id=?').bind(id).first<{ counselor_id: number }>()
  if (rev) {
    await DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?")
      .bind(rev.counselor_id, rev.counselor_id, rev.counselor_id).run()
  }
  return c.json({ success: true })
})

// ============================================================
// Web Push 유틸리티 — RFC 8291 (aes128gcm) + VAPID ES256
// ============================================================

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(len)
  let off = 0
  for (const a of arrays) { out.set(a, off); off += a.length }
  return out
}

async function hkdfDerive(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key  = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8)
  return new Uint8Array(bits)
}

// RFC 8291 payload 암호화 → aes128gcm 인코딩 바이너리 반환
async function encryptWebPush(plaintext: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const enc             = new TextEncoder()
  const receiverPubRaw  = b64urlDecode(p256dhB64)   // 65 bytes (0x04 + x + y)
  const authSecret      = b64urlDecode(authB64)       // 16 bytes
  const salt            = crypto.getRandomValues(new Uint8Array(16))

  // 임시 발신자 ECDH 키 쌍
  const senderKP       = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const senderPubRaw   = new Uint8Array(await crypto.subtle.exportKey('raw', senderKP.publicKey))

  // ECDH 공유 비밀
  const receiverKey    = await crypto.subtle.importKey('raw', receiverPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const dh             = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: receiverKey }, senderKP.privateKey, 256))

  // PRK = HKDF(salt=authSecret, ikm=dh, info="WebPush: info\0"+ua_pub+as_pub)
  const keyInfo = concatBytes(enc.encode('WebPush: info\x00'), receiverPubRaw, senderPubRaw)
  const prk     = await hkdfDerive(dh, authSecret, keyInfo, 32)

  // CEK / NONCE 도출
  const cek   = await hkdfDerive(prk, salt, concatBytes(enc.encode('Content-Encoding: aes128gcm\x00'), new Uint8Array([0, 1])), 16)
  const nonce = await hkdfDerive(prk, salt, concatBytes(enc.encode('Content-Encoding: nonce\x00'), new Uint8Array([0, 1])), 12)

  // AES-128-GCM 암호화 (0x02 = record delimiter)
  const record    = concatBytes(enc.encode(plaintext), new Uint8Array([2]))
  const cekKey    = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, record))

  // RFC 8188 헤더: salt(16) + rs(4) + idlen(1) + senderPub(65) + ciphertext
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)
  return concatBytes(salt, rs, new Uint8Array([65]), senderPubRaw, ciphertext)
}

// VAPID JWT (ES256) 서명
async function signVapidJwt(endpoint: string, vapidPubB64: string, vapidPrivB64: string): Promise<string> {
  const enc     = new TextEncoder()
  const origin  = new URL(endpoint).origin
  const now     = Math.floor(Date.now() / 1000)

  const header  = b64urlEncode(enc.encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })))
  const payload = b64urlEncode(enc.encode(JSON.stringify({ aud: origin, exp: now + 43200, sub: 'mailto:noreply@maumful.com' })))
  const unsigned = `${header}.${payload}`

  // raw 32바이트 private key → JWK (x, y는 public key에서 파싱)
  const pubBytes  = b64urlDecode(vapidPubB64)   // 65 bytes: 0x04 + 32 x + 32 y
  const privBytes = b64urlDecode(vapidPrivB64)  // 32 bytes
  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: b64urlEncode(pubBytes.slice(1, 33)),
    y: b64urlEncode(pubBytes.slice(33, 65)),
    d: b64urlEncode(privBytes),
  }
  const privKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const sigBuf  = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, enc.encode(unsigned))

  return `${unsigned}.${b64urlEncode(new Uint8Array(sigBuf))}`
}

// Web Push 메시지 단건 발송
async function sendWebPushMessage(
  sub: { endpoint: string; p256dh: string; auth_key: string },
  notification: { title: string; body: string; url?: string },
  vapidPubB64: string, vapidPrivB64: string
): Promise<boolean> {
  try {
    const encrypted  = await encryptWebPush(JSON.stringify(notification), sub.p256dh, sub.auth_key)
    const jwt        = await signVapidJwt(sub.endpoint, vapidPubB64, vapidPrivB64)
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${jwt},k=${vapidPubB64}`,
        'TTL': '86400',
      },
      body: encrypted,
    })
    return res.ok || res.status === 201
  } catch (e) {
    console.error('[WebPush] 발송 실패:', e)
    return false
  }
}

// 특정 사용자에게 푸시 알림 발송 (DB에서 구독 정보 조회)
async function sendPushToUser(
  db: D1Database, env: Bindings, userId: number,
  notification: { title: string; body: string; url?: string }
): Promise<boolean> {
  const vapidPub  = env.VAPID_PUBLIC_KEY
  const vapidPriv = env.VAPID_PRIVATE_KEY
  if (!vapidPub || !vapidPriv) return false

  const sub = await db.prepare(
    "SELECT endpoint, p256dh, auth_key FROM push_subscriptions WHERE user_id=? AND service='maumful' LIMIT 1"
  ).bind(userId).first<{ endpoint: string; p256dh: string; auth_key: string }>()
  if (!sub) return false

  return sendWebPushMessage(sub, notification, vapidPub, vapidPriv)
}

// ── Web Push: VAPID 공개 키 ────────────────────────────────
app.get('/api/push/vapid-key', (c) => {
  const key = c.env.VAPID_PUBLIC_KEY || ''
  return c.json({ success: true, key })
})

// ── Web Push: 구독 저장 ───────────────────────────────────
app.post('/api/push/subscribe', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
  const { endpoint, p256dh, auth } = await c.req.json() as { endpoint: string; p256dh: string; auth: string }
  if (!endpoint || !p256dh || !auth) return c.json({ success: false, error: '잘못된 구독 정보' }, 400)
  await DB.prepare(`
    INSERT INTO push_subscriptions (user_id, service, endpoint, p256dh, auth_key)
    VALUES (?, 'maumful', ?, ?, ?)
    ON CONFLICT(user_id, service) DO UPDATE SET endpoint=excluded.endpoint, p256dh=excluded.p256dh, auth_key=excluded.auth_key
  `).bind(userId, endpoint, p256dh, auth).run()
  return c.json({ success: true })
})

// ── 온보딩 신청 (일반 사용자) ─────────────────────────────
app.post('/api/counseling/onboarding', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)  // 비회원도 허용

  const body = await c.req.json() as Record<string, string | number>
  const { center_name, contact_name, contact_email, contact_phone, address, specialty_tags, description, counselor_count, website_url, business_reg_num } = body

  if (!center_name || !contact_name || !contact_email) return c.json({ success: false, error: '필수 항목 누락' }, 400)

  const r = await DB.prepare(`
    INSERT INTO center_onboarding_requests (user_id,center_name,contact_name,contact_email,contact_phone,address,specialty_tags,description,counselor_count,website_url,business_reg_num)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(userId || null, center_name, contact_name, contact_email, contact_phone||null, address||null, specialty_tags||'[]', description||null, counselor_count||1, website_url||null, business_reg_num||null).run()

  // 운영자 알림 이메일 발송
  const notifyEmail = (c.env as unknown as Record<string,string>).COUNSELING_NOTIFY_EMAIL
  if (notifyEmail) {
    sendEmail(c.env, notifyEmail, `[마음풀] 상담센터 입점 신청 — ${center_name}`,
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#2D6A4F">🌿 상담센터 입점 신청</h2>
        <p><strong>센터명:</strong> ${center_name}</p>
        <p><strong>담당자:</strong> ${contact_name}</p>
        <p><strong>이메일:</strong> ${contact_email}</p>
        <p><strong>전화:</strong> ${contact_phone || '-'}</p>
        <p><strong>주소:</strong> ${address || '-'}</p>
        <p><strong>상담사 수:</strong> ${counselor_count || 1}명</p>
        <p style="color:#888;font-size:12px">신청 ID: ${r.meta.last_row_id}</p>
      </div>`
    ).catch(() => {})
  }

  return c.json({ success: true, data: { request_id: r.meta.last_row_id } })
})

// ── PATCH /api/admin/counseling/appointments/:id/note ──────
app.patch('/api/admin/counseling/appointments/:id/note', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const id = parseInt(c.req.param('id'))
  const { counselor_note } = await c.req.json() as { counselor_note: string }
  await DB.prepare("UPDATE appointments SET counselor_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(counselor_note || null, id).run()
  return c.json({ success: true })
})


// ════════════════════════════════════════════════════════════
// Cloudflare Cron Trigger — 매월 1일 00:00 자동 구독 갱신
// wrangler.toml 에 추가:
//   [[triggers]]
//   crons = ["0 0 1 * *"]
// ════════════════════════════════════════════════════════════
async function handleScheduled(env: Bindings) {
  const DB = env.DB
  const tossKey = env.TOSS_BILLING_KEY || env.TOSS_SECRET_KEY
  if (!tossKey) { console.error('[Cron] TOSS_BILLING_KEY 미설정'); return }

  // 오늘 갱신 대상 구독 조회
  const today = new Date().toISOString().slice(0, 10)
  const subs = await DB.prepare(
    "SELECT * FROM user_subscriptions WHERE status='active' AND DATE(next_billing_date) <= ?"
  ).bind(today).all()

  const plans: Record<string, { name: string; monthlyCredits: number; price: number }> = {
    basic:    { name:'베이직',   monthlyCredits:60,  price:3900  },
    standard: { name:'스탠다드', monthlyCredits:150, price:8900  },
    pro:      { name:'프로',     monthlyCredits:400, price:19900 },
  }

  for (const sub of (subs.results as Record<string, unknown>[]) ) {
    const plan = plans[sub.plan_key as string]
    if (!plan || !sub.billing_key) continue

    try {
      // 토스 자동 결제 요청
      const res = await fetch('https://api.tosspayments.com/v1/billing/' + sub.billing_key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(tossKey + ':') },
        body: JSON.stringify({
          customerKey: sub.customer_key,
          amount: plan.price,
          orderId: `sub_${sub.user_id}_${Date.now()}`,
          orderName: `마음풀 ${plan.name} 구독`,
          customerEmail: '',
        }),
      })

      const result = await res.json() as { paymentKey?: string; code?: string; message?: string }

      if (res.ok && result.paymentKey) {
        // 결제 성공 — 크레딧 지급 + 다음 결제일 갱신
        const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth() + 1)
        await DB.batch([
          DB.prepare("UPDATE users SET credits = credits + ? WHERE id=?").bind(plan.monthlyCredits, sub.user_id),
          DB.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) SELECT ?,?,?,?,credits FROM users WHERE id=?")
            .bind(sub.user_id, 'gain', plan.monthlyCredits, `subscription_renewal_${sub.plan_key}`, sub.user_id),
          DB.prepare("UPDATE user_subscriptions SET next_billing_date=?, current_period_start=CURRENT_TIMESTAMP WHERE id=?")
            .bind(nextDate.toISOString(), sub.id),
          DB.prepare("INSERT INTO subscription_invoices (user_id,subscription_id,plan_key,amount,status,pg_tid) VALUES (?,?,?,?,?,?)")
            .bind(sub.user_id, sub.id, sub.plan_key, plan.price, 'paid', result.paymentKey),
        ])
        console.log(`[Cron] 구독 갱신 성공: user_id=${sub.user_id}, plan=${sub.plan_key}`)
        // 구독 갱신 성공 푸시 알림
        sendPushToUser(DB, env, sub.user_id as number, {
          title: '마음풀 구독 갱신 완료',
          body: `${plan.name} 플랜이 갱신되고 ${plan.monthlyCredits} 크레딧이 지급됐어요!`,
          url: '/',
        }).catch(() => {})
      } else {
        // 결제 실패 — past_due 처리
        await DB.prepare("UPDATE user_subscriptions SET status='past_due' WHERE id=?").bind(sub.id).run()
        await DB.prepare("INSERT INTO subscription_invoices (user_id,subscription_id,plan_key,amount,status) VALUES (?,?,?,?,'failed')")
          .bind(sub.user_id, sub.id, sub.plan_key, plan.price).run()
        console.error(`[Cron] 구독 갱신 실패: user_id=${sub.user_id}, code=${result.code}`)
        // 구독 갱신 실패 푸시 알림
        sendPushToUser(DB, env, sub.user_id as number, {
          title: '마음풀 구독 결제 실패',
          body: '이번 달 결제에 문제가 생겼어요. 결제 수단을 확인해주세요.',
          url: '/',
        }).catch(() => {})
      }
    } catch (e) { console.error('[Cron] 오류:', e) }
  }
}

// ── Cron: 매일 09:00 KST — 6주 경과 검사 재알림 ────────────
async function handleDailyReminder(env: Bindings) {
  const DB       = env.DB
  const vapidPub = env.VAPID_PUBLIC_KEY
  if (!vapidPub) return

  // 마지막 검사일이 42일 이상 지난 구독 사용자 조회 (중요 검사 PHQ9/GAD7)
  const rows = await DB.prepare(`
    SELECT DISTINCT ps.user_id
    FROM push_subscriptions ps
    WHERE ps.service = 'maumful'
      AND NOT EXISTS (
        SELECT 1 FROM test_history th
        WHERE th.user_id = ps.user_id
          AND th.test_type IN ('PHQ9','GAD7')
          AND th.performed_at > datetime('now', '-42 days')
      )
      AND EXISTS (
        SELECT 1 FROM test_history th2
        WHERE th2.user_id = ps.user_id
          AND th2.test_type IN ('PHQ9','GAD7')
      )
  `).all<{ user_id: number }>()

  for (const row of (rows.results || [])) {
    await sendPushToUser(DB, env, row.user_id, {
      title: '마음풀 — 마음 체크할 시간이에요',
      body: '마지막 검사로부터 6주가 지났어요. 지금 마음 상태를 확인해볼까요?',
      url: '/',
    }).catch(() => {})
  }
  console.log(`[DailyReminder] 재알림 발송: ${rows.results?.length ?? 0}명`)
}

// ============================================================
// 어드민 파트너 채널 관리 API
// ============================================================

// 파트너 목록 조회
app.get('/api/admin/partners', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const rows = await DB.prepare(`
    SELECT p.code, p.name, p.revenue_share_rate, p.welcome_message,
           p.featured_tests, p.primary_color, p.contact_email, p.is_active, p.created_at,
           p.sso_secret, p.logo_url, p.commission_start, p.commission_end,
           p.entry_headline, p.entry_subcopy, p.entry_benefit, p.entry_cta_label, p.entry_cta_go,
           COUNT(DISTINCT u.id)  AS total_users,
           COUNT(DISTINCT cc.id) AS total_charges,
           COALESCE(SUM(cc.amount), 0) AS total_revenue
    FROM partners p
    LEFT JOIN users u ON u.partner_code = p.code
    LEFT JOIN credit_charges cc ON cc.partner_code = p.code AND cc.status = 'completed'
    GROUP BY p.code
    ORDER BY p.created_at DESC
  `).all()

  return c.json({ success: true, data: rows.results })
})

// 파트너 등록
app.post('/api/admin/partners', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const body = await c.req.json() as Record<string, unknown>
  const { code, name, sso_secret, revenue_share_rate, welcome_message, featured_tests, primary_color, logo_url, contact_email, commission_start, commission_end,
          entry_headline, entry_subcopy, entry_benefit, entry_cta_label, entry_cta_go } = body

  if (!code || !name) return c.json({ success: false, error: 'code, name 필수' }, 400)
  const codeStr = String(code).toUpperCase().replace(/[^A-Z0-9_]/g, '')
  if (!codeStr) return c.json({ success: false, error: '코드는 영문 대문자/숫자/언더스코어만 허용' }, 400)

  const existing = await DB.prepare("SELECT code FROM partners WHERE code=?").bind(codeStr).first()
  if (existing) return c.json({ success: false, error: '이미 존재하는 파트너 코드' }, 409)

  const s = (v: unknown) => (v ? String(v) : null)
  await DB.prepare(`
    INSERT INTO partners (code, name, sso_secret, revenue_share_rate, welcome_message, featured_tests, primary_color, logo_url, contact_email, commission_start, commission_end, entry_headline, entry_subcopy, entry_benefit, entry_cta_label, entry_cta_go)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    codeStr, String(name),
    s(sso_secret),
    Number(revenue_share_rate ?? 0),
    s(welcome_message), s(featured_tests), s(primary_color), s(logo_url), s(contact_email),
    s(commission_start), s(commission_end),
    s(entry_headline), s(entry_subcopy), s(entry_benefit), s(entry_cta_label), s(entry_cta_go),
  ).run()

  return c.json({ success: true, data: { code: codeStr } }, 201)
})

// 파트너 수정
app.patch('/api/admin/partners/:code', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json() as Record<string, unknown>
  const allowed = ['name','sso_secret','revenue_share_rate','welcome_message','featured_tests','primary_color','logo_url','contact_email','is_active','commission_start','commission_end','entry_headline','entry_subcopy','entry_benefit','entry_cta_label','entry_cta_go']
  const sets: string[] = []
  const vals: unknown[] = []

  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k}=?`); vals.push(body[k] ?? null); }
  }
  if (sets.length === 0) return c.json({ success: false, error: '변경 사항 없음' }, 400)

  vals.push(code)
  await DB.prepare(`UPDATE partners SET ${sets.join(',')} WHERE code=?`).bind(...vals).run()
  return c.json({ success: true })
})

// 파트너별 통계 (가입자, 결제, 매출)
app.get('/api/admin/partner-stats', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const { code, from, to } = c.req.query() as Record<string, string>
  if (!code) return c.json({ success: false, error: 'code 파라미터 필수' }, 400)

  const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const toDate   = to   ?? new Date().toISOString().slice(0, 10)

  const [userStats, chargeStats, dailySignups, dailyRevenue] = await Promise.all([
    DB.prepare(`
      SELECT COUNT(*) AS total, SUM(CASE WHEN date(created_at) >= ? AND date(created_at) <= ? THEN 1 ELSE 0 END) AS period
      FROM users WHERE partner_code=?
    `).bind(fromDate, toDate, code).first<{ total: number; period: number }>(),

    DB.prepare(`
      SELECT COUNT(*) AS total_charges,
             COALESCE(SUM(amount), 0) AS total_revenue,
             COALESCE(SUM(CASE WHEN date(created_at) >= ? AND date(created_at) <= ? THEN amount ELSE 0 END), 0) AS period_revenue
      FROM credit_charges WHERE partner_code=? AND status='completed'
    `).bind(fromDate, toDate, code).first<{ total_charges: number; total_revenue: number; period_revenue: number }>(),

    DB.prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS cnt
      FROM users WHERE partner_code=? AND date(created_at) >= ? AND date(created_at) <= ?
      GROUP BY day ORDER BY day
    `).bind(code, fromDate, toDate).all(),

    DB.prepare(`
      SELECT date(created_at) AS day, COALESCE(SUM(amount),0) AS revenue, COUNT(*) AS cnt
      FROM credit_charges WHERE partner_code=? AND status='completed'
        AND date(created_at) >= ? AND date(created_at) <= ?
      GROUP BY day ORDER BY day
    `).bind(code, fromDate, toDate).all(),
  ])

  const partner = await DB.prepare("SELECT name, revenue_share_rate FROM partners WHERE code=?")
    .bind(code).first<{ name: string; revenue_share_rate: number }>()

  const periodRevenue = chargeStats?.period_revenue ?? 0
  const shareRate = partner?.revenue_share_rate ?? 0

  return c.json({
    success: true,
    data: {
      partner: { code, name: partner?.name ?? code, revenue_share_rate: shareRate },
      period: { from: fromDate, to: toDate },
      users: { total: userStats?.total ?? 0, period: userStats?.period ?? 0 },
      charges: { total_charges: chargeStats?.total_charges ?? 0, total_revenue: chargeStats?.total_revenue ?? 0, period_revenue: periodRevenue },
      settlement: { period_revenue: periodRevenue, share_amount: Math.floor(periodRevenue * shareRate) },
      daily: { signups: dailySignups.results, revenue: dailyRevenue.results },
    },
  })
})

// 파트너 정산 리포트 (월별)
app.get('/api/admin/partner-settlement', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)

  const { code, month } = c.req.query() as Record<string, string>
  if (!code || !month) return c.json({ success: false, error: 'code, month 파라미터 필수 (month: YYYY-MM)' }, 400)

  const partner = await DB.prepare("SELECT code, name, revenue_share_rate, contact_email FROM partners WHERE code=?")
    .bind(code.toUpperCase()).first<{ code: string; name: string; revenue_share_rate: number; contact_email: string | null }>()
  if (!partner) return c.json({ success: false, error: '파트너를 찾을 수 없습니다.' }, 404)

  const fromDate = `${month}-01`
  const toDate   = new Date(new Date(fromDate).getFullYear(), new Date(fromDate).getMonth() + 1, 0).toISOString().slice(0, 10)

  const [newUsers, charges] = await Promise.all([
    DB.prepare(`
      SELECT COUNT(*) AS cnt FROM users
      WHERE partner_code=? AND date(created_at) >= ? AND date(created_at) <= ?
    `).bind(code.toUpperCase(), fromDate, toDate).first<{ cnt: number }>(),

    DB.prepare(`
      SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total
      FROM credit_charges
      WHERE partner_code=? AND status='completed' AND date(created_at) >= ? AND date(created_at) <= ?
    `).bind(code.toUpperCase(), fromDate, toDate).first<{ cnt: number; total: number }>(),
  ])

  const totalRevenue = charges?.total ?? 0
  const shareAmount  = Math.floor(totalRevenue * partner.revenue_share_rate)

  return c.json({
    success: true,
    data: {
      partner: { code: partner.code, name: partner.name, contact_email: partner.contact_email },
      month,
      new_users: newUsers?.cnt ?? 0,
      paid_users: charges?.cnt ?? 0,
      total_revenue: totalRevenue,
      share_rate: partner.revenue_share_rate,
      share_amount: shareAmount,
      maumful_revenue: totalRevenue - shareAmount,
    },
  })
})

// ── 파트너 정산 원장 조회 (제휴코드별 상세 내역 — CSV 다운로드용) ──
//   partner_commissions(적립 시점 율 스냅샷)에서 조회. 기간(from~to)·상태 필터. 개인정보는 마스킹.
app.get('/api/admin/partner-commissions', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const { code, from, to, status } = c.req.query() as Record<string, string>
  if (!code) return c.json({ success: false, error: 'code 파라미터 필수' }, 400)
  const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const toDate   = to   ?? new Date().toISOString().slice(0, 10)
  const conds = ['pc.partner_code=?', 'date(pc.created_at) >= ?', 'date(pc.created_at) <= ?']
  const binds: unknown[] = [code.toUpperCase(), fromDate, toDate]
  if (status && ['pending', 'settled', 'reversed'].includes(status)) { conds.push('pc.status=?'); binds.push(status) }
  const rows = await DB.prepare(`
    SELECT pc.charge_id, pc.charge_amount, pc.rate, pc.share_amount, pc.currency, pc.status,
           pc.created_at, pc.settled_at, pc.settlement_ref,
           SUBSTR(u.email,1,3) || '***' AS user_email_masked, cc.package_key
    FROM partner_commissions pc
    LEFT JOIN users u ON u.id = pc.user_id
    LEFT JOIN credit_charges cc ON cc.id = pc.charge_id
    WHERE ${conds.join(' AND ')}
    ORDER BY pc.created_at DESC
  `).bind(...binds).all()
  const totals = await DB.prepare(`
    SELECT COUNT(*) AS cnt, COALESCE(SUM(charge_amount),0) AS revenue, COALESCE(SUM(share_amount),0) AS share,
           COALESCE(SUM(CASE WHEN status='pending' THEN share_amount ELSE 0 END),0) AS unsettled
    FROM partner_commissions pc WHERE ${conds.join(' AND ')}
  `).bind(...binds).first()
  return c.json({ success: true, data: { code: code.toUpperCase(), period: { from: fromDate, to: toDate }, totals, rows: rows.results } })
})

// ── 파트너 정산 완료 표시 (지급 완료한 pending 건을 settled로) ──
app.post('/api/admin/partner-commissions/settle', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const { code, from, to, ref } = await c.req.json().catch(() => ({})) as { code?: string; from?: string; to?: string; ref?: string }
  if (!code || !from || !to) return c.json({ success: false, error: 'code, from, to 필수' }, 400)
  const r = await DB.prepare(
    "UPDATE partner_commissions SET status='settled', settled_at=datetime('now'), settlement_ref=? WHERE partner_code=? AND status='pending' AND date(created_at) >= ? AND date(created_at) <= ?"
  ).bind(ref ?? null, code.toUpperCase(), from, to).run()
  return c.json({ success: true, settled: r.meta.changes })
})

// ============================================================
// 파트너 담당자 포털 (제휴사 담당자 전용 로그인 → 자기 정산만 조회)
//  격리 원칙: 조회 대상 코드는 오직 토큰(typ=partner)의 pc에서만 가져온다.
//  파트너 토큰은 sub(숫자)가 없어 고객 인증(getAuthUserId)에서 거부되고,
//  관리자(ADMIN_SECRET)와도 분리 → 다른 파트너/전체 매출 접근 불가.
// ============================================================

// 파트너 포털 토큰 검증 → { partnerCode, accountId } | null
async function requirePartner(c: { req: { header: (k: string) => string | undefined }, env: Bindings }): Promise<{ partnerCode: string; accountId: number } | null> {
  const auth = c.req.header('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const secret = await getJwtSecret(c.env.KV)
  const p = await verifyJwt(auth.slice(7), secret)
  if (!p || p.typ !== 'partner' || typeof p.pc !== 'string' || typeof p.aid !== 'number') return null
  return { partnerCode: p.pc as string, accountId: p.aid as number }
}

// 파트너 담당자 로그인
app.post('/api/partner-portal/login', async (c) => {
  const { DB, KV } = c.env
  const { email, password } = await c.req.json().catch(() => ({})) as { email?: string; password?: string }
  if (!email || !password) return c.json({ success: false, error: '이메일과 비밀번호를 입력해 주세요.' }, 400)
  const emailNorm = String(email).trim().toLowerCase()

  // 간단 시도 제한 (이메일 기준 15분 10회)
  const rlKey = `pp_login:${emailNorm}`
  const tries = parseInt((await KV.get(rlKey)) || '0', 10) || 0
  if (tries >= 10) return c.json({ success: false, error: '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.' }, 429)

  const acc = await DB.prepare(
    'SELECT id, partner_code, password_hash, is_active FROM partner_accounts WHERE email=?'
  ).bind(emailNorm).first() as { id: number; partner_code: string; password_hash: string; is_active: number } | null

  const okPw = acc ? await verifyPassword(password, acc.password_hash) : false
  if (!acc || !okPw || !acc.is_active) {
    await KV.put(rlKey, String(tries + 1), { expirationTtl: 900 })
    return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않거나 비활성화된 계정입니다.' }, 401)
  }

  // 파트너 자체가 비활성이면 차단
  const partner = await DB.prepare('SELECT code, name, is_active FROM partners WHERE code=?')
    .bind(acc.partner_code).first() as { code: string; name: string; is_active: number } | null
  if (!partner || !partner.is_active) return c.json({ success: false, error: '연결된 제휴사가 비활성 상태입니다. 운영자에게 문의해 주세요.' }, 403)

  await KV.delete(rlKey)
  await DB.prepare("UPDATE partner_accounts SET last_login_at=datetime('now') WHERE id=?").bind(acc.id).run()

  const now = Math.floor(Date.now() / 1000)
  const secret = await getJwtSecret(KV)
  // sub(숫자) 없음 → 고객 API에서 거부. typ=partner + pc(코드) + aid(계정)만.
  const token = await signJwt({ typ: 'partner', pc: acc.partner_code, aid: acc.id, iat: now, exp: now + 8 * 3600 }, secret)
  return c.json({ success: true, data: { token, partner: { code: partner.code, name: partner.name } } })
})

// 파트너 포털 내 정보(헤더용)
app.get('/api/partner-portal/me', async (c) => {
  const p = await requirePartner(c)
  if (!p) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
  const partner = await c.env.DB.prepare('SELECT code, name FROM partners WHERE code=?').bind(p.partnerCode).first()
  if (!partner) return c.json({ success: false, error: '제휴사를 찾을 수 없습니다.' }, 404)
  return c.json({ success: true, data: { partner } })
})

// 파트너 정산 조회 — 코드는 토큰에서만. 최소 집계(고객 식별정보·상품 미노출).
app.get('/api/partner-portal/commissions', async (c) => {
  const p = await requirePartner(c)
  if (!p) return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
  const { DB } = c.env
  const { from, to } = c.req.query() as Record<string, string>
  const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const toDate   = to   ?? new Date().toISOString().slice(0, 10)
  const binds = [p.partnerCode, fromDate, toDate]
  const where = 'partner_code=? AND date(created_at) >= ? AND date(created_at) <= ?'
  const rows = await DB.prepare(`
    SELECT charge_id, charge_amount, rate, share_amount, currency, status, created_at, settled_at
    FROM partner_commissions WHERE ${where} ORDER BY created_at DESC
  `).bind(...binds).all()
  const totals = await DB.prepare(`
    SELECT COUNT(*) AS cnt, COALESCE(SUM(charge_amount),0) AS revenue, COALESCE(SUM(share_amount),0) AS share,
           COALESCE(SUM(CASE WHEN status='pending' THEN share_amount ELSE 0 END),0) AS unsettled,
           COALESCE(SUM(CASE WHEN status='settled' THEN share_amount ELSE 0 END),0) AS settled
    FROM partner_commissions WHERE ${where}
  `).bind(...binds).first()
  return c.json({ success: true, data: { period: { from: fromDate, to: toDate }, totals, rows: rows.results } })
})

// ── 관리자: 파트너 담당자 계정 관리 (adminGuard) ──
app.get('/api/admin/partner-accounts', async (c) => {
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const code = (c.req.query('code') || '').toUpperCase()
  if (!code) return c.json({ success: false, error: 'code 파라미터 필수' }, 400)
  const rows = await c.env.DB.prepare(
    'SELECT id, partner_code, email, is_active, last_login_at, created_at FROM partner_accounts WHERE partner_code=? ORDER BY created_at DESC'
  ).bind(code).all()
  return c.json({ success: true, data: rows.results })
})

app.post('/api/admin/partner-accounts', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const { code, email, password } = await c.req.json().catch(() => ({})) as { code?: string; email?: string; password?: string }
  const codeStr = String(code || '').toUpperCase()
  const emailNorm = String(email || '').trim().toLowerCase()
  if (!codeStr || !emailNorm || !password) return c.json({ success: false, error: 'code, email, password 필수' }, 400)
  if (String(password).length < 8) return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
  const partner = await DB.prepare('SELECT code FROM partners WHERE code=?').bind(codeStr).first()
  if (!partner) return c.json({ success: false, error: '존재하지 않는 파트너 코드입니다.' }, 404)
  const dup = await DB.prepare('SELECT id FROM partner_accounts WHERE email=?').bind(emailNorm).first()
  if (dup) return c.json({ success: false, error: '이미 등록된 이메일입니다.' }, 409)
  const hash = await hashPassword(String(password))
  const r = await DB.prepare(
    'INSERT INTO partner_accounts (partner_code, email, password_hash) VALUES (?, ?, ?)'
  ).bind(codeStr, emailNorm, hash).run()
  return c.json({ success: true, data: { id: r.meta.last_row_id, email: emailNorm } }, 201)
})

app.patch('/api/admin/partner-accounts/:id', async (c) => {
  const { DB } = c.env
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const id = parseInt(c.req.param('id'), 10)
  if (!id) return c.json({ success: false, error: '잘못된 계정 ID' }, 400)
  const body = await c.req.json().catch(() => ({})) as { is_active?: number | boolean; password?: string }
  const sets: string[] = []
  const vals: unknown[] = []
  if (body.is_active !== undefined) { sets.push('is_active=?'); vals.push(body.is_active ? 1 : 0) }
  if (body.password !== undefined) {
    if (String(body.password).length < 8) return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
    sets.push('password_hash=?'); vals.push(await hashPassword(String(body.password)))
  }
  if (sets.length === 0) return c.json({ success: false, error: '변경 사항 없음' }, 400)
  vals.push(id)
  await DB.prepare(`UPDATE partner_accounts SET ${sets.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ success: true })
})

app.delete('/api/admin/partner-accounts/:id', async (c) => {
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  const id = parseInt(c.req.param('id'), 10)
  if (!id) return c.json({ success: false, error: '잘못된 계정 ID' }, 400)
  await c.env.DB.prepare('DELETE FROM partner_accounts WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

// ── POST /api/admin/push/reminder — 6주 재검사 알림 수동 트리거 ─
app.post('/api/admin/push/reminder', async (c) => {
  const denied = adminGuard(c)
  if (denied) return c.json({ success: false, error: denied }, denied === 'Forbidden' ? 403 : 401)
  await handleDailyReminder(c.env)
  return c.json({ success: true })
})

// ── POST /api/user/cookie-consent ─────────────────────────
// 마케팅 쿠키 동의/거부를 KV에 저장 (LocalStorage 보완)
app.post('/api/user/cookie-consent', async (c) => {
  const { KV } = c.env
  const { consent } = await c.req.json() as { consent: 'accepted' | 'rejected' }
  // 비로그인 시 IP 기반 키 사용
  const userId = await getAuthUserId(c.req.raw, KV)
  const key = userId ? `cookie_consent:${userId}` : `cookie_consent:ip:${c.req.header('cf-connecting-ip') || 'unknown'}`
  await KV.put(key, JSON.stringify({ consent, timestamp: new Date().toISOString() }), { expirationTtl: 365 * 86400 })
  return c.json({ success: true })
})

app.get('/api/user/cookie-consent', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  const key = userId ? `cookie_consent:${userId}` : `cookie_consent:ip:${c.req.header('cf-connecting-ip') || 'unknown'}`
  const val = await KV.get(key)
  return c.json({ success: true, data: val ? JSON.parse(val) : null })
})


export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Bindings) {
    await handleScheduled(env)  // 월 1일: 구독 자동 갱신 + 푸시 알림
  },
}
