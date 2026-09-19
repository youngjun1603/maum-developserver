# BATCH_04 — 공유 규약 (8건)

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **이 배치의 근본 문서**: `_shared/maum-shared-spec.md`(138줄) — **§1·§2·§3 을 먼저 정독해라.** 이 배치의 절반은 "규약이 코드보다 낡았거나, 코드가 규약을 안 지킨 것"이다.
> **근거**: 2026-09-19 코드 직접 열람 + `_docs/RISKS.md` + 각 서비스 `docs/DESIGN.md` §8·§13·§15
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

---

## 0. 배치 개요

| ID | 제목 | 심각도 | 대상 | 형제 서비스 |
|---|---|---|---|---|
| R-04 | `_shared/auth.ts` 캐논이 사본보다 17~18줄 짧다(함수 5개 누락) | S1 | `_shared/` | 수달·곁(**사본이 정답**) |
| R-09 | 마음곁 CORS 미구현 — 공유 규약 §3 위반 | S2 | 마음곁 | 마음수달(이미 정답) |
| R-10 | 마음곁에 `POST /api/auth/sso` 라우트 부재 | S2 | 마음곁 | 마음수달(이미 구현) |
| R-46 | `MAUM_SSO_SECRET` 한 키가 로그인과 지급을 모두 인증 | S2 | 수달 + 곁 | 양쪽 동시 |
| R-24 | 마음부부 공유 철회 미구현(ADDENDUM 01 §1.4-4) | S2 | 마음부부 | 마음세대(**역포팅 원본**) |
| R-25 | `relation_safety` 평문 저장 + 해제 경로 부재 | S2 | 마음부부 | 마음세대(동일 구조 — 현장 확인) |
| R-48 | CTS 구독 `customerKey` 가 `maumful_user_{id}` | S3 | CTS | — |
| R-50 | 재발송 레이트리밋 주석/실제 불일치 · `refunded` 사용처 0건 | S3 | CTS | — |

**예상 작업량** — R-04 는 파일 1개 복사 + 문서 4곳 정정으로 1시간 내. R-09 30분(원문 이식). **R-10+R-46 은 설계 판단이 섞여 반나절 + 사용자 확인 대기.** R-24 반나절(서버+프론트+주석). R-25 는 **해제 경로만** 반나절, 암호화는 착수 금지. CTS 2건 합쳐 1시간.
**R-10·R-25 의 사용자 확인을 기다리느라 R-04·R-09·R-24·R-48·R-50 을 멈추지 마라.**

**선행조건**
1. `gh auth status` → `youngjun1603` 활성(§1.8). CTS 는 **서브모듈**(커밋 순서 §1.6).
2. **수달·곁은 `wrangler deploy` 를 쓰지 않는다** — GitHub 웹UI → Cloudflare 자동배포(`maumgyeot/CLAUDE.md` L69 *"No local dev"*). 부부는 반대로 `npx wrangler deploy` **포그라운드**·`limyj007` 계정(`maumbubu/CLAUDE.md` L25).
3. 부부 프론트 수정 시 `node maumbubu/scripts/render_smoke.cjs public/static/bubu_hub.jsx` — **파일 인자를 빠뜨리면 기본값 `landing.js` 를 찾다가 ENOENT 로 죽는다**(부부 설계서 §15-12).
4. 부부는 `maumful-db` 를 **마음풀 생태계와 공유**한다(`maumbubu/CLAUDE.md` L14). 테이블을 새로 만들지 마라.

**⚠️ 다른 배치와 같은 파일을 건드리는 항목**

| 이 배치 | 다른 배치 | 같은 파일 | 처리 |
|---|---|---|---|
| **R-24** | **BATCH_01 R-05**(share/respond 소유권) | `maumbubu/src/translate-route.ts` — 철회 라우트를 L905 바로 뒤에 넣는다 | **BATCH_01 을 먼저 머지하고 그 위에 얹어라.** 순서가 반대면 `respond` 수정과 충돌하고, 병합 중 `sender_id != uid` 가드가 유실될 위험이 있다 |
| **R-24** | **BATCH_01 R-05** | `maumsedae/src/translate-route.ts` | 세대는 **읽기만**(원본 인용). 이 배치에서 세대 코드를 고치지 마라 |
| **R-10/R-46** | **BATCH_03**(`external_orders` DDL) | `maumgyeot/src/index.ts` `/api/grant` | grant **본문은 건드리지 마라.** R-46 은 호출부 가드 한 줄만 |
| **R-04** | — | `maumotter/src/auth.ts`·`maumgyeot/src/auth.ts` | 사본의 **함수 본문은 고치지 않는다.** 캐논만 갱신 |

**손대지 말 것** — 사본 `auth.ts` 의 함수 본문(특히 `isEmailVerified` 의 fail-open) / `/api/grant`·`/api/grant/revoke` 페이로드 계약·에러 문구(R-44·R-45 는 BATCH_05·06) / `hasRecentSafety()` 의 30일 윈도우·relation 단위 차단 / CTS 의 기능 개선(§1.5) / `_shared/maum-auth-schema.sql`(`email_verified` 추가는 **BATCH_03**).

---

## 1. 이슈

### [R-04] `_shared/auth.ts` 캐논이 실제 사본보다 17~18줄 짧다

| 항목 | 내용 |
|---|---|
| 심각도 | S1 |
| 대상 | `_shared/auth.ts`(89줄) — **역동기화 대상** |
| 형제 서비스 | `maumotter/src/auth.ts`(106줄) · `maumgyeot/src/auth.ts`(107줄) — **이쪽이 실질 캐논** |
| 근거 | `_shared/maum-shared-spec.md` §1 L45 · 곁 설계서 §15-1 · 수달 설계서 §13 |

**무엇이 문제인가** — 공유 규약 L45 는 `_shared/auth.ts` 를 CANONICAL 로 선언하고 *"각 저장소 `src/auth.ts` 로 **동일 사본** 복사"* 라고 못 박는다. 실제로는 **반대 방향으로 흘렀다.** 사본에만 함수 5개가 붙었고 캐논은 그대로다. **새 형제 서비스를 `_shared` 에서 복사하면 회원 탈퇴와 이메일 인증이 통째로 빠진다.**

**실측 대조 (2026-09-19)** — `_shared/auth.ts` 89줄 md5 `c48c0fdc7d9c8d25125e14acde8909a2` / `maumotter/src/auth.ts` 106줄 `c167add028722d34010c46e642bc5ae1` / `maumgyeot/src/auth.ts` 107줄 `18dfa301a59a08f872aca5a231ba3c3c`

**함수 단위 차이 — 캐논에 없는 것 5개** (`getUser` 바로 뒤에 삽입됨. 수달 L79-95 / 곁 L79-96)

| 함수 | 시그니처 | 하는 일 | 캐논 | 수달 | 곁 |
|---|---|---|---|---|---|
| `deleteUser` | `(authDb: D1Database, id: number) => Promise<void>` | `DELETE FROM users WHERE id=?` — **시리즈 전체 계정 삭제** | ❌ | L80 | L81 |
| `findByEmail` | `(authDb: D1Database, email: string) => Promise<MaumUser \| null>` | 소문자화 후 조회. SSO·grant 계정 연결 진입점 | ❌ | L84 | L85 |
| `setPassword` | `(authDb: D1Database, id: number, pw: string) => Promise<void>` | `UPDATE users SET password_hash=?`(내부 `hashPassword`) | ❌ | L87 | L88 |
| `markEmailVerified` | `(authDb: D1Database, id: number) => Promise<void>` | `UPDATE users SET email_verified=1`, **try/catch 무시** | ❌ | L90 | L91 |
| `isEmailVerified` | `(authDb: D1Database, id: number) => Promise<boolean>` | `SELECT email_verified`, **catch 시 `true`(fail-open)** | ❌ | L93 | L94 |

