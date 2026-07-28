// ============================================================
// partner_entry.jsx — 제휴 진입 레이어 (경량·독립·config 구동)
// /p 경로 전용. 코어(app.js) 미로드. 전역 React/ReactDOM/Tailwind 사용.
// 흐름: ?p=코드&sso_token= → 파트너설정 조회 + SSO 자동로그인 → 전환화면 → 코어(?go=)로 딥링크
// ============================================================
const { useState, useEffect } = React;

// 코어(app.js)와 동일한 localStorage 키로 토큰 저장 → 코어가 자동 로그인 복원
const saveLogin = (a, r, u) => {
  try {
    if (a) localStorage.setItem('access_token', a);
    if (r) localStorage.setItem('refresh_token', r);
    if (u) localStorage.setItem('current_user', JSON.stringify(u));
  } catch {}
};
const logEvent = (code, event, variant) => {
  try {
    fetch('/api/partner/entry-log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, event, variant }) });
  } catch {}
};

function PartnerEntry() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('p') || '').toUpperCase();
  const ssoToken = params.get('sso_token') || '';

  const [status, setStatus] = useState('loading'); // loading | ready | redirect
  const [cfg, setCfg] = useState(null);
  const [ssoDone, setSsoDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!code) { location.replace('/'); return; }
      try { localStorage.setItem('maumful_partner_code', code); } catch {}

      // 1) 파트너 설정
      let c = null;
      try {
        const r = await fetch(`/api/partner/config?p=${encodeURIComponent(code)}`).then(res => res.json());
        if (r.success) c = r.data;
      } catch {}

      // 2) SSO 자동 로그인 (토큰 있으면)
      if (ssoToken) {
        try {
          const r = await fetch('/api/auth/partner-sso', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partnerCode: code, ssoToken }),
          }).then(res => res.json());
          if (r.success && r.data) { saveLogin(r.data.accessToken, r.data.refreshToken, r.data.user); setSsoDone(true); }
        } catch {}
      }

      // 파트너 미등록 → 그냥 코어로 (배너 오작동 방지)
      if (!c) { setStatus('redirect'); location.replace('/'); return; }

      logEvent(code, 'entry_view');
      setCfg(c);
      setStatus('ready');
    })();
  }, []);

  if (status !== 'ready' || !cfg) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center', style: { background: '#F3F6F2', color: '#8B948D', fontFamily: "'Noto Sans KR',sans-serif" } }, '불러오는 중…');
  }

  const brand = cfg.primary_color || '#2D6A4F';
  const name = cfg.name || '제휴사';
  const headline = cfg.entry_headline || `${name} 회원님,\n마음풀에 오신 걸 환영해요`;
  const subcopy = cfg.entry_subcopy || cfg.welcome_message || '3분 심리검사로 지금 내 마음 상태를 확인해 보세요.';
  const benefit = cfg.entry_benefit;
  const ctaLabel = cfg.entry_cta_label || '무료로 내 마음 검사 시작';
  const ctaGo = cfg.entry_cta_go || 'test:PHQ9';
  const tests = String(cfg.featured_tests || '').split(',').map(s => s.trim()).filter(Boolean);

  const goCore = (target) => {
    logEvent(code, 'cta_click');
    location.href = target ? `/?go=${encodeURIComponent(target)}` : '/';
  };

  const F = "'Noto Sans KR',sans-serif";
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F6F2', fontFamily: F }}>
      {/* 코브랜드 헤더 */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ background: brand + '14', borderBottom: `1px solid ${brand}22` }}>
        {cfg.logo_url
          ? <img src={cfg.logo_url} alt={name} className="h-6 object-contain" />
          : <span className="font-bold text-sm" style={{ color: brand }}>{name}</span>}
        <span style={{ color: '#B7C0B9' }}>×</span>
        <span className="font-extrabold text-sm" style={{ color: '#2D6A4F' }}>🌿 마음풀</span>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto px-6 py-8 flex flex-col">
        <div className="text-xs font-semibold mb-2" style={{ color: brand }}>{name} 회원 전용</div>
        <h1 className="text-2xl font-extrabold leading-snug whitespace-pre-line" style={{ color: '#1E2621' }}>{headline}</h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: '#54605A' }}>{subcopy}</p>
        {ssoDone && (
          <div className="text-xs font-semibold mt-3" style={{ color: brand }}>
            ✓ 이미 {name} 계정으로 로그인됨 · 별도 가입 없이 바로 이용
          </div>
        )}

        {benefit && (
          <div className="mt-5 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: '#F8EAD8', color: '#A85B12', border: '1px dashed #E6C89B' }}>
            🎁 {benefit}
          </div>
        )}

        {tests.length > 0 && (
          <div className="mt-6">
            <div className="text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: '#8B948D' }}>{name} 회원 추천 검사</div>
            <div className="flex flex-wrap gap-2">
              {tests.map(t => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-white"
                  style={{ border: '1px solid #D2DAD3', color: '#54605A' }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" style={{ minHeight: 24 }} />
        <button onClick={() => goCore(ctaGo)}
          className="w-full py-3.5 rounded-xl font-extrabold text-white text-base"
          style={{ background: '#2D6A4F' }}>
          {ctaLabel} →
        </button>
        <button onClick={() => goCore(null)}
          className="mt-3 text-xs underline text-center" style={{ color: '#8B948D' }}>
          마음풀 전체 서비스 둘러보기
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PartnerEntry />);
