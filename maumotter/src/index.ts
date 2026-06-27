// 마음수달 (MaumOtter) — Worker (Hono). MVP.
// 계정/인증은 공용 maum-auth(AUTH_DB) + 공유 모듈 ./auth (마음곁과 동일 사본).
// 안전원칙(단정금지·의료용어금지·비밀거짓말금지·위기 보수판정)은 docs/ 준수.
import { Hono } from 'hono';
import { registerUser, loginUser, getUser, issueToken, requireAuth, hashPassword, verifyPassword, deleteUser, findByEmail, setPassword, markEmailVerified, isEmailVerified } from './auth';

type Bindings = {
  DB: D1Database;          // 마음수달 도메인 (children/sessions/utterances/reports)
  AUTH_DB: D1Database;     // 공용 maum-auth (users) — 마음곁과 공유
  KV: KVNamespace;
  ASSETS: Fetcher;
  JWT_SECRET: string;      // 마음 시리즈 공유
  ANTHROPIC_API_KEY: string;
  ADMIN_SECRET?: string;   // 쿠폰 발행 어드민
  RESEND_API_KEY?: string; // 이메일 발송(비번재설정·이메일인증)
  EMAIL_FROM?: string;
  MAUM_SSO_SECRET?: string; // 마음풀↔마음수달 SSO 공유 시크릿(HMAC)
  OPENAI_API_KEY?: string;  // 또또 음성(TTS) — 미설정 시 프론트는 기기 음성 폴백
};

const app = new Hono<{ Bindings: Bindings; Variables: { uid: number } }>();

// ── CORS (마음 시리즈 공통 화이트리스트, _shared 3장) ──────────
const ALLOWED = [
  'https://maumotter.com', 'https://app.maumotter.com',
  'https://maumgyeot.com', 'https://app.maumgyeot.com',
];
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  await next();
  if (ALLOWED.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }
});
app.options('/api/*', (c) => {
  const origin = c.req.header('Origin') || '';
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
  if (ALLOWED.includes(origin)) { h['Access-Control-Allow-Origin'] = origin; h['Access-Control-Allow-Credentials'] = 'true'; }
  return new Response(null, { status: 204, headers: h });
});

// ── Anthropic 호출 ────────────────────────────────────────────
// Anthropic은 Cloudflare AI Gateway 경유(직접 api.anthropic.com 호출은 Workers egress에서 403 차단됨)
const AI_GATEWAY = 'https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages';
// OpenAI(TTS)도 동일 게이트웨이 경유 — 직접 api.openai.com은 Workers egress에서 403(unsupported_country_region) 차단됨
const OPENAI_GATEWAY = 'https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/openai';
async function callClaude(env: Bindings, opts: { model: string; system: string; messages: any[]; max_tokens: number; temperature?: number }) {
  const once = async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(AI_GATEWAY, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: opts.model, max_tokens: opts.max_tokens, temperature: opts.temperature ?? 1, system: opts.system, messages: opts.messages }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('LLM ' + res.status + ' ' + (await res.text()).slice(0, 300));
      const data = await res.json() as any;
      return (data.content?.find((b: any) => b.type === 'text')?.text ?? '').trim();
    } finally { clearTimeout(to); }
  };
  try { return await once(); } catch { return await once(); }
}

// ── 레이트리밋(KV 버킷, 마음풀 패턴) ──
async function checkRateLimit(kv: KVNamespace, key: string, limit: number, windowSec = 60): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const k = `rl:${key}:${bucket}`;
  try {
    const cur = parseInt((await kv.get(k)) || '0', 10);
    if (cur >= limit) return false;
    kv.put(k, String(cur + 1), { expirationTtl: windowSec * 2 }).catch(() => {});
    return true;
  } catch { return true; }
}
const clientIp = (c: any) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

