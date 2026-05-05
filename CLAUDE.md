# 마음풀 / 마음게임 / 마음커플 — 프로젝트 통합 가이드

## 프로젝트 구조

```
maum/
├── maumful-main/      → maumful.com (메인, 운영중) / maumful-dev.limyj007.workers.dev (스테이징)
├── maumgame-main/     → game.maumful.com (운영중)
└── package/
    ├── maumcouple/    → couple.maumful.com (운영중) / maumcouple-dev.limyj007.workers.dev (스테이징)
    ├── maumful/       → 참고용 (이미 maumful-main에 선택적 병합 완료)
    └── D1_SQL_실행순서.sql
```

## 공유 인프라

| 리소스 | 프로덕션 | 스테이징 | 용도 |
|---|---|---|---|
| Cloudflare D1 | `maumful-db` | `maumful-db-dev` (ID: `9a35e35e-bd8d-4dc3-b308-898675c8f434`) | 공유 DB |
| Cloudflare KV | `maumful KV` | 동일 | JWT_SECRET 공유 |

모든 서비스는 동일한 D1 인스턴스와 KV를 바인딩한다.

---

## Claude AI 작업 규칙

### 🔴 wrangler 배포 — 반드시 포그라운드 실행

```powershell
# ✅ 올바른 방법 — Bash 포그라운드로 실행 (사용자 인증 세션 사용)
npx wrangler deploy
npx wrangler secret put KEY_NAME

# ❌ 금지 — run_in_background:true 로 실행하면 비대화형 환경으로 인증 실패
# CLOUDFLARE_API_TOKEN 오류 발생
```

배포 완료 후 반드시 Version ID와 URL을 확인하여 사용자에게 보고한다.

---

## 신규 기능 개발 정책 (2026-05-05~)

### 🔴 마음풀 선행, CTS 후행 원칙

신규 기능은 **마음풀(maumful-main, maumgame-main, maumcouple) 서비스에만 먼저 적용**한다.

- CTS(`cts-maum-main`, `cts-game-main`, `lightoflife-couple`) 동시 적용 금지
- 마음풀에서 충분히 검증·안정화된 후, 사용자가 명시적으로 요청할 때만 CTS에 일괄 적용 검토
- 이미 CTS에 적용된 기능(TTS 음성 출력 등)은 유지

---

## 개발 / 배포 워크플로

### GitHub Actions CI/CD

```
dev 브랜치 push  → .github/workflows/deploy-staging.yml
                  → maumful-dev.limyj007.workers.dev
                  → maumcouple-dev.limyj007.workers.dev

main 브랜치 push → .github/workflows/deploy-production.yml
                  → maumful.com
                  → couple.maumful.com
```

GitHub Secrets 필요:
- `CF_API_TOKEN` — Cloudflare API 토큰 (Workers 배포 권한)
- `CF_ACCOUNT_ID` — Cloudflare 계정 ID

### 스테이징 설정 파일

- `maumful-main/wrangler.dev.toml` — dev Worker + maumful-db-dev 바인딩
- `package/maumcouple/wrangler.dev.toml` — dev Worker + maumful-db-dev 바인딩

### 스테이징 DB 마이그레이션

```powershell
# maumful-main/migrate-dev.ps1 실행
cd maumful-main
.\migrate-dev.ps1
```

migrations 폴더의 0001~최신 파일을 순서대로 maumful-db-dev에 적용한다.

---

## SSO 흐름

```
마음풀 로그인 → accessToken(1h) + refreshToken(30d)

마음게임 진입:
  GET /api/game-token → 7일 전용 토큰 (type: 'game')
  → window.open('https://game.maumful.com?t=<token>')
  → maumgame: localStorage('game_token') 저장

마음커플 진입 (마음풀 → 마음커플):
  GET /api/couple-token → 7일 전용 토큰 (type: 'couple')
  → window.open('https://couple.maumful.com?t=<token>')  ← 스테이징: maumcouple-dev.limyj007.workers.dev
  → maumcouple: localStorage('couple_token') 저장

마음커플 → 검사 이동:
  href="{MAUMFUL_URL}?start=BIG5|LOST|DSI"
  → maumful: ?start= 파라미터 감지 → startTest: 뷰 경유 → chargeForTest() → 검사 시작
  → sessionStorage('return_to_couple') = '1' 설정
  → 검사 완료(submit) 시 saveCoupleResult() 호출 → result_json DB 저장
  → complete 뷰 → 2.5초 후 또는 버튼 클릭으로 maumcouple 복귀
```

JWT 시크릿은 KV의 `JWT_SECRET` 키 값을 우선 사용하며, 미설정 시 환경변수 fallback.

---

## 마음커플 연동 — 현재 구현 상태 (완료)

### 완료된 작업 목록

#### maumful-main/src/index.tsx

**추가된 엔드포인트** (`/api/ai-chat` 앞에 위치):

```typescript
// /api/couple-token
app.get('/api/couple-token', async (c) => {
  // couple 타입 7일 JWT 발급
})

// /api/test/save-result  ← BIG5/LOST/DSI result_json 저장 (UPSERT)
app.post('/api/test/save-result', async (c) => {
  // UPDATE test_history SET result_json=? WHERE id=(최근 행)
  // 행이 없으면 INSERT (credits_spent=0)
})
```

#### maumful-main/public/static/app.jsx

**추가/수정된 항목:**

1. `returnToCouple` state — sessionStorage 대신 React state로 관리
2. `getCoupleBaseUrl()` — 스테이징/프로덕션 URL 자동 감지
3. `openMaumCouple()` — couple-token SSO 발급 후 팝업
4. `goBackToCouple()` — maumcouple로 복귀 + state 정리
5. `saveCoupleResult(testType, resultJson)` — 검사 제출 시점에 result_json 저장
6. GlobalNav 💕 마음커플 버튼
7. 마이페이지 💕 마음커플 버튼
8. `#counseling?type=couple` deep link 처리
9. `?start=BIG5|LOST|DSI` URL 파라미터 처리:
   - `setView('startTest:' + testKey)` 경유 → chargeForTest() → test_history 행 생성
   - 비로그인 시 `post_login_view = 'startTest:BIG5'` 저장 → 로그인 후 자동 이동
10. `submitBig5()` / `submitLost()` / `submitSdri()` — 제출 시 `saveCoupleResult()` 호출
11. `complete` 뷰 + `returnToCouple` 시 2.5초 후 자동 복귀 useEffect
12. `complete` / `big5Result` / `lostResult` / `dsiResult` 화면에 "💕 마음커플로 돌아가기" 버튼
13. `initializing` state — 첫 렌더 플래시 방지 (🌿 로딩 화면)

#### maumful-main/public/static/counseling.jsx

- `couple_counseling_type` localStorage → `setFilterTag('부부')` 자동 필터
- 부부 필터 연동 배너 UI

#### maumful-main/public/static/landing.jsx

- `마음커플` 네비게이션 항목 추가 (isCouple 플래그, hostname 기반 URL)

#### maumful-main/migrations/

| 파일 | 내용 |
|---|---|
| `0010_couple_sessions.sql` | couple_sessions 테이블 + 인덱스 생성 |
| `0011_add_result_json.sql` | `ALTER TABLE test_history ADD COLUMN result_json TEXT` |

#### package/maumcouple/public/static/couple_hub.jsx

- `MAUMFUL_URL` 스테이징/프로덕션 자동 감지
- 검사 링크 → `href={MAUMFUL_URL + '?start=' + testKey}` (BIG5/LOST/DSI)

---

## 마음풀 랜딩페이지 마음커플 소개 섹션 (2026-05-03)

### maumful-main/public/static/landing.jsx

마음게임 섹션 바로 아래, 서비스 고지 바 위에 **마음커플 소개 섹션** 추가.

- 배경: `#FFF1F5` (로즈 계열) — 마음게임(`white`)과 시각적 구분
- 레이아웃: `1fr 1fr` 그리드 (좌: 2×2 기능 카드, 우: 설명+CTA) — 마음게임과 좌우 반전으로 리듬감
- 기능 카드 4종: 💕 BIG5 궁합 분석 / 🤖 AI 커플 리포트 / 📊 관계 건강도 체크인 / 🗓️ 데이트 코스 추천
- CTA 버튼: "마음커플 시작하기 →" — 클릭 시 `/api/couple-token` SSO → `couple.maumful.com` 이동
- 비로그인 시: `memberLogin` 뷰로 이동
- 스테이징 자동 감지: hostname `workers.dev` / `-dev.` 포함 시 `maumcouple-dev.limyj007.workers.dev` 사용

---

## 핵심 버그 수정 이력 (재발 방지)

### 🔴 제휴 신청하기 버튼 — 빈 화면

**원인**: `maumful-main`과 `cts-maum-main` 두 서비스 모두 `counseling.jsx`의 제휴 배너 버튼 `onClick`이 `setOnboardingOpen(true)` 대신 `setView('memberLogin')`으로 잘못 연결되어 있었음.

**수정**: 두 서비스 모두 `onClick={()=>setOnboardingOpen(true)}`로 변경.

---

### 🔴 result_json 저장 안 됨

**원인**: `advanceToNextTest()` 가 `setView('complete')` 로 이동하므로, `big5Result` 뷰를 감시하는 auto-save useEffect가 실행되지 않음.

**수정**: `submitBig5()` / `submitLost()` / `submitSdri()` 함수 내에서 `advanceToNextTest()` 호출 직전에 `saveCoupleResult()` 를 호출.

### 🔴 ?start= 진입 시 빈 화면

**원인**: `?start=BIG5` 핸들러가 `setView('big5Test')` 직접 호출 → `chargeForTest()` 미경유 → test_history 행 미생성 → save-result UPDATE 실패.

**수정**: `setView('startTest:BIG5')` 경유로 변경 → 기존 `startTest:` useEffect가 `chargeForTest()` 호출.

### 🔴 landing 페이지 플래시

**원인**: useEffect가 페인트 이후 실행되어 로그인 상태 복원 전에 landing 화면이 잠깐 표시됨.

**수정**: `initializing` state + 🌿 로딩 화면으로 차단.

### 🔴 React stale closure (isLoggedIn)

**원인**: useEffect 내부의 `isLoggedIn` 클로저가 초기값 `false`를 캡처 → `setView('memberDashboard')` 대신 `setView('memberLogin')` 호출.

**수정**: IIFE 내부에서 `let isAuthenticated = false` 로컬 변수 사용.

---

## 마음커플 핵심 데이터 흐름

```
마음풀에서 BIG5/LOST/DSI 검사 완료
→ submitBig5/submitLost/submitSdri 호출 시 saveCoupleResult() 실행
→ POST /api/test/save-result → test_history.result_json 에 저장

마음커플 접속 (SSO)
→ GET /api/couple/me
→ SELECT test_type, result_json FROM test_history
   WHERE user_id=? AND test_type IN ('BIG5','LOST','DSI') AND result_json IS NOT NULL
→ BIG5/LOST/DSI 최근 결과 자동 로드

세션 생성 (host)
→ POST /api/couple/session
→ 6자리 코드 생성, 크레딧 차감 (단독 20cr / 2종 35cr / 3종 45cr)
→ 파트너에게 코드 공유

파트너 참여 (guest)
→ POST /api/couple/join (코드 입력)
→ 양쪽 결과 합산 → status: 'both_done'

AI 리포트 생성
→ POST /api/couple/report
→ Claude AI (claude-haiku-4-5-20251001) 궁합 분석
→ SCORE:XX 파싱 → compatibility_score 저장
→ status: 'reported'

만료 세션 정리
→ Cron 매월 1일 03:00 (maumcouple wrangler.toml)
```

