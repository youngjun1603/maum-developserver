const { useState, useEffect, useRef } = React;
const GREEN = "#2d6a4f", GREEN2 = "#52b788", LGREEN = "#d8f3dc", BG = "#eef6f1";
const INK = "#1a2b22", MUT = "#5a6b62", LINE = "#dbe7e0";
const ACCENT = { psychology: "#2d6a4f", christian: "#3b6fb5" };
const token = () => localStorage.getItem("bubu_token") || "";
async function api(path, method, body) {
  const opt = { method: method || "GET", headers: { Authorization: "Bearer " + token() } };
  if (body) {
    opt.headers["Content-Type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  const r = await fetch("/api" + path, opt);
  let data = {};
  try {
    data = await r.json();
  } catch {
  }
  return { status: r.status, ...data };
}
const loadConfig = () => {
  try {
    return JSON.parse(localStorage.getItem("bubu_config") || "null");
  } catch {
    return null;
  }
};
const saveConfig = (c) => localStorage.setItem("bubu_config", JSON.stringify(c));
const MODES = [
  { key: "receive", emoji: "\u{1F442}", title: "\uC218\uC2E0 \uD1B5\uC5ED", desc: '"\uC800 \uB9D0\uC774 \uBB34\uC2A8 \uB73B\uC774\uC57C?"', placeholder: "\uBC30\uC6B0\uC790\uC5D0\uAC8C\uC11C \uB4E4\uC740 \uB9D0\uC744 \uADF8\uB300\uB85C \uBD99\uC5EC\uB123\uC5B4 \uBCF4\uC138\uC694." },
  { key: "send", emoji: "\u270D\uFE0F", title: "\uBC1C\uC2E0 \uD1B5\uC5ED", desc: '"\uC774\uAC78 \uC5B4\uB5BB\uAC8C \uB9D0\uD558\uC9C0?"', placeholder: "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uD558\uACE0 \uC2F6\uC740 \uB9D0\uC744 \uC801\uC5B4 \uBCF4\uC138\uC694." },
  { key: "mediate", emoji: "\u{1F54A}\uFE0F", title: "\uC911\uC7AC \uD1B5\uC5ED", desc: "\uC2F8\uC6B4 \uB300\uD654 \uC804\uCCB4 \uBD84\uC11D", placeholder: "\uC8FC\uACE0\uBC1B\uC740 \uB300\uD654(\uCE74\uD1A1 \uB4F1)\uB97C \uD1B5\uC9F8\uB85C \uBD99\uC5EC\uB123\uC5B4 \uBCF4\uC138\uC694." },
  { key: "perspective", emoji: "\u{1F504}", title: "\uAD00\uC810 \uD1B5\uC5ED", desc: '"\uC0C1\uB300\uB294 \uC5B4\uB5BB\uAC8C \uB290\uAF08\uC744\uAE4C?"', placeholder: "\uC5B4\uB5A4 \uC0AC\uAC74\uC774\uB098 \uB300\uD654\uB97C \uC801\uC5B4 \uBCF4\uC138\uC694. \uBC30\uC6B0\uC790 \uC785\uC7A5\uC5D0\uC11C \uD1B5\uC5ED\uD574 \uB4DC\uB824\uC694." }
];
const FIELD = {
  surface: "\uD45C\uBA74\uC801\uC73C\uB85C\uB294",
  translation: "\uADF8 \uC544\uB798 \uB9C8\uC74C (\uAC00\uC124)",
  hidden_need: "\uC228\uC5B4 \uC788\uC744 \uC218 \uC788\uB294 \uC694\uCCAD",
  check_question: "\uC774\uB807\uAC8C \uBB3C\uC5B4\uBCF4\uBA74 \uC5B4\uB5A8\uAE4C\uC694",
  micro_action: "\uC624\uB298 \uD574\uBCFC \uC791\uC740 \uD589\uB3D9",
  caution: "\uC774 \uD1B5\uC5ED\uC758 \uD55C\uACC4",
  original_intent: "\uC9C4\uC9DC \uC804\uD558\uACE0 \uC2F6\uC740 \uB9C8\uC74C",
  risk_in_original: "\uC6D0\uB798 \uD45C\uD604\uC774 \uB4E4\uB9B4 \uC218 \uC788\uB294 \uBC29\uC2DD",
  rewritten: "\uC774\uB807\uAC8C \uB9D0\uD574\uBCF4\uC138\uC694",
  alternative: "\uB2E4\uB978 \uD1A4 \uBC84\uC804",
  timing_tip: "\uD0C0\uC774\uBC0D",
  avoid: "\uD53C\uD560 \uD45C\uD604",
  miss_point: "\uC11C\uB85C \uB193\uCE5C \uACB0\uC815\uC801 \uC9C0\uC810",
  cycle: "\uBC18\uBCF5\uB418\uB294 \uD328\uD134",
  next_word: "\uBA3C\uC800 \uAC74\uB12C \uD55C\uB9C8\uB514",
  your_feeling_first: "\uBA3C\uC800, \uB2F9\uC2E0\uC758 \uB9C8\uC74C",
  partner_view: "\uBC30\uC6B0\uC790\uC758 \uB208\uC5D0\uB294",
  partner_feeling: "\uADF8\uB54C \uBC30\uC6B0\uC790\uC758 \uAC10\uC815",
  blind_spot: "\uB193\uCCE4\uC744 \uC218 \uC788\uB294 \uAC83",
  bridge: "\uB450 \uAD00\uC810\uC744 \uC787\uB294 \uB2E4\uB9AC"
};
const REACTIONS = [
  { key: "positive", label: "\uC88B\uC558\uC5B4\uC694 \u{1F60A}" },
  { key: "awkward", label: "\uC5B4\uC0C9\uD588\uC5B4\uC694 \u{1F605}" },
  { key: "cold", label: "\uB0C9\uB2F4\uD588\uC5B4\uC694 \u{1F610}" },
  { key: "conflict", label: "\uC624\uD788\uB824 \uC2F8\uC6E0\uC5B4\uC694 \u{1F61E}" }
];
const ROOMS = [
  { key: "couple", label: "\uBD80\uBD80 \uC774\uC57C\uAE30" },
  { key: "holiday", label: "\uBA85\uC808\xB7\uC591\uAC00" },
  { key: "teen_parent", label: "\uC790\uB140\xB7\uC721\uC544" },
  { key: "caregiving", label: "\uB3CC\uBD04\xB7\uAC04\uBCD1" }
];
function Shell({ children, title, onBack, right }) {
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#fff", boxShadow: "0 0 40px rgba(0,0,0,.04)" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", top: 0, zIndex: 10, background: GREEN, color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", gap: 10 } }, onBack && /* @__PURE__ */ React.createElement("button", { onClick: onBack, style: { background: "rgba(255,255,255,.18)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 9, cursor: "pointer", fontSize: 16 } }, "\u2039"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800, flex: 1 } }, title || "\u{1F4AC} \uB9C8\uC74C\uBD80\uBD80"), right), /* @__PURE__ */ React.createElement("div", { style: { padding: 18, animation: "fadeUp .25s ease" } }, children));
}
function Btn({ children, onClick, disabled, kind, style }) {
  const bg = kind === "ghost" ? "#fff" : disabled ? "#cfe3d6" : GREEN;
  const col = kind === "ghost" ? GREEN : "#fff";
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      disabled,
      style: {
        width: "100%",
        padding: "14px",
        borderRadius: 13,
        border: kind === "ghost" ? `1.5px solid ${LINE}` : "none",
        background: bg,
        color: col,
        fontSize: 15,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        ...style
      }
    },
    children
  );
}
function Card({ children, style }) {
  return /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 18, ...style } }, children);
}
function Onboarding({ onDone }) {
  const [track, setTrack] = useState("psychology");
  const [emotionDepth, setEmotionDepth] = useState(2);
  const [theologyLevel, setTheologyLevel] = useState(2);
  const [pastoralTone, setPastoralTone] = useState("grace");
  const [step, setStep] = useState(0);
  const TrackCard = ({ v, title, desc }) => /* @__PURE__ */ React.createElement("div", { onClick: () => setTrack(v), style: { cursor: "pointer", border: `2px solid ${track === v ? ACCENT[v] : LINE}`, background: track === v ? "#f4faf6" : "#fff", borderRadius: 14, padding: 16, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: track === v ? ACCENT[v] : INK, fontSize: 16 } }, title), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13, marginTop: 4 } }, desc));
  const Slider = ({ label, val, set, marks }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 8 } }, label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, marks.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => set(i + 1), style: {
    flex: 1,
    textAlign: "center",
    cursor: "pointer",
    padding: "10px 4px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    border: `1.5px solid ${val === i + 1 ? GREEN : LINE}`,
    background: val === i + 1 ? LGREEN : "#fff",
    color: val === i + 1 ? GREEN : MUT
  } }, m))));
  return /* @__PURE__ */ React.createElement(Shell, { title: "\uC2DC\uC791\uD558\uAE30" }, step === 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uC5B4\uB5A4 \uC5B8\uC5B4\uB85C \uD1B5\uC5ED\uD560\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, marginBottom: 16 } }, "\uB098\uC5D0\uAC8C \uB9DE\uB294 \uACBD\uB85C\uB97C \uACE0\uB974\uC138\uC694. \uB098\uC911\uC5D0 \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement(TrackCard, { v: "psychology", title: "\u{1F331} \uC2EC\uB9AC\uC0C1\uB2F4 \uD2B8\uB799", desc: "\uC560\uCC29\xB7\uC815\uC11C(EFT) \uAE30\uBC18\uC73C\uB85C \uB9C8\uC74C\uC744 \uD480\uC5B4\uB4DC\uB824\uC694." }), /* @__PURE__ */ React.createElement(TrackCard, { v: "christian", title: "\u271D\uFE0F \uAE30\uB3C5\uAD50 \uD2B8\uB799", desc: "\uBCF5\uC74C\uC758 \uC21C\uC11C(\uACBD\uCCAD\xB7\uC740\uD61C\xB7\uD68C\uBCF5)\uB85C \uC5B8\uC57D\uC801 \uAD00\uC810\uC744 \uB354\uD574\uC694." }), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => setStep(1) }, "\uB2E4\uC74C")), step === 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uAC15\uB3C4\uB97C \uB9DE\uCDB0\uBCFC\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, marginBottom: 16 } }, "\uD3B8\uD55C \uB9CC\uD07C\uB9CC. \uC5B8\uC81C\uB4E0 \uC870\uC808\uB3FC\uC694."), track === "psychology" ? /* @__PURE__ */ React.createElement(Slider, { label: "\uAC10\uC815 \uAE4A\uC774", val: emotionDepth, set: setEmotionDepth, marks: ["\uD45C\uBA74", "\uC911\uAC04", "\uC2EC\uCE35"] }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Slider, { label: "\uC2E0\uD559 \uAC15\uB3C4", val: theologyLevel, set: setTheologyLevel, marks: ["\uD1B5\uD569\uD615", "\uADE0\uD615\uD615", "\uC131\uACBD\uD615"] }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 8 } }, "\uBAA9\uC591 \uD1A4"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } }, [["grace", "\uACBD\uCCAD\xB7\uC740\uD61C\uD615"], ["direct", "\uC81C\uD55C\uC801 \uC9C1\uBA74\uD615"]].map(([k, l]) => /* @__PURE__ */ React.createElement("div", { key: k, onClick: () => setPastoralTone(k), style: {
    flex: 1,
    textAlign: "center",
    cursor: "pointer",
    padding: "10px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    border: `1.5px solid ${pastoralTone === k ? GREEN : LINE}`,
    background: pastoralTone === k ? LGREEN : "#fff",
    color: pastoralTone === k ? GREEN : MUT
  } }, l)))), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => setStep(2) }, "\uB2E4\uC74C"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setStep(0) }, "\uC774\uC804")), step === 2 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /* @__PURE__ */ React.createElement(Card, { style: { background: "#fef9ec", border: "1px solid #fde68a", color: "#78350f", fontSize: 13.5, lineHeight: 1.8 } }, /* @__PURE__ */ React.createElement("b", null, "\uC548\uC804\uC774 \uC6B0\uC120\uC785\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("br", null), "\uC2E0\uCCB4\uC801 \uD3ED\uB825\xB7\uAC15\uC555\uC801 \uD1B5\uC81C\xB7\uC704\uD611\uC774 \uC788\uB294 \uC0C1\uD669\uC774\uB77C\uBA74, \uC774 \uC11C\uBE44\uC2A4\uB294 \uB300\uD654 \uAE30\uC220\uC758 \uBB38\uC81C\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uAE34\uAE09 \uC2DC ", /* @__PURE__ */ React.createElement("b", null, "112"), " \xB7 \uC5EC\uC131\uAE34\uAE09\uC804\uD654 ", /* @__PURE__ */ React.createElement("b", null, "1366"), " \xB7 \uCCAD\uC18C\uB144 ", /* @__PURE__ */ React.createElement("b", null, "1388"), " \xB7 \uB178\uC778\uBCF4\uD638 ", /* @__PURE__ */ React.createElement("b", null, "1577-1389"), ".", /* @__PURE__ */ React.createElement("br", null), "\uB9C8\uC74C\uBD80\uBD80\uB294 \uC758\uB8CC\xB7\uC0C1\uB2F4\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uB294 ", /* @__PURE__ */ React.createElement("b", null, "\uD1B5\uC5ED \uB3C4\uAD6C"), "\uC774\uBA70, \uBAA8\uB4E0 \uD1B5\uC5ED\uC740 \uB2E8\uC815\uC774 \uC544\uB2CC ", /* @__PURE__ */ React.createElement("b", null, "\uAC00\uC124"), "\uB85C \uC81C\uC548\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { height: 14 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => {
    saveConfig({ track, emotionDepth, theologyLevel, pastoralTone });
    onDone();
  } }, "\uB3D9\uC758\uD558\uACE0 \uC2DC\uC791\uD558\uAE30")));
}
function Home({ config, onMode, onCommunity, onMemory, onSettings }) {
  return /* @__PURE__ */ React.createElement(Shell, { right: /* @__PURE__ */ React.createElement("button", { onClick: onSettings, style: { background: "rgba(255,255,255,.18)", border: "none", color: "#fff", padding: "6px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13 } }, "\uC124\uC815") }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: MUT, marginBottom: 4 } }, config.track === "christian" ? "\u271D\uFE0F \uAE30\uB3C5\uAD50 \uD2B8\uB799" : "\u{1F331} \uC2EC\uB9AC\uC0C1\uB2F4 \uD2B8\uB799"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, marginBottom: 16 } }, "\uBB34\uC5C7\uC744 \uD1B5\uC5ED\uD574 \uB4DC\uB9B4\uAE4C\uC694?"), MODES.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.key, onClick: () => onMode(m), style: { cursor: "pointer", border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30 } }, m.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17 } }, m.title), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13, marginTop: 2 } }, m.desc)), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 20 } }, "\u203A"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onMemory }, "\u{1F9E0} \uAD00\uACC4 \uAE30\uC5B5"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onCommunity }, "\u{1F4AC} \uCEE4\uBBA4\uB2C8\uD2F0")));
}
function ResultBlock({ result }) {
  const entries = Object.keys(result).filter((k) => k !== "improvement");
  const renderVal = (v) => {
    if (v && typeof v === "object") {
      return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7 } }, v.said && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\uB9D0\uD55C \uAC83"), " \xB7 ", v.said), v.underneath && /* @__PURE__ */ React.createElement("div", { style: { color: MUT, marginTop: 3 } }, /* @__PURE__ */ React.createElement("b", null, "\uADF8 \uC544\uB798"), " \xB7 ", v.underneath));
    }
    return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.75 } }, v);
  };
  return /* @__PURE__ */ React.createElement("div", null, entries.map((k) => /* @__PURE__ */ React.createElement(Card, { key: k, style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 } }, FIELD[k] || (k === "person_a" ? "\uD55C \uC0AC\uB78C" : k === "person_b" ? "\uB2E4\uB978 \uC0AC\uB78C" : k)), renderVal(result[k]))));
}
function Improvement({ imp, relationId, track }) {
  const [sent, setSent] = useState(false);
  const [reframe, setReframe] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!imp) return null;
  const send = async (status, reaction) => {
    if (busy) return;
    setBusy(true);
    const r = await api("/feedback", "POST", { relationId, track, feedback: { activity: imp.action, status, reaction } });
    setBusy(false);
    setSent(true);
    if (r.ok && r.result) setReframe(r.result);
  };
  return /* @__PURE__ */ React.createElement(Card, { style: { background: "#f4faf6", border: `1.5px solid ${GREEN2}`, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: GREEN } }, "\u{1F331} \uC624\uB298 \uD574\uBCFC \uC791\uC740 \uD589\uB3D9"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, margin: "8px 0" } }, imp.action), imp.why_this && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: MUT, lineHeight: 1.6 } }, imp.why_this), imp.expect && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "#8a7a3a", marginTop: 8, background: "#fef9ec", borderRadius: 8, padding: "8px 10px" } }, "\u{1F4A1} ", imp.expect), imp.checkin && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: MUT, marginTop: 8 } }, "\uD655\uC778 \uC9C8\uBB38 \xB7 ", imp.checkin), !sent ? /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, borderTop: `1px dashed ${LINE}`, paddingTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 8 } }, "\uD574\uBCF4\uC168\uB098\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => send("done"), disabled: busy, style: { fontSize: 13, padding: 10 } }, "\uD574\uBD24\uC5B4\uC694"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => send("partial"), disabled: busy, style: { fontSize: 13, padding: 10 } }, "\uD558\uB2E4 \uB9D0\uC558\uC5B4\uC694"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => send("not_done"), disabled: busy, style: { fontSize: 13, padding: 10 } }, "\uBABB \uD588\uC5B4\uC694")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MUT, marginBottom: 6 } }, "\uC0C1\uB300 \uBC18\uC751 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, REACTIONS.map((r) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: r.key,
      onClick: () => send("done", r.key),
      disabled: busy,
      style: { border: `1px solid ${LINE}`, background: "#fff", borderRadius: 20, padding: "7px 12px", fontSize: 12.5, cursor: "pointer" }
    },
    r.label
  )))) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, borderTop: `1px dashed ${LINE}`, paddingTop: 12 } }, reframe ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.75 } }, /* @__PURE__ */ React.createElement("div", null, reframe.response), reframe.reframe && /* @__PURE__ */ React.createElement("div", { style: { color: MUT, marginTop: 8 } }, reframe.reframe), reframe.next_suggestion && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, color: GREEN } }, "\uB2E4\uC74C\uC5D4 \xB7 ", reframe.next_suggestion)) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: MUT } }, "\uAE30\uB85D\uD588\uC5B4\uC694. \uC528\uC557\uC740 \uC2EC\uACBC\uC5B4\uC694 \u{1F331}")));
}
function ModeView({ mode, config, relationId, onBack }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    setErr("");
    setResult(null);
    const r = await api("/translate", "POST", {
      relationId,
      track: config.track,
      mode: mode.key,
      input: input.trim(),
      emotionDepth: config.emotionDepth,
      theologyLevel: config.theologyLevel,
      pastoralTone: config.pastoralTone
    });
    setBusy(false);
    if (r.status === 402) {
      setErr("\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD574\uC694. \uB9C8\uC74C\uD480\uC5D0\uC11C \uAD6C\uB9E4 \uD6C4 \uC774\uC6A9\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (!r.ok || !r.result) {
      setErr(r.error || "\uD1B5\uC5ED\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    setResult(r.result);
  };
  return /* @__PURE__ */ React.createElement(Shell, { title: `${mode.emoji} ${mode.title}`, onBack }, !result && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, marginBottom: 10 } }, mode.placeholder), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      placeholder: "\uC5EC\uAE30\uC5D0 \uC785\uB825\uD558\uC138\uC694",
      style: { width: "100%", minHeight: 140, border: `1.5px solid ${LINE}`, borderRadius: 13, padding: 14, fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none" }
    }
  ), err && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, margin: "8px 0" } }, err), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: run, disabled: busy || !input.trim() }, busy ? "\uD1B5\uC5ED \uC911\u2026" : "\uD1B5\uC5ED\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MUT, textAlign: "center", marginTop: 8 } }, mode.key === "mediate" || mode.key === "perspective" ? "3 \uD06C\uB808\uB527" : "2 \uD06C\uB808\uB527", " \uC0AC\uC6A9")), result && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ResultBlock, { result }), /* @__PURE__ */ React.createElement(Improvement, { imp: result.improvement, relationId, track: config.track }), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => {
    setResult(null);
    setInput("");
  } }, "\uB2E4\uC2DC \uD1B5\uC5ED\uD558\uAE30")));
}
function Community({ onBack }) {
  const [room, setRoom] = useState("couple");
  const [posts, setPosts] = useState(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [writing, setWriting] = useState(false);
  const load = async (rm) => {
    setPosts(null);
    const r = await api(`/community/posts?room=${rm}&limit=30`);
    setPosts(r.ok ? r.posts || [] : []);
  };
  useEffect(() => {
    load(room);
  }, [room]);
  const submit = async () => {
    if (!content.trim() || busy) return;
    setBusy(true);
    setBlocked(null);
    const r = await api("/community/post", "POST", { room, content: content.trim() });
    setBusy(false);
    if (r.ok) {
      setContent("");
      setWriting(false);
      load(room);
      return;
    }
    if (r.blocked) {
      setBlocked(r);
      return;
    }
  };
  return /* @__PURE__ */ React.createElement(Shell, { title: "\u{1F4AC} \uCEE4\uBBA4\uB2C8\uD2F0", onBack, right: /* @__PURE__ */ React.createElement("button", { onClick: () => setWriting((w) => !w), style: { background: "rgba(255,255,255,.18)", border: "none", color: "#fff", padding: "6px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13 } }, writing ? "\uB2EB\uAE30" : "\uAE00\uC4F0\uAE30") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } }, ROOMS.map((r) => /* @__PURE__ */ React.createElement("button", { key: r.key, onClick: () => setRoom(r.key), style: { border: `1px solid ${room === r.key ? GREEN : LINE}`, background: room === r.key ? LGREEN : "#fff", color: room === r.key ? GREEN : MUT, borderRadius: 20, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, r.label))), writing && /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: content,
      onChange: (e) => setContent(e.target.value),
      placeholder: "\uC0C1\uD669 \u2192 \uC2DC\uB3C4\uD55C \uAC83 \u2192 \uACB0\uACFC. \uC775\uBA85\uC73C\uB85C \uACF5\uC720\uB3FC\uC694. (\uD2B9\uC815\uC778 \uC2DD\uBCC4 \uC815\uBCF4\uB294 \uBE7C\uC8FC\uC138\uC694)",
      style: { width: "100%", minHeight: 100, border: `1.5px solid ${LINE}`, borderRadius: 11, padding: 12, fontSize: 14, resize: "vertical", outline: "none" }
    }
  ), blocked && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, background: blocked.crisis_support ? "#fff4ee" : "#fef9ec", border: `1px solid ${blocked.crisis_support ? "#f5c6a5" : "#fde68a"}`, borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.7, color: "#78350f" } }, blocked.message, blocked.suggested_fix && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, color: GREEN } }, "\uC218\uC815 \uC81C\uC548 \xB7 ", blocked.suggested_fix), blocked.crisis_support && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6 } }, "\uAE34\uAE09 \uC2DC 112 \xB7 1366 \xB7 1388")), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: submit, disabled: busy || !content.trim() }, busy ? "\uAC80\uD1A0 \uC911\u2026" : "\uAC8C\uC2DC\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: MUT, textAlign: "center", marginTop: 6 } }, "\uAC8C\uC2DC \uC804 AI\uAC00 \uBA3C\uC800 \uAC80\uD1A0\uD574\uC694 (\uD2B9\uC815\uC778 \uC2DD\uBCC4\xB7\uC695\uC124 \uB4F1)")), posts === null ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026") : posts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uC544\uC9C1 \uAE00\uC774 \uC5C6\uC5B4\uC694. \uCCAB \uC774\uC57C\uAE30\uB97C \uB098\uB220\uBCF4\uC138\uC694.") : posts.map((p) => /* @__PURE__ */ React.createElement(Card, { key: p.id, style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" } }, p.content), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MUT, marginTop: 8 } }, "\u{1F90D} ", p.empathy_count || 0, " \xB7 ", (p.created_at || "").slice(0, 10)))));
}
function Memory({ relationId, onBack }) {
  const [mem, setMem] = useState(void 0);
  useEffect(() => {
    (async () => {
      const r = await api(`/memory?relationId=${relationId}`);
      setMem(r.ok ? r.memory : null);
    })();
  }, []);
  const Row = ({ label, children }) => /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 } }, label), children);
  return /* @__PURE__ */ React.createElement(Shell, { title: "\u{1F9E0} \uAD00\uACC4 \uAE30\uC5B5", onBack }, mem === void 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026") : !mem ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uC544\uC9C1 \uC313\uC778 \uAE30\uC5B5\uC774 \uC5C6\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uD1B5\uC5ED\uC744 \uC774\uC5B4\uAC08\uC218\uB85D \uC774 \uBD80\uBD80\uC5D0 \uB9DE\uB294 \uD1B5\uC5ED\uC774 \uB429\uB2C8\uB2E4.") : /* @__PURE__ */ React.createElement(React.Fragment, null, mem.recurringTopics?.length > 0 && /* @__PURE__ */ React.createElement(Row, { label: "\uBC18\uBCF5\uB418\uB294 \uC8FC\uC81C" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, mem.recurringTopics.map((t, i) => /* @__PURE__ */ React.createElement("span", { key: i, style: { background: LGREEN, color: GREEN, borderRadius: 16, padding: "5px 11px", fontSize: 13, fontWeight: 700 } }, t)))), mem.successPatterns?.length > 0 && /* @__PURE__ */ React.createElement(Row, { label: "\uC774 \uBD80\uBD80\uC5D0\uAC8C \uD1B5\uD588\uB358 \uAC83" }, mem.successPatterns.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 14, lineHeight: 1.6, marginBottom: 4 } }, "\xB7 ", s))), mem.psychologyProfile && /* @__PURE__ */ React.createElement(Row, { label: "\uC0C1\uD638\uC791\uC6A9 \uD328\uD134" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7 } }, mem.psychologyProfile)), mem.christianProfile && /* @__PURE__ */ React.createElement(Row, { label: "\uB9C8\uC74C\uC758 \uD328\uD134" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7 } }, mem.christianProfile)), mem.partnerPerspective && /* @__PURE__ */ React.createElement(Row, { label: "\uBC30\uC6B0\uC790\uC758 \uC778\uC2DD \uC2B5\uAD00" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7 } }, mem.partnerPerspective))));
}
function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [relationId, setRelationId] = useState(null);
  const [config, setConfig] = useState(loadConfig());
  const [view, setView] = useState("home");
  const [mode, setMode] = useState(null);
  useEffect(() => {
    (async () => {
      if (!token()) {
        setAuthed(false);
        setReady(true);
        return;
      }
      const r = await api("/relation", "POST", {});
      if (r.status === 401) {
        setAuthed(false);
        setReady(true);
        return;
      }
      if (r.ok) setRelationId(r.relationId);
      setReady(true);
    })();
  }, []);
  if (!ready) return /* @__PURE__ */ React.createElement(Shell, null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: MUT, padding: 50 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026"));
  if (!authed) return /* @__PURE__ */ React.createElement(Shell, null, /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", marginTop: 40 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40 } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, margin: "10px 0" } }, "\uB9C8\uC74C\uBD80\uBD80"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, lineHeight: 1.7 } }, "\uB9C8\uC74C\uD480\uC5D0 \uB85C\uADF8\uC778\uD55C \uB4A4,", /* @__PURE__ */ React.createElement("br", null), "\uBA54\uB274\uC758 ", /* @__PURE__ */ React.createElement("b", null, "\u{1F4AC} \uB9C8\uC74C\uBD80\uBD80"), "\uB85C \uB4E4\uC5B4\uC640 \uC8FC\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { height: 16 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => window.open("https://maumful.com", "_blank") }, "\uB9C8\uC74C\uD480\uB85C \uAC00\uAE30")));
  if (!config) return /* @__PURE__ */ React.createElement(Onboarding, { onDone: () => setConfig(loadConfig()) });
  if (view === "mode" && mode) return /* @__PURE__ */ React.createElement(ModeView, { mode, config, relationId, onBack: () => setView("home") });
  if (view === "community") return /* @__PURE__ */ React.createElement(Community, { onBack: () => setView("home") });
  if (view === "memory") return /* @__PURE__ */ React.createElement(Memory, { relationId, onBack: () => setView("home") });
  return /* @__PURE__ */ React.createElement(
    Home,
    {
      config,
      onMode: (m) => {
        setMode(m);
        setView("mode");
      },
      onCommunity: () => setView("community"),
      onMemory: () => setView("memory"),
      onSettings: () => {
        localStorage.removeItem("bubu_config");
        setConfig(null);
      }
    }
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
