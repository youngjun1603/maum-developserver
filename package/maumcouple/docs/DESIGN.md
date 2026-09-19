# 마음커플 (maumcouple) 설계서

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음커플 (maumcouple) / CTS 분기: 커플 케어 (Couple Care) |
| 폴더 | `package/maumcouple/` |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `719f001` (2026-09-01, maumcouple 마지막 커밋) · 레포 HEAD `edc8aa4` (2026-09-12) |

## 1. 서비스 개요
- **한 줄 정의**: 마음풀에서 이미 받은 심리검사 결과(BIG5·LOST·DSI)를 두 사람이 코드로 맞대어 AI 커플 궁합·관계 패턴 리포트를 받고, 그 위에 관계 관리 도구(감정 번역기·싸움 중재·데이트 코스·체크인 등)를 얹은 커플 전용 웹앱.
- **해결하는 문제**: 개인 단위로만 나오던 심리검사 결과를 관계 단위로 해석해 주는 창구가 없다. 두 사람의 결과를 안전하게 합쳐 비교하고, 갈등 상황에서 바로 쓸 수 있는 실행 도구를 한 화면에 모은다.
- **타깃 사용자**: 마음풀 계정을 가진 연인·커플(성인 연령 제한 규정은 코드에 없음 — ⚠️ 미확인). 파트너는 마음풀 계정 없이도 초대 링크로 1회 참여 가능.
- **핵심 가치 제안**: ① 이미 한 검사를 재활용한 낮은 진입 비용 ② 72시간 만료 6자리 코드 기반의 가벼운 페어링 ③ 파트너의 **감정 "내용"을 절대 공유하지 않는** 프라이버시 설계(§11).
- **생태계 내 위치**: **마음풀 생태계**. 별도 워커지만 마음풀 본체와 **D1(`maumful-db`)·KV·JWT_SECRET·크레딧을 모두 공유**한다(§6·§8·§13). 마음 시리즈(수달·곁)의 별개 생태계와 혼동 금지. CTS 트윈으로 `lightoflife-couple` 분기가 존재하나 CTS는 유지보수 모드(§12).

### ⚠️ 마음부부(maumbubu)와의 차이 — 이름이 비슷해 혼동 주의
| | **마음커플 (maumcouple)** | **마음부부 (maumbubu)** |
|---|---|---|
| 워커 / 도메인 | `maumcouple` / `couple.maumful.com` | `maumbubu` / `bubu.maumful.com` |
| 폴더 | `package/maumcouple/` | `maumbubu/` |
| 규칙 파일 | `maumful-main/CLAUDE.md` | `maumbubu/CLAUDE.md` |
| SSO 토큰 타입 | `type:'couple'` (`/api/couple-token`) | `type:'bubu'` (`/api/bubu-token`) |
| 핵심 엔진 | **검사 결과 비교 분석** — 두 사람의 BIG5/LOST/DSI 점수를 맞대어 궁합 점수·리포트 생성 | **대화 통역** — 배우자가 한 말의 "말과 마음 간극"을 4모드(수신·발신·중재·관점)로 통역 |
| 입력 | 저장된 검사 `result_json` | 그때그때 입력한 대화 문장 |
| 관계 기억 | 없음 (세션 단위, 72시간 만료) | `relation_memory_v2` 누적 프로파일 |
| 트랙 | 단일(심리) | 이중(심리상담 + 기독교) |
| 연령 | 명시 규정 없음 (⚠️ 미확인) | 만 19세 이상 전용 |
| 공통점 | 둘 다 마음풀 생태계 · `maumful-db`/KV/JWT 공유 · Hono+Workers · 마음풀 크레딧 차감 · esbuild 사전컴파일 |

마음커플에도 "감정 번역기"·"싸움 중재" 도구가 있어 마음부부와 겹쳐 보이나, 마음커플의 것은 **세션·관계기억 없이 단발 입력을 처리하는 경량 도구**이고 마음부부는 관계기억·안전 3단계 오버라이드를 갖춘 본격 통역 엔진이다.

## 2. 도메인 규칙 (이 서비스 고유)

