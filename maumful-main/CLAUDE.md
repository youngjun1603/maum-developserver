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
- 검사 **10종**: PHQ-9, GAD-7, DASS-21, BIG5, LOST, SRCI(=SCT), SDRI(=DSI), K-MBI+, Holland RIASEC, 직업가치관
  - ⚠️ 과거 "12종(…SCT, SRCI, DSI, SDRI, RBC, SDI)"으로 적혀 있었으나 **오류**: SCT=SRCI·DSI=SDRI를 중복 계수했고 `RBC`·`SDI`는 **코드에 존재하지 않는다**. 실제 문항 배열 10개 기준(`phq9Q`·`gad7Q`·`dass21Q`·`big5Q`·`lostQ`·`sdriCompletionQ`·`sdriLikertQ`·`burnoutQ`·`RIASEC_Q`·`VALUES_Q`). 문항수·표기는 메모리 `project_maumful_tests`.
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

### AI 상담 채팅 응답 톤 (2026-07-19 · 메모리 `project_maumful_chat_tone`)
`/api/ai-chat` 시스템 프롬프트 **4트랙**(한글 일반·기독교, 영어 일반·기독교, `src/index.tsx` `staticKo*`/`staticEn*`).
- **공감/탐색/제안(말씀) 라벨 폐지**: 예전엔 `답변 형식(매번 이 순서로)` + `**공감**` 볼드 라벨 → 모델이 라벨을 그대로 출력하고 채팅이 `renderMdText`로 볼드 렌더 → **양식 채우기처럼 기계적**. 지금은 제목·라벨·번호·불릿 금지, 이어지는 문장으로만. **라벨을 되살리지 말 것.**
- **평가형 공감 금지**("정확한 자기 인식이네요"는 공감이 아니라 채점) / **상태별 분기**(감정 격함=공감만, 정체=질문 하나, 방향 탐색중=작은 제안) / 제안은 처방이 아닌 권유.
- ⚠️ **few-shot 예시가 설명보다 강하다** — 라벨만 지우면 모델이 번호목록 등으로 **재구조화**하고, 원하는 논리(관계 근거 등)도 예시를 넣기 전엔 출력되지 않았다. 프롬프트 지시를 바꿀 땐 예시를 함께 넣을 것.
- ⚠️ **위기 지시는 형식 지시보다 뒤에** 둘 것(뒤 섹션이 앞을 덮음). 한글=1393, 영어=988. **기독교 트랙엔 원래 위기 지시가 아예 없었다** → 신규 추가했으니 지우지 말 것. "기도·믿음 권유로 전문 도움 안내를 대신하지 말 것"도 포함.
- ⚠️ **`[MOOD:N]`은 프론트가 파싱**(app.jsx `moodMatch`) → 자유 서술을 강조할수록 누락 위험, 프롬프트 맨 끝에 강하게 유지. 프론트는 공감/탐색/제안 섹션을 **파싱하지 않으므로** 형식 변경은 프론트 무영향.
- **검증**: 비회원 채팅(`ai_guest_total:{ip}` KV, 3회/IP — 키 삭제로 리셋)으로 라이브 확인. curl은 **한글이 깨지니 페이로드를 UTF-8 파일로 `--data-binary @file`**(깨진 문자가 들어가면 AI가 "텍스트가 보이지 않는다"고 답한다).

