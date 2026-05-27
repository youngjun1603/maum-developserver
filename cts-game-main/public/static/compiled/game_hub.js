"use strict";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
const { useState, useEffect, useRef, useCallback } = React;
const C = {
  sage: "#6B21A8",
  sageL: "#A78BFA",
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
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 320 200", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%", ...style }, children: [
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs("linearGradient", { id: "skyGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: theme.skyTop }),
        /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: theme.skyBot })
      ] }),
      /* @__PURE__ */ jsxs("linearGradient", { id: "groundGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: theme.ground }),
        /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: theme.groundDark })
      ] }),
      /* @__PURE__ */ jsx("filter", { id: "softBlur", children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "2" }) }),
      /* @__PURE__ */ jsx("filter", { id: "fogBlur", children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "4" }) })
    ] }),
    /* @__PURE__ */ jsx("rect", { width: "320", height: "200", fill: "url(#skyGrad)" }),
    theme.sunVisible && /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx("circle", { cx: "260", cy: "38", r: "22", fill: C.amberL, opacity: "0.9" }),
      /* @__PURE__ */ jsx("circle", { cx: "260", cy: "38", r: "17", fill: "#FFE08A" }),
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => /* @__PURE__ */ jsx(
        "line",
        {
          x1: 260 + Math.cos(a * Math.PI / 180) * 20,
          y1: 38 + Math.sin(a * Math.PI / 180) * 20,
          x2: 260 + Math.cos(a * Math.PI / 180) * 27,
          y2: 38 + Math.sin(a * Math.PI / 180) * 27,
          stroke: "#FFE08A",
          strokeWidth: "2",
          strokeLinecap: "round"
        },
        a
      ))
    ] }),
    status !== "foggy" && /* @__PURE__ */ jsxs("g", { opacity: "0.85", children: [
      /* @__PURE__ */ jsx("ellipse", { cx: "80", cy: "55", rx: "28", ry: "14", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "95", cy: "48", rx: "18", ry: "12", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "65", cy: "52", rx: "16", ry: "10", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "195", cy: "40", rx: "22", ry: "11", fill: "white", opacity: "0.75" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "208", cy: "34", rx: "14", ry: "9", fill: "white", opacity: "0.75" })
    ] }),
    theme.birdsVisible && /* @__PURE__ */ jsxs("g", { fill: "none", stroke: C.dusty, strokeWidth: "1.5", strokeLinecap: "round", children: [
      /* @__PURE__ */ jsx("path", { d: "M 150 50 Q 154 46 158 50" }),
      /* @__PURE__ */ jsx("path", { d: "M 162 44 Q 166 40 170 44" }),
      /* @__PURE__ */ jsx("path", { d: "M 130 62 Q 133 58 136 62" })
    ] }),
    /* @__PURE__ */ jsx("ellipse", { cx: "160", cy: "185", rx: "190", ry: "30", fill: "url(#groundGrad)" }),
    /* @__PURE__ */ jsx("rect", { x: "0", y: "172", width: "320", height: "28", fill: theme.groundDark }),
    status !== "foggy" && /* @__PURE__ */ jsx("g", { fill: theme.ground, opacity: "0.8", children: [30, 55, 90, 130, 190, 230, 265, 290].map((x, i) => /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx("line", { x1: x, y1: "172", x2: x - 4, y2: 162 - i % 3 * 4, stroke: theme.treeLeaf, strokeWidth: "2", strokeLinecap: "round" }),
      /* @__PURE__ */ jsx("line", { x1: x, y1: "172", x2: x + 3, y2: 163 - i % 2 * 5, stroke: theme.treeLeaf, strokeWidth: "2", strokeLinecap: "round" })
    ] }, x)) }),
    /* @__PURE__ */ jsx("rect", { x: "152", y: "110", width: "16", height: "62", rx: "5", fill: theme.treeTrunk }),
    /* @__PURE__ */ jsx("rect", { x: "155", y: "128", width: "10", height: "44", rx: "3", fill: theme.treeTrunk, opacity: "0.6" }),
    leafCount >= 1 && /* @__PURE__ */ jsx("ellipse", { cx: "160", cy: "105", rx: "30", ry: "26", fill: theme.treeLeaf, opacity: "0.95" }),
    leafCount >= 2 && /* @__PURE__ */ jsx("ellipse", { cx: "142", cy: "115", rx: "22", ry: "18", fill: theme.treeLeaf, opacity: "0.9" }),
    leafCount >= 3 && /* @__PURE__ */ jsx("ellipse", { cx: "178", cy: "113", rx: "22", ry: "19", fill: theme.treeLeaf, opacity: "0.9" }),
    leafCount >= 4 && /* @__PURE__ */ jsx("ellipse", { cx: "160", cy: "88", rx: "22", ry: "18", fill: theme.treeLeaf, opacity: "0.85" }),
    leafCount >= 5 && /* @__PURE__ */ jsx("ellipse", { cx: "145", cy: "97", rx: "16", ry: "14", fill: theme.treeLeaf, opacity: "0.8" }),
    leafCount >= 6 && /* @__PURE__ */ jsx("ellipse", { cx: "175", cy: "96", rx: "16", ry: "13", fill: theme.treeLeaf, opacity: "0.8" }),
    theme.flowersVisible && /* @__PURE__ */ jsx("g", { children: [{ x: 60, c: "#F9A8D4" }, { x: 100, c: "#FCD34D" }, { x: 200, c: "#86EFAC" }, { x: 240, c: "#F9A8D4" }, { x: 280, c: "#FCD34D" }].map(({ x, c }, i) => level >= i ? /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx("circle", { cx: x, cy: "170", r: "5", fill: c, opacity: "0.95" }),
      /* @__PURE__ */ jsx("circle", { cx: x - 5, cy: "167", r: "3.5", fill: c, opacity: "0.8" }),
      /* @__PURE__ */ jsx("circle", { cx: x + 5, cy: "167", r: "3.5", fill: c, opacity: "0.8" }),
      /* @__PURE__ */ jsx("circle", { cx: x, cy: "163", r: "3.5", fill: c, opacity: "0.8" }),
      /* @__PURE__ */ jsx("circle", { cx: x, cy: "170", r: "3", fill: "#FFF", opacity: "0.7" })
    ] }, x) : null) }),
    theme.fogOpacity > 0 && /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx("rect", { width: "320", height: "200", fill: C.fogGray, opacity: theme.fogOpacity, filter: "url(#fogBlur)" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "80", cy: "170", rx: "120", ry: "40", fill: C.fogGray, opacity: theme.fogOpacity * 0.8, filter: "url(#fogBlur)" }),
      /* @__PURE__ */ jsx("ellipse", { cx: "240", cy: "165", rx: "100", ry: "35", fill: C.fogGray, opacity: theme.fogOpacity * 0.7, filter: "url(#fogBlur)" })
    ] })
  ] });
}
function LevelBar({ levelInfo }) {
  const { level, name, emoji, progress, currentExp, maxExp } = levelInfo || {};
  return /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px", background: "rgba(255,255,255,0.7)", borderRadius: 16, backdropFilter: "blur(8px)" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 22 }, children: emoji }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark }, children: [
            "Lv.",
            level,
            " ",
            name
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
            "\uB2E4\uC74C \uB808\uBCA8\uAE4C\uC9C0 ",
            maxExp - currentExp,
            " EXP"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: C.sage }, children: [
        currentExp,
        " EXP"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 100, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: {
      height: "100%",
      width: `${progress}%`,
      background: `linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
      borderRadius: 100,
      transition: "width 1s ease",
      boxShadow: `0 0 8px ${C.sage}60`
    } }) })
  ] });
}
const TEST_META_HUB = {
  PHQ9: { label: "PHQ-9", emoji: "\u{1F331}", desc: "\uC6B0\uC6B8 \uC120\uBCC4" },
  GAD7: { label: "GAD-7", emoji: "\u{1F499}", desc: "\uBD88\uC548 \uC120\uBCC4" },
  DASS21: { label: "DASS-21", emoji: "\u{1F30A}", desc: "\uC2A4\uD2B8\uB808\uC2A4" },
  BIG5: { label: "Big5", emoji: "\u{1F9E0}", desc: "\uC131\uACA9 \uBD84\uC11D" },
  SCT: { label: "SCT", emoji: "\u270D\uFE0F", desc: "\uBB38\uC7A5 \uC644\uC131" },
  DSI: { label: "DSI", emoji: "\u{1FA9E}", desc: "\uC790\uC544 \uBD84\uD654" },
  BURNOUT: { label: "K-MBI+", emoji: "\u{1F525}", desc: "\uBC88\uC544\uC6C3" },
  LOST: { label: "LOST", emoji: "\u{1F9ED}", desc: "\uD589\uB3D9 \uC591\uC2DD" }
};
function TestBadgeRow({ completedTests = [] }) {
  const allTests = Object.keys(TEST_META_HUB);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, letterSpacing: "0.5px" }, children: "\uC5F0\uACB0\uB41C \uC2EC\uB9AC\uAC80\uC0AC" }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 }, children: allTests.map((t) => {
      const meta = TEST_META_HUB[t];
      const done = completedTests.includes(t);
      return /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 100,
        background: done ? C.sagePale : "rgba(0,0,0,0.05)",
        border: `1px solid ${done ? C.sage + "44" : "transparent"}`,
        opacity: done ? 1 : 0.5
      }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13 }, children: meta.emoji }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted }, children: meta.label }),
        done && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: C.sage }, children: "\u2713" })
      ] }, t);
    }) }),
    completedTests.length === 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: 10, fontSize: 12, color: C.muted, lineHeight: 1.6 }, children: [
      "\uC2EC\uB9AC\uAC80\uC0AC\uB97C \uC644\uB8CC\uD558\uBA74 \uAC8C\uC784\uC774 \uB354 \uD48D\uC131\uD574\uC838\uC694.",
      " ",
      /* @__PURE__ */ jsx("a", { href: PHYWEB_URL, style: { color: C.sage, fontWeight: 600, textDecoration: "none" }, children: "The Light of Life\uC5D0\uC11C \uAC80\uC0AC\uD558\uAE30 \u2192" })
    ] })
  ] });
}
function GameCardSkeleton() {
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: "24px 20px 20px",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: 42, height: 42, borderRadius: 10, marginBottom: 12 } }),
    /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "65%", height: 14, borderRadius: 7, marginBottom: 8 } }),
    /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "90%", height: 11, borderRadius: 6, marginBottom: 4 } }),
    /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "70%", height: 11, borderRadius: 6, marginBottom: 16 } }),
    /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "50%", height: 28, borderRadius: 9 } })
  ] });
}
function GameHubSkeleton() {
  return /* @__PURE__ */ jsxs("div", { style: {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${C.sagePale}, ${C.cream})`
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "hub-top-bar" }),
    /* @__PURE__ */ jsxs("div", { style: {
      height: 60,
      background: "rgba(255,255,255,0.6)",
      backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${C.sagePale}`,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 12
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: 32, height: 32, borderRadius: "50%" } }),
      /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: 120, height: 14, borderRadius: 7 } }),
      /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
      /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: 60, height: 28, borderRadius: 9 } })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.6)", borderRadius: 24, padding: "20px 20px", marginBottom: 20, height: 160 }, children: [
        /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "60%", height: 18, borderRadius: 9, marginBottom: 12 } }),
        /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "80%", height: 12, borderRadius: 6, marginBottom: 8 } }),
        /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: "40%", height: 12, borderRadius: 6 } })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u{1F3AE}" }),
        /* @__PURE__ */ jsx("div", { className: "skeleton-shimmer", style: { width: 70, height: 14, borderRadius: 7 } })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }, children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsx(GameCardSkeleton, {}, i)) })
    ] })
  ] });
}
function GameCard({ game, onPlay, enterDelay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const locked = !game.canPlay;
  const comingSoon = !game.isAvailable;
  const cardBg = locked ? "rgba(255,255,255,0.5)" : hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";
  return /* @__PURE__ */ jsxs(
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
      },
      children: [
        comingSoon && /* @__PURE__ */ jsx("div", { style: {
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
        }, children: "\uC900\uBE44 \uC911" }),
        !comingSoon && !game.isUnlocked && /* @__PURE__ */ jsxs("div", { style: {
          position: "absolute",
          top: 12,
          right: 12,
          background: C.sand,
          color: C.amber,
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: 100
        }, children: [
          "Lv.",
          game.unlockLevel,
          " \uD574\uAE08"
        ] }),
        /* @__PURE__ */ jsx("div", { style: {
          fontSize: 42,
          marginBottom: 12,
          lineHeight: 1,
          filter: locked ? "grayscale(0.5)" : "none",
          animation: !locked && hovered ? "float 2s ease-in-out infinite" : "none"
        }, children: game.emoji }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 }, children: game.name }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }, children: game.tagline }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }, children: game.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsx("span", { style: {
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 100,
          background: C.sagePale,
          color: C.sage,
          fontWeight: 500
        }, children: tag }, tag)) }),
        /* @__PURE__ */ jsx("div", { style: {
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
          color: game.creditCost > 0 ? "#D4954A" : "#6B21A8"
        }, children: game.creditCost > 0 ? `\u{1F33F} ${game.creditCost} \uD06C\uB808\uB527` : "\uBB34\uB8CC" }),
        game.requiredTests.length > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.dusty, marginBottom: 12 }, children: [
          game.requiredTests.map((t) => TEST_META_HUB[t]?.label || t).join(" \xB7 "),
          " \uC5F0\uB3D9"
        ] }),
        game.modules?.length > 0 && !comingSoon && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }, children: game.modules.map((m) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.muted }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14 }, children: m.emoji }),
          /* @__PURE__ */ jsx("span", { children: m.name })
        ] }, m.id)) }),
        /* @__PURE__ */ jsx(
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
            },
            children: comingSoon ? "\uACE7 \uCD9C\uC2DC\uB429\uB2C8\uB2E4" : locked ? "\u{1F512} \uC7A0\uAE08 \uD574\uC81C \uD544\uC694" : "\uC2DC\uC791\uD558\uAE30 \u2192"
          }
        )
      ]
    }
  );
}
function StreakCalendar({ recentPlayDates = [], streakDays = 0, streakRecover = 0, onRecover }) {
  const [recovering, setRecovering] = useState(false);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"][d.getDay()];
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
  return /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px", background: "rgba(255,255,255,0.7)", borderRadius: 16, backdropFilter: "blur(8px)" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 }, children: "\u{1F4C5} \uCD5C\uADFC 7\uC77C \uCD9C\uC11D" }),
      streakDays > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, fontWeight: 700, color: C.amber, display: "flex", alignItems: "center", gap: 4 }, children: [
        fireEmoji,
        " ",
        streakDays,
        "\uC77C \uC5F0\uC18D"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, justifyContent: "space-between", marginBottom: 12 }, children: days.map(({ iso, dow, played }) => /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: C.muted, fontWeight: 500 }, children: dow }),
      /* @__PURE__ */ jsx("div", { style: {
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
      }, children: played ? "\u{1F33F}" : "" })
    ] }, iso)) }),
    nextMilestone && /* @__PURE__ */ jsxs("div", { style: { marginBottom: streakRecover > 0 && streakDays === 0 ? 10 : 0 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 4 }, children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "\uB2E4\uC74C \uBAA9\uD45C: ",
          nextMilestone,
          "\uC77C \uC5F0\uC18D \u{1F3C5}"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          streakDays,
          " / ",
          nextMilestone,
          "\uC77C"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { height: 5, borderRadius: 10, background: "rgba(0,0,0,0.07)", overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: {
        height: "100%",
        borderRadius: 10,
        transition: "width 0.5s",
        width: `${milestoneProgress}%`,
        background: `linear-gradient(90deg, ${C.amber}, ${C.amberL})`
      } }) }),
      (hitMilestone) => null
    ] }),
    streakRecover > 0 && streakDays === 0 && /* @__PURE__ */ jsx("button", { onClick: handleRecover, disabled: recovering, style: {
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
    }, children: recovering ? "\uBCF5\uAD6C \uC911..." : `\u{1F6E1}\uFE0F \uBCF5\uAD6C\uAD8C \uC0AC\uC6A9\uD558\uC5EC \uC2A4\uD2B8\uB9AD \uBCF5\uC6D0 (${streakRecover}\uAC1C \uBCF4\uC720)` }),
    streakRecover > 0 && streakDays > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: 8, fontSize: 10, color: C.amber, fontWeight: 600, textAlign: "right" }, children: [
      "\u{1F6E1}\uFE0F \uBCF5\uAD6C\uAD8C ",
      streakRecover,
      "\uAC1C \uBCF4\uC720 (\uC5F0\uC18D \uB04A\uAE38 \uB54C \uC790\uB3D9 \uC0AC\uC6A9 \uAC00\uB2A5)"
    ] })
  ] });
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
  if (loading) return /* @__PURE__ */ jsx("div", { style: {
    background: "rgba(255,255,255,0.5)",
    borderRadius: 14,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.5)",
    backdropFilter: "blur(8px)"
  }, children: /* @__PURE__ */ jsx("div", { style: {
    fontSize: 12,
    color: C.muted,
    animation: "pulse 1.5s infinite",
    fontFamily: "'Noto Sans KR',sans-serif"
  }, children: "\u{1F916} \uC624\uB298\uC758 \uCF54\uCE58 \uBA54\uC2DC\uC9C0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..." }) });
  if (!tip) return null;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: `linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
    borderRadius: 14,
    padding: "13px 16px",
    border: `1px solid ${C.sage}25`,
    backdropFilter: "blur(8px)"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.sage, marginBottom: 5, letterSpacing: "0.5px" }, children: "\u{1F916} \uC624\uB298\uC758 \uCF54\uCE58 \uBA54\uC2DC\uC9C0" }),
    /* @__PURE__ */ jsx("div", { style: {
      fontSize: 13,
      color: C.dark,
      lineHeight: 1.65,
      fontWeight: 500,
      fontFamily: "'Noto Sans KR',sans-serif"
    }, children: tip })
  ] });
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
  if (loading) return /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "20px 0" }, children: /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.muted, animation: "pulse 1.5s infinite" }, children: "\uC21C\uC704\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..." }) });
  if (!data?.length) return /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }, children: "\uC544\uC9C1 \uC21C\uC704 \uB370\uC774\uD130\uAC00 \uC5C6\uC5B4\uC694" });
  const MEDAL = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: data.map((entry, i) => {
    const levelInfo = GameEngine.getLevelInfo(entry.total_exp || 0);
    const isMe = entry.email && currentUserEmail && entry.email === currentUserEmail;
    const rank = MEDAL[i] || `${i + 1}.`;
    return /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 12,
      background: isMe ? C.sagePale : "rgba(255,255,255,0.7)",
      border: `1px solid ${isMe ? C.sage + "44" : "rgba(255,255,255,0.5)"}`,
      backdropFilter: "blur(6px)",
      boxShadow: isMe ? `0 2px 12px ${C.sage}20` : "none"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 18, minWidth: 28, textAlign: "center", fontWeight: 700 }, children: rank }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 14 }, children: levelInfo.emoji }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 5 }, children: [
          entry.nickname || entry.email?.split("@")[0] || "\uC815\uC6D0\uC0AC",
          isMe && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, background: C.sage, color: "white", borderRadius: 4, padding: "1px 5px" }, children: "\uB098" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
          "Lv.",
          entry.garden_level,
          " ",
          levelInfo.name,
          (entry.streak_days || 0) > 1 && ` \xB7 \u{1F525} ${entry.streak_days}\uC77C`
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: C.sage }, children: (entry.total_exp || 0).toLocaleString() }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: C.muted }, children: "EXP" })
      ] })
    ] }, i);
  }) });
}
function RecentActivity({ sessions = [] }) {
  if (sessions.length === 0) return null;
  const MODULE_LABEL = {
    breathing: { emoji: "\u{1F4A7}", name: "\uD638\uD761 \uD6C8\uB828" },
    cbt: { emoji: "\u{1F331}", name: "\uC0DD\uAC01 \uAD50\uC815" },
    efmt: { emoji: "\u{1F338}", name: "\uAC10\uC815 \uD6C8\uB828" },
    relax: { emoji: "\u{1F3DE}\uFE0F", name: "\uC774\uC644 \uD6C8\uB828" },
    missions: { emoji: "\u{1F3AF}", name: "\uD68C\uBCF5 \uBBF8\uC158" },
    city: { emoji: "\u{1F3D9}\uFE0F", name: "\uD68C\uBCF5 \uB3C4\uC2DC" },
    weekly_report: { emoji: "\u{1F4CA}", name: "\uC8FC\uAC04 \uB9AC\uD3EC\uD2B8" },
    checkin: { emoji: "\u{1F3A8}", name: "\uAC10\uC815 \uCCB4\uD06C\uC778" },
    daily_quest_bonus: { emoji: "\u{1F381}", name: "\uB370\uC77C\uB9AC \uD018\uC2A4\uD2B8 \uBCF4\uB108\uC2A4" }
  };
  return /* @__PURE__ */ jsxs("div", { style: { marginTop: 32 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F4DC}" }),
      " \uCD5C\uADFC \uD50C\uB808\uC774 \uAE30\uB85D"
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: sessions.map((s, i) => {
      const m = MODULE_LABEL[s.module_type] || { emoji: "\u{1F3AE}", name: s.module_type };
      return /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.5)"
      }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 20 }, children: m.emoji }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.dark }, children: m.name }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.muted }, children: GameEngine.formatRelativeTime(s.created_at) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: C.sage }, children: [
            "+",
            s.exp_gained,
            " EXP"
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
            "\uC810\uC218 ",
            s.score
          ] })
        ] })
      ] }, i);
    }) })
  ] });
}
function LoginGate() {
  return /* @__PURE__ */ jsxs("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${C.sagePale}, ${C.cream}, #EBF4FA)`,
    padding: 24,
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 72, marginBottom: 20, animation: "float 3s ease-in-out infinite" }, children: "\u{1F33F}" }),
    /* @__PURE__ */ jsx("h1", { style: { fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" }, children: "\uB9C8\uC74C\uC758 \uC815\uC6D0" }),
    /* @__PURE__ */ jsxs("p", { style: { fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 32, maxWidth: 300 }, children: [
      "The Light of Life\uC5D0\uC11C \uB85C\uADF8\uC778\uD558\uBA74",
      /* @__PURE__ */ jsx("br", {}),
      "\uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.",
      /* @__PURE__ */ jsx("br", {}),
      "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uACB0\uD558\uC5EC",
      /* @__PURE__ */ jsx("br", {}),
      "\uB098\uB9CC\uC758 \uC815\uC6D0\uC744 \uAC00\uAFB8\uC138\uC694 \u{1F33F}"
    ] }),
    /* @__PURE__ */ jsx("a", { href: PHYWEB_URL, style: {
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
    }, children: "The Light of Life \uB85C\uADF8\uC778\uD558\uACE0 \uC2DC\uC791\uD558\uAE30 \u2192" })
  ] });
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
    title: "\uCCAB \uBC1C\uAC78\uC74C",
    subtitle: "\uB9C8\uC74C \uCC59\uAE30\uAE30",
    emoji: "\u{1F331}",
    color: "#6B21A8",
    colorLight: "#EAF2EC",
    desc: "\uB098\uC758 \uAC10\uC815\uC744 \uC54C\uC544\uCC44\uACE0 \uB9C8\uC74C\uC744 \uB3CC\uBCF4\uB294 \uCCAB \uC5EC\uC815\uC744 \uC2DC\uC791\uD574\uC694",
    steps: [
      { game: "mood", module: "checkin", name: "\uAC10\uC815 \uC218\uCC44\uD654 \u2014 \uC624\uB298 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30", emoji: "\u{1F3A8}" },
      { game: "garden", module: "breathing", name: "\uB9C8\uC74C\uC758 \uC815\uC6D0 \u2014 \uD638\uD761 \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F4A7}" },
      { game: "gratitude", module: "gratitude_write", name: "\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30 \u2014 \uAC10\uC0AC \uC77C\uAE30 \uC4F0\uAE30", emoji: "\u2B50" }
    ],
    rewardCredits: 30,
    rewardBadge: "\u{1F331}",
    rewardName: "\uB9C8\uC74C \uC528\uC557",
    unlockLevel: 1
  },
  {
    id: "ch2",
    title: "\uB9C8\uC74C \uAD50\uC815",
    subtitle: "\uC778\uC9C0 \uD6C8\uB828",
    emoji: "\u{1F338}",
    color: "#C97B8A",
    colorLight: "#FAE8EC",
    desc: "\uBD80\uC815\uC801\uC778 \uC0DD\uAC01 \uD328\uD134\uC744 \uC778\uC2DD\uD558\uACE0 \uAC10\uC815 \uC778\uC9C0 \uB2A5\uB825\uC744 \uD0A4\uC6CC\uC694",
    steps: [
      { game: "garden", module: "cbt", name: "\uB9C8\uC74C\uC758 \uC815\uC6D0 \u2014 \uC0DD\uAC01 \uAD50\uC815 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F331}" },
      { game: "efmt", module: null, name: "\uAC10\uC815\uAF43 \uCC3E\uAE30 \u2014 \uAC10\uC815 \uC778\uC2DD \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F338}" },
      { game: "burnout", module: "missions", name: "\uBC88\uC544\uC6C3 \uD68C\uBCF5 \u2014 \uD68C\uBCF5 \uBBF8\uC158 \uC644\uB8CC\uD558\uAE30", emoji: "\u26A1" }
    ],
    rewardCredits: 50,
    rewardBadge: "\u{1F338}",
    rewardName: "\uB9C8\uC74C \uAF43\uBD09\uC624\uB9AC",
    unlockLevel: 2
  },
  {
    id: "ch3",
    title: "\uAE4A\uC740 \uC131\uC7A5",
    subtitle: "\uC790\uC544 \uD0D0\uD5D8",
    emoji: "\u{1F333}",
    color: "#5A9BBF",
    colorLight: "#E8F4FA",
    desc: "\uC9D1\uC911\uB825\uACFC \uB0B4\uBA74\uC758 \uB098\uBB34\uB97C \uD1B5\uD574 \uC790\uC544\uB97C \uAE4A\uC774 \uD0D0\uD5D8\uD574\uC694",
    steps: [
      { game: "focus", module: null, name: "\uB9C8\uC74C \uC9D1\uC911\uB825 \u2014 \uC9D1\uC911\uB825 \uD6C8\uB828 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F9E0}" },
      { game: "tree", module: null, name: "\uB0B4\uBA74\uC758 \uB098\uBB34 \u2014 \uC790\uC544 \uD0D0\uD5D8\uD558\uAE30", emoji: "\u{1F333}" },
      { game: "efmt", module: null, name: "\uAC10\uC815\uAF43 \uCC3E\uAE30 \u2014 \uAC10\uC815 \uC778\uC2DD \uC7AC\uB3C4\uC804\uD558\uAE30", emoji: "\u{1F4AD}" }
    ],
    rewardCredits: 80,
    rewardBadge: "\u{1F333}",
    rewardName: "\uB9C8\uC74C \uB9CC\uAC1C",
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
        alert(res.error || "\uBCF4\uC0C1 \uC218\uB839 \uC2E4\uD328");
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
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 24 }, children: [
    /* @__PURE__ */ jsxs("button", { onClick: handleToggle, style: {
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
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F4D6}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 700, color: C.dark }, children: "\uC2A4\uD1A0\uB9AC \uCEA0\uD398\uC778" }),
        rewardedCount > 0 && /* @__PURE__ */ jsxs("span", { style: {
          fontSize: 11,
          fontWeight: 700,
          background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
          color: "white",
          borderRadius: 100,
          padding: "2px 9px"
        }, children: [
          rewardedCount,
          " / ",
          CAMPAIGN_DEF.length,
          " \uC644\uB8CC"
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: C.muted }, children: expanded ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { style: {
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(8px)",
      borderRadius: "0 0 20px 20px",
      padding: "4px 20px 20px",
      border: "1px solid rgba(255,255,255,0.6)",
      borderTop: "none"
    }, children: [
      loading && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "24px", color: C.muted, fontSize: 13 }, children: "\uBD88\uB7EC\uC624\uB294 \uC911..." }),
      claimResult && /* @__PURE__ */ jsxs("div", { style: {
        margin: "12px 0 16px",
        background: `linear-gradient(135deg, ${C.amber}22, ${C.amberL}22)`,
        border: `1px solid ${C.amber}44`,
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: "fadeUp 0.3s ease"
      }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 24 }, children: "\u{1F389}" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: C.amber }, children: "\uCC55\uD130 \uBCF4\uC0C1 \uC218\uB839 \uC644\uB8CC!" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.muted }, children: [
            "+",
            claimResult.credits,
            " \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB410\uC5B4\uC694"
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setClaimResult(null), style: {
          marginLeft: "auto",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          color: C.muted
        }, children: "\u2715" })
      ] }),
      !loading && data && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }, children: CAMPAIGN_DEF.map((ch, idx) => {
        const serverCh = data.chapters[idx];
        const locked = isChapterLocked(idx);
        const rewarded = serverCh?.rewarded || false;
        const allDone = serverCh?.allDone || false;
        const stepsDone = serverCh?.stepsDone || ch.steps.map(() => false);
        const doneCount = stepsDone.filter(Boolean).length;
        const canClaim = allDone && !rewarded && !locked;
        return /* @__PURE__ */ jsxs("div", { style: {
          borderRadius: 18,
          overflow: "hidden",
          border: rewarded ? `2px solid ${ch.color}44` : locked ? "1px solid rgba(0,0,0,0.06)" : `1px solid ${ch.color}28`,
          background: rewarded ? `${ch.colorLight}` : locked ? "rgba(0,0,0,0.02)" : "white",
          opacity: locked ? 0.6 : 1,
          transition: "all 0.3s"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: {
            padding: "14px 16px",
            background: rewarded ? `linear-gradient(135deg, ${ch.color}22, ${ch.colorLight})` : locked ? "rgba(0,0,0,0.02)" : `linear-gradient(135deg, ${ch.color}12, white)`,
            display: "flex",
            alignItems: "center",
            gap: 12
          }, children: [
            /* @__PURE__ */ jsx("div", { style: {
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
            }, children: locked ? "\u{1F512}" : rewarded ? "\u2705" : ch.emoji }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 700, color: locked ? C.muted : C.dark }, children: ch.title }),
                /* @__PURE__ */ jsx("span", { style: {
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 100,
                  background: rewarded ? `${ch.color}22` : `rgba(0,0,0,0.06)`,
                  color: rewarded ? ch.color : C.muted
                }, children: ch.subtitle })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.muted, lineHeight: 1.4 }, children: ch.desc })
            ] }),
            !locked && !rewarded && /* @__PURE__ */ jsxs("div", { style: {
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              color: allDone ? ch.color : C.muted
            }, children: [
              doneCount,
              "/",
              ch.steps.length
            ] })
          ] }),
          !locked && /* @__PURE__ */ jsxs("div", { style: { padding: "10px 16px", display: "flex", flexDirection: "column", gap: 7 }, children: [
            ch.steps.map((step, si) => {
              const done = stepsDone[si] || false;
              return /* @__PURE__ */ jsxs("div", { style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: done ? `${ch.color}12` : "rgba(0,0,0,0.03)",
                border: `1px solid ${done ? ch.color + "28" : "transparent"}`
              }, children: [
                /* @__PURE__ */ jsx("span", { style: {
                  fontSize: 16,
                  filter: done ? "none" : "grayscale(0.5) opacity(0.6)"
                }, children: step.emoji }),
                /* @__PURE__ */ jsx("div", { style: { flex: 1, minWidth: 0 }, children: /* @__PURE__ */ jsx("div", { style: {
                  fontSize: 12,
                  fontWeight: done ? 600 : 400,
                  color: done ? C.dark : C.muted,
                  textDecoration: done ? "none" : "none"
                }, children: step.name }) }),
                done ? /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: ch.color }, children: "\u2713" }) : /* @__PURE__ */ jsx("button", { onClick: () => onPlay?.(step.game), style: {
                  fontFamily: "'Noto Sans KR',sans-serif",
                  background: `linear-gradient(135deg, ${ch.color}CC, ${ch.color}99)`,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer"
                }, children: "\uD558\uAE30 \u2192" })
              ] }, step.game + si);
            }),
            /* @__PURE__ */ jsxs("div", { style: {
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 12,
              background: rewarded ? `${ch.color}15` : canClaim ? `linear-gradient(135deg, ${C.amber}18, ${C.amberL}18)` : "rgba(0,0,0,0.03)",
              border: `1px solid ${rewarded ? ch.color + "30" : canClaim ? C.amber + "44" : "rgba(0,0,0,0.06)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: rewarded ? ch.color : canClaim ? C.amber : C.muted }, children: rewarded ? `\u2705 ${ch.rewardBadge} ${ch.rewardName} \uD68D\uB4DD!` : `\u{1F381} \uCC55\uD130 \uC644\uB8CC \uBCF4\uC0C1: +${ch.rewardCredits} \uD06C\uB808\uB527 \xB7 ${ch.rewardBadge} ${ch.rewardName}` }),
                rewarded && /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: C.muted, marginTop: 2 }, children: "\uBCF4\uC0C1\uC774 \uC9C0\uAE09\uB410\uC5B4\uC694" })
              ] }),
              canClaim && /* @__PURE__ */ jsx(
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
                  },
                  children: claiming === ch.id ? "..." : "\uBCF4\uC0C1 \uBC1B\uAE30 \u{1F381}"
                }
              )
            ] })
          ] }),
          locked && /* @__PURE__ */ jsx("div", { style: { padding: "10px 16px 14px", textAlign: "center", fontSize: 12, color: C.muted }, children: "\uC774\uC804 \uCC55\uD130\uB97C \uC644\uB8CC\uD558\uBA74 \uD574\uAE08\uB3FC\uC694" })
        ] }, ch.id);
      }) })
    ] })
  ] });
}
const STATS_GAME_META = {
  garden: { name: "\uB9C8\uC74C \uC815\uC6D0", emoji: "\u{1F33F}" },
  mood: { name: "\uAC10\uC815 \uCCB4\uD06C\uC778", emoji: "\u{1F3A8}" },
  efmt: { name: "\uAC10\uC815 \uD0D0\uC0C9", emoji: "\u{1F4AD}" },
  gratitude: { name: "\uAC10\uC0AC \uC77C\uAE30", emoji: "\u2B50" },
  tree: { name: "\uC0DD\uAC01 \uB098\uBB34", emoji: "\u{1F333}" },
  burnout: { name: "\uBC88\uC544\uC6C3 \uCCB4\uD06C", emoji: "\u{1F525}" },
  focus: { name: "\uB9C8\uC74C \uC9D1\uC911\uB825", emoji: "\u{1F9E0}" },
  worry: { name: "\uAC71\uC815 \uD48D\uC120", emoji: "\u{1FAE7}" }
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
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 24 }, children: [
    /* @__PURE__ */ jsxs("button", { onClick: handleToggle, style: {
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
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F4CA}" }),
        " \uB0B4 \uAC8C\uC784 \uD1B5\uACC4"
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: C.muted }, children: expanded ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { style: {
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(8px)",
      borderRadius: "0 0 20px 20px",
      padding: "4px 20px 20px",
      border: "1px solid rgba(255,255,255,0.6)",
      borderTop: "none",
      marginTop: -4
    }, children: [
      loading && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "24px", color: C.muted, fontSize: 13 }, children: "\uBD88\uB7EC\uC624\uB294 \uC911..." }),
      !loading && stats && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, paddingTop: 16 }, children: [
          { label: "\uC774\uBC88 \uC8FC \uD50C\uB808\uC774", value: `${week.playCount || 0}\uD68C`, sub: `+${week.expGained || 0} EXP`, color: C.sage },
          { label: "\uC774\uBC88 \uB2EC \uD50C\uB808\uC774", value: `${month.playCount || 0}\uD68C`, sub: `+${month.expGained || 0} EXP`, color: C.amber }
        ].map((c) => /* @__PURE__ */ jsxs("div", { style: {
          background: "white",
          borderRadius: 14,
          padding: "14px 16px",
          border: `1px solid ${c.color}22`
        }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.muted, marginBottom: 4 }, children: c.label }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 20, fontWeight: 700, color: c.color }, children: c.value }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.muted }, children: c.sub })
        ] }, c.label)) }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: "0.5px" }, children: "\uAC8C\uC784\uBCC4 \uC218\uD589 \uD604\uD669" }),
        perGame.length === 0 && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "20px", color: C.muted, fontSize: 13 }, children: "\uC544\uC9C1 \uD50C\uB808\uC774 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: perGame.map((g) => {
          const meta = STATS_GAME_META[g.game_id] || { name: g.game_id, emoji: "\u{1F3AE}" };
          const lastDate = g.last_played ? new Date(g.last_played).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "-";
          return /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "white",
            borderRadius: 12,
            padding: "12px 14px"
          }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: 20 }, children: meta.emoji }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: C.dark }, children: meta.name }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
                  "\uB9C8\uC9C0\uB9C9: ",
                  lastDate
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 700, color: C.sage }, children: [
                g.play_count || 0,
                "\uD68C"
              ] }),
              (g.best_score || 0) > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.amber }, children: [
                "\uBCA0\uC2A4\uD2B8 ",
                g.best_score,
                "\uC810"
              ] })
            ] })
          ] }, g.game_id);
        }) })
      ] })
    ] })
  ] });
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
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F3C5}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: "\uC5C5\uC801" }),
        /* @__PURE__ */ jsxs("span", { style: {
          fontSize: 11,
          fontWeight: 700,
          background: earnedCount === totalCount ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
          color: earnedCount === totalCount ? "white" : C.sage,
          borderRadius: 100,
          padding: "2px 9px"
        }, children: [
          earnedCount,
          " / ",
          totalCount
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { flex: 1, maxWidth: 100, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 100, overflow: "hidden", marginLeft: 12 }, children: /* @__PURE__ */ jsx("div", { style: {
        height: "100%",
        width: `${Math.round(earnedCount / totalCount * 100)}%`,
        background: `linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
        borderRadius: 100,
        transition: "width 0.6s ease"
      } }) })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: sorted.length > 6 ? 12 : 0 }, children: visible.map((id) => {
      const a = GameEngine.getAchievementInfo(id);
      const done = isMaster || earnedSet.has(id);
      return /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 100,
        background: done ? C.sagePale : "rgba(0,0,0,0.04)",
        border: `1px solid ${done ? C.sage + "33" : "rgba(0,0,0,0.07)"}`,
        opacity: done ? 1 : 0.55,
        transition: "all 0.2s"
      }, title: a.desc, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, filter: done ? "none" : "grayscale(1)" }, children: a.emoji }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted }, children: a.name }),
        done && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: C.sage }, children: "\u2713" })
      ] }, id);
    }) }),
    sorted.length > 6 && /* @__PURE__ */ jsx("button", { onClick: () => setExpanded((v) => !v), style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      color: C.muted,
      fontWeight: 600,
      fontFamily: "'Noto Sans KR',sans-serif",
      padding: "2px 0"
    }, children: expanded ? "\uC811\uAE30 \u25B2" : `+${sorted.length - 6}\uAC1C \uB354\uBCF4\uAE30 \u25BC` })
  ] });
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
  return /* @__PURE__ */ jsx("div", { style: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1e3,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "fadeUp 0.4s ease"
  }, children: achievements.map((id) => {
    const a = GameEngine.getAchievementInfo(id);
    return /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "white",
      borderRadius: 14,
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      border: `1px solid ${C.sage}33`
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 24 }, children: a.emoji }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: "\uC5C5\uC801 \uB2EC\uC131!" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.sage, fontWeight: 600 }, children: a.name })
      ] })
    ] }, id);
  }) });
}
const HISTORY_GAME_META = {
  mood: { name: "\uAC10\uC815 \uC218\uCC44\uD654", emoji: "\u{1F60A}", color: "#6366F1" },
  garden: { name: "\uB9C8\uC74C\uC758 \uC815\uC6D0", emoji: "\u{1F33F}", color: "#22C55E" },
  efmt: { name: "\uAC10\uC815\uAF43", emoji: "\u{1F338}", color: "#EC4899" },
  gratitude: { name: "\uAC10\uC0AC \uC77C\uAE30", emoji: "\u{1F31F}", color: "#F59E0B" },
  burnout: { name: "\uBC88\uC544\uC6C3 \uD68C\uBCF5", emoji: "\u26A1", color: "#F97316" },
  focus: { name: "\uC9D1\uC911\uB825 \uD6C8\uB828", emoji: "\u{1F3AF}", color: "#0EA5E9" },
  worry: { name: "\uAC71\uC815 \uD48D\uC120", emoji: "\u{1F388}", color: "#8B5CF6" },
  tree: { name: "\uB9C8\uC74C \uB098\uBB34", emoji: "\u{1F332}", color: "#16A34A" },
  qt: { name: "QT \uBB35\uC0C1", emoji: "\u271D\uFE0F", color: "#7C3AED" }
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
  return /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.6)" }, children: [
    /* @__PURE__ */ jsxs("button", { onClick: handleToggle, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 }, children: [
        /* @__PURE__ */ jsx("span", { children: "\u{1F4C5}" }),
        " \uAC8C\uC784 \uD50C\uB808\uC774 \uC774\uB825"
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: C.muted }, children: expanded ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { style: { marginTop: 14 }, children: [
      loading && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 }, children: "\uBD88\uB7EC\uC624\uB294 \uC911..." }),
      !loading && sessions && sessions.length === 0 && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 }, children: "\uC544\uC9C1 \uD50C\uB808\uC774 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694" }),
      !loading && sessions && sessions.length > 0 && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: sessions.map((s, i) => {
        const meta = HISTORY_GAME_META[s.game_id] || { name: s.game_id, emoji: "\u{1F3AE}", color: "#6B7280" };
        const date = new Date(s.created_at);
        const dateStr = date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
        const timeStr = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        const dur = s.duration_sec > 0 ? s.duration_sec >= 60 ? `${Math.floor(s.duration_sec / 60)}\uBD84` : `${s.duration_sec}\uCD08` : null;
        return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 12, padding: "10px 14px", borderLeft: `3px solid ${meta.color}` }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 20, flexShrink: 0 }, children: meta.emoji }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: meta.name }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted, marginTop: 2 }, children: [
              dateStr,
              " ",
              timeStr,
              dur ? ` \xB7 ${dur}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
            s.score > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, fontWeight: 700, color: meta.color }, children: [
              s.score,
              "\uC810"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
              "+",
              s.exp_gained || 0,
              " EXP"
            ] })
          ] })
        ] }, i);
      }) })
    ] })
  ] });
}
const BURNOUT_LEVELS = [
  { max: 39, label: "\uB0AE\uC74C", color: "#9333EA", bg: "#F3E8FF" },
  { max: 59, label: "\uBCF4\uD1B5", color: "#F59E0B", bg: "#FEF3C7" },
  { max: 79, label: "\uB192\uC74C", color: "#F97316", bg: "#FFEDD5" },
  { max: 100, label: "\uC2EC\uAC01", color: "#EF4444", bg: "#FEF2F2" }
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
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F525}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: "\uBC88\uC544\uC6C3 \uC9C0\uC218 \uCD94\uC774" }),
        /* @__PURE__ */ jsxs("span", { style: {
          fontSize: 11,
          fontWeight: 700,
          background: level.bg,
          color: level.color,
          borderRadius: 100,
          padding: "2px 8px"
        }, children: [
          "\uD604\uC7AC ",
          burnoutScore,
          "\uC810 \xB7 ",
          level.label
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: handleToggle, style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 12,
        color: C.muted,
        fontWeight: 600,
        fontFamily: "'Noto Sans KR',sans-serif"
      }, children: expanded ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { style: { marginTop: 14, animation: "fadeUp 0.3s ease" }, children: [
      loading && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 }, children: "\uBD88\uB7EC\uC624\uB294 \uC911..." }),
      !loading && history && entries.length === 0 && /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: 16, color: C.muted, fontSize: 12 }, children: [
        "\uC544\uC9C1 \uBC88\uC544\uC6C3 \uAC8C\uC784 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694.",
        /* @__PURE__ */ jsx("br", {}),
        "\uAC8C\uC784\uC744 \uD50C\uB808\uC774\uD558\uBA74 \uC810\uC218 \uBCC0\uD654\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694!"
      ] }),
      !loading && entries.length >= 2 && /* @__PURE__ */ jsxs("div", { style: {
        background: "white",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 12,
        border: `1px solid ${level.color}22`
      }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.muted, marginBottom: 8 }, children: "\uBC88\uC544\uC6C3 \uC810\uC218 \uC774\uB825 (\uB0AE\uC744\uC218\uB85D \uAC74\uAC15)" }),
        /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" }, children: [
          /* @__PURE__ */ jsx("rect", { x: PAD, y: PAD, width: plotW, height: toY(60) - PAD, fill: "#FEF3C7", opacity: "0.4", rx: "2" }),
          /* @__PURE__ */ jsx("rect", { x: PAD, y: toY(60), width: plotW, height: toY(40) - toY(60), fill: "#FFEDD5", opacity: "0.3", rx: "2" }),
          /* @__PURE__ */ jsx("line", { x1: PAD, y1: toY(60), x2: W - PAD, y2: toY(60), stroke: "#F59E0B", strokeWidth: "1", strokeDasharray: "3 2" }),
          /* @__PURE__ */ jsx("text", { x: W - PAD + 2, y: toY(60) + 3, fontSize: "7", fill: "#F59E0B", children: "60" }),
          /* @__PURE__ */ jsx(
            "path",
            {
              d: `${pathD} L ${pts[pts.length - 1].x} ${PAD + plotH} L ${pts[0].x} ${PAD + plotH} Z`,
              fill: `${level.color}18`,
              stroke: "none"
            }
          ),
          /* @__PURE__ */ jsx("path", { d: pathD, fill: "none", stroke: level.color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
          pts.map((p, i) => /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("circle", { cx: p.x, cy: p.y, r: "3.5", fill: "white", stroke: level.color, strokeWidth: "2" }),
            /* @__PURE__ */ jsx("text", { x: p.x, y: H - 1, textAnchor: "middle", fontSize: "7", fill: "#C0C0C0", children: (/* @__PURE__ */ new Date(p.date + "T00:00:00")).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) })
          ] }, i)),
          /* @__PURE__ */ jsx(
            "text",
            {
              x: pts[pts.length - 1].x,
              y: pts[pts.length - 1].y - 6,
              textAnchor: "middle",
              fontSize: "9",
              fontWeight: "bold",
              fill: level.color,
              children: pts[pts.length - 1].val
            }
          )
        ] }),
        pts.length >= 2 && (() => {
          const diff = pts[pts.length - 1].val - pts[pts.length - 2].val;
          return /* @__PURE__ */ jsx("div", { style: {
            marginTop: 8,
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            color: diff <= 0 ? "#9333EA" : "#EF4444"
          }, children: diff <= 0 ? `\u2705 \uC9C0\uB09C \uD68C \uB300\uBE44 ${Math.abs(diff)}\uC810 \uAC1C\uC120\uB410\uC5B4\uC694!` : `\u26A0\uFE0F \uC9C0\uB09C \uD68C \uB300\uBE44 ${diff}\uC810 \uB192\uC544\uC84C\uC5B4\uC694. \uC26C\uC5B4\uAC00\uC138\uC694.` });
        })()
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: BURNOUT_LEVELS.map((l) => /* @__PURE__ */ jsxs("div", { style: {
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 100,
        background: l.bg,
        color: l.color,
        fontWeight: 600
      }, children: [
        l.label,
        " ~",
        l.max,
        "\uC810"
      ] }, l.label)) })
    ] })
  ] });
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
    const text = `\u{1F4D4} \uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30
${diary}

\uCE58\uC720 \uAC8C\uC784\uC5D0\uC11C \uAE30\uB85D\uD588\uC5B4\uC694 \u{1F33F} https://game.maumful.com`;
    if (navigator.share) {
      navigator.share({ title: "\uB9C8\uC74C \uC77C\uAE30", text }).catch(() => {
      });
    } else {
      navigator.clipboard?.writeText(text).then(() => alert("\uBCF5\uC0AC\uB410\uC5B4\uC694!"));
    }
  }
  if (!checked && !diary) {
    return /* @__PURE__ */ jsxs("div", { style: { background: "white", borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: "1px solid rgba(0,0,0,.08)" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u{1F4D4}" }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 700, color: "#6B21A8" }, children: "\uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: loadDiary,
            disabled: loading,
            style: { fontSize: 12, background: "#6B21A8", color: "white", border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" },
            children: loading ? "\uC0DD\uC131 \uC911..." : "\u270D\uFE0F \uC77C\uAE30 \uC0DD\uC131"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#9A9A9A", margin: 0 }, children: "\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uC744 \uBC14\uD0D5\uC73C\uB85C AI\uAC00 \uB9C8\uC74C \uC77C\uAE30\uB97C \uC791\uC131\uD574 \uB4DC\uB824\uC694." })
    ] });
  }
  if (noData) return null;
  if (!diary) return null;
  const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  return /* @__PURE__ */ jsxs("div", { style: { background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: "1px solid #bbf7d0" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u{1F4D4}" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 700, color: "#15803d" }, children: "\uC624\uB298\uC758 \uB9C8\uC74C \uC77C\uAE30" }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#86efac", marginLeft: 8 }, children: todayStr })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: share,
          style: { fontSize: 11, background: "transparent", color: "#16a34a", border: "1px solid #86efac", borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" },
          children: "\uACF5\uC720 \u{1F517}"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#166534", lineHeight: 1.7, margin: 0, fontStyle: "italic" }, children: diary })
  ] });
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
const DAY_LABELS = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
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
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 16,
    border: "1px solid rgba(255,255,255,0.6)",
    animation: "cardEnter .4s ease both"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 }, children: [
        dominantEmoji,
        " \uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984"
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
        entries.length,
        "\uC77C \uAE30\uB85D"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, justifyContent: "space-between" }, children: weekDays.map(({ dayIdx, date, entry }, i) => {
      const isToday = date.toDateString() === today.toDateString();
      const emoji = entry ? MOOD_EMOJI_MAP[entry.emotion] || "\u{1F3A8}" : null;
      const intensity = entry ? entry.intensity || 3 : 0;
      return /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
        /* @__PURE__ */ jsx("div", { style: {
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
        }, children: emoji || (isToday ? "\xB7" : "") }),
        /* @__PURE__ */ jsx("span", { style: {
          fontSize: 9,
          color: isToday ? C.sage : C.muted,
          fontWeight: isToday ? 700 : 400
        }, children: DAY_LABELS[dayIdx] })
      ] }, i);
    }) }),
    dominant && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.muted, marginTop: 10, textAlign: "center" }, children: [
      "\uC774\uBC88 \uC8FC \uC8FC\uC694 \uAC10\uC815:",
      " ",
      /* @__PURE__ */ jsxs("span", { style: { color: C.dark, fontWeight: 600 }, children: [
        dominantEmoji,
        " ",
        dominant[0] === "happy" ? "\uD589\uBCF5" : dominant[0] === "calm" ? "\uD3C9\uC628" : dominant[0] === "tired" ? "\uD53C\uACE4" : dominant[0] === "anxious" ? "\uBD88\uC548" : dominant[0] === "sad" ? "\uC2AC\uD514" : dominant[0]
      ] }),
      " ",
      "(",
      dominant[1],
      "\uC77C)"
    ] })
  ] });
}
const EMOTION_DISPLAY = {
  happy: { emoji: "\u{1F60A}", label: "\uD589\uBCF5", color: "#F59E0B" },
  calm: { emoji: "\u{1F60C}", label: "\uD3C9\uC628", color: "#A78BFA" },
  tired: { emoji: "\u{1F634}", label: "\uD53C\uACE4", color: "#9BA8B0" },
  anxious: { emoji: "\u{1F630}", label: "\uBD88\uC548", color: "#C4B5FD" },
  sad: { emoji: "\u{1F622}", label: "\uC2AC\uD514", color: "#93C5FD" },
  angry: { emoji: "\u{1F624}", label: "\uD654\uB0A8", color: "#FCA5A5" }
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
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F4CA}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: "\uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984" }),
        entries.length > 0 && /* @__PURE__ */ jsxs("span", { style: {
          fontSize: 11,
          fontWeight: 600,
          background: C.sagePale,
          color: C.sage,
          borderRadius: 100,
          padding: "2px 8px"
        }, children: [
          entries.length,
          "\uC77C \uAE30\uB85D"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
        expanded && reportData?.report && /* @__PURE__ */ jsx("button", { onClick: () => {
          const topEmotion = entries.length > 0 ? EMOTION_DISPLAY[entries[entries.length - 1]?.emotion] || { emoji: "\u{1F636}", label: entries[entries.length - 1]?.emotion } : null;
          const text = `\u{1F33F} \uC774\uBC88 \uC8FC \uB9C8\uC74C\uC758 \uC815\uC6D0
${topEmotion ? topEmotion.emoji + " " + topEmotion.label + " " : ""}${entries.length}\uC77C \uAC10\uC815 \uAE30\uB85D

${reportData.report.slice(0, 80)}...

#The Light of Life #\uCE58\uC720 \uAC8C\uC784 #\uAC10\uC815\uAE30\uB85D`;
          if (navigator.share) {
            navigator.share({ title: "\uC774\uBC88 \uC8FC \uAC10\uC815 \uD750\uB984", text }).catch(() => {
            });
          } else {
            navigator.clipboard?.writeText(text).then(() => alert("\uBCF5\uC0AC\uB410\uC5B4\uC694!")).catch(() => {
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
        }, children: "\uACF5\uC720 \u{1F517}" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setExpanded((v) => !v), style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: C.muted,
          fontWeight: 600,
          fontFamily: "'Noto Sans KR',sans-serif"
        }, children: expanded ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { style: { marginTop: 14, animation: "fadeUp 0.3s ease" }, children: [
      entries.length > 0 && /* @__PURE__ */ jsx("div", { style: {
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 14
      }, children: entries.map((e) => {
        const em = EMOTION_DISPLAY[e.emotion] || { emoji: "\u{1F636}", label: e.emotion, color: C.muted };
        return /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          minWidth: 44,
          flexShrink: 0
        }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            width: 38,
            height: 38,
            borderRadius: 100,
            background: em.color + "22",
            border: `2px solid ${em.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18
          }, children: em.emoji }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: C.muted, textAlign: "center" }, children: (/* @__PURE__ */ new Date(e.date + "T00:00:00")).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) }),
          /* @__PURE__ */ jsx("div", { style: {
            width: 4 + e.intensity * 1.5,
            height: 4 + e.intensity * 1.5,
            borderRadius: 100,
            background: em.color,
            opacity: 0.3 + e.intensity * 0.14
          } })
        ] }, e.date);
      }) }),
      /* @__PURE__ */ jsxs("div", { style: {
        background: `linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
        borderRadius: 14,
        padding: "14px 16px",
        border: `1px solid ${C.sage}22`
      }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.sage, marginBottom: 6, letterSpacing: "0.5px" }, children: "\u{1F916} AI \uAC10\uC815 \uD328\uD134 \uBD84\uC11D" }),
        /* @__PURE__ */ jsx("div", { style: {
          fontSize: 13,
          color: C.dark,
          lineHeight: 1.75,
          fontFamily: "'Noto Sans KR',sans-serif"
        }, children: reportData.report }),
        reportData.cached && /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: C.muted, marginTop: 6 }, children: "\uC774\uBC88 \uC8FC \uBD84\uC11D \xB7 \uB9E4\uC8FC \uC6D4\uC694\uC77C \uAC31\uC2E0" })
      ] })
    ] })
  ] });
}
const GAME_META = {
  garden: { name: "\uB9C8\uC74C\uC758 \uC815\uC6D0", emoji: "\u{1F33F}" },
  mood: { name: "\uAC10\uC815 \uC218\uCC44\uD654", emoji: "\u{1F3A8}" },
  efmt: { name: "\uAC10\uC815\uAF43 \uCC3E\uAE30", emoji: "\u{1F338}" },
  gratitude: { name: "\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30", emoji: "\u2B50" },
  tree: { name: "\uB0B4\uBA74\uC758 \uB098\uBB34", emoji: "\u{1F333}" },
  burnout: { name: "\uBC88\uC544\uC6C3 \uD68C\uBCF5", emoji: "\u26A1" },
  focus: { name: "\uB9C8\uC74C \uC9D1\uC911\uB825", emoji: "\u{1F9E0}" },
  worry: { name: "\uAC71\uC815 \uD48D\uC120", emoji: "\u{1FAE7}" }
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
    rec = { gameId: "garden", reason: `PHQ-9 ${phq9}\uC810 \u2014 \uC9C0\uAE08 \uD638\uD761 \uD6C8\uB828\uC774 \uB9C8\uC74C\uC744 \uC548\uC815\uC2DC\uCF1C\uC918\uC694`, color: C.dusty };
  } else if (gad7 !== void 0 && gad7 >= 10) {
    rec = { gameId: "worry", reason: `GAD-7 ${gad7}\uC810 \u2014 \uBD88\uC548\uD55C \uC0DD\uAC01\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uB0B4\uB824\uB193\uC544\uC694 \u{1FAE7}`, color: "#7B9ED9" };
  } else if (burnout !== void 0 && burnout >= 60 && level >= 2) {
    rec = { gameId: "burnout", reason: `\uBC88\uC544\uC6C3 \uC9C0\uC218 ${burnout}\uC810 \u2014 \uC624\uB298 \uD68C\uBCF5 \uBBF8\uC158\uC744 \uC2DC\uC791\uD574\uBCF4\uC138\uC694`, color: C.amber };
  } else if (!recentIds.includes("mood")) {
    rec = { gameId: "mood", reason: "\uC624\uB298 \uAC10\uC815 \uAE30\uB85D\uC744 \uC544\uC9C1 \uC548 \uD588\uC5B4\uC694 \u270D\uFE0F", color: C.sage };
  } else if (phq9 !== void 0 && phq9 >= 5) {
    rec = { gameId: "worry", reason: "\uB9C8\uC74C\uC18D \uAC71\uC815\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uB0A0\uB824 \uBCF4\uB0BC\uAE4C\uC694? \u{1FAE7}", color: "#7B9ED9" };
  } else if (level >= 2 && !recentIds.includes("efmt")) {
    rec = { gameId: "efmt", reason: "\uAC10\uC815\uAF43 \uCC3E\uAE30\uB85C \uAC10\uC815 \uC778\uC2DD\uB825\uC744 \uD0A4\uC6CC\uBCF4\uC138\uC694 \u{1F338}", color: "#C97B8A" };
  } else if (level >= 2 && !recentIds.includes("gratitude")) {
    rec = { gameId: "gratitude", reason: "\uC624\uB298\uC758 \uAC10\uC0AC \uC77C\uAE30\uB97C \uC368\uBCFC\uAE4C\uC694? \u2B50", color: C.amber };
  } else if (!recentIds.includes("worry")) {
    rec = { gameId: "worry", reason: "\uAC71\uC815 \uD48D\uC120\uC73C\uB85C \uB9C8\uC74C\uC18D \uC9D0\uC744 \uAC00\uBCCD\uAC8C \uD574\uBCF4\uC138\uC694 \u{1FAE7}", color: "#7B9ED9" };
  } else {
    rec = { gameId: "garden", reason: "\uC7A0\uAE50 \uD638\uD761\uC744 \uAC00\uB2E4\uB4EC\uACE0 \uC815\uC6D0\uC744 \uAC00\uAFD4\uBCFC\uAE4C\uC694? \u{1F33F}", color: C.sage };
  }
  const game = GAME_META[rec.gameId];
  return /* @__PURE__ */ jsxs("div", { style: {
    background: `linear-gradient(135deg, ${rec.color}12, rgba(255,255,255,0.82))`,
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "16px 20px",
    marginBottom: 24,
    border: `1px solid ${rec.color}28`
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: rec.color, marginBottom: 10, letterSpacing: "0.5px" }, children: "\u2728 \uC624\uB298\uC758 \uCD94\uCC9C" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
      /* @__PURE__ */ jsx("div", { style: {
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
      }, children: game.emoji }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 3 }, children: game.name }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.muted, lineHeight: 1.5 }, children: rec.reason })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => onPlay?.(rec.gameId), style: {
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
      }, children: "\uC2DC\uC791 \u2192" })
    ] })
  ] });
}
const QUEST_POOL = [
  { id: "play_mood", game: "mood", module: "checkin", text: "\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30", emoji: "\u{1F3A8}", exp: 15 },
  { id: "play_breathing", game: "garden", module: "breathing", text: "\uD638\uD761 \uD6C8\uB828 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F4A7}", exp: 20 },
  { id: "play_cbt", game: "garden", module: "cbt", text: "\uC0DD\uAC01 \uAD50\uC815 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F331}", exp: 20 },
  { id: "play_gratitude", game: "gratitude", module: "gratitude_write", text: "\uAC10\uC0AC \uC77C\uAE30 \uC4F0\uAE30", emoji: "\u2B50", exp: 20 },
  { id: "play_efmt", game: "efmt", module: "efmt_easy", text: "\uAC10\uC815\uAF43 \uCC3E\uAE30 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F338}", exp: 20, minLevel: 2 },
  { id: "play_burnout", game: "burnout", module: "missions", text: "\uBC88\uC544\uC6C3 \uD68C\uBCF5 \uBBF8\uC158 \uC644\uB8CC\uD558\uAE30", emoji: "\u26A1", exp: 20, minLevel: 2 },
  { id: "play_tree", game: "tree", module: "roots", text: "\uB0B4\uBA74\uC758 \uB098\uBB34 \uD0D0\uD5D8\uD558\uAE30", emoji: "\u{1F333}", exp: 25, minLevel: 4 },
  { id: "play_focus", game: "focus", module: "focus_training", text: "\uC9D1\uC911\uB825 \uD6C8\uB828 \uD55C \uBC88 \uC644\uB8CC\uD558\uAE30", emoji: "\u{1F9E0}", exp: 20, minLevel: 3 },
  { id: "play_any", game: null, module: null, text: "\uC544\uBB34 \uAC8C\uC784\uC774\uB098 \uD55C \uBC88 \uD50C\uB808\uC774\uD558\uAE30", emoji: "\u{1F3AE}", exp: 10 }
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
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "18px 20px",
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.6)"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F4CB}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: C.dark }, children: "\uC624\uB298\uC758 \uD018\uC2A4\uD2B8" }),
        /* @__PURE__ */ jsxs("span", { style: {
          fontSize: 11,
          fontWeight: 700,
          background: allDone ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
          color: allDone ? "white" : C.sage,
          borderRadius: 100,
          padding: "2px 9px"
        }, children: [
          doneCount,
          " / ",
          quests.length
        ] })
      ] }),
      allDone && !bonusDone && /* @__PURE__ */ jsx("button", { onClick: claimBonus, disabled: bonusClaiming, style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
        color: "white",
        border: "none",
        borderRadius: 100,
        padding: "5px 14px",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer"
      }, children: bonusClaiming ? "..." : "\u{1F381} +50 EXP" }),
      bonusDone && /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: C.sage, fontWeight: 700 }, children: [
        "\u2713 \uBCF4\uB108\uC2A4 \uD68D\uB4DD!",
        streakRecover > 0 && ` \u{1F6E1}\uFE0F${streakRecover}`
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: quests.map((q) => {
      const done = isQuestDone(q);
      return /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        background: done ? C.sagePale : "rgba(0,0,0,0.03)",
        border: `1px solid ${done ? C.sage + "33" : "rgba(0,0,0,0.06)"}`
      }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: q.emoji }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            fontSize: 12,
            fontWeight: done ? 700 : 500,
            color: done ? C.sage : C.dark,
            textDecoration: done ? "line-through" : "none"
          }, children: q.text }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.muted }, children: [
            "+",
            q.exp,
            " EXP"
          ] })
        ] }),
        done ? /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u2705" }) : q.game && /* @__PURE__ */ jsx("button", { onClick: () => onPlay?.(q.game), style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          background: `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer"
        }, children: "\uC2DC\uC791 \u2192" })
      ] }, q.id);
    }) })
  ] });
}
function OnboardingOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      emoji: "\u{1F33F}",
      title: "\uB9C8\uC74C\uC758 \uC815\uC6D0\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD574\uC694",
      body: "The Light of Life\uC758 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uB3D9\uD558\uC5EC \uB098\uB9CC\uC758 \uCE58\uC720 \uACF5\uAC04\uC744 \uAC00\uAFB8\uB294 \uAC8C\uC784 \uD50C\uB7AB\uD3FC\uC774\uC5D0\uC694. \uAC8C\uC784\uC744 \uC990\uAE30\uBA70 \uB9C8\uC74C\uC744 \uB3CC\uBCF4\uC138\uC694."
    },
    {
      emoji: "\u{1F331}",
      title: "\uB808\uBCA8\uC5C5\uC73C\uB85C \uC0C8 \uAC8C\uC784\uC744 \uD574\uAE08\uD574\uC694",
      body: "\uAC8C\uC784\uC744 \uD50C\uB808\uC774\uD558\uBA74 EXP\uAC00 \uC313\uC5EC \uB808\uBCA8\uC5C5\uD574\uC694. \uB808\uBCA8 2\uBD80\uD130 \uAC10\uC815\uAF43 \uCC3E\uAE30\xB7\uBC88\uC544\uC6C3 \uD68C\uBCF5 \uB4F1 \uB354 \uB9CE\uC740 \uAC8C\uC784\uC774 \uC5F4\uB9BD\uB2C8\uB2E4."
    },
    {
      emoji: "\u{1F3A8}",
      title: "\uBA3C\uC800 \uC624\uB298\uC758 \uAC10\uC815\uC744 \uAE30\uB85D\uD574\uBCFC\uAE4C\uC694?",
      body: "\uAC10\uC815 \uC218\uCC44\uD654\uB294 \uB9E4\uC77C \uB0B4 \uAC10\uC815\uC744 \uAE30\uB85D\uD558\uB294 \uAE30\uCD08 \uAC8C\uC784\uC774\uC5D0\uC694. \uB808\uBCA8 1\uBD80\uD130 \uBB34\uB8CC\uB85C \uC990\uAE38 \uC218 \uC788\uC5B4\uC694!"
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
  return /* @__PURE__ */ jsx("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2e3,
    padding: 20,
    backdropFilter: "blur(4px)"
  }, children: /* @__PURE__ */ jsxs("div", { style: {
    background: "white",
    borderRadius: 24,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 380,
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "fadeUp 0.3s ease"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 64, marginBottom: 16 }, children: s.emoji }),
    /* @__PURE__ */ jsx("h2", { style: {
      fontSize: 18,
      fontWeight: 700,
      color: C.dark,
      marginBottom: 12,
      fontFamily: "'Noto Serif KR', serif",
      lineHeight: 1.5
    }, children: s.title }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: 13,
      color: C.muted,
      lineHeight: 1.8,
      marginBottom: 24,
      fontFamily: "'Noto Sans KR', sans-serif"
    }, children: s.body }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }, children: steps.map((_, i) => /* @__PURE__ */ jsx("div", { style: {
      width: i === step ? 20 : 8,
      height: 8,
      borderRadius: 100,
      background: i === step ? C.sage : C.sagePale,
      transition: "all 0.3s"
    } }, i)) }),
    /* @__PURE__ */ jsx("button", { onClick: handleNext, style: {
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
    }, children: isLast ? "\u{1F33F} \uC815\uC6D0 \uD0D0\uD5D8 \uC2DC\uC791\uD558\uAE30" : "\uB2E4\uC74C \u2192" }),
    /* @__PURE__ */ jsx("button", { onClick: dismiss, style: {
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
    }, children: "\uAC74\uB108\uB6F0\uAE30" })
  ] }) });
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
      } else setError(res.error || "\uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328");
    }).catch(() => setError("\uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328")).finally(() => {
      clearTimeout(fallback);
      setLoading(false);
    });
    return () => clearTimeout(fallback);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get("game");
    if (!gameParam) return;
    const valid = ["garden", "efmt", "gratitude", "tree", "burnout", "mood", "focus"];
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
  }, [activeGame]);
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
        alert(res.error || "\uD06C\uB808\uB527 \uCC28\uAC10 \uC2E4\uD328. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
      }
    } catch {
      alert("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
    }
    setSpendLoading(false);
  }, [creditModal]);
  if (!isLoggedIn) return /* @__PURE__ */ jsx(LoginGate, {});
  if (loading) return /* @__PURE__ */ jsx(GameHubSkeleton, {});
  if (activeGame === "mood") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(MoodGame, { onExit: handleGameExit }) });
  if (activeGame === "garden") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(GardenGame, { userTestScores: data?.userTestScores || {}, onExit: handleGameExit }) });
  if (activeGame === "efmt") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(EFMTGame, { onExit: handleGameExit }) });
  if (activeGame === "gratitude") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(GratitudeGame, { onExit: handleGameExit }) });
  if (activeGame === "tree") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(TreeGame, { onExit: handleGameExit }) });
  if (activeGame === "burnout") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(BurnoutGame, { userTestResults: data?.userTestScores || {}, onSessionEnd: handleGameExit }) });
  if (activeGame === "focus") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(FocusGame, { onExit: handleGameExit }) });
  if (activeGame === "worry") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: /* @__PURE__ */ jsx(WorryGame, { onExit: handleGameExit }) });
  if (activeGame === "qt") return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }, children: typeof QTGame !== "undefined" ? /* @__PURE__ */ jsx(QTGame, { onExit: handleGameExit }) : /* @__PURE__ */ jsx("div", { style: { padding: 32, textAlign: "center", color: "#6B21A8" }, children: "QT \uAC8C\uC784\uC744 \uBD88\uB7EC\uC624\uB294 \uC911..." }) });
  if (error) return /* @__PURE__ */ jsxs("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: C.cream,
    padding: 24,
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 40, marginBottom: 12 }, children: "\u{1F327}\uFE0F" }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 15, color: C.muted, marginBottom: 20 }, children: error }),
    /* @__PURE__ */ jsx("a", { href: PHYWEB_URL, style: {
      padding: "10px 24px",
      background: C.sage,
      color: "white",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      textDecoration: "none",
      fontFamily: "'Noto Sans KR', sans-serif"
    }, children: "The Light of Life\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30" })
  ] });
  const { user, gameStatus, recentSessions, completedTests, achievements } = data || {};
  const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
  const gardenTheme = GameEngine.getGardenTheme(gameStatus?.visual_status || "clearing");
  const isMaster = data?.isMaster || false;
  const games = isMaster ? getPlayableGames(completedTests, 6).map((g) => ({ ...g, canPlay: true, isUnlocked: true, hasRequiredTests: true })) : getPlayableGames(completedTests, gameStatus?.garden_level || 1);
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.sagePale} 0%, ${C.cream} 40%, #EBF4FA 100%)` }, children: [
    /* @__PURE__ */ jsxs("nav", { style: {
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
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 20 }, children: "\u{1F33F}" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }, children: "\uB9C8\uC74C\uC758 \uC815\uC6D0" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          fontSize: 12,
          fontWeight: 600,
          color: C.sage,
          background: C.sagePale,
          padding: "4px 12px",
          borderRadius: 100
        }, children: [
          "Lv.",
          levelInfo.level,
          " ",
          levelInfo.emoji
        ] }),
        /* @__PURE__ */ jsx("a", { href: PHYWEB_URL, style: {
          fontSize: 12,
          color: C.muted,
          textDecoration: "none",
          padding: "5px 12px",
          borderRadius: 8,
          border: `1px solid rgba(0,0,0,0.08)`,
          background: "rgba(255,255,255,0.6)"
        }, children: "\u2190 The Light of Life" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { maxWidth: 680, margin: "0 auto", padding: "24px 20px 40px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        marginBottom: 24,
        background: "white"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { height: 200, position: "relative" }, children: [
          /* @__PURE__ */ jsx(GardenSVG, { status: gameStatus?.visual_status || "clearing", level: levelInfo.level }),
          /* @__PURE__ */ jsx("div", { style: {
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
          }, children: gardenTheme.label }),
          (gameStatus?.streak_days || 0) > 1 && /* @__PURE__ */ jsxs("div", { style: {
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
          }, children: [
            "\u{1F525} ",
            gameStatus.streak_days,
            "\uC77C \uC5F0\uC18D"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }, children: [
              "\uC548\uB155\uD558\uC138\uC694, ",
              user?.nickname || user?.email?.split("@")[0],
              "\uB2D8 \u{1F44B}",
              isMaster && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, background: "#6B21A8", color: "white", borderRadius: 6, padding: "2px 8px", fontWeight: 700, marginLeft: 6 }, children: "MASTER" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.muted }, children: gardenTheme.desc })
          ] }),
          /* @__PURE__ */ jsx(DailyTip, { hubData: data }),
          /* @__PURE__ */ jsx(LevelBar, { levelInfo }),
          /* @__PURE__ */ jsx(
            StreakCalendar,
            {
              recentPlayDates: data?.recentPlayDates || [],
              streakDays: gameStatus?.streak_days || 0,
              streakRecover: gameStatus?.streak_recover || 0,
              onRecover: () => GameEngine.getMe().then((res) => {
                if (res.success) setData(res.data);
              })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: {
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        borderRadius: 20,
        padding: "18px 20px",
        marginBottom: 24,
        border: "1px solid rgba(255,255,255,0.6)"
      }, children: /* @__PURE__ */ jsx(TestBadgeRow, { completedTests: completedTests || [] }) }),
      /* @__PURE__ */ jsx(BurnoutTrendSection, { userTestScores: data?.userTestScores }),
      /* @__PURE__ */ jsx(WeekMoodSummaryCard, {}),
      /* @__PURE__ */ jsx(AIDiarySection, {}),
      /* @__PURE__ */ jsx(EmotionWeeklyReport, {}),
      /* @__PURE__ */ jsx(TodayRecommendCard, { hubData: data, onPlay: handlePlay }),
      /* @__PURE__ */ jsx(
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
      ),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: 24 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 18 }, children: "\u{1F3AE}" }),
          " \uCE58\uC720 \uAC8C\uC784"
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }, className: "game-grid", children: games.map((game, i) => /* @__PURE__ */ jsx(GameCard, { game, onPlay: handlePlay, enterDelay: i * 50 }, game.id)) })
      ] }),
      /* @__PURE__ */ jsx(CampaignSection, { onPlay: handlePlay }),
      /* @__PURE__ */ jsx(GameHistorySection, {}),
      /* @__PURE__ */ jsx(GameStatsSection, {}),
      /* @__PURE__ */ jsx(
        AchievementPanel,
        {
          earned: achievements || [],
          isMaster
        }
      ),
      /* @__PURE__ */ jsx(RecentActivity, { sessions: recentSessions || [] }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 32 }, children: [
        /* @__PURE__ */ jsxs(
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
            },
            children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 14, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "\u{1F3C6}" }),
                " \uC815\uC6D0\uC0AC \uC21C\uC704"
              ] }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: C.muted }, children: showLeaderboard ? "\uC811\uAE30 \u25B2" : "\uD3BC\uCE58\uAE30 \u25BC" })
            ]
          }
        ),
        showLeaderboard && /* @__PURE__ */ jsx("div", { style: { marginTop: 10 }, children: /* @__PURE__ */ jsx(Leaderboard, { currentUserEmail: user?.email }) })
      ] })
    ] }),
    creditModal && /* @__PURE__ */ jsx("div", { style: {
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
    }, children: /* @__PURE__ */ jsxs("div", { style: {
      background: "white",
      borderRadius: 22,
      padding: "28px 24px",
      width: "100%",
      maxWidth: 360,
      boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
      animation: "fadeUp 0.3s ease"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 48, marginBottom: 10 }, children: creditModal.gameEmoji }),
        /* @__PURE__ */ jsx("h3", { style: {
          fontSize: 18,
          fontWeight: 700,
          color: "#2C2C20",
          marginBottom: 6,
          fontFamily: "'Noto Serif KR', sans-serif"
        }, children: creditModal.gameName }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#8A8A78", lineHeight: 1.6 }, children: "\uC774 \uAC8C\uC784\uC740 \uD50C\uB808\uC774 \uC2DC \uD06C\uB808\uB527\uC774 \uCC28\uAC10\uB429\uB2C8\uB2E4" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        background: "#F5EFE0",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 18
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: "#8A8A78" }, children: "\uD604\uC7AC \uD06C\uB808\uB527" }),
          /* @__PURE__ */ jsxs("span", { style: { fontWeight: 700, color: "#2C2C20" }, children: [
            creditModal.balance,
            " \uD06C\uB808\uB527"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: "#8A8A78" }, children: "\uCC28\uAC10 \uC608\uC815" }),
          /* @__PURE__ */ jsxs("span", { style: { fontWeight: 700, color: "#D4954A" }, children: [
            "- ",
            creditModal.cost,
            " \uD06C\uB808\uB527"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(0,0,0,0.08)", margin: "10px 0" } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, color: "#2C2C20" }, children: "\uCC28\uAC10 \uD6C4 \uC794\uC561" }),
          /* @__PURE__ */ jsxs("span", { style: {
            fontWeight: 700,
            color: creditModal.balance >= creditModal.cost ? "#6B21A8" : "#C05050"
          }, children: [
            Math.max(0, creditModal.balance - creditModal.cost),
            " \uD06C\uB808\uB527"
          ] })
        ] })
      ] }),
      (creditModal.insufficient || creditModal.balance < creditModal.cost) && /* @__PURE__ */ jsx("div", { style: {
        background: "#FEF2F2",
        border: "1px solid rgba(192,80,80,0.2)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 14,
        fontSize: 12,
        color: "#C05050",
        lineHeight: 1.6
      }, children: "\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD574\uC694. The Light of Life\uC5D0\uC11C \uD06C\uB808\uB527\uC744 \uCDA9\uC804\uD55C \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setCreditModal(null), style: {
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
        }, children: "\uCDE8\uC18C" }),
        creditModal.balance < creditModal.cost ? /* @__PURE__ */ jsx("a", { href: PHYWEB_URL, style: {
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
        }, children: "\uD06C\uB808\uB527 \uCDA9\uC804\uD558\uAE30 \u2192" }) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCreditConfirm,
            disabled: spendLoading,
            style: {
              fontFamily: "'Noto Sans KR',sans-serif",
              flex: 2,
              padding: "12px",
              background: spendLoading ? "rgba(0,0,0,0.1)" : "linear-gradient(135deg, #6B21A8, #A78BFA)",
              color: spendLoading ? "#8A8A78" : "white",
              border: "none",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: spendLoading ? "not-allowed" : "pointer"
            },
            children: spendLoading ? "\uCC98\uB9AC \uC911..." : `${creditModal.cost} \uD06C\uB808\uB527\uC73C\uB85C \uC2DC\uC791`
          }
        )
      ] })
    ] }) }),
    newAchievements.length > 0 && /* @__PURE__ */ jsx(AchievementToast, { achievements: newAchievements, onDismiss: () => setNewAchievements([]) }),
    sessionFeedback && /* @__PURE__ */ jsx("div", { style: {
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
      border: "1px solid rgba(124,58,237,0.15)",
      animation: "fadeUp 0.4s ease"
    }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 24, flexShrink: 0, lineHeight: 1.2 }, children: sessionFeedback.emoji }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 4 }, children: "\uAC8C\uC784 \uC644\uB8CC! \u{1F389}" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: "#374151", lineHeight: 1.6 }, children: sessionFeedback.feedback })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setSessionFeedback(null),
          style: { fontSize: 16, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 },
          children: "\u2715"
        }
      )
    ] }) }),
    showOnboarding && /* @__PURE__ */ jsx(OnboardingOverlay, { onDone: () => setShowOnboarding(false) }),
    /* @__PURE__ */ jsx("style", { children: `
        @media (max-width: 480px) {
          .game-grid { grid-template-columns: 1fr !important; }
        }
      ` })
  ] });
}
const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(React.createElement(GameHubApp));
}
