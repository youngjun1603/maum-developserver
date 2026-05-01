# 🌿 maumful — 마음풀

> 심리검사 · AI 상담 · 전문 상담 연결 · 치유 게임  
> 마음 건강 올인원 플랫폼..

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Hono (TypeScript) on Cloudflare Workers |
| Frontend | React 18 (Babel JSX, 빌드 불필요) |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| 결제 | 토스페이먼츠 (한국) · Stripe (해외) |
| 이메일 | Resend |
| AI | Anthropic Claude API |
| 게임 | [maumgame](https://github.com/youngjun1603/maumgame) 별도 레포 |

## 주요 기능

- **심리검사 8종** — PHQ-9, GAD-7, DASS-21, Big5, LOST, SCT, DSI, K-MBI+
- **AI 채팅 상담** — Claude API 기반 심리 지원
- **전문 상담사 연결** — 예약 · 토스 실결제 · Jitsi 화상상담
- **크레딧 시스템** — 토스페이먼츠 / Stripe 결제 연동
- **구독 플랜** — 베이직 / 스탠다드 / 프로 (월정액 자동결제)
- **치유 게임 연동** — maumgame 플랫폼 JWT 연결

## 배포

전체 배포 가이드는 [`DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md) 참조

```bash
# 1. D1 · KV 생성 후 wrangler.toml 의 REPLACE_WITH_* 교체
# 2. 마이그레이션 실행
wrangler d1 execute maumful-db --file=migrations/0004_b2c_migration.sql
wrangler d1 execute maumful-db --file=migrations/0005_counseling.sql
wrangler d1 execute maumful-db --file=migrations/0006_stage3_admin.sql
wrangler d1 execute maumful-db --file=migrations/0007_subscriptions.sql

# 3. 시크릿 설정
wrangler secret put JWT_SECRET
wrangler secret put ANTHROPIC_API_KEY
# (DEPLOY_CHECKLIST.md 전체 목록 참조)

# 4. 배포
wrangler deploy
```

## 프로젝트 구조

```
maumful/
├── src/
│   └── index.tsx          # Hono 백엔드 (API 전체)
├── public/
│   ├── static/
│   │   ├── app.jsx        # 메인 React 앱
│   │   ├── landing.jsx    # 홈 랜딩 페이지
│   │   ├── counseling.jsx # 상담 플랫폼
│   │   ├── counseling_admin.jsx  # 상담 어드민
│   │   └── style.css
│   ├── manifest.json      # PWA 설정
│   └── sw.js              # Service Worker
├── migrations/            # D1 SQL 마이그레이션 (0001~0007)
├── DEPLOY_CHECKLIST.md    # 배포 가이드
└── wrangler.toml
```

## 관련 레포

| 레포 | 설명 |
|------|------|
| [maumful](https://github.com/youngjun1603/maumful) | 메인 플랫폼 (이 레포) |
| [maumgame](https://github.com/youngjun1603/maumgame) | 치유 게임 플랫폼 |

## 라이선스

Private — All rights reserved
