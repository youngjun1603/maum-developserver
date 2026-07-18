// 마음곁 (MaumGyeot) — Worker (Hono). MVP. 반려동물 행동 통역.
// 계정/인증은 공용 maum-auth(AUTH_DB) + 공유 모듈 ./auth (마음수달과 동일 사본).
// 안전: 단정 금지(confidence 필수)·수의학 용어 금지·health_flag·종 분리 — docs/ 준수.
import { Hono } from 'hono';
import { registerUser, loginUser, getUser, issueToken, requireAuth, deleteUser, findByEmail, setPassword, markEmailVerified, isEmailVerified } from './auth';
import { BEHAVIOR, signalsToLines } from './behavior';

type Bindings = { DB: D1Database; AUTH_DB: D1Database; KV: KVNamespace; JWT_SECRET: string; ANTHROPIC_API_KEY: string; ASSETS: Fetcher; ADMIN_SECRET?: string; RESEND_API_KEY?: string; EMAIL_FROM?: string; MAUM_SSO_SECRET?: string };
const app = new Hono<{ Bindings: Bindings; Variables: { uid: number } }>();

const REPORT_MODEL = 'claude-sonnet-4-6';
// Anthropic은 Cloudflare AI Gateway 경유(직접 api.anthropic.com 호출은 Workers egress에서 403)
const AI_GATEWAY = 'https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages';
// 수의학·의료 용어 금지(후처리 검증). 발견 시 재생성/치환.
const VET_TERMS = ['진단', '처방', '치료', '질병', '병명', '췌장염', '신부전', '감염', '종양', '약 처방', '투약'];

const TRANSLATE_SYSTEM = `당신은 '마음곁'의 동물행동학 기반 통역가입니다. 보호자가 입력한 반려동물(개 또는 고양이)의 행동 신호와 맥락을 읽고, 그 의미를 보호자가 이해·대응할 수 있도록 통역합니다.

[역할 원칙]
- 당신은 진단하지 않고 '통역'합니다. AI는 보호자와 반려동물 사이의 다리입니다.
- 직접 관찰·교감이 가장 중요함을 전제로, 참고 해석을 제공합니다.

[통역의 황금률]
- 단일 신호로 단정하지 않습니다. 꼬리·귀·눈·자세·발성을 함께 읽습니다.
- 같은 신호도 종·맥락·개체에 따라 정반대일 수 있습니다(예: 고양이 골골거림, 개 꼬리흔들기). 다의적 신호는 반드시 caveat에 명시.
- 제공된 '신호별 후보 의미'와 '맥락'에 근거합니다. 신호가 적으면 confidence=low로 낮춥니다.

[절대 금지]
- 수의학·의료 용어 금지: 진단, 처방, 치료, 병명(예: 췌장염, 신부전 등) 사용 금지.
- 단정·과대 표현 금지: "~입니다/~래요/정확도 N%" 금지. "~일 수 있어요/~로 보여요"만.
- 건강 우려는 진단하지 말고 health_flag + "수의사 상담 권장"으로만.

[confidence 기준]
- high: 여러 신호가 일관 + 맥락 명확. medium: 신호/맥락 일부. low: 신호 적거나 다의적/모순.

[출력] 아래 JSON 스키마로만, JSON 외 텍스트/코드블록 금지:
{"summary":"이 행동은 ~일 수 있어요(단정X) 2~3문장","confidence":"low|medium|high","body_signals_read":["함께 읽은 신호"],"possible_meanings":[{"meaning":"가능한 의미","why":"근거","caveat":"다의성·맥락 주의(없으면 '')"}],"what_to_do":["보호자가 해볼 따뜻한 대응 1~3개"],"health_flag":{"flag":false,"note":"통증·이상 의심 시 수의사 상담 권장. 진단 아님(없으면 '')"}}`;

// LLM 호출 — 25s 타임아웃 + 1회 재시도(게이트웨이 지연·일시 5xx 격리)
async function callClaude(env: Bindings, opts: { system: string; messages: any[]; max_tokens: number; temperature?: number }) {
  const once = async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(AI_GATEWAY, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: REPORT_MODEL, max_tokens: opts.max_tokens, temperature: opts.temperature ?? 0, system: opts.system, messages: opts.messages }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('LLM ' + res.status + ' ' + (await res.text()).slice(0, 300));
      const data = await res.json<any>();
      return (data?.content?.[0]?.text || '').trim();
    } finally { clearTimeout(to); }
  };
  try { return await once(); } catch { return await once(); }
}

// ── 레이트리밋(KV 버킷, 마음풀 패턴) — KV 오류 시 통과(가용성 우선) ──
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

