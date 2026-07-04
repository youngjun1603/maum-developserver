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
| `cts-maum-main/` | CTS 메인 (jesusmaum.com) *submodule* | `cts-maum-main/CLAUDE.md` (+ 공통은 maumful-main) |
| `cts-game-main/` | CTS 게임 | `cts-maum-main/CLAUDE.md` (+ maumful-main) |
| `maumotter/` | 마음수달 (아이 정서 통역) *신규* | `maumotter/CLAUDE.md` + `_shared/` |
| `maumgyeot/` | 마음곁 (반려동물 통역) *신규* | `maumgyeot/CLAUDE.md` + `_shared/` |
| `_shared/` | 마음 시리즈 공유규약(인증·JWT·브랜드) | `_shared/maum-shared-spec.md` |
| `_assets/` | 이미지·디자인·문서 자산 | — |

- **마음풀·CTS는 트윈**(~90% 동일). 공통 개발규칙은 `maumful-main/CLAUDE.md`에 두고 CTS는 차이점만 관리.
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
