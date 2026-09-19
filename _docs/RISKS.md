# 리스크 등록부 (2026-09-19)

> 9개 서비스 설계서 작성 과정에서 **코드에서 확인된** 결함·리스크를 심각도순으로 모았다.
> 각 항목의 근거는 해당 서비스 `docs/DESIGN.md` §15 에 상세히 있다.
>
> **검증 열**: `✅ 대조완료` = 이 문서 작성 시 코드를 직접 다시 확인함 / `보고` = 설계서 작성 중 발견, 재대조 미실시.
> 심각도는 **사용자 피해 · 법적 노출 · 조용한 실패(silent failure)** 를 기준으로 매겼다.

---

> **2026-09-19 2차 추가** — 외부 메모리 내용을 코드에서 복원하는 과정에서 **결제·정산 관련 심각 결함 4건이 추가로** 나왔다(R-37~R-40). 아래 S1 목록과 함께 우선 처리할 것.

## 🔴 S1 — 즉시 조치 권장

### R-01. 마음게임·CTS 게임 — 리더보드가 인증 없이 이메일 노출
- `GET /api/game/leaderboard` 가 인증 미들웨어 없이 `SELECT u.nickname, u.email, ...` 상위 20명을 반환한다.
- **양쪽에 동일하게 복제**돼 있다 (마음게임 `src/index.tsx:707`, CTS 게임 동일).
- 개인정보 유출. 닉네임만 반환하도록 `u.email` 제거가 최소 조치.
- 검증: **✅ 대조완료**
- 근거: 마음게임 설계서 §15, CTS 게임 설계서 §15.0

### R-02. 마음게임·CTS 게임 — 주간 리포트 IDOR
- `GET /api/recovery/weekly-report/:userId` 가 인증 없이 **경로의 userId** 로 남의 번아웃 리포트를 조회한다.
- 마음게임은 cron 활성 → **실데이터가 노출 가능**. CTS 게임은 cron 비활성이라 테이블이 비어 현재 피해는 0이지만, **cron을 켜는 순간 실데이터 IDOR가 된다**.
- 건강 관련 민감정보다. 토큰 인증 + 본인 확인 필수.
- 검증: **✅ 대조완료**
- 근거: 마음게임 설계서 §15, CTS 게임 설계서 §15.0

### R-03. 마음풀 — `partner_commissions` 테이블에 CREATE 마이그레이션이 없다
- 제휴 수익 쉐어의 적립·역적립·어드민 조회·파트너 포털이 모두 이 테이블을 쓴다 (`src/index.tsx` 참조 9곳).
- `migrations/` 전체에 `CREATE TABLE partner_commissions` 가 **0건**.
- 적립이 비차단 `.catch` 라 **실패해도 조용하다**. 즉 정산이 안 쌓여도 아무도 모른다.
- 과거 `0029_external_grants.sql` 이 고친 사고(수달·곁 grant가 CREATE 누락으로 실패 중이었음)와 **완전히 같은 패턴**.
- **즉시 확인**: `SELECT name FROM sqlite_master WHERE name='partner_commissions'`
- 검증: **✅ 대조완료**
- 근거: 마음풀 설계서 §15-1

### R-04. `_shared/auth.ts` 캐논이 실제보다 낡음 — 새 서비스 복제 시 사고
- 공유 규약은 `_shared/auth.ts` 를 CANONICAL 로 선언하지만, 실제로는 수달·곁 사본보다 **17~18줄 짧고 5개 함수가 없다**: `deleteUser` · `findByEmail` · `setPassword` · `markEmailVerified` · `isEmailVerified`.
- md5: `_shared` `c48c0f…` / 수달 `c167ad…` / 곁 `18dfa3…` (곁·수달은 주석 1줄 차이)
- **새 형제 서비스를 `_shared` 에서 복사하면 회원 탈퇴와 이메일 인증이 통째로 빠진다.**
- 조치: 수달 사본을 `_shared/auth.ts` 로 역동기화하고, `maumgyeot/README.md` 의 "`_shared/auth.ts` 동일 사본" 서술을 정정.
- 검증: **✅ 대조완료**
- 근거: 수달 설계서 §15, 곁 설계서 §15

