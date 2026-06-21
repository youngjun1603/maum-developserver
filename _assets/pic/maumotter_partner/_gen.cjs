// 마음수달 제휴 배너 4종(또또 합성). 링크에 ?ref=파트너이름 사용.
// 실행: NODE_PATH="<sharp 있는 node_modules>" node _assets/pic/maumotter_partner/_gen.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const OTTO = path.resolve(__dirname, '../../../maumotter/public/otto.jpg');
fs.mkdirSync(OUT, { recursive: true });

const FONT = "Malgun Gothic, 'Noto Sans KR', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E78C0"/><stop offset="1" stop-color="#5B97D8"/></linearGradient></defs>`;
const cta = (x, y, w, h, label, fs) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#F2A65A"/>
  <text x="${x + w / 2}" y="${y + h / 2 + fs * 0.35}" font-family="${FONT}" font-size="${fs}" font-weight="800" fill="#fff" text-anchor="middle">${esc(label)}</text>`;
async function ottoCircle(d) {
  const mask = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);
  return await sharp(OTTO).resize(d, d, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
async function out(svg, file, w, h, otto, top, left) {
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svg}</svg>`))
    .composite([{ input: otto, top, left }]).png().toFile(path.join(OUT, file));
  console.log('✓', file, `${w}×${h}`);
}

async function run() {
  // 1200×628
  {
    const w = 1200, h = 628, D = 300;
    const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
      <circle cx="220" cy="314" r="${D / 2 + 8}" fill="#fff" opacity="0.18"/>
      <text x="430" y="220" font-family="${FONT}" font-size="58" font-weight="800" fill="#fff">아이의 속마음,</text>
      <text x="430" y="296" font-family="${FONT}" font-size="58" font-weight="800" fill="#fff">또또가 통역해요</text>
      <text x="430" y="352" font-family="${FONT}" font-size="28" fill="#DCEAFB">아이와 나눈 대화를 부모님께 따뜻한 코칭으로</text>
      ${cta(430, 410, 360, 86, '무료로 체험하기', 34)}
      <text x="430" y="560" font-family="${FONT}" font-size="26" font-weight="700" fill="#fff">maumotter.com</text>
      <text x="${w - 40}" y="${h - 30}" font-family="${FONT}" font-size="18" fill="#CFE0F5" text-anchor="end">마음수달 · 정서 통역(참고용)</text>`;
    await out(svg, 'banner_1200x628.png', w, h, await ottoCircle(D), 314 - D / 2, 220 - D / 2);
  }
  // 300×250
  {
    const w = 300, h = 250, D = 96;
    const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
      <text x="${w / 2}" y="150" font-family="${FONT}" font-size="25" font-weight="800" fill="#fff" text-anchor="middle">아이 마음 통역</text>
      <text x="${w / 2}" y="178" font-family="${FONT}" font-size="15" fill="#DCEAFB" text-anchor="middle">또또가 듣고 부모님께</text>
      ${cta(w / 2 - 92, 196, 184, 42, '무료로 체험하기', 18)}`;
    await out(svg, 'banner_300x250.png', w, h, await ottoCircle(D), 24, w / 2 - D / 2);
  }
  // 728×90
  {
    const w = 728, h = 90, D = 64;
    const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
      <text x="100" y="40" font-family="${FONT}" font-size="25" font-weight="800" fill="#fff">마음수달 · 아이 마음 통역</text>
      <text x="100" y="68" font-family="${FONT}" font-size="16" fill="#DCEAFB">또또와 나눈 대화를 부모님께 따뜻하게 통역해요</text>
      ${cta(w - 220, 24, 196, 44, '무료로 체험하기 →', 18)}`;
    await out(svg, 'banner_728x90.png', w, h, await ottoCircle(D), 13, 22);
  }
  // 320×100
  {
    const w = 320, h = 100, D = 56;
    const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
      <text x="78" y="44" font-family="${FONT}" font-size="20" font-weight="800" fill="#fff">아이 마음 통역</text>
      <text x="78" y="68" font-family="${FONT}" font-size="13" fill="#DCEAFB">또또가 듣고 부모님께</text>
      ${cta(w - 96, 30, 84, 40, '체험하기', 15)}`;
    await out(svg, 'banner_320x100.png', w, h, await ottoCircle(D), 22, 12);
  }
  console.log('done');
}
run();
