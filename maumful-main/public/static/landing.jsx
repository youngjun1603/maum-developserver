// ============================================================
// landing.jsx  —  홈 랜딩페이지 + 글로벌 네비게이션
// phyweb B2C 플랫폼 / Cloudflare Pages + React 18
// ============================================================

// ── 검사 메타데이터 (app.jsx 와 공유) ──────────────────────
const TEST_META = [
  {
    id: 'PHQ9', label: 'PHQ-9', icon: '🌱', color: 'green', free: true,
    name: '우울 자가점검', nameEn: 'Depression Screening',
    desc: '지난 2주간 정서적 상태를 9개 문항으로 가볍게 체크합니다. 전문가들이 활용하는 표준 자가점검 도구입니다.',
    descEn: 'Check your emotional state over the past 2 weeks with 9 items. A standard screening tool used by professionals worldwide.',
    time: '5분', timeEn: '5 min', count: '9문항', countEn: '9 items',
  },
  {
    id: 'GAD7', label: 'GAD-7', icon: '💙', color: 'blue', free: true,
    name: '불안 자가점검', nameEn: 'Anxiety Screening',
    desc: '7개 문항으로 불안과 긴장 수준을 빠르게 점검합니다. WHO가 권장하는 표준 자가점검 도구입니다.',
    descEn: 'Quickly assess your anxiety and tension levels with 7 items. A WHO-recommended standard screening tool.',
    time: '5분', timeEn: '5 min', count: '7문항', countEn: '7 items',
  },
  {
    id: 'DASS21', label: 'DASS-21', icon: '🌊', color: 'teal', free: false,
    name: '우울·불안·스트레스', nameEn: 'Depression·Anxiety·Stress',
    desc: '우울, 불안, 스트레스 세 가지 정서 상태를 동시에 측정하는 종합 정서 검사입니다.',
    descEn: 'A comprehensive emotional assessment that simultaneously measures depression, anxiety, and stress.',
    time: '10분', timeEn: '10 min', count: '21문항', countEn: '21 items',
  },
  {
    id: 'BIG5', label: 'Big5', icon: '🧠', color: 'purple', free: false,
    name: '성격 5요인 검사', nameEn: 'Big Five Personality',
    desc: '개방성·성실성·외향성·친화성·신경증 5가지 성격 차원을 과학적으로 분석합니다.',
    descEn: 'Scientifically analyzes 5 personality dimensions: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.',
    time: '15분', timeEn: '15 min', count: '50문항', countEn: '50 items',
  },
  {
    id: 'LOST', label: 'LOST', icon: '🧭', color: 'amber', free: false,
    name: '행동 운영체계 검사', nameEn: 'Behavioral Style Assessment',
    desc: '에너지 방향·의사결정·행동 방식·관계 성향 등 6가지 축으로 나의 행동 유형을 16가지 중 하나로 파악합니다.',
    descEn: 'Identifies your behavioral type among 16 styles across 6 axes — energy direction, decision-making, action style, relationship orientation, and more.',
    time: '15분', timeEn: '15 min', count: '60문항', countEn: '60 items',
  },
  {
    id: 'SCT', label: 'SRCI', icon: '✍️', color: 'coral', free: false,
    name: '자기반응 완성 검사', nameEn: 'Self-Response Completion',
    desc: '갈등·압박 상황에서 나타나는 자기입장, 정서반응, 관계 패턴을 문장완성 방식으로 탐색합니다.',
    descEn: 'Explore self-position, emotional responses, and relationship patterns in conflict and pressure situations.',
    time: '20분', timeEn: '20 min', count: '25문항', countEn: '25 items',
  },
  {
    id: 'DSI', label: 'SDRI', icon: '🪞', color: 'pink', free: false,
    name: '자기분화 반응성 검사', nameEn: 'Self-Differentiation Index',
    desc: '자기입장 유지·정서반응성·정서적 단절·융합 등 4개 소척도로 자기분화 수준을 평정합니다.',
    descEn: 'Rates self-differentiation level across 4 subscales: self-position, emotional reactivity, emotional cutoff, and fusion.',
    time: '15분', timeEn: '15 min', count: '25문항', countEn: '25 items',
  },
  {
    id: 'BURNOUT', label: 'K-MBI+', icon: '🔥', color: 'red', free: false,
    name: '번아웃 자가점검', nameEn: 'Burnout Screening',
    desc: '정서적 고갈·냉소·효능감 3가지 소진 신호를 체크합니다. 직장인·의료진·교육자에게 특화된 자가점검입니다.',
    descEn: 'Checks 3 burnout signals: emotional exhaustion, cynicism, and efficacy. Specialized for workers, medical staff, and educators.',
    time: '15분', timeEn: '15 min', count: '50문항', countEn: '50 items',
  },
  {
    id: 'RIASEC', label: 'Holland RIASEC', icon: '🔍', color: 'violet', free: false,
    name: '직업 흥미 유형 검사', nameEn: 'Career Interest Type',
    desc: '나의 직업적 적성과 흥미를 실재형·탐구형·예술형·사회형·진취형·관습형 6가지 유형으로 분석합니다.',
    descEn: 'Analyzes your career aptitude and interests across 6 Holland types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.',
    time: '8분', timeEn: '8 min', count: '30문항', countEn: '30 items',
  },
  {
    id: 'VALUES', label: '직업가치관', icon: '💎', color: 'gold', free: false,
    name: '직업가치관 검사', nameEn: 'Work Values Assessment',
    desc: '일에서 무엇을 중시하는지 성취·봉사·안정·자율·창의·영향력 등 10가지 가치요인으로 측정합니다.',
    descEn: 'Measures what you value most at work across 10 factors: achievement, service, stability, autonomy, creativity, influence, and more.',
    time: '8분', timeEn: '8 min', count: '30문항', countEn: '30 items',
  },
];

