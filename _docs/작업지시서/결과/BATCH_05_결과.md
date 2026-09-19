# BATCH_05 작업 결과 보고서

| 항목 | 내용 |
|---|---|
| 배치 | BATCH_05_기능결함 |
| 작업일 | 2026-09-19 |
| 대상 이슈 | R-08·R-12·R-18·R-19·R-22·R-26·R-27·R-28 (8건) |
| 완료 | 8건 (R-18·R-19는 직전 커밋 `75f9488`에서 이미 반영) |
| 부분 완료 | 0 |
| 미착수 | 0 (R-22는 사용자 승인받아 1단계 구현·2/3단계는 승인범위 밖) |
| 배포 | 완료 (maumgame·lightoflife-game·maumbubu·maumsedae·lightoflife(CTS본체)·maumcouple) |

## 1. 이슈별 처리 결과

| 이슈 | 제목 | 결과 | 커밋 | 배포·검증 |
|---|---|---|---|---|
| R-08 | 번아웃 metadata 키 불일치 → 주간집계 죽음 | ✅ 완료 | `[maumgame]`·`[cts]` | maumgame 628145d2·cts-game eca55846 |
| R-12 | 성경 정확성 가드 폴백 1곳만 | ✅ 완료 | `[cts]` 서브모듈 7ad5630 | lightoflife 2db24679·운영DB 실측 has_guard=1 |
| R-18 | 게임 딥링크 `qt` 누락 | ✅ 완료(직전) | `[cts]` 75f9488 | 직전 배포 |
| R-19 | `PHYWEB_URL` 마음풀 하드코딩 | ✅ 완료(직전) | `[cts]` 75f9488 | 직전 배포 |
| R-22 | 마음커플 위기감지 전무 | ✅ 완료(1단계·승인) | `[maumcouple]` 6f2c4ac | maumcouple 868a78d9·로직 7/7 |
| R-26 | 부부 공감반응 반쪽 | ✅ 완료 | `[maumbubu]` 0d9e893 | maumbubu 30d4b922·멱등 테이블 생성 |
| R-27 | 세대 프롬프트 부부문구 | ✅ 완료 | `[maumsedae]` ce2ce5e | maumsedae 1656c6dc |
| R-28 | 세대 이중폭풍 장기기억 미배선 | ✅ 완료 | `[maumsedae]` ce2ce5e | maumsedae 1656c6dc |

## 2. 이슈별 상세

- **R-08**: 서버(`handleScheduled`·`signalsFromSessions` 두 곳)를 `completedMissions ?? missions_completed`, `energy ?? energy_gained` 로 **관대하게** 읽어 구·신 키 모두 수용(마음게임·CTS게임). 프론트 `burnout.jsx` metadata 에 canonical 키(`completedMissions`·`energy`) 추가, 구 키 유지(호환). `build:jsx` 양쪽 재컴파일·커밋.
  - **척도/임계값 판단(지시서 요구)**: `energy` 는 `energy: Math.max(0, Math.min(100, Math.round(energy)))` 로 **0~100 클램프** 후 저장. 화면 `energy` 상태는 상한 150(`energyPct=energy/150`)이라 그대로 넣으면 서버 주석의 "스스로 매긴 0~100" 정의와 어긋나 `avgEnergy < 40` BURNOUT 제안이 왜곡된다 → 100 클램프로 정의에 맞췄다. **임계값 `< 40` 은 유지**: 클램프된 0~100 현재에너지에서 40 미만은 "실제로 낮은 에너지"에 해당해 과발동 위험이 없다(옛 `energy_gained` 30~60 합산값과 달리 의미가 정합). 임계값 변경은 사용자에게 보이는 검사제안 성향 변경이라 하지 않았다.
  - **실측**: 원격 `game_session_logs` 조회 시 마음게임에 번아웃 세션이 존재하나 옛 키(`missions_completed`/`energy_gained`)로 굳어 있어 서버 관대읽기로 **기존 행이 즉시 부활**. CTS게임은 cron 주석 상태라 무증상(주석 미해제 — 범위 밖).
