# 심리검사 앱 — 개발 환경 설정 가이드

## 프로젝트 구조

```
webapp/
├── src/
│   └── index.tsx              # 백엔드 전체 (Hono + Cloudflare Workers)
├── public/
│   ├── static/
│   │   └── app.jsx            # 프론트엔드 전체 (React 18 + Tailwind)
│   ├── locales/
│   │   ├── ko.json            # 한국어 번역
│   │   └── en.json            # 영어 번역
│   ├── manifest.json          # PWA 설정
│   └── sw.js                  # Service Worker
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_password_hash.sql
│   ├── 0003_add_api_settings.sql
│   └── 0004_b2c_migration.sql # B2C 전환 핵심 마이그레이션
├── wrangler.toml              # Cloudflare 배포 설정
├── tsconfig.json
└── package.json
```

---

## 0. 사전 준비

```bash
node -v   # v20.x 이상 필요
npm install -g wrangler
wrangler login
```

---

## 1. 의존성 설치

```bash
cd webapp
npm install
```

---

## 2. Cloudflare 리소스 생성 + wrangler.toml 업데이트

```bash
# D1 데이터베이스 생성
wrangler d1 create psy-app-db
# → 출력된 database_id 값을 wrangler.toml 의 REPLACE_WITH_D1_ID 에 붙여넣기

# KV 네임스페이스 생성
wrangler kv namespace create psy-app-kv
# → 출력된 id 값을 wrangler.toml 의 REPLACE_WITH_KV_ID 에 붙여넣기

# 스테이징용 (선택)
wrangler d1 create psy-app-db-staging
wrangler kv namespace create psy-app-kv-staging
```

---

## 3. DB 마이그레이션

```bash
# 로컬 개발 DB
wrangler d1 execute psy-app-db --local --file=migrations/0001_initial_schema.sql
wrangler d1 execute psy-app-db --local --file=migrations/0002_add_password_hash.sql
wrangler d1 execute psy-app-db --local --file=migrations/0003_add_api_settings.sql
wrangler d1 execute psy-app-db --local --file=migrations/0004_b2c_migration.sql

# 프로덕션 DB (배포 전)
# wrangler d1 execute psy-app-db --file=migrations/0001_initial_schema.sql
# wrangler d1 execute psy-app-db --file=migrations/0002_add_password_hash.sql
# wrangler d1 execute psy-app-db --file=migrations/0003_add_api_settings.sql
# wrangler d1 execute psy-app-db --file=migrations/0004_b2c_migration.sql
```

---

## 4. 시크릿 등록

### 필수 (없으면 핵심 기능 동작 안 함)
```bash
wrangler secret put JWT_SECRET
# → openssl rand -base64 64  결과 붙여넣기

wrangler secret put ANTHROPIC_API_KEY
# → Anthropic Console (console.anthropic.com) 에서 발급한 sk-ant-... 키
```

### Stripe 결제 (즉시 테스트 가능)
```bash
wrangler secret put STRIPE_SECRET_KEY
# → https://dashboard.stripe.com/test/apikeys 에서 sk_test_... 복사

wrangler secret put STRIPE_WEBHOOK_SECRET
# → stripe listen --forward-to localhost:3000/api/webhook/stripe
# → 출력된 whsec_... 복사

wrangler secret put SERVICE_URL
# → 개발: http://localhost:3000 / 프로덕션: https://your-domain.com
```

### 이메일 발송 (Resend)
```bash
wrangler secret put RESEND_API_KEY
# → https://resend.com 가입 후 API 키 발급 (무료 3,000건/월)

wrangler secret put RESEND_FROM_EMAIL
# → Resend에서 도메인 인증 후 noreply@your-domain.com 형태로 입력
```

### 토스페이먼츠 (사업자 등록 후)
```bash
wrangler secret put TOSS_SECRET_KEY
# → 토스페이먼츠 대시보드 > 개발정보 > 시크릿 키

wrangler secret put TOSS_CLIENT_KEY
# → 토스페이먼츠 대시보드 > 개발정보 > 클라이언트 키 (브라우저용)

wrangler secret put TOSS_WEBHOOK_SECRET
# → 토스 대시보드 > Webhook 설정에서 발급
```

### 관리자 보안
```bash
wrangler secret put ADMIN_SECRET
# → openssl rand -base64 32  결과 붙여넣기

wrangler secret put ADMIN_ALLOWED_IPS
# → 관리자 접속 허용 IP 콤마 구분 (예: 1.2.3.4,5.6.7.8)
# → 미설정 시 모든 IP 허용 (개발 환경)
```

---

## 5. 로컬 개발 서버

```bash
npm run dev
# → http://localhost:3000
```

---

## 6. API 동작 테스트 (curl)

