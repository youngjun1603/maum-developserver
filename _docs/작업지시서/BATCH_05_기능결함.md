# BATCH_05 — 기능 결함 (8건)

> **선행 필독**: `_docs/작업지시서/BATCH_00_README.md` (§1 공통 규칙 · §2 이슈 읽는 법 · §3 보고 양식)
> **근거**: 2026-09-19 코드 직접 열람 + `_docs/RISKS.md` + 각 서비스 `docs/DESIGN.md` §15
> **라인 번호는 2026-09-19 기준이다. 다르면 믿지 말고 문자열로 다시 찾아라(BATCH_00 §1.1).**

---

## 0. 배치 개요

| ID | 제목 | 심각도 | 대상 | 형제 서비스 |
|---|---|---|---|---|
| R-08 | 번아웃 metadata 키 불일치 → 주간 집계가 죽어 있다 | S2 | 마음게임 | CTS 게임 |
| R-12 | 성경 정확성 가드가 코드 폴백 1곳에만 적용 | S2 | CTS 본체 | — |
| R-18 | 게임 딥링크 화이트리스트에 `qt` 누락 | S3 | CTS 게임 | 마음게임(이미 정답) |
| R-19 | `PHYWEB_URL='https://maumful.com'` 하드코딩 잔재 | S3 | CTS 게임 | — |
| R-22 | 위기 감지·긴급 연락처 안내가 전무 | S3(실질 S2) | 마음커플 | 마음부부·마음풀(정답 패턴) |
| R-26 | 공감 반응(🤍)이 반쪽 — 증가 API·버튼 없음 | S3 | 마음부부 | — |
| R-27 | `MODE_MODULES`·`memoryModule`·피드백/검수 프롬프트가 부부 문구 | S3 | 마음세대 | 마음부부(진본 — 손대지 말 것) |
| R-28 | 이중 폭풍 장기기억(`past_patterns`·`life_stage`) 미배선 | S3 | 마음세대 | — |

**예상 작업량** — R-18·R-19 합쳐 1시간 / R-26 반나절 / R-08 반나절(원격 DB 실측 포함) / R-27 반나절(케이스뱅크 회귀 포함) / R-28 반나절 / **R-12 는 코드 수정 30분이지만 원격 `ai_config` 실측이 선행** / **R-22 는 이 배치에서 유일한 "새 기능"에 가깝다 — 범위를 사용자에게 먼저 물어라.**
**권장 순서** — R-18 → R-19 → R-26 → R-28 → R-27 → R-08 → R-12 → R-22(작고 독립적인 것부터. R-12·R-22 는 대기가 생길 수 있으니 뒤로. **대기 때문에 나머지를 멈추지 마라**).

**선행조건** — ① `gh auth status` → `youngjun1603` 활성(§1.8) ② `cts-maum-main/` 은 **서브모듈**(커밋 순서 §1.6), `cts-game-main/` 은 부모 레포 안 ③ 프론트 수정 시 `npm run build:jsx` 필수 — **CTS 게임 CI 는 `build:jsx` 를 돌리지 않는다**(R-33) → `public/static/compiled/` 산출물을 반드시 커밋 ④ `render_smoke.cjs` 는 **마음부부·마음세대에만** 있다(게임 2종·마음커플에는 없음 → 브라우저 직접) ⑤ R-08·R-12 는 **원격 D1 조회가 선행조건** — DB 이름은 게임·부부·세대·커플 = `maumful-db` / CTS 본체·CTS 게임 = `lightoflife-db`.

**⚠️ 다른 배치와 같은 파일을 건드리는 항목 — BATCH_01 을 먼저 끝내고 rebase 한 뒤 시작해라.**

| 파일 | 이 배치 | 다른 배치 |
|---|---|---|
| `maumgame-main/src/index.tsx` · `cts-game-main/src/index.tsx` | R-08 | **BATCH_01 R-01·R-02** |
| `cts-game-main/public/static/game_hub.jsx` | R-18·R-19 | **BATCH_01 R-01** — 둘 다 `build:jsx` 필요 |
| `cts-maum-main/src/index.tsx` | R-12 | **BATCH_01 R-42·R-43** · BATCH_02 CTS 결제 |
| `maumbubu/src/translate-route.ts` · `bubu_hub.jsx` | R-26 | **BATCH_01 R-05·R-23** |
| `maumsedae/src/translate-route.ts` | R-28 | **BATCH_01 R-05** |
| `package/maumcouple/src/index.tsx` | R-22 | BATCH_02 R-21(크레딧) · BATCH_06 R-06(timeline) |

**손대지 말 것** — 마음부부 `src/translation-prompts.ts`(**통역 엔진 진본**, 세대 설계서 §15-9) / 리더보드 산식·weekly-report 응답 키(BATCH_01) / CTS 의 기능 개선(§1.5) — **R-12·R-18·R-19 는 전부 버그 수정이라 허용 범위**이나 겸사겸사 얹지 마라 / 마음커플 크레딧 차감 시점(R-21)·`couple_sessions` 컬럼명(R-06) / 마음세대 `TEEN_BLOCKED`·`NOT_YET` 게이트·`teenSafetyOverride` 조립 순서(주석에 "실측" 근거).

---
## 1. 이슈

### [R-08] 번아웃 metadata 키가 어긋나 주간 집계가 죽어 있다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 |
| 대상 | `maumgame-main/public/static/games/burnout.jsx:383` ↔ `maumgame-main/src/index.tsx:1397-1398,1473` |
| 형제 서비스 | **CTS 게임** `cts-game-main/public/static/games/burnout.jsx:383` ↔ `cts-game-main/src/index.tsx:1351-1352` — 코드 동일. cron 이 주석(`wrangler.toml` L27~28)이라 무증상이지만 **cron 해제의 선행조건**이다 |
| 근거 | 마음게임 설계서 §15-3 · CTS 게임 설계서 §15.0 · BATCH_00 §1.4 복제 결함표 3행 |

**무엇이 문제인가** — 프론트가 쓰는 키와 서버가 읽는 키가 다르다. 양쪽 원문 — 프론트 `burnout.jsx:377-384`:
```jsx
const totalEnergyGained = completedToday.reduce((s,c) => s + MISSIONS[c].energy, 0);
const res = await GameEngine.saveSession({
  gameId:'burnout', moduleType:'MISSION', score, durationSec: completedToday.length * 60,
  metadata:{ missions_completed:completedToday.length, energy_gained:totalEnergyGained,
    city_level:cityLevel.level, burnout_score:burnoutScore }, });
```
서버 `handleScheduled` `index.tsx:1396-1399` (그리고 `signalsFromSessions` L1471-1474 도 동일하게 `s.meta.energy`):
```ts
if (s.gameId === 'burnout') {
  if (typeof s.meta.completedMissions === 'number') missionCount += s.meta.completedMissions
  if (typeof s.meta.energy === 'number') energies.push(s.meta.energy)
}
```
결과 ① `energies` 가 항상 비어 `if (energies.length > 0)`(L1400)가 false → **`weekly_reports` INSERT 자체가 실행되지 않는다.** ② `signalsFromSessions` 의 `avgEnergy` 가 항상 `null` → `pickTestSuggestion`(L1490)의 `sig.avgEnergy !== null && sig.avgEnergy < 40` BURNOUT 제안이 **영원히 발동하지 않는다**(`burnoutPlays >= 3` 폴백만 남는다). ③ `missionCount` 항상 0. ④ 백로그 "검사↔게임 루프가 도는지 데이터 보고 판단"이 **데이터가 없어 판단 불가**다.
**의미도 어긋나 있다** — 서버 주석(L1461)은 `avgEnergy` 를 *"번아웃 게임에서 스스로 매긴 에너지(0~100)"* 로 정의한다. 프론트의 `energy_gained` 는 **오늘 완료한 미션 에너지의 합**(개당 6~25)이고, 화면의 `energy` 상태는 `initialEnergy = 100 - burnoutScore`(L279)에서 시작해 상한이 **150**이다(`energyPct = energy/150`, L313). **키만 맞춰도 `< 40` 임계값의 의미는 맞지 않는다.**