## 마음커플 세션 상태 머신

```
waiting → (guest join + 양측 데이터 있음) → both_done
both_done → (report 생성) → reported
waiting | both_done → (host cancel or 72h 경과) → expired
```

---

## 프로덕션 배포 전 체크리스트

### D1 마이그레이션 (프로덕션 DB)

```bash
# maumful-db (프로덕션)에 아직 적용 안 된 마이그레이션 확인 후 실행
npx wrangler d1 execute maumful-db --remote --yes --file=./migrations/0010_couple_sessions.sql
npx wrangler d1 execute maumful-db --remote --yes --file=./migrations/0011_add_result_json.sql
# 이미 result_json 컬럼이 있다면 0011은 "duplicate column" 오류 → 무시해도 됨
```

### maumcouple 커스텀 도메인

`couple.maumful.com` — Cloudflare Workers 커스텀 도메인 설정 완료 (운영중).

### package/maumful 버전의 수정 필요 사항

package 버전을 그대로 교체하면 안 되는 이유. 아래 6개 항목은 반드시 현재 운영 버전 동작을 유지해야 한다.

**🔴 Critical**

**1. export default 패턴 — Cron 핸들러 소실**

```typescript
// 현재 버전 (유지)
export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Bindings) {
    await handleScheduled(env)
  },
}
```

**2. restoreLoginState 퇴행** — B2B 세션 복원 로직 재추가 금지. B2C 전용 코드 유지.

**3. ADMIN_SECRET 미설정 시 관리자 API 차단**

```typescript
// 현재 버전 (유지): 미설정이면 차단
if (!adminSecret) return 'ADMIN_SECRET_NOT_SET'
```

**🟠 Medium**

**4. 회원가입 응답 credits 불일치** — DB INSERT `credits=10`, 응답도 `credits: 10` 일치 필요.

**5. AI 오류 환불 시 일일 카운터 복원** — `refundChat()` 함수(카운터 -1 + 크레딧 환불) 유지.

**6. 비밀번호 재설정 Rate Limit** — `checkRateLimit(KV, 'forgot-pw:${ip}', 3, 3600)` 유지.

---

## 환경변수 / Secrets 체크리스트

### maumful
| 키 | 위치 | 설명 |
|---|---|---|
| `JWT_SECRET` | KV에 저장 | 3개 서비스 공유 시크릿 |
| `ANTHROPIC_API_KEY` | wrangler secret | AI 분석 / 채팅 |
| `TOSS_SECRET_KEY` | wrangler secret | 결제 |
| `TOSS_CLIENT_KEY` | wrangler secret | 클라이언트 결제 UI |
| `ADMIN_SECRET` | wrangler secret | 관리자 API 인증 |
| `RESEND_API_KEY` | wrangler secret | 이메일 발송 |

### maumgame / maumcouple
- `ANTHROPIC_API_KEY` — wrangler secret으로 별도 등록 필요 (각 서비스마다)
- `RESEND_API_KEY` — `re_TTUR5ogY...` (마음풀 전용, 2026-05-05 등록 완료)
- `JWT_SECRET`은 maumful KV와 동일한 KV 바인딩으로 자동 공유

### Resend API 키 분리 정책 (2026-05-05)

| 서비스 그룹 | Resend 키 | 적용 서비스 |
|---|---|---|
| 마음풀 | `re_TTUR5ogY...` | maumful / maumgame / maumcouple |
| CTS | `re_SteNS6P6...` | lightoflife (cts-maum-main) |

CTS와 마음풀 서비스는 이메일 발신 계정을 분리 운영.

### ANTHROPIC_API_KEY 등록 명령 (3개 서비스 모두)

```powershell
cd maumful-main      && npx wrangler secret put ANTHROPIC_API_KEY
cd maumgame-main     && npx wrangler secret put ANTHROPIC_API_KEY
cd package/maumcouple && npx wrangler secret put ANTHROPIC_API_KEY
```

키는 console.anthropic.com → API Keys 탭에서 확인. 세 서비스에 동일한 키 사용.

---

## AI 호출 인프라 — Cloudflare AI Gateway

### 🔴 Workers → Anthropic 직접 호출 불가 (WAF 차단)

**원인**: Cloudflare Workers의 발신 IP가 Cloudflare 네트워크 대역이고, `api.anthropic.com`도 Cloudflare 프록시 뒤에 있음. Anthropic WAF가 Cloudflare Worker IP에서 오는 요청을 `403 Request not allowed`로 차단.

**해결**: 3개 서비스 모두 **Cloudflare AI Gateway**를 경유하도록 변경 (2026-05-02 적용).

### Gateway 설정

| 항목 | 값 |
|---|---|
| Gateway 이름 | `maumful` |
| 계정 ID | `313b6305037d45af37c09a60dad1ac2b` |
| 인증 | **비활성화** (Public gateway) |

### Anthropic 호출 URL (3개 서비스 공통)

```typescript
// ❌ 사용 금지 — Workers에서 WAF 차단됨
fetch('https://api.anthropic.com/v1/messages', ...)

// ✅ 현재 사용 중 — AI Gateway 경유
fetch('https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages', ...)
```

헤더는 동일하게 유지: `x-api-key`, `anthropic-version: 2023-06-01`

### 🔴 Gateway 인증 관련 주의

- Gateway 인증을 **활성화하면** 모든 AI 기능이 `2009 Unauthorized`로 즉시 실패
- Cloudflare Dashboard → AI → AI Gateway → `maumful` → Settings → Authentication **OFF** 유지
- Gateway 인증 활성화 시 Workers에 `cf-aig-authorization: Bearer <token>` 헤더 추가 필요

---

## AI 모델 설정

### 서비스별 사용 모델 (2026-05-01 기준)

| 서비스 | 기본 모델 | 폴백 | 비고 |
|---|---|---|---|
| **maumful** | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` | `AI_MODEL` 환경변수로 변경 가능 |
| **maumgame** | `claude-haiku-4-5-20251001` | 없음 | 하드코딩 |
| **maumcouple** | `claude-haiku-4-5-20251001` | 없음 | 하드코딩 |

### 🔴 AI 모델 에러 재발 방지

**원인**: Claude 3 계열 모델(`claude-3-haiku-20240307`, `claude-3-5-sonnet-20241022` 등)이 2026년 이후 deprecated 처리되어 **전부 403 반환**.  
폴백 목록에 Claude 3 모델이 있으면 순서대로 모두 실패하여 최종 403 에러 발생.

**규칙**:
- 폴백 목록에 **Claude 3 계열 모델 절대 추가 금지**
- 새 모델 추가 시 `claude-haiku-4-5-20251001` 이상만 사용
- 모델 접근 진단: `https://maumful.com/api/admin/test-ai?secret=<ADMIN_SECRET>`

### maumful AI 엔드포인트 폴백 구성

```typescript
// /api/ai-analyze 및 /api/ai-chat 공통
const MODEL_FALLBACKS = [
  getAiModel(c.env),           // env.AI_MODEL ?? 'claude-sonnet-4-6'
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
]
```

---

## 마스터 계정

`limyj007@gmail.com` — 3개 서비스 모두 하드코딩됨.  
크레딧 무제한, 모든 기능 해금, 관리자 통계 접근 가능.

---

## maumful UX 개선 이력 (2026-05-02)

### maumful-main/public/static/app.jsx

| 항목 | 내용 |
|---|---|
| 대시보드 biblical mode 배지 | 인사말 옆에 `✝️ 기독교 상담` 배지 인라인 표시 (`counselingMode === 'biblical'` 시) |
| 닉네임 placeholder | `"닉네임 (선택)"` → `"닉네임 (AI 상담에서 이름으로 불려요)"` |
| 신규 가입자 가이드 배너 | `maumful_guide_dismissed` localStorage 플래그로 표시/숨김 제어 |
| `initializing` state | 첫 렌더 플래시 방지 — 로그인 상태 복원 전 🌿 로딩 화면으로 차단 |

### maumful-main/src/index.tsx — AI 채팅 일일 제한 KST 수정

```typescript
// Before (UTC 기준 → 자정~09:00 KST 구간에서 전날 카운터 이월 버그)
const today = new Date().toISOString().slice(0, 10)

// After (KST 기준)
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
```

KV 키 패턴: `ai_guest:${ip}:${today}` / `ai_daily:${userId}:${today}` — 둘 다 동일 수정.

---

## 마음커플 콘텐츠 강화 — 1단계 (2026-05-02)

### package/maumcouple/public/static/couple_hub.jsx

#### 추가된 데이터 상수

| 상수 | 설명 |
|---|---|
| `DAILY_QUESTIONS` | 60개 커플 대화 질문 배열 (날짜 기반 순환) |
| `MINI_QUESTIONS` | 7문항 연애 유형 테스트 문항 |
| `LOVE_TYPES` | 4가지 유형: S(안정신뢰) / R(낭만감성) / P(열정성장) / F(자유여유) |
| `calcLoveType(answers)` | 답변 배열 → 최다 선택 유형 반환 |
| `getPersonalityLabel(big5Data)` | BIG5 데이터 → 주도 특성 배지 (⚡활력/🤝친화/🎨탐구/📋계획/🌊감수) |
| `getCoupleChemType(myBig5, partnerBig5)` | 두 BIG5 → 커플 케미 유형 5종 |

#### 추가된 컴포넌트

| 컴포넌트 | 기능 | 비용 |
|---|---|---|
| `DailyQuestionCard` | 날짜 기반 대화 질문 카드, "다음 질문" + 파트너 공유 | 무료 |
| `MiniLoveTestView` | 7문항 연애 유형 테스트, 결과 공유 | 무료 |
| `SoloAnalysisView` | AI 이상형 성향 분석 (강점/파트너유형/성장포인트) | 5cr |

#### CoupleHubApp 변경

- `view` 상태에 `'miniTest'` / `'soloAnalysis'` 추가
- 인사 카드: BIG5 기반 내 성격 유형 배지 인라인 표시
- 빠른 액션 버튼 2개 (연애유형테스트 무료 / 이상형분석 5cr)
- 이전 리포트 섹션: 점수 변화 미니 바 차트 + "📈 +N점 향상" 메시지

### package/maumcouple/src/index.tsx

```typescript
// POST /api/couple/solo-analysis (5cr)
// BIG5/LOST/DSI 결과 기반 AI 분석: 연애 강점 / 잘 맞는 파트너 유형 / 성장 포인트
// AI Gateway 경유, claude-haiku-4-5-20251001
```

---

## 마음커플 콘텐츠 강화 — 2단계 (2026-05-02)

### DB 마이그레이션

```
package/maumcouple/migrations/0002_relationship_checkins.sql
→ relationship_checkins 테이블 생성 (user_id, total_score, answers_json, created_at)
→ idx_checkins_user 인덱스
→ 프로덕션 적용 완료
→ 스테이징(maumful-db-dev) 적용 완료
```

### package/maumcouple/public/static/couple_hub.jsx

#### 추가된 데이터 상수