const COLOR_MAP = {
  green:  { bar: '#2D6A4F', bg: '#D8F3DC', text: '#1A6B3C' },
  blue:   { bar: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  teal:   { bar: '#14B8A6', bg: '#F0FDFA', text: '#0D7A6E' },
  purple: { bar: '#7C3AED', bg: '#F5F3FF', text: '#5B21B6' },
  amber:  { bar: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  coral:  { bar: '#F97316', bg: '#FFF7ED', text: '#C2410C' },
  pink:   { bar: '#EC4899', bg: '#FDF2F8', text: '#9D174D' },
  red:    { bar: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
  violet: { bar: '#6D28D9', bg: '#EDE9FE', text: '#5B21B6' },
  gold:   { bar: '#D97706', bg: '#FEF3C7', text: '#92400E' },
};

// ============================================================
// GlobalNav — 모든 페이지 상단 공통 네비게이션
// props: { setView, isLoggedIn, currentUser, credits }
// ============================================================
function GlobalNav({ setView, isLoggedIn, currentUser, credits, activeView, lang, onLangToggle }) {
  const { useState: useS, useEffect: useE } = React;
  const [scrolled, setScrolled]   = useS(false);
  const [mobileOpen, setMobileOpen] = useS(false);
  const [seriesOpen, setSeriesOpen] = useS(false);
  const tl = (ko, en) => lang === 'en' ? en : ko;

  useE(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 코어 메뉴(1차). 심리검사는 '내 검사'로 — 로그인 후 대시보드 진입 의미 명확화.
  const navItems = [
    { label: tl('검사 소개',  'Assessments'),    view: 'testsIntro' },
    { label: tl('심리검사',   'My Tests'),        view: 'memberDashboard', guestView: 'testsIntro' },
    { label: tl('AI 상담',   'AI Counseling'),   view: 'aiCounsel',       requireLogin: true },
    { label: tl('마음 게임',  'Healing Games'),   view: 'gameIntro', isGame: true },
  ];
  // 마음 시리즈(2차) — 관계·정서 통역 서비스를 단일 드롭다운으로(발견성·정리). 곁 포함(강등 해소).
  const seriesItems = [
    { emoji: '💕', label: tl('마음커플', 'Maumful Couple'), desc: tl('파트너와 심리 궁합', 'Couple compatibility'), isCouple: true },
    { emoji: '🦦', label: tl('마음수달', 'Maumotter'),      desc: tl('아이의 속마음 통역', 'Child feelings'),        isOtter: true },
    { emoji: '🐾', label: tl('마음곁',   'Maumgyeot'),      desc: tl('반려동물 마음 통역', 'Pet behavior'),          isGyeot: true },
    { emoji: '💬', label: tl('마음부부', 'Maumful Bubu'),   desc: tl('부부 대화 통역', 'Couple dialogue'),           isBubu: true },
    { emoji: '🌿', label: tl('마음세대', 'Maumful Sedae'),  desc: tl('부모·자녀 마음 통역', 'Parent-child'),         isSedae: true },
  ];

  const handleNavClick = (item) => {
    setMobileOpen(false);
    // 마음 게임: 로그인 상태면 JWT SSO 자동 연동, 미로그인이면 로그인 화면
    if (item.isGame) {
      if (!isLoggedIn) { setView('memberLogin'); return; }
      const token = localStorage.getItem('access_token') || '';
      const gameUrl = `https://game.maumful.com${token ? '?t=' + encodeURIComponent(token) : ''}`;
      window.open(gameUrl, '_blank', 'noopener noreferrer');
      return;
    }
    // 마음커플: 로그인 상태면 couple-token SSO, 미로그인이면 로그인 화면
    if (item.isCouple) {
      if (!isLoggedIn) { setView('memberLogin'); return; }
      const h = window.location.hostname;
      const coupleBase = (h.includes('workers.dev') || h.includes('-dev.'))
        ? 'https://maumcouple-dev.limyj007.workers.dev'
        : 'https://couple.maumful.com';
      fetch('/api/couple-token', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
      })
        .then(r => r.json())
        .then(data => {
          const token = data.success ? data.coupleToken : (localStorage.getItem('access_token') || '');
          window.open(`${coupleBase}?t=${encodeURIComponent(token)}`, '_blank', 'noopener noreferrer');
        })
        .catch(() => {
          const token = localStorage.getItem('access_token') || '';
          window.open(`${coupleBase}${token ? '?t=' + encodeURIComponent(token) : ''}`, '_blank', 'noopener noreferrer');
        });
      return;
    }
    // 마음곁: 별개 생태계·로그인 SSO 수신부 미구현 → 일반 링크로 이동(추후 곁에 SSO 추가 시 수달 패턴)
    if (item.isGyeot) {
      window.open('https://maumgyeot.com', '_blank', 'noopener noreferrer');
      return;
    }
    // 마음수달: 별개 서비스. 로그인 상태면 SSO 단일로그인, 미로그인이면 maumotter.com으로 그냥 이동(마음풀 로그인 강제 X)
    if (item.isOtter) {
      if (!isLoggedIn) { window.open('https://maumotter.com', '_blank', 'noopener noreferrer'); return; }
      fetch('/api/maum-sso-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.ssoToken) window.open('https://maumotter.com/?sso=' + encodeURIComponent(data.ssoToken), '_blank', 'noopener noreferrer');
          else window.open('https://maumotter.com', '_blank', 'noopener noreferrer');
        })
        .catch(() => window.open('https://maumotter.com', '_blank', 'noopener noreferrer'));
      return;
    }
    // 마음세대(부모-자녀 세대 통역): 마음부부와 동일 패턴(sedae-token SSO)
    if (item.isSedae) {
      if (!isLoggedIn) { setView('memberLogin'); return; }
      const sedaeBase = 'https://sedae.maumful.com';
      fetch('/api/sedae-token', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.sedaeToken) {
            window.open(`${sedaeBase}/?t=${encodeURIComponent(data.sedaeToken)}`, '_blank', 'noopener noreferrer');
          } else {
            window.open(sedaeBase, '_blank', 'noopener noreferrer');
          }
        })
        .catch(() => window.open(sedaeBase, '_blank', 'noopener noreferrer'));
      return;
    }
    // 마음부부: 로그인 상태면 bubu-token SSO, 미로그인이면 로그인 화면
    if (item.isBubu) {
      if (!isLoggedIn) { setView('memberLogin'); return; }
      const h = window.location.hostname;
      const bubuBase = (h.includes('workers.dev') || h.includes('-dev.'))
        ? 'https://maumbubu.limyj007.workers.dev'
        : 'https://bubu.maumful.com';
      fetch('/api/bubu-token', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
      })
        .then(r => r.json())
        .then(data => {
          const token = data.success ? data.bubuToken : (localStorage.getItem('access_token') || '');
          window.open(`${bubuBase}?t=${encodeURIComponent(token)}`, '_blank', 'noopener noreferrer');
        })
        .catch(() => {
          const token = localStorage.getItem('access_token') || '';
          window.open(`${bubuBase}${token ? '?t=' + encodeURIComponent(token) : ''}`, '_blank', 'noopener noreferrer');
        });
      return;
    }
    if (item.requireLogin && !isLoggedIn) {
      setView('memberLogin');
      return;
    }
    if (item.guestView && !isLoggedIn) {
      setView(item.guestView);
      return;
    }
    setView(item.view);
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
      boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* 로고 */}
        <button
          onClick={() => setView('landing')}
          aria-label="마음풀 홈"
          style={{
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <img
            src="/static/maumful-logo.png?v=1"
            alt="마음풀 (Maumful)"
            style={{ height: 30, width: 'auto', display: 'block' }}
          />
        </button>

        {/* 데스크톱 메뉴 */}
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navItems.map(item => (
            <button
              key={item.view + item.label}
              onClick={() => handleNavClick(item)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8,
                fontSize: 14, fontWeight: 400,
                color: activeView === item.view ? '#2D6A4F' : '#5A5A5A',
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0FAF4'; e.currentTarget.style.color = '#2D6A4F'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = activeView === item.view ? '#2D6A4F' : '#5A5A5A'; }}
            >
              {item.label}
            </button>
          ))}
          {/* 마음 시리즈 드롭다운 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSeriesOpen(o => !o)}
              style={{
                background: seriesOpen ? '#F0FAF4' : 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 400,
                color: seriesOpen ? '#2D6A4F' : '#5A5A5A', fontFamily: "'Noto Sans KR', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0FAF4'; e.currentTarget.style.color = '#2D6A4F'; }}
              onMouseLeave={e => { if (!seriesOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5A5A5A'; } }}
            >
              {tl('마음 시리즈', 'Maum Series')} <span style={{ fontSize: 10 }}>▾</span>
            </button>
            {seriesOpen && (
              <>
                <div onClick={() => setSeriesOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 248,
                  background: 'white', borderRadius: 12, boxShadow: '0 10px 34px rgba(0,0,0,0.14)',
                  border: '1px solid rgba(0,0,0,0.06)', padding: 6, zIndex: 1001,
                }}>
                  {seriesItems.map(s => (
                    <button
                      key={s.label}
                      onClick={() => { setSeriesOpen(false); handleNavClick(s); }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '9px 10px', borderRadius: 8,
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0FAF4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1.2 }}>{s.emoji}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{s.label}</span>
                        <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF' }}>{s.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 우측 액션 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setView('memberDashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#F0FAF4', border: '1px solid #B7E4C7',
                  borderRadius: 8, padding: '7px 14px',
                  fontSize: 13, fontWeight: 600, color: '#2D6A4F',
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <span>🌿</span>
                <span>{credits} {tl('크레딧', 'Credits')}</span>
              </button>
              <button
                onClick={() => setView('myPage')}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'white', fontWeight: 700,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
                title="마이페이지"
              >
                {(currentUser?.nickname || currentUser?.email || '?')[0].toUpperCase()}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setView('memberLogin')}
                style={{
                  background: 'none', border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 8, padding: '8px 16px',
                  fontSize: 14, fontWeight: 500, color: '#5A5A5A',
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                {tl('로그인', 'Sign In')}
              </button>
              <button
                onClick={() => setView(isLoggedIn ? 'memberDashboard' : 'testsIntro')}
                style={{
                  background: '#2D6A4F', border: 'none',
                  borderRadius: 8, padding: '8px 18px',
                  fontSize: 14, fontWeight: 600, color: 'white',
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1B5138'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; }}
              >
                {tl('무료 시작 →', 'Get Started →')}
              </button>
            </>
          )}

          {/* 언어 토글 */}
          {onLangToggle && (
            <button
              onClick={() => onLangToggle(lang === 'en' ? 'ko' : 'en')}
              style={{
                background: 'none', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 6, padding: '4px 9px',
                fontSize: 12, fontWeight: 600, color: '#5A5A5A',
                cursor: 'pointer', letterSpacing: '0.3px',
              }}
              title={lang === 'en' ? '한국어로 보기' : 'Switch to English'}
            >
              {lang === 'en' ? '한' : 'EN'}
            </button>
          )}

          {/* 모바일 햄버거 */}
          <button
            className="nav-mobile-btn"
            onClick={() => setMobileOpen(o => !o)}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 6, fontSize: 20,
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.07)',
          background: 'white', padding: '12px 24px 20px',
        }}>
          {navItems.map(item => (
            <button
              key={item.view + item.label}
              onClick={() => handleNavClick(item)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
                fontSize: 15, color: '#1A1A1A',
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {item.label}
            </button>
          ))}
          {/* 마음 시리즈 — 모바일 서브섹션 */}
          <div style={{ paddingTop: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.4px', marginBottom: 2 }}>{tl('마음 시리즈', 'MAUM SERIES')}</div>
            {seriesItems.map(s => (
              <button
                key={s.label}
                onClick={() => handleNavClick(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <span style={{ fontSize: 17 }}>{s.emoji}</span>
                <span style={{ fontSize: 15, color: '#1A1A1A' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>· {s.desc}</span>
              </button>
            ))}
          </div>
          {!isLoggedIn && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => { setMobileOpen(false); setView('memberLogin'); }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.12)', background: 'none',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >{tl('로그인', 'Sign In')}</button>
              <button
                onClick={() => { setMobileOpen(false); setView(isLoggedIn ? 'memberDashboard' : 'testsIntro'); }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8,
                  border: 'none', background: '#2D6A4F',
                  color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >{tl('무료 시작', 'Get Started')}</button>
            </div>
          )}
        </div>
      )}
      {/* 성경구절 띠 — 메뉴 하단 (요한복음 3:16). B2B/제휴 진입(?p= 또는 파트너 컨텍스트)에선 종교색 배제 위해 숨김, 일반 방문자는 유지 */}
      {(() => {
        try {
          const isPartner = !!(new URLSearchParams(location.search).get('p') || sessionStorage.getItem('maumful_partner_cfg'));
          return !isPartner;
        } catch { return true; }
      })() && (
        <div style={{ background: '#f4faf6', borderTop: '1px solid rgba(45,106,79,0.10)', padding: '7px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#2d6a4f', lineHeight: 1.6, fontStyle: 'italic' }}>
            John 3:16 "For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life."
          </span>
        </div>
      )}
    </nav>
  );
}

// ============================================================
// ============================================================
// SNS 공유 컴포넌트 (마음풀)
// ============================================================
function MfSnsHeroBtn({ tl }) {
  const share = () => {
    const k = window.Kakao; if (!k) return;
    if (!k.isInitialized()) k.init(window.KAKAO_APP_KEY);
    k.Share.sendDefault({
      objectType: 'feed',
      content: { title: '마음풀 — 마음을 읽어 전하는 서비스', description: '심리검사로 나를, 커플·부부·세대·아이의 마음은 관계 통역으로 읽어 전해요.', imageUrl: window.location.origin + '/static/og-share.png?v=20260731', link: { mobileWebUrl: window.location.origin, webUrl: window.location.origin } },
      buttons: [{ title: tl('무료로 시작하기', 'Get Started'), link: { mobileWebUrl: window.location.origin, webUrl: window.location.origin } }],
    });
  };
  if (!window.KAKAO_APP_KEY) return null;
  return (
    <button onClick={share} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FEE500', color: '#3C1E1E', border: 'none', borderRadius: 24, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR',sans-serif", boxShadow: '0 2px 10px rgba(254,229,0,0.4)' }}>
      <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, flexShrink: 0 }} fill="#3C1E1E"><path d="M12 2C6.48 2 2 6.02 2 11c0 2.75 1.3 5.2 3.35 6.88L4 22l4.67-2.34C9.73 19.87 10.84 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2z"/></svg>
      {tl('카카오톡으로 공유하기', 'Share on KakaoTalk')}
    </button>
  );
}