### R-05. 마음부부·마음세대 — `/api/share/respond` 에 소유권 검증이 없다
- `shareId` 만으로 `UPDATE shared_items SET status='accepted'` 를 실행한다. `assertRelationOwner` 도 수신자 확인도 없다.
- 같은 파일의 다른 라우트는 `assertRelationOwner` 를 **8회** 쓴다 — 이 라우트만 예외다.
- 정보 유출은 없으나 **상태 위조**가 가능하다. 유효 토큰만 있으면 남의 공유 항목을 수락 처리할 수 있다.
- **양쪽에 동일 코드로 복제**돼 있다 (`maumbubu/src/translate-route.ts:898`, `maumsedae/src/translate-route.ts:1035`).
- 검증: **✅ 대조완료**
- 근거: 부부 설계서 §15, 세대 설계서 §15

---

## 🟠 S2 — 조치 필요

### R-06. 마음커플 — `/api/couple/timeline` 은 실행되면 깨진다
- 쿼리가 `cs.code` · `cs.test_types` 를 SELECT 하지만 `couple_sessions` 의 실제 컬럼은 `session_code` · `test_type` 이다.
- try/catch 도 없어 도구 탭 "관계 타임라인" 진입 시 실패한다.
- 검증: **✅ 대조완료** (`package/maumcouple/src/index.tsx:1212` vs `maumful-main/migrations/0010_couple_sessions.sql`)
- 근거: 마음커플 설계서 §4, §15

### R-07. 마음수달·마음곁 — DDL 없는 테이블·컬럼 (fail-open 포함)
- `external_orders` (`/api/grant` 가 참조) 와 `users.email_verified` (`isEmailVerified` 가 참조) 가 어느 `.sql` 에도 없다. **양쪽에 동일하게 복제**.
- `isEmailVerified` 는 실패 시 **`true` 를 반환**(fail-open)한다 → 스키마를 재적용하면 **이메일 인증 게이트가 조용히 무력화**된다.
- 근거: 수달 설계서 §15, 곁 설계서 §15

### R-08. 마음게임·CTS 게임 — 번아웃 주간 집계가 죽어 있다
- `burnout.jsx` 는 `energy_gained` / `missions_completed` 로 저장하는데, 서버(`handleScheduled`, `signalsFromSessions`)는 `meta.energy` / `meta.completedMissions` 를 읽는다.
- 결과: `weekly_reports` 에 행이 안 쌓이고, `avgEnergy < 40` 기반 BURNOUT 검사 제안이 발동하지 않는다.
- 백로그 "마음게임 콘텐츠 확장 — 검사↔게임 루프가 도는지 데이터 보고 판단" 이 **애초에 데이터가 안 쌓여 판단 불가** 상태다.
- CTS 게임에도 복제돼 있으나 cron 비활성이라 무증상 → **cron 해제 작업의 선행조건**.
- 근거: 마음게임 설계서 §15-3, CTS 게임 설계서 §15.0

### R-09. 마음곁 — CORS 미구현 (공유 규약 위반)
- `src/index.ts` 664줄 전체에 `cors` / `Access-Control-*` / `OPTIONS` 코드가 **0건**.
- `_shared/maum-shared-spec.md` §3 과 `maumgyeot/CLAUDE.md` §5 는 4개 오리진 화이트리스트를 "반드시 동일 구현"으로 규정한다. **수달엔 있고 곁만 빠졌다.**
- 현재는 동일 출처 서빙이라 드러나지 않지만, `app.` 서브도메인·앱 WebView에서 XHR 을 쏘는 순간 막힌다.
- 근거: 곁 설계서 §15

### R-10. 마음곁 — 마음풀 SSO 수신 라우트가 없다
- `verifySso()` 함수는 있으나 `POST /api/auth/sso` 라우트가 없다. **수달엔 구현돼 있다.**
- 결과: 마음풀 결제로 **이용권은 들어오는데 로그인 인계는 안 되는** 비대칭 상태.
- 근거: 곁 설계서 §15

