# 마음수달 (MaumOtter) — 메인 설계 문서 (spec)

> 이 문서는 마음수달의 **전체 아키텍처·안전원칙·화면·D1 스키마·API·통역엔진·로드맵**을 정의한다.
> 인증·계정·브랜드·JWT는 `../../_shared/maum-shared-spec.md`를 따른다(중복 정의 금지).
> 작업 규칙은 `../CLAUDE.md`. 본 문서는 **초안 v1** — 검토 후 확정.

---

## 1. 개요 · 철학

아이(3~9세)가 화면 속 수달 캐릭터 **'또또'**와 대화하며 속마음을 꺼내면, AI가 그 발화를 **양육자가 이해하고 행동할 수 있는 코칭 리포트로 통역**해 전달한다.

- **한 줄:** "말 못 하는(또는 잘 표현 못 하는) 아이의 속마음을 부모에게 통역한다."
- **핵심 철학:** AI는 아이의 친구(대체)가 **아니라**, 아이와 양육자 사이의 **다리(bridge)**.
- **통역 방향:** 아이 발화 → (또또가 들음) → AI 분석 → **부모용** 정서 코칭 리포트. 아이에게 분석·진단을 돌려주지 않는다.

---

## 2. 안전 · 윤리 원칙 (기능이 아니라 제약 — 타협 불가)

> CLAUDE.md 3장이 "spec 2장 전체 준수"로 참조하는 핵심 장. 모든 코드 레이어에 흔적이 남아야 한다.

1. **부모 기기 전용 · 양육자 동반**
   - 부모 핸드폰 단일 앱. 아이 소유 기기에 설치하지 않는다.
   - 아이 단독 무제한 사용 불가. 아이 모드는 부모가 "세션 열기"로만 진입.
2. **부모 모드 / 아이 모드 게이팅**
   - 앱은 항상 **부모 모드로 시작**.
   - 아이 모드 진입 = 부모 인증(PIN/생체) → 세션 시작. 세션 종료 시 부모 모드로 자동 복귀.
3. **컴패니언화·중독 방지**
   - 무한 대화 금지. 1세션 **10~15분**, 명확한 시작·끝.
   - "또또가 보고싶어 다시 와" 식 재방문 유도/푸시 금지.
4. **AI 정체성 고지**
   - "나는 진짜가 아닌, 네 마음을 들어주는 수달 친구야"를 연령에 맞게 고지.
5. **비밀 보장 거짓말 금지** (그루밍·고립 위험 차단)
   - ❌ "엄마한테 비밀로 할게" / ⭕ "엄마가 너를 더 잘 이해하도록 도와줄게"
6. **위기 신호 처리**
   - 학대·자해·방임 의심 → **부모 리포트로 에스컬레이션 + 전문기관 연계 안내**.
   - 아이 화면엔 위기 상세를 **절대 노출하지 않는다**. 또또는 위기 개입을 시도하지 않는다(전문 영역).
   - 위기 판정은 **보수적**으로, "단정 아님" 명시.
7. **의료 용어 전역 금지**
   - 치료·진단·처방·장애·증상 등 사이트 전역 금지. 통역 출력 후처리로 검증·치환.
8. **표정 영상 휘발성 (7-C)**
   - 카메라 표정 기능은 **온디바이스(브라우저 내) 분석 + 원본·프레임 즉시 폐기**. 서버로 영상/이미지 전송·저장 **절대 금지**.
   - 통역엔 표정에서 추출한 **요약 신호(예: 웃음/찡그림/무표정)만 텍스트 메타**로 보조 입력. 원본은 기기를 떠나지 않는다.
   - 부모 동의 + 아이에게 "카메라가 켜졌어" 고지. 미동의/미지원 시 음성·텍스트로 동작.
   - 구현 난이도가 높아(온디바이스 표정 분석) **음성 다음 단계**로 진행.
9. **데이터 최소 수집**
   - 아이 식별정보 최소화. 발화 원문 보관 기간·열람 권한(부모만)을 명확히. 개인정보처리방침 필수.