### ⚠️ 기독교 트랙 성경 정확성 (마음풀·CTS 공통, 2026-07-19)
**실제 사고**: 상담 응답이 *"하나님도 닷새 일하고 하루를 쉬셨어요"* 라고 답했다(창세기는 **엿새 일하고 이레째 안식**). 기독교 서비스에서 성경 사실 오류는 톤 문제보다 심각.
- **원인 구조**: 프롬프트가 **매 응답 성경 인용을 의무화**하면 확신이 없어도 지어낸다. 특히 `구절 전문`·`책명 장:절` 강제가 위험 최대.
- **원칙**: 인용은 **정확히 아는 것만**, 내용·장·절이 조금이라도 불확실하면 **인용하지 말고 자기 말로 위로**, 구절·숫자·사건 **지어내기 금지**. 적용 위치 = 채팅 4트랙 + 해석 `biblicalFormat`(마음풀), CTS는 코드 폴백 + **운영 DB `ai_config` 3건**.
- **신학 방향(사용자=상담사 감수)**: 신앙의 바탕은 규칙이 아니라 **관계** — 하나님은 교제하시려 사람을 지으셨고 예수님의 십자가로 자녀 삼으셨다. 그러므로 **지친 사람에게 쉼을 말하는 것은 합당하며 아버지가 기뻐하시는 방향**. 단 쉼을 권할 때 **상대의 신앙·봉사 태도를 평가하지 말 것**("계속 짐을 지는 건 신앙적으로 건강하지 않습니다" 류 금지 — 실제로 나왔던 표현). 봉사·헌신을 성과나 의무로 다루지 말 것.
- **기독교 프롬프트를 건드릴 땐 반드시** ①성경 인용 케이스 ②위기 케이스를 라이브로 태울 것.

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

## 마음게임 ↔ 마음풀 상호 연결 (양방향 루프)
- **해금 정책(2026-07)**: 게임 **전 종목 Lv.1·검사 조건 없음**. 이전엔 레벨(최대 Lv.4)+검사를 요구해 신규 사용자에게 8종 중 3종만 보였고, 리포트가 처방하는 게임이 정작 잠겨 있었다. 레벨·EXP는 정원 성장/배지/스트릭 표시로만 쓴다. ⚠️ 해금을 다시 걸 땐 `game_registry.jsx`와 서버 `ALL_GAME_IDS`(src/index.tsx)를 **함께** 고칠 것(이중 관리 지점). 검사↔게임 연결 표시는 `linkedTests`(잠그지 않음).
- **루프 계측**: `loop_events`(migration 0024) — `report_view`·`rx_click`(마음풀) / `suggestion_view`·`suggestion_click`(게임). 어드민 **🔁 루프 탭**(`GET /api/admin/loop-metrics`)에서 정방향·역방향 퍼널을 사람 수로 본다. '실제 검사 완료' = 제안 클릭 후 그 검사를 끝낸 사람(루프가 닫혔는지). 계측은 fire-and-forget — 실패해도 기능에 영향 없음.
- **마음커플 "우리의 정원"**(`GET /api/couple/garden`): 두 사람의 게임 실천 **횟수만** 합산. ⚠️ 파트너의 감정 기록 내용(emotion·intensity·note)은 **서버가 조회조차 하지 않는다**. 감정 내용 공유는 명시적 동의·철회 UX 없이는 하지 않는다.
- **검사 → 게임**: 마음풀 리포트 §다음 단계의 `gamePrescription` → `openMaumGame(key)`.
- **게임 → 검사**: `GET /api/game/test-suggestion` — 30일 게임 신호(감정 기록·번아웃 에너지)로 검사 제안. 허브 `TestSuggestionCard`(닫으면 7일 재제안 안 함) + 주간 메일 CTA가 **`pickTestSuggestion` 한 함수**를 공유(규칙 분기 금지). 신호 약하면 `null` → 카드 미표시.
- 게임 AI 모델: **CBT 생각 변환만 sonnet-4-6 우선**(haiku 폴백). 데일리 팁·AI 일기·세션 피드백 등은 haiku 유지(짧고 가벼움).
- ⚠️ **위기 감지 키워드는 NFC 정규화 후 판정**: 자모 분리(NFD) 한글은 완성형 정규식에 매칭되지 않아 1차 방어가 통째로 우회된다(실제 확인). `text.normalize('NFC')` 필수. 한글 키워드 매칭을 새로 짤 때 항상 적용할 것.

