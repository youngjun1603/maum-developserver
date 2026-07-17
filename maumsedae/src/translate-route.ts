// ============================================================================
// 마음세대(부모-자녀 세대 통역) API 라우트 — 마음부부에서 파생
// ============================================================================
// translation-prompts.ts와 함께 사용. 파일 전체 교체 방식.
//
// 엔드포인트:
//   POST /api/translate           — 통역 실행 (4모드 × 2트랙, 개선활동 포함)
//   POST /api/feedback            — 활동 실행 피드백 (성공/실패 → 재해석 응답)
//   POST /api/community/post      — 커뮤니티 게시 (AI 사전 검수 게이트)
//   GET  /api/community/posts     — 커뮤니티 글 목록
//   GET  /api/relations           — 내 관계 목록 (다중 관계 — 아버지/어머니/자녀별)
//   POST /api/relation            — 관계 생성
//   PATCH /api/relation           — 관계 표시명·상대맥락 수정
//   ⚠️ consent/*(멀티모달)·community/*·share/*는 NOT_YET 게이트로 차단 중
//   GET  /api/memory              — 관계 기억 조회
//
// 필요 바인딩 (wrangler.toml):
//   DB: D1Database / KV: KVNamespace / ANTHROPIC_API_KEY: Secret / JWT_SECRET: Secret
// ============================================================================

import { Hono } from 'hono';
import {
  buildTranslationPrompt,
  buildMemoryUpdatePrompt,
  buildFeedbackPrompt,
  buildModerationPrompt,
  parseTranslationResponse,
  TranslationConfig,
  RelationshipMemory,
  ModerationResult,
  ActivityFeedback,
  Track,
  Mode,
  UserRole,
  AgeTier,
} from './translation-prompts';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
};

const translate = new Hono<{ Bindings: Bindings; Variables: { uid: number } }>();

// ── 마음풀 생태계 연동 (필수수정 v4) ─────────────────────────────────────────
// [fix①] Anthropic은 Cloudflare AI Gateway 경유 — 직접 api.anthropic.com은 Workers egress 403 차단
const AI_GATEWAY = 'https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages';
// [fix②] 모델은 마음풀과 통일
const MODEL = 'claude-sonnet-4-6';
// [fix④] 통역 모드별 크레딧(마음풀 users.credits 차감). 피드백·커뮤니티는 무료(0)
const CREDIT_COST: Record<Mode, number> = { receive: 2, send: 2, mediate: 3, perspective: 3 };
// 청소년은 무료 전용(미성년자 계약 취소권 회피 + 기획 원칙) — 남용 방지 일일 한도만 둔다.
const TEEN_DAILY_LIMIT = 10;

// [fix③] JWT 검증 (마음풀/마음커플과 동일 시크릿·crypto.subtle 방식)
async function verifyJWT(token: string, secret: string): Promise<number | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [hdr, payload, sig] = parts;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const decode = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, decode(sig), new TextEncoder().encode(`${hdr}.${payload}`));
    if (!valid) return null;
    const p = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (p.exp && Date.now() / 1000 > p.exp) return null;
    if (p.type && !['sedae'].includes(p.type)) return null; // 마음세대 토큰만 (마음풀 /api/sedae-token)
    return Number(p.sub || p.id) || null;
  } catch { return null; }
}

// [fix③] 인증 미들웨어 — 모든 라우트에 적용. Bearer 또는 ?t= 토큰 → uid
translate.use('*', async (c, next) => {
  const secret = (await c.env.KV.get('JWT_SECRET')) ?? c.env.JWT_SECRET ?? '';
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (c.req.query('t') || '');
  const uid = token && secret ? await verifyJWT(token, secret) : null;
  if (!uid) return c.json({ error: '로그인이 필요합니다.' }, 401);
  c.set('uid', uid);
  await next();
});

// ⚠️ 순서 중요: 청소년 차단이 미구현 게이트(NOT_YET)보다 **먼저** 돌아야 한다.
//   NOT_YET이 먼저면 503이 teen 403을 가려, 아동 안전 가드가 검증되지 않은 채 남는다.
//   3단계에서 NOT_YET 항목을 지우는 순간 teen 차단이 유일한 방어가 되므로, 지금 검증 가능해야 한다.
//   의미상으로도 청소년에겐 "준비 중"(나중에 열림)이 아니라 "쓸 수 없음"이 맞다.
// ⚠️ 청소년(teen) 기능 제한 — 코드 레벨 차단 (DEV_01 §2.1)
//   프롬프트로만 막지 않는다. 아래는 teen 계정에서 **요청 자체가 불가능**해야 한다.
//   - 멀티모달: 부모를 몰래 녹음하는 흐름을 시스템이 만들지 않는다 (동의 요청 생성 자체 불가)
//   - 커뮤니티: 성인 방 노출 금지(그루밍 등 접촉 위험)
//   - 공유 발신: 부모에게 통역 결과가 전달되는 경로 차단 (아이 안전 직결)
//   - 결제: 민법상 미성년자 계약은 법정대리인 동의 없이 취소 가능 → 청소년은 무료 범위만
const TEEN_BLOCKED: Record<string, string> = {
  '/consent/request': '이 기능은 어른 계정에서만 쓸 수 있어요.',
  '/consent/accept':  '이 기능은 어른 계정에서만 쓸 수 있어요.',
  '/consent/revoke':  '이 기능은 어른 계정에서만 쓸 수 있어요.',
  '/community/post':  '커뮤니티는 어른들이 이야기하는 공간이라 아직 열려 있지 않아요.',
  '/community/posts': '커뮤니티는 어른들이 이야기하는 공간이라 아직 열려 있지 않아요.',
  '/share/send':      '통역한 내용을 부모님께 보내는 기능은 쓸 수 없어요. 네 기록은 너만 볼 수 있어요.',
  '/share/respond':   '이 기능은 어른 계정에서만 쓸 수 있어요.',
  '/relation/invite': '부모님을 초대하는 기능은 쓸 수 없어요.',
  '/relation/join':   '이 기능은 어른 계정에서만 쓸 수 있어요.',
};
translate.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname.replace(/^\/api/, '');
  const msg = TEEN_BLOCKED[path];
  if (msg) {
    const tier = await getAgeTier(c.env.KV, c.get('uid'));
    if (tier === 'teen') return c.json({ error: msg, teenBlocked: true }, 403);
  }
  await next();
});

