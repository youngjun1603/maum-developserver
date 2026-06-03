(function() {
  const id = "worry-bubble-styles";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    @keyframes wbFloat {
      0%,100% { transform: translateY(0px) translateX(0px) rotate(-1deg); }
      33%      { transform: translateY(-18px) translateX(7px) rotate(1.2deg); }
      66%      { transform: translateY(-9px) translateX(-5px) rotate(-0.6deg); }
    }
    @keyframes wbPop {
      0%   { transform: scale(1);   opacity: 1; }
      45%  { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(0);   opacity: 0; }
    }
    @keyframes wbAppear {
      from { opacity: 0; transform: scale(0.6) translateY(30px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes wbFadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .wb-float {
      animation: wbFloat var(--dur, 10s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
      position: absolute;
      transform-origin: center center;
    }
    .wb-float.wb-popped {
      animation: wbPop 0.35s ease-out forwards !important;
      pointer-events: none;
    }
    .wb-bubble {
      cursor: pointer;
      user-select: none;
      transition: filter 0.1s;
    }
    .wb-bubble:active { filter: brightness(0.92); }
    .wb-appear { animation: wbAppear 0.5s ease-out both; }
    .wb-fade-up { animation: wbFadeUp 0.5s ease-out both; }
  `;
  document.head.appendChild(s);
})();
const WB_COLORS = [
  { from: "#FFB5C8", to: "#FF8FAD", border: "#FF6B9940", shine: "#FF6B99", text: "#7A1A3A" },
  { from: "#FFD9A0", to: "#FFBB55", border: "#FF9A0040", shine: "#FF9A00", text: "#7A4A00" },
  { from: "#C5AEF0", to: "#A07EE0", border: "#7B4FD040", shine: "#7B4FD0", text: "#3A1A7A" },
  { from: "#A0D8B5", to: "#6FC08A", border: "#3A9A6A40", shine: "#3A9A6A", text: "#1A5A3A" },
  { from: "#A0CCEE", to: "#6AAAD8", border: "#3A88C040", shine: "#3A88C0", text: "#1A4A7A" }
];
const EXAMPLE_WORRIES = [
  "\uC694\uC998 \uC77C\uC774 \uB108\uBB34 \uB9CE\uC544\uC694",
  "\uC774 \uACB0\uC815\uC774 \uB9DE\uB294 \uAC74\uC9C0 \uBAA8\uB974\uACA0\uC5B4\uC694",
  "\uAD00\uACC4\uAC00 \uC5B4\uC0C9\uD574\uC9C4 \uAC83 \uAC19\uC544\uC694",
  "\uBBF8\uB798\uAC00 \uBD88\uC548\uD574\uC694",
  "\uB0B4\uAC00 \uC798\uD558\uACE0 \uC788\uB294 \uAC74\uC9C0 \uAC71\uC815\uB3FC\uC694",
  "\uBAB8\uC774 \uC790\uAFB8 \uD53C\uACE4\uD574\uC694",
  "\uC911\uC694\uD55C \uC77C\uC744 \uC78A\uC5B4\uBC84\uB9B4\uAE4C \uBD10\uC694",
  "\uB9C8\uC74C\uC774 \uACF5\uD5C8\uD55C \uB290\uB08C\uC774\uC5D0\uC694",
  "\uD63C\uC790\uC778 \uAC83 \uAC19\uC740 \uAE30\uBD84\uC774 \uB4E4\uC5B4\uC694",
  "\uB0B4\uC77C\uC774 \uB450\uB835\uACE0 \uBD88\uC548\uD574\uC694"
];
const SLOT_POSITIONS = [
  [22, 18],
  [65, 25],
  [38, 52],
  [18, 68],
  [68, 62]
];
function buildBubbles(texts) {
  return texts.map((t2, i) => ({
    id: i,
    text: t2.trim(),
    xPct: SLOT_POSITIONS[i % 5][0] + (Math.random() - 0.5) * 6,
    yPct: SLOT_POSITIONS[i % 5][1] + (Math.random() - 0.5) * 6,
    size: Math.min(128, Math.max(92, 92 + t2.length * 1.5)),
    dur: `${8 + Math.random() * 5}s`,
    delay: `${-(Math.random() * 7)}s`,
    colorIdx: i % WB_COLORS.length
  })).filter((b) => b.text.length > 0);
}
function WBHeader({ title, left, right }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 16px",
    flexShrink: 0,
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 64 } }, left), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#2C3E50", fontFamily: "'Noto Serif KR',serif" } }, title), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 64, display: "flex", justifyContent: "flex-end" } }, right));
}
const WorryGame = ({ onExit }) => {
  const [screen, setScreen] = React.useState("intro");
  const [inputs, setInputs] = React.useState(["", "", ""]);
  const [bubbles, setBubbles] = React.useState([]);
  const [poppedIds, setPoppedIds] = React.useState(/* @__PURE__ */ new Set());
  const [saving, setSaving] = React.useState(false);
  const [doneData, setDoneData] = React.useState(null);
  const [startTime] = React.useState(Date.now());
  function handleStart() {
    const valid = inputs.filter((t2) => t2.trim());
    if (!valid.length) return;
    setBubbles(buildBubbles(inputs));
    setPoppedIds(/* @__PURE__ */ new Set());
    setScreen("pop");
  }
  function handlePop(id) {
    if (poppedIds.has(id)) return;
    const next = new Set(poppedIds);
    next.add(id);
    setPoppedIds(next);
    if (next.size === bubbles.length) {
      setTimeout(() => finishGame(next.size), 500);
    }
  }
  async function finishGame(count) {
    setSaving(true);
    const sec = Math.round((Date.now() - startTime) / 1e3);
    const score = count * 30;
    try {
      const res = await GameEngine.saveSession({
        gameId: "worry",
        moduleType: "RELAX",
        score,
        durationSec: sec,
        metadata: { worries_count: count, worries: bubbles.map((b) => b.text) }
      });
      setDoneData({
        score,
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || []
      });
    } catch {
      setDoneData({ score, expGained: 0, leveledUp: false, newAchievements: [] });
    }
    setSaving(false);
    setScreen("done");
  }
  function fillExamples() {
    const shuffled = [...EXAMPLE_WORRIES].sort(() => Math.random() - 0.5);
    setInputs([shuffled[0], shuffled[1], shuffled[2]]);
  }
  const canStart = inputs.some((t2) => t2.trim());
  if (screen === "intro") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(160deg, #DFF0F5, #EAE8F8, #E8F3EA)",
    height: "100%"
  } }, /* @__PURE__ */ React.createElement(
    WBHeader,
    {
      title: "\u{1FAE7} \uAE30\uB3C4 \uD48D\uC120",
      right: /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: "rgba(0,0,0,0.06)",
        color: "#666",
        border: "none",
        borderRadius: 9,
        padding: "6px 12px",
        fontSize: 12,
        cursor: "pointer"
      } }, t("\uD5C8\uBE0C\uB85C \u2192", "Hub \u2192"))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 24px 32px",
    gap: 20
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, lineHeight: 1, animation: "wbFloat 8s ease-in-out infinite" } }, "\u{1FAE7}"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", maxWidth: 280 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 22,
    fontWeight: 700,
    color: "#2C3E50",
    fontFamily: "'Noto Serif KR',serif",
    marginBottom: 10
  } }, "\uB9C8\uC74C\uC758 \uC9D0\uC744 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB824\uC694"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "#5A6A7A", lineHeight: 1.75 } }, "\uC9C0\uAE08 \uB9C8\uC74C\uC744 \uBB34\uAC81\uAC8C \uD558\uB294 \uAC71\uC815\uB4E4\uC744", /* @__PURE__ */ React.createElement("br", null), "\uD48D\uC120\uC5D0 \uB2F4\uACE0 \uD558\uB098\uC529 \uD130\uB728\uB824 \uBCF4\uC138\uC694.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#8A9AB0" } }, "\uC8FC\uB2D8\uAED8 \uB9E1\uAE30\uB294 \uAC83\uC774 \uB9C8\uC74C\uC744 \uAC00\uBCCD\uAC8C \uD574\uC694. (\uBCA7\uC804 5:7)"))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.75)",
    borderRadius: 16,
    padding: "14px 20px",
    width: "100%",
    maxWidth: 300,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
  } }, [
    { emoji: "\u270D\uFE0F", text: "\uC9C0\uAE08 \uB9C8\uC74C\uC758 \uC9D0 1~3\uAC00\uC9C0\uB97C \uC801\uC5B4\uC694" },
    { emoji: "\u{1FAE7}", text: "\uAC71\uC815\uB4E4\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB9BD\uB2C8\uB2E4" },
    { emoji: "\u{1F4A5}", text: t("\uD074\uB9AD\uD574\uC11C \uD558\uB098\uC529 \uD130\uB728\uB824\uC694", "Click to pop them one by one") }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, minWidth: 26, textAlign: "center" } }, s.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#5A6A7A" } }, s.text)))), /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("input"), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "linear-gradient(135deg, #7B9ED9, #5B7EC8)",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "14px 0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(91,126,200,0.4)",
    width: "100%",
    maxWidth: 300
  } }, t("\uC2DC\uC791\uD558\uAE30", "Start"))));
  if (screen === "input") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(160deg, #DFF0F5, #EAE8F8, #E8F3EA)",
    height: "100%"
  } }, /* @__PURE__ */ React.createElement(
    WBHeader,
    {
      title: t("\uAC71\uC815 \uC801\uAE30", "Enter your worry"),
      left: /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("intro"), style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: "none",
        color: "#5A6A7A",
        border: "none",
        fontSize: 13,
        cursor: "pointer",
        padding: "4px 0"
      } }, t("\u2190 \uB3CC\uC544\uAC00\uAE30", "\u2190 Back"))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "20px 24px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 22 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: "#2C3E50", fontFamily: "'Noto Serif KR',serif" } }, t("\uC9C0\uAE08 \uB9C8\uC74C\uC744 \uBB34\uAC81\uAC8C \uD558\uB294 \uAC83\uB4E4\uC740?", "What's weighing on your mind right now?")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#8A9AB0", marginTop: 5 } }, "\uC544\uC8FC \uC791\uC740 \uB9C8\uC74C\uC758 \uC9D0\uB3C4 \uAD1C\uCC2E\uC544\uC694 \xB7 \uCD5C\uC18C 1\uAC1C \uC774\uC0C1")), inputs.map((val, i) => {
    const c = WB_COLORS[i];
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      color: "white",
      fontWeight: 700,
      flexShrink: 0
    } }, i + 1), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#8A9AB0" } }, t("\uAC71\uC815", "Worry"), " ", i + 1, i > 0 ? t(" (\uC120\uD0DD)", " (optional)") : "")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: val,
        onChange: (e) => {
          const next = [...inputs];
          next[i] = e.target.value;
          setInputs(next);
        },
        placeholder: i === 0 ? "\uC9C0\uAE08 \uB9C8\uC74C\uC744 \uBB34\uAC81\uAC8C \uD558\uB294 \uAC83..." : "\uB610 \uB2E4\uB978 \uB9C8\uC74C\uC758 \uC9D0\uC774 \uC788\uB2E4\uBA74...",
        maxLength: 35,
        style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          width: "100%",
          padding: "11px 14px",
          fontSize: 14,
          color: "#2C3E50",
          background: "white",
          border: `1.5px solid ${val.trim() ? c.shine + "99" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 12,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
          boxShadow: val.trim() ? `0 0 0 3px ${c.shine}18` : "none"
        }
      }
    ));
  }), /* @__PURE__ */ React.createElement("button", { onClick: fillExamples, style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "none",
    border: "1.5px dashed rgba(0,0,0,0.13)",
    borderRadius: 12,
    padding: "10px 16px",
    fontSize: 12,
    color: "#8A9AB0",
    cursor: "pointer",
    width: "100%",
    marginTop: 2
  } }, t("\u2728 \uC608\uC2DC\uB85C \uCC44\uC6CC\uBCF4\uAE30", "\u2728 Fill with examples"))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px 32px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleStart,
      disabled: !canStart,
      style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: canStart ? "linear-gradient(135deg, #7B9ED9, #5B7EC8)" : "rgba(0,0,0,0.08)",
        color: canStart ? "white" : "#AAA",
        border: "none",
        borderRadius: 14,
        padding: "14px",
        fontSize: 16,
        fontWeight: 700,
        cursor: canStart ? "pointer" : "not-allowed",
        width: "100%",
        boxShadow: canStart ? "0 4px 14px rgba(91,126,200,0.4)" : "none",
        transition: "all 0.2s"
      }
    },
    t("\uD48D\uC120 \uB9CC\uB4E4\uAE30 \u{1FAE7}", "Make bubbles \u{1FAE7}")
  )));
  if (screen === "pop") {
    const totalCount = bubbles.length;
    const poppedCount = poppedIds.size;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(160deg, #C8E8F5, #D8D4F0, #C8EAD8)",
      height: "100%",
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement(
      WBHeader,
      {
        title: saving ? t("\uC800\uC7A5 \uC911...", "Saving...") : `${poppedCount === totalCount ? "\u{1F389}" : "\u{1FAE7}"} ${poppedCount}/${totalCount} \uD130\uB728\uB838\uC5B4\uC694`,
        left: !saving && /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("input"), style: {
          fontFamily: "'Noto Sans KR',sans-serif",
          background: "none",
          color: "#7A8A9A",
          border: "none",
          fontSize: 12,
          cursor: "pointer"
        } }, t("\u2190 \uB2E4\uC2DC \uC785\uB825", "\u2190 Re-enter")),
        right: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center" } }, bubbles.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, style: {
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: poppedIds.has(b.id) ? "rgba(0,0,0,0.12)" : `linear-gradient(135deg, ${WB_COLORS[b.colorIdx].from}, ${WB_COLORS[b.colorIdx].to})`,
          transition: "background 0.4s"
        } })))
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, position: "relative", overflow: "hidden" } }, poppedCount === 0 && !saving && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: 24,
      left: 0,
      right: 0,
      textAlign: "center",
      pointerEvents: "none",
      zIndex: 0,
      color: "rgba(90,106,122,0.45)",
      fontSize: 13
    } }, t("\uD48D\uC120\uC744 \uB20C\uB7EC\uC11C \uD130\uB728\uB824 \uBCF4\uC138\uC694 \u{1F4A5}", "Tap a bubble to pop it \u{1F4A5}")), saving && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.5)",
      backdropFilter: "blur(4px)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5A6A7A", animation: "pulse 1.5s infinite" } }, "\uC8FC\uB2D8\uAED8 \uB9E1\uAE30\uB294 \uC911... \u{1F308}")), bubbles.map((b) => {
      const c = WB_COLORS[b.colorIdx];
      const isPopped = poppedIds.has(b.id);
      const sz = b.size;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: b.id,
          className: `wb-float wb-appear${isPopped ? " wb-popped" : ""}`,
          style: {
            left: `${b.xPct}%`,
            top: `${b.yPct}%`,
            "--dur": b.dur,
            "--delay": b.delay,
            marginLeft: -sz / 2,
            marginTop: -sz / 2,
            animationDelay: `${0.1 * b.id}s`,
            zIndex: 10
          },
          onClick: () => !isPopped && !saving && handlePop(b.id)
        },
        /* @__PURE__ */ React.createElement("div", { className: "wb-bubble", style: {
          width: sz,
          height: sz,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 35%, ${c.from}F0, ${c.to}CC)`,
          border: `2px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 10,
          boxShadow: `0 8px 28px ${c.to}50, inset 0 -4px 8px rgba(0,0,0,0.05), inset 0 4px 10px rgba(255,255,255,0.55)`,
          position: "relative",
          overflow: "hidden",
          cursor: isPopped ? "default" : "pointer"
        } }, /* @__PURE__ */ React.createElement("div", { style: {
          position: "absolute",
          top: 10,
          left: 11,
          width: 13,
          height: 9,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.65)",
          transform: "rotate(-30deg)",
          pointerEvents: "none"
        } }), /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: sz < 108 ? 11 : 12,
          fontFamily: "'Noto Sans KR',sans-serif",
          fontWeight: 600,
          color: c.text,
          lineHeight: 1.45,
          maxWidth: sz - 26,
          wordBreak: "break-word",
          pointerEvents: "none"
        } }, b.text))
      );
    })));
  }
  if (screen === "done") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(160deg, #E0EFF8, #ECE8F8, #E2F2E6)",
    height: "100%"
  } }, /* @__PURE__ */ React.createElement(
    WBHeader,
    {
      title: "\u{1FAE7} \uAE30\uB3C4 \uD48D\uC120",
      right: /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(doneData || null), style: {
        fontFamily: "'Noto Sans KR',sans-serif",
        background: "rgba(0,0,0,0.06)",
        color: "#666",
        border: "none",
        borderRadius: 9,
        padding: "6px 12px",
        fontSize: 12,
        cursor: "pointer"
      } }, t("\uD5C8\uBE0C\uB85C \u2192", "Hub \u2192"))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 24px 32px",
    gap: 18
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64, lineHeight: 1, animation: "wbAppear 0.6s ease" } }, "\u{1F308}"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 22,
    fontWeight: 700,
    color: "#2C3E50",
    fontFamily: "'Noto Serif KR',serif"
  } }, "\uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB838\uC5B4\uC694!!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "#5A6A7A", marginTop: 8, lineHeight: 1.75 } }, bubbles.length, "\uAC1C\uC758 \uC9D0\uC744 \uD48D\uC120\uC5D0 \uB2F4\uC544", /* @__PURE__ */ React.createElement("br", null), "\uBAA8\uB450 \uC8FC\uB2D8\uAED8 \uC62C\uB824\uB4DC\uB838\uC5B4\uC694 \u{1F64F}")), doneData && /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 16,
    padding: "14px 24px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    display: "flex",
    gap: 28,
    textAlign: "center",
    animation: "wbFadeUp 0.5s ease 0.2s both"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color: "#5B7EC8" } }, doneData.score), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#8A9AB0", marginTop: 2 } }, t("\uC810\uC218", "Score"))), /* @__PURE__ */ React.createElement("div", { style: { width: 1, background: "rgba(0,0,0,0.07)" } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color: "#4A8A5A" } }, "+", doneData.expGained), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#8A9AB0", marginTop: 2 } }, t("\uACBD\uD5D8\uCE58", "EXP")))), doneData?.leveledUp && /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    borderRadius: 12,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    color: "white",
    animation: "wbAppear 0.5s ease"
  } }, t("\u{1F389} \uB808\uBCA8 \uC5C5!", "\u{1F389} Level Up!")), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: "14px 18px",
    width: "100%",
    maxWidth: 320,
    animation: "wbFadeUp 0.5s ease 0.35s both"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#8A9AB0", marginBottom: 10, textAlign: "center" } }, t("\uC624\uB298 \uB0B4\uB824\uB193\uC740 \uAC71\uC815\uB4E4 \u{1F33F}", "Today's released worries \u{1F33F}")), bubbles.map((b, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    borderBottom: i < bubbles.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, "\u{1F4A8}"), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 13,
    color: "#9AAABA",
    textDecoration: "line-through",
    textDecorationColor: WB_COLORS[i % 5].shine + "99"
  } }, b.text)))), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    color: "#8A9AB0",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 1.75,
    animation: "wbFadeUp 0.5s ease 0.5s both"
  } }, "\uAC71\uC815\uC740 \uC0DD\uAC01\uC77C \uBFD0\uC774\uC5D0\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC9C0\uAE08 \uC774 \uC21C\uAC04 \uB2F9\uC2E0\uC740 \uAD1C\uCC2E\uC544\uC694 \u{1F499}"), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 10,
    width: "100%",
    maxWidth: 320,
    animation: "wbFadeUp 0.5s ease 0.6s both"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setInputs(["", "", ""]);
    setScreen("input");
  }, style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    flex: 1,
    background: "rgba(0,0,0,0.06)",
    color: "#5A6A7A",
    border: "none",
    borderRadius: 12,
    padding: "12px",
    fontSize: 13,
    cursor: "pointer"
  } }, t("\uB2E4\uC2DC \uD558\uAE30", "Play again")), /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(doneData), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    flex: 2,
    background: "linear-gradient(135deg, #7B9ED9, #5B7EC8)",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(91,126,200,0.4)"
  } }, t("\uC815\uC6D0\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30 \u{1F33F}", "Back to hub \u{1F33F}")))));
  return null;
};
