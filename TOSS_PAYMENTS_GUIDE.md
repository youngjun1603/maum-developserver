# 토스페이먼츠 연동 가이드

Cloudflare Workers + Hono.js + React(esbuild) 환경 기준.  
실제 마음풀 서비스에서 테스트·검증된 구현 패턴입니다.

---

## 1. SDK

### ⚠️ 주의: v2/base URL 사용 불가

```
https://js.tosspayments.com/v2/base  →  HTTP 403 Forbidden (CloudFront 차단)
```

**반드시 v1 SDK를 사용해야 합니다.**

```html
<!-- HTML <head>에 정적 포함 (동적 로드 시 실패 가능) -->
<script src="https://js.tosspayments.com/v1"></script>
```

### SDK 초기화 (프론트엔드)

```javascript
// window.TossPayments — 동기 함수, await 불필요
const tossPayments = window.TossPayments(clientKey);

await tossPayments.requestPayment('카드', {
  amount:        15000,          // 원 단위 정수
  orderId:       'ORDER_ID',     // 6~64자, URL-safe 문자만
  orderName:     '스타터 크레딧 50개',
  customerName:  '홍길동',
  customerEmail: 'user@example.com',
  successUrl:    'https://example.com/payment/success?chargeId=1',
  failUrl:       'https://example.com/payment/fail?chargeId=1',
});
// 성공 시 → successUrl?paymentKey=...&orderId=...&amount=... 로 리다이렉트
// 취소 시 → err.code === 'USER_CANCEL' throw
```

---

## 2. 시크릿 키 설정

### Cloudflare Workers (wrangler)

```bash
npx wrangler secret put TOSS_CLIENT_KEY   # 브라우저용 (test_ck_ 또는 live_ck_)
npx wrangler secret put TOSS_SECRET_KEY   # 서버용   (test_sk_ 또는 live_sk_)
npx wrangler secret put TOSS_WEBHOOK_SECRET  # Webhook 서명 검증용 (선택)
```

### 키 종류

| 환경 | 클라이언트 키 | 시크릿 키 |
|------|-------------|---------|
| 테스트 | `test_ck_...` | `test_sk_...` |
| 실서비스 | `live_ck_...` | `live_sk_...` |

- 테스트 환경: 실제 결제 없음, 토스 개발자 콘솔 테스트 카드 사용
- 실서비스 전환: 키만 교체하면 됨 (코드 변경 없음)

### 토스 개발자 콘솔 키 위치

> 콘솔 → 앱 선택 → 개발 → **API 개별 연동 키** 탭  
> (결제위젯 연동 키가 아닌 **API 개별 연동 키** 선택)

---

## 3. 결제 플로우

```
[프론트] 결제하기 버튼 클릭
    ↓
[백엔드] POST /api/payment/toss/checkout
    - DB에 pending 레코드 생성 (credit_charges 테이블)
    - orderId 생성: `charge_{chargeId}_{timestamp}`
    - 응답: { clientKey, orderId, orderName, amount, successUrl, failUrl, ... }
    ↓
[프론트] TossPayments(clientKey).requestPayment('카드', {...})
    - 토스 결제창 오픈
    ↓
[토스] 결제 완료 후 successUrl로 리다이렉트
    - 쿼리파라미터: paymentKey, orderId, amount
    ↓
[백엔드] GET /api/payment/toss/success
    - POST https://api.tosspayments.com/v1/payments/{paymentKey}/confirm
      - Headers: Authorization: Basic base64(secretKey:), Idempotency-Key: orderId
      - Body: { orderId, amount }
    - 중복 처리 방지: pg_tid(paymentKey)로 이미 처리된 건 스킵
    - 크레딧 지급 → 사용자 DB 업데이트
    - 영수증 이메일 발송
    - 302 리다이렉트 → /?payment=success
    ↓
[토스 Webhook] POST /api/webhook/toss  ← 이중지급 방지 보조 수단
    - Authorization 헤더로 TOSS_WEBHOOK_SECRET 검증 (미설정 시 건너뜀)
```