```bash
# 지역 설정 확인
curl http://localhost:3000/api/config/region

# 회원가입 (RESEND_API_KEY 미설정 시 응답에 _dev.verifyToken 포함)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","nickname":"테스터"}'

# 이메일 인증 (_dev.verifyToken 값 사용)
curl http://localhost:3000/api/auth/verify/[verifyToken값]

# 로그인 → accessToken 복사
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 내 정보 조회
curl http://localhost:3000/api/user/me \
  -H "Authorization: Bearer [accessToken]"

# 크레딧 잔액 (초기 45)
curl http://localhost:3000/api/user/credits \
  -H "Authorization: Bearer [accessToken]"

# 검사 시작 (-10 크레딧)
curl -X POST http://localhost:3000/api/test/start \
  -H "Authorization: Bearer [accessToken]" \
  -H "Content-Type: application/json" \
  -d '{"testType":"PHQ9","lang":"ko"}'

# 초대 코드 조회
curl http://localhost:3000/api/referral/code \
  -H "Authorization: Bearer [accessToken]"

# 관리자 통계 (ADMIN_SECRET 필요)
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer [ADMIN_SECRET값]"
```

---

## 7. 배포

```bash
# 스테이징
wrangler deploy --env staging

# 프로덕션
wrangler deploy --env production
```

---

## API 엔드포인트 전체 목록 (37개)

### 인증
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET  | /api/config/region | ✗ | 지역별 설정 (언어, PG, 검사 목록) |
| POST | /api/auth/register | ✗ | 이메일 회원가입 |
| GET  | /api/auth/verify/:token | ✗ | 이메일 인증 |
| POST | /api/auth/login | ✗ | 이메일 로그인 |
| POST | /api/auth/google | ✗ | 구글 로그인 |
| POST | /api/auth/refresh | ✗ | 토큰 갱신 |
| POST | /api/auth/logout | Bearer | 로그아웃 |
| POST | /api/auth/forgot-password | ✗ | 비밀번호 재설정 요청 |
| POST | /api/auth/reset-password | ✗ | 비밀번호 재설정 |

### 사용자
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET  | /api/user/me | Bearer | 내 정보 |
| GET  | /api/user/credits | Bearer | 크레딧 잔액 + 내역 |
| PATCH | /api/user/me | Bearer | 프로필 수정 |
| DELETE | /api/user/me | Bearer | 회원 탈퇴 (GDPR) |

### 검사
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/test/start | Bearer | 검사 시작 (-10 크레딧) |
| GET  | /api/test/history | Bearer | 검사 이력 |

### AI
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/ai-analyze | Bearer | AI 분석 스트리밍 (분당 10회) |
| POST | /api/ai-chat | Bearer | AI 채팅 (-5 크레딧, 분당 20회) |

### 결제
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/payment/toss/checkout | Bearer | 토스 결제창 파라미터 |
| GET  | /api/payment/toss/success | ✗ | 토스 결제 완료 콜백 |
| GET  | /api/payment/toss/fail | ✗ | 토스 결제 실패 콜백 |
| POST | /api/payment/stripe/checkout | Bearer | Stripe 세션 생성 |
| GET  | /api/payment/stripe/verify | Bearer | 결제 후 크레딧 확인 |
| POST | /api/credits/prepare-charge | Bearer | 결제 전 레코드 생성 |
| POST | /api/webhook/toss | ✗ | 토스 Webhook |
| POST | /api/webhook/stripe | ✗ | Stripe Webhook |

### 친구 초대
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET  | /api/referral/code | Bearer | 내 초대 코드 조회/생성 |
| POST | /api/referral/apply | Bearer | 초대 코드 적용 |
| GET  | /api/referral/list | Bearer | 초대 목록 |

### 관리자
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET  | /api/admin/stats | Admin | KPI 요약 |
| GET  | /api/admin/stats/daily | Admin | 일별 추이 |
| GET  | /api/admin/stats/tests | Admin | 검사 유형별 통계 |
| GET  | /api/admin/users | Admin | 회원 목록 (검색+페이지) |
| POST | /api/admin/users/:id/credits | Admin | 크레딧 수동 지급/회수 |
| GET  | /api/admin/payments | Admin | 결제 내역 |
| GET  | /api/admin/api-settings | Admin | API 키 조회 |
| POST | /api/admin/api-settings | Admin | API 키 저장 |

---

## 크레딧 정책

| 항목 | 크레딧 |
|------|--------|
| 가입 보너스 | +20 |
| AI 채팅 첫 가입 보너스 | +25 |
| 초대 코드 적용 (피초대자) | +10 |
| 피초대자 첫 결제 완료 시 (초대자) | +30 |
| 심리검사 1회 | -10 |
| AI 채팅 1회 | -5 |

---

## 남은 개발 항목 (우선순위순)

### 배포 전 권장
- [ ] 개인정보 처리방침 페이지
- [ ] 이용약관 페이지
- [ ] 이메일 인증 재발송 API (`POST /api/auth/resend-verify`)
- [ ] `?ref=코드` 초대 파라미터 자동 처리
- [ ] PWA 아이콘 이미지 (`public/static/icon-192.png`, `icon-512.png`)
- [ ] GDPR 쿠키 동의 배너 (EU 서비스 시)

### 오픈 후
- [ ] 만료 토큰 정리 Cron (`wrangler.toml` triggers 설정)
- [ ] 온보딩 플로우
- [ ] React Error Boundary
- [ ] DB 백업 스크립트
- [ ] 관리자 대시보드 차트 시각화
- [ ] 검사 결과 공유 카드 (SNS 바이럴)
- [ ] Apple 로그인 / 카카오 로그인
