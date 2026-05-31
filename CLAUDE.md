# 마음풀 프로젝트

## 서비스 구성 (2개)

### 1. 마음풀 서비스
심리검사·AI상담·전문상담 연결·치유게임 통합 플랫폼

| 폴더 | Worker | 역할 |
|------|--------|------|
| `maumful-main/` | `maumful` | 메인 플랫폼 (maumful.com) |
| `maumgame-main/` | `maumgame` | 치유 게임 (game.maumful.com) |
| `package/maumcouple/` | `maumcouple` | 커플 분석 (couple.maumful.com) |

- DB: `maumful-db` (D1: f8046693)
- 결제: 토스페이먼츠(KRW) + Stripe(USD), 크레딧 기반
- 검사 12종: SCT, DSI, PHQ-9, GAD-7, DASS-21, BIG5, K-MBI+, LOST, SRCI, SDRI, RBC, SDI
- 게임 8종: garden, efmt, gratitude, tree, burnout, mood, focus, worry

### 2. CTS 서비스 (트윈 개발)
마음풀과 동일 아키텍처, 성경적 상담 기능 추가한 고객 맞춤 버전

| 폴더 | Worker | 역할 |
|------|--------|------|
| `cts-maum-main/` | `lightoflife` | CTS 메인 플랫폼 |
| `cts-game-main/` | `lightoflife-game` | CTS 치유 게임 |

- DB: `lightoflife-db` (D1: 662b3fb9)
- 마음풀과 다른 점: bible_verses, ai_config, organizations 테이블 추가
- 배포: `wrangler.toml`(프로덕션) / `wrangler.dev.toml`(스테이징)
- **프로덕션 도메인: `jesusmaum.com`** — `lightoflife.limyj007.workers.dev` 비활성화됨 (workers.dev 서브도메인 꺼짐)

---

## 기술 스택 (공통)

- **백엔드:** Hono.js (TypeScript) + Cloudflare Workers
- **프론트엔드:** React 18 (esbuild 사전 컴파일 — `@babel/standalone` 제거 완료)
- **DB:** Cloudflare D1 (SQLite) + KV
- **AI:** Anthropic Claude API

---

## 주요 명령어

```bash
# 로컬 개발
npx wrangler dev

# 배포 (포그라운드 실행 필수 — 백그라운드 시 인증 실패)
npx wrangler deploy

# CTS 스테이징 배포
npx wrangler deploy --config wrangler.dev.toml

# DB 마이그레이션 (마음풀·CTS)
npx wrangler d1 migrations apply maumful-db
npx wrangler d1 migrations apply lightoflife-db

# 시크릿 설정
npx wrangler secret put ANTHROPIC_API_KEY
```

---

## 배포 원칙

- **마음풀·CTS:** 변경 사항 모아서 한꺼번에 배포 / CTS는 즉시 배포
- `wrangler deploy`는 반드시 포그라운드 실행
- 배포 전 TypeScript 에러 확인 필수

---

## 프론트엔드 빌드

**모든 서비스 공통:** `@babel/standalone` 제거, esbuild 사전 컴파일 방식. `npm run deploy`에 build:jsx 포함됨.

### maumful-main (메인 플랫폼)

```bash
npm run build:jsx
# → public/static/compiled/{app,landing,counseling,counseling_admin}.js
```

- 4개 파일 모두 **일반 `<script>`로 동일 전역 스코프** 공유
  - 전역 `const` 이름 충돌 시 `SyntaxError` 발생
  - 예: `counseling.jsx`와 `counseling_admin.jsx`의 동일명 변수 → 한쪽 rename 필요

### maumgame-main / cts-game-main (치유 게임)

```bash
npm run build:jsx   # → public/static/compiled/game_engine.js, game_registry.js, game_hub.js, games/*.js
npm run deploy      # build:jsx + wrangler deploy 통합 실행
```

- **`--tsconfig-raw={"compilerOptions":{"jsx":"react"}}` 필수** — `tsconfig.json`의 `"jsx":"react-jsx"` 설정이 esbuild 플래그를 override해서 `import { jsx } from "react/jsx-runtime"` 생성 → 일반 `<script>` 환경에서 실패
- **SSO 인라인 스크립트 순서 주의:** 컴파일 스크립트 로드 전에 실행 필수 (React 마운트 전 토큰 처리)
- `game_engine.js`가 `GAME_LANG`, `t()`, `GameEngine` 전역 정의 → 다른 게임 파일이 참조
- `GameHubApp`에 10초 폴백 타임아웃 추가: `getMe()` fetch hang 시 무한 스켈레톤 방지

