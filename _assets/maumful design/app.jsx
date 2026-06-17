/* global React, ReactDOM */
const { useState } = React;

// ── Tiny inline icons (1.5 stroke, 24x24) ──────────────────────────
const Icon = ({ name, size = 18, stroke = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'arrow':   return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'check':   return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
    case 'clock':   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'doc':     return <svg {...props}><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5"/></svg>;
    case 'shield':  return <svg {...props}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'spark':   return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'users':   return <svg {...props}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.5-3.3 3-5.2 6-5.2s5.5 1.9 6 5.2"/><circle cx="17" cy="9" r="2.5"/><path d="M21 19c-.3-2.4-2-3.8-4-3.8"/></svg>;
    case 'send':    return <svg {...props}><path d="M5 12l14-7-5 14-2.5-5.5L5 12z"/></svg>;
    case 'star':    return <svg {...props} fill="currentColor" stroke="none"><path d="M12 4l2.4 5 5.6.8-4 4 1 5.5-5-2.6-5 2.6 1-5.5-4-4 5.6-.8L12 4z"/></svg>;
    case 'lock':    return <svg {...props}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>;
    case 'leaf':    return <svg {...props}><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15-1 0-1-.5-1-1z"/><path d="M5 19c4-4 7-7 11-10"/></svg>;
    default: return null;
  }
};

// ── Header ─────────────────────────────────────────────────────────
const Header = () => (
  <header className="site-header">
    <div className="container site-header__inner">
      <div className="site-header__brand">
        <img src="logo.svg" alt="마음풀" height="38" />
        <span className="site-header__beta">BETA</span>
      </div>
      <nav className="site-header__nav">
        <a href="#tests">심리검사</a>
        <a href="#ai">AI 상담</a>
        <a href="#counselors">상담 예약</a>
        <a href="#games">마음 게임</a>
        <a href="#couples">마음커플</a>
      </nav>
      <div className="row gap-2">
        <span className="pill"><Icon name="spark" size={12}/>90 크레딧</span>
        <button className="btn btn--primary btn--sm">시작하기</button>
      </div>
    </div>
  </header>
);

