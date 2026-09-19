# BATCH_06 — 정리 (17건) · 마지막 배치

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **근거**: 2026-09-19 코드 직접 열람 + `_docs/RISKS.md` + 각 서비스 `docs/DESIGN.md` §15
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

---

## 0. 배치 개요

이 배치는 성격이 다른 세 묶음이다. **C군을 먼저 처리해라** — A·B군은 각각 10~40분짜리 정리 작업이지만, C군은 배포 파이프라인과 결제 진입점에 관한 것이다.

### A군 — 코드 정리 (7건)

| ID | 제목 | 심각도 | 대상 | 형제 서비스 |
|---|---|---|---|---|
| R-14 | `/api/config/region` 이 죽은 가격표를 노출 | S3 | 마음풀 | CTS(값 일치 — **손대지 마라**) |
| R-15 | `handleDailyReminder` 가 cron 미연결 | S3 | 마음풀 | CTS(동일 구조·동일 상태) |
| R-30 | face-api.js 가중치 `@master` 미고정 | S2 | 마음수달 | 마음곁(0건) |
| R-49 | `GOOGLE_CLIENT_ID` 평문 + 네이버 콜백 폴백 도메인 | S3 | CTS | — |
| R-52 | 검사 문항 수 4중 수동 관리 | S3 | 마음풀 | — |
| R-53 | 마스터 `allTests` 가 8종(RIASEC·VALUES 누락) | S3 | 마음게임 | **CTS 게임은 정답 — 복사 금지** |
| R-56 | 휴면 어드민 `setView('counselingAdmin')` 죽은 분기 | S3 | 마음풀 | — |

### B군 — 문서 정정 (7건)

| ID | 제목 | 대상 문서 | 코드 수정 |
|---|---|---|---|
| R-29 | TTS 스펙 불일치(모델·음색) | `maumotter/CLAUDE.md` L120 | 없음 |
| R-31 | 통합결제 "착수 대기" ↔ 이미 배포·판매 중 | **루트 `CLAUDE.md` L86~L87** | 없음 · **사용자 확인 필수** |
| R-32 | 세 번째 워커 `lightoflife-couple` 미기재 | `cts-maum-main/HANDOVER.md` | 없음(CTS 문서 수정) |
| R-16 | phyweb 상품 6종 문서 누락 | `maumful-main/CLAUDE.md` L271~L275 | 없음 |
| R-54 | "마음커플 Plus ₩9,900"은 결제가 아닌 대기자 등록 | 커플 설계서 · `maumful-main/CLAUDE.md` | 없음 |
| R-55 | 통합결제 원문에 "세대" 누락 | **루트 `CLAUDE.md` L87** | 없음 · **R-31과 한 번에** |
| R-35 | cron 프로덕션 주석 / 스테이징 활성 | `cts-maum-main/wrangler*.toml` | **설정 수정 있음** |

### C군 — 운영 체계 (3건)

| ID | 제목 | 심각도 | 대상 |
|---|---|---|---|
| **R-33** | **CI가 push마다 배포하면서 `build:jsx` 를 돌리지 않는다** | **S2** | CTS + **루트 레포(마음풀·마음커플)** |
| R-17 | CTS 가격이 크레딧 단조감소 규칙 위반 | S2 | CTS |
| R-36 | 전 서비스 테스트·CI 부재, 롤백 절차 미정의 | S2 | 전 서비스(최소 실행안만) |

**예상 작업량** — C군 하루(R-33 반나절·R-17 2시간·R-36 반나절) / A군 반나절 / B군 2~3시간. **R-17·R-31·R-53·R-55·R-56 은 사용자 확인 대기 항목이 있다. 기다리느라 나머지를 멈추지 마라.**

**선행조건** — ① `gh auth status` → `youngjun1603` 활성(§1.8) ② `cts-maum-main/` 은 **서브모듈**(커밋 순서 §1.6) ③ 프론트(`.jsx`)를 고치면 **반드시 `npm run build:jsx`** 후 `compiled/*.js` 를 함께 커밋 — 이 배치의 R-33이 바로 그 이야기다 ④ **작업 시작 전 `git status` 확인.** 2026-09-19 시점 루트 레포에 76개 파일이 `M` 으로 떠 있었으나 `git diff --ignore-all-space` 는 전부 비어 있었다 = **CRLF 줄바꿈 차이뿐**이다. 실제 변경으로 오인해 커밋하면 리뷰가 불가능해진다.

### ⚠️ 설계서 이중 사본 — 문서를 고치기 전에 반드시 읽어라

`maum/시스템 설계서/` 폴더에 **각 설계서의 바이트 단위 동일 사본 11개**가 있다. **심링크가 아니라 별개의 일반 파일**이고, **git 에 추적되지 않는다**(`git ls-files "시스템 설계서/"` → 0건).

| 사본 (`시스템 설계서/`) | 정본 |
|---|---|
| `00_리스크등록부.md` | `_docs/RISKS.md` |
| `00_전체인덱스.md` | `_docs/README.md` |
| `01_마음풀_설계서.md` | `maumful-main/docs/DESIGN.md` |
| `02_마음게임_설계서.md` | `maumgame-main/docs/DESIGN.md` |
| `03_마음커플_설계서.md` | `package/maumcouple/docs/DESIGN.md` |
| `04_마음부부_설계서.md` | `maumbubu/docs/DESIGN.md` |
| `05_마음세대_설계서.md` | `maumsedae/docs/DESIGN.md` |
| `06_마음수달_설계서.md` | `maumotter/docs/DESIGN.md` |
| `07_마음곁_설계서.md` | `maumgyeot/docs/DESIGN.md` |
| `08_CTS본체_설계서.md` | `cts-maum-main/docs/DESIGN.md` |
| `09_CTS게임_설계서.md` | `cts-game-main/docs/DESIGN.md` |

**규칙**: 정본만 고친다(git 추적 대상). **사본을 고치면 커밋되지 않고 사라진다.** 정본을 고친 뒤 사본 동기화 여부는 **사용자에게 물어라** — 폴더 자체를 없앨지 유지할지는 판단이 필요하다.

```bash
cd ~/maum && git ls-files "시스템 설계서/" | wc -l     # 0 = 추적 안 됨
diff -q "시스템 설계서/01_마음풀_설계서.md" maumful-main/docs/DESIGN.md
```

### ⚠️ R-33 은 문서가 적은 것보다 범위가 넓다 — §0 경고

리스크 등록부는 R-33을 **CTS만의 문제**로 적었다. 실제로는 **루트 레포도 같다**:

| 워크플로 | 트리거 | 배포 | `build:jsx` |
|---|---|---|---|
| `cts-maum-main/.github/workflows/deploy.yml` L4~L6, L25~L26 | push→main | `npx wrangler deploy` | **없음** |
| `.github/workflows/deploy-production.yml` L4~L5, L22~L29 (마음풀) | push→main | `wrangler-action` `command: deploy` | **없음** |
| 같은 파일 L46~L53 (마음커플) | push→main | 동일 | **없음** |
| `.github/workflows/deploy-staging.yml` L4~L5, L14~L20 / L28~L34 | push→dev | 동일 | **없음** |

세 워커 모두 HTML이 **컴파일 산출물만** 참조한다 — CTS `src/index.tsx` L3078~L3082, 마음풀 `src/index.tsx` L4857·L4881·L5013~L5016, 마음커플 `src/index.tsx` L287. 즉 `.jsx` 만 커밋·push 하면 **CI는 옛 번들을 배포하고 성공으로 보고한다.** 마음풀은 `build:css`(Tailwind 정적 빌드)까지 빠진다.

**다만 2026-09-19 현재 실제 드리프트는 발견되지 않았다** — 확인 결과는 R-33 본문에 있다. 지금까지 사람이 로컬에서 `npm run deploy`(= `build:jsx && wrangler deploy`)를 돌린 뒤 커밋해 온 규율로 버텨 온 것이고, **CI는 그 규율을 강제하지 않는다.** 심각도를 S3→**S2** 로 올린다.

