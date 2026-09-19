# 마음풀(maumful) 설계서

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음풀 (maumful) |
| 폴더 | `maumful-main/` (Worker `maumful`, maumful.com) |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `edc8aa4` (2026-09-12, "[maumful] 게스트 검사 AI 분석 401을 로그인 안내로 표시") |
| 근거 소스 | `CLAUDE.md`(293줄) · `../CLAUDE.md` · `wrangler.toml` · `package.json` · `src/index.tsx`(6,725줄) · `migrations/0001~0029` · `public/static/*.jsx`(총 18,168줄) · `../TOSS_PAYMENTS_GUIDE.md` |

> README.md · SETUP.md · DEPLOY_CHECKLIST.md 는 2026-04-29 이후 갱신되지 않은 **구버전 문서**다(검사 8종·`psy-app-db`·`phyweb` 폴더명·Babel 빌드 등 현행과 불일치). 본 설계서는 코드·`CLAUDE.md`·마이그레이션을 1차 근거로 삼고, 세 문서는 참고로만 인용한다.

---

## 1. 서비스 개요
- **한 줄 정의**: 심리검사 · AI 상담 · 전문 상담 연결 · 치유 게임을 하나로 묶은 B2C 마음건강 통합 플랫폼(`CLAUDE.md` 서비스 개요).
- **해결하는 문제**: 자기 마음 상태를 표준화된 도구로 가볍게 점검하고(검사 10종), 그 결과를 AI가 본인 어법으로 해석해 주며(AI 해석·통합 심층해석), 이어서 실천(치유 게임)·전문 도움(인근 기관 안내)까지 한 흐름으로 연결한다.
- **타깃 사용자**: 한국어권 일반 성인(B2C). 영어 사용자는 `/api/config/region` 이 `cf-ipcountry`·`accept-language` 로 판별해 글로벌 모드(검사 7종·Stripe·USD)로 분기.
- **핵심 가치 제안**
  - 검사 10종 중 PHQ-9·GAD-7은 **무료**, 가입 즉시 크레딧 지급 → 무료로 경험한 뒤 유료 전환(`CLAUDE.md` "무료로 경험 → 유료 전환", 저가 포지셔닝 지양).
  - 검사 결과를 **서버에 저장하지 않는 원칙**을 유지하면서도 AI 해석·이력 추적을 제공.
  - **검사 ↔ 게임 양방향 루프**: 리포트가 게임을 처방하고, 게임 신호가 검사를 제안한다(`loop_events` 계측).
- **생태계 내 위치**: **마음풀 생태계의 허브이자 본체**. 같은 D1(`maumful-db`)·KV·`JWT_SECRET` 을 게임(`maumgame`)·커플(`maumcouple`)·부부(`maumbubu`)·세대(`maumsedae`)와 공유하고 `?t=` 토큰으로 SSO 한다. 별개 생태계인 **마음수달·마음곁**과는 `MAUM_SSO_SECRET` HMAC 브리지(`/api/maum-sso-token` → 각 서비스 `/api/auth/sso`)로 연결한다. **CTS(jesusmaum.com)는 ~90% 동일한 트윈**이며 본 문서의 기술스택·빌드·크레딧·결제·검증·임상표현 규칙을 공유한다(단 CTS는 2026-07-18부터 유지보수 모드).

---

## 2. 도메인 규칙 (이 서비스 고유)

### 2.1 검사 = 10종 (12종 아님)
`CLAUDE.md` 가 과거 표기 오류를 명시적으로 정정한다. **SCT=SRCI, DSI=SDRI 는 같은 검사의 다른 이름**이라 중복 계수였고, `RBC`·`SDI` 는 **코드에 존재하지 않는다**.

| 코드 | 검사 | 비고 |
|---|---|---|
| PHQ9 / GAD7 | 우울·불안 자가점검 | **무료** |
| DASS21 / BIG5 / LOST | 우울·불안·스트레스 / 성격 5요인 / 상실·애도 | BIG5의 `result_json` = factors 객체 그 자체 |
| SCT(=SRCI) / DSI(=SDRI) | 문장완성 / 자기분화 | 배열 `sdriCompletionQ` · `sdriLikertQ` |
| BURNOUT(K-MBI+) / RIASEC / VALUES | 번아웃 / Holland 직업흥미 / 직업가치관 | |

- 근거 배열 10개: `phq9Q`·`gad7Q`·`dass21Q`·`big5Q`·`lostQ`·`sdriCompletionQ`·`sdriLikertQ`·`burnoutQ`·`RIASEC_Q`·`VALUES_Q`.
- 글로벌(비한국) 모드는 7종만 노출: PHQ9·GAD7·DASS21·BIG5·LOST·RIASEC·VALUES (`/api/config/region`).
- **문항수·표시 동기화·카드 순서 상세는 외부 메모리 `project_maumful_tests` 참조 — 문서화 필요.**

### 2.2 검사 결과 서버 미저장 원칙
`test_history` 는 **수행 메타(검사종류·점수·레벨·언어·시각)만** 남기는 것이 원설계다(0004 주석: "결과 데이터는 저장하지 않음 — 프라이버시"). 이후 `result_json`(0011)·`score`/`level`(0012)·`ai_analysis`(0017)가 추가되었으나, 통합 심층해석은 **저장된 메타만** 사용한다는 원칙을 `CLAUDE.md` 가 유지한다.

### 2.3 크레딧 = 공용 화폐 (단조 감소 규칙)
> **"크레딧은 공용 화폐 → '크레딧 지급 상품'은 크레딧이 많을수록 크레딧당 단가가 같거나 싸야 한다(단조 감소). 어기면 지배당하는 죽은 상품이 됨."** (`CLAUDE.md`)

가격 변경 시 프론트 `PACKAGES_KR`(app.jsx, 표시)과 백엔드 `PACKAGES`(index.tsx, 청구) **두 곳을 동시에** 고쳐야 한다.

### 2.4 AI 해석의 어법 = 본인 대상
해석은 상담사 대상이 아니라 **본인 대상("당신" 어법)**. 또한 프론트가 `whitespace-pre-wrap` 으로 렌더하므로 **AI 출력에 마크다운 금지**(`##`·`**`·`---` 가 그대로 노출된 실버그). 섹션 제목은 `[제목]` 대괄호.

### 2.5 상담센터 어드민 = 의도적 휴면
`counseling_admin.jsx`(`CounselingAdminPage`)와 `/api/admin/counseling/*`·`settlements`·`counselor_earnings` 는 **삭제 금지 휴면 코드**다. `setView('counselingAdmin')` 호출부가 0개이고 `?go=` 도 지원하지 않아 UI 진입 경로가 없다(코드로 재확인: app.jsx 내 `counselingAdmin` 문자열 1회 = 렌더 분기뿐). 상담사 매칭이 법적 보류라 링크만 끊었다. 상세는 외부 메모리 `project_maumful_counseling_admin_dormant` 참조 — 문서화 필요.

### 2.6 커플 정원 = 횟수만 공유
`GET /api/couple/garden`(마음게임 워커 측 엔드포인트 — 마음풀 `src/index.tsx` 에는 없다) 은 두 사람의 게임 실천 **횟수만** 합산한다. 파트너의 감정 기록 내용(emotion·intensity·note)은 **서버가 조회조차 하지 않는다**. 감정 내용 공유는 명시적 동의·철회 UX 없이는 금지(루트 `CLAUDE.md` 금지 항목).

---

## 3. 사용자 플로우

### 시나리오 1 — 신규 방문 → 무료 검사 → 유료 전환
랜딩(`/`, landing.jsx) → 무료 검사(PHQ-9/GAD-7) → 결과 리포트 → AI 해석 → 회원가입(이메일 인증 강제) → 가입 크레딧으로 유료 검사 → 크레딧 소진 → `ChargeView` 상품 선택 → 토스 결제창 → 크레딧 지급 → 재사용.

### 시나리오 2 — 검사 → 게임 → 검사 (양방향 루프)
검사 완료 → 리포트 §다음 단계에서 `gamePrescription(testType, score)` 이 게임 처방 → `openMaumGame(key)` → `game.maumful.com/?t=…&game=<key>` → (게임 측) 30일 신호 축적 → `GET /api/game/test-suggestion`(게임 워커 측) → 허브 `TestSuggestionCard`·주간 메일 CTA → 마음풀 `?go=test:PHQ9` 로 복귀. 각 단계는 `loop_events`(`report_view`·`rx_click`·`suggestion_view`·`suggestion_click`)로 계측되고 어드민 🔁 루프 탭에서 퍼널을 본다.

### 시나리오 3 — 제휴 진입 (SSO)
제휴처 배너 → `/p?p=<코드>&sso_token=` (partner_entry.jsx, 코어 미로드 경량 번들) → `POST /api/auth/partner-sso`(HMAC-SHA256 검증·uid 매칭/자동생성·+20cr·`partner_code` 귀속) → 전환 화면 → 코어 `?go=` 딥링크로 인계. 진입은 `partner_entry_events` 로그(`POST /api/partner/entry-log`).

### 시나리오 4 — 제휴사 정산 자가열람
제휴사 담당자 → `/partner`(partner_portal.jsx, 독립 경량 번들) → `POST /api/partner-portal/login` → `{typ:'partner', pc, aid}` JWT(`sub` 없음) → 자기 정산만 조회.

### 시나리오 5 — 외부 서비스 상품 구매 (통합결제)
마음풀 `ChargeView`(또는 phyweb 에서 `?buy=phyweb:solo` 로 진입) → 토스 결제 → 성공 시 `deliverGrant` → `external_grants` 큐 기록 → `signSso` 서명 후 대상 서비스 `POST /api/grant` → 쿠폰형(phyweb)은 응답 `code` 저장 + 이메일 발송 + `GrantCodeModal` 노출.