function MfSnsFooter({ tl }) {
  const { useState: useS } = React;
  const [cp, setCp] = useS(false);
  const url = window.location.origin;
  const ttl = '마음풀 — 마음을 읽어 전하는 서비스';
  const enc = encodeURIComponent;
  const pop = u => window.open(u, '_blank', 'width=600,height=500,noopener,noreferrer');
  const cpy = () => navigator.clipboard.writeText(url).then(() => { setCp(true); setTimeout(() => setCp(false), 2500); });
  const kakao = () => {
    const k = window.Kakao; if (!k) return;
    if (!k.isInitialized()) k.init(window.KAKAO_APP_KEY);
    k.Share.sendDefault({ objectType: 'feed', content: { title: ttl, description: '심리검사로 나를, 커플·부부·세대·아이의 마음은 관계 통역으로 읽어 전해요.', imageUrl: url + '/static/og-share.png?v=20260731', link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: tl('무료로 시작하기', 'Get Started'), link: { mobileWebUrl: url, webUrl: url } }] });
  };
  const S = { width: 20, height: 20, flexShrink: 0 };
  const IG = 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)';
  const btns = [
    { id: 'kakao',     lbl: tl('카카오톡', 'KakaoTalk'), bg: '#FEE500', fn: kakao,
      ico: <svg viewBox="0 0 24 24" style={S} fill="#3C1E1E"><path d="M12 2C6.48 2 2 6.02 2 11c0 2.75 1.3 5.2 3.35 6.88L4 22l4.67-2.34C9.73 19.87 10.84 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2z"/></svg> },
    { id: 'facebook',  lbl: 'Facebook',  bg: '#1877F2', fn: () => pop('https://www.facebook.com/sharer/sharer.php?u=' + enc(url)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
    { id: 'x',         lbl: 'X',         bg: '#101010', fn: () => pop('https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(ttl)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.257 5.636 5.907-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'instagram', lbl: 'Instagram', bg: IG,        fn: () => navigator.share ? navigator.share({ title: ttl, url }) : cpy(),
      ico: <svg viewBox="0 0 24 24" style={S} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3"/></svg> },
    { id: 'naver',     lbl: tl('네이버', 'Naver'),      bg: '#03C75A', fn: () => pop('https://share.naver.com/web/shareView?url=' + enc(url) + '&title=' + enc(ttl)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="white"><path d="M16 3v7.5L9.5 3H3v18h5V13.5L14.5 21H21V3z"/></svg> },
    { id: 'line',      lbl: 'LINE',      bg: '#06C755', fn: () => pop('https://social-plugins.line.me/lineit/share?url=' + enc(url)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="white"><path d="M19.5 10.5C19.5 6.36 15.64 3 11 3S2.5 6.36 2.5 10.5c0 3.6 2.93 6.6 7.07 7.38.28.06.65.18.75.42.09.22.06.56 0 .78l-.12.93c-.04.22-.17.85.74.46s5-2.91 6.82-5.03C19.32 13.75 19.5 12.15 19.5 10.5z"/></svg> },
    { id: 'whatsapp',  lbl: 'WhatsApp',  bg: '#25D366', fn: () => pop('https://wa.me/?text=' + enc(ttl + '\n' + url)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
    { id: 'telegram',  lbl: 'Telegram',  bg: '#2AABEE', fn: () => pop('https://t.me/share/url?url=' + enc(url) + '&text=' + enc(ttl)),
      ico: <svg viewBox="0 0 24 24" style={S} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
    { id: 'threads',   lbl: 'Threads',   bg: '#101010', fn: () => pop('https://www.threads.net/intent/post?text=' + enc(ttl + ' ' + url)),
      ico: <span style={{ fontSize: 15, fontWeight: 900, color: 'white', fontFamily: 'serif', lineHeight: 1 }}>@</span> },
    { id: 'copy',      lbl: cp ? tl('복사됨 ✓', 'Copied ✓') : tl('링크복사', 'Copy Link'), bg: '#5B6678', fn: cpy,
      ico: <svg viewBox="0 0 24 24" style={S} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  ];
  return (
    <div style={{ padding: '24px 0 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 14, textAlign: 'center', fontFamily: "'Noto Sans KR',sans-serif" }}>
        {tl('이 서비스를 공유해 보세요', 'Share This Service')}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {btns.map(b => (
          <button key={b.id} onClick={b.fn} title={b.lbl} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 42, height: 42, borderRadius: 11, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>{b.ico}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: 'nowrap' }}>{b.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// LandingPage — 홈 메인 페이지
// ============================================================
function LandingPage({ setView, isLoggedIn, lang, setMyPageTab, loadTestHistory, setAutoOpenExternal }) {
  const tl = (ko, en) => lang === 'en' ? en : ko;
  // 마음수달 진입(별개 서비스): 로그인 시 SSO 단일로그인, 비로그인 시 maumotter.com 이동
  const openOtter = () => {
    if (!isLoggedIn) { window.open('https://maumotter.com', '_blank', 'noopener noreferrer'); return; }
    fetch('/api/maum-sso-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
      .then(r => r.json())
      .then(data => { if (data.success && data.ssoToken) window.open('https://maumotter.com/?sso=' + encodeURIComponent(data.ssoToken), '_blank', 'noopener noreferrer'); else window.open('https://maumotter.com', '_blank', 'noopener noreferrer'); })
      .catch(() => window.open('https://maumotter.com', '_blank', 'noopener noreferrer'));
  };
  // 마음게임 진입(미로그인 시 로그인 유도)
  const openGame = () => {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    fetch('/api/game-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
      .then(r => r.json())
      .then(data => { const t = data.success ? data.gameToken : (localStorage.getItem('access_token') || ''); window.open(`https://game.maumful.com${t ? '?t=' + encodeURIComponent(t) : ''}`, '_blank', 'noopener noreferrer'); })
      .catch(() => window.open('https://game.maumful.com', '_blank', 'noopener noreferrer'));
  };
  // 마음커플 진입(couple-token SSO)
  const openCouple = () => {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    const h = window.location.hostname;
    const coupleBase = (h.includes('workers.dev') || h.includes('-dev.')) ? 'https://maumcouple-dev.limyj007.workers.dev' : 'https://couple.maumful.com';
    fetch('/api/couple-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
      .then(r => r.json())
      .then(data => { const t = data.success ? data.coupleToken : (localStorage.getItem('access_token') || ''); window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, '_blank', 'noopener noreferrer'); })
      .catch(() => window.open(coupleBase, '_blank', 'noopener noreferrer'));
  };
  // 마음부부 진입(bubu-token SSO) — handleNavClick isBubu와 동일 로직
  const openBubu = () => {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    const h = window.location.hostname;
    const bubuBase = (h.includes('workers.dev') || h.includes('-dev.')) ? 'https://maumbubu.limyj007.workers.dev' : 'https://bubu.maumful.com';
    fetch('/api/bubu-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
      .then(r => r.json())
      .then(data => { const t = data.success ? data.bubuToken : (localStorage.getItem('access_token') || ''); window.open(`${bubuBase}?t=${encodeURIComponent(t)}`, '_blank', 'noopener noreferrer'); })
      .catch(() => window.open(bubuBase, '_blank', 'noopener noreferrer'));
  };
  // 마음세대 진입(sedae-token SSO)
  const openSedae = () => {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    fetch('/api/sedae-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
      .then(r => r.json())
      .then(data => { if (data.success && data.sedaeToken) window.open('https://sedae.maumful.com/?t=' + encodeURIComponent(data.sedaeToken), '_blank', 'noopener noreferrer'); else window.open('https://sedae.maumful.com', '_blank', 'noopener noreferrer'); })
      .catch(() => window.open('https://sedae.maumful.com', '_blank', 'noopener noreferrer'));
  };
  const { useState: useS, useEffect: useE, useRef } = React;
  // 브랜드 스토리 배너 — 닫으면 30일간 미노출.
  // ⚠️ useS 구조분해(위 줄) 뒤에 둘 것 — const는 호이스팅 안 됨(TDZ). 앞에 두면 ReferenceError로 랜딩이 통째로 크래시.
  // ⚠️ 이 스코프(LandingPage)에 둘 것 — GlobalNav 등 다른 컴포넌트에 두면 같은 이유로 크래시(과거 실사고).
  const STORY_BAR_KEY = 'story_bar_dismissed';
  const [showStoryBar, setShowStoryBar] = useS(() => {
    try {
      const ts = Number(localStorage.getItem(STORY_BAR_KEY) || 0);
      return !ts || (Date.now() - ts) > 30 * 24 * 60 * 60 * 1000;
    } catch { return true; }
  });
  const [activeTestIdx, setActiveTestIdx] = useS(0);
  const [visibleSections, setVisibleSections] = useS({});
  const [slideIdx, setSlideIdx] = useS(0);
  const pausedRef = useRef(false);

  // 스크롤 애니메이션
  useE(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 히어로 우측 쇼케이스 자동 롤링(5초). 마우스오버 정지 + prefers-reduced-motion 존중 + 언마운트 정리.
  useE(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => { if (!pausedRef.current) setSlideIdx(p => (p + 1) % SHOWCASE.length); }, 5000);
    return () => clearInterval(id);
  }, []);

  const fadeIn = (id) => ({
    opacity: visibleSections[id] ? 1 : 0,
    transform: visibleSections[id] ? 'translateY(0)' : 'translateY(28px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  });

  // 히어로 우측 롤링 쇼케이스 — 4서비스(심리검사·게임·커플·수달). 좌측 CTA는 고정.
  const SHOWCASE = [
    { key: 'test', accent: '#2D6A4F', header: tl('🔍 심리검사 선택', '🔍 Select Assessment'),
      badge: { icon: '✅', title: tl('PHQ-9 완료', 'PHQ-9 done'), sub: tl('검사 후 AI 분석', 'AI analysis ready') },
      cta: () => setView(isLoggedIn ? 'memberDashboard' : 'testsIntro'), ctaLabel: tl('전체 검사 10종 보기 →', 'View all 10 →'),
      rows: TEST_META.slice(0, 4).map(t => ({ icon: t.icon, bg: COLOR_MAP[t.color].bg, name: tl(t.name, t.nameEn), sub: tl(t.time, t.timeEn) + ' · ' + tl(t.count, t.countEn), tag: t.free ? tl('무료', 'Free') : tl('10 크레딧', '10 Cr'), free: t.free })) },
    { key: 'game', accent: '#7C3AED', header: tl('🎮 마음게임 · 치유 게임 8종', '🎮 Healing Games'),
      badge: { icon: '🌱', title: tl('하루 한 판, 마음 쉼', 'A daily breather'), sub: tl('무료로 시작', 'Free to start') },
      cta: () => openGame(), ctaLabel: tl('게임 보러가기 →', 'Explore games →'),
      rows: [
        { icon: '🌱', bg: '#F3E8FF', name: tl('마음 정원', 'Mind Garden'), sub: tl('감정 식물 키우기', 'Grow your mood'), tag: tl('무료', 'Free') },
        { icon: '📓', bg: '#F3E8FF', name: tl('감사 일기', 'Gratitude Diary'), sub: tl('3줄 감사 기록', '3 lines a day'), tag: tl('무료', 'Free') },
        { icon: '🫁', bg: '#F3E8FF', name: tl('호흡 훈련', 'Breathing'), sub: tl('불안 진정 4-7-8', 'Calm 4-7-8'), tag: tl('무료', 'Free') },
        { icon: '📦', bg: '#F3E8FF', name: tl('걱정 상자', 'Worry Box'), sub: tl('걱정 비우기', 'Let worries go'), tag: tl('무료', 'Free') } ] },
    { key: 'couple', accent: '#E05A8A', header: tl('💕 마음커플 · 관계 인사이트', '💕 Couple Insights'),
      badge: { icon: '💕', title: tl('우리 궁합 분석', 'Compatibility'), sub: tl('BIG5 기반 · 무료', 'BIG5-based · Free') },
      cta: () => openCouple(), ctaLabel: tl('마음커플 시작 →', 'Start Couple →'),
      rows: [
        { icon: '💕', bg: '#FFE4EE', name: tl('BIG5 궁합 분석', 'BIG5 Match'), sub: tl('성격 차이를 강점으로', 'Differences→strengths'), tag: tl('인기', 'Hot') },
        { icon: '🤖', bg: '#FFE4EE', name: tl('AI 커플 리포트', 'AI Report'), sub: tl('맞춤 관계 인사이트', 'Tailored insights'), tag: tl('무료', 'Free') },
        { icon: '📊', bg: '#FFE4EE', name: tl('관계 건강도 체크', 'Check-In'), sub: tl('월 1회 무료', 'Free monthly'), tag: tl('무료', 'Free') },
        { icon: '🗓️', bg: '#FFE4EE', name: tl('데이트 코스 추천', 'Date Ideas'), sub: tl('취향 기반 AI', 'AI-personalized'), tag: tl('AI', 'AI') } ] },
    { key: 'otter', accent: '#3B6FB5', header: tl('🦦 마음수달 · 아이 마음을 읽어 전해요', '🦦 Maumotter'),
      badge: { icon: '🦦', title: tl('또또와 대화', 'Talk with Otto'), sub: tl('표정 영상 무저장', 'Video not stored') },
      cta: () => openOtter(), ctaLabel: tl('마음수달 보러가기 →', 'Open Maumotter →'),
      rows: [
        { icon: '🦦', bg: '#E7F0FB', name: tl('또또와 대화', 'Talk with Otto'), sub: tl('아이가 편하게 속마음', 'kids open up'), tag: tl('대화', 'Chat') },
        { icon: '🤖', bg: '#E7F0FB', name: tl('마음 읽어 전하기', 'Heart, read & shared'), sub: tl('부모님께 따뜻하게', 'gently for parents'), tag: tl('읽기', 'Read') },
        { icon: '📷', bg: '#E7F0FB', name: tl('표정 영상 분석', 'Facial Reading'), sub: tl('기기 내·저장 안 함', 'on-device'), tag: tl('무저장', 'No-save') },
        { icon: '🔒', bg: '#E7F0FB', name: tl('안전 설계', 'Safe Design'), sub: tl('부모 PIN·위기 안내', 'PIN·crisis'), tag: tl('안전', 'Safe') } ] },
    { key: 'bubu', accent: '#B45309', header: tl('💬 마음부부 · 부부 대화 통역', '💬 Maumful Bubu'),
      badge: { icon: '💬', title: tl('말과 마음의 간극', 'Words vs feelings'), sub: tl('첫 3회 무료', '3 free to start') },
      cta: () => openBubu(), ctaLabel: tl('마음부부 시작 →', 'Start Bubu →'),
      rows: [
        { icon: '💬', bg: '#FEF3C7', name: tl('대화 통역', 'Translate talk'), sub: tl('말 속 진짜 마음', 'the real meaning'), tag: tl('통역', 'Read') },
        { icon: '🕊️', bg: '#FEF3C7', name: tl('싸움 중재', 'Mediation'), sub: tl('갈등 대화 분석', 'analyze conflicts'), tag: tl('중재', 'Calm') },
        { icon: '💗', bg: '#FEF3C7', name: tl('관점 바꿔보기', 'Perspective'), sub: tl('상대 입장에서', "partner's view"), tag: tl('공감', 'Care') },
        { icon: '✝️', bg: '#FEF3C7', name: tl('심리·기독교 트랙', 'Two tracks'), sub: tl('원하는 관점 선택', 'psych & faith'), tag: tl('트랙', 'Track') } ] },
    { key: 'sedae', accent: '#0E7490', header: tl('🌿 마음세대 · 부모-자녀 통역', '🌿 Maumful Sedae'),
      badge: { icon: '🌿', title: tl('세대 사이 통역', 'Across generations'), sub: tl('청소년 무료', 'Free for teens') },
      cta: () => openSedae(), ctaLabel: tl('마음세대 시작 →', 'Start Sedae →'),
      rows: [
        { icon: '🌿', bg: '#CFFAFE', name: tl('부모-자녀 통역', 'Parent-child'), sub: tl('세대 간 말의 간극', 'the generation gap'), tag: tl('통역', 'Read') },
        { icon: '🧒', bg: '#CFFAFE', name: tl('청소년 안전 우선', 'Teen safety'), sub: tl('보호가 먼저', 'protection first'), tag: tl('무료', 'Free') },
        { icon: '📨', bg: '#CFFAFE', name: tl('웹뷰로 공유', 'Web share'), sub: tl('앱 없이 열람', 'no app needed'), tag: tl('공유', 'Share') },
        { icon: '🤝', bg: '#CFFAFE', name: tl('가족 커뮤니티', 'Community'), sub: tl('성인 전용 방', 'adults only'), tag: tl('소통', 'Talk') } ] },
  ];
  const slide = SHOWCASE[slideIdx] || SHOWCASE[0];

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", color: '#1A1A1A', background: '#FAFAF8' }}>

      {/* ── ⓪ 브랜드 스토리 슬림 배너 ────────────────────
          첫 방문 고객을 막지 않는 방식(모달·인터스티셜 아님). 궁금한 사람만 /story로.
          닫으면 localStorage로 30일간 미노출. */}
      {showStoryBar && (
        <div style={{
          background: 'linear-gradient(90deg, #1B4332 0%, #2D6A4F 100%)',
          color: 'white', fontSize: 13, position: 'relative',
        }}>
          <a href="/story/"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '9px 44px 9px 16px', color: 'white', textDecoration: 'none', textAlign: 'center',
            }}>
            <span aria-hidden="true">🌿</span>
            <span style={{ opacity: 0.92 }}>
              {tl('마음풀은 당신도 알지 못하던 마음을 읽어 전합니다', "Maumful reads the heart you didn't know you had")}
            </span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {tl('이야기 보기 →', 'Our story →')}
            </span>
          </a>
          <button
            onClick={() => { setShowStoryBar(false); try { localStorage.setItem(STORY_BAR_KEY, String(Date.now())); } catch {} }}
            aria-label={tl('배너 닫기', 'Dismiss banner')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,.65)',
              fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: 6,
            }}>×</button>
        </div>
      )}

      {/* ── ① HERO ─────────────────────────────────────── */}
      <section style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(150deg, #F0FAF4 0%, #FAFAF8 45%, #FFF8F3 100%)',
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82,183,136,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,162,97,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
          className="hero-grid">

          {/* 왼쪽: 텍스트 */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#D8F3DC', color: '#2D6A4F',
              padding: '6px 14px', borderRadius: 100,
              fontSize: 13, fontWeight: 600, marginBottom: 24,
            }}>
              <span style={{ fontSize: 8, animation: 'pulse 2s infinite' }}>●</span>
              {tl("마음을 읽는 일", "The work of reading hearts")}
            </div>

            <h1 style={{
              fontSize: 52, lineHeight: 1.2, fontWeight: 700,
              marginBottom: 20, letterSpacing: '-1px',
            }}>
              {tl(<>당신도 알지 못하던<br />마음을 읽어서<br /><span style={{ color: '#2D6A4F' }}>전해&nbsp;드립니다.</span></>, <>We read the heart<br />you didn't know you had —<br /><span style={{ color: '#2D6A4F' }}>and bring it to you.</span></>)}
            </h1>

            <p style={{ fontSize: 17, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 36 }}>
              {tl(<>마음은 늘 말보다 한 걸음 뒤에 있습니다. 마음풀은 그 닿지 못한 마음을 읽어 <b style={{ color: '#3A3A3A' }}>당신에게 건네는 서비스</b>입니다.<br />심리검사로 내 마음을, <b style={{ color: '#3A3A3A' }}>관계 통역</b>으로 상대의 마음을 읽고, <b style={{ color: '#3A3A3A' }}>마음게임</b>으로 지친 마음은 스스로 다독여요. 답답할 땐 <b style={{ color: '#3A3A3A' }}>AI</b>와 나누며 지금 내 마음을 확인해 보세요. 마음풀이 <b style={{ color: '#3A3A3A' }}>당신의 친구</b>가 되어 드릴게요.</>, <>The heart is always one step behind our words. Maumful <b style={{ color: '#3A3A3A' }}>reads those unspoken feelings and brings them to you</b>.<br />See your own heart through assessments, others' through <b style={{ color: '#3A3A3A' }}>relationship interpreting</b>, and soothe a weary heart yourself with <b style={{ color: '#3A3A3A' }}>Maum Games</b>. When it weighs on you, share it with <b style={{ color: '#3A3A3A' }}>AI</b> — Maumful will be <b style={{ color: '#3A3A3A' }}>your friend</b>.</>)}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setView(isLoggedIn ? 'memberDashboard' : 'startTest:PHQ9')}
                style={{
                  background: '#2D6A4F', color: 'white', border: 'none',
                  padding: '14px 32px', borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1B5138'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'none'; }}
              >
                {tl("무료 검사 시작하기", "Start Free Assessment")}
              </button>
              <button
                onClick={() => setView('testsIntro')}
                style={{
                  background: 'transparent', color: '#2D6A4F',
                  border: '1.5px solid #2D6A4F',
                  padding: '14px 28px', borderRadius: 12,
                  fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#D8F3DC'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {tl("검사 소개 보기", "View Assessments")}
              </button>
            </div>

            <MfSnsHeroBtn tl={tl} />

            {/* 히어로 통계 */}
            <div style={{
              display: 'flex', gap: 36, marginTop: 48,
              paddingTop: 36, borderTop: '1px solid rgba(0,0,0,0.08)',
            }}>
              {[
                { num: '10', label: tl('전문 심리검사', 'Assessments') },
                { num: '10', label: tl('가입 즉시 크레딧', 'Free Credits') },
                { num: 'AI', label: tl('결과 분석 상담', 'Result Analysis') },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#2D6A4F', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 검사 카드 미리보기 */}
          <div style={{ position: 'relative' }} className="hero-visual"
            onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }}>
            {/* 플로팅 배지(슬라이드별) */}
            <div style={{ position: 'absolute', top: -16, right: -10, zIndex: 10, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{slide.badge.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{slide.badge.title}</div>
                <div style={{ fontSize: 11, color: '#9A9A9A' }}>{slide.badge.sub}</div>
              </div>
            </div>

            {/* 롤링 카드 (좌측 CTA는 고정, 우측만 회전) */}
            <div style={{ position: 'relative', background: 'white', borderRadius: 20, boxShadow: '0 12px 48px rgba(0,0,0,0.10)', padding: '28px 30px 22px', overflow: 'hidden', minHeight: 392 }}>
              <button onClick={() => setSlideIdx((slideIdx + SHOWCASE.length - 1) % SHOWCASE.length)} aria-label={tl('이전', 'Prev')} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', fontSize: 18, color: '#666', zIndex: 5, lineHeight: '28px' }}>‹</button>
              <button onClick={() => setSlideIdx((slideIdx + 1) % SHOWCASE.length)} aria-label={tl('다음', 'Next')} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', fontSize: 18, color: '#666', zIndex: 5, lineHeight: '28px' }}>›</button>

              <div style={{ fontSize: 12, fontWeight: 700, color: slide.accent, marginBottom: 16, letterSpacing: '0.3px', textAlign: 'center' }}>{slide.header}</div>
              {slide.rows.map((r, i) => (
                <div key={slide.key + i} onClick={slide.cta}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, background: i === 0 ? r.bg : '#F9F9F7', cursor: 'pointer', marginBottom: 8, border: i === 0 ? `1px solid ${slide.accent}33` : '1px solid transparent', transition: 'all 0.2s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#9A9A9A' }}>{r.sub}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap',
                    background: slide.key === 'test' ? (r.free ? '#D8F3DC' : '#FFF0E6') : slide.accent + '18',
                    color: slide.key === 'test' ? (r.free ? '#1A6B3C' : '#C05621') : slide.accent }}>{r.tag}</div>
                </div>
              ))}
              <button onClick={slide.cta} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: slide.accent + '12', border: `1px solid ${slide.accent}44`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: slide.accent, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>{slide.ctaLabel}</button>
            </div>

            {/* 점 인디케이터 */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              {SHOWCASE.map((s, i) => (
                <span key={s.key} onClick={() => setSlideIdx(i)} role="button" aria-label={String(i + 1)}
                  style={{ width: i === slideIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === slideIdx ? slide.accent : '#D5D5D5', cursor: 'pointer', transition: 'all 0.25s' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ② 검사 8종 ──────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div id="sec-tests" data-animate style={{ textAlign: 'center', marginBottom: 56, ...fadeIn('sec-tests') }}>
            <div style={{
              display: 'inline-block', background: '#D8F3DC', color: '#2D6A4F',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 14,
            }}>Psychological Tests</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
              {tl(<>10가지 전문 <span style={{ color: '#2D6A4F' }}>심리·진로 검사</span></>, <>10 Professional <span style={{ color: '#2D6A4F' }}>Assessments</span></>)}
            </h2>
            <p style={{ fontSize: 16, color: '#5A5A5A', maxWidth: 480, margin: '0 auto' }}>
              {tl("정신건강 분야에서 널리 활용되는 표준화된 자가점검 도구를 제공합니다", "Standardized self-check tools widely used in the mental wellness field")}
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
          }} className="tests-grid">
            {TEST_META.map((t, i) => {
              const c = COLOR_MAP[t.color];
              return (
                <div
                  key={t.id}
                  onClick={() => setView(isLoggedIn ? 'memberDashboard' : 'testsIntro')}
                  style={{
                    background: 'white', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 14, padding: '24px 22px',
                    cursor: 'pointer', transition: 'all 0.25s',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    borderTop: `3px solid ${c.bar}`,
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.10)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ fontSize: 30 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9A9A9A', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{tl(t.name, t.nameEn)}</div>
                    <div style={{ fontSize: 13, color: '#6A6A6A', lineHeight: 1.6 }}>{tl(t.desc, t.descEn).substring(0, 55)}...</div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#9A9A9A' }}>⏱ {tl(t.time, t.timeEn)} · {tl(t.count, t.countEn)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                      background: t.free ? '#D8F3DC' : '#FFF0E6',
                      color: t.free ? '#1A6B3C' : '#C05621',
                    }}>
                      {t.free ? tl('무료', 'Free') : tl('10 크레딧', '10 Credits')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={() => setView('testsIntro')}
              style={{
                background: 'transparent', color: '#2D6A4F',
                border: '1.5px solid #2D6A4F', borderRadius: 10,
                padding: '12px 32px', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#D8F3DC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {tl("각 검사 상세 소개 보기 →", "View detailed assessment info →")}
            </button>
          </div>
        </div>
      </section>

      {/* ── ③ 서비스 특징 ────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F5F5F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div id="sec-feat" data-animate style={{ textAlign: 'center', marginBottom: 52, ...fadeIn('sec-feat') }}>
            <div style={{
              display: 'inline-block', background: '#EEF0FF', color: '#5B21B6',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 14,
            }}>Why 마음풀</div>
            <h2 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
              {tl(<>신뢰할 수 있는<br /><span style={{ color: '#2D6A4F' }}>심리검사</span>가 필요한 이유</>, <>Why you need a<br /><span style={{ color: '#2D6A4F' }}>trusted assessment</span></>)}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="features-grid">
            {[
              {
                icon: '📋', bg: '#D8F3DC',
                title: tl('표준화 심리검사', 'Standardized Tools'),
                desc: tl('PHQ-9, GAD-7 등 국제적으로 널리 쓰이는 표준 자가점검 문항을 바탕으로 구성했습니다. 전문가들이 신뢰하는 문항 기준을 따릅니다.', 'Built on internationally recognized standard self-check items such as PHQ-9 and GAD-7 — following criteria trusted by professionals.'),
              },
              {
                icon: '🤖', bg: '#EEF0FF',
                title: tl('AI 결과 해석 상담', 'AI-Powered Interpretation'),
                desc: tl('검사 완료 후 Anthropic Claude AI와 1:1 대화로 나의 결과를 더 깊이 이해할 수 있습니다. 단순 점수를 넘어선 인사이트를 제공합니다.', 'After completing a test, have a 1:1 conversation with Anthropic Claude AI to deeply understand your results — insights beyond just scores.'),
              },
              {
                icon: '🔒', bg: '#FEF3C7',
                title: tl('완전한 프라이버시 보호', 'Full Privacy Protection'),
                desc: tl('검사 결과는 본인 계정에만 저장됩니다. 개인 식별 정보와 분리 보관하여 익명성을 보장합니다.', 'Your results are stored only in your account, kept separate from personal identifiers to guarantee anonymity.'),
              },
            ].map(f => (
              <div key={f.title} style={{
                background: 'white', borderRadius: 14, padding: '32px 28px',
                border: '1px solid rgba(0,0,0,0.07)',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: f.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 26, marginBottom: 18,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ④ AI 상담 섹션 ──────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1A3D2B 0%, #2D6A4F 100%)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="ai-grid">
            <div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              }}>AI Counseling</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, color: 'white', marginBottom: 16 }}>
                {tl(<>검사 결과,<br />AI와 함께<br />이해하세요</>, <>Understand your<br />results with<br />AI counseling</>)}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>단순한 점수 확인을 넘어,<br />내 결과의 의미와 앞으로의 방향을 대화로 탐색합니다.</>, <>Beyond just seeing a score — explore the meaning of your results and your path forward through conversation.</>)}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {tl(['📊 결과 해석', '💭 감정 탐색', '🗺 대처 방법', '🔄 추가 검사 추천'], ['📊 Result Interpretation', '💭 Emotion Exploration', '🗺 Coping Strategies', '🔄 Test Recommendations']).map(chip => (
                  <span key={chip} style={{
                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
                    padding: '6px 14px', borderRadius: 100, fontSize: 13,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>{chip}</span>
                ))}
              </div>

              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setView('aiCounsel');
                  } else {
                    // 비로그인: 검사 소개 페이지로 이동 (PHQ9·GAD7 중 선택)
                    setView('testsIntro');
                  }
                }}
                style={{
                  background: '#F4A261', border: 'none', borderRadius: 12,
                  padding: '14px 32px', fontSize: 16, fontWeight: 700,
                  color: 'white', cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E76F51'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F4A261'; }}
              >
                {tl("AI 상담 체험하기 →", "Try AI Counseling →")}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {tl("PHQ-9 우울 검사(무료) → 결과 확인 → AI 상담", "PHQ-9 Depression (Free) → View Results → AI Counseling")}
              </div>
            </div>

            {/* 채팅 미리보기 */}
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                paddingBottom: 16, marginBottom: 20,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#D8F3DC', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{tl('마음이 (AI 상담)', 'Maumi (AI Counselor)')}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>● {tl('온라인', 'Online')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tl([
                  { type: 'ai', text: 'PHQ-9 결과를 확인했어요. 지난 2주간 우울감이 다소 높게 나타났는데, 특히 수면과 집중력 부분이 눈에 띄네요. 좀 더 이야기해볼까요?' },
                  { type: 'user', text: '네, 요즘 잠을 잘 못 자고 있어요' },
                  { type: 'ai', text: '수면 어려움이 얼마나 됐는지 알 수 있을까요? 최근에 특별히 스트레스받는 일이 있었나요?' },
                ], [
                  { type: 'ai', text: "I've looked at your PHQ-9 results. Your mood has been somewhat low over the past two weeks — sleep and concentration stand out in particular. Want to talk more about it?" },
                  { type: 'user', text: "Yes, I've been having a hard time sleeping lately." },
                  { type: 'ai', text: "How long have you been struggling with sleep? Has anything particularly stressful been happening recently?" },
                ]).map((msg, i) => (
                  <div key={i} style={{
                    maxWidth: '82%', padding: '11px 15px', borderRadius: 14, fontSize: 13, lineHeight: 1.65,
                    alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.type === 'ai' ? 'rgba(255,255,255,0.12)' : '#52B788',
                    color: msg.type === 'ai' ? 'rgba(255,255,255,0.88)' : 'white',
                    borderBottomLeftRadius: msg.type === 'ai' ? 4 : 14,
                    borderBottomRightRadius: msg.type === 'user' ? 4 : 14,
                  }}>{msg.text}</div>
                ))}
              </div>

              <div style={{
                marginTop: 14, background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '11px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: 'rgba(255,255,255,0.35)', fontSize: 13,
              }}>
                <span>{tl('메시지를 입력하세요...', 'Type your message...')}</span>
                <span>↑</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ④-2 일반 AI와의 차별화 ──────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F8F8F5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div id="sec-diff" data-animate style={{ textAlign: 'center', marginBottom: 52, ...fadeIn('sec-diff') }}>
            <div style={{
              display: 'inline-block', background: '#FEF3C7', color: '#B45309',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 14,
            }}>{tl('마음풀만의 차이', "What makes Maumful different")}</div>
            <h2 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
              {tl(<>ChatGPT에게 물어보는 것과<br /><span style={{ color: '#2D6A4F' }}>무엇이 다른가요?</span></>, <>How is this different<br />from <span style={{ color: '#2D6A4F' }}>asking ChatGPT?</span></>)}
            </h2>
            <p style={{ fontSize: 16, color: '#5A5A5A', maxWidth: 520, margin: '0 auto' }}>
              {tl('일회성 대화가 아닌, 검사 기반 지속 관리 상담입니다', 'Not a one-off chat — ongoing, assessment-based mental wellness support')}
            </p>
          </div>

          {/* 비교 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 56 }} className="compare-grid">
            {/* 일반 AI */}
            <div style={{
              background: 'white', borderRadius: 16, padding: '32px 28px',
              border: '2px solid rgba(0,0,0,0.08)',
              opacity: 0.75,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#F5F5F5', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#555' }}>{tl("일반 AI (ChatGPT 등)", "Generic AI (ChatGPT etc.)")}</div>
                  <div style={{ fontSize: 12, color: '#9A9A9A' }}>{tl("일회성 대화 서비스", "One-off conversation")}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tl([
                  '내 심리 상태를 전혀 모른 채 답변',
                  '오늘 대화는 내일이면 기억 못함',
                  '검사 근거 없는 일반적 조언',
                  '시간이 지나도 변화 추적 불가',
                  '누구에게나 동일한 답변 패턴',
                ], [
                  'Responds with no knowledge of your mental state',
                  "Today's conversation is forgotten tomorrow",
                  'Generic advice with no assessment basis',
                  'No tracking of changes over time',
                  'Same response pattern for everyone',
                ]).map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#D1D5DB', fontSize: 16, flexShrink: 0 }}>✗</span>
                    <span style={{ fontSize: 14, color: '#888' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 마음풀 */}
            <div style={{
              background: 'linear-gradient(135deg, #F0FAF4, #FAFAF8)',
              borderRadius: 16, padding: '32px 28px',
              border: '2px solid #52B788',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: '#2D6A4F', color: 'white',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              }}>{tl("마음풀 방식", "Maumful Approach")}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#D8F3DC', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22,
                }}>🌿</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{tl("마음풀 AI 상담", "Maumful AI Counseling")}</div>
                  <div style={{ fontSize: 12, color: '#52B788' }}>{tl("심리검사 기반 지속 관리", "Assessment-based continuous care")}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tl([
                  'PHQ-9, GAD-7 등 검사 결과를 이미 알고 대화',
                  '이전 검사 이력·감정 기록을 기억해 맥락 유지',
                  '내 점수와 응답 패턴 기반 개인화 상담',
                  '시간 경과에 따른 심리 변화 트렌드 추적',
                  '나만의 데이터 프로필로 정밀한 인사이트',
                ], [
                  'Already knows your PHQ-9, GAD-7 results when you chat',
                  'Maintains context from your past test history and mood logs',
                  'Personalized counseling based on your scores and response patterns',
                  'Tracks your psychological changes and trends over time',
                  'Precise insights powered by your personal data profile',
                ]).map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#52B788', fontSize: 16, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: '#3A3A3A' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 외부 검사결과 AI 해석 하이라이트 */}
          <div style={{
            background: 'linear-gradient(135deg, #1A3D2B, #2D6A4F)',
            borderRadius: 20, padding: '40px 48px',
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center',
          }} className="pdf-banner">
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                fontSize: 12, fontWeight: 700, letterSpacing: '1px',
                padding: '4px 12px', borderRadius: 100, marginBottom: 16,
              }}>
                <span>📄</span> NEW FEATURE
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 12, lineHeight: 1.4, wordBreak: 'keep-all' }}>
                {tl(<>MBTI, MMPI, K-WAIS…<br />외부 검사결과도 AI가 해석해 드립니다</>, <>MBTI, MMPI, K-WAIS…<br />AI interprets your external test results too</>)}
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 20 }}>
                {tl('다른 기관에서 받은 심리검사 결과지를 업로드하거나 점수를 입력하면, 마음풀 AI가 전문적으로 해석하고 마음풀 프로필에 통합합니다. 이후 AI 상담이 이 결과까지 반영해 더 깊이 있는 대화를 제공합니다.', 'Upload a report or enter scores from any assessment you received elsewhere — Maumful AI interprets them professionally and integrates them into your profile, so future AI counseling conversations reflect the full picture.')}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tl(['📎 PDF 업로드', '✏️ 점수 직접 입력', '🔗 상담 이력 통합', '💬 AI 해석 즉시 제공'], ['📎 PDF Upload', '✏️ Enter Scores Manually', '🔗 Integrated History', '💬 Instant AI Interpretation']).map(chip => (
                  <span key={chip} style={{
                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.88)',
                    padding: '5px 12px', borderRadius: 100, fontSize: 12,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>{chip}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }} className="pdf-banner-btn-wrap">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    // 페이지 이동 없이 모달 바로 오픈
                    if (setAutoOpenExternal) setAutoOpenExternal(true);
                  } else {
                    setView('memberLogin');
                  }
                }}
                style={{
                  background: '#F4A261', border: 'none', borderRadius: 12,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700,
                  color: 'white', cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E76F51'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F4A261'; }}
              >
                {tl('외부 결과 해석하기 →', 'Interpret External Results →')}
              </button>
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                {tl('로그인 후 마이페이지 → 검사이력에서 사용', 'Sign in → My Page → Test History')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ⑤ 이용 방법 (3단계) ─────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-block', background: '#FEF3C7', color: '#B45309',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 14,
            }}>How It Works</div>
            <h2 style={{ fontSize: 34, fontWeight: 700 }}>
              {tl(<>3단계로 <span style={{ color: '#2D6A4F' }}>간단하게</span> 시작</>, <>Get started in <span style={{ color: '#2D6A4F' }}>3 simple steps</span></>)}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' }} className="steps-grid">
            {/* 연결선 */}
            <div style={{
              position: 'absolute', top: 32, left: '16.67%', right: '16.67%',
              height: 1, background: 'linear-gradient(90deg, #B7E4C7, #52B788, #B7E4C7)',
              zIndex: 0,
            }} />

            {[
              { step: '01', icon: '📋', title: tl('회원가입', 'Sign Up'), desc: tl('이메일로 30초 만에 가입. 즉시 20 크레딧 지급됩니다.', 'Sign up with email in 30 seconds. Receive 20 credits instantly.'), note: tl('무료검사 2종 + 20 크레딧', '2 free tests + 20 credits') },
              { step: '02', icon: '🔍', title: tl('검사 선택 & 수행', 'Pick & Take a Test'), desc: tl('10가지 검사 중 원하는 것을 선택. 질문에 솔직하게 답하세요.', 'Choose from 10 assessments. Answer the questions honestly.'), note: tl('최소 5분이면 완료', 'Done in as little as 5 min') },
              { step: '03', icon: '💬', title: tl('AI와 결과 상담', 'AI Result Counseling'), desc: tl('검사 완료 즉시 AI 상담사와 대화로 결과를 분석합니다.', 'Right after your test, analyze your results through conversation with an AI counselor.'), note: tl('내 언어로 쉽게 이해', 'Understand in plain language') },
            ].map((s, i) => (
              <div key={s.step} style={{ padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'white', border: '2px solid #B7E4C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, margin: '0 auto 20px',
                  boxShadow: '0 4px 16px rgba(45,106,79,0.12)',
                }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#52B788', letterSpacing: '1px', marginBottom: 8 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.7, marginBottom: 10 }}>{s.desc}</p>
                <span style={{
                  display: 'inline-block', fontSize: 12, fontWeight: 600,
                  background: '#D8F3DC', color: '#2D6A4F',
                  padding: '4px 12px', borderRadius: 100,
                }}>{s.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ⑥ 통계 (신뢰 지표) ─────────────────────────── */}
      <section style={{ background: '#2D6A4F', padding: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
          className="stats-grid">
          {[
            { num: '10', label: tl('전문 심리·진로 검사', 'Professional Assessments') },
            { num: '10', label: tl('가입 즉시 무료 크레딧', 'Free Credits on Signup') },
            { num: '5min~', label: tl('최소 검사 소요시간', 'Minimum Test Duration') },
            { num: '100%', label: tl('데이터 프라이버시', 'Data Privacy') },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '52px 20px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
            }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ⑦ CTA 섹션 ──────────────────────────────────── */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, #D8F3DC, #B7E4C7)',
      }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
          {tl("지금 바로 시작하세요", "Start your journey today")}
        </h2>
        <p style={{ fontSize: 17, color: '#5A5A5A', marginBottom: 36 }}>
          {tl("가입 즉시 20 크레딧 지급 — 심리검사 4회 + AI 상담 5회 무료", "Get 20 credits instantly on signup — 4 assessments + 5 AI chats free")}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setView(isLoggedIn ? 'memberDashboard' : 'testsIntro')}
            style={{
              background: '#2D6A4F', color: 'white', border: 'none',
              padding: '16px 40px', borderRadius: 12,
              fontSize: 17, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1B5138'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'none'; }}
          >
            {tl("무료 회원가입 →", "Sign up free →")}
          </button>
          <button
            onClick={() => setView('testsIntro')}
            style={{
              background: 'white', color: '#2D6A4F',
              border: '1.5px solid #2D6A4F', borderRadius: 12,
              padding: '16px 36px', fontSize: 17, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0FAF4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            {tl("검사 목록 둘러보기", "Browse assessments")}
          </button>
        </div>
      </section>


      {/* ── ⑦-2 상담센터 안내 섹션 ─────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="ai-grid">
            <div>
              <div style={{
                display: 'inline-block', background: '#D8F3DC', color: '#2D6A4F',
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              }}>Counseling Centers</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>가까운 상담센터를<br /><span style={{ color: '#2D6A4F' }}>바로 찾아보세요</span></>, <>Find a counseling center<br /><span style={{ color: '#2D6A4F' }}>near you</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>검사 결과를 상담사에게 보여주면 첫 상담부터<br />더 깊이 있는 대화를 시작할 수 있습니다.</>, <>Sharing your test results with a counselor helps you skip the small talk and dive deeper from the very first session.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '📍', text: '카카오맵으로 내 근처 상담센터 즉시 검색' },
                  { icon: '🧠', text: '정신건강의학과 · 심리상담센터 · 복지센터' },
                  { icon: '📞', text: '24시간 무료 상담전화 바로 연결' },
                ], [
                  { icon: '📍', text: 'Search nearby centers instantly via Kakao Maps' },
                  { icon: '🧠', text: 'Psychiatry · Counseling centers · Community centers' },
                  { icon: '📞', text: '24-hour free crisis hotline direct connection' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setView('counseling')}
                style={{
                  background: '#2D6A4F', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'none'; }}
              >
                🏥 {tl('상담센터 찾기 →', 'Find a Center →')}
              </button>
            </div>

            {/* 검색 카드 미리보기 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tl([
                { emoji: '🏥', name: '심리상담센터', desc: '우울·불안·대인관계·번아웃 전문', color: '#2D6A4F', bg: '#D8F3DC', query: '심리상담센터' },
                { emoji: '🧠', name: '정신건강의학과', desc: '전문의 진료 · 건강보험 적용', color: '#0284C7', bg: '#E0F2FE', query: '정신건강의학과' },
                { emoji: '🏢', name: '정신건강복지센터', desc: '시·군·구 운영 · 무료 방문 상담', color: '#D97706', bg: '#FEF3C7', query: '정신건강복지센터' },
              ], [
                { emoji: '🏥', name: 'Counseling Centers', desc: 'Depression · Anxiety · Relationships · Burnout', color: '#2D6A4F', bg: '#D8F3DC', query: '심리상담센터' },
                { emoji: '🧠', name: 'Psychiatry Clinics', desc: 'Specialist care · National health insurance', color: '#0284C7', bg: '#E0F2FE', query: '정신건강의학과' },
                { emoji: '🏢', name: 'Community Mental Health Centers', desc: 'Gov-run · Free walk-in counseling', color: '#D97706', bg: '#FEF3C7', query: '정신건강복지센터' },
              ]).map(card => (
                <div key={card.name}
                  onClick={() => window.open(`https://map.kakao.com/?q=${encodeURIComponent(card.query)}`, '_blank', 'noopener')}
                  style={{
                    background: 'white', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.2s', borderLeft: `4px solid ${card.color}`,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ fontSize: 28, width: 44, height: 44, background: card.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{card.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{card.desc}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: card.color, background: card.bg, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>{tl('지도 검색', 'Map Search')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ⑦-3 마음 게임 소개 ──────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F5F5F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
            className="ai-grid">
            <div>
              <div style={{
                display: 'inline-block', background: '#D8F3DC', color: '#2D6A4F',
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              }}>Healing Games</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>마음을 가꾸는<br /><span style={{ color: '#2D6A4F' }}>치유 게임</span></>, <>Games that<br /><span style={{ color: '#2D6A4F' }}>nurture your mind</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>심리검사 결과와 연동된 마음 돌봄 게임으로<br />일상 속에서 나의 마음을 돌보세요.</>, <>Mind-care games linked to your test results — take care of your mind in everyday life.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '🌿', text: '마음의 정원 — 호흡 훈련 + 인지 교정 (무료)' },
                  { icon: '🌸', text: '감정꽃 찾기 — 감정 인식 훈련' },
                  { icon: '⭐', text: '별빛 감사 일기 — 긍정심리학 루틴' },
                  { icon: '🌳', text: '내면의 나무 — ACT 기반 자아 성장' },
                ], [
                  { icon: '🌿', text: 'Mind Garden — Breathing + Cognitive Training (Free)' },
                  { icon: '🌸', text: 'Emotion Flower — Emotional Awareness Training' },
                  { icon: '⭐', text: 'Starlight Gratitude — Positive Psychology Routine' },
                  { icon: '🌳', text: 'Inner Tree — ACT-Based Self Growth' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) { setView('memberLogin'); return; }
                  const token = localStorage.getItem('access_token') || '';
                  window.open(`https://game.maumful.com${token ? '?t=' + encodeURIComponent(token) : ''}`, '_blank', 'noopener noreferrer');
                }}
                style={{
                  background: '#2D6A4F', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1B5138'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'none'; }}
              >
                {tl('마음 게임 시작하기 →', 'Start Healing Games →')}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: '#9A9A9A' }}>
                {tl('로그인 후 별도 로그인 없이 바로 이동합니다', 'No separate login needed — seamlessly linked after sign-in')}
              </div>
            </div>

            {/* 게임 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {tl([
                { emoji: '🌿', name: '마음의 정원', tag: '레벨 1 · 무료', color: '#2D6A4F', bg: '#D8F3DC' },
                { emoji: '🌸', name: '감정꽃 찾기', tag: 'PHQ-9 연동', color: '#EC4899', bg: '#FDF2F8' },
                { emoji: '⭐', name: '별빛 감사 일기', tag: '레벨 2', color: '#F59E0B', bg: '#FFFBEB' },
                { emoji: '🌳', name: '내면의 나무', tag: 'SDRI 연동', color: '#059669', bg: '#ECFDF5' },
              ], [
                { emoji: '🌿', name: 'Mind Garden', tag: 'Level 1 · Free', color: '#2D6A4F', bg: '#D8F3DC' },
                { emoji: '🌸', name: 'Emotion Flower', tag: 'PHQ-9 Linked', color: '#EC4899', bg: '#FDF2F8' },
                { emoji: '⭐', name: 'Starlight Gratitude', tag: 'Level 2', color: '#F59E0B', bg: '#FFFBEB' },
                { emoji: '🌳', name: 'Inner Tree', tag: 'SDRI Linked', color: '#059669', bg: '#ECFDF5' },
              ]).map(g => (
                <div key={g.name}
                  onClick={() => {
                    if (!isLoggedIn) { setView('memberLogin'); return; }
                    const token = localStorage.getItem('access_token') || '';
                    window.open(`https://game.maumful.com${token ? '?t=' + encodeURIComponent(token) : ''}`, '_blank', 'noopener noreferrer');
                  }}
                  style={{
                    background: g.bg, borderRadius: 16, padding: '22px 18px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    border: `1.5px solid ${g.color}22`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{g.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{g.name}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: 'white', color: g.color, border: `1px solid ${g.color}44`,
                  }}>{g.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── 마음커플 ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#FFF1F5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
            className="ai-grid">

            {/* 커플 카드 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {tl([
                { emoji: '💕', name: 'BIG5 궁합 분석',    tag: '성격 차이를 강점으로', color: '#E05A8A', bg: '#FFE4EE' },
                { emoji: '🤖', name: 'AI 커플 리포트',     tag: '맞춤 관계 인사이트',   color: '#9333EA', bg: '#F3E8FF' },
                { emoji: '📊', name: '관계 건강도 체크인', tag: '월 1회 무료',           color: '#0891B2', bg: '#E0F7FA' },
                { emoji: '🗓️', name: '데이트 코스 추천',  tag: 'AI 개인화 추천',        color: '#D97706', bg: '#FEF3C7' },
              ], [
                { emoji: '💕', name: 'BIG5 Compatibility', tag: 'Turn differences into strengths', color: '#E05A8A', bg: '#FFE4EE' },
                { emoji: '🤖', name: 'AI Couple Report',   tag: 'Personalized relationship insights', color: '#9333EA', bg: '#F3E8FF' },
                { emoji: '📊', name: 'Relationship Check-In', tag: 'Free once a month',           color: '#0891B2', bg: '#E0F7FA' },
                { emoji: '🗓️', name: 'Date Ideas',         tag: 'AI-personalized picks',          color: '#D97706', bg: '#FEF3C7' },
              ]).map(g => (
                <div key={g.name}
                  onClick={() => {
                    if (!isLoggedIn) { setView('memberLogin'); return; }
                    const h = window.location.hostname;
                    const coupleBase = (h.includes('workers.dev') || h.includes('-dev.'))
                      ? 'https://maumcouple-dev.limyj007.workers.dev'
                      : 'https://couple.maumful.com';
                    fetch('/api/couple-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
                      .then(r => r.json())
                      .then(data => { const t = data.success ? data.coupleToken : (localStorage.getItem('access_token') || ''); window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, '_blank', 'noopener noreferrer'); })
                      .catch(() => window.open(coupleBase, '_blank', 'noopener noreferrer'));
                  }}
                  style={{
                    background: g.bg, borderRadius: 16, padding: '22px 18px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    border: `1.5px solid ${g.color}22`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{g.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{g.name}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: 'white', color: g.color, border: `1px solid ${g.color}44`,
                  }}>{g.tag}</span>
                </div>
              ))}
            </div>

            {/* 텍스트 */}
            <div>
              <div style={{
                display: 'inline-block', background: '#FFE4EE', color: '#E05A8A',
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              }}>Couple Insights</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>함께 성장하는<br /><span style={{ color: '#E05A8A' }}>마음커플</span></>, <>Grow together with<br /><span style={{ color: '#E05A8A' }}>Maumful Couple</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>BIG5 성격 검사를 기반으로 우리 둘의 궁합을 분석하고,<br />AI가 생성한 맞춤 관계 리포트로 더 깊이 이해하세요.</>, <>Analyze your compatibility based on BIG5 personality scores — and understand each other more deeply through AI-generated relationship reports.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '💕', text: 'BIG5 궁합 분석 — 성격 차이를 강점으로 전환' },
                  { icon: '🤖', text: 'AI 커플 리포트 — 파트너와 함께 분석 (무료)' },
                  { icon: '📊', text: '관계 건강도 체크인 — 월 1회 무료' },
                  { icon: '🗓️', text: '데이트 코스 추천 — 취향 기반 AI 개인화' },
                ], [
                  { icon: '💕', text: 'BIG5 Compatibility — Turn personality differences into strengths' },
                  { icon: '🤖', text: 'AI Couple Report — Analyze together with your partner (Free)' },
                  { icon: '📊', text: 'Relationship Check-In — Free, once a month' },
                  { icon: '🗓️', text: 'Date Ideas — AI-personalized for your tastes' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) { setView('memberLogin'); return; }
                  const h = window.location.hostname;
                  const coupleBase = (h.includes('workers.dev') || h.includes('-dev.'))
                    ? 'https://maumcouple-dev.limyj007.workers.dev'
                    : 'https://couple.maumful.com';
                  fetch('/api/couple-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
                    .then(r => r.json())
                    .then(data => { const t = data.success ? data.coupleToken : (localStorage.getItem('access_token') || ''); window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, '_blank', 'noopener noreferrer'); })
                    .catch(() => window.open(coupleBase, '_blank', 'noopener noreferrer'));
                }}
                style={{
                  background: '#E05A8A', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#C0456F'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#E05A8A'; e.currentTarget.style.transform = 'none'; }}
              >
                {tl('마음커플 시작하기 →', 'Start Maumful Couple →')}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: '#9A9A9A' }}>
                {tl('로그인 후 별도 로그인 없이 바로 이동합니다', 'No separate login needed — seamlessly linked after sign-in')}
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* ── 마음수달 ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#EEF5FD' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
            className="ai-grid">

            {/* 수달 카드 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {tl([
                { emoji: '🦦', name: '또또와 대화',     tag: '아이의 마음 친구',   color: '#3B6FB5', bg: '#E7F0FB' },
                { emoji: '🤖', name: '마음 읽어 전하기', tag: '부모님께 따뜻하게', color: '#9333EA', bg: '#F3E8FF' },
                { emoji: '📷', name: '표정 영상 분석',  tag: '기기 내·저장 안 함', color: '#0891B2', bg: '#E0F7FA' },
                { emoji: '🔒', name: '안전 설계',       tag: 'PIN·위기 안내',      color: '#16A34A', bg: '#E7F6EC' },
              ], [
                { emoji: '🦦', name: 'Talk with Otto',  tag: "A child's heart-friend", color: '#3B6FB5', bg: '#E7F0FB' },
                { emoji: '🤖', name: 'AI Emotion Read', tag: 'Coaching report for parents', color: '#9333EA', bg: '#F3E8FF' },
                { emoji: '📷', name: 'Facial Reading',  tag: 'On-device · not stored', color: '#0891B2', bg: '#E0F7FA' },
                { emoji: '🔒', name: 'Safe by Design',  tag: 'Parent PIN · crisis flags', color: '#16A34A', bg: '#E7F6EC' },
              ]).map(g => (
                <div key={g.name} onClick={openOtter}
                  style={{
                    background: g.bg, borderRadius: 16, padding: '22px 18px',
                    cursor: 'pointer', transition: 'all 0.2s', border: `1.5px solid ${g.color}22`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{g.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{g.name}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: 'white', color: g.color, border: `1px solid ${g.color}44`,
                  }}>{g.tag}</span>
                </div>
              ))}
            </div>

            {/* 텍스트 */}
            <div>
              <div style={{
                display: 'inline-block', background: '#E1EDFB', color: '#3B6FB5',
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              }}>Maumotter</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>아이의 속마음을 읽어 전하는<br /><span style={{ color: '#3B6FB5' }}>마음수달</span></>, <>Reading your child's heart<br /><span style={{ color: '#3B6FB5' }}>Maumotter</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>아이가 수달 친구 '또또'와 도란도란 이야기하면,<br />그 마음을 읽어 부모님이 이해·행동할 수 있는 따뜻한 코칭으로 전해 드려요.</>, <>When your child chats with the otter friend 'Otto',<br />we read their heart and share it as warm coaching parents can act on.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '🦦', text: '또또와 대화 — 아이가 편하게 속마음을 꺼내요' },
                  { icon: '🤖', text: '마음 읽어 전하기 — 부모님께 따뜻한 코칭으로' },
                  { icon: '📷', text: '표정 영상 — 기기 내 분석·저장 안 함' },
                  { icon: '🔒', text: '안전 설계 — 부모 PIN·위기 신호 안내' },
                ], [
                  { icon: '🦦', text: "Talk with Otto — kids open up comfortably" },
                  { icon: '🤖', text: 'AI Emotion Read — coaching report for parents' },
                  { icon: '📷', text: 'Facial Reading — analyzed on-device, not stored' },
                  { icon: '🔒', text: 'Safe by Design — parent PIN · crisis flags' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={openOtter}
                style={{
                  background: '#3B6FB5', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2F5C99'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#3B6FB5'; e.currentTarget.style.transform = 'none'; }}
              >
                {tl('마음수달 시작하기 →', 'Start Maumotter →')}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: '#9A9A9A' }}>
                {tl('로그인 시 별도 로그인 없이 바로 이동합니다 (마음수달은 별도 서비스예요)', 'Seamless single sign-on when logged in (Maumotter is a separate service)')}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 마음부부 ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#FDF6EC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="ai-grid">
            {/* 부부 카드 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {tl([
                { emoji: '💬', name: '대화 통역',       tag: '말 속 진짜 마음',   color: '#B45309', bg: '#FEF3C7' },
                { emoji: '🕊️', name: '싸움 중재',       tag: '갈등 대화 분석',   color: '#C2410C', bg: '#FFEDD5' },
                { emoji: '💗', name: '관점 바꿔보기',   tag: '상대 입장에서',     color: '#DB2777', bg: '#FCE7F3' },
                { emoji: '✝️', name: '심리·기독교 트랙', tag: '관점 선택 가능',   color: '#7C3AED', bg: '#F3E8FF' },
              ], [
                { emoji: '💬', name: 'Translate talk', tag: 'the real meaning',   color: '#B45309', bg: '#FEF3C7' },
                { emoji: '🕊️', name: 'Mediation',      tag: 'analyze conflicts', color: '#C2410C', bg: '#FFEDD5' },
                { emoji: '💗', name: 'Perspective',    tag: "partner's view",    color: '#DB2777', bg: '#FCE7F3' },
                { emoji: '✝️', name: 'Two tracks',     tag: 'psych & faith',     color: '#7C3AED', bg: '#F3E8FF' },
              ]).map(g => (
                <div key={g.name} onClick={openBubu}
                  style={{ background: g.bg, borderRadius: 16, padding: '22px 18px', cursor: 'pointer', transition: 'all 0.2s', border: `1.5px solid ${g.color}22` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{g.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{g.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'white', color: g.color, border: `1px solid ${g.color}44` }}>{g.tag}</span>
                </div>
              ))}
            </div>
            {/* 텍스트 */}
            <div>
              <div style={{ display: 'inline-block', background: '#FBE8C9', color: '#B45309', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20 }}>Maumful Bubu</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>부부의 말과 마음을 통역하는<br /><span style={{ color: '#B45309' }}>마음부부</span></>, <>Interpreting words &amp; hearts<br /><span style={{ color: '#B45309' }}>Maumful Bubu</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>같은 말도 서로 다르게 들리는 부부 사이,<br />말 속에 담긴 진짜 마음을 읽어 전하고 갈등을 중재해 드려요. 첫 3회는 무료예요.</>, <>Couples often hear the same words differently.<br />We read the real heart behind them and help mediate conflict. First 3 free.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '💬', text: '대화 통역 — 말 속에 담긴 진짜 마음을 읽어요' },
                  { icon: '🕊️', text: '싸움 중재 — 갈등이 된 대화를 함께 풀어요' },
                  { icon: '💗', text: '관점 바꿔보기 — 상대의 입장에서 다시 들어요' },
                  { icon: '✝️', text: '심리 상담·기독교 트랙 중 원하는 관점 선택' },
                ], [
                  { icon: '💬', text: 'Translate talk — read the real meaning behind words' },
                  { icon: '🕊️', text: 'Mediation — work through the conversation that hurt' },
                  { icon: '💗', text: 'Perspective — hear it again from their side' },
                  { icon: '✝️', text: 'Choose a psychology or Christian track' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={openBubu}
                style={{ background: '#B45309', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#92400E'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#B45309'; e.currentTarget.style.transform = 'none'; }}>
                {tl('마음부부 시작하기 →', 'Start Maumful Bubu →')}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: '#9A9A9A' }}>
                {tl('만 19세 이상 부부 대상 · 원문은 저장하지 않아요', 'For married couples 19+ · your words are not stored')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 마음세대 ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#ECFBFD' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="ai-grid">
            {/* 텍스트 */}
            <div>
              <div style={{ display: 'inline-block', background: '#CFF3F7', color: '#0E7490', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 20 }}>Maumful Sedae</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                {tl(<>부모와 자녀 사이를 잇는<br /><span style={{ color: '#0E7490' }}>마음세대</span></>, <>Bridging parent and child<br /><span style={{ color: '#0E7490' }}>Maumful Sedae</span></>)}
              </h2>
              <p style={{ fontSize: 16, color: '#5A5A5A', lineHeight: 1.8, marginBottom: 28 }}>
                {tl(<>세대가 다르면 같은 말도 다르게 닿아요.<br />부모와 자녀 사이에 놓인 말의 간극을 통역해 전해 드려요. 청소년은 무료로 이용해요.</>, <>Across generations, the same words land differently.<br />We interpret the gap between parent and child. Free for teens.</>)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {tl([
                  { icon: '🌿', text: '부모-자녀 통역 — 세대 사이 말의 간극을 읽어요' },
                  { icon: '🧒', text: '청소년 안전 우선 — 아이 보호가 언제나 먼저' },
                  { icon: '📨', text: '웹뷰 공유 — 앱 설치 없이 링크로 열람' },
                  { icon: '🤝', text: '가족 커뮤니티 — 성인 전용 방에서 함께 나눠요' },
                ], [
                  { icon: '🌿', text: 'Parent-child — read the generation gap in words' },
                  { icon: '🧒', text: 'Teen safety first — protecting the child always comes first' },
                  { icon: '📨', text: 'Web share — open via link, no app install' },
                  { icon: '🤝', text: 'Family community — adults-only rooms to talk' },
                ]).map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: '#5A5A5A' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={openSedae}
                style={{ background: '#0E7490', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0B5A70'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0E7490'; e.currentTarget.style.transform = 'none'; }}>
                {tl('마음세대 시작하기 →', 'Start Maumful Sedae →')}
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: '#9A9A9A' }}>
                {tl('청소년(만14~18)은 무료 · 아이 보호가 우선인 안전 설계', 'Free for teens (14–18) · safety-first for children')}
              </div>
            </div>
            {/* 세대 카드 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {tl([
                { emoji: '🌿', name: '부모-자녀 통역', tag: '세대 간 말의 간극', color: '#0E7490', bg: '#CFFAFE' },
                { emoji: '🧒', name: '청소년 안전 우선', tag: '보호가 먼저',       color: '#16A34A', bg: '#E7F6EC' },
                { emoji: '📨', name: '웹뷰로 공유',     tag: '앱 없이 열람',     color: '#2563EB', bg: '#E0EAFF' },
                { emoji: '🤝', name: '가족 커뮤니티',   tag: '성인 전용 방',     color: '#9333EA', bg: '#F3E8FF' },
              ], [
                { emoji: '🌿', name: 'Parent-child',   tag: 'the generation gap', color: '#0E7490', bg: '#CFFAFE' },
                { emoji: '🧒', name: 'Teen safety',    tag: 'protection first',   color: '#16A34A', bg: '#E7F6EC' },
                { emoji: '📨', name: 'Web share',      tag: 'no app needed',      color: '#2563EB', bg: '#E0EAFF' },
                { emoji: '🤝', name: 'Community',      tag: 'adults only',        color: '#9333EA', bg: '#F3E8FF' },
              ]).map(g => (
                <div key={g.name} onClick={openSedae}
                  style={{ background: g.bg, borderRadius: 16, padding: '22px 18px', cursor: 'pointer', transition: 'all 0.2s', border: `1.5px solid ${g.color}22` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{g.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{g.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'white', color: g.color, border: `1px solid ${g.color}44` }}>{g.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── 서비스 성격 고지 바 ──────────────────────────── */}
      <div style={{
        background: '#F0FDF4', borderTop: '1px solid #86EFAC', borderBottom: '1px solid #86EFAC',
        padding: '10px 24px', textAlign: 'center',
        fontSize: 12, color: '#166534',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <span>ℹ️</span>
        <span>
          {tl(
            <><strong>본 서비스는 자기이해 및 정보 제공 목적의 콘텐츠 서비스입니다.</strong>{' '}심리검사 결과와 AI 상담은 의료적 진단·치료를 대체하지 않습니다.{' '}마음이 힘드실 땐 상담 연결을 이용해 보세요.</>,
            <><strong>This service is for self-understanding and informational purposes only.</strong>{' '}Test results and AI counseling do not replace medical diagnosis or treatment.{' '}If you are struggling, please reach out for professional support.</>
          )}
        </span>
      </div>

      {/* ── 위기상담 안내 바 ─────────────────────────────── */}
      <div style={{
        background: '#FFF8E1', borderTop: '1px solid #F4A261',
        padding: '10px 24px', textAlign: 'center',
        fontSize: 13, color: '#854D0E',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <span>🆘</span>
        <strong>{tl('자살예방상담전화', 'Suicide Prevention Hotline')} 109</strong>
        <span>·</span>
        <strong>{tl('정신건강위기상담전화', 'Mental Health Crisis Line')} 1577-0199</strong>
        <span>—</span>
        <span>{tl('24시간 무료 · 보건복지부', '24/7 Free · Ministry of Health and Welfare (Korea)')}</span>
      </div>

      {/* ── 함께하면 좋은 서비스 (패밀리 사이트) ──────────── */}
      <section style={{ background: '#FAFAF7', padding: '36px 24px', borderTop: '1px solid #ECEAE3' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#2C2C2C', marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {tl('함께하면 좋은 마음 서비스', 'Related Services')}
          </h3>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#8A8A82', marginBottom: 22 }}>
            {tl('마음풀과 함께 이용하면 좋은 서비스들이에요', 'Services that pair well with Maumful')}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { emoji: '✝️', name: 'The Light of Life', desc: tl('성경적 상담·심리검사', 'Biblical counseling & assessments'), url: 'https://jesusmaum.com', domain: 'jesusmaum.com', accent: '#0F2044' },
              { emoji: '🐾', name: tl('마음곁', 'Maumgyeot'), desc: tl('반려동물 마음 읽어 전하기', "Read your pet's feelings"), url: 'https://maumgyeot.com', domain: 'maumgyeot.com', accent: '#2E8B7A' },
              { emoji: '🏢', name: 'phyweb', desc: tl('기업·기관 전문 심리검사', 'Assessments for organizations'), url: 'https://phyweb.pages.dev', domain: 'phyweb.pages.dev', accent: '#2E7D6B' },
            ].map(s => (
              <a key={s.domain} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ flex: '1 1 230px', maxWidth: 280, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'white', border: '1px solid #ECEAE3', borderRadius: 14, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: s.accent + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{s.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2C', fontFamily: "'Noto Sans KR', sans-serif" }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: '#8A8A82', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.desc}</div>
                  <div style={{ fontSize: 11, color: s.accent, marginTop: 3, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.domain} →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="landing-footer" style={{ background: '#141414', color: 'rgba(255,255,255,0.55)', padding: '56px 40px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}
            className="footer-grid">
            <div>
              <div style={{
                fontSize: 20, fontWeight: 700, color: 'white',
                marginBottom: 12, fontFamily: "'Noto Sans KR', sans-serif",
              }}>🌿 마음풀</div>
              <p style={{ fontSize: 13, lineHeight: 1.8 }}>{tl(<>나를 이해하는 첫걸음.<br />전문 심리검사와 AI 상담을 한 곳에서.</>, <>Your journey to self-understanding.<br />Assessments &amp; AI counseling in one place.</>)}</p>
            </div>
            {tl([
              {
                title: '심리검사',
                links: ['PHQ-9 우울 자가점검', 'GAD-7 불안', 'DASS-21', 'Big5 성격', '전체 검사 보기'],
              },
              {
                title: '서비스',
                links: ['AI 상담', '마음 게임', '마음커플', '크레딧 충전'],
              },
              {
                title: '고객지원',
                links: ['이용약관', '개인정보처리방침', 'FAQ', '문의하기'],
              },
            ], [
              {
                title: 'Assessments',
                links: ['PHQ-9 Depression', 'GAD-7 Anxiety', 'DASS-21', 'Big5 Personality', 'View All Assessments'],
              },
              {
                title: 'Services',
                links: ['AI Counseling', 'Healing Games', 'Maumful Couple', 'Buy Credits'],
              },
              {
                title: 'Support',
                links: ['Terms of Service', 'Privacy Policy', 'FAQ', 'Contact Us'],
              },
            ]).map(col => (
              <div key={col.title}>
                <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{col.title}</h4>
                {col.links.map(l => (
                  <div key={l} style={{ marginBottom: 9 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                      onClick={() => {
                        if (l === '이용약관' || l === 'Terms of Service') setView('terms');
                        if (l === '개인정보처리방침' || l === 'Privacy Policy') setView('privacy');
                        if (l === '어드민') setView('counselingAdmin');
                        if (l === '마음커플') {
                          if (!isLoggedIn) { setView('memberLogin'); return; }
                          const h = window.location.hostname;
                          const coupleBase = (h.includes('workers.dev') || h.includes('-dev.'))
                            ? 'https://maumcouple-dev.limyj007.workers.dev'
                            : 'https://couple.maumful.com';
                          fetch('/api/couple-token', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') } })
                            .then(r => r.json())
                            .then(data => { window.open(`${coupleBase}?t=${encodeURIComponent(data.coupleToken || '')}`, '_blank', 'noopener noreferrer'); })
                            .catch(() => window.open(coupleBase, '_blank', 'noopener noreferrer'));
                        }
                      }}
                    >{l}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <MfSnsFooter tl={tl} />
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24, fontSize: 11,
            color: 'rgba(255,255,255,0.35)', lineHeight: 1.9,
          }}>
            <p style={{ marginBottom: 6 }}>
              본 서비스는 자기이해 및 정보 제공 목적의 콘텐츠 서비스입니다. 심리검사 결과 및 AI 상담은 의료적 진단·치료를 대체하지 않습니다. 마음이 많이 힘드실 땐 아래 무료 상담을 이용해 보세요. 자살예방상담전화 109 · 정신건강위기상담전화 1577-0199 (24시간)
            </p>
            <p style={{ marginBottom: 4 }}>
              상호: 마음서비스 · 대표자: 김근혜 · 사업자등록번호: 780-31-01832 · 통신판매업 신고번호: 제 2026-서울영등포-1157 호
            </p>
            <p style={{ marginBottom: 6 }}>
              사업장: 서울특별시 영등포구 문래로26길 6, 102동 1603호 (문래동3가) · 이메일: support@maumful.com · 연락처: 050-6789-0845
            </p>
            <p style={{ marginBottom: 6 }}>
              개인정보 침해신고: 개인정보보호위원회 182 · 호스팅: Cloudflare, Inc.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <span>© 2026 마음서비스(마음풀). All rights reserved.</span>
              <button onClick={() => setView('admin')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>{tl('관리자', 'Admin')}</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// TestsIntroPage — 검사 소개 상세 페이지
// ============================================================
function TestsIntroPage({ setView, isLoggedIn, lang }) {
  const tl = (ko, en) => lang === 'en' ? en : ko;
  const { useState: useS } = React;
  const [selected, setSelected] = useS(null);

  const tm = selected !== null ? TEST_META[selected] : null;
  const c = tm ? COLOR_MAP[tm.color] : null;

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: '#FAFAF8', minHeight: '100vh' }}>
      {/* 페이지 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #F0FAF4, #FAFAF8)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '60px 24px 48px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: '#D8F3DC', color: '#2D6A4F',
          fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', padding: '5px 14px', borderRadius: 100, marginBottom: 16,
        }}>Psychological Tests</div>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 14 }}>
          {tl(<>심리검사 <span style={{ color: '#2D6A4F' }}>소개</span></>, <>Assessment <span style={{ color: '#2D6A4F' }}>Overview</span></>)}
        </h1>
        <p style={{ fontSize: 16, color: '#5A5A5A', maxWidth: 480, margin: '0 auto' }}>
          {tl("각 검사를 선택하면 상세 정보를 확인할 수 있습니다", "Select an assessment to view detailed information")}
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}
        className="intro-grid">
        {/* 검사 목록 */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TEST_META.map((test, i) => {
              const cc = COLOR_MAP[test.color];
              const isActive = selected === i;
              return (
                <div
                  key={test.id}
                  onClick={() => setSelected(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                    background: isActive ? cc.bg : 'white',
                    border: isActive ? `2px solid ${cc.bar}` : '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = cc.bar + '66'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                    background: cc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 24,
                    border: `2px solid ${cc.bar}33`,
                  }}>{test.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{tl(test.name, test.nameEn)}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: test.free ? '#D8F3DC' : '#FFF0E6',
                        color: test.free ? '#1A6B3C' : '#C05621',
                      }}>{test.free ? tl('무료', 'Free') : tl('10 크레딧', '10 Credits')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9A9A9A' }}>
                      {test.label} · {tl(test.time, test.timeEn)} · {tl(test.count, test.countEn)}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: isActive ? cc.bar : '#CACACA' }}>›</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 검사 상세 패널 */}
        <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          {!tm ? (
            <div style={{
              background: 'white', borderRadius: 20, padding: '60px 40px',
              border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center',
              color: '#9A9A9A',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👆</div>
              <p style={{ fontSize: 15 }}>{tl(<>왼쪽에서 검사를 선택하면<br />상세 정보를 확인할 수 있습니다</>, <>Select an assessment on the left<br />to view detailed information</>)}</p>
            </div>
          ) : (
            <div style={{
              background: 'white', borderRadius: 20,
              border: `1px solid ${c.bar}33`,
              overflow: 'hidden',
            }}>
              <div style={{
                background: c.bg, padding: '32px 32px 28px',
                borderBottom: `1px solid ${c.bar}22`,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{tm.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.bar, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>{tm.label}</div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>{tl(tm.name, tm.nameEn)}</h2>
                <p style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.7 }}>{tl(tm.desc, tm.descEn)}</p>
              </div>

              <div style={{ padding: '24px 32px' }}>
                {/* 기본 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: tl('소요 시간', 'Duration'), value: tl(tm.time, tm.timeEn) },
                    { label: tl('문항 수', 'Items'), value: tl(tm.count, tm.countEn) },
                    { label: tl('비용', 'Cost'), value: tm.free ? tl('무료', 'Free') : tl('10 크레딧', '10 Credits') },
                  ].map(info => (
                    <div key={info.label} style={{
                      background: '#F9F9F7', borderRadius: 10, padding: '14px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 12, color: '#9A9A9A', marginBottom: 4 }}>{info.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{info.value}</div>
                    </div>
                  ))}
                </div>

                {/* 측정 영역 */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#1A1A1A' }}>📌 {tl("측정 영역", "What It Measures")}</h4>
                  <div style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.75, background: '#F9F9F7', borderRadius: 10, padding: '14px 16px' }}>
                    {tm.id === 'PHQ9' && tl('우울한 기분 · 흥미/즐거움 감소 · 수면 변화 · 피로감 · 식욕 변화 · 자기비난 · 집중력 · 정신운동 변화 · 자살사고', 'Depressed mood · Loss of interest · Sleep changes · Fatigue · Appetite changes · Self-blame · Concentration · Psychomotor changes · Suicidal thoughts')}
                    {tm.id === 'GAD7' && tl('불안감 · 걱정 조절 어려움 · 여러 걱정 · 긴장감 · 안절부절 · 과민함 · 나쁜 일에 대한 두려움', 'Anxiety · Uncontrollable worry · Multiple worries · Tension · Restlessness · Irritability · Fear of something bad happening')}
                    {tm.id === 'DASS21' && tl('우울(D) — 무기력·절망·자기비하 / 불안(A) — 자율신경 각성·상황불안 / 스트레스(S) — 만성적 각성·긴장', 'Depression (D) — hopelessness, self-deprecation / Anxiety (A) — autonomic arousal, situational anxiety / Stress (S) — chronic arousal, tension')}
                    {tm.id === 'BIG5' && tl('개방성(O) · 성실성(C) · 외향성(E) · 친화성(A) · 신경증(N) — 5가지 성격 핵심 차원', 'Openness (O) · Conscientiousness (C) · Extraversion (E) · Agreeableness (A) · Neuroticism (N) — 5 core personality dimensions')}
                    {tm.id === 'LOST' && tl('에너지 방향 · 의사결정 방식 · 행동 속도 · 안정성 · 관계 민감도 · 스트레스 반응 — 6가지 축으로 16가지 행동유형을 파악합니다', 'Energy direction · Decision style · Action speed · Stability · Relationship sensitivity · Stress response — identifies 16 behavioral types across 6 axes')}
                    {tm.id === 'SCT' && tl('자기입장 유지 · 정서반응성 · 정서적 단절 · 융합·관계의존 등 4개 영역의 자기반응 패턴을 문장완성으로 탐색합니다', 'Explores 4 domains of self-response patterns through sentence completion: self-position, emotional reactivity, emotional cutoff, and fusion/dependency')}
                    {tm.id === 'DSI' && tl('자기입장 유지 · 정서반응성 · 정서적 단절 · 융합·관계의존 — 4개 소척도 평정형 25문항으로 자기분화 수준을 측정합니다', 'Self-position · Emotional reactivity · Emotional cutoff · Fusion/dependency — 4 subscales, 25 rating items measuring self-differentiation')}
                    {tm.id === 'BURNOUT' && tl('정서적 고갈 · 냉소 · 효능감 저하 3가지 소진 신호 자가점검 — 직장인·교육·서비스직 특화', 'Emotional exhaustion · Cynicism · Reduced efficacy — 3 burnout signals, specialized for workers, educators, and service professionals')}
                    {tm.id === 'RIASEC' && tl('실재형(R) · 탐구형(I) · 예술형(A) · 사회형(S) · 진취형(E) · 관습형(C) — 6가지 Holland 유형별 점수와 우세 직업 흥미 코드(2자리)를 도출합니다', 'Realistic (R) · Investigative (I) · Artistic (A) · Social (S) · Enterprising (E) · Conventional (C) — scores for all 6 Holland types, with a 2-letter dominant career code')}
                    {tm.id === 'VALUES' && tl('성취 · 봉사 · 안정 · 자율 · 창의 · 영향력 · 지식추구 · 워라밸 · 사회인정 · 경제적 보상 — 10가지 가치요인의 중요도를 100점 척도로 환산해 순위를 제시합니다', 'Achievement · Service · Stability · Autonomy · Creativity · Influence · Knowledge · Work-Life Balance · Social Recognition · Economic Reward — 10 value factors ranked on a 100-point scale')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const FREE = ['PHQ9', 'GAD7'];
                    if (!isLoggedIn && !FREE.includes(tm.id)) {
                      setView('memberSignup'); return;
                    }
                    setView('startTest:' + tm.id);
                  }}
                  style={{
                    width: '100%', padding: '14px 0',
                    background: c.bar, color: 'white', border: 'none',
                    borderRadius: 12, fontSize: 16, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {tl(tm.name, tm.nameEn)} {tl("시작하기", "Start")} {tm.free ? tl('(무료)', '(Free)') : '→'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
