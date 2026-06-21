// 마음수달 스마트스토어 이미지 — 대표 1000×1000 3종 + 코드등록 안내. 또또(otto.jpg) 합성.
// 실행: NODE_PATH="<sharp 있는 node_modules>" node _assets/pic/maumotter_store/_gen.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const OTTO = path.resolve(__dirname, '../../../maumotter/public/otto.jpg');
fs.mkdirSync(OUT, { recursive: true });

const S = 1000;
const FONT = "Malgun Gothic, 'Noto Sans KR', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const defs = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E78C0"/><stop offset="1" stop-color="#5B97D8"/></linearGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2F7FD"/><stop offset="1" stop-color="#E6EFFA"/></linearGradient>
</defs>`;
const header = () => `
  <rect x="0" y="0" width="${S}" height="150" fill="url(#g)"/>
  <circle cx="74" cy="75" r="30" fill="#ffffff" opacity="0.18"/>
  <text x="124" y="68" font-family="${FONT}" font-size="32" font-weight="800" fill="#fff">마음수달</text>
  <text x="124" y="108" font-family="${FONT}" font-size="20" fill="#DCEAFB">아이의 속마음을 또또가 듣고 부모님께 통역해요 · maumotter.com</text>`;

async function ottoCircle(d) {
  const mask = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);
  return await sharp(OTTO).resize(d, d, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function card({ file, name, desc, price, badge }) {
  const PH = 236, cx = S / 2, cy = 378;
  const svg = `${defs}
  <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bg)"/>
  ${header()}
  <circle cx="${cx}" cy="${cy}" r="132" fill="#fff"/>
  <circle cx="${cx}" cy="${cy}" r="132" fill="none" stroke="#5B97D8" stroke-width="6"/>
  <rect x="${cx - 70}" y="496" width="140" height="46" rx="23" fill="#F2A65A"/>
  <text x="${cx}" y="527" font-family="${FONT}" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">${esc(badge)}</text>
  <text x="${cx}" y="615" font-family="${FONT}" font-size="52" font-weight="800" fill="#234E86" text-anchor="middle">${esc(name)}</text>
  <text x="${cx}" y="665" font-family="${FONT}" font-size="28" fill="#5A6B82" text-anchor="middle">${esc(desc)}</text>
  <rect x="${cx - 160}" y="712" width="320" height="90" rx="45" fill="#2E5E9E"/>
  <text x="${cx}" y="773" font-family="${FONT}" font-size="46" font-weight="800" fill="#fff" text-anchor="middle">${esc(price)}</text>
  <rect x="60" y="842" width="${S - 120}" height="74" rx="16" fill="#DCE9F8"/>
  <text x="${cx}" y="873" font-family="${FONT}" font-size="20" font-weight="700" fill="#234E86" text-anchor="middle">구매 후 받은 코드를 maumotter.com 의 '이용권'에 등록하면</text>
  <text x="${cx}" y="901" font-family="${FONT}" font-size="20" font-weight="700" fill="#234E86" text-anchor="middle">바로 이용할 수 있어요</text>
  <text x="${cx}" y="958" font-family="${FONT}" font-size="15" fill="#9AA8BC" text-anchor="middle">디지털 콘텐츠(이용권 코드) 상품 · 의학적 진단이 아닌 정서 통역 참고용</text>`;
  const otto = await ottoCircle(PH);
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${svg}</svg>`))
    .composite([{ input: otto, top: cy - PH / 2, left: cx - PH / 2 }]).png().toFile(path.join(OUT, file));
  console.log('✓', file);
}

async function guide() {
  const step = (y, n, title, body) => `
    <circle cx="92" cy="${y}" r="26" fill="#3E78C0"/>
    <text x="92" y="${y + 9}" font-family="${FONT}" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">${n}</text>
    <text x="140" y="${y - 4}" font-family="${FONT}" font-size="27" font-weight="800" fill="#234E86">${esc(title)}</text>
    <text x="140" y="${y + 30}" font-family="${FONT}" font-size="20" fill="#5A6B82">${esc(body)}</text>`;
  const svg = `${defs}<rect x="0" y="0" width="${S}" height="${S}" fill="url(#bg)"/>${header()}
  <text x="${S / 2}" y="232" font-family="${FONT}" font-size="40" font-weight="800" fill="#234E86" text-anchor="middle">이용권 코드 등록 방법</text>
  ${step(330, '1', 'maumotter.com 접속 · 로그인', '구매한 같은 분(부모님)이 가입/로그인 해주세요.')}
  ${step(450, '2', "부모 화면의 '이용권' 칸 찾기", '우리 아이 목록 아래 이용권 카드에 입력칸이 있어요.')}
  ${step(570, '3', '받은 코드 입력 후 등록', '스마트스토어 구매 후 받은 코드를 붙여넣고 등록하세요.')}
  ${step(690, '4', '바로 적용 완료', "구독/회차권이 즉시 적용돼요(통역 1번 = 또또와의 대화 1번).")}
  <rect x="60" y="800" width="${S - 120}" height="120" rx="16" fill="#FFF3E9"/>
  <text x="${S / 2}" y="846" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 코드는 1인 1회 등록됩니다(타인 양도·중복등록 불가).</text>
  <text x="${S / 2}" y="878" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 디지털 콘텐츠 특성상 코드 발송·등록 후 환불이 제한될 수 있어요.</text>
  <text x="${S / 2}" y="910" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 문의: limyj007@gmail.com</text>`;
  const otto = await ottoCircle(60);
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${svg}</svg>`))
    .composite([{ input: otto, top: 45, left: 44 }]).png().toFile(path.join(OUT, '00_코드등록_안내.png'));
  console.log('✓ 00_코드등록_안내.png');
}

(async () => {
  await guide();
  await card({ file: '01_구독_라이트.png', name: '마음수달 구독 · 라이트', desc: '30일 동안 매월 30회 통역', price: '4,900원', badge: 'LIGHT' });
  await card({ file: '02_구독_프로.png', name: '마음수달 구독 · 프로', desc: '30일 동안 매월 100회 통역', price: '9,900원', badge: 'PRO' });
  await card({ file: '03_회차권_10회.png', name: '마음수달 회차권 · 10회', desc: '통역 10회 이용권 · 60일 유효', price: '4,900원', badge: '10회권' });
  console.log('done');
})();