**확인 방법** — **이미 쌓인 데이터가 있는지가 관건이다. 어느 쪽을 맞출지는 이 결과로 정한다.**
```bash
grep -n "energy_gained\|missions_completed" {maumgame-main,cts-game-main}/public/static/games/burnout.jsx
grep -n "meta.energy\|meta.completedMissions" {maumgame-main,cts-game-main}/src/index.tsx
cd maumgame-main; W="npx wrangler d1 execute maumful-db --remote --command"
$W "SELECT COUNT(*) n, MIN(created_at) first, MAX(created_at) last FROM game_session_logs WHERE game_id='burnout'"
$W "SELECT metadata FROM game_session_logs WHERE game_id='burnout' ORDER BY created_at DESC LIMIT 5"
$W "SELECT COUNT(*) FROM weekly_reports"
cd ../cts-game-main && npx wrangler d1 execute lightoflife-db --remote --command \
  "SELECT COUNT(*) n FROM game_session_logs WHERE game_id='burnout'"
```
**구현 방법**
1. **판단 근거** — 위 첫 쿼리에서 **`n > 0` 이면 서버를 프론트에 맞춰라.** 저장된 행의 metadata 는 `missions_completed`/`energy_gained` 로 굳어 있다. 프론트만 바꾸면 과거 행은 영원히 안 읽히고, 지난주 `avg_energy` 와 비교하는 `burnout_delta`(L1404~1407)가 무의미해진다. 서버를 고치면 **기존 데이터가 즉시 살아난다.** `n = 0` 이어도 서버 쪽(관대한 읽기)이 안전하다 — 옛 클라이언트 번들이 캐시로 남을 수 있다.
2. **서버를 관대하게 읽게 한다**(추가형, 기존 키도 계속 읽는다 — §1.2). `handleScheduled`·`signalsFromSessions` **두 곳 모두**. 헬퍼 2개(`burnoutMissions(m)` = `m.missions_completed ?? m.completedMissions`, `burnoutEnergy(m)` = `m.energy ?? m.energy_gained`, 각각 `typeof === 'number'` 검사 후 `null` 폴백)를 두고 양쪽에서 부르는 편이 낫다. `meta.energy` 를 **먼저** 보게 두면 3번에서 프론트가 `energy` 를 실어 보낼 때 자연히 우선한다. 3. **척도 문제 — 결정하고 보고서에 남겨라.** `energy_gained`(보통 30~60)를 그대로 넣으면 `< 40` 이 **과발동**한다. 권장: 프론트가 기존 키를 **그대로 두고** `energy: Math.max(0, Math.min(100, Math.round(energy)))` 를 metadata 에 **추가**(추가형, 기존 소비자 무영향). `energy` 는 `100-burnoutScore` + 오늘 회복분이라 "지금 이 사람의 에너지"에 가장 가깝다. **클램프 근거와 `<40` 임계값 유지/조정 판단을 반드시 보고서 §2 에 남겨라.** 임계값 자체를 바꿀 필요가 있다고 보면 §2.2 에 따라 **사용자에게 물어라**(검사 제안은 사용자에게 보이는 안내다).
4. **CTS 게임도 동일 수정**(§1.4). 지금은 cron 이 꺼져 무증상이지만 **켜는 순간 그대로 드러난다.** 켜는 것은 이 배치 일이 아니다 — `wrangler.toml` 주석을 풀지 마라.
5. `npm run build:jsx` 로 `compiled/games/burnout.js` 재생성 — **양쪽 레포 각각.**

**검증 방법**
```bash
cd maumgame-main && npx tsc --noEmit && npm run build:jsx
grep -c "energy_gained" public/static/compiled/games/burnout.js   # ≥1 (재컴파일 확인)
grep -n "handleScheduled(env)" src/index.tsx     # 수동 트리거 경로(L1624 근처) 확인 후 1회 실행
# 배포 → 번아웃 1회 플레이 → 집계 수동 실행 순으로 확인
$W "SELECT metadata FROM game_session_logs WHERE game_id='burnout' ORDER BY created_at DESC LIMIT 1"   # energy 키 존재
$W "SELECT user_id, avg_energy, completed_missions, burnout_delta, week_start FROM weekly_reports ORDER BY rowid DESC LIMIT 5"   # avg_energy 가 0이 아니어야
```
**렌더 검증(필수)** — 번아웃 회복 진입 → 미션 2개 완료 → "마치기" → 리포트 화면 정상, 도시 레벨 표시. **CTS 게임도 동일하게**(게임 2종은 `render_smoke.cjs` 가 없다 → 브라우저로 직접).

**주의** — `handleScheduled` 의 DELETE→INSERT 멱등 처리(L1409~1413)·`kstWeekStartStr` 는 건드리지 마라. / `weekly_reports` 응답 키는 BATCH_01 R-02 소관. / **CTS cron 주석을 풀지 마라**(무료 cron 5개 제한, RISKS R-35). / `tree.jsx:324` 의 `stages_completed`·`answers_filled` 도 **서버가 읽지 않는다** — 범위 밖, 보고서 §4 에 기록만.

---

### [R-12] 성경 정확성 가드가 코드 폴백 1곳에만 적용돼 있다

| 항목 | 내용 |
|---|---|
| 심각도 | S2 — **이 배치에서 가장 민감하다** |
| 대상 | `cts-maum-main/src/index.tsx:1042`(PERSONA) · `:1046`(FORMAT) · `:1484`(CHAT, 가드 있음) · `migrations/0016_ai_config.sql` 전체 |
| 형제 서비스 | — (마음풀 본체는 이미 적용. `maumful-main/src/index.tsx:1492,2888` 이 정답 원문) |
| 근거 | CTS 설계서 §11·§15 · `maumful-main/CLAUDE.md` L134~139 · `cts-maum-main/CLAUDE.md` L73~74 |

**무엇이 문제인가** — 기독교 트랙의 성경 오인용은 이 서비스의 **신뢰 급소**다. 실제 사고가 있었다(`maumful-main/CLAUDE.md` L135: 응답이 *"하나님도 닷새 일하고 하루를 쉬셨어요"* — 창세기는 엿새 일하고 이레째 안식). 원인 구조는 **매 응답 성경 인용을 의무화하면 확신 없이도 지어낸다**는 것이다. 가드가 들어간 곳은 **`FALLBACK_BIBLICAL_CHAT` 한 곳뿐**이다. 원문 그대로(`src/index.tsx:1484`, `\n` 은 소스의 이스케이프):
```
- 성경을 인용할 땐 구절 내용과 책·장·절이 반드시 정확해야 합니다. 조금이라도 확실하지 않으면 인용하지 말고 당신의 말로 위로하세요. 구절·숫자·사건을 지어내지 마세요
…
**말씀** - 정확히 아는 구절만 1개 (책 이름·장·절 포함). 확실하지 않으면 이 항목은 생략하고 위로의 말로 대신하세요
```

가드가 **없는** 곳:
- `FALLBACK_BIBLICAL_PERSONA`(L1042) 끝 — `… 성경 구절은 책·장·절과 함께 인용하세요.` ← **장·절을 매번 강제**하는, 사고 원인 그 문장.
- `FALLBACK_BIBLICAL_FORMAT`(L1046) — `- 연결 말씀: 구절 전문 (책명 장:절 형식)` ← **구절 전문까지 강제.** 위험 최대.
- `migrations/0016_ai_config.sql` 시드 — `biblical_chat_system` 에 가드 줄이 **없고** 형식은 `**말씀** - 위로가 되는 성경 구절 1개 (책 이름·장·절 포함)`. `biblical_analysis_persona`·`biblical_analysis_format` 도 가드 이전 원문이며, `biblical_analysis_format` 시드는 **옛 4섹션판**이라 코드 폴백(5섹션)과도 어긋난다.

**DB 값이 코드 폴백을 이긴다.** `getAiConfig`(L1026~1033): `return row?.value?.trim() || fallback`. `maumful-main/CLAUDE.md` L137 은 *"CTS는 코드 폴백 + **운영 DB `ai_config` 3건**"* 이라 적는다 → **현재 운영 동작은 DB 행이 결정한다.** 시드가 `INSERT OR IGNORE` 라 운영 DB 는 덮어쓰이지 않지만, **DB 재구축·dev DB 신규 적용 시 가드 없는 시드가 그대로 들어간다.**

**확인 방법 — 원격 DB 실측이 선행조건이다. 코드만 보고 고치지 마라.**
```bash
cd cts-maum-main; L="npx wrangler d1 execute lightoflife-db --remote --command"
$L "SELECT key, updated_by, datetime(updated_at,'unixepoch') AS updated, length(value) AS len FROM ai_config ORDER BY key"
$L "SELECT key, (value LIKE '%지어내지 마세요%') AS has_guard, (value LIKE '%정확히 아는 구절만%') AS has_only_known FROM ai_config WHERE key LIKE 'biblical%'"
$L "SELECT key, value FROM ai_config WHERE key='biblical_analysis_format'"
grep -n "지어내지 마세요" src/index.tsx migrations/0016_ai_config.sql   # 코드 1건 / 시드 0건
```
**구현 방법 — ② 를 먼저 하고 ①③ 은 ② 결과로 판단한다.**

