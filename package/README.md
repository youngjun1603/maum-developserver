# 마음커플 (maumcouple) 배포 안내

## 📁 파일 구조
```
maumcouple/
├── src/index.tsx                    ← 백엔드 (Hono + Cloudflare Workers)
├── public/static/couple_hub.jsx     ← 프론트엔드 (React)
├── migrations/0001_couple_schema.sql ← D1 DB 마이그레이션
├── wrangler.toml                    ← Cloudflare 설정
├── package.json
└── tsconfig.json

maumful/
├── src/index.tsx                    ← 마음풀 백엔드 교체본
├── public/static/app.jsx            ← 마음풀 프론트 교체본
└── public/static/counseling.jsx     ← 상담 페이지 교체본
```

## 🗄️ D1 SQL 실행 순서 (Cloudflare D1 콘솔)
1. ALTER TABLE test_history ADD COLUMN result_json TEXT;
2. migrations/0001_couple_schema.sql 전체 실행

## ☁️ Cloudflare Pages 설정
- Build command: (비워두기)
- Build output directory: public
- D1 바인딩: DB → maumful-db
- KV 바인딩: KV → maumful KV
- 환경변수: ANTHROPIC_API_KEY

## 🔗 커스텀 도메인
- couple.maumful.com

## 📋 마음풀 교체 파일
- maumful/src/index.tsx → 기존 src/index.tsx 교체
- maumful/public/static/app.jsx → 기존 app.jsx 교체
- maumful/public/static/counseling.jsx → 기존 counseling.jsx 교체