// ── Hero ───────────────────────────────────────────────────────────
const Hero = () => (
  <section className="hero">
    <div className="container hero__grid">
      <div>
        <span className="pill"><span className="dot" style={{background:'var(--green-500)'}}/> 전문 심리검사 8종 · 누구나 무료로</span>
        <h1 className="hero__title mt-6">
          오늘의 마음,<br/>
          <span className="accent">조용히 들여다볼</span><br/>
          <span className="underline">시간이 필요해요.</span>
        </h1>
        <p className="hero__sub">
          임상에서 검증된 표준 심리검사와 따뜻한 AI 상담이 만나는 곳.
          마음풀에서 나의 결과를 깊이 이해하고, 다음 한 걸음을 함께 그려보세요.
        </p>
        <div className="hero__cta">
          <button className="btn btn--primary btn--lg">무료로 시작하기 <Icon name="arrow"/></button>
          <button className="btn btn--outline btn--lg">검사 둘러보기</button>
        </div>
        <div className="hero__stats">
          <div>
            <div className="hero__stat-num num">128,400+</div>
            <div className="hero__stat-label">전체 가입자 수</div>
          </div>
          <div>
            <div className="hero__stat-num num">412,000+</div>
            <div className="hero__stat-label">누적 검사 횟수</div>
          </div>
          <div>
            <div className="hero__stat-num num">4.9<small style={{fontSize:14,color:'var(--fg-3)',fontWeight:500,marginLeft:3}}>/5</small></div>
            <div className="hero__stat-label">사용자 만족도</div>
          </div>
        </div>
      </div>

      <div className="hero__visual">
        <div className="hero__sheet">
          <div className="hero__sheet-hd">
            <Icon name="doc" size={16} stroke="var(--green-600)" />
            <span className="hero__sheet-hd-title">심리검사 선택 · 8종</span>
            <span className="spacer"/>
            <span className="caption">3분만에 첫 결과</span>
          </div>

          <div className="test-row active">
            <div className="test-row__icon" style={{background:'var(--green-100)'}}>🌱</div>
            <div>
              <div className="test-row__title">우울 자가점검 · PHQ-9</div>
              <div className="test-row__meta">5분 · 9문항 · 임상 표준</div>
            </div>
            <span className="pill pill--free test-row__price">무료</span>
          </div>
          <div className="test-row">
            <div className="test-row__icon" style={{background:'var(--sky-100)'}}>💙</div>
            <div>
              <div className="test-row__title">불안 자가점검 · GAD-7</div>
              <div className="test-row__meta">5분 · 7문항 · WHO 권장</div>
            </div>
            <span className="pill pill--free test-row__price">무료</span>
          </div>
          <div className="test-row">
            <div className="test-row__icon" style={{background:'var(--lav-100)'}}>🧠</div>
            <div>
              <div className="test-row__title">성격 5요인 · BIG5</div>
              <div className="test-row__meta">15분 · 60문항 · 종합 분석</div>
            </div>
            <span className="pill pill--paid test-row__price">10 크레딧</span>
          </div>
          <div className="test-row">
            <div className="test-row__icon" style={{background:'var(--gold-100)'}}>🔥</div>
            <div>
              <div className="test-row__title">번아웃 자가점검 · K-MBI+</div>
              <div className="test-row__meta">10분 · 22문항 · 직장인 특화</div>
            </div>
            <span className="pill pill--paid test-row__price">10 크레딧</span>
          </div>

          <button className="btn btn--ghost mt-4" style={{width:'100%'}}>
            전체 검사 8종 보기 <Icon name="arrow" size={14}/>
          </button>
        </div>

        <div className="hero__float-tag" style={{top:'-12px', right:'24px'}}>
          <span style={{width:24,height:24,borderRadius:6,background:'var(--green-100)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'var(--green-700)'}}><Icon name="check" size={14}/></span>
          <div>
            <div style={{fontWeight:700,fontSize:13,letterSpacing:'-0.01em'}}>PHQ-9 완료</div>
            <div style={{fontSize:11,color:'var(--fg-3)'}}>점수: 경도</div>
          </div>
        </div>
        <div className="hero__float-tag" style={{bottom:'-14px', left:'-8px'}}>
          <span style={{width:24,height:24,borderRadius:'50%',background:'var(--gold-200)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>🤖</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,letterSpacing:'-0.01em'}}>AI 결과 분석 준비 완료</div>
            <div style={{fontSize:11,color:'var(--fg-3)'}}>검사 후 바로 상담 시작</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Why marks (trust band) ─────────────────────────────────────────
const Why = () => (
  <section className="section" style={{paddingTop:64,paddingBottom:64}}>
    <div className="container">
      <div className="section__header" style={{marginBottom:40}}>
        <span className="eyebrow">WHY 마음풀</span>
        <h2 className="display-md mt-3">신뢰할 수 있는 <span style={{color:'var(--green-600)'}}>심리검사</span>가 필요한 이유</h2>
      </div>
      <div className="why-grid">
        <div className="why-card">
          <div className="why-card__icon" style={{background:'var(--green-100)',color:'var(--green-700)'}}><Icon name="doc" size={20}/></div>
          <h3 className="h3">임상 표준화 검사</h3>
          <p className="body mt-2">PHQ-9, GAD-7 등 실제 병원·상담센터에서 사용하는 국제 표준 도구를 동일하게 제공합니다.</p>
        </div>
        <div className="why-card">
          <div className="why-card__icon" style={{background:'var(--lav-100)',color:'var(--lav-600)'}}><Icon name="spark" size={20}/></div>
          <h3 className="h3">AI 결과 해석 상담</h3>
          <p className="body mt-2">검사 완료 후 AI가 결과를 1:1 대화로 풀어 설명합니다. 단순 점수를 넘어선 인사이트를 제공합니다.</p>
        </div>
        <div className="why-card">
          <div className="why-card__icon" style={{background:'var(--gold-100)',color:'var(--gold-700)'}}><Icon name="lock" size={20}/></div>
          <h3 className="h3">완전한 프라이버시</h3>
          <p className="body mt-2">결과는 본인 계정에만 저장됩니다. 개인 식별 정보와 분리 보관해 익명성을 보장합니다.</p>
        </div>
      </div>
    </div>
  </section>
);

// ── Tests Grid ─────────────────────────────────────────────────────
const Tests = () => {
  const tests = [
    { tone:'green', code:'PHQ-9',  emoji:'🌱', title:'우울 자가점검', desc:'지난 2주간 정서 상태를 9개 문항으로 가볍게 체크합니다. 임상 표준 도구.', time:'5분', q:'9문항', price:'무료' },
    { tone:'blue',  code:'GAD-7',  emoji:'💙', title:'불안 자가점검', desc:'7개 문항으로 불안과 긴장 수준을 빠르게 점검합니다. WHO 권장 도구.', time:'5분', q:'7문항', price:'무료' },
    { tone:'gold',  code:'DASS-21',emoji:'🌊', title:'우울·불안·스트레스', desc:'세 가지 정서 상태를 동시에 측정하는 종합 정서 검사입니다.', time:'10분', q:'21문항', price:'10 크레딧' },
    { tone:'lav',   code:'BIG5',   emoji:'🧠', title:'성격 5요인 검사', desc:'개방성·성실성·외향성·친화성·신경증 5개 차원을 과학적으로 분석합니다.', time:'15분', q:'60문항', price:'10 크레딧' },
    { tone:'gold',  code:'LOST',   emoji:'🧭', title:'행동 운영체계 검사', desc:'나의 행동 패턴과 동기 시스템(BIS/BAS)을 파악해 일상 행동을 이해합니다.', time:'10분', q:'24문항', price:'10 크레딧' },
    { tone:'pink',  code:'SRCI',   emoji:'🎯', title:'자기반응 완성 검사', desc:'갈등·압박 상황에서 나타나는 자기입장, 정서반응, 관계 패턴을 탐색합니다.', time:'20분', q:'25문항', price:'10 크레딧' },
    { tone:'lav',   code:'SDRI',   emoji:'💎', title:'자기분화 반응성 검사', desc:'자기입장 유지·정서반응성·정서적 단절·융합 등 4개 소척도로 평정합니다.', time:'15분', q:'25문항', price:'10 크레딧' },
    { tone:'gold',  code:'K-MBI+', emoji:'🔥', title:'번아웃 자가점검', desc:'정서적 고갈, 냉소, 효능감 3가지 신호를 체크합니다. 직장인·의료진 특화.', time:'10분', q:'22문항', price:'10 크레딧' },
  ];
  return (
    <section id="tests" className="section section--soft">
      <div className="container">
        <div className="section__header">
          <span className="eyebrow">PSYCHOLOGICAL TESTS</span>
          <h2 className="display-lg mt-3">8종의 검사로 <span style={{color:'var(--green-600)'}}>마음의 지도</span>를 그립니다</h2>
          <p className="body-lg">무료 진단부터 시작해 깊이 있는 검사로 천천히 옮겨가세요. 모든 결과는 AI 해석과 함께 제공됩니다.</p>
        </div>
        <div className="test-grid">
          {tests.map(t => (
            <div key={t.code} className={`test-card t-${t.tone}`}>
              <span className="test-card__accent"/>
              <div className="test-card__top">{t.emoji}</div>
              <div className="test-card__code">{t.code}</div>
              <div className="test-card__title">{t.title}</div>
              <p className="test-card__desc">{t.desc}</p>
              <div className="test-card__foot">
                <span className="test-card__meta"><Icon name="clock" size={12}/> {t.time} · {t.q}</span>
                <span className={`pill ${t.price==='무료'?'pill--free':'pill--paid'}`}>{t.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── AI Counseling ──────────────────────────────────────────────────
const AICounseling = () => {
  const [mode, setMode] = useState('일반');
  return (
    <section id="ai" className="section ai-section">
      <div className="container ai-grid">
        <div>
          <span className="eyebrow">AI COUNSELING</span>
          <h2 className="display-lg mt-3">검사 결과,<br/>AI와 함께 <span style={{color:'var(--gold-400)'}}>이해하세요.</span></h2>
          <p className="body-lg mt-4" style={{color:'var(--fg-on-dark-2)'}}>
            단순한 점수 확인을 넘어, 내 결과의 의미와 앞으로의 방향을 대화로 탐색합니다.
            상담 모드를 골라 시작해 보세요.
          </p>
          <div className="mt-6 mode-tabs">
            {['일반','성경적'].map(m => (
              <button key={m} className={`mode-tab ${mode===m?'active':''}`} onClick={()=>setMode(m)}>
                {m==='일반' ? '🌿 일반 상담' : '✦ 성경적 상담'}
              </button>
            ))}
          </div>
          <div className="mt-6 row gap-2" style={{flexWrap:'wrap'}}>
            <span className="flow-pill"><span className="dot"/> 결과 해석</span>
            <span className="flow-pill"><span className="dot"/> 감정 탐색</span>
            <span className="flow-pill"><span className="dot"/> 대처 방법</span>
            <span className="flow-pill"><span className="dot"/> 추가 검사 추천</span>
          </div>
          <button className="btn btn--gold btn--lg mt-8">AI 상담 체험하기 <Icon name="arrow"/></button>
          <p className="caption mt-4" style={{color:'var(--fg-on-dark-2)'}}>
            PHQ-9 우울 검사 (무료) → 결과 확인 → AI 상담
          </p>
        </div>

        <div className="chat-card">
          <div className="chat-hd">
            <div className="chat-hd__avatar">풀</div>
            <div>
              <div className="chat-hd__name">마음이 · {mode==='일반'?'AI 일반 상담':'AI 성경적 상담'}</div>
              <div className="chat-hd__status"><span className="dot" style={{background:'#5BA886'}}/> 온라인</div>
            </div>
          </div>
          <div className="chat-msg chat-msg--bot">
            {mode==='일반'
              ? 'PHQ-9 결과를 확인했어요. 중등도 수준의 우울 신호가 보이는데, 특히 수면과 집중력 부분이 눈에 띄네요. 이 부분 좀 더 이야기해 볼까요?'
              : 'PHQ-9 결과를 함께 살펴봤어요. 마음이 무거우신 시간이 길었나 봅니다. "수고하고 무거운 짐 진 자들아 다 내게로 오라" — 오늘 어떤 부분부터 이야기해 볼까요?'}
          </div>
          <div className="chat-msg chat-msg--user">네, 요즘 잠을 잘 못 자고 있어요.</div>
          <div className="chat-msg chat-msg--bot">수면 어려움이 시작된 시점을 알 수 있을까요? 최근 특별히 스트레스받는 일이 있었나요?</div>
          <div className="chat-input">
            <input placeholder="메시지를 입력하세요..." readOnly/>
            <button className="chat-input__send"><Icon name="send" size={14}/></button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Healing Games ──────────────────────────────────────────────────
const Games = () => {
  const games = [
    { tone:'garden',  emoji:'🌿', name:'마음의 정원', sub:'매일 출석으로 식물을 키워요', tag:'무료' },
    { tone:'water',   emoji:'💧', name:'물 한잔 명상', sub:'1분 호흡으로 마음을 가라앉혀요', tag:'무료' },
    { tone:'breathe', emoji:'🌬️', name:'호흡의 리듬', sub:'4-7-8 패턴 호흡 가이드', tag:'무료' },
    { tone:'journal', emoji:'📓', name:'감정 일기', sub:'하루 한 줄, 마음을 기록해요', tag:'무료' },
  ];
  return (
    <section id="games" className="section">
      <div className="container">
        <div className="section__header">
          <span className="eyebrow">HEALING GAMES · 마음 게임</span>
          <h2 className="display-lg mt-3">하루 3분, <span style={{color:'var(--green-600)'}}>나를 돌보는</span> 작은 루틴</h2>
          <p className="body-lg">검사만으로는 부족할 때, 일상 속 작은 회복을 도와주는 4가지 게임을 무료로 제공합니다.</p>
        </div>
        <div className="games-grid">
          {games.map(g => (
            <div key={g.name} className={`game-card g-${g.tone}`}>
              <div>
                <span className="game-card__emoji">{g.emoji}</span>
                <div className="game-card__name">{g.name}</div>
                <div className="game-card__sub">{g.sub}</div>
              </div>
              <span className="pill pill--ghost game-card__tag">{g.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Couples ────────────────────────────────────────────────────────
const Couples = () => (
  <section id="couples" className="section couples-section">
    <div className="container couples-grid">
      <div className="couples-tile-grid">
        <div className="couples-tile t-rose">
          <div>
            <span className="couples-tile__emoji">💕</span>
            <div className="couples-tile__name">BIG5 궁합 분석</div>
            <div className="couples-tile__sub">성격 차이를 강점으로</div>
          </div>
          <span className="pill pill--rose" style={{alignSelf:'flex-start'}}>무료</span>
        </div>
        <div className="couples-tile t-lav">
          <div>
            <span className="couples-tile__emoji">🤖</span>
            <div className="couples-tile__name">AI 커플 리포트</div>
            <div className="couples-tile__sub">맞춤 관계 인사이트</div>
          </div>
          <span className="pill pill--lav" style={{alignSelf:'flex-start'}}>3 크레딧</span>
        </div>
        <div className="couples-tile t-sky">
          <div>
            <span className="couples-tile__emoji">📊</span>
            <div className="couples-tile__name">관계 건강도 체크인</div>
            <div className="couples-tile__sub">월 1회 무료 진단</div>
          </div>
          <span className="pill" style={{alignSelf:'flex-start',background:'var(--sky-50)',color:'var(--sky-500)',borderColor:'var(--sky-100)'}}>월 1회</span>
        </div>
        <div className="couples-tile t-gold">
          <div>
            <span className="couples-tile__emoji">📅</span>
            <div className="couples-tile__name">데이트 코스 추천</div>
            <div className="couples-tile__sub">취향 기반 AI 개인화</div>
          </div>
          <span className="pill pill--gold" style={{alignSelf:'flex-start'}}>AI 추천</span>
        </div>
      </div>

      <div>
        <span className="eyebrow">COUPLE INSIGHTS</span>
        <h2 className="display-lg mt-3">함께 성장하는<br/><span style={{color:'var(--rose-600)'}}>마음커플</span></h2>
        <p className="body-lg mt-4">
          BIG5 성격 검사를 기반으로 우리 둘의 궁합을 분석하고, AI가 생성한
          맞춤 관계 리포트로 더 깊이 이해하세요.
        </p>
        <ul className="couples-list">
          <li><span><b>BIG5 궁합 분석</b> — 성격 차이를 강점으로 전환</span></li>
          <li><span><b>AI 커플 리포트</b> — 파트너와 함께 분석 (무료 시작)</span></li>
          <li><span><b>관계 건강도 체크인</b> — 월 1회 무료 진단</span></li>
          <li><span><b>데이트 코스 추천</b> — 취향 기반 AI 개인화</span></li>
        </ul>
        <button className="btn btn--rose btn--lg">마음커플 시작하기 <Icon name="arrow"/></button>
        <p className="caption mt-4">로그인 후 별도 가입 없이 바로 이용됩니다</p>
      </div>
    </div>
  </section>
);

// ── Counselor Booking ──────────────────────────────────────────────
const Counselors = () => {
  const counselors = [
    { initial:'이', accent:'', name:'이서연 상담사', title:'임상심리전문가 · 가족치료', tags:['우울/불안','관계','30대 여성'], bio:'10년 이상 종합병원에서 우울·불안 환자를 만나왔습니다. 함께 천천히 이야기해요.', price:'80,000', rating:'4.9', avail:'오늘 19:00' },
    { initial:'박', accent:'a-lav', name:'박지훈 상담사', title:'정신건강임상 · 인지행동치료', tags:['번아웃','직장','CBT'], bio:'직장인 번아웃과 직무 스트레스 케이스를 주로 다룹니다. CBT 기반 단기 상담.', price:'95,000', rating:'4.8', avail:'내일 14:00' },
    { initial:'정', accent:'a-gold', name:'정민서 상담사', title:'커플·관계 상담 전문', tags:['커플','관계','청년'], bio:'BIG5 궁합 결과를 함께 풀어내며 관계의 패턴을 입체적으로 이해해 드립니다.', price:'110,000', rating:'5.0', avail:'금요일 11:00' },
  ];
  return (
    <section id="counselors" className="section section--soft">
      <div className="container">
        <div className="section__header">
          <span className="eyebrow">PROFESSIONAL COUNSELORS</span>
          <h2 className="display-lg mt-3">검증된 <span style={{color:'var(--green-600)'}}>전문 상담사</span>와 1:1로 이야기해요</h2>
          <p className="body-lg">자격 검증을 마친 임상 전문가와 화상·음성·채팅 상담을 예약할 수 있습니다.</p>
        </div>
        <div className="counselor-grid">
          {counselors.map(c => (
            <div key={c.name} className="counselor-card">
              <div className="counselor-card__top">
                <div className={`counselor-card__avatar ${c.accent}`}>{c.initial}</div>
                <div>
                  <div className="counselor-card__name">{c.name}</div>
                  <div className="counselor-card__title">{c.title}</div>
                </div>
              </div>
              <p className="counselor-card__bio">{c.bio}</p>
              <div className="counselor-card__tags">
                {c.tags.map(t => <span key={t} className="pill pill--ghost">{t}</span>)}
              </div>
              <div className="counselor-card__foot">
                <div>
                  <div className="counselor-card__price"><span className="num">{c.price}</span><small>원 / 50분</small></div>
                  <div className="counselor-card__rating mt-1">
                    <span style={{color:'var(--gold-500)'}}><Icon name="star" size={12}/></span>
                    <span className="num">{c.rating}</span> · 다음 가능 {c.avail}
                  </div>
                </div>
                <button className="btn btn--primary btn--sm">예약 <Icon name="arrow" size={14}/></button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="btn btn--outline">전체 상담사 둘러보기 <Icon name="arrow" size={14}/></button>
        </div>
      </div>
    </section>
  );
};

// ── Footer ─────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <div className="row gap-2">
            <img src="logo.svg" alt="마음풀" height="36" style={{filter:'brightness(0) invert(1)'}}/>
          </div>
          <p className="footer-disclaimer">
            마음풀은 의료 행위를 대체하지 않습니다. 검사 결과는 자기 이해를 위한 참고용이며,
            증상이 지속되면 전문 의료기관 진료를 권장합니다.
          </p>
          <div className="row gap-3 mt-6">
            <a href="#" className="pill pill--ghost" style={{background:'rgba(255,255,255,0.06)',color:'var(--green-200)',border:'1px solid rgba(255,255,255,0.12)'}}>한국상담심리학회 회원사</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>서비스</h4>
          <ul>
            <li><a href="#tests">심리검사</a></li>
            <li><a href="#ai">AI 상담</a></li>
            <li><a href="#counselors">상담 예약</a></li>
            <li><a href="#games">마음 게임</a></li>
            <li><a href="#couples">마음커플</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>회사</h4>
          <ul>
            <li><a href="#">소개</a></li>
            <li><a href="#">검사 신뢰성</a></li>
            <li><a href="#">상담사 모집</a></li>
            <li><a href="#">제휴 문의</a></li>
            <li><a href="#">보도자료</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>고객지원</h4>
          <ul>
            <li><a href="#">자주 묻는 질문</a></li>
            <li><a href="#">개인정보처리방침</a></li>
            <li><a href="#">이용약관</a></li>
            <li><a href="#">검사 데이터 정책</a></li>
            <li><a href="#">문의하기</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Maumful Inc. · 사업자등록번호 000-00-00000</span>
        <span>Made with 🌱 in Seoul</span>
      </div>
    </div>
  </footer>
);

// ── App ────────────────────────────────────────────────────────────
const App = () => (
  <>
    <Header/>
    <main>
      <Hero/>
      <Why/>
      <Tests/>
      <AICounseling/>
      <Games/>
      <Couples/>
      <Counselors/>
    </main>
    <Footer/>
  </>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