### 손대지 말 것

- **가격 숫자 자체**(R-17·R-14) — 코드로는 진입 차단만, 재조정은 사용자 판단(§2.2)
- **CTS 기능 개선**(§1.5) — 이 배치의 CTS 항목 중 R-17·R-33·R-35·R-49 는 **버그·안전 수정이라 허용 범위**, R-32 는 **문서 수정**이다. 그 외를 얹지 마라
- **CTS 게임 `allTests`**(R-53) — CTS 본체는 검사가 8종뿐이라 지금이 정답이다
- **`weekly_reports`·번아웃 metadata 키**(BATCH_05) · **`partner_commissions` DDL**(BATCH_03)
- **`시스템 설계서/` 폴더의 사본 파일** — 위 경고 참조

---

## 1. C군 — 운영 체계 (먼저 처리)

### [R-33] CI가 push마다 배포하면서 JSX를 빌드하지 않는다

| 항목 | 내용 |
|---|---|
| 심각도 | **S2** (등록부 표기에서 상향 — 위 §0 참조) |
| 대상 | `cts-maum-main/.github/workflows/deploy.yml:25-26` · `.github/workflows/deploy-production.yml:22-29,46-53` · `.github/workflows/deploy-staging.yml:14-20,28-34` |
| 형제 서비스 | 마음게임·CTS 게임은 워크플로 자체가 없다(수동 배포) — 이번 범위 밖 |
| 근거 | CTS 설계서 §15-10 |

**무엇이 문제인가** — 세 워크플로 모두 `build:jsx` 없이 곧바로 배포한다. CTS 원문(`deploy.yml` L22~L29):
```yaml
      - name: Install dependencies
        run: npm install
      - name: Deploy to Cloudflare Workers
        run: npx wrangler deploy          # ← build:jsx 없음
```
`package.json` 의 `deploy` 스크립트는 `"npm run build:jsx && wrangler deploy"` 인데, CI는 그 스크립트를 쓰지 않고 `wrangler deploy` 만 직접 호출한다. 마음풀도 같다(`deploy` = `npm run build:assets && wrangler deploy`, CI는 `command: deploy`).

**확인 방법** — 소스와 컴파일 산출물의 **커밋 시점**을 비교하는 것이 mtime보다 확실하다(체크아웃이 mtime을 덮어쓴다). 둘 다 실행해라.

```bash
# ① 커밋 시점 비교 — jsx 와 js 의 마지막 커밋이 같아야 정상
cd ~/maum/cts-maum-main
for f in app landing counseling counseling_admin; do
  echo "$f"
  echo "  jsx: $(git log -1 --format='%h %ad' --date=short -- public/static/$f.jsx)"
  echo "  js : $(git log -1 --format='%h %ad' --date=short -- public/static/compiled/$f.js)"
done

# ② mtime 비교 (작업 트리 기준 — 로컬 편집 후 빌드를 잊었는지 잡는다)
ls -l --time-style='+%F %T' public/static/*.jsx public/static/compiled/*.js

# ③ jsx 만 고치고 compiled 를 빠뜨린 과거 커밋 전수 조사
for c in $(git log --format=%H -- public/static/); do
  files=$(git show --name-only --format="" $c)
  j=$(echo "$files" | grep -c 'public/static/[a-z_]*\.jsx')
  k=$(echo "$files" | grep -c 'public/static/compiled/')
  [ "$j" -gt 0 ] && [ "$k" -eq 0 ] && git log -1 --format='누락 %h %ad %s' --date=short $c
done

# 루트 레포도 동일하게(경로만 maumful-main/public/static, package/maumcouple/public/static)
```

**2026-09-19 실측 결과 (전제로 삼아도 되는 사실)** — CTS 4개 소스 모두 `.jsx` 와 `compiled/*.js` 의 마지막 커밋이 **동일**(app=`d46312b`, landing=`c6430e9`, counseling=`e2ebae2`, counseling_admin=`ddddaeb`)하고, `d46312b` 가 넣은 `isTouch` 가 `compiled/app.js` 에도 있다(`grep -c isTouch` → 2). 과거 누락 커밋 8건은 **전부 2026-05 이전**(최근 `6ad8637`)이며 이후 재생성으로 해소됐다. 마음풀은 최근 20개 static 커밋 중 누락 0건.
→ **현 시점 산출물 드리프트는 없다.** 문제는 "지금 어긋나 있다"가 아니라 **"어긋나도 CI가 잡지 못한다"** 이다.

**구현 방법**
1. **CTS** `deploy.yml` — `npx wrangler deploy` 앞에 빌드 스텝을 넣고, **빌드 후 작업 트리가 더러워지면 실패**시킨다(= 커밋된 번들이 소스와 다르다는 뜻).
   ```yaml
      - name: Build JSX
        run: npm run build:jsx
      - name: Fail if compiled output is stale
        run: git diff --exit-code -- public/static/compiled/
      - name: Deploy to Cloudflare Workers
        run: npx wrangler deploy
   ```
2. **루트** `deploy-production.yml` — `deploy-maumful` 잡의 `npm ci` 다음에 `npm run build:assets`(jsx+css) + 같은 `git diff --exit-code` 가드. `deploy-maumcouple` 잡은 `npm ci` 스텝이 없으므로 **먼저 추가**한 뒤 `npm run build:jsx` + 가드.
3. **`deploy-staging.yml`** 도 동일(checkout만 하고 의존성 설치조차 없다 — `actions/setup-node` + `npm ci` 부터 필요).
4. `--outdir` 은 esbuild가 기존 파일을 지우지 않으므로 목록 밖 파일(`compiled/cts_bible_en.js` — 대응 `.jsx` 소스가 없다)은 보존된다. **`cts_bible_en.js` 를 삭제하거나 outdir을 청소하지 마라.**

**검증 방법**
```bash
# 로컬에서 CI와 같은 순서를 재현 — 마지막 명령이 조용히 끝나야 한다
cd ~/maum/cts-maum-main && npm ci && npm run build:jsx && git diff --exit-code -- public/static/compiled/ && echo OK
cd ~/maum/maumful-main   && npm ci && npm run build:assets && git diff --exit-code -- public/static/ && echo OK
```
- 일부러 `.jsx` 에 주석 한 줄을 넣고 **빌드 없이** push → 워크플로가 `git diff --exit-code` 에서 **실패**해야 한다(그 뒤 원복).
- 정상 경로: 빌드 후 커밋 → push → 워크플로 성공 → 배포된 페이지에서 바뀐 부분이 실제로 보이는지 확인.

**주의** — `git diff --exit-code` 가드는 esbuild 버전이 바뀌면 산출물 차이로 오탐할 수 있다. `package-lock.json` 의 esbuild 버전을 고정한 상태로만 쓸 것. / CTS는 서브모듈이라 워크플로 수정도 서브모듈 커밋 → 부모 포인터 커밋 순서(§1.6). / **이 워크플로들은 push 즉시 프로덕션에 나간다.** 수정 자체를 테스트하려면 먼저 dev 브랜치로 해라.

### [R-17] CTS 가격이 크레딧 단조감소 규칙을 어기고, API 직접 호출로 구매 가능하다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `cts-maum-main/src/index.tsx:1587-1602`(PACKAGES) · `:1874-1893`(toss) · `:1998-2002`(stripe) · `:2161-2170`(prepare-charge) |
| 형제 서비스 | 마음풀은 곡선 정합이 이미 잡혀 있다(루트 `maumful-main/CLAUDE.md` L193~L198) — 다만 화이트리스트 부재는 동일하니 **확인만** 하고 고치지 마라 |
| 근거 | CTS 설계서 §15-3 |

