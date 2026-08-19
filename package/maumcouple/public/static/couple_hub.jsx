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

// ── 언어 설정 및 번역 헬퍼 ───────────────────────────────
const COUPLE_LANG = new URLSearchParams(location.search).get('lang') || 'ko';
const tl = (ko, en) => COUPLE_LANG === 'en' ? en : ko;
// 언어 토글: lang 파라미터만 바꿔 리로드(로그인은 localStorage couple_token으로 유지). ?t=·invite 등 기존 파라미터 보존
const toggleCoupleLang = () => {
  const u = new URL(location.href);
  u.searchParams.set('lang', COUPLE_LANG === 'en' ? 'ko' : 'en');
  location.href = u.toString();
};

// ── 상수 ──────────────────────────────────────────────────
const TOKEN_KEY   = 'couple_token';
const MAUMFUL_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
  if (h.includes('lightoflife')) return 'https://jesusmaum.com';
  if (h.includes('maumcouple-dev') || h.includes('-dev.')) return 'https://maumful-dev.limyj007.workers.dev';
  return 'https://maumful.com';
})();

const IS_CTS = window.location.hostname.includes('lightoflife');
const SERVICE_NAME      = IS_CTS ? tl('커플 케어', 'Couple Care')                            : tl('마음커플', 'Maum Couple');
const SERVICE_ICON      = IS_CTS ? '💑'                                                       : '💕';
const BACK_LABEL        = IS_CTS ? '← The Light of Life'                                     : tl('← 마음풀', '← Maumful');
const LOADING_TEXT      = IS_CTS ? tl('커플 케어를 불러오는 중...', 'Loading Couple Care...') : tl('마음커플을 불러오는 중...', 'Loading Maum Couple...');
const MAIN_SERVICE_NAME = IS_CTS ? 'The Light of Life'                                        : tl('마음풀', 'Maumful');
const COUPLE_URL        = IS_CTS ? 'https://lightoflife-couple.limyj007.workers.dev' : 'https://couple.maumful.com';

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
  return user?.nickname || user?.email?.split('@')[0] || tl('나', 'Me');
}
function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString(COUPLE_LANG === 'en' ? 'en-US' : 'ko-KR', { month: 'long', day: 'numeric' });
}
function scoreColor(score) {
  if (score >= 80) return '#4A9A5A';
  if (score >= 60) return C.rose;
  return C.amber;
}
function scoreLabel(score) {
  if (score >= 85) return tl('천생연분 💕', 'Perfect Match 💕');
  if (score >= 70) return tl('잘 맞는 커플 💑', 'Great Couple 💑');
  if (score >= 55) return tl('노력하면 완벽 🌸', 'Perfect with Effort 🌸');
  return tl('다름 속의 매력 🌈', 'Beauty in Differences 🌈');
}

// ── 오늘의 커플 대화 질문 (60개, 날짜 기반 순환) ──────────
const DAILY_QUESTIONS = COUPLE_LANG === 'en' ? [
  "What first attracted you to your partner when you met?",
  "What is the most precious moment you've shared together?",
  "Where and how do you picture us living 10 years from now?",
  "Is there something you still don't know about each other?",
  "What are you most grateful for about your partner?",
  "What is the proudest aspect of our relationship?",
  "Is there a bucket list item you really want to do together?",
  "What would you want your partner to do when you're struggling?",
  "What small habit of your partner do you find endearing?",
  "If you could redo your first date, where would you go?",
  "Is there something your partner said that gave you the most strength?",
  "When did you laugh the most together?",
  "Is there something you haven't been able to say to your partner?",
  "What aspect of your partner do you find most admirable?",
  "Is there something you'd like to learn together?",
  "What is your favorite routine that's unique to us?",
  "How can you best support your partner when they're stressed?",
  "What is your dream travel destination to visit together?",
  "When did you feel most understood by your partner?",
  "What quality of your partner do you most want to emulate?",
  "Is there something you wish your partner would be more honest about?",
  "If you had to describe our relationship in one word, what would it be?",
  "What is the biggest dream you want to achieve together?",
  "What small act of consideration from your partner is most memorable?",
  "Have you tried enjoying each other's hobbies together? How was it?",
  "What is the most touching thing your partner has done for you?",
  "What is something you want to work harder on in our relationship?",
  "What makes you feel like you can do anything when you're with your partner?",
  "What do you hope we look like as an elderly couple?",
  "What quality of your partner makes you a better person?",
  "Is there a new experience you'd like to try together?",
  "Is there something your partner has changed for you?",
  "What is the most important thing to protect in our relationship?",
  "Is there an emotion you'd like to express better to each other?",
  "Is there a small habit you'd like to do together every day?",
  "When do you feel your partner understands you best?",
  "If you lived together, what kind of home would you want?",
  "How do you personally support your partner's dreams?",
  "What are the love signals your partner sends to you?",
  "Do you have a special word or code that's just between the two of you?",
  "What is the happiest moment you spend together?",
  "What does your partner do to make you laugh?",
  "Is there something you feel sorry about to each other?",
  "What goals do you want to achieve together this year?",
  "What kind of person would you be without your partner?",
  "Do you remember the first time you held hands?",
  "Can you each name three of the other's greatest strengths?",
  "Is there a movie or drama you want to watch together?",
  "Is there one thing your partner wishes from you?",
  "How did you feel when you first said 'let's date'?",
  "Can you find three ways you are alike?",
  "What action of your partner makes your heart flutter the most?",
  "When do you feel like you've grown together?",
  "What do you most want to say to your partner right now?",
  "What is the best way you communicate in our relationship?",
  "When do you feel like you've become the most needed person for each other?",
  "Is there a restaurant or café you really want to visit together?",
  "Is there a small favor you'd want your partner to do for you?",
  "Why do you think we get along so well?",
  "What feeling do you get when you're with your partner?",
] : [
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
  { q: tl("연애에서 가장 중요하게 여기는 것은?", "What do you value most in a relationship?"),
    opts: [{ text: tl("신뢰와 안정감", "Trust and stability"), type: 'S' }, { text: tl("설레는 감정과 특별한 순간", "Exciting feelings and special moments"), type: 'R' },
           { text: tl("함께 성장하는 것", "Growing together"), type: 'P' }, { text: tl("서로의 자유와 독립", "Mutual freedom and independence"), type: 'F' }] },
  { q: tl("파트너가 연락을 늦게 할 때 나는?", "When your partner is slow to respond, you:"),
    opts: [{ text: tl("크게 신경 쓰지 않는다", "Don't worry much about it"), type: 'S' }, { text: tl("걱정되어 먼저 연락한다", "Get worried and reach out first"), type: 'P' },
           { text: tl("나도 바쁘니 괜찮다", "I'm busy too, so it's fine"), type: 'F' }, { text: tl("서운하지만 예쁜 메시지를 남긴다", "Feel hurt but leave a sweet message"), type: 'R' }] },
  { q: tl("이상적인 데이트 스타일은?", "What is your ideal date style?"),
    opts: [{ text: tl("분위기 있는 레스토랑과 야경", "Romantic restaurant and night view"), type: 'R' }, { text: tl("새로운 액티비티 도전", "Trying new activities"), type: 'P' },
           { text: tl("집에서 편하게 영화 보기", "Relaxing at home watching movies"), type: 'S' }, { text: tl("각자 하고 싶은 것 즐기기", "Each enjoying what they like"), type: 'F' }] },
  { q: tl("서운할 때 나는?", "When you feel hurt, you:"),
    opts: [{ text: tl("바로 솔직하게 이야기한다", "Talk about it honestly right away"), type: 'S' }, { text: tl("넌지시 표현하고 알아줬으면 한다", "Drop hints and hope they notice"), type: 'R' },
           { text: tl("감정을 충분히 표현한다", "Express my feelings fully"), type: 'P' }, { text: tl("혼자 정리하고 넘어간다", "Process it alone and move on"), type: 'F' }] },
  { q: tl("애정 표현 스타일은?", "How do you express affection?"),
    opts: [{ text: tl("말과 행동으로 적극적으로", "Actively through words and actions"), type: 'P' }, { text: tl("특별한 이벤트와 선물", "Special events and gifts"), type: 'R' },
           { text: tl("꾸준한 작은 관심과 배려", "Consistent small attention and care"), type: 'S' }, { text: tl("함께하는 소소한 일상", "Everyday moments together"), type: 'F' }] },
  { q: tl("미래를 생각할 때 나는?", "When thinking about the future, you:"),
    opts: [{ text: tl("함께 구체적 계획을 세우고 싶다", "Want to make concrete plans together"), type: 'S' }, { text: tl("아름다운 미래 모습을 상상한다", "Imagine a beautiful future together"), type: 'R' },
           { text: tl("함께 더 나은 사람이 되고 싶다", "Want to become better people together"), type: 'P' }, { text: tl("자연스럽게 흘러가면 좋겠다", "Hope things flow naturally"), type: 'F' }] },
  { q: tl("연애에서 가장 힘든 것은?", "What is hardest for you in a relationship?"),
    opts: [{ text: tl("신뢰가 흔들릴 때", "When trust wavers"), type: 'S' }, { text: tl("설렘이 줄어들 것 같을 때", "When the excitement seems to fade"), type: 'R' },
           { text: tl("함께 성장하지 못하는 것 같을 때", "When it feels like we're not growing together"), type: 'P' }, { text: tl("나만의 공간이 없을 때", "When I have no space of my own"), type: 'F' }] },
];

const LOVE_TYPES = {
  S: { emoji: '💚', name: tl('안정 신뢰형', 'Stable & Trusting'), short: tl('든든한 버팀목', 'Steady Pillar'),
    desc: tl('신뢰와 안정감을 가장 중요하게 여깁니다. 꾸준하고 믿음직한 파트너로, 상대방이 편안하게 의지할 수 있는 관계를 만들어요.',
             'You value trust and stability above all. As a steady and reliable partner, you create relationships where your partner can comfortably lean on you.'),
    strength: tl('높은 신뢰도 · 꾸준한 헌신 · 솔직한 소통', 'High trust · Consistent commitment · Honest communication'),
    match: tl('감정 표현이 솔직하고 안정감을 원하는 분과 잘 맞아요.', 'You match well with someone who is emotionally open and seeks stability.'),
    tip: tl('때로는 작은 이벤트로 설렘도 선물해보세요! 💫', 'Try gifting some excitement with small surprises! 💫'),
    color: '#4A9A5A', pale: '#EAF5EC' },
  R: { emoji: '🌹', name: tl('낭만 감성형', 'Romantic & Sentimental'), short: tl('설렘 제조기', 'Excitement Creator'),
    desc: tl('감성적이고 특별한 순간을 사랑합니다. 작은 이벤트와 감동적인 표현으로 연애를 풍성하게 만드는 로맨티스트예요.',
             'You love being emotional and creating special moments. A true romantic who enriches love with small events and heartfelt expressions.'),
    strength: tl('풍부한 감수성 · 창의적 표현 · 세심한 배려', 'Rich sensitivity · Creative expression · Thoughtful care'),
    match: tl('감동과 설렘을 함께 나눌 수 있는 분과 잘 맞아요.', 'You match well with someone who can share emotion and excitement.'),
    tip: tl('일상적인 안정감도 연애의 소중한 부분이에요. 🌱', 'Everyday stability is also a precious part of love. 🌱'),
    color: C.rose, pale: C.rosePale },
  P: { emoji: '🔥', name: tl('열정 성장형', 'Passionate & Growth-Oriented'), short: tl('함께 타오르는 불꽃', 'Flame that Burns Together'),
    desc: tl('강렬하고 진취적인 연애를 원합니다. 파트너와 함께 성장하고 더 나은 사람이 되는 것에 큰 가치를 두는 열정적인 타입이에요.',
             'You want an intense and progressive relationship. A passionate type who places great value on growing and becoming a better person with your partner.'),
    strength: tl('강한 헌신 · 함께 성장하는 마인드 · 적극적 표현', 'Strong commitment · Growth mindset · Active expression'),
    match: tl('비슷한 열정과 목표를 공유할 수 있는 분과 잘 맞아요.', 'You match well with someone who shares similar passion and goals.'),
    tip: tl('파트너의 충전 시간도 배려해주세요. 💆', 'Please respect your partner\'s recharge time too. 💆'),
    color: '#D4634A', pale: '#FEF0EC' },
  F: { emoji: '🌊', name: tl('자유 여유형', 'Free & Easy-Going'), short: tl('바람 같은 자유로움', 'Freedom like the Wind'),
    desc: tl('서로의 독립성을 존중하며 여유롭고 자연스러운 관계를 선호합니다. 집착 없이 서로를 믿고 개인 공간을 지켜주는 성숙한 연애를 해요.',
             'You prefer a relaxed and natural relationship that respects each other\'s independence. A mature love where you trust each other without obsession and maintain personal space.'),
    strength: tl('서로 존중 · 집착 없는 신뢰 · 개인 공간 배려', 'Mutual respect · Trust without obsession · Respecting personal space'),
    match: tl('독립성을 이해하고 여유 있는 연애를 원하는 분과 잘 맞아요.', 'You match well with someone who understands independence and wants a relaxed relationship.'),
    tip: tl('때로는 더 적극적인 관심 표현도 필요할 수 있어요. 💌', 'Sometimes more active expressions of interest may be needed. 💌'),
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
    { emoji: '⚡', name: tl('활력형', 'Energetic'), v: E },
    { emoji: '🤝', name: tl('친화형', 'Agreeable'), v: A },
    { emoji: '🎨', name: tl('탐구형', 'Curious'), v: O },
    { emoji: '📋', name: tl('계획형', 'Organized'), v: C },
    { emoji: '🌊', name: tl('감수형', 'Sensitive'), v: N },
  ].sort((a, b) => b.v - a.v)[0];
}

