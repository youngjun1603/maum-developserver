// ============================================================
// game_registry.jsx  —  The Light of Life 치유 게임 등록소
// CTS 기독교 TV — 기독교 테마 마음 치유 게임
// ============================================================

const GAME_REGISTRY = [

  // ── 감사 제단 (0호 — Lv.1 기본 제공) ──────────────────────
  // 기반: 감정 수채화 → 주님께 감정 내어드리기
  {
    id:            'mood',
    name:          '감사 제단',
    emoji:         '🕊️',
    tagline:       '매일 주님 앞에 마음을 내어드려요',
    description:   '하루 한 번, 지금 느끼는 감정을 주님 앞에 솔직하게 내어드리세요. 감정을 알아차리고 하나님께 올려드리는 것이 치유의 시작입니다. 30일간의 감정 흐름을 달력으로 확인해요.',
    tags:          ['감정인식', '기도', '습관'],
    requiredTests: [],
    suggestedFor:  '감정을 기록하고 싶은 분, 하나님과의 교제를 일상화하고 싶은 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'checkin',  name:'오늘의 감정 기도', emoji:'🕊️', desc:'오늘 느끼는 감정을 주님께 올려드리기' },
      { id:'calendar', name:'감사 달력',        emoji:'📅', desc:'30일 감정·감사 흐름 보기' },
    ],
    Component: typeof MoodGame !== 'undefined' ? MoodGame : null,
  },

  // ── 말씀의 정원 (1호) ──────────────────────────────────────
  // 기반: 마음의 정원 → 말씀으로 마음을 가꾸기
  {
    id:            'garden',
    name:          '말씀의 정원',
    emoji:         '🌿',
    tagline:       '말씀으로 마음의 정원을 가꾸어요',
    description:   '호흡 기도와 말씀 묵상으로 내 마음의 정원을 가꾸세요. 안개 낀 마음이 하나님의 평강으로 점차 맑아집니다. "평강의 하나님이 너희와 함께 계시리라" (빌 4:9)',
    tags:          ['이완', '호흡기도', '말씀묵상'],
    requiredTests: [],
    suggestedFor:  '우울·불안 점수가 높은 분, 마음의 평안이 필요한 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'breathing', name:'호흡 기도',   emoji:'💧', desc:'4-4-4 호흡법으로 주님 앞에 고요히 서기' },
      { id:'cbt',       name:'말씀 확언',   emoji:'📖', desc:'부정적 생각을 말씀 확언으로 전환하기' },
    ],
    Component: typeof GardenGame !== 'undefined' ? GardenGame : null,
  },

  // ── 감정꽃 찾기 (2호) ──────────────────────────────────────
  {
    id:            'efmt',
    name:          '감정꽃 찾기',
    emoji:         '🌸',
    tagline:       '하나님이 주신 감정을 알아채요',
    description:   '다양한 표정의 꽃 중에서 웃는 꽃을 빠르게 찾아내는 감정 인지 훈련. 하나님이 창조하신 감정을 세밀하게 인식하는 훈련입니다.',
    tags:          ['감정인식', '집중력', '인지훈련'],
    requiredTests: ['PHQ9'],
    suggestedFor:  '감정 인식이 어려운 분, 집중력 향상이 필요한 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'efmt_easy',  name:'기초 감정 인식', emoji:'🌼', desc:'4x4 그리드에서 웃는 꽃 찾기' },
      { id:'efmt_speed', name:'감정 속도 훈련', emoji:'🌺', desc:'빠르게 반응하는 감정 인지' },
    ],
    Component: typeof EFMTGame !== 'undefined' ? EFMTGame : null,
  },

  // ── 감사 별자리 (3호) ──────────────────────────────────────
  // 기반: 별빛 감사 일기 → 주님께 드리는 감사 기도
  {
    id:            'gratitude',
    name:          '감사 별자리',
    emoji:         '✨',
    tagline:       '주님께 드리는 감사 3가지로 밤하늘을 밝혀요',
    description:   '매일 3가지 감사 기도를 드리며 밤하늘에 별을 밝히는 말씀 게임. "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라" (살전 5:16-18)',
    tags:          ['감사기도', '마음챙김', '긍정신앙'],
    requiredTests: [],
    suggestedFor:  '감사 습관을 만들고 싶은 분, 번아웃 회복 중인 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'gratitude_write', name:'감사 기도 쓰기', emoji:'✍️', desc:'오늘 감사한 3가지를 주님께 올려드리기' },
    ],
    Component: typeof GratitudeGame !== 'undefined' ? GratitudeGame : null,
  },

  // ── 믿음의 나무 (4호) ──────────────────────────────────────
  // 기반: 내면의 나무 → 신앙 정체성 성장
  {
    id:            'tree',
    name:          '믿음의 나무',
    emoji:         '🌳',
    tagline:       '그리스도 안에서 자아를 단단하게 세워가요',
    description:   'DSI 자아분화 검사 결과와 연동. 성경적 정체성(뿌리·줄기·가지)으로 자아를 단단하게 성장시키는 믿음 여정. "나는 포도나무요 너희는 가지라" (요 15:5)',
    tags:          ['신앙성장', '정체성', '말씀'],
    requiredTests: ['DSI'],
    suggestedFor:  '자아분화 점수가 낮은 분, 관계에서 자신을 잃는 분',
    creditCost:    0,
    unlockLevel:   4,
    isAvailable:   true,
    modules: [
      { id:'roots',    name:'뿌리 — 현재 순간',   emoji:'🌱', desc:'지금 이 순간 하나님과 함께 있기' },
      { id:'trunk',    name:'줄기 — 내 가치',     emoji:'🌳', desc:'그리스도 안에서 소중한 것 찾기' },
      { id:'branches', name:'가지 — 나의 행동',   emoji:'🌿', desc:'믿음을 향한 작은 행동' },
    ],
    Component: typeof TreeGame !== 'undefined' ? TreeGame : null,
  },

  // ── 말씀 집중력 (5호) ──────────────────────────────────────
  // 기반: 마음 집중력 → 말씀 집중 훈련
  {
    id:            'focus',
    name:          '말씀 집중력',
    emoji:         '📿',
    tagline:       '말씀에 집중하는 마음을 훈련해요',
    description:   '숫자 기억과 그리드 패턴 훈련을 통해 말씀에 집중하는 능력을 키웁니다. "오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다" (시 1:2)',
    tags:          ['집중력', '인지훈련', '말씀묵상'],
    requiredTests: [],
    suggestedFor:  '집중력이 떨어진 느낌이 드는 분, 말씀 묵상이 어려운 분',
    creditCost:    0,
    unlockLevel:   3,
    isAvailable:   true,
    modules: [
      { id:'focus_training', name:'집중력 훈련', emoji:'🔢', desc:'숫자 기억 + 패턴 기억 5라운드' },
    ],
    Component: typeof FocusGame !== 'undefined' ? FocusGame : null,
  },

  // ── 회복의 샘 (6호) ────────────────────────────────────────
  // 기반: 번아웃 회복 → 말씀 기반 회복 미션
  {
    id:            'burnout',
    name:          '회복의 샘',
    emoji:         '💧',
    tagline:       '말씀 미션으로 회복의 샘을 채워가요',
    description:   '번아웃 검사 점수에 따라 맞춤 말씀 회복 미션을 제공합니다. 미션을 완료할수록 당신의 회복 마을이 성장하고 생수가 차오릅니다. "수고하고 무거운 짐 진 자들아 다 내게로 오라" (마 11:28)',
    tags:          ['번아웃회복', '말씀', '회복미션'],
    requiredTests: ['BURNOUT'],
    suggestedFor:  '번아웃 점수가 높은 분, 지치고 무기력함을 느끼는 분',
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id: 'missions',      name: '회복 말씀 미션', emoji: '🎯', desc: '번아웃 점수 기반 맞춤 말씀 회복 미션' },
      { id: 'city',          name: '회복 마을',      emoji: '⛪', desc: '미션 완료 시 마을이 성장' },
      { id: 'weekly_report', name: '주간 리포트',    emoji: '📊', desc: '한 주간의 회복 흐름 확인' },
    ],
    Component: typeof BurnoutGame !== 'undefined' ? BurnoutGame : null,
  },

  // ── 기도 풍선 (7호) ────────────────────────────────────────
  // 기반: 걱정 풍선 → 주께 맡기기 (벧전 5:7)
  {
    id:            'worry',
    name:          '기도 풍선',
    emoji:         '🙏',
    tagline:       '걱정을 풍선에 담아 주님께 올려드려요',
    description:   '"너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라" (벧전 5:7). 지금 마음을 무겁게 하는 걱정들을 풍선에 담고 하나씩 주님께 올려드리는 기도 훈련.',
    tags:          ['이완', '기도', '마음챙김'],
    requiredTests: [],
    suggestedFor:  '걱정이 많은 분, 마음이 무거운 분, 하나님께 내어드리고 싶은 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'bubbles', name: '기도 풍선 올려드리기', emoji: '🙏', desc: '걱정을 풍선에 담아 주님께 올려드리기' },
    ],
    Component: typeof WorryGame !== 'undefined' ? WorryGame : null,
  },

  // ── QT 체크인 (8호) — CTS 전용 신규 ───────────────────────
  {
    id:            'qt',
    name:          'QT 체크인',
    emoji:         '📖',
    tagline:       '오늘 말씀 묵상을 기록해요',
    description:   '매일 성경 말씀 읽기와 묵상을 기록하는 QT(Quiet Time) 체크인 게임. 30일 QT 달력으로 말씀 생활 습관을 만들어가세요.',
    tags:          ['말씀묵상', 'QT', '습관'],
    requiredTests: [],
    suggestedFor:  '규칙적인 QT 습관을 만들고 싶은 분, 말씀 생활을 시작하고 싶은 분',
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'qt_checkin', name: '오늘의 QT', emoji: '📖', desc: '오늘 읽은 말씀과 묵상 기록하기' },
    ],
    Component: typeof QTGame !== 'undefined' ? QTGame : null,
  },
];

// ── 헬퍼 함수 ──────────────────────────────────────────────

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

function getGameById(id) {
  return GAME_REGISTRY.find(g => g.id === id) || null;
}