// ── 유료/쿼터 엔진 (월 사용캡 + 구독 + 회차권). 숫자는 여기서 조정. ──
const FREE_MONTHLY = 5;   // 가입자 월 무료 통역
const GUEST_FREE = 2;     // 비회원 미리보기 평생 횟수(IP)
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
// 통역 1회 차감(무료월 → 구독월 → 회차권 순). ok=false면 한도 초과.
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
// 쿠폰 코드 → 구독/회차권 부여
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
// 어드민 인증 + 코드 생성기
function requireAdmin(c: any): 'ok' | 'unset' | 'unauth' {
  if (!c.env.ADMIN_SECRET) return 'unset';
  return (c.req.header('Authorization') || '') === `Bearer ${c.env.ADMIN_SECRET}` ? 'ok' : 'unauth';
}
const genCode = (len = 8) => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint8Array(len)); let s = ''; for (let i = 0; i < len; i++) s += A[r[i] % A.length]; return s; };
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
      body: JSON.stringify({ from: env.EMAIL_FROM || '마음곁 <noreply@maumgyeot.com>', to, subject, html }),
    });
    if (!res.ok) { await logError(env, 'email', 'resend ' + res.status + ' ' + (await res.text()).slice(0, 200)); return false; }
    return true;
  } catch (e) { await logError(env, 'email', e); return false; }
}
const emailWrap = (title: string, body: string, btn: string, link: string) => `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
<h2 style="color:#2E8B7A">${title}</h2>${body}
<p style="margin:20px 0"><a href="${link}" style="background:#2E8B7A;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">${btn}</a></p>
<p style="color:#888;font-size:12px">버튼이 안 되면 이 링크를 복사해 주세요:<br>${link}</p></div>`;
const verifyEmailHtml = (link: string) => emailWrap('마음곁 이메일 인증', '<p>아래 버튼을 눌러 이메일 인증을 완료해 주세요.</p>', '이메일 인증하기', link);
const resetEmailHtml = (link: string) => emailWrap('마음곁 비밀번호 재설정', '<p>아래 버튼을 눌러 새 비밀번호를 설정해 주세요. (요청 후 1시간 내 유효)</p>', '비밀번호 재설정', link);

// ── 통역 코어(회원/비회원 공용) ──
async function runTranslation(env: Bindings, p: { species: 'cat' | 'dog'; name?: string; age?: any; personality?: string; codes: string[]; context?: string; frames?: any[] }) {
  const species = p.species;
  const { lines, hasHealth, hasAmbiguous } = signalsToLines(species, p.codes);
  const frameArr: string[] = Array.isArray(p.frames) ? p.frames.slice(0, 6) : [];
  const hasVideo = frameArr.length > 0;
  const userMsg = `[반려동물] 종: ${species === 'cat' ? '고양이' : '개'} | 이름: ${p.name || '미상'} | 나이: ${p.age ?? '미상'}${p.personality ? ` | 성격: ${p.personality}` : ''}
[관찰한 행동 신호]
${lines || '- (선택된 신호 없음)'}
[맥락] ${p.context || '(미입력)'}${hasVideo ? '\n[영상] 짧은 영상에서 뽑은 연속 프레임을 함께 첨부했어요.' : ''}

위 관찰을 보호자용 통역 리포트(JSON)로 만들어 주세요.${hasVideo ? ' 첨부 프레임에서 자세·꼬리·귀·표정을 함께 읽어 통역에 반영해 주세요.' : ''}${hasAmbiguous ? ' 다의적 신호가 포함되어 있으니 caveat를 꼭 채우세요.' : ''}`;
  const userContent: any = hasVideo
    ? [...frameArr.map((f) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(f).replace(/^data:image\/\w+;base64,/, '') } })), { type: 'text', text: userMsg }]
    : userMsg;
  let report: any = { summary: '신호가 충분하지 않아 해석이 어려워요. 더 지켜봐 주세요.', confidence: 'low', body_signals_read: [], possible_meanings: [], what_to_do: ['반려동물의 평소 모습과 비교하며 며칠 더 관찰해 주세요.'], health_flag: { flag: false, note: '' } };
  if (p.codes.length > 0 || hasVideo || (p.context && p.context.length > 1)) {
    try {
      let raw = await callClaude(env, { system: TRANSLATE_SYSTEM, messages: [{ role: 'user', content: userContent }], max_tokens: 1400, temperature: 0 });
      raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (!VET_TERMS.some((t) => JSON.stringify(parsed).includes(t))) report = parsed;
      else {
        let raw2 = await callClaude(env, { system: TRANSLATE_SYSTEM + '\n(이전 출력에 금지된 수의학 용어가 있었습니다. 절대 사용하지 마세요.)', messages: [{ role: 'user', content: userContent }], max_tokens: 1400, temperature: 0 });
        raw2 = raw2.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        try { const p2 = JSON.parse(raw2); if (!VET_TERMS.some((t) => JSON.stringify(p2).includes(t))) report = p2; } catch {}
      }
    } catch (e) { console.log('OBSERVE_FAIL', String((e as any)?.message || e)); await logError(env, 'observe_llm', e); }
  }
  const HEALTH_KW = ['아파', '아픈', '절뚝', '토했', '구토', '설사', '안 먹', '못 먹', '식욕', '기운 없', '무기력', '피', '다쳤', '떨'];
  const ctxHit = typeof p.context === 'string' && HEALTH_KW.some((k) => p.context!.includes(k));
  if (report?.health_flag && (hasHealth || ctxHit) && !report.health_flag.flag) {
    report.health_flag.flag = true;
    report.health_flag.note = report.health_flag.note || '몸이 불편한 신호일 수 있어요. 단정은 아니며, 수의사 상담을 권해드려요.';
  }
  return { report, hasVideo, healthFlag: report?.health_flag?.flag ? 1 : 0 };
}