function getCoupleChemType(myBig5, partnerBig5) {
  if (!myBig5 || !partnerBig5) return null;
  const eDiff = Math.abs((myBig5.E||50) - (partnerBig5.E||50));
  const avgE  = ((myBig5.E||50) + (partnerBig5.E||50)) / 2;
  const avgA  = ((myBig5.A||50) + (partnerBig5.A||50)) / 2;
  const avgO  = ((myBig5.O||50) + (partnerBig5.O||50)) / 2;
  if (eDiff < 15 && avgE > 60) return { emoji: '🔥', name: tl('열정 폭발형', 'Explosive Energy'), desc: tl('둘 다 에너지가 넘쳐 함께하면 시너지 폭발!', 'Both full of energy — explosive synergy together!'), color: '#D4634A' };
  if (eDiff > 30) return { emoji: '🌊', name: tl('균형 보완형', 'Balanced Complement'), desc: tl('서로 다른 에너지가 완벽한 균형을 이뤄요.', 'Different energies form a perfect balance.'), color: C.lavender };
  if (avgA > 65) return { emoji: '💚', name: tl('따뜻한 배려형', 'Warm & Caring'), desc: tl('서로를 깊이 배려하는 따뜻하고 안정적인 케미예요.', 'A warm and stable chemistry of deep mutual care.'), color: '#4A9A5A' };
  if (avgO > 65) return { emoji: '🎨', name: tl('창의적 탐험형', 'Creative Explorers'), desc: tl('새로운 것을 함께 탐험하는 모험심 넘치는 케미예요.', 'An adventurous chemistry of exploring new things together.'), color: C.amber };
  return { emoji: '💕', name: tl('특별한 우리형', 'Uniquely Us'), desc: tl('둘만의 독특하고 소중한 케미를 가지고 있어요.', 'You have a unique and precious chemistry all your own.'), color: C.rose };
}

