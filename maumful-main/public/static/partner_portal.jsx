// ============================================================
// partner_portal.jsx — 제휴사 담당자 정산 포털 (독립·경량·격리)
// /partner 경로 전용. 코어(app.js) 미로드. 전역 React/ReactDOM/Tailwind.
// 자기 정산만 조회(토큰 typ=partner). 다른 파트너/전체 매출 접근 불가.
// ============================================================
const { useState, useEffect, useCallback } = React;

const TK = 'partner_portal_token';
const getTok = () => { try { return localStorage.getItem(TK) || ''; } catch { return ''; } };
const setTok = (t) => { try { t ? localStorage.setItem(TK, t) : localStorage.removeItem(TK); } catch {} };

const won = (n) => '₩' + (Number(n) || 0).toLocaleString('ko-KR');
const isoD = (d) => d.toISOString().slice(0, 10);
const api = async (path, opts) => {
  const r = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getTok(), ...(opts && opts.headers) },
  });
  return r.json();
};

const BRAND = '#2D6A4F';
const F = "'Noto Sans KR',sans-serif";

function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e && e.preventDefault();
    if (!email || !pw) { setMsg('이메일과 비밀번호를 입력해 주세요.'); return; }
    setBusy(true); setMsg('');
    try {
      const d = await fetch('/api/partner-portal/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      }).then(r => r.json());
      if (d.success) { setTok(d.data.token); onDone(d.data.partner); }
      else setMsg(d.error || '로그인에 실패했습니다.');
    } catch { setMsg('네트워크 오류가 발생했습니다.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F3F6F2', fontFamily: F }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
        <div className="text-center mb-6">
          <div className="font-extrabold text-lg" style={{ color: BRAND }}>🌿 마음풀 제휴 정산 포털</div>
          <div className="text-xs text-gray-400 mt-1">제휴사 담당자 전용 로그인</div>
        </div>
        {msg && <div className="text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3">{msg}</div>}
        <label className="text-xs text-gray-500">이메일</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username"
          className="w-full px-3 py-2 mt-1 mb-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400" />
        <label className="text-xs text-gray-500">비밀번호</label>
        <input value={pw} onChange={e => setPw(e.target.value)} type="password" autoComplete="current-password"
          className="w-full px-3 py-2 mt-1 mb-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400" />
        <button type="submit" disabled={busy}
          className="w-full py-2.5 rounded-lg font-bold text-white text-sm" style={{ background: BRAND, opacity: busy ? 0.6 : 1 }}>
          {busy ? '확인 중…' : '로그인'}
        </button>
        <div className="text-[11px] text-gray-400 mt-4 text-center">계정은 마음풀 운영자가 발급합니다. 문의: 담당 운영자</div>
      </form>
    </div>
  );
}

function Dashboard({ partner, onLogout }) {
  const [from, setFrom] = useState(() => isoD(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => isoD(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const d = await api(`/api/partner-portal/commissions?from=${from}&to=${to}`);
      if (d.success) setData(d.data);
      else if (d.error) { setErr(d.error); if (String(d.error).includes('로그인')) onLogout(); }
    } catch { setErr('네트워크 오류'); }
    setLoading(false);
  }, [from, to, onLogout]);

  useEffect(() => { load(); }, []); // 최초 1회

  const t = data && data.totals;
  const rows = (data && data.rows) || [];
  const statusKo = (s) => s === 'settled' ? '정산완료' : s === 'reversed' ? '환불취소' : '정산예정';

  const downloadCsv = () => {
    if (!rows.length) return;
    const hdr = ['거래번호', '일시', '결제액', '수수료율', '쉐어액', '통화', '상태'];
    const esc = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = rows.map(r => [r.charge_id, r.created_at, r.charge_amount, r.rate, r.share_amount, r.currency, statusKo(r.status)].map(esc).join(','));
    const csv = '﻿' + [hdr.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `정산내역_${partner.code}_${from}_${to}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F3F6F2', fontFamily: F }}>
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
        <div>
          <span className="font-extrabold text-sm" style={{ color: BRAND }}>🌿 마음풀 제휴 정산</span>
          <span className="text-xs text-gray-400 ml-2">{partner.name} ({partner.code})</span>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">로그아웃</button>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6">
        {/* 기간 선택 */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm" />
          <span className="text-gray-400">~</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm" />
          <button onClick={load} className="text-white px-3 py-1.5 rounded text-sm font-bold" style={{ background: BRAND }}>조회</button>
          <button onClick={downloadCsv} disabled={!rows.length}
            className={`px-3 py-1.5 rounded text-sm font-bold ${rows.length ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>⬇ CSV</button>
        </div>

        {err && <div className="text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3">{err}</div>}

        {/* 합계 카드 */}
        {t && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              ['유효 건수', (t.cnt || 0).toLocaleString() + '건', '#54605A'],
              ['결제 합계', won(t.revenue), '#54605A'],
              ['쉐어 합계', won(t.share), BRAND],
              ['정산예정', won(t.unsettled), '#C2691A'],
            ].map(([label, val, col]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[11px] text-gray-400 mb-1">{label}</div>
                <div className="font-extrabold text-base" style={{ color: col }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* 원장 표 (최소 집계 · 고객정보/상품 미노출) */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 text-sm font-bold text-gray-700">정산 내역</div>
          {loading ? (
            <div className="text-center text-gray-400 text-sm py-10">불러오는 중…</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-10">해당 기간 정산 내역이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400 bg-gray-50">
                    <th className="text-left font-medium px-4 py-2">거래번호</th>
                    <th className="text-left font-medium px-4 py-2">일시</th>
                    <th className="text-right font-medium px-4 py-2">결제액</th>
                    <th className="text-right font-medium px-4 py-2">수수료율</th>
                    <th className="text-right font-medium px-4 py-2">쉐어액</th>
                    <th className="text-center font-medium px-4 py-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.charge_id} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-400">#{r.charge_id}</td>
                      <td className="px-4 py-2 text-gray-500">{String(r.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{won(r.charge_amount)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{Math.round((r.rate || 0) * 100)}%</td>
                      <td className="px-4 py-2 text-right font-bold" style={{ color: BRAND }}>{won(r.share_amount)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === 'settled' ? 'bg-green-100 text-green-700' : r.status === 'reversed' ? 'bg-gray-100 text-gray-400' : 'bg-amber-100 text-amber-700'}`}>{statusKo(r.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="text-[11px] text-gray-400 mt-3">· 금액은 확정된 유효구매 기준이며, 환불 발생 시 자동 반영됩니다. · 실제 지급 여부는 상태(정산완료)로 확인하세요.</div>
      </div>
    </div>
  );
}

function PartnerPortal() {
  const [partner, setPartner] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getTok()) { setChecking(false); return; }
      try {
        const d = await api('/api/partner-portal/me');
        if (d.success) setPartner(d.data.partner);
        else setTok('');
      } catch {}
      setChecking(false);
    })();
  }, []);

  const logout = () => { setTok(''); setPartner(null); };

  if (checking) return React.createElement('div', { className: 'min-h-screen flex items-center justify-center', style: { background: '#F3F6F2', color: '#8B948D', fontFamily: F } }, '불러오는 중…');
  if (!partner) return <Login onDone={setPartner} />;
  return <Dashboard partner={partner} onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<PartnerPortal />);
