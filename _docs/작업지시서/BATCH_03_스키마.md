# BATCH_03 — 스키마 (6건)

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **근거**: 2026-09-19 코드·마이그레이션 직접 열람 + `_docs/RISKS.md` + 각 서비스 `docs/DESIGN.md` §6·§15
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

---

## 0. 배치 개요

### 0.1 이슈표

| ID | 제목 | 심각도 | 대상 | 형제 서비스 |
|---|---|---|---|---|
| R-03 | `partner_commissions` 테이블에 CREATE 마이그레이션이 없다 | **S1** | 마음풀 | — |
| R-07 | `external_orders`·`users.email_verified` DDL 부재 (후자는 fail-open) | S2 | 마음수달 | **마음곁** |
| R-06 | `/api/couple/timeline` 이 없는 컬럼을 SELECT — 실행 시 실패 | S2 | 마음커플 | — |
| R-20 | `couple_sessions` 스키마 중복 정의. 한 사본은 CHECK 제약 누락 | S3 | 마음커플·마음풀 | CTS(4번째 사본) |
| R-34 | CTS 마이그레이션 번호가 0015부터 갈라짐 | S3 | CTS | — |
| R-51 | `payments` 테이블은 존재하지 않는다 (문서 정정) | S3 | 마음풀(문서) | — |

**예상 작업량** — **R-03 이 이 배치의 핵심**(실측 1h + DDL 1h, 실측 결과로 분기가 갈린다). R-07 반나절(두 서비스 × 두 DB, `email_verified` 는 **사용자 확인 대기**). R-06·R-51 각 30분. R-20·R-34 각 1시간 — **코드 수정 없음**, 문서·주석·원격 실측이 전부.

### 0.2 선행조건

1. `gh auth status` → `youngjun1603` 활성(§1.8). `cts-maum-main/` 은 **서브모듈**(커밋 순서 §1.6).
2. **`wrangler` 로 원격 D1 을 읽을 수 있어야 한다.** 이 배치의 거의 모든 "확인 방법"이 원격 실측이다. `npx wrangler whoami` → limyj007 계정. 읽지 못하면 **추측으로 DDL을 만들지 말고 멈춰라**(§2.2·§4 규칙).
3. ⚠️ **D1 원격 마이그레이션 트랩**(마음풀 `CLAUDE.md` L280 원문): 원격 `maumful-db` 는 트래킹 테이블이 비어 있어 `wrangler d1 migrations apply … --remote` 가 **0001 부터 재적용을 시도하다 기존 스키마와 충돌해 실패**한다. 새 마이그레이션은 반드시 `npx wrangler d1 execute maumful-db --remote --file=migrations/00NN_*.sql` 로 **직접 적용**하고, DDL 은 `IF NOT EXISTS` 로 멱등하게. CTS 도 동일(`lightoflife-db`, CTS 설계서 §6.4·HANDOVER §6).
4. **마음수달·마음곁은 로컬 개발 환경이 없다.** 각 `CLAUDE.md`(수달 L62·L67 / 곁 L69·L74): *"모든 변경은 GitHub 웹 UI → Cloudflare 자동 배포. `wrangler dev` 안내 금지"*, *"스키마 변경은 대시보드 Console 에서 `ALTER TABLE ADD COLUMN`"*. → **적용의 정본은 Cloudflare 대시보드 D1 Console** 이고, `.sql` 파일은 레포에 기록으로 남긴다.
5. D1(SQLite) 제약: `DROP COLUMN`·`RENAME COLUMN`·타입 변경·**제약(CHECK/UNIQUE) 사후 추가 불가**. 이 배치의 모든 "고치기"는 사실상 **추가형(ADD COLUMN / CREATE TABLE IF NOT EXISTS)** 뿐이다.

### 0.3 후행 배치 · 손대지 말 것

**BATCH_02(결제·정산)의 R-47 이 이 배치에 의존한다.** BATCH_02 §0.4-2 가 `partner_commissions`·`external_orders` 를 "⛔ 부재 — BATCH_03 이 먼저다"로 명시하고, R-47 항목에도 `| 선행 | **BATCH_03** |` 이 박혀 있다. **R-03 이 끝나지 않으면 R-47 의 "요약을 원장 기준으로 바꾼다"는 수정은 검증할 대상 자체가 없다.** R-37(grant 전달)도 `external_orders`(R-07)가 있어야 수신측 멱등을 실측할 수 있다.
→ **R-03·R-07 을 먼저 끝내고 실측 결과(테이블 실재 여부·행 수)를 보고서 §2 에 숫자로 남겨라.** BATCH_02 작업자가 그 값을 읽는다.

**손대지 말 것** — **이미 원격에 적용된 마이그레이션 파일의 내용·파일명**(마음풀 `0001~0029`, CTS `0001~0022`, 커플 `0001~0002`): 수정·rename·삭제 전부 금지, 과거는 고치는 게 아니라 뒤에 덧붙이는 것이다 / **소급 적립·데이터 백필**(데이터 변경 = §2.2 멈추고 물어볼 것 — 건수만 세어 보고) / **R-47 정산 산식**(BATCH_02) / **`isEmailVerified` 의 fail-open 자체**(R-07 주의) / **CTS 기능 개선**(§1.5) / **`accruePartnerCommission` 의 비차단 구조**(결제를 막지 않는 것은 의도된 설계다 — 조용함만 없앤다).

---

## 1. R-03 — `partner_commissions` 테이블에 CREATE 마이그레이션이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | **S1** (제휴 정산 원장이 통째로 유실될 수 있다 = 금전·계약 분쟁) |
| 대상 | `maumful-main/src/index.tsx` — 적립 `4075` · 역적립 `4080` · 어드민 원장 `6517`·`6526` · 정산완료 `6539` · 파트너 포털 `6619`·`6625` (SQL 7곳 + 주석 `4058`·`6501`) |
| 형제 서비스 | — (CTS 설계서 §6.3 은 `partner_commissions` 를 "마음풀도 마이그레이션 없음"으로 적고 있다. CTS 는 이 배치 범위 밖) |
| 근거 | 마음풀 설계서 §6 L247 · §10.5 L516~521 · §15-1(L746) · RISKS R-03 |
| 후행 | **BATCH_02 R-47** |

