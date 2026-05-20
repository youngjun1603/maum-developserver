const SESSION_TYPES = {
  video: { label: "\uD654\uC0C1 \uC0C1\uB2F4", icon: "\u{1F4F9}", desc: "\uC628\uB77C\uC778 \uD654\uC0C1 \xB7 \uC608\uC57D \uD6C4 \uB9C1\uD06C \uC790\uB3D9 \uBC1C\uC1A1" },
  phone: { label: "\uC804\uD654 \uC0C1\uB2F4", icon: "\u{1F4DE}", desc: "\uC804\uD654 \uD1B5\uD654\uB85C \uC9C4\uD589" },
  visit: { label: "\uBC29\uBB38 \uC0C1\uB2F4", icon: "\u{1F3E2}", desc: "\uC13C\uD130 \uC9C1\uC811 \uBC29\uBB38" }
};
const cApi = {
  _auth() {
    const t = localStorage.getItem("access_token");
    return t ? { "Authorization": "Bearer " + t } : {};
  },
  async centers() {
    return (await fetch("/api/counseling/centers")).json();
  },
  async counselors(centerId = null) {
    const url = centerId ? `/api/counseling/counselors?centerId=${centerId}` : "/api/counseling/counselors";
    return (await fetch(url)).json();
  },
  async slots(counselorId, date) {
    return (await fetch(`/api/counseling/counselors/${counselorId}/slots?date=${date}`)).json();
  },
  async prepare(body) {
    return (await fetch("/api/counseling/appointments/prepare", { method: "POST", headers: { "Content-Type": "application/json", ...this._auth() }, body: JSON.stringify(body) })).json();
  },
  async myAppointments() {
    return (await fetch("/api/counseling/appointments", { headers: this._auth() })).json();
  },
  async cancel(id) {
    return (await fetch(`/api/counseling/appointments/${id}/cancel`, { method: "PATCH", headers: this._auth() })).json();
  }
};
const fmt = (n) => Number(n).toLocaleString("ko-KR") + "\uC6D0";
const fmtDt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
};
const toDateStr = (d) => d.toISOString().slice(0, 10);
const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
};
function Stars({ rating, size = 13 }) {
  const full = Math.floor(rating), arr = Array.from({ length: 5 }, (_, i) => i < full ? "\u2605" : "\u2606");
  return React.createElement("span", { style: { fontSize: size, color: "#F59E0B", letterSpacing: -1 } }, arr.join(""));
}
function StatusBadge({ status }) {
  const m = { pending: { bg: "#FEF3C7", color: "#B45309", label: "\uACB0\uC81C \uB300\uAE30" }, confirmed: { bg: "#D8F3DC", color: "#2D6A4F", label: "\uC608\uC57D \uD655\uC815" }, completed: { bg: "#EEF0FF", color: "#5B21B6", label: "\uC644\uB8CC" }, cancelled: { bg: "#FEF2F2", color: "#991B1B", label: "\uCDE8\uC18C\uB428" }, no_show: { bg: "#F5F5F0", color: "#9A9A9A", label: "\uB178\uC1FC" } };
  const s = m[status] || { bg: "#F5F5F0", color: "#9A9A9A", label: status };
  return React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color } }, s.label);
}
const CC = { 1: { color: "#2D6A4F", bg: "#D8F3DC" }, 2: { color: "#F59E0B", bg: "#FFFBEB" }, 3: { color: "#7C3AED", bg: "#F5F3FF" } };
const getCC = (id) => CC[id] || { color: "#5A5A5A", bg: "#F5F5F0" };
function BookingModal({ counselor, onClose, onComplete, isLoggedIn, setView }) {
  var _a, _b;
  const { useState: useS, useEffect: useE } = React;
  const [step, setStep] = useS(1);
  const [dates, setDates] = useS([]);
  const [selDate, setSelDate] = useS(null);
  const [slots, setSlots] = useS([]);
  const [slotsLoading, setSlotsLoading] = useS(false);
  const [selTime, setSelTime] = useS(null);
  const [selType, setSelType] = useS(null);
  const [memo, setMemo] = useS("");
  const [shareResult, setShareResult] = useS(false);
  const [preparing, setPreparing] = useS(false);
  const [done, setDone] = useS(false);
  const c = counselor;
  useE(() => {
    const ds = [];
    for (let i = 1; i <= 21; i++) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) ds.push(d);
    }
    setDates(ds.slice(0, 14));
  }, []);
  useE(() => {
    if (!selDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelTime(null);
    cApi.slots(c.id, toDateStr(selDate)).then((res) => {
      if (res.success) setSlots(res.data);
      else setSlots([]);
    }).catch(() => {
      const fb = [];
      for (let h = 9; h < 18; h++) {
        for (let m = 0; m < 60; m += c.minutes >= 60 ? 60 : 50) {
          if (h * 60 + m + c.minutes > 18 * 60) break;
          const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const busy = ["09:00", "11:00", "14:00", "16:00"].includes(t);
          fb.push({ time: t, available: !busy });
        }
      }
      setSlots(fb);
    }).finally(() => setSlotsLoading(false));
  }, [selDate]);
  const handlePay = async () => {
    if (!isLoggedIn) {
      onClose();
      setView("memberLogin");
      return;
    }
    if (!selDate || !selTime) {
      alert("\uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (!selType) {
      alert("\uC0C1\uB2F4 \uBC29\uC2DD\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    setPreparing(true);
    try {
      const scheduledAt = `${toDateStr(selDate)}T${selTime}:00`;
      const res = await cApi.prepare({ counselorId: c.id, scheduledAt, sessionType: selType, userMemo: memo, shareTestResult: shareResult });
      if (!res.success) {
        alert(res.error || "\uC608\uC57D \uC900\uBE44 \uC2E4\uD328");
        setPreparing(false);
        return;
      }
      const d = res.data;
      if (!window.TossPayments) {
        await new Promise((ok, ng) => {
          const s = document.createElement("script");
          s.src = "https://js.tosspayments.com/v1/payment";
          s.onload = ok;
          s.onerror = ng;
          document.head.appendChild(s);
        });
      }
      const tp = window.TossPayments(d.tossClientKey);
      await tp.requestPayment("\uCE74\uB4DC", { amount: d.amount, orderId: d.orderId, orderName: d.orderName, customerName: d.customerName, customerEmail: d.customerEmail, successUrl: d.successUrl, failUrl: d.failUrl });
    } catch (err) {
      if ((err == null ? void 0 : err.code) !== "USER_CANCEL") {
        console.error(err);
        alert("\uACB0\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
      }
      setPreparing(false);
    }
  };
  const handleDemoPay = async () => {
    if (!isLoggedIn) {
      onClose();
      setView("memberLogin");
      return;
    }
    setPreparing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setPreparing(false);
    setDone(true);
    const roomId = "maumful-" + Math.random().toString(36).slice(2, 10);
    setTimeout(() => onComplete({ counselor: c, date: selDate, time: selTime, type: selType, roomId, videoRoomUrl: selType === "video" ? `https://meet.jit.si/${roomId}` : null }), 600);
  };
  const stepsL = ["\uB0A0\uC9DC\xB7\uC2DC\uAC04", "\uC0C1\uB2F4 \uC720\uD615", "\uACB0\uC81C"];
  const ok1 = selDate && selTime, ok2 = !!selType && c.types && c.types.length > 0;
  if (done) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", fontFamily: "'Noto Sans KR',sans-serif", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52 } }, "\u2705"), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 20, fontWeight: 700 } }, "\uC608\uC57D\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.7 } }, c.name, " \uC0C1\uB2F4\uC0AC \xB7 ", selDate && selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric" }), " ", selTime), /* @__PURE__ */ React.createElement("div", { style: { background: "#D8F3DC", borderRadius: 10, padding: "9px 18px", fontSize: 13, color: "#2D6A4F", fontWeight: 600 } }, "\uACB0\uC81C \uC644\uB8CC \xB7 ", fmt(c.fee)));
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 0", borderBottom: "1px solid rgba(0,0,0,.07)", paddingBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, c.emoji, " ", c.name, " \uC0C1\uB2F4\uC0AC \uC608\uC57D"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 1 } }, c.centerName)), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A9A9A" } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 0 } }, stepsL.map((l, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: l }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 19, height: 19, borderRadius: "50%", background: step > i + 1 ? "#2D6A4F" : step === i + 1 ? "#2D6A4F" : "#E5E5E0", color: step >= i + 1 ? "white" : "#9A9A9A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 } }, step > i + 1 ? "\u2713" : i + 1), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? "#1A1A1A" : "#9A9A9A" } }, l)), i < stepsL.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: step > i + 1 ? "#2D6A4F" : "#E5E5E0", margin: "0 5px" } }))))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px", maxHeight: 420, overflowY: "auto" } }, step === 1 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 9 } }, "\uB0A0\uC9DC \uC120\uD0DD"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 } }, dates.map((d) => {
    const lbl = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
    const sel = selDate && toDateStr(d) === toDateStr(selDate);
    return /* @__PURE__ */ React.createElement("button", { key: toDateStr(d), onClick: () => setSelDate(d), style: { padding: "6px 10px", borderRadius: 7, border: "1px solid", borderColor: sel ? "#2D6A4F" : "rgba(0,0,0,.10)", background: sel ? "#D8F3DC" : "white", color: sel ? "#2D6A4F" : "#1A1A1A", fontSize: 11, fontWeight: sel ? 700 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, lbl);
  })), selDate && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 9 } }, "\uC2DC\uAC04 \uC120\uD0DD ", slotsLoading && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9A9A9A", fontWeight: 400, marginLeft: 6 } }, "\uC870\uD68C \uC911...")), slots.length === 0 && !slotsLoading && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#9A9A9A", padding: "12px 0" } }, "\uC774 \uB0A0\uC9DC\uB294 \uC608\uC57D \uAC00\uB2A5\uD55C \uC2DC\uAC04\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 } }, slots.map((slot) => {
    const sel = selTime === slot.time;
    return /* @__PURE__ */ React.createElement("button", { key: slot.time, onClick: () => slot.available && setSelTime(slot.time), disabled: !slot.available, style: { padding: "8px 0", borderRadius: 7, border: "1px solid", borderColor: sel ? "#2D6A4F" : !slot.available ? "#E5E5E0" : "rgba(0,0,0,.10)", background: sel ? "#D8F3DC" : !slot.available ? "#F9F9F7" : "white", color: sel ? "#2D6A4F" : !slot.available ? "#CACACA" : "#1A1A1A", fontSize: 12, fontWeight: sel ? 700 : 400, cursor: slot.available ? "pointer" : "not-allowed", fontFamily: "'Noto Sans KR',sans-serif", textDecoration: !slot.available ? "line-through" : "none" } }, slot.time);
  })))), step === 2 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 10 } }, "\uC0C1\uB2F4 \uC720\uD615 \uC120\uD0DD"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 } }, !c.types || c.types.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", background: "#FEF3C7", borderRadius: 11, fontSize: 13, color: "#B45309", textAlign: "center" } }, "\uC774 \uC0C1\uB2F4\uC0AC\uB294 \uD604\uC7AC \uC608\uC57D \uAC00\uB2A5\uD55C \uC0C1\uB2F4 \uBC29\uC2DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC13C\uD130\uC5D0 \uC9C1\uC811 \uBB38\uC758\uD574 \uC8FC\uC138\uC694.") : c.types.map((type) => {
    const info = SESSION_TYPES[type] || { icon: "\u{1F4CB}", label: type, desc: "" };
    const sel = selType === type;
    return /* @__PURE__ */ React.createElement("button", { key: type, onClick: () => setSelType(type), style: { display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", borderRadius: 11, border: "1.5px solid", borderColor: sel ? "#2D6A4F" : "rgba(0,0,0,.10)", background: sel ? "#F0FAF4" : "white", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", textAlign: "left", transition: "all .15s" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, info.icon), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: sel ? "#2D6A4F" : "#1A1A1A" } }, info.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 1 } }, info.desc)), /* @__PURE__ */ React.createElement("div", { style: { width: 17, height: 17, borderRadius: "50%", border: `2px solid ${sel ? "#2D6A4F" : "#CACACA"}`, background: sel ? "#2D6A4F" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, sel && /* @__PURE__ */ React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: "white" } })));
  })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 7 } }, "\uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC804\uB2EC\uD560 \uB0B4\uC6A9 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement("textarea", { value: memo, onChange: (e) => setMemo(e.target.value), placeholder: "\uC0C1\uB2F4 \uC2E0\uCCAD \uC774\uC720\uB098 \uC8FC\uC694 \uACE0\uBBFC\uC744 \uAC04\uB2E8\uD788 \uC801\uC5B4\uC8FC\uC138\uC694.", rows: 3, style: { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, resize: "none", fontFamily: "'Noto Sans KR',sans-serif", outline: "none", background: "#FAFAF8", lineHeight: 1.6 } }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "10px 13px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }, onClick: () => setShareResult((v) => !v) }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 20, borderRadius: 10, background: shareResult ? "#22C55E" : "#D1D5DB", transition: "background .2s", position: "relative", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: shareResult ? 18 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: shareResult ? "#16A34A" : "#374151" } }, "\u{1F4CB} \uAC80\uC0AC \uACB0\uACFC \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uBBF8\uB9AC \uACF5\uC720"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#6B7280", marginTop: 1 } }, "\uCD5C\uADFC \uAC80\uC0AC \uACB0\uACFC\uAC00 \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC804\uB2EC\uB418\uC5B4 \uB354 \uAE4A\uC740 \uC0C1\uB2F4\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4")))), step === 3 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "#F9F9F7", borderRadius: 11, padding: "12px 14px", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 9 } }, "\uC608\uC57D \uC815\uBCF4 \uD655\uC778"), [{ label: "\uC0C1\uB2F4\uC0AC", val: `${c.emoji} ${c.name} \xB7 ${c.title}` }, { label: "\uC77C\uC2DC", val: `${selDate && selDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ${selTime}` }, { label: "\uC18C\uC694\uC2DC\uAC04", val: `${c.minutes}\uBD84` }, { label: "\uC720\uD615", val: `${(_a = SESSION_TYPES[selType]) == null ? void 0 : _a.icon} ${(_b = SESSION_TYPES[selType]) == null ? void 0 : _b.label}` }].map((row) => /* @__PURE__ */ React.createElement("div", { key: row.label, style: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, row.label), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, row.val))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid rgba(0,0,0,.07)", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, "\uACB0\uC81C \uAE08\uC561"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: "#2D6A4F" } }, fmt(c.fee)))), /* @__PURE__ */ React.createElement("div", { style: { background: "#EEF0FF", borderRadius: 9, padding: "9px 13px", marginBottom: 14, fontSize: 12, color: "#5B21B6", lineHeight: 1.6 } }, "\u2139\uFE0F \uC0C1\uB2F4 24\uC2DC\uAC04 \uC804\uAE4C\uC9C0 \uCDE8\uC18C \uC2DC \uC804\uC561 \uD658\uBD88 \xB7 \uC774\uD6C4 \uCDE8\uC18C \uBD88\uAC00"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", textAlign: "center", lineHeight: 1.7 } }, "[\uACB0\uC81C\uD558\uAE30] \uD074\uB9AD \uC2DC \uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20 \uACB0\uC81C\uCC3D\uC774 \uC5F4\uB9BD\uB2C8\uB2E4", /* @__PURE__ */ React.createElement("br", null), "\uCE74\uB4DC / \uCE74\uCE74\uC624\uD398\uC774 / \uB124\uC774\uBC84\uD398\uC774 / \uD1A0\uC2A4\uD398\uC774 \uC9C0\uC6D0"))), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 20px 16px", borderTop: "1px solid rgba(0,0,0,.07)", display: "flex", gap: 7 } }, step > 1 && /* @__PURE__ */ React.createElement("button", { onClick: () => setStep((s) => s - 1), style: { flex: 1, padding: "11px 0", borderRadius: 9, background: "white", border: "1px solid rgba(0,0,0,.12)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2190 \uC774\uC804"), step < 3 ? /* @__PURE__ */ React.createElement("button", { onClick: () => setStep((s) => s + 1), disabled: step === 1 ? !ok1 : !ok2, style: { flex: 2, padding: "11px 0", borderRadius: 9, border: "none", background: (step === 1 ? ok1 : ok2) ? "#2D6A4F" : "#E5E5E0", color: (step === 1 ? ok1 : ok2) ? "white" : "#9A9A9A", fontSize: 13, fontWeight: 700, cursor: (step === 1 ? ok1 : ok2) ? "pointer" : "not-allowed", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uB2E4\uC74C \u2192") : /* @__PURE__ */ React.createElement("button", { onClick: handlePay, disabled: preparing, style: { flex: 2, padding: "11px 0", borderRadius: 9, border: "none", background: preparing ? "#9A9A9A" : "#2D6A4F", color: "white", fontSize: 13, fontWeight: 700, cursor: preparing ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, preparing ? "\uACB0\uC81C \uC900\uBE44 \uC911..." : `${fmt(c.fee)} \uACB0\uC81C\uD558\uAE30`)));
}
function VideoRoom({ roomId, counselorName, onLeave }) {
  const { useEffect: useE, useRef } = React;
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  useE(() => {
    const load = () => {
      if (!containerRef.current) return;
      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomId,
        parentNode: containerRef.current,
        width: "100%",
        height: 520,
        userInfo: { displayName: "\uB0B4\uB2F4\uC790" },
        configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false, disableDeepLinking: true, prejoinPageEnabled: false, subject: `\uB9C8\uC74C\uD480 \xB7 ${counselorName} \uC0C1\uB2F4\uC0AC` },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "fullscreen", "fodeviceselection", "hangup", "chat", "raisehand", "tileview"], SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false, DEFAULT_REMOTE_DISPLAY_NAME: counselorName || "\uC0C1\uB2F4\uC0AC", APP_NAME: "\uB9C8\uC74C\uD480 \uC0C1\uB2F4" }
      });
      apiRef.current.addEventListener("readyToClose", () => onLeave && onLeave());
    };
    if (window.JitsiMeetExternalAPI) {
      load();
    } else {
      const s = document.createElement("script");
      s.src = "https://meet.jit.si/external_api.js";
      s.onload = load;
      document.head.appendChild(s);
    }
    return () => {
      var _a;
      try {
        (_a = apiRef.current) == null ? void 0 : _a.dispose();
      } catch {
      }
    };
  }, [roomId]);
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", minHeight: "100vh", background: "#0D1117" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#161B22", padding: "11px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#22C55E" } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "white" } }, counselorName, " \uC0C1\uB2F4\uC0AC \xB7 \uD654\uC0C1 \uC0C1\uB2F4 \uC9C4\uD589 \uC911"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 1 } }, "\uB8F8: ", roomId, " \xB7 \uC885\uB2E8\uAC04 \uC554\uD638\uD654"))), /* @__PURE__ */ React.createElement("button", { onClick: onLeave, style: { background: "#DC2626", color: "white", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC0C1\uB2F4 \uC885\uB8CC")), /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: { width: "100%" } }), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 22px", background: "#0D1117" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 11, padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } }, [{ icon: "\u{1F512}", title: "\uC885\uB2E8\uAC04 \uC554\uD638\uD654", desc: "Jitsi E2E \uC554\uD638\uD654" }, { icon: "\u{1F4DD}", title: "\uB179\uD654 \uC548\uB0B4", desc: "\uB3D9\uC758 \uC5C6\uC774 \uB179\uD654 \uBD88\uAC00" }, { icon: "\u{1F3E0}", title: "\uAC1C\uC778 \uB8F8", desc: "\uC608\uC57D\uC790\uB9CC \uC785\uC7A5" }].map((i) => /* @__PURE__ */ React.createElement("div", { key: i.title, style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, marginBottom: 3 } }, i.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.7)" } }, i.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 } }, i.desc))))));
}
function MyAppointments({ setView }) {
  const { useState: useS, useEffect: useE } = React;
  const [appts, setAppts] = useS([]);
  const [loading, setLoading] = useS(true);
  const [videoRoom, setVideoRoom] = useS(null);
  const [cancelling, setCancelling] = useS(null);
  const [reviewModal, setReviewModal] = useS(null);
  const load = async () => {
    setLoading(true);
    try {
      const r = await cApi.myAppointments();
      if (r.success) setAppts(r.data);
    } catch {
    }
    setLoading(false);
  };
  useE(() => {
    load();
  }, []);
  const handleCancel = async (id) => {
    if (!confirm("\uC608\uC57D\uC744 \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) return;
    setCancelling(id);
    const r = await cApi.cancel(id);
    setCancelling(null);
    if (r.success) {
      alert(r.data.message);
      load();
    } else alert(r.error || "\uCDE8\uC18C \uC2E4\uD328");
  };
  if (videoRoom) return /* @__PURE__ */ React.createElement(VideoRoom, { roomId: videoRoom.roomId, counselorName: videoRoom.counselorName, onLeave: () => setVideoRoom(null) });
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 0", color: "#9A9A9A", fontFamily: "'Noto Sans KR',sans-serif", fontSize: 14 } }, "\uC608\uC57D \uB0B4\uC5ED \uC870\uD68C \uC911...");
  if (appts.length === 0) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "44px 0", fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 38, marginBottom: 10 } }, "\u{1F4C5}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 5 } }, "\uC608\uC57D \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#9A9A9A", marginBottom: 18 } }, "\uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uC0C1\uB2F4\uC744 \uC608\uC57D\uD574\uBCF4\uC138\uC694"), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("counseling"), style: { background: "#2D6A4F", color: "white", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC0C1\uB2F4\uC0AC \uCC3E\uAE30 \u2192"));
  const upcoming = appts.filter((a) => a.status !== "cancelled" && new Date(a.scheduled_at) > /* @__PURE__ */ new Date());
  const past = appts.filter((a) => a.status === "cancelled" || new Date(a.scheduled_at) <= /* @__PURE__ */ new Date());
  const Card = ({ a }) => {
    var _a, _b;
    const isUpcoming = new Date(a.scheduled_at) > /* @__PURE__ */ new Date() && a.status !== "cancelled";
    const canVideo = a.session_type === "video" && a.video_room_id && a.status === "confirmed";
    const canCancel = isUpcoming && a.status !== "cancelled";
    const canReview = a.status === "completed";
    return /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 13, padding: "16px 18px", marginBottom: 9, opacity: a.status === "cancelled" ? 0.65 : 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, width: 40, height: 40, background: "#F0FAF4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, a.photo_emoji || "\u{1F464}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, a.counselor_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9A9A9A" } }, a.counselor_title), /* @__PURE__ */ React.createElement(StatusBadge, { status: a.status })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5A5A5A", marginBottom: 2 } }, a.center_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 500 } }, fmtDt(a.scheduled_at), " \xB7 ", a.duration_min, "\uBD84"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 1 } }, (_a = SESSION_TYPES[a.session_type]) == null ? void 0 : _a.icon, " ", (_b = SESSION_TYPES[a.session_type]) == null ? void 0 : _b.label, " \xB7 ", fmt(a.fee_amount)))), (canVideo || canCancel || canReview) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,.06)" } }, canVideo && /* @__PURE__ */ React.createElement("button", { onClick: () => setVideoRoom({ roomId: a.video_room_id, counselorName: a.counselor_name }), style: { flex: 1, padding: "9px 0", background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u{1F4F9} \uD654\uC0C1 \uC0C1\uB2F4 \uC785\uC7A5"), canCancel && /* @__PURE__ */ React.createElement("button", { onClick: () => handleCancel(a.id), disabled: cancelling === a.id, style: { flex: 1, padding: "9px 0", background: "white", color: "#9A9A9A", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, cancelling === a.id ? "\uCDE8\uC18C \uC911..." : "\uC608\uC57D \uCDE8\uC18C"), canReview && /* @__PURE__ */ React.createElement("button", { onClick: () => setReviewModal({ appointmentId: a.id, counselorName: a.counselor_name }), style: { flex: 1, padding: "9px 0", background: "#FEF3C7", color: "#B45309", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2B50 \uB9AC\uBDF0 \uC791\uC131")));
  };
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif" } }, upcoming.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#5A5A5A", marginBottom: 9 } }, "\uC608\uC815\uB41C \uC0C1\uB2F4 (", upcoming.length, ")"), upcoming.map((a) => /* @__PURE__ */ React.createElement(Card, { key: a.id, a }))), past.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: upcoming.length > 0 ? 18 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#9A9A9A", marginBottom: 9 } }, "\uC9C0\uB09C \uC0C1\uB2F4"), past.map((a) => /* @__PURE__ */ React.createElement(Card, { key: a.id, a }))), reviewModal && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setReviewModal(null);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 20px 72px rgba(0,0,0,.25)" } }, /* @__PURE__ */ React.createElement(ReviewModal, { appointmentId: reviewModal.appointmentId, counselorName: reviewModal.counselorName, onClose: () => setReviewModal(null), onDone: () => {
    setReviewModal(null);
    load();
  } }))));
}
function OnboardingForm({ onClose, isLoggedIn }) {
  const { useState: useS } = React;
  const [form, setForm] = useS({ center_name: "", contact_name: "", contact_email: "", contact_phone: "", address: "", description: "", counselor_count: "1", website_url: "", business_reg_num: "", specialty_tags: [] });
  const [submitting, setSubmitting] = useS(false);
  const [done, setDone] = useS(false);
  const [err, setErr] = useS("");
  const ALL_TAGS = ["\uC6B0\uC6B8", "\uBD88\uC548", "\uAC00\uC871", "\uBD80\uBD80", "\uD2B8\uB77C\uC6B0\uB9C8", "\uC9C1\uC7A5\uC2A4\uD2B8\uB808\uC2A4", "\uBC88\uC544\uC6C3", "\uC544\uB3D9\uCCAD\uC18C\uB144", "CBT", "PTSD", "\uC790\uC874\uAC10", "\uB300\uC778\uAD00\uACC4"];
  const toggleTag = (t) => setForm((f) => ({ ...f, specialty_tags: f.specialty_tags.includes(t) ? f.specialty_tags.filter((x) => x !== t) : [...f.specialty_tags, t] }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.center_name || !form.contact_name || !form.contact_email) {
      setErr("\uC13C\uD130\uBA85, \uB2F4\uB2F9\uC790\uBA85, \uC774\uBA54\uC77C\uC740 \uD544\uC218\uC785\uB2C8\uB2E4");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const token = localStorage.getItem("access_token");
      const r = await fetch("/api/counseling/onboarding", { method: "POST", headers: { "Content-Type": "application/json", ...token ? { "Authorization": "Bearer " + token } : {} }, body: JSON.stringify({ ...form, specialty_tags: JSON.stringify(form.specialty_tags), counselor_count: parseInt(form.counselor_count) || 1 }) });
      const d = await r.json();
      if (d.success) setDone(true);
      else setErr(d.error || "\uC2E0\uCCAD \uC2E4\uD328");
    } catch {
      setErr("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958");
    }
    setSubmitting(false);
  };
  if (done) return /* @__PURE__ */ React.createElement("div", { style: { padding: "40px 32px", textAlign: "center", fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, marginBottom: 16 } }, "\u{1F389}"), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 20, fontWeight: 700, marginBottom: 10 } }, "\uC2E0\uCCAD\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 24 } }, "\uAC80\uD1A0 \uD6C4 \uC785\uB825\uD558\uC2E0 \uC774\uBA54\uC77C\uB85C \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC77C\uBC18\uC801\uC73C\uB85C 3~5 \uC601\uC5C5\uC77C \uB0B4 \uCC98\uB9AC\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "#2D6A4F", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uD655\uC778"));
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", maxHeight: "85vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,.07)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700 } }, "\u{1F3E5} \uC0C1\uB2F4\uC13C\uD130 \uC81C\uD734 \uC2E0\uCCAD"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 1 } }, "\uAC80\uD1A0 \uD6C4 3~5 \uC601\uC5C5\uC77C \uB0B4 \uC5F0\uB77D\uB4DC\uB9BD\uB2C8\uB2E4")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A9A9A" } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px" } }, err && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 } }, err), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 } }, [["center_name", "\uC13C\uD130\uBA85 *", "\uB9C8\uC74C\uC232 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", false], ["contact_name", "\uB2F4\uB2F9\uC790\uBA85 *", "\uD64D\uAE38\uB3D9", false], ["contact_email", "\uC774\uBA54\uC77C *", "contact@center.kr", false], ["contact_phone", "\uC804\uD654\uBC88\uD638", "02-1234-5678", false], ["address", "\uC13C\uD130 \uC8FC\uC18C", "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C \uD14C\uD5E4\uB780\uB85C 123", false], ["website_url", "\uD648\uD398\uC774\uC9C0", "https://center.kr", false], ["business_reg_num", "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638", "123-45-67890", false], ["counselor_count", "\uC0C1\uB2F4\uC0AC \uC218", "", false]].map(([key, label, ph, full]) => /* @__PURE__ */ React.createElement("div", { key, style: full ? { gridColumn: "1/-1" } : {} }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 5, color: "#5A5A5A" } }, label), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: key === "counselor_count" ? "number" : "text",
      value: form[key],
      onChange: (e) => set(key, e.target.value),
      placeholder: ph,
      style: { width: "100%", padding: "9px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }
    }
  )))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#5A5A5A" } }, "\uC804\uBB38 \uBD84\uC57C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, ALL_TAGS.map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t,
      onClick: () => toggleTag(t),
      style: { padding: "5px 12px", borderRadius: 100, border: "1px solid", borderColor: form.specialty_tags.includes(t) ? "#2D6A4F" : "rgba(0,0,0,.10)", background: form.specialty_tags.includes(t) ? "#D8F3DC" : "white", color: form.specialty_tags.includes(t) ? "#2D6A4F" : "#5A5A5A", fontSize: 12, fontWeight: form.specialty_tags.includes(t) ? 700 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    t
  )))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 5, color: "#5A5A5A" } }, "\uC13C\uD130 \uC18C\uAC1C"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: form.description,
      onChange: (e) => set("description", e.target.value),
      placeholder: "\uC13C\uD130 \uD2B9\uC9D5, \uC8FC\uC694 \uC0C1\uB2F4 \uBD84\uC57C, \uC6B4\uC601 \uBC29\uC2DD \uB4F1\uC744 \uC18C\uAC1C\uD574\uC8FC\uC138\uC694.",
      rows: 4,
      style: { width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, resize: "none", fontFamily: "'Noto Sans KR',sans-serif", outline: "none", lineHeight: 1.6 }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FAF4", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#2D6A4F", lineHeight: 1.7 } }, "\u2705 \uD50C\uB7AB\uD3FC \uC218\uC218\uB8CC: \uC0C1\uB2F4\uB8CC\uC758 10% (\uD611\uC758 \uAC00\uB2A5)", /* @__PURE__ */ React.createElement("br", null), "\u2705 \uACB0\uC81C \uC815\uC0B0: \uC6D4 1\uD68C (\uC644\uB8CC \uC0C1\uB2F4 \uAE30\uC900)", /* @__PURE__ */ React.createElement("br", null), "\u2705 \uC628\uBCF4\uB529 \uC9C0\uC6D0: \uC2B9\uC778 \uD6C4 \uC0C1\uB2F4\uC0AC \uB4F1\uB85D \uAC00\uC774\uB4DC \uC81C\uACF5"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: submit,
      disabled: submitting,
      style: { width: "100%", padding: "13px 0", background: submitting ? "#9A9A9A" : "#2D6A4F", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    submitting ? "\uC2E0\uCCAD \uC911..." : "\uC81C\uD734 \uC2E0\uCCAD\uD558\uAE30"
  )));
}
function ReviewModal({ appointmentId, counselorName, onClose, onDone }) {
  const { useState: useS } = React;
  const [rating, setRating] = useS(0);
  const [hover, setHover] = useS(0);
  const [content, setContent] = useS("");
  const [isAnon, setIsAnon] = useS(false);
  const [submitting, setSubmitting] = useS(false);
  const [err, setErr] = useS("");
  const submit = async () => {
    if (rating === 0) {
      setErr("\uBCC4\uC810\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const token = localStorage.getItem("access_token");
      const r = await fetch("/api/counseling/reviews", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ appointment_id: appointmentId, rating, content, is_anonymous: isAnon }) });
      const d = await r.json();
      if (d.success) onDone();
      else setErr(d.error || "\uC624\uB958");
    } catch {
      setErr("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958");
    }
    setSubmitting(false);
  };
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", padding: "24px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700 } }, counselorName, " \uC0C1\uB2F4\uC0AC \uB9AC\uBDF0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 1 } }, "\uC194\uC9C1\uD55C \uB9AC\uBDF0\uAC00 \uD070 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A9A9A" } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 8 } }, "\uC0C1\uB2F4\uC740 \uC5B4\uB5A0\uC168\uB098\uC694?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6 } }, [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: n,
      onClick: () => setRating(n),
      onMouseEnter: () => setHover(n),
      onMouseLeave: () => setHover(0),
      style: { background: "none", border: "none", fontSize: 36, cursor: "pointer", color: (hover || rating) >= n ? "#F59E0B" : "#E5E5E0", transition: "color .1s" }
    },
    "\u2605"
  ))), rating > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#F59E0B", fontWeight: 600, marginTop: 4 } }, ["", "\uBCC4\uB85C\uC608\uC694", "\uC544\uC26C\uC6CC\uC694", "\uBCF4\uD1B5\uC774\uC5D0\uC694", "\uC88B\uC558\uC5B4\uC694", "\uCD5C\uACE0\uC600\uC5B4\uC694"][rating])), err && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 } }, err), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: content,
      onChange: (e) => setContent(e.target.value),
      placeholder: "\uC0C1\uB2F4 \uACBD\uD5D8\uC744 \uC790\uC138\uD788 \uACF5\uC720\uD574\uC8FC\uC138\uC694. (\uC120\uD0DD)",
      rows: 4,
      style: { width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, resize: "none", fontFamily: "'Noto Sans KR',sans-serif", outline: "none", lineHeight: 1.6, marginBottom: 14 }
    }
  ), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A5A5A", marginBottom: 18, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: isAnon, onChange: (e) => setIsAnon(e.target.checked), style: { width: 15, height: 15 } }), "\uC775\uBA85\uC73C\uB85C \uC791\uC131"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: submit,
      disabled: submitting || rating === 0,
      style: { width: "100%", padding: "12px 0", background: submitting || rating === 0 ? "#9A9A9A" : "#2D6A4F", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting || rating === 0 ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    submitting ? "\uB4F1\uB85D \uC911..." : "\uB9AC\uBDF0 \uB4F1\uB85D\uD558\uAE30"
  ));
}
function CounselorReviewsModal({ counselorId, counselorName, avgRating, reviewCount, onClose }) {
  const { useState: useS, useEffect: useE } = React;
  const [reviews, setReviews] = useS([]);
  const [loading, setLoading] = useS(true);
  const [page, setPage] = useS(1);
  const load = (p) => {
    setLoading(true);
    fetch(`/api/counseling/reviews/${counselorId}?page=${p}`).then((r) => r.json()).then((d) => {
      if (d.success) setReviews(d.data || []);
    }).finally(() => setLoading(false));
  };
  useE(() => load(1), [counselorId]);
  const Stars2 = ({ r }) => /* @__PURE__ */ React.createElement("span", { style: { color: "#F59E0B", fontSize: 14 } }, Array.from({ length: 5 }, (_, i) => i < Math.round(r) ? "\u2605" : "\u2606").join(""));
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", maxHeight: "80vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 22px", borderBottom: "1px solid rgba(0,0,0,.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "white", zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700 } }, counselorName, " \uC0C1\uB2F4\uC0AC \uB9AC\uBDF0"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 4 } }, /* @__PURE__ */ React.createElement(Stars2, { r: parseFloat(avgRating) || 0 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, parseFloat(avgRating || 0).toFixed(1)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#9A9A9A" } }, "(", reviewCount, "\uAC1C)"))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A9A9A", padding: "0 4px" } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 22px 22px" } }, loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : reviews.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, "\u{1F4AC}"), "\uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, reviews.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { borderBottom: "1px solid rgba(0,0,0,.06)", paddingBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement(Stars2, { r: r.rating }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "#1A1A1A" } }, r.reviewer_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#C0C0C0", marginLeft: "auto" } }, new Date(r.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" }))), r.content && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5A5A5A", lineHeight: 1.7 } }, r.content), r.counselor_reply && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, background: "#F9F9F7", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid #2D6A4F33" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 3 } }, "\uC0C1\uB2F4\uC0AC \uB2F5\uBCC0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5A5A5A", lineHeight: 1.6 } }, r.counselor_reply)))))));
}
const KAKAO_JS_KEY = "a457be7a7c4e4860244c0bf255d6d2bd";
function NearbyMapModal({ onClose, affiliatedCounselors = [] }) {
  const { useState: useS, useEffect: useE, useRef } = React;
  const [loading, setLoading] = useS(true);
  const [error, setError] = useS(null);
  const [places, setPlaces] = useS([]);
  const [affiliated, setAffiliated] = useS([]);
  const mapRef = useRef(null);
  useE(() => {
    function loadMap() {
      window.kakao.maps.load(() => {
        if (!navigator.geolocation) {
          setError("\uC704\uCE58 \uC11C\uBE44\uC2A4\uB97C \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBE0C\uB77C\uC6B0\uC800\uC785\uB2C8\uB2E4.");
          setLoading(false);
          return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const center = new window.kakao.maps.LatLng(lat, lng);
          const map = new window.kakao.maps.Map(mapRef.current, { center, level: 5 });
          new window.kakao.maps.Marker({ position: center, map, title: "\uB0B4 \uC704\uCE58" });
          fetch(`/api/nearby-counseling?lat=${lat}&lng=${lng}`).then((r) => r.json()).then((data) => {
            setAffiliated(data.affiliated || []);
            setPlaces(data.external || []);
            (data.external || []).forEach((p) => {
              const pos2 = new window.kakao.maps.LatLng(p.y, p.x);
              const marker = new window.kakao.maps.Marker({ position: pos2, map, title: p.place_name });
              const iw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:6px 10px;font-size:12px;font-family:'Noto Sans KR',sans-serif;white-space:nowrap;">${p.place_name}</div>` });
              window.kakao.maps.event.addListener(marker, "click", () => iw.open(map, marker));
            });
          }).catch(() => setError("\uC8FC\uBCC0 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.")).finally(() => setLoading(false));
        }, () => {
          setError("\uC704\uCE58 \uAD8C\uD55C\uC744 \uD5C8\uC6A9\uD574 \uC8FC\uC138\uC694.");
          setLoading(false);
        }, { timeout: 1e4 });
      });
    }
    if (window.kakao && window.kakao.maps) {
      loadMap();
    } else {
      const s = document.createElement("script");
      s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
      s.onload = loadMap;
      s.onerror = () => {
        setError("\uC9C0\uB3C4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
        setLoading(false);
      };
      document.head.appendChild(s);
    }
  }, []);
  const dist = (p) => p.distance ? `${p.distance < 1e3 ? p.distance + "m" : (p.distance / 1e3).toFixed(1) + "km"}` : "";
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3e3, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 20, width: "100%", maxWidth: 580, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 12px", borderBottom: "1px solid rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700 } }, "\u{1F4CD} \uC8FC\uBCC0 \uC0C1\uB2F4\uC13C\uD130 \uCC3E\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 2 } }, "\uB0B4 \uC704\uCE58 \uAE30\uBC18 \uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC\xB7\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A9A9A", padding: 4 } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 240, flexShrink: 0, background: "#f0f0f0" } }, /* @__PURE__ */ React.createElement("div", { ref: mapRef, style: { width: "100%", height: "100%" } }), loading && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.85)", fontSize: 13, color: "#5A5A5A", zIndex: 1 } }, "\u{1F4CD} \uC704\uCE58 \uD655\uC778 \uC911..."), error && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#FEF2F2", fontSize: 13, color: "#991B1B", padding: 20, textAlign: "center", zIndex: 1 } }, error)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "14px 16px" } }, affiliated.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 7 } }, "\u{1F33F} \uB9C8\uC74C\uD480 \uC81C\uD734 \uC0C1\uB2F4\uC0AC"), affiliated.slice(0, 3).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, style: { background: "#F0FAF4", border: "1px solid #B7E4C7", borderRadius: 10, padding: "10px 12px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, c.photo_emoji, " ", c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#5A5A5A", marginTop: 2 } }, c.title, " \xB7 ", c.center_name)), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { fontSize: 11, color: "#2D6A4F", fontWeight: 700, background: "none", border: "1px solid #2D6A4F", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC608\uC57D\uD558\uAE30")))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#5A5A5A", marginBottom: 8 } }, "\u{1F4CD} \uC8FC\uBCC0 \uAE30\uAD00 ", places.length > 0 ? `(${places.length})` : ""), !loading && places.length === 0 && !error && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0", color: "#9A9A9A", fontSize: 13 } }, "\uC8FC\uBCC0 2km \uC774\uB0B4 \uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."), places.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id || i, style: { padding: "10px 2px", borderBottom: "1px solid rgba(0,0,0,.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.place_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.road_address_name || p.address_name), p.phone && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#2D6A4F", marginTop: 2 } }, "\u260E ", p.phone)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", flexShrink: 0, textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", null, dist(p)), /* @__PURE__ */ React.createElement("a", { href: p.place_url, target: "_blank", rel: "noopener noreferrer", style: { color: "#2D6A4F", fontWeight: 600, textDecoration: "none" } }, "\uC9C0\uB3C4 \u2192"))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, padding: "12px 14px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 5 } }, "\u{1F198} \uC989\uAC01 \uB3C4\uC6C0\uC774 \uD544\uC694\uD558\uB2E4\uBA74"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#7F1D1D", lineHeight: 1.8 } }, "\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654 ", /* @__PURE__ */ React.createElement("strong", null, "\u260E 1393"), " (24\uC2DC\uAC04)", /* @__PURE__ */ React.createElement("br", null), "\uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654 ", /* @__PURE__ */ React.createElement("strong", null, "\u260E 1577-0199"), " (24\uC2DC\uAC04)", /* @__PURE__ */ React.createElement("br", null), "\uC0DD\uBA85\uC758\uC804\uD654 ", /* @__PURE__ */ React.createElement("strong", null, "\u260E 1588-9191"))))));
}
function _CounselingPageBooking({ setView, isLoggedIn, currentUser }) {
  var _a, _b;
  const { useState: useS, useEffect: useE } = React;
  const [centers, setCenters] = useS([]);
  const [counselors, setCounselors] = useS([]);
  const [dataLoading, setDataLoading] = useS(true);
  const [selectedCenter, setSelectedCenter] = useS(null);
  const [filterTag, setFilterTag] = useS(null);
  const [filterType, setFilterType] = useS(null);
  const [searchQ, setSearchQ] = useS("");
  const [bookingOpen, setBookingOpen] = useS(false);
  const [bookingTarget, setBookingTarget] = useS(null);
  const [completedAppt, setCompletedAppt] = useS(null);
  const [videoRoom, setVideoRoom] = useS(null);
  const [onboardingOpen, setOnboardingOpen] = useS(false);
  const [reviewModal, setReviewModal] = useS(null);
  const [counselorReviews, setCounselorReviews] = useS(null);
  const [showDemoNotice, setShowDemoNotice] = useS(true);
  const [nearbyOpen, setNearbyOpen] = useS(false);
  const FALLBACK_CENTERS = [
    { id: 1, name: "\uB9C8\uC74C\uC232 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", logo_emoji: "\u{1F332}", description: "\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uB300\uC778\uAD00\uACC4 \uC804\uBB38.", address: "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C \uD14C\uD5E4\uB780\uB85C 123", specialty_tags: '["\uC6B0\uC6B8","\uBD88\uC548","\uB300\uC778\uAD00\uACC4","\uC790\uC874\uAC10"]', status: "pending" },
    { id: 2, name: "\uD589\uBCF5\uD55C\uB9C8\uC74C \uC2EC\uB9AC\uCE58\uC720\uC13C\uD130", logo_emoji: "\u{1F33B}", description: "\uAC00\uC871\xB7\uBD80\uBD80 \uC0C1\uB2F4 \uC804\uBB38.", address: "\uC11C\uC6B8 \uC11C\uCD08\uAD6C \uBC29\uBC30\uB85C 456", specialty_tags: '["\uAC00\uC871","\uBD80\uBD80","\uD2B8\uB77C\uC6B0\uB9C8","PTSD"]', status: "pending" },
    { id: 3, name: "\uC11C\uC6B8 \uC778\uC9C0\uD589\uB3D9 \uC0C1\uB2F4\uD074\uB9AC\uB2C9", logo_emoji: "\u{1F9E9}", description: "CBT\xB7\uB9C8\uC74C\uCC59\uAE40 \uAE30\uBC18.", address: "\uC11C\uC6B8 \uB9C8\uD3EC\uAD6C \uD64D\uB300\uC785\uAD6C\uB85C 789", specialty_tags: '["\uBC88\uC544\uC6C3","\uAC15\uBC15","\uACF5\uD669","CBT"]', status: "pending" }
  ];
  const FALLBACK_COUNSELORS = [
    { id: 1, center_id: 1, center_name: "\uB9C8\uC74C\uC232 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", name: "\uAE40\uD558\uC740", photo_emoji: "\u{1F469}", title: "\uC0C1\uB2F4\uC2EC\uB9AC\uC0AC 1\uAE09", bio: "10\uB144\uAC04 \uC6B0\uC6B8\xB7\uBD88\uC548 \uC804\uBB38 \uC0C1\uB2F4.", specialties: '["\uC6B0\uC6B8","\uBD88\uC548","\uC790\uC874\uAC10"]', fee_per_session: 9e4, session_minutes: 50, available_types: '["video","phone","visit"]', avg_rating: 4.9, review_count: 127 },
    { id: 2, center_id: 1, center_name: "\uB9C8\uC74C\uC232 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", name: "\uBC15\uC900\uC11C", photo_emoji: "\u{1F468}", title: "\uC784\uC0C1\uC2EC\uB9AC\uC0AC 1\uAE09", bio: "\uC9C1\uC7A5\uC778 \uC2A4\uD2B8\uB808\uC2A4\xB7\uBC88\uC544\uC6C3 \uC804\uBB38.", specialties: '["\uC9C1\uC7A5\uC2A4\uD2B8\uB808\uC2A4","\uBC88\uC544\uC6C3"]', fee_per_session: 8e4, session_minutes: 50, available_types: '["video","phone"]', avg_rating: 4.7, review_count: 89 },
    { id: 3, center_id: 2, center_name: "\uD589\uBCF5\uD55C\uB9C8\uC74C \uC2EC\uB9AC\uCE58\uC720\uC13C\uD130", name: "\uC774\uC218\uBBFC", photo_emoji: "\u{1F469}", title: "\uAC00\uC871\uC0C1\uB2F4\uC0AC \uC218\uD37C\uBC14\uC774\uC800", bio: "15\uB144 \uAC00\uC871\xB7\uBD80\uBD80 \uC0C1\uB2F4 \uACBD\uD5D8.", specialties: '["\uAC00\uC871","\uBD80\uBD80","\uC774\uD63C"]', fee_per_session: 1e5, session_minutes: 60, available_types: '["video","visit"]', avg_rating: 4.8, review_count: 203 },
    { id: 4, center_id: 2, center_name: "\uD589\uBCF5\uD55C\uB9C8\uC74C \uC2EC\uB9AC\uCE58\uC720\uC13C\uD130", name: "\uCD5C\uC9C0\uC601", photo_emoji: "\u{1F469}", title: "\uC544\uB3D9\uCCAD\uC18C\uB144 \uC0C1\uB2F4\uC804\uBB38\uAC00", bio: "\uD2B8\uB77C\uC6B0\uB9C8\xB7PTSD \uC804\uBB38.", specialties: '["\uD2B8\uB77C\uC6B0\uB9C8","PTSD","\uC544\uB3D9\uCCAD\uC18C\uB144"]', fee_per_session: 12e4, session_minutes: 60, available_types: '["video","visit"]', avg_rating: 4.9, review_count: 156 },
    { id: 5, center_id: 3, center_name: "\uC11C\uC6B8 \uC778\uC9C0\uD589\uB3D9 \uC0C1\uB2F4\uD074\uB9AC\uB2C9", name: "\uC815\uBBFC\uD638", photo_emoji: "\u{1F468}", title: "CBT \uC804\uBB38 \uC0C1\uB2F4\uC0AC", bio: "\uACF5\uD669\uC7A5\uC560\xB7\uAC15\uBC15\uC7A5\uC560 \uC804\uBB38.", specialties: '["\uACF5\uD669","\uAC15\uBC15","CBT"]', fee_per_session: 85e3, session_minutes: 50, available_types: '["video","phone"]', avg_rating: 4.6, review_count: 74 }
  ];
  useE(() => {
    setDataLoading(true);
    Promise.all([cApi.centers(), cApi.counselors()]).then(([cr, co]) => {
      if (cr.success) setCenters(cr.data);
      else setCenters(FALLBACK_CENTERS);
      if (co.success) setCounselors(co.data);
      else setCounselors(FALLBACK_COUNSELORS);
    }).catch(() => {
      setCenters(FALLBACK_CENTERS);
      setCounselors(FALLBACK_COUNSELORS);
    }).finally(() => setDataLoading(false));
    try {
      const ctype = localStorage.getItem("couple_counseling_type");
      if (ctype) {
        localStorage.removeItem("couple_counseling_type");
        if (ctype === "couple" || ctype === "bowen") {
          setFilterTag("\uBD80\uBD80");
          setShowDemoNotice(false);
        }
      }
    } catch {
    }
  }, []);
  if (videoRoom) return /* @__PURE__ */ React.createElement(VideoRoom, { roomId: videoRoom.roomId, counselorName: videoRoom.counselorName, onLeave: () => setVideoRoom(null) });
  if (completedAppt) {
    const a = completedAppt;
    return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", minHeight: "100vh", background: "#FAFAF8" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 520, margin: "0 auto", padding: "72px 24px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 68, marginBottom: 18 } }, "\u{1F389}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, marginBottom: 11 } }, "\uC608\uC57D\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 26 } }, a.counselor.name, " \uC0C1\uB2F4\uC0AC\uC640\uC758 \uC0C1\uB2F4\uC774 \uD655\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC608\uC57D \uD655\uC778 \uC774\uBA54\uC77C\uC774 \uBC1C\uC1A1\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(0,0,0,.08)", marginBottom: 22, textAlign: "left" } }, [{ label: "\uC0C1\uB2F4\uC0AC", val: `${a.counselor.emoji} ${a.counselor.name} \xB7 ${a.counselor.title}` }, { label: "\uC77C\uC2DC", val: a.date ? `${a.date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ${a.time}` : "-" }, { label: "\uC720\uD615", val: `${(_a = SESSION_TYPES[a.type]) == null ? void 0 : _a.icon} ${(_b = SESSION_TYPES[a.type]) == null ? void 0 : _b.label}` }, { label: "\uACB0\uC81C\uAE08\uC561", val: fmt(a.counselor.fee) }].map((row) => /* @__PURE__ */ React.createElement("div", { key: row.label, style: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.05)", fontSize: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, row.label), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, row.val)))), a.type === "video" && a.videoRoomUrl && /* @__PURE__ */ React.createElement("div", { style: { background: "#D8F3DC", borderRadius: 11, padding: "14px 18px", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#2D6A4F", marginBottom: 5 } }, "\u{1F4F9} \uD654\uC0C1 \uC0C1\uB2F4 \uB9C1\uD06C \uC900\uBE44 \uC644\uB8CC"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#2D6A4F", marginBottom: 9 } }, "\uC0C1\uB2F4 \uC2DC\uAC04\uC5D0 \uC544\uB798 \uBC84\uD2BC\uC744 \uD074\uB9AD\uD574 \uC785\uC7A5\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement("button", { onClick: () => setVideoRoom({ roomId: a.roomId, counselorName: a.counselor.name }), style: { width: "100%", padding: "10px 0", background: "#2D6A4F", color: "white", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uD654\uC0C1 \uC0C1\uB2F4 \uC785\uC7A5\uD558\uAE30 \u2192")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 9 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("landing"), style: { flex: 1, padding: "11px 0", background: "white", border: "1px solid rgba(0,0,0,.12)", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uD648\uC73C\uB85C"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setCompletedAppt(null);
    }, style: { flex: 1, padding: "11px 0", background: "#2D6A4F", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uB2E4\uB978 \uC0C1\uB2F4\uC0AC \uBCF4\uAE30"))));
  }
  const allTags = [...new Set(counselors.flatMap((c) => parseArr(c.specialties)))];
  const filtered = counselors.filter((c) => {
    if (selectedCenter && c.center_id !== selectedCenter.id) return false;
    if (filterTag && !parseArr(c.specialties).includes(filterTag)) return false;
    if (filterType && !parseArr(c.available_types).includes(filterType)) return false;
    if (searchQ && !c.name.includes(searchQ) && !parseArr(c.specialties).some((s) => s.includes(searchQ))) return false;
    return true;
  });
  const DemoNoticeModal = () => !showDemoNotice ? null : /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2e3, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 20, padding: "32px 28px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 12 } }, "\u{1F3D7}\uFE0F"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8, fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC11C\uBE44\uC2A4 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 12, padding: "12px 16px", marginBottom: 16, textAlign: "left" } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#795548", lineHeight: 1.7, margin: 0, fontFamily: "'Noto Sans KR',sans-serif" } }, "\u26A0\uFE0F \uD604\uC7AC \uD45C\uC2DC\uB41C \uC0C1\uB2F4\uC13C\uD130 \uBC0F \uC0C1\uB2F4\uC0AC \uC815\uBCF4\uB294 ", /* @__PURE__ */ React.createElement("strong", null, "\uC11C\uBE44\uC2A4 \uAC1C\uBC1C\uC744 \uC704\uD55C \uC608\uC2DC \uB370\uC774\uD130"), "\uC785\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "\uC2E4\uC81C \uC6B4\uC601 \uC911\uC778 \uAE30\uAD00\uC774 \uC544\uB2C8\uBA70, \uC608\uC57D\xB7\uACB0\uC81C \uAE30\uB2A5\uC740 \uC81C\uD734 \uC13C\uD130 \uB4F1\uB85D \uD6C4 \uC815\uC2DD \uC6B4\uC601\uB420 \uC608\uC815\uC785\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#9E9E9E", marginBottom: 20, fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC804\uBB38 \uC0C1\uB2F4\uC774 \uD544\uC694\uD558\uC2DC\uBA74 \uC544\uB798\uB97C \uC774\uC6A9\uD574 \uC8FC\uC138\uC694", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", { style: { color: "#E53935" } }, "\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654 \u260E 1393"), " (24\uC2DC\uAC04 \uBB34\uB8CC)"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowDemoNotice(false),
      style: { width: "100%", background: "#2D6A4F", color: "white", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    "\uD655\uC778\uD588\uC2B5\uB2C8\uB2E4"
  ), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "#BDBDBD", marginTop: 10, fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC81C\uD734 \uC0C1\uB2F4\uC13C\uD130 \uB4F1\uB85D \uBB38\uC758: support@maumful.com")));
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR',sans-serif", background: "#FAFAF8", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(DemoNoticeModal, null), nearbyOpen && /* @__PURE__ */ React.createElement(NearbyMapModal, { onClose: () => setNearbyOpen(false), affiliatedCounselors: counselors }), /* @__PURE__ */ React.createElement("div", { style: { background: "linear-gradient(135deg,#F0FAF4,#FAFAF8)", borderBottom: "1px solid rgba(0,0,0,.07)", padding: "44px 24px 34px" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, selectedCenter ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setSelectedCenter(null);
    setFilterTag(null);
  }, style: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#2D6A4F", fontFamily: "'Noto Sans KR',sans-serif", marginBottom: 9, padding: 0, fontWeight: 600 } }, "\u2190 \uC13C\uD130 \uBAA9\uB85D\uC73C\uB85C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 40 } }, selectedCenter.logo_emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 3 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 24, fontWeight: 700 } }, selectedCenter.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: "#FEF3C7", color: "#B45309" } }, "\u23F3 \uC81C\uD734 \uC9C4\uD589\uC911")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A5A5A" } }, selectedCenter.address)))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", background: "#D8F3DC", color: "#2D6A4F", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, marginBottom: 12 } }, "Counseling"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 32, fontWeight: 700, marginBottom: 9 } }, "\uC804\uBB38 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uC0C1\uB2F4\uC0AC"), "\uC640 \uC5F0\uACB0\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: "#5A5A5A", maxWidth: 420, margin: 0 } }, "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uB098\uC5D0\uAC8C \uB9DE\uB294 \uC0C1\uB2F4\uC0AC\uB97C \uCC3E\uACE0 \uAC04\uD3B8\uD558\uAC8C \uC608\uC57D\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement("button", { onClick: () => setNearbyOpen(true), style: { flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "white", border: "1.5px solid #2D6A4F", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#2D6A4F", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", boxShadow: "0 2px 8px rgba(45,106,79,.12)" } }, "\u{1F4CD} \uC8FC\uBCC0 \uC0C1\uB2F4\uC13C\uD130 \uCC3E\uAE30"))))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" } }, !selectedCenter && !dataLoading && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 28 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#5A5A5A", marginBottom: 10 } }, "\uC81C\uD734 \uC0C1\uB2F4\uC13C\uD130"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11 }, className: "centers-grid" }, centers.map((center) => {
    const tags = parseArr(center.specialty_tags), cc = getCC(center.id);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: center.id,
        onClick: () => setSelectedCenter(center),
        style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 13, padding: "16px 15px", cursor: "pointer", transition: "all .2s", borderLeft: `4px solid ${cc.color}` },
        onMouseEnter: (e) => {
          e.currentTarget.style.boxShadow = "0 5px 20px rgba(0,0,0,.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24 } }, center.logo_emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, center.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100, background: "#FEF3C7", color: "#B45309" } }, "\u23F3 \uC81C\uD734 \uC9C4\uD589\uC911"))),
      /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#6A6A6A", lineHeight: 1.6, marginBottom: 7 } }, center.description),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 3 } }, tags.slice(0, 3).map((t) => /* @__PURE__ */ React.createElement("span", { key: t, style: { fontSize: 10, padding: "2px 6px", borderRadius: 100, background: cc.bg, color: cc.color, fontWeight: 600 } }, t)), tags.length > 3 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#9A9A9A" } }, "+", tags.length - 3)),
      /* @__PURE__ */ React.createElement("div", { style: { marginTop: 7, fontSize: 11, color: "#9A9A9A" } }, "\uC0C1\uB2F4\uC0AC ", counselors.filter((c) => c.center_id === center.id).length, "\uBA85 \u2192")
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 13, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 160, position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9A9A9A" } }, "\u{1F50D}"), /* @__PURE__ */ React.createElement("input", { value: searchQ, onChange: (e) => setSearchQ(e.target.value), placeholder: "\uC0C1\uB2F4\uC0AC \uC774\uB984 \uB610\uB294 \uC804\uBB38 \uBD84\uC57C", style: { width: "100%", padding: "8px 11px 8px 30px", borderRadius: 9, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", background: "white" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, [null, "video", "phone", "visit"].map((t) => {
    var _a2, _b2;
    return /* @__PURE__ */ React.createElement("button", { key: String(t), onClick: () => setFilterType(t), style: { padding: "7px 11px", borderRadius: 7, border: "1px solid", borderColor: filterType === t ? "#2D6A4F" : "rgba(0,0,0,.10)", background: filterType === t ? "#D8F3DC" : "white", color: filterType === t ? "#2D6A4F" : "#5A5A5A", fontSize: 12, fontWeight: filterType === t ? 700 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, t === null ? "\uC804\uCCB4" : ((_a2 = SESSION_TYPES[t]) == null ? void 0 : _a2.icon) + " " + ((_b2 = SESSION_TYPES[t]) == null ? void 0 : _b2.label));
  }))), filterTag === "\uBD80\uBD80" && /* @__PURE__ */ React.createElement("div", { style: {
    marginBottom: 14,
    padding: "12px 16px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #FFF0F3, #F0EEF8)",
    border: "1px solid #D4849A33",
    display: "flex",
    alignItems: "center",
    gap: 10
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, "\u{1F495}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#2C2020" } }, "\uB9C8\uC74C\uCEE4\uD50C \uBD84\uC11D \uACB0\uACFC \uC5F0\uB3D9"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#8A8A7A", marginTop: 2 } }, "\uCEE4\uD50C \uBD84\uC11D \uB9AC\uD3EC\uD2B8\uB97C \uBC14\uD0D5\uC73C\uB85C \uBD80\uBD80\xB7\uAC00\uC871 \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uB97C \uCD94\uCC9C\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterTag(null), style: {
    background: "none",
    border: "none",
    color: "#8A8A7A",
    fontSize: 16,
    cursor: "pointer"
  } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterTag(null), style: { padding: "3px 10px", borderRadius: 100, border: "1px solid", borderColor: !filterTag ? "#2D6A4F" : "rgba(0,0,0,.10)", background: !filterTag ? "#2D6A4F" : "white", color: !filterTag ? "white" : "#5A5A5A", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC804\uCCB4"), allTags.map((tag) => /* @__PURE__ */ React.createElement("button", { key: tag, onClick: () => setFilterTag(tag === filterTag ? null : tag), style: { padding: "3px 10px", borderRadius: 100, border: "1px solid", borderColor: filterTag === tag ? "#2D6A4F" : "rgba(0,0,0,.10)", background: filterTag === tag ? "#D8F3DC" : "white", color: filterTag === tag ? "#2D6A4F" : "#5A5A5A", fontSize: 11, fontWeight: filterTag === tag ? 700 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, tag))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 12 } }, "\uC0C1\uB2F4\uC0AC ", /* @__PURE__ */ React.createElement("strong", { style: { color: "#1A1A1A" } }, filtered.length, "\uBA85")), dataLoading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "36px 0", color: "#9A9A9A" } }, "\uBD88\uB7EC\uC624\uB294 \uC911...") : filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "44px 0", color: "#9A9A9A" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 9 } }, "\u{1F50D}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4")) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }, className: "counselor-grid" }, filtered.map((c) => {
    const cc = getCC(c.center_id), specs = parseArr(c.specialties), types = parseArr(c.available_types);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 13, padding: "18px 16px 14px", display: "flex", flexDirection: "column", gap: 9, transition: "all .2s" },
        onMouseEnter: (e) => {
          e.currentTarget.style.boxShadow = `0 5px 24px ${cc.color}1A`;
          e.currentTarget.style.borderColor = cc.color + "44";
          e.currentTarget.style.transform = "translateY(-2px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "rgba(0,0,0,.08)";
          e.currentTarget.style.transform = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: cc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 } }, c.photo_emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700 } }, c.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: cc.color, background: cc.bg, padding: "2px 6px", borderRadius: 100, fontWeight: 600 } }, c.title)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 1 } }, c.center_name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 2 } }, /* @__PURE__ */ React.createElement(Stars, { rating: parseFloat(c.avg_rating) || 0, size: 11 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600 } }, parseFloat(c.avg_rating || 0).toFixed(1)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#9A9A9A" } }, "(", c.review_count, ")"))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, fmt(c.fee_per_session)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A" } }, c.session_minutes, "\uBD84"))),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 3 } }, specs.map((s) => /* @__PURE__ */ React.createElement("span", { key: s, style: { fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 100, background: cc.bg, color: cc.color } }, s))),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2, gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3, flexWrap: "wrap" } }, types.map((t) => {
        var _a2, _b2;
        return /* @__PURE__ */ React.createElement("span", { key: t, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#F5F5F0", color: "#5A5A5A" } }, (_a2 = SESSION_TYPES[t]) == null ? void 0 : _a2.icon, " ", (_b2 = SESSION_TYPES[t]) == null ? void 0 : _b2.label);
      })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, flexShrink: 0 } }, (c.review_count || 0) > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setCounselorReviews({ id: c.id, name: c.name, avg: c.avg_rating, cnt: c.review_count }), style: { background: "#FEF3C7", color: "#B45309", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap" } }, "\u2B50 \uB9AC\uBDF0"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
        setBookingTarget({ id: c.id, emoji: c.photo_emoji, name: c.name, title: c.title, centerName: c.center_name, centerId: c.center_id, fee: c.fee_per_session, minutes: c.session_minutes, types: parseArr(c.available_types) });
        setBookingOpen(true);
      }, style: { background: cc.color, color: "white", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap" } }, "\uC608\uC57D\uD558\uAE30")))
    );
  })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 36, background: "white", border: "1px dashed rgba(0,0,0,.12)", borderRadius: 13, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, "\uC0C1\uB2F4\uC13C\uD130 \uC81C\uD734 \uC2E0\uCCAD"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5A5A5A", lineHeight: 1.6 } }, "\uADC0 \uC13C\uD130\uC758 \uC0C1\uB2F4\uC0AC\uB97C \uB9C8\uC74C\uD480\uC5D0 \uB4F1\uB85D\uD558\uACE0 \uB354 \uB9CE\uC740 \uB0B4\uB2F4\uC790\uB97C \uB9CC\uB098\uC138\uC694.")), /* @__PURE__ */ React.createElement("button", { onClick: () => setOnboardingOpen(true), style: { background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC81C\uD734 \uC2E0\uCCAD\uD558\uAE30 \u2192"))), onboardingOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setOnboardingOpen(false);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 72px rgba(0,0,0,.25)" } }, /* @__PURE__ */ React.createElement(OnboardingForm, { onClose: () => setOnboardingOpen(false), isLoggedIn: false }))), reviewModal && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setReviewModal(null);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 20px 72px rgba(0,0,0,.25)" } }, /* @__PURE__ */ React.createElement(ReviewModal, { appointmentId: reviewModal.appointmentId, counselorName: reviewModal.counselorName, onClose: () => setReviewModal(null), onDone: () => {
    setReviewModal(null);
    alert("\uB9AC\uBDF0\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uAC10\uC0AC\uD569\uB2C8\uB2E4!");
  } }))), counselorReviews && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setCounselorReviews(null);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 18, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 72px rgba(0,0,0,.25)" } }, /* @__PURE__ */ React.createElement(CounselorReviewsModal, { counselorId: counselorReviews.id, counselorName: counselorReviews.name, avgRating: counselorReviews.avg, reviewCount: counselorReviews.cnt, onClose: () => setCounselorReviews(null) }))), bookingOpen && bookingTarget && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setBookingOpen(false);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 18, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 72px rgba(0,0,0,.25)" } }, /* @__PURE__ */ React.createElement(BookingModal, { counselor: bookingTarget, onClose: () => setBookingOpen(false), onComplete: (a) => {
    setBookingOpen(false);
    setCompletedAppt(a);
  }, isLoggedIn, setView }))));
}
function CounselingPage({ setView }) {
  const { useState: useS, useEffect: useE, useRef } = React;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const s = { fontFamily: "'Noto Sans KR',sans-serif" };
  const [phase, setPhase] = useS("init");
  const [places, setPlaces] = useS([]);
  const [userPos, setUserPos] = useS(null);
  const [activeFilter, setFilter] = useS("all");
  const CATS = {
    psych: { label: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC", color: "#0284C7", bg: "#EFF6FF", border: "#BAE6FD", emoji: "\u{1F9E0}" },
    center: { label: "\uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", emoji: "\u{1F3E2}" },
    counsel: { label: "\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", color: "#2D6A4F", bg: "#F0FDF4", border: "#86EFAC", emoji: "\u{1F3E5}" }
  };
  const getCat = (p) => {
    const c = p.category_name || "";
    if (c.includes("\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC") || c.includes("\uC815\uC2E0\uACFC")) return CATS.psych;
    if (c.includes("\uBCF5\uC9C0\uC13C\uD130") || c.includes("\uC815\uC2E0\uAC74\uAC15\uC13C\uD130")) return CATS.center;
    return CATS.counsel;
  };
  const HOTLINES = [
    { name: "\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654", tel: "109", desc: "24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uBCF4\uAC74\uBCF5\uC9C0\uBD80", color: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5" },
    { name: "\uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654", tel: "1577-0199", desc: "24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uC804\uAD6D \uC5F0\uACB0", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
    { name: "\uCCAD\uC18C\uB144\uC0C1\uB2F4\uC804\uD654", tel: "1388", desc: "24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uC5EC\uC131\uAC00\uC871\uBD80", color: "#8B5CF6", bg: "#F5F3FF", border: "#C4B5FD" }
  ];
  useE(() => {
    if (!window.KAKAO_APP_KEY) {
      setPhase("nokey");
      return;
    }
    setPhase("loading");
    if (window.kakao && window.kakao.maps) {
      initGeo();
      return;
    }
    const sc = document.createElement("script");
    sc.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${window.KAKAO_APP_KEY}&libraries=services&autoload=false`;
    sc.onload = () => window.kakao.maps.load(initGeo);
    sc.onerror = () => setPhase("error");
    document.head.appendChild(sc);
  }, []);
  const initGeo = () => {
    if (!navigator.geolocation) {
      setPhase("nogeo");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setUserPos({ lat, lng });
        fetchPlaces(lat, lng);
      },
      () => setPhase("nogeo"),
      { timeout: 1e4 }
    );
  };
  const fetchPlaces = async (lat, lng) => {
    try {
      const r = await fetch(`/api/nearby-counseling?lat=${lat}&lng=${lng}&radius=3000`);
      const d = await r.json();
      setPlaces(d.external || []);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  };
  useE(() => {
    if (phase !== "done" || !userPos || !mapContainerRef.current) return;
    const { kakao } = window;
    const map = new kakao.maps.Map(mapContainerRef.current, {
      center: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      level: 5
    });
    mapInstanceRef.current = map;
    new kakao.maps.CustomOverlay({
      map,
      position: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      content: '<div style="background:#1B4332;color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">\u{1F4CD} \uB0B4 \uC704\uCE58</div>',
      yAnchor: 1.6
    });
    places.forEach((p) => {
      const cat = getCat(p);
      new kakao.maps.CustomOverlay({
        map,
        position: new kakao.maps.LatLng(Number(p.y), Number(p.x)),
        content: `<div style="background:${cat.color};color:white;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.2);cursor:pointer">${cat.emoji} ${p.place_name}</div>`,
        yAnchor: 1.5
      });
    });
  }, [phase, userPos, places]);
  const SearchFallback = () => /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 16px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#92400E", ...s } }, phase === "nogeo" ? "\u{1F4CD} \uC704\uCE58 \uAD8C\uD55C\uC744 \uD5C8\uC6A9\uD558\uBA74 \uC9C0\uB3C4\uC5D0\uC11C \uBC14\uB85C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC544\uB798 \uBC84\uD2BC\uC73C\uB85C \uCE74\uCE74\uC624\uB9F5\uC5D0\uC11C \uAC80\uC0C9\uD558\uC138\uC694." : "\u{1F50D} \uCE74\uCE74\uC624\uB9F5\uC5D0\uC11C \uC8FC\uBCC0 \uC0C1\uB2F4 \uAE30\uAD00\uC744 \uAC80\uC0C9\uD574 \uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } }, [{ q: "\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", e: "\u{1F3E5}" }, { q: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC", e: "\u{1F9E0}" }, { q: "\uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130", e: "\u{1F3E2}" }, { q: "\uCCAD\uC18C\uB144\uC0C1\uB2F4\uBCF5\uC9C0\uC13C\uD130", e: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}" }].map(({ q, e }) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: q,
      onClick: () => window.open(`https://map.kakao.com/?q=${encodeURIComponent(q)}`, "_blank", "noopener"),
      style: {
        ...s,
        padding: "12px 8px",
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151"
      }
    },
    e,
    " ",
    q
  ))));
  const filtered = activeFilter === "all" ? places : places.filter((p) => getCat(p).label === activeFilter);
  return /* @__PURE__ */ React.createElement("div", { style: { ...s, minHeight: "100vh", background: "#F8FAF9", paddingBottom: 48 } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 640, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 16px 12px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("landing"),
      style: { ...s, background: "none", border: "none", color: "#9A9A9A", fontSize: 14, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }
    },
    "\u2190 \uD648\uC73C\uB85C"
  ), /* @__PURE__ */ React.createElement("h1", { style: { ...s, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 3 } }, "\u{1F3E5} \uC778\uADFC \uC0C1\uB2F4 \uAE30\uAD00 \uCC3E\uAE30"), /* @__PURE__ */ React.createElement("p", { style: { ...s, fontSize: 13, color: "#6B7280" } }, "\uB0B4 \uC704\uCE58 \uAE30\uC900 3km \uC774\uB0B4 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130\xB7\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC\xB7\uBCF5\uC9C0\uC13C\uD130")), (phase === "init" || phase === "loading") && /* @__PURE__ */ React.createElement("div", { style: { height: 320, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("style", null, `@keyframes spin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, border: "3px solid #2D6A4F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" } }), /* @__PURE__ */ React.createElement("p", { style: { ...s, fontSize: 13, color: "#6B7280" } }, "\uC704\uCE58 \uD655\uC778 \uC911...")), phase === "done" && /* @__PURE__ */ React.createElement("div", { ref: mapContainerRef, style: { width: "100%", height: 340 } }), (phase === "nogeo" || phase === "error" || phase === "nokey") && /* @__PURE__ */ React.createElement(SearchFallback, null), phase === "done" && places.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px", display: "flex", gap: 7, overflowX: "auto" } }, [
    { key: "all", label: `\uC804\uCCB4 (${places.length})`, color: "#374151", bg: "#F3F4F6", border: "#D1D5DB" },
    ...Object.values(CATS).map((c) => ({
      key: c.label,
      label: `${c.emoji} ${c.label} (${places.filter((p) => getCat(p).label === c.label).length})`,
      color: c.color,
      bg: c.bg,
      border: c.border
    }))
  ].map((f) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: f.key,
      onClick: () => setFilter(f.key),
      style: {
        ...s,
        padding: "6px 13px",
        borderRadius: 100,
        border: `1.5px solid ${activeFilter === f.key ? f.color : "#E5E7EB"}`,
        background: activeFilter === f.key ? f.bg : "white",
        color: activeFilter === f.key ? f.color : "#6B7280",
        fontWeight: activeFilter === f.key ? 700 : 400,
        fontSize: 11,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0
      }
    },
    f.label
  ))), phase === "done" && /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 0" } }, filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { ...s, textAlign: "center", padding: "24px 0", color: "#9A9A9A", fontSize: 13 } }, "\uD574\uB2F9 \uCE74\uD14C\uACE0\uB9AC \uAE30\uAD00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4") : filtered.map((p) => {
    const cat = getCat(p);
    const dist = p.distance >= 1e3 ? `${(p.distance / 1e3).toFixed(1)}km` : `${p.distance}m`;
    return /* @__PURE__ */ React.createElement("div", { key: p.id, style: {
      background: "white",
      border: "1px solid #E5E7EB",
      borderLeft: `4px solid ${cat.color}`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 9,
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 22,
      width: 40,
      height: 40,
      background: cat.bg,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    } }, cat.emoji), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { ...s, fontSize: 14, fontWeight: 700, color: "#1A1A1A" } }, p.place_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: cat.bg, color: cat.color, flexShrink: 0 } }, cat.label)), /* @__PURE__ */ React.createElement("div", { style: { ...s, fontSize: 12, color: "#6B7280", marginBottom: 8 } }, "\u{1F4CD} ", p.road_address_name || p.address_name, "\xA0\xB7\xA0", /* @__PURE__ */ React.createElement("span", { style: { color: cat.color, fontWeight: 600 } }, dist)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap" } }, p.phone && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: `tel:${p.phone.replace(/-/g, "")}`,
        style: {
          ...s,
          fontSize: 12,
          fontWeight: 700,
          color: "white",
          background: cat.color,
          padding: "5px 13px",
          borderRadius: 8,
          textDecoration: "none"
        }
      },
      "\u{1F4DE} ",
      p.phone
    ), p.place_url && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: p.place_url,
        target: "_blank",
        rel: "noopener noreferrer",
        style: {
          ...s,
          fontSize: 12,
          fontWeight: 600,
          color: cat.color,
          background: cat.bg,
          padding: "5px 13px",
          borderRadius: 8,
          textDecoration: "none",
          border: `1px solid ${cat.border}`
        }
      },
      "\uC9C0\uB3C4 \uBCF4\uAE30"
    ))));
  })), phase === "done" && /* @__PURE__ */ React.createElement("div", { style: {
    ...s,
    margin: "8px 16px 16px",
    background: "#ECFDF5",
    border: "1px solid #6EE7B7",
    borderRadius: 11,
    padding: "10px 14px",
    fontSize: 12,
    color: "#065F46",
    lineHeight: 1.7
  } }, "\u2139\uFE0F \uC0C1\uB2F4 \uC608\uC57D\uACFC \uBE44\uC6A9 \uACB0\uC81C\uB294 \uAC01 \uAE30\uAD00\uC5D0 \uC9C1\uC811 \uBB38\uC758\uD574 \uC8FC\uC138\uC694. \uB9C8\uC74C\uD480\uC740 \uC815\uBCF4 \uC548\uB0B4\uB9CC \uC81C\uACF5\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 16px 0" } }, /* @__PURE__ */ React.createElement("h2", { style: { ...s, fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 } }, "\u{1F4DE} 24\uC2DC\uAC04 \uBB34\uB8CC \uC0C1\uB2F4\uC804\uD654"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, HOTLINES.map((h) => /* @__PURE__ */ React.createElement("div", { key: h.name, style: {
    background: h.bg,
    border: `1px solid ${h.border}`,
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { ...s, fontSize: 13, fontWeight: 700, color: "#1A1A1A" } }, h.name), /* @__PURE__ */ React.createElement("div", { style: { ...s, fontSize: 11, color: "#6B7280", marginTop: 2 } }, h.desc)), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: `tel:${h.tel.replace(/-/g, "")}`,
      style: {
        ...s,
        background: h.color,
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        padding: "7px 16px",
        borderRadius: 10,
        textDecoration: "none",
        whiteSpace: "nowrap",
        flexShrink: 0
      }
    },
    h.tel
  )))))));
}
