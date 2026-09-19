# 마음풀 게임(maumgame) 설계서

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음풀 게임 / 마음의 정원 (maumgame) |
| 폴더 | `maumgame-main/` (Worker `maumgame`, game.maumful.com) |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `a247b8a` (2026-08-29, "[maumgame] AI 호출 전용 egress 프록시 경유 지원 — env AI_PROXY_URL") |
| 근거 소스 | `../maumful-main/CLAUDE.md`(293줄, 이 서비스의 규칙 원본) · `../CLAUDE.md` · `wrangler.toml` · `wrangler.lightoflife.toml` · `package.json` · `README.md` · `src/index.tsx`(1,626줄) · `migrations/0001~0006` · `public/static/{game_engine,game_registry,game_hub}.jsx` · `public/static/games/*.jsx`(8종) |

> **이 서비스 전용 CLAUDE.md는 없다.** 루트 `CLAUDE.md` 라우터가 `maumgame-main/` 작업 시 `maumful-main/CLAUDE.md` 를 읽도록 지정한다. 즉 규칙 원본은 마음풀 본체 문서의 "마음게임 ↔ 마음풀 상호 연결", "마음게임 주간 리포트 메일", "마음게임 번역", "프론트엔드 빌드" 섹션이다.
>
> `README.md`(2026-04-30)는 **구버전**이다: 게임 4종만 기재(실제 8종), `maumgame.pages.dev`·`maumful.pages.dev` 도메인(실제 game.maumful.com), "React 18 (Babel JSX)"(실제 esbuild 사전 컴파일), 시크릿명 `PHYWEB_URL`(코드는 `MAUMFUL_URL`) 등 현행과 불일치. 본 설계서는 코드·`wrangler.toml`·마이그레이션·`maumful-main/CLAUDE.md` 를 1차 근거로 삼는다.

---

## 1. 서비스 개요
- **한 줄 정의**: 마음풀 심리검사 결과와 이어지는 **치유 게임 8종 플랫폼**. 검사가 처방한 실천을 게임으로 수행하고, 게임 기록이 다시 검사를 제안하는 **양방향 루프의 한쪽 축**.
- **해결하는 문제**: 검사·AI 해석은 "내 상태를 아는 것"에서 끝난다. 그 다음의 **일상 실천(호흡·감정 기록·감사·인지 교정·회복 미션)** 을 게임 형식으로 붙여, 검사→실천→재점검의 순환을 만든다.
- **타깃 사용자**: 마음풀 로그인 사용자(한국어·영어). **비로그인은 진입 불가** — 토큰이 없으면 `LoginGate` 화면만 표시된다(`game_hub.jsx`).
- **핵심 가치 제안**
  - 게임 8종 전부 **무료·Lv.1 해금**(`creditCost: 0`, 2026-07 해금 게이팅 폐지).
  - 심리 도구 기반 설계: CBT·ACT·EFMT·긍정심리학·그라운딩 기법을 게임 규칙으로 번역.
  - 검사 점수가 게임에 실제로 반영된다(PHQ-9 → 정원 안개, BURNOUT → 시작 에너지, GAD-7/PHQ-9 → 난이도).
  - 주간 리포트 메일로 재방문을 만들고, 메일 CTA가 마음풀로 되돌린다.
- **생태계 내 위치**: **마음풀 생태계의 위성 서비스**. 별도 Worker(`maumgame`)이지만 **D1 `maumful-db`·KV·`JWT_SECRET` 을 마음풀 본체와 공유**하고 `?t=` 토큰 SSO로 진입한다. 마음 시리즈(수달·곁)와는 다른 생태계다. CTS 트윈 `lightoflife-game` 이 **같은 레포 안 `cts-game-main/`** 에 별도로 존재하며, CTS는 2026-07-18부터 **버그·안전 수정만** 반영한다.

---

## 2. 도메인 규칙 (이 서비스 고유)

### 2.1 게임 8종 = 각각 다른 심리 도구 (혼동 금지)
| ID | 이름 | 심리학적 근거 | 플레이 구조 | `module_type` | 연동 검사(`linkedTests`) |
|---|---|---|---|---|---|
| `mood` | 감정 수채화 🎨 | 감정 알아차림·라벨링 | 하루 1회 감정 6종(행복·평온·피곤·불안·슬픔·화남) × 강도 1~5 + 메모 → 30일 감정 캘린더 | `checkin` | — |
| `garden` | 마음의 정원 🌿 | CBT(인지 재구조화) + 호흡 이완 | ⓐ 숨 쉬는 호수: 박스 4-4-4-4 / 4-7-8 / 빠른 안정 2-1-4, 사이클 3·5·10 선택 ⓑ 생각의 가지치기: 부정 문장 입력 → AI가 수용적 자기확언으로 변환 | `breathing`, `cbt` | PHQ9 |
| `efmt` | 감정꽃 찾기 🌸 | EFMT(Emotional Flower Matching Task) 감정 인지 훈련 | 여러 표정의 꽃 그리드에서 웃는 꽃 탐색, 정확도·반응속도 측정. **PHQ-9 점수로 난이도 자동 조정**. 색상+형태 이중 구분(색약 접근성) | `EFMT` | PHQ9 |
| `gratitude` | 별빛 감사 일기 ⭐ | 긍정심리학(PPT) 감사 개입 | 매일 다른 감사 질문 3개(질문풀 3세트 로테이션)에 답하면 밤하늘에 별 3개 점등 | `RELAX` | — |
| `tree` | 내면의 나무 🌳 | ACT(수용전념) 3단계 + 자아분화 | 뿌리(현재 순간 감각·감정) → 줄기(나의 가치·미래의 나에게) → 가지(오늘의 작은 행동·나에게 줄 선물), 각 2문항 서술 | `ACT` | DSI |
| `burnout` | 번아웃 회복 ⚡ | 행동활성화·그라운딩·회복 루틴 | 시작 에너지 = `100 − BURNOUT점수`. 미션 12종(신체·마음·관계·불안·스트레스·휴식)을 타이머로 수행 → 에너지 충전 → 회복 도시 5단계 성장. **미션 세트가 GAD7≥10 / DASS21≥14 / BURNOUT≥60 으로 분기** | `MISSION` | BURNOUT |
| `focus` | 마음 집중력 🧠 | 작업기억·주의 훈련 | 숫자 기억 + 그리드 패턴 기억 5라운드. **max(PHQ9, GAD7) 값으로 난이도 3단계**(≥15 / ≥8 / 그 외) | `focus_training` | BURNOUT |
| `worry` | 걱정 풍선 🫧 | ACT 인지적 탈융합(defusion) | 지금의 걱정을 입력해 풍선에 담고 하나씩 터뜨려 내려놓기 ("걱정은 생각일 뿐") | `RELAX` | GAD7 |