- **R-12**: **운영 DB 실측이 결론을 바꿨다.** `ai_config` biblical 3키 전부 `has_guard=1`(chat·format·persona, 각 2026-05~07 갱신) → **현재 운영은 이미 가드 적용**(DB가 코드폴백을 이김). 지시서 3단계 규칙("has_guard=1이면 DB 무변경")대로 **운영 DB 미변경**(사용자 결정 불필요). 코드 폴백은 `FALLBACK_BIBLICAL_PERSONA`·`_FORMAT` 에 CHAT의 감수완료 가드 복사(지어내지마세요 3곳). 시드(`0016`)는 biblical/general analysis_format 옛 4섹션판 → 코드와 동일 5섹션판(`[이어서 물어보기]` 포함)으로 교체 + 3키 가드. `INSERT OR IGNORE`라 재구축 대비(운영 무변경). `cts-maum-main/CLAUDE.md` L73 을 3층(운영DB·시드·코드폴백) 실제와 일치하게 정정.
  - **라이브 검증 상태**: 이 배포는 **런타임 무영향**(DB에 가드가 있어 코드폴백은 휴면). 성경인용·위기 케이스 라이브 응답은 이미 가드된 DB 동작이며 배포 전후 동일 → 별도 라이브 태우기는 유효 토큰 확보 시 스팟체크 권장(무영향이라 필수 회귀는 아님). 실측 쿼리 결과는 상단 기록.
- **R-22**: **사용자 승인 = 1단계·마음풀식(109·1577-0199)·마음풀 원문 그대로**(§6). 마음풀 `chatCrisisKeywordHit` 원문 복사(NFC 정규화·오탐 방지 좁은 매칭) + `buildCoupleCrisisPrefix`(마음풀 원문). 4개 자유서술 라우트(`emotion-translate`·`fight-mediate`·`kakao-analyze`·`coach`)의 result/reply 반환 직전에 **사용자 입력 기준** 적중 시 안내를 맨 앞에 삽입(적중 없으면 무동작=기존 흐름 무영향). `coach`는 마지막 user 메시지만 검사. 크레딧 차감 흐름 무변경(AI 성공 후 차감). pre-wrap 렌더·마크다운 없음.
- **R-26**: `community_empathy(post_id, author_hash)` PK 멱등 테이블(`0004_empathy.sql`, 원격 생성 완료). `POST /api/community/empathy`: `INSERT OR IGNORE`→`meta.changes` 선판정→`UPDATE ... RETURNING`, 이미 누른 사람은 `already:true`. `author_hash=hashAuthor(uid)`(서버생성, 클라값 금지). 프론트 표시 div→버튼(낙관적 갱신·실패 롤백·disabled). 순위·경쟁·토글 없음(SPEC 7.3). `render_smoke` 통과.
- **R-27**: `MODE_MODULES`(수신·발신·중재·관점)·`MODE_INPUT_LABEL`·`memoryModule`·`buildMemoryUpdatePrompt`·`buildFeedbackPrompt`·`buildModerationPrompt`·`psychologyTrackModule` 예시의 `배우자/부부/마음부부` → `상대(부모 또는 자녀)/관계/마음세대` 치환. **JSON 출력 키·`commonPreamble`·마음부부 진본 무변경**(`git diff --stat ../maumbubu` 빈 출력 확인). `MODE_INPUT_LABEL`은 userMessage 헤더로 들어가 프리앰블 보호를 못 받는 최우선 누출점이라 반드시 포함.
- **R-28**: `RelationshipMemory`에 `pastPatterns`·`lifeStage` 추가 → `loadMemory` 매핑(평문, safeParse 금지), `saveMemory` INSERT/VALUES/ON CONFLICT/bind **4곳**(life_stage 화이트리스트 `['cohabit','distant','caregiving']` 검증), `buildMemoryUpdatePrompt` JSON 스키마 2줄, `memoryModule` 주입 2곳(과거패턴=가설연결·생애국면=활동제안 제약). 복합키 `ON CONFLICT(relation_id, user_id)` 무변경. 프론트 노출(선택)은 사용자에게 보이는 화면변경이라 미구현(서버 배선만으로 이슈 해소).

## 3. 전제 불일치 (지시서/RISKS ↔ 실제 코드)