## 마음게임 주간 리포트 메일 (Cron: 매주 월 03:00 UTC · `maumgame-main/src/index.tsx` `handleScheduled`)
- 지난 7일 활동자에게 활동 요약 + **마음풀 CTA**(최근 30일 검사 있으면 `?go=history`, 없으면 게임 신호로 검사 추천 `?go=test:PHQ9`) 발송.
- ⚠️ **수신거부 필수**(정보통신망법). `game_email_prefs.optout`(migration 0006, opt-out 방식) → cron이 제외. `GET /unsubscribe?u=&s=`(HMAC 서명, 로그인 불필요). **메일 발송 기능을 만들 땐 수신거부 링크를 반드시 포함**할 것.
- ⚠️ **D1 마이그레이션 적용 여부를 반드시 확인**: `weekly_reports`(0002)·`user_test_scores`(0003)가 원격 DB에 **적용된 적이 없었고**, 코드가 D1_ERROR를 `try/catch`로 삼켜 몇 달간 조용히 실패했다. 새 테이블을 쓰는 코드는 `SELECT name FROM sqlite_master`로 실재를 확인하고, 스키마 에러를 빈 catch로 삼키지 말 것.
- 마음풀 딥링크: `?go=history` / `?go=test:<TESTTYPE>` (마음커플 전용 `?start=`와 별개 — `?start=`는 "커플로 복귀" 배지를 띄운다).

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
| 통합 심층해석 1회 | 40cr | `INTEGRATED_COST`(2026-07-22 20→40). 첫 1회 무료 |

### 상품 가격 정합 (2026-07-22 A-2 개편 · 커밋 085e8b0·0242d89 · 메모리 `project_product_pricing_plan`)
- ⚠️ **핵심 규칙: 크레딧은 공용 화폐 → "크레딧 지급 상품"은 크레딧이 많을수록 크레딧당 단가가 같거나 싸야 한다(단조 감소).** 어기면 지배당하는 **죽은 상품**이 됨(예전 통합해석·검사1회). **가격 바꿀 땐 반드시 곡선 정합 확인** + 프론트 `PACKAGES_KR`와 백엔드 `PACKAGES` **두 곳 동시**(표시=프론트, 청구=백엔드).
- **단품(프론트 노출)**: PDF 3cr/₩1,000 · 검사1회 10cr/₩2,000 · AI10회 20cr/₩2,900 · 부부·세대팩 25cr/₩3,300 · 올인원 33cr/₩3,900 · 통합해석 40cr/₩4,500 (크레딧당 333→200→145→132→118→113 단조↓).
  - **부부·세대 3단계(2026-08-08 확장)**: 각각 라이트 10회 25cr/₩3,300(132) · 스탠다드 20회 50cr/₩4,900(98) · 프로 40회 100cr/₩8,900(89). 회당 평균 2.5cr(수신·발신 2cr/중재·관점 3cr). 공용 크레딧 지급(service 없음)이라 위 곡선에 편입 → 50cr(98)은 충전 스타터와, 100cr(89)은 50↔120cr 사이에 정합. **크레딧 상품 UI는 서비스별 섹션 구분**(app.jsx `SERVICE_GROUPS`: 마음풀/부부/세대/수달/곁).
- **충전팩(`PACKAGES`만·프론트 미노출)**: 스타터 50/₩4,900 · 표준 120/₩9,900 · 프리미엄 300/₩15,000 · 대용량 700/₩25,000 (98→82→50→36).
- **수달·곁(외부 grant, credits:0·비공용)**: 곡선 무관 독립가(라이트 7,900/프로 14,900/10회팩 6,900). `/api/grant` 라이브·`MAUM_SSO_SECRET` 설정됨.

**일일 제한(`src/index.tsx`):** 크레딧≥2 차감 후 무제한 / <2 무료5회(`ai_daily:{userId}:{today}` KV TTL 86400) / 비회원 평생3회(`guest_chat:{ip}`) / 마스터 무제한·무차감

