# BATCH_02 — 결제 · 정산 (11건)

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **근거**: 2026-09-19 코드 직접 열람 + `_docs/RISKS.md` 2차 발견분 + 각 서비스 `docs/DESIGN.md`(마음풀 §10.5·§7.4 / 수달·곁 §10.1 / CTS §10.1·§15 / 커플 §11.4·§15) + 루트 `TOSS_PAYMENTS_GUIDE.md`
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

⚠️ **이 배치는 전부 돈이 오가는 경로다.** 잘못 고치면 버그가 아니라 **이중 지급·이중 환불·결제 중단**이 난다. 각 이슈의 **"주의"** 에 잘못 고쳤을 때 무슨 일이 나는지 적어 두었다. 반드시 읽고 손대라.

---

## 0. 배치 개요

### 0.1 이슈 목록

| ID | 제목 | 심각도 | 대상 | 형제 서비스 | 선행 |
|---|---|---|---|---|---|
| R-44 | 루트 `CLAUDE.md` grant 페이로드(3필드) ≠ 실제 구현(6필드) | S2 | 문서 정정 + 계약 일원화 | — | — |
| R-37 | 마음풀→수달·곁 환불이 이용권을 회수 못한다 | **S1** | maumful-main + maumotter + maumgyeot | 수달 ↔ 곁 | **BATCH_03** |
| R-45 | grant `amount` 미검증 · `service` 없으면 검사 통과 | S2 | maumotter + maumgyeot | 수달 ↔ 곁 | — |
| R-38 | CTS 토스 웹훅에 결제 재조회 검증 없음 | **S1** | cts-maum-main | 마음풀 = 정답 | — |
| R-39 | 지급 대상 특정이 느슨 (`user_id`+`pending` 만) | **S1** | cts-maum-main | 마음풀 = 정답 | R-38과 한 몸 |
| R-40 | `user_subscriptions` INSERT가 try/catch로 삼켜짐 | **S1** | maumful-main | — | — |
| R-41 | CTS `PAYMENT_LIVE=true` 로 바꿔도 결제 불가 | S2 | cts-maum-main | 마음풀 = 정답 | R-38·39 뒤 |
| R-47 | 제휴 정산 요약 API ↔ 원장 API 산식 불일치 | S2 | maumful-main | — | **BATCH_03** |
| R-11 | 쿼터를 LLM 호출 **전** 차감 — 실패해도 환불 없음 | S2 | maumgyeot (+커플 변형) | 수달 유사 | — |
| R-21 | 크레딧 차감 시점 3종 · 일부 반환값 미검사 | S3 | package/maumcouple | — | — |
| R-13 | 주간 인사이트 메일 수신거부가 정보통신망법 요건 미달 | S2 | package/maumcouple | 마음게임 = 정답 | — |

### 0.2 읽는 순서 — 본문은 ID 순이 아니라 **의존 순**이다
`§1 통합결제 grant(R-44→R-37→R-45)` → `§2 결제 웹훅·지급(R-38→R-39→R-40→R-41)` → `§3 제휴 정산(R-47)` → `§4 차감·환불·메일(R-11→R-21→R-13)`.
**R-44 를 먼저 읽지 않고 R-37 을 손대지 마라.** 서명 페이로드 계약을 모르면 revoke 가 전건 401 로 죽는다.

### 0.3 예상 작업량
- **R-37 + R-44 + R-45** = 이 배치의 절반. 3개 서비스가 맞물린다. 하루.
- **R-38 + R-39 + R-41** = CTS 결제 경로 한 덩어리. 반나절(+ 실결제 검증은 사용자 동반 필요).
- **R-40 · R-47 · R-11 · R-21 · R-13** = 각각 1~3시간. R-13 은 **사용자 확인 대기**가 있어 끝까지 못 갈 수 있다.
- **R-13·R-41·R-37(일부)** 은 BATCH_00 §2.2 의 "멈추고 물어볼 것"에 걸린다. **기다리느라 나머지를 멈추지 마라.**

### 0.4 선행조건
1. `gh auth status` → `youngjun1603` 활성(§1.8). `cts-maum-main/` 은 **서브모듈**(커밋 순서 §1.6).
2. **BATCH_03 선행 항목 — 이것 없이는 R-37·R-47 의 검증이 성립하지 않는다.**

   | 테이블 | 쓰는 코드 | DDL 위치 | 상태 |
   |---|---|---|---|
   | `external_orders` | `maumotter/src/index.ts:545·555·566·581` · `maumgyeot/src/index.ts:411·420·434·449` | **어느 `.sql` 에도 없음** | ⛔ 부재 |
   | `partner_commissions` | `maumful-main/src/index.tsx:4075·4080·6517·6526·6619` | **어느 `.sql` 에도 없음** | ⛔ 부재 |
   | `external_grants` | `maumful-main/src/index.tsx:3170·3179·3186` | `migrations/0029_external_grants.sql` | ✅ 있음 |

   확인: `grep -rn "CREATE TABLE" --include=*.sql . | grep -E "external_orders|partner_commissions"` → **0건이면 BATCH_03 이 먼저다.**
3. 마음 시리즈(수달·곁)는 **GitHub 웹UI → Cloudflare 자동배포**(각 폴더 `CLAUDE.md` L62/L69). `wrangler dev` 안내 금지.
4. 마음커플 프론트를 고쳤으면 `npm run build:jsx` → `compiled/couple_hub.js` 재생성 후 커밋. **마음커플엔 `render_smoke.cjs` 가 없다**(커플 설계서 §15-12) → 브라우저로 직접 확인.

### 0.5 ⚠️ 지금 라이브 상태 — 손대기 전에 반드시 알 것
- **마음풀은 실결제 중이다**: `app.jsx:6014 PAYMENT_LIVE = true`. 상점에 **수달·곁 상품 6종이 실제로 노출**돼 있다(`app.jsx:6033·6036·6061·6062`, 백엔드 `PACKAGES` L3143~L3148).
- 그런데 수신측 `external_orders` DDL 이 없다(0.4-2) → `/api/grant` 의 첫 SELECT(`maumotter:545`)가 던지고 500 → 마음풀은 `external_grants.status='failed'` 로 남긴다.
- 즉 **지금 이 순간 "돈은 받고 지급은 실패"** 일 가능성이 높다. 착수 전 실측하라:
  ```bash
  npx wrangler d1 execute maumful-db --remote --command \
    "SELECT service,status,COUNT(*) c,SUM(amount) amt FROM external_grants GROUP BY 1,2"
  ```
  **건수가 0 이 아니면 그 결과를 보고서 §4 맨 위에 쓰고 사용자에게 즉시 알려라.**
- 루트 `CLAUDE.md` L87 은 통합결제를 *"토스페이먼츠 완전 반영 전까지 커밋·푸시·배포 금지"* 로 묶어 두었는데 **코드는 이미 배포돼 팔리고 있다**(RISKS R-31). 이 배치에서 수달·곁을 배포해도 되는지는 **§2.2 사용자 확인 대상**이다.

### 0.6 손대지 말 것
- 가격·상품 구성(`PACKAGES` 금액·크레딧) / 구독 플랜 금액 / 크레딧 단가 — §2.2.
- 마음풀 웹훅(`index.tsx:3391~`)의 **검증 로직**. 이 배치에서 마음풀 웹훅은 **정답 예시**이지 수정 대상이 아니다.
- `maumsedae`·`maumbubu`·게임 2종 — 이 배치 범위 밖.
- CTS 의 기능 개선(§1.5). **지시된 버그만** 고친다.
- R-07(`external_orders`·`email_verified` DDL) · R-20(커플 스키마 3중 정의) — **BATCH_03**.

---

## 1. 통합결제 grant 계열 — R-44 → R-37 → R-45

### [R-44] 루트 `CLAUDE.md` 의 grant 페이로드가 실제 구현과 다르다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 (문서 결함이지만 이 문서를 보고 구현하면 **전건 401**) |
| 대상 | `CLAUDE.md:89` · `maumotter/CLAUDE.md:126` · `maumgyeot/CLAUDE.md:159` |
| 형제 서비스 | — (문서 3개 동시 정정) |
| 근거 | 수달 설계서 §10.1 계약표 · 곁 설계서 §10.1 |

**무엇이 문제인가** — 루트 `CLAUDE.md` L89 원문:
> **전달 = A안(서명 grant API)**: 마음풀 결제성공 → 대상 서비스 `POST /api/grant`(HMAC=MAUM_SSO_SECRET, `{email,grantType,orderId}`) …

실제 발신측(`maumful-main/src/index.tsx:3176`)은 **6필드**를 서명한다:
```ts
const token = await signSso(secret, { email, service: pkg.service, grantType: pkg.grantType, orderId, amount: pkg.amount, exp: Math.floor(Date.now()/1000) + 300 })
```
서명 대상이 **payload JSON 문자열 자체**(`signSso` L179-186: `base64url(JSON.stringify(payload))` 를 HMAC)이므로 **필드가 하나라도 다르면 바이트가 달라져 서명이 깨진다.** CLAUDE.md 요약대로 3필드로 만들면 수신측 `verifySso`(`maumotter:154`)가 전건 `null` → `401 invalid or expired grant`. 게다가 `exp` 가 빠지면 `verifyGrantToken`(`maumotter:528`)이 무조건 거부한다.

**정답 원본** — 수달 설계서 §10.1 계약표(`maumotter/docs/DESIGN.md:305~332`). 곁 설계서 §10.1 과 **동일 내용**이며 코드와 대조해 이미 검증돼 있다.

**확인 방법**
```bash
grep -n "grantType,orderId" CLAUDE.md maumotter/CLAUDE.md maumgyeot/CLAUDE.md   # 3건
grep -n "signSso(secret, { email" maumful-main/src/index.tsx                     # 3176
grep -n "signSso(ssoSecret\|signSso(secret, { service" maumful-main/src/index.tsx # 1160·4569 (revoke — email·amount 없음)
sed -n '305,332p' maumotter/docs/DESIGN.md                                       # 계약 원본
```

**구현 방법** — **코드가 정답, 문서를 고친다.**
1. 루트 `CLAUDE.md:89` 의 `{email,grantType,orderId}` → **`{email, service, grantType, orderId, amount, exp}`** 로 바꾸고 한 줄 덧붙인다: *"필드·순서가 서명 대상이다. 상세 계약은 각 서비스 `docs/DESIGN.md` §10.1 표가 원본."*
2. `maumotter/CLAUDE.md:126` · `maumgyeot/CLAUDE.md:159` 의 같은 표기도 동일하게.
3. **계약 일원화** — 지금 revoke 토큰은 **4필드**(`{service, grantType, orderId, exp}` — `maumful-main:1160`·`4569`)로 발신측 안에서도 갈라져 있다. R-37 에서 이걸 grant 와 같은 6필드로 맞춘다. 문서에는 *"grant·revoke 는 동일 6필드 페이로드를 쓴다"* 로 적어라.

**검증 방법**
```bash
grep -rn "{email,grantType,orderId}" . --include=CLAUDE.md   # 0건
grep -n "email, service, grantType, orderId, amount, exp" CLAUDE.md maumotter/CLAUDE.md maumgyeot/CLAUDE.md  # 3건
```
설계서 §10.1 표와 루트 `CLAUDE.md` 문구가 **글자 단위로 일치**하는지 사람이 한 번 대조할 것.

**주의** — **문서를 고친다고 코드를 건드리지 마라.** `signSso` 의 필드 순서를 "정리"하는 순간, 발신·수신을 **동시에 배포하지 못하는 구조**(수달·곁은 GitHub 웹UI 자동배포, 마음풀은 wrangler)라 순서가 어긋나면 그 사이 결제분이 전부 401 로 떨어진다. / `exp` 는 5분이다 — 재시도(`/api/admin/deliver-pending-grants` L3199)는 **매번 새로 서명**하므로 문제없다. 토큰을 캐시하는 코드를 새로 만들지 마라.

### [R-37] 마음풀 → 수달·곁 환불이 이용권을 회수하지 못한다 ⭐ 이 배치의 핵심

| 항목 | 내용 |
|---|---|
| 심각도 | **S1 (금전 손실 — 카드는 환불되고 상품은 남는다)** |
| 대상(발신) | `maumful-main/src/index.tsx:1126·1143-1144·1160-1161·1186`(셀프환불) · `4534·4554·4564-4576`(관리자환불) · `3118·3143-3148`(PACKAGES) · `3159`(SERVICE_API) |
| 대상(수신) | `maumotter/src/index.ts:559-584` · `maumgyeot/src/index.ts:425-450` |
| 형제 서비스 | **수달 ↔ 곁 — 두 파일은 `'otter'`/`'gyeot'` 문자열만 다르고 나머지는 문자 단위로 동일**(수달 설계서 §10.1 "수달 ↔ 곁 차이") |
| 근거 | 수달 설계서 §10.1 "계약상 확인된 구멍" 2·3번 · 곁 설계서 §10.1 · RISKS R-37 |
| 선행 | **BATCH_03** (`external_orders` DDL). 없으면 revoke 를 고쳐도 테스트 자체가 불가능 |

**무엇이 문제인가 — 환불 흐름 전체를 단계별로**

