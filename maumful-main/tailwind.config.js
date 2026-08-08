/** @type {import('tailwindcss').Config} */
// 마음풀 Tailwind 프로덕션 빌드 설정.
// 기존 cdn.tailwindcss.com(Play CDN, 인라인 config 없음=기본 테마)을 정적 빌드로 대체.
// content: 클래스가 등장하는 모든 소스를 스캔(jsx 원본 + esbuild 컴파일본 + src/index.tsx 인라인 HTML).
// 동적 클래스 조립(bg-${var}-500 등)은 코드베이스에 0건이며, 색상 클래스도 전부 리터럴 문자열이라 스캔으로 커버됨.
module.exports = {
  content: [
    './public/static/*.jsx',
    './public/static/compiled/*.js',
    './src/index.tsx',
  ],
  theme: { extend: {} },
  // 안전망: DSI/SDRI 등 객체에 담아 쓰는 색상 계열(전부 리터럴이라 스캔되지만, 누락 방지용 보험).
  safelist: [
    { pattern: /^(bg|text|border)-(violet|purple|indigo|rose|amber|emerald|sky|green|teal|blue|slate|gray)-(50|100|200|300|400|500|600|700|800|900)$/ },
  ],
  plugins: [],
}