**무엇이 문제인가** — 제휴 수익 쉐어의 적립·역적립·어드민 조회·파트너 포털 **네 경로가 전부** 이 테이블을 쓰는데 `migrations/` 29개 파일 어디에도 `CREATE TABLE partner_commissions` 가 없다. 그런데 적립 호출부는 **비차단 `.catch`** 라 테이블이 없어도 결제는 정상 완료되고 **아무 흔적도 남지 않는다.**

```ts
// 호출부 4곳 — L1253 · L3719 · L4561 은 에러를 통째로 버린다
reversePartnerCommission(DB, charge.id).catch(() => {})                                   // L1253
accruePartnerCommission(DB, chargeId).catch(err => console.error('[PartnerShare] …', err)) // L3481 ← 유일하게 로그
accruePartnerCommission(DB, chargeIdNum).catch(() => {})                                   // L3719
reversePartnerCommission(DB, chargeId).catch(() => {})                                     // L4561
```

**전례** — `0029_external_grants.sql` 주석 원문: *"⚠️ 기존 코드(deliverGrant)가 이 테이블을 INSERT/UPDATE 하는데 CREATE가 어디에도 없었음 → 수달·곁 grant가 실제론 실패 상태였음."* **완전히 같은 패턴이다.** 마음풀 `CLAUDE.md` L172 도 같은 사고를 한 번 더 기록해 두었다(`weekly_reports`·`user_test_scores` 가 몇 달간 조용히 실패).

**확인 방법 — 원격 실측이 먼저다**
```bash
cd maumful-main
grep -rn "CREATE TABLE.*partner_commissions" migrations/     # → 0건 (부재 확인)
ls migrations/ | tail -1                                     # → 0029_external_grants.sql (다음 번호 = 0030)

# ① 원격에 실재하는가
npx wrangler d1 execute maumful-db --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' AND name='partner_commissions'"
# ② 있으면 실제 DDL 원문을 통째로 뽑는다 (여기가 정본이 된다)
npx wrangler d1 execute maumful-db --remote --command \
  "SELECT sql FROM sqlite_master WHERE name='partner_commissions'"
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(partner_commissions)"
npx wrangler d1 execute maumful-db --remote --command "SELECT COUNT(*) AS n FROM partner_commissions"
```

**분기 A — 테이블이 없다** → 아래 DDL 로 `0030_partner_commissions.sql` 을 새로 만든다.
**분기 B — 테이블이 이미 있다** → **DDL 을 새로 만들지 마라.** ②의 `sql` 원문을 **그대로** `0030_partner_commissions.sql` 에 옮겨 적고(=역기록), 파일 첫 줄에 *"원격에 이미 존재하던 스키마를 2026-XX-XX 에 역기록. 적용된 적 없는 파일이다"* 라고 명시한다. 원격 스키마가 코드와 어긋나면(컬럼 부족 등) **`ALTER TABLE ADD COLUMN` 만** 쓰고, 어긋난 내용을 보고서 §3 전제 불일치에 적어라. **DROP → 재생성은 절대 금지**(①에서 행이 하나라도 있으면 정산 원장이 날아간다).

**구현 방법 — DDL 초안(분기 A 전용)** — 아래 컬럼은 **추측이 아니라 INSERT/SELECT/UPDATE 문에서 실제로 쓰이는 것만** 뽑았다. 근거를 각 줄에 달았다.
```sql
-- migrations/0030_partner_commissions.sql
-- 제휴 수익 쉐어 정산 원장. 코드(accruePartnerCommission/reversePartnerCommission·
-- /api/admin/partner-commissions·/api/partner-portal/commissions)가 이미 쓰고 있으나
-- CREATE 가 어느 .sql 에도 없었다 → 0029(external_grants)와 동일 사고 패턴.
CREATE TABLE IF NOT EXISTS partner_commissions (
  charge_id      INTEGER PRIMARY KEY,                     -- credit_charges.id (0004 L54 INTEGER PK). INSERT OR IGNORE 멱등의 근거
  partner_code   TEXT    NOT NULL,                        -- credit_charges.partner_code (0018 L21). 조회는 항상 대문자
  user_id        INTEGER,                                 -- LEFT JOIN users → NULL 허용
  charge_amount  INTEGER NOT NULL,                        -- credit_charges.amount. SUM() 대상
  rate           REAL    NOT NULL,                        -- partners.revenue_share_rate 의 적립 시점 스냅샷 (0018 L6 REAL)
  share_amount   INTEGER NOT NULL,                        -- Math.round(amount * rate) — L4074
  currency       TEXT    NOT NULL DEFAULT 'KRW',          -- ch.currency || 'KRW' — L4076
  status         TEXT    NOT NULL DEFAULT 'pending'       -- ⚠️ INSERT 문에 없다. DEFAULT 가 없으면 모든 적립이 실패한다
                 CHECK(status IN ('pending','settled','reversed')),
  settled_at     DATETIME,                                -- L6539 settled_at=datetime('now')
  settlement_ref TEXT,                                    -- L6539 bind(ref ?? null)
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP  -- ⚠️ INSERT 문에 없다. date(created_at) 필터·ORDER BY 의 기준
);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_code   ON partner_commissions(partner_code, created_at);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_status ON partner_commissions(status);
```

**틀리면 조용히 죽는 두 줄** — ① `status`·`created_at` 은 **INSERT 컬럼 목록에 없다**(L4075 원문: `(charge_id, partner_code, user_id, charge_amount, rate, share_amount, currency)`). DEFAULT 없이 `NOT NULL` 만 걸면 **모든 적립이 제약 위반으로 실패**하고, 비차단 `.catch` 때문에 그 실패조차 보이지 않는다. ② `charge_id` 는 **PRIMARY KEY 여야 한다** — `INSERT OR IGNORE` 의 멱등(success 콜백 + 웹훅 중복 방지)이 이 유일성에만 의존한다(L4059 주석 *"charge_id PK로 멱등"*). UNIQUE 없이 만들면 **중복 적립**이 쌓인다.

**인덱스 근거** — 조회는 전부 `partner_code = ? AND date(created_at) BETWEEN ? AND ?`(L6510·L6616), 정산 완료는 `partner_code + status='pending' + 기간`(L6539). `charge_id` 단건 UPDATE(L4080)는 PK 가 덮는다.
**FK** — `user_id INTEGER REFERENCES users(id)` 는 붙여도 되지만 **`ON DELETE CASCADE` 는 절대 금지**(회원 탈퇴 시 제휴사 지급 근거가 사라진다). `charge_id` 의 `credit_charges(id)` 참조도 생략이 안전하다 — 0029 도 FK 없이 만들었다.

