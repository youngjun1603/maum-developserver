const aApi = {
  _h() {
    const s = localStorage.getItem("admin_secret");
    return s ? { "Authorization": "Bearer " + s, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  },
  async stats() {
    return (await fetch("/api/admin/counseling/stats", { headers: this._h() })).json();
  },
  async centers() {
    return (await fetch("/api/admin/counseling/centers", { headers: this._h() })).json();
  },
  async centerStatus(id, status, reason) {
    return (await fetch(`/api/admin/counseling/centers/${id}/status`, { method: "PATCH", headers: this._h(), body: JSON.stringify({ status, rejected_reason: reason }) })).json();
  },
  async counselors() {
    return (await fetch("/api/admin/counseling/counselors", { headers: this._h() })).json();
  },
  async patchCounselor(id, body) {
    return (await fetch(`/api/admin/counseling/counselors/${id}`, { method: "PATCH", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async appointments(status, page = 1) {
    return (await fetch(`/api/admin/counseling/appointments?status=${status}&page=${page}`, { headers: this._h() })).json();
  },
  async completeAppt(id) {
    return (await fetch(`/api/admin/counseling/appointments/${id}/complete`, { method: "PATCH", headers: this._h() })).json();
  },
  async settlements() {
    return (await fetch("/api/admin/counseling/settlements", { headers: this._h() })).json();
  },
  async createSettlement(b) {
    return (await fetch("/api/admin/counseling/settlements", { method: "POST", headers: this._h(), body: JSON.stringify(b) })).json();
  },
  async processSettlement(id, note) {
    return (await fetch(`/api/admin/counseling/settlements/${id}/process`, { method: "PATCH", headers: this._h(), body: JSON.stringify({ note }) })).json();
  },
  async onboarding() {
    return (await fetch("/api/admin/counseling/onboarding", { headers: this._h() })).json();
  },
  async reviewOnboarding(id, status, note) {
    return (await fetch(`/api/admin/counseling/onboarding/${id}`, { method: "PATCH", headers: this._h(), body: JSON.stringify({ status, admin_note: note }) })).json();
  },
  async globalStats() {
    return (await fetch("/api/admin/stats", { headers: this._h() })).json();
  },
  async dailyStats(days = 14) {
    return (await fetch(`/api/admin/stats/daily?days=${days}`, { headers: this._h() })).json();
  },
  async testStats() {
    return (await fetch("/api/admin/stats/tests", { headers: this._h() })).json();
  },
  async users(page = 1, search = "") {
    return (await fetch(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`, { headers: this._h() })).json();
  },
  async grantCredits(id, amount, reason) {
    return (await fetch(`/api/admin/users/${id}/credits`, { method: "POST", headers: this._h(), body: JSON.stringify({ amount, reason }) })).json();
  },
  async deleteUser(id) {
    return (await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: this._h() })).json();
  },
  async errorLogs(service = "", limit = 50) {
    return (await fetch(`/api/admin/error-logs?service=${encodeURIComponent(service)}&limit=${limit}`, { headers: this._h() })).json();
  },
  async clearErrorLogs() {
    return (await fetch("/api/admin/error-logs", { method: "DELETE", headers: this._h() })).json();
  },
  async reviews(page = 1) {
    return (await fetch(`/api/admin/counseling/reviews?page=${page}`, { headers: this._h() })).json();
  },
  async toggleReview(id, hidden) {
    return (await fetch(`/api/admin/counseling/reviews/${id}/visibility`, { method: "PATCH", headers: this._h(), body: JSON.stringify({ hidden }) })).json();
  },
  // ── 센터 CRUD ───────────────────────────────────────────────
  async createCenter(body) {
    return (await fetch("/api/admin/counseling/centers", { method: "POST", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async updateCenter(id, body) {
    return (await fetch(`/api/admin/counseling/centers/${id}`, { method: "PUT", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async deleteCenter(id) {
    return (await fetch(`/api/admin/counseling/centers/${id}`, { method: "DELETE", headers: this._h() })).json();
  },
  // ── 상담사 CRUD + 스케줄 ────────────────────────────────────
  async createCounselor(body) {
    return (await fetch("/api/admin/counseling/counselors", { method: "POST", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async updateCounselor(id, body) {
    return (await fetch(`/api/admin/counseling/counselors/${id}`, { method: "PUT", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async deleteCounselor(id) {
    return (await fetch(`/api/admin/counseling/counselors/${id}`, { method: "DELETE", headers: this._h() })).json();
  },
  async getSchedules(id) {
    return (await fetch(`/api/admin/counseling/counselors/${id}/schedules`, { headers: this._h() })).json();
  },
  async saveSchedules(id, schedules) {
    return (await fetch(`/api/admin/counseling/counselors/${id}/schedules`, { method: "POST", headers: this._h(), body: JSON.stringify({ schedules }) })).json();
  },
  // ── 파트너 채널 관리 ─────────────────────────────────────────
  async partners() {
    return (await fetch("/api/admin/partners", { headers: this._h() })).json();
  },
  async createPartner(body) {
    return (await fetch("/api/admin/partners", { method: "POST", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async updatePartner(code, body) {
    return (await fetch(`/api/admin/partners/${code}`, { method: "PATCH", headers: this._h(), body: JSON.stringify(body) })).json();
  },
  async partnerStats(code, from, to) {
    return (await fetch(`/api/admin/partner-stats?code=${code}&from=${from}&to=${to}`, { headers: this._h() })).json();
  },
  async partnerSettlement(code, month) {
    return (await fetch(`/api/admin/partner-settlement?code=${code}&month=${month}`, { headers: this._h() })).json();
  }
};
const fmtW = (n) => Number(n || 0).toLocaleString("ko-KR") + "\uC6D0";
const fmtDt = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
};
function Chip({ label, color = "gray" }) {
  const C = { green: { bg: "#D8F3DC", text: "#1A6B3C" }, amber: { bg: "#FEF3C7", text: "#B45309" }, red: { bg: "#FEF2F2", text: "#991B1B" }, blue: { bg: "#EEF0FF", text: "#5B21B6" }, gray: { bg: "#F5F5F0", text: "#5A5A5A" } };
  const s = C[color] || C.gray;
  return React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.text } }, label);
}
function StatCard({ icon, label, value, sub, color = "#2D6A4F" }) {
  return /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 9, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 } }, icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#9A9A9A", fontWeight: 500 } }, label)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 } }, value), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 4 } }, sub));
}
function Table({ cols, rows, renderRow }) {
  return /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1.5px solid rgba(0,0,0,.08)" } }, cols.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, style: { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#9A9A9A", whiteSpace: "nowrap" } }, c)))), /* @__PURE__ */ React.createElement("tbody", null, rows.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: cols.length, style: { padding: "32px 0", textAlign: "center", color: "#9A9A9A" } }, "\uB370\uC774\uD130 \uC5C6\uC74C")) : rows.map((r, i) => renderRow(r, i)))));
}
function MiniBarChart({ data, keys, colors, height = 60 }) {
  if (!data || !data.length) return null;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(...keys.map((k) => d[k] || 0))));
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 2, height, padding: "4px 0" } }, data.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: "100%", position: "relative" } }, keys.map((k, ki) => /* @__PURE__ */ React.createElement("div", { key: k, title: `${d.date || ""} ${k}: ${d[k] || 0}`, style: {
    flex: 1,
    borderRadius: "2px 2px 0 0",
    background: colors[ki] || "#999",
    height: `${Math.round((d[k] || 0) / maxVal * 100)}%`,
    minHeight: 1,
    transition: "height .2s"
  } })))));
}
function AdminOverview() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
  const { useState: useS, useEffect: useE } = React;
  const [stats, setStats] = useS(null);
  const [gStats, setGStats] = useS(null);
  const [daily, setDaily] = useS([]);
  const [testBreakdown, setTestBreakdown] = useS([]);
  const [loading, setLoading] = useS(true);
  useE(() => {
    Promise.all([aApi.stats(), aApi.globalStats(), aApi.dailyStats(14), aApi.testStats()]).then(([s2, g, d, t]) => {
      if (s2.success) setStats(s2.data);
      if (g.success) setGStats(g.data);
      if (d.success) {
        const raw = d.data || {};
        const m = {};
        const mk = (day) => {
          if (!m[day]) m[day] = { date: day, signups: 0, tests: 0, chats: 0, charges: 0 };
        };
        (raw.signups || []).forEach((r) => {
          mk(r.day);
          m[r.day].signups = r.cnt;
        });
        (raw.tests || []).forEach((r) => {
          mk(r.day);
          m[r.day].tests = r.cnt;
        });
        (raw.chats || []).forEach((r) => {
          mk(r.day);
          m[r.day].chats = r.cnt;
        });
        (raw.revenue || []).forEach((r) => {
          mk(r.day);
          m[r.day].charges = r.cnt;
        });
        setDaily(Object.values(m).sort((a, b) => a.date > b.date ? 1 : -1).slice(-14));
      }
      if (t.success) setTestBreakdown(t.data || []);
    }).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...");
  if (!stats) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#E24B4A" } }, "\uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328");
  const s = stats;
  const totalTests = testBreakdown.reduce((a, t) => a + (t.count || 0), 0) || 1;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#5A5A5A" } }, "\uC0C1\uB2F4 \uD50C\uB7AB\uD3FC \uD604\uD669"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 } }, /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F3E5}", label: "\uB4F1\uB85D \uC13C\uD130", value: `${((_a = s.centers) == null ? void 0 : _a.total) || 0}\uAC1C`, sub: `\uD65C\uC131 ${((_b = s.centers) == null ? void 0 : _b.active) || 0} \xB7 \uC2EC\uC0AC\uC911 ${((_c = s.centers) == null ? void 0 : _c.pending) || 0}`, color: "#2D6A4F" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F465}", label: "\uD65C\uC131 \uC0C1\uB2F4\uC0AC", value: `${((_d = s.counselors) == null ? void 0 : _d.active) || 0}\uBA85`, sub: `\uC804\uCCB4 ${((_e = s.counselors) == null ? void 0 : _e.total) || 0}\uBA85`, color: "#7C3AED" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F4C5}", label: "\uC774\uBC88 \uB2EC \uB9E4\uCD9C", value: fmtW((_f = s.revenue) == null ? void 0 : _f.month_revenue), sub: `\uB204\uC801 ${fmtW((_g = s.revenue) == null ? void 0 : _g.total_revenue)}`, color: "#F59E0B" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u2B50", label: "\uD3C9\uADE0 \uD3C9\uC810", value: `${parseFloat(((_h = s.reviews) == null ? void 0 : _h.avg_rating) || 0).toFixed(1)}\uC810`, sub: `\uB9AC\uBDF0 ${((_i = s.reviews) == null ? void 0 : _i.total) || 0}\uAC74`, color: "#EF4444" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 } }, /* @__PURE__ */ React.createElement(StatCard, { icon: "\u2705", label: "\uD655\uC815 \uC608\uC57D", value: `${((_j = s.appointments) == null ? void 0 : _j.confirmed) || 0}\uAC74`, color: "#3B82F6" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F389}", label: "\uC644\uB8CC \uC0C1\uB2F4", value: `${((_k = s.appointments) == null ? void 0 : _k.completed) || 0}\uAC74`, color: "#10B981" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F4CB}", label: "\uC624\uB298 \uC2E0\uADDC \uC608\uC57D", value: `${((_l = s.appointments) == null ? void 0 : _l.today) || 0}\uAC74`, color: "#F97316" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F4E8}", label: "\uC628\uBCF4\uB529 \uC2E0\uCCAD", value: `${((_m = s.onboarding) == null ? void 0 : _m.pending) || 0}\uAC74`, sub: "\uAC80\uD1A0 \uB300\uAE30", color: "#EC4899" })), gStats && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#5A5A5A" } }, "\uC2EC\uB9AC\uAC80\uC0AC \uD50C\uB7AB\uD3FC \uD604\uD669"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F464}", label: "\uC804\uCCB4 \uD68C\uC6D0", value: `${((_n = gStats.users) == null ? void 0 : _n.total) || 0}\uBA85`, sub: `\uC624\uB298 \uC2E0\uADDC ${((_o = gStats.users) == null ? void 0 : _o.new_today) || 0}\uBA85` }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F9E0}", label: "\uAC80\uC0AC \uC218\uD589", value: `${((_p = gStats.tests) == null ? void 0 : _p.total) || 0}\uD68C`, sub: `\uC624\uB298 ${((_q = gStats.tests) == null ? void 0 : _q.today) || 0}\uD68C` }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F4AC}", label: "AI \uCC44\uD305", value: `${((_r = gStats.chats) == null ? void 0 : _r.total) || 0}\uD68C`, sub: `\uC624\uB298 ${((_s = gStats.chats) == null ? void 0 : _s.today) || 0}\uD68C` }), /* @__PURE__ */ React.createElement(StatCard, { icon: "\u{1F4B3}", label: "\uC774\uBC88\uB2EC \uACB0\uC81C", value: fmtW((_t = gStats.charges) == null ? void 0 : _t.revenue), sub: `${((_u = gStats.charges) == null ? void 0 : _u.cnt) || 0}\uAC74` }))), daily.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#5A5A5A", marginBottom: 4 } }, "\u{1F4C8} \uC77C\uBCC4 \uC2E0\uADDC\uAC00\uC785 / \uAC80\uC0AC \uC218\uD589 (\uCD5C\uADFC 14\uC77C)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#3B82F6", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 2, background: "#3B82F6", display: "inline-block" } }), "\uAC00\uC785"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#10B981", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 2, background: "#10B981", display: "inline-block" } }), "\uAC80\uC0AC")), /* @__PURE__ */ React.createElement(MiniBarChart, { data: daily, keys: ["signups", "tests"], colors: ["#3B82F6", "#10B981"], height: 72 }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#C0C0C0" } }, ((_w = (_v = daily[0]) == null ? void 0 : _v.date) == null ? void 0 : _w.slice(5)) || ""), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#C0C0C0" } }, ((_y = (_x = daily[daily.length - 1]) == null ? void 0 : _x.date) == null ? void 0 : _y.slice(5)) || ""))), /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#5A5A5A", marginBottom: 4 } }, "\u{1F4AC} \uC77C\uBCC4 AI \uCC44\uD305 / \uACB0\uC81C \uAC74\uC218 (\uCD5C\uADFC 14\uC77C)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7C3AED", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 2, background: "#7C3AED", display: "inline-block" } }), "\uCC44\uD305"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 2, background: "#F59E0B", display: "inline-block" } }), "\uACB0\uC81C")), /* @__PURE__ */ React.createElement(MiniBarChart, { data: daily, keys: ["chats", "charges"], colors: ["#7C3AED", "#F59E0B"], height: 72 }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#C0C0C0" } }, ((_A = (_z = daily[0]) == null ? void 0 : _z.date) == null ? void 0 : _A.slice(5)) || ""), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#C0C0C0" } }, ((_C = (_B = daily[daily.length - 1]) == null ? void 0 : _B.date) == null ? void 0 : _C.slice(5)) || "")))), testBreakdown.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#5A5A5A", marginBottom: 14 } }, "\u{1F9E0} \uAC80\uC0AC \uC720\uD615\uBCC4 \uC218\uD589 \uD604\uD669"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, testBreakdown.sort((a, b) => (b.count || 0) - (a.count || 0)).map((t, i) => {
    const pct = Math.round((t.count || 0) / totalTests * 100);
    const clrs = ["#3B82F6", "#10B981", "#7C3AED", "#F59E0B", "#EF4444", "#EC4899"];
    return /* @__PURE__ */ React.createElement("div", { key: t.test_type || i }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "#1A1A1A" } }, t.test_type || "\uAE30\uD0C0"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#9A9A9A" } }, (t.count || 0).toLocaleString(), "\uD68C (", pct, "%)")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0F0EC", borderRadius: 100, height: 6, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${pct}%`, height: "100%", borderRadius: 100, background: clrs[i % clrs.length], transition: "width .3s" } })));
  }))));
}
function AdminUsers() {
  const { useState: useS, useEffect: useE } = React;
  const [users, setUsers] = useS([]);
  const [page, setPage] = useS(1);
  const [search, setSearch] = useS("");
  const [searchInput, setSearchInput] = useS("");
  const [total, setTotal] = useS(0);
  const [loading, setLoading] = useS(true);
  const [grantModal, setGrantModal] = useS(null);
  const [grantAmt, setGrantAmt] = useS("");
  const [grantReason, setGrantReason] = useS("");
  const [granting, setGranting] = useS(false);
  const [deleteModal, setDeleteModal] = useS(null);
  const [deleting, setDeleting] = useS(false);
  const load = (p, s) => {
    setLoading(true);
    aApi.users(p, s).then((r) => {
      if (r.success) {
        setUsers(r.data.users || []);
        setTotal(r.data.total || 0);
      }
    }).finally(() => setLoading(false));
  };
  useE(() => load(1, ""), []);
  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
    load(1, searchInput);
  };
  const handlePage = (p) => {
    setPage(p);
    load(p, search);
  };
  const handleDelete = async () => {
    setDeleting(true);
    const r = await aApi.deleteUser(deleteModal.id);
    setDeleting(false);
    if (r.success) {
      setDeleteModal(null);
      load(page, search);
    } else alert(r.error || "\uC0AD\uC81C \uC2E4\uD328");
  };
  const handleGrant = async () => {
    if (!grantAmt || isNaN(grantAmt)) return;
    setGranting(true);
    const r = await aApi.grantCredits(grantModal.id, parseInt(grantAmt), grantReason);
    setGranting(false);
    if (r.success) {
      setGrantModal(null);
      setGrantAmt("");
      setGrantReason("");
      load(page, search);
    } else alert(r.error || "\uC624\uB958");
  };
  const totalPages = Math.ceil(total / 20) || 1;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC0AC\uC6A9\uC790 \uAD00\uB9AC (\uCD1D ", total.toLocaleString(), "\uBA85)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: searchInput,
      onChange: (e) => setSearchInput(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && handleSearch(),
      placeholder: "\uC774\uBA54\uC77C \uAC80\uC0C9",
      style: { padding: "7px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", width: 200 }
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: handleSearch, style: { padding: "7px 14px", borderRadius: 8, border: "none", background: "#2D6A4F", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uAC80\uC0C9"))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["#", "\uC774\uBA54\uC77C", "\uB2C9\uB124\uC784", "\uD06C\uB808\uB527", "\uAC00\uC785\uC77C", "\uAC80\uC99D", "\uD06C\uB808\uB527 \uC9C0\uAE09", "\uC0AD\uC81C"],
      rows: users,
      renderRow: (u, i) => /* @__PURE__ */ React.createElement("tr", { key: u.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", color: "#9A9A9A", fontSize: 12 } }, (page - 1) * 20 + i + 1), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 500 } }, u.email), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", color: "#5A5A5A" } }, u.nickname || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 600, color: "#2D6A4F" } }, (u.credits || 0).toLocaleString(), "cr"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", color: "#9A9A9A", fontSize: 12, whiteSpace: "nowrap" } }, fmtDate(u.created_at)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Chip, { label: u.email_verified ? "\uC778\uC99D" : "\uBBF8\uC778\uC99D", color: u.email_verified ? "green" : "amber" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setGrantModal({ id: u.id, email: u.email, credits: u.credits }),
          style: { padding: "5px 12px", borderRadius: 7, border: "1px solid #2D6A4F33", background: "white", color: "#2D6A4F", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
        },
        "+ \uC9C0\uAE09"
      )), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setDeleteModal({ id: u.id, email: u.email }),
          style: { padding: "5px 10px", borderRadius: 7, border: "1px solid #CC000033", background: "white", color: "#CC0000", fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" },
          title: "\uD68C\uC6D0 \uC0AD\uC81C"
        },
        "\u{1F5D1}\uFE0F"
      )))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginTop: 20 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handlePage(Math.max(1, page - 1)),
      disabled: page === 1,
      style: { padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(0,0,0,.12)", background: page === 1 ? "#F5F5F0" : "white", color: page === 1 ? "#C0C0C0" : "#1A1A1A", cursor: page === 1 ? "default" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif" }
    },
    "\u2190 \uC774\uC804"
  ), /* @__PURE__ */ React.createElement("span", { style: { padding: "6px 12px", fontSize: 12, color: "#5A5A5A" } }, page, " / ", totalPages), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handlePage(Math.min(totalPages, page + 1)),
      disabled: page === totalPages,
      style: { padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(0,0,0,.12)", background: page === totalPages ? "#F5F5F0" : "white", color: page === totalPages ? "#C0C0C0" : "#1A1A1A", cursor: page === totalPages ? "default" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif" }
    },
    "\uB2E4\uC74C \u2192"
  ))), deleteModal && /* @__PURE__ */ React.createElement(Modal, { title: "\uD68C\uC6D0 \uC0AD\uC81C \uD655\uC778", onClose: () => setDeleteModal(null) }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5A5A5A", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#CC0000" } }, deleteModal.email), " \uACC4\uC815\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#9A9A9A" } }, "\uC0AD\uC81C \uD6C4 \uC774\uBA54\uC77C \uC815\uBCF4\uB294 \uC775\uBA85 \uCC98\uB9AC\uB429\uB2C8\uB2E4. \uAC80\uC0AC \uC774\uB825\uC740 \uD1B5\uACC4 \uC6A9\uB3C4\uB85C \uC720\uC9C0\uB429\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("button", { onClick: handleDelete, disabled: deleting, style: {
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "#CC0000",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    cursor: deleting ? "not-allowed" : "pointer",
    fontFamily: "'Noto Sans KR',sans-serif",
    opacity: deleting ? 0.6 : 1
  } }, deleting ? "\uC0AD\uC81C \uC911..." : "\uC0AD\uC81C \uD655\uC778"))), grantModal && /* @__PURE__ */ React.createElement(Modal, { title: `\uD06C\uB808\uB527 \uC9C0\uAE09 \u2014 ${grantModal.email}`, onClose: () => setGrantModal(null) }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5A5A5A" } }, "\uD604\uC7AC \uD06C\uB808\uB527: ", /* @__PURE__ */ React.createElement("strong", null, (grantModal.credits || 0).toLocaleString(), "cr")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#9A9A9A", display: "block", marginBottom: 4 } }, "\uC9C0\uAE09 \uD06C\uB808\uB527 (\uC74C\uC218 \uC785\uB825 \uC2DC \uCC28\uAC10)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: grantAmt,
      onChange: (e) => setGrantAmt(e.target.value),
      placeholder: "\uC608: 10 (\uC9C0\uAE09) \uB610\uB294 -5 (\uCC28\uAC10)",
      style: { width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#9A9A9A", display: "block", marginBottom: 4 } }, "\uC0AC\uC720 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: grantReason,
      onChange: (e) => setGrantReason(e.target.value),
      placeholder: "\uAD00\uB9AC\uC790 \uC9C0\uAE09",
      style: { width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("button", { onClick: handleGrant, disabled: granting, style: {
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "#2D6A4F",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    cursor: granting ? "not-allowed" : "pointer",
    fontFamily: "'Noto Sans KR',sans-serif"
  } }, granting ? "\uCC98\uB9AC \uC911..." : "\uD06C\uB808\uB527 \uC9C0\uAE09"))));
}
function AdminOnboarding() {
  const { useState: useS, useEffect: useE } = React;
  const [list, setList] = useS([]);
  const [loading, setLoading] = useS(true);
  const [processing, setProcessing] = useS(null);
  const [note, setNote] = useS("");
  const load = () => {
    setLoading(true);
    aApi.onboarding().then((r) => {
      if (r.success) setList(r.data);
    }).finally(() => setLoading(false));
  };
  useE(() => load(), []);
  const handle = async (id, status) => {
    const reason = status === "rejected" ? prompt("\uBC18\uB824 \uC0AC\uC720\uB97C \uC785\uB825\uD558\uC138\uC694:") : "";
    if (status === "rejected" && !reason) return;
    setProcessing(id);
    const r = await aApi.reviewOnboarding(id, status, reason || note);
    setProcessing(null);
    if (r.success) {
      alert(status === "approved" ? "\uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4! \uC13C\uD130\uAC00 \uC790\uB3D9 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      load();
    } else alert(r.error || "\uC624\uB958");
  };
  const statusColor = { pending: "amber", reviewing: "blue", approved: "green", rejected: "red" };
  const statusLabel = { pending: "\uAC80\uD1A0 \uB300\uAE30", reviewing: "\uAC80\uD1A0 \uC911", approved: "\uC2B9\uC778\uB428", rejected: "\uBC18\uB824\uB428" };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC13C\uD130 \uC628\uBCF4\uB529 \uC2E0\uCCAD (", list.length, "\uAC74)"), /* @__PURE__ */ React.createElement("button", { onClick: load, style: { background: "none", border: "1px solid rgba(0,0,0,.12)", borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC0C8\uB85C\uACE0\uCE68")), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, list.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#9A9A9A" } }, "\uC2E0\uCCAD \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"), list.map((req) => /* @__PURE__ */ React.createElement("div", { key: req.id, style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700 } }, req.center_name), /* @__PURE__ */ React.createElement(Chip, { label: statusLabel[req.status] || req.status, color: statusColor[req.status] || "gray" })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A" } }, "\uC2E0\uCCAD\uC77C: ", fmtDt(req.created_at))), req.status === "pending" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => handle(req.id, "reviewing"), disabled: processing === req.id, style: { padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(0,0,0,.12)", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uAC80\uD1A0 \uC2DC\uC791"), /* @__PURE__ */ React.createElement("button", { onClick: () => handle(req.id, "approved"), disabled: processing === req.id, style: { padding: "7px 14px", borderRadius: 7, border: "none", background: "#2D6A4F", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2713 \uC2B9\uC778"), /* @__PURE__ */ React.createElement("button", { onClick: () => handle(req.id, "rejected"), disabled: processing === req.id, style: { padding: "7px 14px", borderRadius: 7, border: "none", background: "#E24B4A", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2715 \uBC18\uB824")), req.status === "reviewing" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => handle(req.id, "approved"), disabled: processing === req.id, style: { padding: "7px 14px", borderRadius: 7, border: "none", background: "#2D6A4F", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2713 \uC2B9\uC778"), /* @__PURE__ */ React.createElement("button", { onClick: () => handle(req.id, "rejected"), disabled: processing === req.id, style: { padding: "7px 14px", borderRadius: 7, border: "none", background: "#E24B4A", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2715 \uBC18\uB824"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 13 } }, [["\uB2F4\uB2F9\uC790", req.contact_name], ["\uC774\uBA54\uC77C", req.contact_email], ["\uC804\uD654", req.contact_phone || "-"], ["\uC8FC\uC18C", req.address || "-"], ["\uC0C1\uB2F4\uC0AC \uC218", `${req.counselor_count || 1}\uBA85`], ["\uC0AC\uC5C5\uC790\uBC88\uD638", req.business_reg_num || "-"]].map(([l, v]) => /* @__PURE__ */ React.createElement("div", { key: l, style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A", minWidth: 60 } }, l), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, v)))), req.description && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "10px 12px", background: "#F9F9F7", borderRadius: 8, fontSize: 13, color: "#5A5A5A", lineHeight: 1.6 } }, req.description), req.admin_note && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "8px 12px", background: "#FEF3C7", borderRadius: 8, fontSize: 12, color: "#B45309" } }, "\uC5B4\uB4DC\uBBFC \uBA54\uBAA8: ", req.admin_note)))));
}
function Modal({ title, onClose, children, width = 560 }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid rgba(0,0,0,.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700 } }, title), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9A9A9A", lineHeight: 1 } }, "\xD7")), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 22px" } }, children)));
}
function Field({ label, required, children }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 } }, label, required && /* @__PURE__ */ React.createElement("span", { style: { color: "#E24B4A", marginLeft: 2 } }, "*")), children);
}
const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid rgba(0,0,0,.15)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", boxSizing: "border-box" };
const btn = (bg, color = "white") => ({ padding: "9px 18px", border: "none", borderRadius: 8, background: bg, color, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" });
function AdminCenters() {
  const { useState: useS, useEffect: useE } = React;
  const [list, setList] = useS([]);
  const [loading, setLoading] = useS(true);
  const [processing, setProcessing] = useS(null);
  const [modal, setModal] = useS(null);
  const [form, setForm] = useS({});
  const [saving, setSaving] = useS(false);
  const [err, setErr] = useS("");
  const load = () => {
    setLoading(true);
    aApi.centers().then((r) => {
      if (r.success) setList(r.data);
    }).finally(() => setLoading(false));
  };
  useE(() => load(), []);
  const openCreate = () => {
    setForm({ logo_emoji: "\u{1F3E5}", name: "", description: "", address: "", specialty_tags: "", contact_email: "", contact_phone: "", commission_rate: 10, status: "active" });
    setErr("");
    setModal("create");
  };
  const openEdit = (c) => {
    setForm({ ...c, specialty_tags: Array.isArray(c.specialty_tags) ? c.specialty_tags.join(", ") : typeof c.specialty_tags === "string" ? JSON.parse(c.specialty_tags || "[]").join(", ") : "" });
    setErr("");
    setModal({ edit: c });
  };
  const save = async () => {
    var _a;
    if (!((_a = form.name) == null ? void 0 : _a.trim())) {
      setErr("\uC13C\uD130\uBA85\uC740 \uD544\uC218\uC785\uB2C8\uB2E4");
      return;
    }
    setSaving(true);
    setErr("");
    const payload = {
      ...form,
      specialty_tags: JSON.stringify((form.specialty_tags || "").split(",").map((s) => s.trim()).filter(Boolean)),
      commission_rate: Number(form.commission_rate) || 10
    };
    const r = modal === "create" ? await aApi.createCenter(payload) : await aApi.updateCenter(modal.edit.id, payload);
    setSaving(false);
    if (r.success) {
      setModal(null);
      load();
    } else setErr(r.error || "\uC800\uC7A5 \uC2E4\uD328");
  };
  const deleteCenter = async (c) => {
    if (!confirm(`"${c.name}" \uC13C\uD130\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?
\uC18C\uC18D \uC0C1\uB2F4\uC0AC\uAC00 \uC5C6\uC5B4\uC57C \uC0AD\uC81C \uAC00\uB2A5\uD569\uB2C8\uB2E4.`)) return;
    setProcessing(c.id);
    const r = await aApi.deleteCenter(c.id);
    setProcessing(null);
    if (r.success) load();
    else alert(r.error || "\uC0AD\uC81C \uC2E4\uD328");
  };
  const changeStatus = async (id, status) => {
    const reason = status === "suspended" ? prompt("\uC815\uC9C0 \uC0AC\uC720:") : "";
    setProcessing(id);
    const r = await aApi.centerStatus(id, status, reason);
    setProcessing(null);
    if (r.success) load();
    else alert(r.error || "\uC624\uB958");
  };
  const statusColor = { active: "green", pending: "amber", suspended: "red" };
  const statusLabel = { active: "\uD65C\uC131", pending: "\uC2EC\uC0AC\uC911", suspended: "\uC815\uC9C0" };
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: typeof v === "object" ? v.target.value : v }));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC0C1\uB2F4\uC13C\uD130 (", list.length, "\uACF3)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: load, style: { ...btn("none", "#374151"), border: "1px solid rgba(0,0,0,.12)" } }, "\uC0C8\uB85C\uACE0\uCE68"), /* @__PURE__ */ React.createElement("button", { onClick: openCreate, style: btn("#2D6A4F") }, "+ \uC13C\uD130 \uB4F1\uB85D"))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["\uC13C\uD130", "\uC0C1\uD0DC", "\uC0C1\uB2F4\uC0AC", "\uC608\uC57D", "\uC218\uC218\uB8CC", "\uB4F1\uB85D\uC77C", "\uAD00\uB9AC"],
      rows: list,
      renderRow: (c, i) => /* @__PURE__ */ React.createElement("tr", { key: c.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)", background: i % 2 === 0 ? "white" : "#FAFAF8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, c.logo_emoji, " ", c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A" } }, c.address || "-"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#B0B0B0" } }, c.contact_email || "")), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Chip, { label: statusLabel[c.status] || c.status, color: statusColor[c.status] || "gray" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "center" } }, c.counselor_count || 0, "\uBA85"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "center" } }, c.appt_count || 0, "\uAC74"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "center" } }, c.commission_rate || 10, "%"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 11, color: "#9A9A9A" } }, fmtDate(c.created_at)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => openEdit(c), style: { ...btn("#EEF2FF", "#5B21B6"), padding: "4px 9px", fontSize: 11 } }, "\uC218\uC815"), c.status !== "active" && /* @__PURE__ */ React.createElement("button", { onClick: () => changeStatus(c.id, "active"), disabled: processing === c.id, style: { ...btn("#D8F3DC", "#2D6A4F"), padding: "4px 9px", fontSize: 11 } }, "\uD65C\uC131\uD654"), c.status === "active" && /* @__PURE__ */ React.createElement("button", { onClick: () => changeStatus(c.id, "suspended"), disabled: processing === c.id, style: { ...btn("#FEF2F2", "#991B1B"), padding: "4px 9px", fontSize: 11 } }, "\uC815\uC9C0"), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteCenter(c), disabled: processing === c.id, style: { ...btn("#FEF2F2", "#991B1B"), padding: "4px 9px", fontSize: 11 } }, "\uC0AD\uC81C"))))
    }
  ), modal && /* @__PURE__ */ React.createElement(Modal, { title: modal === "create" ? "\uC0C1\uB2F4\uC13C\uD130 \uB4F1\uB85D" : "\uC0C1\uB2F4\uC13C\uD130 \uC218\uC815", onClose: () => setModal(null) }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC13C\uD130\uBA85", required: true }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.name || "", onChange: f("name"), placeholder: "\uC608) \uB9C8\uC74C\uD480 \uC0C1\uB2F4\uC13C\uD130" })), /* @__PURE__ */ React.createElement(Field, { label: "\uB85C\uACE0 \uC774\uBAA8\uC9C0" }, /* @__PURE__ */ React.createElement("input", { style: { ...inp, width: 80 }, value: form.logo_emoji || "", onChange: f("logo_emoji"), placeholder: "\u{1F3E5}" }))), /* @__PURE__ */ React.createElement(Field, { label: "\uC8FC\uC18C" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.address || "", onChange: f("address"), placeholder: "\uC11C\uC6B8\uC2DC \uAC15\uB0A8\uAD6C ..." })), /* @__PURE__ */ React.createElement(Field, { label: "\uC18C\uAC1C" }, /* @__PURE__ */ React.createElement("textarea", { style: { ...inp, resize: "vertical", height: 70 }, value: form.description || "", onChange: f("description"), placeholder: "\uC13C\uD130 \uC18C\uAC1C \uBB38\uAD6C" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC5F0\uB77D\uCC98 \uC774\uBA54\uC77C" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.contact_email || "", onChange: f("contact_email"), placeholder: "center@example.com" })), /* @__PURE__ */ React.createElement(Field, { label: "\uC5F0\uB77D\uCC98 \uC804\uD654" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.contact_phone || "", onChange: f("contact_phone"), placeholder: "02-1234-5678" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC804\uBB38 \uBD84\uC57C (\uC27C\uD45C \uAD6C\uBD84)" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.specialty_tags || "", onChange: f("specialty_tags"), placeholder: "\uC6B0\uC6B8, \uBD88\uC548, \uAC00\uC871\uC0C1\uB2F4" })), /* @__PURE__ */ React.createElement(Field, { label: "\uC218\uC218\uB8CC\uC728 (%)" }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "number", value: form.commission_rate || 10, onChange: f("commission_rate"), min: 0, max: 100 }))), /* @__PURE__ */ React.createElement(Field, { label: "\uC0C1\uD0DC" }, /* @__PURE__ */ React.createElement("select", { style: inp, value: form.status || "active", onChange: f("status") }, /* @__PURE__ */ React.createElement("option", { value: "active" }, "\uD65C\uC131"), /* @__PURE__ */ React.createElement("option", { value: "pending" }, "\uC2EC\uC0AC\uC911"), /* @__PURE__ */ React.createElement("option", { value: "suspended" }, "\uC815\uC9C0"))), err && /* @__PURE__ */ React.createElement("div", { style: { color: "#E24B4A", fontSize: 12, marginBottom: 10 } }, err), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setModal(null), style: btn("#F5F5F0", "#374151") }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement("button", { onClick: save, disabled: saving, style: btn("#2D6A4F") }, saving ? "\uC800\uC7A5 \uC911..." : "\uC800\uC7A5"))));
}
function AdminCounselors() {
  const { useState: useS, useEffect: useE } = React;
  const [list, setList] = useS([]);
  const [centers, setCenters] = useS([]);
  const [loading, setLoading] = useS(true);
  const [processing, setProcessing] = useS(null);
  const [modal, setModal] = useS(null);
  const [schedModal, setSchedModal] = useS(null);
  const [form, setForm] = useS({});
  const [schedules, setSchedules] = useS([]);
  const [saving, setSaving] = useS(false);
  const [err, setErr] = useS("");
  const load = () => {
    setLoading(true);
    Promise.all([aApi.counselors(), aApi.centers()]).then(([r, cr]) => {
      if (r.success) setList(r.data);
      if (cr.success) setCenters(cr.data);
    }).finally(() => setLoading(false));
  };
  useE(() => load(), []);
  const DAYS = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
  const openCreate = () => {
    setForm({
      photo_emoji: "\u{1F464}",
      name: "",
      title: "",
      bio: "",
      center_id: "",
      contact_email: "",
      specialties: "",
      available_types: "visit",
      fee_per_session: 5e4,
      session_minutes: 50,
      status: "active"
    });
    setErr("");
    setModal("create");
  };
  const openEdit = (co) => {
    setForm({
      ...co,
      specialties: Array.isArray(co.specialties) ? co.specialties.join(", ") : typeof co.specialties === "string" ? JSON.parse(co.specialties || "[]").join(", ") : "",
      available_types: Array.isArray(co.available_types) ? co.available_types.join(",") : typeof co.available_types === "string" ? JSON.parse(co.available_types || '["visit"]').join(",") : "visit"
    });
    setErr("");
    setModal({ edit: co });
  };
  const openSchedule = async (co) => {
    setSchedModal(co.id);
    const r = await aApi.getSchedules(co.id);
    if (r.success) {
      const sched = Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: "09:00", end_time: "18:00", slot_minutes: 50, enabled: false }));
      (r.data || []).forEach((d) => {
        sched[d.day_of_week] = { ...sched[d.day_of_week], ...d, enabled: true };
      });
      setSchedules(sched);
    }
  };
  const save = async () => {
    var _a;
    if (!((_a = form.name) == null ? void 0 : _a.trim()) || !form.center_id) {
      setErr("\uC774\uB984\uACFC \uC18C\uC18D \uC13C\uD130\uB294 \uD544\uC218\uC785\uB2C8\uB2E4");
      return;
    }
    setSaving(true);
    setErr("");
    const payload = {
      ...form,
      center_id: Number(form.center_id),
      fee_per_session: Number(form.fee_per_session) || 5e4,
      session_minutes: Number(form.session_minutes) || 50,
      specialties: JSON.stringify((form.specialties || "").split(",").map((s) => s.trim()).filter(Boolean)),
      available_types: JSON.stringify((form.available_types || "visit").split(",").map((s) => s.trim()).filter(Boolean))
    };
    const r = modal === "create" ? await aApi.createCounselor(payload) : await aApi.updateCounselor(modal.edit.id, payload);
    setSaving(false);
    if (r.success) {
      setModal(null);
      load();
    } else setErr(r.error || "\uC800\uC7A5 \uC2E4\uD328");
  };
  const saveSchedule = async () => {
    const enabled = schedules.filter((s) => s.enabled);
    setSaving(true);
    const r = await aApi.saveSchedules(schedModal, enabled);
    setSaving(false);
    if (r.success) {
      setSchedModal(null);
    } else alert(r.error || "\uC2A4\uCF00\uC904 \uC800\uC7A5 \uC2E4\uD328");
  };
  const deleteCounselor = async (co) => {
    if (!confirm(`"${co.name}" \uC0C1\uB2F4\uC0AC\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?
\uC9C4\uD589 \uC911\uC778 \uC608\uC57D\uC774 \uC5C6\uC5B4\uC57C \uC0AD\uC81C \uAC00\uB2A5\uD569\uB2C8\uB2E4.`)) return;
    setProcessing(co.id);
    const r = await aApi.deleteCounselor(co.id);
    setProcessing(null);
    if (r.success) load();
    else alert(r.error || "\uC0AD\uC81C \uC2E4\uD328");
  };
  const toggleStatus = async (co) => {
    const r = await aApi.updateCounselor(co.id, { status: co.status === "active" ? "inactive" : "active" });
    if (r.success) load();
    else alert(r.error || "\uC624\uB958");
  };
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: typeof v === "object" ? v.target.value : v }));
  const fs = (i, k) => (v) => setSchedules((prev) => {
    const n = [...prev];
    n[i] = { ...n[i], [k]: typeof v === "object" ? v.target.value : v };
    return n;
  });
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC0C1\uB2F4\uC0AC (", list.length, "\uBA85)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: load, style: { ...btn("none", "#374151"), border: "1px solid rgba(0,0,0,.12)" } }, "\uC0C8\uB85C\uACE0\uCE68"), /* @__PURE__ */ React.createElement("button", { onClick: openCreate, style: btn("#5B21B6") }, "+ \uC0C1\uB2F4\uC0AC \uB4F1\uB85D"))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["\uC0C1\uB2F4\uC0AC", "\uC13C\uD130", "\uC694\uAE08/\uC2DC\uAC04", "\uB204\uC801 \uC0C1\uB2F4", "\uC0C1\uD0DC", "\uAD00\uB9AC"],
      rows: list,
      renderRow: (co, i) => /* @__PURE__ */ React.createElement("tr", { key: co.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)", background: i % 2 === 0 ? "white" : "#FAFAF8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, co.photo_emoji, " ", co.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A" } }, co.title), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#F59E0B" } }, "\u2605"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600 } }, parseFloat(co.avg_rating || 0).toFixed(1)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#9A9A9A" } }, "(", co.review_count || 0, ")"))), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", null, co.center_name), /* @__PURE__ */ React.createElement(Chip, { label: co.center_status === "active" ? "\uD65C\uC131" : "\uBE44\uD65C\uC131", color: co.center_status === "active" ? "green" : "gray" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, (co.fee_per_session || 0).toLocaleString("ko-KR"), "\uC6D0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A" } }, co.session_minutes, "\uBD84")), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "center" } }, co.total_appts || 0, "\uAC74"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Chip, { label: co.status === "active" ? "\uD65C\uC131" : "\uBE44\uD65C\uC131", color: co.status === "active" ? "green" : "red" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => openEdit(co), style: { ...btn("#EEF2FF", "#5B21B6"), padding: "4px 9px", fontSize: 11 } }, "\uC218\uC815"), /* @__PURE__ */ React.createElement("button", { onClick: () => openSchedule(co), style: { ...btn("#F0FDF4", "#2D6A4F"), padding: "4px 9px", fontSize: 11 } }, "\uC2A4\uCF00\uC904"), /* @__PURE__ */ React.createElement("button", { onClick: () => toggleStatus(co), style: { ...btn(co.status === "active" ? "#FEF2F2" : "#D8F3DC", co.status === "active" ? "#991B1B" : "#2D6A4F"), padding: "4px 9px", fontSize: 11 } }, co.status === "active" ? "\uBE44\uD65C\uC131" : "\uD65C\uC131\uD654"), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteCounselor(co), disabled: processing === co.id, style: { ...btn("#FEF2F2", "#991B1B"), padding: "4px 9px", fontSize: 11 } }, "\uC0AD\uC81C"))))
    }
  ), modal && /* @__PURE__ */ React.createElement(Modal, { title: modal === "create" ? "\uC0C1\uB2F4\uC0AC \uB4F1\uB85D" : "\uC0C1\uB2F4\uC0AC \uC815\uBCF4 \uC218\uC815", onClose: () => setModal(null), width: 600 }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "80px 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC774\uBAA8\uC9C0" }, /* @__PURE__ */ React.createElement("input", { style: { ...inp, width: 72 }, value: form.photo_emoji || "", onChange: f("photo_emoji"), placeholder: "\u{1F464}" })), /* @__PURE__ */ React.createElement(Field, { label: "\uC774\uB984", required: true }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.name || "", onChange: f("name"), placeholder: "\uD64D\uAE38\uB3D9" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC18C\uC18D \uC13C\uD130", required: true }, /* @__PURE__ */ React.createElement("select", { style: inp, value: form.center_id || "", onChange: f("center_id") }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\uC13C\uD130 \uC120\uD0DD"), centers.filter((c) => c.status === "active").map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.logo_emoji, " ", c.name)))), /* @__PURE__ */ React.createElement(Field, { label: "\uC9C1\uD568/\uC790\uACA9" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.title || "", onChange: f("title"), placeholder: "\uC784\uC0C1\uC2EC\uB9AC\uC0AC 1\uAE09" }))), /* @__PURE__ */ React.createElement(Field, { label: "\uC18C\uAC1C" }, /* @__PURE__ */ React.createElement("textarea", { style: { ...inp, resize: "vertical", height: 75 }, value: form.bio || "", onChange: f("bio"), placeholder: "\uC0C1\uB2F4\uC0AC \uC18C\uAC1C \uBB38\uAD6C" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uC804\uBB38 \uBD84\uC57C (\uC27C\uD45C \uAD6C\uBD84)" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.specialties || "", onChange: f("specialties"), placeholder: "\uC6B0\uC6B8, \uBD88\uC548, \uAC00\uC871" })), /* @__PURE__ */ React.createElement(Field, { label: "\uC0C1\uB2F4 \uBC29\uC2DD" }, /* @__PURE__ */ React.createElement("select", { style: inp, value: form.available_types || "visit", onChange: f("available_types") }, /* @__PURE__ */ React.createElement("option", { value: "visit" }, "\uBC29\uBB38"), /* @__PURE__ */ React.createElement("option", { value: "video" }, "\uD654\uC0C1"), /* @__PURE__ */ React.createElement("option", { value: "phone" }, "\uC804\uD654"), /* @__PURE__ */ React.createElement("option", { value: "visit,video" }, "\uBC29\uBB38+\uD654\uC0C1"), /* @__PURE__ */ React.createElement("option", { value: "visit,video,phone" }, "\uBAA8\uB450")))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" } }, /* @__PURE__ */ React.createElement(Field, { label: "\uD68C\uAE30 \uC694\uAE08 (\uC6D0)", required: true }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "number", value: form.fee_per_session || 5e4, onChange: f("fee_per_session"), min: 1e4, step: 5e3 })), /* @__PURE__ */ React.createElement(Field, { label: "\uD68C\uAE30 \uC2DC\uAC04 (\uBD84)" }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "number", value: form.session_minutes || 50, onChange: f("session_minutes"), min: 20, step: 5 })), /* @__PURE__ */ React.createElement(Field, { label: "\uC0C1\uD0DC" }, /* @__PURE__ */ React.createElement("select", { style: inp, value: form.status || "active", onChange: f("status") }, /* @__PURE__ */ React.createElement("option", { value: "active" }, "\uD65C\uC131"), /* @__PURE__ */ React.createElement("option", { value: "inactive" }, "\uBE44\uD65C\uC131")))), /* @__PURE__ */ React.createElement(Field, { label: "\uC5F0\uB77D\uCC98 \uC774\uBA54\uC77C" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.contact_email || "", onChange: f("contact_email"), placeholder: "counselor@example.com" })), err && /* @__PURE__ */ React.createElement("div", { style: { color: "#E24B4A", fontSize: 12, marginBottom: 10 } }, err), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setModal(null), style: btn("#F5F5F0", "#374151") }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement("button", { onClick: save, disabled: saving, style: btn("#5B21B6") }, saving ? "\uC800\uC7A5 \uC911..." : "\uC800\uC7A5"))), schedModal && /* @__PURE__ */ React.createElement(Modal, { title: "\uC6B4\uC601 \uC2A4\uCF00\uC904 \uC124\uC815", onClose: () => setSchedModal(null), width: 480 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 12 } }, "\uC694\uC77C\uBCC4 \uC6B4\uC601 \uC2DC\uAC04\uC744 \uC124\uC815\uD569\uB2C8\uB2E4. \uCCB4\uD06C\uB41C \uC694\uC77C\uB9CC \uC800\uC7A5\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, schedules.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: s.enabled ? "#F0FDF4" : "#FAFAF8", borderRadius: 8, border: `1px solid ${s.enabled ? "#86EFAC" : "rgba(0,0,0,.08)"}` } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: s.enabled, onChange: (e) => fs(i, "enabled")(e.target.checked), style: { width: 16, height: 16, cursor: "pointer" } }), /* @__PURE__ */ React.createElement("span", { style: { width: 22, fontWeight: 700, fontSize: 13, color: s.enabled ? "#2D6A4F" : "#9A9A9A" } }, DAYS[i]), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      value: s.start_time || "09:00",
      onChange: fs(i, "start_time"),
      disabled: !s.enabled,
      style: { ...inp, width: 100, padding: "5px 8px", opacity: s.enabled ? 1 : 0.4 }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A", fontSize: 12 } }, "~"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      value: s.end_time || "18:00",
      onChange: fs(i, "end_time"),
      disabled: !s.enabled,
      style: { ...inp, width: 100, padding: "5px 8px", opacity: s.enabled ? 1 : 0.4 }
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: s.slot_minutes || 50,
      onChange: fs(i, "slot_minutes"),
      disabled: !s.enabled,
      style: { ...inp, width: 80, padding: "5px 8px", opacity: s.enabled ? 1 : 0.4 }
    },
    [30, 40, 50, 60, 90, 120].map((m) => /* @__PURE__ */ React.createElement("option", { key: m, value: m }, m, "\uBD84"))
  )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSchedModal(null), style: btn("#F5F5F0", "#374151") }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement("button", { onClick: saveSchedule, disabled: saving, style: btn("#2D6A4F") }, saving ? "\uC800\uC7A5 \uC911..." : "\uC2A4\uCF00\uC904 \uC800\uC7A5"))));
}
function AdminAppointments() {
  const { useState: useS, useEffect: useE } = React;
  const [list, setList] = useS([]);
  const [loading, setLoading] = useS(true);
  const [filter, setFilter] = useS("");
  const [processing, setProcessing] = useS(null);
  const [noteModal, setNoteModal] = useS(null);
  const [noteSaving, setNoteSaving] = useS(false);
  const load = () => {
    setLoading(true);
    aApi.appointments(filter).then((r) => {
      if (r.success) setList(r.data);
    }).finally(() => setLoading(false));
  };
  useE(() => load(), [filter]);
  const complete = async (id) => {
    if (!confirm("\uC774 \uC608\uC57D\uC744 \uC644\uB8CC \uCC98\uB9AC\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC218\uC785\uC774 \uAE30\uB85D\uB429\uB2C8\uB2E4.")) return;
    setProcessing(id);
    const r = await aApi.completeAppt(id);
    setProcessing(null);
    if (r.success) {
      alert(`\uC644\uB8CC \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uC9C0\uAE09\uC561: ${fmtW(r.data.net_amount)}`);
      load();
    } else alert(r.error || "\uC624\uB958");
  };
  const saveNote = async () => {
    if (!noteModal) return;
    setNoteSaving(true);
    try {
      const r = await fetch(`/api/admin/counseling/appointments/${noteModal.id}/note`, {
        method: "PATCH",
        headers: aApi._h(),
        body: JSON.stringify({ counselor_note: noteModal.note })
      });
      const d = await r.json();
      if (d.success) {
        setNoteModal(null);
        load();
      } else alert(d.error || "\uC800\uC7A5 \uC2E4\uD328");
    } catch {
      alert("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958");
    }
    setNoteSaving(false);
  };
  const statusColor = { pending: "amber", confirmed: "blue", completed: "green", cancelled: "red", no_show: "gray" };
  const statusLabel = { pending: "\uACB0\uC81C\uB300\uAE30", confirmed: "\uD655\uC815", completed: "\uC644\uB8CC", cancelled: "\uCDE8\uC18C", no_show: "\uB178\uC1FC" };
  const typeIcon = { video: "\u{1F4F9}", phone: "\u{1F4DE}", visit: "\u{1F3E2}" };
  const filters = [["", "\uC804\uCCB4"], ["confirmed", "\uD655\uC815"], ["completed", "\uC644\uB8CC"], ["pending", "\uB300\uAE30"], ["cancelled", "\uCDE8\uC18C"]];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC608\uC57D \uAD00\uB9AC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5 } }, filters.map(([v, l]) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setFilter(v), style: { padding: "6px 12px", borderRadius: 7, border: "1px solid", borderColor: filter === v ? "#2D6A4F" : "rgba(0,0,0,.10)", background: filter === v ? "#D8F3DC" : "white", color: filter === v ? "#2D6A4F" : "#5A5A5A", fontSize: 12, fontWeight: filter === v ? 700 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, l)), /* @__PURE__ */ React.createElement("button", { onClick: load, style: { background: "none", border: "1px solid rgba(0,0,0,.12)", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u21BB"))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["\uC608\uC57DID", "\uB0B4\uB2F4\uC790", "\uC0C1\uB2F4\uC0AC", "\uC13C\uD130", "\uC77C\uC2DC", "\uC720\uD615", "\uAE08\uC561", "\uC0C1\uD0DC", "\uC561\uC158"],
      rows: list,
      renderRow: (a, i) => {
        var _a;
        return /* @__PURE__ */ React.createElement("tr", { key: a.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)", background: i % 2 === 0 ? "white" : "#FAFAF8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", fontSize: 11, color: "#9A9A9A" } }, "#", a.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600 } }, a.user_nickname || ((_a = a.user_email) == null ? void 0 : _a.split("@")[0])), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#9A9A9A" } }, a.user_email)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600 } }, a.photo_emoji, " ", a.counselor_name)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", fontSize: 11, color: "#5A5A5A" } }, a.center_name), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", fontSize: 11, whiteSpace: "nowrap" } }, fmtDt(a.scheduled_at)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", fontSize: 12 } }, typeIcon[a.session_type]), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", fontWeight: 600, fontSize: 12, color: "#2D6A4F" } }, fmtW(a.fee_amount)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement(Chip, { label: statusLabel[a.status] || a.status, color: statusColor[a.status] || "gray" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" } }, a.status === "confirmed" && /* @__PURE__ */ React.createElement("button", { onClick: () => complete(a.id), disabled: processing === a.id, style: { padding: "5px 9px", borderRadius: 5, border: "none", background: "#EEF0FF", color: "#5B21B6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC644\uB8CC\uCC98\uB9AC"), a.video_room_id && a.status === "confirmed" && /* @__PURE__ */ React.createElement("button", { onClick: () => window.open(`https://meet.jit.si/${a.video_room_id}`, "_blank"), style: { padding: "5px 9px", borderRadius: 5, border: "none", background: "#D8F3DC", color: "#2D6A4F", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u{1F4F9} \uD654\uC0C1 \uC785\uC7A5"), a.video_room_id && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#9A9A9A" } }, "\uB8F8: ", a.video_room_id.slice(-8)), a.status === "confirmed" && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setNoteModal({ id: a.id, note: a.counselor_note || "" }),
            style: { padding: "5px 9px", borderRadius: 5, border: "1px solid rgba(0,0,0,.1)", background: "white", color: "#5A5A5A", fontSize: 11, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
          },
          "\u{1F4DD} ",
          a.counselor_note ? "\uB178\uD2B8 \uC218\uC815" : "\uB178\uD2B8 \uCD94\uAC00"
        ))));
      }
    }
  ), noteModal && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3e3, padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) setNoteModal(null);
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: "24px", width: "100%", maxWidth: 440, boxShadow: "0 16px 48px rgba(0,0,0,.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 14 } }, "\u{1F4DD} \uC0C1\uB2F4\uC0AC \uB178\uD2B8 \xB7 \uC608\uC57D #", noteModal.id), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: noteModal.note,
      onChange: (e) => setNoteModal((p) => ({ ...p, note: e.target.value })),
      placeholder: "\uC0C1\uB2F4 \uB0B4\uC6A9, \uD2B9\uC774\uC0AC\uD56D, \uB2E4\uC74C \uD68C\uAE30 \uACC4\uD68D \uB4F1\uC744 \uAE30\uB85D\uD558\uC138\uC694.",
      rows: 5,
      style: { width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", resize: "none", lineHeight: 1.65, marginBottom: 14 }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setNoteModal(null), style: { flex: 1, padding: "10px", background: "rgba(0,0,0,.07)", color: "#5A5A5A", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement("button", { onClick: saveNote, disabled: noteSaving, style: { flex: 2, padding: "10px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, noteSaving ? "\uC800\uC7A5 \uC911..." : "\uB178\uD2B8 \uC800\uC7A5")))));
}
function AdminSettlements() {
  const { useState: useS, useEffect: useE } = React;
  const [list, setList] = useS([]);
  const [centers, setCenters] = useS([]);
  const [loading, setLoading] = useS(true);
  const [creating, setCreating] = useS(false);
  const [form, setForm] = useS({ center_id: "", period_start: "", period_end: "" });
  const [processing, setProcessing] = useS(null);
  const load = () => {
    setLoading(true);
    Promise.all([aApi.settlements(), aApi.centers()]).then(([s, c]) => {
      if (s.success) setList(s.data);
      if (c.success) setCenters(c.data.filter((cc) => cc.status === "active"));
    }).finally(() => setLoading(false));
  };
  useE(() => load(), []);
  const create = async () => {
    if (!form.center_id || !form.period_start || !form.period_end) {
      alert("\uBAA8\uB4E0 \uD56D\uBAA9 \uD544\uC694");
      return;
    }
    const r = await aApi.createSettlement(form);
    if (r.success) {
      alert(`\uC815\uC0B0 \uC0DD\uC131 \uC644\uB8CC
\uC608\uC57D ${r.data.appt_count}\uAC74 \xB7 \uC9C0\uAE09\uC561 ${fmtW(r.data.payout_amt)}`);
      setCreating(false);
      setForm({ center_id: "", period_start: "", period_end: "" });
      load();
    } else alert(r.error || "\uC624\uB958");
  };
  const process = async (id) => {
    const note = prompt("\uCC98\uB9AC \uBA54\uBAA8 (\uC120\uD0DD):");
    setProcessing(id);
    const r = await aApi.processSettlement(id, note || "");
    setProcessing(null);
    if (r.success) load();
    else alert(r.error || "\uC624\uB958");
  };
  const statusColor = { pending: "amber", processing: "blue", completed: "green", failed: "red" };
  const statusLabel = { pending: "\uC815\uC0B0 \uB300\uAE30", processing: "\uCC98\uB9AC \uC911", completed: "\uC644\uB8CC", failed: "\uC2E4\uD328" };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uC815\uC0B0 \uAD00\uB9AC"), /* @__PURE__ */ React.createElement("button", { onClick: () => setCreating((v) => !v), style: { background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "+ \uC815\uC0B0 \uC0DD\uC131")), creating && /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "20px", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 14 } }, "\uC0C8 \uC815\uC0B0 \uC0DD\uC131"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 5 } }, "\uC13C\uD130 \uC120\uD0DD"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.center_id,
      onChange: (e) => setForm((f) => ({ ...f, center_id: e.target.value })),
      style: { width: "100%", padding: "9px 10px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 7, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\uC120\uD0DD"),
    centers.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.logo_emoji, " ", c.name))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 5 } }, "\uAE30\uAC04 \uC2DC\uC791"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.period_start, onChange: (e) => setForm((f) => ({ ...f, period_start: e.target.value })), style: { width: "100%", padding: "8px 10px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 7, fontSize: 13, outline: "none" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 5 } }, "\uAE30\uAC04 \uC885\uB8CC"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.period_end, onChange: (e) => setForm((f) => ({ ...f, period_end: e.target.value })), style: { width: "100%", padding: "8px 10px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 7, fontSize: 13, outline: "none" } })), /* @__PURE__ */ React.createElement("button", { onClick: create, style: { padding: "9px 18px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap" } }, "\uC0DD\uC131")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 8 } }, "\uC644\uB8CC \uCC98\uB9AC\uB41C \uC608\uC57D\uB9CC \uC9D1\uACC4\uB429\uB2C8\uB2E4")), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["\uC13C\uD130", "\uC815\uC0B0 \uAE30\uAC04", "\uC608\uC57D\uC218", "\uCD1D\uB9E4\uCD9C", "\uC218\uC218\uB8CC", "\uC9C0\uAE09\uC561", "\uC0C1\uD0DC", "\uC561\uC158"],
      rows: list,
      renderRow: (s, i) => /* @__PURE__ */ React.createElement("tr", { key: s.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)", background: i % 2 === 0 ? "white" : "#FAFAF8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 600 } }, s.logo_emoji, " ", s.center_name), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 12, whiteSpace: "nowrap" } }, fmtDate(s.period_start), " ~ ", fmtDate(s.period_end)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "center" } }, s.appt_count, "\uAC74"), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 600 } }, fmtW(s.total_revenue)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", color: "#E24B4A" } }, fmtW(s.commission_amt)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 700, color: "#2D6A4F" } }, fmtW(s.payout_amt)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Chip, { label: statusLabel[s.status] || s.status, color: statusColor[s.status] || "gray" })), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, s.status === "pending" && /* @__PURE__ */ React.createElement("button", { onClick: () => process(s.id), disabled: processing === s.id, style: { padding: "5px 10px", borderRadius: 5, border: "none", background: "#EEF0FF", color: "#5B21B6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC9C0\uAE09 \uC644\uB8CC"), s.processed_at && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#9A9A9A", marginTop: 2 } }, fmtDt(s.processed_at))))
    }
  ));
}
function AdminReviews() {
  const { useState: useS, useEffect: useE } = React;
  const [reviews, setReviews] = useS([]);
  const [page, setPage] = useS(1);
  const [total, setTotal] = useS(0);
  const [loading, setLoading] = useS(true);
  const [toggling, setToggling] = useS(null);
  const load = (p) => {
    setLoading(true);
    aApi.reviews(p).then((r) => {
      if (r.success) {
        setReviews(r.data || []);
        setTotal(r.total || 0);
      }
    }).finally(() => setLoading(false));
  };
  useE(() => load(1), []);
  const handleToggle = async (id, hidden) => {
    setToggling(id);
    await aApi.toggleReview(id, hidden);
    setToggling(null);
    load(page);
  };
  const Stars = ({ r }) => /* @__PURE__ */ React.createElement("span", { style: { color: "#F59E0B", fontSize: 12 } }, Array.from({ length: 5 }, (_, i) => i < Math.round(r) ? "\u2605" : "\u2606").join(""));
  const totalPages = Math.ceil(total / 20) || 1;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\u2B50 \uB9AC\uBDF0 \uAD00\uB9AC (\uCD1D ", total, "\uAC74)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setPage(1);
    load(1);
  }, style: { padding: "7px 14px", borderRadius: 8, border: "none", background: "#2D6A4F", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC0C8\uB85C\uACE0\uCE68"))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Table,
    {
      cols: ["#", "\uC0C1\uB2F4\uC0AC", "\uC791\uC131\uC790", "\uBCC4\uC810", "\uB0B4\uC6A9", "\uB4F1\uB85D\uC77C", "\uC228\uAE40"],
      rows: reviews,
      renderRow: (r, i) => /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderBottom: "1px solid rgba(0,0,0,.05)", background: r.admin_hidden ? "#FEF2F2" : i % 2 === 0 ? "white" : "#FAFAF8", opacity: r.admin_hidden ? 0.65 : 1 } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", color: "#9A9A9A", fontSize: 12 } }, (page - 1) * 20 + i + 1), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontWeight: 600, fontSize: 13 } }, r.counselor_name), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 13, color: "#5A5A5A" } }, r.reviewer_name), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement(Stars, { r: r.rating }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, marginLeft: 3 } }, r.rating, "\uC810")), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 12, color: "#5A5A5A", maxWidth: 240, wordBreak: "break-word" } }, r.content || /* @__PURE__ */ React.createElement("span", { style: { color: "#C0C0C0" } }, "\uB0B4\uC6A9 \uC5C6\uC74C")), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", fontSize: 11, color: "#9A9A9A", whiteSpace: "nowrap" } }, fmtDate(r.created_at)), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => handleToggle(r.id, !r.admin_hidden),
          disabled: toggling === r.id,
          style: { padding: "5px 10px", borderRadius: 6, border: "none", background: r.admin_hidden ? "#D8F3DC" : "#FEF2F2", color: r.admin_hidden ? "#2D6A4F" : "#991B1B", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
        },
        toggling === r.id ? "..." : r.admin_hidden ? "\uACF5\uAC1C" : "\uC228\uAE40"
      )))
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginTop: 20 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const p = Math.max(1, page - 1);
        setPage(p);
        load(p);
      },
      disabled: page === 1,
      style: { padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(0,0,0,.12)", background: page === 1 ? "#F5F5F0" : "white", color: page === 1 ? "#C0C0C0" : "#1A1A1A", cursor: page === 1 ? "default" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif" }
    },
    "\u2190 \uC774\uC804"
  ), /* @__PURE__ */ React.createElement("span", { style: { padding: "6px 12px", fontSize: 12, color: "#5A5A5A" } }, page, " / ", totalPages), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const p = Math.min(totalPages, page + 1);
        setPage(p);
        load(p);
      },
      disabled: page === totalPages,
      style: { padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(0,0,0,.12)", background: page === totalPages ? "#F5F5F0" : "white", color: page === totalPages ? "#C0C0C0" : "#1A1A1A", cursor: page === totalPages ? "default" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif" }
    },
    "\uB2E4\uC74C \u2192"
  ))));
}
function AdminPartners() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { useState: useS, useEffect: useE } = React;
  const [partners, setPartners] = useS([]);
  const [loading, setLoading] = useS(true);
  const [selected, setSelected] = useS(null);
  const [stats, setStats] = useS(null);
  const [settlement, setSettlement] = useS(null);
  const [statsMonth, setStatsMonth] = useS(() => {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showCreate, setShowCreate] = useS(false);
  const [form, setForm] = useS({ code: "", name: "", sso_secret: "", revenue_share_rate: "0", welcome_message: "", featured_tests: "", primary_color: "#2D6A4F", contact_email: "" });
  const [saving, setSaving] = useS(false);
  const [msg, setMsg] = useS("");
  useE(() => {
    aApi.partners().then((r) => {
      if (r.success) setPartners(r.data || []);
    }).finally(() => setLoading(false));
  }, []);
  const loadStats = async (code) => {
    const [from, to] = [`${statsMonth}-01`, new Date((/* @__PURE__ */ new Date(statsMonth + "-01")).getFullYear(), (/* @__PURE__ */ new Date(statsMonth + "-01")).getMonth() + 1, 0).toISOString().slice(0, 10)];
    const [s, se] = await Promise.all([aApi.partnerStats(code, from, to), aApi.partnerSettlement(code, statsMonth)]);
    if (s.success) setStats(s.data);
    if (se.success) setSettlement(se.data);
  };
  const handleSelect = async (code) => {
    setSelected(code);
    setStats(null);
    setSettlement(null);
    await loadStats(code);
  };
  const handleCreate = async () => {
    setSaving(true);
    setMsg("");
    const body = { ...form, revenue_share_rate: Number(form.revenue_share_rate) };
    const r = await aApi.createPartner(body);
    setSaving(false);
    if (r.success) {
      setMsg("\uD30C\uD2B8\uB108 \uB4F1\uB85D \uC644\uB8CC");
      setShowCreate(false);
      setForm({ code: "", name: "", sso_secret: "", revenue_share_rate: "0", welcome_message: "", featured_tests: "", primary_color: "#2D6A4F", contact_email: "" });
      aApi.partners().then((r2) => {
        if (r2.success) setPartners(r2.data || []);
      });
    } else setMsg(r.error || "\uB4F1\uB85D \uC2E4\uD328");
  };
  const handleToggleActive = async (code, current) => {
    await aApi.updatePartner(code, { is_active: current ? 0 : 1 });
    aApi.partners().then((r) => {
      if (r.success) setPartners(r.data || []);
    });
  };
  if (loading) return React.createElement("div", { style: { padding: 32, textAlign: "center", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...");
  const selPartner = partners.find((p) => p.code === selected);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\u{1F91D} \uD30C\uD2B8\uB108 \uCC44\uB110 \uAD00\uB9AC (", partners.length, "\uAC1C)"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowCreate((s) => !s), style: { padding: "8px 16px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 } }, showCreate ? "\u2715 \uB2EB\uAE30" : "+ \uD30C\uD2B8\uB108 \uB4F1\uB85D")), msg && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 16px", borderRadius: 8, marginBottom: 12, background: msg.includes("\uC644\uB8CC") ? "#D8F3DC" : "#FEF2F2", color: msg.includes("\uC644\uB8CC") ? "#1A6B3C" : "#991B1B", fontSize: 13 } }, msg), showCreate && /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 20, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 12, fontSize: 14 } }, "\uC2E0\uADDC \uD30C\uD2B8\uB108 \uB4F1\uB85D"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, [["code", "\uD30C\uD2B8\uB108 \uCF54\uB4DC (\uC601\uBB38\uB300\uBB38\uC790, \uC608: KAKAO_HEALTH)"], ["name", "\uD30C\uD2B8\uB108\uBA85"], ["sso_secret", "SSO \uC2DC\uD06C\uB9BF (\uC5C6\uC73C\uBA74 SSO \uBBF8\uC9C0\uC6D0)"], ["revenue_share_rate", "\uC218\uC775\uC250\uC5B4\uC728 (0~1, \uC608: 0.3)"], ["welcome_message", "\uD658\uC601 \uBA54\uC2DC\uC9C0"], ["featured_tests", "\uCD94\uCC9C \uAC80\uC0AC (\uC27C\uD45C\uAD6C\uBD84, \uC608: PHQ9,BURNOUT)"], ["primary_color", "\uBE0C\uB79C\uB4DC \uC0C9\uC0C1"], ["contact_email", "\uC815\uC0B0 \uB2F4\uB2F9\uC790 \uC774\uBA54\uC77C"]].map(([k, label]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { gridColumn: ["welcome_message", "featured_tests", "sso_secret"].includes(k) ? "1 / -1" : "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#666", marginBottom: 4 } }, label), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form[k],
      onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
      style: { width: "100%", padding: "8px 10px", border: "1px solid #E0E0E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }
    }
  )))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreate,
      disabled: saving || !form.code || !form.name,
      style: { padding: "9px 20px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", opacity: saving || !form.code || !form.name ? 0.5 : 1 }
    },
    saving ? "\uB4F1\uB85D \uC911..." : "\uB4F1\uB85D\uD558\uAE30"
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, partners.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: 24, textAlign: "center", color: "#9A9A9A", background: "white", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" } }, "\uB4F1\uB85D\uB41C \uD30C\uD2B8\uB108\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"), partners.map((p) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: p.code,
      onClick: () => handleSelect(p.code),
      style: { background: "white", border: `2px solid ${selected === p.code ? "#2D6A4F" : "rgba(0,0,0,.08)"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "border-color .15s" }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, p.name), /* @__PURE__ */ React.createElement(Chip, { label: p.is_active ? "\uD65C\uC131" : "\uBE44\uD65C\uC131", color: p.is_active ? "green" : "gray" })),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#888", marginBottom: 4 } }, "\uCF54\uB4DC: ", p.code),
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uC720\uC785 "), (p.total_users || 0).toLocaleString(), "\uBA85"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uACB0\uC81C "), (p.total_charges || 0).toLocaleString(), "\uAC74"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uB9E4\uCD9C "), fmtW(p.total_revenue))),
    /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          handleToggleActive(p.code, p.is_active);
        },
        style: { fontSize: 11, padding: "3px 10px", border: "1px solid #E0E0E0", borderRadius: 6, background: "white", cursor: "pointer", color: "#5A5A5A" }
      },
      p.is_active ? "\uBE44\uD65C\uC131\uD654" : "\uD65C\uC131\uD654"
    ))
  ))), selected && selPartner ? /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 4 } }, selPartner.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#888", marginBottom: 16 } }, "\uCF54\uB4DC: ", selected, " \xB7 \uC218\uC775\uC250\uC5B4\uC728: ", ((selPartner.revenue_share_rate || 0) * 100).toFixed(0), "%"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "month",
      value: statsMonth,
      onChange: (e) => setStatsMonth(e.target.value),
      style: { padding: "6px 10px", border: "1px solid #E0E0E0", borderRadius: 6, fontSize: 13 }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => loadStats(selected),
      style: { padding: "7px 14px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }
    },
    "\uC870\uD68C"
  )), stats && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 } }, [
    { label: "\uAE30\uAC04 \uC2E0\uADDC\uC720\uC785", value: `${(((_a = stats.users) == null ? void 0 : _a.period) || 0).toLocaleString()}\uBA85`, sub: `\uB204\uC801 ${(((_b = stats.users) == null ? void 0 : _b.total) || 0).toLocaleString()}\uBA85` },
    { label: "\uAE30\uAC04 \uACB0\uC81C", value: `${(((_c = stats.charges) == null ? void 0 : _c.total_charges) || 0).toLocaleString()}\uAC74`, sub: `\uAE30\uAC04 \uB9E4\uCD9C ${fmtW((_d = stats.charges) == null ? void 0 : _d.period_revenue)}` },
    { label: "\uB9C8\uC74C\uD480 \uC9C1\uC811\uACB0\uC81C \uB9E4\uCD9C", value: fmtW((_e = stats.charges) == null ? void 0 : _e.period_revenue), sub: "\uD30C\uD2B8\uB108 \uACBD\uC720 \uACB0\uC81C\uB9CC" },
    { label: "\uC815\uC0B0 \uC608\uC815\uC561", value: fmtW((_f = stats.settlement) == null ? void 0 : _f.share_amount), sub: `${((selPartner.revenue_share_rate || 0) * 100).toFixed(0)}% \uC250\uC5B4` }
  ].map(({ label, value, sub }) => /* @__PURE__ */ React.createElement("div", { key: label, style: { background: "#F8F8F5", borderRadius: 10, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#888", marginBottom: 4 } }, label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: "#2D2D2D" } }, value), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 2 } }, sub)))), (((_g = stats.daily) == null ? void 0 : _g.signups) || []).length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#5A5A5A" } }, "\uC77C\uBCC4 \uC720\uC785 \uAC00\uC785\uC790"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "flex-end", height: 60 } }, (((_h = stats.daily) == null ? void 0 : _h.signups) || []).map((d) => {
    var _a2;
    const max = Math.max(...(((_a2 = stats.daily) == null ? void 0 : _a2.signups) || []).map((x) => x.cnt), 1);
    return /* @__PURE__ */ React.createElement("div", { key: d.day, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", background: "#2D6A4F", borderRadius: 3, height: `${Math.max(d.cnt / max * 48, 4)}px` } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#9A9A9A", transform: "rotate(-45deg)", transformOrigin: "top left", whiteSpace: "nowrap" } }, d.day.slice(5)));
  })))), settlement && /* @__PURE__ */ React.createElement("div", { style: { background: "#FFF9F0", border: "1px solid #F5DFA0", borderRadius: 10, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#92400E" } }, "\u{1F4B0} ", statsMonth, " \uC815\uC0B0 \uB0B4\uC5ED"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uC2E0\uADDC \uC720\uC785: "), /* @__PURE__ */ React.createElement("strong", null, (settlement.new_users || 0).toLocaleString(), "\uBA85")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uACB0\uC81C \uC804\uD658: "), /* @__PURE__ */ React.createElement("strong", null, (settlement.paid_users || 0).toLocaleString(), "\uBA85")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uB9C8\uC74C\uD480 \uC9C1\uC811\uB9E4\uCD9C: "), /* @__PURE__ */ React.createElement("strong", null, fmtW(settlement.total_revenue))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#9A9A9A" } }, "\uC250\uC5B4\uC728: "), /* @__PURE__ */ React.createElement("strong", null, ((settlement.share_rate || 0) * 100).toFixed(0), "%")), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1", borderTop: "1px solid #F5DFA0", paddingTop: 8, marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#92400E", fontWeight: 700 } }, "\uC815\uC0B0 \uC9C0\uAE09\uC561: "), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: 16, color: "#92400E" } }, fmtW(settlement.share_amount)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9A9A9A", marginLeft: 8 } }, "(\uB9C8\uC74C\uD480 \uBCF4\uC720: ", fmtW(settlement.maumful_revenue), ")"))))) : /* @__PURE__ */ React.createElement("div", { style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 32, textAlign: "center", color: "#9A9A9A" } }, "\uD30C\uD2B8\uB108\uB97C \uC120\uD0DD\uD558\uBA74 \uC0C1\uC138 \uD1B5\uACC4\uC640 \uC815\uC0B0 \uB0B4\uC5ED\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4")));
}
function AdminErrorLogs() {
  const { useState: useS, useEffect: useE } = React;
  const [logs, setLogs] = useS([]);
  const [service, setService] = useS("");
  const [limit, setLimit] = useS(50);
  const [loading, setLoading] = useS(true);
  const [clearing, setClearing] = useS(false);
  const load = () => {
    setLoading(true);
    aApi.errorLogs(service, limit).then((r) => {
      if (r.success) setLogs(r.data || []);
    }).finally(() => setLoading(false));
  };
  useE(() => load(), [service, limit]);
  const handleClear = async () => {
    if (!confirm("\uBAA8\uB4E0 \uC624\uB958 \uB85C\uADF8\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
    setClearing(true);
    await aApi.clearErrorLogs();
    setClearing(false);
    setLogs([]);
  };
  const statusColor = (code) => {
    if (!code) return "gray";
    if (code >= 500) return "red";
    if (code >= 400) return "amber";
    return "blue";
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\u{1F534} \uC624\uB958 \uB85C\uADF8 (", logs.length, "\uAC74)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: service,
      onChange: (e) => {
        setService(e.target.value);
      },
      style: { padding: "7px 10px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", background: "white" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\uC804\uCCB4 \uC11C\uBE44\uC2A4"),
    /* @__PURE__ */ React.createElement("option", { value: "maumful" }, "maumful"),
    /* @__PURE__ */ React.createElement("option", { value: "maumgame" }, "maumgame"),
    /* @__PURE__ */ React.createElement("option", { value: "maumcouple" }, "maumcouple")
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: limit,
      onChange: (e) => setLimit(Number(e.target.value)),
      style: { padding: "7px 10px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", background: "white" }
    },
    /* @__PURE__ */ React.createElement("option", { value: 20 }, "\uCD5C\uADFC 20\uAC74"),
    /* @__PURE__ */ React.createElement("option", { value: 50 }, "\uCD5C\uADFC 50\uAC74"),
    /* @__PURE__ */ React.createElement("option", { value: 100 }, "\uCD5C\uADFC 100\uAC74")
  ), /* @__PURE__ */ React.createElement("button", { onClick: load, style: { padding: "7px 14px", borderRadius: 8, border: "none", background: "#2D6A4F", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uC0C8\uB85C\uACE0\uCE68"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClear,
      disabled: clearing || logs.length === 0,
      style: { padding: "7px 14px", borderRadius: 8, border: "1px solid #E24B4A", background: "white", color: "#E24B4A", fontWeight: 600, fontSize: 13, cursor: clearing || logs.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR',sans-serif" }
    },
    clearing ? "\uC0AD\uC81C \uC911..." : "\uC804\uCCB4 \uC0AD\uC81C"
  ))), loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px", color: "#9A9A9A" } }, "\uB85C\uB529 \uC911...") : logs.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "48px", color: "#9A9A9A", background: "white", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" } }, "\u2705 \uC624\uB958 \uB85C\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, logs.map((log, i) => /* @__PURE__ */ React.createElement("div", { key: log.id || i, style: { background: "white", border: "1px solid rgba(0,0,0,.08)", borderRadius: 10, padding: "14px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Chip, { label: log.status_code || "ERR", color: statusColor(log.status_code) }), /* @__PURE__ */ React.createElement(Chip, { label: log.service || "unknown", color: "blue" }), log.method && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#5B21B6", background: "#EEF0FF", padding: "2px 7px", borderRadius: 5 } }, log.method), log.path && /* @__PURE__ */ React.createElement("code", { style: { fontSize: 12, color: "#1A1A1A", background: "#F5F5F0", padding: "2px 8px", borderRadius: 5, wordBreak: "break-all" } }, log.path)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9A9A9A", whiteSpace: "nowrap" } }, fmtDt(log.created_at))), log.message && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#E24B4A", fontWeight: 500, marginBottom: log.stack ? 6 : 0 } }, log.message), log.stack && /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", { style: { fontSize: 11, color: "#9A9A9A", cursor: "pointer", userSelect: "none" } }, "\uC2A4\uD0DD \uD2B8\uB808\uC774\uC2A4 \uBCF4\uAE30"), /* @__PURE__ */ React.createElement("pre", { style: { fontSize: 11, color: "#5A5A5A", background: "#F9F9F7", borderRadius: 6, padding: "10px", marginTop: 6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflow: "auto" } }, log.stack)), log.user_id && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A", marginTop: 4 } }, "user_id: ", log.user_id)))));
}
function CounselingAdminPage({ setView }) {
  const { useState: useS, useEffect: useE } = React;
  const [authed, setAuthed] = useS(() => !!localStorage.getItem("admin_secret"));
  const [secretInput, setSecretInput] = useS("");
  const [tab, setTab] = useS("overview");
  const [loginErr, setLoginErr] = useS("");
  const login = async () => {
    if (!secretInput) {
      setLoginErr("\uC5B4\uB4DC\uBBFC \uC2DC\uD06C\uB9BF\uC744 \uC785\uB825\uD558\uC138\uC694");
      return;
    }
    localStorage.setItem("admin_secret", secretInput);
    const r = await aApi.stats();
    if (r.success) {
      setAuthed(true);
      setLoginErr("");
    } else {
      localStorage.removeItem("admin_secret");
      setLoginErr("\uC778\uC99D \uC2E4\uD328: \uC2DC\uD06C\uB9BF\uC744 \uD655\uC778\uD558\uC138\uC694");
    }
  };
  const logout = () => {
    localStorage.removeItem("admin_secret");
    setAuthed(false);
    setSecretInput("");
  };
  const tabs = [
    ["overview", "\u{1F4CA} \uB300\uC2DC\uBCF4\uB4DC"],
    ["users", "\u{1F464} \uC0AC\uC6A9\uC790 \uAD00\uB9AC"],
    ["onboarding", "\u{1F4E8} \uC628\uBCF4\uB529 \uC2E0\uCCAD"],
    ["centers", "\u{1F3E5} \uC13C\uD130 \uAD00\uB9AC"],
    ["counselors", "\u{1F465} \uC0C1\uB2F4\uC0AC \uAD00\uB9AC"],
    ["appointments", "\u{1F4C5} \uC608\uC57D \uAD00\uB9AC"],
    ["settlements", "\u{1F4B0} \uC815\uC0B0 \uAD00\uB9AC"],
    ["reviews", "\u2B50 \uB9AC\uBDF0 \uAD00\uB9AC"],
    ["partners", "\u{1F91D} \uD30C\uD2B8\uB108 \uAD00\uB9AC"],
    ["errorlogs", "\u{1F534} \uC624\uB958 \uB85C\uADF8"]
  ];
  if (!authed) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans KR',sans-serif", padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "white", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,.10)" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 28 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 10 } }, "\u{1F510}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, marginBottom: 4 } }, "\uC5B4\uB4DC\uBBFC \uB85C\uADF8\uC778"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#9A9A9A" } }, "\uC0C1\uB2F4 \uD50C\uB7AB\uD3FC \uAD00\uB9AC\uC790 \uC804\uC6A9")), loginErr && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 } }, loginErr), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      value: secretInput,
      onChange: (e) => setSecretInput(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && login(),
      placeholder: "ADMIN_SECRET",
      style: { width: "100%", padding: "12px 14px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", marginBottom: 14 }
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: login, style: { width: "100%", padding: "13px 0", background: "#2D6A4F", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uB85C\uADF8\uC778"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("landing"), style: { background: "none", border: "none", color: "#9A9A9A", fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2190 \uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"))));
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#F5F5F0", fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#1A3D2B", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "white" } }, "\u{1F33F} \uB9C8\uC74C\uD480 \uC5B4\uB4DC\uBBFC"), /* @__PURE__ */ React.createElement("span", { style: { background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.5px" } }, "COUNSELING")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("landing"), style: { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.7)", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2190 \uC0AC\uC774\uD2B8\uB85C"), /* @__PURE__ */ React.createElement("button", { onClick: logout, style: { background: "none", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\uB85C\uADF8\uC544\uC6C3"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minHeight: "calc(100vh - 56px)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 200, background: "#1E2D24", padding: "20px 0", flexShrink: 0 } }, tabs.map(([id, label]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      onClick: () => setTab(id),
      style: { display: "block", width: "100%", textAlign: "left", padding: "12px 20px", background: tab === id ? "rgba(255,255,255,.1)" : "none", border: "none", borderLeft: tab === id ? "3px solid #52B788" : "3px solid transparent", color: tab === id ? "white" : "rgba(255,255,255,.55)", fontSize: 13, fontWeight: tab === id ? 600 : 400, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", transition: "all .15s" }
    },
    label
  ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "28px 32px", overflow: "auto" } }, tab === "overview" && /* @__PURE__ */ React.createElement(AdminOverview, null), tab === "users" && /* @__PURE__ */ React.createElement(AdminUsers, null), tab === "onboarding" && /* @__PURE__ */ React.createElement(AdminOnboarding, null), tab === "centers" && /* @__PURE__ */ React.createElement(AdminCenters, null), tab === "counselors" && /* @__PURE__ */ React.createElement(AdminCounselors, null), tab === "appointments" && /* @__PURE__ */ React.createElement(AdminAppointments, null), tab === "settlements" && /* @__PURE__ */ React.createElement(AdminSettlements, null), tab === "reviews" && /* @__PURE__ */ React.createElement(AdminReviews, null), tab === "partners" && /* @__PURE__ */ React.createElement(AdminPartners, null), tab === "errorlogs" && /* @__PURE__ */ React.createElement(AdminErrorLogs, null))));
}
