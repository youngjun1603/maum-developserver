// ============================================================================
// 마음부부 통역 API 라우트 — Hono (Cloudflare Workers) v1.0
// ============================================================================
// translation-prompts.ts와 함께 사용. 파일 전체 교체 방식.
//
// 엔드포인트:
//   POST /api/translate           — 통역 실행 (4모드 × 2트랙, 개선활동 포함)
//   POST /api/feedback            — 활동 실행 피드백 (성공/실패 → 재해석 응답)
//   POST /api/community/post      — 커뮤니티 게시 (AI 사전 검수 게이트)
//   GET  /api/community/posts     — 커뮤니티 글 목록
//   POST /api/consent/request     — 멀티모달 동의 요청 코드 발급
//   POST /api/consent/accept      — 배우자의 동의 수락
//   POST /api/consent/revoke      — 동의 철회 (즉시 캡처 중단)
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
} from './translation-prompts';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  AI_PROXY_URL?: string;   // AI egress 프록시(전용 IP). 미설정 시 기존 게이트웨이 폴백
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
    if (p.type && !['bubu', 'couple'].includes(p.type)) return null; // 마음부부/커플 토큰만
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

// [fix③] relationId 소유권 — 이 uid가 이 부부관계의 당사자인가
async function assertRelationOwner(db: D1Database, relationId: number, uid: number): Promise<boolean> {
  const row = await db.prepare('SELECT 1 AS ok FROM couple_relations WHERE id = ? AND (user_a_id = ? OR user_b_id = ?)').bind(relationId, uid, uid).first<{ ok: number }>();
  return !!row;
}

// [fix③] 커뮤니티 익명 해시 — 서버에서 uid로 생성(user_id 직접 저장 금지)
async function hashAuthor(uid: number): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bubu:' + uid));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

// ----------------------------------------------------------------------------
// D1 스키마 (Cloudflare 대시보드 > D1 > Console에서 1회 실행)
// ----------------------------------------------------------------------------
/*
CREATE TABLE IF NOT EXISTS couple_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a_id INTEGER NOT NULL,
  user_b_id INTEGER,                        -- 배우자 미가입 시 NULL (혼자 사용 가능 설계)
  created_at TEXT DEFAULT (datetime('now'))
);

-- ⚠️ 아래 relation_memory는 구 스키마다(보존만 — 코드는 더 이상 읽지 않는다).
--    현재 코드가 쓰는 것은 relation_memory_v2 (migration 0003 / ADDENDUM 02 §1).
--    relation_id 단일키면 배우자의 기억이 내 통역 프롬프트에 주입된다 → 반드시 (relation_id, user_id) 복합키.
CREATE TABLE IF NOT EXISTS relation_memory (
  relation_id INTEGER PRIMARY KEY,
  recurring_topics TEXT,                    -- JSON 배열
  psychology_profile TEXT,
  christian_profile TEXT,
  success_patterns TEXT,                    -- JSON 배열
  partner_perspective TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relation_memory_v2 (
  relation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,                 -- 기억의 소유자 = 통역을 실행한 사용자
  recurring_topics TEXT,                    -- JSON 배열
  psychology_profile TEXT,
  christian_profile TEXT,
  success_patterns TEXT,                    -- JSON 배열
  partner_perspective TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (relation_id, user_id)
);

CREATE TABLE IF NOT EXISTS consent_sessions (
  id TEXT PRIMARY KEY,                      -- 동의 세션 ID (코드)
  relation_id INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,            -- 요청자
  consenter_id INTEGER,                     -- 동의자 (수락 시 기록)
  media_type TEXT NOT NULL,                 -- 'audio' | 'video'
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | active | revoked | expired
  created_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS translation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  track TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
  -- ⚠️ 원문·통역 결과는 저장하지 않음 (프라이버시 원칙: 구조화 요약만 relation_memory에)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relation_id INTEGER NOT NULL,
  activity TEXT NOT NULL,                   -- 제안됐던 활동
  status TEXT NOT NULL,                     -- done | partial | not_done
  reaction TEXT,                            -- positive | awkward | cold | conflict | unknown
  created_at TEXT DEFAULT (datetime('now'))
  -- ⚠️ 자유 서술(note)은 저장하지 않음 — 피드백 응답 생성에만 사용 (프라이버시 원칙)
);

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_hash TEXT NOT NULL,                -- 익명 해시 (user_id 직접 저장 금지)
  room TEXT NOT NULL,                       -- 주제방: couple | teen_parent | retire_dad | holiday | caregiving ...
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published', -- published (사전 검수 통과분만 저장)
  empathy_count INTEGER DEFAULT 0,          -- 공감 반응 수 (순위·경쟁 UI 금지)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_consent_relation ON consent_sessions(relation_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_relation ON activity_log(relation_id);
CREATE INDEX IF NOT EXISTS idx_community_room ON community_posts(room, created_at);
*/

// ----------------------------------------------------------------------------
// 유틸: Anthropic API 호출
// ----------------------------------------------------------------------------

