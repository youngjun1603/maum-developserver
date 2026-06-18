# 마음곁 (MaumGyeot)

반려동물(개·고양이)의 행동 신호 + 맥락을 **동물행동학 관점으로 통역**해 보호자에게 전달. 모든 통역에 **confidence**(단정 금지), 건강 우려는 **수의사 상담 권장**(진단 아님). 마음수달과 **같은 공용 계정(maum-auth)** 사용.

## 스택
Cloudflare Workers + Hono + D1 + KV / 프론트 React CDN(무빌드). LLM은 Cloudflare AI Gateway 경유. 인증은 공유 `src/auth.ts`(= `../_shared/auth.ts` 동일 사본) + maum-auth.

## 배포 셋업
1. **D1 2개**
   - `maumgyeot-db`(도메인) → `wrangler.toml` `DB`. Console에서 `schema.sql` 실행.
   - `maum-auth`(공용 계정, 마음수달과 동일) → `AUTH_DB`. 이미 `maum-auth-schema.sql` 적용됨(공유).
2. **KV** → `wrangler.toml` `KV`.
3. **시크릿**(Worker → Settings → Variables → Secret)
   - `JWT_SECRET` — ⚠️ **마음수달과 동일 값**이어야 통합 로그인 성립.
   - `ANTHROPIC_API_KEY` — 통역 LLM 키(마음수달과 동일 키 사용 가능).
4. GitHub `maumgyeot` 레포 → Cloudflare Workers(Connect to Git) 또는 `wrangler deploy`.

## API
- `POST /api/auth/{register,login}`, `GET /api/auth/me`
- `GET/POST /api/pets`
- `GET /api/behavior?species=cat|dog` — 행동 사전(도감·신호 선택)
- `POST /api/observe` `{pet_id, signals:[code], context, media_note?}` → 통역 리포트
- `GET /api/reports?pet_id=` , `GET /api/reports/:id`

## 설계 문서
`docs/maumgyeot-spec.md` · `maumgyeot-translation-engine.md` · `maumgyeot-behavior-library.md` / 공유 규약 `../_shared/maum-shared-spec.md` / 규칙 `CLAUDE.md`.

## 안전 (CLAUDE.md 3·4장)
단정 금지(confidence 필수) · 수의학 용어 금지(후처리 검증) · health_flag로 수의사 연계 · 종(개/고양이) 완전 분리 · 영상 휘발성(온디바이스, 향후).