- **게임 ID 목록은 3곳에 중복 정의**된다: 서버 `ALL_GAME_IDS`(`src/index.tsx`), `GAME_REGISTRY`(`game_registry.jsx`), 딥링크 화이트리스트 `valid`(`game_hub.jsx` GameHubApp). **게임을 추가하면 세 곳 모두 고쳐야 한다** — 화이트리스트 누락 시 딥링크가 조용히 무시된다(실제로 `worry` 가 그랬고 커밋 `ba0414e` 로 수정).
- 게임 설명의 임상 표현은 완화 규칙을 따른다: "수용전념치료(ACT) 기반" → **"수용전념(ACT) 원리에서 착안"**(커밋 `967fc85`).

### 2.2 해금 정책 = 전 게임 Lv.1·검사 조건 없음 (2026-07 변경)
> 이전엔 레벨(최대 Lv.4)+검사 완료를 요구해 **신규 사용자에게 8종 중 3종만 보였고, 마음풀 리포트가 처방한 게임이 정작 잠겨 있었다.**

- 현재 `requiredTests: []`·`unlockLevel: 1`·`GET /api/game/me` 의 `unlockedGames` 는 **항상 전체 목록**. DB 컬럼 `user_game_status.unlocked_games` 는 **레거시**다(값은 계속 써지지만 응답에 쓰이지 않음).
- 레벨·EXP는 **정원 성장·배지·스트릭 표시 용도로만** 쓴다. 검사와의 연결은 잠금이 아니라 `linkedTests`(표시·추천)로만 유지.
- ⚠️ 해금을 다시 걸려면 `game_registry.jsx` 와 서버 `ALL_GAME_IDS` 를 **함께** 고쳐야 한다(이중 관리 지점).

### 2.3 레벨·EXP·스트릭
- 레벨 6단계: 씨앗(0) · 새싹(100) · 꽃봉오리(250) · 꽃피움(500) · 만개(900) · 정원사(1500~). 테이블이 **서버 `LEVEL_TABLE` 과 프론트 `GameEngine.LEVELS` 양쪽에 중복 정의**된다.
- EXP 공식(`POST /api/game/session`): `floor(score×0.5) + min(floor(duration_sec/10), 20) + 10(완료 보너스)`.
- 스트릭은 **KST 기준**으로 판정. 마일스톤 7·14·21·30·60·90일 도달 시 **스트릭 복구권 +1**(최대 3개), 복구권 1개로 `streak_days +1` 복원.

### 2.4 정원 시각 상태 = PHQ-9 점수의 함수
`calcVisualStatus`: `≥15 → foggy`(안개 낀 정원) / `≥5 → clearing`(맑아지는 정원) / `<5 → blooming`(꽃이 피는 정원). **마음풀은 검사 결과를 서버에 저장하지 않는 원칙**이라, 게임은 사용자가 게임 내에서 자가 입력한 점수(`user_test_scores`, migration 0003)를 근거로 삼는다. 0003 주석이 이를 "마음풀 프라이버시 정책 우회"라고 명시한다.

### 2.5 위기 감지는 NFC 정규화 후 판정 (절대 완화 금지)
CBT 생각 변환(`/api/game/ai-transform`)은 사용자가 부정적 생각을 자유 입력하는 통로다. 자해·자살 신호는 "긍정 확언으로 바꿀 생각"이 아니라 즉시 도움이 필요한 신호로 취급한다.
- **1차**: 서버 키워드 정규식 `CRISIS_PATTERNS`(한/영) 사전 차단 — AI 미호출·캐시 미저장.
- **2차**: 시스템 프롬프트의 안전 오버라이드 — 모델이 위기로 판단하면 `[SAFETY]` 한 단어만 출력 → 안전 안내로 대체(캐시 저장 안 함).
- 안내 리소스: 자살예방 109 · 정신건강 위기상담 1577-0199 · 청소년 1388.
- ⚠️ **`text.normalize('NFC')` 필수** — 자모 분리(NFD) 한글은 완성형 정규식에 매칭되지 않아 1차 방어가 통째로 우회된다(E2E로 실제 확인).
- 오탐 방지: "배고파 죽겠다" 류 과장 표현은 제외하고 명시적 표현만 매칭.
- 위기 화면에서는 **게임 요소(경험치·다음 단계)를 일절 노출하지 않는다**(`garden.jsx` 주석).

### 2.6 다국어 = `t(ko, en)` 단일 패턴
`GAME_LANG = URLSearchParams(location.search).get('lang') || 'ko'` (`game_engine.jsx` 전역) → `t(ko,en)`. 마음풀/CTS가 게임 링크에 `?lang=en` 을 붙여 전달하고, 게임 내 EN/한 토글은 `lang` 파라미터만 바꿔 리로드한다(로그인은 `localStorage.game_token` 유지). 번역 대상 파일 11개(engine·registry·hub + games 8종). **번역 완료 상태.**

---

