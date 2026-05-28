const { useState, useEffect, useRef, useCallback } = React;
const C = {
  rose: "#B5556A",
  roseL: "#D4849A",
  rosePale: "#FCF0F3",
  cream: "#FDFCF7",
  sand: "#F5EFE0",
  lavender: "#7A6EA8",
  lavL: "#A89ED4",
  lavPale: "#F0EEF8",
  amber: "#D4954A",
  amberL: "#E8C47A",
  muted: "#8A8A7A",
  dark: "#2C2020",
  heartRed: "#E05C7A"
};
const COUPLE_LANG = new URLSearchParams(location.search).get("lang") || "ko";
const tl = (ko, en) => COUPLE_LANG === "en" ? en : ko;
const TOKEN_KEY = "couple_token";
const MAUMFUL_URL = (() => {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:3000";
  if (h.includes("lightoflife")) return "https://jesusmaum.com";
  if (h.includes("maumcouple-dev") || h.includes("-dev.")) return "https://maumful-dev.limyj007.workers.dev";
  return "https://maumful.com";
})();
const IS_CTS = window.location.hostname.includes("lightoflife");
const SERVICE_NAME = IS_CTS ? tl("\uCEE4\uD50C \uCF00\uC5B4", "Couple Care") : tl("\uB9C8\uC74C\uCEE4\uD50C", "Maum Couple");
const SERVICE_ICON = IS_CTS ? "\u{1F491}" : "\u{1F495}";
const BACK_LABEL = IS_CTS ? "\u2190 The Light of Life" : tl("\u2190 \uB9C8\uC74C\uD480", "\u2190 Maumful");
const LOADING_TEXT = IS_CTS ? tl("\uCEE4\uD50C \uCF00\uC5B4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...", "Loading Couple Care...") : tl("\uB9C8\uC74C\uCEE4\uD50C\uC744 \uBD88\uB7EC\uC624\uB294 \uC911...", "Loading Maum Couple...");
const MAIN_SERVICE_NAME = IS_CTS ? "The Light of Life" : tl("\uB9C8\uC74C\uD480", "Maumful");
const COUPLE_URL = IS_CTS ? "https://lightoflife-couple.limyj007.workers.dev" : "https://couple.maumful.com";
const COST_FULL = 45;
const COST_TWO = 35;
const COST_ONE = 20;
const api = {
  _h() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "Authorization": "Bearer " + t, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  },
  async get(path) {
    const r = await fetch(path, { headers: this._h() });
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, { method: "POST", headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  },
  async patch(path, body = {}) {
    const r = await fetch(path, { method: "PATCH", headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  }
};
function displayName(user) {
  return user?.nickname || user?.email?.split("@")[0] || tl("\uB098", "Me");
}
function fmtDate(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}
function scoreColor(score) {
  if (score >= 80) return "#4A9A5A";
  if (score >= 60) return C.rose;
  return C.amber;
}
function scoreLabel(score) {
  if (score >= 85) return tl("\uCC9C\uC0DD\uC5F0\uBD84 \u{1F495}", "Perfect Match \u{1F495}");
  if (score >= 70) return tl("\uC798 \uB9DE\uB294 \uCEE4\uD50C \u{1F491}", "Great Couple \u{1F491}");
  if (score >= 55) return tl("\uB178\uB825\uD558\uBA74 \uC644\uBCBD \u{1F338}", "Perfect with Effort \u{1F338}");
  return tl("\uB2E4\uB984 \uC18D\uC758 \uB9E4\uB825 \u{1F308}", "Beauty in Differences \u{1F308}");
}
const DAILY_QUESTIONS = COUPLE_LANG === "en" ? [
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
  "Is there a restaurant or caf\xE9 you really want to visit together?",
  "Is there a small favor you'd want your partner to do for you?",
  "Why do you think we get along so well?",
  "What feeling do you get when you're with your partner?"
] : [
  "\uCC98\uC74C \uB9CC\uB0AC\uC744 \uB54C \uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uC810\uC774 \uB9C8\uC74C\uC5D0 \uB4E4\uC5C8\uB098\uC694?",
  "\uC6B0\uB9AC\uAC00 \uD568\uAED8\uD55C \uAC00\uC7A5 \uC18C\uC911\uD55C \uC21C\uAC04\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "10\uB144 \uD6C4 \uC6B0\uB9AC\uB294 \uC5B4\uB514\uC11C \uC5B4\uB5BB\uAC8C \uC0B4\uACE0 \uC788\uC744\uAE4C\uC694?",
  "\uC11C\uB85C\uC5D0 \uB300\uD574 \uC544\uC9C1 \uBAA8\uB974\uB294 \uAC83\uC774 \uC788\uB2E4\uBA74 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
  "\uC0C1\uB300\uBC29\uC5D0\uAC8C \uAC00\uC7A5 \uAC10\uC0AC\uD55C \uC810\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC6B0\uB9AC \uAD00\uACC4\uC5D0\uC11C \uAC00\uC7A5 \uC790\uB791\uC2A4\uB7EC\uC6B4 \uBD80\uBD84\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uD568\uAED8 \uAF2D \uD574\uBCF4\uACE0 \uC2F6\uC740 \uBC84\uD0B7\uB9AC\uC2A4\uD2B8\uAC00 \uC788\uB098\uC694?",
  "\uB0B4\uAC00 \uD798\uB4E4 \uB54C \uC0C1\uB300\uBC29\uC774 \uC5B4\uB5BB\uAC8C \uD574\uC92C\uC73C\uBA74 \uD558\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uC791\uC740 \uC2B5\uAD00\uC774 \uADC0\uC5FD\uAC8C \uB290\uAEF4\uC9C0\uB098\uC694?",
  "\uC6B0\uB9AC\uC758 \uCCAB \uB370\uC774\uD2B8\uB97C \uB2E4\uC2DC \uD55C\uB2E4\uBA74 \uC5B4\uB514\uB97C \uAC00\uACE0 \uC2F6\uC73C\uC138\uC694?",
  "\uC11C\uB85C\uC5D0\uAC8C \uAC00\uC7A5 \uD798\uC774 \uB410\uB358 \uB9D0\uC774 \uC788\uB098\uC694?",
  "\uD568\uAED8 \uAC00\uC7A5 \uB9CE\uC774 \uC6C3\uC5C8\uB358 \uC21C\uAC04\uC740 \uC5B8\uC81C\uC778\uAC00\uC694?",
  "\uC0C1\uB300\uBC29\uC5D0\uAC8C \uD3C9\uC18C\uC5D0 \uD558\uC9C0 \uBABB\uD588\uB358 \uB9D0\uC774 \uC788\uB2E4\uBA74?",
  "\uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uBAA8\uC2B5\uC774 \uAC00\uC7A5 \uBA4B\uC788\uB2E4\uACE0 \uC0DD\uAC01\uD558\uB098\uC694?",
  "\uC11C\uB85C \uD568\uAED8 \uBC30\uC6B0\uACE0 \uC2F6\uC740 \uAC83\uC774 \uC788\uB098\uC694?",
  "\uAC00\uC7A5 \uC88B\uC544\uD558\uB294 \uC6B0\uB9AC\uB9CC\uC758 \uB8E8\uD2F4\uC774 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uC2A4\uD2B8\uB808\uC2A4 \uBC1B\uC744 \uB54C \uC5B4\uB5BB\uAC8C \uB3C4\uC640\uC904 \uC218 \uC788\uC744\uAE4C\uC694?",
  "\uD568\uAED8 \uC5EC\uD589\uD558\uACE0 \uC2F6\uC740 \uAFC8\uC758 \uC5EC\uD589\uC9C0\uB294 \uC5B4\uB514\uC778\uAC00\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uC774\uD574\uD574\uC92C\uB2E4\uACE0 \uB290\uB080 \uC21C\uAC04\uC740 \uC5B8\uC81C\uC778\uAC00\uC694?",
  "\uC11C\uB85C\uC5D0\uAC8C \uAC00\uC7A5 \uB2EE\uACE0 \uC2F6\uC740 \uC810\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uC5D0\uAC8C \uB354 \uC194\uC9C1\uD558\uAC8C \uB9D0\uD574\uC92C\uC73C\uBA74 \uD558\uB294 \uAC83\uC774 \uC788\uB098\uC694?",
  "\uC6B0\uB9AC\uC758 \uAD00\uACC4\uB97C \uD55C \uB2E8\uC5B4\uB85C \uD45C\uD604\uD558\uBA74 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uD568\uAED8 \uC774\uB8E8\uACE0 \uC2F6\uC740 \uAC00\uC7A5 \uD070 \uAFC8\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uC791\uC740 \uBC30\uB824\uAC00 \uAC00\uC7A5 \uAE30\uC5B5\uC5D0 \uB0A8\uB098\uC694?",
  "\uC11C\uB85C\uC758 \uCDE8\uBBF8\uB97C \uD568\uAED8 \uC990\uACA8\uBCF8 \uC801\uC774 \uC788\uB098\uC694? \uC5B4\uB560\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uC704\uD574 \uD574\uC900 \uAC83 \uC911 \uAC00\uC7A5 \uAC10\uB3D9\uC801\uC778 \uAC83\uC740?",
  "\uC6B0\uB9AC \uAD00\uACC4\uC5D0\uC11C \uC55E\uC73C\uB85C \uB354 \uB178\uB825\uD558\uACE0 \uC2F6\uC740 \uAC83\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC0C1\uB300\uBC29\uACFC \uD568\uAED8\uB77C\uBA74 \uBB34\uC5C7\uC774\uB4E0 \uD560 \uC218 \uC788\uC744 \uAC83 \uAC19\uC740 \uC774\uC720\uB294?",
  "\uC6B0\uB9AC\uAC00 \uB178\uBD80\uBD80\uAC00 \uB418\uC5C8\uC744 \uB54C \uC5B4\uB5A4 \uBAA8\uC2B5\uC774\uAE38 \uBC14\uB77C\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uC131\uACA9\uC774 \uB098\uB97C \uB354 \uC88B\uC740 \uC0AC\uB78C\uC73C\uB85C \uB9CC\uB4E4\uC5B4\uC8FC\uB098\uC694?",
  "\uD568\uAED8 \uD55C \uBC88\uCBE4 \uB3C4\uC804\uD574\uBCF4\uACE0 \uC2F6\uC740 \uC0C8\uB85C\uC6B4 \uACBD\uD5D8\uC774 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uC704\uD574 \uBCC0\uD574\uC900 \uAC83\uC774 \uC788\uB2E4\uBA74 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC6B0\uB9AC \uAD00\uACC4\uC5D0\uC11C \uAC00\uC7A5 \uC18C\uC911\uD788 \uC9C0\uD0A4\uACE0 \uC2F6\uC740 \uAC83\uC740?",
  "\uC11C\uB85C\uC5D0\uAC8C \uB354 \uC798 \uD45C\uD604\uD558\uACE0 \uC2F6\uC740 \uAC10\uC815\uC774 \uC788\uB098\uC694?",
  "\uD568\uAED8 \uB9E4\uC77C \uD558\uACE0 \uC2F6\uC740 \uC791\uC740 \uC2B5\uAD00\uC774 \uC788\uB2E4\uBA74?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uAC00\uC7A5 \uC798 \uC774\uD574\uD55C\uB2E4\uACE0 \uB290\uB07C\uB294 \uC21C\uAC04\uC740?",
  "\uC6B0\uB9AC\uAC00 \uD568\uAED8 \uC0B0\uB2E4\uBA74 \uC5B4\uB5A4 \uC9D1\uC5D0\uC11C \uC0B4\uACE0 \uC2F6\uB098\uC694?",
  "\uC11C\uB85C\uC758 \uAFC8\uC744 \uC751\uC6D0\uD558\uB294 \uB098\uB9CC\uC758 \uBC29\uBC95\uC774 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uC5D0\uAC8C \uBCF4\uB0B4\uB294 \uC0AC\uB791 \uC2E0\uD638\uB294 \uC5B4\uB5A4 \uAC83\uC778\uAC00\uC694?",
  "\uC6B0\uB9AC \uB458\uB9CC\uC758 \uD2B9\uBCC4\uD55C \uB2E8\uC5B4\uB098 \uC554\uD638 \uAC19\uC740 \uAC8C \uC788\uB098\uC694?",
  "\uD568\uAED8 \uBCF4\uB0B4\uB294 \uC2DC\uAC04 \uC911 \uAC00\uC7A5 \uD589\uBCF5\uD55C \uC21C\uAC04\uC740?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uC6C3\uAC8C \uB9CC\uB4DC\uB294 \uBC29\uBC95\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC11C\uB85C\uC5D0\uAC8C \uBBF8\uC548\uD55C \uB9C8\uC74C\uC774 \uC788\uB2E4\uBA74 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uD568\uAED8 \uC774\uB8E8\uACE0 \uC2F6\uC740 \uC62C\uD574\uC758 \uBAA9\uD45C\uAC00 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uC5C6\uC5C8\uB2E4\uBA74 \uC9C0\uAE08 \uB098\uB294 \uC5B4\uB5A4 \uC0AC\uB78C\uC774\uC5C8\uC744\uAE4C\uC694?",
  "\uC6B0\uB9AC\uAC00 \uCC98\uC74C \uC190\uC744 \uC7A1\uC740 \uC21C\uAC04\uC744 \uAE30\uC5B5\uD558\uB098\uC694?",
  "\uC11C\uB85C\uC758 \uAC00\uC7A5 \uD070 \uC7A5\uC810\uC744 \uC138 \uAC00\uC9C0\uC529 \uB9D0\uD574\uBCFC\uAE4C\uC694?",
  "\uD568\uAED8 \uBCF4\uACE0 \uC2F6\uC740 \uC601\uD654\uB098 \uB4DC\uB77C\uB9C8\uAC00 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uC5D0\uAC8C \uBC14\uB77C\uB294 \uD55C \uAC00\uC9C0\uAC00 \uC788\uB2E4\uBA74?",
  "\uC6B0\uB9AC\uAC00 \uCC98\uC74C '\uC0AC\uADC0\uC790'\uACE0 \uD588\uC744 \uB54C \uC5B4\uB5A4 \uAE30\uBD84\uC774\uC5C8\uB098\uC694?",
  "\uC11C\uB85C \uB2EE\uC740 \uC810\uC744 \uC138 \uAC00\uC9C0 \uCC3E\uC544\uBCFC \uC218 \uC788\uC744\uAE4C\uC694?",
  "\uC0C1\uB300\uBC29\uC758 \uC5B4\uB5A4 \uD589\uB3D9\uC774 \uAC00\uC7A5 \uC124\uB808\uAC8C \uB9CC\uB4DC\uB098\uC694?",
  "\uC6B0\uB9AC\uAC00 \uD568\uAED8 \uC131\uC7A5\uD588\uB2E4\uACE0 \uB290\uB07C\uB294 \uC21C\uAC04\uC740 \uC5B8\uC81C\uC778\uAC00\uC694?",
  "\uC9C0\uAE08 \uC774 \uC21C\uAC04 \uC0C1\uB300\uBC29\uC5D0\uAC8C \uAC00\uC7A5 \uD558\uACE0 \uC2F6\uC740 \uB9D0\uC740?",
  "\uC6B0\uB9AC \uAD00\uACC4\uC5D0\uC11C \uAC00\uC7A5 \uC798 \uC18C\uD1B5\uD558\uB294 \uBC29\uC2DD\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
  "\uC11C\uB85C\uC5D0\uAC8C \uAC00\uC7A5 \uD544\uC694\uD55C \uC0AC\uB78C\uC774 \uB410\uB2E4\uACE0 \uB290\uB07C\uB294 \uC21C\uAC04\uC740?",
  "\uD568\uAED8 \uAF2D \uAC00\uBCF4\uACE0 \uC2F6\uC740 \uC2DD\uB2F9\uC774\uB098 \uCE74\uD398\uAC00 \uC788\uB098\uC694?",
  "\uC0C1\uB300\uBC29\uC774 \uB098\uB97C \uC704\uD574 \uD574\uC92C\uC73C\uBA74 \uD558\uB294 \uC791\uC740 \uBD80\uD0C1\uC774 \uC788\uB2E4\uBA74?",
  "\uC6B0\uB9AC\uAC00 \uC774\uB807\uAC8C \uC798 \uB9DE\uB294 \uC774\uC720\uB294 \uBB34\uC5C7\uC77C\uAE4C\uC694?",
  "\uC0C1\uB300\uBC29\uACFC \uD568\uAED8 \uC788\uC73C\uBA74 \uC5B4\uB5A4 \uAC10\uC815\uC774 \uB4DC\uB098\uC694?"
];
const MINI_QUESTIONS = [
  {
    q: tl("\uC5F0\uC560\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD558\uAC8C \uC5EC\uAE30\uB294 \uAC83\uC740?", "What do you value most in a relationship?"),
    opts: [
      { text: tl("\uC2E0\uB8B0\uC640 \uC548\uC815\uAC10", "Trust and stability"), type: "S" },
      { text: tl("\uC124\uB808\uB294 \uAC10\uC815\uACFC \uD2B9\uBCC4\uD55C \uC21C\uAC04", "Exciting feelings and special moments"), type: "R" },
      { text: tl("\uD568\uAED8 \uC131\uC7A5\uD558\uB294 \uAC83", "Growing together"), type: "P" },
      { text: tl("\uC11C\uB85C\uC758 \uC790\uC720\uC640 \uB3C5\uB9BD", "Mutual freedom and independence"), type: "F" }
    ]
  },
  {
    q: tl("\uD30C\uD2B8\uB108\uAC00 \uC5F0\uB77D\uC744 \uB2A6\uAC8C \uD560 \uB54C \uB098\uB294?", "When your partner is slow to respond, you:"),
    opts: [
      { text: tl("\uD06C\uAC8C \uC2E0\uACBD \uC4F0\uC9C0 \uC54A\uB294\uB2E4", "Don't worry much about it"), type: "S" },
      { text: tl("\uAC71\uC815\uB418\uC5B4 \uBA3C\uC800 \uC5F0\uB77D\uD55C\uB2E4", "Get worried and reach out first"), type: "P" },
      { text: tl("\uB098\uB3C4 \uBC14\uC058\uB2C8 \uAD1C\uCC2E\uB2E4", "I'm busy too, so it's fine"), type: "F" },
      { text: tl("\uC11C\uC6B4\uD558\uC9C0\uB9CC \uC608\uC05C \uBA54\uC2DC\uC9C0\uB97C \uB0A8\uAE34\uB2E4", "Feel hurt but leave a sweet message"), type: "R" }
    ]
  },
  {
    q: tl("\uC774\uC0C1\uC801\uC778 \uB370\uC774\uD2B8 \uC2A4\uD0C0\uC77C\uC740?", "What is your ideal date style?"),
    opts: [
      { text: tl("\uBD84\uC704\uAE30 \uC788\uB294 \uB808\uC2A4\uD1A0\uB791\uACFC \uC57C\uACBD", "Romantic restaurant and night view"), type: "R" },
      { text: tl("\uC0C8\uB85C\uC6B4 \uC561\uD2F0\uBE44\uD2F0 \uB3C4\uC804", "Trying new activities"), type: "P" },
      { text: tl("\uC9D1\uC5D0\uC11C \uD3B8\uD558\uAC8C \uC601\uD654 \uBCF4\uAE30", "Relaxing at home watching movies"), type: "S" },
      { text: tl("\uAC01\uC790 \uD558\uACE0 \uC2F6\uC740 \uAC83 \uC990\uAE30\uAE30", "Each enjoying what they like"), type: "F" }
    ]
  },
  {
    q: tl("\uC11C\uC6B4\uD560 \uB54C \uB098\uB294?", "When you feel hurt, you:"),
    opts: [
      { text: tl("\uBC14\uB85C \uC194\uC9C1\uD558\uAC8C \uC774\uC57C\uAE30\uD55C\uB2E4", "Talk about it honestly right away"), type: "S" },
      { text: tl("\uB10C\uC9C0\uC2DC \uD45C\uD604\uD558\uACE0 \uC54C\uC544\uC92C\uC73C\uBA74 \uD55C\uB2E4", "Drop hints and hope they notice"), type: "R" },
      { text: tl("\uAC10\uC815\uC744 \uCDA9\uBD84\uD788 \uD45C\uD604\uD55C\uB2E4", "Express my feelings fully"), type: "P" },
      { text: tl("\uD63C\uC790 \uC815\uB9AC\uD558\uACE0 \uB118\uC5B4\uAC04\uB2E4", "Process it alone and move on"), type: "F" }
    ]
  },
  {
    q: tl("\uC560\uC815 \uD45C\uD604 \uC2A4\uD0C0\uC77C\uC740?", "How do you express affection?"),
    opts: [
      { text: tl("\uB9D0\uACFC \uD589\uB3D9\uC73C\uB85C \uC801\uADF9\uC801\uC73C\uB85C", "Actively through words and actions"), type: "P" },
      { text: tl("\uD2B9\uBCC4\uD55C \uC774\uBCA4\uD2B8\uC640 \uC120\uBB3C", "Special events and gifts"), type: "R" },
      { text: tl("\uAFB8\uC900\uD55C \uC791\uC740 \uAD00\uC2EC\uACFC \uBC30\uB824", "Consistent small attention and care"), type: "S" },
      { text: tl("\uD568\uAED8\uD558\uB294 \uC18C\uC18C\uD55C \uC77C\uC0C1", "Everyday moments together"), type: "F" }
    ]
  },
  {
    q: tl("\uBBF8\uB798\uB97C \uC0DD\uAC01\uD560 \uB54C \uB098\uB294?", "When thinking about the future, you:"),
    opts: [
      { text: tl("\uD568\uAED8 \uAD6C\uCCB4\uC801 \uACC4\uD68D\uC744 \uC138\uC6B0\uACE0 \uC2F6\uB2E4", "Want to make concrete plans together"), type: "S" },
      { text: tl("\uC544\uB984\uB2E4\uC6B4 \uBBF8\uB798 \uBAA8\uC2B5\uC744 \uC0C1\uC0C1\uD55C\uB2E4", "Imagine a beautiful future together"), type: "R" },
      { text: tl("\uD568\uAED8 \uB354 \uB098\uC740 \uC0AC\uB78C\uC774 \uB418\uACE0 \uC2F6\uB2E4", "Want to become better people together"), type: "P" },
      { text: tl("\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uD758\uB7EC\uAC00\uBA74 \uC88B\uACA0\uB2E4", "Hope things flow naturally"), type: "F" }
    ]
  },
  {
    q: tl("\uC5F0\uC560\uC5D0\uC11C \uAC00\uC7A5 \uD798\uB4E0 \uAC83\uC740?", "What is hardest for you in a relationship?"),
    opts: [
      { text: tl("\uC2E0\uB8B0\uAC00 \uD754\uB4E4\uB9B4 \uB54C", "When trust wavers"), type: "S" },
      { text: tl("\uC124\uB818\uC774 \uC904\uC5B4\uB4E4 \uAC83 \uAC19\uC744 \uB54C", "When the excitement seems to fade"), type: "R" },
      { text: tl("\uD568\uAED8 \uC131\uC7A5\uD558\uC9C0 \uBABB\uD558\uB294 \uAC83 \uAC19\uC744 \uB54C", "When it feels like we're not growing together"), type: "P" },
      { text: tl("\uB098\uB9CC\uC758 \uACF5\uAC04\uC774 \uC5C6\uC744 \uB54C", "When I have no space of my own"), type: "F" }
    ]
  }
];
const LOVE_TYPES = {
  S: {
    emoji: "\u{1F49A}",
    name: tl("\uC548\uC815 \uC2E0\uB8B0\uD615", "Stable & Trusting"),
    short: tl("\uB4E0\uB4E0\uD55C \uBC84\uD300\uBAA9", "Steady Pillar"),
    desc: tl(
      "\uC2E0\uB8B0\uC640 \uC548\uC815\uAC10\uC744 \uAC00\uC7A5 \uC911\uC694\uD558\uAC8C \uC5EC\uAE41\uB2C8\uB2E4. \uAFB8\uC900\uD558\uACE0 \uBBFF\uC74C\uC9C1\uD55C \uD30C\uD2B8\uB108\uB85C, \uC0C1\uB300\uBC29\uC774 \uD3B8\uC548\uD558\uAC8C \uC758\uC9C0\uD560 \uC218 \uC788\uB294 \uAD00\uACC4\uB97C \uB9CC\uB4E4\uC5B4\uC694.",
      "You value trust and stability above all. As a steady and reliable partner, you create relationships where your partner can comfortably lean on you."
    ),
    strength: tl("\uB192\uC740 \uC2E0\uB8B0\uB3C4 \xB7 \uAFB8\uC900\uD55C \uD5CC\uC2E0 \xB7 \uC194\uC9C1\uD55C \uC18C\uD1B5", "High trust \xB7 Consistent commitment \xB7 Honest communication"),
    match: tl("\uAC10\uC815 \uD45C\uD604\uC774 \uC194\uC9C1\uD558\uACE0 \uC548\uC815\uAC10\uC744 \uC6D0\uD558\uB294 \uBD84\uACFC \uC798 \uB9DE\uC544\uC694.", "You match well with someone who is emotionally open and seeks stability."),
    tip: tl("\uB54C\uB85C\uB294 \uC791\uC740 \uC774\uBCA4\uD2B8\uB85C \uC124\uB818\uB3C4 \uC120\uBB3C\uD574\uBCF4\uC138\uC694! \u{1F4AB}", "Try gifting some excitement with small surprises! \u{1F4AB}"),
    color: "#4A9A5A",
    pale: "#EAF5EC"
  },
  R: {
    emoji: "\u{1F339}",
    name: tl("\uB0AD\uB9CC \uAC10\uC131\uD615", "Romantic & Sentimental"),
    short: tl("\uC124\uB818 \uC81C\uC870\uAE30", "Excitement Creator"),
    desc: tl(
      "\uAC10\uC131\uC801\uC774\uACE0 \uD2B9\uBCC4\uD55C \uC21C\uAC04\uC744 \uC0AC\uB791\uD569\uB2C8\uB2E4. \uC791\uC740 \uC774\uBCA4\uD2B8\uC640 \uAC10\uB3D9\uC801\uC778 \uD45C\uD604\uC73C\uB85C \uC5F0\uC560\uB97C \uD48D\uC131\uD558\uAC8C \uB9CC\uB4DC\uB294 \uB85C\uB9E8\uD2F0\uC2A4\uD2B8\uC608\uC694.",
      "You love being emotional and creating special moments. A true romantic who enriches love with small events and heartfelt expressions."
    ),
    strength: tl("\uD48D\uBD80\uD55C \uAC10\uC218\uC131 \xB7 \uCC3D\uC758\uC801 \uD45C\uD604 \xB7 \uC138\uC2EC\uD55C \uBC30\uB824", "Rich sensitivity \xB7 Creative expression \xB7 Thoughtful care"),
    match: tl("\uAC10\uB3D9\uACFC \uC124\uB818\uC744 \uD568\uAED8 \uB098\uB20C \uC218 \uC788\uB294 \uBD84\uACFC \uC798 \uB9DE\uC544\uC694.", "You match well with someone who can share emotion and excitement."),
    tip: tl("\uC77C\uC0C1\uC801\uC778 \uC548\uC815\uAC10\uB3C4 \uC5F0\uC560\uC758 \uC18C\uC911\uD55C \uBD80\uBD84\uC774\uC5D0\uC694. \u{1F331}", "Everyday stability is also a precious part of love. \u{1F331}"),
    color: C.rose,
    pale: C.rosePale
  },
  P: {
    emoji: "\u{1F525}",
    name: tl("\uC5F4\uC815 \uC131\uC7A5\uD615", "Passionate & Growth-Oriented"),
    short: tl("\uD568\uAED8 \uD0C0\uC624\uB974\uB294 \uBD88\uAF43", "Flame that Burns Together"),
    desc: tl(
      "\uAC15\uB82C\uD558\uACE0 \uC9C4\uCDE8\uC801\uC778 \uC5F0\uC560\uB97C \uC6D0\uD569\uB2C8\uB2E4. \uD30C\uD2B8\uB108\uC640 \uD568\uAED8 \uC131\uC7A5\uD558\uACE0 \uB354 \uB098\uC740 \uC0AC\uB78C\uC774 \uB418\uB294 \uAC83\uC5D0 \uD070 \uAC00\uCE58\uB97C \uB450\uB294 \uC5F4\uC815\uC801\uC778 \uD0C0\uC785\uC774\uC5D0\uC694.",
      "You want an intense and progressive relationship. A passionate type who places great value on growing and becoming a better person with your partner."
    ),
    strength: tl("\uAC15\uD55C \uD5CC\uC2E0 \xB7 \uD568\uAED8 \uC131\uC7A5\uD558\uB294 \uB9C8\uC778\uB4DC \xB7 \uC801\uADF9\uC801 \uD45C\uD604", "Strong commitment \xB7 Growth mindset \xB7 Active expression"),
    match: tl("\uBE44\uC2B7\uD55C \uC5F4\uC815\uACFC \uBAA9\uD45C\uB97C \uACF5\uC720\uD560 \uC218 \uC788\uB294 \uBD84\uACFC \uC798 \uB9DE\uC544\uC694.", "You match well with someone who shares similar passion and goals."),
    tip: tl("\uD30C\uD2B8\uB108\uC758 \uCDA9\uC804 \uC2DC\uAC04\uB3C4 \uBC30\uB824\uD574\uC8FC\uC138\uC694. \u{1F486}", "Please respect your partner's recharge time too. \u{1F486}"),
    color: "#D4634A",
    pale: "#FEF0EC"
  },
  F: {
    emoji: "\u{1F30A}",
    name: tl("\uC790\uC720 \uC5EC\uC720\uD615", "Free & Easy-Going"),
    short: tl("\uBC14\uB78C \uAC19\uC740 \uC790\uC720\uB85C\uC6C0", "Freedom like the Wind"),
    desc: tl(
      "\uC11C\uB85C\uC758 \uB3C5\uB9BD\uC131\uC744 \uC874\uC911\uD558\uBA70 \uC5EC\uC720\uB86D\uACE0 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uAD00\uACC4\uB97C \uC120\uD638\uD569\uB2C8\uB2E4. \uC9D1\uCC29 \uC5C6\uC774 \uC11C\uB85C\uB97C \uBBFF\uACE0 \uAC1C\uC778 \uACF5\uAC04\uC744 \uC9C0\uCF1C\uC8FC\uB294 \uC131\uC219\uD55C \uC5F0\uC560\uB97C \uD574\uC694.",
      "You prefer a relaxed and natural relationship that respects each other's independence. A mature love where you trust each other without obsession and maintain personal space."
    ),
    strength: tl("\uC11C\uB85C \uC874\uC911 \xB7 \uC9D1\uCC29 \uC5C6\uB294 \uC2E0\uB8B0 \xB7 \uAC1C\uC778 \uACF5\uAC04 \uBC30\uB824", "Mutual respect \xB7 Trust without obsession \xB7 Respecting personal space"),
    match: tl("\uB3C5\uB9BD\uC131\uC744 \uC774\uD574\uD558\uACE0 \uC5EC\uC720 \uC788\uB294 \uC5F0\uC560\uB97C \uC6D0\uD558\uB294 \uBD84\uACFC \uC798 \uB9DE\uC544\uC694.", "You match well with someone who understands independence and wants a relaxed relationship."),
    tip: tl("\uB54C\uB85C\uB294 \uB354 \uC801\uADF9\uC801\uC778 \uAD00\uC2EC \uD45C\uD604\uB3C4 \uD544\uC694\uD560 \uC218 \uC788\uC5B4\uC694. \u{1F48C}", "Sometimes more active expressions of interest may be needed. \u{1F48C}"),
    color: C.lavender,
    pale: C.lavPale
  }
};
function calcLoveType(answers) {
  const counts = { S: 0, R: 0, P: 0, F: 0 };
  answers.forEach((a) => {
    if (a) counts[a] = (counts[a] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
function getPersonalityLabel(big5Data) {
  if (!big5Data) return null;
  const { O = 50, C: C2 = 50, E = 50, A = 50, N = 50 } = big5Data;
  return [
    { emoji: "\u26A1", name: tl("\uD65C\uB825\uD615", "Energetic"), v: E },
    { emoji: "\u{1F91D}", name: tl("\uCE5C\uD654\uD615", "Agreeable"), v: A },
    { emoji: "\u{1F3A8}", name: tl("\uD0D0\uAD6C\uD615", "Curious"), v: O },
    { emoji: "\u{1F4CB}", name: tl("\uACC4\uD68D\uD615", "Organized"), v: C2 },
    { emoji: "\u{1F30A}", name: tl("\uAC10\uC218\uD615", "Sensitive"), v: N }
  ].sort((a, b) => b.v - a.v)[0];
}
function getCoupleChemType(myBig5, partnerBig5) {
  if (!myBig5 || !partnerBig5) return null;
  const eDiff = Math.abs((myBig5.E || 50) - (partnerBig5.E || 50));
  const avgE = ((myBig5.E || 50) + (partnerBig5.E || 50)) / 2;
  const avgA = ((myBig5.A || 50) + (partnerBig5.A || 50)) / 2;
  const avgO = ((myBig5.O || 50) + (partnerBig5.O || 50)) / 2;
  if (eDiff < 15 && avgE > 60) return { emoji: "\u{1F525}", name: tl("\uC5F4\uC815 \uD3ED\uBC1C\uD615", "Explosive Energy"), desc: tl("\uB458 \uB2E4 \uC5D0\uB108\uC9C0\uAC00 \uB118\uCCD0 \uD568\uAED8\uD558\uBA74 \uC2DC\uB108\uC9C0 \uD3ED\uBC1C!", "Both full of energy \u2014 explosive synergy together!"), color: "#D4634A" };
  if (eDiff > 30) return { emoji: "\u{1F30A}", name: tl("\uADE0\uD615 \uBCF4\uC644\uD615", "Balanced Complement"), desc: tl("\uC11C\uB85C \uB2E4\uB978 \uC5D0\uB108\uC9C0\uAC00 \uC644\uBCBD\uD55C \uADE0\uD615\uC744 \uC774\uB904\uC694.", "Different energies form a perfect balance."), color: C.lavender };
  if (avgA > 65) return { emoji: "\u{1F49A}", name: tl("\uB530\uB73B\uD55C \uBC30\uB824\uD615", "Warm & Caring"), desc: tl("\uC11C\uB85C\uB97C \uAE4A\uC774 \uBC30\uB824\uD558\uB294 \uB530\uB73B\uD558\uACE0 \uC548\uC815\uC801\uC778 \uCF00\uBBF8\uC608\uC694.", "A warm and stable chemistry of deep mutual care."), color: "#4A9A5A" };
  if (avgO > 65) return { emoji: "\u{1F3A8}", name: tl("\uCC3D\uC758\uC801 \uD0D0\uD5D8\uD615", "Creative Explorers"), desc: tl("\uC0C8\uB85C\uC6B4 \uAC83\uC744 \uD568\uAED8 \uD0D0\uD5D8\uD558\uB294 \uBAA8\uD5D8\uC2EC \uB118\uCE58\uB294 \uCF00\uBBF8\uC608\uC694.", "An adventurous chemistry of exploring new things together."), color: C.amber };
  return { emoji: "\u{1F495}", name: tl("\uD2B9\uBCC4\uD55C \uC6B0\uB9AC\uD615", "Uniquely Us"), desc: tl("\uB458\uB9CC\uC758 \uB3C5\uD2B9\uD558\uACE0 \uC18C\uC911\uD55C \uCF00\uBBF8\uB97C \uAC00\uC9C0\uACE0 \uC788\uC5B4\uC694.", "You have a unique and precious chemistry all your own."), color: C.rose };
}
function Big5CompareView({ myBig5, partnerBig5, myName, partnerName, onBack }) {
  const traits = [
    { key: "O", label: tl("\uAC1C\uBC29\uC131", "Openness"), emoji: "\u{1F3A8}", desc: tl("\uCC3D\uC758\uC131\xB7\uD638\uAE30\uC2EC", "Creativity\xB7Curiosity") },
    { key: "C", label: tl("\uC131\uC2E4\uC131", "Conscientiousness"), emoji: "\u{1F4CB}", desc: tl("\uCC45\uC784\uAC10\xB7\uACC4\uD68D\uC131", "Responsibility\xB7Planning") },
    { key: "E", label: tl("\uC678\uD5A5\uC131", "Extraversion"), emoji: "\u26A1", desc: tl("\uC0AC\uAD50\uC131\xB7\uD65C\uB3D9\uC131", "Sociability\xB7Activity") },
    { key: "A", label: tl("\uCE5C\uD654\uC131", "Agreeableness"), emoji: "\u{1F91D}", desc: tl("\uBC30\uB824\xB7\uD611\uB825", "Care\xB7Cooperation") },
    { key: "N", label: tl("\uC2E0\uACBD\uC131", "Neuroticism"), emoji: "\u{1F30A}", desc: tl("\uAC10\uC815 \uBBFC\uAC10\uB3C4", "Emotional sensitivity") }
  ];
  const chem = getCoupleChemType(myBig5, partnerBig5);
  const cx = 130, cy = 130, r = 95;
  function pt(i, val) {
    const angle = 2 * Math.PI * i / 5 - Math.PI / 2;
    const v = Math.max(0, Math.min(100, val)) / 100 * r;
    return `${(cx + v * Math.cos(angle)).toFixed(1)},${(cy + v * Math.sin(angle)).toFixed(1)}`;
  }
  function gridPt(i, pct) {
    const angle = 2 * Math.PI * i / 5 - Math.PI / 2;
    const v = pct * r;
    return `${(cx + v * Math.cos(angle)).toFixed(1)},${(cy + v * Math.sin(angle)).toFixed(1)}`;
  }
  function labelPt(i) {
    const angle = 2 * Math.PI * i / 5 - Math.PI / 2;
    const v = r + 22;
    return { x: cx + v * Math.cos(angle), y: cy + v * Math.sin(angle) };
  }
  const myPts = traits.map((t, i) => pt(i, myBig5?.[t.key] ?? 50)).join(" ");
  const partnerPts = traits.map((t, i) => pt(i, partnerBig5?.[t.key] ?? 50)).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];
  function shareResult() {
    const lines = traits.map((t) => `${t.emoji}${t.label}: ${myBig5?.[t.key] ?? 50} vs ${partnerBig5?.[t.key] ?? 50}`);
    const text = `${SERVICE_ICON} ${tl("BIG5 \uCEE4\uD50C \uBE44\uAD50", "BIG5 Couple Comparison")}
${myName} vs ${partnerName}
${lines.join("\n")}
${chem ? `${tl("\uCF00\uBBF8", "Chemistry")}: ${chem.emoji} ${chem.name}` : ""}
${COUPLE_URL} #${SERVICE_NAME}`;
    if (navigator.share) navigator.share({ title: tl("BIG5 \uCEE4\uD50C \uBE44\uAD50", "BIG5 Couple Comparison"), text }).catch(() => {
    });
    else navigator.clipboard?.writeText(text).then(() => alert(tl("\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB410\uC5B4\uC694!", "Copied to clipboard!"))).catch(() => {
    });
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    gap: 12
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    color: C.rose,
    padding: "4px 8px"
  } }, "\u2190"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" } }, "\u{1F9EC} ", tl("BIG5 \uC131\uACA9 \uBE44\uAD50", "BIG5 Personality Comparison"))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", padding: "24px 20px 40px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "center",
    gap: 28
  } }, [
    { name: myName + tl(" (\uB098)", " (Me)"), color: C.rose },
    { name: partnerName, color: C.lavender }
  ].map(({ name, color }) => /* @__PURE__ */ React.createElement("div", { key: name, style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 14, borderRadius: 4, background: color } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: C.dark } }, name)))), /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 260 260", style: { width: "100%", maxWidth: 300, display: "block", margin: "0 auto" } }, gridLevels.map((lvl) => /* @__PURE__ */ React.createElement(
    "polygon",
    {
      key: lvl,
      points: traits.map((_, i) => gridPt(i, lvl)).join(" "),
      fill: "none",
      stroke: "#e8e0e8",
      strokeWidth: "1"
    }
  )), traits.map((_, i) => /* @__PURE__ */ React.createElement(
    "line",
    {
      key: i,
      x1: cx,
      y1: cy,
      x2: gridPt(i, 1).split(",")[0],
      y2: gridPt(i, 1).split(",")[1],
      stroke: "#e8e0e8",
      strokeWidth: "1"
    }
  )), /* @__PURE__ */ React.createElement(
    "polygon",
    {
      points: partnerPts,
      fill: C.lavender + "30",
      stroke: C.lavender,
      strokeWidth: "2",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React.createElement(
    "polygon",
    {
      points: myPts,
      fill: C.rose + "28",
      stroke: C.rose,
      strokeWidth: "2",
      strokeLinejoin: "round"
    }
  ), traits.map((t, i) => {
    const [x, y] = pt(i, myBig5?.[t.key] ?? 50).split(",");
    return /* @__PURE__ */ React.createElement("circle", { key: t.key, cx: x, cy: y, r: "4", fill: C.rose });
  }), traits.map((t, i) => {
    const [x, y] = pt(i, partnerBig5?.[t.key] ?? 50).split(",");
    return /* @__PURE__ */ React.createElement("circle", { key: t.key, cx: x, cy: y, r: "4", fill: C.lavender });
  }), traits.map((t, i) => {
    const lp = labelPt(i);
    return /* @__PURE__ */ React.createElement(
      "text",
      {
        key: t.key,
        x: lp.x,
        y: lp.y,
        textAnchor: "middle",
        dominantBaseline: "middle",
        fontSize: "11",
        fontWeight: "600",
        fill: C.dark,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      t.emoji,
      " ",
      t.label
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 16 } }, "\u{1F4CA} ", tl("\uD56D\uBAA9\uBCC4 \uBE44\uAD50", "Comparison by Category")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, traits.map(({ key, label, emoji, desc }) => {
    const myVal = myBig5?.[key] ?? 50;
    const partnerVal = partnerBig5?.[key] ?? 50;
    const diff = Math.abs(myVal - partnerVal);
    return /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, emoji, " ", label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.muted } }, desc, " \xB7 ", tl("\uCC28\uC774", "Diff"), " ", diff, tl("\uC810", ""))), [
      { name: myName + tl(" (\uB098)", " (Me)"), val: myVal, color: C.rose },
      { name: partnerName, val: partnerVal, color: C.lavender }
    ].map(({ name: nname, val, color }) => /* @__PURE__ */ React.createElement("div", { key: nname, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.muted, width: 64, flexShrink: 0, textAlign: "right" } }, nname), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#f3f0f5", borderRadius: 6, height: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: val + "%",
      height: "100%",
      borderRadius: 6,
      background: color,
      transition: "width 0.5s ease"
    } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color, width: 30, textAlign: "right" } }, val))));
  }))), chem && /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    borderLeft: `4px solid ${chem.color}`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, marginBottom: 8 } }, chem.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: chem.color, marginBottom: 6 } }, chem.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, lineHeight: 1.7 } }, chem.desc)), /* @__PURE__ */ React.createElement("button", { onClick: shareResult, style: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`,
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F517} ", tl("\uACB0\uACFC \uACF5\uC720\uD558\uAE30", "Share Result"))));
}
function HeartIllust({ score = 75, style = {} }) {
  const fill = scoreColor(score);
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 320 200",
      xmlns: "http://www.w3.org/2000/svg",
      style: { width: "100%", height: "100%", ...style }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "bgGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#FCF0F3" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#F0EEF8" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "heartGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: C.roseL }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: C.rose })), /* @__PURE__ */ React.createElement("filter", { id: "softGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "3", result: "blur" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "blur" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))),
    /* @__PURE__ */ React.createElement("rect", { width: "320", height: "200", fill: "url(#bgGrad)" }),
    [[30, 40], [280, 35], [55, 160], [265, 155], [150, 20]].map(([x, y], i) => /* @__PURE__ */ React.createElement(
      "text",
      {
        key: i,
        x,
        y,
        fontSize: i === 4 ? 14 : 10,
        textAnchor: "middle",
        fill: C.roseL,
        opacity: "0.4"
      },
      "\u2726"
    )),
    /* @__PURE__ */ React.createElement("g", { transform: "translate(160,100)", filter: "url(#softGlow)" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M0,20 C0,-20 -50,-40 -50,0 C-50,35 0,70 0,70 C0,70 50,35 50,0 C50,-40 0,-20 0,20 Z",
        fill: "url(#heartGrad)",
        opacity: "0.9"
      }
    )),
    /* @__PURE__ */ React.createElement(
      "text",
      {
        x: "160",
        y: "108",
        textAnchor: "middle",
        fontSize: "26",
        fontWeight: "700",
        fill: "white",
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      score
    ),
    /* @__PURE__ */ React.createElement(
      "text",
      {
        x: "160",
        y: "122",
        textAnchor: "middle",
        fontSize: "10",
        fill: "white",
        opacity: "0.9",
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      "/ 100"
    ),
    /* @__PURE__ */ React.createElement("g", { opacity: "0.6" }, /* @__PURE__ */ React.createElement("circle", { cx: "68", cy: "100", r: "22", fill: "white", stroke: C.roseL, strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement(
      "text",
      {
        x: "68",
        y: "104",
        textAnchor: "middle",
        fontSize: "11",
        fontWeight: "700",
        fill: C.rose,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      "A"
    ), /* @__PURE__ */ React.createElement("circle", { cx: "252", cy: "100", r: "22", fill: "white", stroke: C.lavL, strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement(
      "text",
      {
        x: "252",
        y: "104",
        textAnchor: "middle",
        fontSize: "11",
        fontWeight: "700",
        fill: C.lavender,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      "B"
    ), /* @__PURE__ */ React.createElement("line", { x1: "92", y1: "100", x2: "108", y2: "100", stroke: C.roseL, strokeWidth: "1.5", strokeDasharray: "3,3" }), /* @__PURE__ */ React.createElement("line", { x1: "212", y1: "100", x2: "228", y2: "100", stroke: C.lavL, strokeWidth: "1.5", strokeDasharray: "3,3" }))
  );
}
function WaitingIllust({ style = {} }) {
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 320 200",
      xmlns: "http://www.w3.org/2000/svg",
      style: { width: "100%", height: "100%", ...style }
    },
    /* @__PURE__ */ React.createElement("rect", { width: "320", height: "200", fill: "#FCF0F3" }),
    /* @__PURE__ */ React.createElement("g", { transform: "translate(95,100)" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z",
        fill: C.roseL,
        opacity: "0.85"
      }
    )),
    /* @__PURE__ */ React.createElement("g", { transform: "translate(225,100)" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z",
        fill: "none",
        stroke: C.lavL,
        strokeWidth: "2",
        strokeDasharray: "5,4",
        opacity: "0.7"
      }
    )),
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: "132",
        y1: "100",
        x2: "188",
        y2: "100",
        stroke: C.muted,
        strokeWidth: "1.5",
        strokeDasharray: "4,4",
        opacity: "0.4"
      }
    ),
    /* @__PURE__ */ React.createElement("text", { x: "225", y: "107", textAnchor: "middle", fontSize: "22", fill: C.lavL, opacity: "0.7" }, "?"),
    /* @__PURE__ */ React.createElement(
      "text",
      {
        x: "160",
        y: "168",
        textAnchor: "middle",
        fontSize: "12",
        fill: C.muted,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      tl("\uD30C\uD2B8\uB108\uB97C \uAE30\uB2E4\uB9AC\uB294 \uC911...", "Waiting for partner...")
    )
  );
}
function LoginGate() {
  return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream}, ${C.lavPale})`,
    padding: 24,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 20, animation: "heartbeat 2s ease-in-out infinite" } }, SERVICE_ICON), /* @__PURE__ */ React.createElement("h1", { style: {
    fontSize: 28,
    fontWeight: 700,
    color: C.dark,
    marginBottom: 10,
    fontFamily: "'Noto Serif KR', serif"
  } }, SERVICE_NAME), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: C.muted, lineHeight: 1.9, marginBottom: 32, maxWidth: 300 } }, IS_CTS ? tl("The Light of Life\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uBA74", "Log in to The Light of Life") : tl("\uB9C8\uC74C\uD480\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uBA74", "Log in to Maumful"), /* @__PURE__ */ React.createElement("br", null), tl("\uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.", "and start using without a separate login."), /* @__PURE__ */ React.createElement("br", null), tl("\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB85C \uD30C\uD2B8\uB108\uC640\uC758", "Analyze your compatibility and"), /* @__PURE__ */ React.createElement("br", null), tl("\uAD81\uD569\uACFC \uAD00\uACC4 \uD328\uD134\uC744 \uBD84\uC11D\uD574\uBCF4\uC138\uC694 \u{1F491}", "relationship patterns with your partner \u{1F491}")), /* @__PURE__ */ React.createElement("a", { href: MAUMFUL_URL, style: {
    display: "inline-block",
    padding: "14px 36px",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    boxShadow: `0 8px 24px ${C.rose}44`,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, IS_CTS ? tl("The Light of Life \uB85C\uADF8\uC778\uD558\uACE0 \uC2DC\uC791\uD558\uAE30 \u2192", "Log in to The Light of Life \u2192") : tl("\uB9C8\uC74C\uD480 \uB85C\uADF8\uC778\uD558\uACE0 \uC2DC\uC791\uD558\uAE30 \u2192", "Log in to Maumful and Start \u2192")));
}
function TestResultBadge({ type, result, date }) {
  const hasResult = !!result;
  const meta = {
    BIG5: { emoji: "\u{1F9EC}", label: tl("BIG5 \uC131\uACA9\uAC80\uC0AC", "BIG5 Personality Test"), color: C.rose, pale: C.rosePale, accentL: C.roseL },
    LOST: { emoji: "\u2699\uFE0F", label: tl("LOST \uD589\uB3D9\uC720\uD615", "LOST Behavior Type"), color: C.lavender, pale: C.lavPale, accentL: C.lavL },
    DSI: { emoji: "\u{1FA9E}", label: tl("SDRI \uC790\uC544\uBD84\uD654\uAC80\uC0AC", "SDRI Differentiation Test"), color: "#5A8A7A", pale: "#EAF3F0", accentL: "#7ABAA8" }
  }[type] || { emoji: "\u{1F4CB}", label: type, color: C.muted, pale: "#F5F5F5", accentL: C.muted };
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    background: hasResult ? meta.pale : "#F5F5F5",
    border: `1px solid ${hasResult ? meta.accentL + "44" : "#E0E0E0"}`
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, meta.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: hasResult ? C.dark : C.muted } }, meta.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 } }, hasResult ? `\u2713 ${tl("\uC644\uB8CC", "Done")} \xB7 ${fmtDate(date)}` : tl("\uC544\uC9C1 \uAC80\uC0AC \uACB0\uACFC \uC5C6\uC74C", "No test result yet"))), hasResult && /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 100,
    background: meta.color,
    color: "white"
  } }, tl("\uC644\uB8CC", "Done")));
}
function DailyQuestionCard() {
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const dayIdx = (Math.floor(Date.now() / 864e5) + offset) % DAILY_QUESTIONS.length;
  const q = DAILY_QUESTIONS[dayIdx];
  function copyQuestion() {
    const text = `${SERVICE_ICON} ${tl("\uC624\uB298\uC758 \uCEE4\uD50C \uB300\uD654 \uC9C8\uBB38", "Today's Couple Question")}

"${q}"

${COUPLE_URL}`;
    if (navigator.share) {
      navigator.share({ title: tl("\uC624\uB298\uC758 \uCEE4\uD50C \uC9C8\uBB38", "Today's Couple Question"), text }).catch(() => {
      });
    } else {
      navigator.clipboard?.writeText(text).catch(() => {
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: `1px solid ${C.roseL}33`
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.rose } }, tl("\uC624\uB298\uC758 \uCEE4\uD50C \uB300\uD654 \uC9C8\uBB38", "Today's Couple Question"))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.muted, background: "rgba(255,255,255,0.6)", padding: "2px 8px", borderRadius: 20 } }, "Day ", dayIdx + 1)), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 15,
    fontWeight: 600,
    color: C.dark,
    lineHeight: 1.7,
    padding: "16px",
    background: "rgba(255,255,255,0.7)",
    borderRadius: 14,
    marginBottom: 14,
    fontFamily: "'Noto Serif KR', serif",
    textAlign: "center"
  } }, '"', q, '"'), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOffset((o) => o + 1), style: {
    flex: 1,
    padding: "9px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,0.7)",
    color: C.muted,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, tl("\uB2E4\uC74C \uC9C8\uBB38 \u2192", "Next Question \u2192")), /* @__PURE__ */ React.createElement("button", { onClick: copyQuestion, style: {
    flex: 1,
    padding: "9px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: C.rose,
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, copied ? tl("\u2713 \uBCF5\uC0AC\uB428", "\u2713 Copied") : tl("\u{1F4E4} \uD30C\uD2B8\uB108\uC640 \uACF5\uC720", "\u{1F4E4} Share with Partner"))));
}
function MiniLoveTestView({ onBack }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  function handleAnswer(type) {
    const next = [...answers, type];
    setAnswers(next);
    if (next.length >= MINI_QUESTIONS.length) {
      setResult(calcLoveType(next));
    } else {
      setStep((s) => s + 1);
    }
  }
  function reset() {
    setStep(-1);
    setAnswers([]);
    setResult(null);
  }
  function shareResult(t2) {
    const text = `${SERVICE_ICON} ${tl("\uB098\uC758 \uC5F0\uC560 \uC720\uD615\uC740", "My Love Type is")} "${t2.emoji} ${t2.name}"

${t2.short} \u2014 ${t2.desc.slice(0, 50)}...

${tl("\uB098\uB3C4 \uD14C\uC2A4\uD2B8\uD574\uBD10\uC694!", "Try it too!")}
${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl("\uB098\uC758 \uC5F0\uC560 \uC720\uD615", "My Love Type"), text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  const currentQ = MINI_QUESTIONS[step];
  const t = result ? LOVE_TYPES[result] : null;
  const progress = step >= 0 ? (step + 1) / MINI_QUESTIONS.length * 100 : 0;
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: result ? reset : step === -1 ? onBack : () => setStep((s) => s - 1), style: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: C.dark,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uB098\uC758 \uC5F0\uC560 \uC720\uD615", "My Love Type"))), step >= 0 && !result && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, step + 1, " / ", MINI_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" } }, step === -1 && !result && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 16 } }, "\u{1F49D}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, tl("\uB098\uC758 \uC5F0\uC560 \uC720\uD615\uC740?", "What's My Love Type?")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 32 } }, tl("7\uAC00\uC9C0 \uC9C8\uBB38\uC73C\uB85C \uC54C\uC544\uBCF4\uB294 \uB098\uC758 \uC5F0\uC560 \uC2A4\uD0C0\uC77C.", "7 questions to discover your love style."), /* @__PURE__ */ React.createElement("br", null), tl("\uD06C\uB808\uB527 \uC5C6\uC774 \uBB34\uB8CC\uB85C \uBC14\uB85C \uC2DC\uC791\uD560 \uC218 \uC788\uC5B4\uC694!", "Start for free without any credits!")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" } }, Object.values(LOVE_TYPES).map((t2) => /* @__PURE__ */ React.createElement("div", { key: t2.name, style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 14,
    background: t2.pale,
    border: `1px solid ${t2.color}22`
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, t2.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: t2.color } }, t2.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, t2.short))))), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(0), style: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: `0 8px 24px ${C.rose}44`
  } }, tl("\uC2DC\uC791\uD558\uAE30 \u2192", "Start \u2192"))), step >= 0 && !result && currentQ && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: 6,
    borderRadius: 100,
    background: "#F0E0E8",
    overflow: "hidden",
    marginBottom: 8
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    borderRadius: 100,
    width: `${progress}%`,
    background: `linear-gradient(90deg, ${C.roseL}, ${C.rose})`,
    transition: "width 0.4s ease"
  } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, textAlign: "right" } }, step + 1, "/", MINI_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 18,
    fontWeight: 700,
    color: C.dark,
    lineHeight: 1.6,
    marginBottom: 28,
    textAlign: "center",
    fontFamily: "'Noto Serif KR', serif",
    padding: "0 8px"
  } }, "Q", step + 1, ". ", currentQ.q), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, currentQ.opts.map((opt, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => handleAnswer(opt.type), style: {
    padding: "16px 20px",
    borderRadius: 14,
    border: `1.5px solid ${C.roseL}33`,
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 600,
    color: C.dark,
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: "all 0.15s"
  } }, opt.text)))), result && t && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 12, animation: "heartbeat 1s ease-in-out 3" } }, t.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: t.color, fontWeight: 700, marginBottom: 4, letterSpacing: 2 } }, tl("\uB098\uC758 \uC5F0\uC560 \uC720\uD615", "My Love Type")), /* @__PURE__ */ React.createElement("h2", { style: {
    fontSize: 24,
    fontWeight: 700,
    color: C.dark,
    marginBottom: 6,
    fontFamily: "'Noto Serif KR', serif"
  } }, t.name), /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    marginBottom: 24,
    padding: "5px 16px",
    borderRadius: 100,
    background: t.color + "18",
    color: t.color,
    fontWeight: 700,
    fontSize: 13
  } }, t.short), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px",
    borderRadius: 16,
    background: t.pale,
    border: `1px solid ${t.color}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 6 } }, "\u{1F4A1} ", tl("\uC5F0\uC560 \uC131\uD5A5", "Love Tendency")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.dark, lineHeight: 1.7 } }, t.desc)), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", borderRadius: 14, background: "white", border: "1px solid #F0E0E8" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 } }, "\u2728 ", tl("\uAC15\uC810", "Strengths")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.dark } }, t.strength)), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", borderRadius: 14, background: "white", border: "1px solid #F0E0E8" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 } }, "\u{1F491} ", tl("\uC798 \uB9DE\uB294 \uC720\uD615", "Best Match Type")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.dark } }, t.match)), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "14px 16px",
    borderRadius: 14,
    background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
    border: `1px solid ${C.roseL}33`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 4 } }, "\u{1F48C} ", tl("\uC131\uC7A5 \uD301", "Growth Tip")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.dark } }, t.tip))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => shareResult(t), style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4E4} ", tl("\uACB0\uACFC \uACF5\uC720\uD558\uAE30", "Share Result")), /* @__PURE__ */ React.createElement("button", { onClick: reset, style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: `1px solid ${C.roseL}44`,
    cursor: "pointer",
    background: "white",
    color: C.rose,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F504} ", tl("\uB2E4\uC2DC \uD574\uBCF4\uAE30", "Try Again"))), /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    width: "100%",
    marginTop: 10,
    padding: "12px",
    borderRadius: 12,
    border: "1px solid #E0D0D8",
    cursor: "pointer",
    background: "white",
    color: C.muted,
    fontSize: 12,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u2190 ", tl("\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30", "Back to Home")))));
}
function RelationshipCoachView({ userName, credits, isMaster, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const [error, setError] = useState("");
  const FREE_LIMIT = 3;
  const PAID_COST = 2;
  const endRef = React.useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const SUGGESTIONS = COUPLE_LANG === "en" ? [
    "We keep fighting about the same things",
    "I think I'm not good at expressing my emotions in relationships",
    "I feel frustrated that my partner doesn't seem to understand me",
    "I'm worried that the excitement is fading",
    "How should I tell my partner when I feel hurt?"
  ] : [
    "\uD30C\uD2B8\uB108\uC640 \uC790\uAFB8 \uAC19\uC740 \uC8FC\uC81C\uB85C \uC2F8\uC6CC\uC694",
    "\uC5F0\uC560\uD560 \uB54C \uAC10\uC815 \uD45C\uD604\uC774 \uB108\uBB34 \uC11C\uD230 \uAC83 \uAC19\uC544\uC694",
    "\uD30C\uD2B8\uB108\uAC00 \uB098\uB97C \uC774\uD574 \uBABB\uD558\uB294 \uAC83 \uAC19\uC544 \uB2F5\uB2F5\uD574\uC694",
    "\uC124\uB818\uC774 \uC904\uC5B4\uB4DC\uB294 \uAC83 \uAC19\uC544 \uAC71\uC815\uB3FC\uC694",
    "\uD30C\uD2B8\uB108\uC5D0\uAC8C \uC11C\uC6B4\uD55C \uAC78 \uC5B4\uB5BB\uAC8C \uB9D0\uD574\uC57C \uD560\uAE4C\uC694?"
  ];
  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/couple/coach", { messages: newMessages });
      if (res.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
        setUsedToday(res.data.usedToday);
        if (res.data.creditsSpent > 0) {
          setError(tl(`\u{1F4B3} ${res.data.creditsSpent}cr \uCC28\uAC10\uB410\uC2B5\uB2C8\uB2E4.`, `\u{1F4B3} ${res.data.creditsSpent}cr deducted.`));
          setTimeout(() => setError(""), 3e3);
        }
      } else if (res.needsCharge) {
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        setError(tl(`\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. (\uD544\uC694: ${PAID_COST}cr)`, `Insufficient credits. (Required: ${PAID_COST}cr)`));
      } else {
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        setError(res.error || tl("\uC804\uC1A1 \uC2E4\uD328", "Send failed"));
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
      setError(tl("\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "A server error occurred."));
    } finally {
      setLoading(false);
    }
  }
  const canAfford = isMaster || usedToday < FREE_LIMIT || credits >= PAID_COST;
  const freeLeft = Math.max(0, FREE_LIMIT - usedToday);
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})`, display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.92)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("AI \uAD00\uACC4 \uCF54\uCE58", "AI Relationship Coach"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, background: "rgba(255,255,255,0.7)", padding: "4px 10px", borderRadius: 100 } }, isMaster ? tl("\uBB34\uC81C\uD55C", "Unlimited") : freeLeft > 0 ? tl(`\uBB34\uB8CC ${freeLeft}\uD68C \uB0A8\uC74C`, `${freeLeft} free left`) : `${PAID_COST}cr/${tl("\uD68C", "msg")}`)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, maxWidth: 560, width: "100%", margin: "0 auto", padding: "20px 16px 100px", overflowY: "auto" } }, messages.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", paddingTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, marginBottom: 12 } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" } }, tl("AI \uAD00\uACC4 \uCF54\uCE58", "AI Relationship Coach")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 24 } }, tl("\uC5F0\uC560\xB7\uCEE4\uD50C \uAD00\uACC4\uC5D0 \uB300\uD55C \uACE0\uBBFC\uC744 \uD3B8\uD558\uAC8C \uB098\uB220\uBCF4\uC138\uC694.", "Share your relationship concerns comfortably."), /* @__PURE__ */ React.createElement("br", null), tl("BIG5 \uC131\uACA9 \uB370\uC774\uD130\uB97C \uBC14\uD0D5\uC73C\uB85C \uB9DE\uCDA4 \uC870\uC5B8\uC744 \uB4DC\uB824\uC694.", "Get personalized advice based on your BIG5 personality data.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, SUGGESTIONS.map((s, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => {
    setInput(s);
  }, style: {
    padding: "11px 16px",
    borderRadius: 12,
    background: "white",
    border: `1px solid ${C.roseL}44`,
    color: C.dark,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4AC} ", s)))), messages.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
    marginBottom: 12
  } }, m.role === "assistant" && /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 100, background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", { style: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: m.role === "user" ? `linear-gradient(135deg, ${C.rose}, ${C.roseL})` : "white",
    color: m.role === "user" ? "white" : C.dark,
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "keep-all",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  } }, m.content))), loading && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 100, background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 6, height: 6, borderRadius: 100, background: C.roseL, animation: `pulse 1.2s ${i * 0.2}s infinite` } }))))), /* @__PURE__ */ React.createElement("div", { ref: endRef })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    background: "rgba(253,252,247,0.95)",
    backdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(181,85,106,0.12)",
    padding: "12px 16px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 560, margin: "0 auto" } }, error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: usedToday >= FREE_LIMIT ? C.muted : "#D05555", marginBottom: 6, textAlign: "center" } }, error), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      },
      placeholder: tl("\uACE0\uBBFC\uC744 \uD3B8\uD558\uAC8C \uC774\uC57C\uAE30\uD574\uBCF4\uC138\uC694...", "Feel free to share your concerns..."),
      rows: 1,
      disabled: !canAfford,
      style: {
        flex: 1,
        padding: "12px 16px",
        borderRadius: 14,
        resize: "none",
        border: `1.5px solid ${C.roseL}44`,
        outline: "none",
        fontSize: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        background: canAfford ? "white" : "#F5F5F5",
        color: C.dark,
        maxHeight: 100,
        overflowY: "auto"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: sendMessage,
      disabled: !input.trim() || loading || !canAfford,
      style: {
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "none",
        cursor: input.trim() && canAfford ? "pointer" : "not-allowed",
        background: input.trim() && canAfford ? `linear-gradient(135deg, ${C.rose}, ${C.roseL})` : "#E0D0D8",
        color: "white",
        fontSize: 18,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    },
    "\u2192"
  )))));
}
const QUIZ_QUESTIONS = COUPLE_LANG === "en" ? [
  {
    q: "What is your ideal way to spend the weekend?",
    opts: ["Netflix/games at home", "Food spots & caf\xE9 tour", "Outdoor activities", "Travel & day trips"]
  },
  {
    q: "How do you prefer to resolve conflicts?",
    opts: ["Talk it out right away", "Process alone then talk", "Let time fix it", "Express first via message"]
  },
  {
    q: "How do you want your partner to show love?",
    opts: ["Physical affection (hugs, holding hands)", "Warm words and compliments", "Surprise gifts & events", "Spending time together"]
  },
  {
    q: "What do you want from your partner when stressed?",
    opts: ["Just be by my side", "Actively empathize", "Help find a solution", "Make me laugh"]
  },
  {
    q: "What is your ideal lifestyle as a couple?",
    opts: ["Do almost everything together", "Only important things together", "Respect individual lives, meet sometimes", "Depends on the situation"]
  },
  {
    q: "What do you picture for us 10 years from now?",
    opts: ["A family with children", "A free couple traveling the world", "A partnership each pursuing their dreams", "Happy like now is OK"]
  },
  {
    q: "Which date style suits you better?",
    opts: ["Carefully planned", "Spontaneous day by day", "Partner leads", "Plan together equally"]
  },
  {
    q: "How do you give gifts?",
    opts: ["Figure out what they want ahead of time", "Complete surprise", "Choose together", "Give experiences & memories"]
  },
  {
    q: "What matters most in a relationship?",
    opts: ["Trust and stability", "Excitement and passion", "Growing together", "Comfort and freedom"]
  },
  {
    q: "In a conflict, you tend to:",
    opts: ["Speak honestly right away", "Decide based on the situation", "Calm the other person first", "Want to avoid it"]
  }
] : [
  {
    q: "\uC774\uC0C1\uC801\uC778 \uC8FC\uB9D0 \uBCF4\uB0B4\uAE30\uB294?",
    opts: ["\uC9D1\uC5D0\uC11C \uB137\uD50C\uB9AD\uC2A4/\uAC8C\uC784", "\uB9DB\uC9D1\xB7\uCE74\uD398 \uD22C\uC5B4", "\uC57C\uC678 \uC561\uD2F0\uBE44\uD2F0", "\uC5EC\uD589\xB7\uB2F9\uC77C\uCE58\uAE30"]
  },
  {
    q: "\uC2F8\uC6E0\uC744 \uB54C \uC120\uD638\uD558\uB294 \uD574\uACB0 \uBC29\uC2DD\uC740?",
    opts: ["\uBC14\uB85C \uB300\uD654\uB85C \uD574\uACB0", "\uD63C\uC790 \uC815\uB9AC \uD6C4 \uB300\uD654", "\uC2DC\uAC04\uC774 \uC9C0\uB098\uBA74 \uD574\uACB0", "\uBA54\uC2DC\uC9C0\uB85C \uBA3C\uC800 \uD45C\uD604"]
  },
  {
    q: "\uD30C\uD2B8\uB108\uC5D0\uAC8C \uBC1B\uACE0 \uC2F6\uC740 \uC0AC\uB791 \uD45C\uD604\uC740?",
    opts: ["\uC2A4\uD0A8\uC2ED (\uD3EC\uC639, \uC190\uC7A1\uAE30)", "\uB530\uB73B\uD55C \uB9D0\uACFC \uCE6D\uCC2C", "\uAE5C\uC9DD \uC120\uBB3C\xB7\uC774\uBCA4\uD2B8", "\uD568\uAED8 \uC2DC\uAC04 \uBCF4\uB0B4\uAE30"]
  },
  {
    q: "\uC2A4\uD2B8\uB808\uC2A4 \uBC1B\uC744 \uB54C \uD30C\uD2B8\uB108\uC5D0\uAC8C \uC6D0\uD558\uB294 \uAC83\uC740?",
    opts: ["\uADF8\uB0E5 \uC606\uC5D0 \uC788\uC5B4\uC918", "\uC801\uADF9\uC801\uC73C\uB85C \uACF5\uAC10\uD574\uC918", "\uD574\uACB0\uCC45 \uAC19\uC774 \uCC3E\uC544\uC918", "\uC7AC\uBBF8\uC788\uAC8C \uD574\uC918"]
  },
  {
    q: "\uC774\uC0C1\uC801\uC778 \uC6B0\uB9AC\uC758 \uC0DD\uD65C \uBC29\uC2DD\uC740?",
    opts: ["\uAC70\uC758 \uBAA8\uB4E0 \uAC78 \uD568\uAED8", "\uC911\uC694\uD55C \uAC83\uB9CC \uD568\uAED8", "\uAC01\uC790 \uC0DD\uD65C \uC874\uC911, \uAC00\uB054 \uD568\uAED8", "\uC0C1\uD669\uC5D0 \uB530\uB77C \uB2E4\uB984"]
  },
  {
    q: "10\uB144 \uD6C4 \uC6B0\uB9AC\uC758 \uBAA8\uC2B5\uC740?",
    opts: ["\uC544\uC774\uC640 \uD568\uAED8\uD558\uB294 \uAC00\uC815", "\uC138\uACC4\uC5EC\uD589\uD558\uB294 \uC790\uC720\uB85C\uC6B4 \uCEE4\uD50C", "\uAC01\uC790 \uAFC8 \uC774\uB8E8\uB294 \uD30C\uD2B8\uB108\uC2ED", "\uC9C0\uAE08\uCC98\uB7FC \uD589\uBCF5\uD558\uBA74 OK"]
  },
  {
    q: "\uB354 \uC798 \uB9DE\uB294 \uB370\uC774\uD2B8 \uC2A4\uD0C0\uC77C\uC740?",
    opts: ["\uAF3C\uAF3C\uD558\uAC8C \uACC4\uD68D\uD574\uC11C", "\uC989\uD765\uC801\uC73C\uB85C \uADF8\uB0A0\uADF8\uB0A0", "\uD30C\uD2B8\uB108\uAC00 \uB9AC\uB4DC", "\uBC18\uBC18\uC529 \uACC4\uD68D"]
  },
  {
    q: "\uC120\uBB3C\uC744 \uC904 \uB54C \uB098\uC758 \uBC29\uC2DD\uC740?",
    opts: ["\uC6D0\uD558\uB294 \uAC83 \uBBF8\uB9AC \uD30C\uC545", "\uC644\uC804 \uAE5C\uC9DD \uC11C\uD504\uB77C\uC774\uC988", "\uD568\uAED8 \uACE8\uB77C\uC11C", "\uACBD\uD5D8\xB7\uCD94\uC5B5 \uC120\uBB3C"]
  },
  {
    q: "\uC5F0\uC560\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD55C \uAC83\uC740?",
    opts: ["\uC2E0\uB8B0\uC640 \uC548\uC815\uAC10", "\uC124\uB818\uACFC \uC5F4\uC815", "\uD568\uAED8 \uC131\uC7A5", "\uD3B8\uC548\uD568\uACFC \uC790\uC720"]
  },
  {
    q: "\uAC08\uB4F1 \uC0C1\uD669\uC5D0\uC11C \uB098\uB294?",
    opts: ["\uC989\uC2DC \uC194\uC9C1\uD558\uAC8C \uB9D0\uD568", "\uC0C1\uD669 \uBD10\uAC00\uBA70 \uACB0\uC815", "\uC0C1\uB300 \uBA3C\uC800 \uC9C4\uC815\uC2DC\uD0B4", "\uD53C\uD558\uACE0 \uC2F6\uC5B4\uC9D0"]
  }
];
const QUIZ_TYPES = {
  A: { emoji: "\u{1F3E1}", name: tl("\uC548\uC815 \uACF5\uC874\uD615", "Stable Coexistence"), desc: tl("\uD568\uAED8\uD558\uB294 \uC77C\uC0C1\uACFC \uC548\uC815\uAC10\uC744 \uAC00\uC7A5 \uC18C\uC911\uD788 \uC5EC\uACA8\uC694. \uD3B8\uC548\uD558\uACE0 \uC2E0\uB8B0 \uAE4A\uC740 \uAD00\uACC4\uB97C \uB9CC\uB4DC\uB294 \uD0C1\uC6D4\uD55C \uD30C\uD2B8\uB108\uC608\uC694.", "You value shared daily life and stability most. An excellent partner who creates comfortable, trust-deep relationships."), tip: tl("\uAC00\uB054 \uC791\uC740 \uC11C\uD504\uB77C\uC774\uC988\uB85C \uC124\uB818\uB3C4 \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694!", "Try creating some excitement with small surprises!") },
  B: { emoji: "\u{1F4AC}", name: tl("\uAE4A\uC740 \uC720\uB300\uD615", "Deep Connection"), desc: tl("\uC9C4\uC2EC \uC5B4\uB9B0 \uC18C\uD1B5\uACFC \uC815\uC11C\uC801 \uC5F0\uACB0\uC744 \uC911\uC2DC\uD574\uC694. \uD30C\uD2B8\uB108\uC758 \uB9C8\uC74C\uC744 \uAE4A\uC774 \uC774\uD574\uD558\uACE0 \uACF5\uAC10\uD558\uB294 \uB2A5\uB825\uC774 \uB6F0\uC5B4\uB098\uC694.", "You value sincere communication and emotional connection. Excellent at deeply understanding and empathizing with your partner."), tip: tl("\uB9D0\uBCF4\uB2E4 \uD589\uB3D9\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uB294 \uD45C\uD604\uB3C4 \uC2DC\uB3C4\uD574\uBCF4\uC138\uC694!", "Try showing love through actions, not just words!") },
  C: { emoji: "\u{1F331}", name: tl("\uC131\uC7A5 \uB3D9\uBC18\uD615", "Growth Partners"), desc: tl("\uD568\uAED8 \uBC1C\uC804\uD558\uACE0 \uC0C8\uB85C\uC6B4 \uAC83\uC744 \uACBD\uD5D8\uD558\uB294 \uAD00\uACC4\uB97C \uC6D0\uD574\uC694. \uD30C\uD2B8\uB108\uC640 \uD568\uAED8 \uB354 \uB098\uC740 \uC0AC\uB78C\uC774 \uB418\uB294 \uAC83\uC5D0 \uD070 \uBCF4\uB78C\uC744 \uB290\uAEF4\uC694.", "You want a relationship where you grow and experience new things together. You find great fulfillment in becoming a better person with your partner."), tip: tl("\uC9C0\uAE08 \uC774 \uC21C\uAC04\uC744 \uC990\uAE30\uB294 \uC5EC\uC720\uB3C4 \uAC00\uC838\uBCF4\uC138\uC694!", "Take time to enjoy the present moment too!") },
  D: { emoji: "\u{1F30A}", name: tl("\uC790\uC720 \uADE0\uD615\uD615", "Free & Balanced"), desc: tl("\uC11C\uB85C\uC758 \uACF5\uAC04\uACFC \uC790\uC720\uB97C \uC874\uC911\uD558\uB294 \uC131\uC219\uD55C \uAD00\uACC4\uB97C \uC120\uD638\uD574\uC694. \uC9D1\uCC29 \uC5C6\uC774 \uBBFF\uACE0 \uB9E1\uAE30\uB294 \uC5EC\uC720\uB85C\uC6B4 \uC5F0\uC560\uB97C \uD574\uC694.", "You prefer a mature relationship that respects each other's space and freedom. A relaxed love of trusting without obsession."), tip: tl("\uAC00\uB054\uC740 \uB354 \uC801\uADF9\uC801\uC73C\uB85C \uC6D0\uD558\uB294 \uAC83\uC744 \uD45C\uD604\uD574\uBCF4\uC138\uC694!", "Sometimes express what you want more actively!") }
};
function CoupleQuizView({ onBack }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  function handleAnswer(idx) {
    const key = ["A", "B", "C", "D"][idx];
    const next = [...answers, key];
    setAnswers(next);
    if (next.length >= QUIZ_QUESTIONS.length) {
      const counts = { A: 0, B: 0, C: 0, D: 0 };
      next.forEach((k) => {
        counts[k]++;
      });
      setResult(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    } else {
      setStep((s) => s + 1);
    }
  }
  function reset() {
    setStep(-1);
    setAnswers([]);
    setResult(null);
  }
  function shareResult(t2) {
    const text = `${SERVICE_ICON} ${tl("\uB098\uC758 \uCEE4\uD50C \uC2A4\uD0C0\uC77C\uC740", "My Couple Style is")} "${t2.emoji} ${t2.name}"

${t2.desc}

${tl("\uB098\uB3C4 \uD14C\uC2A4\uD2B8\uD574\uBD10\uC694! \u2192", "Try it too! \u2192")} ${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl("\uB098\uC758 \uCEE4\uD50C \uC2A4\uD0C0\uC77C", "My Couple Style"), text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  const curQ = QUIZ_QUESTIONS[step];
  const t = result ? QUIZ_TYPES[result] : null;
  const prog = step >= 0 ? (step + 1) / QUIZ_QUESTIONS.length * 100 : 0;
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: { position: "sticky", top: 0, zIndex: 100, background: "rgba(253,252,247,0.88)", backdropFilter: "blur(16px)", borderBottom: `1px solid rgba(181,85,106,0.12)`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("button", { onClick: result ? reset : step === -1 ? onBack : () => setStep((s) => s - 1), style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uCEE4\uD50C \uC2A4\uD0C0\uC77C \uD034\uC988", "Couple Style Quiz"))), step >= 0 && !result && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, step + 1, "/", QUIZ_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" } }, step === -1 && !result && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 16 } }, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, tl("\uC6B0\uB9AC \uCEE4\uD50C \uC2A4\uD0C0\uC77C\uC740?", "What's Our Couple Style?")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 28 } }, tl("10\uBB38\uD56D\uC73C\uB85C \uC54C\uC544\uBCF4\uB294 \uB098\uC758 \uCEE4\uD50C \uC2A4\uD0C0\uC77C.", "10 questions to discover your couple style."), /* @__PURE__ */ React.createElement("br", null), tl("\uD30C\uD2B8\uB108\uC640 \uD568\uAED8 \uD574\uBCF4\uACE0 \uBE44\uAD50\uD574\uBCF4\uC138\uC694! \uBB34\uB8CC\uC608\uC694.", "Try it with your partner and compare! It's free.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 } }, Object.values(QUIZ_TYPES).map((qt) => /* @__PURE__ */ React.createElement("div", { key: qt.name, style: { padding: "8px 14px", borderRadius: 100, background: "white", border: `1px solid ${C.roseL}33`, fontSize: 12, color: C.dark } }, qt.emoji, " ", qt.name))), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(0), style: { width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color: "white", fontWeight: 700, fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif", boxShadow: `0 8px 24px ${C.amber}44` } }, tl("\uC2DC\uC791\uD558\uAE30 \u2192", "Start \u2192"))), step >= 0 && !result && curQ && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { height: 6, borderRadius: 100, background: "#F0E0E8", overflow: "hidden", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", borderRadius: 100, width: `${prog}%`, background: `linear-gradient(90deg, ${C.amberL}, ${C.amber})`, transition: "width 0.4s ease" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, textAlign: "right" } }, step + 1, "/", QUIZ_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: C.dark, lineHeight: 1.6, marginBottom: 24, textAlign: "center", fontFamily: "'Noto Serif KR', serif" } }, "Q", step + 1, ". ", curQ.q), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, curQ.opts.map((opt, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => handleAnswer(i), style: { padding: "14px 20px", borderRadius: 14, border: `1.5px solid ${C.amberL}44`, background: "white", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, color: C.dark, fontFamily: "'Noto Sans KR', sans-serif" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: C.amber, marginRight: 8 } }, ["A", "B", "C", "D"][i], "."), opt)))), result && t && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 12 } }, t.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.amber, fontWeight: 700, marginBottom: 4 } }, tl("\uB098\uC758 \uCEE4\uD50C \uC2A4\uD0C0\uC77C", "My Couple Style")), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 20, fontFamily: "'Noto Serif KR', serif" } }, t.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", borderRadius: 16, background: "#FFFBF0", border: `1px solid ${C.amberL}44` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 6 } }, "\u{1F4A1} ", tl("\uB098\uC758 \uC5F0\uC560 \uC2A4\uD0C0\uC77C", "My Love Style")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.dark, lineHeight: 1.7 } }, t.desc)), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`, border: `1px solid ${C.roseL}33` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 4 } }, "\u{1F48C} ", tl("\uD30C\uD2B8\uB108\uC640\uC758 \uC131\uC7A5 \uD301", "Growth Tip with Partner")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.dark } }, t.tip))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => shareResult(t), style: { flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`, color: "white", fontWeight: 700, fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" } }, "\u{1F4E4} ", tl("\uACB0\uACFC \uACF5\uC720\uD558\uAE30", "Share Result")), /* @__PURE__ */ React.createElement("button", { onClick: reset, style: { flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${C.amberL}44`, cursor: "pointer", background: "white", color: C.amber, fontWeight: 700, fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" } }, "\u{1F504} ", tl("\uB2E4\uC2DC \uD574\uBCF4\uAE30", "Try Again"))), /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: { width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, border: "1px solid #E0D0D8", cursor: "pointer", background: "white", color: C.muted, fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" } }, "\u2190 ", tl("\uD648\uC73C\uB85C", "Home")))));
}
const MOOD_LABELS = {
  happy: { emoji: "\u{1F60A}", label: tl("\uD589\uBCF5", "Happy"), color: "#F5C842" },
  calm: { emoji: "\u{1F60C}", label: tl("\uD3C9\uC628", "Calm"), color: "#7BC4A0" },
  tired: { emoji: "\u{1F634}", label: tl("\uD53C\uACE4", "Tired"), color: "#9BB0C0" },
  anxious: { emoji: "\u{1F630}", label: tl("\uBD88\uC548", "Anxious"), color: "#F5A050" },
  sad: { emoji: "\u{1F622}", label: tl("\uC2AC\uD514", "Sad"), color: "#6B9ACB" },
  angry: { emoji: "\u{1F624}", label: tl("\uD654\uB0A8", "Angry"), color: "#E86C6C" }
};
function PartnerMomentsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    api.get("/api/couple/partner-moments").then((res) => {
      if (res.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);
  if (loading || !data?.hasPartner) return null;
  const { partnerName, moodEntries = [], gratEntries = [] } = data;
  if (moodEntries.length === 0 && gratEntries.length === 0) return null;
  function fmtTime(iso) {
    const d = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const diff = Math.floor((now - d) / 6e4);
    if (diff < 60) return tl(`${diff}\uBD84 \uC804`, `${diff}m ago`);
    if (diff < 1440) return tl(`${Math.floor(diff / 60)}\uC2DC\uAC04 \uC804`, `${Math.floor(diff / 60)}h ago`);
    return tl(`${Math.floor(diff / 1440)}\uC77C \uC804`, `${Math.floor(diff / 1440)}d ago`);
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    overflow: "hidden",
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setOpen((v) => !v),
      style: {
        width: "100%",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F495}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: C.dark } }, partnerName, tl("\uB2D8\uC758 \uB9C8\uC74C \uC77C\uAE30", "'s Heart Diary"))),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, color: C.muted } }, open ? "\u25B2" : "\u25BC")
  ), open && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 20px 20px" } }, moodEntries.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: gratEntries.length > 0 ? 16 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 } }, "\u{1F3A8} ", tl("\uCD5C\uADFC 7\uC77C \uAC10\uC815", "Emotions: Last 7 Days")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, moodEntries.map((entry, i) => {
    const em = MOOD_LABELS[entry.emotion] || { emoji: "\u{1F4AD}", label: entry.emotion || "?", color: C.muted };
    const stars = entry.intensity ? "\u2B50".repeat(Math.min(5, entry.intensity)) : "";
    return /* @__PURE__ */ React.createElement("div", { key: i, style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "#FAF5FC",
      border: `1px solid ${em.color}22`
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, flexShrink: 0 } }, em.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: em.color } }, em.label), stars && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11 } }, stars)), entry.note && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.dark, fontStyle: "italic", lineHeight: 1.5 } }, '"', entry.note, '"')), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted, flexShrink: 0 } }, fmtTime(entry.created_at)));
  }))), gratEntries.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 } }, "\u2B50 ", tl("\uCD5C\uADFC \uAC10\uC0AC \uC77C\uAE30", "Recent Gratitude Diary")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, gratEntries.map((entry, i) => {
    const answers = entry.answers || {};
    const answerTexts = Object.values(answers).filter(Boolean);
    if (answerTexts.length === 0) return null;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: {
      padding: "12px 14px",
      borderRadius: 12,
      background: "rgba(255,224,138,0.06)",
      border: "1px solid rgba(255,224,138,0.3)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted, marginBottom: 6 } }, fmtTime(entry.created_at)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, answerTexts.slice(0, 2).map((text, j) => /* @__PURE__ */ React.createElement("div", { key: j, style: { fontSize: 12, color: C.dark, lineHeight: 1.5 } }, "\u2726 ", text)), answerTexts.length > 2 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, "+", answerTexts.length - 2, tl("\uAC1C \uB354", " more"))));
  })))));
}
const ANNIVERSARY_KEY = "couple_first_date";
function AnniversaryView({ onBack }) {
  const [firstDate, setFirstDate] = useState(() => localStorage.getItem(ANNIVERSARY_KEY) || "");
  const [inputDate, setInputDate] = useState(firstDate);
  function saveDate() {
    localStorage.setItem(ANNIVERSARY_KEY, inputDate);
    setFirstDate(inputDate);
  }
  const milestones = firstDate ? (() => {
    const start = new Date(firstDate);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const daysTotal = Math.floor((today - start) / 864e5);
    const result = [];
    const marks = [100, 200, 300, 365, 500, 730, 1e3, 1461, 1825, 2e3, 3e3, 3650];
    for (const m of marks) {
      const d = new Date(start.getTime() + m * 864e5);
      const diff = Math.floor((d - today) / 864e5);
      result.push({ label: m === 365 ? tl("1\uC8FC\uB144", "1 Year") : m === 730 ? tl("2\uC8FC\uB144", "2 Years") : m === 1461 ? tl("4\uC8FC\uB144", "4 Years") : m === 1825 ? tl("5\uC8FC\uB144", "5 Years") : m === 3650 ? tl("10\uC8FC\uB144", "10 Years") : tl(`${m}\uC77C`, `Day ${m}`), date: d, diff, isPast: diff < 0 });
    }
    return { daysTotal, milestones: result };
  })() : null;
  const nextMilestone = milestones?.milestones.find((m) => m.diff >= 0);
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: { position: "sticky", top: 0, zIndex: 100, background: "rgba(253,252,247,0.88)", backdropFilter: "blur(16px)", borderBottom: `1px solid rgba(181,85,106,0.12)`, padding: "0 20px", height: 56, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uAE30\uB150\uC77C \uACC4\uC0B0\uAE30", "Anniversary Calculator")))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 28 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, marginBottom: 10 } }, "\u{1F4C5}"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted } }, tl("\uCC98\uC74C \uB9CC\uB09C \uB0A0\uC744 \uC785\uB825\uD558\uBA74 D+N\uC77C\uACFC", "Enter the day you first met to see the D+N count"), /* @__PURE__ */ React.createElement("br", null), tl("\uB2E4\uAC00\uC624\uB294 \uAE30\uB150\uC77C\uC744 \uC54C\uB824\uB4DC\uB824\uC694.", "and upcoming anniversaries."))), /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 20, padding: "20px", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u{1F491} ", tl("\uCC98\uC74C \uB9CC\uB09C \uB0A0", "Day We First Met")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: inputDate,
      onChange: (e) => setInputDate(e.target.value),
      max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      style: { flex: 1, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.roseL}44`, fontSize: 14, outline: "none", fontFamily: "'Noto Sans KR', sans-serif", color: C.dark }
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: saveDate, disabled: !inputDate, style: { padding: "11px 20px", borderRadius: 12, border: "none", cursor: inputDate ? "pointer" : "not-allowed", background: inputDate ? C.rose : "#E0D0D8", color: "white", fontWeight: 700, fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" } }, tl("\uC800\uC7A5", "Save")))), milestones && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: `linear-gradient(135deg, ${C.rose}, ${C.lavender})`, borderRadius: 20, padding: "28px 20px", marginBottom: 20, textAlign: "center", boxShadow: `0 8px 32px ${C.rose}33` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 6, letterSpacing: 2 } }, tl("\uC6B0\uB9AC\uAC00 \uD568\uAED8\uD55C \uB0A0", "Days Together")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1 } }, "D+", milestones.daysTotal), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 8 } }, COUPLE_LANG === "en" ? `Since ${new Date(firstDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : `${new Date(firstDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} \uBD80\uD130`), nextMilestone && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.2)", fontSize: 13, color: "white", fontWeight: 600 } }, tl("\uB2E4\uC74C \uAE30\uB150\uC77C", "Next Anniversary"), ": ", nextMilestone.label, " (", tl(`D+${nextMilestone.diff}\uC77C \uD6C4`, `In ${nextMilestone.diff} days`), ")")), /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 14 } }, "\u{1F389} ", tl("\uAE30\uB150\uC77C \uBAA9\uB85D", "Anniversary List")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, milestones.milestones.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: 12,
    background: m.diff >= 0 && m.diff <= 30 ? C.rosePale : m.isPast ? "#F8F8F8" : "white",
    border: `1px solid ${m.diff >= 0 && m.diff <= 30 ? C.roseL + "44" : "#E8E8E8"}`,
    opacity: m.isPast ? 0.5 : 1
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, m.isPast ? "\u2705" : m.diff <= 7 ? "\u{1F38A}" : m.diff <= 30 ? "\u{1F514}" : "\u{1F4C5}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, m.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, m.date.toLocaleDateString(COUPLE_LANG === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" })))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: m.isPast ? C.muted : m.diff <= 7 ? C.rose : C.muted } }, m.isPast ? tl("\uC9C0\uB0A8", "Passed") : m.diff === 0 ? tl("\uC624\uB298! \u{1F389}", "Today! \u{1F389}") : tl(`${m.diff}\uC77C \uD6C4`, `In ${m.diff} days`)))))))));
}
function RelationshipTimelineView({ onBack }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    fetch("/api/couple/timeline", { headers: { "Authorization": `Bearer ${localStorage.getItem("couple_token")}` } }).then((r) => r.json()).then((d) => {
      if (d.success) setItems(d.data);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  const fmtDate2 = (d) => new Date(d).toLocaleDateString(COUPLE_LANG === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const typeStyle = {
    report: { bg: "#fdf2f8", border: "#f9a8d4", accent: C.rose, label: tl("AI \uB9AC\uD3EC\uD2B8", "AI Report") },
    session: { bg: "#f0f9ff", border: "#bae6fd", accent: "#0ea5e9", label: tl("\uCEE4\uD50C \uAC80\uC0AC", "Couple Test") },
    checkin: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", label: tl("\uAD00\uACC4 \uCCB4\uD06C\uC778", "Relationship Check-in") }
  };
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: { position: "sticky", top: 0, zIndex: 100, background: "rgba(253,252,247,0.88)", backdropFilter: "blur(16px)", borderBottom: `1px solid rgba(181,85,106,0.12)`, padding: "0 20px", height: 56, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uAD00\uACC4 \uD0C0\uC784\uB77C\uC778", "Relationship Timeline")))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 8 } }, "\u{1F5C2}\uFE0F"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 6px" } }, tl("\uAD00\uACC4 \uD0C0\uC784\uB77C\uC778", "Relationship Timeline")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted, margin: 0 } }, tl("\uC6B0\uB9AC\uC758 \uAD00\uACC4 \uAE30\uB85D\uC744 \uD55C\uB208\uC5D0 \uBCFC \uC218 \uC788\uC5B4\uC694", "See all your relationship records at a glance"))), loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } }, tl("\uBD88\uB7EC\uC624\uB294 \uC911...", "Loading...")), !loading && (!items || items.length === 0) && /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 20, padding: 28, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F331}"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: C.muted } }, tl("\uC544\uC9C1 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694.", "No records yet."), /* @__PURE__ */ React.createElement("br", null), tl("\uCEE4\uD50C \uAC80\uC0AC\uB098 \uAD00\uACC4 \uCCB4\uD06C\uC778\uC744 \uC2DC\uC791\uD574 \uBCF4\uC138\uC694!", "Start with a couple test or relationship check-in!"))), !loading && items && items.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 20, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.rose}, transparent)`, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, items.map((item, i) => {
    const s = typeStyle[item.type] || typeStyle.session;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 16, paddingLeft: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 24, height: 24, borderRadius: "50%", background: s.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 12, zIndex: 1, boxShadow: `0 0 0 3px ${s.bg}` } }, item.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "white", borderRadius: 16, padding: "14px 16px", border: `1px solid ${s.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: s.accent, background: s.bg, padding: "2px 8px", borderRadius: 20 } }, s.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.muted } }, fmtDate2(item.date))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 2 } }, item.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted } }, item.subtitle), item.score != null && item.type === "report" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { height: 6, flex: 1, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${item.score}%`, height: "100%", background: `linear-gradient(90deg,${C.rose},#f472b6)`, borderRadius: 3 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: C.rose } }, item.score, tl("\uC810", ""))), item.score != null && item.type === "checkin" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { height: 6, flex: 1, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.round(item.score / 50 * 100)}%`, height: "100%", background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 3 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "#16a34a" } }, item.score, "/50"))));
  })))));
}
const CHECKIN_QUESTIONS = COUPLE_LANG === "en" ? [
  "I have been having enough conversations with my partner recently",
  "I feel that my partner understands me well",
  "We can resolve conflicts in a healthy way",
  "I have enough time together with my partner",
  "We can picture our future together",
  "I can honestly express my feelings to my partner",
  "I feel that we support and encourage each other enough",
  "My relationship with my partner has a positive impact on my life",
  "I can feel my partner's effort and consideration",
  "Overall, I am satisfied with our relationship"
] : [
  "\uCD5C\uADFC \uD30C\uD2B8\uB108\uC640 \uCDA9\uBD84\uD55C \uB300\uD654\uB97C \uB098\uB204\uACE0 \uC788\uB2E4",
  "\uD30C\uD2B8\uB108\uAC00 \uB098\uB97C \uC798 \uC774\uD574\uD574\uC900\uB2E4\uACE0 \uB290\uB080\uB2E4",
  "\uAC08\uB4F1\uC774 \uC0DD\uACBC\uC744 \uB54C \uAC74\uAC15\uD558\uAC8C \uD574\uACB0\uD560 \uC218 \uC788\uB2E4",
  "\uD30C\uD2B8\uB108\uC640 \uD568\uAED8\uD558\uB294 \uC2DC\uAC04\uC774 \uCDA9\uBD84\uD558\uB2E4",
  "\uC11C\uB85C\uC758 \uBBF8\uB798\uB97C \uD568\uAED8 \uADF8\uB9B4 \uC218 \uC788\uB2E4",
  "\uD30C\uD2B8\uB108\uC5D0\uAC8C \uB098\uC758 \uAC10\uC815\uC744 \uC194\uC9C1\uD558\uAC8C \uB9D0\uD560 \uC218 \uC788\uB2E4",
  "\uC11C\uB85C\uB97C \uCDA9\uBD84\uD788 \uC9C0\uC9C0\uD558\uACE0 \uC751\uC6D0\uD55C\uB2E4\uACE0 \uB290\uB080\uB2E4",
  "\uD30C\uD2B8\uB108\uC640\uC758 \uAD00\uACC4\uAC00 \uB0B4 \uC0B6\uC5D0 \uAE0D\uC815\uC801\uC778 \uC601\uD5A5\uC744 \uC900\uB2E4",
  "\uD30C\uD2B8\uB108\uC758 \uB178\uB825\uACFC \uBC30\uB824\uAC00 \uB290\uAEF4\uC9C4\uB2E4",
  "\uC804\uBC18\uC801\uC73C\uB85C \uC6B0\uB9AC \uAD00\uACC4\uC5D0 \uB9CC\uC871\uD55C\uB2E4"
];
const SCORE_LABELS = COUPLE_LANG === "en" ? ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] : ["\uB9E4\uC6B0 \uC544\uB2C8\uB2E4", "\uC544\uB2C8\uB2E4", "\uBCF4\uD1B5", "\uADF8\uB807\uB2E4", "\uB9E4\uC6B0 \uADF8\uB807\uB2E4"];
function checkinScoreInfo(score, maxScore) {
  const pct = Math.round(score / maxScore * 100);
  if (pct >= 80) return { emoji: "\u{1F49A}", label: tl("\uB9E4\uC6B0 \uAC74\uAC15\uD55C \uAD00\uACC4", "Very Healthy Relationship"), color: "#4A9A5A", pale: "#EAF5EC" };
  if (pct >= 60) return { emoji: "\u{1F49B}", label: tl("\uC88B\uC740 \uAD00\uACC4 (\uC131\uC7A5 \uC911)", "Good Relationship (Growing)"), color: "#C4954A", pale: "#FEF8EC" };
  if (pct >= 40) return { emoji: "\u{1F9E1}", label: tl("\uD568\uAED8 \uB178\uB825\uC774 \uD544\uC694\uD574\uC694", "Needs Effort Together"), color: "#D4634A", pale: "#FEF0EC" };
  return { emoji: "\u2764\uFE0F\u200D\u{1FA79}", label: tl("\uB354 \uB9CE\uC740 \uAD00\uC2EC\uC774 \uD544\uC694\uD55C \uC2DC\uAE30", "Time for More Attention"), color: C.rose, pale: C.rosePale };
}
function RelationshipCheckinView({ onBack, onDone }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState(null);
  const [doneThisMonth, setDoneThisMonth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/api/couple/checkins").then((res) => {
      if (res.success) {
        setHistory(res.data.checkins);
        setDoneThisMonth(res.data.doneThisMonth);
      }
    });
  }, []);
  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/api/couple/checkin", { answers });
      if (res.success) {
        setResult(res.data);
        setStep(10);
        if (onDone) onDone();
      } else {
        setError(res.error || tl("\uC800\uC7A5 \uC2E4\uD328", "Save failed"));
      }
    } catch {
      setError(tl("\uC11C\uBC84 \uC624\uB958", "Server error"));
    } finally {
      setSubmitting(false);
    }
  }
  const progress = step >= 0 && step < 10 ? step / CHECKIN_QUESTIONS.length * 100 : 0;
  const curQ = CHECKIN_QUESTIONS[step];
  function HistorySection() {
    if (!history?.length) return null;
    const MAX = 10 * 5;
    const sorted = [...history].reverse();
    const W = 280, H = 80, PAD = 16;
    const plotW = W - PAD * 2, plotH = H - PAD * 2;
    const minScore = Math.min(...sorted.map((h) => h.total_score));
    const maxScore = Math.max(...sorted.map((h) => h.total_score), MAX * 0.4);
    const xStep = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW;
    const toX = (i) => PAD + (sorted.length > 1 ? i * xStep : plotW / 2);
    const toY = (v) => PAD + plotH - (v - Math.max(0, minScore - 5)) / (maxScore - Math.max(0, minScore - 5) + 1) * plotH;
    const points = sorted.map((h, i) => ({ x: toX(i), y: toY(h.total_score), score: h.total_score, date: h.created_at }));
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const latestInfo = checkinScoreInfo(history[0].total_score, MAX);
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 } }, "\u{1F4C8} ", tl("\uAD00\uACC4 \uAC74\uAC15\uB3C4 \uD2B8\uB80C\uB4DC", "Relationship Health Trend")), sorted.length >= 2 && /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 16,
      padding: "16px",
      border: `1px solid ${C.rose}22`,
      marginBottom: 12
    } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } }, [25, 50, 75, 100].map((pct) => {
      const y = toY(MAX * pct / 100);
      return /* @__PURE__ */ React.createElement("g", { key: pct }, /* @__PURE__ */ React.createElement("line", { x1: PAD, y1: y, x2: W - PAD, y2: y, stroke: "#F0E8EC", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("text", { x: PAD - 2, y: y + 3, textAnchor: "end", fontSize: "7", fill: "#C0A0B0" }, pct));
    }), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: `${pathD} L ${points[points.length - 1].x} ${PAD + plotH} L ${points[0].x} ${PAD + plotH} Z`,
        fill: `${C.rose}18`,
        stroke: "none"
      }
    ), /* @__PURE__ */ React.createElement("path", { d: pathD, fill: "none", stroke: C.rose, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), points.map((p, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("circle", { cx: p.x, cy: p.y, r: "4", fill: "white", stroke: C.rose, strokeWidth: "2" }), /* @__PURE__ */ React.createElement("text", { x: p.x, y: H - 3, textAnchor: "middle", fontSize: "7", fill: "#C0A0B0" }, new Date(p.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })))), /* @__PURE__ */ React.createElement(
      "text",
      {
        x: points[points.length - 1].x,
        y: points[points.length - 1].y - 7,
        textAnchor: "middle",
        fontSize: "9",
        fontWeight: "bold",
        fill: C.rose
      },
      Math.round(points[points.length - 1].score / MAX * 100),
      tl("\uC810", "")
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, history.map((h, i) => {
      const info = checkinScoreInfo(h.total_score, MAX);
      const pct = Math.round(h.total_score / MAX * 100);
      return /* @__PURE__ */ React.createElement("div", { key: h.id, style: {
        padding: "12px 14px",
        borderRadius: 12,
        background: i === 0 ? info.pale : "#F8F8F8",
        border: `1px solid ${i === 0 ? info.color + "33" : "#E8E8E8"}`
      } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: info.color } }, info.emoji, " ", info.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, fmtDate(h.created_at))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 6, borderRadius: 100, background: "#E8E0E4", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, borderRadius: 100, background: info.color, transition: "width 1s ease" } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: info.color, minWidth: 36 } }, pct, tl("\uC810", ""))));
    })), history.length >= 2 && (() => {
      const latestPct = Math.round(history[0].total_score / MAX * 100);
      const prevPct = Math.round(history[1].total_score / MAX * 100);
      const diff = latestPct - prevPct;
      return /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 10,
        padding: "10px 14px",
        borderRadius: 12,
        background: diff >= 0 ? "#EAF5EC" : "#FEF0EC",
        fontSize: 12,
        color: diff >= 0 ? "#4A9A5A" : "#D4634A",
        fontWeight: 600
      } }, diff >= 0 ? tl(`\u{1F4C8} \uC9C0\uB09C \uB2EC \uB300\uBE44 +${diff}\uC810 \uD5A5\uC0C1\uB410\uC5B4\uC694! \u{1F389}`, `\u{1F4C8} Improved by +${diff} points from last month! \u{1F389}`) : tl(`\u{1F4C9} \uC9C0\uB09C \uB2EC\uBCF4\uB2E4 ${Math.abs(diff)}\uC810 \uB0AE\uC544\uC694. \uD568\uAED8 \uB178\uB825\uD574\uBD10\uC694 \u{1F4AA}`, `\u{1F4C9} ${Math.abs(diff)} points lower than last month. Let's work on it together \u{1F4AA}`));
    })());
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: step === -1 || step === 10 ? onBack : () => setStep((s) => s - 1), style: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: C.dark,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uAD00\uACC4 \uC131\uC7A5 \uCCB4\uD06C\uC778", "Relationship Growth Check-in"))), step >= 0 && step < 10 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, step + 1, " / ", CHECKIN_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" } }, step === -1 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, marginBottom: 12 } }, "\u{1F331}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" } }, tl("\uC774\uBC88 \uB2EC \uAD00\uACC4 \uC131\uC7A5 \uCCB4\uD06C\uC778", "This Month's Relationship Check-in")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted, lineHeight: 1.8 } }, tl("10\uAC00\uC9C0 \uC9C8\uBB38\uC73C\uB85C \uC9C0\uAE08 \uC6B0\uB9AC \uAD00\uACC4\uC758 \uAC74\uAC15\uB3C4\uB97C \uC810\uAC80\uD574\uBCF4\uC138\uC694.", "Check your relationship health with 10 questions."), /* @__PURE__ */ React.createElement("br", null), tl("\uB9E4\uB2EC \uAE30\uB85D\uD558\uBA74 \uC131\uC7A5 \uACFC\uC815\uC744 \uBCFC \uC218 \uC788\uC5B4\uC694.", "Recording monthly lets you see your growth over time."))), doneThisMonth ? /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px",
    borderRadius: 14,
    background: "#EAF5EC",
    border: "1px solid #4A9A5A33",
    textAlign: "center",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, marginBottom: 6 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#4A9A5A" } }, tl("\uC774\uBC88 \uB2EC \uCCB4\uD06C\uC778 \uC644\uB8CC!", "This Month's Check-in Done!")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 4 } }, tl("\uB2E4\uC74C \uCCB4\uD06C\uC778\uC740 \uB2E4\uC74C \uB2EC\uC5D0 \uD560 \uC218 \uC788\uC5B4\uC694.", "Next check-in available next month."))) : /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(0), style: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, #4A9A5A, #7ABAA8)`,
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 16,
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: "0 8px 24px #4A9A5A44"
  } }, "\u{1F331} ", tl("\uC774\uBC88 \uB2EC \uCCB4\uD06C\uC778 \uC2DC\uC791\uD558\uAE30", "Start This Month's Check-in")), /* @__PURE__ */ React.createElement(HistorySection, null)), step >= 0 && step < 10 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { height: 6, borderRadius: 100, background: "#F0E0E8", overflow: "hidden", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", borderRadius: 100, width: `${progress}%`, background: "linear-gradient(90deg, #7ABAA8, #4A9A5A)", transition: "width 0.4s ease" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, textAlign: "right" } }, step + 1, "/", CHECKIN_QUESTIONS.length)), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 17,
    fontWeight: 700,
    color: C.dark,
    lineHeight: 1.6,
    marginBottom: 28,
    textAlign: "center",
    fontFamily: "'Noto Serif KR', serif"
  } }, "Q", step + 1, ". ", curQ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, SCORE_LABELS.map((label, idx) => {
    const val = idx + 1;
    const isSelected = answers[`q${step}`] === val;
    const colors = ["#E05C5C", "#E09A5C", "#D4B84A", "#7ABAA8", "#4A9A5A"];
    return /* @__PURE__ */ React.createElement("button", { key: val, onClick: () => {
      setAnswers((prev) => ({ ...prev, [`q${step}`]: val }));
      if (step < CHECKIN_QUESTIONS.length - 1) {
        setTimeout(() => setStep((s) => s + 1), 200);
      }
    }, style: {
      padding: "14px 20px",
      borderRadius: 14,
      cursor: "pointer",
      background: isSelected ? colors[idx] + "22" : "white",
      border: `1.5px solid ${isSelected ? colors[idx] : "#E8D0D8"}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontFamily: "'Noto Sans KR', sans-serif",
      transition: "all 0.15s"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 28,
      height: 28,
      borderRadius: 100,
      background: isSelected ? colors[idx] : "#F0E0E8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: isSelected ? "white" : C.muted,
      flexShrink: 0
    } }, val), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? C.dark : C.muted } }, label));
  })), step === 9 && answers[`q${step}`] && /* @__PURE__ */ React.createElement("button", { onClick: handleSubmit, disabled: submitting, style: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #4A9A5A, #7ABAA8)",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    marginTop: 16,
    fontFamily: "'Noto Sans KR', sans-serif",
    opacity: submitting ? 0.7 : 1
  } }, submitting ? tl("\uC800\uC7A5 \uC911...", "Saving...") : tl("\u2705 \uCCB4\uD06C\uC778 \uC644\uB8CC\uD558\uAE30", "\u2705 Complete Check-in")), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#D05555", textAlign: "center", marginTop: 10 } }, error)), step === 10 && result && (() => {
    const MAX = CHECKIN_QUESTIONS.length * 5;
    const info = checkinScoreInfo(result.totalScore, MAX);
    const pct = Math.round(result.totalScore / MAX * 100);
    return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, marginBottom: 12, animation: "heartbeat 1s ease-in-out 3" } }, info.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: info.color, fontWeight: 700, marginBottom: 4 } }, tl("\uC774\uBC88 \uB2EC \uAD00\uACC4 \uAC74\uAC15\uB3C4", "This Month's Relationship Health")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, fontWeight: 800, color: info.color, marginBottom: 4 } }, pct, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, tl("\uC810", ""))), /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-block",
      marginBottom: 24,
      padding: "5px 16px",
      borderRadius: 100,
      background: info.color + "18",
      color: info.color,
      fontWeight: 700,
      fontSize: 13
    } }, info.label), /* @__PURE__ */ React.createElement("div", { style: { width: "80%", margin: "0 auto 24px", height: 10, borderRadius: 100, background: "#F0E0E8", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, borderRadius: 100, background: info.color, transition: "width 1.2s ease" } })), /* @__PURE__ */ React.createElement("div", { style: {
      padding: "16px",
      borderRadius: 16,
      marginBottom: 16,
      background: info.pale,
      border: `1px solid ${info.color}33`,
      fontSize: 13,
      color: C.dark,
      lineHeight: 1.7
    } }, pct >= 80 && tl("\uB450 \uC0AC\uB78C\uC758 \uAD00\uACC4\uAC00 \uB9E4\uC6B0 \uAC74\uAC15\uD558\uAC8C \uC720\uC9C0\uB418\uACE0 \uC788\uC5B4\uC694! \uC9C0\uAE08\uC758 \uBAA8\uC2B5\uC744 \uACC4\uC18D \uC774\uC5B4\uAC00 \uBCF4\uC138\uC694. \u{1F495}", "Your relationship is very healthy! Keep it up just as you are. \u{1F495}"), pct >= 60 && pct < 80 && tl("\uC804\uBC18\uC801\uC73C\uB85C \uC88B\uC740 \uAD00\uACC4\uB97C \uC720\uC9C0\uD558\uACE0 \uC788\uC5B4\uC694. \uC870\uAE08 \uB354 \uC2E0\uACBD \uC4F0\uACE0 \uC2F6\uC740 \uBD80\uBD84\uC744 \uD568\uAED8 \uC774\uC57C\uAE30\uD574\uBCF4\uC138\uC694. \u{1F331}", "Overall a good relationship. Talk together about areas you'd like to improve a bit. \u{1F331}"), pct >= 40 && pct < 60 && tl("\uAC1C\uC120\uC774 \uD544\uC694\uD55C \uBD80\uBD84\uC774 \uBCF4\uC5EC\uC694. \uD30C\uD2B8\uB108\uC640 \uC194\uC9C1\uD558\uAC8C \uB300\uD654\uD574\uBCF4\uB294 \uC2DC\uAC04\uC744 \uAC00\uC838\uBCF4\uC138\uC694. \u{1F4AC}", "There are areas that need improvement. Take time to have an honest conversation with your partner. \u{1F4AC}"), pct < 40 && tl("\uC9C0\uAE08\uC740 \uAD00\uACC4\uC5D0 \uB354 \uB9CE\uC740 \uAD00\uC2EC\uC774 \uD544\uC694\uD55C \uC2DC\uAE30\uC608\uC694. \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uD568\uAED8 \uC810\uAC80\uD574\uBCF4\uB294 \uAC83\uB3C4 \uC88B\uC544\uC694. \u{1F486}", "This is a time when your relationship needs more attention. It may help to check in with a professional counselor. \u{1F486}")), /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
      width: "100%",
      padding: "12px",
      borderRadius: 12,
      border: "1px solid #E0D0D8",
      cursor: "pointer",
      background: "white",
      color: C.muted,
      fontSize: 12,
      fontFamily: "'Noto Sans KR', sans-serif"
    } }, "\u2190 ", tl("\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30", "Back to Home")));
  })()));
}
const DATE_REGIONS = COUPLE_LANG === "en" ? ["Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Jeju", "Gyeonggi", "Gangwon"] : ["\uC11C\uC6B8", "\uBD80\uC0B0", "\uB300\uAD6C", "\uC778\uCC9C", "\uAD11\uC8FC", "\uC81C\uC8FC", "\uACBD\uAE30", "\uAC15\uC6D0"];
const DATE_MOODS = COUPLE_LANG === "en" ? [
  { key: "\u{1F339} Romantic", desc: "Atmospheric restaurant, night view, wine" },
  { key: "\u26A1 Active", desc: "Sports, activities, games" },
  { key: "\u{1F33F} Healing", desc: "Nature, caf\xE9, walk, hot spring" },
  { key: "\u{1F3A8} Cultural", desc: "Exhibition, performance, movie, museum" }
] : [
  { key: "\u{1F339} \uB85C\uB9E8\uD2F1", desc: "\uBD84\uC704\uAE30 \uC788\uB294 \uB808\uC2A4\uD1A0\uB791, \uC57C\uACBD, \uC640\uC778" },
  { key: "\u26A1 \uD65C\uB3D9\uC801", desc: "\uC2A4\uD3EC\uCE20, \uC561\uD2F0\uBE44\uD2F0, \uAC8C\uC784" },
  { key: "\u{1F33F} \uD790\uB9C1", desc: "\uC790\uC5F0, \uCE74\uD398, \uC0B0\uCC45, \uC628\uCC9C" },
  { key: "\u{1F3A8} \uBB38\uD654\uC608\uC220", desc: "\uC804\uC2DC, \uACF5\uC5F0, \uC601\uD654, \uBBF8\uC220\uAD00" }
];
const DATE_DURATIONS = COUPLE_LANG === "en" ? ["Half Day (3~4 hrs)", "Full Day (6~8 hrs)", "Overnight (2 Days)"] : ["\uBC18\uB098\uC808 (3~4\uC2DC\uAC04)", "\uD558\uB8E8 (6~8\uC2DC\uAC04)", "1\uBC15 2\uC77C"];
const DATE_BUDGETS = COUPLE_LANG === "en" ? ["Budget (Under \u20A950K)", "Regular (\u20A950K~150K)", "Special (\u20A9150K+)"] : ["\uC54C\uB730 (5\uB9CC\uC6D0 \uC774\uD558)", "\uBCF4\uD1B5 (5~15\uB9CC\uC6D0)", "\uD2B9\uBCC4 (15\uB9CC\uC6D0 \uC774\uC0C1)"];
function DateCourseView({ credits, isMaster, onBack }) {
  const [region, setRegion] = useState("");
  const [mood, setMood] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState("");
  const [error, setError] = useState("");
  const COST = 3;
  const canAfford = isMaster || credits >= COST;
  const allSelected = region && mood && duration && budget;
  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/couple/date-course", { region, mood, duration, budget });
      if (res.success) {
        setCourse(res.data.course);
      } else if (res.needsCharge) {
        setError(tl(`\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. (\uD544\uC694: ${COST}cr)`, `Insufficient credits. (Required: ${COST}cr)`));
      } else {
        setError(res.error || tl("\uC0DD\uC131 \uC2E4\uD328", "Generation failed"));
      }
    } catch {
      setError(tl("\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "A server error occurred."));
    } finally {
      setLoading(false);
    }
  }
  function shareCourse() {
    const text = `${SERVICE_ICON} ${tl("\uC624\uB298\uC758 \uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "Today's Date Course Recommendation")} (${region}, ${mood})

${course}

${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl("\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "Date Course Recommendation"), text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: course ? () => setCourse("") : onBack, style: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: C.dark,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("AI \uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "AI Date Course Recommendation"))), !isMaster && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.rose, fontWeight: 700 } }, COST, "cr")), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" } }, !course ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, marginBottom: 10 } }, "\u{1F5FA}\uFE0F"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted, lineHeight: 1.8 } }, tl("\uC870\uAC74\uC744 \uC120\uD0DD\uD558\uBA74 AI\uAC00 \uB531 \uB9DE\uB294", "Select your preferences and AI will recommend"), /* @__PURE__ */ React.createElement("br", null), tl("\uB370\uC774\uD2B8 \uCF54\uC2A4\uB97C \uCD94\uCC9C\uD574\uB4DC\uB824\uC694!", "the perfect date course for you!"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u{1F4CD} ", tl("\uC5B4\uB514\uC11C?", "Where?")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, DATE_REGIONS.map((r) => /* @__PURE__ */ React.createElement("button", { key: r, onClick: () => setRegion(r), style: {
    padding: "8px 16px",
    borderRadius: 100,
    border: "none",
    cursor: "pointer",
    background: region === r ? C.rose : "#F5EFE0",
    color: region === r ? "white" : C.dark,
    fontWeight: region === r ? 700 : 500,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, r)))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u2728 ", tl("\uC5B4\uB5A4 \uBD84\uC704\uAE30?", "What Mood?")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, DATE_MOODS.map((m) => /* @__PURE__ */ React.createElement("button", { key: m.key, onClick: () => setMood(m.key), style: {
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    background: mood === m.key ? C.rosePale : "white",
    border: `1.5px solid ${mood === m.key ? C.roseL : "#E8D8E0"}`,
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, m.key.split(" ")[0]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, m.key.split(" ")[1]), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, m.desc)))))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u23F0 ", tl("\uC5BC\uB9C8\uB098?", "How Long?")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, DATE_DURATIONS.map((d) => /* @__PURE__ */ React.createElement("button", { key: d, onClick: () => setDuration(d), style: {
    padding: "11px 16px",
    borderRadius: 12,
    cursor: "pointer",
    background: duration === d ? C.lavPale : "white",
    border: `1.5px solid ${duration === d ? C.lavL : "#E8D8E0"}`,
    fontSize: 13,
    fontWeight: duration === d ? 700 : 500,
    color: C.dark,
    fontFamily: "'Noto Sans KR', sans-serif",
    textAlign: "left"
  } }, d)))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u{1F4B0} ", tl("\uC608\uC0B0\uC740?", "Budget?")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, DATE_BUDGETS.map((b) => /* @__PURE__ */ React.createElement("button", { key: b, onClick: () => setBudget(b), style: {
    flex: 1,
    padding: "10px 8px",
    borderRadius: 12,
    cursor: "pointer",
    background: budget === b ? C.lavPale : "white",
    border: `1.5px solid ${budget === b ? C.lavL : "#E8D8E0"}`,
    fontSize: 11,
    fontWeight: budget === b ? 700 : 500,
    color: C.dark,
    fontFamily: "'Noto Sans KR', sans-serif",
    lineHeight: 1.4,
    textAlign: "center"
  } }, b)))), !canAfford && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px", borderRadius: 12, background: "#FFF0F0", border: "1px solid #FFD0D0", fontSize: 12, color: "#D05555", marginBottom: 12 } }, "\u{1F4B8} ", tl(`\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. (\uD544\uC694: ${COST}cr / \uBCF4\uC720: ${credits}cr)`, `Insufficient credits. (Required: ${COST}cr / Balance: ${credits}cr)`)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: generate,
      disabled: !allSelected || !canAfford || loading,
      style: {
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "none",
        cursor: allSelected && canAfford ? "pointer" : "not-allowed",
        background: allSelected && canAfford ? `linear-gradient(135deg, ${C.rose}, ${C.lavender})` : "#E0D0D8",
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        fontFamily: "'Noto Sans KR', sans-serif",
        boxShadow: allSelected && canAfford ? `0 8px 24px ${C.rose}33` : "none",
        opacity: loading ? 0.7 : 1
      }
    },
    loading ? tl("\u{1F5FA}\uFE0F AI\uAC00 \uCF54\uC2A4 \uB9CC\uB4DC\uB294 \uC911...", "\u{1F5FA}\uFE0F AI is creating your course...") : `\u{1F5FA}\uFE0F ${tl("\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C\uBC1B\uAE30", "Get Date Course Recommendation")} ${isMaster ? tl("(\uBB34\uB8CC)", "(Free)") : `(${COST}cr)`}`
  ), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#D05555", textAlign: "center", marginTop: 10 } }, error)) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 8 } }, "\u{1F5FA}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted } }, region, " \xB7 ", mood.split(" ")[1], " \xB7 ", duration.split(" ")[0])), /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    padding: "24px 20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    marginBottom: 16
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.dark, lineHeight: 2.1, whiteSpace: "pre-wrap", wordBreak: "keep-all" } }, course)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: shareCourse, style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4E4} ", tl("\uD30C\uD2B8\uB108\uC640 \uACF5\uC720", "Share with Partner")), /* @__PURE__ */ React.createElement("button", { onClick: () => setCourse(""), style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: `1px solid ${C.roseL}44`,
    cursor: "pointer",
    background: "white",
    color: C.rose,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F504} ", tl("\uB2E4\uC2DC \uCD94\uCC9C\uBC1B\uAE30", "Get New Recommendation"))), /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    width: "100%",
    marginTop: 8,
    padding: "10px",
    borderRadius: 12,
    border: "1px solid #E0D0D8",
    cursor: "pointer",
    background: "white",
    color: C.muted,
    fontSize: 12,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u2190 ", tl("\uD648\uC73C\uB85C", "Home")))));
}
function SoloAnalysisView({ testResults, userName, credits, isMaster, onBack }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const COST = 5;
  const canAfford = isMaster || credits >= COST;
  const hasData = !!(testResults?.big5 || testResults?.lost || testResults?.dsi);
  async function generateSoloReport() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/couple/solo-analysis", {});
      if (res.success) {
        setReport(res.data.report);
      } else {
        setError(res.error || tl("\uBD84\uC11D \uC0DD\uC131 \uC2E4\uD328", "Analysis generation failed"));
      }
    } catch {
      setError(tl("\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "A server error occurred."));
    } finally {
      setLoading(false);
    }
  }
  function shareReport() {
    const text = `${SERVICE_ICON} ${SERVICE_NAME} \u2014 ${tl("\uB098\uC758 \uC5F0\uC560 \uC131\uD5A5 \uBD84\uC11D", "My Love Tendency Analysis")}

${report.slice(0, 200)}...

${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: tl("\uB098\uC758 \uC5F0\uC560 \uC131\uD5A5 \uBD84\uC11D", "My Love Tendency Analysis"), text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: C.dark,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uC774\uC0C1\uD615 \uC131\uD5A5 \uBD84\uC11D", "Ideal Type Analysis"))), !isMaster && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.rose, fontWeight: 700 } }, COST, "cr")), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" } }, !report ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, marginBottom: 16 } }, "\u{1F52E}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, tl("\uB098\uC758 \uC774\uC0C1\uD615 \uC131\uD5A5 \uBD84\uC11D", "My Ideal Type Analysis")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 28 } }, tl("\uB0B4 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C AI\uAC00 \uBD84\uC11D\uD558\uB294", "AI analysis based on your psychological test results:"), /* @__PURE__ */ React.createElement("br", null), tl("\uB098\uC758 \uC5F0\uC560 \uAC15\uC810, \uC798 \uB9DE\uB294 \uD30C\uD2B8\uB108 \uC720\uD615, \uC131\uC7A5 \uD3EC\uC778\uD2B8", "your love strengths, best partner type, and growth points")), !hasData && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px",
    borderRadius: 14,
    background: "#FFF8F0",
    border: "1px solid #FFD8A0",
    fontSize: 13,
    color: "#A07040",
    marginBottom: 24,
    textAlign: "left"
  } }, "\u{1F4A1} ", tl(`${MAIN_SERVICE_NAME}\uC5D0\uC11C BIG5, LOST, SDRI \uAC80\uC0AC\uB97C \uD558\uB098 \uC774\uC0C1 \uC644\uB8CC\uD574\uC57C \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.`, `You need to complete at least one of BIG5, LOST, or SDRI tests on ${MAIN_SERVICE_NAME} to use this feature.`)), hasData && !canAfford && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "14px",
    borderRadius: 14,
    background: "#FFF0F0",
    border: "1px solid #FFD0D0",
    fontSize: 13,
    color: "#D05555",
    marginBottom: 24,
    textAlign: "left"
  } }, "\u{1F4B8} ", tl(`\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. (\uD544\uC694: ${COST}cr / \uBCF4\uC720: ${credits}cr)`, `Insufficient credits. (Required: ${COST}cr / Balance: ${credits}cr)`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 28 } }, [
    { emoji: "\u{1F4AA}", title: tl("\uB098\uC758 \uC5F0\uC560 \uAC15\uC810", "My Love Strengths"), desc: tl("\uB0B4\uAC00 \uAD00\uACC4\uC5D0\uC11C \uC798\uD558\uB294 \uAC83\uACFC \uB9E4\uB825 \uD3EC\uC778\uD2B8", "What I do well in relationships and my attractive points") },
    { emoji: "\u{1F491}", title: tl("\uC798 \uB9DE\uB294 \uD30C\uD2B8\uB108 \uC720\uD615", "Best Partner Type"), desc: tl("\uB098\uC640 \uAD81\uD569\uC774 \uC88B\uC740 \uC131\uACA9\xB7\uD589\uB3D9 \uC720\uD615", "Personality and behavior types that match well with me") },
    { emoji: "\u{1F331}", title: tl("\uD568\uAED8 \uC131\uC7A5\uD560 \uD3EC\uC778\uD2B8", "Growth Points"), desc: tl("\uB354 \uC88B\uC740 \uAD00\uACC4\uB97C \uC704\uD55C \uAC1C\uC778 \uC131\uC7A5 \uBC29\uD5A5", "Personal growth direction for a better relationship") }
  ].map((item) => /* @__PURE__ */ React.createElement("div", { key: item.title, style: {
    display: "flex",
    gap: 12,
    padding: "14px",
    borderRadius: 14,
    background: "white",
    border: "1px solid #F0E0E8"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, item.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, item.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 } }, item.desc))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: generateSoloReport,
      disabled: !hasData || !canAfford || loading,
      style: {
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "none",
        cursor: hasData && canAfford ? "pointer" : "not-allowed",
        background: hasData && canAfford ? `linear-gradient(135deg, ${C.lavender}, ${C.lavL})` : "#E0D0D8",
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        fontFamily: "'Noto Sans KR', sans-serif",
        boxShadow: hasData && canAfford ? `0 8px 24px ${C.lavender}44` : "none",
        opacity: loading ? 0.7 : 1
      }
    },
    loading ? tl("\u{1F52E} AI\uAC00 \uBD84\uC11D \uC911...", "\u{1F52E} AI is analyzing...") : `\u{1F52E} ${tl("\uBD84\uC11D \uC2DC\uC791\uD558\uAE30", "Start Analysis")} ${isMaster ? tl("(\uBB34\uB8CC)", "(Free)") : `(${COST}cr)`}`
  ), error && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 13, color: "#D05555", textAlign: "center" } }, error)) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 8 } }, "\u{1F52E}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" } }, userName, tl("\uB2D8\uC758 \uC5F0\uC560 \uC131\uD5A5 \uBD84\uC11D", "'s Love Tendency Analysis"))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    padding: "24px 20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    marginBottom: 16
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.dark, lineHeight: 2, whiteSpace: "pre-wrap", wordBreak: "keep-all" } }, report)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: shareReport, style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.lavender}, ${C.lavL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4E4} ", tl("\uACB0\uACFC \uACF5\uC720\uD558\uAE30", "Share Result")), /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    flex: 1,
    padding: "12px",
    borderRadius: 12,
    border: `1px solid ${C.lavL}44`,
    cursor: "pointer",
    background: "white",
    color: C.lavender,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u2190 ", tl("\uD648\uC73C\uB85C", "Home"))))));
}
function ScoreGauge({ score }) {
  const color = scoreColor(score);
  return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", margin: "16px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, fontWeight: 800, color, lineHeight: 1 } }, score), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 4 } }, "/ 100", tl("\uC810", "")), /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    marginTop: 8,
    padding: "5px 16px",
    borderRadius: 100,
    background: color + "18",
    color,
    fontWeight: 700,
    fontSize: 13
  } }, scoreLabel(score)), /* @__PURE__ */ React.createElement("div", { style: {
    margin: "12px auto 0",
    width: "80%",
    maxWidth: 260,
    height: 8,
    borderRadius: 100,
    background: "#F0E0E8",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    borderRadius: 100,
    width: `${score}%`,
    background: `linear-gradient(90deg, ${C.roseL}, ${color})`,
    transition: "width 1.2s ease"
  } })));
}
function CodeInput({ onJoin, loading }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      setError(tl("6\uC790\uB9AC \uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.", "Please enter a 6-digit code."));
      return;
    }
    setError("");
    const result = await onJoin(c);
    if (!result.success) setError(result.error || tl("\uCC38\uC5EC \uC2E4\uD328", "Join failed"));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: code,
      onChange: (e) => setCode(e.target.value.toUpperCase().slice(0, 6)),
      onKeyDown: (e) => e.key === "Enter" && handleSubmit(),
      placeholder: tl("6\uC790\uB9AC \uCF54\uB4DC \uC785\uB825", "Enter 6-digit code"),
      maxLength: 6,
      style: {
        flex: 1,
        padding: "12px 16px",
        borderRadius: 12,
        fontSize: 18,
        border: `2px solid ${error ? "#E05555" : "#E8D0D8"}`,
        fontFamily: "'Noto Sans KR', monospace",
        letterSpacing: 4,
        textAlign: "center",
        fontWeight: 700,
        color: C.dark,
        outline: "none",
        background: "white"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: loading || code.length !== 6,
      style: {
        padding: "12px 20px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: code.length === 6 ? `linear-gradient(135deg, ${C.lavender}, ${C.lavL})` : "#E0E0E0",
        color: "white",
        fontWeight: 700,
        fontSize: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        opacity: loading ? 0.7 : 1
      }
    },
    loading ? "..." : tl("\uCC38\uC5EC", "Join")
  )), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#E05555", textAlign: "center" } }, error));
}
function CoupleReportView({ session, myRole, partnerName, userName, onBack }) {
  const [report, setReport] = useState(session?.ai_report_text || "");
  const [score, setScore] = useState(session?.compatibility_score || 0);
  const [generating, setGen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!report && session?.status === "both_done") {
      generateReport();
    }
  }, []);
  async function generateReport() {
    setGen(true);
    setError("");
    try {
      const res = await api.post("/api/couple/report", { session_code: session.session_code });
      if (res.success) {
        setReport(res.data.report);
        setScore(res.data.compatibility_score);
      } else {
        setError(res.error || tl("\uB9AC\uD3EC\uD2B8 \uC0DD\uC131 \uC2E4\uD328", "Report generation failed"));
      }
    } catch {
      setError(tl("\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "A server error occurred."));
    } finally {
      setGen(false);
    }
  }
  const hasDsi = (() => {
    try {
      return !!(session?.host_result_json && JSON.parse(session.host_result_json || "{}").dsi);
    } catch {
      return false;
    }
  })();
  const testLabel = session?.test_type || "BIG5+LOST+DSI";
  const hostLabel = myRole === "host" ? `${userName} ${tl("(\uB098)", "(Me)")}` : partnerName;
  const guestLabel = myRole === "guest" ? `${userName} ${tl("(\uB098)", "(Me)")}` : partnerName;
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: C.dark,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, "\u2190 ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600 } }, tl("\uACB0\uACFC", "Result"))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" } }, "\u{1F495} ", tl("\uCEE4\uD50C \uBD84\uC11D \uB9AC\uD3EC\uD2B8", "Couple Analysis Report"), " ", hasDsi && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: "#5A8A7A", color: "white", borderRadius: 6, padding: "2px 7px", fontWeight: 700, marginLeft: 4 } }, tl("\uC790\uC544\uBD84\uD654 \uD3EC\uD568", "Incl. Differentiation"))), /* @__PURE__ */ React.createElement("div", { style: { width: 60 } })), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    marginBottom: 20,
    background: "white"
  } }, /* @__PURE__ */ React.createElement("div", { style: { height: 200, position: "relative" } }, /* @__PURE__ */ React.createElement(HeartIllust, { score }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 12,
    left: 16,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    padding: "5px 14px",
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    color: C.dark
  } }, hostLabel, " \u{1F495} ", guestLabel)), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 20px" } }, generating ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, animation: "heartbeat 1s infinite" } }, "\u{1F495}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: C.muted, marginTop: 12 } }, tl("AI\uAC00 \uB450 \uC0AC\uB78C\uC758 \uAD81\uD569\uC744 \uBD84\uC11D\uD558\uB294 \uC911...", "AI is analyzing your compatibility..."))) : score > 0 ? /* @__PURE__ */ React.createElement(ScoreGauge, { score }) : null)), error && /* @__PURE__ */ React.createElement("div", { style: {
    padding: 16,
    borderRadius: 12,
    background: "#FFF0F0",
    border: "1px solid #FFD0D0",
    color: "#D05555",
    fontSize: 14,
    marginBottom: 16
  } }, error), report ? /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    padding: "24px 20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    color: C.dark,
    lineHeight: 2,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all"
  } }, report)) : !generating && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px 0" } }, /* @__PURE__ */ React.createElement("button", { onClick: generateReport, style: {
    padding: "14px 32px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: `0 8px 24px ${C.rose}44`
  } }, "\u{1F495} ", tl("\uCEE4\uD50C \uB9AC\uD3EC\uD2B8 \uC0DD\uC131\uD558\uAE30", "Generate Couple Report"))), report && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px 20px",
    borderRadius: 16,
    marginBottom: 12,
    background: "white",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: `1px solid ${C.roseL}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 } }, "\u{1F4E4} ", tl("\uB9AC\uD3EC\uD2B8 \uACF5\uC720\uD558\uAE30", "Share Report")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const text = `${SERVICE_ICON} ${SERVICE_NAME} ${tl("\uBD84\uC11D \uACB0\uACFC", "Analysis Result")}

${tl("\uAD81\uD569 \uC810\uC218", "Compatibility Score")}: ${score}${tl("\uC810", "")} (${scoreLabel(score)})

${report.slice(0, 200)}...

${COUPLE_URL}`;
    navigator.share ? navigator.share({ title: `${SERVICE_NAME} ${tl("\uBD84\uC11D \uACB0\uACFC", "Analysis Result")}`, text }) : navigator.clipboard?.writeText(text);
  }, style: {
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: `1px solid ${C.roseL}44`,
    background: C.rosePale,
    color: C.rose,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4CB} ", tl("\uACB0\uACFC \uBCF5\uC0AC", "Copy Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const el = document.createElement("a");
    el.href = "data:text/plain;charset=utf-8," + encodeURIComponent(`${SERVICE_NAME} ${tl("\uBD84\uC11D \uB9AC\uD3EC\uD2B8", "Analysis Report")}
${tl("\uAD81\uD569", "Compatibility")}: ${score}${tl("\uC810", "")}

${report}`);
    el.download = `couple_report_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.txt`;
    el.click();
  }, style: {
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: `1px solid ${C.lavL}44`,
    background: C.lavPale,
    color: C.lavender,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4BE} ", tl("\uD14D\uC2A4\uD2B8 \uC800\uC7A5", "Save as Text")))), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "20px",
    borderRadius: 16,
    background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
    border: `1px solid ${C.roseL}33`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 } }, "\u{1F4AC} ", tl("\uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uB354 \uAE4A\uC774 \uB098\uB220\uBCF4\uC138\uC694", "Explore Deeper with a Professional Counselor")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.7 } }, tl("AI \uBD84\uC11D \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uCEE4\uD50C\xB7\uBD80\uBD80 \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 1:1 \uC2EC\uCE35 \uC0C1\uB2F4\uC744 \uBC1B\uC544\uBCF4\uC138\uC694.", "Based on the AI analysis results, get one-on-one in-depth counseling with a couple/marriage specialist."), tl(" \uC790\uC544\uBD84\uD654 \uD5A5\uC0C1 \uD504\uB85C\uADF8\uB7A8, Bowen \uAC00\uC871\uCE58\uB8CC \uAE30\uBC95 \uB4F1 \uC804\uBB38\uC801\uC778 \uC9C0\uC6D0\uC744 \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", " Professional support including differentiation improvement programs and Bowen family therapy techniques is available.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("a", { href: `${MAUMFUL_URL}/#counseling?type=couple&score=${score}`, style: {
    display: "block",
    padding: "12px 20px",
    textAlign: "center",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: `0 6px 20px ${C.rose}44`
  } }, tl("\uCEE4\uD50C \uC804\uBB38 \uC0C1\uB2F4\uC0AC \uC608\uC57D\uD558\uAE30 \u2192", "Book a Couple Counselor \u2192")), hasDsi && /* @__PURE__ */ React.createElement("a", { href: `${MAUMFUL_URL}/#counseling?type=bowen&score=${score}`, style: {
    display: "block",
    padding: "10px 20px",
    textAlign: "center",
    background: "white",
    border: "1.5px solid #5A8A7A44",
    color: "#5A8A7A",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1FA9E} ", tl("\uC790\uC544\uBD84\uD654 \uC804\uBB38 \uC0C1\uB2F4\uC0AC \uC608\uC57D\uD558\uAE30 \u2192", "Book a Differentiation Counselor \u2192")))))));
}
function SessionWaitingView({ session, myRole, onRefresh, onReport, onCancel }) {
  const [polling, setPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [notifyBanner, setNotifyBanner] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const code = session?.session_code || "";
  const isHostDone = !!session?.host_result_json;
  const isGuestDone = !!session?.guest_result_json;
  const bothDone = session?.status === "both_done" || isHostDone && isGuestDone;
  const prevRef = React.useRef({ isHostDone: false, isGuestDone: false, bothDone: false });
  const [pushActive, setPushActive] = useState(false);
  useEffect(() => {
    if (myRole !== "host" || bothDone) return;
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
        if (perm !== "granted") return;
        const vapidRes = await fetch("/api/couple/vapid-key", { headers: api._h() });
        const { key } = await vapidRes.json();
        if (!key) return;
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: Uint8Array.from(atob(key.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
        });
        const { endpoint, keys } = sub.toJSON();
        await fetch("/api/couple/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...api._h() },
          body: JSON.stringify({ endpoint, p256dh: keys?.p256dh, auth: keys?.auth })
        });
        setPushActive(true);
      } catch {
      }
    })();
  }, [myRole, bothDone]);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    const prev = prevRef.current;
    if (!prev.bothDone && bothDone) {
      fireBrowserNotif(tl("\u{1F495} \uB450 \uBD84 \uBAA8\uB450 \uC900\uBE44 \uC644\uB8CC!", "\u{1F495} Both Ready!"), tl("\uCEE4\uD50C \uB9AC\uD3EC\uD2B8\uB97C \uC0DD\uC131\uD560 \uC218 \uC788\uC5B4\uC694.", "You can now generate the couple report."));
      setNotifyBanner(tl("\u{1F389} \uD30C\uD2B8\uB108\uB3C4 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD588\uC5B4\uC694! \uC544\uB798\uC5D0\uC11C \uB9AC\uD3EC\uD2B8\uB97C \uC0DD\uC131\uD574\uBCF4\uC138\uC694.", "\u{1F389} Your partner has also completed the test! Generate the report below."));
    } else if (!prev.isGuestDone && isGuestDone && myRole === "host") {
      fireBrowserNotif(tl("\u{1F495} \uD30C\uD2B8\uB108\uAC00 \uCC38\uC5EC\uD588\uC5B4\uC694!", "\u{1F495} Your partner joined!"), tl("\uD30C\uD2B8\uB108\uAC00 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4.", "Your partner completed the test."));
      setNotifyBanner(tl("\u{1F495} \uD30C\uD2B8\uB108\uAC00 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD588\uC5B4\uC694!", "\u{1F495} Your partner completed the test!"));
    } else if (!prev.isHostDone && isHostDone && myRole === "guest") {
      fireBrowserNotif(tl("\u{1F495} \uD30C\uD2B8\uB108\uAC00 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD588\uC5B4\uC694!", "\u{1F495} Your partner completed the test!"), tl("\uC774\uC81C \uB9AC\uD3EC\uD2B8\uB97C \uC0DD\uC131\uD560 \uC218 \uC788\uC5B4\uC694.", "You can now generate the report."));
      setNotifyBanner(tl("\u{1F495} \uD30C\uD2B8\uB108\uAC00 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD588\uC5B4\uC694!", "\u{1F495} Your partner completed the test!"));
    }
    prevRef.current = { isHostDone, isGuestDone, bothDone };
  }, [isHostDone, isGuestDone, bothDone]);
  function fireBrowserNotif(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/favicon.ico" });
      } catch {
      }
    }
  }
  async function sendInviteEmail() {
    if (!emailInput || emailSending) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await api.post("/api/couple/invite-email", { email: emailInput, session_code: code });
      setEmailResult(res.success ? "ok" : "err");
      if (res.success) setEmailInput("");
    } catch {
      setEmailResult("err");
    } finally {
      setEmailSending(false);
    }
  }
  function copyCode() {
    const msg = `${SERVICE_NAME} ${tl("\uCD08\uB300\uCF54\uB4DC", "Invite Code")}: ${code}
${tl("\uD568\uAED8 \uC2EC\uB9AC \uBD84\uC11D\uD574\uBD10\uC694", "Let's do a psychological analysis together")} ${SERVICE_ICON}
${COUPLE_URL}/?code=${code}`;
    navigator.clipboard?.writeText(msg).catch(() => {
    });
  }
  function copyPartnerLink() {
    navigator.clipboard?.writeText(`${MAUMFUL_URL}?partner=${code}`).catch(() => {
    });
  }
  const pollInterval = (isHostDone || isGuestDone) && !bothDone ? 1e4 : 3e4;
  useEffect(() => {
    const timer = setInterval(async () => {
      setPolling(true);
      await onRefresh();
      setLastChecked(/* @__PURE__ */ new Date());
      setPolling(false);
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval]);
  async function handleManualRefresh() {
    if (polling) return;
    setPolling(true);
    await onRefresh();
    setLastChecked(/* @__PURE__ */ new Date());
    setPolling(false);
  }
  const isExpired = session?.expires_at && new Date(session.expires_at) < /* @__PURE__ */ new Date();
  if (isExpired) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 20,
      padding: "32px 20px",
      textAlign: "center",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      marginBottom: 20
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u23F0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 } }, tl("\uC138\uC158\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4", "Session Expired")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, marginBottom: 20 } }, tl("72\uC2DC\uAC04\uC774 \uC9C0\uB098 \uC138\uC158\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0C8 \uC138\uC158\uC744 \uB9CC\uB4E4\uC5B4 \uB2E4\uC2DC \uC2DC\uC791\uD574\uBCF4\uC138\uC694.", "72 hours have passed and the session has expired. Please create a new session to start again.")));
  }
  const lastCheckedText = lastChecked ? `${lastChecked.getHours().toString().padStart(2, "0")}:${lastChecked.getMinutes().toString().padStart(2, "0")}:${lastChecked.getSeconds().toString().padStart(2, "0")} ${tl("\uD655\uC778\uB428", "checked")}` : "";
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement("div", { style: { height: 180 } }, bothDone ? /* @__PURE__ */ React.createElement(HeartIllust, { score: 75 }) : /* @__PURE__ */ React.createElement(WaitingIllust, null)), notifyBanner && /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${C.rose}22, ${C.roseL}33)`,
    borderBottom: `1px solid ${C.rose}33`,
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.rose, fontWeight: 600 } }, notifyBanner), /* @__PURE__ */ React.createElement("button", { onClick: () => setNotifyBanner(null), style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: C.muted,
    padding: "0 4px"
  } }, "\xD7")), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 20px 24px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 } }, bothDone ? tl("\u{1F389} \uB450 \uC0AC\uB78C \uBAA8\uB450 \uC900\uBE44 \uC644\uB8CC!", "\u{1F389} Both Ready!") : tl("\uD30C\uD2B8\uB108\uB97C \uAE30\uB2E4\uB9AC\uB294 \uC911", "Waiting for Partner")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 } }, bothDone ? tl("\uC774\uC81C \uCEE4\uD50C \uBD84\uC11D \uB9AC\uD3EC\uD2B8\uB97C \uC0DD\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "You can now generate the couple analysis report.") : tl("\uD30C\uD2B8\uB108 \uB9C1\uD06C\uB97C \uACF5\uC720\uD558\uC138\uC694. \uD30C\uD2B8\uB108\uB294 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uAC80\uC0AC\uC5D0 \uCC38\uC5EC\uD560 \uC218 \uC788\uC5B4\uC694.", "Share the partner link. Your partner can join the test right away without logging in.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 20 } }, [
    { label: myRole === "host" ? tl("\uB098 (host)", "Me (host)") : tl("\uD30C\uD2B8\uB108 A", "Partner A"), done: isHostDone },
    { label: myRole === "guest" ? tl("\uB098 (guest)", "Me (guest)") : tl("\uD30C\uD2B8\uB108 B", "Partner B"), done: isGuestDone }
  ].map(({ label, done }, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    textAlign: "center",
    background: done ? C.rosePale : "#F5F5F5",
    border: `1px solid ${done ? C.roseL + "44" : "#E0E0E0"}`,
    transition: "all 0.3s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18 } }, done ? "\u2705" : "\u23F3"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: done ? C.rose : C.muted, marginTop: 4, fontWeight: 600 } }, label)))), !bothDone && /* @__PURE__ */ React.createElement("div", { style: {
    background: C.rosePale,
    borderRadius: 14,
    padding: "16px",
    border: `1px solid ${C.roseL}33`,
    marginBottom: 16
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, tl("\uD30C\uD2B8\uB108\uC5D0\uAC8C \uACF5\uC720\uD560 \uCD08\uB300\uCF54\uB4DC", "Invite Code to Share with Partner")), myRole === "host" && pushActive && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#10B981", fontWeight: 600, background: "#D1FAE5", padding: "2px 8px", borderRadius: 100 } }, "\u{1F514} ", tl("\uC54C\uB9BC \uCF1C\uC9D0", "Notifications On"))), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 8,
    color: C.rose,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 12
  } }, code), /* @__PURE__ */ React.createElement("button", { onClick: copyPartnerLink, style: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: C.rose,
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F517} ", tl("\uD30C\uD2B8\uB108 \uAC80\uC0AC \uB9C1\uD06C \uBCF5\uC0AC (\uB85C\uADF8\uC778 \uBD88\uD544\uC694)", "Copy Partner Test Link (No Login Required)")), /* @__PURE__ */ React.createElement("button", { onClick: copyCode, style: {
    width: "100%",
    padding: "8px",
    borderRadius: 10,
    marginTop: 8,
    border: `1px solid ${C.rose}44`,
    cursor: "pointer",
    background: "white",
    color: C.rose,
    fontWeight: 600,
    fontSize: 12,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, "\u{1F4CB} ", SERVICE_NAME, " ", tl("\uCF54\uB4DC \uBCF5\uC0AC (\uACC4\uC815 \uC788\uB294 \uD30C\uD2B8\uB108)", "Copy Code (for users with account)")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, borderTop: `1px solid ${C.rose}22`, paddingTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginBottom: 6 } }, tl("\uB610\uB294 \uC774\uBA54\uC77C\uB85C \uC9C1\uC811 \uCD08\uB300", "Or invite directly by email")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      value: emailInput,
      onChange: (e) => {
        setEmailInput(e.target.value);
        setEmailResult(null);
      },
      onKeyDown: (e) => e.key === "Enter" && sendInviteEmail(),
      placeholder: tl("\uD30C\uD2B8\uB108 \uC774\uBA54\uC77C \uC8FC\uC18C", "Partner's email address"),
      style: {
        flex: 1,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${C.rose}44`,
        fontSize: 12,
        fontFamily: "'Noto Sans KR', sans-serif",
        outline: "none",
        background: "white"
      }
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: sendInviteEmail, disabled: !emailInput || emailSending, style: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: !emailInput || emailSending ? "#E0D0D0" : C.rose,
    color: "white",
    fontWeight: 700,
    fontSize: 12,
    cursor: !emailInput || emailSending ? "not-allowed" : "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
    whiteSpace: "nowrap"
  } }, emailSending ? "..." : `\u{1F4E8} ${tl("\uC804\uC1A1", "Send")}`)), emailResult === "ok" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#4A9A5A", marginTop: 5, fontWeight: 600 } }, tl("\u2713 \uCD08\uB300 \uC774\uBA54\uC77C\uC744 \uBC1C\uC1A1\uD588\uC5B4\uC694!", "\u2713 Invite email sent!")), emailResult === "err" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#D4634A", marginTop: 5 } }, tl("\uC774\uBA54\uC77C \uBC1C\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "Failed to send email. Please try again.")))), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, polling ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: C.rose,
    animation: "pulse 1s infinite"
  } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.rose } }, tl("\uD30C\uD2B8\uB108 \uC0C1\uD0DC \uD655\uC778 \uC911...", "Checking partner status..."))) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.muted } }, lastCheckedText)), /* @__PURE__ */ React.createElement("button", { onClick: handleManualRefresh, disabled: polling, style: {
    padding: "4px 10px",
    borderRadius: 8,
    border: `1px solid ${C.roseL}44`,
    background: "white",
    color: polling ? C.muted : C.rose,
    fontSize: 11,
    fontWeight: 600,
    cursor: polling ? "not-allowed" : "pointer",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, polling ? "..." : `\u21BB ${tl("\uC9C0\uAE08 \uD655\uC778", "Refresh Now")}`)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 12 } }, "\u23F0 ", tl("\uC138\uC158 \uB9CC\uB8CC", "Session Expires"), ": ", fmtDate(session?.expires_at)), myRole === "host" && !bothDone && /* @__PURE__ */ React.createElement("button", { onClick: onCancel, style: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: `1px solid #E0D0D0`,
    background: "white",
    color: "#A07070",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    marginBottom: 8,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, tl("\uC138\uC158 \uCDE8\uC18C\uD558\uAE30", "Cancel Session")), bothDone && /* @__PURE__ */ React.createElement("button", { onClick: onReport, style: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    fontFamily: "'Noto Sans KR', sans-serif",
    boxShadow: `0 8px 24px ${C.rose}44`
  } }, "\u{1F495} ", tl("\uCEE4\uD50C \uB9AC\uD3EC\uD2B8 \uBCF4\uAE30", "View Couple Report"))));
}
function CoupleHubApp() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("hub");
  const [sessionData, setSession] = useState(null);
  const [partnerName, setPartner] = useState(tl("\uD30C\uD2B8\uB108", "Partner"));
  const [myRole, setMyRole] = useState("host");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [creditModal, setCredit] = useState(null);
  const [toast, setToast] = useState("");
  const isLoggedIn = !!localStorage.getItem(TOKEN_KEY);
  const loadMe = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/couple/me");
      if (res.success) {
        setData(res.data);
        if (res.data.activeSession) {
          setSession(res.data.activeSession);
          setMyRole(res.data.activeSession.host_user_id === res.data.user.id ? "host" : "guest");
        }
      } else setError(res.error || tl("\uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328", "Failed to load data"));
    } catch {
      setError(tl("\uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328", "Server connection failed"));
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);
  useEffect(() => {
    loadMe();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam && isLoggedIn) {
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());
        handleJoin(codeParam);
      }, 800);
    }
  }, []);
  const toastTimerRef = React.useRef(null);
  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(""), 3e3);
  }
  async function handleCreateSession(testType = "BIG5+LOST") {
    setCreating(true);
    try {
      const res = await api.post("/api/couple/session", { test_type: testType });
      if (res.success) {
        setSession(res.data.session);
        setMyRole("host");
        setCredit(null);
        showToast(res.data.isExisting ? tl("\uAE30\uC874 \uC138\uC158\uC744 \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4.", "Existing session restored.") : tl("\uC138\uC158\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4!", "Session created!"));
        if (!res.data.isExisting) refreshCredits();
      } else if (res.needsCharge) {
        setCredit({ message: res.error, balance: data?.user?.credits });
      } else {
        showToast(res.error || tl("\uC0DD\uC131 \uC2E4\uD328", "Failed to create"));
      }
    } catch {
      showToast(tl("\uC11C\uBC84 \uC624\uB958", "Server error"));
    } finally {
      setCreating(false);
    }
  }
  async function handleJoin(code) {
    setJoining(true);
    try {
      const res = await api.post("/api/couple/join", { code });
      if (res.success) {
        setSession(res.data.session);
        setMyRole("guest");
        showToast(tl("\uC138\uC158\uC5D0 \uCC38\uC5EC\uD588\uC2B5\uB2C8\uB2E4! \u{1F495}", "Joined the session! \u{1F495}"));
        const s = await api.get(`/api/couple/session/${res.data.session.session_code}`);
        if (s.success) setPartner(s.data.partnerName);
      } else {
        return { success: false, error: res.error };
      }
    } catch {
      return { success: false, error: tl("\uC11C\uBC84 \uC624\uB958", "Server error") };
    } finally {
      setJoining(false);
    }
    return { success: true };
  }
  async function refreshSession() {
    if (!sessionData?.session_code) return;
    const res = await api.get(`/api/couple/session/${sessionData.session_code}`);
    if (res.success) {
      setSession(res.data.session);
      setPartner(res.data.partnerName);
    }
  }
  async function handleCancelSession() {
    if (!sessionData?.session_code) return;
    if (!window.confirm(tl("\uC138\uC158\uC744 \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uD06C\uB808\uB527\uC740 \uD658\uBD88\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Cancel this session? Credits will not be refunded."))) return;
    try {
      const res = await api.patch(`/api/couple/session/${sessionData.session_code}/cancel`);
      if (res.success) {
        setSession(null);
        showToast(tl("\uC138\uC158\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "Session cancelled."));
        const cr = await api.get("/api/couple/credits");
        if (cr.success) setData((prev) => prev ? { ...prev, user: { ...prev.user, credits: cr.data.balance } } : prev);
      } else {
        showToast(res.error || tl("\uCDE8\uC18C \uC2E4\uD328", "Failed to cancel"));
      }
    } catch {
      showToast(tl("\uC11C\uBC84 \uC624\uB958", "Server error"));
    }
  }
  async function refreshCredits() {
    try {
      const res = await api.get("/api/couple/credits");
      if (res.success) setData((prev) => prev ? { ...prev, user: { ...prev.user, credits: res.data.balance } } : prev);
    } catch {
    }
  }
  if (!isLoggedIn) return /* @__PURE__ */ React.createElement(LoginGate, null);
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, animation: "heartbeat 1.5s ease-in-out infinite" } }, SERVICE_ICON), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: C.muted, marginTop: 16, animation: "pulse 1.5s infinite" } }, LOADING_TEXT));
  if (view === "miniTest") {
    return /* @__PURE__ */ React.createElement(MiniLoveTestView, { onBack: () => setView("hub") });
  }
  if (view === "checkin") {
    return /* @__PURE__ */ React.createElement(
      RelationshipCheckinView,
      {
        onBack: () => setView("hub"),
        onDone: () => loadMe()
      }
    );
  }
  if (view === "dateCourse") {
    return /* @__PURE__ */ React.createElement(
      DateCourseView,
      {
        credits: data?.user?.credits ?? 0,
        isMaster: data?.isMaster,
        onBack: () => setView("hub")
      }
    );
  }
  if (view === "soloAnalysis") {
    return /* @__PURE__ */ React.createElement(
      SoloAnalysisView,
      {
        testResults: data?.testResults,
        userName: displayName(data?.user),
        credits: data?.user?.credits ?? 0,
        isMaster: data?.isMaster,
        onBack: () => setView("hub")
      }
    );
  }
  if (view === "coach") {
    return /* @__PURE__ */ React.createElement(
      RelationshipCoachView,
      {
        userName: displayName(data?.user),
        credits: data?.user?.credits ?? 0,
        isMaster: data?.isMaster,
        onBack: () => setView("hub")
      }
    );
  }
  if (view === "quiz") {
    return /* @__PURE__ */ React.createElement(CoupleQuizView, { onBack: () => setView("hub") });
  }
  if (view === "anniversary") {
    return /* @__PURE__ */ React.createElement(AnniversaryView, { onBack: () => setView("hub") });
  }
  if (view === "timeline") {
    return /* @__PURE__ */ React.createElement(RelationshipTimelineView, { onBack: () => setView("hub") });
  }
  if (view === "big5Compare") {
    const { testResults: testResults2 } = data || {};
    const myBig5 = testResults2?.big5?.data;
    let partnerBig5 = null;
    try {
      const raw = myRole === "host" ? sessionData?.guest_result_json : sessionData?.host_result_json;
      if (raw) partnerBig5 = JSON.parse(raw).big5;
    } catch {
    }
    return /* @__PURE__ */ React.createElement(
      Big5CompareView,
      {
        myBig5,
        partnerBig5,
        myName: displayName(data?.user),
        partnerName,
        onBack: () => setView("hub")
      }
    );
  }
  if (view === "report" && sessionData) {
    return /* @__PURE__ */ React.createElement(
      CoupleReportView,
      {
        session: sessionData,
        myRole,
        partnerName,
        userName: displayName(data?.user),
        onBack: () => setView("hub")
      }
    );
  }
  if (error) return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: C.cream,
    padding: 24,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F327}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: C.muted, marginBottom: 20 } }, error), /* @__PURE__ */ React.createElement("a", { href: MAUMFUL_URL, style: {
    padding: "10px 24px",
    background: C.rose,
    color: "white",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, tl(`${MAIN_SERVICE_NAME}\uB85C \uB3CC\uC544\uAC00\uAE30`, `Back to ${MAIN_SERVICE_NAME}`)));
  const { user, testResults, recentReports, isMaster } = data || {};
  const hasActive = !!sessionData;
  const hasBig5 = !!testResults?.big5;
  const hasLost = !!testResults?.lost;
  const hasDsiTest = !!testResults?.dsi;
  const hasAny = hasBig5 || hasLost || hasDsiTest;
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` } }, /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(181,85,106,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, SERVICE_ICON), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" } }, SERVICE_NAME)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    fontWeight: 600,
    color: C.rose,
    background: C.rosePale,
    padding: "4px 12px",
    borderRadius: 100,
    border: `1px solid ${C.roseL}44`
  } }, "\u2726 ", user?.credits ?? 0, " ", tl("\uD06C\uB808\uB527", "credits")), /* @__PURE__ */ React.createElement("a", { href: MAUMFUL_URL, style: {
    fontSize: 12,
    color: C.muted,
    textDecoration: "none",
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.6)"
  } }, BACK_LABEL))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto", padding: "24px 20px 40px" } }, (() => {
    const myBig5Data = testResults?.big5?.data;
    const myPersonality = getPersonalityLabel(myBig5Data);
    return /* @__PURE__ */ React.createElement("div", { style: {
      borderRadius: 20,
      padding: "20px",
      marginBottom: 20,
      background: "white",
      boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: C.dark } }, tl(`\uC548\uB155\uD558\uC138\uC694, ${displayName(user)}\uB2D8 \u{1F44B}`, `Hello, ${displayName(user)} \u{1F44B}`), isMaster && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: C.rose, color: "white", borderRadius: 6, padding: "2px 8px", fontWeight: 700, marginLeft: 6 } }, "MASTER")), myPersonality && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: 100,
      background: C.rosePale,
      color: C.rose,
      border: `1px solid ${C.roseL}44`,
      whiteSpace: "nowrap"
    } }, myPersonality.emoji, " ", myPersonality.name)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 14 } }, tl("\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB85C \uD30C\uD2B8\uB108\uC640\uC758 \uAD00\uACC4 \uD328\uD134\uC744 \uD568\uAED8 \uD0D0\uC0C9\uD574\uBCF4\uC138\uC694.", "Explore your relationship patterns together using psychological test results.")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("miniTest"), style: {
      padding: "10px 8px",
      borderRadius: 12,
      border: `1px solid ${C.roseL}33`,
      cursor: "pointer",
      background: C.rosePale,
      color: C.rose,
      fontWeight: 700,
      fontSize: 12,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F49D} \uC5F0\uC560 \uC720\uD615 \uD14C\uC2A4\uD2B8", "\u{1F49D} Love Type Test"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("\uBB34\uB8CC", "Free"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("dateCourse"), style: {
      padding: "10px 8px",
      borderRadius: 12,
      border: `1px solid ${C.roseL}33`,
      cursor: "pointer",
      background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
      color: C.rose,
      fontWeight: 700,
      fontSize: 12,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F5FA}\uFE0F \uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "\u{1F5FA}\uFE0F Date Idea Planner"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, "3cr")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("checkin"), style: {
      padding: "10px 8px",
      borderRadius: 12,
      border: "1px solid #4A9A5A33",
      cursor: "pointer",
      background: "#EAF5EC",
      color: "#4A9A5A",
      fontWeight: 700,
      fontSize: 12,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F331} \uAD00\uACC4 \uC131\uC7A5 \uCCB4\uD06C\uC778", "\u{1F331} Relationship Check-in"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("\uBB34\uB8CC \xB7 \uC6D4 1\uD68C", "Free \xB7 Monthly"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("soloAnalysis"), style: {
      padding: "10px 8px",
      borderRadius: 12,
      border: `1px solid ${C.lavL}33`,
      cursor: "pointer",
      background: C.lavPale,
      color: C.lavender,
      fontWeight: 700,
      fontSize: 12,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F52E} \uC774\uC0C1\uD615 \uC131\uD5A5 \uBD84\uC11D", "\u{1F52E} Ideal Type Analysis"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, "5cr"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("coach"), style: {
      padding: "10px 6px",
      borderRadius: 12,
      border: `1px solid ${C.amberL}55`,
      cursor: "pointer",
      background: `linear-gradient(135deg, #FFF8EE, #FEF3E2)`,
      color: C.amber,
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F91D} AI \uAD00\uACC4 \uCF54\uCE58", "\u{1F91D} AI Relationship Coach"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("3\uD68C \uBB34\uB8CC", "3 free"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("quiz"), style: {
      padding: "10px 6px",
      borderRadius: 12,
      border: `1px solid ${C.amberL}55`,
      cursor: "pointer",
      background: `linear-gradient(135deg, #FFFBF0, #FEF9E5)`,
      color: C.amber,
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F49B} \uCEE4\uD50C \uC2A4\uD0C0\uC77C \uD034\uC988", "\u{1F49B} Couple Style Quiz"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("\uBB34\uB8CC", "Free"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("anniversary"), style: {
      padding: "10px 6px",
      borderRadius: 12,
      border: `1px solid ${C.roseL}55`,
      cursor: "pointer",
      background: `linear-gradient(135deg, ${C.rosePale}, #FFF5F8)`,
      color: C.rose,
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F5D3}\uFE0F \uAE30\uB150\uC77C \uACC4\uC0B0\uAE30", "\u{1F5D3}\uFE0F Anniversary Calculator"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("\uBB34\uB8CC", "Free"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("timeline"), style: {
      padding: "10px 6px",
      borderRadius: 12,
      border: "1px solid #e0e7ff55",
      cursor: "pointer",
      background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
      color: "#4f46e5",
      fontWeight: 700,
      fontSize: 11,
      fontFamily: "'Noto Sans KR', sans-serif",
      lineHeight: 1.4,
      textAlign: "center"
    } }, tl("\u{1F5C2}\uFE0F \uAD00\uACC4 \uD0C0\uC784\uB77C\uC778", "\u{1F5C2}\uFE0F Relationship Timeline"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400, color: C.muted } }, tl("\uBB34\uB8CC", "Free")))), (() => {
      let hasPartnerBig5 = false;
      try {
        const raw = myRole === "host" ? sessionData?.guest_result_json : sessionData?.host_result_json;
        if (raw) hasPartnerBig5 = !!JSON.parse(raw).big5;
      } catch {
      }
      const canCompare = !!testResults?.big5 && hasPartnerBig5;
      return /* @__PURE__ */ React.createElement("button", { onClick: () => {
        if (!testResults?.big5) {
          alert(tl(`${MAIN_SERVICE_NAME}\uC5D0\uC11C BIG5 \uAC80\uC0AC\uB97C \uBA3C\uC800 \uC644\uB8CC\uD574 \uC8FC\uC138\uC694.`, `Please complete the BIG5 test on ${MAIN_SERVICE_NAME} first.`));
          return;
        }
        if (!hasPartnerBig5) {
          alert(tl("\uD30C\uD2B8\uB108\uB3C4 BIG5 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD574\uC57C \uBE44\uAD50\uD560 \uC218 \uC788\uC5B4\uC694.", "Your partner also needs to complete the BIG5 test to compare."));
          return;
        }
        setView("big5Compare");
      }, style: {
        width: "100%",
        padding: "11px",
        borderRadius: 12,
        cursor: "pointer",
        border: canCompare ? `1.5px solid ${C.rose}55` : "1px solid #e0e0e0",
        background: canCompare ? `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})` : "#f8f8f8",
        color: canCompare ? C.rose : C.muted,
        fontWeight: 700,
        fontSize: 12,
        fontFamily: "'Noto Sans KR', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 8
      } }, "\u{1F9EC} ", tl("BIG5 \uCEE4\uD50C \uBE44\uAD50", "BIG5 Couple Comparison"), canCompare ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400 } }, tl("\uACB0\uACFC \uC900\uBE44 \uC644\uB8CC \u2713", "Results ready \u2713")) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 400 } }, tl("\uD30C\uD2B8\uB108 \uACB0\uACFC \uD544\uC694", "Partner results needed")));
    })());
  })(), /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 } }, "\u{1F4CB} ", tl("\uB0B4 \uAC80\uC0AC \uACB0\uACFC", "My Test Results")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 6 } }, "\u{1F491} ", tl("\uCEE4\uD50C \uD0D0\uC0C9", "Couple Exploration")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(TestResultBadge, { type: "BIG5", result: testResults?.big5, date: testResults?.big5?.performed_at }), /* @__PURE__ */ React.createElement(TestResultBadge, { type: "LOST", result: testResults?.lost, date: testResults?.lost?.performed_at }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#5A8A7A", marginBottom: 6 } }, "\u{1F468}\u200D\u{1F469}\u200D\u{1F467} ", tl("\uAD00\uACC4 \uC2EC\uCE35 \uBD84\uC11D", "Deep Relationship Analysis")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(TestResultBadge, { type: "DSI", result: testResults?.dsi, date: testResults?.dsi?.performed_at }))), !hasAny ? /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px",
    borderRadius: 14,
    background: "#FFF8F0",
    border: "1px solid #FFD8A0",
    fontSize: 13,
    color: "#A07040"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 8 } }, "\u{1F4A1} ", tl("\uAC80\uC0AC\uB97C \uBA3C\uC800 \uC644\uB8CC\uD574\uC8FC\uC138\uC694", "Please complete a test first")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 2 } }, "\u{1F491} ", tl("\uCEE4\uD50C \uD0D0\uC0C9", "Couple Exploration")), [
    { key: "BIG5", emoji: "\u{1F9EC}", label: tl("BIG5 \uC131\uACA9\uAC80\uC0AC", "BIG5 Personality Test"), desc: tl("\uC131\uACA9 5\uC694\uC778 \u2014 \uCEE4\uD50C \uAD81\uD569 \uD575\uC2EC", "Big Five factors \u2014 core compatibility") },
    { key: "LOST", emoji: "\u2699\uFE0F", label: tl("LOST \uD589\uB3D9\uC720\uD615", "LOST Behavior Type"), desc: tl("\uC758\uC0AC\uACB0\uC815\xB7\uC5D0\uB108\uC9C0 \uC2A4\uD0C0\uC77C \uBE44\uAD50", "Decision-making & energy style comparison") }
  ].map((ti) => /* @__PURE__ */ React.createElement("a", { key: ti.key, href: `${MAUMFUL_URL}?start=${ti.key}`, style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "white",
    border: "1px solid #FFD8A0",
    textDecoration: "none",
    color: C.dark
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, ti.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700 } }, ti.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, ti.desc)), /* @__PURE__ */ React.createElement("span", { style: { color: C.rose, fontSize: 12, fontWeight: 700 } }, tl("\uC2DC\uC791 \u2192", "Start \u2192")))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#5A8A7A", marginTop: 8, marginBottom: 2 } }, "\u{1F468}\u200D\u{1F469}\u200D\u{1F467} ", tl("\uAD00\uACC4 \uC2EC\uCE35 \uBD84\uC11D", "Deep Relationship Analysis")), [
    { key: "DSI", emoji: "\u{1FA9E}", label: tl("SDRI \uC790\uC544\uBD84\uD654", "SDRI Self-Differentiation"), desc: tl("\uBD80\uBD80\xB7\uAC00\uC871 \uAD00\uACC4 \uC5B4\uB824\uC6C0 \u2014 Bowen \uC774\uB860 \uAE30\uBC18", "Couples & family relationship issues \u2014 based on Bowen theory") }
  ].map((ti) => /* @__PURE__ */ React.createElement("a", { key: ti.key, href: `${MAUMFUL_URL}?start=${ti.key}`, style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "white",
    border: "1px solid #B8D8D0",
    textDecoration: "none",
    color: C.dark
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, ti.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700 } }, ti.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, ti.desc)), /* @__PURE__ */ React.createElement("span", { style: { color: "#5A8A7A", fontSize: 12, fontWeight: 700 } }, tl("\uC2DC\uC791 \u2192", "Start \u2192"))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, tl(`${MAIN_SERVICE_NAME}\uC5D0\uC11C \uD558\uB098 \uC774\uC0C1 \uC644\uB8CC\uD558\uBA74 \uBC14\uB85C \uCEE4\uD50C \uBD84\uC11D\uC774 \uAC00\uB2A5\uD574\uC694.`, `Complete at least one test on ${MAIN_SERVICE_NAME} to start couple analysis.`))) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, marginBottom: 8 } }, tl("\u2713 \uCEE4\uD50C \uBD84\uC11D\uC5D0 \uC0AC\uC6A9\uD560 \uCD5C\uC2E0 \uACB0\uACFC\uAC00 \uC900\uBE44\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.", "\u2713 Latest results are ready for couple analysis."), testResults?.dsi && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, color: "#5A8A7A", fontWeight: 600 } }, tl("\uC790\uC544\uBD84\uD654 \uD3EC\uD568 \u2726", "Self-Diff. included \u2726"))), ["BIG5", "LOST", "DSI"].some((t) => !{ BIG5: testResults?.big5, LOST: testResults?.lost, DSI: testResults?.dsi }[t]) && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "#FFFBF0",
    border: "1px solid #FFE8A0",
    fontSize: 12,
    color: "#9A7030"
  } }, "\u{1F4A1} ", ["BIG5", "LOST", "DSI"].filter((t) => !{ BIG5: testResults?.big5, LOST: testResults?.lost, DSI: testResults?.dsi }[t]).map((t, i, arr) => /* @__PURE__ */ React.createElement(React.Fragment, { key: t }, /* @__PURE__ */ React.createElement("a", { href: `${MAUMFUL_URL}?start=${t}`, style: { color: C.rose, fontWeight: 700, textDecoration: "none" } }, t), i < arr.length - 1 && " + ")), " ", tl("\uAC80\uC0AC\uB3C4 \uC644\uB8CC\uD558\uBA74 \uB354 \uC815\uBC00\uD55C \uBD84\uC11D\uC774 \uAC00\uB2A5\uD574\uC694 \u2192", "test(s) will enable more precise analysis \u2192")))), hasActive ? /* @__PURE__ */ React.createElement(
    SessionWaitingView,
    {
      session: sessionData,
      myRole,
      onRefresh: refreshSession,
      onReport: () => setView("report"),
      onCancel: handleCancelSession
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 } }, "\u{1F491} ", tl("\uCEE4\uD50C \uBD84\uC11D \uC2DC\uC791\uD558\uAE30", "Start Couple Analysis")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 } }, tl("\uAC80\uC0AC \uC870\uD569\uC744 \uC120\uD0DD\uD574 \uC138\uC158\uC744 \uB9CC\uB4E4\uAC70\uB098, \uD30C\uD2B8\uB108\uAC00 \uBCF4\uB0B8 \uCF54\uB4DC\uB85C \uCC38\uC5EC\uD558\uC138\uC694.", "Choose a test combination to create a session, or join with a code from your partner.")), hasAny && (() => {
    const coupleOptions = [
      ...testResults?.big5 && testResults?.lost ? [
        {
          key: "BIG5+LOST",
          label: "BIG5 + LOST",
          badge: tl("\uCD94\uCC9C", "Recommended"),
          cost: COST_TWO,
          desc: tl("\uC131\uACA9\xB7\uD589\uB3D9\uC720\uD615 \uBE44\uAD50 \u2014 \uCEE4\uD50C \uC5B4\uC6B8\uB9BC \uD575\uC2EC", "Personality & behavior type comparison \u2014 compatibility core"),
          color: C.rose
        }
      ] : [],
      ...testResults?.big5 && !testResults?.lost ? [
        {
          key: "BIG5",
          label: tl("BIG5\uB9CC", "BIG5 only"),
          badge: null,
          cost: COST_ONE,
          desc: tl("\uC131\uACA9 5\uC694\uC778 \uBE44\uAD50", "Big Five personality comparison"),
          color: C.rose
        }
      ] : [],
      ...!testResults?.big5 && testResults?.lost ? [
        {
          key: "LOST",
          label: tl("LOST\uB9CC", "LOST only"),
          badge: null,
          cost: COST_ONE,
          desc: tl("\uC758\uC0AC\uACB0\uC815\xB7\uC5D0\uB108\uC9C0 \uC2A4\uD0C0\uC77C \uBE44\uAD50", "Decision-making & energy style comparison"),
          color: C.lavender
        }
      ] : []
    ];
    const deepOptions = !testResults?.dsi ? [] : [
      ...testResults?.big5 && testResults?.lost ? [
        {
          key: "BIG5+LOST+DSI",
          label: tl("BIG5 + LOST + \uC790\uC544\uBD84\uD654", "BIG5 + LOST + Self-Diff."),
          badge: tl("\uCD94\uCC9C", "Recommended"),
          cost: COST_FULL,
          desc: tl("\uC131\uACA9\xB7\uD589\uB3D9\uC720\uD615\xB7\uC790\uC544\uBD84\uD654 \uD1B5\uD569 \uBD84\uC11D (\uBD80\uBD80\uC0C1\uB2F4 \uCD5C\uC801)", "Integrated analysis of personality, behavior type & self-differentiation (best for couples)"),
          color: "#5A8A7A"
        }
      ] : [],
      ...testResults?.big5 && !testResults?.lost ? [
        {
          key: "BIG5+DSI",
          label: tl("BIG5 + \uC790\uC544\uBD84\uD654", "BIG5 + Self-Diff."),
          badge: tl("\uCD94\uCC9C", "Recommended"),
          cost: COST_TWO,
          desc: tl("\uC131\uACA9 \uD2B9\uC131\uACFC \uBD84\uD654 \uC218\uC900 \uBE44\uAD50", "Personality traits and differentiation level comparison"),
          color: "#5A8A7A"
        }
      ] : [],
      ...!testResults?.big5 && testResults?.lost ? [
        {
          key: "LOST+DSI",
          label: tl("LOST + \uC790\uC544\uBD84\uD654", "LOST + Self-Diff."),
          badge: tl("\uCD94\uCC9C", "Recommended"),
          cost: COST_TWO,
          desc: tl("\uD589\uB3D9\uC720\uD615\uACFC \uBD84\uD654 \uC218\uC900 \uBE44\uAD50", "Behavior type and differentiation level comparison"),
          color: "#5A8A7A"
        }
      ] : [],
      ...!testResults?.big5 && !testResults?.lost ? [
        {
          key: "DSI",
          label: tl("SDRI \uC790\uC544\uBD84\uD654\uB9CC", "SDRI Self-Diff. only"),
          badge: null,
          cost: COST_ONE,
          desc: tl("\uAD00\uACC4 \uBD84\uD654 \uC218\uC900 \uC9D1\uC911 \uBD84\uC11D", "Focused analysis on relationship differentiation level"),
          color: "#5A8A7A"
        }
      ] : []
    ];
    const renderOptions = (opts) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, opts.map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.key,
        onClick: () => handleCreateSession(opt.key),
        disabled: creating,
        style: {
          padding: "12px 16px",
          borderRadius: 12,
          border: `1.5px solid ${opt.color}33`,
          background: opt.badge ? `linear-gradient(135deg, ${opt.color}12, ${opt.color}06)` : "white",
          cursor: "pointer",
          textAlign: "left",
          opacity: creating ? 0.7 : 1
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, opt.label), opt.badge && /* @__PURE__ */ React.createElement("span", { style: {
        marginLeft: 6,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 100,
        background: opt.color,
        color: "white"
      } }, opt.badge), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 } }, opt.desc)), /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 12,
        fontWeight: 700,
        color: opt.color,
        whiteSpace: "nowrap",
        marginLeft: 12
      } }, isMaster ? tl("\uBB34\uB8CC", "Free") : `${opt.cost}cr`))
    )));
    return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, coupleOptions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 2 } }, "\u{1F491} ", tl("\uCEE4\uD50C \uD0D0\uC0C9", "Couple Exploration")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginBottom: 8 } }, tl("\uC131\uACA9\xB7\uD589\uB3D9\uC720\uD615\uC73C\uB85C \uC11C\uB85C\uB97C \uC54C\uC544\uAC00\uB294 \uAC00\uBCBC\uC6B4 \uBD84\uC11D", "A light analysis to understand each other through personality & behavior type")), renderOptions(coupleOptions)), deepOptions.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#5A8A7A", marginBottom: 2 } }, "\u{1F468}\u200D\u{1F469}\u200D\u{1F467} ", tl("\uAD00\uACC4 \uC2EC\uCE35 \uBD84\uC11D", "Deep Relationship Analysis")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginBottom: 8 } }, tl("\uC790\uC544\uBD84\uD654 \uAE30\uBC18 \xB7 \uBD80\uBD80\xB7\uAC00\uC871 \uAD00\uACC4 \uC5B4\uB824\uC6C0 \uD0D0\uC0C9", "Self-differentiation based \xB7 Exploring couples & family relationship difficulties")), renderOptions(deepOptions)));
  })(), !hasAny && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "#FFF8F0",
    border: "1px solid #FFD8A0",
    fontSize: 13,
    color: "#A07040",
    marginBottom: 16
  } }, "\u{1F4A1} ", tl(`${MAIN_SERVICE_NAME}\uC5D0\uC11C BIG5, LOST, SDRI \uAC80\uC0AC \uC911 \uD558\uB098 \uC774\uC0C1\uC744 \uC644\uB8CC\uD574\uC57C \uC138\uC158\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC5B4\uC694.`, `You need to complete at least one of BIG5, LOST, or SDRI tests on ${MAIN_SERVICE_NAME} to create a session.`)), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "16px",
    borderRadius: 14,
    background: C.lavPale,
    border: `1px solid ${C.lavL}33`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.lavender, marginBottom: 10 } }, "\u{1F4E8} ", tl("\uD30C\uD2B8\uB108 \uCF54\uB4DC\uB85C \uCC38\uC5EC\uD558\uAE30", "Join with Partner Code")), /* @__PURE__ */ React.createElement(CodeInput, { onJoin: handleJoin, loading: joining }))), /* @__PURE__ */ React.createElement(DailyQuestionCard, null), /* @__PURE__ */ React.createElement(PartnerMomentsSection, null), recentReports?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 20,
    padding: "20px",
    background: "white",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 } }, "\u{1F4DC} ", tl("\uC774\uC804 \uBD84\uC11D \uB9AC\uD3EC\uD2B8", "Previous Analysis Reports")), recentReports.length >= 2 && (() => {
    const scores = [...recentReports].reverse().map((r) => r.compatibility_score || 0);
    const latest = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    const diff = latest - prev;
    return /* @__PURE__ */ React.createElement("div", { style: {
      padding: "12px 14px",
      borderRadius: 12,
      marginBottom: 14,
      background: diff >= 0 ? "#EAF5EC" : "#FEF0EC",
      border: `1px solid ${diff >= 0 ? "#4A9A5A" : "#D4634A"}22`,
      display: "flex",
      alignItems: "center",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24 } }, diff >= 0 ? "\u{1F4C8}" : "\u{1F4C9}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: diff >= 0 ? "#4A9A5A" : "#D4634A" } }, tl("\uAD81\uD569 \uC810\uC218", "Compatibility Score"), " ", diff >= 0 ? `+${diff}` : `${diff}`, tl("\uC810", ""), " ", tl("\uBCC0\uD654", "change")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, diff >= 0 ? tl("\uD568\uAED8 \uC131\uC7A5\uD558\uACE0 \uC788\uC5B4\uC694! \u{1F331}", "Growing together! \u{1F331}") : tl("\uB354 \uAE4A\uC774 \uC774\uD574\uD558\uB294 \uACFC\uC815\uC774\uC5D0\uC694. \u{1F4AA}", "It's a journey of deeper understanding. \u{1F4AA}"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", gap: 3, alignItems: "flex-end", height: 32 } }, scores.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
      flex: 1,
      borderRadius: 4,
      height: `${Math.max(20, s)}%`,
      background: i === scores.length - 1 ? diff >= 0 ? "#4A9A5A" : "#D4634A" : C.roseL + "66",
      minHeight: 6,
      maxHeight: 32
    } }))));
  })(), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, recentReports.map((r) => /* @__PURE__ */ React.createElement("button", { key: r.id, onClick: () => {
    setSession(r);
    setView("report");
  }, style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    border: `1px solid ${C.roseL}33`,
    background: C.rosePale,
    cursor: "pointer",
    textAlign: "left"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 44,
    height: 44,
    borderRadius: 100,
    background: `linear-gradient(135deg, ${scoreColor(r.compatibility_score || 0)}, ${C.roseL})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "white",
    flexShrink: 0
  } }, r.compatibility_score || "?"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.dark } }, r.test_type, " ", tl("\uBD84\uC11D", "Analysis"), " \xB7 ", scoreLabel(r.compatibility_score || 0)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 } }, fmtDate(r.created_at))), /* @__PURE__ */ React.createElement("span", { style: { color: C.muted, fontSize: 16 } }, "\u203A")))))), creditModal && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 1e3,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    maxWidth: 320,
    width: "100%",
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F4B8}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 } }, tl("\uD06C\uB808\uB527 \uBD80\uC871", "Insufficient Credits")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 } }, creditModal.message), /* @__PURE__ */ React.createElement("a", { href: `${MAUMFUL_URL}/#charge`, style: {
    display: "block",
    padding: "12px",
    borderRadius: 12,
    background: C.rose,
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    marginBottom: 10,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, tl(`${MAIN_SERVICE_NAME}\uC5D0\uC11C \uCDA9\uC804\uD558\uAE30`, `Top up on ${MAIN_SERVICE_NAME}`)), /* @__PURE__ */ React.createElement("button", { onClick: () => setCredit(null), style: {
    background: "none",
    border: "none",
    color: C.muted,
    fontSize: 13,
    cursor: "pointer",
    padding: "8px"
  } }, tl("\uCDE8\uC18C", "Cancel")))), toast && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2e3,
    background: C.dark,
    color: "white",
    padding: "12px 24px",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    animation: "fadeUp 0.3s ease",
    fontFamily: "'Noto Sans KR', sans-serif",
    whiteSpace: "nowrap"
  } }, toast));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(CoupleHubApp, null));
