# 마음수달 (MaumOtter) — 설계서 (DESIGN)

> 이 문서는 `_docs/_TEMPLATE.md` 표준 목차를 따르는 **통합 진입 문서**다.
> 기존 `docs/` 4종 문서를 대체하지 않는다. 도메인·대화·프롬프트 상세는 그 문서로 **위임**하고,
> 여기에는 **코드에서 직접 확인한 사실**(아키텍처·스키마·API·인증·과금·운영·현황)을 채운다.

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음수달 (MaumOtter) |
| 폴더 | `maum/maumotter/` |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `20b4fa0` (2026-08-29) — `[maumotter] AI 호출 전용 egress 프록시 경유 지원 — env AI_PROXY_URL` |

근거 소스: `CLAUDE.md`(127줄) · `README.md` · `wrangler.toml` · `package.json` · `src/index.ts`(755줄) · `src/auth.ts`(106줄) · `schema.sql` · `maum-auth-schema.sql` · `migrations/0001_billing.sql` · `migrations/0002_errors.sql` · `public/index.html`(React CDN 단일 파일) · `public/admin.html` · `docs/*.md` 4종 · `../CLAUDE.md` · `../_shared/maum-shared-spec.md`

---

## 1. 서비스 개요

- **한 줄 정의**: 아이(3~9세)가 화면 속 수달 '또또'(또는 '라라')와 대화하며 속마음을 꺼내면, AI가 그것을 **양육자가 이해·행동할 수 있는 코칭 리포트로 통역**해 전달하는 정서 통역 서비스.
- **해결하는 문제**: 아이는 자기 감정을 언어로 정확히 표현하지 못하고, 부모는 "오늘 어땠어?"에 "몰라"라는 답만 듣는다. 그 사이의 **번역 공백**을 메운다.
- **타깃 사용자**: 만 3~9세 자녀를 둔 **양육자**(계정 주체는 부모, 아이는 부모 계정에 종속된 프로필). 아이는 독립 계정을 갖지 않는다.
- **핵심 가치 제안**: AI는 아이의 친구(대체)가 **아니라**, 아이와 양육자 사이의 **다리(bridge)**. 통역 방향은 언제나 `아이 발화 → AI 분석 → 부모용 리포트` 단방향이며, **아이에게 분석·진단을 돌려주지 않는다**.
- **생태계 내 위치**: ⚠️ **마음 시리즈**(maumotter + maumgyeot)다. **마음풀 생태계가 아니다.** 스택을 혼동하면 사고가 난다.

| 구분 | 마음 시리즈 (이 서비스) | 마음풀 생태계 (maumful/게임/커플/부부/세대) |
|---|---|---|
| D1 (도메인) | **`maumotter-db`** (전용) | `maumful-db` 공유 |
| D1 (계정) | **`maum-auth`** (수달·곁 공용) | `maumful-db` 내 users |
| 프론트 | **React CDN(unpkg)·빌드 없음** | React + esbuild 사전컴파일 |
| 배포 | **GitHub 웹 UI → Cloudflare 자동 배포** | `wrangler deploy` (포그라운드) |
| SSO | 시리즈 공유 `JWT_SECRET` + 마음풀 HMAC SSO 수신 | `?t=` 토큰 SSO |
| 근거 | `../CLAUDE.md` 「마음 시리즈(수달·곁)는 별개 스택 — 마음풀/CTS 규칙을 끌어오지 말 것」 | — |

→ 상세: `../_shared/maum-shared-spec.md` §0 (무엇이 공유되고 무엇이 분리되는가)

---

## 2. 도메인 규칙 (이 서비스 고유)

> 이 폴더에서 "통역"은 **아동 정서**다. 형제 서비스 마음곁(동물행동학·반려동물)의 용어·규칙이 끼어들면 안 된다.

| 항목 | 마음수달 규칙 |
|---|---|
| 통역 대상 | 아이(3~9세)의 정서·속마음 |
| 금지 용어 | **의료 용어**(치료·진단·처방·장애·증상) 사이트 전역 금지 |
| 화법 | 따뜻하고 단정하지 않게("~인 것 같아요") |
| 캐릭터 | 마음 수달 '또또'(차분·포근) / '라라'(밝고 발랄) — 1인칭 투사 화법, 캐묻지 않음 |
| 위기 신호 | 학대·자해·방임 → 부모 리포트로 에스컬레이션 + 전문기관 연계 |
| 아이에게 | 위기 개입 시도 금지. 아이 화면엔 위기 상세 절대 노출 안 함 |

- 캐릭터 성격·연령별 접근·예시 대사·가드레일 → **상세: `docs/maumotter-dialogue-scenarios.md` §1~§5**
- 통역 LLM 시스템 프롬프트 전문·출력 스키마·후처리 → **상세: `docs/maumotter-translation-engine.md` §2~§5**
- 안전 원칙 9개 조항 원문 → **상세: `docs/maumotter-spec.md` §2**

---

## 3. 사용자 플로우

**시나리오 1 — 첫 이용(부모)**
회원가입(`/api/auth/register`) → 온보딩(아이 0명 안내) → 아이 등록(애칭·나이) → 대시보드 → [세션 시작] → 잔여 통역 확인(`/api/entitlement`, 0이면 `quotaWall`) → **부모 PIN 게이트**(`pinStart`, 미설정 시 자동 설정 모드) → 아이 모드 진입.

**시나리오 2 — 아이 세션 → 부모 핸드오프**
또또/라라 인사(AI 정체성 고지 포함) → 아이가 음성(STT) 또는 텍스트로 발화 → 또또 응답(TTS 낭독) → **12분 타이머 경과 또는 수동 종료** → 세션 종료(`/api/session/:id/end` → 통역 리포트 생성) → **핸드오프 게이트**("부모님께 휴대폰을 전해주세요" + 부모 PIN 입력) → 리포트 열람. **아이는 리포트를 볼 수 없다.**

