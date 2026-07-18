# 마음(maum) 프로젝트 — 루트 공통 규칙

> 이 파일은 **maum 폴더 전 서비스에 공통**으로 적용되는 최소 규칙만 담는다.
> **각 서비스의 상세 규칙은 해당 폴더의 CLAUDE.md를 따른다** (아래 라우터 참조). 서비스 간 규칙을 섞지 말 것.

## 서비스 구성 & CLAUDE.md 라우터

| 폴더 | 서비스 | 작업 시 읽을 규칙 |
|------|--------|------------------|
| `maumful-main/` | 마음풀 메인 (maumful.com) | `maumful-main/CLAUDE.md` (마음풀 + 트윈 공통) |
| `maumgame-main/` | 마음풀 게임 (game.maumful.com) | `maumful-main/CLAUDE.md` |
| `package/maumcouple/` | 마음커플 (couple.maumful.com) | `maumful-main/CLAUDE.md` |
| `maumbubu/` | 마음부부 (부부 대화 통역, bubu.maumful.com) *신규* | `maumbubu/CLAUDE.md` (마음커플 패턴 공유) |
| `maumsedae/` | 마음세대 (부모-자녀 세대 통역, sedae.maumful.com) *신규* | `maumsedae/CLAUDE.md` (마음부부에서 파생) |
| `cts-maum-main/` | CTS 메인 (jesusmaum.com) — **별도 레포** `lightoflife-cts` | `cts-maum-main/CLAUDE.md` (+ 공통은 maumful-main) |
| `cts-game-main/` | CTS 게임 (`lightoflife-game`) — ⚠️ **이 레포 안에 있음** | `cts-maum-main/CLAUDE.md` (+ maumful-main) |
| `maumotter/` | 마음수달 (아이 정서 통역) *신규* | `maumotter/CLAUDE.md` + `_shared/` |
| `maumgyeot/` | 마음곁 (반려동물 통역) *신규* | `maumgyeot/CLAUDE.md` + `_shared/` |
| `_shared/` | 마음 시리즈 공유규약(인증·JWT·브랜드) | `_shared/maum-shared-spec.md` |
| `_assets/` | 이미지·디자인·문서 자산 | — |

- **마음풀·CTS는 트윈**(~90% 동일). 공통 개발규칙은 `maumful-main/CLAUDE.md`에 두고 CTS는 차이점만 관리.
- ⚠️ **CTS는 유지보수 모드 — 에러·버그 수정만, 신규 기능 금지**(사용자 확정 2026-07-18). CTS(`cts-maum-main`·`cts-game-main`)에는 **버그·에러 수정만** 반영한다. **신규 기능(마음풀에 새로 넣은 것 포함)은 포팅하지 않는다.** 계획이 바뀌면 사용자가 다시 알려준다. → 메모리 `project_cts_payment_nonprofit`
  - 즉 마음풀 고유 서비스(마음 시리즈 수달·곁·부부·세대 + 커플)는 물론, **마음풀 본체의 신규 기능도** CTS로 자동 동기화하지 않는다. 트윈 동기화는 이제 사실상 버그·안전 수정에 한정.
- ⚠️ **CTS 전달 시 누락 주의**: CTS는 워커 2개(`lightoflife` + `lightoflife-game`)인데 **본체는 별도 레포(`lightoflife-cts`), 게임은 이 레포 안**에 있다. `lightoflife-cts`만 넘기면 **CTS 게임이 통째로 빠진다** → `cts-game-main/` 폴더를 함께 export할 것. 범위·인프라·시크릿·체크리스트는 **`cts-maum-main/HANDOVER.md`**. (레포 통합 여부는 미결정)
- **마음 시리즈(수달·곁)는 별개 스택**(React CDN·no-build·GitHub 웹UI 배포) — 마음풀/CTS 규칙을 끌어오지 말 것.

## 공통 기술 스택
- 마음풀·CTS·게임·커플·**부부**: Hono + Cloudflare Workers + D1 + KV, React(esbuild 사전컴파일), Anthropic Claude
- 마음 시리즈(수달·곁): 동일 백엔드(Workers+Hono+D1+KV) + React **CDN(unpkg)·빌드 없음**
- **마음부부**는 마음풀 생태계(별도 워커 `maumbubu` + `maumful-db`·KV·JWT_SECRET 공유, `?t=` 토큰 SSO). 마음 시리즈(수달·곁)와는 다른 생태계 — 규칙 혼동 금지.

---

## 버전 관리 원칙 ⚠️ 전 서비스 필수

### 수정 즉시 커밋·푸시
코드·설정 수정 시 **항상 커밋·푸시**(사용자 요청 없어도 작업 완료 시 자동). `git push origin main`. 다중 PC 동기화 필수.
- CTS(`cts-maum-main/`)는 **submodule** → 내부 커밋·push → 부모 레포 포인터 커밋·push 순서.

### 서비스별 커밋 분리 (매우 중요)
서비스 간 변경을 **하나의 커밋에 절대 혼합하지 않는다** (선택적 `git revert`를 위해). 서비스별 별도 커밋.
```
[maumful] …   [cts] …   [maumgame] …   [maumcouple] …
[maumotter] … [maumgyeot] … [maum-series] …   [공통] …
```

