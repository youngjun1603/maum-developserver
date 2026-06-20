// 마음곁 (MaumGyeot) — Worker (Hono). MVP. 반려동물 행동 통역.
// 계정/인증은 공용 maum-auth(AUTH_DB) + 공유 모듈 ./auth (마음수달과 동일 사본).
// 안전: 단정 금지(confidence 필수)·수의학 용어 금지·health_flag·종 분리 — docs/ 준수.
import { Hono } from 'hono';
import { registerUser, loginUser, getUser, issueToken, requireAuth, deleteUser } from './auth';
import { BEHAVIOR, signalsToLines } from './behavior';

type Bindings = { DB: D1Database; AUTH_DB: D1Database; KV: KVNamespace; JWT_SECRET: string; ANTHROPIC_API_KEY: string; ASSETS: Fetcher };
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

async function callClaude(env: Bindings, opts: { system: string; messages: any[]; max_tokens: number; temperature?: number }) {
  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: REPORT_MODEL, max_tokens: opts.max_tokens, temperature: opts.temperature ?? 0, system: opts.system, messages: opts.messages }),
  });
  if (!res.ok) throw new Error('LLM ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const data = await res.json<any>();
  return (data?.content?.[0]?.text || '').trim();
}

app.get('/api/health', (c) => c.json({ ok: true }));

// ── 인증 (공용 maum-auth) ──
app.post('/api/auth/register', async (c) => {
  const { email, password, name } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400);
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
app.get('/api/auth/me', requireAuth, async (c) => c.json({ user: await getUser(c.env.AUTH_DB, c.get('uid')) }));

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
  const { pet_id, signals, context, media_note, frames } = await c.req.json().catch(() => ({}));
  const pet = await c.env.DB.prepare('SELECT * FROM pets WHERE id=? AND maum_user_id=?').bind(pet_id, c.get('uid')).first<any>();
  if (!pet) return c.json({ error: '반려동물을 찾을 수 없어요' }, 404);
  const species = pet.species === 'dog' ? 'dog' : 'cat';
  const codes: string[] = Array.isArray(signals) ? signals : [];
  const { lines, hasHealth, hasAmbiguous } = signalsToLines(species, codes);

  // 영상 프레임(비전): 분석에만 일시 사용, 어디에도 저장하지 않음(원본·프레임 미저장). 최대 6장.
  const frameArr: string[] = Array.isArray(frames) ? frames.slice(0, 6) : [];
  const hasVideo = frameArr.length > 0;

  const userMsg = `[반려동물] 종: ${species === 'cat' ? '고양이' : '개'} | 이름: ${pet.name} | 나이: ${pet.age ?? '미상'}${pet.personality ? ` | 성격: ${pet.personality}` : ''}
[관찰한 행동 신호]
${lines || '- (선택된 신호 없음)'}
[맥락] ${context || '(미입력)'}${hasVideo ? '\n[영상] 짧은 영상에서 뽑은 연속 프레임을 함께 첨부했어요.' : ''}

위 관찰을 보호자용 통역 리포트(JSON)로 만들어 주세요.${hasVideo ? ' 첨부 프레임에서 자세·꼬리·귀·표정을 함께 읽어 통역에 반영해 주세요.' : ''}${hasAmbiguous ? ' 다의적 신호가 포함되어 있으니 caveat를 꼭 채우세요.' : ''}`;

  const userContent: any = hasVideo
    ? [...frameArr.map((f) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(f).replace(/^data:image\/\w+;base64,/, '') } })), { type: 'text', text: userMsg }]
    : userMsg;

  let report: any = { summary: '신호가 충분하지 않아 해석이 어려워요. 더 지켜봐 주세요.', confidence: 'low', body_signals_read: [], possible_meanings: [], what_to_do: ['반려동물의 평소 모습과 비교하며 며칠 더 관찰해 주세요.'], health_flag: { flag: false, note: '' } };
  if (codes.length > 0 || hasVideo || (context && context.length > 1)) {
    try {
      let raw = await callClaude(c.env, { system: TRANSLATE_SYSTEM, messages: [{ role: 'user', content: userContent }], max_tokens: 1400, temperature: 0 });
      raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (!VET_TERMS.some((t) => JSON.stringify(parsed).includes(t))) report = parsed;
      else {
        let raw2 = await callClaude(c.env, { system: TRANSLATE_SYSTEM + '\n(이전 출력에 금지된 수의학 용어가 있었습니다. 절대 사용하지 마세요.)', messages: [{ role: 'user', content: userContent }], max_tokens: 1400, temperature: 0 });
        raw2 = raw2.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        try { const p2 = JSON.parse(raw2); if (!VET_TERMS.some((t) => JSON.stringify(p2).includes(t))) report = p2; } catch {}
      }
    } catch (e) { console.log('OBSERVE_FAIL', String((e as any)?.message || e)); }
  }

  // health 보정(보수적·진단 아님): 건강 관련 신호 또는 맥락 키워드 시 health_flag
  const HEALTH_KW = ['아파', '아픈', '절뚝', '토했', '구토', '설사', '안 먹', '못 먹', '식욕', '기운 없', '무기력', '피', '다쳤', '떨'];
  const ctxHit = typeof context === 'string' && HEALTH_KW.some((k) => context.includes(k));
  if (report?.health_flag && (hasHealth || ctxHit) && !report.health_flag.flag) {
    report.health_flag.flag = true;
    report.health_flag.note = report.health_flag.note || '몸이 불편한 신호일 수 있어요. 단정은 아니며, 수의사 상담을 권해드려요.';
  }
  const healthFlag = report?.health_flag?.flag ? 1 : 0;

  const noteToSave = hasVideo ? '영상 분석함(원본·프레임 미저장)' : (media_note ?? null);
  const obs = await c.env.DB.prepare('INSERT INTO observations (pet_id,maum_user_id,species,signals_json,context,media_note) VALUES (?,?,?,?,?,?)')
    .bind(pet.id, c.get('uid'), species, JSON.stringify(codes), context ?? null, noteToSave).run();
  const rep = await c.env.DB.prepare('INSERT INTO pet_reports (observation_id,pet_id,maum_user_id,report_json,health_flag) VALUES (?,?,?,?,?)')
    .bind(obs.meta.last_row_id, pet.id, c.get('uid'), JSON.stringify(report), healthFlag).run();
  return c.json({ report, report_id: rep.meta.last_row_id });
});

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
  // 1) 마음곁 도메인 데이터 전부 삭제
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM pet_reports WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM observations WHERE maum_user_id=?').bind(uid),
    c.env.DB.prepare('DELETE FROM pets WHERE maum_user_id=?').bind(uid),
  ]);
  // 2) 공용 마음 계정 삭제(통합 로그인 계정 — 마음 시리즈 전체에서 제거)
  await deleteUser(c.env.AUTH_DB, uid);
  return c.json({ ok: true });
});

