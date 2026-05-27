const GAME_REGISTRY = [
  // ── 감사 제단 (0호 — Lv.1 기본 제공) ──────────────────────
  // 기반: 감정 수채화 → 주님께 감정 내어드리기
  {
    id: "mood",
    name: "\uAC10\uC0AC \uC81C\uB2E8",
    emoji: "\u{1F54A}\uFE0F",
    tagline: "\uB9E4\uC77C \uC8FC\uB2D8 \uC55E\uC5D0 \uB9C8\uC74C\uC744 \uB0B4\uC5B4\uB4DC\uB824\uC694",
    description: "\uD558\uB8E8 \uD55C \uBC88, \uC9C0\uAE08 \uB290\uB07C\uB294 \uAC10\uC815\uC744 \uC8FC\uB2D8 \uC55E\uC5D0 \uC194\uC9C1\uD558\uAC8C \uB0B4\uC5B4\uB4DC\uB9AC\uC138\uC694. \uAC10\uC815\uC744 \uC54C\uC544\uCC28\uB9AC\uACE0 \uD558\uB098\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9AC\uB294 \uAC83\uC774 \uCE58\uC720\uC758 \uC2DC\uC791\uC785\uB2C8\uB2E4. 30\uC77C\uAC04\uC758 \uAC10\uC815 \uD750\uB984\uC744 \uB2EC\uB825\uC73C\uB85C \uD655\uC778\uD574\uC694.",
    tags: ["\uAC10\uC815\uC778\uC2DD", "\uAE30\uB3C4", "\uC2B5\uAD00"],
    requiredTests: [],
    suggestedFor: "\uAC10\uC815\uC744 \uAE30\uB85D\uD558\uACE0 \uC2F6\uC740 \uBD84, \uD558\uB098\uB2D8\uACFC\uC758 \uAD50\uC81C\uB97C \uC77C\uC0C1\uD654\uD558\uACE0 \uC2F6\uC740 \uBD84",
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "checkin", name: "\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB3C4", emoji: "\u{1F54A}\uFE0F", desc: "\uC624\uB298 \uB290\uB07C\uB294 \uAC10\uC815\uC744 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9AC\uAE30" },
      { id: "calendar", name: "\uAC10\uC0AC \uB2EC\uB825", emoji: "\u{1F4C5}", desc: "30\uC77C \uAC10\uC815\xB7\uAC10\uC0AC \uD750\uB984 \uBCF4\uAE30" }
    ],
    Component: typeof MoodGame !== "undefined" ? MoodGame : null
  },
  // ── 말씀의 정원 (1호) ──────────────────────────────────────
  // 기반: 마음의 정원 → 말씀으로 마음을 가꾸기
  {
    id: "garden",
    name: "\uB9D0\uC500\uC758 \uC815\uC6D0",
    emoji: "\u{1F33F}",
    tagline: "\uB9D0\uC500\uC73C\uB85C \uB9C8\uC74C\uC758 \uC815\uC6D0\uC744 \uAC00\uAFB8\uC5B4\uC694",
    description: '\uD638\uD761 \uAE30\uB3C4\uC640 \uB9D0\uC500 \uBB35\uC0C1\uC73C\uB85C \uB0B4 \uB9C8\uC74C\uC758 \uC815\uC6D0\uC744 \uAC00\uAFB8\uC138\uC694. \uC548\uAC1C \uB080 \uB9C8\uC74C\uC774 \uD558\uB098\uB2D8\uC758 \uD3C9\uAC15\uC73C\uB85C \uC810\uCC28 \uB9D1\uC544\uC9D1\uB2C8\uB2E4. "\uD3C9\uAC15\uC758 \uD558\uB098\uB2D8\uC774 \uB108\uD76C\uC640 \uD568\uAED8 \uACC4\uC2DC\uB9AC\uB77C" (\uBE4C 4:9)',
    tags: ["\uC774\uC644", "\uD638\uD761\uAE30\uB3C4", "\uB9D0\uC500\uBB35\uC0C1"],
    requiredTests: [],
    suggestedFor: "\uC6B0\uC6B8\xB7\uBD88\uC548 \uC810\uC218\uAC00 \uB192\uC740 \uBD84, \uB9C8\uC74C\uC758 \uD3C9\uC548\uC774 \uD544\uC694\uD55C \uBD84",
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "breathing", name: "\uD638\uD761 \uAE30\uB3C4", emoji: "\u{1F4A7}", desc: "4-4-4 \uD638\uD761\uBC95\uC73C\uB85C \uC8FC\uB2D8 \uC55E\uC5D0 \uACE0\uC694\uD788 \uC11C\uAE30" },
      { id: "cbt", name: "\uB9D0\uC500 \uD655\uC5B8", emoji: "\u{1F4D6}", desc: "\uBD80\uC815\uC801 \uC0DD\uAC01\uC744 \uB9D0\uC500 \uD655\uC5B8\uC73C\uB85C \uC804\uD658\uD558\uAE30" }
    ],
    Component: typeof GardenGame !== "undefined" ? GardenGame : null
  },
  // ── 감정꽃 찾기 (2호) ──────────────────────────────────────
  {
    id: "efmt",
    name: "\uAC10\uC815\uAF43 \uCC3E\uAE30",
    emoji: "\u{1F338}",
    tagline: "\uD558\uB098\uB2D8\uC774 \uC8FC\uC2E0 \uAC10\uC815\uC744 \uC54C\uC544\uCC44\uC694",
    description: "\uB2E4\uC591\uD55C \uD45C\uC815\uC758 \uAF43 \uC911\uC5D0\uC11C \uC6C3\uB294 \uAF43\uC744 \uBE60\uB974\uAC8C \uCC3E\uC544\uB0B4\uB294 \uAC10\uC815 \uC778\uC9C0 \uD6C8\uB828. \uD558\uB098\uB2D8\uC774 \uCC3D\uC870\uD558\uC2E0 \uAC10\uC815\uC744 \uC138\uBC00\uD558\uAC8C \uC778\uC2DD\uD558\uB294 \uD6C8\uB828\uC785\uB2C8\uB2E4.",
    tags: ["\uAC10\uC815\uC778\uC2DD", "\uC9D1\uC911\uB825", "\uC778\uC9C0\uD6C8\uB828"],
    requiredTests: ["PHQ9"],
    suggestedFor: "\uAC10\uC815 \uC778\uC2DD\uC774 \uC5B4\uB824\uC6B4 \uBD84, \uC9D1\uC911\uB825 \uD5A5\uC0C1\uC774 \uD544\uC694\uD55C \uBD84",
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "efmt_easy", name: "\uAE30\uCD08 \uAC10\uC815 \uC778\uC2DD", emoji: "\u{1F33C}", desc: "4x4 \uADF8\uB9AC\uB4DC\uC5D0\uC11C \uC6C3\uB294 \uAF43 \uCC3E\uAE30" },
      { id: "efmt_speed", name: "\uAC10\uC815 \uC18D\uB3C4 \uD6C8\uB828", emoji: "\u{1F33A}", desc: "\uBE60\uB974\uAC8C \uBC18\uC751\uD558\uB294 \uAC10\uC815 \uC778\uC9C0" }
    ],
    Component: typeof EFMTGame !== "undefined" ? EFMTGame : null
  },
  // ── 감사 별자리 (3호) ──────────────────────────────────────
  // 기반: 별빛 감사 일기 → 주님께 드리는 감사 기도
  {
    id: "gratitude",
    name: "\uAC10\uC0AC \uBCC4\uC790\uB9AC",
    emoji: "\u2728",
    tagline: "\uC8FC\uB2D8\uAED8 \uB4DC\uB9AC\uB294 \uAC10\uC0AC 3\uAC00\uC9C0\uB85C \uBC24\uD558\uB298\uC744 \uBC1D\uD600\uC694",
    description: '\uB9E4\uC77C 3\uAC00\uC9C0 \uAC10\uC0AC \uAE30\uB3C4\uB97C \uB4DC\uB9AC\uBA70 \uBC24\uD558\uB298\uC5D0 \uBCC4\uC744 \uBC1D\uD788\uB294 \uB9D0\uC500 \uAC8C\uC784. "\uD56D\uC0C1 \uAE30\uBED0\uD558\uB77C \uC26C\uC9C0 \uB9D0\uACE0 \uAE30\uB3C4\uD558\uB77C \uBC94\uC0AC\uC5D0 \uAC10\uC0AC\uD558\uB77C" (\uC0B4\uC804 5:16-18)',
    tags: ["\uAC10\uC0AC\uAE30\uB3C4", "\uB9C8\uC74C\uCC59\uAE40", "\uAE0D\uC815\uC2E0\uC559"],
    requiredTests: [],
    suggestedFor: "\uAC10\uC0AC \uC2B5\uAD00\uC744 \uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uBD84, \uBC88\uC544\uC6C3 \uD68C\uBCF5 \uC911\uC778 \uBD84",
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "gratitude_write", name: "\uAC10\uC0AC \uAE30\uB3C4 \uC4F0\uAE30", emoji: "\u270D\uFE0F", desc: "\uC624\uB298 \uAC10\uC0AC\uD55C 3\uAC00\uC9C0\uB97C \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9AC\uAE30" }
    ],
    Component: typeof GratitudeGame !== "undefined" ? GratitudeGame : null
  },
  // ── 믿음의 나무 (4호) ──────────────────────────────────────
  // 기반: 내면의 나무 → 신앙 정체성 성장
  {
    id: "tree",
    name: "\uBBFF\uC74C\uC758 \uB098\uBB34",
    emoji: "\u{1F333}",
    tagline: "\uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C \uC790\uC544\uB97C \uB2E8\uB2E8\uD558\uAC8C \uC138\uC6CC\uAC00\uC694",
    description: 'DSI \uC790\uC544\uBD84\uD654 \uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uB3D9. \uC131\uACBD\uC801 \uC815\uCCB4\uC131(\uBFCC\uB9AC\xB7\uC904\uAE30\xB7\uAC00\uC9C0)\uC73C\uB85C \uC790\uC544\uB97C \uB2E8\uB2E8\uD558\uAC8C \uC131\uC7A5\uC2DC\uD0A4\uB294 \uBBFF\uC74C \uC5EC\uC815. "\uB098\uB294 \uD3EC\uB3C4\uB098\uBB34\uC694 \uB108\uD76C\uB294 \uAC00\uC9C0\uB77C" (\uC694 15:5)',
    tags: ["\uC2E0\uC559\uC131\uC7A5", "\uC815\uCCB4\uC131", "\uB9D0\uC500"],
    requiredTests: ["DSI"],
    suggestedFor: "\uC790\uC544\uBD84\uD654 \uC810\uC218\uAC00 \uB0AE\uC740 \uBD84, \uAD00\uACC4\uC5D0\uC11C \uC790\uC2E0\uC744 \uC783\uB294 \uBD84",
    creditCost: 0,
    unlockLevel: 4,
    isAvailable: true,
    modules: [
      { id: "roots", name: "\uBFCC\uB9AC \u2014 \uD604\uC7AC \uC21C\uAC04", emoji: "\u{1F331}", desc: "\uC9C0\uAE08 \uC774 \uC21C\uAC04 \uD558\uB098\uB2D8\uACFC \uD568\uAED8 \uC788\uAE30" },
      { id: "trunk", name: "\uC904\uAE30 \u2014 \uB0B4 \uAC00\uCE58", emoji: "\u{1F333}", desc: "\uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C \uC18C\uC911\uD55C \uAC83 \uCC3E\uAE30" },
      { id: "branches", name: "\uAC00\uC9C0 \u2014 \uB098\uC758 \uD589\uB3D9", emoji: "\u{1F33F}", desc: "\uBBFF\uC74C\uC744 \uD5A5\uD55C \uC791\uC740 \uD589\uB3D9" }
    ],
    Component: typeof TreeGame !== "undefined" ? TreeGame : null
  },
  // ── 말씀 집중력 (5호) ──────────────────────────────────────
  // 기반: 마음 집중력 → 말씀 집중 훈련
  {
    id: "focus",
    name: "\uB9D0\uC500 \uC9D1\uC911\uB825",
    emoji: "\u{1F4FF}",
    tagline: "\uB9D0\uC500\uC5D0 \uC9D1\uC911\uD558\uB294 \uB9C8\uC74C\uC744 \uD6C8\uB828\uD574\uC694",
    description: '\uC22B\uC790 \uAE30\uC5B5\uACFC \uADF8\uB9AC\uB4DC \uD328\uD134 \uD6C8\uB828\uC744 \uD1B5\uD574 \uB9D0\uC500\uC5D0 \uC9D1\uC911\uD558\uB294 \uB2A5\uB825\uC744 \uD0A4\uC6C1\uB2C8\uB2E4. "\uC624\uC9C1 \uC5EC\uD638\uC640\uC758 \uC728\uBC95\uC744 \uC990\uAC70\uC6CC\uD558\uC5EC \uADF8\uC758 \uC728\uBC95\uC744 \uC8FC\uC57C\uB85C \uBB35\uC0C1\uD558\uB294\uB3C4\uB2E4" (\uC2DC 1:2)',
    tags: ["\uC9D1\uC911\uB825", "\uC778\uC9C0\uD6C8\uB828", "\uB9D0\uC500\uBB35\uC0C1"],
    requiredTests: [],
    suggestedFor: "\uC9D1\uC911\uB825\uC774 \uB5A8\uC5B4\uC9C4 \uB290\uB08C\uC774 \uB4DC\uB294 \uBD84, \uB9D0\uC500 \uBB35\uC0C1\uC774 \uC5B4\uB824\uC6B4 \uBD84",
    creditCost: 0,
    unlockLevel: 3,
    isAvailable: true,
    modules: [
      { id: "focus_training", name: "\uC9D1\uC911\uB825 \uD6C8\uB828", emoji: "\u{1F522}", desc: "\uC22B\uC790 \uAE30\uC5B5 + \uD328\uD134 \uAE30\uC5B5 5\uB77C\uC6B4\uB4DC" }
    ],
    Component: typeof FocusGame !== "undefined" ? FocusGame : null
  },
  // ── 회복의 샘 (6호) ────────────────────────────────────────
  // 기반: 번아웃 회복 → 말씀 기반 회복 미션
  {
    id: "burnout",
    name: "\uD68C\uBCF5\uC758 \uC0D8",
    emoji: "\u{1F4A7}",
    tagline: "\uB9D0\uC500 \uBBF8\uC158\uC73C\uB85C \uD68C\uBCF5\uC758 \uC0D8\uC744 \uCC44\uC6CC\uAC00\uC694",
    description: '\uBC88\uC544\uC6C3 \uAC80\uC0AC \uC810\uC218\uC5D0 \uB530\uB77C \uB9DE\uCDA4 \uB9D0\uC500 \uD68C\uBCF5 \uBBF8\uC158\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4. \uBBF8\uC158\uC744 \uC644\uB8CC\uD560\uC218\uB85D \uB2F9\uC2E0\uC758 \uD68C\uBCF5 \uB9C8\uC744\uC774 \uC131\uC7A5\uD558\uACE0 \uC0DD\uC218\uAC00 \uCC28\uC624\uB985\uB2C8\uB2E4. "\uC218\uACE0\uD558\uACE0 \uBB34\uAC70\uC6B4 \uC9D0 \uC9C4 \uC790\uB4E4\uC544 \uB2E4 \uB0B4\uAC8C\uB85C \uC624\uB77C" (\uB9C8 11:28)',
    tags: ["\uBC88\uC544\uC6C3\uD68C\uBCF5", "\uB9D0\uC500", "\uD68C\uBCF5\uBBF8\uC158"],
    requiredTests: ["BURNOUT"],
    suggestedFor: "\uBC88\uC544\uC6C3 \uC810\uC218\uAC00 \uB192\uC740 \uBD84, \uC9C0\uCE58\uACE0 \uBB34\uAE30\uB825\uD568\uC744 \uB290\uB07C\uB294 \uBD84",
    creditCost: 0,
    unlockLevel: 2,
    isAvailable: true,
    modules: [
      { id: "missions", name: "\uD68C\uBCF5 \uB9D0\uC500 \uBBF8\uC158", emoji: "\u{1F3AF}", desc: "\uBC88\uC544\uC6C3 \uC810\uC218 \uAE30\uBC18 \uB9DE\uCDA4 \uB9D0\uC500 \uD68C\uBCF5 \uBBF8\uC158" },
      { id: "city", name: "\uD68C\uBCF5 \uB9C8\uC744", emoji: "\u26EA", desc: "\uBBF8\uC158 \uC644\uB8CC \uC2DC \uB9C8\uC744\uC774 \uC131\uC7A5" },
      { id: "weekly_report", name: "\uC8FC\uAC04 \uB9AC\uD3EC\uD2B8", emoji: "\u{1F4CA}", desc: "\uD55C \uC8FC\uAC04\uC758 \uD68C\uBCF5 \uD750\uB984 \uD655\uC778" }
    ],
    Component: typeof BurnoutGame !== "undefined" ? BurnoutGame : null
  },
  // ── 기도 풍선 (7호) ────────────────────────────────────────
  // 기반: 걱정 풍선 → 주께 맡기기 (벧전 5:7)
  {
    id: "worry",
    name: "\uAE30\uB3C4 \uD48D\uC120",
    emoji: "\u{1F64F}",
    tagline: "\uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB824\uC694",
    description: '"\uB108\uD76C \uC5FC\uB824\uB97C \uB2E4 \uC8FC\uAED8 \uB9E1\uAE30\uB77C \uC774\uB294 \uADF8\uAC00 \uB108\uD76C\uB97C \uB3CC\uBCF4\uC2EC\uC774\uB77C" (\uBCA7\uC804 5:7). \uC9C0\uAE08 \uB9C8\uC74C\uC744 \uBB34\uAC81\uAC8C \uD558\uB294 \uAC71\uC815\uB4E4\uC744 \uD48D\uC120\uC5D0 \uB2F4\uACE0 \uD558\uB098\uC529 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9AC\uB294 \uAE30\uB3C4 \uD6C8\uB828.',
    tags: ["\uC774\uC644", "\uAE30\uB3C4", "\uB9C8\uC74C\uCC59\uAE40"],
    requiredTests: [],
    suggestedFor: "\uAC71\uC815\uC774 \uB9CE\uC740 \uBD84, \uB9C8\uC74C\uC774 \uBB34\uAC70\uC6B4 \uBD84, \uD558\uB098\uB2D8\uAED8 \uB0B4\uC5B4\uB4DC\uB9AC\uACE0 \uC2F6\uC740 \uBD84",
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "bubbles", name: "\uAE30\uB3C4 \uD48D\uC120 \uC62C\uB824\uB4DC\uB9AC\uAE30", emoji: "\u{1F64F}", desc: "\uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9AC\uAE30" }
    ],
    Component: typeof WorryGame !== "undefined" ? WorryGame : null
  },
  // ── QT 체크인 (8호) — CTS 전용 신규 ───────────────────────
  {
    id: "qt",
    name: "QT \uCCB4\uD06C\uC778",
    emoji: "\u{1F4D6}",
    tagline: "\uC624\uB298 \uB9D0\uC500 \uBB35\uC0C1\uC744 \uAE30\uB85D\uD574\uC694",
    description: "\uB9E4\uC77C \uC131\uACBD \uB9D0\uC500 \uC77D\uAE30\uC640 \uBB35\uC0C1\uC744 \uAE30\uB85D\uD558\uB294 QT(Quiet Time) \uCCB4\uD06C\uC778 \uAC8C\uC784. 30\uC77C QT \uB2EC\uB825\uC73C\uB85C \uB9D0\uC500 \uC0DD\uD65C \uC2B5\uAD00\uC744 \uB9CC\uB4E4\uC5B4\uAC00\uC138\uC694.",
    tags: ["\uB9D0\uC500\uBB35\uC0C1", "QT", "\uC2B5\uAD00"],
    requiredTests: [],
    suggestedFor: "\uADDC\uCE59\uC801\uC778 QT \uC2B5\uAD00\uC744 \uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uBD84, \uB9D0\uC500 \uC0DD\uD65C\uC744 \uC2DC\uC791\uD558\uACE0 \uC2F6\uC740 \uBD84",
    creditCost: 0,
    unlockLevel: 1,
    isAvailable: true,
    modules: [
      { id: "qt_checkin", name: "\uC624\uB298\uC758 QT", emoji: "\u{1F4D6}", desc: "\uC624\uB298 \uC77D\uC740 \uB9D0\uC500\uACFC \uBB35\uC0C1 \uAE30\uB85D\uD558\uAE30" }
    ],
    Component: typeof QTGame !== "undefined" ? QTGame : null
  }
];
function getPlayableGames(completedTests = [], gardenLevel = 1) {
  return GAME_REGISTRY.map((game) => ({
    ...game,
    isUnlocked: game.unlockLevel <= gardenLevel,
    hasRequiredTests: game.requiredTests.length === 0 || game.requiredTests.every((t) => completedTests.includes(t)),
    canPlay: game.isAvailable && game.unlockLevel <= gardenLevel && (game.requiredTests.length === 0 || game.requiredTests.every((t) => completedTests.includes(t)))
  }));
}
function getTestGameMap() {
  const map = {};
  GAME_REGISTRY.forEach((g) => {
    g.requiredTests.forEach((t) => {
      if (!map[t]) map[t] = [];
      map[t].push(g.id);
    });
  });
  return map;
}
function getGameById(id) {
  return GAME_REGISTRY.find((g) => g.id === id) || null;
}
