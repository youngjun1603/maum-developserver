"use strict";
const GameEngine = /* @__PURE__ */ (() => {
  const TOKEN_KEY = "game_token";
  function authHeader() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "Authorization": "Bearer " + t } : {};
  }
  async function getMe() {
    const res = await fetch("/api/game/me", { headers: authHeader() });
    return res.json();
  }
  async function saveSession({ gameId, moduleType, score, durationSec, metadata }) {
    const res = await fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        game_id: gameId,
        module_type: moduleType,
        score,
        duration_sec: durationSec,
        metadata
      })
    });
    return res.json();
  }
  async function transformSentence(text) {
    const res = await fetch("/api/game/ai-transform", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ text })
    });
    return res.json();
  }
  async function updateVisual(phq9Score) {
    const res = await fetch("/api/game/visual", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ phq9_score: phq9Score })
    });
    return res.json();
  }
  const LEVELS = [
    { level: 1, name: "\uC528\uC557", emoji: "\u{1F331}", minExp: 0, maxExp: 100 },
    { level: 2, name: "\uC0C8\uC2F9", emoji: "\u{1F33F}", minExp: 100, maxExp: 250 },
    { level: 3, name: "\uAF43\uBD09\uC624\uB9AC", emoji: "\u{1F338}", minExp: 250, maxExp: 500 },
    { level: 4, name: "\uAF43\uD53C\uC6C0", emoji: "\u{1F33A}", minExp: 500, maxExp: 900 },
    { level: 5, name: "\uB9CC\uAC1C", emoji: "\u{1F333}", minExp: 900, maxExp: 1500 },
    { level: 6, name: "\uC815\uC6D0\uC0AC", emoji: "\u{1F3E1}", minExp: 1500, maxExp: 9999 }
  ];
  function getLevelInfo(exp) {
    const info = [...LEVELS].reverse().find((l) => exp >= l.minExp) || LEVELS[0];
    const nextLevel = LEVELS[info.level] || null;
    const progress = nextLevel ? Math.round((exp - info.minExp) / (info.maxExp - info.minExp) * 100) : 100;
    return { ...info, nextLevel, progress, currentExp: exp };
  }
  const GARDEN_THEMES = {
    foggy: {
      sky: ["#9BA8B0", "#C5CFD6", "#D8DFE4"],
      ground: "#7A8A7A",
      label: "\uC548\uAC1C\uAC00 \uC790\uC6B1\uD55C \uC815\uC6D0",
      desc: "\uC9C0\uAE08\uC740 \uB9CE\uC774 \uD798\uB4DC\uC2DC\uC8E0. \uD568\uAED8 \uC870\uAE08\uC529 \uAC77\uC5B4\uB0B4\uC694."
    },
    clearing: {
      sky: ["#7FA8C8", "#A8C8E0", "#C8DFF0"],
      ground: "#5E8A4E",
      label: "\uB9D1\uC544\uC9C0\uB294 \uC815\uC6D0",
      desc: "\uC548\uAC1C\uAC00 \uAC77\uD788\uACE0 \uC788\uC5B4\uC694. \uC798 \uD558\uACE0 \uACC4\uC138\uC694."
    },
    blooming: {
      sky: ["#4A8EC2", "#7BB8D8", "#A8D4E8"],
      ground: "#4A7A3E",
      label: "\uAF43\uC774 \uD53C\uB294 \uC815\uC6D0",
      desc: "\uC815\uC6D0\uC774 \uD65C\uC9DD \uD53C\uC5B4\uC788\uC5B4\uC694. \uC624\uB298\uB3C4 \uC218\uACE0\uD588\uC5B4\uC694."
    }
  };
  function getGardenTheme(visualStatus) {
    return GARDEN_THEMES[visualStatus] || GARDEN_THEMES.clearing;
  }
  const ACHIEVEMENTS = {
    // ── 기본 ─────────────────────────────────────────────
    first_play: { name: "\uCCAB \uBC1C\uAC78\uC74C", emoji: "\u{1F6B6}", desc: "\uCC98\uC74C\uC73C\uB85C \uAC8C\uC784\uC744 \uD50C\uB808\uC774\uD588\uC5B4\uC694" },
    // ── 연속 출석 ─────────────────────────────────────────
    streak_3: { name: "3\uC77C \uC5F0\uC18D", emoji: "\u{1F525}", desc: "3\uC77C \uC5F0\uC18D \uBC29\uBB38\uD588\uC5B4\uC694" },
    streak_7: { name: "\uC77C\uC8FC\uC77C\uC758 \uAE30\uC801", emoji: "\u{1F525}", desc: "7\uC77C \uC5F0\uC18D \uBC29\uBB38\uD588\uC5B4\uC694" },
    streak_14: { name: "\uB450 \uC8FC\uC758 \uC5EC\uC815", emoji: "\u{1F525}", desc: "14\uC77C \uC5F0\uC18D \uBC29\uBB38\uD588\uC5B4\uC694" },
    perfect_week: { name: "\uC644\uBCBD\uD55C \uD55C \uC8FC", emoji: "\u{1F31F}", desc: "7\uC77C \uBAA8\uB450 \uBE60\uC9D0\uC5C6\uC774 \uC815\uC6D0\uC5D0 \uC654\uC5B4\uC694" },
    // ── 레벨 ─────────────────────────────────────────────
    level_3: { name: "\uAF43\uBD09\uC624\uB9AC", emoji: "\u{1F338}", desc: "\uB808\uBCA8 3\uC5D0 \uB3C4\uB2EC\uD588\uC5B4\uC694" },
    level_5: { name: "\uB9CC\uAC1C", emoji: "\u{1F333}", desc: "\uB808\uBCA8 5\uC5D0 \uB3C4\uB2EC\uD588\uC5B4\uC694" },
    // ── 경험치 ───────────────────────────────────────────
    exp_500: { name: "\uC131\uC2E4\uD55C \uC815\uC6D0\uC0AC", emoji: "\u{1F3C5}", desc: "\uACBD\uD5D8\uCE58 500 \uB2EC\uC131" },
    exp_1000: { name: "\uC219\uB828\uB41C \uC815\uC6D0\uC0AC", emoji: "\u{1F947}", desc: "\uACBD\uD5D8\uCE58 1000 \uB2EC\uC131" },
    // ── 게임별 숙련 ───────────────────────────────────────
    breath_master: { name: "\uD638\uD761 \uBA85\uC778", emoji: "\u{1F4A7}", desc: "\uD638\uD761 \uD6C8\uB828\uC744 10\uD68C \uC644\uB8CC\uD588\uC5B4\uC694" },
    cbt_master: { name: "\uC0DD\uAC01 \uAD50\uC815\uC0AC", emoji: "\u{1F331}", desc: "\uC0DD\uAC01 \uAD50\uC815\uC744 5\uD68C \uC644\uB8CC\uD588\uC5B4\uC694" },
    burnout_fighter: { name: "\uBC88\uC544\uC6C3 \uADF9\uBCF5", emoji: "\u26A1", desc: "\uBC88\uC544\uC6C3 \uBBF8\uC158\uC744 5\uC77C \uC644\uB8CC\uD588\uC5B4\uC694" },
    // ── 감정 수채화 ───────────────────────────────────────
    mood_7: { name: "\uAC10\uC815 \uD0D0\uD5D8\uAC00", emoji: "\u{1F3A8}", desc: "7\uC77C \uC5F0\uC18D \uAC10\uC815\uC744 \uAE30\uB85D\uD588\uC5B4\uC694" },
    mood_30: { name: "\uAC10\uC815 \uC608\uC220\uAC00", emoji: "\u{1F5BC}\uFE0F", desc: "\uAC10\uC815 \uAE30\uB85D\uC744 30\uBC88 \uC644\uB8CC\uD588\uC5B4\uC694" },
    // ── 감사 일기 ─────────────────────────────────────────
    gratitude_7: { name: "\uBCC4\uBE5B \uC218\uC9D1\uAC00", emoji: "\u{1F320}", desc: "7\uC77C \uC5F0\uC18D \uAC10\uC0AC \uC77C\uAE30\uB97C \uC37C\uC5B4\uC694" },
    // ── 탐험 ─────────────────────────────────────────────
    all_games: { name: "\uC815\uC6D0 \uD0D0\uD5D8\uAC00", emoji: "\u{1F5FA}\uFE0F", desc: "5\uAC00\uC9C0 \uC774\uC0C1 \uAC8C\uC784\uC744 \uBAA8\uB450 \uACBD\uD5D8\uD588\uC5B4\uC694" }
  };
  function getAchievementInfo(id) {
    return ACHIEVEMENTS[id] || { name: id, emoji: "\u{1F3C6}", desc: "" };
  }
  function formatDuration(sec) {
    if (sec < 60) return `${sec}\uCD08`;
    return `${Math.floor(sec / 60)}\uBD84 ${sec % 60}\uCD08`;
  }
  function formatRelativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 6e4);
    if (min < 1) return "\uBC29\uAE08 \uC804";
    if (min < 60) return `${min}\uBD84 \uC804`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}\uC2DC\uAC04 \uC804`;
    return `${Math.floor(hr / 24)}\uC77C \uC804`;
  }
  async function saveScore(testType, score) {
    const res = await fetch("/api/game/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ test_type: testType, score })
    });
    return res.json();
  }
  async function getCredits() {
    const res = await fetch("/api/game/credits", { headers: authHeader() });
    return res.json();
  }
  async function spendCredit(gameId, amount) {
    if (!amount || amount <= 0) return { success: true, data: { balance: null, spent: 0 } };
    const res = await fetch("/api/game/spend-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ game_id: gameId, amount })
    });
    return res.json();
  }
  async function getLeaderboard() {
    const res = await fetch("/api/game/leaderboard", { headers: authHeader() });
    return res.json();
  }
  async function getDailyTip(context) {
    const res = await fetch("/api/game/daily-tip", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(context)
    });
    return res.json();
  }
  async function getMoodHistory(days = 30) {
    const res = await fetch(`/api/game/mood-history?days=${days}`, { headers: authHeader() });
    return res.json();
  }
  async function getEmotionReport() {
    const res = await fetch("/api/game/emotion-report", { headers: authHeader() });
    return res.json();
  }
  async function getGameStats() {
    const res = await fetch("/api/game/stats", { headers: authHeader() });
    return res.json();
  }
  async function getBurnoutHistory() {
    const res = await fetch("/api/game/burnout-history", { headers: authHeader() });
    return res.json();
  }
  async function getRecentSessions(limit = 20) {
    const res = await fetch(`/api/game/sessions?limit=${limit}`, { headers: authHeader() });
    return res.json();
  }
  async function getSessionFeedback(gameId, score, moduleType) {
    const res = await fetch("/api/game/session-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ game_id: gameId, score, module_type: moduleType })
    });
    return res.json();
  }
  async function recoverStreak() {
    const res = await fetch("/api/game/streak/recover", { method: "POST", headers: authHeader() });
    return res.json();
  }
  async function getCampaign() {
    const res = await fetch("/api/game/campaign", { headers: authHeader() });
    return res.json();
  }
  async function claimCampaign(chapterId) {
    const res = await fetch("/api/game/campaign/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ chapter_id: chapterId })
    });
    return res.json();
  }
  async function apiFetch(path, init = {}) {
    return fetch(path, { ...init, headers: { ...authHeader(), ...init.headers || {} } });
  }
  return {
    getMe,
    saveSession,
    transformSentence,
    updateVisual,
    getCredits,
    spendCredit,
    saveScore,
    getLeaderboard,
    getDailyTip,
    getMoodHistory,
    getEmotionReport,
    getGameStats,
    getBurnoutHistory,
    getRecentSessions,
    getSessionFeedback,
    recoverStreak,
    getCampaign,
    claimCampaign,
    apiFetch,
    getLevelInfo,
    getGardenTheme,
    getAchievementInfo,
    formatDuration,
    formatRelativeTime,
    LEVELS
  };
})();
const PHYWEB_URL = (() => {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3001";
  return "https://lightoflife.limyj007.workers.dev";
})();
const MAUMFUL_URL = PHYWEB_URL;
