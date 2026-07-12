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
  requiredTests: string[],     // 플레이 차단 조건. 현재 전 게임 [] — 아래 "해금 정책" 참조
  linkedTests:   string[],     // 표시·연동용(잠그지 않음). 카드의 "PHQ-9 연동" 배지 + 검사↔게임 매핑
  suggestedFor:  string,       // 추천 대상 설명
  creditCost:    number,       // 0 = 무료
  unlockLevel:   number,       // 필요 정원 레벨 (현재 전 게임 1)
  isAvailable:   boolean,      // false = "준비 중"
  Component:     Function|null // 실제 React 컴포넌트 (해당 jsx 로드 후 채워짐)
}
*/

// ── 해금 정책 (2026-07 변경) ─────────────────────────────────
// 이전: 레벨(최대 Lv.4)과 검사 완료를 요구 → 신규 사용자에게 8종 중 3종만 보였고,
//       마음풀 검사 리포트가 처방하는 게임(번아웃·집중·나무·감정꽃)이 정작 잠겨 있었다.
// 현재: 전 게임 Lv.1·검사 조건 없음. 레벨·EXP는 정원 성장/배지/스트릭 등 성취 표시로만 쓴다.
//       검사와의 연결은 linkedTests(표시·추천용)로 유지한다.
// ⚠️ unlockLevel을 다시 올릴 땐 서버 UNLOCK_MAP(src/index.tsx)도 함께 고칠 것 — 이중 관리 지점.
const GAME_REGISTRY = [

  // ── 감정 수채화 (0호 — Lv.1 기본 제공) ─────────────────
  {
    id:            'mood',
    name:          t('감정 수채화', 'Emotion Watercolor'),
    emoji:         '🎨',
    tagline:       t('매일 내 감정을 그려요', 'Paint your emotions every day'),
    description:   t('매일 하루 한 번, 지금의 감정을 기록해보세요. 감정을 알아차리는 것이 치유의 시작입니다. 30일간의 감정 흐름을 수채화로 확인해요.',
                     'Record how you feel once a day. Noticing your emotions is the first step to healing. View 30 days of emotional flow as a watercolor.'),
    tags:          [t('감정인식', 'Emotion Awareness'), t('마음챙김', 'Mindfulness'), t('습관', 'Habit')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   [],
    suggestedFor:  t('감정을 기록하고 싶은 분, 내 마음 상태를 파악하고 싶은 분',
                     'Those who want to track their emotions and understand their mental state'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'checkin',  name: t('오늘의 감정', "Today's Emotion"), emoji:'🎨', desc: t('오늘 가장 크게 느끼는 감정 기록', 'Log the emotion you feel most today') },
      { id:'calendar', name: t('감정 달력',   'Emotion Calendar'), emoji:'📅', desc: t('30일 감정 흐름 수채화로 보기', 'View 30 days of emotion flow as watercolor') },
    ],
    Component: typeof MoodGame !== 'undefined' ? MoodGame : null,
  },

  // ── 마음의 정원 (1호 게임) ──────────────────────────────
  {
    id:            'garden',
    name:          t('마음의 정원', 'Mind Garden'),
    emoji:         '🌿',
    tagline:       t('내 마음을 가꾸는 정원', 'A garden to nurture your mind'),
    description:   t('PHQ-9·SCT 검사 결과를 바탕으로 나만의 정원을 가꾸세요. 호흡 훈련과 인지 교정을 통해 안개 낀 정원이 점차 맑아집니다.',
                     'Cultivate your own garden based on PHQ-9·SCT results. Through breathing exercises and cognitive reframing, your foggy garden gradually clears.'),
    tags:          [t('이완', 'Relaxation'), t('인지교정', 'Cognitive Reframing'), t('호흡', 'Breathing')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['PHQ9'],
    suggestedFor:  t('우울·불안 점수가 높은 분, 스트레스 해소가 필요한 분',
                     'Those with high depression/anxiety scores or in need of stress relief'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'breathing', name: t('숨 쉬는 호수',   'Breathing Lake'),     emoji:'💧', desc: t('4-4-4 호흡법으로 마음을 고요하게', 'Calm your mind with 4-4-4 breathing') },
      { id:'cbt',       name: t('생각의 가지치기', 'Thought Pruning'),    emoji:'🌱', desc: t('부정적인 생각을 긍정 확언으로 변환', 'Transform negative thoughts into positive affirmations') },
    ],
    Component:     typeof GardenGame !== 'undefined' ? GardenGame : null,
  },

  // ── 감정꽃 찾기 (2호 예정) ─────────────────────────────
  {
    id:            'efmt',
    name:          t('감정꽃 찾기', 'Emotion Flower Hunt'),
    emoji:         '🌸',
    tagline:       t('감정을 알아채는 훈련', 'Training to recognize emotions'),
    description:   t('다양한 표정의 꽃 중에서 웃는 꽃을 빠르게 찾아내는 감정 인지 훈련. PHQ-9 점수에 따라 난이도가 조절됩니다.',
                     'Quickly find the smiling flower among flowers with various expressions. Difficulty adjusts based on your PHQ-9 score.'),
    tags:          [t('감정인식', 'Emotion Awareness'), t('집중력', 'Focus'), t('인지훈련', 'Cognitive Training')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['PHQ9'],
    suggestedFor:  t('감정 인식이 어려운 분, 집중력 향상이 필요한 분',
                     'Those who struggle with emotion recognition or want to improve focus'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'efmt_easy',   name: t('기초 감정 인식', 'Basic Emotion Recognition'), emoji:'🌼', desc: t('4x4 그리드에서 웃는 꽃 찾기', 'Find the smiling flower in a 4×4 grid') },
      { id:'efmt_speed',  name: t('감정 속도 훈련', 'Emotion Speed Training'),    emoji:'🌺', desc: t('빠르게 반응하는 감정 인지',   'Quick-response emotion recognition') },
    ],
    Component: typeof EFMTGame !== 'undefined' ? EFMTGame : null,
  },

  // ── 별빛 감사 일기 (3호) ────────────────────────────────
  {
    id:            'gratitude',
    name:          t('별빛 감사 일기', 'Starlight Gratitude Journal'),
    emoji:         '⭐',
    tagline:       t('감사의 별 3개를 밤하늘에 밝혀요', 'Light 3 stars of gratitude in the night sky'),
    description:   t('매일 3가지 감사 질문에 답하며 밤하늘에 별을 밝히는 마음챙김 게임. 긍정심리학 기반의 일상 루틴 빌더.',
                     'Answer 3 gratitude questions each day to light stars in the night sky. A daily routine builder grounded in positive psychology.'),
    tags:          [t('감사', 'Gratitude'), t('마음챙김', 'Mindfulness'), t('긍정심리', 'Positive Psychology')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   [],
    suggestedFor:  t('매일 긍정적인 습관을 만들고 싶은 분, 번아웃 회복 중인 분',
                     'Those who want to build positive daily habits or are recovering from burnout'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'gratitude_write', name: t('감사 쓰기', 'Write Gratitude'), emoji:'✍️', desc: t('3가지 감사 질문에 답하기', 'Answer 3 gratitude questions') },
    ],
    Component: typeof GratitudeGame !== 'undefined' ? GratitudeGame : null,
  },

  // ── 내면의 나무 (4호 예정) ─────────────────────────────
  {
    id:            'tree',
    name:          t('내면의 나무', 'Inner Tree'),
    emoji:         '🌳',
    tagline:       t('자아를 단단하게 키워가는 여정', 'A journey to grow a stronger self'),
    description:   t('DSI 자아분화 검사 결과와 연동. ACT 기반 3단계(뿌리·줄기·가지)로 자아를 단단하게 성장시키는 마음챙김 게임.',
                     'Linked to DSI differentiation results. An ACT-based mindfulness game that grows your self through 3 stages: Roots, Trunk, and Branches.'),
    tags:          [t('자아성장', 'Self Growth'), t('마음챙김', 'Mindfulness'), 'ACT'],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['DSI'],
    suggestedFor:  t('자아분화 점수가 낮은 분, 관계에서 자신을 잃는 분',
                     'Those with low differentiation scores or who lose themselves in relationships'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'roots',    name: t('뿌리 — 현재 순간', 'Roots — Present Moment'), emoji:'🌱', desc: t('지금 이 순간에 닿기', 'Connect to the present moment') },
      { id:'trunk',    name: t('줄기 — 나의 가치', 'Trunk — My Values'),      emoji:'🌳', desc: t('나에게 소중한 것 찾기', 'Find what matters most to you') },
      { id:'branches', name: t('가지 — 나의 행동', 'Branches — My Actions'),  emoji:'🌿', desc: t('가치를 향한 작은 행동', 'Take small steps toward your values') },
    ],
    Component: typeof TreeGame !== 'undefined' ? TreeGame : null,
  },

  // ── 🧠 마음 집중력 (6호) ───────────────────────────────
  {
    id:            'focus',
    name:          t('마음 집중력', 'Mind Focus'),
    emoji:         '🧠',
    tagline:       t('숫자·패턴으로 집중력을 단련해요', 'Train your focus with numbers and patterns'),
    description:   t('숫자 기억과 그리드 패턴 훈련을 통해 지금 이 순간에 집중하는 마음챙김 인지 훈련. GAD-7/PHQ-9 점수에 따라 난이도가 조절됩니다.',
                     'A mindfulness cognitive training to focus on the present moment through number memory and grid pattern exercises. Difficulty adjusts to your GAD-7/PHQ-9 scores.'),
    tags:          [t('집중력', 'Focus'), t('인지훈련', 'Cognitive Training'), t('마음챙김', 'Mindfulness')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['BURNOUT'],
    suggestedFor:  t('집중력이 떨어진 느낌이 드는 분, 마음이 분산되어 있는 분',
                     'Those feeling scattered or struggling to concentrate'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id:'focus_training', name: t('집중력 훈련', 'Focus Training'), emoji:'🔢', desc: t('숫자 기억 + 패턴 기억 5라운드', 'Number memory + pattern memory, 5 rounds') },
    ],
    Component: typeof FocusGame !== 'undefined' ? FocusGame : null,
  },

  // ── ⚡ 번아웃 회복 (5호) ────────────────────────────────
  {
    id:            'burnout',
    name:          t('번아웃 회복', 'Burnout Recovery'),
    emoji:         '⚡',
    tagline:       t('작은 미션으로 에너지를 되찾는 여정', 'Reclaim your energy through small missions'),
    description:   t('번아웃 검사 점수에 따라 맞춤 회복 미션을 제공합니다. 미션을 완료할수록 당신의 회복 도시가 성장하고 에너지가 차오릅니다.',
                     'Tailored recovery missions based on your burnout score. As you complete missions, your recovery city grows and your energy is restored.'),
    tags:          [t('번아웃회복', 'Burnout Recovery'), t('루틴', 'Routine'), t('미션', 'Mission')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['BURNOUT'],
    suggestedFor:  t('번아웃 점수가 높은 분, 지치고 무기력함을 느끼는 분',
                     'Those with high burnout scores or feeling exhausted and unmotivated'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'missions',      name: t('회복 미션',   'Recovery Missions'), emoji: '🎯', desc: t('번아웃 점수 기반 맞춤 회복 미션', 'Personalized recovery missions based on burnout score') },
      { id: 'city',          name: t('회복 도시',   'Recovery City'),     emoji: '🏙️', desc: t('미션 완료 시 도시가 성장',        'City grows as you complete missions') },
      { id: 'weekly_report', name: t('주간 리포트', 'Weekly Report'),     emoji: '📊', desc: t('한 주간의 회복 흐름 확인',         'Review your weekly recovery progress') },
    ],
    Component: typeof BurnoutGame !== 'undefined' ? BurnoutGame : null,
  },

  // ── 🫧 걱정 풍선 (8호) ─────────────────────────────────────
  {
    id:            'worry',
    name:          t('걱정 풍선', 'Worry Bubbles'),
    emoji:         '🫧',
    tagline:       t('걱정을 풍선에 담아 날려 보내요', 'Put your worries in bubbles and let them go'),
    description:   t('수용전념(ACT) 원리에서 착안한 마음 내려놓기 연습. 지금 마음을 무겁게 하는 걱정들을 풍선에 담고 하나씩 터뜨리며 내려놓아 보세요. 걱정은 생각일 뿐이에요.',
                     'A letting-go exercise inspired by ACT (acceptance & commitment) principles. Place your worries into bubbles and pop them one by one. Worry is just a thought.'),
    tags:          [t('이완', 'Relaxation'), t('스트레스해소', 'Stress Relief'), 'ACT', t('마음챙김', 'Mindfulness')],
    requiredTests: [],                    // 잠금 없음(해금 정책 참조)
    linkedTests:   ['GAD7'],
    suggestedFor:  t('걱정이 많은 분, 마음이 무거운 분, 스트레스를 내려놓고 싶은 분',
                     'Those who worry a lot, feel weighed down, or want to release stress'),
    creditCost:    0,
    unlockLevel:   1,
    isAvailable:   true,
    modules: [
      { id: 'bubbles', name: t('걱정 풍선 터뜨리기', 'Pop the Worry Bubbles'), emoji: '🫧', desc: t('걱정을 풍선에 담아 터뜨리며 내려놓기', 'Fill bubbles with worries and pop them to let go') },
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

// 검사와 게임 연결 매핑 — 잠금(requiredTests)이 아니라 표시·추천용 linkedTests 기준
function getTestGameMap() {
  const map = {};
  GAME_REGISTRY.forEach(g => {
    (g.linkedTests || []).forEach(t => {
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
