# 마음곁 (MaumGyeot) — 메인 설계 문서 (spec)

> 반려동물(개·고양이)의 행동·표정·소리를 **동물행동학 관점으로 읽어** 보호자가 이해·대응할 수 있게 통역하는 서비스의 전체 설계.
> 인증·계정·브랜드·JWT는 `../../_shared/maum-shared-spec.md`, 작업규칙은 `../CLAUDE.md`.
> 구조는 **마음수달(maumotter)을 베이스로 재사용**(인증·세션/관찰·통역 골격 동일), 도메인만 동물행동학. **초안 v1.**

---

## 1. 개요 · 철학

보호자가 반려동물의 **행동 신호 + 사진/짧은 영상 + 맥락**을 입력하면, AI가 동물행동학에 근거해 **"이 행동은 ~일 수 있어요"** 형태로 통역하고 대응을 안내한다.

- **한 줄:** "표현 못 하는 반려동물의 행동을 읽어 보호자에게 통역한다." (마음수달과 동일 구조, 대상만 동물)
- **핵심 철학:** AI는 보호자와 반려동물의 유대를 **대체하지 않는다. 다리(bridge)**.
- **차별점 = 신뢰:** "단정하지 않음". 모든 통역에 **confidence**와 "직접 관찰·교감이 가장 중요" 안내.

---

## 2. 통역의 황금률 (행동학 문헌 기반 — 타협 불가)

1. **단일 신호 ≠ 단정**: 꼬리·귀·눈·자세·발성을 **함께** 읽는다.
2. **같은 신호 = 정반대 의미 가능**: 꼬리 흔들기(개)·골골거림(고양이)이 대표적. 행동 사전의 ⚠️ 다의적 신호 특히 주의.
3. **맥락·종·개체가 전부**: 상황·종·품종·성격으로 보정.
4. **과대광고 금지**: "95% 정확", "당신 개가 ~래요" 식 단정 금지. 교육형("이 행동은 ~일 수 있고 왜 그런지")으로.
5. **종 완전 분리**: 개/고양이 신호 체계가 다르므로 사전·해석을 분리(`behavior-library`).

---

## 3. 안전 · 윤리 (제약 — 타협 불가)

1. **단정 금지 = 과대광고 방지**: 항상 `confidence`(low/medium/high) + "~일 수 있어요".
2. **수의학 영역 침범 금지**: 질병 진단·치료·처방·병명 금지. 건강 우려는 **`health_flag` + "수의사 상담 권장"** 으로만.
3. **건강 위험 에스컬레이션**: 통증·이상행동 패턴 → 보호자 알림 + 수의사 상담 권유(진단 아님 명시).
4. **영상 휘발성**(마음수달 7-C 승계): 온디바이스 분석 + 원본 즉시 폐기. 사람 얼굴 포함 가능성도 동일 민감 처리. (MVP는 사진/짧은영상 업로드 → 분석 후 미보관 원칙)
5. **유대 대체 방지**: "직접 관찰·교감이 가장 중요"를 일관되게 안내.

---

## 4. 사용자 · 계정 · 화면

- 계정: 공용 **maum-auth**(`AUTH_DB`) — 마음수달과 **동일 계정·JWT**(통합 로그인). 도메인 데이터는 자체 `DB`.
- 마음수달의 "부모/아이 모드" 같은 분리는 불필요(보호자 단독 사용). 대신 **관찰 입력 → 통역**.

**화면 (보호자):**
- **홈/대시보드:** 반려동물 목록, 최근 통역 요약, "통역 받기" 버튼
- **반려동물 등록:** 이름·종(개/고양이)·품종(선택)·나이·성격 메모
- **관찰 입력(핵심):** ① 종 ② **행동 신호 선택**(사전 기반 체크: 꼬리/귀/눈/자세/발성…) ③ **맥락**(언제·어디서·무슨 상황) ④ (선택) 사진/짧은 영상
- **통역 리포트:** confidence·가능한 의미·대응·health_flag (아래 7장)
- **행동 도감:** 종별 행동 사전 열람(교육 콘텐츠, `behavior-library`)

---

## 5. D1 스키마 (마음곁 도메인 — `DB`. 계정은 maum-auth)