### 화면 구성 (파일 단위)
| 파일 | 줄수 | 역할 | 주요 컴포넌트 |
|---|---|---|---|
| `public/static/app.jsx` | 12,693 | 코어 SPA. 검사·리포트·AI 채팅·마이페이지·결제·마스터 어드민 | `PsychologicalTestSystem`(대부분의 화면을 담는 클로저), `ChatBox`, `ChargeView`, `AiAnalysisBox`, `CbtPlanCard`, `TrendPredictionCard`, `ExternalResultSection`, `CouponCard`, `GrantCodeModal`, `PhywebCodesCard`, `LegalPage`, `SessionList`, `MasterDebugPanel`/`MasterPartnerPanel`/`MasterCouponPanel`/`MasterNoticePanel`, `WatermarkOverlay`, `SignupVerifyModal`, `CookieBanner`, `Google/Kakao/NaverLoginBtn` |
| `public/static/landing.jsx` | 2,273 | 홈 랜딩 + 글로벌 네비 + 검사 소개 | `LandingPage`, `GlobalNav`, `TestsIntroPage`, `TEST_META`, `MfSnsHeroBtn`/`MfSnsFooter` |
| `public/static/counseling.jsx` | 1,268 | 상담센터 플랫폼(예약·결제·화상·리뷰·인근기관 지도) | `CounselingPage`, `BookingModal`, `VideoRoom`, `MyAppointments`, `ReviewModal`, `NearbyMapModal`, `OnboardingForm` |
| `public/static/counseling_admin.jsx` | 1,578 | 상담 어드민 대시보드 — **의도적 휴면(진입 링크 없음)** | `CounselingAdminPage`, `AdminOverview/Users/Onboarding/Centers/Counselors/Appointments/Settlements/Reviews/Partners/ErrorLogs` |
| `public/static/partner_entry.jsx` | 145 | `/p` 제휴 진입 레이어(config 구동·경량) | `PartnerEntry` |
| `public/static/partner_portal.jsx` | 211 | `/partner` 제휴사 정산 포털(경량·격리) | `PartnerPortal`, `Login`, `Dashboard` |

- 코어 뷰 전환값(`setView`): `landing`, `testsIntro`, `memberLogin`, `memberSignup`, `memberOnboarding`, `memberDashboard`, `myPage`, `aiCounsel`, `counseling`, `lostTest`, `dsiTest`, `testReport`, `notices`, `admin`, `partnerIntro`, `partnerComplete`, `terms`, `privacy`, `forgotPassword`, `resetPassword` (+ 진입 링크 없는 `counselingAdmin`).
- `PROTECTED_VIEWS` 에 속한 화면은 `WatermarkOverlay`(사용자 이메일 워터마크) + 개발자도구 감지 레이어가 붙는다(검사 문항 보호).

---

## 4. 기능 명세

| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 심리검사 10종 | 문항·채점·레벨 산출. PHQ-9·GAD-7 무료, 나머지 10cr | 배포됨 | app.jsx 문항 배열 / `POST /api/test/start`·`save-score`·`save-result` |
| 2 | 검사 리포트 | 점수·레벨·추이·다음 단계(게임 처방) | 배포됨 | `GET /api/test/report` (index.tsx:1414) |
| 3 | AI 단일 해석 | SSE 스트리밍, sonnet-4-6 우선·haiku 폴백, temp 0.3 | 배포됨 | `POST /api/ai-analyze` |
| 4 | AI 통합 심층해석 | 서로 다른 검사 2개 이상 결합, temp 0.4, max_tokens 2400, 첫 1회 무료 후 40cr 선결제 | 배포됨 | `POST /api/ai-analyze/integrated` |
| 5 | AI 해석 피드백 | 👍/👎 + 사유, 어드민 지표 | 배포됨 | `POST /api/ai-feedback`, `GET /api/admin/feedback-metrics`, `ai_feedback`(0023·0025) |
| 6 | AI 채팅 상담 | 4트랙 프롬프트(한/영 × 일반/기독교), SSE, `[MOOD:N]` 태그 | 배포됨 | `POST /api/ai-chat` (index.tsx:2733) |
| 7 | 핸즈프리 음성 상담 | 연속 음성인식 + 답변 자동 TTS + 에코 필터 | 배포됨 | app.jsx `ChatBox` |
| 8 | AI 채팅 메모리 | 대화 맥락 조회·삭제 | 배포됨 | `GET`/`DELETE /api/ai-chat/memory` |
| 9 | 감정 추적(Mood) | `[MOOD:N]` 추출 → 로그, 14~90일 트렌드 | 배포됨 | `POST /api/chat/mood-log`, `GET /api/chat/mood-trend`, `mood_logs`(0020) |
| 10 | 게임 행동 데이터 결합 | `game_session_logs`·`user_game_status` 30일 집계를 통합해석·리포트에 주입 | 배포됨 | `buildGameSummary(DB,userId)` |
| 11 | 검사→게임 처방 | `gamePrescription(testType,score)` → 게임 딥링크 | 배포됨 | app.jsx + `GET /api/game-token` |
| 12 | 루프 계측 | `report_view`·`rx_click` 등 4종 이벤트, 어드민 퍼널 | 배포됨 | `POST /api/loop-event`, `GET /api/admin/loop-metrics`, `loop_events`(0024) |
| 13 | 외부 검사 결과 입력 | 점수 직접 입력 | 배포됨 | `POST /api/test/external-result` |
| 14 | PDF 업로드 AI 해석 | pdf.js 추출 → AI 해석, 3cr | 배포됨 | `POST /api/test/analyze-pdf` |
| 15 | CBT 8주 플랜 | PHQ9·GAD7·BURNOUT·DASS21 이력 있을 때만, 최초 1회 생성 | 배포됨 | `GET /api/test/cbt-plan`, app.jsx `CbtPlanCard` |
| 16 | 추이 예측 | 검사 추이 기반 예측 카드 | 배포됨 | `GET /api/test/trend-prediction`, `TrendPredictionCard` |
| 17 | 일일 컨텍스트 | 대시보드용 요약 | 배포됨 | `GET /api/user/daily-context` |
| 18 | 인근 상담기관 찾기 | Kakao Maps SDK + 카테고리 검색, 24시간 무료상담 안내 | 배포됨 | `GET /api/nearby-counseling`, counseling.jsx `NearbyMapModal` |
| 19 | 상담 예약·결제·화상 | 슬롯 조회 → 예약 → 토스 결제 → Jitsi 룸 | 구현·미배포(진입 보류) | `/api/counseling/*`, counseling.jsx |
| 20 | 상담 어드민 | 센터·상담사·예약·정산·온보딩·리뷰 관리 | 보류(의도적 휴면) | counseling_admin.jsx, `/api/admin/counseling/*` |
| 21 | 크레딧 결제(토스) | SDK v1 카드 팝업 → confirm → 지급 | 배포됨(라이브) | `/api/payment/toss/*`, `/api/webhook/toss` |
| 22 | 크레딧 결제(Stripe) | 글로벌 USD | ⚠️ 미확인(코드는 존재, 라이브 여부 미확인) | `/api/payment/stripe/*`, `/api/webhook/stripe` |
| 23 | 고객 셀프 환불 | 7일 이내·미사용·전액환불만 | 배포됨 | `POST /api/credits/refund` (index.tsx:1126) |
| 24 | 구독(정기결제) | 베이직/스탠다드/프로 월정액, 매월 1일 Cron 자동갱신 | 구현·미배포(별도 계약 대기) | `/api/subscription/*`, `handleScheduled` |
| 25 | 통합결제 grant | 수달·곁·phyweb 상품을 마음풀에서 판매 → 서명 grant 전달 | 배포됨(수달·곁 라이브) | `deliverGrant`, `external_grants`(0029), `/api/admin/deliver-pending-grants` |
| 26 | 쿠폰 | 크레딧 지급 쿠폰(단일/캠페인), 어드민 발행 | 배포됨 | `/api/coupon/redeem`, `/api/admin/coupon/*`, `coupons`(0022) |
| 27 | 친구 초대(referral) | 초대 코드 발급·적용·목록 | 배포됨 | `/api/referral/*`, `referrals`(0009) |
| 28 | 제휴코드 수익 쉐어 | 결제 시 `accruePartnerCommission` 적립(charge_id PK 멱등·rate 스냅샷), 어드민 🤝 탭 CSV | 배포됨(실적립은 결제 발생분부터) | index.tsx:4058~, `/api/admin/partner-*` |
| 29 | 제휴사 정산 포털 | 담당자 자가열람(`typ:'partner'` JWT, IDOR 차단) | 배포됨 | `/partner`, `/api/partner-portal/*`, `partner_accounts`(0028) |
| 30 | 제휴 SSO 온보딩 | 제휴처 로그인 유저 무마찰 진입 + 20cr | 배포됨 | `POST /api/auth/partner-sso`, `/p`, `partner_entry_events`(0027) |
| 31 | 소셜 로그인 | Google(GSI) · Kakao(REST 콜백) · Naver(콜백) | 배포됨 | `/api/auth/google`·`kakao/*`·`naver/*` |
| 32 | 이메일 인증 강제 | 신규 이메일가입만. 소셜 면제, 기존 회원 그랜드파더링. verify 링크 멱등 + HTML 응답 | 배포됨 | `/api/auth/verify/:token`, `/api/auth/resend-verify` |
| 33 | 마음 시리즈 SSO 허브 | 게임·커플·부부·세대 `?t=` 토큰 / 수달·곁 HMAC 브리지 | 배포됨 | `/api/game-token`·`couple-token`·`bubu-token`·`sedae-token`·`maum-sso-token` |
| 34 | 웹푸시 알림 | VAPID 자체 구현(암호화·JWT 서명) | 배포됨 | `/api/push/vapid-key`·`subscribe`, `push_subscriptions`(0014) |
| 35 | 6주 경과 검사 재알림 | PHQ9/GAD7 42일 경과자에게 푸시 | 구현·미배포(Cron 미연결) | `handleDailyReminder` — 수동 트리거 `POST /api/admin/push/reminder` 로만 실행 |
| 36 | 공지사항 | 공개 조회 + 어드민 CRUD | 배포됨 | `/api/notices`, `/api/admin/notices/*`, `notices`(0026) |
| 37 | 에러 로그 | 전역 `app.onError` → `error_logs` 저장, 최근 500건 유지 | 배포됨 | index.tsx:55~, `/api/admin/error-logs`, `error_logs`(0013) |
| 38 | 클라이언트 에러 수집 | 프론트 런타임 에러 리포트 | 배포됨 | `/api/debug/client-error(s)` |
| 39 | 마스터 어드민 패널 | `limyj007@gmail.com` 전용. 디버그·파트너·쿠폰·공지 | 배포됨 | app.jsx `MASTER_EMAILS`(12620) |
| 40 | 쿠키 동의 | EU 대응 배너 + 서버 저장 | 배포됨 | `/api/user/cookie-consent`, app.jsx `CookieBanner`·`EU_COUNTRIES` |
| 41 | 검사 문항 보호 | 워터마크 + 개발자도구 감지(터치기기 제외) | 배포됨 | app.jsx `PROTECTED_VIEWS`·`WatermarkOverlay` |
| 42 | PWA | manifest + Service Worker + assetlinks(Android TWA) | 배포됨 | `public/manifest.json`·`sw.js`, `/.well-known/assetlinks.json` |
| 43 | 지자체 화이트라벨 | 멀티테넌트 `organizations` + `users.org_id` + `/api/org-config` | 설계만 | 미구현(외부 메모리 `project_whitelabel_gov` 참조 — 문서화 필요) |
| 44 | 제휴 진입 레이어 고도화 | config 구동 A/B, 어드민 편집 즉시반영 | 설계만 | 외부 메모리 `project_maumful_partner_entry` 참조 — 문서화 필요 |
| 45 | 통합해석 유료 상품화 확장 | 토스 실결제 반영 후 착수 | 보류 | 외부 메모리 `project_maum_unified_payment` 참조 — 문서화 필요 |