// ── BIG5 비교 뷰 ─────────────────────────────────────────
function Big5CompareView({ myBig5, partnerBig5, myName, partnerName, onBack }) {
  const traits = [
    { key: 'O', label: tl('개방성', 'Openness'), emoji: '🎨', desc: tl('창의성·호기심', 'Creativity·Curiosity') },
    { key: 'C', label: tl('성실성', 'Conscientiousness'), emoji: '📋', desc: tl('책임감·계획성', 'Responsibility·Planning') },
    { key: 'E', label: tl('외향성', 'Extraversion'), emoji: '⚡', desc: tl('사교성·활동성', 'Sociability·Activity') },
    { key: 'A', label: tl('친화성', 'Agreeableness'), emoji: '🤝', desc: tl('배려·협력', 'Care·Cooperation') },
    { key: 'N', label: tl('신경성', 'Neuroticism'), emoji: '🌊', desc: tl('감정 민감도', 'Emotional sensitivity') },
  ];
  const chem = getCoupleChemType(myBig5, partnerBig5);

  // Radar chart geometry
  const cx = 130, cy = 130, r = 95;
  function pt(i, val) {
    const angle = (2 * Math.PI * i / 5) - Math.PI / 2;
    const v = (Math.max(0, Math.min(100, val)) / 100) * r;
    return `${(cx + v * Math.cos(angle)).toFixed(1)},${(cy + v * Math.sin(angle)).toFixed(1)}`;
  }
  function gridPt(i, pct) {
    const angle = (2 * Math.PI * i / 5) - Math.PI / 2;
    const v = pct * r;
    return `${(cx + v * Math.cos(angle)).toFixed(1)},${(cy + v * Math.sin(angle)).toFixed(1)}`;
  }
  function labelPt(i) {
    const angle = (2 * Math.PI * i / 5) - Math.PI / 2;
    const v = r + 22;
    return { x: cx + v * Math.cos(angle), y: cy + v * Math.sin(angle) };
  }
  const myPts      = traits.map((t, i) => pt(i, myBig5?.[t.key] ?? 50)).join(' ');
  const partnerPts = traits.map((t, i) => pt(i, partnerBig5?.[t.key] ?? 50)).join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1];

  function shareResult() {
    const lines = traits.map(t => `${t.emoji}${t.label}: ${myBig5?.[t.key] ?? 50} vs ${partnerBig5?.[t.key] ?? 50}`);
    const text = `${SERVICE_ICON} ${tl('BIG5 커플 비교', 'BIG5 Couple Comparison')}\n${myName} vs ${partnerName}\n${lines.join('\n')}\n${chem ? `${tl('케미', 'Chemistry')}: ${chem.emoji} ${chem.name}` : ''}\n${COUPLE_URL} #${SERVICE_NAME}`;
    if (navigator.share) navigator.share({ title: tl('BIG5 커플 비교', 'BIG5 Couple Comparison'), text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => alert(tl('클립보드에 복사됐어요!', 'Copied to clipboard!'))).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: C.rose, padding: '4px 8px',
        }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
          🧬 {tl('BIG5 성격 비교', 'BIG5 Personality Comparison')}
        </span>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* 범례 */}
        <div style={{
          borderRadius: 20, padding: '16px 20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex', justifyContent: 'center', gap: 28,
        }}>
          {[
            { name: myName + tl(' (나)', ' (Me)'), color: C.rose },
            { name: partnerName, color: C.lavender },
          ].map(({ name, color }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: color }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{name}</span>
            </div>
          ))}
        </div>

        {/* 레이더 차트 */}
        <div style={{
          borderRadius: 20, padding: '20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <svg viewBox="0 0 260 260" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }}>
            {/* 격자 */}
            {gridLevels.map(lvl => (
              <polygon key={lvl}
                points={traits.map((_, i) => gridPt(i, lvl)).join(' ')}
                fill="none" stroke="#e8e0e8" strokeWidth="1"
              />
            ))}
            {/* 방사형 축선 */}
            {traits.map((_, i) => (
              <line key={i}
                x1={cx} y1={cy}
                x2={gridPt(i, 1).split(',')[0]} y2={gridPt(i, 1).split(',')[1]}
                stroke="#e8e0e8" strokeWidth="1"
              />
            ))}
            {/* 파트너 영역 */}
            <polygon points={partnerPts}
              fill={C.lavender + '30'} stroke={C.lavender} strokeWidth="2" strokeLinejoin="round"
            />
            {/* 내 영역 */}
            <polygon points={myPts}
              fill={C.rose + '28'} stroke={C.rose} strokeWidth="2" strokeLinejoin="round"
            />
            {/* 내 점 */}
            {traits.map((t, i) => {
              const [x, y] = pt(i, myBig5?.[t.key] ?? 50).split(',');
              return <circle key={t.key} cx={x} cy={y} r="4" fill={C.rose}/>;
            })}
            {/* 파트너 점 */}
            {traits.map((t, i) => {
              const [x, y] = pt(i, partnerBig5?.[t.key] ?? 50).split(',');
              return <circle key={t.key} cx={x} cy={y} r="4" fill={C.lavender}/>;
            })}
            {/* 라벨 */}
            {traits.map((t, i) => {
              const lp = labelPt(i);
              return (
                <text key={t.key} x={lp.x} y={lp.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="600" fill={C.dark}
                  fontFamily="'Noto Sans KR', sans-serif">
                  {t.emoji} {t.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 상세 바 차트 */}
        <div style={{
          borderRadius: 20, padding: '20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 16 }}>📊 {tl('항목별 비교', 'Comparison by Category')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {traits.map(({ key, label, emoji, desc }) => {
              const myVal      = myBig5?.[key] ?? 50;
              const partnerVal = partnerBig5?.[key] ?? 50;
              const diff = Math.abs(myVal - partnerVal);
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{emoji} {label}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{desc} · {tl('차이', 'Diff')} {diff}{tl('점', '')}</span>
                  </div>
                  {[
                    { name: myName + tl(' (나)', ' (Me)'), val: myVal, color: C.rose },
                    { name: partnerName, val: partnerVal, color: C.lavender },
                  ].map(({ name: nname, val, color }) => (
                    <div key={nname} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted, width: 64, flexShrink: 0, textAlign: 'right' }}>{nname}</span>
                      <div style={{ flex: 1, background: '#f3f0f5', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{
                          width: val + '%', height: '100%', borderRadius: 6,
                          background: color, transition: 'width 0.5s ease',
                        }}/>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color, width: 30, textAlign: 'right' }}>{val}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* 케미 타입 */}
        {chem && (
          <div style={{
            borderRadius: 20, padding: '20px', marginBottom: 20,
            background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${chem.color}`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{chem.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: chem.color, marginBottom: 6 }}>{chem.name}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{chem.desc}</div>
          </div>
        )}

        {/* 공유 버튼 */}
        <button onClick={shareResult} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`,
          color: 'white', fontWeight: 700, fontSize: 14,
          border: 'none', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          🔗 {tl('결과 공유하기', 'Share Result')}
        </button>
      </div>
    </div>
  );
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
        fontFamily="'Noto Sans KR', sans-serif">{tl('파트너를 기다리는 중...', 'Waiting for partner...')}</text>
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
      padding: 24, textAlign: 'center', position: 'relative',
    }}>
      <button onClick={toggleCoupleLang} title="Language" style={{ position: 'absolute', top: 16, right: 16, fontSize: 12, fontWeight: 700, color: C.muted, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)' }}>{COUPLE_LANG === 'en' ? '한' : 'EN'}</button>
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'heartbeat 2s ease-in-out infinite' }}>{SERVICE_ICON}</div>
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 10,
        fontFamily: "'Noto Serif KR', serif",
      }}>{SERVICE_NAME}</h1>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.9, marginBottom: 32, maxWidth: 300 }}>
        {IS_CTS
          ? tl('The Light of Life에서 로그인하면', 'Log in to The Light of Life')
          : tl('마음풀에서 로그인하면', 'Log in to Maumful')}<br/>
        {tl('별도 로그인 없이 바로 이용할 수 있어요.', 'and start using without a separate login.')}<br/>
        {tl('심리검사 결과로 파트너와의', 'Analyze your compatibility and')}<br/>
        {tl('궁합과 관계 패턴을 분석해보세요 💑', 'relationship patterns with your partner 💑')}
      </p>
      <a href={MAUMFUL_URL} style={{
        display: 'inline-block', padding: '14px 36px',
        background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
        color: 'white', borderRadius: 14, fontWeight: 700,
        fontSize: 15, textDecoration: 'none',
        boxShadow: `0 8px 24px ${C.rose}44`,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {IS_CTS
          ? tl('The Light of Life 로그인하고 시작하기 →', 'Log in to The Light of Life →')
          : tl('마음풀 로그인하고 시작하기 →', 'Log in to Maumful and Start →')}
      </a>
    </div>
  );
}

// ── TestResultBadge ───────────────────────────────────────
function TestResultBadge({ type, result, date }) {
  const hasResult = !!result;
  const meta = {
    BIG5: { emoji: '🧬', label: tl('BIG5 성격검사', 'BIG5 Personality Test'),   color: C.rose,     pale: C.rosePale,  accentL: C.roseL },
    LOST: { emoji: '⚙️', label: tl('LOST 행동유형', 'LOST Behavior Type'),      color: C.lavender, pale: C.lavPale,   accentL: C.lavL  },
    DSI:  { emoji: '🪞', label: tl('SDRI 자아분화검사', 'SDRI Differentiation Test'), color: '#5A8A7A',  pale: '#EAF3F0',   accentL: '#7ABAA8' },
  }[type] || { emoji: '📋', label: type, color: C.muted, pale: '#F5F5F5', accentL: C.muted };

  const cardStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 12,
    background: hasResult ? meta.pale : '#FFFFFF',
    border: `1px solid ${hasResult ? meta.accentL + '44' : meta.accentL + '66'}`,
  };

  const inner = (
    <React.Fragment>
      <span style={{ fontSize: 22 }}>{meta.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>
          {meta.label}
        </div>
        <div style={{ fontSize: 11, color: hasResult ? C.muted : meta.color, fontWeight: hasResult ? 400 : 700, marginTop: 2 }}>
          {hasResult ? `✓ ${tl('완료', 'Done')} · ${fmtDate(date)}` : tl('마음풀에서 검사하기 →', 'Take the test on Maumful →')}
        </div>
      </div>
      {hasResult
        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: meta.color, color: 'white' }}>{tl('완료', 'Done')}</span>
        : <span style={{ fontSize: 18, fontWeight: 700, color: meta.color }}>→</span>}
    </React.Fragment>
  );

  // 결과 없는 검사 → 클릭 시 마음풀로 이동해 해당 검사 바로 시작(?start=TYPE, 완료 후 마음커플 자동 복귀)
  if (!hasResult) {
    return (
      <a href={`${MAUMFUL_URL}?start=${type}`} style={{ ...cardStyle, textDecoration: 'none', cursor: 'pointer' }}
        title={tl('마음풀로 이동해 검사를 진행합니다', 'Go to Maumful to take this test')}>
        {inner}
      </a>
    );
  }
  return <div style={cardStyle}>{inner}</div>;
}

// ── DailyQuestionCard ─────────────────────────────────────
// ⑧ 우리의 정원 — 두 사람의 마음게임 실천을 함께 본다.
// ⚠️ 파트너의 감정 기록 "내용"은 서버가 아예 반환하지 않는다. 여기서 보이는 건 실천 횟수뿐.
// 파트너가 없거나 조회 실패면 아무것도 렌더하지 않는다(허브에 영향 없음).
function CoupleGardenCard() {
  const [g, setG] = useState(null);

  useEffect(() => {
    api.get('/api/couple/garden')
      .then(res => { if (res.success && res.data?.partner) setG(res.data); })
      .catch(() => {});
  }, []);

  if (!g) return null;

  const pct = Math.min(100, Math.round((g.week / g.weeklyGoal) * 100));

  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: '18px 20px', marginBottom: 16,
      border: `1px solid ${C.rose}22`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>🌿 {tl('우리의 정원', 'Our Garden')}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{tl('최근 30일', 'Last 30 days')}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          [tl('나', 'Me'), g.mine],
          [tl(`${g.partnerName}님`, g.partnerName), g.theirs],
          [tl('함께', 'Together'), g.total],
        ].map(([label, val]) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', background: `${C.rose}0D`, borderRadius: 14, padding: '12px 6px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>{val}</div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>
        {g.goalMet
          ? tl(`이번 주 목표 달성! 둘이 ${g.week}회 실천했어요 🎉`, `Weekly goal reached — ${g.week} sessions together 🎉`)
          : tl(`이번 주 함께 ${g.week}/${g.weeklyGoal}회`, `${g.week}/${g.weeklyGoal} together this week`)}
      </div>
      <div style={{ height: 7, borderRadius: 100, background: `${C.rose}1A`, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${C.rose}, ${C.roseL})`, transition: 'width .4s' }} />
      </div>

      <a href="https://game.maumful.com" target="_blank" rel="noopener noreferrer"
        style={{
          display: 'block', textAlign: 'center', padding: '11px',
          background: C.rose, color: 'white', borderRadius: 12,
          fontSize: 12.5, fontWeight: 700, textDecoration: 'none', fontFamily: "'Noto Sans KR',sans-serif",
        }}>
        {tl('마음게임 하러 가기 →', 'Play Maum Games →')}
      </a>
      <p style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.6, textAlign: 'center' }}>
        {tl('실천 횟수만 함께 봅니다. 서로의 감정 기록 내용은 공유되지 않아요.',
            'Only practice counts are shared — never the content of each other’s mood logs.')}
      </p>
    </div>
  );
}

function DailyQuestionCard() {
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const dayIdx = (Math.floor(Date.now() / 86400000) + offset) % DAILY_QUESTIONS.length;
  const q = DAILY_QUESTIONS[dayIdx];

  function copyQuestion() {
    const text = `${SERVICE_ICON} ${tl('오늘의 커플 대화 질문', 'Today\'s Couple Question')}\n\n"${q}"\n\n${COUPLE_URL}`;
    if (navigator.share) {
      navigator.share({ title: tl('오늘의 커플 질문', 'Today\'s Couple Question'), text }).catch(() => {});
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
          <span style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>{tl('오늘의 커플 대화 질문', 'Today\'s Couple Question')}</span>
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
        }}>{tl('다음 질문 →', 'Next Question →')}</button>
        <button onClick={copyQuestion} style={{
          flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: C.rose, color: 'white',
          fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif",
        }}>{copied ? tl('✓ 복사됨', '✓ Copied') : tl('📤 파트너와 공유', '📤 Share with Partner')}</button>
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
    const text = `${SERVICE_ICON} ${tl('나의 연애 유형은', 'My Love Type is')} "${t.emoji} ${t.name}"\n\n${t.short} — ${t.desc.slice(0, 50)}...\n\n${tl('나도 테스트해봐요!', 'Try it too!')}\n${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl('나의 연애 유형', 'My Love Type'), text }).catch(() => {})
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
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('나의 연애 유형', 'My Love Type')}</span></button>
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
              {tl('나의 연애 유형은?', 'What\'s My Love Type?')}
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 32 }}>
              {tl('7가지 질문으로 알아보는 나의 연애 스타일.', '7 questions to discover your love style.')}<br/>
              {tl('크레딧 없이 무료로 바로 시작할 수 있어요!', 'Start for free without any credits!')}
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
            }}>{tl('시작하기 →', 'Start →')}</button>
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
              {tl('나의 연애 유형', 'My Love Type')}
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
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 6 }}>💡 {tl('연애 성향', 'Love Tendency')}</div>
                <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.7 }}>{t.desc}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'white', border: '1px solid #F0E0E8' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>✨ {tl('강점', 'Strengths')}</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.strength}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'white', border: '1px solid #F0E0E8' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>💑 {tl('잘 맞는 유형', 'Best Match Type')}</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.match}</div>
              </div>
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
                border: `1px solid ${C.roseL}33`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 4 }}>💌 {tl('성장 팁', 'Growth Tip')}</div>
                <div style={{ fontSize: 12, color: C.dark }}>{t.tip}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => shareResult(t)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                color: 'white', fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>📤 {tl('결과 공유하기', 'Share Result')}</button>
              <button onClick={reset} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.roseL}44`, cursor: 'pointer',
                background: 'white', color: C.rose, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>🔄 {tl('다시 해보기', 'Try Again')}</button>
            </div>

            <button onClick={onBack} style={{
              width: '100%', marginTop: 10, padding: '12px', borderRadius: 12,
              border: '1px solid #E0D0D8', cursor: 'pointer',
              background: 'white', color: C.muted, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>← {tl('홈으로 돌아가기', 'Back to Home')}</button>
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

  const SUGGESTIONS = COUPLE_LANG === 'en' ? [
    "We keep fighting about the same things",
    "I think I'm not good at expressing my emotions in relationships",
    "I feel frustrated that my partner doesn't seem to understand me",
    "I'm worried that the excitement is fading",
    "How should I tell my partner when I feel hurt?",
  ] : [
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
          setError(tl(`💳 ${res.data.creditsSpent}cr 차감됐습니다.`, `💳 ${res.data.creditsSpent}cr deducted.`));
          setTimeout(() => setError(''), 3000);
        }
      } else if (res.needsCharge) {
        setMessages(prev => prev.slice(0, -1));
        setInput(text);
        setError(tl(`크레딧이 부족합니다. (필요: ${PAID_COST}cr)`, `Insufficient credits. (Required: ${PAID_COST}cr)`));
      } else {
        setMessages(prev => prev.slice(0, -1));
        setInput(text);
        setError(res.error || tl('전송 실패', 'Send failed'));
      }
    } catch {
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
      setError(tl('서버 오류가 발생했습니다.', 'A server error occurred.'));
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
          ← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('AI 관계 코치', 'AI Relationship Coach')}</span>
        </button>
        <div style={{ fontSize: 11, color: C.muted, background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 100 }}>
          {isMaster ? tl('무제한', 'Unlimited') : freeLeft > 0 ? tl(`무료 ${freeLeft}회 남음`, `${freeLeft} free left`) : `${PAID_COST}cr/${tl('회', 'msg')}`}
        </div>
      </nav>

      {/* 채팅 영역 */}
      <div style={{ flex: 1, maxWidth: 560, width: '100%', margin: '0 auto', padding: '20px 16px 100px', overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
              {tl('AI 관계 코치', 'AI Relationship Coach')}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
              {tl('연애·커플 관계에 대한 고민을 편하게 나눠보세요.', 'Share your relationship concerns comfortably.')}<br/>
              {tl('BIG5 성격 데이터를 바탕으로 맞춤 조언을 드려요.', 'Get personalized advice based on your BIG5 personality data.')}
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
              placeholder={tl("고민을 편하게 이야기해보세요...", "Feel free to share your concerns...")}
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
const QUIZ_QUESTIONS = COUPLE_LANG === 'en' ? [
  { q: "What is your ideal way to spend the weekend?",
    opts: ['Netflix/games at home', 'Food spots & café tour', 'Outdoor activities', 'Travel & day trips'] },
  { q: "How do you prefer to resolve conflicts?",
    opts: ['Talk it out right away', 'Process alone then talk', 'Let time fix it', 'Express first via message'] },
  { q: "How do you want your partner to show love?",
    opts: ['Physical affection (hugs, holding hands)', 'Warm words and compliments', 'Surprise gifts & events', 'Spending time together'] },
  { q: "What do you want from your partner when stressed?",
    opts: ['Just be by my side', 'Actively empathize', 'Help find a solution', 'Make me laugh'] },
  { q: "What is your ideal lifestyle as a couple?",
    opts: ['Do almost everything together', 'Only important things together', 'Respect individual lives, meet sometimes', 'Depends on the situation'] },
  { q: "What do you picture for us 10 years from now?",
    opts: ['A family with children', 'A free couple traveling the world', 'A partnership each pursuing their dreams', 'Happy like now is OK'] },
  { q: "Which date style suits you better?",
    opts: ['Carefully planned', 'Spontaneous day by day', 'Partner leads', 'Plan together equally'] },
  { q: "How do you give gifts?",
    opts: ['Figure out what they want ahead of time', 'Complete surprise', 'Choose together', 'Give experiences & memories'] },
  { q: "What matters most in a relationship?",
    opts: ['Trust and stability', 'Excitement and passion', 'Growing together', 'Comfort and freedom'] },
  { q: "In a conflict, you tend to:",
    opts: ['Speak honestly right away', 'Decide based on the situation', 'Calm the other person first', 'Want to avoid it'] },
] : [
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
  A: { emoji: '🏡', name: tl('안정 공존형', 'Stable Coexistence'), desc: tl('함께하는 일상과 안정감을 가장 소중히 여겨요. 편안하고 신뢰 깊은 관계를 만드는 탁월한 파트너예요.', 'You value shared daily life and stability most. An excellent partner who creates comfortable, trust-deep relationships.'), tip: tl('가끔 작은 서프라이즈로 설렘도 만들어보세요!', 'Try creating some excitement with small surprises!') },
  B: { emoji: '💬', name: tl('깊은 유대형', 'Deep Connection'), desc: tl('진심 어린 소통과 정서적 연결을 중시해요. 파트너의 마음을 깊이 이해하고 공감하는 능력이 뛰어나요.', 'You value sincere communication and emotional connection. Excellent at deeply understanding and empathizing with your partner.'), tip: tl('말보다 행동으로 보여주는 표현도 시도해보세요!', 'Try showing love through actions, not just words!') },
  C: { emoji: '🌱', name: tl('성장 동반형', 'Growth Partners'), desc: tl('함께 발전하고 새로운 것을 경험하는 관계를 원해요. 파트너와 함께 더 나은 사람이 되는 것에 큰 보람을 느껴요.', 'You want a relationship where you grow and experience new things together. You find great fulfillment in becoming a better person with your partner.'), tip: tl('지금 이 순간을 즐기는 여유도 가져보세요!', 'Take time to enjoy the present moment too!') },
  D: { emoji: '🌊', name: tl('자유 균형형', 'Free & Balanced'), desc: tl('서로의 공간과 자유를 존중하는 성숙한 관계를 선호해요. 집착 없이 믿고 맡기는 여유로운 연애를 해요.', 'You prefer a mature relationship that respects each other\'s space and freedom. A relaxed love of trusting without obsession.'), tip: tl('가끔은 더 적극적으로 원하는 것을 표현해보세요!', 'Sometimes express what you want more actively!') },
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
    const text = `${SERVICE_ICON} ${tl('나의 커플 스타일은', 'My Couple Style is')} "${t.emoji} ${t.name}"\n\n${t.desc}\n\n${tl('나도 테스트해봐요! →', 'Try it too! →')} ${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl('나의 커플 스타일', 'My Couple Style'), text }).catch(() => {})
                    : navigator.clipboard?.writeText(text).catch(() => {});
  }

  const curQ = QUIZ_QUESTIONS[step];
  const t    = result ? QUIZ_TYPES[result] : null;
  const prog = step >= 0 ? (step + 1) / QUIZ_QUESTIONS.length * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={result ? reset : step === -1 ? onBack : () => setStep(s => s-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>{tl('커플 스타일 퀴즈', 'Couple Style Quiz')}</span>
        </button>
        {step >= 0 && !result && <span style={{ fontSize:12, color:C.muted }}>{step+1}/{QUIZ_QUESTIONS.length}</span>}
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        {/* 인트로 */}
        {step === -1 && !result && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:72, marginBottom:16 }}>🎯</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:C.dark, marginBottom:10, fontFamily:"'Noto Serif KR', serif" }}>{tl('우리 커플 스타일은?', 'What\'s Our Couple Style?')}</h2>
            <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28 }}>{tl('10문항으로 알아보는 나의 커플 스타일.', '10 questions to discover your couple style.')}<br/>{tl('파트너와 함께 해보고 비교해보세요! 무료예요.', 'Try it with your partner and compare! It\'s free.')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:32 }}>
              {Object.values(QUIZ_TYPES).map(qt => (
                <div key={qt.name} style={{ padding:'8px 14px', borderRadius:100, background:'white', border:`1px solid ${C.roseL}33`, fontSize:12, color:C.dark }}>
                  {qt.emoji} {qt.name}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(0)} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color:'white', fontWeight:700, fontSize:15, fontFamily:"'Noto Sans KR', sans-serif", boxShadow:`0 8px 24px ${C.amber}44` }}>
              {tl('시작하기 →', 'Start →')}
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
            <div style={{ fontSize:12, color:C.amber, fontWeight:700, marginBottom:4 }}>{tl('나의 커플 스타일', 'My Couple Style')}</div>
            <h2 style={{ fontSize:24, fontWeight:700, color:C.dark, marginBottom:20, fontFamily:"'Noto Serif KR', serif" }}>{t.name}</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24, textAlign:'left' }}>
              <div style={{ padding:'16px', borderRadius:16, background:'#FFFBF0', border:`1px solid ${C.amberL}44` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.amber, marginBottom:6 }}>💡 {tl('나의 연애 스타일', 'My Love Style')}</div>
                <div style={{ fontSize:13, color:C.dark, lineHeight:1.7 }}>{t.desc}</div>
              </div>
              <div style={{ padding:'14px 16px', borderRadius:14, background:`linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`, border:`1px solid ${C.roseL}33` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.rose, marginBottom:4 }}>💌 {tl('파트너와의 성장 팁', 'Growth Tip with Partner')}</div>
                <div style={{ fontSize:12, color:C.dark }}>{t.tip}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => shareResult(t)} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color:'white', fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>📤 {tl('결과 공유하기', 'Share Result')}</button>
              <button onClick={reset} style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${C.amberL}44`, cursor:'pointer', background:'white', color:C.amber, fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>🔄 {tl('다시 해보기', 'Try Again')}</button>
            </div>
            <button onClick={onBack} style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:12, border:'1px solid #E0D0D8', cursor:'pointer', background:'white', color:C.muted, fontSize:12, fontFamily:"'Noto Sans KR', sans-serif" }}>← {tl('홈으로', 'Home')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 감정 레이블 매핑 (마음게임 mood.jsx와 동일) ───────────
const MOOD_LABELS = {
  happy:   { emoji: '😊', label: tl('행복', 'Happy'),   color: '#F5C842' },
  calm:    { emoji: '😌', label: tl('평온', 'Calm'),    color: '#7BC4A0' },
  tired:   { emoji: '😴', label: tl('피곤', 'Tired'),   color: '#9BB0C0' },
  anxious: { emoji: '😰', label: tl('불안', 'Anxious'), color: '#F5A050' },
  sad:     { emoji: '😢', label: tl('슬픔', 'Sad'),     color: '#6B9ACB' },
  angry:   { emoji: '😤', label: tl('화남', 'Angry'),   color: '#E86C6C' },
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

  // ⚠️ 파트너 감정 "내용"은 표시하지 않는다 — 활동 횟수(신호)만 노출(백엔드도 내용 미반환).
  const { partnerName, moodCount = 0, gratCount = 0 } = data;
  if (moodCount === 0 && gratCount === 0) return null;

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
            {partnerName}{tl('님의 마음 돌봄', '\'s Self-Care')}
          </span>
        </div>
        <span style={{ fontSize: 18, color: C.muted }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>

          {/* 파트너의 감정 "내용"은 공유하지 않는다(사생활 보호). 활동 신호(횟수)만 표시. */}
          <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>
            {tl(
              `최근 7일 동안 ${partnerName}님이 감정을 ${moodCount}번 돌아보고, 감사한 순간을 ${gratCount}번 적었어요.`,
              `In the last 7 days, ${partnerName} checked in with their feelings ${moodCount} time(s) and noted ${gratCount} moment(s) of gratitude.`
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#FAF5FC' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{moodCount}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>🎨 {tl('감정 기록', 'Mood check-ins')}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'rgba(255,224,138,0.12)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{gratCount}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⭐ {tl('감사 일기', 'Gratitude notes')}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            {tl('기록의 내용은 서로의 사생활을 위해 공유되지 않아요. 파트너가 스스로를 돌보고 있다는 신호만 전해드려요.',
                'The contents stay private. We only let you know your partner has been caring for themselves.')}
          </div>
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
      result.push({ label: m === 365 ? tl('1주년', '1 Year') : m === 730 ? tl('2주년', '2 Years') : m === 1461 ? tl('4주년', '4 Years') : m === 1825 ? tl('5주년', '5 Years') : m === 3650 ? tl('10주년', '10 Years') : tl(`${m}일`, `Day ${m}`), date: d, diff, isPast: diff < 0 });
    }
    return { daysTotal, milestones: result };
  })() : null;

  const nextMilestone = milestones?.milestones.find(m => m.diff >= 0);

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>{tl('기념일 계산기', 'Anniversary Calculator')}</span>
        </button>
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:56, marginBottom:10 }}>📅</div>
          <p style={{ fontSize:13, color:C.muted }}>{tl('처음 만난 날을 입력하면 D+N일과', 'Enter the day you first met to see the D+N count')}<br/>{tl('다가오는 기념일을 알려드려요.', 'and upcoming anniversaries.')}</p>
        </div>

        <div style={{ background:'white', borderRadius:20, padding:'20px', marginBottom:20, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:10 }}>💑 {tl('처음 만난 날', 'Day We First Met')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              style={{ flex:1, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${C.roseL}44`, fontSize:14, outline:'none', fontFamily:"'Noto Sans KR', sans-serif", color:C.dark }}
            />
            <button onClick={saveDate} disabled={!inputDate} style={{ padding:'11px 20px', borderRadius:12, border:'none', cursor:inputDate?'pointer':'not-allowed', background:inputDate?C.rose:'#E0D0D8', color:'white', fontWeight:700, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif" }}>
              {tl('저장', 'Save')}
            </button>
          </div>
        </div>

        {milestones && (
          <>
            {/* D+N 히어로 */}
            <div style={{ background:`linear-gradient(135deg, ${C.rose}, ${C.lavender})`, borderRadius:20, padding:'28px 20px', marginBottom:20, textAlign:'center', boxShadow:`0 8px 32px ${C.rose}33` }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginBottom:6, letterSpacing:2 }}>{tl('우리가 함께한 날', 'Days Together')}</div>
              <div style={{ fontSize:56, fontWeight:800, color:'white', lineHeight:1 }}>D+{milestones.daysTotal}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.9)', marginTop:8 }}>
                {COUPLE_LANG === 'en'
                ? `Since ${new Date(firstDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`
                : `${new Date(firstDate).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })} 부터`}
              </div>
              {nextMilestone && (
                <div style={{ marginTop:16, padding:'10px 16px', borderRadius:12, background:'rgba(255,255,255,0.2)', fontSize:13, color:'white', fontWeight:600 }}>
                  {tl('다음 기념일', 'Next Anniversary')}: {nextMilestone.label} ({tl(`D+${nextMilestone.diff}일 후`, `In ${nextMilestone.diff} days`)})
                </div>
              )}
            </div>

            {/* 기념일 리스트 */}
            <div style={{ background:'white', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:14 }}>🎉 {tl('기념일 목록', 'Anniversary List')}</div>
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
                        <div style={{ fontSize:11, color:C.muted }}>{m.date.toLocaleDateString(COUPLE_LANG === 'en' ? 'en-US' : 'ko-KR', { year:'numeric', month:'long', day:'numeric' })}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color: m.isPast ? C.muted : m.diff <= 7 ? C.rose : C.muted }}>
                      {m.isPast ? tl('지남', 'Passed') : m.diff === 0 ? tl('오늘! 🎉', 'Today! 🎉') : tl(`${m.diff}일 후`, `In ${m.diff} days`)}
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

  const fmtDate = d => new Date(d).toLocaleDateString(COUPLE_LANG === 'en' ? 'en-US' : 'ko-KR', { year:'numeric', month:'long', day:'numeric' });
  const typeStyle = {
    report:  { bg:'#fdf2f8', border:'#f9a8d4', accent:C.rose,    label:tl('AI 리포트', 'AI Report') },
    session: { bg:'#f0f9ff', border:'#bae6fd', accent:'#0ea5e9', label:tl('커플 검사', 'Couple Test') },
    checkin: { bg:'#f0fdf4', border:'#bbf7d0', accent:'#16a34a', label:tl('관계 체크인', 'Relationship Check-in') },
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)', borderBottom:`1px solid rgba(181,85,106,0.12)`, padding:'0 20px', height:56, display:'flex', alignItems:'center' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          ← <span style={{ fontSize:14, fontWeight:600 }}>{tl('관계 타임라인', 'Relationship Timeline')}</span>
        </button>
      </nav>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'28px 20px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🗂️</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.dark, margin:'0 0 6px' }}>{tl('관계 타임라인', 'Relationship Timeline')}</h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>{tl('우리의 관계 기록을 한눈에 볼 수 있어요', 'See all your relationship records at a glance')}</p>
        </div>

        {loading && <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>{tl('불러오는 중...', 'Loading...')}</div>}

        {!loading && (!items || items.length === 0) && (
          <div style={{ background:'white', borderRadius:20, padding:28, textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
            <p style={{ fontSize:14, color:C.muted }}>{tl('아직 기록이 없어요.', 'No records yet.')}<br/>{tl('커플 검사나 관계 체크인을 시작해 보세요!', 'Start with a couple test or relationship check-in!')}</p>
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
                          <span style={{ fontSize:12, fontWeight:700, color:C.rose }}>{item.score}{tl('점', '')}</span>
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
const CHECKIN_QUESTIONS = COUPLE_LANG === 'en' ? [
  "I have been having enough conversations with my partner recently",
  "I feel that my partner understands me well",
  "We can resolve conflicts in a healthy way",
  "I have enough time together with my partner",
  "We can picture our future together",
  "I can honestly express my feelings to my partner",
  "I feel that we support and encourage each other enough",
  "My relationship with my partner has a positive impact on my life",
  "I can feel my partner's effort and consideration",
  "Overall, I am satisfied with our relationship",
] : [
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

const SCORE_LABELS = COUPLE_LANG === 'en'
  ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
  : ['매우 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];

function checkinScoreInfo(score, maxScore) {
  const pct = Math.round(score / maxScore * 100);
  if (pct >= 80) return { emoji: '💚', label: tl('매우 건강한 관계', 'Very Healthy Relationship'), color: '#4A9A5A', pale: '#EAF5EC' };
  if (pct >= 60) return { emoji: '💛', label: tl('좋은 관계 (성장 중)', 'Good Relationship (Growing)'), color: '#C4954A', pale: '#FEF8EC' };
  if (pct >= 40) return { emoji: '🧡', label: tl('함께 노력이 필요해요', 'Needs Effort Together'), color: '#D4634A', pale: '#FEF0EC' };
  return { emoji: '❤️‍🩹', label: tl('더 많은 관심이 필요한 시기', 'Time for More Attention'), color: C.rose, pale: C.rosePale };
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
        setError(res.error || tl('저장 실패', 'Save failed'));
      }
    } catch { setError(tl('서버 오류', 'Server error')); }
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
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>📈 {tl('관계 건강도 트렌드', 'Relationship Health Trend')}</div>

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
                {Math.round(points[points.length-1].score / MAX * 100)}{tl('점', '')}
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: info.color, minWidth: 36 }}>{pct}{tl('점', '')}</span>
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
              {diff >= 0 ? tl(`📈 지난 달 대비 +${diff}점 향상됐어요! 🎉`, `📈 Improved by +${diff} points from last month! 🎉`) : tl(`📉 지난 달보다 ${Math.abs(diff)}점 낮아요. 함께 노력해봐요 💪`, `📉 ${Math.abs(diff)} points lower than last month. Let's work on it together 💪`)}
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
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('관계 성장 체크인', 'Relationship Growth Check-in')}</span></button>
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
                {tl('이번 달 관계 성장 체크인', 'This Month\'s Relationship Check-in')}
              </h2>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
                {tl('10가지 질문으로 지금 우리 관계의 건강도를 점검해보세요.', 'Check your relationship health with 10 questions.')}<br/>
                {tl('매달 기록하면 성장 과정을 볼 수 있어요.', 'Recording monthly lets you see your growth over time.')}
              </p>
            </div>

            {doneThisMonth ? (
              <div style={{
                padding: '16px', borderRadius: 14, background: '#EAF5EC',
                border: '1px solid #4A9A5A33', textAlign: 'center', marginBottom: 20,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4A9A5A' }}>{tl('이번 달 체크인 완료!', 'This Month\'s Check-in Done!')}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{tl('다음 체크인은 다음 달에 할 수 있어요.', 'Next check-in available next month.')}</div>
              </div>
            ) : (
              <button onClick={() => setStep(0)} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, #4A9A5A, #7ABAA8)`,
                color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16,
                fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: '0 8px 24px #4A9A5A44',
              }}>🌱 {tl('이번 달 체크인 시작하기', 'Start This Month\'s Check-in')}</button>
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
                    padding: '14px 20px', borderRadius: 14, cursor: 'pointer',
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
              }}>{submitting ? tl('저장 중...', 'Saving...') : tl('✅ 체크인 완료하기', '✅ Complete Check-in')}</button>
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
              <div style={{ fontSize: 12, color: info.color, fontWeight: 700, marginBottom: 4 }}>{tl('이번 달 관계 건강도', 'This Month\'s Relationship Health')}</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: info.color, marginBottom: 4 }}>{pct}<span style={{ fontSize: 20 }}>{tl('점', '')}</span></div>
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
                {pct >= 80 && tl('두 사람의 관계가 매우 건강하게 유지되고 있어요! 지금의 모습을 계속 이어가 보세요. 💕', 'Your relationship is very healthy! Keep it up just as you are. 💕')}
                {pct >= 60 && pct < 80 && tl('전반적으로 좋은 관계를 유지하고 있어요. 조금 더 신경 쓰고 싶은 부분을 함께 이야기해보세요. 🌱', 'Overall a good relationship. Talk together about areas you\'d like to improve a bit. 🌱')}
                {pct >= 40 && pct < 60 && tl('개선이 필요한 부분이 보여요. 파트너와 솔직하게 대화해보는 시간을 가져보세요. 💬', 'There are areas that need improvement. Take time to have an honest conversation with your partner. 💬')}
                {pct < 40 && tl('지금은 관계에 더 많은 관심이 필요한 시기예요. 전문 상담사와 함께 점검해보는 것도 좋아요. 💆', 'This is a time when your relationship needs more attention. It may help to check in with a professional counselor. 💆')}
              </div>
              <button onClick={onBack} style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1px solid #E0D0D8', cursor: 'pointer',
                background: 'white', color: C.muted, fontSize: 12,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>← {tl('홈으로 돌아가기', 'Back to Home')}</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── DateCourseView ────────────────────────────────────────