| # | 단계 | 코드 | 지금 무슨 일이 나나 |
|---|---|---|---|
| 1 | 구매 | `app.jsx:190 startExternalCheckout()` → `POST /api/payment/toss/checkout`(L3587) | `credit_charges` pending 1행. `PACKAGES['otter_light'] = { credits: 0, …, service:'otter', grantType:'sub_light' }`(L3143) |
| 2 | 결제 성공 | `/api/payment/toss/success`(L3633) 또는 웹훅(L3391) → `if (PACKAGES[..].service) deliverGrant(...)`(L3465·3701) | 크레딧이 **0** 이라 `gainCredits` 미호출 → **`credit_transactions` 행이 아예 안 생긴다** |
| 3 | 지급 전달 | `deliverGrant()` L3161-3197 | `external_grants` pending INSERT → 6필드 서명 → `POST https://maumotter.com/api/grant` |
| 4 | 수신 | `maumotter:533-557` | `external_orders` 멱등 확인 → `applyGrant` → `external_orders` `'applied'` INSERT |
| 5 | **셀프환불 경로** | 프론트 `app.jsx:5511` `refundable = tx.reason === 'charge' && …` | 2단계에서 `credit_transactions` 행이 안 생겼으므로 **환불 버튼이 아예 뜨지 않는다**. `app.jsx:4807` 의 `PhywebCodesCard` 도 `x.service === 'phyweb'` 로 필터라 수달·곁은 안 보인다 |
| 5' | API 직타 | `index.tsx:1143-1144` | `if (refPkg?.service && refPkg.service !== 'phyweb') return 400 '고객센터(support@maumful.com)로 …'` → **막힌다.** 여기까지는 의도된 설계다 |
| 6 | **관리자환불 경로** | `index.tsx:4534` `POST /api/admin/payments/:id/refund` | ← **여기가 진짜 구멍이다** |
| 6a | 상태 선점 | L4552 `UPDATE … status='refunded' WHERE id=? AND status='completed'` | ✅ 정상(이중환불 방지) |
| 6b | 크레딧 회수 | L4554 `UPDATE users SET credits = credits - ? WHERE id=? AND credits >= ?` · `charge.credits = 0` | **`credits - 0 WHERE credits >= 0`** → 행만 있으면 무조건 `changes=1` → **가드가 통째로 무의미** |
| 6c | 원장 기록 | L4558 `INSERT INTO credit_transactions … 'admin_refund'` | `amount = 0` 인 의미 없는 행이 쌓인다 |
| 6d | **revoke 분기** | L4565 `if (admPkg?.service === 'phyweb')` | otter·gyeot 는 **false** → **revoke 를 아예 호출하지 않는다** |
| 6e | 응답 | L4578 `'크레딧 회수 완료 — 0cr. ⚠️ 카드 환불은 토스 상점관리자에서 직접 취소하세요'` | 관리자는 "회수 완료"로 읽고 토스에서 카드를 취소한다 |
| 7 | 결과 | — | **카드 환불 완료 + `external_orders.status='applied'` 그대로 = 구독·회차권 살아 있음.** `maumotter:559`/`maumgyeot:425` 의 `/api/grant/revoke` 는 **호출자가 0인 죽은 엔드포인트** |

**하드코딩 원문**(고칠 자리 3곳):
```ts
// L1161 (셀프환불·phyweb 전용 블록)
st = await fetch('https://phyweb.pages.dev/api/grant/status?token=' + encodeURIComponent(await signTok())) …
// L1186 (셀프환불·phyweb 전용 블록)
const rv = await fetch('https://phyweb.pages.dev/api/grant/revoke', { method:'POST', … body: JSON.stringify({ token: await signTok() }) })
// L4569-4570 (관리자환불·phyweb 전용 블록)
const token = await signSso(ssoSecret, { service:'phyweb', grantType: admPkg.grantType, orderId:`mf_charge_${chargeId}`, exp: … })
const rv = await fetch('https://phyweb.pages.dev/api/grant/revoke', { … })
```
**같은 파일에 이미 정답 테이블이 있다** — `index.tsx:3159`:
```ts
const SERVICE_API: Record<string, string> = { otter: 'https://maumotter.com', gyeot: 'https://maumgyeot.com', phyweb: 'https://phyweb.pages.dev' }
```
`deliverGrant`(L3178)와 재시도 라우트(L3207)는 **이미 `SERVICE_API[...]` 를 쓴다.** revoke 3곳만 예외다.

**수신측 `/api/grant/revoke` 실제 시그니처**(`maumotter/src/index.ts:559-584` · 곁 `425-450` 동일):
```ts
app.post('/api/grant/revoke', async (c) => {
  const secret = c.env.MAUM_SSO_SECRET;
  if (!secret) return c.json({ error: 'grant secret 미설정' }, 503);
  const body = await c.req.json().catch(() => ({} as any));
  const p = await verifyGrantToken(secret, String(body.token || ''));   // ← 바디는 {token} 단일 필드
  if (!p) return c.json({ error: 'invalid or expired' }, 401);
  const orderId = String(p.orderId || '');                              // ← 실제로 읽는 값은 orderId 하나뿐
  const ord = await c.env.DB.prepare('SELECT * FROM external_orders WHERE order_id=?').bind(orderId).first<any>();
  if (!ord) return c.json({ ok: true, note: 'no such order' });         // ← 없어도 200
  if (ord.status !== 'applied') return c.json({ ok: true, note: 'already ' + ord.status });  // ← 멱등
  // PLAN[gt] → subscriptions.expires_at -= days  /  PACK[gt] → packs.remaining = MAX(0, remaining - count)
  await … "UPDATE external_orders SET status='revoked', revoked_at=datetime('now') WHERE order_id=?"
  return c.json({ ok: true, revoked: true });
})
```
→ **마음풀이 불러야 할 곳은 `https://maumotter.com/api/grant/revoke` · `https://maumgyeot.com/api/grant/revoke` = `${SERVICE_API[pkg.service]}/api/grant/revoke` 다.** 바디는 `{ token }`, `orderId` 는 `mf_charge_${chargeId}`(`deliverGrant` L3168 과 동일 규칙).

**`GET /api/grant/status` 부재** — 마음풀 셀프환불은 phyweb 에 `?token=` 으로 물어 `{ok:true, redeemed:boolean}` 을 받고(L1163-1165) `redeemed` 면 청약철회를 거부한다. **수달·곁에는 이 라우트가 없다**(`grep grant/status maumotter/src maumgyeot/src` → 0건) → "이미 쓴 이용권인지" 물어볼 수단이 없다. 수달·곁은 코드 등록형이 아니라 **직접 적용형**이라 `redeemed` 의 정의부터 다르다(구독 잔여일? 회차권 소진분?) → **§2.2 사용자 확인 대상.**

**확인 방법**
```bash
grep -n "phyweb.pages.dev" maumful-main/src/index.tsx                 # 1161 · 1186 · 3159 · 4570
grep -n "SERVICE_API\[" maumful-main/src/index.tsx                     # 3178 · 3207 (deliverGrant·재시도만 사용)
grep -n "admPkg?.service\|refPkg?.service" maumful-main/src/index.tsx  # 1144 · 1153 · 4565
grep -n "grant/status" maumotter/src/index.ts maumgyeot/src/index.ts   # 0건 = 미구현
grep -n "credits: 0" maumful-main/src/index.tsx                        # 수달·곁·phyweb 상품 12종
```
재현(스테이징 권장):
```bash
# 1) 수달 상품 결제 1건을 completed 로 만든 뒤 chargeId 확인
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT id,package_key,credits,amount,status FROM credit_charges WHERE package_key LIKE 'otter_%' ORDER BY id DESC LIMIT 3"
# 2) 관리자 환불
curl -s -X POST "https://maumful.com/api/admin/payments/<chargeId>/refund" -H "Authorization: Bearer $ADMIN_SECRET"
#    → {"success":true,"message":"크레딧 회수 완료 — 0cr. …"}   ← revoke 흔적 없음
# 3) 수신측 확인
npx wrangler d1 execute maumotter-db --remote --command \
 "SELECT order_id,status,revoked_at FROM external_orders WHERE order_id='mf_charge_<chargeId>'"
#    → status='applied' 그대로면 재현 성공
```

**구현 방법** — 3개 서비스를 **동시에** 맞춘다. 순서는 ① 수신측(수달·곁) → ② 마음풀. **수신측을 먼저 배포하라**(마음풀이 먼저 revoke 를 쏘면 404 가 난다).

**① 수달·곁(양쪽 동일. 수달 `'otter'`, 곁 `'gyeot'`)**
1. `/api/grant/revoke` 첫머리에 **대상 서비스 검사**를 넣는다. 지금은 없다 — `/api/grant`(수달 L539 / 곁 L405)에는 있는데 revoke 에만 빠져 있다:
   ```ts
   if (p.service && p.service !== 'otter') return c.json({ error: 'service mismatch' }, 400);
   ```
   (R-45 에서 이 검사를 `p.service !== 'otter'` 로 더 조인다 — 두 이슈를 **한 커밋**으로 가는 것이 낫다.)
2. `GET /api/grant/status` 신설 — **응답 스키마는 마음풀 L1163-1165 가 이미 기대하는 형태로 고정**해야 한다:
   ```ts
   app.get('/api/grant/status', async (c) => {
     const p = await verifyGrantToken(c.env.MAUM_SSO_SECRET, String(c.req.query('token') || ''));
     if (!p) return c.json({ ok: false, error: 'invalid or expired' }, 401);
     if (p.service !== 'otter') return c.json({ ok: false, error: 'service mismatch' }, 400);
     const ord = await c.env.DB.prepare('SELECT * FROM external_orders WHERE order_id=?').bind(String(p.orderId||'')).first<any>();
     if (!ord) return c.json({ ok: true, found: false, redeemed: false, status: null });
     // ⚠️ redeemed = "환불하면 안 되는 상태". 판정 기준은 사용자 확인 후 확정할 것(아래 주의)
     return c.json({ ok: true, found: true, status: ord.status, redeemed: <판정> });
   })
   ```
   **`<판정>` 을 임의로 정하지 마라.** BATCH_00 §2.2 *"기존 사용자의 권한·이용권에 영향이 가는 변경"* 이다. 후보를 보고서 §6 에 제시하고 물어라 — (a) `usage_monthly.used > 0` (b) `packs.remaining < 지급량` (c) 지급 후 N일 경과 (d) 항상 `false`(무조건 환불 허용). **확정 전에는 라우트를 만들되 `redeemed: false` 고정 + TODO 주석**으로 두고, 마음풀 셀프환불은 **열지 마라**(②-4).
3. **이미 라이브 계약이다. `/api/grant` 본문·응답은 건드리지 마라.**

**② 마음풀**
1. **URL 하드코딩 제거** — L1161·L1186·L4570 의 `'https://phyweb.pages.dev/...'` 를 `` `${SERVICE_API[<service>]}/api/grant/revoke` `` 로. `SERVICE_API` 는 같은 파일 L3159 에 이미 있다.
2. **관리자환불 revoke 분기 확대** — L4565 `if (admPkg?.service === 'phyweb')` 를 **`if (admPkg?.service && admPkg.grantType)`** 로 넓히고 서비스별로 분기한다:
   ```ts
   const admPkg = PACKAGES[charge.package_key]
   if (admPkg?.service && admPkg.grantType) {
     const ssoSecret = (c.env as any).MAUM_SSO_SECRET
     const api = SERVICE_API[admPkg.service]
     if (ssoSecret && api) {
       try {
         const u = await DB.prepare('SELECT email FROM users WHERE id=?').bind(charge.user_id).first<{email:string}>()
         // R-44: grant 와 동일한 6필드 페이로드로 통일
         const token = await signSso(ssoSecret, {
           email: String(u?.email || '').toLowerCase(), service: admPkg.service, grantType: admPkg.grantType,
           orderId: `mf_charge_${chargeId}`, amount: admPkg.amount, exp: Math.floor(Date.now()/1000) + 300 })
         const rv = await fetch(`${api}/api/grant/revoke`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) })
         if (!rv.ok) console.error('[Admin Refund] revoke 비정상:', admPkg.service, rv.status, chargeId)
         else await DB.prepare("UPDATE external_grants SET status='revoked' WHERE order_id=?").bind(`mf_charge_${chargeId}`).run()
       } catch (e) { console.error('[Admin Refund] revoke 오류:', e, chargeId) }
     }
     return c.json({ success: true, message: `${admPkg.label} 환불 처리 — 이용권 회수 시도 완료. ⚠️ 카드 환불은 토스 상점관리자에서 직접 취소하세요(${charge.amount.toLocaleString()} ${charge.currency}).` })
   }
   ```
   > `external_grants.status='revoked'` 는 **0029 의 status 주석(`pending|delivered|failed`)에 없는 새 값**이다. 컬럼이 `TEXT`(CHECK 없음)라 들어가긴 한다 — **DDL 주석 갱신은 BATCH_03 과 함께.** 확인 없이 CHECK 를 새로 걸지 마라.
3. **`credits = 0` 상품의 헛도는 크레딧 회수 제거** — L4554 의 `claw` 를 `charge.credits > 0` 일 때만 실행하고 0 이면 건너뛴다. L4558 의 `credit_transactions` INSERT 도 동일 조건. **`credits > 0` 인 일반 충전 경로의 동작은 한 글자도 바꾸지 마라**(그 가드가 "이미 쓴 크레딧은 환불 불가"의 핵심이다).
4. **셀프환불(L1144)은 지금은 그대로 둔다.** 수달·곁을 셀프환불에 여는 것은 §2.2(환불 정책)이며, ①-2 의 `redeemed` 판정이 확정되기 전에는 **"쓴 이용권을 환불해 주는" 사고**가 난다. 열지 말고 보고서 §6 에 올려라.
5. L1161·L1186 의 phyweb 블록은 **URL만 `SERVICE_API['phyweb']` 로 바꾸고 로직은 유지**. 토큰도 R-44 에 맞춰 6필드로 통일하되, **phyweb 은 우리 레포가 아니다** — 수신측이 6필드를 받아들이는지 확인 못 하면 **phyweb 토큰은 현행 4필드 그대로 두고 보고서 §5 에 적어라.**

