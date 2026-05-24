# 마음풀 프로젝트

## 서비스 구성 (2개)

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

## 프론트엔드 빌드

```bash
# JSX → JS 사전 컴파일 (배포 전 필수)
npm run build:jsx
# → public/static/compiled/{app,landing,counseling,counseling_admin}.js
```

- **빌드 없이 직접 서빙 불가** — esbuild 사전 컴파일 후 배포
- 4개 파일 모두 **일반 `<script>`로 동일 전역 스코프** 공유
  - 전역 `const` 이름 충돌 시 `SyntaxError` 발생
  - 예: `counseling.jsx`와 `counseling_admin.jsx`의 동일명 변수 → 한쪽 rename 필요

---

## 다국어(i18n) 구현

- **패턴:** `t(ko, en)` 헬퍼 — `lang === 'en' ? en : ko`
- `t`는 `PsychologicalTestSystem` 클로저 내부에 정의 — **`app.jsx` 컴포넌트만 사용 가능**
- `landing.jsx` · `counseling.jsx`는 컴포넌트별로 `tl` 헬퍼를 독립 정의해 사용
- 검사 문항 배열에 영어 필드 추가 방식: `{ content:'한국어', en:'English', scale:'척도', scaleEn:'Scale' }`
- `CounselingPage`는 `lang` prop을 `app.jsx`에서 받아야 함 (기본값 없음)

---

## 주요 기능 구현 현황

### AI 감정 추적 (Mood Logging)
- AI 응답에 `[MOOD:N]` 태그 삽입 (N = 0~100)
- `ChatBox` processStream done 블록에서 추출·제거 후 `/api/chat/mood-log` POST
- DB: `mood_logs(user_id, mood_score, test_type, created_at)` — migration `0020_mood_logs.sql`
- 트렌드 조회: `GET /api/chat/mood-trend?days=14` (최대 90일)

### 외부 검사 결과 입력 (ExternalResultSection)
- 점수 직접 입력 탭: `/api/test/external-result` POST
- PDF 업로드 + AI 해석 탭: pdf.js로 텍스트 추출 → `/api/test/analyze-pdf` POST (2 크레딧)
- 히스토리 탭에 `📥 외부 검사 결과 입력 · AI 해석` 버튼으로 진입

### CBT 8주 자기관리 플랜 (CbtPlanCard)
- PHQ-9·GAD-7·BURNOUT·DASS-21 검사 이력이 있을 때만 대시보드에 표시
- `/api/test/cbt-plan` GET으로 플랜 로드 (최초 1회 생성)
- 주차별 완료 여부는 `localStorage('cbt_done_weeks')`에 저장

### 인근 상담 기관 찾기 (CounselingPage)
- Kakao Maps SDK + `/api/nearby-counseling?lat=&lng=` 로 주변 기관 검색
- 카테고리 필터: 정신건강의학과 / 정신건강복지센터 / 심리상담센터
- 24시간 무료 상담전화(109, 1577-0199, 1388) 섹션 포함
- `lang` prop 필수 — app.jsx 호출 시 반드시 전달

---

## 마음게임 번역 (추후 예정)

**현황:** `maumgame-main/` 전체 한국어 하드코딩 — 번역 시스템 없음

**번역 필요 파일 (10개, ~1,400줄):**

| 우선순위 | 파일 | 주요 내용 |
|----------|------|-----------|
| HIGH | `public/static/game_registry.jsx` | 게임 이름·설명·태그 8종 |
| HIGH | `public/static/game_engine.jsx` | 레벨명(씨앗/새싹...), 업적명, 테마 |
| HIGH | `public/static/game_hub.jsx` | 메인 허브 UI 전체 |
| HIGH | `public/static/games/mood.jsx` | 감정 레이블(행복/평온/슬픔...) |
| HIGH | `public/static/games/garden.jsx` | 호흡법 안내 텍스트 |
| MEDIUM | `public/static/games/burnout.jsx` ~ `worry.jsx` | 게임 5종 안내 텍스트 |

**구현 방향 (결정 사항):**
- 패턴: 마음풀과 동일한 `t(ko, en)` 헬퍼 사용
- lang 전달: 마음풀 → 게임 링크 열 때 `?lang=en` URL 파라미터로 전달
- 게임 앱 초기화 시 `new URLSearchParams(location.search).get('lang')` 으로 읽기
- DB `users.locale`은 이미 저장 중이나 게임 앱에서 미사용 상태

---

## 카카오 소셜 로그인 설정

### Redirect URI 등록 위치
카카오 Developer Console에서 Redirect URI는 **카카오 로그인 > 일반** 이 아닌 아래 경로에 있음:

> 콘솔 → 앱 선택 → 앱 설정 → **플랫폼 키 / 어드민 키 → REST API 키** → 카카오 로그인 리다이렉트 URI

- 마음풀 등록 URI: `https://maumful.com/api/auth/kakao/callback`
- REST API 방식(서버 사이드) 사용 시 위 경로에 등록

### 동의항목 제한 사항
- `gender`, `age_range` → **권한 없음** — Kakao OAuth 응답에서 제공 안 됨
- 카카오 로그인으로 제공되는 항목: 닉네임(필수), 프로필사진(선택), 이메일(비즈 앱 필요)
- 성별·연령대는 **이메일 회원가입 폼에서만** 직접 수집

---

## 버전 관리 원칙 ⚠️ 필수 준수

### 서비스별 커밋 분리 (매우 중요)

마음풀·CTS는 향후 완전히 독립적으로 운영될 예정이므로, **서비스 간 변경 사항을 절대 하나의 커밋에 혼합하지 않는다.**

**규칙:**
- 마음풀(`maumful-main/`) 변경 → 별도 커밋
- CTS(`cts-maum-main/`) 변경 → 별도 커밋
- 공통 설정(`CLAUDE.md` 등) 변경 → 별도 커밋

**이유:** 서비스별로 커밋이 분리되어 있어야 `git revert <commit>` 한 번으로 특정 서비스만 롤백할 수 있다. 혼합 커밋은 선택적 롤백이 불가능해진다.

**커밋 메시지 prefix 예시:**
```
[maumful] 상담센터 안내 페이지로 교체
[cts] 예약 시스템 원복
[공통] CLAUDE.md 버전관리 원칙 추가
```
