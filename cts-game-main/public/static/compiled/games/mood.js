const MOOD_EMOTIONS = [
  { id: "happy", emoji: "\u{1F60A}", label: t("\uD589\uBCF5", "Joyful"), color: "#F5C842", bg: "#FFFAE0", textColor: "#8B6800" },
  { id: "calm", emoji: "\u{1F60C}", label: t("\uD3C9\uC628", "Calm"), color: "#7BC4A0", bg: "#E8F5EE", textColor: "#2A6B4A" },
  { id: "tired", emoji: "\u{1F634}", label: t("\uD53C\uACE4", "Tired"), color: "#9BB0C0", bg: "#EEF3F7", textColor: "#3A5060" },
  { id: "anxious", emoji: "\u{1F630}", label: t("\uBD88\uC548", "Anxious"), color: "#F5A050", bg: "#FEF0E4", textColor: "#8B4000" },
  { id: "sad", emoji: "\u{1F622}", label: t("\uC2AC\uD514", "Sad"), color: "#6B9ACB", bg: "#EAF1F9", textColor: "#2A4A7A" },
  { id: "angry", emoji: "\u{1F624}", label: t("\uD654\uB0A8", "Angry"), color: "#E86C6C", bg: "#FDEAEA", textColor: "#7A2020" }
];
const MOOD_MAP = Object.fromEntries(MOOD_EMOTIONS.map((e) => [e.id, e]));
const MC = {
  bg: "#F8F5F0",
  card: "#FFFFFF",
  text: "#2C2520",
  muted: "#8A8078",
  accent: "#7BC4A0"
};
const mbtn = (bg, color = "white", extra = {}) => ({
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
function getMoodInsight(history) {
  if (history.length < 3) return null;
  const counts = {};
  MOOD_EMOTIONS.forEach((e2) => {
    counts[e2.id] = 0;
  });
  history.forEach((d) => {
    if (counts[d.emotion] !== void 0) counts[d.emotion]++;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return null;
  const e = MOOD_MAP[top[0]];
  const msgs = {
    happy: t("\uCD5C\uADFC \uD589\uBCF5\uD55C \uB0A0\uC774 \uB9CE\uC558\uC5B4\uC694. \uADF8 \uC5D0\uB108\uC9C0\uB97C \uACC4\uC18D \uC774\uC5B4\uAC00\uC138\uC694 \u{1F31F}", "You've had many joyful days recently. Keep that energy going \u{1F31F}"),
    calm: t("\uD3C9\uC628\uD568\uC744 \uC790\uC8FC \uB290\uB07C\uACE0 \uC788\uC5B4\uC694. \uB9C8\uC74C\uC774 \uC548\uC815\uB418\uC5B4 \uC788\uB124\uC694 \u{1F33F}", "You've been feeling calm often. Your mind is at peace \u{1F33F}"),
    tired: t("\uD53C\uB85C\uAC00 \uC313\uC5EC \uC788\uB294 \uAC83 \uAC19\uC544\uC694. \uCDA9\uBD84\uD55C \uD734\uC2DD\uC774 \uD544\uC694\uD574\uC694 \u{1F634}", "It seems fatigue has been building up. You need enough rest \u{1F634}"),
    anxious: t("\uBD88\uC548\uD55C \uB0A0\uC774 \uB9CE\uC558\uB124\uC694. \uD638\uD761 \uD6C8\uB828\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC5B4\uC694 \u{1F4A7}", "You've had many anxious days. Breathing exercises can help \u{1F4A7}"),
    sad: t("\uC2AC\uD508 \uAC10\uC815\uC774 \uB9CE\uC774 \uCC3E\uC544\uC654\uAD70\uC694. \uAC10\uC815\uC740 \uC9C0\uB098\uAC00\uC694. \uAD1C\uCC2E\uC544\uC694 \u{1F327}\uFE0F", "Sadness has visited often. Feelings pass. It's okay \u{1F327}\uFE0F"),
    angry: t("\uD654\uAC00 \uB9CE\uC774 \uB0AC\uB358 \uC2DC\uAC04\uC774\uC5C8\uB124\uC694. \uADF8 \uAC10\uC815\uB3C4 \uC18C\uC911\uD574\uC694 \u{1F525}", "It's been a time of much anger. That feeling matters too \u{1F525}")
  };
  return { emoji: e.emoji, label: e.label, color: e.color, bg: e.bg, textColor: e.textColor, msg: msgs[top[0]] };
}
function MoodGame({ onExit }) {
  const { useState, useEffect, useCallback } = React;
  const [screen, setScreen] = useState("loading");
  const [history, setHistory] = useState([]);
  const [todayDone, setTodayDone] = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const [selEmotion, setSelEmotion] = useState(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  useEffect(() => {
    GameEngine.getMoodHistory(30).then((res) => {
      if (res.success) {
        const data = res.data || [];
        setHistory(data);
        const entry = data.find((d) => d.date === today);
        if (entry) {
          setTodayDone(true);
          setTodayEntry(entry);
        }
      }
      setScreen("home");
    }).catch(() => setScreen("home"));
  }, []);
  const handleSave = useCallback(async () => {
    if (!selEmotion) return;
    setSaving(true);
    const score = intensity * 20;
    try {
      const res = await GameEngine.saveSession({
        gameId: "mood",
        moduleType: "checkin",
        score,
        durationSec: 60,
        metadata: { emotion: selEmotion, intensity, note: note.trim() || null }
      });
      const newEntry = { date: today, emotion: selEmotion, intensity, note: note.trim() || null };
      setResult({ expGained: res.data?.expGained || 0, leveledUp: res.data?.leveledUp, newAchievements: res.data?.newAchievements || [] });
      setTodayDone(true);
      setTodayEntry(newEntry);
      setHistory((prev) => [newEntry, ...prev.filter((d) => d.date !== today)]);
      setScreen("done");
    } catch {
      setResult({ expGained: 0 });
      setScreen("done");
    }
    setSaving(false);
  }, [selEmotion, intensity, note, today]);
  if (screen === "loading") {
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: MC.bg,
      flexDirection: "column",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, animation: "float 2s ease-in-out infinite" } }, "\u{1F3A8}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: MC.muted, fontFamily: "'Noto Sans KR',sans-serif" } }, t("\uAC10\uC815 \uAE30\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911...", "Loading emotion log...")));
  }
  function shareMood() {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    const stars = "\u2B50".repeat(intensity);
    const text = `${e.emoji} ${t("\uC624\uB298\uC758 \uAC10\uC815", "Today's Emotion")}: ${e.label} ${stars}${note ? `
"${note}"` : ""}

${t("\uB9C8\uC74C\uAC8C\uC784\uC5D0\uC11C \uD568\uAED8\uD574\uC694", "Join us on MaumGame")} \u{1F495}
https://game.maumful.com`;
    navigator.share ? navigator.share({ title: t("\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D", "Today's Emotion Log"), text }).catch(() => {
    }) : navigator.clipboard?.writeText(text).catch(() => {
    });
  }
  if (screen === "done") {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${e.bg}, ${MC.bg})`,
      padding: 28,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      animation: "fadeUp 0.5s ease"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 72, marginBottom: 16 } }, e.emoji), /* @__PURE__ */ React.createElement("h2", { style: {
      fontSize: 22,
      fontWeight: 700,
      color: MC.text,
      marginBottom: 8,
      fontFamily: "'Noto Serif KR',serif"
    } }, t("\uC624\uB298\uC758 \uAC10\uC815\uC774 \uAE30\uB85D\uB410\uC5B4\uC694", "Today's Emotion Logged")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: MC.muted, marginBottom: 24, lineHeight: 1.8 } }, e.label, " \xB7 ", t("\uAC15\uB3C4", "Intensity"), " ", "\u2B50".repeat(intensity), note && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontStyle: "italic", color: MC.text } }, '"', note, '"'))), result?.expGained > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.8)",
      borderRadius: 16,
      padding: "14px 28px",
      marginBottom: 24
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: MC.accent } }, "+", result.expGained), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MC.muted } }, t("\uACBD\uD5D8\uCE58", "EXP"))), /* @__PURE__ */ React.createElement("button", { onClick: shareMood, style: {
      ...mbtn("rgba(255,255,255,0.85)", MC.muted, { borderRadius: 13, width: "100%", maxWidth: 280 }),
      padding: "11px",
      fontSize: 13,
      marginBottom: 10
    } }, "\u{1F495} ", t("\uD30C\uD2B8\uB108\uC640 \uACF5\uC720\uD558\uAE30", "Share with Partner")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, width: "100%", maxWidth: 280 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("calendar"), style: {
      ...mbtn("rgba(255,255,255,0.85)", MC.muted, { borderRadius: 13, flex: 1 }),
      padding: "12px",
      fontSize: 13
    } }, "\u{1F4C5} ", t("\uB2EC\uB825 \uBCF4\uAE30", "Calendar")), /* @__PURE__ */ React.createElement("button", { onClick: onExit, style: {
      ...mbtn(`linear-gradient(135deg, ${MC.accent}, #5AA888)`, "white", { flex: 2, borderRadius: 13 }),
      padding: "12px",
      fontSize: 13,
      boxShadow: `0 4px 16px ${MC.accent}50`
    } }, t("\uD5C8\uBE0C\uB85C \u2192", "Hub \u2192"))));
  }
  if (screen === "calendar") {
    const histMap2 = Object.fromEntries(history.map((d) => [d.date, d]));
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ iso, day: d.getDate(), entry: histMap2[iso] });
    }
    const insight2 = getMoodInsight(history);
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: MC.bg, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("home"), style: {
      ...mbtn("rgba(0,0,0,0.06)", MC.muted, { borderRadius: 9 }),
      padding: "6px 14px",
      fontSize: 12
    } }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: MC.text, fontFamily: "'Noto Serif KR',serif" } }, "\u{1F3A8} ", t("30\uC77C \uAC10\uC815 \uB2EC\uB825", "30-Day Emotion Calendar")), /* @__PURE__ */ React.createElement("div", { style: { width: 64 } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "20px 16px 28px" } }, insight2 && /* @__PURE__ */ React.createElement("div", { style: {
      background: `linear-gradient(135deg, ${insight2.bg}, rgba(255,255,255,0.9))`,
      border: `1px solid ${insight2.color}40`,
      borderRadius: 16,
      padding: "14px 16px",
      marginBottom: 20,
      boxShadow: `0 2px 12px ${insight2.color}20`
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: insight2.textColor, marginBottom: 5, letterSpacing: "0.5px" } }, insight2.emoji, " ", t("\uCD5C\uADFC 30\uC77C \uAC10\uC815 \uC778\uC0AC\uC774\uD2B8", "Last 30 Days Emotion Insight")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: MC.text, lineHeight: 1.6 } }, insight2.msg)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16, justifyContent: "center" } }, MOOD_EMOTIONS.map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 3,
      padding: "3px 8px",
      borderRadius: 100,
      background: e.bg,
      border: `1px solid ${e.color}40`
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11 } }, e.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: e.textColor } }, e.label)))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5, marginBottom: 20 } }, days.map(({ iso, day, entry }) => {
      const e = entry ? MOOD_MAP[entry.emotion] : null;
      const isToday = iso === today;
      return /* @__PURE__ */ React.createElement("div", { key: iso, style: {
        aspectRatio: "1",
        borderRadius: 10,
        background: e ? e.bg : "rgba(0,0,0,0.04)",
        border: isToday ? `2px solid ${MC.accent}` : `1px solid ${e ? e.color + "30" : "rgba(0,0,0,0.06)"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      } }, e ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14 } }, e.emoji), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 8, color: e.textColor, fontWeight: 600 } }, day)) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "rgba(0,0,0,0.18)", fontWeight: 500 } }, day));
    })), history.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      background: "rgba(255,255,255,0.8)",
      borderRadius: 14,
      padding: "14px",
      border: "1px solid rgba(0,0,0,0.06)",
      marginBottom: 16
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: MC.text, marginBottom: 10 } }, "\u{1F4CA} ", t("\uAC10\uC815 \uBD84\uD3EC", "Emotion Distribution")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, MOOD_EMOTIONS.map((e) => {
      const count = history.filter((d) => d.emotion === e.id).length;
      if (count === 0) return null;
      const pct = Math.round(count / history.length * 100);
      return /* @__PURE__ */ React.createElement("div", { key: e.id, style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 100,
        background: e.bg,
        border: `1px solid ${e.color}40`
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, e.emoji), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: e.textColor } }, count, t("\uC77C", "d"), " (", pct, "%)"));
    }))), history.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: MC.text, marginBottom: 10 } }, t("\uCD5C\uADFC \uAE30\uB85D", "Recent Logs")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 7 } }, history.slice(0, 7).map((entry, i) => {
      const e = MOOD_MAP[entry.emotion] || MOOD_MAP.calm;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(255,255,255,0.8)",
        borderRadius: 12,
        padding: "10px 14px",
        border: `1px solid ${e.color}25`
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, e.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: MC.text } }, e.label, " \xB7 ", "\u2B50".repeat(entry.intensity || 3)), entry.note && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: MC.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, entry.note)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: MC.muted, flexShrink: 0 } }, entry.date?.slice(5)));
    })))));
  }
  if (screen === "checkin_emotion") {
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: MC.bg, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("home"), style: {
      ...mbtn("rgba(0,0,0,0.06)", MC.muted, { borderRadius: 9 }),
      padding: "6px 14px",
      fontSize: 12
    } }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: MC.text, fontFamily: "'Noto Serif KR',serif" } }, t("\uC624\uB298\uC758 \uAC10\uC815", "Today's Emotion")), /* @__PURE__ */ React.createElement("div", { style: { width: 64 } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "28px 20px 24px", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("p", { style: {
      fontSize: 15,
      color: MC.muted,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 1.7,
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, t("\uC9C0\uAE08 \uC774 \uC21C\uAC04, \uC5B4\uB5A4 \uAC10\uC815\uC774", "Right now, which emotion"), /* @__PURE__ */ React.createElement("br", null), t("\uAC00\uC7A5 \uD06C\uAC8C \uB290\uAEF4\uC9C0\uB098\uC694?", "feels the strongest?")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 } }, MOOD_EMOTIONS.map((e) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: e.id,
        onClick: () => {
          setSelEmotion(e.id);
          setIntensity(3);
          setNote("");
          setScreen("checkin_detail");
        },
        style: {
          background: e.bg,
          border: `2px solid ${e.color}70`,
          borderRadius: 18,
          padding: "18px 10px",
          cursor: "pointer",
          fontFamily: "'Noto Sans KR',sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          transition: "all 0.2s",
          boxShadow: `0 2px 12px ${e.color}25`
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 32 } }, e.emoji),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: e.textColor } }, e.label)
    )))));
  }
  if (screen === "checkin_detail") {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    return /* @__PURE__ */ React.createElement("div", { style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: `linear-gradient(160deg, ${e.bg}, ${MC.bg})`,
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("checkin_emotion"), style: {
      ...mbtn("rgba(0,0,0,0.06)", MC.muted, { borderRadius: 9 }),
      padding: "6px 14px",
      fontSize: 12
    } }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 15,
      fontWeight: 700,
      color: MC.text,
      fontFamily: "'Noto Serif KR',serif"
    } }, /* @__PURE__ */ React.createElement("span", null, e.emoji), " ", e.label), /* @__PURE__ */ React.createElement("div", { style: { width: 64 } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "28px 20px 24px", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 28 } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 14,
      fontWeight: 700,
      color: MC.text,
      marginBottom: 12,
      textAlign: "center",
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, t("\uAC10\uC815\uC758 \uAC15\uB3C4\uB294?", "How intense is the emotion?")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 10 } }, [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement("button", { key: n, onClick: () => setIntensity(n), style: {
      fontSize: 30,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 4,
      opacity: n <= intensity ? 1 : 0.2,
      transform: n <= intensity ? "scale(1.1)" : "scale(1)",
      transition: "all 0.15s"
    } }, "\u2B50"))), /* @__PURE__ */ React.createElement("div", { style: {
      textAlign: "center",
      fontSize: 11,
      color: MC.muted,
      marginTop: 8,
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, [
      "",
      t("\uB9E4\uC6B0 \uC57D\uD558\uAC8C", "Very Mild"),
      t("\uC57D\uD558\uAC8C", "Mild"),
      t("\uBCF4\uD1B5", "Moderate"),
      t("\uAC15\uD558\uAC8C", "Strong"),
      t("\uB9E4\uC6B0 \uAC15\uD558\uAC8C", "Very Strong")
    ][intensity])), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 13,
      fontWeight: 700,
      color: MC.text,
      marginBottom: 8,
      fontFamily: "'Noto Sans KR',sans-serif"
    } }, t("\uD55C \uB9C8\uB514", "A note"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: MC.muted, fontWeight: 400 } }, "(", t("\uC120\uD0DD\uC0AC\uD56D", "optional"), ")")), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: note,
        onChange: (ev) => setNote(ev.target.value),
        placeholder: t("\uC624\uB298 \uC774 \uAC10\uC815\uC774 \uB4E0 \uC774\uC720\uB098 \uBA54\uBAA8\uB97C \uB0A8\uACA8\uC694...", "Leave a note about why you feel this way today..."),
        rows: 3,
        maxLength: 100,
        style: {
          width: "100%",
          padding: "12px 14px",
          border: `1.5px solid ${e.color}60`,
          borderRadius: 12,
          fontSize: 14,
          fontFamily: "'Noto Sans KR',sans-serif",
          outline: "none",
          resize: "none",
          lineHeight: 1.65,
          background: "rgba(255,255,255,0.9)",
          color: MC.text
        },
        onFocus: (ev) => ev.target.style.borderColor = e.color,
        onBlur: (ev) => ev.target.style.borderColor = `${e.color}60`
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 10, color: MC.muted, marginTop: 3 } }, note.length, "/100")), /* @__PURE__ */ React.createElement("button", { onClick: handleSave, disabled: saving, style: {
      ...mbtn(
        saving ? "rgba(0,0,0,0.1)" : `linear-gradient(135deg, ${e.color}, ${e.color}CC)`,
        saving ? MC.muted : "white"
      ),
      padding: "14px",
      fontSize: 15,
      boxShadow: saving ? "none" : `0 4px 16px ${e.color}40`,
      cursor: saving ? "not-allowed" : "pointer"
    } }, saving ? t("\uC800\uC7A5 \uC911...", "Saving...") : t("\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30 \u{1F3A8}", "Log Today's Emotion \u{1F3A8}"))));
  }
  const histMap = Object.fromEntries(history.map((d) => [d.date, d]));
  const recentDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const DOW_KO = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
    const DOW_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    recentDays.push({ iso, dow: t(DOW_KO[d.getDay()], DOW_EN[d.getDay()]), entry: histMap[iso] });
  }
  const todayEmotionData = todayEntry ? MOOD_MAP[todayEntry.emotion] : null;
  const insight = getMoodInsight(history);
  return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: MC.bg, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F3A8}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: MC.text, fontFamily: "'Noto Serif KR',serif" } }, t("\uAC10\uC815 \uC218\uCC44\uD654", "Emotion Watercolor"))), /* @__PURE__ */ React.createElement("button", { onClick: onExit, style: {
    ...mbtn("rgba(0,0,0,0.06)", MC.muted, { borderRadius: 9 }),
    padding: "6px 13px",
    fontSize: 12
  } }, t("\uD5C8\uBE0C\uB85C \u2192", "Hub \u2192"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "20px 16px 32px" } }, todayDone && todayEmotionData ? /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${todayEmotionData.bg}, white)`,
    border: `1px solid ${todayEmotionData.color}40`,
    borderRadius: 20,
    padding: "20px",
    marginBottom: 20,
    boxShadow: `0 4px 20px ${todayEmotionData.color}20`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    fontWeight: 700,
    color: MC.muted,
    marginBottom: 8,
    letterSpacing: "0.5px",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uC624\uB298\uC758 \uAC10\uC815", "Today's Emotion"), " \u2713"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 40 } }, todayEmotionData.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 17,
    fontWeight: 700,
    color: MC.text,
    marginBottom: 3,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, todayEmotionData.label, " \xB7 ", "\u2B50".repeat(todayEntry.intensity || 3)), todayEntry.note && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MC.muted, fontStyle: "italic" } }, '"', todayEntry.note, '"')))) : /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    padding: "22px 20px",
    marginBottom: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.06)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    fontWeight: 700,
    color: MC.muted,
    marginBottom: 6,
    letterSpacing: "0.5px",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uC624\uB298\uC758 \uAC10\uC815", "Today's Emotion")), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 14,
    color: MC.text,
    fontWeight: 500,
    marginBottom: 16,
    lineHeight: 1.7,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uC624\uB298\uC758 \uAC10\uC815\uC744 \uAE30\uB85D\uD574\uBCF4\uC138\uC694.", "Record today's emotion."), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: MC.muted, fontSize: 12 } }, t("\uAC10\uC815\uC744 \uC54C\uC544\uCC28\uB9AC\uB294 \uAC83\uC774 \uCE58\uC720\uC758 \uC2DC\uC791\uC774\uC5D0\uC694.", "Recognizing your emotions is the beginning of healing."))), /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("checkin_emotion"), style: {
    ...mbtn(`linear-gradient(135deg, ${MC.accent}, #5AA888)`),
    width: "100%",
    padding: "13px",
    fontSize: 14,
    boxShadow: `0 4px 16px ${MC.accent}40`
  } }, "\u{1F3A8} ", t("\uC624\uB298\uC758 \uAC10\uC815 \uAE30\uB85D\uD558\uAE30", "Log Today's Emotion"))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: "16px",
    marginBottom: 20,
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.6)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: MC.text, fontFamily: "'Noto Sans KR',sans-serif" } }, "\u{1F4C5} ", t("\uCD5C\uADFC 7\uC77C", "Last 7 Days")), /* @__PURE__ */ React.createElement("button", { onClick: () => setScreen("calendar"), style: {
    background: "none",
    border: "none",
    fontSize: 11,
    color: MC.accent,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, t("\uC804\uCCB4 \uBCF4\uAE30 \u2192", "View All \u2192"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "space-between" } }, recentDays.map(({ iso, dow, entry }) => {
    const e = entry ? MOOD_MAP[entry.emotion] : null;
    const isToday = iso === today;
    return /* @__PURE__ */ React.createElement("div", { key: iso, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: MC.muted, fontWeight: 500 } }, dow), /* @__PURE__ */ React.createElement("div", { style: {
      width: "100%",
      aspectRatio: "1",
      borderRadius: 9,
      background: e ? e.bg : "rgba(0,0,0,0.05)",
      border: isToday ? `2px solid ${MC.accent}` : e ? `1px solid ${e.color}40` : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: e ? 14 : 0,
      transition: "all 0.2s"
    } }, e ? e.emoji : ""));
  }))), insight && /* @__PURE__ */ React.createElement("div", { style: {
    background: `linear-gradient(135deg, ${insight.bg}, rgba(255,255,255,0.9))`,
    border: `1px solid ${insight.color}30`,
    borderRadius: 14,
    padding: "14px 16px"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    fontWeight: 700,
    color: insight.textColor,
    marginBottom: 5,
    letterSpacing: "0.5px",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, insight.emoji, " ", t("\uAC10\uC815 \uC778\uC0AC\uC774\uD2B8", "Emotion Insight")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: MC.text, lineHeight: 1.6, fontFamily: "'Noto Sans KR',sans-serif" } }, insight.msg))));
}
