# CLAUDE.md — 마음풀 (maumful) + 트윈 공통 개발 규칙

> 이 문서는 **마음풀(maumful-main) 전용 규칙**이자, **CTS(cts-maum-main)와 공유하는 트윈 공통 개발 규칙**을 담는다.
> CTS도 아래의 기술스택·빌드·i18n·크레딧·결제·검증·임상표현 규칙을 **그대로 따른다**. CTS 고유 차이점만 `cts-maum-main/CLAUDE.md`에 정의.
> 루트 공통(커밋·GitHub 계정 등)은 `../CLAUDE.md`.

## 서비스 개요
심리검사·AI상담·전문상담 연결·치유게임 통합 플랫폼.

| 폴더 | Worker | 역할 |
|------|--------|------|
| `maumful-main/` | `maumful` | 메인 플랫폼 (maumful.com) |
| `maumgame-main/` | `maumgame` | 치유 게임 (game.maumful.com) |
| `package/maumcouple/` | `maumcouple` | 커플 분석 (couple.maumful.com) |

- DB: `maumful-db` (D1: f8046693)
- 결제: 토스페이먼츠(KRW) + Stripe(USD), 크레딧 기반
- 검사 12종: SCT, DSI, PHQ-9, GAD-7, DASS-21, BIG5, K-MBI+, LOST, SRCI, SDRI, RBC, SDI
- 게임 8종: garden, efmt, gratitude, tree, burnout, mood, focus, worry
- 검사 문항수·표시 동기화·카드순서: 메모리 `project_maumful_tests` 참조

---

## 기술 스택 (마음풀·CTS 공통)

- **백엔드:** Hono.js (TypeScript) + Cloudflare Workers
- **프론트엔드:** React 18 (esbuild 사전 컴파일 — `@babel/standalone` 제거 완료)
- **DB:** Cloudflare D1 (SQLite) + KV
- **AI:** Anthropic Claude API

---

## 주요 명령어

```bash
npx wrangler dev                              # 로컬 개발
npx wrangler deploy                           # 배포 (포그라운드 필수 — 백그라운드 시 인증 실패)
npx wrangler deploy --config wrangler.dev.toml # CTS 스테이징
npx wrangler d1 migrations apply maumful-db    # DB 마이그레이션 (CTS는 lightoflife-db)
npx wrangler secret put ANTHROPIC_API_KEY      # 시크릿
```

## 배포 원칙
- **마음풀:** 변경 모아서 한꺼번에 배포 / **CTS:** 즉시 배포
- `wrangler deploy`는 반드시 **포그라운드** 실행
- 배포 전 TypeScript 에러 확인 필수

---

## 프론트엔드 빌드

**모든 서비스 공통:** `@babel/standalone` 제거, esbuild 사전 컴파일. `npm run deploy`에 build:jsx 포함.

### maumful-main (메인 플랫폼)
```bash
npm run build:jsx   # → public/static/compiled/{app,landing,counseling,counseling_admin}.js
```
- 4개 파일 모두 **일반 `<script>`로 동일 전역 스코프** 공유 → 전역 `const` 이름 충돌 시 `SyntaxError`. (예: counseling.jsx·counseling_admin.jsx 동일명 변수 → 한쪽 rename)

### maumgame-main / cts-game-main (치유 게임)
```bash
npm run build:jsx   # → compiled/game_engine.js, game_registry.js, game_hub.js, games/*.js
npm run deploy      # build:jsx + wrangler deploy
```
- **`--tsconfig-raw={"compilerOptions":{"jsx":"react"}}` 필수** — tsconfig의 `"jsx":"react-jsx"`가 esbuild를 override → `react/jsx-runtime` import 생성 → 일반 `<script>`서 실패
- **SSO 인라인 스크립트는 컴파일 스크립트 로드 전 실행** (React 마운트 전 토큰 처리)
- `game_engine.js`가 `GAME_LANG`·`t()`·`GameEngine` 전역 정의 → 다른 게임 파일 참조
- `GameHubApp` 10초 폴백 타임아웃(`getMe()` hang 시 무한 스켈레톤 방지)