1. **코드 폴백 보강** — `FALLBACK_BIBLICAL_CHAT` 의 가드를 **그대로 복사**한다(새 문구를 쓰지 마라. 이미 감수된 표현이다).
   - `FALLBACK_BIBLICAL_PERSONA`(L1042): `성경 구절은 책·장·절과 함께 인용하세요.` → `성경을 인용할 땐 구절 내용과 책·장·절이 반드시 정확해야 합니다. 조금이라도 확실하지 않으면 인용하지 말고 당신의 말로 위로하세요. 구절·숫자·사건을 지어내지 마세요.`
   - `FALLBACK_BIBLICAL_FORMAT`(L1046): `- 연결 말씀: 구절 전문 (책명 장:절 형식)` → 마음풀 원문(`maumful-main/src/index.tsx:1492`)을 그대로: `- 연결 말씀: 정확히 아는 구절만 전문으로 (책명 장:절 형식). 구절 내용이나 장·절이 조금이라도 확실하지 않으면 이 줄을 통째로 생략하고, 말씀의 위로를 당신의 말로 전하세요. 성경 구절·숫자·사건을 지어내지 마세요.`
2. **시드 보강**(`0016_ai_config.sql`) — `biblical_chat_system`·`biblical_analysis_persona`·`biblical_analysis_format` 을 1번과 **동일한 최종 문구**로 맞춘다. `biblical_analysis_format` 시드는 옛 4섹션판이므로 **코드 폴백의 5섹션판(`[이어서 물어보기]` 포함)으로 통째 교체**해라 — 코드 주석(L1044~1045)이 *"같은 값이 DB(ai_config)에도 있으므로 DB도 함께 갱신해야 한다"* 고 이미 경고한다. ⚠️ `INSERT OR IGNORE` 라 **마이그레이션 수정만으로 운영 DB 는 안 바뀐다.** 재구축 대비가 목적이므로 그걸로 족하다 — **운영 DB 를 덮어쓰는 `UPDATE` 를 마이그레이션에 넣지 마라.**
3. **운영 DB 처리 — 사용자 확인 대상이다.** ② 쿼리 결과로 갈린다. `has_guard = 1` 이면 **DB 를 건드리지 마라**(코드·시드만 맞추고 실측값을 보고서에). `has_guard = 0` 또는 행이 없으면 **운영 중인 기독교 상담 프롬프트가 가드 없이 돌고 있다는 뜻**이다 — 값 변경은 **사용자에게 보이는 AI 응답 성향의 변경**이므로 §2.2 에 따라 **먼저 물어라**(보고서 §6). 승인되면 어드민 경로(`PUT /api/admin/ai-config/:key`, L4249)로 넣어야 `updated_by` 가 남는다. 어느 경우든 **문구는 이미 감수·승인된 것을 복사**하는 것이므로 "새 문구 작성"에 대한 별도 확인은 필요 없다.
4. `cts-maum-main/CLAUDE.md` L73 의 *"대상 = biblical_chat_system·biblical_analysis_format·biblical_analysis_persona + 코드 폴백"* 서술을 실제와 맞게 정정해라(지금 코드 폴백은 1곳뿐이라 사실과 다르다).

**검증 방법**
```bash
cd cts-maum-main && npx tsc --noEmit
grep -c "지어내지 마세요" src/index.tsx                   # → 3 (CHAT·PERSONA·FORMAT)
grep -c "지어내지 마세요" migrations/0016_ai_config.sql    # → 3
grep -c "4개 섹션만"     migrations/0016_ai_config.sql     # → 0 (4섹션 잔재 제거 확인)
grep -c "이어서 물어보기" migrations/0016_ai_config.sql    # → 2 (biblical·general 양쪽)
```
**라이브 검증(필수)** — `maumful-main/CLAUDE.md` L139: *"기독교 프롬프트를 건드릴 땐 반드시 ①성경 인용 케이스 ②위기 케이스를 라이브로 태울 것."* 두 케이스를 돌려 ① 성경 인용이 **정확하거나 생략**되는지 ② 위기 신호에 `자살예방상담전화 1393` 이 나오는지 확인하고 **응답 전문을 보고서 §2 에 붙여라.**

**주의** — **버그 수정이므로 유지보수 모드 허용 범위**(§1.5). 안전 수정이다. / 어드민 화면 편집자가 가드를 지울 수 있다(CLAUDE.md L74). 코드가 항상 덧붙이는 `noMd`·`mustKo`(L1060~1069) 방식이 더 튼튼하지만 **범위 확대이므로 여기서 하지 말고 보고서 §4 에 제안으로.** / `cts-maum-main` 은 서브모듈 — 내부 커밋 → push → **부모 레포 포인터 커밋**(§1.6). / `general_*` 키는 손대지 마라.

---

### [R-18] CTS 게임 딥링크 화이트리스트에 `qt` 가 빠져 `?game=qt` 가 조용히 무시된다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `cts-game-main/public/static/game_hub.jsx:2193` |
| 형제 서비스 | 마음게임 `game_hub.jsx:2258` — 같은 결함을 `worry` 로 이미 겪고 고쳤다. 이번엔 `qt` 차례 |
| 근거 | CTS 게임 설계서 §15 · RISKS R-18 · 복제 결함표 6행 |

**무엇이 문제인가** — `qt`(QT 묵상)는 **실재하는 게임**이다: `game_registry.jsx:189` 에 `id: 'qt'`, `game_hub.jsx:2328` 에 `if (activeGame === 'qt')`, `package.json` 의 `build:jsx` 목록에 `games/qt.jsx`. 그런데 화이트리스트만 **마음게임에서 복사한 8종 그대로**다 — `game_hub.jsx:2193` `const valid = ['garden', 'efmt', 'gratitude', 'tree', 'burnout', 'mood', 'focus', 'worry'];` + 다음 줄 `if (!valid.includes(gameParam)) return;`
→ `?game=qt` 로 들어오면 **에러도 로그도 없이 허브에 머문다.** 사용자는 링크가 죽었다고 느낀다.

**확인 방법**
```bash
grep -n "const valid = \[" {cts-game-main,maumgame-main}/public/static/game_hub.jsx
grep -n "id: *'qt'" cts-game-main/public/static/game_registry.jsx        # → 189
grep -rn "game=qt" cts-maum-main/ --include=*.jsx --include=*.tsx        # 호출부 실재 — 현장에서 확인할 것
```
재현: `https://<CTS 게임 도메인>/?game=qt` → 800ms 뒤에도 허브. `?game=worry` 는 진입된다.

**구현 방법** — 배열 끝에 `, 'qt'` 를 추가하는 **한 줄**이다. 이후 `npm run build:jsx` → `compiled/game_hub.js` **커밋**(CI 가 프론트를 빌드하지 않는다).
> 더 나은 방법: `game_registry.jsx` 의 목록에서 id 를 뽑아 화이트리스트를 **생성**하면 같은 사고(`worry` → `qt` 로 두 번 반복)가 재발하지 않는다. 다만 registry export 형태 확인 + 마음게임과 구조 맞춤이 필요하다 — **택했다면 보고서 §2 에 이유를 남기고 마음게임도 같이 맞춰라.** 리스크를 피하려면 최소 수정으로 끝내도 된다.

**검증 방법**
```bash
cd cts-game-main && npm run build:jsx
grep -c "'qt'" public/static/compiled/game_hub.js      # ≥2 (화이트리스트 + activeGame 분기)
```
**렌더 검증(필수)** — 배포 후 `?game=qt` → 약 0.8초 뒤 QT 묵상 자동 진입 + **주소창에서 `game` 파라미터 제거**(뒤로가기 중복 실행 방지). `?game=worry`·`?game=garden` 도 여전히 동작하는지 함께(기존 동작 무영향).

**주의** — 버그 수정이라 유지보수 모드 허용 범위. / `compiled/game_hub.js` 미커밋 시 배포는 옛 번들. / R-19 와 **같은 파일** — 한 번에 고치고 `build:jsx` 는 한 번만. / **BATCH_01 R-01 도 이 파일을 건드린다.**

---

### [R-19] `PHYWEB_URL` 하드코딩 잔재로 "The Light of Life으로 돌아가기"가 마음풀로 간다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `cts-game-main/public/static/game_engine.jsx:284-290` · 참조 `game_hub.jsx:240,727,2345,2385,2607` (5곳) |
| 형제 서비스 | — (마음게임은 같은 코드가 정답이다) |
| 근거 | CTS 게임 설계서 §15 · RISKS R-19 |

