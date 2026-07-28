const { useState, useEffect } = React;
const saveLogin = (a, r, u) => {
  try {
    if (a) localStorage.setItem("access_token", a);
    if (r) localStorage.setItem("refresh_token", r);
    if (u) localStorage.setItem("current_user", JSON.stringify(u));
  } catch {
  }
};
const logEvent = (code, event, variant) => {
  try {
    fetch("/api/partner/entry-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, event, variant })
    });
  } catch {
  }
};
function PartnerEntry() {
  const params = new URLSearchParams(location.search);
  const code = (params.get("p") || "").toUpperCase();
  const ssoToken = params.get("sso_token") || "";
  const [status, setStatus] = useState("loading");
  const [cfg, setCfg] = useState(null);
  const [ssoDone, setSsoDone] = useState(false);
  useEffect(() => {
    (async () => {
      if (!code) {
        location.replace("/");
        return;
      }
      try {
        localStorage.setItem("maumful_partner_code", code);
      } catch {
      }
      let c = null;
      try {
        const r = await fetch(`/api/partner/config?p=${encodeURIComponent(code)}`).then((res) => res.json());
        if (r.success) c = r.data;
      } catch {
      }
      if (ssoToken) {
        try {
          const r = await fetch("/api/auth/partner-sso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partnerCode: code, ssoToken })
          }).then((res) => res.json());
          if (r.success && r.data) {
            saveLogin(r.data.accessToken, r.data.refreshToken, r.data.user);
            setSsoDone(true);
          }
        } catch {
        }
      }
      if (!c) {
        setStatus("redirect");
        location.replace("/");
        return;
      }
      logEvent(code, "entry_view");
      setCfg(c);
      setStatus("ready");
    })();
  }, []);
  if (status !== "ready" || !cfg) {
    return React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: "#F3F6F2", color: "#8B948D", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026");
  }
  const brand = cfg.primary_color || "#2D6A4F";
  const name = cfg.name || "\uC81C\uD734\uC0AC";
  const headline = cfg.entry_headline || `${name} \uD68C\uC6D0\uB2D8,
\uB9C8\uC74C\uD480\uC5D0 \uC624\uC2E0 \uAC78 \uD658\uC601\uD574\uC694`;
  const subcopy = cfg.entry_subcopy || cfg.welcome_message || "3\uBD84 \uC2EC\uB9AC\uAC80\uC0AC\uB85C \uC9C0\uAE08 \uB0B4 \uB9C8\uC74C \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uBCF4\uC138\uC694.";
  const benefit = cfg.entry_benefit;
  const ctaLabel = cfg.entry_cta_label || "\uBB34\uB8CC\uB85C \uB0B4 \uB9C8\uC74C \uAC80\uC0AC \uC2DC\uC791";
  const ctaGo = cfg.entry_cta_go || "test:PHQ9";
  const tests = String(cfg.featured_tests || "").split(",").map((s) => s.trim()).filter(Boolean);
  const goCore = (target) => {
    logEvent(code, "cta_click");
    location.href = target ? `/?go=${encodeURIComponent(target)}` : "/";
  };
  const F = "'Noto Sans KR',sans-serif";
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex flex-col", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-5 py-3", style: { background: brand + "14", borderBottom: `1px solid ${brand}22` } }, cfg.logo_url ? /* @__PURE__ */ React.createElement("img", { src: cfg.logo_url, alt: name, className: "h-6 object-contain" }) : /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm", style: { color: brand } }, name), /* @__PURE__ */ React.createElement("span", { style: { color: "#B7C0B9" } }, "\xD7"), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-sm", style: { color: "#2D6A4F" } }, "\u{1F33F} \uB9C8\uC74C\uD480")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 w-full max-w-md mx-auto px-6 py-8 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold mb-2", style: { color: brand } }, name, " \uD68C\uC6D0 \uC804\uC6A9"), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-extrabold leading-snug whitespace-pre-line", style: { color: "#1E2621" } }, headline), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-3 leading-relaxed", style: { color: "#54605A" } }, subcopy), ssoDone && /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold mt-3", style: { color: brand } }, "\u2713 \uC774\uBBF8 ", name, " \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uB428 \xB7 \uBCC4\uB3C4 \uAC00\uC785 \uC5C6\uC774 \uBC14\uB85C \uC774\uC6A9"), benefit && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "mt-5 rounded-xl px-4 py-3 text-sm font-bold",
      style: { background: "#F8EAD8", color: "#A85B12", border: "1px dashed #E6C89B" }
    },
    "\u{1F381} ",
    benefit
  ), tests.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-semibold tracking-wide uppercase mb-2", style: { color: "#8B948D" } }, name, " \uD68C\uC6D0 \uCD94\uCC9C \uAC80\uC0AC"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, tests.map((t) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: t,
      className: "text-xs px-3 py-1.5 rounded-full bg-white",
      style: { border: "1px solid #D2DAD3", color: "#54605A" }
    },
    t
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1", style: { minHeight: 24 } }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => goCore(ctaGo),
      className: "w-full py-3.5 rounded-xl font-extrabold text-white text-base",
      style: { background: "#2D6A4F" }
    },
    ctaLabel,
    " \u2192"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => goCore(null),
      className: "mt-3 text-xs underline text-center",
      style: { color: "#8B948D" }
    },
    "\uB9C8\uC74C\uD480 \uC804\uCCB4 \uC11C\uBE44\uC2A4 \uB458\uB7EC\uBCF4\uAE30"
  )));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(PartnerEntry, null));