## 3. 사용자 플로우
- **시나리오 1 (검사 → 게임, 정방향 루프)**: 마음풀 리포트 §다음 단계에서 `gamePrescription(testType, score)` 카드 클릭 → `game.maumful.com/?t=<JWT>&game=<key>&lang=` → 인라인 스크립트가 토큰을 `localStorage.game_token` 에 저장하고 URL 정리 → 허브 로드 800ms 후 해당 게임 자동 실행 → 플레이 → `POST /api/game/session` → EXP·레벨·스트릭·업적 반영 → 허브 복귀.
- **시나리오 2 (게임 → 검사, 역루프)**: 게임 플레이 누적 → 허브 상단 `TestSuggestionCard` 가 `GET /api/game/test-suggestion` 호출 → 신호가 뚜렷하면 카드 노출(`suggestion_view` 계측) → 클릭(`suggestion_click` 계측) → `maumful.com/?go=test:<TESTTYPE>` 새 탭 → 검사 완료 시 루프가 닫힌 것으로 집계. 카드를 닫으면 **7일간 같은 검사는 재제안하지 않는다**(localStorage).
- **시나리오 3 (주간 메일 복귀)**: 매주 월 03:00 UTC cron → 지난 7일 활동자에게 리포트 메일 → "오늘도 정원 가꾸러 가기" 또는 마음풀 CTA(`?go=history` / `?go=test:PHQ9`) → 재진입. 하단 수신거부 링크 → `/unsubscribe?u=&s=`.
- **시나리오 4 (고위험 감지 → 상담 안내)**: 게임 종료 시 `handleGameExit` 가 자가 입력 점수를 보고 상담 연결 팝업 표시 — BURNOUT≥60 / PHQ-9≥10(burnout·mood·garden 종료 시) → `maumful.com?go=counseling`.
- **화면 구성 (파일 단위)**
  - `src/index.tsx` → 단일 HTML 셸(SSO 인라인 스크립트 + 컴파일 번들 11개 `<script>` 로드, `?v=` 캐시버스터).
  - `public/static/game_engine.jsx` → 전역 `GAME_LANG`·`t()`·`GameEngine`(API 래퍼·레벨·테마·업적 사전).
  - `public/static/game_registry.jsx` → 게임 8종 매니페스트.
  - `public/static/game_hub.jsx`(138KB) → 허브 전체. 렌더 순서: 정원 히어로(GardenSVG·레벨바·스트릭·AI 팁) → StreakCalendar → TestBadgeRow → **TestSuggestionCard** → BurnoutTrendSection → WeekMoodSummaryCard → AIDiarySection → EmotionWeeklyReport → TodayRecommendCard → DailyQuestCard → 게임 카드 목록 → CampaignSection → GameHistorySection → GameStatsSection → AchievementPanel → RecentActivity → Leaderboard(모달) → OnboardingOverlay.
  - `public/static/games/*.jsx` → 게임 8종 본체(각 21~52KB, 자체 SVG·애니메이션 포함).

---

## 4. 기능 명세
| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 게임 8종 | mood·garden·efmt·gratitude·tree·burnout·focus·worry (§2.1) | 배포됨 | `public/static/games/*.jsx` + `game_registry.jsx` |
| 2 | 세션 기록·EXP·레벨업 | 점수·시간 기반 EXP, 6단계 레벨, KST 스트릭 | 배포됨 | `POST /api/game/session` |
| 3 | 업적 16종 | first_play·streak_3/7/14·perfect_week·level_3/5·exp_500/1000·breath_master·cbt_master·burnout_fighter·mood_7/30·gratitude_7·all_games | 배포됨 | `src/index.tsx` checks + `GameEngine.ACHIEVEMENTS` |
| 4 | 스트릭 복구권 | 마일스톤 도달 시 지급(최대 3), 1개 소모로 연속일 복원 | 배포됨 | `POST /api/game/streak/recover` (migration 0004) |
| 5 | 스토리 캠페인 3챕터 | ch1 첫 발걸음(30cr)·ch2 마음 교정(50cr)·ch3 깊은 성장(80cr). 이전 챕터 선행 + 스텝 3개 완료 시 크레딧 보상 | 배포됨 | `GET/POST /api/game/campaign*` (migration 0005) |
| 6 | 데일리 퀘스트 | 날짜+userId 시드로 매일 3개 배정, 완료 시 보너스 | 배포됨 | `game_hub.jsx` `QUEST_POOL`/`getDailyQuests` |
| 7 | CBT 생각 변환(AI) | 부정 문장 → 자기확언. **sonnet-4-6 우선·haiku 폴백**, 위기 2중 방어 | 배포됨 | `POST /api/game/ai-transform` |
| 8 | 데일리 팁(AI) | 레벨·스트릭·자가 점수 기반 한 문장 코치 메시지(일 1회 캐시, haiku) | 배포됨 | `POST /api/game/daily-tip` |
| 9 | 세션 피드백(AI) | 게임 완료 후 격려 2문장(게임별·일 1회 캐시, haiku). "비임상적 언어·진단명 금지" 프롬프트 | 배포됨 | `POST /api/game/session-feedback` |
| 10 | AI 마음 일기 | 오늘 감정 + 최근 감사 기록 → 1인칭 일기 2~3문장(일 1회, haiku) | 배포됨 | `GET /api/game/ai-diary` |
| 11 | 주간 감정 리포트(AI) | 최근 7일 감정 기록 → 패턴 분석 3문장(주 1회 캐시, 기록 3건 미만이면 미생성) | 배포됨 | `GET /api/game/emotion-report` |
| 12 | 주간 리포트 메일 | cron 월 03:00 UTC, 활동 요약 + 마음풀 CTA + 수신거부. Resend 발송 | 배포됨 | `handleScheduled` + `sendWeeklySummaryEmail` |
| 13 | 수신거부(opt-out) | HMAC 서명 링크, 로그인 불필요, HTML 안내 페이지 | 배포됨 | `GET /unsubscribe` (migration 0006) |
| 14 | 게임→검사 역제안 | 30일 게임 신호로 검사 추천, 최근 30일 수행 검사는 제외, 신호 약하면 `null` | 배포됨 | `GET /api/game/test-suggestion` + `pickTestSuggestion` |
| 15 | 루프 계측 | `suggestion_view`·`suggestion_click` 을 마음풀과 같은 `loop_events` 에 기록(fire-and-forget) | 배포됨 | `POST /api/game/loop-event` |
| 16 | 상담 연결 팝업 | 고위험 감지 시 마음풀 `?go=counseling` 안내 | 배포됨 | `game_hub.jsx` `handleGameExit` |
| 17 | 자가 입력 검사 점수 | PHQ9·BURNOUT·GAD7 등 점수 저장, PHQ9 저장 시 정원 상태 동기화 | 배포됨 | `POST /api/game/scores` (migration 0003) |
| 18 | 리더보드 | EXP 상위 20명(닉네임·레벨·EXP·스트릭) | 배포됨 | `GET /api/game/leaderboard` — ⚠️ §15 참조 |
| 19 | 통계·이력 화면 | 게임별 플레이·베스트·주/월 요약, 최근 세션, 번아웃 추이 | 배포됨 | `/api/game/stats`·`/sessions`·`/burnout-history` |
| 20 | 크레딧 차감 | 원자적 차감 + 10분 내 중복 차감 차단 + `credit_transactions` 원장 기록 | 구현·미사용 | `POST /api/game/spend-credit` (현재 전 게임 `creditCost: 0`) |
| 21 | 번아웃 회복 미션 API | 점수 기반 미션 세트 반환(프론트가 자체 `MISSIONS` 를 쓰므로 사실상 미사용) | 구현·미사용 | `POST /api/recovery/missions` |
| 22 | PWA | `manifest.json` 링크됨. `sw.js`(오프라인 캐시·푸시 알림)는 **등록 코드가 없어 동작하지 않음**(`serviceWorker.register` 전 파일 0건), 아이콘 파일도 부재 | 설계만 | `public/manifest.json`, `public/sw.js` |
| 23 | CTS 트윈 배포 | `wrangler.lightoflife.toml`(워커 `lightoflife-game`, DB `lightoflife-db`) | 배포됨·유지보수 모드 | `wrangler.lightoflife.toml` |

