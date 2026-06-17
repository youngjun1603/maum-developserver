# 마음 시리즈 — 공유 규약 (SSO / JWT / 브랜드) / shared spec

> **이 문서의 목적**
> 마음수달(maumotter)·마음곁(maumgyeot)이 **반드시 동일하게** 따라야 하는 공유 규약을 정의한다.
> 두 서비스는 코드·DB·도메인이 분리돼 있지만(방식 C: 개발 분리·UX/계정 통합), **통합 로그인과 브랜드 일관성**을 위해 이 문서의 규약만은 양쪽이 똑같이 구현한다.
> **이 파일은 양쪽 저장소(`maumotter/`, `maumgyeot/`)에 동일 사본으로 둔다.** 한쪽을 고치면 다른 쪽도 같이 고친다.

---

## 0. 전제 — 무엇이 공유되고 무엇이 분리되는가

| 구분 | 마음수달 | 마음곁 | 공유 여부 |
|------|----------|--------|-----------|
| GitHub 저장소 | maumotter | maumgyeot | ❌ 분리 |
| 도메인 | maumotter.com | maumgyeot.com | ❌ 분리 |
| D1 데이터베이스 | 별도 | 별도 | ❌ 분리 |
| 소스 코드 | 별도 | 별도 | ❌ 분리 |
| **JWT 시크릿·구조** | — | — | ✅ **공유** |
| **계정(마음 통합 ID)** | — | — | ✅ **공유** |
| **브랜드·디자인 토큰** | — | — | ✅ **공유** |

→ 핵심: **인증과 브랜드만 공유**한다. 나머지는 철저히 분리.

---

## 1. 통합 계정 (마음 ID) 원칙

- 사용자는 하나의 "마음 계정"으로 마음수달·마음곁 양쪽에 로그인한다.
- 계정의 **원천(source of truth)**은 한 곳에 둔다. 두 가지 방식 중 택1:
  - **(권장) 공용 인증 D1 1개**: `maum-auth` 라는 별도 D1에 계정(이메일·비번해시)만 두고, 두 서비스가 이 인증 결과를 신뢰. 각 서비스 D1은 자기 도메인 데이터만(아이·세션 / 반려동물·관찰) 보유하고 `maum_user_id`로 참조.
  - **(대안) 한쪽을 인증 주체로**: 먼저 만든 마음수달을 인증 주체로 삼고, 마음곁은 같은 JWT를 검증만. 단 계정 관리 화면이 한쪽에만 생겨 비대칭.
- → **권장안 채택**: 공용 `maum-auth` D1. 깔끔하고 확장(향후 마음게임·마음커플 합류)에도 유리.

```
maum-auth (공용 D1)
└── users (id=maum_user_id, email, password_hash, name, created_at)

maumotter D1 → children, sessions, reports ... (maum_user_id 참조)
maumgyeot D1 → pets, observations, pet_reports ... (maum_user_id 참조)
```

### ✅ 구현 확정 (2026-06)
- **스키마:** `_shared/maum-auth-schema.sql` (users). 대시보드에서 `maum-auth` D1 생성 후 Console 실행.
- **바인딩:** 각 서비스 Worker에 `AUTH_DB`(= maum-auth D1) 동일 바인딩 + 자기 도메인 `DB` 별도. 같은 maum-auth를 두 워커가 공유 → 한 곳에서 가입한 계정으로 양쪽 로그인.
- **공유 모듈:** `_shared/auth.ts`(CANONICAL) → 각 저장소 `src/auth.ts`로 **동일 사본** 복사. JWT(crypto.subtle HS256)·PBKDF2 비번·`registerUser`/`loginUser`/`getUser`/`issueToken`/`requireAuth` 제공. **수정 시 캐논+모든 사본 함께.**
- **토큰:** `issueToken`이 `{maum_user_id, email, iss:'maum', exp(초)}` 발급. `JWT_SECRET`은 시리즈 공유 시크릿.
- 마음수달이 이 구조로 1차 적용 완료. 마음곁은 같은 `AUTH_DB`+`auth.ts` 사본 재사용.

---

## 2. JWT 규약 (반드시 동일하게 구현)

cloudflare-dev 스킬 준수: **`crypto.subtle` 방식 필수, `btoa()` 직접 사용 금지, 한국어 페이로드는 TextEncoder UTF-8.**

