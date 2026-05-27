const GT = {
  dawnDeep: "#0D1F12",
  dawnMid: "#1A3320",
  dawnLight: "#2D5A3D",
  skyDawn: "#8FB5A0",
  skyGlow: "#C8DDD0",
  fogWhite: "#E8F0EB",
  bark: "#4A3728",
  barkL: "#6B5240",
  barkD: "#2E1F14",
  leaf: "#2D6A3A",
  leafL: "#4A8A54",
  leafViv: "#5CAF6A",
  leafGlow: "#88D4A0",
  blossom: "#F4A0B8",
  blossomL: "#FAD0DF",
  amber: "#E8A84A",
  amberL: "#F5C870",
  cream: "#F5F0E8",
  softCream: "#EDE8DF",
  muted: "#8A9E8F",
  mutedD: "#5A7060",
  dark: "#1A2E1F"
};
const TREE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600&display=swap');
  @keyframes sway      { 0%,100%{transform:rotate(-1.5deg) translateX(-1px)}50%{transform:rotate(1.5deg) translateX(1px)} }
  @keyframes shimmer   { 0%,100%{opacity:0.6}50%{opacity:1} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0}to{opacity:1} }
  @keyframes bloomPop  { 0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes firefly   { 0%,100%{transform:translate(0,0);opacity:0}25%{transform:translate(4px,-6px);opacity:0.9}75%{transform:translate(-3px,4px);opacity:0.5} }
  @keyframes mist      { 0%,100%{transform:translateX(0);opacity:0.18}50%{transform:translateX(12px);opacity:0.28} }
  @keyframes leafDrop  { 0%{transform:translateY(-10px) rotate(0deg);opacity:0}20%{opacity:1}100%{transform:translateY(80px) rotate(180deg) translateX(20px);opacity:0} }
  @keyframes stageSlide{ from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
  @keyframes rootGrow  { from{stroke-dashoffset:100}to{stroke-dashoffset:0} }
  .tree-sway    { animation:sway 4s ease-in-out infinite; transform-origin:180px 210px; }
  .firefly-anim { animation:firefly 4s ease-in-out infinite; }
  .mist-anim    { animation:mist 6s ease-in-out infinite; }
  .bloom-pop    { animation:bloomPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .stage-slide  { animation:stageSlide 0.3s ease forwards; }
  .tree-textarea {
    width:100%; padding:14px 16px; border-radius:14px; font-size:14px;
    font-family:'Noto Sans KR',sans-serif; outline:none; resize:none;
    line-height:1.75; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box;
  }
  .tree-textarea:focus { box-shadow:0 0 0 3px rgba(90,175,106,0.22); }
  .tree-btn { width:100%; padding:15px; border:none; border-radius:16px; font-size:15px;
    font-weight:700; font-family:'Noto Sans KR',sans-serif; cursor:pointer;
    transition:transform 0.15s,box-shadow 0.15s,opacity 0.2s; }
  .tree-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .tree-btn:active:not(:disabled){ transform:translateY(0); }
  .tree-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .tree-btn-ghost { width:100%; padding:12px; border-radius:14px; font-size:13px;
    font-weight:600; font-family:'Noto Sans KR',sans-serif; cursor:pointer;
    transition:background 0.2s; background:transparent; }
  .answer-card { animation:fadeUp 0.3s ease forwards; }
`;
const STAGES = [
  {
    id: "roots",
    title: "\uBFCC\uB9AC \u2014 \uD604\uC7AC \uC21C\uAC04",
    emoji: "\u{1F331}",
    color: "#7B5F4A",
    accent: "#C8A882",
    bg: "rgba(107,79,58,0.14)",
    border: "rgba(200,168,130,0.25)",
    desc: "\uC9C0\uAE08 \uC774 \uC21C\uAC04\uC5D0 \uB2FF\uC544\uC788\uC5B4\uC694.",
    questions: [
      { id: "r1", prompt: "\uC9C0\uAE08 \uC774 \uC21C\uAC04, \uBAB8\uC5D0\uC11C \uB290\uAEF4\uC9C0\uB294 \uAC10\uAC01\uC740?", placeholder: "\uB530\uB73B\uD568, \uAE34\uC7A5, \uD638\uD761\uC758 \uB9AC\uB4EC...", hint: "\uB208\uC744 \uAC10\uACE0 10\uCD08\uB9CC \uB290\uAEF4\uBCF4\uC138\uC694" },
      { id: "r2", prompt: "\uC9C0\uAE08 \uB0B4 \uB9C8\uC74C\uC18D\uC5D0 \uC788\uB294 \uAC10\uC815\uC740?", placeholder: "\uBD88\uC548, \uD3C9\uC628, \uAE30\uB300, \uADF8\uB9AC\uC6C0...", hint: "\uC88B\uC740 \uAC10\uC815\uC774 \uC544\uB2C8\uC5B4\uB3C4 \uAD1C\uCC2E\uC544\uC694" }
    ]
  },
  {
    id: "trunk",
    title: "\uC904\uAE30 \u2014 \uB098\uC758 \uAC00\uCE58",
    emoji: "\u{1F333}",
    color: "#2D6A3A",
    accent: "#88D4A0",
    bg: "rgba(45,106,58,0.12)",
    border: "rgba(136,212,160,0.2)",
    desc: "\uB0B4\uAC00 \uC18C\uC911\uD788 \uC5EC\uAE30\uB294 \uAC83\uB4E4\uB85C \uC774\uB8E8\uC5B4\uC838\uC694.",
    questions: [
      { id: "t1", prompt: "\uB0B4\uAC00 \uAC00\uC7A5 \uC18C\uC911\uD558\uAC8C \uC5EC\uAE30\uB294 \uAC00\uCE58\uB294?", placeholder: "\uAD00\uACC4, \uC131\uC7A5, \uC790\uC720, \uCC3D\uC758, \uC815\uC9C1...", hint: "\uC9C0\uAE08 \uAC00\uC7A5 \uBA3C\uC800 \uB5A0\uC624\uB974\uB294 \uAC83" },
      { id: "t2", prompt: "\uBBF8\uB798\uC758 \uB098\uC5D0\uAC8C \uC804\uD558\uACE0 \uC2F6\uC740 \uD55C \uB9C8\uB514\uB294?", placeholder: "\uD3EC\uAE30\uD558\uC9C0 \uB9C8, \uB10C \uCDA9\uBD84\uD574, \uC26C\uC5B4\uB3C4 \uB3FC...", hint: "\uC9C4\uC2EC\uC744 \uB2F4\uC544 \uC368\uBCF4\uC138\uC694" }
    ]
  },
  {
    id: "branches",
    title: "\uAC00\uC9C0 \u2014 \uB098\uC758 \uD589\uB3D9",
    emoji: "\u{1F33F}",
    color: "#2D6A3A",
    accent: "#B8E8C4",
    bg: "rgba(45,106,58,0.09)",
    border: "rgba(184,232,196,0.2)",
    desc: "\uAC00\uCE58\uB97C \uD5A5\uD55C \uAD6C\uCCB4\uC801\uC778 \uD55C \uAC78\uC74C\uC774\uC5D0\uC694.",
    questions: [
      { id: "b1", prompt: "\uC624\uB298 \uC2E4\uCC9C\uD560 \uC218 \uC788\uB294 \uC791\uC740 \uD589\uB3D9\uC740?", placeholder: "5\uBD84 \uC0B0\uCC45, \uBB3C \uD55C \uC794, \uC88B\uC544\uD558\uB294 \uC74C\uC545...", hint: "\uC544\uC8FC \uC791\uC544\uB3C4 \uAD1C\uCC2E\uC544\uC694" },
      { id: "b2", prompt: "\uC774\uBC88 \uC8FC \uB098\uC5D0\uAC8C \uC8FC\uACE0 \uC2F6\uC740 \uC120\uBB3C\uC740?", placeholder: "\uCDA9\uBD84\uD55C \uC7A0, \uB9DB\uC788\uB294 \uAC83, \uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04...", hint: "\uB098\uB97C \uC704\uD55C \uC120\uBB3C" }
    ]
  }
];
function ForestBg({ stage }) {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 360 220", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%", display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "fSky", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#0A1A0E" }), /* @__PURE__ */ React.createElement("stop", { offset: "45%", stopColor: "#153522" }), /* @__PURE__ */ React.createElement("stop", { offset: "80%", stopColor: "#1E4A2C" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#2A5E38" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "fGround", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#1E3A14" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#0F2208" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "moonG", cx: "50%", cy: "50%", r: "50%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#FFF8E0", stopOpacity: "0.95" }), /* @__PURE__ */ React.createElement("stop", { offset: "55%", stopColor: "#F0E0A0", stopOpacity: "0.4" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#F0E0A0", stopOpacity: "0" })), /* @__PURE__ */ React.createElement("filter", { id: "fGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "3", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" })))), /* @__PURE__ */ React.createElement("rect", { width: "360", height: "220", fill: "url(#fSky)" }), /* @__PURE__ */ React.createElement("circle", { cx: "298", cy: "32", r: "24", fill: "url(#moonG)" }), /* @__PURE__ */ React.createElement("circle", { cx: "298", cy: "32", r: "15", fill: "#FFF8E0", opacity: "0.92" }), [[28, 16, 1.1], [72, 10, 0.8], [118, 18, 1], [168, 7, 0.9], [215, 14, 1.2], [248, 24, 0.8], [338, 15, 1.1], [52, 32, 0.7], [135, 28, 0.9], [178, 36, 0.7], [225, 38, 0.8], [268, 20, 1], [325, 35, 0.8], [14, 40, 0.7], [348, 22, 0.8]].map(([x, y, r], i) => /* @__PURE__ */ React.createElement(
    "circle",
    {
      key: i,
      cx: x,
      cy: y,
      r,
      fill: "white",
      opacity: 0.4 + i % 3 * 0.15,
      style: { animation: `shimmer ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }
    }
  )), stage >= 1 && [[75, 118], [118, 95], [198, 108], [244, 98], [158, 82]].map(([x, y], i) => /* @__PURE__ */ React.createElement(
    "circle",
    {
      key: i,
      cx: x,
      cy: y,
      r: 1.8,
      fill: "#B8F0A0",
      filter: "url(#fGlow)",
      className: "firefly-anim",
      style: { animationDelay: `${i * 0.8}s`, animationDuration: `${3 + i * 0.5}s` }
    }
  )), [[18, 162, 11, 52], [48, 152, 14, 62], [318, 157, 12, 56], [342, 150, 10, 48]].map(([x, y, w, h], i) => /* @__PURE__ */ React.createElement("g", { key: i, opacity: "0.22" }, /* @__PURE__ */ React.createElement("rect", { x: x - w * 0.2, y: y - h, width: w * 0.38, height: h, rx: "3", fill: "#0F2210" }), /* @__PURE__ */ React.createElement("ellipse", { cx: x, cy: y - h + 4, rx: w, ry: w * 0.8, fill: "#0F2210" }))), [[38, 175, 17, 70], [88, 168, 20, 78], [268, 172, 19, 73], [308, 166, 15, 65]].map(([x, y, w, h], i) => /* @__PURE__ */ React.createElement("g", { key: i, opacity: "0.38" }, /* @__PURE__ */ React.createElement("rect", { x: x - w * 0.2, y: y - h, width: w * 0.38, height: h, rx: "3", fill: "#152818" }), /* @__PURE__ */ React.createElement("ellipse", { cx: x, cy: y - h + 5, rx: w, ry: w * 0.88, fill: "#152818" }), /* @__PURE__ */ React.createElement("ellipse", { cx: x, cy: y - h - 8, rx: w * 0.68, ry: w * 0.68, fill: "#1C3520" }))), /* @__PURE__ */ React.createElement("ellipse", { cx: "180", cy: "194", rx: "200", ry: "18", fill: "#2A5038", opacity: "0.28", className: "mist-anim" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "180", cy: "188", rx: "155", ry: "12", fill: "#3A6048", opacity: "0.2", style: { animation: "mist 8s ease-in-out 1.5s infinite" } }), /* @__PURE__ */ React.createElement("ellipse", { cx: "180", cy: "214", rx: "200", ry: "20", fill: "url(#fGround)" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "206", width: "360", height: "14", fill: "#0F2208" }), [22, 52, 82, 112, 142, 172, 202, 232, 262, 292, 322, 352].map((x, i) => /* @__PURE__ */ React.createElement("g", { key: i, opacity: "0.65" }, /* @__PURE__ */ React.createElement("path", { d: `M${x} 206 Q${x - 4} 196 ${x - 2} 191`, stroke: "#204A18", strokeWidth: "1.4", fill: "none" }), /* @__PURE__ */ React.createElement("path", { d: `M${x} 206 Q${x + 3} 195 ${x + 1} 189`, stroke: "#2A5A20", strokeWidth: "1.1", fill: "none" }), /* @__PURE__ */ React.createElement("path", { d: `M${x} 206 Q${x + 6} 198 ${x + 5} 194`, stroke: "#204A18", strokeWidth: "0.9", fill: "none" }))));
}
function MainTreeSVG({ stage, answers, animated }) {
  const rootsDone = stage >= 1;
  const trunkDone = stage >= 2;
  const branchDone = stage >= 3;
  const answered = Object.values(answers || {}).filter((v) => v?.trim().length > 0).length;
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 360 220", xmlns: "http://www.w3.org/2000/svg", style: { width: "100%", height: "100%", display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "tTrunk", x1: "0", y1: "0", x2: "1", y2: "0" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#2E1F14" }), /* @__PURE__ */ React.createElement("stop", { offset: "40%", stopColor: "#6B5240" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#3A2818" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "tLeaf1", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#5CAF6A" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#2D6A3A" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "tLeaf2", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#4A8A54" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#1E4A28" })), /* @__PURE__ */ React.createElement("filter", { id: "tGlow" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "2.5", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("filter", { id: "tShadow" }, /* @__PURE__ */ React.createElement("feDropShadow", { dx: "3", dy: "4", stdDeviation: "4", floodColor: "#0A1A0E", floodOpacity: "0.55" }))), rootsDone && /* @__PURE__ */ React.createElement("g", { opacity: "0.88" }, /* @__PURE__ */ React.createElement("path", { d: "M170 210 Q150 218 126 214", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M174 212 Q160 224 142 222", fill: "none", stroke: "#4A3728", strokeWidth: "3.5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M190 210 Q210 218 230 213", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M186 212 Q200 225 216 222", fill: "none", stroke: "#4A3728", strokeWidth: "3.5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M180 213 Q180 226 172 230", fill: "none", stroke: "#2E1F14", strokeWidth: "3", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "180", cy: "213", rx: "28", ry: "4", fill: "#88D4A0", opacity: "0.14", style: { animation: "shimmer 3s ease-in-out infinite" } })), /* @__PURE__ */ React.createElement("g", { className: rootsDone ? "tree-sway" : "" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M172 210 Q168 180 166 155 Q164 130 166 108",
      fill: "none",
      stroke: "url(#tTrunk)",
      strokeWidth: "22",
      strokeLinecap: "round",
      opacity: rootsDone ? 1 : 0.3,
      style: { transition: "opacity 1s", filter: rootsDone ? "url(#tShadow)" : void 0 }
    }
  ), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M176 208 Q173 178 172 153 Q171 130 173 110",
      fill: "none",
      stroke: "#8B6B50",
      strokeWidth: "5.5",
      strokeLinecap: "round",
      opacity: rootsDone ? 0.38 : 0.08,
      style: { transition: "opacity 1s" }
    }
  ), trunkDone && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("path", { d: "M168 162 Q142 148 120 136", fill: "none", stroke: "#4A3728", strokeWidth: "9", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M120 136 Q102 124 90  118", fill: "none", stroke: "#3A2818", strokeWidth: "6", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M120 136 Q107 118 102 108", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M168 155 Q194 140 214 130", fill: "none", stroke: "#4A3728", strokeWidth: "9", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M214 130 Q230 118 242 112", fill: "none", stroke: "#3A2818", strokeWidth: "6", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M214 130 Q222 112 224 103", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M167 142 Q164 118 162 102", fill: "none", stroke: "#4A3728", strokeWidth: "8", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M162 102 Q156 86  152 78", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M162 102 Q170 86  174 78", fill: "none", stroke: "#3A2818", strokeWidth: "5", strokeLinecap: "round" })), rootsDone && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("ellipse", { cx: "164", cy: "105", rx: "42", ry: "36", fill: "url(#tLeaf1)", opacity: "0.95", filter: "url(#tGlow)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "157", cy: "98", rx: "29", ry: "23", fill: "#4A8A54", opacity: "0.68" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "174", cy: "100", rx: "26", ry: "20", fill: "#5CAF6A", opacity: "0.48" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "90", rx: "16", ry: "12", fill: "#7ACC88", opacity: "0.35" })), trunkDone && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("ellipse", { cx: "106", cy: "118", rx: "31", ry: "25", fill: "url(#tLeaf2)", opacity: "0.88" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "98", cy: "112", rx: "20", ry: "17", fill: "#4A8A54", opacity: "0.66" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "96", cy: "107", rx: "13", ry: "10", fill: "#5CAF6A", opacity: "0.48" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "220", cy: "115", rx: "31", ry: "25", fill: "url(#tLeaf2)", opacity: "0.88" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "228", cy: "110", rx: "20", ry: "17", fill: "#4A8A54", opacity: "0.66" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "230", cy: "106", rx: "13", ry: "10", fill: "#5CAF6A", opacity: "0.48" })), branchDone && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("ellipse", { cx: "162", cy: "78", rx: "27", ry: "21", fill: "url(#tLeaf1)", opacity: "0.9" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "160", cy: "72", rx: "17", ry: "14", fill: "#5CAF6A", opacity: "0.68" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "88", cy: "108", rx: "19", ry: "15", fill: "url(#tLeaf2)", opacity: "0.83" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "82", cy: "103", rx: "12", ry: "9", fill: "#4A8A54", opacity: "0.6" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "236", cy: "105", rx: "19", ry: "15", fill: "url(#tLeaf2)", opacity: "0.83" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "242", cy: "100", rx: "12", ry: "9", fill: "#4A8A54", opacity: "0.6" })), answered >= 2 && rootsDone && /* @__PURE__ */ React.createElement("g", null, [{ cx: 110, cy: 112, c: "#F4A0B8" }, { cx: 218, cy: 110, c: "#FCD34D" }, { cx: 158, cy: 74, c: "#B8E8C4" }].slice(0, Math.min(Math.floor(answered / 2), 3)).map((p, i) => /* @__PURE__ */ React.createElement("g", { key: i, className: "bloom-pop", style: { animationDelay: `${i * 0.15}s` } }, [0, 72, 144, 216, 288].map((a) => /* @__PURE__ */ React.createElement(
    "ellipse",
    {
      key: a,
      cx: p.cx + Math.cos(a * Math.PI / 180) * 6,
      cy: p.cy + Math.sin(a * Math.PI / 180) * 6,
      rx: "4.5",
      ry: "3",
      fill: p.c,
      opacity: "0.94",
      transform: `rotate(${a + 36},${p.cx + Math.cos(a * Math.PI / 180) * 6},${p.cy + Math.sin(a * Math.PI / 180) * 6})`
    }
  )), /* @__PURE__ */ React.createElement("circle", { cx: p.cx, cy: p.cy, r: "3.5", fill: "#FFF8A0" }), /* @__PURE__ */ React.createElement("circle", { cx: p.cx, cy: p.cy, r: "1.5", fill: "#E8C840" })))), branchDone && answered >= 5 && /* @__PURE__ */ React.createElement("g", { fill: "#F9C8D8", opacity: "0.82", style: { animation: "sway 4s ease-in-out infinite", transformOrigin: "94px 108px" } }, /* @__PURE__ */ React.createElement("path", { d: "M94 108 Q84 100 87 92 Q94 100 94 108Z" }), /* @__PURE__ */ React.createElement("path", { d: "M94 108 Q104 100 101 92 Q94 100 94 108Z" }), /* @__PURE__ */ React.createElement("path", { d: "M94 108 Q85 115 87 121 Q94 114 94 108Z", opacity: "0.7" }), /* @__PURE__ */ React.createElement("path", { d: "M94 108 Q103 115 101 121 Q94 114 94 108Z", opacity: "0.7" }), /* @__PURE__ */ React.createElement("line", { x1: "94", y1: "108", x2: "93", y2: "114", stroke: "#A06880", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("line", { x1: "94", y1: "108", x2: "95", y2: "114", stroke: "#A06880", strokeWidth: "1" }))), animated && answered > 0 && [162, 177, 150, 185].map((x, i) => /* @__PURE__ */ React.createElement(
    "ellipse",
    {
      key: i,
      cx: x,
      cy: 82 + i * 4,
      rx: "4",
      ry: "2.5",
      fill: "#5CAF6A",
      opacity: "0.7",
      style: { animation: `leafDrop 1.2s ease ${i * 0.15}s forwards` }
    }
  )));
}
function TreeGame({ onExit }) {
  const { useState, useEffect, useRef } = React;
  const [stageIdx, setStageIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [qIdx, setQIdx] = useState(0);
  const [screen, setScreen] = useState("intro");
  const [sessionSec, setSessionSec] = useState(0);
  const [leafAnim, setLeafAnim] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = "tree-game-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = TREE_STYLE;
      document.head.appendChild(s);
    }
  }, []);
  useEffect(() => {
    if (screen !== "writing") return;
    const t = setInterval(() => setSessionSec(Math.round((Date.now() - startRef.current) / 1e3)), 1e3);
    return () => clearInterval(t);
  }, [screen]);
  const currentStage = STAGES[stageIdx];
  const currentQ = currentStage?.questions[qIdx];
  const answered = Object.values(answers).filter((v) => v?.trim().length > 0).length;
  const canNext = answers[currentQ?.id]?.trim().length > 0;
  const handleNext = () => {
    setLeafAnim(true);
    setTimeout(() => setLeafAnim(false), 1200);
    setTimeout(() => {
      if (qIdx < currentStage.questions.length - 1) {
        setQIdx(qIdx + 1);
      } else if (stageIdx < STAGES.length - 1) {
        setStageIdx(stageIdx + 1);
        setQIdx(0);
      } else {
        setScreen("done");
      }
    }, 200);
  };
  const handleFinish = async () => {
    setFinishing(true);
    const filledCount = Object.values(answers).filter((v) => v?.trim().length > 1).length;
    const score = filledCount * 20 + Math.min(sessionSec * 0.3, 30);
    try {
      const res = await GameEngine.saveSession({
        gameId: "tree",
        moduleType: "ACT",
        score: Math.round(score),
        durationSec: sessionSec,
        metadata: { stages_completed: stageIdx + 1, answers_filled: filledCount }
      });
      onExit?.({
        score: Math.round(score),
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || []
      });
    } catch {
      onExit?.({ score: Math.round(score), expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };
  const Header = () => /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    background: "rgba(10,24,14,0.88)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(136,212,160,0.1)",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F333}"), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 15,
    fontWeight: 700,
    color: GT.cream,
    fontFamily: "'Noto Serif KR',serif",
    letterSpacing: "-0.3px"
  } }, "\uB0B4\uBA74\uC758 \uB098\uBB34")), /* @__PURE__ */ React.createElement("button", { onClick: () => onExit(null), style: {
    fontFamily: "'Noto Sans KR',sans-serif",
    background: "rgba(136,212,160,0.1)",
    color: GT.skyGlow,
    border: "1px solid rgba(136,212,160,0.18)",
    borderRadius: 10,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer"
  } }, "\uD5C8\uBE0C\uB85C \u2192"));
  if (screen === "intro") return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: GT.dawnDeep, overflow: "hidden" } }, /* @__PURE__ */ React.createElement(Header, null), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 195, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(ForestBg, { stage: 0 })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(MainTreeSVG, { stage: 0, answers: {}, animated: false })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "rgba(10,24,14,0.72)",
    backdropFilter: "blur(8px)",
    borderRadius: 12,
    padding: "7px 18px",
    border: "1px solid rgba(136,212,160,0.18)",
    animation: "fadeUp 0.6s ease"
  } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: GT.leafGlow, margin: 0, fontFamily: "'Noto Sans KR',sans-serif", fontWeight: 500 } }, "\uC0C8\uBCBD \uC232\uC5D0\uC11C \uB098\uB97C \uB9CC\uB098\uB294 \uC2DC\uAC04 \u{1F33F}")))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "18px 18px 28px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(45,106,58,0.14)",
    border: "1px solid rgba(136,212,160,0.18)",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
    animation: "fadeUp 0.5s ease 0.1s both"
  } }, /* @__PURE__ */ React.createElement("h2", { style: {
    fontSize: 16,
    fontWeight: 700,
    color: GT.cream,
    fontFamily: "'Noto Serif KR',serif",
    marginBottom: 6,
    lineHeight: 1.45
  } }, "\uB0B4 \uB9C8\uC74C\uC758 \uB098\uBB34\uB97C \uAC00\uAFB8\uC5B4\uC694"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: GT.muted, lineHeight: 1.8, margin: 0, fontFamily: "'Noto Sans KR',sans-serif" } }, "3\uB2E8\uACC4\uB97C \uB530\uB77C \uBFCC\uB9AC\xB7\uC904\uAE30\xB7\uAC00\uC9C0\uB97C \uC644\uC131\uD558\uBA70", /* @__PURE__ */ React.createElement("br", null), "\uB098\uB9CC\uC758 \uB0B4\uBA74\uC758 \uB098\uBB34\uB97C \uD0A4\uC6CC\uBCF4\uC138\uC694.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 } }, STAGES.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "13px 15px",
    background: "rgba(30,60,40,0.22)",
    border: `1px solid ${s.border}`,
    borderRadius: 15,
    animation: `fadeUp 0.5s ease ${0.2 + i * 0.09}s both`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 40,
    height: 40,
    borderRadius: 11,
    flexShrink: 0,
    background: `rgba(30,60,40,0.45)`,
    border: `1px solid ${s.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20
  } }, s.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 13,
    fontWeight: 700,
    color: GT.cream,
    marginBottom: 2,
    fontFamily: "'Noto Serif KR',serif"
  } }, s.title), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    color: GT.muted,
    lineHeight: 1.45,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, s.desc)), /* @__PURE__ */ React.createElement("div", { style: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(136,212,160,0.1)",
    border: "1px solid rgba(136,212,160,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    color: GT.skyGlow,
    fontWeight: 700
  } }, i + 1)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "tree-btn",
      onClick: () => {
        startRef.current = Date.now();
        setScreen("writing");
      },
      style: {
        background: `linear-gradient(135deg,#5CAF6A,#2D6A3A)`,
        color: "white",
        boxShadow: "0 6px 20px rgba(45,106,58,0.42)"
      }
    },
    "\u{1F331} \uB098\uBB34 \uAC00\uAFB8\uAE30 \uC2DC\uC791"
  )));
  if (screen === "writing") {
    const totalQ = STAGES.reduce((s, st) => s + st.questions.length, 0);
    const doneQ = STAGES.slice(0, stageIdx).reduce((s, st) => s + st.questions.length, 0) + qIdx;
    const progress = Math.round(doneQ / totalQ * 100);
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: GT.dawnDeep, overflow: "hidden" } }, /* @__PURE__ */ React.createElement(Header, null), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 155, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(ForestBg, { stage: stageIdx })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(MainTreeSVG, { stage: stageIdx, answers, animated: leafAnim })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 9px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: "100%",
      width: `${progress}%`,
      background: "linear-gradient(90deg,#5CAF6A,#88D4A0)",
      borderRadius: 99,
      transition: "width 0.5s ease"
    } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: GT.muted, fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap" } }, doneQ, "/", totalQ)))), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      background: "rgba(10,24,14,0.9)",
      borderBottom: "1px solid rgba(136,212,160,0.08)",
      flexShrink: 0
    } }, STAGES.map((s, i) => {
      const isActive = i === stageIdx, isDone = i < stageIdx;
      return /* @__PURE__ */ React.createElement("div", { key: s.id, style: {
        flex: 1,
        padding: "9px 4px",
        textAlign: "center",
        borderBottom: isActive ? `2px solid ${s.accent}` : "2px solid transparent",
        transition: "border-color 0.3s"
      } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, marginBottom: 1 } }, isDone ? "\u2705" : s.emoji), /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 9,
        fontWeight: isActive ? 700 : 400,
        color: isActive ? s.accent : isDone ? GT.muted : "rgba(255,255,255,0.25)",
        fontFamily: "'Noto Sans KR',sans-serif",
        transition: "color 0.3s"
      } }, s.id === "roots" ? "\uBFCC\uB9AC" : s.id === "trunk" ? "\uC904\uAE30" : "\uAC00\uC9C0"));
    })), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { flex: 1, overflowY: "auto", padding: "14px 16px 24px" },
        key: `${stageIdx}-${qIdx}`,
        className: "stage-slide"
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
        marginBottom: 12,
        background: currentStage.bg,
        border: `1px solid ${currentStage.border}`,
        borderRadius: 13
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, currentStage.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 12,
        fontWeight: 700,
        color: currentStage.accent,
        fontFamily: "'Noto Serif KR',serif"
      } }, currentStage.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: GT.muted, fontFamily: "'Noto Sans KR',sans-serif" } }, currentStage.desc)), /* @__PURE__ */ React.createElement("span", { style: {
        marginLeft: "auto",
        fontSize: 10,
        color: GT.muted,
        fontFamily: "'Noto Sans KR',sans-serif"
      } }, qIdx + 1, "/", currentStage.questions.length)),
      /* @__PURE__ */ React.createElement("div", { style: {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(136,212,160,0.1)",
        borderRadius: 18,
        padding: "16px",
        marginBottom: 12
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 10,
        color: GT.leafGlow,
        marginBottom: 9,
        fontFamily: "'Noto Sans KR',sans-serif",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 4
      } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1}"), currentQ?.hint), /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 15,
        fontWeight: 700,
        color: GT.cream,
        lineHeight: 1.55,
        marginBottom: 13,
        fontFamily: "'Noto Serif KR',serif"
      } }, currentQ?.prompt), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          className: "tree-textarea",
          value: answers[currentQ?.id] || "",
          onChange: (e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value })),
          placeholder: currentQ?.placeholder,
          rows: 3,
          autoFocus: true,
          style: {
            background: "rgba(10,24,14,0.65)",
            border: `1.5px solid ${answers[currentQ?.id]?.trim() ? currentStage.accent : "rgba(136,212,160,0.14)"}`,
            color: GT.cream
          }
        }
      )),
      Object.entries(answers).filter(([k, v]) => v?.trim() && k !== currentQ?.id).length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 10,
        color: GT.muted,
        marginBottom: 5,
        fontFamily: "'Noto Sans KR',sans-serif"
      } }, "\uC774\uC804 \uB2F5\uBCC0"), Object.entries(answers).filter(([k, v]) => v?.trim() && k !== currentQ?.id).map(([k, v], i) => {
        const si = STAGES.findIndex((s) => s.questions.some((q) => q.id === k));
        const st = STAGES[si];
        return /* @__PURE__ */ React.createElement("div", { key: k, className: "answer-card", style: {
          fontSize: 11,
          color: GT.muted,
          padding: "6px 10px",
          marginBottom: 4,
          background: "rgba(30,60,40,0.2)",
          border: `1px solid ${st?.border || "rgba(136,212,160,0.1)"}`,
          borderRadius: 8,
          lineHeight: 1.5,
          borderLeft: `2.5px solid ${st?.accent || GT.leafViv}`,
          fontFamily: "'Noto Sans KR',sans-serif"
        } }, v.length > 42 ? v.slice(0, 42) + "..." : v);
      })),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "tree-btn",
          onClick: handleNext,
          disabled: !canNext,
          style: {
            background: canNext ? `linear-gradient(135deg,#5CAF6A,${currentStage.color})` : "rgba(255,255,255,0.07)",
            color: canNext ? "white" : "rgba(255,255,255,0.28)",
            boxShadow: canNext ? "0 6px 20px rgba(45,106,58,0.35)" : "none"
          }
        },
        stageIdx === STAGES.length - 1 && qIdx === currentStage.questions.length - 1 ? "\u{1F333} \uB098\uBB34 \uC644\uC131\uD558\uAE30" : "\uB2E4\uC74C \u2192"
      )
    ));
  }
  if (screen === "done") return /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: GT.dawnDeep,
    animation: "fadeIn 0.5s ease"
  } }, /* @__PURE__ */ React.createElement(Header, null), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 190, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(ForestBg, { stage: 3 })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(MainTreeSVG, { stage: 3, answers, animated: true })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(10,24,14,0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: 16,
    padding: "10px 22px",
    textAlign: "center",
    border: "1px solid rgba(136,212,160,0.28)",
    animation: "fadeUp 0.6s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, marginBottom: 2 } }, "\u{1F333}"), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 14,
    fontWeight: 700,
    color: GT.leafGlow,
    fontFamily: "'Noto Serif KR',serif"
  } }, "\uB0B4\uBA74\uC758 \uB098\uBB34 \uC644\uC131!")))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "18px 18px 28px" } }, /* @__PURE__ */ React.createElement("p", { style: {
    fontSize: 12,
    color: GT.muted,
    lineHeight: 1.8,
    marginBottom: 18,
    textAlign: "center",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, "\uBFCC\uB9AC\xB7\uC904\uAE30\xB7\uAC00\uC9C0\uB97C \uBAA8\uB450 \uCC44\uC6E0\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uC774 \uAE00\uB4E4\uC774 \uB2F9\uC2E0\uC758 \uB9C8\uC74C \uC9C0\uB3C4\uAC00 \uB418\uAE38 \uBC14\uB78D\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 11, marginBottom: 22 } }, STAGES.map((s, si) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: {
    background: "rgba(30,60,40,0.2)",
    border: `1px solid ${s.border}`,
    borderRadius: 15,
    padding: "13px 15px",
    animation: `fadeUp 0.4s ease ${si * 0.1}s both`
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 9 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, s.emoji), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    color: s.accent,
    fontFamily: "'Noto Serif KR',serif"
  } }, s.title)), s.questions.map((q) => answers[q.id] && /* @__PURE__ */ React.createElement("div", { key: q.id, style: {
    fontSize: 12,
    color: GT.softCream,
    lineHeight: 1.65,
    marginBottom: 5,
    paddingLeft: 10,
    borderLeft: `2px solid ${s.accent}`,
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, answers[q.id]))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "tree-btn",
      onClick: handleFinish,
      disabled: finishing,
      style: {
        background: finishing ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,#5CAF6A,#2D6A3A)`,
        color: "white",
        boxShadow: "0 6px 20px rgba(45,106,58,0.42)",
        marginBottom: 10
      }
    },
    finishing ? "\uC800\uC7A5 \uC911..." : "\u2728 \uACBD\uD5D8\uCE58 \uBC1B\uAE30"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "tree-btn-ghost",
      onClick: () => onExit(null),
      style: { border: "1px solid rgba(136,212,160,0.18)", color: GT.muted }
    },
    "\uACBD\uD5D8\uCE58 \uC5C6\uC774 \uD5C8\uBE0C\uB85C \u2192"
  )));
  return null;
}