### R-11. 마음곁 — 쿼터를 LLM 호출 전에 차감
- `/api/observe` 가 `consumeQuota()` 를 **LLM 호출 전**에 실행한다. 게이트웨이 장애로 `callClaude` 가 2회 모두 실패하면 안전 기본 리포트만 저장되고 **유료 회차는 이미 차감**된다. 환불 경로 없음.
- 같은 문제의 변형이 마음커플에도 있다: 세션 선차감분(20~45cr)은 리포트 생성이 502로 실패해도 환불되지 않는다.
- 근거: 곁 설계서 §15, 커플 설계서 §15

### R-12. CTS — 성경 정확성 가드가 코드 폴백 1곳에만 적용
- `CLAUDE.md` 는 가드가 chat·format·persona 3종 + 코드 폴백에 들어갔다고 하지만, 코드 폴백에는 `FALLBACK_BIBLICAL_CHAT` 에만 있다.
- `FALLBACK_BIBLICAL_PERSONA` · `FALLBACK_BIBLICAL_FORMAT` 은 가드 이전 문구 그대로이고, **`migrations/0016_ai_config.sql` 시드도 가드 이전 원문**이다.
- → DB 재구축·dev DB 적용 시 **가드가 되살아나지 않는다**. 기독교 트랙의 성경 오인용은 이 서비스의 신뢰 급소다.
- 근거: CTS 본체 설계서 §11, §15

### R-13. 마음커플 — 주간 인사이트 메일의 수신거부가 법 요건 미달
- 메일 푸터의 "수신 거부" 링크가 홈으로만 간다. 정보통신망법상 수신거부 요건을 충족하지 못한다.
- 현재는 cron 미등록으로 안 나가지만, **켜기 전 반드시 선행 조치**해야 한다.
- 근거: 마음커플 설계서 §11.4, §15

---

## 🟡 S3 — 정리 대상

| # | 서비스 | 내용 |
|---|---|---|
| R-14 | 마음풀 | `/api/config/region` 이 실제와 다른 "죽은 가격표"를 공개 API로 노출 (스타터 ₩2,900 vs 실제 ₩4,900). 프론트가 안 써서 실피해는 없음 |
| R-15 | 마음풀 | `handleDailyReminder`(6주 경과 재알림)가 cron 에 연결되지 않음. 어드민 수동 트리거로만 동작 |
| R-16 | 마음풀 | phyweb 상품 6종(₩19,900~₩450,000)이 코드에 완비돼 있으나 `CLAUDE.md` 에 기재 없음. 유일한 쿠폰코드 응답형 |
| R-17 | CTS | 가격이 크레딧 단조감소 규칙 위반 — `ai_10`(20원/cr)이 `allinone`(32.3원/cr)과 충전팩 4종을 지배. API 직접 호출로 구매 가능 |
| R-18 | CTS 게임 | 딥링크 화이트리스트에 `qt` 누락 → `?game=qt` 가 조용히 무시됨. 마음게임 `worry` 누락 사고의 재현. **한 줄 수정** |
| R-19 | CTS 게임 | `PHYWEB_URL = 'https://maumful.com'` 하드코딩 잔재 — "The Light of Life으로 돌아가기" 버튼이 마음풀로 감 (허브 5곳) |
| R-20 | 마음커플 | `couple_sessions` 스키마가 3곳에 중복 정의. `package/D1_SQL_실행순서.sql` 사본은 **CHECK 제약 누락** |
| R-21 | 마음커플 | 크레딧 차감 시점이 기능마다 3가지로 갈림. 일부는 반환값 미검사 → 잔액 소진 시 **차감 실패해도 결과는 무료로 나감** |
| R-22 | 마음커플 | 커플 서비스인데 **위기 감지·긴급 연락처 안내가 전무** (마음부부·마음풀 채팅과 대비) |
| R-23 | 마음부부 | `verifyJWT` 가 `['bubu','couple']` 을 모두 허용 → 마음커플 토큰으로 마음부부 크레딧 차감 API 전체 접근 가능. 세대는 `['sedae']` 로 좁혔음 |
| R-24 | 마음부부 | 공유 철회(ADDENDUM 01 §1.4-4) 미구현. 한 번 보낸 공유는 회수 불가. **마음세대는 이미 구현** → 역포팅 후보 |
| R-25 | 마음부부 | `relation_safety` 가 평문 저장(ADDENDUM은 암호화 요구). 안전 플래그 **해제 경로가 없어 30일 자연 만료만** 가능 |
| R-26 | 마음부부 | 공감 반응(🤍)이 반쪽 — 표시만 되고 증가 API·버튼 없음 |
| R-27 | 마음세대 | 프리앰블은 관계별로 분기했으나 `MODE_MODULES`·`memoryModule`·피드백/중재 프롬프트는 **여전히 부부 문구**. 실출력은 정상이나 같은 종류의 잠재 결함 |
| R-28 | 마음세대 | "이중 폭풍 장기기억"(`past_patterns`·`life_stage`)이 컬럼만 있고 **어디에도 배선되지 않아 항상 NULL**. CLAUDE.md 는 이를 핵심 차별화로 표기 |
| R-29 | 마음수달 | TTS 스펙 불일치 — CLAUDE.md 는 "tts-1, 또또=shimmer", 코드는 `gpt-4o-mini-tts` + 또또=**fable**. 문서 보고 고치면 음색이 되돌아감 |
| R-30 | 마음수달 | face-api.js 가중치를 `@master` 로 로드 (버전 미고정). 업스트림 변경 시 표정 기능 무단 중단 |
| R-31 | 수달·곁 | 통합결제가 "착수 대기"인데 `/api/grant`·`/api/grant/revoke` 코드는 이미 있음. 루트 규정("토스 반영 전 커밋·배포 금지")과 상태가 엇갈림 |
| R-32 | CTS | 문서에 없던 세 번째 워커 `lightoflife-couple` 을 코드 3곳이 참조. HANDOVER 는 워커 2개로 정의 → **이관 시 '커플 케어' 메뉴가 죽은 링크** |
| R-33 | CTS | `.github/workflows/deploy.yml` 이 push 마다 배포하는데 **`build:jsx` 를 돌리지 않음** |
| R-34 | CTS | 마이그레이션 번호가 0015부터 갈라져 **같은 번호가 마음풀과 다른 스키마**를 뜻함 |
| R-35 | CTS | cron 이 프로덕션엔 주석, 스테이징엔 활성인 역전 |
| R-36 | 전 서비스 | **테스트·CI 부재. 롤백 절차 미정의.** 회귀 검증은 전적으로 수동 |