---

## 토스페이먼츠 결제

- **SDK v1** (`https://js.tosspayments.com/v1`, `<head>`). ⚠️ v2/base → 403. `window.TossPayments(clientKey).requestPayment('카드',{...})`
- **플로우:** 프론트 → `POST /api/payment/toss/checkout`(clientKey·orderId·amount·successUrl 반환) → requestPayment → `GET /api/payment/toss/success`(confirm API → 크레딧 지급) → `POST /api/webhook/toss`(이중지급 방지)
- **시크릿:** `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY`(test_/live_ prefix, 교체만 하면 코드 변경 불필요).
- ⚠️ **`TOSS_WEBHOOK_SECRET`은 선택**(2026-07-21 정정). 토스 웹훅 콘솔엔 서명 시크릿/Authorization 설정란이 **없다**(실측) → 토스는 서명 헤더를 안 보낸다. 예전 코드는 이 헤더를 강제해 **라이브 웹훅이 전부 401/503으로 막혔다**. 이제 강제하지 않고 아래 이중 방어 ②(재조회)로 검증한다. 시크릿을 설정하고 URL에 심어 둔 경우엔 헤더가 올 때만 추가 대조.
- **웹훅 이중 방어**(`/api/webhook/toss`): ① (선택) 시크릿+URL로 헤더가 오면 대조, 안 와도 통과 ② 토스 `GET /v1/payments/{paymentKey}`로 실제 결제·`totalAmount` 재확인(**진짜 검증은 여기**). **지급 근거는 요청 metadata가 아니라 DB** — `orderId`(`charge_<chargeId>_<ts>`)에서 chargeId를 파싱해 `credit_charges` 행의 user_id·credits·amount를 쓴다. 웹훅·success 모두 `UPDATE … WHERE id=? AND status='pending'` + `meta.changes`로 원자적 선점(중복 지급 방지). 위조 본문은 ②에서 막힌다(가짜 paymentKey→400, 실측). ⚠️ 웹훅 페이로드는 결제객체가 최상위/`data` 중 어디로 올지 몰라 **둘 다 파싱**(`body.data ?? body`).

### ✅ 라이브 가동 완료 (2026-07-22) — 상세는 메모리 `project_toss_payment`
- **상점 MID = `maumfu5xcd`**(일반결제/"기존 결제창", 토스 담당자 확인). 이 상점 MID 4개 중 `link_*` 2개는 결제위젯/LinkPay(**안 씀**), `maumfu*`가 일반결제. 라이브 키 `live_ck_`/`live_sk_` 등록 완료(파일경유·마스킹).
- **confirm 엔드포인트 = `POST /v1/payments/confirm`**(body에 `{paymentKey,orderId,amount}`, v2 규격). 시크릿키로 Basic 인증. 위젯 시도했다가 원복(상점에 표준 ck 있어 v1 카드 팝업 유지 — 재migration 금지).
- **첫 라이브 실결제(id=30) 검증 완료**: 카드결제→승인→지급→내역, 정확히 1회 지급. 이후 셀프 환불로 취소까지 검증.
- ⚠️ 실결제 **추가 검증은 사용자가 내일 몇 건 더**(2026-07-22 기준). 문제 시 개선된 에러표시로 `[코드]` 노출.
- **정기결제(빌링)는 별도 계약** — `TOSS_BILLING_KEY` + 멤버십 버튼 교체(백엔드 `/api/subscription/toss/*` 구현됨). 메모리 `project_payment_roadmap`.
- CTS는 별도(더새놀 사업자) — CTS 문서.

