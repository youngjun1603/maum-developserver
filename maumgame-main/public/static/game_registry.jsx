// ============================================================
// game_registry.jsx  —  게임 플러그인 등록소
// 새 게임 추가 = 이 파일에 GAME_MANIFEST 하나 추가
// ============================================================

// ── 게임 매니페스트 표준 인터페이스 ─────────────────────────
// 모든 게임은 아래 구조를 따른다
/*
{
  id:            string,       // 고유 ID (소문자, 언더스코어)
  name:          string,       // 표시 이름
  emoji:         string,       // 대표 이모지
  tagline:       string,       // 한 줄 소개
  description:   string,       // 상세 설명
  tags:          string[],     // ['이완','인지교정','감정인식']
  requiredTests: string[],     // 필수 검사 (없으면 항상 해금)
  suggestedFor:  string,       // 추천 대상 설명
  creditCost:    number,       // 0 = 무료
  unlockLevel:   number,       // 필요 정원 레벨
  isAvailable:   boolean,      // false = "준비 중"
  Component:     Function|null // 실제 React 컴포넌트 (해당 jsx 로드 후 채워짐)
}
*/

const GAME_REGISTRY = [

  // ── 감정 수채화 (0호 — Lv.1 기본 제공) ─────────────────
  {
    id:            'mood',
    name:          '감정 수채화',
    emoji:         '🎨',
    tagline:       '매일 내 감정을 그려요',
    description:   '매일 하루 한 번, 지금의 감정을 기록해보세요. 감정을 알아차리는 것이 치유의 시작입니다. 30일간의 감정 흐름을 수채화로 확인해요.',
    tags:          ['감정인식', '마음챙김', '습관'],
    requiredTests: [],
    suggestedFor:  '감정을 기록하고 싶은 분, 내 마음 상태를 파악하고 싶은 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'checkin',  name:'오늘의 감정', emoji:'🎨', desc:'오늘 가장 크게 느끼는 감정 기록' },
      { id:'calendar', name:'감정 달력',   emoji:'📅', desc:'30일 감정 흐름 수채화로 보기' },
    ],
    Component: typeof MoodGame !== 'undefined' ? MoodGame : null,
  },

  // ── 마음의 정원 (1호 게임) ──────────────────────────────
  {
    id:            'garden',
    name:          '마음의 정원',
    emoji:         '🌿',
    tagline:       '내 마음을 가꾸는 정원',
    description:   'PHQ-9·SCT 검사 결과를 바탕으로 나만의 정원을 가꾸세요. 호흡 훈련과 인지 교정을 통해 안개 낀 정원이 점차 맑아집니다.',
    tags:          ['이완', '인지교정', '호흡'],
    requiredTests: [],          // 검사 없어도 시작 가능 (있으면 더 풍성)
    suggestedFor:  '우울·불안 점수가 높은 분, 스트레스 해소가 필요한 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'breathing', name:'숨 쉬는 호수',   emoji:'💧', desc:'4-4-4 호흡법으로 마음을 고요하게' },
      { id:'cbt',       name:'생각의 가지치기', emoji:'🌱', desc:'부정적인 생각을 긍정 확언으로 변환' },
    ],
    Component:     typeof GardenGame !== 'undefined' ? GardenGame : null,
  },

  // ── 감정꽃 찾기 (2호 예정) ─────────────────────────────
  {
    id:            'efmt',
    name:          '감정꽃 찾기',
    emoji:         '🌸',
    tagline:       '감정을 알아채는 훈련',
    description:   '다양한 표정의 꽃 중에서 웃는 꽃을 빠르게 찾아내는 감정 인지 훈련. PHQ-9 점수에 따라 난이도가 조절됩니다.',
    tags:          ['감정인식', '집중력', '인지훈련'],
    requiredTests: ['PHQ9'],
    suggestedFor:  '감정 인식이 어려운 분, 집중력 향상이 필요한 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'efmt_easy',   name:'기초 감정 인식', emoji:'🌼', desc:'4x4 그리드에서 웃는 꽃 찾기' },
      { id:'efmt_speed',  name:'감정 속도 훈련', emoji:'🌺', desc:'빠르게 반응하는 감정 인지' },
    ],
    Component: typeof EFMTGame !== 'undefined' ? EFMTGame : null,
  },

  // ── 별빛 감사 일기 (3호) ────────────────────────────────
  {
    id:            'gratitude',
    name:          '별빛 감사 일기',
    emoji:         '⭐',
    tagline:       '감사의 별 3개를 밤하늘에 밝혀요',
    description:   '매일 3가지 감사 질문에 답하며 밤하늘에 별을 밝히는 마음챙김 게임. 긍정심리학 기반의 일상 루틴 빌더.',
    tags:          ['감사', '마음챙김', '긍정심리'],
    requiredTests: [],
    suggestedFor:  '매일 긍정적인 습관을 만들고 싶은 분, 번아웃 회복 중인 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'gratitude_write', name:'감사 쓰기', emoji:'✍️', desc:'3가지 감사 질문에 답하기' },
    ],
    Component: typeof GratitudeGame !== 'undefined' ? GratitudeGame : null,
  },

  // ── 내면의 나무 (4호 예정) ─────────────────────────────
  {
    id:            'tree',
    name:          '내면의 나무',
    emoji:         '🌳',
    tagline:       '자아를 단단하게 키워가는 여정',
    description:   'DSI 자아분화 검사 결과와 연동. ACT 기반 3단계(뿌리·줄기·가지)로 자아를 단단하게 성장시키는 마음챙김 게임.',
    tags:          ['자아성장', '마음챙김', 'ACT'],
    requiredTests: ['DSI'],
    suggestedFor:  '자아분화 점수가 낮은 분, 관계에서 자신을 잃는 분',
    creditCost:    0,
    unlockLevel:   4,
    isAvailable:   true,
    modules: [
      { id:'roots',    name:'뿌리 — 현재 순간', emoji:'🌱', desc:'지금 이 순간에 닿기' },
      { id:'trunk',    name:'줄기 — 나의 가치', emoji:'🌳', desc:'나에게 소중한 것 찾기' },
      { id:'branches', name:'가지 — 나의 행동', emoji:'🌿', desc:'가치를 향한 작은 행동' },
    ],
    Component: typeof TreeGame !== 'undefined' ? TreeGame : null,
  },

  // ── 🧠 마음 집중력 (6호) ───────────────────────────────
  {
    id:            'focus',
    name:          '마음 집중력',
    emoji:         '🧠',
    tagline:       '숫자·패턴으로 집중력을 단련해요',
    description:   '숫자 기억과 그리드 패턴 훈련을 통해 지금 이 순간에 집중하는 마음챙김 인지 훈련. GAD-7/PHQ-9 점수에 따라 난이도가 조절됩니다.',
    tags:          ['집중력', '인지훈련', '마음챙김'],
    requiredTests: [],
    suggestedFor:  '집중력이 떨어진 느낌이 드는 분, 마음이 분산되어 있는 분',
    creditCost:    0,
    unlockLevel:   3,
    isAvailable:   true,
    modules: [
      { id:'focus_training', name:'집중력 훈련', emoji:'🔢', desc:'숫자 기억 + 패턴 기억 5라운드' },
    ],
    Component: typeof FocusGame !== 'undefined' ? FocusGame : null,
  },

  // ── ⚡ 번아웃 회복 (5호) ────────────────────────────────
  {
    id:            'burnout',
    name:          '번아웃 회복',
    emoji:         '⚡',
    tagline:       '작은 미션으로 에너지를 되찾는 여정',
    description:   '번아웃 검사 점수에 따라 맞춤 회복 미션을 제공합니다. 미션을 완료할수록 당신의 회복 도시가 성장하고 에너지가 차오릅니다.',
    tags:          ['번아웃회복', '루틴', '미션'],
    requiredTests: ['BURNOUT'],
    suggestedFor:  '번아웃 점수가 높은 분, 지치고 무기력함을 느끼는 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id: 'missions',     name: '회복 미션',     emoji: '🎯', desc: '번아웃 점수 기반 맞춤 회복 미션' },
      { id: 'city',         name: '회복 도시',     emoji: '🏙️', desc: '미션 완료 시 도시가 성장' },
      { id: 'weekly_report',name: '주간 리포트',   emoji: '📊', desc: '한 주간의 회복 흐름 확인' },
    ],
    Component: typeof BurnoutGame !== 'undefined' ? BurnoutGame : null,
  },

  // ── 🫧 걱정 풍선 (8호) ─────────────────────────────────────
  {
    id:            'worry',
    name:          '걱정 풍선',
    emoji:         '🫧',
    tagline:       '걱정을 풍선에 담아 날려 보내요',
    description:   'ACT(수용전념치료) 기반 인지 탈융합 훈련. 지금 마음을 무겁게 하는 걱정들을 풍선에 담고 하나씩 터뜨리며 내려놓는 연습을 해요. 걱정은 생각일 뿐이에요.',
    tags:          ['이완', '스트레스해소', 'ACT', '마음챙김'],
    requiredTests: [],
    suggestedFor:  '걱정이 많은 분, 마음이 무거운 분, 스트레스를 내려놓고 싶은 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'bubbles', name: '걱정 풍선 터뜨리기', emoji: '🫧', desc: '걱정을 풍선에 담아 터뜨리며 내려놓기' },
    ],
    Component: typeof WorryGame !== 'undefined' ? WorryGame : null,
  },
];

// ── 헬퍼 함수 ──────────────────────────────────────────────

// 유저가 플레이 가능한 게임 필터링
function getPlayableGames(completedTests = [], gardenLevel = 1) {
  return GAME_REGISTRY.map(game => ({
    ...game,
    isUnlocked: game.unlockLevel <= gardenLevel,
    hasRequiredTests: game.requiredTests.length === 0 ||
      game.requiredTests.every(t => completedTests.includes(t)),
    canPlay: game.isAvailable &&
      game.unlockLevel <= gardenLevel &&
      (game.requiredTests.length === 0 || game.requiredTests.every(t => completedTests.includes(t))),
  }));
}

// 검사와 게임 연결 매핑
function getTestGameMap() {
  const map = {};
  GAME_REGISTRY.forEach(g => {
    g.requiredTests.forEach(t => {
      if (!map[t]) map[t] = [];
      map[t].push(g.id);
    });
  });
  return map;
}

// ID로 게임 조회
function getGameById(id) {
  return GAME_REGISTRY.find(g => g.id === id) || null;
}