---

## 복제 결함 요약 — "한쪽을 고치면 반드시 같이 고칠 것"

| 결함 | 복제된 곳 |
|---|---|
| 리더보드 이메일 노출 (R-01) | 마음게임 ↔ CTS 게임 |
| 주간 리포트 IDOR (R-02) | 마음게임 ↔ CTS 게임 |
| 번아웃 metadata 키 불일치 (R-08) | 마음게임 ↔ CTS 게임 |
| `share/respond` 소유권 미검증 (R-05) | 마음부부 ↔ 마음세대 |
| `external_orders` · `email_verified` DDL 누락 (R-07) | 마음수달 ↔ 마음곁 |
| 딥링크 화이트리스트 누락 (R-18) | 마음게임(`worry`, 수정됨) → CTS 게임(`qt`, 미수정) |

> 트윈·파생 구조라 **결함도 함께 복제된다.** 수정 시 형제 서비스를 반드시 같이 확인할 것.
> 단, 루트 CLAUDE.md 의 **"CTS 유지보수 모드 — 버그·에러 수정만"** 규정상 CTS 쪽은 **보안·버그 수정만** 반영한다.

---

## 개정 이력
| 일자 | 내용 |
|---|---|
| 2026-09-19 | 9개 설계서 작성 과정에서 발견된 리스크 36건 최초 정리. S1 5건은 코드 재대조 완료 |

---

# 2차 발견 (2026-09-19, 외부 메모리 복원 중)

> 설계서의 `project_*` 외부 메모리 참조를 코드에서 복원하면서 추가로 확인된 항목.
> 1차와 달리 **결제·정산 경로에 집중**돼 있다.

## 🔴 S1

