# CTS 게임 (The Light of Life 치유 게임) 설계서

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | CTS 게임 / 예수님마음 치유 게임 (`lightoflife-game`) |
| 폴더 | `cts-game-main/` (Worker `lightoflife-game`, `lightoflife-game.limyj007.workers.dev`) |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `06780be` (2026-08-29, "[cts] 게임 AI 호출 전용 egress 프록시 경유 지원 — env AI_PROXY_URL") |
| 근거 소스 | `README.md`·`README_HANDOVER.md` · `../cts-maum-main/CLAUDE.md` §6 · `../cts-maum-main/HANDOVER.md` · `../cts-maum-main/docs/DESIGN.md` · `../CLAUDE.md`(루트) · `../maumful-main/CLAUDE.md` · `wrangler.toml` · `package.json` · `src/index.tsx`(1,417줄 · 라우트 25) · `migrations/0001~0006` · `public/static/*.jsx`(engine·registry·hub + games 9종) |

> ⚠️ **이 문서는 차이점 중심 문서다. 공통 내용은 `../maumgame-main/docs/DESIGN.md`(마음게임 설계서)를 참조한다.**
> CTS 게임은 마음게임(`maumgame`)의 **트윈**이다. 소스가 거의 같으므로 같은 부분은 짧게 쓰고 `→ 마음게임 설계서 §x 와 동일` 로 위임했다. 다른 부분(별도 D1·KV, 게임 9종, `qt` 큐티, cron 비활성, 마음풀 연계 기능 미포팅)만 상세히 적는다.
> 코드 규칙의 단일 출처는 **`../cts-maum-main/CLAUDE.md` §6**(CTS 게임 고유) + **`../maumful-main/CLAUDE.md`**(공통)이며, 이관 관점 단일 출처는 **`../cts-maum-main/HANDOVER.md`** 다.

> **작성 원칙**: 근거는 코드·설정·`CLAUDE.md`·migrations. 확인되지 않은 것은 `⚠️ 미확인`. 기능 상태는 `배포됨`/`구현·미배포`/`설계만`/`보류`.

---

## 1. 서비스 개요
- **한 줄 정의**: CTS 본체(예수님마음, `jesusmaum.com`)의 심리검사와 이어지는 **기독교 테마 치유 게임 9종 플랫폼**. 마음게임 8종을 성경적 언어로 재작명하고, CTS 전용 **QT(큐티) 체크인** 1종을 더했다.
- **해결하는 문제**: → 마음게임 설계서 §1 과 동일(검사 이후의 일상 실천을 게임으로 연결). **더해서** 실천의 언어를 기도·말씀·묵상으로 번역해 신앙 사용자의 진입 장벽을 낮춘다.
- **타깃 사용자**: CTS 로그인 사용자(한/영). 비로그인은 `LoginGate` 만 표시(→ 마음게임 설계서 §1 과 동일).
- **핵심 가치 제안**
  - 게임 9종 전부 **무료·Lv.1 해금**(`creditCost: 0`) — 마음게임과 동일(2026-07 해금 게이팅 폐지, 커밋 `83a0848`).
  - 심리 도구 기반 설계는 마음게임과 같되 **표현이 기독교 트랙**(예: 걱정 풍선 → 기도 풍선, 벧전 5:7 인용).
  - **QT 체크인**: 성경 읽기·묵상·기도제목을 매일 기록하고 30일 달력으로 습관화(§2.2).
- **생태계 내 위치**: **CTS 생태계의 위성 워커.** CTS 본체(`lightoflife`)와 **D1 `lightoflife-db`·KV `75bddd6d…`·`JWT_SECRET` 을 공유**하고 `?t=` 토큰 SSO로 진입한다. **마음풀 DB(`maumful-db`)와는 완전히 별개다.** 2026-07-18부터 **유지보수 모드**(버그·안전 수정만, §14).

---

## 2. 도메인 규칙 (이 서비스 고유)

### 2.1 게임 9종 = 마음게임 8종의 기독교 재작명 + QT 1종
게임 **ID·심리 도구·플레이 구조·EXP 공식은 마음게임과 동일**하다(→ 마음게임 설계서 §2.1·§2.3). 다른 것은 **표시 이름·문구·색상**과 **9번째 게임 `qt`** 다.

| ID | CTS 이름 | 마음게임 이름 | 심리/신앙 근거 | `linkedTests` |
|---|---|---|---|---|
| `mood` | 감사 제단 🕊️ | 감정 수채화 🎨 | 감정 알아차림 + 주님께 내어드리기 | — |
| `garden` | 말씀의 정원 🌿 | 마음의 정원 🌿 | CBT + 호흡 기도·말씀 묵상 (빌 4:9) | PHQ9 |
| `efmt` | 감정꽃 찾기 🌸 | 감정꽃 찾기 🌸 | EFMT 감정 인지 | PHQ9 |
| `gratitude` | 감사 별자리 ✨ | 별빛 감사 일기 ⭐ | 긍정심리학 감사 개입 | — |
| `tree` | 믿음의 나무 🌳 | 내면의 나무 🌳 | ACT + 자아분화, "그리스도 안에서" | DSI |
| `focus` | 말씀 집중력 📿 | 마음 집중력 🧠 | 작업기억·주의 훈련 | BURNOUT |
| `burnout` | 회복의 샘 💧 | 번아웃 회복 ⚡ | 행동활성화·회복 루틴(회복 마을/도시) | BURNOUT |
| `worry` | 기도 풍선 🙏 | 걱정 풍선 🫧 | ACT 탈융합 + "염려를 다 주께 맡기라"(벧전 5:7) | GAD7 |
| **`qt`** | **QT 체크인 📖** | **없음 (CTS 전용)** | 말씀 묵상 습관 형성 (시 1:2) | — |

- 게임별 본체 `.jsx` 8종의 **로직 차이는 사실상 없다**. 실제 diff:
  - `burnout.jsx`·`mood.jsx`·`tree.jsx` — **완전 동일**(0줄 차이).
  - `efmt.jsx`·`focus.jsx`·`gratitude.jsx` — **테마 색 1~2줄만**(`sage` `#4A7C59` → `#6B21A8` 보라).
  - `garden.jsx` — 테마 색 + 위기 안내 화면 분기문 형태 차이(기능 동등, §2.3).
  - `worry.jsx` — 카피 전면 기독교화(기도 풍선·주님께 올려드리기) + 예시 걱정 문구.