**무엇이 문제인가** — `PACKAGES`(L1587) 단가를 크레딧당으로 환산하면:

| 키 | 크레딧 / 금액 | 원/cr | 프론트 노출 |
|---|---|---|---|
| `ai_10` (L1599) | 50 / ₩1,000 | **20** | O |
| `allinone` (L1601) | 62 / ₩2,000 | 32.3 | O |
| `test_one` (L1598) | 10 / ₩1,000 | 100 | O |
| `starter_kr`~`pro_kr` (L1588~L1591) | 50~700 / ₩2,900~24,900 | 58·49·43·35.6 | **X** |

`ai_10` 하나가 나머지 전부를 지배한다. 충전팩 4종은 프론트(`app.jsx` L4557~L4568 `PACKAGES_KR`)에 없지만, 결제 진입점 3곳이 **`PACKAGES` 의 모든 키를 그대로 받는다**. 원문(L1882~L1884):
```ts
  const { packageKey } = await c.req.json()
  const pkg = PACKAGES[packageKey]
  if (!pkg) return c.json({ success: false, error: '잘못된 패키지' }, 400)   // ← 존재 여부만 본다
```

**⚠️ 더 심각한 것 — 통화 불일치**: 같은 라우트 L1893이 통화를 **`'KRW'` 로 하드코딩**한다.
```ts
  ).bind(userId, packageKey, pkg.credits, pkg.amount, 'KRW', 'toss').run()
```
`starter_g`(L1592)는 **USD 센트 단위 `amount: 299`** 다. 토스 체크아웃에 `starter_g` 를 넣으면 **₩299에 50크레딧**(0.6원/cr)이 청구된다. `pro_g`(L1595)는 ₩2,499에 700크레딧(3.6원/cr). `ai_10` 보다 훨씬 크다. **이 건은 리스크 등록부에 없다 — 보고서 §4에 반드시 기록해라.**

**확인 방법**
```bash
cd ~/maum/cts-maum-main
grep -n "PACKAGES\[packageKey\]" src/index.tsx          # 1883 · 2002 · 2166 (+ 웹훅 1762 · 1844)
grep -n "'KRW', 'toss'\|'USD', 'stripe'" src/index.tsx  # 통화 하드코딩 위치
# 실제 재현(스테이징에서만!) — 로그인 토큰 필요
curl -s -X POST https://lightoflife-dev.<계정>.workers.dev/api/credits/prepare-charge \
  -H "Authorization: Bearer $CTS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"packageKey":"starter_g","pg":"toss"}'
#   → {"success":true,"data":{"credits":50,"amount":299}} 이면 재현
```

**구현 방법 — 코드로는 "진입 차단"만 한다. 가격 재조정은 손대지 마라(BATCH_00 §2.2).**
1. `PACKAGES` 항목에 노출 채널을 나타내는 필드를 추가한다(기존 `product?: boolean` 옆에). 예: `region?: 'KR' | 'GLOBAL'`. 값 자체는 바꾸지 않는다.
2. 체크아웃 3곳에 **화이트리스트 가드**를 넣는다.
   - `POST /api/payment/toss/checkout`(L1874): `if (pkg.region !== 'KR') return c.json({ success:false, error:'잘못된 패키지' }, 400)`
   - `POST /api/payment/stripe/checkout`(L1998): `if (pkg.region !== 'GLOBAL') …`
   - `POST /api/credits/prepare-charge`(L2161): `pg` 값과 `pkg.region` 이 맞는지 검증
3. **웹훅(L1762·L1844)에는 가드를 넣지 마라.** 이미 성공한 결제를 거부하면 돈은 빠져나가고 크레딧은 안 들어간다.
4. `starter_kr`~`pro_kr` 4종은 프론트에 없고 지배당한 죽은 상품이다. **삭제하지 말고** region 가드로 막은 뒤, 제거 여부를 사용자에게 물어라(과거 결제 이력의 `credit_charges.package_key` 역참조 L1962·L3163가 깨질 수 있다).

**검증 방법**
```bash
# 정상 상품은 그대로 통과
curl -s -X POST .../api/credits/prepare-charge -H "Authorization: Bearer $CTS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"packageKey":"ai_10","pg":"toss"}'      # → 200
# 교차 통화·미노출 상품은 차단
for k in starter_g pro_g starter_kr pro_kr; do
  echo -n "$k: "; curl -s -o /dev/null -w "%{http_code}\n" -X POST .../api/credits/prepare-charge \
    -H "Authorization: Bearer $CTS_TOKEN" -H 'Content-Type: application/json' -d "{\"packageKey\":\"$k\",\"pg\":\"toss\"}"
done   # → 전부 400
```
- 기존 동작 무영향: 프론트 충전 화면에서 KR 4종·GLOBAL 4종을 각각 **실제로 한 번씩 결제 흐름에 태워** 200이 나오는지 확인(테스트키).

**사용자 확인 필요** — ① `ai_10` 단가를 조정할 것인가(곡선 정합) ② 충전팩 4종을 유지·노출·삭제 중 무엇으로 할 것인가 ③ `PAYMENT_LIVE` 전환 시점. **셋 다 가격·상품 구성 변경이므로 임의로 결정하지 마라.**

**주의** — CTS는 유지보수 모드지만 **이건 부당 청구를 막는 안전 수정이라 허용 범위**다(§1.5). 결제 UI·상품 구성을 "겸사겸사" 손보지 마라.

### [R-36] 테스트·CI 부재, 롤백 절차 미정의 — **최소 실행안만**

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | 전 서비스 |
| 근거 | 등록부 R-36 |

**현재 상태 (실측)** — 워크플로는 마음풀 `lint.yml`(eslint)·CTS `lint.yml`+`deploy.yml` 뿐이고 **나머지 6개 서비스는 0개**. 테스트 프레임워크 **0**(`"test": "curl http://localhost:3000"`). `scripts/render_smoke.cjs` 가 마음풀·마음부부·마음세대 3곳에 있으나 **어느 `package.json` 에도 등록돼 있지 않다**(`grep -n smoke package.json` → 0건). `tsc --noEmit` 은 CI·스크립트 어디에도 없다. 롤백 절차 문서 없음.

**최소 실행안 — 마음풀 한 곳에만, 3가지.** 전 서비스 도입은 범위가 크므로 여기서는 하지 않는다.

1. **`package.json` 에 두 스크립트 등록**(새 의존성 0개 — 둘 다 이미 있는 것을 부르기만 한다)
   ```json
   "typecheck": "tsc --noEmit",
   "smoke": "node scripts/render_smoke.cjs public/static/compiled/landing.js && node scripts/render_smoke.cjs public/static/compiled/partner_entry.js"
   ```
   - `app.js` 는 넣지 마라. 스크립트 머리말이 *"거대한 단일 컴포넌트(예: app.js의 PsychologicalTestSystem)는 stub 한계로 오탐 가능"* 이라고 명시한다.
2. **`maumful-main/.github/workflows/lint.yml` 에 두 스텝 추가** — `Run ESLint` 다음에 `npm run typecheck`, `npm run build:assets`, `npm run smoke`. **배포 워크플로가 아니라 lint 워크플로에 넣어라**(PR에서도 돈다).
3. **롤백 절차 1장** — `maumful-main/DEPLOY_CHECKLIST.md` 에 섹션 추가. 명령은 실제로 한 번 돌려 보고 적어라.
   ```bash
   npx wrangler deployments list --name maumful          # 배포 ID 확인
   npx wrangler rollback <deployment-id> --name maumful  # 되돌리기(포그라운드)
   ```
   D1 마이그레이션은 롤백되지 않는다는 점, 원격 마이그레이션 트래킹이 비어 있다는 점(마음풀 설계서 §15-6)을 함께 적을 것.

