// ============================================================
// partner_entry.jsx — 제휴 진입 랜딩 (경량·독립·config 구동 · 재사용 템플릿)
// /p 경로 전용. 코어(app.js) 미로드. 전역 React/ReactDOM/Tailwind 사용.
// 흐름: ?p=코드&sso_token= → 파트너설정 조회 + SSO 자동로그인 → 랜딩(서비스/안전고지) → 코어(?go=)로 딥링크
// 표준 섹션(서비스 그리드·안전고지·푸터)은 전 파트너 공통, 커스터마이즈는 어드민 필드로 → 신규 제휴사 선례.
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

const F = "'Noto Sans KR',sans-serif";

// 표준 서비스 그리드 (전 파트너 공통) — url 있으면 새 탭, go 있으면 코어 딥링크, 없으면 코어 홈
const SERVICES = [
  { emoji: '🧩', name: '심리검사 10종', tag: '무료 포함', go: 'test:PHQ9',
    desc: '우울·불안·성격·번아웃·직업흥미 등 공인 척도 기반 자가검사. 결과는 AI가 쉬운 말로 풀어드려요.' },
  { emoji: '💬', name: 'AI 마음 상담', go: '',
    desc: '24시간 언제든 대화. 검사 결과를 바탕으로 내 상황에 맞춘 공감과 제안을 받아요.' },
  { emoji: '💕', name: '마음커플', go: '',
    desc: '파트너와의 심리 궁합·관계 코치·데이트 코스 추천까지 한 번에.' },
  { emoji: '🎮', name: '마음게임', go: '',
    desc: '검사 결과에 맞춘 힐링 게임으로 가볍게 마음을 돌봐요.' },
  { emoji: '💑', name: '마음부부', url: 'https://bubu.maumful.com',
    desc: '부부의 대화를 서로의 언어로 통역해 오해를 풀어드려요.' },
  { emoji: '👪', name: '마음세대', url: 'https://sedae.maumful.com',
    desc: '부모–자녀 세대 간 대화를 번역해 갈등을 줄여요.' },
  { emoji: '🦦', name: '마음수달', url: 'https://maumotter.com',
    desc: '아이의 감정 신호를 읽어 부모에게 전해요.' },
  { emoji: '🐾', name: '마음곁', url: 'https://maumgyeot.com',
    desc: '반려동물의 행동·감정을 통역해 더 가까워져요.' },
];