- **브랜드 컬러**: 마음게임 세이지 그린(`#4A7C59`) → CTS 보라(`#6B21A8`/`#9333EA`).
- **게임 ID는 3곳 중복 정의**(서버 `ALL_GAME_IDS` · `GAME_REGISTRY` · 허브 딥링크 화이트리스트 `valid`) — 마음게임과 동일한 3중 관리. ⚠️ **CTS는 여기서 이미 사고가 나 있다**(§15-5).

### 2.2 QT(큐티) 체크인 — 이 서비스의 유일한 고유 게임
`public/static/games/qt.jsx`(461줄, `QTGame`). CTS에만 존재한다.

- **화면 4단계**: `intro`(시 1:2 인용 · 오늘 완료 여부 · 연속일) → `write`(입력) → `done`(완료·시 12:6) → `calendar`(이번 달 달력 + 최근 기록).
- **입력 필드**: 책 이름(필수) · 장 · 절 · **오늘 말씀에서 받은 은혜**(필수, 자유 서술) · **오늘의 기도 제목**(선택).
- **저장 구조 — 이 게임만 다르다**
  - 묵상 본문·기도 제목을 포함한 전체 기록은 **브라우저 `localStorage` 키 `lol_qt_history` 에만** 저장된다(최근 90건).
  - 서버에는 `POST /api/game/session` 으로 `{ gameId:'qt', moduleType:'MINDFULNESS', score:50, metadata:{ book, chapter, has_prayer } }` **만** 보낸다 → **묵상 본문은 서버에 남지 않는다.**
  - 결과: 프라이버시 측면에서는 다른 게임(자유 서술이 `game_session_logs.metadata` 에 평문 저장)보다 **안전하지만**, 기기 변경·캐시 삭제 시 QT 기록·달력·연속일이 **전부 소실**된다(§15-13).
- **연속일(`calcStreak`)은 게임 내부에서 `localStorage` 기록으로 계산**한다. 서버 `user_game_status.streak_days`(KST 기준)와는 **별개 값**이다.
- `module_type` 이 `MINDFULNESS` 로, 다른 게임들이 쓰는 값(`checkin`·`breathing`·`cbt`·`EFMT`·`RELAX`·`ACT`·`MISSION`·`focus_training`)과 계열이 다르다.
- **점수는 항상 50 고정**(난이도·성과 개념 없음). EXP는 공통 공식으로 계산된다.
- QT는 **캠페인·데일리 퀘스트·업적 어디에도 들어 있지 않다**(`CAMPAIGN_CHAPTERS`·`QUEST_POOL` 에 `qt` 없음, 업적 사전에도 QT 전용 항목 없음).

### 2.3 마음게임과 규칙이 같은 항목 (위임)
- **해금 정책**(전 게임 Lv.1·검사 조건 없음, `unlocked_games` 컬럼은 레거시) → 마음게임 설계서 §2.2 와 동일. CTS도 `unlockLevel:1`·`requiredTests:[]`·`unlockedGames = ALL_GAME_IDS` 로 확인.
- **레벨·EXP·스트릭·복구권** → 마음게임 설계서 §2.3 과 동일(`LEVEL_TABLE` 6단계, EXP `floor(score×0.5)+min(floor(sec/10),20)+10`, KST 판정, 마일스톤 7·14·21·30·60·90).
- **정원 시각 상태 = PHQ-9 함수**(`foggy`/`clearing`/`blooming`) → 마음게임 설계서 §2.4 와 동일.
- **위기 감지 2중 방어 + NFC 정규화** → 마음게임 설계서 §2.5 와 동일. CTS도 `CRISIS_PATTERNS` 1차 + 시스템 프롬프트 `[SAFETY]` 2차, 안내 리소스 `109`·`1577-0199`·`1388`, 위기 화면에서 게임 요소 미노출까지 그대로 있다(커밋 `0b7ae6b` 로 이식).
  - 차이: 생각 변환 모델이 **haiku 단일**이다(마음게임은 `sonnet-4-6` → haiku 폴백 + prompt caching). 안전 장치 자체는 동등.
- **다국어 `t(ko,en)`** → 마음게임 설계서 §2.6 과 동일. ⚠️ 단, **SSO 인라인 스크립트가 `lang` 파라미터를 보존하지 않는다**(§15-9).

### 2.4 마음풀 전용 기능 = 의도적 미포팅
`../cts-maum-main/CLAUDE.md` §6 및 `HANDOVER.md` §5 가 명시한다. CTS 게임에는 아래가 **없다**.
- 검사→게임 처방(마음풀 리포트 §다음 단계) · **게임→검사 역루프**(`GET /api/game/test-suggestion`) · **루프 계측**(`POST /api/game/loop-event`, `loop_events` 테이블) · 마음커플 "우리의 정원" 연동 · **주간 메일 마음풀 CTA**(`buildMaumfulCta`) · **상담 연결 팝업**(`handleGameExit` 의 counseling prompt) · 허브 `TestSuggestionCard`.
- 코드 근거: `src/index.tsx` 라우트 **25개**(마음게임 27개에서 위 2개가 빠짐), `game_engine.jsx` 에 `getTestSuggestion`·`logLoopEvent` 없음, `game_hub.jsx` 에 `TestSuggestionCard`·`counselingPrompt` 없음.

---

## 3. 사용자 플로우
- **시나리오 1 (CTS 본체 → 게임)**: CTS 본체가 `GET /api/game-token` 으로 JWT 발급(→ `../cts-maum-main/docs/DESIGN.md` §13) → `lightoflife-game.limyj007.workers.dev/?t=<JWT>[&game=<key>]` 오픈 → 인라인 스크립트가 `localStorage.game_token` 저장 후 `history.replaceState` 로 `t` 제거 → 허브 로드 → 딥링크 지정 시 해당 게임 자동 실행 → 플레이 → `POST /api/game/session` → EXP·레벨·스트릭·업적 반영.
- **시나리오 2 (QT 습관 루프)**: 허브 → QT 체크인 → 말씀·묵상·기도제목 입력 → `localStorage` 저장 + 세션 기록 → 완료 화면(연속 3일 이상이면 스트릭 배지) → QT 달력에서 이번 달 점등 확인.
- **시나리오 3 (주간 메일)**: **현재 미가동.** cron이 `wrangler.toml` 에서 주석 처리되어 있다(§12). 활성화 시 마음게임과 동일 흐름 + CTS 자체 발신 주소·CTA·수신거부로 동작한다.
- **역루프(게임 → 검사 제안)·상담 팝업은 없다** (§2.4).
- **화면 구성 (파일 단위)**: → 마음게임 설계서 §3 과 동일. 차이는 ① 스크립트 12개 로드(games 9종) ② 허브 렌더 순서에서 `TestSuggestionCard` 제거 ③ `GameHistorySection` 이 CTS 쪽이 별도 위치에 정의되고 `qt` 메타를 포함.