**검증 방법**
```bash
cd ~/maum/maumful-main
npm run typecheck                 # 에러 0 (에러가 나오면 고치지 말고 보고서 §4에 기록)
npm run build:assets && npm run smoke   # 두 파일 모두 통과
```
- `landing.jsx` 에 일부러 정의 안 된 식별자를 넣고 `build:assets && smoke` → **실패**해야 한다(그 뒤 원복).
- 기존 동작 무영향: 스크립트 추가·워크플로 스텝 추가뿐, 런타임 코드는 건드리지 않는다.

**사용자 확인 필요** — 확장 여부. 선택지: (a) 마음풀만 유지 (b) 렌더 스모크가 이미 있는 마음부부·마음세대까지 확대 (c) 8개 서비스 전부 + 배포 워크플로 신설. **(b)·(c)는 이 배치 범위 밖이다.**

**주의** — `tsc --noEmit` 이 기존 코드에서 대량의 에러를 뱉으면 **코드를 고치지 말고** 보고서 §4·§6에 건수와 대표 사례를 적고 멈춰라. 6,725줄 단일 파일의 타입 정리는 별도 작업이다.

---

## 2. A군 — 코드 정리 (7건)

> 각 건은 짧다. **"확인 → 구현 → 검증" 3단계를 생략하지 마라.**

### [R-14] `/api/config/region` 의 죽은 가격표

| 항목 | 내용 |
|---|---|
| 대상 | `maumful-main/src/index.tsx:302`(라우트) · `:320-336`(creditPrices) |
| 실제 가격 | 같은 파일 `:3119-3122` — `starter_kr` ₩4,900 · `standard_kr` ₩9,900 · `premium_kr` ₩15,000 · `pro_kr` ₩25,000 |
| 노출 중인 죽은 값 | ₩2,900 / ₩5,900 / ₩12,900 / ₩24,900 |
| 형제 서비스 | **CTS `src/index.tsx:313-325` 는 자기 `PACKAGES`(L1588~L1591)와 값이 일치한다 → 고치지 마라** |
| 근거 | 마음풀 설계서 §15-3 |

- **확인**: `grep -rn "creditPrices" maumful-main/src maumful-main/public/static/` → **`src/index.tsx:320` 1건뿐**(소비처 0). `curl -s https://maumful.com/api/config/region | jq .creditPrices` 로 실제 노출 재현.
- **구현**: `creditPrices` 키를 **응답에서 삭제**한다(L320~L336). 남겨야 한다면 `PACKAGES` 에서 파생시켜라 — 하드코딩 복제를 다시 만들지 마라. 응답 스키마가 바뀌므로 §1.2에 따라 프론트 전 파일 grep 0건을 **삭제 직전에 한 번 더** 확인한다.
- **검증**: `curl -s .../api/config/region | jq 'has("creditPrices")'` → `false`. 다른 키(`availableTests`·`pg`·`currency`·`crisisLine`)는 그대로. 충전 화면(`ChargeView`)이 정상 렌더되는지 렌더 검증.

### [R-15] `handleDailyReminder` 가 cron 에 연결되지 않았다

| 항목 | 내용 |
|---|---|
| 대상 | `maumful-main/src/index.tsx:6279`(함수) · `:6691-6697`(수동 트리거) · `:6721-6725`(scheduled) · `wrangler.toml:21-22` |
| 형제 서비스 | CTS `src/index.tsx:4730`·`4764-4766` — **완전히 동일한 상태**. 다만 CTS는 프로덕션 cron 자체가 주석이라 R-35와 함께 판단 |
| 근거 | 마음풀 설계서 §15-7 |

- **확인**: `grep -n "handleDailyReminder\|handleScheduled\|async scheduled" maumful-main/src/index.tsx` → 6279 · 6205 · 6695 · 6722. `scheduled` 는 **`handleScheduled` 만** 부른다(L6723). `wrangler.toml` L22 `crons = ["0 0 1 * *"]` = **월 1회**.
- **⚠️ 함정**: 함수 이름은 `Daily` 지만 조건은 *"PHQ9/GAD7을 42일 이상 안 본 사용자"*(L6284~L6299)다. **매일 도는 cron 을 그대로 붙이면 사용자가 검사할 때까지 매일 푸시가 간다.** 중복 억제가 없다.
- **구현**: ① `handleDailyReminder` 에 KV 발송 마커(`reminder_sent:{userId}` · TTL 30~42일)를 추가해 멱등화하고 ② `wrangler.toml` 에 주 1회 cron(예: `"0 0 * * 1"`)을 **추가**한 뒤 ③ `scheduled` 에서 `event.cron` 값으로 분기해 월간=`handleScheduled`, 주간=`handleDailyReminder` 로 보낸다(현재 시그니처가 `_event` 로 버리고 있다 — L6722).
- **검증**: `npx wrangler dev` + `curl -X POST .../__scheduled?cron=0+0+*+*+1` 로 스케줄 경로를 직접 태우고, 같은 사용자에게 두 번째 실행에서 푸시가 **안 가는지** 확인. 수동 트리거(`POST /api/admin/push/reminder`)가 그대로 동작하는지도 확인.
- **사용자 확인 필요**: 푸시 발송 주기(매일/주 1회/월 1회)와 문구는 **사용자에게 보이는 동작**이다(§2.2). 무료 플랜 cron 개수 제한(CTS `wrangler.toml` L28 주석 *"cron 5개 무료 제한"*)도 현장에서 확인할 것.

### [R-30] face-api.js 가중치가 `@master` 로 고정 없이 로드된다

| 항목 | 내용 |
|---|---|
| 대상 | `maumotter/public/index.html:121` |
| 형제 서비스 | 마음곁 0건(`grep -rn face-api maumgyeot/public/` → 없음) |
| 근거 | 마음수달 설계서 §15-14 |

- **확인**: 라이브러리(L118)는 `face-api.js@0.22.2` 로 **고정**돼 있는데, 가중치만 L121 `cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights` 로 브랜치를 가리킨다. 업스트림이 바뀌면 `tinyFaceDetector`·`faceExpressionNet` 로드가 조용히 깨진다.
- **구현 — 2안. 어느 쪽을 택했는지 보고서에 남겨라.**
  - **1안(권장)**: 가중치 파일을 `maumotter/public/models/` 에 내려받아 **자체 호스팅**하고 `const M = '/models'` 로 바꾼다. 외부 의존이 사라진다. 용량을 먼저 확인할 것.
  - **2안**: `@master` → 태그 또는 커밋 SHA 로 고정. **`@0.22.2` 태그에 `weights/` 디렉터리가 있는지는 이 지시서를 쓴 환경에서 네트워크가 막혀 확인하지 못했다 — 현장에서 확인할 것.**
    ```bash
    curl -sI "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/tiny_face_detector_model-weights_manifest.json" | head -1
    ```
- **검증**: 실기기에서 카메라 켜고 표정 인식이 라벨(`EXPR_LABEL`, L131)을 내는지 확인. DevTools Network 에서 가중치 요청 4~6건이 전부 200인지, 도메인이 의도한 곳인지 확인.
- **주의**: 마음수달은 **React CDN·빌드 없음** 스택이고 배포는 **GitHub 웹UI → Cloudflare 자동배포**다(§1.9). `wrangler deploy` 를 치지 마라.

### [R-49] `GOOGLE_CLIENT_ID` 평문 커밋 + 네이버 콜백 폴백 도메인

| 항목 | 내용 |
|---|---|
| 대상 | `cts-maum-main/wrangler.toml:13` · `src/index.tsx:2957`·`3053`(주입) · `:716`·`:729`(네이버 폴백) |
| 근거 | CTS 설계서 §8.1 표 · §15 인수인계 목록 L531 |