---

## 5. 아키텍처
- **스택**: Hono.js(TypeScript) on Cloudflare Workers + D1 + KV + React 18 UMD(unpkg CDN) + esbuild 사전 컴파일 JSX. AI = Anthropic Claude(기본 Cloudflare AI Gateway 경유, `AI_PROXY_URL` 설정 시 전용 egress 프록시).
- **워커명 / 도메인**: `maumgame` → `game.maumful.com`. CTS 트윈 `lightoflife-game`.
- **프론트 빌드 방식**
  ```bash
  npm run build:jsx   # esbuild --bundle=false --loader:.jsx=jsx → public/static/compiled/{game_engine,game_registry,game_hub}.js, compiled/games/*.js
  npm run deploy      # build:jsx + wrangler deploy (포그라운드 필수)
  ```
  - **`--tsconfig-raw={"compilerOptions":{"jsx":"react"}}` 필수** — tsconfig의 `"jsx":"react-jsx"` 가 esbuild를 override하면 `react/jsx-runtime` import가 생겨 일반 `<script>` 로드에서 실패한다.
  - 번들러가 아니라 **파일별 트랜스파일**(`--bundle=false`)이므로 11개 `<script>` 가 **같은 전역 스코프**를 공유한다 → 전역 `const` 이름 충돌 시 `SyntaxError` 로 전체 페이지가 죽는다.
  - `game_engine.js` 가 `GAME_LANG`·`t()`·`GameEngine` 전역을 정의하므로 **항상 첫 번째로** 로드돼야 한다.
  - **SSO 인라인 스크립트는 컴파일 스크립트 로드 전 실행**(React 마운트 전 토큰 처리).
  - `GameHubApp` 은 `getMe()` hang 대비 **10초 폴백 타임아웃**으로 무한 스켈레톤을 방지한다.
- **외부 API**: Anthropic Claude(AI Gateway 또는 `AI_PROXY_URL`), Resend(메일), 마음풀 워커(favicon 프록시 `maumful.limyj007.workers.dev`), Google Fonts·unpkg CDN.
- **구성도**
```
  마음풀(maumful.com)                         마음게임(game.maumful.com)
  ┌──────────────────────┐   ?t=JWT&game=&lang=   ┌─────────────────────────┐
  │ 리포트 §다음 단계     │ ───────────────────▶ │ HTML 셸 → localStorage   │
  │ gamePrescription()   │                       │ game_token → 게임 자동   │
  │ 어드민 🔁 루프 탭     │ ◀─────────────────── │ TestSuggestionCard       │
  └──────────┬───────────┘  ?go=test:X / history  └────────────┬────────────┘
             │                                                  │
             └────────────── 공유 D1 `maumful-db` ──────────────┘
               users · test_history · credit_transactions · loop_events
               + 게임 전용 7테이블(user_game_status · game_session_logs …)
                                    │
                       Cron 월 03:00 UTC → Resend 주간 메일
```

---

## 6. 데이터 모델 (D1)
> **DB는 마음풀 본체와 같은 `maumful-db`(id `f8046693-…`)를 그대로 바인딩**한다. KV 네임스페이스도 공유한다. 게임은 마음풀 소유 테이블(`users`·`test_history`·`credit_transactions`·`loop_events`)을 직접 읽고 쓴다.

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `user_game_status` | 사용자별 정원 진행 상태 | `user_id`(PK) · `garden_level` · `total_exp` · `visual_status`(foggy/clearing/blooming) · `streak_days` · `streak_recover` · `last_played_at` · `unlocked_games` | 0001 + 0004. `unlocked_games` 는 해금 폐지로 **레거시** |
| `game_session_logs` | 매 플레이 기록 | `user_id` · `game_id` · `module_type` · `score` · `exp_gained` · `duration_sec` · `metadata`(JSON) · `created_at` | 0001. **모든 분석·리포트·역루프의 원천**. 마음풀 `buildGameSummary` 도 이 테이블을 읽는다 |
| `game_achievements` | 업적(배지) | `user_id` · `achievement_id` · `earned_at`, `UNIQUE(user_id, achievement_id)` | 0001 |
| `game_ai_cache` | AI 결과 캐시 | `user_id` · `source_text`(캐시 키 겸용) · `result_text` · `game_id` | 0001. 생각 변환/데일리 팁/감정 리포트/세션 피드백/AI 일기가 공용 |
| `weekly_reports` | 번아웃 주간 리포트 | `user_id` · `avg_energy` · `completed_missions` · `burnout_delta` · `week_start` | 0002. cron이 주 1회 멱등 기록(DELETE→INSERT) |
| `user_test_scores` | 게임 내 자가 입력 검사 점수 | `(user_id, test_type)` PK · `score` · `updated_at` | 0003. 마음풀이 검사 결과를 저장하지 않기 때문에 존재 |
| `game_campaign_progress` | 캠페인 챕터 보상 수령 이력 | `user_id` · `chapter_id` · `rewarded_at`, `UNIQUE(user_id, chapter_id)` | 0005. UNIQUE로 중복 지급 방지 |
| `game_email_prefs` | 주간 메일 수신거부 | `user_id`(PK) · `optout` · `updated_at` | 0006. **opt-out 방식**(정보통신망법) |