**적립 실패를 더는 조용하지 않게** — 테이블과 별개로, **에러를 버리는 세 줄만** 로그로 바꿔라(동작은 그대로, 여전히 비차단이다).

```ts
// L1253 · L3719 · L4561 — .catch(() => {}) → L3481 과 같은 형태로
.catch(err => console.error('[PartnerShare] 적립/역적립 실패 chargeId=' + chargeId, err))
```
그 이상(재시도 큐·알림)은 범위 밖이다.

**검증 방법**
```bash
# 로컬(dev) 먼저
npx wrangler d1 execute maumful-db --local --file=migrations/0030_partner_commissions.sql
npx wrangler d1 execute maumful-db --local --command "PRAGMA table_info(partner_commissions)"
# 적립 경로를 한 번 태운다 — status·created_at 가 DEFAULT 로 채워지는지 (NOT NULL 에러 = DDL 이 틀린 것)
npx wrangler d1 execute maumful-db --local --command \
 "INSERT OR IGNORE INTO partner_commissions (charge_id,partner_code,user_id,charge_amount,rate,share_amount,currency)
  VALUES (999999,'TEST',1,10000,0.15,1500,'KRW');
  SELECT charge_id,status,created_at FROM partner_commissions WHERE charge_id=999999"
npx wrangler d1 execute maumful-db --local --command "DELETE FROM partner_commissions WHERE charge_id=999999"
# 원격(prod) — 위가 전부 통과한 뒤에만
npx wrangler d1 execute maumful-db --remote --file=migrations/0030_partner_commissions.sql
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(partner_commissions)"
# 적립 누락 후보 건수 — 보고서 §4 에 숫자를 적는다 (고치지는 마라)
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT COUNT(*) AS missing, COALESCE(SUM(cc.amount),0) AS amount
  FROM credit_charges cc JOIN partners p ON p.code = cc.partner_code
  WHERE cc.status='completed' AND p.is_active=1 AND p.revenue_share_rate > 0
    AND NOT EXISTS (SELECT 1 FROM partner_commissions pc WHERE pc.charge_id = cc.id)"
```
어드민 원장 API 도 한 번 태운다: `GET /api/admin/partner-commissions?code=<코드>` → 500 이 아니라 `{success:true, data:{totals:{cnt:0,…}, rows:[]}}`.

**주의** — **잘못 적용하면**: `status`/`created_at` DEFAULT 누락 → 적립이 전부 실패하는데 `.catch` 때문에 **증상이 0**, 정산 시즌에야 "원장이 비었다"로 드러난다. `charge_id` UNIQUE 누락 → 웹훅과 success 콜백이 **같은 결제를 두 번 적립**해 제휴사 지급액이 부풀어 오른다.
**순서는 로컬(dev) → 확인 → 원격(prod)** — 반대로 하면 되돌릴 방법이 없다(D1 은 DDL 롤백이 없고 `DROP TABLE` 은 데이터와 함께 사라진다). / **`CHECK` 은 사후에 못 붙인다** — 분기 B 에서 원격에 CHECK 이 없으면 그대로 두고 기록만 해라(붙이려면 테이블 재생성 = §2.2). / 마음풀 `CLAUDE.md` L280 은 *"영문 DDL만(한글 주석 X)"* 이라지만 **0029 는 한글 주석으로 적용됐다** — 위 초안은 0029 관행을 따랐다. `--file` 이 인코딩으로 실패하면 주석 없는 사본으로 재시도하고 **어느 쪽이 맞았는지 보고서 §3 에 적어라**(문서 둘 중 하나가 틀린 것이다). / **소급 적립 금지**(§0.3) — 위 마지막 쿼리 결과만 보고한다.

---