**무엇이 문제인가** — CTS 게임은 마음게임 파생본인데 **모(母)서비스 URL 이 마음풀 그대로**다(`game_engine.jsx:284-290`):
```jsx
// 마음풀 URL (maumgame은 마음풀에서 JWT SSO로 진입)
const PHYWEB_URL = (() => { const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  return 'https://maumful.com';  })();      // ← 마음풀 메인 홈페이지
const MAUMFUL_URL = PHYWEB_URL;             // 별칭 (기존 코드 호환)
```
UI 문구는 전부 CTS 인데 링크만 마음풀로 간다 — L240 `The Light of Life에서 검사하기 →` / L727 `로그인하고 시작하기 →` / L2345 `The Light of Life으로 돌아가기` / L2385 `← The Light of Life` / **L2607 `크레딧 충전하기 →` ← 가장 나쁘다. 크레딧은 CTS 계정 소유인데 마음풀 충전 페이지로 보낸다.** 같은 레포의 서버는 이미 정답을 안다 — `src/index.tsx:17`: *"CTS 자체 URL — … **마음풀(game.maumful.com)을 가리키면 안 된다.**"*

**확인 방법**
```bash
grep -n "PHYWEB_URL\|MAUMFUL_URL" cts-game-main/public/static/game_engine.jsx
grep -n "PHYWEB_URL" cts-game-main/public/static/game_hub.jsx        # 240,727,2345,2385,2607
grep -n "pattern = \|SERVICE_URL" cts-maum-main/wrangler.toml         # → jesusmaum.com
```
재현: 허브 우상단 `← The Light of Life` 클릭 → **maumful.com 으로 이탈**한다.

**구현 방법** — 상수 한 곳(L287)만 고치면 참조 5곳이 전부 따라온다: `return 'https://maumful.com';` → `return 'https://jesusmaum.com';` + 주석 2줄 정정("마음풀 URL" → "CTS 본체 URL"). `jesusmaum.com` 근거: `cts-maum-main/wrangler.toml` 의 `routes`(`jesusmaum.com`/`www.jesusmaum.com`, custom_domain) + `[vars] SERVICE_URL = "https://jesusmaum.com"` + `cts-maum-main/CLAUDE.md` L20 *"프로덕션 도메인: `jesusmaum.com` — `lightoflife.limyj007.workers.dev` 비활성"*.
- **변수명(`PHYWEB_URL`)·별칭(`MAUMFUL_URL`)은 그대로 둬라.** 이름 변경은 참조 5곳까지 건드리는 리팩터링이다.
- **로컬 폴백 `http://localhost:3001` 은 현장에서 확인할 것** — CTS 본체 dev 포트가 3001 인지 코드에서 확정하지 못했다. 이후 `npm run build:jsx` → `compiled/game_engine.js` 커밋.

**검증 방법**
```bash
cd cts-game-main && npm run build:jsx
grep -n "maumful.com" public/static/game_engine.jsx                  # → 0건
grep -c "jesusmaum.com" public/static/compiled/game_engine.js        # ≥1
grep -rn "maumful.com" public/static/compiled/ | grep -v "^Binary"   # → 0건
```
**렌더 검증(필수)** — 배포 후 5곳을 **직접 눌러라**: ① 검사 카드 "검사하기" ② 로그아웃 랜딩 "로그인하고 시작하기" ③ 에러 화면 "돌아가기"(네트워크 차단으로 유도) ④ 상단 네비 "← The Light of Life" ⑤ 크레딧 부족 모달 "크레딧 충전하기". **전부 `jesusmaum.com` 이어야 한다.**

**주의** — 버그 수정이라 허용 범위. 겸사겸사 다른 링크를 손보지 마라. / R-18 과 같은 레포·같은 빌드 — 함께 커밋. / 서버 `CTS_GAME_URL`(`src/index.tsx:18`)·`SERVICE_URL` 폴백은 대상 아님(R-49 로 별도). / SSO 토큰 전달 경로는 건드리지 마라.

---

### [R-22] 마음커플에 위기 감지·긴급 연락처 안내가 전무하다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 등재 / **실질 S2** — 싸움 중재·감정 번역을 다루면서 안전망이 0이다 |
| 대상 | `package/maumcouple/src/index.tsx` — `/emotion-translate`(L1351) · `/fight-mediate`(L1408) · `/coach`(L776) · `/kakao-analyze`(L1466) |
| 형제 서비스 | 정답 패턴 = 마음풀 `maumful-main/src/index.tsx:2702-2716` · 마음부부 `translation-prompts.ts:591` + `translate-route.ts:700-708` |
| 근거 | 마음커플 설계서 §11.3 · §15-7 · RISKS R-22 |

**무엇이 문제인가** — 마음커플 전체(`src/index.tsx` 1,693줄 + `couple_hub.jsx` 3,959줄)에 `자살`·`자해`·`위기`·`crisis`·`1393`·`109`·`1577` 이 **한 건도 없다**(`분위기` 가 부분 일치할 뿐). 사용자가 `/fight-mediate` 의 `situation` 이나 `/emotion-translate` 의 `message` 에 자해·자살 의사를 적어도 **코드가 보장하는 것이 없다.** 설계서 §11.3 이 이미 이렇게 적었다:
> ⚠️ **마음커플에는 위기 키워드 감지·긴급 연락처 안내 로직이 없다.** 마음풀 AI 상담과 마음부부에는 있으나 마음커플 프롬프트에는 자해·폭력 관련 지시가 전혀 없다.

**정답 패턴 ① 코드로 강제(마음풀)** — `maumful-main/src/index.tsx:2702`, 주석: *"안전 가드는 프롬프트가 아니라 코드로 강제"*. `chatCrisisKeywordHit(text)` 는 `text.normalize('NFC')`(⚠️ NFD 자모분리 우회 방어) 후 고신뢰 키워드만 매칭한다 — `/자살|자해|목숨.{0,5}끊|죽고\s*싶|살고\s*싶지\s*않|사라지고\s*싶|…/` + 영문 `/suicid|kill(ing)?\s+myself|want(ing)?\s+to\s+die|self[-\s]?harm|…/i`. 오탐("힘들어 죽겠다")을 줄이려 의도적으로 좁힌 것이다. 안내 문구 원문(L2716): `'지금 많이 힘드시죠. 그 마음을 꺼내 주셔서 고맙고, 혼자 견디지 않으셔도 괜찮아요. 24시간 언제든 곁에서 들어줄 곳이 있어요 — 자살예방 상담전화 109, 정신건강 위기상담 1577-0199.\n\n'`

**정답 패턴 ② 프롬프트 지시(마음부부)** — `translation-prompts.ts:591`: *"**crisis**: 자해·자살·폭력 피해 암시 → allowed=false이지만 이것은 '삭제'가 아니라 '보호 분기'"*. 서버가 `crisis_support: true` 를 내려보내고(`translate-route.ts:707`) 프론트가 UI 를 띄운다(`bubu_hub.jsx:507`): `자살예방 상담전화 109(24시간) · 긴급 시 112 · 1366 · 1388`.

**⚠️ 어디까지 이식할지는 사용자 확인 필요하다(§2.2).** 버그 수정이 아니라 **새 기능**이고 안내 문구는 사용자에게 보이는 문구다. **혼자 결정하지 말고 아래 단계안을 제시해 고르게 하라.**
| 단계 | 내용 | 비용 | 판단 |
|---|---|---|---|
| **1** | **긴급 연락처 안내 문구 노출** — 자유서술 라우트에서 키워드 적중 시 응답 `result` 맨 앞에 안내 문단을 **코드가** 붙인다 | 반나절 | **최소한 이건 넣어라.** 적중 없으면 무동작 = 기존 흐름 무영향 |
| **2** | 4개 시스템 프롬프트에 마음풀식 원칙 1줄(*"위기 신호를 보이면 즉시 안내"*) 추가 | +2시간 | 1과 함께면 이중 안전망 |
| **3** | 마음부부식 `crisis_support` 분기 + 전용 UI(전화 링크 카드) | +1일 | 프론트 변경 동반. **사용자 확인 필수** |

