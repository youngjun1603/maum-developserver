# 마음풀 / 마음게임 / 마음커플 — 프로젝트 통합 가이드

## 프로젝트 구조

```
maum/
├── maumful-main/      → maumful.com (메인, 현재 운영중)
├── maumgame-main/     → game.maumful.com (운영중)
└── package/
    ├── maumcouple/    → couple.maumful.com (배포 필요)
    ├── maumful/       → maumful-main 교체 예정본 (마음커플 연동 추가)
    └── D1_SQL_실행순서.sql
```

## 공유 인프라

| 리소스 | 이름 | 용도 |
|---|---|---|
| Cloudflare D1 | `maumful-db` | 3개 서비스 공유 DB |
| Cloudflare KV | `maumful KV` | JWT_SECRET 공유 |

모든 서비스는 동일한 `maumful-db` D1 인스턴스와 KV를 바인딩한다.

## SSO 흐름

```
마음풀 로그인 → accessToken(1h) + refreshToken(30d)

마음게임 진입:
  GET /api/game-token → 7일 전용 토큰 (type: 'game')
  → window.open('https://game.maumful.com?t=<token>')
  → maumgame: localStorage('game_token') 저장

마음커플 진입:
  GET /api/couple-token → 7일 전용 토큰 (type: 'couple')
  → window.open('https://couple.maumful.com?t=<token>')
  → maumcouple: localStorage('couple_token') 저장
```

JWT 시크릿은 KV의 `JWT_SECRET` 키 값을 우선 사용하며, 미설정 시 환경변수 fallback.

---

## 마음커플 연동 배포 순서

### Step 1 — D1 마이그레이션 (Cloudflare 콘솔)

```sql
-- package/D1_SQL_실행순서.sql 순서대로 실행
ALTER TABLE test_history ADD COLUMN result_json TEXT;
-- 이후 couple_sessions 테이블 + 인덱스 생성
```

### Step 2 — maumcouple 신규 Worker 배포

```bash
cd package/maumcouple
wrangler deploy
# → couple.maumful.com 커스텀 도메인 연결
```

### Step 3 — maumful 파일 업데이트 (선택적 병합 방식)

`package/maumful/` 버전을 **그대로 교체하지 말고**, 아래 항목만 선택 적용한다.

#### 3-1. src/index.tsx — 추가할 엔드포인트

```typescript
// /api/couple-token (L835 근처에 추가)
app.get('/api/couple-token', async (c) => {
  const { KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)
  const secret = await getJwtSecret(KV)
  const now    = Math.floor(Date.now() / 1000)
  const coupleToken = await signJwt(
    { sub: userId, type: 'couple', iat: now, exp: now + 7 * 86400 },
    secret
  )
  return c.json({ success: true, coupleToken })
})

// /api/test/save-result (BIG5/LOST/DSI result_json 저장)
app.post('/api/test/save-result', async (c) => {
  const { DB, KV } = c.env
  const userId = await getAuthUserId(c.req.raw, KV)
  if (!userId) return c.json({ error: '로그인이 필요합니다.' }, 401)
  const { test_type, result_json } = await c.req.json().catch(() => ({})) as {
    test_type?: string; result_json?: Record<string, unknown>
  }
  if (!test_type || !result_json) return c.json({ error: '파라미터 부족' }, 400)
  if (!['BIG5', 'LOST', 'DSI'].includes(test_type)) return c.json({ error: '지원하지 않는 유형' }, 400)
  await DB.prepare(
    `UPDATE test_history SET result_json=? WHERE id=(
       SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1
     )`
  ).bind(JSON.stringify(result_json), userId, test_type).run()
  return c.json({ success: true })
})
```

#### 3-2. public/static/app.jsx — 추가할 항목

- `openMaumCouple()` 함수 (package L1600~1618)
- GlobalNav 마음커플 버튼 (package L2827~2832)
- 마이페이지 커플 위젯 (package L3002~3050)
- `#counseling?type=couple` deep link 처리 (package L1441~1457)

#### 3-3. public/static/counseling.jsx — 추가할 항목

- 마음커플 deep link → 부부 상담사 자동 필터 (package L543~556)
- 부부 필터 연동 배너 UI (package L694~711)

### Step 4 — maumful 재배포

```bash
cd maumful-main
wrangler deploy
```

---

## package/maumful 버전의 수정 필요 사항

package 버전을 그대로 교체하면 안 되는 이유. 아래 6개 항목은 반드시 현재 운영 버전 동작을 유지해야 한다.

### 🔴 Critical

**1. export default 패턴 — Cron 핸들러 소실**

```typescript
// package 버전 (오류): Cloudflare Workers에서 scheduled 미작동
export { handleScheduled as scheduled }
export default app

// 현재 버전 (유지): scheduled가 default export 객체 안에 포함
export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Bindings) {
    await handleScheduled(env)
  },
}
```

**2. restoreLoginState 퇴행 — app.jsx L312~399**

package 버전이 이미 삭제된 B2B 세션 복원 로직(admin/counselor/orgAdmin)을 재추가했다.
현재 운영 버전의 B2C 전용 코드(`storage.remove("current_login")`)를 유지해야 한다.

**3. ADMIN_SECRET 미설정 시 관리자 API 전체 개방**

```typescript
// package 버전 (위험): 미설정이면 통과
if (!adminSecret) { console.warn(...); return null }

// 현재 버전 (유지): 미설정이면 차단
if (!adminSecret) return 'ADMIN_SECRET_NOT_SET'
```

### 🟠 Medium

**4. 회원가입 응답 credits 불일치**

package 버전: DB INSERT는 `credits=10`인데 응답은 `credits: 45`로 표시.
수정: `data: { credits: 10, ... }` 으로 일치시켜야 함.

**5. AI 오류 환불 시 일일 카운터 미복원**

package 버전: 오류 발생 시 크레딧만 환불하고 일일 카운터는 감소 안 함.
현재 버전의 `refundChat()` 함수(카운터 -1 + 크레딧 환불)를 유지해야 함.

**6. 비밀번호 재설정 Rate Limit 제거**

package 버전이 forgot-password / reset-password에서 IP 기반 Rate Limit을 제거함.
현재 버전의 `checkRateLimit(KV, 'forgot-pw:${ip}', 3, 3600)` 로직을 유지해야 함.

### 🟡 Minor (의도적 변경 — 확인 후 적용)

| 항목 | 현재 | package | 비고 |
|---|---|---|---|
| 무료 사용자 AI 일일 한도 | 5회 | 3회 | 의도적 축소라면 OK |
| 추천인 보너스 | 30 크레딧 | 20 크레딧 | 비용 정책 변경이라면 OK |
| AI 모델 폴백 | 4단계 자동 폴백 | 단일 모델 하드코딩 | 모델 장애 시 복구 불가 |
| SSE 응답 CORS 헤더 | 3개 | 1개 | OPTIONS preflight 실패 가능 |

---

## 마음커플 핵심 데이터 흐름

```
마음풀에서 BIG5/LOST/DSI 검사 완료
→ test_history.result_json 에 저장 (POST /api/test/save-result)

마음커플 접속 (SSO)
→ GET /api/couple/me → BIG5/LOST/DSI 최근 결과 자동 로드

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

## 환경변수 / Secrets 체크리스트

### maumful
| 키 | 필수 | 설명 |
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
