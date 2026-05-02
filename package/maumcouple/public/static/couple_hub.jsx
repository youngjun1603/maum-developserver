// ============================================================
// couple_hub.jsx  —  마음커플 메인 앱
// 마음게임과 동일한 UX 패턴 · 커플 로즈 테마
// ============================================================
const { useState, useEffect, useRef, useCallback } = React;

// ── 팔레트 (커플 로즈/라벤더 테마) ───────────────────────
const C = {
  rose:     '#B5556A',
  roseL:    '#D4849A',
  rosePale: '#FCF0F3',
  cream:    '#FDFCF7',
  sand:     '#F5EFE0',
  lavender: '#7A6EA8',
  lavL:     '#A89ED4',
  lavPale:  '#F0EEF8',
  amber:    '#D4954A',
  amberL:   '#E8C47A',
  muted:    '#8A8A7A',
  dark:     '#2C2020',
  heartRed: '#E05C7A',
};

// ── 상수 ──────────────────────────────────────────────────
const TOKEN_KEY   = 'couple_token';
const MAUMFUL_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
  if (h.includes('maumcouple-dev') || h.includes('-dev.')) return 'https://maumful-dev.limyj007.workers.dev';
  return 'https://maumful.com';
})();

const COST_FULL  = 45;  // BIG5+LOST+DSI
const COST_TWO   = 35;  // 2개 조합
const COST_ONE   = 20;  // 단독

// ── API 헬퍼 ─────────────────────────────────────────────
const api = {
  _h() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
             : { 'Content-Type': 'application/json' };
  },
  async get(path) {
    const r = await fetch(path, { headers: this._h() });
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  },
  async patch(path, body = {}) {
    const r = await fetch(path, { method: 'PATCH', headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  },
};

// ── 유틸 ─────────────────────────────────────────────────
function displayName(user) {
  return user?.nickname || user?.email?.split('@')[0] || '나';
}
function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}
function scoreColor(score) {
  if (score >= 80) return '#4A9A5A';
  if (score >= 60) return C.rose;
  return C.amber;
}
function scoreLabel(score) {
  if (score >= 85) return '천생연분 💕';
  if (score >= 70) return '잘 맞는 커플 💑';
  if (score >= 55) return '노력하면 완벽 🌸';
  return '다름 속의 매력 🌈';
}

// ── 오늘의 커플 대화 질문 (60개, 날짜 기반 순환) ──────────
const DAILY_QUESTIONS = [
  "처음 만났을 때 상대방의 어떤 점이 마음에 들었나요?",
  "우리가 함께한 가장 소중한 순간은 무엇인가요?",
  "10년 후 우리는 어디서 어떻게 살고 있을까요?",
  "서로에 대해 아직 모르는 것이 있다면 무엇일까요?",
  "상대방에게 가장 감사한 점은 무엇인가요?",
  "우리 관계에서 가장 자랑스러운 부분은 무엇인가요?",
  "함께 꼭 해보고 싶은 버킷리스트가 있나요?",
  "내가 힘들 때 상대방이 어떻게 해줬으면 하나요?",
  "상대방의 어떤 작은 습관이 귀엽게 느껴지나요?",
  "우리의 첫 데이트를 다시 한다면 어디를 가고 싶으세요?",
  "서로에게 가장 힘이 됐던 말이 있나요?",
  "함께 가장 많이 웃었던 순간은 언제인가요?",
  "상대방에게 평소에 하지 못했던 말이 있다면?",
  "상대방의 어떤 모습이 가장 멋있다고 생각하나요?",
  "서로 함께 배우고 싶은 것이 있나요?",
  "가장 좋아하는 우리만의 루틴이 있나요?",
  "상대방이 스트레스 받을 때 어떻게 도와줄 수 있을까요?",
  "함께 여행하고 싶은 꿈의 여행지는 어디인가요?",
  "상대방이 나를 이해해줬다고 느낀 순간은 언제인가요?",
  "서로에게 가장 닮고 싶은 점은 무엇인가요?",
  "상대방이 나에게 더 솔직하게 말해줬으면 하는 것이 있나요?",
  "우리의 관계를 한 단어로 표현하면 무엇인가요?",
  "함께 이루고 싶은 가장 큰 꿈은 무엇인가요?",
  "상대방의 어떤 작은 배려가 가장 기억에 남나요?",
  "서로의 취미를 함께 즐겨본 적이 있나요? 어땠나요?",
  "상대방이 나를 위해 해준 것 중 가장 감동적인 것은?",
  "우리 관계에서 앞으로 더 노력하고 싶은 것은 무엇인가요?",
  "상대방과 함께라면 무엇이든 할 수 있을 것 같은 이유는?",
  "우리가 노부부가 되었을 때 어떤 모습이길 바라나요?",
  "상대방의 어떤 성격이 나를 더 좋은 사람으로 만들어주나요?",
  "함께 한 번쯤 도전해보고 싶은 새로운 경험이 있나요?",
  "상대방이 나를 위해 변해준 것이 있다면 무엇인가요?",
  "우리 관계에서 가장 소중히 지키고 싶은 것은?",
  "서로에게 더 잘 표현하고 싶은 감정이 있나요?",
  "함께 매일 하고 싶은 작은 습관이 있다면?",
  "상대방이 나를 가장 잘 이해한다고 느끼는 순간은?",
  "우리가 함께 산다면 어떤 집에서 살고 싶나요?",
  "서로의 꿈을 응원하는 나만의 방법이 있나요?",
  "상대방이 나에게 보내는 사랑 신호는 어떤 것인가요?",
  "우리 둘만의 특별한 단어나 암호 같은 게 있나요?",
  "함께 보내는 시간 중 가장 행복한 순간은?",
  "상대방이 나를 웃게 만드는 방법은 무엇인가요?",
  "서로에게 미안한 마음이 있다면 무엇인가요?",
  "함께 이루고 싶은 올해의 목표가 있나요?",
  "상대방이 없었다면 지금 나는 어떤 사람이었을까요?",
  "우리가 처음 손을 잡은 순간을 기억하나요?",
  "서로의 가장 큰 장점을 세 가지씩 말해볼까요?",
  "함께 보고 싶은 영화나 드라마가 있나요?",
  "상대방이 나에게 바라는 한 가지가 있다면?",
  "우리가 처음 '사귀자'고 했을 때 어떤 기분이었나요?",
  "서로 닮은 점을 세 가지 찾아볼 수 있을까요?",
  "상대방의 어떤 행동이 가장 설레게 만드나요?",
  "우리가 함께 성장했다고 느끼는 순간은 언제인가요?",
  "지금 이 순간 상대방에게 가장 하고 싶은 말은?",
  "우리 관계에서 가장 잘 소통하는 방식은 무엇인가요?",
  "서로에게 가장 필요한 사람이 됐다고 느끼는 순간은?",
  "함께 꼭 가보고 싶은 식당이나 카페가 있나요?",
  "상대방이 나를 위해 해줬으면 하는 작은 부탁이 있다면?",
  "우리가 이렇게 잘 맞는 이유는 무엇일까요?",
  "상대방과 함께 있으면 어떤 감정이 드나요?",
];

// ── 미니 연애 유형 테스트 ─────────────────────────────────
const MINI_QUESTIONS = [
  { q: "연애에서 가장 중요하게 여기는 것은?",
    opts: [{ text: "신뢰와 안정감", type: 'S' }, { text: "설레는 감정과 특별한 순간", type: 'R' },
           { text: "함께 성장하는 것", type: 'P' }, { text: "서로의 자유와 독립", type: 'F' }] },
  { q: "파트너가 연락을 늦게 할 때 나는?",
    opts: [{ text: "크게 신경 쓰지 않는다", type: 'S' }, { text: "걱정되어 먼저 연락한다", type: 'P' },
           { text: "나도 바쁘니 괜찮다", type: 'F' }, { text: "서운하지만 예쁜 메시지를 남긴다", type: 'R' }] },
  { q: "이상적인 데이트 스타일은?",
    opts: [{ text: "분위기 있는 레스토랑과 야경", type: 'R' }, { text: "새로운 액티비티 도전", type: 'P' },
           { text: "집에서 편하게 영화 보기", type: 'S' }, { text: "각자 하고 싶은 것 즐기기", type: 'F' }] },
  { q: "서운할 때 나는?",
    opts: [{ text: "바로 솔직하게 이야기한다", type: 'S' }, { text: "넌지시 표현하고 알아줬으면 한다", type: 'R' },
           { text: "감정을 충분히 표현한다", type: 'P' }, { text: "혼자 정리하고 넘어간다", type: 'F' }] },
  { q: "애정 표현 스타일은?",
    opts: [{ text: "말과 행동으로 적극적으로", type: 'P' }, { text: "특별한 이벤트와 선물", type: 'R' },
           { text: "꾸준한 작은 관심과 배려", type: 'S' }, { text: "함께하는 소소한 일상", type: 'F' }] },
  { q: "미래를 생각할 때 나는?",
    opts: [{ text: "함께 구체적 계획을 세우고 싶다", type: 'S' }, { text: "아름다운 미래 모습을 상상한다", type: 'R' },
           { text: "함께 더 나은 사람이 되고 싶다", type: 'P' }, { text: "자연스럽게 흘러가면 좋겠다", type: 'F' }] },
  { q: "연애에서 가장 힘든 것은?",
    opts: [{ text: "신뢰가 흔들릴 때", type: 'S' }, { text: "설렘이 줄어들 것 같을 때", type: 'R' },
           { text: "함께 성장하지 못하는 것 같을 때", type: 'P' }, { text: "나만의 공간이 없을 때", type: 'F' }] },
];

const LOVE_TYPES = {
  S: { emoji: '💚', name: '안정 신뢰형', short: '든든한 버팀목',
    desc: '신뢰와 안정감을 가장 중요하게 여깁니다. 꾸준하고 믿음직한 파트너로, 상대방이 편안하게 의지할 수 있는 관계를 만들어요.',
    strength: '높은 신뢰도 · 꾸준한 헌신 · 솔직한 소통',
    match: '감정 표현이 솔직하고 안정감을 원하는 분과 잘 맞아요.',
    tip: '때로는 작은 이벤트로 설렘도 선물해보세요! 💫',
    color: '#4A9A5A', pale: '#EAF5EC' },
  R: { emoji: '🌹', name: '낭만 감성형', short: '설렘 제조기',
    desc: '감성적이고 특별한 순간을 사랑합니다. 작은 이벤트와 감동적인 표현으로 연애를 풍성하게 만드는 로맨티스트예요.',
    strength: '풍부한 감수성 · 창의적 표현 · 세심한 배려',
    match: '감동과 설렘을 함께 나눌 수 있는 분과 잘 맞아요.',
    tip: '일상적인 안정감도 연애의 소중한 부분이에요. 🌱',
    color: C.rose, pale: C.rosePale },
  P: { emoji: '🔥', name: '열정 성장형', short: '함께 타오르는 불꽃',
    desc: '강렬하고 진취적인 연애를 원합니다. 파트너와 함께 성장하고 더 나은 사람이 되는 것에 큰 가치를 두는 열정적인 타입이에요.',
    strength: '강한 헌신 · 함께 성장하는 마인드 · 적극적 표현',
    match: '비슷한 열정과 목표를 공유할 수 있는 분과 잘 맞아요.',
    tip: '파트너의 충전 시간도 배려해주세요. 💆',
    color: '#D4634A', pale: '#FEF0EC' },
  F: { emoji: '🌊', name: '자유 여유형', short: '바람 같은 자유로움',
    desc: '서로의 독립성을 존중하며 여유롭고 자연스러운 관계를 선호합니다. 집착 없이 서로를 믿고 개인 공간을 지켜주는 성숙한 연애를 해요.',
    strength: '서로 존중 · 집착 없는 신뢰 · 개인 공간 배려',
    match: '독립성을 이해하고 여유 있는 연애를 원하는 분과 잘 맞아요.',
    tip: '때로는 더 적극적인 관심 표현도 필요할 수 있어요. 💌',
    color: C.lavender, pale: C.lavPale },
};

