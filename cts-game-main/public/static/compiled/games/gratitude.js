const GV = {
  night: "#0D1B2A",
  nightM: "#1A2E42",
  nightL: "#254B6A",
  star: "#FFE08A",
  starL: "#FFF5C8",
  rose: "#C97B8A",
  rosePale: "#FCF0F2",
  sage: "#6B21A8",
  sagePale: "#EAF2EC",
  cream: "#FDFCF7",
  muted: "#8A8A78",
  dark: "#2C2C20",
  dusty: "#6B8FA8",
  dustyL: "#A8C4D4",
  amber: "#D4954A"
};
const QUESTION_POOL = [
  [
    { id: "q1", prompt: "\uC624\uB298 \uC791\uC740 \uAE30\uC068\uC744 \uC900 \uAC83\uC740?", placeholder: "\uB530\uB73B\uD55C \uCEE4\uD53C \uD55C \uC794, \uB9D1\uC740 \uD558\uB298... \uC544\uC8FC \uC791\uC544\uB3C4 \uC88B\uC544\uC694", emoji: "\u2615" },
    { id: "q2", prompt: "\uB098\uC5D0\uAC8C \uAC10\uC0AC\uD55C \uB0B4 \uBAA8\uC2B5\uC740?", placeholder: "\uB05D\uAE4C\uC9C0 \uD3EC\uAE30\uD558\uC9C0 \uC54A\uC558\uB358 \uAC83, \uC798 \uACAC\uB38C\uB0B8 \uAC83...", emoji: "\u{1F4AA}" },
    { id: "q3", prompt: "\uB0B4\uC77C \uAE30\uB300\uB418\uB294 \uD55C \uAC00\uC9C0\uB294?", placeholder: "\uC544\uC8FC \uC791\uC740 \uAC83\uB3C4 \uAD1C\uCC2E\uC544\uC694", emoji: "\u{1F305}" }
  ],
  [
    { id: "q1", prompt: "\uC624\uB298 \uB098\uB97C \uBBF8\uC18C \uC9D3\uAC8C \uD55C \uAC83\uC740?", placeholder: "\uC5B4\uB5A4 \uC21C\uAC04\uC774\uB4E0 \uC88B\uC544\uC694", emoji: "\u{1F60A}" },
    { id: "q2", prompt: "\uC624\uB298 \uB0B4\uAC00 \uC798\uD55C \uD55C \uAC00\uC9C0\uB294?", placeholder: "\uC544\uBB34\uB9AC \uC791\uC544\uB3C4 \uC9C4\uC9DC \uC798\uD55C \uAC70\uC608\uC694", emoji: "\u2728" },
    { id: "q3", prompt: "\uB098\uC758 \uC0B6\uC5D0 \uC788\uC5B4\uC11C \uAC10\uC0AC\uD55C \uAC83\uC740?", placeholder: "\uC0AC\uB78C, \uACF5\uAC04, \uC0C1\uD669... \uBB34\uC5C7\uC774\uB4E0", emoji: "\u{1F64F}" }
  ],
  [
    { id: "q1", prompt: "\uC624\uB298 \uB098\uC5D0\uAC8C \uCE5C\uC808\uD588\uB358 \uAC83\uC740?", placeholder: "\uB098 \uC790\uC2E0\uC774\uAC70\uB098 \uB2E4\uB978 \uB204\uAD70\uAC00", emoji: "\u{1F499}" },
    { id: "q2", prompt: "\uD798\uB4E4\uC5C8\uC9C0\uB9CC \uBC84\uD168\uB0B8 \uAC83\uC774 \uC788\uB2E4\uBA74?", placeholder: "\uB2F9\uC2E0\uC740 \uC774\uBBF8 \uC798\uD558\uACE0 \uC788\uC5B4\uC694", emoji: "\u{1F33F}" },
    { id: "q3", prompt: "\uC9C0\uAE08 \uC774 \uC21C\uAC04 \uB290\uB07C\uB294 \uC88B\uC740 \uAC10\uAC01\uC740?", placeholder: "\uB530\uB73B\uD568, \uC870\uC6A9\uD568, \uD3B8\uC548\uD568...", emoji: "\u{1F343}" }
  ]
];
function Star({ x, y, r, opacity = 1, twinkle = false, color = GV.star }) {
  return /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: x,
      cy: y,
      r,
      fill: color,
      opacity,
      style: twinkle ? {
        animation: `shimmer ${1.5 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`
      } : {}
    }
  );
}
function StarShape({ x, y, size = 12, glow = false }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    const ai = (i * 72 + 36 - 90) * Math.PI / 180;
    const or = size, ir = size * 0.4;
    return [
      x + Math.cos(a) * or,
      y + Math.sin(a) * or,
      x + Math.cos(ai) * ir,
      y + Math.sin(ai) * ir
    ];
  }).flat();
  const d = `M ${pts[0]},${pts[1]} ` + pts.slice(2).reduce((acc, v, i) => acc + (i % 2 === 0 ? `L ${v},` : `${v} `), "") + "Z";
  return /* @__PURE__ */ React.createElement("g", null, glow && /* @__PURE__ */ React.createElement(
    "path",
    {
      d,
      fill: GV.star,
      opacity: "0.2",
      transform: `scale(1.6) translate(${x * (1 - 1 / 1.6)},${y * (1 - 1 / 1.6)})`
    }
  ), /* @__PURE__ */ React.createElement(
    "path",
    {
      d,
      fill: GV.star,
      style: { animation: glow ? "shimmer 2s ease-in-out infinite" : "none" }
    }
  ));
}
function NightSky({ litStars = 0, width = 320, height = 200 }) {
  const bgStars = [
    { x: 30, y: 30, r: 1 },
    { x: 80, y: 15, r: 1.2 },
    { x: 140, y: 25, r: 0.8 },
    { x: 200, y: 10, r: 1 },
    { x: 260, y: 30, r: 1.3 },
    { x: 290, y: 55, r: 0.9 },
    { x: 50, y: 70, r: 0.8 },
    { x: 110, y: 55, r: 1.1 },
    { x: 175, y: 45, r: 0.9 },
    { x: 235, y: 65, r: 1 },
    { x: 310, y: 80, r: 0.8 },
    { x: 20, y: 100, r: 1.2 }
  ];
  const answerStars = [
    { x: 110, y: 85, size: 16 },
    { x: 175, y: 62, size: 18 },
    { x: 240, y: 88, size: 14 }
  ];
  return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${width} ${height}`, style: { width: "100%", height: "100%" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: "skyGrad", cx: "50%", cy: "0%", r: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: GV.nightL }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: GV.night })), /* @__PURE__ */ React.createElement("filter", { id: "starGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "3", result: "blur" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "blur" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))), /* @__PURE__ */ React.createElement("rect", { width, height, fill: "url(#skyGrad)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: width * 0.3, cy: height, rx: width * 0.55, ry: height * 0.22, fill: GV.nightM }), /* @__PURE__ */ React.createElement("ellipse", { cx: width * 0.75, cy: height, rx: width * 0.45, ry: height * 0.16, fill: GV.nightM, opacity: "0.8" }), bgStars.map((s, i) => /* @__PURE__ */ React.createElement(
    Star,
    {
      key: i,
      x: s.x,
      y: s.y,
      r: s.r,
      opacity: 0.4 + i % 3 * 0.1,
      color: "white",
      twinkle: true
    }
  )), /* @__PURE__ */ React.createElement("circle", { cx: width * 0.82, cy: height * 0.18, r: 18, fill: "#F5E8B0", opacity: 0.9 }), /* @__PURE__ */ React.createElement("circle", { cx: width * 0.82 + 6, cy: height * 0.18 - 4, r: 15, fill: GV.nightM, opacity: 0.2 }), answerStars.map((s, i) => /* @__PURE__ */ React.createElement(
    "g",
    {
      key: i,
      opacity: i < litStars ? 1 : 0.15,
      style: { transition: "opacity 0.8s ease" },
      filter: i < litStars ? "url(#starGlow)" : "none"
    },
    /* @__PURE__ */ React.createElement(StarShape, { x: s.x, y: s.y, size: s.size, glow: i < litStars }),
    i < litStars && /* @__PURE__ */ React.createElement(
      "text",
      {
        x: s.x,
        y: s.y + s.size + 12,
        textAnchor: "middle",
        fill: GV.starL,
        style: { fontSize: 9, fontFamily: "'Noto Sans KR',sans-serif", fontWeight: 600 }
      },
      i === 0 ? "\uAE30\uC068" : i === 1 ? "\uB098" : "\uB0B4\uC77C"
    )
  )), litStars >= 3 && /* @__PURE__ */ React.createElement("g", { opacity: "0.15" }, Array.from({ length: 20 }, (_, i) => /* @__PURE__ */ React.createElement(
    "circle",
    {
      key: i,
      cx: 50 + i * 12,
      cy: 120 + Math.sin(i * 0.8) * 18,
      r: 0.8 + Math.random() * 0.5,
      fill: "white"
    }
  ))));
}
function GratitudeGame({ onExit }) {
  const { useState, useEffect, useRef } = React;
  const [screen, setScreen] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [activeQ, setActiveQ] = useState(0);
  const [litStars, setLitStars] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(false);
  const [sessionSec, setSessionSec] = useState(0);
  const startRef = useRef(Date.now());
  const dayIdx = (/* @__PURE__ */ new Date()).getDay() % QUESTION_POOL.length;
  const questions = QUESTION_POOL[dayIdx];
  useEffect(() => {
    if (screen !== "writing") return;
    const t = setInterval(() => {
      setSessionSec(Math.round((Date.now() - startRef.current) / 1e3));
    }, 1e3);
    return () => clearInterval(t);
  }, [screen]);
  const handleAnswer = (qIdx, val) => {
    setAnswers((prev) => ({ ...prev, [questions[qIdx].id]: val }));
  };
  const handleConfirm = (qIdx) => {
    const val = answers[questions[qIdx].id]?.trim();
    if (!val || val.length < 2) return;
    setAnimatingStar(true);
    setTimeout(() => {
      setLitStars(qIdx + 1);
      setAnimatingStar(false);
      if (qIdx + 1 < questions.length) {
        setActiveQ(qIdx + 1);
      } else {
        setTimeout(() => setScreen("done"), 600);
      }
    }, 400);
  };
  const handleFinish = async () => {
    const score = Object.values(answers).filter((a) => a?.trim().length >= 2).length * 35;
    const answerTexts = Object.values(answers).filter(Boolean);
    const totalChars = answerTexts.reduce((a, v) => a + v.length, 0);
    const bonusScore = Math.min(totalChars, 30);
    try {
      const res = await GameEngine.saveSession({
        gameId: "gratitude",
        moduleType: "RELAX",
        score: score + bonusScore,
        durationSec: sessionSec,
        metadata: {
          questions_answered: litStars,
          answer_count: answerTexts.length,
          total_chars: totalChars,
          answers: Object.fromEntries(questions.map((q) => [q.id, answers[q.id] || ""]))
        }
      });
      onExit?.({
        score: score + bonusScore,
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || []
      });
    } catch {
      onExit?.({ score: score + bonusScore, expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };
  function shareGratitude() {
    const lines = questions.map((q) => answers[q.id]?.trim()).filter(Boolean).map((a, i) => `${questions[i].emoji} ${a}`);
    const text = `\u2B50 \uC624\uB298\uC758 \uAC10\uC0AC \uC77C\uAE30

${lines.join("\n")}

\uB9C8\uC74C\uAC8C\uC784\uC5D0\uC11C \uD568\uAED8\uD574\uC694 \u{1F495}
https://game.maumful.com`;
    navigator.share ? navigator.share({ title: "\uC624\uB298\uC758 \uAC10\uC0AC \uC77C\uAE30", text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  if (screen === "intro") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${GV.night}, ${GV.nightM})`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(0,0,0,0.2)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u2B50"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "white", fontFamily: "'Noto Serif KR',serif" } }, "\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30")), /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.7)",
    border: "none",
    borderRadius: 9,
    padding: "6px 13px",
    fontSize: 12,
    cursor: "pointer"
  } }, "\uD5C8\uBE0C\uB85C \u2192")), /* @__PURE__ */ React.createElement("div", { style: { height: 200 } }, /* @__PURE__ */ React.createElement(NightSky, { litStars: 0 })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "24px 20px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, fontWeight: 700, color: "white", marginBottom: 10, fontFamily: "'Noto Serif KR',serif" } }, "\uC624\uB298\uC758 \uBCC4\uC744 \uBC1D\uD600\uC694"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 24 } }, "3\uAC00\uC9C0 \uC9C8\uBB38\uC5D0 \uC194\uC9C1\uD558\uAC8C \uB2F5\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uBC24\uD558\uB298\uC5D0 \uAC10\uC0AC\uC758 \uBCC4 3\uAC1C\uAC00 \uBE5B\uB098\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC544\uC8FC \uC791\uC740 \uAC83\uB3C4 \uCDA9\uBD84\uD574\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 } }, questions.map((q, i) => /* @__PURE__ */ React.createElement("div", { key: q.id, style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, q.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 } }, q.prompt)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        startRef.current = Date.now();
        setScreen("writing");
      },
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        width: "100%",
        padding: "14px",
        background: `linear-gradient(135deg, #4A5A8A, ${GV.dusty})`,
        color: "white",
        border: "none",
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: `0 4px 16px rgba(107,143,168,0.4)`
      }
    },
    "\uBCC4 \uBC1D\uD788\uAE30 \uC2DC\uC791 \u2B50"
  )));
  if (screen === "writing") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${GV.night}, ${GV.nightM})`
  } }, /* @__PURE__ */ React.createElement("div", { style: { height: 190, position: "relative" } }, /* @__PURE__ */ React.createElement(NightSky, { litStars }), animatingStar && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 48,
    animation: "ripple 0.5s ease-out forwards"
  } }, "\u2728")), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8
  } }, questions.map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: i < litStars ? GV.star : "rgba(255,255,255,0.25)",
    transition: "background 0.5s ease"
  } })))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "16px 18px 24px" } }, questions.map((q, i) => {
    const isActive = i === activeQ;
    const isDone = i < litStars;
    const isPending = i > activeQ;
    return /* @__PURE__ */ React.createElement("div", { key: q.id, style: {
      marginBottom: 14,
      borderRadius: 18,
      overflow: "hidden",
      border: `1px solid ${isDone ? "rgba(255,224,138,0.3)" : isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
      background: isDone ? "rgba(255,224,138,0.08)" : isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
      transition: "all 0.4s ease",
      opacity: isPending ? 0.5 : 1
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: isActive ? "1px solid rgba(255,255,255,0.08)" : "none"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, opacity: isDone ? 1 : 0.8 } }, q.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: isDone ? GV.starL : "rgba(255,255,255,0.85)", fontWeight: 600, flex: 1, lineHeight: 1.5 } }, q.prompt), isDone && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u2B50")), isActive && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 14px" } }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: answers[q.id] || "",
        onChange: (e) => handleAnswer(i, e.target.value),
        placeholder: q.placeholder,
        rows: 3,
        autoFocus: true,
        style: {
          width: "100%",
          padding: "11px 12px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10,
          color: "white",
          fontSize: 14,
          fontFamily: "'Noto Sans KR',sans-serif",
          outline: "none",
          resize: "none",
          lineHeight: 1.65
        },
        onFocus: (e) => e.target.style.borderColor = "rgba(255,224,138,0.5)",
        onBlur: (e) => e.target.style.borderColor = "rgba(255,255,255,0.15)"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleConfirm(i),
        disabled: !(answers[q.id]?.trim().length >= 2),
        style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          marginTop: 10,
          width: "100%",
          padding: "11px",
          background: answers[q.id]?.trim().length >= 2 ? `linear-gradient(135deg, #7A6A30, ${GV.amber})` : "rgba(255,255,255,0.08)",
          color: answers[q.id]?.trim().length >= 2 ? "white" : "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s"
        }
      },
      i === questions.length - 1 ? "\uB9C8\uC9C0\uB9C9 \uBCC4 \uBC1D\uD788\uAE30 \u2B50" : "\uBCC4 \uBC1D\uD788\uAE30 \u2B50"
    )), isDone && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px 12px", fontSize: 13, color: "rgba(255,224,138,0.8)", lineHeight: 1.6, fontStyle: "italic" } }, '"', answers[q.id], '"'));
  })));
  if (screen === "done") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${GV.night}, ${GV.nightM})`,
    animation: "fadeUp 0.5s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { height: 200 } }, /* @__PURE__ */ React.createElement(NightSky, { litStars: 3 })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "24px 20px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: "white", marginBottom: 8, fontFamily: "'Noto Serif KR',serif", textAlign: "center" } }, "\uBC24\uD558\uB298\uC5D0 \uBCC4 3\uAC1C\uAC00 \uB5B4\uC5B4\uC694 \u2B50"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 22, textAlign: "center" } }, "\uAC10\uC0AC\uD55C \uB9C8\uC74C\uC774 \uBC24\uD558\uB298\uC744 \uC218\uB193\uC558\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC624\uB298\uB3C4 \uC218\uACE0 \uB9CE\uC73C\uC168\uC5B4\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 } }, questions.map((q, i) => /* @__PURE__ */ React.createElement("div", { key: q.id, style: {
    background: "rgba(255,224,138,0.08)",
    borderRadius: 14,
    border: "1px solid rgba(255,224,138,0.2)",
    padding: "13px 14px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, q.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "rgba(255,224,138,0.7)", fontWeight: 600 } }, q.prompt)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 } }, answers[q.id])))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: shareGratitude,
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        width: "100%",
        padding: "12px",
        background: "rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 14,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 10
      }
    },
    "\u{1F495} \uD30C\uD2B8\uB108\uC640 \uACF5\uC720\uD558\uAE30"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleFinish,
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        width: "100%",
        padding: "14px",
        background: `linear-gradient(135deg, #4A5A8A, ${GV.dusty})`,
        color: "white",
        border: "none",
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer"
      }
    },
    "\uACBD\uD5D8\uCE58 \uBC1B\uAE30 \u2192"
  )));
  return null;
}
