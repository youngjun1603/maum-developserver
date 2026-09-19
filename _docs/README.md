# 마음(maum) 서비스 설계서 인덱스

> 이 폴더는 **전 서비스 설계서의 진입점**이다. 각 서비스의 상세 설계서는 해당 폴더의 `docs/DESIGN.md` 에 있다.
> 표준 목차는 `_TEMPLATE.md`. 새 서비스를 만들면 같은 목차로 `docs/DESIGN.md` 를 만든다.
>
> **최초 작성 2026-09-19** · **갱신 2026-09-19**(외부 메모리 참조를 코드에서 복원해 대체) — 코드·설정·migrations·CLAUDE.md 를 1차 근거로 작성. 추측한 내용은 없으며, 확인 못 한 항목은 각 문서에 `⚠️ 미확인` 으로 표기돼 있다.

---

## 1. 설계서 목록

| 서비스 | 폴더 | 설계서 | 분량 | 미확인 |
|---|---|---|---|---|
| 마음풀 | `maumful-main/` | [docs/DESIGN.md](../maumful-main/docs/DESIGN.md) | 787줄 | 9 |
| 마음게임 | `maumgame-main/` | [docs/DESIGN.md](../maumgame-main/docs/DESIGN.md) | 354줄 | 7 |
| 마음커플 | `package/maumcouple/` | [docs/DESIGN.md](../package/maumcouple/docs/DESIGN.md) | 410줄 | 11 |
| 마음부부 | `maumbubu/` | [docs/DESIGN.md](../maumbubu/docs/DESIGN.md) | 514줄 | 6 |
| 마음세대 | `maumsedae/` | [docs/DESIGN.md](../maumsedae/docs/DESIGN.md) | 567줄 | 3 |
| 마음수달 | `maumotter/` | [docs/DESIGN.md](../maumotter/docs/DESIGN.md) | 524줄 | 5 |
| 마음곁 | `maumgyeot/` | [docs/DESIGN.md](../maumgyeot/docs/DESIGN.md) | 550줄 | 4 |
| CTS 본체 | `cts-maum-main/` | [docs/DESIGN.md](../cts-maum-main/docs/DESIGN.md) | 635줄 | 10 |
| CTS 게임 | `cts-game-main/` | [docs/DESIGN.md](../cts-game-main/docs/DESIGN.md) | 359줄 | 9 |

- **[RISKS.md](RISKS.md)** — 설계서·지시서 작성 중 확인된 결함·리스크 60건을 심각도순으로 모은 등록부. **이게 실무에서 가장 먼저 볼 문서다.**
- **[작업지시서/](작업지시서/)** — RISKS.md 를 Claude Code 가 실행할 수 있게 배치별로 나눈 작업 지시서 6종 + 공통 규칙·보고 양식([BATCH_00_README.md](작업지시서/BATCH_00_README.md)). 결과 보고서는 [작업지시서/결과/](작업지시서/결과/) 에 쌓인다.

> ⚠️ **`maum/시스템 설계서/` 폴더는 설계서의 사본이며 git 미추적이다.** 정본은 각 서비스의 `docs/DESIGN.md` 와 `_docs/` 다. 사본을 고치면 커밋되지 않고 사라진다.
- 트윈 문서(CTS 2종)는 **차이점 중심**이다. 공통 내용은 마음풀·마음게임 설계서로 위임한다.
- 마음수달·마음곁 설계서는 기존 `docs/*-spec.md` 를 대체하지 않고 **통합 진입 문서**로 링크 위임한다.

---

## 2. 생태계 3분할 ⚠️ 규칙을 섞으면 사고 난다

| | **마음풀 생태계** | **마음 시리즈** | **CTS 트윈** |
|---|---|---|---|
| 서비스 | 마음풀·게임·커플·부부·세대 | 수달·곁 | CTS 본체·CTS 게임 |
| 도메인 D1 | `maumful-db` **공유** | `maumotter-db` / `maumgyeot-db` **분리** | `lightoflife-db` |
| 계정 원천 | `maumful-db.users` | **`maum-auth`** 공용 D1 | `lightoflife-db.users` |
| 프론트 빌드 | esbuild 사전컴파일 | **React CDN · 빌드 없음** | esbuild (Tailwind는 CDN 유지) |
| 배포 | `wrangler deploy` (포그라운드) | GitHub 웹UI → CF 자동배포 | `wrangler deploy` + GH Actions |
| SSO | `?t=` 토큰 | 공유 `JWT_SECRET` + `maum-auth` | 별도 (소셜 앱 분리) |
| 수익 | 크레딧 하이브리드 | 구독/회차권 | **단품제 · 영리 확정** |
| 상태 | 활성 개발 | 활성 개발 | ⛔ **유지보수 모드** |

---

## 3. 워커 · 도메인 · DB 대조표

