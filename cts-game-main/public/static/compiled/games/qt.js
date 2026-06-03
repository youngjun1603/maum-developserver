;
(function injectQTStyles() {
  if (document.getElementById("qt-styles")) return;
  const s = document.createElement("style");
  s.id = "qt-styles";
  s.textContent = `
    @keyframes qtFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes qtGlow { 0%,100%{box-shadow:0 0 8px rgba(107,33,168,0.3)} 50%{box-shadow:0 0 24px rgba(107,33,168,0.6)} }
    .qt-card { animation: qtFadeIn 0.4s ease both; }
    .qt-dot-filled { background: linear-gradient(135deg,#6B21A8,#9333EA); }
    .qt-dot-today { border: 3px solid #D4AF37 !important; }
    .qt-dot-empty { background: #F3E8FF; }
    .qt-book-open { animation: qtGlow 2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
})();
const QTGame = ({ onExit }) => {
  const R = React;
  const [screen, setScreen] = R.useState("intro");
  const [book, setBook] = R.useState("");
  const [chapter, setChapter] = R.useState("");
  const [verse, setVerse] = R.useState("");
  const [meditation, setMeditation] = R.useState("");
  const [prayer, setPrayer] = R.useState("");
  const [history, setHistory] = R.useState([]);
  const [doneData, setDoneData] = R.useState(null);
  const [saving, setSaving] = R.useState(false);
  const [tab, setTab] = R.useState("write");
  const TODAY = /* @__PURE__ */ new Date();
  const todayKey = TODAY.toISOString().slice(0, 10);
  R.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lol_qt_history") || "[]");
      setHistory(saved);
    } catch {
    }
  }, []);
  const todayDone = history.some((h) => h.date === todayKey);
  async function handleSubmit() {
    if (!book.trim() || !meditation.trim()) return;
    setSaving(true);
    const entry = {
      date: todayKey,
      book: book.trim(),
      chapter: chapter.trim(),
      verse: verse.trim(),
      meditation: meditation.trim(),
      prayer: prayer.trim()
    };
    const newHistory = [entry, ...history.filter((h) => h.date !== todayKey)];
    try {
      localStorage.setItem("lol_qt_history", JSON.stringify(newHistory.slice(0, 90)));
    } catch {
    }
    setHistory(newHistory);
    const sec = Math.floor((Date.now() - window._qtStart) / 1e3) || 120;
    let expGained = 0;
    try {
      const res = await GameEngine.saveSession({
        gameId: "qt",
        moduleType: "MINDFULNESS",
        score: 50,
        durationSec: sec,
        metadata: { book: entry.book, chapter: entry.chapter, has_prayer: !!entry.prayer }
      });
      expGained = res.data?.expGained || 0;
    } catch {
    }
    setSaving(false);
    setDoneData({ expGained });
    setScreen("done");
  }
  if (screen === "intro") {
    window._qtStart = Date.now();
    return /* @__PURE__ */ React.createElement("div", { className: "qt-card", style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(160deg,#F3E8FF 0%,#FDFBFF 60%)",
      padding: 32,
      textAlign: "center",
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, /* @__PURE__ */ React.createElement("div", { className: "qt-book-open", style: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#6B21A8,#9333EA)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 40,
      marginBottom: 24
    } }, "\u{1F4D6}"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 26, fontWeight: 700, color: "#4C1D95", marginBottom: 8 } }, "QT \uCCB4\uD06C\uC778"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#6B21A8", fontWeight: 500, marginBottom: 4 } }, "\uC624\uB298\uC758 \uB9D0\uC500 \uBB35\uC0C1\uC744 \uAE30\uB85D\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#7C3AED", marginBottom: 28, lineHeight: 1.6 } }, '"\uC624\uC9C1 \uC5EC\uD638\uC640\uC758 \uC728\uBC95\uC744 \uC990\uAC70\uC6CC\uD558\uC5EC', /* @__PURE__ */ React.createElement("br", null), '\uADF8\uC758 \uC728\uBC95\uC744 \uC8FC\uC57C\uB85C \uBB35\uC0C1\uD558\uB294\uB3C4\uB2E4"', /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9333EA" } }, "\uC2DC\uD3B8 1:2")), todayDone && /* @__PURE__ */ React.createElement("div", { style: {
      background: "linear-gradient(135deg,#D4AF37,#F59E0B)",
      color: "white",
      borderRadius: 12,
      padding: "10px 20px",
      marginBottom: 20,
      fontSize: 14,
      fontWeight: 600
    } }, "\u2705 \uC624\uB298 QT\uB97C \uC644\uB8CC\uD588\uC5B4\uC694!"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("write"),
        style: {
          background: "linear-gradient(135deg,#6B21A8,#9333EA)",
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: "14px 28px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer"
        }
      },
      todayDone ? "\uB2E4\uC2DC \uAE30\uB85D\uD558\uAE30" : "\u{1F4D6} \uC624\uB298 QT \uC2DC\uC791"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("calendar"),
        style: {
          background: "#F3E8FF",
          color: "#6B21A8",
          border: "2px solid #C4B5FD",
          borderRadius: 14,
          padding: "14px 28px",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer"
        }
      },
      "\u{1F4C5} QT \uB2EC\uB825 \uBCF4\uAE30"
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 20, color: "#9333EA", fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", null, "\uC5F0\uC18D ", history.length > 0 ? calcStreak(history) : 0, "\uC77C QT \uC911"), /* @__PURE__ */ React.createElement("span", null, "\u{1F525}")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onExit(null),
        style: { marginTop: 24, background: "none", border: "none", color: "#9CA3AF", fontSize: 13, cursor: "pointer" }
      },
      "\u2190 \uAC8C\uC784 \uBAA9\uB85D\uC73C\uB85C"
    ));
  }
  if (screen === "write") {
    return /* @__PURE__ */ React.createElement("div", { className: "qt-card", style: {
      minHeight: "100vh",
      background: "#FDFBFF",
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      background: "linear-gradient(135deg,#6B21A8,#9333EA)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12
    } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("intro"),
        style: { background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 20, cursor: "pointer" }
      },
      "\u2190"
    ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "white", fontWeight: 700, fontSize: 17 } }, "\u{1F4D6} \uC624\uB298\uC758 QT"), /* @__PURE__ */ React.createElement("div", { style: { color: "rgba(255,255,255,0.8)", fontSize: 12 } }, todayKey))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "24px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(107,33,168,0.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#6B21A8", marginBottom: 12 } }, "\u{1F4DA} \uC624\uB298 \uC77D\uC740 \uC131\uACBD"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, color: "#7C3AED", fontWeight: 600 } }, "\uCC45 \uC774\uB984 *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: book,
        onChange: (e) => setBook(e.target.value),
        placeholder: "\uC608: \uC2DC\uD3B8",
        style: {
          width: "100%",
          border: "1.5px solid #DDD6FE",
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 14,
          outline: "none",
          marginTop: 4,
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, color: "#7C3AED", fontWeight: 600 } }, "\uC7A5"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: chapter,
        onChange: (e) => setChapter(e.target.value),
        placeholder: "1",
        style: {
          width: "100%",
          border: "1.5px solid #DDD6FE",
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 14,
          outline: "none",
          marginTop: 4,
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, color: "#7C3AED", fontWeight: 600 } }, "\uC808"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: verse,
        onChange: (e) => setVerse(e.target.value),
        placeholder: "1-10",
        style: {
          width: "100%",
          border: "1.5px solid #DDD6FE",
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 14,
          outline: "none",
          marginTop: 4,
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(107,33,168,0.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#6B21A8", marginBottom: 8 } }, "\u{1F331} \uC624\uB298 \uB9D0\uC500\uC5D0\uC11C \uBC1B\uC740 \uC740\uD61C *"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: meditation,
        onChange: (e) => setMeditation(e.target.value),
        placeholder: "\uC624\uB298 \uC77D\uC740 \uB9D0\uC500\uC774 \uB0B4 \uB9C8\uC74C\uC5D0 \uC5B4\uB5BB\uAC8C \uB2E4\uAC00\uC654\uB098\uC694? \uAE68\uB2EC\uC740 \uAC83, \uC704\uB85C \uBC1B\uC740 \uAC83, \uB3C4\uC804 \uBC1B\uC740 \uAC83\uC744 \uC790\uC720\uB86D\uAC8C \uC801\uC5B4\uBCF4\uC138\uC694.",
        rows: 5,
        style: {
          width: "100%",
          border: "1.5px solid #DDD6FE",
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 14,
          outline: "none",
          resize: "vertical",
          fontFamily: "'Noto Sans KR',sans-serif",
          lineHeight: 1.6,
          color: "#1A1A1A"
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(107,33,168,0.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#6B21A8", marginBottom: 8 } }, "\u{1F64F} \uC624\uB298\uC758 \uAE30\uB3C4 \uC81C\uBAA9 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: prayer,
        onChange: (e) => setPrayer(e.target.value),
        placeholder: "\uC624\uB298 \uB9D0\uC500\uC744 \uD1B5\uD574 \uB4DC\uB9AC\uACE0 \uC2F6\uC740 \uAE30\uB3C4\uB97C \uC801\uC5B4\uBCF4\uC138\uC694.",
        rows: 3,
        style: {
          width: "100%",
          border: "1.5px solid #DDD6FE",
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 14,
          outline: "none",
          resize: "vertical",
          fontFamily: "'Noto Sans KR',sans-serif",
          lineHeight: 1.6,
          color: "#1A1A1A"
        }
      }
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleSubmit,
        disabled: !book.trim() || !meditation.trim() || saving,
        style: {
          width: "100%",
          background: book.trim() && meditation.trim() && !saving ? "linear-gradient(135deg,#6B21A8,#9333EA)" : "#E5E7EB",
          color: book.trim() && meditation.trim() ? "white" : "#9CA3AF",
          border: "none",
          borderRadius: 14,
          padding: "15px",
          fontSize: 16,
          fontWeight: 700,
          cursor: book.trim() && meditation.trim() && !saving ? "pointer" : "not-allowed",
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      },
      saving ? t("\uC800\uC7A5 \uC911...", "Saving...") : "\u2705 QT \uC644\uB8CC\uD558\uAE30"
    )));
  }
  if (screen === "calendar") {
    const year = TODAY.getFullYear();
    const month = TODAY.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];
    for (let i = 0; i < firstDay; i++) monthDates.push(null);
    for (let d = 1; d <= daysInMonth; d++) monthDates.push(d);
    return /* @__PURE__ */ React.createElement("div", { className: "qt-card", style: {
      minHeight: "100vh",
      background: "#FDFBFF",
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      background: "linear-gradient(135deg,#6B21A8,#9333EA)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12
    } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("intro"),
        style: { background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 20, cursor: "pointer" }
      },
      "\u2190"
    ), /* @__PURE__ */ React.createElement("div", { style: { color: "white", fontWeight: 700, fontSize: 17 } }, "\u{1F4C5} QT \uB2EC\uB825")), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "24px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#4C1D95" } }, year, "\uB144 ", month + 1, "\uC6D4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#7C3AED", marginTop: 4 } }, "\uC774\uBC88 \uB2EC ", history.filter((h) => h.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length, "\uD68C QT \uC644\uB8CC")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 } }, [t("\uC77C", "d"), "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"].map((d) => /* @__PURE__ */ React.createElement("div", { key: d, style: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "#7C3AED", padding: "4px 0" } }, d))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 } }, monthDates.map((d, i) => {
      if (!d) return /* @__PURE__ */ React.createElement("div", { key: i });
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const done = history.some((h) => h.date === dateKey);
      const isToday = dateKey === todayKey;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: {
        aspectRatio: "1",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: isToday ? 700 : 400,
        background: done ? "linear-gradient(135deg,#6B21A8,#9333EA)" : "#F3E8FF",
        color: done ? "white" : isToday ? "#6B21A8" : "#9CA3AF",
        border: isToday ? "2px solid #D4AF37" : "none",
        cursor: done ? "pointer" : "default"
      } }, done ? "\u271D\uFE0F" : d);
    })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#4C1D95", marginBottom: 12 } }, "\uCD5C\uADFC QT \uAE30\uB85D"), history.slice(0, 5).map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
      background: "white",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      boxShadow: "0 2px 8px rgba(107,33,168,0.07)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#6B21A8" } }, "\u{1F4D6} ", h.book, " ", h.chapter && `${h.chapter}\uC7A5`, h.verse && ` ${h.verse}\uC808`), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9CA3AF" } }, h.date)), /* @__PURE__ */ React.createElement("p", { style: {
      fontSize: 13,
      color: "#374151",
      lineHeight: 1.5,
      margin: 0,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    } }, h.meditation), h.prayer && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#7C3AED", marginTop: 6, marginBottom: 0 } }, "\u{1F64F} ", h.prayer.slice(0, 50), h.prayer.length > 50 ? "..." : "")))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("write"),
        style: {
          width: "100%",
          marginTop: 8,
          background: "linear-gradient(135deg,#6B21A8,#9333EA)",
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: "14px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      },
      "\u{1F4D6} \uC624\uB298 QT \uD558\uAE30"
    )));
  }
  if (screen === "done") {
    const streak = calcStreak(history);
    return /* @__PURE__ */ React.createElement("div", { className: "qt-card", style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(160deg,#F3E8FF 0%,#FDFBFF 60%)",
      padding: 32,
      textAlign: "center",
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 90,
      height: 90,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#D4AF37,#F59E0B)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 44,
      marginBottom: 20
    } }, "\u271D\uFE0F"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, color: "#4C1D95", marginBottom: 8 } }, "\uB9D0\uC500\uC774 \uC784\uD588\uC2B5\uB2C8\uB2E4!"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: "#6B21A8", marginBottom: 4 } }, "\uC624\uB298\uC758 QT\uB97C \uC644\uB8CC\uD588\uC5B4\uC694"), streak >= 3 && /* @__PURE__ */ React.createElement("div", { style: {
      background: "linear-gradient(135deg,#6B21A8,#9333EA)",
      color: "white",
      borderRadius: 20,
      padding: "6px 18px",
      marginBottom: 16,
      fontSize: 13,
      fontWeight: 600
    } }, "\u{1F525} ", streak, "\uC77C \uC5F0\uC18D QT \uC911!"), doneData?.expGained > 0 && /* @__PURE__ */ React.createElement("div", { style: { color: "#D4AF37", fontSize: 16, fontWeight: 700, marginBottom: 16 } }, "+", doneData.expGained, " EXP \uD68D\uB4DD"), /* @__PURE__ */ React.createElement("p", { style: {
      fontSize: 13,
      color: "#7C3AED",
      marginBottom: 28,
      lineHeight: 1.8,
      background: "#F3E8FF",
      borderRadius: 12,
      padding: "12px 20px"
    } }, '"\uC5EC\uD638\uC640\uC758 \uB9D0\uC500\uC740 \uC21C\uACB0\uD568\uC774\uC5EC', /* @__PURE__ */ React.createElement("br", null), '\uD759 \uB3C4\uAC00\uB2C8\uC5D0 \uC77C\uACF1 \uBC88 \uB2E8\uB828\uD55C \uC740 \uAC19\uB3C4\uB2E4"', /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11 } }, "\uC2DC\uD3B8 12:6")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setScreen("calendar"),
        style: {
          background: "#F3E8FF",
          color: "#6B21A8",
          border: "2px solid #C4B5FD",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      },
      "\u{1F4C5} \uB2EC\uB825 \uBCF4\uAE30"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onExit({ score: 50, expGained: doneData?.expGained || 0 }),
        style: {
          background: "linear-gradient(135deg,#6B21A8,#9333EA)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR',sans-serif"
        }
      },
      "\uAC8C\uC784 \uBAA9\uB85D\uC73C\uB85C \u2192"
    )));
  }
  return null;
};
function calcStreak(history) {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cur = /* @__PURE__ */ new Date();
  for (const h of sorted) {
    const d = new Date(h.date);
    const diff = Math.round((cur - d) / 864e5);
    if (diff <= 1) {
      streak++;
      cur = d;
    } else break;
  }
  return streak;
}
