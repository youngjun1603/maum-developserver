const sharp = require('sharp');

// 마음풀 OG 공유 카드 — 정사각 1080x1080 (카카오 썸네일 크롭 방지). 중앙 정렬.
// 하단 브랜드 = 공식 로고(public/static/maumful-logo.png · 새싹+마음풀(Maumful) 워드마크)를 합성.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#F7FAF5"/>
      <stop offset="1" stop-color="#E5F1E7"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="42%" r="48%">
      <stop offset="0" stop-color="#95D5B2" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#95D5B2" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg)"/>
  <ellipse cx="540" cy="470" rx="520" ry="520" fill="url(#orb)"/>

  <!-- 중앙 새싹 심볼 -->
  <g transform="translate(540,230)">
    <path d="M0,52 L0,-16" stroke="#2D6A4F" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M0,6 C24,-16 40,-34 70,-54 C40,-40 10,-22 0,6 Z" fill="#2D6A4F"/>
    <path d="M0,22 C-24,4 -40,-2 -68,-22 C-34,-10 -7,-2 0,22 Z" fill="#52B788"/>
  </g>

  <!-- 배지 -->
  <rect x="360" y="350" width="360" height="54" rx="27" fill="#DCEFE2"/>
  <circle cx="398" cy="377" r="5.5" fill="#52B788"/>
  <text x="552" y="386" font-family="Malgun Gothic" font-size="24" font-weight="bold" fill="#2D6A4F" text-anchor="middle">전문 심리검사 10종 제공</text>

  <!-- 헤드라인 -->
  <text x="540" y="520" font-family="Malgun Gothic" font-size="92" font-weight="bold" fill="#1A2B22" text-anchor="middle">나를 이해하는</text>
  <text x="540" y="628" font-family="Malgun Gothic" font-size="92" font-weight="bold" text-anchor="middle"><tspan fill="#2D6A4F">첫걸음,</tspan><tspan fill="#1A2B22"> 심리검사</tspan></text>

  <!-- 태그라인 -->
  <text x="540" y="720" font-family="Malgun Gothic" font-size="36" fill="#566B5E" text-anchor="middle">마음의 무게를 가볍게</text>

  <!-- 서브 -->
  <text x="540" y="788" font-family="Malgun Gothic" font-size="27" fill="#7A8C80" text-anchor="middle" letter-spacing="2">심리검사 · AI 상담 · 치유 게임</text>

  <!-- 하단 도메인(로고는 아래에서 합성) -->
  <text x="540" y="998" font-family="Malgun Gothic" font-size="25" fill="#8AA092" text-anchor="middle" letter-spacing="1">maumful.com</text>
</svg>`;

const LOGO_W = 470;                       // 공식 로고 폭
const LOGO_LEFT = Math.round((1080 - LOGO_W) / 2);
const LOGO_TOP = 878;                     // 도메인 텍스트(y998) 위

(async () => {
  try {
    const bg = await sharp(Buffer.from(svg)).png().toBuffer();
    const logo = await sharp('public/static/maumful-logo.png').resize({ width: LOGO_W }).png().toBuffer();
    await sharp(bg)
      .composite([{ input: logo, left: LOGO_LEFT, top: LOGO_TOP }])
      .png({ compressionLevel: 9 })
      .toFile('public/static/og-share.png');
    const s = require('fs').statSync('public/static/og-share.png');
    console.log('og-share.png written (공식 로고 합성) — ' + (s.size / 1024).toFixed(1) + 'KB (1080x1080)');
  } catch (e) { console.log('ERR', e.message); }
})();
