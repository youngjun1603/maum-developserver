const sharp = require('sharp');

// 네이버 블로그 프로필용 정사각 아이콘 512x512 — 그린 새싹 + 마음풀 (원형 크롭 안전 여백)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#F7FAF5"/>
      <stop offset="1" stop-color="#E5F1E7"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="40%" r="55%">
      <stop offset="0" stop-color="#95D5B2" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#95D5B2" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="220" r="250" fill="url(#orb)"/>

  <!-- 중앙 새싹 심볼 -->
  <g transform="translate(256,175) scale(1.75)" stroke-linecap="round">
    <path d="M0,52 L0,-16" stroke="#2D6A4F" stroke-width="9" fill="none"/>
    <path d="M0,6 C24,-16 40,-34 70,-54 C40,-40 10,-22 0,6 Z" fill="#2D6A4F"/>
    <path d="M0,22 C-24,4 -40,-2 -68,-22 C-34,-10 -7,-2 0,22 Z" fill="#52B788"/>
  </g>

  <!-- 브랜드명 -->
  <text x="256" y="345" font-family="Malgun Gothic" font-size="84" font-weight="bold" fill="#2D6A4F" text-anchor="middle">마음풀</text>
  <!-- 태그라인 -->
  <text x="256" y="400" font-family="Malgun Gothic" font-size="27" fill="#6B8473" text-anchor="middle">나를 이해하는 첫걸음</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile('../pic/maumful_blog_profile.png')
  .then(() => {
    const s = require('fs').statSync('../pic/maumful_blog_profile.png');
    console.log('maumful_blog_profile.png written — ' + (s.size / 1024).toFixed(1) + 'KB (512x512)');
  })
  .catch(e => console.log('ERR', e.message));
