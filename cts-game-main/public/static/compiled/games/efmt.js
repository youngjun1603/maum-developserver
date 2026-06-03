const GE = {
  // 팔레트
  sage: "#6B21A8",
  sageL: "#7BA88A",
  sagePale: "#EAF2EC",
  cream: "#FDFCF7",
  muted: "#8A8A78",
  dark: "#2C2C20",
  amber: "#D4954A",
  rose: "#C97B8A",
  dusty: "#6B8FA8",
  warn: "#C05050"
};
const EMOTIONS = {
  happy: {
    name: t("\uAE30\uC068", "Joy"),
    label: t("\uAE30\uC05C \uAF43", "Happy Flower"),
    petalColor: "#FCD34D",
    centerColor: "#F59E0B",
    stemColor: "#6B21A8",
    face: "happy",
    // 위로 굽은 미소
    isTarget: true
  },
  sad: {
    name: t("\uC2AC\uD514", "Sadness"),
    label: t("\uC2AC\uD508 \uAF43", "Sad Flower"),
    petalColor: "#93C5FD",
    centerColor: "#3B82F6",
    stemColor: "#5A7A9A",
    face: "sad",
    // 아래로 굽은 입
    isTarget: false
  },
  anxious: {
    name: t("\uBD88\uC548", "Anxiety"),
    label: t("\uBD88\uC548\uD55C \uAF43", "Anxious Flower"),
    petalColor: "#C4B5FD",
    centerColor: "#7C3AED",
    stemColor: "#6B5A8A",
    face: "anxious",
    // 물결 입
    isTarget: false
  },
  angry: {
    name: t("\uD654\uB0A8", "Anger"),
    label: t("\uD654\uB09C \uAF43", "Angry Flower"),
    petalColor: "#FCA5A5",
    centerColor: "#EF4444",
    stemColor: "#8A4A4A",
    face: "angry",
    // 눌린 미간 + 직선 입
    isTarget: false
  },
  neutral: {
    name: t("\uBB34\uD45C\uC815", "Neutral"),
    label: t("\uBB34\uD45C\uC815 \uAF43", "Neutral Flower"),
    petalColor: "#D1D5DB",
    centerColor: "#9CA3AF",
    stemColor: "#7A7A6A",
    face: "neutral",
    // 직선 입
    isTarget: false
  }
};
function FlowerSVG({ emotion, size = 72, blooming = false, wilting = false, onClick, disabled }) {
  const e = EMOTIONS[emotion];
  const { useState: useS } = React;
  const [hovered, setHovered] = useS(false);
  const scale = blooming ? 1.15 : wilting ? 0.85 : hovered && !disabled ? 1.06 : 1;
  const opacity = wilting ? 0.55 : 1;
  const petalAngles = [0, 60, 120, 180, 240, 300];
  const pr = size * 0.28;
  const cx = size / 2, cy = size / 2;
  const petalRx = size * 0.155, petalRy = size * 0.1;
  const fr = size * 0.145;
  const ey = cy - size * 0.036;
  const ew = size * 0.02;
  const ex1 = cx - size * 0.06, ex2 = cx + size * 0.06;
  const mouth = {
    happy: `M ${cx - size * 0.07} ${cy + size * 0.04} Q ${cx} ${cy + size * 0.1} ${cx + size * 0.07} ${cy + size * 0.04}`,
    sad: `M ${cx - size * 0.07} ${cy + size * 0.08} Q ${cx} ${cy + size * 0.02} ${cx + size * 0.07} ${cy + size * 0.08}`,
    anxious: `M ${cx - size * 0.07} ${cy + size * 0.055} Q ${cx - size * 0.03} ${cy + size * 0.04} ${cx} ${cy + size * 0.065} Q ${cx + size * 0.03} ${cy + size * 0.085} ${cx + size * 0.07} ${cy + size * 0.055}`,
    angry: `M ${cx - size * 0.07} ${cy + size * 0.07} L ${cx + size * 0.07} ${cy + size * 0.07}`,
    neutral: `M ${cx - size * 0.07} ${cy + size * 0.06} L ${cx + size * 0.07} ${cy + size * 0.06}`
  };
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      width: size,
      height: size,
      onClick: !disabled ? onClick : void 0,
      onMouseEnter: () => !disabled && setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        cursor: disabled ? "default" : "pointer",
        transform: `scale(${scale})`,
        opacity,
        transition: "transform 0.2s ease, opacity 0.3s ease",
        filter: blooming ? `drop-shadow(0 0 6px ${e.petalColor})` : "none"
      }
    },
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: cx,
        y1: size * 0.75,
        x2: cx,
        y2: size * 0.95,
        stroke: e.stemColor,
        strokeWidth: size * 0.04,
        strokeLinecap: "round"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        cx: cx + size * 0.1,
        cy: size * 0.82,
        rx: size * 0.08,
        ry: size * 0.04,
        fill: e.stemColor,
        opacity: "0.7",
        transform: `rotate(30 ${cx + size * 0.1} ${size * 0.82})`
      }
    ),
    petalAngles.map((a) => /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        key: a,
        cx: cx + Math.cos(a * Math.PI / 180) * pr,
        cy: cy + Math.sin(a * Math.PI / 180) * pr,
        rx: petalRx,
        ry: petalRy,
        fill: e.petalColor,
        transform: `rotate(${a}, ${cx + Math.cos(a * Math.PI / 180) * pr}, ${cy + Math.sin(a * Math.PI / 180) * pr})`,
        opacity: blooming ? 1 : 0.9
      }
    )),
    emotion === "angry" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: ex1 - size * 0.035,
        y1: ey - size * 0.04,
        x2: ex1 + size * 0.025,
        y2: ey - size * 0.015,
        stroke: "#7A2A2A",
        strokeWidth: size * 0.025,
        strokeLinecap: "round"
      }
    ), /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: ex2 - size * 0.025,
        y1: ey - size * 0.015,
        x2: ex2 + size * 0.035,
        y2: ey - size * 0.04,
        stroke: "#7A2A2A",
        strokeWidth: size * 0.025,
        strokeLinecap: "round"
      }
    )),
    /* @__PURE__ */ React.createElement("circle", { cx, cy, r: fr, fill: e.centerColor, opacity: 0.95 }),
    /* @__PURE__ */ React.createElement("circle", { cx, cy, r: fr * 0.88, fill: e.centerColor, opacity: 0.6 }),
    /* @__PURE__ */ React.createElement("circle", { cx: ex1, cy: ey, r: ew, fill: "#2C2C20", opacity: 0.8 }),
    /* @__PURE__ */ React.createElement("circle", { cx: ex2, cy: ey, r: ew, fill: "#2C2C20", opacity: 0.8 }),
    /* @__PURE__ */ React.createElement(
      "path",
      {
        d: mouth[emotion] || mouth.neutral,
        fill: "none",
        stroke: "#2C2C20",
        strokeWidth: size * 0.025,
        strokeLinecap: "round"
      }
    ),
    blooming && /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx,
        cy,
        r: fr * 1.4,
        fill: "none",
        stroke: e.petalColor,
        strokeWidth: "2",
        opacity: "0.5",
        style: { animation: "ripple 0.6s ease-out forwards" }
      }
    )
  );
}
function calcDifficulty(phq9Score = null) {
  if (phq9Score === null) return "medium";
  if (phq9Score <= 4) return "easy";
  if (phq9Score <= 9) return "medium";
  if (phq9Score <= 14) return "hard";
  return "very_hard";
}
const DIFFICULTY_CONFIG = {
  easy: { grid: 4, targetRatio: 0.4, roundSec: 35, rounds: 3, label: t("\uAE30\uCD08", "Basic"), desc: t("4\xD74 \xB7 35\uCD08 \xB7 \uBAA9\uD45C 40%", "4\xD74 \xB7 35s \xB7 Target 40%") },
  medium: { grid: 4, targetRatio: 0.28, roundSec: 28, rounds: 3, label: t("\uBCF4\uD1B5", "Normal"), desc: t("4\xD74 \xB7 28\uCD08 \xB7 \uBAA9\uD45C 28%", "4\xD74 \xB7 28s \xB7 Target 28%") },
  hard: { grid: 5, targetRatio: 0.2, roundSec: 25, rounds: 3, label: t("\uC2EC\uD654", "Advanced"), desc: t("5\xD75 \xB7 25\uCD08 \xB7 \uBAA9\uD45C 20%", "5\xD75 \xB7 25s \xB7 Target 20%") },
  very_hard: { grid: 5, targetRatio: 0.15, roundSec: 20, rounds: 3, label: t("\uB3C4\uC804", "Challenge"), desc: t("5\xD75 \xB7 20\uCD08 \xB7 \uBAA9\uD45C 15%", "5\xD75 \xB7 20s \xB7 Target 15%") }
};
function generateGrid(gridSize, targetRatio) {
  const total = gridSize * gridSize;
  const targetCount = Math.max(2, Math.round(total * targetRatio));
  const nonTargetTypes = ["sad", "anxious", "angry", "neutral"];
  const cells = [];
  const targetIndices = /* @__PURE__ */ new Set();
  while (targetIndices.size < targetCount) {
    targetIndices.add(Math.floor(Math.random() * total));
  }
  for (let i = 0; i < total; i++) {
    if (targetIndices.has(i)) {
      cells.push({ id: i, emotion: "happy", state: "idle" });
    } else {
      const nt = nonTargetTypes[Math.floor(Math.random() * nonTargetTypes.length)];
      cells.push({ id: i, emotion: nt, state: "idle" });
    }
  }
  return cells;
}
function EFMTGame({ onExit }) {
  const { useState, useEffect, useRef, useCallback } = React;
  const [screen, setScreen] = useState("intro");
  const [difficulty, setDiff] = useState("medium");
  const [round, setRound] = useState(1);
  const [cells, setCells] = useState([]);
  const [timeLeft, setTimeLeft] = useState(28);
  const [roundStats, setRoundStats] = useState([]);
  const [sessionSec, setSessionSec] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [totalTargets, setTotalTargets] = useState(0);
  const [finished, setFinished] = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [comboTierAnim, setComboTierAnim] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [computedScore, setComputedScore] = useState(0);
  const timerRef = useRef(null);
  const sessionRef = useRef(Date.now());
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  useEffect(() => {
    GameEngine.getGameStats().then((r) => {
      if (r.success) {
        const s = (r.data?.perGame || []).find((g) => g.game_id === "efmt");
        if (s?.best_score) setPersonalBest(s.best_score);
      }
    }).catch(() => {
    });
  }, []);
  const startRound = useCallback((r, diff) => {
    const c = DIFFICULTY_CONFIG[diff || difficulty];
    const grid = generateGrid(c.grid, c.targetRatio);
    const targets = grid.filter((g) => EMOTIONS[g.emotion].isTarget).length;
    setCells(grid);
    setTotalTargets(targets);
    setTimeLeft(c.roundSec);
    setCorrect(0);
    setIncorrect(0);
    setReactionTimes([]);
    setRoundStartTime(Date.now());
    comboRef.current = 0;
    maxComboRef.current = 0;
    setComboDisplay(0);
    setRound(r);
    setScreen("round");
  }, [difficulty]);
  useEffect(() => {
    if (screen !== "round") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t2) => {
        if (t2 <= 1) {
          clearInterval(timerRef.current);
          endRound();
          return 0;
        }
        return t2 - 1;
      });
    }, 1e3);
    return () => clearInterval(timerRef.current);
  }, [screen, round]);
  const endRound = useCallback(() => {
    clearInterval(timerRef.current);
    setRoundStats((prev) => {
      const stat = {
        round,
        correct,
        incorrect,
        totalTargets,
        avgReaction: reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0,
        missedTargets: Math.max(0, totalTargets - correct),
        maxCombo: maxComboRef.current
      };
      const next = [...prev, stat];
      if (round >= cfg.rounds) {
        setFinished(true);
        setSessionSec(Math.round((Date.now() - sessionRef.current) / 1e3));
        const tc = next.reduce((a, s) => a + s.correct, 0);
        const ti = next.reduce((a, s) => a + s.incorrect, 0);
        const tt = next.reduce((a, s) => a + s.totalTargets, 0);
        const ar = next.filter((s) => s.avgReaction > 0).reduce((a, s, _, arr) => a + s.avgReaction / arr.length, 0);
        const bc = Math.max(...next.map((s) => s.maxCombo || 0), 0);
        const acc = tt > 0 ? Math.round(tc / tt * 100) : 0;
        const cBonus = bc >= 10 ? bc * 15 : bc >= 5 ? bc * 10 : bc >= 3 ? bc * 6 : 0;
        const aBonus = acc >= 90 ? 30 : acc >= 75 ? 15 : 0;
        const sc = Math.max(0, tc * 20 - ti * 5 + Math.max(0, 50 - Math.round(ar / 100)) + cBonus + aBonus);
        setComputedScore(sc);
        setScreen("done");
      } else {
        setScreen("result");
      }
      return next;
    });
  }, [round, correct, incorrect, totalTargets, reactionTimes, cfg.rounds]);
  const handleFlowerClick = useCallback((cellId) => {
    const cell = cells.find((c) => c.id === cellId);
    if (!cell || cell.state !== "idle") return;
    const rt = Date.now() - roundStartTime;
    const isTarget = EMOTIONS[cell.emotion].isTarget;
    setCells((prev) => prev.map(
      (c) => c.id === cellId ? { ...c, state: isTarget ? "blooming" : "wilting" } : c
    ));
    if (isTarget) {
      setCorrect((n) => n + 1);
      setReactionTimes((prev) => [...prev, rt]);
      const prevTier = comboRef.current >= 10 ? 3 : comboRef.current >= 5 ? 2 : comboRef.current >= 3 ? 1 : 0;
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      setComboDisplay(comboRef.current);
      const newTier = comboRef.current >= 10 ? 3 : comboRef.current >= 5 ? 2 : comboRef.current >= 3 ? 1 : 0;
      if (newTier > prevTier) {
        const tLabels = ["", "\xD7 1.5", "\xD7 2.0", "\xD7 3.0"];
        setComboTierAnim(tLabels[newTier]);
        setTimeout(() => setComboTierAnim(null), 1400);
      }
      setTimeout(() => {
        setCells((prev) => prev.map(
          (c) => c.id === cellId ? { ...c, state: "found" } : c
        ));
      }, 400);
    } else {
      setIncorrect((n) => n + 1);
      comboRef.current = 0;
      setComboDisplay(0);
      setTimeout(() => {
        setCells((prev) => prev.map(
          (c) => c.id === cellId ? { ...c, state: "idle" } : c
        ));
      }, 500);
    }
  }, [cells, roundStartTime]);
  const handleFinish = async () => {
    const totalCorrect = roundStats.reduce((a, s) => a + s.correct, 0);
    const totalIncorrect = roundStats.reduce((a, s) => a + s.incorrect, 0);
    const totalTarget = roundStats.reduce((a, s) => a + s.totalTargets, 0);
    const avgRT = roundStats.filter((s) => s.avgReaction > 0).reduce((a, s, _, arr) => a + s.avgReaction / arr.length, 0);
    const accuracy = totalTarget > 0 ? Math.round(totalCorrect / totalTarget * 100) : 0;
    const bestCombo = Math.max(...roundStats.map((s) => s.maxCombo || 0), 0);
    const comboBonus = bestCombo >= 10 ? bestCombo * 15 : bestCombo >= 5 ? bestCombo * 10 : bestCombo >= 3 ? bestCombo * 6 : 0;
    const accuracyBonus = accuracy >= 90 ? 30 : accuracy >= 75 ? 15 : 0;
    const score = Math.max(0, totalCorrect * 20 - totalIncorrect * 5 + Math.max(0, 50 - Math.round(avgRT / 100)) + comboBonus + accuracyBonus);
    try {
      const res = await GameEngine.saveSession({
        gameId: "efmt",
        moduleType: "EFMT",
        score,
        durationSec: sessionSec,
        metadata: {
          difficulty,
          rounds: cfg.rounds,
          total_correct: totalCorrect,
          total_incorrect: totalIncorrect,
          accuracy_pct: accuracy,
          avg_reaction_ms: Math.round(avgRT),
          round_stats: roundStats
        }
      });
      const expGained = res.data?.expGained || 0;
      const leveledUp = res.data?.leveledUp || false;
      const newAchievements = res.data?.newAchievements || [];
      setTimeout(() => onExit({ score, expGained, leveledUp, newAchievements }), 200);
    } catch {
      setTimeout(() => onExit({ score, expGained: 0, leveledUp: false, newAchievements: [] }), 200);
    }
  };
  const timerColor = timeLeft > cfg.roundSec * 0.4 ? GE.sage : timeLeft > cfg.roundSec * 0.2 ? GE.amber : GE.warn;
  if (screen === "intro") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(160deg, #FFF8E8, ${GE.cream})`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F338}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: GE.dark, fontFamily: "'Noto Serif KR',serif" } }, t("\uAC10\uC815\uAF43 \uCC3E\uAE30", "Emotion Flower Hunt"))), /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "rgba(0,0,0,0.06)",
    color: GE.muted,
    border: "none",
    borderRadius: 9,
    padding: "6px 13px",
    fontSize: 12,
    cursor: "pointer"
  } }, t("\uD5C8\uBE0C\uB85C \u2192", "Hub \u2192"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "24px 20px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 22,
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.7)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: GE.muted, marginBottom: 12, textAlign: "center" } }, t("\uAE30\uC05C \uAF43\uB9CC \uBE60\uB974\uAC8C \uD074\uB9AD\uD558\uC138\uC694", "Click only the happy flowers quickly")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" } }, Object.entries(EMOTIONS).map(([key, e]) => /* @__PURE__ */ React.createElement("div", { key, style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement(FlowerSVG, { emotion: key, size: 56, disabled: true }), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 4,
    color: e.isTarget ? GE.sage : GE.muted,
    background: e.isTarget ? GE.sagePale : "transparent",
    padding: "2px 6px",
    borderRadius: 100
  } }, e.name, e.isTarget ? " \u2713" : ""))))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: GE.muted, marginBottom: 10 } }, t("\uB09C\uC774\uB3C4 \uC120\uD0DD", "Difficulty")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 22 } }, Object.entries(DIFFICULTY_CONFIG).map(([key, d]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key,
      onClick: () => setDiff(key),
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        padding: "13px 10px",
        borderRadius: 13,
        cursor: "pointer",
        border: "1.5px solid",
        borderColor: difficulty === key ? GE.sage : "rgba(0,0,0,0.1)",
        background: difficulty === key ? GE.sagePale : "rgba(255,255,255,0.8)",
        textAlign: "left",
        transition: "all 0.15s"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: difficulty === key ? GE.sage : GE.dark, marginBottom: 3 } }, d.label),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, d.desc)
  ))), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 12,
    color: GE.muted,
    lineHeight: 1.7,
    marginBottom: 20,
    background: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: "12px 14px"
  } }, t(
    /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F4A1} PHQ-9 \uC810\uC218\uAC00 \uB192\uC744\uC218\uB85D \uC2EC\uD654 \uB09C\uC774\uB3C4\uB97C \uAD8C\uC7A5\uD574\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC2AC\uD508\xB7\uBD88\uC548\uD55C \uAF43\uC774 \uB9CE\uC774 \uBCF4\uC5EC\uB3C4 \uAE30\uC05C \uAF43\uC744 \uCC3E\uB294 \uC5F0\uC2B5\uC774", /* @__PURE__ */ React.createElement("br", null), "\uAC10\uC815 \uC778\uC2DD \uB2A5\uB825\uC744 \uD0A4\uC6CC\uC90D\uB2C8\uB2E4."),
    /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F4A1} Higher PHQ-9 scores recommend Advanced difficulty.", /* @__PURE__ */ React.createElement("br", null), "Even when sad or anxious flowers surround you,", /* @__PURE__ */ React.createElement("br", null), "finding the happy flower trains your emotional awareness.")
  )), personalBest !== null && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    padding: "10px 16px",
    background: `linear-gradient(135deg, ${GE.amber}15, ${GE.amber}08)`,
    borderRadius: 12,
    border: `1px solid ${GE.amber}33`
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F3C6}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: GE.amber } }, t(`\uB0B4 \uCD5C\uACE0 \uAE30\uB85D: ${personalBest ? personalBest.toLocaleString() : 0}\uC810`, `Best: ${personalBest ? personalBest.toLocaleString() : 0} pts`))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => startRound(1, difficulty),
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        width: "100%",
        padding: "14px",
        background: `linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
        color: "white",
        border: "none",
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: `0 4px 16px ${GE.amber}44`
      }
    },
    t("\uC2DC\uC791\uD558\uAE30 \u{1F338}", "Start \u{1F338}")
  )));
  if (screen === "round") {
    const remaining = cells.filter((c) => EMOTIONS[c.emotion].isTarget && c.state !== "found").length;
    const gs = cfg.grid;
    const flowerSize = gs === 4 ? 74 : 60;
    const comboMultiplier = comboDisplay >= 10 ? "\xD7 3.0" : comboDisplay >= 5 ? "\xD7 2.0" : comboDisplay >= 3 ? "\xD7 1.5" : null;
    const comboColor = comboDisplay >= 10 ? "#E53E3E" : comboDisplay >= 5 ? GE.rose : GE.amber;
    const isCritical = timeLeft <= 3;
    const isUrgent = timeLeft <= 5;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: isCritical ? `linear-gradient(160deg, #FFF0F0, #FFF8E8)` : `linear-gradient(160deg, #FFFBF0, ${GE.cream})`,
      transition: "background 0.5s"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "10px 16px",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${isCritical ? "#FCA5A555" : "rgba(0,0,0,0.06)"}`
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: GE.dark } }, t(`\uB77C\uC6B4\uB4DC ${round} / ${cfg.rounds}`, `Round ${round} / ${cfg.rounds}`)), comboDisplay >= 3 && /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 12,
      fontWeight: 800,
      color: comboColor,
      background: comboColor + "18",
      borderRadius: 100,
      padding: "2px 10px",
      animation: "pulse 0.4s ease",
      display: "flex",
      alignItems: "center",
      gap: 4
    } }, comboDisplay >= 10 ? "\u{1F525}\u{1F525}\u{1F525}" : comboDisplay >= 5 ? "\u{1F525}\u{1F525}" : "\u{1F525}", comboDisplay, " ", t("\uCF64\uBCF4", "Combo"), comboMultiplier && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, opacity: 0.8 } }, comboMultiplier))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { style: { color: GE.sage, fontWeight: 700 } }, "\u2713 ", correct), /* @__PURE__ */ React.createElement("span", { style: { color: GE.warn, fontWeight: 700 } }, "\u2717 ", incorrect), /* @__PURE__ */ React.createElement("span", { style: {
      color: timerColor,
      fontWeight: 700,
      minWidth: 28,
      textAlign: "right",
      fontSize: isUrgent ? 17 : 13,
      animation: isCritical ? "pulse 0.5s infinite" : isUrgent ? "pulse 0.8s infinite" : "none"
    } }, timeLeft, "s"))), /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 100, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: "100%",
      borderRadius: 100,
      transition: "width 1s linear, background 0.5s",
      width: `${timeLeft / cfg.roundSec * 100}%`,
      background: timerColor
    } }))), /* @__PURE__ */ React.createElement("div", { style: {
      textAlign: "center",
      padding: "8px 0 4px",
      fontSize: 12,
      color: isCritical ? GE.warn : GE.muted,
      fontWeight: 600,
      transition: "color 0.3s"
    } }, isCritical ? t("\u23F0 \uC11C\uB458\uB7EC\uC694!", "\u23F0 Hurry up!") : t(`\uAE30\uC05C \uAF43 ${remaining}\uAC1C \uB0A8\uC558\uC5B4\uC694 \xB7 \uB2E4\uB978 \uAF43\uC740 \uD074\uB9AD\uD558\uC9C0 \uB9C8\uC138\uC694`, `${remaining} happy flower${remaining !== 1 ? "s" : ""} left \xB7 Don't click the others`)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", position: "relative" } }, comboTierAnim && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
      pointerEvents: "none",
      background: "linear-gradient(135deg, #F59E0B, #FCD34D)",
      color: "white",
      fontWeight: 900,
      fontSize: 22,
      padding: "10px 24px",
      borderRadius: 100,
      boxShadow: "0 4px 20px rgba(245,158,11,0.5)",
      animation: "fadeUp 0.4s ease, pulse 0.6s ease 0.4s",
      fontFamily: "'Noto Sans KR',sans-serif",
      whiteSpace: "nowrap"
    } }, "\u{1F525} ", t("\uCF64\uBCF4", "Combo"), " ", comboTierAnim), /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: `repeat(${gs}, ${flowerSize}px)`,
      gap: gs === 4 ? 8 : 5
    } }, cells.map((cell) => /* @__PURE__ */ React.createElement("div", { key: cell.id, style: {
      width: flowerSize,
      height: flowerSize + 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: cell.state === "found" ? 0 : 1,
      transition: "opacity 0.3s ease"
    } }, cell.state !== "found" && /* @__PURE__ */ React.createElement(
      FlowerSVG,
      {
        emotion: cell.emotion,
        size: flowerSize,
        blooming: cell.state === "blooming",
        wilting: cell.state === "wilting",
        disabled: cell.state !== "idle",
        onClick: () => handleFlowerClick(cell.id)
      }
    ))))));
  }
  if (screen === "result") {
    const last = roundStats[roundStats.length - 1] || {};
    const acc = last.totalTargets > 0 ? Math.round(last.correct / last.totalTargets * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      textAlign: "center",
      background: `linear-gradient(160deg, #FFF8E8, ${GE.cream})`,
      animation: "fadeUp 0.4s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, marginBottom: 12 } }, acc >= 80 ? "\u{1F31F}" : acc >= 50 ? "\u{1F338}" : "\u{1F33C}"), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 20, fontWeight: 700, color: GE.dark, marginBottom: 8, fontFamily: "'Noto Serif KR',serif" } }, t(`\uB77C\uC6B4\uB4DC ${last.round} \uC644\uB8CC`, `Round ${last.round} Complete`)), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      gap: 20,
      marginBottom: 24,
      background: "rgba(255,255,255,0.8)",
      borderRadius: 16,
      padding: "16px 24px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: GE.sage } }, last.correct), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, t("\uBC1C\uACAC", "Found"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: GE.warn } }, last.missed), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, t("\uB193\uCE68", "Missed"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: GE.amber } }, acc, "%"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, t("\uC815\uD655\uB3C4", "Accuracy"))), last.avgReaction > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: GE.dusty } }, (last.avgReaction / 1e3).toFixed(1), "s"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, t("\uBC18\uC751\uC18D\uB3C4", "Reaction")))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => startRound(round + 1, difficulty),
        style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          padding: "13px 40px",
          background: `linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
          color: "white",
          border: "none",
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer"
        }
      },
      t("\uB2E4\uC74C \uB77C\uC6B4\uB4DC \u2192", "Next Round \u2192")
    ));
  }
  if (screen === "done") {
    const totalC = roundStats.reduce((a, s) => a + s.correct, 0);
    const totalT = roundStats.reduce((a, s) => a + s.totalTargets, 0);
    const totalW = roundStats.reduce((a, s) => a + s.incorrect, 0);
    const avgAcc = totalT > 0 ? Math.round(totalC / totalT * 100) : 0;
    const bestCombo = Math.max(...roundStats.map((s) => s.maxCombo || 0), 0);
    const isNewRecord = personalBest !== null && computedScore > personalBest;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: 24,
      background: `linear-gradient(160deg, #FFF8E8, #F0FAF0)`,
      animation: "fadeUp 0.5s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 60, marginBottom: 10 } }, "\u{1F33A}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, color: GE.dark, fontFamily: "'Noto Serif KR',serif" } }, t("\uAC10\uC815 \uD6C8\uB828 \uC644\uB8CC!", "Training Complete!")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, fontWeight: 900, color: GE.amber } }, computedScore.toLocaleString(), t("\uC810", " pts")), isNewRecord && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 12,
      fontWeight: 800,
      color: "white",
      background: `linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
      borderRadius: 100,
      padding: "3px 10px",
      animation: "pulse 0.6s ease"
    } }, t("\u{1F3C6} \uC2E0\uAE30\uB85D!", "\u{1F3C6} New Record!"))), personalBest !== null && !isNewRecord && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted, marginTop: 4 } }, t(`\uCD5C\uACE0 \uAE30\uB85D ${personalBest.toLocaleString()}\uC810`, `Best ${personalBest.toLocaleString()} pts`), computedScore > 0 && t(` \xB7 \uCC28\uC774 ${(personalBest - computedScore).toLocaleString()}\uC810`, ` \xB7 Gap ${(personalBest - computedScore).toLocaleString()} pts`)), personalBest === null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.sage, marginTop: 4 } }, t("\uCCAB \uAE30\uB85D\uC774\uC5D0\uC694! \u{1F389}", "First record! \u{1F389}"))), /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 18,
      padding: "18px 20px",
      marginBottom: 16,
      boxShadow: "0 4px 16px rgba(0,0,0,0.07)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: GE.muted, marginBottom: 12 } }, t("\uD6C8\uB828 \uACB0\uACFC", "Results")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" } }, [
      { label: t("\uAE30\uC05C \uAF43 \uBC1C\uACAC", "Happy Flowers Found"), val: t(`${totalC}\uAC1C`, `${totalC}`), color: GE.sage },
      { label: t("\uC804\uCCB4 \uC815\uD655\uB3C4", "Accuracy Rate"), val: `${avgAcc}%`, color: avgAcc >= 90 ? GE.sage : avgAcc >= 75 ? GE.amber : GE.warn },
      { label: t("\uC624\uD074\uB9AD", "Incorrect"), val: t(`${totalW}\uD68C`, `${totalW}`), color: GE.warn },
      { label: t("\uCD5C\uB300 \uCF64\uBCF4", "Max Combo"), val: t(`${bestCombo}\uC5F0\uC18D`, `${bestCombo}`), color: bestCombo >= 10 ? "#E53E3E" : bestCombo >= 5 ? GE.rose : GE.amber }
    ].map(({ label, val, color }) => /* @__PURE__ */ React.createElement("div", { key: label }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted, marginBottom: 3 } }, label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color } }, val)))), (bestCombo >= 3 || avgAcc >= 75) && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 8, flexWrap: "wrap" } }, bestCombo >= 3 && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      color: GE.amber,
      fontWeight: 700,
      background: GE.amber + "15",
      borderRadius: 6,
      padding: "2px 8px"
    } }, t(`\u{1F525} \uCF64\uBCF4 \uBCF4\uB108\uC2A4 +${bestCombo >= 10 ? bestCombo * 15 : bestCombo >= 5 ? bestCombo * 10 : bestCombo * 6}\uC810`, `\u{1F525} Combo Bonus +${bestCombo >= 10 ? bestCombo * 15 : bestCombo >= 5 ? bestCombo * 10 : bestCombo * 6} pts`)), avgAcc >= 75 && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      color: GE.sage,
      fontWeight: 700,
      background: GE.sage + "15",
      borderRadius: 6,
      padding: "2px 8px"
    } }, t(`\u{1F3AF} \uC815\uD655\uB3C4 \uBCF4\uB108\uC2A4 +${avgAcc >= 90 ? 30 : 15}\uC810`, `\u{1F3AF} Accuracy Bonus +${avgAcc >= 90 ? 30 : 15} pts`)))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", marginBottom: 16 } }, roundStats.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.round, style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      marginBottom: 8,
      background: "rgba(255,255,255,0.7)",
      borderRadius: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20 } }, s.correct >= s.totalTargets * 0.8 ? "\u2B50" : s.correct >= s.totalTargets * 0.5 ? "\u{1F338}" : "\u{1F33C}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: GE.dark } }, t(`\uB77C\uC6B4\uB4DC ${s.round}`, `Round ${s.round}`)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: GE.muted } }, t(`${s.correct}/${s.totalTargets} \uBC1C\uACAC \xB7 \uC624\uD074\uB9AD ${s.incorrect}\uD68C`, `${s.correct}/${s.totalTargets} found \xB7 ${s.incorrect} miss`), s.avgReaction > 0 && ` \xB7 ${(s.avgReaction / 1e3).toFixed(1)}s`)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: GE.sage } }, s.totalTargets > 0 ? Math.round(s.correct / s.totalTargets * 100) : 0, "%")))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleFinish,
        style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          padding: "14px",
          background: `linear-gradient(135deg, ${GE.sage}, ${GE.sageL})`,
          color: "white",
          border: "none",
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer"
        }
      },
      t("\uACBD\uD5D8\uCE58 \uBC1B\uAE30 \u2192", "Claim EXP \u2192")
    ));
  }
  return null;
}
