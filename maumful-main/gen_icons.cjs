const sharp = require('sharp');
const fs = require('fs');

// 마음풀 앱 아이콘/파비콘 — 그린 라운드 스퀘어 + 흰색 새싹 (텍스트 없이 모든 크기에서 선명)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#52B788"/>
      <stop offset="1" stop-color="#2D6A4F"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- 중앙 새싹 (흰색) -->
  <g transform="translate(256,250) scale(2.6)" stroke-linecap="round">
    <path d="M0,52 L0,-16" stroke="#FFFFFF" stroke-width="9" fill="none"/>
    <path d="M0,6 C24,-16 40,-34 70,-54 C40,-40 10,-22 0,6 Z" fill="#FFFFFF"/>
    <path d="M0,22 C-24,4 -40,-2 -68,-22 C-34,-10 -7,-2 0,22 Z" fill="#FFFFFF" fill-opacity="0.82"/>
  </g>
</svg>`;

// PNG 1장을 그대로 감싸는 단일 이미지 ICO 생성 (Vista+ PNG-in-ICO, 의존성 불필요)
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const render = (size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

(async () => {
  fs.writeFileSync('public/static/icon.svg', svg);

  for (const [size, path] of [[512, 'public/static/icon-512.png'], [192, 'public/static/icon-192.png'], [96, 'public/favicon.png']]) {
    fs.writeFileSync(path, await render(size));
    console.log('✓ ' + path + ' (' + size + ')');
  }

  const ico64 = await render(64);
  fs.writeFileSync('public/favicon.ico', pngToIco(ico64, 64));
  console.log('✓ public/favicon.ico (64, PNG-in-ICO)');
})().catch(e => console.log('ERR', e.message));
