# BATCH_06 작업 결과 보고서

| 항목 | 내용 |
|---|---|
| 배치 | BATCH_06_정리 (마지막 배치) |
| 작업일 | 2026-09-19 ~ 2026-09-20 |
| 대상 이슈 | R-14·15·16·17·29·30·31·32·33·35·36·49·52·53·54·55·56 (17건) |
| 완료 | 15건 |
| 보류 | 2건 — R-52(app.jsx 전역충돌 위험·검증 불가) · R-15(푸시 주기 사용자결정) |
| 배포 | CTS(lightoflife) · 마음풀(maumful) · 마음게임(maumgame) · 수달(GitHub 자동) · 워크플로 3개(다음 push부터 적용) |

## 1. 이슈별 처리 결과

| ID | 군 | 결과 | 커밋 | 검증 |
|---|---|---|---|---|
| R-33 | C | ✅ 3워크플로 재빌드 스텝 | `[cts]`3fc0241·`[공통]`b4d3249 | 로컬 build 성공·YAML 검증·드리프트 확인 |
| R-17 | C | ✅ 결제 region 화이트리스트 | `[cts]`824bdbe | 배포 e0495ef0·정상상품 통과/교차 차단 로직 |
| R-36 | C | ✅ 스크립트·lint스텝·롤백문서 | `[maumful]`d1cd0c3 | smoke 2/2·deployments list 검증 |
| R-14 | A | ✅ creditPrices 제거 | `[maumful]`6b62f7c | **라이브 검증**(응답에서 사라짐·타 키 유지) |
| R-30 | A | ✅ face-api @0.22.2 고정 | `[maumotter]`721f5d7 | 태그 weights/ 존재 HTTP 200 |
| R-49 | A | ✅ 네이버폴백·GOOGLE주석·dev SERVICE_URL | `[cts]`824bdbe | 배포 06fb7c32 |
| R-53 | A | ✅ allTests 8→10 | `[maumgame]`6b62f7c | 서버만·CTS게임 8 유지 |
| R-56 | A | ✅ 죽은분기 주석·CLAUDE 정정 | `[maumful]`6b62f7c | 주석만→compiled 무변경·render_smoke |
| R-52 | A | ⬜ **보류** | — | 아래 §6 |
| R-15 | A | ⬜ **보류(사용자결정)** | — | 아래 §6 |
| R-29 | B | ✅ 수달 TTS 문서 | `[maumotter]`721f5d7 | 코드값 대조 |
| R-16 | B | ✅ phyweb 6종 문서 | `[maumful]`b088618 | 코드값 대조 |
| R-31·R-55 | B | ✅ 루트 통합결제 정정 | `[공통]`422ba8a | **사용자 승인**(배포완료로 갱신) |
| R-32 | B | ✅ HANDOVER 커플워커 | `[cts]`824bdbe | 워커 실재 HTTP 200 확인 |
| R-54 | B | ✅ 구독 표시전용 문서 | `[maumful]`b088618·`[maumcouple]`b088618 | notify-plan 0건 확인 |
| R-35 | B | ✅ CTS staging cron 제거 | `[cts]`824bdbe | staging워커 미배포 확인 |

## 2. 이슈별 상세 (특히 신경 쓴 것)

