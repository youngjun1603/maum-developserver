# BATCH_01 — 보안 긴급 (6건)

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **근거**: 2026-09-19 코드 직접 열람 + `_docs/RISKS.md` + 각 서비스 `docs/DESIGN.md` §15
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

---

## 0. 배치 개요

| ID | 제목 | 심각도 | 대상 | 형제 서비스 |
|---|---|---|---|---|
| R-01 | 리더보드가 인증 없이 상위 20명 이메일 노출 | S1 | 마음게임 | CTS 게임 |
| R-02 | `/api/recovery/weekly-report/:userId` IDOR | S1 | 마음게임 | CTS 게임 |
| R-05 | `/api/share/respond` 소유권 검증 부재 | S1 | 마음부부 | 마음세대 |
| R-23 | `verifyJWT` 가 `['bubu','couple']` 모두 허용 | S2 | 마음부부 | 마음세대(이미 정답) |
| R-42 | 네이버 로그인 `state` 미검증 (CSRF) | S2 | CTS | 마음풀(동일 결함 · 범위 밖) |
| R-43 | 소셜 가입자 `is_email_verified=0` | S2 | CTS | 마음풀(동일 결함 · 범위 밖) |

**예상 작업량** — 서버 수정 4건(R-01·02·05·23, 형제 포함 **8개 파일**) 반나절 / R-42 반나절 / R-43 은 사용자 확인 대기. **R-43 을 기다리느라 나머지를 멈추지 마라.**

**선행조건** — ① `gh auth status` → `youngjun1603` 활성(§1.8) ② `cts-maum-main/` 은 **서브모듈**(커밋 순서 §1.6), `cts-game-main/` 은 부모 레포 안 ③ 게임 2종은 프론트 수정 시 `npm run build:jsx` 로 `public/static/compiled/` 재생성 필수 — `wrangler deploy` 만 치면 **옛 번들이 나간다**(CTS 게임은 CI 가 프론트를 빌드하지 않음, CTS 설계서 §15-10) ④ 게임 2종에는 `render_smoke.cjs` 가 **없다**(부부·세대·마음풀에만) → 브라우저로 직접 확인.

**손대지 말 것** — 리더보드 순위 산식·표시 항목 / weekly-report 응답 키·기본값 / CTS 의 기능 개선(§1.5) / R-08 번아웃 metadata 키 불일치(**BATCH_05** 항목).

---

## 1. 이슈

### [R-01] 리더보드가 인증 없이 상위 20명 이메일을 반환한다

| 항목 | 내용 |
|---|---|
| 심각도 | S1 |
| 대상 | `maumgame-main/src/index.tsx:707-716` · `public/static/game_hub.jsx:597,625,640,2658` |
| 형제 서비스 | **CTS 게임** `cts-game-main/src/index.tsx:688-697` · `public/static/game_hub.jsx:594,622,637` — 코드 동일. 보안 수정이므로 유지보수 모드 허용 범위 |
| 근거 | 마음게임 설계서 §15-1 · CTS 게임 설계서 §15-1 및 복제 결함표 1행 |

**무엇이 문제인가** — 인증 미들웨어가 없고 `u.email` 을 그대로 SELECT 한다. 토큰 없이 누구나 **활성 상위 20명의 실사용자 이메일**을 수집할 수 있다. 원문(`maumgame-main/src/index.tsx:707`):
```ts
app.get('/api/game/leaderboard', async (c) => {          // ← 인증 한 줄도 없다
  const { DB } = c.env
  const rows = await DB.prepare(`
    SELECT u.nickname, u.email, gs.garden_level, gs.total_exp, gs.streak_days
    FROM user_game_status gs JOIN users u ON gs.user_id = u.id
    ORDER BY gs.total_exp DESC LIMIT 20`).all()
```

**같은 파일에 이미 있는 올바른 패턴** — 인접 라우트 `/api/game/emotion-report`(L979). `getGameUserId`(L78 정의)를 이 파일에서 **20곳**이 이미 쓴다. 리더보드만 예외다.
```ts
const userId = await getGameUserId(c.req.raw, c.env)
if (!userId) return c.json({ success: false, error: '로그인 필요' }, 401)
```

**확인 방법**
```bash
grep -n "u.email" maumgame-main/src/index.tsx cts-game-main/src/index.tsx
grep -c "getGameUserId" maumgame-main/src/index.tsx          # 21 (정의 1 + 사용 20)
curl -s https://game.maumful.com/api/game/leaderboard | head -c 400   # 토큰 없이 200 + email → 재현
```