```sql
-- 반려동물 프로필
CREATE TABLE pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maum_user_id INTEGER NOT NULL,       -- 보호자 (maum-auth)
  name TEXT NOT NULL,
  species TEXT NOT NULL,               -- 'cat' | 'dog'  (종 분리의 기준)
  breed TEXT, age INTEGER, personality TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 관찰 (1건 = 1통역 요청)
CREATE TABLE observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  species TEXT NOT NULL,
  signals_json TEXT,                   -- 선택한 행동 신호 코드 배열
  context TEXT,                        -- 맥락 자유 텍스트
  media_note TEXT,                     -- (영상은 비저장 원칙; 분석 메모만)
  created_at TEXT DEFAULT (datetime('now'))
);

-- 통역 리포트
CREATE TABLE pet_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER NOT NULL,
  pet_id INTEGER NOT NULL,
  maum_user_id INTEGER NOT NULL,
  report_json TEXT NOT NULL,
  health_flag INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```
> 행동 사전(`behavior-library`)은 코드 상수/시드로 둠(작은 정적 데이터). D1 제약: `ALTER TABLE ADD COLUMN`만.

---

## 6. API (Hono — 마음수달과 동형)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/*` | 공용 maum-auth (`../src/auth.ts` 사본) |
| GET/POST | `/api/pets` | 반려동물 목록/등록 |
| GET | `/api/behavior?species=cat\|dog` | 행동 사전(도감·신호 선택용) |
| POST | `/api/observe` | 관찰 입력 → 통역 엔진 → 리포트 생성 |
| GET | `/api/reports?pet_id=` | 리포트 목록 |
| GET | `/api/reports/:id` | 리포트 상세 |

---

## 7. 통역 엔진 (개요 — 상세 `maumgyeot-translation-engine.md`)

- 관찰(신호+맥락+종+펫정보) → LLM 1회 → 리포트 JSON. `temperature: 0`, 순수 JSON, try-catch.
- **종별 사전·해석 분리.** 모든 통역에 confidence. 신호 적으면 low + "더 지켜봐 주세요".
- 수의학 용어 후처리 검증. 건강은 보수적·`health_flag`·"진단 아님".

### 리포트 JSON (v1)
```json
{
  "summary": "이 행동은 ~일 수 있어요 (단정 X)",
  "confidence": "low | medium | high",
  "body_signals_read": ["함께 읽은 신호들"],
  "possible_meanings": [{ "meaning": "가능한 의미", "why": "근거", "caveat": "다의적/맥락 주의" }],
  "what_to_do": ["보호자가 해볼 수 있는 따뜻한 대응 1~3개"],
  "health_flag": { "flag": false, "note": "통증·이상 의심 시 수의사 상담 권장. 진단 아님" }
}
```

---

## 8. 기술 스택 · 배포 (마음수달과 동일)
- Cloudflare Workers + Hono + D1 + KV / 프론트 React CDN(무빌드) / GitHub `maumgyeot` → Cloudflare 자동 배포.
- `src/auth.ts`는 `../_shared/auth.ts` 동일 사본. `AUTH_DB`=공용 maum-auth(마음수달과 같은 D1), `DB`=maumgyeot-db(신규).
- JWT_SECRET 시리즈 공유. LLM은 **Cloudflare AI Gateway 경유**(마음수달서 검증 — 직접 api.anthropic.com 403).

---

## 9. 로드맵
- **MVP:** 보호자 가입 → 반려동물 1마리 등록 → **신호 선택 + 맥락(+사진)** → 통역 리포트 1종. **고양이 우선**(개는 사전만 추가하면 확장).
- **2차:** 짧은 영상(온디바이스 분석·휘발성), 행동 도감 확장, 관찰 누적 추이.
- **착수 순서:** D1 스키마 → 인증(auth.ts 사본) → 반려동물 등록 → 행동사전 API → 관찰·통역 → 결과 화면 → 도감.

## 10. 열린 결정
1. 과금 모델(마음수달과 통일 여부)
2. 영상 분석 온디바이스 방식·시점(MVP는 사진+신호선택 권장)
3. D1 한도(현재 계정 10개) — maumgyeot-db 슬롯 확보 필요(정리/업그레이드)