---

## 4. 기능 명세
> 마음게임과 동일한 기능은 `→ 동일` 로 줄이고 **차이만** 적는다. 공통 항목의 상세는 마음게임 설계서 §4.

| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 게임 9종 | 마음게임 8종(재작명) + `qt` | 배포됨 | `public/static/games/*.jsx` + `game_registry.jsx` |
| 2 | **QT 체크인** | 성경 책·장·절 + 묵상 + 기도제목 기록, 30일 달력, 자체 연속일. 본문은 `localStorage`, 서버엔 메타만 | 배포됨 | `public/static/games/qt.jsx` |
| 3 | 세션 기록·EXP·레벨·스트릭 | → 동일 | 배포됨 | `POST /api/game/session` |
| 4 | 업적 16종 | → 동일. **QT 전용 업적 없음**, `all_games` 조건은 9종인데 여전히 `uniqueGames >= 5` | 배포됨 | `src/index.tsx` |
| 5 | 스트릭 복구권 | → 동일 | 배포됨 | `POST /api/game/streak/recover` |
| 6 | 스토리 캠페인 3챕터 | → 동일(30·50·80cr). **QT는 스텝에 없음** | 배포됨 | `/api/game/campaign*` |
| 7 | 데일리 퀘스트 | → 동일. **`QUEST_POOL` 9항목에 `qt` 없음** | 배포됨 | `game_hub.jsx` |
| 8 | CBT 생각 변환(AI) | 위기 2중 방어 → 동일. **모델은 haiku 단일**(마음게임은 sonnet 우선·폴백) | 배포됨 | `POST /api/game/ai-transform` |
| 9 | 데일리 팁 / 세션 피드백 / AI 일기 / 주간 감정 리포트 | → 모두 동일(haiku, 캐시 정책 동일) | 배포됨 | `/api/game/daily-tip`·`session-feedback`·`ai-diary`·`emotion-report` |
| 10 | 주간 리포트 메일 | 코드 완비. 발신자 `RESEND_FROM_EMAIL` 또는 `예수님마음 게임 <noreply@lightoflife.limyj007.workers.dev>`, 푸터 `예수님마음 · jesusmaum.com`, CTA는 `SERVICE_URL ?? CTS_GAME_URL`. **마음풀 CTA 블록 제거됨** | **구현·미배포**(cron 비활성) | `handleScheduled` + `sendWeeklySummaryEmail` |
| 11 | 수신거부(opt-out) | HMAC 서명 링크 → 동일. **서명 시크릿을 KV 우선으로 읽는다**(마음게임은 `env.JWT_SECRET \|\| ''`) | 배포됨 | `GET /unsubscribe` + `ctsSignUnsub` |
| 12 | 게임→검사 역제안 / 루프 계측 / 상담 팝업 | **미포팅** (§2.4) | 해당 없음 | — |
| 13 | 자가 입력 검사 점수 | → 동일 | 배포됨 | `POST /api/game/scores` |
| 14 | 리더보드 | → 동일 (⚠️ §15-1) | 배포됨 | `GET /api/game/leaderboard` |
| 15 | 통계·이력·번아웃 추이 | → 동일. `HISTORY_GAME_META` 에 `qt` 포함 | 배포됨 | `/api/game/stats`·`/sessions`·`/burnout-history` |
| 16 | 크레딧 차감 | → 동일(전 게임 `creditCost: 0` 이라 미가동) | 구현·미사용 | `POST /api/game/spend-credit` |
| 17 | AI egress 프록시 | `AI_PROXY_URL` 설정 시 경유, 미설정 시 **마음풀 AI Gateway** 폴백 | 배포됨 | `aiEndpoint()` |
| 18 | PWA | **의도적으로 비활성.** `manifest.json` 의 `icons: []`, `sw.js` 는 기존 SW 해제 전용, HTML이 `serviceWorker.getRegistrations().unregister()` 실행 | 보류 | `public/manifest.json`·`public/sw.js`·`src/index.tsx` |
| 19 | favicon | 마음풀 워커 프록시를 제거하고 **204 No Content** 반환(자산 의존 분리, 커밋 `4a0e2dc`) | 배포됨 | `GET /favicon.ico`·`/favicon.png` |

---

## 5. 아키텍처
- **스택**: → 마음게임 설계서 §5 와 동일 (Hono.js/TypeScript on Cloudflare Workers + D1 + KV + React 18 UMD(unpkg) + esbuild 사전 컴파일 JSX + Anthropic Claude).
- **워커명 / 도메인**: `lightoflife-game` → **`lightoflife-game.limyj007.workers.dev`** (커스텀 도메인 없음 — `HANDOVER.md` §2).
- **프론트 빌드 방식**: `npm run build:jsx` → `npm run deploy`. 마음게임과 **esbuild 옵션 동일**하며, 진입 파일 목록에 **`public/static/games/qt.jsx` 가 추가**되어 총 12개(engine·registry·hub + games 9)를 트랜스파일한다.
  - `--tsconfig-raw={"compilerOptions":{"jsx":"react"}}` 필수, `--bundle=false` 로 전역 스코프 공유, `game_engine.js` 최우선 로드, SSO 인라인 스크립트가 컴파일 스크립트보다 먼저 실행 — 전부 → 마음게임 설계서 §5 와 동일.
  - ⚠️ **SSO 인라인 변수명은 `t` 금지**: `game_engine.js` 의 i18n 전역 `const t` 와 충돌해 게임 전체가 깨진 사고가 있었다(커밋 `a2cfdaa`, 현재 `tok` 로 리네임). 코드 주석에 규칙으로 남아 있다.
