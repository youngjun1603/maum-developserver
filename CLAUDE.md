# 마음풀 프로젝트

## 서비스 구성 (3개)

### 1. 마음풀 서비스
심리검사·AI상담·전문상담 연결·치유게임 통합 플랫폼

| 폴더 | Worker | 역할 |
|------|--------|------|
| `maumful-main/` | `maumful` | 메인 플랫폼 (maumful.com) |
| `maumgame-main/` | `maumgame` | 치유 게임 (game.maumful.com) |
| `package/maumcouple/` | `maumcouple` | 커플 분석 (couple.maumful.com) |

- DB: `maumful-db` (D1: f8046693)
- 결제: 토스페이먼츠(KRW) + Stripe(USD), 크레딧 기반
- 검사 12종: SCT, DSI, PHQ-9, GAD-7, DASS-21, BIG5, K-MBI+, LOST, SRCI, SDRI, RBC, SDI
- 게임 8종: garden, efmt, gratitude, tree, burnout, mood, focus, worry

### 2. CTS 서비스 (트윈 개발)
마음풀과 동일 아키텍처, 성경적 상담 기능 추가한 고객 맞춤 버전

| 폴더 | Worker | 역할 |
|------|--------|------|
| `cts-maum-main/` | `lightoflife` | CTS 메인 플랫폼 |
| `cts-game-main/` | `lightoflife-game` | CTS 치유 게임 |

- DB: `lightoflife-db` (D1: 662b3fb9)
- 마음풀과 다른 점: bible_verses, ai_config, organizations 테이블 추가
- 배포: `wrangler.toml`(프로덕션) / `wrangler.dev.toml`(스테이징)

### 3. B2B 심리검사 서비스 (`phyweb/`)
상담사가 링크 생성 → 내담자 응시하는 검사 배포 플랫폼

- Worker: `phyweb` / 배포: Cloudflare Pages (`phycological-test`)
- URL: https://main.webapp-4zh.pages.dev
- DB: `webapp-production` (D1: 1f8c980a, 완전 분리, 16개 테이블)
- 빌드: Vite (`npm run build`) 필수 → `dist/` 생성 후 Pages 배포
- 역할 5단계: 마스터 → 단체관리자 → 상담사 → (관리자) → 내담자
- 결제: 토스 정기결제(빌링키), 구독 기반
- 구독: free(5회) / basic 29,900원(30회) / professional 49,900원(100회)
- 검사 12종 (maumful과 동일), AI 채팅 턴 제한 (무료 10턴/세션, 분석 3회/일)
- 검사 화면 보호 4단계: 워터마크·복사차단·키보드탐지·포커스블러
- 성경적 상담 모드: biblical_references 테이블, org_id 필터링

---

## 기술 스택 (공통)

- **백엔드:** Hono.js (TypeScript) + Cloudflare Workers
- **프론트엔드:** React 18 (Babel JSX, 빌드 없음)
- **DB:** Cloudflare D1 (SQLite) + KV
- **AI:** Anthropic Claude API

---

## 주요 명령어

```bash
# 로컬 개발
npx wrangler dev

# 배포 (포그라운드 실행 필수 — 백그라운드 시 인증 실패)
npx wrangler deploy

# CTS 스테이징 배포
npx wrangler deploy --config wrangler.dev.toml

# phyweb 배포 (빌드 필수)
npm run build && npx wrangler pages deploy dist --project-name phycological-test --commit-dirty=true

# phyweb DB 마이그레이션
npx wrangler d1 migrations apply webapp-production --config wrangler.toml

# DB 마이그레이션 (마음풀·CTS)
npx wrangler d1 migrations apply maumful-db
npx wrangler d1 migrations apply lightoflife-db

# 시크릿 설정
npx wrangler secret put ANTHROPIC_API_KEY
```

---

## 배포 원칙

- **마음풀·CTS:** 변경 사항 모아서 한꺼번에 배포 / CTS는 즉시 배포
- `wrangler deploy`는 반드시 포그라운드 실행
- 배포 전 TypeScript 에러 확인 필수

---

## 버전 관리 원칙 ⚠️ 필수 준수

### 서비스별 커밋 분리 (매우 중요)

마음풀·CTS·phyweb은 향후 완전히 독립적으로 운영될 예정이므로, **서비스 간 변경 사항을 절대 하나의 커밋에 혼합하지 않는다.**

**규칙:**
- 마음풀(`maumful-main/`) 변경 → 별도 커밋
- CTS(`cts-maum-main/`) 변경 → 별도 커밋
- phyweb(`phyweb/`) 변경 → 별도 커밋
- 공통 설정(`CLAUDE.md` 등) 변경 → 별도 커밋

**이유:** 서비스별로 커밋이 분리되어 있어야 `git revert <commit>` 한 번으로 특정 서비스만 롤백할 수 있다. 혼합 커밋은 선택적 롤백이 불가능해진다.

**커밋 메시지 prefix 예시:**
```
[maumful] 상담센터 안내 페이지로 교체
[cts] 예약 시스템 원복
[phyweb] 구독 플랜 데이터 수정
[공통] CLAUDE.md 버전관리 원칙 추가
```