### R-37. 마음풀 → 수달·곁 환불이 이용권을 회수하지 못한다 (금전 손실)
- 마음풀의 revoke 호출부 2곳(`index.tsx` L1186 셀프환불 · L4570 관리자환불)이 **`https://phyweb.pages.dev/api/grant/revoke` 로 하드코딩**돼 있다.
- 수달·곁 상품은 `PACKAGES` 에서 `credits: 0` 이라 크레딧 환불 분기(`0 < 0`)를 통과해 버린다.
- 결과: **카드 결제는 환불되고 지급된 구독·회차권은 그대로 남는다.** 수달·곁의 `/api/grant/revoke` 는 호출자가 없는 죽은 엔드포인트.
- 마음풀 셀프환불이 쓰는 `GET /api/grant/status`(사용 여부 조회)도 수달·곁에 없어 "이미 쓴 이용권인지" 물어볼 수단이 없다.
- 근거: 수달 설계서 §10.1, 곁 설계서 §10.1

### R-38. CTS 토스 웹훅에 결제 재조회 검증이 없다
- CTS 웹훅은 `Authorization: Basic` 대조만 하고 본문의 `metadata.userId`·`packageKey` 를 **그대로 신뢰해 지급**한다. `TOSS_WEBHOOK_SECRET` 이 **미설정이면 경고만 남기고 통과**(`index.tsx` L1753).
- 마음풀은 2026-07-21 보강으로 토스 API에 결제를 재조회해 status·금액을 재확인한다. **CTS는 그 이전 버전이다.**
- 기존 설계서 §7 표가 "마음풀과 동일(결제 재조회 검증)"이라고 적었던 것은 사실과 달라 정정했다.
- 근거: CTS 본체 설계서 §10.1, §15-19

### R-39. 마음풀·CTS 공통 — 지급 대상 특정이 느슨하다
- 토스(CTS L1771)·Stripe(L1852) 모두 `WHERE pg=? AND status='pending' AND user_id=?` 로 조회한다. **금액·패키지·orderId 대조가 없다.**
- 같은 사용자에게 pending 결제가 둘 이상이면 엉뚱한 건이 완료 처리될 수 있다.
- 근거: CTS 본체 설계서 §15-20

### R-40. 마음풀 — 구독 INSERT 실패가 통째로 삼켜진다
- `user_subscriptions` INSERT가 `try{}catch{}` 로 감싸여 있다(`index.tsx` L3357~L3366, 주석 "테이블 없으면 무시").
- 테이블이 없거나 INSERT가 실패하면 **구독 기록 없이 첫 달 크레딧만 지급되고 조용히 끝난다.** 갱신·해지 추적 불가.
- 플랜 상수도 `SUBSCRIPTION_PLANS`(L3259)와 Cron 내부 `plans`(L6216)에 이중 관리된다.
- 근거: 마음풀 설계서 §10.3, §15

## 🟠 S2

| # | 서비스 | 내용 |
|---|---|---|
| R-41 | CTS | **`PAYMENT_LIVE = true` 로 바꿔도 결제가 안 된다.** 프론트 `handlePay` 가 쓰는 `clientKey`·`orderId`·`successUrl` 을 `/api/credits/prepare-charge` 가 반환하지 않고, 그 값을 주는 `/api/payment/toss/checkout` 은 **프론트에서 호출되지 않는다**(grep 0건). 라이브 전환은 상수 한 줄이 아니다 |
| R-42 | CTS | 네이버 로그인이 `state` 를 발급만 하고 **검증하지 않는다** (CSRF 무방비) |
| R-43 | CTS | 카카오 이메일 미동의 가입자가 `is_email_verified=0` 으로 생성돼 인증 게이트에 **잠기고, 재발송할 주소도 없다** |
| R-44 | 수달·곁 | 루트 `CLAUDE.md` 의 grant 페이로드 `{email,grantType,orderId}` 가 **실제 구현(6필드)과 다르다.** CLAUDE.md 요약대로 구현하면 서명 불일치로 전건 401. 계약 원본은 각 설계서 §10.1 표 |
| R-45 | 수달·곁 | grant 의 `amount` 를 **수신측이 읽지 않는다**(금액 검증 없음). `service` 필드가 아예 없으면 `service mismatch` 검사를 그냥 통과 |
| R-46 | 수달 | `MAUM_SSO_SECRET` 유출 시 피해 범위가 곁보다 넓다 — 수달은 `verifySso` 를 SSO 로그인과 grant 가 공유해 **계정 탈취**까지, 곁은 무상 지급까지 |
| R-47 | 마음풀 | 제휴 정산 요약 API(현재 율 × `Math.floor`)와 원장 API(적립 시점 율 × `Math.round`)의 **산식이 달라 두 화면 금액이 어긋날 수 있다** |