### 2.1 공유 시크릿
- `JWT_SECRET`은 **양쪽 Workers가 동일한 값**을 사용한다 (Cloudflare 대시보드 > Workers > Settings > Variables에 각각 Secret으로 등록, 같은 값).
- 절대 코드에 하드코딩 금지. Secret으로만 관리.

### 2.2 토큰 페이로드 구조 (고정)
```json
{
  "maum_user_id": 12345,
  "email": "user@example.com",
  "iss": "maum",
  "exp": 1750000000
}
```
- `maum_user_id`: 공용 계정 ID. 양쪽 서비스가 이 값으로 사용자 식별.
- `iss`: 항상 `"maum"` (마음 시리즈 발급 토큰임을 표시).
- `exp`: **초 단위** (`Math.floor(Date.now()/1000) + 만료시간`). ms 혼용 주의 (스킬의 대표 버그).

### 2.3 생성·검증 코드 (양쪽 동일 — 스킬 패턴 그대로)
```typescript
// crypto.subtle 기반. btoa() 직접 사용 금지.
async function createJWT(payload: object, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj: object) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${signingInput}.${sigB64}`;
}
```
> 검증 함수도 동일 패턴으로 양쪽 구현. 같은 시크릿·같은 구조이므로 한쪽에서 발급한 토큰을 다른 쪽이 검증 가능 = 통합 로그인 성립.

### 2.4 쿠키·도메인
- 토큰 쿠키는 각 서비스 도메인에 발급(maumotter.com / maumgyeot.com).
- 도메인이 다르므로 쿠키 자동 공유는 안 됨 → **로그인 시 공용 인증 결과를 양쪽이 각자 받는 구조**로 처리(SSO 리다이렉트 또는 공용 인증 API 호출). MVP 단계에선 각 서비스 개별 로그인 + 같은 계정으로도 충분.

---

## 3. CORS 규약

스킬 준수: 와일드카드 금지, 동적 오리진 매칭. 마음 시리즈 도메인을 공통 화이트리스트로.

```typescript
const MAUM_ALLOWED_ORIGINS = [
  'https://maumotter.com',
  'https://app.maumotter.com',
  'https://maumgyeot.com',
  'https://app.maumgyeot.com',
];
// 각 서비스 Worker에 동일 적용 (자기 도메인 + 형제 서비스 도메인 허용)
```

---

## 4. 브랜드·디자인 공유 토큰

마음 시리즈의 시각적 일관성. 각 서비스가 동일 토큰을 사용.

- **브랜드 서사**: "말 못 하는 가족의 속마음을 통역한다." (마음수달=아이, 마음곁=반려동물)
- **공통 화법 원칙**: 단정하지 않는다("~인 것 같아요"). 진단하지 않는다(의료/수의학 용어 금지). AI는 대체가 아니라 다리.
- **디자인 토큰**(예시 — 실제 값은 디자인 확정 시 채움):
  - 기본 폰트: 둥근 산세리프 (Pretendard 등)
  - 톤: 따뜻하고 신뢰감 있는 색. 각 서비스 포인트 컬러만 다르게(수달=물빛/갈색 계열, 곁=따뜻한 중성 계열).
- **상호 안내(cross-promotion)**: 각 앱 설정/홈에 "마음 시리즈의 다른 서비스" 안내 슬롯. 단, 과하지 않게 1곳.

---

## 5. 클로드코드 작업 지침

1. **이 파일은 양쪽 저장소에 동일 사본**으로 존재한다. 인증·브랜드 변경 시 양쪽을 함께 수정.
2. JWT는 이 문서 2장 구조·코드를 양쪽에 **그대로** 구현. 시크릿·페이로드·iss 통일.
3. 계정 원천은 공용 `maum-auth` D1 (1장 권장안). 각 서비스 D1은 `maum_user_id`로 참조만.
4. 각 서비스의 도메인 규칙(아동 정서 / 동물행동학)은 **각 폴더의 CLAUDE.md**를 따른다. 이 공유 문서는 인증·브랜드에 한정.
5. MVP에서는 통합 로그인을 "같은 계정으로 양쪽 로그인 가능" 수준으로 시작, 완전 SSO(리다이렉트)는 이후 단계.