**확인 방법**
```bash
cd package/maumcouple
grep -rnE "자살|자해|1393|1577|crisis" src/index.tsx public/static/couple_hub.jsx | grep -v 분위기   # → 0건
grep -n "c.req.json() as {" src/index.tsx   # 자유서술: 1363(message)·1420(situation/myFeel/partnerFeel)·1478(sample). 응답은 전부 비스트리밍 JSON
```
**구현 방법 (1단계 기준)**
1. 마음풀 `chatCrisisKeywordHit`(L2702)을 **그대로 복사**한다. `normalize('NFC')` 포함 한 글자도 바꾸지 마라 — NFD 자모분리 한글이 완성형 정규식을 통째로 우회하는 문제 때문에 들어간 방어다. 안내 문구도 원문(L2716) 그대로 쓰되 **"연인" 맥락으로 바꿀지는 사용자에게 물어라.** 프론트가 `whiteSpace:'pre-wrap'` 로 렌더한다(`couple_hub.jsx:2254,2343,2503`) → **마크다운 기호 금지**, 줄바꿈은 `\n`.
2. 삽입 지점은 각 라우트의 `const result = json.content?.[0]?.text || ''` 바로 뒤:
```ts
const crisisHit = chatCrisisKeywordHit([situation, myFeel, partnerFeel].filter(Boolean).join('\n'))
return c.json({ success: true, result: crisisHit ? buildCoupleCrisisPrefix() + result : result })
```
**검사 대상은 사용자 입력이지 AI 출력이 아니다**(마음풀도 그렇다). `/coach`(L776)는 `messages` 배열이므로 마지막 user 메시지만 검사한다.
3. **크레딧 차감 흐름을 건드리지 마라.** 마음커플은 `spendCredits` 를 **AI 성공 후** 부른다(L1397~1400 주석: *"AI 성공 후 차감 — `spendCredits()`로 `WHERE credits >= ?` 원자적 처리"*). 위기 적중이어도 차감은 그대로(응답은 정상 제공된다). 차감 시점 변경은 BATCH_02 R-21 소관이다.

**검증 방법**
```bash
cd package/maumcouple && npx tsc --noEmit
C() { curl -s -X POST https://<마음커플 도메인>/api/couple/emotion-translate \
  -H "Authorization: Bearer $COUPLE_TOKEN" -H "Content-Type: application/json" -d "$1"; }
C '{"message":"요즘 그냥 다 싫고 죽고 싶어"}' | jq -r .result | head -3   # → 안내 문단이 맨 앞
C '{"message":"오늘 늦게 들어와서 서운했어"}'  | jq -r .result | head -3   # → 안내 없음 (과발동 방지)
C '{"message":"힘들어 죽겠다 진짜"}'           | jq -r .result | head -3   # → 안내 없음 (오탐 경계)
```
**렌더 검증(필수)** — 감정 번역 / 싸움 중재에서 위기 표현 입력 → 결과 카드 맨 위에 안내가 **줄바꿈이 살아서** 보이는지(pre-wrap), 마크다운 기호(`**`)가 노출되지 않는지. 마음커플에는 `render_smoke.cjs` 가 없다 → 브라우저로 직접.

**주의** — **새 기능이다. 승인 없이 3단계까지 밀고 가지 마라.** 승인 결과를 보고서 §6 에 기록. / 전화번호를 임의로 정하지 마라 — 마음풀 `109`·`1577-0199`, 마음부부 `109`·`112`·`1366`·`1388`, CTS `1393` 이 서로 다르다. **어느 것을 쓸지가 사용자 확인 사항이다.** / `/api/couple/timeline`(R-06)·크레딧 차감(R-21)은 다른 배치다.

---

### [R-26] 공감 반응(🤍)이 반쪽 — 표시만 되고 증가 API·버튼이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `maumbubu/public/static/bubu_hub.jsx:520` · `maumbubu/src/translate-route.ts:743-753` · `migrations/0001_maumbubu.sql:57` |
| 형제 서비스 | — (마음세대 커뮤니티도 동일 구조인지 **현장 확인**. 있으면 보고서 §4 에 기록만 하고 여기서 고치지 마라) |
| 근거 | 부부 설계서 §6 표 12행 · §15-3 · SPEC 7.3 "공감 반응만, 순위·경쟁 없음" |

**무엇이 문제인가** — 컬럼도 있고 조회도 하고 화면에도 나오는데 **올리는 길이 없다.** 프론트(`bubu_hub.jsx:520`)는 `🤍 {p.empathy_count || 0} · {(p.created_at || '').slice(0, 10)}` 을 표시용 `<div>` 로만 그리고, 서버 조회(`translate-route.ts:745-747`)는 `SELECT id, room, content, empathy_count, created_at FROM community_posts WHERE room = ? AND status = 'published' ORDER BY created_at DESC LIMIT ?` 다. `grep -rn "empathy" maumbubu/` 의 전부가 이 3곳 + DDL 2곳이다. **UPDATE 문이 0건** → 값은 영원히 0. 사용자에게는 "아무도 공감하지 않는 커뮤니티"로 보인다.

**확인 방법**
```bash
grep -rn "empathy" maumbubu/src/ maumbubu/public/static/ maumbubu/migrations/   # UPDATE 0건
grep -rn "empathy" maumsedae/src/ maumsedae/public/static/                      # 형제 여부
npx wrangler d1 execute maumful-db --remote --command \
  "SELECT COUNT(*) posts, SUM(empathy_count) total FROM community_posts"        # total = 0 이면 재현
```
**구현 방법**
1. **멱등 테이블을 먼저 만든다**(중복 클릭 방지). `empathy_count` 만 `+1` 하면 새로고침·따닥 클릭으로 무한 증가한다. `migrations/0004_empathy.sql`:
```sql
CREATE TABLE IF NOT EXISTS community_empathy (
  post_id INTEGER NOT NULL, author_hash TEXT NOT NULL,   -- user_id 직접 저장 금지 (hashAuthor 결과)
  created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (post_id, author_hash));
```
`author_hash` 를 쓰는 이유는 `community_posts` 가 `user_id` 를 저장하지 않는 것과 같은 프라이버시 원칙(DDL 주석 L186: *"익명 해시 (user_id 직접 저장 금지)"*)이다. 해시는 서버에서 `hashAuthor(c.get('uid'))`(`translate-route.ts:113`)로 만든다 — **클라이언트가 보낸 값을 믿지 마라**(`[fix③]` 주석이 그 사고를 기록하고 있다).
2. **증가 라우트 1개**(`/community/posts` 조회 라우트 뒤, L753 근처). `try/catch` + 400/500 처리는 이 파일 관행 그대로:
```ts
const authorHash = await hashAuthor(c.get('uid'));   // 클라이언트 값 금지
// 멱등: 이미 누른 사람이면 INSERT 가 무시되고 changes = 0 → 카운트 증가 안 함
const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO community_empathy (post_id, author_hash) VALUES (?, ?)').bind(postId, authorHash).run();
if (!ins.meta.changes) {
  const cur = await c.env.DB.prepare('SELECT empathy_count FROM community_posts WHERE id = ?').bind(postId).first<{ empathy_count: number }>();
  return c.json({ ok: true, already: true, empathy_count: cur?.empathy_count ?? 0 });
}
const row = await c.env.DB.prepare("UPDATE community_posts SET empathy_count = empathy_count + 1 WHERE id = ? AND status = 'published' RETURNING empathy_count").bind(postId).first<{ empathy_count: number }>();
return c.json({ ok: true, empathy_count: row?.empathy_count ?? 0 });
```
**멱등 처리의 핵심**: 카운터를 직접 올리지 않고 **`INSERT OR IGNORE` 의 `meta.changes` 로 선판정**한다. 이 파일이 이미 쓰는 관용구다(BATCH_01 R-05 의 `if (!r.meta.changes)` 와 같은 패턴). "이미 눌렀음"은 **에러가 아니라 `already: true`** 로 돌려줘야 프론트가 조용히 처리할 수 있다. 취소(토글)는 **넣지 마라** — "순위·경쟁 없음" 정신에서 벗어나고 범위가 커진다.
3. **프론트 버튼**(`bubu_hub.jsx:520` 교체) — 표시용 `<div>` 를 버튼으로 바꾸고 낙관적 갱신 + 실패 시 롤백. 응답의 `empathy_count` 로 최종 확정하고, 누른 뒤 `disabled` 처리. `api()` 헬퍼의 실제 시그니처는 **같은 파일에서 현장 확인**해라. 클라이언트 세션 한정 플래그라 새로고침하면 다시 누를 수 있지만 **서버가 멱등이라 카운트는 늘지 않는다.** 서버가 "내가 눌렀는지"를 목록에 실어 보내는 안은 조회 응답 스키마 변경이라 범위가 커진다(하려면 보고서 §2 에 이유를 남겨라).