| 서비스 | 워커명 | 도메인 | D1 | KV | Cron |
|---|---|---|---|---|---|
| 마음풀 | `maumful` | maumful.com | maumful-db | 공용 | `0 0 1 * *` (구독 갱신) |
| 마음게임 | `maumgame` | game.maumful.com | maumful-db | 공용 | `0 3 * * 1` (주간 리포트) |
| 마음커플 | `maumcouple` | couple.maumful.com | maumful-db | 공용 | `0 3 1 * *` (세션 정리) |
| 마음부부 | `maumbubu` | bubu.maumful.com | maumful-db | 공용 | 없음 |
| 마음세대 | `maumsedae` | sedae.maumful.com | maumful-db | 공용 | 없음 |
| 마음수달 | `maumotter` | maumotter.com | maumotter-db + **maum-auth** | 전용 | 없음 |
| 마음곁 | `maumgyeot` | maumgyeot.com | maumgyeot-db + **maum-auth** | 전용 | 없음 |
| CTS 본체 | `lightoflife` | jesusmaum.com | lightoflife-db | 전용 | 주석(비활성) |
| CTS 게임 | `lightoflife-game` | — | lightoflife-db | 전용 | 주석(비활성) |
| CTS 커플 | `lightoflife-couple` | — | ⚠️ 미확인 | — | — |

> ⚠️ **`lightoflife-couple`** 은 CTS 본체 코드가 참조하지만 `HANDOVER.md` 는 CTS를 워커 2개로 정의한다. 실재 여부 확인 필요. 상세: CTS 본체 설계서 §13.

---

## 4. 서비스 간 의존관계

```
                    ┌─────────────────────────────────────────┐
                    │  maumful-db (계정·크레딧·결제·JWT)       │
                    └─────────────────────────────────────────┘
                       ▲        ▲        ▲        ▲        ▲
                       │        │        │        │        │
                   마음풀 ─ 마음게임 ─ 마음커플 ─ 마음부부 ─ 마음세대
                      │                                   ▲
                      │  loop_events (검사↔게임 양방향)    │ 파생
                      └──── 마음게임                       └─ 마음부부
                      │
                      │  POST /api/grant  (HMAC = MAUM_SSO_SECRET)
                      │  ※ 설계 완료 · 착수 대기 (토스 실결제 반영 후)
                      ▼
                    ┌─────────────────────┐
                    │  maum-auth (공용)    │
                    └─────────────────────┘
                       ▲              ▲
                   마음수달        마음곁
                  (maumotter-db) (maumgyeot-db)


   CTS 계열 (완전 분리 · 유지보수 모드)
                    ┌─────────────────────┐
                    │  lightoflife-db     │
                    └─────────────────────┘
                       ▲        ▲        ▲
                   CTS 본체  CTS 게임  CTS 커플(?)
```

### 핵심 의존 규칙
- **마음풀은 허브다.** 결제·크레딧·계정이 전부 `maumful-db` 에 있고, 게임·커플·부부·세대는 이 DB를 직접 읽고 쓴다. 마음풀 스키마 변경은 5개 서비스에 동시 파급된다.
- **마음 시리즈는 계정만 공유한다.** `maum-auth` 만 공용이고 도메인 데이터는 완전히 분리. 규약은 `_shared/maum-shared-spec.md`.
- **통합결제(grant API)** 는 마음풀 → 수달·곁 단방향. **설계 완료·착수 대기** 상태이나 코드는 이미 양쪽에 존재한다 (수달·곁 설계서 §10 참조).
- **CTS는 어떤 마음풀 리소스도 공유하지 않는다.** 코드만 트윈일 뿐 인프라는 완전 분리.

---

## 5. 이 폴더를 쓰는 법

**개발 작업 전**
1. 루트 `CLAUDE.md` 로 공통 규칙 확인
2. 해당 서비스 `CLAUDE.md` 로 작업 규칙 확인
3. 해당 서비스 `docs/DESIGN.md` 로 구조·계약 확인
4. `_docs/RISKS.md` 에서 건드릴 영역에 알려진 결함이 있는지 확인

**설계서 갱신 시점**
- 스키마(migrations) 추가 → §6 갱신
- 신규 라우트 → §7 갱신
- 가격·상품 변경 → §10 갱신
- 안전 규칙 변경 → §11 갱신 (**원문 인용 유지**)
- 갱신할 때마다 문서 맨 아래 개정 이력에 한 줄 추가

---

## 6. 문서화가 남은 영역

| 항목 | 현황 |
|---|---|
| 외부 메모리 `project_*` 참조 | **2026-09-19 해소.** 참조 29종을 코드에서 복원해 각 설계서 본문으로 옮김. 각 문서 §15 뒤 `외부 메모리 대조표` 에 복원/복원불가 내역이 있다. **복원 불가는 의사결정 맥락뿐** — 가격·계약·라우트 같은 실체는 전부 코드에서 복원됐다 |
| 마음풀 `README.md`·`SETUP.md`·`DEPLOY_CHECKLIST.md` | 2026-04-29 이후 방치. 현행과 크게 어긋남 |
| 마음수달 `docs/IMPLEMENTATION_PLAN.md` | 갭 표가 낡음 (구현 완료된 것을 ❌로 표기) |
| 마음곁 `docs/maumgyeot-spec.md` | API 표 6행 (실제 32개), 행동 라이브러리 29종 (코드 56종) |
| `cts-maum-main/MULTILINGUAL.md` | ⚠️ CTS 문서가 아님 — 진본삼 랜딩 i18n 가이드가 잘못 들어와 있음 |
| `_shared/auth.ts` | 캐논이라 선언돼 있으나 실제보다 낡음 (RISKS.md R-02) |
| 롤백 절차 | **전 서비스 미정의** |
| 테스트 · CI | 전 서비스 부재. 회귀 검증은 전적으로 수동 |