**곁 사본과 수달 사본의 유일한 차이 — 주석 1줄**(`diff maumotter/src/auth.ts maumgyeot/src/auth.ts` 결과 전부):
```
 // 공용 마음 계정 삭제(회원 탈퇴). ⚠️ maum-auth는 시리즈 공유 → 삭제 시 마음 시리즈 전체에서 제거됨.
+// 도메인 데이터(각 서비스 DB)는 호출부에서 먼저 지운다. (canonical: maumotter/src/auth.ts에도 동기화)
 export async function deleteUser(authDb: D1Database, id: number): Promise<void> {
```
함수 본문·시그니처는 **문자 단위로 동일**하다.

**확인 방법**
```bash
md5sum _shared/auth.ts maumotter/src/auth.ts maumgyeot/src/auth.ts ; wc -l 위 3개   # 89 / 106 / 107
diff -u _shared/auth.ts maumotter/src/auth.ts        # +17줄, 함수 5개
diff -u maumotter/src/auth.ts maumgyeot/src/auth.ts  # +1줄(주석)만
```

**구현 방법 — 역동기화 방향은 `수달 사본 → _shared 캐논` 이다**

1. `maumotter/src/auth.ts` 를 `_shared/auth.ts` 로 **통째로 복사.** (수달 기준인 이유: 곁의 추가 주석이 *"canonical: maumotter/src/auth.ts"* 라고 캐논 위치를 잘못 가리켜, 그대로 캐논에 넣으면 자기 자신을 가리키는 순환 서술이 된다.)
2. 복사 후 **곁의 주석 1줄을 캐논에도 넣되 괄호 안을 고쳐라**(내용 자체는 유익하다 — 탈퇴 시 도메인 데이터 선삭제 순서): `// 도메인 데이터(각 서비스 DB)는 호출부에서 먼저 지운다. (사본: maumotter/src/auth.ts · maumgyeot/src/auth.ts)`
3. 그러면 캐논(107줄)과 곁 사본이 그 한 줄만 달라진다. **곁 사본의 그 줄도 캐논과 같은 문구로 맞춰라** — 이 배치에서 사본을 건드리는 **유일한 예외**다. 목표 상태: **세 파일 md5 동일.**
4. `_shared/auth.ts` 헤더 주석(L1-5)에 한 줄: *"2026-09-19 역동기화: 서비스 사본이 앞서 있어 수달 사본을 캐논으로 되돌림."*
5. **문서 정정 — 거짓 서술 4곳**(R-04 의 절반은 문서 작업이다)

| 파일·라인 | 현재 서술 | 어떻게 |
|---|---|---|
| `maumgyeot/README.md:6` *"인증은 공유 `src/auth.ts`(= `../_shared/auth.ts` 동일 사본)"* · `maumotter/README.md:26` *"`src/auth.ts`는 `_shared/auth.ts`의 동일 사본"* | 지금은 거짓, **동기화 후엔 참**이 된다 | *"캐논은 `_shared/auth.ts`, 수정 시 캐논+사본 2개 함께"* 를 덧붙여라 |
| `_shared/maum-shared-spec.md:45` | 제공 함수를 `registerUser`/`loginUser`/`getUser`/`issueToken`/`requireAuth` **5개만** 나열 | **10개로 갱신** + `isEmailVerified` 의 **fail-open** 한 줄 명시 |
| `maumgyeot/docs/DESIGN.md:446` · `maumotter/docs/DESIGN.md:434` | *"✅ 동일 사본(주석 1줄 차이)"* · 줄수 107/106 | 줄수·md5 를 실측값으로 갱신 |

**검증 방법**
```bash
md5sum _shared/auth.ts maumotter/src/auth.ts maumgyeot/src/auth.ts   # 세 줄 모두 같은 해시
grep -c "^export async function\|^export function" _shared/auth.ts    # 10
cd maumgyeot && npx tsc --noEmit && cd ../maumotter && npx tsc --noEmit
```

**주의**
- **한쪽만 고쳤을 때**: 캐논만 고치고 곁 사본 주석을 안 맞추면 md5 가 계속 갈라지고, 다음 사람이 또 *"어느 쪽이 진짜냐"* 를 조사한다 — **이 이슈가 생긴 원인이 바로 그것이다.**
- 사본의 **함수 본문을 건드리지 마라.** `isEmailVerified` 의 `catch { return true }` 는 `users.email_verified` DDL 부재(BATCH_03)를 버티는 임시 장치다. **여기서 고치면 이메일 인증 게이트가 즉시 전원 차단으로 뒤집힌다.**
- `_shared/` 는 워커가 아니다 — **배포 대상이 아니라 복사 원본.**

### [R-09] 마음곁에 CORS 가 한 줄도 없다 (공유 규약 §3 위반)

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumgyeot/src/index.ts` — 664줄 전체에 `cors`/`Access-Control-*`/`OPTIONS` **0건** |
| 형제 서비스 | **마음수달** `maumotter/src/index.ts:24-46` — **이식 원본** |
| 근거 | `_shared/maum-shared-spec.md` §3 L103-115 · `maumgyeot/CLAUDE.md` L73 · 곁 설계서 §8 L250·§15-2 |

**무엇이 문제인가** — 공유 규약 §3 은 4개 오리진 화이트리스트를 *"각 서비스 Worker에 동일 적용"* 으로 규정하고, `maumgyeot/CLAUDE.md` L73 도 *"CORS: 와일드카드 금지, 동적 오리진 매칭. 마음 시리즈 공통 화이트리스트(`_shared` 3장)"* 라 쓴다. **수달엔 있고 곁에만 없다.** 지금은 프론트가 같은 워커 Assets 에서 서빙되고 형제 앱 이동도 XHR 이 아닌 페이지 이동(`#token=`)이라 드러나지 않지만, `app.` 서브도메인·앱 WebView 에서 XHR 을 쏘는 순간 전부 막힌다.

**공유 규약 §3 의 4개 오리진**(`maum-shared-spec.md` L108-113 원문) — `https://maumotter.com` · `https://app.maumotter.com` · `https://maumgyeot.com` · `https://app.maumgyeot.com` (주석: *"각 서비스 Worker에 동일 적용 — 자기 도메인 + 형제 서비스 도메인 허용"*). 수달 `ALLOWED` 배열이 이 4개와 정확히 일치한다.

**이식 원본 — 수달 `src/index.ts:24-46` 전문. 이걸 곁에 그대로 넣어라.**
```ts
// ── CORS (마음 시리즈 공통 화이트리스트, _shared 3장) ──────────
const ALLOWED = [
  'https://maumotter.com', 'https://app.maumotter.com',
  'https://maumgyeot.com', 'https://app.maumgyeot.com',
];
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  await next();
  if (ALLOWED.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }
});
app.options('/api/*', (c) => {
  const origin = c.req.header('Origin') || '';
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
  if (ALLOWED.includes(origin)) { h['Access-Control-Allow-Origin'] = origin; h['Access-Control-Allow-Credentials'] = 'true'; }
  return new Response(null, { status: 204, headers: h });
});
```

**확인 방법**
```bash
grep -c -i "cors\|Access-Control\|app.options" maumgyeot/src/index.ts   # 0  ← 재현
grep -n  -i "cors\|Access-Control" maumotter/src/index.ts               # 24·33·34·41·42·44
curl -s -D- -o /dev/null -X OPTIONS "https://maumgyeot.com/api/behavior?species=cat" \
     -H "Origin: https://maumotter.com" | grep -i "access-control"      # 곁 0줄 / 수달 3줄
grep -c "app.delete(" maumgyeot/src/index.ts                            # 곁의 실제 메서드 확인
```