**검증 방법**
```bash
grep -n "phyweb.pages.dev" maumful-main/src/index.tsx          # 3159 (SERVICE_API 정의) 1건만 남아야 한다
grep -n "grant/revoke" maumful-main/src/index.tsx              # 전부 ${SERVICE_API[...]} 형태
cd maumful-main && npx tsc --noEmit
grep -n "service mismatch" maumotter/src/index.ts maumgyeot/src/index.ts   # /api/grant + revoke + status = 각 3건
```
**서명 토큰을 직접 만들어 수신측 단독 검증**(마음풀을 태우지 않고):
```bash
node -e '
const c=require("crypto"); const S=process.env.MAUM_SSO_SECRET;
const p={email:"test@example.com",service:"otter",grantType:"pack10",orderId:"mf_charge_TEST1",amount:6900,exp:Math.floor(Date.now()/1000)+300};
const b=Buffer.from(JSON.stringify(p)).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const s=c.createHmac("sha256",S).update(b).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
console.log(b+"."+s)'
# → $T 에 담고
curl -s -X POST https://maumotter.com/api/grant        -H 'Content-Type: application/json' -d "{\"token\":\"$T\"}"   # {"ok":true,"applied":true,…}
curl -s -X POST https://maumotter.com/api/grant/revoke -H 'Content-Type: application/json' -d "{\"token\":\"$T\"}"   # {"ok":true,"revoked":true}
curl -s -X POST https://maumotter.com/api/grant/revoke -H 'Content-Type: application/json' -d "{\"token\":\"$T\"}"   # {"ok":true,"note":"already revoked"}  ← 멱등
curl -s "https://maumotter.com/api/grant/status?token=$T"                                                            # {"ok":true,…}
npx wrangler d1 execute maumotter-db --remote --command "SELECT * FROM packs WHERE maum_user_id=(SELECT maum_user_id FROM external_orders WHERE order_id='mf_charge_TEST1')"
```
**엔드투엔드(스테이징 실결제 1건)** — 결제 → `external_orders.status='applied'` · `packs.remaining` +10 확인 → 관리자 환불 → `external_orders.status='revoked'` · `packs.remaining` 원복 · `external_grants.status='revoked'` 확인.
**기존 동작 무영향** — `starter_kr`(credits=50) 1건을 관리자 환불해 **크레딧이 정확히 50 줄고** `credit_transactions` 에 `admin_refund 50` 이 남는지. 곁(`gyeot_pack10`)도 수달과 똑같이 돌려볼 것(§1.4).

**주의 — 잘못 고치면 무슨 일이 나나**
- **revoke 를 성공 판정 없이 "했다"고 표시하면** 관리자가 카드를 환불하는데 이용권은 살아 있는 **지금 상태가 은폐**된다. `rv.ok` 가 아닐 때는 반드시 에러 로그 + `external_grants` 를 `'revoked'` 로 **바꾸지 마라.**
- **revoke 를 상태 선점(L4552) 앞으로 옮기면 이중 회수**다. 더블클릭 두 번이면 구독 만료일이 60일 당겨진다. 수신측 revoke 는 `status!=='applied'` 로 멱등이지만 **마음풀이 같은 `orderId` 를 보낼 때만** 그 멱등이 작동한다 — `Date.now()` 같은 걸 섞지 말고 반드시 `mf_charge_${chargeId}`.
- **`claw` 의 `credits >= ?` 가드를 지우면** 일반 충전 환불에서 잔액이 **음수**가 된다. 조건을 "0이면 건너뛴다"로만 좁혀라.
- **수신측을 나중에 배포하면** 마음풀 revoke 가 404/500 → best-effort 라 조용히 지나간다 = **지금과 같은 상태**. 수신측 먼저.
- 수달·곁 revoke 는 구독 만료일에서 `days` 를 **하한 없이 뺀다**(수달 설계서 §10.1 "과거 시각이 될 수 있다"). 연속 환불 시 만료일이 과거로 간다. **하한 보정은 이 배치 범위 밖** — 보고서 §4 에 기록만.
- `external_orders` DDL(BATCH_03)이 없으면 **위 검증은 전부 500 이 뜬다.** 그걸 "내가 잘못 고쳤다"로 오해하지 마라.

### [R-45] grant 의 `amount` 를 수신측이 읽지 않는다 · `service` 없으면 검사 통과

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumotter/src/index.ts:533-557` · `maumgyeot/src/index.ts:399-423` |
| 형제 서비스 | **수달 ↔ 곁 — `'otter'`/`'gyeot'` 만 다르고 동일** |
| 근거 | 수달 설계서 §10.1 "계약상 확인된 구멍" 4번 · 곁 설계서 §10.1 |

**무엇이 문제인가** — 원문(`maumotter:539-543`):
```ts
if (p.service && p.service !== 'otter') return c.json({ error: 'service mismatch' }, 400);   // ← p.service 가 없으면 통과
const email = String(p.email || '').toLowerCase();
const grantType = String(p.grantType || '');
const orderId = String(p.orderId || '');
// ← p.amount 는 어디에서도 읽지 않는다
```
① `service` 필드가 **아예 없는** 토큰은 `p.service` 가 falsy → `&&` 앞에서 끊겨 **검사를 통째로 건너뛴다.** 같은 `MAUM_SSO_SECRET` 로 서명된 다른 용도 토큰(수달은 `/api/auth/sso` 가 같은 `verifySso` 를 공유 — 수달 설계서 §10.1 "수달 ↔ 곁 차이" 2번)이 grant 로 흘러들 수 있다.
② `amount` 는 서명 안에 들어 있는데 **지급량은 `grantType` 만으로 결정**된다(`applyGrant` 수달 L124 / 곁 L118). 금액과 지급량의 대조가 0이다. 지금은 발신이 마음풀 한 곳이라 실피해가 없지만, **금액 검증이 없다는 사실 자체가 계약의 구멍**이다.

**같은 파일에 이미 있는 올바른 패턴** — 바로 아래 L544:
```ts
if (!email || !orderId) return c.json({ error: 'email/orderId 누락' }, 400);
```
**필수 필드는 "있으면 검사"가 아니라 "없으면 거부"** 다. `service` 도 이 형태여야 한다.

**확인 방법**
```bash
grep -n "p.service" maumotter/src/index.ts maumgyeot/src/index.ts     # 각 1건(= /api/grant 만)
grep -n "p.amount" maumotter/src/index.ts maumgyeot/src/index.ts      # 0건 = 미사용
grep -n "PLAN\[grantType\]\|PACK\[grantType\]" maumotter/src/index.ts # 546
```
재현: R-37 검증의 서명 스크립트에서 payload 의 `service` 키를 **지우고** 서명 → `POST /api/grant` → 그래도 `200 {ok:true,applied:true}` 가 나온다.

**구현 방법** (양쪽 동일. 수달 `'otter'`, 곁 `'gyeot'`)
1. `service` 를 **필수**로:
   ```ts
   if (p.service !== 'otter') return c.json({ error: 'service mismatch' }, 400);
   ```
   *안전 근거*: 발신측은 **항상** `service` 를 넣는다 — `deliverGrant` L3176 `service: pkg.service` · 재시도 L3206 `service: r.service`. 즉 **정상 트래픽에 `service` 없는 토큰은 존재하지 않는다.**
2. `amount` 형식 검증을 추가한다. 수신측은 가격표를 모르므로 **상수표를 새로 만들지 말고**(가격 이중 관리 = R-40 과 같은 부류의 사고) 형식만 본다:
   ```ts
   const amount = Number(p.amount || 0);
   if (!Number.isInteger(amount) || amount <= 0) return c.json({ error: 'amount 누락' }, 400);
   ```
   그리고 `external_orders` INSERT 에 `amount` 를 함께 기록한다 → **컬럼 추가는 BATCH_03 의 `external_orders` DDL 에 처음부터 포함시켜라.** DDL 이 아직 없으면 **금액 기록은 보류하고 형식 검증만** 넣고 보고서 §5 에 적어라.
3. revoke 의 `service` 검사는 R-37 ①-1 에서 함께 넣는다.

**검증 방법**
```bash
# service 없는 토큰 → 400
curl -s -X POST https://maumotter.com/api/grant -H 'Content-Type: application/json' -d "{\"token\":\"$T_NOSERVICE\"}"   # {"error":"service mismatch"}
# service:'gyeot' 토큰을 수달에 → 400
curl -s -X POST https://maumotter.com/api/grant -H 'Content-Type: application/json' -d "{\"token\":\"$T_GYEOT\"}"        # {"error":"service mismatch"}
# amount 없는 토큰 → 400
curl -s -X POST https://maumotter.com/api/grant -H 'Content-Type: application/json' -d "{\"token\":\"$T_NOAMOUNT\"}"     # {"error":"amount 누락"}
# 정상 6필드 → 200 (기존 동작 무영향)
curl -s -X POST https://maumotter.com/api/grant -H 'Content-Type: application/json' -d "{\"token\":\"$T\"}"              # {"ok":true,"applied":true,…}
```
**곁도 동일하게 4종 전부.**

**주의 — 잘못 고치면 무슨 일이 나나**
- **`amount` 를 "지급량 결정"에 쓰지 마라.** 금액→플랜 역산을 넣는 순간 가격표가 수신측에도 생겨 이중 관리가 된다. `amount` 는 **대조용**이다.
- **`service` 를 필수로 바꾸는 순간 마음풀의 revoke 호출부가 전부 `service` 를 갖고 있는지 확인하라.** L1160·L4569 에는 `service:'phyweb'` 이 있지만, **R-37 에서 새로 만드는 수달·곁 revoke 토큰에 `service` 를 빠뜨리면 회수가 전건 400** 이다 — 카드만 환불되는 지금 상태가 **그대로 재현**된다.
- 수달·곁 배포는 GitHub 웹UI 자동배포다. **한쪽만 올리면 한쪽만 조여진다.** 같은 흐름에서 둘 다.

---

## 2. 결제 웹훅 · 지급 — R-38 · R-39 · R-40 · R-41

> §1.5 **CTS 는 유지보수 모드**다. R-38·R-39·R-41 은 전부 **버그·에러 수정이므로 허용 범위**지만 "겸사겸사" 개선을 얹지 마라. **지시된 것만.**

### [R-38] CTS 토스 웹훅에 결제 재조회 검증이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | **S1** |
| 대상 | `cts-maum-main/src/index.tsx:1737-1782` |
| 형제 서비스 | **마음풀 `maumful-main/src/index.tsx:3391-3490` = 정답 패턴(2026-07-21 보강). 마음풀은 수정 대상이 아니다** |
| 근거 | CTS 설계서 §10.1 API 표 L248 · §15-19 |

**무엇이 문제인가** — 원문(L1743-1754·1760-1773):
```ts
const tossSecret = c.env.TOSS_WEBHOOK_SECRET
if (tossSecret) {
  const authHeader = c.req.header('Authorization') ?? ''
  const expected = 'Basic ' + btoa(tossSecret + ':')
  if (authHeader !== expected) { console.error('[Toss Webhook] 서명 불일치 — 위조 요청 차단'); return c.json({ error: 'Unauthorized' }, 401) }
} else {
  // 시크릿 미설정 시 로그만 남기고 개발 환경에서 통과 (프로덕션에서는 반드시 설정)
  console.warn('[Toss Webhook] TOSS_WEBHOOK_SECRET 미설정 — 서명 검증 건너뜀')     // ← 그대로 지급으로 진행
}
…
const { userId, packageKey } = (body.metadata as Record<string, string>) ?? {}   // L1760 ← 본문을 그대로 신뢰
const pkg = PACKAGES[packageKey]                                                 // L1762
await gainCredits(DB, parseInt(userId), pkg.credits, 'charge', pgTid)            // L1773 ← 지급
```
`TOSS_WEBHOOK_SECRET` 이 없으면 **아무 검증 없이 본문만으로 크레딧이 지급된다.** `{"status":"DONE","paymentKey":"아무거나","metadata":{"userId":"1","packageKey":"pro_kr"}}` 를 던지면 700cr 이 들어온다. 시크릿이 설정돼 있어도 **토스는 웹훅에 Authorization 헤더를 실어 주지 않는다**(마음풀 L3394-3400 주석의 실측) — 즉 **켜면 정상 웹훅이 401 로 막히고, 끄면 무검증**인 양자택일 구조다.

**같은 조직의 올바른 패턴 — 마음풀 2026-07-21 보강 원문**(`maumful-main/src/index.tsx:3394-3443`). **이걸 CTS 에 이식하라.**
```ts
// ── 웹훅 검증 방식 (2026-07-21 변경) ──────────────────────────────
// 토스 웹훅 등록 콘솔에는 서명 시크릿/Authorization 설정란이 없다(실측). 즉 토스는 이
// 요청에 서명 헤더를 실어 주지 않는다. 예전 코드는 Authorization: Basic 헤더를 강제해
// 실제 라이브 웹훅이 전부 401/503으로 막혔다.
// → 진짜 검증은 아래 "이중 방어 ②"가 한다: 본문을 믿지 않고 토스 API에 결제를 되물어
//   (TOSS_SECRET_KEY) status=DONE·금액을 재확인하고, 지급 근거는 요청이 아니라 우리 DB
//   (orderId→chargeId의 pending 행)에서만 찾는다. 위조 본문으로는 크레딧을 못 받는다.
const tossSecret = c.env.TOSS_WEBHOOK_SECRET
const authHeader = c.req.header('Authorization')
if (tossSecret && authHeader && authHeader !== 'Basic ' + btoa(tossSecret + ':')) {
  console.error('[Toss Webhook] Authorization 헤더 불일치 — 차단'); return c.json({ error: 'Unauthorized' }, 401)
}
…
// 토스 웹훅 페이로드는 결제 객체가 최상위로 오거나 data 안에 올 수 있다(버전차) → 둘 다 대응.
const evt = (body.data && typeof body.data === 'object') ? (body.data as Record<string, unknown>) : body
if (evt.status !== 'DONE') return c.json({ ok: true })
const pgTid = evt.paymentKey as string
…
// ── 이중 방어 ②: 토스에 실제 결제인지 되묻는다 ────────────────────
// 서명이 뚫리더라도 여기서 막힌다. 요청 본문(metadata)은 신뢰하지 않는다.
const tossKey = c.env.TOSS_SECRET_KEY
if (!tossKey) { console.error('[Toss Webhook] TOSS_SECRET_KEY 미설정'); return c.json({ error: 'server' }, 500) }
let pay: { status?: string; orderId?: string; totalAmount?: number }
try {
  const inq = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(pgTid)}`,
    { headers: { 'Authorization': 'Basic ' + btoa(tossKey + ':') } })
  if (!inq.ok) { console.error('[Toss Webhook] 결제 조회 실패 — 지급 거부. paymentKey:', pgTid, 'status:', inq.status); return c.json({ error: 'payment not found' }, 400) }
  pay = await inq.json()
} catch (e) { console.error('[Toss Webhook] 결제 조회 오류:', e); return c.json({ error: 'inquiry failed' }, 502) }  // 502면 토스가 재시도
if (pay.status !== 'DONE') return c.json({ ok: true, msg: 'not_done' })
```