**시나리오 3 — 이용권 등록**
부모 화면 `EntitlementCard` → 코드 입력 → `/api/coupon/redeem` → `applyGrant`로 구독/회차권 즉시 반영. 구매는 "마음풀에서 구매하기 →"(`https://maumful.com/?go=charge`) 링크로 이동.

**시나리오 4 — 마음풀 SSO 진입**
`app URL?sso=<HMAC 토큰>` → `POST /api/auth/sso` → 이메일로 `maum-auth` 계정 조회/자동 생성 → 수달 JWT 발급. 형제 앱 간 이동은 `#token=<JWT>` 해시로도 동작(설정 화면의 마음곁 링크).

**화면 구성 (파일 단위)**
| 파일 | 역할 |
|---|---|
| `public/index.html` | 프론트 전체(단일 파일, React 18 CDN + htm). 컴포넌트: `VerifyBanner`·`EntitlementCard`·`Auth`·`Dashboard`·`ChildChat`·`Report`·`Reports`·`PinGate`·`Settings`·`App` |
| `public/admin.html` | 쿠폰 발행·조회 관리자 화면(ADMIN_SECRET Bearer) |
| `public/otto.jpg` · `otto_talk.jpg` | 또또 캐릭터 정지/말하는 이미지 |
| `public/lala.jpg` · `lala_talk.jpg` · `friend1.jpg` | 라라 캐릭터 및 버디 선택 이미지 |
| `public/og.png` | OG 공유 이미지 |
| Worker 서버 렌더 페이지 | `/privacy` `/terms` `/faq` `/account-deletion` `/verify` `/reset` (src/index.ts의 `PAGE()` 템플릿) |

`App`의 view 상태 전이: `dashboard → quotaWall | pinStart → child → handoff → report` / `reports` / `settings`

---

## 4. 기능 명세

| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 부모 가입·로그인 | 공용 maum-auth 기반, PBKDF2+JWT | 배포됨 | `src/index.ts:223~249`, `src/auth.ts` |
| 2 | 아이 프로필 등록 | 애칭·나이·성별·관심사 (프론트 폼은 이름·나이 중심) | 배포됨 | `/api/children` |
| 3 | 부모 PIN 게이팅 | 아이 모드 진입·리포트 열람 2곳에 PIN. KV 저장(PBKDF2) | 배포됨 | `/api/pin*`, `PinGate` |
| 4 | 또또·라라 대화 | Claude Haiku 4.5, 1~2문장 짧은 응답, 버디별 성격 | 배포됨 | `/api/session/:id/utterance`, `ottoSystem()` |
| 5 | 세션 12분 제한 | 컴패니언화 방지 타이머(`useState(12*60)`) | 배포됨 | `public/index.html:250` |
| 6 | 음성 입력(STT) | `webkitSpeechRecognition` ko-KR, 브라우저 내 텍스트 변환·원본 미전송 | 배포됨 | `public/index.html:299~` |
| 7 | 또또 음성(TTS) | OpenAI `gpt-4o-mini-tts` → `tts-1` 폴백, KV 30일 캐시, 실패 시 기기 `speechSynthesis` | 배포됨 | `/api/tts` |
| 8 | 표정 온디바이스 분석 | face-api.js CDN 지연로드, 요약 텍스트만 `/end`에 전달. 원본 미저장·미전송 | 배포됨 | `public/index.html:112~131`, `/api/session/:id/end` |
| 9 | 통역 리포트 생성 | Claude Sonnet 4.6, `temperature:0`, 순수 JSON, 의료용어 검출 시 1회 재생성 | 배포됨 | `/api/session/:id/end` |
| 10 | 위기 이중 판정 | LLM `crisis.flag` + 백엔드 사전 키워드 14종 OR 결합(보수적) | 배포됨 | `src/index.ts` `CRISIS_KW` |
| 11 | 리포트 목록·상세 | 목록은 summary 90자만, 원문은 상세에서 | 배포됨 | `/api/reports`, `/api/reports/:id` |
| 12 | 쿼터·구독·회차권 | 무료 월 5 + sub_light 30 / sub_pro 100 + pack10(10회·60일) | 배포됨 | `getEntitlement`·`consumeQuota`·`applyGrant` |
| 13 | 쿠폰 등록 | 코드 정규화·1인 1회·만료·소진 검사 | 배포됨 | `/api/coupon/redeem` |
| 14 | 제휴 추적 | `?ref=` first-touch 저장, 어드민 집계 | 배포됨 | `referrals` 테이블 |
| 15 | 관리자 대시보드 | 쿠폰 발행/목록·제휴·에러·운영 통계 | 배포됨 | `/api/admin/*`, `public/admin.html` |
| 16 | 회원 탈퇴 | 도메인 9개 테이블 + KV pin + 공용 계정 삭제 | 배포됨 | `DELETE /api/account` |
| 17 | 법적 고지 페이지 | 개인정보·약관·FAQ·탈퇴 (사업자 정보 포함) | 배포됨 | `/privacy` `/terms` `/faq` `/account-deletion` |
| 18 | 마음풀 SSO 수신 | HMAC 서명 토큰 검증 → 계정 조회/생성 → JWT 발급 | 구현·배포됨 (`MAUM_SSO_SECRET` 설정 여부 ⚠️ 미확인) | `/api/auth/sso` |
| 19 | 비밀번호 재설정·이메일 인증 | Resend. `RESEND_API_KEY` 미설정 시 전 구간 no-op | 구현·배포됨(키 미설정으로 비활성) | `/api/auth/forgot-password`·`reset-password`·`resend-verify`·`/verify`·`/reset` |
| 20 | 마음풀 통합결제 grant | 서명 grant 수신·멱등·환불 revoke | **구현됨 / 정책상 착수 대기** — ⚠️ §15 참조 | `/api/grant`, `/api/grant/revoke` |
| 21 | 감정 이모지·그림 선택지(3~5세) | 텍스트 대체 입력 | 설계만 | `docs/maumotter-spec.md` §4.5 |
| 22 | 위기 전문기관 디렉토리 | 지역별 기관 연계 | 설계만 | `docs/maumotter-spec.md` §9 3차 |
| 23 | 안드로이드 앱 | — | 보류 | 상세는 외부 메모리 `project_android_app_plan` 참조 — 문서화 필요 |

