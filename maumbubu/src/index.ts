// ============================================================================
// 마음부부 (MaumBubu) — 메인 워커 (Cloudflare Workers + Hono)
// 마음풀 생태계 공유: maumful-db·KV·JWT_SECRET. 진입은 마음풀 /api/bubu-token(?t=).
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
  'https://bubu.maumful.com',
  'https://maumful.com',
  'https://couple.maumful.com',
]);
app.use('/api/*', cors({
  origin: (o) => (ALLOWED.has(o) ? o : ''),
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// 공개 헬스체크 (인증 불필요)
app.get('/health', (c) => c.json({ ok: true, service: 'maumbubu' }));

// 통역 API — 인증 미들웨어는 translate 내부에서 전 라우트에 적용
app.route('/api', translate);

export default app;