### package/maumcouple (커플 분석)
```bash
npm run build:jsx     # couple_hub.jsx → compiled/couple_hub.js
npm run deploy        # maumcouple (couple.maumful.com)
npm run deploy:cts    # lightoflife-couple (wrangler.lightoflife.toml)
```
- 빌드 없이 직접 서빙 불가 — esbuild 사전 컴파일 후 배포

---

## 다국어(i18n) — 마음풀

- **패턴:** `t(ko, en)` — `lang === 'en' ? en : ko`
- `t`는 `PsychologicalTestSystem` 클로저 내부 정의 → **`app.jsx` 컴포넌트만 사용 가능**
- `landing.jsx`·`counseling.jsx`는 컴포넌트별 `tl` 헬퍼 독립 정의
- 검사 문항 영어 필드: `{ content:'한국어', en:'English', scale:'척도', scaleEn:'Scale' }`
- `CounselingPage`는 `lang` prop을 app.jsx에서 받아야 함(기본값 없음)
- ⚠️ 섀도잉: `.map(t => ...)` 파라미터가 헬퍼 `t`를 가림 → 내부 `t('..','..')` 크래시. map 파라미터 `tt`/`s`로 rename
- (CTS 영어화·성경 영어화는 `cts-maum-main/CLAUDE.md`)

---

## 주요 기능 구현 현황

### AI 상담 핸즈프리 음성 (2026-06, 마음풀·CTS 공통)
- ChatBox `🔊 음성 상담` 토글: 연속 음성인식(`webkitSpeechRecognition` continuous) + 답변 자동 TTS. 노인·아동 핸즈프리(탭1번→말하면 됨).
- **에코(자문자답) 방지**: 마이크 상시 ON(모바일 자동재개 — stop 방식은 재시작 제스처 필요해 폐기) + AI 발화 중·직후 0.8초 무시(`pausedForSpeechRef`) + **내용기반 에코필터**(직전 AI 발화 텍스트의 일부면 무시, `lastSpokenTextRef`).
- ⚠️ **CTS는 메시지 배열이 `chatMespurples`**(마음풀은 `chatMessages`) — 포팅 시 주의. 기존 수동 🎤·Enter 전송 무변경(추가형).

### 마음 시리즈 SSO 허브 + 랜딩 쇼케이스 (2026-06)
> **마음풀 = 마음 시리즈 통합 허브.** 게임·커플은 마음풀 생태계(같은 계정/크레딧, `?t=` 토큰). **마음수달은 별개 생태계**(maum-auth·쿠폰결제) → **SSO 브리지**로 연결(곁은 추후 동일 패턴).
- **SSO 발급(마음풀)**: `GET /api/maum-sso-token` — 로그인 유저 이메일을 `MAUM_SSO_SECRET`로 HMAC 서명(`payload_b64u.sig`, 5분) → `maumotter.com/?sso=`. 헬퍼 `signSso()`(src/index.tsx).
- **SSO 수신(마음수달)**: `POST /api/auth/sso` — `verifySso` HMAC 검증 → **이메일로 maum-auth 계정 자동 연결/생성** → maum JWT(email_verified=1). 프론트 App `?sso=` 처리. **결제는 수달 자체(쿠폰/구독) 유지, 계정만 연결.**
- **시크릿 `MAUM_SSO_SECRET`**: 두 워커(maumful·maumotter) **동일값**(설정됨). 미설정 시 발급 503 → 프론트는 maumotter.com **일반 링크 폴백**(기존 무영향). 발급 엔드포인트는 범용이라 곁 추가 시 버튼만.
- **진입 버튼 위치**: landing.jsx `navItems`(상단 nav) + app.jsx `GlobalNav`(로그인 후 헤더, `openMaumOtter`) + 패밀리 서비스 카드(1줄) + 마음수달 전용 소개 섹션.
- **히어로 우측 롤링 쇼케이스(C안)**: **좌측 헤드라인·CTA 고정, 우측만 5초 자동전환**(심리검사·게임·커플·수달). 마우스오버 정지·`prefers-reduced-motion` 존중·언마운트 인터벌 정리·화살표/점. `SHOWCASE`/`slideIdx`/`pausedRef` + 헬퍼 `openGame/openCouple/openOtter`는 **모두 `LandingPage` 스코프**.
- ⚠️ **프론트 헬퍼는 반드시 사용 컴포넌트(LandingPage) 스코프에 정의**. GlobalNav에 두면 `ReferenceError`로 랜딩 렌더 크래시(실발생·핫픽스). **배포 전 `node scripts/render_smoke.cjs public/static/compiled/landing.js`로 검증**(빌드/200은 런타임 ReferenceError 못 잡음). [[feedback_frontend_render_smoke]]
- **카피**: 랜딩의 마음수달/곁은 "통역"(직역) 대신 **"마음을 읽어 전해요"** 톤. 단 **maumotter 앱 자체는 "통역"이 핵심 개념**이라 유지(별개 서비스). 푸터 연락처 050-6789-0845.