---

## 5. 아키텍처

- **스택**: Cloudflare Workers + Hono 4.6 + D1 ×2 + KV ×1 + Workers Assets. 프론트 React 18 **CDN(unpkg)** + htm 3.1.1.
- **워커명 / 도메인**: 워커 `maumotter`. `wrangler.toml` 커스텀 도메인은 **루트 `maumotter.com` 하나**뿐. CLAUDE.md §5가 적은 `app.maumotter.com` / `api.maumotter.com`은 **wrangler.toml에 없음** (⚠️ §15). CORS 화이트리스트에는 `app.maumotter.com`·`maumgyeot.com`·`app.maumgyeot.com`이 포함.
- **프론트 빌드 방식**: **빌드 없음(no-build)**. `public/`를 Assets 바인딩으로 그대로 서빙, `/api/*` 외 모든 경로는 `app.all('*')`에서 `ASSETS.fetch`로 위임. `package.json`에 build 스크립트 없음(`deploy: wrangler deploy`만).
- **외부 API**:
  - Anthropic — **Cloudflare AI Gateway 경유 필수**(`AI_GATEWAY` 상수). 직접 `api.anthropic.com` 호출은 Workers egress에서 403 차단.
  - OpenAI(TTS) — 동일 게이트웨이 경유 필수(`OPENAI_GATEWAY`). 직접 호출 시 403 `unsupported_country_region_territory`.
  - `AI_PROXY_URL` 환경변수가 있으면 Anthropic 호출을 전용 egress 프록시로 우회(기본값=AI Gateway). 최신 커밋에서 추가.
  - Resend — 직접 호출(`api.resend.com`), 키 미설정 시 no-op.
- **모델**: 대화 `claude-haiku-4-5-20251001` (max_tokens 200, temp 0.7) / 통역 `claude-sonnet-4-6` (max_tokens 900, temp 0). LLM 호출은 25초 타임아웃 + 1회 자동 재시도.
- **구성도**:

```
        [부모 휴대폰]  public/index.html  (React CDN, no-build)
              │  Bearer JWT
              ▼
   ┌──────────────────────────────────────────────┐
   │  Worker: maumotter  (Hono, src/index.ts)     │
   │   CORS 화이트리스트 / KV 레이트리밋 / onError │
   └───┬───────────┬──────────────┬───────────────┘
       │           │              │
   ┌───▼─────────┐ ┌─▼──────────┐ ┌─▼───────────────────┐
   │ DB          │ │ AUTH_DB    │ │ KV                  │
   │ maumotter-db│ │ maum-auth  │ │ pin / rl / ttscache │
   │ children    │ │ users      │ │ pwreset/emailverify │
   │ sessions    │ │ (곁과 공유)│ └─────────────────────┘
   │ utterances  │ └────────────┘
   │ reports     │
   │ billing 7종 │        │ AI Gateway (필수 경유)
   └─────────────┘        ▼
                 Anthropic (대화·통역) / OpenAI (TTS)
```

---

## 6. 데이터 모델 (D1)

### 6.1 `maumotter-db` (바인딩 `DB`, id `f404bbb2-678a-440c-ad2b-f2fd341d8702`)

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `children` | 아이 프로필 | id, maum_user_id, name, age, gender, interests | 부모 계정 종속. idx_children_user |
| `sessions` | 대화 세션 | id, child_id, maum_user_id, started_at, ended_at, status(open/done/aborted), **buddy(또또/라라)** | `buddy`는 spec §5에 없는 실제 추가 컬럼 |
| `utterances` | 발화 | id, session_id, role(child/otter), content, created_at | 아이 발화는 1000자 절단 |
| `reports` | 통역 리포트 | id, session_id, child_id, maum_user_id, report_json, crisis_flag, created_at | 세션 1건당 1건 |
| `subscriptions` | 구독 | maum_user_id(PK), plan(light/pro), monthly_quota, expires_at | 0001_billing |
| `packs` | 회차권 | maum_user_id(PK), remaining, expires_at | 0001_billing |
| `usage_monthly` | 월 사용량 | (maum_user_id, ym) PK, used | 0001_billing |
| `coupons` | 쿠폰 발행 | code(PK), type, max_redemptions, redeemed_count, per_user_limit, valid_until, active, source, batch_id | 0001_billing |
| `coupon_redemptions` | 쿠폰 사용 | code+maum_user_id UNIQUE | 0001_billing |
| `referrals` | 제휴 유입 | maum_user_id(PK), ref | 0001_billing |
| `error_logs` | 운영 에러 | place, message, created_at | 0002_errors |
| `external_orders` | 통합결제 주문 멱등 | order_id, email, maum_user_id, grant_type, status, applied_at, revoked_at | ⚠️ **코드는 참조하나 어떤 .sql에도 DDL이 없음** (§15) |

### 6.2 `maum-auth` (바인딩 `AUTH_DB`, id `2df188da-159e-43ea-be31-b2dc39d8501d`)

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `users` | 마음 통합 계정 | id(=maum_user_id), email UNIQUE, password_hash(PBKDF2 salt:hash), name, created_at | **마음곁과 동일 DB·동일 ID 공유** |
| `users.email_verified` | 이메일 인증 플래그 | — | ⚠️ 코드(`markEmailVerified`/`isEmailVerified`)는 쓰지만 **스키마 파일에 컬럼 정의 없음** (§15) |

