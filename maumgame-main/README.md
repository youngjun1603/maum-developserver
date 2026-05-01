# 🌿 maumgame — 마음의 정원

> 마음풀(maumful) 심리검사 결과와 연동되는 디지털 치유 게임 플랫폼임

## 게임 목록

| 게임 | 파일 | 레벨 | 기반 치료 |
|------|------|------|-----------|
| 🌿 마음의 정원 | `garden.jsx` | Lv.1 | CBT · 호흡 훈련 |
| 🌸 감정꽃 찾기 | `efmt.jsx`   | Lv.2 | EFMT · 감정 인식 |
| ⭐ 별빛 감사 일기 | `gratitude.jsx` | Lv.2 | 긍정심리학 PPT |
| 🌳 내면의 나무 | `tree.jsx`   | Lv.4 | ACT · 자아분화 |

## 기술 스택

- Backend: Hono (TypeScript) on Cloudflare Workers
- Frontend: React 18 (Babel JSX)
- Database: Cloudflare D1 (maumful 과 공유)
- Auth: JWT (maumful 과 동일 시크릿)
- AI: Anthropic Claude API

## 배포

```bash
# 1. maumful D1 에 게임 테이블 추가 (처음 한 번만)
wrangler d1 execute maumful-db --file=migrations/0001_game_schema.sql

# 2. 시크릿 (maumful 과 동일한 JWT_SECRET 사용!)
wrangler secret put JWT_SECRET           # maumful 과 반드시 동일
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put PHYWEB_URL           # https://maumful.pages.dev
wrangler secret put SERVICE_URL          # https://maumgame.pages.dev

# 3. 배포
wrangler deploy
```

## 새 게임 추가 방법

1. `public/static/games/새게임.jsx` 생성
2. `game_registry.jsx` 에 매니페스트 1줄 추가
3. `game_hub.jsx` 에 라우팅 1줄 추가
4. `src/index.tsx` HTML 에 스크립트 태그 1줄 추가

## maumful 연동

```javascript
// maumful 에서 maumgame 으로 이동 (JWT 전달)
const token = localStorage.getItem('access_token');
window.open(`https://maumgame.pages.dev?t=${token}`, '_blank');
```

## 관련 레포

| 레포 | 설명 |
|------|------|
| [maumful](https://github.com/youngjun1603/maumful) | 메인 플랫폼 |
| [maumgame](https://github.com/youngjun1603/maumgame) | 치유 게임 플랫폼 (이 레포) |

## 라이선스

Private — All rights reserved
