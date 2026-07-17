# CLAUDE.md — 마음세대 (maumsedae)

> **마음세대** = 부모-자녀 세대 통역. **마음부부에서 파생(fork)**. 라이브: https://sedae.maumful.com
> 루트 공통규칙은 `../CLAUDE.md`, 공용 엔진의 진본은 **마음부부**(`../maumbubu`). 기획 진본은 개발패키지(`_assets/files.zip` → `부모자녀_개발패키지.zip`: SPEC_GENERATION·DEV_01).
> 상세 이력은 메모리 `project_maumbubu`(마음세대 항목).

## 인프라 (마음부부와 동일 패턴)
- 워커 `maumsedae` + `sedae.maumful.com`(custom_domain). DB=**maumful-db**·KV 공유 → **신규 D1 없음**.
- 진입: 마음풀 `GET /api/sedae-token`(type:`'sedae'`·7일) → `?t=` → localStorage(`sedae_token`). 워커는 공유 KV의 JWT_SECRET으로 검증.
- ⚠️ **토큰 타입 격리**: `verifyJWT`가 `['sedae']`만 허용. 파생 시 `['bubu','couple']`을 그대로 둬 로그인이 전부 막혔던 적 있음.
- AI: **AI Gateway 경유** 필수. 시크릿 `ANTHROPIC_API_KEY`(사용자 직접 등록).
- ⚠️ **node_modules를 지우면 배포가 깨진다**(`Could not resolve "hono"`). 커밋 제외는 `.gitignore`로만.

## ⚠️ 이 앱의 근본 구조 — 다중 관계
부부는 관계가 1개지만 부모-자녀는 **사용자당 복수**가 기본(아버지·어머니는 완전히 다른 관계, 부모는 자녀 여럿과 각각).
- `sedae_relations`(owner_id·owner_role·counterpart_label·counterpart_context) / 통역·기억·활동·안전은 **전부 선택된 relation 스코프**.
- `sedae_relation_memory`는 **(relation_id, user_id) 복합키**(마음부부 ADDENDUM 02 상속). ⚠️ 단일키면 상대 기억이 내 프롬프트에 주입 — 이 앱에선 **아이가 입력한 학대 정황이 부모에게 새는** 것이라 더 위험. `past_patterns`·`life_stage`가 이중 폭풍 장기기억.
- `userRole`·`counterpartContext`는 요청이 아니라 **DB에서** 파생(위조 방지).

## ⚠️ 청소년(만14~18) — 이 앱의 심장, 원칙이 하나 뒤집힌다
"회복 책임을 아이에게 지우지 않는다". 성인 모드의 "통역→이해→관계개선 활동"을 그대로 주면 *"부모 마음을 네가 헤아려 먼저 다가가라"* = 피해자에게 짐 지우기.
- **프롬프트**: `teenModule`이 **프리앰블 직후 최우선**(트랙·모드의 활동 지시를 선점). 자책해소 1순위·자기돌봄형 활동만·안전민감도 상향·1388/학교상담교사·자해자살 109·기독교 공경 보호조항.
- **코드 레벨 차단**(프롬프트로만 막지 않음): 멀티모달·커뮤니티·공유발신·초대 403(`TEEN_BLOCKED`). ⚠️ **`TEEN_BLOCKED`는 `NOT_YET`보다 먼저** 실행해야 한다 — 순서가 바뀌면 503이 teen 403을 가려 아동 안전 가드가 검증 불가 상태가 된다.
- **결제**: 청소년 **무료 전용**(민법 미성년자 취소권 회피 + 기획 원칙). cost 0 + 일일 10회(`TEEN_DAILY_LIMIT`).
- 하한 14세: 만14세 미만은 법정대리인 동의 필요 → 부모 갈등 앱에 부모 동의를 요구하면 서비스가 성립하지 않음.
- **연령등급은 KV에 저장하지 않고 매 요청 생년월일에서 재계산**(`getAgeTier`) — 저장하면 만19세 자동 전환이 안 된다.

## ⚠️ 프리앰블은 관계별로 분기 (실사고)
`commonPreamble(relationContext)`. 파생 초기에 "당신은 **마음부부**의 관계 통역가입니다. **부부 사이**의 대화를…"을 그대로 둬서 **부모-자녀 입력에 배우자 갈등 통역이 나왔다**(실측). 프리앰블은 최상단이라 여기서 정한 정체성이 뒤의 모든 지시를 이긴다.

