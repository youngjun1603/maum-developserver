const GAME_REGISTRY = [
  // ── 감정 수채화 (0호 — Lv.1 기본 제공) ─────────────────
  {
    id: "mood",
    name: t("\uAC10\uC815 \uC218\uCC44\uD654", "Emotion Watercolor"),
    emoji: "\u{1F3A8}",
    tagline: t("\uB9E4\uC77C \uB0B4 \uAC10\uC815\uC744 \uADF8\uB824\uC694", "Paint your emotions every day"),
    description: t(
      "\uB9E4\uC77C \uD558\uB8E8 \uD55C \uBC88, \uC9C0\uAE08\uC758 \uAC10\uC815\uC744 \uAE30\uB85D\uD574\uBCF4\uC138\uC694. \uAC10\uC815\uC744 \uC54C\uC544\uCC28\uB9AC\uB294 \uAC83\uC774 \uCE58\uC720\uC758 \uC2DC\uC791\uC785\uB2C8\uB2E4. 30\uC77C\uAC04\uC758 \uAC10\uC815 \uD750\uB984\uC744 \uC218\uCC44\uD654\uB85C \uD655\uC778\uD574\uC694.",
      "Record how you feel once a day. Noticing your emotions is the first step to healing. View 30 days of emotional flow as a watercolor."
    ),
    tags: [t("\uAC10\uC815\uC778\uC2DD", "Emotion Awareness"), t("\uB9C8\uC74C\uCC59\uAE40", "Mindfulness"), t("\uC2B5\uAD00", "Habit")],
    requiredTests: [],
    suggestedFor: t(
      "\uAC10\uC815\uC744 \uAE30\uB85D\uD558\uACE0 \uC2F6\uC740 \uBD84, \uB0B4 \uB9C8\uC74C \uC0C1\uD0DC\uB97C \uD30C\uC545\uD558\uACE0 \uC2F6\uC740 \uBD84",
      "Those who want to track their emotions and understand their mental state"
    ),
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "checkin", name: t("\uC624\uB298\uC758 \uAC10\uC815", "Today's Emotion"), emoji: "\u{1F3A8}", desc: t("\uC624\uB298 \uAC00\uC7A5 \uD06C\uAC8C \uB290\uB07C\uB294 \uAC10\uC815 \uAE30\uB85D", "Log the emotion you feel most today") },
      { id: "calendar", name: t("\uAC10\uC815 \uB2EC\uB825", "Emotion Calendar"), emoji: "\u{1F4C5}", desc: t("30\uC77C \uAC10\uC815 \uD750\uB984 \uC218\uCC44\uD654\uB85C \uBCF4\uAE30", "View 30 days of emotion flow as watercolor") }
    ],
    Component: typeof MoodGame !== "undefined" ? MoodGame : null
  },
  // ── 마음의 정원 (1호 게임) ──────────────────────────────
  {
    id: "garden",
    name: t("\uB9C8\uC74C\uC758 \uC815\uC6D0", "Mind Garden"),
    emoji: "\u{1F33F}",
    tagline: t("\uB0B4 \uB9C8\uC74C\uC744 \uAC00\uAFB8\uB294 \uC815\uC6D0", "A garden to nurture your mind"),
    description: t(
      "PHQ-9\xB7SCT \uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uB098\uB9CC\uC758 \uC815\uC6D0\uC744 \uAC00\uAFB8\uC138\uC694. \uD638\uD761 \uD6C8\uB828\uACFC \uC778\uC9C0 \uAD50\uC815\uC744 \uD1B5\uD574 \uC548\uAC1C \uB080 \uC815\uC6D0\uC774 \uC810\uCC28 \uB9D1\uC544\uC9D1\uB2C8\uB2E4.",
      "Cultivate your own garden based on PHQ-9\xB7SCT results. Through breathing exercises and cognitive reframing, your foggy garden gradually clears."
    ),
    tags: [t("\uC774\uC644", "Relaxation"), t("\uC778\uC9C0\uAD50\uC815", "Cognitive Reframing"), t("\uD638\uD761", "Breathing")],
    requiredTests: [],
    suggestedFor: t(
      "\uC6B0\uC6B8\xB7\uBD88\uC548 \uC810\uC218\uAC00 \uB192\uC740 \uBD84, \uC2A4\uD2B8\uB808\uC2A4 \uD574\uC18C\uAC00 \uD544\uC694\uD55C \uBD84",
      "Those with high depression/anxiety scores or in need of stress relief"
    ),
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "breathing", name: t("\uC228 \uC26C\uB294 \uD638\uC218", "Breathing Lake"), emoji: "\u{1F4A7}", desc: t("4-4-4 \uD638\uD761\uBC95\uC73C\uB85C \uB9C8\uC74C\uC744 \uACE0\uC694\uD558\uAC8C", "Calm your mind with 4-4-4 breathing") },
      { id: "cbt", name: t("\uC0DD\uAC01\uC758 \uAC00\uC9C0\uCE58\uAE30", "Thought Pruning"), emoji: "\u{1F331}", desc: t("\uBD80\uC815\uC801\uC778 \uC0DD\uAC01\uC744 \uAE0D\uC815 \uD655\uC5B8\uC73C\uB85C \uBCC0\uD658", "Transform negative thoughts into positive affirmations") }
    ],
    Component: typeof GardenGame !== "undefined" ? GardenGame : null
  },
  // ── 감정꽃 찾기 (2호 예정) ─────────────────────────────
  {
    id: "efmt",
    name: t("\uAC10\uC815\uAF43 \uCC3E\uAE30", "Emotion Flower Hunt"),
    emoji: "\u{1F338}",
    tagline: t("\uAC10\uC815\uC744 \uC54C\uC544\uCC44\uB294 \uD6C8\uB828", "Training to recognize emotions"),
    description: t(
      "\uB2E4\uC591\uD55C \uD45C\uC815\uC758 \uAF43 \uC911\uC5D0\uC11C \uC6C3\uB294 \uAF43\uC744 \uBE60\uB974\uAC8C \uCC3E\uC544\uB0B4\uB294 \uAC10\uC815 \uC778\uC9C0 \uD6C8\uB828. PHQ-9 \uC810\uC218\uC5D0 \uB530\uB77C \uB09C\uC774\uB3C4\uAC00 \uC870\uC808\uB429\uB2C8\uB2E4.",
      "Quickly find the smiling flower among flowers with various expressions. Difficulty adjusts based on your PHQ-9 score."
    ),
    tags: [t("\uAC10\uC815\uC778\uC2DD", "Emotion Awareness"), t("\uC9D1\uC911\uB825", "Focus"), t("\uC778\uC9C0\uD6C8\uB828", "Cognitive Training")],
    requiredTests: ["PHQ9"],
    suggestedFor: t(
      "\uAC10\uC815 \uC778\uC2DD\uC774 \uC5B4\uB824\uC6B4 \uBD84, \uC9D1\uC911\uB825 \uD5A5\uC0C1\uC774 \uD544\uC694\uD55C \uBD84",
      "Those who struggle with emotion recognition or want to improve focus"
    ),
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "efmt_easy", name: t("\uAE30\uCD08 \uAC10\uC815 \uC778\uC2DD", "Basic Emotion Recognition"), emoji: "\u{1F33C}", desc: t("4x4 \uADF8\uB9AC\uB4DC\uC5D0\uC11C \uC6C3\uB294 \uAF43 \uCC3E\uAE30", "Find the smiling flower in a 4\xD74 grid") },
      { id: "efmt_speed", name: t("\uAC10\uC815 \uC18D\uB3C4 \uD6C8\uB828", "Emotion Speed Training"), emoji: "\u{1F33A}", desc: t("\uBE60\uB974\uAC8C \uBC18\uC751\uD558\uB294 \uAC10\uC815 \uC778\uC9C0", "Quick-response emotion recognition") }
    ],
    Component: typeof EFMTGame !== "undefined" ? EFMTGame : null
  },
  // ── 별빛 감사 일기 (3호) ────────────────────────────────
  {
    id: "gratitude",
    name: t("\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30", "Starlight Gratitude Journal"),
    emoji: "\u2B50",
    tagline: t("\uAC10\uC0AC\uC758 \uBCC4 3\uAC1C\uB97C \uBC24\uD558\uB298\uC5D0 \uBC1D\uD600\uC694", "Light 3 stars of gratitude in the night sky"),
    description: t(
      "\uB9E4\uC77C 3\uAC00\uC9C0 \uAC10\uC0AC \uC9C8\uBB38\uC5D0 \uB2F5\uD558\uBA70 \uBC24\uD558\uB298\uC5D0 \uBCC4\uC744 \uBC1D\uD788\uB294 \uB9C8\uC74C\uCC59\uAE40 \uAC8C\uC784. \uAE0D\uC815\uC2EC\uB9AC\uD559 \uAE30\uBC18\uC758 \uC77C\uC0C1 \uB8E8\uD2F4 \uBE4C\uB354.",
      "Answer 3 gratitude questions each day to light stars in the night sky. A daily routine builder grounded in positive psychology."
    ),
    tags: [t("\uAC10\uC0AC", "Gratitude"), t("\uB9C8\uC74C\uCC59\uAE40", "Mindfulness"), t("\uAE0D\uC815\uC2EC\uB9AC", "Positive Psychology")],
    requiredTests: [],
    suggestedFor: t(
      "\uB9E4\uC77C \uAE0D\uC815\uC801\uC778 \uC2B5\uAD00\uC744 \uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uBD84, \uBC88\uC544\uC6C3 \uD68C\uBCF5 \uC911\uC778 \uBD84",
      "Those who want to build positive daily habits or are recovering from burnout"
    ),
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "gratitude_write", name: t("\uAC10\uC0AC \uC4F0\uAE30", "Write Gratitude"), emoji: "\u270D\uFE0F", desc: t("3\uAC00\uC9C0 \uAC10\uC0AC \uC9C8\uBB38\uC5D0 \uB2F5\uD558\uAE30", "Answer 3 gratitude questions") }
    ],
    Component: typeof GratitudeGame !== "undefined" ? GratitudeGame : null
  },
  // ── 내면의 나무 (4호 예정) ─────────────────────────────
  {
    id: "tree",
    name: t("\uB0B4\uBA74\uC758 \uB098\uBB34", "Inner Tree"),
    emoji: "\u{1F333}",
    tagline: t("\uC790\uC544\uB97C \uB2E8\uB2E8\uD558\uAC8C \uD0A4\uC6CC\uAC00\uB294 \uC5EC\uC815", "A journey to grow a stronger self"),
    description: t(
      "DSI \uC790\uC544\uBD84\uD654 \uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uB3D9. ACT \uAE30\uBC18 3\uB2E8\uACC4(\uBFCC\uB9AC\xB7\uC904\uAE30\xB7\uAC00\uC9C0)\uB85C \uC790\uC544\uB97C \uB2E8\uB2E8\uD558\uAC8C \uC131\uC7A5\uC2DC\uD0A4\uB294 \uB9C8\uC74C\uCC59\uAE40 \uAC8C\uC784.",
      "Linked to DSI differentiation results. An ACT-based mindfulness game that grows your self through 3 stages: Roots, Trunk, and Branches."
    ),
    tags: [t("\uC790\uC544\uC131\uC7A5", "Self Growth"), t("\uB9C8\uC74C\uCC59\uAE40", "Mindfulness"), "ACT"],
    requiredTests: ["DSI"],
    suggestedFor: t(
      "\uC790\uC544\uBD84\uD654 \uC810\uC218\uAC00 \uB0AE\uC740 \uBD84, \uAD00\uACC4\uC5D0\uC11C \uC790\uC2E0\uC744 \uC783\uB294 \uBD84",
      "Those with low differentiation scores or who lose themselves in relationships"
    ),
    creditCost: 0,
    unlockLevel: 4,
    isAvailable: true,
    modules: [
      { id: "roots", name: t("\uBFCC\uB9AC \u2014 \uD604\uC7AC \uC21C\uAC04", "Roots \u2014 Present Moment"), emoji: "\u{1F331}", desc: t("\uC9C0\uAE08 \uC774 \uC21C\uAC04\uC5D0 \uB2FF\uAE30", "Connect to the present moment") },
      { id: "trunk", name: t("\uC904\uAE30 \u2014 \uB098\uC758 \uAC00\uCE58", "Trunk \u2014 My Values"), emoji: "\u{1F333}", desc: t("\uB098\uC5D0\uAC8C \uC18C\uC911\uD55C \uAC83 \uCC3E\uAE30", "Find what matters most to you") },
      { id: "branches", name: t("\uAC00\uC9C0 \u2014 \uB098\uC758 \uD589\uB3D9", "Branches \u2014 My Actions"), emoji: "\u{1F33F}", desc: t("\uAC00\uCE58\uB97C \uD5A5\uD55C \uC791\uC740 \uD589\uB3D9", "Take small steps toward your values") }
    ],
    Component: typeof TreeGame !== "undefined" ? TreeGame : null
  },
  // ── 🧠 마음 집중력 (6호) ───────────────────────────────
  {
    id: "focus",
    name: t("\uB9C8\uC74C \uC9D1\uC911\uB825", "Mind Focus"),
    emoji: "\u{1F9E0}",
    tagline: t("\uC22B\uC790\xB7\uD328\uD134\uC73C\uB85C \uC9D1\uC911\uB825\uC744 \uB2E8\uB828\uD574\uC694", "Train your focus with numbers and patterns"),
    description: t(
      "\uC22B\uC790 \uAE30\uC5B5\uACFC \uADF8\uB9AC\uB4DC \uD328\uD134 \uD6C8\uB828\uC744 \uD1B5\uD574 \uC9C0\uAE08 \uC774 \uC21C\uAC04\uC5D0 \uC9D1\uC911\uD558\uB294 \uB9C8\uC74C\uCC59\uAE40 \uC778\uC9C0 \uD6C8\uB828. GAD-7/PHQ-9 \uC810\uC218\uC5D0 \uB530\uB77C \uB09C\uC774\uB3C4\uAC00 \uC870\uC808\uB429\uB2C8\uB2E4.",
      "A mindfulness cognitive training to focus on the present moment through number memory and grid pattern exercises. Difficulty adjusts to your GAD-7/PHQ-9 scores."
    ),
    tags: [t("\uC9D1\uC911\uB825", "Focus"), t("\uC778\uC9C0\uD6C8\uB828", "Cognitive Training"), t("\uB9C8\uC74C\uCC59\uAE40", "Mindfulness")],
    requiredTests: [],
    suggestedFor: t(
      "\uC9D1\uC911\uB825\uC774 \uB5A8\uC5B4\uC9C4 \uB290\uB08C\uC774 \uB4DC\uB294 \uBD84, \uB9C8\uC74C\uC774 \uBD84\uC0B0\uB418\uC5B4 \uC788\uB294 \uBD84",
      "Those feeling scattered or struggling to concentrate"
    ),
    creditCost: 0,
    unlockLevel: 3,
    isAvailable: true,
    modules: [
      { id: "focus_training", name: t("\uC9D1\uC911\uB825 \uD6C8\uB828", "Focus Training"), emoji: "\u{1F522}", desc: t("\uC22B\uC790 \uAE30\uC5B5 + \uD328\uD134 \uAE30\uC5B5 5\uB77C\uC6B4\uB4DC", "Number memory + pattern memory, 5 rounds") }
    ],
    Component: typeof FocusGame !== "undefined" ? FocusGame : null
  },
  // ── ⚡ 번아웃 회복 (5호) ────────────────────────────────
  {
    id: "burnout",
    name: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5", "Burnout Recovery"),
    emoji: "\u26A1",
    tagline: t("\uC791\uC740 \uBBF8\uC158\uC73C\uB85C \uC5D0\uB108\uC9C0\uB97C \uB418\uCC3E\uB294 \uC5EC\uC815", "Reclaim your energy through small missions"),
    description: t(
      "\uBC88\uC544\uC6C3 \uAC80\uC0AC \uC810\uC218\uC5D0 \uB530\uB77C \uB9DE\uCDA4 \uD68C\uBCF5 \uBBF8\uC158\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4. \uBBF8\uC158\uC744 \uC644\uB8CC\uD560\uC218\uB85D \uB2F9\uC2E0\uC758 \uD68C\uBCF5 \uB3C4\uC2DC\uAC00 \uC131\uC7A5\uD558\uACE0 \uC5D0\uB108\uC9C0\uAC00 \uCC28\uC624\uB985\uB2C8\uB2E4.",
      "Tailored recovery missions based on your burnout score. As you complete missions, your recovery city grows and your energy is restored."
    ),
    tags: [t("\uBC88\uC544\uC6C3\uD68C\uBCF5", "Burnout Recovery"), t("\uB8E8\uD2F4", "Routine"), t("\uBBF8\uC158", "Mission")],
    requiredTests: ["BURNOUT"],
    suggestedFor: t(
      "\uBC88\uC544\uC6C3 \uC810\uC218\uAC00 \uB192\uC740 \uBD84, \uC9C0\uCE58\uACE0 \uBB34\uAE30\uB825\uD568\uC744 \uB290\uB07C\uB294 \uBD84",
      "Those with high burnout scores or feeling exhausted and unmotivated"
    ),
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "missions", name: t("\uD68C\uBCF5 \uBBF8\uC158", "Recovery Missions"), emoji: "\u{1F3AF}", desc: t("\uBC88\uC544\uC6C3 \uC810\uC218 \uAE30\uBC18 \uB9DE\uCDA4 \uD68C\uBCF5 \uBBF8\uC158", "Personalized recovery missions based on burnout score") },
      { id: "city", name: t("\uD68C\uBCF5 \uB3C4\uC2DC", "Recovery City"), emoji: "\u{1F3D9}\uFE0F", desc: t("\uBBF8\uC158 \uC644\uB8CC \uC2DC \uB3C4\uC2DC\uAC00 \uC131\uC7A5", "City grows as you complete missions") },
      { id: "weekly_report", name: t("\uC8FC\uAC04 \uB9AC\uD3EC\uD2B8", "Weekly Report"), emoji: "\u{1F4CA}", desc: t("\uD55C \uC8FC\uAC04\uC758 \uD68C\uBCF5 \uD750\uB984 \uD655\uC778", "Review your weekly recovery progress") }
    ],
    Component: typeof BurnoutGame !== "undefined" ? BurnoutGame : null
  },
  // ── 🫧 걱정 풍선 (8호) ─────────────────────────────────────
  {
    id: "worry",
    name: t("\uAC71\uC815 \uD48D\uC120", "Worry Bubbles"),
    emoji: "\u{1FAE7}",
    tagline: t("\uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uB0A0\uB824 \uBCF4\uB0B4\uC694", "Put your worries in bubbles and let them go"),
    description: t(
      "\uC218\uC6A9\uC804\uB150(ACT) \uC6D0\uB9AC\uC5D0\uC11C \uCC29\uC548\uD55C \uB9C8\uC74C \uB0B4\uB824\uB193\uAE30 \uC5F0\uC2B5. \uC9C0\uAE08 \uB9C8\uC74C\uC744 \uBB34\uAC81\uAC8C \uD558\uB294 \uAC71\uC815\uB4E4\uC744 \uD48D\uC120\uC5D0 \uB2F4\uACE0 \uD558\uB098\uC529 \uD130\uB728\uB9AC\uBA70 \uB0B4\uB824\uB193\uC544 \uBCF4\uC138\uC694. \uAC71\uC815\uC740 \uC0DD\uAC01\uC77C \uBFD0\uC774\uC5D0\uC694.",
      "A letting-go exercise inspired by ACT (acceptance & commitment) principles. Place your worries into bubbles and pop them one by one. Worry is just a thought."
    ),
    tags: [t("\uC774\uC644", "Relaxation"), t("\uC2A4\uD2B8\uB808\uC2A4\uD574\uC18C", "Stress Relief"), "ACT", t("\uB9C8\uC74C\uCC59\uAE40", "Mindfulness")],
    requiredTests: [],
    suggestedFor: t(
      "\uAC71\uC815\uC774 \uB9CE\uC740 \uBD84, \uB9C8\uC74C\uC774 \uBB34\uAC70\uC6B4 \uBD84, \uC2A4\uD2B8\uB808\uC2A4\uB97C \uB0B4\uB824\uB193\uACE0 \uC2F6\uC740 \uBD84",
      "Those who worry a lot, feel weighed down, or want to release stress"
    ),
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "bubbles", name: t("\uAC71\uC815 \uD48D\uC120 \uD130\uB728\uB9AC\uAE30", "Pop the Worry Bubbles"), emoji: "\u{1FAE7}", desc: t("\uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uD130\uB728\uB9AC\uBA70 \uB0B4\uB824\uB193\uAE30", "Fill bubbles with worries and pop them to let go") }
    ],
    Component: typeof WorryGame !== "undefined" ? WorryGame : null
  }
];
function getPlayableGames(completedTests = [], gardenLevel = 1) {
  return GAME_REGISTRY.map((game) => ({
    ...game,
    isUnlocked: game.unlockLevel <= gardenLevel,
    hasRequiredTests: game.requiredTests.length === 0 || game.requiredTests.every((t2) => completedTests.includes(t2)),
    canPlay: game.isAvailable && game.unlockLevel <= gardenLevel && (game.requiredTests.length === 0 || game.requiredTests.every((t2) => completedTests.includes(t2)))
  }));
}
function getTestGameMap() {
  const map = {};
  GAME_REGISTRY.forEach((g) => {
    g.requiredTests.forEach((t2) => {
      if (!map[t2]) map[t2] = [];
      map[t2].push(g.id);
    });
  });
  return map;
}
function getGameById(id) {
  return GAME_REGISTRY.find((g) => g.id === id) || null;
}