### package/maumcouple (커플 분석)

```bash
npm run build:jsx        # couple_hub.jsx → compiled/couple_hub.js
npm run deploy           # maumcouple (couple.maumful.com) 배포
npm run deploy:cts       # lightoflife-couple (wrangler.lightoflife.toml) 배포
```

- **빌드 없이 직접 서빙 불가** — esbuild 사전 컴파일 후 배포

---

## 다국어(i18n) 구현

- **패턴:** `t(ko, en)` 헬퍼 — `lang === 'en' ? en : ko`
- `t`는 `PsychologicalTestSystem` 클로저 내부에 정의 — **`app.jsx` 컴포넌트만 사용 가능**
- `landing.jsx` · `counseling.jsx`는 컴포넌트별로 `tl` 헬퍼를 독립 정의해 사용
- 검사 문항 배열에 영어 필드 추가 방식: `{ content:'한국어', en:'English', scale:'척도', scaleEn:'Scale' }`
- `CounselingPage`는 `lang` prop을 `app.jsx`에서 받아야 함 (기본값 없음)

---

## 주요 기능 구현 현황

### AI 감정 추적 (Mood Logging)
- AI 응답에 `[MOOD:N]` 태그 삽입 (N = 0~100)
- `ChatBox` processStream done 블록에서 추출·제거 후 `/api/chat/mood-log` POST
- DB: `mood_logs(user_id, mood_score, test_type, created_at)` — migration `0020_mood_logs.sql`
- 트렌드 조회: `GET /api/chat/mood-trend?days=14` (최대 90일)

### 외부 검사 결과 입력 (ExternalResultSection)
- 점수 직접 입력 탭: `/api/test/external-result` POST
- PDF 업로드 + AI 해석 탭: pdf.js로 텍스트 추출 → `/api/test/analyze-pdf` POST (3 크레딧)
- 히스토리 탭에 `📥 외부 검사 결과 입력 · AI 해석` 버튼으로 진입

### CBT 8주 자기관리 플랜 (CbtPlanCard)
- PHQ-9·GAD-7·BURNOUT·DASS-21 검사 이력이 있을 때만 대시보드에 표시
- `/api/test/cbt-plan` GET으로 플랜 로드 (최초 1회 생성)
- 주차별 완료 여부는 `localStorage('cbt_done_weeks')`에 저장

### 인근 상담 기관 찾기 (CounselingPage)
- Kakao Maps SDK + `/api/nearby-counseling?lat=&lng=` 로 주변 기관 검색
- 카테고리 필터: 정신건강의학과 / 정신건강복지센터 / 심리상담센터
- 24시간 무료 상담전화(109, 1577-0199, 1388) 섹션 포함
- `lang` prop 필수 — app.jsx 호출 시 반드시 전달

---

## 마음게임 번역 ✅ 완료

**현황:** `maumgame-main/` 및 `cts-game-main/` 영어 번역 완료

**구현 내용:**
- 패턴: `t(ko, en)` 헬퍼 — `GAME_LANG === 'en' ? en : ko`
- `GAME_LANG` 전역 변수: `game_engine.jsx`에서 `new URLSearchParams(location.search).get('lang') || 'ko'` 로 초기화
- lang 전달: 마음풀/CTS → 게임 링크 열 때 `?lang=en` URL 파라미터로 전달
- `maumcouple`도 `COUPLE_LANG` / `tl(ko, en)` 헬퍼로 동일 패턴 적용

**번역 완료 파일 (maumgame 11개, cts-game 추가 +qt.jsx):**
`game_engine.jsx`, `game_registry.jsx`, `game_hub.jsx`, `games/mood.jsx`, `games/garden.jsx`, `games/burnout.jsx`, `games/efmt.jsx`, `games/gratitude.jsx`, `games/tree.jsx`, `games/focus.jsx`, `games/worry.jsx`

---

## 크레딧 시스템

