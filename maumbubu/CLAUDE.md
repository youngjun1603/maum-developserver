# CLAUDE.md — 마음부부 (maumbubu)

> **마음부부** = 부부 대화의 "말과 마음 간극"을 통역하는 마음풀 생태계 신규 앱. **라이브: https://bubu.maumful.com**
> 루트 공통규칙은 `../CLAUDE.md`, 마음커플 패턴 상세는 `../maumful-main/CLAUDE.md`(빌드·크레딧·검증 규칙 공유). 마음 시리즈(수달·곁)와는 **다른 생태계** — 규칙 혼동 금지.
> 상세 스펙·구현이력은 메모리 `project_maumbubu` 참조.

## 서비스 개요
- **이중 트랙 병행**: 심리상담(EFT·애착) + 기독교(Powlison/Keller/Tripp). 1층 탐지 공통, 2·3층 해석 분기.
- **4모드**: 수신("무슨 뜻?")·발신("어떻게 말하지?")·중재(싸운 대화 분석)·관점("상대는 어떻게 느꼈을까").
- 슬라이더(감정깊이/신학강도/목양톤), **관계기억**(누적 프로파일), 멀티모달+쌍방동의, 회복레이어(개선활동→피드백→성공공식→커뮤니티).
- **성인(만19세+) 전용**.

## 인프라 / 구조 (마음커플 패턴)
- **별도 워커 `maumbubu`** + `bubu.maumful.com`(custom_domain·DNS 자동). `wrangler.toml`: DB=**maumful-db**(f8046693)·KV=9f74…(생태계 공유, **신규 D1 없음** → D1 10한도 무관).
- **인증**: 마음풀 `/api/bubu-token`(type:'bubu'·7일 JWT) → `?t=` → localStorage('bubu_token'). 워커는 **공유 KV의 JWT_SECRET을 읽어 검증**(워커 secret 불필요). 모든 라우트 Bearer/`?t=` 가드.
- **AI**: 반드시 **AI Gateway 경유**(`gateway.ai.cloudflare.com/v1/313b6305…/maumful/anthropic/…`). 직접 api.anthropic.com은 403(unsupported_country). MODEL=마음풀과 통일.
- **크레딧**: maumful-db `spendCredits` 원자적 차감(수신·발신 2cr / 중재·관점 3cr, 피드백·커뮤니티 무료). Claude 실패 시 환불, 부족 시 402.
- **마음풀 연동 위치**: `src/index.tsx`(bubu-token) · `app.jsx` GlobalNav(`openMaumBubu`) · `landing.jsx` navItems(`isBubu` 분기). ⚠️ 프론트 헬퍼는 사용 컴포넌트 스코프에 정의(render_smoke 필수).

## 빌드 / 배포 / 검증
```bash
npm run build:jsx                                   # bubu_hub.jsx → compiled/bubu_hub.js (esbuild)
npx tsc --noEmit                                    # 타입 검증
node scripts/render_smoke.cjs public/static/compiled/bubu_hub.js   # ⚠️ 파일 인자 필수(기본값 landing.js라 없으면 ENOENT)
npx wrangler deploy                                 # 포그라운드 필수, limyj007 계정(313b6305)
```
- 프론트 수정 시 `public/index.html`의 `bubu_hub.js?v=N` **캐시버전 bump**.
- esbuild가 한글을 `\uXXXX`로 이스케이프 → **컴파일본 grep은 한글 리터럴 대신 ASCII 마커**(함수명·`safety_tier` 등)로.
- 배포는 [[feedback_cloudflare_account]] **limyj007 계정**·[[feedback_wrangler_deploy]] 포그라운드.

## ⚠️ 안전 오버라이드 — 분리 보호 3단계 (절대 완화·축약 금지)
`translation-prompts.ts` SAFETY_OVERRIDE는 **모든 통역 시스템 프롬프트에 상시 포함**.
- **T1 즉시분리**(신체·성적학대·생명위협): 통역·회복활동 전면중단 + 긴급자원(112/1366/1388/1577-1389).
- **T2 지속학대**(반복 정서학대·강압통제): 상대에 다가가는 활동 금지 → 자기보호만.
- **T3 일반갈등**: 통상 통역 + 회복레이어.
- 안전 발동(T1/T2) 시 **모드별 JSON 대신 안전 스키마**(`safety_tier·response·reframe·protect_actions·resources·door_open`) 출력 → 프론트 `SafetyScreen`으로 분기(공유·활동·커뮤니티 버튼 미노출·기관 tel:링크). `/translate`가 `relation_safety` 기록.
- 절대금지: 죄책감 유발·학대 정당화·기독교 트랙 공경/용서로 학대수인 권유.

## 선택적 공유 브리지 (ADDENDUM 01 §1)
- **공유 가능(이것만)**: 발신 다듬은문장 · 중재/관점 함께보기 · 개선활동('같이 해볼래?'). **절대 공유 금지**: 수신 통역결과·통역 이력·관계기억·활동 피드백.
- **T1/T2 안전 relation은 `/share/send` 403 차단**(가해자 흔적 방지, `hasRecentSafety` 30일). 자동/기본 공유 없음 — 건별 명시 + **미리보기 확인 1회** 필수.
- 배우자 연결 = **마음커플 `genSessionCode` 패턴**(6자·혼동문자 제외 초대코드·KV `bubu_invite:CODE`). 수신함 GET은 열람 시 viewed 처리(뱃지 카운트는 `?peek=1`로 읽음처리 회피).
- 엔드포인트: `/share/send·inbox·respond`, `/relation/invite·join`. 테이블: `shared_items`·`relation_safety`(migration 0002).

## 성인 연령 게이트 (ADDENDUM 01 §3)
- 온보딩 전 `AgeGate`(생년월일) → `/api/age/verify`(만나이 계산·만19세 미만 차단) → KV `bubu_adult:{uid}` 저장. `/relation` 응답 `adult` 플래그로 게이트 판단.
- maumful 계정 공유라 생년월일은 **maumbubu KV에 저장**(users 스키마 무변경).

## 유지 원칙 (코드 구현됨, 제거 금지)
- 안전 오버라이드 상시 · 동의 없는 멀티모달 데이터 프롬프트 주입 차단 · **원문 미저장**(translation_logs엔 track/mode만·activity note 미저장) · 동의 수락은 대상 본인만(대리동의 차단) · 동의 철회 양쪽 즉시 · 커뮤니티 **사전검수만**(사후삭제 아님)·거부 시 사유+수정제안·**author_hash만 저장**(user_id 금지) · 모든 출력 가설 어법.

## 미착수 (자료·지시 대기 — 임의 착수 금지)
- 세대통역 후속앱(부모-자녀) · 양방향 실시간 동기화(동시세션·커플 대시보드) · 상담사 마켓 · casebank BATCH_01 회귀검증(케이스뱅크 자료 필요) · 실기기 카메라 멀티모달 E2E.