### AI 해석 고도화 (검사 결과 해설, 2026-07 완료 · 메모리 `project_maumful_ai_interpretation`)
- **엔드포인트**(모두 SSE·AI Gateway·인증필수): `/api/ai-analyze`(단일), `/api/ai-analyze/integrated`(통합 심층해석, 서로다른 검사 2개+), `/api/ai-feedback`(👍/👎, 테이블 `ai_feedback` migration 0023).
- **모델**: 단일·통합 모두 **sonnet-4-6 우선**(haiku 폴백). 단일 temp 0.3·통합 temp 0.4. `buildAnalysisSystem`(페르소나+출력형식=`system`+`cache_control`) / `buildAnalysisPrompt`(검사 데이터=user)로 분리.
- ⚠️ **AI 프롬프트는 마크다운 금지 필수**: 프론트 해석 렌더가 `whitespace-pre-wrap`(마크다운 미렌더)이라 `##`·`**`·`---`가 그대로 노출됨(실버그). 시스템 프롬프트에 "마크다운 금지 + 섹션 제목 `[제목]` 대괄호" 지시 유지.
- ⚠️ **모델↔temperature 결합**: sonnet-4-6/haiku는 temperature 허용. **sonnet-5/opus-4.7+로 올리면 temperature 400** → 제거 필수. `system` 배열+`cache_control`은 beta 헤더 불요(GA), 시스템<2048토큰이면 캐시 미적용(무해).
- **당사자 톤**: 해석은 상담사 대상이 아니라 **본인 대상("당신" 어법)**. **검사 결과 서버 미저장 원칙 유지**(통합해석은 `test_history` 저장 메타만 사용, BIG5 result_json=factors 객체 그자체).
- **게임 행동 데이터 결합**(2026-07): `buildGameSummary(DB, userId)`(src/index.tsx) — 같은 `maumful-db`의 `game_session_logs`·`user_game_status` 30일 집계를 **통합해석 프롬프트**와 **`/api/test/report`**(리포트 §게임으로 본 나의 변화)에 주입. 게임 기록 0건이면 `null` → 프롬프트·화면 모두 기존과 동일.
  - ⚠️ **max_tokens 여유 확보**: 데이터가 붙으면 출력이 길어져 통합해석이 1800에서 **면책 문장이 잘렸음** → 2400. 프롬프트에 데이터를 추가할 땐 `stop_reason=end_turn` 확인 필수.
  - ⚠️ **외부 문자열은 위생 처리 후 프롬프트에 넣을 것**: 깨진 감정 라벨(U+FFFD)이 그대로 들어가자 AI가 *"제대로 전달되지 않아"* 라고 **사용자 출력에 언급**했다. 길이·깨진문자 필터 유지.
- **검사→게임 개인화 처방**: `gamePrescription(testType, score)`(app.jsx) → 리포트 §다음 단계 카드 → `openMaumGame(key)` → `game.maumful.com/?t=…&game=<key>`. 게임 키를 추가하면 **maumgame `game_hub.jsx`의 딥링크 `valid` 배열에도 반드시 추가**(누락 시 조용히 무시됨 — worry가 실제로 그랬음).
- 미착수: 통합해석 유료 상품화(토스 반영 후, 메모리 `project_maum_unified_payment`).