const DATE_REGIONS   = COUPLE_LANG === 'en'
  ? ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Jeju', 'Gyeonggi', 'Gangwon']
  : ['서울', '부산', '대구', '인천', '광주', '제주', '경기', '강원'];
const DATE_MOODS     = COUPLE_LANG === 'en' ? [
  { key: '🌹 Romantic', desc: 'Atmospheric restaurant, night view, wine' },
  { key: '⚡ Active', desc: 'Sports, activities, games' },
  { key: '🌿 Healing', desc: 'Nature, café, walk, hot spring' },
  { key: '🎨 Cultural', desc: 'Exhibition, performance, movie, museum' },
] : [
  { key: '🌹 로맨틱', desc: '분위기 있는 레스토랑, 야경, 와인' },
  { key: '⚡ 활동적', desc: '스포츠, 액티비티, 게임' },
  { key: '🌿 힐링', desc: '자연, 카페, 산책, 온천' },
  { key: '🎨 문화예술', desc: '전시, 공연, 영화, 미술관' },
];
const DATE_DURATIONS = COUPLE_LANG === 'en'
  ? ['Half Day (3~4 hrs)', 'Full Day (6~8 hrs)', 'Overnight (2 Days)']
  : ['반나절 (3~4시간)', '하루 (6~8시간)', '1박 2일'];
