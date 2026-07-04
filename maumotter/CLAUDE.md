# CLAUDE.md — 마음수달 (MaumOtter)

> 이 파일은 **마음수달 저장소(`maumotter/`)에서 작업할 때의 규칙**이다.
> 클로드코드는 이 폴더에서 일할 때 이 문서의 규칙만 따른다. (형제 서비스 마음곁의 규칙·도메인을 섞지 말 것)
> 상위 폴더 구조: `마음/maumotter/` (형제: `마음/maumgyeot/`, 공유: `마음/_shared/`)

---

## 0. 이 서비스가 무엇인가 (한 줄)

아이가 화면 속 수달 '또또'와 대화하며 속마음을 꺼내면, AI가 그것을 **양육자가 이해·행동할 수 있는 코칭으로 통역**해 전달하는 정서 통역 서비스.

핵심 철학: **AI는 아이의 친구(대체)가 아니라, 아이와 양육자 사이의 다리(bridge)다.**

---

## 1. 설계 문서 (작업 전 반드시 읽기)

`docs/` 안의 세 문서가 이 서비스의 전부다. 작업 전 관련 문서를 읽는다.
- `docs/maumotter-spec.md` — 전체 아키텍처·화면·D1 스키마·API·로드맵 (메인)
- `docs/maumotter-dialogue-scenarios.md` — 또또의 연령별 대화 시나리오·대사·가드레일
- `docs/maumotter-translation-engine.md` — 통역 엔진 LLM 프롬프트 전문

공유 규약: `../_shared/maum-shared-spec.md` — JWT·계정·브랜드 (마음곁과 공통)

---

## 2. 이 서비스의 도메인 규칙 (마음곁과 다름 — 혼동 금지)

| 항목 | 마음수달 규칙 |
|------|---------------|
| 통역 대상 | **아이(3~9세)의 정서·속마음** |
| 금지 용어 | **의료 용어**(치료·진단·처방·장애·증상) 사이트 전역 금지 |
| 화법 | 따뜻하고 단정하지 않게("~인 것 같아요") |
| 캐릭터 | 마음 수달 '또또' (1인칭 투사 화법, 캐묻지 않음) |
| 위기 신호 | 학대·자해·방임 → 부모 리포트로 에스컬레이션 + 전문기관 연계 |
| 아이에게 | 위기 개입 시도 금지. 아이 화면엔 위기 상세 절대 노출 안 함 |

> ⚠️ 이 폴더에서 "통역"은 **아동 정서**다. 동물행동학·수의학 용어가 끼어들면 안 된다.

---

## 3. 안전·윤리 (기능이 아니라 제약 — 타협 불가)

spec 2장 전체를 준수. 특히:
1. **양육자 동반 + 부모 기기 전용**: 부모 핸드폰 단일 앱. 아이 소유 기기에 설치 안 함. 아이 단독 무제한 사용 불가.
2. **부모 모드 / 아이 모드**: 앱은 부모 모드로 시작. 아이 모드는 부모가 세션을 열 때만 진입. 모드 경계에 게이팅.
3. **컴패니언화 방지**: 무한 대화·중독 유도 금지. 세션은 10~15분, 명확히 끝난다.
4. **AI 정체성 고지**: "나는 진짜가 아닌 수달 친구"를 연령에 맞게 고지.
5. **비밀 보장 거짓말 금지**: "엄마한테 비밀로 할게" ❌ → 그루밍·고립 위험. "엄마가 더 잘 이해하도록 도와줄게" ⭕
6. **표정 영상 휘발성**(spec 7-C): 온디바이스 분석 + 원본 즉시 폐기. 저장·전송 금지.