---

## 3. 사용자 · 계정

- 계정 원천: 공용 **`maum-auth` D1** (`maum_user_id`). 인증·JWT는 `_shared` 2장 그대로.
- 마음수달 D1은 도메인 데이터만 보유하고 `maum_user_id`로 참조.
- **역할:** 부모(주 계정) ↔ 아이(부모에 종속된 프로필, 독립 계정 아님).
- 부모 1명에 아이 N명 등록 가능.

---

## 4. 화면 구조

### 부모 모드 (기본)
- **홈/대시보드:** 아이 목록, 최근 통역 리포트 요약, "세션 시작" 버튼
- **아이 등록/관리:** 이름(또는 애칭)·나이·성별(선택)·관심사
- **리포트 목록·상세:** 세션별 통역 리포트(아래 7장 구조)
- **설정:** 계정, PIN, 알림(최소), 개인정보·면책, 마음 시리즈 안내(1곳)

### 아이 모드 (부모가 세션 열 때만)
- **또또 대화 화면:** 큰 캐릭터, 말풍선. 종료: 시간 경과 또는 "오늘은 여기까지" → 부모 모드 복귀.
- 아이 화면엔 분석·점수·위기정보 **표시 안 함**.

### 4.5 입력·출력 모달리티 ⚠️ 연령 핵심 (텍스트만으론 부적합)
타깃이 3~9세라 **음성이 사실상 필수**(3~5세는 읽기·타이핑 불가). 연령별로 모달리티를 다르게 제공.

| 연령 | 주 입력 | 출력 |
|------|---------|------|
| 3~5세 | **음성(말하기)** + 감정 이모지/그림 선택지 | **또또 음성(TTS) 필수** + 큰 캐릭터 |
| 6~7세 | 음성 또는 짧은 텍스트 | 또또 음성 + 말풍선 |
| 8~9세 | 텍스트 또는 음성 | 말풍선(음성 선택) |

- **음성 입력(STT):** 브라우저 **Web Speech API**(`webkitSpeechRecognition`, `ko-KR`). 큰 마이크 버튼(누르거나 길게)→말하면 텍스트 변환→기존 `/utterance` 파이프라인. **음성 원본은 우리 서버로 전송·저장하지 않음**(브라우저가 텍스트만 전달) → 휘발성 부합. 미지원 브라우저는 텍스트 입력으로 자동 폴백.
- **음성 출력(TTS):** 또또 답변을 `speechSynthesis`(`ko-KR`)로 자동 낭독. 못 읽는 연령의 핵심.
- **그림·선택지(3~5세 보조):** "오늘 기분은?" 이모지 선택 등 텍스트 대체 입력(후순위 보강).
- **표정 영상(카메라):** 아래 2-8 + 7-C 규칙 — **온디바이스 분석·원본 즉시 폐기**(서버 미전송). 별도 단계.

> STT/TTS는 무빌드 브라우저 API라 현 React CDN 프론트에 바로 추가 가능.

---

## 5. D1 스키마 (마음수달 전용 — `maum_user_id`로 공용계정 참조)

```sql
-- 아이 프로필 (부모 계정에 종속)
CREATE TABLE children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maum_user_id INTEGER NOT NULL,        -- 부모 (공용 maum-auth)
  name TEXT NOT NULL,                    -- 애칭 권장
  age INTEGER,
  gender TEXT,                           -- 선택
  interests TEXT,                        -- 자유 텍스트/태그
  created_at TEXT DEFAULT (datetime('now'))
);

-- 대화 세션
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  started_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT,
  status TEXT DEFAULT 'open'             -- open | done | aborted
);

-- 발화 (아이/또또 턴)
CREATE TABLE utterances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,                    -- child | otter
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 통역 리포트 (세션 종료 시 1건)
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  child_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  report_json TEXT NOT NULL,            -- 아래 7장 구조 (LLM 출력)
  crisis_flag INTEGER DEFAULT 0,        -- 0/1, 보수적 판정
  created_at TEXT DEFAULT (datetime('now'))
);
```
> D1 제약(스킬): `DROP/RENAME COLUMN`·타입변경 불가 → 변경은 `ALTER TABLE ADD COLUMN`만.