| 상수 | 설명 |
|---|---|
| `CHECKIN_QUESTIONS` | 10개 관계 건강도 문항 (소통/이해/갈등/시간/미래/솔직함/지지/영향/배려/만족) |
| `SCORE_LABELS` | 1~5점 척도 레이블 (매우 아니다 ~ 매우 그렇다) |
| `checkinScoreInfo(score, max)` | 점수 → 색상/레이블 매핑 (💚💛🧡❤️‍🩹) |
| `DATE_REGIONS` | 데이트 지역 8곳 |
| `DATE_MOODS` | 분위기 4종 (🌹로맨틱/⚡활동적/🌿힐링/🎨문화예술) |
| `DATE_DURATIONS` | 소요시간 3종 |
| `DATE_BUDGETS` | 예산 3단계 |

#### 추가된 컴포넌트

| 컴포넌트 | 기능 | 비용 |
|---|---|---|
| `RelationshipCheckinView` | 월 1회 관계 만족도 체크인, 기록 누적, 전월 대비 비교 | 무료 |
| `DateCourseView` | 지역/분위기/시간/예산 선택 → AI 맞춤 데이트 코스 | 3cr |

#### CoupleHubApp 변경

- `view` 상태에 `'checkin'` / `'dateCourse'` 추가
- 인사 카드 빠른 액션: **2×2 그리드** (연애유형테스트/데이트코스추천/관계성장체크인/이상형성향분석)

### package/maumcouple/src/index.tsx

```typescript
// GET  /api/couple/checkins        — 체크인 기록 최근 6개 + 이번달 완료 여부
// POST /api/couple/checkin         — 체크인 저장 (무료, 월 1회 제한 — KST 기준)
// POST /api/couple/date-course     — AI 데이트 코스 추천 (3cr)
//   BIG5 외향성/개방성 데이터 반영 → 개인화 추천
//   AI Gateway 경유, claude-haiku-4-5-20251001
```

### 마음커플 전체 API 엔드포인트 목록 (현재)

| 메서드 | 경로 | 설명 | 인증 | 비용 |
|---|---|---|---|---|
| GET | `/api/couple/me` | 유저+검사결과+활성세션+리포트 | ✓ | 무료 |
| GET | `/api/couple/credits` | 크레딧 잔액 | ✓ | 무료 |
| GET | `/api/couple/session/:code` | 세션 상태 폴링 | ✓ | 무료 |
| GET | `/api/couple/checkins` | 체크인 기록 조회 | ✓ | 무료 |
| GET | `/api/couple/partner-moments` | 파트너 마음게임 기록 (감정+감사) | ✓ | 무료 |
| GET | `/api/couple/partner-info/:code` | 파트너 링크 정보 | ✗ | 무료 |
| GET | `/api/couple/admin/stats` | 관리자 통계 | ✓ (마스터) | 무료 |
| POST | `/api/couple/session` | 세션 생성 (host) | ✓ | 20~45cr |
| POST | `/api/couple/join` | 코드로 세션 참여 (guest) | ✓ | 무료 |
| POST | `/api/couple/report` | AI 커플 리포트 생성 | ✓ | 세션 생성 시 포함 |
| POST | `/api/couple/save-result` | 검사 결과 저장 | ✓ | 무료 |
| POST | `/api/couple/partner-submit` | 파트너 결과 제출 | ✗ | 무료 |
| POST | `/api/couple/checkin` | 관계 체크인 저장 | ✓ | 무료 (월 1회) |
| POST | `/api/couple/date-course` | AI 데이트 코스 추천 | ✓ | 3cr |
| POST | `/api/couple/solo-analysis` | AI 이상형 성향 분석 | ✓ | 5cr |
| POST | `/api/couple/coach` | AI 관계 코치 채팅 | ✓ | 3회/일 무료·이후 2cr |
| PATCH | `/api/couple/session/:code/cancel` | 세션 취소 | ✓ (host) | 무료 |

---

## 마음커플 콘텐츠 강화 — 3단계 (2026-05-02)

### package/maumcouple/public/static/couple_hub.jsx

#### 추가된 컴포넌트

| 컴포넌트 | 기능 | 비용 |
|---|---|---|
| `RelationshipCoachView` | AI 관계 코치 채팅 (하루 3회 무료, 이후 2cr) | 3회 무료·이후 2cr |
| `CoupleQuizView` | 10문항 커플 스타일 퀴즈 → A/B/C/D 유형 + 공유 | 무료 |
| `AnniversaryView` | D+N 기념일 계산기, 100/200/365/1000일 마일스톤 알림 | 무료 |

#### 데이터 상수

| 상수 | 설명 |
|---|---|
| `QUIZ_QUESTIONS` | 10문항 커플 스타일 퀴즈 (각 4지선다) |
| `QUIZ_TYPES` | A:안정공존형 / B:깊은유대형 / C:성장동반형 / D:자유균형형 |
| `ANNIVERSARY_KEY` | `'couple_first_date'` localStorage 키 |

#### CoupleHubApp 변경

- `view` 상태에 `'coach'` / `'quiz'` / `'anniversary'` 추가
- 인사 카드 빠른 액션: 기존 **2×2 그리드** 아래 **1×3 그리드** 추가 (코치/퀴즈/기념일)

### package/maumcouple/src/index.tsx

```typescript
// POST /api/couple/coach (하루 3회 무료, 이후 2cr)
// KV 키: couple_coach:${userId}:${today(KST)}
// BIG5 성격 데이터 system prompt 주입, 최근 10개 messages 전달 (stateless)
// AI Gateway 경유, claude-haiku-4-5-20251001
// Returns: { reply, usedToday, freeLimit:3, isPaid, creditsSpent }
```

### 버그 수정 (2026-05-02)

**🔴 관계 성장 체크인 저장 안 됨**

**원인**: 마지막(10번째) 문항 선택 시 `setTimeout(() => setStep(s => s + 1), 200)`이 실행되어
제출 버튼이 표시되기 전에 step이 10으로 이동 → `handleSubmit` 미호출.

**수정**: `step < CHECKIN_QUESTIONS.length - 1` 조건 추가 — 마지막 문항에서는 자동 진행 않고
사용자가 "✅ 체크인 완료하기" 버튼을 직접 눌러 제출하도록 변경.

---

## 커플 공유 기능 — 4단계 (2026-05-02)

### maumgame-main/public/static/games/gratitude.jsx

- `handleFinish` metadata에 `answers` 객체 추가 (파트너 조회용):
  `answers: Object.fromEntries(questions.map(q => [q.id, answers[q.id] || '']))`
- done 화면에 "💕 파트너와 공유하기" 버튼 추가 (Web Share API / clipboard fallback)
- `shareGratitude()` 함수: 3개 감사 답변 텍스트 → share

### maumgame-main/public/static/games/mood.jsx

- done 화면에 "💕 파트너와 공유하기" 버튼 추가
- `shareMood()` 함수: 감정 이모지 + 강도 + 메모 → share

### package/maumcouple/public/static/couple_hub.jsx

- `MOOD_LABELS` 상수 추가 (감정 이모지·레이블·색상)
- `PartnerMomentsSection` 컴포넌트 추가:
  - `GET /api/couple/partner-moments` 호출
  - 파트너 최근 7일 감정 타임라인 표시 (이모지+강도+메모)
  - 파트너 최근 3개 감사 일기 답변 표시
  - 접기/펼치기 토글
  - 파트너 없으면 렌더 안 함
- 허브 레이아웃: `<DailyQuestionCard />` 아래, 이전 리포트 위에 `<PartnerMomentsSection />` 삽입

### package/maumcouple/src/index.tsx

```typescript
// GET /api/couple/partner-moments
// 가장 최근 커플 세션에서 파트너 ID 조회
// → partner의 game_session_logs에서 mood(7일) + gratitude(3개) 조회
// → { hasPartner, partnerName, moodEntries, gratEntries }
// gratitude answers 필드: gratitude.jsx 4단계 이후부터 metadata.answers에 포함됨
```

---

## UX / 기능 개선 — 5~9단계 (2026-05-02)

### 5단계: 마음게임 주간 이메일 요약

**maumgame-main/src/index.tsx**

- `Bindings`에 `RESEND_API_KEY?: string` 추가
- `sendWeeklySummaryEmail(env, to, nickname, stats)` 함수: HTML 이메일 생성, Resend API 발송
  - `from: '마음게임 <noreply@maumful.com>'`
  - 스탯 그리드 (플레이 횟수 / EXP / 연속출석 / 주요 감정)
- `handleScheduled()` 개편: 지난 7일 활성 사용자 조회 → 사용자별 stats 계산 → 이메일 발송
- **등록 필요**: `cd maumgame-main && npx wrangler secret put RESEND_API_KEY`

### 6단계: 마음커플 파트너 진행 알림 UX

**package/maumcouple/public/static/couple_hub.jsx — SessionWaitingView**

- **TDZ 버그 수정**: `isHostDone` / `isGuestDone` 변수를 폴링 useEffect보다 먼저 선언
- `Browser Notification API`: 컴포넌트 마운트 시 권한 요청
- `prevRef`: 이전 상태(isHostDone/isGuestDone/bothDone)를 useRef로 추적
- 상태 변경 시 → 브라우저 알림(fireBrowserNotif) + 인라인 배너(notifyBanner) 표시
- 수동 새로고침 "↻ 지금 확인" 버튼 추가
- 폴링 중 pulse 애니메이션 dot + 마지막 확인 시각 표시 (HH:MM:SS)
- 폴링 간격: `(isHostDone || isGuestDone) && !bothDone` → 10초, 그 외 30초

### 7단계: 어드민 KPI 대시보드

**maumful-main/public/static/counseling_admin.jsx**

- `aApi` 메서드 추가: `dailyStats(days)`, `testStats()`, `users(page, search)`, `grantCredits(id, amount, reason)`
- `MiniBarChart` 컴포넌트: CSS 기반 바 차트 (라이브러리 없음)
- `AdminOverview` 개선:
  - 일별 트렌드 2-패널 차트 (신규가입+검사 / AI채팅+결제, 최근 14일)
  - 검사 유형별 수행 현황 (수평 진행바)
- `AdminUsers` 컴포넌트 추가:
  - 이메일 검색 + 페이지네이션 (20개/페이지)
  - 사용자 목록 (이메일/닉네임/크레딧/가입일/인증 여부)
  - "+ 지급" 버튼 → 크레딧 지급/차감 모달
- 사이드바 탭에 "👤 사용자 관리" 추가

### 8단계: 마음게임 통계 화면

**maumgame-main/src/index.tsx**

```typescript
// GET /api/game/stats
// 게임별: play_count, best_score, total_exp, last_played (GROUP BY game_id)
// 이번 주: play_count, exp_gained (최근 7일)
// 이번 달: play_count, exp_gained (최근 30일)
```

**maumgame-main/public/static/game_engine.jsx**

- `getGameStats()` 메서드 추가 → `/api/game/stats`

**maumgame-main/public/static/game_hub.jsx**

- `GAME_META` 상수: 게임 ID → 이름/이모지 매핑
- `GameStatsSection` 컴포넌트:
  - 접기/펼치기 (첫 펼침 시 API 1회 호출)
  - 이번 주/이번 달 요약 카드 (2열 그리드)
  - 게임별 수행 현황: 플레이 횟수 + 베스트 스코어 + 마지막 플레이 날짜
- `<GameStatsSection />` — AchievementPanel 위에 삽입

### 9단계: 마음커플 체크인 트렌드 차트

**package/maumcouple/public/static/couple_hub.jsx — RelationshipCheckinView.HistorySection**