### 고객 셀프 환불 (2026-07-22) — 상세는 메모리 `project_toss_payment`
- `POST /api/credits/refund {pgTid}`. 프론트: 마이페이지 크레딧 내역 '구매/지급 내역'의 카드결제 건 [환불 요청] 버튼(7일 이내·completed일 때만).
- **정책(확정)**: **전액환불만**(부분환불 없음). 미사용=현재 잔액 ≥ 구매 크레딧(관대). 전자상거래법 청약철회.
- 흐름: 소유·7일·잔액 검증 → 외부서비스 상품 차단 → 원자적 선점(completed→refunded, status CHECK 4개라 중간상태 없음) → 크레딧 회수(잔액가드) → 토스 취소 API(`POST /v1/payments/{paymentKey}/cancel`) → 실패 시 전부 롤백 → 성공 시 원장+`reversePartnerCommission`.
- ⚠️ **`credit_transactions.type`은 `CHECK(type IN ('gain','spend'))`** — 차감/환불 원장은 **`'spend'`**(‘loss’ 쓰면 INSERT가 CHECK 위반→500. 실사고 2026-07-22, 고객·어드민 환불 둘 다 수정). 원장 실패해도 돈 환불 후엔 성공 반환(try/catch).
- 어드민 환불(`/api/admin/payments/:id/refund`)은 **토스 취소 없이 크레딧만 회수**(돈은 콘솔 수동) — 고객 환불과 다름.

---

## 이메일 인증 (2026-07-19 강제 활성화)
- **신규 이메일가입만 인증 강제**: `/api/auth/login`이 미인증 시 403 `requiresVerification` → 프론트가 '인증 필요 + 재발송'(`/api/auth/resend-verify`) 안내. 기존 회원은 그랜드파더링(`is_email_verified=1`)했고, **소셜 로그인은 면제**(게이트가 login에만 있고 소셜은 가입 시 verified=1). 끄려면 login의 미인증 차단 블록 주석 처리.
- ⚠️ **verify 링크는 프리페치 안전(멱등) 필수**: 이메일 속 `GET /api/auth/verify/:token`은 메일 클라이언트·보안 스캐너가 **프리페치**해 토큰을 먼저 소진한다 → 일회용 토큰을 GET으로 소진하면 사용자 클릭 시 "이미 사용됨" 에러. **used_at/이미 인증됐으면 성공으로 안내(멱등)** + raw JSON 아닌 **HTML 페이지** 응답. (CTS도 동일 반영). 메모리 `project_maumful_email_verify`.

## 카카오 소셜 로그인 (마음풀)
- **Redirect URI 등록 위치:** 콘솔 → 앱 설정 → **플랫폼 키/어드민 키 → REST API 키** → 카카오 로그인 리다이렉트 URI (※ "카카오 로그인>일반" 아님)
- 마음풀 등록 URI: `https://maumful.com/api/auth/kakao/callback`. REST 방식(서버 사이드 팝업)
- ⚠️ **클라이언트 시크릿 "사용 안 함"** 필수(백엔드가 secret 미전송 → 켜면 "토큰 발급 실패")
- 동의항목: 닉네임(필수)/프로필(선택)/이메일(비즈앱). gender·age_range 권한 없음 → 이메일 가입폼에서만 수집. (메모리 `project_kakao_login`)

---

## ⚠️ 상담센터 어드민 = 의도적 휴면 (삭제 금지)
`counseling_admin.jsx`(`CounselingAdminPage`, `view === 'counselingAdmin'`)와 상담센터·상담사·예약·정산(`/api/admin/counseling/*`·`settlements`·`counselor_earnings`)은 **휴면 상태로 보존**한다(사용자 확정 2026-07-19).
- **접근 링크가 없다**(`setView('counselingAdmin')` 호출부 0·`?go=` 미지원) → UI 진입 불가. **이건 버그·죽은 코드가 아니라 의도된 휴면.** 상담사 매칭이 법적 보류([[feedback_maumful_b2c_legal]])라 링크만 끊고 코드는 남겼다.
- **삭제·정리 금지.** 향후 **제휴 상담센터 개념 부활** 시 `setView('counselingAdmin')` 링크(또는 `?go=counselingAdmin`)만 추가하면 되살아난다.
- 제휴코드 수익 쉐어 **정산은 메인 관리자(app.jsx `MasterPartnerPanel` 🤝 파트너 탭)** 에 있다 — 상담 어드민과 무관. 메모리 `project_maumful_counseling_admin_dormant`.

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