// ⚠️ 미구현 경로 게이트 (1단계 = 뼈대)
//   마음부부에서 파생하면서 라우트는 따라왔지만, 이 앱의 테이블·설계가 아직 없는 것들이다.
//   그냥 두면 없는 테이블을 조회해 **조용히 500**이 난다 → 여기서 명시적으로 막는다.
//   각 항목을 구현할 때 이 목록에서 지울 것.
const NOT_YET: Record<string, { status: 403 | 503; msg: string }> = {
  // MVP 제외 — 설계상 재설계가 필요하다(SPEC 6장). 마음부부의 코드 동의 게이트는
  // 쌍방이 앱을 쓴다는 전제인데, 70~80대 노부모가 코드로 동의하는 그림은 비현실적이다.
  '/consent/request': { status: 403, msg: '멀티모달(사진·녹음)은 아직 제공하지 않아요. 지금은 텍스트로 이용해 주세요.' },
  '/consent/accept':  { status: 403, msg: '멀티모달(사진·녹음)은 아직 제공하지 않아요.' },
  '/consent/revoke':  { status: 403, msg: '멀티모달(사진·녹음)은 아직 제공하지 않아요.' },
  // 3단계 예정 (테이블 미생성)
  '/community/post':  { status: 503, msg: '커뮤니티는 준비 중이에요.' },
  '/community/posts': { status: 503, msg: '커뮤니티는 준비 중이에요.' },
  '/share/send':      { status: 503, msg: '공유는 준비 중이에요.' },
  '/share/inbox':     { status: 503, msg: '공유는 준비 중이에요.' },
  '/share/respond':   { status: 503, msg: '공유는 준비 중이에요.' },
  '/relation/invite': { status: 503, msg: '상대 초대는 준비 중이에요.' },
  '/relation/join':   { status: 503, msg: '상대 초대는 준비 중이에요.' },
};
translate.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname.replace(/^\/api/, '');
  const blocked = NOT_YET[path];
  if (blocked) return c.json({ error: blocked.msg }, blocked.status);
  await next();
});

// [fix④] 크레딧 차감/환불 — 마음풀 users.credits·credit_transactions 공유(원자적 UPDATE)
async function spendCredits(db: D1Database, userId: number, amount: number, reason: string): Promise<{ ok: boolean; balance: number; error?: string }> {
  if (amount <= 0) {
    const u = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>();
    return { ok: true, balance: u?.credits ?? 0 };
  }
  const r = await db.prepare('UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?').bind(amount, userId, amount).run();
  if (!r.meta.changes) {
    const u = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>();
    if (!u) return { ok: false, balance: 0, error: 'user_not_found' };
    return { ok: false, balance: u.credits, error: 'insufficient_credits' };
  }
  const u = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>();
  const bal = u!.credits;
  await db.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)').bind(userId, 'spend', amount, reason, bal).run();
  return { ok: true, balance: bal };
}
async function refundCredits(db: D1Database, userId: number, amount: number, reason: string): Promise<void> {
  if (amount <= 0) return;
  await db.prepare('UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(amount, userId).run();
  const u = await db.prepare('SELECT credits FROM users WHERE id = ?').bind(userId).first<{ credits: number }>();
  await db.prepare('INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)').bind(userId, 'gain', amount, reason, u?.credits ?? 0).run();
}

// [fix③] relationId 소유권 — 이 uid가 이 관계의 당사자인가
async function assertRelationOwner(db: D1Database, relationId: number, uid: number): Promise<boolean> {
  // 다중 관계: 관계를 만든 사용자(owner) 또는 연결된 상대(counterpart)만 접근 가능.
  const row = await db.prepare('SELECT 1 AS ok FROM sedae_relations WHERE id = ? AND (owner_id = ? OR counterpart_id = ?)').bind(relationId, uid, uid).first<{ ok: number }>();
  return !!row;
}

// [fix③] 커뮤니티 익명 해시 — 서버에서 uid로 생성(user_id 직접 저장 금지)
async function hashAuthor(uid: number): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sedae:' + uid));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
// ----------------------------------------------------------------------------
// D1 스키마 — ⚠️ 진본은 migrations/0001_maumsedae.sql 하나다. 여기에 복사본을 두지 않는다.
//   (마음부부에선 코드 주석의 스키마가 낡아 실제와 어긋났다 — 같은 실수 반복 금지)
//   테이블: sedae_relations(다중관계) · sedae_relation_memory(relation_id+user_id 복합키)
//           sedae_translation_logs · sedae_relation_safety · sedae_activity_log
//   ⚠️ sedae_relation_memory는 반드시 (relation_id, user_id) 복합키 — 단일키면 상대의 기억이
//      내 통역 프롬프트에 주입된다. 이 앱에선 더 위험하다(아이가 입력한 학대 정황이 부모에게 샘).
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 유틸: Anthropic API 호출
// ----------------------------------------------------------------------------

async function callClaude(
  apiKey: string,
  system: string,
  userMessage: string,
  maxTokens = 1500
): Promise<string> {
  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  return data.content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n');
}

// ----------------------------------------------------------------------------
// 유틸: 관계 기억 조회/저장
// ----------------------------------------------------------------------------

// ⚠️ ADDENDUM 02 §1 — 관계 기억은 (relation_id, user_id) 복합키다.
//    userId를 빼면 배우자의 기억이 내 통역 프롬프트에 주입된다("수신 통역 결과 공유 금지" 위반).
//    userId는 반드시 JWT(c.get('uid'))에서 파생할 것 — body로 받으면 타인 기억을 조회할 수 있다.
async function loadMemory(db: D1Database, relationId: number, userId: number): Promise<RelationshipMemory | undefined> {
  const row = await db
    .prepare('SELECT * FROM sedae_relation_memory WHERE relation_id = ? AND user_id = ?')
    .bind(relationId, userId)
    .first<Record<string, string>>();
  if (!row) return undefined;

  const safeParse = (s: string | null | undefined): string[] => {
    try { return s ? JSON.parse(s) : []; } catch { return []; }
  };

  return {
    recurringTopics: safeParse(row.recurring_topics),
    psychologyProfile: row.psychology_profile || undefined,
    christianProfile: row.christian_profile || undefined,
    successPatterns: safeParse(row.success_patterns),
    partnerPerspective: row.partner_perspective || undefined,
  };
}

async function saveMemory(db: D1Database, relationId: number, userId: number, mem: RelationshipMemory): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sedae_relation_memory
        (relation_id, user_id, recurring_topics, psychology_profile, christian_profile, success_patterns, partner_perspective, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(relation_id, user_id) DO UPDATE SET
        recurring_topics = excluded.recurring_topics,
        psychology_profile = excluded.psychology_profile,
        christian_profile = excluded.christian_profile,
        success_patterns = excluded.success_patterns,
        partner_perspective = excluded.partner_perspective,
        updated_at = datetime('now')`
    )
    .bind(
      relationId,
      userId,
      JSON.stringify(mem.recurringTopics ?? []),
      mem.psychologyProfile ?? null,
      mem.christianProfile ?? null,
      JSON.stringify(mem.successPatterns ?? []),
      mem.partnerPerspective ?? null
    )
    .run();
}

// ----------------------------------------------------------------------------
// 유틸: 동의 세션 검증 (멀티모달 게이트 — 스펙 5.2)
// ----------------------------------------------------------------------------

async function verifyConsentSession(
  db: D1Database,
  consentSessionId: string,
  relationId: number
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT status FROM consent_sessions
       WHERE id = ? AND relation_id = ? AND status = 'active'`
    )
    .bind(consentSessionId, relationId)
    .first<{ status: string }>();
  return !!row;
}