---

## 4. 백엔드 구현 (Hono.js / TypeScript)

### 환경변수 타입 정의

```typescript
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  TOSS_CLIENT_KEY?: string     // 브라우저용
  TOSS_SECRET_KEY?: string     // 서버 승인용
  TOSS_WEBHOOK_SECRET?: string // Webhook 서명 검증
}
```

### Checkout 엔드포인트

```typescript
app.post('/api/payment/toss/checkout', async (c) => {
  const userId = await getAuthUserId(c.req.raw, c.env.KV)
  if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)

  const tossKey    = c.env.TOSS_SECRET_KEY
  const clientKey  = c.env.TOSS_CLIENT_KEY
  if (!tossKey || !clientKey)
    return c.json({ success: false, error: '토스 키 미설정' }, 500)

  const { packageKey } = await c.req.json()
  const pkg = PACKAGES[packageKey]
  if (!pkg) return c.json({ success: false, error: '잘못된 패키지' }, 400)

  const user = await c.env.DB.prepare('SELECT email, nickname FROM users WHERE id=?')
    .bind(userId).first<{ email: string; nickname: string | null }>()

  // pending 레코드 생성
  const r = await c.env.DB.prepare(
    'INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg) VALUES (?,?,?,?,?,?)'
  ).bind(userId, packageKey, pkg.credits, pkg.amount, 'KRW', 'toss').run()

  const chargeId = r.meta.last_row_id as number
  const orderId  = `charge_${chargeId}_${Date.now()}`
  const serviceUrl = c.env.SERVICE_URL || 'https://yourdomain.com'

  return c.json({
    success: true,
    data: {
      clientKey,
      customerKey:   `app_user_${userId}`,
      orderId,
      orderName:     `${pkg.label} 크레딧 ${pkg.credits}개`,
      amount:        pkg.amount,
      customerName:  user?.nickname || user?.email.split('@')[0] || '',
      customerEmail: user?.email || '',
      successUrl:    `${serviceUrl}/api/payment/toss/success?chargeId=${chargeId}&orderId=${orderId}`,
      failUrl:       `${serviceUrl}/api/payment/toss/fail?chargeId=${chargeId}`,
    },
  })
})
```

### Success 콜백 엔드포인트