// ── 유료/쿼터 엔진 (통역 단위 = 세션 1건). 마음곁과 동일. ──
const FREE_MONTHLY = 5;   // 가입자 월 무료 세션
const PLAN: Record<string, { plan: string; quota: number; days: number }> = {
  sub_light: { plan: 'light', quota: 30, days: 30 },
  sub_pro: { plan: 'pro', quota: 100, days: 30 },
};
const PACK: Record<string, { count: number; days: number }> = { pack10: { count: 10, days: 60 } };
const ym = () => { const d = new Date(); return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

async function getEntitlement(env: Bindings, uid: number) {
  const now = nowIso(); const m = ym();
  const sub = await env.DB.prepare('SELECT plan,monthly_quota,expires_at FROM subscriptions WHERE maum_user_id=?').bind(uid).first<any>();
  const subActive = !!(sub && sub.expires_at > now);
  const subQuota = subActive ? sub.monthly_quota : 0;
  const used = (await env.DB.prepare('SELECT used FROM usage_monthly WHERE maum_user_id=? AND ym=?').bind(uid, m).first<any>())?.used || 0;
  const pack = await env.DB.prepare('SELECT remaining,expires_at FROM packs WHERE maum_user_id=?').bind(uid).first<any>();
  const packRemaining = (pack && pack.remaining > 0 && (!pack.expires_at || pack.expires_at > now)) ? pack.remaining : 0;
  const monthlyAllowance = FREE_MONTHLY + subQuota;
  const monthlyRemaining = Math.max(0, monthlyAllowance - used);
  return { plan: subActive ? sub.plan : 'free', subActive, subExpires: subActive ? sub.expires_at : null,
    freeMonthly: FREE_MONTHLY, monthlyAllowance, used, monthlyRemaining, packRemaining, totalRemaining: monthlyRemaining + packRemaining };
}
async function consumeQuota(env: Bindings, uid: number): Promise<{ ok: boolean; source?: string }> {
  const e = await getEntitlement(env, uid);
  if (e.monthlyRemaining > 0) {
    await env.DB.prepare("INSERT INTO usage_monthly (maum_user_id,ym,used) VALUES (?,?,1) ON CONFLICT(maum_user_id,ym) DO UPDATE SET used=used+1").bind(uid, ym()).run();
    return { ok: true, source: e.used < e.freeMonthly ? 'free' : 'subscription' };
  }
  if (e.packRemaining > 0) {
    await env.DB.prepare("UPDATE packs SET remaining=remaining-1, updated_at=datetime('now') WHERE maum_user_id=?").bind(uid).run();
    return { ok: true, source: 'pack' };
  }
  return { ok: false };
}
const normCode = (s: any) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
async function applyGrant(env: Bindings, uid: number, type: string) {
  const now = nowIso();
  if (PLAN[type]) {
    const g = PLAN[type];
    const sub = await env.DB.prepare('SELECT expires_at,monthly_quota FROM subscriptions WHERE maum_user_id=?').bind(uid).first<any>();
    const base = sub && sub.expires_at > now ? new Date(sub.expires_at).getTime() : Date.now();
    const newExpires = new Date(base + g.days * 86400000).toISOString();
    const quota = Math.max(g.quota, sub?.monthly_quota || 0);
    const plan = quota >= 100 ? 'pro' : g.plan;
    await env.DB.prepare("INSERT INTO subscriptions (maum_user_id,plan,monthly_quota,expires_at,updated_at) VALUES (?,?,?,?,datetime('now')) ON CONFLICT(maum_user_id) DO UPDATE SET plan=excluded.plan,monthly_quota=excluded.monthly_quota,expires_at=excluded.expires_at,updated_at=datetime('now')")
      .bind(uid, plan, quota, newExpires).run();
    return { kind: 'subscription', plan, expires_at: newExpires };
  }
  if (PACK[type]) {
    const g = PACK[type];
    const pack = await env.DB.prepare('SELECT remaining FROM packs WHERE maum_user_id=?').bind(uid).first<any>();
    const remaining = (pack?.remaining || 0) + g.count;
    const expires = addDays(g.days);
    await env.DB.prepare("INSERT INTO packs (maum_user_id,remaining,expires_at,updated_at) VALUES (?,?,?,datetime('now')) ON CONFLICT(maum_user_id) DO UPDATE SET remaining=excluded.remaining,expires_at=excluded.expires_at,updated_at=datetime('now')")
      .bind(uid, remaining, expires).run();
    return { kind: 'pack', remaining };
  }
  throw new Error('UNKNOWN_TYPE');
}
function requireAdmin(c: any): 'ok' | 'unset' | 'unauth' {
  if (!c.env.ADMIN_SECRET) return 'unset';
  return (c.req.header('Authorization') || '') === `Bearer ${c.env.ADMIN_SECRET}` ? 'ok' : 'unauth';
}
const genCode = (len = 8) => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint8Array(len)); let s = ''; for (let i = 0; i < len; i++) s += A[r[i] % A.length]; return s; };
// 마음풀 SSO 토큰 검증(payload_b64u.sig_b64u, HMAC-SHA256). 반환=payload | null
async function verifySso(secret: string, token: string): Promise<any | null> {
  try {
    const i = String(token).lastIndexOf('.');
    if (i < 0) return null;
    const payloadB64 = token.slice(0, i), sig = token.slice(i + 1);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expSig = btoa(String.fromCharCode(...new Uint8Array(expBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (expSig !== sig) return null;
    return JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}
// 운영 에러 로그(모니터링) — best-effort
async function logError(env: Bindings, place: string, e: any) {
  try { await env.DB.prepare('INSERT INTO error_logs (place,message) VALUES (?,?)').bind(String(place).slice(0, 80), String((e && e.message) || e).slice(0, 500)).run(); } catch {}
}
// 이메일 발송(Resend) — RESEND_API_KEY 미설정 시 no-op(false). 기존 흐름 무영향.
async function sendEmail(env: Bindings, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: env.EMAIL_FROM || '마음수달 <noreply@maumotter.com>', to, subject, html }),
    });
    if (!res.ok) { await logError(env, 'email', 'resend ' + res.status + ' ' + (await res.text()).slice(0, 200)); return false; }
    return true;
  } catch (e) { await logError(env, 'email', e); return false; }
}
const emailWrap = (title: string, body: string, btn: string, link: string) => `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
<h2 style="color:#3B6FB5">${title}</h2>${body}
<p style="margin:20px 0"><a href="${link}" style="background:#3B6FB5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">${btn}</a></p>
<p style="color:#888;font-size:12px">버튼이 안 되면 이 링크를 복사해 주세요:<br>${link}</p></div>`;
const verifyEmailHtml = (link: string) => emailWrap('마음수달 이메일 인증', '<p>아래 버튼을 눌러 이메일 인증을 완료해 주세요.</p>', '이메일 인증하기', link);
const resetEmailHtml = (link: string) => emailWrap('마음수달 비밀번호 재설정', '<p>아래 버튼을 눌러 새 비밀번호를 설정해 주세요. (요청 후 1시간 내 유효)</p>', '비밀번호 재설정', link);

const CHAT_MODEL = 'claude-haiku-4-5-20251001';
const REPORT_MODEL = 'claude-sonnet-4-6';

// 또또 대화 시스템 프롬프트 (docs/maumotter-dialogue-scenarios.md)
function ottoSystem(age: number | null, name: string, buddy?: string) {
  const B = buddy === '라라' ? '라라' : '또또';
  const trait = B === '라라'
    ? '밝고 발랄해요. 신나게 맞장구치고("우와~", "정말?!") 호기심 많게 반응. 그래도 아이 말을 끝까지 따뜻하게 들어요.'
    : '차분하고 포근해요. 천천히 다정하게 공감하고("그랬구나~", "괜찮아") 안정감을 줘요.';
  return `당신은 아이의 마음을 들어주는 친구 '${B}'입니다. ${name ? name + '(이)라는 ' : ''}${age ?? 7}세 아이와 대화합니다.
[성격] ${B}는 ${trait} (성격은 말투에만 반영하고, 아래 안전·화법 규칙은 동일하게 지킨다.)
[화법] 1인칭 투사 화법("${B}는 그런 날엔 ~"), 캐묻지 않기, 단정 금지("~구나" 대신 "~했을까?"), 한 번에 1~2문장 짧고 따뜻하게.
[호칭] 자기 자신은 항상 '${B}'라고만 부른다. '수달'이라는 단어로 자신을 칭하지 않는다(어색함).
[연령] ${age && age <= 5 ? '아주 짧고 쉬운 단어, 선택지 제시' : age && age >= 8 ? '감정 단어를 조금 넓혀 대화' : '짧은 문장, 구체적 질문 하나씩'}.
[금지] 진단·평가·의료용어 금지. "비밀로 할게" 금지(→ "엄마/아빠가 너를 더 잘 이해하도록 ${B}가 도와줄게"). 추궁·유도신문 금지. 위기 상황이어도 신고·해결·위기 이야기를 아이에게 꺼내지 말 것(평소처럼 따뜻하게 안전감만).
[목표] 아이가 편하게 자기 마음을 더 말하도록 돕기. 답을 요구받으면 "${B}는 잘 모르겠어, 네 생각이 더 궁금해!".
한국어로, ${B}의 다음 한 마디만 출력하세요(설명·따옴표 없이).`;
}

