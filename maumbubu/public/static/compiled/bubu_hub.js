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
  { key: "receive", emoji: "\u{1F442}", title: "\uC218\uC2E0 \uD1B5\uC5ED", desc: '"\uC800 \uB9D0\uC774 \uBB34\uC2A8 \uB73B\uC774\uC57C?"', ex: "\uBC30\uC6B0\uC790\uAC00 \uD55C \uB9D0\uC758 \uC18D\uB73B\uC774 \uAD81\uAE08\uD560 \uB54C", placeholder: "\uBC30\uC6B0\uC790\uC5D0\uAC8C\uC11C \uB4E4\uC740 \uB9D0\uC744 \uADF8\uB300\uB85C \uBD99\uC5EC\uB123\uC5B4 \uBCF4\uC138\uC694." },
  { key: "send", emoji: "\u270D\uFE0F", title: "\uBC1C\uC2E0 \uD1B5\uC5ED", desc: '"\uC774\uAC78 \uC5B4\uB5BB\uAC8C \uB9D0\uD558\uC9C0?"', ex: "\uC2F8\uC6B0\uC9C0 \uC54A\uAC8C \uBD80\uB4DC\uB7FD\uAC8C \uB9D0\uD558\uACE0 \uC2F6\uC744 \uB54C", placeholder: "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uD558\uACE0 \uC2F6\uC740 \uB9D0\uC744 \uC801\uC5B4 \uBCF4\uC138\uC694." },
  { key: "mediate", emoji: "\u{1F54A}\uFE0F", title: "\uC911\uC7AC \uD1B5\uC5ED", desc: "\uC2F8\uC6B4 \uB300\uD654 \uC804\uCCB4\uB97C \uBD84\uC11D", ex: "\uB2E4\uD230 \uB300\uD654\uB97C \uD1B5\uC9F8\uB85C \uC9DA\uC5B4\uBCF4\uACE0 \uC2F6\uC744 \uB54C", placeholder: "\uC8FC\uACE0\uBC1B\uC740 \uB300\uD654(\uCE74\uD1A1 \uB4F1)\uB97C \uD1B5\uC9F8\uB85C \uBD99\uC5EC\uB123\uC5B4 \uBCF4\uC138\uC694." },
  { key: "perspective", emoji: "\u{1F504}", title: "\uAD00\uC810 \uD1B5\uC5ED", desc: '"\uC0C1\uB300\uB294 \uC5B4\uB5BB\uAC8C \uB290\uAF08\uC744\uAE4C?"', ex: "\uC0C1\uB300 \uC785\uC7A5\uC774 \uB3C4\uBB34\uC9C0 \uC774\uD574 \uC548 \uB420 \uB54C", placeholder: "\uC5B4\uB5A4 \uC0AC\uAC74\uC774\uB098 \uB300\uD654\uB97C \uC801\uC5B4 \uBCF4\uC138\uC694. \uBC30\uC6B0\uC790 \uC785\uC7A5\uC5D0\uC11C \uD1B5\uC5ED\uD574 \uB4DC\uB824\uC694." }
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
const EXPR_LABEL = { happy: "\uC6C3\uC74C", neutral: "\uBB34\uD45C\uC815", sad: "\uC2DC\uBB34\uB8E9\xB7\uC2AC\uD514", angry: "\uD654\uB0A8\xB7\uCC21\uADF8\uB9BC", surprised: "\uB180\uB78C", fearful: "\uAE34\uC7A5\xB7\uBD88\uC548", disgusted: "\uBD88\uCF8C" };
let _faceApi = null;
function loadFaceApi() {
  if (_faceApi) return _faceApi;
  _faceApi = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    s.onload = async () => {
      try {
        const M = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(M);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(M);
        resolve(window.faceapi);
      } catch (e) {
        reject(e);
      }
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _faceApi;
}
function exprSummary(counts) {
  const ent = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ent.length) return "";
  return "\uD45C\uC815\uC740 \uC8FC\uB85C " + ent.slice(0, 2).map(([k]) => EXPR_LABEL[k] || k).join(", ") + "\uC73C\uB85C \uB098\uD0C0\uB0AC\uC5B4\uC694";
}
function toneSummary(vol) {
  if (!vol.n) return "";
  const avg = vol.sum / vol.n;
  const level = avg > 0.14 ? "\uC804\uBC18\uC801\uC73C\uB85C \uD070 \uD3B8" : avg > 0.06 ? "\uBCF4\uD1B5" : "\uCC28\uBD84\uD55C \uD3B8";
  const spikes = vol.spikes > 2 ? `, \uBAA9\uC18C\uB9AC\uAC00 \uD06C\uAC8C \uB192\uC544\uC9C4 \uC21C\uAC04\uC774 ${vol.spikes}\uD68C` : "";
  return `\uB9D0\uD560 \uB54C \uC74C\uB7C9\uC740 ${level}${spikes}\uC774\uC5C8\uC5B4\uC694`;
}
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
  const TrackCard = ({ v, title, desc, tag }) => /* @__PURE__ */ React.createElement("div", { onClick: () => setTrack(v), style: { cursor: "pointer", border: `2px solid ${track === v ? ACCENT[v] : LINE}`, background: track === v ? "#f4faf6" : "#fff", borderRadius: 14, padding: 16, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, color: track === v ? ACCENT[v] : INK, fontSize: 16 } }, title), tag && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#fff", background: GREEN2, borderRadius: 10, padding: "2px 8px" } }, tag)), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13, marginTop: 5, lineHeight: 1.6 } }, desc));
  const Slider = ({ label, help, val, set, marks, descs, hint }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, label), help && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: MUT, margin: "3px 0 8px" } }, help), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, marks.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => set(i + 1), style: {
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
  } }, m))), descs && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: INK, marginTop: 8, lineHeight: 1.6, background: "#f6faf8", border: `1px solid ${LINE}`, borderRadius: 9, padding: "9px 11px" } }, descs[val - 1]), hint && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: GREEN, marginTop: 6 } }, "\u{1F4A1} ", hint));
  return /* @__PURE__ */ React.createElement(Shell, { title: "\uC2DC\uC791\uD558\uAE30" }, step === 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uC5B4\uB5A4 \uC5B8\uC5B4\uB85C \uD1B5\uC5ED\uD560\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, marginBottom: 16 } }, "\uB098\uC5D0\uAC8C \uB9DE\uB294 \uACBD\uB85C\uB97C \uACE0\uB974\uC138\uC694. \uC124\uC815\uC5D0\uC11C \uC5B8\uC81C\uB4E0 \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement(TrackCard, { v: "psychology", title: "\u{1F331} \uC2EC\uB9AC\uC0C1\uB2F4 \uD2B8\uB799", tag: "\uCC98\uC74C\uC774\uB77C\uBA74 \uCD94\uCC9C", desc: "\uC2E0\uC559\uACFC \uBB34\uAD00\uD558\uAC8C, \uAC80\uC99D\uB41C \uC2EC\uB9AC\uD559(\uC560\uCC29\xB7\uC815\uC11C)\uC73C\uB85C \uB9C8\uC74C\uC744 \uD480\uC5B4\uB4DC\uB824\uC694." }), /* @__PURE__ */ React.createElement(TrackCard, { v: "christian", title: "\u271D\uFE0F \uAE30\uB3C5\uAD50 \uD2B8\uB799", desc: "\uC2E0\uC559 \uC548\uC5D0\uC11C, \uC131\uACBD\uC801 \uAD00\uC810(\uC740\uD61C\xB7\uC5B8\uC57D\xB7\uD68C\uBCF5)\uC73C\uB85C \uD1B5\uC5ED\uD574\uC694. \uD06C\uB9AC\uC2A4\uCC9C \uBD80\uBD80\uC5D0\uAC8C \uB9DE\uC544\uC694." }), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => setStep(1) }, "\uB2E4\uC74C")), step === 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uAC15\uB3C4\uB97C \uB9DE\uCDB0\uBCFC\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, marginBottom: 16 } }, "\uD3B8\uD55C \uB9CC\uD07C\uB9CC. \uC5B8\uC81C\uB4E0 \uC870\uC808\uB3FC\uC694."), track === "psychology" ? /* @__PURE__ */ React.createElement(
    Slider,
    {
      label: "\uAC10\uC815 \uAE4A\uC774",
      help: "\uB9C8\uC74C\uC744 \uC5BC\uB9C8\uB098 \uAE4A\uC774 \uB4E4\uC5EC\uB2E4\uBCFC\uAE4C\uC694?",
      val: emotionDepth,
      set: setEmotionDepth,
      marks: ["\uD45C\uBA74", "\uC911\uAC04", "\uC2EC\uCE35"],
      descs: ["\uD654\uB0A8\xB7\uC11C\uC6B4\uD568\uCC98\uB7FC \uAC89\uC73C\uB85C \uB4DC\uB7EC\uB09C \uAC10\uC815\uAE4C\uC9C0\uB9CC \uC9DA\uC5B4\uC694.", "\uADF8 \uC544\uB798 \uB450\uB824\uC6C0\xB7\uC678\uB85C\uC6C0 \uAC19\uC740 \uC9C4\uC9DC \uAC10\uC815\uAE4C\uC9C0 \uD1B5\uC5ED\uD574\uC694.", "\uC560\uCC29 \uC695\uAD6C\uC640 \uB450 \uC0AC\uB78C\uC758 \uBC18\uBCF5\uB418\uB294 \uC545\uC21C\uD658 \uACE0\uB9AC\uAE4C\uC9C0 \uAE4A\uC774 \uBD10\uC694."],
      hint: "\uC798 \uBAA8\uB974\uACA0\uC73C\uBA74 '\uC911\uAC04'\uC744 \uCD94\uCC9C\uD574\uC694."
    }
  ) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Slider,
    {
      label: "\uC2E0\uD559 \uAC15\uB3C4",
      help: "\uC2EC\uB9AC\uD559 \uC5B8\uC5B4\uB97C \uC5BC\uB9C8\uB098 \uC11E\uC744\uAE4C\uC694?",
      val: theologyLevel,
      set: setTheologyLevel,
      marks: ["\uD1B5\uD569\uD615", "\uADE0\uD615\uD615", "\uC131\uACBD\uD615"],
      descs: ["\uC2EC\uB9AC \uC5B8\uC5B4(\uAC10\uC815\xB7\uC560\uCC29)\uC640 \uC131\uACBD \uAD00\uC810\uC744 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uD568\uAED8 \uC368\uC694.", "\uC131\uACBD \uAD00\uC810\uC744 \uC911\uC2EC\uC5D0 \uB450\uACE0, \uAC10\uC815 \uC124\uBA85\uC740 \uC2EC\uB9AC \uC5B8\uC5B4\uB97C \uBCF4\uC870\uB85C \uC368\uC694.", "\uC131\uACBD \uC5B8\uC5B4(\uB9C8\uC74C\xB7\uC5B8\uC57D\xB7\uC740\uD61C\xB7\uD68C\uAC1C)\uB85C\uB9CC \uD1B5\uC5ED\uD574\uC694."],
      hint: "\uC798 \uBAA8\uB974\uACA0\uC73C\uBA74 '\uD1B5\uD569\uD615'\uC744 \uCD94\uCC9C\uD574\uC694."
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, "\uBAA9\uC591 \uD1A4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: MUT, margin: "3px 0 8px" } }, "\uC5B4\uB5A4 \uACB0\uB85C \uB9D0\uD574\uB4DC\uB9B4\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [["grace", "\uACBD\uCCAD\xB7\uC740\uD61C\uD615"], ["direct", "\uC81C\uD55C\uC801 \uC9C1\uBA74\uD615"]].map(([k, l]) => /* @__PURE__ */ React.createElement("div", { key: k, onClick: () => setPastoralTone(k), style: {
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
  } }, l))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: INK, marginTop: 8, lineHeight: 1.6, background: "#f6faf8", border: `1px solid ${LINE}`, borderRadius: 9, padding: "9px 11px" } }, pastoralTone === "grace" ? "\uBA3C\uC800 \uCDA9\uBD84\uD788 \uB4E3\uACE0 \uC774\uD574\uD55C \uB4A4, \uC740\uD61C \uC548\uC5D0\uC11C \uBD80\uB4DC\uB7FD\uAC8C \uC9DA\uC5B4\uB4DC\uB824\uC694." : "\uB354 \uC9C1\uC811\uC801\uC778 \uAD8C\uBA74\uC744 \uC6D0\uD560 \uB54C\uB9CC. \uADF8\uB798\uB3C4 \uC790\uCC45\xB7\uC218\uCE58\uB97C \uAC15\uD654\uD558\uC9C4 \uC54A\uC544\uC694."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: GREEN, marginTop: 6 } }, "\u{1F4A1} \uB300\uBD80\uBD84 '\uACBD\uCCAD\xB7\uC740\uD61C\uD615'\uC744 \uCD94\uCC9C\uD574\uC694.")), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => setStep(2) }, "\uB2E4\uC74C"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setStep(0) }, "\uC774\uC804")), step === 2 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginBottom: 6 } }, "\uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /* @__PURE__ */ React.createElement(Card, { style: { background: "#fef9ec", border: "1px solid #fde68a", color: "#78350f", fontSize: 13.5, lineHeight: 1.8 } }, /* @__PURE__ */ React.createElement("b", null, "\uC548\uC804\uC774 \uC6B0\uC120\uC785\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("br", null), "\uC2E0\uCCB4\uC801 \uD3ED\uB825\xB7\uAC15\uC555\uC801 \uD1B5\uC81C\xB7\uC704\uD611\uC774 \uC788\uB294 \uC0C1\uD669\uC774\uB77C\uBA74, \uC774 \uC11C\uBE44\uC2A4\uB294 \uB300\uD654 \uAE30\uC220\uC758 \uBB38\uC81C\uB85C \uB2E4\uB8E8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uAE34\uAE09 \uC2DC ", /* @__PURE__ */ React.createElement("b", null, "112"), " \xB7 \uC5EC\uC131\uAE34\uAE09\uC804\uD654 ", /* @__PURE__ */ React.createElement("b", null, "1366"), " \xB7 \uCCAD\uC18C\uB144 ", /* @__PURE__ */ React.createElement("b", null, "1388"), " \xB7 \uB178\uC778\uBCF4\uD638 ", /* @__PURE__ */ React.createElement("b", null, "1577-1389"), " \xB7 \uC790\uC0B4\uC608\uBC29 \uC0C1\uB2F4 ", /* @__PURE__ */ React.createElement("b", null, "109"), "(24\uC2DC\uAC04).", /* @__PURE__ */ React.createElement("br", null), "\uB9C8\uC74C\uBD80\uBD80\uB294 \uC758\uB8CC\xB7\uC0C1\uB2F4\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uB294 ", /* @__PURE__ */ React.createElement("b", null, "\uD1B5\uC5ED \uB3C4\uAD6C"), "\uC774\uBA70, \uBAA8\uB4E0 \uD1B5\uC5ED\uC740 \uB2E8\uC815\uC774 \uC544\uB2CC ", /* @__PURE__ */ React.createElement("b", null, "\uAC00\uC124"), "\uB85C \uC81C\uC548\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { height: 14 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => {
    saveConfig({ track, emotionDepth, theologyLevel, pastoralTone });
    onDone();
  } }, "\uB3D9\uC758\uD558\uACE0 \uC2DC\uC791\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setStep(1) }, "\u2039 \uC774\uC804")));
}
function Home({ config, onMode, onCommunity, onMemory, onSettings, onMultimodal, onInbox, inboxCount }) {
  const [ask, setAsk] = useState(false);
  const depthLabel = ["\uD45C\uBA74", "\uC911\uAC04", "\uC2EC\uCE35"][(config.emotionDepth || 2) - 1];
  const theoLabel = ["\uD1B5\uD569\uD615", "\uADE0\uD615\uD615", "\uC131\uACBD\uD615"][(config.theologyLevel || 2) - 1];
  const toneLabel = config.pastoralTone === "direct" ? "\uC81C\uD55C\uC801 \uC9C1\uBA74\uD615" : "\uACBD\uCCAD\xB7\uC740\uD61C\uD615";
  return /* @__PURE__ */ React.createElement(Shell, { right: /* @__PURE__ */ React.createElement("button", { onClick: () => setAsk(true), style: { background: "rgba(255,255,255,.18)", border: "none", color: "#fff", padding: "6px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13 } }, "\u2699\uFE0F \uC124\uC815") }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: MUT, marginBottom: 4 } }, config.track === "christian" ? "\u271D\uFE0F \uAE30\uB3C5\uAD50 \uD2B8\uB799" : "\u{1F331} \uC2EC\uB9AC\uC0C1\uB2F4 \uD2B8\uB799"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, marginBottom: 4 } }, "\uBB34\uC5C7\uC744 \uD1B5\uC5ED\uD574 \uB4DC\uB9B4\uAE4C\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13, marginBottom: 16 } }, '\uC0C1\uD669\uC5D0 \uB9DE\uB294 \uAC78 \uACE0\uB974\uC138\uC694. \uC544\uB798 "\uC774\uB7F4 \uB54C"\uB97C \uCC38\uACE0\uD558\uBA74 \uC26C\uC6CC\uC694.'), MODES.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.key, onClick: () => onMode(m), style: { cursor: "pointer", border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30 } }, m.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17 } }, m.title), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13, marginTop: 2 } }, m.desc), /* @__PURE__ */ React.createElement("div", { style: { color: GREEN, fontSize: 12, marginTop: 4 } }, "\uC774\uB7F4 \uB54C \xB7 ", m.ex)), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 20 } }, "\u203A"))), /* @__PURE__ */ React.createElement("div", { onClick: onMultimodal, style: { cursor: "pointer", border: `1px dashed ${GREEN2}`, background: "#f4faf6", borderRadius: 16, padding: 14, marginTop: 8, display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26 } }, "\u{1F3A5}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, "\uD568\uAED8 \uBD84\uC11D ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#fff", background: GREEN2, borderRadius: 10, padding: "1px 7px" } }, "\uBC30\uC6B0\uC790 \uB3D9\uC758")), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 12.5, marginTop: 2 } }, "\uB3D9\uC758 \uD6C4 \uB300\uD654\uB97C \uB179\uD654(\uC601\uC0C1) \uB610\uB294 \uB179\uC74C(\uC74C\uC131)\uC73C\uB85C \uBD84\uC11D (\uD45C\uC815\xB7\uC5B4\uC870, \uC6D0\uBCF8\uC740 \uAE30\uAE30 \uC548\uC5D0\uC11C\uB9CC)")), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 20 } }, "\u203A")), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onInbox, style: { marginTop: 10, position: "relative" } }, "\u{1F4EC} \uC218\uC2E0\uD568 \xB7 \uBC30\uC6B0\uC790 \uC5F0\uACB0", inboxCount > 0 && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 11, fontWeight: 800, color: "#fff", background: GREEN2, borderRadius: 10, padding: "1px 7px" } }, inboxCount)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 10 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onMemory }, "\u{1F9E0} \uAD00\uACC4 \uAE30\uC5B5"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onCommunity }, "\u{1F4AC} \uCEE4\uBBA4\uB2C8\uD2F0")), ask && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
      onClick: (e) => {
        if (e.target === e.currentTarget) setAsk(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 18, maxWidth: 400, width: "100%", padding: 22, animation: "fadeUp .2s ease" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800, marginBottom: 8 } }, "\u2699\uFE0F \uD1B5\uC5ED \uC124\uC815\uC774\uB780?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: MUT, lineHeight: 1.75, marginBottom: 14 } }, "\uD1B5\uC5ED\uC5D0 \uC4F0\uB294 ", /* @__PURE__ */ React.createElement("b", { style: { color: INK } }, "\uD2B8\uB799(\uC2EC\uB9AC\uC0C1\uB2F4/\uAE30\uB3C5\uAD50)\uACFC \uAC15\uB3C4"), " \uC124\uC815\uC774\uC5D0\uC694. \uC9C0\uAE08 \uB300\uD654\uB97C ", /* @__PURE__ */ React.createElement("b", { style: { color: INK } }, "\uC5B4\uB5A4 \uC5B8\uC5B4\uC640 \uAE4A\uC774"), "\uB85C \uD1B5\uC5ED\uD560\uC9C0 \uC815\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(Card, { style: { background: "#f6faf8", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 } }, "\uC9C0\uAE08 \uB0B4 \uC124\uC815"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, lineHeight: 1.9 } }, /* @__PURE__ */ React.createElement("div", null, "\xB7 \uD2B8\uB799: ", /* @__PURE__ */ React.createElement("b", null, config.track === "christian" ? "\u271D\uFE0F \uAE30\uB3C5\uAD50" : "\u{1F331} \uC2EC\uB9AC\uC0C1\uB2F4")), config.track === "christian" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, "\xB7 \uC2E0\uD559 \uAC15\uB3C4: ", /* @__PURE__ */ React.createElement("b", null, theoLabel)), /* @__PURE__ */ React.createElement("div", null, "\xB7 \uBAA9\uC591 \uD1A4: ", /* @__PURE__ */ React.createElement("b", null, toneLabel))) : /* @__PURE__ */ React.createElement("div", null, "\xB7 \uAC10\uC815 \uAE4A\uC774: ", /* @__PURE__ */ React.createElement("b", null, depthLabel)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: INK, marginBottom: 14, lineHeight: 1.7 } }, "\uC774 \uC124\uC815\uC744 ", /* @__PURE__ */ React.createElement("b", null, "\uB2E4\uC2DC \uBCC0\uACBD"), "\uD560\uAE4C\uC694?", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: MUT, fontSize: 12.5 } }, "\uC9C0\uAE08\uAE4C\uC9C0\uC758 \uAD00\uACC4 \uAE30\uC5B5\xB7\uAE30\uB85D\uC740 \uADF8\uB300\uB85C \uC720\uC9C0\uB3FC\uC694.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setAsk(false) }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement(Btn, { onClick: () => {
      setAsk(false);
      onSettings();
    } }, "\uC124\uC815 \uBCC0\uACBD\uD558\uAE30")))
  ));
}
function Share({ relationId, itemType, payload, preview, label }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const send = async () => {
    setBusy(true);
    const r = await api("/share/send", "POST", { relationId, itemType, payload });
    setBusy(false);
    setOpen(false);
    if (r.ok) setDone(r.linked ? "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uBCF4\uB0C8\uC5B4\uC694 \u2713" : '\uBCF4\uB0C8\uC5B4\uC694. \uBC30\uC6B0\uC790\uAC00 \uC544\uC9C1 \uC5F0\uACB0 \uC804\uC774\uBA74 \uC218\uC2E0\uD568\uC5D0\uC11C "\uBC30\uC6B0\uC790 \uC5F0\uACB0"\uB85C \uCD08\uB300\uD558\uC138\uC694.');
    else if (r.status === 403) setDone("\uC9C0\uAE08\uC740 \uC548\uC804\uC744 \uC704\uD574 \uACF5\uC720\uAC00 \uC81C\uD55C\uB3FC\uC694.");
    else setDone(r.error || "\uACF5\uC720\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setOpen(true), style: { fontSize: 13, padding: 11, marginTop: 8 } }, label), done && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: GREEN, marginTop: 6, lineHeight: 1.6 } }, done), open && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }, onClick: (e) => {
    if (e.target === e.currentTarget) setOpen(false);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 16, maxWidth: 400, width: "100%", padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, marginBottom: 8 } }, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uC774\uB807\uAC8C \uBCF4\uC5EC\uC694"), /* @__PURE__ */ React.createElement(Card, { style: { background: "#f6faf8", fontSize: 14, lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" } }, preview), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setOpen(false) }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement(Btn, { onClick: send, disabled: busy }, busy ? "\uBCF4\uB0B4\uB294 \uC911\u2026" : "\uBCF4\uB0B4\uAE30")))));
}
function SafetyScreen({ s }) {
  return /* @__PURE__ */ React.createElement(Card, { style: { background: "#fff4ee", border: "1px solid #f5c6a5" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "#b45309", marginBottom: 8 } }, "\u{1F6DF} \uC9C0\uAE08\uC740 \uC548\uC804\uC774 \uBA3C\uC800\uC608\uC694"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.8, color: "#78350f" } }, s.response), s.reframe && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7, color: "#78350f", marginTop: 10 } }, s.reframe), s.protect_actions && s.protect_actions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: "#b45309", marginBottom: 6 } }, "\uC9C0\uAE08 \uD560 \uC218 \uC788\uB294 \uAC83"), s.protect_actions.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 14, lineHeight: 1.7 } }, "\xB7 ", a))), s.resources && s.resources.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 } }, s.resources.map((r, i) => {
    const num = (String(r).match(/1577-1389|1\d{3}|1\d{2}/) || [])[0];
    return /* @__PURE__ */ React.createElement("a", { key: i, href: num ? "tel:" + num.replace(/-/g, "") : void 0, style: { textDecoration: "none", background: "#fff", border: "1px solid #f5c6a5", color: "#b45309", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 700 } }, "\u{1F4DE} ", r);
  })), s.door_open && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: MUT, marginTop: 14, lineHeight: 1.7 } }, s.door_open));
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
  )))) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, borderTop: `1px dashed ${LINE}`, paddingTop: 12 } }, reframe ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.75 } }, /* @__PURE__ */ React.createElement("div", null, reframe.response), reframe.reframe && /* @__PURE__ */ React.createElement("div", { style: { color: MUT, marginTop: 8 } }, reframe.reframe), reframe.next_suggestion && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, color: GREEN } }, "\uB2E4\uC74C\uC5D4 \xB7 ", reframe.next_suggestion)) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: MUT } }, "\uAE30\uB85D\uD588\uC5B4\uC694. \uC528\uC557\uC740 \uC2EC\uACBC\uC5B4\uC694 \u{1F331}")), /* @__PURE__ */ React.createElement(Share, { relationId, itemType: "activity_invite", payload: { action: imp.action }, preview: "\uAC19\uC774 \uD574\uBCFC\uB798?\n" + imp.action, label: "\u{1F48C} \uAC19\uC774 \uD574\uBCFC\uB798? \uBC30\uC6B0\uC790\uC5D0\uAC8C \uBCF4\uB0B4\uAE30" }));
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
  ), err && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, margin: "8px 0" } }, err), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: run, disabled: busy || !input.trim() }, busy ? "\uD1B5\uC5ED \uC911\u2026" : "\uD1B5\uC5ED\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MUT, textAlign: "center", marginTop: 8 } }, mode.key === "mediate" || mode.key === "perspective" ? "3 \uD06C\uB808\uB527" : "2 \uD06C\uB808\uB527", " \uC0AC\uC6A9")), result && /* @__PURE__ */ React.createElement(React.Fragment, null, result.safety_tier ? /* @__PURE__ */ React.createElement(SafetyScreen, { s: result }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ResultBlock, { result }), /* @__PURE__ */ React.createElement(Improvement, { imp: result.improvement, relationId, track: config.track }), mode.key === "send" && result.rewritten && /* @__PURE__ */ React.createElement(Share, { relationId, itemType: "message", payload: { text: result.rewritten }, preview: result.rewritten, label: "\u2709\uFE0F \uC774 \uBB38\uC7A5 \uBC30\uC6B0\uC790\uC5D0\uAC8C \uBCF4\uB0B4\uAE30" }), mode.key === "mediate" && /* @__PURE__ */ React.createElement(Share, { relationId, itemType: "mediate_view", payload: result, preview: "[\uC911\uC7AC \uD1B5\uC5ED \uD568\uAED8 \uBCF4\uAE30]\n\uB2E4\uC74C \uD55C\uB9C8\uB514 \xB7 " + (result.next_word || ""), label: "\u{1F517} \uD568\uAED8 \uBCF4\uAE30 \uBCF4\uB0B4\uAE30" }), mode.key === "perspective" && /* @__PURE__ */ React.createElement(Share, { relationId, itemType: "perspective_view", payload: result, preview: "[\uAD00\uC810 \uD1B5\uC5ED \uD568\uAED8 \uBCF4\uAE30]\n" + (result.bridge || ""), label: "\u{1F517} \uD568\uAED8 \uBCF4\uAE30 \uBCF4\uB0B4\uAE30" })), /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => {
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
  ), blocked && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, background: blocked.crisis_support ? "#fff4ee" : "#fef9ec", border: `1px solid ${blocked.crisis_support ? "#f5c6a5" : "#fde68a"}`, borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.7, color: "#78350f" } }, blocked.message, blocked.suggested_fix && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, color: GREEN } }, "\uC218\uC815 \uC81C\uC548 \xB7 ", blocked.suggested_fix), blocked.crisis_support && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6 } }, "\uC790\uC0B4\uC608\uBC29 \uC0C1\uB2F4\uC804\uD654 ", /* @__PURE__ */ React.createElement("a", { href: "tel:109", style: { color: "#b45309", fontWeight: 700 } }, "109"), "(24\uC2DC\uAC04) \xB7 \uAE34\uAE09 \uC2DC 112 \xB7 1366 \xB7 1388")), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: submit, disabled: busy || !content.trim() }, busy ? "\uAC80\uD1A0 \uC911\u2026" : "\uAC8C\uC2DC\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: MUT, textAlign: "center", marginTop: 6 } }, "\uAC8C\uC2DC \uC804 AI\uAC00 \uBA3C\uC800 \uAC80\uD1A0\uD574\uC694 (\uD2B9\uC815\uC778 \uC2DD\uBCC4\xB7\uC695\uC124 \uB4F1)")), posts === null ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026") : posts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uC544\uC9C1 \uAE00\uC774 \uC5C6\uC5B4\uC694. \uCCAB \uC774\uC57C\uAE30\uB97C \uB098\uB220\uBCF4\uC138\uC694.") : posts.map((p) => /* @__PURE__ */ React.createElement(Card, { key: p.id, style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" } }, p.content), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: MUT, marginTop: 8 } }, "\u{1F90D} ", p.empathy_count || 0, " \xB7 ", (p.created_at || "").slice(0, 10)))));
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
function Multimodal({ relationId, config, onBack }) {
  const [phase, setPhase] = useState("intro");
  const [code, setCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [signals, setSignals] = useState(null);
  const [inputText, setInputText] = useState("");
  const [trResult, setTrResult] = useState(null);
  const [useCamera, setUseCamera] = useState(true);
  const videoRef = useRef(null), streamRef = useRef(null), detRef = useRef(null), exprRef = useRef({});
  const audioCtxRef = useRef(null), volRef = useRef({ sum: 0, n: 0, spikes: 0 }), rafRef = useRef(null);
  const request = async () => {
    setBusy(true);
    setMsg("");
    const r = await api("/consent/request", "POST", { relationId, mediaType: useCamera ? "video" : "audio" });
    setBusy(false);
    if (r.ok && r.consentCode) {
      setCode(r.consentCode);
      setPhase("request");
    } else setMsg(r.error || "\uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
  };
  const accept = async () => {
    if (!agreed || !inputCode.trim()) return;
    setBusy(true);
    setMsg("");
    const r = await api("/consent/accept", "POST", { consentCode: inputCode.trim().toUpperCase(), agreed: true });
    setBusy(false);
    if (r.ok) {
      setPhase("accepted");
    } else setMsg(r.error || "\uB3D9\uC758\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694 (\uCF54\uB4DC \uD655\uC778 \xB7 \uC694\uCCAD\uC790 \uBCF8\uC778\uC740 \uB3D9\uC758 \uBD88\uAC00).");
  };
  const cleanup = () => {
    try {
      detRef.current && clearInterval(detRef.current);
    } catch {
    }
    try {
      rafRef.current && cancelAnimationFrame(rafRef.current);
    } catch {
    }
    try {
      audioCtxRef.current && audioCtxRef.current.close();
    } catch {
    }
    try {
      streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop());
    } catch {
    }
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);
  const startCapture = async () => {
    setBusy(true);
    setMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: useCamera ? { facingMode: "user" } : false, audio: true });
      streamRef.current = stream;
      exprRef.current = {};
      volRef.current = { sum: 0, n: 0, spikes: 0 };
      const fa = useCamera ? await loadFaceApi() : null;
      setPhase("capturing");
      setBusy(false);
      if (useCamera) {
        setTimeout(() => {
          const v = videoRef.current;
          if (v) {
            v.srcObject = stream;
            v.muted = true;
            v.playsInline = true;
            v.play().catch(() => {
            });
          }
        }, 100);
        detRef.current = setInterval(async () => {
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;
          try {
            const res = await fa.detectSingleFace(v, new fa.TinyFaceDetectorOptions()).withFaceExpressions();
            if (res && res.expressions) {
              let top = "", mx = 0;
              for (const k in res.expressions) {
                if (res.expressions[k] > mx) {
                  mx = res.expressions[k];
                  top = k;
                }
              }
              if (top && mx > 0.55) exprRef.current[top] = (exprRef.current[top] || 0) + 1;
            }
          } catch {
          }
        }, 1500);
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const x = (buf[i] - 128) / 128;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / buf.length);
        volRef.current.sum += rms;
        volRef.current.n++;
        if (rms > 0.25) volRef.current.spikes++;
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setBusy(false);
      setMsg("\uCE74\uBA54\uB77C\xB7\uB9C8\uC774\uD06C\uB97C \uC2DC\uC791\uD560 \uC218 \uC5C6\uC5B4\uC694. \uAD8C\uD55C\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
    }
  };
  const stopCapture = () => {
    cleanup();
    setSignals({ visualCues: exprSummary(exprRef.current), toneAnalysis: toneSummary(volRef.current) });
    setPhase("result");
  };
  const revoke = async (sid) => {
    try {
      await api("/consent/revoke", "POST", { consentSessionId: sid });
    } catch {
    }
  };
  const translate = async () => {
    setBusy(true);
    setMsg("");
    const r = await api("/translate", "POST", {
      relationId,
      track: config.track,
      mode: "mediate",
      input: inputText.trim() || "\uBC29\uAE08 \uB098\uB208 \uB300\uD654",
      emotionDepth: config.emotionDepth,
      theologyLevel: config.theologyLevel,
      pastoralTone: config.pastoralTone,
      multimodal: { consentSessionId: code, toneAnalysis: signals.toneAnalysis, visualCues: signals.visualCues }
    });
    setBusy(false);
    if (r.status === 403) {
      setMsg("\uBC30\uC6B0\uC790 \uB3D9\uC758\uAC00 \uC544\uC9C1 \uD655\uC778\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694. \uBC30\uC6B0\uC790\uAC00 \uCF54\uB4DC\uB85C \uB3D9\uC758\uD588\uB294\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (r.status === 402) {
      setMsg("\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD574\uC694. \uB9C8\uC74C\uD480\uC5D0\uC11C \uAD6C\uB9E4 \uD6C4 \uC774\uC6A9\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (r.ok && r.result) setTrResult(r.result);
    else setMsg(r.error || "\uD1B5\uC5ED\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
  };
  return /* @__PURE__ */ React.createElement(Shell, { title: "\u{1F3A5} \uD568\uAED8 \uBD84\uC11D", onBack: () => {
    cleanup();
    onBack();
  } }, phase === "intro" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { style: { background: "#fef9ec", border: "1px solid #fde68a", color: "#78350f", fontSize: 13.5, lineHeight: 1.8, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("b", null, "\uC30D\uBC29 \uB3D9\uC758\uAC00 \uC788\uC5B4\uC57C\uB9CC"), " \uBD84\uC11D\uC774 \uC2DC\uC791\uB3FC\uC694. \uC6D0\uBCF8 \uC601\uC0C1\xB7\uC74C\uC131\uC740 ", /* @__PURE__ */ React.createElement("b", null, "\uAE30\uAE30 \uBC16\uC73C\uB85C \uB098\uAC00\uC9C0 \uC54A\uACE0"), ", \uBD84\uC11D(\uD45C\uC815\xB7\uC5B4\uC870 \uC694\uC57D)\uC774 \uB05D\uB098\uBA74 ", /* @__PURE__ */ React.createElement("b", null, "\uC0AD\uC81C"), "\uB3FC\uC694. \uC5B8\uC81C\uB4E0 \uCCA0\uD68C\uD560 \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: 800, marginBottom: 10 } }, "\uBD84\uC11D \uBC29\uC2DD\uC744 \uC120\uD0DD\uD558\uC138\uC694"), [
    { on: true, emoji: "\u{1F3A5}", label: "\uB179\uD654 (\uC601\uC0C1)", desc: "\uD45C\uC815 + \uC5B4\uC870\uB97C \uD568\uAED8 \uBD84\uC11D" },
    { on: false, emoji: "\u{1F399}\uFE0F", label: "\uB179\uC74C (\uC74C\uC131\uB9CC)", desc: "\uCE74\uBA54\uB77C \uC5C6\uC774 \uC5B4\uC870\uB9CC \uBD84\uC11D \u2014 \uBD80\uB2F4\uC774 \uB35C\uD574\uC694" }
  ].map((opt) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: String(opt.on),
      onClick: () => setUseCamera(opt.on),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        marginBottom: 8,
        borderRadius: 12,
        cursor: "pointer",
        border: `1.5px solid ${useCamera === opt.on ? GREEN : LINE}`,
        background: useCamera === opt.on ? "#f6faf8" : "#fff"
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, opt.emoji),
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 14, fontWeight: 700 } }, opt.label), /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 12, color: MUT, marginTop: 2 } }, opt.desc)),
    /* @__PURE__ */ React.createElement("span", { style: { color: useCamera === opt.on ? GREEN : LINE, fontWeight: 800 } }, useCamera === opt.on ? "\u25CF" : "\u25CB")
  ))), /* @__PURE__ */ React.createElement(Btn, { onClick: request, disabled: busy }, "\uB0B4\uAC00 ", useCamera ? "\uB179\uD654" : "\uB179\uC74C", " \uBD84\uC11D\uC744 \uC694\uCCAD\uD560\uAC8C\uC694 (\uCF54\uB4DC \uBC1C\uAE09)"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setPhase("accept") }, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uBC1B\uC740 \uCF54\uB4DC\uB85C \uB3D9\uC758\uD558\uAE30"), msg && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, marginTop: 10 } }, msg)), phase === "request" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, marginBottom: 8 } }, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uC774 \uCF54\uB4DC\uB97C \uC804\uB2EC\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30, fontWeight: 800, letterSpacing: 4, color: GREEN } }, code)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: MUT, lineHeight: 1.7, marginBottom: 14 } }, "\uBC30\uC6B0\uC790 \uD734\uB300\uD3F0\uC5D0\uC11C ", /* @__PURE__ */ React.createElement("b", null, '\uB9C8\uC74C\uBD80\uBD80 \u2192 \uD568\uAED8 \uBD84\uC11D \u2192 "\uCF54\uB4DC\uB85C \uB3D9\uC758\uD558\uAE30"'), '\uC5D0 \uC785\uB825\uD558\uACE0 \uB3D9\uC758\uD558\uBA74, \uC544\uB798 "', useCamera ? "\uB179\uD654" : "\uB179\uC74C", ' \uC2DC\uC791"\uC774 \uB3D9\uC791\uD574\uC694.'), /* @__PURE__ */ React.createElement(Btn, { onClick: startCapture, disabled: busy }, "\uBC30\uC6B0\uC790\uAC00 \uB3D9\uC758\uD588\uC5B4\uC694 \xB7 ", useCamera ? "\uB179\uD654" : "\uB179\uC74C", " \uC2DC\uC791"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setPhase("intro") }, "\uCDE8\uC18C"), msg && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, marginTop: 10 } }, msg)), phase === "accept" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, marginBottom: 10 } }, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uBC1B\uC740 \uCF54\uB4DC \uC785\uB825"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: inputCode,
      onChange: (e) => setInputCode(e.target.value),
      placeholder: "\uC608: A1B2C3D4",
      style: { width: "100%", border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 14, fontSize: 18, textAlign: "center", letterSpacing: 2, outline: "none", marginBottom: 12 }
    }
  ), /* @__PURE__ */ React.createElement(Card, { style: { background: "#f6faf8", fontSize: 12.5, color: MUT, lineHeight: 1.7, marginBottom: 12 } }, "\uB3D9\uC758\uD558\uBA74 \uC774 \uC138\uC158\uC5D0\uC11C ", /* @__PURE__ */ React.createElement("b", null, "\uB179\uD654\xB7\uC74C\uC131 \uBD84\uC11D"), "\uC774 \uAC00\uB2A5\uD574\uC838\uC694. \uC218\uC9D1\uC740 \uD45C\uC815\xB7\uC5B4\uC870\uC758 ", /* @__PURE__ */ React.createElement("b", null, "\uC694\uC57D"), "\uBFD0, \uC6D0\uBCF8\uC740 \uC800\uC7A5\xB7\uC804\uC1A1\uB418\uC9C0 \uC54A\uC544\uC694. \uC5B8\uC81C\uB4E0 \uCCA0\uD68C\uD560 \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 12, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: agreed, onChange: (e) => setAgreed(e.target.checked) }), " \uC704 \uB0B4\uC6A9\uC744 \uD655\uC778\uD588\uACE0 \uB3D9\uC758\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(Btn, { onClick: accept, disabled: busy || !agreed || !inputCode.trim() }, "\uB3D9\uC758\uD558\uACE0 \uC644\uB8CC"), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: () => setPhase("intro") }, "\uC774\uC804"), msg && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, marginTop: 10 } }, msg)), phase === "accepted" && /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", marginTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17, margin: "8px 0" } }, "\uB3D9\uC758 \uC644\uB8CC"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, lineHeight: 1.7 } }, "\uC694\uCCAD\uD558\uC2E0 \uBD84\uC774 \uB179\uD654\uB97C \uC2DC\uC791\uD560 \uC218 \uC788\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uB9C8\uC74C\uC774 \uBC14\uB00C\uBA74 \uC5B8\uC81C\uB4E0 \uCCA0\uD68C\uD560 \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement("div", { style: { height: 14 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: async () => {
    await revoke(inputCode.trim().toUpperCase());
    onBack();
  } }, "\uB3D9\uC758 \uCCA0\uD68C")), phase === "capturing" && /* @__PURE__ */ React.createElement(React.Fragment, null, useCamera ? /* @__PURE__ */ React.createElement("video", { ref: videoRef, style: { width: "100%", borderRadius: 14, background: "#000", marginBottom: 12 } }) : /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", padding: "28px 16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40 } }, "\u{1F399}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15, marginTop: 8 } }, "\uC74C\uC131\uB9CC \uBD84\uC11D \uC911"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 12.5, marginTop: 4 } }, "\uCE74\uBA54\uB77C\uB294 \uAEBC\uC838 \uC788\uC5B4\uC694")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: MUT, fontSize: 13, marginBottom: 12 } }, "\u{1F534} \uAE30\uAE30 \uC548\uC5D0\uC11C\uB9CC \uBD84\uC11D \uC911\u2026 (\uC6D0\uBCF8\uC740 \uC800\uC7A5\xB7\uC804\uC1A1\uB418\uC9C0 \uC54A\uC544\uC694)"), /* @__PURE__ */ React.createElement(Btn, { onClick: stopCapture }, useCamera ? "\uB179\uD654" : "\uB179\uC74C", " \uC885\uB8CC \xB7 \uBD84\uC11D \uBCF4\uAE30")), phase === "result" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 8 } }, "\uC628\uB514\uBC14\uC774\uC2A4 \uBD84\uC11D \uC694\uC57D (\uC6D0\uBCF8\uC740 \uC774\uBBF8 \uC0AD\uC81C\uB428)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.8 } }, useCamera && (signals.visualCues ? /* @__PURE__ */ React.createElement("div", null, "\xB7 ", signals.visualCues) : /* @__PURE__ */ React.createElement("div", { style: { color: MUT } }, "\xB7 \uD45C\uC815\uC774 \uCDA9\uBD84\uD788 \uAC10\uC9C0\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694")), signals.toneAnalysis ? /* @__PURE__ */ React.createElement("div", null, "\xB7 ", signals.toneAnalysis) : /* @__PURE__ */ React.createElement("div", { style: { color: MUT } }, "\xB7 \uC5B4\uC870\uAC00 \uCDA9\uBD84\uD788 \uAC10\uC9C0\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, marginBottom: 8 } }, "\uBC29\uAE08 \uB098\uB208 \uB300\uD654\uAC00 \uC788\uC73C\uBA74 \uC801\uC5B4\uC8FC\uC138\uC694 (\uC120\uD0DD)."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: inputText,
      onChange: (e) => setInputText(e.target.value),
      placeholder: "\uC8FC\uACE0\uBC1B\uC740 \uB9D0\uC744 \uC801\uC73C\uBA74 \uB354 \uC815\uD655\uD574\uC694.",
      style: { width: "100%", minHeight: 90, border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 12, fontSize: 14, resize: "vertical", outline: "none", marginBottom: 12 }
    }
  ), !trResult ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Btn, { onClick: translate, disabled: busy }, busy ? "\uD1B5\uC5ED \uC911\u2026" : "\uC774 \uC2E0\uD638\uB85C \uD1B5\uC5ED\uD558\uAE30 (\uC911\uC7AC \xB7 3\uD06C\uB808\uB527)"), msg && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, marginTop: 10 } }, msg)) : trResult.safety_tier ? /* @__PURE__ */ React.createElement(SafetyScreen, { s: trResult }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ResultBlock, { result: trResult }), /* @__PURE__ */ React.createElement(Improvement, { imp: trResult.improvement, relationId, track: config.track })), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: async () => {
    await revoke(code);
    onBack();
  } }, "\uB3D9\uC758 \uCCA0\uD68C\uD558\uACE0 \uC885\uB8CC")));
}
const SHARE_LABEL = { message: "\u2709\uFE0F \uBC30\uC6B0\uC790\uAC00 \uB2E4\uB4EC\uC740 \uD55C\uB9C8\uB514", mediate_view: "\u{1F517} \uC911\uC7AC \uD1B5\uC5ED \uD568\uAED8 \uBCF4\uAE30", perspective_view: "\u{1F517} \uAD00\uC810 \uD1B5\uC5ED \uD568\uAED8 \uBCF4\uAE30", activity_invite: "\u{1F48C} \uAC19\uC774 \uD574\uBCFC\uB798?" };
function InboxItem({ it, onAccept }) {
  const p = it.payload || {};
  return /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 } }, SHARE_LABEL[it.item_type] || "\uACF5\uC720"), it.item_type === "message" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" } }, p.text), it.item_type === "activity_invite" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" } }, p.action), it.status === "accepted" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: GREEN, marginTop: 8 } }, "\uAC19\uC774 \uD558\uAE30\uB85C \uD588\uC5B4\uC694 \u{1F331}") : /* @__PURE__ */ React.createElement(Btn, { onClick: () => onAccept(it.id), style: { marginTop: 10 } }, "\uAC19\uC774 \uD560\uAC8C\uC694")), (it.item_type === "mediate_view" || it.item_type === "perspective_view") && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" } }, p.bridge || p.next_word || p.translation || p.surface || "\uD568\uAED8 \uBCF4\uAE30 \uB0B4\uC6A9"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: MUT, marginTop: 8 } }, (it.created_at || "").slice(0, 16).replace("T", " ")));
}
function Inbox({ relationId, onBack, onSeen }) {
  const [items, setItems] = useState(null);
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");
  const load = async () => {
    const r = await api(`/share/inbox?relationId=${relationId}`);
    setItems(r.ok ? r.items || [] : []);
    if (onSeen) onSeen();
  };
  useEffect(() => {
    load();
  }, []);
  const makeInvite = async () => {
    const r = await api("/relation/invite", "POST", { relationId });
    if (r.ok) setCode(r.inviteCode);
  };
  const join = async () => {
    const c = joinCode.trim().toUpperCase();
    if (!c) return;
    const r = await api("/relation/join", "POST", { inviteCode: c });
    setMsg(r.ok ? "\uBC30\uC6B0\uC790\uC640 \uC5F0\uACB0\uB410\uC5B4\uC694 \u2713 \uC774\uC81C \uACF5\uC720\uAC00 \uC571 \uC548\uC5D0\uC11C \uBC14\uB85C \uB3C4\uCC29\uD574\uC694." : r.error || "\uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
  };
  const accept = async (id) => {
    await api("/share/respond", "POST", { shareId: id, action: "accepted" });
    load();
  };
  return /* @__PURE__ */ React.createElement(Shell, { title: "\u{1F4EC} \uC218\uC2E0\uD568", onBack }, /* @__PURE__ */ React.createElement(Card, { style: { marginBottom: 14, background: "#f6faf8" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 800, marginBottom: 6 } }, "\u{1F91D} \uBC30\uC6B0\uC790 \uC5F0\uACB0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: MUT, lineHeight: 1.65, marginBottom: 10 } }, "\uC5F0\uACB0\uD558\uBA74 \uACF5\uC720\uD55C \uD56D\uBAA9\uC774 \uC571 \uC548\uC5D0\uC11C \uBC14\uB85C \uC624\uAC11\uB2C8\uB2E4. \uD55C\uCABD\uC774 \uCF54\uB4DC\uB97C \uB9CC\uB4E4\uACE0, \uB2E4\uB978 \uCABD\uC774 \uC785\uB825\uD558\uBA74 \uB05D."), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: makeInvite }, "\uB0B4 \uCD08\uB300\uCF54\uB4DC \uB9CC\uB4E4\uAE30"), code && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: 3, color: GREEN, margin: "10px 0", fontFamily: "monospace" } }, code), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: joinCode,
      onChange: (e) => setJoinCode(e.target.value),
      placeholder: "\uBC30\uC6B0\uC790 \uCF54\uB4DC \uC785\uB825",
      maxLength: 6,
      style: { flex: 1, border: `1.5px solid ${LINE}`, borderRadius: 10, padding: 10, fontSize: 15, textTransform: "uppercase", outline: "none", fontFamily: "monospace", letterSpacing: 2 }
    }
  ), /* @__PURE__ */ React.createElement(Btn, { onClick: join, style: { width: "auto", padding: "10px 16px" } }, "\uC5F0\uACB0")), msg && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: GREEN, marginTop: 8, lineHeight: 1.6 } }, msg)), items === null ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026") : items.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: MUT, textAlign: "center", padding: 30 } }, "\uC544\uC9C1 \uBC1B\uC740 \uACF5\uC720\uAC00 \uC5C6\uC5B4\uC694.") : items.map((it) => /* @__PURE__ */ React.createElement(InboxItem, { key: it.id, it, onAccept: accept })));
}
function AgeGate({ onPass }) {
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = { flex: 1, border: `1.5px solid ${LINE}`, borderRadius: 10, padding: 12, fontSize: 16, textAlign: "center", outline: "none" };
  const submit = async () => {
    setErr("");
    if (y.length !== 4 || !m || !d) {
      setErr("\uC0DD\uB144\uC6D4\uC77C\uC744 \uC815\uD655\uD788 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    setBusy(true);
    const r = await api("/age/verify", "POST", { birthDate: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` });
    setBusy(false);
    if (r.ok) {
      onPass();
      return;
    }
    setErr(r.minor ? r.message || "\uB9CC 19\uC138 \uC774\uC0C1\uB9CC \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694." : r.error || "\uD655\uC778\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
  };
  return /* @__PURE__ */ React.createElement(Shell, null, /* @__PURE__ */ React.createElement(Card, { style: { marginTop: 30 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34, textAlign: "center" } }, "\u{1F51E}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 19, fontWeight: 800, textAlign: "center", margin: "10px 0 6px" } }, "\uC131\uC778 \uD655\uC778"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 13.5, textAlign: "center", lineHeight: 1.7, marginBottom: 18 } }, "\uB9C8\uC74C\uBD80\uBD80\uB294 ", /* @__PURE__ */ React.createElement("b", { style: { color: INK } }, "\uB9CC 19\uC138 \uC774\uC0C1 \uC131\uC778 \uBD80\uBD80"), "\uB97C \uC704\uD55C \uAD00\uACC4 \uD1B5\uC5ED \uC11C\uBE44\uC2A4\uC608\uC694. \uC0DD\uB144\uC6D4\uC77C\uB85C \uD55C \uBC88\uB9CC \uD655\uC778\uD560\uAC8C\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("input", { inputMode: "numeric", value: y, onChange: (e) => setY(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "YYYY", style: box }), /* @__PURE__ */ React.createElement("input", { inputMode: "numeric", value: m, onChange: (e) => setM(e.target.value.replace(/\D/g, "").slice(0, 2)), placeholder: "MM", style: { ...box, maxWidth: 80 } }), /* @__PURE__ */ React.createElement("input", { inputMode: "numeric", value: d, onChange: (e) => setD(e.target.value.replace(/\D/g, "").slice(0, 2)), placeholder: "DD", style: { ...box, maxWidth: 80 } })), err && /* @__PURE__ */ React.createElement("div", { style: { color: "#c0392b", fontSize: 13, marginTop: 10, lineHeight: 1.6 } }, err), /* @__PURE__ */ React.createElement("div", { style: { height: 14 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: submit, disabled: busy }, busy ? "\uD655\uC778 \uC911\u2026" : "\uC131\uC778\uC785\uB2C8\uB2E4 \xB7 \uC2DC\uC791\uD558\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: MUT, textAlign: "center", marginTop: 10 } }, "\uC0DD\uB144\uC6D4\uC77C\uC740 \uC131\uC778 \uC5EC\uBD80 \uD655\uC778\uC5D0\uB9CC \uC4F0\uC5EC\uC694.")));
}
function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [relationId, setRelationId] = useState(null);
  const [config, setConfig] = useState(loadConfig());
  const [view, setView] = useState("home");
  const [mode, setMode] = useState(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [adult, setAdult] = useState(true);
  const refreshInbox = async (rid) => {
    const id = rid || relationId;
    if (!id) return;
    const r = await api(`/share/inbox?relationId=${id}&peek=1`);
    if (r.ok) setInboxCount((r.items || []).filter((x) => x.status === "sent").length);
  };
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
      if (r.ok) {
        setRelationId(r.relationId);
        setAdult(!!r.adult);
        refreshInbox(r.relationId);
      }
      setReady(true);
    })();
  }, []);
  if (!ready) return /* @__PURE__ */ React.createElement(Shell, null, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: MUT, padding: 50 } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026"));
  if (!authed) return /* @__PURE__ */ React.createElement(Shell, null, /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", marginTop: 40 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40 } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, margin: "10px 0" } }, "\uB9C8\uC74C\uBD80\uBD80"), /* @__PURE__ */ React.createElement("div", { style: { color: MUT, fontSize: 14, lineHeight: 1.7 } }, "\uB9C8\uC74C\uD480\uC5D0 \uB85C\uADF8\uC778\uD55C \uB4A4,", /* @__PURE__ */ React.createElement("br", null), "\uBA54\uB274\uC758 ", /* @__PURE__ */ React.createElement("b", null, "\u{1F4AC} \uB9C8\uC74C\uBD80\uBD80"), "\uB85C \uB4E4\uC5B4\uC640 \uC8FC\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { height: 16 } }), /* @__PURE__ */ React.createElement(Btn, { onClick: () => window.open("https://maumful.com", "_blank") }, "\uB9C8\uC74C\uD480\uB85C \uAC00\uAE30")));
  if (!adult) return /* @__PURE__ */ React.createElement(AgeGate, { onPass: () => setAdult(true) });
  if (!config) return /* @__PURE__ */ React.createElement(Onboarding, { onDone: () => setConfig(loadConfig()) });
  if (view === "mode" && mode) return /* @__PURE__ */ React.createElement(ModeView, { mode, config, relationId, onBack: () => setView("home") });
  if (view === "community") return /* @__PURE__ */ React.createElement(Community, { onBack: () => setView("home") });
  if (view === "memory") return /* @__PURE__ */ React.createElement(Memory, { relationId, onBack: () => setView("home") });
  if (view === "multimodal") return /* @__PURE__ */ React.createElement(Multimodal, { relationId, config, onBack: () => setView("home") });
  if (view === "inbox") return /* @__PURE__ */ React.createElement(Inbox, { relationId, onBack: () => {
    setView("home");
    refreshInbox();
  }, onSeen: () => setInboxCount(0) });
  return /* @__PURE__ */ React.createElement(
    Home,
    {
      config,
      inboxCount,
      onMode: (m) => {
        setMode(m);
        setView("mode");
      },
      onCommunity: () => setView("community"),
      onMemory: () => setView("memory"),
      onMultimodal: () => setView("multimodal"),
      onInbox: () => setView("inbox"),
      onSettings: () => {
        localStorage.removeItem("bubu_config");
        setConfig(null);
      }
    }
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