### AI 감정 추적 (Mood Logging)
- AI 응답에 `[MOOD:N]` 태그(0~100) → `ChatBox` processStream done에서 추출·제거 후 `/api/chat/mood-log` POST
- DB: `mood_logs(user_id, mood_score, test_type, created_at)` (migration 0020). 트렌드: `GET /api/chat/mood-trend?days=14`(최대 90)

### 외부 검사 결과 입력 (ExternalResultSection)
- 점수 직접 입력: `/api/test/external-result` POST
- PDF 업로드+AI 해석: pdf.js 추출 → `/api/test/analyze-pdf` POST (3cr). 히스토리 탭 `📥 외부 검사 결과 입력·AI 해석` 진입

### CBT 8주 플랜 (CbtPlanCard)
- PHQ-9·GAD-7·BURNOUT·DASS-21 이력 있을 때만 대시보드 표시. `/api/test/cbt-plan` GET(최초 1회 생성). 주차 완료 `localStorage('cbt_done_weeks')`

### 인근 상담 기관 찾기 (CounselingPage)
- Kakao Maps SDK + `/api/nearby-counseling?lat=&lng=`. 카테고리: 정신건강의학과/정신건강복지센터/심리상담센터. 24시간 무료상담(109·1577-0199·1388). `lang` prop 필수

### 쿠폰 시스템 (마음풀)
- 크레딧 지급 쿠폰(단일/캠페인), 어드민 패널 발행. `adminGuard` 인증. `0022_coupons.sql`

---

## 마음게임 번역 ✅ 완료
- 패턴: `t(ko, en)` — `GAME_LANG === 'en' ? en : ko`
- `GAME_LANG`: `game_engine.jsx`에서 `URLSearchParams(location.search).get('lang') || 'ko'`
- lang 전달: 마음풀/CTS → 게임 링크 `?lang=en`. `maumcouple`도 `COUPLE_LANG`/`tl` 동일 패턴
- 번역 파일(maumgame 11개, cts-game +qt.jsx): game_engine/registry/hub.jsx, games/{mood,garden,burnout,efmt,gratitude,tree,focus,worry}.jsx

---

## 크레딧 시스템

| 기능 | 크레딧 | 비고 |
|------|--------|------|
| 심리검사 1회 | 10cr | PHQ-9·GAD-7 무료 |
| AI 채팅 1회 | 2cr | 크레딧 보유 시 소진까지 무제한 |
| AI 채팅(크레딧 없음) | 무료 | 하루 5회 |
| PDF 분석 1회 | 3cr | 외부 검사 AI 해석 |

**패키지(KRW):** 스타터 50/2,900 · 표준 120/5,900 · 프리미엄 300/12,900 · 대용량 700/24,900
**일일 제한(`src/index.tsx`):** 크레딧≥2 차감 후 무제한 / <2 무료5회(`ai_daily:{userId}:{today}` KV TTL 86400) / 비회원 평생3회(`guest_chat:{ip}`) / 마스터 무제한·무차감

**향후 상품제 전환(현재 크레딧 유지):** 하이브리드(화면=상품, 백엔드=`spendCredits`/`gainCredits` 그대로). AI채팅은 상품 내장횟수. 전환 순서: ①토스 실결제 승인 후 ②마음풀·CTS 동시 변경. 착수 전 상세 설계 검토. (메모리 `project_product_pricing_plan`)

---

## 토스페이먼츠 결제

- **SDK v1** (`https://js.tosspayments.com/v1`, `<head>`). ⚠️ v2/base → 403. `window.TossPayments(clientKey).requestPayment('카드',{...})`
- **플로우:** 프론트 → `POST /api/payment/toss/checkout`(clientKey·orderId·amount·successUrl 반환) → requestPayment → `GET /api/payment/toss/success`(confirm API → 크레딧 지급) → `POST /api/webhook/toss`(이중지급 방지)
- **시크릿:** `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY`(test_/live_ prefix, 교체만 하면 코드 변경 불필요). `TOSS_WEBHOOK_SECRET` 미설정 시 검증 skip
- **마음풀: 실결제 활성화**(ChargeView `PAYMENT_LIVE=true`). 테스트키면 실결제 없음. (CTS는 준비중 — CTS 문서)