async function callClaude(
  env: Bindings,
  system: string,
  userMessage: string,
  maxTokens = 1500
): Promise<string> {
  const apiKey = env.ANTHROPIC_API_KEY;
  // 전용 egress 프록시(전용 IP·공유 Worker IP 차단 회피). AI_PROXY_URL 미설정 시 기존 게이트웨이 폴백(=기존 동작).
  const endpoint = env.AI_PROXY_URL || AI_GATEWAY;
  const res = await fetch(endpoint, {
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
    .prepare('SELECT * FROM relation_memory_v2 WHERE relation_id = ? AND user_id = ?')
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
      `INSERT INTO relation_memory_v2
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

    // ── [fix④] 크레딧 비용 산정 (실제 차감은 게이트 통과 후 Claude 호출 직전) ──
    const spendMode: Mode = (['receive', 'send', 'mediate', 'perspective'] as Mode[]).includes(body.mode) ? body.mode : 'receive';
    // ── 무료 체험(첫 N회 무료) → 유료 전환 (프리미엄 프리미엄 전략) ──
    //   KV 카운터로 사용자별 무료 사용횟수 추적(translation_logs엔 user_id가 없어 KV 사용).
    //   무료 소진 후 크레딧 차감, 크레딧 없으면 402 → 마음풀 상품 안내(전환 지점).
    const FREE_QUOTA = 3;
    const freeKey = `bubu_free_used:${uid}`;
    const usedFree = parseInt((await c.env.KV.get(freeKey)) || '0', 10) || 0;
    const isFreeIntro = usedFree < FREE_QUOTA;
    const cost = isFreeIntro ? 0 : (CREDIT_COST[spendMode] ?? 2);

    // ── 멀티모달 동의 게이트 검증 (동의 없으면 멀티모달 데이터 자체를 제거) ──
    let multimodal = undefined;
    if (body.multimodal?.consentSessionId) {
      const valid = await verifyConsentSession(
        c.env.DB,
        body.multimodal.consentSessionId,
        body.relationId
      );
      if (!valid) {
        return c.json(
          { error: '유효한 쌍방 동의 세션이 없습니다. 배우자의 동의 후 이용할 수 있어요.' },
          403
        );
      }
      multimodal = body.multimodal;
    }

    // ── 관계 기억 로드 (내 기억만 — ADDENDUM 02 §1) ──
    const memory = await loadMemory(c.env.DB, body.relationId, uid);

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
    };
    const { system, userMessage } = buildTranslationPrompt(config);

    // ── [fix④] 크레딧 차감 후 Claude 호출 (실패 시 환불) ──
    if (cost > 0) {
      const spent = await spendCredits(c.env.DB, uid, cost, `bubu:translate:${spendMode}`);
      if (!spent.ok) {
        return c.json({ error: '크레딧이 부족해요. 마음풀에서 구매 후 이용해 주세요.', balance: spent.balance, needPurchase: true }, 402);
      }
    }
    let raw: string;
    try {
      raw = await callClaude(c.env, system, userMessage);
    } catch (err) {
      await refundCredits(c.env.DB, uid, cost, `bubu:refund:${spendMode}`);
      throw err;
    }
    const parsed = parseTranslationResponse(raw);
    if (!parsed) {
      await refundCredits(c.env.DB, uid, cost, `bubu:refund:${spendMode}`);
      return c.json({ error: '통역 결과 처리에 실패했어요. 다시 시도해 주세요.' }, 502);
    }

    // ── 사용 로그 (원문 미저장 — 프라이버시 원칙) ──
    await c.env.DB
      .prepare('INSERT INTO translation_logs (relation_id, track, mode) VALUES (?, ?, ?)')
      .bind(body.relationId, config.track, config.mode)
      .run();

    // 무료 체험분을 성공적으로 사용했으면 카운트 증가(실패 시엔 위에서 이미 return/throw → 증가 안 함)
    if (isFreeIntro) {
      await c.env.KV.put(freeKey, String(usedFree + 1));
    }

    // ── [StageB] 안전 티어(T1/T2) 감지 시 기록 → 공유 차단·이후 민감도 ──
    const safetyTier = (parsed as Record<string, unknown>).safety_tier;
    if (safetyTier === 'T1' || safetyTier === 'T2') {
      c.executionCtx.waitUntil(
        c.env.DB.prepare('INSERT INTO relation_safety (relation_id, tier) VALUES (?, ?)').bind(body.relationId, safetyTier).run().catch(() => {})
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
          const memRaw = await callClaude(c.env, memPrompt.system, memPrompt.userMessage, 800);
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

    const raw = await callClaude(c.env, system, userMessage, 800);
    const parsed = parseTranslationResponse<{
      response: string; reframe?: string; next_suggestion?: string; memory_hint?: string;
    }>(raw);
    if (!parsed) {
      return c.json({ error: '피드백 처리에 실패했어요. 다시 시도해 주세요.' }, 502);
    }

    // 활동 기록 저장 (자유 서술 note는 저장하지 않음 — 프라이버시)
    await c.env.DB
      .prepare('INSERT INTO activity_log (relation_id, activity, status, reaction) VALUES (?, ?, ?, ?)')
      .bind(body.relationId, body.feedback.activity, body.feedback.status, body.feedback.reaction ?? null)
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
    const raw = await callClaude(c.env, system, userMessage, 600);
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
// POST /api/relation — 내 부부관계 get-or-create (혼자 사용 가능: user_b_id NULL)
// ----------------------------------------------------------------------------
translate.post('/relation', async (c) => {
  try {
    const uid = c.get('uid');
    let rel = await c.env.DB
      .prepare('SELECT id FROM couple_relations WHERE user_a_id = ? OR user_b_id = ? ORDER BY (user_b_id IS NOT NULL) DESC, id LIMIT 1')
      .bind(uid, uid)
      .first<{ id: number }>();
    if (!rel) {
      rel = await c.env.DB
        .prepare('INSERT INTO couple_relations (user_a_id) VALUES (?) RETURNING id')
        .bind(uid)
        .first<{ id: number }>();
    }
    const adult = (await c.env.KV.get(`bubu_adult:${uid}`)) != null; // 성인 게이트 상태 (Stage C)
    return c.json({ ok: true, relationId: rel?.id ?? null, adult });
  } catch (e) {
    console.error('relation error:', e);
    return c.json({ error: '관계 정보 처리에 실패했어요.' }, 500);
  }
});

// ----------------------------------------------------------------------------
// POST /api/age/verify — 성인(만 19세+) 전용 게이트 (ADDENDUM 01 §3)
//   마음부부는 부부 관계 통역 → 성인 전용. 생년월일로 검증 후 KV에 성인 플래그 저장.
// ----------------------------------------------------------------------------
translate.post('/age/verify', async (c) => {
  try {
    const uid = c.get('uid');
    const { birthDate } = await c.req.json<{ birthDate: string }>();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((birthDate || '').trim());
    if (!m) return c.json({ error: '생년월일을 정확히 입력해 주세요.' }, 400);
    const by = +m[1], bm = +m[2], bd = +m[3];
    const now = new Date();
    let age = now.getUTCFullYear() - by;
    if (now.getUTCMonth() + 1 < bm || (now.getUTCMonth() + 1 === bm && now.getUTCDate() < bd)) age--;
    if (by < 1900 || age < 0 || age > 120) return c.json({ error: '생년월일을 확인해 주세요.' }, 400);
    if (age < 19) return c.json({ ok: false, minor: true, message: '마음부부는 만 19세 이상 성인 부부를 위한 서비스예요.' });
    await c.env.KV.put(`bubu_adult:${uid}`, birthDate);
    return c.json({ ok: true, adult: true });
  } catch (e) { console.error('age verify error:', e); return c.json({ error: '확인에 실패했어요.' }, 500); }
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
  const row = await db.prepare("SELECT 1 AS ok FROM relation_safety WHERE relation_id = ? AND created_at > datetime('now','-30 days') LIMIT 1").bind(relationId).first<{ ok: number }>();
  return !!row;
}

// POST /api/relation/invite — 배우자 초대 코드 발급(관계에 user_b 연결용)
translate.post('/relation/invite', async (c) => {
  try {
    const uid = c.get('uid');
    const { relationId } = await c.req.json<{ relationId: number }>();
    if (!(await assertRelationOwner(c.env.DB, relationId, uid))) return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);
    const code = genInviteCode();
    await c.env.KV.put(`bubu_invite:${code}`, String(relationId), { expirationTtl: 7 * 86400 });
    return c.json({ ok: true, inviteCode: code });
  } catch (e) { console.error('invite error:', e); return c.json({ error: '초대 코드 발급에 실패했어요.' }, 500); }
});

// POST /api/relation/join — 배우자가 코드로 관계에 연결(user_b)
translate.post('/relation/join', async (c) => {
  try {
    const uid = c.get('uid');
    const { inviteCode } = await c.req.json<{ inviteCode: string }>();
    const code = (inviteCode || '').trim().toUpperCase();
    const ridStr = await c.env.KV.get(`bubu_invite:${code}`);
    if (!ridStr) return c.json({ error: '만료되었거나 잘못된 코드예요.' }, 404);
    const relationId = Number(ridStr);
    const rel = await c.env.DB.prepare('SELECT user_a_id, user_b_id FROM couple_relations WHERE id = ?').bind(relationId).first<{ user_a_id: number; user_b_id: number | null }>();
    if (!rel) return c.json({ error: '관계를 찾을 수 없어요.' }, 404);
    if (rel.user_a_id === uid) return c.json({ error: '본인이 만든 초대예요.' }, 400);
    if (rel.user_b_id != null && rel.user_b_id !== uid) return c.json({ error: '이미 다른 분과 연결된 관계예요.' }, 409);
    if (rel.user_b_id == null) await c.env.DB.prepare('UPDATE couple_relations SET user_b_id = ? WHERE id = ?').bind(uid, relationId).run();
    await c.env.KV.delete(`bubu_invite:${code}`);
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
    const rel = await c.env.DB.prepare('SELECT user_b_id FROM couple_relations WHERE id = ?').bind(relationId).first<{ user_b_id: number | null }>();
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