- **마이그레이션 파일 수**: 6개(`0001`~`0006`).
- **다른 서비스와 공유하는 테이블**(마음풀 소유, 게임이 읽기/쓰기)
  - `users` — 읽기(email·nickname·credits·locale·is_email_verified), **쓰기**(캠페인 보상 `credits + N`, 게임 크레딧 차감).
  - `test_history` — 읽기 전용(수행 검사 목록, 최근 30일 검사 여부).
  - `credit_transactions` — 쓰기(게임 차감 원장, `type='spend'`·`reason='game'`).
  - `loop_events` — 쓰기(마음풀 `migrations/0024_loop_events.sql` 에서 생성). 마음풀 어드민 🔁 루프 탭이 집계한다.
- ⚠️ **원격 D1 적용 확인 필수**: `weekly_reports`(0002)·`user_test_scores`(0003)가 **원격 DB에 적용된 적이 없었고, 코드가 D1_ERROR를 try/catch로 삼켜 몇 달간 조용히 실패**한 사고가 있었다. 새 테이블을 쓰는 코드는 `SELECT name FROM sqlite_master` 로 실재를 확인할 것. 원격은 마이그레이션 트래킹이 비어 있어 `npx wrangler d1 execute maumful-db --remote --file=migrations/000N_*.sql` 로 직접 적용한다.

---