**구현 방법**
1. `maumgyeot/src/index.ts` **L9(`const app = new Hono…`) 바로 다음, L10 빈 줄 자리**에 위 블록을 그대로 삽입. 상수명 `ALLOWED` 도 수달과 동일하게 둬라(양쪽 grep 이 같은 문자열로 걸리게).
2. **곁에는 `DELETE /api/account` 가 있다**(곁 설계서 §13 L460). 수달 원본의 `Allow-Methods` 는 `GET,POST,OPTIONS` 라 **`DELETE` 가 빠져 있다** → 곁에는 `'GET,POST,DELETE,OPTIONS'` 로 넣어라. 이건 이식이 아니라 곁의 라우트 실측에 맞춘 것이니 **보고서 §2 에 이유를 남겨라.**
3. 문서 정정 — 곁 `docs/DESIGN.md` L250(§8)·L457(§13 대조표)·§15-2 / **`maumotter/docs/DESIGN.md:419` 의 "CORS 상호 허용"은 현재 거짓**(곁이 허용하지 않는다).

**검증 방법** (배포 = GitHub 웹UI 자동배포 완료 후)
```bash
cd maumgyeot && npx tsc --noEmit
G="https://maumgyeot.com/api/behavior?species=cat"
curl -s -D- -o /dev/null -X OPTIONS "$G" -H "Origin: https://maumotter.com" | grep -i "access-control"
#  → Allow-Origin: https://maumotter.com / Allow-Credentials: true / Allow-Methods 에 DELETE
curl -s -D- -o /dev/null -X OPTIONS "$G" -H "Origin: https://evil.example" | grep -ci "allow-origin"   # 0
curl -s -D- -o /dev/null "$G" -H "Origin: https://app.maumgyeot.com" | grep -i "vary"                  # Vary: Origin
curl -s "$G" | head -c 120     # Origin 헤더 없는 평범한 요청이 여전히 200 (기존 동작 무영향)
```

**주의**
- **한쪽만 고쳤을 때**: 곁에만 넣고 수달의 `Allow-Methods` 를 두면 두 서비스 정책이 갈라지고, 수달에 `DELETE` 라우트가 생기는 날 같은 버그가 재발한다. **수달 라우트 메서드도 세어 보고**(`grep -c "app.delete(" maumotter/src/index.ts`) 있으면 동시 수정, 없으면 `_shared/maum-shared-spec.md` §3 에 *"메서드 목록은 각 서비스 실제 라우트에 맞춘다"* 를 명시.
- **와일드카드 금지**(`CLAUDE.md` L73) — `Allow-Origin: *` 은 `Allow-Credentials: true` 와 함께 쓸 수도 없다. / 미들웨어가 `await next()` **뒤에** 헤더를 다는 순서를 바꾸지 마라(Hono 응답 헤더는 핸들러 실행 후에 붙는다).

### [R-10] 마음곁에 `POST /api/auth/sso` 가 없다 + [R-46] `MAUM_SSO_SECRET` 하나가 로그인과 지급을 모두 인증한다

> **두 건은 함께 다룬다.** R-10 을 단독 해결하면(곁에 SSO 라우트를 그냥 추가하면) **R-46 의 피해 범위가 곁까지 확대된다.** 시크릿 유출 시 지금 곁은 "무상 지급"이 상한이지만, 라우트를 넣는 순간 수달과 똑같이 **계정 탈취**까지 가능해진다.

| 항목 | 내용 |
|---|---|
| 심각도 | R-10 S2 / R-46 S2 |
| 대상 | `maumgyeot/src/index.ts` — `verifySso` L381-392 · `verifyGrantToken` L393-398 · `/api/grant` L399-424 / `maumgyeot/public/index.html` L360-367 |
| 형제 서비스 | **마음수달** `src/index.ts:154-165`(`verifySso`) · `290-308`(`/api/auth/sso`) · `527-532`(`verifyGrantToken`) / `public/index.html:497` |
| 근거 | 곁 설계서 §8 L249·§13 L456·§15-6 / 수달 설계서 §10.1 #2·#5 / RISKS R-10·R-46 |

**무엇이 문제인가** — **R-10**: 곁에는 `verifySso()` 가 L381 에 **있지만** 쓰는 곳이 `verifyGrantToken`(L393) 하나뿐이다. `POST /api/auth/sso` 라우트가 없어 **마음풀 결제로 이용권(`/api/grant`)은 들어오는데 로그인 인계는 안 되는** 비대칭이 생긴다. / **R-46**: 수달은 `verifySso`(L154)를 **`/api/auth/sso`(L295)와 `verifyGrantToken`(L528)이 공유**한다. 시크릿이 유출되면 공격자는 임의 이메일로 서명해 **그 이메일의 마음 계정에 로그인**할 수 있다(계정이 없으면 `registerUser` 가 만들어 준다 — L301-304).

**수달의 `/api/auth/sso` 원문(`maumotter/src/index.ts:290-308`) — 정답 패턴**
```ts
app.post('/api/auth/sso', async (c) => {
  const secret = c.env.MAUM_SSO_SECRET;
  if (!secret) return c.json({ error: 'SSO가 설정되지 않았어요' }, 503);
  if (!(await checkRateLimit(c.env.KV, `sso:${clientIp(c)}`, 20, 60))) return c.json({ error: '잠시 후 다시 시도해주세요.' }, 429);
  const { sso } = await c.req.json().catch(() => ({}));
  const payload = sso ? await verifySso(secret, String(sso)) : null;
  if (!payload) return c.json({ error: 'SSO 검증 실패' }, 401);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return c.json({ error: 'SSO 토큰이 만료되었어요' }, 401);
  const email = String(payload.email || '').toLowerCase();
  if (!email) return c.json({ error: '이메일이 없는 토큰' }, 400);
  let user = await findByEmail(c.env.AUTH_DB, email);
  if (!user) {
    try { user = await registerUser(c.env.AUTH_DB, { email, password: crypto.randomUUID() + crypto.randomUUID() }); }
    catch { user = await findByEmail(c.env.AUTH_DB, email); }
  }
  if (!user) return c.json({ error: '계정 처리 실패' }, 500);
  await markEmailVerified(c.env.AUTH_DB, user.id);
  return c.json({ token: await issueToken(c.env.JWT_SECRET, user), user });
});
```
곁은 `checkRateLimit`(L60)·`clientIp`(L70)·`findByEmail`·`registerUser`·`markEmailVerified`·`issueToken`(L5 import)을 **전부 이미 갖고 있다.** `verifySso` 가 L381 로 뒤에 있어도 `async function` 선언은 호이스팅되므로 앞에서 호출 가능하다.

**마음풀 발신부 실측** — `maumful-main/src/index.tsx:2180-2191` `GET /api/maum-sso-token` 이 발급하는 **로그인 토큰의 페이로드는 `{uid, email, exp}` 3필드뿐이고 `service` 가 없다**(L2189). grant 토큰(L3173)은 `{email, service, grantType, orderId, amount, exp}` 6필드다. **로그인 토큰에는 대상 서비스 표기가 아예 없어, 수달용 토큰이 곁에도 그대로 통한다.** 이것이 R-46 의 구조적 원인이다.

**확인 방법**
```bash
grep -n "auth/sso" maumotter/src/index.ts maumgyeot/src/index.ts   # 수달 290 / 곁 0건  ← 재현
grep -n "verifySso" maumgyeot/src/index.ts                          # 381(정의)·394(grant만)
grep -rn "?sso=" maumful-main/public/static/*.jsx                   # app.jsx:2105 · landing.jsx:177,593 — 전부 maumotter 만
grep -n "sso" maumgyeot/public/index.html                           # 0건 (프론트 수신부도 없다)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://maumgyeot.com/api/auth/sso -d '{}'   # 404
```

**구현 방법 — 3단계. ②③은 사용자 확인 후.**

