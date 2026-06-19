// 마음수달 (MaumOtter) — Worker (Hono). MVP.
// 계정/인증은 공용 maum-auth(AUTH_DB) + 공유 모듈 ./auth (마음곁과 동일 사본).
// 안전원칙(단정금지·의료용어금지·비밀거짓말금지·위기 보수판정)은 docs/ 준수.
import { Hono } from 'hono';
import { registerUser, loginUser, getUser, issueToken, requireAuth, hashPassword, verifyPassword } from './auth';

type Bindings = {
  DB: D1Database;          // 마음수달 도메인 (children/sessions/utterances/reports)
  AUTH_DB: D1Database;     // 공용 maum-auth (users) — 마음곁과 공유
  KV: KVNamespace;
  ASSETS: Fetcher;
  JWT_SECRET: string;      // 마음 시리즈 공유
  ANTHROPIC_API_KEY: string;
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
async function callClaude(env: Bindings, opts: { model: string; system: string; messages: any[]; max_tokens: number; temperature?: number }) {
  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: opts.model, max_tokens: opts.max_tokens, temperature: opts.temperature ?? 1, system: opts.system, messages: opts.messages }),
  });
  if (!res.ok) throw new Error('LLM ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const data = await res.json() as any;
  return (data.content?.find((b: any) => b.type === 'text')?.text ?? '').trim();
}

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
  const { email, password, name } = await c.req.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8) return c.json({ error: '이메일과 8자 이상 비밀번호가 필요해요' }, 400);
  try {
    const user = await registerUser(c.env.AUTH_DB, { email, password, name });
    return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
  } catch (e: any) {
    if (e?.message === 'DUPLICATE_EMAIL') return c.json({ error: '이미 가입된 이메일이에요' }, 409);
    return c.json({ error: '가입 처리 중 문제가 생겼어요' }, 500);
  }
});
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
  const user = await loginUser(c.env.AUTH_DB, { email, password });
  if (!user) return c.json({ error: '이메일 또는 비밀번호가 맞지 않아요' }, 401);
  return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
});
app.get('/api/auth/me', requireAuth, async (c) => {
  return c.json({ user: await getUser(c.env.AUTH_DB, c.get('uid')) });
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
  } catch (e) { console.log('chat LLM fail:', String((e as any)?.message || e)); /* 폴백 reply 유지 */ }
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
    } catch (e) { console.log('REPORT_FAIL', String((e as any)?.message || e)); }
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

// 정적 프론트(React CDN) — /api 외는 assets
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
