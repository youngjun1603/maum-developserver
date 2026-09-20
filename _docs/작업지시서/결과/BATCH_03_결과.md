# BATCH_03 작업 결과 보고서

> ⚠️ **재구성 보고서** — 스키마 3건(R-03·06·07)은 2026-09-19 세션 구현분, 문서 3건(R-20·34·51)은 2026-09-20 구현분. 커밋 이력 + 원격 실측으로 재구성.

| 항목 | 내용 |
|---|---|
| 배치 | BATCH_03_스키마 |
| 작업일 | 2026-09-19 ~ 2026-09-20 |
| 대상 이슈 | R-03·06·07·20·34·51 (6건) |
| 완료 | 6건 |
| 배포 | 완료 (maumful·maumcouple·maumotter·maumgyeot·maum-auth). 문서 3건은 코드·스키마 무변경 |

## 1. 이슈별 처리 결과

| 이슈 | 심각도 | 제목 | 결과 | 커밋 |
|---|---|---|---|---|
| R-03 | **S1** | `partner_commissions` CREATE 마이그레이션 없음 | ✅ 완료(역기록) | 6b601cb |
| R-06 | S2 | `/api/couple/timeline` 없는 컬럼 500 | ✅ 완료 | fc2681c |
| R-07 | S2 | `external_orders`·`email_verified` 마이그레이션 없음 | ✅ 완료(역기록) | 6391809·cc19bdf·03842dc |
| R-20 | S3 | `couple_sessions` 사본 CHECK 누락 | ✅ 완료(문서) | 6402820 |
| R-34 | S3 | CTS 마이그레이션 번호 갈라짐 | ✅ 완료(문서) | 6402820·03448f3 |
| R-51 | S3 | `payments` 테이블 미존재 문서 오류 | ✅ 완료(문서) | 6402820 |

## 2. 이슈별 상세

- **R-03 (S1)**: `partner_commissions`는 코드가 INSERT/UPDATE만 하고 CREATE가 어디에도 없었다(0029 `external_grants` 사고와 동일 패턴). **역기록(役記錄)**: 프로덕션엔 이미 테이블이 존재(실측)하므로 **DDL 변경 없이** `IF NOT EXISTS` CREATE 파일(`0030_partner_commissions.sql`)만 추가해 재구축 대비. 적립 3곳의 silent `.catch(() => {})`를 로그로 전환.
- **R-06**: `/api/couple/timeline`이 없는 컬럼(`cs.code`·`cs.test_types`)을 SELECT해 500. 실제 컬럼(`session_code`·`test_type`)으로 정정 + 타입 선언 제거.
- **R-07**: `external_orders`(수달·곁)·`email_verified`(maum-auth) 테이블이 프로덕션엔 있으나 마이그레이션 파일 없음 → 역기록 `IF NOT EXISTS` 파일 추가(무DDL변경). maum-auth 기존 2행 `email_verified=1` 그랜드파더링(test 계정·소유자 본인).
- **R-20/34/51**: 순수 문서·아카이브. D1_SQL_실행순서.sql CHECK 2개·인덱스명 정본 일치 + 재실행금지 헤더(운영DB는 이미 CHECK 실측 확인→무변경) / CTS 마이그레이션 번호 규칙 CLAUDE.md 명문화(rename 0건) / payments·subscriptions·usage_history 미존재(0004 DROP·원격 실측) DESIGN.md·SETUP.md 정정.

## 3. 전제 불일치 (지시서/RISKS ↔ 실제 코드)

| 이슈 | 전제 | 실제 |
|---|---|---|
| R-03 | "테이블이 없어 적립이 실패 중" | **프로덕션엔 실재**(실측). 손실 0·누락 적립 0. 파일만 없어 재구축 시 위험 → 역기록으로 해소 |
| R-07 | "마이그레이션이 없어 지급 실패" | 프로덕션 테이블 실재(역기록 패턴). DDL 변경 불필요 |
| R-20 | "사본 3개" | **4개**(CTS 포함). 운영 DB엔 이미 CHECK 있음(SQLite 사후추가 불가라 무변경) |
| R-51 | "payments가 레거시로 남아 있음" | **DROP됨**(0004 L8-10). 원격 실측에서 payments/subscriptions/usage_history 모두 부재 확인 |

## 4. 새로 발견/실측한 것 (원격 D1)
- `partner_commissions`·`external_orders`·`email_verified`·`couple_sessions`(CHECK 포함) 모두 **프로덕션 실재** → 이 배치의 스키마 수정은 전부 **역기록(파일 정합)**이고 **운영 스키마 무변경**. D1 원격 마이그레이션 트래킹 부재로 파일↔실DB가 어긋나 있던 구조적 문제를 파일 쪽에서 정상화.
- ⚠️ **D1 원격 마이그레이션 트랩**: `migrations apply --remote` 금지(0001부터 재적용 충돌). `execute --remote --file`+`IF NOT EXISTS`만 사용 — CLAUDE.md에 기록됨.

## 5. 미착수·보류
- 없음. (스키마 3건은 역기록으로 완료, 문서 3건 완료)

## 6. 사용자 확인이 필요한 사항
- email_verified 그랜드파더링 범위(2행)는 test·소유자 계정이라 확인 후 진행 완료. 잔여 없음.

## 7. 커밋 목록
6b601cb(R-03·R-42·R-43-A) · fc2681c(R-06) · 6391809·cc19bdf·03842dc(R-07) · 6402820(R-20·R-34·R-51 + 서브모듈 03448f3 R-34)