- **외부 API**: Anthropic Claude(마음풀 AI Gateway 경유 또는 `AI_PROXY_URL`), Resend(메일, 현재 미가동), unpkg CDN, Google Fonts. **마음풀 워커 favicon 프록시 의존은 제거됨.**
- **구성도**
```
  CTS 본체(jesusmaum.com / Worker lightoflife)      CTS 게임(lightoflife-game.…workers.dev)
  ┌──────────────────────────────┐   ?t=JWT&game=   ┌────────────────────────────┐
  │ GET /api/game-token          │ ──────────────▶ │ HTML 셸 → localStorage      │
  │ 랜딩·앱의 '치유 게임' 진입    │                  │ game_token → 허브 → 게임 9종 │
  └──────────────┬───────────────┘                  └─────────────┬──────────────┘
                 │                                                 │
                 └────── 공유 D1 `lightoflife-db` + KV 75bddd6d… ───┘
                    users · test_history · credit_transactions
                    + 게임 전용 8테이블 (migrations 0001~0006)
                                    │
                   Cron 주간 메일 → ⛔ wrangler.toml 에서 주석 = 비활성
```
- **마음풀 인프라와의 관계**: D1·KV·소셜로그인 앱·도메인은 마음풀과 **완전 분리**. 다만 **Cloudflare 계정(`limyj007@gmail.com`)·Anthropic 키·AI Gateway(`/maumful/anthropic`)는 아직 공유 중**이다(`HANDOVER.md` §4).

## 6. 데이터 모델 (D1)
> **DB는 CTS 본체와 같은 `lightoflife-db`(id `662b3fb9-e46d-4b0e-abfd-2380a9e70fe9`) 를 바인딩**한다. KV(`75bddd6d…`)도 본체와 공유한다. **마음풀 `maumful-db` 와는 완전히 별개**다.

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `user_game_status` | 정원 진행 상태 | → 마음게임 설계서 §6 과 동일 | 0001 + 0004 |
| `game_session_logs` | 매 플레이 기록 | → 동일 | 0001 |
| `game_achievements` | 업적 | → 동일 | 0001 |
| `game_ai_cache` | AI 결과 캐시 | → 동일 | 0001 |
| `weekly_reports` | 번아웃 주간 리포트 | → 동일 | 0002. cron 비활성이라 **현재 신규 행이 쌓이지 않는다** |
| `user_test_scores` | 자가 입력 검사 점수 | → 동일 | 0003 |
| `game_campaign_progress` | 캠페인 보상 이력 | → 동일 | 0005 |
| `game_email_prefs` | 주간 메일 수신거부 | → 동일 | 0006. 주석만 "CTS 본체 소유" 로 수정 |

- **마이그레이션 파일 수**: 6개(`0001`~`0006`). **0001~0005 는 마음게임과 바이트 단위로 동일**하고, `0006` 만 주석 2줄이 다르다.
- **다른 서비스와 공유하는 테이블**(CTS 본체 소유, 게임이 읽기/쓰기)
  - `users` — 읽기(`id·email·nickname·credits·locale`), **쓰기**(캠페인 보상 크레딧 가산, 게임 크레딧 차감).
  - `test_history` — 읽기 전용(PHQ9 최근 수행일, 수행 검사 목록).
  - `credit_transactions` — 쓰기(`type='spend'`, `reason='game'`).
  - ⚠️ **`loop_events` 는 쓰지 않는다** — 루프 계측이 미포팅이므로(§2.4) CTS 게임은 이 테이블을 참조조차 하지 않는다.
- **원격 적용 상태**: `HANDOVER.md` §2 가 "게임은 **0006까지 적용됨**" 이라고 기록한다. 다만 마음게임과 같은 "원격 D1 마이그레이션 트래킹 부재" 구조이며, **운영 DB 실측은 ⚠️ 미확인**(§15-8).