## 7. API 계약
> 인증 = `Authorization: Bearer <JWT>` 또는 `?t=<JWT>`(마음풀과 공유하는 시크릿으로 HMAC-SHA256 검증). 표의 "필수"는 미인증 시 401.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/` | 불필요 | HTML 셸(SSO 토큰 처리 인라인 스크립트 포함) |
| GET | `/favicon.ico`, `/favicon.png` | 불필요 | 마음풀 워커 favicon 프록시 |
| GET | `/api/game/me` | 필수 | 유저·게임상태·최근세션5·검사목록·업적·자가점수·7일 플레이일·오늘 세션. 상태 없으면 자동 생성 |
| GET | `/api/game/stats` | 필수 | 게임별 플레이/베스트/누적EXP + 주간·월간 요약 |
| POST | `/api/game/session` | 필수 | 세션 저장 + EXP 적립 + 레벨업·스트릭·업적 판정 |
| POST | `/api/game/streak/recover` | 필수 | 복구권 1 소모 → 연속일 +1 |
| GET | `/api/game/campaign` | 필수 | 챕터별 스텝 완료·보상 수령 여부 |
| POST | `/api/game/campaign/claim` | 필수 | 챕터 보상 크레딧 지급(선행 챕터·스텝 재확인·`INSERT OR IGNORE` 멱등) |
| PATCH | `/api/game/visual` | 필수 | PHQ-9 점수 → 정원 시각 상태 갱신 |
| POST | `/api/game/ai-transform` | 필수 | CBT 생각 변환(위기 2중 방어·캐시) |
| GET | `/api/game/leaderboard` | **없음** | EXP 상위 20명 (⚠️ §15) |
| POST | `/api/game/spend-credit` | 필수 | 게임 크레딧 차감(중복 차감 10분 차단, 402/409) |
| GET | `/api/game/credits` | 필수 | 실시간 잔액 |
| POST | `/api/game/scores` | 필수 | 자가 입력 검사 점수 upsert |
| POST | `/api/game/daily-tip` | 필수 | AI 코치 메시지(일 1회 캐시) |
| GET | `/api/game/mood-history?days=` | 필수 | 감정 체크인 기록(최대 90일, 하루 1건) |
| GET | `/api/game/burnout-history` | 필수 | 번아웃 플레이 최근 10회 |
| POST | `/api/recovery/missions` | **없음** | 점수 기반 미션 키 목록(프론트 미사용) |
| GET | `/api/recovery/weekly-report/:userId` | **없음** | 최신 주간 리포트 (⚠️ §15 — userId를 경로에서 그대로 받음) |
| GET | `/api/game/emotion-report` | 필수 | 7일 감정 → AI 주간 분석(주 1회 캐시, 3건 미만 시 `insufficient`) |
| GET | `/api/game/sessions?limit=` | 필수 | 최근 세션(최대 50) |
| POST | `/api/game/session-feedback` | 선택 | 완료 격려 메시지(미인증·키 없음·오류 시 빈 문자열로 성공 반환) |
| GET | `/api/game/ai-diary` | 필수 | 오늘의 AI 마음 일기(데이터 없으면 `noData`) |
| POST | `/api/game/loop-event` | 선택 | `suggestion_view`/`suggestion_click` 계측(그 외 이벤트는 무시) |
| GET | `/api/game/test-suggestion?lang=` | 필수 | 게임 신호 기반 검사 제안(신호 약하면 `suggestion: null`) |
| GET | `/unsubscribe?u=&s=` | HMAC 서명 | 주간 메일 수신거부(HTML 응답) |

---

## 8. 인증 / 세션
- **인증 방식**: 마음풀에서 발급한 JWT를 그대로 검증하는 **무상태 SSO**. 게임 자체 회원가입·로그인 화면은 없다(`LoginGate` 는 마음풀로 보내는 안내만).
- **토큰 전달**: 마음풀이 새 탭으로 `game.maumful.com/?t=<token>[&game=][&lang=]` 를 연다 → HTML 인라인 스크립트가 `localStorage.game_token` 에 저장하고 `history.replaceState` 로 URL에서 `t` 제거 → 이후 모든 호출은 `Authorization: Bearer`.
- **토큰 구조**: 표준 3파트 JWT(HMAC-SHA256). 사용자 식별자는 `sub || id || userId`, `exp` 만료 검증. 서명 검증 실패·만료 시 `null`.
- **시크릿 조회 순서**: `KV.get('JWT_SECRET')` → `env.JWT_SECRET` → `'dev_secret_change_in_production'`(하드코딩 폴백). 마음풀과 **반드시 동일**해야 한다.
- **마스터 계정**: `MASTER_EMAILS = ['limyj007@gmail.com']` — 전 게임 해금·Lv.6·검사 8종 완료·샘플 점수로 응답(테스트 용도).
- **SSO 연동**: 마음풀 ↔ 게임은 `?t=` 토큰 방식(마음수달·곁의 `MAUM_SSO_SECRET` HMAC 브리지와는 **다른 경로**). 게임은 `MAUM_SSO_SECRET` 를 쓰지 않는다.

---

## 9. 외부 연동
| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic Claude | 생각 변환(sonnet-4-6→haiku 폴백) · 데일리 팁 · 세션 피드백 · 감정 리포트 · AI 일기(모두 haiku) | `ANTHROPIC_API_KEY` | 배포됨 |
| AI egress 프록시 | 공유 Worker IP 차단 회피용 전용 IP 경유. 미설정 시 기존 AI Gateway 폴백 | `AI_PROXY_URL` | 배포됨(설정 여부 ⚠️ 미확인) |
| Resend | 주간 리포트 메일 발송(`마음게임 <noreply@maumful.com>`) | `RESEND_API_KEY` | 배포됨. 키 없으면 **조용히 미발송** |
| 마음풀 워커 | favicon 프록시(`maumful.limyj007.workers.dev`) | — | 배포됨 |
| unpkg CDN | React 18 UMD | — | 배포됨 |
| Google Fonts | Noto Sans/Serif KR | — | 배포됨 |
| `MAUMFUL_URL` / `SERVICE_URL` | 타입에만 선언, **코드에서 사용처 없음**(프론트는 호스트명으로 `maumful.com` 하드코딩) | — | 미사용 |

- **실수신 검증**: 루트 `CLAUDE.md` 백로그에 "주간 리포트 메일 실수신 검증(사용자 동의 후)"이 **미완**으로 남아 있다.

---

## 10. 과금 / 수익 모델
- **과금 구조**: 게임 자체는 **전 종목 무료**(`creditCost: 0`). 게임 단독 매출은 없다. 역할은 **마음풀 본체(검사·AI 해석·크레딧 상품)로의 유입·리텐션**이다.
- **상품·가격**: 해당 없음(게임에는 판매 상품이 없다). 크레딧 가격 정합·상품 카탈로그는 마음풀 본체 소관.
- **결제 수단**: 해당 없음(게임은 결제 엔드포인트가 없다).
- **크레딧·구독 처리**
  - **지급(유출)**: 캠페인 챕터 보상으로 `users.credits` 에 **ch1 30 + ch2 50 + ch3 80 = 최대 160cr** 를 무상 지급한다. 크레딧은 마음풀 공용 화폐이므로 이는 **실질적인 프로모션 비용**이다.
  - **차감**: `spendCreditsGame` 이 `WHERE credits >= ?` 원자적 차감 + `credit_transactions(type='spend', reason='game')` 원장 기록. ⚠️ `type` 은 `CHECK(type IN ('gain','spend'))` 이므로 `'loss'` 같은 값을 쓰면 INSERT가 실패한다(마음풀에서 실제 발생한 사고).
  - 현재 유료 게임이 없어 차감 경로는 **가동되지 않는다**.

---

## 11. 안전 · 윤리 · 법적 제약
1. **위기 신호 = 변환 금지·긴급자원 안내** (§2.5). 원문 규칙:
   > "자해·자살 신호는 '긍정 확언으로 바꿀 생각'이 아니라 즉시 도움이 필요한 신호 → 변환 금지·긴급자원 안내."
   > "⚠️ **위기 감지 키워드는 NFC 정규화 후 판정**: 자모 분리(NFD) 한글은 완성형 정규식에 매칭되지 않아 1차 방어가 통째로 우회된다(실제 확인). `text.normalize('NFC')` 필수."
   - 위기 화면에서는 게임 요소(경험치·다음 단계)를 노출하지 않는다.
2. **수신거부 = 법정 필수**
   > "⚠️ **수신거부 필수**(정보통신망법). `game_email_prefs.optout`(migration 0006, opt-out 방식) → cron이 제외. **메일 발송 기능을 만들 땐 수신거부 링크를 반드시 포함**할 것."
   - cron은 `is_email_verified = 1` 이면서 `optout = 0` 인 사용자에게만 발송한다.
3. **임상 표현 완화**(마음풀·CTS 공통 정책). 진단·치료·처방 어법 금지, "~기반" 대신 "~원리에서 착안". AI 피드백 프롬프트에도 **"비임상적 언어만 사용, 진단명 금지"** 를 명시.
4. **감정 내용 공유 금지**: 마음커플 "우리의 정원"(`GET /api/couple/garden`, **마음커플 워커 측 구현**)은 두 사람의 게임 실천 **횟수만** 합산하며 파트너의 감정 기록 내용(emotion·intensity·note)은 **서버가 조회조차 하지 않는다**. 동의·철회 UX 없는 감정 내용 공유는 금지(루트 `CLAUDE.md`).
5. **고위험 사용자 상담 안내**: BURNOUT≥60 / PHQ-9≥10 등에서 전문 상담 연결 팝업. 단 마음풀의 상담사 매칭은 법적 보류 상태이므로 안내는 `?go=counseling`(인근 기관·무료 상담 전화) 경로다.
6. **프라이버시**: 감정 메모·걱정 텍스트·CBT 원문·감사 답변이 `game_session_logs.metadata` 에 **평문 JSON으로 저장**된다. 마음풀의 "검사 결과 서버 미저장" 원칙과 대비되는 지점이므로 취급 주의(§15).

---

## 12. 운영
- **배포 절차**
  ```bash
  npm run build:jsx            # 컴파일 산출물은 레포에 커밋(Cloudflare 빌드 스텝 없음)
  npx wrangler deploy          # 포그라운드 필수(백그라운드 시 인증 실패). 배포 전 TypeScript 에러 확인
  npx wrangler deploy --config wrangler.lightoflife.toml   # CTS 트윈(버그·안전 수정만)
  ```
  - 커밋 접두사 **`[maumgame]`**, 서비스 간 변경 혼합 금지(선택적 revert를 위해). 수정 즉시 커밋·푸시.
  - push 실패 시 `gh auth status` 로 활성 계정 확인(`youngjun1603` 여야 함).
- **Cron / 스케줄**: `crons = ["0 3 * * 1"]` — **매주 월요일 03:00 UTC(KST 12:00)**. `handleScheduled` 가 ① 7일 활동자 집계(단일 쿼리, N+1 제거) ② 세션 metadata 일괄 로드 ③ 최근 30일 검사자 집합 ④ 지난주 `avg_energy` 로 변화율 계산 ⑤ `weekly_reports` 멱등 기록 ⑥ **5명씩 병렬**로 메일 발송(순차 await는 cron 타임아웃 위험)을 수행한다.
- **모니터링·에러로그**: `console.warn/error`(위기 감지, AI 오류, loop-event 실패) → Cloudflare Workers 로그. 별도 APM·알림 **없음**(⚠️ 미확인 = 외부 모니터링 도구 도입 여부).
- **루프 성과 확인**: 마음풀 어드민 **🔁 루프 탭**(`GET /api/admin/loop-metrics`)에서 정방향·역방향 퍼널을 사람 수로 본다. '실제 검사 완료' = 제안 클릭 후 그 검사를 끝낸 사람.
- **롤백**: ⚠️ 미확인 — 문서·스크립트에 롤백 절차 정의 없음. 실무상 이전 커밋으로 되돌려 재배포하는 형태로 추정되나 **명시된 근거 없음**.

---

## 13. 서비스 간 의존관계
| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음풀(`maumful`) | **D1 `maumful-db`·KV·`JWT_SECRET` 공유**. `users`·`test_history` 읽기, `users.credits`·`credit_transactions`·`loop_events` 쓰기 | 게임 → 마음풀 (강결합) |
| 마음풀(`maumful`) | **정방향 루프**: 리포트 §다음 단계 `gamePrescription(testType, score)` → `openMaumGame(key)` → `?t=&game=&lang=`. 게임 키 추가 시 게임 측 딥링크 화이트리스트에도 추가 필수 | 마음풀 → 게임 |
| 마음풀(`maumful`) | **역루프**: `GET /api/game/test-suggestion` 카드·주간 메일 CTA → `maumful.com/?go=test:<TEST>` / `?go=history` / `?go=counseling`. 두 경로가 **`pickTestSuggestion` 한 함수를 공유**(규칙 분기 금지) | 게임 → 마음풀 |
| 마음풀(`maumful`) | **루프 계측 공유 테이블 `loop_events`**: 마음풀이 `report_view`·`rx_click`, 게임이 `suggestion_view`·`suggestion_click` 을 같은 테이블에 적재 → 마음풀 어드민이 집계 | 양방향 |
| 마음풀(`maumful`) | 마음풀 통합 해석·`/api/test/report` 가 `buildGameSummary(DB, userId)` 로 **게임 30일 기록(`game_session_logs`·`user_game_status`)을 읽어 AI 프롬프트에 주입**("게임으로 본 나의 변화"). 기록 0건이면 `null` → 기존과 동일 동작 | 마음풀 → 게임 데이터 |
| 마음커플(`maumcouple`) | 커플 "우리의 정원"이 두 사람의 게임 **실천 횟수만** 합산(구현은 마음커플 워커 `GET /api/couple/garden`) | 마음커플 → 게임 데이터 |
| CTS 게임(`lightoflife-game`) | **같은 소스·다른 설정**(`wrangler.lightoflife.toml`, DB `lightoflife-db`, 별도 KV). 유지보수 모드 — 버그·안전 수정만 | 트윈 |
| Resend / Anthropic | 메일 발송 · AI 생성 | 게임 → 외부 |

> **요약**: 마음게임은 독립 서비스가 아니라 **마음풀 DB 위에 올라간 두 번째 Worker**다. 계정·크레딧·검사 이력이 모두 마음풀 것이며, 이 서비스의 존재 이유는 §13의 **검사↔게임 양방향 루프**다.

---

## 14. 현황 및 백로그
- **라이브 상태**: `game.maumful.com` 배포 중. 게임 8종 전부 무료·전면 해금, 한/영 번역 완료, 주간 리포트 cron·수신거부·양방향 루프 계측 가동. 최근 변경은 AI egress 프록시 지원(2026-08-29).
- **미착수 / 대기**
  - **마음게임 콘텐츠 확장** — 루트 `CLAUDE.md` 백로그에서 "**데이터 보고 판단**(2026-08-09경): 어드민 🔁 루프 탭에서 검사↔게임 루프가 도는지 확인 후" 로 보류.
  - **주간 리포트 메일 실수신 검증**(사용자 동의 후) — 백로그 "바로 가능" 항목.
  - PWA 서비스워커 등록·푸시 알림(코드만 존재, §4-22).
  - 유료 게임(크레딧 차감 경로는 이미 구현되어 있으나 사용하는 게임이 없음).
- **금지 사항**
  - **CTS(`cts-game-main`)에 신규 기능 포팅 금지** — 버그·안전 수정만(2026-07-18 사용자 확정).
  - **커플 감정 내용 공유 금지**(동의·철회 UX 없이).
  - 해금 게이팅 부활 시 `game_registry.jsx` + 서버 `ALL_GAME_IDS` **동시** 수정 필수.
  - AI 채팅 응답 형식 라벨 부활 금지 등 마음풀 프롬프트 규칙은 본체 문서 소관.
  - 상세 백로그는 외부 메모리 **`project_maum_backlog`** 한 곳에 모여 있다 — **상세는 외부 메모리 `project_maum_backlog` 참조 — 문서화 필요.**

---

## 15. 알려진 리스크 · 기술부채
1. **`GET /api/game/leaderboard` 가 무인증이며 응답에 `u.email` 이 포함된다.** 상위 20명의 **이메일 주소가 누구에게나 노출**된다(프론트는 '나' 표시용으로만 쓰지만 API 응답에 그대로 실린다). 즉시 검토 필요.
2. **`GET /api/recovery/weekly-report/:userId` 가 무인증이며 userId를 경로에서 그대로 받는다** — 타인의 `avg_energy`·`completed_missions`·`burnout_delta` 조회가 가능한 IDOR 구조. 프론트에서 쓰이지 않는 것으로 보이나 라우트는 살아 있다.
3. **번아웃 metadata 키 불일치로 주간 에너지 집계가 사실상 죽어 있다.** 프론트 `burnout.jsx` 는 `{missions_completed, energy_gained, city_level, burnout_score}` 를 저장하는데, 서버 `handleScheduled`·`signalsFromSessions` 는 `meta.completedMissions`·`meta.energy` 를 읽는다. → `energies` 가 항상 비어 **`weekly_reports` 에 행이 쌓이지 않고**, `avgEnergy` 기반 BURNOUT 검사 제안(`avgEnergy < 40`)도 발동하지 않는다(대체 조건 `burnoutPlays >= 3` 만 동작). **코드 기준 확인 사항이며 운영 DB 실측은 ⚠️ 미확인.**
4. **감정 강도 기반 상담 팝업이 발동하지 않는다.** `game_hub.jsx` `handleGameExit` 는 `result?.metadata?.intensity`·`result?.metadata?.mood` 를 보는데, 게임들이 `onExit` 으로 넘기는 객체는 `{score, expGained, leveledUp, newAchievements}` 뿐이고 `mood.jsx` 는 아예 인자 없이 `onExit` 을 호출한다. → mood 분기는 죽은 코드.
5. **게임 목록이 3중 관리**(서버 `ALL_GAME_IDS` · `GAME_REGISTRY` · 허브 딥링크 `valid`). 이미 `worry` 딥링크 누락 사고가 있었다. 레벨 테이블도 서버·프론트 2중, 캠페인 정의도 서버 `CAMPAIGN_CHAPTERS`·프론트 `CAMPAIGN_DEF` 2중(프론트에만 `unlockLevel` 1/2/3 이 있고 서버 claim은 레벨을 검사하지 않는다).
6. **자유 서술 텍스트가 평문으로 축적된다.** CBT 원문(`branch_texts`)·걱정 문장(`worries`)·감사 답변(`answers`)·감정 메모(`note`)가 `game_session_logs.metadata` 에 그대로 남고, 일부는 AI 프롬프트로 재전송된다(AI 일기·감정 리포트). 마음풀의 "검사 결과 서버 미저장" 원칙과 대비되며 보존기간·삭제 정책이 정의되어 있지 않다(⚠️ 미확인).
7. **`JWT_SECRET` 하드코딩 폴백**(`'dev_secret_change_in_production'`). KV·환경변수가 모두 비면 예측 가능한 시크릿으로 토큰을 검증하게 된다. 운영 KV 실제 값 존재 여부 ⚠️ 미확인.
8. **원격 D1 마이그레이션 트래킹 부재**(§6). 0002·0003이 몇 달간 미적용 상태로 조용히 실패한 전례가 있고, 적용 이력이 어디에도 남지 않아 재발하기 쉽다. 코드가 스키마 에러를 빈 `catch` 로 삼키는 곳이 다수(`game_ai_cache`·`user_test_scores`·`weekly_reports`)라 실패가 드러나지 않는다.
9. **`game_hub.jsx` 단일 파일 138KB**(약 2,800줄 이상, 컴포넌트 30여 개). 전역 스코프 공유 구조라 전역 `const` 이름 충돌이 곧 전체 페이지 `SyntaxError` 다. 렌더 스모크 검증(마음풀의 `render_smoke.cjs` 같은 도구)이 **게임 쪽에는 없다**.
10. **PWA가 절반만 존재.** `manifest.json` 은 링크되어 있으나 서비스워커 등록 코드가 없고(`serviceWorker.register` 0건), `sw.js` 와 manifest가 참조하는 `/static/icon-192.png`·`icon-512.png` 파일이 **레포에 없다** → 아이콘 404·`apple-touch-icon` 깨짐.
11. **`README.md` 가 4개월 이상 낡았다**(게임 4종·`*.pages.dev` 도메인·Babel 빌드·`PHYWEB_URL` 시크릿). 신규 작업자를 오도할 수 있다.
12. **`MAUMFUL_URL`·`SERVICE_URL` 바인딩이 선언만 되고 쓰이지 않으며**, 마음풀 URL·게임 URL(`https://maumful.com`, `https://game.maumful.com`)이 서버·프론트 여러 곳에 하드코딩되어 있다.
13. **작업 트리에 `src/index.tsx` 전체가 변경된 것으로 표시된다**(1,626줄 삽입/삭제 = 전 라인 재기록). 내용 차이가 아니라 **개행문자(CRLF/LF) 차이로 추정**되나 원인 ⚠️ 미확인 — 커밋 전 반드시 확인할 것.
14. **운영 지식 상당 부분이 외부 메모리에만 있다**: `project_maum_backlog`(백로그), `project_maumful_tests`(검사 문항·표기) 등. **레포만으로 복원 불가 — 문서화 필요.**

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 최초 작성. 근거 커밋 `a247b8a`. `maumful-main/CLAUDE.md`(293줄)·루트 `CLAUDE.md`·`wrangler.toml`·`wrangler.lightoflife.toml`·`package.json`·`README.md`·`src/index.tsx`(1,626줄, 라우트 26개)·`migrations/0001~0006`·`public/static/*.jsx`(engine·registry·hub + games 8종) 기준 | Claude |
