// 마음곁 제휴(파트너 입점용) 배너 생성 — 주요 광고 규격 4종.
// 파트너는 배너 클릭 링크에 ?ref=파트너이름 을 붙여 사용(유입 정산).
// 실행: NODE_PATH="<sharp 있는 node_modules>" node _assets/pic/maumgyeot_partner/_gen.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
fs.mkdirSync(OUT, { recursive: true });

const FONT = "Malgun Gothic, 'Noto Sans KR', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const render = (svg, file, w, h) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`))
    .png().toFile(path.join(OUT, file)).then(() => console.log('✓', file, `${w}×${h}`));

const defs = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E8B7A"/><stop offset="1" stop-color="#3E9E8E"/></linearGradient>
</defs>`;
const paw = (cx, cy, s = 1, fill = '#fff') => `
  <ellipse cx="${cx}" cy="${cy + 16 * s}" rx="${34 * s}" ry="${27 * s}" fill="${fill}"/>
  <circle cx="${cx - 34 * s}" cy="${cy - 8 * s}" r="${12 * s}" fill="${fill}"/>
  <circle cx="${cx - 12 * s}" cy="${cy - 24 * s}" r="${13 * s}" fill="${fill}"/>
  <circle cx="${cx + 12 * s}" cy="${cy - 24 * s}" r="${13 * s}" fill="${fill}"/>
  <circle cx="${cx + 34 * s}" cy="${cy - 8 * s}" r="${12 * s}" fill="${fill}"/>`;
const cta = (x, y, w, h, label, fs) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#E08A52"/>
  <text x="${x + w / 2}" y="${y + h / 2 + fs * 0.35}" font-family="${FONT}" font-size="${fs}" font-weight="800" fill="#fff" text-anchor="middle">${esc(label)}</text>`;

// 1200×628 (블로그/카드/OG 와이드)
function og() {
  const w = 1200, h = 628;
  const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
    ${paw(170, 250, 2.4, '#ffffff')}
    <text x="320" y="210" font-family="${FONT}" font-size="62" font-weight="800" fill="#fff">반려동물의 마음,</text>
    <text x="320" y="290" font-family="${FONT}" font-size="62" font-weight="800" fill="#fff">행동으로 통역해요</text>
    <text x="320" y="350" font-family="${FONT}" font-size="30" fill="#D9F2EA">꼬리·귀·자세·소리와 상황을 읽어 "이런 마음일 수 있어요"</text>
    ${cta(320, 410, 360, 86, '무료로 체험하기', 34)}
    <text x="320" y="560" font-family="${FONT}" font-size="26" font-weight="700" fill="#fff">maumgyeot.com</text>
    <text x="${w - 40}" y="${h - 30}" font-family="${FONT}" font-size="18" fill="#BFE6DC" text-anchor="end">마음곁 · 동물행동학 기반 통역(참고용)</text>`;
  return render(svg, 'banner_1200x628.png', w, h);
}
// 300×250 (미디엄 렉탱글)
function rect() {
  const w = 300, h = 250;
  const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
    ${paw(w / 2, 64, 1.0)}
    <text x="${w / 2}" y="138" font-family="${FONT}" font-size="27" font-weight="800" fill="#fff" text-anchor="middle">반려동물 마음 통역</text>
    <text x="${w / 2}" y="170" font-family="${FONT}" font-size="16" fill="#D9F2EA" text-anchor="middle">행동을 읽어 마음을 전해요</text>
    ${cta(w / 2 - 95, 192, 190, 44, '무료로 체험하기', 19)}
    <text x="${w / 2}" y="244" font-family="${FONT}" font-size="13" fill="#BFE6DC" text-anchor="middle">maumgyeot.com</text>`;
  return render(svg, 'banner_300x250.png', w, h);
}
// 728×90 (리더보드)
function leaderboard() {
  const w = 728, h = 90;
  const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
    ${paw(54, 45, 0.78)}
    <text x="110" y="42" font-family="${FONT}" font-size="26" font-weight="800" fill="#fff">마음곁 · 반려동물 마음 통역</text>
    <text x="110" y="70" font-family="${FONT}" font-size="16" fill="#D9F2EA">행동(꼬리·귀·자세·소리)을 읽어 "이런 마음일 수 있어요"</text>
    ${cta(w - 220, 24, 196, 44, '무료로 체험하기 →', 18)}`;
  return render(svg, 'banner_728x90.png', w, h);
}
// 320×100 (모바일 배너)
function mobile() {
  const w = 320, h = 100;
  const svg = `${defs}<rect width="${w}" height="${h}" fill="url(#g)"/>
    ${paw(42, 50, 0.62)}
    <text x="84" y="44" font-family="${FONT}" font-size="20" font-weight="800" fill="#fff">반려동물 마음 통역</text>
    <text x="84" y="68" font-family="${FONT}" font-size="13" fill="#D9F2EA">행동을 읽어 마음을 전해요</text>
    ${cta(w - 96, 30, 84, 40, '체험하기', 15)}`;
  return render(svg, 'banner_320x100.png', w, h);
}

(async () => {
  await og(); await rect(); await leaderboard(); await mobile();
  console.log('done');
})();