**확인 방법**
```bash
grep -n "TOSS_WEBHOOK_SECRET" cts-maum-main/src/index.tsx maumful-main/src/index.tsx
sed -n '3391,3443p' maumful-main/src/index.tsx     # 정답 원문을 눈으로
sed -n '1737,1782p' cts-maum-main/src/index.tsx    # CTS 현재
npx wrangler secret list --name lightoflife        # TOSS_WEBHOOK_SECRET · TOSS_SECRET_KEY 등록 여부 실측
npx wrangler tail --name lightoflife               # 실제 웹훅 본문 1건 확보(아래 주의 참조)
```
재현(**스테이징에서만**):
```bash
curl -s -X POST https://<staging>/api/webhook/toss -H 'Content-Type: application/json' \
  -d '{"status":"DONE","paymentKey":"FORGED_'$(date +%s)'","metadata":{"userId":"1","packageKey":"pro_kr"}}'
# 시크릿 미설정이면 {"ok":true} + 크레딧 700 증가 → 재현 성공
npx wrangler d1 execute lightoflife-db --remote --command "SELECT credits FROM users WHERE id=1"
```

**구현 방법** — 마음풀 L3391-3443 을 **그대로 옮긴다.** 차이는 세 가지뿐이다.
1. CTS `PACKAGES`(L1587)에는 `service` 필드가 없다 → 마음풀 L3465-3487 의 `deliverGrant` 분기는 **가져오지 마라**(신규 기능 = §1.5 위반). `gainCredits` 한 줄만 남긴다.
2. 지급 근거를 DB 에서 찾는 부분은 **R-39 와 한 몸**이다 — 아래 R-39 를 함께 적용한다.
3. 시크릿 검사는 마음풀처럼 **"헤더가 실제로 온 경우에만 대조"** 로 완화하고 `else { console.warn }` 블록은 지운다. 대신 **`TOSS_SECRET_KEY` 미설정 시 500** 으로 막는다(이게 진짜 게이트다).

**검증 방법**
```bash
cd cts-maum-main && npx tsc --noEmit
grep -n "api.tosspayments.com/v1/payments/" cts-maum-main/src/index.tsx   # 웹훅 안에 재조회 fetch 1건 추가됨
grep -n "서명 검증 건너뜀" cts-maum-main/src/index.tsx                     # 0건
# 위조 본문 재차단
curl -s -X POST https://<staging>/api/webhook/toss -H 'Content-Type: application/json' \
  -d '{"status":"DONE","paymentKey":"FORGED_x","metadata":{"userId":"1","packageKey":"pro_kr"}}'
# → {"error":"payment not found"} (400) · 크레딧 변화 없음
```
**정상 경로 무영향** — 스테이징 실결제 1건을 태워 `credit_charges.status='completed'` + 크레딧 정상 지급 + **웹훅과 success 콜백이 겹쳐도 1회만** 지급(`already_processed`)되는지.

**주의 — 잘못 고치면 무슨 일이 나나**
- **재조회 실패에 `200 {ok:true}` 를 돌려주면 토스가 재시도를 멈춘다** → 진짜 결제가 영구 미지급. 마음풀처럼 **조회 실패는 400(거부) / 네트워크 오류는 502(재시도 유도)** 로 구분하라.
- **`TOSS_SECRET_KEY` 가 없는 환경에 이 코드를 올리면 웹훅이 전부 500** 이다. `npx wrangler secret list` 로 먼저 확인하고, 없으면 **배포하지 말고** 보고서 §5 에 적어라.
- CTS 웹훅은 `body.status`·`body.metadata` 를 **최상위에서만** 읽는데(L1758·1760) 토스는 `data` 안에 싣는 버전이 있다(마음풀 L3411 주석). 즉 **이 웹훅은 지금껏 한 번도 정상 동작한 적이 없을 수 있다.** `wrangler tail` 로 실제 본문을 한 번 찍어 확인하고 결과를 보고서 §4 에 적어라.
- 루트 `TOSS_PAYMENTS_GUIDE.md:212-243` 의 웹훅 예제는 **보강 이전 패턴**(metadata 신뢰)이다. 가이드를 보고 되돌리지 마라 — 이 배치에서 **가이드도 함께 정정**(§1.10)하고 마음풀 L3394 주석을 인용해 둘 것.
- CTS 는 서브모듈이다. 내부 커밋 → push → **부모 포인터 커밋**(§1.6).

### [R-39] 지급 대상 특정이 느슨하다 — `WHERE pg=? AND status='pending' AND user_id=?`

| 항목 | 내용 |
|---|---|
| 심각도 | **S1** |
| 대상 | `cts-maum-main/src/index.tsx:1771-1772`(토스) · `1852-1853`(Stripe) |
| 형제 서비스 | **마음풀 = 정답**(`maumful-main/src/index.tsx:3446-3462`). 마음풀 쪽은 대조만 하고 **고치지 마라** |
| 근거 | CTS 설계서 §15-20 · RISKS R-39 |

**무엇이 문제인가** — 원문(L1771):
```ts
await DB.prepare('UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE pg=? AND status=? AND user_id=?')
  .bind('completed', pgTid, 'toss', 'pending', parseInt(userId)).run()
```
`id` 도 `orderId` 도 금액도 없다. UPDATE 는 **매칭되는 행 전부**를 바꾸므로 같은 사용자에게 pending 이 3건이면 **3건 모두 `completed` + 같은 `pg_tid`** 가 박힌다. 결제 1건으로 장바구니가 통째로 완료 처리된다. Stripe(L1852)도 문자 그대로 같다.
게다가 지급량은 `pkg = PACKAGES[packageKey]`(L1762) — **웹훅 본문이 말하는 패키지**이지 DB 에 기록된 주문이 아니다.

**같은 조직의 올바른 패턴 — 마음풀 원문**(`maumful-main/src/index.tsx:3446-3462`):
```ts
// 지급 근거는 요청이 아니라 **우리 DB**. orderId는 checkout이 `charge_<chargeId>_<ts>`로 만든다.
const m = /^charge_(\d+)_/.exec(String(pay.orderId ?? ''))
if (!m) { console.error('[Toss Webhook] orderId 형식 불일치:', pay.orderId); return c.json({ error: 'bad orderId' }, 400) }
const chargeId = parseInt(m[1])
const charge = await DB.prepare('SELECT user_id, credits, amount, status, package_key FROM credit_charges WHERE id=? AND pg=?')
  .bind(chargeId, 'toss').first<…>()
if (!charge) { console.error('[Toss Webhook] charge 없음:', chargeId); return c.json({ error: 'charge not found' }, 404) }

// 금액 위조 차단 — 토스가 말하는 실제 결제금액과 주문 시 확정한 금액이 같아야 한다.
if (Number(pay.totalAmount) !== Number(charge.amount)) {
  console.error('[Toss Webhook] 금액 불일치 — 지급 거부. 토스:', pay.totalAmount, 'DB:', charge.amount, 'chargeId:', chargeId)
  return c.json({ error: 'amount mismatch' }, 400)
}

// 원자적 선점 — pending일 때만 완료 처리. success 콜백과 동시에 와도 한 번만 지급된다.
const upd = await DB.prepare('UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE id=? AND status=?')
  .bind('completed', pgTid, chargeId, 'pending').run()
if (upd.meta.changes === 0) return c.json({ ok: true, msg: 'already_processed' })
```
핵심 3가지 — **① `orderId → chargeId` 로 단일 행 지정 ② 토스가 말하는 금액과 DB 금액 대조 ③ `WHERE id=? AND status='pending'` 선점 후 `meta.changes` 판정.**

**확인 방법**
```bash
grep -n "WHERE pg=? AND status=? AND user_id=?" cts-maum-main/src/index.tsx    # 1771 · 1852
grep -n "charge_(\\\\d+)_" maumful-main/src/index.tsx                           # 3447 (정답)
grep -n "orderId  = \`charge_" cts-maum-main/src/index.tsx                      # 1895 — CTS도 같은 형식으로 만든다
npx wrangler d1 execute lightoflife-db --remote --command \
 "SELECT user_id, COUNT(*) c FROM credit_charges WHERE status='pending' GROUP BY 1 HAVING c>1"
```
**마지막 쿼리에서 행이 나오면 이미 노출된 사용자다.** 건수를 보고서 §4 에 기록하라.

**구현 방법** — R-38 과 **한 커밋으로** 간다(분리하면 중간 상태가 더 위험하다).
1. 토스 웹훅: 재조회 응답 `pay.orderId` 에서 `charge_(\d+)_` 로 `chargeId` 추출 → `WHERE id=? AND pg='toss'` 단건 SELECT → `pay.totalAmount` vs `charge.amount` 대조 → `WHERE id=? AND status='pending'` UPDATE + `meta.changes` 판정.
2. 지급량은 **본문의 `packageKey` 가 아니라 `charge.credits`** 를 쓴다(마음풀 L3474 `gainCredits(DB, charge.user_id, charge.credits, …)`).
3. `metadata.userId`·`packageKey` 의존을 **없앤다**(L1760-1762 삭제). CTS `checkout`(L1874-1917)은 metadata 를 실어 보내지도 않는다.
4. Stripe 웹훅(L1852)도 동일 형태로. Stripe 는 **서명 검증이 이미 정상**(L1786-1830)이니 **재조회는 넣지 말고** 단건 지정 + 금액 대조 + 원자적 선점 **3가지만**. 단 Stripe 응답에서 어떤 필드가 `chargeId` 를 싣는지 **레포에서 특정되지 않았다 — 현장 확인할 것.** 못 하면 **Stripe 는 건드리지 말고** 보고서 §5 에(토스만 고쳐도 S1 은 닫힌다).

**검증 방법**
```bash
cd cts-maum-main && npx tsc --noEmit
grep -n "AND user_id=?" cts-maum-main/src/index.tsx      # 토스 웹훅에서 0건
grep -n "meta.changes === 0" cts-maum-main/src/index.tsx # 원자적 선점 판정 존재
```
**다중 pending 재현 테스트**(스테이징): 같은 계정으로 결제창을 3번 열어 pending 3건을 만든 뒤 그중 1건만 결제 → **그 1건만 `completed`**, 나머지 2건은 `pending` 인지.
**멱등**: 같은 웹훅을 2회 던져 크레딧이 **1회만** 지급되는지(`{"ok":true,"msg":"already_processed"}`).

**주의 — 잘못 고치면 무슨 일이 나나**
- **`meta.changes` 판정을 빼면** success 콜백(L1918)과 웹훅이 동시에 도착할 때 **이중 지급**이다. CTS success 콜백은 `existing` 선조회(L1944)로만 막는데 그건 원자적이지 않다 — 웹훅 쪽에서 반드시 잡아라.
- **금액 대조를 "경고 로그"로만 두면 의미가 없다.** 불일치는 **400 거부**다.
- **`charge.credits` 대신 `PACKAGES[...].credits` 를 계속 쓰면** 가격표를 바꾸는 순간 과거 주문의 지급량이 달라진다. 반드시 **주문 시점에 확정돼 DB 에 박힌 값**을 쓴다.
- `credit_charges.status` 에 CHECK 제약이 있을 수 있다 — 새 상태값(`processing` 등)을 **발명하지 마라.** `pending → completed` 직접 전이만.

### [R-40] 마음풀 `user_subscriptions` INSERT 실패가 통째로 삼켜진다

| 항목 | 내용 |
|---|---|
| 심각도 | **S1** (구독 결제는 받고 기록이 없다 = 갱신·해지 추적 불가) |
| 대상 | `maumful-main/src/index.tsx:3350-3361`(삼킴) · `3363-3366`(크레딧 지급) · `3259`(SUBSCRIPTION_PLANS) · `6216`(Cron 내부 `plans`) · `3376-3385`(cancel) |
| 형제 서비스 | — (CTS 에도 유사 코드가 있으나 **범위 밖**) |
| 근거 | 마음풀 설계서 §10.3 · RISKS R-40 |

**무엇이 문제인가** — 원문(L3350-3366):
```ts
    // DB에 구독 기록 생성
    // user_subscriptions 테이블 필요 (0007_subscriptions.sql 참조)
    try {
      await DB.prepare(`
        INSERT OR REPLACE INTO user_subscriptions
        (user_id, plan_key, billing_key, customer_key, status, monthly_credits, price, next_billing_date)
        VALUES (?,?,?,?,'active',?,?,?)
      `).bind(uId, planKey, billing.billingKey, customerKey, plan.monthlyCredits, plan.price, nextBillingDate.toISOString()).run()
    } catch {
      // user_subscriptions 테이블 없으면 무시 (마이그레이션 필요)
    }

    // 첫 달 크레딧 즉시 지급
    await DB.prepare('UPDATE users SET credits = credits + ? WHERE id=?').bind(plan.monthlyCredits, uId).run()
```
빈 `catch {}` 다. INSERT 가 실패해도 **바로 다음 줄에서 첫 달 크레딧이 지급되고 `/?sub=success` 로 리다이렉트**된다. 사용자는 구독한 줄 알고, `billing_key` 는 **어디에도 남지 않아** ① 다음 달 자동결제가 안 돌고(`handleScheduled` L6212 는 `user_subscriptions` 를 읽는다) ② `/api/subscription/me`(L3274)가 `null` → 해지 버튼도 없고 ③ `DELETE /api/subscription/cancel`(L3376)은 `changes=0` 인데 **`try/catch` 로 감싸 성공을 반환**한다.

`migrations/0007_subscriptions.sql` 은 **존재한다**(`user_subscriptions` + `subscription_invoices`, `CREATE TABLE IF NOT EXISTS`). **적용 여부는 원격 DB 실측이 필요하다.**

**플랜 상수 이중 관리** — `SUBSCRIPTION_PLANS`(L3259)와 Cron 내부 `plans`(L6216)가 **같은 값을 두 번 적는다**. 한쪽만 고치면 가입가와 갱신가가 갈라진다. (현재 값은 전수 대조로 동일함을 확인했다 — basic 60/3900 · standard 150/8900 · pro 400/19900.)

**확인 방법**
```bash
sed -n '3348,3368p' maumful-main/src/index.tsx
grep -n "user_subscriptions 테이블 없으면 무시" maumful-main/src/index.tsx     # 3360
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(user_subscriptions)"   # 빈 결과 = 테이블 없음
npx wrangler d1 execute maumful-db --remote --command "SELECT COUNT(*) subs FROM user_subscriptions"
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT user_id,reason,amount,created_at FROM credit_transactions WHERE reason LIKE 'subscription_%' ORDER BY id DESC LIMIT 20"
```
**마지막 쿼리에 행이 있는데 `user_subscriptions` 가 비어 있으면 = 이미 발생한 사고다.** 건수·사용자 id 를 보고서 §4 에 쓰고 사용자에게 알려라.

