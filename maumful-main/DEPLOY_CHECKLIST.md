# 마음풀 배포 체크리스트
## 배포 전 필수 확인 사항

---

## ① 환경 준비

```bash
# 1. Node.js 18+ 및 wrangler 설치
npm install -g wrangler

# 2. Cloudflare 로그인
wrangler login

# 3. D1 데이터베이스 생성 (처음 한 번만)
wrangler d1 create psy-app-db
# → 출력된 database_id 복사

# 4. KV 네임스페이스 생성
wrangler kv namespace create psy-app-kv
# → 출력된 id 복사
```

---

## ② wrangler.toml 수정

```toml
# phyweb/wrangler.toml
database_id = "여기에_D1_ID_붙여넣기"   # REPLACE_WITH_D1_ID → 실제 값
id          = "여기에_KV_ID_붙여넣기"    # REPLACE_WITH_KV_ID → 실제 값
```

```toml
# maumgame/wrangler.toml (phyweb 과 동일한 D1/KV 사용)
database_id = "phyweb_와_동일한_D1_ID"
id          = "phyweb_와_동일한_KV_ID"
```

---

## ③ DB 마이그레이션 (phyweb D1에 모두 실행)

```bash
cd phyweb

# 순서 중요!
wrangler d1 execute psy-app-db --file=migrations/0001_initial_schema.sql
wrangler d1 execute psy-app-db --file=migrations/0002_add_password_hash.sql
wrangler d1 execute psy-app-db --file=migrations/0003_add_api_settings.sql
wrangler d1 execute psy-app-db --file=migrations/0004_b2c_migration.sql
wrangler d1 execute psy-app-db --file=migrations/0005_counseling.sql
wrangler d1 execute psy-app-db --file=migrations/0006_stage3_admin.sql
wrangler d1 execute psy-app-db --file=migrations/0007_subscriptions.sql

# maumgame 게임 테이블
cd ../maumgame
wrangler d1 execute psy-app-db --file=migrations/0001_game_schema.sql

# 확인
wrangler d1 execute psy-app-db \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

---

## ④ 시크릿 설정

### phyweb
```bash
cd phyweb

# 필수
wrangler secret put JWT_SECRET          # openssl rand -base64 48
wrangler secret put ADMIN_SECRET        # openssl rand -base64 32

# 이메일 (Resend.com)
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL   # noreply@maumful.kr

# 토스페이먼츠
wrangler secret put TOSS_SECRET_KEY     # sk_live_... (라이브 키)
wrangler secret put TOSS_CLIENT_KEY     # ck_live_...
wrangler secret put TOSS_BILLING_KEY    # 자동결제(구독)용 시크릿
wrangler secret put TOSS_WEBHOOK_SECRET

# AI
wrangler secret put ANTHROPIC_API_KEY

# 서비스 URL
wrangler secret put SERVICE_URL         # https://maumful.pages.dev
```

### maumgame
```bash
cd maumgame

# phyweb 과 반드시 동일한 값
wrangler secret put JWT_SECRET          # phyweb 과 동일!

# 공통
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put PHYWEB_URL          # https://maumful.pages.dev
wrangler secret put SERVICE_URL         # https://maumgame.pages.dev
```

---

## ⑤ 법적 고지 실정보 입력

`public/static/app.jsx` 의 `privacy` 뷰에서 황색 표시 항목 교체:

```
대표자명:        실제 대표자 이름
사업장 주소:     실제 사업장 주소
사업자등록번호:   XXX-XX-XXXXX
개인정보 보호책임자: 담당자 이름
```

---

## ⑥ 배포

```bash
# phyweb 배포
cd phyweb
wrangler deploy

# maumgame 배포
cd ../maumgame
wrangler deploy
```

또는 GitHub 연결 후 push 하면 Cloudflare Pages가 자동 배포합니다.

---

## ⑦ 배포 후 확인

```bash
# 헬스체크
curl https://maumful.pages.dev/api/config/region
# → { "region": "KR", "pg": "toss" }

# D1 데이터 확인
wrangler d1 execute psy-app-db \
  --command "SELECT COUNT(*) FROM users"

# 상담사 데모 데이터 확인
wrangler d1 execute psy-app-db \
  --command "SELECT name, fee_per_session FROM counselors"

# 구독 테이블 확인
wrangler d1 execute psy-app-db \
  --command "SELECT COUNT(*) FROM user_subscriptions"
```

---

## ⑧ 크론 트리거 확인 (구독 자동결제)

```bash
# wrangler.toml 에 추가됨:
# [triggers]
# crons = ["0 0 1 * *"]   # 매월 1일 00:00 UTC

# 배포 후 Cloudflare 대시보드 → Workers → Triggers → Cron Triggers 탭에서 확인
```

---

## ⑨ 도메인 설정 (선택)

Cloudflare Pages 대시보드 → Custom Domains:
- `maumful.kr` → phyweb 프로젝트
- `game.maumful.kr` → maumgame 프로젝트

---

## ✅ 배포 완료 체크

- [ ] phyweb 접속 확인 (회원가입 → 이메일 인증 → 로그인)
- [ ] 심리검사 1개 완료 → 크레딧 차감 확인
- [ ] maumgame 접속 → JWT 토큰 전달 확인
- [ ] 상담 예약 → 토스 테스트 결제 확인
- [ ] 어드민 로그인 (`/?view=counselingAdmin`) 확인
- [ ] 구독 플랜 페이지 접속 확인