// 통역 시스템 프롬프트 (docs/maumotter-translation-engine.md)
const TRANSLATE_SYSTEM = `당신은 '마음수달'의 정서 통역가입니다. 아이가 수달 '또또'와 나눈 대화를 읽고, 그 속마음을 양육자(부모)가 이해·대응할 수 있도록 통역합니다.
[원칙] 진단·평가하지 않고 '통역'만. AI는 아이와 부모 사이의 다리.
[절대금지] 의료·임상 용어(진단/치료/처방/장애/증상/우울증/불안장애/ADHD 등) 금지. 단정 금지("~인 것 같아요/~로 보여요"만). 부모 비난·죄책감 금지. 대화에 나타난 내용에만 근거(정보 적으면 적다고 말함).
[위기] 학대·방임·자해·심각한 공포가 대화에 '명시적으로' 나타난 경우에만 crisis.flag=true. 애매하면 false + note에 부드럽게. true여도 부모 놀라지 않게 전문기관 상담 권유 톤.
[출력] 아래 JSON 스키마로만, JSON 외 텍스트/코드블록 절대 금지:
{"summary":"2~3문장 따뜻한 요약(단정X)","feelings":["감정 키워드, 없으면 []"],"what_happened":"상황·맥락 정리","parent_tips":["오늘 할 수 있는 따뜻한 행동 2~3개(비훈육)"],"talk_starters":["아이에게 건넬 말 1~2개"],"data_confidence":"low|medium|high","crisis":{"flag":false,"note":""}}`;

const MED_TERMS = ['진단', '치료', '처방', '장애', '증상', '우울증', '불안장애', 'ADHD', '자폐', '정신과'];

// ════════════════════ API ════════════════════
app.get('/api/health', (c) => c.json({ ok: true }));

// ── 인증 (공용 maum-auth) ──
app.post('/api/auth/register', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `register:${clientIp(c)}`, 5, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { email, password, name, ref } = await c.req.json().catch(() => ({}));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return c.json({ error: '올바른 이메일을 입력해주세요' }, 400);
  if (!password || String(password).length < 8) return c.json({ error: '이메일과 8자 이상 비밀번호가 필요해요' }, 400);
  try {
    const user = await registerUser(c.env.AUTH_DB, { email, password, name });
    if (ref) { try { await c.env.DB.prepare('INSERT OR IGNORE INTO referrals (maum_user_id,ref) VALUES (?,?)').bind(user.id, String(ref).slice(0, 64)).run(); } catch {} }
    if (c.env.RESEND_API_KEY) {
      const vtok = genCode(24);
      await c.env.KV.put(`emailverify:${vtok}`, String(user.id), { expirationTtl: 7 * 86400 });
      await sendEmail(c.env, user.email, '[마음수달] 이메일 인증', verifyEmailHtml(new URL(c.req.url).origin + '/verify?token=' + vtok));
    }
    return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
  } catch (e: any) {
    if (e?.message === 'DUPLICATE_EMAIL') return c.json({ error: '이미 가입된 이메일이에요' }, 409);
    return c.json({ error: '가입 처리 중 문제가 생겼어요' }, 500);
  }
});
app.post('/api/auth/login', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `login:${clientIp(c)}`, 10, 60))) return c.json({ error: '시도가 너무 많아요. 잠시 후 다시 시도해주세요.' }, 429);
  const { email, password } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
  const user = await loginUser(c.env.AUTH_DB, { email, password });
  if (!user) return c.json({ error: '이메일 또는 비밀번호가 맞지 않아요' }, 401);
  return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
});
app.get('/api/auth/me', requireAuth, async (c) => {
  return c.json({ user: await getUser(c.env.AUTH_DB, c.get('uid')), email_verified: await isEmailVerified(c.env.AUTH_DB, c.get('uid')), email_required: !!c.env.RESEND_API_KEY });
});