app.get('/api/health', (c) => c.json({ ok: true }));

// ── 인증 (공용 maum-auth) ──
app.post('/api/auth/register', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `register:${clientIp(c)}`, 5, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { email, password, name, ref } = await c.req.json().catch(() => ({}));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return c.json({ error: '올바른 이메일을 입력해주세요' }, 400);
  if (!password || String(password).length < 8) return c.json({ error: '비밀번호는 8자 이상이어야 해요' }, 400);
  try {
    const user = await registerUser(c.env.AUTH_DB, { email, password, name });
    if (ref) { try { await c.env.DB.prepare('INSERT OR IGNORE INTO referrals (maum_user_id,ref) VALUES (?,?)').bind(user.id, String(ref).slice(0, 64)).run(); } catch {} }
    if (c.env.RESEND_API_KEY) {
      const vtok = genCode(24);
      await c.env.KV.put(`emailverify:${vtok}`, String(user.id), { expirationTtl: 7 * 86400 });
      await sendEmail(c.env, user.email, '[마음곁] 이메일 인증', verifyEmailHtml(new URL(c.req.url).origin + '/verify?token=' + vtok));
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
app.get('/api/auth/me', requireAuth, async (c) => c.json({ user: await getUser(c.env.AUTH_DB, c.get('uid')), email_verified: await isEmailVerified(c.env.AUTH_DB, c.get('uid')), email_required: !!c.env.RESEND_API_KEY }));

// ── 비밀번호 재설정 / 이메일 인증 (RESEND 미설정 시 no-op) ──
app.post('/api/auth/forgot-password', async (c) => {
  if (!(await checkRateLimit(c.env.KV, `forgot:${clientIp(c)}`, 5, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { email } = await c.req.json().catch(() => ({}));
  if (email && c.env.RESEND_API_KEY) {
    const u = await findByEmail(c.env.AUTH_DB, String(email));
    if (u) {
      const tok = genCode(24);
      await c.env.KV.put(`pwreset:${tok}`, String(u.id), { expirationTtl: 3600 });
      await sendEmail(c.env, u.email, '[마음곁] 비밀번호 재설정', resetEmailHtml(new URL(c.req.url).origin + '/reset?token=' + tok));
    }
  }
  return c.json({ ok: true }); // 이메일 존재 여부 비노출
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
  await sendEmail(c.env, u.email, '[마음곁] 이메일 인증', verifyEmailHtml(new URL(c.req.url).origin + '/verify?token=' + vtok));
  return c.json({ ok: true });
});

// ── 반려동물 (도메인 DB) ──
app.get('/api/pets', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM pets WHERE maum_user_id=? ORDER BY id').bind(c.get('uid')).all();
  return c.json({ pets: results });
});
app.post('/api/pets', requireAuth, async (c) => {
  const { name, species, breed, age, personality } = await c.req.json().catch(() => ({}));
  if (!name || (species !== 'cat' && species !== 'dog')) return c.json({ error: '이름과 종(고양이/개)을 입력해주세요' }, 400);
  const r = await c.env.DB.prepare('INSERT INTO pets (maum_user_id,name,species,breed,age,personality) VALUES (?,?,?,?,?,?)')
    .bind(c.get('uid'), name, species, breed ?? null, age ?? null, personality ?? null).run();
  return c.json({ id: r.meta.last_row_id });
});

// ── 행동 사전 (도감·신호 선택용) ──
app.get('/api/behavior', (c) => {
  const sp = c.req.query('species');
  if (sp !== 'cat' && sp !== 'dog') return c.json({ error: 'species=cat|dog 가 필요해요' }, 400);
  return c.json({ species: sp, signals: BEHAVIOR[sp] });
});

// ── 관찰 → 통역 ──
app.post('/api/observe', requireAuth, async (c) => {
  const uid = c.get('uid');
  // 남용·버스트 방지(유저당 분당 8회)
  if (!(await checkRateLimit(c.env.KV, `observe:${uid}`, 8, 60))) return c.json({ error: '요청이 너무 잦아요. 잠시 후 다시 시도해주세요.' }, 429);
  const { pet_id, signals, context, media_note, frames } = await c.req.json().catch(() => ({}));
  if (typeof context === 'string' && context.length > 2000) return c.json({ error: '맥락이 너무 길어요(2000자 이내)' }, 413);
  const pet = await c.env.DB.prepare('SELECT * FROM pets WHERE id=? AND maum_user_id=?').bind(pet_id, uid).first<any>();
  if (!pet) return c.json({ error: '반려동물을 찾을 수 없어요' }, 404);
  const species = pet.species === 'dog' ? 'dog' : 'cat';
  const codes: string[] = Array.isArray(signals) ? signals : [];
  const realAttempt = codes.length > 0 || (Array.isArray(frames) && frames.length > 0) || (context && String(context).length > 1);
  // 실제 통역 시도일 때만 쿼터 차감(무료월→구독→회차권). 한도 초과 시 402.
  if (realAttempt) {
    const q = await consumeQuota(c.env, uid);
    if (!q.ok) return c.json({ error: '이번 달 통역 횟수를 모두 사용했어요. 이용권 코드를 등록하면 더 이용할 수 있어요.', code: 'QUOTA' }, 402);
  }
  const { report, hasVideo, healthFlag } = await runTranslation(c.env, { species, name: pet.name, age: pet.age, personality: pet.personality, codes, context, frames });

  const noteToSave = hasVideo ? '영상 분석함(원본·프레임 미저장)' : (media_note ?? null);
  const obs = await c.env.DB.prepare('INSERT INTO observations (pet_id,maum_user_id,species,signals_json,context,media_note) VALUES (?,?,?,?,?,?)')
    .bind(pet.id, uid, species, JSON.stringify(codes), context ?? null, noteToSave).run();
  const rep = await c.env.DB.prepare('INSERT INTO pet_reports (observation_id,pet_id,maum_user_id,report_json,health_flag) VALUES (?,?,?,?,?)')
    .bind(obs.meta.last_row_id, pet.id, uid, JSON.stringify(report), healthFlag).run();
  const ent = await getEntitlement(c.env, uid);
  return c.json({ report, report_id: rep.meta.last_row_id, remaining: ent.totalRemaining });
});

// ── 비회원 미리보기(로그인 전 체험) — IP당 평생 GUEST_FREE회, 저장 안 함. 마음풀 guest 패턴 ──
app.post('/api/observe/guest', async (c) => {
  const ip = clientIp(c);
  if (!(await checkRateLimit(c.env.KV, `guest_obs:${ip}`, 5, 60))) return c.json({ error: '요청이 너무 잦아요. 잠시 후 다시 시도해주세요.' }, 429);
  const key = `guest_observe:${ip}`;
  const used = parseInt((await c.env.KV.get(key)) || '0', 10);
  if (used >= GUEST_FREE) return c.json({ error: '비회원 미리보기를 모두 사용했어요. 가입하면 매월 무료로 더 이용할 수 있어요.', code: 'GUEST_LIMIT' }, 402);
  const { species, signals, context, frames } = await c.req.json().catch(() => ({}));
  if (typeof context === 'string' && context.length > 2000) return c.json({ error: '맥락이 너무 길어요(2000자 이내)' }, 413);
  const sp: 'cat' | 'dog' = species === 'dog' ? 'dog' : 'cat';
  const codes: string[] = Array.isArray(signals) ? signals : [];
  if (!(codes.length > 0 || (Array.isArray(frames) && frames.length > 0) || (context && String(context).length > 1))) return c.json({ error: '행동 신호나 상황을 입력해 주세요' }, 400);
  const { report } = await runTranslation(c.env, { species: sp, codes, context, frames });
  c.env.KV.put(key, String(used + 1), { expirationTtl: 31536000 }).catch(() => {});
  return c.json({ report, guest: true, remaining: Math.max(0, GUEST_FREE - used - 1) });
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

app.post('/api/coupon/redeem', requireAuth, async (c) => {
  const uid = c.get('uid');
  if (!(await checkRateLimit(c.env.KV, `redeem:${clientIp(c)}`, 10, 3600))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  // 이메일 인증 시 어뷰징 방어(발송 설정된 경우에만 적용 — 미설정 시 무영향)
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

// ── 마음풀 통합결제: 서명 grant 수신 (마음풀 결제성공 → 여기로 지급). 수달과 대칭 ──
//   서명 = 마음풀 signSso(MAUM_SSO_SECRET, {email,service,grantType,orderId,amount,exp}). HMAC-SHA256, payloadB64u.sig.
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
async function verifyGrantToken(secret: string, token: string): Promise<any | null> {
  const p = await verifySso(secret, token);
  if (!p) return null;
  if (!p.exp || Number(p.exp) < Math.floor(Date.now() / 1000)) return null;
  return p;
}
app.post('/api/grant', async (c) => {
  const secret = c.env.MAUM_SSO_SECRET;
  if (!secret) return c.json({ error: 'grant secret 미설정' }, 503);
  const body = await c.req.json().catch(() => ({} as any));
  const p = await verifyGrantToken(secret, String(body.token || ''));
  if (!p) return c.json({ error: 'invalid or expired grant' }, 401);
  if (p.service && p.service !== 'gyeot') return c.json({ error: 'service mismatch' }, 400);
  const email = String(p.email || '').toLowerCase();
  const grantType = String(p.grantType || '');
  const orderId = String(p.orderId || '');
  if (!email || !orderId) return c.json({ error: 'email/orderId 누락' }, 400);
  if (!PLAN[grantType] && !PACK[grantType]) return c.json({ error: 'unknown grantType' }, 400);
  const existing = await c.env.DB.prepare('SELECT status FROM external_orders WHERE order_id=?').bind(orderId).first<any>();
  if (existing) return c.json({ ok: true, dedup: true, status: existing.status });
  let user = await findByEmail(c.env.AUTH_DB, email);
  if (!user) {
    try { user = await registerUser(c.env.AUTH_DB, { email, password: crypto.randomUUID() + crypto.randomUUID() }); }
    catch { user = await findByEmail(c.env.AUTH_DB, email); }
  }
  if (!user) return c.json({ error: '계정 처리 실패' }, 500);
  await markEmailVerified(c.env.AUTH_DB, user.id);
  const result = await applyGrant(c.env, user.id, grantType);
  await c.env.DB.prepare("INSERT INTO external_orders (order_id,email,maum_user_id,grant_type,status,applied_at) VALUES (?,?,?,?,'applied',datetime('now'))")
    .bind(orderId, email, user.id, grantType).run();
  return c.json({ ok: true, applied: true, grantType, result });
});
app.post('/api/grant/revoke', async (c) => {
  const secret = c.env.MAUM_SSO_SECRET;
  if (!secret) return c.json({ error: 'grant secret 미설정' }, 503);
  const body = await c.req.json().catch(() => ({} as any));
  const p = await verifyGrantToken(secret, String(body.token || ''));
  if (!p) return c.json({ error: 'invalid or expired' }, 401);
  const orderId = String(p.orderId || '');
  const ord = await c.env.DB.prepare('SELECT * FROM external_orders WHERE order_id=?').bind(orderId).first<any>();
  if (!ord) return c.json({ ok: true, note: 'no such order' });
  if (ord.status !== 'applied') return c.json({ ok: true, note: 'already ' + ord.status });
  const gt = ord.grant_type;
  if (PLAN[gt]) {
    const g = PLAN[gt];
    const sub = await c.env.DB.prepare('SELECT expires_at FROM subscriptions WHERE maum_user_id=?').bind(ord.maum_user_id).first<any>();
    if (sub?.expires_at) {
      const pulled = new Date(new Date(sub.expires_at).getTime() - g.days * 86400000).toISOString();
      await c.env.DB.prepare("UPDATE subscriptions SET expires_at=?, updated_at=datetime('now') WHERE maum_user_id=?").bind(pulled, ord.maum_user_id).run();
    }
  } else if (PACK[gt]) {
    const g = PACK[gt];
    await c.env.DB.prepare("UPDATE packs SET remaining=MAX(0, remaining-?), updated_at=datetime('now') WHERE maum_user_id=?").bind(g.count, ord.maum_user_id).run();
  }
  await c.env.DB.prepare("UPDATE external_orders SET status='revoked', revoked_at=datetime('now') WHERE order_id=?").bind(orderId).run();
  return c.json({ ok: true, revoked: true });
});

// ── 어드민: 쿠폰 발행/조회 (ADMIN_SECRET Bearer) ──
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
// 제휴 통계: 파트너별 가입수 + 유료전환(쿠폰 등록자) 수
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
  const obs = await one("SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN created_at>=datetime('now','-7 day') THEN 1 ELSE 0 END),0) week FROM observations");
  const pets = await one('SELECT COUNT(*) c FROM pets');
  const subs = await one('SELECT COUNT(*) c FROM subscriptions WHERE expires_at>?', nowIso());
  const usage = await one('SELECT COALESCE(SUM(used),0) s, COUNT(*) u FROM usage_monthly WHERE ym=?', ym());
  const cps = await one('SELECT COALESCE(SUM(redeemed_count),0) redeemed, COUNT(*) issued FROM coupons');
  const refs = await one('SELECT COUNT(*) c FROM referrals');
  const errs = await one("SELECT COUNT(*) c FROM error_logs WHERE created_at>=datetime('now','-7 day')");
  return c.json({ stats: {
    label_unit: '통역', ym: ym(),
    usage_total: obs.total || 0, usage_week: obs.week || 0, entities: pets.c || 0,
    active_subscriptions: subs.c || 0, month_usage: usage.s || 0, month_active_users: usage.u || 0,
    coupons_redeemed: cps.redeemed || 0, coupons_issued: cps.issued || 0, referral_signups: refs.c || 0, errors_week: errs.c || 0,
  } });
});
// 미처리 예외 → 로그 + 일반 메시지
app.onError(async (err, c) => { await logError(c.env, 'unhandled:' + c.req.path, err); return c.json({ error: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' }, 500); });

// ── 리포트 ──
app.get('/api/reports', requireAuth, async (c) => {
  const petId = c.req.query('pet_id');
  const q = petId
    ? c.env.DB.prepare('SELECT id,pet_id,health_flag,created_at,report_json FROM pet_reports WHERE maum_user_id=? AND pet_id=? ORDER BY id DESC').bind(c.get('uid'), petId)
    : c.env.DB.prepare('SELECT id,pet_id,health_flag,created_at,report_json FROM pet_reports WHERE maum_user_id=? ORDER BY id DESC').bind(c.get('uid'));
  const { results } = await q.all<any>();
  const reports = results.map((r: any) => {
    let summary = '', confidence = '';
    try { const j = JSON.parse(r.report_json); summary = (j?.summary || '').slice(0, 90); confidence = j?.confidence || ''; } catch {}
    return { id: r.id, pet_id: r.pet_id, health_flag: r.health_flag, created_at: r.created_at, summary, confidence };
  });
  return c.json({ reports });
});
app.get('/api/reports/:id', requireAuth, async (c) => {
  const rep = await c.env.DB.prepare('SELECT * FROM pet_reports WHERE id=? AND maum_user_id=?').bind(c.req.param('id'), c.get('uid')).first<any>();
  if (!rep) return c.json({ error: '리포트를 찾을 수 없어요' }, 404);
  return c.json({ report: JSON.parse(rep.report_json), health_flag: rep.health_flag, created_at: rep.created_at });
});

// ── 계정 삭제(회원 탈퇴) — Google Play 필수 ──
app.delete('/api/account', requireAuth, async (c) => {
  const uid = c.get('uid');
  // 1) 마음곁 도메인 + 빌링/제휴 데이터 전부 삭제(완전 탈퇴)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM pet_reports WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM observations WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM pets WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM subscriptions WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM packs WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM usage_monthly WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM coupon_redemptions WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM referrals WHERE maum_user_id=?').bind(uid),
  ]);
  // 2) 공용 마음 계정 삭제(통합 로그인 계정 — 마음 시리즈 전체에서 제거)
  await deleteUser(c.env.AUTH_DB, uid);
  return c.json({ ok: true });
});

// ── 공개 정책 페이지(Play 심사·데이터보안에 URL 제출) ──
const BIZ = '상호: 마음서비스 · 대표자: 김근혜 · 사업자등록번호: 780-31-01832 · 통신판매업 신고번호: 제 2026-서울영등포-1157 호 · 소재지: 서울특별시 영등포구 문래로26길 6(문래동3가) · 문의: limyj007@gmail.com';
const PAGE = (title: string, body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} · 마음곁</title>
<style>body{font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:720px;margin:0 auto;padding:28px 20px 60px;color:#222;line-height:1.7}
h1{font-size:22px}h2{font-size:16px;margin-top:28px}.muted{color:#777;font-size:13px}a{color:#16a34a}
.btn{display:inline-block;background:#dc2626;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer}
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin-top:16px}
.biz{margin-top:34px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:12px;line-height:1.9}.nav{font-size:13px;margin-bottom:8px}</style></head><body>
<div class="nav"><a href="/privacy">개인정보처리방침</a> · <a href="/terms">이용약관</a> · <a href="/faq">고객센터</a> · <a href="/account-deletion">회원 탈퇴</a></div>
${body}<div class="biz">🐾 마음곁 · ${BIZ}</div></body></html>`;

app.get('/privacy', (c) => c.html(PAGE('개인정보처리방침', `
<h1>마음곁 개인정보처리방침</h1>
<p class="muted">시행일: 2026-06-20</p>
<p>마음곁(이하 "서비스")은 반려동물의 행동을 통역해 드리는 서비스이며, 아래와 같이 개인정보를 처리합니다.</p>
<h2>1. 수집 항목</h2>
<ul>
<li><b>계정</b>: 이메일, 비밀번호(암호화 저장), 이름(선택)</li>
<li><b>반려동물 정보</b>: 이름, 종(개/고양이), 품종·나이·성격(선택)</li>
<li><b>관찰·통역 기록</b>: 선택한 행동 신호, 입력한 맥락, 생성된 통역 리포트</li>
</ul>
<h2>2. 영상 처리(비저장)</h2>
<p>통역을 위해 촬영한 짧은 영상의 프레임은 <b>분석 시에만 일시적으로 사용</b>되며, 원본·프레임을 서버나 기기에 <b>저장하지 않습니다</b>.</p>
<h2>3. 처리 위탁(제3자 제공 아님)</h2>
<ul>
<li><b>Anthropic</b>: 행동 통역 생성을 위해 입력 신호·맥락·영상 프레임을 AI 처리에 전송</li>
<li><b>Cloudflare</b>: 서버·데이터베이스 인프라</li>
<li><b>Google AdMob</b>: 무료 운영을 위한 광고 표시(도입 시) — 이 경우 광고 식별자(Advertising ID)가 맞춤형 광고 목적으로 수집·이용될 수 있습니다.</li>
</ul>
<h2>4. 보유 및 파기</h2>
<p>회원 탈퇴 시 위 모든 데이터를 <b>즉시 삭제</b>합니다. 다만 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다 — 계약·청약철회 기록 5년, 대금결제·재화공급 기록 5년, 소비자 불만·분쟁처리 기록 3년. 탈퇴는 앱 내 "회원 탈퇴" 또는 <a href="/account-deletion">여기</a>에서 가능합니다.</p>
<h2>5. 이용자 권리</h2>
<p>전송 구간은 HTTPS로 암호화되며, 데이터 열람·삭제를 요청할 수 있습니다.</p>
<h2>6. 아동</h2>
<p>본 서비스는 만 13세 미만 아동을 대상으로 하지 않습니다.</p>
<h2>7. 개인정보보호책임자</h2>
<p>김근혜 · limyj007@gmail.com</p>`)));

app.get('/terms', (c) => c.html(PAGE('이용약관', `
<h1>마음곁 이용약관</h1><p class="muted">시행일: 2026-06-21</p>
<h2>제1조(목적)</h2><p>본 약관은 마음서비스가 제공하는 '마음곁' 서비스 이용에 관한 회사와 이용자의 권리·의무를 정함을 목적으로 합니다.</p>
<h2>제2조(서비스 내용)</h2><p>마음곁은 반려동물의 행동 신호와 맥락을 동물행동학 관점에서 통역하는 서비스입니다. 통역 결과는 <b>참고용</b>이며 수의학적 진단·치료가 아닙니다.</p>
<h2>제3조(계정)</h2><p>이용자는 이메일 계정으로 가입하며, 계정 정보 관리 책임은 이용자에게 있습니다.</p>
<h2>제4조(이용권·결제)</h2><p>유료 이용권은 외부 판매처(예: 네이버 스마트스토어)에서 구매 후 발급받은 코드를 서비스에 등록하여 이용합니다. 이용권 종류·제공량은 구매 시점 안내에 따릅니다.</p>
<h2>제5조(청약철회·환불)</h2><p>디지털 콘텐츠(이용권 코드)는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라, 코드 발송 및 사용(등록) 후에는 청약철회가 제한될 수 있습니다. 미사용·미발송 건은 관련 법령에 따라 환불됩니다.</p>
<h2>제6조(금지행위)</h2><p>코드의 부정 사용·재판매, 타인 계정 도용, 서비스 부정 접근·자동화 남용을 금지합니다.</p>
<h2>제7조(면책)</h2><p>통역 결과는 참고 정보이며, 회사는 이를 근거로 한 의사결정의 결과에 대해 법적 책임을 지지 않습니다. 건강이 우려되는 경우 수의사 상담을 권장합니다.</p>
<h2>제8조(분쟁해결·준거법)</h2><p>본 약관은 대한민국 법령에 따르며, 분쟁은 관계 법령 및 회사 소재지 관할 법원에 따릅니다.</p>`)));

app.get('/verify', async (c) => {
  const tok = c.req.query('token');
  const uid = tok ? await c.env.KV.get(`emailverify:${tok}`) : null;
  if (uid) { await markEmailVerified(c.env.AUTH_DB, Number(uid)); await c.env.KV.delete(`emailverify:${tok}`); }
  return c.html(PAGE('이메일 인증', uid
    ? `<h1>이메일 인증 완료 ✅</h1><p>이제 마음곁을 모두 이용할 수 있어요. 앱(또는 maumgyeot.com)으로 돌아가 주세요.</p>`
    : `<h1>인증 링크가 유효하지 않아요</h1><p>만료되었거나 이미 사용된 링크예요. 앱에서 인증 메일을 다시 보내 주세요.</p>`));
});
app.get('/reset', (c) => c.html(PAGE('비밀번호 재설정', `
<h1>비밀번호 재설정</h1>
<div class="card"><p>새 비밀번호(8자 이상)를 입력해 주세요.</p>
<input id="pw" type="password" placeholder="새 비밀번호" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box"/>
<p id="msg" class="muted" style="margin-top:8px"></p>
<button class="btn" style="background:#16a34a;margin-top:10px" onclick="go()">변경하기</button></div>
<script>var t=new URLSearchParams(location.search).get('token');
function go(){var pw=document.getElementById('pw').value,m=document.getElementById('msg');if((pw||'').length<8){m.style.color='#C0492F';m.textContent='8자 이상 입력해 주세요';return;}
fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,password:pw})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});}).then(function(x){if(!x.ok)throw new Error(x.d.error||'실패');m.style.color='#16a34a';m.textContent='변경되었습니다. 앱에서 새 비밀번호로 로그인해 주세요.';}).catch(function(e){m.style.color='#C0492F';m.textContent=e.message;});}
</script>`)));

app.get('/faq', (c) => c.html(PAGE('자주 묻는 질문', `
<h1>자주 묻는 질문 · 고객센터</h1>
<h2>이용권 코드는 어떻게 등록하나요?</h2><p>홈 화면의 '🎟️ 이용권' 칸에 구매하신 코드를 입력하고 '등록'을 누르면 즉시 적용됩니다.</p>
<h2>이용권은 어디서 사나요?</h2><p>네이버 스마트스토어에서 구매 후 코드를 받아 등록합니다(앱 내 '구매하기'에서 스토어로 이동).</p>
<h2>환불이 되나요?</h2><p>디지털 콘텐츠(코드)는 발송·등록 후 청약철회가 제한될 수 있습니다. 미사용·미발송 건은 관계 법령에 따라 환불됩니다. 문의: limyj007@gmail.com</p>
<h2>비밀번호를 잊었어요</h2><p>로그인 화면의 '비밀번호를 잊으셨나요?'에서 재설정 메일을 받을 수 있어요.</p>
<h2>촬영한 영상은 저장되나요?</h2><p>아니요. 통역 분석에만 잠깐 쓰이고 저장하지 않습니다.</p>
<h2>회원 탈퇴는 어떻게 하나요?</h2><p>홈 하단 '회원 탈퇴' 또는 <a href="/account-deletion">여기</a>에서 가능합니다.</p>
<h2>문의</h2><p>limyj007@gmail.com</p>`)));

app.get('/account-deletion', (c) => c.html(PAGE('회원 탈퇴', `
<h1>마음곁 회원 탈퇴 · 계정 삭제</h1>
<p>탈퇴 시 <b>계정과 모든 데이터(반려동물 정보·관찰·통역 기록)가 즉시 영구 삭제</b>되며 복구할 수 없습니다.
영상은 애초에 저장하지 않으므로 삭제 대상이 아닙니다.</p>
<p class="muted">⚠️ 마음곁 계정은 마음 시리즈(마음수달 등) 통합 로그인 계정입니다. 탈퇴하면 같은 계정의 다른 마음 서비스에서도 함께 삭제됩니다.</p>
<div class="card" id="box">
  <p id="msg">로그인 상태를 확인하는 중…</p>
  <button class="btn" id="del" style="display:none" onclick="doDelete()">계정 영구 삭제</button>
</div>
<p class="muted">앱 내에서도 <b>홈 화면 하단 → 회원 탈퇴</b>로 진행할 수 있습니다. 로그인 없이 삭제를 원하시면 limyj007@gmail.com 으로 가입 이메일과 함께 요청해 주세요.</p>
<script>
var TOKEN_KEY='maumgyeot_token';
var token=localStorage.getItem(TOKEN_KEY);
var msg=document.getElementById('msg'), del=document.getElementById('del');
if(token){ msg.textContent='현재 로그인되어 있습니다. 아래 버튼으로 계정을 영구 삭제할 수 있습니다.'; del.style.display='inline-block'; }
else { msg.innerHTML='로그인되어 있지 않습니다. 앱(또는 maumgyeot.com)에서 로그인 후 이 페이지를 다시 열어 주세요.'; }
function doDelete(){
  if(!confirm('정말 계정과 모든 데이터를 영구 삭제할까요? 되돌릴 수 없습니다.')) return;
  del.disabled=true; del.textContent='삭제 중…';
  fetch('/api/account',{method:'DELETE',headers:{Authorization:'Bearer '+token}})
    .then(function(r){ if(!r.ok) throw new Error(); localStorage.removeItem(TOKEN_KEY);
      msg.textContent='계정이 삭제되었습니다. 그동안 이용해 주셔서 감사합니다.'; del.style.display='none'; })
    .catch(function(){ del.disabled=false; del.textContent='계정 영구 삭제'; alert('삭제 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'); });
}
</script>`)));

// 정적 프론트(React CDN) — /api 외는 assets
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
