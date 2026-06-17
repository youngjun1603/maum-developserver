# 마음수달 (MaumOtter) — MVP

아이가 수달 '또또'와 대화하면, AI가 부모용 정서 코칭 리포트로 **통역**해주는 서비스.
스택: Cloudflare Workers + Hono + D1 + KV / 프론트 React CDN(무빌드) / 배포 GitHub → Cloudflare.
규칙·설계: `CLAUDE.md`, `docs/`, `../_shared/maum-shared-spec.md`.

## 구성
```
wrangler.toml      Worker·D1·KV·assets 설정
schema.sql         D1 스키마 (대시보드 Console에 붙여넣기)
src/index.ts       Worker (Hono) — 인증·아이·세션·또또 대화·통역·리포트
public/index.html  프론트 (React CDN + htm, 부모/아이 모드)
docs/              spec · dialogue-scenarios · translation-engine
```

## 최초 설정 (대시보드)
1. **GitHub 저장소** `maumotter` 생성 → 이 폴더 내용 push.
2. **Cloudflare → Workers & Pages → Create → Connect Git** → `maumotter` 연결 (Workers Builds 자동 빌드/배포).
3. **D1 2개 생성:**
   - `maumotter-db`(도메인) → ID를 `wrangler.toml` `DB`에 기입 → Console에서 `schema.sql` 실행.
   - `maum-auth`(공용 계정) → ID를 `wrangler.toml` `AUTH_DB`에 기입 → Console에서 `maum-auth-schema.sql` 실행. **마음곁도 같은 maum-auth 바인딩**(통합계정).
4. **KV 생성:** namespace → `id`를 `wrangler.toml`에 기입.
5. **Secrets** (Settings → Variables and Secrets):
   - `JWT_SECRET` — 마음 시리즈 공유값(마음곁과 **동일**, `_shared` 2장)
   - `ANTHROPIC_API_KEY` — 통역/대화 LLM
   - ※ `src/auth.ts`는 `_shared/auth.ts`의 동일 사본 — 인증 로직 수정 시 양쪽 함께.
6. (선택) 커스텀 도메인 `app.maumotter.com` 연결.

## 배포
- 코드 수정 → GitHub push → Cloudflare 자동 배포 (로컬 `wrangler dev` 사용 안 함).
- 스키마 변경은 대시보드 D1 Console에서 `ALTER TABLE ADD COLUMN`만 (DROP/RENAME/타입변경 불가).

## API
`/api/auth/{register,login,me}` · `/api/children`(GET/POST) · `/api/session/start` · `/api/session/:id/utterance` · `/api/session/:id/end`(→통역 리포트) · `/api/reports`(GET) · `/api/reports/:id`

## MVP 범위 & 알려진 한계 (다음 단계)
- ✅ 부모 가입/로그인 → 아이 등록 → 또또 텍스트 세션 → 통역 리포트 1종.
- ⏭ **부모 모드 게이팅 강화**: 현재는 부모 로그인 상태에서 세션 시작. 세션 종료 후 리포트가 바로 표시됨 → "부모님께 휴대폰을 전해주세요" 핸드오프 게이트 추가 권장.
- ✅ **공용 인증(maum-auth)**: 계정은 공용 `maum-auth` D1(AUTH_DB) — 마음곁도 동일 바인딩 시 통합 로그인 성립(같은 계정·JWT).
- ⏭ 음성/그림 입력(읽기 전 연령), 표정 영상(7-C 휘발성), 위기 전문기관 디렉토리.

## 안전 (코드 전반에 반영)
단정 금지 · 의료용어 금지(통역 후처리 검증) · 비밀보장 거짓말 금지 · 위기 신호는 아이 화면 비노출·부모 리포트로만 에스컬레이션(보수적 판정).