## 🟡 S3

| # | 서비스 | 내용 |
|---|---|---|
| R-48 | CTS | 구독 `customerKey` 가 `maumful_user_{id}` — 마음풀 접두사가 그대로 남아 있고 검증식까지 같은 문자열로 대조 |
| R-49 | CTS | `GOOGLE_CLIENT_ID` 가 시크릿이 아니라 `wrangler.toml [vars]` 에 **평문 커밋**. 네이버 콜백 폴백은 꺼져 있는 `lightoflife.limyj007.workers.dev` |
| R-50 | CTS | 재발송 레이트리밋 주석은 "이메일당"인데 실제 키는 IP 기준. `credit_charges.status` 의 `refunded` 값은 쓰는 코드가 0건 |
| R-51 | 마음풀 | `payments` 테이블은 **존재하지 않는다** — `migrations/0004` L10이 DROP하고 `credit_charges` 로 대체. 문서·지시서의 "payments 스키마"는 실체 없음 |
| R-52 | 마음풀 | 검사 문항 수가 **4중 수동 관리**(카드 표시·안내문·진행률 분모·미완성 경고 상수). 현재 10종 모두 일치함은 전수 대조로 확인 |
| R-53 | 마음게임 | 마스터 계정용 `allTests`(L262)가 **8종**으로 `RIASEC`·`VALUES` 누락. 검사 목록이 4중 관리 중 |
| R-54 | 마음커플 | "마음커플 Plus ₩9,900"은 결제 상품이 아니라 **대기자 등록 카드**(`/api/credits/notify-plan`). 백엔드 `SUBSCRIPTION_PLANS` 와 프론트 플랜 카드는 키가 전혀 겹치지 않아 구독 전체가 표시 전용 |
| R-55 | 마음세대 | 루트 `CLAUDE.md` 통합결제 원문은 "수달·곁·부부"만 적었으나 `sedae_pack*` 3종이 마음풀 코드에 실재. 사후 편입으로 보이나 시점·근거는 복원 불가 |
| R-56 | 마음풀 | 휴면 상담센터 어드민에 `setView('counselingAdmin')` 호출부가 **1곳 남아 있다**(`landing.jsx` L2056). 라벨이 푸터 배열에서 빠져 조건이 영원히 거짓인 죽은 분기 — **부활은 라벨 한 줄 복원으로 끝난다** |

---

## 개정 이력 (2차)
| 일자 | 내용 |
|---|---|
| 2026-09-19 | 외부 메모리 복원 중 발견된 20건 추가(R-37~R-56). 결제·정산 경로에 집중 |

---

# 3차 발견 (2026-09-19, 작업 지시서 작성 중)

> 지시서를 쓰면서 코드를 다시 연 결과. **1·2차 기록이 틀렸던 것도 포함**되어 있다.

## 🔴 S1

### R-57. CTS 결제가 통화를 `'KRW'` 로 하드코딩 — USD 상품을 원화로 결제
- `cts-maum-main/src/index.tsx:1893` 의 `toss/checkout` 이 통화를 `'KRW'` 로 박아 보낸다.
- USD 센트 단위 상품(`starter_g`, amount 299)을 이 경로로 결제하면 **₩299에 50크레딧**이 나간다.
- R-17(단조감소 위반)보다 심각하다. **`PAYMENT_LIVE` 전환 전 반드시 선행 조치.**
- 근거: BATCH_06 지시서 §5

## 🟠 S2

### R-58. CTS 스테이징 KV가 마음풀 운영 KV와 같은 네임스페이스
- `cts-maum-main/wrangler.dev.toml:16` = `maumful-main/wrangler.toml:16` = `9f7426807e924916be4dec75793422d9`.
- 설계서의 "생태계 3분할(CTS는 어떤 마음풀 리소스도 공유하지 않는다)" 전제와 어긋난다.
- CTS 스테이징 작업이 마음풀 운영 KV에 쓸 수 있다. 범위가 커서 **고치기 전에 영향 분석 필요**.