- SVG 라인 차트 추가 (데이터 2개 이상 시 표시):
  - 오래된 → 최신 순서 (왼쪽→오른쪽)
  - 격자선 (25/50/75/100점 레이블)
  - 채움 영역(gradient fill) + 라인 + 점(dot) + 날짜 레이블
  - 최신 점수 강조 텍스트
- 기존 리스트 뷰 + 전월 대비 비교 메시지는 유지

---

## 중기 과제 F~I (2026-05-02)

### F: PWA 지원

**신규 파일:**
- `maumgame-main/public/manifest.json` — theme_color #4A7C59, categories: health/games
- `maumgame-main/public/sw.js` — Cache-first 정적 자산 + push event 처리
- `package/maumcouple/public/manifest.json` — theme_color #E05A8A, categories: health/lifestyle/social
- `package/maumcouple/public/sw.js` — 동일 패턴

**수정 파일:**
- `maumgame-main/src/index.tsx` — manifest link, Apple/OG 메타태그, SW 등록 스크립트
- `package/maumcouple/src/index.tsx` — 동일

(maumful은 이미 완성 상태)

### G: 공유 기능 강화

**maumgame-main/public/static/game_hub.jsx — EmotionWeeklyReport**

- 펼쳐진 상태에서 '공유 🔗' 버튼 표시
- Web Share API 우선, fallback: clipboard.writeText
- 공유 내용: 주요 감정 이모지 + 기록 일수 + AI 분석 요약 80자 + #마음풀 #마음게임

### H: 상담사 리뷰 시스템

**maumful-main/public/static/counseling.jsx**

- `MyAppointments` 컴포넌트에 `reviewModal` state 추가 → 리뷰 버튼이 alert 대신 ReviewModal 직접 오픈
- `CounselorReviewsModal` 신규 컴포넌트 — GET /api/counseling/reviews/:id 로 리뷰 목록 표시 (별점/작성자/내용/상담사 답변)
- 상담사 카드에 review_count > 0 일 때 '⭐ 리뷰' 버튼 → CounselorReviewsModal 오픈

**maumful-main/src/index.tsx**

```typescript
// GET  /api/admin/counseling/reviews?page= — 전체 리뷰 (admin_hidden 포함)
// PATCH /api/admin/counseling/reviews/:id/visibility — 숨김/공개 토글 + avg_rating 재계산
// GET  /api/push/vapid-key — VAPID 공개 키 반환
// POST /api/push/subscribe — maumful push 구독 저장
```

**maumful-main/public/static/counseling_admin.jsx**

- `aApi.reviews(page)` / `aApi.toggleReview(id, hidden)` 메서드 추가
- `AdminReviews` 컴포넌트: 상담사명/작성자/별점/내용/등록일 + 숨김/공개 토글, 페이지네이션
- 어드민 탭에 '⭐ 리뷰 관리' 추가

### I: Web Push 알림

#### DB 마이그레이션

```
maumful-main/migrations/0014_push_subscriptions.sql
→ push_subscriptions 테이블 (user_id, service, endpoint, p256dh, auth_key)
→ UNIQUE(user_id, service) — 서비스당 1개 구독 유지
→ 프로덕션 + 스테이징 적용 완료
```

#### package/maumcouple/src/index.tsx

```typescript
// signVapidJwt(privateKeyB64u, audience) — PKCS#8 DER 래핑 + WebCrypto ES256 서명
// sendWebPush(endpoint, privKey, pubKey) — VAPID auth 헤더 + 빈 payload 발송
// GET  /api/couple/vapid-key — VAPID 공개 키 반환
// POST /api/couple/push-subscribe — maumcouple push 구독 저장
// POST /api/couple/join — 파트너 참여 시 호스트의 push_subscriptions 조회 → sendWebPush() 호출
```

#### package/maumcouple/public/static/couple_hub.jsx — SessionWaitingView

- `pushActive` state 추가
- host 역할일 때 컴포넌트 마운트 시 자동 push 구독:
  1. GET /api/couple/vapid-key → VAPID 공개 키
  2. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` 
  3. POST /api/couple/push-subscribe → 구독 저장
- 초대코드 섹션에 '🔔 알림 켜짐' 배지 표시 (pushActive === true 시)

#### VAPID 키 등록 (프로덕션 배포 전 필수)

```powershell
# VAPID 키 쌍 생성 (Node.js 환경)
npx web-push generate-vapid-keys
# 출력된 Public Key, Private Key를 아래 명령으로 등록

cd package/maumcouple
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_PUBLIC_KEY

cd ../maumful-main
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_PUBLIC_KEY
```

Web Push는 VAPID 키 등록 전까지 비활성 상태로 동작 (push 발송 스킵, 나머지 기능 정상).

---

## 단기 기능 개발 (A~E) + 기술부채 (M, N) (2026-05-02)

### A: 마음커플 초대 이메일

**package/maumcouple/src/index.tsx**

```typescript
// POST /api/couple/invite-email
// 세션 소유자 확인 → Resend API로 HTML 초대 이메일 발송
// from: '마음커플 <noreply@maumful.com>'
// subject: `💕 ${myName}님이 마음커플에 초대했어요`
```

**package/maumcouple/public/static/couple_hub.jsx — SessionWaitingView**

- `emailInput`, `emailSending`, `emailResult` state 추가
- `sendInviteEmail()` 함수 추가
- 초대 코드 섹션에 이메일 입력란 + 📨 전송 버튼 추가
- **등록 필요**: `cd package/maumcouple && npx wrangler secret put RESEND_API_KEY`

### B: 마음게임 번아웃 트렌드 차트

**maumgame-main/src/index.tsx**

```typescript
// GET /api/game/burnout-history — 최근 10회 번아웃 세션 (date/score/burnout_score/city_level)
```

**maumgame-main/public/static/game_engine.jsx**

- `getBurnoutHistory()` 메서드 추가

**maumgame-main/public/static/game_hub.jsx**

- `BURNOUT_LEVELS` 상수 + `getBurnoutLevel()` 헬퍼 추가
- `BurnoutTrendSection` 컴포넌트: SVG 라인 차트 (danger zone 배경, 60점 가이드라인, 전회 대비 비교)
- `userTestScores.BURNOUT` 있을 때만 렌더링 (EmotionWeeklyReport 위)

### C: 크레딧 내역 reason 레이블/아이콘 보강

**maumful-main/public/static/app.jsx**

- `reasonLabel` 맵에 `couple`, `couple_session`, `solo_analysis`, `date_course`, `coach`, `counseling`, `ai_refund`, `bonus` 추가
- `reasonIcon(t)` 함수 신설 (기존 인라인 emoji → 함수로 통합)

### D: Google Sign-In (GSI)

**maumful-main/src/index.tsx**

- `Bindings`에 `GOOGLE_CLIENT_ID?: string` 추가
- HTML 템플릿에 `window.GOOGLE_CLIENT_ID` 주입 + GSI 스크립트 조건부 로드

**maumful-main/public/static/app.jsx**

- `handleGoogleLogin(credential)` 추가 (POST `/api/auth/google`)
- 로그인/회원가입 폼에 Google 버튼 (GSI `renderButton`) 삽입 — `window.GOOGLE_CLIENT_ID` 있을 때만
- **등록 필요**: `cd maumful-main && npx wrangler secret put GOOGLE_CLIENT_ID`

### E: 스테이징 DB 마이그레이션 재적용

```
0012_add_score_to_test_history.sql → maumful-db-dev 적용 완료
(이전 세션에서 wrangler OAuth 만료로 실패했던 항목)
```

### M: AI KST 일관성 확인 (기술부채)

모든 서비스의 AI 일일 제한 KV 키에 이미 `new Date(Date.now() + 9 * 3600 * 1000)` 적용 확인:
- maumful (index.tsx line 977)
- maumgame (lines 792, 929)
- maumcouple (lines 680, 773, 791)
→ **코드 변경 없음**

### N: 에러 모니터링 (기술부채)

#### DB 마이그레이션

```
maumful-main/migrations/0013_error_logs.sql
→ error_logs 테이블 + idx_error_logs_created 인덱스
→ 프로덕션(maumful-db) + 스테이징(maumful-db-dev) 모두 적용 완료
```

#### maumful-main/src/index.tsx

```typescript
// logError(DB, service, req, err, userId?) — D1 INSERT + 500건 초과 시 오래된 항목 삭제
// app.onError() — 모든 미처리 에러 자동 로깅 + 500 JSON 반환
// GET  /api/admin/error-logs?service=&limit=  — 최근 에러 조회 (limit max 100)
// DELETE /api/admin/error-logs               — 전체 삭제
```

#### maumful-main/public/static/counseling_admin.jsx

- `aApi.errorLogs(service, limit)` / `aApi.clearErrorLogs()` 메서드 추가
- `AdminErrorLogs` 컴포넌트: 서비스 필터, 건수 선택, 상태코드 배지, 스택 트레이스 접기/펼치기, 전체 삭제
- 어드민 사이드바에 `'🔴 오류 로그'` 탭 추가

---

## 장기 과제 J~K (2026-05-02)

### J: 마음풀 대시보드 추천 검사 + 검사 이력 SVG 차트

**maumful-main/public/static/app.jsx**

#### 추천 검사 카드 (memberDashboard)
- 크레딧 카드와 검사 목록 사이에 `✨ 추천 검사` 섹션 삽입
- 검사 이력 기반 개인화 로직:
  - PHQ9/GAD7: 미수행 또는 30일+ 경과 → 무료 재검사 권장
  - BIG5: 미수행 또는 90일+ 경과 → 성격 검사 권장
  - BURNOUT: PHQ9 수행 완료 + BURNOUT 미수행 → 번아웃 권장
- 최대 2개 추천, 검사 이력이 없으면 표시 안 함

#### SVG 라인 차트 (마이페이지 → 검사 이력 탭)
- 트렌드 요약 카드와 전체 이력 목록 사이에 삽입
- PHQ9(인디고)/GAD7(로즈)/BURNOUT(오렌지)/DSI(에메랄드) 4가지 색상
- 데이터 2개 이상인 검사만 라인 표시
- 격자선 (25/50/75/100%), X축 날짜 레이블, 점(dot) + 연결선

### K: 마음커플 주간 인사이트 이메일

**package/maumcouple/src/index.tsx**

```typescript
// sendCoupleInsightEmail(env, to, name, { checkinScore, prevScore, partnerName }) — Resend API HTML 이메일
```

**Cron 트리거 추가** (`wrangler.toml` + `wrangler.dev.toml`):

```
"0 23 * * 0"  →  일요일 23:00 UTC = 월요일 08:00 KST
```

**Scheduled 핸들러 로직**:
- `event.cron === '0 23 * * 0'` → 주간 이메일 분기
- 최근 30일 내 활성 커플 세션(waiting/both_done/reported) 사용자 최대 200명 조회
- 사용자별: 이번 달/지난달 체크인 점수 + 파트너 이름 조회 → 이메일 발송
- `RESEND_API_KEY` 미설정 시 건너뜀
- 발송 간격: 건당 100ms sleep (과도한 API 호출 방지)

**이메일 내용**:
- 그라디언트 헤더 (💕 마음커플)
- 파트너 연결 상태
- 이번 달 관계 건강도 점수 + 지난달 대비 변화
- 이번 주 대화 질문 (고정)
- CTA 버튼 → `https://couple.maumful.com`

### 버그 수정 (중기 검증 후)