### 2.1 커플 세션 (`couple_sessions`)
- **host / guest 2인 구조**. host가 세션을 만들고 6자리 코드를 발급, guest가 코드로 참여한다.
- **코드**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` 32자에서 6자 무작위(혼동 문자 I·O·0·1 제외). 중복 시 최대 10회 재시도.
- **만료**: 생성 후 **72시간**(`expires_at DEFAULT datetime('now','+72 hours')`).
- **상태 4종**: `waiting` → `both_done` → `reported`, 그리고 `expired`. DB CHECK 제약으로 강제.
  - `both_done` 승격 조건은 "guest가 참여함"이 아니라 **양쪽 result_json이 빈 `{}`가 아닐 것**(BUG-8 FIX). 결과 없는 참여는 `waiting`으로 남는다.
- **재사용 규칙**: 같은 host의 `waiting` 세션이 있고 `test_type`이 같으면 **재사용**(중복 과금 없음), 다르면 기존 세션을 `expired` 처리하고 새로 만든다.
- **취소**: host만 가능, `reported`/`expired`는 불가. **크레딧은 환불하지 않는다**(코드 주석에 서비스 정책으로 명시).

### 2.2 검사 조합 (`test_type`)
- 허용 조합 7종: `BIG5` / `LOST` / `DSI` / `BIG5+LOST` / `BIG5+DSI` / `LOST+DSI` / `BIG5+LOST+DSI`(기본값). DB CHECK + 서버 `VALID_TYPES` 이중 검증.
- 검사 자체는 마음커플에서 수행하지 않는다. **마음풀에서 받은 결과만 읽는다**(`test_history.result_json`).
- UI 용어 주의: 프론트·프롬프트는 DSI를 **SDRI(자아분화)** 로 표기한다(마음풀 검사 명칭 정정과 동일). DB `test_type` 값은 `'DSI'`.

### 2.3 궁합 점수 (compatibility_score)
- AI가 리포트 첫 줄에 `SCORE:XX`를 출력 → 서버가 `/SCORE:\s*(\d+)/i`로 파싱, 0~100 클램프, 실패 시 **기본 70**.
- 파싱 성공 시 해당 줄 전체를 리포트 본문에서 제거한다. 공백·`**` 마크다운 혼입 사례가 실측되어 정규식을 느슨하게 고친 이력이 있다(커밋 `9a03fa8`).

### 2.4 비용 규칙 (`calcCost`)
검사 조합에 포함된 검사 **개수**로 과금: 1개 20cr / 2개 35cr / 3개 45cr. 마스터 계정(`limyj007@gmail.com` 하드코딩)은 0cr.

## 3. 사용자 플로우

- **시나리오 1 — host 커플 분석 (정상 경로)**
  마음풀 로그인 → `GET /api/couple-token`으로 `type:'couple'` 7일 JWT 발급 → `couple.maumful.com/?t=<token>` 이동 → 인라인 스크립트가 `localStorage['couple_token']` 저장 후 URL 정리 → 허브 로드(`/api/couple/me`) → 파트너 탭에서 검사 조합 선택 → `POST /api/couple/session`(크레딧 차감·코드 발급) → 코드/링크/이메일로 파트너 초대 → 대기 화면 폴링 → 양쪽 `both_done` → `POST /api/couple/report` → 리포트·궁합 점수 표시 → (선택) 마음풀 상담 예약 딥링크로 이탈.
- **시나리오 2 — guest 참여 (마음풀 계정 있음)**
  코드 수신 → 마음커플 접속·로그인 → 코드 입력 → `POST /api/couple/join` → 서버가 guest의 최근 검사 결과를 자동 수집 → `both_done` → host에게 Web Push 알림(VAPID 설정 시) → 리포트 열람.
- **시나리오 3 — guest 참여 (로그인 없이, 마음풀 경유)**
  초대 링크 `maumful.com/?partner=<코드>` → 마음풀 프론트가 `GET /api/couple/partner-info/:code`(무인증)로 host 이름·검사 조합 조회 → 마음풀에서 필요한 검사 응시 → `POST /api/couple/partner-submit`(무인증)로 결과 제출 → 세션 `both_done`.
  (초대 이메일 본문의 버튼은 `couple.maumful.com/?code=<코드>`로 가고, "로그인 없이 바로 참여할 수 있어요"라고 안내한다.)
- **시나리오 4 — 검사 결과가 없을 때**
  허브가 미완료 검사 카드를 표시 → 클릭 시 `maumful.com?start=<TYPE>` 딥링크로 마음풀 검사 시작 → 마음풀이 `sessionStorage['return_to_couple']`로 "커플로 복귀" 배지 표시 → 완료 후 마음커플 복귀.
- **시나리오 5 — 파트너 없이 혼자**
  도구 탭에서 이상형 성향 분석(5cr)·연애 유형 테스트(무료)·감정 번역기(1cr)·데이트 코스(1cr) 등 단독 이용.

### 화면 구성 (파일 단위)
- 전체가 **단일 SPA**: `public/static/couple_hub.jsx` (3,959줄) → esbuild로 `public/static/compiled/couple_hub.js`. 셸 HTML은 `src/index.tsx`의 `HTML()` 템플릿 문자열이 서빙(React 18 UMD를 unpkg CDN에서 로드).
- **바텀 4탭** (`NAV_TABS`): 🏠 홈 / 🔧 도구 / 💕 파트너 / 📋 기록.
- **홈 탭**: 오늘의 커플 대화 질문(60개 날짜 순환) · 우리의 정원 카드 · 빠른 도구 가로 스크롤 5종 · 파트너 마음 일기 섹션 · D+day 표시(`localStorage['couple_first_date']`).
- **도구 탭** (`TOOL_CATEGORIES` 3분류): 🤖 AI 도구 6종(감정 번역기·싸움 중재·AI 코치·이상형 분석·데이트 코스·카톡 분석) / 🧪 심리 테스트 2종(연애 유형·커플 스타일 퀴즈) / 📅 관계 관리(관계 성장 체크인·기념일 계산기·관계 타임라인).
- **파트너 탭**: 내 검사 결과 현황 카드 → 검사 조합 선택 → 세션 생성/코드 입력 → 대기 화면(`SessionWaitingView`) → BIG5 비교 뷰(`Big5CompareView`).
- **기록 탭**: 완료 리포트 목록 → `CoupleReportView`.
- 주요 뷰 컴포넌트(`view` 상태): `hub` / `report` / `miniTest` / `soloAnalysis` / `checkin` / `dateCourse` / `emotionTranslate` / `fightMediate` / `kakaoAnalysis` / `coach` / `quiz` / `anniversary` / `timeline` / `big5Compare`.

## 4. 기능 명세
| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 커플 세션 생성·코드 발급 | 검사 조합 선택 → 6자리 코드, 72h 만료, 20/35/45cr | 배포됨 | `POST /api/couple/session` |
| 2 | 코드로 참여 (로그인) | guest 검사 결과 자동 수집 후 `both_done` | 배포됨 | `POST /api/couple/join` |
| 3 | 무인증 파트너 참여 | 마음풀 경유로 계정 없이 결과 제출 | 배포됨 | `/api/couple/partner-info/:code`, `/api/couple/partner-submit` |
| 4 | AI 커플 리포트 | BIG5+LOST+SDRI 기반 궁합 점수·강점·성장영역·대화 질문 | 배포됨 | `POST /api/couple/report`, `buildCouplePrompt()` |
| 5 | 세션 상태 폴링 | 대기 화면에서 파트너 참여 여부 확인 | 배포됨 | `GET /api/couple/session/:code` |
| 6 | 세션 취소 (host, 환불 없음) | `waiting`/`both_done` → `expired` | 배포됨 | `PATCH /api/couple/session/:code/cancel` |
| 7 | AI 관계 코치 채팅 | 하루 3회 무료, 이후 2cr. BIG5 성향을 컨텍스트로 주입 | 배포됨 | `POST /api/couple/coach` |
| 8 | 감정 번역기 | 상대의 말 → 진짜 감정/원하는 것/추천 반응 (1cr) | 배포됨 | `POST /api/couple/emotion-translate` |
| 9 | 싸움 중재 AI | 양쪽 입장·공통점·화해 문구 (2cr) | 배포됨 | `POST /api/couple/fight-mediate` |
| 10 | 카톡 대화 분석 | 프론트에서 .txt 파싱·통계 → AI 리포트 (3cr) | 배포됨 | `POST /api/couple/kakao-analyze` |
| 11 | 데이트 코스 추천 | 지역·분위기·시간·예산 + BIG5/LOST 개인화 (1cr) | 배포됨 | `POST /api/couple/date-course` |
| 12 | 이상형 성향 분석 (솔로) | 내 검사 결과만으로 연애 성향·궁합 파트너 유형 (5cr) | 배포됨 | `POST /api/couple/solo-analysis` |
| 13 | 관계 성장 체크인 | 10문항×1~5점, 월 1회 무료(KST 기준) | 배포됨 | `POST /api/couple/checkin`, `GET /api/couple/checkins` |
| 14 | 우리의 정원 | 두 사람의 마음게임 실천 **횟수만** 합산, 주간 목표 7회 | 배포됨 | `GET /api/couple/garden` |
| 15 | 파트너 마음 일기 | 파트너의 mood·gratitude 게임 **횟수만** 표시 (7일) | 배포됨 | `GET /api/couple/partner-moments` |
| 16 | 관계 활동 타임라인 | 세션·리포트·체크인 통합 연표 | **구현·미배포(동작 불능)** — §15 참조 | `GET /api/couple/timeline` |
| 17 | 이메일 초대 | Resend로 코드·링크 발송 | 배포됨 (`RESEND_API_KEY` 설정 여부 ⚠️ 미확인) | `POST /api/couple/invite-email` |
| 18 | Web Push 알림 | VAPID ES256 자체 서명, 파트너 참여 시 host에게 | 구현·조건부 (`VAPID_*` 설정 여부 ⚠️ 미확인) | `/api/couple/vapid-key`, `/api/couple/push-subscribe`, `signVapidJwt()` |
| 19 | 관리자 통계 | 마스터 계정 전용 세션·리포트 집계 | 배포됨 | `GET /api/couple/admin/stats` |
| 20 | 검사 결과 저장 연동 API | 마음풀 프론트가 `result_json` 채워 넣는 통로 | 배포됨 | `POST /api/couple/save-result` |
| 21 | 만료 세션 정리 Cron | 매월 1일 03:00 UTC | 배포됨 | `scheduled()` `0 3 1 * *` |
| 22 | 주간 커플 인사이트 메일 | 최근 30일 활성 사용자 최대 200명에게 발송 | **구현·미배포(운영 cron 비활성)** — §12 | `scheduled()` `0 23 * * 0` |
| 23 | 연애 유형 테스트 / 커플 스타일 퀴즈 | 클라이언트 전용, 서버 호출·과금 없음 | 배포됨 | `couple_hub.jsx` `MiniLoveTestView`·`CoupleQuizView` |
| 24 | 기념일 계산기 | `localStorage['couple_first_date']` 기반 D+N | 배포됨 | `couple_hub.jsx` `AnniversaryView` |
| 25 | 오늘의 커플 대화 질문 | 60개 한/영 세트, 날짜 기반 순환 | 배포됨 | `couple_hub.jsx` `DAILY_QUESTIONS` |
| 26 | BIG5 비교 뷰 | 두 사람 5요인 막대 비교·케미 타입 | 배포됨 | `couple_hub.jsx` `Big5CompareView` |
| 27 | 한/영 토글 | `?lang=en` + `tl(ko,en)` (마음게임과 동일 패턴) | 배포됨 | `couple_hub.jsx` `COUPLE_LANG`·`tl` |
| 28 | PWA (설치·오프라인·푸시 수신) | manifest + service worker | 배포됨 | `public/manifest.json`, `public/sw.js` |
| 29 | CTS 커플 케어 분기 | 호스트명으로 브랜드·링크 전환 | 구현·미배포(CTS 신규기능 금지) | `IS_CTS`, `wrangler.lightoflife.toml` |
| 30 | 마음커플 Plus 구독 혜택 | 마음풀 결제 화면에만 존재, 커플 워커에 구독 분기 없음 | **설계만** — §10·§15 | `maumful-main/public/static/app.jsx` |

## 5. 아키텍처
- **스택**: Hono 4.11 + Cloudflare Workers(TypeScript) / React 18 (UMD CDN + esbuild 사전컴파일 JSX) / D1(SQLite) + KV / Anthropic Claude.
- **워커명 / 도메인**: `maumcouple` → `couple.maumful.com`(custom_domain). 스테이징 `maumcouple-dev`(도메인 없음, workers.dev). CTS `lightoflife-couple`(custom_domain 미설정 → `lightoflife-couple.limyj007.workers.dev`).
- **프론트 빌드 방식**: `npm run build:jsx` = esbuild, **번들 없이**(`--bundle=false`) JSX만 변환 → `public/static/compiled/couple_hub.js`. `--tsconfig-raw={"compilerOptions":{"jsx":"react"}}` 필수(마음게임과 동일 이유 — `react-jsx` 런타임 import가 생기면 일반 `<script>`에서 실패). React/ReactDOM은 unpkg UMD로 별도 로드. **컴파일본은 레포에 커밋해 서빙**하며 빌드 없이 직접 서빙은 불가.
- **정적 자산**: `[assets] directory = "./public"`.
- **외부 API**: Anthropic Messages API(Cloudflare AI Gateway 경유 또는 `AI_PROXY_URL` 전용 egress 프록시), Resend(이메일), Web Push(브라우저 푸시 서비스 엔드포인트), Google Fonts·unpkg(CDN).
- **AI 모델**: 전 엔드포인트 `claude-haiku-4-5-20251001` 단일. max_tokens는 리포트 1500 / 코치 600 / 중재 600 / 데이트 800 / 솔로분석 1000 / 카톡 500 / 감정번역 400. 결정적 출력이 필요한 3종(감정번역·중재·카톡)은 `temperature: 0`.

- **구성도**:
```
              [ 마음풀 maumful.com ]
              · 로그인/회원/결제/크레딧 충전
              · 심리검사 응시 → test_history.result_json
              · GET /api/couple-token  (type:'couple', 7d JWT)
                        │  ?t=<jwt>
                        ▼
  ┌───────────────────────────────────────────────┐
  │  Worker: maumcouple  (couple.maumful.com)     │
  │  Hono · src/index.tsx (30 routes)             │
  │  ├ GET /            → HTML 셸 + SSO 인라인    │
  │  ├ /api/couple/*    → 세션·리포트·도구        │
  │  └ scheduled()      → 만료정리 / 주간메일     │
  └───────┬───────────────┬───────────────┬───────┘
          │               │               │
   [ D1 maumful-db ]  [ KV 9f7426… ]  [ Anthropic ]
   users / credits    JWT_SECRET       AI Gateway
   test_history       couple_coach:*   or AI_PROXY_URL
   couple_sessions
   relationship_checkins            [ Resend ]  [ Web Push ]
   credit_transactions
   game_session_logs (읽기 전용·횟수만)
   push_subscriptions
```

## 6. 데이터 모델 (D1)
대상 DB는 **마음풀 본체와 동일한 `maumful-db`(id `f8046693-876a-4ae4-b734-20c515f9994f`)**. 마음커플 전용 D1은 없다(D1 개수 한도 회피).

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `couple_sessions` | 커플 세션 본체 | `session_code`(UNIQUE), `host_user_id`, `guest_user_id`, `test_type`, `host_result_json`, `guest_result_json`, `status`, `ai_report_text`, `compatibility_score`, `credits_spent`, `created_at`, `updated_at`, `expires_at` | **마음커플 소유 테이블**. `migrations/0001`과 `maumful-main/migrations/0010_couple_sessions.sql`에 **동일 DDL이 중복 정의**되어 있다(§15) |
| `relationship_checkins` | 월 1회 관계 건강도 | `user_id`, `total_score`, `answers_json`, `created_at` | 마음커플 전용(`migrations/0002`) |
| `users` | 계정·크레딧 | `id`, `email`, `nickname`, `credits`, `locale` | **마음풀 소유** — 읽기 + `credits` 원자적 차감 |
| `test_history` | 검사 이력 | `user_id`, `test_type`, `result_json`, `performed_at` | **마음풀 소유** — `result_json` 컬럼은 마음커플이 `ALTER TABLE`로 추가 |
| `credit_transactions` | 크레딧 원장 | `user_id`, `type`, `amount`, `reason`, `balance_after`, `ref_id` | **마음풀 소유** — `type='spend'` 고정. reason: `couple`·`couple-coach`·`date-course`·`solo-analysis`·`emotion-translate`·`fight-mediate`·`kakao-analyze` |
| `game_session_logs` | 게임 실천 로그 | `user_id`, `game_id`, `created_at` | **마음게임 소유** — 마음커플은 `COUNT(*)`만 읽는다. 감정 메타데이터는 조회하지 않음(§11) |
| `push_subscriptions` | 웹푸시 구독 | `user_id`, `service`, `endpoint`, `p256dh`, `auth_key` | **마음풀 소유**(`0014`) — `service='maumcouple'`로 구분, `(user_id,service)` UPSERT |

- **마이그레이션 파일 수**: 2개 (`0001_couple_schema.sql`, `0002_relationship_checkins.sql`). 별도로 D1 콘솔 수동 실행용 `package/D1_SQL_실행순서.sql`가 있다.
- **다른 서비스와 공유하는 테이블**: 위 표에서 "마음풀 소유"·"마음게임 소유"로 표시된 5개(`users`, `test_history`, `credit_transactions`, `push_subscriptions`, `game_session_logs`). 즉 **마음커플이 스키마를 소유한 테이블은 2개뿐**이고 나머지는 전부 공유 테이블이다.
- ⚠️ 원격 `maumful-db`는 마이그레이션 트래킹 테이블이 비어 `wrangler d1 migrations apply --remote`가 0001부터 재적용을 시도한다(루트/마음풀 CLAUDE.md 경고). 신규 DDL은 `wrangler d1 execute maumful-db --remote --file=…`로 직접, `IF NOT EXISTS` 멱등하게 적용해야 한다.

## 7. API 계약
라우트 총 **30개**(정적/HTML 5 + 커플 API 25). 인증 표기: `JWT` = Bearer 또는 `?t=` 필요, `공개` = 무인증, `마스터` = `limyj007@gmail.com` 전용.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/` | 공개 | SPA 셸 HTML(캐시버스터 `?v=`), SSO 인라인 스크립트 |
| GET | `/favicon.ico` | 공개 | maumful.com / jesusmaum.com 프록시 |
| GET | `/favicon.png` | 공개 | 동일 프록시 |
| GET | `/static/icon-192.png` | 공개 | 동일 프록시 |
| GET | `/manifest.json` | 공개 | 호스트명에 따라 마음커플/CTS 커플케어 PWA manifest |
| GET | `/api/couple/me` | JWT | 유저·크레딧 + BIG5/LOST/DSI 최근 결과 + 활성 세션 + 최근 리포트 3건 + `isMaster` |
| GET | `/api/couple/credits` | JWT | 크레딧 잔액 |
| POST | `/api/couple/session` | JWT | 세션 생성(20/35/45cr). 402=크레딧 부족, 400=조합 오류 |
| POST | `/api/couple/join` | JWT | 코드로 참여. 404=무효, 409=이미 참여됨, 400=본인/완료 세션 |
| GET | `/api/couple/session/:code` | JWT | 세션 폴링 + `partnerName` + `myRole`. 403=당사자 아님 |
| POST | `/api/couple/report` | JWT | AI 리포트 생성·캐시(`ai_report_text` 있으면 `cached:true`). 400=`both_done` 아님, 502=AI 오류 |
| PATCH | `/api/couple/session/:code/cancel` | JWT (host) | 세션 만료 처리, 환불 없음 |
| GET | `/api/couple/partner-info/:code` | **공개** | 초대 링크용 host 이름·검사 조합(`waiting`만) |
| POST | `/api/couple/partner-submit` | **공개** | 무로그인 파트너 결과 제출. 409=이미 제출됨 |
| POST | `/api/couple/save-result` | JWT | 최근 `test_history` 행에 `result_json` 기록(BIG5/LOST/DSI만) |
| POST | `/api/couple/coach` | JWT | AI 관계 코치. 하루 3회 무료 후 2cr. 최근 10턴만 전송 |
| POST | `/api/couple/emotion-translate` | JWT | 감정 번역 1cr |
| POST | `/api/couple/fight-mediate` | JWT | 싸움 중재 2cr |
| POST | `/api/couple/kakao-analyze` | JWT | 카톡 통계+샘플 분석 3cr |
| POST | `/api/couple/date-course` | JWT | 데이트 코스 1cr (지역·분위기·시간·예산 필수) |
| POST | `/api/couple/solo-analysis` | JWT | 이상형 성향 분석 5cr (검사 0건이면 400) |
| GET | `/api/couple/garden` | JWT | 두 사람 게임 실천 횟수(30일/7일)·주간목표 7 |
| GET | `/api/couple/partner-moments` | JWT | 파트너 mood/gratitude 게임 **횟수만**(7일) |
| GET | `/api/couple/checkins` | JWT | 최근 체크인 6건 + `doneThisMonth` |
| POST | `/api/couple/checkin` | JWT | 체크인 저장(무료). 409=이번 달 중복, 400=답변 5개 미만 |
| GET | `/api/couple/timeline` | JWT | 관계 활동 연표 — ⚠️ 현재 컬럼명 불일치로 실패(§15) |
| POST | `/api/couple/invite-email` | JWT (host) | Resend 초대 메일. 500=`RESEND_API_KEY` 미설정 |
| GET | `/api/couple/vapid-key` | 공개 | VAPID 공개키 반환(미설정 시 빈 문자열) |
| POST | `/api/couple/push-subscribe` | JWT | 푸시 구독 UPSERT |
| GET | `/api/couple/admin/stats` | 마스터 | 총/오늘/리포트 수, 평균 점수, 조합별 분포, 최근 10건 |

- 공통 응답 형식: `{ success: boolean, data? , error? }`. AI 계열 일부는 `{ success, result }`를 쓴다(감정번역·중재·카톡) — **응답 키가 통일돼 있지 않음**.
- CORS: `/api/*` 전체에 Hono `cors()` 기본값(모든 오리진 허용).

## 8. 인증 / 세션
- **인증 방식**: 마음풀이 발급한 **HS256 JWT를 마음커플이 검증만** 한다. 자체 회원가입·로그인은 없다.
- **토큰 발급**: 마음풀 `GET /api/couple-token` → payload `{ sub: userId, type: 'couple', iat, exp: +7일 }`. 마음게임(`type:'game'`)과 동일 패턴.
- **토큰 전달**: `couple.maumful.com/?t=<jwt>` → HTML 인라인 스크립트가 **React 마운트 전에** `localStorage['couple_token']`에 저장하고 `history.replaceState`로 URL에서 제거(`?code=`는 보존). 이후 API 호출은 `Authorization: Bearer`.
- **시크릿 공유**: `getCoupleUserId()`가 **공유 KV의 `JWT_SECRET` 키를 먼저 읽고**, 없으면 워커 env `JWT_SECRET`, 그래도 없으면 `'dev_secret_change_in_production'`. → **마음풀·마음게임·마음부부와 같은 시크릿**으로 서명·검증되므로, 마음풀에서 로그인한 사람은 마음커플에서 곧바로 동일 사용자다.
- **토큰 타입 가드**(BUG-2 FIX): payload `type`이 `couple`/`game`/없음 중 하나가 아니면 거부. 즉 **마음게임 토큰으로도 마음커플에 접근 가능**하고, `type` 없는 구형 마음풀 토큰도 통과한다.
- **만료**: JWT `exp` 검증(7일). 세션 자체의 72시간 만료와는 별개.
- **SSO 연동**: 마음풀 → 마음커플 단방향. 마음커플은 SSO 토큰을 발급하지 않는다. 마음풀 복귀는 단순 링크(`MAUMFUL_URL`), 크레딧 충전은 `maumful.com/#charge`, 상담 예약은 `maumful.com/#counseling?type=couple|bowen&score=…` 딥링크.
- **마스터 계정**: `isMasterAccount()`가 `limyj007@gmail.com`을 하드코딩. 전 기능 무과금 + 어드민 통계 접근.
- **무인증 경로 2개**: `/api/couple/partner-info/:code`, `/api/couple/partner-submit`. 6자리 코드(32^6 ≈ 10.7억)와 72시간 만료, `waiting` 상태 제한, `guest_result_json` 중복 제출 차단이 유일한 방어선이다. 레이트리밋은 없다(§15).

## 9. 외부 연동
| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic Claude | 리포트·코치·번역·중재·데이트·솔로분석·카톡분석 | `ANTHROPIC_API_KEY` | 배포됨 |
| Cloudflare AI Gateway | 기본 AI egress 경로(`…/313b6305…/maumful/anthropic/v1/messages`) | — (URL 하드코딩) | 배포됨 |
| 전용 egress 프록시 | 공유 Worker IP 차단 회피용 대체 경로. 미설정 시 게이트웨이 폴백 | `AI_PROXY_URL` | 구현됨 / 실제 설정값 ⚠️ 미확인 |
| Resend | 파트너 초대 메일, 주간 인사이트 메일 (`noreply@maumful.com`) | `RESEND_API_KEY` | 구현됨 / 설정 여부 ⚠️ 미확인 |
| Web Push (VAPID) | 파트너 참여 알림. ES256 JWT를 워커가 직접 서명(PKCS#8 DER 수동 래핑) | `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` | 구현됨 / 설정 여부 ⚠️ 미확인. 페이로드 없는 알림만 발송 |
| unpkg CDN | React 18 UMD | — | 배포됨 |
| Google Fonts | Noto Sans/Serif KR | — | 배포됨 |
| maumful.com / jesusmaum.com | 파비콘·아이콘 프록시, 크레딧 충전·상담 딥링크 | — | 배포됨 |

- `.dev.vars.example`에는 `ANTHROPIC_API_KEY` 하나만 예시로 있다.

## 10. 과금 / 수익 모델
- **과금 구조**: 자체 결제 없음. **마음풀 `users.credits`를 직접 차감**한다(공용 화폐). 결제·충전·환불은 전부 마음풀(토스페이먼츠/Stripe)에서 처리하고, 마음커플은 크레딧 부족 시 `maumful.com/#charge`로 보낸다.
- **상품·가격 (크레딧)**

  | 기능 | 비용 | 무료 조건 |
  |---|---|---|
  | 커플 분석 세션 — 검사 1종 | 20cr | — |
  | 커플 분석 세션 — 검사 2종 | 35cr | — |
  | 커플 분석 세션 — 검사 3종 | 45cr | — |
  | AI 관계 코치 | 2cr/회 | **하루 3회 무료**(KST, KV `couple_coach:{uid}:{YYYY-MM-DD}` TTL 86400) |
  | 이상형 성향 분석 | 5cr | — |
  | 카톡 대화 분석 | 3cr | — |
  | 싸움 중재 AI | 2cr | — |
  | 감정 번역기 | 1cr | — |
  | 데이트 코스 추천 | 1cr | — |
  | 관계 성장 체크인 | 무료 | 월 1회 제한 |
  | 연애 유형 테스트·커플 스타일 퀴즈·기념일·타임라인·정원 | 무료 | 서버 AI 호출 없음 |
  | 마스터 계정 | 전부 0cr | `limyj007@gmail.com` |

- **결제 수단**: 해당 없음(마음커플 내 결제 UI·PG 연동 없음).
- **크레딧·구독 처리**:
  - 차감은 공통 헬퍼 `spendCredits()` — `UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?` 원자적 처리 후 `credit_transactions`에 `type='spend'` 원장 기록(마음풀의 CHECK 제약 준수).
  - 차감 시점이 기능마다 다르다: **세션·코치는 AI 호출 전 선차감**, **감정번역·중재·카톡은 AI 성공 후 차감**, **데이트·솔로분석은 사전 잔액 확인 후 AI 성공 시 차감(반환값 미검사)**. §15 참조.
  - 세션 취소 시 **환불 없음**(정책).
  - **구독은 마음커플에 구현되어 있지 않다.** 마음풀 결제 화면에 "마음커플 Plus ₩9,900 — 월 150크레딧·월 1회 커플 리포트·AI 관계 코치 무제한·데이트 코스 무제한"이 노출되지만, 마음커플 워커 코드에 `user_subscriptions` 조회나 무제한 분기가 전혀 없다 → 현재는 **크레딧 지급형으로만 성립**한다(§15).
  - 토스 실결제 반영 후에야 착수 가능한 항목(앱화·통합해석 상품화·연동형 통합결제)은 루트 백로그 소관이며 마음커플에 직접 반영된 것은 없다. 상세는 외부 메모리 `project_maum_unified_payment` 참조 — 문서화 필요.

## 11. 안전 · 윤리 · 법적 제약

### 11.1 커플 감정 내용 공유 금지 — 타협 불가
루트 `CLAUDE.md` 백로그의 금지 항목 **원문**:

> - **금지**: 커플 감정 내용 공유(동의·철회 UX 없이) / CTS 개발(명시적 재개 시에만)

마음풀 `CLAUDE.md`의 대응 규칙 **원문**:

> - **마음커플 "우리의 정원"**(`GET /api/couple/garden`): 두 사람의 게임 실천 **횟수만** 합산. ⚠️ 파트너의 감정 기록 내용(emotion·intensity·note)은 **서버가 조회조차 하지 않는다**. 감정 내용 공유는 명시적 동의·철회 UX 없이는 하지 않는다.

**코드 준수 현황 (확인됨)**
- `GET /api/couple/garden`: `SELECT COUNT(*) FROM game_session_logs` 3건만 실행. 감정 컬럼/메타데이터를 SELECT 하지 않는다.
- `GET /api/couple/partner-moments`: `game_id='mood'`·`game_id='gratitude'`의 **건수만** 반환. 소스 주석에 금지 규칙이 명시되어 있고, 커밋 `9c528d8`("파트너 감정 내용 비노출 — 동의 없는 커플 감정 공유 제거")로 실제로 노출 코드를 걷어낸 이력이 있다.
- 따라서 **동의·철회 UX가 구현되기 전까지 파트너의 감정 라벨·강도·메모·감사일기 본문을 반환하는 어떤 필드도 추가해서는 안 된다.**

### 11.2 임상·법적 표현 정책
마음풀·CTS와 동일하게 **의료기관이 아닌 자기이해·정보제공·돌봄 서비스**. 마음커플의 AI 프롬프트 전부에 진단명·병명 금지 지시가 들어 있다.
- 커플 리포트: "진단명·병명은 절대 사용하지 마세요. 전문 상담 연계는 마지막에 한 번만 언급하세요."
- AI 코치: "진단명·병명 절대 사용 금지 / 따뜻하고 비판하지 않는 톤".
- 솔로 분석: "진단명·병명은 사용하지 마세요."
- 성장 영역은 "긍정적 표현으로" 작성하도록 강제.
- 카톡 분석: "수치에 과도한 의미 부여를 하지 않으며, **두 사람을 비교·평가하지 않습니다**."
- 싸움 중재: "어느 한쪽 편을 들지 않으며, 두 사람의 감정이 모두 타당함을 전제합니다."

### 11.3 위기 대응
⚠️ **마음커플에는 위기 키워드 감지·긴급 연락처 안내 로직이 없다.** 마음풀 AI 상담과 마음부부에는 있으나 마음커플 프롬프트에는 자해·폭력 관련 지시가 전혀 없다. 관계 갈등·싸움 중재를 다루는 서비스로서 리스크 항목으로 §15에 기록.

### 11.4 이메일 수신거부 (정보통신망법)
마음풀 `CLAUDE.md`는 "**메일 발송 기능을 만들 땐 수신거부 링크를 반드시 포함할 것**"을 요구한다. 주간 인사이트 메일 푸터의 "수신 거부" 링크는 실제 해지 엔드포인트가 아니라 `https://couple.maumful.com`(홈)으로 연결되며, 마음커플에는 opt-out 테이블·서명 링크가 없다 → **현 상태로 주간 메일을 운영 cron에 켜면 안 된다**(§15).

### 11.5 개인정보 노출면
- `GET /api/couple/session/:code`·`/api/couple/partner-info/:code`는 파트너 표시명(닉네임 없으면 **이메일 로컬파트**)을 반환한다.
- `GET /api/couple/admin/stats`는 host/guest **이메일 원문**을 반환한다(마스터 전용).
- 검사 원점수는 `couple_sessions.host_result_json`/`guest_result_json`에 **서버 저장**된다. 마음풀의 "검사 결과 서버 미저장 원칙"과 달리 커플 세션은 비교를 위해 저장하며, 72시간 만료 후에도 행은 남는다(상태만 `expired`) → §15.

## 12. 운영
- **배포 절차** (`package.json`)
  ```bash
  npm run build:jsx        # couple_hub.jsx → compiled/couple_hub.js (esbuild, --bundle=false)
  npm run deploy           # build:jsx + wrangler deploy   → maumcouple (couple.maumful.com)
  npm run deploy:staging   # wrangler deploy --config wrangler.dev.toml → maumcouple-dev
  npm run deploy:cts       # build:jsx + wrangler deploy --config wrangler.lightoflife.toml → lightoflife-couple
  ```
  - `wrangler deploy`는 **포그라운드 필수**(백그라운드 시 인증 실패), 배포 전 TypeScript 에러 확인 — 루트/마음풀 공통 규칙.
  - 커밋 프리픽스는 `[maumcouple]`로 서비스 분리(루트 규칙).
- **CTS 배포 분기 (`deploy:cts` / `wrangler.lightoflife.toml`)**
  - 워커명 `lightoflife-couple`, D1 `lightoflife-db`(`662b3fb9-…`), KV `75bddd6d…`. **custom_domain 설정 없음** → 프론트 `COUPLE_URL`이 `lightoflife-couple.limyj007.workers.dev`를 가리킨다.
  - `[triggers]` 없음 → **CTS에는 cron이 없다**(만료 세션 정리·주간 메일 모두 미동작).
  - 프론트는 `hostname.includes('lightoflife')`로 브랜드를 "커플 케어 / The Light of Life"로 전환하고 파비콘·복귀 링크를 `jesusmaum.com`으로 바꾼다.
  - ⚠️ **CTS는 유지보수 모드 — 에러·버그 수정만, 신규 기능 금지**(루트 CLAUDE.md, 2026-07-18 사용자 확정). 마음커플은 마음풀 고유 신규 서비스이므로 CTS 동기화 대상이 아니다. 실제로 CTS 커플 케어가 배포·공개되어 있는지는 ⚠️ 미확인.
- **Cron / 스케줄**
  | 환경 | cron | 동작 |
  |---|---|---|
  | 운영(`wrangler.toml`) | `0 3 1 * *` | 매월 1일 03:00 UTC — 만료 세션 `expired` 일괄 처리 |
  | 스테이징(`wrangler.dev.toml`) | `0 3 1 * *`, `0 23 * * 0` | 위 + 매주 월 08:00 KST 주간 인사이트 메일 |
  | CTS(`wrangler.lightoflife.toml`) | 없음 | — |
  - 운영에서 주간 메일 cron이 빠진 이유가 설정에 주석으로 남아 있다: "주간 이메일은 cron 5개 한도로 비활성". 즉 **`sendCoupleInsightEmail`은 운영에서 실행되지 않는다.**
- **모니터링·에러로그**: 별도 대시보드 없음. `console.error`/`console.log`(Cloudflare 로그)와 마스터 전용 `GET /api/couple/admin/stats`가 전부. 루프 계측(`loop_events`) 연동 없음.
- **롤백**: `wrangler` 이전 버전 롤백 또는 git revert. 루트 규칙상 서비스별 커밋을 분리해 두었으므로 `[maumcouple]` 커밋만 선택적 revert 가능.
- **검증**: 루트 공통 "개발 완료 후 즉시 검증" 규칙 적용. 프론트는 빌드·200으로 런타임 ReferenceError를 못 잡으므로 렌더 스모크가 필요하나, **마음커플 폴더에는 `scripts/render_smoke.cjs`가 없다**(마음풀·마음부부에는 있음) — §15.

## 13. 서비스 간 의존관계
| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음풀 (maumful) | **D1 `maumful-db` 전체 공유** — `users`·`test_history`·`credit_transactions`·`push_subscriptions` 직접 읽고 씀 | 마음커플 → 마음풀 (강결합) |
| 마음풀 | **KV 공유**(`9f7426807e…`) — `JWT_SECRET` 읽기, `couple_coach:*` 카운터 쓰기 | 마음커플 → 마음풀 |
| 마음풀 | **JWT 시크릿 공유 + `/api/couple-token` 발급**(`type:'couple'`, 7일) | 마음풀 → 마음커플 |
| 마음풀 | **크레딧 = 공용 화폐.** 충전·결제·환불은 전부 마음풀. 부족 시 `#charge` 딥링크 | 마음커플 → 마음풀 |
| 마음풀 | 검사 응시 딥링크 `?start=<TYPE>` / 복귀 배지 `return_to_couple` / 상담 예약 `#counseling?type=couple\|bowen` | 양방향 |
| 마음풀 | 랜딩 히어로 롤링 쇼케이스·GlobalNav의 커플 진입 버튼(`openCouple`) | 마음풀 → 마음커플 |
| 마음풀 | 무로그인 파트너 플로우 — 마음풀 프론트가 `partner-info`/`partner-submit`을 **교차 호출** | 마음풀 → 마음커플 |
| 마음게임 (maumgame) | `game_session_logs` **읽기 전용·COUNT만**(우리의 정원, 파트너 마음 일기) | 마음커플 → 마음게임 |
| CTS (lightoflife) | `deploy:cts` 트윈 워커 + `lightoflife-db`/전용 KV. 신규 기능 포팅 금지 | 마음커플 → CTS(단방향, 동결) |
| 마음부부 (maumbubu) | **코드 의존 없음.** 인프라 패턴(별도 워커+공유 DB/KV/JWT)만 물려받은 형제 서비스 | 없음 |
| 외부 커플 앱 (AI 커플 카운슬링 앱) | 마음풀 소개 카드 인수인계 자료 제공 | 마음커플/마음풀 → 외부 앱 (§14) |

## 14. 현황 및 백로그
- **라이브 상태**
  - `couple.maumful.com` 운영 중. 마지막 마음커플 커밋 `719f001`(2026-09-01, 모바일 코드 입력 박스 잘림 수정). 최근 커밋 흐름은 신규 기능보다 **버그 수정·프라이버시 축소** 위주.
  - 프론트 컴파일본(`compiled/couple_hub.js`)이 소스보다 최신이라 빌드 누락은 없다.
  - 코어 플로우(세션 생성 → 참여 → AI 리포트), AI 도구 6종, 관계 관리 도구, PWA, 한/영 토글 모두 배포됨.
- **미착수 / 대기**
  - **관계 활동 타임라인**: 라우트는 있으나 SQL 컬럼명 불일치로 동작 불능 → 수정 필요(§15 #1).
  - **주간 커플 인사이트 메일**: 코드 완성, 운영 cron 비활성(5개 한도). 켜기 전 **수신거부 구현이 선행되어야 함**(§11.4).
  - **마음커플 Plus 구독**: 마음풀 결제 화면에만 존재, 마음커플에 구독 분기 미구현.
  - **위기 감지·긴급 연락처 안내**: 미구현.
  - **커플 감정 내용 공유의 동의·철회 UX**: 설계·구현 모두 미착수(금지 해제의 전제 조건).
  - 앱화·통합해석 상품화·연동형 통합결제는 **토스 실결제 반영 후** 착수 — 루트 백로그 소관. 전 서비스 잔여 작업 상세는 외부 메모리 `project_maum_backlog` 참조 — 문서화 필요.
- **외부 커플 앱 인수인계 (`couple-app-handoff/`)**
  - `maumful-intro.md` + `MaumfulIntroCard.tsx`는 **별도의 "AI 커플 카운슬링 앱"에 마음풀을 소개해 유입시키기 위한 드롭인 자료**다. 마음커플 워커 코드와는 무관하며 배포물에 포함되지 않는다.
  - 링크: `https://maumful.com/?utm_source=maumcouple&utm_medium=app_intro`(UTM으로 커플 앱發 유입 측정). 브랜드 🌿 딥그린 `#2D6A4F`/`#40916C`, 슬로건 "나를 이해하는 첫걸음".
  - 배치 권장: 홈 하단 "함께하면 좋은 서비스" → 검사/결과 화면 끝 → 설정·더보기 → 푸터.
  - 컴포넌트는 Tailwind+framer-motion 버전과 **의존성 없는 인라인 스타일 버전** 두 가지 제공.
  - ⚠️ 이 문서는 마음풀 검사를 **"12종"** 으로 적고 있으나, 마음풀 CLAUDE.md는 이를 **오류로 정정하고 실제 10종**이라고 못박았다(SCT=SRCI·DSI=SDRI 중복 계수, RBC·SDI는 코드에 없음). **인수인계 자료의 카피를 "10종"으로 고쳐야 한다.**
  - 이 자료가 전달된 외부 앱의 정체·계약 상태·적용 여부는 ⚠️ 미확인.
- **금지 사항**
  - **커플 감정 내용 공유(동의·철회 UX 없이)** — 루트 백로그 금지 항목. §11.1 원문 인용 참조.
  - **CTS 신규 기능 개발** — 명시적 재개 지시 전까지 `deploy:cts`는 버그·에러 수정 반영에만 사용.
  - 토스 실결제 완전 반영 전 **연동형 통합결제 관련 코드의 커밋·푸시·배포 금지**(루트 규칙).
  - AI 프롬프트에서 진단명·병명 사용, 두 사람 비교·평가, 한쪽 편들기.

## 15. 알려진 리스크 · 기술부채

1. **`GET /api/couple/timeline` 컬럼명 불일치 (동작 불능)** — 쿼리가 `cs.code`·`cs.test_types`를 SELECT 하지만 `couple_sessions`의 실제 컬럼은 `session_code`·`test_type`이다. D1이 `no such column` 에러를 던지며, 이 라우트에는 try/catch가 없어 요청이 실패한다. 도구 탭의 "관계 타임라인" 진입 시 재현될 것으로 보인다(실제 라이브 재현은 ⚠️ 미확인).
2. **스키마 이중 정의** — `couple_sessions` DDL이 `package/maumcouple/migrations/0001_couple_schema.sql`과 `maumful-main/migrations/0010_couple_sessions.sql` 두 곳에 있다(CHECK 제약까지 동일). 한쪽만 고치면 소리 없이 갈라진다. 소유권을 한 곳으로 정해야 한다. `package/D1_SQL_실행순서.sql`은 세 번째 사본이며 **CHECK 제약이 빠져 있어** 콘솔 수동 실행 시 제약 없는 테이블이 만들어진다.
3. **주간 메일에 실제 수신거부가 없다** — 푸터 "수신 거부" 링크가 홈으로만 간다. opt-out 테이블·HMAC 서명 링크(마음게임 `game_email_prefs` 패턴)가 없는 상태에서 운영 cron을 켜면 정보통신망법 요구를 어긴다(§11.4).
4. **크레딧 차감 시점·검증이 기능마다 다르다**
   - 세션·코치: AI 호출 **전** 차감(안전).
   - 감정번역·중재·카톡: AI 성공 **후** `spendCredits` 결과를 검사해 실패 시 402 — 이 경우 **Anthropic 비용은 이미 지출**되고 사용자는 결과를 못 받는다.
   - 데이트 코스·솔로 분석: 사전 잔액 확인 후 AI 성공 시 차감하는데 **`spendCredits`의 반환값을 검사하지 않는다** → 그 사이 다른 탭에서 잔액이 소진되면 차감이 조용히 실패하고 결과는 무료로 제공된다.
5. **AI 오류 시 세션 크레딧 환불 없음** — `POST /api/couple/session`에서 선차감한 20~45cr은 이후 `POST /api/couple/report`가 502로 실패해도 환불되지 않는다. 세션 취소도 환불 없음(정책이지만 고액 차감이라 CS 리스크).
6. **무인증 엔드포인트 레이트리밋 부재** — `/api/couple/partner-info/:code`는 무인증·무제한 호출이 가능해 6자리 코드 열거로 host 표시명(닉네임 없으면 이메일 로컬파트)과 검사 조합이 수집될 수 있다. `/api/couple/partner-submit`도 무인증이라 유효 코드를 맞히면 **임의의 결과 JSON을 세션에 주입**할 수 있다.
7. **위기 감지 부재** — 싸움 중재·감정 번역·코치 어디에도 자해·폭력 키워드 감지나 긴급 연락처(1393·109·1366 등) 안내가 없다. 마음부부의 3단계 안전 오버라이드, 마음풀 채팅의 위기 지시와 대비된다. 관계 갈등을 다루는 서비스에서 우선순위 높은 공백.
8. **검사 원점수의 무기한 보존** — `couple_sessions`의 `host_result_json`/`guest_result_json`·`ai_report_text`는 72시간 만료 후에도 삭제되지 않고 `status='expired'`로만 남는다. Cron은 상태만 갱신하고 행/본문을 지우지 않는다. 마음풀의 "검사 결과 서버 미저장 원칙"과 어긋나는 예외이므로 보존 기간 정책이 필요하다.
9. **`/manifest.json` 이중 정의 가능성** — `public/manifest.json`(정적 자산)과 워커 `app.get('/manifest.json')`(CTS 분기 포함)이 같은 경로를 노린다. `[assets]`가 정적 파일을 먼저 서빙하면 **CTS 브랜딩 manifest가 적용되지 않는다**. 실제 서빙 우선순위는 ⚠️ 미확인 — 배포본에서 확인 필요.
10. **아이콘 파일 부재** — `manifest.json`과 `sw.js`가 `/static/icon-192.png`·`/static/icon-512.png`를 참조하지만 `public/static/`에 실제 파일이 없다. 192는 워커 라우트가 maumful.com에서 프록시하지만 **512는 라우트도 파일도 없어 404**다(OG 이미지·PWA 스플래시에 영향).
11. **토큰 타입 가드가 느슨하다** — `type` 필드가 없는 토큰을 통과시키고 `game` 토큰도 허용한다. 마음게임 토큰 하나로 마음커플 크레딧 차감 API 전체에 접근 가능하다.
12. **렌더 스모크 스크립트 없음** — 루트·마음풀 규칙이 요구하는 `scripts/render_smoke.cjs`가 마음커플 폴더에 없다. 프론트가 3,959줄 단일 파일이라 스코프 관련 `ReferenceError`가 빌드·200 응답을 통과할 위험이 크다.
13. **`dist-dry/` 잔재** — 2026-05-02자 dry-run 빌드 산출물(`index.js` 154KB + 소스맵)이 레포에 남아 있다. 현재 빌드·배포 경로와 무관하고 오래되어 혼동 요인이다.
14. **응답 스키마 불일치** — 대부분 `{success, data}`인데 감정번역·중재·카톡만 `{success, result}`다. 프론트가 개별 대응 중이나 새 도구 추가 시 실수 유발.
15. **마스터 계정 하드코딩** — `isMasterAccount()`에 이메일이 소스 리터럴로 박혀 있다(마음풀과 동일 패턴이나 3중 관리 지점).

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 최초 작성 — 코드·마이그레이션·wrangler 설정·CLAUDE.md 근거로 전 섹션 작성 (근거 커밋 `719f001`) | Claude |