| 이슈 | 전제 | 실제 |
|---|---|---|
| R-08 | "키 이름만 맞추면 된다" | **의미도 다르다.** `energy_gained`(오늘 획득 합, 상한 150) vs 서버가 기대하는 `energy`(스스로 매긴 0~100). 프론트에 0~100 클램프한 `energy` 신규 추가로 해결(§2). |
| R-12 | "가드가 코드 폴백 1곳뿐 → 위험" | 맞지만 **운영 DB 3키가 이미 has_guard=1**(DB가 폴백을 이김). 현재 운영은 이미 안전. 이 배치는 재구축 대비(시드)·폴백 정합. `biblical_analysis_format` 시드만 옛 4섹션판이라 코드(5섹션)와 어긋나 있었음. |
| R-27 | "`MODE_MODULES` 등에 부부문구 남음" | 맞고, 추가로 **`MODE_INPUT_LABEL`은 system이 아니라 userMessage 헤더**라 프리앰블 방어 밖 — 가장 먼저 새는 지점. |

## 4. 작업 중 새로 발견한 것 (이 배치에서 미수정)

| # | 내용 | 심각도 | 조치 |
|---|---|---|---|
| 1 | `tree.jsx`가 보내는 `stages_completed`·`answers_filled`를 **서버에서 읽는 코드 0건** — R-08과 같은 종류의 죽은 metadata(게임 2종 공통) | S3 | 범위 밖. RISKS 추가 후보 |
| 2 | CTS `ai_config`는 어드민(`PUT /api/admin/ai-config/:key`)에서 편집 가능 → 가드를 지울 수 있음. `noMd`·`mustKo`처럼 코드가 항상 덧붙이는 방식이 더 견고 | S3 | 범위 확대. 제안만 |
| 3 | 마음커플 `/api/couple/coach`의 KV 일일 카운터는 **TTL 있음 확인**(`expirationTtl: 86400`) — 세대 성인 카운터 무TTL 전례와 달리 정상 | — | 확인 완료(정상) |
| 4 | 마음세대 커뮤니티에 `empathy_count` 계열 반쪽 구현 **없음**(`grep empathy maumsedae/` 0건) — R-26 형제 아님 | — | 확인 완료(해당 없음) |

## 5. 검증 요약

- **빌드**: 게임 2종 `build:jsx` 재컴파일(`compiled/games/burnout.js`에 `completedMissions`·`energy` 키 확인), 마음부부 `build:jsx`+`render_smoke`(Community ReferenceError 없음), 세대·커플·CTS는 문자열 리터럴/서버 로직 수정이라 `wrangler deploy` 번들 검증으로 대체(로컬 tsc 미설치 서비스 있음).
- **원격**: `community_empathy` 생성(rows_written 3). `sedae_relation_memory` 0행(재사용 누적 전). `community_posts` published 0건(R-26 라이브 curl 대상 없음, 로직·배포로 검증). `ai_config` biblical 3키 has_guard=1.
- **R-22 로직**: node 7/7 통과 — 적중 4(죽고싶어·사라지고싶어·자해·I want to die), 오탐 경계 3(서운했어·힘들어 죽겠다·죽을 맛) 회피.

## 6. 사용자 확인 기록

- **R-22 위기감지 범위·문구**(§2.2 필수): AskUserQuestion 3문항 →
  ① 범위 = **1단계만(권장·무회귀)** ② 연락처 = **마음풀식 109·1577-0199** ③ 문구 = **마음풀 원문 그대로**. 승인 범위(1단계)만 구현.
- **R-12 운영 DB**: 실측 has_guard=1 → 지시서 규칙상 DB 무변경 = **사용자 확인 불필요**(값 변경 없음). 문구는 이미 감수·승인된 것을 복사.
- **R-08 임계값**: `< 40` 유지 판단(§2) — 사용자에게 보이는 검사제안 성향 변경 없음 → 확인 불필요.

---

## 관련 배치와 겹친 파일 (rebase 완료 기준)
- `maumgame/cts-game src/index.tsx`·`game_hub.jsx`: BATCH_01(R-01/02)·R-18/19 위에 R-08 반영.
- `maumbubu translate-route.ts`·`bubu_hub.jsx`: BATCH_01(R-05/23)·R-24 위에 R-26 반영.
- `maumcouple src/index.tsx`: BATCH_02(R-21)·BATCH_06(R-06) 무충돌 — R-22는 반환부 삽입만.