### 단가 구조 (maumful-main/src/index.tsx)

| 기능 | 크레딧 | 비고 |
|------|--------|------|
| 심리검사 1회 | 10 cr | PHQ-9·GAD-7는 무료 |
| AI 채팅 1회 | 2 cr | 크레딧 보유 시 소진까지 무제한 |
| AI 채팅 (크레딧 없음) | 무료 | 하루 5회 제한 |
| PDF 분석 1회 | 3 cr | 외부 검사 AI 해석 |

### 크레딧 패키지 (KRW)

| 패키지 | 크레딧 | 가격 | 단가 |
|--------|--------|------|------|
| 스타터 | 50 | 2,900원 | 58원/cr |
| 표준 | 120 | 5,900원 | 49원/cr |
| 프리미엄 | 300 | 12,900원 | 43원/cr |
| 대용량 | 700 | 24,900원 | 36원/cr |

### 일일 제한 로직 (`src/index.tsx`)
- 크레딧 ≥ 2: 차감 후 무제한 (KV 일일 카운터 없음)
- 크레딧 < 2: 무료 5회/일 (`ai_daily:{userId}:{today}` KV, TTL 86400)
- 비회원: 평생 3회 (`guest_chat:{ip}` KV, TTL 없음)
- 마스터 계정: 무제한·무차감

---

## 토스페이먼츠 결제 연동

### SDK

- **사용 버전:** v1 (`https://js.tosspayments.com/v1`) — HTML `<head>`에 포함
- ⚠️ `https://js.tosspayments.com/v2/base` → **403 Forbidden** — 사용 불가
- `window.TossPayments(clientKey)` → 동기 초기화, `requestPayment('카드', {...})` 방식

### 결제 플로우

```
프론트 → POST /api/payment/toss/checkout
       → { clientKey, customerKey, orderId, orderName, amount, successUrl, failUrl } 반환
       → window.TossPayments(clientKey).requestPayment('카드', {...})
       → 결제 완료 → GET /api/payment/toss/success?paymentKey=&orderId=&amount=&chargeId=
       → 토스 confirm API 호출 → 크레딧 지급
       → POST /api/webhook/toss (이중지급 방지)
```

### 시크릿 설정

```bash
npx wrangler secret put TOSS_CLIENT_KEY   # test_ck_... 또는 live_ck_...
npx wrangler secret put TOSS_SECRET_KEY   # test_sk_... 또는 live_sk_...
# TOSS_WEBHOOK_SECRET: 미설정 시 검증 건너뜀 (실서비스 전 설정 권장)
```

- 테스트 키는 `test_ck_` / `test_sk_` prefix — 실결제 없음
- 실서비스 전환 시 `live_ck_` / `live_sk_` 로 교체 (코드 변경 불필요)

---

## 카카오 소셜 로그인 설정

### Redirect URI 등록 위치
카카오 Developer Console에서 Redirect URI는 **카카오 로그인 > 일반** 이 아닌 아래 경로에 있음:

> 콘솔 → 앱 선택 → 앱 설정 → **플랫폼 키 / 어드민 키 → REST API 키** → 카카오 로그인 리다이렉트 URI

- 마음풀 등록 URI: `https://maumful.com/api/auth/kakao/callback`
- REST API 방식(서버 사이드) 사용 시 위 경로에 등록

### 동의항목 제한 사항
- `gender`, `age_range` → **권한 없음** — Kakao OAuth 응답에서 제공 안 됨
- 카카오 로그인으로 제공되는 항목: 닉네임(필수), 프로필사진(선택), 이메일(비즈 앱 필요)
- 성별·연령대는 **이메일 회원가입 폼에서만** 직접 수집

---

## 지자체 화이트라벨 (구현 대기)

사용자가 요청 시 구현 시작. 지금은 설계만 확정된 상태.

### 아키텍처: 멀티테넌트 단일 Worker

- `organizations` 테이블 + `users.org_id` FK
- Worker가 `host` 헤더로 org 식별 → `/api/org-config` 반환
- 지자체 도메인 → Cloudflare DNS CNAME → 마음풀 Worker
- org 설정 없으면 마음풀 기본 디자인으로 폴백

### landing_config JSON 구조