### 위기 대응 운영 정책 (확정)
- **운영자는 아이–또또 대화 내용을 모니터링/열람하지 않는다**(프라이버시). 위기 판정은 자동(LLM+키워드)으로만 수행되고 **부모 리포트의 `crisis.flag`+안내문**으로만 표면화된다.
- 위기 신호 발견 시: 부모 리포트에 "단정 아님" 톤으로 표시 + **전문기관 번호 안내**(아동보호전문기관 112 / 1577-1391). **아이 화면엔 위기 상세 절대 노출 안 함**, 운영자 개입/신고도 자동으로 하지 않음(보호자 판단 존중·오탐 방지).
- 즉, "에스컬레이션"=부모에게 전달까지. 그 이후 조치는 보호자 책임. 이 정책은 개인정보·아동안전 균형의 결과이며 변경 시 spec 2장 재검토 필요.

---

## 4. 기술 스택·작업 방식 (cloudflare-dev 스킬 준수)

- **No local dev**: 모든 변경은 GitHub 웹 UI → Cloudflare 자동 배포. `npm run dev`·`wrangler dev` 안내 금지.
- **파일 전체 교체**: 부분 수정보다 완성된 전체 파일 제공 (Ctrl+A → 붙여넣기).
- **스택**: Cloudflare Workers + Hono + D1 + KV, 프론트 React CDN(unpkg, npm 빌드 아님).
- **JWT**: `crypto.subtle` 필수, `btoa()` 직접 금지, 한국어 페이로드 TextEncoder UTF-8. **구조·시크릿은 `_shared/maum-shared-spec.md` 2장 따름.**
- **CORS**: 와일드카드 금지, 동적 오리진 매칭. 마음 시리즈 공통 화이트리스트(`_shared` 3장).
- **D1**: `DROP/RENAME COLUMN`·타입 변경 불가. 스키마 변경은 대시보드 Console에서 `ALTER TABLE ADD COLUMN`.

---

## 5. 인프라 식별자 (작업 시 채워넣기)

| 항목 | 값 |
|------|-----|
| GitHub 저장소 | maumotter |
| 도메인 | app.maumotter.com / api.maumotter.com |
| D1 (서비스) | (생성 후 기입) |
| D1 (공용 인증) | maum-auth (형제와 공유, `_shared` 1장) |
| KV | (생성 후 기입) |
| JWT_SECRET | Cloudflare Secret (마음곁과 동일 값) |

---

## 6. 통역 엔진 핵심 규칙

- 세션 종료 시 누적 발화 → LLM 1회 호출 → 리포트 JSON 생성.
- `temperature: 0`, 출력은 순수 JSON, 파싱 실패 대비 try-catch.
- 의료 용어 출력 후처리 검증(발견 시 재생성/치환).
- 위기 판정 보수적으로, "단정 아님" 명시.
- 상세 프롬프트는 `docs/maumotter-translation-engine.md`.

---

## 7. 착수 권장 순서

D1 스키마 → 인증/JWT(공유 규약) → 세션·발화 API → 통역 엔진 → 부모 모드 리포트 → 아이 모드 대화 화면.

먼저 1차 MVP 범위(부모 가입 → 아이 1명 등록 → 텍스트 세션 → 통역 리포트 1종)부터.

---

## 8. 절대 잊지 말 것

- 이 폴더 = **아동 정서 도메인**. 마음곁(동물) 규칙·용어를 끌어오지 말 것.
- 인증·브랜드만 `_shared`를 따르고, 나머지는 이 폴더 문서를 따른다.
- 안전 원칙(3장)은 모든 코드 레이어에 흔적이 남아야 한다.

---

## 9. 유료·법적·운영 기능 (2026-06 구축, 마음곁과 동일 엔진)

> 숫자 상수 `src/index.ts` 상단. 마이그레이션 `migrations/0001_billing·0002_errors.sql`(적용됨). 안드로이드 앱은 보류(메모리 `project_android_app_plan`).