- **R-33 — 세 워크플로 각각**: `cts-maum-main/.github/workflows/deploy.yml`(`npm run build:jsx` 스텝) · `deploy-production.yml`(maumful `build:assets`, maumcouple `build:jsx`) · `deploy-staging.yml`(setup-node·npm ci **부재**라 함께 추가 + 재빌드). **차단형 `git diff --exit-code` 가드는 넣지 않았다** — esbuild 버전이 `^0.25/^0.28` **caret 범위**라 CI가 lockfile과 다른 패치를 설치하면 산출물 차이로 **모든 프로덕션 배포를 오탐 차단**할 수 있고, 이는 사용자 최우선(운영중단 절대방지)과 정면 충돌한다. 대신 **배포 직전 재빌드**로 "옛 번들 배포"라는 실제 harm을 확실히 제거했다(재빌드 산출물이 곧 배포물). 커밋 위생 가드는 §6 권고로 남긴다. **현재 드리프트 재확인**: maumful `build:assets` 로컬 실행 시 compiled/*.js 드리프트 0(tailwind.css만 재생성 차이=committed 번들이 옛것이었음, CI 재빌드로 해소). R-33 "현재 드리프트 없음"은 **여전히 참**(JS 기준).
- **R-17**: `PACKAGES` 타입에 `region:'KR'|'GLOBAL'` 추가·12개 항목 분류(`_kr`+product=KR, `_g`=GLOBAL). toss/checkout(KR만)·stripe/checkout(GLOBAL만)·prepare-charge(pg=stripe→GLOBAL/그외→KR) 3곳 가드. **웹훅 2곳(stripe webhook L1870 등)은 가드 안 함**(이미 성공한 결제 거부 시 돈만 빠짐). 가격 숫자 무변경.
- **R-30**: **2안(태그 고정)** 채택. `@master`→`@0.22.2`(라이브러리 L118과 동일). 근거: 태그에 `weights/tiny_face_detector_model-weights_manifest.json` HTTP 200 확인. 1안(자체호스팅)은 가중치 용량 확인 필요·외부의존 제거 이점이 있으나 이번엔 최소수정 우선.
- **R-56**: **유지(주석+보존)** 채택. 삭제하면 부활 경로(푸터 '어드민' 라벨 복원)가 사라진다(설계서 §11). 주석만이라 compiled 무변경. CLAUDE.md '호출부 0'→'호출부 1(죽은분기·의도적 보존)'. DESIGN §2.5는 이미 정확했다.
- **R-36**: `maumful-main/.github/workflows/lint.yml`에 스텝 추가했으나 **이 파일은 하위 디렉터리라 부모 레포(maum-developserver) GitHub Actions가 실행하지 않는다**(중첩 .github 무시 — §4 발견). 로컬/문서 기준선으로 유효. typecheck는 **기존 6건 타입에러**(Bindings·crypto 타입)로 non-blocking(`continue-on-error`). `render_smoke.cjs`에 `global.location` 추가(PartnerEntry `location is not defined` 오탐 수정 → smoke 2/2 통과). 롤백 절차는 `deployments list` 실행 검증 후 문서화(rollback 자체는 프로덕션 되돌리므로 미실행).

## 3. 전제 불일치 (지시서 2026-09-19 기준 ↔ 실제)

| 이슈 | 지시서 전제 | 실제 |
|---|---|---|
| R-36 | "`maumful-main/.github/workflows/lint.yml`에 스텝 추가" | 그 파일은 **부모 레포 루트가 아니라 하위 디렉터리** → GitHub Actions 미실행. 루트 실행 워크플로는 build-android·deploy-production·deploy-staging뿐. |
| R-33 | "루트에 lint.yml 있음"(deploy-staging L4 등) | 루트 워크플로에 lint.yml 없음. maumful/cts의 lint.yml은 각 하위폴더(미실행). |
| R-35 | "스테이징이 매월 실결제 시도했을 수 있다" | **staging 워커 `lightoflife-dev` 미배포**(`secret list`→Worker not found) → cron이 실제로 돈 적 없음·실결제 이력 0. |
| esbuild | (암묵) 버전 고정 전제 | `^0.25.0`/`^0.28.0` **caret** — 차단형 diff 가드에 부적합(R-33 판단 근거). |

## 4. 새로 발견한 것 (미수정·보고만)

| # | 내용 | 조치 |
|---|---|---|
| 1 | CTS `toss/checkout` 통화 `'KRW'` 하드코딩 — USD(`_g`) 패키지를 ₩로 살 수 있던 부당청구 | **R-17로 해소됨**(region 가드로 `_g`가 toss 진입 자체 차단). 하드코딩 자체는 이제 KR만 도달하므로 안전. |
| 2 | 마음풀 **prod·dev cron 양쪽 활성**(`wrangler.toml:21-22`/`wrangler.dev.toml`) — 마음풀 스테이징도 매월 구독갱신 시도 | 범위 밖(BATCH_06은 CTS만). 마음풀 staging 워커 실재 여부 미확인 → 확인 권고. |
| 3 | **CTS staging KV = 마음풀 KV 동일 네임스페이스**(`cts dev.toml:16`·마음풀 = `9f74…`). prod CTS는 자체 `75bd…`. 생태계 3분할 전제와 상충 | 범위 밖(시크릿·세션 영향 큼). staging 미배포라 실피해 없음. 확인만. |
| 4 | `maumful-main/.github/workflows/lint.yml`이 부모 레포 Actions에서 실행 안 됨(중첩 .github) | R-36 §2 참조. 루트 승격 또는 maumful 독립레포화 권고. |
| 5 | 마음풀 `tsc --noEmit` 6건(Bindings.MAUM_SSO_SECRET·crypto 타입 4·Untyped generic 1) | 코드 미수정(범위 밖). 별도 타입정리 작업 후보. |

## 5. 미착수·확인 못 한 것

- **R-52 보류**(§6). **R-15 보류**(§6).
- `lightoflife-couple` 워커: 실재(HTTP 200)는 확인, **소스 레포 위치는 확인 못 함**(maum/ 어디에도 대응 폴더 없음). HANDOVER에 `⚠️ 미확인`으로 표기.
- 마음풀 staging 워커 실재 여부·CTS staging KV 공유의 시크릿 영향 범위: 미확인(범위 밖).

## 6. 사용자 확인 기록

- **R-31·R-55**(루트 CLAUDE.md): AskUserQuestion → **"배포 완료로 갱신(권장)"** 승인. 금지 규정 해제로 정정, 세대 추가.
- **R-52 보류 사유**(내 판단): 검사 문항수 4중관리 통합은 **순수 예방**(현재 전부 일치·버그 아님)인데, `TEST_Q_COUNT` 전역 const가 `landing.js`/`counseling.js` 전역과 충돌하면 **페이지 전체 SyntaxError**(설계서 §15-5)이고, `app.js`는 render_smoke가 stub 한계로 신뢰 불가라 **브라우저 없이 안전 검증 불가**. 운영중단 절대방지 최우선 원칙에 따라 보류. → 라이브 QA 동반 시 진행 권장.
- **R-15 보류**: 푸시 발송 주기(매일/주1/월1)·문구는 사용자에게 보이는 동작(§2.2). "현행 유지"(cron 미연결=푸시 안 감) 유지. 착수 시 KV 멱등마커+event.cron 분기 설계는 지시서 §2 R-15에 준비됨.
- **미결정 남김**: R-17 `ai_10` 단가 조정·충전팩 4종 유지/삭제·`PAYMENT_LIVE` 시점 / R-53 프론트 `TEST_META_HUB` 배지 2종 추가 / R-56 (a)유지 채택 / R-36 확장(마음부부·세대까지/전서비스) / `시스템 설계서/` 폴더 처리(동기화·폐기·유지) — 전부 가격·상품·UI·범위 판단이라 사용자 몫.

## 7. 갱신 문서 (정본)

- 코드/설정: `cts-maum-main/{src/index.tsx, wrangler.toml, wrangler.dev.toml, .github/workflows/deploy.yml}` · `maumful-main/{src/index.tsx, package.json, scripts/render_smoke.cjs, .github/workflows/lint.yml, DEPLOY_CHECKLIST.md, public/static/landing.jsx}` · `maumgame-main/src/index.tsx` · `maumotter/public/index.html` · `.github/workflows/{deploy-production,deploy-staging}.yml`
- 문서: 루트 `CLAUDE.md` · `maumful-main/CLAUDE.md` · `maumotter/CLAUDE.md` · `cts-maum-main/HANDOVER.md` · `package/maumcouple/docs/DESIGN.md` · 각 서비스 `docs/DESIGN.md §15`(배너) · `_docs/RISKS.md`
- **`시스템 설계서/` 사본 폴더는 건드리지 않았다**(git 미추적·정본만 수정). 동기화·폐기 여부는 §6 미결정.