---

## 5. 아키텍처
- **스택**
  - 백엔드: **Hono.js 4.x (TypeScript) on Cloudflare Workers** — 단일 파일 `src/index.tsx` 6,725줄에 API 전체가 들어 있다.
  - 프론트: **React 18 (UMD, unpkg CDN)** + JSX **esbuild 사전 컴파일**(`@babel/standalone` 제거 완료). 번들링 없이(`--bundle=false`) 파일별 트랜스파일만 한다.
  - 스타일: **Tailwind 정적 빌드**(`tailwind.src.css` → `public/static/tailwind.css`). CDN(`cdn.tailwindcss.com`)은 2026-08-08 제거.
  - DB/캐시: Cloudflare **D1**(`maumful-db`, id `f8046693-876a-4ae4-b734-20c515f9994f`) + **KV**(id `9f7426807e...`).
  - AI: **Anthropic Claude** — 기본 모델 `claude-sonnet-4-6`(`env.AI_MODEL` 로 교체 가능), 폴백 `claude-haiku-4-5-20251001`.
- **워커명 / 도메인**: Worker `maumful` / `https://maumful.com` (`vars.SERVICE_URL`).
- **프론트 빌드 방식**
  ```bash
  npm run build:jsx    # esbuild → public/static/compiled/{app,landing,counseling,counseling_admin,partner_entry,partner_portal}.js
  npm run build:css    # tailwindcss --minify → public/static/tailwind.css
  npm run build:assets # 위 둘
  npm run deploy       # build:assets && wrangler deploy
  ```
  - ⚠️ 컴파일 결과물 6개는 **일반 `<script>` 로 동일 전역 스코프**를 공유 → 전역 `const` 이름 충돌 시 `SyntaxError`.
  - ⚠️ 새 Tailwind 클래스(특히 arbitrary value `text-[..]`·동적 색상) 추가 시 `npm run build:css` 재생성·커밋 필수(Cloudflare 빌드스텝 없음 → 컴파일본·CSS 모두 레포에 커밋해 서빙).
  - ⚠️ 프론트 헬퍼는 **사용 컴포넌트 스코프에 정의**. 배포 전 `node scripts/render_smoke.cjs public/static/compiled/landing.js` 로 렌더 검증(빌드 성공·HTTP 200은 런타임 `ReferenceError` 를 못 잡는다).
- **AI 호출 경로**: 기본은 Cloudflare **AI Gateway** (`gateway.ai.cloudflare.com/v1/313b6305.../maumful/anthropic/v1/messages`). `env.AI_PROXY_URL` 이 설정되면 **전용 egress 프록시**(고정 IP)로 전환된다(2026-08-29, 시크릿만 지우면 즉시 원복).
- **외부 API**: Anthropic · 토스페이먼츠 · Stripe · Resend(메일) · Kakao(로그인·Maps) · Naver(로그인) · Google(GSI) · Jitsi Meet(화상) · 각 마음 시리즈 워커 `/api/grant`.
- **구성도**
```
브라우저(React 18 UMD) ─▶ Cloudflare Worker "maumful" (Hono, src/index.tsx, 154 routes)
   ├ /         → SPA HTML (app.js / landing.js / counseling.js / counseling_admin.js)
   ├ /p        → partner_entry.js      ├ /partner → partner_portal.js
   └ /api/*    → JSON · SSE
        │
        ├─ D1 maumful-db ── 같은 DB·KV·JWT_SECRET 공유 ──┬─ maumgame   (game.maumful.com)   ?t= SSO
        ├─ KV (세션키·rate·무료횟수)                     ├─ maumcouple (couple.maumful.com) ?t= SSO
        ├─ Assets (public/)                              ├─ maumbubu   (bubu.maumful.com)   ?t= SSO
        │                                                └─ maumsedae  (sedae.maumful.com)  ?t= SSO
        └─ 외부 API ─ Anthropic(AI Gateway 또는 AI_PROXY_URL) · 토스 · Stripe ·
                      Resend · Kakao(로그인·Maps) · Naver · Google GSI · Jitsi
                      · MAUM_SSO_SECRET HMAC + /api/grant ▶ maumotter.com · maumgyeot.com · phyweb
```

---

## 6. 데이터 모델 (D1 `maumful-db`)

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `users` | 회원 | id, email(UNIQUE), password_hash(소셜=NULL), social_provider/id, nickname, locale, country_code, **credits**(기본 45), is_email_verified, email_verify_token, pw_reset_token, partner_code, 동의 5종(terms/privacy/marketing/consent_ip), gender·age_range·phone | 0004에서 `users_v2` 로 재생성 후 rename. 0018·0019·0021이 컬럼 추가 |
| `credit_transactions` | 크레딧 원장 | user_id, **type CHECK(gain\|spend)**, amount(항상 양수), reason, balance_after, ref_id | ⚠️ 차감·환불도 반드시 `'spend'`. `'loss'` 쓰면 CHECK 위반 500(실사고) |
| `credit_charges` | 유료 충전/결제 건 | user_id, package_key, credits, amount, currency, pg(toss\|stripe), pg_tid, **status CHECK(pending\|completed\|failed\|refunded)**, partner_code, completed_at | 지급 근거의 단일 출처(웹훅 metadata 아님) |
| `test_history` | 검사 수행 이력 | user_id, test_type, lang, score, level, result_json, ai_analysis, source(기본 'internal'), performed_at | 원설계는 메타만 저장. 0011·0012·0016·0017이 컬럼 추가 |
| `mood_logs` | AI 채팅 감정 점수 | user_id, mood_score(0~100), test_type, created_at | 0020 |
| `ai_feedback` | AI 해석 👍/👎 | +reason(0025) | 0023·0025 |
| `loop_events` | 검사↔게임 루프 계측 | report_view·rx_click·suggestion_view·suggestion_click | 0024. fire-and-forget |
| `chat_sessions` | AI 상담 세션 | | 0004·0008 |
| `coupons` / `coupon_redemptions` | 쿠폰 발행·사용 | | 0022 |
| `referrals` | 친구 초대 | referrer_id, referee_id, completed_at | 0004·0008·0009 |
| `auth_tokens` | refresh 토큰 등 | | 0004 |
| `error_logs` | 서버 에러 | service, status_code, method, path, message, stack, user_id | 0013. 최근 500건만 유지 |
| `notices` | 공지 | title, content, is_important, is_published | 0026 |
| `push_subscriptions` | 웹푸시 구독 | service('maumful' 등), endpoint, p256dh, auth | 0014 |
| `partners` | 제휴사 | code(PK), name, **sso_secret**, **revenue_share_rate**, welcome_message, featured_tests, primary_color, logo_url, contact_email, is_active, + entry_* 5종(0027) | 0018·0027 |
| `partner_accounts` | 제휴사 담당자 계정 | partner_code, 로그인 자격 | 0028 |
| `partner_entry_events` | 제휴 진입 로그 | | 0027 |
| **`partner_commissions`** | 제휴 정산 원장 | charge_id(PK·멱등), partner_code, user_id, charge_amount, **rate(적립 시점 스냅샷)**, share_amount, currency, status(pending\|settled\|reversed), settled_at, settlement_ref | ⚠️ **`migrations/` 에 CREATE TABLE 이 없다**(코드만 INSERT/UPDATE). 15장 리스크 참조 |
| `external_grants` | 외부 서비스 지급 큐 | order_id(PK `mf_charge_<id>`), user_id, email, service, grant_type, amount, status(pending\|delivered\|failed), **code**(쿠폰형 응답), attempts, delivered_at | 0029. 0029 주석이 "CREATE가 어디에도 없어 수달·곁 grant가 실제론 실패 상태였다"고 기록 |
| `user_subscriptions` / `subscription_invoices` | 월정액 구독·청구 | plan_key, billing_key, customer_key, next_billing_date, status(active\|past_due) | 0007 |
| `subscriptions` / `payments` / `usage_history` / `api_settings` / `schema_migrations` | 0001~0003 구스키마 | | 대부분 레거시. `api_settings` 만 어드민 API 설정에서 사용 |
| `counseling_centers` / `counselors` / `counselor_schedules` / `appointments` / `counseling_reviews` / `settlements` / `counselor_earnings` / `center_onboarding_requests` | 상담센터 플랫폼 | 0005·0006·0015 | **의도적 휴면**(§2.5) |
| `couple_sessions` | 커플 세션 | | 0010. 마음커플 워커와 공유 |