**구현 방법**
1. `migrations/0007_subscriptions.sql` 을 원격에 적용한다(없으면):
   ```bash
   npx wrangler d1 execute maumful-db --remote --file=maumful-main/migrations/0007_subscriptions.sql
   ```
   `CREATE TABLE IF NOT EXISTS` 라 재실행해도 안전하다.
2. **빈 `catch` 를 제거하고 실패를 실패로 만든다.** 구독 기록 없이 크레딧을 주지 않는다:
   ```ts
    try {
      await DB.prepare(`INSERT OR REPLACE INTO user_subscriptions …`).bind(…).run()
    } catch (e) {
      console.error('[구독] user_subscriptions INSERT 실패 — 크레딧 미지급:', e, 'userId:', uId, 'plan:', planKey)
      return c.redirect('/?sub=fail&msg=' + encodeURIComponent('<사용자 확인 후 확정할 문구>'))
    }
   ```
   **⚠️ 이 시점에 토스 빌링키는 이미 발급돼 있다**(L3336-3342). 실패 시 빌링키를 그대로 두면 카드가 등록된 채 남는다 → **문구·빌링키 삭제 여부는 §2.2 사용자 확인 대상.** 확정 전에는 **에러 로그 + 실패 리다이렉트**까지만 하고 보고서 §6 에 올려라.
3. `DELETE /api/subscription/cancel`(L3376-3385)의 `meta.changes === 0` 을 404 로 돌려준다(지금은 무조건 성공).
4. **플랜 상수 일원화** — L6216 의 지역 `plans` 를 지우고 `SUBSCRIPTION_PLANS` 를 직접 참조한다. 값이 동일함은 대조로 확인했으므로 동작 변화 없음.

**검증 방법**
```bash
cd maumful-main && npx tsc --noEmit
grep -n "테이블 없으면 무시" maumful-main/src/index.tsx      # 0건
grep -n "const plans: Record" maumful-main/src/index.tsx      # 0건 (Cron 중복 제거)
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(user_subscriptions)"   # 12컬럼
```
**엔드투엔드(스테이징)** — 구독 결제 1건 → `user_subscriptions` 1행(`status='active'`, `billing_key` 채워짐) + `credit_transactions` 에 `subscription_basic` → `GET /api/subscription/me` 가 그 행을 돌려주는지 → `DELETE /api/subscription/cancel` 후 `status='cancelled'`.
**기존 동작 무영향** — 일반 크레딧 충전(`starter_kr`) 1건이 여전히 정상인지(구독 경로와 무관함을 실제로 태워 확인).

**주의 — 잘못 고치면 무슨 일이 나나**
- **테이블을 만들지 않고 `catch` 만 없애면 구독 결제가 전부 실패로 돌아선다.** 반드시 **마이그레이션 먼저.**
- `INSERT OR REPLACE` + `UNIQUE(user_id)`(0007 L19) 조합이라 **기존 구독자가 플랜을 바꾸면 행이 통째로 교체**된다(`cancelled_at`·`current_period_start` 소실). `ON CONFLICT … DO UPDATE` 로 바꾸고 싶어질 텐데 **이건 이 배치 범위 밖**이다. 보고서 §4 에 기록만.
- Cron(L6206)은 **매월 1일 00:00 에 실제 카드에서 돈을 뺀다.** `plans` 상수를 정리하다 금액을 한 자리 틀리면 **전 구독자에게 잘못된 금액이 청구**된다. 값 대조를 눈으로 두 번 하라.
- `/?sub=fail&msg=…` 문구는 사용자에게 보인다 → §2.2. 임의 확정 금지.

### [R-41] CTS `PAYMENT_LIVE = true` 로 바꿔도 결제가 되지 않는다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `cts-maum-main/public/static/app.jsx:4579`(플래그) · `4581-4618`(handlePay) · `166`(prepareCharge) · `src/index.tsx:2161-2170`(prepare-charge) · `1874-1917`(checkout) |
| 형제 서비스 | **마음풀 = 정답**(`maumful-main/public/static/app.jsx:182-185`·`6101-6125`) |
| 근거 | CTS 설계서 §15-18 · RISKS R-41 |
| 상태 | ⚠️ **"고치기 전에 무엇이 진짜 문제인지 확인" 단계가 특히 중요하다. 아래 대조표를 먼저 만들어라.** |

**무엇이 문제인가 — 프론트가 기대하는 응답 ↔ 실제 응답 대조**

프론트(`app.jsx:4586-4608`)는 `api.prepareCharge()` 결과 `d` 에서 **7개 필드**를 꺼낸다:
```js
const res = await api.prepareCharge(selected, isKorea ? 'toss' : 'stripe');   // → POST /api/credits/prepare-charge
const d = res.data;
const tp = window.TossPayments(d.clientKey);
await tp.requestPayment('카드', { amount: d.amount, orderId: d.orderId, orderName: d.orderName,
  customerName: d.customerName, customerEmail: d.customerEmail, successUrl: d.successUrl, failUrl: d.failUrl });
```
그런데 `/api/credits/prepare-charge`(`src/index.tsx:2169`)가 돌려주는 것은 **3개뿐**이다:
```ts
return c.json({ success: true, data: { chargeId: r.meta.last_row_id, credits: pkg.credits, amount: pkg.amount } })
```

| 프론트가 쓰는 필드 | `prepare-charge` 응답 | `toss/checkout` 응답(L1902-1915) |
|---|---|---|
| `clientKey` | ❌ 없음 → `TossPayments(undefined)` | ✅ |
| `orderId` | ❌ 없음 | ✅ `charge_<id>_<ts>` |
| `orderName` | ❌ 없음 | ✅ |
| `customerName` / `customerEmail` | ❌ 없음 | ✅ |
| `successUrl` / `failUrl` | ❌ 없음 | ✅ |
| `amount` | ✅ | ✅ |
| `chargeId` | ✅ | ✅ |

→ 플래그만 켜면 `window.TossPayments(undefined)` 에서 바로 터진다. **라이브 전환은 상수 한 줄이 아니다.**

**두 번째 문제 — SDK 로드 방식.** CTS 는 결제 직전에 동적 로드한다(`app.jsx:4594` · `counseling.jsx:97`):
```js
const s = document.createElement('script'); s.src = 'https://js.tosspayments.com/v1/payment'; …
```
루트 `TOSS_PAYMENTS_GUIDE.md:20-22` 원문:
> ```html
> <!-- HTML <head>에 정적 포함 (동적 로드 시 실패 가능) -->
> <script src="https://js.tosspayments.com/v1"></script>
> ```
**마음풀은 가이드대로 한다**(`maumful-main/src/index.tsx:4984`): `<!-- 토스페이먼츠 SDK (크레딧 결제) --> <script src="https://js.tosspayments.com/v1"></script>`. CTS 의 `<head>` 에는 **없다**(`grep js.tosspayments cts-maum-main/src/index.tsx` → 0건).

**마음풀의 대응 코드 = 정답**(`app.jsx:182-185` · `6106-6124`):
```js
  async tossCheckout(packageKey) {
    const r = await this._fetch('/api/payment/toss/checkout', { method: 'POST', body: JSON.stringify({ packageKey }) });
    return r.json();
  },
…
          const res = await api.tossCheckout(selected);                                   // ← prepareCharge 가 아니다
          if (!res.success) { setErrMsg(res.error || t('결제 준비 실패','…')); setLoading(false); return; }
          const d = res.data;
          lastOrderId = d.orderId || '';
          if (typeof window.TossPayments !== 'function') {                                 // ← SDK 로드 실패를 먼저 잡는다
            setErrMsg(t('결제 SDK 로드 실패. 페이지를 새로고침(Ctrl+Shift+R) 후 다시 시도해주세요.', '…')); setLoading(false); return;
          }
          const tossPayments = window.TossPayments(d.clientKey);
          await tossPayments.requestPayment('카드', { amount: d.amount, orderId: d.orderId, orderName: d.orderName,
            customerName: d.customerName, customerEmail: d.customerEmail, successUrl: d.successUrl, failUrl: d.failUrl });
        } else {
          const res = await api.prepareCharge(selected, 'stripe');                         // ← Stripe 는 prepareCharge 유지
```

**확인 방법 — 고치기 전에 이 순서로 재현하라**
```bash
grep -rn "toss/checkout" cts-maum-main/public/static/   # 0건 = 프론트 호출부 없음 (compiled 포함해서 확인)
sed -n '4581,4610p' cts-maum-main/public/static/app.jsx
sed -n '2161,2170p' cts-maum-main/src/index.tsx
grep -n "js.tosspayments" cts-maum-main/src/index.tsx cts-maum-main/public/static/*.jsx
curl -I https://js.tosspayments.com/v1          # 200
curl -I https://js.tosspayments.com/v1/payment  # 상태 코드를 기록해 둘 것
npx wrangler secret list --name lightoflife | grep -i toss   # TOSS_CLIENT_KEY · TOSS_SECRET_KEY
```
브라우저 재현: `PAYMENT_LIVE = true` 로 **로컬에서만** 바꿔 `npm run build:jsx` → 결제 버튼 → DevTools 콘솔에 `TypeError: window.TossPayments is not a function` 또는 SDK 가 `clientKey` 를 못 읽는 에러가 뜨는지 확인하고 **에러 원문을 보고서에 붙여라.**

**구현 방법** — ⚠️ **BATCH_00 §2.2 — 여기서 멈추고 물어라.**
`PAYMENT_LIVE` 를 `true` 로 바꾸는 것은 **결제 개시** 결정이며 정산·세금계산서·환불 정책·토스 계약(비영리 CTS 의 결제 주체)이 걸린다. 지시서가 결정할 일이 아니다. **코드 배선만 고치고 플래그는 `false` 로 둔 채 사용자에게 물어라.**

플래그와 무관하게 **지금 해도 되는 배선 수정**:
1. `app.jsx` 의 `api` 객체(L166 근처)에 마음풀과 동일한 `tossCheckout()` 을 추가한다.
2. `handlePay`(L4581)의 한국 분기를 `api.prepareCharge(...)` → `api.tossCheckout(selected)` 로 교체. `isKorea === false` 분기(Stripe)는 **그대로 둔다**(`prepareCharge` 가 맞다).
3. `window.TossPayments` 존재 확인을 **동적 로드 대신** 마음풀 형태로: `<head>` 에 `<script src="https://js.tosspayments.com/v1"></script>` 를 넣고(CTS `src/index.tsx` 의 SPA `<head>` 생성부), `handlePay` 에서는 `typeof window.TossPayments !== 'function'` 이면 안내 후 종료. **동적 로드 코드는 제거한다.**
4. `counseling.jsx:97` 의 동적 로드도 같은 문제를 안고 있다 — **상담 예약 결제는 이 배치 범위 밖이다.** 손대지 말고 보고서 §4 에 기록.
5. `npm run build:jsx` 로 `public/static/compiled/` 재생성 후 **커밋**. CTS CI(`.github/workflows/deploy.yml`)는 **`build:jsx` 를 돌리지 않는다**(RISKS R-33) → 커밋 안 하면 옛 번들이 나간다.

**검증 방법**
```bash
grep -rn "prepareCharge" cts-maum-main/public/static/app.jsx        # Stripe 분기 1곳만
grep -rn "toss/checkout" cts-maum-main/public/static/               # compiled 포함 2건 이상 = 재컴파일 확인
grep -n "js.tosspayments.com/v1\"" cts-maum-main/src/index.tsx      # <head> 정적 포함 1건
grep -rn "createElement('script')" cts-maum-main/public/static/app.jsx | grep tosspayments   # 0건
cd cts-maum-main && npx tsc --noEmit
```
**응답 대조**:
```bash
curl -s -X POST https://jesusmaum.com/api/payment/toss/checkout -H "Authorization: Bearer $CTS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"packageKey":"starter_kr"}' | jq '.data|keys'
# → ["amount","chargeId","clientKey","customerEmail","customerName","failUrl","orderId","orderName","successUrl"]
```
**렌더 검증(필수)** — `PAYMENT_LIVE=false` 상태에서 충전 모달을 열어 **버튼이 비활성으로 정상 렌더**되고 콘솔 에러가 없는지. 플래그를 켜는 것은 사용자 승인 후.

**주의 — 잘못 고치면 무슨 일이 나나**
- **`PAYMENT_LIVE` 를 임의로 `true` 로 바꾸지 마라.** 실제 카드에서 돈이 빠진다. §2.2.
- `prepare-charge` 와 `toss/checkout` 은 **둘 다 `credit_charges` pending 행을 만든다.** 호출부를 바꾸지 않고 둘 다 부르면 **주문 1건에 pending 2행** → R-39 의 느슨한 WHERE 와 겹쳐 **엉뚱한 건이 완료 처리**된다. 반드시 **한쪽만** 부르게 하라.
- **R-39 를 먼저 고쳐라.** `toss/checkout` 의 `orderId`(`charge_<id>_<ts>`)는 R-39 의 지급 근거다. 순서가 뒤집히면 라이브 전환 시 지급이 안 된다.
- `<head>` 에 스크립트를 넣을 때 **CTS SPA `<head>` 생성부가 여러 곳일 수 있다**(§1.1 — app·landing·counseling·counseling_admin). 전 파일 확인 후 결론낼 것.
- CTS 유지보수 모드: **결제 화면 문구·상품 구성·가격은 건드리지 마라**(§1.5·§2.2).

---

## 3. 제휴 정산 — R-47

### [R-47] 요약 API 와 원장 API 의 산식이 다르다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 (제휴사에게 보이는 금액이 두 화면에서 어긋난다 = 신뢰·정산 분쟁) |
| 대상 | `maumful-main/src/index.tsx:6447`(partner-stats) · `6483`(partner-settlement) ↔ `4074`(적립) · `6502-6529`(원장) · `6607-6628`(제휴사 포털) |
| 형제 서비스 | — |
| 근거 | 마음풀 설계서 §10.5 마지막 ⚠️ 2줄 · RISKS R-47 |
| 선행 | **BATCH_03** (`partner_commissions` DDL 부재 — 0.4-2) |

**무엇이 문제인가** — 네 가지가 동시에 다르다.