---

## 카카오 소셜 로그인 (마음풀)
- **Redirect URI 등록 위치:** 콘솔 → 앱 설정 → **플랫폼 키/어드민 키 → REST API 키** → 카카오 로그인 리다이렉트 URI (※ "카카오 로그인>일반" 아님)
- 마음풀 등록 URI: `https://maumful.com/api/auth/kakao/callback`. REST 방식(서버 사이드 팝업)
- ⚠️ **클라이언트 시크릿 "사용 안 함"** 필수(백엔드가 secret 미전송 → 켜면 "토큰 발급 실패")
- 동의항목: 닉네임(필수)/프로필(선택)/이메일(비즈앱). gender·age_range 권한 없음 → 이메일 가입폼에서만 수집. (메모리 `project_kakao_login`)

---

## 지자체 화이트라벨 (구현 대기 — 요청 시 착수)
- 멀티테넌트 단일 Worker: `organizations` 테이블 + `users.org_id` FK. Worker가 host 헤더로 org 식별 → `/api/org-config`. 도메인 CNAME → 마음풀 Worker. org 없으면 기본 폴백
- `landing_config` JSON: hero(bg_image·overlay 0.5~0.6·title·subtitle) / brand(name·logo·color) / footer(org_name·address·phone). 히어로=배경사진+반투명오버레이+흰텍스트 고정
- 작업: organizations migration → users.org_id → `/api/org-config` → landing.jsx 적용 → 어드민 설정 UI
- 규모별: 소규모=멀티테넌트(A) / 대형·데이터분리=CTS 트윈(B). (메모리 `project_whitelabel_gov`)

---

## 임상·법적 표현 정책 ⚠️ 카피 작성·검토 시 필수 (마음풀·CTS 동일)

마음풀·CTS는 의료기관이 아닌 **B2C 자기이해·정보제공·돌봄 콘텐츠 서비스**. "서비스가 진단·치료한다"는 임상 표현 완화. (메모리 `feedback_clinical_expression_policy`)

**완화 대상:** 진단(서비스기능)→점검/체크 · 치료/처방/완치→제거·돌봄·관점 · 임상(검증/표준)→전문/표준 · 임상심리학→심리학 · 진단조 단정→"~다소 높게 나타남" · 처방형 권고→참고할 접근/연습 · EN: clinically validated→standardized / THERAPY→(삭제) / heal·restore your mind→nurture·care / diagnosis→check / symptom patterns→response patterns

**유지(절대 변경 금지):** 면책문구("의료적 진단·치료 대체 안 함") · 백엔드 AI 프롬프트 진단금지 지침 · 검사 문항 원문의 `증상`(표준도구) · 상담사 자격/전문분야(사실) · 인근기관명 · 심각도 레벨(정상/경도/중등도/중증) · admin "모델 진단"(IT용어)

> 톤: 자기이해·정보제공·돌봄. 영어본 동일. 신규 카피도 준수.

---

## 개발 완료 후 검증 원칙 ⚠️ 필수
기능 개발 완료 시 **즉시(요청 없어도)** 에러·버그 검증. 시점: 빌드 성공 후, 배포 전/직후.
- 범위: 변경 파일 + 직접 연관(프론트·백엔드). 신규 함수 변수 스코프·타입·undefined. 크레딧 차감 레이스/원자성. API 응답 구조 일치(프론트↔백). `parseInt()` NaN, `.first()` null. React Hook 의존성 배열.
- 이유: `getAnthropicKey` 매개변수 오류, `credits`/`isMaster` 미정의, 크레딧 레이스, `AI_LIMIT_PAID` 미정의 등 사전 검증으로 방지 가능했던 버그 다수. (메모리 `feedback_verify_after_dev`)
