# 마음부부 (MaumBubu) — 개발 착수 패키지

부부 관계 통역 서비스. 마음(Maum) 생태계의 신규 앱.
이 패키지는 클로드코드(Claude Code)로 개발을 시작하기 위한 완결된 스펙 + 핵심 코드 자산이다.

## 📦 패키지 구성

| 파일 | 역할 |
|---|---|
| `SPEC_MASTER.md` | **단일 진본.** 엔진 아키텍처·이론 뼈대·데이터 구조·MVP 명세·안전 가드레일 전체. 개발 전 반드시 정독 |
| `translation-prompts.ts` | **핵심 IP.** 프롬프트 조립 엔진 (2트랙 × 4모드 × 슬라이더). TypeScript strict 검증 완료 |
| `translate-route.ts` | Hono API 라우트. 통역 실행 + 동의 게이트 3종 + 관계 기억. D1 스키마 주석 포함 |

## 🏗 기술 스택 (마음 생태계 표준 — 반드시 준수)

```
백엔드:  Cloudflare Workers (TypeScript) + Hono + D1 + KV
프론트:  Cloudflare Pages + React (CDN 방식, npm 빌드 아님)
인증:    JWT — crypto.subtle 방식 필수 (btoa() 금지: 76자 줄바꿈 버그)
AI:      Anthropic API (claude-sonnet-4-6)
배포:    GitHub push → Cloudflare 자동 빌드 (로컬 dev 서버 없음)
```

### ⚠️ 필수 규칙
1. **JWT는 crypto.subtle** — btoa() 직접 사용 금지. 한국어 페이로드는 TextEncoder UTF-8 필수
2. **CORS는 동적 오리진 매칭** — credentials:true라 와일드카드(*) 불가
3. **D1 제약**: DROP COLUMN / RENAME COLUMN 미지원. ADD COLUMN만 가능
4. **exp는 초 단위**: `Math.floor(Date.now() / 1000) + 초`
5. **이메일 인증 코드 보존**: 마음 생태계 공통 규칙 — 비활성 상태의 이메일 인증 코드는 삭제하지 말고 유지

## 🚀 개발 순서 (권장)

### Phase 1 — 백엔드 코어 (이 패키지의 코드로 즉시 시작 가능)
1. Workers 프로젝트 생성, `translation-prompts.ts` + `translate-route.ts` 배치
2. `index.ts`에 라우트 연결:
   ```typescript
   import translate from './translate-route';
   app.route('/api', translate);
   ```
3. D1 생성 후 `translate-route.ts` 주석의 스키마 4개 테이블 실행
   (couple_relations / relation_memory / consent_sessions / translation_logs)
4. Secrets 등록: `ANTHROPIC_API_KEY`, `JWT_SECRET`
5. `/api/translate` 스모크 테스트 (수신 모드 × 두 트랙)

### Phase 2 — 인증·관계 연결 (마음커플 패턴 재사용)
- 마음커플의 JWT SSO 패턴 이식 (crypto.subtle 방식)
- 가입 시 본인인증 연령 수집 → 성인 게이트 (계정에 생년월일+연령등급 필드, SPEC 10.4)
- couple_relations 생성 플로우 (혼자 사용 가능: user_b_id NULL 허용)
- 배우자 초대 코드 (기존 마음커플 초대코드 로직 재사용)

### Phase 3 — 프론트 (SPEC_MASTER.md 8.1 화면 구성 참조)
- 온보딩: 트랙 선택(심리상담/기독교) + 슬라이더 설정 + 안전 고지
- 홈: 4모드 진입 (수신·발신·중재·관점)
- 각 모드 화면: 입력 → API 호출 → JSON 결과 렌더 (improvement 블록 강조 표시)
- 활동 체크인: 탭 3단 피드백 (해봤어요/반응/자유서술) → /api/feedback
- 커뮤니티: 주제방 목록·글쓰기(사전 검수 UX: 거부 시 사유+수정하기 버튼)·공감 반응
- 관계 기억 열람 화면
- 동의 요청/수락/철회 UI

### Phase 4 — 멀티모달 (마음수달·마음곁 기능 이식)
- 동의 게이트 활성 세션에서만 캡처 UI 노출
- 녹음/영상 → 비언어 신호 추출 → `multimodal` 파라미터로 통역 API 전달
- 원본 처리 정책 구현 (세션 종료 시 삭제 기본값)

## 🔒 절대 지켜야 할 설계 원칙 (SPEC_MASTER.md 8장)