- **확인**: `wrangler.toml` L13 `GOOGLE_CLIENT_ID = "956473702512-…apps.googleusercontent.com"`. 코드는 L2957에서 읽어 L3053 `window.GOOGLE_CLIENT_ID` 로 **브라우저에 주입**한다.
- **판단**: Google OAuth client ID 는 **설계상 공개값**이다(브라우저에 그대로 나간다). 평문 커밋 자체는 시크릿 유출이 아니다 → **시크릿으로 옮기는 것은 과잉 대응이며 배포만 복잡해진다.** 진짜 위험은 **이관 시 소유권**이다(설계서 L531: 리다이렉트 URI가 `jesusmaum.com` 기준이라 재발급 필요).
- **구현**: ① `wrangler.toml` L13 위에 주석 한 줄 — `# 공개값(브라우저 주입). 시크릿 아님. CTS 전용 앱 — 이관 시 재발급 필요` ② `HANDOVER.md` 인수인계 체크리스트에 "Google/Naver/Kakao 앱 소유권 이전 또는 재발급" 항목 추가(R-32 작업과 같은 커밋으로 묶어라).
- **네이버 콜백 폴백(별개 결함)**: L716·L729 가 `c.env.SERVICE_URL || 'https://lightoflife.limyj007.workers.dev'` 다. 프로덕션은 `wrangler.toml` L12에 `SERVICE_URL` 이 있어 폴백을 타지 않지만, **`wrangler.dev.toml` 에는 `[vars]` 블록 자체가 없다** → 스테이징에서 폴백이 발동하고, 네이버 콘솔에 없는 리다이렉트 URI라 로그인이 실패한다.
  - **구현**: `wrangler.dev.toml` 에 `[vars] SERVICE_URL = "<스테이징 실제 URL>"` 추가 + 폴백 문자열을 `https://jesusmaum.com` 으로 교체(또는 미설정 시 500 반환).
- **검증**: `grep -n "SERVICE_URL" cts-maum-main/wrangler*.toml src/index.tsx` 로 폴백 잔재 0건. 스테이징에서 네이버 로그인 팝업이 정상 리다이렉트되는지 실제로 태워 볼 것.
- **주의**: CTS 유지보수 모드 — 안전·버그 수정이라 허용 범위(§1.5). **R-42(네이버 `state` 미검증)는 BATCH_01 항목이다. 여기서 건드리지 마라.**

### [R-52] 검사 문항 수가 4중 수동 관리

| 항목 | 내용 |
|---|---|
| 대상 | `maumful-main/public/static/app.jsx` — ① `TEST_META.questions` L4188~L4197 ② 안내문 L10122·10189·10264·10318·10372… ③ 진행률 분모 L10125·10271·10325… ④ 미완성 경고 상수 L7952·7970·8036·8112·8130·8148·8173·8190 |
| 근거 | 마음풀 설계서 §2.1 말미(L57) — *"현 시점 10종 전부 일치함을 확인했다"* |

- **확인**: `grep -n "개 문항이 남아있습니다" maumful-main/public/static/app.jsx` → 10건. 각 줄의 상수(`9 -`·`7 -`·`21 -`·`30 -`·`50 -`·`60 -`)와 L4188~L4197의 `questions:` 숫자를 대조. **현재는 전부 일치한다** — 버그 수정이 아니라 **재발 방지**다.
- **이미 있는 올바른 패턴**: SCT·DSI 는 배열 길이를 쓴다 — L7906 `(total - filled)`, L7923 `(sdriLikertQ.length - likertFilled)`, L10125 `/ {sdriCompletionQ.length}`. **이 패턴을 나머지 8종에 옮기면 된다.**
- **구현**: 파일 상단에 단일 소스를 만든다.
  ```js
  const TEST_Q_COUNT = { PHQ9:9, GAD7:7, DASS21:21, BIG5:50, LOST:60, SCT:25, DSI:25, BURNOUT:50, RIASEC:30, VALUES:30 };
  ```
  ① `TEST_META` 의 `questions:` 를 `TEST_Q_COUNT.XXX` 로 ② 진행률 분모·경고 상수를 전부 이 맵 참조로 ③ 안내문의 "(N문항)"은 템플릿으로(숫자만 치환 — **문구 자체는 바꾸지 마라**). 문항 배열에서 파생 가능한 검사는 `배열.length` 를 쓰는 편이 더 낫다.
- **검증**: `grep -n "개 문항이 남아있습니다" app.jsx | grep -E "\( *[0-9]+ *-"` → **0건**. `npm run build:jsx` 후 **10종 검사 화면을 전부 열어** 안내문·진행률 분모·미완성 경고 숫자를 눈으로 확인. `node scripts/render_smoke.cjs public/static/compiled/landing.js` 통과.
- **⚠️ 주의**: 번들이 **전역 스코프를 공유**한다(설계서 §15-5). `TEST_Q_COUNT` 같은 새 전역 `const` 가 `landing.js`·`counseling.js` 의 이름과 충돌하면 **`SyntaxError` 로 페이지 전체가 죽는다.** 추가 전에 `grep -rn "TEST_Q_COUNT" public/static/*.jsx` 로 0건을 확인해라.

### [R-53] 마스터 계정용 `allTests` 가 8종 — RIASEC·VALUES 누락

| 항목 | 내용 |
|---|---|
| 대상 | `maumgame-main/src/index.tsx:262`(정의) · `:278`(사용) · `public/static/game_hub.jsx:200-209`(`TEST_META_HUB` 8종) |
| 형제 서비스 | **CTS 게임 `cts-game-main/src/index.tsx:259` 는 고치지 마라 — 정답이다** |
| 근거 | 마음게임 설계서 §15 L330·L334 |

- **확인**: `grep -n "allTests" maumgame-main/src/index.tsx` → L262 8종. 마음풀 본체는 10종(`maumful-main/src/index.tsx:307` `koreaTests`).
- **⚠️ CTS 게임을 복사하지 마라**: CTS 본체는 검사가 **8종뿐**이다 — `cts-maum-main/src/index.tsx:301-302` 의 `globalTests`(5종) + `SCT`·`DSI`·`BURNOUT`. RIASEC·VALUES는 CTS에 **존재하지 않는다.** 여기 복사하면 없는 검사를 완료 처리하게 된다. **복제 결함이 아니라 정당한 차이다.**
- **실피해 범위**: `allTests` 는 `master ? allTests : …`(L278) — **마스터 계정 응답에만** 쓰인다. 일반 사용자 영향 0.
- **구현**: `maumgame-main/src/index.tsx:262` 에 `'RIASEC', 'VALUES'` 추가. **서버만 고쳐라.**
- **프론트(`TEST_META_HUB` 2종 추가)는 사용자 확인 후**: 배지 행은 사용자에게 보이는 표시다(§2.2). 고치기로 했다면 `game_hub.jsx` L200~L209에 2종 추가 + **`npm run build:jsx`** 로 `compiled/game_hub.js` 재생성(§1.9 / BATCH_01 선행조건 ③).
- **검증**: 마스터 계정으로 `curl -H "Authorization: Bearer $GAME_TOKEN" .../api/game/me | jq '.data.completedTests | length'` → **10**. 일반 계정은 자기 이력 길이 그대로. CTS 게임은 **8** 유지(`grep -n allTests cts-game-main/src/index.tsx` 로 변경 없음 확인).

### [R-56] 휴면 상담센터 어드민의 죽은 분기

| 항목 | 내용 |
|---|---|
| 대상 | `maumful-main/public/static/landing.jsx:2056` · 라벨 배열 `:2028-2031`(ko)·`:2042-2044`(en) · 렌더 분기 `public/static/app.jsx:3262` |
| 근거 | 마음풀 설계서 §11 L90~L92 |