### R-59. 배포 워크플로가 JSX·CSS 빌드를 돌리지 않는다 (CTS + 루트 공통)
- `cts .github/workflows/deploy.yml:25-26`, 루트 `deploy-production.yml`·`deploy-staging.yml` 모두 `command: deploy` 만 돌린다. 마음풀은 `build:css` 까지 빠진다.
- 세 워커 모두 HTML이 `compiled/*.js` 만 참조한다 → **소스만 고치고 push 하면 컴파일 산출물이 옛 것인 채로 배포된다.**
- **현재 드리프트는 없음**(CTS 4개 소스 전부 `.jsx` 와 `compiled/*.js` 의 마지막 커밋이 동일, 마음풀 최근 20커밋 누락 0건). 즉 *"어긋나 있다"가 아니라 "어긋나도 CI가 못 잡는다"*.
- R-33 을 이 내용으로 대체·승격(S3 → S2).

### R-60. CTS 네이버 콜백 폴백이 스테이징에서 실제로 발동
- `wrangler.dev.toml` 에 `[vars]` 가 없어, 꺼져 있는 `lightoflife.limyj007.workers.dev` 로 폴백된다.
- R-49 의 `GOOGLE_CLIENT_ID` 평문은 **시크릿 유출이 아니다**(`window` 에 주입되는 공개값). 실제 위험은 이관 시 소유권 이전이다 → R-49 심각도 하향, 대신 이 항목이 실제 결함.

## 1·2차 기록의 정정

| 이슈 | 기록된 내용 | 실제 |
|---|---|---|
| R-37 | revoke 호출부 2곳이 샌다 | **관리자환불 한 곳만.** 셀프환불은 `index.tsx:1143-1144` 가 이미 400 으로 차단, 프론트 버튼도 안 뜸. 원인도 URL 하드코딩이 아니라 `admPkg?.service === 'phyweb'` 분기 |
| R-37 | 수달·곁이 지급을 받고 있다 | **성립 안 함.** `external_orders` DDL 부재로 `/api/grant` 첫 SELECT 부터 던진다. 그런데 상품은 팔리는 중 → **"돈은 받고 지급은 실패"** 가능성 |
| R-43 | 카카오 가입자가 인증 게이트에 잠긴다 | 게이트보다 앞선 `if (!user.password_hash)` 가 먼저 걸려 **게이트에 도달조차 못 한다.** 실제 피해는 수신불가 주소 축적·계정 분기 등 |
| R-41 | 누락 필드 3개 | **7개.** 게다가 SDK 동적 로드라는 **두 번째 원인**이 따로 있다 |
| R-47 | 차이가 율×절사 2축 | **4축.** 모집단(전체 vs 귀속기간·`is_active`·`reversed` 통과분)과 기간 기준까지 다르다 |
| R-20 | `couple_sessions` 3중 중복 | **4중.** CTS 에도 마음풀과 바이트 단위 동일 사본 |
| R-51 | `payments` 만 실체 없음 | `0004` 가 `usage_history`·`subscriptions`·`payments` **셋을 DROP**. 마음풀 설계서 L250 과 L512 가 서로 모순 |
| R-08 | 키 이름 불일치 | **의미도 다르다.** `energy_gained`(획득 합, 상한 150) vs 서버가 기대하는 `energy`(스스로 매긴 0~100). 키만 맞추면 검사 제안이 과발동 |
| R-12 | 코드 폴백에 가드가 1곳만 | **DB 가 코드보다 우선**(`getAiConfig` 가 `row?.value?.trim() || fallback`). 운영 `ai_config` 실측 전에는 현재 동작을 단정 불가 |
| R-53 | 게임 `allTests` 8종 누락 | 마음게임만 결함. **CTS 본체는 검사가 8종뿐**이라 CTS 게임은 정상 — 복제 금지 |
| R-14 | 죽은 가격표 | 마음풀만. **CTS `creditPrices` 는 자기 `PACKAGES` 와 일치** — 손대지 말 것 |
| R-31 | 통합결제 "착수 대기" | 문서만 낡음. grant 코드는 `fbfe9ea`(2026-08-29)로 이미 커밋·배포 |

---

## 개정 이력 (3차)
| 일자 | 내용 |
|---|---|
| 2026-09-19 | 작업 지시서 작성 중 발견 4건 추가(R-57~R-60) + 1·2차 기록 정정 12건 |