**🔴 maumful Bindings — VAPID 키 누락**
- `maumful-main/src/index.tsx` Bindings에 `VAPID_PUBLIC_KEY?: string`, `VAPID_PRIVATE_KEY?: string` 추가

**🔴 리뷰 버튼 조건 오류**
- `maumful-main/public/static/counseling.jsx` line 334: `{(canVideo||canCancel)&&(` → `{(canVideo||canCancel||canReview)&&(}`
- `completed` 상태 예약에서 리뷰 버튼이 전혀 표시되지 않던 버그 수정

---

## 장기 과제 L~N (2026-05-02)

### L: 검사 결과 공유 버튼

**maumful-main/public/static/app.jsx**

- `ShareResultButton({ text })` 컴포넌트 추가 (AiAnalysisBox 정의 바로 위)
  - Web Share API 우선 (`navigator.share`), fallback: clipboard 복사
- 6개 결과 뷰에 추가: PHQ9 / GAD7 / BURNOUT / BIG5 / LOST / DSI
  - 각 뷰의 `<AiAnalysisBox />` 바로 뒤, ExpertCTA 앞에 삽입
  - 검사 유형별 맞춤 공유 텍스트 (점수/레벨/유형 포함)

### M: 마음게임 AI 마음 일기

**maumgame-main/src/index.tsx**

```typescript
// GET /api/game/ai-diary
// 오늘 감정 기록(mood game) + 최근 감사 일기(gratitude) 기반 1인칭 마음 일기
// "오늘 나는..."으로 시작, 2-3문장, 100자 이내
// game_ai_cache(game_id='diary') KST 일 단위 캐시
// 감정/감사 데이터 없으면 noData:true 반환
```

**maumgame-main/public/static/game_hub.jsx**

- `AIDiarySection` 컴포넌트 추가 (EmotionWeeklyReport 위에 삽입):
  - 초기 상태: "✍️ 일기 생성" 버튼 표시
  - 생성 후: 초록 그라디언트 배경에 일기 텍스트 + 공유 버튼
  - `noData` 시 컴포넌트 숨김 (감정/감사 기록이 없는 경우)

### N: 마음커플 관계 타임라인

**package/maumcouple/src/index.tsx**

```typescript
// GET /api/couple/timeline
// 커플 세션(reported/both_done/expired) + 관계 체크인 통합 → 날짜 내림차순 정렬
// 아이템 타입: 'report' / 'session' / 'checkin'
// 각 항목: type, date, title, subtitle, score(optional), emoji
```

**package/maumcouple/public/static/couple_hub.jsx**

- `RelationshipTimelineView` 컴포넌트 추가:
  - 수직 타임라인 레이아웃 (왼쪽 라인 + 원형 아이콘)
  - 타입별 색상 구분: report(로즈) / session(스카이) / checkin(그린)
  - AI 리포트는 궁합 점수 프로그레스 바 표시
  - 관계 체크인은 xx/50점 프로그레스 바 표시
- `CoupleHubApp`에 `'timeline'` 뷰 라우팅 추가
- 허브 빠른 액션 그리드: 3열 → 2×2 변경 + 🗂️ 관계 타임라인 버튼 추가

---

## 마음게임 고도화 로드맵 (2026-05-02~)

### 현황 분석

게임 6종 (mood/garden/efmt/gratitude/tree/burnout) + 기초 EXP/레벨/업적 시스템 존재.
`DailyQuestCard`가 이미 있으나 로컬스토리지 기반이고 스트릭 복구/마일스톤 미구현.

### 1순위: 스트릭 강화 + 데일리 퀘스트 고도화

#### DB 마이그레이션

```
maumgame-main/migrations/0004_streak_recover.sql
→ ALTER TABLE user_game_status ADD COLUMN streak_recover INTEGER NOT NULL DEFAULT 0
  (스트릭 복구권: 7일 연속 도달 시 +1 지급, 최대 3개 보유)
```

#### maumgame-main/src/index.tsx

- `GameStatus` 타입에 `streak_recover` 추가
- 스트릭 계산 KST 기준으로 수정 (`Date.now() + 9h`)
- 7/14/21/30일 마일스톤 도달 시 `streak_recover = MIN(streak_recover+1, 3)` 지급
- `POST /api/game/streak/recover` — 복구권 1개 소모 → streak_days+1 복원

#### maumgame-main/public/static/game_hub.jsx

- `StreakCalendar` 강화:
  - 스트릭 3일+ → 🔥, 7일+ → 🔥🔥, 14일+ → 🔥🔥🔥
  - 다음 마일스톤(3/7/14/30) 프로그레스 바
  - streak=0 + recover>0 시 "🛡️ 복구권 사용" 버튼 표시
- `DailyQuestCard` 강화:
  - 날짜+userId 시드 → 유저별 다른 퀘스트 배정
  - 퀘스트 완료 시 인라인 체크 애니메이션
  - 보너스 EXP 수령 완료 후 스트릭 복구권 보유량 표시

### 2순위: 감정꽃(EFMT) 게임 난이도 고도화

#### maumgame-main/public/static/games/efmt.jsx

- 콤보 시스템: 연속 정답 3/5/10개 → 점수 배율 1.5x/2x/3x
- 시간압박 레벨 (라운드별 타이머 표시)
- 개인 베스트 스코어 표시 + 갱신 시 "🏆 신기록!" 팝업
- 기존 PHQ-9 난이도 조정은 유지

### 3순위: 마음 집중력 게임 신규 추가

#### maumgame-main/public/static/games/focus.jsx (신규)

- 숫자/패턴 기억 → 재현 (n-back 기반 단기기억 훈련)
- 3가지 난이도: 쉬움(2자리)/보통(3자리)/어려움(4자리+색상)
- 집중도 점수 → AI 코멘트 연동

#### maumgame-main/src/index.tsx

- `/api/game/focus-score` 엔드포인트 추가 (일별 집중도 추이)

### 4순위: 스토리 캠페인 모드

- 3챕터 구성: 마음 챙기기 → 관계 회복 → 성장
- 챕터당 게임 조합 + 완료 보상 (전용 뱃지 + 크레딧)
- `game_campaign_progress` 테이블 신규 추가

### 핵심 원칙

- **재방문 동기**: 일일 미션 + 스트릭 = Duolingo 패턴 적용
- **진행감**: 연속 출석 마일스톤 + 복구권 → 포기 방지
- **난이도 곡선**: 기존 PHQ-9 연동 유지, 추가 개인화 레이어만 얹기
- **게임 ID 목록**: `garden` / `mood` / `efmt` / `gratitude` / `tree` / `burnout` / `focus`(신규)

---

## 코드베이스 에러 검증 결과 (2026-05-02)

3개 서비스 전체를 대상으로 API 엔드포인트 일치, 컴포넌트 로딩 순서, 응답 구조, migration 파일, TypeScript Bindings 등 총 31개 항목을 검증한 결과 **실질적인 버그 없음**.

### maumgame-main (9/9 통과)

| 항목 | 결과 |
|---|---|
| game_engine.jsx return 객체 완전성 | ✅ `apiFetch` 포함 17개 메서드 전부 export |
| game_hub.jsx → GameEngine 메서드 호출 (16개) | ✅ 전부 존재 |
| game_registry.jsx 컴포넌트 참조 (7종) | ✅ MoodGame~FocusGame 전부 정의됨 |
| 스크립트 로딩 순서 | ✅ engine → games → registry → hub 올바름 |
| API 엔드포인트 일치 (16개) | ✅ 전부 index.tsx에 정의됨 |
| campaign steps 프론트↔백 동기화 | ✅ CAMPAIGN_DEF ↔ CAMPAIGN_CHAPTERS 일치 |
| migration 파일 0001~0005 | ✅ 충돌·누락 없음 |
| FocusGame 파일/등록/로드 | ✅ 3단계 전부 확인 |
| TypeScript Bindings 타입 | ✅ 모든 env.X optional 선언 |

### maumcouple (10/10 통과)

| 항목 | 결과 |
|---|---|
| API 엔드포인트 일치 (16개) | ✅ 전부 정의됨 |
| 응답 구조 일치 | ✅ 모든 필드 일치 |
| 크레딧 차감 로직 | ✅ spendCredits + credit_transactions 기록 |
| View 라우팅 완전성 | ✅ SessionWaitingView는 hub 내 `hasActive` 조건으로 인라인 렌더링 (별도 뷰 불필요) |
| PartnerMomentsSection 구조 | ✅ hasPartner/partnerName/moodEntries/gratEntries 일치 |
| WebPush VAPID Bindings | ✅ VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 선언됨 |
| Cron 스케줄 일치 | ✅ 0 3 1 * * / 0 23 * * 0 양쪽 처리됨 |
| migration 파일 | ✅ relationship_checkins(0002), push_subscriptions(maumful 0014), credit_transactions·game_session_logs(공유 DB) |
| RESEND_API_KEY Bindings | ✅ optional 선언 + 사용 전 검증 |
| TypeScript Bindings 완전성 | ✅ 모든 env.X 선언됨 |

### maumful-main (12/12 통과)

| 항목 | 결과 |
|---|---|
| API 엔드포인트 일치 | ✅ |
| couple-token / save-result | ✅ 메서드·헤더·바디 일치 |
| ?start= stale closure 없음 | ✅ 의존성 배열 [view] 포함 |
| saveCoupleResult 호출 시점 | ✅ advanceToNextTest() 직전 호출 확인 |
| returnToCouple 2.5초 자동 복귀 | ✅ useEffect cleanup 포함 |
| ShareResultButton 6개 결과 뷰 | ✅ phq9/gad7/burnout/big5/lost/dsi 전부 삽입 |
| 추천 검사 카드 조건 로직 | ✅ PHQ9 30일 / BIG5 90일 / BURNOUT 조건 정확 |
| SVG 차트 데이터 2개 미만 안전 처리 | ✅ `rows.length >= 2` 가드 + null 반환 |
| Bindings optional 선언 | ✅ VAPID·RESEND·GOOGLE_CLIENT_ID 전부 `?` |
| migration 순서 및 충돌 (0001~0014) | ✅ 순차 안전, 중복 ALTER 없음 |
| AI Gateway URL | ✅ api.anthropic.com 직접 호출 없음 |
| 어드민 탭 렌더링 완전성 | ✅ AdminUsers·Reviews·ErrorLogs 전부 분기 처리 |

### 검증 중 발견·수정한 버그

| 버그 | 내용 | 수정 방법 |
|---|---|---|
| `GameEngine.apiFetch` undefined | `AIDiarySection`에서 정의되지 않은 메서드 호출 → AI 마음 일기 버튼 클릭 시 TypeError | game_engine.jsx에 `apiFetch(path, init)` 추가 후 배포 완료 |

---

## 8호 게임 + UX/인사이트 강화 (2026-05-02)

### 8호: 걱정 풍선 (Worry Bubbles)

**파일**: `maumgame-main/public/static/games/worry.jsx`

- ACT(수용전념치료) 인지 탈융합(cognitive defusion) 기법 기반
- 걱정 1~3개 입력 → 풍선 생성 → 클릭해서 팝 → 완료
- 입장: Lv.1 해금 (무료, 크레딧 없음)
- 게임 ID: `worry`, EXP: 걱정 1개당 30점

**변경된 파일:**