function PartnerEntry() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('p') || '').toUpperCase();
  const ssoToken = params.get('sso_token') || '';

  const [status, setStatus] = useState('loading'); // loading | ready | redirect
  const [cfg, setCfg] = useState(null);
  const [ssoDone, setSsoDone] = useState(false);
  const [ssoFailed, setSsoFailed] = useState(false); // sso_token 왔으나 만료·오류로 자동로그인 실패

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
          if (r.success && r.data) {
            saveLogin(r.data.accessToken, r.data.refreshToken, r.data.user);
            // 코어 진입 후 '별명 설정' 1회 안내가 뜨도록 플래그 (B-2)
            try { localStorage.setItem('maumful_set_nickname', '1'); } catch {}
            setSsoDone(true);
          } else { setSsoFailed(true); }
        } catch { setSsoFailed(true); }
      }

      // 파트너 미등록 → 그냥 코어로 (배너 오작동 방지)
      if (!c) { setStatus('redirect'); location.replace('/'); return; }

      logEvent(code, 'entry_view');
      setCfg(c);
      setStatus('ready');
    })();
  }, []);

  if (status !== 'ready' || !cfg) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center', style: { background: '#F3F6F2', color: '#8B948D', fontFamily: F } }, '불러오는 중…');
  }

  const brand = cfg.primary_color || '#2D6A4F';
  const name = cfg.name || '제휴사';
  const headline = cfg.entry_headline || `${name} 회원님,\n마음풀에 오신 걸 환영해요`;
  const subcopy = cfg.entry_subcopy || cfg.welcome_message || '심리검사부터 AI 상담까지, 지금 내 마음을 가볍게 돌봐 보세요.';
  const benefit = cfg.entry_benefit;
  const ctaLabel = cfg.entry_cta_label || '무료로 내 마음 검사 시작';
  const ctaGo = cfg.entry_cta_go || 'test:PHQ9';

  const goCore = (target) => {
    logEvent(code, 'cta_click');
    location.href = target ? `/?go=${encodeURIComponent(target)}` : '/';
  };
  const openService = (s) => {
    logEvent(code, 'service_click', s.name);
    if (s.url) { window.open(s.url, '_blank', 'noopener'); return; }
    goCore(s.go || null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F6F2', fontFamily: F }}>
      {/* ① 코브랜드 헤더 */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ background: brand + '14', borderBottom: `1px solid ${brand}22` }}>
        {cfg.logo_url
          ? <img src={cfg.logo_url} alt={name} className="h-6 object-contain max-w-[140px]" />
          : <span className="font-bold text-sm" style={{ color: brand }}>{name}</span>}
        <span style={{ color: '#B7C0B9' }}>×</span>
        <span className="font-extrabold text-sm" style={{ color: '#2D6A4F' }}>🌿 마음풀</span>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-8 flex flex-col">
        {/* ② 히어로 */}
        <div className="text-xs font-semibold mb-2" style={{ color: brand }}>{name} 회원 전용</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug whitespace-pre-line" style={{ color: '#1E2621' }}>{headline}</h1>
        <p className="text-sm sm:text-base mt-3 leading-relaxed" style={{ color: '#54605A' }}>{subcopy}</p>
        {ssoDone && (
          <div className="text-xs font-semibold mt-3" style={{ color: brand }}>
            ✓ 이미 {name} 계정으로 로그인됨 · 별도 가입 없이 바로 이용
          </div>
        )}
        {ssoFailed && !ssoDone && (
          <div className="text-xs mt-3 rounded-lg px-3 py-2" style={{ background: '#FEF3E2', color: '#A85B12', border: '1px solid #F4D9AE' }}>
            자동 로그인이 만료되었어요. 아래에서 계속하거나 {name}에서 다시 눌러 접속해 주세요.
          </div>
        )}
        {benefit && (
          <div className="mt-5 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: '#F8EAD8', color: '#A85B12', border: '1px dashed #E6C89B' }}>
            🎁 {benefit}
          </div>
        )}

        {/* 주 CTA */}
        <button onClick={() => goCore(ctaGo)}
          className="mt-6 w-full py-3.5 rounded-xl font-extrabold text-white text-base"
          style={{ background: '#2D6A4F' }}>
          {ctaLabel} →
        </button>

        {/* ③ 서비스 그리드 (표준·전 파트너 공통) */}
        <div className="mt-9">
          <div className="text-[11px] font-semibold tracking-wide uppercase mb-3" style={{ color: '#8B948D' }}>마음풀이 제공하는 서비스</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICES.map(s => (
              <button key={s.name} onClick={() => openService(s)}
                className="text-left bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-300 hover:shadow-sm transition">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: '#1E2621' }}>{s.name}</span>
                  {s.tag && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#E7F3EC', color: '#2D6A4F' }}>{s.tag}</span>}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#6B746E' }}>{s.desc}</p>
                <div className="text-xs font-semibold mt-2" style={{ color: brand }}>{s.url ? '서비스 열기 ↗' : '바로가기 →'}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ④ 안전·운영 고지 (표준·재사용 선례의 핵심) */}
        <div className="mt-9 rounded-2xl bg-white border border-gray-100 p-5">
          <div className="font-bold text-sm mb-3" style={{ color: '#1E2621' }}>안심하고 이용하세요</div>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#54605A' }}>
            <li>🤖 <strong>모든 대화는 AI가 전담</strong>합니다. 상담사 매칭이나 사람의 개입·열람이 없습니다.</li>
            <li>🔒 입력하신 내용은 <strong>외부 AI 학습에 사용되지 않으며</strong>, 회사 담당자·제3자에게 공유되지 않습니다.</li>
            <li>🩺 본 서비스는 자기이해를 돕는 <strong>참고용</strong>이며 의학적 진단·치료가 아닙니다.</li>
            <li>🆘 힘든 마음이 들 땐 24시간 도움을 받을 수 있어요 — <strong>자살예방 상담전화 109</strong>, 정신건강 위기상담 1577-0199.</li>
          </ul>
        </div>

        <button onClick={() => goCore(null)}
          className="mt-6 text-xs underline text-center" style={{ color: '#8B948D' }}>
          마음풀 전체 서비스 둘러보기
        </button>
      </div>

      {/* ⑥ 푸터 */}
      <footer className="w-full border-t border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-6 text-[11px] leading-relaxed text-center" style={{ color: '#9AA39C' }}>
          <div className="font-semibold" style={{ color: '#6B746E' }}>🌿 마음풀 · 마음서비스</div>
          <div className="mt-1">사업자등록번호 780-31-01832 · 통신판매업신고 제2026-서울영등포-1157</div>
          <div className="mt-1">
            <button onClick={() => goCore(null)} className="underline">이용약관</button>
            <span className="mx-1.5">·</span>
            <button onClick={() => goCore(null)} className="underline">개인정보처리방침</button>
            <span className="mx-1.5">·</span>
            <button onClick={() => goCore(null)} className="underline">고객센터</button>
          </div>
          <div className="mt-1.5">긴급 도움 · 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)</div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PartnerEntry />);