| # | 축 | 요약 API(`/partner-stats` L6447 · `/partner-settlement` L6483) | 원장 API(`/partner-commissions` L6502 · 포털 L6607) |
|---|---|---|---|
| 1 | **율** | `partners.revenue_share_rate` = **지금 값** | `partner_commissions.rate` = **적립 시점 스냅샷**(L4073-4076) |
| 2 | **절사** | `Math.floor(합계 × 율)` — **합계에 한 번** | `Math.round(건별 금액 × 율)` 을 **SUM** (L4074) |
| 3 | **모집단** | `credit_charges WHERE partner_code=? AND status='completed'` — 적립 조건 무관 | `partner_commissions` — `is_active=1` · `rate>0` · `commission_start/end` 귀속기간을 **통과한 건만**(L4067-4072) |
| 4 | **기간 기준** | `date(credit_charges.created_at)` | `date(partner_commissions.created_at)` = **적립 시각**. 적립 조건은 또 `date(COALESCE(completed_at, created_at))` 로 판정(L4064·4070) |

원문 대조:
```ts
// 적립 — L4073-4076
const rate = p.revenue_share_rate
const share = Math.round(ch.amount * rate)
await db.prepare("INSERT OR IGNORE INTO partner_commissions (charge_id, partner_code, user_id, charge_amount, rate, share_amount, currency) VALUES (?,?,?,?,?,?,?)")
// 요약 — L6447
settlement: { period_revenue: periodRevenue, share_amount: Math.floor(periodRevenue * shareRate) },
// 요약 — L6483
const shareAmount = Math.floor(totalRevenue * partner.revenue_share_rate)
```
**어긋남의 크기** — 절사 차이(축 2)는 값에 따라 0 일 때가 많다. **진짜 위험은 축 1(율 변경)과 축 3(모집단)** 이다. 율을 0.15→0.10 으로 바꾼 다음 날, 원장은 옛 건에 0.15 를 그대로 쓰고 요약은 전부 0.10 으로 재계산한다. **추측하지 말고 실데이터로 대조하라.**

**확인 방법**
```bash
grep -n "Math.floor(periodRevenue\|Math.floor(totalRevenue\|Math.round(ch.amount" maumful-main/src/index.tsx   # 6447 · 6483 · 4074
# 0) 테이블 실재 확인 (BATCH_03 선행)
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(partner_commissions)"
# 1) 두 산식을 같은 기간에 대해 직접 대조
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT p.code, p.revenue_share_rate now_rate,
         (SELECT COALESCE(SUM(amount),0) FROM credit_charges cc WHERE cc.partner_code=p.code AND cc.status='completed') gross,
         CAST((SELECT COALESCE(SUM(amount),0) FROM credit_charges cc WHERE cc.partner_code=p.code AND cc.status='completed')*p.revenue_share_rate AS INT) summary_share,
         (SELECT COALESCE(SUM(share_amount),0) FROM partner_commissions pc WHERE pc.partner_code=p.code AND pc.status!='reversed') ledger_share
  FROM partners p WHERE p.is_active=1"
# summary_share ≠ ledger_share 인 행이 어긋난 파트너다. 결과를 보고서 §2 에 붙여라.
```

**구현 방법** — **원장이 진실이다.** 요약을 원장에서 읽도록 바꾼다(재계산을 없앤다).
1. `/api/admin/partner-settlement`(L6454-6498): `credit_charges` 합계 × 현재율 대신 **`partner_commissions` 를 집계**한다.
   ```ts
   const led = await DB.prepare(
     `SELECT COUNT(*) cnt, COALESCE(SUM(charge_amount),0) revenue, COALESCE(SUM(share_amount),0) share
      FROM partner_commissions WHERE partner_code=? AND status!='reversed' AND date(created_at) >= ? AND date(created_at) <= ?`
   ).bind(code.toUpperCase(), fromDate, toDate).first<{cnt:number; revenue:number; share:number}>()
   const totalRevenue = led?.revenue ?? 0
   const shareAmount  = led?.share ?? 0
   ```
   **응답 키(`total_revenue`·`share_rate`·`share_amount`·`maumful_revenue`·`new_users`·`paid_users`)는 그대로 유지한다** — 어드민 프론트가 읽는다. `share_rate` 는 참고값이므로 `partners.revenue_share_rate` 를 계속 넣되 **응답 스키마에 새 키를 넣지 마라.**
2. `/api/admin/partner-stats`(L6447)의 `settlement.share_amount` 도 동일하게 원장 합계로.
3. `Math.floor` / `Math.round` 는 **원장의 `Math.round`(L4074)가 기준**. 요약에서 곱셈 자체를 없애면 자동으로 통일된다.
4. **적립 누락 보정은 하지 마라.** 원장에 없는 건(`accruePartnerCommission` 이 비차단 `.catch` 라 조용히 빠진 건 — 마음풀 설계서 §15-1)을 요약이 덮어 주고 있었을 수 있다. 위 확인 쿼리의 차이를 **보고서 §4 에 건수·금액으로 기록**하고, 소급 적립 스크립트는 **§2.2 사용자 확인** 후에.

**검증 방법**
```bash
cd maumful-main && npx tsc --noEmit
grep -n "Math.floor(periodRevenue\|Math.floor(totalRevenue" maumful-main/src/index.tsx   # 0건
# 같은 파트너·같은 기간을 세 API 로 조회해 share 가 일치하는지
P=TESTCODE; F=2026-08-01; T=2026-08-31
curl -s -H "Authorization: Bearer $ADMIN_SECRET" "https://maumful.com/api/admin/partner-settlement?code=$P&month=2026-08"    | jq '.data.share_amount'
curl -s -H "Authorization: Bearer $ADMIN_SECRET" "https://maumful.com/api/admin/partner-commissions?code=$P&from=$F&to=$T"   | jq '.data.totals.share'
curl -s -H "Authorization: Bearer $ADMIN_SECRET" "https://maumful.com/api/admin/partner-stats?code=$P&from=$F&to=$T"         | jq '.data.settlement.share_amount'
# → 세 값이 같아야 한다
```
**기존 동작 무영향** — 제휴사 포털(`/api/partner-portal/commissions` L6607)은 **원래부터 원장을 읽는다 → 고치지 마라.** 포털 값이 수정 전후로 **변하지 않았는지** 확인하는 것이 회귀 검증이다.

**주의 — 잘못 고치면 무슨 일이 나나**
- **응답 키를 바꾸면 어드민 화면이 빈칸이 된다.** 어느 `.jsx` 가 읽는지 §1.1 대로 전 파일 확인.
- **`status!='reversed'` 를 빼면 환불된 건까지 제휴사에게 지급**된다. `settled` 는 포함해야 하고(이미 지급한 것), `reversed` 만 제외다.
- **`partner_commissions` 가 원격에 없으면**(0.4-2) 이 수정은 요약 API 를 **500 으로 죽인다.** 지금은 요약이 `credit_charges` 만 보므로 살아 있다. **DDL 먼저.**
- 정산 금액은 실제 송금 근거다. **소급 UPDATE·재계산 배치를 임의로 돌리지 마라** — 이미 `settled` 된 건은 손대지 않는 것이 현 정책이다(L4079-4081 주석 *"이미 정산(지급)된 건은 건드리지 않는다"*).

---

## 4. 차감 · 환불 · 메일 — R-11 · R-21 · R-13

### [R-11] 마음곁 — 쿼터를 LLM 호출 전에 차감하고 실패해도 환불이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumgyeot/src/index.ts:310-316`(`/api/observe`) · `172-205`(`runTranslation`) · `104-116`(`consumeQuota`) |
| 형제 서비스 | **마음수달** `maumotter/src/index.ts:348-353`(`/api/session/start`) — 구조는 같지만 차감 단위가 다르다. 아래 4번 참조 |
| 근거 | 곁 설계서 §15-12 · RISKS R-11 |

**무엇이 문제인가** — 원문(`maumgyeot:310-316`):
```ts
  // 실제 통역 시도일 때만 쿼터 차감(무료월→구독→회차권). 한도 초과 시 402. 마스터는 면제.
  if (realAttempt && !master) {
    const q = await consumeQuota(c.env, uid);
    if (!q.ok) return c.json({ error: '이번 달 통역 횟수를 모두 사용했어요…', code: 'QUOTA' }, 402);
  }
  const { report, hasVideo, healthFlag } = await runTranslation(c.env, { … });   // ← 여기서 LLM
```
`runTranslation`(L186-197)은 **LLM 실패를 자기 안에서 삼킨다**:
```ts
    } catch (e) { console.log('OBSERVE_FAIL', String((e as any)?.message || e)); await logError(env, 'observe_llm', e); }
```
→ 예외가 밖으로 안 나가고, 함수 진입 전 선언된 안전 기본 리포트(`'신호가 충분하지 않아 해석이 어려워요…'`, L184)가 그대로 반환된다. 게이트웨이 장애로 `callClaude` 가 2회 모두 실패해도 **200 + 쓸모없는 리포트 + 쿼터는 이미 차감.** 환불 경로가 없다(`grep refund` → 0건).

**확인 방법**
```bash
sed -n '298,325p' maumgyeot/src/index.ts
sed -n '184,198p' maumgyeot/src/index.ts       # catch 가 예외를 삼키는 지점
grep -rn "refundQuota\|refund" maumotter/src/index.ts maumgyeot/src/index.ts   # 0건 = 환불 함수 없음
grep -n "consumeQuota" maumotter/src/index.ts maumgyeot/src/index.ts           # 곁 104·312 / 수달 111·350
```
재현: 게이트웨이 주소나 키를 잠깐 무효화한 뒤 `/api/observe` 호출 → 200 + 기본 리포트가 오고 `usage_monthly.used` 가 +1 되는지:
```bash
npx wrangler d1 execute maumgyeot-db --remote --command \
 "SELECT * FROM usage_monthly WHERE maum_user_id=<uid> AND ym=strftime('%Y%m','now')"
```

**구현 방법** — 차감 시점은 **그대로 두고**(선차감은 남용 방지에 필요하다) **실패 시 되돌린다.**
1. `runTranslation` 이 성공/실패를 알려주게 한다. 시그니처를 깨지 말고 **플래그만 추가**:
   ```ts
   return { report, hasVideo, healthFlag, llmOk };
   ```
   `llmOk` 는 `let llmOk = false` 로 시작해 `report = parsed` / `report = p2` 가 실행된 자리에서만 `true`. **"시도 안 함" 경로는 애초에 `realAttempt` 가 false 라 차감도 안 된다** — 구분해서 처리할 것.
2. 되돌림 헬퍼를 `consumeQuota` 바로 아래에 새로 만든다. **`consumeQuota` 가 어느 통에서 뺐는지(`source`)를 그대로 되돌려야 한다**:
   ```ts
   async function refundQuota(env: Bindings, uid: number, source?: string): Promise<void> {
     if (source === 'pack') {
       await env.DB.prepare("UPDATE packs SET remaining=remaining+1, updated_at=datetime('now') WHERE maum_user_id=?").bind(uid).run();
     } else if (source) {   // 'free' | 'subscription' — 둘 다 usage_monthly 카운터
       await env.DB.prepare("UPDATE usage_monthly SET used=MAX(0, used-1) WHERE maum_user_id=? AND ym=?").bind(uid, ym()).run();
     }
   }
   ```
3. 호출부(L310-316)를 `q.source` 를 들고 있다가 `llmOk === false` 면 `refundQuota` 하도록 바꾼다. **사용자 응답은 지금과 동일하게 200 + 기본 리포트**를 유지하되(화면 문구 변경은 §2.2) 되돌림 사실을 로그에 남긴다.
4. **수달은 이번에 고치지 마라.** 수달은 `/api/session/start`(L350)에서 차감하고 LLM 은 `/api/session/:id/utterance`(L363)·`/end`(L385)에서 돈다. **세션은 시작되면 대화가 실제로 오가므로 "시도조차 못 함"이 아니다** → 곁과 성격이 다르다. 보고서 §4 에 "동일 구조이나 차감 단위가 세션이라 판단 필요"로 기록하라.
5. **마음커플 변형**(RISKS R-11 두 번째 문단): `/api/couple/session`(L466-469)이 20~45cr 선차감하고 `/api/couple/report`(L652-656)가 502 로 실패해도 환불이 없다. 다만 세션은 남아 있어 **재시도가 가능**하고 `ai_report_text` 캐시(L619-621)로 이중 차감도 없다 → **손실이 아니라 "재시도 필요"** 다. 이번엔 고치지 말고 §4 에 이 판단을 기록하라.

**검증 방법**
```bash
grep -n "refundQuota" maumgyeot/src/index.ts     # 정의 1 + 호출 1
grep -n "llmOk" maumgyeot/src/index.ts           # runTranslation 반환 + 호출부
```
실동작:
```bash
# 1) 정상 통역 1회 → used +1
npx wrangler d1 execute maumgyeot-db --remote --command "SELECT used FROM usage_monthly WHERE maum_user_id=<uid> AND ym=strftime('%Y%m','now')"
# 2) 게이트웨이를 막고 통역 1회 → used 가 그대로여야 한다(되돌림)
# 3) 회차권만 남은 계정으로 2)를 반복 → packs.remaining 이 그대로여야 한다
npx wrangler d1 execute maumgyeot-db --remote --command "SELECT remaining FROM packs WHERE maum_user_id=<uid>"
```
**기존 동작 무영향** — 한도 초과 계정이 여전히 `402 {code:'QUOTA'}` 를 받는지. 비회원 `/api/observe/guest`(L327)는 **건드리지 마라**(KV 카운터라 별개).

**주의 — 잘못 고치면 무슨 일이 나나**
- **`used = used - 1` 을 무조건 돌리면 무한 무료**가 된다. `MAX(0, used-1)` + **`llmOk === false` 인 경로에서 정확히 1회만.** 재시도 루프 안에 넣지 마라.
- **`source` 를 무시하고 항상 `usage_monthly` 만 되돌리면** 회차권에서 뺀 건이 월 카운터로 돌아와 **회차권이 소멸**한다. 반대로 항상 `packs` 로 돌리면 **회차권이 무한 증식**한다. `consumeQuota` 의 `source`(L107·L112)를 반드시 그대로 받아라.
- `runTranslation` 은 **비회원 미리보기(L342)도 같이 쓴다.** 반환 필드를 추가하는 것은 안전하지만 **기존 필드 이름·형태를 바꾸면 비회원 경로가 깨진다.**
- 수달·곁은 배포가 GitHub 웹UI 자동이다. **곁만 고치고 수달을 안 고쳤다는 사실을 보고서에 명시**하라(§1.4).