| 파일 | 변경 내용 |
|---|---|
| `games/worry.jsx` | 신규 — WorryGame 컴포넌트 (intro/input/pop/done 4단계) |
| `game_registry.jsx` | GAME_REGISTRY에 worry 항목 추가 (8번째 게임) |
| `src/index.tsx` | `worry.jsx` 스크립트 태그 추가, UNLOCK_MAP 1~6레벨에 worry 추가, focus도 3레벨에 추가 |
| `game_hub.jsx` | `activeGame === 'worry'` 렌더링 케이스 추가 |

### 4번: 성능/UX 개선

**변경된 파일**: `game_hub.jsx`, `src/index.tsx`

| 항목 | 내용 |
|---|---|
| `GameCardSkeleton` | 게임 카드 모양의 shimmer 스켈레톤 컴포넌트 |
| `GameHubSkeleton` | 전체 허브 스켈레톤 — 기존 "정원을 불러오는 중..." 텍스트 대체 |
| `game-card-enter` CSS | `@keyframes cardEnter` — 카드 등장 시 translateY(16px)→0 + scale(0.97)→1 |
| stagger delay | `games.map((g, i) => <GameCard enterDelay={i*50}>)` — 50ms 간격 순차 등장 |
| 터치 피드백 | `pressed` state + `scale(0.96)` transform — 모바일 터치 시각 반응 |
| `hub-top-bar` | 로딩 시 상단 3px 진행 바 (sage 그라데이션) |
| `skeleton-shimmer` CSS | 90deg → 200% background-size shimmer 반복 |

### 5번: 분석/인사이트 강화

**변경된 파일**: `game_hub.jsx`

| 항목 | 내용 |
|---|---|
| `WeekMoodSummaryCard` | 이번 주 7일 감정 흐름 원형 도트 차트 — `getMoodHistory(7)` 기반 |
| `GAME_META` worry 추가 | GAME_META에 `worry: { name:'걱정 풍선', emoji:'🫧' }` 추가 |
| `TodayRecommendCard` GAD-7 연동 | GAD-7 ≥ 10점 시 걱정 풍선 우선 추천, PHQ-9 ≥ 5점 시도 worry 추천 |
| worry 미플레이 추천 | 최근 5세션에 worry 없으면 "걱정 풍선으로 마음속 짐을 가볍게" 추천 |

**WeekMoodSummaryCard 동작:**
- `GameEngine.getMoodHistory(7)` 호출
- 이번 주 일~토 7칸 도트 표시 (감정 이모지 + 강도 기반 색상)
- 오늘 날짜 sage 테두리 강조
- 기록 0일이면 렌더링 안 함
- 주요 감정 1개 + 기록 일수 요약 텍스트

**배포**: `npx wrangler deploy` 완료 → Version `a2b769a5`

---

## CTS The Light of Life — 프로젝트 (cts-maum-main)

### 프로젝트 개요

```
cts-maum-main/  → https://lightoflife.limyj007.workers.dev (운영중)
                   CTS 기독교TV 공식 마음 치유 서비스
                   DB: lightoflife-db (maumful-db와 완전히 별개)
```

**포지셔닝**: 기독교 상담으로 교회·교단을 지원하는 B2B 서비스. 개인 소비자(B2C)가 아닌 교회와 성도 대상.

### 디자인 시스템

```
NAV    = '#0F2044'  (CTS 딥 네이비)
GOLD   = '#C9A227'  (골드 포인트)
PURPLE = '#6B21A8'  (퍼플 보조)
```

- 이모지 썸네일 사각형 사용 금지 — 아마추어적으로 보임
- 서비스 카드: 컬러 좌측 보더 + 번호(01~04) + 영문 레이블 + bullet 리스트 스타일
- 무료 검사: 네이비 다크 배너 전체 폭 활용
- 심층 검사: 컬러 상단 보더 4열 그리드

### 구현된 기능 (2026-05-03 기준)

| 파일 | 내용 |
|---|---|
| `migrations/0015_bible_verses.sql` | bible_verses 테이블, 128개 말씀 삽입 |
| `src/index.tsx` | `/api/bible/today`, `/api/bible/for-test` 엔드포인트 |
| `public/static/app.jsx` | `VerseBox` 컴포넌트 (7개 검사 결과 뷰에 삽입), 오늘의 말씀 대시보드 위젯, `?program=` CTS TV 파라미터 처리, CTS 환영 배너 |
| `public/static/counseling.jsx` | 기독교 상담사 배지(✝️), `기독교상담` 필터 버튼, is_biblical 필드 |
| `public/static/landing.jsx` | 전면 재설계 — CTS 네이비+골드 디자인 |

### landing.jsx 섹션 구조

1. **HERO** — 딥 네이비 배경, 골드 CTS 배지, 오늘의 말씀 글래스 카드
2. **MINISTRY PROGRAMS** — 2×2 그리드, 컬러 좌측 보더, 번호+레이블+설명+bullet
3. **모바일 말씀** — 모바일 전용 오늘의 말씀
4. **HOW IT WORKS** — 4단계 플로우
5. **ASSESSMENT PROGRAMS** — 무료(네이비 배너 2분할) + 심층(4열 카드)
6. **BIBLICAL COUNSELING** — 다크 섹션, 3 특징 카드
7. **CTS 신뢰 배너**
8. **최종 CTA**
9. **위기상담 바 + FOOTER**

### Bible Verses API

```typescript
// GET /api/bible/today → 오늘의 말씀 (KST 기준 day-of-year % 52 순환)
// GET /api/bible/for-test?testType=PHQ9&score=12 → 검사 결과 맞춤 말씀
// context 매핑: PHQ9(low/mild/moderate/severe), GAD7, BURNOUT, DASS21, BIG5, DSI(low/high), LOST, SRCI
```

### CTS TV 연동

- `?program=프로그램명` URL 파라미터 → `lol_program_source` localStorage 저장
- 대시보드에 CTS 환영 배너 표시 (✝️ 기독교 상담사 찾기 / 마음 건강 검사 시작 CTA)
- `lol_counseling_biblical` localStorage 플래그 → 상담사 페이지 자동 기독교 필터

### AI Gateway

```
https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages
```
api.anthropic.com 직접 호출 금지 (WAF 차단). maumful과 동일한 Gateway 사용.

### 미등록 Secrets (배포 전 필요)

```powershell
cd cts-maum-main
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put TOSS_SECRET_KEY
npx wrangler secret put TOSS_CLIENT_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MASTER_EMAIL   # CTS 관리자 이메일
# SERVICE_URL → CTS 도메인 확정 후 등록
```

---

## CTS 버그 수정 이력 (2026-05-04)

### 🔴 app.jsx 한국어 인코딩 손상

**원인**: 파일 편집 과정에서 EUC-KR/CP949 인코딩 충돌 → 한국어 문자가 `?? ` 패턴으로 손상, 40줄 이상 unterminated string 발생.

**증상**: 브라우저 콘솔 `Uncaught SyntaxError: Unterminated string constant` (line 264, 517 등 순차 발생)

**수정**: 
```powershell
cd cts-maum-main
git checkout HEAD -- public/static/app.jsx
npx wrangler deploy
```
→ git HEAD 원본 복원으로 전체 해결. sed로 개별 라인 수정은 불충분 (40+ 라인 손상).

**재발 방지**: app.jsx 수정 시 반드시 UTF-8 (without BOM) 인코딩으로 저장. 편집 후 `git diff`로 `??` 패턴 여부 확인.

---

### 🔴 치유 게임 연동 SSL 에러 (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)

**원인**: `landing.jsx`, `app.jsx`에 하드코딩된 게임 URL이 존재하지 않는 도메인을 가리킴.

| 파일 | 잘못된 URL | 수정된 URL |
|---|---|---|
| `landing.jsx` | `game.lightoflife.limyj007.workers.dev` | `game.maumful.com` |
| `app.jsx` (2곳) | `lightoflife-game.limyj007.workers.dev` | `game.maumful.com` |

**동작 원리**: CTS(`lightoflife-db`)와 maumgame(`maumful-db`)은 DB가 다르지만, **동일한 KV(JWT_SECRET)** 를 공유하므로 CTS 발급 game-token을 maumgame이 정상 검증한다.

**추가 개선**: `landing.jsx`의 게임 링크를 `access_token` 직접 전달에서 `/api/game-token` 7일 토큰 발급 방식으로 변경.

---

## CTS OG 이미지 (SNS 링크 공유 썸네일)

### public/static/og-image.svg

- 크기: 1200×630 (SNS 공유 표준)
- 스타일: 딥 네이비 그라디언트 배경 + 골드 십자가 + 빛 방사선
- 텍스트: "THE LIGHT OF LIFE" (Georgia 세리프, 골드) + "말씀으로 회복하는 마음" (흰색) + John 8:12 인용
- 장식: 십자가 글로우 후광, 동심원 링, 도트 divider

### src/index.tsx 메타태그 변경

```html
<!-- Before -->
<meta property="og:image" content="${siteUrl}/static/icon-512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta name="twitter:card" content="summary">

<!-- After -->
<meta property="og:image" content="${siteUrl}/static/og-image.svg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
```

> **참고**: 카카오톡은 SVG OG 이미지를 지원하지 않을 수 있음. 카카오 공유까지 지원하려면 og-image.svg → og-image.png로 변환 후 교체 필요.

---

## CTS 완전 독립 인프라 구축 (2026-05-04)

### 구축 완료 사항

| Worker | URL | DB | KV |
|---|---|---|---|
| `lightoflife` (메인) | `lightoflife.limyj007.workers.dev` | `lightoflife-db` | `75bddd6d...` |
| `lightoflife-game` | `lightoflife-game.limyj007.workers.dev` | `lightoflife-db` | `75bddd6d...` |
| `lightoflife-couple` | `lightoflife-couple.limyj007.workers.dev` | `lightoflife-db` | `75bddd6d...` |

3개 Worker가 모두 동일한 KV (`75bddd6d...`)를 공유하므로 `JWT_SECRET`이 통일 → SSO 토큰 교차 검증 가능.

### 스테이징 DB

| DB | ID |
|---|---|
| `lightoflife-db-dev` | `e226ed51-233e-47f0-aac2-3d8f335f1fe5` |

`wrangler.dev.toml` (cts-maum-main): `lightoflife-db-dev` 바인딩 완료.

### 적용된 마이그레이션

**lightoflife-db (프로덕션):** CTS 0001~0016 + maumgame 0001~0005 + maumcouple 0001~0002  
**lightoflife-db-dev (스테이징):** CTS 0001~0016 + maumgame 0001~0003,0005 + maumcouple 0002

### 배포 설정 파일

| 파일 | 용도 |
|---|---|
| `maumgame-main/wrangler.lightoflife.toml` | lightoflife-game 배포 (cron 없음 — 5개 한도 초과) |
| `package/maumcouple/wrangler.lightoflife.toml` | lightoflife-couple 배포 (cron 없음) |

### SSO 흐름 (CTS)

```
lightoflife (메인) 로그인
  → GET /api/game-token   → 7일 JWT (type:'game')   → lightoflife-game.limyj007.workers.dev?t=
  → GET /api/couple-token → 7일 JWT (type:'couple') → lightoflife-couple.limyj007.workers.dev?t=

lightoflife-game / lightoflife-couple
  → KV에서 JWT_SECRET 조회 (동일 KV) → 토큰 검증 성공
  → user_id로 lightoflife-db 조회 (동일 DB)
```

### couple_hub.jsx MAUMFUL_URL 감지 로직

