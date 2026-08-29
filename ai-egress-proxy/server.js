// ─────────────────────────────────────────────────────────────────────────
// 마음풀 생태계 전용 AI egress 프록시
//   목적: Cloudflare Worker의 "공유 egress IP"가 Anthropic abuse 보호에 걸려
//         간헐 403(Request not allowed)이 나는 문제를, 마음풀 전용 "고정 IP"로 우회.
//   경로: 마음풀/부부/게임/커플 Worker → (이 프록시, 고정 IP) → api.anthropic.com
//   특징: 스트리밍(SSE) 그대로 통과 · 무버퍼 · 의존성 0(Node 내장만).
//
//   워커가 부를 URL 형식:  https://<이 프록시 호스트>/<PROXY_SECRET>/v1/messages
//     - <PROXY_SECRET> : 워커만 아는 공유 비밀(경로에 실어 전달). 프록시가 검증.
//     - x-api-key(Anthropic 키): ANTHROPIC_API_KEY env가 설정돼 있으면 프록시가 이 키로
//       "덮어써서" 전달(통합키를 프록시 1곳에서만 관리 = 교체 시 여기만 수정). env 미설정 시
//       워커가 보낸 x-api-key를 그대로 통과(기존 동작·무영향) → 코드 먼저 배포 후 env로 활성화.
// ─────────────────────────────────────────────────────────────────────────
'use strict';
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;
const PROXY_SECRET = process.env.PROXY_SECRET;   // 필수: 워커와 동일 값
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;  // 선택: 설정 시 프록시가 통합키 주입
const UPSTREAM_HOST = 'api.anthropic.com';

if (!PROXY_SECRET || PROXY_SECRET.length < 16) {
  console.error('[proxy] PROXY_SECRET 환경변수(16자 이상)가 필요합니다.');
  process.exit(1);
}

// 업스트림으로 전달하면 안 되는 hop-by-hop 헤더
const STRIP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'proxy-authorization']);

const server = http.createServer((req, res) => {
  // 헬스체크(호스트 상태 확인용) — 비밀 불필요
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }

  let url;
  try { url = new URL(req.url, 'http://x'); } catch { res.writeHead(400).end('bad url'); return; }
  const parts = url.pathname.split('/').filter(Boolean);   // ["<secret>", "v1", "messages"]

  // 1) 경로 비밀 검증(길이 우선 비교로 타이밍 노출 최소화)
  const given = parts[0] || '';
  if (given.length !== PROXY_SECRET.length || given !== PROXY_SECRET) {
    res.writeHead(403, { 'content-type': 'text/plain' }).end('forbidden');
    return;
  }
  // 2) 업스트림 경로 재구성(/v1/... 만 허용)
  const upstreamPath = '/' + parts.slice(1).join('/') + (url.search || '');
  if (!upstreamPath.startsWith('/v1/')) { res.writeHead(404).end('not found'); return; }

  // 3) 헤더 전달(hop-by-hop 제거, x-api-key/anthropic-version/anthropic-beta/content-type 통과)
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (STRIP.has(k.toLowerCase())) continue;
    headers[k] = v;
  }
  headers['host'] = UPSTREAM_HOST;
  // 통합키 주입: env 설정 시 워커가 보낸 x-api-key를 프록시의 키로 덮어씀(키 관리 1곳화).
  // 미설정 시 워커 키를 그대로 통과 = 기존 동작(무영향).
  if (ANTHROPIC_API_KEY) headers['x-api-key'] = ANTHROPIC_API_KEY;

  // 4) 업스트림 요청 + 스트리밍 파이프
  const upstream = https.request(
    { host: UPSTREAM_HOST, port: 443, method: req.method, path: upstreamPath, headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);              // SSE/청크 그대로 통과(무버퍼)
    }
  );
  upstream.setTimeout(600000, () => upstream.destroy(new Error('upstream timeout')));
  upstream.on('error', (e) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('upstream error: ' + e.message);
  });
  req.pipe(upstream);            // 요청 본문 그대로 전달
});

server.listen(PORT, () => console.log('[proxy] AI egress proxy listening on :' + PORT));