**검증 방법**
```bash
cd maumbubu && npx tsc --noEmit && npx wrangler d1 execute maumful-db --remote --file=./migrations/0004_empathy.sql
E() { curl -s -X POST https://bubu.maumful.com/api/community/empathy -H "Authorization: Bearer $1" \
      -H "Content-Type: application/json" -d "{\"postId\":$2}"; }
E "$TOKEN_A" 1       # → {"ok":true,"empathy_count":1}
E "$TOKEN_A" 1       # → {"ok":true,"already":true,"empathy_count":1}   ← 멱등 (핵심)
E "$TOKEN_B" 1       # → {"ok":true,"empathy_count":2}
E "$TOKEN_A" 999999  # → {"ok":true,"empathy_count":0}   ← 없는 id, 500 이 아니어야
node scripts/render_smoke.cjs public/static/bubu_hub.jsx
```
**렌더 검증(필수)** — 커뮤니티 탭 → 🤍 클릭 → 숫자 즉시 +1, 버튼 비활성. 새로고침 후에도 숫자 유지, 다시 눌러도 늘지 않는다.

**주의** — `render_smoke.cjs` 는 **파일 인자를 빠뜨리면 기본값 `landing.js` 를 찾다가 ENOENT 로 죽는다**(부부 설계서 §15-12). / `build:jsx` 후 `compiled/bubu_hub.js` 커밋. / **순위·정렬 금지** — DDL 주석 L191 `-- 공감 반응 수 (순위·경쟁 UI 금지)`. / **BATCH_01 R-05·R-23 이 같은 파일들을 건드린다.**

---

### [R-27] 마음세대 프롬프트가 여전히 부부 문구다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 — **지금 출력은 정상이다. 잠재 결함이다** |
| 대상 | `maumsedae/src/translation-prompts.ts` — `MODE_MODULES`(L419~520) · `MODE_INPUT_LABEL`(L576~581) · `memoryModule`(L526~546, 특히 L528) · `buildMemoryUpdatePrompt`(L667) · `buildFeedbackPrompt`(L725) · `buildModerationPrompt`(L776·789) · `psychologyTrackModule`(L350) |
| 형제 서비스 | 마음부부가 **진본**이다 — **절대 건드리지 마라**(세대 설계서 §15-9) |
| 근거 | 세대 설계서 §2.3 · §15-1 · RISKS R-27 |

**왜 고쳐야 하는가 — 지금 출력이 멀쩡한데도** — 이 파일은 이미 한 번 사고를 냈다. `translation-prompts.ts:105-108` 주석 원문:
> ⚠️ 프리앰블은 프롬프트 **최상단**이라 여기서 정한 정체성이 뒤의 모든 지시를 이긴다.
> 파생 초기에 "당신은 '마음부부'의 관계 통역가입니다. 부부 사이의 대화를…"을 그대로 두었더니, 부모-자녀 입력에 **배우자 갈등 통역**이 나왔다(실측).

고친 것은 **프리앰블뿐**(`commonPreamble`, L109~)이다. 조립 순서(L607~620)가 프리앰블 → 청소년 → 관계맥락 → 트랙 → `MODE_MODULES` → `memoryModule` → … 이라 **최상단이 정체성 싸움에서 이기고**, 그래서 뒤에 부부 문구가 남아도 현재 실출력은 정상으로 보인다(케이스뱅크 v2 확인). 그러나:
- **프리앰블을 손대는 순간 방어가 무너진다.** 문구를 다듬거나 섹션 순서를 바꾸면 뒤의 "배우자에게서 들은 말"·"부부 대화 전체"가 드러난다. 같은 사고의 **두 번째** 재현이다.
- `MODE_INPUT_LABEL`(L576)은 프리앰블 보호를 **아예 받지 않는다.** system 이 아니라 userMessage 헤더로 들어간다(L630): `userMessage: \`${userContextLine}[${MODE_INPUT_LABEL[mode]}]\n${config.input}\`` → 부모-자녀 사용자가 쓴 글 바로 위에 `[배우자에게서 들은 말]` 이 붙는다. **여기가 가장 먼저 새는 곳이다.**
- `memoryModule`(L528)의 `## 이 부부의 관계 기억` 은 memory 가 있을 때만 주입된다 → 초기 케이스뱅크로는 안 잡히는 구간이다.

**확인 방법**
```bash
cd maumsedae; grep -n "const MODE_MODULES\|const MODE_INPUT_LABEL\|function memoryModule\|이 부부의 관계 기억\|당신은 '마음부부'\|당신은 부부 관계 프로파일 관리자\|아내의 비난" src/translation-prompts.ts
#  → 419 / 576 / 526 / 528 / 725·776 / 667 / 350
git -C ../maumbubu status --short src/translation-prompts.ts   # 진본이 깨끗한지 미리 확인
```
**구현 방법** — ① **치환**(부모-자녀 비대칭 관계를 존중해라. "상대"는 부모일 수도 자녀일 수도 있다):
| 위치 | 현재 → 대체 |
|---|---|
| `MODE_MODULES` receive(L422·430)·send(L442·453)·perspective(L494·498·501·503·508·509·518) | **배우자** → **상대(부모 또는 자녀)** — 설명문·`check_question`·`risk_in_original` 안내까지 전부 |
| `MODE_MODULES.mediate`(L468) | 사용자가 **부부 대화**(카톡 등) 전체를 → 사용자가 **대화**(카톡 등) 전체를 |
| `MODE_INPUT_LABEL`(L577~580) | 배우자에게서 들은 말 / 배우자에게 하고 싶은 말 / 분석할 **부부 대화** 전체 / **배우자** 관점에서 → 상대…·대화 전체·상대 관점에서 |
| `memoryModule`(L528·540) | `## 이 **부부**의 관계 기억` → `## 이 **관계**의 기억` / `이 **부부**에게 통(通)했던 표현` → `이 **관계**에서 통했던 표현` |
| `buildMemoryUpdatePrompt`(L667) | 당신은 **부부 관계** 프로파일 관리자입니다 → 당신은 **관계** 프로파일 관리자입니다 |
| `buildFeedbackPrompt`(L725) · `buildModerationPrompt`(L776) | **'마음부부'** → **'마음세대'** |
| `buildModerationPrompt`(L789) | **시가·처가·배우자**에 대한 불만 토로 → **부모·자녀·시가·처가**에 대한 불만 토로 |
| `psychologyTrackModule`(L350) | 예시 "아내의 비난 / 남편의 담쌓기" → 부모-자녀 맥락으로(예: "부모의 잔소리 = 통제를 잃을까 봐 두려운 항의 / 자녀의 침묵 = 평가받는다고 느껴 얼어붙음") |

② **`commonPreamble`(L109~127)은 건드리지 마라** — 이미 분기됐고 검증된 방어선이다. ③ **JSON 출력 키 이름을 절대 바꾸지 마라**(`partner_view`·`partner_feeling`·`your_feeling_first` 등). 프론트가 그 키로 렌더한다. **설명 문구만** 바꾼다. ④ 마음부부 `src/translation-prompts.ts` 는 **한 글자도** 건드리지 마라.

**검증 방법**
```bash
cd maumsedae && npx tsc --noEmit
grep -c "배우자" src/translation-prompts.ts       # commonPreamble L111 의 '배우자는' 분기만 남아야 한다
grep -c "마음부부" src/translation-prompts.ts     # → 1 (L106 사고 기록 주석만. 주석은 지우지 마라)
git -C ../maumbubu diff --stat src/translation-prompts.ts   # → 빈 출력 (진본 무변경 증명)
node scripts/render_smoke.cjs public/static/sedae_hub.jsx
```
**회귀 검증(필수) — 이게 이 이슈의 핵심이다.** 기준값은 `maumsedae/casebank/BATCH_01_TEEN.md` 의 ⑤ 교정본(머리말: *"감수 확정 시 ⑤가 **회귀 테스트 기준값**이 된다"*). 판정 근거는 `maumsedae/review/BATCH_01_TEEN_RESULT.md`.
1. **6케이스(CASE-T01~T06)를 전부 실제 엔진에 태워라.** 손으로 쓴 이상적 문장이 아니라 배포 엔진 실출력과 비교한다. **안전 등급이 케이스뱅크 표와 일치해야 한다**: T01=T3(미발동) / T02=**T2** / T03=**T2** / T04=T1 / T05=**T2** / T06=T3(미발동). **T2 3건이 T3 으로 내려가면 회귀다** — 감수 판정 1("내담자를 보호하는 것이 우선이기에 거리두기를 지지", 청소년 한정)이 무너진 것이다. 말투는 **전 응답 존댓말**(감수 판정 5).
3. `memoryModule` 은 memory 가 있어야 주입된다 → **재사용자 시나리오를 한 번 더**(기억이 쌓인 relation 으로 통역 2회차). 케이스뱅크 6건은 "관계기억 없음(첫 사용)" 전제라 이 경로를 덮지 않는다.
4. 결과를 `review/` 에 새 파일로 남기지 말고 **보고서 §2 검증 항목에 케이스별 판정(T등급·존댓말·부부 문구 노출 유무)을 표로** 적어라. 
**렌더 검증** — 통역 결과 화면(수신·발신·중재·관점 4모드) + 관계 기억 화면(`sedae_hub.jsx:649,653`)이 오류 없이 뜨는지.

