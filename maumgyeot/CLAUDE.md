# CLAUDE.md — 마음곁 (MaumGyeot)

> 이 파일은 **마음곁 저장소(`maumgyeot/`)에서 작업할 때의 규칙**이다.
> 클로드코드는 이 폴더에서 일할 때 이 문서의 규칙만 따른다. (형제 서비스 마음수달의 규칙·도메인을 섞지 말 것)
> 상위 폴더 구조: `마음/maumgyeot/` (형제: `마음/maumotter/`, 공유: `마음/_shared/`)

---

## 0. 이 서비스가 무엇인가 (한 줄)

반려동물의 행동·표정·소리를 **동물행동학 관점에서 읽어**, 보호자가 이해·대응할 수 있는 통역으로 전달하는 서비스.

핵심 철학: **AI는 보호자와 반려동물의 유대를 대체하지 않는다. 둘 사이의 다리(bridge)다.**
마음수달과 같은 구조("표현 못 하는 존재의 행동을 읽어 보호자에게 통역"), 대상만 반려동물.

---

## 1. 설계 문서 (작업 전 반드시 읽기)

`docs/` 안의 세 문서가 이 서비스의 전부다. 작업 전 관련 문서를 읽는다.
- `docs/maumgyeot-spec.md` — 전체 아키텍처·화면·D1 스키마·API·로드맵 (메인)
- `docs/maumgyeot-translation-engine.md` — 통역 엔진 LLM 프롬프트 전문
- `docs/maumgyeot-behavior-library.md` — 개·고양이 행동 사전(시드 데이터·도감 소스)

공유 규약: `../_shared/maum-shared-spec.md` — JWT·계정·브랜드 (마음수달과 공통)
재사용 참고: 필요 시 `../maumotter/`의 엔진·인증 코드를 베이스로 변형 (구조 동일).

---

## 2. 이 서비스의 도메인 규칙 (마음수달과 다름 — 혼동 금지)

| 항목 | 마음곁 규칙 |
|------|-------------|
| 통역 대상 | **반려동물(개·고양이)의 행동·감정** |
| 금지 용어 | **수의학 용어**(진단·처방·병명·치료법) — 건강 우려는 "수의사 상담 권장"으로만 |
| 화법 | 절대 단정 금지. 모든 통역에 **confidence**(low/medium/high) 필수 |
| 핵심 원칙 | 단일 신호로 판단 금지(전체 몸 함께 읽기), 같은 신호도 맥락·종에 따라 정반대 가능 |
| 종 분리 | 개/고양이 행동 사전·해석 **완전 분리** (신호 체계가 다름) |
| 건강 신호 | 통증·이상행동 → health_flag로 수의사 연계. 진단 아님 명시 |

> ⚠️ 이 폴더에서 "통역"은 **동물행동학**이다. 아동 정서·발달 용어가 끼어들면 안 된다.

---

## 3. 통역의 황금률 (행동학 문헌 기반 — 타협 불가)

1. **단일 신호 ≠ 단정**: 꼬리·귀·눈·자세·발성을 함께 읽는다.
2. **같은 신호 = 정반대 의미 가능**: 꼬리 흔들기(개)·골골거림(고양이)이 대표적. 행동 사전에서 ⚠️로 표시된 다의적 신호 특히 주의.
3. **맥락·종·개체가 전부**: 상황·종·품종·성격으로 보정.
4. **과대광고 금지**: "95% 정확도", "당신 개가 ~래요" 식 단정 금지. 교육형("이 행동은 ~일 수 있고 왜 그런지")으로.

> 이 서비스의 신뢰는 "단정하지 않음"에서 나온다. 경쟁 앱과의 차별점이 곧 이것.

---

## 4. 안전·윤리 (기능이 아니라 제약)

spec 3장 준수. 특히:
1. **단정 금지 = 과대광고 방지**: 항상 confidence + "~일 수 있어요".
2. **수의학 영역 침범 금지**: 질병 진단·치료·처방 금지. 수의사 연계만.
3. **건강 위험 에스컬레이션**: 통증·이상행동 패턴 → 보호자 알림 + 수의사 상담 권유.
4. **영상 휘발성**(마음수달 7-C 승계): 온디바이스 분석 + 원본 즉시 폐기. 영상에 사람 얼굴 포함 가능성도 동일 민감 처리.
5. **유대 대체 방지**: "직접 관찰·교감이 가장 중요"를 일관되게 안내.

---

## 5. 기술 스택·작업 방식 (cloudflare-dev 스킬 준수)