```typescript
app.get('/api/payment/toss/success', async (c) => {
  const { paymentKey, orderId, amount, chargeId } = c.req.query()
  const tossKey = c.env.TOSS_SECRET_KEY
  if (!tossKey) return c.redirect('/?payment=fail&msg=서버오류')

  // 1. 토스 결제 승인
  const confirmRes = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/confirm`,
    {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Authorization':   'Basic ' + btoa(tossKey + ':'),
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({ orderId, amount: parseInt(amount) }),
    }
  )
  if (!confirmRes.ok) {
    const err = await confirmRes.json() as { message: string }
    return c.redirect(`/?payment=fail&msg=${encodeURIComponent(err.message)}`)
  }

  // 2. 중복 처리 방지
  const existing = await c.env.DB.prepare(
    'SELECT id FROM credit_charges WHERE pg_tid=?'
  ).bind(paymentKey).first()

  if (!existing) {
    const charge = await c.env.DB.prepare(
      'SELECT user_id, credits FROM credit_charges WHERE id=? AND status=?'
    ).bind(parseInt(chargeId), 'pending')
      .first<{ user_id: number; credits: number }>()

    if (charge) {
      await c.env.DB.prepare(
        'UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE id=?'
      ).bind('completed', paymentKey, parseInt(chargeId)).run()

      // 크레딧 지급 (gainCredits 구현에 맞게 교체)
      await gainCredits(c.env.DB, charge.user_id, charge.credits, 'charge', paymentKey)
    }
  }

  return c.redirect('/?payment=success')
})
```

### Webhook 엔드포인트 (이중지급 방지)

```typescript
app.post('/api/webhook/toss', async (c) => {
  // 서명 검증 (TOSS_WEBHOOK_SECRET 설정 시)
  const secret = c.env.TOSS_WEBHOOK_SECRET
  if (secret) {
    const auth = c.req.header('Authorization') ?? ''
    if (auth !== 'Basic ' + btoa(secret + ':'))
      return c.json({ error: '서명 불일치' }, 401)
  }

  const body = await c.req.json() as Record<string, unknown>
  if (body.eventType !== 'PAYMENT_STATUS_CHANGED') return c.json({ ok: true })
  if ((body as any).data?.status !== 'DONE') return c.json({ ok: true })

  const { paymentKey, metadata } = (body as any).data
  const { userId, packageKey } = metadata ?? {}
  if (!userId || !packageKey || !paymentKey)
    return c.json({ error: '필수 필드 누락' }, 400)

  // 중복 처리 방지 후 크레딧 지급 (success 콜백과 동일 패턴)
  const existing = await c.env.DB.prepare(
    'SELECT id FROM credit_charges WHERE pg_tid=?'
  ).bind(paymentKey).first()

  if (!existing) {
    // credit_charges 업데이트 + gainCredits 호출
  }

  return c.json({ ok: true })
})
```

---

## 5. DB 스키마

```sql
CREATE TABLE credit_charges (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  package_key  TEXT    NOT NULL,
  credits      INTEGER NOT NULL,
  amount       INTEGER NOT NULL,        -- 원 단위
  currency     TEXT    NOT NULL DEFAULT 'KRW',
  pg           TEXT    NOT NULL,        -- 'toss' | 'stripe'
  status       TEXT    NOT NULL DEFAULT 'pending',  -- pending | completed | failed
  pg_tid       TEXT,                    -- 토스 paymentKey (완료 후 저장)
  completed_at DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- pg_tid 인덱스 (중복 처리 방지 쿼리 최적화)
CREATE INDEX idx_credit_charges_pg_tid ON credit_charges(pg_tid);
```

---

## 6. 테스트 카드

토스 테스트 환경에서 사용 가능한 카드번호:

| 카드사 | 번호 |
|--------|------|
| 토스카드 | `4330 0000 0000 0001` |
| 국민카드 | `5570 0000 0000 0001` |
| 신한카드 | `4000 0000 0000 0014` |
| 공통 | 유효기간·CVC 아무 숫자 |

---

## 7. 실제 발생한 오류 & 해결 과정

### 오류 1 — 결제창이 열리지 않고 바로 에러 표시

**증상:** 버튼 클릭 시 토스 결제창이 열리지 않고 `결제 중 오류가 발생했습니다` 즉시 표시  
**콘솔:** `[Toss] 결제 에러: ► Event`  

**원인:** SDK를 버튼 클릭 시점에 동적으로 `<script>` 태그 삽입해서 로드하려 했는데,  
`onerror` 이벤트가 발생 → catch 블록에서 `err`이 `Event` 객체 (message/code 없음)

```javascript
// ❌ 잘못된 방식 — onerror 시 Event 객체가 reject로 전달됨
await new Promise((ok, ng) => {
  const s = document.createElement('script');
  s.src = 'https://js.tosspayments.com/v2/base';
  s.onload = ok; s.onerror = ng;  // ng(Event 객체) → catch(err)에서 err.message === undefined
  document.head.appendChild(s);
});
```

**해결:** HTML `<head>`에 미리 포함

```html
<!-- ✅ 정적 포함 — 페이지 로드 시 함께 로드 -->
<script src="https://js.tosspayments.com/v1"></script>
```

---

### 오류 2 — `window.TossPayments is not a function`

**증상:** 버튼 클릭 시 `TypeError: window.TossPayments is not a function`  
**콘솔:** `[Toss] 결제 에러: TypeError: window.TossPayments is not a function at handlePay`

**원인:** `https://js.tosspayments.com/v2/base` URL이 **HTTP 403 Forbidden** 반환  
→ 스크립트가 로드되지 않아 `window.TossPayments`가 존재하지 않음

```bash
# 직접 확인
curl -I https://js.tosspayments.com/v2/base
# → HTTP/1.1 403 Forbidden (CloudFront/S3 차단)

curl -I https://js.tosspayments.com/v1
# → HTTP/1.1 200 OK ✓
```

**해결:** v2/base → v1으로 URL 교체

```html
<!-- ❌ 403 Forbidden -->
<script src="https://js.tosspayments.com/v2/base"></script>

<!-- ✅ 200 OK -->
<script src="https://js.tosspayments.com/v1"></script>
```

---

### 오류 3 — v2 API 사용 시 `payment is not a function`

**증상:** `window.TossPayments`는 존재하지만 v2 API 호출 방식으로 사용 시 실패

```javascript
// ❌ v2 방식 — v1 SDK에서는 동작하지 않음
const tossPayments = await TossPayments(clientKey);        // v2는 async
const payment = tossPayments.payment({ customerKey });     // v2 전용 메서드
await payment.requestPayment({ method: 'CARD', amount: { value: 1000, currency: 'KRW' } });
```

**해결:** v1 API 방식으로 변경

```javascript
// ✅ v1 방식
const tossPayments = window.TossPayments(clientKey);  // 동기 초기화
await tossPayments.requestPayment('카드', {
  amount: 1000,          // number (v1은 { value, currency } 객체 아님)
  orderId: 'ORDER_ID',
  orderName: '상품명',
  customerName: '홍길동',
  customerEmail: 'user@example.com',
  successUrl: 'https://...',
  failUrl: 'https://...',
});
```

**v1 vs v2 API 차이점 요약:**

| | v1 | v2 |
|--|----|----|
| 초기화 | `TossPayments(key)` 동기 | `await TossPayments(key)` 비동기 |
| 결제 요청 | `requestPayment('카드', { amount: 1000 })` | `payment({ customerKey }).requestPayment({ method:'CARD', amount:{ value:1000, currency:'KRW' } })` |
| CDN URL | `https://js.tosspayments.com/v1` ✅ | `https://js.tosspayments.com/v2/base` ❌ 403 |

---

### 오류 4 — 결제 승인 API URL 오류 (v1 → v2 변경 시 주의)

**증상:** 결제창에서 결제 완료 후 서버 승인 단계에서 실패

```typescript
// ❌ 구 방식 (v1 스타일)
fetch('https://api.tosspayments.com/v1/payments/confirm', {
  body: JSON.stringify({ paymentKey, orderId, amount }),
})

// ✅ 올바른 방식 — paymentKey를 URL 경로에 포함 + Idempotency-Key 헤더
fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/confirm`, {
  method: 'POST',
  headers: {
    'Content-Type':    'application/json',
    'Authorization':   'Basic ' + btoa(secretKey + ':'),
    'Idempotency-Key': orderId,   // 중복 승인 방지 필수
  },
  body: JSON.stringify({ orderId, amount: parseInt(amount) }),
})
```

---

### 빠른 체크리스트

결제창이 열리지 않을 때:

- [ ] `<head>`에 `<script src="https://js.tosspayments.com/v1">` 포함 여부
- [ ] `window.TossPayments`가 함수인지 확인: `console.log(typeof window.TossPayments)`
- [ ] `wrangler secret list`로 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` 등록 여부
- [ ] catch 블록에서 `console.error('[Toss] 에러:', err, err?.code, err?.message)` 출력
- [ ] 사용자가 취소한 경우: `err.code === 'USER_CANCEL'` (정상, 에러 아님)
