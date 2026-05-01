# 마음풀 / 마음게임 / 마음커플 — 프로젝트 통합 가이드

## 프로젝트 구조

```
maum/
├── maumful-main/      → maumful.com (메인, 운영중) / maumful-dev.limyj007.workers.dev (스테이징)
├── maumgame-main/     → game.maumful.com (운영중)
└── package/
    ├── maumcouple/    → couple.maumful.com (배포 예정) / maumcouple-dev.limyj007.workers.dev (스테이징)
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

`couple.maumful.com` DNS 및 Cloudflare Workers 커스텀 도메인 설정 필요.  
현재 스테이징만 가능 (`maumcouple-dev.limyj007.workers.dev`).

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
| `ANTHROPIC_API_KEY` | DB에 저장 | AI 분석 / 채팅 |
| `TOSS_SECRET_KEY` | wrangler secret | 결제 |
| `TOSS_CLIENT_KEY` | wrangler secret | 클라이언트 결제 UI |
| `ADMIN_SECRET` | wrangler secret | 관리자 API 인증 |
| `RESEND_API_KEY` | wrangler secret | 이메일 발송 |

### maumgame / maumcouple
- 별도 `ANTHROPIC_API_KEY` 환경변수 필요
- `JWT_SECRET`은 maumful KV와 동일한 KV 바인딩으로 자동 공유

## 마스터 계정

`limyj007@gmail.com` — 3개 서비스 모두 하드코딩됨.  
크레딧 무제한, 모든 기능 해금, 관리자 통계 접근 가능.