function calcLoveType(answers) {
  const counts = { S: 0, R: 0, P: 0, F: 0 };
  answers.forEach(a => { if (a) counts[a] = (counts[a] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── BIG5 기반 케미 유형 ──────────────────────────────────
function getPersonalityLabel(big5Data) {
  if (!big5Data) return null;
  const { O=50, C=50, E=50, A=50, N=50 } = big5Data;
  return [
    { emoji: '⚡', name: '활력형', v: E },
    { emoji: '🤝', name: '친화형', v: A },
    { emoji: '🎨', name: '탐구형', v: O },
    { emoji: '📋', name: '계획형', v: C },
    { emoji: '🌊', name: '감수형', v: N },
  ].sort((a, b) => b.v - a.v)[0];
}

function getCoupleChemType(myBig5, partnerBig5) {
  if (!myBig5 || !partnerBig5) return null;
  const eDiff = Math.abs((myBig5.E||50) - (partnerBig5.E||50));
  const avgE  = ((myBig5.E||50) + (partnerBig5.E||50)) / 2;
  const avgA  = ((myBig5.A||50) + (partnerBig5.A||50)) / 2;
  const avgO  = ((myBig5.O||50) + (partnerBig5.O||50)) / 2;
  if (eDiff < 15 && avgE > 60) return { emoji: '🔥', name: '열정 폭발형', desc: '둘 다 에너지가 넘쳐 함께하면 시너지 폭발!', color: '#D4634A' };
  if (eDiff > 30) return { emoji: '🌊', name: '균형 보완형', desc: '서로 다른 에너지가 완벽한 균형을 이뤄요.', color: C.lavender };
  if (avgA > 65) return { emoji: '💚', name: '따뜻한 배려형', desc: '서로를 깊이 배려하는 따뜻하고 안정적인 케미예요.', color: '#4A9A5A' };
  if (avgO > 65) return { emoji: '🎨', name: '창의적 탐험형', desc: '새로운 것을 함께 탐험하는 모험심 넘치는 케미예요.', color: C.amber };
  return { emoji: '💕', name: '특별한 우리형', desc: '둘만의 독특하고 소중한 케미를 가지고 있어요.', color: C.rose };
}

// ── HeartSVG 일러스트 ─────────────────────────────────────
function HeartIllust({ score = 75, style = {} }) {
  const fill = scoreColor(score);
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', ...style }}>
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCF0F3"/>
          <stop offset="100%" stopColor="#F0EEF8"/>
        </linearGradient>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.roseL}/>
          <stop offset="100%" stopColor={C.rose}/>
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="320" height="200" fill="url(#bgGrad)"/>

      {/* 작은 별/하트 장식 */}
      {[[30,40],[280,35],[55,160],[265,155],[150,20]].map(([x,y],i) => (
        <text key={i} x={x} y={y} fontSize={i===4?14:10} textAnchor="middle"
          fill={C.roseL} opacity="0.4">✦</text>
      ))}

      {/* 메인 하트 */}
      <g transform="translate(160,100)" filter="url(#softGlow)">
        <path d="M0,20 C0,-20 -50,-40 -50,0 C-50,35 0,70 0,70 C0,70 50,35 50,0 C50,-40 0,-20 0,20 Z"
          fill="url(#heartGrad)" opacity="0.9"/>
      </g>

      {/* 점수 텍스트 */}
      <text x="160" y="108" textAnchor="middle" fontSize="26" fontWeight="700"
        fill="white" fontFamily="'Noto Sans KR', sans-serif">{score}</text>
      <text x="160" y="122" textAnchor="middle" fontSize="10" fill="white" opacity="0.9"
        fontFamily="'Noto Sans KR', sans-serif">/ 100</text>

      {/* A ↔ B 연결선 */}
      <g opacity="0.6">
        <circle cx="68" cy="100" r="22" fill="white" stroke={C.roseL} strokeWidth="1.5"/>
        <text x="68" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.rose}
          fontFamily="'Noto Sans KR', sans-serif">A</text>
        <circle cx="252" cy="100" r="22" fill="white" stroke={C.lavL} strokeWidth="1.5"/>
        <text x="252" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.lavender}
          fontFamily="'Noto Sans KR', sans-serif">B</text>
        <line x1="92" y1="100" x2="108" y2="100" stroke={C.roseL} strokeWidth="1.5" strokeDasharray="3,3"/>
        <line x1="212" y1="100" x2="228" y2="100" stroke={C.lavL} strokeWidth="1.5" strokeDasharray="3,3"/>
      </g>
    </svg>
  );
}

// ── 하트 장식 (대기 화면용) ──────────────────────────────
function WaitingIllust({ style = {} }) {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', ...style }}>
      <rect width="320" height="200" fill="#FCF0F3"/>
      {/* 파트너 A (실선) */}
      <g transform="translate(95,100)">
        <path d="M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z"
          fill={C.roseL} opacity="0.85"/>
      </g>
      {/* 파트너 B (점선 — 대기중) */}
      <g transform="translate(225,100)">
        <path d="M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z"
          fill="none" stroke={C.lavL} strokeWidth="2" strokeDasharray="5,4" opacity="0.7"/>
      </g>
      {/* 연결 점선 */}
      <line x1="132" y1="100" x2="188" y2="100" stroke={C.muted}
        strokeWidth="1.5" strokeDasharray="4,4" opacity="0.4"/>
      {/* 물음표 */}
      <text x="225" y="107" textAnchor="middle" fontSize="22" fill={C.lavL} opacity="0.7">?</text>
      {/* 텍스트 */}
      <text x="160" y="168" textAnchor="middle" fontSize="12" fill={C.muted}
        fontFamily="'Noto Sans KR', sans-serif">파트너를 기다리는 중...</text>
    </svg>
  );
}

// ── LoginGate ─────────────────────────────────────────────
function LoginGate() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream}, ${C.lavPale})`,
      padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'heartbeat 2s ease-in-out infinite' }}>💕</div>
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 10,
        fontFamily: "'Noto Serif KR', serif",
      }}>마음커플</h1>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.9, marginBottom: 32, maxWidth: 300 }}>
        마음풀에서 로그인하면<br/>
        별도 로그인 없이 바로 이용할 수 있어요.<br/>
        심리검사 결과로 파트너와의<br/>
        궁합과 관계 패턴을 분석해보세요 💑
      </p>
      <a href={MAUMFUL_URL} style={{
        display: 'inline-block', padding: '14px 36px',
        background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
        color: 'white', borderRadius: 14, fontWeight: 700,
        fontSize: 15, textDecoration: 'none',
        boxShadow: `0 8px 24px ${C.rose}44`,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        마음풀 로그인하고 시작하기 →
      </a>
    </div>
  );
}

// ── TestResultBadge ───────────────────────────────────────
function TestResultBadge({ type, result, date }) {
  const hasResult = !!result;
  const meta = {
    BIG5: { emoji: '🧬', label: 'BIG5 성격검사',   color: C.rose,     pale: C.rosePale,  accentL: C.roseL },
    LOST: { emoji: '⚙️', label: 'LOST 행동유형',   color: C.lavender, pale: C.lavPale,   accentL: C.lavL  },
    DSI:  { emoji: '🪞', label: 'SDRI 자아분화검사', color: '#5A8A7A',  pale: '#EAF3F0',   accentL: '#7ABAA8' },
  }[type] || { emoji: '📋', label: type, color: C.muted, pale: '#F5F5F5', accentL: C.muted };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: hasResult ? meta.pale : '#F5F5F5',
      border: `1px solid ${hasResult ? meta.accentL + '44' : '#E0E0E0'}`,
    }}>
      <span style={{ fontSize: 22 }}>{meta.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hasResult ? C.dark : C.muted }}>
          {meta.label}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {hasResult ? `✓ 완료 · ${fmtDate(date)}` : '아직 검사 결과 없음'}
        </div>
      </div>
      {hasResult && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 100, background: meta.color, color: 'white',
        }}>완료</span>
      )}
    </div>
  );
}

// ── DailyQuestionCard ─────────────────────────────────────
function DailyQuestionCard() {
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const dayIdx = (Math.floor(Date.now() / 86400000) + offset) % DAILY_QUESTIONS.length;
  const q = DAILY_QUESTIONS[dayIdx];

  function copyQuestion() {
    const text = `💕 오늘의 커플 대화 질문\n\n"${q}"\n\nhttps://couple.maumful.com`;
    if (navigator.share) {
      navigator.share({ title: '오늘의 커플 질문', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{
      borderRadius: 20, padding: '20px', marginBottom: 20,
      background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: `1px solid ${C.roseL}33`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>오늘의 커플 대화 질문</span>
        </div>
        <span style={{ fontSize: 11, color: C.muted, background: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: 20 }}>
          Day {((dayIdx + 1))}
        </span>
      </div>
      <div style={{
        fontSize: 15, fontWeight: 600, color: C.dark, lineHeight: 1.7,
        padding: '16px', background: 'rgba(255,255,255,0.7)', borderRadius: 14,
        marginBottom: 14, fontFamily: "'Noto Serif KR', serif",
        textAlign: 'center',
      }}>
        "{q}"
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setOffset(o => o + 1)} style={{
          flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.7)', color: C.muted,
          fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
        }}>다음 질문 →</button>
        <button onClick={copyQuestion} style={{
          flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: C.rose, color: 'white',
          fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif",
        }}>{copied ? '✓ 복사됨' : '📤 파트너와 공유'}</button>
      </div>
    </div>
  );
}

