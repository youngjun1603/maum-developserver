// ============================================================
// game_registry.jsx  —  The Light of Life 치유 게임 등록소
// CTS 기독교 TV — 기독교 테마 마음 치유 게임
// ============================================================

const GAME_REGISTRY = [

  // ── 감사 제단 (0호 — Lv.1 기본 제공) ──────────────────────
  // 기반: 감정 수채화 → 주님께 감정 내어드리기
  {
    id:            'mood',
    name:          t('감사 제단', 'Altar of Thanks'),
    emoji:         '🕊️',
    tagline:       t('매일 주님 앞에 마음을 내어드려요', 'Offer your heart before the Lord each day'),
    description:   t('하루 한 번, 지금 느끼는 감정을 주님 앞에 솔직하게 내어드리세요. 감정을 알아차리고 하나님께 올려드리는 것이 치유의 시작입니다. 30일간의 감정 흐름을 달력으로 확인해요.', 'Once a day, honestly offer the emotions you feel before the Lord. Noticing your feelings and lifting them to God is where healing begins. Track 30 days of your emotional flow on a calendar.'),
    tags:          [t('감정인식','Emotion Awareness'), t('기도','Prayer'), t('습관','Habit')],
    requiredTests: [],
    suggestedFor:  t('감정을 기록하고 싶은 분, 하나님과의 교제를 일상화하고 싶은 분', 'For those who want to record their emotions and make fellowship with God a daily habit'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'checkin',  name:t('오늘의 감정 기도','Today\'s Emotion Prayer'), emoji:'🕊️', desc:t('오늘 느끼는 감정을 주님께 올려드리기','Lift the emotions you feel today to the Lord') },
      { id:'calendar', name:t('감사 달력','Gratitude Calendar'),            emoji:'📅', desc:t('30일 감정·감사 흐름 보기','View 30 days of emotion & gratitude flow') },
    ],
    Component: typeof MoodGame !== 'undefined' ? MoodGame : null,
  },

  // ── 말씀의 정원 (1호) ──────────────────────────────────────
  // 기반: 마음의 정원 → 말씀으로 마음을 가꾸기
  {
    id:            'garden',
    name:          t('말씀의 정원', 'Garden of the Word'),
    emoji:         '🌿',
    tagline:       t('말씀으로 마음의 정원을 가꾸어요', 'Tend the garden of your heart with the Word'),
    description:   t('호흡 기도와 말씀 묵상으로 내 마음의 정원을 가꾸세요. 안개 낀 마음이 하나님의 평강으로 점차 맑아집니다. "평강의 하나님이 너희와 함께 계시리라" (빌 4:9)', 'Tend the garden of your heart through breath prayer and Scripture meditation. A fog-covered heart gradually clears with the peace of God. "And the God of peace will be with you." (Phil 4:9)'),
    tags:          [t('이완','Relaxation'), t('호흡기도','Breath Prayer'), t('말씀묵상','Scripture Meditation')],
    requiredTests: [],
    suggestedFor:  t('우울·불안 점수가 높은 분, 마음의 평안이 필요한 분', 'For those with high depression/anxiety scores who need peace of mind'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'breathing', name:t('호흡 기도','Breath Prayer'),   emoji:'💧', desc:t('4-4-4 호흡법으로 주님 앞에 고요히 서기','Be still before the Lord with 4-4-4 breathing') },
      { id:'cbt',       name:t('말씀 확언','Word Affirmation'), emoji:'📖', desc:t('부정적 생각을 말씀 확언으로 전환하기','Turn negative thoughts into affirmations from the Word') },
    ],
    Component: typeof GardenGame !== 'undefined' ? GardenGame : null,
  },

  // ── 감정꽃 찾기 (2호) ──────────────────────────────────────
  {
    id:            'efmt',
    name:          t('감정꽃 찾기', 'Find the Emotion Flower'),
    emoji:         '🌸',
    tagline:       t('하나님이 주신 감정을 알아채요', 'Notice the emotions God has given you'),
    description:   t('다양한 표정의 꽃 중에서 웃는 꽃을 빠르게 찾아내는 감정 인지 훈련. 하나님이 창조하신 감정을 세밀하게 인식하는 훈련입니다.', 'An emotion-recognition exercise where you quickly find the smiling flower among flowers with various expressions — training to finely perceive the emotions God created.'),
    tags:          [t('감정인식','Emotion Awareness'), t('집중력','Focus'), t('인지훈련','Cognitive Training')],
    requiredTests: ['PHQ9'],
    suggestedFor:  t('감정 인식이 어려운 분, 집중력 향상이 필요한 분', 'For those who struggle with emotion recognition or want to improve focus'),
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'efmt_easy',  name:t('기초 감정 인식','Basic Emotion Recognition'), emoji:'🌼', desc:t('4x4 그리드에서 웃는 꽃 찾기','Find the smiling flower in a 4x4 grid') },
      { id:'efmt_speed', name:t('감정 속도 훈련','Emotion Speed Training'),    emoji:'🌺', desc:t('빠르게 반응하는 감정 인지','Fast-reaction emotion recognition') },
    ],
    Component: typeof EFMTGame !== 'undefined' ? EFMTGame : null,
  },

  // ── 감사 별자리 (3호) ──────────────────────────────────────
  // 기반: 별빛 감사 일기 → 주님께 드리는 감사 기도
  {
    id:            'gratitude',
    name:          t('감사 별자리', 'Gratitude Constellation'),
    emoji:         '✨',
    tagline:       t('주님께 드리는 감사 3가지로 밤하늘을 밝혀요', 'Light up the night sky with 3 thanksgivings to the Lord'),
    description:   t('매일 3가지 감사 기도를 드리며 밤하늘에 별을 밝히는 말씀 게임. "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라" (살전 5:16-18)', 'A Scripture game where you offer 3 prayers of thanks each day and light up stars in the night sky. "Rejoice always, pray without ceasing, give thanks in everything." (1 Thess 5:16-18)'),
    tags:          [t('감사기도','Gratitude Prayer'), t('마음챙김','Mindfulness'), t('긍정신앙','Positive Faith')],
    requiredTests: [],
    suggestedFor:  t('감사 습관을 만들고 싶은 분, 번아웃 회복 중인 분', 'For those building a gratitude habit or recovering from burnout'),
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id:'gratitude_write', name:t('감사 기도 쓰기','Write a Gratitude Prayer'), emoji:'✍️', desc:t('오늘 감사한 3가지를 주님께 올려드리기','Lift 3 things you\'re thankful for to the Lord') },
    ],
    Component: typeof GratitudeGame !== 'undefined' ? GratitudeGame : null,
  },

  // ── 믿음의 나무 (4호) ──────────────────────────────────────
  // 기반: 내면의 나무 → 신앙 정체성 성장
  {
    id:            'tree',
    name:          t('믿음의 나무', 'Tree of Faith'),
    emoji:         '🌳',
    tagline:       t('그리스도 안에서 자아를 단단하게 세워가요', 'Build a firm sense of self in Christ'),
    description:   t('DSI 자아분화 검사 결과와 연동. 성경적 정체성(뿌리·줄기·가지)으로 자아를 단단하게 성장시키는 믿음 여정. "나는 포도나무요 너희는 가지라" (요 15:5)', 'Linked to your DSI self-differentiation results. A faith journey that grows a firm sense of self through biblical identity (roots, trunk, branches). "I am the vine, you are the branches." (John 15:5)'),
    tags:          [t('신앙성장','Faith Growth'), t('정체성','Identity'), t('말씀','Scripture')],
    requiredTests: ['DSI'],
    suggestedFor:  t('자아분화 점수가 낮은 분, 관계에서 자신을 잃는 분', 'For those with low self-differentiation scores who lose themselves in relationships'),
    creditCost:    0,
    unlockLevel:   4,
    isAvailable:   true,
    modules: [
      { id:'roots',    name:t('뿌리 — 현재 순간','Roots — The Present Moment'), emoji:'🌱', desc:t('지금 이 순간 하나님과 함께 있기','Being with God in this very moment') },
      { id:'trunk',    name:t('줄기 — 내 가치','Trunk — My Values'),           emoji:'🌳', desc:t('그리스도 안에서 소중한 것 찾기','Finding what matters in Christ') },
      { id:'branches', name:t('가지 — 나의 행동','Branches — My Actions'),      emoji:'🌿', desc:t('믿음을 향한 작은 행동','Small actions toward faith') },
    ],
    Component: typeof TreeGame !== 'undefined' ? TreeGame : null,
  },

  // ── 말씀 집중력 (5호) ──────────────────────────────────────
  // 기반: 마음 집중력 → 말씀 집중 훈련
  {
    id:            'focus',
    name:          t('말씀 집중력', 'Word Focus'),
    emoji:         '📿',
    tagline:       t('말씀에 집중하는 마음을 훈련해요', 'Train a mind that focuses on the Word'),
    description:   t('숫자 기억과 그리드 패턴 훈련을 통해 말씀에 집중하는 능력을 키웁니다. "오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다" (시 1:2)', 'Build your ability to focus on the Word through number-memory and grid-pattern training. "But his delight is in the law of the LORD, and he meditates on it day and night." (Ps 1:2)'),
    tags:          [t('집중력','Focus'), t('인지훈련','Cognitive Training'), t('말씀묵상','Scripture Meditation')],
    requiredTests: [],
    suggestedFor:  t('집중력이 떨어진 느낌이 드는 분, 말씀 묵상이 어려운 분', 'For those who feel their focus has dropped or find Scripture meditation difficult'),
    creditCost:    0,
    unlockLevel:   3,
    isAvailable:   true,
    modules: [
      { id:'focus_training', name:t('집중력 훈련','Focus Training'), emoji:'🔢', desc:t('숫자 기억 + 패턴 기억 5라운드','5 rounds of number & pattern memory') },
    ],
    Component: typeof FocusGame !== 'undefined' ? FocusGame : null,
  },

  // ── 회복의 샘 (6호) ────────────────────────────────────────
  // 기반: 번아웃 회복 → 말씀 기반 회복 미션
  {
    id:            'burnout',
    name:          t('회복의 샘', 'Spring of Restoration'),
    emoji:         '💧',
    tagline:       t('말씀 미션으로 회복의 샘을 채워가요', 'Fill the spring of restoration through Word missions'),
    description:   t('번아웃 검사 점수에 따라 맞춤 말씀 회복 미션을 제공합니다. 미션을 완료할수록 당신의 회복 마을이 성장하고 생수가 차오릅니다. "수고하고 무거운 짐 진 자들아 다 내게로 오라" (마 11:28)', 'Provides tailored Word-based recovery missions based on your burnout score. As you complete missions, your recovery village grows and living water rises. "Come to me, all you who are weary and burdened." (Matt 11:28)'),
    tags:          [t('번아웃회복','Burnout Recovery'), t('말씀','Scripture'), t('회복미션','Recovery Mission')],
    requiredTests: ['BURNOUT'],
    suggestedFor:  t('번아웃 점수가 높은 분, 지치고 무기력함을 느끼는 분', 'For those with high burnout scores who feel drained and listless'),
    creditCost:    0,
    unlockLevel:   2,
    isAvailable:   true,
    modules: [
      { id: 'missions',      name: t('회복 말씀 미션','Recovery Word Mission'), emoji: '🎯', desc: t('번아웃 점수 기반 맞춤 말씀 회복 미션','Tailored Word recovery missions based on burnout score') },
      { id: 'city',          name: t('회복 마을','Recovery Village'),           emoji: '⛪', desc: t('미션 완료 시 마을이 성장','The village grows as you complete missions') },
      { id: 'weekly_report', name: t('주간 리포트','Weekly Report'),            emoji: '📊', desc: t('한 주간의 회복 흐름 확인','Review your recovery flow over the week') },
    ],
    Component: typeof BurnoutGame !== 'undefined' ? BurnoutGame : null,
  },

  // ── 기도 풍선 (7호) ────────────────────────────────────────
  // 기반: 걱정 풍선 → 주께 맡기기 (벧전 5:7)
  {
    id:            'worry',
    name:          t('기도 풍선', 'Prayer Balloons'),
    emoji:         '🙏',
    tagline:       t('걱정을 풍선에 담아 주님께 올려드려요', 'Place your worries in balloons and lift them to the Lord'),
    description:   t('"너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라" (벧전 5:7). 지금 마음을 무겁게 하는 걱정들을 풍선에 담고 하나씩 주님께 올려드리는 기도 훈련.', '"Cast all your anxiety on him, because he cares for you." (1 Pet 5:7). A prayer exercise where you place the worries weighing on your heart into balloons and lift them to the Lord one by one.'),
    tags:          [t('이완','Relaxation'), t('기도','Prayer'), t('마음챙김','Mindfulness')],
    requiredTests: [],
    suggestedFor:  t('걱정이 많은 분, 마음이 무거운 분, 하나님께 내어드리고 싶은 분', 'For those with many worries or a heavy heart who want to give them to God'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'bubbles', name: t('기도 풍선 올려드리기','Lift the Prayer Balloons'), emoji: '🙏', desc: t('걱정을 풍선에 담아 주님께 올려드리기','Place worries in balloons and lift them to the Lord') },
    ],
    Component: typeof WorryGame !== 'undefined' ? WorryGame : null,
  },

  // ── QT 체크인 (8호) — CTS 전용 신규 ───────────────────────
  {
    id:            'qt',
    name:          t('QT 체크인', 'QT Check-in'),
    emoji:         '📖',
    tagline:       t('오늘 말씀 묵상을 기록해요', 'Record today\'s Scripture meditation'),
    description:   t('매일 성경 말씀 읽기와 묵상을 기록하는 QT(Quiet Time) 체크인 게임. 30일 QT 달력으로 말씀 생활 습관을 만들어가세요.', 'A QT (Quiet Time) check-in game for recording daily Bible reading and meditation. Build a Word-centered habit with a 30-day QT calendar.'),
    tags:          [t('말씀묵상','Scripture Meditation'), t('QT','QT'), t('습관','Habit')],
    requiredTests: [],
    suggestedFor:  t('규칙적인 QT 습관을 만들고 싶은 분, 말씀 생활을 시작하고 싶은 분', 'For those who want to build a regular QT habit or start a Word-centered life'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'qt_checkin', name: t('오늘의 QT','Today\'s QT'), emoji: '📖', desc: t('오늘 읽은 말씀과 묵상 기록하기','Record the Scripture you read and your meditation today') },
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