// ── 비밀번호 재설정 / 이메일 인증 (RESEND 미설정 시 no-op) ──
app.post('/api/auth/forgot-password', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `forgot:${clientIp(c)}`, 5, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { email } = await c.req.json().catch(() => ({}));
  if (email && c.env.RESEND_API_KEY) {
    const u = await findByEmail(c.env.AUTH_DB, String(email));
    if (u) {
      const tok = genCode(24);
      await c.env.KV.put(`pwreset:${tok}`, String(u.id), { expirationTtl: 3600 });
      await sendEmail(c.env, u.email, '[마음수달] 비밀번호 재설정', resetEmailHtml(new URL(c.req.url).origin + '/reset?token=' + tok));
    }
  }
  return c.json({ ok: true });
});
app.post('/api/auth/reset-password', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `resetpw:${clientIp(c)}`, 5, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { token, password } = await c.req.json().catch(() => ({}));
  if (!password || String(password).length < 8) return c.json({ error: '비밀번호는 8자 이상이어야 해요' }, 400);
  const uid = token ? await c.env.KV.get(`pwreset:${token}`) : null;
  if (!uid) return c.json({ error: '링크가 만료되었거나 유효하지 않아요. 다시 요청해 주세요.' }, 400);
  await setPassword(c.env.AUTH_DB, Number(uid), String(password));
  await c.env.KV.delete(`pwreset:${token}`);
  return c.json({ ok: true });
});
app.post('/api/auth/resend-verify', requireAuth, async (c) => {
  if (!c.env.RESEND_API_KEY) return c.json({ error: '이메일 발송이 아직 설정되지 않았어요' }, 503);
  if (!(await checkRateLimit(c.env.KV, `resendv:${c.get('uid')}`, 3, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const u = await getUser(c.env.AUTH_DB, c.get('uid'));
  if (!u) return c.json({ error: '계정을 찾을 수 없어요' }, 404);
  const vtok = genCode(24);
  await c.env.KV.put(`emailverify:${vtok}`, String(u.id), { expirationTtl: 7 * 86400 });
  await sendEmail(c.env, u.email, '[마음수달] 이메일 인증', verifyEmailHtml(new URL(c.req.url).origin + '/verify?token=' + vtok));
  return c.json({ ok: true });
});

// ── 마음풀 SSO 수신 — 마음풀 계정으로 단일로그인(이메일로 수달 계정 자동 연결, 결제는 수달 자체 유지) ──
app.post('/api/auth/sso', async (c) => {
  const secret = c.env.MAUM_SSO_SECRET;
  if (!secret) return c.json({ error: 'SSO가 설정되지 않았어요' }, 503);
  if (!(await checkRateLimit(c.env.KV, `sso:${clientIp(c)}`, 20, 60))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { sso } = await c.req.json().catch(() => ({}));
  const payload = sso ? await verifySso(secret, String(sso)) : null;
  if (!payload) return c.json({ error: 'SSO 검증 실패' }, 401);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return c.json({ error: 'SSO 토큰이 만료되었어요' }, 401);
  const email = String(payload.email || '').toLowerCase();
  if (!email) return c.json({ error: '이메일이 없는 토큰' }, 400);
  let user = await findByEmail(c.env.AUTH_DB, email);
  if (!user) {
    try { user = await registerUser(c.env.AUTH_DB, { email, password: crypto.randomUUID() + crypto.randomUUID() }); }
    catch { user = await findByEmail(c.env.AUTH_DB, email); }
  }
  if (!user) return c.json({ error: '계정 처리 실패' }, 500);
  await markEmailVerified(c.env.AUTH_DB, user.id);
  return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
});

// ── 부모 PIN (아이 모드 게이팅, spec 2-2) — KV 저장 ──
const pinKey = (uid: number) => `pin:${uid}`;
app.get('/api/pin', requireAuth, async (c) => {
  const has = !!(await c.env.KV.get(pinKey(c.get('uid'))));
  return c.json({ hasPin: has });
});
app.post('/api/pin', requireAuth, async (c) => {
  const { pin } = await c.req.json().catch(() => ({}));
  if (!pin || !/^\d{4,6}$/.test(String(pin))) return c.json({ error: '4~6자리 숫자 PIN을 입력해주세요' }, 400);
  await c.env.KV.put(pinKey(c.get('uid')), await hashPassword(String(pin)));
  return c.json({ ok: true });
});
app.post('/api/pin/verify', requireAuth, async (c) => {
  const { pin } = await c.req.json().catch(() => ({}));
  const stored = await c.env.KV.get(pinKey(c.get('uid')));
  if (!stored) return c.json({ ok: false, error: 'PIN 미설정' }, 400);
  return c.json({ ok: await verifyPassword(String(pin ?? ''), stored) });
});

// ── 아이 목록 / 등록 (도메인 DB) ──
app.get('/api/children', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM children WHERE maum_user_id=? ORDER BY id').bind(c.get('uid')).all();
  return c.json({ children: results });
});
app.post('/api/children', requireAuth, async (c) => {
  const { name, age, gender, interests } = await c.req.json().catch(() => ({}));
  if (!name) return c.json({ error: '아이 이름(애칭)을 입력해주세요' }, 400);
  const r = await c.env.DB.prepare('INSERT INTO children (maum_user_id,name,age,gender,interests) VALUES (?,?,?,?,?)')
    .bind(c.get('uid'), name, age ?? null, gender ?? null, interests ?? null).run();
  return c.json({ id: r.meta.last_row_id });
});

// ── 세션 시작 (부모 인증 후 아이 모드) ──
app.post('/api/session/start', requireAuth, async (c) => {
  const { child_id, buddy } = await c.req.json().catch(() => ({}));
  const child = await c.env.DB.prepare('SELECT * FROM children WHERE id=? AND maum_user_id=?').bind(child_id, c.get('uid')).first<any>();
  if (!child) return c.json({ error: '아이를 찾을 수 없어요' }, 404);
  // 남용 방지 + 통역(세션) 1회 쿼터 차감(무료월→구독→회차권). 한도 초과 시 402.
  if (!(await checkRateLimit(c.env.KV, `session:${c.get('uid')}`, 12, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const q = await consumeQuota(c.env, c.get('uid'));
  if (!q.ok) return c.json({ error: '이번 달 통역(세션) 횟수를 모두 사용했어요. 이용권 코드를 등록하면 더 이용할 수 있어요.', code: 'QUOTA' }, 402);
  const B = (buddy === 'lala' || buddy === '라라') ? '라라' : '또또';   // 클라이언트는 ASCII 키('lala'/'otto') 전송
  const r = await c.env.DB.prepare('INSERT INTO sessions (child_id,maum_user_id,buddy) VALUES (?,?,?)').bind(child_id, c.get('uid'), B).run();
  const sid = r.meta.last_row_id as number;
  // AI 정체성 고지(spec 2-4) + 따뜻한 시작
  const greeting = `안녕! 나는 ${B}야 🦦 진짜는 아니지만, 네 마음 이야기를 들어주는 친구야. 오늘도 와줘서 고마워! 오늘 하루는 어땠어?`;
  await c.env.DB.prepare('INSERT INTO utterances (session_id,role,content) VALUES (?,?,?)').bind(sid, 'otter', greeting).run();
  return c.json({ session_id: sid, greeting, buddy: B, child: { name: child.name, age: child.age } });
});

// ── 아이 발화 → 또또 응답 ──
app.post('/api/session/:id/utterance', requireAuth, async (c) => {
  const sid = Number(c.req.param('id'));
  if (!(await checkRateLimit(c.env.KV, `utt:${c.get('uid')}:${sid}`, 30, 60))) return c.json({ error: '조금 천천히 이야기해 줄래요?' }, 429);
  const { content } = await c.req.json().catch(() => ({}));
  if (!content) return c.json({ error: '내용이 비어 있어요' }, 400);
  const s = await c.env.DB.prepare('SELECT * FROM sessions WHERE id=? AND maum_user_id=?').bind(sid, c.get('uid')).first<any>();
  if (!s || s.status !== 'open') return c.json({ error: '세션을 찾을 수 없어요' }, 404);
  const child = await c.env.DB.prepare('SELECT name,age FROM children WHERE id=?').bind(s.child_id).first<any>();

  await c.env.DB.prepare('INSERT INTO utterances (session_id,role,content) VALUES (?,?,?)').bind(sid, 'child', String(content).slice(0, 1000)).run();

  const { results } = await c.env.DB.prepare('SELECT role,content FROM utterances WHERE session_id=? ORDER BY id').bind(sid).all<any>();
  const history = results.map((u: any) => ({ role: u.role === 'child' ? 'user' : 'assistant', content: u.content }));
  let reply = '응, 그렇구나. 더 이야기해줄래?';
  try {
    reply = await callClaude(c.env, { model: CHAT_MODEL, system: ottoSystem(child?.age ?? null, child?.name ?? '', s.buddy), messages: history, max_tokens: 200, temperature: 0.7 }) || reply;
  } catch (e) { console.log('chat LLM fail:', String((e as any)?.message || e)); await logError(c.env, 'chat_llm', e); /* 폴백 reply 유지 */ }
  await c.env.DB.prepare('INSERT INTO utterances (session_id,role,content) VALUES (?,?,?)').bind(sid, 'otter', reply).run();
  return c.json({ reply });
});

// ── 세션 종료 → 통역 리포트 ──
app.post('/api/session/:id/end', requireAuth, async (c) => {
  const sid = Number(c.req.param('id'));
  const s = await c.env.DB.prepare('SELECT * FROM sessions WHERE id=? AND maum_user_id=?').bind(sid, c.get('uid')).first<any>();
  if (!s) return c.json({ error: '세션을 찾을 수 없어요' }, 404);
  if (s.status === 'done') {
    const existing = await c.env.DB.prepare('SELECT * FROM reports WHERE session_id=?').bind(sid).first<any>();
    if (existing) return c.json({ report: JSON.parse(existing.report_json), report_id: existing.id });
  }
  const child = await c.env.DB.prepare('SELECT * FROM children WHERE id=?').bind(s.child_id).first<any>();
  const { results } = await c.env.DB.prepare("SELECT role,content FROM utterances WHERE session_id=? ORDER BY id").bind(sid).all<any>();
  const childTurns = results.filter((u: any) => u.role === 'child');

  // 표정 메타(온디바이스 분석 요약 텍스트만 — 원본 영상은 기기에서 폐기, spec 2-8/7-C). 참고용·단정 금지.
  const body = await c.req.json().catch(() => ({})) as { expression_summary?: string };
  const expr = typeof body?.expression_summary === 'string' ? body.expression_summary.slice(0, 120) : '';
  const exprLine = expr ? `\n\n[표정 관찰(기기 내 분석 요약, 참고용·단정 금지)]\n${expr}` : '';

  const B = s.buddy || '또또';
  const transcript = results.map((u: any) => `${u.role === 'child' ? '아이' : B}: ${u.content}`).join('\n');
  const userMsg = `[아이 정보]\n- 나이: ${child?.age ?? '미상'}세${child?.interests ? `\n- 관심사: ${child.interests}` : ''}\n\n[오늘 ${B}와 나눈 대화]\n${transcript}${exprLine}\n\n위 대화를 부모용 통역 리포트(JSON)로 만들어 주세요.`;

  let report: any = { summary: '오늘은 대화를 충분히 담지 못했어요. 다음에 다시 시도해 주세요.', feelings: [], what_happened: '', parent_tips: [], talk_starters: [], data_confidence: 'low', crisis: { flag: false, note: '' } };
  if (childTurns.length > 0) {
    try {
      let raw = await callClaude(c.env, { model: REPORT_MODEL, system: TRANSLATE_SYSTEM, messages: [{ role: 'user', content: userMsg }], max_tokens: 900, temperature: 0 });
      raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (!MED_TERMS.some((t) => JSON.stringify(parsed).includes(t))) report = parsed;
      else {
        let raw2 = await callClaude(c.env, { model: REPORT_MODEL, system: TRANSLATE_SYSTEM + '\n(이전 출력에 금지된 의료용어가 있었습니다. 절대 사용하지 마세요.)', messages: [{ role: 'user', content: userMsg }], max_tokens: 900, temperature: 0 });
        raw2 = raw2.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        try { const p2 = JSON.parse(raw2); if (!MED_TERMS.some((t) => JSON.stringify(p2).includes(t))) report = p2; } catch {}
      }
    } catch (e) { console.log('REPORT_FAIL', String((e as any)?.message || e)); await logError(c.env, 'report_llm', e); }
  }

  // 위기 사전 키워드 스크리닝 (LLM 판정과 이중·보수적, spec 2-6). 단정 아님 — 부모 검토용 플래그.
  if (report?.crisis) {
    const CRISIS_KW = ['때렸', '때려', '때리', '맞았', '무서워', '죽고싶', '죽고 싶', '자해', '피가', '술 먹고', '술마시고', '버리고 갈', '나를 버'];
    const childText = childTurns.map((u: any) => String(u.content)).join(' ');
    if (CRISIS_KW.some((k) => childText.includes(k)) && !report.crisis.flag) {
      report.crisis.flag = true;
      report.crisis.note = report.crisis.note || '대화에 함께 살펴볼 만한 표현이 있었어요. 단정은 아니며, 필요하면 전문기관(아동보호전문기관 112 / 1577-1391) 상담을 권해드려요.';
    }
  }
  const crisisFlag = report?.crisis?.flag ? 1 : 0;
  await c.env.DB.prepare('UPDATE sessions SET status=?, ended_at=datetime("now") WHERE id=?').bind('done', sid).run();
  const r = await c.env.DB.prepare('INSERT INTO reports (session_id,child_id,maum_user_id,report_json,crisis_flag) VALUES (?,?,?,?,?)')
    .bind(sid, s.child_id, c.get('uid'), JSON.stringify(report), crisisFlag).run();
  return c.json({ report, report_id: r.meta.last_row_id });
});

// ── 리포트 ──
app.get('/api/reports', requireAuth, async (c) => {
  const childId = c.req.query('child_id');
  const q = childId
    ? c.env.DB.prepare('SELECT id,session_id,child_id,crisis_flag,created_at,report_json FROM reports WHERE maum_user_id=? AND child_id=? ORDER BY id DESC').bind(c.get('uid'), childId)
    : c.env.DB.prepare('SELECT id,session_id,child_id,crisis_flag,created_at,report_json FROM reports WHERE maum_user_id=? ORDER BY id DESC').bind(c.get('uid'));
  const { results } = await q.all<any>();
  // 대시보드/목록용 요약만 노출(원문 report_json은 상세 엔드포인트에서)
  const reports = results.map((r: any) => {
    let summary = '';
    try { summary = (JSON.parse(r.report_json)?.summary || '').slice(0, 90); } catch {}
    return { id: r.id, session_id: r.session_id, child_id: r.child_id, crisis_flag: r.crisis_flag, created_at: r.created_at, summary };
  });
  return c.json({ reports });
});
app.get('/api/reports/:id', requireAuth, async (c) => {
  const rep = await c.env.DB.prepare('SELECT * FROM reports WHERE id=? AND maum_user_id=?').bind(c.req.param('id'), c.get('uid')).first<any>();
  if (!rep) return c.json({ error: '리포트를 찾을 수 없어요' }, 404);
  return c.json({ report: JSON.parse(rep.report_json), crisis_flag: rep.crisis_flag, created_at: rep.created_at });
});

// ── 이용권(쿼터) 조회 + 쿠폰 등록 ──
app.get('/api/entitlement', requireAuth, async (c) => c.json({ entitlement: await getEntitlement(c.env, c.get('uid')) }));

// 이용 내역(영수증·이용권 등록 이력)
app.get('/api/history', requireAuth, async (c) => {
  const uid = c.get('uid');
  const ent = await getEntitlement(c.env, uid);
  const { results } = await c.env.DB.prepare('SELECT code,type,created_at FROM coupon_redemptions WHERE maum_user_id=? ORDER BY id DESC LIMIT 100').bind(uid).all();
  return c.json({ entitlement: ent, redemptions: results });
});

// ── 또또 음성(OpenAI TTS) — 답변 텍스트만 합성(아이 발화 미전송). 캐시·버디별 음성. 미설정 시 503→프론트 기기 폴백 ──
app.post('/api/tts', requireAuth, async (c) => {
  if (!c.env.OPENAI_API_KEY) return c.json({ error: 'TTS 미설정' }, 503);
  if (!(await checkRateLimit(c.env.KV, `tts:${c.get('uid')}`, 60, 60))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { text, buddy } = await c.req.json().catch(() => ({}));
  const t = String(text || '').replace(/[*#`_~>]/g, '').trim().slice(0, 500);
  if (!t) return c.json({ error: '내용이 없어요' }, 400);
  const voice = (buddy === 'lala' || buddy === '라라') ? 'nova' : 'shimmer'; // 또또=차분(shimmer)/라라=발랄(nova)
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(voice + '|' + t));
  const key = 'ttscache:' + [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
  const cached = await c.env.KV.get(key, 'arrayBuffer');
  if (cached) return new Response(cached, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
  try {
    const res = await fetch(`${OPENAI_GATEWAY}/audio/speech`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${c.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'tts-1', voice, input: t, response_format: 'mp3', speed: 1.0 }),
    });
    if (!res.ok) { await logError(c.env, 'tts', 'openai ' + res.status + ' ' + (await res.text()).slice(0, 150)); return c.json({ error: '음성 생성 실패' }, 502); }
    const buf = await res.arrayBuffer();
    await c.env.KV.put(key, buf, { expirationTtl: 30 * 86400 }).catch(() => {});
    return new Response(buf, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
  } catch (e) { await logError(c.env, 'tts', e); return c.json({ error: '음성 생성 오류' }, 502); }
});

app.post('/api/coupon/redeem', requireAuth, async (c) => {
  const uid = c.get('uid');
  if (!(await checkRateLimit(c.env.KV, `redeem:${clientIp(c)}`, 10, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  if (c.env.RESEND_API_KEY && !(await isEmailVerified(c.env.AUTH_DB, uid))) return c.json({ error: '이메일 인증 후 이용권을 등록할 수 있어요. 가입 시 받은 인증 메일을 확인해 주세요.', code: 'VERIFY' }, 403);
  const { code } = await c.req.json().catch(() => ({}));
  const norm = normCode(code);
  if (!norm) return c.json({ error: '코드를 입력해주세요' }, 400);
  const cp = await c.env.DB.prepare('SELECT * FROM coupons WHERE code=?').bind(norm).first<any>();
  if (!cp || !cp.active) return c.json({ error: '유효하지 않은 코드예요' }, 404);
  if (cp.valid_until && cp.valid_until < nowIso()) return c.json({ error: '만료된 코드예요' }, 410);
  if (cp.redeemed_count >= cp.max_redemptions) return c.json({ error: '이미 모두 사용된 코드예요' }, 409);
  const mine = await c.env.DB.prepare('SELECT COUNT(*) n FROM coupon_redemptions WHERE code=? AND maum_user_id=?').bind(norm, uid).first<any>();
  if ((mine?.n || 0) >= cp.per_user_limit) return c.json({ error: '이미 등록한 코드예요' }, 409);
  try {
    await c.env.DB.prepare('INSERT INTO coupon_redemptions (code,maum_user_id,type) VALUES (?,?,?)').bind(norm, uid, cp.type).run();
  } catch { return c.json({ error: '이미 등록한 코드예요' }, 409); }
  await c.env.DB.prepare('UPDATE coupons SET redeemed_count=redeemed_count+1 WHERE code=?').bind(norm).run();
  const result = await applyGrant(c.env, uid, cp.type);
  return c.json({ ok: true, granted: cp.type, result, entitlement: await getEntitlement(c.env, uid) });
});

// ── 어드민: 쿠폰 발행/조회 + 제휴 통계 (ADMIN_SECRET Bearer) ──
app.post('/api/admin/coupon/create', async (c) => {
  const g = requireAdmin(c);
  if (g === 'unset') return c.json({ error: 'ADMIN_SECRET 미설정' }, 503);
  if (g === 'unauth') return c.json({ error: 'Unauthorized' }, 401);
  const { type, count = 1, max_redemptions = 1, per_user_limit = 1, valid_until, source } = await c.req.json().catch(() => ({}));
  if (!PLAN[type] && !PACK[type]) return c.json({ error: 'type은 sub_light|sub_pro|pack10' }, 400);
  const n = Math.min(Math.max(1, Number(count) | 0), 500);
  const batch = 'B' + Date.now().toString(36).toUpperCase();
  const codes: string[] = [];
  for (let i = 0; i < n; i++) {
    const code = genCode(8);
    await c.env.DB.prepare('INSERT INTO coupons (code,type,max_redemptions,per_user_limit,valid_until,source,batch_id) VALUES (?,?,?,?,?,?,?)')
      .bind(code, type, Number(max_redemptions) || 1, Number(per_user_limit) || 1, valid_until || null, source || 'admin', batch).run();
    codes.push(code);
  }
  return c.json({ ok: true, type, batch_id: batch, count: n, codes });
});
app.get('/api/admin/coupon/list', async (c) => {
  const g = requireAdmin(c);
  if (g === 'unset') return c.json({ error: 'ADMIN_SECRET 미설정' }, 503);
  if (g === 'unauth') return c.json({ error: 'Unauthorized' }, 401);
  const { results } = await c.env.DB.prepare('SELECT code,type,max_redemptions,redeemed_count,per_user_limit,valid_until,active,source,batch_id,created_at FROM coupons ORDER BY created_at DESC LIMIT 500').all();
  return c.json({ coupons: results });
});
app.get('/api/admin/referrals', async (c) => {
  const g = requireAdmin(c);
  if (g === 'unset') return c.json({ error: 'ADMIN_SECRET 미설정' }, 503);
  if (g === 'unauth') return c.json({ error: 'Unauthorized' }, 401);
  const { results } = await c.env.DB.prepare(
    `SELECT r.ref AS ref, COUNT(DISTINCT r.maum_user_id) AS signups, COUNT(DISTINCT cr.maum_user_id) AS paid
     FROM referrals r LEFT JOIN coupon_redemptions cr ON cr.maum_user_id=r.maum_user_id
     GROUP BY r.ref ORDER BY signups DESC LIMIT 500`).all();
  return c.json({ referrals: results });
});
app.get('/api/admin/errors', async (c) => {
  const g = requireAdmin(c);
  if (g === 'unset') return c.json({ error: 'ADMIN_SECRET 미설정' }, 503);
  if (g === 'unauth') return c.json({ error: 'Unauthorized' }, 401);
  const { results } = await c.env.DB.prepare('SELECT id,place,message,created_at FROM error_logs ORDER BY id DESC LIMIT 200').all();
  return c.json({ errors: results });
});
// 운영 통계(대시보드)
app.get('/api/admin/stats', async (c) => {
  const g = requireAdmin(c);
  if (g === 'unset') return c.json({ error: 'ADMIN_SECRET 미설정' }, 503);
  if (g === 'unauth') return c.json({ error: 'Unauthorized' }, 401);
  const one = async (sql: string, ...b: any[]) => (await c.env.DB.prepare(sql).bind(...b).first<any>()) || {};
  const rep = await one("SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN created_at>=datetime('now','-7 day') THEN 1 ELSE 0 END),0) week FROM reports");
  const children = await one('SELECT COUNT(*) c FROM children');
  const sessions = await one('SELECT COUNT(*) c FROM sessions');
  const subs = await one('SELECT COUNT(*) c FROM subscriptions WHERE expires_at>?', nowIso());
  const usage = await one('SELECT COALESCE(SUM(used),0) s, COUNT(*) u FROM usage_monthly WHERE ym=?', ym());
  const cps = await one('SELECT COALESCE(SUM(redeemed_count),0) redeemed, COUNT(*) issued FROM coupons');
  const refs = await one('SELECT COUNT(*) c FROM referrals');
  const errs = await one("SELECT COUNT(*) c FROM error_logs WHERE created_at>=datetime('now','-7 day')");
  return c.json({ stats: {
    label_unit: '통역(세션)', ym: ym(),
    usage_total: rep.total || 0, usage_week: rep.week || 0, entities: children.c || 0, sessions: sessions.c || 0,
    active_subscriptions: subs.c || 0, month_usage: usage.s || 0, month_active_users: usage.u || 0,
    coupons_redeemed: cps.redeemed || 0, coupons_issued: cps.issued || 0, referral_signups: refs.c || 0, errors_week: errs.c || 0,
  } });
});

// ── 회원 탈퇴(계정·데이터 완전 삭제) ──
app.delete('/api/account', requireAuth, async (c) => {
  const uid = c.get('uid');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM utterances WHERE session_id IN (SELECT id FROM sessions WHERE maum_user_id=?)').bind(uid),
    c.env.DB.prepare('DELETE FROM reports WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM sessions WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM children WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM subscriptions WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM packs WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM usage_monthly WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM coupon_redemptions WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM referrals WHERE maum_user_id=?').bind(uid),
  ]);
  try { await c.env.KV.delete(`pin:${uid}`); } catch {}
  await deleteUser(c.env.AUTH_DB, uid);
  return c.json({ ok: true });
});

// ── 법적 고지 페이지 (개인정보·약관·탈퇴) ──
const BIZ = '상호: 마음서비스 · 대표자: 김근혜 · 사업자등록번호: 780-31-01832 · 통신판매업 신고번호: 제 2026-서울영등포-1157 호 · 소재지: 서울특별시 영등포구 문래로26길 6(문래동3가) · 문의: limyj007@gmail.com';
const PAGE = (title: string, body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} · 마음수달</title>
<style>body{font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:720px;margin:0 auto;padding:28px 20px 60px;color:#222;line-height:1.7}
h1{font-size:22px}h2{font-size:16px;margin-top:26px}.muted{color:#777;font-size:13px}a{color:#3B6FB5}
.btn{display:inline-block;background:#dc2626;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer}
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin-top:16px}.biz{margin-top:34px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:12px;line-height:1.9}
.nav{font-size:13px;margin-bottom:8px}</style></head><body>
<div class="nav"><a href="/privacy">개인정보처리방침</a> · <a href="/terms">이용약관</a> · <a href="/faq">고객센터</a> · <a href="/account-deletion">회원 탈퇴</a></div>
${body}<div class="biz">🦦 마음수달 · ${BIZ}</div></body></html>`;

app.get('/privacy', (c) => c.html(PAGE('개인정보처리방침', `
<h1>마음수달 개인정보처리방침</h1><p class="muted">시행일: 2026-06-21</p>
<p>마음서비스(이하 "회사")는 아동 정서 통역 서비스 '마음수달'을 운영하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.</p>
<h2>1. 수집 항목</h2><ul>
<li>계정: 이메일, 비밀번호(암호화 저장), 이름(선택)</li>
<li>아이 정보: 애칭, 나이, 성별(선택), 관심사(선택)</li>
<li>대화·통역 기록: 아이가 '또또'와 나눈 대화, 생성된 통역 리포트</li>
<li>부모 PIN(암호화 저장), 이용권/구매 이력</li></ul>
<h2>2. 이용 목적</h2><p>정서 통역 서비스 제공, 계정·이용권 관리, 안전(위기 신호의 보호자 안내).</p>
<h2>3. 표정 영상(비저장)</h2><p>표정 분석은 <b>기기 내에서만</b> 처리되며 원본 영상은 저장·전송하지 않습니다.</p>
<h2>4. 처리 위탁</h2><ul><li>Anthropic — 통역 생성을 위한 AI 처리</li><li>OpenAI — 또또 답변의 음성 합성(TTS) 시 답변 텍스트 전송(아이 발화·음성은 미전송)</li><li>Cloudflare — 서버·데이터베이스 인프라</li></ul>
<h2>5. 보유 및 파기</h2><p>회원 탈퇴 시 모든 개인정보를 <b>즉시 파기</b>합니다. 다만 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다 — 계약·청약철회 기록 5년, 대금결제·재화공급 기록 5년, 소비자 불만·분쟁처리 기록 3년. 탈퇴는 <a href="/account-deletion">여기</a> 또는 앱 내에서 가능합니다.</p>
<h2>6. 아동의 개인정보</h2><p>본 서비스는 <b>보호자(법정대리인)가 동반·운영</b>하는 서비스입니다. 만 14세 미만 아동의 개인정보는 법정대리인의 동의 하에 처리됩니다.</p>
<h2>7. 이용자 권리</h2><p>이용자는 개인정보 열람·정정·삭제를 요청할 수 있으며, 전송 구간은 HTTPS로 암호화됩니다.</p>
<h2>8. 개인정보보호책임자</h2><p>김근혜 · limyj007@gmail.com</p>`)));

app.get('/terms', (c) => c.html(PAGE('이용약관', `
<h1>마음수달 이용약관</h1><p class="muted">시행일: 2026-06-21</p>
<h2>제1조(목적)</h2><p>본 약관은 마음서비스가 제공하는 '마음수달' 서비스 이용에 관한 회사와 이용자의 권리·의무를 정함을 목적으로 합니다.</p>
<h2>제2조(서비스 내용)</h2><p>마음수달은 아이가 '또또'와 나눈 대화를 보호자가 이해할 수 있도록 통역하는 서비스입니다. 통역 결과는 <b>참고용</b>이며 의학적 진단·치료가 아닙니다.</p>
<h2>제3조(계정)</h2><p>서비스는 보호자 계정으로 가입하며, 보호자의 기기에서 아이와 함께 사용합니다. 계정 정보 관리 책임은 이용자에게 있습니다.</p>
<h2>제4조(이용권·결제)</h2><p>유료 이용권은 외부 판매처(예: 네이버 스마트스토어)에서 구매 후 발급받은 코드를 서비스에 등록하여 이용합니다. 이용권 종류·제공량은 구매 시점 안내에 따릅니다.</p>
<h2>제5조(청약철회·환불)</h2><p>디지털 콘텐츠(이용권 코드)는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라, 코드 발송 및 사용(등록) 후에는 청약철회가 제한될 수 있습니다. 미사용·미발송 건은 관련 법령에 따라 환불됩니다.</p>
<h2>제6조(금지행위)</h2><p>코드의 부정 사용·재판매, 타인 계정 도용, 서비스 부정 접근·자동화 남용을 금지합니다.</p>
<h2>제7조(면책)</h2><p>통역 결과는 참고 정보이며, 회사는 이를 근거로 한 의사결정의 결과에 대해 법적 책임을 지지 않습니다. 안전이 우려되는 경우 전문기관 상담을 권장합니다.</p>
<h2>제8조(분쟁해결·준거법)</h2><p>본 약관은 대한민국 법령에 따르며, 분쟁은 관계 법령 및 회사 소재지 관할 법원에 따릅니다.</p>`)));

app.get('/verify', async (c) => {
  const tok = c.req.query('token');
  const uid = tok ? await c.env.KV.get(`emailverify:${tok}`) : null;
  if (uid) { await markEmailVerified(c.env.AUTH_DB, Number(uid)); await c.env.KV.delete(`emailverify:${tok}`); }
  return c.html(PAGE('이메일 인증', uid
    ? `<h1>이메일 인증 완료 ✅</h1><p>이제 마음수달을 모두 이용할 수 있어요. 앱(또는 maumotter.com)으로 돌아가 주세요.</p>`
    : `<h1>인증 링크가 유효하지 않아요</h1><p>만료되었거나 이미 사용된 링크예요. 앱에서 인증 메일을 다시 보내 주세요.</p>`));
});
app.get('/reset', (c) => c.html(PAGE('비밀번호 재설정', `
<h1>비밀번호 재설정</h1>
<div class="card"><p>새 비밀번호(8자 이상)를 입력해 주세요.</p>
<input id="pw" type="password" placeholder="새 비밀번호" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box"/>
<p id="msg" class="muted" style="margin-top:8px"></p>
<button class="btn" style="background:#3B6FB5;margin-top:10px" onclick="go()">변경하기</button></div>
<script>var t=new URLSearchParams(location.search).get('token');
function go(){var pw=document.getElementById('pw').value,m=document.getElementById('msg');if((pw||'').length<8){m.style.color='#C0492F';m.textContent='8자 이상 입력해 주세요';return;}
fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,password:pw})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});}).then(function(x){if(!x.ok)throw new Error(x.d.error||'실패');m.style.color='#3B6FB5';m.textContent='변경되었습니다. 앱에서 새 비밀번호로 로그인해 주세요.';}).catch(function(e){m.style.color='#C0492F';m.textContent=e.message;});}
</script>`)));

app.get('/faq', (c) => c.html(PAGE('자주 묻는 질문', `
<h1>자주 묻는 질문 · 고객센터</h1>
<h2>이용권 코드는 어떻게 등록하나요?</h2><p>부모 화면의 '🎟️ 이용권' 칸에 구매하신 코드를 입력하고 '등록'을 누르면 즉시 적용됩니다.</p>
<h2>이용권은 어디서 사나요?</h2><p>네이버 스마트스토어에서 구매 후 코드를 받아 등록합니다(앱 내 '구매하기'에서 스토어로 이동).</p>
<h2>통역 1회는 무엇인가요?</h2><p>또또와의 대화 한 번(세션)이 통역 1회입니다. 가입 시 매월 무료 횟수가 제공돼요.</p>
<h2>환불이 되나요?</h2><p>디지털 콘텐츠(코드)는 발송·등록 후 청약철회가 제한될 수 있습니다. 미사용·미발송 건은 관계 법령에 따라 환불됩니다. 문의: limyj007@gmail.com</p>
<h2>비밀번호를 잊었어요</h2><p>로그인 화면의 '비밀번호를 잊으셨나요?'에서 재설정 메일을 받을 수 있어요.</p>
<h2>아이의 표정 영상은 저장되나요?</h2><p>아니요. 기기 내에서만 분석되고 저장·전송하지 않습니다.</p>
<h2>회원 탈퇴는 어떻게 하나요?</h2><p>부모 화면 하단 '회원 탈퇴' 또는 <a href="/account-deletion">여기</a>에서 가능합니다.</p>
<h2>문의</h2><p>limyj007@gmail.com</p>`)));

app.get('/account-deletion', (c) => c.html(PAGE('회원 탈퇴', `
<h1>마음수달 회원 탈퇴 · 계정 삭제</h1>
<p>탈퇴 시 <b>계정과 모든 데이터(아이 정보·대화·통역 리포트·이용권)가 즉시 영구 삭제</b>되며 복구할 수 없습니다. 표정 영상은 애초에 저장하지 않습니다.</p>
<p class="muted">⚠️ 마음수달 계정은 마음 시리즈 통합 로그인 계정입니다. 탈퇴하면 같은 계정의 다른 마음 서비스에서도 함께 삭제됩니다.</p>
<div class="card"><p id="msg">로그인 상태를 확인하는 중…</p>
<button class="btn" id="del" style="display:none" onclick="doDelete()">계정 영구 삭제</button></div>
<p class="muted">앱 내에서도 <b>설정 → 회원 탈퇴</b>로 진행할 수 있습니다. 로그인 없이 삭제를 원하시면 limyj007@gmail.com 으로 가입 이메일과 함께 요청해 주세요.</p>
<script>var K='maumotter_token',t=localStorage.getItem(K),m=document.getElementById('msg'),d=document.getElementById('del');
if(t){m.textContent='현재 로그인되어 있습니다. 아래 버튼으로 계정을 영구 삭제할 수 있습니다.';d.style.display='inline-block';}else{m.textContent='로그인되어 있지 않습니다. 앱에서 로그인 후 이 페이지를 다시 열어 주세요.';}
function doDelete(){if(!confirm('정말 계정과 모든 데이터를 영구 삭제할까요? 되돌릴 수 없습니다.'))return;d.disabled=true;d.textContent='삭제 중…';
fetch('/api/account',{method:'DELETE',headers:{Authorization:'Bearer '+t}}).then(function(r){if(!r.ok)throw 0;localStorage.removeItem(K);m.textContent='계정이 삭제되었습니다. 그동안 이용해 주셔서 감사합니다.';d.style.display='none';}).catch(function(){d.disabled=false;d.textContent='계정 영구 삭제';alert('삭제 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');});}</script>`)));

// 미처리 예외 → 로그 + 일반 메시지
app.onError(async (err, c) => { await logError(c.env, 'unhandled:' + c.req.path, err); return c.json({ error: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' }, 500); });

// 정적 프론트(React CDN) — /api 외는 assets
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