- **마이그레이션 파일 수**: 29개 (`0001_initial_schema.sql` ~ `0029_external_grants.sql`).
- **다른 서비스와 공유하는 테이블**: 같은 `maumful-db` 안에 마음게임의 `game_session_logs`·`user_game_status`·`game_email_prefs`·`weekly_reports`·`user_test_scores` 와 마음커플의 `couple_sessions` 가 함께 존재한다. 마음풀은 게임 테이블을 **읽기 전용**으로 참조한다(`buildGameSummary`).
- ⚠️ **원격 마이그레이션 트랩**: 원격 `maumful-db` 는 마이그레이션 트래킹 테이블이 비어 있어 `wrangler d1 migrations apply --remote` 가 0001부터 재적용을 시도하다 **기존 스키마와 충돌해 실패**한다. 신규 마이그레이션은 반드시
  `npx wrangler d1 execute maumful-db --remote --file=migrations/00NN_*.sql` 로 **직접 적용**하고, DDL은 `IF NOT EXISTS` 로 멱등하게, **영문 DDL만**(한글 주석 금지) 작성한다. 계정 `limyj007`.

---

## 7. API 계약

총 **154개 라우트**(`app.get/post/put/delete/patch`), 그중 `/api/*` 가 150개. 아래는 기능군 요약이며, **결제·크레딧·제휴 정산·통합결제 grant 는 계약이 중요하므로 개별 나열**한다.