## 7. API 계약
> 인증 = `Authorization: Bearer <JWT>` 또는 `?t=<JWT>`(CTS 본체와 공유하는 시크릿으로 HMAC-SHA256 검증). **총 25 라우트** — 마음게임 27개에서 `POST /api/game/loop-event`·`GET /api/game/test-suggestion` 2개가 빠진 형태다.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/` | 불필요 | HTML 셸(SSO 인라인 스크립트 + SW 해제 + 컴파일 스크립트 12개) |
| GET | `/favicon.ico`, `/favicon.png` | 불필요 | **204 No Content**(마음게임은 마음풀 워커 프록시) |
| GET | `/api/game/me` | 필수 | 유저·게임상태·최근세션·검사목록·업적·자가점수 등. `unlockedGames` 는 항상 9종 |
| GET | `/api/game/stats` | 필수 | 게임별 통계 + 주/월 요약 |
| POST | `/api/game/session` | 필수 | 세션 저장 + EXP·레벨·스트릭·업적 판정 |
| POST | `/api/game/streak/recover` | 필수 | 복구권 소모 |
| GET / POST | `/api/game/campaign` · `/campaign/claim` | 필수 | 캠페인 진행·보상 |
| PATCH | `/api/game/visual` | 필수 | PHQ-9 → 정원 시각 상태 |
| POST | `/api/game/ai-transform` | 필수 | CBT 생각 변환(위기 2중 방어, haiku) |
| GET | `/api/game/leaderboard` | **없음** | EXP 상위 20명 (⚠️ §15-1) |
| POST | `/api/game/spend-credit` | 필수 | 크레딧 차감(현재 미가동) |
| GET | `/api/game/credits` | 필수 | 잔액 |
| POST | `/api/game/scores` | 필수 | 자가 입력 점수 upsert |
| POST | `/api/game/daily-tip` | 필수 | AI 코치 메시지 |
| GET | `/api/game/mood-history?days=` | 필수 | 감정 기록 |
| GET | `/api/game/burnout-history` | 필수 | 번아웃 최근 10회 |
| POST | `/api/recovery/missions` | **없음** | 점수 기반 미션 키(프론트 미사용) |
| GET | `/api/recovery/weekly-report/:userId` | **없음** | 최신 주간 리포트 (⚠️ §15-2) |
| GET | `/api/game/emotion-report` | 필수 | 7일 감정 AI 분석 |
| GET | `/api/game/sessions?limit=` | 필수 | 최근 세션 |
| POST | `/api/game/session-feedback` | 선택 | 완료 격려 메시지 |
| GET | `/api/game/ai-diary` | 필수 | 오늘의 AI 마음 일기 |
| GET | `/unsubscribe?u=&s=` | HMAC 서명 | 주간 메일 수신거부(HTML). **"마음게임으로 돌아가기" 버튼 제거됨** |
| ~~POST~~ | ~~`/api/game/loop-event`~~ | — | **CTS에 없음** |
| ~~GET~~ | ~~`/api/game/test-suggestion`~~ | — | **CTS에 없음** |

## 8. 인증 / 세션
→ 마음게임 설계서 §8 과 구조 동일. 차이는 **발급처가 마음풀이 아니라 CTS 본체(`lightoflife`)** 라는 점뿐이다.
- **시크릿 조회 순서**: `KV.get('JWT_SECRET')` → `env.JWT_SECRET` → `'dev_secret_change_in_production'`(하드코딩 폴백). CTS 본체와 **반드시 동일**해야 한다.
  - ⚠️ `../cts-maum-main/CLAUDE.md` §6 · `HANDOVER.md` §3 원문: *"**`JWT_SECRET`은 KV에 저장된 값이 우선**이고 env는 폴백이다. 서명·검증 코드를 건드릴 땐 반드시 KV 값을 먼저 읽어야 한다. env만 읽으면 **빈 키로 서명돼 위조가 가능해진다.**"*
  - 이 규칙이 CTS에서는 **수신거부 서명에도 적용**되어 있다(`ctsSignUnsub`). 마음게임 쪽 `signUnsub` 는 아직 `env.JWT_SECRET || ''` 만 읽는다 — **CTS가 더 안전한 드문 사례**.
- **마스터 계정**: `MASTER_EMAILS = ['limyj007@gmail.com']` (→ 동일). 검사 목록은 CTS의 8종(`PHQ9·GAD7·DASS21·BIG5·LOST·SCT·DSI·BURNOUT`)으로 응답한다.
- **SSO 연동**: CTS 본체 `GET /api/game-token` → `?t=` 전달. `MAUM_SSO_SECRET` 은 쓰지 않는다.

## 9. 외부 연동
| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic Claude | 생각 변환·데일리 팁·세션 피드백·감정 리포트·AI 일기 (**전부 `claude-haiku-4-5-20251001`**) | `ANTHROPIC_API_KEY` | 배포됨. ⚠️ **마음풀과 같은 키 + 마음풀 AI Gateway 경유** — 이관 시 교체 필요(`HANDOVER.md` §3) |
| AI egress 프록시 | 전용 IP 경유. 미설정 시 AI Gateway 폴백 | `AI_PROXY_URL` | 배포됨(운영 설정 여부 ⚠️ 미확인) |
| Resend | 주간 리포트 메일 | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | **미가동**(cron 비활성). 발신 도메인 인증 필요 |
| unpkg CDN / Google Fonts | React 18 UMD · Noto Sans/Serif KR | — | 배포됨 |
| `SERVICE_URL` | 주간 메일 CTA·수신거부 링크 베이스. 미설정 시 `CTS_GAME_URL` 상수 폴백 | — | **실사용**(마음게임에서는 미사용 바인딩) |
| `MAUMFUL_URL` | 타입에만 선언, 코드 사용처 없음 | — | 미사용(제거 대상) |
| ~~마음풀 워커 favicon~~ | 제거됨(204 반환) | — | — |

## 10. 과금 / 수익 모델
- **과금 구조**: 게임 자체는 **전 종목 무료**(`creditCost: 0`). 게임 단독 매출 없음. 역할은 CTS 본체(검사·AI 해석·상품)로의 유입·리텐션.
- **상품·가격 / 결제 수단**: 해당 없음(게임에 판매 상품·결제 엔드포인트 없음). CTS 본체는 **단품제(하이브리드)·영리 유료**이며 `PAYMENT_LIVE = false` 상태 — 상세는 `../cts-maum-main/docs/DESIGN.md` §10.
- **크레딧·구독 처리**: → 마음게임 설계서 §10 과 동일. 캠페인 3챕터 보상으로 `users.credits` 에 최대 **160cr**(30+50+80) 무상 지급, 차감은 `WHERE credits >= ?` 원자적 처리 + `credit_transactions(type='spend', reason='game')` 원장 기록. `type` 은 `CHECK(type IN ('gain','spend'))` 제약을 받는다.

## 11. 안전 · 윤리 · 법적 제약
1. **위기 신호 = 변환 금지·긴급자원 안내** — `../cts-maum-main/CLAUDE.md` §6 원문:
   > "⚠️ **위기 감지**(CBT 생각변환): 키워드 1차 + 모델 `[SAFETY]` 2차. 입력은 반드시 `normalize('NFC')` 후 판정(자모분리 NFD가 완성형 정규식을 우회함)."
   - 위기 화면에서는 게임 요소(나무·점수·다음 단계)를 **일절 노출하지 않는다**(`garden.jsx` 주석). 안내 리소스: 자살예방 109 · 정신건강 위기상담 1577-0199 · 청소년 1388.
2. **수신거부 = 법정 필수**(정보통신망법). `game_email_prefs.optout` + `GET /unsubscribe`. `../cts-maum-main/CLAUDE.md` §6 원문:
   > "**주간 리포트 cron은 비활성**(`wrangler.toml`에서 주석 — 무료 플랜 cron 5개 제한). 활성화 시 수신거부(`game_email_prefs` + `GET /unsubscribe`)가 함께 동작한다."
   - cron은 `is_email_verified = 1` 이면서 `optout = 0` 인 사용자에게만 발송한다.
3. **임상 표현 완화**(마음풀·CTS 동일 정책, `../maumful-main/CLAUDE.md`): 진단·치료·처방 어법 금지, "~기반" 대신 "~원리에서 착안". AI 피드백 프롬프트에도 "비임상적 언어·진단명 금지"가 명시돼 있다.
   - **유지(변경 금지)**: 면책문구("의료적 진단·치료 대체 안 함") · AI 프롬프트 진단금지 지침 · 검사 문항 원문의 `증상` · 심각도 레벨 표기.
4. **기독교 트랙 성경 정확성**(마음풀·CTS 공통 규칙, `../maumful-main/CLAUDE.md`): 게임 카피에 인용된 성경 구절(빌 4:9 · 벧전 5:7 · 시 1:2 · 시 12:6)은 **출처·본문이 정확해야** 한다.
5. **발신 도메인 분리**: 주간 메일 발신자에 **마음풀 도메인(`noreply@maumful.com`) 사용 금지** — 코드 주석에 규칙으로 명시(커밋 `4a0e2dc` 로 분리 완료).
6. **프라이버시**: 자유 서술(CBT 원문·걱정 문장·감사 답변·감정 메모)이 `game_session_logs.metadata` 에 **평문 JSON**으로 남는다(→ 마음게임 설계서 §11-6 과 동일). **예외적으로 QT 묵상 본문은 서버에 저장되지 않는다**(§2.2). 보존기간·삭제 정책 **⚠️ 미확인**.

## 12. 운영
- **배포 절차** (`HANDOVER.md` §6)
  ```bash
  cd cts-game-main
  npm run build:jsx                       # 컴파일 산출물은 레포에 커밋(Cloudflare 빌드 스텝 없음)
  npx wrangler deploy --dry-run           # 배포 전 에러 확인
  npx wrangler deploy                     # 포그라운드 필수(백그라운드 시 인증 실패)
  # 원격 마이그레이션
  npx wrangler d1 execute lightoflife-db --remote --file=migrations/0006_email_prefs.sql
  ```
  - ⚠️ **`npm run build:jsx` 를 빼먹으면 반영되지 않는다** — 실제 서빙되는 것은 `public/static/compiled/*.js` 다.
  - 커밋 접두사 **`[cts]`** 또는 **`[cts-game]`**, 서비스 간 변경 혼합 금지(루트 `CLAUDE.md`). push 실패 시 `gh auth status` 로 활성 계정 확인(`youngjun1603` 여야 함).
  - ⚠️ `cts-game-main` 은 submodule이 아니라 **maum 레포 본체에 직접 들어 있다**(§13.1) — `cts-maum-main` 과 달리 포인터 커밋이 필요 없다.
- **Cron / 스케줄**: **⛔ 비활성.** `wrangler.toml` 의 `[triggers] crons = ["0 3 * * 1"]` 이 주석 처리되어 있다(사유: Cloudflare 무료 플랜 cron 5개 제한). `handleScheduled` 코드는 집계 수정·수신거부까지 모두 반영된 상태로 살아 있어, **주석만 풀면 그대로 돈다**(`HANDOVER.md` §5).
- **모니터링·에러로그**: `console.warn/error` → Cloudflare Workers 로그. 별도 APM·알림 없음(도입 여부 ⚠️ 미확인).
- **롤백**: ⚠️ 미확인 — 문서·스크립트에 절차 정의 없음.

## 13. 서비스 간 의존관계
| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| **CTS 본체(`lightoflife` / `cts-maum-main`)** | **D1 `lightoflife-db` · KV `75bddd6d…` · `JWT_SECRET` 공유.** `users`·`test_history` 읽기, `users.credits`·`credit_transactions` 쓰기. 본체 `GET /api/game-token` 이 `?t=` 발급 → 게임 진입 | 게임 ↔ 본체 (강결합) |
| **CTS 본체** | 규칙 상속: 코드 규칙 단일 출처가 `cts-maum-main/CLAUDE.md` §6 (+ 공통은 `maumful-main/CLAUDE.md`). 이 폴더에는 자체 `CLAUDE.md` 가 **없다** | ← (규칙만) |
| 마음게임(`maumgame`) | **트윈 원본.** 소스가 사실상 같고 CTS는 버그·안전 수정만 역이식한다. 마음게임 신규 기능은 **자동 동기화하지 않는다** | 트윈 |
| 마음풀(`maumful`) | **데이터 의존 없음**(DB 완전 분리). 다만 **Cloudflare 계정·Anthropic 키·AI Gateway 공유 중** — 분리 필요 | ❌ 잔존 결합 |
| Resend / Anthropic | 메일(미가동) · AI 생성 | 게임 → 외부 |

### ⚠️ 13.1 레포 구조의 함정 — 이관 시 이 폴더가 통째로 빠진다
> 루트 `CLAUDE.md` 원문: *"⚠️ **CTS 전달 시 누락 주의**: CTS는 워커 2개(`lightoflife` + `lightoflife-game`)인데 **본체는 별도 레포(`lightoflife-cts`), 게임은 이 레포 안**에 있다. `lightoflife-cts`만 넘기면 **CTS 게임이 통째로 빠진다** → `cts-game-main/` 폴더를 함께 export할 것."*

| 구성 | 폴더 | 워커 | 깃 위치 |
|---|---|---|---|
| CTS 본체 | `cts-maum-main/` | `lightoflife` | **별도 레포** `github.com/youngjun1603/lightoflife-cts` (submodule, `.gitmodules` 없음) |
| **CTS 게임 (이 문서)** | `cts-game-main/` | `lightoflife-game` | ⚠️ **마음풀 레포(`maum-developserver`) 안** |

- `README_HANDOVER.md` 가 이 폴더 안에서도 같은 경고를 한다(2026-07-12 추가, 커밋 `4a0e2dc`).
- 정리 선택지(**미결정**): **A안** `cts-game-main` 을 `lightoflife-cts` 안으로 이동(권장) / **B안** `lightoflife-game` 레포 신설 / **C안** 현행 유지 + 매번 수동 export(누락 위험 상존).
- 이관 체크리스트·시크릿 분류의 단일 출처는 **`../cts-maum-main/HANDOVER.md`** 이며, 요약은 `../cts-maum-main/docs/DESIGN.md` §13.2·§13.3 에 있다.

## 14. 현황 및 백로그

### ⚠️ 가장 먼저 볼 규칙 — CTS는 유지보수 모드
> **"⚠️ CTS는 유지보수 모드 — 에러·버그 수정만, 신규 기능 금지(사용자 확정 2026-07-18). CTS(`cts-maum-main`·`cts-game-main`)에는 버그·에러 수정만 반영한다. 신규 기능(마음풀에 새로 넣은 것 포함)은 포팅하지 않는다. 계획이 바뀌면 사용자가 다시 알려준다."** — 루트 `CLAUDE.md` 원문
>
> **"즉 마음풀 고유 서비스(마음 시리즈 수달·곁·부부·세대 + 커플)는 물론, 마음풀 본체의 신규 기능도 CTS로 자동 동기화하지 않는다. 트윈 동기화는 이제 사실상 버그·안전 수정에 한정."** — 루트 `CLAUDE.md` 원문
>
> 전 서비스 백로그의 **금지** 항목에도 *"CTS 개발(명시적 재개 시에만)"* 이 올라 있다. → 상세는 외부 메모리 **`project_cts_payment_nonprofit`**·**`project_maum_backlog`** 참조 — 문서화 필요.

- **라이브 상태**: `lightoflife-game.limyj007.workers.dev` 배포 중. 게임 9종 전부 무료·전면 해금, 한/영 문자열 번역 완료, 위기 감지 2중 방어·수신거부 페이지 가동. 최근 변경은 AI egress 프록시 지원(2026-08-29, 커밋 `06780be`).
- **미착수 / 대기**
  - **주간 리포트 메일 cron 활성화** — 유료 플랜 전환이 선행 조건(`wrangler.toml` 주석 해제만 하면 됨). 발송 코드·수신거부는 이미 완비.
  - **Cloudflare 계정 / Anthropic 키 / AI Gateway 분리** — `HANDOVER.md` §4 의 미해결 항목.
  - **레포 구조 정리(A/B/C안)** — 미결정(§13.1).
  - PWA — 의도적으로 해제한 상태(§4-18). 되살릴 계획은 문서에 없음.
- **금지 사항**
  - **신규 기능 포팅 금지** — 버그·안전 수정만(2026-07-18 사용자 확정). 마음게임에 새로 들어간 역루프·루프 계측·상담 팝업·sonnet 모델 상향 등을 **가져오지 말 것.**
  - **주간 메일 발신에 마음풀 도메인(`noreply@maumful.com`) 사용 금지** — 코드 주석 규칙.
  - 해금 게이팅을 되살릴 땐 `game_registry.jsx` + 서버 `ALL_GAME_IDS` **동시** 수정 필수(이중 관리).
  - 서명·검증 코드는 **KV의 `JWT_SECRET` 을 먼저** 읽을 것(§8).
  - 전 서비스 상세 백로그는 **외부 메모리 `project_maum_backlog` 한 곳**에 모여 있다 — **상세는 외부 메모리 `project_maum_backlog` 참조 — 문서화 필요.**

## 15. 알려진 리스크 · 기술부채

> ### 15.0 마음게임에서 발견된 결함의 CTS 복제 여부 (이 문서의 핵심)
> | # | 마음게임 결함 | CTS 복제? | 비고 |
> |---|---|---|---|
> | 1 | `GET /api/game/leaderboard` 무인증 + 응답에 `u.email` | ✅ **그대로 복제** | 쿼리·응답 동일. `lightoflife-db` 의 CTS 사용자 이메일이 노출된다 |
> | 2 | `GET /api/recovery/weekly-report/:userId` 무인증 IDOR | ✅ **그대로 복제** | 코드 동일. 단 cron 비활성 → `weekly_reports` 가 사실상 비어 있어 **현재 유출량은 0에 가깝다**(기본값 `avgEnergy:68` 반환) |
> | 3 | 번아웃 metadata 키 불일치 | ✅ **그대로 복제** | `burnout.jsx` 는 `{missions_completed, energy_gained, …}` 저장, `handleScheduled` 는 `meta.completedMissions`·`meta.energy` 조회. **cron 비활성이라 현재는 무증상이지만, cron을 켜는 순간 `weekly_reports` 가 계속 비는 버그로 즉시 발현한다** |
> | 4 | 감정 강도 기반 상담 팝업 죽은 코드 | ❌ **해당 없음** | 상담 팝업 자체가 미포팅(§2.4). 대신 **고위험 사용자 안내 경로가 전혀 없다**는 별개 이슈가 된다 |
> | 5 | 게임 목록 3중 관리 → 딥링크 화이트리스트 누락 | ✅ **복제 + 이미 발현 중** | §15-5 참조. 마음게임의 `worry` 사고가 CTS에서 `qt` 로 재현돼 있다 |
> | 6 | 자유 서술 평문 축적 | ✅ **복제**(QT만 예외) | §11-6 |
> | 7 | `JWT_SECRET` 하드코딩 폴백 | ✅ **복제** | 단 CTS는 KV 우선 + 수신거부 서명까지 KV를 읽어 **마음게임보다 한 단계 안전**(§8) |
> | 8 | 원격 D1 마이그레이션 트래킹 부재 | ✅ **복제** | `HANDOVER.md` 는 0006까지 적용됐다고 기록. 실측 ⚠️ 미확인 |
> | 9 | `game_hub.jsx` 거대 단일 파일 | ✅ **복제** | CTS 2,688줄. 렌더 스모크 검증 도구 없음 |
> | 10 | PWA 반쪽 구현(아이콘 404) | ❌ **해결됨** | CTS는 `icons: []` + SW 해제로 **의도적으로 제거**해 아이콘 404가 없다 |
> | 11 | `README.md` 노후 | ⚠️ **더 나쁨** | §15-11 |

1. **`GET /api/game/leaderboard` 가 무인증이며 응답에 `u.email` 이 포함된다.** 상위 20명의 이메일이 누구에게나 노출된다. 마음게임과 **완전히 같은 코드**이므로, 마음게임을 고칠 때 이 파일도 함께 고쳐야 한다(안전 수정 = 유지보수 모드에서 허용).
2. **`GET /api/recovery/weekly-report/:userId` 가 무인증 IDOR.** 경로의 userId를 그대로 조회한다. cron 비활성 덕에 현재 테이블이 비어 실질 피해는 작지만, **cron을 켜는 순간 실데이터 IDOR가 된다** — cron 활성화 작업의 선행 조건으로 묶어 둘 것.
3. **번아웃 주간 집계 키 불일치가 그대로 남아 있다**(위 표 #3). cron 활성화 전에 반드시 함께 고쳐야 하는 항목.
4. **고위험 사용자 안내 경로가 없다.** 마음게임은 게임 종료 시 BURNOUT≥60 / PHQ-9≥10 에서 상담 연결 팝업을 띄우지만 CTS 게임에는 그 코드가 없다. 위기 감지(CBT 생각 변환)는 살아 있으나, **점수 기반 선제 안내는 CTS 본체 쪽에만 존재**한다. 안전 성격의 갭이므로 유지보수 모드에서도 검토 대상.
5. **딥링크 화이트리스트에 `qt` 가 빠져 있다 — 현재 발현 중인 버그.** `game_hub.jsx` 의 `const valid = ['garden','efmt','gratitude','tree','burnout','mood','focus','worry']` 에 `'qt'` 가 없어, `?game=qt` 딥링크가 **조용히 무시**된다(허브만 열림). 서버 `ALL_GAME_IDS` 와 `GAME_REGISTRY` 에는 `qt` 가 있으므로 목록·직접 클릭은 정상 동작한다. 마음게임에서 `worry` 로 똑같이 났던 사고의 재현이다. **한 줄 수정.**
6. **`PHYWEB_URL` 이 `https://maumful.com` 으로 하드코딩돼 있다 — 마음풀 잔재.** `game_engine.jsx` 의 `PHYWEB_URL`(별칭 `MAUMFUL_URL`)이 마음풀 도메인을 반환하는데, `game_hub.jsx` 는 이 값을 **LoginGate 로그인 버튼·"The Light of Life으로 돌아가기"·검사하기 링크 등 5곳**의 `href` 로 쓴다. → **버튼 문구는 "The Light of Life" 인데 실제로는 마음풀로 이동한다.** 로그인하지 못한 CTS 사용자가 마음풀로 보내지는 구조. 2026-07-12 자산 분리(커밋 `4a0e2dc`)에서 **누락된 지점**으로 보인다.
7. **HTML·매니페스트 메타가 여전히 마음풀이다.** `src/index.tsx` 의 `<title>마음의 정원 — 마음풀</title>`·`<meta name="description">` 과 `public/manifest.json` 의 `name:"마음의 정원"`·`short_name:"마음게임"`·`theme_color:"#4A7C59"`(세이지 그린)가 그대로다. OG 태그·`theme-color` 메타·앱 타이틀만 CTS로 바뀌어 있어 **부분 분리 상태**다.
8. **원격 D1 마이그레이션 트래킹 부재**(마음게임과 동일 구조). 코드가 스키마 에러를 빈 `catch` 로 삼키는 곳이 다수라 실패가 드러나지 않는다. `HANDOVER.md` 는 0006까지 적용됐다고 기록하나 **운영 DB 실측 ⚠️ 미확인**.
9. **SSO 인라인 스크립트가 `lang` 파라미터를 보존하지 않는다.** CTS는 `?t=` 처리 후 `'/?game=' + gameParam` 만 복원하고 `lang` 을 버린다(마음게임은 `game`·`lang` 둘 다 `URLSearchParams` 로 복원). `GAME_LANG` 은 URL의 `lang` 에서만 읽으므로, **`?t=…&lang=en` 으로 진입한 영어 사용자가 한국어 화면을 보게 된다.** CTS 본체가 실제로 `lang` 을 붙여 여는지는 ⚠️ 미확인.
10. **허브의 "연동 검사" 배지가 절대 뜨지 않는다.** `game_hub.jsx` 가 `game.requiredTests` 를 배지 근거로 쓰는데 해금 폐지로 **전 게임 `requiredTests: []`** 다. 마음게임은 같은 자리를 `linkedTests` 로 바꿨지만(2026-07 수정) CTS에는 미반영. 결과적으로 `linkedTests`(PHQ9·GAD7·DSI·BURNOUT) 표시가 UI에서 죽어 있다.
11. **문서가 서로 어긋난다.** `README.md`(2026-04-30)는 마음게임 구버전 그대로다 — 제목 `maumgame`, 게임 **4종**만 기재(실제 9종), 레벨 게이팅 표기(실제 전 게임 Lv.1), `maumgame.pages.dev`·`maumful.pages.dev` 도메인, "React 18 (Babel JSX)"(실제 esbuild), 시크릿 `PHYWEB_URL`, 관련 레포 표에 CTS 언급 없음. **CTS 소속이라는 사실은 별도 파일 `README_HANDOVER.md` 에만 있다.** 신규 작업자를 오도할 위험이 마음게임보다 크다.
12. **게임 이름이 파일 간 불일치한다.** `game_registry.jsx` 는 `mood` 를 **감사 제단**, `gratitude` 를 **감사 별자리**, `tree` 를 **믿음의 나무**로 부르는데, `game_hub.jsx` 의 `HISTORY_GAME_META`·`GAME_META`·데일리 퀘스트 문구는 여전히 **감정 수채화·감사 일기·마음 나무/내면의 나무**를 쓴다. `mood` 데일리 퀘스트는 한국어 "감정 수채화" / 영어 "Altar of Thanks" 로 **한 줄 안에서** 엇갈린다.
13. **QT 기록이 브라우저에만 남는다.** `localStorage.lol_qt_history` 가 유일한 저장소라 기기 변경·시크릿 모드·캐시 삭제 시 QT 달력·연속일이 전부 사라진다. 서버에는 `book`·`chapter`·`has_prayer` 만 남아 복구 불가. 프라이버시에는 유리하지만 **데이터 내구성 관점에서는 이 서비스 고유 게임의 가장 큰 약점**이다.
14. **QT가 보상 시스템에 통합되어 있지 않다.** `CAMPAIGN_CHAPTERS`·`QUEST_POOL`·업적 사전 어디에도 `qt` 가 없고, `all_games` 업적 조건도 9종인데 `uniqueGames >= 5` 그대로다. CTS 고유 게임이 정작 리텐션 장치와 연결돼 있지 않다.
15. **AI 인프라가 마음풀에 묶여 있다.** `aiEndpoint()` 의 기본값이 마음풀 AI Gateway(`/maumful/anthropic`)이고 `ANTHROPIC_API_KEY` 도 공유다. 비용·쿼터가 섞이며, 이관 시 **코드 수정이 필요한 항목**이다(`HANDOVER.md` §3 체크리스트).
16. **`package.json` 의 `name` 이 아직 `maumgame`** 이다(워커명은 `lightoflife-game`). 혼동 소지.
17. **운영 지식 상당 부분이 외부 메모리에만 있다**: `project_cts_payment_nonprofit`(CTS 유지보수 모드 결정 경위)·`project_maum_backlog`(백로그)·`feedback_search_whole_codebase` 등. **레포만으로 복원 불가 — 문서화 필요.**

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 최초 작성(마음게임 트윈 차이점 중심). 근거 커밋 `06780be`. `README.md`·`README_HANDOVER.md`·`../cts-maum-main/CLAUDE.md` §6·`../cts-maum-main/HANDOVER.md`·`../cts-maum-main/docs/DESIGN.md`·루트 `CLAUDE.md`·`../maumful-main/CLAUDE.md`·`wrangler.toml`·`package.json`·`src/index.tsx`(1,417줄, 라우트 25)·`migrations/0001~0006`·`public/static/*.jsx`(engine·registry·hub + games 9종) 및 마음게임 원본과의 전 파일 diff 기준 | Claude |