```javascript
const MAUMFUL_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
  if (h.includes('lightoflife')) return 'https://lightoflife.limyj007.workers.dev';  // ← CTS 추가
  if (h.includes('maumcouple-dev') || h.includes('-dev.')) return 'https://maumful-dev.limyj007.workers.dev';
  return 'https://maumful.com';
})();
```

### Cron 한도 초과 문제

Cloudflare Workers 무료 플랜: cron 최대 5개.  
현재 등록된 cron: `lightoflife`(1) + `maumcouple`(2) + 기타(2) = 5개 이미 사용 중.  
→ `lightoflife-game`, `lightoflife-couple`의 wrangler.lightoflife.toml에서 `[triggers]` 섹션 제거.  
주간 요약 이메일(maumgame) 및 만료 세션 정리(maumcouple)는 CTS 전용 배포에서 비활성.

### 미등록 Secrets (lightoflife-game, lightoflife-couple)

```powershell
# ANTHROPIC_API_KEY는 wrangler secret put으로 자동 전달됨 (이미 등록)
# 필요 시 추가 등록:
cd maumgame-main      && npx wrangler secret put RESEND_API_KEY --config wrangler.lightoflife.toml
cd package/maumcouple && npx wrangler secret put RESEND_API_KEY --config wrangler.lightoflife.toml
```

---

## 음성 AI 상담 검토 결과 (2026-05-04, 미구현)

### 기술 구성 요소

```
사용자 음성 입력
  → STT (Speech-to-Text): 음성 → 텍스트
  → Claude AI: 텍스트 → 텍스트 응답
  → TTS (Text-to-Speech): 텍스트 → 음성 출력
```

### STT 옵션 비교

| 옵션 | 비용 | 한국어 | 특이사항 |
|---|---|---|---|
| Web Speech API (브라우저 내장) | 무료 | 지원 | Chrome 전용, Google 서버 전송 |
| OpenAI Whisper API | 유료 | 우수 | 오디오 파일 전송 필요 |

→ **Web Speech API** 가 비용 없이 가장 빠르게 구현 가능.

### TTS 옵션 비교

| 옵션 | 비용 | 음질 | 특이사항 |
|---|---|---|---|
| SpeechSynthesis (브라우저 내장) | 무료 | 낮음 (기계적) | 서버 불필요 |
| Naver Clova Voice | 유료 | 높음 | 한국어 최고 품질 |
| ElevenLabs | 유료 | 높음 | 영어 강점, 한국어도 가능 |
| Google TTS | 유료 | 중간 | GCP 계정 필요 |

### 핵심 문제점

**1. 지연 시간**: STT → AI → TTS 3단계 직렬 처리 → 최소 5~10초 지연. 심리 상담 맥락에서 침묵이 불편함을 유발할 수 있음.

**2. 개인정보 민감도**: 음성 녹음은 텍스트보다 민감. Web Speech API는 Google 서버로 음성 전송 → 개인정보처리방침에 "음성 데이터 수집·처리" 명시 및 사용자 동의 절차 필요.

**3. Cloudflare Workers 제약**: 오디오 스트리밍은 Workers 응답 크기 제한에 걸릴 수 있음. TTS는 클라이언트 사이드에서 처리하는 것이 안전.

### 권장 단계적 구현 계획 (미구현)

**1단계 (즉시 구현 가능, 추가 비용 없음)**
- Web Speech API로 마이크 버튼 추가 → 음성 → 텍스트 변환 → 기존 채팅 박스 입력
- TTS 없이 AI 응답은 텍스트로만 표시
- 구현 난이도: 낮음 (이틀 이내)

**2단계 (선택적)**
- "음성으로 듣기" 버튼 추가
- 브라우저 내장 SpeechSynthesis로 텍스트 읽기
- 음질은 낮지만 무료

**3단계 (프리미엄 기능화)**
- Naver Clova Voice 연동 (한국어 최고 품질)
- 크레딧 소비 기능으로 수익 모델화 가능

### 결론

1단계(음성 입력만)는 구현 대비 효용이 높고 리스크 없음. 완전한 음성 상담은 지연·비용·법적 고지 문제로 현 단계에서는 1단계만 구현하고 사용자 반응을 보고 2~3단계 결정을 권장.

---

## 경쟁력 강화 4단계 기능 (2026-05-04)

### 1단계: AI 심층 분석 — 누적 트렌드 컨텍스트 주입

**maumful-main/src/index.tsx — /api/ai-chat**

- 3회 이상 동일 검사 수행 시 트렌드 데이터를 Claude system prompt에 자동 주입
- 쿼리: `SELECT score, performed_at FROM test_history WHERE user_id=? AND test_type=? AND score IS NOT NULL ORDER BY performed_at DESC LIMIT 5`
- 포맷: `[누적 트렌드 - PHQ9 최근 3회]: 2026-04-01 12점 → 2026-04-15 9점 → 2026-05-01 7점 (-5점 호전)`
- 적용 대상: PHQ9/GAD7/BURNOUT/DSI (GENERAL 제외)

**maumful-main/public/static/app.jsx — AI 상담 뷰**

- 트렌드 분석 활성 배지: 3회 이상 데이터 있는 검사 유형에 `📈 {TYPE} 트렌드 분석 활성` 인디고 배지 표시

### 2단계: AI 능동적 체크인 카드

**maumful-main/public/static/app.jsx — memberDashboard**

- 마지막 검사 후 경과일 기반 맞춤 인사말 카드 (바이올렛 그라디언트)
- `maumful_ai_checkin_${오늘날짜}` localStorage 키로 하루 1회 표시
- "AI와 대화하기 →" 버튼 → aiCounsel 뷰 이동
- 검사 이력이 없으면 표시 안 함

### 3단계: 상담사 예약 시 검사 결과 공유

**maumful-main/migrations/0015_appointments_test_summary.sql** (프로덕션 적용 완료)
```sql
ALTER TABLE appointments ADD COLUMN test_summary TEXT;
```

**maumful-main/src/index.tsx — POST /api/counseling/appointments/prepare**
- `shareTestResult: boolean` 파라미터 수신
- true 시 최근 3건 검사 결과 요약 → `test_summary` 컬럼에 저장

**maumful-main/public/static/counseling.jsx — BookingModal**
- step 2에 "📋 검사 결과 상담사에게 미리 공유" 토글 추가
- `shareResult` state → `handlePay`에서 `shareTestResult`로 전달

### 4단계: 외부 검사 결과 입력 (수동 + PDF AI 해석)

#### DB 마이그레이션

| 파일 | 내용 |
|---|---|
| `migrations/0016_test_history_source.sql` | `ALTER TABLE test_history ADD COLUMN source TEXT NOT NULL DEFAULT 'internal'` |
| `migrations/0017_add_ai_analysis.sql` | `ALTER TABLE test_history ADD COLUMN ai_analysis TEXT` |

→ 프로덕션(maumful-db) + 스테이징(maumful-db-dev) 모두 적용 완료

#### maumful-main/src/index.tsx — 추가된 엔드포인트

| 엔드포인트 | 설명 |
|---|---|
| `GET /api/test/recent-summary` | 최근 5건 검사 요약 문자열 반환 (예약 공유용) |
| `POST /api/test/external-result` | 외부 검사 점수 수동 저장 (source='external') |
| `POST /api/test/analyze-pdf` | PDF 텍스트 → AI 비임상 해석 + 게임/재검사 추천 |

**analyze-pdf 특징:**
- 모델: `claude-haiku-4-5-20251001` (고정)
- 분석 구조: 주요 성향 / 일상 속 패턴 / 강점 / 성장 포인트 / 마음풀 추천 활동
- GAMES:[...] / FOLLOWUP:[...] 파싱 → 게임 버튼 + 연결 검사 버튼 렌더링
- 임상 표현 절대 금지 시스템 프롬프트
- PDF 텍스트 제한: 50자 이상, 20000자 이하

#### maumful-main/public/static/app.jsx — ExternalResultSection 컴포넌트

- 마이페이지 → 검사 이력 탭 상단에 "📥 외부 검사 결과 입력 · AI 해석" 버튼
- 탭 1 (수동 입력): 검사 유형/점수/날짜/메모 → test_history 저장
- 탭 2 (PDF): PDF.js v3.11.174 CDN으로 텍스트 추출 → AI 분석 → 결과 표시
- 지원 검사: MBTI·TCI·MMPI·로샤·SCT·HTP·WAIS·에니어그램·DISC·홀랜드 등

---

## 핵심 버그 수정 이력 추가 (2026-05-04)

### 🔴 test_history.ai_analysis 컬럼 누락

**원인**: `analyze-pdf` INSERT 쿼리가 `ai_analysis` 컬럼을 참조했으나 프로덕션 DB에 해당 컬럼이 없었음. 기존 코드에서 이미 `ai_analysis`를 사용하고 있었지만 마이그레이션 누락.

**증상**: POST /api/test/analyze-pdf → 500 Internal Server Error (app.onError에서 잡힘), 프론트에서 "서버 오류가 발생했습니다." 표시.

**디버깅 과정**:
1. `source` 컬럼 존재 확인 → 정상
2. catch-all try-catch 추가 배포 → 실제 에러 메시지 확인
3. 에러: `D1_ERROR: table test_history has no column named ai_analysis`

**수정**: `wrangler d1 execute maumful-db --remote --command="ALTER TABLE test_history ADD COLUMN ai_analysis TEXT"` 직접 실행 + migration 0017 파일 생성.

### 🔴 ExternalResultSection 분석 완료 후 모달 사라짐

**원인**: `ExternalResultSection`이 `PsychologicalTestSystem` 함수 내부에 중첩 정의됨 → 부모가 리렌더링될 때마다 React가 새 컴포넌트 타입으로 인식 → 언마운트/리마운트 → 로컬 state 초기화.

분석 완료 시 `onSaved()` → `loadTestHistory()` → `setTestHistory()` → 부모 리렌더링 → 모달 사라짐.

**수정**: `onSaved()` 호출 시점을 분석 완료 시점에서 → `closeModal()` 호출 시점으로 이동. 모달이 열려 있는 동안은 리렌더링이 발생해도 닫히지 않음.

**재발 방지**: `PsychologicalTestSystem` 내부에 컴포넌트 함수를 정의하지 말 것. 부모 함수 밖으로 이동하거나, state를 부모로 끌어올려야 함.

---

## test_history 테이블 최종 스키마 (2026-05-04 기준)

```
id, user_id, test_type, lang, credits_spent, performed_at,
result_json, score, level, source, ai_analysis
```

- `source`: 'internal' (기본, 마음풀 내 검사) | 'external' (외부 입력/PDF)
- `ai_analysis`: AI 분석 텍스트 (최대 1000자 저장)

---

## UI/UX 버그 수정 이력 (2026-05-04)

### 🔴 AI 채팅 프레임 높이 부족 (모바일)

**원인**: 채팅 메시지 컨테이너가 `h-80`(320px 고정)으로 모바일에서 AI 답변이 프레임을 넘침.

**수정**: `h-80` → `h-[50vh]` (뷰포트 비율 기반으로 변경)

**적용 파일**:
- `maumful-main/public/static/app.jsx` (line ~5142) — 배포 완료 Version `79a7ad14`
- `cts-maum-main/public/static/app.jsx` (line ~5141) — 배포 완료 Version `3afba991`

---

### 🔴 AI 채팅 사용자 버블 우측 잘림 (모바일)