const DATE_BUDGETS   = COUPLE_LANG === 'en'
  ? ['Budget (Under ₩50K)', 'Regular (₩50K~150K)', 'Special (₩150K+)']
  : ['알뜰 (5만원 이하)', '보통 (5~15만원)', '특별 (15만원 이상)'];

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
        setError(tl(`크레딧이 부족합니다. (필요: ${COST}cr)`, `Insufficient credits. (Required: ${COST}cr)`));
      } else {
        setError(res.error || tl('생성 실패', 'Generation failed'));
      }
    } catch { setError(tl('서버 오류가 발생했습니다.', 'A server error occurred.')); }
    finally { setLoading(false); }
  }

  function shareCourse() {
    const text = `${SERVICE_ICON} ${tl('오늘의 데이트 코스 추천', 'Today\'s Date Course Recommendation')} (${region}, ${mood})\n\n${course}\n\n${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl('데이트 코스 추천', 'Date Course Recommendation'), text }).catch(() => {})
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
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('AI 데이트 코스 추천', 'AI Date Course Recommendation')}</span></button>
        {!isMaster && <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>{COST}cr</span>}
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
        {!course ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🗺️</div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
                {tl('조건을 선택하면 AI가 딱 맞는', 'Select your preferences and AI will recommend')}<br/>{tl('데이트 코스를 추천해드려요!', 'the perfect date course for you!')}
              </p>
            </div>

            {/* 지역 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>📍 {tl('어디서?', 'Where?')}</div>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>✨ {tl('어떤 분위기?', 'What Mood?')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DATE_MOODS.map(m => (
                  <button key={m.key} onClick={() => setMood(m.key)} style={{
                    padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
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
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>⏰ {tl('얼마나?', 'How Long?')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DATE_DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    padding: '11px 16px', borderRadius: 12, cursor: 'pointer',
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
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>💰 {tl('예산은?', 'Budget?')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DATE_BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
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
                💸 {tl(`크레딧이 부족합니다. (필요: ${COST}cr / 보유: ${credits}cr)`, `Insufficient credits. (Required: ${COST}cr / Balance: ${credits}cr)`)}
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
              {loading ? tl('🗺️ AI가 코스 만드는 중...', '🗺️ AI is creating your course...') : `🗺️ ${tl('데이트 코스 추천받기', 'Get Date Course Recommendation')} ${isMaster ? tl('(무료)', '(Free)') : `(${COST}cr)`}`}
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
              }}>📤 {tl('파트너와 공유', 'Share with Partner')}</button>
              <button onClick={() => setCourse('')} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.roseL}44`, cursor: 'pointer',
                background: 'white', color: C.rose, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>🔄 {tl('다시 추천받기', 'Get New Recommendation')}</button>
            </div>
            <button onClick={onBack} style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
              border: '1px solid #E0D0D8', cursor: 'pointer',
              background: 'white', color: C.muted, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>← {tl('홈으로', 'Home')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EmotionTranslateView — 감정 번역기 ──────────────────────
function EmotionTranslateView({ credits, isMaster, onBack }) {
  const [situation, setSituation] = useState('');
  const [message, setMessage]     = useState('');
  const [result, setResult]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const COST = 1;

  const handleTranslate = async () => {
    if (!message.trim()) { setError(tl('말을 입력해주세요', 'Please enter a message')); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await api.post('/api/couple/emotion-translate', { situation, message });
      if (!res.success) { setError(res.error || tl('분석 실패', 'Analysis failed')); }
      else setResult(res.result);
    } catch { setError(tl('오류가 발생했습니다', 'An error occurred')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>
        {/* 헤더 */}
        <div style={{ background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`, padding: '20px 20px 24px', color: 'white' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← {tl('돌아가기','Back')}</button>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💬</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{tl('감정 번역기','Emotion Translator')}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>{tl('"그냥 됐어"의 진짜 의미가 궁금할 때','"What did they really mean?" — find out here')}</p>
          <div style={{ marginTop: 10, fontSize: 11, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', display: 'inline-block' }}>
            {isMaster ? tl('무료', 'Free') : `${COST}cr / ${tl('회','use')}`}
          </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          {/* 상황 입력 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {tl('상황 설명 (선택)','Context (optional)')}
            </label>
            <input value={situation} onChange={e => setSituation(e.target.value)}
              placeholder={tl('예: 데이트 약속을 취소했을 때', 'e.g. After cancelling a date plan')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.roseL}55`, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {/* 말 입력 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {tl('상대방이 한 말','What they said')} <span style={{ color: C.rose }}>*</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder={tl('예: 그냥 됐어. 나 혼자 할게.', 'e.g. "Never mind. I\'ll do it alone."')}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.roseL}55`, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{error}</div>}

          <button onClick={handleTranslate} disabled={loading || !message.trim()}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: loading || !message.trim() ? 'default' : 'pointer',
              background: loading || !message.trim() ? '#e0e0e0' : `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
              color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Noto Sans KR',sans-serif" }}>
            {loading ? tl('분석 중...', 'Analyzing...') : tl(`💬 번역하기${isMaster ? '' : ` (${COST}cr)`}`, `💬 Translate${isMaster ? '' : ` (${COST}cr)`}`)}
          </button>

          {/* 결과 */}
          {result && (
            <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${C.roseL}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.rose, marginBottom: 10 }}>💡 {tl('번역 결과','Translation Result')}</div>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FightMediateView — 싸움 중재 AI ─────────────────────────
function FightMediateView({ credits, isMaster, onBack }) {
  const [situation, setSituation] = useState('');
  const [myFeel, setMyFeel]       = useState('');
  const [partnerFeel, setPartnerFeel] = useState('');
  const [result, setResult]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const COST = 2;

  const handleMediate = async () => {
    if (!situation.trim()) { setError(tl('상황을 입력해주세요', 'Please describe the situation')); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await api.post('/api/couple/fight-mediate', { situation, myFeel, partnerFeel });
      if (!res.success) { setError(res.error || tl('중재 실패', 'Mediation failed')); }
      else setResult(res.result);
    } catch { setError(tl('오류가 발생했습니다', 'An error occurred')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>
        {/* 헤더 */}
        <div style={{ background: `linear-gradient(135deg, #7A6EA8, #A89ED4)`, padding: '20px 20px 24px', color: 'white' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← {tl('돌아가기','Back')}</button>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🕊️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{tl('싸움 중재 AI','Fight Mediator')}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>{tl('두 사람 모두 맞을 수 있어요. 중립적으로 정리해드릴게요.','Both sides can be right. Let\'s sort it out together.')}</p>
          <div style={{ marginTop: 10, fontSize: 11, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', display: 'inline-block' }}>
            {isMaster ? tl('무료', 'Free') : `${COST}cr / ${tl('회','use')}`}
          </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          <div style={{ background: '#F0EEF8', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.lavender }}>
            💜 {tl('AI는 어느 쪽 편도 들지 않습니다. 두 분 모두 이해받을 수 있도록 도와드립니다.', 'AI stays neutral — it helps both of you feel understood.')}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {tl('어떤 일이 있었나요?','What happened?')} <span style={{ color: C.rose }}>*</span>
            </label>
            <textarea value={situation} onChange={e => setSituation(e.target.value)}
              placeholder={tl('예: 내가 약속 시간에 30분 늦었고, 상대방이 화를 냈어요.', 'e.g. I was 30 minutes late and my partner got upset.')}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.lavL}55`, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {tl('내가 느낀 감정 (선택)','My feelings (optional)')}
            </label>
            <input value={myFeel} onChange={e => setMyFeel(e.target.value)}
              placeholder={tl('예: 억울하고 답답했어요', 'e.g. I felt misunderstood and frustrated')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.lavL}55`, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              {tl('상대방 감정 (선택, 추정해도 괜찮아요)','Partner\'s feelings (optional, guessing is ok)')}
            </label>
            <input value={partnerFeel} onChange={e => setPartnerFeel(e.target.value)}
              placeholder={tl('예: 기다리면서 서운했던 것 같아요', 'e.g. I think they felt hurt waiting for me')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.lavL}55`, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{error}</div>}

          <button onClick={handleMediate} disabled={loading || !situation.trim()}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: loading || !situation.trim() ? 'default' : 'pointer',
              background: loading || !situation.trim() ? '#e0e0e0' : 'linear-gradient(135deg, #7A6EA8, #A89ED4)',
              color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Noto Sans KR',sans-serif" }}>
            {loading ? tl('중재 중...', 'Mediating...') : tl(`🕊️ 중재 시작${isMaster ? '' : ` (${COST}cr)`}`, `🕊️ Start Mediation${isMaster ? '' : ` (${COST}cr)`}`)}
          </button>

          {result && (
            <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${C.lavL}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.lavender, marginBottom: 10 }}>🕊️ {tl('중재 결과','Mediation Result')}</div>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KakaoAnalysisView — 카톡 대화 분석 ───────────────────────
function KakaoAnalysisView({ credits, isMaster, onBack }) {
  const [stats, setStats]   = useState(null);
  const [sample, setSample] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [fileName, setFileName] = useState('');
  const COST = 3;

  // 카카오톡 내보내기 txt 파싱
  const parseKakao = (text) => {
    const lines = text.split('\n');
    const counts = {}, chars = {};
    const sampleLines = [];
    // 패턴: "YYYY년 MM월 DD일" 또는 "[이름] [오전/오후 HH:MM] 내용"
    const msgRegex = /^\[(.+?)\]\s*\[(?:오전|오후|AM|PM)\s*\d{1,2}:\d{2}\]\s*(.+)/;
    let days = 0;
    const daySet = new Set();

    for (const line of lines) {
      const dateMatch = line.match(/(\d{4})\.\s*\d{1,2}\.\s*\d{1,2}/);
      if (dateMatch) { daySet.add(dateMatch[0]); continue; }
      const m = line.match(msgRegex);
      if (m) {
        const name = m[1].trim(), content = m[2].trim();
        if (!counts[name]) { counts[name] = 0; chars[name] = 0; }
        counts[name]++;
        chars[name] += content.length;
        if (sampleLines.length < 30) sampleLines.push(`${name}: ${content}`);
      }
    }

    const names = Object.keys(counts);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { names, counts, chars, total, days: daySet.size || 1 };
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) { setError(tl('카카오톡 내보내기 .txt 파일만 가능합니다', 'Only KakaoTalk .txt export files are supported')); return; }
    setFileName(file.name); setError(''); setStats(null); setResult('');
    const reader = new FileReader();
    reader.onerror = () => setError(tl('파일을 읽을 수 없습니다. 다시 시도해주세요.', 'Could not read the file. Please try again.'));
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseKakao(text);
      if (!parsed.names.length) { setError(tl('대화 내용을 찾을 수 없습니다. 카카오톡 내보내기 형식(.txt)인지 확인해주세요.', 'No messages found. Please check the file is a KakaoTalk export.')); return; }
      // 샘플: 중간 30개 메시지
      const lines = text.split('\n');
      const msgLines = lines.filter(l => /^\[.+\] \[(?:오전|오후|AM|PM)/.test(l));
      const mid = Math.floor(msgLines.length / 2);
      const s = msgLines.slice(Math.max(0, mid - 15), mid + 15).map(l => {
        const m = l.match(/^\[(.+?)\] \[.+?\] (.+)/);
        return m ? `${m[1]}: ${m[2]}` : '';
      }).filter(Boolean).join('\n');
      setSample(s);
      setStats(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyze = async () => {
    if (!stats) return;
    setLoading(true); setError(''); setResult('');
    try {
      const res = await api.post('/api/couple/kakao-analyze', { stats, sample });
      if (!res.success) { setError(res.error || tl('분석 실패', 'Analysis failed')); }
      else setResult(res.result);
    } catch { setError(tl('오류가 발생했습니다', 'An error occurred')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'Noto Sans KR',sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>
        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(135deg, #2E8B57, #4A9A5A)', padding: '20px 20px 24px', color: 'white' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← {tl('돌아가기','Back')}</button>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💬</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{tl('카톡 대화 분석','KakaoTalk Analysis')}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>{tl('우리 대화 패턴을 AI가 분석해드려요','AI analyzes your conversation patterns')}</p>
          <div style={{ marginTop: 10, fontSize: 11, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', display: 'inline-block' }}>
            {isMaster ? tl('무료', 'Free') : `${COST}cr / ${tl('회','use')}`}
          </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          {/* 사용법 안내 */}
          <div style={{ background: '#EAF5EC', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#2E8B57', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>📱 {tl('파일 내보내기 방법','How to export')}</div>
            {tl(
              '카카오톡 대화방 → 오른쪽 상단 ≡ → 대화 내보내기 → .txt 파일 저장',
              'KakaoTalk chat room → ≡ top right → Export chat → Save .txt file'
            )}
          </div>

          {/* 파일 업로드 */}
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ border: `2px dashed #4A9A5A55`, borderRadius: 14, padding: '24px 16px', textAlign: 'center',
              background: stats ? '#EAF5EC' : 'white', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stats ? '✅' : '📂'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stats ? '#2E8B57' : C.muted }}>
                {stats ? fileName : tl('여기를 눌러 .txt 파일을 업로드하세요', 'Tap to upload a .txt file')}
              </div>
              {stats && (
                <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                  {tl(`총 ${stats.total.toLocaleString()}개 메시지 · ${stats.days}일치`, `${stats.total.toLocaleString()} messages · ${stats.days} days`)}
                </div>
              )}
            </div>
            <input type="file" accept=".txt" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          {/* 통계 미리보기 */}
          {stats && stats.names.length > 0 && (
            <div style={{ marginTop: 14, background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 }}>{tl('대화 통계','Chat Stats')}</div>
              {stats.names.map(name => {
                const total = Object.values(stats.counts).reduce((a, b) => a + b, 0);
                const pct = Math.round((stats.counts[name] / total) * 100);
                return (
                  <div key={name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      <span style={{ color: C.muted }}>{stats.counts[name].toLocaleString()}개 ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#F0F0F0', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #2E8B57, #4A9A5A)`, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626', marginTop: 12 }}>{error}</div>}

          {stats && (
            <button onClick={handleAnalyze} disabled={loading}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: loading ? 'default' : 'pointer', marginTop: 14,
                background: loading ? '#e0e0e0' : 'linear-gradient(135deg, #2E8B57, #4A9A5A)',
                color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Noto Sans KR',sans-serif" }}>
              {loading ? tl('분석 중...', 'Analyzing...') : tl(`🔍 AI 분석 시작${isMaster ? '' : ` (${COST}cr)`}`, `🔍 Analyze${isMaster ? '' : ` (${COST}cr)`}`)}
            </button>
          )}

          {result && (
            <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #4A9A5A33' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2E8B57', marginBottom: 10 }}>📊 {tl('분석 결과','Analysis Result')}</div>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div>
            </div>
          )}
        </div>
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
        setError(res.error || tl('분석 생성 실패', 'Analysis generation failed'));
      }
    } catch { setError(tl('서버 오류가 발생했습니다.', 'A server error occurred.')); }
    finally { setLoading(false); }
  }

  function shareReport() {
    const text = `${SERVICE_ICON} ${SERVICE_NAME} — ${tl('나의 연애 성향 분석', 'My Love Tendency Analysis')}\n\n${report.slice(0, 200)}...\n\n${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl('나의 연애 성향 분석', 'My Love Tendency Analysis'), text }).catch(() => {})
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
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('이상형 성향 분석', 'Ideal Type Analysis')}</span></button>
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
              {tl('나의 이상형 성향 분석', 'My Ideal Type Analysis')}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 28 }}>
              {tl('내 심리검사 결과를 바탕으로 AI가 분석하는', 'AI analysis based on your psychological test results:')}<br/>
              {tl('나의 연애 강점, 잘 맞는 파트너 유형, 성장 포인트', 'your love strengths, best partner type, and growth points')}
            </p>

            {!hasData && (
              <div style={{
                padding: '16px', borderRadius: 14, background: '#FFF8F0',
                border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040', marginBottom: 24, textAlign: 'left',
              }}>
                💡 {tl(`${MAIN_SERVICE_NAME}에서 BIG5, LOST, SDRI 검사를 하나 이상 완료해야 이용할 수 있어요.`, `You need to complete at least one of BIG5, LOST, or SDRI tests on ${MAIN_SERVICE_NAME} to use this feature.`)}
              </div>
            )}

            {hasData && !canAfford && (
              <div style={{
                padding: '14px', borderRadius: 14, background: '#FFF0F0',
                border: '1px solid #FFD0D0', fontSize: 13, color: '#D05555', marginBottom: 24, textAlign: 'left',
              }}>
                💸 {tl(`크레딧이 부족합니다. (필요: ${COST}cr / 보유: ${credits}cr)`, `Insufficient credits. (Required: ${COST}cr / Balance: ${credits}cr)`)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 28 }}>
              {[
                { emoji: '💪', title: tl('나의 연애 강점', 'My Love Strengths'), desc: tl('내가 관계에서 잘하는 것과 매력 포인트', 'What I do well in relationships and my attractive points') },
                { emoji: '💑', title: tl('잘 맞는 파트너 유형', 'Best Partner Type'), desc: tl('나와 궁합이 좋은 성격·행동 유형', 'Personality and behavior types that match well with me') },
                { emoji: '🌱', title: tl('함께 성장할 포인트', 'Growth Points'), desc: tl('더 좋은 관계를 위한 개인 성장 방향', 'Personal growth direction for a better relationship') },
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
              {loading ? tl('🔮 AI가 분석 중...', '🔮 AI is analyzing...') : `🔮 ${tl('분석 시작하기', 'Start Analysis')} ${isMaster ? tl('(무료)', '(Free)') : `(${COST}cr)`}`}
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
                {userName}{tl('님의 연애 성향 분석', '\'s Love Tendency Analysis')}
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
              }}>📤 {tl('결과 공유하기', 'Share Result')}</button>
              <button onClick={onBack} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${C.lavL}44`, cursor: 'pointer',
                background: 'white', color: C.lavender, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>← {tl('홈으로', 'Home')}</button>
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
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>/ 100{tl('점', '')}</div>
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
    if (c.length !== 6) { setError(tl('6자리 코드를 입력해주세요.', 'Please enter a 6-digit code.')); return; }
    setError('');
    const result = await onJoin(c);
    if (!result.success) setError(result.error || tl('참여 실패', 'Join failed'));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={tl("6자리 코드 입력", "Enter 6-digit code")}
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
          {loading ? '...' : tl('참여', 'Join')}
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
        setError(res.error || tl('리포트 생성 실패', 'Report generation failed'));
      }
    } catch { setError(tl('서버 오류가 발생했습니다.', 'A server error occurred.')); }
    finally { setGen(false); }
  }

  // BUG-23 FIX: JSON.parse 예외 처리
  const hasDsi = (() => {
    try { return !!(session?.host_result_json && JSON.parse(session.host_result_json || '{}').dsi); }
    catch { return false; }
  })();
  const testLabel = session?.test_type || 'BIG5+LOST+DSI';
  const hostLabel  = myRole === 'host' ? `${userName} ${tl('(나)', '(Me)')}` : partnerName;
  const guestLabel = myRole === 'guest' ? `${userName} ${tl('(나)', '(Me)')}` : partnerName;

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
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>{tl('결과', 'Result')}</span></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
          💕 {tl('커플 분석 리포트', 'Couple Analysis Report')} {hasDsi && <span style={{ fontSize: 11, background:'#5A8A7A', color:'white', borderRadius:6, padding:'2px 7px', fontWeight:700, marginLeft:4 }}>{tl('자아분화 포함', 'Incl. Differentiation')}</span>}
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
                  {tl('AI가 두 사람의 궁합을 분석하는 중...', 'AI is analyzing your compatibility...')}
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
              💕 {tl('커플 리포트 생성하기', 'Generate Couple Report')}
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
                📤 {tl('리포트 공유하기', 'Share Report')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  const text = `${SERVICE_ICON} ${SERVICE_NAME} ${tl('분석 결과', 'Analysis Result')}\n\n${tl('궁합 점수', 'Compatibility Score')}: ${score}${tl('점', '')} (${scoreLabel(score)})\n\n${report.slice(0, 200)}...\n\n${COUPLE_URL}`;
                  navigator.share ? navigator.share({ title: `${SERVICE_NAME} ${tl('분석 결과', 'Analysis Result')}`, text }) : navigator.clipboard?.writeText(text);
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.roseL}44`,
                  background: C.rosePale, color: C.rose, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  📋 {tl('결과 복사', 'Copy Result')}
                </button>
                <button onClick={() => {
                  const el = document.createElement('a');
                  el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`${SERVICE_NAME} ${tl('분석 리포트', 'Analysis Report')}\n${tl('궁합', 'Compatibility')}: ${score}${tl('점', '')}\n\n${report}`);
                  el.download = `couple_report_${new Date().toISOString().slice(0,10)}.txt`;
                  el.click();
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.lavL}44`,
                  background: C.lavPale, color: C.lavender, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  💾 {tl('텍스트 저장', 'Save as Text')}
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
                💬 {tl('전문 상담사와 더 깊이 나눠보세요', 'Explore Deeper with a Professional Counselor')}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>
                {tl('AI 분석 결과를 바탕으로 커플·부부 전문 상담사와 1:1 심층 상담을 받아보세요.', 'Based on the AI analysis results, get one-on-one in-depth counseling with a couple/marriage specialist.')}
                {tl(' 자아분화 향상 프로그램, Bowen 가족치료 기법 등 전문적인 지원을 받을 수 있습니다.', ' Professional support including differentiation improvement programs and Bowen family therapy techniques is available.')}
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
                  {tl('커플 전문 상담사 예약하기 →', 'Book a Couple Counselor →')}
                </a>
                {hasDsi && (
                  <a href={`${MAUMFUL_URL}/#counseling?type=bowen&score=${score}`} style={{
                    display: 'block', padding: '10px 20px', textAlign: 'center',
                    background: 'white', border: '1.5px solid #5A8A7A44',
                    color: '#5A8A7A', borderRadius: 12,
                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    🪞 {tl('자아분화 전문 상담사 예약하기 →', 'Book a Differentiation Counselor →')}
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
      fireBrowserNotif(tl('💕 두 분 모두 준비 완료!', '💕 Both Ready!'), tl('커플 리포트를 생성할 수 있어요.', 'You can now generate the couple report.'));
      setNotifyBanner(tl('🎉 파트너도 검사를 완료했어요! 아래에서 리포트를 생성해보세요.', '🎉 Your partner has also completed the test! Generate the report below.'));
    } else if (!prev.isGuestDone && isGuestDone && myRole === 'host') {
      fireBrowserNotif(tl('💕 파트너가 참여했어요!', '💕 Your partner joined!'), tl('파트너가 검사를 완료했습니다.', 'Your partner completed the test.'));
      setNotifyBanner(tl('💕 파트너가 검사를 완료했어요!', '💕 Your partner completed the test!'));
    } else if (!prev.isHostDone && isHostDone && myRole === 'guest') {
      fireBrowserNotif(tl('💕 파트너가 검사를 완료했어요!', '💕 Your partner completed the test!'), tl('이제 리포트를 생성할 수 있어요.', 'You can now generate the report.'));
      setNotifyBanner(tl('💕 파트너가 검사를 완료했어요!', '💕 Your partner completed the test!'));
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
    const msg = `${SERVICE_NAME} ${tl('초대코드', 'Invite Code')}: ${code}\n${tl('함께 심리 분석해봐요', 'Let\'s do a psychological analysis together')} ${SERVICE_ICON}\n${COUPLE_URL}/?code=${code}`;
    navigator.clipboard?.writeText(msg).catch(() => {});
  }

  function copyPartnerLink() {
    navigator.clipboard?.writeText(`${MAUMFUL_URL}?partner=${code}`).catch(() => {});
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
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{tl('세션이 만료되었습니다', 'Session Expired')}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{tl('72시간이 지나 세션이 만료되었습니다. 새 세션을 만들어 다시 시작해보세요.', '72 hours have passed and the session has expired. Please create a new session to start again.')}</div>
      </div>
    );
  }

  const lastCheckedText = lastChecked
    ? `${lastChecked.getHours().toString().padStart(2,'0')}:${lastChecked.getMinutes().toString().padStart(2,'0')}:${lastChecked.getSeconds().toString().padStart(2,'0')} ${tl('확인됨', 'checked')}`
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
          {bothDone ? tl('🎉 두 사람 모두 준비 완료!', '🎉 Both Ready!') : tl('파트너를 기다리는 중', 'Waiting for Partner')}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          {bothDone
            ? tl('이제 커플 분석 리포트를 생성할 수 있습니다.', 'You can now generate the couple analysis report.')
            : tl('파트너 링크를 공유하세요. 파트너는 로그인 없이 바로 검사에 참여할 수 있어요.', 'Share the partner link. Your partner can join the test right away without logging in.')}
        </div>

        {/* 진행 상태 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { label: myRole === 'host' ? tl('나 (host)', 'Me (host)') : tl('파트너 A', 'Partner A'), done: isHostDone },
            { label: myRole === 'guest' ? tl('나 (guest)', 'Me (guest)') : tl('파트너 B', 'Partner B'), done: isGuestDone },
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
              <div style={{ fontSize: 11, color: C.muted }}>{tl('파트너에게 공유할 초대코드', 'Invite Code to Share with Partner')}</div>
              {myRole === 'host' && pushActive && (
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600, background: '#D1FAE5', padding: '2px 8px', borderRadius: 100 }}>
                  🔔 {tl('알림 켜짐', 'Notifications On')}
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
              🔗 {tl('파트너 검사 링크 복사 (로그인 불필요)', 'Copy Partner Test Link (No Login Required)')}
            </button>
            <button onClick={copyCode} style={{
              width: '100%', padding: '8px', borderRadius: 10, marginTop: 8,
              border: `1px solid ${C.rose}44`, cursor: 'pointer',
              background: 'white', color: C.rose, fontWeight: 600, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              📋 {SERVICE_NAME} {tl('코드 복사 (계정 있는 파트너)', 'Copy Code (for users with account)')}
            </button>

            {/* 이메일로 초대 */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.rose}22`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{tl('또는 이메일로 직접 초대', 'Or invite directly by email')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && sendInviteEmail()}
                  placeholder={tl('파트너 이메일 주소', "Partner's email address")}
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
                  {emailSending ? '...' : `📨 ${tl('전송', 'Send')}`}
                </button>
              </div>
              {emailResult === 'ok' && (
                <div style={{ fontSize: 11, color: '#4A9A5A', marginTop: 5, fontWeight: 600 }}>{tl('✓ 초대 이메일을 발송했어요!', '✓ Invite email sent!')}</div>
              )}
              {emailResult === 'err' && (
                <div style={{ fontSize: 11, color: '#D4634A', marginTop: 5 }}>{tl('이메일 발송에 실패했습니다. 다시 시도해주세요.', 'Failed to send email. Please try again.')}</div>
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
                <span style={{ fontSize: 11, color: C.rose }}>{tl('파트너 상태 확인 중...', 'Checking partner status...')}</span>
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
            {polling ? '...' : `↻ ${tl('지금 확인', 'Refresh Now')}`}
          </button>
        </div>

        {/* 만료 시간 */}
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 12 }}>
          ⏰ {tl('세션 만료', 'Session Expires')}: {fmtDate(session?.expires_at)}
        </div>

        {/* host만 취소 가능 */}
        {myRole === 'host' && !bothDone && (
          <button onClick={onCancel} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: `1px solid #E0D0D0`,
            background: 'white', color: '#A07070', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', marginBottom: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            {tl('세션 취소하기', 'Cancel Session')}
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
            💕 {tl('커플 리포트 보기', 'View Couple Report')}
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
  const [view, setView]           = useState('hub');  // 'hub' | 'report' | 'miniTest' | 'soloAnalysis' | 'checkin' | 'dateCourse' | 'emotionTranslate' | 'fightMediate' | 'kakaoAnalysis'
  const [tab, setTab]             = useState('home'); // 'home' | 'tools' | 'partner' | 'records'
  const [sessionData, setSession] = useState(null);
  const [partnerName, setPartner] = useState(tl('파트너', 'Partner'));
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
      } else setError(res.error || tl('데이터 조회 실패', 'Failed to load data'));
    } catch { setError(tl('서버 연결 실패', 'Server connection failed')); }
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
        showToast(res.data.isExisting ? tl('기존 세션을 불러왔습니다.', 'Existing session restored.') : tl('세션이 생성되었습니다!', 'Session created!'));
        if (!res.data.isExisting) refreshCredits(); // 크레딧 차감 즉시 반영
      } else if (res.needsCharge) {
        setCredit({ message: res.error, balance: data?.user?.credits });
      } else {
        showToast(res.error || tl('생성 실패', 'Failed to create'));
      }
    } catch { showToast(tl('서버 오류', 'Server error')); }
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
        showToast(tl('세션에 참여했습니다! 💕', 'Joined the session! 💕'));
        // 파트너 이름 조회
        const s = await api.get(`/api/couple/session/${res.data.session.session_code}`);
        if (s.success) setPartner(s.data.partnerName);
      } else {
        return { success: false, error: res.error };
      }
    } catch { return { success: false, error: tl('서버 오류', 'Server error') }; }
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
    if (!window.confirm(tl('세션을 취소하시겠습니까? 크레딧은 환불되지 않습니다.', 'Cancel this session? Credits will not be refunded.'))) return;
    try {
      const res = await api.patch(`/api/couple/session/${sessionData.session_code}/cancel`);
      if (res.success) {
        setSession(null);
        showToast(tl('세션이 취소되었습니다.', 'Session cancelled.'));
        // 크레딧 갱신
        const cr = await api.get('/api/couple/credits');
        if (cr.success) setData(prev => prev ? { ...prev, user: { ...prev.user, credits: cr.data.balance } } : prev);
      } else {
        showToast(res.error || tl('취소 실패', 'Failed to cancel'));
      }
    } catch { showToast(tl('서버 오류', 'Server error')); }
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
      <div style={{ fontSize: 56, animation: 'heartbeat 1.5s ease-in-out infinite' }}>{SERVICE_ICON}</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 16, animation: 'pulse 1.5s infinite' }}>
        {LOADING_TEXT}
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

  // 감정 번역기
  if (view === 'emotionTranslate') {
    return <EmotionTranslateView credits={data?.user?.credits ?? 0} isMaster={data?.isMaster} onBack={() => setView('hub')} />;
  }

  // 싸움 중재 AI
  if (view === 'fightMediate') {
    return <FightMediateView credits={data?.user?.credits ?? 0} isMaster={data?.isMaster} onBack={() => setView('hub')} />;
  }

  // 카톡 대화 분석
  if (view === 'kakaoAnalysis') {
    return <KakaoAnalysisView credits={data?.user?.credits ?? 0} isMaster={data?.isMaster} onBack={() => setView('hub')} />;
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

  // BIG5 비교
  if (view === 'big5Compare') {
    const { testResults } = data || {};
    const myBig5 = testResults?.big5?.data;
    let partnerBig5 = null;
    try {
      const raw = myRole === 'host' ? sessionData?.guest_result_json : sessionData?.host_result_json;
      if (raw) partnerBig5 = JSON.parse(raw).big5;
    } catch {}
    return (
      <Big5CompareView
        myBig5={myBig5}
        partnerBig5={partnerBig5}
        myName={displayName(data?.user)}
        partnerName={partnerName}
        onBack={() => setView('hub')}
      />
    );
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
      }}>{tl(`${MAIN_SERVICE_NAME}로 돌아가기`, `Back to ${MAIN_SERVICE_NAME}`)}</a>
    </div>
  );

  const { user, testResults, recentReports, isMaster } = data || {};
  const hasActive = !!sessionData;
  const hasBig5   = !!testResults?.big5;
  const hasLost   = !!testResults?.lost;
  const hasDsiTest = !!testResults?.dsi;
  const hasAny    = hasBig5 || hasLost || hasDsiTest; // BUG-7 FIX: DSI 포함

  // ── D+day 계산 (홈탭 표시용) ────────────────────────────
  const dDay = (() => {
    const saved = localStorage.getItem('couple_first_date');
    if (!saved) return null;
    const diff = Math.floor((Date.now() - new Date(saved).getTime()) / 86400000);
    return diff >= 0 ? diff + 1 : null;
  })();

  // ── 바텀 탭 메뉴 정의 ─────────────────────────────────
  const NAV_TABS = [
    { key: 'home',    icon: '🏠', label: tl('홈', 'Home') },
    { key: 'tools',   icon: '🔧', label: tl('도구', 'Tools') },
    { key: 'partner', icon: '💕', label: tl('파트너', 'Partner') },
    { key: 'records', icon: '📋', label: tl('기록', 'Records') },
  ];

  // ── 도구 목록 정의 ───────────────────────────────────
  const TOOL_CATEGORIES = [
    {
      title: tl('🤖 AI 도구', '🤖 AI Tools'),
      items: [
        { icon:'💬', label:tl('감정 번역기','Emotion Translator'),   desc:tl('"그냥 됐어"의 진짜 의미','"Never mind" — what did they mean?'), cost:'1cr', view:'emotionTranslate' },
        { icon:'🕊️', label:tl('싸움 중재 AI','Fight Mediator'),       desc:tl('양쪽 입장 정리 + 화해 문구','Neutral mediation & reconciliation tips'), cost:'2cr', view:'fightMediate' },
        { icon:'🤝', label:tl('AI 관계 코치','AI Relationship Coach'), desc:tl('고민 상담 · 관계 조언','Talk through your worries'), cost:null, view:'coach' },
        { icon:'🔮', label:tl('이상형 성향 분석','Ideal Type Analysis'),desc:tl('내 검사 결과 기반 AI 분석','AI analysis from your test results'), cost:isMaster ? null : '5cr', view:'soloAnalysis' },
        { icon:'🗺️', label:tl('데이트 코스 추천','Date Idea Planner'), desc:tl('지역·분위기·예산 맞춤 코스','Personalized date recommendations'), cost:'1cr', view:'dateCourse' },
        { icon:'📊', label:tl('카톡 대화 분석','KakaoTalk Analysis'),  desc:tl('대화 패턴 AI 리포트','.txt 파일 업로드 → 대화 패턴 리포트'), cost:'3cr', view:'kakaoAnalysis' },
      ],
    },
    {
      title: tl('🧪 심리 테스트', '🧪 Psych Tests'),
      items: [
        { icon:'💝', label:tl('연애 유형 테스트','Love Type Test'),    desc:tl('S·R·P·F 4가지 유형 중 나는?','Which love type are you? S·R·P·F'), cost:null, view:'miniTest' },
        { icon:'💛', label:tl('커플 스타일 퀴즈','Couple Style Quiz'), desc:tl('10문항으로 보는 커플 호환성','10-question couple compatibility'), cost:null, view:'quiz' },
      ],
    },
    {
      title: tl('📅 관계 관리', '📅 Relationship'),
      items: [
        { icon:'🌱', label:tl('관계 성장 체크인','Relationship Check-in'), desc:tl('월 1회 관계 건강도 체크','Monthly relationship health check'), cost:null, view:'checkin' },
        { icon:'🗓️', label:tl('기념일 계산기','Anniversary Calculator'),   desc:tl('D+N일 · 기념일 알림','D+N day counter & anniversary tracker'), cost:null, view:'anniversary' },
        { icon:'🗂️', label:tl('관계 타임라인','Relationship Timeline'),    desc:tl('함께한 순간들의 기록','A visual record of your journey'), cost:null, view:'timeline' },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` }}>

      {/* ── 상단 네비게이션 ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.10)',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{SERVICE_ICON}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>{SERVICE_NAME}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, background: C.rosePale, padding: '4px 12px', borderRadius: 100, border: `1px solid ${C.roseL}44` }}>
            ✦ {user?.credits ?? 0}
          </div>
          <button onClick={toggleCoupleLang} title="Language" style={{ fontSize: 12, fontWeight: 700, color: C.muted, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)' }}>{COUPLE_LANG === 'en' ? '한' : 'EN'}</button>
          <a href={MAUMFUL_URL} style={{ fontSize: 12, color: C.muted, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)' }}>{BACK_LABEL}</a>
        </div>
      </nav>

      {/* ── 탭 콘텐츠 ── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* ══════════════ 홈 탭 ══════════════ */}
        {tab === 'home' && (<>

          {/* 인사 + D-day 카드 */}
          <div style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 16, background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`, color: 'white', boxShadow: `0 8px 24px ${C.rose}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 2 }}>{tl(`안녕하세요, ${displayName(user)}님 👋`, `Hello, ${displayName(user)} 👋`)}</div>
                {dDay ? (
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>D+{dDay.toLocaleString()}</div>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{tl('처음 만난 날을 기록해보세요', 'Record your first meeting date')}</div>
                )}
                {dDay && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{tl('함께한 날들 💕', 'Days together 💕')}</div>}
              </div>
              {!dDay && (
                <button onClick={() => setView('anniversary')} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {tl('기록하기 →', 'Set date →')}
                </button>
              )}
            </div>
          </div>

          {/* 오늘의 질문 — 메인 콘텐츠 */}
          <DailyQuestionCard />

          {/* ⑧ 우리의 정원 — 파트너 있을 때만 렌더 */}
          <CoupleGardenCard />

          {/* 빠른 도구 — 가로 스크롤 카드 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>{tl('오늘 바로 써보세요', 'Try these today')}</div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, paddingLeft: 2, paddingRight: 2, scrollbarWidth: 'none' }}>
              {[
                { icon:'💬', label:tl('감정 번역기','Emotion Translator'), desc:tl('말 뒤의 진심','Hidden feelings'), cost:'1cr', view:'emotionTranslate', from:'#FFAFCC', to:'#FFD6E7' },
                { icon:'🕊️', label:tl('싸움 중재','Fight Mediator'),       desc:tl('중립적 중재','Neutral mediation'), cost:'2cr', view:'fightMediate',     from:'#BDB2FF', to:'#D8CFFF' },
                { icon:'🤝', label:tl('AI 코치','AI Coach'),                desc:tl('관계 조언','Relationship tips'), cost:null,  view:'coach',            from:'#FFD6A5', to:'#FFE9CC' },
                { icon:'🗺️', label:tl('데이트 코스','Date Ideas'),          desc:tl('맞춤 코스 추천','Personalized plans'), cost:'1cr', view:'dateCourse',  from:'#FFADAD', to:'#FFD0D0' },
                { icon:'📊', label:tl('카톡 분석','Kakao Analysis'),        desc:tl('대화 패턴 리포트','Chat pattern report'), cost:'3cr', view:'kakaoAnalysis', from:'#CAFFBF', to:'#D9F7CF' },
              ].map(t => (
                <button key={t.view} onClick={() => setView(t.view)} style={{
                  flexShrink: 0, width: 110, borderRadius: 18,
                  border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden',
                  background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontFamily: "'Noto Sans KR',sans-serif", textAlign: 'left',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* 컬러 상단 */}
                  <div style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})`, padding: '16px 12px 12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 30 }}>{t.icon}</span>
                    {t.cost && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 800, color: 'white', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)', padding: '2px 7px', borderRadius: 100, letterSpacing: 0.3 }}>{t.cost}</span>
                    )}
                  </div>
                  {/* 흰 하단 */}
                  <div style={{ padding: '10px 10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.dark, marginBottom: 2, lineHeight: 1.3 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 파트너 마음 일기 */}
          <PartnerMomentsSection />

        </>)}

        {/* ══════════════ 도구 탭 ══════════════ */}
        {tab === 'tools' && (<>
          {TOOL_CATEGORIES.map(cat => (
            <div key={cat.title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>{cat.title}</div>
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {cat.items.map((item, idx) => (
                  <button key={item.view} onClick={() => setView(item.view)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', background: 'white', border: 'none', cursor: 'pointer',
                    borderBottom: idx < cat.items.length - 1 ? '1px solid #F3F4F6' : 'none',
                    fontFamily: "'Noto Sans KR',sans-serif", textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {item.cost && <span style={{ fontSize: 11, fontWeight: 700, color: C.rose, background: C.rosePale, padding: '3px 8px', borderRadius: 100 }}>{item.cost}</span>}
                      <span style={{ color: '#D0D0D0', fontSize: 16 }}>›</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>)}

        {/* ══════════════ 파트너 탭 ══════════════ */}
        {tab === 'partner' && (<>

          {/* 내 검사 결과 현황 */}
          <div style={{ borderRadius: 20, padding: '20px', marginBottom: 16, background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>📋 {tl('내 검사 결과', 'My Test Results')}</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 6 }}>💑 {tl('커플 탐색', 'Couple Exploration')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TestResultBadge type="BIG5" result={testResults?.big5} date={testResults?.big5?.performed_at}/>
                <TestResultBadge type="LOST" result={testResults?.lost} date={testResults?.lost?.performed_at}/>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5A8A7A', marginBottom: 6 }}>👨‍👩‍👧 {tl('관계 심층 분석', 'Deep Analysis')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TestResultBadge type="DSI" result={testResults?.dsi} date={testResults?.dsi?.performed_at}/>
              </div>
            </div>
            {!hasAny && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: '#FFF8F0', border: '1px solid #FFD8A0', fontSize: 12, color: '#A07040', marginTop: 8 }}>
                💡 {tl(`${MAIN_SERVICE_NAME}에서 BIG5, LOST, SDRI 중 하나 이상을 완료해주세요.`, `Complete BIG5, LOST, or SDRI on ${MAIN_SERVICE_NAME} first.`)}
              </div>
            )}
            {hasAny && (() => {
              const missing = ['BIG5','LOST','DSI'].filter(t => !{BIG5:testResults?.big5,LOST:testResults?.lost,DSI:testResults?.dsi}[t]);
              return missing.length > 0 ? (
                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#FFFBF0', border: '1px solid #FFE8A0', fontSize: 11, color: '#9A7030', marginTop: 8 }}>
                  💡 {missing.map((t, i) => <React.Fragment key={t}><a href={`${MAUMFUL_URL}?start=${t}`} style={{ color: C.rose, fontWeight: 700, textDecoration: 'none' }}>{t}</a>{i < missing.length - 1 && ' + '}</React.Fragment>)} {tl('추가 시 더 정밀한 분석 →', 'for more precise analysis →')}
                </div>
              ) : null;
            })()}
          </div>

          {/* BIG5 비교 버튼 */}
          {(() => {
            let hasPartnerBig5 = false;
            try {
              const raw = myRole === 'host' ? sessionData?.guest_result_json : sessionData?.host_result_json;
              if (raw) hasPartnerBig5 = !!JSON.parse(raw).big5;
            } catch {}
            const canCompare = !!(testResults?.big5) && hasPartnerBig5;
            return (
              <button onClick={() => {
                if (!testResults?.big5) { alert(tl(`${MAIN_SERVICE_NAME}에서 BIG5 검사를 먼저 완료해 주세요.`, `Please complete BIG5 on ${MAIN_SERVICE_NAME} first.`)); return; }
                if (!hasPartnerBig5) { alert(tl('파트너도 BIG5 검사를 완료해야 합니다.', 'Partner also needs to complete BIG5.')); return; }
                setView('big5Compare');
              }} style={{
                width: '100%', padding: '14px 16px', borderRadius: 16, cursor: 'pointer', marginBottom: 16,
                border: canCompare ? `1.5px solid ${C.rose}55` : '1px solid #E0E0E0',
                background: canCompare ? `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})` : '#F8F8F8',
                color: canCompare ? C.rose : C.muted, fontWeight: 700, fontSize: 13,
                fontFamily: "'Noto Sans KR',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>🧬 {tl('BIG5 커플 비교', 'BIG5 Couple Comparison')}</span>
                <span style={{ fontSize: 11, fontWeight: 400 }}>{canCompare ? tl('결과 준비 완료 ✓','Ready ✓') : tl('파트너 결과 필요','Partner results needed')}</span>
              </button>
            );
          })()}

          {/* 커플 세션 */}
          {hasActive ? (
            <SessionWaitingView session={sessionData} myRole={myRole} onRefresh={refreshSession} onReport={() => setView('report')} onCancel={handleCancelSession} />
          ) : (
            <div style={{ borderRadius: 20, padding: '20px', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>💑 {tl('커플 분석 시작하기', 'Start Couple Analysis')}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>{tl('검사 조합을 선택해 세션을 만들거나, 파트너가 보낸 코드로 참여하세요.', 'Choose a test combination or join with your partner\'s code.')}</div>
              {hasAny && (() => {
                const coupleOptions = [
                  ...(testResults?.big5 && testResults?.lost ? [{ key:'BIG5+LOST', label:'BIG5 + LOST', badge:tl('추천','Recommended'), cost:COST_TWO, desc:tl('성격·행동유형 비교','Personality & behavior comparison'), color:C.rose }] : []),
                  ...(testResults?.big5 && !testResults?.lost ? [{ key:'BIG5', label:'BIG5', badge:null, cost:COST_ONE, desc:tl('성격 5요인 비교','Big Five comparison'), color:C.rose }] : []),
                  ...(!testResults?.big5 && testResults?.lost ? [{ key:'LOST', label:'LOST', badge:null, cost:COST_ONE, desc:tl('행동유형 비교','Behavior type comparison'), color:C.lavender }] : []),
                ];
                const deepOptions = !testResults?.dsi ? [] : [
                  ...(testResults?.big5 && testResults?.lost ? [{ key:'BIG5+LOST+DSI', label:tl('BIG5 + LOST + 자아분화','BIG5 + LOST + Self-Diff.'), badge:tl('추천','Recommended'), cost:COST_FULL, desc:tl('성격·행동·자아분화 통합 (부부상담 최적)','Full integrated analysis (couples/marriage)'), color:'#5A8A7A' }] : []),
                  ...(testResults?.big5 && !testResults?.lost ? [{ key:'BIG5+DSI', label:tl('BIG5 + 자아분화','BIG5 + Self-Diff.'), badge:tl('추천','Recommended'), cost:COST_TWO, desc:tl('성격·분화 수준 비교','Personality & differentiation comparison'), color:'#5A8A7A' }] : []),
                  ...(!testResults?.big5 && testResults?.lost ? [{ key:'LOST+DSI', label:tl('LOST + 자아분화','LOST + Self-Diff.'), badge:tl('추천','Recommended'), cost:COST_TWO, desc:tl('행동유형·분화 수준 비교','Behavior & differentiation comparison'), color:'#5A8A7A' }] : []),
                  ...(!testResults?.big5 && !testResults?.lost ? [{ key:'DSI', label:tl('자아분화','Self-Diff.'), badge:null, cost:COST_ONE, desc:tl('관계 분화 수준 분석','Relationship differentiation analysis'), color:'#5A8A7A' }] : []),
                ];
                const renderOpts = (opts) => (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {opts.map(opt => (
                      <button key={opt.key} onClick={() => handleCreateSession(opt.key)} disabled={creating} style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${opt.color}33`, background:opt.badge?`${opt.color}08`:'white', cursor:'pointer', textAlign:'left', opacity:creating?0.7:1, fontFamily:"'Noto Sans KR',sans-serif" }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div>
                            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{opt.label}</span>
                            {opt.badge && <span style={{ marginLeft:6, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:100, background:opt.color, color:'white' }}>{opt.badge}</span>}
                            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{opt.desc}</div>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:opt.color, flexShrink:0, marginLeft:12 }}>{isMaster?tl('무료','Free'):`${opt.cost}cr`}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
                return (
                  <div style={{ marginBottom:16 }}>
                    {coupleOptions.length > 0 && <div style={{ marginBottom:14 }}><div style={{ fontSize:12, fontWeight:700, color:C.rose, marginBottom:6 }}>💑 {tl('커플 탐색','Couple Exploration')}</div>{renderOpts(coupleOptions)}</div>}
                    {deepOptions.length > 0 && <div><div style={{ fontSize:12, fontWeight:700, color:'#5A8A7A', marginBottom:6 }}>👨‍👩‍👧 {tl('관계 심층 분석','Deep Analysis')}</div>{renderOpts(deepOptions)}</div>}
                  </div>
                );
              })()}
              {!hasAny && <div style={{ padding:'12px 14px', borderRadius:12, background:'#FFF8F0', border:'1px solid #FFD8A0', fontSize:12, color:'#A07040', marginBottom:16 }}>💡 {tl(`${MAIN_SERVICE_NAME}에서 BIG5, LOST, SDRI 중 하나 이상을 완료해주세요.`,`Complete at least one of BIG5, LOST, or SDRI on ${MAIN_SERVICE_NAME}.`)}</div>}
              <div style={{ padding:'14px', borderRadius:14, background:C.lavPale, border:`1px solid ${C.lavL}33` }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.lavender, marginBottom:10 }}>📨 {tl('파트너 코드로 참여하기','Join with Partner Code')}</div>
                <CodeInput onJoin={handleJoin} loading={joining}/>
              </div>
            </div>
          )}

        </>)}

        {/* ══════════════ 기록 탭 ══════════════ */}
        {tab === 'records' && (<>
          {recentReports?.length > 0 ? (
            <div style={{ borderRadius: 20, padding: '20px', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 10 }}>📜 {tl('분석 리포트 기록', 'Analysis Reports')}</div>
              {recentReports.length >= 2 && (() => {
                const scores = [...recentReports].reverse().map(r => r.compatibility_score || 0);
                const latest = scores[scores.length - 1];
                const prev   = scores[scores.length - 2];
                const diff   = latest - prev;
                return (
                  <div style={{ padding:'12px 14px', borderRadius:12, marginBottom:14, background:diff>=0?'#EAF5EC':'#FEF0EC', border:`1px solid ${diff>=0?'#4A9A5A':'#D4634A'}22`, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:24 }}>{diff>=0?'📈':'📉'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:diff>=0?'#4A9A5A':'#D4634A' }}>{tl('궁합 점수','Compatibility')} {diff>=0?`+${diff}`:diff}{tl('점','')} {tl('변화','change')}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{diff>=0?tl('함께 성장하고 있어요 🌱','Growing together 🌱'):tl('더 깊이 이해하는 과정이에요 💪','Deepening understanding 💪')}</div>
                    </div>
                    <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:32, flex:0.4 }}>
                      {scores.map((s, i) => <div key={i} style={{ flex:1, borderRadius:4, height:`${Math.max(20,s)}%`, background:i===scores.length-1?(diff>=0?'#4A9A5A':'#D4634A'):C.roseL+'66', minHeight:6, maxHeight:32 }}/>)}
                    </div>
                  </div>
                );
              })()}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {recentReports.map(r => (
                  <button key={r.id} onClick={() => { setSession(r); setView('report'); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.roseL}33`, background:C.rosePale, cursor:'pointer', textAlign:'left', fontFamily:"'Noto Sans KR',sans-serif" }}>
                    <div style={{ width:44, height:44, borderRadius:100, background:`linear-gradient(135deg, ${scoreColor(r.compatibility_score||0)}, ${C.roseL})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'white', flexShrink:0 }}>{r.compatibility_score||'?'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.dark }}>{r.test_type} {tl('분석','Analysis')} · {scoreLabel(r.compatibility_score||0)}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{fmtDate(r.created_at)}</div>
                    </div>
                    <span style={{ color:'#D0D0D0', fontSize:16 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:6 }}>{tl('아직 분석 기록이 없어요','No analysis records yet')}</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>{tl('파트너 탭에서 커플 분석을 시작해보세요','Start a couple analysis from the Partner tab')}</div>
              <button onClick={() => setTab('partner')} style={{ padding:'12px 24px', borderRadius:12, border:'none', background:C.rose, color:'white', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>{tl('파트너 탭으로 →','Go to Partner tab →')}</button>
            </div>
          )}
        </>)}

      </div>

      {/* ── 바텀 내비게이션 ── */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', zIndex:100, background:'rgba(253,252,247,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(181,85,106,0.10)', display:'flex', height:64, maxWidth:640 }}>
        {NAV_TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setView('hub'); }} style={{
            flex:1, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
            background:'none', border:'none', cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
            transition:'all 0.15s',
          }}>
            <span style={{ fontSize:20, opacity: tab === t.key ? 1 : 0.45, transform: tab === t.key ? 'scale(1.15)' : 'scale(1)', transition:'all 0.15s' }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color: tab === t.key ? C.rose : C.muted, transition:'color 0.15s' }}>{t.label}</span>
            {tab === t.key && <div style={{ position:'absolute', bottom:0, width:28, height:2.5, background:C.rose, borderRadius:2 }}/>}
          </button>
        ))}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{tl('크레딧 부족', 'Insufficient Credits')}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              {creditModal.message}
            </div>
            <a href={`${MAUMFUL_URL}/#charge`} style={{
              display: 'block', padding: '12px', borderRadius: 12,
              background: C.rose, color: 'white', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', marginBottom: 10,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>{tl(`${MAIN_SERVICE_NAME}에서 충전하기`, `Top up on ${MAIN_SERVICE_NAME}`)}</a>
            <button onClick={() => setCredit(null)} style={{
              background: 'none', border: 'none', color: C.muted,
              fontSize: 13, cursor: 'pointer', padding: '8px',
            }}>{tl('취소', 'Cancel')}</button>
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