// ----------------------------------------------------------------------------
// POST /api/translate — 통역 실행
// ----------------------------------------------------------------------------

translate.post('/translate', async (c) => {
  try {
    const body = await c.req.json<{
      relationId: number;
      track: Track;
      mode: Mode;
      input: string;
      emotionDepth?: 1 | 2 | 3;
      theologyLevel?: 1 | 2 | 3;
      pastoralTone?: 'grace' | 'direct';
      userContext?: string;
      /** 입력 출처 (DEV_01 §2.3) — 부모 사용자가 자녀 대화를 본 경우 구분 */
      inputSource?: 'direct' | 'observed';
      /** observed 신뢰 경계 안내를 보고도 계속 진행할 때 */
      acknowledgeBoundary?: boolean;
      multimodal?: {
        consentSessionId: string;
        toneAnalysis?: string;
        visualCues?: string;
      };
    }>();

    if (!body.input || !body.relationId) {
      return c.json({ error: 'input과 relationId는 필수입니다.' }, 400);
    }
    if (body.input.length > 8000) {
      return c.json({ error: '입력이 너무 깁니다 (최대 8,000자).' }, 400);
    }

    // ── [fix③] relationId 소유권 가드 ──
    const uid = c.get('uid');
    if (!(await assertRelationOwner(c.env.DB, body.relationId, uid))) {
      return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    }

    // ── 연령등급 (생년월일에서 매번 재계산 — 만 19세 도달 시 자동 전환) ──
    const ageTier = await getAgeTier(c.env.KV, uid);
    if (!ageTier) return c.json({ error: '먼저 나이를 확인해 주세요.', needAgeCheck: true }, 403);

    // ── 입력 출처 구분 (DEV_01 §2.3) — 부모 사용자가 자녀의 사적 대화를 본 경우 ──
    // 'direct'(아이가 나에게 직접 한 말) → 통상 통역
    // 'observed'(아이 카톡·일기 등을 본 것) → 통역 대신 **신뢰 경계 안내**를 우선한다.
    //   사춘기 자녀가 "부모가 내 카톡을 봤고 그걸 AI로 분석했다"를 알게 되는 순간 신뢰가 더 무너진다.
    //   ⚠️ 단, 자해·위험 신호가 관찰 내용에 있으면 안전이 우선 — 그 판단은 모델(SAFETY_OVERRIDE)에 맡기므로
    //      여기서 기계적으로 막지 않고, 사용자가 "그래도 봐달라"고 하면 통역으로 넘어가게 한다.
    if (body.inputSource === 'observed' && body.acknowledgeBoundary !== true) {
      return c.json({
        ok: true,
        boundaryNotice: true,
        result: {
          message: '아이의 사적인 대화를 보게 되셨군요. 내용을 통역해 드리기 전에 — 아이가 이 사실을 알게 되면 신뢰가 크게 흔들릴 수 있어요. 지금 걱정되시는 것이 무엇인지 들려주시면, 아이에게 직접 다가가는 방법을 함께 찾아볼게요.',
          safety_note: '다만 자해나 위험 신호가 보여서 걱정되신다면, 그때는 안전이 우선이에요. 아래에서 계속 진행하실 수 있어요.',
        },
      });
    }

    // ── 크레딧 비용 산정 (실제 차감은 게이트 통과 후 Claude 호출 직전) ──
    const spendMode: Mode = (['receive', 'send', 'mediate', 'perspective'] as Mode[]).includes(body.mode) ? body.mode : 'receive';
    // ⚠️ 청소년은 무료 전용 — 민법상 미성년자 계약은 법정대리인 동의 없이 취소 가능하므로
    //    결제 경로를 아예 만들지 않는다. 기획 원칙("회복 책임을 아이에게 지우지 않는다")과도 맞다.
    //    대신 남용 방지로 일일 한도만 둔다.
    const isTeen = ageTier === 'teen';
    const cost = isTeen ? 0 : (CREDIT_COST[spendMode] ?? 2);
    if (isTeen) {
      const today = new Date().toISOString().slice(0, 10);
      const key = `sedae_teen_daily:${uid}:${today}`;
      const used = Number((await c.env.KV.get(key)) ?? '0');
      if (used >= TEEN_DAILY_LIMIT) {
        return c.json({ error: '오늘은 여기까지 이야기 나눴어요. 내일 다시 만나요.', teenDailyLimit: true }, 429);
      }
      c.executionCtx.waitUntil(c.env.KV.put(key, String(used + 1), { expirationTtl: 86400 }));
    }

    // ── 멀티모달: MVP 제외 (SPEC 6장 — 동의 게이트 재설계 필요) ──
    // 마음부부의 코드 동의 게이트는 쌍방이 앱을 쓴다는 전제인데, 70~80대 노부모가 코드로
    // 동의하는 그림은 비현실적이라 그대로 상속할 수 없다. 재설계 전까지 데이터 자체를 받지 않는다.
    // ⚠️ "동의 없는 멀티모달 데이터를 프롬프트에 주입하지 않는다"는 원칙은 여기서 undefined 고정으로 지킨다.
    const multimodal = undefined;
    if (body.multimodal) {
      return c.json({ error: '사진·녹음 통역은 아직 제공하지 않아요. 지금은 텍스트로 이용해 주세요.' }, 403);
    }

    // ── 관계 기억 로드 (내 기억만 — 마음부부 ADDENDUM 02 §1 상속) ──
    const memory = await loadMemory(c.env.DB, body.relationId, uid);

    // ── 관계 메타 로드: 누가 사용자인지(userRole)·상대 맥락은 요청이 아니라 DB에서 (위조 방지) ──
    const relMeta = await c.env.DB
      .prepare('SELECT owner_id, owner_role, counterpart_context FROM sedae_relations WHERE id = ?')
      .bind(body.relationId)
      .first<{ owner_id: number; owner_role: string; counterpart_context: string | null }>();
    // 관계를 만든 사람이면 그 역할, 연결된 상대면 반대 역할.
    const userRole: UserRole = relMeta
      ? (relMeta.owner_id === uid
          ? (relMeta.owner_role === 'parent' ? 'parent' : 'child')
          : (relMeta.owner_role === 'parent' ? 'child' : 'parent'))
      : 'child';

    // ── 프롬프트 조립 ──
    const config: TranslationConfig = {
      track: body.track,
      mode: body.mode,
      input: body.input,
      emotionDepth: body.emotionDepth,
      theologyLevel: body.theologyLevel,
      pastoralTone: body.pastoralTone,
      userContext: body.userContext,
      memory,
      multimodal,
      relationContext: 'parent_child',
      userRole,
      ageTier,
      counterpartContext: relMeta?.counterpart_context ?? undefined,
    };
    const { system, userMessage } = buildTranslationPrompt(config);

    // ── [fix④] 크레딧 차감 후 Claude 호출 (실패 시 환불) ──
    const spent = await spendCredits(c.env.DB, uid, cost, `sedae:translate:${spendMode}`);
    if (!spent.ok) {
      return c.json({ error: '크레딧이 부족해요. 마음풀에서 구매 후 이용해 주세요.', balance: spent.balance }, 402);
    }
    let raw: string;
    try {
      raw = await callClaude(c.env.ANTHROPIC_API_KEY, system, userMessage);
    } catch (err) {
      await refundCredits(c.env.DB, uid, cost, `sedae:refund:${spendMode}`);
      throw err;
    }
    const parsed = parseTranslationResponse(raw);
    if (!parsed) {
      await refundCredits(c.env.DB, uid, cost, `sedae:refund:${spendMode}`);
      return c.json({ error: '통역 결과 처리에 실패했어요. 다시 시도해 주세요.' }, 502);
    }

    // ── 사용 로그 (원문 미저장 — 프라이버시 원칙 상속. track/mode/age_tier만) ──
    await c.env.DB
      .prepare('INSERT INTO sedae_translation_logs (relation_id, user_id, track, mode, age_tier) VALUES (?, ?, ?, ?, ?)')
      .bind(body.relationId, uid, config.track, config.mode, config.ageTier ?? null)
      .run();

    // ── 안전 티어(T1/T2) 감지 시 기록 → 공유 차단·이후 민감도 ──
    // 기록은 "감지된 세션의 사용자" 기준(ADDENDUM 02 원칙). 공유 차단은 relation 전체에 적용.
    const safetyTier = (parsed as Record<string, unknown>).safety_tier;
    if (safetyTier === 'T1' || safetyTier === 'T2') {
      c.executionCtx.waitUntil(
        c.env.DB.prepare('INSERT INTO sedae_relation_safety (relation_id, user_id, tier) VALUES (?, ?, ?)').bind(body.relationId, uid, safetyTier).run().catch(() => {})
      );
    }

    // ── 관계 기억 비동기 갱신 (응답 지연 방지: waitUntil) ──
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const memPrompt = buildMemoryUpdatePrompt({
            track: config.track,
            mode: config.mode,
            input: body.input,
            translationResult: JSON.stringify(parsed),
            existingMemory: memory,
          });
          const memRaw = await callClaude(c.env.ANTHROPIC_API_KEY, memPrompt.system, memPrompt.userMessage, 800);
          const memParsed = parseTranslationResponse<RelationshipMemory>(memRaw);
          if (memParsed) await saveMemory(c.env.DB, body.relationId, uid, memParsed);
        } catch {
          // 기억 갱신 실패는 통역 성공에 영향 없음 — 조용히 스킵
        }
      })()
    );

    return c.json({ ok: true, result: parsed });
  } catch (e) {
    console.error('translate error:', e);
    return c.json({ error: '통역 처리 중 오류가 발생했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/consent/request — 동의 요청 코드 발급 (마음커플 초대코드 방식)
// ----------------------------------------------------------------------------

translate.post('/consent/request', async (c) => {
  try {
    const { relationId, mediaType } = await c.req.json<{
      relationId: number;
      mediaType: 'audio' | 'video';
    }>();
    const requesterId = c.get('uid'); // [fix③] 요청자는 JWT에서 (body 위조 차단)

    if (!relationId || !['audio', 'video'].includes(mediaType)) {
      return c.json({ error: '필수 정보가 누락되었습니다.' }, 400);
    }
    if (!(await assertRelationOwner(c.env.DB, relationId, requesterId))) {
      return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    }

    // 8자리 코드 생성 (마음커플 초대코드 패턴)
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    await c.env.DB
      .prepare(
        `INSERT INTO consent_sessions (id, relation_id, requester_id, media_type, status)
         VALUES (?, ?, ?, ?, 'pending')`
      )
      .bind(code, relationId, requesterId, mediaType)
      .run();

    // 24시간 후 만료 (KV TTL로 관리)
    await c.env.KV.put(`consent_pending:${code}`, '1', { expirationTtl: 86400 });

    return c.json({
      ok: true,
      consentCode: code,
      message: '배우자에게 이 코드를 전달해 주세요. 배우자가 동의해야 녹음/영상 분석이 시작됩니다.',
    });
  } catch (e) {
    console.error('consent request error:', e);
    return c.json({ error: '동의 요청 생성에 실패했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/consent/accept — 배우자의 동의 수락 (동의 주체 = 대상 본인)
// ----------------------------------------------------------------------------

translate.post('/consent/accept', async (c) => {
  try {
    const { consentCode, agreed } = await c.req.json<{
      consentCode: string;
      agreed: boolean; // 고지 사항 확인 체크
    }>();
    const consenterId = c.get('uid'); // [fix③] 동의자는 JWT에서 (대리 동의 차단 강화)

    if (!agreed) {
      return c.json({ error: '고지 사항에 동의해야 진행할 수 있어요.' }, 400);
    }

    // 만료 확인
    const pending = await c.env.KV.get(`consent_pending:${consentCode}`);
    if (!pending) {
      return c.json({ error: '만료되었거나 존재하지 않는 코드입니다.' }, 404);
    }

    const session = await c.env.DB
      .prepare(`SELECT requester_id, status FROM consent_sessions WHERE id = ?`)
      .bind(consentCode)
      .first<{ requester_id: number; status: string }>();

    if (!session || session.status !== 'pending') {
      return c.json({ error: '이미 처리되었거나 유효하지 않은 요청입니다.' }, 400);
    }
    // 요청자 본인이 스스로 동의하는 것 방지 (대리 동의 차단)
    if (session.requester_id === consenterId) {
      return c.json({ error: '동의는 배우자 본인만 할 수 있어요.' }, 403);
    }

    await c.env.DB
      .prepare(
        `UPDATE consent_sessions
         SET status = 'active', consenter_id = ?, accepted_at = datetime('now')
         WHERE id = ?`
      )
      .bind(consenterId, consentCode)
      .run();
    await c.env.KV.delete(`consent_pending:${consentCode}`);

    return c.json({
      ok: true,
      consentSessionId: consentCode,
      message: '동의가 완료되었어요. 이제 이 세션에서 녹음/영상 분석을 사용할 수 있습니다. 언제든 철회할 수 있어요.',
    });
  } catch (e) {
    console.error('consent accept error:', e);
    return c.json({ error: '동의 처리에 실패했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/consent/revoke — 동의 철회 (즉시 효력, 쌍방 모두 가능)
// ----------------------------------------------------------------------------

translate.post('/consent/revoke', async (c) => {
  try {
    const { consentSessionId } = await c.req.json<{
      consentSessionId: string;
    }>();
    const userId = c.get('uid'); // [fix③] JWT에서 (당사자만 철회)

    const session = await c.env.DB
      .prepare(`SELECT requester_id, consenter_id FROM consent_sessions WHERE id = ? AND status = 'active'`)
      .bind(consentSessionId)
      .first<{ requester_id: number; consenter_id: number }>();

    if (!session) {
      return c.json({ error: '활성화된 동의 세션이 아닙니다.' }, 404);
    }
    // 철회는 세션 당사자(요청자 또는 동의자) 모두 가능
    if (session.requester_id !== userId && session.consenter_id !== userId) {
      return c.json({ error: '이 세션의 당사자만 철회할 수 있어요.' }, 403);
    }

    await c.env.DB
      .prepare(
        `UPDATE consent_sessions SET status = 'revoked', revoked_at = datetime('now') WHERE id = ?`
      )
      .bind(consentSessionId)
      .run();

    return c.json({ ok: true, message: '동의가 철회되었습니다. 이 세션의 녹음/영상 분석은 즉시 중단됩니다.' });
  } catch (e) {
    console.error('consent revoke error:', e);
    return c.json({ error: '철회 처리에 실패했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/feedback — 활동 실행 피드백 (성공/실패 → 위로·재해석 → 기억 축적)
// ----------------------------------------------------------------------------

translate.post('/feedback', async (c) => {
  try {
    const body = await c.req.json<{
      relationId: number;
      track: Track;
      feedback: ActivityFeedback;
    }>();

    if (!body.relationId || !body.feedback?.activity || !body.feedback?.status) {
      return c.json({ error: 'relationId, feedback.activity, feedback.status는 필수입니다.' }, 400);
    }
    // uid는 JWT에서. waitUntil 클로저에서도 쓰므로 여기서 캡처한다(ADDENDUM 02 §1).
    const uid = c.get('uid');
    if (!(await assertRelationOwner(c.env.DB, body.relationId, uid))) {
      return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    }

    const memory = await loadMemory(c.env.DB, body.relationId, uid);
    const { system, userMessage } = buildFeedbackPrompt({
      track: body.track === 'christian' ? 'christian' : 'psychology',
      feedback: body.feedback,
      memory,
    });

    const raw = await callClaude(c.env.ANTHROPIC_API_KEY, system, userMessage, 800);
    const parsed = parseTranslationResponse<{
      response: string; reframe?: string; next_suggestion?: string; memory_hint?: string;
    }>(raw);
    if (!parsed) {
      return c.json({ error: '피드백 처리에 실패했어요. 다시 시도해 주세요.' }, 502);
    }

    // 활동 기록 저장 (자유 서술 note는 저장하지 않음 — 프라이버시)
    await c.env.DB
      .prepare('INSERT INTO sedae_activity_log (relation_id, user_id, activity, status, reaction) VALUES (?, ?, ?, ?, ?)')
      .bind(body.relationId, uid, body.feedback.activity, body.feedback.status, body.feedback.reaction ?? null)
      .run();

    // 성공 공식 축적: memory_hint를 관계 기억에 비동기 반영
    if (parsed.memory_hint) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            const mem = (await loadMemory(c.env.DB, body.relationId, uid)) ?? {};
            const patterns = mem.successPatterns ?? [];
            if (body.feedback.reaction === 'positive' && parsed.memory_hint) {
              patterns.push(parsed.memory_hint);
            }
            await saveMemory(c.env.DB, body.relationId, uid, {
              ...mem,
              successPatterns: patterns.slice(-10), // 최근 10개 유지
            });
          } catch { /* 기억 갱신 실패는 무시 */ }
        })()
      );
    }

    return c.json({ ok: true, result: parsed });
  } catch (e) {
    console.error('feedback error:', e);
    return c.json({ error: '피드백 처리 중 오류가 발생했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/community/post — 커뮤니티 게시 (AI 사전 검수 게이트)
// 원칙: 검수 통과분만 저장. 거부 시 사유 + 수정 제안 반환 (말없는 삭제 금지)
// ----------------------------------------------------------------------------

translate.post('/community/post', async (c) => {
  try {
    const body = await c.req.json<{
      room: string;
      content: string;
    }>();
    const authorHash = await hashAuthor(c.get('uid')); // [fix③] 서버에서 uid로 생성(위조 차단)

    if (!body.room || !body.content?.trim()) {
      return c.json({ error: '필수 정보가 누락되었습니다.' }, 400);
    }
    if (body.content.length > 3000) {
      return c.json({ error: '글이 너무 깁니다 (최대 3,000자).' }, 400);
    }

    // ── AI 사전 검수 (게시 전 게이트) ──
    const { system, userMessage } = buildModerationPrompt(body.content);
    const raw = await callClaude(c.env.ANTHROPIC_API_KEY, system, userMessage, 600);
    const mod = parseTranslationResponse<ModerationResult>(raw);

    if (!mod) {
      // 검수 실패 시 안전 우선: 게시 보류
      return c.json({ error: '검수 처리에 실패했어요. 잠시 후 다시 시도해 주세요.' }, 502);
    }

    if (!mod.allowed) {
      // 위기 신호는 삭제 통보가 아니라 보호 분기
      if (mod.category === 'crisis') {
        return c.json({
          ok: false,
          blocked: true,
          category: 'crisis',
          message: mod.reason_message,
          crisis_support: true, // 클라이언트: 전문기관 안내 UI 노출
        });
      }
      // 일반 거부: 사유 안내 + 수정 유도
      return c.json({
        ok: false,
        blocked: true,
        category: mod.category,
        message: mod.reason_message,
        problem_parts: mod.problem_parts,
        suggested_fix: mod.suggested_fix, // 클라이언트: [수정하기] 버튼과 함께 표시
      });
    }

    // ── 통과분만 저장 ──
    const result = await c.env.DB
      .prepare('INSERT INTO community_posts (author_hash, room, content) VALUES (?, ?, ?) RETURNING id')
      .bind(authorHash, body.room, body.content.trim())
      .first<{ id: number }>();

    return c.json({ ok: true, postId: result?.id });
  } catch (e) {
    console.error('community post error:', e);
    return c.json({ error: '게시 처리 중 오류가 발생했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// GET /api/community/posts?room=&limit= — 커뮤니티 글 목록 (최신순, 순위 없음)
// ----------------------------------------------------------------------------

translate.get('/community/posts', async (c) => {
  const room = c.req.query('room');
  const limit = Math.min(Number(c.req.query('limit')) || 20, 50);
  if (!room) return c.json({ error: 'room이 필요합니다.' }, 400);

  const { results } = await c.env.DB
    .prepare(
      `SELECT id, room, content, empathy_count, created_at
       FROM community_posts WHERE room = ? AND status = 'published'
       ORDER BY created_at DESC LIMIT ?`
    )
    .bind(room, limit)
    .all();

  return c.json({ ok: true, posts: results });
});

// ----------------------------------------------------------------------------
// GET /api/memory?relationId= — 관계 기억 조회 (사용자 열람용)
// ----------------------------------------------------------------------------

translate.get('/memory', async (c) => {
  const relationId = Number(c.req.query('relationId'));
  if (!relationId) return c.json({ error: 'relationId가 필요합니다.' }, 400);
  const uid = c.get('uid');
  if (!(await assertRelationOwner(c.env.DB, relationId, uid))) {
    return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
  }

  // 요청자 본인의 기억만 반환한다 — 배우자 기억 열람 금지(ADDENDUM 02 §1).
  const memory = await loadMemory(c.env.DB, relationId, uid);
  return c.json({ ok: true, memory: memory ?? null });
});

// ----------------------------------------------------------------------------
// 다중 관계 (마음세대의 근본 구조 — 부부와 다름)
//   부부는 관계가 1개지만, 부모-자녀는 사용자당 복수 관계가 기본이다.
//   아버지·어머니는 완전히 다른 관계이고, 부모 사용자는 자녀 여럿과 각각의 관계를 가진다.
//   통역·기억·활동·안전 플래그는 전부 선택된 relation 스코프 안에서만 동작한다.
// ----------------------------------------------------------------------------

// GET /api/relations — 내 관계 목록 (홈 최상단 관계 칩)
translate.get('/relations', async (c) => {
  try {
    const uid = c.get('uid');
    const rows = await c.env.DB
      .prepare(`SELECT id, owner_role, counterpart_label, counterpart_context, (counterpart_id IS NOT NULL) AS linked
                FROM sedae_relations WHERE owner_id = ? OR counterpart_id = ? ORDER BY id`)
      .bind(uid, uid)
      .all<{ id: number; owner_role: string; counterpart_label: string; counterpart_context: string | null; linked: number }>();
    return c.json({ ok: true, relations: rows.results ?? [] });
  } catch (e) {
    console.error('relations list error:', e);
    return c.json({ error: '관계 목록을 불러오지 못했어요.' }, 500);
  }
});

// POST /api/relation — 관계 생성 (여러 개 만들 수 있다)
//   body: { ownerRole: 'child'|'parent', counterpartLabel: '아버지'|'어머니'|'큰딸'…, counterpartContext? }
translate.post('/relation', async (c) => {
  try {
    const uid = c.get('uid');
    const body = await c.req.json().catch(() => ({})) as { ownerRole?: string; counterpartLabel?: string; counterpartContext?: string };
    const ownerRole = body.ownerRole === 'parent' ? 'parent' : body.ownerRole === 'child' ? 'child' : null;
    const label = (body.counterpartLabel ?? '').trim();
    if (!ownerRole) return c.json({ error: '내가 자녀인지 부모인지 알려주세요.' }, 400);
    if (!label || label.length > 20) return c.json({ error: '상대를 부르는 이름을 20자 이내로 적어주세요. (예: 아버지, 어머니, 큰딸)' }, 400);
    const ctx = (body.counterpartContext ?? '').trim().slice(0, 200) || null;

    const rel = await c.env.DB
      .prepare(`INSERT INTO sedae_relations (owner_id, owner_role, counterpart_label, counterpart_context)
                VALUES (?, ?, ?, ?) RETURNING id`)
      .bind(uid, ownerRole, label, ctx)
      .first<{ id: number }>();
    return c.json({ ok: true, relationId: rel?.id ?? null });
  } catch (e) {
    console.error('relation create error:', e);
    return c.json({ error: '관계를 만들지 못했어요.' }, 500);
  }
});

// PATCH /api/relation — 표시명·상대 맥락 수정 (설정 화면)
translate.patch('/relation', async (c) => {
  try {
    const uid = c.get('uid');
    const body = await c.req.json().catch(() => ({})) as { relationId?: number; counterpartLabel?: string; counterpartContext?: string };
    const relationId = Number(body.relationId);
    if (!relationId) return c.json({ error: 'relationId가 필요합니다.' }, 400);
    // 표시명·맥락 수정은 관계를 만든 사람만 (상대가 임의로 바꾸지 못하게)
    const owned = await c.env.DB.prepare('SELECT 1 AS ok FROM sedae_relations WHERE id = ? AND owner_id = ?').bind(relationId, uid).first();
    if (!owned) return c.json({ error: '이 관계를 수정할 권한이 없어요.' }, 403);
    const label = (body.counterpartLabel ?? '').trim();
    if (label && label.length > 20) return c.json({ error: '이름은 20자 이내로 적어주세요.' }, 400);
    const ctx = body.counterpartContext !== undefined ? (body.counterpartContext ?? '').trim().slice(0, 200) : undefined;
    if (label) await c.env.DB.prepare('UPDATE sedae_relations SET counterpart_label = ? WHERE id = ?').bind(label, relationId).run();
    if (ctx !== undefined) await c.env.DB.prepare('UPDATE sedae_relations SET counterpart_context = ? WHERE id = ?').bind(ctx || null, relationId).run();
    return c.json({ ok: true });
  } catch (e) {
    console.error('relation patch error:', e);
    return c.json({ error: '관계 정보를 수정하지 못했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// 연령 3층 체계 (SPEC 3장 / DEV_01 §2)
//   teen(만14~18) / adult(19~64) / senior(65+)
//   ⚠️ 마음부부의 "성인 19+ 게이트"를 그대로 쓰면 안 된다 — 이 앱은 청소년이 핵심 사용자다.
//   하한 만 14세 근거: 개인정보보호법상 만 14세 미만은 법정대리인 동의 필요 →
//   부모와의 갈등을 다루는 앱에 부모 동의를 요구하면 서비스가 성립하지 않는다.
// ----------------------------------------------------------------------------
function calcAge(birthDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((birthDate || '').trim());
  if (!m) return null;
  const by = +m[1], bm = +m[2], bd = +m[3];
  const now = new Date();
  let age = now.getUTCFullYear() - by;
  if (now.getUTCMonth() + 1 < bm || (now.getUTCMonth() + 1 === bm && now.getUTCDate() < bd)) age--;
  if (by < 1900 || age < 0 || age > 120) return null;
  return age;
}
function tierOf(age: number): AgeTier {
  if (age < 19) return 'teen';
  if (age >= 65) return 'senior';
  return 'adult';
}
// ⚠️ 연령등급은 가입 시 고정이 아니라 **매 요청 시 생년월일로 재계산**한다(DEV_01 §3).
//    만 19세 도달 시 teen→adult 자동 전환(제한 해제). KV에 저장된 등급을 믿으면 생일이 지나도 안 바뀐다.
async function getAgeTier(kv: KVNamespace, uid: number): Promise<AgeTier | null> {
  const birth = await kv.get(`sedae_birth:${uid}`);
  if (!birth) return null;
  const age = calcAge(birth);
  return age == null ? null : tierOf(age);
}

// POST /api/age/verify — 생년월일 등록 → 연령등급 산출
translate.post('/age/verify', async (c) => {
  try {
    const uid = c.get('uid');
    const { birthDate } = await c.req.json<{ birthDate: string }>();
    const age = calcAge(birthDate);
    if (age == null) return c.json({ error: '생년월일을 정확히 입력해 주세요.' }, 400);
    if (age < 14) {
      // 만 14세 미만은 법정대리인 동의가 필요해 본인 가입이 성립하지 않는다.
      return c.json({ ok: false, tooYoung: true, message: '마음세대는 만 14세부터 이용할 수 있어요. 힘든 일이 있다면 청소년상담전화 1388로 이야기해 보세요.' });
    }
    await c.env.KV.put(`sedae_birth:${uid}`, birthDate.trim());
    const tier = tierOf(age);
    return c.json({ ok: true, ageTier: tier, isTeen: tier === 'teen' });
  } catch (e) { console.error('age verify error:', e); return c.json({ error: '확인에 실패했어요.' }, 500); }
});

// GET /api/me — 내 연령등급 (프론트 게이트 판단용)
translate.get('/me', async (c) => {
  const uid = c.get('uid');
  const tier = await getAgeTier(c.env.KV, uid);
  return c.json({ ok: true, ageTier: tier, needAgeCheck: tier == null });
});

// ============================================================================
// Stage B — 선택적 공유 브리지 (ADDENDUM 01) + 배우자 연결
// ============================================================================
const SHARE_TYPES = ['message', 'mediate_view', 'perspective_view', 'activity_invite'];
// 초대코드: 마음커플 genSessionCode 패턴 재사용(6자·혼동문자 제외, 사람이 입력)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genInviteCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}
function safeJson(s: string): unknown { try { return JSON.parse(s); } catch { return s; } }
// T1/T2 안전 플래그가 최근(30일)에 있으면 공유 차단
async function hasRecentSafety(db: D1Database, relationId: number): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok FROM sedae_relation_safety WHERE relation_id = ? AND created_at > datetime('now','-30 days') LIMIT 1").bind(relationId).first<{ ok: number }>();
  return !!row;
}

// POST /api/relation/invite — 배우자 초대 코드 발급(관계에 user_b 연결용)
translate.post('/relation/invite', async (c) => {
  try {
    const uid = c.get('uid');
    const { relationId } = await c.req.json<{ relationId: number }>();
    if (!(await assertRelationOwner(c.env.DB, relationId, uid))) return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    const code = genInviteCode();
    await c.env.KV.put(`sedae_invite:${code}`, String(relationId), { expirationTtl: 7 * 86400 });
    return c.json({ ok: true, inviteCode: code });
  } catch (e) { console.error('invite error:', e); return c.json({ error: '초대 코드 발급에 실패했어요.' }, 500); }
});

// POST /api/relation/join — 배우자가 코드로 관계에 연결(user_b)
translate.post('/relation/join', async (c) => {
  try {
    const uid = c.get('uid');
    const { inviteCode } = await c.req.json<{ inviteCode: string }>();
    const code = (inviteCode || '').trim().toUpperCase();
    const ridStr = await c.env.KV.get(`sedae_invite:${code}`);
    if (!ridStr) return c.json({ error: '만료되었거나 잘못된 코드예요.' }, 404);
    const relationId = Number(ridStr);
    const rel = await c.env.DB.prepare('SELECT user_a_id, user_b_id FROM sedae_relations WHERE id = ?').bind(relationId).first<{ user_a_id: number; user_b_id: number | null }>();
    if (!rel) return c.json({ error: '관계를 찾을 수 없어요.' }, 404);
    if (rel.user_a_id === uid) return c.json({ error: '본인이 만든 초대예요.' }, 400);
    if (rel.user_b_id != null && rel.user_b_id !== uid) return c.json({ error: '이미 다른 분과 연결된 관계예요.' }, 409);
    if (rel.user_b_id == null) await c.env.DB.prepare('UPDATE sedae_relations SET user_b_id = ? WHERE id = ?').bind(uid, relationId).run();
    await c.env.KV.delete(`sedae_invite:${code}`);
    return c.json({ ok: true, relationId });
  } catch (e) { console.error('join error:', e); return c.json({ error: '연결에 실패했어요.' }, 500); }
});

// POST /api/share/send — 승인된 결과만 건별 공유 (T1/T2 안전 세션 차단)
translate.post('/share/send', async (c) => {
  try {
    const uid = c.get('uid');
    const { relationId, itemType, payload } = await c.req.json<{ relationId: number; itemType: string; payload: unknown }>();
    if (!relationId || !SHARE_TYPES.includes(itemType) || payload == null) return c.json({ error: '필수 정보가 누락되었습니다.' }, 400);
    if (!(await assertRelationOwner(c.env.DB, relationId, uid))) return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    // ADDENDUM 1.4-1: 안전 티어 감지된 relation은 공유 차단 (가해자에게 흔적 방지)
    if (await hasRecentSafety(c.env.DB, relationId)) return c.json({ error: '지금은 안전을 위해 공유가 제한돼요.', blockedBySafety: true }, 403);
    const id = Array.from(crypto.getRandomValues(new Uint8Array(9))).map((b) => b.toString(16).padStart(2, '0')).join('');
    await c.env.DB.prepare('INSERT INTO shared_items (id, relation_id, sender_id, item_type, payload) VALUES (?, ?, ?, ?, ?)')
      .bind(id, relationId, uid, itemType, JSON.stringify(payload)).run();
    const rel = await c.env.DB.prepare('SELECT user_b_id FROM sedae_relations WHERE id = ?').bind(relationId).first<{ user_b_id: number | null }>();
    return c.json({ ok: true, shareId: id, linked: !!(rel && rel.user_b_id != null) });
  } catch (e) { console.error('share send error:', e); return c.json({ error: '공유에 실패했어요.' }, 500); }
});

// GET /api/share/inbox?relationId= — 내가 받은 공유(배우자가 보낸 것). viewed 처리
translate.get('/share/inbox', async (c) => {
  try {
    const uid = c.get('uid');
    const relationId = Number(c.req.query('relationId'));
    if (!relationId) return c.json({ error: 'relationId가 필요합니다.' }, 400);
    if (!(await assertRelationOwner(c.env.DB, relationId, uid))) return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    const { results } = await c.env.DB.prepare("SELECT id, item_type, payload, status, created_at FROM shared_items WHERE relation_id = ? AND sender_id != ? ORDER BY created_at DESC LIMIT 50").bind(relationId, uid).all();
    // peek=1(뱃지 카운트용)이면 읽음 처리하지 않음 — 실제 열람 시에만 viewed
    if (c.req.query('peek') !== '1') {
      await c.env.DB.prepare("UPDATE shared_items SET status = 'viewed', viewed_at = datetime('now') WHERE relation_id = ? AND sender_id != ? AND status = 'sent'").bind(relationId, uid).run();
    }
    return c.json({ ok: true, items: (results || []).map((r: Record<string, unknown>) => ({ ...r, payload: safeJson(r.payload as string) })) });
  } catch (e) { console.error('inbox error:', e); return c.json({ error: '수신함을 불러오지 못했어요.' }, 500); }
});

// POST /api/share/respond — 활동 제안 수락
translate.post('/share/respond', async (c) => {
  try {
    const { shareId, action } = await c.req.json<{ shareId: string; action: string }>();
    if (action !== 'accepted' || !shareId) return c.json({ error: '잘못된 요청입니다.' }, 400);
    await c.env.DB.prepare("UPDATE shared_items SET status = 'accepted' WHERE id = ?").bind(shareId).run();
    return c.json({ ok: true });
  } catch (e) { console.error('respond error:', e); return c.json({ error: '처리에 실패했어요.' }, 500); }
});

export default translate;

// ----------------------------------------------------------------------------
// 메인 앱 연결 예시 (기존 index.ts에 추가):
//
//   import translate from './translate-route';
//   app.route('/api', translate);
// ----------------------------------------------------------------------------