// ── 공개 정책 페이지(Play 심사·데이터보안에 URL 제출) ──
const PAGE = (title: string, body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} · 마음곁</title>
<style>body{font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:720px;margin:0 auto;padding:28px 20px 60px;color:#222;line-height:1.7}
h1{font-size:22px}h2{font-size:16px;margin-top:28px}.muted{color:#777;font-size:13px}a{color:#16a34a}
.btn{display:inline-block;background:#dc2626;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer}
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin-top:16px}</style></head><body>${body}
<p class="muted" style="margin-top:40px">🐾 마음곁 · 문의 limyj007@gmail.com</p></body></html>`;

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
<p>회원 탈퇴 시 위 모든 데이터를 <b>즉시 삭제</b>합니다(법령상 보관 의무가 있는 경우 제외). 탈퇴는 앱 내 "회원 탈퇴" 또는 <a href="/account-deletion">여기</a>에서 가능합니다.</p>
<h2>5. 이용자 권리</h2>
<p>전송 구간은 HTTPS로 암호화되며, 데이터 열람·삭제를 요청할 수 있습니다.</p>
<h2>6. 아동</h2>
<p>본 서비스는 만 13세 미만 아동을 대상으로 하지 않습니다.</p>
<h2>7. 문의</h2>
<p>limyj007@gmail.com</p>`)));

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
