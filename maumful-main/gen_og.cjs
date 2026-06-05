const sharp = require('sharp');

// 마음풀 OG 공유 카드 (1200x630) — 랜딩 히어로 반영: 밝은 크림 배경 + "나를 이해하는 첫걸음, 심리검사"
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#F7FAF5"/>
      <stop offset="1" stop-color="#E9F3EA"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#74C69D" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#74C69D" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- 우측 장식: 큰 새싹 (브랜드 심볼) -->
  <ellipse cx="990" cy="315" rx="300" ry="300" fill="url(#orb)"/>
  <g transform="translate(990,330) scale(3.4)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0,40 L0,-18" stroke="#2D6A4F" stroke-width="7" fill="none" opacity="0.9"/>
    <path d="M0,2 C22,-14 36,-30 60,-46 C34,-34 8,-20 0,2 Z" fill="#40916C"/>
    <path d="M0,16 C-20,2 -34,-2 -56,-20 C-30,-12 -6,-2 0,16 Z" fill="#74C69D"/>
  </g>

  <!-- 배지 -->
  <rect x="90" y="74" width="340" height="48" rx="24" fill="#DCEFE2"/>
  <circle cx="120" cy="98" r="5" fill="#52B788"/>
  <text x="140" y="106" font-family="Malgun Gothic" font-size="22" font-weight="bold" fill="#2D6A4F">전문 심리검사 10종 제공</text>

  <!-- 헤드라인 -->
  <text x="86" y="232" font-family="Malgun Gothic" font-size="86" font-weight="bold" fill="#1A2B22">나를 이해하는</text>
  <text x="86" y="338" font-family="Malgun Gothic" font-size="86" font-weight="bold"><tspan fill="#2D6A4F">첫걸음,</tspan><tspan fill="#1A2B22"> 심리검사</tspan></text>

  <!-- 서브 -->
  <text x="90" y="416" font-family="Malgun Gothic" font-size="30" fill="#566B5E">전문가들이 널리 활용하는 표준 심리검사를 온라인에서 간편하게.</text>
  <text x="90" y="460" font-family="Malgun Gothic" font-size="30" fill="#566B5E">검사 후 AI 상담으로 나의 결과를 깊이 이해하세요.</text>

  <!-- 하단 브랜드 -->
  <g transform="translate(94,548)">
    <g transform="translate(14,-6) scale(0.62)" stroke-linecap="round">
      <path d="M0,20 L0,-6" stroke="#2D6A4F" stroke-width="6" fill="none"/>
      <path d="M0,2 C12,-8 20,-16 32,-26 C18,-18 4,-8 0,2 Z" fill="#2D6A4F"/>
      <path d="M0,9 C-11,1 -19,-1 -31,-12 C-16,-6 -3,-1 0,9 Z" fill="#52B788"/>
    </g>
    <text x="40" y="8" font-family="Malgun Gothic" font-size="30" font-weight="bold" fill="#2D6A4F">마음풀</text>
    <text x="132" y="6" font-family="Malgun Gothic" font-size="24" fill="#8AA092" letter-spacing="1">·  maumful.com</text>
  </g>
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile('public/static/og-share.png')
  .then(() => {
    const s = require('fs').statSync('public/static/og-share.png');
    console.log('og-share.png written — ' + (s.size / 1024).toFixed(1) + 'KB');
  })
  .catch(e => console.log('ERR', e.message));