```json
{
  "hero": {
    "bg_image": "https://cdn.../hero.jpg",
    "overlay": 0.55,
    "title": "서울시민 마음건강 플랫폼",
    "subtitle": "서울특별시와 마음풀이 함께합니다"
  },
  "brand": {
    "name": "서울 마음풀",
    "logo": "https://cdn.../logo.png",
    "color": "#0033A0"
  },
  "footer": {
    "org_name": "서울특별시 정신건강복지센터",
    "address": "서울특별시 ...",
    "phone": "02-XXX-XXXX"
  }
}
```

### 히어로 영역 규칙
- 배경 사진 + 반투명 오버레이(0.5~0.6) + 흰색 텍스트 고정
- overlay 값으로 사진 밝기 무관하게 가독성 유지

### 구현 시 작업 목록
1. `organizations` 테이블 migration (id, domain, name, landing_config JSON, ...)
2. `users` 테이블에 `org_id` FK 추가
3. `GET /api/org-config` 엔드포인트 (host 헤더 → org 조회)
4. `landing.jsx` — org_config 로드 후 히어로/브랜드/푸터 적용
5. 어드민: 지자체 설정 관리 UI (landing_config JSON 편집)

### 데이터 분리 기준
| 지자체 규모 | 방식 |
|------------|------|
| 소규모·파일럿 | 멀티테넌트 단일 Worker (A안) |
| 대형·데이터 분리 요구 | CTS 트윈 모델 (B안) |

---

## 개발 완료 후 검증 원칙 ⚠️ 필수 준수

### 신규 개발 즉시 에러·버그 검증 (자동 수행)

사용자가 별도로 요청하지 않아도, **기능 개발이 완료되면 즉시** 에러·버그 검증을 수행한다.

**검증 시점:** 빌드 성공 확인 후, 배포 전 또는 배포 직후

**검증 범위 (병렬 에이전트 활용):**
- 변경된 파일 + 직접 연관된 파일 (프론트·백엔드 모두)
- 신규 함수의 변수 스코프, 타입 오류, undefined 참조
- 크레딧 차감 로직 (레이스 컨디션, 원자적 처리 여부)
- API 응답 구조 일치 여부 (프론트 ↔ 백엔드)
- `parseInt()` NaN, `.first()` null 체크
- React Hook 의존성 배열 누락

**이유:** 신규 기능 추가 후 치명 버그가 뒤늦게 발견된 사례 다수 —  
`getAnthropicKey` 매개변수 오류, `credits`/`isMaster` 미정의, 크레딧 레이스 컨디션, `AI_LIMIT_PAID` 미정의 등.  
모두 사전 검증으로 방지 가능했던 버그들.

---

## 버전 관리 원칙 ⚠️ 필수 준수

### 수정 즉시 커밋·푸시 (필수)

코드·설정을 수정하면 **항상 GitHub에 커밋과 푸시를 수행한다.** 사용자가 별도로 요청하지 않아도 작업 완료 시 자동으로 커밋·푸시까지 끝낸다.

**규칙:**
- 빌드·배포 완료 후 곧바로 `git commit` + `git push origin main`
- CTS(`cts-maum-main/`)는 submodule이므로 **submodule 내부 커밋·push → 부모 레포 포인터 커밋·push** 순서로 진행
- 커밋을 미루거나 누락하지 않는다 (다중 PC 환경 동기화 필수)

### 서비스별 커밋 분리 (매우 중요)

마음풀·CTS는 향후 완전히 독립적으로 운영될 예정이므로, **서비스 간 변경 사항을 절대 하나의 커밋에 혼합하지 않는다.**

**규칙:**
- 마음풀(`maumful-main/`) 변경 → 별도 커밋
- CTS(`cts-maum-main/`) 변경 → 별도 커밋
- 공통 설정(`CLAUDE.md` 등) 변경 → 별도 커밋

**이유:** 서비스별로 커밋이 분리되어 있어야 `git revert <commit>` 한 번으로 특정 서비스만 롤백할 수 있다. 혼합 커밋은 선택적 롤백이 불가능해진다.

**커밋 메시지 prefix 예시:**
```
[maumful] 상담센터 안내 페이지로 교체
[cts] 예약 시스템 원복
[공통] CLAUDE.md 버전관리 원칙 추가
```
