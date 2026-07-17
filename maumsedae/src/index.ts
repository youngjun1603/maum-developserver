// ============================================================================
// 마음세대 (MaumSedae) — 부모-자녀 세대 통역 메인 워커 (Cloudflare Workers + Hono)
// 마음풀 생태계 공유: maumful-db·KV·JWT_SECRET. 진입은 마음풀 /api/sedae-token(?t=).
// ============================================================================
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import translate from './translate-route';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS — 마음풀 생태계 오리진만(Bearer 토큰 방식이라 credentials 불필요)
const ALLOWED = new Set([
  'https://sedae.maumful.com',
  'https://maumful.com',
  'https://couple.maumful.com',
]);
app.use('/api/*', cors({
  origin: (o) => (ALLOWED.has(o) ? o : ''),
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// 공개 헬스체크 (인증 불필요)
app.get('/health', (c) => c.json({ ok: true, service: 'maumsedae' }));

// ============================================================================
// ★ 공유 웹뷰 — 미인증 공개 라우트 (이 앱의 핵심 차이)
// ============================================================================
// DEV_01 §4: "미가입 상대는 앱 설치 없이 웹뷰로 열람 가능 — 70대 부모 실효성의 조건,
//   가입 유도는 열람 후". 마음부부의 초대코드(쌍방 앱 사용 전제)를 그대로 쓸 수 없다.
// ⚠️ 인증 미들웨어 **밖**에 둔다(translate 라우터 안에 두면 로그인 없이는 못 본다).
// ⚠️ 노출해도 되는 것은 shared_items.payload뿐 — 공유 승인된 내용만 들어 있다.
//    통역 질의 이력·관계 기억·수신 통역 결과·상대 계정 정보는 **조회조차 하지 않는다**.
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));

// 한글 조사 — 받침 유무로 이/가를 고른다. "자녀이(가)"처럼 나오면 사람이 쓴 글로 안 읽힌다.
function iga(word: string): string {
  const ch = (word || '').trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (!ch || code < 0xac00 || code > 0xd7a3) return '가';
  return (code - 0xac00) % 28 === 0 ? '가' : '이';
}

const SHARE_TITLE: Record<string, string> = {
  message: '다듬은 한마디를 보내왔어요',
  mediate_view: '함께 보기 — 대화 돌아보기',
  perspective_view: '함께 보기 — 상대의 마음',
  activity_invite: '같이 해볼래요?',
};

app.get('/s/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB
    .prepare("SELECT item_type, payload, sender_label, status FROM sedae_shared_items WHERE id = ?")
    .bind(id)
    .first<{ item_type: string; payload: string; sender_label: string | null; status: string }>();

  const page = (inner: string) => c.html(`<!doctype html><html lang="ko"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>마음세대</title>
<style>
 body{margin:0;background:#eef6f1;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#1a2b22}
 .w{max-width:520px;margin:0 auto;padding:22px 16px 40px}
 .h{display:flex;align-items:center;gap:8px;color:#2d6a4f;font-weight:800;font-size:18px;margin-bottom:16px}
 .c{background:#fff;border:1px solid #dbe7e0;border-radius:16px;padding:20px;margin-bottom:14px}
 .t{font-size:13px;color:#5a6b62;margin-bottom:8px}
 .b{font-size:17px;line-height:1.85;white-space:pre-wrap}
 .m{color:#5a6b62;font-size:13.5px;line-height:1.8}
 a.btn{display:block;text-align:center;background:#2d6a4f;color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:800;font-size:15px}
 .f{color:#8a9a92;font-size:12px;line-height:1.7;margin-top:16px;text-align:center}
</style></head><body><div class="w">
 <div class="h">🌿 마음세대</div>${inner}
 <div class="f">이 페이지는 보내신 분이 <b>직접 고른 내용만</b> 담고 있어요.<br/>대화 기록이나 분석 내용은 담기지 않습니다.</div>
</div></body></html>`);

  if (!row || row.status === 'revoked') {
    return page(`<div class="c"><div class="b" style="font-size:15px">링크가 만료되었거나 취소되었어요.</div></div>`);
  }

  // 열람 처리 (한 번만)
  if (row.status === 'sent') {
    c.executionCtx.waitUntil(
      c.env.DB.prepare("UPDATE sedae_shared_items SET status='viewed', viewed_at=datetime('now') WHERE id = ? AND status='sent'").bind(id).run().then(() => {}).catch(() => {})
    );
  }

  let p: Record<string, unknown> = {};
  try { p = JSON.parse(row.payload) as Record<string, unknown>; } catch { p = {}; }
  const who = esc(row.sender_label || '가족');
  const title = SHARE_TITLE[row.item_type] || '보내온 마음';

  let body = '';
  if (row.item_type === 'message') {
    body = `<div class="c"><div class="t">${who}${iga(who)} 전하고 싶었던 말</div><div class="b">${esc(p.text)}</div></div>`;
  } else if (row.item_type === 'activity_invite') {
    body = `<div class="c"><div class="t">${who}${iga(who)} 같이 해보자고 해요</div><div class="b">${esc(p.action)}</div></div>`;
  } else {
    const parts = Object.entries(p)
      .filter(([, v]) => typeof v === 'string' && v)
      .map(([k, v]) => `<div class="c"><div class="t">${esc(k)}</div><div class="b">${esc(v)}</div></div>`)
      .join('');
    body = parts || `<div class="c"><div class="m">내용이 비어 있어요.</div></div>`;
  }

  return page(`
 <div class="c"><div class="m"><b>${who}</b>${iga(who)} ${esc(title)}</div></div>
 ${body}
 <a class="btn" href="https://maumful.com">나도 마음세대 써보기</a>`);
});

// 통역 API — 인증 미들웨어는 translate 내부에서 전 라우트에 적용
app.route('/api', translate);

export default app;