## 유료화 — 프리미엄 프리미엄 & 통합결제 (2026-07-18 구현·배포)

전략(사용자 확정) = **무료로 경험 → 유료 전환**, 저가 포지셔닝 지양(프리미엄 가격). ⚠️ **실결제는 토스 라이브키 등록 후** 동작(현재 테스트키 — 카탈로그·전환로직은 다 살아 있고 결제만 대기).

- **마음풀 상품**(`PACKAGES` index.tsx / `ChargeView` PACKAGES_KR app.jsx):
  - 내부(마음풀 크레딧 지급): 통합해석 40cr/₩4,500·부부/세대 통역팩 25cr/₩3,300 (2026-07-22 정합 개편, 위 "상품 가격 정합" 참조). 부부·세대는 maumful `users.credits`를 차감하므로 상품=크레딧 지급.
  - 외부(수달·곁, `service`+`grantType`·credits=0): 라이트 ₩7,900/프로 ₩14,900/10회팩 ₩6,900.
- **무료→유료 전환**(프리미엄 프리미엄): 부부·세대 **첫 3회 무료**(KV `bubu_free_used`/`sedae_free_used`{uid}, 세대는 성인만·청소년 무료) → 크레딧 차감 → 없으면 402 `needPurchase`. 통합해석 **첫 1회 무료**(KV `integrated_free_used`)→**40cr** 선결제(스트리밍이라 스트림 시작 전 선결제·upstream 502 시 환불·마스터 무제한).
- **통합결제 grant**(수달·곁은 별도 생태계라 크레딧 대신 지급 전달): 결제성공(success·webhook)→`service` 있으면 `deliverGrant`(`signSso` 서명→POST `maumotter.com`/`maumgyeot.com` `/api/grant`)→각 서비스 `verifySso`·`applyGrant`. 큐 `external_grants`(마음풀)·멱등 `external_orders`(수달곁). 재시도 `/api/admin/deliver-pending-grants`. **`MAUM_SSO_SECRET` 3곳 동일값 필수**(마음풀·수달·곁). E2E 검증 완료(지급·멱등·위조401·환불revoke). 상세=메모리 [[project_maum_unified_payment]].

## 제휴코드 수익 쉐어 정산 (2026-07-19)
기존 파트너 시스템(`partners.revenue_share_rate`·`credit_charges.partner_code`) 위에 **정산 원장** 추가. 결제 완료 시 `accruePartnerCommission`(비차단 `.catch`)이 `partner_commissions`에 적립 — **charge_id PK 멱등**·**적립 시점 rate 스냅샷**(율 변경돼도 과거 정산 불변)·`partners.commission_start/end`(귀속 기간). 어드민 = **메인 관리자(app.jsx) 🤝 파트너 탭 `MasterPartnerPanel`**(등록·정산 원장 조회·**CSV 다운로드**·정산완료). 개인 친구초대(`referrals` 크레딧)와 별개. 실적립은 토스 라이브 후. 메모리 `project_maumful_partner_revshare`.
- **파트너 자가열람 정산 포털(2026-07-28)**: 제휴사 담당자가 `/partner`(독립 경량 번들 `partner_portal.jsx`)에서 **직접 로그인해 자기 정산만** 조회. **인증 3종째** — `partner_accounts`(migration 0028) + `POST /api/partner-portal/login` → **`{typ:'partner',pc,aid}` JWT(sub 없음)**. 가드 `requirePartner`가 조회코드를 **토큰에서만** 취함(IDOR 차단). ⚠️ 파트너 토큰은 `sub`(숫자) 없어 고객 `getAuthUserId`가 거부·관리자는 고정시크릿이라 분리 → 타 파트너/전체매출 접근 불가(E2E 실증). 최소집계(고객정보·상품 미노출). 관리자 계정 CRUD = 🤝 탭 담당자 계정 섹션.
- ⚠️ **D1 원격 마이그레이션 트랩**: 원격 `maumful-db`는 마이그레이션 트래킹 테이블이 비어 `npx wrangler d1 migrations apply … --remote`가 **0001부터 재적용 시도→기존 스키마와 충돌 실패**. 새 마이그레이션은 **`npx wrangler d1 execute maumful-db --remote --file=migrations/00NN_*.sql`로 직접 적용**(DDL은 `IF NOT EXISTS`로 멱등하게)·영문 DDL만(한글 주석 X). limyj007 계정.

