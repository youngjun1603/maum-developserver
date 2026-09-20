# BATCH_01 작업 결과 보고서

> 정본. (2026-09-19 작성분을 tracked 위치로 이관 + 후속 반영 주석 추가 2026-09-20)

| 항목 | 내용 |
|---|---|
| 배치 | BATCH_01_보안긴급 |
| 작업일 | 2026-09-19 |
| 대상 이슈 | R-01·R-02·R-05·R-23·R-42·R-43 (6건) |
| 완료 | 6건 (R-43은 A+B, C는 미착수) |
| 부분 완료 | 0 |
| 미착수 | R-43-C(이메일 수집 UI — 신규기능·미요청) |
| 배포 | 완료 (maumgame·cts-game·maumbubu·maumsedae·lightoflife) |

## 1. 이슈별 처리 결과

| 이슈 | 제목 | 결과 | 커밋 | 배포·검증 |
|---|---|---|---|---|
| R-01 | 게임 리더보드 이메일 노출 | ✅ 완료 | maumgame·cts 게임 | ✅ 라이브 무인증 401·이메일 제거 |
| R-02 | weekly-report IDOR | ✅ 완료 | 위와 동일 | ✅ 라이브 무인증 401 |
| R-05 | 부부·세대 share/respond 소유권 | ✅ 완료 | maumbubu·maumsedae | ✅ 배포·앱 무영향 |
| R-23 | 부부 토큰타입 bubu 한정 | ✅ 완료 | maumbubu | ✅ 배포·앱 무영향 |
| R-42 | 네이버 로그인 CSRF | ✅ 완료 | cts(서브모듈) | ✅ state저장/위조거절+실로그인 성공(사용자) |
| R-43 | 소셜 가입 verified | ✅ A+B | cts(A) / DB(B) | ✅ 실측 1건·정정·잔여0 |

## 2. 이슈별 상세

- **R-01**: `/api/game/leaderboard` — `getGameUserId` 인증 추가 + `SELECT u.email` 제거·`gs.user_id` 대체. 프론트 `game_hub.jsx` email 의존 4곳(Leaderboard prop·isMe 비교·닉네임 폴백·호출부)을 user_id 기반으로. `build:jsx` 재컴파일·커밋. 양쪽(마음게임·CTS게임).
- **R-02**: `/api/recovery/weekly-report/:userId` — **2안 채택**(라우트 표면 무변경·최소위험): 토큰 uid로만 조회 + 경로값≠uid면 403. 응답 키·기본값 불변. (1안=라우트에서 param 제거도 가능했으나, 운영 표면 변경 최소화를 우선.)
- **R-05**: share/respond — **assertRelationOwner 재사용 2단계**(서브쿼리 컬럼 추측 회피): `SELECT relation_id,sender_id` → 발신자 자가수락 차단 + 관계 당사자 검증 → UPDATE, 실패 404. 부부·세대 양쪽. 세대 TEEN_BLOCKED 가드 무변경.
- **R-23**: `verifyJWT` `['bubu','couple']`→`['bubu']`. maumful access_token 폴백(p.type 없음)은 통과 유지. 세대는 이미 `['sedae']`로 무변경.
- **R-42**: 네이버 경로만 — url을 async로 KV `naver_state`(600s) 저장, 콜백에서 검증·1회소비, naver postMessage 5곳 `'*'`→origin. **카카오 postMessage 2곳 무변경**(카카오 로그인 무영향).
- **R-43-A**: 카카오·네이버 INSERT `is_email_verified` `email?1:0`→`1`(3곳). 구글(이미 1)과 통일. **R-43-B**: 기존 미인증 소셜계정 1건(id=10 kakao `@kakao.local`) `is_email_verified=1` 정정(changes=1·잔여0).

## 3. 전제 불일치 (지시서/RISKS ↔ 실제 코드)

| 이슈 | 전제 | 실제 |
|---|---|---|
| R-05(세대) | 주석 "share/*는 NOT_YET 게이트로 차단 중" | NOT_YET 맵엔 consent/* 3개뿐 — share/respond는 성인계정에 도달함(수정 유효) |
| R-43 | "인증 게이트에 잠긴다" | login 게이트가 password_hash 검사 뒤라 소셜계정은 도달 안 함. 실피해는 .local 수신불가·계정분리·시한폭탄 |
| R-43 실측 | 다수 예상 | 영향 소셜 미인증 **1건뿐**(테스트성) |
| R-01 | "프론트는 '나' 표시용으로만" | `game_hub.jsx:640` 닉네임 폴백에서도 email 사용 → 두 곳 다 수정 |

## 4. 작업 중 새로 발견한 것

| # | 내용 | 심각도 | 조치 |
|---|---|---|---|
| 1 | **마음풀 본체에 R-42·R-43과 동일 결함** — 네이버 state 미저장·소셜 `email?1:0` | S2 | **후속 반영됨(2026-09-19, 사용자 "마음풀 본체도 지금 수정해 줘")** — 본체는 유지보수 모드 아니라 별도 처리 완료. |
| 2 | CTS 카카오는 state 미발급(개발자센터 설정 수반) | S2 | 범위 밖 |
| 3 | CTS 네이버 redirect 폴백이 꺼진 워커주소 | S3 | **BATCH_06 R-49로 후속 해소**(폴백→jesusmaum.com·dev SERVICE_URL) |

## 5. 미착수·보류
- **R-43-C**(이메일 수집 UI): 신규기능·CTS 유지보수 모드·미요청 → 보류.

## 6. 사용자 확인이 필요한 사항
- (§4-1 마음풀 본체 동일결함) → **사용자 승인받아 후속 반영 완료.** 잔여 확인사항 없음.

## 7. 갱신 문서
- 각 서비스 `docs/DESIGN.md §15`·`_docs/RISKS.md` 해소 표기는 배치 마감 시 일괄(2026-09-20 개정이력 보완에 포함).

## 8. 커밋 목록
| 커밋 | 서비스 |
|---|---|
| `3ea8ff7` | [maumgame][cts] R-01·R-02 |
| `b7dc110` | [maumbubu][maumsedae] R-05·R-23 |
| `06b7717` | [cts] R-43-A + 포인터 |
| `feadd3a` | [cts] R-42 + 포인터 |
| (DB) | R-43-B lightoflife-db id=10 정정 |
| (후속) | 마음풀 본체 R-42·R-43 동일결함 반영 |
