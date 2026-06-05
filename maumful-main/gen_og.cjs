const sharp = require('sharp');

// 마음풀 OG 공유 카드 (1200x630) — 새싹(마음을 풀어 가볍게)·차분한 그린·중앙정렬
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16352A"/>
      <stop offset="0.55" stop-color="#2D6A4F"/>
      <stop offset="1" stop-color="#40916C"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0" stop-color="#95D5B2" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#95D5B2" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <ellipse cx="600" cy="250" rx="600" ry="340" fill="url(#glow)"/>

  <!-- 큰 새싹 워터마크 (은은하게) -->
  <g transform="translate(995,560) scale(5.2)" fill="#FFFFFF" fill-opacity="0.05">
    <path d="M0,18 C0,2 -10,-6 -24,-8 C-22,8 -12,16 0,18 Z"/>
    <path d="M0,14 C2,0 12,-8 26,-12 C24,6 14,12 0,14 Z"/>
  </g>

  <!-- 중앙 새싹 아이콘 -->
  <g transform="translate(600,158)">
    <circle r="60" fill="#FFFFFF" fill-opacity="0.10" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2"/>
    <path d="M0,32 L0,-4" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M0,6 C16,-8 26,-18 42,-30 C24,-22 6,-12 0,6 Z" fill="#FFFFFF"/>
    <path d="M0,14 C-14,2 -24,0 -40,-12 C-22,-8 -6,-2 0,14 Z" fill="#D8F3DC"/>
  </g>

  <!-- 워드마크 -->
  <text x="600" y="330" font-family="Malgun Gothic" font-size="118" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2">마음풀</text>

  <!-- 골드 디바이더 -->
  <rect x="554" y="360" width="92" height="5" rx="2.5" fill="#FFD9A0"/>

  <!-- 태그라인 -->
  <text x="600" y="432" font-family="Malgun Gothic" font-size="42" font-weight="bold" fill="#F1FAF5" text-anchor="middle">마음의 무게를 가볍게</text>

  <!-- 서브 -->
  <text x="600" y="490" font-family="Malgun Gothic" font-size="29" fill="#FFFFFF" fill-opacity="0.72" text-anchor="middle" letter-spacing="2">심리검사 · AI 상담 · 치유 게임</text>

  <!-- URL -->
  <text x="600" y="566" font-family="Malgun Gothic" font-size="23" font-weight="bold" fill="#FFFFFF" fill-opacity="0.42" text-anchor="middle" letter-spacing="4">maumful.com</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile('public/static/og-share.png')
  .then(() => {
    const s = require('fs').statSync('public/static/og-share.png');
    console.log('og-share.png written — ' + (s.size / 1024).toFixed(1) + 'KB');
  })
  .catch(e => console.log('ERR', e.message));