- **No local dev**: GitHub 웹 UI → Cloudflare 자동 배포. `npm run dev`·`wrangler dev` 안내 금지.
- **파일 전체 교체**: 완성된 전체 파일 제공 (Ctrl+A → 붙여넣기).
- **스택**: Cloudflare Workers + Hono + D1 + KV, 프론트 React CDN(unpkg).
- **JWT**: `crypto.subtle` 필수, `btoa()` 직접 금지, 한국어 TextEncoder UTF-8. **구조·시크릿은 `_shared/maum-shared-spec.md` 2장 따름** (마음수달과 동일해야 통합 로그인 성립).
- **CORS**: 와일드카드 금지, 동적 오리진 매칭. 마음 시리즈 공통 화이트리스트(`_shared` 3장).
- **D1**: `DROP/RENAME COLUMN`·타입 변경 불가. 변경은 대시보드 Console `ALTER TABLE ADD COLUMN`.

---

## 6. 인프라 식별자 (작업 시 채워넣기)

| 항목 | 값 |
|------|-----|
| GitHub 저장소 | maumgyeot |
| 도메인 | app.maumgyeot.com / api.maumgyeot.com |
| D1 (서비스) | (생성 후 기입) |
| D1 (공용 인증) | maum-auth (형제와 공유, `_shared` 1장) |
| KV | (생성 후 기입) |
| JWT_SECRET | Cloudflare Secret (마음수달과 동일 값) |

---

## 7. 통역 엔진 핵심 규칙

- 관찰 종료 시 행동 신호 + 맥락 + 반려동물 정보 → LLM 1회 호출 → 리포트 JSON.
- `temperature: 0`, 출력은 순수 JSON, 파싱 실패 대비 try-catch.
- **종(species)별 행동 사전·해석 분리**.
- 모든 통역에 confidence. 신호 적으면 low + "더 지켜봐 주세요".
- 수의학 용어 출력 후처리 검증. 건강은 보수적·"진단 아님" 명시.
- 상세 프롬프트는 `docs/maumgyeot-translation-engine.md`, 행동 의미는 `docs/maumgyeot-behavior-library.md`.

---

## 8. 착수 권장 순서

D1 스키마 → 인증/JWT(공유 규약) → 반려동물 등록 → 관찰·통역 API → 통역 엔진 → 결과 화면 → 행동 사전(도감).

먼저 1차 MVP 범위(보호자 가입 → 반려동물 1마리 등록 → 사진/짧은 영상 + 맥락 → 통역 리포트 1종, **고양이 우선**)부터.
**마음수달 코드를 베이스로 재사용**하면 인증·엔진 골격을 크게 단축할 수 있다.

---

## 9. 절대 잊지 말 것

- 이 폴더 = **동물행동학 도메인**. 마음수달(아동) 규칙·용어를 끌어오지 말 것.
- 인증·브랜드만 `_shared`를 따르고, 나머지는 이 폴더 문서를 따른다.
- 모든 통역에 confidence + 단정 금지. 이게 이 서비스의 생명.

---

## 10. 안드로이드 앱화 — ⏸️ 보류 중 (2026-06)

> **결정: 안드로이드 앱 진행 당분간 보류.** 사유 = 앱은 마케팅 비용을 전부 직접 부담해야 해 부담이 큼.
> **웹 서비스(maumgyeot.com)는 그대로 운영·발전.** 아래는 재개 시 바로 이어갈 수 있게 남겨둔 자료.

### 이미 구현·배포되어 그대로 유지하는 것 (웹에도 유효 → 삭제·롤백 금지)
- **계정 삭제(회원 탈퇴)**: `DELETE /api/account`(도메인 데이터 + 공용 maum-auth 계정 삭제), 공개 페이지 `/privacy`·`/account-deletion`, 홈 하단 링크. → Play 요건이자 **웹 개인정보 보호에도 필요**하므로 유지.
- **AdMob 배너 웹 훅**: `public/index.html`의 `initBannerAd()`. **Capacitor 네이티브에서만 동작, 웹 브라우저에선 no-op**(가드+try/catch)라 그대로 둬도 웹 영향 0. 현재 Google 테스트 ID.

### 재개 시 쓸 자료 (보류 동안 건드릴 필요 없음)
- 래핑 스캐폴드: `maumgyeot/app/`(capacitor.config.ts `appId=com.maumgyeot.app`, capacitor-www, native-templates: MainActivity textZoom+카메라권한, AndroidManifest CAMERA/RECORD_AUDIO/AD_ID+AdMob meta), 단계별 `maumgyeot/app/README.md`.
- 루트 플레이북: `../ANDROID_APP_PLAYBOOK.md`. 메모리 `project_android_app_plan`.
- 결정됐던 형태: **광고형(AdMob)**. 두 앱 이메일 로그인이라 WebView OAuth 이슈 없음.