- **확인**: `grep -rn "counselingAdmin" maumful-main/public/static/ maumful-main/src/` → **2건뿐**. `landing.jsx:2056` `if (l === '어드민') setView('counselingAdmin');` / `app.jsx:3262` `if (view === 'counselingAdmin') return <CounselingAdminPage setView={setView} />`. 푸터 링크 배열(L2030 `['이용약관','개인정보처리방침','FAQ','문의하기']`)에 **`'어드민'` 이 없다** → 조건이 영원히 거짓.
- **⚠️ 삭제하지 마라**: 설계서 L92가 *"부활은 푸터 링크 라벨에 `'어드민'` 을 되살리는 것만으로 끝난다 — 이것이 코드를 지우면 안 되는 실질적 이유"* 라고 적었다. L2056을 지우면 **부활 경로가 사라진다.**
- **구현(권장)**: 코드를 남기고 **의도를 명시**한다. L2055 위에 주석 한 줄 —
  `// 휴면(2026-xx). 부활 조건: 위 links 배열에 '어드민' 라벨 복원. 지우지 말 것 — 설계서 §11 참조`
  그리고 `maumful-main/docs/DESIGN.md` §11 과 `CLAUDE.md` 의 *"호출부 0"* 표기를 **"호출부 1(죽은 분기·의도적 보존)"** 로 정정한다(설계서 L91이 이미 이 불일치를 지적하고 있다).
- **검증**: 푸터 4개 링크가 전부 정상 동작(약관·개인정보·FAQ·문의). `npm run build:jsx` 후 렌더 검증. `grep -c "counselingAdmin" public/static/compiled/landing.js` → 1(재컴파일 확인).
- **사용자 확인 필요**: 죽은 분기를 (a) 주석 달고 유지 (b) 라벨 복원해 부활 (c) 완전 삭제 — 휴면 기능 부활 조건에 영향을 주는 판단이다.

---

## 3. B군 — 문서 정정 (7건)

> **코드는 건드리지 않는다**(R-35 의 `wrangler*.toml` 만 예외). 각 건은 "정본 파일 확인 → 문구 교체 → 개정 이력 한 줄" 이다. **§0의 설계서 이중 사본 경고를 먼저 읽어라.**

### [R-29] TTS 스펙 — 문서와 코드가 다르다

| 항목 | 내용 |
|---|---|
| 대상 | `maumotter/CLAUDE.md:120` |
| 코드 근거 | `maumotter/src/index.ts:479-480`(음색) · `:483`(캐시키) · `:490-491`(speed/instructions) · `:494-495`(모델·폴백) |
| 근거 | 마음수달 설계서 §15-5 |

- **확인**: `grep -n "tts-1\|shimmer" maumotter/CLAUDE.md` → L120. 문서 원문: *"**OpenAI tts-1** … 버디별 음성 **또또=shimmer**·라라=nova"*. 코드 L480: `const voice = (buddy === 'lala' || buddy === '라라') ? 'nova' : 'fable';` · L494~L495: `speak('gpt-4o-mini-tts', true)` 실패 시 `speak('tts-1', false)`.
- **구현 — 교체 문구 초안**:
  > `POST /api/tts`(authed) → **OpenAI `gpt-4o-mini-tts` 우선**(`instructions` 로 톤 지시), 실패 시 **`tts-1` 폴백**(`speed:1.0`, instructions 미지원). 버디별 음성 **또또=`fable`·라라=`nova`**. KV 캐시 키 `v2|voice|text`(30일) — **음색·모델을 바꾸면 접두어를 `v3` 로 올려 옛 캐시를 무효화할 것.**
- 나머지 문장(AI Gateway 경유 필수 · `OPENAI_API_KEY` · speechSynthesis 폴백 · 개인정보 처리위탁)은 **그대로 두어라** — 코드와 일치한다.
- **검증**: `grep -n "shimmer" maumotter/CLAUDE.md` → 0건. `grep -n "fable\|gpt-4o-mini-tts" maumotter/CLAUDE.md` → 각 1건 이상. 수달 설계서 §15-5 를 "해소"로 갱신 + 개정 이력 한 줄.

### [R-31] 통합결제 "착수 대기" ↔ 이미 배포·판매 중 — **루트 문서 · 사용자 확인 필수**

| 항목 | 내용 |
|---|---|
| 대상 | **루트 `CLAUDE.md:86-87`**(+ L81 백로그 줄) |
| 코드 근거 | 발신 `maumful-main/src/index.tsx:3158-3198`(`deliverGrant`·`SERVICE_API`)·`:3204-3212`(재시도) / 수신 `maumotter/src/index.ts:533`·`:559` · `maumgyeot/src/index.ts:399`·`:425` |
| 근거 | 마음수달 설계서 §15-4 · 마음풀 설계서 §12 L164(*"배포됨(수달·곁 라이브)"*) |

- **확인**: 루트 L86 제목이 *"연동형 유료결제 (통합결제) — 설계 완료·착수 대기 ⚠️"*, L87이 *"**토스페이먼츠 완전 반영 전까지 관련 코드는 커밋·푸시·배포 금지**(설계·로컬 준비만)"*. 그런데 발신·수신 코드가 **모두 커밋돼 있다**(`maumful-main/src/index.tsx` 최종 커밋 `fbfe9ea` 2026-08-29). `maumful-main/CLAUDE.md:275` 는 같은 기능을 *"E2E 검증 완료(지급·멱등·위조401·환불revoke)"* 로 적는다. **루트 문서만 낡았다.**
- **⚠️ 루트 문서는 전 서비스에 영향을 준다.** 아래를 **초안으로 제시하고 반영 전 사용자 확인을 받아라.**
  > **## 연동형 유료결제 (통합결제) — 수달·곁·부부·세대 배포 완료 / phyweb 배포 완료**
  > 마음풀에서 상품으로 판매 → 결제내역을 각 서비스로 자동 전달(grant). **발신(마음풀)·수신(수달·곁·phyweb) 코드 모두 배포 상태**이며 E2E 검증 완료(`maumful-main/CLAUDE.md` 상품/결제 절 참조).
  > ~~토스페이먼츠 완전 반영 전까지 관련 코드는 커밋·푸시·배포 금지~~ → **이 금지는 해제되었다**(2026-08 시점 코드 기준). 남은 제약은 **라이브 결제키 전환 시점**뿐이다.
- **사용자에게 물어야 할 것**: ① 금지 규정이 실제로 해제된 것인가, 아니면 **규정을 어긴 채 배포된 것인가** — 후자면 문서가 아니라 배포 상태를 되돌려야 한다 ② L81 백로그의 *"선행조건 대기: … 연동형 통합결제 → 토스 실결제 반영 후"* 도 함께 정정할지.
- **검증**: `grep -n "착수 대기\|커밋·푸시·배포 금지" ~/maum/CLAUDE.md` → 0건(승인 후). 수달·곁 설계서 §15-4 를 "해소"로 갱신.

### [R-55] 통합결제 원문에 "세대"가 빠져 있다 — **R-31과 한 문단, 한 번에**

| 항목 | 내용 |
|---|---|
| 대상 | **루트 `CLAUDE.md:87`** — *"**수달·곁·부부** 유료결제를…"* |
| 코드 근거 | `maumful-main/src/index.tsx:3140-3142` — `sedae_pack10`·`sedae_pack20`·`sedae_pack40`(25cr/₩3,300 · 50cr/₩4,900 · 100cr/₩8,900) |

- **확인**: `grep -n "sedae_pack" maumful-main/src/index.tsx` → 3건. `maumful-main/CLAUDE.md:196` 은 *"부부·세대 3단계(2026-08-08 확장)"* 로 **이미 반영돼 있다** → 루트만 낡았다.
- **구현**: L87 `수달·곁·부부` → `수달·곁·부부·세대`. 단 세대 통역팩은 `service` 필드가 없는 **공용 크레딧 지급 상품**이라 grant 경로를 쓰지 않는다 — 문장에 그 구분을 한 줄 덧붙여라(`maumful-main/CLAUDE.md:196` 의 표현을 그대로 가져오면 된다).
- **⚠️ R-31과 같은 문단이다. 두 수정을 하나의 변경안으로 묶어 사용자 확인을 1회만 받아라.**
- **검증**: `grep -n "수달·곁·부부·세대" ~/maum/CLAUDE.md` → 1건. 루트 `CLAUDE.md` 개정 이력에 한 줄.

