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

## 핵심 버그 수정 이력 (재발 방지)

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
- `JWT_SECRET`은 maumful KV와 동일한 KV 바인딩으로 자동 공유

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