**구현 방법** (양쪽 동일)
1. `u.email` 을 빼고 `gs.user_id` 를 넣는다(프론트 "나" 표시가 email 비교에 의존 → 대체 식별자 필요): `SELECT gs.user_id, u.nickname, gs.garden_level, gs.total_exp, gs.streak_days`
2. 함수 첫 줄에 **위 정답 패턴을 그대로** 넣는다. *안전 근거*: `game_engine.jsx:206` 이 이미 `authHeader()` 를 실어 보내고, `game_hub.jsx:2361` 의 `if (!isLoggedIn) return <LoginGate />;` 때문에 미로그인 시 리더보드가 렌더되지 않는다 → 401 을 볼 사용자가 없다.
3. **프론트 동반 수정** `game_hub.jsx` — email 의존 3곳:
   - L597 `Leaderboard({ currentUserEmail })` → `({ currentUserId })` / L2658 `<Leaderboard currentUserEmail={user?.email} />` → `currentUserId={user?.id}`
   - L625 `const isMe = entry.email && currentUserEmail && entry.email === currentUserEmail;` → `entry.user_id && currentUserId && entry.user_id === currentUserId`
   - L640 `{entry.nickname || entry.email?.split('@')[0] || t('정원사','Gardener')}` → `{entry.nickname || t('정원사','Gardener')}`
   *`user.id` 근거*: `/api/game/me`(L197)가 `SELECT id, email, nickname, credits, locale FROM users` 를 반환한다.
4. `npm run build:jsx` 로 `compiled/game_hub.js` 재생성 — **양쪽 레포 각각.**

**검증 방법**
```bash
L=https://game.maumful.com/api/game/leaderboard
curl -s -o /dev/null -w "%{http_code}\n" $L                                      # → 401
curl -s -H "Authorization: Bearer $GAME_TOKEN" $L | jq '.data[0]|keys'
#   → ["garden_level","nickname","streak_days","total_exp","user_id"]  (email 없음)
grep -rn "entry.email\|currentUserEmail" {maumgame-main,cts-game-main}/public/static/   # 0건 (compiled 포함 = 재컴파일 확인)
```

**렌더 검증(필수)** — 허브 → "🏆 정원사 순위" 펼치기 → 20행 표시 + 본인 행에 초록 배경·"나" 배지. CTS 게임도 동일하게.
**주의** — `compiled/game_hub.js` 를 커밋하지 않으면 배포는 옛 번들이다. / `user_id` 노출이 꺼려지면 서버가 `isMe: gs.user_id === userId` 불리언을 계산해 내려보내는 쪽이 더 낫다 — **택했다면 보고서 §2 에 이유를 남길 것.** / CTS 게임의 공개 도메인은 코드에서 특정하지 못했다 — curl URL 을 그대로 쓰지 말고 `cts-game-main/wrangler.toml`(워커 `lightoflife-game`)에서 **현장 확인할 것.**

### [R-02] `/api/recovery/weekly-report/:userId` 가 무인증 IDOR

| 항목 | 내용 |
|---|---|
| 심각도 | S1 |
| 대상 | `maumgame-main/src/index.tsx:959-973` |
| 형제 서비스 | **CTS 게임** `cts-game-main/src/index.tsx:940-954` — 코드 동일. cron 비활성이라 현재 유출은 0에 가깝지만 **cron 을 켜는 순간 실데이터 IDOR** 가 된다 |
| 근거 | 마음게임 설계서 §15-2 · CTS 게임 설계서 §15-2 |

**무엇이 문제인가** — 경로 파라미터를 그대로 조회한다. 토큰도 본인 확인도 없어 `/1`, `/2`, `/3` … 순회로 **타인의 번아웃 지표(건강 민감정보)** 를 수집할 수 있다. 원문(L959):
```ts
app.get('/api/recovery/weekly-report/:userId', async (c) => {
  const userId = c.req.param('userId')                    // ← 경로값을 그대로 신뢰
  const rows = await DB.prepare(`SELECT avg_energy, completed_missions, burnout_delta
     FROM weekly_reports WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).bind(userId).first()...