**주의** — **출력 JSON 키 변경 금지.** / `teenModule`·`teenSafetyOverride`·`forceTeenSafetyBlock` 의 **조립 순서를 바꾸지 마라** — L616~619 주석에 *"SAFETY_OVERRIDE **뒤**여야 한다 — 앞에 두면 위 'T2 과발동 방지'가 이걸 덮어쓴다(실측)"*. / L106 주석은 **문서이지 프롬프트가 아니다. 지우지 마라.** / R-28 과 같은 레포 — 커밋은 나눠도 회귀 검증은 함께.

---

### [R-28] 이중 폭풍 장기기억(`past_patterns`·`life_stage`)이 컬럼만 있고 배선이 없다

| 항목 | 내용 |
|---|---|
| 심각도 | S3 |
| 대상 | `migrations/0001_maumsedae.sql:33-34` · `src/translation-prompts.ts:47-58`(인터페이스) · `src/translate-route.ts:256-274`(loadMemory) · `:276-300`(saveMemory) · `src/translation-prompts.ts:657-685`(buildMemoryUpdatePrompt) |
| 형제 서비스 | — (마음세대 고유 확장. 마음부부에는 없는 필드다) |
| 근거 | 세대 설계서 §15-2 · §3 표 18행 · `maumsedae/CLAUDE.md` L17 |

**무엇이 문제인가** — `CLAUDE.md` L17 이 *"`past_patterns`·`life_stage`가 이중 폭풍 장기기억"* 이라고 **핵심 차별화로 선언**하고 마이그레이션 주석(L24)도 `-- ★ … 이 앱의 핵심 차별화.` 라고 적는데, **컬럼 외에는 아무것도 없다. 항상 NULL 이다.**
**배선이 빠진 곳 4군데 — 전부 열어서 확인해라.** ① `RelationshipMemory`(`translation-prompts.ts:47-58`) — 필드 자체가 **없다**(`recurringTopics`·`psychologyProfile`·`christianProfile`·`successPatterns`·`partnerPerspective` 5개뿐). ② `loadMemory`(`translate-route.ts:267-273`) — `SELECT *` 로 읽지만 **매핑에서 빠진다**(위 5개만 return, `row.past_patterns`·`row.life_stage` 를 읽지 않는다). ③ `saveMemory`(`translate-route.ts:279-298`) — INSERT 컬럼 목록·`ON CONFLICT DO UPDATE SET`·`.bind()` **셋 다** 7컬럼만 다룬다. ④ `buildMemoryUpdatePrompt`(`translation-prompts.ts:674-681`) — AI 가 채울 JSON 스키마에 두 필드가 **없다**. 즉 `parseTranslationResponse<RelationshipMemory>`(호출부 `translate-route.ts:492-501`)가 값을 만들 방법 자체가 없다. 그리고 주입도 없다 — `memoryModule`(L526-546)에 두 필드를 프롬프트에 넣는 줄이 없다.

**확인 방법**
```bash
cd maumsedae
grep -rn "past_patterns\|life_stage\|pastPatterns\|lifeStage" src/ public/    # → 0건 (migrations 에만)
npx wrangler d1 execute maumful-db --remote --command \
  "SELECT COUNT(*) rows, COUNT(past_patterns) pp, COUNT(life_stage) ls FROM sedae_relation_memory"
#   → rows > 0 인데 pp = 0 AND ls = 0 이면 재현
```
**구현 방법 — 4곳 + 주입 1곳. 순서대로.**
1. **인터페이스**(L57 뒤) — 마이그레이션 주석의 정의를 그대로: `pastPatterns?: string;`(과거 형성 패턴 요약) / `lifeStage?: string;`(cohabit·distant·caregiving). `life_stage` 는 **열거값**이지만(마이그레이션 L34) 유니온으로 좁히면 AI 가 다른 문자열을 뱉었을 때 타입이 거짓말이 된다 → **`string` 으로 받고 `saveMemory` 에서 화이트리스트 검증**을 권장한다.
2. **`loadMemory`**(L272 뒤): `pastPatterns: row.past_patterns || undefined,` / `lifeStage: row.life_stage || undefined,`. **`safeParse` 를 쓰지 마라** — 둘 다 JSON 배열이 아니라 평문이다.
3. **`saveMemory`**(L279~298): **네 곳을 모두** 고쳐야 한다(하나라도 빠뜨리면 바인딩 개수가 어긋나 런타임 에러다) — ① INSERT 컬럼 목록에 `past_patterns, life_stage` ② `VALUES` 의 `?` 2개 추가 ③ `ON CONFLICT … DO UPDATE SET` 에 `past_patterns = excluded.past_patterns, life_stage = excluded.life_stage` ④ `.bind(...)` 끝에 `mem.pastPatterns ?? null` 과 **화이트리스트 검증한** `lifeStage`(`['cohabit','distant','caregiving'].includes(mem.lifeStage ?? '') ? mem.lifeStage : null`).
⚠️ `saveMemory` 는 **전체 덮어쓰기**(`excluded.*`)다. AI 가 이번 턴에 `pastPatterns` 를 안 돌려주면 기존 값이 NULL 로 날아간다. 기존 필드에 *"갱신 없으면 기존 유지"* 지시가 붙은 이유가 이것이다 — **새 필드에도 같은 지시를 반드시 넣어라**(4번).
4. **`buildMemoryUpdatePrompt`**(L674-681) 출력 JSON 스키마에 2줄 추가:
```
  "pastPatterns": "사용자가 과거(청소년기 등) 이 관계에서 형성한 패턴 요약 (2문장 이내, 반복 확인된 것만. 갱신 없으면 기존 유지)",
  "lifeStage": "현재 생애 국면 — cohabit(동거) / distant(원거리) / caregiving(간병) 중 하나만. 판단 근거가 없으면 빈 문자열"
```
기존 규칙(*"확실하지 않은 것은 넣지 않습니다"*, *"개인 식별 정보 제외"*)이 그대로 적용된다 — **그 규칙 블록을 건드리지 마라.**
5. **주입**(`memoryModule`, L544 근처 `partnerPerspective` 다음). 없으면 저장만 하고 쓰지 않는 셈이다:
`if (memory.pastPatterns) parts.push('- 과거 형성 패턴: … — 지금의 반응이 과거에 만들어진 것일 수 있음을 가설로만 연결합니다.')` + `if (memory.lifeStage) parts.push('- 현재 생애 국면: <동거 중|원거리|간병 중> — 활동을 제안할 때 이 국면에서 가능한 것만 제안합니다.')`. `lifeStage` 를 활동 제안에 거는 것이 "이중 폭풍"의 실질이다(원거리인 사람에게 "오늘 같이 밥 먹기"를 권하지 않게 된다).
6. **프론트 노출**(`sedae_hub.jsx` L649~653 근처)은 **선택**이다. 두 항목을 화면에 보일지는 **사용자에게 보이는 화면 변경** → 넣으려면 물어라(§2.2). 서버 배선만으로 이슈는 해소된다.

**검증 방법**
```bash
cd maumsedae && npx tsc --noEmit; W="npx wrangler d1 execute maumful-db --remote --command"
# 통역 2회 실행 (기억 갱신은 waitUntil 비동기 — 두 번째 호출 뒤 몇 초 기다려라)
$W "SELECT relation_id, user_id, past_patterns, life_stage, updated_at FROM sedae_relation_memory ORDER BY updated_at DESC LIMIT 5"
#   → past_patterns 에 값 / life_stage 는 cohabit|distant|caregiving|NULL 중 하나
$W "SELECT COUNT(*) FROM sedae_relation_memory WHERE recurring_topics IS NOT NULL"   # 기존 컬럼 무영향
curl -s "https://<세대 도메인>/api/memory?relationId=<내 관계>" -H "Authorization: Bearer $SEDAE_TOKEN" | jq
node scripts/render_smoke.cjs public/static/sedae_hub.jsx
```
**렌더 검증(필수)** — 세대 허브 → 🧠 관계 기억 → 기존 항목(반복되는 주제·상대의 인식 습관)이 **그대로 보이고** 새 항목은 값이 있을 때만 추가로 보인다. 6번을 안 했어도 **응답 필드가 2개 늘었으므로** 화면이 깨지지 않는지 한 번은 확인해라.