### [R-21] 마음커플 — 크레딧 차감 시점이 기능마다 3가지, 일부는 반환값 미검사

| 항목 | 내용 |
|---|---|
| 심각도 | S3 (금액은 작지만 **잔액 0 인데 유료 기능이 무료로 나간다**) |
| 대상 | `package/maumcouple/src/index.tsx:1065-1067`(date-course) · `1144-1146`(solo-analysis) · `800-805`(couple-coach) |
| 형제 서비스 | — |
| 근거 | 커플 설계서 §15-4 · RISKS R-21 |

**무엇이 문제인가** — 같은 파일 안에 4가지 패턴이 섞여 있다.

| 패턴 | 라우트 | 코드 | 판정 |
|---|---|---|---|
| A 선차감·검사O | `/api/couple/session` L466-469 | `const result = await spendCredits(...); if (!result.ok) return 402` | 안전 |
| **B 후차감·검사O** | emotion-translate **L1396-1400** · fight-mediate **L1454-1458** · kakao-analyze **L1518-1522** | `const cr = await spendCredits(...); if (!cr.ok) return c.json({…}, 402)` | **정답 패턴** |
| **C 후차감·검사X** | date-course **L1065-1067** · solo-analysis **L1144-1146** | `if (COST > 0 && !isMaster) { await spendCredits(DB, userId, COST, '…') }` | ⛔ **결함** |
| **D 사전확인·검사X** | couple-coach **L800-805** | `if (user.credits < PAID_COST) return 402` → `await spendCredits(...)` | ⛔ **경쟁 조건 + 미검사** |

`spendCredits`(L142-162)는 **원자적이고 이미 실패를 알려 준다**:
```ts
  const result = await db.prepare(
    'UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?'
  ).bind(amount, userId, amount).run()
  if (!result.meta.changes) {
    const u = await db.prepare('SELECT credits FROM users WHERE id=?').bind(userId).first<{ credits: number }>()
    return { ok: false, balance: u?.credits ?? 0, error: 'insufficient_credits' }     // ← C·D 가 이걸 버린다
  }
```
C 는 `{ok:false}` 를 **그냥 버리고** `return c.json({ success: true, data: { course: courseText … } })` 로 간다 → **잔액 0 인데 AI 결과가 그대로 나간다.** D 는 라우트 시작 시점의 `user.credits` 스냅샷으로 판정하므로 다른 탭에서 그사이 소진되면 같은 결과다.

**같은 파일에 이미 있는 올바른 패턴 — L1396-1400 원문**(감정번역):
```ts
    // AI 성공 후 차감 — spendCredits()로 WHERE credits >= ? 원자적 처리
    if (!isMaster) {
      const cr = await spendCredits(DB, userId, COST, 'emotion-translate')
      if (!cr.ok) return c.json({ success: false, error: '크레딧 부족', needsCharge: true }, 402)
    }
    return c.json({ success: true, result })
```
중재(L1454-1458)·카톡(L1518-1522)이 **문자 단위로 같다.** **이 형태로 통일하라.**

**확인 방법**
```bash
grep -n "spendCredits(" package/maumcouple/src/index.tsx     # 142(정의) 468 804 1066 1145 1398 1456 1520
grep -n -A1 "await spendCredits" package/maumcouple/src/index.tsx | grep -c "cr.ok\|result.ok"   # 정답 패턴 건수
```
재현: 크레딧 0 인 계정으로 `POST /api/couple/date-course` → **200 + 코스 텍스트**가 나오고 `credit_transactions` 에 spend 행이 없으면 재현 성공:
```bash
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT credits FROM users WHERE id=<uid>"
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT reason,amount,created_at FROM credit_transactions WHERE user_id=<uid> ORDER BY id DESC LIMIT 5"
```

**구현 방법** — 패턴 B 로 통일한다. **차감 시점은 옮기지 마라**(AI 성공 후 그대로).
1. `date-course` L1065-1067:
   ```ts
   if (COST > 0 && !isMaster) {
     const cr = await spendCredits(DB, userId, COST, 'date-course')
     if (!cr.ok) return c.json({ success: false, error: '크레딧 부족', needsCharge: true }, 402)
   }
   ```
2. `solo-analysis` L1144-1146 도 동일(`reason: 'solo-analysis'`).
3. `couple-coach` L800-805: 사전 `user.credits < PAID_COST` 검사는 **UX 용으로 남겨 두고**(빠른 402) 그 뒤 `spendCredits` 의 반환값도 검사한다.
4. **응답 스키마 주의** — 이 세 라우트는 각각 `{success, data:{course}}` · `{success, data:{report}}` · 코치 전용 형태다(커플 설계서 §15-14 "응답 스키마 불일치"). **실패 응답은 기존 402 형태(`{success:false, error, needsCharge}`)에 맞추고 성공 응답은 한 글자도 바꾸지 마라.**
5. 프론트(`public/static/couple_hub.jsx`)가 402 + `needsCharge` 를 어떻게 처리하는지 확인하라 — B 패턴 3개가 이미 402 를 쓰므로 **처리부가 이미 있을 가능성이 높다.** 없으면 충전 안내로 이어지도록 최소 배선만 추가하고 **문구는 기존 402 문구를 재사용**(§2.2).

**검증 방법**
```bash
grep -n "await spendCredits" package/maumcouple/src/index.tsx     # 모든 호출이 const cr = / const result = 형태
cd package/maumcouple && npx tsc --noEmit && npm run build:jsx
```
실동작(크레딧 0 계정):
```bash
for R in date-course solo-analysis coach; do
  curl -s -o /dev/null -w "$R %{http_code}\n" -X POST "https://couple.maumful.com/api/couple/$R" \
    -H "Authorization: Bearer $COUPLE_TOKEN" -H 'Content-Type: application/json' -d '{}'
done     # → 전부 402
```
**기존 동작 무영향** — 크레딧이 충분한 계정에서 3개 기능이 정상 동작하고 **정확히 1/5/2 cr 이 빠지는지** `credit_transactions` 로 확인.
**렌더 검증(필수)** — 마음커플 도구 탭 → 데이트 코스·솔로 분석 실행 → 결과 렌더 + 잔액 갱신. 커플엔 `render_smoke.cjs` 가 없다(§0.4-4) → 브라우저로.

**주의 — 잘못 고치면 무슨 일이 나나**
- **AI 호출 전으로 차감을 옮기면** 마음곁 R-11 과 똑같은 결함을 새로 만든다. **옮기지 마라.**
- **`isMaster` 분기를 건드리면** 마스터 계정(오너)이 과금된다. `isMasterAccount()` 조건은 그대로.
- 402 를 반환하면서 **AI 결과를 함께 실어 보내지 마라.** 그러면 무료 제공과 다를 게 없다.
- `spendCredits` 함수 자체는 정상이다. **여기를 "개선"하지 마라** — 마음풀 `users.credits` 를 직접 건드리는 함수라 파급이 크다.
- `compiled/couple_hub.js` 를 커밋하지 않으면 배포는 옛 번들이다.

### [R-13] 마음커플 주간 인사이트 메일의 수신거부가 정보통신망법 요건 미달

| 항목 | 내용 |
|---|---|
| 심각도 | S2 (**법적 요건**) |
| 대상 | `package/maumcouple/src/index.tsx:1604`(푸터) · `1567-1620`(`sendCoupleInsightEmail`) · `1650~`(cron 분기) · `wrangler.toml:22-23` |
| 형제 서비스 | **마음게임 = 정답**(`maumgame-main/src/index.tsx:1206-1228`·`1607-1618`·`1345-1350`·`1322-1328` + `migrations/0006_email_prefs.sql`) |
| 근거 | 커플 설계서 §11.4·§15-3 · 마음풀 설계서 §11.6 · RISKS R-13 |
| 상태 | ⚠️ **법적 요건이다. 문구·링크·정책을 임의로 정하지 마라(§2.2).** |

**무엇이 문제인가** — 푸터 원문(L1604):
```html
<p style="font-size:11px;color:#bbb;margin:0">마음커플 · <a href="https://couple.maumful.com" style="color:#E05A8A">수신 거부</a></p>
```
"수신 거부"라고 써 놓고 **홈으로만 보낸다.** 누르면 아무것도 해지되지 않는다. opt-out 테이블도, 서명 링크도, 해지 라우트도 없다(`grep -rn "unsubscribe\|optout" package/maumcouple/src package/maumcouple/migrations` → 0건).

**지금 당장 메일이 나가지는 않는다** — `wrangler.toml:22-23`:
```
[triggers]
crons = ["0 3 1 * *"]   # 매월 1일 03:00 UTC: 만료 세션 정리 (주간 이메일은 cron 5개 한도로 비활성)
```
코드(L1650 근처)에는 `if (event.cron === '0 23 * * 0')` 분기가 살아 있다. **cron 을 켜는 순간 위법 발송이 시작된다.**

**마음풀 본체에는 수신거부 구현이 없다** — 마음풀 설계서 §11.6 이 가리키는 구현체는 **마음게임**이다(*"마음게임 주간 리포트 메일이 `game_email_prefs.optout` + `GET /unsubscribe?u=&s=`(HMAC 서명, 로그인 불필요)를 쓴다. 마음풀에서 신규 발송 기능을 만들 때도 동일 원칙."*). 따라서 **인용할 정답은 마음게임 코드**다. 네 조각으로 되어 있다.

**① opt-out 테이블** (`maumgame-main/migrations/0006_email_prefs.sql` 전문):
```sql
-- 마음게임 주간 리포트 이메일 수신 설정 (opt-out 방식)
-- 정보통신망법: 수신거부 수단 제공 필수. users 테이블은 마음풀 소유이므로 게임 전용 테이블로 분리한다.
CREATE TABLE IF NOT EXISTS game_email_prefs (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  optout     INTEGER  NOT NULL DEFAULT 0,   -- 1 = 주간 리포트 수신거부
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**② HMAC 서명 링크**(`index.tsx:1607-1618`) — 로그인 없이 누를 수 있어야 하므로 위조 방지 필수:
```ts
// 수신거부 링크 — HMAC 서명(JWT_SECRET)으로 위조 방지. 서명 불가 시 링크 생략 대신 설정 안내로 폴백.
async function buildUnsubUrl(env: Bindings, userId: number): Promise<string> {
  const sig = await signUnsub(env, userId)
  return `https://game.maumful.com/unsubscribe?u=${userId}&s=${sig}`
}
async function signUnsub(env: Bindings, userId: number): Promise<string> {
  const secret = env.JWT_SECRET || ''
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`unsub:${userId}`))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
```
**③ 해지 라우트**(`index.tsx:1206-1228`) — 로그인 불필요, 서명 대조 후 UPSERT, 결과 안내 페이지:
```ts
// ── 주간 리포트 수신거부 (이메일 링크에서 바로 — 로그인 불필요, HMAC 서명으로 위조 방지) ──
app.get('/unsubscribe', async (c) => {
  const uid = Number(c.req.query('u')); const sig = c.req.query('s') || ''
  …
  if (!uid || !sig || sig !== await signUnsub(c.env, uid)) {
    return page('링크가 올바르지 않아요', '수신거부 링크가 만료되었거나 잘못되었습니다.<br>문의: support@maumful.com')
  }
  await DB.prepare(
    `INSERT INTO game_email_prefs (user_id, optout, updated_at) VALUES (?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET optout=1, updated_at=CURRENT_TIMESTAMP`
  ).bind(uid).run()
  return page('수신거부가 완료됐어요', '앞으로 주간 리포트 메일을 보내지 않습니다.<br>서비스 이용에는 아무 영향이 없어요.')
})
```
**④ 발송 대상에서 제외 + 본문 고지**(`index.tsx:1345-1350` · `1322-1328`):
```ts
    LEFT JOIN game_email_prefs p   ON gsl.user_id = p.user_id
  WHERE gsl.created_at >= date('now', '-7 days')
    AND u.is_email_verified = 1
    AND COALESCE(p.optout, 0) = 0
```
```html
<div style="font-size:11px;color:#B0B0A0;margin-top:6px;line-height:1.6;">
  이 메일은 회원님의 마음게임 이용 내역 안내입니다.<br>
  더 이상 받고 싶지 않으시면 <a href="${stats.unsubUrl}" style="color:#8A8A7A;">수신거부</a>를 눌러 주세요.
</div>
```

**확인 방법**
```bash
grep -rn "unsubscribe\|optout" package/maumcouple/src/ package/maumcouple/migrations/   # 0건
grep -n "수신 거부" package/maumcouple/src/index.tsx                                    # 1604
grep -n "crons" package/maumcouple/wrangler.toml                                        # 22-23 (주간 메일 미등록)
sed -n '1206,1228p' maumgame-main/src/index.tsx                                         # 정답 라우트
cat maumgame-main/migrations/0006_email_prefs.sql                                        # 정답 스키마
npx wrangler secret list --name maumcouple | grep -i jwt                                 # JWT_SECRET 유무 실측
```

**구현 방법** — ⚠️ **§2.2 — 사용자에게 먼저 물어라.** 아래 셋은 **사용자 판단 사항**이다. 보고서 §6 에 올리고 답을 받기 전엔 1~5 까지만 하라.
- (a) **메일 문구·발신 근거 고지 표현** — 법정 표기라 임의 작성 금지. 마음게임 문구를 그대로 쓸지, 마음커플용으로 다시 쓸지.
- (b) **도메인·경로** — `https://couple.maumful.com/unsubscribe` 로 할지. 마음커플 워커가 `/unsubscribe` 를 서빙할 수 있는지 라우팅 확인 필요.
- (c) **opt-out 범위** — 마음커플만인지, 마음풀 전체 마케팅 메일 공통인지. `users` 는 마음풀 소유 테이블이라 게임은 **전용 테이블로 분리**했다(0006 주석) — 커플도 같은 판단이 필요.

