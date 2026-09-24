# 마음곁 (MaumGyeot) — 설계서 (DESIGN)

> 이 문서는 `_docs/_TEMPLATE.md` 표준 목차를 따르는 **통합 진입 문서**다.
> 기존 `docs/` 3종 문서를 대체하지 않는다. 도메인·통역엔진·행동학 상세는 그 문서로 **위임**하고,
> 여기에는 **코드에서 직접 확인한 사실**(아키텍처·스키마·API·인증·과금·운영·현황)을 채운다.

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음곁 (MaumGyeot) |
| 폴더 | `maum/maumgyeot/` |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `e95024a` (2026-08-29) — `[maumgyeot] AI 호출 전용 egress 프록시 경유 지원 — env AI_PROXY_URL(기본=기존 게이트웨이)` |

근거 소스: `CLAUDE.md`(160줄) · `README.md` · `wrangler.toml` · `package.json` · `src/index.ts`(664줄) · `src/auth.ts`(107줄) · `src/behavior.ts`(72줄) · `schema.sql` · `maum-auth-schema.sql` · `migrations/0001_billing·0002_referrals·0003_errors.sql` · `public/index.html`(399줄, React CDN 단일 파일) · `public/admin.html`(132줄) · `app/`(Capacitor 스캐폴드) · `docs/*.md` 3종 · `../CLAUDE.md` · `../_shared/maum-shared-spec.md`

---

## 1. 서비스 개요

- **한 줄 정의**: 보호자가 반려동물(개·고양이)의 **행동 신호 + 맥락 + 짧은 영상**을 입력하면, AI가 **동물행동학 관점으로 통역**해 "이런 마음일 수 있어요"를 돌려주는 반려동물 통역 서비스.
- **해결하는 문제**: 반려동물은 말을 못 하고, 보호자는 꼬리·귀·자세·발성이 무슨 뜻인지 모른다. 같은 신호가 종·맥락에 따라 **정반대 의미**를 갖는다는 사실 자체가 알려져 있지 않다. 그 해석 공백을 메운다.
- **타깃 사용자**: 개·고양이를 키우는 **보호자 본인**(계정 주체 = 보호자, 반려동물은 보호자 계정에 종속된 프로필). 마음수달과 달리 **모드 분리·게이팅이 없다**(보호자 단독 사용 — `docs/maumgyeot-spec.md` §4).
- **핵심 가치 제안**: **"단정하지 않음"이 곧 차별점.** 모든 통역에 `confidence`(low/medium/high)와 다의적 신호의 `caveat`이 붙는다. AI는 보호자와 반려동물의 유대를 대체하지 않는 **다리(bridge)**이며, 수의학적 진단은 절대 하지 않는다.
- **생태계 내 위치**: ⚠️ **마음 시리즈**(maumotter + maumgyeot)다. **마음풀 생태계가 아니다.** 스택을 혼동하면 사고가 난다.

| 구분 | 마음 시리즈 (이 서비스) | 마음풀 생태계 (maumful/게임/커플/부부/세대) |
|---|---|---|
| D1 (도메인) | **`maumgyeot-db`** (전용) | `maumful-db` 공유 |
| D1 (계정) | **`maum-auth`** (곁·수달 공용) | `maumful-db` 내 users |
| 프론트 | **React CDN(unpkg)·빌드 없음** | React + esbuild 사전컴파일 |
| 배포 | **GitHub 웹 UI → Cloudflare 자동 배포** | `wrangler deploy` (포그라운드) |
| 결제 | 쿠폰 코드 등록 + 마음풀 grant 수신 | 자체 결제 |
| 근거 | `../CLAUDE.md` 「마음 시리즈(수달·곁)는 별개 스택 — 마음풀/CTS 규칙을 끌어오지 말 것」 | — |

→ 상세: `../_shared/maum-shared-spec.md` §0 (무엇이 공유되고 무엇이 분리되는가)

---

## 2. 도메인 규칙 (이 서비스 고유)

> 이 폴더에서 "통역"은 **동물행동학**이다. 형제 서비스 마음수달(아동 정서·발달)의 용어·규칙이 끼어들면 안 된다.

| 항목 | 마음곁 규칙 | 코드 근거 |
|---|---|---|
| 통역 대상 | 반려동물(개·고양이)의 행동·감정 | `pets.species IN ('cat','dog')` |
| 금지 용어 | **수의학 용어**(진단·처방·치료·병명) — 후처리 검증 | `VET_TERMS` 11종, 검출 시 1회 재생성 |
| 화법 | 절대 단정 금지. 모든 통역에 `confidence` 필수 | `TRANSLATE_SYSTEM` `[confidence 기준]` |
| 핵심 원칙 | 단일 신호로 판단 금지(전체 몸 함께 읽기) | 프롬프트 `[통역의 황금률]` |
| 다의성 | 같은 신호도 맥락·종에 따라 정반대 가능 | `ambiguous:true` → `hasAmbiguous` → "caveat를 꼭 채우세요" |
| 종 분리 | 개/고양이 행동 사전·해석 **완전 분리** | `BEHAVIOR: Record<'cat'\|'dog', …>`, 종별 서브셋만 프롬프트 주입 |
| 건강 신호 | 통증·이상행동 → `health_flag` + 수의사 연계. 진단 아님 | `health:true` 신호 + `HEALTH_KW` 14종 맥락 키워드 OR 결합 |

- 행동 사전(신호별 후보 의미·다의성·건강 관련) → **상세: `docs/maumgyeot-behavior-library.md` §A(고양이)·§B(개)·§C(엔진 적용 규칙)**
- 통역 LLM 시스템 프롬프트 전문·입력 포맷·후처리·few-shot → **상세: `docs/maumgyeot-translation-engine.md` §2~§6**
- 황금률 5조·안전 5조 원문 → **상세: `docs/maumgyeot-spec.md` §2·§3**

---

## 3. 사용자 플로우

**시나리오 1 — 비회원 미리보기(로그인 전 체험)**
랜딩(`Auth`) → [로그인 없이 체험해보기] → `GuestObserve` → 종 선택(고양이/개) → 행동 신호 칩 선택 + 상황 입력 → `POST /api/observe/guest` → 리포트 표시 → "가입하고 계속하기". **IP당 2회**(`GUEST_FREE`), **저장하지 않는다**.

**시나리오 2 — 첫 이용(보호자)**
회원가입(`POST /api/auth/register`, `?ref=` 귀속) → 대시보드(0마리 온보딩 3단계 안내) → 반려동물 등록(이름·종·품종·나이·성격) → [통역 받기] → 신호 선택 + 맥락 입력 → `POST /api/observe`(쿼터 1 차감) → 통역 리포트 → 지난 통역 목록.

**시나리오 3 — 영상 통역**
`Observe` 화면 → [📹 영상 찍어서 통역받기] → 후면 카메라(`facingMode:'environment'`) → [● 촬영 시작(약 7초)] → **1.1초 간격 6프레임을 기기에서 canvas로 추출**(360px, JPEG q0.7) → 카메라 트랙 즉시 정지 → 프레임 base64를 `/api/observe`에 실어 Claude 비전 호출 → 리포트. **원본·프레임 미저장**, DB에는 `media_note='영상 분석함(원본·프레임 미저장)'`만.

**시나리오 4 — 이용권 등록**
대시보드 `EntitlementCard` → 코드 입력 → `POST /api/coupon/redeem` → `applyGrant`로 구독/회차권 즉시 반영. 구매는 "마음풀에서 구매하기 →"(`https://maumful.com/?go=charge`) 링크로 이동.

**시나리오 5 — 형제 앱 이동**
대시보드 하단 마음수달 카드 → `https://maumotter.com/#token=<JWT>` → 수신 앱이 해시에서 토큰을 읽어 그대로 로그인(공용 `maum-auth`·`JWT_SECRET` 공유). 반대 방향(수달 → 곁)도 `App`의 `#token=` 훅으로 동일하게 수신한다.

**화면 구성 (파일 단위)**
| 파일 | 역할 |
|---|---|
| `public/index.html` | 프론트 전체(단일 파일 399줄, React 18 CDN + htm). 컴포넌트: `Auth`·`Dashboard`·`Observe`·`Report`·`Reports`·`Behavior`(행동 도감)·`VerifyBanner`·`EntitlementCard`·`GuestObserve`·`App` |
| `public/admin.html` | 운영 현황·쿠폰 발행/목록·제휴 통계·최근 오류 관리자 화면(ADMIN_SECRET Bearer) |
| Worker 서버 렌더 페이지 | `/privacy` `/terms` `/faq` `/account-deletion` `/verify` `/reset` (`src/index.ts`의 `PAGE()` 템플릿) |

`App`의 view 상태 전이: `dashboard → observe → report` / `reports` / `guide`(행동 도감). 비로그인은 `Auth ↔ GuestObserve`.

---

## 4. 기능 명세

| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 보호자 가입·로그인 | 공용 maum-auth 기반, PBKDF2+JWT | 배포됨 | `src/index.ts:213~239`, `src/auth.ts` |
| 2 | 반려동물 등록 | 이름·종(cat/dog)·품종·나이·성격 메모 | 배포됨 | `GET/POST /api/pets` |
| 3 | 행동 사전 API·도감 화면 | 종별 신호 목록(그룹·다의성·건강 플래그) | 배포됨 | `GET /api/behavior`, `src/behavior.ts`, `Behavior` |
| 4 | 신호+맥락 통역 | Claude Sonnet 4.6, `temperature:0`, 순수 JSON | 배포됨 | `POST /api/observe`, `runTranslation()` |
| 5 | 영상 통역(비전) | 7초·6프레임 온디바이스 추출 → 분석에만 일시 전송, 미저장 | 배포됨 | `Observe.startRec()`, `runTranslation` `frames` |
| 6 | 수의학 용어 후처리 | `VET_TERMS` 11종 검출 시 경고 프롬프트로 1회 재생성 | 배포됨 | `runTranslation()` |
| 7 | 건강 신호 보정 | 신호 `health:true` 또는 맥락 키워드 14종 → `health_flag` 강제 true | 배포됨 | `HEALTH_KW`, `signalsToLines` |
| 8 | 통역 리포트 목록·상세 | 목록은 summary 90자 + confidence, 원문은 상세 | 배포됨 | `GET /api/reports`, `/api/reports/:id` |
| 9 | 비회원 미리보기 | IP당 2회, 저장 없음, 가입 유도 | 배포됨 | `POST /api/observe/guest`, `GuestObserve` |
| 10 | 쿼터·구독·회차권 | 무료 월 5 + sub_light 50 / sub_pro 150 + pack10(15회·60일) *(2026-09-24 상향)* | 배포됨 | `getEntitlement`·`consumeQuota`·`applyGrant` |
| 11 | 쿠폰 등록 | 코드 정규화·1인 1회·만료·소진 검사 | 배포됨 | `POST /api/coupon/redeem` |
| 12 | 이용 내역 | 이용권 등록 이력 100건 | 배포됨 | `GET /api/history` |
| 13 | 제휴 추적 | `?ref=` first-touch localStorage 저장 → 가입 시 귀속 | 배포됨 | `referrals` 테이블, `App` useEffect |
| 14 | 관리자 대시보드 | 운영 통계·쿠폰 발행/목록·제휴·에러 | 배포됨 | `/api/admin/*`, `public/admin.html` |
| 15 | 마스터 계정 무제한 | 이메일 화이트리스트, 쿼터·레이트리밋 면제 | 배포됨 | `MASTER_EMAILS`, `isMasterUid` |
| 16 | 회원 탈퇴 | 도메인·빌링·제휴 8개 테이블 + 공용 계정 삭제 | 배포됨 | `DELETE /api/account` |
| 17 | 법적 고지 페이지 | 개인정보·약관·FAQ·탈퇴 (사업자 정보 포함) | 배포됨 | `/privacy` `/terms` `/faq` `/account-deletion` |
| 18 | 비밀번호 재설정·이메일 인증 | Resend. `RESEND_API_KEY` 미설정 시 전 구간 no-op | 구현·배포됨(키 미설정으로 비활성) | `/api/auth/forgot-password`·`reset-password`·`resend-verify`·`/verify`·`/reset` |
| 19 | 마음풀 통합결제 grant | 서명 grant 수신·멱등·환불 revoke | **구현·커밋됨 / 정책상 착수 대기** — ⚠️ §15 참조 | `POST /api/grant`, `/api/grant/revoke` |
| 20 | 형제 앱 `#token=` 진입 | 해시 토큰으로 즉시 로그인(양방향) | 배포됨 | `App` useEffect, `Dashboard` 마음수달 카드 |
| 21 | AdMob 하단 배너 훅 | Capacitor 네이티브 전용, 웹은 no-op. **현재 Google 테스트 ID** | 구현·미배포(앱 보류) | `initBannerAd()`, `public/index.html` 끝 |
| 22 | 안드로이드 앱 래핑 | Capacitor URL 래핑 스캐폴드(`app/`) | **보류(2026-06)** | `app/capacitor.config.ts`, `app/README.md` |
| 23 | 마음풀 SSO 수신(`/api/auth/sso`) | 마음풀 → 곁 로그인 인계 | **미구현** — ⚠️ 수달에는 있으나 곁에는 라우트 없음(§15) | — |
| 24 | 관찰 누적 추이·개 사전 확장 | 시계열 리포트 | 설계만 | `docs/maumgyeot-spec.md` §9 2차 |

---

## 5. 아키텍처

- **스택**: Cloudflare Workers + Hono 4.6 + D1 ×2 + KV ×1 + Workers Assets. 프론트 React 18 **CDN(unpkg)** + htm 3.1.1.
- **워커명 / 도메인**: 워커 `maumgyeot`. `wrangler.toml` 커스텀 도메인은 **루트 `maumgyeot.com` 하나**뿐. CLAUDE.md §6이 적은 `app.maumgyeot.com` / `api.maumgyeot.com`은 **wrangler.toml에 없다**(⚠️ §15).
- **프론트 빌드 방식**: **빌드 없음(no-build)**. `public/`을 Assets 바인딩으로 그대로 서빙, `/api/*`·정책 페이지 외 모든 경로는 `app.all('*')`에서 `ASSETS.fetch`로 위임. `package.json` 스크립트는 `deploy: wrangler deploy` 하나뿐(build 스크립트 없음).
- **외부 API**:
  - Anthropic — **Cloudflare AI Gateway 경유 필수**(`AI_GATEWAY` 상수). 직접 `api.anthropic.com` 호출은 Workers egress에서 403 차단.
  - `AI_PROXY_URL` 환경변수가 있으면 Anthropic 호출을 전용 egress 프록시로 우회(기본값 = AI Gateway). 최신 커밋에서 추가.
  - Resend — 직접 호출(`api.resend.com`), 키 미설정 시 no-op.
  - **OpenAI(TTS)·STT는 이 서비스에 없다**(마음수달과의 차이).
- **모델**: 통역 `claude-sonnet-4-6` 단일(max_tokens 1400, temperature 0). 대화형 모델 없음. LLM 호출은 **25초 타임아웃 + 1회 자동 재시도**(`callClaude`).
- **비전 입력**: `frames` 최대 6장을 `image/base64` 블록으로 앞에 붙이고 텍스트 메시지를 뒤에 둔다.
- **구성도**:

```
      [보호자 휴대폰]  public/index.html  (React CDN, no-build)
            │  카메라 → canvas 6프레임(기기 내)
            │  Bearer JWT
            ▼
  ┌──────────────────────────────────────────────┐
  │  Worker: maumgyeot  (Hono, src/index.ts)     │
  │   KV 레이트리밋 / 쿼터 엔진 / onError 로깅   │
  │   ⚠️ CORS 미들웨어 없음(§15)                 │
  └───┬───────────┬──────────────┬───────────────┘
      │           │              │
  ┌───▼─────────┐ ┌─▼──────────┐ ┌─▼────────────────────┐
  │ DB          │ │ AUTH_DB    │ │ KV                   │
  │ maumgyeot-db│ │ maum-auth  │ │ rl: / guest_observe: │
  │ pets        │ │ users      │ │ pwreset: emailverify:│
  │ observations│ │ (수달과    │ └──────────────────────┘
  │ pet_reports │ │  공유)     │
  │ billing 7종 │ └────────────┘
  └─────────────┘        │ AI Gateway(필수) 또는 AI_PROXY_URL
                         ▼
                 Anthropic Claude Sonnet 4.6 (텍스트 + 비전)
```

---

## 6. 데이터 모델 (D1)

### 6.1 `maumgyeot-db` (바인딩 `DB`, id `d04c7ab8-011c-4fd8-a4d1-63a73b1f9c57`)

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `pets` | 반려동물 프로필 | id, maum_user_id, name, species('cat'/'dog'), breed, age, personality | 보호자 계정 종속. `idx_pets_user` |
| `observations` | 관찰 1건 = 통역 1요청 | id, pet_id, maum_user_id, species, signals_json, context, media_note | 맥락 2000자 제한. 영상은 메모만 저장 |
| `pet_reports` | 통역 리포트 | id, observation_id, pet_id, maum_user_id, report_json, health_flag | 관찰 1건당 1건 |
| `subscriptions` | 구독 | maum_user_id(PK), plan(light/pro), monthly_quota, expires_at | 0001_billing |
| `packs` | 회차권 | maum_user_id(PK), remaining, expires_at | 0001_billing |
| `usage_monthly` | 월 사용량 | (maum_user_id, ym) PK, used | 0001_billing |
| `coupons` | 쿠폰 발행 | code(PK), type, max_redemptions, redeemed_count, per_user_limit, valid_until, active, source, batch_id | 0001_billing |
| `coupon_redemptions` | 쿠폰 사용 | code+maum_user_id UNIQUE | 0001_billing |
| `referrals` | 제휴 유입 | maum_user_id(PK), ref | 0002_referrals |
| `error_logs` | 운영 에러 | place, message, created_at | 0003_errors |
| `external_orders` | 통합결제 주문 멱등 | order_id, email, maum_user_id, grant_type, status, applied_at, revoked_at | ⚠️ **코드는 참조하나 어떤 .sql에도 DDL이 없음** (§15) |

### 6.2 `maum-auth` (바인딩 `AUTH_DB`, id `2df188da-159e-43ea-be31-b2dc39d8501d`)

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `users` | 마음 통합 계정 | id(=maum_user_id), email UNIQUE, password_hash(PBKDF2 `salt:hash`), name, created_at | **마음수달과 동일 DB·동일 ID 공유** |
| `users.email_verified` | 이메일 인증 플래그 | — | ⚠️ 코드(`markEmailVerified`/`isEmailVerified`)는 쓰지만 **스키마 파일에 컬럼 정의 없음** (§15) |

- **마이그레이션 파일 수**: 3개(`0001_billing.sql`, `0002_referrals.sql`, `0003_errors.sql`) + 베이스 `schema.sql`, `maum-auth-schema.sql`.
- **다른 서비스와 공유하는 테이블**: `maum-auth.users` 1개(마음수달 `maumotter`가 동일 database_id를 `AUTH_DB`로 바인딩). 도메인 테이블은 전부 분리.
- D1 제약: `DROP/RENAME COLUMN`·타입 변경 불가. 운영 중 변경은 대시보드 Console에서 `ALTER TABLE ADD COLUMN`만.

