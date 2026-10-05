const { useState, useEffect, useCallback } = React;
const TK = "partner_portal_token";
const getTok = () => {
  try {
    return localStorage.getItem(TK) || "";
  } catch {
    return "";
  }
};
const setTok = (t) => {
  try {
    t ? localStorage.setItem(TK, t) : localStorage.removeItem(TK);
  } catch {
  }
};
const won = (n) => "\u20A9" + (Number(n) || 0).toLocaleString("ko-KR");
const isoD = (d) => d.toISOString().slice(0, 10);
const api = async (path, opts) => {
  const r = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + getTok(), ...opts && opts.headers }
  });
  return r.json();
};
const BRAND = "#2D6A4F";
const F = "'Noto Sans KR',sans-serif";
function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const submit = async (e) => {
    e && e.preventDefault();
    if (!email || !pw) {
      setMsg("\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    setBusy(true);
    setMsg("");
    setResendMsg("");
    try {
      const d = await fetch("/api/partner-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      }).then((r) => r.json());
      if (d.success) {
        setNeedVerify(false);
        setTok(d.data.token);
        onDone(d.data.partner, !!(d.data && d.data.mustChangePw));
      } else if (d.requiresVerification || d.code === "EMAIL_UNVERIFIED") {
        setNeedVerify(true);
        setMsg(d.error || "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      } else {
        setNeedVerify(false);
        setMsg(d.error || "\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      }
    } catch {
      setMsg("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setBusy(false);
  };
  const resend = async () => {
    if (!email) {
      setResendMsg("\uC774\uBA54\uC77C\uC744 \uBA3C\uC800 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    setResendBusy(true);
    setResendMsg("");
    try {
      const d = await fetch("/api/partner-portal/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      }).then((r) => r.json());
      setResendMsg(d.message || d.error || "\uC694\uCCAD\uC744 \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4.");
    } catch {
      setResendMsg("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setResendBusy(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center px-6", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement("form", { onSubmit: submit, className: "w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-7" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "font-extrabold text-lg", style: { color: BRAND } }, "\u{1F33F} \uB9C8\uC74C\uD480 \uC81C\uD734 \uC815\uC0B0 \uD3EC\uD138"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-1" }, "\uC81C\uD734\uC0AC \uB2F4\uB2F9\uC790 \uC804\uC6A9 \uB85C\uADF8\uC778")), msg && /* @__PURE__ */ React.createElement("div", { className: "text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3" }, msg), /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-500" }, "\uC774\uBA54\uC77C"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: email,
      onChange: (e) => setEmail(e.target.value),
      type: "email",
      autoComplete: "username",
      className: "w-full px-3 py-2 mt-1 mb-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
    }
  ), /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-500" }, "\uBE44\uBC00\uBC88\uD638"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pw,
      onChange: (e) => setPw(e.target.value),
      type: "password",
      autoComplete: "current-password",
      className: "w-full px-3 py-2 mt-1 mb-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: busy,
      className: "w-full py-2.5 rounded-lg font-bold text-white text-sm",
      style: { background: BRAND, opacity: busy ? 0.6 : 1 }
    },
    busy ? "\uD655\uC778 \uC911\u2026" : "\uB85C\uADF8\uC778"
  ), needVerify && /* @__PURE__ */ React.createElement("div", { className: "mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-amber-800 mb-2" }, "\uC774\uBA54\uC77C \uC778\uC99D\uC744 \uC644\uB8CC\uD574\uC57C \uB85C\uADF8\uC778\uD560 \uC218 \uC788\uC5B4\uC694. \uBC1B\uC73C\uC2E0 \uC778\uC99D \uBA54\uC77C\uC758 \uB9C1\uD06C\uB97C \uB20C\uB7EC \uC8FC\uC138\uC694."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: resend,
      disabled: resendBusy,
      className: "w-full py-2 rounded-lg font-bold text-amber-800 text-xs border border-amber-300 bg-white",
      style: { opacity: resendBusy ? 0.6 : 1 }
    },
    resendBusy ? "\uBC1C\uC1A1 \uC911\u2026" : "\uC778\uC99D \uBA54\uC77C \uC7AC\uBC1C\uC1A1"
  ), resendMsg && /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-amber-700 mt-2" }, resendMsg)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-4 text-center" }, "\uACC4\uC815\uC740 \uB9C8\uC74C\uD480 \uC6B4\uC601\uC790\uAC00 \uBC1C\uAE09\uD569\uB2C8\uB2E4. \uBB38\uC758: \uB2F4\uB2F9 \uC6B4\uC601\uC790")));
}
function ChangePassword({ forced, onSuccess, onCancel }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e && e.preventDefault();
    if (!cur || !nw) {
      setMsg("\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (nw.length < 8) {
      setMsg("\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
      return;
    }
    if (nw !== nw2) {
      setMsg("\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const d = await api("/api/partner-portal/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: cur, newPassword: nw })
      });
      if (d.success) onSuccess();
      else setMsg(d.error || "\uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    } catch {
      setMsg("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setBusy(false);
  };
  const Field = (label, val, set, ac) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-500" }, label), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: val,
      onChange: (e) => set(e.target.value),
      type: "password",
      autoComplete: ac,
      className: "w-full px-3 py-2 mt-1 mb-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
    }
  ));
  return /* @__PURE__ */ React.createElement("form", { onSubmit: submit, className: "w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-7" }, /* @__PURE__ */ React.createElement("div", { className: "font-extrabold text-base mb-1", style: { color: BRAND } }, "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mb-4" }, forced ? "\uC6B4\uC601\uC790\uAC00 \uBC1C\uAE09\uD55C \uC784\uC2DC \uBE44\uBC00\uBC88\uD638\uC785\uB2C8\uB2E4. \uBCF4\uC548\uC744 \uC704\uD574 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB85C \uBCC0\uACBD\uD574 \uC8FC\uC138\uC694." : "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638 \uD655\uC778 \uD6C4 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB85C \uBCC0\uACBD\uD569\uB2C8\uB2E4."), msg && /* @__PURE__ */ React.createElement("div", { className: "text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3" }, msg), Field("\uD604\uC7AC \uBE44\uBC00\uBC88\uD638", cur, setCur, "current-password"), Field("\uC0C8 \uBE44\uBC00\uBC88\uD638 (8\uC790 \uC774\uC0C1)", nw, setNw, "new-password"), Field("\uC0C8 \uBE44\uBC00\uBC88\uD638 \uD655\uC778", nw2, setNw2, "new-password"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: busy,
      className: "w-full py-2.5 rounded-lg font-bold text-white text-sm mt-1",
      style: { background: BRAND, opacity: busy ? 0.6 : 1 }
    },
    busy ? "\uBCC0\uACBD \uC911\u2026" : "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD"
  ), !forced && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onCancel, className: "w-full py-2 rounded-lg font-bold text-gray-500 text-xs mt-2 border border-gray-200" }, "\uCDE8\uC18C"));
}
function Dashboard({ partner, onLogout, onChangePw }) {
  const [from, setFrom] = useState(() => isoD(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(() => isoD(/* @__PURE__ */ new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const d = await api(`/api/partner-portal/commissions?from=${from}&to=${to}`);
      if (d.success) setData(d.data);
      else if (d.error) {
        setErr(d.error);
        if (String(d.error).includes("\uB85C\uADF8\uC778")) onLogout();
      }
    } catch {
      setErr("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958");
    }
    setLoading(false);
  }, [from, to, onLogout]);
  useEffect(() => {
    load();
  }, []);
  const t = data && data.totals;
  const rows = data && data.rows || [];
  const statusKo = (s) => s === "settled" ? "\uC815\uC0B0\uC644\uB8CC" : s === "reversed" ? "\uD658\uBD88\uCDE8\uC18C" : "\uC815\uC0B0\uC608\uC815";
  const downloadCsv = () => {
    if (!rows.length) return;
    const hdr = ["\uAC70\uB798\uBC88\uD638", "\uC77C\uC2DC", "\uACB0\uC81C\uC561", "\uC218\uC218\uB8CC\uC728", "\uC250\uC5B4\uC561", "\uD1B5\uD654", "\uC0C1\uD0DC"];
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = rows.map((r) => [r.charge_id, r.created_at, r.charge_amount, r.rate, r.share_amount, r.currency, statusKo(r.status)].map(esc).join(","));
    const csv = "\uFEFF" + [hdr.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `\uC815\uC0B0\uB0B4\uC5ED_${partner.code}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-sm", style: { color: BRAND } }, "\u{1F33F} \uB9C8\uC74C\uD480 \uC81C\uD734 \uC815\uC0B0"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 ml-2" }, partner.name, " (", partner.code, ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: onChangePw, className: "text-xs text-gray-400 hover:text-gray-600 underline" }, "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD"), /* @__PURE__ */ React.createElement("button", { onClick: onLogout, className: "text-xs text-gray-400 hover:text-gray-600 underline" }, "\uB85C\uADF8\uC544\uC6C3"))), /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto px-5 py-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap mb-4" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: from, onChange: (e) => setFrom(e.target.value), "aria-label": "\uC870\uD68C \uC2DC\uC791\uC77C", className: "px-3 py-2 border border-gray-200 rounded text-sm" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "~"), /* @__PURE__ */ React.createElement("input", { type: "date", value: to, onChange: (e) => setTo(e.target.value), "aria-label": "\uC870\uD68C \uC885\uB8CC\uC77C", className: "px-3 py-2 border border-gray-200 rounded text-sm" }), /* @__PURE__ */ React.createElement("button", { onClick: load, className: "text-white px-3 py-2 rounded text-sm font-bold", style: { background: BRAND } }, "\uC870\uD68C"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: downloadCsv,
      disabled: !rows.length,
      className: `px-3 py-2 rounded text-sm font-bold ${rows.length ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`
    },
    "\u2B07 CSV"
  )), err && /* @__PURE__ */ React.createElement("div", { className: "text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3" }, err), t && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4" }, [
    ["\uC720\uD6A8 \uAC74\uC218", (t.cnt || 0).toLocaleString() + "\uAC74", "#54605A"],
    ["\uACB0\uC81C \uD569\uACC4", won(t.revenue), "#54605A"],
    ["\uC250\uC5B4 \uD569\uACC4", won(t.share), BRAND],
    ["\uC815\uC0B0\uC608\uC815", won(t.unsettled), "#C2691A"]
  ].map(([label, val, col]) => /* @__PURE__ */ React.createElement("div", { key: label, className: "bg-white rounded-xl border border-gray-100 px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mb-1" }, label), /* @__PURE__ */ React.createElement("div", { className: "font-extrabold text-base", style: { color: col } }, val)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 border-b border-gray-100 text-sm font-bold text-gray-700" }, "\uC815\uC0B0 \uB0B4\uC5ED"), loading ? /* @__PURE__ */ React.createElement("div", { className: "text-center text-gray-400 text-sm py-10" }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026") : rows.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center text-gray-400 text-sm py-10" }, "\uD574\uB2F9 \uAE30\uAC04 \uC815\uC0B0 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "text-xs text-gray-500 bg-gray-50" }, /* @__PURE__ */ React.createElement("th", { className: "text-left font-medium px-4 py-2" }, "\uAC70\uB798\uBC88\uD638"), /* @__PURE__ */ React.createElement("th", { className: "text-left font-medium px-4 py-2" }, "\uC77C\uC2DC"), /* @__PURE__ */ React.createElement("th", { className: "text-right font-medium px-4 py-2" }, "\uACB0\uC81C\uC561"), /* @__PURE__ */ React.createElement("th", { className: "text-right font-medium px-4 py-2" }, "\uC218\uC218\uB8CC\uC728"), /* @__PURE__ */ React.createElement("th", { className: "text-right font-medium px-4 py-2" }, "\uC250\uC5B4\uC561"), /* @__PURE__ */ React.createElement("th", { className: "text-center font-medium px-4 py-2" }, "\uC0C1\uD0DC"))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.charge_id, className: "border-t border-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-gray-400" }, "#", r.charge_id), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-gray-500" }, String(r.created_at || "").slice(0, 16).replace("T", " ")), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-right text-gray-600" }, won(r.charge_amount)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-right text-gray-500" }, Math.round((r.rate || 0) * 100), "%"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-right font-bold", style: { color: BRAND } }, won(r.share_amount)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `text-[11px] px-2 py-0.5 rounded-full font-bold ${r.status === "settled" ? "bg-green-100 text-green-700" : r.status === "reversed" ? "bg-gray-100 text-gray-400" : "bg-amber-100 text-amber-700"}` }, statusKo(r.status))))))))), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-3" }, "\xB7 \uAE08\uC561\uC740 \uD655\uC815\uB41C \uC720\uD6A8\uAD6C\uB9E4 \uAE30\uC900\uC774\uBA70, \uD658\uBD88 \uBC1C\uC0DD \uC2DC \uC790\uB3D9 \uBC18\uC601\uB429\uB2C8\uB2E4. \xB7 \uC2E4\uC81C \uC9C0\uAE09 \uC5EC\uBD80\uB294 \uC0C1\uD0DC(\uC815\uC0B0\uC644\uB8CC)\uB85C \uD655\uC778\uD558\uC138\uC694.")));
}
function PartnerPortal() {
  const [partner, setPartner] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mustChange, setMustChange] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  useEffect(() => {
    (async () => {
      if (!getTok()) {
        setChecking(false);
        return;
      }
      try {
        const d = await api("/api/partner-portal/me");
        if (d.success) setPartner(d.data.partner);
        else setTok("");
      } catch {
      }
      setChecking(false);
    })();
  }, []);
  const logout = () => {
    setTok("");
    setPartner(null);
    setMustChange(false);
    setShowChangePw(false);
  };
  const onLoginDone = (p, must) => {
    setPartner(p);
    setMustChange(!!must);
  };
  if (checking) return React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: "#F3F6F2", color: "#8B948D", fontFamily: F } }, "\uBD88\uB7EC\uC624\uB294 \uC911\u2026");
  if (!partner) return /* @__PURE__ */ React.createElement(Login, { onDone: onLoginDone });
  if (mustChange) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center px-6", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement(ChangePassword, { forced: true, onSuccess: () => setMustChange(false) }));
  }
  if (showChangePw) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center px-6", style: { background: "#F3F6F2", fontFamily: F } }, /* @__PURE__ */ React.createElement(ChangePassword, { onSuccess: () => setShowChangePw(false), onCancel: () => setShowChangePw(false) }));
  }
  return /* @__PURE__ */ React.createElement(Dashboard, { partner, onLogout: logout, onChangePw: () => setShowChangePw(true) });
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(PartnerPortal, null));