**원인**: `max-w-xs`(320px 고정) + 아바타(36px) = 356px → iPhone SE 컨테이너(343px) 초과.

**수정**: `max-w-xs lg:max-w-md xl:max-w-lg` → `max-w-[75%] min-w-0` (비율 기반 + flex 오버플로 방지)

**적용 파일**:
- `maumful-main/public/static/app.jsx` (line ~5160)
- `cts-maum-main/public/static/app.jsx` (line ~5159)

---

### 🔴 소개자료 HTML — 모바일 슬라이드 전환 불가 (pic/ 폴더)

**원인 1**: `.slide`에 `overflow:hidden` 미적용 → 슬라이드 내부 콘텐츠가 아래로 넘쳐 nav 버튼 위를 투명하게 덮음 → `pointer-events` 충돌로 탭 이벤트 차단.

**원인 2**: iOS Safari에서 `100vh`가 브라우저 크롬 포함 높이로 계산 → 레이아웃 어긋남.

**원인 3**: nav 버튼 `bottom` 고정값이 iPhone 홈 인디케이터에 가려짐.

**원인 4**: 스와이프 감지가 X축만 체크 → 수직 스크롤 의도 시도 수평 전환 오인식.

**수정 내용**:

| 항목 | 수정 |
|---|---|
| `.slide` CSS | `overflow:hidden` 추가 |
| body/deck 높이 | `height:100dvh` 추가 (100vh fallback 유지) |
| nav 위치 | `bottom:max(26px, env(safe-area-inset-bottom, 26px))` |
| 스와이프 로직 | Y축 동시 추적 → `Math.abs(dx) > Math.abs(dy)` 조건 추가 |
| overscroll | `overscroll-behavior:none` 추가 |

**적용 파일**: `pic/cts_internal.html`, `pic/maumful_B2B.html`, `pic/maumful_B2C.html`  
(로컬 파일 — 별도 배포 불필요)

---

## CTS 치유게임 SSO 버그 수정 (2026-05-05)

### 🔴 CTS 메인 → 치유게임 이동 시 `/api/game/me` 401

**원인**: `cts-maum-main`(`lightoflife`)이 game-token을 서명할 때 KV에 `JWT_SECRET`이 없으면 `'dev_secret_change_in_production'` fallback을 사용하는데, `cts-game-main`(`lightoflife-game`)의 JWT 검증 함수는 이 fallback이 없어 `secret = null` → 검증 실패 → 401.

**서비스별 fallback 비교**:

| 서비스 | KV 없을 때 fallback | 동작 |
|---|---|---|
| `cts-maum-main` (서명) | `'dev_secret_change_in_production'` | 토큰 발급 성공 |
| `lightoflife-couple` (검증) | `env.JWT_SECRET ?? 'dev_secret_change_in_production'` | 검증 성공 ✅ |
| `lightoflife-game` (검증) | `env.JWT_SECRET` (끝) | 검증 실패 ❌ |

**왜 커플케어는 되고 치유게임만 안 됐나**: `lightoflife-couple`의 `src/index.tsx`는 3단계 fallback이 있었고, `lightoflife-game`만 2단계에서 멈춰 있었음.

**수정**: `cts-game-main/src/index.tsx` line 74

```typescript
// Before (검증 실패)
const secret = (env.KV ? await (env.KV as KVNamespace).get('JWT_SECRET') : null) ?? env.JWT_SECRET

// After (수정)
const secret = (env.KV ? await (env.KV as KVNamespace).get('JWT_SECRET') : null) ?? env.JWT_SECRET ?? 'dev_secret_change_in_production'
```

**배포**: `cd cts-game-main && npx wrangler deploy` → Version `96f7260d`

**재발 방지**: 3개 서비스(lightoflife / lightoflife-game / lightoflife-couple) JWT 검증 fallback은 반드시 동일해야 함. 새 서비스 추가 시 `KV.get('JWT_SECRET') ?? env.JWT_SECRET ?? 'dev_secret_change_in_production'` 3단계 패턴 필수.

### cts-game-main 콘솔 에러 수정 (2026-05-05)

| 에러 | 원인 | 수정 |
|---|---|---|
| `icon-192.png` / `icon-512.png` 404 | manifest.json에 존재하지 않는 아이콘 파일 참조 | `"icons": []`로 변경 |
| SW FetchEvent 503 | 구 sw.js가 캐시 미스 시 undefined 반환 | sw.js를 self-unregister cleanup SW로 교체 |
| favicon.ico / favicon.png 404 | 핸들러가 존재하지 않는 외부 URL fetch | `new Response(null, {status: 204})`로 변경 |
| `apple-mobile-web-app-capable` 경고 | 구버전 meta 태그 | `mobile-web-app-capable`로 변경 |

**cts-game-main/public/sw.js 최종 상태**:
```javascript
// Service Worker — cleanup: unregister any existing SW
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.registration.unregister());
});
```

### CTS 메인 콘솔 에러 수정 (2026-05-05)

**`/api/user/me` 401 in console**: 액세스 토큰 만료 시 `_fetch`가 자동 리프레시하지만 최초 401이 콘솔에 표시됨.

**수정**: `cts-maum-main/public/static/app.jsx` — `/api/user/me` 호출 전 JWT payload exp 클레임 미리 확인 → 만료 시 `api.refreshToken()` 선제 호출 → 401 콘솔 에러 방지.

---

## AI 고도화 + 마음게임 고도화 (2026-05-05)

### Phase 1 완료

#### 게임 → 상담 자동 연결 (maumgame-main/public/static/game_hub.jsx)

- `counselingPrompt` state 추가
- `handleGameExit` 에서 게임 종료 후 고위험 자동 감지:
  - 번아웃 게임 종료 + `userTestScores.BURNOUT >= 60` → 🔥 팝업
  - 감정 게임 종료 + intensity ≥ 4 + 부정 감정 → 💙 팝업
  - PHQ-9 ≥ 10 + burnout/mood/garden 게임 → 🌱 팝업
- 팝업: 위험 단계 배지 + 메시지 + "전문 상담사 연결하기" 버튼 → `maumful.com?go=counseling`
- `maumful-main/public/static/app.jsx`: `?go=counseling` URL 파라미터 핸들러 추가 → 로그인 시 바로 상담 뷰, 비로그인 시 post_login_view='counseling' 저장

**배포**: maumgame Version `d4f0edf2`, maumful Version `5f1956dc`

#### EFMT 감정꽃 고도화

이미 이전 세션에서 구현 완료 (콤보 1.5x/2x/3x, 타이머 긴박감, 개인 베스트 🏆 신기록 배지).

### Phase 2 완료

#### 대화 기억 유지 (maumful-main)

**백엔드** (`src/index.tsx`):
- KV 키: `chat_mem:{userId}` → JSON `{ [testType]: { date, points: string[] } }`
- `/api/ai-chat`: 호출 시 KV에서 이전 기억 로드 → 시스템 프롬프트에 `[이전 상담 기억]` 섹션 주입
- 메시지 4회 이상 교환 시 마지막 3개 사용자 메시지 KV에 자동 저장 (TTL 30일, `waitUntil` 비동기)
- `GET /api/ai-chat/memory` — 기억 목록 조회 (testType별 날짜+건수)
- `DELETE /api/ai-chat/memory` — 전체 기억 초기화

**프론트엔드** (`app.jsx` — ChatBox):
- 마운트 시 `/api/ai-chat/memory` 호출 → `hasMemory` state
- "📝 이전 대화 기억 중" 인디고 배지 표시 (✕ 초기화 버튼 포함)

**배포**: Version `ec88ddb8`

#### 장기 트렌드 예측 (maumful-main)

**백엔드** (`src/index.tsx`):
- `GET /api/test/trend-prediction?type=PHQ9` (인증 필요)
- 최근 10회 검사 이력 조회 → 선형 회귀로 다음 점수 예측
- Claude haiku로 비임상적 응원 코멘트 생성 (2문장)
- 응답: `{ predicted, trend, diffText, slope, comment, data }`

**프론트엔드** (`app.jsx` — memberDashboard):
- `TrendPredictionCard` 컴포넌트: PHQ9/GAD7/BURNOUT 중 3회 이상 검사한 유형에 표시
- 클릭 시 API 호출 → 예측 점수 + 트렌드(호전/악화/안정) + AI 코멘트
- "재검사하기" 버튼 연결

**배포**: Version `cf3526a9`

### Phase 3 완료 (2026-05-05)

#### 1. TTS 음성 출력 — 브라우저 SpeechSynthesis

**적용 파일**: `maumful-main/public/static/app.jsx`, `cts-maum-main/public/static/app.jsx`

- ChatBox 내 `speakingMsgId` state + `speakText(text, msgId)` 함수 추가
- AI 답변 버블 하단에 `🔊 듣기` / `⏸ 정지` 버튼 (스트리밍 완료 후만 표시)
- `window.speechSynthesis` 없는 환경에서는 버튼 미표시
- 한국어 음성 우선 선택 (`ko-KR`), `getVoices()` 지연 로딩 처리
- 마크다운 기호(`*#\`_~>`) 제거 후 읽기

```javascript
function speakText(text, msgId) {
  if (!window.speechSynthesis) return;
  if (speakingMsgId === msgId) { window.speechSynthesis.cancel(); setSpeakingMsgId(null); return; }
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`_~>]/g, '').replace(/\n+/g, ' ').trim();
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = 'ko-KR'; utt.rate = 1.0; utt.pitch = 1.0;
  const trySpeak = () => {
    const koVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'));
    if (koVoice) utt.voice = koVoice;
    utt.onend = () => setSpeakingMsgId(null); utt.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId); window.speechSynthesis.speak(utt);
  };
  window.speechSynthesis.getVoices().length ? trySpeak() : (window.speechSynthesis.onvoiceschanged = trySpeak);
}
```

**배포**: maumful Version `fd5a7d89`, cts-maum Version `900a4f71`

#### 2. 맞춤형 CBT 8주 플랜

**백엔드** (`maumful-main/src/index.tsx`):
```typescript
// GET /api/test/cbt-plan (인증 필요)
// PHQ9/GAD7/BURNOUT/DASS21 최근 점수 기반 Claude haiku로 8주 JSON 생성
// KV 캐시: cbt_plan:{userId}, 7일 TTL
// 응답: { plan: [{week, title, theme, practice, game, tip}], summary, scores, generatedAt }
```

**프론트엔드** (`maumful-main/public/static/app.jsx`):
- `CbtPlanCard` 컴포넌트: PHQ9/GAD7/BURNOUT/DASS21 이력 있을 때만 memberDashboard에 표시
- TrendPredictionCard 바로 아래, 검사 목록 위에 삽입
- 주차별 아코디언: 완료 체크(localStorage `cbt_done_weeks`), 프로그레스 바
- 추천 게임 버튼 → `openMaumGame(gameId)` 연동
- 8주 완주 시 축하 배너 표시

**배포**: maumful Version `fd5a7d89`

#### 3. 스토리 캠페인 모드 (이전 세션에서 완료)

- 백엔드: `GET /api/game/campaign`, `POST /api/game/campaign/claim` — 이미 구현됨
- 프론트: `CampaignSection` 컴포넌트 — 이미 구현됨
- DB: `game_campaign_progress` 테이블 + 인덱스 (0005_campaign.sql)
- **프로덕션 마이그레이션 적용 완료** (2026-05-05, maumful-db 테이블 수 28개로 확인)