---

## 6. API 엔드포인트 (Hono)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/*` | 공용 maum-auth 위임 (`_shared` 2장) |
| GET | `/api/children` | 내 아이 목록 |
| POST | `/api/children` | 아이 등록 |
| POST | `/api/session/start` | 세션 시작(부모 인증 후) → session_id |
| POST | `/api/session/:id/utterance` | 발화 추가(아이↔또또 대화 진행) |
| POST | `/api/session/:id/end` | 세션 종료 → 통역 엔진 호출 → 리포트 생성 |
| GET | `/api/reports?child_id=` | 리포트 목록 |
| GET | `/api/reports/:id` | 리포트 상세 |

- 인증 JWT 검증은 `_shared` 2장 패턴. CORS는 `_shared` 3장 화이트리스트.

---

## 7. 통역 엔진 (개요 — 상세 프롬프트는 `maumotter-translation-engine.md`)

- 세션 종료 시 **누적 발화 → LLM 1회 호출 → 리포트 JSON**.
- `temperature: 0`, 출력 순수 JSON, 파싱 실패 대비 try-catch + 재생성.
- 의료 용어 출력 후처리 검증(발견 시 재생성/치환).
- 위기 판정 보수적, `crisis_flag` + "단정 아님".

### 리포트 JSON 구조 (부모용, v1)
```json
{
  "summary": "오늘 또또와 나눈 이야기 요약 (단정 X, 따뜻하게)",
  "feelings": ["오늘 드러난 감정 키워드 (예: 서운함, 기대)"],
  "what_happened": "아이가 말한 상황/맥락 정리",
  "parent_tips": ["오늘 이렇게 말해보세요 같은 구체 행동 제안 2~3개"],
  "talk_starters": ["부모가 아이에게 건넬 대화 물꼬 1~2개"],
  "crisis": { "flag": false, "note": "단정 아님. 필요 시 전문기관 안내" }
}
```

---

## 8. 기술 스택 · 배포 (CLAUDE.md 4장 = cloudflare-dev 스킬)

- **백엔드:** Cloudflare Workers + Hono + D1 + KV
- **프론트:** React **CDN(unpkg)** — npm 빌드 없음
- **배포:** **GitHub 웹 UI → Cloudflare 자동 배포** (로컬 `npm run dev`/`wrangler dev` 안내 금지)
- **파일 전체 교체** 방식(부분수정 X)
- **JWT:** `crypto.subtle` 필수, `btoa()` 직접 금지, 한국어 TextEncoder UTF-8 (`_shared` 2장)

---

## 9. 로드맵

- **MVP (1차, 완료):** 부모 가입 → 아이 등록 → 텍스트 세션 → 통역 리포트 1종. (배포·동작 검증 완료)
- **1.5차 (즉시 보강 — 4.5 모달리티):** ⭐ **음성 입력(STT) + 또또 음성 출력(TTS)** — 타깃 연령 사용성 핵심. Web Speech API 무빌드 추가. 3~5세 음성 중심.
- **2차:** 감정 이모지/그림 선택지(3~5세 보조), 리포트 누적 추이, 아이 모드 UX 고도화
- **3차:** 표정 영상(7-C 휘발성·온디바이스 분석), 위기 연계 전문기관 디렉토리
- **착수 순서:** ~~D1·인증·세션·통역·리포트·아이모드(완료)~~ → **음성 입출력** → 그림 선택지 → 표정 영상

---

## 10. 열린 결정 (확정 필요)
1. 과금 모델 — 무료/구독/세션권? (마음풀 크레딧 방식 차용 여부)
2. 음성·영상 도입 시점 (MVP는 텍스트만 권장)
3. 위기 연계 전문기관 데이터 출처
4. `maum-auth` 실제 생성 시점(수달 단독 출시 vs 곁과 동시)
