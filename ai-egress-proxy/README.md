# 마음풀 생태계 AI egress 프록시

Cloudflare Worker의 **공유 egress IP**가 Anthropic abuse 보호에 걸려 간헐 `403 Request not allowed`가 나는 문제를,
마음풀 전용 **고정(dedicated) IP**로 우회하기 위한 최소 프록시.

```
마음풀/부부/게임/커플 Worker  →  (이 프록시, 고정 IP)  →  api.anthropic.com
```

- 스트리밍(SSE) 그대로 통과 · 무버퍼 · 의존성 0(Node 내장만).
- **Anthropic 키는 프록시에 저장하지 않는다.** 워커가 보낸 `x-api-key`를 그대로 전달만 한다.
- 접근 보호 = **경로 비밀**(`PROXY_SECRET`). 워커만 아는 값을 URL 경로에 실어 보내고, 프록시가 검증.

## 요구사항 (중요)
- **egress(나가는) IP가 "전용"이어야 한다** — Anthropic이 보는 IP가 우리만의 것이어야 옆집 abuse에 안 걸린다.
  - ✅ 가장 확실: **소형 VPS**(Hetzner / DigitalOcean / Vultr 등). VPS의 자기 IP가 곧 전용 egress IP.
  - △ PaaS(Render/Fly.io 등)는 "static/dedicated **outbound** IP"를 지원하는 플랜에서만. inbound 전용 IP와 혼동 금지.
- **지원 국가**에 두기(예: 미국·유럽). Cloudflare Workers는 "unsupported_country"로 직접 차단됐지만, 일반 VPS는 무관.
- HTTPS 필수(워커가 `https://`로 호출) → VPS면 Caddy로 자동 TLS.

## 환경변수
| 이름 | 필수 | 설명 |
|---|---|---|
| `PROXY_SECRET` | ✅ | 16자 이상. 워커가 URL 경로에 실어 보낼 공유 비밀. `openssl rand -hex 24` 등으로 생성. |
| `PORT` | — | 리슨 포트(기본 8080). |

## 워커가 부를 URL
```
https://<프록시 도메인>/<PROXY_SECRET>/v1/messages
```
프록시는 `/<PROXY_SECRET>`를 벗겨내고 `/v1/messages`를 `api.anthropic.com`으로 전달한다.

## 배포 A) 소형 VPS + Docker + Caddy (권장·가장 확실)
1. VPS 생성(예: Hetzner CX22 ~€4/mo). 도메인 A레코드를 VPS IP로(예: `ai-proxy.example.com`).
2. Docker 설치 후 프록시 실행:
   ```bash
   docker build -t ai-egress-proxy .
   docker run -d --restart=always --name ai-proxy \
     -e PROXY_SECRET='<생성한_비밀>' -p 127.0.0.1:8080:8080 ai-egress-proxy
   ```
3. Caddy로 자동 TLS 리버스프록시(`/etc/caddy/Caddyfile`):
   ```
   ai-proxy.example.com {
     reverse_proxy 127.0.0.1:8080
   }
   ```
   `systemctl reload caddy`
4. 확인: `curl https://ai-proxy.example.com/health` → `ok`

## 배포 B) PaaS(Docker 지원 + static outbound IP)
Render/Fly.io 등에서 이 Dockerfile 그대로 배포하고, **static/dedicated outbound IP 옵션을 켠다**.
`PROXY_SECRET` 환경변수 설정. 배포 후 발급된 HTTPS URL을 워커에 사용.

## 배포 후 검증(워커 연결 전에 반드시)
아래가 Anthropic 정상 응답(200)이면 프록시 OK. `<host>`·`<PROXY_SECRET>`·`<KEY>` 채워서:
```bash
curl -sS -N "https://<host>/<PROXY_SECRET>/v1/messages" \
  -H "content-type: application/json" -H "anthropic-version: 2023-06-01" \
  -H "x-api-key: <KEY>" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":16,"stream":true,"messages":[{"role":"user","content":"ping"}]}'
```
- SSE 이벤트가 스트리밍되면 통과. (스트리밍까지 확인하는 게 핵심 — 마음풀 AI가 전부 stream:true라서.)
- 이 프록시의 egress IP는 `curl https://api.ipify.org` 를 **프록시 서버에서** 실행해 확인(그 IP가 Anthropic이 보는 IP).

## 롤백
워커는 프록시 URL을 **환경변수(`AI_PROXY_URL`)로 주입**받고, 미설정 시 **기존 게이트웨이로 폴백**하도록 바꾼다.
→ 문제가 생기면 각 워커의 `AI_PROXY_URL` 시크릿만 지우면(또는 게이트웨이로 되돌리면) **즉시 원복**된다.
