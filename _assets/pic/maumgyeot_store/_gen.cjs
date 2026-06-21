// 마음곁 스마트스토어 이미지 생성 — 대표이미지 1000×1000 3종 + 코드등록 안내 1종.
// 실행: NODE_PATH="<sharp 있는 node_modules>" node _assets/pic/maumgyeot_store/_gen.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
fs.mkdirSync(OUT, { recursive: true });

const S = 1000;
const FONT = "Malgun Gothic, 'Noto Sans KR', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const render = (svg, file, w = S, h = S) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`))
    .png().toFile(path.join(OUT, file)).then(() => console.log('✓', file));

// 발바닥(흰색) 글리프
const paw = (cx, cy, s = 1) => `
  <ellipse cx="${cx}" cy="${cy + 16 * s}" rx="${34 * s}" ry="${27 * s}" fill="#fff"/>
  <circle cx="${cx - 34 * s}" cy="${cy - 8 * s}" r="${12 * s}" fill="#fff"/>
  <circle cx="${cx - 12 * s}" cy="${cy - 24 * s}" r="${13 * s}" fill="#fff"/>
  <circle cx="${cx + 12 * s}" cy="${cy - 24 * s}" r="${13 * s}" fill="#fff"/>
  <circle cx="${cx + 34 * s}" cy="${cy - 8 * s}" r="${12 * s}" fill="#fff"/>`;

const defs = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E8B7A"/><stop offset="1" stop-color="#3E9E8E"/></linearGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2FBF7"/><stop offset="1" stop-color="#E7F4EF"/></linearGradient>
</defs>`;

const header = () => `
  <rect x="0" y="0" width="${S}" height="150" fill="url(#g)"/>
  ${paw(74, 75, 0.62)}
  <text x="132" y="68" font-family="${FONT}" font-size="32" font-weight="800" fill="#fff">마음곁</text>
  <text x="132" y="108" font-family="${FONT}" font-size="20" fill="#D9F2EA">반려동물의 행동을 읽어 마음을 통역해요 · maumgyeot.com</text>`;

function card({ file, name, desc, price, badge }) {
  const svg = `${defs}
  <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bg)"/>
  ${header()}
  <circle cx="${S / 2}" cy="375" r="118" fill="#2E8B7A"/>
  ${paw(S / 2, 372, 1.7)}
  <rect x="${S / 2 - 70}" y="476" width="140" height="46" rx="23" fill="#E08A52"/>
  <text x="${S / 2}" y="507" font-family="${FONT}" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">${esc(badge)}</text>
  <text x="${S / 2}" y="600" font-family="${FONT}" font-size="54" font-weight="800" fill="#1F5C52" text-anchor="middle">${esc(name)}</text>
  <text x="${S / 2}" y="652" font-family="${FONT}" font-size="29" fill="#5C6B66" text-anchor="middle">${esc(desc)}</text>
  <rect x="${S / 2 - 160}" y="700" width="320" height="92" rx="46" fill="#246B5F"/>
  <text x="${S / 2}" y="762" font-family="${FONT}" font-size="48" font-weight="800" fill="#fff" text-anchor="middle">${esc(price)}</text>
  <rect x="60" y="836" width="${S - 120}" height="76" rx="16" fill="#D9F0E9"/>
  <text x="${S / 2}" y="868" font-family="${FONT}" font-size="20" font-weight="700" fill="#1F5C52" text-anchor="middle">구매 후 받은 코드를 maumgyeot.com 의 '이용권'에 등록하면</text>
  <text x="${S / 2}" y="896" font-family="${FONT}" font-size="20" font-weight="700" fill="#1F5C52" text-anchor="middle">바로 이용할 수 있어요</text>
  <text x="${S / 2}" y="958" font-family="${FONT}" font-size="15" fill="#9AA5A1" text-anchor="middle">디지털 콘텐츠(이용권 코드) 상품 · 수의학적 진단이 아닌 행동 이해 참고용</text>`;
  return render(svg, file);
}

function guide() {
  const step = (y, n, title, body) => `
    <circle cx="92" cy="${y}" r="26" fill="#2E8B7A"/>
    <text x="92" y="${y + 9}" font-family="${FONT}" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">${n}</text>
    <text x="140" y="${y - 4}" font-family="${FONT}" font-size="27" font-weight="800" fill="#1F5C52">${esc(title)}</text>
    <text x="140" y="${y + 30}" font-family="${FONT}" font-size="20" fill="#5C6B66">${esc(body)}</text>`;
  const svg = `${defs}
  <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bg)"/>
  ${header()}
  <text x="${S / 2}" y="232" font-family="${FONT}" font-size="40" font-weight="800" fill="#1F5C52" text-anchor="middle">이용권 코드 등록 방법</text>
  ${step(330, '1', 'maumgyeot.com 접속 · 로그인', '구매한 같은 분이 가입/로그인 해주세요(이메일 가입).')}
  ${step(450, '2', "홈의 '이용권' 칸 찾기", '메인 화면 아래쪽 이용권 카드에 코드 입력칸이 있어요.')}
  ${step(570, '3', '받은 코드 입력 후 등록', '스마트스토어 구매 후 받은 코드를 붙여넣고 등록을 누르세요.')}
  ${step(690, '4', '바로 적용 완료', '구독/회차권이 즉시 적용되고, 남은 통역 횟수가 보여요.')}
  <rect x="60" y="800" width="${S - 120}" height="120" rx="16" fill="#FFF3E9"/>
  <text x="${S / 2}" y="846" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 코드는 1인 1회 등록됩니다(타인 양도·중복등록 불가).</text>
  <text x="${S / 2}" y="878" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 디지털 콘텐츠 특성상 코드 발송·등록 후 환불이 제한될 수 있어요.</text>
  <text x="${S / 2}" y="910" font-family="${FONT}" font-size="20" font-weight="700" fill="#B5651D" text-anchor="middle">· 문의: limyj007@gmail.com</text>`;
  return render(svg, '00_코드등록_안내.png');
}

(async () => {
  await guide();
  await card({ file: '01_구독_라이트.png', name: '마음곁 구독 · 라이트', desc: '30일 동안 매월 30회 통역', price: '4,900원', badge: 'LIGHT' });
  await card({ file: '02_구독_프로.png', name: '마음곁 구독 · 프로', desc: '30일 동안 매월 100회 통역', price: '9,900원', badge: 'PRO' });
  await card({ file: '03_회차권_10회.png', name: '마음곁 회차권 · 10회', desc: '통역 10회 이용권 · 60일 유효', price: '4,900원', badge: '10회권' });
  console.log('done');
})();