## 제휴 SSO 온보딩 + 진입 레이어 (검토완료·착수 향후, 2026-07-22)
제휴처(삼아 등)에서 **이미 로그인된 유저가 배너 클릭 → 마음풀 별도 로그인 없이 자동 로그인**. **이미 구현됨**: `?p=<코드>&sso_token=` → `POST /api/auth/partner-sso`(HMAC-SHA256 서명검증·uid로 계정 매칭/자동생성·+20cr·partner_code 귀속). 토큰=`base64url(payload).base64url(HMAC(sso_secret,payloadB64))`, payload=`{uid,email?,nick?,exp}`. 파트너 등록(어드민 🤝 파트너 탭)에 **sso_secret 필수**. ⚠️ sso_token은 exp 짧게·클릭 시점 발급(고정 href 금지).
- **진입 이원화 설계(착수 향후)**: 코어 `app.jsx` 무변경, `landing`처럼 **별도 경량 번들 진입 레이어**로 전환 화면을 붙여 빠르게 반복. 전환 레버=제휴전용 쿠폰/보너스·SSO 마찰0·단일CTA·큐레이션. **config 구동**(어드민 편집=즉시반영·A/B). 상세·와이어프레임=메모리 `project_maumful_partner_entry`. **삼아는 계약 전(사전점검)**.

## 크롤링 정책 (robots.txt, 2026-07-18)

마케팅 노출 위해 **AI 검색·답변봇 부분 허용**: Google-Extended(Gemini)·OAI-SearchBot·ChatGPT-User·PerplexityBot = HTML 허용 + `/static/`(검사문항 든 JS번들)·`/api/` 차단. **AI 학습봇**(GPTBot·ClaudeBot·CCBot 등)·**스크래퍼**(Ahrefs·Semrush 등)는 전면 차단. `X-Robots-Tag`/meta에서 `noai` 제거(noimageai 유지). ⚠️ 순수 SPA라 검사화면 URL이 없다 → 실보호 대상 = 문항이 든 **`/static/` 번들**. sitemap에 `/story` 추가. 상세=메모리 [[project_maumful_crawl_policy]].

## 개발 완료 후 검증 원칙 ⚠️ 필수
기능 개발 완료 시 **즉시(요청 없어도)** 에러·버그 검증. 시점: 빌드 성공 후, 배포 전/직후.
- 범위: 변경 파일 + 직접 연관(프론트·백엔드). 신규 함수 변수 스코프·타입·undefined. 크레딧 차감 레이스/원자성. API 응답 구조 일치(프론트↔백). `parseInt()` NaN, `.first()` null. React Hook 의존성 배열.
- 이유: `getAnthropicKey` 매개변수 오류, `credits`/`isMaster` 미정의, 크레딧 레이스, `AI_LIMIT_PAID` 미정의 등 사전 검증으로 방지 가능했던 버그 다수. (메모리 `feedback_verify_after_dev`)