### 재개 시 남은 작업(로컬·Play)
`npx cap add android` → 네이티브 fix 적용 → 카메라 실기확인 → AdMob 실 ID 2곳 교체 → 키스토어+`.aab` → Play 내부테스트 → (개인계정이면) 비공개테스트 12명·14일 → 프로덕션.

### 유료화·제휴는 앱과 분리되어 계속 (웹 기준)
- 앱 보류와 무관하게 **웹 유료화**는 진행 가능. 방향: **구독+월 사용캡**, 런칭 결제는 **스마트스토어+쿠폰(CTS 쿠폰 시스템 포팅)** — 토스 승인 지연 회피. 제휴는 `?ref=` 추적.
- 상세: 메모리 `project_maum_series_monetization`.

---

## 11. 유료·법적·운영 기능 (2026-06 구축 완료)

> 숫자 상수는 모두 `src/index.ts` 상단. 마이그레이션 `migrations/0001_billing·0002_referrals·0003_errors.sql`(적용됨).

**유료/쿼터**: `통역 1회 = /api/observe 1건`. 무료 월 5(`FREE_MONTHLY`) + 구독(`sub_light` 30/`sub_pro` 100, 30일) + 회차권(`pack10` 10회/60일). 차감순 무료→구독→회차권. 테이블 subscriptions·packs·usage_monthly. `getEntitlement`/`consumeQuota`. 한도초과 402(code:QUOTA).
**쿠폰(스마트스토어 결제경로)**: 구매→코드→`/api/coupon/redeem` 등록. 발행/조회 `/admin`(ADMIN_SECRET, **설정됨**). 테이블 coupons·coupon_redemptions.
**게스트 미리보기**: `/api/observe/guest`(IP당 평생 2회, 저장X). **제휴**: `?ref=`→referrals→`/api/admin/referrals`.
**법적 페이지**: `/privacy /terms /faq /account-deletion`(PAGE 헬퍼 + `BIZ` 사업자정보=마음서비스 780-31-01832·통신판매업 제2026-서울영등포-1157·대표 김근혜). **회원탈퇴** `DELETE /api/account`(도메인+빌링·제휴행 전부 삭제).
**이메일(Resend) — 상용화 시점까지 보류(키 미설정·no-op)**: 비번재설정(`/api/auth/forgot-password`·`/reset`)·이메일인증(가입메일·`/verify`·`resend-verify`) 코드는 완성·배포됨. **`RESEND_API_KEY` 미설정 시 완전 no-op**(기존 흐름 무영향). maum-auth `email_verified` 컬럼(시리즈 공유). `EMAIL_FROM` 선택(기본 `noreply@maumgyeot.com`).
> ⚠️ **치명 주의**: Resend **도메인 미검증 상태로 키만 넣지 말 것**. 발송은 실패하는데 `email_required=true`가 되어 **미인증 유저 쿠폰등록이 전부 403으로 막힘**. → **Resend 도메인 검증(Cloudflare DNS에 SPF/DKIM/MX) 완료 후에만** `wrangler secret put RESEND_API_KEY`.
**운영 모니터링**: error_logs+`logError`+`app.onError`, `/api/admin/stats`(대시보드)·`/admin` 패널.
**프론트(public/index.html)**: `EntitlementCard`(이용권·코드등록·구매링크 `STORE_URL` 상수[미설정]·이용내역 `/api/history`), `VerifyBanner`(설정+미인증시만), 온보딩 가이드(0마리시), 랜딩 서비스소개. `og.png`+OG메타. 광고 훅 `initBannerAd`(앱 전용, 웹 no-op).
**웹 애널리틱스**: Cloudflare 자동설정 집계중 — ⚠️ 코드에 수동 beacon 금지(이중집계).
**미설정 항목**: `RESEND_API_KEY`·`STORE_URL`(스토어 URL)·토스 라이브키.

## 12. 연동형 유료결제 (마음풀 통합결제 — 착수 대기)
곁 유료결제는 **마음풀에서 상품 판매 후 곁으로 자동 지급**하는 방식으로 통합 예정. 사업자 단일(마음서비스). 수달과 **동일 엔진 대칭 구현**.
- **곁 추가 구현(착수 지시 시)**: `POST /api/grant`(HMAC=`MAUM_SSO_SECRET` → `{email,grantType,orderId}` → maum-auth email→uid[없으면 생성] → 기존 `applyGrant(uid, sub_light|sub_pro|pack10)`) + `external_orders` 멱등테이블 + `/api/grant/revoke`(환불). 기존 쿠폰·SSO·entitlement 재사용.
- **⚠️ 토스페이먼츠 완전 반영 후에만 착수·배포**. 상세 스펙 = 메모리 `project_maum_unified_payment` / 루트 `../CLAUDE.md` 「연동형 유료결제」.
