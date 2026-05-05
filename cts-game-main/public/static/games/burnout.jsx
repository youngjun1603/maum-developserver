// ============================================================
// burnout.jsx — ⚡ 번아웃 회복 게임  ·  리디자인: 새벽 도시의 불빛
// 미션 완료 → 어둠 속 도시에 불이 켜지는 에너지 회복 여정
// ============================================================

const BT = {
  // 새벽 도시 배경
  nightDeep:  '#080E1A',
  nightMid:   '#0F1E2E',
  nightLight: '#1A3048',
  cityGlow:   '#1E4060',

  // 에너지 컬러 (소진 → 회복)
  energyLow:  '#FF6B6B',
  energyMid:  '#FFB347',
  energyHigh: '#4ECDC4',
  energyFull: '#45EE88',

  // 포인트
  electric:   '#7EB8F7',
  electricL:  '#B8D8FF',
  amber:      '#F5C842',
  amberL:     '#FFE08A',

  // 텍스트
  cream:      '#F0EDE8',
  softCream:  '#D8D4CE',
  muted:      '#7A8FA8',
  mutedL:     '#A8BDD0',
  dark:       '#060C14',
};

const BURNOUT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

  @keyframes bt-fadeUp   { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes bt-fadeIn   { from{opacity:0}to{opacity:1} }
  @keyframes bt-pulse    { 0%,100%{transform:scale(1)}50%{transform:scale(1.04)} }
  @keyframes bt-glow     { 0%,100%{opacity:0.5}50%{opacity:1} }
  @keyframes bt-shimmer  { 0%,100%{opacity:0.4}50%{opacity:0.9} }
  @keyframes bt-cityLight{ from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)} }
  @keyframes bt-timerRing{ from{stroke-dashoffset:283}to{stroke-dashoffset:0} }
  @keyframes bt-energyBar{ from{width:0}to{width:var(--energy-w)} }
  @keyframes bt-missionDone{ 0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)} }
  @keyframes bt-float    { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
  @keyframes bt-sparkle  { 0%{transform:translateY(0) scale(1);opacity:1}
                           100%{transform:translateY(-30px) scale(0);opacity:0} }

  .bt-btn {
    font-family: 'Noto Sans KR', sans-serif;
    border: none; border-radius: 14px; font-weight: 700;
    cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
  }
  .bt-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .bt-btn:active:not(:disabled){ transform: translateY(0); }
  .bt-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .bt-mission-card {
    display: flex; align-items: center; gap: 14px;
    border-radius: 16px; padding: 14px 16px;
    cursor: pointer; transition: all 0.22s; text-align: left;
    font-family: 'Noto Sans KR', sans-serif;
    border: none; width: 100%;
  }
  .bt-mission-card:hover:not(:disabled) { transform: translateX(3px); }
  .bt-mission-done { animation: bt-missionDone 0.4s ease; }
`;

// ── 도시 SVG (에너지 레벨에 따라 불빛 점등) ──────────────────
function CitySVG({ energyPct, completedCount }) {
  // 에너지 % → 건물 불빛 밝기
  const lit = Math.floor((energyPct / 100) * 12); // 최대 12개 창문
  const skyColor = energyPct < 30
    ? '#080E1A' : energyPct < 60
    ? '#0F1E2E' : energyPct < 85
    ? '#122840' : '#1A3850';

  return (
    <svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', height:'100%', display:'block' }}>
      <defs>
        <linearGradient id="btSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyColor}/>
          <stop offset="100%" stopColor="#0A1828"/>
        </linearGradient>
        <linearGradient id="btGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0A1420"/>
          <stop offset="100%" stopColor="#060C14"/>
        </linearGradient>
        <radialGradient id="btMoonG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFF8E0" stopOpacity="0.9"/>
          <stop offset="70%"  stopColor="#E8D4A0" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#E8D4A0" stopOpacity="0"/>
        </radialGradient>
        <filter id="btWinGlow">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="btCityGlow">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* 하늘 */}
      <rect width="360" height="200" fill="url(#btSky)"/>

      {/* 별 */}
      {[[30,20,1],[80,12,0.8],[130,18,1.1],[185,8,0.9],[230,16,1],[280,10,0.8],[320,22,1.2],[55,35,0.7],[155,30,0.8],[255,28,0.9],[340,14,0.7]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" opacity={0.35+(i%3)*0.15}
          style={{animation:`bt-shimmer ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`}}/>
      ))}

      {/* 달 */}
      <circle cx="310" cy="30" r="20" fill="url(#btMoonG)"/>
      <circle cx="310" cy="30" r="13" fill="#FFF8E0" opacity="0.9"/>

      {/* 지평선 도시 글로우 */}
      {energyPct > 20 && (
        <ellipse cx="180" cy="145" rx="180" ry="30"
          fill="#1E4060" opacity={energyPct/400}
          style={{animation:'bt-glow 3s ease-in-out infinite'}}/>
      )}

      {/* ── 건물들 ── */}
      {/* 원거리 스카이라인 */}
      {[[20,105,22,55],[55,95,18,65],[85,100,20,60],[330,98,22,62],[300,108,18,52],[270,102,20,58]].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} fill="#0C1A28" opacity="0.6"/>
      ))}

      {/* 중간 건물 */}
      <rect x="10"  y="88"  width="32" height="72" rx="2" fill="#0F1E30"/>
      <rect x="50"  y="72"  width="28" height="88" rx="2" fill="#0C1A28"/>
      <rect x="86"  y="82"  width="36" height="78" rx="2" fill="#0F1E30"/>
      <rect x="130" y="65"  width="30" height="95" rx="2" fill="#0C1A28"/>
      <rect x="168" y="55"  width="24" height="105" rx="2" fill="#101C2C"/>  {/* 중앙 타워 */}
      <rect x="200" y="70"  width="32" height="90"  rx="2" fill="#0C1A28"/>
      <rect x="240" y="78"  width="28" height="82"  rx="2" fill="#0F1E30"/>
      <rect x="276" y="85"  width="34" height="75"  rx="2" fill="#0C1A28"/>
      <rect x="318" y="90"  width="30" height="70"  rx="2" fill="#0F1E30"/>

      {/* 창문들 — 에너지에 따라 점등 */}
      {[
        // [x, y, w, h, idx] — 각 창문
        [14,95,8,6,0],  [24,95,8,6,1],  [14,107,8,6,2],  [24,107,8,6,3],
        [54,80,8,6,4],  [64,80,8,6,5],  [54,92,8,6,6],   [64,92,8,6,7],
        [90,90,10,6,8], [104,90,10,6,9],[90,102,10,6,10],[104,102,10,6,11],
        [133,73,8,6,0], [145,73,8,6,1], [133,85,8,6,2],  [145,85,8,6,3],
        [171,63,6,5,4], [171,75,6,5,5], [171,87,6,5,6],
        [204,78,9,6,7], [216,78,9,6,8], [204,90,9,6,9],
        [243,86,8,6,10],[255,86,8,6,11],[243,98,8,6,0],
        [280,93,9,6,1], [293,93,9,6,2], [280,105,9,6,3],
        [321,98,8,6,4], [333,98,8,6,5], [321,110,8,6,6],
      ].map(([x,y,w,h,idx],i)=>{
        const isLit = i < lit;
        const winColor = idx%3===0?'#F5C842':idx%3===1?'#7EB8F7':'#4ECDC4';
        return (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1"
            fill={isLit ? winColor : '#0A1420'}
            opacity={isLit ? 0.9 : 0.3}
            filter={isLit ? 'url(#btWinGlow)' : undefined}
            style={isLit ? {animation:`bt-cityLight 0.4s ease ${(i%5)*0.05}s both`} : {}}/>
        );
      })}

      {/* 에너지 100% 특수 이펙트 — 옥상 불빛 */}
      {energyPct >= 90 && (
        <g>
          <circle cx="180" cy="54" r="4" fill="#F5C842" opacity="0.9"
            style={{animation:'bt-glow 1.5s ease-in-out infinite'}}/>
          <circle cx="64"  cy="70" r="3" fill="#7EB8F7" opacity="0.8"
            style={{animation:'bt-glow 2s ease-in-out 0.3s infinite'}}/>
          <circle cx="296" cy="83" r="3" fill="#4ECDC4" opacity="0.8"
            style={{animation:'bt-glow 1.8s ease-in-out 0.6s infinite'}}/>
        </g>
      )}

      {/* 지면 */}
      <rect x="0" y="158" width="360" height="42" fill="url(#btGround)"/>

      {/* 도로 */}
      <rect x="0" y="162" width="360" height="3" fill="#0F1E30" opacity="0.8"/>
      {[30,90,150,210,270,330].map((x,i)=>(
        <rect key={i} x={x} y="162" width="18" height="2" fill="#F5C842" opacity="0.25"/>
      ))}

      {/* 가로등 */}
      {[40,140,220,320].map((x,i)=>(
        <g key={i}>
          <line x1={x} y1="158" x2={x} y2="138" stroke="#1E3A55" strokeWidth="2"/>
          <circle cx={x} cy="136" r="4" fill={energyPct>30?'#F5C842':'#1E3A55'}
            opacity={energyPct>30?0.9:0.4}
            filter={energyPct>30?'url(#btWinGlow)':undefined}/>
          {energyPct>30 && (
            <ellipse cx={x} cy="145" rx="8" ry="4" fill="#F5C842" opacity="0.12"/>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── 원형 타이머 SVG ──────────────────────────────────────────
function CircleTimer({ seconds, total, label, emoji }) {
  const r   = 52;
  const circ = 2 * Math.PI * r; // ≈ 326.7
  const offset = circ * (1 - seconds / total);
  const pct  = Math.round((seconds / total) * 100);
  const color = pct > 60 ? BT.electric : pct > 30 ? BT.amber : BT.energyLow;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0 10px' }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        {/* 배경 원 */}
        <circle cx="65" cy="65" r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
        {/* 진행 원 */}
        <circle cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ transition:'stroke-dashoffset 0.9s linear, stroke 0.5s' }}/>
        {/* 글로우 */}
        <circle cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="3" opacity="0.3"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ filter:`blur(4px)`, transition:'stroke-dashoffset 0.9s linear' }}/>
        {/* 이모지 + 숫자 */}
        <text x="65" y="55" textAnchor="middle" fontSize="22" dominantBaseline="middle">{emoji}</text>
        <text x="65" y="76" textAnchor="middle" fill="white" fontSize="22" fontWeight="700"
          fontFamily="'Noto Sans KR',sans-serif">{seconds}</text>
        <text x="65" y="92" textAnchor="middle" fill={BT.muted} fontSize="10"
          fontFamily="'Noto Sans KR',sans-serif">초 남음</text>
      </svg>
      <div style={{ fontSize:14, fontWeight:700, color:BT.cream,
        fontFamily:"'Noto Sans KR',sans-serif", marginTop:4 }}>{label}</div>
      <div style={{ fontSize:11, color:BT.muted, fontFamily:"'Noto Sans KR',sans-serif", marginTop:2 }}>
        진행 중 — 편안하게 해보세요
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// BurnoutGame — 메인
// ════════════════════════════════════════════════════════════
function BurnoutGame({ userTestResults = {}, onSessionEnd }) {
  const { useState, useEffect, useCallback, useRef } = React;

  const MISSIONS = {
    stretch_5:       { label:'5분 스트레칭',        emoji:'🧘', energy:10, duration:5,  desc:'몸의 긴장을 풀어줘요',         category:'body'    },
    walk_10:         { label:'10분 산책',            emoji:'🚶', energy:20, duration:10, desc:'바깥 공기를 마셔요',           category:'body'    },
    drink_water:     { label:'물 한 잔 마시기',      emoji:'💧', energy: 8, duration:1,  desc:'지금 바로 할 수 있어요',       category:'body'    },
    family_time:     { label:'소중한 사람과 대화',   emoji:'💬', energy:25, duration:15, desc:'연결이 에너지예요',             category:'social'  },
    deep_breath:     { label:'깊은 호흡 3회',        emoji:'🌬️', energy: 6, duration:2,  desc:'지금 여기에 집중해요',         category:'mind'    },
    meditation:      { label:'5분 명상',             emoji:'🕯️', energy:15, duration:5,  desc:'잠시 고요해져요',               category:'mind'    },
    gratitude:       { label:'감사 한 줄 쓰기',      emoji:'⭐', energy:12, duration:3,  desc:'작은 것도 괜찮아요',           category:'mind'    },
    grounding_54321: { label:'5-4-3-2-1 안정화',    emoji:'🌍', energy:18, duration:5,  desc:'불안을 잠재우는 접지 기법',     category:'anxiety' },
    body_scan:       { label:'바디 스캔',            emoji:'🔍', energy:14, duration:7,  desc:'몸의 긴장 부위를 확인해요',     category:'anxiety' },
    nature_view:     { label:'자연 사진/풍경 보기',  emoji:'🌿', energy:10, duration:3,  desc:'자연이 스트레스를 줄여줘요',   category:'stress'  },
    journal_5min:    { label:'5분 감정 일기',        emoji:'📓', energy:16, duration:5,  desc:'감정을 쓰면 마음이 가벼워져요', category:'stress'  },
    nap_20:          { label:'20분 낮잠',            emoji:'😴', energy:22, duration:20, desc:'짧은 낮잠이 회복력을 높여요',  category:'rest'    },
  };

  const CITY_LEVELS = [
    { level:1, name:'불 꺼진 도시',   minEnergy:  0, color:'#2A4060', desc:'지금 회복을 시작해요' },
    { level:2, name:'첫 불빛',        minEnergy: 30, color:'#3A5080', desc:'불빛이 켜지기 시작했어요' },
    { level:3, name:'깨어나는 도시',  minEnergy: 60, color:'#4A70A0', desc:'도시가 살아나고 있어요' },
    { level:4, name:'활기찬 거리',    minEnergy: 90, color:'#5A90C0', desc:'에너지가 넘쳐나요' },
    { level:5, name:'빛나는 메트로',  minEnergy:120, color:'#7EB8F7', desc:'완전히 회복되었어요 🎉' },
  ];

  const burnoutScore  = userTestResults?.BURNOUT ?? 50;
  const gad7Score     = userTestResults?.GAD7    ?? 0;
  const dass21Score   = userTestResults?.DASS21  ?? 0;
  const initialEnergy = Math.max(0, 100 - burnoutScore);

  // GAD7/DASS21/번아웃 점수에 따라 맞춤 미션 세트 선택
  const initialMissions = (() => {
    if (gad7Score >= 10)   return ['grounding_54321', 'deep_breath', 'body_scan', 'drink_water'];
    if (dass21Score >= 14) return ['nature_view', 'journal_5min', 'meditation', 'walk_10'];
    if (burnoutScore >= 60) return ['walk_10', 'drink_water', 'family_time', 'meditation'];
    return ['stretch_5', 'deep_breath', 'gratitude', 'drink_water'];
  })();

  const [energy,          setEnergy]          = useState(initialEnergy);
  const [completedToday,  setCompletedToday]  = useState([]);
  const [activeMission,   setActiveMission]   = useState(null);
  const [timer,           setTimer]           = useState(0);
  const [timerTotal,      setTimerTotal]       = useState(0);
  const [running,         setRunning]          = useState(false);
  const [showReport,      setShowReport]       = useState(false);
  const [sparkles,        setSparkles]         = useState([]);
  const [finishing,       setFinishing]        = useState(false);
  const [justCompleted,   setJustCompleted]    = useState(null);
  const intervalRef = useRef(null);

  // 스타일 주입
  useEffect(() => {
    const id = 'burnout-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = BURNOUT_STYLE;
      document.head.appendChild(s);
    }
  }, []);

  const cityLevel   = CITY_LEVELS.slice().reverse().find(c => energy >= c.minEnergy) || CITY_LEVELS[0];
  const nextLevel   = CITY_LEVELS.find(c => c.minEnergy > energy);
  const energyPct   = Math.min(100, Math.round((energy / 150) * 100));
  const toNextLevel = nextLevel ? nextLevel.minEnergy - energy : 0;

  // 에너지 바 색상
  const energyColor = energyPct < 30
    ? `linear-gradient(90deg, ${BT.energyLow}, #FF9A6B)`
    : energyPct < 60
    ? `linear-gradient(90deg, ${BT.energyMid}, #FFD080)`
    : energyPct < 85
    ? `linear-gradient(90deg, ${BT.energyHigh}, #7ADDD8)`
    : `linear-gradient(90deg, ${BT.energyFull}, #80FFB0)`;

  // 타이머
  useEffect(() => {
    if (!running || timer <= 0) return;
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          completeMission(activeMission);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, timer]);

  const spawnSparkles = (x, y) => {
    const id = Date.now();
    setSparkles(prev => [...prev, { id, x, y }]);
    setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== id)), 800);
  };

  const startMission = useCallback((code, e) => {
    if (completedToday.includes(code) || running) return;
    const m = MISSIONS[code];
    setActiveMission(code);
    const secs = m.duration * 3; // 데모용 단축
    setTimer(secs);
    setTimerTotal(secs);
    setRunning(true);
  }, [completedToday, running]);

  const completeMission = useCallback((code) => {
    if (!code) return;
    const m = MISSIONS[code];
    setCompletedToday(prev => [...prev, code]);
    setEnergy(e => Math.min(150, e + m.energy));
    setActiveMission(null);
    setJustCompleted(code);
    setTimeout(() => setJustCompleted(null), 1500);
  }, []);

  const skipMission = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setActiveMission(null);
    setTimer(0);
  };

  const handleFinish = async () => {
    setFinishing(true);
    const totalEnergyGained = completedToday.reduce((s,c) => s + MISSIONS[c].energy, 0);
    const score = Math.min(100, totalEnergyGained);
    try {
      const res = await GameEngine.saveSession({
        gameId:'burnout', moduleType:'MISSION', score,
        durationSec: completedToday.length * 60,
        metadata:{ missions_completed:completedToday.length, energy_gained:totalEnergyGained,
          city_level:cityLevel.level, burnout_score:burnoutScore },
      });
      onSessionEnd?.({ score, expGained:res.data?.expGained||0,
        leveledUp:res.data?.leveledUp||false, newAchievements:res.data?.newAchievements||[] });
    } catch {
      onSessionEnd?.({ score, expGained:0, leveledUp:false, newAchievements:[] });
    }
  };

  // ── 타이머 화면 ─────────────────────────────────────────
  if (running && activeMission) {
    const m = MISSIONS[activeMission];
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${BT.nightDeep}, ${BT.nightMid})`,
        overflow:'hidden' }}>

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 18px', background:'rgba(8,14,26,0.8)', backdropFilter:'blur(10px)',
          borderBottom:'1px solid rgba(126,184,247,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{fontSize:18}}>⚡</span>
            <span style={{ fontSize:14, fontWeight:700, color:BT.cream,
              fontFamily:"'Noto Serif KR',serif" }}>번아웃 회복</span>
          </div>
          <button onClick={skipMission} style={{ fontFamily:"'Noto Sans KR',sans-serif",
            background:'rgba(255,255,255,0.08)', color:BT.muted, border:'none',
            borderRadius:9, padding:'6px 14px', fontSize:12, cursor:'pointer' }}>
            건너뛰기
          </button>
        </div>

        {/* 타이머 중앙 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
          <CircleTimer seconds={timer} total={timerTotal}
            label={m.label} emoji={m.emoji}/>

          <div style={{ marginTop:20, textAlign:'center',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(126,184,247,0.1)',
            borderRadius:16, padding:'14px 24px', maxWidth:260 }}>
            <p style={{ fontSize:13, color:BT.muted, lineHeight:1.7, margin:0,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {m.desc}<br/>
              <span style={{color:BT.electric}}>완료하면 +{m.energy} 에너지</span>
            </p>
          </div>

          {/* 도시 미니 뷰 */}
          <div style={{ marginTop:24, width:'100%', maxWidth:320, height:80, borderRadius:14,
            overflow:'hidden', opacity:0.6 }}>
            <CitySVG energyPct={energyPct} completedCount={completedToday.length}/>
          </div>
        </div>
      </div>
    );
  }

  // ── 메인 화면 ────────────────────────────────────────────
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${BT.nightDeep}, ${BT.nightMid})`,
      overflow:'hidden', fontFamily:"'Noto Sans KR',sans-serif" }}>

      {/* 스파클 이펙트 */}
      {sparkles.map(s => (
        <div key={s.id} style={{ position:'fixed', left:s.x, top:s.y,
          pointerEvents:'none', fontSize:16, zIndex:999,
          animation:'bt-sparkle 0.7s ease forwards' }}>✨</div>
      ))}

      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 18px', background:'rgba(8,14,26,0.85)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid rgba(126,184,247,0.08)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{fontSize:18}}>⚡</span>
          <span style={{ fontSize:14, fontWeight:700, color:BT.cream,
            fontFamily:"'Noto Serif KR',serif" }}>번아웃 회복</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontSize:11, color:BT.muted, background:'rgba(126,184,247,0.08)',
            borderRadius:8, padding:'4px 10px', border:'1px solid rgba(126,184,247,0.12)' }}>
            {completedToday.length}/{initialMissions.length} 완료
          </div>
          <button onClick={() => setShowReport(true)} style={{ fontFamily:"'Noto Sans KR',sans-serif",
            background:'rgba(126,184,247,0.1)', color:BT.electricL, border:'1px solid rgba(126,184,247,0.18)',
            borderRadius:9, padding:'6px 12px', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            리포트
          </button>
        </div>
      </div>

      {/* 도시 비주얼 */}
      <div style={{ position:'relative', height:160, flexShrink:0 }}>
        <CitySVG energyPct={energyPct} completedCount={completedToday.length}/>

        {/* 도시 레벨 오버레이 */}
        <div style={{ position:'absolute', bottom:10, left:0, right:0,
          display:'flex', justifyContent:'center' }}>
          <div style={{ background:'rgba(8,14,26,0.75)', backdropFilter:'blur(8px)',
            borderRadius:12, padding:'6px 16px', textAlign:'center',
            border:`1px solid ${cityLevel.color}40`,
            animation:'bt-fadeIn 0.5s ease' }}>
            <div style={{ fontSize:12, fontWeight:700, color:cityLevel.color,
              fontFamily:"'Noto Serif KR',serif" }}>{cityLevel.name}</div>
            <div style={{ fontSize:9, color:BT.muted, fontFamily:"'Noto Sans KR',sans-serif" }}>
              {cityLevel.desc}
            </div>
          </div>
        </div>
      </div>

      {/* 에너지 바 */}
      <div style={{ padding:'12px 18px 8px', flexShrink:0,
        background:'rgba(8,14,26,0.6)', borderBottom:'1px solid rgba(126,184,247,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:700, color:BT.electricL }}>⚡ 회복 에너지</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700,
              color: energyPct < 30 ? BT.energyLow : energyPct < 60 ? BT.energyMid : BT.energyFull }}>
              {energy}
            </span>
            <span style={{ fontSize:10, color:BT.muted }}>/150</span>
            {nextLevel && (
              <span style={{ fontSize:9, color:BT.muted, background:'rgba(255,255,255,0.05)',
                borderRadius:6, padding:'2px 6px' }}>
                다음까지 {toNextLevel}
              </span>
            )}
          </div>
        </div>
        <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${energyPct}%`,
            background:energyColor, borderRadius:99,
            transition:'width 0.6s ease, background 0.5s' }}/>
        </div>
        {/* 레벨 마커 */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          {CITY_LEVELS.map((c,i) => (
            <div key={i} style={{ width:2, height:4,
              background: energy >= c.minEnergy ? BT.electric : 'rgba(255,255,255,0.15)',
              borderRadius:1, transition:'background 0.4s' }}/>
          ))}
        </div>
      </div>

      {/* 미션 목록 */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 24px' }}>

        {/* 완료 축하 메시지 */}
        {justCompleted && (
          <div style={{ background:'rgba(69,238,136,0.12)', border:'1px solid rgba(69,238,136,0.25)',
            borderRadius:12, padding:'10px 14px', marginBottom:12, textAlign:'center',
            animation:'bt-fadeUp 0.3s ease', fontSize:13, color:BT.energyFull,
            fontWeight:600 }}>
            ✅ {MISSIONS[justCompleted].label} 완료! +{MISSIONS[justCompleted].energy} 에너지
          </div>
        )}

        <div style={{ fontSize:12, fontWeight:700, color:BT.muted, marginBottom:10,
          fontFamily:"'Noto Sans KR',sans-serif" }}>
          오늘의 회복 미션
          {gad7Score >= 10 && <span style={{ marginLeft:6, fontSize:10, color:BT.amber, background:'rgba(245,200,66,0.12)', borderRadius:6, padding:'2px 7px', border:'1px solid rgba(245,200,66,0.2)' }}>불안 케어</span>}
          {dass21Score >= 14 && gad7Score < 10 && <span style={{ marginLeft:6, fontSize:10, color:BT.electricL, background:'rgba(126,184,247,0.1)', borderRadius:6, padding:'2px 7px', border:'1px solid rgba(126,184,247,0.2)' }}>스트레스 케어</span>}
          {burnoutScore >= 60 && gad7Score < 10 && dass21Score < 14 && <span style={{ marginLeft:6, fontSize:10, color:BT.energyLow, background:'rgba(255,107,107,0.1)', borderRadius:6, padding:'2px 7px', border:'1px solid rgba(255,107,107,0.2)' }}>번아웃 집중</span>}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {initialMissions.map(code => {
            const m    = MISSIONS[code];
            const done = completedToday.includes(code);
            const isActive = activeMission === code;

            return (
              <button key={code}
                className={`bt-mission-card ${done ? 'bt-mission-done' : ''}`}
                onClick={e => !done && !running && startMission(code, e)}
                disabled={done || running}
                style={{
                  background: done
                    ? 'rgba(69,238,136,0.08)'
                    : isActive
                    ? 'rgba(126,184,247,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done
                    ? 'rgba(69,238,136,0.25)'
                    : isActive
                    ? 'rgba(126,184,247,0.3)'
                    : 'rgba(255,255,255,0.08)'}`,
                  cursor: done || running ? 'default' : 'pointer',
                  opacity: running && !isActive ? 0.5 : 1,
                }}>

                {/* 이모지 아이콘 */}
                <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                  background: done
                    ? 'rgba(69,238,136,0.15)'
                    : 'rgba(126,184,247,0.08)',
                  border: `1px solid ${done ? 'rgba(69,238,136,0.2)' : 'rgba(126,184,247,0.1)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {done ? '✅' : m.emoji}
                </div>

                {/* 텍스트 */}
                <div style={{flex:1}}>
                  <div style={{ fontSize:13, fontWeight:700,
                    color: done ? BT.energyFull : BT.cream,
                    textDecoration: done ? 'none' : 'none',
                    marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:BT.muted, lineHeight:1.4 }}>
                    {m.desc} · {m.duration}분
                  </div>
                </div>

                {/* 에너지 뱃지 */}
                <div style={{ flexShrink:0, textAlign:'center' }}>
                  {done ? (
                    <div style={{ fontSize:11, color:BT.energyFull, fontWeight:700,
                      background:'rgba(69,238,136,0.1)', borderRadius:8,
                      padding:'3px 8px', border:'1px solid rgba(69,238,136,0.2)' }}>
                      완료
                    </div>
                  ) : (
                    <div style={{ fontSize:12, fontWeight:700,
                      color:BT.amber, background:'rgba(245,200,66,0.1)',
                      borderRadius:8, padding:'3px 8px',
                      border:'1px solid rgba(245,200,66,0.18)' }}>
                      +{m.energy}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 하단 CTA */}
        {completedToday.length > 0 && (
          <div style={{ marginTop:18, animation:'bt-fadeUp 0.4s ease' }}>
            <div style={{ background:'rgba(126,184,247,0.06)',
              border:'1px solid rgba(126,184,247,0.12)',
              borderRadius:16, padding:'14px 16px', marginBottom:12, textAlign:'center' }}>
              <div style={{ fontSize:13, color:BT.electricL, fontWeight:600, marginBottom:4 }}>
                오늘 +{completedToday.reduce((s,c)=>s+MISSIONS[c].energy,0)} 에너지 회복
              </div>
              <div style={{ fontSize:11, color:BT.muted }}>
                {completedToday.length}개 미션 완료 · 도시에 불이 켜졌어요
              </div>
            </div>

            <button className="bt-btn"
              onClick={() => setShowReport(true)}
              style={{ width:'100%', padding:'14px',
                background:`linear-gradient(135deg, #2A4A7A, #1E3A60)`,
                color:BT.electricL,
                border:'1px solid rgba(126,184,247,0.2)',
                boxShadow:'0 4px 16px rgba(126,184,247,0.15)',
                marginBottom:8, fontSize:14 }}>
              📊 회복 리포트 보기
            </button>

            <button className="bt-btn"
              onClick={() => window.open('https://maumful.com','_blank','noopener noreferrer')}
              style={{ width:'100%', padding:'11px',
                background:'rgba(255,255,255,0.05)',
                color:BT.muted, border:'1px solid rgba(255,255,255,0.08)',
                fontSize:13 }}>
              전문 상담사 연결 →
            </button>
          </div>
        )}
      </div>

      {/* 리포트 모달 */}
      {showReport && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:999, padding:20,
          animation:'bt-fadeIn 0.2s ease' }}>
          <div style={{ background:'#0F1E30', borderRadius:22, padding:'24px 22px',
            width:'100%', maxWidth:360, border:'1px solid rgba(126,184,247,0.15)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>

            {/* 모달 헤더 */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>
                {completedToday.length >= 3 ? '🏙️' : completedToday.length >= 1 ? '🌃' : '🌑'}
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:BT.cream,
                fontFamily:"'Noto Serif KR',serif", marginBottom:4 }}>
                회복 리포트
              </div>
              <div style={{ fontSize:12, color:cityLevel.color }}>{cityLevel.name}</div>
            </div>

            {/* 도시 미니 뷰 */}
            <div style={{ height:90, borderRadius:12, overflow:'hidden', marginBottom:16 }}>
              <CitySVG energyPct={energyPct} completedCount={completedToday.length}/>
            </div>

            {/* 스탯 */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
              {[
                { label:'회복 에너지', value:`${energy}점`, color:BT.energyFull },
                { label:'완료 미션',   value:`${completedToday.length}개`, color:BT.electric },
                { label:'에너지 획득', value:`+${completedToday.reduce((s,c)=>s+MISSIONS[c].energy,0)}`, color:BT.amber },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', background:'rgba(255,255,255,0.04)',
                  borderRadius:10, padding:'10px 14px',
                  border:'1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize:12, color:BT.muted }}>{r.label}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:r.color }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* 안내 */}
            <div style={{ background:'rgba(126,184,247,0.06)',
              border:'1px solid rgba(126,184,247,0.12)',
              borderRadius:10, padding:'10px 14px', fontSize:11,
              color:BT.muted, textAlign:'center', marginBottom:16, lineHeight:1.6 }}>
              더 깊은 회복이 필요하면 전문 상담사와 이야기해 보세요.
            </div>

            <button className="bt-btn"
              onClick={() => { setShowReport(false); if (completedToday.length > 0) handleFinish(); }}
              disabled={finishing}
              style={{ width:'100%', padding:'13px',
                background:completedToday.length > 0
                  ? `linear-gradient(135deg, ${BT.electric}, #5A90D0)`
                  : 'rgba(255,255,255,0.08)',
                color: completedToday.length > 0 ? 'white' : BT.muted,
                fontSize:14,
                boxShadow: completedToday.length > 0
                  ? '0 4px 16px rgba(126,184,247,0.3)' : 'none' }}>
              {finishing ? '저장 중...' : completedToday.length > 0 ? '✨ 경험치 받기' : '닫기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