### 7.1 기능군 요약
| 기능군 | 대표 경로 | 개수 | 인증 |
|---|---|---|---|
| 인증·계정 | `/api/auth/*` (register·login·refresh·logout·verify·resend-verify·forgot/reset/change-password·google·kakao/url·kakao/callback·naver/url·naver/callback·partner-sso) | 16 | 공개 / 일부 Bearer |
| 사용자 | `/api/user/*` (me GET·PATCH·DELETE, credits, daily-context, cookie-consent GET·POST) | 7 | Bearer |
| 검사 | `/api/test/*` (start·history·save-score·save-analysis·save-result·report·recent-summary·external-result·analyze-pdf·cbt-plan·trend-prediction) | 11 | Bearer |
| AI 해석 | `/api/ai-analyze`, `/api/ai-analyze/integrated`, `/api/ai-feedback` | 3 | Bearer · SSE |
| AI 채팅 | `/api/ai-chat`, `/api/ai-chat/memory` GET·DELETE, `/api/chat/mood-log`, `/api/chat/mood-trend` | 5 | Bearer(비회원 3회 허용) |
| 마음 시리즈 토큰 | `/api/game-token`·`couple-token`·`bubu-token`·`sedae-token`·`maum-sso-token` | 5 | Bearer |
| 상담센터(고객) | `/api/counseling/*` (centers·counselors·slots·appointments prepare/목록/상세/취소·toss success·fail·reviews·onboarding) + `/api/nearby-counseling` | 13 | 혼합 |
| 구독 | `/api/subscription/*` (plans·me·checkout·toss/success·cancel) | 5 | Bearer |
| 초대 | `/api/referral/*` (code·apply·list) | 3 | Bearer |
| 쿠폰 | `/api/coupon/redeem` | 1 | Bearer |
| 공지 | `/api/notices` | 1 | 공개 |
| 푸시 | `/api/push/vapid-key`, `/api/push/subscribe` | 2 | 혼합 |
| 디버그 | `/api/debug/client-error(s)` | 2 | 혼합 |
| 설정 | `/api/config/region` | 1 | 공개 |
| 루프 계측 | `/api/loop-event` | 1 | Bearer |
| 파트너 진입 | `/api/partner/config`, `/api/partner/entry-log` | 2 | 공개 |
| 웹훅 | `/api/webhook/toss`, `/api/webhook/stripe` | 2 | PG 검증 |
| **어드민** | `/api/admin/*` (stats·users·payments·api-settings·error-logs·test-ai·notices·coupon·loop-metrics·feedback-metrics·partners·partner-stats/settlement/commissions/accounts·push/reminder·deliver-pending-grants·counseling/*) | 56 | `adminGuard`(IP + `ADMIN_SECRET`) |
| 페이지·기타 | `/`, `/p`, `/partner`, `/.well-known/assetlinks.json` | 4 | 공개 |

### 7.2 결제 (개별 나열)
| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/payment/toss/client-key` | Bearer | 브라우저용 `TOSS_CLIENT_KEY` 전달 |
| POST | `/api/payment/toss/checkout` | Bearer | `credit_charges` pending 생성 → `{clientKey, customerKey:'app_user_<id>', orderId:'charge_<chargeId>_<ts>', orderName, amount, customerName, customerEmail, successUrl, failUrl}` 반환 |
| GET | `/api/payment/toss/success` | 쿼리(paymentKey·orderId·amount·chargeId) | 토스 `POST /v1/payments/confirm` 승인 → `UPDATE credit_charges … WHERE id=? AND status='pending'` 원자적 선점 → 크레딧 지급 → 영수증 메일 → `deliverGrant` → 302 `/?payment=success` |
| GET | `/api/payment/toss/fail` | 쿼리 | 실패 처리·리다이렉트 |
| POST | `/api/webhook/toss` | 선택적 시크릿 + **재조회 검증** | 이중지급 방지 보조. ①(선택) 헤더가 오면 대조 ② 토스 `GET /v1/payments/{paymentKey}` 로 실제 결제·`totalAmount` 재확인(**진짜 검증**). 페이로드는 `body.data ?? body` 양쪽 파싱 |
| POST | `/api/payment/stripe/checkout` | Bearer | 글로벌 USD 결제 세션 |
| GET | `/api/payment/stripe/verify` | 쿼리 | Stripe 결제 검증·지급 |
| POST | `/api/webhook/stripe` | `STRIPE_WEBHOOK_SECRET` | Stripe 웹훅 |
| POST | `/api/credits/prepare-charge` | Bearer | 충전 사전 준비 |
| POST | `/api/credits/notify-plan` | Bearer | 플랜 문의 알림 |
| **POST** | **`/api/credits/refund`** | Bearer | **고객 셀프 환불**. `{pgTid}`. 소유·7일 이내·`completed`·잔액≥구매크레딧 검증 → 외부서비스 상품 차단 → `completed→refunded` 원자 선점 → 크레딧 회수 → 토스 `POST /v1/payments/{paymentKey}/cancel` → 실패 시 전부 롤백 → 성공 시 원장(`type='spend'`) + `reversePartnerCommission`. **전액환불만**(부분환불 없음) |
| POST | `/api/admin/payments/:id/refund` | adminGuard | 어드민 환불 — **토스 취소 없이 크레딧만 회수**(돈은 콘솔 수동). 고객 환불과 동작이 다름 |
| GET | `/api/admin/payments` | adminGuard | 결제 내역 조회 |

### 7.3 구독(정기결제)
| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/subscription/plans` | 공개 | `SUBSCRIPTION_PLANS` (베이직 60cr/₩3,900 · 스탠다드 150cr/₩8,900 · 프로 400cr/₩19,900) |
| GET | `/api/subscription/me` | Bearer | 활성 구독 1건 |
| POST | `/api/subscription/checkout` | Bearer | 토스 **빌링키 발급** 흐름 시작 |
| GET | `/api/subscription/toss/success` | 쿼리 | 빌링키 저장·구독 활성화 |
| DELETE | `/api/subscription/cancel` | Bearer | 구독 해지 |

### 7.4 통합결제 grant (외부 서비스 지급)
| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| (내부 함수) | `deliverGrant(env, charge)` | — | `PACKAGES[key].service` 가 있으면: `external_grants` 에 `order_id='mf_charge_<chargeId>'` UPSERT(pending) → `signSso(MAUM_SSO_SECRET, {email, service, grantType, orderId, amount, exp})` → `POST {SERVICE_API[service]}/api/grant` → 200이면 `status='delivered'`(+쿠폰형은 응답 `code` 저장·메일 발송), 아니면 `failed`+`attempts++` |
| GET | `/api/payment/grant-code?chargeId=` 또는 `?service=` | Bearer | 방금 결제분의 지급 상태·쿠폰코드 조회(본인 것만) |
| GET | `/api/payment/my-grant-codes` | Bearer | 내 외부서비스 이용권 코드 목록(최대 50, `credit_charges` LEFT JOIN) |
| POST | `/api/admin/deliver-pending-grants` | adminGuard | 미전달·실패분 재시도 |
| GET | `/api/maum-sso-token` | Bearer | 로그인 유저 이메일을 `MAUM_SSO_SECRET` 로 HMAC 서명(`payload_b64u.sig`, 유효 5분) → 수달·곁 진입용 |

- `SERVICE_API` = `{ otter: 'https://maumotter.com', gyeot: 'https://maumgyeot.com', phyweb: 'https://phyweb.pages.dev' }`
- 멱등: `order_id` PK. 미설정 시크릿·이메일 없으면 **pending 유지**(재시도 대상)로 남기고 결제는 유지한다.

### 7.5 제휴(파트너) 정산
| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| (내부 함수) | `accruePartnerCommission(charge)` | — | 결제 완료 시 비차단 `.catch` 로 `INSERT OR IGNORE INTO partner_commissions (charge_id, partner_code, user_id, charge_amount, rate, share_amount, currency)` — **charge_id PK 멱등 · 적립 시점 rate 스냅샷** |
| (내부 함수) | `reversePartnerCommission(chargeId)` | — | `UPDATE partner_commissions SET status='reversed' WHERE charge_id=? AND status!='settled'` (환불 시) |
| GET | `/api/admin/partners` | adminGuard | 제휴사 목록 |
| POST | `/api/admin/partners` | adminGuard | 제휴사 등록(**`sso_secret` 필수**) |
| PATCH | `/api/admin/partners/:code` | adminGuard | 제휴사 수정(rate·기간·진입 config) |
| GET | `/api/admin/partner-stats` | adminGuard | 제휴 유입·전환 통계 |
| GET | `/api/admin/partner-settlement` | adminGuard | 정산 집계 |
| GET | `/api/admin/partner-commissions` | adminGuard | 정산 원장 조회(기간·상태 필터, 개인정보 마스킹, CSV) |
| POST | `/api/admin/partner-commissions/settle` | adminGuard | 기간 정산 완료 처리(`status='settled'`, `settled_at`, `settlement_ref`) |
| GET/POST/PATCH/DELETE | `/api/admin/partner-accounts(/:id)` | adminGuard | 제휴사 담당자 계정 CRUD |
| POST | `/api/partner-portal/login` | 공개 | 담당자 로그인 → `{typ:'partner', pc, aid}` JWT(**`sub` 없음**) |
| GET | `/api/partner-portal/me` | partner JWT | 담당자·제휴사 정보 |
| GET | `/api/partner-portal/commissions` | partner JWT | **자기 파트너 코드 정산만**. 가드 `requirePartner` 가 조회코드를 **토큰에서만** 취함(IDOR 차단) |
| POST | `/api/auth/partner-sso` | 공개(HMAC) | 제휴 SSO 자동 로그인. 토큰=`base64url(payload).base64url(HMAC-SHA256(sso_secret, payloadB64))`, payload=`{uid,email?,nick?,exp}` → 계정 매칭/자동생성 → **+20cr** · `partner_code` 귀속 |
| GET | `/api/partner/config?p=<code>` | 공개 | 진입 레이어 config(헤드라인·서브카피·혜택·CTA·색상·로고) |
| POST | `/api/partner/entry-log` | 공개 | 진입 이벤트 기록 |

### 7.6 크레딧
| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/user/credits` | Bearer | 잔액 + 내역 |
| POST | `/api/coupon/redeem` | Bearer | 쿠폰 크레딧 지급 |
| POST | `/api/admin/users/:id/credits` | adminGuard | 수동 크레딧 조정 |
| (내부 함수) | `spendCredits(db,userId,amount,reason,refId?)` | — | **레이스 방지**: `UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?` 단일 UPDATE. `meta.changes===0` 이면 잔액 부족 |
| (내부 함수) | `gainCredits(...)` | — | 지급 + `credit_transactions` 원장 |

---

## 8. 인증 / 세션
- **인증 방식**: 자체 발급 **JWT (HS256)** + Bearer 헤더. 프론트는 `localStorage`(`access_token`·`refresh_token`·`current_user`)에 보관하고 `/api/auth/refresh` 로 갱신한다.
- **JWT 시크릿**: `getJwtSecret(kv)` 가 **KV 키 `JWT_SECRET`** 에서 읽는다(Workers secret 이 아니다). 미설정 시 `'dev_secret_change_in_production'` 폴백 → 15장 리스크 참조.
- **토큰 구조 — 3종이 공존한다**
  1. **고객 토큰**: `payload.sub` = 숫자 user_id. `getAuthUserId()` 는 `typeof payload.sub === 'number'` 일 때만 통과.
  2. **관리자**: JWT가 아니라 **고정 시크릿** `ADMIN_SECRET` 을 Bearer 로 보낸다. `adminGuard = isAdminIp() + requireAdmin()` — `ADMIN_ALLOWED_IPS`(콤마 구분, 미설정 시 전체 허용) 통과 후 시크릿 대조. 실패 시 `Forbidden`=403 / 그 외 401.
  3. **파트너 토큰**: `{typ:'partner', pc, aid}` — **`sub` 없음**. 고객 API는 `sub` 숫자 요구라 거부, 관리자 API는 고정 시크릿이라 분리된다(타 파트너·전체매출 접근 불가, E2E 실증).
  - 추가로 프론트 **마스터**는 서버 권한이 아니라 클라이언트 이메일 화이트리스트(`MASTER_EMAILS = ['limyj007@gmail.com']`)로 패널 표시만 제어한다.
- **비밀번호**: `verifyPassword()` 자체 구현(해시 방식 상세는 `src/index.tsx:149`).
- **이메일 인증**: 신규 이메일가입만 강제. 미인증 로그인은 403 `requiresVerification` → 프론트가 재발송 안내. **소셜 로그인은 면제**(가입 시 `verified=1`), 기존 회원은 그랜드파더링. ⚠️ `GET /api/auth/verify/:token` 은 메일 클라이언트·보안 스캐너 **프리페치**에 대비해 **멱등**(이미 인증됨도 성공 안내)이고 raw JSON 대신 **HTML 페이지**를 반환한다. 상세는 외부 메모리 `project_maumful_email_verify` 참조 — 문서화 필요.
- **소셜 로그인**: Google(GSI 토큰 검증) / Kakao(REST 서버사이드 콜백, redirect URI `https://maumful.com/api/auth/kakao/callback`, ⚠️ **클라이언트 시크릿 "사용 안 함" 필수**) / Naver(콜백). Kakao 는 `gender`·`age_range` 권한이 없어 이메일 가입폼에서만 수집. 상세는 외부 메모리 `project_kakao_login` 참조 — 문서화 필요.
- **SSO 연동**
  - **같은 생태계**(게임·커플·부부·세대): `/api/{game,couple,bubu,sedae}-token` 이 발급한 토큰을 `?t=` 로 전달, 대상 워커가 **공유 KV의 `JWT_SECRET`** 으로 검증.
  - **별개 생태계**(수달·곁): `/api/maum-sso-token` HMAC 서명(5분) → `maumotter.com/?sso=` → 수신측 `POST /api/auth/sso` 가 `verifySso` 후 **이메일로 maum-auth 계정 연결/생성**. **결제는 각 서비스 자체 유지, 계정만 연결.** `MAUM_SSO_SECRET` 은 마음풀·수달·곁 **3곳 동일값 필수**. 미설정 시 발급 503 → 프론트는 일반 링크 폴백(기존 무영향).
  - **제휴처 → 마음풀**: `/api/auth/partner-sso` (§7.5). ⚠️ `sso_token` 은 exp 짧게·**클릭 시점 발급**(고정 href 금지).
- **레이트 리밋**: KV 기반 고정 윈도우(`rl:{key}:{bucket}`) — 인증 IP당 분당 10 / AI 유저당 분당 20 / 일반 IP당 분당 60.

---

## 9. 외부 연동

| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic Claude | AI 해석·채팅·PDF 해석·CBT·추이예측 | `ANTHROPIC_API_KEY`, `AI_MODEL`(기본 `claude-sonnet-4-6`), `AI_PROXY_URL`(선택) | 배포됨 |
| Cloudflare AI Gateway | AI 호출 경유(기본 경로) | 계정 게이트웨이 URL 하드코딩 | 배포됨 |
| 전용 egress 프록시 | AI 호출 고정 IP 경유(403 차단 대응) | `AI_PROXY_URL` | 구현·조건부(미설정 시 게이트웨이 폴백) |
| 토스페이먼츠 | KRW 카드 결제·취소 | `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `TOSS_BILLING_KEY`(구독), `TOSS_WEBHOOK_SECRET`(**선택**) | **라이브 가동**(2026-07-22) |
| Stripe | USD 글로벌 결제 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 구현됨 / ⚠️ 라이브 여부 미확인 |
| Resend | 인증·비밀번호·영수증·쿠폰코드 메일 | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | 배포됨 |
| Kakao 로그인 | 소셜 로그인 | `KAKAO_REST_API_KEY`, `KAKAO_APP_KEY` | 배포됨 |
| Kakao Maps SDK | 인근 상담기관 지도 | counseling.jsx `KAKAO_JS_KEY` | 배포됨 |
| Naver 로그인 | 소셜 로그인 | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 배포됨 |
| Naver 서치어드바이저 | 사이트 소유 확인 | `NAVER_SITE_KEY` | 배포됨 |
| Google Sign-In (GSI) | 소셜 로그인 | `GOOGLE_CLIENT_ID` | 배포됨 |
| Google Analytics 4 | 트래킹 | `GA_MEASUREMENT_ID` | 배포됨 |
| Web Push (VAPID) | 브라우저 푸시(자체 암호화 구현) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | 배포됨 |
| Jitsi Meet | 화상 상담 룸(`genJitsiRoom()`) | 없음(공개 인스턴스) | 구현·미배포(상담 진입 보류) |
| 마음수달 / 마음곁 | 통합결제 grant 수신 | `MAUM_SSO_SECRET`(3곳 동일) | 배포됨(E2E 검증 완료) |
| phyweb | 상담사 SaaS 이용권 판매 → 쿠폰코드 응답 | `MAUM_SSO_SECRET` | 구현됨 / ⚠️ 라이브 판매 여부 미확인 (`CLAUDE.md` 에 미기재, 코드에만 존재) |
| 마음게임 / 커플 / 부부 / 세대 | 같은 D1·KV·`JWT_SECRET` 공유 + `?t=` SSO | KV `JWT_SECRET` | 배포됨 |
| 관리자 | 어드민 API 보호 | `ADMIN_SECRET`, `ADMIN_ALLOWED_IPS` | 배포됨 |
| jsPDF / jsPDF-AutoTable (cdnjs) | 리포트 PDF 저장 | — | 배포됨 |
| pdf.js | 외부 검사 PDF 텍스트 추출(클라이언트) | — | 배포됨 |

---

## 10. 과금 / 수익 모델

- **과금 구조 = 하이브리드 크레딧**. 겉으로는 명명된 상품(“심리검사 1회”, “AI 상담 10회권”)을 팔지만, 백엔드는 **공용 크레딧(`users.credits`)을 지급**한다. 선불충전금 규제·PG 기피를 회피하기 위한 구조이며, 마음풀·부부·세대가 이 구조를 쓴다.
- **가입 지급**: 회원가입 시 **20cr**(`credit_transactions` reason `signup_bonus`). ⚠️ 스키마의 `users.credits DEFAULT 45`("기본 20 + AI채팅 보너스 25")는 레거시 기본값이고, 실제 가입 코드는 20을 명시 INSERT 한다.
- **제휴 SSO 진입 보너스**: +20cr.

### 10.1 크레딧 소모 단가
| 기능 | 크레딧 | 비고 |
|---|---|---|
| 심리검사 1회 | 10cr | PHQ-9·GAD-7 무료 |
| AI 채팅 1회 | 2cr | 크레딧 보유 시 소진까지 무제한 |
| AI 채팅(크레딧 <2) | 무료 | 하루 5회 (`ai_daily:{userId}:{today}` KV TTL 86400) |
| AI 채팅(비회원) | 무료 | **평생 3회** (`guest_chat:{ip}` / `ai_guest_total:{ip}`) |
| PDF 분석 1회 | 3cr | 외부 검사 AI 해석 |
| 통합 심층해석 1회 | **40cr** | `INTEGRATED_COST`(2026-07-22 20→40). **첫 1회 무료**(KV `integrated_free_used`). 스트리밍이라 **스트림 시작 전 선결제**, upstream 502 시 환불 |
| 마음부부·마음세대 통역 | 회당 평균 2.5cr | 수신·발신 2cr / 중재·관점 3cr. **첫 3회 무료**(KV `bubu_free_used`/`sedae_free_used`), 이후 크레딧 차감, 없으면 402 `needPurchase` |
| 마스터 계정 | 무제한·무차감 | |

### 10.2 상품·가격 (백엔드 `PACKAGES` = 청구 기준)
**단품(프론트 `PACKAGES_KR` 노출)** — 크레딧당 단가가 **단조 감소**해야 한다.

| 상품키 | 상품명 | 크레딧 | 금액 | 원/cr |
|---|---|---|---|---|
| `pdf_one` | PDF 결과해석 | 3 | ₩1,000 | 333 |
| `test_one` | 심리검사 1회(해석 포함) | 10 | ₩2,000 | 200 |
| `ai_10` | AI 상담 10회권 | 20 | ₩2,900 | 145 |
| `bubu_pack10` / `sedae_pack10` | 부부·세대 10회팩(라이트) | 25 | ₩3,300 | 132 |
| `allinone` | 올인원(검사+AI10회+PDF) | 33 | ₩3,900 | 118 |
| `integrated_one` | 통합 심층 해석 1회 | 40 | ₩4,500 | 113 |
| `bubu_pack20` / `sedae_pack20` | 부부·세대 20회팩(스탠다드) | 50 | ₩4,900 | 98 |
| `bubu_pack40` / `sedae_pack40` | 부부·세대 40회팩(프로) | 100 | ₩8,900 | 89 |

**충전팩(`PACKAGES` 에만 존재 · 프론트 미노출)**

| 상품키 | 상품명 | 크레딧 | 금액 | 원/cr |
|---|---|---|---|---|
| `starter_kr` | 스타터 | 50 | ₩4,900 | 98 |
| `standard_kr` | 표준 | 120 | ₩9,900 | 82 |
| `premium_kr` | 프리미엄 | 300 | ₩15,000 | 50 |
| `pro_kr` | 대용량 | 700 | ₩25,000 | 36 |

**글로벌(Stripe·USD, 센트 단위)**: `starter_g` 50cr/$2.99 · `standard_g` 120cr/$5.99 · `premium_g` 300cr/$12.99 · `pro_g` 700cr/$24.99.

**외부 서비스 상품(`credits:0` · 비공용 · 곡선 무관 독립가)**

| 상품키 | 상품명 | 금액 | service / grantType |
|---|---|---|---|
| `otter_light` / `gyeot_light` | 수달·곁 라이트(월 30세션) | ₩7,900 | otter·gyeot / `sub_light` |
| `otter_pro` / `gyeot_pro` | 수달·곁 프로(월 100세션) | ₩14,900 | otter·gyeot / `sub_pro` |
| `otter_pack10` / `gyeot_pack10` | 수달·곁 10회팩 | ₩6,900 | otter·gyeot / `pack10` |
| `phyweb_solo` / `_basic` / `_professional` | phyweb 상담사 1개월 | ₩19,900 / ₩29,900 / ₩49,900 | phyweb / `solo`·`basic`·`professional` |
| `phyweb_*_annual` | phyweb 상담사 연간 | ₩190,000 / ₩250,000 / ₩450,000 | phyweb / 연간 |

> ⚠️ phyweb 상품군은 `PACKAGES`·`PhywebCodesCard`·`GrantCodeModal`·`?buy=phyweb:<plan>` 진입까지 코드에 갖춰져 있으나 프론트 `PACKAGES_KR`·`SERVICE_GROUPS` 에는 노출되지 않는다(phyweb 쪽에서 링크로 진입하는 구조). `CLAUDE.md` 에도 기재가 없다 → **문서화 필요**.

### 10.3 구독(월정액)
베이직 60cr/₩3,900 · 스탠다드 150cr/₩8,900 · 프로 400cr/₩19,900. 토스 **빌링키** 기반, 매월 1일 Cron 자동 결제. **정기결제는 별도 계약**이 필요해 `TOSS_BILLING_KEY` 등록 + 멤버십 버튼 교체가 남아 있다(상세는 외부 메모리 `project_payment_roadmap` 참조 — 문서화 필요).

### 10.4 결제 수단
- **KRW: 토스페이먼츠 SDK v1** (`https://js.tosspayments.com/v1`, `<head>` 정적 포함). ⚠️ **v2/base 는 403** → 사용 불가. 결제창은 `window.TossPayments(clientKey).requestPayment('카드', {...})`.
- 상점 MID **`maumfu5xcd`**(일반결제/"기존 결제창"). 같은 상점의 `link_*` MID 2개는 결제위젯/LinkPay로 **사용하지 않는다**. 위젯 마이그레이션은 시도 후 원복했으므로 **재migration 금지**.
- 승인 엔드포인트 = `POST https://api.tosspayments.com/v1/payments/confirm` (body `{paymentKey, orderId, amount}`, 시크릿키 Basic 인증, `Idempotency-Key: orderId`).
- 취소 = `POST /v1/payments/{paymentKey}/cancel`.
- ⚠️ **`TOSS_WEBHOOK_SECRET` 은 선택**. 토스 웹훅 콘솔에 서명 시크릿 설정란이 **없어** 서명 헤더가 오지 않는다. 과거 이 헤더를 강제해 **라이브 웹훅이 전부 401/503으로 막힌 사고**가 있었다. 지금은 강제하지 않고 **결제 재조회**로 검증한다.
- **지급 근거는 요청 metadata가 아니라 DB** — `orderId`(`charge_<chargeId>_<ts>`)에서 chargeId를 파싱해 `credit_charges` 행의 user_id·credits·amount를 쓴다.
- **USD: Stripe**(글로벌). 지역 판별은 `cf-ipcountry`/`accept-language`.
- 상세는 외부 메모리 `project_toss_payment`·`project_product_pricing_plan`·`project_maum_unified_payment` 참조 — 문서화 필요.

### 10.5 제휴 수익 쉐어
`partners.revenue_share_rate` × 결제금액 → `partner_commissions` 적립. **charge_id PK 멱등**, **적립 시점 rate 스냅샷**(율이 바뀌어도 과거 정산 불변), `partners.commission_start/end` 로 귀속 기간 제한. 환불 시 `reversed`. 개인 친구초대(`referrals` 크레딧 보상)와는 별개 체계다.

---

## 11. 안전 · 윤리 · 법적 제약

> **타협 불가 항목.** 아래 인용은 `CLAUDE.md` 원문이다.

### 11.1 임상·법적 표현 정책 (마음풀·CTS 동일)
> "마음풀·CTS는 의료기관이 아닌 **B2C 자기이해·정보제공·돌봄 콘텐츠 서비스**. '서비스가 진단·치료한다'는 임상 표현 완화."

- **완화 대상**: 진단(서비스기능)→점검/체크 · 치료/처방/완치→제거·돌봄·관점 · 임상(검증/표준)→전문/표준 · 임상심리학→심리학 · 진단조 단정→"~다소 높게 나타남" · 처방형 권고→참고할 접근/연습 · EN: clinically validated→standardized / THERAPY→(삭제) / heal·restore your mind→nurture·care / diagnosis→check / symptom patterns→response patterns
- **유지(절대 변경 금지)**: 면책문구("의료적 진단·치료 대체 안 함") · 백엔드 AI 프롬프트 진단금지 지침 · 검사 문항 원문의 `증상`(표준도구) · 상담사 자격/전문분야(사실) · 인근기관명 · 심각도 레벨(정상/경도/중등도/중증) · admin "모델 진단"(IT용어)
- 상세는 외부 메모리 `feedback_clinical_expression_policy` 참조 — 문서화 필요.

### 11.2 위기 대응
- 위기 지시는 **형식 지시보다 뒤에** 둔다(뒤 섹션이 앞을 덮음). 한글 **1393**(자살예방상담전화), 영어 **988**.
- **기독교 트랙엔 원래 위기 지시가 아예 없었다 → 신규 추가했으니 지우지 말 것.** "기도·믿음 권유로 전문 도움 안내를 대신하지 말 것"도 포함.
- ⚠️ **위기 감지 키워드는 NFC 정규화 후 판정**: 자모 분리(NFD) 한글은 완성형 정규식에 매칭되지 않아 1차 방어가 통째로 우회된다(실제 확인). `text.normalize('NFC')` 필수.
- 24시간 무료상담 안내: 109 · 1577-0199 · 1388 (counseling.jsx).

### 11.3 기독교 트랙 성경 정확성
> **실제 사고**: 상담 응답이 *"하나님도 닷새 일하고 하루를 쉬셨어요"* 라고 답했다(창세기는 **엿새 일하고 이레째 안식**).

- **원인 구조**: 프롬프트가 매 응답 성경 인용을 의무화하면 확신이 없어도 지어낸다. 특히 `구절 전문`·`책명 장:절` 강제가 위험 최대.
- **원칙**: 인용은 **정확히 아는 것만**, 조금이라도 불확실하면 **인용하지 말고 자기 말로 위로**, 구절·숫자·사건 **지어내기 금지**.
- **신학 방향(사용자=상담사 감수)**: 신앙의 바탕은 규칙이 아니라 **관계**. 지친 사람에게 쉼을 말하는 것은 합당하되, 쉼을 권할 때 **상대의 신앙·봉사 태도를 평가하지 말 것**. 봉사·헌신을 성과나 의무로 다루지 말 것.
- 기독교 프롬프트 수정 시 **①성경 인용 케이스 ②위기 케이스를 라이브로 반드시 태울 것.**

### 11.4 AI 채팅 응답 톤
- **공감/탐색/제안 라벨 폐지** — 제목·라벨·번호·불릿 금지, 이어지는 문장으로만. **라벨을 되살리지 말 것.**
- **평가형 공감 금지**("정확한 자기 인식이네요"는 공감이 아니라 채점). 상태별 분기(감정 격함=공감만 / 정체=질문 하나 / 방향 탐색중=작은 제안). 제안은 처방이 아닌 권유.
- ⚠️ **few-shot 예시가 설명보다 강하다** — 프롬프트 지시를 바꿀 땐 예시를 함께 넣을 것.
- 상세는 외부 메모리 `project_maumful_chat_tone` 참조 — 문서화 필요.

### 11.5 개인정보·프라이버시
- **검사 결과 서버 미저장 원칙**(§2.2).
- **커플 감정 내용 공유 금지** — 동의·철회 UX 없이는 하지 않는다(루트 `CLAUDE.md` 금지 항목).
- 동의 기록: `users.terms_agreed_at`·`privacy_agreed_at`·`marketing_agreed(_at)`·`consent_ip`(0019). 쿠키 동의 배너(EU 대응) + `/api/user/cookie-consent`.
- ⚠️ **외부 문자열은 위생 처리 후 프롬프트에 넣을 것** — 깨진 감정 라벨(U+FFFD)이 그대로 들어가자 AI가 *"제대로 전달되지 않아"* 라고 **사용자 출력에 언급**했다. 길이·깨진문자 필터 유지.
- 정산 원장 조회 시 개인정보 마스킹, 파트너 포털은 최소집계만(고객정보·상품 미노출).

### 11.6 정보통신망법 — 수신거부
> "**메일 발송 기능을 만들 땐 수신거부 링크를 반드시 포함**할 것."

마음게임 주간 리포트 메일이 `game_email_prefs.optout`(opt-out) + `GET /unsubscribe?u=&s=`(HMAC 서명, 로그인 불필요)를 쓴다. 마음풀에서 신규 발송 기능을 만들 때도 동일 원칙.

### 11.7 검사 문항 보호 / 크롤링
- `PROTECTED_VIEWS` 화면에 사용자 이메일 **워터마크** + 개발자도구 감지(2026-09-12부터 터치 기기는 오탐 때문에 비활성).
- `robots.txt`: 일반 검색엔진(Googlebot·Bingbot·Naverbot·Yeti 등) 전체 허용 / **AI 검색·답변봇**(Google-Extended·OAI-SearchBot·ChatGPT-User·PerplexityBot)은 HTML만 허용하고 `/static/`·`/api/` 차단 / **AI 학습봇**(GPTBot·ClaudeBot·CCBot 등)·**스크래퍼**(Ahrefs·Semrush 등) 전면 차단. 순수 SPA라 검사 화면 URL이 없어 **실보호 대상 = 문항이 든 `/static/` 번들**. 상세는 외부 메모리 `project_maumful_crawl_policy` 참조 — 문서화 필요.
- `meta robots`: `index, follow, noimageai` (`noai` 는 마케팅 노출 위해 제거).

### 11.8 법적 보류
- **상담사 매칭 = 법적 보류** → 상담센터 어드민·매칭 진입 링크 제거, 코드는 휴면 보존(§2.5). 근거: 외부 메모리 `feedback_maumful_b2c_legal` 참조 — 문서화 필요.

---

## 12. 운영

### 배포 절차
```bash
npm run build:assets                # build:jsx + build:css
node scripts/render_smoke.cjs public/static/compiled/landing.js   # 렌더 스모크(권장)
npx wrangler deploy                 # ⚠️ 반드시 포그라운드 (백그라운드 시 인증 실패)
```
- **마음풀은 변경을 모아서 한꺼번에 배포**(CTS는 즉시 배포).
- 배포 전 **TypeScript 에러 확인 필수**.
- 컴파일 산출물(`public/static/compiled/*.js`)과 `tailwind.css` 는 **레포에 커밋**해야 서빙된다(Cloudflare 빌드스텝 없음).
- 커밋 규칙: 서비스별 분리, 접두사 `[maumful]`. 수정 즉시 `git push origin main`.
- ⚠️ push 실패 시 **GitHub 계정 확인 먼저**: `gh auth status` → `gh auth switch --user youngjun1603` → `gh auth setup-git`.

### Cron / 스케줄
| 스케줄 | 핸들러 | 내용 | 상태 |
|---|---|---|---|
| `0 0 1 * *` (매월 1일 00:00 UTC) | `handleScheduled(env)` | 구독 자동 갱신 — `user_subscriptions` active·`next_billing_date <= today` 조회 → 토스 `POST /v1/billing/{billingKey}` → 성공 시 크레딧 지급 + 원장 + 다음 결제일 갱신 + `subscription_invoices`(paid) + 푸시 / 실패 시 `past_due` + invoice(failed) + 푸시 | 배포됨(구독 계약 대기라 실동작 없음) |
| — | `handleDailyReminder(env)` | 마지막 PHQ9/GAD7 검사 42일 경과자에게 재검사 푸시 | **Cron 미연결** — `export default.scheduled` 는 `handleScheduled` 만 호출. 현재는 `POST /api/admin/push/reminder`(어드민) 수동 트리거뿐 |

> 참고: 마음게임 주간 리포트 메일 Cron(매주 월 03:00 UTC)은 **`maumgame-main`** 워커에 있다.

### 모니터링 · 에러로그
- 전역 `app.onError` 가 모든 미처리 예외를 `error_logs` 에 저장(message 500자·stack 1000자 절단) 후 최근 500건만 유지. 조회 `GET /api/admin/error-logs`, 비우기 `DELETE`.
- 프론트 런타임 에러는 `POST /api/debug/client-error` → `GET /api/debug/client-errors`.
- 어드민 지표: `/api/admin/stats`(전체) · `stats/daily` · `stats/tests` · `loop-metrics`(🔁 루프 퍼널) · `feedback-metrics`(AI 해석 만족도) · `partner-stats`.
- AI 모델 점검: `GET /api/admin/test-ai` (sonnet-4-6 / opus-4-7 / haiku-4-5 / 3.5 계열 등 후보 목록으로 호출 테스트).
- ⚠️ **스키마 에러를 빈 catch로 삼키지 말 것** — 마음게임에서 `weekly_reports`·`user_test_scores` 가 원격 DB에 적용된 적이 없는데 코드가 `D1_ERROR` 를 삼켜 **몇 달간 조용히 실패**했다. 새 테이블을 쓰는 코드는 `SELECT name FROM sqlite_master` 로 실재를 확인할 것.

### 롤백
- ⚠️ **미확인** — 정식 롤백 절차 문서 없음. 확인된 수단은 ① **서비스별 커밋 분리** 원칙 덕분에 가능한 선택적 `git revert` ② `AI_PROXY_URL` 처럼 **시크릿만 지우면 이전 동작으로 복귀**하도록 설계한 토글 ③ Cloudflare Workers 대시보드의 이전 버전 롤백(코드·문서 근거 없음).

### 검증 (개발 완료 후 — 요청 없어도 즉시)
- 범위: 변경 파일 + 직접 연관(프론트·백엔드). 신규 함수 변수 스코프·타입·undefined / 크레딧 차감 레이스·원자성 / API 응답 구조 프론트↔백 일치 / `parseInt()` NaN / `.first()` null / React Hook 의존성 배열.
- ⚠️ **"없다/안 된다"고 결론내기 전에 전 파일 확인** — 프론트는 `public/static/*.jsx` **6개 전부** 훑을 것(실제 오보 사고: `app.jsx` 만 grep 하고 "어드민 UI가 없다"고 보고했으나 `counseling_admin.jsx` 에 있었다).
- ⚠️ **신규 구현은 기존 프로그램 무영향을 검증하며** 진행(추가형 설계·NULL 허용·기존 경로 실제 태워 보기).
- ⚠️ **프론트는 빌드·200으로 런타임 에러를 못 잡는다** → 렌더 스모크 필수.
- 라이브 확인 요령: 비회원 채팅(`ai_guest_total:{ip}` KV, 3회/IP — 키 삭제로 리셋). curl은 **한글이 깨지니 페이로드를 UTF-8 파일로 `--data-binary @file`**.

---

## 13. 서비스 간 의존관계

| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음게임 (`maumgame`, game.maumful.com) | 같은 D1·KV·`JWT_SECRET`. 마음풀이 `/api/game-token` 으로 `?t=` 발급 → 게임 진입. 마음풀이 게임 테이블(`game_session_logs`·`user_game_status`)을 **읽어** 통합해석·리포트에 주입. 게임이 마음풀로 `?go=history`·`?go=test:<TYPE>` 딥링크 | ↔ 양방향 |
| 마음커플 (`maumcouple`, couple.maumful.com) | `/api/couple-token` SSO, `couple_sessions` 공유. 커플 "우리의 정원"은 게임 실천 **횟수만** 합산 | ↔ |
| 마음부부 (`maumbubu`, bubu.maumful.com) | `/api/bubu-token` SSO. 통역이 **마음풀 `users.credits` 를 차감** → 마음풀이 `bubu_pack*` 상품 판매 | → (부부가 마음풀 크레딧에 의존) |
| 마음세대 (`maumsedae`, sedae.maumful.com) | `/api/sedae-token` SSO. 부부와 동일 구조(**성인만** 과금, 청소년 무료) | → |
| 마음수달 (`maumotter.com`) | **별개 생태계**(maum-auth·자체 결제). `MAUM_SSO_SECRET` HMAC 브리지로 계정만 연결 + 마음풀이 상품 판매 후 `/api/grant` 지급 | → (단방향 grant) |
| 마음곁 (`maumgyeot.com`) | 수달과 동일 패턴 | → |
| phyweb (`phyweb.pages.dev`) | 마음풀이 상담사 SaaS 이용권 판매 → `/api/grant` 가 **쿠폰코드를 응답**하면 마음풀이 저장·메일 발송·모달 노출. `?buy=phyweb:<plan>` 으로 phyweb에서 진입 | → |
| CTS (`cts-maum-main` = `lightoflife`, jesusmaum.com) | **트윈(~90% 동일)**. 본 문서의 기술스택·빌드·i18n·크레딧·결제·검증·임상표현 규칙을 그대로 따른다. DB는 `lightoflife-db` 로 분리, 결제도 별도 사업자(더새놀) | ← (규칙 상속) |
| CTS 게임 (`cts-game-main` = `lightoflife-game`) | 마음게임의 CTS 트윈 | ← |
| `_shared/maum-shared-spec.md` | 마음 시리즈 공유규약(인증·JWT·브랜드) | 참조 |

⚠️ **CTS는 2026-07-18부터 유지보수 모드** — 버그·에러 수정만. **마음풀 본체의 신규 기능도 CTS로 자동 동기화하지 않는다.** 트윈 동기화는 사실상 버그·안전 수정에 한정.

---

## 14. 현황 및 백로그

### 라이브 상태 (배포됨)
- 검사 10종 · AI 해석/통합해석 · AI 채팅(4트랙·음성) · 감정추적 · CBT 플랜 · 추이예측 · PDF 해석 · 외부결과 입력
- **토스페이먼츠 라이브 결제 가동**(2026-07-22). 첫 라이브 실결제(charge id=30) 승인→지급→내역→셀프 환불까지 E2E 검증 완료
- 고객 셀프 환불 · 쿠폰 · 친구초대 · 제휴 수익쉐어 정산 · 제휴사 정산 포털 · 제휴 SSO 진입
- 통합결제 grant(수달·곁) E2E 검증 완료(지급·멱등·위조 401·환불 revoke)
- 소셜 로그인 3종 · 이메일 인증 강제 · 웹푸시 · PWA · 공지 · 어드민(56 엔드포인트)
- 마음 시리즈 SSO 허브 + 랜딩 히어로 롤링 쇼케이스

### 구현·미배포 / 조건부
- **구독(정기결제)**: 백엔드·Cron 구현 완료, **토스 빌링 별도 계약 + `TOSS_BILLING_KEY` 등록 + 멤버십 버튼 교체** 대기
- **상담 예약·결제·화상(Jitsi)**: 코드 완비, 법적 보류로 진입 경로 차단
- **6주 재알림 푸시**: `handleDailyReminder` 구현되었으나 Cron 미연결(수동 트리거만)
- **Stripe 글로벌 결제**: 코드 존재, 라이브 여부 ⚠️ 미확인
- **phyweb 상품군**: 코드 완비, 프론트 상품 목록 미노출 · `CLAUDE.md` 미기재

### 설계만 / 미착수
- **지자체 화이트라벨**(멀티테넌트 `organizations`+`users.org_id`+`/api/org-config`+`landing_config` JSON) — 요청 시 착수. 외부 메모리 `project_whitelabel_gov`
- **제휴 진입 레이어 2단계**(config 구동 A/B, 어드민 편집 즉시반영) — 외부 메모리 `project_maumful_partner_entry`. **삼아는 계약 전(사전점검) 단계**
- **연동형 유료결제(통합결제) 확장** — 설계 완료·착수 대기. ⚠️ **토스페이먼츠 완전 반영 전까지 관련 코드 커밋·푸시·배포 금지**(설계·로컬 준비만). 외부 메모리 `project_maum_unified_payment`
- **통합해석 유료 상품화 · 앱화** — 토스 실결제 반영 후

### 정리 대기 (바로 가능)
- 폐기된 **상담사 승인 레거시 코드 제거**
- 주간 리포트 메일 실수신 검증(사용자 동의 후)
- 전 서비스 백로그 단일 출처 = 외부 메모리 **`project_maum_backlog`** 참조 — 문서화 필요

### 금지 사항
- **커플 감정 내용 공유**(동의·철회 UX 없이)
- **CTS 신규 기능 개발**(명시적 재개 지시 시에만)
- **토스 위젯/v2 SDK 재마이그레이션**
- **AI 채팅 응답의 공감/탐색/제안 라벨 부활**
- **상담센터 어드민 코드 삭제·정리**
- **통합결제 관련 코드의 커밋·푸시·배포**(토스 완전 반영 전)

---

## 15. 알려진 리스크 · 기술부채

1. **`partner_commissions` 테이블에 마이그레이션이 없다.** `accruePartnerCommission`/`reversePartnerCommission`/어드민 조회/포털 조회가 모두 이 테이블을 쓰는데 `migrations/` 어디에도 `CREATE TABLE partner_commissions` 가 없다(전 파일 grep 확인). 이는 **0029가 고친 `external_grants` 사고와 동일 패턴**(0029 주석: "CREATE가 어디에도 없어 수달·곁 grant가 실제론 실패 상태였음"). 적립은 비차단 `.catch` 라 실패해도 조용하다 → **원격 DB에 실재하는지 `SELECT name FROM sqlite_master WHERE name='partner_commissions'` 로 즉시 확인 필요.** (⚠️ 원격 DB 실재 여부는 이 문서 작성 시점에 미확인)
2. **`JWT_SECRET` 이 KV에 저장되고 미설정 시 `'dev_secret_change_in_production'` 으로 폴백한다.** KV 키가 비면 예측 가능한 시크릿으로 토큰을 발급·검증하게 된다. 운영 KV에 값이 있는지 확인 필요(⚠️ 미확인).
3. **`/api/config/region` 의 `creditPrices` 가 실제 `PACKAGES` 와 불일치.** region 응답은 스타터 50cr/₩2,900, 표준 120cr/₩5,900 … 인데 백엔드 `PACKAGES` 는 ₩4,900 / ₩9,900 이다. 현재 프론트가 `creditPrices` 를 사용하지 않아(전 파일 grep 0건) 실피해는 없지만, **죽은 가격표가 API로 노출**되고 있다.
4. **가격이 프론트·백엔드 2중 관리.** `PACKAGES_KR`(표시)와 `PACKAGES`(청구)를 따로 고쳐야 하며, 한쪽만 고치면 표시가와 청구가가 갈린다. `CLAUDE.md` 가 "두 곳 동시" 를 경고로 남겼을 뿐 구조적 방지책은 없다.
5. **`src/index.tsx` 단일 파일 6,725줄 · `app.jsx` 12,693줄.** 라우트 154개와 프론트 대부분이 각각 한 파일에 있어 변경 영향 범위 파악과 리뷰 비용이 크다. 전역 스코프 공유(§5) 때문에 **전역 `const` 이름 충돌이 `SyntaxError` 로 전체 페이지를 죽인다.**
6. **원격 D1 마이그레이션 트래킹이 비어 있다.** `migrations apply --remote` 가 0001부터 재적용을 시도해 실패하므로 매번 `d1 execute --file` 로 수동 적용해야 하고, **적용 이력이 어디에도 남지 않는다** → 1번 같은 누락이 재발하기 쉽다.
7. **`handleDailyReminder` 가 Cron에 연결되지 않은 죽은 경로.** 구현·테스트는 되어 있으나 스케줄이 없어 수동 트리거로만 동작한다.
8. **README.md · SETUP.md · DEPLOY_CHECKLIST.md 가 4개월 이상 낡았다.** 검사 8종, `psy-app-db`, 폴더명 `phyweb`, "Babel JSX 빌드 불필요", `maumful.pages.dev`, `maumful.kr` 등 현행과 다른 정보가 그대로 남아 신규 작업자를 오도할 수 있다.
9. **운영 지식의 상당 부분이 외부 메모리에만 있다.** `project_maumful_tests`·`project_toss_payment`·`project_maum_unified_payment`·`project_product_pricing_plan`·`project_maumful_ai_interpretation`·`project_maumful_chat_tone`·`project_kakao_login`·`project_maumful_email_verify`·`project_maumful_partner_revshare`·`project_maumful_partner_entry`·`project_maumful_counseling_admin_dormant`·`project_maumful_crawl_policy`·`project_whitelabel_gov`·`project_payment_roadmap`·`project_maum_backlog`·`feedback_*` — 레포만으로는 복원할 수 없다. **문서화 필요.**
10. **`test_history` 가 원설계(메타만 저장)에서 이탈 중.** `result_json`·`ai_analysis` 컬럼이 추가되어 실질적으로 결과 본문이 저장될 수 있다. "검사 결과 서버 미저장 원칙" 과의 정합을 재확인할 필요가 있다(⚠️ 실제 저장 범위 미확인).
11. **상담 플랫폼 전체(테이블 8개·라우트 ~30개·프론트 2,846줄)가 휴면 상태로 유지보수 부담만 남아 있다.** 의도된 보존이지만 스키마 변경·리팩터링 때마다 함께 끌고 가야 한다.
12. **Stripe 경로의 검증 수준이 토스와 다르다.** 토스는 웹훅에서 결제 재조회(진짜 검증)를 하지만 Stripe 는 `STRIPE_WEBHOOK_SECRET` 서명 검증에 의존한다(⚠️ 동등한 재조회 방어 존재 여부 미확인).

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 최초 작성. 근거 커밋 `edc8aa4`. `CLAUDE.md`(293줄)·루트 `CLAUDE.md`·`wrangler.toml`·`package.json`·`src/index.tsx`(154 라우트)·`migrations/0001~0029`·`public/static/*.jsx` 6개·`TOSS_PAYMENTS_GUIDE.md` 기준 | Claude |
