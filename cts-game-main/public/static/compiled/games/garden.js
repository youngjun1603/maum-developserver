const GC = {
  sage: "#6B21A8",
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
  rose: "#C97B8A",
  roseL: "#E8B4BE",
  rosePale: "#FCF0F2",
  night: "#1A2A3A",
  nightM: "#2A3F55"
};
const gbtn = (bg, color = "white", extra = {}) => ({
  fontFamily: "'Noto Sans KR', sans-serif",
  cursor: "pointer",
  border: "none",
  outline: "none",
  background: bg,
  color,
  borderRadius: 14,
  fontWeight: 700,
  transition: "all 0.2s",
  ...extra
});
function LakeSVG({ circleSize, currentPhase }) {
  const r = Math.round(100 * circleSize);
  const skyA = currentPhase === "exhale" ? "#B0C8D8" : currentPhase === "hold_in" ? "#3A6A90" : currentPhase === "inhale" ? "#5A8AC0" : "#6B8FA8";
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 320 320", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: "lakeGrad", cx: "50%", cy: "50%", r: "50%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: skyA, stopOpacity: "0.9" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: GC.night, stopOpacity: "0.6" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "circleGrad", cx: "50%", cy: "40%", r: "60%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: skyA, stopOpacity: "0.7" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: GC.dusty, stopOpacity: "0.95" })), /* @__PURE__ */ React.createElement("filter", { id: "glow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "6", result: "blur" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "blur" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))), /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "280", rx: "200", ry: "60", fill: "url(#lakeGrad)", opacity: "0.7" }), [1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(
    "ellipse",
    {
      key: i,
      cx: "160",
      cy: 280 + i * 8,
      rx: 180 - i * 20,
      ry: 10 + i * 4,
      fill: "none",
      stroke: GC.dustyL,
      strokeWidth: "0.8",
      opacity: 0.3 / i
    }
  )), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "160",
      cy: "150",
      r,
      fill: "url(#circleGrad)",
      filter: "url(#glow)",
      style: { transition: "r 0.8s ease-in-out" },
      opacity: "0.88"
    }
  ), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "160",
      cy: "150",
      r: r + 6,
      fill: "none",
      stroke: skyA,
      strokeWidth: "1.5",
      opacity: "0.4",
      style: { transition: "r 0.8s ease-in-out" }
    }
  ), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "160",
      cy: "150",
      r: r + 14,
      fill: "none",
      stroke: skyA,
      strokeWidth: "0.8",
      opacity: "0.2",
      style: { transition: "r 0.8s ease-in-out" }
    }
  ), /* @__PURE__ */ React.createElement("circle", { cx: "260", cy: "50", r: "16", fill: "#E8E0C8", opacity: "0.85" }), /* @__PURE__ */ React.createElement("circle", { cx: "268", cy: "45", r: "13", fill: GC.night, opacity: "0.15" }), [[80, 40], [130, 25], [200, 30], [240, 80], [50, 90]].map(([x, y], i) => /* @__PURE__ */ React.createElement(
    "circle",
    {
      key: i,
      cx: x,
      cy: y,
      r: "1.5",
      fill: "white",
      opacity: 0.5 + i % 3 * 0.15,
      style: { animation: `shimmer ${1.5 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }
    }
  )), /* @__PURE__ */ React.createElement(
    "ellipse",
    {
      cx: "160",
      cy: 265 + r * 0.2,
      rx: r * 0.6,
      ry: r * 0.15,
      fill: skyA,
      opacity: "0.15",
      style: { transition: "all 0.8s ease-in-out" }
    }
  ));
}
const BREATH_METHODS = [
  {
    id: "box",
    name: "\uBC15\uC2A4 \uD638\uD761",
    emoji: "\u2B1C",
    desc: "\uC9D1\uC911\xB7\uC2A4\uD2B8\uB808\uC2A4 \uD574\uC18C",
    phases: [
      { id: "inhale", label: "\uB4E4\uC774\uB9C8\uC2DC\uAE30", color: "#5A8AC0", dur: 4 },
      { id: "hold_in", label: "\uCC38  \uAE30", color: "#6B21A8", dur: 4 },
      { id: "exhale", label: "\uB0B4  \uC26C\uAE30", color: "#9BA8B0", dur: 4 },
      { id: "hold_out", label: "\uCC38  \uAE30", color: "#6B8FA8", dur: 4 }
    ]
  },
  {
    id: "478",
    name: "4-7-8 \uD638\uD761",
    emoji: "\u{1F319}",
    desc: "\uC218\uBA74\xB7\uAE4A\uC740 \uC774\uC644",
    phases: [
      { id: "inhale", label: "\uB4E4\uC774\uB9C8\uC2DC\uAE30", color: "#5A8AC0", dur: 4 },
      { id: "hold_in", label: "\uCC38  \uAE30", color: "#6B21A8", dur: 7 },
      { id: "exhale", label: "\uB0B4  \uC26C\uAE30", color: "#9BA8B0", dur: 8 }
    ]
  },
  {
    id: "calm",
    name: "\uBE60\uB978 \uC548\uC815",
    emoji: "\u26A1",
    desc: "\uBD88\uC548\xB7\uACF5\uD669 \uC2DC \uBE60\uB978 \uC9C4\uC815",
    phases: [
      { id: "inhale", label: "\uB4E4\uC774\uB9C8\uC2DC\uAE30", color: "#5A8AC0", dur: 2 },
      { id: "hold_in", label: "\uCC38  \uAE30", color: "#6B21A8", dur: 1 },
      { id: "exhale", label: "\uB0B4  \uC26C\uAE30", color: "#9BA8B0", dur: 4 }
    ]
  }
];
const CYCLE_OPTIONS = [3, 5, 10];
function BreathingModule({ onComplete, onBack }) {
  const { useState, useEffect, useRef, useCallback } = React;
  const [methodId, setMethodId] = useState(null);
  const [totalCycles, setTotalCycles] = useState(3);
  const selectedMethod = BREATH_METHODS.find((m) => m.id === methodId);
  const PHASES = selectedMethod?.phases || BREATH_METHODS[0].phases;
  const TOTAL_CYCLES = totalCycles;
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionSec, setSessionSec] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const current = PHASES[phase];
  const progress = started ? (tick + 1) / current.dur : 0;
  const circleSize = (() => {
    if (!started) return 0.55;
    if (current.id === "inhale") return 0.5 + tick / (current.dur - 1) * 0.45;
    if (current.id === "hold_in") return 0.95;
    if (current.id === "exhale") return 0.95 - tick / (current.dur - 1) * 0.45;
    return 0.5;
  })();
  const skyColorTop = current.color;
  const tick_ = useCallback(() => {
    setTick((prev) => {
      const nextTick = prev + 1;
      if (nextTick >= PHASES[phase].dur) {
        const nextPhase = (phase + 1) % PHASES.length;
        setPhase(nextPhase);
        if (nextPhase === 0) {
          setCycles((c) => {
            const newC = c + 1;
            if (newC >= TOTAL_CYCLES) {
              clearInterval(intervalRef.current);
              setFinished(true);
              setSessionSec(Math.round((Date.now() - startTimeRef.current) / 1e3));
            }
            return newC;
          });
        }
        return 0;
      }
      return nextTick;
    });
  }, [phase]);
  useEffect(() => {
    if (!started || finished) return;
    intervalRef.current = setInterval(tick_, 1e3);
    return () => clearInterval(intervalRef.current);
  }, [started, finished, tick_]);
  const handleStart = () => {
    startTimeRef.current = Date.now();
    setPhase(0);
    setTick(0);
    setCycles(0);
    setStarted(true);
    setFinished(false);
  };
  const handleFinish = async () => {
    const score = cycles * 30 + Math.min(sessionSec, 60);
    try {
      const res = await GameEngine.saveSession({
        gameId: "garden",
        moduleType: "breathing",
        score,
        durationSec: sessionSec,
        metadata: { cycles_completed: cycles }
      });
      onComplete?.({ score, expGained: res.data?.expGained || 0, leveledUp: res.data?.leveledUp, newAchievements: res.data?.newAchievements || [] });
    } catch {
      onComplete?.({ score, expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };
  if (!methodId) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${GC.night}, ${GC.nightM})`,
      padding: "0 0 24px"
    } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
      ...gbtn("rgba(255,255,255,0.1)", "rgba(255,255,255,0.8)"),
      margin: "16px 0 0 16px",
      padding: "7px 14px",
      fontSize: 12,
      borderRadius: 10,
      width: "fit-content",
      backdropFilter: "blur(8px)"
    } }, "\u2190 \uB4A4\uB85C"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "20px 20px 0", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h2", { style: {
      fontSize: 20,
      fontWeight: 700,
      color: "white",
      marginBottom: 6,
      fontFamily: "'Noto Serif KR', serif"
    } }, "\uD638\uD761\uBC95 \uC120\uD0DD"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.7 } }, "\uC624\uB298 \uCEE8\uB514\uC158\uC5D0 \uB9DE\uB294 \uD638\uD761\uBC95\uC744 \uC120\uD0DD\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 } }, BREATH_METHODS.map((m) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m.id,
        onClick: () => setMethodId(m.id),
        style: {
          ...gbtn("rgba(255,255,255,0.07)", "white", { textAlign: "left", borderRadius: 16 }),
          padding: "16px 18px",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 14
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, lineHeight: 1 } }, m.emoji),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 3 } }, m.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.5)" } }, m.desc), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: GC.dustyL, marginTop: 4, fontWeight: 600 } }, m.phases.map((p) => p.dur).join("-"), " \uBC15\uC790"))
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 10 } }, "\uC0AC\uC774\uD074 \uC218 \uC120\uD0DD"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, CYCLE_OPTIONS.map((n) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n,
        onClick: () => setTotalCycles(n),
        style: {
          ...gbtn(
            totalCycles === n ? `linear-gradient(135deg, ${GC.dusty}, ${GC.dustyL})` : "rgba(255,255,255,0.08)",
            totalCycles === n ? "white" : "rgba(255,255,255,0.6)",
            { borderRadius: 10, flex: 1 }
          ),
          padding: "10px 0",
          fontSize: 14,
          fontWeight: 700,
          border: totalCycles === n ? "none" : "1px solid rgba(255,255,255,0.12)"
        }
      },
      n,
      "\uD68C"
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8, textAlign: "center" } }, "\uC57D ", Math.round(BREATH_METHODS[0].phases.reduce((s, p) => s + p.dur, 0) * totalCycles / 60), "~", Math.round(BREATH_METHODS[1].phases.reduce((s, p) => s + p.dur, 0) * totalCycles / 60 + 1), "\uBD84 \uC18C\uC694")));
  }
  if (finished) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(160deg, ${GC.nightM}, ${GC.dusty})`,
      padding: 32,
      textAlign: "center",
      color: "white",
      animation: "fadeUp 0.5s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, marginBottom: 16 } }, "\u{1F30A}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, "\uD638\uD761 \uD6C8\uB828 \uC644\uB8CC"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, opacity: 0.8, lineHeight: 1.8, marginBottom: 28 } }, selectedMethod?.name, " \xB7 ", cycles, "\uBC88\uC758 \uC0AC\uC774\uD074\uC744 \uB9C8\uCCE4\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), GameEngine.formatDuration(sessionSec), " \uB3D9\uC548 \uB9C8\uC74C\uC774 \uACE0\uC694\uD574\uC84C\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.12)",
      borderRadius: 16,
      padding: "16px 28px",
      marginBottom: 28,
      display: "flex",
      gap: 28
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700 } }, cycles, "\uD68C"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, opacity: 0.7 } }, "\uC644\uB8CC \uC0AC\uC774\uD074")), /* @__PURE__ */ React.createElement("div", { style: { width: 1, background: "rgba(255,255,255,0.2)" } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700 } }, GameEngine.formatDuration(sessionSec)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, opacity: 0.7 } }, "\uC218\uB828 \uC2DC\uAC04"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleFinish,
        style: { ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`), padding: "14px 40px", fontSize: 15 }
      },
      "\uACBD\uD5D8\uCE58 \uBC1B\uAE30 \u2192"
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${GC.night}, ${GC.nightM})`,
    position: "relative",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    ...gbtn("rgba(255,255,255,0.1)", "rgba(255,255,255,0.8)"),
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    padding: "7px 14px",
    fontSize: 12,
    borderRadius: 10,
    backdropFilter: "blur(8px)"
  } }, "\u2190 \uB4A4\uB85C"), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: 10,
    padding: "6px 14px",
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: 600
  } }, started ? `${cycles} / ${TOTAL_CYCLES} \uC0AC\uC774\uD074` : "\uC228 \uC26C\uB294 \uD638\uC218"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 320, aspectRatio: "1", position: "relative" } }, /* @__PURE__ */ React.createElement(LakeSVG, { circleSize, currentPhase: current.id }), started && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    pointerEvents: "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 18,
    fontWeight: 700,
    color: "white",
    fontFamily: "'Noto Serif KR', serif",
    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
    animation: "fadeUp 0.3s ease"
  } }, current.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 300, color: "rgba(255,255,255,0.9)", marginTop: 4 } }, current.dur - tick)))), started && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 8, paddingBottom: 12 } }, PHASES.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: {
    height: 4,
    borderRadius: 100,
    width: i === phase ? 28 : 16,
    background: i <= phase ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
    transition: "all 0.3s ease"
  } }))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(12px)",
    padding: "20px 24px",
    textAlign: "center"
  } }, !started ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 } }, "\uD638\uC218\uCC98\uB7FC \uACE0\uC694\uD558\uAC8C.", /* @__PURE__ */ React.createElement("br", null), "4\uCD08 \uB4E4\uC774\uB9C8\uC2DC\uACE0 \xB7 4\uCD08 \uCC38\uACE0 \xB7 4\uCD08 \uB0B4\uC26C\uC5B4\uC694"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleStart,
      style: { ...gbtn(`linear-gradient(135deg, ${GC.dusty}, ${GC.dustyL})`), padding: "12px 36px", fontSize: 14, borderRadius: 12 }
    },
    "\uD638\uD761 \uC2DC\uC791\uD558\uAE30"
  )) : /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,0.6)", fontSize: 12 } }, "\uB208\uC744 \uAC10\uC544\uB3C4 \uC88B\uC544\uC694 \xB7 ", TOTAL_CYCLES - cycles, "\uC0AC\uC774\uD074 \uB0A8\uC558\uC5B4\uC694")));
}
function TreeSVG({ branchCount = 0, totalBranches = 3 }) {
  const FLOWER_POS = [
    { cx: 160, cy: 72, r: 18 },
    { cx: 120, cy: 95, r: 14 },
    { cx: 198, cy: 90, r: 15 }
  ];
  const PETAL_COLORS = ["#F9A8D4", "#FCD34D", "#86EFAC"];
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 320 220", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "trunkGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#8B6B4A" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#5A3E28" })), /* @__PURE__ */ React.createElement("filter", { id: "bloom" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "blur" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))), /* @__PURE__ */ React.createElement("rect", { width: "320", height: "220", fill: branchCount === 0 ? "#D8CFC0" : branchCount === 1 ? "#C8D8B8" : "#B0CCB0", opacity: "0.3" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "205", rx: "140", ry: "20", fill: "#7A9A6A", opacity: 0.3 + branchCount * 0.15 }), branchCount > 0 && [40, 80, 130, 185, 235, 275].map((x, i) => /* @__PURE__ */ React.createElement("g", { key: x }, /* @__PURE__ */ React.createElement("line", { x1: x, y1: "205", x2: x - 5, y2: 196 - i % 2 * 4, stroke: "#5A8A4A", strokeWidth: "1.5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("line", { x1: x, y1: "205", x2: x + 4, y2: 197 - i % 3 * 3, stroke: "#5A8A4A", strokeWidth: "1.5", strokeLinecap: "round" }))), /* @__PURE__ */ React.createElement("rect", { x: "148", y: "148", width: "24", height: "57", rx: "8", fill: "url(#trunkGrad)" }), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M 160 170 Q 130 155 110 140",
      fill: "none",
      stroke: branchCount >= 2 ? "#7B5F3A" : "#9A8070",
      strokeWidth: "6",
      strokeLinecap: "round",
      style: { transition: "stroke 0.8s" }
    }
  ), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M 160 163 Q 188 150 205 138",
      fill: "none",
      stroke: branchCount >= 3 ? "#7B5F3A" : "#9A8070",
      strokeWidth: "6",
      strokeLinecap: "round",
      style: { transition: "stroke 0.8s" }
    }
  ), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M 160 155 Q 160 130 160 115",
      fill: "none",
      stroke: branchCount >= 1 ? "#7B5F3A" : "#9A8070",
      strokeWidth: "7",
      strokeLinecap: "round",
      style: { transition: "stroke 0.8s" }
    }
  ), [{ cx: 158, cy: 115, rx: 42, ry: 36 }, { cx: 118, cy: 132, rx: 30, ry: 26 }, { cx: 200, cy: 128, rx: 30, ry: 25 }].map(({ cx, cy, rx, ry }, i) => /* @__PURE__ */ React.createElement(
    "ellipse",
    {
      key: i,
      cx,
      cy,
      rx,
      ry,
      fill: branchCount > i ? "#4A8A3A" : "#8A9A7A",
      opacity: branchCount > i ? 0.9 : 0.5,
      style: { transition: "fill 0.8s, opacity 0.8s" }
    }
  )), FLOWER_POS.slice(0, branchCount).map(({ cx, cy, r }, bi) => {
    const pc = PETAL_COLORS[bi % PETAL_COLORS.length];
    return /* @__PURE__ */ React.createElement("g", { key: bi, filter: "url(#bloom)", style: { animation: "fadeUp 0.6s ease" } }, [0, 60, 120, 180, 240, 300].map((a) => /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        key: a,
        cx: cx + Math.cos(a * Math.PI / 180) * (r * 0.55),
        cy: cy + Math.sin(a * Math.PI / 180) * (r * 0.55),
        rx: r * 0.45,
        ry: r * 0.35,
        fill: pc,
        opacity: "0.92",
        transform: `rotate(${a}, ${cx + Math.cos(a * Math.PI / 180) * (r * 0.55)}, ${cy + Math.sin(a * Math.PI / 180) * (r * 0.55)})`
      }
    )), /* @__PURE__ */ React.createElement("circle", { cx, cy, r: r * 0.3, fill: "#FFF8A0" }));
  }), branchCount >= 2 && /* @__PURE__ */ React.createElement(
    "g",
    {
      fill: PETAL_COLORS[0],
      opacity: "0.8",
      style: { animation: "float 3s ease-in-out infinite", transformOrigin: "80px 90px" }
    },
    /* @__PURE__ */ React.createElement("path", { d: "M 80 90 Q 68 82 72 72 Q 80 80 80 90" }),
    /* @__PURE__ */ React.createElement("path", { d: "M 80 90 Q 92 82 88 72 Q 80 80 80 90" }),
    /* @__PURE__ */ React.createElement("line", { x1: "80", y1: "90", x2: "80", y2: "96", stroke: "#8A5A5A", strokeWidth: "1" })
  ), branchCount >= 3 && /* @__PURE__ */ React.createElement(
    "g",
    {
      fill: PETAL_COLORS[2],
      opacity: "0.75",
      style: { animation: "float 2.5s ease-in-out infinite 0.7s", transformOrigin: "235px 110px" }
    },
    /* @__PURE__ */ React.createElement("path", { d: "M 235 110 Q 225 103 228 95 Q 235 102 235 110" }),
    /* @__PURE__ */ React.createElement("path", { d: "M 235 110 Q 245 103 242 95 Q 235 102 235 110" })
  ));
}
const SEED_THOUGHT_POOLS = {
  anxiety: [
    // GAD7 >= 10
    "\uBAA8\uB4E0 \uC77C\uC774 \uC798\uBABB\uB420 \uAC83 \uAC19\uB2E4.",
    "\uB098\uB294 \uD1B5\uC81C\uB825\uC744 \uC783\uC5B4\uAC00\uACE0 \uC788\uB2E4.",
    "\uAC71\uC815\uC744 \uBA48\uCD9C \uC218\uAC00 \uC5C6\uB2E4.",
    "\uB098\uB294 \uB298 \uCD5C\uC545\uC744 \uB300\uBE44\uD574\uC57C \uD55C\uB2E4.",
    "\uAE34\uC7A5\uC744 \uD480\uBA74 \uBB34\uC5B8\uAC00 \uC798\uBABB\uB420 \uAC83 \uAC19\uB2E4.",
    "\uB098\uB294 \uC544\uBB34\uAC83\uB3C4 \uD655\uC2E4\uD558\uAC8C \uD560 \uC218 \uC5C6\uB2E4."
  ],
  depression_severe: [
    // PHQ9 >= 15
    "\uB098\uB294 \uD56D\uC0C1 \uC2E4\uD328\uD560 \uAC83\uC774\uB2E4.",
    "\uC544\uBB34\uAC83\uB3C4 \uB098\uC544\uC9C0\uC9C0 \uC54A\uC744 \uAC83\uC774\uB2E4.",
    "\uB098\uB294 \uC544\uBB34\uC5D0\uAC8C\uB3C4 \uD544\uC694\uD558\uC9C0 \uC54A\uB2E4.",
    "\uC774 \uAC10\uC815\uC740 \uC601\uC6D0\uD788 \uB05D\uB098\uC9C0 \uC54A\uC744 \uAC83\uC774\uB2E4.",
    "\uB098\uB294 \uD63C\uC790\uC11C\uB294 \uC544\uBB34\uAC83\uB3C4 \uD560 \uC218 \uC5C6\uB2E4.",
    "\uB0B4 \uBBF8\uB798\uB294 \uC5B4\uB461\uB2E4."
  ],
  depression_mild: [
    // PHQ9 5~14
    "\uB098\uB294 \uD56D\uC0C1 \uC77C\uC744 \uB9DD\uCE5C\uB2E4.",
    "\uC544\uBB34\uB3C4 \uB098\uB97C \uC774\uD574\uD558\uC9C0 \uBABB\uD55C\uB2E4.",
    "\uB098\uB294 \uC4F8\uBAA8\uC5C6\uB294 \uC0AC\uB78C\uC774\uB2E4.",
    "\uB098\uB294 \uBCC0\uD558\uC9C0 \uBABB\uD560 \uAC83\uC774\uB2E4.",
    "\uB098\uB294 \uD589\uBCF5\uD560 \uC790\uACA9\uC774 \uC5C6\uB2E4.",
    "\uBAA8\uB4E0 \uAC83\uC774 \uB0B4 \uD0D3\uC774\uB2E4."
  ],
  default: [
    // PHQ9 < 5 또는 검사 없음
    "\uB098\uB294 \uB354 \uC798\uD560 \uC218 \uC788\uC5C8\uB294\uB370.",
    "\uC65C \uB098\uB9CC \uC774\uB7F4\uAE4C.",
    "\uB098\uB294 \uB108\uBB34 \uBBFC\uAC10\uD55C \uAC83 \uAC19\uB2E4.",
    "\uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC740 \uB2E4 \uC798 \uC0AC\uB294 \uAC83 \uAC19\uB2E4.",
    "\uB098\uB294 \uAC8C\uC73C\uB978 \uAC83 \uAC19\uB2E4.",
    "\uB098\uB294 \uC88B\uC740 \uC0AC\uB78C\uC774 \uC544\uB2CC \uAC83 \uAC19\uB2E4."
  ]
};
function getSeedThoughts(userTestScores) {
  const phq9 = userTestScores?.PHQ9 ?? null;
  const gad7 = userTestScores?.GAD7 ?? null;
  if (gad7 !== null && gad7 >= 10) return SEED_THOUGHT_POOLS.anxiety;
  if (phq9 !== null && phq9 >= 15) return SEED_THOUGHT_POOLS.depression_severe;
  if (phq9 !== null && phq9 >= 5) return SEED_THOUGHT_POOLS.depression_mild;
  return SEED_THOUGHT_POOLS.default;
}
function CBTModule({ onComplete, onBack, userTestScores = {} }) {
  const { useState, useEffect, useRef } = React;
  const TOTAL_BRANCHES = 3;
  const SEED_THOUGHTS = getSeedThoughts(userTestScores);
  const [step, setStep] = useState("intro");
  const [branches, setBranches] = useState([]);
  const [current, setCurrent] = useState({ original: "", transformed: "", editing: false });
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [sessionSec, setSessionSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSec(Math.round((Date.now() - startRef.current) / 1e3));
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const handleSelectSeed = (text) => {
    setInputText(text);
    setStep("input");
  };
  const handleRequestAI = async () => {
    const text = inputText.trim();
    if (!text || text.length < 3) {
      setAiError("\uC0DD\uAC01\uC744 \uB354 \uC368\uC8FC\uC138\uC694");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await GameEngine.transformSentence(text);
      if (res.success) {
        setCurrent({ original: text, transformed: res.data.result, editing: false });
        setStep("transform");
      } else {
        setAiError(res.error || "AI \uBCC0\uD658 \uC2E4\uD328");
      }
    } catch {
      setAiError("\uC5F0\uACB0 \uC624\uB958. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
    }
    setAiLoading(false);
  };
  const handleAccept = (transformed) => {
    const newBranch = { original: current.original, transformed };
    setBranches((prev) => {
      const next = [...prev, newBranch];
      if (next.length >= TOTAL_BRANCHES) {
        setFinished(true);
        setStep("done");
      } else {
        setInputText("");
        setStep("input");
      }
      return next;
    });
    setCurrent({ original: "", transformed: "", editing: false });
  };
  const handleFinish = async () => {
    const score = branches.length * 40 + Math.min(sessionSec * 0.5, 40);
    try {
      const res = await GameEngine.saveSession({
        gameId: "garden",
        moduleType: "cbt",
        score: Math.round(score),
        durationSec: sessionSec,
        metadata: { branches_completed: branches.length, branch_texts: branches.map((b) => b.original) }
      });
      onComplete?.({ score: Math.round(score), expGained: res.data?.expGained || 0, leveledUp: res.data?.leveledUp, newAchievements: res.data?.newAchievements || [] });
    } catch {
      onComplete?.({ score: Math.round(score), expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };
  if (step === "done") {
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${GC.sagePale}, #D4EAD0)`,
      padding: 24,
      animation: "fadeUp 0.5s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { height: 180 } }, /* @__PURE__ */ React.createElement(TreeSVG, { branchCount: TOTAL_BRANCHES })), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: GC.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" } }, "\uAF43\uC774 \uD53C\uC5C8\uC2B5\uB2C8\uB2E4 \u{1F338}"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: GC.muted, lineHeight: 1.8 } }, TOTAL_BRANCHES, "\uAC1C\uC758 \uC0DD\uAC01\uC744 \uC0C8\uB86D\uAC8C \uBC14\uAFE8\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC774 \uBCC0\uD654\uAC00 \uB9C8\uC74C\uC5D0 \uC2A4\uBA70\uB4E4\uACE0 \uC788\uC5B4\uC694.")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 } }, branches.map((b, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
      background: "white",
      borderRadius: 14,
      padding: "14px 16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: GC.muted, marginBottom: 5 } }, "\uC774\uC804 \uC0DD\uAC01"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: GC.muted, marginBottom: 8, textDecoration: "line-through" } }, b.original), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: GC.sage, marginBottom: 5 } }, "\uC0C8\uB85C\uC6B4 \uC0DD\uAC01 \u2713"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: GC.dark, fontWeight: 500, lineHeight: 1.6 } }, b.transformed)))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleFinish,
        style: { ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`), padding: "14px", fontSize: 15, textAlign: "center" }
      },
      "\uACBD\uD5D8\uCE58 \uBC1B\uAE30 \u2192"
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, #F0EDE5, ${GC.cream})`,
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: {
    ...gbtn("rgba(0,0,0,0.06)", GC.muted, { borderRadius: 9 }),
    padding: "6px 14px",
    fontSize: 12
  } }, "\u2190 \uB4A4\uB85C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, Array.from({ length: TOTAL_BRANCHES }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: i < branches.length ? GC.sage : "rgba(0,0,0,0.12)",
    transition: "background 0.4s"
  } }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GC.muted, fontWeight: 600 } }, branches.length, "/", TOTAL_BRANCHES, " \uC644\uC131")), /* @__PURE__ */ React.createElement("div", { style: { height: 190, padding: "0 24px", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(TreeSVG, { branchCount: branches.length })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 20px 24px" } }, step === "intro" && /* @__PURE__ */ React.createElement("div", { style: { animation: "fadeUp 0.4s ease" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: GC.dark, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" } }, "\uC0DD\uAC01\uC758 \uAC00\uC9C0\uCE58\uAE30"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: GC.muted, lineHeight: 1.75, marginBottom: 20 } }, "\uB9C8\uC74C\uC18D \uBD80\uC815\uC801\uC778 \uC0DD\uAC01\uC744 \uD558\uB098\uC529 \uAEBC\uB0B4\uC5B4", /* @__PURE__ */ React.createElement("br", null), "\uC0C8\uB85C\uC6B4 \uC2DC\uC120\uC73C\uB85C \uBC14\uB77C\uBD10\uC694.", /* @__PURE__ */ React.createElement("br", null), TOTAL_BRANCHES, "\uAC1C\uC758 \uAC00\uC9C0\uC5D0 \uAF43\uC744 \uD53C\uC6CC\uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: GC.muted, marginBottom: 10 } }, "\uC790\uC8FC \uB4DC\uB294 \uC0DD\uAC01\uC744 \uC120\uD0DD\uD558\uAC70\uB098"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 } }, SEED_THOUGHTS.slice(0, 4).map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t,
      onClick: () => handleSelectSeed(t),
      style: {
        ...gbtn("rgba(255,255,255,0.8)", GC.dark, { fontWeight: 400, textAlign: "left", borderRadius: 12 }),
        padding: "11px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
      }
    },
    '"',
    t,
    '"'
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setInputText("");
        setStep("input");
      },
      style: { ...gbtn(GC.sagePale, GC.sage, { borderRadius: 12 }), padding: "10px 20px", fontSize: 13, width: "100%" }
    },
    "\uC9C1\uC811 \uC785\uB825\uD558\uAE30"
  )), step === "input" && /* @__PURE__ */ React.createElement("div", { style: { animation: "fadeUp 0.4s ease" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: GC.dark, marginBottom: 6 } }, branches.length + 1, "\uBC88\uC9F8 \uC0DD\uAC01"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: GC.muted, marginBottom: 14 } }, "\uC9C0\uAE08 \uB9C8\uC74C\uC18D\uC5D0 \uC790\uC8FC \uB5A0\uC624\uB974\uB294 \uBD80\uC815\uC801\uC778 \uC0DD\uAC01\uC744 \uC194\uC9C1\uD558\uAC8C \uC368\uC8FC\uC138\uC694."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: inputText,
      onChange: (e) => setInputText(e.target.value),
      placeholder: "\uC608) \uB098\uB294 \uB298 \uD63C\uC790\uC778 \uAC83 \uAC19\uB2E4.",
      rows: 3,
      style: {
        width: "100%",
        padding: "13px 14px",
        border: `1.5px solid ${GC.sage}44`,
        borderRadius: 12,
        fontSize: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        outline: "none",
        resize: "none",
        lineHeight: 1.65,
        background: "rgba(255,255,255,0.9)",
        color: GC.dark,
        marginBottom: 12
      },
      onFocus: (e) => e.target.style.borderColor = GC.sage,
      onBlur: (e) => e.target.style.borderColor = `${GC.sage}44`
    }
  ), aiError && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#C05050", marginBottom: 10 } }, aiError), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 9 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setStep("intro"),
      style: { ...gbtn("rgba(0,0,0,0.07)", GC.muted, { borderRadius: 12, flex: 1 }), padding: "11px" }
    },
    "\uB2E4\uC2DC \uC120\uD0DD"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleRequestAI,
      disabled: aiLoading || !inputText.trim(),
      style: {
        ...gbtn(
          aiLoading || !inputText.trim() ? "rgba(0,0,0,0.1)" : `linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`,
          aiLoading || !inputText.trim() ? GC.muted : "white",
          { borderRadius: 12, flex: 2 }
        ),
        padding: "11px"
      }
    },
    aiLoading ? "\uBCC0\uD658 \uC911..." : "\u{1F331} AI\uB85C \uC0C8\uB86D\uAC8C \uBCF4\uAE30"
  ))), step === "transform" && /* @__PURE__ */ React.createElement("div", { style: { animation: "fadeUp 0.4s ease" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 14,
    borderLeft: `3px solid ${GC.muted}`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: GC.muted, marginBottom: 5 } }, "\uC774\uC804 \uC0DD\uAC01"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: GC.muted, lineHeight: 1.6, textDecoration: "line-through" } }, current.original)), /* @__PURE__ */ React.createElement("div", { style: {
    background: `${GC.sagePale}CC`,
    borderRadius: 12,
    padding: "14px",
    marginBottom: 16,
    border: `1.5px solid ${GC.sage}44`
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: GC.sage, marginBottom: 8 } }, "\u{1F338} \uC0C8\uB85C\uC6B4 \uC2DC\uC120"), current.editing ? /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: current.transformed,
      onChange: (e) => setCurrent((c) => ({ ...c, transformed: e.target.value })),
      rows: 3,
      style: {
        width: "100%",
        padding: "10px",
        border: `1px solid ${GC.sage}66`,
        borderRadius: 9,
        fontSize: 13,
        fontFamily: "'Noto Sans KR', sans-serif",
        outline: "none",
        resize: "none",
        lineHeight: 1.65,
        background: "white",
        color: GC.dark
      }
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: GC.dark, lineHeight: 1.75, fontWeight: 500 } }, current.transformed)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 9, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setCurrent((c) => ({ ...c, editing: !c.editing })),
      style: { ...gbtn("rgba(0,0,0,0.07)", GC.muted, { borderRadius: 12, flex: 1 }), padding: "10px", fontSize: 12 }
    },
    current.editing ? "\uC644\uB8CC" : "\u270F\uFE0F \uC218\uC815"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setStep("input");
        setAiError("");
      },
      style: { ...gbtn(GC.sand, GC.muted, { borderRadius: 12, flex: 1, border: `1px solid rgba(0,0,0,0.08)` }), padding: "10px", fontSize: 12 }
    },
    "\uB2E4\uC2DC \uC4F0\uAE30"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleAccept(current.transformed),
      style: {
        ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`),
        width: "100%",
        padding: "14px",
        fontSize: 14,
        borderRadius: 14,
        boxShadow: `0 4px 16px ${GC.sage}40`
      }
    },
    "\uC774 \uC0DD\uAC01\uC744 \uBC1B\uC544\uB4E4\uC774\uAE30 \u{1F338}"
  ), branches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: GC.muted, marginBottom: 6 } }, "\uC644\uC131\uB41C \uAC00\uC9C0"), branches.map((b, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 12, color: GC.sage, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${GC.sageL}` } }, b.transformed))))));
}
function GardenGame({ onExit, userTestScores = {} }) {
  const { useState } = React;
  const [screen, setScreen] = useState("select");
  const [result, setResult] = useState(null);
  const MODULES = [
    {
      id: "breathing",
      name: "\uC228 \uC26C\uB294 \uD638\uC218",
      emoji: "\u{1F4A7}",
      desc: "4-4-4 \uBC15\uC2A4 \uD638\uD761\uC73C\uB85C \uBAB8\uACFC \uB9C8\uC74C\uC744 \uACE0\uC694\uD558\uAC8C",
      duration: "\uC57D 5\uBD84",
      tags: ["\uC774\uC644", "\uC2A4\uD2B8\uB808\uC2A4"],
      color: GC.dusty,
      colorL: GC.dustyL,
      bgFrom: "#1A2A3A",
      bgTo: "#2A3F55"
    },
    {
      id: "cbt",
      name: "\uC0DD\uAC01\uC758 \uAC00\uC9C0\uCE58\uAE30",
      emoji: "\u{1F331}",
      desc: "\uBD80\uC815\uC801\uC778 \uC0DD\uAC01\uC744 AI\uC640 \uD568\uAED8 \uAE0D\uC815 \uD655\uC5B8\uC73C\uB85C \uBCC0\uD658",
      duration: "\uC57D 7~10\uBD84",
      tags: ["\uC778\uC9C0\uAD50\uC815", "CBT"],
      color: GC.sage,
      colorL: GC.sageL,
      bgFrom: "#F0EDE5",
      bgTo: GC.cream
    }
  ];
  const handleModuleComplete = (res) => {
    setResult(res);
    setScreen("result");
  };
  if (screen === "select") {
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${GC.sagePale}, ${GC.cream})`
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: GC.dark, fontFamily: "'Noto Serif KR', serif" } }, "\uB9C8\uC74C\uC758 \uC815\uC6D0")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onExit,
        style: { ...gbtn("rgba(0,0,0,0.06)", GC.muted, { borderRadius: 9 }), padding: "6px 13px", fontSize: 12 }
      },
      "\uD5C8\uBE0C\uB85C \u2192"
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "24px 20px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: 18,
      padding: "16px 18px",
      marginBottom: 22,
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.6)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: GC.muted, marginBottom: 5 } }, "\uC624\uB298\uC758 \uC815\uC6D0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: GC.dark, fontWeight: 500 } }, "\uC5B4\uB5A4 \uD6C8\uB828\uC744 \uD574\uBCFC\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: GC.muted, marginTop: 4, lineHeight: 1.6 } }, "\uD638\uD761\uC73C\uB85C \uBAB8\uC744 \uC548\uC815\uC2DC\uD0A4\uAC70\uB098,", /* @__PURE__ */ React.createElement("br", null), "\uC0DD\uAC01\uC744 \uC0C8\uB86D\uAC8C \uAC00\uAFD4\uBCF4\uC138\uC694.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, MODULES.map((m) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m.id,
        onClick: () => setScreen(m.id),
        style: {
          ...gbtn("transparent", GC.dark, { textAlign: "left", borderRadius: 20 }),
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: `1px solid rgba(255,255,255,0.7)`
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        height: 6,
        background: `linear-gradient(90deg, ${m.color}, ${m.colorL})`
      } }),
      /* @__PURE__ */ React.createElement("div", { style: { padding: "18px 18px 16px", background: "rgba(255,255,255,0.85)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 32, lineHeight: 1 } }, m.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: GC.dark } }, m.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: m.color, fontWeight: 600 } }, m.duration))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: GC.muted, lineHeight: 1.6, marginBottom: 10 } }, m.desc), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, m.tags.map((t) => /* @__PURE__ */ React.createElement("span", { key: t, style: {
        fontSize: 10,
        padding: "2px 9px",
        borderRadius: 100,
        background: `${m.color}18`,
        color: m.color,
        fontWeight: 600
      } }, t))))
    )))));
  }
  if (screen === "result") {
    const r = result || {};
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      textAlign: "center",
      background: `linear-gradient(160deg, ${GC.sagePale}, #D4EAD0)`,
      animation: "fadeUp 0.5s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 16 } }, r.leveledUp ? "\u{1F389}" : "\u{1F33F}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: GC.dark, marginBottom: 10, fontFamily: "'Noto Serif KR', serif" } }, r.leveledUp ? "\uB808\uBCA8 \uC5C5!" : "\uC624\uB298\uB3C4 \uC218\uACE0\uD588\uC5B4\uC694"), /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 18,
      padding: "20px 32px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      marginBottom: 24,
      display: "flex",
      gap: 28
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 700, color: GC.sage } }, "+", r.expGained), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: GC.muted } }, "\uACBD\uD5D8\uCE58")), r.newAchievements?.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { width: 1, background: "rgba(0,0,0,0.08)" } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 700, color: GC.amber } }, r.newAchievements.map((id) => GameEngine.getAchievementInfo(id).emoji).join("")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: GC.muted } }, "\uC0C8 \uC5C5\uC801")))), r.newAchievements?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      background: `${GC.amberL}33`,
      borderRadius: 12,
      padding: "10px 20px",
      marginBottom: 20
    } }, r.newAchievements.map((id) => {
      const a = GameEngine.getAchievementInfo(id);
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { fontSize: 13, color: GC.amber, fontWeight: 600 } }, a.emoji, " ", a.name, " \uB2EC\uC131!");
    })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, width: "100%", maxWidth: 280 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("select"),
        style: { ...gbtn(GC.sagePale, GC.sage, { borderRadius: 13, flex: 1 }), padding: "12px", fontSize: 13 }
      },
      "\uD55C \uBC88 \uB354"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onExit,
        style: {
          ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`),
          flex: 2,
          padding: "12px",
          fontSize: 13,
          borderRadius: 13
        }
      },
      "\uD5C8\uBE0C\uB85C \u2192"
    )));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column" } }, screen === "breathing" && /* @__PURE__ */ React.createElement(
    BreathingModule,
    {
      onComplete: handleModuleComplete,
      onBack: () => setScreen("select")
    }
  ), screen === "cbt" && /* @__PURE__ */ React.createElement(
    CBTModule,
    {
      onComplete: handleModuleComplete,
      onBack: () => setScreen("select"),
      userTestScores
    }
  ));
}
