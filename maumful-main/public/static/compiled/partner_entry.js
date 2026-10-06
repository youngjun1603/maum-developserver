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
const F = "'Noto Sans KR',sans-serif";
const SERVICES = [
  {
    emoji: "\u{1F9E9}",
    name: "\uC2EC\uB9AC\uAC80\uC0AC 10\uC885",
    tag: "\uBB34\uB8CC \uD3EC\uD568",
    go: "test:PHQ9",
    desc: "\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC131\uACA9\xB7\uBC88\uC544\uC6C3\xB7\uC9C1\uC5C5\uD765\uBBF8 \uB4F1 \uACF5\uC778 \uCC99\uB3C4 \uAE30\uBC18 \uC790\uAC00\uAC80\uC0AC. \uACB0\uACFC\uB294 AI\uAC00 \uC26C\uC6B4 \uB9D0\uB85C \uD480\uC5B4\uB4DC\uB824\uC694."
  },
  {
    emoji: "\u{1F4AC}",
    name: "AI \uB9C8\uC74C \uC0C1\uB2F4",
    go: "",
    desc: "24\uC2DC\uAC04 \uC5B8\uC81C\uB4E0 \uB300\uD654. \uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uB0B4 \uC0C1\uD669\uC5D0 \uB9DE\uCD98 \uACF5\uAC10\uACFC \uC81C\uC548\uC744 \uBC1B\uC544\uC694."
  },
  {
    emoji: "\u{1F495}",
    name: "\uB9C8\uC74C\uCEE4\uD50C",
    go: "",
    desc: "\uD30C\uD2B8\uB108\uC640\uC758 \uC2EC\uB9AC \uAD81\uD569\xB7\uAD00\uACC4 \uCF54\uCE58\xB7\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C\uAE4C\uC9C0 \uD55C \uBC88\uC5D0."
  },
  {
    emoji: "\u{1F3AE}",
    name: "\uB9C8\uC74C\uAC8C\uC784",
    go: "",
    desc: "\uAC80\uC0AC \uACB0\uACFC\uC5D0 \uB9DE\uCD98 \uD790\uB9C1 \uAC8C\uC784\uC73C\uB85C \uAC00\uBCCD\uAC8C \uB9C8\uC74C\uC744 \uB3CC\uBD10\uC694."
  },
  {
    emoji: "\u{1F491}",
    name: "\uB9C8\uC74C\uBD80\uBD80",
    url: "https://bubu.maumful.com",
    desc: "\uBD80\uBD80\uC758 \uB300\uD654\uB97C \uC11C\uB85C\uC758 \uC5B8\uC5B4\uB85C \uD1B5\uC5ED\uD574 \uC624\uD574\uB97C \uD480\uC5B4\uB4DC\uB824\uC694."
  },
  {
    emoji: "\u{1F46A}",
    name: "\uB9C8\uC74C\uC138\uB300",
    url: "https://sedae.maumful.com",
    desc: "\uBD80\uBAA8\u2013\uC790\uB140 \uC138\uB300 \uAC04 \uB300\uD654\uB97C \uBC88\uC5ED\uD574 \uAC08\uB4F1\uC744 \uC904\uC5EC\uC694."
  },
  {
    emoji: "\u{1F9A6}",
    name: "\uB9C8\uC74C\uC218\uB2EC",
    url: "https://maumotter.com",
    desc: "\uC544\uC774\uC758 \uAC10\uC815 \uC2E0\uD638\uB97C \uC77D\uC5B4 \uBD80\uBAA8\uC5D0\uAC8C \uC804\uD574\uC694."
  },
  {
    emoji: "\u{1F43E}",
    name: "\uB9C8\uC74C\uACC1",
    url: "https://maumgyeot.com",
    desc: "\uBC18\uB824\uB3D9\uBB3C\uC758 \uD589\uB3D9\xB7\uAC10\uC815\uC744 \uD1B5\uC5ED\uD574 \uB354 \uAC00\uAE4C\uC6CC\uC838\uC694."
  }
];
function PartnerEntry() {
  const params = new URLSearchParams(location.search);
  const code = (params.get("p") || "").toUpperCase();
  const ssoToken = params.get("sso_token") || "";
  const [status, setStatus] = useState("loading");
  const [cfg, setCfg] = useState(null);
  const [ssoDone, setSsoDone] = useState(false);
  const [ssoFailed, setSsoFailed] = useState(false);
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
            try {
              localStorage.setItem("maumful_set_nickname", "1");
            } catch {
            }
            setSsoDone(true);
          } else {
            setSsoFailed(true);
          }
        } catch {
          setSsoFailed(true);
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
    return React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: "#F3F6F2", color: "#8B948D", fontFamily: F } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026");
  }
  const brand = cfg.primary_color || "#2D6A4F";
  const name = cfg.name || "\uC81C\uD734\uC0AC";
  const headline = cfg.entry_headline || `${name} \uD68C\uC6D0\uB2D8,
\uB9C8\uC74C\uD480\uC5D0 \uC624\uC2E0 \uAC78 \uD658\uC601\uD574\uC694`;
  const subcopy = cfg.entry_subcopy || cfg.welcome_message || "\uC2EC\uB9AC\uAC80\uC0AC\uBD80\uD130 AI \uC0C1\uB2F4\uAE4C\uC9C0, \uC9C0\uAE08 \uB0B4 \uB9C8\uC74C\uC744 \uAC00\uBCCD\uAC8C \uB3CC\uBD10 \uBCF4\uC138\uC694.";
  const benefit = cfg.entry_benefit;
  const ctaLabel = cfg.entry_cta_label || "\uBB34\uB8CC\uB85C \uB0B4 \uB9C8\uC74C \uAC80\uC0AC \uC2DC\uC791";
  const ctaGo = cfg.entry_cta_go || "test:PHQ9";
  const goCore = (target) => {
    logEvent(code, "cta_click");
    location.href = target ? `/?go=${encodeURIComponent(target)}` : "/";
  };
  const openService = (s) => {
    logEvent(code, "service_click", s.name);
    if (s.url) {
      window.open(s.url, "_blank", "noopener");
      return;
    }
    goCore(s.go || null);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex flex-col", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-5 py-3", style: { background: brand + "14", borderBottom: `1px solid ${brand}22` } }, cfg.logo_url ? /* @__PURE__ */ React.createElement("img", { src: cfg.logo_url, alt: name, className: "h-6 object-contain max-w-[140px]" }) : /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm", style: { color: brand } }, name), /* @__PURE__ */ React.createElement("span", { style: { color: "#B7C0B9" } }, "\xD7"), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-sm", style: { color: "#2D6A4F" } }, "\u{1F33F} \uB9C8\uC74C\uD480")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-8 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold mb-2", style: { color: brand } }, name, " \uD68C\uC6D0 \uC804\uC6A9"), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl sm:text-3xl font-extrabold leading-snug whitespace-pre-line", style: { color: "#1E2621" } }, headline), /* @__PURE__ */ React.createElement("p", { className: "text-sm sm:text-base mt-3 leading-relaxed", style: { color: "#54605A" } }, subcopy), ssoDone && /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold mt-3", style: { color: brand } }, "\u2713 \uC774\uBBF8 ", name, " \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uB428 \xB7 \uBCC4\uB3C4 \uAC00\uC785 \uC5C6\uC774 \uBC14\uB85C \uC774\uC6A9"), ssoFailed && !ssoDone && /* @__PURE__ */ React.createElement("div", { className: "text-xs mt-3 rounded-lg px-3 py-2", style: { background: "#FEF3E2", color: "#A85B12", border: "1px solid #F4D9AE" } }, "\uC790\uB3D9 \uB85C\uADF8\uC778\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC5B4\uC694. \uC544\uB798\uC5D0\uC11C \uACC4\uC18D\uD558\uAC70\uB098 ", name, "\uC5D0\uC11C \uB2E4\uC2DC \uB20C\uB7EC \uC811\uC18D\uD574 \uC8FC\uC138\uC694."), benefit && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "mt-5 rounded-xl px-4 py-3 text-sm font-bold",
      style: { background: "#F8EAD8", color: "#A85B12", border: "1px dashed #E6C89B" }
    },
    "\u{1F381} ",
    benefit
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => goCore(ctaGo),
      className: "mt-6 w-full py-3.5 rounded-xl font-extrabold text-white text-base",
      style: { background: "#2D6A4F" }
    },
    ctaLabel,
    " \u2192"
  ), /* @__PURE__ */ React.createElement("div", { className: "mt-9" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-semibold tracking-wide uppercase mb-3", style: { color: "#8B948D" } }, "\uB9C8\uC74C\uD480\uC774 \uC81C\uACF5\uD558\uB294 \uC11C\uBE44\uC2A4"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, SERVICES.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.name,
      onClick: () => openService(s),
      className: "text-left bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-300 hover:shadow-sm transition"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, s.emoji), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm", style: { color: "#1E2621" } }, s.name), s.tag && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: "#E7F3EC", color: "#2D6A4F" } }, s.tag)),
    /* @__PURE__ */ React.createElement("p", { className: "text-xs leading-relaxed", style: { color: "#6B746E" } }, s.desc),
    /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold mt-2", style: { color: brand } }, s.url ? "\uC11C\uBE44\uC2A4 \uC5F4\uAE30 \u2197" : "\uBC14\uB85C\uAC00\uAE30 \u2192")
  )))), /* @__PURE__ */ React.createElement("div", { className: "mt-9 rounded-2xl bg-white border border-gray-100 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-sm mb-3", style: { color: "#1E2621" } }, "\uC548\uC2EC\uD558\uACE0 \uC774\uC6A9\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2 text-xs leading-relaxed", style: { color: "#54605A" } }, /* @__PURE__ */ React.createElement("li", null, "\u{1F916} ", /* @__PURE__ */ React.createElement("strong", null, "\uBAA8\uB4E0 \uB300\uD654\uB294 AI\uAC00 \uC804\uB2F4"), "\uD569\uB2C8\uB2E4. \uC0C1\uB2F4\uC0AC \uB9E4\uCE6D\uC774\uB098 \uC0AC\uB78C\uC758 \uAC1C\uC785\xB7\uC5F4\uB78C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\u{1F512} \uC785\uB825\uD558\uC2E0 \uB0B4\uC6A9\uC740 ", /* @__PURE__ */ React.createElement("strong", null, "\uC678\uBD80 AI \uD559\uC2B5\uC5D0 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC73C\uBA70"), ", \uD68C\uC0AC \uB2F4\uB2F9\uC790\xB7\uC81C3\uC790\uC5D0\uAC8C \uACF5\uC720\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\u{1FA7A} \uBCF8 \uC11C\uBE44\uC2A4\uB294 \uC790\uAE30\uC774\uD574\uB97C \uB3D5\uB294 ", /* @__PURE__ */ React.createElement("strong", null, "\uCC38\uACE0\uC6A9"), "\uC774\uBA70 \uC758\uD559\uC801 \uC9C4\uB2E8\xB7\uCE58\uB8CC\uAC00 \uC544\uB2D9\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\u{1F198} \uD798\uB4E0 \uB9C8\uC74C\uC774 \uB4E4 \uB550 24\uC2DC\uAC04 \uB3C4\uC6C0\uC744 \uBC1B\uC744 \uC218 \uC788\uC5B4\uC694 \u2014 ", /* @__PURE__ */ React.createElement("strong", null, "\uC790\uC0B4\uC608\uBC29 \uC0C1\uB2F4\uC804\uD654 109"), ", \uC815\uC2E0\uAC74\uAC15 \uC704\uAE30\uC0C1\uB2F4 1577-0199."))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => goCore(null),
      className: "mt-6 text-xs underline text-center",
      style: { color: "#8B948D" }
    },
    "\uB9C8\uC74C\uD480 \uC804\uCCB4 \uC11C\uBE44\uC2A4 \uB458\uB7EC\uBCF4\uAE30"
  )), /* @__PURE__ */ React.createElement("footer", { className: "w-full border-t border-gray-100 bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-5 sm:px-6 py-6 text-[11px] leading-relaxed text-center", style: { color: "#9AA39C" } }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold", style: { color: "#6B746E" } }, "\u{1F33F} \uB9C8\uC74C\uD480 \xB7 \uB9C8\uC74C\uC11C\uBE44\uC2A4"), /* @__PURE__ */ React.createElement("div", { className: "mt-1" }, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638 780-31-01832 \xB7 \uD1B5\uC2E0\uD310\uB9E4\uC5C5\uC2E0\uACE0 \uC81C2026-\uC11C\uC6B8\uC601\uB4F1\uD3EC-1157"), /* @__PURE__ */ React.createElement("div", { className: "mt-1" }, /* @__PURE__ */ React.createElement("button", { onClick: () => goCore(null), className: "underline" }, "\uC774\uC6A9\uC57D\uAD00"), /* @__PURE__ */ React.createElement("span", { className: "mx-1.5" }, "\xB7"), /* @__PURE__ */ React.createElement("button", { onClick: () => goCore(null), className: "underline" }, "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68"), /* @__PURE__ */ React.createElement("span", { className: "mx-1.5" }, "\xB7"), /* @__PURE__ */ React.createElement("button", { onClick: () => goCore(null), className: "underline" }, "\uACE0\uAC1D\uC13C\uD130")), /* @__PURE__ */ React.createElement("div", { className: "mt-1.5" }, "\uAE34\uAE09 \uB3C4\uC6C0 \xB7 \uC790\uC0B4\uC608\uBC29 \uC0C1\uB2F4\uC804\uD654 109 \xB7 \uC815\uC2E0\uAC74\uAC15 \uC704\uAE30\uC0C1\uB2F4 1577-0199 (24\uC2DC\uAC04)"))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(PartnerEntry, null));
