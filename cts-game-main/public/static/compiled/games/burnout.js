const BT = {
  // 새벽 도시 배경
  nightDeep: "#080E1A",
  nightMid: "#0F1E2E",
  nightLight: "#1A3048",
  cityGlow: "#1E4060",
  // 에너지 컬러 (소진 → 회복)
  energyLow: "#FF6B6B",
  energyMid: "#FFB347",
  energyHigh: "#4ECDC4",
  energyFull: "#45EE88",
  // 포인트
  electric: "#7EB8F7",
  electricL: "#B8D8FF",
  amber: "#F5C842",
  amberL: "#FFE08A",
  // 텍스트
  cream: "#F0EDE8",
  softCream: "#D8D4CE",
  muted: "#7A8FA8",
  mutedL: "#A8BDD0",
  dark: "#060C14"
};
const BURNOUT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

  @keyframes bt-fadeUp   { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes bt-fadeIn   { from{opacity:0}to{opacity:1} }
  @keyframes bt-pulse    { 0%,100%{transform:scale(1)}50%{transform:scale(1.04)} }
  @keyframes bt-glow     { 0%,100%{opacity:0.5}50%{opacity:1} }
  @keyframes bt-shimmer  { 0%,100%{opacity:0.4}50%{opacity:0.9} }
  @keyframes bt-cityLight{ from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)} }
  @keyframes bt-timerRing{ from{stroke-dashoffset:283}to{stroke-dashoffset:0} }
  @keyframes bt-energyBar{ from{width:0}to{width:var(--energy-w)} }
  @keyframes bt-missionDone{ 0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)} }
  @keyframes bt-float    { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
  @keyframes bt-sparkle  { 0%{transform:translateY(0) scale(1);opacity:1}
                           100%{transform:translateY(-30px) scale(0);opacity:0} }

  .bt-btn {
    font-family: 'Noto Sans KR', sans-serif;
    border: none; border-radius: 14px; font-weight: 700;
    cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
  }
  .bt-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .bt-btn:active:not(:disabled){ transform: translateY(0); }
  .bt-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .bt-mission-card {
    display: flex; align-items: center; gap: 14px;
    border-radius: 16px; padding: 14px 16px;
    cursor: pointer; transition: all 0.22s; text-align: left;
    font-family: 'Noto Sans KR', sans-serif;
    border: none; width: 100%;
  }
  .bt-mission-card:hover:not(:disabled) { transform: translateX(3px); }
  .bt-mission-done { animation: bt-missionDone 0.4s ease; }
`;
function CitySVG({ energyPct, completedCount }) {
  const lit = Math.floor(energyPct / 100 * 12);
  const skyColor = energyPct < 30 ? "#080E1A" : energyPct < 60 ? "#0F1E2E" : energyPct < 85 ? "#122840" : "#1A3850";
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 360 200",
      xmlns: "http://www.w3.org/2000/svg",
      style: { width: "100%", height: "100%", display: "block" }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "btSky", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: skyColor }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#0A1828" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "btGround", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#0A1420" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#060C14" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "btMoonG", cx: "50%", cy: "50%", r: "50%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#FFF8E0", stopOpacity: "0.9" }), /* @__PURE__ */ React.createElement("stop", { offset: "70%", stopColor: "#E8D4A0", stopOpacity: "0.3" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#E8D4A0", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("filter", { id: "btWinGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "2", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("filter", { id: "btCityGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "4", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))),
    /* @__PURE__ */ React.createElement("rect", { width: "360", height: "200", fill: "url(#btSky)" }),
    [[30, 20, 1], [80, 12, 0.8], [130, 18, 1.1], [185, 8, 0.9], [230, 16, 1], [280, 10, 0.8], [320, 22, 1.2], [55, 35, 0.7], [155, 30, 0.8], [255, 28, 0.9], [340, 14, 0.7]].map(([x, y, r], i) => /* @__PURE__ */ React.createElement(
      "circle",
      {
        key: i,
        cx: x,
        cy: y,
        r,
        fill: "white",
        opacity: 0.35 + i % 3 * 0.15,
        style: { animation: `bt-shimmer ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }
      }
    )),
    /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "30", r: "20", fill: "url(#btMoonG)" }),
    /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "30", r: "13", fill: "#FFF8E0", opacity: "0.9" }),
    energyPct > 20 && /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        cx: "180",
        cy: "145",
        rx: "180",
        ry: "30",
        fill: "#1E4060",
        opacity: energyPct / 400,
        style: { animation: "bt-glow 3s ease-in-out infinite" }
      }
    ),
    [[20, 105, 22, 55], [55, 95, 18, 65], [85, 100, 20, 60], [330, 98, 22, 62], [300, 108, 18, 52], [270, 102, 20, 58]].map(([x, y, w, h], i) => /* @__PURE__ */ React.createElement("rect", { key: i, x, y, width: w, height: h, fill: "#0C1A28", opacity: "0.6" })),
    /* @__PURE__ */ React.createElement("rect", { x: "10", y: "88", width: "32", height: "72", rx: "2", fill: "#0F1E30" }),
    /* @__PURE__ */ React.createElement("rect", { x: "50", y: "72", width: "28", height: "88", rx: "2", fill: "#0C1A28" }),
    /* @__PURE__ */ React.createElement("rect", { x: "86", y: "82", width: "36", height: "78", rx: "2", fill: "#0F1E30" }),
    /* @__PURE__ */ React.createElement("rect", { x: "130", y: "65", width: "30", height: "95", rx: "2", fill: "#0C1A28" }),
    /* @__PURE__ */ React.createElement("rect", { x: "168", y: "55", width: "24", height: "105", rx: "2", fill: "#101C2C" }),
    "  ",
    /* @__PURE__ */ React.createElement("rect", { x: "200", y: "70", width: "32", height: "90", rx: "2", fill: "#0C1A28" }),
    /* @__PURE__ */ React.createElement("rect", { x: "240", y: "78", width: "28", height: "82", rx: "2", fill: "#0F1E30" }),
    /* @__PURE__ */ React.createElement("rect", { x: "276", y: "85", width: "34", height: "75", rx: "2", fill: "#0C1A28" }),
    /* @__PURE__ */ React.createElement("rect", { x: "318", y: "90", width: "30", height: "70", rx: "2", fill: "#0F1E30" }),
    [
      // [x, y, w, h, idx] — 각 창문
      [14, 95, 8, 6, 0],
      [24, 95, 8, 6, 1],
      [14, 107, 8, 6, 2],
      [24, 107, 8, 6, 3],
      [54, 80, 8, 6, 4],
      [64, 80, 8, 6, 5],
      [54, 92, 8, 6, 6],
      [64, 92, 8, 6, 7],
      [90, 90, 10, 6, 8],
      [104, 90, 10, 6, 9],
      [90, 102, 10, 6, 10],
      [104, 102, 10, 6, 11],
      [133, 73, 8, 6, 0],
      [145, 73, 8, 6, 1],
      [133, 85, 8, 6, 2],
      [145, 85, 8, 6, 3],
      [171, 63, 6, 5, 4],
      [171, 75, 6, 5, 5],
      [171, 87, 6, 5, 6],
      [204, 78, 9, 6, 7],
      [216, 78, 9, 6, 8],
      [204, 90, 9, 6, 9],
      [243, 86, 8, 6, 10],
      [255, 86, 8, 6, 11],
      [243, 98, 8, 6, 0],
      [280, 93, 9, 6, 1],
      [293, 93, 9, 6, 2],
      [280, 105, 9, 6, 3],
      [321, 98, 8, 6, 4],
      [333, 98, 8, 6, 5],
      [321, 110, 8, 6, 6]
    ].map(([x, y, w, h, idx], i) => {
      const isLit = i < lit;
      const winColor = idx % 3 === 0 ? "#F5C842" : idx % 3 === 1 ? "#7EB8F7" : "#4ECDC4";
      return /* @__PURE__ */ React.createElement(
        "rect",
        {
          key: i,
          x,
          y,
          width: w,
          height: h,
          rx: "1",
          fill: isLit ? winColor : "#0A1420",
          opacity: isLit ? 0.9 : 0.3,
          filter: isLit ? "url(#btWinGlow)" : void 0,
          style: isLit ? { animation: `bt-cityLight 0.4s ease ${i % 5 * 0.05}s both` } : {}
        }
      );
    }),
    energyPct >= 90 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "180",
        cy: "54",
        r: "4",
        fill: "#F5C842",
        opacity: "0.9",
        style: { animation: "bt-glow 1.5s ease-in-out infinite" }
      }
    ), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "64",
        cy: "70",
        r: "3",
        fill: "#7EB8F7",
        opacity: "0.8",
        style: { animation: "bt-glow 2s ease-in-out 0.3s infinite" }
      }
    ), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "296",
        cy: "83",
        r: "3",
        fill: "#4ECDC4",
        opacity: "0.8",
        style: { animation: "bt-glow 1.8s ease-in-out 0.6s infinite" }
      }
    )),
    /* @__PURE__ */ React.createElement("rect", { x: "0", y: "158", width: "360", height: "42", fill: "url(#btGround)" }),
    /* @__PURE__ */ React.createElement("rect", { x: "0", y: "162", width: "360", height: "3", fill: "#0F1E30", opacity: "0.8" }),
    [30, 90, 150, 210, 270, 330].map((x, i) => /* @__PURE__ */ React.createElement("rect", { key: i, x, y: "162", width: "18", height: "2", fill: "#F5C842", opacity: "0.25" })),
    [40, 140, 220, 320].map((x, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("line", { x1: x, y1: "158", x2: x, y2: "138", stroke: "#1E3A55", strokeWidth: "2" }), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: x,
        cy: "136",
        r: "4",
        fill: energyPct > 30 ? "#F5C842" : "#1E3A55",
        opacity: energyPct > 30 ? 0.9 : 0.4,
        filter: energyPct > 30 ? "url(#btWinGlow)" : void 0
      }
    ), energyPct > 30 && /* @__PURE__ */ React.createElement("ellipse", { cx: x, cy: "145", rx: "8", ry: "4", fill: "#F5C842", opacity: "0.12" })))
  );
}
function CircleTimer({ seconds, total, label, emoji }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - seconds / total);
  const pct = Math.round(seconds / total * 100);
  const color = pct > 60 ? BT.electric : pct > 30 ? BT.amber : BT.energyLow;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 10px" } }, /* @__PURE__ */ React.createElement("svg", { width: "130", height: "130", viewBox: "0 0 130 130" }, /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "65",
      cy: "65",
      r,
      fill: "none",
      stroke: "rgba(255,255,255,0.08)",
      strokeWidth: "10"
    }
  ), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "65",
      cy: "65",
      r,
      fill: "none",
      stroke: color,
      strokeWidth: "10",
      strokeLinecap: "round",
      strokeDasharray: circ,
      strokeDashoffset: offset,
      transform: "rotate(-90 65 65)",
      style: { transition: "stroke-dashoffset 0.9s linear, stroke 0.5s" }
    }
  ), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "65",
      cy: "65",
      r,
      fill: "none",
      stroke: color,
      strokeWidth: "3",
      opacity: "0.3",
      strokeDasharray: circ,
      strokeDashoffset: offset,
      transform: "rotate(-90 65 65)",
      style: { filter: `blur(4px)`, transition: "stroke-dashoffset 0.9s linear" }
    }
  ), /* @__PURE__ */ React.createElement("text", { x: "65", y: "55", textAnchor: "middle", fontSize: "22", dominantBaseline: "middle" }, emoji), /* @__PURE__ */ React.createElement(
    "text",
    {
      x: "65",
      y: "76",
      textAnchor: "middle",
      fill: "white",
      fontSize: "22",
      fontWeight: "700",
      fontFamily: "'Noto Sans KR',sans-serif"
    },
    seconds
  ), /* @__PURE__ */ React.createElement(
    "text",
    {
      x: "65",
      y: "92",
      textAnchor: "middle",
      fill: BT.muted,
      fontSize: "10",
      fontFamily: "'Noto Sans KR',sans-serif"
    },
    "\uCD08 \uB0A8\uC74C"
  )), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 14,
    fontWeight: 700,
    color: BT.cream,
    fontFamily: "'Noto Sans KR',sans-serif",
    marginTop: 4
  } }, label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: BT.muted, fontFamily: "'Noto Sans KR',sans-serif", marginTop: 2 } }, "\uC9C4\uD589 \uC911 \u2014 \uD3B8\uC548\uD558\uAC8C \uD574\uBCF4\uC138\uC694"));
}
function BurnoutGame({ userTestResults = {}, onSessionEnd }) {
  const { useState, useEffect, useCallback, useRef } = React;
  const MISSIONS = {
    stretch_5: { label: "5\uBD84 \uC2A4\uD2B8\uB808\uCE6D", emoji: "\u{1F9D8}", energy: 10, duration: 5, desc: "\uBAB8\uC758 \uAE34\uC7A5\uC744 \uD480\uC5B4\uC918\uC694", category: "body" },
    walk_10: { label: "10\uBD84 \uC0B0\uCC45", emoji: "\u{1F6B6}", energy: 20, duration: 10, desc: "\uBC14\uAE65 \uACF5\uAE30\uB97C \uB9C8\uC154\uC694", category: "body" },
    drink_water: { label: "\uBB3C \uD55C \uC794 \uB9C8\uC2DC\uAE30", emoji: "\u{1F4A7}", energy: 8, duration: 1, desc: "\uC9C0\uAE08 \uBC14\uB85C \uD560 \uC218 \uC788\uC5B4\uC694", category: "body" },
    family_time: { label: "\uC18C\uC911\uD55C \uC0AC\uB78C\uACFC \uB300\uD654", emoji: "\u{1F4AC}", energy: 25, duration: 15, desc: "\uC5F0\uACB0\uC774 \uC5D0\uB108\uC9C0\uC608\uC694", category: "social" },
    deep_breath: { label: "\uAE4A\uC740 \uD638\uD761 3\uD68C", emoji: "\u{1F32C}\uFE0F", energy: 6, duration: 2, desc: "\uC9C0\uAE08 \uC5EC\uAE30\uC5D0 \uC9D1\uC911\uD574\uC694", category: "mind" },
    meditation: { label: "5\uBD84 \uBA85\uC0C1", emoji: "\u{1F56F}\uFE0F", energy: 15, duration: 5, desc: "\uC7A0\uC2DC \uACE0\uC694\uD574\uC838\uC694", category: "mind" },
    gratitude: { label: "\uAC10\uC0AC \uD55C \uC904 \uC4F0\uAE30", emoji: "\u2B50", energy: 12, duration: 3, desc: "\uC791\uC740 \uAC83\uB3C4 \uAD1C\uCC2E\uC544\uC694", category: "mind" },
    grounding_54321: { label: "5-4-3-2-1 \uC548\uC815\uD654", emoji: "\u{1F30D}", energy: 18, duration: 5, desc: "\uBD88\uC548\uC744 \uC7A0\uC7AC\uC6B0\uB294 \uC811\uC9C0 \uAE30\uBC95", category: "anxiety" },
    body_scan: { label: "\uBC14\uB514 \uC2A4\uCE94", emoji: "\u{1F50D}", energy: 14, duration: 7, desc: "\uBAB8\uC758 \uAE34\uC7A5 \uBD80\uC704\uB97C \uD655\uC778\uD574\uC694", category: "anxiety" },
    nature_view: { label: "\uC790\uC5F0 \uC0AC\uC9C4/\uD48D\uACBD \uBCF4\uAE30", emoji: "\u{1F33F}", energy: 10, duration: 3, desc: "\uC790\uC5F0\uC774 \uC2A4\uD2B8\uB808\uC2A4\uB97C \uC904\uC5EC\uC918\uC694", category: "stress" },
    journal_5min: { label: "5\uBD84 \uAC10\uC815 \uC77C\uAE30", emoji: "\u{1F4D3}", energy: 16, duration: 5, desc: "\uAC10\uC815\uC744 \uC4F0\uBA74 \uB9C8\uC74C\uC774 \uAC00\uBCBC\uC6CC\uC838\uC694", category: "stress" },
    nap_20: { label: "20\uBD84 \uB0AE\uC7A0", emoji: "\u{1F634}", energy: 22, duration: 20, desc: "\uC9E7\uC740 \uB0AE\uC7A0\uC774 \uD68C\uBCF5\uB825\uC744 \uB192\uC5EC\uC694", category: "rest" }
  };
  const CITY_LEVELS = [
    { level: 1, name: "\uBD88 \uAEBC\uC9C4 \uB3C4\uC2DC", minEnergy: 0, color: "#2A4060", desc: "\uC9C0\uAE08 \uD68C\uBCF5\uC744 \uC2DC\uC791\uD574\uC694" },
    { level: 2, name: "\uCCAB \uBD88\uBE5B", minEnergy: 30, color: "#3A5080", desc: "\uBD88\uBE5B\uC774 \uCF1C\uC9C0\uAE30 \uC2DC\uC791\uD588\uC5B4\uC694" },
    { level: 3, name: "\uAE68\uC5B4\uB098\uB294 \uB3C4\uC2DC", minEnergy: 60, color: "#4A70A0", desc: "\uB3C4\uC2DC\uAC00 \uC0B4\uC544\uB098\uACE0 \uC788\uC5B4\uC694" },
    { level: 4, name: "\uD65C\uAE30\uCC2C \uAC70\uB9AC", minEnergy: 90, color: "#5A90C0", desc: "\uC5D0\uB108\uC9C0\uAC00 \uB118\uCCD0\uB098\uC694" },
    { level: 5, name: "\uBE5B\uB098\uB294 \uBA54\uD2B8\uB85C", minEnergy: 120, color: "#7EB8F7", desc: "\uC644\uC804\uD788 \uD68C\uBCF5\uB418\uC5C8\uC5B4\uC694 \u{1F389}" }
  ];
  const burnoutScore = userTestResults?.BURNOUT ?? 50;
  const gad7Score = userTestResults?.GAD7 ?? 0;
  const dass21Score = userTestResults?.DASS21 ?? 0;
  const initialEnergy = Math.max(0, 100 - burnoutScore);
  const initialMissions = (() => {
    if (gad7Score >= 10) return ["grounding_54321", "deep_breath", "body_scan", "drink_water"];
    if (dass21Score >= 14) return ["nature_view", "journal_5min", "meditation", "walk_10"];
    if (burnoutScore >= 60) return ["walk_10", "drink_water", "family_time", "meditation"];
    return ["stretch_5", "deep_breath", "gratitude", "drink_water"];
  })();
  const [energy, setEnergy] = useState(initialEnergy);
  const [completedToday, setCompletedToday] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const [justCompleted, setJustCompleted] = useState(null);
  const intervalRef = useRef(null);
  useEffect(() => {
    const id = "burnout-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = BURNOUT_STYLE;
      document.head.appendChild(s);
    }
  }, []);
  const cityLevel = CITY_LEVELS.slice().reverse().find((c) => energy >= c.minEnergy) || CITY_LEVELS[0];
  const nextLevel = CITY_LEVELS.find((c) => c.minEnergy > energy);
  const energyPct = Math.min(100, Math.round(energy / 150 * 100));
  const toNextLevel = nextLevel ? nextLevel.minEnergy - energy : 0;
  const energyColor = energyPct < 30 ? `linear-gradient(90deg, ${BT.energyLow}, #FF9A6B)` : energyPct < 60 ? `linear-gradient(90deg, ${BT.energyMid}, #FFD080)` : energyPct < 85 ? `linear-gradient(90deg, ${BT.energyHigh}, #7ADDD8)` : `linear-gradient(90deg, ${BT.energyFull}, #80FFB0)`;
  useEffect(() => {
    if (!running || timer <= 0) return;
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          completeMission(activeMission);
          return 0;
        }
        return t - 1;
      });
    }, 1e3);
    return () => clearInterval(intervalRef.current);
  }, [running, timer]);
  const spawnSparkles = (x, y) => {
    const id = Date.now();
    setSparkles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setSparkles((prev) => prev.filter((s) => s.id !== id)), 800);
  };
  const startMission = useCallback((code, e) => {
    if (completedToday.includes(code) || running) return;
    const m = MISSIONS[code];
    setActiveMission(code);
    const secs = m.duration * 3;
    setTimer(secs);
    setTimerTotal(secs);
    setRunning(true);
  }, [completedToday, running]);
  const completeMission = useCallback((code) => {
    if (!code) return;
    const m = MISSIONS[code];
    setCompletedToday((prev) => [...prev, code]);
    setEnergy((e) => Math.min(150, e + m.energy));
    setActiveMission(null);
    setJustCompleted(code);
    setTimeout(() => setJustCompleted(null), 1500);
  }, []);
  const skipMission = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setActiveMission(null);
    setTimer(0);
  };
  const handleFinish = async () => {
    setFinishing(true);
    const totalEnergyGained = completedToday.reduce((s, c) => s + MISSIONS[c].energy, 0);
    const score = Math.min(100, totalEnergyGained);
    try {
      const res = await GameEngine.saveSession({
        gameId: "burnout",
        moduleType: "MISSION",
        score,
        durationSec: completedToday.length * 60,
        metadata: {
          missions_completed: completedToday.length,
          energy_gained: totalEnergyGained,
          city_level: cityLevel.level,
          burnout_score: burnoutScore
        }
      });
      onSessionEnd?.({
        score,
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || []
      });
    } catch {
      onSessionEnd?.({ score, expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };
  if (running && activeMission) {
    const m = MISSIONS[activeMission];
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${BT.nightDeep}, ${BT.nightMid})`,
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 18px",
      background: "rgba(8,14,26,0.8)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(126,184,247,0.1)",
      flexShrink: 0
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 14,
      fontWeight: 700,
      color: BT.cream,
      fontFamily: "'Noto Serif KR',serif"
    } }, "\uBC88\uC544\uC6C3 \uD68C\uBCF5")), /* @__PURE__ */ React.createElement("button", { onClick: skipMission, style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      background: "rgba(255,255,255,0.08)",
      color: BT.muted,
      border: "none",
      borderRadius: 9,
      padding: "6px 14px",
      fontSize: 12,
      cursor: "pointer"
    } }, "\uAC74\uB108\uB6F0\uAE30")), /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px"
    } }, /* @__PURE__ */ React.createElement(
      CircleTimer,
      {
        seconds: timer,
        total: timerTotal,
        label: m.label,
        emoji: m.emoji
      }
    ), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 20,
      textAlign: "center",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(126,184,247,0.1)",
      borderRadius: 16,
      padding: "14px 24px",
      maxWidth: 260
    } }, /* @__PURE__ */ React.createElement("p", { style: {
      fontSize: 13,
      color: BT.muted,
      lineHeight: 1.7,
      margin: 0,
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, m.desc, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: BT.electric } }, "\uC644\uB8CC\uD558\uBA74 +", m.energy, " \uC5D0\uB108\uC9C0"))), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 24,
      width: "100%",
      maxWidth: 320,
      height: 80,
      borderRadius: 14,
      overflow: "hidden",
      opacity: 0.6
    } }, /* @__PURE__ */ React.createElement(CitySVG, { energyPct, completedCount: completedToday.length }))));
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${BT.nightDeep}, ${BT.nightMid})`,
    overflow: "hidden",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, sparkles.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: {
    position: "fixed",
    left: s.x,
    top: s.y,
    pointerEvents: "none",
    fontSize: 16,
    zIndex: 999,
    animation: "bt-sparkle 0.7s ease forwards"
  } }, "\u2728")), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    background: "rgba(8,14,26,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(126,184,247,0.08)",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 14,
    fontWeight: 700,
    color: BT.cream,
    fontFamily: "'Noto Serif KR',serif"
  } }, "\uBC88\uC544\uC6C3 \uD68C\uBCF5")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    color: BT.muted,
    background: "rgba(126,184,247,0.08)",
    borderRadius: 8,
    padding: "4px 10px",
    border: "1px solid rgba(126,184,247,0.12)"
  } }, completedToday.length, "/", initialMissions.length, " \uC644\uB8CC"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowReport(true), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "rgba(126,184,247,0.1)",
    color: BT.electricL,
    border: "1px solid rgba(126,184,247,0.18)",
    borderRadius: 9,
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer"
  } }, "\uB9AC\uD3EC\uD2B8"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 160, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(CitySVG, { energyPct, completedCount: completedToday.length }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(8,14,26,0.75)",
    backdropFilter: "blur(8px)",
    borderRadius: 12,
    padding: "6px 16px",
    textAlign: "center",
    border: `1px solid ${cityLevel.color}40`,
    animation: "bt-fadeIn 0.5s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    fontWeight: 700,
    color: cityLevel.color,
    fontFamily: "'Noto Serif KR',serif"
  } }, cityLevel.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: BT.muted, fontFamily: "'Noto Sans KR',sans-serif" } }, cityLevel.desc)))), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "12px 18px 8px",
    flexShrink: 0,
    background: "rgba(8,14,26,0.6)",
    borderBottom: "1px solid rgba(126,184,247,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: BT.electricL } }, "\u26A1 \uD68C\uBCF5 \uC5D0\uB108\uC9C0"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 13,
    fontWeight: 700,
    color: energyPct < 30 ? BT.energyLow : energyPct < 60 ? BT.energyMid : BT.energyFull
  } }, energy), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: BT.muted } }, "/150"), nextLevel && /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 9,
    color: BT.muted,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    padding: "2px 6px"
  } }, "\uB2E4\uC74C\uAE4C\uC9C0 ", toNextLevel))), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: "100%",
    width: `${energyPct}%`,
    background: energyColor,
    borderRadius: 99,
    transition: "width 0.6s ease, background 0.5s"
  } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 4 } }, CITY_LEVELS.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 2,
    height: 4,
    background: energy >= c.minEnergy ? BT.electric : "rgba(255,255,255,0.15)",
    borderRadius: 1,
    transition: "background 0.4s"
  } })))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "14px 16px 24px" } }, justCompleted && /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(69,238,136,0.12)",
    border: "1px solid rgba(69,238,136,0.25)",
    borderRadius: 12,
    padding: "10px 14px",
    marginBottom: 12,
    textAlign: "center",
    animation: "bt-fadeUp 0.3s ease",
    fontSize: 13,
    color: BT.energyFull,
    fontWeight: 600
  } }, "\u2705 ", MISSIONS[justCompleted].label, " \uC644\uB8CC! +", MISSIONS[justCompleted].energy, " \uC5D0\uB108\uC9C0"), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    fontWeight: 700,
    color: BT.muted,
    marginBottom: 10,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, "\uC624\uB298\uC758 \uD68C\uBCF5 \uBBF8\uC158", gad7Score >= 10 && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, color: BT.amber, background: "rgba(245,200,66,0.12)", borderRadius: 6, padding: "2px 7px", border: "1px solid rgba(245,200,66,0.2)" } }, "\uBD88\uC548 \uCF00\uC5B4"), dass21Score >= 14 && gad7Score < 10 && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, color: BT.electricL, background: "rgba(126,184,247,0.1)", borderRadius: 6, padding: "2px 7px", border: "1px solid rgba(126,184,247,0.2)" } }, "\uC2A4\uD2B8\uB808\uC2A4 \uCF00\uC5B4"), burnoutScore >= 60 && gad7Score < 10 && dass21Score < 14 && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, color: BT.energyLow, background: "rgba(255,107,107,0.1)", borderRadius: 6, padding: "2px 7px", border: "1px solid rgba(255,107,107,0.2)" } }, "\uBC88\uC544\uC6C3 \uC9D1\uC911")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, initialMissions.map((code) => {
    const m = MISSIONS[code];
    const done = completedToday.includes(code);
    const isActive = activeMission === code;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: code,
        className: `bt-mission-card ${done ? "bt-mission-done" : ""}`,
        onClick: (e) => !done && !running && startMission(code, e),
        disabled: done || running,
        style: {
          background: done ? "rgba(69,238,136,0.08)" : isActive ? "rgba(126,184,247,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${done ? "rgba(69,238,136,0.25)" : isActive ? "rgba(126,184,247,0.3)" : "rgba(255,255,255,0.08)"}`,
          cursor: done || running ? "default" : "pointer",
          opacity: running && !isActive ? 0.5 : 1
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        width: 44,
        height: 44,
        borderRadius: 12,
        flexShrink: 0,
        background: done ? "rgba(69,238,136,0.15)" : "rgba(126,184,247,0.08)",
        border: `1px solid ${done ? "rgba(69,238,136,0.2)" : "rgba(126,184,247,0.1)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22
      } }, done ? "\u2705" : m.emoji),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 13,
        fontWeight: 700,
        color: done ? BT.energyFull : BT.cream,
        textDecoration: done ? "none" : "none",
        marginBottom: 2
      } }, m.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: BT.muted, lineHeight: 1.4 } }, m.desc, " \xB7 ", m.duration, "\uBD84")),
      /* @__PURE__ */ React.createElement("div", { style: { flexShrink: 0, textAlign: "center" } }, done ? /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 11,
        color: BT.energyFull,
        fontWeight: 700,
        background: "rgba(69,238,136,0.1)",
        borderRadius: 8,
        padding: "3px 8px",
        border: "1px solid rgba(69,238,136,0.2)"
      } }, "\uC644\uB8CC") : /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 12,
        fontWeight: 700,
        color: BT.amber,
        background: "rgba(245,200,66,0.1)",
        borderRadius: 8,
        padding: "3px 8px",
        border: "1px solid rgba(245,200,66,0.18)"
      } }, "+", m.energy))
    );
  })), completedToday.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, animation: "bt-fadeUp 0.4s ease" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(126,184,247,0.06)",
    border: "1px solid rgba(126,184,247,0.12)",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 12,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: BT.electricL, fontWeight: 600, marginBottom: 4 } }, "\uC624\uB298 +", completedToday.reduce((s, c) => s + MISSIONS[c].energy, 0), " \uC5D0\uB108\uC9C0 \uD68C\uBCF5"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: BT.muted } }, completedToday.length, "\uAC1C \uBBF8\uC158 \uC644\uB8CC \xB7 \uB3C4\uC2DC\uC5D0 \uBD88\uC774 \uCF1C\uC84C\uC5B4\uC694")), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "bt-btn",
      onClick: () => setShowReport(true),
      style: {
        width: "100%",
        padding: "14px",
        background: `linear-gradient(135deg, #2A4A7A, #1E3A60)`,
        color: BT.electricL,
        border: "1px solid rgba(126,184,247,0.2)",
        boxShadow: "0 4px 16px rgba(126,184,247,0.15)",
        marginBottom: 8,
        fontSize: 14
      }
    },
    "\u{1F4CA} \uD68C\uBCF5 \uB9AC\uD3EC\uD2B8 \uBCF4\uAE30"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "bt-btn",
      onClick: () => window.open("https://maumful.com", "_blank", "noopener noreferrer"),
      style: {
        width: "100%",
        padding: "11px",
        background: "rgba(255,255,255,0.05)",
        color: BT.muted,
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: 13
      }
    },
    "\uC804\uBB38 \uC0C1\uB2F4\uC0AC \uC5F0\uACB0 \u2192"
  ))), showReport && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 20,
    animation: "bt-fadeIn 0.2s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#0F1E30",
    borderRadius: 22,
    padding: "24px 22px",
    width: "100%",
    maxWidth: 360,
    border: "1px solid rgba(126,184,247,0.15)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 8 } }, completedToday.length >= 3 ? "\u{1F3D9}\uFE0F" : completedToday.length >= 1 ? "\u{1F303}" : "\u{1F311}"), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 17,
    fontWeight: 700,
    color: BT.cream,
    fontFamily: "'Noto Serif KR',serif",
    marginBottom: 4
  } }, "\uD68C\uBCF5 \uB9AC\uD3EC\uD2B8"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: cityLevel.color } }, cityLevel.name)), /* @__PURE__ */ React.createElement("div", { style: { height: 90, borderRadius: 12, overflow: "hidden", marginBottom: 16 } }, /* @__PURE__ */ React.createElement(CitySVG, { energyPct, completedCount: completedToday.length })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 } }, [
    { label: "\uD68C\uBCF5 \uC5D0\uB108\uC9C0", value: `${energy}\uC810`, color: BT.energyFull },
    { label: "\uC644\uB8CC \uBBF8\uC158", value: `${completedToday.length}\uAC1C`, color: BT.electric },
    { label: "\uC5D0\uB108\uC9C0 \uD68D\uB4DD", value: `+${completedToday.reduce((s, c) => s + MISSIONS[c].energy, 0)}`, color: BT.amber }
  ].map((r) => /* @__PURE__ */ React.createElement("div", { key: r.label, style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.06)"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: BT.muted } }, r.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: r.color } }, r.value)))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(126,184,247,0.06)",
    border: "1px solid rgba(126,184,247,0.12)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 11,
    color: BT.muted,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.6
  } }, "\uB354 \uAE4A\uC740 \uD68C\uBCF5\uC774 \uD544\uC694\uD558\uBA74 \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uC774\uC57C\uAE30\uD574 \uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "bt-btn",
      onClick: () => {
        setShowReport(false);
        if (completedToday.length > 0) handleFinish();
      },
      disabled: finishing,
      style: {
        width: "100%",
        padding: "13px",
        background: completedToday.length > 0 ? `linear-gradient(135deg, ${BT.electric}, #5A90D0)` : "rgba(255,255,255,0.08)",
        color: completedToday.length > 0 ? "white" : BT.muted,
        fontSize: 14,
        boxShadow: completedToday.length > 0 ? "0 4px 16px rgba(126,184,247,0.3)" : "none"
      }
    },
    finishing ? "\uC800\uC7A5 \uC911..." : completedToday.length > 0 ? "\u2728 \uACBD\uD5D8\uCE58 \uBC1B\uAE30" : "\uB2EB\uAE30"
  ))));
}