### [R-32] 문서에 없는 세 번째 워커 `lightoflife-couple`

| 항목 | 내용 |
|---|---|
| 대상 | `cts-maum-main/HANDOVER.md:10`·`:12-15`(워커 표)·`:39-42`(인프라 표)·`:118`(체크리스트) |
| 코드 근거 | `cts-maum-main/public/static/landing.jsx:172`·`:1124`·`:1185`·`:1326` — `const coupleBase = 'https://lightoflife-couple.limyj007.workers.dev'` / 토큰 발급 `src/index.tsx:1283` `GET /api/couple-token` |
| 근거 | CTS 설계서 §15-5 |

- **확인**: `grep -rn "lightoflife-couple" cts-maum-main/` → **4건**(전부 `landing.jsx`). `HANDOVER.md:10` 원문: *"CTS는 **워커 2개**로 이루어진다."* L12~L15 표에도 2행뿐 → 이관하면 "커플 케어" 메뉴가 죽은 링크가 된다.
- **구현**: ① L12~L15 워커 표에 3행 추가 — `CTS 커플 | (레포 위치 현장 확인) | lightoflife-couple | lightoflife-couple.limyj007.workers.dev` ② L10 "워커 2개" → "워커 3개" ③ L39~L42 인프라 표에 행 추가 ④ L118 체크리스트에 "`lightoflife-couple` 워커·레포 이관" 항목 추가(R-49의 소셜 앱 재발급 항목과 같은 커밋으로).
- **⚠️ 추측 금지**: 이 워커의 **소스 레포 위치·실재 여부를 확인하지 못했다**(`maum/` 어디에도 대응 폴더가 없다 — `package/maumcouple` 은 마음풀 생태계의 별개 워커다). **현장에서 확인할 것.**
  ```bash
  npx wrangler deployments list --name lightoflife-couple
  curl -s -o /dev/null -w "%{http_code}\n" https://lightoflife-couple.limyj007.workers.dev
  ```
  확인 안 되면 `⚠️ 미확인` 으로 표기하고 넘어가라. 없는 사실을 적지 마라.
- **검증**: `grep -c "lightoflife-couple" cts-maum-main/HANDOVER.md` → 1 이상. CTS 설계서 §15-5 갱신.
- **주의**: CTS 유지보수 모드지만 **이건 문서 수정이라 무관**하다(§1.5).

### [R-16] phyweb 상품 6종이 `CLAUDE.md` 에 없다

| 항목 | 내용 |
|---|---|
| 대상 | `maumful-main/CLAUDE.md:271-275`(상품/통합결제 절) |
| 코드 근거 | `maumful-main/src/index.tsx:3152-3157`(상품 6종) · `:3159`(`SERVICE_API.phyweb`) · `:1161`·`:1186`(status·revoke) |

- **확인**: `grep -c "phyweb" maumful-main/CLAUDE.md` → **0**. `grep -c "phyweb" ~/maum/CLAUDE.md` → **0**. 코드에는 6종이 완비돼 있다: `phyweb_solo` ₩19,900 · `phyweb_basic` ₩29,900 · `phyweb_professional` ₩49,900 · `phyweb_solo_annual` ₩190,000 · `phyweb_basic_annual` ₩250,000 · `phyweb_professional_annual` ₩450,000. 전부 `credits: 0`·`service: 'phyweb'`·`grantType` = phyweb `TOSS_PLAN_CONFIG` 키.
- **구현 — L271~L275 상품 목록에 한 항목 추가(초안)**:
  > - **phyweb 상담사 구독**(`service:'phyweb'`·`credits:0`, 같은 사업자라 결제창 공유): Solo ₩19,900 / Basic ₩29,900 / Professional ₩49,900(각 1개월·비자동갱신) · 연간 ₩190,000 / ₩250,000 / ₩450,000. **마음풀 유일의 쿠폰코드 응답형** — `POST https://phyweb.pages.dev/api/grant` 응답의 `code` 를 저장·이메일 발송하고 `GrantCodeModal` 로 노출한다(설계서 §10 결제 흐름). 상태 조회 `/api/grant/status`(index.tsx:1161)·환불 `/api/grant/revoke`(:1186).
- **검증**: `grep -c "phyweb" maumful-main/CLAUDE.md` → 1 이상. `CLAUDE.md` 의 6개 금액이 `src/index.tsx:3152-3157` 과 **한 자리도 다르지 않은지** 눈으로 대조. 마음풀 설계서 §10 과도 대조.

### [R-54] "마음커플 Plus ₩9,900"은 결제 상품이 아니다

| 항목 | 내용 |
|---|---|
| 대상 | `package/maumcouple/docs/DESIGN.md` §10·§15 · `maumful-main/CLAUDE.md`(구독 절) |
| 코드 근거 | 프론트 카드 `maumful-main/public/static/app.jsx:6293-6308` · 버튼 `:6348-6355` · 라우트 `maumful-main/src/index.tsx:3908-3920` · 백엔드 플랜 `:3259-3266` |

- **확인 — 키가 하나도 겹치지 않는다**: 프론트 카드(app.jsx L6293~L6308) = 마음풀 Plus ₩5,900 / 마음커플 Plus ₩9,900 / 마음가족 ₩14,900 ↔ 백엔드 `SUBSCRIPTION_PLANS`(src L3263~L3265) = `basic` ₩3,900 / `standard` ₩8,900 / `pro` ₩19,900. 버튼(L6348)은 결제가 아니라 `POST /api/credits/notify-plan` 을 호출하고 *"오픈 알림을 신청했습니다"* 알럿만 띄운다. 라우트(L3908~L3920)는 KV `plan_notify:{email}` 에 90일 TTL로 쌓을 뿐이다. → **구독 전체가 표시 전용이다.**
- **참고**: `package/maumcouple/` 코드에는 `notify-plan`·구독 관련 코드가 **0건**이다 — **마음커플 워커에 손댈 것은 없다.**
- **구현**: ① 커플 설계서 §10 의 "마음커플 Plus ₩9,900" 옆에 **"결제 상품 아님 — 대기자 등록 카드(`/api/credits/notify-plan`)"** 를 명시 ② §15에 *"프론트 플랜 카드와 백엔드 `SUBSCRIPTION_PLANS` 는 키가 전혀 겹치지 않아 구독 전체가 표시 전용"* 항목 추가 ③ `maumful-main/CLAUDE.md` 구독 절에 같은 한 줄.
- **검증**: `grep -rn "notify-plan" package/maumcouple/` → 0건(문서에서만 언급). 설계서 §0 문서 정보의 최종 갱신일·개정 이력 갱신.
- **주의**: 카드 문구·가격은 **사용자에게 보이는 것**이다. 문서만 고치고 **프론트는 건드리지 마라**(§2.2).

### [R-35] cron 이 프로덕션엔 주석, 스테이징엔 활성

| 항목 | 내용 |
|---|---|
| 대상 | `cts-maum-main/wrangler.toml:27-28`(주석) · `wrangler.dev.toml:18-19`(활성) |
| 코드 근거 | `cts-maum-main/src/index.tsx:4146-4160`(`handleScheduled` = 구독 자동 갱신) · `:4764-4766` |
| 근거 | CTS 설계서 §15-8 |