### ⚠️ GitHub 계정 2개 — push 실패 시 가장 먼저 확인
계정 2개 등록: **`youngjun1603`(레포 소유주)** / `shine184280-hue`. 활성이 `shine184280-hue`이면 private 레포(`lightoflife-cts` 등) push가 **"Repository not found"(404)** 로 실패(부모 레포는 되어 헷갈림).
```bash
gh auth status                      # Active account 확인
gh auth switch --user youngjun1603  # 소유 계정으로 전환
gh auth setup-git                   # gh를 git 자격증명 헬퍼로(GCM 캐시 우회)
```
→ 메모리 `feedback_github_account`

---

## 배포 원칙 (공통)
- 워커 서비스(`wrangler deploy`)는 반드시 **포그라운드** 실행(백그라운드 시 인증 실패). 배포 전 TypeScript 에러 확인.
- 마음 시리즈(수달·곁)는 GitHub 웹UI → Cloudflare 자동 배포 (각 폴더 CLAUDE.md).

## 개발 완료 후 검증 (공통)
기능 개발 완료 시 **요청 없어도 즉시** 에러·버그 검증(빌드 성공 후, 배포 전/직후). 상세 체크리스트는 각 서비스 CLAUDE.md. (메모리 `feedback_verify_after_dev`)

### ⚠️ "없다/안 된다"고 결론내기 전에 전체 코드를 확인할 것
검색이 안 되거나 작업이 막힐 때 **일부만 보고 단정하지 말 것**. 반드시 **전 파일**을 확인한 뒤 결론낸다. (메모리 `feedback_search_whole_codebase`)
- **실제 사고(2026-07-17)**: CTS에 AI 해석 피드백 어드민 탭을 넣을 때 `app.jsx`만 grep하고 *"CTS엔 어드민 UI 자체가 없다"*고 사용자에게 보고 → **틀림**. 어드민은 `counseling_admin.jsx`(별도 파일·별도 인증)에 멀쩡히 있었다(사용자가 스크린샷으로 지적). `ls`로 파일 목록을 봐놓고도 한 파일만 뒤진 게 원인.
- **규칙**: 프론트는 파일이 여러 개다 → `public/static/*.jsx` **전부**(app·landing·counseling·counseling_admin) 훑고 결론낼 것. 백엔드도 라우트가 여러 곳일 수 있다.
- 컴포넌트/기능이 "없다"고 하기 전 최소: 전 파일 grep + 파일 목록 확인 + 죽은 코드인지 실제 호출부까지 확인.

### ⚠️ 신규 구현은 기존 프로그램 무영향을 검증하며 진행할 것
새 기능을 넣을 때 **기존 동작이 깨지지 않음을 검증**하면서 간다(끝나고 몰아서 말고). (메모리 `feedback_verify_no_regression`)
- 추가형으로 설계(기존 흐름 분기 최소·기존 컬럼/응답 유지), 기존 경로를 실제로 한 번 태워 보고, 데이터는 NULL 허용으로 기존 행 무영향.
- 프론트는 빌드·200으로 런타임 에러를 못 잡는다 → 렌더 검증 필수(`feedback_frontend_render_smoke`).

## 남은 작업 (백로그)
전 서비스 남은 작업은 메모리 **`project_maum_backlog`** 한 곳에 모아 둔다. 새 작업 지시가 오면 여기부터 확인할 것.
- **바로 가능**: 폐기된 상담사 승인 레거시 코드 제거 / 주간 리포트 메일 실수신 검증(사용자 동의 후)
- **데이터 보고 판단**(2026-08-09경): 마음게임 콘텐츠 확장 — 어드민 🔁 루프 탭에서 검사↔게임 루프가 도는지 확인 후
- **선행조건 대기**: 앱화·통합해석 상품화·연동형 통합결제 → 모두 **토스 실결제 반영 후**
- **금지**: 커플 감정 내용 공유(동의·철회 UX 없이) / CTS 개발(명시적 재개 시에만)

---

## 연동형 유료결제 (통합결제) — 설계 완료·착수 대기 ⚠️
수달·곁·부부 유료결제를 **마음풀에서 상품으로 판매 → 결제내역을 각 서비스로 자동 전달(grant)** 하는 방식. **사용자 지시 있을 때만 착수**하며, **토스페이먼츠 완전 반영 전까지 관련 코드는 커밋·푸시·배포 금지**(설계·로컬 준비만).
- **결제 표기 = 하이브리드**(내부 크레딧, 겉은 명명 상품 — 선불충전금/PG 기피 회피). 마음풀·부부는 이미 이 구조. 수달·곁은 별도 생태계라 `applyGrant`(sub/pack)로 지급.
- **전달 = A안(서명 grant API)**: 마음풀 결제성공 → 대상 서비스 `POST /api/grant`(HMAC=MAUM_SSO_SECRET, `{email,grantType,orderId}`) → email로 maum-auth 계정 조회/생성 → `applyGrant`. 멱등·환불 revoke·선지급 재시도 포함.
- 사업자 단일(마음서비스)이라 결제대행 규제 무관. 수달·곁 앱은 당분간 없음.
- **상세 실행 스펙·DB·API 계약·검증은 메모리 `project_maum_unified_payment`** (착수 지시 시 그대로 실행).