**① [즉시] `verifySso` 를 용도별로 분리 (R-46, 수달·곁 양쪽 동시)**
`verifySso` 는 순수 서명 검증으로 남기고 **호출부에 용도 검사를 붙인다.** 시크릿 자체를 쪼개는 것은 마음풀 발신부까지 바꿔야 하므로 이번 범위가 아니다.
```ts
// 로그인 인계 전용 — grant 토큰(grantType/orderId 보유)을 로그인에 재사용하지 못하게 차단
async function verifySsoLogin(secret: string, token: string): Promise<any | null> {
  const p = await verifySso(secret, token);
  if (!p) return null;
  if (!p.exp || Number(p.exp) < Math.floor(Date.now() / 1000)) return null;
  if (p.grantType || p.orderId) return null;   // ← grant 토큰 재사용 차단
  if (!p.email) return null;
  return p; }
```
- 수달 `/api/auth/sso`(L295)의 `verifySso(...)` → `verifySsoLogin(...)`. **L297 의 중복 `exp` 검사는 그대로 남겨라** — 지우면 응답 문구가 `'SSO 토큰이 만료되었어요'` → `'SSO 검증 실패'` 로 바뀌는데 이는 **사용자에게 보이는 문구 변경**이다(§2.2).
- 반대 방향도 막아라: `verifyGrantToken`(수달 L527 / 곁 L393)에 `if (!p.grantType || !p.orderId) return null;` 한 줄 추가 → **로그인 토큰이 grant 로 들어오는 것** 차단.
- **①은 곁에 SSO 라우트를 넣지 않아도 단독으로 의미가 있다.** 수달의 현재 피해 범위를 줄인다.

**② [사용자 확인 필요] 곁에 `/api/auth/sso` 추가 (R-10)** — 위치는 `maumgyeot/src/index.ts` **L275(`resend-verify` 종료) 다음**, `// ── 반려동물 ──`(L277) 앞(수달과 동일 배치). 본문은 위 수달 원문 그대로, 단 `verifySso` → `verifySsoLogin`. 프론트 수신부도 필요하다 — `maumgyeot/public/index.html` **L364(`#token=` useEffect) 다음**에 수달 `public/index.html:497` 이식:
```js
// 마음풀 SSO 진입: ?sso=… → 곁 계정 단일로그인(계정 자동 연결)
useEffect(()=>{ try{ const sso=new URLSearchParams(location.search).get('sso'); if(sso){ api('/auth/sso',{method:'POST',body:{sso}}).then(d=>{ localStorage.setItem(TOKEN_KEY,d.token); setToken(d.token); history.replaceState(null,'',location.pathname); }).catch(()=>{}); } }catch(e){} },[]);
```

**③ [사용자 확인 필요 · 범위 밖일 수 있음] 마음풀 발신부** — `maumful-main/public/static/app.jsx:2105` · `landing.jsx:177,593` 은 **`https://maumotter.com/?sso=` 로만 링크한다.** 곁 링크가 없으면 ②를 만들어도 **아무도 호출하지 않는다.** 마음풀은 유지보수 모드가 아닌 본체라 별도 커밋·배포·검증이 필요하다.

**⚠️ 사용자 확인 필요 (BATCH_00 §2.2 — 기존 사용자의 권한·이용권에 영향)**

| # | 무엇을 | 왜 | 선택지 |
|---|---|---|---|
| 1 | 곁에 SSO 로그인 라우트를 열 것인가 | 여는 순간 시크릿 유출 시 **곁도 계정 탈취 대상**이 된다 | (A) ①을 먼저 배포하고 그 다음 ② (B) ②를 보류하고 ①만 (C) 로그인용 시크릿 별도 발급 — 마음풀 발신부 동시 변경 필요 |
| 2 | 마음풀에 "마음곁 바로가기(SSO)" 링크 추가 | ②만으로는 유입 동선이 안 생긴다. 마음풀 본체 배포 수반 | (A) 추가 (B) 곁 유입은 grant 만 유지 |
| 3 | 로그인 토큰에 `service` 필드를 넣을 것인가 | 현재 수달용 토큰이 곁에 그대로 통한다 | 발신(마음풀 L2189)·수신(양쪽) 동시 변경 — 별도 배치 후보 |

**검증 방법**
```bash
cd maumgyeot && npx tsc --noEmit && cd ../maumotter && npx tsc --noEmit
O=https://maumotter.com; H='Content-Type: application/json'
curl -s -X POST $O/api/auth/sso -H "$H" -d "{\"sso\":\"$GRANT_TOKEN\"}"           # → {"error":"SSO 검증 실패"} (기존엔 토큰 발급됐다)
curl -s -X POST $O/api/auth/sso -H "$H" -d "{\"sso\":\"$LOGIN_TOKEN\"}" | jq keys # → ["token","user"]  (기존 동작 무영향)
curl -s -X POST $O/api/grant   -H "$H" -d "{\"token\":\"$LOGIN_TOKEN\"}"          # → {"error":"invalid or expired grant"} · 곁에도 동일 1회
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://maumgyeot.com/api/auth/sso -d '{}'   # ② 했으면 400/401 (404 아님)
```
**렌더 검증(②를 했다면 필수)** — 마음풀 로그인 → 곁 SSO 링크 → `maumgyeot.com/?sso=…` → **자동 로그인 + 주소창에서 `?sso=` 사라짐**. 실패해도 `.catch(()=>{})` 라 조용히 로그인 화면이 뜨는지(빈 화면·에러 토스트 아님).

**주의**
- **한쪽만 고쳤을 때**: ①을 수달에만 넣고 곁의 `verifyGrantToken` 을 두면, 곁은 **로그인 토큰으로도 grant 를 시도할 수 있는** 상태로 남는다. 현재는 `unknown grantType` 400 에서 걸리지만 **그건 우연이지 방어가 아니다.** 반드시 양쪽 동시.
- `verifySso` 의 서명 비교는 **상수시간 비교가 아니다**(수달 설계서 §10.1 L318) — 이 배치에서 고치지 마라, 별도 이슈다.
- `/api/grant`·`/api/grant/revoke` 의 **본문·에러 문구·페이로드 계약을 건드리지 마라.** 추가하는 건 가드 한 줄뿐이다. / `MAUM_SSO_SECRET` 미설정 시 503 이 나가는 기존 동작을 유지해라(설정 여부 **미확인**).