- **확인**:
  ```bash
  grep -n -A2 "triggers" cts-maum-main/wrangler.toml cts-maum-main/wrangler.dev.toml
  # wrangler.toml  L27-28: "# [triggers] / # crons = [...]  # 유료 플랜 전환 후 활성화 (cron 5개 무료 제한)"
  # wrangler.dev.toml L18-19: [triggers] / crons = ["0 0 1 * *"]   ← 활성
  ```
  `handleScheduled`(L4146)는 `user_subscriptions` 를 읽어 **토스 빌링으로 실제 결제를 시도**한다. 첫 줄(L4148~L4149)에서 `TOSS_BILLING_KEY || TOSS_SECRET_KEY` 가 없으면 로그만 남기고 반환한다.
- **구현**: ① **`wrangler.dev.toml` 의 `[triggers]` 블록을 제거한다** — 스테이징이 매월 1일 결제 로직을 도는 것은 어떤 경우에도 의도가 아니다 ② `wrangler.toml` L27~L28 주석을 **의도가 드러나게** 고친다: `# 구독 미판매(2026-xx) → 의도적 비활성. 판매 재개 시 활성화. 무료 플랜 cron 5개 제한 확인 필요`.
- **⚠️ 먼저 확인할 것**: 스테이징 워커에 토스 키가 실제로 설정돼 있는지.
  ```bash
  npx wrangler secret list --config cts-maum-main/wrangler.dev.toml
  ```
  키가 있으면 **스테이징이 지금까지 매월 1일 실결제를 시도했을 수 있다.** 있었다면 `credit_charges`·`user_subscriptions` 이력을 확인하고 **보고서 §4에 기록 + 사용자에게 즉시 알려라.**
- **검증**: `grep -n "triggers" cts-maum-main/wrangler*.toml` → `wrangler.toml` 의 주석 1건만. `npx wrangler deploy --config wrangler.dev.toml --dry-run` 으로 트리거가 빠졌는지 확인.
- **주의**: CTS 유지보수 모드 — **부당 청구를 막는 안전 수정이라 허용 범위**(§1.5). / **마음풀에서 같은 검사를 반드시 해라**: `maumful-main/wrangler.toml:21-22` 와 `wrangler.dev.toml:20-21` 이 **둘 다 활성**이다(마음풀 스테이징도 매월 1일 구독 갱신을 돈다). 이건 이 배치 범위 밖이니 **고치지 말고 보고서 §4에 기록만** 해라.

---

## 4. 완료 기준 체크리스트

- [ ] **§0 "설계서 이중 사본" 경고를 읽고**, 문서 수정은 전부 **정본**(`<서비스>/docs/DESIGN.md`·`_docs/*.md`)에만 했다
- [ ] 작업 시작 전 `git diff --ignore-all-space` 로 CRLF 노이즈를 걸러냈다
- [ ] **C군을 먼저 처리**했다 — R-33(3개 워크플로 전부)·R-17·R-36
- [ ] R-33: `build:jsx`(마음풀은 `build:assets`) + `git diff --exit-code` 가드를 CTS·루트 프로덕션·루트 스테이징 **세 워크플로 모두**에 넣고, 일부러 실패시켜 가드가 도는 것을 확인했다
- [ ] R-17: 체크아웃 3곳에 화이트리스트 가드를 넣었고, **웹훅 2곳(L1762·L1844)에는 넣지 않았다**. 교차 통화(`starter_g` via toss)가 400으로 막히는 것을 확인했다
- [ ] R-17: **가격 숫자를 바꾸지 않았다.** 재조정은 §6 사용자 확인 항목으로 올렸다
- [ ] R-36: 마음풀 한 곳에 `typecheck`·`smoke` 스크립트 + lint 워크플로 스텝 + 롤백 절차 1장. **확장은 사용자 판단으로 넘겼다**
- [ ] A군 7건 각각 **확인 명령을 실제로 실행**했고 라인 번호가 다르면 문자열로 다시 찾았다
- [ ] **손대면 안 되는 3곳을 건드리지 않았다** — R-53의 CTS 게임(`cts-game-main/src/index.tsx:259`, 본체 검사가 8종뿐이라 정답) · R-14의 CTS `src/index.tsx:313-325`(값 일치) · R-56의 `landing.jsx:2056`(부활 경로 보존)
- [ ] `.jsx` 를 고친 건(R-52·R-53 프론트·R-56)은 `npm run build:jsx` 후 `compiled/*.js` 를 **함께 커밋**하고 **렌더 검증**을 실제로 했다
- [ ] B군 7건 문구를 코드 원문과 **한 자리씩 대조**했다
- [ ] **R-31·R-55는 루트 `CLAUDE.md` 수정이다 — 변경안을 초안으로 제시하고 사용자 승인 전에는 반영하지 않았다**(두 건을 한 변경안으로 묶었다)
- [ ] 사용자 확인 대기 항목(R-15 주기 · R-17 가격 · R-30 1안/2안 · R-31·R-55 루트 문구 · R-53 프론트 배지 · R-56 처리 방향 · R-36 확장)을 보고서 §6에 전부 올렸다
- [ ] 서비스별 커밋 분리(§1.7) — `[cts]`·`[maumful]`·`[maumgame]`·`[maumotter]`·`[공통]`
- [ ] CTS 서브모듈 커밋 순서(§1.6)를 지켰다
- [ ] 각 서비스 `docs/DESIGN.md` §15 와 `_docs/RISKS.md` 의 해당 항목을 갱신하고 개정 이력을 남겼다
- [ ] 배포했거나, 배포하지 않은 사유가 보고서에 있다
- [ ] 결과 보고서를 작성했다

---

## 5. 결과 보고서

- **경로**: `_docs/작업지시서/결과/BATCH_06_결과.md`
- **양식**: BATCH_00 §3.1 템플릿 그대로
- **커밋**: `[공통] BATCH_06 결과 보고서`

### 이 배치에서 특히 신경 써서 적을 것

| 보고서 절 | 반드시 담을 내용 |
|---|---|
| §2 상세 | R-33 은 **세 워크플로 각각** 무엇을 넣었는지 / R-30 은 자체 호스팅(1안)·핀 고정(2안) 중 무엇을 왜 택했는지 / R-56 은 유지·삭제 중 무엇을 왜 택했는지 |
| **§3 전제 불일치** | 이 지시서가 코드를 읽고 쓴 **2026-09-19 시점** 기준이다. 라인 번호·상수·워크플로 내용이 다르면 전부 여기 적어라. **R-33의 "현재 드리프트 없음" 이 여전히 참인지**를 명시적으로 확인하고 결과를 적어라 |
| **§4 새 발견** | 이 지시서를 쓰며 확인했으나 등록부에 없는 것 3건을 **먼저 옮겨 적고**, 현장에서 확인한 결과를 덧붙여라 — ① CTS `toss/checkout`(L1893)의 **통화 하드코딩**으로 USD 패키지를 ₩로 살 수 있음 ② **마음풀은 prod·dev 양쪽 모두 cron 활성**(`wrangler.toml:21-22` / `wrangler.dev.toml:20-21`) ③ **CTS 스테이징 KV 가 마음풀 KV 와 같은 네임스페이스다** — `cts-maum-main/wrangler.dev.toml:16` 과 `maumful-main/wrangler.toml:16`·`wrangler.dev.toml:18` 이 모두 `9f7426807e924916be4dec75793422d9`. 생태계가 분리돼 있다는 전제(설계서 §2 "생태계 3분할")와 어긋난다. **고치지 말고 확인해서 보고만 해라 — 시크릿·세션에 걸린 문제라 범위가 크다** |
| §5 미착수 | 확인 못 한 것(예: `lightoflife-couple` 워커 실재 여부, face-api 태그의 `weights/` 존재 여부)은 **"확인 못 했다"** 고 쓰고 무엇이 막았는지 적어라 |
| §6 사용자 확인 | 위 체크리스트의 8개 항목 + `시스템 설계서/` 폴더 처리 방향(정본 동기화 / 폴더 폐기 / 유지) |
| §7 갱신 문서 | 정본 경로로 적어라. 사본(`시스템 설계서/…`)을 고쳤다면 **그 사실도 적어라** |
