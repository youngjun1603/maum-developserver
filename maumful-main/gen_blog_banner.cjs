const sharp = require('sharp');

// 네이버 블로그 자유형 프로필용 가로 슬림 배너 1000x260 — 새싹 + 마음풀 + 태그라인
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="260" viewBox="0 0 1000 260">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#F7FAF5"/>
      <stop offset="1" stop-color="#E5F1E7"/>
    </linearGradient>
    <radialGradient id="orb" cx="14%" cy="50%" r="42%">
      <stop offset="0" stop-color="#95D5B2" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#95D5B2" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="260" rx="18" fill="url(#bg)"/>
  <ellipse cx="140" cy="130" rx="220" ry="220" fill="url(#orb)"/>

  <!-- 새싹 심볼 (좌측) -->
  <g transform="translate(135,150) scale(1.5)" stroke-linecap="round">
    <path d="M0,52 L0,-16" stroke="#2D6A4F" stroke-width="9" fill="none"/>
    <path d="M0,6 C24,-16 40,-34 70,-54 C40,-40 10,-22 0,6 Z" fill="#2D6A4F"/>
    <path d="M0,22 C-24,4 -40,-2 -68,-22 C-34,-10 -7,-2 0,22 Z" fill="#52B788"/>
  </g>

  <!-- 텍스트 블록 -->
  <text x="290" y="118" font-family="Malgun Gothic" font-size="68" font-weight="bold" fill="#2D6A4F" text-anchor="start">마음풀</text>
  <text x="294" y="170" font-family="Malgun Gothic" font-size="31" fill="#566B5E" text-anchor="start">나를 이해하는 첫걸음</text>
  <text x="296" y="212" font-family="Malgun Gothic" font-size="23" fill="#8AA092" text-anchor="start" letter-spacing="1.5">심리검사 · AI 상담 · 치유 게임</text>

  <!-- 우하단 도메인 -->
  <text x="958" y="232" font-family="Malgun Gothic" font-size="22" fill="#9FB3A6" text-anchor="end">maumful.com</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile('../_assets/pic/maumful_blog_banner.png')
  .then(() => {
    const s = require('fs').statSync('../_assets/pic/maumful_blog_banner.png');
    console.log('maumful_blog_banner.png written — ' + (s.size / 1024).toFixed(1) + 'KB (1000x260)');
  })
  .catch(e => console.log('ERR', e.message));