**답을 받기 전에 해도 되는 것 (1~5)**
1. `package/maumcouple/migrations/0003_email_prefs.sql` 신설 — 마음게임 0006 을 그대로 본뜬 `couple_email_prefs`. **같은 D1(`maumful-db`)을 공유하므로 이름 충돌을 반드시 확인하라**: `npx wrangler d1 execute maumful-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%email_prefs%'"`.
2. `signUnsub` / `buildUnsubUrl` 을 마음게임 형태로 이식(`JWT_SECRET` 실측 필요).
3. `GET /unsubscribe` 라우트 이식. **안내 페이지 문구는 (a) 확정 전까지 마음게임 문구를 그대로** 두고 TODO 주석.
4. cron 대상 조회 쿼리(L1650 근처)에 `LEFT JOIN couple_email_prefs … AND COALESCE(p.optout,0)=0` 추가. **푸터 L1604 의 가짜 링크를 실제 `unsubUrl` 로 교체**하고 발신 근거 고지 문단을 추가.
5. **cron 은 켜지 마라.** `wrangler.toml` 은 손대지 않는다. 켜는 것은 (a)(b)(c) 확정 + 실발송 검증 후 사용자 결정이다(루트 `CLAUDE.md` 백로그 *"주간 리포트 메일 실수신 검증(사용자 동의 후)"*).

**검증 방법**
```bash
grep -n "couple_email_prefs\|signUnsub\|buildUnsubUrl" package/maumcouple/src/index.tsx
cd package/maumcouple && npx tsc --noEmit
npx wrangler d1 execute maumful-db --remote --file=package/maumcouple/migrations/0003_email_prefs.sql
# 서명 링크 동작
curl -s "https://couple.maumful.com/unsubscribe?u=<uid>&s=<올바른서명>" | grep -o "수신거부가 완료"
curl -s "https://couple.maumful.com/unsubscribe?u=<uid>&s=deadbeef"     | grep -o "링크가 올바르지"
npx wrangler d1 execute maumful-db --remote --command "SELECT * FROM couple_email_prefs WHERE user_id=<uid>"   # optout=1
grep -n "crons" package/maumcouple/wrangler.toml   # 변경 없음(주간 메일 여전히 비활성)
```
**메일 렌더 확인** — 발송하지 말고 `sendCoupleInsightEmail` 의 `html` 을 파일로 떨궈 브라우저로 열어 푸터 링크가 실제 서명 URL 인지 눈으로.

**주의 — 잘못 고치면 무슨 일이 나나**
- **문구를 임의로 지어내지 마라.** 법정 고지 표현이다. 마음게임 원문을 인용하거나 사용자가 확정할 때까지 TODO 로 둬라.
- **서명 없이 `?u=<id>` 만으로 해지되게 만들면** 누구나 남의 수신을 끌 수 있고 사용자 열거도 된다. HMAC 을 빼지 마라.
- **`JWT_SECRET` 이 마음커플 워커에 없으면** `signUnsub` 이 빈 문자열로 서명한다 → 예측 가능. 실측하고 없으면 **라우트를 배포하지 말고** 보고서 §5 에.
- **cron 을 "테스트 삼아" 켜지 마라.** 실사용자에게 메일이 나간다.
- 마음게임 `game_email_prefs` 를 **재사용하지 마라.** 서비스가 섞여 게임 수신거부가 커플 메일까지 끄거나 그 반대가 된다.

---

## 5. 커밋 분리 (BATCH_00 §1.7)

최소 7개 커밋. 섞지 마라.
```
[maumotter]   R-45 grant service 필수화 + amount 형식 검증 / R-37 revoke service 검사 + grant/status 신설
[maumgyeot]   R-45 동일 / R-37 동일 / R-11 LLM 실패 시 쿼터 되돌림
[maumful]     R-37 revoke URL SERVICE_API 일원화 + 관리자환불 분기 확대 + credits=0 회수 스킵
[maumful]     R-40 구독 INSERT 실패 처리 + 플랜 상수 일원화 / R-47 정산 요약을 원장 기준으로
[cts]         R-38 웹훅 결제 재조회 + R-39 orderId·금액 대조 + R-41 checkout 배선   ← 서브모듈
[maumcouple]  R-21 spendCredits 반환값 검사 통일 / R-13 수신거부 기반(cron 미활성)
[공통]        R-44 CLAUDE.md 3종 grant 계약 정정 + TOSS_PAYMENTS_GUIDE 웹훅 예제 정정 + BATCH_02 결과 보고서 + RISKS.md 갱신
```
`cts-maum-main` 커밋 후 **부모 레포 포인터 커밋**(§1.6). 수달·곁은 GitHub 웹UI → Cloudflare 자동배포.

---

## 6. 이 배치의 완료 기준

- [ ] **R-44** — `CLAUDE.md` 3종에서 3필드 표기 0건 · 6필드 표기 3건 · 설계서 §10.1 표와 대조 완료
- [ ] **R-37** — 마음풀에 `phyweb.pages.dev` 하드코딩이 `SERVICE_API` 정의 1건만 남음 · 관리자환불이 수달·곁 revoke 를 호출 · `external_orders.status='revoked'` 확인 · `credits=0` 상품의 헛도는 크레딧 회수 제거 · **`starter_kr` 환불 회귀 확인** · `/api/grant/status` 신설(판정 기준은 §6 에 질문으로) · **수달·곁 양쪽**
- [ ] **R-45** — `service` 없는/틀린/`amount` 없는 토큰 3종이 전부 400 · 정상 6필드는 200 · **수달·곁 양쪽**
- [ ] **R-38** — 위조 본문 400 · `TOSS_WEBHOOK_SECRET` 미설정에서도 무검증 통과 없음 · 정상 결제 1건 지급 · 웹훅+success 중복 시 1회만
- [ ] **R-39** — `WHERE … user_id=?` 0건 · pending 3건 중 결제한 1건만 completed · `meta.changes` 판정 존재 · Stripe 는 적용했거나 미적용 사유 기록
- [ ] **R-40** — `user_subscriptions` 원격 실재 확인 · 빈 `catch` 0건 · Cron 지역 `plans` 제거 · 구독 1건 엔드투엔드 · **실측 건수(구독 거래는 있는데 행이 없는 사용자) 기록**
- [ ] **R-41** — `toss/checkout` 프론트 호출부 존재 · `prepare-charge` 는 Stripe 분기만 · SDK `<head>` 정적 포함 · `compiled/` 재생성 커밋 · **`PAYMENT_LIVE` 는 `false` 유지** + 사용자 질문 기록
- [ ] **R-47** — 세 API 의 share 값 일치 · 제휴사 포털 값 수정 전후 불변 · 요약↔원장 차액 실측 결과 기록
- [ ] **R-11** — LLM 실패 시 `usage_monthly`/`packs` 원복(2종 모두) · 한도 초과 402 유지 · 수달 미수정 사유 기록
- [ ] **R-21** — `spendCredits` 호출부 전부 반환값 검사 · 잔액 0 계정에서 3개 라우트 402 · 정상 계정 차감량 정확 · 렌더 검증
- [ ] **R-13** — opt-out 테이블·서명·라우트·발송 제외·푸터 링크 완료 · **cron 미활성 확인** · 문구/도메인/범위 3건을 보고서 §6 에
- [ ] 서비스별 커밋 분리 + `cts-maum-main` 부모 포인터 커밋
- [ ] `docs/DESIGN.md` §15 갱신 + 개정 이력 (마음풀·CTS·수달·곁·커플 **5곳**) · **`TOSS_PAYMENTS_GUIDE.md` 웹훅 예제 정정**
- [ ] `_docs/RISKS.md` 의 R-11·13·21·37·38·39·40·41·44·45·47 해소 표기
- [ ] 배포 완료 또는 미배포 사유 (`wrangler deploy` 는 **포그라운드**)
- [ ] 결과 보고서 작성 완료

---

## 7. 결과 보고서

작성 경로: **`_docs/작업지시서/결과/BATCH_02_결과.md`** — 양식은 **BATCH_00 §3.1 템플릿 그대로**. `[공통]` 커밋으로 함께 올린다.

**§3(전제 불일치)에 최소 아래 4건은 들어가야 한다** — 지시서 작성 중 코드에서 이미 확인된 것이다.

| 이슈 | 지시서/RISKS 의 전제 | 실제 코드 |
|---|---|---|
| R-37 | "셀프환불(L1186)·관리자환불(L4570) **2곳** 이 하드코딩이라 수달·곁 환불이 새어 나간다"(RISKS R-37) | **셀프환불은 L1143-1144 에서 수달·곁을 이미 400 으로 막는다**(`refPkg.service !== 'phyweb'`). 프론트 환불 버튼도 `tx.reason==='charge'`(app.jsx:5511) 조건이라 `credits:0` 상품엔 **뜨지 않는다**. 실제로 새는 곳은 **관리자환불 한 곳**이고 그 원인은 하드코딩이 아니라 **L4565 의 `=== 'phyweb'` 분기** 다 |
| R-37 | "수달·곁이 지급을 받고 있다" | 수신측 `external_orders` **DDL 이 없어**(양 서비스 `migrations/` 전수 확인) `/api/grant` 의 첫 SELECT 부터 던진다 → 현재는 **지급 자체가 실패**(`external_grants.status='failed'`)일 가능성이 높다. 실측 필요(§0.5) |
| R-47 | "산식 차이 = 현재율×floor vs 적립시점율×round" | 그 둘 **말고도 모집단·기간 기준이 다르다** — 요약은 `credit_charges` 전체(귀속기간·`is_active`·`reversed` 무시), 원장은 적립 조건 통과분만. **절사 차이보다 이쪽이 크다.** 또 `partner_commissions` 는 **DDL 이 어느 `.sql` 에도 없다** |
| R-41 | "`clientKey`·`orderId`·`successUrl` 3개가 없다" | 실제로 없는 것은 **7개**(`clientKey`·`orderId`·`orderName`·`customerName`·`customerEmail`·`successUrl`·`failUrl`). 게다가 CTS 는 SDK 를 **동적 로드**(`app.jsx:4594`)하는데 루트 가이드가 *"동적 로드 시 실패 가능"* 이라 명시하고 마음풀은 `<head>` 정적 포함(`index.tsx:4984`)이다 — **두 번째 원인** |

**§4(새로 발견한 것)에 기록할 것** — 이 배치에서 고치지 않는다.

| # | 내용 | 심각도 추정 | 조치 |
|---|---|---|---|
| 1 | **`partner_commissions` DDL 부재** — `maumful-main/migrations/` 전수 확인 결과 `CREATE TABLE partner_commissions` 가 없다. 제휴 정산 원장·포털·CSV 가 모두 이 테이블에 의존 | S1 | **BATCH_03**. 원격 실재 여부를 `PRAGMA table_info` 로 실측해 기록 |
| 2 | 수달·곁 revoke 가 구독 만료일에서 `days` 를 **하한 없이** 뺀다(`maumotter:573` · `maumgyeot:439`) — 연속 환불 시 만료일이 과거로 간다 | S3 | 범위 밖. `MAX(now, expires-days)` 보정 제안 |
| 3 | 마음풀 `INSERT OR REPLACE INTO user_subscriptions` + `UNIQUE(user_id)`(0007 L19) — 플랜 변경 시 `cancelled_at`·`current_period_start` 가 날아간다 | S3 | 범위 밖. `ON CONFLICT … DO UPDATE` 후보 |
| 4 | CTS `counseling.jsx:97` 도 토스 SDK 를 동적 로드한다(상담 예약 결제) — R-41 과 같은 결함 | S3 | 범위 밖(상담 결제 경로) |
| 5 | 루트 `TOSS_PAYMENTS_GUIDE.md:212-243` 웹훅 예제가 **보강 이전 패턴**(metadata 신뢰·재조회 없음) — 이 가이드를 보고 구현하면 R-38 을 재생산한다 | S2 | R-38 과 함께 가이드 정정(§1.10) |
| 6 | CTS 토스 웹훅이 `body.status`·`body.metadata` 를 **최상위에서만** 읽는다(L1758·1760). 토스는 `data` 안에 싣는 버전이 있다 → **지금껏 한 번도 정상 동작하지 않았을 수 있다** | S2 | `wrangler tail` 로 실제 본문 확인 후 기록 |
| 7 | 마음커플 `/api/couple/report` 502 시 세션 선차감분(20~45cr) 미환불 — 다만 **재시도 가능**하고 `ai_report_text` 캐시로 이중 차감은 없다(RISKS R-11 의 "환불되지 않는다"는 절반만 맞다) | S3 | 판단 필요 |
| 8 | 마음풀 `DELETE /api/subscription/cancel`(L3376)이 `changes=0` 이어도 성공을 반환 | S3 | R-40 구현 3번에 포함 |

> 위 표를 그대로 옮기지 말고 **실제로 코드를 열어 확인한 결과로 갱신해서** 써라. 라인 번호가 다르면 문자열로 다시 찾고 실제 라인을 적어라(§1.1).

**§6(사용자 확인이 필요한 사항)에 최소 아래 5건**

| # | 무엇을 | 왜 | 선택지 |
|---|---|---|---|
| 1 | 수달·곁 `/api/grant/status` 의 `redeemed` **판정 기준** | 환불 가부를 가른다. 잘못 정하면 쓴 이용권을 환불해 주거나 못 쓴 이용권을 못 돌려준다 | ① `usage_monthly.used>0` ② `packs.remaining<지급량` ③ 지급 후 N일 ④ 항상 false |
| 2 | 수달·곁 상품의 **셀프환불 허용 여부**(현행: 고객센터 안내로 차단 — `index.tsx:1144`) | §2.2 환불 정책 | 현행 유지 / 1번 확정 후 개방 |
| 3 | CTS **`PAYMENT_LIVE` 전환 시점** | 실결제 개시 결정 | 배선만 수정 후 대기 / 즉시 전환 |
| 4 | 마음커플 수신거부 **문구·도메인·opt-out 범위** | 법정 고지 표현 | 마음게임 문구 그대로 / 재작성 |
| 5 | 통합결제 코드의 **커밋·배포 허용 여부** — 루트 `CLAUDE.md:87` 은 *"토스 완전 반영 전까지 커밋·푸시·배포 금지"* 인데 **코드는 이미 배포돼 상품이 팔리고 있다**(RISKS R-31) | 규정과 현실이 엇갈린 상태에서 수달·곁을 배포해야 한다 | 규정 해제 / 예외 승인 / 배포 보류 |