## 2. R-07 — `external_orders` · `users.email_verified` DDL 부재

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumotter/src/index.ts:545·555·566·581` · `maumotter/src/auth.ts:91·94` |
| 형제 서비스 | **마음곁** `maumgyeot/src/index.ts:411·421·432·447` · `maumgyeot/src/auth.ts:92·95` — **완전 동일 코드**. 한쪽만 고치지 마라(BATCH_00 §1.4) |
| 근거 | 수달 설계서 §15 · 곁 설계서 §15 · RISKS R-07 · 복제 결함표 5행 |
| 후행 | **BATCH_02 R-37** |

**무엇이 문제인가 — 두 개의 다른 DB 이야기다. 섞지 마라.**
| 대상 | 어느 D1 인가 | 바인딩 | 왜 |
|---|---|---|---|
| `external_orders` | **`maumotter-db`(f404bbb2…) 와 `maumgyeot-db`(d04c7ab8…) — 서비스별로 각각** | `c.env.DB` | 코드가 `c.env.DB.prepare(…external_orders…)` 로 접근한다 |
| `users.email_verified` | **`maum-auth`(2df188da…) — 두 서비스가 공유하는 하나뿐인 DB** | `c.env.AUTH_DB` | `auth.ts` 가 `authDb.prepare('… FROM users …')` 로 접근한다. 양쪽 `wrangler.toml` 의 `AUTH_DB` `database_id` 가 같은 값이다 |

→ **`external_orders` 는 두 번, `email_verified` ALTER 는 한 번.** 두 서비스에서 `maum-auth` 에 각각 ALTER 를 걸면 두 번째가 `duplicate column name` 으로 실패한다(정상이다 — 그때 멈추면 된다). 그리고 `isEmailVerified` 는 실패 시 **`true` 를 반환**한다 — 컬럼이 없으면 이메일 인증 게이트가 **조용히 통과**된다.
```ts
// maumotter/src/auth.ts:93-95 (곁은 L94-96, 동일)
export async function isEmailVerified(authDb: D1Database, id: number): Promise<boolean> {
  try { const r = await authDb.prepare('SELECT email_verified FROM users WHERE id=?').bind(id).first<any>();
        return !!(r && r.email_verified); } catch { return true; }   // ← fail-open
}
```

**확인 방법**
```bash
grep -rn "external_orders" maumotter/src maumgyeot/src
grep -rn "CREATE TABLE" maumotter/*.sql maumotter/migrations/*.sql maumgyeot/*.sql maumgyeot/migrations/*.sql | grep -i "external_orders"   # → 0건
grep -n "email_verified" _shared/maum-auth-schema.sql maumotter/maum-auth-schema.sql maumgyeot/maum-auth-schema.sql                      # → 0건
ls maumotter/migrations/ maumgyeot/migrations/   # 다음 번호: 수달 0003 · 곁 0004 (번호는 서비스별 독립)
# 원격 실측 — Cloudflare 대시보드 → D1 → 각 DB → Console 에 붙여넣어도 된다(수달·곁의 정본 경로)
npx wrangler d1 execute maumotter-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='external_orders'"
npx wrangler d1 execute maumgyeot-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='external_orders'"
npx wrangler d1 execute maum-auth   --remote --command "PRAGMA table_info(users)"     # email_verified 유무
```
있으면 **R-03 분기 B 와 동일하게** `SELECT sql FROM sqlite_master WHERE name='external_orders'` 원문을 역기록한다.

**구현 ① `external_orders` DDL 초안(양쪽 동일)** — INSERT(수달 L555 / 곁 L421)·UPDATE(L581 / L447)·`SELECT *`(L566 / L432)에서 실제로 읽는 컬럼만 뽑았다.
```sql
-- maumotter/migrations/0003_external_orders.sql
-- maumgyeot/migrations/0004_external_orders.sql  (내용 동일, 번호만 다름)
-- 마음풀 통합결제 grant 수신 원장. /api/grant 가 order_id 멱등의 근거로 쓴다.
CREATE TABLE IF NOT EXISTS external_orders (
  order_id     TEXT PRIMARY KEY,                         -- grant 토큰의 orderId. 멱등 판정(L545/L411)의 유일한 근거
  email        TEXT,                                     -- INSERT 바인드
  maum_user_id INTEGER,                                  -- INSERT 바인드. 회수 시 subscriptions/packs 조회 키(L573/L439)
  grant_type   TEXT NOT NULL,                            -- PLAN|PACK 키. 회수 시 분기(L571/L437)
  status       TEXT NOT NULL DEFAULT 'pending'           -- INSERT 는 'applied' 명시, UPDATE 는 'revoked'
               CHECK(status IN ('pending','applied','revoked')),
  applied_at   TEXT,                                     -- INSERT 시 datetime('now')
  revoked_at   TEXT,                                     -- 회수 시 datetime('now') (L581/L447)
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))   -- INSERT 문에 없다 → DEFAULT 필수
);
CREATE INDEX IF NOT EXISTS idx_external_orders_user ON external_orders(maum_user_id);
```
**`amount` 는 넣지 마라.** grant 토큰 payload 에는 있지만 **INSERT 문에 없다**(L555/L421 원문 확인). 필요해지면 그때 `ADD COLUMN` 한다. 날짜 컬럼이 `DATETIME` 이 아니라 `TEXT DEFAULT (datetime('now'))` 인 것은 수달·곁 기존 테이블(`0001_billing.sql`)의 관행을 따른 것이다.

**구현 ② `users.email_verified` — `maum-auth` 에 딱 한 번**
```sql
-- 대상 DB: maum-auth (2df188da-159e-43ea-be31-b2dc39d8501d) — 수달·곁 공용. 한 번만 실행.
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
```
**기록할 파일 3장** — `_shared/maum-auth-schema.sql` · `maumotter/maum-auth-schema.sql` · `maumgyeot/maum-auth-schema.sql`(현재 3장 전부 동일 내용). 세 파일 모두 헤더에 *"⚠️ 운영 중 변경은 ALTER TABLE ADD COLUMN 만"* 이라고 적혀 있다 → **`CREATE TABLE` 블록을 수정하지 말고**(그 블록은 `IF NOT EXISTS` 라 기존 DB 에 적용되지 않는다) 파일 **맨 아래에 위 ALTER 문을 날짜 주석과 함께 덧붙여라.**

⚠️ **`DEFAULT 0` 은 기존 회원 전원을 "미인증"으로 만든다.** 게이트는 수달 `index.ts:506` · 곁 `index.ts:361` 에 있고 `c.env.RESEND_API_KEY` 가 설정된 경우에만 작동한다(현재는 미설정 = no-op, 각 `CLAUDE.md` L117/L150). 즉 **지금은 증상이 없지만 Resend 키를 넣는 순간 기존 회원 전원이 이용권 등록에서 막힌다.**
→ **그랜드파더링(기존 행을 1 로 채울지)은 BATCH_00 §2.2 "기존 사용자의 권한에 영향이 가는 변경" 이다. 임의로 결정하지 말고 사용자에게 물어라.** CTS 에는 전례가 있다(CTS 설계서 L298 원문: *"기존 회원 그랜드파더링(is_email_verified=1)했고, 이 시점 이후 신규 이메일가입만 인증 필수"*). 이 전례를 선택지로 제시하고 보고서 §6 에 올려라.

**검증 방법**
```bash
npx wrangler d1 execute maumotter-db --remote --command "PRAGMA table_info(external_orders)"
npx wrangler d1 execute maumgyeot-db --remote --command "PRAGMA table_info(external_orders)"
npx wrangler d1 execute maum-auth    --remote --command "PRAGMA table_info(users)"   # email_verified 존재 + dflt_value=0
# fail-open 이 더는 발동하지 않는지 (컬럼이 생겼으므로 catch 로 안 빠져야 한다)
curl -s https://maumotter.com/api/auth/me -H "Authorization: Bearer $OTTER_TOKEN" | jq '.email_verified'
curl -s https://maumgyeot.com/api/auth/me -H "Authorization: Bearer $GYEOT_TOKEN" | jq '.email_verified'
#   → 컬럼 전: 항상 true(fail-open).  컬럼 후: 실제 값(기본 false)
```
`/api/grant` 는 마음풀 쪽 서명이 필요해 단독 재현이 어렵다 → **BATCH_02 R-37 에서 E2E 로 태운다.** 여기서는 테이블 존재와 `PRAGMA` 까지만 확인하고 넘겨라.

**주의** — **잘못 적용하면**: `order_id` PK 누락 → 멱등이 깨져 **같은 결제로 이용권이 두 번 지급**된다. `created_at` DEFAULT 누락 → `/api/grant` 가 NOT NULL 위반으로 500(이쪽은 `.catch` 가 없어 최소한 드러난다).
**순서는 로컬 → 원격**, 그리고 **수달에 먼저 적용해 `/api/auth/me` 로 무영향을 확인한 뒤 곁에** 적용해라. / **`isEmailVerified` 의 `catch { return true }` 자체는 바꾸지 마라** — fail-closed 로 뒤집는 것은 사용자에게 보이는 게이트 변경이다(BATCH_00 §2.2). `console.error` 한 줄만 허용. / ⚠️ 통합결제는 루트 `CLAUDE.md` 상 *"토스 완전 반영 후에만 착수·배포"*(RISKS R-31) — **이 이슈는 스키마만 만들고 `/api/grant` 코드는 건드리지 않으므로 워커 재배포가 없다.** 코드를 고치고 싶어지면 멈춰라. / 수달·곁은 GitHub 웹 UI 배포라 `.sql` 커밋은 배포를 유발하지 않는다 — **적용은 대시보드 Console 이 별도 수동 작업**이다(커밋만 하고 끝내면 아무것도 안 바뀐 것이다).

---

## 3. R-06 — `/api/couple/timeline` 이 없는 컬럼을 SELECT 한다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `package/maumcouple/src/index.tsx:1212`(`cs.code`·`cs.test_types`) · 타입 선언 `1223-1226` |
| 형제 서비스 | — |
| 근거 | 마음커플 설계서 §15-1(L374)·§6 L154 · RISKS R-06 |

**무엇이 문제인가** — 실제 컬럼은 `session_code`·`test_type` 이다(`maumful-main/migrations/0010_couple_sessions.sql` L3·L6). D1 이 `no such column: cs.code` 를 던지고, **이 라우트에는 try/catch 가 없어** 500 이 나간다.

```ts
// package/maumcouple/src/index.tsx:1212
SELECT cs.code, cs.status, cs.compatibility_score, cs.created_at, cs.test_types,
//     ^^^^^^^                                                    ^^^^^^^^^^^^^  둘 다 없는 컬럼
       CASE WHEN cs.host_user_id=? THEN u2.nickname ELSE u1.nickname END AS partner_name
FROM couple_sessions cs
```

**핵심** — `code`·`test_types` 는 **뽑아만 놓고 이후 코드에서 한 번도 쓰이지 않는다.** 결과를 소비하는 L1233~L1257 은 `s.status`·`s.created_at`·`s.compatibility_score`·`s.partner_name` 네 개만 읽는다(전수 확인). 즉 **별칭으로 살릴 게 아니라 빼는 게 맞다.** 프론트도 조용하다 — `public/static/couple_hub.jsx:1534` 가 `.then(d => { if (d.success) … }).catch(() => {})` 라 500 이 와도 에러 없이 **빈 화면**이 된다.

**확인 방법**
```bash
grep -n "cs.code\|cs.test_types" package/maumcouple/src/index.tsx     # → 1212
grep -n "session_code\|test_type " maumful-main/migrations/0010_couple_sessions.sql   # → L3 · L6
npx wrangler d1 execute maumful-db --remote --command "PRAGMA table_info(couple_sessions)"   # code·test_types 없음을 실측
curl -s https://couple.maumful.com/api/couple/timeline -H "Authorization: Bearer $COUPLE_TOKEN" -o /dev/null -w "%{http_code}\n"   # → 500 재현
```

**구현 방법** — SELECT 목록을 `SELECT cs.status, cs.compatibility_score, cs.created_at, CASE WHEN … END AS partner_name` 으로 줄이고(두 컬럼 제거), 아래 제네릭 타입 선언(L1223-1226)에서도 `code: string;` 과 `test_types: string | null;` 을 지운다.
> 별칭(`cs.session_code AS code`)으로 살리는 2안도 동작은 하지만 **쓰지 않는 값을 응답 준비물로 남기고 `test_types`(복수형) 라는 잘못된 이름을 고착시킨다.** 1안을 권한다. 2안을 택했다면 보고서 §2 에 이유를 남겨라.

**검증 방법**
```bash
npx wrangler deploy --dry-run                      # TypeScript 에러 확인 (제네릭에서 지운 필드 잔존 여부)
curl -s https://couple.maumful.com/api/couple/timeline -H "Authorization: Bearer $COUPLE_TOKEN" | jq '.success, (.data|length), .data[0]|keys'
#   → true / N / ["date","emoji","score","subtitle","title","type"]
```
**렌더 검증(필수)** — 커플 허브 → 도구 탭 → "관계 타임라인" 진입 → 항목이 보이거나(기록 있음) 빈 상태 안내가 보인다. **마음커플에는 `render_smoke.cjs` 가 없다**(커플 설계서 §15-12) → 브라우저로 직접 확인.

**주의** — 응답 스키마(`type`·`date`·`title`·`subtitle`·`score`·`emoji`)는 **바꾸지 마라**. `couple_hub.jsx` 의 `typeStyle` 맵(L1542-1546)이 `report`/`session`/`checkin` 키에 그대로 의존한다. / **프론트를 안 고쳤으면 `npm run build:jsx` 는 불필요**하다. 고쳤다면 `compiled/couple_hub.js` 재생성·커밋 필수(안 하면 옛 번들이 나간다). / 마음커플은 `maumful-db` 를 쓴다 — **별도 DB 가 아니다.** 커밋 접두사는 `[maumcouple]`.

---

## 4. R-20 — `couple_sessions` 스키마 중복 정의 · 한 사본은 CHECK 누락

| 항목 | 내용 |
|---|---|
| 심각도 | S3 (지금 깨져 있진 않다. 새 DB 구축·수동 실행 시 조용히 갈라진다) |
| 대상 | `package/maumcouple/migrations/0001_couple_schema.sql:11` · `maumful-main/migrations/0010_couple_sessions.sql:1` · `package/D1_SQL_실행순서.sql:11` |
| 형제 서비스 | **`cts-maum-main/migrations/0010_couple_sessions.sql` — 마음풀 0010 과 바이트 단위로 동일한 4번째 사본**(RISKS 는 "3중"이라고 적었다 → 보고서 §3 전제 불일치) |
| 근거 | 커플 설계서 §6 L154 · §15-2(L375) · RISKS R-20 |

**무엇이 문제인가** — `couple_sessions` DDL 이 네 곳에 있고, 그중 `package/D1_SQL_실행순서.sql`(수동 콘솔 실행용 안내문) 사본만 **CHECK 제약 두 개가 빠져 있다.**
```sql
-- 정본 계열 (package/maumcouple/migrations/0001 L16-17, maumful 0010 L6-7)
test_type  TEXT NOT NULL DEFAULT 'BIG5+LOST+DSI'
           CHECK(test_type IN ('BIG5','LOST','DSI','BIG5+LOST','BIG5+DSI','LOST+DSI','BIG5+LOST+DSI')),
status     TEXT NOT NULL DEFAULT 'waiting'
           CHECK(status IN ('waiting','both_done','reported','expired')),

-- package/D1_SQL_실행순서.sql L16·L19 — CHECK 이 통째로 없다
test_type  TEXT    NOT NULL DEFAULT 'BIG5+LOST+DSI',
status     TEXT    NOT NULL DEFAULT 'waiting',
```
이 파일로 콘솔에서 만든 DB 는 **임의 문자열이 들어가는 테이블**이 된다. 인덱스도 하나 이름이 다르다(`idx_test_result` vs `idx_test_history_type`).

**확인 방법**
```bash
grep -rln "CREATE TABLE IF NOT EXISTS couple_sessions" --include=*.sql .   # → 4개 파일
diff maumful-main/migrations/0010_couple_sessions.sql cts-maum-main/migrations/0010_couple_sessions.sql   # → 차이 없음(4번째 사본)
grep -n "CHECK" package/D1_SQL_실행순서.sql                                 # → 0건
# ⚠️ 원격 실측 — 지금 운영 중인 테이블에 CHECK 이 실제로 붙어 있는가
npx wrangler d1 execute maumful-db --remote --command "SELECT sql FROM sqlite_master WHERE name='couple_sessions'"
```

**구현 방법** — **코드는 건드리지 않는다. 소유권을 정하고 문서로 못박는 것이 전부다.**
1. **정본 = `package/maumcouple/migrations/0001_couple_schema.sql`**(커플 설계서 §6 이 이미 *"마음커플 소유 테이블"* 이라고 적고 있다). 헤더에 *"이 파일이 `couple_sessions` 의 정본 DDL 이다"* 한 줄 추가.
2. 마음풀 `0010` · CTS `0010` — **내용 수정 금지**(이미 적용됨). 맨 위 주석 한 줄만: `-- ⚠️ 적용 완료(수정 금지). 정본 DDL 은 package/maumcouple/migrations/0001_couple_schema.sql 이다.`
3. `package/D1_SQL_실행순서.sql` — **적용 이력이 아니라 콘솔 실행 안내문이므로 고쳐도 된다.** STEP 2 DDL 을 정본과 동일하게(CHECK 2개 + 인덱스명 `idx_test_history_type`) 맞추고 상단에 *"신규 DB 구축용 아카이브. 운영 DB 에는 이미 적용됨 — 재실행 금지"* 추가.
4. 커플 설계서 §15-2 와 `_docs/RISKS.md` R-20 을 **"사본은 4개(CTS 포함)"** 로 정정.

**검증 방법**
```bash
# 세 '정본 계열' 파일의 CHECK 이 동일한지
grep -c "CHECK(" package/maumcouple/migrations/0001_couple_schema.sql maumful-main/migrations/0010_couple_sessions.sql package/D1_SQL_실행순서.sql   # → 모두 2
# 코드 변경이 없음을 확인 (이 이슈는 .sql·.md 만 건드린다)
git -C package/maumcouple status --short   # *.ts/*.tsx/*.jsx 가 나오면 범위를 넘은 것이다
```

**주의** — **원격 테이블에 CHECK 이 없다면, SQLite 는 CHECK 를 사후에 추가할 수 없다.** 붙이려면 테이블 재생성 + 데이터 이관이고, 이는 **데이터 삭제를 수반하는 마이그레이션 = BATCH_00 §2.2 "멈추고 물어볼 것"** 이다. **임의로 재생성하지 마라.** 실측 결과(CHECK 유무)를 보고서 §2 에 적고, 없으면 §6(사용자 확인 필요)에 올려라. 애플리케이션 쪽은 `test_type`/`status` 를 코드 상수로만 쓰고 있어 당장의 위험은 낮다. / `package/D1_SQL_실행순서.sql` 을 **다시 실행하지 마라** — `IF NOT EXISTS` 라 무해하지만 STEP 1 의 `ALTER TABLE test_history ADD COLUMN result_json` 은 duplicate column 에러를 낸다.

---

## 5. R-34 — CTS 마이그레이션 번호가 0015부터 갈라져 있다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 (되돌릴 수 없는 종류. 지금 상태를 정확히 **기록**하는 것이 조치다) |
| 대상 | `cts-maum-main/migrations/0015~0022` ↔ `maumful-main/migrations/0015~0029` |
| 형제 서비스 | — |
| 근거 | CTS 설계서 §6.4(L197-213, **매핑표가 이미 있다**) · RISKS R-34 |

**무엇이 문제인가** — 0014 까지는 파일명이 동일하지만 0015 부터 **같은 번호가 서로 다른 스키마를 뜻한다.**
| 번호 | CTS | 마음풀 | 내용 동일? |
|---|---|---|---|
| 0015 | `bible_verses` | `appointments_test_summary` | ✗ 완전히 다른 테이블 (0016 `ai_config`↔`test_history_source` 도 동일) |
| 0017·0018 | `test_history_source` · `add_ai_analysis` | `add_ai_analysis` · `partners` | CTS 0017·0018 = **마음풀 0016·0017 과 바이트 동일**(번호만 +1) |
| 0019·0020·0021·0022 | `partners`·`coupons`·`ai_feedback`·`notices` | `consent_columns`·`mood_logs`·`user_profile`·`coupons` | CTS 쪽은 각각 마음풀 **0018·0022·0023+0025 합본·0026** 에 대응(주석 차이만) |

전체 8행 매핑은 **CTS 설계서 §6.4(L201-212)에 이미 있다** — 새로 만들지 말고 그 표를 갱신해라.

**⛔ 파일 rename 은 금지다.** CTS `migrations/*.sql` 은 이미 `lightoflife-db` 원격에 적용됐다. 번호를 바꾸면 ① 이력이 끊기고 ② "적용했나?" 를 판단할 근거가 사라지며 ③ 파일명을 참조하는 문서(`CLAUDE.md` L49·L52, 설계서 §6.4·§15)가 전부 어긋난다. **과거는 고치는 게 아니라 기록하는 것이다.**

**확인 방법**
```bash
diff <(ls maumful-main/migrations/) <(ls cts-maum-main/migrations/)
for n in 0017_test_history_source:0016_test_history_source 0018_add_ai_analysis:0017_add_ai_analysis; do
  c=${n%%:*}; m=${n##*:}; diff -q cts-maum-main/migrations/$c.sql maumful-main/migrations/$m.sql; done   # → 동일
# 어느 번호까지 실제로 적용됐는지 (매핑표에 '적용 여부' 열을 채우기 위한 실측)
npx wrangler d1 execute lightoflife-db --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

**구현 방법** — 코드 0줄. 문서·주석 작업이다.
1. **번호 규칙 분리를 명문화** — `cts-maum-main/CLAUDE.md` 에 한 항목 추가:
   > **마이그레이션 번호는 CTS 자체 연번이다.** 다음 번호는 `0023`. **마음풀 번호를 따라가거나 맞추려 하지 마라** — 0015부터 갈라져 있어 같은 번호가 다른 스키마를 뜻한다(설계서 §6.4 매핑표). 마음풀 마이그레이션을 **번호로** CTS 에 복사하는 것은 금지. 내용을 옮길 땐 **CTS 다음 연번으로 새로 만들고 첫 줄 주석에 대응 마음풀 번호를 적는다.**
2. **주석 관행을 규칙으로 승격** — CTS `0021`·`0022` 가 이미 대응 마음풀 번호를 주석에 적고 있다 → 앞으로 모든 CTS 마이그레이션 첫 줄에 `-- 대응: 마음풀 00NN (또는 CTS 고유)` 필수.
3. **매핑표에 '적용 여부' 열 추가** — CTS 설계서 §6.4 표에 위 실측을 반영. 마지막 줄의 *"마음풀과 동일한 트래킹 트랩이 적용되는지는 ⚠️ 미확인"* 은 실측으로 교체하거나, 못 했으면 그대로 두고 보고서 §5 에 적어라.
4. **마음풀 쪽에도 한 줄** — `maumful-main/CLAUDE.md`: *"CTS 로 마이그레이션을 옮길 땐 번호를 따라가지 마라 — CTS 는 0015부터 번호가 갈라져 있다(CTS 설계서 §6.4)."*

**검증 방법**
```bash
grep -n "0015부터\|번호가 갈라\|CTS 자체 연번" cts-maum-main/CLAUDE.md maumful-main/CLAUDE.md   # 각 1건 이상
git -C cts-maum-main status --short   # migrations/ 아래에 rename(R)·수정(M)이 하나도 없어야 한다
```

**주의** — **잘못 손대면**: 파일을 rename 한 뒤 누군가 `d1 execute --file` 로 재적용을 시도하면 이미 있는 테이블에 `ALTER TABLE ADD COLUMN` 을 다시 걸어 **duplicate column 에러로 중간에 끊긴 채 반쯤 적용된 상태**가 된다 — 되돌릴 방법이 사실상 없다. / **CTS 는 유지보수 모드**(§1.5)지만 문서·주석 전용이라 허용 범위다. **겸사겸사 마이그레이션을 정리하거나 마음풀 스키마를 포팅하지 마라.** / **CTS 는 서브모듈**(§1.6) — 내부 커밋 → push → 부모 레포 포인터 커밋 → push.

---

## 6. R-51 — `payments` 테이블은 존재하지 않는다 (문서 정정)

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `maumful-main/docs/DESIGN.md:250` · **`시스템 설계서/01_마음풀_설계서.md:250`** · `maumful-main/SETUP.md:268` |
| 형제 서비스 | — |
| 근거 | `maumful-main/migrations/0004_b2c_migration.sql:8-10` · 마음풀 설계서 L512(이미 정확) · RISKS R-51 |

**무엇이 문제인가** — 설계서 §6 데이터 모델 표의 한 행이 `payments` 를 "레거시로 남아 있는 구스키마"처럼 적고 있다. 실제로는 **DROP 됐다.**
```sql
-- migrations/0004_b2c_migration.sql L7-10
-- ① 기존 B2B 테이블 제거
DROP TABLE IF EXISTS usage_history;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payments;   -- B2B 구조(user_phone FK) 제거, credit_charges 로 대체
```
현재 L250 원문은 `| `subscriptions` / `payments` / `usage_history` / `api_settings` / `schema_migrations` | 0001~0003 구스키마 | | 대부분 레거시… |` 인데 — **다섯 중 셋이 틀렸다.** `subscriptions`·`payments`·`usage_history` 는 0001 에서 만들어졌다가 **0004 L8-10 이 전부 DROP** 했다. 남은 건 `api_settings`(0003)와 `schema_migrations` 뿐이다. 같은 문서 L512 는 이미 정확히 적고 있어 **한 문서 안에서 서로 모순**이다.

**헷갈리지 말 것** — `/api/admin/payments`·`/api/admin/payments/:id/refund` 는 **라우트 이름**이지 테이블이 아니다. 핸들러(`src/index.tsx:4498`)는 `FROM credit_charges` 를 조회하고 응답 키만 `payments` 다. **라우트명·응답 키는 바꾸지 마라**(어드민 프론트가 읽는다).

**확인 방법**
```bash
grep -rn "CREATE TABLE IF NOT EXISTS payments" maumful-main/migrations/   # → 0001_initial_schema.sql:41 뿐
grep -n "DROP TABLE" maumful-main/migrations/0004_b2c_migration.sql       # → L8·L9·L10
grep -n "FROM payments\|INTO payments\|UPDATE payments" maumful-main/src/index.tsx   # → 0건
npx wrangler d1 execute maumful-db --remote --command \
 "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('payments','subscriptions','usage_history','api_settings','schema_migrations')"
#   → 실측 결과를 그대로 문서에 반영한다. 추측으로 쓰지 마라.
```

**구현 방법**
1. `maumful-main/docs/DESIGN.md:250` 을 실측 결과로 교체. 초안(쿼리가 `api_settings`·`schema_migrations` 만 돌려줬을 때):
   ```markdown
   | `api_settings` / `schema_migrations` | 0001~0003 구스키마 잔존분 | | `api_settings` 만 어드민 API 설정에서 사용 |
   | ~~`subscriptions`~~ / ~~`payments`~~ / ~~`usage_history`~~ | **존재하지 않음** | | 0001 생성 → **0004 L8-10 이 DROP**. `payments`→`credit_charges`, 구독은 `user_subscriptions`(0007) 가 대체 |
   ```
2. **`시스템 설계서/01_마음풀_설계서.md:250` 도 동일하게.** ⚠️ 두 파일은 내용이 같지만 **별개 파일(inode 다름)** 이다 — 한쪽만 고치면 다음 사람이 낡은 쪽을 읽는다.
3. `maumful-main/SETUP.md:268` 의 설명을 `결제 내역 (credit_charges 조회 — payments 테이블은 없다)` 로.
4. 두 설계서의 **개정 이력에 한 줄**(§1.10) + `_docs/RISKS.md` R-51 해소 표기.

**검증 방법**
```bash
diff maumful-main/docs/DESIGN.md "시스템 설계서/01_마음풀_설계서.md"   # → 차이 없음(두 사본을 똑같이 고쳤는가)
grep -n "payments" maumful-main/docs/DESIGN.md | grep -v "tosspayments\|v1/payments\|api/admin/payments\|api/payment"
#   → 남는 줄은 "존재하지 않는다"고 말하는 줄들뿐이어야 한다 (L512 포함)
curl -s "https://maumful.com/api/admin/payments?page=1" -H "Authorization: Bearer $ADMIN_SECRET" | jq '.success, (.data.payments|length)'
#   → true / N  (응답 키 `payments` 가 그대로인지 = 무영향 확인)
```

**주의** — **문서만 고친다. 코드·라우트·응답 키는 그대로.** `data.payments` 키를 "정확하게" 바꾸고 싶어지겠지만 어드민 프론트가 읽는다 → 건드리지 마라. / `SETUP.md` 는 낡은 문서다 — 이 한 줄만 고치고 전면 개정으로 번지지 마라(§0.4). / **원격 실측 없이 위 초안을 그대로 붙여넣지 마라** — `subscriptions` 가 다른 경위로 되살아나 있을 수도 있다. 확인 안 된 것은 "현장에서 확인할 것"(BATCH_00 §2.1). / 이 이슈는 스키마를 바꾸지 않으므로 DB 적용도 배포도 없다.

---

## 7. 완료 기준 체크리스트 (BATCH_00 §4 에 더해)

- [ ] **R-03** — 원격 실측 결과(테이블 유무·행 수)를 기록 / 분기 A·B 중 어느 쪽이었는지 명시 / `0030_*.sql` 이 레포에 있음 / **로컬 → 원격 순서로** 적용 / `PRAGMA table_info` 출력 첨부 / 적립 누락 후보 건수·금액을 §4 에 기록 / **소급 적립은 하지 않았다** / `.catch(() => {})` 3곳(L1253·L3719·L4561)에 로그 추가 + 여전히 비차단임 확인
- [ ] **R-07** — `external_orders` 를 **수달·곁 두 DB 각각**에 / `email_verified` 는 **`maum-auth` 에 한 번만** / `maum-auth-schema.sql` 3장에 ALTER 기록 / `/api/auth/me` 로 무영향 확인 / **그랜드파더링 여부를 사용자에게 물었다**(§6)
- [ ] **R-06** — 두 컬럼 제거 + 타입 선언 동반 수정 / `deploy --dry-run` 통과 / 타임라인 화면을 **브라우저로 직접** 확인 / 응답 키 6개 불변
- [ ] **R-20** — 원격 CHECK 유무 실측 / 정본 지정 + 나머지 3사본에 주석 / `D1_SQL_실행순서.sql` CHECK 2개 복원 / **테이블 재생성은 하지 않았다** / 사본 4개(CTS 포함)로 정정
- [ ] **R-34** — CTS `migrations/` 에 **rename·수정 0건** / 번호 규칙을 CTS·마음풀 `CLAUDE.md` 양쪽에 기재 / 매핑표에 적용 여부 기입(또는 사유) / 서브모듈 커밋 순서 준수
- [ ] **R-51** — `docs/DESIGN.md` 와 `시스템 설계서/01_…` **두 사본을 똑같이** / 원격 실측 근거로 작성 / 코드·라우트·응답 키 불변
- [ ] 서비스별 커밋 분리(`[maumful]`·`[maumotter]`·`[maumgyeot]`·`[maumcouple]`·`[cts]`·`[공통]`) / 각 `docs/DESIGN.md` §6·§15 와 `_docs/RISKS.md` 갱신 + 개정 이력 한 줄 / **원격 DB 를 실측 못 한 항목은 못 했다고 썼다**(BATCH_00 §3.2-4)

---

## 8. 결과 보고서

**`_docs/작업지시서/결과/BATCH_03_결과.md`** 에 **BATCH_00 §3.1 템플릿 그대로** 작성하고 `[공통]` 커밋으로 함께 올린다. 이 배치에서 특히 비우면 안 되는 칸:

- **§2 상세** — 이슈마다 **원격 실측 명령의 실제 출력**(`PRAGMA table_info` / `SELECT sql FROM sqlite_master` / 행 수)을 붙여라. 스키마 작업의 검증은 이 출력이 전부다.
- **§3 전제 불일치** — 알려진 후보: ① 원격에 `partner_commissions` 가 **이미 있을 수 있다**(R-03 분기 B) ② RISKS R-20 은 "3중"이라 적었지만 **CTS 포함 4중** ③ 마음풀 `CLAUDE.md` L280 의 *"영문 DDL만"* 과 0029 의 한글 주석이 모순 ④ `docs/DESIGN.md` L250 과 L512 가 서로 모순.
- **§4 새로 발견** — 적립 누락 후보 건수·금액, `couple_sessions` CHECK 실측 결과.
- **§5 미착수** — 원격 DB 접근이 안 돼 멈춘 항목은 **"원격 DB 확인이 필요하다"** 로 명시.
- **§6 사용자 확인** — 최소 2건이 올라와야 정상이다: ① `email_verified` **기존 회원 그랜드파더링 여부** ② `couple_sessions` 에 CHECK 이 없을 때 **테이블 재생성 여부**. R-03 의 **소급 적립 여부**가 더해질 수 있다.

> **BATCH_02 작업자가 이 보고서의 §2(R-03·R-07 실측 결과)를 읽는다.** 테이블이 있었는지 없었는지, 행이 몇 개인지를 **숫자로** 남겨라.
