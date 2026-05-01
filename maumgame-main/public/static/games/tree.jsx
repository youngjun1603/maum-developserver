// ============================================================
// tree.jsx  —  내면의 나무 (Inner Tree)  ·  A안: 숲 속 감성 리디자인
// ============================================================

const GT = {
  dawnDeep:  '#0D1F12', dawnMid:'#1A3320', dawnLight:'#2D5A3D',
  skyDawn:   '#8FB5A0', skyGlow:'#C8DDD0', fogWhite:'#E8F0EB',
  bark:'#4A3728', barkL:'#6B5240', barkD:'#2E1F14',
  leaf:'#2D6A3A', leafL:'#4A8A54', leafViv:'#5CAF6A', leafGlow:'#88D4A0',
  blossom:'#F4A0B8', blossomL:'#FAD0DF', amber:'#E8A84A', amberL:'#F5C870',
  cream:'#F5F0E8', softCream:'#EDE8DF', muted:'#8A9E8F', mutedD:'#5A7060', dark:'#1A2E1F',
};

const TREE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600&display=swap');
  @keyframes sway      { 0%,100%{transform:rotate(-1.5deg) translateX(-1px)}50%{transform:rotate(1.5deg) translateX(1px)} }
  @keyframes shimmer   { 0%,100%{opacity:0.6}50%{opacity:1} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0}to{opacity:1} }
  @keyframes bloomPop  { 0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes firefly   { 0%,100%{transform:translate(0,0);opacity:0}25%{transform:translate(4px,-6px);opacity:0.9}75%{transform:translate(-3px,4px);opacity:0.5} }
  @keyframes mist      { 0%,100%{transform:translateX(0);opacity:0.18}50%{transform:translateX(12px);opacity:0.28} }
  @keyframes leafDrop  { 0%{transform:translateY(-10px) rotate(0deg);opacity:0}20%{opacity:1}100%{transform:translateY(80px) rotate(180deg) translateX(20px);opacity:0} }
  @keyframes stageSlide{ from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
  @keyframes rootGrow  { from{stroke-dashoffset:100}to{stroke-dashoffset:0} }
  .tree-sway    { animation:sway 4s ease-in-out infinite; transform-origin:180px 210px; }
  .firefly-anim { animation:firefly 4s ease-in-out infinite; }
  .mist-anim    { animation:mist 6s ease-in-out infinite; }
  .bloom-pop    { animation:bloomPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .stage-slide  { animation:stageSlide 0.3s ease forwards; }
  .tree-textarea {
    width:100%; padding:14px 16px; border-radius:14px; font-size:14px;
    font-family:'Noto Sans KR',sans-serif; outline:none; resize:none;
    line-height:1.75; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box;
  }
  .tree-textarea:focus { box-shadow:0 0 0 3px rgba(90,175,106,0.22); }
  .tree-btn { width:100%; padding:15px; border:none; border-radius:16px; font-size:15px;
    font-weight:700; font-family:'Noto Sans KR',sans-serif; cursor:pointer;
    transition:transform 0.15s,box-shadow 0.15s,opacity 0.2s; }
  .tree-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .tree-btn:active:not(:disabled){ transform:translateY(0); }
  .tree-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .tree-btn-ghost { width:100%; padding:12px; border-radius:14px; font-size:13px;
    font-weight:600; font-family:'Noto Sans KR',sans-serif; cursor:pointer;
    transition:background 0.2s; background:transparent; }
  .answer-card { animation:fadeUp 0.3s ease forwards; }
`;

const STAGES = [
  { id:'roots', title:'뿌리 — 현재 순간', emoji:'🌱',
    color:'#7B5F4A', accent:'#C8A882', bg:'rgba(107,79,58,0.14)', border:'rgba(200,168,130,0.25)',
    desc:'지금 이 순간에 닿아있어요.',
    questions:[
      {id:'r1',prompt:'지금 이 순간, 몸에서 느껴지는 감각은?',placeholder:'따뜻함, 긴장, 호흡의 리듬...',hint:'눈을 감고 10초만 느껴보세요'},
      {id:'r2',prompt:'지금 내 마음속에 있는 감정은?',placeholder:'불안, 평온, 기대, 그리움...',hint:'좋은 감정이 아니어도 괜찮아요'},
    ]},
  { id:'trunk', title:'줄기 — 나의 가치', emoji:'🌳',
    color:'#2D6A3A', accent:'#88D4A0', bg:'rgba(45,106,58,0.12)', border:'rgba(136,212,160,0.2)',
    desc:'내가 소중히 여기는 것들로 이루어져요.',
    questions:[
      {id:'t1',prompt:'내가 가장 소중하게 여기는 가치는?',placeholder:'관계, 성장, 자유, 창의, 정직...',hint:'지금 가장 먼저 떠오르는 것'},
      {id:'t2',prompt:'미래의 나에게 전하고 싶은 한 마디는?',placeholder:'포기하지 마, 넌 충분해, 쉬어도 돼...',hint:'진심을 담아 써보세요'},
    ]},
  { id:'branches', title:'가지 — 나의 행동', emoji:'🌿',
    color:'#2D6A3A', accent:'#B8E8C4', bg:'rgba(45,106,58,0.09)', border:'rgba(184,232,196,0.2)',
    desc:'가치를 향한 구체적인 한 걸음이에요.',
    questions:[
      {id:'b1',prompt:'오늘 실천할 수 있는 작은 행동은?',placeholder:'5분 산책, 물 한 잔, 좋아하는 음악...',hint:'아주 작아도 괜찮아요'},
      {id:'b2',prompt:'이번 주 나에게 주고 싶은 선물은?',placeholder:'충분한 잠, 맛있는 것, 혼자만의 시간...',hint:'나를 위한 선물'},
    ]},
];

// ── 숲 배경 ─────────────────────────────────────────────────
function ForestBg({ stage }) {
  return (
    <svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0A1A0E"/>
          <stop offset="45%"  stopColor="#153522"/>
          <stop offset="80%"  stopColor="#1E4A2C"/>
          <stop offset="100%" stopColor="#2A5E38"/>
        </linearGradient>
        <linearGradient id="fGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1E3A14"/>
          <stop offset="100%" stopColor="#0F2208"/>
        </linearGradient>
        <radialGradient id="moonG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFF8E0" stopOpacity="0.95"/>
          <stop offset="55%"  stopColor="#F0E0A0" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#F0E0A0" stopOpacity="0"/>
        </radialGradient>
        <filter id="fGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="360" height="220" fill="url(#fSky)"/>
      {/* 달 */}
      <circle cx="298" cy="32" r="24" fill="url(#moonG)"/>
      <circle cx="298" cy="32" r="15" fill="#FFF8E0" opacity="0.92"/>
      {/* 별 */}
      {[[28,16,1.1],[72,10,0.8],[118,18,1.0],[168,7,0.9],[215,14,1.2],[248,24,0.8],[338,15,1.1],[52,32,0.7],[135,28,0.9],[178,36,0.7],[225,38,0.8],[268,20,1.0],[325,35,0.8],[14,40,0.7],[348,22,0.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.4+(i%3)*0.15}
          style={{animation:`shimmer ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`}}/>
      ))}
      {/* 반딧불 */}
      {stage>=1 && [[75,118],[118,95],[198,108],[244,98],[158,82]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.8} fill="#B8F0A0" filter="url(#fGlow)"
          className="firefly-anim" style={{animationDelay:`${i*0.8}s`,animationDuration:`${3+i*0.5}s`}}/>
      ))}
      {/* 원거리 나무 실루엣 */}
      {[[18,162,11,52],[48,152,14,62],[318,157,12,56],[342,150,10,48]].map(([x,y,w,h],i)=>(
        <g key={i} opacity="0.22">
          <rect x={x-w*0.2} y={y-h} width={w*0.38} height={h} rx="3" fill="#0F2210"/>
          <ellipse cx={x} cy={y-h+4} rx={w} ry={w*0.8} fill="#0F2210"/>
        </g>
      ))}
      {/* 중거리 나무 */}
      {[[38,175,17,70],[88,168,20,78],[268,172,19,73],[308,166,15,65]].map(([x,y,w,h],i)=>(
        <g key={i} opacity="0.38">
          <rect x={x-w*0.2} y={y-h} width={w*0.38} height={h} rx="3" fill="#152818"/>
          <ellipse cx={x} cy={y-h+5} rx={w} ry={w*0.88} fill="#152818"/>
          <ellipse cx={x} cy={y-h-8} rx={w*0.68} ry={w*0.68} fill="#1C3520"/>
        </g>
      ))}
      {/* 안개 */}
      <ellipse cx="180" cy="194" rx="200" ry="18" fill="#2A5038" opacity="0.28" className="mist-anim"/>
      <ellipse cx="180" cy="188" rx="155" ry="12" fill="#3A6048" opacity="0.2" style={{animation:'mist 8s ease-in-out 1.5s infinite'}}/>
      {/* 지면 */}
      <ellipse cx="180" cy="214" rx="200" ry="20" fill="url(#fGround)"/>
      <rect x="0" y="206" width="360" height="14" fill="#0F2208"/>
      {/* 풀 */}
      {[22,52,82,112,142,172,202,232,262,292,322,352].map((x,i)=>(
        <g key={i} opacity="0.65">
          <path d={`M${x} 206 Q${x-4} 196 ${x-2} 191`} stroke="#204A18" strokeWidth="1.4" fill="none"/>
          <path d={`M${x} 206 Q${x+3} 195 ${x+1} 189`} stroke="#2A5A20" strokeWidth="1.1" fill="none"/>
          <path d={`M${x} 206 Q${x+6} 198 ${x+5} 194`} stroke="#204A18" strokeWidth="0.9" fill="none"/>
        </g>
      ))}
    </svg>
  );
}

// ── 메인 나무 SVG ────────────────────────────────────────────
function MainTreeSVG({ stage, answers, animated }) {
  const rootsDone  = stage >= 1;
  const trunkDone  = stage >= 2;
  const branchDone = stage >= 3;
  const answered   = Object.values(answers||{}).filter(v=>v?.trim().length>0).length;
  return (
    <svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="tTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#2E1F14"/><stop offset="40%" stopColor="#6B5240"/><stop offset="100%" stopColor="#3A2818"/>
        </linearGradient>
        <linearGradient id="tLeaf1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5CAF6A"/><stop offset="100%" stopColor="#2D6A3A"/>
        </linearGradient>
        <linearGradient id="tLeaf2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4A8A54"/><stop offset="100%" stopColor="#1E4A28"/>
        </linearGradient>
        <filter id="tGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="tShadow"><feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#0A1A0E" floodOpacity="0.55"/></filter>
      </defs>

      {/* 뿌리 */}
      {rootsDone && (
        <g opacity="0.88">
          <path d="M170 210 Q150 218 126 214" fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
          <path d="M174 212 Q160 224 142 222" fill="none" stroke="#4A3728" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M190 210 Q210 218 230 213" fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
          <path d="M186 212 Q200 225 216 222" fill="none" stroke="#4A3728" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M180 213 Q180 226 172 230" fill="none" stroke="#2E1F14" strokeWidth="3"  strokeLinecap="round"/>
          <ellipse cx="180" cy="213" rx="28" ry="4" fill="#88D4A0" opacity="0.14" style={{animation:'shimmer 3s ease-in-out infinite'}}/>
        </g>
      )}

      {/* 줄기 + 가지 그룹 (흔들림 애니) */}
      <g className={rootsDone ? 'tree-sway' : ''}>
        {/* 줄기 */}
        <path d="M172 210 Q168 180 166 155 Q164 130 166 108"
          fill="none" stroke="url(#tTrunk)" strokeWidth="22" strokeLinecap="round"
          opacity={rootsDone?1:0.3} style={{transition:'opacity 1s',filter:rootsDone?'url(#tShadow)':undefined}}/>
        <path d="M176 208 Q173 178 172 153 Q171 130 173 110"
          fill="none" stroke="#8B6B50" strokeWidth="5.5" strokeLinecap="round"
          opacity={rootsDone?0.38:0.08} style={{transition:'opacity 1s'}}/>

        {/* 가지 */}
        {trunkDone && (
          <g>
            <path d="M168 162 Q142 148 120 136" fill="none" stroke="#4A3728" strokeWidth="9"  strokeLinecap="round"/>
            <path d="M120 136 Q102 124 90  118" fill="none" stroke="#3A2818" strokeWidth="6"  strokeLinecap="round"/>
            <path d="M120 136 Q107 118 102 108" fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
            <path d="M168 155 Q194 140 214 130" fill="none" stroke="#4A3728" strokeWidth="9"  strokeLinecap="round"/>
            <path d="M214 130 Q230 118 242 112" fill="none" stroke="#3A2818" strokeWidth="6"  strokeLinecap="round"/>
            <path d="M214 130 Q222 112 224 103" fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
            <path d="M167 142 Q164 118 162 102" fill="none" stroke="#4A3728" strokeWidth="8"  strokeLinecap="round"/>
            <path d="M162 102 Q156 86  152 78"  fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
            <path d="M162 102 Q170 86  174 78"  fill="none" stroke="#3A2818" strokeWidth="5"  strokeLinecap="round"/>
          </g>
        )}

        {/* 잎 */}
        {rootsDone && (
          <g>
            <ellipse cx="164" cy="105" rx="42" ry="36" fill="url(#tLeaf1)" opacity="0.95" filter="url(#tGlow)"/>
            <ellipse cx="157" cy="98"  rx="29" ry="23" fill="#4A8A54" opacity="0.68"/>
            <ellipse cx="174" cy="100" rx="26" ry="20" fill="#5CAF6A" opacity="0.48"/>
            <ellipse cx="160" cy="90"  rx="16" ry="12" fill="#7ACC88" opacity="0.35"/>
          </g>
        )}
        {trunkDone && (
          <g>
            <ellipse cx="106" cy="118" rx="31" ry="25" fill="url(#tLeaf2)" opacity="0.88"/>
            <ellipse cx="98"  cy="112" rx="20" ry="17" fill="#4A8A54" opacity="0.66"/>
            <ellipse cx="96"  cy="107" rx="13" ry="10" fill="#5CAF6A" opacity="0.48"/>
            <ellipse cx="220" cy="115" rx="31" ry="25" fill="url(#tLeaf2)" opacity="0.88"/>
            <ellipse cx="228" cy="110" rx="20" ry="17" fill="#4A8A54" opacity="0.66"/>
            <ellipse cx="230" cy="106" rx="13" ry="10" fill="#5CAF6A" opacity="0.48"/>
          </g>
        )}
        {branchDone && (
          <g>
            <ellipse cx="162" cy="78"  rx="27" ry="21" fill="url(#tLeaf1)" opacity="0.9"/>
            <ellipse cx="160" cy="72"  rx="17" ry="14" fill="#5CAF6A" opacity="0.68"/>
            <ellipse cx="88"  cy="108" rx="19" ry="15" fill="url(#tLeaf2)" opacity="0.83"/>
            <ellipse cx="82"  cy="103" rx="12" ry="9"  fill="#4A8A54" opacity="0.6"/>
            <ellipse cx="236" cy="105" rx="19" ry="15" fill="url(#tLeaf2)" opacity="0.83"/>
            <ellipse cx="242" cy="100" rx="12" ry="9"  fill="#4A8A54" opacity="0.6"/>
          </g>
        )}

        {/* 꽃 */}
        {answered>=2 && rootsDone && (
          <g>
            {[{cx:110,cy:112,c:'#F4A0B8'},{cx:218,cy:110,c:'#FCD34D'},{cx:158,cy:74,c:'#B8E8C4'}]
              .slice(0,Math.min(Math.floor(answered/2),3))
              .map((p,i)=>(
              <g key={i} className="bloom-pop" style={{animationDelay:`${i*0.15}s`}}>
                {[0,72,144,216,288].map(a=>(
                  <ellipse key={a}
                    cx={p.cx+Math.cos(a*Math.PI/180)*6} cy={p.cy+Math.sin(a*Math.PI/180)*6}
                    rx="4.5" ry="3" fill={p.c} opacity="0.94"
                    transform={`rotate(${a+36},${p.cx+Math.cos(a*Math.PI/180)*6},${p.cy+Math.sin(a*Math.PI/180)*6})`}/>
                ))}
                <circle cx={p.cx} cy={p.cy} r="3.5" fill="#FFF8A0"/>
                <circle cx={p.cx} cy={p.cy} r="1.5" fill="#E8C840"/>
              </g>
            ))}
          </g>
        )}

        {/* 나비 */}
        {branchDone && answered>=5 && (
          <g fill="#F9C8D8" opacity="0.82" style={{animation:'sway 4s ease-in-out infinite',transformOrigin:'94px 108px'}}>
            <path d="M94 108 Q84 100 87 92 Q94 100 94 108Z"/>
            <path d="M94 108 Q104 100 101 92 Q94 100 94 108Z"/>
            <path d="M94 108 Q85 115 87 121 Q94 114 94 108Z" opacity="0.7"/>
            <path d="M94 108 Q103 115 101 121 Q94 114 94 108Z" opacity="0.7"/>
            <line x1="94" y1="108" x2="93" y2="114" stroke="#A06880" strokeWidth="1"/>
            <line x1="94" y1="108" x2="95" y2="114" stroke="#A06880" strokeWidth="1"/>
          </g>
        )}
      </g>

      {/* 낙엽 (전환 시) */}
      {animated && answered>0 && [162,177,150,185].map((x,i)=>(
        <ellipse key={i} cx={x} cy={82+i*4} rx="4" ry="2.5" fill="#5CAF6A" opacity="0.7"
          style={{animation:`leafDrop 1.2s ease ${i*0.15}s forwards`}}/>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
// TreeGame — 메인
// ════════════════════════════════════════════════════════════
function TreeGame({ onExit }) {
  const { useState, useEffect, useRef } = React;
  const [stageIdx,   setStageIdx]   = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [qIdx,       setQIdx]       = useState(0);
  const [screen,     setScreen]     = useState('intro');
  const [sessionSec, setSessionSec] = useState(0);
  const [leafAnim,   setLeafAnim]   = useState(false);
  const [finishing,  setFinishing]  = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = 'tree-game-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = TREE_STYLE;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (screen !== 'writing') return;
    const t = setInterval(() => setSessionSec(Math.round((Date.now()-startRef.current)/1000)), 1000);
    return () => clearInterval(t);
  }, [screen]);

  const currentStage = STAGES[stageIdx];
  const currentQ     = currentStage?.questions[qIdx];
  const answered     = Object.values(answers).filter(v=>v?.trim().length>0).length;
  const canNext      = answers[currentQ?.id]?.trim().length > 0;

  const handleNext = () => {
    setLeafAnim(true);
    setTimeout(()=>setLeafAnim(false), 1200);
    setTimeout(()=>{
      if (qIdx < currentStage.questions.length-1) { setQIdx(qIdx+1); }
      else if (stageIdx < STAGES.length-1)         { setStageIdx(stageIdx+1); setQIdx(0); }
      else                                          { setScreen('done'); }
    }, 200);
  };

  const handleFinish = async () => {
    setFinishing(true);
    const filledCount = Object.values(answers).filter(v=>v?.trim().length>1).length;
    const score = filledCount*20 + Math.min(sessionSec*0.3, 30);
    try {
      const res = await GameEngine.saveSession({
        gameId:'tree', moduleType:'ACT', score:Math.round(score), durationSec:sessionSec,
        metadata:{ stages_completed:stageIdx+1, answers_filled:filledCount },
      });
      onExit?.({ score:Math.round(score), expGained:res.data?.expGained||0,
        leveledUp:res.data?.leveledUp||false, newAchievements:res.data?.newAchievements||[] });
    } catch { onExit?.({ score:Math.round(score), expGained:0, leveledUp:false, newAchievements:[] }); }
  };

  // 공통 헤더
  const Header = () => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 18px', background:'rgba(10,24,14,0.88)', backdropFilter:'blur(12px)',
      borderBottom:'1px solid rgba(136,212,160,0.1)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{fontSize:20}}>🌳</span>
        <span style={{ fontSize:15, fontWeight:700, color:GT.cream,
          fontFamily:"'Noto Serif KR',serif", letterSpacing:'-0.3px' }}>내면의 나무</span>
      </div>
      <button onClick={()=>onExit(null)} style={{ fontFamily:"'Noto Sans KR',sans-serif",
        background:'rgba(136,212,160,0.1)', color:GT.skyGlow,
        border:'1px solid rgba(136,212,160,0.18)', borderRadius:10,
        padding:'6px 14px', fontSize:12, fontWeight:500, cursor:'pointer' }}>
        허브로 →
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // 인트로
  // ══════════════════════════════════════════
  if (screen === 'intro') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:GT.dawnDeep, overflow:'hidden' }}>
      <Header/>
      <div style={{ position:'relative', height:195, flexShrink:0 }}>
        <div style={{position:'absolute',inset:0}}><ForestBg stage={0}/></div>
        <div style={{position:'absolute',inset:0}}><MainTreeSVG stage={0} answers={{}} animated={false}/></div>
        <div style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center' }}>
          <div style={{ display:'inline-block', background:'rgba(10,24,14,0.72)',
            backdropFilter:'blur(8px)', borderRadius:12, padding:'7px 18px',
            border:'1px solid rgba(136,212,160,0.18)', animation:'fadeUp 0.6s ease' }}>
            <p style={{ fontSize:11, color:GT.leafGlow, margin:0, fontFamily:"'Noto Sans KR',sans-serif", fontWeight:500 }}>
              새벽 숲에서 나를 만나는 시간 🌿
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 18px 28px' }}>
        <div style={{ background:'rgba(45,106,58,0.14)', border:'1px solid rgba(136,212,160,0.18)',
          borderRadius:18, padding:'16px 18px', marginBottom:14,
          animation:'fadeUp 0.5s ease 0.1s both' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:GT.cream, fontFamily:"'Noto Serif KR',serif",
            marginBottom:6, lineHeight:1.45 }}>내 마음의 나무를 가꾸어요</h2>
          <p style={{ fontSize:12, color:GT.muted, lineHeight:1.8, margin:0, fontFamily:"'Noto Sans KR',sans-serif" }}>
            3단계를 따라 뿌리·줄기·가지를 완성하며<br/>나만의 내면의 나무를 키워보세요.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:22 }}>
          {STAGES.map((s,i)=>(
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14,
              padding:'13px 15px', background:'rgba(30,60,40,0.22)',
              border:`1px solid ${s.border}`, borderRadius:15,
              animation:`fadeUp 0.5s ease ${0.2+i*0.09}s both` }}>
              <div style={{ width:40, height:40, borderRadius:11, flexShrink:0,
                background:`rgba(30,60,40,0.45)`, border:`1px solid ${s.border}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                {s.emoji}
              </div>
              <div style={{flex:1}}>
                <div style={{ fontSize:13, fontWeight:700, color:GT.cream, marginBottom:2,
                  fontFamily:"'Noto Serif KR',serif" }}>{s.title}</div>
                <div style={{ fontSize:11, color:GT.muted, lineHeight:1.45,
                  fontFamily:"'Noto Sans KR',sans-serif" }}>{s.desc}</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:'50%',
                background:'rgba(136,212,160,0.1)', border:'1px solid rgba(136,212,160,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, color:GT.skyGlow, fontWeight:700 }}>{i+1}</div>
            </div>
          ))}
        </div>

        <button className="tree-btn"
          onClick={()=>{ startRef.current=Date.now(); setScreen('writing'); }}
          style={{ background:`linear-gradient(135deg,#5CAF6A,#2D6A3A)`, color:'white',
            boxShadow:'0 6px 20px rgba(45,106,58,0.42)' }}>
          🌱 나무 가꾸기 시작
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // 글쓰기
  // ══════════════════════════════════════════
  if (screen === 'writing') {
    const totalQ  = STAGES.reduce((s,st)=>s+st.questions.length,0);
    const doneQ   = STAGES.slice(0,stageIdx).reduce((s,st)=>s+st.questions.length,0)+qIdx;
    const progress = Math.round((doneQ/totalQ)*100);
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:GT.dawnDeep, overflow:'hidden' }}>
        <Header/>

        {/* 숲 + 나무 */}
        <div style={{ position:'relative', height:155, flexShrink:0 }}>
          <div style={{position:'absolute',inset:0}}><ForestBg stage={stageIdx}/></div>
          <div style={{position:'absolute',inset:0}}>
            <MainTreeSVG stage={stageIdx} answers={answers} animated={leafAnim}/>
          </div>
          {/* 진행 바 */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 16px 9px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`,
                  background:'linear-gradient(90deg,#5CAF6A,#88D4A0)',
                  borderRadius:99, transition:'width 0.5s ease' }}/>
              </div>
              <span style={{ fontSize:10, color:GT.muted, fontFamily:"'Noto Sans KR',sans-serif", whiteSpace:'nowrap' }}>
                {doneQ}/{totalQ}
              </span>
            </div>
          </div>
        </div>

        {/* 스테이지 탭 */}
        <div style={{ display:'flex', background:'rgba(10,24,14,0.9)',
          borderBottom:'1px solid rgba(136,212,160,0.08)', flexShrink:0 }}>
          {STAGES.map((s,i)=>{
            const isActive = i===stageIdx, isDone = i<stageIdx;
            return (
              <div key={s.id} style={{ flex:1, padding:'9px 4px', textAlign:'center',
                borderBottom: isActive?`2px solid ${s.accent}`:'2px solid transparent',
                transition:'border-color 0.3s' }}>
                <div style={{fontSize:15,marginBottom:1}}>{isDone?'✅':s.emoji}</div>
                <div style={{ fontSize:9, fontWeight:isActive?700:400,
                  color:isActive?s.accent:isDone?GT.muted:'rgba(255,255,255,0.25)',
                  fontFamily:"'Noto Sans KR',sans-serif", transition:'color 0.3s' }}>
                  {s.id==='roots'?'뿌리':s.id==='trunk'?'줄기':'가지'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 질문 */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 24px' }}
          key={`${stageIdx}-${qIdx}`} className="stage-slide">

          {/* 스테이지 레이블 */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
            marginBottom:12, background:currentStage.bg, border:`1px solid ${currentStage.border}`,
            borderRadius:13 }}>
            <span style={{fontSize:18}}>{currentStage.emoji}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:currentStage.accent,
                fontFamily:"'Noto Serif KR',serif" }}>{currentStage.title}</div>
              <div style={{ fontSize:10, color:GT.muted, fontFamily:"'Noto Sans KR',sans-serif" }}>
                {currentStage.desc}
              </div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:10, color:GT.muted,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {qIdx+1}/{currentStage.questions.length}
            </span>
          </div>

          {/* 질문 카드 */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(136,212,160,0.1)',
            borderRadius:18, padding:'16px', marginBottom:12 }}>
            <div style={{ fontSize:10, color:GT.leafGlow, marginBottom:9,
              fontFamily:"'Noto Sans KR',sans-serif", fontWeight:500,
              display:'flex', alignItems:'center', gap:4 }}>
              <span>💡</span>{currentQ?.hint}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:GT.cream, lineHeight:1.55,
              marginBottom:13, fontFamily:"'Noto Serif KR',serif" }}>
              {currentQ?.prompt}
            </div>
            <textarea className="tree-textarea"
              value={answers[currentQ?.id]||''}
              onChange={e=>setAnswers(prev=>({...prev,[currentQ.id]:e.target.value}))}
              placeholder={currentQ?.placeholder}
              rows={3} autoFocus
              style={{ background:'rgba(10,24,14,0.65)',
                border:`1.5px solid ${answers[currentQ?.id]?.trim()?currentStage.accent:'rgba(136,212,160,0.14)'}`,
                color:GT.cream }}/>
          </div>

          {/* 이전 답변 */}
          {Object.entries(answers).filter(([k,v])=>v?.trim()&&k!==currentQ?.id).length>0 && (
            <div style={{marginBottom:14}}>
              <div style={{ fontSize:10, color:GT.muted, marginBottom:5,
                fontFamily:"'Noto Sans KR',sans-serif" }}>이전 답변</div>
              {Object.entries(answers).filter(([k,v])=>v?.trim()&&k!==currentQ?.id).map(([k,v],i)=>{
                const si  = STAGES.findIndex(s=>s.questions.some(q=>q.id===k));
                const st  = STAGES[si];
                return (
                  <div key={k} className="answer-card" style={{ fontSize:11, color:GT.muted,
                    padding:'6px 10px', marginBottom:4, background:'rgba(30,60,40,0.2)',
                    border:`1px solid ${st?.border||'rgba(136,212,160,0.1)'}`,
                    borderRadius:8, lineHeight:1.5,
                    borderLeft:`2.5px solid ${st?.accent||GT.leafViv}`,
                    fontFamily:"'Noto Sans KR',sans-serif" }}>
                    {v.length>42?v.slice(0,42)+'...':v}
                  </div>
                );
              })}
            </div>
          )}

          <button className="tree-btn" onClick={handleNext} disabled={!canNext}
            style={{ background:canNext?`linear-gradient(135deg,#5CAF6A,${currentStage.color})`:'rgba(255,255,255,0.07)',
              color:canNext?'white':'rgba(255,255,255,0.28)',
              boxShadow:canNext?'0 6px 20px rgba(45,106,58,0.35)':'none' }}>
            {stageIdx===STAGES.length-1&&qIdx===currentStage.questions.length-1?'🌳 나무 완성하기':'다음 →'}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // 완료
  // ══════════════════════════════════════════
  if (screen === 'done') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:GT.dawnDeep,
      animation:'fadeIn 0.5s ease' }}>
      <Header/>
      <div style={{ position:'relative', height:190, flexShrink:0 }}>
        <div style={{position:'absolute',inset:0}}><ForestBg stage={3}/></div>
        <div style={{position:'absolute',inset:0}}><MainTreeSVG stage={3} answers={answers} animated/></div>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ background:'rgba(10,24,14,0.7)', backdropFilter:'blur(8px)',
            borderRadius:16, padding:'10px 22px', textAlign:'center',
            border:'1px solid rgba(136,212,160,0.28)', animation:'fadeUp 0.6s ease' }}>
            <div style={{fontSize:22,marginBottom:2}}>🌳</div>
            <div style={{ fontSize:14, fontWeight:700, color:GT.leafGlow,
              fontFamily:"'Noto Serif KR',serif" }}>내면의 나무 완성!</div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 18px 28px' }}>
        <p style={{ fontSize:12, color:GT.muted, lineHeight:1.8, marginBottom:18,
          textAlign:'center', fontFamily:"'Noto Sans KR',sans-serif" }}>
          뿌리·줄기·가지를 모두 채웠어요.<br/>이 글들이 당신의 마음 지도가 되길 바랍니다.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:22 }}>
          {STAGES.map((s,si)=>(
            <div key={s.id} style={{ background:'rgba(30,60,40,0.2)', border:`1px solid ${s.border}`,
              borderRadius:15, padding:'13px 15px',
              animation:`fadeUp 0.4s ease ${si*0.1}s both` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                <span style={{fontSize:16}}>{s.emoji}</span>
                <span style={{ fontSize:11, fontWeight:700, color:s.accent,
                  fontFamily:"'Noto Serif KR',serif" }}>{s.title}</span>
              </div>
              {s.questions.map(q=>answers[q.id]&&(
                <div key={q.id} style={{ fontSize:12, color:GT.softCream, lineHeight:1.65,
                  marginBottom:5, paddingLeft:10, borderLeft:`2px solid ${s.accent}`,
                  fontFamily:"'Noto Sans KR',sans-serif" }}>
                  {answers[q.id]}
                </div>
              ))}
            </div>
          ))}
        </div>

        <button className="tree-btn" onClick={handleFinish} disabled={finishing}
          style={{ background:finishing?'rgba(255,255,255,0.08)':`linear-gradient(135deg,#5CAF6A,#2D6A3A)`,
            color:'white', boxShadow:'0 6px 20px rgba(45,106,58,0.42)', marginBottom:10 }}>
          {finishing?'저장 중...':'✨ 경험치 받기'}
        </button>
        <button className="tree-btn-ghost" onClick={()=>onExit(null)}
          style={{ border:'1px solid rgba(136,212,160,0.18)', color:GT.muted }}>
          경험치 없이 허브로 →
        </button>
      </div>
    </div>
  );

  return null;
}