### [R-24] 마음부부에 공유 철회가 없다 — 마음세대에서 역포팅

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumbubu/src/translate-route.ts` — `/share/send` L865-879 · `/share/inbox` L882-895 · `/share/respond` L898-905 / `public/static/bubu_hub.jsx` L281-310(`Share`)·L759-790(`Inbox`) / `migrations/0002_share.sql:10` |
| 형제 서비스 | **마음세대** `maumsedae/src/translate-route.ts:1007-1016` — **역포팅 원본. 세대는 고치지 마라** |
| 근거 | ADDENDUM 01 §1.4-4(`maumbubu-dev/마음부부_추가개발지시서_ADDENDUM01.md:62`) · 부부 설계서 §15-2·§4-16 · 세대 설계서 §0 대조표 |

**무엇이 문제인가** — ADDENDUM 01 L62 원문: *"**철회 가능** — 발신자가 공유 항목 삭제 시 수신 측에서도 제거."* 부부에는 **엔드포인트도 UI 도 없다.** 한 번 보낸 항목은 회수 불가다. 안전 티어(T1/T2)가 `send` **이후에** 감지된 경우 이미 보낸 항목이 배우자 수신함에 남는다 — ADDENDUM §1.4-1 의 *"가해 배우자에게 흔적이 가지 않도록"* 취지와 정면으로 어긋난다.

**역포팅 원본 — 마음세대 `src/translate-route.ts:1007-1016` 전문**
```ts
// DELETE /api/share/:id — 철회(발신자만). 수신 측에서도 사라진다.
translate.delete('/share/:id', async (c) => {
  try {
    const uid = c.get('uid');
    const r = await c.env.DB.prepare("UPDATE sedae_shared_items SET status='revoked' WHERE id = ? AND sender_id = ?")
      .bind(c.req.param('id'), uid).run();
    if (!r.meta.changes) return c.json({ error: '철회할 수 없어요.' }, 404);
    return c.json({ ok: true });
  } catch (e) { console.error('share revoke error:', e); return c.json({ error: '철회에 실패했어요.' }, 500); }
});
```
**"수신 측에서도 제거"의 나머지 절반** — 세대 `/share/inbox`(L1025)는 조회에서 revoked 를 걸러낸다: `… WHERE relation_id = ? AND sender_id != ? AND status != 'revoked' ORDER BY …`. **부부의 inbox(L888)에는 `AND status != 'revoked'` 가 없다.** 라우트만 포팅하고 이 조건을 빠뜨리면 **철회해도 수신함에 그대로 보인다.**

**⚠️ 테이블명·컬럼 차이 (혼동하면 조용히 0건 UPDATE 가 된다)**

| | 마음부부 | 마음세대 |
|---|---|---|
| 테이블 | **`shared_items`** | `sedae_shared_items` |
| 관계 테이블 | `couple_relations`(`user_a_id`/`user_b_id`) | `sedae_relations`(`owner_id`/`counterpart_id`) |
| `status` DDL 주석 | `sent \| viewed \| accepted`(`migrations/0002_share.sql:10`) | `sent \| viewed \| accepted \| revoked` |
| 공개 웹뷰 `/s/:id` · `sender_label` | **둘 다 없음**(앱 내 수신함 전용) | 둘 다 있음(`maumsedae/src/index.ts:59`) |

**CHECK 제약은 양쪽 다 없다** — `status` 는 평범한 `TEXT NOT NULL DEFAULT 'sent'` 라 `'revoked'` 를 넣어도 DDL 변경 없이 동작한다. **단 `0002_share.sql:10` 주석은 갱신해라**(마이그레이션 재실행 없이 주석만).

**확인 방법**
```bash
grep -n "share/" maumbubu/src/translate-route.ts        # send 865 · inbox 882 · respond 898 — delete 없음
grep -n "status != 'revoked'" maumbubu/src/translate-route.ts maumsedae/src/translate-route.ts   # 부부 0 / 세대 1025
grep -rn "share/send\|share/respond\|share/inbox" maumbubu/public/static/bubu_hub.jsx            # 287 · 772 · 764,844
grep -rn "'/s/" maumbubu/src/*.ts                       # 0건 — 부부엔 공개 웹뷰가 없다
```

**구현 방법**
1. **서버** — `/share/respond`(L905 종료) **다음**에 위 세대 원본을 테이블명만 `shared_items` 로 바꿔 넣는다. `sender_id = ?` 가드(발신자만 철회)는 **그대로 유지.**
2. **inbox 필터** — L888 SELECT 에 `AND status != 'revoked'` 추가. **L891 의 viewed UPDATE 는 `AND status = 'sent'` 라 이미 revoked 를 건드리지 않는다**(그대로 둬라). 프론트 뱃지 L845 `(r.items||[]).filter(x => x.status === 'sent')` 도 이걸로 자동으로 맞으니 수정 불필요.
3. **프론트 UI** — 부부에는 **"보낸 항목" 목록이 없다**(`Inbox` 는 받은 것만). 최소 범위로: `Share` 컴포넌트(L281)가 `send` 응답의 `shareId`(L877 반환)를 state 에 담아, 성공 문구(L295 `done`) 옆에 **"보낸 것 취소"** 버튼을 노출하고 `api('/share/' + shareId, 'DELETE')` 호출. 이 화면을 벗어나면 철회 수단이 사라지는 한계가 남는다 — **"보낸 항목" 화면 신설(`GET /api/share/sent`)은 신규 기능이므로 이 배치에서 만들지 마라.** 보고서 §6 에 올려라.
4. `migrations/0002_share.sql:10` 주석을 `-- sent | viewed | accepted | revoked` 로 갱신.

**검증 방법**
```bash
cd maumbubu && npx tsc --noEmit
node scripts/render_smoke.cjs public/static/bubu_hub.jsx        # ⚠️ 파일 인자 필수
B=https://bubu.maumful.com/api/share
curl -s -X DELETE "$B/<A가 보낸 항목 id>" -H "Authorization: Bearer $TOKEN_B"  # → {"error":"철회할 수 없어요."}
curl -s -X DELETE "$B/deadbeefdeadbeefde" -H "Authorization: Bearer $TOKEN_A"  # → 404
curl -s -X DELETE "$B/<A가 보낸 항목 id>" -H "Authorization: Bearer $TOKEN_A"  # → {"ok":true}
curl -s "$B/inbox?relationId=<id>&peek=1" -H "Authorization: Bearer $TOKEN_B" | jq '[.items[]|select(.status=="revoked")]|length'   # 0
```
**렌더 검증** — 부부 허브 → 통역 결과 → [배우자에게 보내기] → 미리보기 확인 → 전송 → **"보낸 것 취소"** → 배우자 계정 📬 수신함에서 해당 항목이 사라짐.

**주의**
- **BATCH_01 R-05 와 같은 파일의 인접 라인이다.** R-05 가 `/share/respond`(L898-905)를 통째로 고쳐 쓴다. **BATCH_01 을 먼저 머지하고 그 위에 얹어라.**
- **마음세대를 고치지 마라.** 세대는 이미 정답이고 이 배치의 인용 원본이다 — 커밋이 생기면 대조 기준이 사라진다.
- **한쪽만 고쳤을 때**: DELETE 라우트만 넣고 inbox 필터를 빠뜨리면 발신자는 "취소됨"을 보는데 수신자에겐 그대로 보인다. **사용자가 철회했다고 믿는 상태에서 안 지워진 것**이 원래 문제보다 나쁘다.
- `shared_items` 는 `maumful-db`(생태계 공유 D1) 안이다 — **테이블을 새로 만들지 말고 기존 행의 `status` 만 바꿔라.** / 부부엔 공개 웹뷰 `/s/:id` 가 없으므로 세대의 *"웹뷰 즉시 만료 안내"* 는 포팅 대상이 아니다.

### [R-25] `relation_safety` 평문 저장 + 안전 플래그 해제 경로 부재

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumbubu/migrations/0002_share.sql:17-23` · `src/translate-route.ts:429`(기록)·`828-830`(`hasRecentSafety`)·`872`(차단) |
| 형제 서비스 | **마음세대** `migrations/0001_maumsedae.sql:52-59` · `translate-route.ts:484·971-973·986` — **동일 구조. 평문도 해제 경로 부재도 동일해 보인다(현장 재확인)** |
| 근거 | ADDENDUM 01 §2.2(`…ADDENDUM01.md:95`) · 부부 설계서 §15-4·§15-5 |

**무엇이 문제인가 — 두 개의 별개 문제가 묶여 있다. 분리해서 다뤄라.** **(가) 해제 경로 부재 (이번 배치 대상)** — `relation_safety` 에는 INSERT(L429)와 SELECT(L829)밖에 없다(`DELETE`·`UPDATE` **0건**). 원문(L828-830):
```ts
async function hasRecentSafety(db: D1Database, relationId: number): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok FROM relation_safety WHERE relation_id = ? AND created_at > datetime('now','-30 days') LIMIT 1").bind(relationId).first<{ ok: number }>();
  return !!row; }
```
**30일 이내 기록이 하나라도 있으면** `/share/send` 가 403(L872). **해제 경로가 없어 31일 자연 만료만 기다려야 한다** — 오탐이 한 번 나면 그 관계는 한 달간 공유가 잠긴다.

**(나) 평문 저장 (이번 배치에서 코드를 쓰지 마라)** — ADDENDUM 01 §2.2 L95 원문: *"relation에 안전 플래그 기록 (shared_items 차단 및 이후 세션 민감도에 사용, **암호화 필드**)"*. 실제 DDL(`migrations/0002_share.sql:17-23`)은 평문이다 — `relation_id INTEGER NOT NULL` · `tier TEXT NOT NULL,  -- T1 | T2` · `created_at TEXT DEFAULT (datetime('now'))`. `maumful-db` 는 생태계 공유 DB 라 민감도가 더 높다(부부 설계서 §15-4).

**확인 방법**
```bash
grep -rn "relation_safety" maumbubu/src/ maumbubu/migrations/          # INSERT 429 · SELECT 829 — DELETE/UPDATE 0건
grep -rn "sedae_relation_safety" maumsedae/src/ maumsedae/migrations/  # 세대도 동일한지 현장 확인
grep -n "암호화" maumbubu-dev/마음부부_추가개발지시서_ADDENDUM01.md      # L95 한 줄뿐 — 방식 미지정
npx wrangler d1 execute maumful-db --remote --command "SELECT relation_id, tier, created_at FROM relation_safety ORDER BY created_at DESC LIMIT 20"
```

**구현 방법 — 단계를 나눠라**

**1단계(이번 배치) — 해제 경로만. 판단이 필요하므로 사용자 확인 후 착수한다.** 확인 전에는 조사·설계만 하고 코드를 쓰지 마라.

| # | 무엇을 | 왜 | 선택지 |
|---|---|---|---|
| 1 | **누가** 해제하나 | 부부엔 어드민 인증 수단이 없다(`grep ADMIN_SECRET maumbubu/src/` → **0건**). 당사자 본인이 해제하게 하면 **가해자가 해제하는 경로**가 열려 ADDENDUM §1.4-1 취지와 충돌 | (A) 아무도 — 30일 유지(현행) (B) 감지된 세션의 당사자 본인만 (C) 운영자 수동(`ADMIN_SECRET` 신설) |
| 2 | 해제의 의미 | 행 삭제인가, `released_at` 을 채워 이력을 남기는가 | 개인정보·감사 추적 판단 |
| 3 | 문구 | 403 문구 *"지금은 안전을 위해 공유가 제한돼요."* 에 해제 안내를 붙일지 | **문구 변경은 임의 결정 금지**(§2.2) |

> **(B)를 택하려면**: 부부 `relation_safety` 에는 **`user_id` 컬럼이 없다.** 세대에는 있다(`0001_maumsedae.sql:55` `user_id INTEGER NOT NULL -- 감지된 세션의 사용자`). 부부에 `ALTER TABLE relation_safety ADD COLUMN user_id INTEGER` 가 선행되고 **기존 행은 NULL 이라 해제 불가로 남는다.** D1 은 `DROP/RENAME COLUMN` 불가라 추가형으로만 가능하다.

**2단계(사용자 확인 후 · 별도 배치 권장) — 암호화.** ADDENDUM 은 *"암호화 필드"* 라고만 쓰고 **방식·키 관리·기존 행 마이그레이션을 지정하지 않았다.** 착수하려면 ① 키를 어디 둘지(Workers Secret) ② 기존 평문 행 처리(재암호화 = 데이터 마이그레이션, §2.2 확인 대상) ③ `hasRecentSafety` 는 값 비교 없이 **존재 여부만 보므로 지금은 암호화해도 동작하지만**, tier 별 분기가 생기면 전건 복호화가 필요해진다 — 이 3가지가 먼저 정해져야 한다. **이 배치에서는 코드를 쓰지 말고 보고서 §6 에 판단 재료를 정리해 올려라.**

**검증 방법**(1단계 착수 시)
```bash
cd maumbubu && npx tsc --noEmit && node scripts/render_smoke.cjs public/static/bubu_hub.jsx
# 해제 전: 공유가 403 → {"error":"지금은 안전을 위해 공유가 제한돼요.","blockedBySafety":true}
curl -s -X POST https://bubu.maumful.com/api/share/send -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' -d '{"relationId":<id>,"itemType":"message","payload":{"t":"x"}}' | jq
# 해제 후 같은 요청이 200 / 권한 없는 계정의 해제 시도 → 403·404
npx wrangler d1 execute maumful-db --remote --command "SELECT COUNT(*) FROM relation_safety"
```

**주의**
- **한쪽만 고쳤을 때**: 부부에만 해제 경로를 넣으면 같은 안전 설계가 두 서비스에서 다르게 동작한다. 부부 설계서 §14 L474 원문 — ***"안전 규칙의 마음부부↔마음세대 버전 분기 금지."*** 세대에 동일 구조가 있는지 **현장에서 확인하고**, 있으면 함께 넣거나 **양쪽 모두 보류**해라. **한쪽만은 금지다.**
- `hasRecentSafety` 의 **30일 윈도우와 relation 단위 차단 범위는 건드리지 마라.** 의도된 설계다(피해자 쪽 발신도 함께 막아 가해자 흔적을 남기지 않는다 — 부부 설계서 §15-5).
- 안전 기록 INSERT(L429)는 `waitUntil` 안의 비차단 `.catch(() => {})` 라 **실패해도 조용하다.** 해제는 실패하면 안 된다 — 이 비대칭을 혼동하지 마라.
- 이 이슈는 **가정폭력 피해자 보호와 직결된다. 확신이 없으면 구현하지 말고 물어라.**

### [R-48] CTS 구독 `customerKey` 에 마음풀 접두사가 남아 있다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `cts-maum-main/src/index.tsx:1647`(생성)·`1673`(검증)·`1703`(저장)·`4173`(어드민 조회) |
| 형제 서비스 | — |
| 근거 | RISKS R-48 · 루트 `CLAUDE.md` §1.5 |

**⛔ CTS 는 유지보수 모드(§1.5). 이 항목은 접두사 잔재 정리 + 검증식 정합성 수정이라 버그 수정 허용 범위다. 겸사겸사 결제 개선을 얹지 마라.**

**무엇이 문제인가** — CTS(`lightoflife`) 구독 빌링키의 고객 식별자가 **마음풀 접두사 그대로**다. 원문:
```ts
const customerKey = `maumful_user_${userId}`                                        // :1647
// :1672-1675 — 검증식까지 같은 문자열로 대조한다 (주석: "URL 파라미터 조작 방지")
if (!userId || !customerKey || customerKey !== `maumful_user_${userId}`) return c.redirect('/?sub=fail&msg=요청오류')
```
CTS 와 마음풀은 다른 토스 상점이지만 같은 상점을 쓰게 되는 순간 `maumful_user_7` 이 충돌한다. 더 현실적인 문제는 **운영자가 토스 콘솔에서 CTS 구독자를 마음풀 고객으로 착각**하는 것이다.

**확인 방법**
```bash
grep -n "maumful_user_\|customerKey" cts-maum-main/src/index.tsx   # 1647·1658·1660·1670·1673·1685·1703·4173
# ↓ 기존 행 유무가 구현 방법을 가른다. 반드시 먼저 조회해라
npx wrangler d1 execute <CTS_DB> --remote --command "SELECT id, user_id, customer_key, status FROM user_subscriptions ORDER BY id DESC LIMIT 20"
```

**구현 방법**
- **기존 구독 행이 0건이면**(가능성 높음 — CTS 는 `PAYMENT_LIVE=false`, R-41 참조): L1647·L1673 을 `cts_user_${userId}` 로 **동시에** 바꾸면 끝. **한쪽만 고치면 모든 구독 콜백이 `요청오류` 로 리다이렉트된다.**
- **기존 행이 있으면** 접두사를 바꾸는 순간 그 구독자들의 빌링키 재사용이 깨진다(토스 등록 customerKey 는 변경 불가). 신규만 새 접두사를 쓰고 검증은 **두 접두사를 모두 허용**해라 — `const okKey = customerKey === \`cts_user_${userId}\` || customerKey === \`maumful_user_${userId}\``. **기존 행을 UPDATE 하지 마라**(DB 의 `customer_key` 는 토스 쪽 값과 일치해야 한다). 이건 **§2.2 "기존 사용자의 권한·이용권에 영향"** 이니 **행이 1건이라도 있으면 사용자 확인 후 착수.**
- 어느 쪽이든 L1647 위에 주석: *"마음풀 접두사 잔재 정리(2026-09). 기존 `maumful_user_*` 는 토스 등록값이라 변경 불가."*

**검증 방법**
```bash
cd cts-maum-main && npx tsc --noEmit
grep -c "maumful_user_" src/index.tsx ; grep -n "cts_user_" src/index.tsx   # 0 또는 1(하위호환) / 발급·검증 양쪽
curl -s -o /dev/null -w "%{redirect_url}\n" "https://<CTS도메인>/api/subscription/toss/success?authKey=x&customerKey=cts_user_1&planKey=<p>&userId=2"
#   → /?sub=fail&msg=요청오류  (조작 차단 유지)
```

**주의**
- **L1647 과 L1673 은 반드시 같은 커밋에서 함께.** 배포 시차가 생기면 그 구간 구독 콜백이 전부 실패한다. / `successUrl`(L1648)·`failUrl`(L1649)은 건드리지 마라.
- **서브모듈** — `cts-maum-main` 커밋 → push → **부모 레포 포인터 커밋** → push(§1.6).
- CTS 는 `PAYMENT_LIVE` 관련 결함(R-41, **BATCH_02**)으로 실결제 경로 검증이 불가일 수 있다. **여기서 고치지 마라.**

### [R-50] 레이트리밋 주석과 실제가 다르고, `refunded` 상태값은 아무도 안 쓴다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `cts-maum-main/src/index.tsx:505-508` · `migrations/0004_b2c_migration.sql:63` · `migrations/0001_initial_schema.sql:51` · `0007_subscriptions.sql:29` |
| 형제 서비스 | — |
| 근거 | RISKS R-50 |

**⛔ CTS 유지보수 모드 — 주석 정정 + 문서화다. 환불 기능을 새로 만들지 마라(신규 기능 금지).**

**무엇이 문제인가 — 두 건이다.**

**(가) 주석이 거짓**(`src/index.tsx:505-507`)
```ts
  // Rate Limit: 이메일당 1시간에 3회          ← 거짓
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rl = await checkRateLimit(KV, `resend-verify:${ip}`, 3, 3600)     // ← 실제는 IP 기준
```
같은 파일의 다른 리밋 주석은 정확하다(L337 `// 시간당 5회`, L429 `// 분당 10회`) — **`resend-verify` 만 잘못 적혀 있다.** 이 주석을 믿고 어뷰징 방어를 판단하면 틀린다: 지금은 **한 IP 뒤에서 서로 다른 이메일 3개까지만** 재발송되고(공용 IP·회사망에서 정상 사용자가 막힌다), 반대로 **한 이메일에 대해 IP 를 바꿔가며 무제한 재발송**이 가능하다.

**(나) `refunded` 상태값이 죽어 있다** — `0004_b2c_migration.sql:62-63` 은 `CHECK(status IN ('pending','completed','failed','refunded'))` 인데 `grep -rn "refunded" cts-maum-main/src/` 는 **0건**이다. 실제로는 `pending`(L1892 INSERT) → `completed`(L1771·L1852·L1952) → `failed`(L1981) 만 쓰인다. 환불이 발생하면 DB 는 `completed` 로 남고 **매출 집계(L2543 `WHERE status='completed'`)·제휴 정산(L4690)·사용자별 `total_paid`(L2690)에 환불분이 계속 포함된다.**

**확인 방법**
```bash
grep -n "checkRateLimit(KV" cts-maum-main/src/index.tsx   # 337·429·507·793·824·850… 주석과 대조
grep -rn "refunded" cts-maum-main/src/                     # 0건  ← 재현
grep -rn "refunded" cts-maum-main/migrations/              # 0001:51 · 0004:63 · 0007:29
npx wrangler d1 execute <CTS_DB> --remote --command "SELECT status, COUNT(*) FROM credit_charges GROUP BY status"
```

**구현 방법 (가)** — **A안(주석만 정정 · 권장)**: L505 를 `// Rate Limit: IP당 1시간에 3회` 로. **동작 변경 없음 = 무위험**, 유지보수 모드에 가장 맞는다. **B안(의도대로 구현)**은 **동작 변경**이다 — 이메일 키만 쓰면 IP 기반 방어가 사라지고 사용자 입력이 KV 키 공간이 된다. 채택한다면 이중 리밋이 맞다:
```ts
const em = String(email).toLowerCase().slice(0, 120)
const rlIp = await checkRateLimit(KV, `resend-verify:${ip}`, 10, 3600)
const rlEm = await checkRateLimit(KV, `resend-verify-em:${em}`, 3, 3600)
if (!rlIp.allowed || !rlEm.allowed) return c.json({ success: false, error: '잠시 후 다시 시도해주세요.' }, 429)
```
**B안은 사용자 확인 후에만. 확인 전에는 A안을 적용해라.**

**(나)** — 환불 처리 코드를 새로 쓰는 것은 **신규 기능이라 금지**(§1.5). 대신 ① `0004_b2c_migration.sql:63` 옆에 주석 `-- ⚠️ 'refunded' 는 2026-09 현재 세팅하는 코드가 없다(수동 UPDATE 전용).` ② `cts-maum-main/docs/DESIGN.md` §15 에 항목 추가 — 매출·정산 쿼리가 `status='completed'` 만 센다는 사실(L2543·L2690·L4690)과 운영자가 토스에서 환불했을 때 **DB 를 수동으로 맞춰야 한다**는 것, 예시 `UPDATE credit_charges SET status='refunded' WHERE pg_tid=?` ③ `0007_subscriptions.sql:29` 의 `refunded` 도 같은 상태인지 확인해 함께 기록.

**검증 방법**
```bash
cd cts-maum-main && npx tsc --noEmit
grep -n "이메일당" src/index.tsx      # 0건 (A안) 또는 이중 리밋 존재 (B안)
for i in 1 2 3 4; do curl -s -o /dev/null -w "%{http_code} " -X POST https://<CTS도메인>/api/auth/resend-verify \
  -H 'Content-Type: application/json' -d '{"email":"<미인증계정>"}'; done; echo   # 200 200 200 429
grep -n "refunded" migrations/0004_b2c_migration.sql docs/DESIGN.md                # 주석·설계서에 기록됨
```

**주의**
- **`checkRateLimit`(L99-)은 고정 윈도우 버킷**(`Math.floor(now/windowSec)`)이라 경계에서 최대 2배가 통과한다 — 알려진 한계이니 **이 배치에서 고치지 마라.** / L515 *"보안: 존재 여부 노출하지 않음"*(없는 계정도 `success:true`)은 의도된 동작이다.
- **`refunded` 를 쓰는 코드를 만들지 마라.** 유지보수 모드 위반이다. 필요하면 보고서 §6 에 올려 사용자 판단을 받아라.
- 서브모듈 커밋 순서(§1.6). R-48 과 같은 파일이라 한 커밋으로 묶어도 되지만 메시지에 두 이슈를 모두 적어라.

---

## 2. 커밋 분리 (§1.7)

```
[공통]      R-04 _shared/auth.ts 역동기화 + maum-shared-spec.md §1 함수 목록 갱신
[maumgyeot] R-04 auth.ts 주석 1줄 동기화 / R-09 CORS 이식 / R-10 SSO 라우트(확인 후) / R-46 verifyGrantToken 가드
[maumotter] R-04 README 정정 / R-46 verifySsoLogin 분리 + verifyGrantToken 가드 / DESIGN §13 CORS 서술 정정
[maumbubu]  R-24 DELETE /share/:id + inbox revoked 필터 + 프론트 취소 버튼 / R-25 해제 경로(확인 후)
[maumsedae] R-25 해제 경로 동시 적용(확인 후). ※ R-24 로는 세대를 건드리지 않는다
[cts]       R-48 customerKey 접두사 / R-50 레이트리밋 주석 + refunded 문서화   ← 서브모듈
[공통]      BATCH_04 결과 보고서 + RISKS.md 갱신
```
`cts-maum-main` 커밋 후 **부모 레포 포인터 커밋**을 잊지 마라(§1.6).

---

## 3. 이 배치의 완료 기준

- [ ] R-04 — `md5sum` 3개 파일 **동일 해시** · `_shared/auth.ts` export 함수 10개 · 문서 4곳(곁 README:6 · 수달 README:26 · spec:45 · 양쪽 DESIGN 대조표) 정정 · 수달·곁 `npx tsc --noEmit` 통과
- [ ] R-09 — 곁 OPTIONS 에 `Allow-Origin`·`Allow-Credentials`·`Vary: Origin` · 화이트리스트 외 오리진 0줄 · `Allow-Methods` 에 `DELETE` · Origin 없는 기존 요청 여전히 200 · 수달 메서드 대조 결과 기록
- [ ] R-46 — grant 토큰으로 `/api/auth/sso` → 401(수달) · 로그인 토큰으로 `/api/grant` → 401(**수달·곁 양쪽**) · 정상 토큰 2종은 기존대로 통과
- [ ] R-10 — 사용자 확인 결과를 보고서 §6 에 기록. 착수했으면 곁 `/api/auth/sso` 404 아님 + `?sso=` 자동 로그인 렌더 검증
- [ ] R-24 — 수신자 DELETE 404 / 없는 id 404 / 발신자 200 · 철회 후 수신함·`peek=1` 뱃지에서 제외 · `render_smoke.cjs` 통과 · `0002_share.sql:10` 주석 갱신 · **BATCH_01 R-05 이후에 작업했음** 확인
- [ ] R-25 — 해제 경로: 사용자 확인 결과 기록. 착수했으면 **부부·세대 양쪽 동시** 또는 **양쪽 보류**(한쪽만 금지). 암호화는 **미착수 + 보고서 §6 에 판단 재료 정리**
- [ ] R-48 — `user_subscriptions` 기존 행 수를 **실제 조회해 기록** · 발급·검증 양쪽 동시 수정 · 기존 행이 있었으면 사용자 확인 기록
- [ ] R-50 — 주석 정정(A안) 또는 이중 리밋(B안, 확인 후) · 재발송 4회째 429 · `refunded` 미사용 사실을 설계서 §15 에 기록
- [ ] 서비스별 커밋 분리 + `cts-maum-main` 부모 포인터 커밋 완료
- [ ] 문서 갱신 — `docs/DESIGN.md` + 개정 이력 한 줄(**수달·곁·부부·CTS 4곳**, 세대는 R-25 착수 시에만) · `_shared/maum-shared-spec.md` §1·§3 · `_docs/RISKS.md` 의 R-04·09·10·24·25·46·48·50 해소/부분해소 표기
- [ ] 배포 — 곁·수달은 **GitHub 웹UI → 자동배포**, 부부는 `npx wrangler deploy` **포그라운드**·`limyj007` 계정. 미배포면 사유 기록
- [ ] 결과 보고서 작성 완료

---

## 4. 결과 보고서

작성 경로: **`_docs/작업지시서/결과/BATCH_04_결과.md`** — 양식은 **BATCH_00 §3.1 템플릿 그대로**. `[공통]` 커밋으로 함께 올린다.

**§3(전제 불일치)에 최소 아래 4건은 들어가야 한다** — 지시서 작성 중 코드에서 이미 확인된 것이다.

| 이슈 | 지시서/RISKS 의 전제 | 실제 코드 |
|---|---|---|
| R-04 | *"수달·곁 사본보다 17~18줄 짧고 5개 함수 누락"* | 맞다. 다만 **곁 사본의 추가 주석 1줄이 캐논 위치를 `maumotter/src/auth.ts` 로 잘못 가리킨다** — 그대로 캐논에 복사하면 순환 서술이 된다 |
| R-10 | *"라우트만 넣으면 로그인 인계가 된다"* | 마음풀 프론트(`app.jsx:2105`·`landing.jsx:177,593`)가 **`maumotter.com/?sso=` 로만 링크한다.** 곁 링크가 없어 라우트만으로는 호출되지 않는다 |
| R-24 | *"`DELETE /api/share/:id` 를 역포팅하면 된다"* | 라우트는 절반이다. 세대 inbox L1025 의 **`AND status != 'revoked'`** 가 함께 있어야 "수신 측에서도 제거"가 성립한다. **부부 inbox L888 에는 없다** |
| R-25 | *"해제 경로만 만들면 된다"* | 부부 `relation_safety` 에는 **`user_id` 컬럼이 없다**(세대에는 L55 에 있다). "본인만 해제" 설계를 택하면 컬럼 추가가 선행되고 기존 행은 해제 불가로 남는다 |

**§4(새로 발견한 것)에 기록할 것** — 이 배치에서는 고치지 않는다.

| # | 내용 | 심각도 추정 | 조치 |
|---|---|---|---|
| 1 | **마음풀 로그인 SSO 토큰에 `service` 필드가 없다**(`maumful-main/src/index.tsx:2189` — `{uid,email,exp}`). 수달용 토큰이 곁에도 그대로 통한다 | S2 | R-46 의 구조적 원인. 발신·수신 동시 변경이라 별도 배치 |
| 2 | `maumotter/docs/DESIGN.md:419` 의 **"CORS 상호 허용"** 이 곁에 CORS 가 없어 **거짓** | S3 | R-09 수정과 함께 정정 |
| 3 | `_shared/maum-shared-spec.md` §5 L134 는 *"양쪽 저장소에 동일 사본"* 이라 규정하나 실제로는 `_shared/` 에만 있다(곁 설계서 §15-9) | S3 | 저장소 단독 export 시 규약 누락. **BATCH_06** 후보 |
| 4 | `verifySso` 의 서명 비교가 **상수시간 비교가 아니다**(수달 L162 · 곁 L389, 단순 `!==`) / CTS `checkRateLimit`(L99-)은 **고정 윈도우**라 경계에서 최대 2배 통과 | S3 | 기록만 |
| 5 | 부부에 **"보낸 항목" 조회 경로가 없다** — R-24 철회를 만들어도 전송 직후 화면을 벗어나면 철회 수단이 사라진다 | S3 | `GET /api/share/sent` 신설은 신규 기능 → 사용자 판단 |

> 위 표를 그대로 옮기지 말고 **실제로 코드를 열어 확인한 결과로 갱신해서** 써라. 라인 번호가 다르면 문자열로 다시 찾고 실제 라인을 적어라(§1.1).

**§6(사용자 확인이 필요한 사항)에 반드시 올릴 것** — R-10 곁 SSO 라우트 개설 여부 / 마음풀 곁 SSO 링크 추가 / R-25 해제 주체·해제의 의미·안내 문구 / R-25 암호화 착수 여부와 키 관리 방식 / R-48 기존 구독 행이 있을 때의 접두사 전환 / R-50 B안(이메일 기준 리밋) 채택 여부.