### 6.3 KV 키 스킴 (바인딩 `KV`, id `ab0da67427b44439a1c6348a4e014a62`)
| 키 | 용도 | TTL |
|---|---|---|
| `rl:<key>:<bucket>` | 레이트리밋 버킷 | window×2초 |
| `guest_observe:<ip>` | 비회원 미리보기 사용 횟수 | 31,536,000초(1년) |
| `pwreset:<token>` | 비밀번호 재설정 | 1시간 |
| `emailverify:<token>` | 이메일 인증 | 7일 |

---

## 7. API 계약

전체 **32개 라우트**(`app.get/post/delete/all` 기준). 인증 표기: `JWT`=Bearer 마음 JWT, `ADMIN`=`Bearer ADMIN_SECRET`, `HMAC`=`MAUM_SSO_SECRET` 서명 토큰, `-`=공개.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/health` | - | 헬스체크 |
| POST | `/api/auth/register` | - | 가입(+`ref` 저장, 레이트 5/1h) |
| POST | `/api/auth/login` | - | 로그인(레이트 10/60s) |
| GET | `/api/auth/me` | JWT | 내 정보 + `email_verified` + `email_required` |
| POST | `/api/auth/forgot-password` | - | 재설정 메일(항상 `{ok:true}` — 계정 존재 노출 방지) |
| POST | `/api/auth/reset-password` | - | 토큰으로 비밀번호 변경 |
| POST | `/api/auth/resend-verify` | JWT | 인증메일 재발송(키 없으면 503, 레이트 3/1h) |
| GET | `/api/pets` | JWT | 반려동물 목록 |
| POST | `/api/pets` | JWT | 반려동물 등록 |
| GET | `/api/behavior?species=cat\|dog` | - | 행동 사전(도감·신호 선택) |
| POST | `/api/observe` | JWT | **쿼터 1 차감** + 통역 리포트 생성(레이트 8/60s) |
| POST | `/api/observe/guest` | - | 비회원 미리보기(IP당 2회, 미저장) |
| GET | `/api/entitlement` | JWT | 잔여 통역 조회(마스터는 999999) |
| GET | `/api/history` | JWT | 이용권 등록 이력 100건 |
| POST | `/api/coupon/redeem` | JWT | 쿠폰 등록(미인증 이메일 403 `VERIFY`, 레이트 10/1h) |
| POST | `/api/grant` | HMAC | 마음풀 결제 → 이용권 지급(멱등, `service==='gyeot'` 검증) |
| POST | `/api/grant/revoke` | HMAC | 환불 회수 |
| POST | `/api/admin/coupon/create` | ADMIN | 쿠폰 대량 발행(최대 500) |
| GET | `/api/admin/coupon/list` | ADMIN | 쿠폰 목록 500건 |
| GET | `/api/admin/referrals` | ADMIN | 제휴 가입·전환 집계 |
| GET | `/api/admin/errors` | ADMIN | 최근 에러 200건 |
| GET | `/api/admin/stats` | ADMIN | 운영 통계(통역·펫·구독·쿠폰·제휴·에러) |
| GET | `/api/reports` | JWT | 리포트 목록(요약 90자 + confidence) `?pet_id=` |
| GET | `/api/reports/:id` | JWT | 리포트 상세 |
| DELETE | `/api/account` | JWT | 회원 탈퇴(전체 삭제) |
| GET | `/privacy` `/terms` `/faq` `/account-deletion` | - | 법적 고지 HTML (4개 라우트) |
| GET | `/verify` | - | 이메일 인증 링크 처리 |
| GET | `/reset` | - | 비밀번호 재설정 폼 |
| ALL | `*` | - | `ASSETS.fetch` 위임(정적 프론트) |

주요 상태코드: `402` 쿼터 소진(`code:'QUOTA'`) / 비회원 소진(`code:'GUEST_LIMIT'`) · `403` 이메일 미인증(`code:'VERIFY'`) · `413` 맥락 2000자 초과 · `429` 레이트리밋 · `503` 기능 미설정(키 없음).

> ⚠️ **`OPTIONS /api/*` preflight 라우트가 없다.** 마음수달에는 있다(§15).

→ 설계 단계의 축약 API 표: `docs/maumgyeot-spec.md` §6 (6행만 기재 — 현행과 차이 큼, §15 참조)

---

## 8. 인증 / 세션

- **인증 방식**: 이메일+비밀번호(8자 이상). 해시는 **PBKDF2-SHA256, salt 16B, 100,000회, 256bit**, 저장 형식 `saltHex:hashHex`. 전부 `crypto.subtle` 기반(`../_shared/maum-shared-spec.md` §2 규약 준수).
- **토큰 구조**: HS256 JWT, 페이로드 `{ maum_user_id, email, iss:'maum', exp }`, `exp`는 **초 단위**, 유효기간 **30일**(`30*86400`). 프론트는 `localStorage['maumgyeot_token']`에 보관(쿠키 미사용).
- **미들웨어**: `requireAuth`가 `Authorization: Bearer` 검증 후 `c.set('uid', maum_user_id)`.
- **SSO 연동** (`../_shared/maum-shared-spec.md` §1·§2 근거):
  1. **계정 원천 공유** — `maum-auth` D1 1개를 곁·수달 두 워커가 `AUTH_DB`로 동일 바인딩. `JWT_SECRET`도 시리즈 공유값이므로 한쪽에서 발급한 토큰을 다른 쪽이 검증 가능 = 통합 로그인 성립(shared-spec §1 "구현 확정(2026-06)").
  2. **형제 앱 이동** — `https://maumotter.com/#token=<JWT>`로 이동하고, 반대로 들어오는 `#token=`도 `App`의 useEffect가 받아 `localStorage`에 저장 후 즉시 로그인. `history.replaceState`로 해시를 즉시 지운다.
  3. **마음풀 SSO 수신** — **미구현**. `verifySso()` 함수는 존재하지만 `POST /api/auth/sso` 라우트가 없고, `MAUM_SSO_SECRET`은 `/api/grant`·`/api/grant/revoke` 검증에만 쓰인다(수달과의 비대칭 — §15).
- **CORS**: `../_shared/maum-shared-spec.md` §3과 `CLAUDE.md` §5는 4개 오리진 화이트리스트를 요구하지만, **`src/index.ts`에 CORS 관련 코드가 한 줄도 없다**(§15). 현재는 프론트가 같은 워커의 Assets에서 서빙되고 형제 앱 이동도 XHR이 아닌 페이지 이동(`#token=`)이라 실사용 장애는 확인되지 않는다.
- **마스터 계정**: `MASTER_EMAILS = ['limyj007@gmail.com']` 하드코딩. 쿼터·레이트리밋 면제, `/api/entitlement`가 `plan:'master'`·999999 반환.
- **어드민 인증**: JWT와 무관한 `Bearer ADMIN_SECRET` 단일 시크릿(미설정 시 전 어드민 API 503).

---

## 9. 외부 연동

| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic (AI Gateway 경유) | 통역 리포트(텍스트+비전) | `ANTHROPIC_API_KEY` | 설정됨·배포됨 |
| 전용 egress 프록시 | Anthropic 호출 IP 고정(선택) | `AI_PROXY_URL` | ⚠️ 미확인 (미설정 시 AI Gateway 폴백) |
| Resend | 비밀번호 재설정·이메일 인증 메일 | `RESEND_API_KEY`, `EMAIL_FROM` | **미설정 (의도적 보류)** — 도메인 검증 전 설정 금지, §14 금지사항 참조 |
| 마음풀 (maumful.com) | 통합결제 grant 수신 + 이용권 구매 링크(`?go=charge`) | `MAUM_SSO_SECRET` | ⚠️ 미확인 (미설정 시 503) |
| 관리자 콘솔 | 쿠폰 발행·운영 통계 | `ADMIN_SECRET` | 설정됨 (CLAUDE.md §11 "설정됨" 명시) |
| Cloudflare Web Analytics | 방문 통계 | — | 자동 설정(수동 beacon 금지 — 이중집계) |
| 네이버 스마트스토어 | 이용권 판매 | `STORE_URL` (프론트 상수) | **미설정(`''`)** — 현재는 마음풀 구매 링크로 대체 |
| Google AdMob | 앱 배너 광고 | `ADMOB.banner` (프론트 상수) | **테스트 ID·`testing:true`** — 앱 보류로 미배포 |

개인정보 처리위탁 고지(`/privacy` §3): Anthropic · Cloudflare · Google AdMob(도입 시) 3곳 명시.

---

## 10. 과금 / 수익 모델

- **과금 구조**: **통역 1회 = `/api/observe` 1건**. 차감은 "실제 통역 시도"일 때만(신호 선택·영상·맥락 중 하나라도 있을 때). 차감 우선순위는 **월간(무료+구독) → 회차권(pack)**. 마스터 계정은 면제.
- **상품·가격**:

| 코드 | 종류 | 제공량 | 유효기간 | 판매가 |
|---|---|---|---|---|
| (기본) | 무료 | 월 **5회** | 매월 리셋(UTC 기준 `ym`) | — (`FREE_MONTHLY=5`) |
| (게스트) | 비회원 미리보기 | IP당 **2회** | KV TTL 1년 | — (`GUEST_FREE=2`) |
| `sub_light` | 구독 라이트 | 월 **50회**(무료 5 + 50) | 30일 | **4,900원** |
| `sub_pro` | 구독 프로 | 월 **150회** | 30일 | **9,900원** |
| `pack10` | 회차권 | **15회** | 60일 | **4,900원** |
| — | *(2026-09-24 가격조정)* | 진입가↓+쿼터↑ 블렌드. 곁은 수달·타서비스와 별개 상품(`gyeot_*`)이라 무영향 | — | — |

  - 가격 근거: `public/index.html` `EntitlementCard` 구매 안내 문구 + 커밋 `923c13e`("확정가 반영"). 코드 상수가 아니라 **표시 문구**이므로 판매처 설정과의 동기화는 수동이다.
- **결제 수단**: 서비스 내 직접 결제 **없음**. ① 외부 판매처 구매 → **쿠폰 코드** 등록(`/api/coupon/redeem`), ② 마음풀 결제 → **서명 grant 수신**(`/api/grant`). 토스페이먼츠 개별 연동은 하지 않는다(사업자 단일, 결제대행 규제 회피 — 루트 `../CLAUDE.md`).
- **크레딧·구독 처리**:
  - `getEntitlement()` — `monthlyAllowance = FREE_MONTHLY + (활성 구독 quota)`, `totalRemaining = monthlyRemaining + packRemaining`.
  - `consumeQuota()` — 월간 잔여가 있으면 `usage_monthly` UPSERT(+1), 없으면 `packs.remaining` 차감.
  - `applyGrant()` — 구독은 남은 기간에 일수를 **더하고** quota는 `max()`로 상향(quota ≥ 100이면 plan=`pro` 승격), 회차권은 잔여에 **가산**.
  - 한도 초과 시 `402 {code:'QUOTA'}` → 프론트 `Observe`가 "🎟️ 돌아가서 이용권 코드 등록하기" 버튼을 노출.
- **환불**: `/api/grant/revoke`가 구독 만료일을 해당 일수만큼 **되돌리고**, 회차권은 `MAX(0, remaining-count)`. 주문은 `external_orders.status='revoked'`로 마킹.
- **약관상 청약철회**: 디지털 콘텐츠 코드는 발송·등록 후 청약철회 제한(`/terms` 제5조).

### 10.1 마음풀 → 마음곁 통합결제 계약 (`/api/grant` · `/api/grant/revoke`) — 코드에서 복원

> ⚠️ **단방향 계약이다.** 발신은 마음풀 한 곳(`../maumful-main/src/index.tsx` `deliverGrant()` L3161~L3197 · 큐 `external_grants`(migrations/0029) · 재시도 `POST /api/admin/deliver-pending-grants` L3199~), 수신은 수달·곁·phyweb.
> **양쪽 문서가 어긋나면 지급 사고가 난다** → 아래 표는 마음수달 설계서(`../maumotter/docs/DESIGN.md`) §10.1 과 **동일 내용**이며, 서비스별로 값이 다른 항목은 표 아래 "수달 ↔ 곁 차이"에 따로 적었다.
> 근거: 수신 maumgyeot/src/index.ts L381~L397(`verifySso`·`verifyGrantToken`)·L399~L424(`/api/grant`)·L425~L450(`/api/grant/revoke`)·L118~L139(`applyGrant`) · 발신 `../maumful-main/src/index.tsx` L179~L186(`signSso`)·L3118~L3159(`PACKAGES`·`SERVICE_API`)·L3161~L3197.

| 항목 | 값 |
|---|---|
| 방향 | 마음풀(발신) → 수달·곁·phyweb(수신). **역방향 없음** |
| 메서드·경로 | `POST {서비스 루트}/api/grant` · 회수는 `POST {서비스 루트}/api/grant/revoke` |
| 수신 URL | `SERVICE_API = { otter: 'https://maumotter.com', gyeot: 'https://maumgyeot.com', phyweb: 'https://phyweb.pages.dev' }` |
| 헤더 | `Content-Type: application/json` **뿐**. Authorization 헤더 없음 — 인증은 바디 토큰이 전담 |
| 바디 | `{ "token": "<payloadB64u>.<sigB64u>" }` — 단일 필드 |
| 서명 페이로드 | `{ email, service, grantType, orderId, amount, exp }` |
| 서명 계산식 | `payloadB64u = base64url(JSON.stringify(payload))` (`+`→`-`, `/`→`_`, `=` 제거) → `sig = base64url(HMAC-SHA256(MAUM_SSO_SECRET, payloadB64u))` → 토큰 = `payloadB64u + "." + sig`. **서명 대상은 payload 문자열 자체**(JWT 와 달리 헤더 부분이 없다) |
| 검증 | 수신측 `verifySso()` — `lastIndexOf('.')` 로 분리 후 동일 HMAC 재계산·문자열 비교(상수시간 비교 아님) → `verifyGrantToken()` 이 `exp` 를 초 단위 현재시각과 대조 |
| 재생 방지 | `exp = now + 300`(**5분**). `exp` 누락도 거부 |
| 대상 확인 | `p.service` 가 **있고** 자기 서비스명과 다르면 `400 service mismatch`. ⚠️ `service` 필드가 **없으면 통과한다**(약한 검사) |
| `grantType` 허용값 | `sub_light` · `sub_pro` · `pack10` — 그 외 `400 unknown grantType` |
| 멱등키 | `orderId` = `mf_charge_{chargeId}`. 발신측 `external_grants.order_id` PK · 수신측 `external_orders.order_id` 선조회 → 있으면 **적용하지 않고** `200 {ok:true, dedup:true, status}` |
| 계정 처리 | `email` 소문자화 → `maum-auth` 조회, 없으면 **랜덤 비밀번호로 자동 생성**(선구매 후가입) → `markEmailVerified()` |
| 지급 | `applyGrant(uid, grantType)` — 구독은 잔여기간에 `days` **가산** + `monthly_quota` 는 `Math.max()` 상향(100 이상이면 `plan='pro'` 승격), 회차권은 `remaining` **가산** |
| 성공 응답 | `200 {ok:true, applied:true, grantType, result}`. `result` = `{kind:'subscription', plan, expires_at}` 또는 `{kind:'pack', remaining}` |
| 발신측 응답 처리 | `res.ok` 면 `external_grants.status='delivered'`, 응답 JSON 의 `code`(또는 `data.code`)를 `COALESCE` 저장. **수달·곁 응답에는 `code` 가 없다**(쿠폰형 phyweb 전용 필드) |
| 에러 코드 | `503 grant secret 미설정`(`MAUM_SSO_SECRET` 없음) · `401 invalid or expired grant`(서명 불일치·`exp` 만료·파싱 실패) · `400 service mismatch` · `400 email/orderId 누락` · `400 unknown grantType` · `500 계정 처리 실패` |
| 실패 시 | 발신측이 `external_grants.status='failed'`, `attempts+1`. 재시도는 **관리자 수동** `POST /api/admin/deliver-pending-grants`(`status IN ('pending','failed') AND attempts < 8`, 1회 50건). **자동 Cron 없음** |
| revoke 요청 | 동일 토큰 스킴. 수신측이 실제로 읽는 값은 `orderId` **하나뿐**. `external_orders` 에 없으면 `200 {ok:true, note:'no such order'}`, `status!=='applied'` 면 `200 {ok:true, note:'already …'}` |
| revoke 동작 | 구독은 `expires_at` 에서 `days` 만큼 **빼고**(하한 보정 없음 — 과거 시각이 될 수 있다), 회차권은 `remaining = MAX(0, remaining - count)`. 이후 `external_orders.status='revoked'` · `revoked_at` 기록 |

**수달 ↔ 곁 차이** — 위 표의 값은 **전부 같다.** 코드에서 확인된 차이는 둘뿐이다:

1. **`service` 판별 문자열**: 수달 `'otter'`(`maumotter/src/index.ts` L539) / 곁 `'gyeot'`(`maumgyeot/src/index.ts` L405).
2. **`verifySso()` 의 역할 범위**: 수달은 **SSO 로그인과 grant 가 같은 함수를 공유**한다(L154 정의 → L295 `/api/auth/sso`, L528 `verifyGrantToken`). 곁은 **grant 전용**이다(L381 정의) — 곁에는 `/api/auth/sso` 라우트 자체가 없어 마음풀 SSO 로 곁에 바로 진입할 수 없다.

그 외 `verifySso`·`verifyGrantToken`·`/api/grant`·`/api/grant/revoke` 본문과 `PLAN`/`PACK`/`FREE_MONTHLY`(5) 상수는 **양쪽이 문자 단위로 동일**하다.

⚠️ **계약상 확인된 구멍**(코드에서 복원):

1. **수신측 `external_orders` 테이블의 DDL 이 어느 `.sql` 에도 없다**(§15). 발신측은 같은 사고를 이미 겪고 고쳤다 — 마음풀 `migrations/0029_external_grants.sql` 주석 원문: *"기존 코드(deliverGrant)가 이 테이블을 INSERT/UPDATE 하는데 CREATE가 어디에도 없었음 → 수달·곁 grant가 실제론 실패 상태였음. 이 마이그레이션으로 정상화."* **수신측은 아직 이 정상화가 안 됐다** → 착수 전 마이그레이션 작성 필수.
2. **`/api/grant/revoke` 를 호출하는 발신 코드가 존재하지 않는다.** 마음풀의 revoke 호출부는 두 곳 모두 `https://phyweb.pages.dev/api/grant/revoke` **하드코딩**이다(`maumful-main/src/index.tsx` L1186 사용자 셀프환불 · L4570 관리자 환불). 수달·곁 상품은 `PACKAGES` 에서 `credits: 0` 이라 환불 시 phyweb 분기를 타지 않고 크레딧 환불 경로(`u.credits < charge.credits` → `0 < 0` false)로 통과한다 → **카드만 환불되고 지급된 구독·회차권은 그대로 남는다.** 수신측 revoke 는 현재 **호출자 없는 코드**다.
3. **`/api/grant/status` 미구현.** 마음풀 셀프환불은 phyweb 에 `GET /api/grant/status?token=…` 으로 "코드 등록 여부"를 먼저 묻고 등록됐으면 환불을 거부하지만, 수달·곁에는 이 라우트가 없다. 즉 **"이미 사용한 이용권인지" 를 마음풀이 물어볼 수단이 없다.**
4. **`amount` 는 서명 페이로드에 들어 있으나 수신측이 전혀 읽지 않는다**(금액 검증 없음). 지급량은 `grantType` 만으로 결정된다.
5. **`MAUM_SSO_SECRET` 하나가 SSO 로그인과 결제 지급을 모두 인증한다.** 유출 시 계정 탈취와 무상 지급이 동시에 가능하다(수달은 특히 `/api/auth/sso` 까지 같은 키).

**루트 `../CLAUDE.md` 「연동형 유료결제 (통합결제) — 설계 완료·착수 대기 ⚠️」 원문**(코드에서 복원 · 근거: `../CLAUDE.md` L86~L91):

> 수달·곁·부부 유료결제를 **마음풀에서 상품으로 판매 → 결제내역을 각 서비스로 자동 전달(grant)** 하는 방식. **사용자 지시 있을 때만 착수**하며, **토스페이먼츠 완전 반영 전까지 관련 코드는 커밋·푸시·배포 금지**(설계·로컬 준비만).
> - **결제 표기 = 하이브리드**(내부 크레딧, 겉은 명명 상품 — 선불충전금/PG 기피 회피). 마음풀·부부는 이미 이 구조. 수달·곁은 별도 생태계라 `applyGrant`(sub/pack)로 지급.
> - **전달 = A안(서명 grant API)**: 마음풀 결제성공 → 대상 서비스 `POST /api/grant`(HMAC=MAUM_SSO_SECRET, `{email,grantType,orderId}`) → email로 maum-auth 계정 조회/생성 → `applyGrant`. 멱등·환불 revoke·선지급 재시도 포함.
> - 사업자 단일(마음서비스)이라 결제대행 규제 무관. 수달·곁 앱은 당분간 없음.
> - **상세 실행 스펙·DB·API 계약·검증은 메모리 `project_maum_unified_payment`** (착수 지시 시 그대로 실행).

⚠️ 위 CLAUDE.md 가 적은 페이로드 `{email,grantType,orderId}` 는 **실제 구현보다 3개 적다** — 코드는 `service`·`amount`·`exp` 를 함께 서명한다. 구현·검증 시 CLAUDE.md 요약이 아니라 **이 §10.1 표를 계약 원본으로 삼을 것.**

⚠️ **의사결정 맥락**(확장 범위 = 어느 서비스·어떤 상품까지 넓힐지, 착수 조건, 단계별 검증 절차 체크리스트, 실패 시 운영 대응 시나리오)은 외부 메모리 `project_maum_unified_payment` 에만 존재 — **코드로 복원 불가.**

### 10.2 유료화·제휴 실측 (코드에서 복원)

- **가격 대조 — 마음풀 청구가와 일치한다**(근거: `public/index.html` L311 `EntitlementCard` 안내 문구 · `../maumful-main/src/index.tsx` L3146~L3148 `PACKAGES`):
  - `sub_light` — 곁 프론트 표시 **4,900원** / 마음풀 `gyeot_light` 청구 **4,900** ✅ (2026-09-24)
  - `sub_pro` — 곁 프론트 표시 **9,900원** / 마음풀 `gyeot_pro` 청구 **9,900** ✅
  - `pack10` — 곁 프론트 표시 **4,900원** / 마음풀 `gyeot_pack10` 청구 **4,900** ✅
  - ⚠️ **2026-09-24 곁만 인하·쿼터 상향**(라이트 50/프로 150/팩 15회). **마음수달은 미변경**(otter_* 7,900/14,900/6,900·30/100/10 유지) — 시리즈 2종 가격이 이제 다르다.
  - ⚠️ 곁·수달 쪽 금액은 **코드 상수가 아니라 JSX 표시 문구**이고 실제 청구는 마음풀 `PACKAGES` 가 한다 → **두 곳을 따로 고쳐야 하며** 한쪽만 고치면 표시가와 청구가가 갈린다.
- **쿼터 엔진 스키마**(근거: `migrations/0001_billing.sql`): `subscriptions(maum_user_id PK, plan 'light'|'pro', monthly_quota 30|100, expires_at, updated_at)` · `packs(maum_user_id PK, remaining, expires_at, updated_at)` · `usage_monthly((maum_user_id, ym) PK, used)` — `ym = 'YYYYMM'`(UTC). **수달 `0001_billing.sql` 과 컬럼 단위로 동일**하다.
- **쿼터 소모 순서**(`consumeQuota()` L104~L115): ① `monthlyRemaining > 0` 이면 `usage_monthly` UPSERT `used+1` — 이때 `source` 는 `used < freeMonthly` 면 `'free'`, 아니면 `'subscription'`(무료 5회와 구독분은 **같은 카운터**를 쓰고 라벨만 갈린다) → ② 아니면 `packs.remaining - 1` → ③ 둘 다 없으면 `{ok:false}` → `402 {code:'QUOTA'}`. 즉 **회차권은 언제나 마지막에 쓰인다**(월간 잔여가 남아 있으면 팩은 줄지 않는다).
- **쿠폰**(`coupons`·`coupon_redemptions`, `POST /api/coupon/redeem` L354~L376): 코드 정규화 `normCode()` = 대문자화 + `[^A-Z0-9]` 제거 → `active` 검사(`404`) → `valid_until` 만료(`410`) → `redeemed_count >= max_redemptions`(`409`) → 본인 사용횟수 `>= per_user_limit`(`409`) → `coupon_redemptions` INSERT(UNIQUE `(code, maum_user_id)` 로 경쟁 상태까지 방어, 실패 시 `409`) → `redeemed_count+1` → `applyGrant()`. `coupons.type` 은 `sub_light`|`sub_pro`|`pack10` 로 **grant 계약(§10.1)의 `grantType` 과 같은 값 집합**이다. 발행은 `POST /api/admin/coupon/create`(ADMIN Bearer), 코드 문자셋은 혼동문자를 뺀 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. `source` 컬럼에 `'smartstore'`·`'partner:xxx'` 를 넣도록 주석에 규정.
- **제휴 `?ref=` 추적**(`migrations/0002_referrals.sql`, `src/index.ts` L220): 가입(`/api/auth/register`) 시점에 `INSERT OR IGNORE INTO referrals (maum_user_id, ref)` — PK 가 `maum_user_id` 라 **first-touch 1회만 귀속**되고 이후 `?ref=` 는 무시된다. 값은 64자 절단. 집계는 `GET /api/admin/referrals` 가 `referrals LEFT JOIN coupon_redemptions` 로 **파트너별 가입 수 ↔ 유료 전환 수**를 뽑는다. ⚠️ 정산 금액 계산은 **없다**(마음풀의 `partner_commissions` 같은 원장이 곁에는 없음).
- **비회원 미리보기**: `GUEST_FREE = 2`(IP당), KV `guest_observe:<ip>` TTL 1년 → 문구상 "평생 2회"지만 실제로는 **1년 롤링 + IP 변경 시 초기화**(§15-14).
- ⚠️ **유료화 방향의 의사결정 맥락**(왜 구독+월 사용캡인지, 왜 런칭을 스마트스토어+쿠폰으로 잡았는지의 판단 근거, 제휴 파트너 선정·수수료 조건, 스마트스토어 상품 설정값)은 외부 메모리 `project_maum_series_monetization` 에만 존재 — **코드로 복원 불가.** 레포에 남은 방향 요약은 §14 의 한 줄뿐이다.

---

## 11. 안전 · 윤리 · 법적 제약

> 아래는 `CLAUDE.md` 원문 인용이다. 완화·축약 금지.

**「3. 통역의 황금률 (행동학 문헌 기반 — 타협 불가)」**

> 1. **단일 신호 ≠ 단정**: 꼬리·귀·눈·자세·발성을 함께 읽는다.
> 2. **같은 신호 = 정반대 의미 가능**: 꼬리 흔들기(개)·골골거림(고양이)이 대표적. 행동 사전에서 ⚠️로 표시된 다의적 신호 특히 주의.
> 3. **맥락·종·개체가 전부**: 상황·종·품종·성격으로 보정.
> 4. **과대광고 금지**: "95% 정확도", "당신 개가 ~래요" 식 단정 금지. 교육형("이 행동은 ~일 수 있고 왜 그런지")으로.
>
> 이 서비스의 신뢰는 "단정하지 않음"에서 나온다. 경쟁 앱과의 차별점이 곧 이것.

**「4. 안전·윤리 (기능이 아니라 제약)」**

> spec 3장 준수. 특히:
> 1. **단정 금지 = 과대광고 방지**: 항상 confidence + "~일 수 있어요".
> 2. **수의학 영역 침범 금지**: 질병 진단·치료·처방 금지. 수의사 연계만.
> 3. **건강 위험 에스컬레이션**: 통증·이상행동 패턴 → 보호자 알림 + 수의사 상담 권유.
> 4. **영상 휘발성**(마음수달 7-C 승계): 온디바이스 분석 + 원본 즉시 폐기. 영상에 사람 얼굴 포함 가능성도 동일 민감 처리.
> 5. **유대 대체 방지**: "직접 관찰·교감이 가장 중요"를 일관되게 안내.

> ⚠️ **법적 급소**: 이 서비스는 **수의학적 진단을 하지 않는다**. 약관 제2조·제7조, 개인정보처리방침, 랜딩·리포트 하단 문구가 모두 "참고용이며 수의학적 진단이 아님"을 반복 고지한다. 이 원칙이 무너지면 수의사법·의료광고 영역으로 넘어간다. 완화 금지.

**코드에 남은 흔적 (검증 지점)**

| 원칙 | 코드 근거 |
|---|---|
| 4-1 단정 금지 | `TRANSLATE_SYSTEM` `[절대 금지]` "~입니다/~래요/정확도 N% 금지", 리포트 스키마에 `confidence` 필수. 프론트 `Report`가 신뢰도 배지 상시 노출 |
| 4-2 수의학 침범 금지 | `VET_TERMS` 11종(`진단·처방·치료·질병·병명·췌장염·신부전·감염·종양·약 처방·투약`) 후처리 검출 → 경고 추가 프롬프트로 1회 재생성. 재생성도 실패하면 **안전 기본 리포트로 폴백** |
| 4-3 건강 에스컬레이션 | 신호 `health:true`(고양이 6·개 6종) 또는 맥락 `HEALTH_KW` 14종 매칭 시 `health_flag.flag`를 **강제 true**로 올리고 "단정은 아니며, 수의사 상담을 권해드려요" 기본 문구 삽입 |
| 4-4 영상 휘발성 | 프레임 추출은 기기 canvas에서만, 전송 후 서버 저장 없음. `media_note='영상 분석함(원본·프레임 미저장)'`. 촬영 종료·언마운트 시 `getTracks().forEach(t=>t.stop())` |
| 4-5 유대 대체 방지 | `TRANSLATE_SYSTEM` `[역할 원칙]` "직접 관찰·교감이 가장 중요함을 전제로", 리포트 하단 고정 문구 |
| 황금률 2 다의성 | `ambiguous:true` 신호는 프롬프트에 `(⚠️다의적)`으로 주입 + "caveat를 꼭 채우세요" 지시. 프론트 칩·도감에도 ⚠️ 표기 |
| 황금률 5 종 분리 | `BEHAVIOR[species]` 서브셋만 주입. `/api/behavior`는 `species` 없으면 400 |
| 신호 부족 시 | 입력이 전혀 없으면 LLM을 호출하지 않고 `confidence:'low'` + "더 지켜봐 주세요" 기본 리포트 반환 |

**법적 사업자 정보** (`BIZ` 상수): 상호 마음서비스 · 대표자 김근혜 · 사업자등록번호 780-31-01832 · 통신판매업 제2026-서울영등포-1157호 · 서울특별시 영등포구 문래로26길 6(문래동3가) · 문의 shine184280@gmail.com. 개인정보처리방침 시행일 2026-06-20 / 이용약관 시행일 2026-06-21. 만 13세 미만 대상 아님.

→ 황금률 5조 전문: **`docs/maumgyeot-spec.md` §2** / 안전·윤리 5조 전문: **`docs/maumgyeot-spec.md` §3** / 후처리 규칙: **`docs/maumgyeot-translation-engine.md` §4**

---

## 12. 운영

- **배포 절차**: **로컬 개발 없음(No local dev)**. 코드 수정 → **GitHub 웹 UI로 파일 전체 교체**(Ctrl+A → 붙여넣기) → push → Cloudflare Workers Builds 자동 빌드·배포. `npm run dev`·`wrangler dev` 안내 금지.
- **스키마 변경**: 대시보드 D1 Console에서 `ALTER TABLE ADD COLUMN`만. DROP/RENAME/타입 변경 불가.
- **시크릿 등록**: Cloudflare 대시보드 → Workers → Settings → Variables and Secrets. `wrangler.toml` 주석은 `JWT_SECRET`·`ANTHROPIC_API_KEY` 2개만 적고 있으나, 코드가 실제로 읽는 값은 `ADMIN_SECRET`·`RESEND_API_KEY`·`EMAIL_FROM`·`MAUM_SSO_SECRET`·`AI_PROXY_URL`을 포함해 7개다(§15).
- **Cron / 스케줄**: **해당 없음**. `wrangler.toml`에 `[triggers]` 없음. 월간 쿼터 리셋도 cron이 아니라 `ym()` 키(`YYYYMM`) 기준 자연 롤오버.
- **모니터링·에러로그**:
  - `logError(env, place, message)` best-effort → `error_logs` 테이블. 실제 호출 지점은 `observe_llm`, `email`, `unhandled:<path>` 3곳.
  - `app.onError`가 미처리 예외를 잡아 로그 후 사용자에겐 일반 메시지("일시적인 오류가 발생했어요")만 노출.
  - `/api/admin/errors`(최근 200건) · `/api/admin/stats`(통역 총계/주간, 펫 수, 활성 구독, 당월 사용량·활성 사용자, 쿠폰 발행/사용, 제휴 가입, 주간 에러) · `public/admin.html` 대시보드(운영 현황·코드 발행·발행 내역·제휴·최근 오류 5개 패널).
- **레이트리밋**: KV 버킷 방식. register 5/1h, login 10/60s, forgot 5/1h, reset-password 5/1h, resend-verify 3/1h(uid 기준), observe 8/60s(uid 기준·마스터 면제), guest observe 5/60s(IP), coupon redeem 10/1h. **KV 실패 시 fail-open**(통과).
- **롤백**: 서비스별 커밋 분리 원칙(`[maumgyeot] …` 프리픽스)으로 선택적 `git revert` 가능. Cloudflare Workers 배포 버전 롤백 또는 이전 커밋 revert 후 재배포. ⚠️ **D1 마이그레이션 롤백 절차는 미확인**.

---

## 13. 서비스 간 의존관계

| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음수달 (maumotter) | `maum-auth` D1 공유(동일 database_id) · `JWT_SECRET` 공유 · `auth.ts` 동일 사본 · `#token=` 상호 진입 · 대시보드 상호 홍보 카드 | ↔ 양방향 |
| 마음풀 (maumful.com) | `/api/grant` 결제 지급 수신 · 이용권 구매 링크(`?go=charge`) | ← 수신(마음풀 → 곁) |
| `_shared/` | 공유 규약 문서 + `auth.ts` CANONICAL + `maum-auth-schema.sql` | ← 참조 |
| Cloudflare AI Gateway (`maumful` 게이트웨이) | Anthropic 호출 경유 — **마음풀 계정의 게이트웨이를 곁도 사용** | ← 의존 |

### 마음수달(maumotter)과의 공유 · 분리 경계

| 항목 | 마음곁 | 마음수달 | 공유? |
|---|---|---|---|
| GitHub 저장소 | `maumgyeot` | `maumotter` | ❌ 분리 |
| 도메인 | maumgyeot.com | maumotter.com | ❌ 분리 |
| 워커 | `maumgyeot` | `maumotter` | ❌ 분리 |
| 도메인 D1 | `maumgyeot-db` (`d04c7ab8…`) | `maumotter-db` (`f404bbb2…`) | ❌ 분리 |
| **공용 인증 D1** | `maum-auth` (`2df188da…`) | `maum-auth` (`2df188da…`) | ✅ **공유(동일 ID)** |
| **JWT 시크릿·페이로드** | `{maum_user_id,email,iss:'maum',exp}` 30일 | 동일 | ✅ 공유 |
| **`auth.ts`** | `src/auth.ts`(107줄) | `src/auth.ts`(106줄) | ✅ 동일 사본(주석 1줄 차이) |
| KV 네임스페이스 | `ab0da674…` | `9d5fba04…` | ❌ 분리 |
| 도메인 테이블 | pets / observations / pet_reports | children / sessions / utterances / reports | ❌ 분리 |
| 과금 엔진 | subscriptions·packs·usage_monthly·coupons·referrals·error_logs | **동일 구조**(마이그레이션 번호만 다름: 곁 0001~0003 / 수달 0001~0002) | 🔁 설계 동일·데이터 분리 |
| 통역 도메인 | **동물 행동** | **아동 정서** | ❌ 절대 혼용 금지 |
| LLM 구성 | Sonnet 4.6 1개(통역만) | Haiku 4.5(대화) + Sonnet 4.6(통역) | ❌ 다름 |
| 카메라 | **실시간 6프레임 → Claude 비전** | face-api.js 온디바이스 표정 분석 | ❌ 방식 다름 |
| TTS/STT | **없음** | OpenAI TTS + webkitSpeechRecognition | ❌ 곁에 없음 |
| PIN 게이팅 | **없음**(보호자 단독) | 부모 PIN 2회 | ❌ 곁에 없음 |
| 비회원 미리보기 | **있음**(`/api/observe/guest`) | 없음 | ❌ 곁에만 |
| 마음풀 SSO 수신 | **없음**(`/api/auth/sso` 미구현) | 있음 | ❌ 곁에만 없음 |
| CORS 미들웨어 | **없음** | 4개 오리진 화이트리스트 | ❌ 곁에만 없음 |
| 안드로이드 래퍼 | `app/` Capacitor + AdMob 광고형(보류) | **스캐폴드 자체가 없음** — `app/`·`initBannerAd`·AdMob 상수·TWA 매니페스트 0건 | 🔁 둘 다 보류, **스캐폴드는 곁에만** |

⚠️ **회원 탈퇴의 파급**: `DELETE /api/account`가 `deleteUser(AUTH_DB)`로 공용 `users` 행을 삭제한다. 마음곁에서 탈퇴하면 **마음수달 계정도 함께 사라진다.** `/account-deletion` 페이지에 고지되어 있으나, 마음수달 쪽 도메인 데이터(`children`·`sessions`·`reports`)는 **고아 행으로 남는다**(§15).

---

## 14. 현황 및 백로그

- **라이브 상태**: **배포 운영 중**(maumgyeot.com). 최종 커밋 `e95024a`(2026-08-29). MVP(가입 → 반려동물 등록 → 신호·맥락 → 통역 리포트)를 넘어 **영상 통역(비전)·행동 도감·비회원 미리보기·유료/쿼터·쿠폰·제휴·법적 페이지·운영 모니터링**까지 반영됨. `docs/maumgyeot-spec.md` §9의 "2차: ✅ 영상 통역 / ⬜ 도감 화면·개 사전 확장"은 **도감 화면과 개 사전도 이미 구현**되어 현행보다 낡았다.
- **안드로이드 앱화 — ⏸️ 보류 중(2026-06)** (`CLAUDE.md` §10)
  - **결정**: 안드로이드 앱 진행 당분간 보류. 사유 = 앱은 마케팅 비용을 전부 직접 부담해야 해 부담이 큼. **웹 서비스(maumgyeot.com)는 그대로 운영·발전.**
  - **⚠️ 이미 구현·배포되어 그대로 유지 — 삭제·롤백 금지 항목**:
    1. **계정 삭제(회원 탈퇴)** — `DELETE /api/account`(도메인 데이터 + 공용 maum-auth 계정 삭제), 공개 페이지 `/privacy`·`/account-deletion`, 홈 하단 링크. Play 요건이자 **웹 개인정보 보호에도 필요**하므로 유지.
    2. **AdMob 배너 웹 훅** — `public/index.html`의 `initBannerAd()`. **Capacitor 네이티브에서만 동작, 웹 브라우저에선 no-op**(가드+try/catch)라 그대로 둬도 웹 영향 0. 현재 Google 테스트 ID.
  - **재개 시 쓸 자료(보류 동안 건드릴 필요 없음)**: 래핑 스캐폴드 `app/`(`appId=com.maumgyeot.app`, `capacitor-www`, native-templates: MainActivity textZoom+카메라 권한, AndroidManifest CAMERA/RECORD_AUDIO/AD_ID+AdMob meta), 단계별 `app/README.md`, 루트 `../ANDROID_APP_PLAYBOOK.md`.
    - **플레이북 실측 요지**(코드에서 복원 · 근거: `../ANDROID_APP_PLAYBOOK.md` 309줄): Capacitor **라이브 URL 래핑**(`server.url` = 배포 도메인, `webDir=capacitor-www` 는 fallback) → 네이티브 필수 fix(`allowNavigation` 을 빼면 인증이 외부 브라우저로 튕김 · `textZoom` · 이메일 로그인) → 릴리스 서명 + `.aab` → Play Console 내부테스트 + 사업자 판매자 계정 → RevenueCat(`goog_` 키·서비스계정·상품·Offering) → 라이선스 테스터 실결제 → 프로덕션. **선행 관문(시간 소요)**: Play 개발자 계정($25, 신원확인 수일) · 판매자(Payments) 계정 승인 · 서비스계정 권한 전파 **최대 36시간**. ⚠️ 라이브 URL 래핑은 **온라인 전용**(오프라인 필요 시 이 방식 불가).
    - **광고형 선택의 코드 근거**(`app/README.md`): 광고형은 인앱결제를 안 하므로 **판매자(Payments) 계정 불필요**, 대신 **AdMob 계정 + 정산 정보** 필요. Play 데이터 보안 신고 = 이메일·사용자ID·반려동물/관찰 기록 + **광고 식별자**, 영상은 "임시 처리(미저장)"이라 수집 신고 불필요. **타겟층은 만 13세 미만 아님** — AdMob 아동 대상 제약 때문에 아동 타겟 금지(이 제약이 수달과 곁의 앱 전략을 가르는 지점이다).
    - ⚠️ **앱화 보류 결정의 의사결정 맥락**(광고형 vs 인앱결제형 비교 검토 내용, 마케팅 비용 추산, 재개 판단 기준·시점)은 외부 메모리 `project_android_app_plan` 에만 존재 — **코드로 복원 불가.** 레포에 남은 것은 위 "결정" 한 줄(`CLAUDE.md` §10)과 스캐폴드·플레이북 같은 **실행 자산뿐**이다.
  - **재개 시 남은 작업**: `npx cap add android` → 네이티브 fix 적용 → 카메라 실기확인 → AdMob 실 ID 2곳 교체 → 키스토어+`.aab` → Play 내부테스트 → (개인계정이면) 비공개테스트 12명·14일 → 프로덕션.
  - **유료화·제휴는 앱과 분리되어 계속(웹 기준)**: 방향은 **구독+월 사용캡**, 런칭 결제는 **스마트스토어+쿠폰**(토스 승인 지연 회피), 제휴는 `?ref=` 추적. **실측 스키마·산식·라우트는 §10.2 에 복원해 두었다**(가격 3종 마음풀 `PACKAGES` 대조 일치 · `subscriptions`/`packs`/`usage_monthly` · 쿼터 소모 순서 · 쿠폰 검증 6단계 · `referrals` first-touch). ⚠️ **방향을 그렇게 정한 판단 근거와 파트너·판매처 설정값**은 외부 메모리 `project_maum_series_monetization` 에만 존재 — 코드로 복원 불가.
- **미착수 / 대기**:
  - 관찰 누적 추이(시계열 리포트) — 설계만
  - 행동 사전 확장(품종·개체차 보정) — 설계만
  - `RESEND_API_KEY` 설정(Resend 도메인 검증 선행) · `STORE_URL` 설정 · AdMob 실 ID
  - 마음풀 통합결제 grant **착수·배포 승인** — 토스페이먼츠 완전 반영 후
  - 마음풀 SSO 수신(`/api/auth/sso`) — 수달에는 있으나 곁에는 미구현
  - **전 서비스 잔여 백로그 — 코드로 복원 불가.** 레포에 남은 유일한 대응물인 루트 `../CLAUDE.md` 「남은 작업 (백로그)」 **원문 인용**(L77~L82)으로 대체한다:

    > 전 서비스 남은 작업은 메모리 **`project_maum_backlog`** 한 곳에 모아 둔다. 새 작업 지시가 오면 여기부터 확인할 것.
    > - **바로 가능**: 폐기된 상담사 승인 레거시 코드 제거 / 주간 리포트 메일 실수신 검증(사용자 동의 후)
    > - **데이터 보고 판단**(2026-08-09경): 마음게임 콘텐츠 확장 — 어드민 🔁 루프 탭에서 검사↔게임 루프가 도는지 확인 후
    > - **선행조건 대기**: 앱화·통합해석 상품화·연동형 통합결제 → 모두 **토스 실결제 반영 후**
    > - **금지**: 커플 감정 내용 공유(동의·철회 UX 없이) / CTS 개발(명시적 재개 시에만)

    ⚠️ 위 4줄은 **전 서비스 요약일 뿐**이고 마음곁 항목은 "앱화·연동형 통합결제(토스 실결제 반영 후)" 두 건에만 간접적으로 걸린다. **서비스별 작업 항목·우선순위·일정**은 외부 메모리 `project_maum_backlog` 에만 존재 — 코드로 복원 불가. 마음곁 단일 서비스 범위의 잔여 작업은 이 §14 "미착수 / 대기" 목록이 전부다.
- **금지 사항**:
  1. `wrangler dev`·`npm run dev` 등 로컬 개발 안내 금지. 배포는 GitHub 웹 UI만.
  2. 부분 수정 diff 제공 금지 — **완성된 전체 파일** 제공(Ctrl+A → 붙여넣기).
  3. Anthropic **직접 호출 금지** — 반드시 AI Gateway(또는 `AI_PROXY_URL`) 경유. 직접 호출은 403.
  4. **Resend 도메인 검증(Cloudflare DNS SPF/DKIM/MX) 완료 전 `RESEND_API_KEY` 설정 금지** — 설정만 하면 미인증 유저의 쿠폰 등록이 전부 403으로 막힌다(치명, `CLAUDE.md` §11).
  5. 마음수달(아동)·마음풀 규칙·용어를 이 폴더로 끌어오지 말 것.
  6. 토스페이먼츠 완전 반영 전 통합결제 관련 코드 **커밋·푸시·배포 금지**(루트 `../CLAUDE.md`).
  7. D1 `DROP/RENAME COLUMN`·타입 변경 금지.
  8. 수동 웹 애널리틱스 beacon 삽입 금지(Cloudflare 자동 설정과 이중집계).
  9. 위 "삭제·롤백 금지 항목"(탈퇴 기능·AdMob 웹 훅) 제거 금지.
  10. 확률·정확도 수치 노출, 단정형 화법, 수의학 용어 사용 금지(§11).

---

## 15. 알려진 리스크 · 기술부채

| # | 항목 | 내용 | 영향 |
|---|---|---|---|
| 1 | **`_shared/auth.ts` 캐논이 낡음** | md5 대조: `_shared/auth.ts` `c48c0f…`(89줄) / `maumgyeot/src/auth.ts` `18dfa3…`(107줄) / `maumotter/src/auth.ts` `c167ad…`(106줄). **마음곁 사본은 수달 사본과 같은 계열**이며(주석 1줄만 추가) 캐논보다 **18줄 많다**. 캐논에는 `deleteUser`·`findByEmail`·`setPassword`·`markEmailVerified`·`isEmailVerified` **5개 함수가 없다**. 실질 캐논은 서비스 사본 쪽이고 `_shared/`가 뒤처졌다. | `README.md`의 "`src/auth.ts`(= `../_shared/auth.ts` 동일 사본)" 서술이 거짓. 새 형제 서비스가 `_shared`를 복사하면 탈퇴·이메일 인증이 통째로 빠진다 |
| 2 | **CORS 미들웨어 부재** | `src/index.ts`에 CORS·`Access-Control-*`·`OPTIONS` 코드가 **한 줄도 없다**. `../_shared/maum-shared-spec.md` §3과 `CLAUDE.md` §5는 4개 오리진 화이트리스트를 요구. 마음수달에는 구현되어 있다. | 현재는 동일 출처 서빙이라 장애 미확인. 향후 `app.` 서브도메인·외부 프론트·앱 WebView에서 XHR을 쏘면 즉시 차단 |
| 3 | **`external_orders` 테이블 DDL 부재** | `/api/grant`·`/api/grant/revoke`가 참조하지만 `schema.sql`·`migrations/*.sql` 어디에도 `CREATE TABLE external_orders`가 없다(수달도 동일). | 통합결제 착수 시 **첫 호출부터 실패**. 착수 전 마이그레이션 작성 필수 |
| 4 | **`users.email_verified` 컬럼 DDL 부재** | `markEmailVerified`/`isEmailVerified`가 이 컬럼을 쓰지만 `maum-auth-schema.sql`(`_shared`·수달·곁 3개 파일 md5 동일 `4152b2…`) 어디에도 없다. 코드는 try-catch로 감싸 `isEmailVerified`가 실패 시 **`true` 반환**(fail-open). | 스키마 재적용 시 이메일 인증 게이트가 조용히 무력화 |
| 5 | **통합결제 구현 ≠ 문서 상태** | `CLAUDE.md` §12는 "곁 추가 구현(착수 지시 시)"이라 적었으나 `/api/grant`·`/api/grant/revoke`는 **이미 코드에 있고 커밋됨**(`3497675`). 루트 `../CLAUDE.md`는 "토스 반영 전 커밋·푸시·배포 금지"로 규정. | 배포 상태와 문서·정책이 엇갈림. `MAUM_SSO_SECRET` 설정 여부 확인 필요 |
| 6 | **마음풀 SSO 수신 비대칭** | `verifySso()`는 있으나 `POST /api/auth/sso` 라우트가 없다. 수달에는 있다. 마음풀에서 곁으로 로그인 인계 불가. | 마음풀 → 곁 유입 동선이 막힘. grant로 이용권은 들어오지만 사용자는 곁에서 별도 로그인 필요 |
| 7 | **`docs/maumgyeot-spec.md`가 현행과 어긋남** | §6 API 표는 **6행**(실제 32개 라우트). §9 2차의 "⬜ 도감 화면·개 사전 확장"은 이미 구현됨. §10 "열린 결정" 1번 과금 모델을 미확정으로 두었으나 과금은 이미 구현·운영 중. | 진입 문서로 쓰기 어려움 → 이 DESIGN.md가 대체 |
| 8 | **행동 사전 문서가 코드보다 적음** | 코드 `src/behavior.ts`는 고양이 **27종**·개 **29종**(총 56). 문서 `maumgyeot-behavior-library.md`는 고양이 18·개 11(총 29). `behavior-library` §D는 "확장 시 이 문서 → 코드 시드 → API 순"이라 규정하는데 **역순으로 갔다**. | 도감 문헌 근거가 없는 신호가 절반 가까이. 행동학 검수 공백 |
| 9 | **`_shared/maum-shared-spec.md` 사본 부재** | 그 문서 §5는 "이 파일은 양쪽 저장소에 동일 사본으로 둔다"고 규정하나 실제로는 `_shared/`에만 있다(수달·곁 어디에도 사본 없음). | 저장소만 단독 export하면 공유 규약이 통째로 빠짐 |
| 10 | **`wrangler.toml` 시크릿 목록 불완전** | 주석은 `JWT_SECRET`·`ANTHROPIC_API_KEY` 2개만 안내. 코드는 `ADMIN_SECRET`·`RESEND_API_KEY`·`EMAIL_FROM`·`MAUM_SSO_SECRET`·`AI_PROXY_URL`도 읽는다. | 신규 환경 구축 시 어드민·이메일·결제가 조용히 503 |
| 11 | **도메인 설정 불일치** | `CLAUDE.md` §6은 `app.maumgyeot.com` / `api.maumgyeot.com`, `wrangler.toml` 라우트는 **`maumgyeot.com` 하나뿐**. §6 인프라 표의 D1·KV는 "(생성 후 기입)"인 채로 남아 있으나 실제 ID는 `wrangler.toml`에 있다. | 서브도메인 접근 시 404 가능. 운영자가 ID를 찾지 못함 |
| 12 | **LLM 실패에도 쿼터가 소모됨** | `/api/observe`는 `consumeQuota()`를 **통역 시도 전**에 호출한다. 이후 `callClaude`가 2회 모두 실패하면 안전 기본 리포트(“신호가 충분하지 않아…”)가 저장되고 **쿼터는 이미 차감된 상태**. | 게이트웨이 장애 시 유료 사용자 회차가 조용히 소진. 환불 경로 없음 |
| 13 | **판매 채널 안내 이원화 · 가격 하드코딩** | 프론트는 "마음풀에서 구매하기"(`?go=charge`)인데 `/terms` 제4조·`/faq`는 여전히 "네이버 스마트스토어"를 안내(`STORE_URL`은 `''`). 가격 7,900/14,900/6,900원도 `EntitlementCard` 안내 문자열에만 있고 서버는 금액을 모른다. | 약관과 실제 판매 경로 불일치, 가격 변경 시 수동 수정 누락 |
| 14 | **AdMob 테스트 ID · 게스트 상한** | `ADMOB.banner`가 Google 테스트 ID(`testing:true`)인 채로 웹 번들에 포함(웹은 no-op). `guest_observe:<ip>` KV TTL은 1년이라 "IP당 평생 2회"는 실제로 1년 롤링 + IP 변경 시 초기화. | 앱 재개 시 실 ID 교체 누락, 어뷰징 상한이 문서보다 느슨 |
| 15 | **마스터 이메일 하드코딩** | `MASTER_EMAILS = ['limyj007@gmail.com']`이 소스에 평문. | 계정 변경 시 재배포 필요 |
| 16 | **AI Gateway 계정 종속** | 게이트웨이 URL에 마음풀 계정/게이트웨이 이름(`.../maumful/...`)이 하드코딩. "별개 생태계"라면서 게이트웨이는 공유. | 마음풀 게이트웨이 변경이 곁 장애로 전파 |
| 17 | **공용 계정 삭제의 고아 데이터** | 곁 탈퇴가 `maum-auth.users`를 지우지만 수달 도메인 데이터는 남는다(역방향도 동일). `external_orders` 행도 삭제 대상에서 빠져 있다. | 개인정보 완전 파기 주장과 충돌 가능 |
| 18 | **테스트 부재 · 무빌드 프론트 사각지대** | 테스트·CI 없음. 단일 `public/index.html` 399줄에 전 화면이 들어 있고 빌드가 없어 렌더 오류를 사전에 못 잡는다(루트 `../CLAUDE.md` L75 원문: *"프론트는 빌드·200으로 런타임 에러를 못 잡는다 → 렌더 검증 필수(`feedback_frontend_render_smoke`)"* — 같은 섹션 L73~L74 는 신규 구현 시 "추가형 설계·기존 경로 1회 실주행·NULL 허용"을 요구한다. ⚠️ 그 경고를 만든 **실제 렌더 사고 사례**는 외부 메모리 `feedback_frontend_render_smoke` 에만 존재 — 코드로 복원 불가). | 회귀 검증은 전적으로 수동, 프론트 오류가 배포 후 발견 |

### 외부 메모리 대조표 (2026-09-19 복원 작업 결과)

이 문서에서 참조하던 외부 메모리를 **코드 1차 근거로 복원**한 결과다. 왼쪽 열이 본문에 반영된 것, 오른쪽 열이 **원리상 코드에 없는 것**(= 의사결정 맥락)이다.

| 외부 메모리 | 코드로 복원된 부분 | 복원 불가(의사결정 맥락) |
|---|---|---|
| `project_maum_unified_payment` | §10.1 계약 표 전체 — 서명식·페이로드 6필드·멱등키·응답·에러코드·revoke 동작 + 구멍 5건 | 확장 범위(어느 서비스·어떤 상품까지), 착수 조건, 검증 절차 체크리스트, 실패 운영 시나리오 |
| `project_maum_series_monetization` | §10.2 전체 — 가격 3종 마음풀 `PACKAGES` 대조·쿼터 엔진 스키마·소모 순서·쿠폰 검증 6단계·`referrals` first-touch·게스트 상한 | 가격 곡선 결정 근거, 구독+월캡 방향의 판단 이유, 제휴 파트너 선정·수수료 조건, 스마트스토어 상품 설정값 |
| `project_android_app_plan` | §14 — 스캐폴드 `app/` 구성, `ANDROID_APP_PLAYBOOK.md` 절차·선행 관문, 광고형 선택의 코드 근거(판매자 계정 불필요·데이터 보안 신고 항목·13세 미만 타겟 금지) | 광고형 vs 인앱결제형 비교 검토, 마케팅 비용 추산, 재개 판단 기준·시점 |
| `project_maum_backlog` | — (**코드 0건**) | **전 서비스 통합 백로그 전부.** 루트 `../CLAUDE.md` L77~L82 요약 4줄만 §14 에 인용 |
| `feedback_frontend_render_smoke` | 루트 `../CLAUDE.md` L73~L75 원문(§15-18) | 경고를 만든 실제 렌더 사고 사례 |

→ **잔여 리스크**: 오른쪽 열은 그 메모리가 사라지면 영구 소실된다. 특히 `project_maum_backlog` 는 **레포에 대응물이 전혀 없다.**

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 표준 템플릿 기반 통합 진입 문서 최초 작성. 기존 `docs/` 3종은 유지하고 §2·§11에서 링크 위임. §1·§5~§8·§10·§12·§14는 코드에서 직접 확인해 기재. `_shared/auth.ts` md5 대조 결과 §15-1에 기록. | Claude Code |
| 2026-09-19 | 외부 메모리 참조 항목을 코드에서 복원해 대체. 복원 불가 항목은 사유 명시 | Claude |
