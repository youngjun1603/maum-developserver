# 마음부부 (maumbubu) 설계서

## 0. 문서 정보
| 항목 | 내용 |
|---|---|
| 서비스명 | 마음부부 (MaumBubu) |
| 폴더 | `maumbubu/` (원 설계 패키지는 `maumbubu-dev/`) |
| 최종 갱신 | 2026-09-19 |
| 근거 커밋 | `b67d336` (2026-08-29, maumbubu 마지막 커밋) · 레포 HEAD `edc8aa4` (2026-09-12) |

> 근거 자료: `maumbubu/CLAUDE.md`, 루트 `CLAUDE.md`, `maumbubu-dev/SPEC_MASTER.md`(엔진 진본 v3),
> `maumbubu-dev/마음부부_추가개발지시서_ADDENDUM01.md`, `maumbubu-dev/README.md`,
> `src/index.ts` · `src/translate-route.ts` · `src/translation-prompts.ts`,
> `migrations/0001~0003`, `public/static/bubu_hub.jsx`, `review/BATCH_01.md`, `wrangler.toml`.
>
> **`project_maumbubu` 대체(코드·로컬 문서에서 복원)** — 상세 스펙 진본은 외부 메모리가 아니라 레포 안에 있다: `maumbubu-dev/SPEC_MASTER.md`(472줄, 엔진 진본 v3) · `maumbubu-dev/마음부부_추가개발지시서_ADDENDUM01.md`(130줄) · `maumbubu/review/BATCH_01.md`(감수 원문). SPEC 장 ↔ 이 문서 ↔ 코드 대응은 다음과 같다.
>
> | SPEC_MASTER 장 | 이 문서 | 코드 구현 위치 |
> |---|---|---|
> | §1 자산 등급(A·B·C급) | §1 핵심 가치 제안 | — (기획 전용) |
> | §2 엔진 3층 + 트랙 분기 | §2.1 | `translation-prompts.ts` `buildTranslationPrompt()` L404~L430 |
> | §2.2 통역 4모드 | §2.2 | `MODE_MODULES` L234~L335 (receive L235 · send L255 · mediate L281 · perspective L307) · 입력 라벨 `MODE_INPUT_LABEL` L392~L396 |
> | §3.1 증거 등급 · §3.2 EFT 악순환 고리 | §2.4 | 심리상담 트랙 모듈 |
> | §3.3 신학 기조(2세대 채택) · §3.4 6렌즈 | §2.1 · §11.8 | 기독교 트랙 모듈 |
> | §4.1~§4.4 프롬프트 조립·강도 슬라이더 | §2.1 · §4 | `buildTranslationPrompt()` 조립 순서 = 프리앰블 → 트랙 → 모드(L422) → 강도 → 기억 → `SAFETY_OVERRIDE`(L425, **항상 마지막·상시**) |
> | §5 멀티모달·동의 게이트 | §3 시나리오 3 | `MultimodalSignals.consentSessionId` 부재 시 주입 거부 (L52~L60) |
> | §6.1 관계 프로파일 개념 스키마 | §6 | `RelationshipMemory` L38~L49 |
> | §7 회복 레이어(활동·피드백·커뮤니티·사전검수) | §4 | `translate-route.ts` 활동·피드백·커뮤니티 라우트 |
> | §9.1 분리 보호 3단계 | §11.1 | `SAFETY_OVERRIDE` L105~L140 (T1 L110 · T2 L115 · T3 L121 · 안전 출력 스키마 L134~) |
> | §10 자산화 로드맵·이중 수익 | §10 | — (기획 전용) |
>
> ⚠️ **SPEC §6.1이 요구했으나 코드에 없는 필드 2개**(코드에서 복원 · 근거: `src/translation-prompts.ts` L38~L49 · `migrations/0002_share.sql`): 구현된 `RelationshipMemory` 는 `recurringTopics` · `psychologyProfile` · `christianProfile` · `successPatterns` · `partnerPerspective` **5개뿐**이다. SPEC이 함께 요구한 **슬라이더 설정**은 브라우저 `localStorage`(`bubu_config`)에만 남고(§15 #14), **안전 플래그(민감·암호화)** 는 `relation_safety.tier` **평문**으로 들어갔다(§15 #4).
>
> ⚠️ **구현 이력(무엇을 어떤 순서로·왜 그렇게 고쳤는지)** 은 외부 메모리 `project_maumbubu` 에만 존재 — 코드로 복원 불가. 레포에 남은 것은 커밋 메시지뿐이며, **ADDENDUM 02 원본 문서**(§1 기억 분리 · §2 자살예방 109)는 레포에 아예 없다(§15 #11).

## 1. 서비스 개요
- **한 줄 정의**: 부부 대화의 "말과 마음 사이 간극"을 AI가 통역해 주는 서비스. 배우자의 말(수신)·내가 할 말(발신)·싸운 대화(중재)·상대 입장(관점) 4모드를, **심리상담(EFT·애착)과 기독교(Powlison/Keller/Tripp) 이중 트랙**으로 해석한다.
- **해결하는 문제**: 부부는 "문제가 있다"는 건 알지만 서로의 말을 어떻게 읽어야 할지 모른다. 범용 AI는 "내 입장에서 상대 말 해석"만 하고, 관계의 누적 맥락도 신앙 언어도 안전 가드레일도 없다.
- **타깃 사용자**: **만 19세 이상 성인 부부**(연령 게이트 강제, §11). 신앙 부부(기독교 트랙)와 일반 부부(심리상담 트랙)를 하나의 엔진으로 커버한다. 배우자 동의 없이 **혼자서도 쓸 수 있는 설계**(`couple_relations.user_b_id` NULL 허용).
- **핵심 가치 제안**: ① 이중 트랙(세계관 선택) + 슬라이더(강도 조절) ② **관계 기억** 누적으로 100번째 통역이 첫 번째보다 정확해짐 ③ 통역에서 끝나지 않는 **회복 레이어**(개선활동→피드백→성공공식→커뮤니티) ④ **분리 보호 3단계** 안전 오버라이드 ⑤ 기독교 상담 전문가 감수(`review/BATCH_01.md`).
- **생태계 내 위치**: **마음풀 생태계**. 별도 워커(`maumbubu`)지만 마음풀 본체와 **D1(`maumful-db`)·KV·JWT_SECRET·크레딧을 전부 공유**한다. 마음 시리즈(마음수달·마음곁)는 **별개 생태계**이므로 규칙을 끌어오지 말 것(루트 `CLAUDE.md` 명시). 마음세대(maumsedae)는 이 서비스에서 파생된 하위 앱(§13).

### ⚠️ 마음커플(maumcouple)과의 차이 — 이름이 비슷해 혼동 주의
| | **마음부부 (maumbubu)** | **마음커플 (maumcouple)** |
|---|---|---|
| 워커 / 도메인 | `maumbubu` / `bubu.maumful.com` | `maumcouple` / `couple.maumful.com` |
| 폴더 | `maumbubu/` | `package/maumcouple/` |
| 규칙 파일 | `maumbubu/CLAUDE.md` | `maumful-main/CLAUDE.md` |
| SSO 토큰 타입 | `type:'bubu'` (`GET /api/bubu-token`) | `type:'couple'` (`/api/couple-token`) |
| 핵심 엔진 | **대화 통역** — 그때그때 입력한 말·대화를 4모드로 통역 | **검사 결과 비교 분석** — 저장된 BIG5/LOST/DSI 점수 맞대기 |
| 입력 | 사용자가 붙여넣은 대화 문장 | 이미 받은 검사 `result_json` |
| 관계 지속성 | `relation_memory_v2` 누적 프로파일(영구) | 세션 단위(72시간 만료) |
| 트랙 | **이중**(심리상담 + 기독교) | 단일(심리) |
| 안전 체계 | **T1/T2/T3 분리 보호 오버라이드 상시** | 위기 감지 없음(마음커플 설계서 §15 지적 사항) |
| 연령 | **만 19세 이상 전용** | 명시 규정 없음 |
| 공통점 | 둘 다 마음풀 생태계 · `maumful-db`/KV/JWT_SECRET 공유 · Hono+Workers · 마음풀 크레딧 차감 · esbuild 사전컴파일 · 초대코드(`genSessionCode`) 패턴 재사용 |

> 마음부부가 마음커플에서 **재사용한 것**은 인프라 패턴(JWT SSO·D1·크레딧·6자 초대코드 로직)이지, 기능이 아니다.

## 2. 도메인 규칙 (이 서비스 고유)

### 2.1 엔진 3층 구조 + 트랙 분기 (SPEC_MASTER §2)
| 레이어 | 역할 | 트랙 |
|---|---|---|
| ① 공통 탐지 | 행동 신호(비난/경멸/방어/담쌓기), '거친 시작'. 입력=텍스트 + (동의 시) 음성·영상 비언어 | **공통** |
| ② 트랙 선택 | 사용자 세계관에 따른 경로 분기 | 심리상담 ↔ 기독교 |
| ③ 해석 | 심리상담=EFT 악순환 고리 / 기독교=6렌즈(마음·우상·성화·언약·용서·복음) | **분기** |
| ④ 강도 조절 | 심리상담=감정깊이(1~3) / 기독교=신학강도(1~3)+목양톤(grace·direct) | **분기** |
| ⑤ 개입 | 4모드 재작성 + 개선활동 + 안전 오버라이드 | 공통 인터페이스 |
| ⑥ 회복 | 활동→피드백→재해석→기억 축적→커뮤니티 | **공통** |

### 2.2 통역 4모드 (`MODE_MODULES`, translation-prompts.ts)
| 모드 | 정의 | 출력 스키마 핵심 필드 |
|---|---|---|
| `receive` 수신 | "저 말이 무슨 뜻이야?" 배우자 말의 표면 아래 통역 | `your_feeling_first` · `surface` · `translation` · `hidden_need` · `check_question` · `improvement` · `caution` |
| `send` 발신 | "이걸 어떻게 말하지?" '거친 시작'→'부드러운 시작' 재작성 | `your_feeling_first` · `original_intent` · `risk_in_original` · `rewritten` · `alternative` · `timing_tip` · `avoid` · `improvement` |
| `mediate` 중재 | 싸운 대화 전체 분석. **편들기 금지·같은 분량** | `your_feeling_first` · `person_a/person_b{said,underneath}` · `miss_point` · `cycle` · `next_word` · `improvement` · `caution` |
| `perspective` 관점 | "상대는 이걸 어떻게 느꼈을까" — 범용 AI와의 결정적 차별점 | `your_feeling_first` · `partner_view` · `partner_feeling` · `blind_spot` · `bridge` · `improvement` · `caution` |

- **전 모드 공통 1번 필드 = `your_feeling_first`** — BATCH_01 감수 원칙 P1(공감 우선)의 코드 구현. "통역·활동보다 사용자 본인의 마음이 먼저" (§11·§14).
- **전 모드에 `improvement` 블록 필수** — `action`(10분 이내·혼자 시작 가능) · `why_this` · `expect`(실패 면역) · `checkin`.

### 2.3 용어 정의 (혼동 금지)
- **관계(relation)**: `couple_relations` 1행. 마음부부는 사용자당 **1관계**가 전제(`POST /api/relation` get-or-create). 마음세대는 다중 관계로 뒤집힌다(§13).
- **관계 기억(relation memory)**: `relation_memory_v2`. 소유자 = **통역을 실행한 사용자**. (relation_id, user_id) 복합키(§11).
- **트랙(track)**: `psychology` | `christian`. 온보딩에서 선택, localStorage `bubu_config`에 보관.
- **안전 티어(safety tier)**: T1(즉시 분리) / T2(지속 학대) / T3(일반 갈등). T1·T2는 **모드별 JSON 대신 안전 스키마**를 반환(§11).
- **공유(share)**: 건별 명시 공유만. 공유 가능 항목은 4종으로 **닫힌 목록**(§11).

### 2.4 이론 사용 규칙 (SPEC_MASTER §3 — 증거 등급)
- EFT(★★★★★)가 2층의 심장. 애착이론(★★★★☆)은 '유형'이 아닌 **차원·상태 언어**로만.
- Gottman 4독소(★★★☆☆)는 **1층 신호 탐지용으로만** — '이혼 확률 예측'은 엔진에서 배제(교차검증 실패).
- 사랑의 언어(★★☆☆☆)는 보조 참고. **"당신의 사랑의 언어는 X" 식 유형 낙인 금지.**
- 기독교 트랙은 1세대(Adams식 선직면) 배제, **2세대(Powlison/Keller/Tripp) 기본값**. 통역의 본질이 '먼저 이해시키기'라 '먼저 죄 지적'과 목적이 상충하기 때문.

## 3. 사용자 플로우

### 주요 시나리오 1 — 첫 진입부터 통역까지
마음풀 로그인 → 메뉴 `💬 마음부부` → `GET /api/bubu-token`(type:`bubu`·7일) → `bubu.maumful.com/?t=…` →
`index.html` 인라인 스크립트가 `localStorage['bubu_token']` 저장 후 URL 정리 → `POST /api/relation`(get-or-create, `adult` 플래그 수신) →
**`adult=false`면 `AgeGate`**(생년월일 → `POST /api/age/verify`) → **`bubu_config` 없으면 `Onboarding`**(트랙 선택 → 슬라이더 → 안전 고지 동의) →
`Home`(4모드 카드) → `ModeView` 입력 → `POST /api/translate` → 결과 렌더(`ResultBlock` + `Improvement`) → 활동 피드백 탭 → `POST /api/feedback` → 재해석 응답.

### 주요 시나리오 2 — 선택적 공유 브리지
발신 통역 결과의 `rewritten` 아래 `[✉️ 이 문장 배우자에게 보내기]` → **"배우자에게 이렇게 보여요" 미리보기 모달 1회 확인** → `POST /api/share/send` →
(안전 티어 감지 relation이면 **403 차단**) → 배우자가 `Inbox`에서 열람(`GET /api/share/inbox`, 뱃지 카운트는 `?peek=1`) →
활동 제안이면 `[같이 할게요]` → `POST /api/share/respond`. 배우자 미연결이면 `Inbox`의 **6자 초대코드**(`/api/relation/invite` → `/api/relation/join`)로 연결.

### 주요 시나리오 3 — 멀티모달 '함께 분석'(쌍방 동의)
`Home`의 `🎥 함께 분석` → 녹화(영상+표정+어조)/녹음(음성만) 선택 → `POST /api/consent/request`(8자리 코드 발급, KV TTL 24h) →
배우자가 코드 입력 + 고지 동의 → `POST /api/consent/accept`(**요청자 본인 수락 차단**) → 캡처 활성화 →
**온디바이스 분석**(face-api.js CDN 지연 로드 + WebAudio 볼륨) → 원본 스트림 즉시 폐기, **요약 문자열만** `multimodal`로 전달 →
`POST /api/translate`(mode=`mediate`, 3크레딧) → 결과. 종료·철회는 `POST /api/consent/revoke`(쌍방 모두 가능).

### 화면 구성 (`public/static/bubu_hub.jsx` 단일 파일, 891줄)
| 컴포넌트 | 역할 |
|---|---|
| `App` | 라우터. 인증 → 성인 게이트 → 온보딩 → 뷰 분기(`home`/`mode`/`community`/`memory`/`multimodal`/`inbox`) |
| `AgeGate` | 만 19세 게이트 (§11) |
| `Onboarding` | 3스텝: 트랙 선택 → 슬라이더 → **안전 고지 동의** |
| `Home` | 4모드 카드 + 함께 분석 + 수신함(뱃지) + 관계 기억 + 커뮤니티 + 설정 |
| `ModeView` | 입력 → `/translate` → `SafetyScreen` 또는 `ResultBlock`+`Improvement`+`Share` |
| `SafetyScreen` | **T1/T2 전용 화면.** 공유·활동·커뮤니티 버튼 미노출, 기관 `tel:` 링크 |
| `ResultBlock` | `FIELD` 라벨 맵으로 모드 공통 렌더 |
| `Improvement` | 개선활동 카드 + 3단 피드백(해봤어요/하다말았어요/못했어요 + 반응 4종) |
| `Share` | 미리보기 모달 1회 → `/share/send` |
| `Inbox` / `InboxItem` | 받은 공유 + 배우자 연결(초대코드 발급·입력) |
| `Community` | 주제방 4개 · 글쓰기(사전 검수 거부 시 사유+수정제안+`crisis_support`) · 공감 카운트 표시 |
| `Memory` | 관계 기억 열람(반복 주제·성공 공식·프로파일) |
| `Multimodal` | 동의 요청/수락 → 온디바이스 캡처 → 분석 요약 → 통역 → 철회 |

## 4. 기능 명세
| # | 기능 | 설명 | 상태 | 구현 위치 |
|---|---|---|---|---|
| 1 | 4모드 통역 | 수신·발신·중재·관점 × 2트랙 | 배포됨 | `translate-route.ts:318` `/translate`, `translation-prompts.ts` `MODE_MODULES` |
| 2 | 이중 트랙 + 슬라이더 | 감정깊이 / 신학강도 · 목양톤 | 배포됨 | `psychologyTrackModule()` · `christianTrackModule()` |
| 3 | 공감 우선(P1) | 전 모드 `your_feeling_first` 선행 | 배포됨 | `COMMON_PREAMBLE` + 4개 모드 스키마 |
| 4 | 안전 오버라이드 T1/T2/T3 | 모든 통역 프롬프트에 상시 포함 | 배포됨 | `SAFETY_OVERRIDE` (`translation-prompts.ts:105`) |
| 5 | 안전 응답 스키마 + 분기 화면 | `safety_tier` 감지 → `SafetyScreen` | 배포됨 | 프롬프트 `:134`, 프론트 `SafetyScreen` |
| 6 | 관계 기억(사용자별) | (relation_id, user_id) 복합키 누적 프로파일 | 배포됨 | `relation_memory_v2`, `loadMemory`/`saveMemory` |
| 7 | 기억 비동기 갱신 | 통역 후 `waitUntil`로 요약 추출·저장 | 배포됨 | `buildMemoryUpdatePrompt` + `/translate` waitUntil |
| 8 | 개선활동 + 피드백 루프 | 4모드 출력 `improvement` → 3단 피드백 → 재해석 | 배포됨 | `buildFeedbackPrompt`, `POST /feedback` |
| 9 | 성공 공식 축적 | `reaction=positive`면 `successPatterns`에 누적(최근 10) | 배포됨 | `/feedback` waitUntil |
| 10 | 커뮤니티 + AI 사전 검수 | 검수 통과분만 저장, 거부 시 사유+수정제안 | 배포됨 | `buildModerationPrompt`, `POST /community/post` |
| 11 | 위기 글 보호 분기 | `category='crisis'` → 삭제 아닌 `crisis_support` 안내 | 배포됨 | `/community/post` + 프론트 `blocked.crisis_support` |
| 12 | 공감 반응(🤍) | 카운트 **표시만** — 증가 API 없음 | 설계만 | `community_posts.empathy_count` (증가 엔드포인트 부재) |
| 13 | 멀티모달 동의 게이트 | 요청·수락·철회 3종, 대리 동의 차단 | 배포됨 | `/consent/request·accept·revoke` |
| 14 | 온디바이스 비언어 분석 | face-api.js 표정 + WebAudio 어조, **원본 미전송** | 배포됨 | `bubu_hub.jsx` `Multimodal`·`loadFaceApi` |
| 15 | 선택적 공유 브리지 | 4종 항목 건별 공유 + 미리보기 1회 | 배포됨 | `/share/send·inbox·respond` |
| 16 | 공유 철회(수신 측 제거) | ADDENDUM 1.4-4 요구. 삭제 API 없음 | 설계만 | — |
| 17 | 배우자 초대 연결 | 6자 코드(혼동문자 제외), KV 7일 | 배포됨 | `/relation/invite·join`, `genInviteCode()` |
| 18 | 성인 연령 게이트 | 만 19세 미만 차단, KV `bubu_adult:{uid}` | 배포됨 | `POST /age/verify`, `AgeGate` |
| 19 | 크레딧 차감·환불 | 수신·발신 2cr / 중재·관점 3cr, 실패 시 환불 | 배포됨 | `spendCredits`/`refundCredits` |
| 20 | 무료 체험 3회 | KV `bubu_free_used:{uid}` 카운터, 소진 후 유료 | 배포됨 | `/translate` `FREE_QUOTA=3` |
| 21 | AI egress 프록시 | `AI_PROXY_URL` 설정 시 우회, 미설정 시 AI Gateway | 구현·미배포(⚠️ 미확인) | `callClaude()` |
| 22 | 케이스뱅크 회귀검증 | BATCH_01 6케이스 실 API 재현 | 보류 | 케이스뱅크 자료 대기 |
| 23 | 양방향 실시간 동기화 | 동시 세션·커플 대시보드 | 보류 | 출시 후 항목(SPEC 8.2) |
| 24 | 상담사 마켓플레이스 | 유료 세션 예약 | 보류 | 출시 후 항목 |
| 25 | 연동형 유료결제 | 마음풀 상점 부부 상품 → 내부 크레딧 지급 | 설계만(착수 금지) | 마음풀 측 상품 3종(`bubu_pack10/20/40`)은 **이미 코드에 존재** — §10. 부부 워커 측 신규 코드 없음 |

## 5. 아키텍처
- **스택**: Cloudflare Workers(TypeScript) + Hono 4.11 + D1 + KV + React 18(UMD CDN) + esbuild 사전컴파일 + Anthropic Claude.
- **워커명 / 도메인**: `maumbubu` / `bubu.maumful.com` (`routes`에 `custom_domain = true`, DNS CNAME 자동). 계정 `limyj007`(313b6305…).
- **프론트 빌드 방식**: `npm run build:jsx` → esbuild가 `public/static/bubu_hub.jsx` → `public/static/compiled/bubu_hub.js`(번들 아님, JSX 변환만). `public/index.html`에서 `?v=N` 캐시버전으로 로드(현재 `v=9`). `[assets] directory = "./public"`로 워커가 정적 서빙.
- **외부 API**: Anthropic Messages API — **반드시 Cloudflare AI Gateway 경유**(`gateway.ai.cloudflare.com/v1/313b6305…/maumful/anthropic/v1/messages`). 직접 `api.anthropic.com` 호출은 Workers egress에서 **403 unsupported_country**. 모델 `claude-sonnet-4-6`(마음풀과 통일). CDN: `unpkg.com`(React), face-api.js(표정 분석).
- **구성도**:
```
[마음풀 maumful.com] --GET /api/bubu-token(type:'bubu',7d)--> ?t=
        |                                                     |
        | (공유) maumful-db · KV · JWT_SECRET · users.credits  v
        |                                    [bubu.maumful.com / worker: maumbubu]
        |                                     index.ts (CORS + /health + app.route('/api'))
        |                                          |
        |                                     translate-route.ts
        |                                       ├ 인증 미들웨어(Bearer | ?t=) → c.set('uid')
        |                                       ├ /translate  → buildTranslationPrompt() ─┐
        |                                       ├ /feedback   → buildFeedbackPrompt()     │
        |                                       ├ /community  → buildModerationPrompt()   │
        |                                       ├ /consent/*  /share/*  /relation/*       │
        |                                       └ /memory  /age/verify                    │
        v                                                                                 v
  [D1 maumful-db]  <- 크레딧·기억·로그·공유·안전플래그          [AI Gateway] → Anthropic claude-sonnet-4-6
  [KV 9f74…]       <- JWT_SECRET · consent_pending · bubu_invite · bubu_adult · bubu_free_used
```

## 6. 데이터 모델 (D1)
> 전부 **기존 `maumful-db`에 ADD만**. 신규 D1 생성 없음(계정 D1 10개 한도와 무관).

| 테이블 | 용도 | 주요 컬럼 | 비고 |
|---|---|---|---|
| `couple_relations` | 부부 관계 | `id` · `user_a_id` · `user_b_id`(NULL 허용) · `created_at` | **혼자 사용 가능** 설계. 0001 |
| `relation_memory` | **구** 관계 기억 | `relation_id` PK | ⚠️ **보존만 — 삭제 금지.** 코드는 읽지 않음 |
| `relation_memory_v2` | 관계 기억(현행) | **PK(`relation_id`,`user_id`)** · `recurring_topics` · `psychology_profile` · `christian_profile` · `success_patterns` · `partner_perspective` | 0003. §11 핵심 |
| `consent_sessions` | 멀티모달 동의 세션 | `id`(코드) · `requester_id` · `consenter_id` · `media_type` · `status`(pending/active/revoked/expired) | 0001 |
| `translation_logs` | 사용 로그 | `relation_id` · `track` · `mode` | ⚠️ **원문·결과 미저장.** user_id 컬럼 없음 |
| `activity_log` | 활동 피드백 | `relation_id` · `activity` · `status` · `reaction` | ⚠️ 자유서술 `note` **미저장** |
| `community_posts` | 커뮤니티 | `author_hash` · `room` · `content` · `status` · `empathy_count` | ⚠️ **user_id 직접 저장 금지** |
| `shared_items` | 선택적 공유 | `id`(랜덤 18hex) · `relation_id` · `sender_id` · `item_type` · `payload`(JSON) · `status`(sent/viewed/accepted) | 0002 |
| `relation_safety` | 안전 플래그 | `relation_id` · `tier`(T1/T2) · `created_at` | 0002. 공유 차단 근거 |
| `users` / `credit_transactions` | **마음풀 공유 테이블** | `credits` 원자적 차감·거래 기록 | 마음부부가 생성하지 않음 |

- 마이그레이션 파일 수: **3개** (`0001_maumbubu.sql`·`0002_share.sql`·`0003_memory_user_split.sql`). 적용은 `npx wrangler d1 execute maumful-db --remote --file=…`.
- 다른 서비스와 공유하는 테이블: `users`, `credit_transactions` (마음풀 본체 소유). D1·KV 인스턴스 자체가 생태계 공유.
- KV 키: `JWT_SECRET`(읽기) · `consent_pending:{code}`(TTL 24h) · `bubu_invite:{code}`(TTL 7d) · `bubu_adult:{uid}`(생년월일) · `bubu_free_used:{uid}`(무료 횟수).

## 7. API 계약
> 모든 `/api/*` 라우트에 인증 미들웨어 적용(공개 라우트는 `/health`뿐). 인증 실패 401.

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/health` | 불필요 | 헬스체크 `{ok:true, service:'maumbubu'}` |
| POST | `/api/translate` | 필수 | 통역 실행. 입력 8,000자 제한. 크레딧 2~3(무료 3회 후). 402=크레딧 부족 |
| POST | `/api/feedback` | 필수 | 활동 피드백 → 재해석 응답 + 성공공식 축적. 무료 |
| POST | `/api/community/post` | 필수 | 사전 검수 후 게시. 3,000자 제한. 거부 시 `{blocked, category, message, suggested_fix}` |
| GET | `/api/community/posts?room=&limit=` | 필수 | 주제방 글 목록(최신순, limit≤50) |
| POST | `/api/consent/request` | 필수 | 동의 코드 발급(8자리, 24h) |
| POST | `/api/consent/accept` | 필수 | 배우자 동의 수락. **요청자 본인이면 403** |
| POST | `/api/consent/revoke` | 필수 | 동의 철회(세션 당사자 양쪽 모두 가능) |
| GET | `/api/memory?relationId=` | 필수 | **내 기억만** 반환. 배우자가 조회하면 `memory:null` |
| POST | `/api/relation` | 필수 | 내 관계 get-or-create + `adult` 플래그 |
| POST | `/api/age/verify` | 필수 | 만 19세 확인 → KV 플래그. 미만이면 `{ok:false, minor:true}` |
| POST | `/api/relation/invite` | 필수 | 배우자 초대코드 6자 발급(7일) |
| POST | `/api/relation/join` | 필수 | 코드로 user_b 연결(본인 초대 400, 이미 연결 409) |
| POST | `/api/share/send` | 필수 | 승인 항목 건별 공유. **T1/T2 relation은 403** |
| GET | `/api/share/inbox?relationId=&peek=1` | 필수 | 받은 공유(최대 50). `peek=1`이면 읽음 처리 안 함 |
| POST | `/api/share/respond` | 필수 | 활동 제안 수락(`action:'accepted'`) |

- 공통 가드: `assertRelationOwner()` — relationId가 내 관계인지 확인(아니면 403). **`/share/respond`에는 이 가드가 없다**(§15).
- 상태코드: 400 입력 오류 / 401 미인증 / 402 크레딧 부족 / 403 권한·안전 차단 / 404 코드 만료 / 409 중복 연결 / 502 AI 응답 파싱 실패 / 500 기타.

## 8. 인증 / 세션
- **인증 방식**: 마음풀 계정 단일. 마음부부 자체 회원가입·로그인 **없음**. 마음풀에서 발급한 JWT를 `?t=`로 넘겨받아 `localStorage['bubu_token']`에 저장하고, 이후 모든 호출에 `Authorization: Bearer …`를 붙인다(`bubu_hub.jsx` `api()`).
- **토큰 구조**: `{ sub: userId, type: 'bubu', iat, exp }` — HMAC-SHA256, **7일**(`maumful-main/src/index.tsx` `GET /api/bubu-token`). 서명·검증 모두 `crypto.subtle`(마음 생태계 공통 규칙: `btoa()` 직접 사용 금지, exp는 초 단위).
- **검증**: `verifyJWT()`가 **공유 KV의 `JWT_SECRET`을 먼저 읽고**(`c.env.KV.get('JWT_SECRET')`), 없으면 워커 시크릿으로 폴백 → 워커에 별도 secret 등록이 필수는 아니다. 허용 타입은 **`['bubu','couple']`** — 마음커플 토큰으로도 들어올 수 있다.
- **uid 취득**: 미들웨어가 `c.set('uid', …)`. ⚠️ **모든 사용자 식별은 body가 아니라 JWT에서 파생**한다(요청자·동의자·공유 발신자·기억 소유자 전부). `waitUntil` 클로저에서 쓸 땐 uid를 미리 캡처(`/feedback` 참조).
- **SSO 연동 위치**(CLAUDE.md): 마음풀 `src/index.tsx`(`/api/bubu-token`) · `app.jsx` GlobalNav(`openMaumBubu`) · `landing.jsx` navItems(`isBubu` 분기). ⚠️ 프론트 헬퍼는 **사용 컴포넌트 스코프에 정의**할 것(render_smoke 필수).
- **CORS**: `https://bubu.maumful.com` · `https://maumful.com` · `https://couple.maumful.com`만 허용. Bearer 방식이라 credentials 불필요.
- **세션 상태**: 서버 세션 없음. 프론트 상태는 `localStorage`의 `bubu_token`·`bubu_config`(트랙·슬라이더), 서버 상태는 D1/KV.

## 9. 외부 연동
| 대상 | 용도 | 키/시크릿명 | 상태 |
|---|---|---|---|
| Anthropic (via Cloudflare AI Gateway) | 통역·기억요약·피드백·검수 전부 | `ANTHROPIC_API_KEY` (워커 secret) | 배포됨 |
| AI egress 프록시 | 전용 IP 경유(공유 Worker IP 차단 회피) | `AI_PROXY_URL` (env, 선택) | ⚠️ 미확인 — 실제 설정 여부는 코드로 확인 불가. 미설정 시 AI Gateway 폴백 |
| 마음풀(maumful) | SSO 토큰 발급 · 계정 · 크레딧 · 상점 | 공유 KV `JWT_SECRET`, 공유 D1 `users` | 배포됨 |
| unpkg CDN | React 18 UMD | — | 배포됨 |
| face-api.js (CDN) | 온디바이스 표정 분석(지연 로드) | — | 배포됨 |
| 토스페이먼츠 | 연동형 유료결제 | — | 보류 (토스 실결제 반영 후 착수) |

## 10. 과금 / 수익 모델
- **과금 구조**: 마음풀 `users.credits` 공유 차감. **무료 체험 3회**(`FREE_QUOTA=3`, KV `bubu_free_used:{uid}`) 후 유료 전환(프리미엄 전략). 크레딧 부족 시 402 + `needPurchase:true` → 프론트가 "마음풀에서 구매" 안내.
- **상품·가격**: 모드별 크레딧 — **수신 2 / 발신 2 / 중재 3 / 관점 3**. 피드백·커뮤니티·기억 조회·공유는 **무료(0)**. 원화 가격은 마음풀 상점 소관(이 레포에 없음) — ⚠️ 미확인.
- **결제 수단**: 마음부부 자체 결제 없음. 마음풀 결제(토스페이먼츠) 경유.
- **크레딧·구독 처리**: `spendCredits()`가 `UPDATE … WHERE credits >= ?`로 **원자적 차감** 후 `credit_transactions` 기록. **Claude 호출 실패·JSON 파싱 실패 시 `refundCredits()`로 전액 환불**(차감은 게이트 통과 후 Claude 호출 직전에 수행).
- **연동형 유료결제(설계 완료·착수 대기)**: 부부 유료는 마음풀 상점에서 **부부 상품 카드 → 내부 maumful 크레딧 지급**(하이브리드, 별도 테이블 없음). ⚠️ **토스 실결제 반영 전까지 관련 코드 커밋·푸시·배포 금지.**
  - **부부 상품 3종은 이미 마음풀 코드에 실재한다**(코드에서 복원 · 근거: `maumful-main/src/index.tsx` `PACKAGES` L3136~L3138 · 표시용 `public/static/app.jsx` `PACKAGES_KR` L6026~L6028 · 상품 그룹 `SERVICE_GROUPS` L6059):

    | 상품 키 | 지급 크레딧 | 가격 | 표기 | 단가 |
    |---|---|---|---|---|
    | `bubu_pack10` | 25 | 3,300원 | 마음부부 통역 10회팩(라이트) | 132원/cr · 회당 330원 |
    | `bubu_pack20` | 50 | 4,900원 | 마음부부 통역 20회팩(스탠다드) — 배지 "인기" | 98원/cr · 회당 245원(26%↓) |
    | `bubu_pack40` | 100 | 8,900원 | 마음부부 통역 40회팩(프로) — 배지 "알뜰" | 89원/cr · 회당 222원(33%↓) |

  - **가격 산정 근거가 코드 주석에 남아 있다**(index.tsx L3133~L3135): "*프리미엄 포지셔닝(2026-07-18): 저가 지양. 부부·세대는 통역이 maumful 크레딧을 쓴다(세대는 성인만)*", "*3단계 회차팩(공용 크레딧 곡선 단조감소: 132→98→89 /cr). 회당 평균 2.5cr → 10/20/40회*". 즉 4모드 평균 2.5cr(수신·발신 2 / 중재·관점 3)로 회수를 역산한 표다.
  - 부부 상품에는 `service`·`grantType` 필드가 **없다** — 수달·곁(`credits:0` + `service`/`grantType`)과 달리 외부 grant를 받지 않고 마음풀 `users.credits` 를 그대로 쓰는 **내부 크레딧형**이다. 그래서 부부 워커에 추가할 결제 코드가 없다(코드에서 복원 · 근거: index.tsx L3118 `PACKAGES` 타입 정의 · L3143~L3148).
  - **루트 `CLAUDE.md` 「연동형 유료결제 (통합결제) — 설계 완료·착수 대기」 원문**:
    > 수달·곁·부부 유료결제를 **마음풀에서 상품으로 판매 → 결제내역을 각 서비스로 자동 전달(grant)** 하는 방식. **사용자 지시 있을 때만 착수**하며, **토스페이먼츠 완전 반영 전까지 관련 코드는 커밋·푸시·배포 금지**(설계·로컬 준비만).
    > - **결제 표기 = 하이브리드**(내부 크레딧, 겉은 명명 상품 — 선불충전금/PG 기피 회피). 마음풀·부부는 이미 이 구조. 수달·곁은 별도 생태계라 `applyGrant`(sub/pack)로 지급.
    > - **전달 = A안(서명 grant API)**: 마음풀 결제성공 → 대상 서비스 `POST /api/grant`(HMAC=MAUM_SSO_SECRET, `{email,grantType,orderId}`) → email로 maum-auth 계정 조회/생성 → `applyGrant`. 멱등·환불 revoke·선지급 재시도 포함.
    > - 사업자 단일(마음서비스)이라 결제대행 규제 무관. 수달·곁 앱은 당분간 없음.
  - ⚠️ **확장 범위·착수 조건·DB/API 계약 검증 절차**는 외부 메모리 `project_maum_unified_payment` 에만 존재 — 코드로 복원 불가. 코드가 말해 주는 것은 "부부는 이미 하이브리드 구조라 추가 계약이 필요 없다"까지다.

## 11. 안전 · 윤리 · 법적 제약
> **이 서비스에서 가장 중요한 섹션.** 아래 4개 블록은 `maumbubu/CLAUDE.md`의 규칙을 **원문 인용**하고 코드상 구현 위치를 붙인 것이다. 요약·완화·축약 금지.

### 11.1 ⚠️ 안전 오버라이드 — 분리 보호 3단계 (절대 완화·축약 금지)

**CLAUDE.md 원문:**
> ## ⚠️ 안전 오버라이드 — 분리 보호 3단계 (절대 완화·축약 금지)
> `translation-prompts.ts` SAFETY_OVERRIDE는 **모든 통역 시스템 프롬프트에 상시 포함**.
> - **T1 즉시분리**(신체·성적학대·생명위협): 통역·회복활동 전면중단 + 긴급자원(112/1366/1388/1577-1389/**109**).
> - **자해·자살 신호 → 자살예방 상담전화 109(24시간)** (ADDENDUM 02 §2). 프롬프트 3곳(기타 위기신호·T1 자원·safety 스키마 `resources`) + 프론트 2곳(온보딩 안전고지·커뮤니티 `crisis_support`). ⚠️ **안전 규칙은 마음부부↔파생앱(마음세대) 동일 반영** — 버전 분기 금지.
> - **T2 지속학대**(반복 정서학대·강압통제): 상대에 다가가는 활동 금지 → 자기보호만.
> - **T3 일반갈등**: 통상 통역 + 회복레이어.
> - 안전 발동(T1/T2) 시 **모드별 JSON 대신 안전 스키마**(`safety_tier·response·reframe·protect_actions·resources·door_open`) 출력 → 프론트 `SafetyScreen`으로 분기(공유·활동·커뮤니티 버튼 미노출·기관 tel:링크). `/translate`가 `relation_safety` 기록.
> - 절대금지: 죄책감 유발·학대 정당화·기독교 트랙 공경/용서로 학대 수인 권유.

**프롬프트 원문 (`src/translation-prompts.ts:105-142` `SAFETY_OVERRIDE`) — 발췌 인용:**
> ## ⚠️ 안전 오버라이드 (최상위 규칙 — 트랙·슬라이더 설정보다 우선)
> ### 분리 보호 3단계 기준 (한국 법 기반: 아동복지법·아동학대처벌법·민법 924조·가정폭력처벌법·노인복지법)
> 이 엔진의 기본 전제는 '관계 회복'이지만, 학대 상황에서는 그 전제가 뒤집힌다. 법은 분리를 명시적으로 지지한다(격리·접근금지·보호명령·친권 상실). 아래 기준을 반드시 따른다.
>
> **[T1] 즉시 분리 신호 — 통역·회복 활동 전면 중단**
> 신호: 신체 폭력(구타·물건 던짐·감금), 성적 학대, 생명 위협, 심각한 방임(의식주·의료 박탈)
> → 동작: 통역하지 않는다. "지금은 관계를 이해할 때가 아니라 안전을 확보할 때"임을 명시하고, 즉시 안내한다: 긴급 112 / 청소년상담전화 1388 / 여성긴급전화 1366 / 노인보호전문기관 1577-1389 / 자살예방 상담전화 109(24시간). 분리·신고·보호명령이 법이 보장하는 권리임을 알린다.
> → ⚠️ **안전 하한선(불변)**: 명백한 신체 폭력·생명 위협·성적 학대는 **1회성인지 반복인지 확인하지 않고 즉시** 발동한다. "사고인지 일상인지 확인" 같은 신중 규칙(T2)을 여기에 적용해 대응을 늦추지 않는다. 안전 확보가 우선이며, 반복성 파악은 안전 안내 이후의 문제다.
>
> **[T2] 지속적 학대 패턴 — 회복 권유 중단, 거리두기 지지**
> 신호: 반복적 정서 학대(모욕·위협·비하), 강압적 통제(감시·경제적 통제·고립), 가스라이팅 패턴
> → 동작: 상대에게 다가가는 회복 활동을 제안하지 않는다. 대신 ① 자책 해소("당신 잘못이 아닙니다") ② 거리두기의 정당화("거리를 두는 것도 건강한 선택이며, 법도 이를 지지합니다") ③ 자기 보호 활동(상황 기록, 경계 설정, 신뢰할 수 있는 사람·전문가 연결)만 제안한다.
> → **발동 신중(과발동 방지)**: T2는 **반복성·패턴**이 핵심이다. 통제·강압이 **구체적 대화나 근거**로 드러날 때 발동하고, 막연한 인상(느낌만)으로 과발동하지 않는다. **1회성 사건인지 일상적(반복) 패턴인지 불명확하면**, T2로 확정하기 전에 통역 대신 **부드러운 확인 질문 하나**로 빈도·구체성을 먼저 파악한다(…). 확인 뒤에도 정보성 안내(왜 지금 이 수위인지 짧게)를 곁들여 T2/T3의 차이를 이해하게 한다.
> → ⚠️ **이 신중 규칙은 T2·모호한 경계 사례에만 적용된다. 아래 T1(신체 폭력·생명 위협)에는 적용하지 않는다** — 명백한 T1 신호는 확인 절차 없이 즉시 중단·안내한다(안전 하한선).
>
> **[T3] 일반 갈등 — 통상 통역 + 회복 레이어 적용**
>
> ### 절대 금지 (T1·T2 공통, 어떤 트랙·슬라이더도 이를 무력화할 수 없음)
> - 사용자에게 죄책감을 유발하는 출력: "그래도 부모님인데", "네가 이해하면", "가족이니까 참아야" 류 전면 금지.
> - 학대 가해자의 행동을 '마음의 신호'로 통역해 정당화하는 것.
> - 기독교 트랙: 공경(제5계명)·용서·인내의 언어로 학대 수인을 권하는 것. 공경은 학대를 견딜 의무가 아니며, 안전한 거리에서의 공경도 공경이다. "성경은 학대를 견디라 하지 않습니다"를 명시한다.
>
> ### 기타 위기 신호
> 1. **자해·자살 위기 신호** → 통역을 멈추고 위기 자원을 안내합니다: 자살예방 상담전화 109 (24시간). 구체적 방법은 절대 언급하지 않으며, 혼자 견디지 않아도 된다는 메시지를 함께 전합니다.
> 2. **정신과적 질환 의심**(…) → 의료 상담을 권합니다. 마음의 문제나 죄의 문제로만 환원하지 않습니다.
> 3. **상대 몰래 녹음·감시 시도** → 거부하고 쌍방 동의 원칙을 안내합니다.
> 4. **"상대의 잘못/죄를 지적해달라"는 요청** → 거부. 통역은 이해의 도구이지 공격의 도구가 아님을 설명합니다.

**코드상 구현 위치:**
| 지점 | 위치 |
|---|---|
| SAFETY_OVERRIDE 본문 | `src/translation-prompts.ts:105-142` |
| **상시 포함 보장** — 조립 배열의 마지막에서 두 번째, 조건문 없음 | `buildTranslationPrompt()` `sections` 배열 (`:419-430`). 주석: *"안전(마지막 = 최신 우선순위)"* |
| 안전 응답 스키마 정의 | `translation-prompts.ts:134-142` (`safety_tier`·`response`·`reframe`·`protect_actions`·`resources`·`door_open`) |
| `safety_tier` 감지 → `relation_safety` 기록 | `translate-route.ts:426-431` (`waitUntil`) |
| 프론트 분기 | `bubu_hub.jsx` `SafetyScreen` (`:312`), 호출부 `ModeView`(`:455`) · `Multimodal`(`:725`) |
| 기관 `tel:` 링크 | `SafetyScreen` 내 정규식 `1577-1389|1\d{3}|1\d{2}` → `tel:` |
| 109 — 온보딩 안전고지 | `Onboarding` step 2 안내 카드 |
| 109 — 커뮤니티 위기 분기 | `Community` `blocked.crisis_support` 블록 + `tel:109` |
| 피드백 자유서술의 위기 감지 | `buildFeedbackPrompt()` `## 안전` 절 |
| 커뮤니티 `crisis` 카테고리 보호 분기 | `translate-route.ts:701-709` (삭제 아닌 지원 안내) |

⚠️ **버전 분기 금지**: 안전 규칙 수정 시 **마음부부와 마음세대(maumsedae) 양쪽에 동일 반영**(양쪽 CLAUDE.md 명시).

### 11.2 ⚠️ 관계 기억은 (relation_id, user_id) 복합키 — 절대 되돌리지 말 것

**CLAUDE.md 원문:**
> ## ⚠️ 관계 기억은 (relation_id, user_id) 복합키 (ADDENDUM 02 §1 — 절대 되돌리지 말 것)
> `relation_memory_v2`(migration 0003). **기억의 소유자 = 통역을 실행한 사용자.**
> - ⚠️ **`loadMemory`/`saveMemory`에서 userId를 빼면 배우자의 기억이 내 통역 프롬프트에 주입된다** — "수신 통역결과 공유 금지"를 데이터 층에서 위반. 공유 브리지로 배우자가 가입하는 순간부터 실제 발생하는 결함이었다(2026-07-17 수정).
> - **userId는 반드시 JWT(`c.get('uid')`)에서** 파생 — body로 받으면 타인 기억 조회 가능. `waitUntil` 클로저에서 쓸 땐 uid를 미리 캡처.
> - 구 `relation_memory` 테이블은 **보존**(삭제 금지). 코드는 v2만 바라본다.
> - 검증 기준: 같은 relation의 배우자가 `GET /api/memory` 하면 **`memory: null`**(내 기억 미노출).

**코드상 구현 위치:**
- 스키마: `migrations/0003_memory_user_split.sql` — `PRIMARY KEY (relation_id, user_id)` + 기존 데이터를 `user_a_id` 소유로 이관하는 `INSERT OR IGNORE … SELECT`. 구 테이블은 `DROP` 없음.
- `loadMemory(db, relationId, userId)` — `translate-route.ts:249` (`WHERE relation_id = ? AND user_id = ?`), 경고 주석 `:246-248`.
- `saveMemory(db, relationId, userId, mem)` — `:269` (`ON CONFLICT(relation_id, user_id) DO UPDATE`).
- uid 파생: `/translate:378` · `/feedback:617`(waitUntil용 사전 캡처) · `/memory:762`.
- 열람 가드: `GET /api/memory`는 `assertRelationOwner` 통과 후에도 **요청자 본인 기억만** 반환(`:767-769`).
- 통역 프롬프트 주입 지점: `memoryModule(config.memory, track)` — 트랙별로 `psychologyProfile`/`christianProfile`만 선택 주입.
- ⚠️ ADDENDUM 02 문서 파일 자체는 이 레포에 없다(`maumbubu-dev/`에는 ADDENDUM01만 존재) — 내용은 CLAUDE.md·마이그레이션 주석·커밋 `2b648be`로만 확인됨. **⚠️ 미확인 / 원본 문서 보관 필요.**

### 11.3 선택적 공유 브리지 (ADDENDUM 01 §1)

**CLAUDE.md 원문:**
> ## 선택적 공유 브리지 (ADDENDUM 01 §1)
> - **공유 가능(이것만)**: 발신 다듬은문장 · 중재/관점 함께보기 · 개선활동('같이 해볼래?'). **절대 공유 금지**: 수신 통역결과·통역 이력·관계기억·활동 피드백.
> - **T1/T2 안전 relation은 `/share/send` 403 차단**(가해자 흔적 방지, `hasRecentSafety` 30일). 자동/기본 공유 없음 — 건별 명시 + **미리보기 확인 1회** 필수.
> - 배우자 연결 = **마음커플 `genSessionCode` 패턴**(6자·혼동문자 제외 초대코드·KV `bubu_invite:CODE`). 수신함 GET은 열람 시 viewed 처리(뱃지 카운트는 `?peek=1`로 읽음처리 회피).
> - 엔드포인트: `/share/send·inbox·respond`, `/relation/invite·join`. 테이블: `shared_items`·`relation_safety`(migration 0002).

**코드상 구현 위치:**
- 허용 목록: `const SHARE_TYPES = ['message','mediate_view','perspective_view','activity_invite']` (`translate-route.ts:820`) — 목록 밖은 400. **수신 통역(`receive`) 결과에는 프론트에 공유 버튼 자체가 없다**(`ModeView`는 `send`/`mediate`/`perspective`에만 `Share` 렌더).
- 안전 차단: `hasRecentSafety()` (`:828`) — `relation_safety`에 **30일 이내** 기록이 있으면 `/share/send`가 `{blockedBySafety:true}` 403.
- 미리보기 강제: `Share` 컴포넌트가 모달로 *"배우자에게 이렇게 보여요"*를 띄우고, **모달의 [보내기]에서만** `/share/send` 호출.
- 초대코드: `CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'`(I·O·0·1 제외) 6자, KV `bubu_invite:{code}` TTL 7일.
- 수신함: `sender_id != uid` 필터(내가 보낸 건 안 보임), `peek=1`이면 `viewed` 갱신 생략.
- ⚠️ ADDENDUM 1.4-4의 **"발신자가 공유 항목 삭제 시 수신 측에서도 제거"는 미구현**(삭제 엔드포인트 없음). ADDENDUM 1.3의 `inviteUrl` 응답도 없고 `linked` 불리언으로 대체됨(§15).

### 11.4 성인 연령 게이트 (ADDENDUM 01 §3)

**CLAUDE.md 원문:**
> ## 성인 연령 게이트 (ADDENDUM 01 §3)
> - 온보딩 전 `AgeGate`(생년월일) → `/api/age/verify`(만나이 계산·만19세 미만 차단) → KV `bubu_adult:{uid}` 저장. `/relation` 응답 `adult` 플래그로 게이트 판단.
> - maumful 계정 공유라 생년월일은 **maumbubu KV에 저장**(users 스키마 무변경).

**코드상 구현 위치:** `POST /api/age/verify` (`translate-route.ts:800-815`) — `YYYY-MM-DD` 정규식 검증, UTC 기준 만나이 계산, 1900년 이전·0~120 범위 밖 400, **만 19세 미만은 `{ok:false, minor:true}`로 차단**(KV 미저장). 통과 시 `KV.put('bubu_adult:{uid}', birthDate)`. 프론트 `AgeGate`(`bubu_hub.jsx:795`)는 `App` 라우터에서 **온보딩보다 먼저** 걸린다(`:872`).

### 11.5 유지 원칙 (코드 구현됨, 제거 금지)

**CLAUDE.md 원문:**
> ## 유지 원칙 (코드 구현됨, 제거 금지)
> - 안전 오버라이드 상시 · 동의 없는 멀티모달 데이터 프롬프트 주입 차단 · **원문 미저장**(translation_logs엔 track/mode만·activity note 미저장) · 동의 수락은 대상 본인만(대리동의 차단) · 동의 철회 양쪽 즉시 · 커뮤니티 **사전검수만**(사후삭제 아님)·거부 시 사유+수정제안·**author_hash만 저장**(user_id 금지) · 모든 출력 가설 어법.

| 원칙 | 구현 위치 |
|---|---|
| 동의 없는 멀티모달 주입 차단 | `verifyConsentSession()`(`status='active'` + relation 일치) → 실패 시 **403 반환**(`/translate:362-375`). 추가로 `multimodalModule()`이 `consentSessionId` 없으면 빈 문자열 반환(이중 차단) |
| 원문 미저장 | `INSERT INTO translation_logs (relation_id, track, mode)` — 입력·결과 컬럼 자체가 없음 |
| 활동 자유서술 미저장 | `INSERT INTO activity_log (relation_id, activity, status, reaction)` — `note`는 프롬프트에만 전달 |
| 대리 동의 차단 | `/consent/accept`: `session.requester_id === consenterId`면 403 |
| 철회 양쪽 즉시 | `/consent/revoke`: requester·consenter 모두 허용, `status='revoked'` 즉시 반영 |
| 커뮤니티 사전 검수만 | `/community/post`: 검수 통과분만 `INSERT`. **검수 파싱 실패 시 502로 게시 보류**(안전 우선) |
| 거부 시 사유+수정제안 | 응답에 `message`·`problem_parts`·`suggested_fix` → 프론트 [수정하기] 흐름 |
| author_hash만 저장 | `hashAuthor(uid)` = SHA-256(`'bubu:'+uid`) 앞 24자. **서버에서 생성**(위조 차단) |
| 가설 어법 강제 | `COMMON_PREAMBLE` 단정 금지 + 조립 마지막 `## 출력 규칙` |

### 11.6 멀티모달 · 법적 근거
- 동의 게이트 3원칙(SPEC 5.2): ① 동의 없이는 캡처 버튼 자체가 비활성 — "일단 녹음 후 나중에 동의"는 불가 ② 동의는 **세션 단위**이며 언제든 철회 ③ **동의 주체 = 녹음 대상 본인**, 대리 동의 불가.
- **법적 근거(한국)**: 통신비밀보호법상 제3자의 몰래 녹음은 불법이나, **부부가 상호 동의한 '자신들의 대화' 녹음은 합법 영역**. 동의 게이트가 이 요건(쌍방·명시적·자기 대화)을 시스템으로 강제한다. 생체·음성·영상은 민감정보이므로 동의 고지에 수집 항목·목적·보관기간·삭제권을 명시.
- **원본 처리**: 현행 구현은 **온디바이스 분석**이다 — face-api.js 표정 카운트와 WebAudio 볼륨 통계만 뽑아 **요약 문자열**(`toneAnalysis`·`visualCues`)을 서버로 보내고, 스트림은 `cleanup()`에서 트랙 stop으로 폐기한다. 서버·D1에 원본 음성·영상은 **저장되지 않는다**. 프론트 문구: *"기기 안에서만 분석 중… (원본은 저장·전송되지 않아요)"*.
- 비언어 판정도 **가설 어법 강제**: `multimodalModule()`이 *"경멸하고 있다 ❌ → 이 한숨은 … 신호일 수도 있어요 ⭕"*를 프롬프트에 명시.

### 11.7 기독교 상담사 감수 (`review/BATCH_01.md`, 2026-07-16, 6/6 완료)
| 원칙 | 내용 | 반영 여부 |
|---|---|---|
| **P1 공감 우선** | "이용자는 지금 힘들어서 온 사람이다. 상대 말의 통역·해결 활동보다 먼저, 이용자 본인의 상황과 감정을 공감하는 것에서 출발한다." 단, **공감은 편들기가 아니다** | **반영됨** — `COMMON_PREAMBLE` "공감 우선 (최우선 순서)" + 4모드 전체 `your_feeling_first` 필드 + 프론트 라벨 "먼저, 당신의 마음" (커밋 `8777bf5`) |
| **P2 중재 톤** | "중재는 한쪽이 양보·굽히는 것으로 읽혀선 안 된다. 서로를 이해하는 프레임을 유지한다." 기독교 트랙은 '한몸' 같은 단일 표현으로 신앙 근거를 얇게 대지 않는다 | **반영됨** — `mediate` 모듈 절대원칙 3번, `christianTrackModule()` "신앙 근거의 깊이(얇게 대지 않기)" 절 |
| **P3 위기 발동 신중** | "위기 티어 발동은 구체적 근거와 반복성 확인 위에서 한다. **단, 명백한 신체 폭력·생명 위협(T1)은 즉시 대응을 절대 약화하지 않는다**" | **반영됨** — T2 "발동 신중(과발동 방지)" + T1 "안전 하한선(불변)" 이중 명시 |
- 감수 미결(별도 승인 필요): P1을 스키마 필드로 할지 전역 톤으로 할지 → **스키마 필드(`your_feeling_first`)로 결정·구현됨**. P3 위기 기준 조정은 안전 민감 영역 — T1 하한선 불변 범위 안에서만.
- **미이행**: BATCH_01 6케이스를 실제 API로 돌려 출력 구조를 재확인하는 **회귀검증**(케이스뱅크 자료 대기, §14).

### 11.8 기독교 트랙 고유 위험 4종 (SPEC 9.3)
| 위험 | 엔진 규칙 | 구현 |
|---|---|---|
| '죄' 프레임의 무기화 | 죄·우상 렌즈는 **자기 성찰용으로만**. 배우자 정죄 출력 금지, "배우자 죄 지적" 요청 거부 | `christianTrackModule()` 절대금지 1번 + SAFETY_OVERRIDE 기타 위기 4번 |
| 학대에 인내·복종·용서 강요 | 폭력·강압 신호 시 성경 언어 즉시 중단. "성경은 학대를 견디라 하지 않습니다" 명시 | SAFETY_OVERRIDE 절대금지 3번 |
| 교단·신학 차이 침범 | 이혼·재혼·성역할 등 논쟁 교리는 단정 않고 **담임목회자에게 위임** | `christianTrackModule()` 절대금지 4번 |
| 목회적 돌봄 대체 착각 | 통역은 교회 공동체·목회 상담으로 잇는 **다리**이지 대체가 아님 | 트랙 모듈 헌법절 + 온보딩 고지("의료·상담을 대체하지 않는 통역 도구") |

## 12. 운영
- **배포 절차** (CLAUDE.md 원문 기준):
```bash
npm run build:jsx                                   # bubu_hub.jsx → compiled/bubu_hub.js (esbuild)
npx tsc --noEmit                                    # 타입 검증
node scripts/render_smoke.cjs public/static/compiled/bubu_hub.js   # ⚠️ 파일 인자 필수(기본값 landing.js라 없으면 ENOENT)
npx wrangler deploy                                 # 포그라운드 필수, limyj007 계정(313b6305)
```
  - 프론트 수정 시 `public/index.html`의 `bubu_hub.js?v=N` **캐시버전 bump**(현재 `v=9`).
  - esbuild가 한글을 `\uXXXX`로 이스케이프 → **컴파일본 grep은 한글 리터럴 대신 ASCII 마커**(함수명·`safety_tier` 등)로.
  - **배포 계정·실행 방식**(코드에서 복원 · 근거: `maumbubu/CLAUDE.md` L25·L29 · `wrangler.toml` · 루트 `CLAUDE.md` 「배포 원칙」): Cloudflare 계정은 **`limyj007`**, account id **`313b6305…`** — AI Gateway 경로 `gateway.ai.cloudflare.com/v1/313b6305…/maumful/anthropic/…` 의 계정 ID와 같다. `wrangler deploy` 는 **포그라운드 필수**(백그라운드 실행 시 인증 실패 — 전 서비스 공통 규칙). ⚠️ 계정이 둘로 갈린 경위와 백그라운드 실패의 실제 증상 로그는 외부 메모리 `feedback_cloudflare_account`·`feedback_wrangler_deploy` 에만 존재 — 코드로 복원 불가.
  - 마이그레이션: `npx wrangler d1 execute maumful-db --remote --file=migrations/000N_*.sql`. **ADD만**(D1은 DROP/RENAME COLUMN 미지원).
  - 커밋 규칙(루트): 서비스별 분리, 접두사 `[maumbubu]`. 수정 즉시 커밋·푸시.
- **Cron / 스케줄**: **해당 없음** — `wrangler.toml`에 `[triggers]` 없음. 만료 처리는 KV TTL에만 의존(`consent_pending` 24h, `bubu_invite` 7d).
- **모니터링·에러로그**: 별도 도구 없음. 라우트별 `console.error(...)` → Cloudflare Workers 로그(`wrangler tail`). 사용자에게는 한국어 일반 메시지만 반환(원문 에러 미노출). 헬스체크 `GET /health`.
- **롤백**: Cloudflare 워커 버전 롤백 또는 이전 커밋 재배포. 프론트는 `?v=N` 되돌림. D1은 ADD-only라 스키마 롤백 필요 없음(구 `relation_memory` 보존 규칙이 데이터 안전망).

## 13. 서비스 간 의존관계
| 대상 서비스 | 의존 내용 | 방향 |
|---|---|---|
| 마음풀 (maumful) | SSO 토큰 발급(`/api/bubu-token`) · 계정(`users`) · 크레딧 차감·거래 · 진입 메뉴(GlobalNav `openMaumBubu`, landing `isBubu`) · 상점 결제 | 마음부부 → 마음풀 (**강한 의존**) |
| 공유 인프라 | D1 `maumful-db`(f8046693) · KV(9f74…) · KV의 `JWT_SECRET` | 마음부부 → 생태계 공유 자원 |
| 마음커플 (maumcouple) | 코드 의존 없음. **패턴만 재사용** — JWT SSO 방식, 6자 초대코드(`genSessionCode`), 크레딧 패턴. 토큰 타입 `couple`도 `verifyJWT` 허용 목록에 포함 | 마음부부 → 마음커플 (설계 참조) |
| 마음수달·마음곁 | 녹음·영상 분석 기능을 **멀티모달 탐지에 재사용**(SPEC 10.3). 단 **별개 생태계**라 규칙은 섞지 않음 | 마음부부 → 마음 시리즈 (아이디어 재사용) |
| **마음세대 (maumsedae)** | **이 서비스에서 파생(fork)된 하위 앱.** 부모-자녀 세대 통역(`sedae.maumful.com`) | **마음부부 → 마음세대 (파생 원본)** |
| CTS (cts-maum-main) | 없음. CTS는 유지보수 모드이며 마음풀 신규 기능도 포팅하지 않음 | — |

### 13.1 마음세대 파생 관계 (이 서비스가 원본이다)
- 루트 CLAUDE.md: `maumsedae/` = "마음세대 (부모-자녀 세대 통역, sedae.maumful.com) *신규* → `maumsedae/CLAUDE.md` (**마음부부에서 파생**)". 마음세대 CLAUDE.md: "**공용 엔진의 진본은 마음부부**(`../maumbubu`)".
- SPEC_MASTER §10.4가 이 파생을 처음부터 예고하며, 마음부부 개발 시 **상속 준비** 두 가지를 요구했다: ① 계정에 생년월일 + 연령등급 필드 ② **relation type 파라미터화**("현재는 'couple' 고정이지만 하드코딩하지 않는다").
- 마음세대가 **상속한 것**: SAFETY_OVERRIDE T1/T2/T3 + 109/1388/1366/1577-1389/112 · 관계 기억 (relation_id, user_id) 복합키 · 프론트 `SafetyScreen` 패턴 · 마음풀 SSO(`/api/sedae-token`, type `sedae`) · AI Gateway 경유 · maumful-db/KV 공유.
- 마음세대가 **뒤집은 것**: 사용자당 **다중 관계**(부모-자녀는 여럿) · **청소년(만14~18) 모드**(회복 책임을 아이에게 지우지 않음, 코드 레벨 `TEEN_BLOCKED` 차단, 무료 전용) · 미가입 상대용 **공개 공유 웹뷰 `GET /s/:id`**(마음부부는 초대코드 기반).
- ⚠️ **파생 시 실제 사고 2건**(마음세대 CLAUDE.md 기록): ① `verifyJWT`의 허용 타입 `['bubu','couple']`을 그대로 둬 로그인이 전부 막힘 ② 프리앰블의 *"당신은 마음부부의 관계 통역가입니다. 부부 사이의 대화를…"*을 그대로 둬 부모-자녀 입력에 배우자 갈등 통역이 나옴.
- ⚠️ **안전 규칙 동기화 의무**: "안전 규칙은 마음부부↔파생앱(마음세대) 동일 반영 — 버전 분기 금지". 한쪽만 고치면 안 된다.

## 14. 현황 및 백로그
- **라이브 상태**: **배포됨** — https://bubu.maumful.com (CLAUDE.md "라이브" 명시). 마지막 maumbubu 커밋 `b67d336`(2026-08-29, AI egress 프록시 지원). 그 직전이 무료 3회 전환 로직(`ef5da3d`), 관계 기억 사용자 분리(`2b648be`, 2026-07-17), BATCH_01 감수 반영(`8777bf5`).
- **미착수 / 대기** (CLAUDE.md "미착수 — 자료·지시 대기, 임의 착수 금지"):
  - 세대통역 후속앱(부모-자녀) → **이후 마음세대로 실현됨**(§13). 마음부부 측 후속 작업은 없음.
  - 양방향 실시간 동기화(동시 세션·커플 대시보드)
  - 상담사 마켓플레이스
  - casebank BATCH_01 회귀검증 (케이스뱅크 자료 필요)
  - 실기기 카메라 멀티모달 E2E 검증
  - **연동형 유료결제**: 설계 완료·**토스 반영 후 착수**. 마음풀 측 상품 3종(`bubu_pack10/20/40`)과 크레딧 지급 경로는 **이미 코드에 있으므로**(§10 표) 부부 워커에 남은 구현은 없다. 남은 것은 토스 실결제 반영과 착수 지시뿐. **착수 지시 전까지 구현·커밋 금지.**
  - **전 서비스 백로그** — 루트 `CLAUDE.md` 「남은 작업 (백로그)」 **원문 중 마음부부에 해당하는 항목만** 옮긴다(코드로 복원 불가 → 원문 인용으로 대체):
    > - **선행조건 대기**: 앱화·통합해석 상품화·연동형 통합결제 → 모두 **토스 실결제 반영 후**
    > - **금지**: 커플 감정 내용 공유(동의·철회 UX 없이) / CTS 개발(명시적 재개 시에만)
    - 나머지 백로그 항목(폐기된 상담사 승인 레거시 제거 · 주간 리포트 메일 실수신 검증 · 마음게임 콘텐츠 확장)은 **마음부부 소관이 아니다**.
    - ⚠️ 서비스 간 **우선순위·일정·완료 판정 기준**은 외부 메모리 `project_maum_backlog` 에만 존재 — 코드로 복원 불가. 루트 `CLAUDE.md` 에 남은 것은 위 인용이 전부다.
- **금지 사항**:
  - SAFETY_OVERRIDE **축약·완화·조건부화 금지**(상시 포함 유지).
  - 관계 기억을 `relation_id` 단일키로 **되돌리지 말 것**. 구 `relation_memory` 테이블 **삭제 금지**.
  - 수신 통역 결과·통역 이력·관계 기억·활동 피드백의 **공유 금지**(자동이든 수동이든).
  - `translation_logs`에 원문·결과, `activity_log`에 자유서술, `community_posts`에 user_id **저장 금지**.
  - 커뮤니티를 **사후 삭제 구조로 변경 금지**(사전 검수만). 말없는 차단 금지.
  - 안전 규칙의 **마음부부↔마음세대 버전 분기 금지**.
  - 연동형 유료결제 코드는 **토스 실결제 반영 전까지 커밋·푸시·배포 금지**.
  - 배포는 **포그라운드**·`limyj007` 계정. 백그라운드 `wrangler deploy` 금지.

## 15. 알려진 리스크 · 기술부채

> ✅ **[BATCH_05 해소 2026-09-19]** R-26 공감 반응(🤍) 증가 API·버튼 구현 — `community_empathy(post_id, author_hash)` 멱등 테이블(원격 생성)·`POST /api/community/empathy`·프론트 버튼(낙관적 갱신·롤백). 순위·경쟁·토글 없음. 배포 30d4b922. (BATCH_01 R-05/R-23·R-24는 별도 반영됨.)

1. **`/api/share/respond`에 소유권 검증이 없다.** `translate-route.ts:898-905`는 `shareId`만 받아 `UPDATE shared_items SET status='accepted'`를 실행하며, `assertRelationOwner`도 수신자 확인도 하지 않는다. 유효한 마음부부/마음커플 토큰을 가진 **아무 사용자나** 임의 `shareId`의 상태를 바꿀 수 있다(id가 18자리 hex라 추측은 어렵지만 가드 자체가 부재). 같은 파일의 다른 7개 라우트(`:345·475·618·763·838·870·887`)는 `assertRelationOwner` 를 쓰는데 이 라우트만 예외다.
2. **공유 철회(삭제) 미구현.** ADDENDUM 1.4-4 "발신자가 공유 항목 삭제 시 수신 측에서도 제거"에 해당하는 엔드포인트·UI가 없다. 한 번 보낸 항목은 회수 불가. (마음세대는 `DELETE /api/share/:id`로 구현했다 — 역포팅 후보.)
3. **공감 반응(🤍) 기능이 반쪽이다.** `community_posts.empathy_count`를 프론트가 표시하지만 **증가시키는 API도 버튼도 없다.** SPEC 7.3의 "공감 반응만, 순위·경쟁 없음"이 실질적으로 미구현 상태.
4. **`relation_safety`가 평문이다.** ADDENDUM 01 §2.2는 안전 플래그를 "암호화 필드"로 요구했으나, `migrations/0002_share.sql`은 `tier TEXT`를 평문 저장한다. 공유 DB(`maumful-db`)라 민감도가 더 높다.
5. **안전 차단이 relation 단위·30일이다.** `hasRecentSafety()`는 relation에 T1/T2 기록이 있으면 **피해자 쪽 발신도 함께 차단**한다(가해자 흔적 방지라는 의도된 설계이나, 30일이라는 숫자의 근거는 문서화돼 있지 않다). 또 **안전 플래그 해제 경로가 없다** — 31일이 지나야 자연 만료.
6. **무료 체험 카운터가 원자적이지 않다.** `KV.get` → `KV.put(usedFree+1)` 사이에 동시 요청이 들어오면 무료 3회를 초과 사용할 수 있다. 크레딧 차감은 원자적 UPDATE라 안전하지만 무료 구간은 그렇지 않다.
7. **`consent_sessions`에 만료 반영 로직이 없다.** 만료는 KV TTL(24h)로만 관리되고, D1의 `status`는 `pending`으로 영구히 남는다(`expired` 상태값은 정의만 되어 있고 아무도 세팅하지 않는다). Cron이 없어 정리 주체도 없다.
8. **토큰 타입 가드가 넓다.** `verifyJWT`가 `['bubu','couple']`을 모두 허용한다 — 마음커플 토큰 하나로 마음부부의 크레딧 차감 API 전체에 접근 가능하다. 마음세대는 이 문제를 인지하고 `['sedae']`로 좁혔다.
9. **`translation_logs`에 user_id가 없다.** 사용자별 집계가 불가능해 무료 카운터를 KV로 우회하고 있다(코드 주석에 명시). 관계 단위 분석만 가능.
10. **AI 호출이 통역 1회당 최대 2회다.** `/translate`는 통역 + `waitUntil`의 기억 갱신으로 Claude를 두 번 호출한다(기억 갱신은 무료·실패 무시). 비용·레이트리밋 산정 시 고려 필요.
11. **ADDENDUM 02 원본 문서가 레포에 없다.** `maumbubu-dev/`에는 ADDENDUM01만 있고, ADDENDUM 02(§1 기억 분리·§2 자살예방 109)는 CLAUDE.md·마이그레이션 주석·커밋 메시지로만 남아 있다. 설계 진본의 결손 — **⚠️ 미확인 / 원본 확보 필요**.
12. **프론트가 891줄 단일 파일이다.** `bubu_hub.jsx` 하나에 14개 컴포넌트가 들어 있고 `--bundle=false`라 스코프 실수가 빌드·200 응답을 통과할 수 있다. `render_smoke.cjs` 실행이 사실상 유일한 방어선이며, **파일 인자를 빠뜨리면 기본값 `landing.js`를 찾다가 ENOENT로 죽는다**(검증을 건너뛰기 쉬운 구조).
13. **`AI_PROXY_URL` 실제 설정 여부 미확인.** 코드는 폴백을 갖췄지만 운영 환경에 값이 들어갔는지는 레포에서 확인 불가(`wrangler.toml`에 `[vars]` 없음) — **⚠️ 미확인**.
14. **온보딩 설정이 localStorage에만 있다.** `bubu_config`(트랙·슬라이더)가 기기 로컬에만 저장돼, 기기를 바꾸면 온보딩을 다시 하고 트랙 선택도 초기화된다. SPEC 6.1의 "슬라이더 설정"은 관계 기억 저장 대상으로 설계돼 있었으나 서버에 저장되지 않는다.
15. **BATCH_01 회귀 기준이 아직 자동화돼 있지 않다.** 감수 원칙 P1~P3이 프롬프트에 반영됐지만, 6케이스를 실제 API로 돌려 비교하는 절차가 없어 프롬프트 수정 시 회귀를 잡을 수 없다(§14 대기 항목).


### 외부 메모리 대조표

2026-09-19 작업으로 이 문서의 외부 메모리 참조 6곳을 코드·로컬 문서에서 복원했다. 아래 오른쪽 열은 원리상 코드에 없는 것(= 의사결정 맥락)이며, 해당 메모리가 사라지면 영구 소실된다.

| 외부 메모리 | 코드·로컬 문서에서 복원된 부분 | 복원 불가(의사결정 맥락) |
|---|---|---|
| `project_maumbubu` | SPEC_MASTER §1~§10 ↔ 이 문서 ↔ 코드 대응표(§0) · 4모드 · 3층 엔진 · 관계기억 5필드 · SPEC §6.1 미구현 2필드 | 구현 이력(변경 순서·판단 근거) · **ADDENDUM 02 원본 문서**(기억 분리·자살예방 109) |
| `project_maum_unified_payment` | 부부 상품 3종 키·크레딧·가격·배지(§10) · 가격 산정 주석(회당 2.5cr 역산) · 내부 크레딧형 구조(`service` 없음) · 루트 `CLAUDE.md` 원문 | 확장 범위·착수 조건 · DB/API 계약 검증 절차 |
| `project_maum_backlog` | — (루트 `CLAUDE.md` 백로그 원문 중 부부 해당 2줄만) | **전 서비스 통합 백로그 전부** · 서비스 간 우선순위·일정 |
| `feedback_cloudflare_account` | 계정 `limyj007` · account id `313b6305…`(AI Gateway 경로와 동일) | 계정이 둘로 갈린 경위 |
| `feedback_wrangler_deploy` | `wrangler deploy` 포그라운드 필수(루트 `CLAUDE.md` 공통 규칙) | 백그라운드 실패의 실제 증상·로그 |

---

## 개정 이력
| 일자 | 내용 | 작성 |
|---|---|---|
| 2026-09-19 | 외부 메모리 참조 항목을 코드에서 복원해 대체. 복원 불가 항목은 사유 명시 | Claude |
| 2026-09-19 | 최초 작성 — CLAUDE.md·SPEC_MASTER·ADDENDUM01·소스·마이그레이션·BATCH_01 근거로 전 섹션 작성 (근거 커밋 `b67d336`) | Claude |