1. **안전 오버라이드는 프롬프트에 상시 포함** — 이미 `translation-prompts.ts`에 구현됨. 제거 금지
2. **동의 없는 멀티모달 주입 차단** — 코드 레벨 구현됨 (`consentSessionId` 검증). 우회 로직 추가 금지
3. **원문 미저장** — translation_logs에는 track/mode만. 대화 원문·통역 결과를 로그에 저장하지 말 것
4. **동의는 대상 본인만** — 요청자 스스로 수락 불가 (구현됨). 유지할 것
5. **모든 통역 출력은 가설 어법** — 프롬프트가 강제하지만, UI 문구도 단정형 금지
6. **커뮤니티는 사전 검수만** — 검수 통과분만 DB 저장. 사후 삭제 구조로 바꾸지 말 것. 거부 시 반드시 사유+수정 제안 반환 (말없는 차단 금지)
7. **활동 자유서술(note) 미저장** — activity_log에는 활동·상태·반응만. 커뮤니티 author_hash만 저장(user_id 직접 저장 금지)
8. **분리 보호 3단계(T1/T2/T3) 유지** — 학대 신호 시 회복 활동 제안 금지·거리두기 지지는 법 기반 절대 규칙(SPEC 9.1). 프롬프트의 SAFETY_OVERRIDE를 축약·완화하지 말 것
9. **마음부부는 성인 전용** — 가입 시 본인인증 연령 게이트 적용. 계정 스키마에 생년월일+연령등급 필드를 지금 넣을 것(후속 세대통역 앱이 3층 체계를 상속)

## 📋 API 요약

```
POST /api/translate          통역 실행 (출력에 improvement 활동 블록 포함)
  body: { relationId, track: 'psychology'|'christian',
          mode: 'receive'|'send'|'mediate'|'perspective',
          input, emotionDepth?, theologyLevel?, pastoralTone?,
          userContext?, multimodal? }

POST /api/feedback           활동 실행 피드백 → 재해석 응답 + 성공공식 축적
  body: { relationId, track, feedback: { activity, status, reaction?, note? } }

POST /api/community/post     커뮤니티 게시 (AI 사전 검수 게이트 — 통과분만 저장,
                             거부 시 사유+수정제안 반환, 위기는 보호 분기)
GET  /api/community/posts    주제방별 글 목록 (?room=&limit=)

POST /api/consent/request    동의 코드 발급 { relationId, requesterId, mediaType }
POST /api/consent/accept     배우자 동의   { consentCode, consenterId, agreed }
POST /api/consent/revoke     동의 철회     { consentSessionId, userId }
GET  /api/memory?relationId= 관계 기억 조회

# 선택적 공유 브리지 (ADDENDUM 01 §1) — 건별 명시 공유만, T1/T2 세션 차단
POST /api/share/send         승인 항목 공유 { relationId, itemType, payload }
                             itemType: message|mediate_view|perspective_view|activity_invite
GET  /api/share/inbox        받은 공유 목록 (?relationId=&peek=1은 읽음처리 안함)
POST /api/share/respond      활동 제안 수락 { shareId, action:'accepted' }
POST /api/relation/invite    배우자 초대코드 발급 { relationId } (마음커플 6자 코드 패턴)
POST /api/relation/join      코드로 배우자 연결 { inviteCode }

# 성인 게이트 (ADDENDUM 01 §3) — 마음부부 만19세+ 전용
POST /api/age/verify         성인 확인 { birthDate:'YYYY-MM-DD' } → KV 성인 플래그
                             (/api/relation 응답의 adult 플래그로 게이트 판단)

# 인증: 모든 라우트 Bearer 토큰 또는 ?t= (JWT type: bubu|couple), 크레딧: receive/send 2·mediate/perspective 3
```

## 다음 자산화 단계 (개발과 병행)

- **케이스 뱅크**: 기독교 상담 전문가 감수 케이스 20~30건 — 품질보증·마케팅·교회신뢰·향후 개선 데이터
- **교회 채널**: 기독교 트랙 선(先)출시 전략 (SPEC_MASTER.md 10.2)

## 후속 앱 (마음부부 완성 후)

**부모-자녀 세대 통역** — 동일 엔진 재사용. 상세 기획은 **별도 개발 패키지(부모자녀_개발패키지)** 참조.
마음부부 개발 중에는 착수하지 않되, 계정 스키마의 연령등급 필드와 relation type 파라미터화만 지금 준비한다(SPEC 10.4).
