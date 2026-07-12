const { useState, useEffect, useRef, useCallback } = React;
const C = {
  sage: "#4A7C59",
  sageL: "#7BA88A",
  sagePale: "#EAF2EC",
  cream: "#FDFCF7",
  sand: "#F5EFE0",
  dusty: "#6B8FA8",
  dustyL: "#A8C4D4",
  amber: "#D4954A",
  amberL: "#E8C47A",
  muted: "#8A8A78",
  dark: "#2C2C20",
  fogGray: "#9BA8B0"
};
const btn = (extra = "") => ({
  fontFamily: "'Noto Sans KR', sans-serif",
  cursor: "pointer",
  border: "none",
  outline: "none",
  ...{}
});
function GardenSVG({ status = "clearing", level = 1, style = {} }) {
  const theme = {
    foggy: {
      skyTop: "#7A8E9A",
      skyBot: "#B0BFC8",
      ground: "#6A7A6A",
      groundDark: "#4A5A4A",
      treeTrunk: "#5A4A3A",
      treeLeaf: "#556655",
      fogOpacity: 0.55,
      flowersVisible: false,
      sunVisible: false,
      birdsVisible: false
    },
    clearing: {
      skyTop: "#5A8AC0",
      skyBot: "#A0C8E0",
      ground: "#5A8A4A",
      groundDark: "#3E6A32",
      treeTrunk: "#6B4F3A",
      treeLeaf: "#4A8A3A",
      fogOpacity: 0.2,
      flowersVisible: true,
      sunVisible: true,
      birdsVisible: false
    },
    blooming: {
      skyTop: "#3A7AC0",
      skyBot: "#80C0E0",
      ground: "#4A8A3A",
      groundDark: "#2E6A22",
      treeTrunk: "#7B5F4A",
      treeLeaf: "#3A9A2A",
      fogOpacity: 0,
      flowersVisible: true,
      sunVisible: true,
      birdsVisible: true
    }
  }[status] || {};
  const leafCount = Math.min(1 + Math.floor(level * 0.8), 6);
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 320 200", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%", ...style } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "skyGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: theme.skyTop }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: theme.skyBot })), /* @__PURE__ */ React.createElement("linearGradient", { id: "groundGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: theme.ground }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: theme.groundDark })), /* @__PURE__ */ React.createElement("filter", { id: "softBlur" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "2" })), /* @__PURE__ */ React.createElement("filter", { id: "fogBlur" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "4" }))), /* @__PURE__ */ React.createElement("rect", { width: "320", height: "200", fill: "url(#skyGrad)" }), theme.sunVisible && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("circle", { cx: "260", cy: "38", r: "22", fill: C.amberL, opacity: "0.9" }), /* @__PURE__ */ React.createElement("circle", { cx: "260", cy: "38", r: "17", fill: "#FFE08A" }), [0, 45, 90, 135, 180, 225, 270, 315].map((a) => /* @__PURE__ */ React.createElement(
    "line",
    {
      key: a,
      x1: 260 + Math.cos(a * Math.PI / 180) * 20,
      y1: 38 + Math.sin(a * Math.PI / 180) * 20,
      x2: 260 + Math.cos(a * Math.PI / 180) * 27,
      y2: 38 + Math.sin(a * Math.PI / 180) * 27,
      stroke: "#FFE08A",
      strokeWidth: "2",
      strokeLinecap: "round"
    }
  ))), status !== "foggy" && /* @__PURE__ */ React.createElement("g", { opacity: "0.85" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "80", cy: "55", rx: "28", ry: "14", fill: "white", opacity: "0.9" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "95", cy: "48", rx: "18", ry: "12", fill: "white", opacity: "0.9" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "65", cy: "52", rx: "16", ry: "10", fill: "white", opacity: "0.9" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "195", cy: "40", rx: "22", ry: "11", fill: "white", opacity: "0.75" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "208", cy: "34", rx: "14", ry: "9", fill: "white", opacity: "0.75" })), theme.birdsVisible && /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: C.dusty, strokeWidth: "1.5", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M 150 50 Q 154 46 158 50" }), /* @__PURE__ */ React.createElement("path", { d: "M 162 44 Q 166 40 170 44" }), /* @__PURE__ */ React.createElement("path", { d: "M 130 62 Q 133 58 136 62" })), /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "185", rx: "190", ry: "30", fill: "url(#groundGrad)" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "172", width: "320", height: "28", fill: theme.groundDark }), status !== "foggy" && /* @__PURE__ */ React.createElement("g", { fill: theme.ground, opacity: "0.8" }, [30, 55, 90, 130, 190, 230, 265, 290].map((x, i) => /* @__PURE__ */ React.createElement("g", { key: x }, /* @__PURE__ */ React.createElement("line", { x1: x, y1: "172", x2: x - 4, y2: 162 - i % 3 * 4, stroke: theme.treeLeaf, strokeWidth: "2", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("line", { x1: x, y1: "172", x2: x + 3, y2: 163 - i % 2 * 5, stroke: theme.treeLeaf, strokeWidth: "2", strokeLinecap: "round" })))), /* @__PURE__ */ React.createElement("rect", { x: "152", y: "110", width: "16", height: "62", rx: "5", fill: theme.treeTrunk }), /* @__PURE__ */ React.createElement("rect", { x: "155", y: "128", width: "10", height: "44", rx: "3", fill: theme.treeTrunk, opacity: "0.6" }), leafCount >= 1 && /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "105", rx: "30", ry: "26", fill: theme.treeLeaf, opacity: "0.95" }), leafCount >= 2 && /* @__PURE__ */ React.createElement("ellipse", { cx: "142", cy: "115", rx: "22", ry: "18", fill: theme.treeLeaf, opacity: "0.9" }), leafCount >= 3 && /* @__PURE__ */ React.createElement("ellipse", { cx: "178", cy: "113", rx: "22", ry: "19", fill: theme.treeLeaf, opacity: "0.9" }), leafCount >= 4 && /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "88", rx: "22", ry: "18", fill: theme.treeLeaf, opacity: "0.85" }), leafCount >= 5 && /* @__PURE__ */ React.createElement("ellipse", { cx: "145", cy: "97", rx: "16", ry: "14", fill: theme.treeLeaf, opacity: "0.8" }), leafCount >= 6 && /* @__PURE__ */ React.createElement("ellipse", { cx: "175", cy: "96", rx: "16", ry: "13", fill: theme.treeLeaf, opacity: "0.8" }), theme.flowersVisible && /* @__PURE__ */ React.createElement("g", null, [{ x: 60, c: "#F9A8D4" }, { x: 100, c: "#FCD34D" }, { x: 200, c: "#86EFAC" }, { x: 240, c: "#F9A8D4" }, { x: 280, c: "#FCD34D" }].map(({ x, c }, i) => level >= i ? /* @__PURE__ */ React.createElement("g", { key: x }, /* @__PURE__ */ React.createElement("circle", { cx: x, cy: "170", r: "5", fill: c, opacity: "0.95" }), /* @__PURE__ */ React.createElement("circle", { cx: x - 5, cy: "167", r: "3.5", fill: c, opacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: x + 5, cy: "167", r: "3.5", fill: c, opacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: x, cy: "163", r: "3.5", fill: c, opacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: x, cy: "170", r: "3", fill: "#FFF", opacity: "0.7" })) : null)), theme.fogOpacity > 0 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { width: "320", height: "200", fill: C.fogGray, opacity: theme.fogOpacity, filter: "url(#fogBlur)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "80", cy: "170", rx: "120", ry: "40", fill: C.fogGray, opacity: theme.fogOpacity * 0.8, filter: "url(#fogBlur)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "240", cy: "165", rx: "100", ry: "35", fill: C.fogGray, opacity: theme.fogOpacity * 0.7, filter: "url(#fogBlur)" })));
}
function LevelBar({ levelInfo }) {
  const { level, name, emoji, progress, currentExp, maxExp } = levelInfo || {};
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px", background: "rgba(255,255,255,0.7)", borderRadius: 16, backdropFilter: "blur(8px)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark } }, "Lv.", level, " ", name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, t("\uB2E4\uC74C \uB808\uBCA8\uAE4C\uC9C0", "Next level in"), " ", maxExp - currentExp, " EXP"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.sage } }, currentExp, " EXP")), /* @__PURE__ */ React.createElement("div", { style: { height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 100, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    width: `${progress}%`,
    background: `linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
    borderRadius: 100,
    transition: "width 1s ease",
    boxShadow: `0 0 8px ${C.sage}60`
  } })));
}
const TEST_META_HUB = {
  PHQ9: { label: "PHQ-9", emoji: "\u{1F331}", desc: t("\uC6B0\uC6B8 \uC120\uBCC4", "Depression") },
  GAD7: { label: "GAD-7", emoji: "\u{1F499}", desc: t("\uBD88\uC548 \uC120\uBCC4", "Anxiety") },
  DASS21: { label: "DASS-21", emoji: "\u{1F30A}", desc: t("\uC2A4\uD2B8\uB808\uC2A4", "Stress") },
  BIG5: { label: "Big5", emoji: "\u{1F9E0}", desc: t("\uC131\uACA9 \uBD84\uC11D", "Personality") },
  SCT: { label: "SCT", emoji: "\u270D\uFE0F", desc: t("\uBB38\uC7A5 \uC644\uC131", "Sentence Completion") },
  DSI: { label: "DSI", emoji: "\u{1FA9E}", desc: t("\uC790\uC544 \uBD84\uD654", "Self Differentiation") },
  BURNOUT: { label: "K-MBI+", emoji: "\u{1F525}", desc: t("\uBC88\uC544\uC6C3", "Burnout") },
  LOST: { label: "LOST", emoji: "\u{1F9ED}", desc: t("\uD589\uB3D9 \uC591\uC2DD", "Behavior Pattern") }
};
function TestBadgeRow({ completedTests = [] }) {
  const allTests = Object.keys(TEST_META_HUB);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, letterSpacing: "0.5px" } }, t("\uC5F0\uACB0\uB41C \uC2EC\uB9AC\uAC80\uC0AC", "Linked Tests")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 } }, allTests.map((t2) => {
    const meta = TEST_META_HUB[t2];
    const done = completedTests.includes(t2);
    return /* @__PURE__ */ React.createElement("div", { key: t2, style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 10px",
      borderRadius: 100,
      background: done ? C.sagePale : "rgba(0,0,0,0.05)",
      border: `1px solid ${done ? C.sage + "44" : "transparent"}`,
      opacity: done ? 1 : 0.5
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, meta.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted } }, meta.label), done && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: C.sage } }, "\u2713"));
  })), completedTests.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.muted, lineHeight: 1.6 } }, t("\uC2EC\uB9AC\uAC80\uC0AC\uB97C \uC644\uB8CC\uD558\uBA74 \uAC8C\uC784\uC774 \uB354 \uD48D\uC131\uD574\uC838\uC694.", "Complete psych tests to enrich your game experience."), " ", /* @__PURE__ */ React.createElement("a", { href: PHYWEB_URL, style: { color: C.sage, fontWeight: 600, textDecoration: "none" } }, t("\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD558\uAE30 \u2192", "Take a test at Maumful \u2192"))));
}
function GameCardSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: "24px 20px 20px",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: 42, height: 42, borderRadius: 10, marginBottom: 12 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "65%", height: 14, borderRadius: 7, marginBottom: 8 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "90%", height: 11, borderRadius: 6, marginBottom: 4 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "70%", height: 11, borderRadius: 6, marginBottom: 16 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "50%", height: 28, borderRadius: 9 } }));
}
function GameHubSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${C.sagePale}, ${C.cream})`
  } }, /* @__PURE__ */ React.createElement("div", { className: "hub-top-bar" }), /* @__PURE__ */ React.createElement("div", { style: {
    height: 60,
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${C.sagePale}`,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 12
  } }, /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: 32, height: 32, borderRadius: "50%" } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: 120, height: 14, borderRadius: 7 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: 60, height: 28, borderRadius: 9 } })), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,0.6)", borderRadius: 24, padding: "20px 20px", marginBottom: 20, height: 160 } }, /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "60%", height: 18, borderRadius: 9, marginBottom: 12 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "80%", height: 12, borderRadius: 6, marginBottom: 8 } }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: "40%", height: 12, borderRadius: 6 } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F3AE}"), /* @__PURE__ */ React.createElement("div", { className: "skeleton-shimmer", style: { width: 70, height: 14, borderRadius: 7 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 } }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(GameCardSkeleton, { key: i })))));
}
function GameCard({ game, onPlay, enterDelay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const locked = !game.canPlay;
  const comingSoon = !game.isAvailable;
  const cardBg = locked ? "rgba(255,255,255,0.5)" : hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => !locked && onPlay(game.id),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      onMouseDown: () => !locked && setPressed(true),
      onMouseUp: () => setPressed(false),
      onTouchStart: () => !locked && setPressed(true),
      onTouchEnd: () => setPressed(false),
      className: "game-card-enter",
      style: {
        background: cardBg,
        borderRadius: 20,
        padding: "24px 20px 20px",
        cursor: locked ? "not-allowed" : "pointer",
        animationDelay: `${enterDelay}ms`,
        transition: "all 0.22s ease",
        transform: pressed ? "scale(0.96)" : !locked && hovered ? "translateY(-4px)" : "none",
        boxShadow: !locked && hovered ? `0 12px 32px ${C.sage}22` : "0 2px 12px rgba(0,0,0,0.06)",
        border: `1px solid ${!locked && hovered ? C.sage + "44" : "rgba(255,255,255,0.6)"}`,
        backdropFilter: "blur(8px)",
        position: "relative",
        overflow: "hidden",
        opacity: comingSoon ? 0.7 : 1
      }
    },
    comingSoon && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: 12,
      right: 12,
      background: "rgba(0,0,0,0.08)",
      color: C.muted,
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 100,
      letterSpacing: "0.5px"
    } }, t("\uC900\uBE44 \uC911", "Coming Soon")),
    !comingSoon && !game.isUnlocked && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: 12,
      right: 12,
      background: C.sand,
      color: C.amber,
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 100
    } }, t(`Lv.${game.unlockLevel} \uD574\uAE08`, `Lv.${game.unlockLevel} Unlock`)),
    /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 42,
      marginBottom: 12,
      lineHeight: 1,
      filter: locked ? "grayscale(0.5)" : "none",
      animation: !locked && hovered ? "float 2s ease-in-out infinite" : "none"
    } }, game.emoji),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 } }, game.name),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 } }, game.tagline),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 } }, game.tags.slice(0, 3).map((tag) => /* @__PURE__ */ React.createElement("span", { key: tag, style: {
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 100,
      background: C.sagePale,
      color: C.sage,
      fontWeight: 500
    } }, tag))),
    /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 4,
      color: game.creditCost > 0 ? "#D4954A" : "#4A7C59"
    } }, game.creditCost > 0 ? `\u{1F33F} ${game.creditCost} ${t("\uD06C\uB808\uB527", "Credits")}` : t("\uBB34\uB8CC", "Free")),
    game.requiredTests.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.dusty, marginBottom: 12 } }, game.requiredTests.map((t2) => TEST_META_HUB[t2]?.label || t2).join(" \xB7 "), " ", t("\uC5F0\uB3D9", "linked")),
    game.modules?.length > 0 && !comingSoon && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 } }, game.modules.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.muted } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, m.emoji), /* @__PURE__ */ React.createElement("span", null, m.name)))),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        disabled: locked,
        style: {
          ...btn(),
          width: "100%",
          padding: "10px 0",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          background: locked ? "rgba(0,0,0,0.07)" : `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
          color: locked ? C.muted : "white",
          transition: "all 0.2s",
          boxShadow: !locked ? `0 4px 12px ${C.sage}40` : "none"
        }
      },
      comingSoon ? t("\uACE7 \uCD9C\uC2DC\uB429\uB2C8\uB2E4", "Coming Soon") : locked ? `\u{1F512} ${t("\uC7A0\uAE08 \uD574\uC81C \uD544\uC694", "Locked")}` : t("\uC2DC\uC791\uD558\uAE30 \u2192", "Start \u2192")
    )
  );
}
function StreakCalendar({ recentPlayDates = [], streakDays = 0, streakRecover = 0, onRecover }) {
  const [recovering, setRecovering] = useState(false);
  const days = [];
  const dowLabels = GAME_LANG === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = dowLabels[d.getDay()];
    days.push({ iso, dow, played: recentPlayDates.includes(iso) });
  }
  const MILESTONES = [3, 7, 14, 30, 60, 90];
  const nextMilestone = MILESTONES.find((m) => m > streakDays);
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= streakDays) || 0;
  const milestoneProgress = nextMilestone ? Math.round((streakDays - prevMilestone) / (nextMilestone - prevMilestone) * 100) : 100;
  const fireEmoji = streakDays >= 30 ? "\u{1F525}\u{1F525}\u{1F525}" : streakDays >= 14 ? "\u{1F525}\u{1F525}" : streakDays >= 3 ? "\u{1F525}" : "";
  const handleRecover = async () => {
    if (recovering || streakRecover <= 0) return;
    setRecovering(true);
    const r = await GameEngine.recoverStreak().catch(() => ({ success: false }));
    setRecovering(false);
    if (r.success) onRecover?.();
  };
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px", background: "rgba(255,255,255,0.7)", borderRadius: 16, backdropFilter: "blur(8px)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, "\u{1F4C5} ", t("\uCD5C\uADFC 7\uC77C \uCD9C\uC11D", "7-Day Attendance")), streakDays > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.amber, display: "flex", alignItems: "center", gap: 4 } }, fireEmoji, " ", t(`${streakDays}\uC77C \uC5F0\uC18D`, `${streakDays}-Day Streak`))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "space-between", marginBottom: 12 } }, days.map(({ iso, dow, played }) => /* @__PURE__ */ React.createElement("div", { key: iso, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted, fontWeight: 500 } }, dow), /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: 8,
    background: played ? `linear-gradient(135deg, ${C.sage}, ${C.sageL})` : "rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    boxShadow: played ? `0 2px 8px ${C.sage}40` : "none",
    transition: "all 0.3s"
  } }, played ? "\u{1F33F}" : "")))), nextMilestone && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: streakRecover > 0 && streakDays === 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", null, t("\uB2E4\uC74C \uBAA9\uD45C", "Next Goal"), ": ", t(`${nextMilestone}\uC77C \uC5F0\uC18D \u{1F3C5}`, `${nextMilestone}-Day Streak \u{1F3C5}`)), /* @__PURE__ */ React.createElement("span", null, streakDays, " / ", t(`${nextMilestone}\uC77C`, `${nextMilestone} days`))), /* @__PURE__ */ React.createElement("div", { style: { height: 5, borderRadius: 10, background: "rgba(0,0,0,0.07)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    borderRadius: 10,
    transition: "width 0.5s",
    width: `${milestoneProgress}%`,
    background: `linear-gradient(90deg, ${C.amber}, ${C.amberL})`
  } })), (hitMilestone) => null), streakRecover > 0 && streakDays === 0 && /* @__PURE__ */ React.createElement("button", { onClick: handleRecover, disabled: recovering, style: {
    width: "100%",
    marginTop: 10,
    padding: "8px 0",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg, ${C.amber}CC, ${C.amberL})`,
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    cursor: recovering ? "not-allowed" : "pointer",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, recovering ? t("\uBCF5\uAD6C \uC911...", "Restoring...") : `\u{1F6E1}\uFE0F ${t("\uBCF5\uAD6C\uAD8C \uC0AC\uC6A9\uD558\uC5EC \uC2A4\uD2B8\uB9AD \uBCF5\uC6D0", "Use Recovery Pass")} (${t(`${streakRecover}\uAC1C \uBCF4\uC720`, `${streakRecover} held`)})`), streakRecover > 0 && streakDays > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: C.amber, fontWeight: 600, textAlign: "right" } }, "\u{1F6E1}\uFE0F ", t(`\uBCF5\uAD6C\uAD8C ${streakRecover}\uAC1C \uBCF4\uC720`, `${streakRecover} Recovery Pass(es) held`), " (", t("\uC5F0\uC18D \uB04A\uAE38 \uB54C \uC790\uB3D9 \uC0AC\uC6A9 \uAC00\uB2A5", "auto-used when streak breaks"), ")"));
}
function DailyTip({ hubData }) {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!hubData) return;
    const { gameStatus, completedTests, userTestScores } = hubData;
    const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
    GameEngine.getDailyTip({
      streakDays: gameStatus?.streak_days || 0,
      level: levelInfo.level,
      testScores: userTestScores || {},
      recentTests: (completedTests || []).slice(0, 3)
    }).then((res) => {
      if (res.success) setTip(res.data?.message);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, [hubData]);
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.5)",
    borderRadius: 14,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.5)",
    backdropFilter: "blur(8px)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    color: C.muted,
    animation: "pulse 1.5s infinite",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, "\u{1F916} ", t("\uC624\uB298\uC758 \uCF54\uCE58 \uBA54\uC2DC\uC9C0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...", "Loading today's coach message...")));
  if (!tip) return null;
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
    borderRadius: 14,
    padding: "13px 16px",
    border: `1px solid ${C.sage}25`,
    backdropFilter: "blur(8px)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: C.sage, marginBottom: 5, letterSpacing: "0.5px" } }, "\u{1F916} ", t("\uC624\uB298\uC758 \uCF54\uCE58 \uBA54\uC2DC\uC9C0", "Today's Coach Message")), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    color: C.dark,
    lineHeight: 1.65,
    fontWeight: 500,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, tip));
}
function Leaderboard({ currentUserEmail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    GameEngine.getLeaderboard().then((res) => {
      if (res.success) setData(res.data);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted, animation: "pulse 1.5s infinite" } }, t("\uC21C\uC704\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...", "Loading rankings...")));
  if (!data?.length) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 } }, t("\uC544\uC9C1 \uC21C\uC704 \uB370\uC774\uD130\uAC00 \uC5C6\uC5B4\uC694", "No ranking data yet"));
  const MEDAL = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, data.map((entry, i) => {
    const levelInfo = GameEngine.getLevelInfo(entry.total_exp || 0);
    const isMe = entry.email && currentUserEmail && entry.email === currentUserEmail;
    const rank = MEDAL[i] || `${i + 1}.`;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 12,
      background: isMe ? C.sagePale : "rgba(255,255,255,0.7)",
      border: `1px solid ${isMe ? C.sage + "44" : "rgba(255,255,255,0.5)"}`,
      backdropFilter: "blur(6px)",
      boxShadow: isMe ? `0 2px 12px ${C.sage}20` : "none"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, minWidth: 28, textAlign: "center", fontWeight: 700 } }, rank), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14 } }, levelInfo.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 5 } }, entry.nickname || entry.email?.split("@")[0] || t("\uC815\uC6D0\uC0AC", "Gardener"), isMe && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, background: C.sage, color: "white", borderRadius: 4, padding: "1px 5px" } }, t("\uB098", "Me"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, "Lv.", entry.garden_level, " ", levelInfo.name, (entry.streak_days || 0) > 1 && ` \xB7 \u{1F525} ${t(`${entry.streak_days}\uC77C`, `${entry.streak_days}d`)}`)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.sage } }, (entry.total_exp || 0).toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted } }, "EXP")));
  }));
}
function RecentActivity({ sessions = [] }) {
  if (sessions.length === 0) return null;
  const MODULE_LABEL = {
    breathing: { emoji: "\u{1F4A7}", name: t("\uD638\uD761 \uD6C8\uB828", "Breathing Training") },
    cbt: { emoji: "\u{1F331}", name: t("\uC0DD\uAC01 \uAD50\uC815", "Thought Reframing") },
    efmt: { emoji: "\u{1F338}", name: t("\uAC10\uC815 \uD6C8\uB828", "Emotion Training") },
    relax: { emoji: "\u{1F3DE}\uFE0F", name: t("\uC774\uC644 \uD6C8\uB828", "Relaxation Training") },
    missions: { emoji: "\u{1F3AF}", name: t("\uD68C\uBCF5 \uBBF8\uC158", "Recovery Mission") },
    city: { emoji: "\u{1F3D9}\uFE0F", name: t("\uD68C\uBCF5 \uB3C4\uC2DC", "Recovery City") },
    weekly_report: { emoji: "\u{1F4CA}", name: t("\uC8FC\uAC04 \uB9AC\uD3EC\uD2B8", "Weekly Report") },
    checkin: { emoji: "\u{1F3A8}", name: t("\uAC10\uC815 \uCCB4\uD06C\uC778", "Emotion Check-in") },
    daily_quest_bonus: { emoji: "\u{1F381}", name: t("\uB370\uC77C\uB9AC \uD018\uC2A4\uD2B8 \uBCF4\uB108\uC2A4", "Daily Quest Bonus") }
  };
  return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 32 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F4DC}"), " ", t("\uCD5C\uADFC \uD50C\uB808\uC774 \uAE30\uB85D", "Recent Activity")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, sessions.map((s, i) => {
    const m = MODULE_LABEL[s.module_type] || { emoji: "\u{1F3AE}", name: s.module_type };
    return /* @__PURE__ */ React.createElement("div", { key: i, style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.6)",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255,255,255,0.5)"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, m.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.dark } }, m.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, GameEngine.formatRelativeTime(s.created_at))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.sage } }, "+", s.exp_gained, " EXP"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, t("\uC810\uC218", "Score"), " ", s.score)));
  })));
}
function LoginGate() {
  return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${C.sagePale}, ${C.cream}, #EBF4FA)`,
    padding: 24,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 20, animation: "float 3s ease-in-out infinite" } }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, t("\uB9C8\uC74C\uC758 \uC815\uC6D0", "Mind Garden")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 32, maxWidth: 300 } }, t(
    /* @__PURE__ */ React.createElement(React.Fragment, null, "\uB9C8\uC74C\uD480\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uACB0\uD558\uC5EC", /* @__PURE__ */ React.createElement("br", null), "\uB098\uB9CC\uC758 \uC815\uC6D0\uC744 \uAC00\uAFB8\uC138\uC694 \u{1F33F}"),
    /* @__PURE__ */ React.createElement(React.Fragment, null, "Log in to Maumful", /* @__PURE__ */ React.createElement("br", null), "and enjoy without a separate login.", /* @__PURE__ */ React.createElement("br", null), "Connect your psych test results", /* @__PURE__ */ React.createElement("br", null), "and grow your own garden \u{1F33F}")
  )), /* @__PURE__ */ React.createElement("a", { href: PHYWEB_URL, style: {
    display: "inline-block",
    padding: "14px 36px",
    background: `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
    color: "white",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    boxShadow: `0 8px 24px ${C.sage}44`,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, t("\uB9C8\uC74C\uD480 \uB85C\uADF8\uC778\uD558\uACE0 \uC2DC\uC791\uD558\uAE30 \u2192", "Log in to Maumful to start \u2192")));
}
const ALL_ACHIEVEMENT_IDS = [
  // 연속 출석
  "streak_3",
  "streak_7",
  "streak_14",
  "perfect_week",
  // 레벨
  "level_3",
  "level_5",
  // 경험치
  "exp_500",
  "exp_1000",
  // 게임별 숙련
  "first_play",
  "breath_master",
  "cbt_master",
  "burnout_fighter",
  // 감정 수채화
  "mood_7",
  "mood_30",
  // 감사 일기
  "gratitude_7",
  // 탐험
  "all_games"
];
const CAMPAIGN_DEF = [
  {
    id: "ch1",
    title: t("\uCCAB \uBC1C\uAC78\uC74C", "First Steps"),
    subtitle: t("\uB9C8\uC74C \uCC59\uAE30\uAE30", "Mindfulness"),
    emoji: "\u{1F331}",
    color: "#4A7C59",
    colorLight: "#EAF2EC",
    desc: t("\uB098\uC758 \uAC10\uC815\uC744 \uC54C\uC544\uCC44\uACE0 \uB9C8\uC74C\uC744 \uB3CC\uBCF4\uB294 \uCCAB \uC5EC\uC815\uC744 \uC2DC\uC791\uD574\uC694", "Begin your first journey to notice your emotions and care for your mind."),
    steps: [
      { game: "mood", module: "checkin", name: t("\uAC10\uC815 \uC218\uCC44\uD654 \u2014 \uC624\uB298 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30", "Emotion Watercolor \u2014 Record today's emotion"), emoji: "\u{1F3A8}" },
      { game: "garden", module: "breathing", name: t("\uB9C8\uC74C\uC758 \uC815\uC6D0 \u2014 \uD638\uD761 \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", "Mind Garden \u2014 Complete breathing training"), emoji: "\u{1F4A7}" },
      { game: "gratitude", module: "gratitude_write", name: t("\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30 \u2014 \uAC10\uC0AC \uC77C\uAE30 \uC4F0\uAE30", "Starlight Gratitude \u2014 Write a gratitude journal"), emoji: "\u2B50" }
    ],
    rewardCredits: 30,
    rewardBadge: "\u{1F331}",
    rewardName: t("\uB9C8\uC74C \uC528\uC557", "Mind Seed"),
    unlockLevel: 1
  },
  {
    id: "ch2",
    title: t("\uB9C8\uC74C \uAD50\uC815", "Mind Correction"),
    subtitle: t("\uC778\uC9C0 \uD6C8\uB828", "Cognitive Training"),
    emoji: "\u{1F338}",
    color: "#C97B8A",
    colorLight: "#FAE8EC",
    desc: t("\uBD80\uC815\uC801\uC778 \uC0DD\uAC01 \uD328\uD134\uC744 \uC778\uC2DD\uD558\uACE0 \uAC10\uC815 \uC778\uC9C0 \uB2A5\uB825\uC744 \uD0A4\uC6CC\uC694", "Recognize negative thought patterns and develop emotional awareness."),
    steps: [
      { game: "garden", module: "cbt", name: t("\uB9C8\uC74C\uC758 \uC815\uC6D0 \u2014 \uC0DD\uAC01 \uAD50\uC815 \uC644\uB8CC\uD558\uAE30", "Mind Garden \u2014 Complete thought reframing"), emoji: "\u{1F331}" },
      { game: "efmt", module: null, name: t("\uAC10\uC815\uAF43 \uCC3E\uAE30 \u2014 \uAC10\uC815 \uC778\uC2DD \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", "Emotion Flower \u2014 Complete emotion recognition training"), emoji: "\u{1F338}" },
      { game: "burnout", module: "missions", name: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5 \u2014 \uD68C\uBCF5 \uBBF8\uC158 \uC644\uB8CC\uD558\uAE30", "BURNOUT Recovery \u2014 Complete a recovery mission"), emoji: "\u26A1" }
    ],
    rewardCredits: 50,
    rewardBadge: "\u{1F338}",
    rewardName: t("\uB9C8\uC74C \uAF43\uBD09\uC624\uB9AC", "Mind Bud"),
    unlockLevel: 2
  },
  {
    id: "ch3",
    title: t("\uAE4A\uC740 \uC131\uC7A5", "Deep Growth"),
    subtitle: t("\uC790\uC544 \uD0D0\uD5D8", "Self Exploration"),
    emoji: "\u{1F333}",
    color: "#5A9BBF",
    colorLight: "#E8F4FA",
    desc: t("\uC9D1\uC911\uB825\uACFC \uB0B4\uBA74\uC758 \uB098\uBB34\uB97C \uD1B5\uD574 \uC790\uC544\uB97C \uAE4A\uC774 \uD0D0\uD5D8\uD574\uC694", "Deeply explore yourself through focus and your inner tree."),
    steps: [
      { game: "focus", module: null, name: t("\uB9C8\uC74C \uC9D1\uC911\uB825 \u2014 \uC9D1\uC911\uB825 \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", "Mind Focus \u2014 Complete focus training"), emoji: "\u{1F9E0}" },
      { game: "tree", module: null, name: t("\uB0B4\uBA74\uC758 \uB098\uBB34 \u2014 \uC790\uC544 \uD0D0\uD5D8\uD558\uAE30", "Inner Tree \u2014 Explore your inner self"), emoji: "\u{1F333}" },
      { game: "efmt", module: null, name: t("\uAC10\uC815\uAF43 \uCC3E\uAE30 \u2014 \uAC10\uC815 \uC778\uC2DD \uC7AC\uB3C4\uC804\uD558\uAE30", "Emotion Flower \u2014 Retry emotion recognition"), emoji: "\u{1F4AD}" }
    ],
    rewardCredits: 80,
    rewardBadge: "\u{1F333}",
    rewardName: t("\uB9C8\uC74C \uB9CC\uAC1C", "Mind Full Bloom"),
    unlockLevel: 3
  }
];
function CampaignSection({ onPlay }) {
  const [expanded, setExpanded] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [claiming, setClaiming] = React.useState(null);
  const [claimResult, setClaimResult] = React.useState(null);
  const load = React.useCallback(() => {
    if (data) return;
    setLoading(true);
    GameEngine.getCampaign().then((res) => {
      if (res.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, [data]);
  const handleToggle = () => {
    if (!expanded) load();
    setExpanded((v) => !v);
  };
  const handleClaim = async (chapterId) => {
    if (claiming) return;
    setClaiming(chapterId);
    try {
      const res = await GameEngine.claimCampaign(chapterId);
      if (res.success) {
        setClaimResult({ chapterId, credits: res.data.credits });
        const fresh = await GameEngine.getCampaign();
        if (fresh.success) setData(fresh.data);
      } else {
        alert(res.error || t("\uBCF4\uC0C1 \uC218\uB839 \uC2E4\uD328", "Failed to claim reward"));
      }
    } finally {
      setClaiming(null);
    }
  };
  const isChapterLocked = (idx) => {
    if (idx === 0) return false;
    if (!data) return true;
    return !data.chapters[idx - 1]?.rewarded;
  };
  const rewardedCount = data?.chapters?.filter((ch) => ch.rewarded).length || 0;
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("button", { onClick: handleToggle, style: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: expanded ? "20px 20px 0 0" : 20,
    padding: "16px 20px",
    border: "1px solid rgba(255,255,255,0.6)",
    borderBottom: expanded ? "1px solid rgba(0,0,0,0.06)" : void 0,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR',sans-serif",
    transition: "border-radius 0.2s"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F4D6}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: C.dark } }, t("\uC2A4\uD1A0\uB9AC \uCEA0\uD398\uC778", "Story Campaign")), rewardedCount > 0 && /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
    color: "white",
    borderRadius: 100,
    padding: "2px 9px"
  } }, rewardedCount, " / ", CAMPAIGN_DEF.length, " ", t("\uC644\uB8CC", "Completed"))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC"))), expanded && /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(8px)",
    borderRadius: "0 0 20px 20px",
    padding: "4px 20px 20px",
    border: "1px solid rgba(255,255,255,0.6)",
    borderTop: "none"
  } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "24px", color: C.muted, fontSize: 13 } }, t("\uBD88\uB7EC\uC624\uB294 \uC911...", "Loading...")), claimResult && /* @__PURE__ */ React.createElement("div", { style: {
    margin: "12px 0 16px",
    background: `linear-gradient(135deg, ${C.amber}22, ${C.amberL}22)`,
    border: `1px solid ${C.amber}44`,
    borderRadius: 14,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    animation: "fadeUp 0.3s ease"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, "\u{1F389}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.amber } }, t("\uCC55\uD130 \uBCF4\uC0C1 \uC218\uB839 \uC644\uB8CC!", "Chapter reward claimed!")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted } }, "+", claimResult.credits, " ", t("\uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB410\uC5B4\uC694", "credits have been sent."))), /* @__PURE__ */ React.createElement("button", { onClick: () => setClaimResult(null), style: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: C.muted
  } }, "\u2715")), !loading && data && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 } }, CAMPAIGN_DEF.map((ch, idx) => {
    const serverCh = data.chapters[idx];
    const locked = isChapterLocked(idx);
    const rewarded = serverCh?.rewarded || false;
    const allDone = serverCh?.allDone || false;
    const stepsDone = serverCh?.stepsDone || ch.steps.map(() => false);
    const doneCount = stepsDone.filter(Boolean).length;
    const canClaim = allDone && !rewarded && !locked;
    return /* @__PURE__ */ React.createElement("div", { key: ch.id, style: {
      borderRadius: 18,
      overflow: "hidden",
      border: rewarded ? `2px solid ${ch.color}44` : locked ? "1px solid rgba(0,0,0,0.06)" : `1px solid ${ch.color}28`,
      background: rewarded ? `${ch.colorLight}` : locked ? "rgba(0,0,0,0.02)" : "white",
      opacity: locked ? 0.6 : 1,
      transition: "all 0.3s"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "14px 16px",
      background: rewarded ? `linear-gradient(135deg, ${ch.color}22, ${ch.colorLight})` : locked ? "rgba(0,0,0,0.02)" : `linear-gradient(135deg, ${ch.color}12, white)`,
      display: "flex",
      alignItems: "center",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      flexShrink: 0,
      background: locked ? "rgba(0,0,0,0.08)" : `linear-gradient(135deg, ${ch.color}33, ${ch.color}11)`,
      border: `1.5px solid ${locked ? "rgba(0,0,0,0.1)" : ch.color + "33"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: locked ? 18 : 22,
      filter: locked ? "grayscale(1)" : "none"
    } }, locked ? "\u{1F512}" : rewarded ? "\u2705" : ch.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: locked ? C.muted : C.dark } }, ch.title), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 10,
      fontWeight: 700,
      padding: "1px 7px",
      borderRadius: 100,
      background: rewarded ? `${ch.color}22` : `rgba(0,0,0,0.06)`,
      color: rewarded ? ch.color : C.muted
    } }, ch.subtitle)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, lineHeight: 1.4 } }, ch.desc)), !locked && !rewarded && /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
      color: allDone ? ch.color : C.muted
    } }, doneCount, "/", ch.steps.length)), !locked && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px", display: "flex", flexDirection: "column", gap: 7 } }, ch.steps.map((step, si) => {
      const done = stepsDone[si] || false;
      return /* @__PURE__ */ React.createElement("div", { key: step.game + si, style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        background: done ? `${ch.color}12` : "rgba(0,0,0,0.03)",
        border: `1px solid ${done ? ch.color + "28" : "transparent"}`
      } }, /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 16,
        filter: done ? "none" : "grayscale(0.5) opacity(0.6)"
      } }, step.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 12,
        fontWeight: done ? 600 : 400,
        color: done ? C.dark : C.muted,
        textDecoration: done ? "none" : "none"
      } }, step.name)), done ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: ch.color } }, "\u2713") : /* @__PURE__ */ React.createElement("button", { onClick: () => onPlay?.(step.game), style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: `linear-gradient(135deg, ${ch.color}CC, ${ch.color}99)`,
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer"
      } }, t("\uD558\uAE30 \u2192", "Go \u2192")));
    }), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 4,
      padding: "10px 12px",
      borderRadius: 12,
      background: rewarded ? `${ch.color}15` : canClaim ? `linear-gradient(135deg, ${C.amber}18, ${C.amberL}18)` : "rgba(0,0,0,0.03)",
      border: `1px solid ${rewarded ? ch.color + "30" : canClaim ? C.amber + "44" : "rgba(0,0,0,0.06)"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: rewarded ? ch.color : canClaim ? C.amber : C.muted } }, rewarded ? `\u2705 ${ch.rewardBadge} ${ch.rewardName} ${t("\uD68D\uB4DD!", "Earned!")}` : `\u{1F381} ${t("\uCC55\uD130 \uC644\uB8CC \uBCF4\uC0C1", "Chapter Reward")}: +${ch.rewardCredits} ${t("\uD06C\uB808\uB527", "Credits")} \xB7 ${ch.rewardBadge} ${ch.rewardName}`), rewarded && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted, marginTop: 2 } }, t("\uBCF4\uC0C1\uC774 \uC9C0\uAE09\uB410\uC5B4\uC694", "Reward has been sent."))), canClaim && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleClaim(ch.id),
        disabled: claiming === ch.id,
        style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "7px 14px",
          fontSize: 11,
          fontWeight: 700,
          cursor: claiming === ch.id ? "not-allowed" : "pointer",
          flexShrink: 0,
          boxShadow: `0 4px 12px ${C.amber}44`
        }
      },
      claiming === ch.id ? "..." : `${t("\uBCF4\uC0C1 \uBC1B\uAE30", "Claim Reward")} \u{1F381}`
    ))), locked && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px 14px", textAlign: "center", fontSize: 12, color: C.muted } }, t("\uC774\uC804 \uCC55\uD130\uB97C \uC644\uB8CC\uD558\uBA74 \uD574\uAE08\uB3FC\uC694", "Complete the previous chapter to unlock.")));
  }))));
}
const STATS_GAME_META = {
  garden: { name: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden"), emoji: "\u{1F33F}" },
  mood: { name: t("\uAC10\uC815 \uCCB4\uD06C\uC778", "Emotion Check-in"), emoji: "\u{1F3A8}" },
  efmt: { name: t("\uAC10\uC815 \uD0D0\uC0C9", "Emotion Exploration"), emoji: "\u{1F4AD}" },
  gratitude: { name: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude Journal"), emoji: "\u2B50" },
  tree: { name: t("\uC0DD\uAC01 \uB098\uBB34", "Thought Tree"), emoji: "\u{1F333}" },
  burnout: { name: t("\uBC88\uC544\uC6C3 \uCCB4\uD06C", "BURNOUT Check"), emoji: "\u{1F525}" },
  focus: { name: t("\uB9C8\uC74C \uC9D1\uC911\uB825", "Mind Focus"), emoji: "\u{1F9E0}" },
  worry: { name: t("\uAC71\uC815 \uD48D\uC120", "Worry Balloon"), emoji: "\u{1FAE7}" }
};
function GameStatsSection() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const load = React.useCallback(() => {
    if (stats) return;
    setLoading(true);
    GameEngine.getGameStats().then((res) => {
      if (res.success) setStats(res.data);
    }).finally(() => setLoading(false));
  }, [stats]);
  const handleToggle = () => {
    if (!expanded) load();
    setExpanded((v) => !v);
  };
  const { perGame = [], week = {}, month = {} } = stats || {};
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("button", { onClick: handleToggle, style: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    border: "1px solid rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F4CA}"), " ", t("\uB0B4 \uAC8C\uC784 \uD1B5\uACC4", "My Game Stats")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC"))), expanded && /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: "0 0 20px 20px",
    padding: "4px 20px 20px",
    border: "1px solid rgba(255,255,255,0.6)",
    borderTop: "none",
    marginTop: -4
  } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "24px", color: C.muted, fontSize: 13 } }, t("\uBD88\uB7EC\uC624\uB294 \uC911...", "Loading...")), !loading && stats && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, paddingTop: 16 } }, [
    { label: t("\uC774\uBC88 \uC8FC \uD50C\uB808\uC774", "This Week"), value: `${week.playCount || 0}${t("\uD68C", "x")}`, sub: `+${week.expGained || 0} EXP`, color: C.sage },
    { label: t("\uC774\uBC88 \uB2EC \uD50C\uB808\uC774", "This Month"), value: `${month.playCount || 0}${t("\uD68C", "x")}`, sub: `+${month.expGained || 0} EXP`, color: C.amber }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: {
    background: "white",
    borderRadius: 14,
    padding: "14px 16px",
    border: `1px solid ${c.color}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginBottom: 4 } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: c.color } }, c.value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, c.sub)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: "0.5px" } }, t("\uAC8C\uC784\uBCC4 \uC218\uD589 \uD604\uD669", "Performance by Game")), perGame.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px", color: C.muted, fontSize: 13 } }, t("\uC544\uC9C1 \uD50C\uB808\uC774 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694", "No play records yet")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, perGame.map((g) => {
    const meta = STATS_GAME_META[g.game_id] || { name: g.game_id, emoji: "\u{1F3AE}" };
    const lastDate = g.last_played ? new Date(g.last_played).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "-";
    return /* @__PURE__ */ React.createElement("div", { key: g.game_id, style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "white",
      borderRadius: 12,
      padding: "12px 14px"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, meta.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: C.dark } }, meta.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, t("\uB9C8\uC9C0\uB9C9", "Last"), ": ", lastDate))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.sage } }, g.play_count || 0, t("\uD68C", "x")), (g.best_score || 0) > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.amber } }, t("\uBCA0\uC2A4\uD2B8", "Best"), " ", g.best_score, t("\uC810", "pts"))));
  })))));
}
function AchievementPanel({ earned = [], isMaster = false }) {
  const [expanded, setExpanded] = React.useState(false);
  const earnedIds = earned.map((e) => e.achievement_id);
  const earnedSet = new Set(earnedIds);
  const totalCount = ALL_ACHIEVEMENT_IDS.length;
  const earnedCount = isMaster ? totalCount : earnedIds.length;
  const sorted = [
    ...ALL_ACHIEVEMENT_IDS.filter((id) => earnedSet.has(id)),
    ...ALL_ACHIEVEMENT_IDS.filter((id) => !earnedSet.has(id))
  ];
  const visible = expanded ? sorted : sorted.slice(0, 6);
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F3C5}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, t("\uC5C5\uC801", "Achievements")), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    background: earnedCount === totalCount ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
    color: earnedCount === totalCount ? "white" : C.sage,
    borderRadius: 100,
    padding: "2px 9px"
  } }, earnedCount, " / ", totalCount)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, maxWidth: 100, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 100, overflow: "hidden", marginLeft: 12 } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    width: `${Math.round(earnedCount / totalCount * 100)}%`,
    background: `linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
    borderRadius: 100,
    transition: "width 0.6s ease"
  } }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: sorted.length > 6 ? 12 : 0 } }, visible.map((id) => {
    const a = GameEngine.getAchievementInfo(id);
    const done = isMaster || earnedSet.has(id);
    return /* @__PURE__ */ React.createElement("div", { key: id, style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 100,
      background: done ? C.sagePale : "rgba(0,0,0,0.04)",
      border: `1px solid ${done ? C.sage + "33" : "rgba(0,0,0,0.07)"}`,
      opacity: done ? 1 : 0.55,
      transition: "all 0.2s"
    }, title: a.desc }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, filter: done ? "none" : "grayscale(1)" } }, a.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted } }, a.name), done && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: C.sage } }, "\u2713"));
  })), sorted.length > 6 && /* @__PURE__ */ React.createElement("button", { onClick: () => setExpanded((v) => !v), style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: C.muted,
    fontWeight: 600,
    fontFamily: "'Noto Sans KR',sans-serif",
    padding: "2px 0"
  } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t(`+${sorted.length - 6}\uAC1C \uB354\uBCF4\uAE30 \u25BC`, `+${sorted.length - 6} more \u25BC`)));
}
function AchievementToast({ achievements = [], onDismiss }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4e3);
    return () => clearTimeout(timer);
  }, []);
  if (!visible || achievements.length === 0) return null;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1e3,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "fadeUp 0.4s ease"
  } }, achievements.map((id) => {
    const a = GameEngine.getAchievementInfo(id);
    return /* @__PURE__ */ React.createElement("div", { key: id, style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "white",
      borderRadius: 14,
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      border: `1px solid ${C.sage}33`
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, a.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, t("\uC5C5\uC801 \uB2EC\uC131!", "Achievement Unlocked!")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.sage, fontWeight: 600 } }, a.name)));
  }));
}
const BURNOUT_LEVELS = [
  { max: 39, label: t("\uB0AE\uC74C", "Low"), color: "#52B788", bg: "#D8F3DC" },
  { max: 59, label: t("\uBCF4\uD1B5", "Medium"), color: "#F59E0B", bg: "#FEF3C7" },
  { max: 79, label: t("\uB192\uC74C", "High"), color: "#F97316", bg: "#FFEDD5" },
  { max: 100, label: t("\uC2EC\uAC01", "Severe"), color: "#EF4444", bg: "#FEF2F2" }
];
function getBurnoutLevel(score) {
  return BURNOUT_LEVELS.find((l) => score <= l.max) || BURNOUT_LEVELS[BURNOUT_LEVELS.length - 1];
}
function BurnoutTrendSection({ userTestScores }) {
  const [history, setHistory] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const handleToggle = () => {
    if (!expanded && !history) {
      setLoading(true);
      GameEngine.getBurnoutHistory().then((res) => {
        if (res.success) setHistory(res.data);
      }).finally(() => setLoading(false));
    }
    setExpanded((v) => !v);
  };
  const burnoutScore = userTestScores?.BURNOUT;
  if (burnoutScore === void 0) return null;
  const level = getBurnoutLevel(burnoutScore);
  const entries = (history || []).slice().reverse();
  const W = 280, H = 70, PAD = 12;
  const plotW = W - PAD * 2, plotH = H - PAD;
  const maxY = 100, minY = 0;
  const toX = (i) => PAD + (entries.length > 1 ? i * (plotW / (entries.length - 1)) : plotW / 2);
  const toY = (v) => PAD + plotH - v / (maxY - minY) * plotH;
  const pts = entries.map((e, i) => ({ x: toX(i), y: toY(e.burnout_score ?? e.score), val: e.burnout_score ?? e.score, date: e.date }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F525}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, t("\uBC88\uC544\uC6C3 \uC9C0\uC218 \uCD94\uC774", "BURNOUT Score Trend")), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    background: level.bg,
    color: level.color,
    borderRadius: 100,
    padding: "2px 8px"
  } }, t("\uD604\uC7AC", "Current"), " ", burnoutScore, t("\uC810", "pts"), " \xB7 ", level.label)), /* @__PURE__ */ React.createElement("button", { onClick: handleToggle, style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: C.muted,
    fontWeight: 600,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC"))), expanded && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, animation: "fadeUp 0.3s ease" } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 } }, t("\uBD88\uB7EC\uC624\uB294 \uC911...", "Loading...")), !loading && history && entries.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 } }, t("\uC544\uC9C1 \uBC88\uC544\uC6C3 \uAC8C\uC784 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694.", "No BURNOUT game records yet."), /* @__PURE__ */ React.createElement("br", null), t("\uAC8C\uC784\uC744 \uD50C\uB808\uC774\uD558\uBA74 \uC810\uC218 \uBCC0\uD654\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694!", "Play the game to track score changes!")), !loading && entries.length >= 2 && /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 12,
    border: `1px solid ${level.color}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginBottom: 8 } }, t("\uBC88\uC544\uC6C3 \uC810\uC218 \uC774\uB825 (\uB0AE\uC744\uC218\uB85D \uAC74\uAC15)", "BURNOUT score history (lower is healthier)")), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } }, /* @__PURE__ */ React.createElement("rect", { x: PAD, y: PAD, width: plotW, height: toY(60) - PAD, fill: "#FEF3C7", opacity: "0.4", rx: "2" }), /* @__PURE__ */ React.createElement("rect", { x: PAD, y: toY(60), width: plotW, height: toY(40) - toY(60), fill: "#FFEDD5", opacity: "0.3", rx: "2" }), /* @__PURE__ */ React.createElement("line", { x1: PAD, y1: toY(60), x2: W - PAD, y2: toY(60), stroke: "#F59E0B", strokeWidth: "1", strokeDasharray: "3 2" }), /* @__PURE__ */ React.createElement("text", { x: W - PAD + 2, y: toY(60) + 3, fontSize: "7", fill: "#F59E0B" }, "60"), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: `${pathD} L ${pts[pts.length - 1].x} ${PAD + plotH} L ${pts[0].x} ${PAD + plotH} Z`,
      fill: `${level.color}18`,
      stroke: "none"
    }
  ), /* @__PURE__ */ React.createElement("path", { d: pathD, fill: "none", stroke: level.color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map((p, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("circle", { cx: p.x, cy: p.y, r: "3.5", fill: "white", stroke: level.color, strokeWidth: "2" }), /* @__PURE__ */ React.createElement("text", { x: p.x, y: H - 1, textAnchor: "middle", fontSize: "7", fill: "#C0C0C0" }, (/* @__PURE__ */ new Date(p.date + "T00:00:00")).toLocaleDateString(GAME_LANG === "en" ? "en-US" : "ko-KR", { month: "numeric", day: "numeric" })))), /* @__PURE__ */ React.createElement(
    "text",
    {
      x: pts[pts.length - 1].x,
      y: pts[pts.length - 1].y - 6,
      textAnchor: "middle",
      fontSize: "9",
      fontWeight: "bold",
      fill: level.color
    },
    pts[pts.length - 1].val
  )), pts.length >= 2 && (() => {
    const diff = pts[pts.length - 1].val - pts[pts.length - 2].val;
    return /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: 600,
      textAlign: "center",
      color: diff <= 0 ? "#52B788" : "#EF4444"
    } }, diff <= 0 ? t(`\u2705 \uC9C0\uB09C \uD68C \uB300\uBE44 ${Math.abs(diff)}\uC810 \uAC1C\uC120\uB410\uC5B4\uC694!`, `\u2705 Improved by ${Math.abs(diff)}pts from last time!`) : t(`\u26A0\uFE0F \uC9C0\uB09C \uD68C \uB300\uBE44 ${diff}\uC810 \uB192\uC544\uC84C\uC5B4\uC694. \uC26C\uC5B4\uAC00\uC138\uC694.`, `\u26A0\uFE0F Up by ${diff}pts from last time. Take a break.`));
  })()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, BURNOUT_LEVELS.map((l) => /* @__PURE__ */ React.createElement("div", { key: l.label, style: {
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 100,
    background: l.bg,
    color: l.color,
    fontWeight: 600
  } }, l.label, " ~", l.max, t("\uC810", "pts"))))));
}
const HISTORY_GAME_META = {
  mood: { name: t("\uAC10\uC815 \uC218\uCC44\uD654", "Emotion Watercolor"), emoji: "\u{1F60A}", color: "#6366F1" },
  garden: { name: t("\uB9C8\uC74C\uC758 \uC815\uC6D0", "Mind Garden"), emoji: "\u{1F33F}", color: "#22C55E" },
  efmt: { name: t("\uAC10\uC815\uAF43", "Emotion Flower"), emoji: "\u{1F338}", color: "#EC4899" },
  gratitude: { name: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude Journal"), emoji: "\u{1F64F}", color: "#F59E0B" },
  burnout: { name: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5", "BURNOUT Recovery"), emoji: "\u{1F50B}", color: "#F97316" },
  focus: { name: t("\uC9D1\uC911\uB825 \uD6C8\uB828", "Focus Training"), emoji: "\u{1F9E0}", color: "#0EA5E9" },
  worry: { name: t("\uAC71\uC815 \uD48D\uC120", "Worry Balloon"), emoji: "\u{1FAE7}", color: "#8B5CF6" },
  tree: { name: t("\uB9C8\uC74C \uB098\uBB34", "Mind Tree"), emoji: "\u{1F332}", color: "#16A34A" }
};
function GameHistorySection() {
  const [sessions, setSessions] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const handleToggle = () => {
    if (!expanded && !sessions) {
      setLoading(true);
      GameEngine.getRecentSessions(20).then((res) => {
        if (res.success) setSessions(res.data);
      }).finally(() => setLoading(false));
    }
    setExpanded((v) => !v);
  };
  return /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.6)" } }, /* @__PURE__ */ React.createElement("button", { onClick: handleToggle, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C5}"), " ", t("\uAC8C\uC784 \uD50C\uB808\uC774 \uC774\uB825", "Game Play History")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC"))), expanded && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 } }, t("\uBD88\uB7EC\uC624\uB294 \uC911...", "Loading...")), !loading && sessions && sessions.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 } }, t("\uC544\uC9C1 \uD50C\uB808\uC774 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694", "No play records yet")), !loading && sessions && sessions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, sessions.map((s, i) => {
    const meta = HISTORY_GAME_META[s.game_id] || { name: s.game_id, emoji: "\u{1F3AE}", color: "#6B7280" };
    const date = new Date(s.created_at);
    const locale = GAME_LANG === "en" ? "en-US" : "ko-KR";
    const dateStr = date.toLocaleDateString(locale, { month: "short", day: "numeric" });
    const timeStr = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const dur = s.duration_sec > 0 ? s.duration_sec >= 60 ? t(`${Math.floor(s.duration_sec / 60)}\uBD84`, `${Math.floor(s.duration_sec / 60)}m`) : t(`${s.duration_sec}\uCD08`, `${s.duration_sec}s`) : null;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 12, padding: "10px 14px", borderLeft: `3px solid ${meta.color}` } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, flexShrink: 0 } }, meta.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, meta.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 } }, dateStr, " ", timeStr, dur ? ` \xB7 ${dur}` : "")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, s.score > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: meta.color } }, s.score, t("\uC810", "pts")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, "+", s.exp_gained || 0, " EXP")));
  }))));
}
function AIDiarySection() {
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [noData, setNoData] = useState(false);
  async function loadDiary() {
    setLoading(true);
    try {
      const r = await GameEngine.apiFetch("/api/game/ai-diary");
      const d = await r.json();
      if (d.success) {
        setDiary(d.data.diary);
        setNoData(!!d.data.noData);
      }
    } catch {
    }
    setLoading(false);
    setChecked(true);
  }
  function share() {
    if (!diary) return;
    const text = t(`\u{1F4D4} \uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30
${diary}

\uB9C8\uC74C\uAC8C\uC784\uC5D0\uC11C \uAE30\uB85D\uD588\uC5B4\uC694 \u{1F33F} https://game.maumful.com`, `\u{1F4D4} Today's Mind Diary
${diary}

Recorded on Maumgame \u{1F33F} https://game.maumful.com`);
    if (navigator.share) {
      navigator.share({ title: t("\uB9C8\uC74C \uC77C\uAE30", "Mind Diary"), text }).catch(() => {
      });
    } else {
      navigator.clipboard?.writeText(text).then(() => alert(t("\uBCF5\uC0AC\uB410\uC5B4\uC694!", "Copied!")));
    }
  }
  if (!checked && !diary) {
    return /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: "1px solid rgba(0,0,0,.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4D4}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "#2D6A4F" } }, t("\uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30", "Today's Mind Diary"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: loadDiary,
        disabled: loading,
        style: { fontSize: 12, background: "#2D6A4F", color: "white", border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
      },
      loading ? t("\uC0DD\uC131 \uC911...", "Generating...") : t("\u270D\uFE0F \uC77C\uAE30 \uC0DD\uC131", "\u270D\uFE0F Generate Diary")
    )), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#9A9A9A", margin: 0 } }, t("\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uC744 \uBC14\uD0D5\uC73C\uB85C AI\uAC00 \uB9C8\uC74C \uC77C\uAE30\uB97C \uC791\uC131\uD574 \uB4DC\uB824\uC694.", "AI writes a mind diary based on your emotion records today.")));
  }
  if (noData) return null;
  if (!diary) return null;
  const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  return /* @__PURE__ */ React.createElement("div", { style: { background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: "1px solid #bbf7d0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4D4}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "#15803d" } }, t("\uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30", "Today's Mind Diary")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#86efac", marginLeft: 8 } }, todayStr))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: share,
      style: { fontSize: 11, background: "transparent", color: "#16a34a", border: "1px solid #86efac", borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    t("\uACF5\uC720 \u{1F517}", "Share \u{1F517}")
  )), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#166534", lineHeight: 1.7, margin: 0, fontStyle: "italic" } }, diary));
}
const MOOD_EMOJI_MAP = {
  happy: "\u{1F60A}",
  calm: "\u{1F60C}",
  tired: "\u{1F634}",
  anxious: "\u{1F630}",
  sad: "\u{1F622}",
  angry: "\u{1F624}",
  hopeful: "\u{1F31F}",
  bored: "\u{1F611}"
};
const DAY_LABELS = GAME_LANG === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
function TestSuggestionCard() {
  const [sug, setSug] = useState(null);
  useEffect(() => {
    GameEngine.getTestSuggestion().then((res) => {
      const s = res?.data?.suggestion;
      if (!s) return;
      const until = Number(localStorage.getItem("test_sug_dismissed_" + s.test) || 0);
      if (until > Date.now()) return;
      setSug(s);
    }).catch(() => {
    });
  }, []);
  if (!sug) return null;
  const dismiss = () => {
    localStorage.setItem("test_sug_dismissed_" + sug.test, String(Date.now() + 7 * 864e5));
    setSug(null);
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(135deg, rgba(74,124,89,0.10), rgba(107,168,128,0.06))",
    border: "1px solid rgba(74,124,89,0.22)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, lineHeight: 1 } }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 4 } }, t("\uB9C8\uC74C\uD480 \uAC80\uC0AC \uC81C\uC548", "A test that might help")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.7 } }, sug.why)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: dismiss,
      "aria-label": t("\uB2EB\uAE30", "Dismiss"),
      style: { background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: 2, lineHeight: 1 }
    },
    "\xD7"
  )), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: sug.url,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        display: "block",
        textAlign: "center",
        padding: "12px",
        background: C.sage,
        color: "white",
        borderRadius: 12,
        fontSize: 13.5,
        fontWeight: 700,
        textDecoration: "none",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    sug.name,
    " \xB7 ",
    sug.time,
    " \u2192"
  ));
}
function WeekMoodSummaryCard() {
  const [entries, setEntries] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    GameEngine.getMoodHistory(7).then((res) => {
      if (res.success) setEntries(res.data || []);
    }).catch(() => {
    }).finally(() => setLoaded(true));
  }, []);
  if (!loaded || !entries || entries.length === 0) return null;
  const byDay = {};
  entries.forEach((e) => {
    const d = new Date(e.recorded_at);
    const day = d.getDay();
    if (!byDay[day]) byDay[day] = e;
  });
  const today = /* @__PURE__ */ new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() - i + 7) % 7 - (today.getDay() < i ? 7 : 0));
    return { dayIdx: d.getDay(), date: d, entry: byDay[d.getDay()] };
  });
  const emotionCount = {};
  entries.forEach((e) => {
    emotionCount[e.emotion] = (emotionCount[e.emotion] || 0) + 1;
  });
  const dominant = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];
  const dominantEmoji = dominant ? MOOD_EMOJI_MAP[dominant[0]] || "\u{1F3A8}" : "\u{1F3A8}";
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 16,
    border: "1px solid rgba(255,255,255,0.6)",
    animation: "cardEnter .4s ease both"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, dominantEmoji, " ", t("\uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984", "This Week's Mood Flow")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, t(`${entries.length}\uC77C \uAE30\uB85D`, `${entries.length} days recorded`))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "space-between" } }, weekDays.map(({ dayIdx, date, entry }, i) => {
    const isToday = date.toDateString() === today.toDateString();
    const emoji = entry ? MOOD_EMOJI_MAP[entry.emotion] || "\u{1F3A8}" : null;
    const intensity = entry ? entry.intensity || 3 : 0;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: entry ? `hsla(${140 + (intensity - 1) * 20}, 50%, ${85 - intensity * 4}%, 0.9)` : "rgba(0,0,0,0.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      border: isToday ? `2px solid ${C.sage}` : "2px solid transparent",
      transition: "all .2s"
    } }, emoji || (isToday ? "\xB7" : "")), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 9,
      color: isToday ? C.sage : C.muted,
      fontWeight: isToday ? 700 : 400
    } }, DAY_LABELS[dayIdx]));
  })), dominant && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 10, textAlign: "center" } }, t("\uC774\uBC88 \uC8FC \uC8FC\uC694 \uAC10\uC815", "This week's dominant mood"), ":", " ", /* @__PURE__ */ React.createElement("span", { style: { color: C.dark, fontWeight: 600 } }, dominantEmoji, " ", dominant[0] === "happy" ? t("\uD589\uBCF5", "Happy") : dominant[0] === "calm" ? t("\uD3C9\uC628", "Calm") : dominant[0] === "tired" ? t("\uD53C\uACE4", "Tired") : dominant[0] === "anxious" ? t("\uBD88\uC548", "Anxious") : dominant[0] === "sad" ? t("\uC2AC\uD514", "Sad") : dominant[0]), " ", "(", t(`${dominant[1]}\uC77C`, `${dominant[1]} days`), ")"));
}
const EMOTION_DISPLAY = {
  happy: { emoji: "\u{1F60A}", label: t("\uD589\uBCF5", "Happy"), color: "#F59E0B" },
  calm: { emoji: "\u{1F60C}", label: t("\uD3C9\uC628", "Calm"), color: "#7BA88A" },
  tired: { emoji: "\u{1F634}", label: t("\uD53C\uACE4", "Tired"), color: "#9BA8B0" },
  anxious: { emoji: "\u{1F630}", label: t("\uBD88\uC548", "Anxious"), color: "#C4B5FD" },
  sad: { emoji: "\u{1F622}", label: t("\uC2AC\uD514", "Sad"), color: "#93C5FD" },
  angry: { emoji: "\u{1F624}", label: t("\uD654\uB0A8", "Angry"), color: "#FCA5A5" }
};
function EmotionWeeklyReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    GameEngine.getEmotionReport().then((res) => {
      if (res.success) setReportData(res.data);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  if (loading || !reportData?.report) return null;
  const entries = reportData.entries || [];
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F4CA}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, t("\uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984", "This Week's Mood Flow")), entries.length > 0 && /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 600,
    background: C.sagePale,
    color: C.sage,
    borderRadius: 100,
    padding: "2px 8px"
  } }, t(`${entries.length}\uC77C \uAE30\uB85D`, `${entries.length} days recorded`))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, expanded && reportData?.report && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const topEmotion = entries.length > 0 ? EMOTION_DISPLAY[entries[entries.length - 1]?.emotion] || { emoji: "\u{1F636}", label: entries[entries.length - 1]?.emotion } : null;
    const text = t(`\u{1F33F} \uC774\uBC88 \uC8FC \uB9C8\uC74C\uC758 \uC815\uC6D0
${topEmotion ? topEmotion.emoji + " " + topEmotion.label + " " : ""}${entries.length}\uC77C \uAC10\uC815 \uAE30\uB85D

${reportData.report.slice(0, 80)}...

#\uB9C8\uC74C\uD480 #\uB9C8\uC74C\uAC8C\uC784 #\uAC10\uC815\uAE30\uB85D`, `\u{1F33F} This Week's Mind Garden
${topEmotion ? topEmotion.emoji + " " + topEmotion.label + " " : ""}${entries.length} days recorded

${reportData.report.slice(0, 80)}...

#Maumful #MindGame #EmotionLog`);
    if (navigator.share) {
      navigator.share({ title: t("\uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984", "This Week's Mood Flow"), text }).catch(() => {
      });
    } else {
      navigator.clipboard?.writeText(text).then(() => alert(t("\uBCF5\uC0AC\uB410\uC5B4\uC694!", "Copied!"))).catch(() => {
      });
    }
  }, style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: C.muted,
    fontWeight: 600,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uACF5\uC720 \u{1F517}", "Share \u{1F517}")), /* @__PURE__ */ React.createElement("button", { onClick: () => setExpanded((v) => !v), style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: C.muted,
    fontWeight: 600,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, expanded ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC")))), expanded && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, animation: "fadeUp 0.3s ease" } }, entries.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 14
  } }, entries.map((e) => {
    const em = EMOTION_DISPLAY[e.emotion] || { emoji: "\u{1F636}", label: e.emotion, color: C.muted };
    return /* @__PURE__ */ React.createElement("div", { key: e.date, style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
      minWidth: 44,
      flexShrink: 0
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 38,
      height: 38,
      borderRadius: 100,
      background: em.color + "22",
      border: `2px solid ${em.color}44`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18
    } }, em.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: C.muted, textAlign: "center" } }, (/* @__PURE__ */ new Date(e.date + "T00:00:00")).toLocaleDateString(GAME_LANG === "en" ? "en-US" : "ko-KR", { month: "numeric", day: "numeric" })), /* @__PURE__ */ React.createElement("div", { style: {
      width: 4 + e.intensity * 1.5,
      height: 4 + e.intensity * 1.5,
      borderRadius: 100,
      background: em.color,
      opacity: 0.3 + e.intensity * 0.14
    } }));
  })), /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
    borderRadius: 14,
    padding: "14px 16px",
    border: `1px solid ${C.sage}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: C.sage, marginBottom: 6, letterSpacing: "0.5px" } }, "\u{1F916} ", t("AI \uAC10\uC815 \uD328\uD134 \uBD84\uC11D", "AI Emotion Pattern Analysis")), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    color: C.dark,
    lineHeight: 1.75,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, reportData.report), reportData.cached && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: C.muted, marginTop: 6 } }, t("\uC774\uBC88 \uC8FC \uBD84\uC11D \xB7 \uB9E4\uC8FC \uC6D4\uC694\uC77C \uAC31\uC2E0", "This week's analysis \xB7 Updated every Monday")))));
}
const GAME_META = {
  garden: { name: t("\uB9C8\uC74C\uC758 \uC815\uC6D0", "Mind Garden"), emoji: "\u{1F33F}" },
  mood: { name: t("\uAC10\uC815 \uC218\uCC44\uD654", "Emotion Watercolor"), emoji: "\u{1F3A8}" },
  efmt: { name: t("\uAC10\uC815\uAF43 \uCC3E\uAE30", "Emotion Flower"), emoji: "\u{1F338}" },
  gratitude: { name: t("\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30", "Starlight Gratitude"), emoji: "\u2B50" },
  tree: { name: t("\uB0B4\uBA74\uC758 \uB098\uBB34", "Inner Tree"), emoji: "\u{1F333}" },
  burnout: { name: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5", "BURNOUT Recovery"), emoji: "\u26A1" },
  focus: { name: t("\uB9C8\uC74C \uC9D1\uC911\uB825", "Mind Focus"), emoji: "\u{1F9E0}" },
  worry: { name: t("\uAC71\uC815 \uD48D\uC120", "Worry Balloon"), emoji: "\u{1FAE7}" }
};
function TodayRecommendCard({ hubData, onPlay }) {
  if (!hubData) return null;
  const { userTestScores = {}, gameStatus, recentSessions = [], isMaster } = hubData;
  const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
  const level = isMaster ? 6 : levelInfo.level;
  const recentIds = recentSessions.slice(0, 5).map((s) => s.game_id);
  const phq9 = userTestScores.PHQ9;
  const burnout = userTestScores.BURNOUT;
  let rec = null;
  const gad7 = userTestScores.GAD7;
  if (phq9 !== void 0 && phq9 >= 15) {
    rec = { gameId: "garden", reason: t(`PHQ-9 ${phq9}\uC810 \u2014 \uC9C0\uAE08 \uD638\uD761 \uD6C8\uB828\uC774 \uB9C8\uC74C\uC744 \uC548\uC815\uC2DC\uCF1C\uC918\uC694`, `PHQ-9 ${phq9}pts \u2014 Breathing training will calm your mind`), color: C.dusty };
  } else if (gad7 !== void 0 && gad7 >= 10) {
    rec = { gameId: "worry", reason: t(`GAD-7 ${gad7}\uC810 \u2014 \uBD88\uC548\uD55C \uC0DD\uAC01\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uB0B4\uB824\uB193\uC544\uC694 \u{1FAE7}`, `GAD-7 ${gad7}pts \u2014 Release anxious thoughts into a balloon \u{1FAE7}`), color: "#7B9ED9" };
  } else if (burnout !== void 0 && burnout >= 60 && level >= 2) {
    rec = { gameId: "burnout", reason: t(`\uBC88\uC544\uC6C3 \uC9C0\uC218 ${burnout}\uC810 \u2014 \uC624\uB298 \uD68C\uBCF5 \uBBF8\uC158\uC744 \uC2DC\uC791\uD574\uBCF4\uC138\uC694`, `BURNOUT score ${burnout}pts \u2014 Start a recovery mission today`), color: C.amber };
  } else if (!recentIds.includes("mood")) {
    rec = { gameId: "mood", reason: t("\uC624\uB298 \uAC10\uC815 \uAE30\uB85D\uC744 \uC544\uC9C1 \uC548 \uD588\uC5B4\uC694 \u270D\uFE0F", "You haven't recorded your emotions today \u270D\uFE0F"), color: C.sage };
  } else if (phq9 !== void 0 && phq9 >= 5) {
    rec = { gameId: "worry", reason: t("\uB9C8\uC74C\uC18D \uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uB0A0\uB824 \uBCF4\uB0BC\uAE4C\uC694? \u{1FAE7}", "Float away your worries in a balloon? \u{1FAE7}"), color: "#7B9ED9" };
  } else if (level >= 2 && !recentIds.includes("efmt")) {
    rec = { gameId: "efmt", reason: t("\uAC10\uC815\uAF43 \uCC3E\uAE30\uB85C \uAC10\uC815 \uC778\uC2DD\uB825\uC744 \uD0A4\uC6CC\uBCF4\uC138\uC694 \u{1F338}", "Build emotional awareness with Emotion Flower \u{1F338}"), color: "#C97B8A" };
  } else if (level >= 2 && !recentIds.includes("gratitude")) {
    rec = { gameId: "gratitude", reason: t("\uC624\uB298\uC758 \uAC10\uC0AC \uC77C\uAE30\uB97C \uC368\uBCFC\uAE4C\uC694? \u2B50", "Write today's gratitude journal? \u2B50"), color: C.amber };
  } else if (!recentIds.includes("worry")) {
    rec = { gameId: "worry", reason: t("\uAC71\uC815 \uD48D\uC120\uC73C\uB85C \uB9C8\uC74C\uC18D \uC9D0\uC744 \uAC00\uBCCD\uAC8C \uD574\uBCF4\uC138\uC694 \u{1FAE7}", "Lighten your mental load with Worry Balloon \u{1FAE7}"), color: "#7B9ED9" };
  } else {
    rec = { gameId: "garden", reason: t("\uC7A0\uAE50 \uD638\uD761\uC744 \uAC00\uB2E4\uB4EC\uACE0 \uC815\uC6D0\uC744 \uAC00\uAFD4\uBCFC\uAE4C\uC694? \u{1F33F}", "Take a breath and tend your garden? \u{1F33F}"), color: C.sage };
  }
  const game = GAME_META[rec.gameId];
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${rec.color}12, rgba(255,255,255,0.82))`,
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: `1px solid ${rec.color}28`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: rec.color, marginBottom: 10, letterSpacing: "0.5px" } }, "\u2728 ", t("\uC624\uB298\uC758 \uCD94\uCC9C", "Today's Pick")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 52,
    height: 52,
    borderRadius: 16,
    flexShrink: 0,
    background: `linear-gradient(135deg, ${rec.color}22, ${rec.color}10)`,
    border: `1.5px solid ${rec.color}33`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26
  } }, game.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 3 } }, game.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: C.muted, lineHeight: 1.5 } }, rec.reason)), /* @__PURE__ */ React.createElement("button", { onClick: () => onPlay?.(rec.gameId), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: `linear-gradient(135deg, ${rec.color}, ${rec.color}BB)`,
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "9px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0
  } }, t("\uC2DC\uC791 \u2192", "Start \u2192"))));
}
const QUEST_POOL = [
  { id: "play_mood", game: "mood", module: "checkin", text: t("\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30", "Record today's emotion"), emoji: "\u{1F3A8}", exp: 15 },
  { id: "play_breathing", game: "garden", module: "breathing", text: t("\uD638\uD761 \uD6C8\uB828 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", "Complete one breathing training"), emoji: "\u{1F4A7}", exp: 20 },
  { id: "play_cbt", game: "garden", module: "cbt", text: t("\uC0DD\uAC01 \uAD50\uC815 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", "Complete one thought reframing"), emoji: "\u{1F331}", exp: 20 },
  { id: "play_gratitude", game: "gratitude", module: "gratitude_write", text: t("\uAC10\uC0AC \uC77C\uAE30 \uC4F0\uAE30", "Write a gratitude journal"), emoji: "\u2B50", exp: 20 },
  { id: "play_efmt", game: "efmt", module: "efmt_easy", text: t("\uAC10\uC815\uAF43 \uCC3E\uAE30 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", "Complete one Emotion Flower session"), emoji: "\u{1F338}", exp: 20, minLevel: 2 },
  { id: "play_burnout", game: "burnout", module: "missions", text: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5 \uBBF8\uC158 \uC644\uB8CC\uD558\uAE30", "Complete a BURNOUT recovery mission"), emoji: "\u26A1", exp: 20, minLevel: 2 },
  { id: "play_tree", game: "tree", module: "roots", text: t("\uB0B4\uBA74\uC758 \uB098\uBB34 \uD0D0\uD5D8\uD558\uAE30", "Explore the Inner Tree"), emoji: "\u{1F333}", exp: 25, minLevel: 4 },
  { id: "play_focus", game: "focus", module: "focus_training", text: t("\uC9D1\uC911\uB825 \uD6C8\uB828 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", "Complete one focus training session"), emoji: "\u{1F9E0}", exp: 20, minLevel: 3 },
  { id: "play_any", game: null, module: null, text: t("\uC544\uBB34 \uAC8C\uC784\uC774\uB098 \uD55C \uBC88 \uD50C\uB808\uC774\uD558\uAE30", "Play any game once"), emoji: "\u{1F3AE}", exp: 10 }
];
function getDailyQuests(level = 1, userId = 0) {
  const now = /* @__PURE__ */ new Date();
  const dateSeed = now.getFullYear() * 1e4 + (now.getMonth() + 1) * 100 + now.getDate();
  let s = dateSeed * 31337 + (userId || 1);
  const rand = () => {
    s = s * 1103515245 + 1013904223 & 2147483647;
    return s / 2147483647;
  };
  const eligible = QUEST_POOL.filter((q) => !q.minLevel || level >= q.minLevel);
  const pool = [...eligible];
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
function DailyQuestCard({ todaySessions = [], level = 1, userId = 0, streakRecover = 0, onPlay, onBonusClaimed }) {
  const todayKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [bonusDone, setBonusDone] = useState(() => localStorage.getItem("quest_bonus_" + todayKey) === "1");
  const [bonusClaiming, setBonusClaiming] = useState(false);
  const quests = getDailyQuests(level, userId);
  const isQuestDone = (q) => {
    if (!q.game) return todaySessions.length > 0;
    return todaySessions.some((s) => s.game_id === q.game && (!q.module || s.module_type === q.module));
  };
  const doneCount = quests.filter(isQuestDone).length;
  const allDone = doneCount === quests.length;
  const claimBonus = async () => {
    if (bonusDone || !allDone || bonusClaiming) return;
    setBonusClaiming(true);
    try {
      await GameEngine.saveSession({ gameId: "daily_quest", moduleType: "daily_quest_bonus", score: 50, durationSec: 0, metadata: { date: todayKey } });
      localStorage.setItem("quest_bonus_" + todayKey, "1");
      setBonusDone(true);
      onBonusClaimed?.();
    } finally {
      setBonusClaiming(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark } }, t("\uC624\uB298\uC758 \uD018\uC2A4\uD2B8", "Today's Quests")), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    background: allDone ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
    color: allDone ? "white" : C.sage,
    borderRadius: 100,
    padding: "2px 9px"
  } }, doneCount, " / ", quests.length)), allDone && !bonusDone && /* @__PURE__ */ React.createElement("button", { onClick: claimBonus, disabled: bonusClaiming, style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
    color: "white",
    border: "none",
    borderRadius: 100,
    padding: "5px 14px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer"
  } }, bonusClaiming ? "..." : "\u{1F381} +50 EXP"), bonusDone && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.sage, fontWeight: 700 } }, "\u2713 ", t("\uBCF4\uB108\uC2A4 \uD68D\uB4DD!", "Bonus earned!"), streakRecover > 0 && ` \u{1F6E1}\uFE0F${streakRecover}`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, quests.map((q) => {
    const done = isQuestDone(q);
    return /* @__PURE__ */ React.createElement("div", { key: q.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 12,
      background: done ? C.sagePale : "rgba(0,0,0,0.03)",
      border: `1px solid ${done ? C.sage + "33" : "rgba(0,0,0,0.06)"}`
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, q.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 12,
      fontWeight: done ? 700 : 500,
      color: done ? C.sage : C.dark,
      textDecoration: done ? "line-through" : "none"
    } }, q.text), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: C.muted } }, "+", q.exp, " EXP")), done ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u2705") : q.game && /* @__PURE__ */ React.createElement("button", { onClick: () => onPlay?.(q.game), style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      background: `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "5px 12px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    } }, t("\uC2DC\uC791 \u2192", "Start \u2192")));
  })));
}
function OnboardingOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      emoji: "\u{1F33F}",
      title: t("\uB9C8\uC74C\uC758 \uC815\uC6D0\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD574\uC694", "Welcome to Mind Garden"),
      body: t("\uB9C8\uC74C\uD480\uC758 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uB3D9\uD558\uC5EC \uB098\uB9CC\uC758 \uCE58\uC720 \uACF5\uAC04\uC744 \uAC00\uAFB8\uB294 \uAC8C\uC784 \uD50C\uB7AB\uD3FC\uC774\uC5D0\uC694. \uAC8C\uC784\uC744 \uC990\uAE30\uBA70 \uB9C8\uC74C\uC744 \uB3CC\uBCF4\uC138\uC694.", "A healing game platform linked to your Maumful psych test results. Enjoy games and care for your mind.")
    },
    {
      emoji: "\u{1F331}",
      title: t("\uB808\uBCA8\uC5C5\uC73C\uB85C \uC0C8 \uAC8C\uC784\uC744 \uD574\uAE08\uD574\uC694", "Level up to unlock new games"),
      body: t("\uAC8C\uC784\uC744 \uD50C\uB808\uC774\uD558\uBA74 EXP\uAC00 \uC313\uC5EC \uB808\uBCA8\uC5C5\uD574\uC694. \uB808\uBCA8 2\uBD80\uD130 \uAC10\uC815\uAF43 \uCC3E\uAE30\xB7\uBC88\uC544\uC6C3 \uD68C\uBCF5 \uB4F1 \uB354 \uB9CE\uC740 \uAC8C\uC784\uC774 \uC5F4\uB9BD\uB2C8\uB2E4.", "Playing games earns EXP and levels you up. From level 2, more games like Emotion Flower and BURNOUT Recovery unlock.")
    },
    {
      emoji: "\u{1F3A8}",
      title: t("\uBA3C\uC800 \uC624\uB298\uC758 \uAC10\uC815\uC744 \uAE30\uB85D\uD574\uBCFC\uAE4C\uC694?", "Let's record today's emotion first!"),
      body: t("\uAC10\uC815 \uC218\uCC44\uD654\uB294 \uB9E4\uC77C \uB0B4 \uAC10\uC815\uC744 \uAE30\uB85D\uD558\uB294 \uAE30\uCD08 \uAC8C\uC784\uC774\uC5D0\uC694. \uB808\uBCA8 1\uBD80\uD130 \uBB34\uB8CC\uB85C \uC990\uAE38 \uC218 \uC788\uC5B4\uC694!", "Emotion Watercolor is a basic game to record your daily emotions. Free from level 1!")
    }
  ];
  const isLast = step === steps.length - 1;
  const s = steps[step];
  const dismiss = () => {
    localStorage.setItem("onboarding_done", "1");
    onDone?.();
  };
  const handleNext = () => {
    if (isLast) dismiss();
    else setStep((v) => v + 1);
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2e3,
    padding: 20,
    backdropFilter: "blur(4px)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 24,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 380,
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "fadeUp 0.3s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, marginBottom: 16 } }, s.emoji), /* @__PURE__ */ React.createElement("h2", { style: {
    fontSize: 18,
    fontWeight: 700,
    color: C.dark,
    marginBottom: 12,
    fontFamily: "'Noto Serif KR', serif",
    lineHeight: 1.5
  } }, s.title), /* @__PURE__ */ React.createElement("p", { style: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.8,
    marginBottom: 24,
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, s.body), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 } }, steps.map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: i === step ? 20 : 8,
    height: 8,
    borderRadius: 100,
    background: i === step ? C.sage : C.sagePale,
    transition: "all 0.3s"
  } }))), /* @__PURE__ */ React.createElement("button", { onClick: handleNext, style: {
    fontFamily: "'Noto Sans KR', sans-serif",
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    background: `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
    color: "white",
    border: "none",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: `0 8px 24px ${C.sage}44`
  } }, isLast ? t("\u{1F33F} \uC815\uC6D0 \uD0D0\uD5D8 \uC2DC\uC791\uD558\uAE30", "\u{1F33F} Start Exploring") : t("\uB2E4\uC74C \u2192", "Next \u2192")), /* @__PURE__ */ React.createElement("button", { onClick: dismiss, style: {
    fontFamily: "'Noto Sans KR', sans-serif",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: C.muted,
    marginTop: 10,
    padding: "4px 0",
    display: "block",
    width: "100%"
  } }, t("\uAC74\uB108\uB6F0\uAE30", "Skip"))));
}
function GameHubApp() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [newAchievements, setNewAchievements] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [creditModal, setCreditModal] = useState(null);
  const [spendLoading, setSpendLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [counselingPrompt, setCounselingPrompt] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const isLoggedIn = !!localStorage.getItem("game_token");
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const fallback = setTimeout(() => setLoading(false), 1e4);
    GameEngine.getMe().then((res) => {
      if (res.success) {
        setData(res.data);
        if ((res.data.gameStatus?.total_exp || 0) === 0 && !localStorage.getItem("onboarding_done")) {
          setShowOnboarding(true);
        }
      } else setError(res.error || t("\uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328", "Failed to load data"));
    }).catch(() => setError(t("\uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328", "Server connection failed"))).finally(() => {
      clearTimeout(fallback);
      setLoading(false);
    });
    return () => clearTimeout(fallback);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get("game");
    if (!gameParam) return;
    const valid = ["garden", "efmt", "gratitude", "tree", "burnout", "mood", "focus", "worry"];
    if (!valid.includes(gameParam)) return;
    const timer = setTimeout(() => {
      setActiveGame(gameParam);
      const url = new URL(window.location.href);
      url.searchParams.delete("game");
      window.history.replaceState({}, "", url.toString());
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  const handlePlay = useCallback(async (gameId) => {
    const game = getGameById(gameId);
    if (!game) return;
    if (!game.creditCost || game.creditCost <= 0) {
      setActiveGame(gameId);
      return;
    }
    try {
      const res = await GameEngine.getCredits();
      const balance = res.success ? res.data.balance : data?.user?.credits || 0;
      setCreditModal({ gameId, cost: game.creditCost, balance, gameName: game.name, gameEmoji: game.emoji });
    } catch {
      const balance = data?.user?.credits || 0;
      setCreditModal({ gameId, cost: game.creditCost, balance, gameName: game.name, gameEmoji: game.emoji });
    }
  }, [data]);
  const handleGameExit = useCallback((result) => {
    const gid = activeGame;
    setActiveGame(null);
    setCreditModal(null);
    const burnoutTestScore = data?.userTestScores?.BURNOUT ?? 0;
    const phq9TestScore = data?.userTestScores?.PHQ9 ?? 0;
    if (gid === "burnout" && burnoutTestScore >= 60) {
      const lvl = getBurnoutLevel(burnoutTestScore);
      setCounselingPrompt({
        emoji: "\u{1F525}",
        level: lvl.label,
        color: lvl.color,
        msg: t(`\uBC88\uC544\uC6C3 \uC810\uC218\uAC00 ${burnoutTestScore}\uC810(${lvl.label})\uC774\uC5D0\uC694. \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uC774\uC57C\uAE30\uD574\uBCF4\uC138\uC694.`, `Your BURNOUT score is ${burnoutTestScore}pts (${lvl.label}). Consider speaking with a counselor.`)
      });
    } else if (gid === "mood" && result?.metadata?.intensity >= 4 && ["angry", "anxious", "sad"].includes(result?.metadata?.mood)) {
      setCounselingPrompt({
        emoji: "\u{1F499}",
        level: t("\uAC10\uC815 \uC8FC\uC758", "Emotion Alert"),
        color: "#6366F1",
        msg: t("\uAC15\uD55C \uBD80\uC815 \uAC10\uC815\uC774 \uAC10\uC9C0\uB410\uC5B4\uC694. \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uB300\uD654\uD574\uBCF4\uB294 \uAC74 \uC5B4\uB5A8\uAE4C\uC694?", "Strong negative emotions detected. How about talking to a counselor?")
      });
    } else if (phq9TestScore >= 10 && ["burnout", "mood", "garden"].includes(gid)) {
      setCounselingPrompt({
        emoji: "\u{1F331}",
        level: t("PHQ-9 \uC8FC\uC758", "PHQ-9 Alert"),
        color: "#0EA5E9",
        msg: t(`PHQ-9 \uC810\uC218(${phq9TestScore}\uC810)\uB85C \uBCF4\uC544 \uC804\uBB38 \uC0C1\uB2F4\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC5B4\uC694.`, `Based on your PHQ-9 score (${phq9TestScore}pts), professional counseling may help.`)
      });
    }
    GameEngine.getMe().then((res) => {
      if (res.success) setData(res.data);
      if (result?.newAchievements?.length) setNewAchievements(result.newAchievements);
    });
    if (gid && result?.score !== void 0) {
      const meta = HISTORY_GAME_META[gid] || { emoji: "\u{1F3AE}" };
      GameEngine.getSessionFeedback(gid, result.score || 0, result.moduleType || gid).then((res) => {
        if (res.success && res.data?.feedback) {
          setSessionFeedback({ gameId: gid, score: result.score, feedback: res.data.feedback, emoji: meta.emoji });
          setTimeout(() => setSessionFeedback(null), 8e3);
        }
      }).catch(() => {
      });
    }
  }, [activeGame, data]);
  const handleCreditConfirm = useCallback(async () => {
    if (!creditModal) return;
    const { gameId, cost, balance } = creditModal;
    if (balance < cost) return;
    setSpendLoading(true);
    try {
      const res = await GameEngine.spendCredit(gameId, cost);
      if (res.success) {
        setData((prev) => prev ? { ...prev, user: { ...prev.user, credits: res.data.balance } } : prev);
        setCreditModal(null);
        setActiveGame(gameId);
      } else if (res.errorCode === "insufficient_credits") {
        setCreditModal((prev) => ({ ...prev, balance: res.balance, insufficient: true }));
      } else {
        alert(res.error || t("\uD06C\uB808\uB527 \uCC28\uAC10 \uC2E4\uD328. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "Credit deduction failed. Please try again."));
      }
    } catch {
      alert(t("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "Network error. Please try again."));
    }
    setSpendLoading(false);
  }, [creditModal]);
  if (!isLoggedIn) return /* @__PURE__ */ React.createElement(LoginGate, null);
  if (loading) return /* @__PURE__ */ React.createElement(GameHubSkeleton, null);
  if (activeGame === "mood") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(MoodGame, { onExit: handleGameExit }));
  if (activeGame === "garden") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(GardenGame, { userTestScores: data?.userTestScores || {}, onExit: handleGameExit }));
  if (activeGame === "efmt") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(EFMTGame, { onExit: handleGameExit }));
  if (activeGame === "gratitude") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(GratitudeGame, { onExit: handleGameExit }));
  if (activeGame === "tree") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(TreeGame, { onExit: handleGameExit }));
  if (activeGame === "burnout") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(BurnoutGame, { userTestResults: data?.userTestScores || {}, onSessionEnd: handleGameExit }));
  if (activeGame === "focus") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(FocusGame, { onExit: handleGameExit }));
  if (activeGame === "worry") return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(WorryGame, { onExit: handleGameExit }));
  if (error) return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: C.cream,
    padding: 24,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F327}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: C.muted, marginBottom: 20 } }, error), /* @__PURE__ */ React.createElement("a", { href: PHYWEB_URL, style: {
    padding: "10px 24px",
    background: C.sage,
    color: "white",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, t("\uB9C8\uC74C\uD480\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30", "Back to Maumful")));
  const { user, gameStatus, recentSessions, completedTests, achievements } = data || {};
  const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
  const gardenTheme = GameEngine.getGardenTheme(gameStatus?.visual_status || "clearing");
  const isMaster = data?.isMaster || false;
  const games = isMaster ? getPlayableGames(completedTests, 6).map((g) => ({ ...g, canPlay: true, isUnlocked: true, hasRequiredTests: true })) : getPlayableGames(completedTests, gameStatus?.garden_level || 1);
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.sagePale} 0%, ${C.cream} 40%, #EBF4FA 100%)` } }, counselingPrompt && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3e3,
    padding: 20
  }, onClick: () => setCounselingPrompt(null) }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    maxWidth: 340,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
  }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 8 } }, counselingPrompt.emoji), /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    color: counselingPrompt.color,
    background: counselingPrompt.color + "18",
    borderRadius: 100,
    padding: "3px 12px",
    marginBottom: 12
  } }, counselingPrompt.level), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: "#1A1A1A", lineHeight: 1.6, margin: 0 } }, counselingPrompt.msg)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: PHYWEB_URL + "?go=counseling",
      style: {
        display: "block",
        textAlign: "center",
        padding: "13px",
        background: counselingPrompt.color,
        color: "white",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        textDecoration: "none",
        fontFamily: "'Noto Sans KR',sans-serif"
      }
    },
    "\u{1F3E0} ",
    t("\uC804\uBB38 \uC0C1\uB2F4\uC0AC \uC5F0\uACB0\uD558\uAE30", "Connect with a Counselor")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setCounselingPrompt(null),
      style: {
        padding: "11px",
        background: "#F5F5F5",
        color: "#666",
        border: "none",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR',sans-serif"
      }
    },
    t("\uAD1C\uCC2E\uC544\uC694, \uACC4\uC18D \uAC8C\uC784\uD560\uAC8C\uC694", "I'm fine, continue playing")
  )))), /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(253,252,247,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(74,124,89,0.12)",
    padding: "0 20px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" } }, t("\uB9C8\uC74C\uC758 \uC815\uC6D0", "Mind Garden"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    fontWeight: 600,
    color: C.sage,
    background: C.sagePale,
    padding: "4px 12px",
    borderRadius: 100
  } }, "Lv.", levelInfo.level, " ", levelInfo.emoji), /* @__PURE__ */ React.createElement("a", { href: PHYWEB_URL, style: {
    fontSize: 12,
    color: C.muted,
    textDecoration: "none",
    padding: "5px 12px",
    borderRadius: 8,
    border: `1px solid rgba(0,0,0,0.08)`,
    background: "rgba(255,255,255,0.6)"
  } }, "\u2190 ", t("\uB9C8\uC74C\uD480", "Maumful")))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 680, margin: "0 auto", padding: "24px 20px 40px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    marginBottom: 24,
    background: "white"
  } }, /* @__PURE__ */ React.createElement("div", { style: { height: 200, position: "relative" } }, /* @__PURE__ */ React.createElement(GardenSVG, { status: gameStatus?.visual_status || "clearing", level: levelInfo.level }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 12,
    left: 16,
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
    padding: "6px 14px",
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 600,
    color: C.dark,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  } }, gardenTheme.label), (gameStatus?.streak_days || 0) > 1 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    padding: "5px 12px",
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    color: C.amber,
    display: "flex",
    alignItems: "center",
    gap: 5
  } }, "\u{1F525} ", t(`${gameStatus.streak_days}\uC77C \uC5F0\uC18D`, `${gameStatus.streak_days}-Day Streak`))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 } }, t(`\uC548\uB155\uD558\uC138\uC694, ${user?.nickname || user?.email?.split("@")[0]}\uB2D8 \u{1F44B}`, `Hello, ${user?.nickname || user?.email?.split("@")[0]} \u{1F44B}`), isMaster && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: "#2D6A4F", color: "white", borderRadius: 6, padding: "2px 8px", fontWeight: 700, marginLeft: 6 } }, "MASTER")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: C.muted } }, gardenTheme.desc)), /* @__PURE__ */ React.createElement("button", { onClick: toggleGameLang, title: "Language", style: { flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.muted, cursor: "pointer", padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.7)" } }, GAME_LANG === "en" ? "\uD55C" : "EN")), /* @__PURE__ */ React.createElement(DailyTip, { hubData: data }), /* @__PURE__ */ React.createElement(LevelBar, { levelInfo }), /* @__PURE__ */ React.createElement(
    StreakCalendar,
    {
      recentPlayDates: data?.recentPlayDates || [],
      streakDays: gameStatus?.streak_days || 0,
      streakRecover: gameStatus?.streak_recover || 0,
      onRecover: () => GameEngine.getMe().then((res) => {
        if (res.success) setData(res.data);
      })
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement(TestBadgeRow, { completedTests: completedTests || [] })), /* @__PURE__ */ React.createElement(TestSuggestionCard, null), /* @__PURE__ */ React.createElement(BurnoutTrendSection, { userTestScores: data?.userTestScores }), /* @__PURE__ */ React.createElement(WeekMoodSummaryCard, null), /* @__PURE__ */ React.createElement(AIDiarySection, null), /* @__PURE__ */ React.createElement(EmotionWeeklyReport, null), /* @__PURE__ */ React.createElement(TodayRecommendCard, { hubData: data, onPlay: handlePlay }), /* @__PURE__ */ React.createElement(
    DailyQuestCard,
    {
      todaySessions: data?.todaySessions || [],
      level: levelInfo.level,
      userId: user?.id || 0,
      streakRecover: gameStatus?.streak_recover || 0,
      onPlay: handlePlay,
      onBonusClaimed: () => GameEngine.getMe().then((res) => {
        if (res.success) setData(res.data);
      })
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F3AE}"), " ", t("\uCE58\uC720 \uAC8C\uC784", "Healing Games")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }, className: "game-grid" }, games.map((game, i) => /* @__PURE__ */ React.createElement(GameCard, { key: game.id, game, onPlay: handlePlay, enterDelay: i * 50 })))), /* @__PURE__ */ React.createElement(CampaignSection, { onPlay: handlePlay }), /* @__PURE__ */ React.createElement(GameHistorySection, null), /* @__PURE__ */ React.createElement(GameStatsSection, null), /* @__PURE__ */ React.createElement(
    AchievementPanel,
    {
      earned: achievements || [],
      isMaster
    }
  ), /* @__PURE__ */ React.createElement(RecentActivity, { sessions: recentSessions || [] }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 32 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowLeaderboard((v) => !v),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        borderRadius: 20,
        padding: "16px 20px",
        border: "1px solid rgba(255,255,255,0.6)",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR',sans-serif"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F3C6}"), " ", t("\uC815\uC6D0\uC0AC \uC21C\uC704", "Gardener Rankings")),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.muted } }, showLeaderboard ? t("\uC811\uAE30 \u25B2", "Collapse \u25B2") : t("\uD3BC\uCE58\uAE30 \u25BC", "Expand \u25BC"))
  ), showLeaderboard && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(Leaderboard, { currentUserEmail: user?.email })))), creditModal && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3,
    padding: 20
  }, onClick: (e) => {
    if (e.target === e.currentTarget) setCreditModal(null);
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 22,
    padding: "28px 24px",
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
    animation: "fadeUp 0.3s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 10 } }, creditModal.gameEmoji), /* @__PURE__ */ React.createElement("h3", { style: {
    fontSize: 18,
    fontWeight: 700,
    color: "#2C2C20",
    marginBottom: 6,
    fontFamily: "'Noto Serif KR', sans-serif"
  } }, creditModal.gameName), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#8A8A78", lineHeight: 1.6 } }, t("\uC774 \uAC8C\uC784\uC740 \uD50C\uB808\uC774 \uC2DC \uD06C\uB808\uB527\uC774 \uCC28\uAC10\uB429\uB2C8\uB2E4", "Credits will be deducted to play this game"))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F5EFE0",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 18
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#8A8A78" } }, t("\uD604\uC7AC \uD06C\uB808\uB527", "Current Credits")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "#2C2C20" } }, creditModal.balance, " ", t("\uD06C\uB808\uB527", "Credits"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#8A8A78" } }, t("\uCC28\uAC10 \uC608\uC815", "To be deducted")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "#D4954A" } }, "- ", creditModal.cost, " ", t("\uD06C\uB808\uB527", "Credits"))), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "rgba(0,0,0,0.08)", margin: "10px 0" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "#2C2C20" } }, t("\uCC28\uAC10 \uD6C4 \uC794\uC561", "Balance after")), /* @__PURE__ */ React.createElement("span", { style: {
    fontWeight: 700,
    color: creditModal.balance >= creditModal.cost ? "#4A7C59" : "#C05050"
  } }, Math.max(0, creditModal.balance - creditModal.cost), " ", t("\uD06C\uB808\uB527", "Credits")))), (creditModal.insufficient || creditModal.balance < creditModal.cost) && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FEF2F2",
    border: "1px solid rgba(192,80,80,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 14,
    fontSize: 12,
    color: "#C05050",
    lineHeight: 1.6
  } }, t("\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD574\uC694. \uB9C8\uC74C\uD480\uC5D0\uC11C \uD06C\uB808\uB527\uC744 \uCDA9\uC804\uD55C \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "Insufficient credits. Please recharge on Maumful and try again.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setCreditModal(null), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    flex: 1,
    padding: "12px",
    background: "rgba(0,0,0,0.07)",
    color: "#8A8A78",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  } }, t("\uCDE8\uC18C", "Cancel")), creditModal.balance < creditModal.cost ? /* @__PURE__ */ React.createElement("a", { href: PHYWEB_URL, style: {
    flex: 2,
    padding: "12px",
    textAlign: "center",
    background: `linear-gradient(135deg, #D4954A, #E8C47A)`,
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uD06C\uB808\uB527 \uCDA9\uC804\uD558\uAE30 \u2192", "Recharge Credits \u2192")) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreditConfirm,
      disabled: spendLoading,
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        flex: 2,
        padding: "12px",
        background: spendLoading ? "rgba(0,0,0,0.1)" : "linear-gradient(135deg, #4A7C59, #7BA88A)",
        color: spendLoading ? "#8A8A78" : "white",
        border: "none",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 700,
        cursor: spendLoading ? "not-allowed" : "pointer"
      }
    },
    spendLoading ? t("\uCC98\uB9AC \uC911...", "Processing...") : t(`${creditModal.cost} \uD06C\uB808\uB527\uC73C\uB85C \uC2DC\uC791`, `Start with ${creditModal.cost} Credits`)
  )))), newAchievements.length > 0 && /* @__PURE__ */ React.createElement(AchievementToast, { achievements: newAchievements, onDismiss: () => setNewAchievements([]) }), sessionFeedback && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    bottom: 80,
    left: "50%",
    transform: "translateX(-50%)",
    background: "white",
    borderRadius: 20,
    padding: "16px 20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    maxWidth: 340,
    width: "calc(100% - 48px)",
    zIndex: 1e3,
    border: "1px solid rgba(74,124,89,0.15)",
    animation: "fadeUp 0.4s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, flexShrink: 0, lineHeight: 1.2 } }, sessionFeedback.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: C.sage, marginBottom: 4 } }, t("\uAC8C\uC784 \uC644\uB8CC! \u{1F389}", "Game Complete! \u{1F389}")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#374151", lineHeight: 1.6 } }, sessionFeedback.feedback)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSessionFeedback(null),
      style: { fontSize: 16, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 }
    },
    "\u2715"
  ))), showOnboarding && /* @__PURE__ */ React.createElement(OnboardingOverlay, { onDone: () => setShowOnboarding(false) }), /* @__PURE__ */ React.createElement("style", null, `
        @media (max-width: 480px) {
          .game-grid { grid-template-columns: 1fr !important; }
        }
      `));
}
const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(React.createElement(GameHubApp));
}
