# 마음커플 → 마음결(ai_couple_counseling) 이식 노트

기존 `package/maumcouple`(Cloudflare 단일파일 React, SSO 위성)의 기능을 이 Next.js 앱으로 이식한 기록입니다.
**배포처/DB/인증/결제는 미정** — 이 결정은 별도 에이전트가 진행합니다. 아래 "남은 작업"은 그 결정 이후 붙이면 됩니다.

## ✅ 이번에 이식 완료 (자체 완결 · 인증/DB 불필요 · 즉시 작동)

| 기능 | 경로 | 파일 |
|------|------|------|
| 나의 연애 유형 테스트 (7문항, S/R/P/F) | `/love-type` | `src/app/love-type/page.tsx`, `src/data/loveType.ts` |
| 커플 스타일 퀴즈 (10문항, A/B/C/D) | `/quiz` | `src/app/quiz/page.tsx`, `src/data/coupleQuiz.ts` |
| 오늘의 대화 질문 (60개 풀) | `/daily` | `src/app/daily/page.tsx`, `src/data/dailyQuestions.ts` |
| AI 데이트 코스 추천 | `/date-course` | `src/app/date-course/page.tsx`, `src/app/api/date-course/route.ts` |
| LOST 행동유형 검사 + 커플 궁합 분석 | `/lost` | `src/app/lost/page.tsx`, `src/data/lost.ts` |

> LOST는 60문항 단독 검사 → 16유형 판정 후, **상대 유형을 선택**해 궁합(match/conflict + 축 일치도)을 client-side로 분석. 실시간 페어링 없이 동작. 결과는 `localStorage(maumkyeol_lost)` 저장. DB 도입 시 "상대 유형 선택"을 실제 커플 페어링으로 대체하면 정교해짐.

- 홈(`src/app/page.tsx`) 기능 그리드에 4개 카드 추가.
- 디자인은 기존 앱 컨벤션(Tailwind 토큰 · `Card`/`Button` · framer-motion)으로 재작성. 원본의 인라인 스타일/`COUPLE_LANG` i18n은 가져오지 않음(현재 앱은 한국어 단일).
- 데이트코스 API는 기존 앱 방식(Anthropic SDK 직접, `process.env.ANTHROPIC_API_KEY`, `claude-haiku-4-5-20251001`)을 따름. **크레딧 차감 없음** — 결제 도입 시 게이팅 추가 필요(원본은 3cr).

## 기존 앱이 이미 갖고 있던 것 (이식 불필요)
심리검사(`/test`), 커플 궁합 분석(`/couple`), AI 관계 코치(`/coaching`), 카톡 분석(`/kakaotalk`), 감정번역·싸움중재(`/coaching/tools`).

## ⏳ 남은 작업 — 인증/DB 결정 후 이식 (원본 `package/maumcouple`에 있음)
이 기능들은 **로그인·DB·실시간 페어링**에 종속되어 현재 베이스(인증·DB 없음)로는 그대로 못 옮깁니다. 배포처/DB 확정 후 진행:

- **커플 페어링/세션 리포트** — 초대코드 발급·참여, 두 사람 검사결과 합산 궁합 리포트 (원본 `/api/couple/session`·`join`·`report`·`session/:code`). 실시간 폴링 + DB 필요.
- **관계 타임라인 / 기념일(D-day) / 관계 체크인** — 사용자별 저장 데이터. (원본 `/api/couple/timeline`·`checkin(s)`) DB 필요. *임시로 localStorage 버전 이식은 가능하나 양쪽 동기화는 불가.*
- **파트너 무드/감사 공유(PartnerMomentsSection)** — 커플 연결 + 상대 데이터 조회. DB 필요.
- **BIG5 커플 비교(Big5CompareView)** — BIG5 검사결과 2인 비교. 검사 점수 저장소 필요.
- **AI 관계 코치 크레딧/일일제한** — 현재 `/coaching`은 무제한. 원본은 무료 3회/일 + 2cr. 결제 도입 시.
- **솔로 분석(SoloAnalysisView)** — 내 검사결과 기반 이상형 분석(원본 5cr). 검사 저장소 + 크레딧.

## 참고 — 원본 데이터 출처
- 질문/유형/계산 로직은 `package/maumcouple/public/static/couple_hub.jsx`에서 그대로 추출(한국어).
- 데이트코스 프롬프트는 `package/maumcouple/src/index.tsx`의 `/api/couple/date-course`와 동일.