- **마이그레이션 파일 수**: 2개 (`0001_billing.sql`, `0002_errors.sql`) + 베이스 `schema.sql`, `maum-auth-schema.sql`.
- **다른 서비스와 공유하는 테이블**: `maum-auth.users` 1개 (마음곁 `maumgyeot`이 동일 database_id를 AUTH_DB로 바인딩). 도메인 테이블은 전부 분리.
- D1 제약: `DROP/RENAME COLUMN`·타입 변경 불가. 운영 중 변경은 대시보드 Console에서 `ALTER TABLE ADD COLUMN`만.

### 6.3 KV 키 스킴 (바인딩 `KV`, id `9d5fba04837142f4858b949511095f7e`)
| 키 | 용도 | TTL |
|---|---|---|
| `pin:<uid>` | 부모 PIN 해시(PBKDF2) | 무기한(탈퇴 시 삭제) |
| `rl:<key>:<bucket>` | 레이트리밋 버킷 | window×2초 |
| `ttscache:<sha256 40자>` | TTS mp3 캐시 | 30일 |
| `pwreset:<token>` | 비밀번호 재설정 | 1시간 |
| `emailverify:<token>` | 이메일 인증 | 7일 |

---

## 7. API 계약

전체 **36개 라우트**(`app.get/post/delete` 기준). 인증 표기: `JWT`=Bearer 마음 JWT, `ADMIN`=`Bearer ADMIN_SECRET`, `HMAC`=`MAUM_SSO_SECRET` 서명 토큰, `-`=공개.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/health` | - | 헬스체크 |
| POST | `/api/auth/register` | - | 가입(+`ref` 저장, 레이트 5/1h) |
| POST | `/api/auth/login` | - | 로그인(레이트 10/60s) |
| GET | `/api/auth/me` | JWT | 내 정보 + `email_verified` + `email_required` |
| POST | `/api/auth/forgot-password` | - | 재설정 메일(항상 `{ok:true}` — 계정 존재 노출 방지) |
| POST | `/api/auth/reset-password` | - | 토큰으로 비밀번호 변경 |
| POST | `/api/auth/resend-verify` | JWT | 인증메일 재발송(키 없으면 503) |
| POST | `/api/auth/sso` | HMAC | 마음풀 SSO 수신 → 수달 JWT |
| GET | `/api/pin` | JWT | PIN 설정 여부 |
| POST | `/api/pin` | JWT | PIN 설정·변경(4~6자리) |
| POST | `/api/pin/verify` | JWT | PIN 검증 |
| GET | `/api/children` | JWT | 아이 목록 |
| POST | `/api/children` | JWT | 아이 등록 |
| POST | `/api/session/start` | JWT | **쿼터 1 차감** + 세션 생성 + 첫 인사(정체성 고지) |
| POST | `/api/session/:id/utterance` | JWT | 아이 발화 → 또또 응답(레이트 30/60s) |
| POST | `/api/session/:id/end` | JWT | 세션 종료 → 통역 리포트 생성(멱등: done이면 기존 리포트 반환) |
| GET | `/api/reports` | JWT | 리포트 목록(요약 90자만) `?child_id=` |
| GET | `/api/reports/:id` | JWT | 리포트 상세 |
| GET | `/api/entitlement` | JWT | 잔여 통역 조회(마스터는 999999) |
| GET | `/api/history` | JWT | 이용권 등록 이력 100건 |
| POST | `/api/tts` | JWT | 또또 음성 합성(레이트 60/60s, 500자, 미설정 시 503) |
| POST | `/api/coupon/redeem` | JWT | 쿠폰 등록(미인증 이메일 403 `VERIFY`) |
| POST | `/api/grant` | HMAC | 마음풀 결제 → 이용권 지급(멱등) |
| POST | `/api/grant/revoke` | HMAC | 환불 회수 |
| POST | `/api/admin/coupon/create` | ADMIN | 쿠폰 대량 발행(최대 500) |
| GET | `/api/admin/coupon/list` | ADMIN | 쿠폰 목록 500건 |
| GET | `/api/admin/referrals` | ADMIN | 제휴 가입·전환 집계 |
| GET | `/api/admin/errors` | ADMIN | 최근 에러 200건 |
| GET | `/api/admin/stats` | ADMIN | 운영 통계(통역·아이·세션·구독·쿠폰·제휴·에러) |
| DELETE | `/api/account` | JWT | 회원 탈퇴(전체 삭제) |
| GET | `/privacy` `/terms` `/faq` `/account-deletion` | - | 법적 고지 HTML (4개 라우트) |
| GET | `/verify` | - | 이메일 인증 링크 처리 |
| GET | `/reset` | - | 비밀번호 재설정 폼 |
| OPTIONS | `/api/*` | - | CORS preflight(204) |
| ALL | `*` | - | `ASSETS.fetch` 위임(정적 프론트) |

주요 상태코드: `402` 쿼터 소진(`code:'QUOTA'`) · `403` 이메일 미인증(`code:'VERIFY'`) · `429` 레이트리밋 · `503` 기능 미설정(키 없음).

→ 설계 단계의 축약 API 표: `docs/maumotter-spec.md` §6 (8개만 기재 — 현행과 차이 있음, §15 참조)

---

## 8. 인증 / 세션

- **인증 방식**: 이메일+비밀번호(8자 이상). 해시는 **PBKDF2-SHA256, salt 16B, 100,000회, 256bit**, 저장 형식 `saltHex:hashHex`. 전부 `crypto.subtle` 기반(`btoa()` 직접 사용 금지 규약 준수).
- **토큰 구조**: HS256 JWT, 페이로드 `{ maum_user_id, email, iss:'maum', exp }`, `exp`는 **초 단위**, 유효기간 **30일**. 프론트는 `localStorage['maumotter_token']`에 보관(쿠키 미사용).
- **미들웨어**: `requireAuth`가 `Authorization: Bearer` 검증 후 `c.set('uid', maum_user_id)`.
- **SSO 연동** (`../_shared/maum-shared-spec.md` §1·§2 근거):
  1. **계정 원천 공유** — `maum-auth` D1 1개를 수달·곁 두 워커가 `AUTH_DB`로 동일 바인딩. `JWT_SECRET`도 시리즈 공유값이므로 한쪽에서 발급한 토큰을 다른 쪽이 검증 가능 = 통합 로그인 성립.
  2. **형제 앱 이동** — 설정 화면에서 `https://maumgyeot.com/#token=<JWT>`로 이동, 수신 앱이 해시에서 토큰을 읽어 그대로 로그인.
  3. **마음풀 SSO 수신** — `?sso=<payload_b64u.sig_b64u>` → `POST /api/auth/sso` → `verifySso()`가 `MAUM_SSO_SECRET`으로 HMAC-SHA256 검증 + `exp` 확인 → 이메일로 `maum-auth` 조회, 없으면 랜덤 비밀번호로 자동 생성 → `markEmailVerified` → 수달 JWT 발급.
- **부모 PIN**(2차 게이팅): JWT와 별개. 4~6자리 숫자를 PBKDF2 해시로 **KV**에 보관. 아이 모드 진입 시(`mode="auto"`, 미설정이면 설정 유도)와 리포트 열람 핸드오프 시(`mode="enter"`) 두 번 요구.
- **CORS**: 와일드카드 금지, 4개 오리진 화이트리스트(`maumotter.com`, `app.maumotter.com`, `maumgyeot.com`, `app.maumgyeot.com`) 동적 매칭 + `Vary: Origin`.
- **마스터 계정**: `MASTER_EMAILS = ['limyj007@gmail.com']` 하드코딩. 쿼터·레이트리밋 면제.

---

## 9. 외부 연동

| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic (AI Gateway 경유) | 또또 대화 + 통역 리포트 | `ANTHROPIC_API_KEY` | 설정됨·배포됨 |
| 전용 egress 프록시 | Anthropic 호출 IP 고정(선택) | `AI_PROXY_URL` | ⚠️ 미확인 (미설정 시 AI Gateway 폴백) |
| OpenAI (AI Gateway 경유) | 또또·라라 TTS | `OPENAI_API_KEY` | 설정됨·배포됨 (CLAUDE.md §9 명시) |
| Resend | 비밀번호 재설정·이메일 인증 메일 | `RESEND_API_KEY`, `EMAIL_FROM` | **미설정 (의도적 보류)** — 도메인 검증 전 설정 금지, §14 금지사항 참조 |
| 마음풀 (maumful.com) | SSO 수신 + 통합결제 grant | `MAUM_SSO_SECRET` | ⚠️ 미확인 (미설정 시 503) |
| 관리자 콘솔 | 쿠폰 발행 | `ADMIN_SECRET` | 설정됨 (CLAUDE.md §9 명시) |
| Cloudflare Web Analytics | 방문 통계 | — | 자동 설정(수동 beacon 금지) |
| 네이버 스마트스토어 | 이용권 판매 | `STORE_URL` (프론트 상수) | **미설정** — 현재는 마음풀 구매 링크로 대체 |
| face-api.js (jsDelivr CDN) | 온디바이스 표정 분석 | — | 배포됨 (가중치도 CDN 로드) |

개인정보 처리위탁 고지(`/privacy` §4): Anthropic · OpenAI · Cloudflare 3곳 명시.

---

## 10. 과금 / 수익 모델

- **과금 구조**: **통역 1회 = 세션 1건**. `POST /api/session/start`에서 1회 차감(또또와의 대화 1번 단위). 차감 우선순위는 **월간(무료+구독) → 회차권(pack)**.
- **상품·가격**:

| 코드 | 종류 | 제공량 | 유효기간 | 비고 |
|---|---|---|---|---|
| (기본) | 무료 | 월 **5회** | 매월 리셋(UTC 기준 `ym`) | `FREE_MONTHLY=5` |
| `sub_light` | 구독 | 월 **30회** (무료 5 + 30) | 30일 | 중복 등록 시 기간 이어붙이기 |
| `sub_pro` | 구독 | 월 **100회** | 30일 | quota 100 이상이면 plan=`pro`로 승격 |
| `pack10` | 회차권 | **10회** | 60일 | 잔여 누적 |

  - **판매 가격(원)**: ⚠️ **미확인** — 코드·문서 어디에도 금액이 없다. 판매처(마음풀/스마트스토어) 상품 설정에만 존재.
- **결제 수단**: 서비스 내 직접 결제 **없음**. ① 외부 판매처 구매 → **쿠폰 코드** 등록(`/api/coupon/redeem`), ② 마음풀 결제 → **서명 grant 수신**(`/api/grant`). 토스페이먼츠 개별 연동은 하지 않는다(사업자 단일, 결제대행 규제 회피).
- **크레딧·구독 처리**:
  - `getEntitlement()` — `monthlyAllowance = FREE_MONTHLY + (활성 구독 quota)`, `totalRemaining = monthlyRemaining + packRemaining`.
  - `consumeQuota()` — 월간 잔여가 있으면 `usage_monthly` UPSERT(+1), 없으면 `packs.remaining` 차감.
  - `applyGrant()` — 구독은 남은 기간에 일수를 **더하고** quota는 `max()`로 상향, 회차권은 잔여에 **가산**.
  - 한도 초과 시 백엔드 `402`, 프론트는 **아이 모드 진입 전 부모 화면(`quotaWall`)에서 차단** → 아이가 결제 에러를 보지 않는다.
- **환불**: `/api/grant/revoke`가 구독 만료일을 해당 일수만큼 **되돌리고**, 회차권은 `MAX(0, remaining-count)`. 주문은 `external_orders.status='revoked'`로 마킹.
- **약관상 청약철회**: 디지털 콘텐츠 코드는 발송·등록 후 청약철회 제한(`/terms` 제5조).
- 통합결제 실행 스펙·DB·API 계약·검증 절차 상세는 외부 메모리 `project_maum_unified_payment` 참조 — **문서화 필요**.

---

## 11. 안전 · 윤리 · 법적 제약

> 아래는 `CLAUDE.md` 원문 인용이다. 완화·축약 금지.

**「3. 안전·윤리 (기능이 아니라 제약 — 타협 불가)」**

> spec 2장 전체를 준수. 특히:
> 1. **양육자 동반 + 부모 기기 전용**: 부모 핸드폰 단일 앱. 아이 소유 기기에 설치 안 함. 아이 단독 무제한 사용 불가.
> 2. **부모 모드 / 아이 모드**: 앱은 부모 모드로 시작. 아이 모드는 부모가 세션을 열 때만 진입. 모드 경계에 게이팅.
> 3. **컴패니언화 방지**: 무한 대화·중독 유도 금지. 세션은 10~15분, 명확히 끝난다.
> 4. **AI 정체성 고지**: "나는 진짜가 아닌 수달 친구"를 연령에 맞게 고지.
> 5. **비밀 보장 거짓말 금지**: "엄마한테 비밀로 할게" ❌ → 그루밍·고립 위험. "엄마가 더 잘 이해하도록 도와줄게" ⭕
> 6. **표정 영상 휘발성**(spec 7-C): 온디바이스 분석 + 원본 즉시 폐기. 저장·전송 금지.

**「위기 대응 운영 정책 (확정)」**

> - **운영자는 아이–또또 대화 내용을 모니터링/열람하지 않는다**(프라이버시). 위기 판정은 자동(LLM+키워드)으로만 수행되고 **부모 리포트의 `crisis.flag`+안내문**으로만 표면화된다.
> - 위기 신호 발견 시: 부모 리포트에 "단정 아님" 톤으로 표시 + **전문기관 번호 안내**(아동보호전문기관 112 / 1577-1391). **아이 화면엔 위기 상세 절대 노출 안 함**, 운영자 개입/신고도 자동으로 하지 않음(보호자 판단 존중·오탐 방지).
> - 즉, "에스컬레이션"=부모에게 전달까지. 그 이후 조치는 보호자 책임. 이 정책은 개인정보·아동안전 균형의 결과이며 변경 시 spec 2장 재검토 필요.

**코드에 남은 흔적 (검증 지점)**

| 원칙 | 코드 근거 |
|---|---|
| 2-2 게이팅 | `PinGate` 2회(`pinStart`·`handoff`), `/api/pin/verify` |
| 2-3 컴패니언화 방지 | `secsLeft = 12*60` 타이머 |
| 2-4 정체성 고지 | `/api/session/start` 첫 인사 "진짜는 아니지만, 네 마음 이야기를 들어주는 친구야" |
| 2-5 비밀 거짓말 금지 | `ottoSystem()` `[금지]` 절 |
| 2-6 위기 보수 판정 | LLM `crisis.flag` + `CRISIS_KW` 14종 OR, 아이 화면 비노출 |
| 2-7 의료용어 금지 | `MED_TERMS` 10종 후처리 검증 → 재생성 1회 |
| 2-8 표정 휘발성 | 프레임 메모리 처리·요약 120자만 서버 전송, 언마운트 시 카메라 트랙 정지 |
| 2-9 데이터 최소수집 | `/privacy`·`Settings` 고지, 리포트 부모 전용 |

**법적 사업자 정보** (`BIZ` 상수): 상호 마음서비스 · 대표자 김근혜 · 사업자등록번호 780-31-01832 · 통신판매업 제2026-서울영등포-1157호 · 서울 영등포구 문래로26길 6 · 문의 shine184280@gmail.com. 개인정보처리방침·이용약관 시행일 2026-06-21.

→ 안전 원칙 9개 조항 전문: **`docs/maumotter-spec.md` §2** / 또또의 위기 시 행동 가드레일: **`docs/maumotter-dialogue-scenarios.md` §4**

---

## 12. 운영

- **배포 절차**: **로컬 개발 없음(No local dev)**. 코드 수정 → **GitHub 웹 UI로 파일 전체 교체**(Ctrl+A → 붙여넣기) → push → Cloudflare Workers Builds 자동 빌드·배포. `npm run dev`·`wrangler dev` 안내 금지.
- **스키마 변경**: 대시보드 D1 Console에서 `ALTER TABLE ADD COLUMN`만. DROP/RENAME/타입 변경 불가.
- **시크릿 등록**: Cloudflare 대시보드 → Workers → Settings → Variables and Secrets.
- **Cron / 스케줄**: **해당 없음**. `wrangler.toml`에 `[triggers]` 없음. 월간 쿼터 리셋도 cron이 아니라 `ym()` 키(`YYYYMM`) 기준 자연 롤오버.
- **모니터링·에러로그**:
  - `logError(env, place, message)` best-effort → `error_logs` 테이블. 호출 지점: `chat_llm`, `report_llm`, `tts`, `email`, `unhandled:<path>`.
  - `app.onError`가 미처리 예외를 잡아 로그 후 사용자에겐 일반 메시지만 노출.
  - `/api/admin/errors`(최근 200건) · `/api/admin/stats`(통역 총계/주간, 아이·세션 수, 활성 구독, 당월 사용량·활성 사용자, 쿠폰 발행/사용, 제휴 가입, 주간 에러) · `public/admin.html` 대시보드.
- **레이트리밋**: KV 버킷 방식. register 5/1h, login 10/60s, forgot·reset·redeem 5~10/1h, sso 20/60s, session 12/1h, utterance 30/60s, tts 60/60s. KV 실패 시 **fail-open**(통과).
- **롤백**: 서비스별 커밋 분리 원칙(`[maumotter] …` 프리픽스)으로 선택적 `git revert` 가능. Cloudflare Workers 배포 버전 롤백 또는 이전 커밋 revert 후 재배포. ⚠️ **D1 마이그레이션 롤백 절차는 미확인**.

---

## 13. 서비스 간 의존관계

| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음곁 (maumgyeot) | `maum-auth` D1 공유(동일 database_id) · `JWT_SECRET` 공유 · `_shared/auth.ts` 동일 사본 · CORS 상호 허용 · `#token=` 상호 진입 | ↔ 양방향 |
| 마음풀 (maumful.com) | `?sso=` SSO 토큰 수신 · `/api/grant` 결제 지급 수신 · 이용권 구매 링크(`?go=charge`) | ← 수신(마음풀 → 수달) |
| `_shared/` | 공유 규약 문서 + `auth.ts` CANONICAL + `maum-auth-schema.sql` | ← 참조 |
| Cloudflare AI Gateway (`maumful` 게이트웨이) | Anthropic·OpenAI 호출 경유 — **마음풀 계정의 게이트웨이를 수달도 사용** | ← 의존 |

### 마음곁(maumgyeot)과의 공유 · 분리 경계

| 항목 | 마음수달 | 마음곁 | 공유? |
|---|---|---|---|
| GitHub 저장소 | `maumotter` | `maumgyeot` | ❌ 분리 |
| 도메인 | maumotter.com | maumgyeot.com | ❌ 분리 |
| 워커 | `maumotter` | `maumgyeot` | ❌ 분리 |
| 도메인 D1 | `maumotter-db` (`f404bbb2…`) | `maumgyeot-db` (`d04c7ab8…`) | ❌ 분리 |
| **공용 인증 D1** | `maum-auth` (`2df188da…`) | `maum-auth` (`2df188da…`) | ✅ **공유(동일 ID)** |
| **JWT 시크릿·페이로드** | `{maum_user_id,email,iss:'maum',exp}` | 동일 | ✅ 공유 |
| **`auth.ts`** | `src/auth.ts` | `src/auth.ts` | ✅ 동일 사본(캐논 `_shared/auth.ts`) |
| KV 네임스페이스 | `9d5fba04…` | `ab0da674…` | ❌ 분리 |
| 도메인 테이블 | children / sessions / utterances / reports | pets / observations / pet_reports | ❌ 분리 |
| 과금 엔진 | subscriptions·packs·usage_monthly·coupons·referrals·error_logs | **동일 구조** (migrations 번호만 다름: 곁은 0001~0003) | 🔁 설계 동일·데이터 분리 |
| 통역 도메인 | **아동 정서** | **동물 행동** | ❌ 절대 혼용 금지 |
| 온디바이스 카메라 패턴 | face-api.js 표정 분석 | 재사용 예정(IMPLEMENTATION_PLAN P3) | 🔁 패턴 공유 |
| 브랜드 서사 | "말 못 하는 가족의 속마음을 통역한다" | 동일 | ✅ 공유 |

⚠️ **회원 탈퇴의 파급**: `DELETE /api/account`가 `deleteUser(AUTH_DB)`로 공용 `users` 행을 삭제한다. 수달에서 탈퇴하면 **마음곁 계정도 함께 사라진다.** `/account-deletion` 페이지에 고지되어 있으나, 마음곁 쪽 도메인 데이터(`pets`·`observations`·`pet_reports`)는 **고아 행으로 남는다**(§15).

---

## 14. 현황 및 백로그

- **라이브 상태**: **배포 운영 중**. 최종 커밋 `20b4fa0`(2026-08-29). MVP(부모 가입 → 아이 등록 → 세션 → 통역 리포트)에 더해 P0 안전(PIN 게이팅·12분 타이머·정체성 고지), P1(STT/TTS·위기 키워드), P3(표정 온디바이스 분석), 유료·법적·운영 레이어까지 모두 반영됨.
- **미착수 / 대기**:
  - 감정 이모지·그림 선택지(3~5세 보조 입력) — 설계만
  - 위기 연계 **전문기관 디렉토리** — 설계만
  - 리포트 누적 추이(시계열) — 설계만
  - `RESEND_API_KEY` 설정(Resend 도메인 검증 선행) · `STORE_URL` 설정
  - 마음풀 통합결제 grant **배포 승인** — 토스페이먼츠 완전 반영 후
  - 안드로이드 앱 — 보류. 상세는 외부 메모리 `project_android_app_plan` 참조 — 문서화 필요
  - 전 서비스 잔여 백로그는 외부 메모리 `project_maum_backlog` 참조 — 문서화 필요
- **금지 사항**:
  1. `wrangler dev`·`npm run dev` 등 로컬 개발 안내 금지. 배포는 GitHub 웹 UI만.
  2. 부분 수정 diff 제공 금지 — **완성된 전체 파일** 제공(Ctrl+A → 붙여넣기).
  3. Anthropic·OpenAI **직접 호출 금지** — 반드시 AI Gateway(또는 `AI_PROXY_URL`) 경유. 직접 호출은 403.
  4. **Resend 도메인 검증(Cloudflare DNS SPF/DKIM/MX) 완료 전 `RESEND_API_KEY` 설정 금지** — 설정만 하면 미인증 유저의 쿠폰 등록이 전부 403으로 막힌다(치명).
  5. 마음곁(동물)·마음풀 규칙·용어를 이 폴더로 끌어오지 말 것.
  6. 토스페이먼츠 완전 반영 전 통합결제 관련 코드 **커밋·푸시·배포 금지**(루트 CLAUDE.md).
  7. D1 `DROP/RENAME COLUMN`·타입 변경 금지.
  8. 재방문 유도·푸시·무한 대화 등 컴패니언화 기능 금지.

---

## 15. 알려진 리스크 · 기술부채

| # | 항목 | 내용 | 영향 |
|---|---|---|---|
| 1 | **`_shared/auth.ts` 캐논이 낡음** | 캐논에 `deleteUser`·`findByEmail`·`setPassword`·`markEmailVerified`·`isEmailVerified` **5개 함수가 없다**(17줄 부족). `maumotter/src/auth.ts`에는 있다(md5 `c48c0f…` vs `c167ad…`). `maumgyeot/src/auth.ts`는 수달과 **주석 1줄만** 다름(`18dfa3…`). 실질 캐논은 수달 사본이고 `_shared/`가 뒤처졌다. | 새 형제 서비스가 `_shared`를 복사하면 탈퇴·이메일 인증이 통째로 빠진다 |
| 2 | **`users.email_verified` 컬럼 DDL 부재** | `markEmailVerified`/`isEmailVerified`가 이 컬럼을 쓰지만 `_shared/maum-auth-schema.sql`·`maumotter/maum-auth-schema.sql`(두 파일은 완전 동일) 어디에도 없다. 코드는 try-catch로 감싸 `isEmailVerified`가 실패 시 **`true` 반환**(fail-open). | 스키마 재적용 시 이메일 인증 게이트가 조용히 무력화 |
| 3 | **`external_orders` 테이블 DDL 부재** | `/api/grant`·`/api/grant/revoke`가 참조하지만 `schema.sql`·`migrations/*.sql` 어디에도 `CREATE TABLE external_orders`가 없다. | 통합결제 착수 시 첫 호출부터 실패. **착수 전 마이그레이션 작성 필수** |
| 4 | **통합결제 구현 ≠ 문서 상태** | `CLAUDE.md` §10은 "착수 대기 — 수달 추가 구현(착수 지시 시)"이라 적었으나 `/api/grant`·`/api/grant/revoke`는 **이미 코드에 있다**(`src/index.ts` 533~584행). 루트 CLAUDE.md는 "토스 반영 전 커밋·푸시·배포 금지"로 규정. | 배포 상태와 문서 상태가 엇갈림. `MAUM_SSO_SECRET` 설정 여부 확인 필요 |
| 5 | **TTS 스펙 문서 ≠ 코드** | `CLAUDE.md` §9: "OpenAI **tts-1**, 또또=**shimmer**·라라=nova". 코드: **`gpt-4o-mini-tts` 우선**(instructions로 톤 지시) → 실패 시 `tts-1` 폴백, 또또=**fable**·라라=nova, 캐시 키 `v2\|voice\|text`. | 문서만 보고 수정하면 음색·모델이 되돌아감 |
| 6 | **`docs/IMPLEMENTATION_PLAN.md` 갭 표가 낡음** | #2 게이팅·#3 시간제한·#4 정체성 고지·#6 위기 키워드·#10 STT/TTS·#12 설정화면·#14 대시보드를 모두 `❌ 갭`으로 표기하나 **전부 구현·배포됨**(#8 표정만 ✅ 갱신됨). | 재작업 유발 위험 |
| 7 | **`docs/maumotter-spec.md`가 현행과 어긋남** | §5 `sessions`에 실제 존재하는 `buddy` 컬럼 없음. §6 API 표는 8개만 나열(실제 36개). §10 "열린 결정" 1번 과금 모델을 미확정으로 두었으나 과금은 이미 구현·운영 중. | 진입 문서로 쓰기 어려움 → 이 DESIGN.md가 대체 |
| 8 | **도메인 설정 불일치** | `CLAUDE.md` §5는 `app.maumotter.com` / `api.maumotter.com`, `wrangler.toml` 라우트는 **`maumotter.com` 하나뿐**. CORS 화이트리스트에만 `app.` 서브도메인 존재. | 서브도메인 접근 시 404 가능 |
| 9 | **`CLAUDE.md` §5 인프라 표 미기입** | D1·KV 항목이 "(생성 후 기입)"인 채로 남아 있으나 실제 ID는 `wrangler.toml`에 있다. | 운영자가 ID를 찾지 못함 |
| 10 | **공용 계정 삭제의 고아 데이터** | 수달 탈퇴가 `maum-auth.users`를 지우지만 마음곁 도메인 데이터는 남는다. 역방향(곁에서 탈퇴)도 동일하게 수달 데이터가 고아가 된다. | 개인정보 완전 파기 주장과 충돌 가능 |
| 11 | **마스터 이메일 하드코딩** | `MASTER_EMAILS = ['limyj007@gmail.com']`이 소스에 평문. | 계정 변경 시 재배포 필요 |
| 12 | **AI Gateway 계정 종속** | AI Gateway URL에 마음풀 계정/게이트웨이 이름(`.../maumful/...`)이 하드코딩. "별개 생태계"라면서 게이트웨이는 공유. | 마음풀 게이트웨이 변경이 수달 장애로 전파 |
| 13 | **`STORE_URL` 빈 값** | 프론트 상수가 `''`이라 스마트스토어 버튼은 비활성, 현재는 마음풀 `?go=charge` 링크로 우회. 단 `/terms` 제4조·`/faq`는 여전히 "네이버 스마트스토어"를 안내. | 판매 채널 안내 이원화 |
| 14 | **face-api.js 가중치를 `@master`로 로드** | `cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights` — 버전 고정 없음. | 업스트림 변경 시 표정 기능 무단 중단 |
| 15 | **테스트 부재** | 테스트 코드·CI 설정 없음. `package.json` 스크립트는 `deploy` 하나. | 회귀 검증은 전적으로 수동 |
| 16 | **무빌드 프론트의 런타임 오류 사각지대** | 단일 `public/index.html`(약 1,300행)에 전 화면이 들어 있고 빌드가 없어 렌더 오류를 사전에 못 잡는다(루트 CLAUDE.md `feedback_frontend_render_smoke` 경고와 동일 리스크). | 프론트 오류가 배포 후 발견 |

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 표준 템플릿 기반 통합 진입 문서 최초 작성. 기존 `docs/` 4종은 유지하고 §2·§7·§11에서 링크 위임. §1·§5~§8·§10·§12·§14는 코드에서 직접 확인해 기재. | Claude Code |