## 안전 (마음부부와 동일 — 버전 분기 금지)
SAFETY_OVERRIDE T1/T2/T3 + 109/1388/1366/1577-1389/112. **안전 규칙을 고칠 일이 생기면 마음부부와 양쪽에 동일 반영**.
- 프론트 `SafetyScreen`: 공유·활동·커뮤니티 버튼 미노출 + 기관 `tel:` 링크.

## ★ 공유 웹뷰 (3단계-f — 이 앱의 핵심 차이)
`GET /s/:id` — **인증 미들웨어 밖**(`src/index.ts`)의 공개 라우트. `sedae_shared_items.id`(랜덤 24자)가 곧 열쇠.
- 왜: DEV_01 §4 *"미가입 상대는 앱 설치 없이 웹뷰로 열람 가능 — 70대 부모 실효성의 조건"*. 마음부부의 초대코드(쌍방 앱 사용 전제)로는 성립 안 됨.
- ⚠️ **노출은 `payload`(공유 승인분)뿐** — 통역 이력·관계 기억·수신 통역 결과·상대 계정은 **조회조차 하지 않는다**. HTML 이스케이프·noindex·발신자는 역할 라벨('자녀'/'부모님')로만(실명·이메일 금지).
- 철회(`DELETE /api/share/:id`) 시 웹뷰가 즉시 만료 안내로. **T1/T2 안전 relation은 발신 403**(가해자 흔적 방지).
- 프론트 Share = 미리보기 확인 1회 → 링크 생성 → 카톡/문자 전달. **청소년은 버튼 자체를 렌더하지 않음**(서버도 403 — 이중 차단).

## MVP 제외·후순위 (`NOT_YET` 게이트로 명시 차단 — 조용한 500 방지)
- **멀티모달 403**: SPEC 6장 — 마음부부의 코드 동의 게이트는 70~80대 노부모에게 비현실적 → **재설계 필요**.
- **`relation/invite`·`join` 503**: 마음커플식 초대코드. ⚠️ **웹뷰가 생겨 필요성 재검토 필요**(상대가 가입 안 해도 열람되므로 초대의 목적이 달라짐).
- 시니어 풀 UX·**치매/노인우울 감지 레이어**(SPEC 7장 — phyweb 임상 자산 연계), 청소년 커뮤니티, 형제자매 축, DSI 연동, 명절 시즌모드.

## 커뮤니티 (성인 전용)
`sedae_community_posts`(room·author_hash·body). 방 5개 화이트리스트: `teen_parent`/`retire_dad`/`holiday`/`caregiving`/`kangaroo` — 서버·프론트 **양쪽이 같아야 한다**(프론트 기본값이 구 `couple`이라 첫 진입이 400 났던 적 있음).
- AI **사전 검수** 통과분만 저장(사후 삭제 아님) · **author_hash만**(user_id 저장 금지) · 청소년 403.

## 빌드 / 배포 / 검증
```bash
npm run build:jsx    # sedae_hub.jsx → compiled/sedae_hub.js
./node_modules/.bin/tsc --noEmit
node scripts/render_smoke.cjs public/static/compiled/sedae_hub.js
npx wrangler deploy  # 포그라운드, limyj007 계정
```
- 프론트 수정 시 `public/index.html`의 `sedae_hub.js?v=N` **캐시 bump**.
- ⚠️ **빌드·render_smoke가 통과해도 화면이 백지일 수 있다** — 파일 끝 `ReactDOM.createRoot(...).render(<App/>)` 마운트 코드를 실수로 지운 적 있음. **브라우저로 실제 렌더 확인 필수**.
- ⚠️ **한글 페이로드는 UTF-8 파일 + `curl --data-binary @file`** 로 보낼 것. Git Bash에서 `-d '{"input":"한글"}'`은 **깨져서 전달**된다(모델이 "글자가 깨져서 읽기 어렵다"고 응답 → 파싱 실패로 오인).

## 감수 대기 (기획자 — 개발과 병행)
1. **공경과 분리 렌즈 최종 문구** — 기독교 상담 전문가 감수(현재 DEV_01 초안 사용, 코드에 명시).
2. **청소년 케이스뱅크 6케이스** — T2 경계 케이스 비중 상향. *관측: 모호한 반복학대("계속 심한 말")엔 T2 미발동 — 마음부부의 과발동 방지 규칙과 청소년 민감도 상향이 긴장 관계. 트랙별 톤도 흔들림(T1 반말/기독교 존댓말).*
3. **거점 마케팅 타겟** — 1차 폭풍(사춘기 자녀 둔 4050) vs 2차 폭풍(성인 자녀).