```

**같은 파일에 이미 있는 올바른 패턴** — 바로 아래 `/api/game/emotion-report`(L979)는 `:userId` 를 받지 않고 **토큰에서 uid 를 꺼낸다**: `const userId = await getGameUserId(c.req.raw, c.env)` + `if (!userId) … 401`.

**확인 방법**
```bash
grep -n "weekly-report" maumgame-main/src/index.tsx cts-game-main/src/index.tsx
grep -rn "weekly-report" maumgame-main/public/ cts-game-main/public/   # 0건 = 프론트 호출부 없음
curl -s https://game.maumful.com/api/recovery/weekly-report/1; curl -s .../2   # 값이 다르면 IDOR 재현
```

**구현 방법** — 프론트 호출부가 0건이므로 **경로 파라미터를 없애고 토큰 기반으로 바꾸는 쪽이 가장 안전하다**(호환 부담 없음).

**1안(권장)**: 라우트를 `/api/recovery/weekly-report` 로 바꾸고 첫 줄을 위 정답 패턴으로 교체, `c.req.param('userId')` 삭제.
**2안(하위호환)**: `:userId` 를 남기되 **파라미터를 신뢰하지 말고** 토큰 uid 로 조회 —
```ts
const uid = await getGameUserId(c.req.raw, c.env)
if (!uid) return c.json({ success: false, error: '로그인 필요' }, 401)
if (String(uid) !== c.req.param('userId')) return c.json({ success: false, error: '권한 없음' }, 403)
```
어느 쪽을 택했는지 **보고서 §2 에 명시할 것.**

**검증 방법**
```bash
W=https://game.maumful.com/api/recovery/weekly-report
curl -s -o /dev/null -w "%{http_code}\n" $W/1                                                    # → 401 또는 404
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $GAME_TOKEN" $W/99999         # → 403 (2안)
curl -s -H "Authorization: Bearer $GAME_TOKEN" $W | jq 'keys'
#   → ["avgEnergy","burnoutDelta","completedMissions","cta","success"]
```

**주의** — 응답 키와 기본값(`68`·`0`·`'0%'`)은 바꾸지 마라(지금 호출부가 없어도 나중 계약이 흔들린다). / `weekly_reports` 는 R-08(키 불일치) 때문에 사실상 비어 있을 가능성이 높다 — **200 인데 전부 기본값이어도 정상이다.** R-08 은 BATCH_05, 여기서 고치지 마라.

### [R-05] `/api/share/respond` 에 소유권 검증이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | S1 |
| 대상 | `maumbubu/src/translate-route.ts:898-905` |
| 형제 서비스 | **마음세대** `maumsedae/src/translate-route.ts:1035-1042` — 테이블명(`sedae_shared_items`)만 다르고 코드 동일 |
| 근거 | 부부 설계서 §15-1 · 세대 설계서 §15-6 · 세대 설계서 §0 대조표 "양쪽 동일 결함 — 한쪽만 고치지 말 것" |

**무엇이 문제인가** — `c.get('uid')` 를 **아예 읽지 않는다**. 유효 토큰만 있으면 임의 `shareId` 의 상태를 `accepted` 로 위조할 수 있다. 원문(L898):
```ts
const { shareId, action } = await c.req.json<{ shareId: string; action: string }>();
if (action !== 'accepted' || !shareId) return c.json({ error: '잘못된 요청입니다.' }, 400);
await c.env.DB.prepare("UPDATE shared_items SET status = 'accepted' WHERE id = ?").bind(shareId).run();
return c.json({ ok: true });                              // ← uid 를 한 번도 읽지 않는다
```

**같은 파일에 이미 있는 올바른 패턴 ①** — 이 파일은 `assertRelationOwner` 를 **8회**(L345·475·618·763·838·870·887) 쓴다. 바로 위 `/share/inbox`(L887): `if (!(await assertRelationOwner(c.env.DB, relationId, uid))) return c.json({ error: '이 관계에 접근 권한이 없어요.' }, 403);`

**패턴 ②(이 라우트에 더 맞는 본)** — 마음세대 `DELETE /api/share/:id`(`maumsedae/src/translate-route.ts:1008`)는 **`shareId` 하나만 받는 라우트**에서 가드를 UPDATE 의 WHERE 에 넣고 `meta.changes` 로 판정한다:
```ts
const r = await c.env.DB.prepare("UPDATE sedae_shared_items SET status='revoked' WHERE id = ? AND sender_id = ?")
  .bind(c.req.param('id'), uid).run();
