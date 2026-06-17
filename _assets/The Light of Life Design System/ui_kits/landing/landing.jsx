const { useState } = React;

function Header() {
  return (
    <header className="tll-header">
      <div className="tll-header-inner">
        <a href="#" style={{display:'flex',alignItems:'center',gap:0,textDecoration:'none'}}>
          <img src="../../assets/logo-wordmark-light.svg" alt="The Light of Life" style={{height: 40}}/>
        </a>
        <nav>
          <a href="#">서비스 소개</a>
          <a href="#">전문 심리검사</a>
          <a href="#">상담사 찾기</a>
          <a href="#">교회 도입</a>
          <a href="#">자료실</a>
        </nav>
        <div className="tll-header-actions">
          <a className="tll-header-login" href="#">로그인</a>
          <button className="tll-btn tll-btn-primary" style={{padding:'10px 18px',fontSize:13}}>무료로 시작하기</button>
        </div>
      </div>
    </header>
  );
}

function PartnerRibbon() {
  return (
    <div className="tll-ribbon">
      Official Partner of CTS 기독교TV<span className="dot"></span>CTS 공식 파트너 서비스
    </div>
  );
}

function ScriptureCard() {
  return (
    <div className="tll-scripture-card">
      <span className="corner tl"></span>
      <span className="corner tr"></span>
      <span className="corner bl"></span>
      <span className="corner br"></span>

      <span className="tll-scripture-eyebrow">
        <span className="rule"></span>오늘의 말씀<span className="rule"></span>
      </span>

      <svg className="tll-scripture-star" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0 L9.6 6.4 L16 8 L9.6 9.6 L8 16 L6.4 9.6 L0 8 L6.4 6.4 Z"/>
      </svg>

      <p className="tll-scripture-text">
        "마음의 즐거움은 양약이라도<br/>심령의 근심은 뼈를 마르게 하느니라."
      </p>
      <p className="tll-scripture-text-en">
        "A joyful heart is good medicine, but a crushed spirit dries up the bones."
      </p>
      <span className="tll-scripture-ref">잠언 17 : 22 · Proverbs 17:22</span>
    </div>
  );
}

function MiniCard({ icon, title, sub }) {
  return (
    <a href="#" className="tll-mini" style={{textDecoration:'none'}}>
      <span className="tll-mini-icon">{icon}</span>
      <span className="tll-mini-text">
        <span className="tll-mini-title">{title}</span>
        <span className="tll-mini-sub">{sub}</span>
      </span>
      <svg className="tll-mini-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17l10-10M9 7h8v8"/>
      </svg>
    </a>
  );
}

function Hero() {
  return (
    <section className="tll-hero">
      <div className="tll-hero-inner">
        <div className="tll-hero-left">
          <span className="tll-hero-eyebrow">
            <span className="rule"></span>For Churches · 교회와 성도를 위해
          </span>

          <h1>
            말씀으로<br/>
            치유하는 <span className="accent">마음</span>
          </h1>

          <p className="tll-hero-sub">
            성경적 상담과 임상 심리검사가 만나는 곳. 8종의 전문 심리검사와 검증된
            기독교 상담사가 성도의 마음을 살핍니다.
          </p>

          <div className="tll-cta-row">
            <button className="tll-btn tll-btn-primary">
              무료로 시작하기
              <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="tll-btn tll-btn-outline">
              기독교 상담사 찾기
            </button>
          </div>

          <div className="tll-trust">
            <div className="tll-trust-item">
              <span className="tll-trust-num">8<span style={{fontSize:18,marginLeft:2}}>종</span></span>
              <span className="tll-trust-label">전문 심리검사</span>
              <span className="tll-trust-meta">MMPI · TCI · MBTI · 외</span>
            </div>
            <div className="tll-trust-item">
              <span className="tll-trust-num">PHQ-9 · GAD-7</span>
              <span className="tll-trust-label">우울 · 불안 자가검사 무료 제공</span>
              <span className="tll-trust-meta">Free Screening</span>
            </div>
            <div className="tll-trust-item">
              <span className="tll-trust-num">성경적 AI</span>
              <span className="tll-trust-label">24시간 1차 상담 동반자</span>
              <span className="tll-trust-meta">Biblical AI Companion</span>
            </div>
          </div>
        </div>

        <div className="tll-scripture-stack">
          <ScriptureCard />
          <MiniCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 3 3 5-6 5 6"/><path d="M3 21h18"/></svg>}
            title="PHQ-9 자가검사 시작"
            sub="3분 · 결과 즉시 확인 · 무료"
          />
          <MiniCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v6"/><path d="M9 6h6"/><path d="M5 21V11l7-4 7 4v10"/><path d="M10 21v-5h4v5"/></svg>}
            title="교회 단위 도입 문의"
            sub="교역자 케어 · 성도 상담 · 전담 매니저"
          />
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <PartnerRibbon />
      <Header />
      <Hero />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