// ── MiniLoveTestView ──────────────────────────────────────
function MiniLoveTestView({ onBack }) {
  const [step, setStep]       = useState(-1); // -1=인트로
  const [answers, setAnswers] = useState([]);
  const [result, setResult]   = useState(null);

  function handleAnswer(type) {
    const next = [...answers, type];
    setAnswers(next);
    if (next.length >= MINI_QUESTIONS.length) {
      setResult(calcLoveType(next));
    } else {
      setStep(s => s + 1);
    }
  }

  function reset() { setStep(-1); setAnswers([]); setResult(null); }

  function shareResult(t) {
    const text = `💕 나의 연애 유형은 "${t.emoji} ${t.name}"\n\n${t.short} — ${t.desc.slice(0, 50)}...\n\n나도 테스트해봐요!\nhttps://couple.maumful.com`;
    navigator.share ? navigator.share({ title: '나의 연애 유형', text }).catch(() => {})
                    : navigator.clipboard?.writeText(text).catch(() => {});
  }

  const currentQ = MINI_QUESTIONS[step];
  const t = result ? LOVE_TYPES[result] : null;
  const progress = step >= 0 ? ((step + 1) / MINI_QUESTIONS.length * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={result ? reset : (step === -1 ? onBack : () => setStep(s => s - 1))} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.dark,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>나의 연애 유형</span></button>
        {step >= 0 && !result && (
          <span style={{ fontSize: 12, color: C.muted }}>{step + 1} / {MINI_QUESTIONS.length}</span>
        )}
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* 인트로 */}
        {step === -1 && !result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>💝</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" }}>
              나의 연애 유형은?
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 32 }}>
              7가지 질문으로 알아보는 나의 연애 스타일.<br/>
              크레딧 없이 무료로 바로 시작할 수 있어요!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
              {Object.values(LOVE_TYPES).map(t => (
                <div key={t.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 14,
                  background: t.pale, border: `1px solid ${t.color}22`,
                }}>
                  <span style={{ fontSize: 24 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.short}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(0)} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
              color: 'white', fontWeight: 700, fontSize: 15,
              fontFamily: "'Noto Sans KR', sans-serif",
              boxShadow: `0 8px 24px ${C.rose}44`,
            }}>시작하기 →</button>
          </div>
        )}

        {/* 문항 */}
        {step >= 0 && !result && currentQ && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                height: 6, borderRadius: 100, background: '#F0E0E8', overflow: 'hidden', marginBottom: 8,
              }}>
                <div style={{
                  height: '100%', borderRadius: 100, width: `${progress}%`,
                  background: `linear-gradient(90deg, ${C.roseL}, ${C.rose})`,
                  transition: 'width 0.4s ease',
                }}/>
              </div>
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>
                {step + 1}/{MINI_QUESTIONS.length}
              </div>
            </div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: C.dark, lineHeight: 1.6,
              marginBottom: 28, textAlign: 'center',
              fontFamily: "'Noto Serif KR', serif",
              padding: '0 8px',
            }}>
              Q{step + 1}. {currentQ.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentQ.opts.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(opt.type)} style={{
                  padding: '16px 20px', borderRadius: 14, border: `1.5px solid ${C.roseL}33`,
                  background: 'white', cursor: 'pointer', textAlign: 'left',
                  fontSize: 14, fontWeight: 600, color: C.dark,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s',
                }}>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && t && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 12, animation: 'heartbeat 1s ease-in-out 3' }}>{t.emoji}</div>
            <div style={{ fontSize: 12, color: t.color, fontWeight: 700, marginBottom: 4, letterSpacing: 2 }}>
              나의 연애 유형
            </div>
            <h2 style={{
              fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 6,
              fontFamily: "'Noto Serif KR', serif",
            }}>{t.name}</h2>
            <div style={{
              display: 'inline-block', marginBottom: 24,
              padding: '5px 16px', borderRadius: 100,
              background: t.color + '18', color: t.color, fontWeight: 700, fontSize: 13,
            }}>{t.short}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 24 }}>
              <div style={{
                padding: '16px', borderRadius: 16, background: t.pale,
                border: `1px solid ${t.color}22`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 6 }}>💡 연애 성향</div>
                <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.7 }}>{t.desc}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'white', border: '1px solid #F0E0E8' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>✨ 강점</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.strength}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'white', border: '1px solid #F0E0E8' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>💑 잘 맞는 유형</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.match}</div>
              </div>
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
                border: `1px solid ${C.roseL}33`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 4 }}>💌 성장 팁</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.tip}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => shareResult(t)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                color: 'white', fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>📤 결과 공유하기</button>
              <button onClick={reset} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.roseL}44`, cursor: 'pointer',
                background: 'white', color: C.rose, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>🔄 다시 해보기</button>
            </div>

            <button onClick={onBack} style={{
              width: '100%', marginTop: 10, padding: '12px', borderRadius: 12,
              border: '1px solid #E0D0D8', cursor: 'pointer',
              background: 'white', color: C.muted, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>← 홈으로 돌아가기</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RelationshipCoachView ─────────────────────────────────
function RelationshipCoachView({ userName, credits, isMaster, onBack }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const [error, setError]         = useState('');
  const FREE_LIMIT = 3;
  const PAID_COST  = 2;
  const endRef = React.useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const SUGGESTIONS = [
    "파트너와 자꾸 같은 주제로 싸워요",
    "연애할 때 감정 표현이 너무 서툰 것 같아요",
    "파트너가 나를 이해 못하는 것 같아 답답해요",
    "설렘이 줄어드는 것 같아 걱정돼요",
    "파트너에게 서운한 걸 어떻게 말해야 할까요?",
  ];

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/couple/coach', { messages: newMessages });
      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        setUsedToday(res.data.usedToday);
        if (res.data.creditsSpent > 0) {
          setError(`💳 ${res.data.creditsSpent}cr 차감됐습니다.`);
          setTimeout(() => setError(''), 3000);
        }
      } else if (res.needsCharge) {
        setMessages(prev => prev.slice(0, -1));
        setInput(text);
        setError(`크레딧이 부족합니다. (필요: ${PAID_COST}cr)`);
      } else {
        setMessages(prev => prev.slice(0, -1));
        setInput(text);
        setError(res.error || '전송 실패');
      }
    } catch {
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
      setError('서버 오류가 발생했습니다.');
    }
    finally { setLoading(false); }
  }

  const canAfford = isMaster || usedToday < FREE_LIMIT || credits >= PAID_COST;
  const freeLeft  = Math.max(0, FREE_LIMIT - usedToday);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})`, display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← <span style={{ fontSize: 14, fontWeight: 600 }}>AI 관계 코치</span>
        </button>
        <div style={{ fontSize: 11, color: C.muted, background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 100 }}>
          {isMaster ? '무제한' : freeLeft > 0 ? `무료 ${freeLeft}회 남음` : `${PAID_COST}cr/회`}
        </div>
      </nav>

      {/* 채팅 영역 */}
      <div style={{ flex: 1, maxWidth: 560, width: '100%', margin: '0 auto', padding: '20px 16px 100px', overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
              AI 관계 코치
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
              연애·커플 관계에 대한 고민을 편하게 나눠보세요.<br/>
              BIG5 성격 데이터를 바탕으로 맞춤 조언을 드려요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); }} style={{
                  padding: '11px 16px', borderRadius: 12,
                  background: 'white', border: `1px solid ${C.roseL}44`,
                  color: C.dark, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>💬 {s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: 100, background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                💬
              </div>
            )}
            <div style={{
              maxWidth: '75%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? `linear-gradient(135deg, ${C.rose}, ${C.roseL})` : 'white',
              color: m.role === 'user' ? 'white' : C.dark,
              fontSize: 13, lineHeight: 1.7, wordBreak: 'keep-all',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 100, background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: 100, background: C.roseL, animation: `pulse 1.2s ${i * 0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* 입력창 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(253,252,247,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(181,85,106,0.12)', padding: '12px 16px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {error && <div style={{ fontSize: 11, color: usedToday >= FREE_LIMIT ? C.muted : '#D05555', marginBottom: 6, textAlign: 'center' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="고민을 편하게 이야기해보세요..."
              rows={1}
              disabled={!canAfford}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14, resize: 'none',
                border: `1.5px solid ${C.roseL}44`, outline: 'none',
                fontSize: 14, fontFamily: "'Noto Sans KR', sans-serif",
                background: canAfford ? 'white' : '#F5F5F5', color: C.dark,
                maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !canAfford}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none', cursor: input.trim() && canAfford ? 'pointer' : 'not-allowed',
                background: input.trim() && canAfford ? `linear-gradient(135deg, ${C.rose}, ${C.roseL})` : '#E0D0D8',
                color: 'white', fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CoupleQuizView ────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "이상적인 주말 보내기는?",
    opts: ['집에서 넷플릭스/게임', '맛집·카페 투어', '야외 액티비티', '여행·당일치기'] },
  { q: "싸웠을 때 선호하는 해결 방식은?",
    opts: ['바로 대화로 해결', '혼자 정리 후 대화', '시간이 지나면 해결', '메시지로 먼저 표현'] },
  { q: "파트너에게 받고 싶은 사랑 표현은?",
    opts: ['스킨십 (포옹, 손잡기)', '따뜻한 말과 칭찬', '깜짝 선물·이벤트', '함께 시간 보내기'] },
  { q: "스트레스 받을 때 파트너에게 원하는 것은?",
    opts: ['그냥 옆에 있어줘', '적극적으로 공감해줘', '해결책 같이 찾아줘', '재미있게 해줘'] },
  { q: "이상적인 우리의 생활 방식은?",
    opts: ['거의 모든 걸 함께', '중요한 것만 함께', '각자 생활 존중, 가끔 함께', '상황에 따라 다름'] },
  { q: "10년 후 우리의 모습은?",
    opts: ['아이와 함께하는 가정', '세계여행하는 자유로운 커플', '각자 꿈 이루는 파트너십', '지금처럼 행복하면 OK'] },
  { q: "더 잘 맞는 데이트 스타일은?",
    opts: ['꼼꼼하게 계획해서', '즉흥적으로 그날그날', '파트너가 리드', '반반씩 계획'] },
  { q: "선물을 줄 때 나의 방식은?",
    opts: ['원하는 것 미리 파악', '완전 깜짝 서프라이즈', '함께 골라서', '경험·추억 선물'] },
  { q: "연애에서 가장 중요한 것은?",
    opts: ['신뢰와 안정감', '설렘과 열정', '함께 성장', '편안함과 자유'] },
  { q: "갈등 상황에서 나는?",
    opts: ['즉시 솔직하게 말함', '상황 봐가며 결정', '상대 먼저 진정시킴', '피하고 싶어짐'] },
];

const QUIZ_TYPES = {
  A: { emoji: '🏡', name: '안정 공존형', desc: '함께하는 일상과 안정감을 가장 소중히 여겨요. 편안하고 신뢰 깊은 관계를 만드는 탁월한 파트너예요.', tip: '가끔 작은 서프라이즈로 설렘도 만들어보세요!' },
  B: { emoji: '💬', name: '깊은 유대형', desc: '진심 어린 소통과 정서적 연결을 중시해요. 파트너의 마음을 깊이 이해하고 공감하는 능력이 뛰어나요.', tip: '말보다 행동으로 보여주는 표현도 시도해보세요!' },
  C: { emoji: '🌱', name: '성장 동반형', desc: '함께 발전하고 새로운 것을 경험하는 관계를 원해요. 파트너와 함께 더 나은 사람이 되는 것에 큰 보람을 느껴요.', tip: '지금 이 순간을 즐기는 여유도 가져보세요!' },
  D: { emoji: '🌊', name: '자유 균형형', desc: '서로의 공간과 자유를 존중하는 성숙한 관계를 선호해요. 집착 없이 믿고 맡기는 여유로운 연애를 해요.', tip: '가끔은 더 적극적으로 원하는 것을 표현해보세요!' },
};

function CoupleQuizView({ onBack }) {
  const [step, setStep]       = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [result, setResult]   = useState(null);

  function handleAnswer(idx) {
    const key = ['A','B','C','D'][idx];
    const next = [...answers, key];
    setAnswers(next);
    if (next.length >= QUIZ_QUESTIONS.length) {
      const counts = { A:0, B:0, C:0, D:0 };
      next.forEach(k => { counts[k]++; });
      setResult(Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0]);
    } else {
      setStep(s => s + 1);
    }
  }

  function reset() { setStep(-1); setAnswers([]); setResult(null); }

  function shareResult(t) {
    const text = `💕 나의 커플 스타일은 "${t.emoji} ${t.name}"\n\n${t.desc}\n\n나도 테스트해봐요! → https://couple.maumful.com`;
    navigator.share ? navigator.share({ title: '나의 커플 스타일', text }).catch(() => {})
                    : navigator.clipboard?.writeText(text).catch(() => {});
  }

  const curQ = QUIZ_QUESTIONS[step];
  const t    = result ? QUIZ_TYPES[result] : null;
  const prog = step >= 0 ? (step + 1) / QUIZ_QUESTIONS.length * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={result ? reset : step === -1 ? onBack : () => setStep(s => s-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>커플 스타일 퀴즈</span>
        </button>
        {step >= 0 && !result && <span style={{ fontSize:12, color:C.muted }}>{step+1}/{QUIZ_QUESTIONS.length}</span>}
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        {/* 인트로 */}
        {step === -1 && !result && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:72, marginBottom:16 }}>🎯</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:C.dark, marginBottom:10, fontFamily:"'Noto Serif KR', serif" }}>우리 커플 스타일은?</h2>
            <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28 }}>10문항으로 알아보는 나의 커플 스타일.<br/>파트너와 함께 해보고 비교해보세요! 무료예요.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:32 }}>
              {Object.values(QUIZ_TYPES).map(qt => (
                <div key={qt.name} style={{ padding:'8px 14px', borderRadius:100, background:'white', border:`1px solid ${C.roseL}33`, fontSize:12, color:C.dark }}>
                  {qt.emoji} {qt.name}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(0)} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color:'white', fontWeight:700, fontSize:15, fontFamily:"'Noto Sans KR', sans-serif", boxShadow:`0 8px 24px ${C.amber}44` }}>
              시작하기 →
            </button>
          </div>
        )}

        {/* 문항 */}
        {step >= 0 && !result && curQ && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ height:6, borderRadius:100, background:'#F0E0E8', overflow:'hidden', marginBottom:6 }}>
                <div style={{ height:'100%', borderRadius:100, width:`${prog}%`, background:`linear-gradient(90deg, ${C.amberL}, ${C.amber})`, transition:'width 0.4s ease' }}/>
              </div>
              <div style={{ fontSize:11, color:C.muted, textAlign:'right' }}>{step+1}/{QUIZ_QUESTIONS.length}</div>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:C.dark, lineHeight:1.6, marginBottom:24, textAlign:'center', fontFamily:"'Noto Serif KR', serif" }}>
              Q{step+1}. {curQ.q}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {curQ.opts.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)} style={{ padding:'14px 20px', borderRadius:14, border:`1.5px solid ${C.amberL}44`, background:'white', cursor:'pointer', textAlign:'left', fontSize:14, fontWeight:500, color:C.dark, fontFamily:"'Noto Sans KR', sans-serif" }}>
                  <span style={{ fontWeight:700, color:C.amber, marginRight:8 }}>{['A','B','C','D'][i]}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && t && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:72, marginBottom:12 }}>{t.emoji}</div>
            <div style={{ fontSize:12, color:C.amber, fontWeight:700, marginBottom:4 }}>나의 커플 스타일</div>
            <h2 style={{ fontSize:24, fontWeight:700, color:C.dark, marginBottom:20, fontFamily:"'Noto Serif KR', serif" }}>{t.name}</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24, textAlign:'left' }}>
              <div style={{ padding:'16px', borderRadius:16, background:'#FFFBF0', border:`1px solid ${C.amberL}44` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:6 }}>💡 나의 연애 스타일</div>
                <div style={{ fontSize:13, color:C.dark, lineHeight:1.7 }}>{t.desc}</div>
              </div>
              <div style={{ padding:'14px 16px', borderRadius:14, background:`linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`, border:`1px solid ${C.roseL}33` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.rose, marginBottom:4 }}>💌 파트너와의 성장 팁</div>
                <div style={{ fontSize:12, color:C.dark }}>{t.tip}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => shareResult(t)} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color:'white', fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>📤 결과 공유하기</button>
              <button onClick={reset} style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${C.amberL}44`, cursor:'pointer', background:'white', color:C.amber, fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>🔄 다시 해보기</button>
            </div>
            <button onClick={onBack} style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:12, border:'1px solid #E0D0D8', cursor:'pointer', background:'white', color:C.muted, fontSize:12, fontFamily:"'Noto Sans KR', sans-serif" }}>← 홈으로</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 감정 레이블 매핑 (마음게임 mood.jsx와 동일) ───────────
const MOOD_LABELS = {
  happy:   { emoji: '😊', label: '행복',  color: '#F5C842' },
  calm:    { emoji: '😌', label: '평온',  color: '#7BC4A0' },
  tired:   { emoji: '😴', label: '피곤',  color: '#9BB0C0' },
  anxious: { emoji: '😰', label: '불안',  color: '#F5A050' },
  sad:     { emoji: '😢', label: '슬픔',  color: '#6B9ACB' },
  angry:   { emoji: '😤', label: '화남',  color: '#E86C6C' },
};

// ── PartnerMomentsSection ─────────────────────────────────
function PartnerMomentsSection() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(true);

  useEffect(() => {
    api.get('/api/couple/partner-moments').then(res => {
      if (res.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !data?.hasPartner) return null;

  const { partnerName, moodEntries = [], gratEntries = [] } = data;
  if (moodEntries.length === 0 && gratEntries.length === 0) return null;

  function fmtTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  }

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💕</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
            {partnerName}님의 마음 일기
          </span>
        </div>
        <span style={{ fontSize: 18, color: C.muted }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>

          {/* 감정 타임라인 */}
          {moodEntries.length > 0 && (
            <div style={{ marginBottom: gratEntries.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 }}>
                🎨 최근 7일 감정
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {moodEntries.map((entry, i) => {
                  const em = MOOD_LABELS[entry.emotion] || { emoji: '💭', label: entry.emotion || '?', color: C.muted };
                  const stars = entry.intensity ? '⭐'.repeat(Math.min(5, entry.intensity)) : '';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 12,
                      background: '#FAF5FC', border: `1px solid ${em.color}22`,
                    }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{em.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: em.color }}>{em.label}</span>
                          {stars && <span style={{ fontSize: 11 }}>{stars}</span>}
                        </div>
                        {entry.note && (
                          <div style={{ fontSize: 12, color: C.dark, fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{entry.note}"
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>
                        {fmtTime(entry.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 감사 일기 */}
          {gratEntries.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 }}>
                ⭐ 최근 감사 일기
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gratEntries.map((entry, i) => {
                  const answers = entry.answers || {};
                  const answerTexts = Object.values(answers).filter(Boolean);
                  if (answerTexts.length === 0) return null;
                  return (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(255,224,138,0.06)', border: '1px solid rgba(255,224,138,0.3)',
                    }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{fmtTime(entry.created_at)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {answerTexts.slice(0, 2).map((text, j) => (
                          <div key={j} style={{ fontSize: 12, color: C.dark, lineHeight: 1.5 }}>
                            ✦ {text}
                          </div>
                        ))}
                        {answerTexts.length > 2 && (
                          <div style={{ fontSize: 11, color: C.muted }}>+{answerTexts.length - 2}개 더</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AnniversaryView ───────────────────────────────────────
const ANNIVERSARY_KEY = 'couple_first_date';

function AnniversaryView({ onBack }) {
  const [firstDate, setFirstDate] = useState(() => localStorage.getItem(ANNIVERSARY_KEY) || '');
  const [inputDate, setInputDate] = useState(firstDate);

  function saveDate() {
    localStorage.setItem(ANNIVERSARY_KEY, inputDate);
    setFirstDate(inputDate);
  }

  const milestones = firstDate ? (() => {
    const start = new Date(firstDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysTotal = Math.floor((today - start) / 86400000);
    const result = [];
    const marks = [100, 200, 300, 365, 500, 730, 1000, 1461, 1825, 2000, 3000, 3650];
    for (const m of marks) {
      const d = new Date(start.getTime() + m * 86400000);
      const diff = Math.floor((d - today) / 86400000);
      result.push({ label: m === 365 ? '1주년' : m === 730 ? '2주년' : m === 1461 ? '4주년' : m === 1825 ? '5주년' : m === 3650 ? '10주년' : `${m}일`, date: d, diff, isPast: diff < 0 });
    }
    return { daysTotal, milestones: result };
  })() : null;

  const nextMilestone = milestones?.milestones.find(m => m.diff >= 0);

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>기념일 계산기</span>
        </button>
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:56, marginBottom:10 }}>📅</div>
          <p style={{ fontSize:13, color:C.muted }}>처음 만난 날을 입력하면 D+N일과<br/>다가오는 기념일을 알려드려요.</p>
        </div>

        <div style={{ background:'white', borderRadius:20, padding:'20px', marginBottom:20, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:10 }}>💑 처음 만난 날</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              style={{ flex:1, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.roseL}44`, fontSize:14, outline:'none', fontFamily:"'Noto Sans KR', sans-serif", color:C.dark }}
            />
            <button onClick={saveDate} disabled={!inputDate} style={{ padding:'11px 20px', borderRadius:12, border:'none', cursor:inputDate?'pointer':'not-allowed', background:inputDate?C.rose:'#E0D0D8', color:'white', fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>
              저장
            </button>
          </div>
        </div>

        {milestones && (
          <>
            {/* D+N 히어로 */}
            <div style={{ background:`linear-gradient(135deg, ${C.rose}, ${C.lavender})`, borderRadius:20, padding:'28px 20px', marginBottom:20, textAlign:'center', boxShadow:`0 8px 32px ${C.rose}33` }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginBottom:6, letterSpacing:2 }}>우리가 함께한 날</div>
              <div style={{ fontSize:56, fontWeight:800, color:'white', lineHeight:1 }}>D+{milestones.daysTotal}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.9)', marginTop:8 }}>
                {new Date(firstDate).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })} 부터
              </div>
              {nextMilestone && (
                <div style={{ marginTop:16, padding:'10px 16px', borderRadius:12, background:'rgba(255,255,255,0.2)', fontSize:13, color:'white', fontWeight:600 }}>
                  다음 기념일: {nextMilestone.label} (D+{nextMilestone.diff}일 후)
                </div>
              )}
            </div>

            {/* 기념일 리스트 */}
            <div style={{ background:'white', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:14 }}>🎉 기념일 목록</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {milestones.milestones.map((m, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', borderRadius:12,
                    background: m.diff >= 0 && m.diff <= 30 ? C.rosePale : m.isPast ? '#F8F8F8' : 'white',
                    border: `1px solid ${m.diff >= 0 && m.diff <= 30 ? C.roseL + '44' : '#E8E8E8'}`,
                    opacity: m.isPast ? 0.5 : 1,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:18 }}>{m.isPast ? '✅' : m.diff <= 7 ? '🎊' : m.diff <= 30 ? '🔔' : '📅'}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{m.label}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{m.date.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color: m.isPast ? C.muted : m.diff <= 7 ? C.rose : C.muted }}>
                      {m.isPast ? '지남' : m.diff === 0 ? '오늘! 🎉' : `${m.diff}일 후`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── RelationshipTimelineView ──────────────────────────────
function RelationshipTimelineView({ onBack }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/couple/timeline', { headers: { 'Authorization': `Bearer ${localStorage.getItem('couple_token')}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = d => new Date(d).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
  const typeStyle = {
    report:  { bg:'#fdf2f8', border:'#f9a8d4', accent:C.rose,    label:'AI 리포트' },
    session: { bg:'#f0f9ff', border:'#bae6fd', accent:'#0ea5e9', label:'커플 검사' },
    checkin: { bg:'#f0fdf4', border:'#bbf7d0', accent:'#16a34a', label:'관계 체크인' },
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>관계 타임라인</span>
        </button>
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🗂️</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.dark, margin:'0 0 6px' }}>관계 타임라인</h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>우리의 관계 기록을 한눈에 볼 수 있어요</p>
        </div>

        {loading && <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>불러오는 중...</div>}

        {!loading && (!items || items.length === 0) && (
          <div style={{ background:'white', borderRadius:20, padding:28, textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
            <p style={{ fontSize:14, color:C.muted }}>아직 기록이 없어요.<br/>커플 검사나 관계 체크인을 시작해 보세요!</p>
          </div>
        )}

        {!loading && items && items.length > 0 && (
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:20, top:0, bottom:0, width:2, background:`linear-gradient(to bottom, ${C.rose}, transparent)`, borderRadius:2 }} />
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {items.map((item, i) => {
                const s = typeStyle[item.type] || typeStyle.session;
                return (
                  <div key={i} style={{ display:'flex', gap:16, paddingLeft:8 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:s.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, marginTop:12, zIndex:1, boxShadow:`0 0 0 3px ${s.bg}` }}>
                      {item.emoji}
                    </div>
                    <div style={{ flex:1, background:'white', borderRadius:16, padding:'14px 16px', border:`1px solid ${s.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:s.accent, background:s.bg, padding:'2px 8px', borderRadius:20 }}>{s.label}</span>
                        <span style={{ fontSize:11, color:C.muted }}>{fmtDate(item.date)}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:2 }}>{item.title}</div>
                      <div style={{ fontSize:13, color:C.muted }}>{item.subtitle}</div>
                      {item.score != null && item.type === 'report' && (
                        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ height:6, flex:1, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${item.score}%`, height:'100%', background:`linear-gradient(90deg,${C.rose},#f472b6)`, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:C.rose }}>{item.score}점</span>
                        </div>
                      )}
                      {item.score != null && item.type === 'checkin' && (
                        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ height:6, flex:1, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${Math.round(item.score/50*100)}%`, height:'100%', background:'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:'#16a34a' }}>{item.score}/50</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RelationshipCheckinView ───────────────────────────────
const CHECKIN_QUESTIONS = [
  "최근 파트너와 충분한 대화를 나누고 있다",
  "파트너가 나를 잘 이해해준다고 느낀다",
  "갈등이 생겼을 때 건강하게 해결할 수 있다",
  "파트너와 함께하는 시간이 충분하다",
  "서로의 미래를 함께 그릴 수 있다",
  "파트너에게 나의 감정을 솔직하게 말할 수 있다",
  "서로를 충분히 지지하고 응원한다고 느낀다",
  "파트너와의 관계가 내 삶에 긍정적인 영향을 준다",
  "파트너의 노력과 배려가 느껴진다",
  "전반적으로 우리 관계에 만족한다",
];

const SCORE_LABELS = ['매우 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];

function checkinScoreInfo(score, maxScore) {
  const pct = Math.round(score / maxScore * 100);
  if (pct >= 80) return { emoji: '💚', label: '매우 건강한 관계', color: '#4A9A5A', pale: '#EAF5EC' };
  if (pct >= 60) return { emoji: '💛', label: '좋은 관계 (성장 중)', color: '#C4954A', pale: '#FEF8EC' };
  if (pct >= 40) return { emoji: '🧡', label: '함께 노력이 필요해요', color: '#D4634A', pale: '#FEF0EC' };
  return { emoji: '❤️‍🩹', label: '더 많은 관심이 필요한 시기', color: C.rose, pale: C.rosePale };
}

function RelationshipCheckinView({ onBack, onDone }) {
  const [step, setStep]       = useState(-1); // -1=인트로, 0..9=문항, 10=완료
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState(null);
  const [doneThisMonth, setDoneThisMonth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/couple/checkins').then(res => {
      if (res.success) {
        setHistory(res.data.checkins);
        setDoneThisMonth(res.data.doneThisMonth);
      }
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/api/couple/checkin', { answers });
      if (res.success) {
        setResult(res.data);
        setStep(10);
        if (onDone) onDone();
      } else {
        setError(res.error || '저장 실패');
      }
    } catch { setError('서버 오류'); }
    finally { setSubmitting(false); }
  }

  const progress = step >= 0 && step < 10 ? (step / CHECKIN_QUESTIONS.length * 100) : 0;
  const curQ = CHECKIN_QUESTIONS[step];

  // 기록 뷰
  function HistorySection() {
    if (!history?.length) return null;
    const MAX = 10 * 5; // 50점 만점

    // SVG 트렌드 라인 차트 (시간순 정렬: 오래된 것이 왼쪽)
    const sorted = [...history].reverse(); // API는 최신순, 차트는 오래된→최신
    const W = 280, H = 80, PAD = 16;
    const plotW = W - PAD * 2, plotH = H - PAD * 2;
    const minScore = Math.min(...sorted.map(h => h.total_score));
    const maxScore = Math.max(...sorted.map(h => h.total_score), MAX * 0.4);
    const xStep = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW;

    const toX = i => PAD + (sorted.length > 1 ? i * xStep : plotW / 2);
    const toY = v => PAD + plotH - ((v - Math.max(0, minScore - 5)) / (maxScore - Math.max(0, minScore - 5) + 1)) * plotH;

    const points = sorted.map((h, i) => ({ x: toX(i), y: toY(h.total_score), score: h.total_score, date: h.created_at }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const latestInfo = checkinScoreInfo(history[0].total_score, MAX);

    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>📈 관계 건강도 트렌드</div>

        {/* 라인 차트 */}
        {sorted.length >= 2 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '16px',
            border: `1px solid ${C.rose}22`, marginBottom: 12,
          }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* 격자선 */}
              {[25, 50, 75, 100].map(pct => {
                const y = toY(MAX * pct / 100);
                return (
                  <g key={pct}>
                    <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#F0E8EC" strokeWidth="1"/>
                    <text x={PAD - 2} y={y + 3} textAnchor="end" fontSize="7" fill="#C0A0B0">{pct}</text>
                  </g>
                );
              })}
              {/* 채움 영역 */}
              <path
                d={`${pathD} L ${points[points.length-1].x} ${PAD+plotH} L ${points[0].x} ${PAD+plotH} Z`}
                fill={`${C.rose}18`} stroke="none"
              />
              {/* 라인 */}
              <path d={pathD} fill="none" stroke={C.rose} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* 점 + 날짜 레이블 */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={C.rose} strokeWidth="2"/>
                  <text x={p.x} y={H - 3} textAnchor="middle" fontSize="7" fill="#C0A0B0">
                    {new Date(p.date).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}
                  </text>
                </g>
              ))}
              {/* 최신 점수 강조 */}
              <text x={points[points.length-1].x} y={points[points.length-1].y - 7}
                textAnchor="middle" fontSize="9" fontWeight="bold" fill={C.rose}>
                {Math.round(points[points.length-1].score / MAX * 100)}점
              </text>
            </svg>
          </div>
        )}

        {/* 기록 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map((h, i) => {
            const info = checkinScoreInfo(h.total_score, MAX);
            const pct = Math.round(h.total_score / MAX * 100);
            return (
              <div key={h.id} style={{
                padding: '12px 14px', borderRadius: 12,
                background: i === 0 ? info.pale : '#F8F8F8',
                border: `1px solid ${i === 0 ? info.color + '33' : '#E8E8E8'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: info.color }}>
                    {info.emoji} {info.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(h.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 100, background: '#E8E0E4', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: info.color, transition: 'width 1s ease' }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: info.color, minWidth: 36 }}>{pct}점</span>
                </div>
              </div>
            );
          })}
        </div>
        {history.length >= 2 && (() => {
          const latestPct = Math.round(history[0].total_score / MAX * 100);
          const prevPct   = Math.round(history[1].total_score / MAX * 100);
          const diff = latestPct - prevPct;
          return (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 12,
              background: diff >= 0 ? '#EAF5EC' : '#FEF0EC',
              fontSize: 12, color: diff >= 0 ? '#4A9A5A' : '#D4634A', fontWeight: 600,
            }}>
              {diff >= 0 ? `📈 지난 달 대비 +${diff}점 향상됐어요! 🎉` : `📉 지난 달보다 ${Math.abs(diff)}점 낮아요. 함께 노력해봐요 💪`}
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={step === -1 || step === 10 ? onBack : () => setStep(s => s - 1)} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.dark,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>관계 성장 체크인</span></button>
        {step >= 0 && step < 10 && (
          <span style={{ fontSize: 12, color: C.muted }}>{step + 1} / {CHECKIN_QUESTIONS.length}</span>
        )}
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* 인트로 */}
        {step === -1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🌱</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
                이번 달 관계 성장 체크인
              </h2>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
                10가지 질문으로 지금 우리 관계의 건강도를 점검해보세요.<br/>
                매달 기록하면 성장 과정을 볼 수 있어요.
              </p>
            </div>

            {doneThisMonth ? (
              <div style={{
                padding: '16px', borderRadius: 14, background: '#EAF5EC',
                border: '1px solid #4A9A5A33', textAlign: 'center', marginBottom: 20,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4A9A5A' }}>이번 달 체크인 완료!</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>다음 체크인은 다음 달에 할 수 있어요.</div>
              </div>
            ) : (
              <button onClick={() => setStep(0)} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, #4A9A5A, #7ABAA8)`,
                color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16,
                fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: '0 8px 24px #4A9A5A44',
              }}>🌱 이번 달 체크인 시작하기</button>
            )}
            <HistorySection />
          </div>
        )}

        {/* 문항 */}
        {step >= 0 && step < 10 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ height: 6, borderRadius: 100, background: '#F0E0E8', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 100, width: `${progress}%`, background: 'linear-gradient(90deg, #7ABAA8, #4A9A5A)', transition: 'width 0.4s ease' }}/>
              </div>
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>{step + 1}/{CHECKIN_QUESTIONS.length}</div>
            </div>

            <div style={{
              fontSize: 17, fontWeight: 700, color: C.dark, lineHeight: 1.6,
              marginBottom: 28, textAlign: 'center', fontFamily: "'Noto Serif KR', serif",
            }}>
              Q{step + 1}. {curQ}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCORE_LABELS.map((label, idx) => {
                const val = idx + 1;
                const isSelected = answers[`q${step}`] === val;
                const colors = ['#E05C5C', '#E09A5C', '#D4B84A', '#7ABAA8', '#4A9A5A'];
                return (
                  <button key={val} onClick={() => {
                    setAnswers(prev => ({ ...prev, [`q${step}`]: val }));
                    if (step < CHECKIN_QUESTIONS.length - 1) {
                      setTimeout(() => setStep(s => s + 1), 200);
                    }
                  }} style={{
                    padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: isSelected ? colors[idx] + '22' : 'white',
                    border: `1.5px solid ${isSelected ? colors[idx] : '#E8D0D8'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 100,
                      background: isSelected ? colors[idx] : '#F0E0E8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: isSelected ? 'white' : C.muted,
                      flexShrink: 0,
                    }}>{val}</div>
                    <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? C.dark : C.muted }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {step === 9 && answers[`q${step}`] && (
              <button onClick={handleSubmit} disabled={submitting} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #4A9A5A, #7ABAA8)',
                color: 'white', fontWeight: 700, fontSize: 15, marginTop: 16,
                fontFamily: "'Noto Sans KR', sans-serif",
                opacity: submitting ? 0.7 : 1,
              }}>{submitting ? '저장 중...' : '✅ 체크인 완료하기'}</button>
            )}
            {error && <div style={{ fontSize: 12, color: '#D05555', textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* 결과 */}
        {step === 10 && result && (() => {
          const MAX = CHECKIN_QUESTIONS.length * 5;
          const info = checkinScoreInfo(result.totalScore, MAX);
          const pct = Math.round(result.totalScore / MAX * 100);
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 12, animation: 'heartbeat 1s ease-in-out 3' }}>{info.emoji}</div>
              <div style={{ fontSize: 12, color: info.color, fontWeight: 700, marginBottom: 4 }}>이번 달 관계 건강도</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: info.color, marginBottom: 4 }}>{pct}<span style={{ fontSize: 20 }}>점</span></div>
              <div style={{
                display: 'inline-block', marginBottom: 24,
                padding: '5px 16px', borderRadius: 100,
                background: info.color + '18', color: info.color, fontWeight: 700, fontSize: 13,
              }}>{info.label}</div>
              <div style={{ width: '80%', margin: '0 auto 24px', height: 10, borderRadius: 100, background: '#F0E0E8', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: info.color, transition: 'width 1.2s ease' }}/>
              </div>
              <div style={{
                padding: '16px', borderRadius: 16, marginBottom: 16,
                background: info.pale, border: `1px solid ${info.color}33`,
                fontSize: 13, color: C.dark, lineHeight: 1.7,
              }}>
                {pct >= 80 && '두 사람의 관계가 매우 건강하게 유지되고 있어요! 지금의 모습을 계속 이어가 보세요. 💕'}
                {pct >= 60 && pct < 80 && '전반적으로 좋은 관계를 유지하고 있어요. 조금 더 신경 쓰고 싶은 부분을 함께 이야기해보세요. 🌱'}
                {pct >= 40 && pct < 60 && '개선이 필요한 부분이 보여요. 파트너와 솔직하게 대화해보는 시간을 가져보세요. 💬'}
                {pct < 40 && '지금은 관계에 더 많은 관심이 필요한 시기예요. 전문 상담사와 함께 점검해보는 것도 좋아요. 💆'}
              </div>
              <button onClick={onBack} style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1px solid #E0D0D8', cursor: 'pointer',
                background: 'white', color: C.muted, fontSize: 12,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>← 홈으로 돌아가기</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── DateCourseView ────────────────────────────────────────
const DATE_REGIONS   = ['서울', '부산', '대구', '인천', '광주', '제주', '경기', '강원'];
const DATE_MOODS     = [
  { key: '🌹 로맨틱', desc: '분위기 있는 레스토랑, 야경, 와인' },
  { key: '⚡ 활동적', desc: '스포츠, 액티비티, 게임' },
  { key: '🌿 힐링', desc: '자연, 카페, 산책, 온천' },
  { key: '🎨 문화예술', desc: '전시, 공연, 영화, 미술관' },
];
const DATE_DURATIONS = ['반나절 (3~4시간)', '하루 (6~8시간)', '1박 2일'];
const DATE_BUDGETS   = ['알뜰 (5만원 이하)', '보통 (5~15만원)', '특별 (15만원 이상)'];

function DateCourseView({ credits, isMaster, onBack }) {
  const [region, setRegion]     = useState('');
  const [mood, setMood]         = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [course, setCourse]     = useState('');
  const [error, setError]       = useState('');
  const COST = 3;
  const canAfford = isMaster || (credits >= COST);
  const allSelected = region && mood && duration && budget;

  async function generate() {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/couple/date-course', { region, mood, duration, budget });
      if (res.success) {
        setCourse(res.data.course);
      } else if (res.needsCharge) {
        setError(`크레딧이 부족합니다. (필요: ${COST}cr)`);
      } else {
        setError(res.error || '생성 실패');
      }
    } catch { setError('서버 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }

  function shareCourse() {
    const text = `💕 오늘의 데이트 코스 추천 (${region}, ${mood})\n\n${course}\n\nhttps://couple.maumful.com`;
    navigator.share ? navigator.share({ title: '데이트 코스 추천', text }).catch(() => {})
                    : navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={course ? () => setCourse('') : onBack} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.dark,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>AI 데이트 코스 추천</span></button>
        {!isMaster && <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>{COST}cr</span>}
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
        {!course ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🗺️</div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
                조건을 선택하면 AI가 딱 맞는<br/>데이트 코스를 추천해드려요!
              </p>
            </div>

            {/* 지역 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>📍 어디서?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DATE_REGIONS.map(r => (
                  <button key={r} onClick={() => setRegion(r)} style={{
                    padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    background: region === r ? C.rose : '#F5EFE0',
                    color: region === r ? 'white' : C.dark,
                    fontWeight: region === r ? 700 : 500, fontSize: 13,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* 분위기 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>✨ 어떤 분위기?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DATE_MOODS.map(m => (
                  <button key={m.key} onClick={() => setMood(m.key)} style={{
                    padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: mood === m.key ? C.rosePale : 'white',
                    border: `1.5px solid ${mood === m.key ? C.roseL : '#E8D8E0'}`,
                    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    <span style={{ fontSize: 22 }}>{m.key.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{m.key.split(' ')[1]}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 시간 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>⏰ 얼마나?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DATE_DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    padding: '11px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: duration === d ? C.lavPale : 'white',
                    border: `1.5px solid ${duration === d ? C.lavL : '#E8D8E0'}`,
                    fontSize: 13, fontWeight: duration === d ? 700 : 500, color: C.dark,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    textAlign: 'left',
                  }}>{d}</button>
                ))}
              </div>
            </div>

            {/* 예산 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>💰 예산은?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DATE_BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: budget === b ? C.lavPale : 'white',
                    border: `1.5px solid ${budget === b ? C.lavL : '#E8D8E0'}`,
                    fontSize: 11, fontWeight: budget === b ? 700 : 500, color: C.dark,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    lineHeight: 1.4, textAlign: 'center',
                  }}>{b}</button>
                ))}
              </div>
            </div>

            {!canAfford && (
              <div style={{ padding: '12px', borderRadius: 12, background: '#FFF0F0', border: '1px solid #FFD0D0', fontSize: 12, color: '#D05555', marginBottom: 12 }}>
                💸 크레딧이 부족합니다. (필요: {COST}cr / 보유: {credits}cr)
              </div>
            )}

            <button
              onClick={generate}
              disabled={!allSelected || !canAfford || loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                cursor: allSelected && canAfford ? 'pointer' : 'not-allowed',
                background: allSelected && canAfford
                  ? `linear-gradient(135deg, ${C.rose}, ${C.lavender})`
                  : '#E0D0D8',
                color: 'white', fontWeight: 700, fontSize: 15,
                fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: allSelected && canAfford ? `0 8px 24px ${C.rose}33` : 'none',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '🗺️ AI가 코스 만드는 중...' : `🗺️ 데이트 코스 추천받기 ${isMaster ? '(무료)' : `(${COST}cr)`}`}
            </button>
            {error && <div style={{ fontSize: 12, color: '#D05555', textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                {region} · {mood.split(' ')[1]} · {duration.split(' ')[0]}
              </div>
            </div>
            <div style={{
              background: 'white', borderRadius: 20, padding: '24px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 2.1, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                {course}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={shareCourse} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                color: 'white', fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>📤 파트너와 공유</button>
              <button onClick={() => setCourse('')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.roseL}44`, cursor: 'pointer',
                background: 'white', color: C.rose, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>🔄 다시 추천받기</button>
            </div>
            <button onClick={onBack} style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
              border: '1px solid #E0D0D8', cursor: 'pointer',
              background: 'white', color: C.muted, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>← 홈으로</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SoloAnalysisView ──────────────────────────────────────
function SoloAnalysisView({ testResults, userName, credits, isMaster, onBack }) {
  const [report, setReport]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const COST = 5;
  const canAfford = isMaster || (credits >= COST);
  const hasData = !!(testResults?.big5 || testResults?.lost || testResults?.dsi);

  async function generateSoloReport() {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/couple/solo-analysis', {});
      if (res.success) {
        setReport(res.data.report);
      } else {
        setError(res.error || '분석 생성 실패');
      }
    } catch { setError('서버 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }

  function shareReport() {
    const text = `💕 마음커플 — 나의 연애 성향 분석\n\n${report.slice(0, 200)}...\n\nhttps://couple.maumful.com`;
    navigator.share ? navigator.share({ title: '나의 연애 성향 분석', text }).catch(() => {})
                    : navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.dark,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>이상형 성향 분석</span></button>
        {!isMaster && (
          <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>
            {COST}cr
          </span>
        )}
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 60px' }}>
        {!report ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔮</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" }}>
              나의 이상형 성향 분석
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 28 }}>
              내 심리검사 결과를 바탕으로 AI가 분석하는<br/>
              나의 연애 강점, 잘 맞는 파트너 유형, 성장 포인트
            </p>

            {!hasData && (
              <div style={{
                padding: '16px', borderRadius: 14, background: '#FFF8F0',
                border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040', marginBottom: 24, textAlign: 'left',
              }}>
                💡 마음풀에서 BIG5, LOST, SDRI 검사를 하나 이상 완료해야 이용할 수 있어요.
              </div>
            )}

            {hasData && !canAfford && (
              <div style={{
                padding: '14px', borderRadius: 14, background: '#FFF0F0',
                border: '1px solid #FFD0D0', fontSize: 13, color: '#D05555', marginBottom: 24, textAlign: 'left',
              }}>
                💸 크레딧이 부족합니다. (필요: {COST}cr / 보유: {credits}cr)
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 28 }}>
              {[
                { emoji: '💪', title: '나의 연애 강점', desc: '내가 관계에서 잘하는 것과 매력 포인트' },
                { emoji: '💑', title: '잘 맞는 파트너 유형', desc: '나와 궁합이 좋은 성격·행동 유형' },
                { emoji: '🌱', title: '함께 성장할 포인트', desc: '더 좋은 관계를 위한 개인 성장 방향' },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex', gap: 12, padding: '14px', borderRadius: 14,
                  background: 'white', border: '1px solid #F0E0E8',
                }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={generateSoloReport}
              disabled={!hasData || !canAfford || loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: hasData && canAfford ? 'pointer' : 'not-allowed',
                background: hasData && canAfford
                  ? `linear-gradient(135deg, ${C.lavender}, ${C.lavL})`
                  : '#E0D0D8',
                color: 'white', fontWeight: 700, fontSize: 15,
                fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: hasData && canAfford ? `0 8px 24px ${C.lavender}44` : 'none',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '🔮 AI가 분석 중...' : `🔮 분석 시작하기 ${isMaster ? '(무료)' : `(${COST}cr)`}`}
            </button>

            {error && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#D05555', textAlign: 'center' }}>{error}</div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔮</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
                {userName}님의 연애 성향 분석
              </h2>
            </div>
            <div style={{
              background: 'white', borderRadius: 20, padding: '24px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 2, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                {report}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={shareReport} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.lavender}, ${C.lavL})`,
                color: 'white', fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>📤 결과 공유하기</button>
              <button onClick={onBack} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.lavL}44`, cursor: 'pointer',
                background: 'white', color: C.lavender, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>← 홈으로</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ScoreGauge ────────────────────────────────────────────
function ScoreGauge({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{ textAlign: 'center', margin: '16px 0' }}>
      <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>/ 100점</div>
      <div style={{
        display: 'inline-block', marginTop: 8,
        padding: '5px 16px', borderRadius: 100,
        background: color + '18', color, fontWeight: 700, fontSize: 13,
      }}>{scoreLabel(score)}</div>
      {/* 게이지 바 */}
      <div style={{
        margin: '12px auto 0', width: '80%', maxWidth: 260,
        height: 8, borderRadius: 100, background: '#F0E0E8', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 100,
          width: `${score}%`,
          background: `linear-gradient(90deg, ${C.roseL}, ${color})`,
          transition: 'width 1.2s ease',
        }}/>
      </div>
    </div>
  );
}

// ── CodeInput ─────────────────────────────────────────────
function CodeInput({ onJoin, loading }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { setError('6자리 코드를 입력해주세요.'); return; }
    setError('');
    const result = await onJoin(c);
    if (!result.success) setError(result.error || '참여 실패');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="6자리 코드 입력"
          maxLength={6}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 18,
            border: `2px solid ${error ? '#E05555' : '#E8D0D8'}`,
            fontFamily: "'Noto Sans KR', monospace", letterSpacing: 4,
            textAlign: 'center', fontWeight: 700, color: C.dark,
            outline: 'none', background: 'white',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: code.length === 6 ? `linear-gradient(135deg, ${C.lavender}, ${C.lavL})` : '#E0E0E0',
            color: 'white', fontWeight: 700, fontSize: 14,
            fontFamily: "'Noto Sans KR', sans-serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : '참여'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#E05555', textAlign: 'center' }}>{error}</div>}
    </div>
  );
}

// ── CoupleReportView ──────────────────────────────────────
function CoupleReportView({ session, myRole, partnerName, userName, onBack }) {
  const [report, setReport]     = useState(session?.ai_report_text || '');
  const [score, setScore]       = useState(session?.compatibility_score || 0);
  const [generating, setGen]    = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!report && session?.status === 'both_done') {
      generateReport();
    }
  }, []);

  async function generateReport() {
    setGen(true); setError('');
    try {
      const res = await api.post('/api/couple/report', { session_code: session.session_code });
      if (res.success) {
        setReport(res.data.report);
        setScore(res.data.compatibility_score);
      } else {
        setError(res.error || '리포트 생성 실패');
      }
    } catch { setError('서버 오류가 발생했습니다.'); }
    finally { setGen(false); }
  }

  // BUG-23 FIX: JSON.parse 예외 처리
  const hasDsi = (() => {
    try { return !!(session?.host_result_json && JSON.parse(session.host_result_json || '{}').dsi); }
    catch { return false; }
  })();
  const testLabel = session?.test_type || 'BIG5+LOST+DSI';
  const hostLabel  = myRole === 'host' ? `${userName} (나)` : partnerName;
  const guestLabel = myRole === 'guest' ? `${userName} (나)` : partnerName;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      {/* 헤더 */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
          color: C.dark, display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>결과</span></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
          💕 커플 분석 리포트 {hasDsi && <span style={{ fontSize: 11, background:'#5A8A7A', color:'white', borderRadius:6, padding:'2px 7px', fontWeight:700, marginLeft:4 }}>자아분화 포함</span>}
        </span>
        <div style={{ width: 60 }}/>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* 히어로 */}
        <div style={{
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          marginBottom: 20, background: 'white',
        }}>
          <div style={{ height: 200, position: 'relative' }}>
            <HeartIllust score={score}/>
            <div style={{
              position: 'absolute', bottom: 12, left: 16,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
              padding: '5px 14px', borderRadius: 100,
              fontSize: 12, fontWeight: 600, color: C.dark,
            }}>
              {hostLabel} 💕 {guestLabel}
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {generating ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, animation: 'heartbeat 1s infinite' }}>💕</div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>
                  AI가 두 사람의 궁합을 분석하는 중...
                </div>
              </div>
            ) : score > 0 ? (
              <ScoreGauge score={score}/>
            ) : null}
          </div>
        </div>

        {/* 리포트 본문 */}
        {error && (
          <div style={{
            padding: 16, borderRadius: 12, background: '#FFF0F0',
            border: '1px solid #FFD0D0', color: '#D05555', fontSize: 14, marginBottom: 16,
          }}>{error}</div>
        )}

        {report ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '24px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              fontSize: 13, color: C.dark, lineHeight: 2,
              whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
            }}>{report}</div>
          </div>
        ) : !generating && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <button onClick={generateReport} style={{
              padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
              color: 'white', fontWeight: 700, fontSize: 15,
              fontFamily: "'Noto Sans KR', sans-serif",
              boxShadow: `0 8px 24px ${C.rose}44`,
            }}>
              💕 커플 리포트 생성하기
            </button>
          </div>
        )}

        {/* 마음풀 상담 연결 */}
        {report && (
          <div style={{ marginTop: 20 }}>
            {/* 리포트 공유 */}
            <div style={{
              padding: '16px 20px', borderRadius: 16, marginBottom: 12,
              background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: `1px solid ${C.roseL}22`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>
                📤 리포트 공유하기
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  const text = `💕 마음커플 분석 결과\n\n궁합 점수: ${score}점 (${scoreLabel(score)})\n\n${report.slice(0, 200)}...\n\nhttps://couple.maumful.com`;
                  navigator.share ? navigator.share({ title: '마음커플 분석 결과', text }) : navigator.clipboard?.writeText(text);
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.roseL}44`,
                  background: C.rosePale, color: C.rose, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  📋 결과 복사
                </button>
                <button onClick={() => {
                  const el = document.createElement('a');
                  el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`마음커플 분석 리포트\n궁합: ${score}점\n\n${report}`);
                  el.download = `couple_report_${new Date().toISOString().slice(0,10)}.txt`;
                  el.click();
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.lavL}44`,
                  background: C.lavPale, color: C.lavender, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  💾 텍스트 저장
                </button>
              </div>
            </div>

            {/* 전문 상담사 연결 */}
            <div style={{
              padding: '20px', borderRadius: 16,
              background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
              border: `1px solid ${C.roseL}33`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
                💬 전문 상담사와 더 깊이 나눠보세요
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>
                AI 분석 결과를 바탕으로 커플·부부 전문 상담사와 1:1 심층 상담을 받아보세요.
                자아분화 향상 프로그램, Bowen 가족치료 기법 등 전문적인 지원을 받을 수 있습니다.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={`${MAUMFUL_URL}/#counseling?type=couple&score=${score}`} style={{
                  display: 'block', padding: '12px 20px', textAlign: 'center',
                  background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                  color: 'white', borderRadius: 12,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  boxShadow: `0 6px 20px ${C.rose}44`,
                }}>
                  커플 전문 상담사 예약하기 →
                </a>
                {hasDsi && (
                  <a href={`${MAUMFUL_URL}/#counseling?type=bowen&score=${score}`} style={{
                    display: 'block', padding: '10px 20px', textAlign: 'center',
                    background: 'white', border: '1.5px solid #5A8A7A44',
                    color: '#5A8A7A', borderRadius: 12,
                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    🪞 자아분화 전문 상담사 예약하기 →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SessionWaitingView ────────────────────────────────────
function SessionWaitingView({ session, myRole, onRefresh, onReport, onCancel }) {
  const [polling, setPolling]         = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [notifyBanner, setNotifyBanner] = useState(null);
  const [emailInput, setEmailInput]   = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null); // 'ok' | 'err'
  const code = session?.session_code || '';

  // 이 변수들을 폴링보다 먼저 선언해야 TDZ 문제가 없음
  const isHostDone = !!session?.host_result_json;
  const isGuestDone = !!session?.guest_result_json;
  const bothDone   = session?.status === 'both_done' || (isHostDone && isGuestDone);

  const prevRef = React.useRef({ isHostDone: false, isGuestDone: false, bothDone: false });

  const [pushActive, setPushActive] = useState(false);

  // Web Push 구독 (파트너 참여 시 백그라운드 알림)
  useEffect(() => {
    if (myRole !== 'host' || bothDone) return;
    (async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const perm = Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission;
        if (perm !== 'granted') return;

        const vapidRes = await fetch('/api/couple/vapid-key', { headers: api._h() });
        const { key } = await vapidRes.json();
        if (!key) return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0)),
        });

        const { endpoint, keys } = sub.toJSON();
        await fetch('/api/couple/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...api._h() },
          body: JSON.stringify({ endpoint, p256dh: keys?.p256dh, auth: keys?.auth }),
        });
        setPushActive(true);
      } catch {}
    })();
  }, [myRole, bothDone]);

  // 브라우저 알림 권한 요청 (최초 1회)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 상태 변경 감지 → 브라우저 알림 + 배너
  useEffect(() => {
    const prev = prevRef.current;
    if (!prev.bothDone && bothDone) {
      fireBrowserNotif('💕 두 분 모두 준비 완료!', '커플 리포트를 생성할 수 있어요.');
      setNotifyBanner('🎉 파트너도 검사를 완료했어요! 아래에서 리포트를 생성해보세요.');
    } else if (!prev.isGuestDone && isGuestDone && myRole === 'host') {
      fireBrowserNotif('💕 파트너가 참여했어요!', '파트너가 검사를 완료했습니다.');
      setNotifyBanner('💕 파트너가 검사를 완료했어요!');
    } else if (!prev.isHostDone && isHostDone && myRole === 'guest') {
      fireBrowserNotif('💕 파트너가 검사를 완료했어요!', '이제 리포트를 생성할 수 있어요.');
      setNotifyBanner('💕 파트너가 검사를 완료했어요!');
    }
    prevRef.current = { isHostDone, isGuestDone, bothDone };
  }, [isHostDone, isGuestDone, bothDone]);

  function fireBrowserNotif(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '/favicon.ico' }); } catch {}
    }
  }

  async function sendInviteEmail() {
    if (!emailInput || emailSending) return;
    setEmailSending(true); setEmailResult(null);
    try {
      const res = await api.post('/api/couple/invite-email', { email: emailInput, session_code: code });
      setEmailResult(res.success ? 'ok' : 'err');
      if (res.success) setEmailInput('');
    } catch { setEmailResult('err'); }
    finally { setEmailSending(false); }
  }

  function copyCode() {
    const msg = `마음커플 초대코드: ${code}\n함께 심리 분석해봐요 💕\nhttps://couple.maumful.com/?code=${code}`;
    navigator.clipboard?.writeText(msg).catch(() => {});
  }

  function copyPartnerLink() {
    const base = window.location.hostname.includes('workers.dev') || window.location.hostname.includes('-dev.')
      ? 'https://maumful-dev.limyj007.workers.dev'
      : 'https://maumful.com';
    navigator.clipboard?.writeText(`${base}?partner=${code}`).catch(() => {});
  }

  // 폴링: 참여 완료 전 30초, 참여 후 both_done 되기 전까지 10초, both_done 이후 30초
  const pollInterval = (isHostDone || isGuestDone) && !bothDone ? 10000 : 30000;
  useEffect(() => {
    const timer = setInterval(async () => {
      setPolling(true);
      await onRefresh();
      setLastChecked(new Date());
      setPolling(false);
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval]);

  // 수동 새로고침
  async function handleManualRefresh() {
    if (polling) return;
    setPolling(true);
    await onRefresh();
    setLastChecked(new Date());
    setPolling(false);
  }

  // 세션 만료 체크
  const isExpired = session?.expires_at && new Date(session.expires_at) < new Date();
  if (isExpired) {
    return (
      <div style={{
        background: 'white', borderRadius: 20, padding: '32px 20px', textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>세션이 만료되었습니다</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>72시간이 지나 세션이 만료되었습니다. 새 세션을 만들어 다시 시작해보세요.</div>
      </div>
    );
  }

  const lastCheckedText = lastChecked
    ? `${lastChecked.getHours().toString().padStart(2,'0')}:${lastChecked.getMinutes().toString().padStart(2,'0')}:${lastChecked.getSeconds().toString().padStart(2,'0')} 확인됨`
    : '';

  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20,
    }}>
      <div style={{ height: 180 }}>
        {bothDone ? <HeartIllust score={75}/> : <WaitingIllust/>}
      </div>

      {/* 상태 변경 배너 */}
      {notifyBanner && (
        <div style={{
          background: `linear-gradient(135deg, ${C.rose}22, ${C.roseL}33)`,
          borderBottom: `1px solid ${C.rose}33`,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 13, color: C.rose, fontWeight: 600 }}>{notifyBanner}</div>
          <button onClick={() => setNotifyBanner(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: C.muted, padding: '0 4px',
          }}>×</button>
        </div>
      )}

      <div style={{ padding: '20px 20px 24px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
          {bothDone ? '🎉 두 사람 모두 준비 완료!' : '파트너를 기다리는 중'}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          {bothDone
            ? '이제 커플 분석 리포트를 생성할 수 있습니다.'
            : '파트너 링크를 공유하세요. 파트너는 로그인 없이 바로 검사에 참여할 수 있어요.'}
        </div>

        {/* 진행 상태 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { label: myRole === 'host' ? '나 (host)' : '파트너 A', done: isHostDone },
            { label: myRole === 'guest' ? '나 (guest)' : '파트너 B', done: isGuestDone },
          ].map(({ label, done }, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
              background: done ? C.rosePale : '#F5F5F5',
              border: `1px solid ${done ? C.roseL + '44' : '#E0E0E0'}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: 18 }}>{done ? '✅' : '⏳'}</div>
              <div style={{ fontSize: 11, color: done ? C.rose : C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 초대코드 */}
        {!bothDone && (
          <div style={{
            background: C.rosePale, borderRadius: 14, padding: '16px',
            border: `1px solid ${C.roseL}33`, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: C.muted }}>파트너에게 공유할 초대코드</div>
              {myRole === 'host' && pushActive && (
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600, background: '#D1FAE5', padding: '2px 8px', borderRadius: 100 }}>
                  🔔 알림 켜짐
                </span>
              )}
            </div>
            <div style={{
              fontSize: 32, fontWeight: 800, letterSpacing: 8,
              color: C.rose, fontFamily: 'monospace', textAlign: 'center', marginBottom: 12,
            }}>{code}</div>
            <button onClick={copyPartnerLink} style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: C.rose, color: 'white', fontWeight: 700, fontSize: 13,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              🔗 파트너 검사 링크 복사 (로그인 불필요)
            </button>
            <button onClick={copyCode} style={{
              width: '100%', padding: '8px', borderRadius: 10, marginTop: 8,
              border: `1px solid ${C.rose}44`, cursor: 'pointer',
              background: 'white', color: C.rose, fontWeight: 600, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              📋 마음커플 코드 복사 (계정 있는 파트너)
            </button>

            {/* 이메일로 초대 */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.rose}22`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>또는 이메일로 직접 초대</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && sendInviteEmail()}
                  placeholder="파트너 이메일 주소"
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.rose}44`,
                    fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: 'none',
                    background: 'white',
                  }}
                />
                <button onClick={sendInviteEmail} disabled={!emailInput || emailSending} style={{
                  padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: (!emailInput || emailSending) ? '#E0D0D0' : C.rose,
                  color: 'white', fontWeight: 700, fontSize: 12, cursor: (!emailInput || emailSending) ? 'not-allowed' : 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: 'nowrap',
                }}>
                  {emailSending ? '...' : '📨 전송'}
                </button>
              </div>
              {emailResult === 'ok' && (
                <div style={{ fontSize: 11, color: '#4A9A5A', marginTop: 5, fontWeight: 600 }}>✓ 초대 이메일을 발송했어요!</div>
              )}
              {emailResult === 'err' && (
                <div style={{ fontSize: 11, color: '#D4634A', marginTop: 5 }}>이메일 발송에 실패했습니다. 다시 시도해주세요.</div>
              )}
            </div>
          </div>
        )}

        {/* 폴링 상태 + 수동 새로고침 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {polling ? (
              <>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: C.rose,
                  animation: 'pulse 1s infinite',
                }}/>
                <span style={{ fontSize: 11, color: C.rose }}>파트너 상태 확인 중...</span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: C.muted }}>{lastCheckedText}</span>
            )}
          </div>
          <button onClick={handleManualRefresh} disabled={polling} style={{
            padding: '4px 10px', borderRadius: 8,
            border: `1px solid ${C.roseL}44`, background: 'white',
            color: polling ? C.muted : C.rose, fontSize: 11, fontWeight: 600,
            cursor: polling ? 'not-allowed' : 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            {polling ? '...' : '↻ 지금 확인'}
          </button>
        </div>

        {/* 만료 시간 */}
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 12 }}>
          ⏰ 세션 만료: {fmtDate(session?.expires_at)}
        </div>

        {/* host만 취소 가능 */}
        {myRole === 'host' && !bothDone && (
          <button onClick={onCancel} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: `1px solid #E0D0D0`,
            background: 'white', color: '#A07070', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', marginBottom: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            세션 취소하기
          </button>
        )}

        {/* 리포트 생성 버튼 */}
        {bothDone && (
          <button onClick={onReport} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
            color: 'white', fontWeight: 700, fontSize: 15,
            fontFamily: "'Noto Sans KR', sans-serif",
            boxShadow: `0 8px 24px ${C.rose}44`,
          }}>
            💕 커플 리포트 보기
          </button>
        )}
      </div>
    </div>
  );
}