if (!r.meta.changes) return c.json({ error: '철회할 수 없어요.' }, 404);
```

`respond` 는 **수신자**가 호출하므로 조건이 `sender_id = ?` 가 아니라 `sender_id != ?` + 관계 당사자다. ② 를 그 형태로 옮기면 된다.

**확인 방법**
```bash
grep -n "share/respond" -A 6 maumbubu/src/translate-route.ts maumsedae/src/translate-route.ts
grep -c "assertRelationOwner" maumbubu/src/translate-route.ts     # 9 (정의 1 + 사용 8)
grep -rn "share/respond" maumbubu/public/static/ maumsedae/public/static/   # 부부 bubu_hub.jsx:772 만, 세대 0건
```
재현: 토큰 A 로 `POST /api/share/respond {shareId:"<B가 받은 항목 id>",action:"accepted"}` → `{ok:true}` 가 돌아오고 B 의 수신함 항목이 accepted 가 된다.

**구현 방법** (부부 기준. 세대는 테이블 `sedae_shared_items` · 컬럼 `owner_id`/`counterpart_id`)
```ts
translate.post('/share/respond', async (c) => {
  try {
    const uid = c.get('uid');
    const { shareId, action } = await c.req.json<{ shareId: string; action: string }>();
    if (action !== 'accepted' || !shareId) return c.json({ error: '잘못된 요청입니다.' }, 400);
    const r = await c.env.DB.prepare(
      "UPDATE shared_items SET status = 'accepted' WHERE id = ? AND sender_id != ? " +
      "AND relation_id IN (SELECT id FROM couple_relations WHERE user_a_id = ? OR user_b_id = ?)"
    ).bind(shareId, uid, uid, uid).run();
    if (!r.meta.changes) return c.json({ error: '처리할 수 없어요.' }, 404);
    return c.json({ ok: true });
```

서브쿼리 컬럼은 각 서비스 `assertRelationOwner` 정의 그대로다 — 부부 L107-110 `couple_relations … (user_a_id = ? OR user_b_id = ?)` / 세대 L181-187 `sedae_relations … (owner_id = ? OR counterpart_id = ?)`.
> 서브쿼리 대신 `SELECT relation_id, sender_id FROM shared_items WHERE id=?` → `assertRelationOwner` → UPDATE 의 2단계도 좋다(기존 헬퍼 재사용이라 오히려 파일 관행에 가깝다). 어느 쪽이든 **`sender_id != uid` 를 빠뜨리지 마라**(발신자 자가 수락 차단).

**검증 방법**
```bash
R() { curl -s -X POST https://bubu.maumful.com/api/share/respond -H "Authorization: Bearer $1" \
      -H "Content-Type: application/json" -d "{\"shareId\":\"$2\",\"action\":\"accepted\"}"; }
R "$TOKEN_A" "<B가 받은 항목 id>"        # → {"error":"처리할 수 없어요."}  (남의 것)
R "$TOKEN_A" "deadbeefdeadbeefde"        # → {"error":"처리할 수 없어요."}  (없는 id)
R "$TOKEN_B" "<같은 id>"                 # → {"ok":true}                   (수신자 본인)
node maumbubu/scripts/render_smoke.cjs public/static/bubu_hub.jsx
```
**렌더 검증** — 부부 허브 → 📬 수신함 → "수락" 클릭 → 오류 없이 목록 갱신.

**주의** — 마음세대 프론트에는 호출부가 **없지만** 라우트는 살아 있으니 반드시 함께 고쳐라(§1.4). / `render_smoke.cjs` 는 **파일 인자를 빠뜨리면 기본값 `landing.js` 를 찾다가 ENOENT 로 죽는다**(부부 설계서 §15-12). / 세대 L14 주석 *"share/\*는 NOT_YET 게이트로 차단 중"* 은 **사실과 다르다** — `NOT_YET` 맵(L142-148)에는 `consent/*` 3개뿐이다. "어차피 막혀 있다"고 넘기지 말고 보고서 §4 에 기록. / 세대 `/share/respond` 의 `TEEN_BLOCKED`(L126) 가드는 건드리지 마라.

### [R-23] `verifyJWT` 가 `['bubu','couple']` 을 모두 허용한다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumbubu/src/translate-route.ts:66` |
| 형제 서비스 | **마음세대** `maumsedae/src/translate-route.ts:93` — **이미 올바르다. 수정 대상이 아니라 정답 예시다.** |
| 근거 | 부부 설계서 §15-8 · 세대 설계서 §0 대조표(토큰 타입) |

**무엇이 문제인가** — 원문(L66):
```ts
if (p.type && !['bubu', 'couple'].includes(p.type)) return null; // 마음부부/커플 토큰만
```

`type:'couple'` 은 마음풀 `/api/couple-token`(`maumful-main/src/index.tsx:2140`)이 **마음커플용으로** 발급하는 토큰이다. 그 하나로 마음부부의 전 라우트 — 통역(`receive`/`send` 2cr, `mediate`/`perspective` 3cr)과 크레딧 차감 전체 — 에 접근할 수 있다.

**정답 예시 — 마음세대는 이미 이렇다**(`maumsedae/src/translate-route.ts:93`): `if (p.type && !['sedae'].includes(p.type)) return null; // 마음세대 토큰만 (마음풀 /api/sedae-token)`
`verifyJWT` 본문과 인증 미들웨어는 두 파일이 동일하다. **이 한 줄만 다르다.**

**확인 방법**
```bash
grep -n "includes(p.type)" maumbubu/src/translate-route.ts maumsedae/src/translate-route.ts
diff <(sed -n '54,80p' maumbubu/src/translate-route.ts) <(sed -n '81,107p' maumsedae/src/translate-route.ts)
grep -n "type: 'bubu'\|type: 'couple'" maumful-main/src/index.tsx     # → 2156 / 2141
```
재현: 마음풀 `GET /api/couple-token` 의 `coupleToken` 으로 `https://bubu.maumful.com/?t=<coupleToken>` 을 열면 401 없이 진입된다.

**구현 방법** — L66 을 세대와 동일한 형태로 좁힌다: `if (p.type && !['bubu'].includes(p.type)) return null; // 마음부부 토큰만 (마음풀 /api/bubu-token)`

**기존 동작 무영향 — 이미 코드로 확인했다.**

| 진입 경로 | 토큰 | `p.type` | 좁힌 뒤 |
|---|---|---|---|
| `app.jsx:2118` → `/api/bubu-token` | bubuToken | `'bubu'` | 통과 |
| `landing.jsx:213`·`621` 정상 | bubuToken | `'bubu'` | 통과 |
| `landing.jsx:213`·`621` **폴백** `localStorage.access_token` | 마음풀 accessToken | **없음** | 통과 — `p.type` 이 falsy 라 검사를 건너뜀(`maumful-main/src/index.tsx:488` 의 `signJwt({sub,email,iat,exp})` 에 `type` 클레임 없음) |
| 마음커플 토큰 | coupleToken | `'couple'` | **차단** ← 목적 |

**검증 방법**
```bash
U="https://bubu.maumful.com/api/share/inbox?relationId=1"
for T in "$BUBU_TOKEN" "$COUPLE_TOKEN" "$MAUMFUL_ACCESS_TOKEN"; do
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $T" "$U"; done
#   → 200|403 / 401 / 200|403   (가운데만 401 이어야 한다)
```

**렌더 검증** — 마음풀 앱 → 마음부부 진입 → 허브 로드 + 통역 1회 성공.

**주의** — **마음세대는 고치지 마라(이미 정답).** / `if (p.type && …)` 의 앞쪽 조건 때문에 **`type` 클레임 없는 토큰은 타입 검사를 통째로 건너뛴다.** 이번 수정 후에도 남는다(위 표 3행이 그 덕에 산다). 막으면 `landing.jsx` 폴백이 죽으므로 **손대지 말고 보고서 §4 에 기록**하라 — 세대 L93 도 동일 구조.

### [R-42] 네이버 로그인 `state` 가 검증되지 않는다 (CSRF)

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `cts-maum-main/src/index.tsx:712-719`(URL 발급) · `722-787`(콜백) |
| 형제 서비스 | **마음풀** `maumful-main/src/index.tsx:901-907`·`929` 에 동일 결함 — **이 배치 범위 밖**(§4 참조) |
| 근거 | CTS 설계서 §15-21 |

**무엇이 문제인가** — state 를 만들어 돌려주기만 하고 **어디에도 저장하지 않는다**(L712):
```ts
app.get('/api/auth/naver/url', (c) => {                   // ← async 아님
  const state    = crypto.randomUUID()                    // ← 만들기만 하고 저장 안 함
  return c.json({ success: true, url, state })
})
```

콜백은 받은 state 를 네이버 토큰 교환에 그대로 실어 보낼 뿐 자기 값과 대조하지 않는다(L723·L732):
```ts
const { code, state } = c.req.query()   // L723 — 이후 어디에서도 대조하지 않는다
`…/oauth2.0/token?grant_type=authorization_code&…&code=${code}&state=${state}&redirect_uri=…`  // L732
```

→ 공격자가 자기 code 로 피해자를 콜백시키면 **피해자 브라우저가 공격자 계정으로 로그인된다.**

**같은 라우트의 두 번째 문제** — 콜백이 accessToken·refreshToken 을 `postMessage(…, '*')` 로 던진다(L649·708·734·736·741·743·784 = 7곳). **마음풀의 같은 자리는 정답 형태다**(`maumful-main/src/index.tsx:992`): `window.opener?.postMessage(${loginData},window.location.origin);window.close();` — 팝업을 여는 쪽이 CTS 자기 페이지(`app.jsx:318`)라 opener 는 항상 동일 출처 → **드롭인 교체 가능.**

**확인 방법**
```bash
grep -n "naver/url" -A 8 cts-maum-main/src/index.tsx
grep -rn "naver/url" -A 6 cts-maum-main/public/static/app.jsx   # L314 가 {success,url} 만 쓰고 state 를 버림 → 프론트 수정 불필요
grep -n "postMessage" cts-maum-main/src/index.tsx               # '*' 7건
```
재현: `/api/auth/naver/callback?code=x&state=아무값` 을 직접 열면 state 단계에서 거절되지 않고 토큰 교환까지 진행된다("토큰 발급 실패" 가 나오면 state 로 막히지 않은 것).

**구현 방법** — 프론트가 state 를 쓰지 않으므로 **서버 왕복만으로 닫는다.** KV 바인딩 존재 확인됨(`cts-maum-main/wrangler.toml:23-25` `binding = "KV"`).

1. `/api/auth/naver/url` 을 **`async` 로 바꾸고**(현재 비동기가 아니다 — 안 바꾸면 TS 에러) state 를 KV 에 남긴다:
```ts
app.get('/api/auth/naver/url', async (c) => {
  const { KV } = c.env
  ...
  const state = crypto.randomUUID()
  await KV.put(`naver_state:${state}`, '1', { expirationTtl: 600 })
```

2. 콜백 첫머리에 대조 + 1회용 소비. 실패 응답은 카카오 `errPage()`(L647-651)와 같은 형태로:
```ts
if (!code || !state) return c.html('<script>window.close();</script>', 400)
const seen = await KV.get(`naver_state:${state}`)
if (!seen) return c.html('<script>window.opener?.postMessage({type:"naver_error",error:"잘못된 접근입니다."},window.location.origin);window.close();</script>')
await KV.delete(`naver_state:${state}`)     // 재사용 차단
```

3. `postMessage(…, '*')` **7곳 전부**를 `window.location.origin` 으로 바꾼다(마음풀 L992 가 정답 형태).
4. (조건부) 콜백 URL 폴백이 카카오는 `https://jesusmaum.com`(L637), 네이버는 **꺼져 있는** `https://lightoflife.limyj007.workers.dev`(L716·L729)다. 네이버 쪽을 맞춰라 — **단 네이버 개발자센터 등록값과 일치해야 한다. 레포에서 확인 불가이므로 현장 확인할 것.** 못 하면 건드리지 말고 보고서 §5 에 적어라.

**검증 방법**
```bash
S=$(curl -s https://jesusmaum.com/api/auth/naver/url | jq -r '.state')
npx wrangler kv key get --binding KV "naver_state:$S" --remote                    # → 1
curl -s "https://jesusmaum.com/api/auth/naver/callback?code=x&state=forged-uuid" | grep -o "잘못된 접근입니다"
grep -n "postMessage(.*,'\*')" cts-maum-main/src/index.tsx   # 0건
cd cts-maum-main && npx tsc --noEmit
```
재사용 차단: 정상 로그인 1회 후 **같은 state 로 재호출하면 거절**되는지.

**렌더 검증(필수)** — 브라우저에서 "네이버로 계속하기" → 팝업 → 동의 → 팝업이 닫히고 로그인됨. **postMessage 타깃을 바꿨으므로 반드시 사람이 한 번 태워봐야 한다.**

**주의** — CTS 는 유지보수 모드. 보안 수정이라 허용 범위지만 **로그인 화면 문구·버튼·동의 항목은 절대 건드리지 마라**(§1.5·§2.2). / 카카오는 애초에 state 를 발급하지 않는다(L634-641) — **카카오에 state 를 새로 도입하는 것은 범위 밖**(개발자센터 설정 변경 수반), 보고서 §4 에 기록하고 사용자에게 물어라. / `cts-maum-main` 은 서브모듈 — 부모 포인터 커밋까지(§1.6).

### [R-43] 소셜(카카오·네이버) 이메일 미동의 가입자가 `is_email_verified=0` 으로 만들어진다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `cts-maum-main/src/index.tsx:614`(카카오 SDK) · `691`(카카오 REST 콜백) · `766`(네이버 콜백) |
| 형제 서비스 | **마음풀** `maumful-main/src/index.tsx:971` 에 동일 코드 — **범위 밖**(§4 참조) |
| 근거 | CTS 설계서 §15-22 |
| 상태 | ⚠️ **RISKS.md·설계서의 전제 일부가 코드와 다르다. 아래 "전제 검증" 을 먼저 읽어라.** |

**무엇이 문제인가** — 세 소셜 가입 경로가 모두 이렇다(L691, 나머지 둘도 동일):
```ts
const emailVal = email?.toLowerCase() ?? `kakao_${kakaoId}@kakao.local`
const r = await DB.prepare(
  'INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,?,20)'
).bind(emailVal, 'kakao', kakaoId, nickname ?? '카카오사용자', 'ko', country, email ? 1 : 0).run()
```

이메일 미동의면 **수신 불가 주소(`kakao_<id>@kakao.local`) + `is_email_verified=0`** 으로 계정이 생긴다. 인증 메일을 보낼 주소 자체가 없다.

**같은 파일에 이미 있는 올바른 패턴** — 구글 가입(L559)은 하드코딩 `1` 이다: `'INSERT INTO users (…,is_email_verified,credits) VALUES (?,?,?,?,?,?,1,20)'`.
로그인 게이트 주석(L450-451)도 *"소셜 로그인은 게이트 없음 + 가입 시 verified=1 이라 면제"* 라고 **소셜=1 을 전제로** 쓰여 있다. 구글만 그 전제를 지킨다.

**전제 검증 (반드시 읽을 것)** — 설계서 §15-22 의 *"다음 로그인부터 잠긴다"* 는 **코드상 지금은 성립하지 않는다.** 게이트는 `/api/auth/login` L452 한 곳인데, **L441-442 의 `if (!user.password_hash) return c.json({…'소셜 로그인 계정입니다.'}, 401)` 가 먼저 걸려** 소셜 가입자(`password_hash` NULL)는 게이트에 도달하지 못한다. 소셜 콜백도 `is_email_verified` 를 보지 않고 곧장 토큰을 발급하고, 마이페이지 재발송 배너(`app.jsx:4474`)는 `!currentUser?.social_provider` 조건이라 소셜 계정엔 뜨지 않는다.

→ **실제 피해는 "잠김" 이 아니라 이 넷이다.** ① `users.email` 에 수신 불가 주소가 축적(영수증·비밀번호 재설정·공지 전부 불가) ② 같은 사람이 나중에 실제 이메일로 가입하면 `WHERE email = ?` 매칭이 안 돼 **계정이 갈라진다** ③ 게이트를 소셜·결제 경로로 넓히는 순간 **일괄 잠긴다**(시한폭탄) ④ `is_email_verified` 가 제공자별로 의미가 달라 "연락 가능 여부" 신호로 못 쓴다.

**확인 방법**
```bash
grep -n "is_email_verified" cts-maum-main/src/index.tsx        # 559(구글=1) / 614·691·766(email?1:0)
grep -n "@kakao.local\|@naver.local" cts-maum-main/src/index.tsx
sed -n '438,455p' cts-maum-main/src/index.tsx                  # 게이트가 password_hash 검사 뒤임을 눈으로
npx wrangler d1 execute lightoflife-db --remote --command \
 "SELECT social_provider,is_email_verified,COUNT(*) c FROM users WHERE social_provider IN ('kakao','naver') GROUP BY 1,2"
```
**실측을 먼저 하라. 건수에 따라 조치가 달라진다.**

**구현 방법** — ⚠️ 이 이슈는 BATCH_00 §2.2 의 *"기존 사용자의 권한·이용권에 영향이 가는 변경"* 이다. **A 만 먼저 하고 B·C 는 실측 결과와 함께 사용자에게 물어라.**

**A. 신규 유입 차단 (지금 해도 되는 것)** — L614·L691·L766 의 마지막 바인딩 `email ? 1 : 0` → `1`. 구글(L559)과 같은 의미로 맞춘다(소셜은 제공자가 신원을 보증). **`emailVal` 의 `.local` 폴백은 그대로 둔다** — `users.email` 이 NOT NULL/UNIQUE 일 수 있고, 스키마 확인 없이 NULL 을 넣으면 가입 전체가 깨진다. 스키마는 **현장 확인**: `npx wrangler d1 execute lightoflife-db --remote --command "PRAGMA table_info(users)"`

**B. 기존 행 정정 (사용자 확인 필요)** — `UPDATE users SET is_email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE social_provider IN ('kakao','naver') AND is_email_verified = 0;`

**C. 실제 이메일 수집 경로 (사용자 확인 필요)** — `.local` 사용자에게 마이페이지에서 이메일을 입력받는 UI. `app.jsx:4474` 배너 조건을 `social_provider` 유무가 아니라 `email.endsWith('.local')` 기준으로 바꾸고 등록→인증 메일 흐름을 붙이는 형태. **신규 기능이므로 CTS 유지보수 모드 위반 — 반드시 사용자 승인을 받아라.**

**검증 방법**
```bash
grep -n "email ? 1 : 0" cts-maum-main/src/index.tsx                          # 0건
grep -n "is_email_verified,credits) VALUES" cts-maum-main/src/index.tsx      # 559·614·691·766 전부 1
cd cts-maum-main && npx tsc --noEmit
```
실가입 검증: 카카오 이메일 제공 동의를 **해제**한 상태로 신규 가입 → `npx wrangler d1 execute lightoflife-db --remote --command "SELECT id,email,social_provider,is_email_verified FROM users ORDER BY id DESC LIMIT 3"` → `is_email_verified = 1`.
기존 동작 무영향: 이메일가입 미인증 사용자가 여전히 403 으로 막히는지(게이트를 안 건드렸으므로 그대로여야 한다).

**주의** — **로그인 게이트(L452)를 손대지 마라**(이메일가입 경로의 정상 동작). / 구글 경로(L559)는 이미 정답이다. / `.local` 주소를 지우거나 NULL 로 바꾸는 마이그레이션은 §2.2 의 *"데이터 삭제를 수반하는 마이그레이션"* — 임의로 하지 마라. / 코드를 고친 뒤 **CTS 설계서 §15-22 본문도 위 "전제 검증" 내용으로 정정**할 것(§1.10).

---

## 2. 커밋 분리 (BATCH_00 §1.7)

최소 6개 커밋으로 갈린다. 섞지 마라.
```
[maumgame]  R-01 리더보드 이메일 제거 + 인증 / R-02 주간리포트 IDOR 차단
[cts]       R-01·R-02 게임 트윈 동일 수정              ← cts-game-main (부모 레포 안)
[maumbubu]  R-05 share/respond 소유권 검증 / R-23 토큰 타입 bubu 한정
[maumsedae] R-05 share/respond 소유권 검증
[cts]       R-42 네이버 state 검증 + postMessage origin / R-43 소셜 가입 verified=1  ← 서브모듈
[공통]      BATCH_01 결과 보고서 + RISKS.md 갱신
```
`cts-maum-main` 커밋 후 **부모 레포 포인터 커밋**을 잊지 마라(§1.6).

---

## 3. 이 배치의 완료 기준

- [ ] R-01 — 무인증 401 / 인증 시 응답에 `email` 키 없음 · `compiled/game_hub.js` 재컴파일 후 커밋(`grep "entry.email"` 0건) · 브라우저에서 리더보드 + "나" 배지 렌더 검증 — **마음게임·CTS 게임 양쪽**
- [ ] R-02 — 무인증 401 / 타인 id 403 / 본인 200 + 응답 키 4종 유지 (양쪽)
- [ ] R-05 — 남의 `shareId` 404 · 본인 수신 항목 200 (부부·세대 **양쪽**) + 부부 수신함 "수락" 렌더 검증 · `render_smoke.cjs` 통과
- [ ] R-23 — bubu 통과 / couple 401 / 마음풀 `access_token` 폴백 통과 3종 확인 + **마음세대는 수정하지 않았음** 확인
- [ ] R-42 — KV `naver_state:*` 생성 · 위조 state 거절 · 재사용 거절 · `postMessage(…,'*')` 0건 · 실제 네이버 로그인 1회 성공(브라우저)
- [ ] R-43 — A 적용 + `npx tsc --noEmit` 통과 · 운영 DB 실측 건수 기록(못 했으면 못 했다고) · B·C 사용자 확인 결과를 보고서 §6 에 기록
- [ ] 서비스별 커밋 분리 + `cts-maum-main` 부모 포인터 커밋 완료
- [ ] `docs/DESIGN.md` §15 갱신 + 개정 이력 한 줄 (게임·부부·세대·CTS **4곳**) · CTS §15-22 부정확 서술 정정
- [ ] `_docs/RISKS.md` 의 R-01·02·05·23·42·43 해소 표기
- [ ] 배포 완료 또는 미배포 사유 기록 (`wrangler deploy` 는 **포그라운드**)
- [ ] 결과 보고서 작성 완료

---

## 4. 결과 보고서

작성 경로: **`_docs/작업지시서/결과/BATCH_01_결과.md`** — 양식은 **BATCH_00 §3.1 템플릿 그대로**. `[공통]` 커밋으로 함께 올린다.

**§3(전제 불일치)에 최소 아래 3건은 들어가야 한다** — 지시서 작성 중 코드에서 이미 확인된 것이다.

| 이슈 | 지시서/RISKS 의 전제 | 실제 코드 |
|---|---|---|
| R-43 | "인증 게이트에 잠긴다"(RISKS.md · CTS 설계서 §15-22) | `/api/auth/login` L441-442 의 `password_hash` 검사가 먼저 걸려 게이트(L452)에 **도달하지 않는다.** 소셜 콜백은 게이트를 보지 않는다 |
| R-05 | 세대 `translate-route.ts` L14 주석 *"share/\*는 NOT_YET 게이트로 차단 중"* | `NOT_YET` 맵(L142-148)에 `consent/*` 3개뿐 — `share/*` 는 **차단돼 있지 않다** |
| R-01 | "프론트는 '나' 표시용으로만 쓴다"(마음게임 설계서 §15-1) | 맞지만 **`game_hub.jsx:640` 의 닉네임 폴백에서도 쓴다**(`entry.email?.split('@')[0]`) — 두 곳 다 고쳐야 한다 |

**§4(새로 발견한 것)에 기록할 것** — 이 배치에서는 고치지 않는다.

| # | 내용 | 심각도 추정 | 조치 |
|---|---|---|---|
| 1 | **마음풀 본체에 R-42·R-43 과 동일한 결함** — `maumful-main/src/index.tsx:901-907`(state 미저장) · `929`(대조 없음) · `971`(`email ? 1 : 0` + `naver_<id>@naver.local`) | S2 | 범위 밖. 마음풀은 유지보수 모드가 아닌 본체라 **별도 커밋·배포·검증 필요** → 사용자에게 물어라(§6) |
| 2 | `verifyJWT` 의 `if (p.type && …)` 가 **`type` 클레임 없는 토큰의 타입 검사를 건너뛴다** (부부 L66 · 세대 L93 공통) | S3 | 현재 마음풀 `access_token` 폴백이 이 구멍에 의존 — 막으려면 폴백부터 없애야 함 |
| 3 | CTS 카카오 로그인은 `state` 를 **발급조차 하지 않는다**(L634-641) | S2 | 카카오 개발자센터 설정 변경 수반 → 범위 밖 |
| 4 | CTS 네이버 콜백 URL 폴백이 **꺼져 있는 워커 주소**(L716·L729). 카카오는 `jesusmaum.com`(L637) | S3 | R-42 구현 4번 — 개발자센터 등록값 확인 후에만 |

> 위 표를 그대로 옮기지 말고 **실제로 코드를 열어 확인한 결과로 갱신해서** 써라. 라인 번호가 다르면 문자열로 다시 찾고 실제 라인을 적어라(§1.1).