**주의** — `sedae_relation_memory` 는 **(relation_id, user_id) 복합키**다. 마이그레이션 L21~23 경고: *"단일키면 상대의 기억이 내 통역 프롬프트에 주입된다 … 아이가 입력한 학대 정황 요약이 부모 계정 통역에 새면 아이가 위험해진다."* **`ON CONFLICT(relation_id, user_id)` 를 절대 단일키로 바꾸지 마라.** / `pastPatterns` 에 개인 식별 정보나 학대 정황 **원문**이 들어가면 안 된다 — 기존 프라이버시 규칙 블록을 지우지 마라. / `waitUntil` 실패는 조용히 스킵된다(`translate-route.ts:503-505`) — **값이 안 들어가도 에러가 안 난다. 반드시 DB 로 확인해라.** / `RelationshipMemory` 는 마음부부에서 상속된 타입이다 — **마음세대 파일만** 고친다.

---
## 2. 커밋 분리 (§1.7)

```
[maumgame]    R-08 번아웃 metadata 키 수용 + energy 추가
[cts]         R-08 게임 트윈 동일 수정 / R-18 qt 딥링크 / R-19 PHYWEB_URL   ← cts-game-main (부모 레포 안)
[cts]         R-12 성경 정확성 가드 폴백·시드 반영                          ← cts-maum-main (서브모듈)
[maumbubu]    R-26 공감 반응 증가 API + 버튼 + 마이그레이션
[maumsedae]   R-27 프롬프트 부부 문구 정정 / R-28 이중 폭풍 장기기억 배선
[maumcouple]  R-22 위기 감지 1단계 (사용자 승인 후)
[공통]        BATCH_05 결과 보고서 + RISKS.md 갱신
```
`cts-maum-main` 커밋 후 **부모 레포 포인터 커밋**을 잊지 마라(§1.6). `cts-game-main` 은 서브모듈이 아니다.

---
## 3. 이 배치의 완료 기준

- [ ] **R-08** — 원격 `game_session_logs` 실측 건수 기록 · 서버가 두 키 모두 수용 · 플레이 1회 후 세션 로그에 `energy` 키 확인 · 집계 1회 태워 `weekly_reports` 에 `avg_energy > 0` 행 생성 · 척도/임계값 판단 근거 기록 · **양쪽 레포** + `build:jsx` 재컴파일 커밋 · 브라우저 렌더 검증
- [ ] **R-12** — **원격 `ai_config` 실측(키별 `has_guard`) 기록** · 코드 폴백 3곳(`grep -c` → 3) · 시드 3건 동기화 + 4섹션 잔재 0건 · DB 갱신 여부를 사용자에게 물었고 답을 §6 에 기록 · **성경 인용 + 위기 케이스 라이브 1회씩, 응답 전문 첨부** · `CLAUDE.md` L73 정정
- [ ] **R-18** — `?game=qt` 자동 진입 + 주소창 파라미터 제거 · 기존 8종 무영향 · `compiled/game_hub.js` 커밋
- [ ] **R-19** — `grep "maumful.com" public/static/` 0건(compiled 포함) · **허브 5곳 직접 클릭**해 전부 `jesusmaum.com` · localhost 폴백 포트 현장 확인 결과 기록
- [ ] **R-22** — **범위(1/2/3단계)와 전화번호를 물었고 답을 §6 에 기록** · 승인 범위만 구현 · 위기 적중 / 일상 미적중 / "힘들어 죽겠다" 미적중 3종 · 크레딧 차감 흐름 무변경 · 렌더 검증(pre-wrap·마크다운 미노출)
- [ ] **R-26** — 마이그레이션 적용 · 같은 사용자 2회 호출 시 `already: true` + 카운트 불변(**멱등**) · 다른 사용자 +1 · 없는 postId 500 아님 · `render_smoke.cjs` 통과 · 🤍 클릭 렌더 검증 · `compiled/bubu_hub.js` 커밋
- [ ] **R-27** — `grep -c "마음부부"` → 1(주석만) · **`git -C maumbubu diff --stat` 빈 출력(진본 무변경)** · **케이스뱅크 6케이스 회귀 — T등급 6건 일치 + 존댓말 통일, 케이스별 판정 표 첨부** · 기억 있는 재사용자 1회 · JSON 키 무변경 · 렌더 검증
- [ ] **R-28** — 4곳 + 주입 1곳 전부 배선 · 통역 2회 후 `past_patterns` 에 값 · `life_stage` 가 화이트리스트 값 또는 NULL · 기존 컬럼 무영향 · 복합키 `ON CONFLICT` 무변경 · 렌더 검증
- [ ] 서비스별 커밋 분리 + `cts-maum-main` 부모 포인터 커밋 완료 · 배포 완료 또는 미배포 사유 기록(`wrangler deploy` 는 **포그라운드**)
- [ ] `docs/DESIGN.md` §15 갱신 + 개정 이력 한 줄(**게임·CTS 게임·CTS 본체·커플·부부·세대 6곳**) · `_docs/RISKS.md` 의 R-08·12·18·19·22·26·27·28 해소 표기
- [ ] 결과 보고서 작성 완료

---
## 4. 결과 보고서

작성 경로: **`_docs/작업지시서/결과/BATCH_05_결과.md`** — 양식은 **BATCH_00 §3.1 템플릿 그대로**. `[공통]` 커밋으로 함께 올린다.

**§3(전제 불일치)에 최소 아래 3건은 들어가야 한다** — 지시서 작성 중 코드에서 이미 확인된 것이다.
| 이슈 | 지시서/RISKS 의 전제 | 실제 코드 |
|---|---|---|
| R-08 | "키 이름만 맞추면 된다" | **의미도 다르다.** `energy_gained`(오늘 획득 합, 척도 상한 150)와 서버가 기대하는 `energy`("스스로 매긴 에너지 0~100", `index.tsx:1461` 주석)는 다른 값이다. 키만 맞추면 `avgEnergy < 40` 이 과발동한다 |
| R-12 | "가드가 코드 폴백 1곳에만 있다" | 맞지만 **`getAiConfig`(L1026) 때문에 DB 값이 코드 폴백을 이긴다.** `maumful-main/CLAUDE.md` L137 은 CTS 가드가 "운영 DB `ai_config` 3건"에 있다고 적는다 → **현재 운영 동작은 원격 실측 전에는 알 수 없다.** 게다가 `biblical_analysis_format` 시드는 옛 **4섹션판**이라 코드 폴백(5섹션)과도 어긋난다 |
| R-27 | "`MODE_MODULES` 등이 프롬프트에 남아 있다" | 맞지만 **`MODE_INPUT_LABEL`(L576)은 system 이 아니라 `userMessage` 헤더로 들어간다**(L630) — 프리앰블 보호를 아예 받지 않는 유일한 항목이다 |

**§4(새로 발견한 것)에 기록할 것** — 이 배치에서는 고치지 않는다.
| # | 내용 | 심각도 추정 | 조치 |
|---|---|---|---|
| 1 | `tree.jsx:324` 가 보내는 `stages_completed`·`answers_filled` 를 **서버에서 읽는 코드가 0건** — R-08 과 같은 종류의 죽은 metadata(게임 2종 공통) | S3 | 범위 밖. RISKS 추가 후보 |
| 2 | CTS `ai_config` 는 어드민에서 편집 가능(`PUT /api/admin/ai-config/:key`, L4249) → **가드를 지울 수 있다.** `noMd`·`mustKo`(L1060~1069)처럼 코드가 항상 덧붙이는 방식이 더 튼튼 | S3 | 범위 확대. 제안만 |
| 3 | 마음커플 `/api/couple/coach` 의 KV 일일 카운터(`couple_coach:{uid}:{date}`)에 **TTL 이 있는지 현장 확인 필요**(마음세대 성인 카운터가 TTL 없이 영구 저장된 전례) | S3 | 확인 후 기록 |
| 4 | 마음세대 커뮤니티에도 `empathy_count` 계열 반쪽 구현이 있는지 **현장 확인**(R-26 형제 여부) | S3 | 있으면 기록만 |

> 위 표를 그대로 옮기지 말고 **실제로 코드를 열어 확인한 결과로 갱신해서** 써라. 라인 번호가 다르면 문자열로 다시 찾고 실제 라인을 적어라(§1.1).
