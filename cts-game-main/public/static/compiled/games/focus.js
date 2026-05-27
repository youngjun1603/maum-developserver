const FC = {
  sage: "#6B21A8",
  sageL: "#7BA88A",
  sagePale: "#EAF2EC",
  cream: "#FDFCF7",
  muted: "#8A8A78",
  dark: "#2C2C20",
  amber: "#D4954A",
  amberL: "#E8C47A",
  sky: "#5A9BBF",
  skyL: "#A0C8E0",
  skyPale: "#E8F4FA",
  rose: "#C97B8A",
  rosePale: "#FAE8EC",
  indigo: "#5B6FA8",
  indigoPale: "#EEF0FA",
  warn: "#C05050"
};
function getRoundConfig(phq9Score, gad7Score) {
  const stress = Math.max(phq9Score ?? 5, gad7Score ?? 5);
  if (stress >= 15) return [
    { type: "number", span: 3, showMs: 1200 },
    { type: "grid", size: 3, lights: 3 },
    { type: "number", span: 4, showMs: 1100 },
    { type: "grid", size: 3, lights: 4 },
    { type: "number", span: 4, showMs: 1e3 }
  ];
  if (stress >= 8) return [
    { type: "number", span: 4, showMs: 1e3 },
    { type: "grid", size: 3, lights: 4 },
    { type: "number", span: 5, showMs: 950 },
    { type: "grid", size: 4, lights: 5 },
    { type: "number", span: 5, showMs: 900 }
  ];
  return [
    { type: "number", span: 5, showMs: 900 },
    { type: "grid", size: 4, lights: 5 },
    { type: "number", span: 6, showMs: 850 },
    { type: "grid", size: 4, lights: 6 },
    { type: "number", span: 7, showMs: 800 }
  ];
}
function genNumbers(span) {
  const arr = [];
  for (let i = 0; i < span; i++) {
    let n;
    do {
      n = Math.floor(Math.random() * 10);
    } while (n === arr[arr.length - 1]);
    arr.push(n);
  }
  return arr;
}
function genGridPattern(size, lights) {
  const total = size * size;
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, lights));
}
function calcRoundScore(type, correct, total, perfect) {
  if (type === "number") {
    return correct * 10 + (perfect ? 30 : 0);
  }
  return correct * 8 + (perfect ? 25 : 0);
}
function NumberRound({ config, roundIndex, totalRounds, onDone }) {
  const { useState, useEffect, useRef } = React;
  const [phase, setPhase] = useState("breathe");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numbers] = useState(() => genNumbers(config.span));
  const [input, setInput] = useState([]);
  const [result, setResult] = useState(null);
  const [breathCount, setBreathCount] = useState(3);
  const inputRef = useRef(null);
  useEffect(() => {
    if (phase !== "breathe") return;
    if (breathCount <= 0) {
      setPhase("show");
      setCurrentIdx(0);
      return;
    }
    const t = setTimeout(() => setBreathCount((v) => v - 1), 800);
    return () => clearTimeout(t);
  }, [phase, breathCount]);
  useEffect(() => {
    if (phase !== "show") return;
    if (currentIdx >= numbers.length) {
      setTimeout(() => setPhase("input"), 600);
      return;
    }
    const t = setTimeout(() => setCurrentIdx((v) => v + 1), config.showMs);
    return () => clearTimeout(t);
  }, [phase, currentIdx, numbers, config.showMs]);
  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [phase]);
  const handleDigit = (d) => {
    if (phase !== "input") return;
    const next = [...input, d];
    setInput(next);
    if (next.length === numbers.length) {
      const correct = next.filter((v, i) => v === numbers[i]).length;
      const perfect = correct === numbers.length;
      const score = calcRoundScore("number", correct, numbers.length, perfect);
      setResult({ correct, total: numbers.length, perfect, score });
      setPhase("result");
    }
  };
  const handleBackspace = () => {
    if (phase !== "input" || input.length === 0) return;
    setInput((v) => v.slice(0, -1));
  };
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: FC.muted } }, "\uB77C\uC6B4\uB4DC ", roundIndex + 1, " / ", totalRounds), /* @__PURE__ */ React.createElement("div", { style: {
    background: FC.indigoPale,
    color: FC.indigo,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 12px",
    borderRadius: 100
  } }, "\u{1F522} \uC22B\uC790 \uAE30\uC5B5")), phase === "breathe" && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${FC.skyPale}, ${FC.sky}33)`,
    border: `3px solid ${FC.sky}55`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    animation: breathCount > 0 ? "pulse 0.8s ease-in-out" : "none"
  } }, breathCount > 0 ? breathCount : "\u{1F33F}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: FC.dark } }, "\uC7A0\uAE50 \uB9C8\uC74C\uC744 \uAC00\uB2E4\uB4EC\uC5B4\uC694"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.muted, textAlign: "center", lineHeight: 1.7 } }, "\uC22B\uC790\uAC00 \uD558\uB098\uC529 \uB098\uD0C0\uB0A0 \uAC70\uC608\uC694", /* @__PURE__ */ React.createElement("br", null), "\uC21C\uC11C\uB300\uB85C \uAE30\uC5B5\uD574 \uB450\uC138\uC694"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.sky, fontWeight: 700 } }, config.span, "\uC790\uB9AC \uC22B\uC790\uB97C \uAE30\uC5B5\uD558\uC138\uC694")), phase === "show" && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    fontWeight: 600,
    color: FC.muted,
    display: "flex",
    gap: 8,
    alignItems: "center"
  } }, numbers.map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: i < currentIdx ? FC.sky : i === currentIdx ? FC.amber : "rgba(0,0,0,0.1)",
    transition: "all 0.3s"
  } }))), /* @__PURE__ */ React.createElement("div", { style: {
    width: 140,
    height: 140,
    borderRadius: 28,
    background: `linear-gradient(135deg, ${FC.sky}22, ${FC.skyPale})`,
    border: `3px solid ${FC.sky}44`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 12px 40px ${FC.sky}22`
  } }, currentIdx < numbers.length ? /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 72,
    fontWeight: 900,
    color: FC.sky,
    animation: "fadeUp 0.25s ease",
    fontFamily: "monospace"
  } }, numbers[currentIdx]) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, animation: "pulse 0.5s ease" } }, "\u2713")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.muted } }, currentIdx < numbers.length ? `${currentIdx + 1} / ${numbers.length}` : "\uC774\uC81C \uC785\uB825\uD558\uC138\uC694!")), phase === "input" && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: FC.dark } }, "\uAE30\uC5B5\uD55C \uC22B\uC790\uB97C \uC21C\uC11C\uB300\uB85C \uC785\uB825\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
    minHeight: 64,
    alignItems: "center"
  } }, Array.from({ length: numbers.length }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: i < input.length ? FC.sky : "rgba(0,0,0,0.06)",
    border: `2px solid ${i < input.length ? FC.sky : "rgba(0,0,0,0.12)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 900,
    color: i < input.length ? "white" : FC.muted,
    fontFamily: "monospace",
    transition: "all 0.2s",
    boxShadow: i < input.length ? `0 4px 12px ${FC.sky}44` : "none"
  } }, i < input.length ? input[i] : ""))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 260, width: "100%" } }, [1, 2, 3, 4, 5, 6, 7, 8, 9, "\u2190", 0, "\u2713"].map((d, i) => {
    const isBack = d === "\u2190";
    const isEnter = d === "\u2713";
    const disabled = input.length === 0 && isBack;
    return /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => {
      if (isBack) handleBackspace();
      else if (!isEnter) handleDigit(d);
    }, disabled, style: {
      fontFamily: "'Noto Sans KR', monospace",
      padding: "16px",
      borderRadius: 14,
      border: "none",
      background: isBack ? FC.rosePale : isEnter ? FC.sagePale : "white",
      color: isBack ? FC.rose : isEnter ? FC.sage : FC.dark,
      fontSize: typeof d === "number" ? 22 : 18,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      opacity: disabled ? 0.3 : 1,
      transition: "all 0.15s"
    } }, d);
  }))), phase === "result" && result && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52 } }, result.perfect ? "\u{1F389}" : result.correct >= result.total / 2 ? "\u{1F44D}" : "\u{1F4AA}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: FC.dark } }, result.perfect ? "\uC644\uBCBD\uD574\uC694!" : `${result.correct}/${result.total} \uB9DE\uCDC4\uC5B4\uC694`), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    background: "rgba(0,0,0,0.04)",
    borderRadius: 16,
    padding: "14px 20px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: FC.muted, marginBottom: 4 } }, "\uC785\uB825"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, input.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: d === numbers[i] ? FC.sage : FC.warn,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "monospace"
  } }, d))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.muted } }, "\uC815\uB2F5: ", numbers.join(" - ")), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 16,
    fontWeight: 700,
    color: result.perfect ? FC.amber : FC.sage
  } }, "+", result.score, "\uC810"), /* @__PURE__ */ React.createElement("button", { onClick: () => onDone(result.score), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`,
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "13px 36px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: `0 6px 20px ${FC.sage}44`
  } }, "\uB2E4\uC74C \u2192")));
}
function GridRound({ config, roundIndex, totalRounds, onDone }) {
  const { useState, useEffect } = React;
  const [phase, setPhase] = useState("show");
  const [pattern] = useState(() => genGridPattern(config.size, config.lights));
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [result, setResult] = useState(null);
  const [showCountdown, setShowCountdown] = useState(3);
  const total = config.size * config.size;
  useEffect(() => {
    if (phase !== "show") return;
    if (showCountdown <= 0) {
      setTimeout(() => setPhase("input"), 400);
      return;
    }
    const t = setTimeout(() => setShowCountdown((v) => v - 1), 900);
    return () => clearTimeout(t);
  }, [phase, showCountdown]);
  const handleCell = (i) => {
    if (phase !== "input") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const handleSubmit = () => {
    const correct = [...pattern].filter((i) => selected.has(i)).length;
    const wrong = [...selected].filter((i) => !pattern.has(i)).length;
    const net = Math.max(0, correct - wrong);
    const perfect = correct === pattern.size && wrong === 0;
    const score = calcRoundScore("grid", net, pattern.size, perfect);
    setResult({ correct, wrong, total: pattern.size, perfect, score });
    setPhase("result");
  };
  const cellSize = config.size === 4 ? 62 : 76;
  const gap = config.size === 4 ? 8 : 10;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: FC.muted } }, "\uB77C\uC6B4\uB4DC ", roundIndex + 1, " / ", totalRounds), /* @__PURE__ */ React.createElement("div", { style: {
    background: FC.sagePale,
    color: FC.sage,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 12px",
    borderRadius: 100
  } }, "\u{1F7E2} \uD328\uD134 \uAE30\uC5B5")), phase === "show" && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: FC.dark, textAlign: "center" } }, showCountdown > 0 ? `${showCountdown}\uCD08 \uD6C4 \uD328\uD134\uC774 \uC0AC\uB77C\uC838\uC694` : "\uD328\uD134\uC744 \uAE30\uC5B5\uD558\uC138\uC694!"), /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: `repeat(${config.size}, ${cellSize}px)`,
    gap
  } }, Array.from({ length: total }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    width: cellSize,
    height: cellSize,
    borderRadius: 14,
    background: pattern.has(i) ? `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})` : "rgba(0,0,0,0.06)",
    boxShadow: pattern.has(i) ? `0 4px 16px ${FC.sage}44` : "none",
    transition: "all 0.3s"
  } }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.muted } }, config.lights, "\uAC1C \uCE78\uC758 \uC704\uCE58\uB97C \uAE30\uC5B5\uD558\uC138\uC694")), phase === "input" && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: FC.dark } }, "\uAE30\uC5B5\uD55C \uCE78\uC744 \uB20C\uB7EC\uBCF4\uC138\uC694"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: FC.muted } }, "(", selected.size, " / ", config.lights, "\uAC1C \uC120\uD0DD\uB428)"), /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: `repeat(${config.size}, ${cellSize}px)`,
    gap
  } }, Array.from({ length: total }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => handleCell(i), style: {
    width: cellSize,
    height: cellSize,
    borderRadius: 14,
    background: selected.has(i) ? `linear-gradient(135deg, ${FC.sky}, ${FC.skyL})` : "rgba(0,0,0,0.06)",
    border: `2px solid ${selected.has(i) ? FC.sky : "transparent"}`,
    boxShadow: selected.has(i) ? `0 4px 16px ${FC.sky}44` : "none",
    cursor: "pointer",
    transition: "all 0.2s",
    transform: selected.has(i) ? "scale(1.05)" : "scale(1)"
  } }))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: selected.size === 0,
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: selected.size > 0 ? `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})` : "rgba(0,0,0,0.1)",
        color: selected.size > 0 ? "white" : FC.muted,
        border: "none",
        borderRadius: 14,
        padding: "13px 36px",
        fontSize: 14,
        fontWeight: 700,
        cursor: selected.size > 0 ? "pointer" : "not-allowed"
      }
    },
    "\uD655\uC778 \u2192"
  )), phase === "result" && result && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52 } }, result.perfect ? "\u2728" : result.correct >= result.total / 2 ? "\u{1F33F}" : "\u{1F4AA}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: FC.dark } }, result.perfect ? "\uC644\uBCBD\uD574\uC694!" : `${result.correct}\uAC1C \uB9DE\uCD94\uACE0 ${result.wrong}\uAC1C \uD2C0\uB838\uC5B4\uC694`), /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: `repeat(${config.size}, 36px)`,
    gap: 5
  } }, Array.from({ length: total }).map((_, i) => {
    const wasPattern = pattern.has(i);
    const wasSelected = selected.has(i);
    let bg = "rgba(0,0,0,0.06)";
    if (wasPattern && wasSelected) bg = FC.sage;
    else if (wasPattern && !wasSelected) bg = FC.amber;
    else if (!wasPattern && wasSelected) bg = FC.warn;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 36, height: 36, borderRadius: 8, background: bg, transition: "all 0.3s" } });
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { color: FC.sage } }, "\u25A0 \uC815\uB2F5"), /* @__PURE__ */ React.createElement("span", { style: { color: FC.amber } }, "\u25A0 \uB193\uCE68"), /* @__PURE__ */ React.createElement("span", { style: { color: FC.warn } }, "\u25A0 \uC624\uB2F5")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: result.perfect ? FC.amber : FC.sage } }, "+", result.score, "\uC810"), /* @__PURE__ */ React.createElement("button", { onClick: () => onDone(result.score), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`,
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "13px 36px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: `0 6px 20px ${FC.sage}44`
  } }, "\uB2E4\uC74C \u2192")));
}
function FocusGame({ onExit }) {
  const { useState, useEffect, useRef } = React;
  const [screen, setScreen] = useState("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [phq9, setPhq9] = useState(null);
  const [gad7, setGad7] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const rounds = getRoundConfig(phq9, gad7);
  const totalRounds = rounds.length;
  useEffect(() => {
    GameEngine.getGameStats().then((res) => {
      if (res.success) {
        const focusStat = res.data?.perGame?.find((g) => g.game_id === "focus");
        if (focusStat?.best_score) setPersonalBest(focusStat.best_score);
      }
    }).catch(() => {
    });
  }, []);
  useEffect(() => {
    GameEngine.getMe().then((res) => {
      if (res.success) {
        const scores2 = res.data?.userTestScores || {};
        setPhq9(scores2.PHQ9 ?? null);
        setGad7(scores2.GAD7 ?? null);
      }
    }).catch(() => {
    });
  }, []);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const maxPossible = rounds.reduce((acc, r) => {
    if (r.type === "number") return acc + r.span * 10 + 30;
    return acc + r.lights * 8 + 25;
  }, 0);
  const accuracy = maxPossible > 0 ? Math.round(totalScore / maxPossible * 100) : 0;
  const handleStart = () => {
    setStartTime(Date.now());
    setScreen("playing");
  };
  const handleRoundDone = (score) => {
    const next = [...scores, score];
    setScores(next);
    if (roundIndex + 1 >= totalRounds) {
      setScreen("done");
    } else {
      setRoundIndex((v) => v + 1);
    }
  };
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const durationSec = startTime ? Math.round((Date.now() - startTime) / 1e3) : 0;
    try {
      await GameEngine.saveSession({
        gameId: "focus",
        moduleType: "focus_training",
        score: totalScore,
        durationSec,
        metadata: { rounds: totalRounds, accuracy }
      });
    } catch (e) {
    }
    setIsSaving(false);
    onExit({ newAchievements: [] });
  };
  const isNewRecord = personalBest !== null && totalScore > personalBest;
  if (screen === "intro") return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`
  } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 440, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => onExit({}), style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 22,
    padding: "4px 8px",
    color: FC.muted
  } }, "\u2190"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: FC.dark } }, "\uB9C8\uC74C \uC9D1\uC911\uB825"), personalBest !== null && /* @__PURE__ */ React.createElement("div", { style: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 700,
    background: FC.amberL + "55",
    color: FC.amber,
    padding: "3px 10px",
    borderRadius: 100
  } }, "\uCD5C\uACE0 ", personalBest, "\uC810")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 16, animation: "float 3s ease-in-out infinite" } }, "\u{1F9E0}"), /* @__PURE__ */ React.createElement("h1", { style: {
    fontSize: 26,
    fontWeight: 700,
    color: FC.dark,
    marginBottom: 10,
    fontFamily: "'Noto Serif KR', serif",
    lineHeight: 1.4
  } }, "\uB9C8\uC74C \uC9D1\uC911\uB825 \uD6C8\uB828"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: FC.muted, lineHeight: 1.8 } }, "\uC22B\uC790 \uAE30\uC5B5\uACFC \uD328\uD134 \uCC3E\uAE30\uB85C", /* @__PURE__ */ React.createElement("br", null), "\uC9C0\uAE08 \uC774 \uC21C\uAC04\uC5D0 \uC9D1\uC911\uD558\uB294 \uC5F0\uC2B5\uC744 \uD574\uC694")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 } }, [
    { emoji: "\u{1F522}", title: "\uC22B\uC790 \uAE30\uC5B5", desc: "\uC21C\uC11C\uB300\uB85C \uB098\uD0C0\uB098\uB294 \uC22B\uC790\uB97C \uAE30\uC5B5\uD574 \uC785\uB825\uD574\uC694", color: FC.sky },
    { emoji: "\u{1F7E2}", title: "\uD328\uD134 \uAE30\uC5B5", desc: "\uADF8\uB9AC\uB4DC\uC5D0 \uD45C\uC2DC\uB41C \uC704\uCE58\uB97C \uAE30\uC5B5\uD558\uACE0 \uC7AC\uD604\uD574\uC694", color: FC.sage }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.title, style: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(8px)",
    borderRadius: 16,
    padding: "14px 16px",
    border: `1px solid ${c.color}22`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 44,
    height: 44,
    borderRadius: 12,
    flexShrink: 0,
    background: `linear-gradient(135deg, ${c.color}22, ${c.color}10)`,
    border: `1.5px solid ${c.color}33`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22
  } }, c.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: FC.dark, marginBottom: 3 } }, c.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: FC.muted, lineHeight: 1.5 } }, c.desc))))), /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${FC.indigoPale}, rgba(255,255,255,0.7))`,
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 28,
    border: `1px solid ${FC.indigo}22`,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.indigo, fontWeight: 600 } }, "\uCD1D ", totalRounds, "\uB77C\uC6B4\uB4DC \xB7 \uC22B\uC790 \uAE30\uC5B5 + \uD328\uD134 \uAE30\uC5B5 \uAD50\uCC28 \uC9C4\uD589")), /* @__PURE__ */ React.createElement("button", { onClick: handleStart, style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: `linear-gradient(135deg, ${FC.sky}, ${FC.skyL})`,
    color: "white",
    border: "none",
    borderRadius: 16,
    padding: "16px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: `0 8px 28px ${FC.sky}44`,
    width: "100%"
  } }, "\uC9D1\uC911 \uD6C8\uB828 \uC2DC\uC791\uD558\uAE30 \u2192")));
  if (screen === "playing") {
    const round = rounds[roundIndex];
    return /* @__PURE__ */ React.createElement("div", { style: {
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`
    } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 440, margin: "0 auto", padding: "24px 0 32px", display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "0 24px", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: FC.muted } }, "\uC9C4\uD589 ", roundIndex, " / ", totalRounds), /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      background: "rgba(0,0,0,0.06)",
      color: FC.muted,
      border: "none",
      borderRadius: 8,
      padding: "5px 11px",
      fontSize: 11,
      cursor: "pointer"
    } }, "\uD5C8\uBE0C\uB85C \u2192")), /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: "100%",
      borderRadius: 10,
      width: `${roundIndex / totalRounds * 100}%`,
      background: `linear-gradient(90deg, ${FC.sky}, ${FC.sage})`,
      transition: "width 0.4s ease"
    } }))), round.type === "number" ? /* @__PURE__ */ React.createElement(
      NumberRound,
      {
        key: `n-${roundIndex}`,
        config: round,
        roundIndex,
        totalRounds,
        onDone: handleRoundDone
      }
    ) : /* @__PURE__ */ React.createElement(
      GridRound,
      {
        key: `g-${roundIndex}`,
        config: round,
        roundIndex,
        totalRounds,
        onDone: handleRoundDone
      }
    )));
  }
  if (screen === "done") {
    const grade = accuracy >= 85 ? { label: "\uD0C1\uC6D4\uD574\uC694", emoji: "\u{1F3C6}", color: FC.amber } : accuracy >= 65 ? { label: "\uC798 \uD588\uC5B4\uC694", emoji: "\u{1F31F}", color: FC.sage } : accuracy >= 45 ? { label: "\uC88B\uC740 \uC2DC\uB3C4\uC608\uC694", emoji: "\u{1F33F}", color: FC.sky } : { label: "\uACC4\uC18D \uC5F0\uC2B5\uD574\uC694", emoji: "\u{1F4AA}", color: FC.muted };
    return /* @__PURE__ */ React.createElement("div", { style: {
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`
    } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 440, margin: "0 auto", padding: "32px 24px 40px", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 12, animation: "fadeUp 0.5s ease" } }, grade.emoji), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, color: FC.dark, marginBottom: 8, fontFamily: "'Noto Serif KR',serif" } }, "\uD6C8\uB828 \uC644\uB8CC!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: grade.color, fontWeight: 700 } }, grade.label), isNewRecord && /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
      background: `linear-gradient(135deg, ${FC.amber}, ${FC.amberL})`,
      color: "white",
      borderRadius: 100,
      padding: "6px 16px",
      fontSize: 13,
      fontWeight: 700,
      animation: "pulse 1.5s ease-in-out infinite"
    } }, "\u{1F3C6} \uC2E0\uAE30\uB85D!")), /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(8px)",
      borderRadius: 22,
      padding: "24px",
      marginBottom: 20,
      border: "1px solid rgba(255,255,255,0.7)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, fontWeight: 900, color: grade.color, fontFamily: "monospace" } }, totalScore), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: FC.muted } }, "\uCD5C\uC885 \uC810\uC218"), personalBest !== null && !isNewRecord && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: FC.muted, marginTop: 4 } }, "\uCD5C\uACE0 \uAE30\uB85D ", personalBest, "\uC810 \xB7 \uCC28\uC774 ", personalBest - totalScore, "\uC810"), personalBest === null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: FC.sage, marginTop: 4 } }, "\uCCAB \uAE30\uB85D\uC774\uC5D0\uC694! \u{1F389}")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, [
      { label: "\uC815\uD655\uB3C4", value: `${accuracy}%`, color: accuracy >= 85 ? FC.amber : FC.sage },
      { label: "\uC644\uB8CC \uB77C\uC6B4\uB4DC", value: `${totalRounds}R`, color: FC.sky }
    ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, style: {
      background: FC.cream,
      borderRadius: 14,
      padding: "12px 14px",
      textAlign: "center"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: FC.muted, marginBottom: 4 } }, s.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: s.color } }, s.value))))), /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: 16,
      padding: "16px",
      marginBottom: 24,
      border: "1px solid rgba(255,255,255,0.6)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: FC.muted, marginBottom: 10 } }, "\uB77C\uC6B4\uB4DC\uBCC4 \uC810\uC218"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, scores.map((s, i) => {
      const r = rounds[i];
      const maxR = r.type === "number" ? r.span * 10 + 30 : r.lights * 8 + 25;
      const pct = Math.round(s / maxR * 100);
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: FC.muted, width: 60, flexShrink: 0 } }, r.type === "number" ? "\u{1F522}" : "\u{1F7E2}", " R", i + 1), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
        height: "100%",
        width: `${pct}%`,
        borderRadius: 10,
        background: pct >= 80 ? FC.amber : pct >= 50 ? FC.sage : FC.sky,
        transition: "width 0.6s ease"
      } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: FC.dark, width: 40, textAlign: "right" } }, s, "\uC810"));
    }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      flex: 1,
      padding: "14px",
      borderRadius: 14,
      border: "none",
      background: "rgba(255,255,255,0.8)",
      color: FC.muted,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    } }, "\uD5C8\uBE0C\uB85C \u2192"), /* @__PURE__ */ React.createElement("button", { onClick: handleSave, disabled: isSaving, style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      flex: 2,
      padding: "14px",
      borderRadius: 14,
      border: "none",
      background: `linear-gradient(135deg, ${FC.sky}, ${FC.skyL})`,
      color: "white",
      fontSize: 14,
      fontWeight: 700,
      cursor: isSaving ? "not-allowed" : "pointer",
      boxShadow: `0 6px 20px ${FC.sky}44`
    } }, isSaving ? "\uC800\uC7A5 \uC911..." : "\u2713 \uC800\uC7A5\uD558\uACE0 \uB098\uAC00\uAE30")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const text = `\u{1F9E0} \uB9C8\uC74C \uC9D1\uC911\uB825 \uD6C8\uB828
\uC810\uC218 ${totalScore}\uC810 \xB7 \uC815\uD655\uB3C4 ${accuracy}%
${totalRounds}\uB77C\uC6B4\uB4DC \uC644\uB8CC${isNewRecord ? " \u{1F3C6} \uC2E0\uAE30\uB85D!" : ""}

#The Light of Life #\uB9C8\uC74C\uAC8C\uC784 #\uC9D1\uC911\uB825\uD6C8\uB828`;
      if (navigator.share) navigator.share({ title: "\uB9C8\uC74C \uC9D1\uC911\uB825", text }).catch(() => {
      });
      else navigator.clipboard?.writeText(text).then(() => alert("\uBCF5\uC0AC\uB410\uC5B4\uC694!")).catch(() => {
      });
    }, style: {
      fontFamily: "'Noto Sans KR',sans-serif",
      width: "100%",
      padding: "11px",
      borderRadius: 14,
      border: "none",
      background: "rgba(255,255,255,0.6)",
      color: FC.muted,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    } }, "\uACF5\uC720 \u{1F517}"))));
  }
  return null;
}