// ── CoupleHubApp ──────────────────────────────────────────
function CoupleHubApp() {
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('hub');  // 'hub' | 'report' | 'miniTest' | 'soloAnalysis' | 'checkin' | 'dateCourse'
  const [sessionData, setSession] = useState(null);
  const [partnerName, setPartner] = useState('파트너');
  const [myRole, setMyRole]       = useState('host');
  const [creating, setCreating]   = useState(false);
  const [joining, setJoining]     = useState(false);
  const [creditModal, setCredit]  = useState(null);
  const [toast, setToast]         = useState('');

  const isLoggedIn = !!localStorage.getItem(TOKEN_KEY);

  // 초기 데이터 로드
  const loadMe = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const res = await api.get('/api/couple/me');
      if (res.success) {
        setData(res.data);
        // 활성 세션 있으면 자동 세팅
        if (res.data.activeSession) {
          setSession(res.data.activeSession);
          setMyRole(res.data.activeSession.host_user_id === res.data.user.id ? 'host' : 'guest');
        }
      } else setError(res.error || '데이터 조회 실패');
    } catch { setError('서버 연결 실패'); }
    finally { setLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { loadMe(); }, []);

  // URL 코드 파라미터 자동 처리
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && isLoggedIn) {
      // BUG-4 FIX: URL cleanup을 setTimeout 안으로 이동 (handleJoin 실행과 동시에)
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.toString());
        handleJoin(codeParam);
      }, 800);
    }
  }, []);

  // BUG-5 FIX: useRef로 toast timeout 관리하여 cleanup
  const toastTimerRef = React.useRef(null);
  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  }

  // 세션 생성
  async function handleCreateSession(testType = 'BIG5+LOST') {
    setCreating(true);
    try {
      const res = await api.post('/api/couple/session', { test_type: testType });
      if (res.success) {
        setSession(res.data.session);
        setMyRole('host');
        setCredit(null);
        showToast(res.data.isExisting ? '기존 세션을 불러왔습니다.' : '세션이 생성되었습니다!');
        if (!res.data.isExisting) refreshCredits(); // 크레딧 차감 즉시 반영
      } else if (res.needsCharge) {
        setCredit({ message: res.error, balance: data?.user?.credits });
      } else {
        showToast(res.error || '생성 실패');
      }
    } catch { showToast('서버 오류'); }
    finally { setCreating(false); }
  }

  // 코드로 참여
  async function handleJoin(code) {
    setJoining(true);
    try {
      const res = await api.post('/api/couple/join', { code });
      if (res.success) {
        setSession(res.data.session);
        setMyRole('guest');
        showToast('세션에 참여했습니다! 💕');
        // 파트너 이름 조회
        const s = await api.get(`/api/couple/session/${res.data.session.session_code}`);
        if (s.success) setPartner(s.data.partnerName);
      } else {
        return { success: false, error: res.error };
      }
    } catch { return { success: false, error: '서버 오류' }; }
    finally { setJoining(false); }
    return { success: true };
  }

  // 세션 갱신
  async function refreshSession() {
    if (!sessionData?.session_code) return;
    const res = await api.get(`/api/couple/session/${sessionData.session_code}`);
    if (res.success) {
      setSession(res.data.session);
      setPartner(res.data.partnerName);
    }
  }

  // 세션 취소
  async function handleCancelSession() {
    if (!sessionData?.session_code) return;
    if (!window.confirm('세션을 취소하시겠습니까? 크레딧은 환불되지 않습니다.')) return;
    try {
      const res = await api.patch(`/api/couple/session/${sessionData.session_code}/cancel`);
      if (res.success) {
        setSession(null);
        showToast('세션이 취소되었습니다.');
        // 크레딧 갱신
        const cr = await api.get('/api/couple/credits');
        if (cr.success) setData(prev => prev ? { ...prev, user: { ...prev.user, credits: cr.data.balance } } : prev);
      } else {
        showToast(res.error || '취소 실패');
      }
    } catch { showToast('서버 오류'); }
  }

  // 크레딧 갱신
  async function refreshCredits() {
    try {
      const res = await api.get('/api/couple/credits');
      if (res.success) setData(prev => prev ? { ...prev, user: { ...prev.user, credits: res.data.balance } } : prev);
    } catch {}
  }

  if (!isLoggedIn) return <LoginGate />;

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})`,
    }}>
      <div style={{ fontSize: 56, animation: 'heartbeat 1.5s ease-in-out infinite' }}>💕</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 16, animation: 'pulse 1.5s infinite' }}>
        마음커플을 불러오는 중...
      </div>
    </div>
  );

  // 미니 연애 유형 테스트
  if (view === 'miniTest') {
    return <MiniLoveTestView onBack={() => setView('hub')} />;
  }

  // 관계 성장 체크인
  if (view === 'checkin') {
    return (
      <RelationshipCheckinView
        onBack={() => setView('hub')}
        onDone={() => loadMe()}
      />
    );
  }

  // AI 데이트 코스 추천
  if (view === 'dateCourse') {
    return (
      <DateCourseView
        credits={data?.user?.credits ?? 0}
        isMaster={data?.isMaster}
        onBack={() => setView('hub')}
      />
    );
  }

  // 솔로 이상형 분석
  if (view === 'soloAnalysis') {
    return (
      <SoloAnalysisView
        testResults={data?.testResults}
        userName={displayName(data?.user)}
        credits={data?.user?.credits ?? 0}
        isMaster={data?.isMaster}
        onBack={() => setView('hub')}
      />
    );
  }

  // AI 관계 코치
  if (view === 'coach') {
    return (
      <RelationshipCoachView
        userName={displayName(data?.user)}
        credits={data?.user?.credits ?? 0}
        isMaster={data?.isMaster}
        onBack={() => setView('hub')}
      />
    );
  }

  // 커플 스타일 퀴즈
  if (view === 'quiz') {
    return <CoupleQuizView onBack={() => setView('hub')} />;
  }

  // 기념일 계산기
  if (view === 'anniversary') {
    return <AnniversaryView onBack={() => setView('hub')} />;
  }

  // 관계 타임라인
  if (view === 'timeline') {
    return <RelationshipTimelineView onBack={() => setView('hub')} />;
  }

  // 리포트 뷰
  if (view === 'report' && sessionData) {
    return (
      <CoupleReportView
        session={sessionData}
        myRole={myRole}
        partnerName={partnerName}
        userName={displayName(data?.user)}
        onBack={() => setView('hub')}
      />
    );
  }

  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.cream, padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🌧️</div>
      <div style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>{error}</div>
      <a href={MAUMFUL_URL} style={{
        padding: '10px 24px', background: C.rose, color: 'white',
        borderRadius: 10, fontSize: 14, fontWeight: 600,
        textDecoration: 'none', fontFamily: "'Noto Sans KR', sans-serif",
      }}>마음풀로 돌아가기</a>
    </div>
  );

  const { user, testResults, recentReports, isMaster } = data || {};
  const hasActive = !!sessionData;
  const hasBig5   = !!testResults?.big5;
  const hasLost   = !!testResults?.lost;
  const hasDsiTest = !!testResults?.dsi;
  const hasAny    = hasBig5 || hasLost || hasDsiTest; // BUG-7 FIX: DSI 포함

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` }}>

      {/* ── 네비게이션 ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💕</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
            마음커플
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: C.rose,
            background: C.rosePale, padding: '4px 12px', borderRadius: 100,
            border: `1px solid ${C.roseL}44`,
          }}>
            ✦ {user?.credits ?? 0} 크레딧
          </div>
          <a href={MAUMFUL_URL} style={{
            fontSize: 12, color: C.muted, textDecoration: 'none',
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.6)',
          }}>← 마음풀</a>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── 인사 카드 ── */}
        {(() => {
          const myBig5Data = testResults?.big5?.data;
          const myPersonality = getPersonalityLabel(myBig5Data);
          return (
            <div style={{
              borderRadius: 20, padding: '20px', marginBottom: 20,
              background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
                  안녕하세요, {displayName(user)}님 👋
                  {isMaster && <span style={{ fontSize: 11, background: C.rose, color: 'white', borderRadius: 6, padding: '2px 8px', fontWeight: 700, marginLeft: 6 }}>MASTER</span>}
                </div>
                {myPersonality && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px',
                    borderRadius: 100, background: C.rosePale, color: C.rose,
                    border: `1px solid ${C.roseL}44`, whiteSpace: 'nowrap',
                  }}>
                    {myPersonality.emoji} {myPersonality.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
                심리검사 결과로 파트너와의 관계 패턴을 함께 탐색해보세요.
              </div>
              {/* 빠른 액션 버튼 — 2×2 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setView('miniTest')} style={{
                  padding: '10px 8px', borderRadius: 12, border: `1px solid ${C.roseL}33`, cursor: 'pointer',
                  background: C.rosePale, color: C.rose, fontWeight: 700, fontSize: 12,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>💝 연애 유형 테스트<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>무료</span></button>
                <button onClick={() => setView('dateCourse')} style={{
                  padding: '10px 8px', borderRadius: 12, border: `1px solid ${C.roseL}33`, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`, color: C.rose, fontWeight: 700, fontSize: 12,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🗺️ 데이트 코스 추천<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>3cr</span></button>
                <button onClick={() => setView('checkin')} style={{
                  padding: '10px 8px', borderRadius: 12, border: '1px solid #4A9A5A33', cursor: 'pointer',
                  background: '#EAF5EC', color: '#4A9A5A', fontWeight: 700, fontSize: 12,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🌱 관계 성장 체크인<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>무료 · 월 1회</span></button>
                <button onClick={() => setView('soloAnalysis')} style={{
                  padding: '10px 8px', borderRadius: 12, border: `1px solid ${C.lavL}33`, cursor: 'pointer',
                  background: C.lavPale, color: C.lavender, fontWeight: 700, fontSize: 12,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🔮 이상형 성향 분석<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>5cr</span></button>
              </div>
              {/* 3단계 기능 버튼 행 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <button onClick={() => setView('coach')} style={{
                  padding: '10px 6px', borderRadius: 12, border: `1px solid ${C.amberL}55`, cursor: 'pointer',
                  background: `linear-gradient(135deg, #FFF8EE, #FEF3E2)`, color: C.amber, fontWeight: 700, fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🤝 AI 관계 코치<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>3회 무료</span></button>
                <button onClick={() => setView('quiz')} style={{
                  padding: '10px 6px', borderRadius: 12, border: `1px solid ${C.amberL}55`, cursor: 'pointer',
                  background: `linear-gradient(135deg, #FFFBF0, #FEF9E5)`, color: C.amber, fontWeight: 700, fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>💛 커플 스타일 퀴즈<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>무료</span></button>
                <button onClick={() => setView('anniversary')} style={{
                  padding: '10px 6px', borderRadius: 12, border: `1px solid ${C.roseL}55`, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.rosePale}, #FFF5F8)`, color: C.rose, fontWeight: 700, fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🗓️ 기념일 계산기<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>무료</span></button>
                <button onClick={() => setView('timeline')} style={{
                  padding: '10px 6px', borderRadius: 12, border: '1px solid #e0e7ff55', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#4f46e5', fontWeight: 700, fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4, textAlign: 'center',
                }}>🗂️ 관계 타임라인<br/><span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>무료</span></button>
              </div>
            </div>
          );
        })()}

        {/* ── 검사 결과 현황 ── */}
        <div style={{
          borderRadius: 20, padding: '20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>
            📋 내 검사 결과
          </div>
          {/* 커플 탐색 그룹 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 6 }}>💑 커플 탐색</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TestResultBadge type="BIG5" result={testResults?.big5} date={testResults?.big5?.performed_at}/>
              <TestResultBadge type="LOST" result={testResults?.lost} date={testResults?.lost?.performed_at}/>
            </div>
          </div>
          {/* 관계 심층 분석 그룹 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5A8A7A', marginBottom: 6 }}>👨‍👩‍👧 관계 심층 분석</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TestResultBadge type="DSI"  result={testResults?.dsi}  date={testResults?.dsi?.performed_at}/>
            </div>
          </div>
          {!hasAny ? (
            <div style={{
              padding: '16px', borderRadius: 14, background: '#FFF8F0',
              border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>💡 검사를 먼저 완료해주세요</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 2 }}>💑 커플 탐색</div>
                {[
                  { key: 'BIG5', emoji: '🧬', label: 'BIG5 성격검사', desc: '성격 5요인 — 커플 궁합 핵심' },
                  { key: 'LOST', emoji: '⚙️', label: 'LOST 행동유형', desc: '의사결정·에너지 스타일 비교' },
                ].map(t => (
                  <a key={t.key} href={`${MAUMFUL_URL}?start=${t.key}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'white', border: '1px solid #FFD8A0',
                    textDecoration: 'none', color: C.dark,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
                    </div>
                    <span style={{ color: C.rose, fontSize: 12, fontWeight: 700 }}>시작 →</span>
                  </a>
                ))}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5A8A7A', marginTop: 8, marginBottom: 2 }}>👨‍👩‍👧 관계 심층 분석</div>
                {[
                  { key: 'DSI', emoji: '🪞', label: 'SDRI 자아분화', desc: '부부·가족 관계 어려움 — Bowen 이론 기반' },
                ].map(t => (
                  <a key={t.key} href={`${MAUMFUL_URL}?start=${t.key}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'white', border: '1px solid #B8D8D0',
                    textDecoration: 'none', color: C.dark,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
                    </div>
                    <span style={{ color: '#5A8A7A', fontSize: 12, fontWeight: 700 }}>시작 →</span>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>마음풀에서 하나 이상 완료하면 바로 커플 분석이 가능해요.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                ✓ 커플 분석에 사용할 최신 결과가 준비되어 있습니다.
                {testResults?.dsi && <span style={{ marginLeft: 6, color: '#5A8A7A', fontWeight: 600 }}>자아분화 포함 ✦</span>}
              </div>
              {/* 미완료 검사 빠른 이동 */}
              {(['BIG5','LOST','DSI'].some(t => !{BIG5:testResults?.big5,LOST:testResults?.lost,DSI:testResults?.dsi}[t])) && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: '#FFFBF0', border: '1px solid #FFE8A0',
                  fontSize: 12, color: '#9A7030',
                }}>
                  💡 {['BIG5','LOST','DSI'].filter(t => !{BIG5:testResults?.big5,LOST:testResults?.lost,DSI:testResults?.dsi}[t]).map((t, i, arr) => (
                    <React.Fragment key={t}>
                      <a href={`${MAUMFUL_URL}?start=${t}`} style={{ color: C.rose, fontWeight: 700, textDecoration: 'none' }}>{t}</a>
                      {i < arr.length - 1 && ' + '}
                    </React.Fragment>
                  ))} 검사도 완료하면 더 정밀한 분석이 가능해요 →
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 활성 세션 / 세션 시작 ── */}
        {hasActive ? (
          <SessionWaitingView
            session={sessionData}
            myRole={myRole}
            onRefresh={refreshSession}
            onReport={() => setView('report')}
            onCancel={handleCancelSession}
          />
        ) : (
          <div style={{
            borderRadius: 20, padding: '20px', marginBottom: 20,
            background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              💑 커플 분석 시작하기
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
              검사 조합을 선택해 세션을 만들거나, 파트너가 보낸 코드로 참여하세요.
            </div>

            {/* 검사 조합 선택 */}
            {hasAny && (() => {
              const coupleOptions = [
                ...(testResults?.big5 && testResults?.lost ? [
                  { key: 'BIG5+LOST', label: 'BIG5 + LOST', badge: '추천', cost: COST_TWO,
                    desc: '성격·행동유형 비교 — 커플 어울림 핵심', color: C.rose }
                ] : []),
                ...(testResults?.big5 && !testResults?.lost ? [
                  { key: 'BIG5', label: 'BIG5만', badge: null, cost: COST_ONE,
                    desc: '성격 5요인 비교', color: C.rose }
                ] : []),
                ...(!testResults?.big5 && testResults?.lost ? [
                  { key: 'LOST', label: 'LOST만', badge: null, cost: COST_ONE,
                    desc: '의사결정·에너지 스타일 비교', color: C.lavender }
                ] : []),
              ];
              const deepOptions = !testResults?.dsi ? [] : [
                ...(testResults?.big5 && testResults?.lost ? [
                  { key: 'BIG5+LOST+DSI', label: 'BIG5 + LOST + 자아분화', badge: '추천', cost: COST_FULL,
                    desc: '성격·행동유형·자아분화 통합 분석 (부부상담 최적)', color: '#5A8A7A' }
                ] : []),
                ...(testResults?.big5 && !testResults?.lost ? [
                  { key: 'BIG5+DSI', label: 'BIG5 + 자아분화', badge: '추천', cost: COST_TWO,
                    desc: '성격 특성과 분화 수준 비교', color: '#5A8A7A' }
                ] : []),
                ...(!testResults?.big5 && testResults?.lost ? [
                  { key: 'LOST+DSI', label: 'LOST + 자아분화', badge: '추천', cost: COST_TWO,
                    desc: '행동유형과 분화 수준 비교', color: '#5A8A7A' }
                ] : []),
                ...(!testResults?.big5 && !testResults?.lost ? [
                  { key: 'DSI', label: 'SDRI 자아분화만', badge: null, cost: COST_ONE,
                    desc: '관계 분화 수준 집중 분석', color: '#5A8A7A' }
                ] : []),
              ];

              const renderOptions = (opts) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opts.map(opt => (
                    <button key={opt.key}
                      onClick={() => handleCreateSession(opt.key)}
                      disabled={creating}
                      style={{
                        padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${opt.color}33`,
                        background: opt.badge ? `linear-gradient(135deg, ${opt.color}12, ${opt.color}06)` : 'white',
                        cursor: 'pointer', textAlign: 'left', opacity: creating ? 0.7 : 1,
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{opt.label}</span>
                          {opt.badge && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 100,
                              background: opt.color, color: 'white',
                            }}>{opt.badge}</span>
                          )}
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: opt.color,
                          whiteSpace: 'nowrap', marginLeft: 12,
                        }}>{isMaster ? '무료' : `${opt.cost}cr`}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );

              return (
                <div style={{ marginBottom: 16 }}>
                  {coupleOptions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 2 }}>💑 커플 탐색</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>성격·행동유형으로 서로를 알아가는 가벼운 분석</div>
                      {renderOptions(coupleOptions)}
                    </div>
                  )}
                  {deepOptions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#5A8A7A', marginBottom: 2 }}>👨‍👩‍👧 관계 심층 분석</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>자아분화 기반 · 부부·가족 관계 어려움 탐색</div>
                      {renderOptions(deepOptions)}
                    </div>
                  )}
                </div>
              );
            })()}

            {!hasAny && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: '#FFF8F0',
                border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040', marginBottom: 16,
              }}>
                💡 마음풀에서 BIG5, LOST, SDRI 검사 중 하나 이상을 완료해야 세션을 만들 수 있어요.
              </div>
            )}

            {/* 코드로 참여 */}
            <div style={{
              padding: '16px', borderRadius: 14,
              background: C.lavPale, border: `1px solid ${C.lavL}33`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.lavender, marginBottom: 10 }}>
                📨 파트너 코드로 참여하기
              </div>
              <CodeInput onJoin={handleJoin} loading={joining}/>
            </div>
          </div>
        )}

        {/* ── 오늘의 커플 대화 질문 ── */}
        <DailyQuestionCard />

        {/* ── 파트너 마음 일기 ── */}
        <PartnerMomentsSection />

        {/* ── 이전 리포트 + 점수 히스토리 ── */}
        {recentReports?.length > 0 && (
          <div style={{
            borderRadius: 20, padding: '20px',
            background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              📜 이전 분석 리포트
            </div>
            {/* 점수 변화 히스토리 (2개 이상 시 표시) */}
            {recentReports.length >= 2 && (() => {
              const scores = [...recentReports].reverse().map(r => r.compatibility_score || 0);
              const latest = scores[scores.length - 1];
              const prev   = scores[scores.length - 2];
              const diff   = latest - prev;
              return (
                <div style={{
                  padding: '12px 14px', borderRadius: 12, marginBottom: 14,
                  background: diff >= 0 ? '#EAF5EC' : '#FEF0EC',
                  border: `1px solid ${diff >= 0 ? '#4A9A5A' : '#D4634A'}22`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ fontSize: 24 }}>{diff >= 0 ? '📈' : '📉'}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: diff >= 0 ? '#4A9A5A' : '#D4634A' }}>
                      궁합 점수 {diff >= 0 ? `+${diff}점` : `${diff}점`} 변화
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {diff >= 0 ? '함께 성장하고 있어요! 🌱' : '더 깊이 이해하는 과정이에요. 💪'}
                    </div>
                  </div>
                  {/* 미니 바 차트 */}
                  <div style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
                    {scores.map((s, i) => (
                      <div key={i} style={{
                        flex: 1, borderRadius: 4,
                        height: `${Math.max(20, s)}%`,
                        background: i === scores.length - 1
                          ? (diff >= 0 ? '#4A9A5A' : '#D4634A')
                          : C.roseL + '66',
                        minHeight: 6, maxHeight: 32,
                      }}/>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentReports.map(r => (
                <button key={r.id} onClick={() => { setSession(r); setView('report'); }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.roseL}33`,
                  background: C.rosePale, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 100,
                    background: `linear-gradient(135deg, ${scoreColor(r.compatibility_score||0)}, ${C.roseL})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0,
                  }}>{r.compatibility_score || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                      {r.test_type} 분석 · {scoreLabel(r.compatibility_score || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {fmtDate(r.created_at)}
                    </div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 크레딧 부족 모달 ── */}
      {creditModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 28,
            maxWidth: 320, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>크레딧 부족</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              {creditModal.message}
            </div>
            <a href={`${MAUMFUL_URL}/#charge`} style={{
              display: 'block', padding: '12px', borderRadius: 12,
              background: C.rose, color: 'white', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', marginBottom: 10,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>마음풀에서 충전하기</a>
            <button onClick={() => setCredit(null)} style={{
              background: 'none', border: 'none', color: C.muted,
              fontSize: 13, cursor: 'pointer', padding: '8px',
            }}>취소</button>
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, background: C.dark, color: 'white',
          padding: '12px 24px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeUp 0.3s ease',
          fontFamily: "'Noto Sans KR', sans-serif",
          whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </div>
  );
}

// ── 마운트 ───────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CoupleHubApp/>);