**유료/쿼터**: `통역 1회 = 세션 1건`(`/api/session/start`에서 차감 — 또또와의 대화 1번). 무료 월 5 + 구독(sub_light 30/sub_pro 100) + 회차권(pack10 10/60일). 한도초과 402 시 **아이 모드 진입 전 부모화면 차단**(`tryStart`→quotaWall, 아이가 에러 안 봄).
**쿠폰/제휴/게스트**: `/api/coupon/redeem`, `?ref=`→referrals, `/admin`(ADMIN_SECRET — **설정됨**). 게스트 미리보기는 아동 PIN/세션 구조라 **미포함**.
**법적**: `/privacy /terms /faq /account-deletion`(PAGE+`BIZ`=마음서비스 780-31-01832·통신판매업 제2026-서울영등포-1157·대표 김근혜). **회원탈퇴** `DELETE /api/account`(children·sessions·utterances·reports·빌링행 + KV pin + 공용계정). **위기대응 정책**: §3 참조(운영자 비열람·부모 리포트로만).
**이메일(Resend) — 상용화 시점까지 보류(키 미설정·no-op)**: 비번재설정·이메일인증 코드 완성·배포됨. `RESEND_API_KEY` 미설정 시 no-op. maum-auth `email_verified`(시리즈 공유).
> ⚠️ **치명 주의**: 도메인 미검증 상태로 키만 넣으면 발송 실패+`email_required=true`로 **미인증 유저 쿠폰등록이 전부 403**으로 막힘. **Resend 도메인 검증(Cloudflare DNS SPF/DKIM/MX) 완료 후에만** 키 설정.
**운영**: error_logs+logError+onError, `/api/admin/stats`·`/admin` 대시보드.
**또또 음성(TTS, 2026-06 구축)**: `POST /api/tts`(authed) → **OpenAI tts-1**, 답변 텍스트만 합성(아이 발화 미전송). 버디별 음성 **또또=shimmer·라라=nova**, KV 캐시(`ttscache:` 30일·인사/공통문구 재생성 0). ⚠️ **반드시 AI Gateway 경유**(`OPENAI_GATEWAY` const) — 직접 api.openai.com은 Workers egress에서 **403 `unsupported_country_region_territory`** 차단(Anthropic과 동일). `OPENAI_API_KEY` **설정됨**(sk-ant- 클로드키 아님, OpenAI 별도계정 sk-proj-). 미설정/실패 시 프론트 `speak()`가 **기기 speechSynthesis 폴백**(무영향). 모바일 자동재생: `startConversation`에서 Audio+speechSynthesis **둘 다 잠금해제**(silent wav·빈 utterance). 개인정보 처리위탁에 OpenAI 명시.
**프론트(public/index.html)**: `EntitlementCard`(이용권·구매링크 `STORE_URL`[미설정]·이용내역), `VerifyBanner`, 온보딩(아이 0명시), 랜딩 소개, og.png+OG메타.
**미설정**: `RESEND_API_KEY`·`STORE_URL`·토스 라이브키. 웹 애널리틱스=Cloudflare 자동설정(수동 beacon 금지).

## 10. 연동형 유료결제 (마음풀 통합결제 — 착수 대기)
수달 유료결제는 **마음풀에서 상품 판매 후 수달로 자동 지급**하는 방식으로 통합 예정(토스 개별연동 회피). 사업자 단일(마음서비스).
- **수달 추가 구현(착수 지시 시)**: `POST /api/grant`(HMAC=`MAUM_SSO_SECRET` 검증 → `{email,grantType,orderId}` → maum-auth email→uid[없으면 생성] → 기존 `applyGrant(uid, sub_light|sub_pro|pack10)`) + `external_orders` 멱등테이블 + `/api/grant/revoke`(환불). 기존 쿠폰·SSO·entitlement 재사용.
- **⚠️ 토스페이먼츠 완전 반영 후에만 착수·배포**. 상세 스펙 = 메모리 `project_maum_unified_payment` / 루트 `../CLAUDE.md` 「연동형 유료결제」. 곁(maumgyeot)은 동일 엔진 대칭 구현.
