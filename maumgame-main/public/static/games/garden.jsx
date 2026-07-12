// ============================================================
// garden.jsx  —  마음의 정원 게임
// 모듈 A: 숨 쉬는 호수 (호흡 훈련)
// 모듈 B: 생각의 가지치기 (SCT × CBT 인지 교정)
// ============================================================

// ── 팔레트 (game_hub 와 동일) ────────────────────────────────
const GC = {
  sage:    '#4A7C59', sageL: '#7BA88A', sagePale: '#EAF2EC',
  cream:   '#FDFCF7', sand:  '#F5EFE0',
  dusty:   '#6B8FA8', dustyL:'#A8C4D4',
  amber:   '#D4954A', amberL:'#E8C47A',
  muted:   '#8A8A78', dark:  '#2C2C20',
  rose:    '#C97B8A', roseL: '#E8B4BE', rosePale:'#FCF0F2',
  night:   '#1A2A3A', nightM:'#2A3F55',
};

// ── 공통 버튼 스타일 ─────────────────────────────────────────
const gbtn = (bg, color='white', extra={}) => ({
  fontFamily: "'Noto Sans KR', sans-serif",
  cursor: 'pointer', border: 'none', outline: 'none',
  background: bg, color, borderRadius: 14,
  fontWeight: 700, transition: 'all 0.2s',
  ...extra,
});

// ════════════════════════════════════════════════════════════
// MODULE A — 숨 쉬는 호수 (호흡 훈련)
// 4-4-4 박스 호흡: 들이마시기 → 참기 → 내쉬기 → 참기
// ════════════════════════════════════════════════════════════

// ── 호수 SVG (컴포넌트 외부 정의 — 렌더링마다 재생성 방지) ──
function LakeSVG({ circleSize, currentPhase }) {
  const r = Math.round(100 * circleSize);
  const skyA = currentPhase === 'exhale' ? '#B0C8D8'
             : currentPhase === 'hold_in' ? '#3A6A90'
             : currentPhase === 'inhale' ? '#5A8AC0' : '#6B8FA8';

  return (
    <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="lakeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={skyA} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={GC.night} stopOpacity="0.6"/>
        </radialGradient>
        <radialGradient id="circleGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={skyA} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={GC.dusty} stopOpacity="0.95"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="160" cy="280" rx="200" ry="60" fill="url(#lakeGrad)" opacity="0.7"/>
      {[1, 2, 3].map(i => (
        <ellipse key={i} cx="160" cy={280 + i * 8} rx={180 - i * 20} ry={10 + i * 4}
          fill="none" stroke={GC.dustyL} strokeWidth="0.8" opacity={0.3 / i}/>
      ))}
      <circle cx="160" cy="150" r={r}
        fill="url(#circleGrad)" filter="url(#glow)"
        style={{ transition: 'r 0.8s ease-in-out' }} opacity="0.88"/>
      <circle cx="160" cy="150" r={r + 6}
        fill="none" stroke={skyA} strokeWidth="1.5" opacity="0.4"
        style={{ transition: 'r 0.8s ease-in-out' }}/>
      <circle cx="160" cy="150" r={r + 14}
        fill="none" stroke={skyA} strokeWidth="0.8" opacity="0.2"
        style={{ transition: 'r 0.8s ease-in-out' }}/>
      <circle cx="260" cy="50" r="16" fill="#E8E0C8" opacity="0.85"/>
      <circle cx="268" cy="45" r="13" fill={GC.night} opacity="0.15"/>
      {[[80,40],[130,25],[200,30],[240,80],[50,90]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="white" opacity={0.5 + (i%3)*0.15}
          style={{ animation: `shimmer ${1.5 + i * 0.4}s ease-in-out infinite`, animationDelay:`${i*0.3}s` }}/>
      ))}
      <ellipse cx="160" cy={265 + r * 0.2} rx={r * 0.6} ry={r * 0.15}
        fill={skyA} opacity="0.15" style={{ transition: 'all 0.8s ease-in-out' }}/>
    </svg>
  );
}

// 호흡법 정의
const BREATH_METHODS = [
  {
    id: 'box',
    name: t('박스 호흡', 'Box Breathing'),
    emoji: '⬜',
    desc: t('집중·스트레스 해소', 'Focus & stress relief'),
    phases: [
      { id:'inhale',   label:t('들이마시기', 'Inhale'), color:'#5A8AC0', dur:4 },
      { id:'hold_in',  label:t('참  기',     'Hold'),   color:'#4A7C59', dur:4 },
      { id:'exhale',   label:t('내  쉬기',   'Exhale'), color:'#9BA8B0', dur:4 },
      { id:'hold_out', label:t('참  기',     'Hold'),   color:'#6B8FA8', dur:4 },
    ],
  },
  {
    id: '478',
    name: t('4-7-8 호흡', '4-7-8 Breathing'),
    emoji: '🌙',
    desc: t('수면·깊은 이완', 'Sleep & deep relaxation'),
    phases: [
      { id:'inhale',   label:t('들이마시기', 'Inhale'), color:'#5A8AC0', dur:4 },
      { id:'hold_in',  label:t('참  기',     'Hold'),   color:'#4A7C59', dur:7 },
      { id:'exhale',   label:t('내  쉬기',   'Exhale'), color:'#9BA8B0', dur:8 },
    ],
  },
  {
    id: 'calm',
    name: t('빠른 안정', 'Quick Calm'),
    emoji: '⚡',
    desc: t('불안·공황 시 빠른 진정', 'Fast relief for anxiety & panic'),
    phases: [
      { id:'inhale',   label:t('들이마시기', 'Inhale'), color:'#5A8AC0', dur:2 },
      { id:'hold_in',  label:t('참  기',     'Hold'),   color:'#4A7C59', dur:1 },
      { id:'exhale',   label:t('내  쉬기',   'Exhale'), color:'#9BA8B0', dur:4 },
    ],
  },
];

const CYCLE_OPTIONS = [3, 5, 10];

function BreathingModule({ onComplete, onBack }) {
  const { useState, useEffect, useRef, useCallback } = React;

  const [methodId, setMethodId]   = useState(null);  // null = 선택 화면
  const [totalCycles, setTotalCycles] = useState(3);

  const selectedMethod = BREATH_METHODS.find(m => m.id === methodId);
  const PHASES = selectedMethod?.phases || BREATH_METHODS[0].phases;
  const TOTAL_CYCLES = totalCycles;

  const [phase, setPhase]       = useState(0);   // 0-3 인덱스
  const [tick, setTick]         = useState(0);    // 0 ~ dur-1
  const [cycles, setCycles]     = useState(0);    // 완료 사이클 수
  const [started, setStarted]   = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionSec, setSessionSec] = useState(0);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const current = PHASES[phase];
  const progress = started ? (tick + 1) / current.dur : 0; // 0~1

  // 호흡 원 크기: inhale=커짐, hold_in=유지, exhale=작아짐, hold_out=유지(작음)
  const circleSize = (() => {
    if (!started) return 0.55;
    if (current.id === 'inhale')    return 0.5 + (tick / (current.dur - 1)) * 0.45;
    if (current.id === 'hold_in')   return 0.95;
    if (current.id === 'exhale')    return 0.95 - (tick / (current.dur - 1)) * 0.45;
    return 0.5; // hold_out
  })();

  // 배경 하늘 색상 보간
  const skyColorTop = current.color;

  const tick_ = useCallback(() => {
    setTick(prev => {
      const nextTick = prev + 1;
      if (nextTick >= PHASES[phase].dur) {
        // 다음 페이즈로
        const nextPhase = (phase + 1) % PHASES.length;
        setPhase(nextPhase);
        if (nextPhase === 0) {
          // 사이클 완료
          setCycles(c => {
            const newC = c + 1;
            if (newC >= TOTAL_CYCLES) {
              clearInterval(intervalRef.current);
              setFinished(true);
              setSessionSec(Math.round((Date.now() - startTimeRef.current) / 1000));
            }
            return newC;
          });
        }
        return 0;
      }
      return nextTick;
    });
  }, [phase]);

  useEffect(() => {
    if (!started || finished) return;
    intervalRef.current = setInterval(tick_, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, finished, tick_]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setPhase(0); setTick(0); setCycles(0);
    setStarted(true); setFinished(false);
  };

  const handleFinish = async () => {
    const score = cycles * 30 + Math.min(sessionSec, 60);
    try {
      const res = await GameEngine.saveSession({
        gameId: 'garden', moduleType: 'breathing',
        score, durationSec: sessionSec,
        metadata: { cycles_completed: cycles },
      });
      onComplete?.({ score, expGained: res.data?.expGained || 0, leveledUp: res.data?.leveledUp, newAchievements: res.data?.newAchievements || [] });
    } catch {
      onComplete?.({ score, expGained: 0, leveledUp: false, newAchievements: [] });
    }
  };

  // LakeSVG는 모듈 상단에 정의되어 있음

  // ── 호흡법 + 사이클 선택 화면 ────────────────────────────
  if (!methodId) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${GC.night}, ${GC.nightM})`,
        padding:'0 0 24px',
      }}>
        <button onClick={onBack} style={{
          ...gbtn('rgba(255,255,255,0.1)', 'rgba(255,255,255,0.8)'),
          margin:'16px 0 0 16px', padding:'7px 14px', fontSize:12, borderRadius:10, width:'fit-content',
          backdropFilter:'blur(8px)',
        }}>{t('← 뒤로', '← Back')}</button>

        <div style={{ flex:1, padding:'20px 20px 0', overflowY:'auto' }}>
          <h2 style={{
            fontSize:20, fontWeight:700, color:'white', marginBottom:6,
            fontFamily:"'Noto Serif KR', serif",
          }}>{t('호흡법 선택', 'Select Breathing Method')}</h2>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:20, lineHeight:1.7 }}>
            {t('오늘 컨디션에 맞는 호흡법을 선택하세요.', 'Choose a method that suits how you feel today.')}
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
            {BREATH_METHODS.map(m => (
              <button key={m.id} onClick={() => setMethodId(m.id)}
                style={{
                  ...gbtn('rgba(255,255,255,0.07)', 'white', { textAlign:'left', borderRadius:16 }),
                  padding:'16px 18px',
                  border:'1px solid rgba(255,255,255,0.12)',
                  display:'flex', alignItems:'center', gap:14,
                }}>
                <span style={{ fontSize:28, lineHeight:1 }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{m.desc}</div>
                  <div style={{ fontSize:10, color:GC.dustyL, marginTop:4, fontWeight:600 }}>
                    {m.phases.map(p => p.dur).join('-')} {t('박자', 'beats')}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:10 }}>
            {t('사이클 수 선택', 'Select Number of Cycles')}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {CYCLE_OPTIONS.map(n => (
              <button key={n} onClick={() => setTotalCycles(n)}
                style={{
                  ...gbtn(
                    totalCycles === n ? `linear-gradient(135deg, ${GC.dusty}, ${GC.dustyL})` : 'rgba(255,255,255,0.08)',
                    totalCycles === n ? 'white' : 'rgba(255,255,255,0.6)',
                    { borderRadius:10, flex:1 }
                  ),
                  padding:'10px 0', fontSize:14, fontWeight:700,
                  border: totalCycles === n ? 'none' : '1px solid rgba(255,255,255,0.12)',
                }}>
                {n}{t('회', 'x')}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:8, textAlign:'center' }}>
            {t(
              `약 ${Math.round(BREATH_METHODS[0].phases.reduce((s,p)=>s+p.dur,0) * totalCycles / 60)}~${Math.round(BREATH_METHODS[1].phases.reduce((s,p)=>s+p.dur,0) * totalCycles / 60 + 1)}분 소요`,
              `About ${Math.round(BREATH_METHODS[0].phases.reduce((s,p)=>s+p.dur,0) * totalCycles / 60)}–${Math.round(BREATH_METHODS[1].phases.reduce((s,p)=>s+p.dur,0) * totalCycles / 60 + 1)} min`
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 완료 화면 ─────────────────────────────────────────────
  if (finished) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:`linear-gradient(160deg, ${GC.nightM}, ${GC.dusty})`,
        padding:32, textAlign:'center', color:'white',
        animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🌊</div>
        <h2 style={{ fontSize:24, fontWeight:700, marginBottom:10, fontFamily:"'Noto Serif KR', serif" }}>
          {t('호흡 훈련 완료', 'Breathing Session Complete')}
        </h2>
        <p style={{ fontSize:14, opacity:0.8, lineHeight:1.8, marginBottom:28 }}>
          {selectedMethod?.name} · {t(`${cycles}번의 사이클을 마쳤어요.`, `${cycles} cycles completed.`)}<br/>
          {t(`${GameEngine.formatDuration(sessionSec)} 동안 마음이 고요해졌습니다.`, `Your mind became calm for ${GameEngine.formatDuration(sessionSec)}.`)}
        </p>
        <div style={{
          background:'rgba(255,255,255,0.12)', borderRadius:16,
          padding:'16px 28px', marginBottom:28,
          display:'flex', gap:28,
        }}>
          <div><div style={{ fontSize:24, fontWeight:700 }}>{cycles}{t('회', 'x')}</div><div style={{ fontSize:12, opacity:0.7 }}>{t('완료 사이클', 'Cycles Done')}</div></div>
          <div style={{ width:1, background:'rgba(255,255,255,0.2)' }}/>
          <div><div style={{ fontSize:24, fontWeight:700 }}>{GameEngine.formatDuration(sessionSec)}</div><div style={{ fontSize:12, opacity:0.7 }}>{t('수련 시간', 'Session Time')}</div></div>
        </div>
        <button onClick={handleFinish}
          style={{ ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`), padding:'14px 40px', fontSize:15 }}>
          {t('경험치 받기', 'Claim EXP')} →
        </button>
      </div>
    );
  }

  // ── 메인 UI ───────────────────────────────────────────────
  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${GC.night}, ${GC.nightM})`,
      position:'relative', overflow:'hidden',
    }}>

      {/* 뒤로 */}
      <button onClick={onBack} style={{
        ...gbtn('rgba(255,255,255,0.1)', 'rgba(255,255,255,0.8)'),
        position:'absolute', top:16, left:16, zIndex:10,
        padding:'7px 14px', fontSize:12, borderRadius:10,
        backdropFilter:'blur(8px)',
      }}>{t('← 뒤로', '← Back')}</button>

      {/* 사이클 카운터 */}
      <div style={{
        position:'absolute', top:16, right:16, zIndex:10,
        background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)',
        borderRadius:10, padding:'6px 14px',
        color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:600,
      }}>
        {started ? `${cycles} / ${TOTAL_CYCLES} ${t('사이클', 'cycles')}` : t('숨 쉬는 호수', 'Breathing Lake')}
      </div>

      {/* 호수 비주얼 */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px 20px' }}>
        <div style={{ width:'100%', maxWidth:320, aspectRatio:'1', position:'relative' }}>
          <LakeSVG circleSize={circleSize} currentPhase={current.id} />
          {/* 페이즈 텍스트 (원 위) */}
          {started && (
            <div style={{
              position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%, -50%)',
              textAlign:'center', pointerEvents:'none',
            }}>
              <div style={{
                fontSize:18, fontWeight:700, color:'white',
                fontFamily:"'Noto Serif KR', serif",
                textShadow:'0 2px 8px rgba(0,0,0,0.4)',
                animation:'fadeUp 0.3s ease',
              }}>
                {current.label}
              </div>
              <div style={{ fontSize:28, fontWeight:300, color:'rgba(255,255,255,0.9)', marginTop:4 }}>
                {current.dur - tick}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 페이즈 인디케이터 */}
      {started && (
        <div style={{ display:'flex', justifyContent:'center', gap:8, paddingBottom:12 }}>
          {PHASES.map((p, i) => (
            <div key={p.id} style={{
              height:4, borderRadius:100,
              width: i === phase ? 28 : 16,
              background: i <= phase ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }}/>
          ))}
        </div>
      )}

      {/* 시작/안내 */}
      <div style={{
        background:'rgba(0,0,0,0.3)', backdropFilter:'blur(12px)',
        padding:'20px 24px', textAlign:'center',
      }}>
        {!started ? (
          <div>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.7, marginBottom:16 }}>
              {t('호수처럼 고요하게.', 'Be still, like a calm lake.')}<br/>
              {t('4초 들이마시고 · 4초 참고 · 4초 내쉬어요', 'Inhale 4s · Hold 4s · Exhale 4s')}
            </p>
            <button onClick={handleStart}
              style={{ ...gbtn(`linear-gradient(135deg, ${GC.dusty}, ${GC.dustyL})`), padding:'12px 36px', fontSize:14, borderRadius:12 }}>
              {t('호흡 시작하기', 'Start Breathing')}
            </button>
          </div>
        ) : (
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>
            {t(`눈을 감아도 좋아요 · ${TOTAL_CYCLES - cycles}사이클 남았어요`, `You can close your eyes · ${TOTAL_CYCLES - cycles} cycles left`)}
          </p>
        )}
      </div>
    </div>
  );
}


// ── 나무 SVG (컴포넌트 외부 정의 — 렌더링마다 재생성 방지) ──
function TreeSVG({ branchCount = 0, totalBranches = 3 }) {
  const FLOWER_POS = [
    { cx:160, cy:72,  r:18 },
    { cx:120, cy:95,  r:14 },
    { cx:198, cy:90,  r:15 },
  ];
  const PETAL_COLORS = ['#F9A8D4','#FCD34D','#86EFAC'];

  return (
    <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B6B4A"/>
          <stop offset="100%" stopColor="#5A3E28"/>
        </linearGradient>
        <filter id="bloom">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="320" height="220" fill={branchCount === 0 ? '#D8CFC0' : branchCount === 1 ? '#C8D8B8' : '#B0CCB0'} opacity="0.3"/>
      <ellipse cx="160" cy="205" rx="140" ry="20" fill="#7A9A6A" opacity={0.3 + branchCount * 0.15}/>
      {branchCount > 0 && [40,80,130,185,235,275].map((x,i)=>(
        <g key={x}>
          <line x1={x} y1="205" x2={x-5} y2={196-i%2*4} stroke="#5A8A4A" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1={x} y1="205" x2={x+4} y2={197-i%3*3} stroke="#5A8A4A" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      ))}
      <rect x="148" y="148" width="24" height="57" rx="8" fill="url(#trunkGrad)"/>
      <path d="M 160 170 Q 130 155 110 140" fill="none"
        stroke={branchCount >= 2 ? '#7B5F3A' : '#9A8070'} strokeWidth="6" strokeLinecap="round"
        style={{ transition:'stroke 0.8s' }}/>
      <path d="M 160 163 Q 188 150 205 138" fill="none"
        stroke={branchCount >= 3 ? '#7B5F3A' : '#9A8070'} strokeWidth="6" strokeLinecap="round"
        style={{ transition:'stroke 0.8s' }}/>
      <path d="M 160 155 Q 160 130 160 115" fill="none"
        stroke={branchCount >= 1 ? '#7B5F3A' : '#9A8070'} strokeWidth="7" strokeLinecap="round"
        style={{ transition:'stroke 0.8s' }}/>
      {[{cx:158,cy:115,rx:42,ry:36},{cx:118,cy:132,rx:30,ry:26},{cx:200,cy:128,rx:30,ry:25}].map(({cx,cy,rx,ry},i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill={branchCount > i ? '#4A8A3A' : '#8A9A7A'}
          opacity={branchCount > i ? 0.9 : 0.5}
          style={{ transition:'fill 0.8s, opacity 0.8s' }}/>
      ))}
      {FLOWER_POS.slice(0, branchCount).map(({cx,cy,r}, bi) => {
        const pc = PETAL_COLORS[bi % PETAL_COLORS.length];
        return (
          <g key={bi} filter="url(#bloom)" style={{ animation:'fadeUp 0.6s ease' }}>
            {[0,60,120,180,240,300].map(a=>(
              <ellipse key={a}
                cx={cx + Math.cos(a*Math.PI/180)*(r*0.55)}
                cy={cy + Math.sin(a*Math.PI/180)*(r*0.55)}
                rx={r*0.45} ry={r*0.35}
                fill={pc} opacity="0.92"
                transform={`rotate(${a}, ${cx + Math.cos(a*Math.PI/180)*(r*0.55)}, ${cy + Math.sin(a*Math.PI/180)*(r*0.55)})`}/>
            ))}
            <circle cx={cx} cy={cy} r={r*0.3} fill="#FFF8A0"/>
          </g>
        );
      })}
      {branchCount >= 2 && (
        <g fill={PETAL_COLORS[0]} opacity="0.8"
          style={{ animation:'float 3s ease-in-out infinite', transformOrigin:'80px 90px' }}>
          <path d="M 80 90 Q 68 82 72 72 Q 80 80 80 90"/>
          <path d="M 80 90 Q 92 82 88 72 Q 80 80 80 90"/>
          <line x1="80" y1="90" x2="80" y2="96" stroke="#8A5A5A" strokeWidth="1"/>
        </g>
      )}
      {branchCount >= 3 && (
        <g fill={PETAL_COLORS[2]} opacity="0.75"
          style={{ animation:'float 2.5s ease-in-out infinite 0.7s', transformOrigin:'235px 110px' }}>
          <path d="M 235 110 Q 225 103 228 95 Q 235 102 235 110"/>
          <path d="M 235 110 Q 245 103 242 95 Q 235 102 235 110"/>
        </g>
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
// MODULE B — 생각의 가지치기 (SCT × CBT 인지 교정)
// 부정적 생각 → AI 긍정 확언 변환 → 나무에 꽃 피우기
// ════════════════════════════════════════════════════════════

// 검사 점수별 씨앗 생각 풀 — PHQ9/GAD7 기반 개인화
const SEED_THOUGHT_POOLS = {
  anxiety: [ // GAD7 >= 10
    t('모든 일이 잘못될 것 같다.', 'Everything seems to go wrong.'),
    t('나는 통제력을 잃어가고 있다.', 'I feel like I am losing control.'),
    t('걱정을 멈출 수가 없다.', 'I cannot stop worrying.'),
    t('나는 늘 최악을 대비해야 한다.', 'I always have to prepare for the worst.'),
    t('긴장을 풀면 무언가 잘못될 것 같다.', 'If I relax, something will go wrong.'),
    t('나는 아무것도 확실하게 할 수 없다.', 'I cannot do anything with certainty.'),
  ],
  depression_severe: [ // PHQ9 >= 15
    t('나는 항상 실패할 것이다.', 'I will always fail.'),
    t('아무것도 나아지지 않을 것이다.', 'Nothing will ever get better.'),
    t('나는 아무에게도 필요하지 않다.', 'Nobody needs me.'),
    t('이 감정은 영원히 끝나지 않을 것이다.', 'This feeling will never end.'),
    t('나는 혼자서는 아무것도 할 수 없다.', 'I cannot do anything on my own.'),
    t('내 미래는 어둡다.', 'My future is dark.'),
  ],
  depression_mild: [ // PHQ9 5~14
    t('나는 항상 일을 망친다.', 'I always mess things up.'),
    t('아무도 나를 이해하지 못한다.', 'Nobody understands me.'),
    t('나는 쓸모없는 사람이다.', 'I am useless.'),
    t('나는 변하지 못할 것이다.', 'I will never change.'),
    t('나는 행복할 자격이 없다.', 'I do not deserve to be happy.'),
    t('모든 것이 내 탓이다.', 'Everything is my fault.'),
  ],
  default: [ // PHQ9 < 5 또는 검사 없음
    t('나는 더 잘할 수 있었는데.', 'I could have done better.'),
    t('왜 나만 이럴까.', 'Why does this only happen to me?'),
    t('나는 너무 민감한 것 같다.', 'I think I am too sensitive.'),
    t('다른 사람들은 다 잘 사는 것 같다.', 'Everyone else seems to be doing fine.'),
    t('나는 게으른 것 같다.', 'I think I am lazy.'),
    t('나는 좋은 사람이 아닌 것 같다.', 'I do not think I am a good person.'),
  ],
};

function getSeedThoughts(userTestScores) {
  const phq9 = userTestScores?.PHQ9 ?? null;
  const gad7 = userTestScores?.GAD7 ?? null;
  if (gad7 !== null && gad7 >= 10) return SEED_THOUGHT_POOLS.anxiety;
  if (phq9 !== null && phq9 >= 15)  return SEED_THOUGHT_POOLS.depression_severe;
  if (phq9 !== null && phq9 >= 5)   return SEED_THOUGHT_POOLS.depression_mild;
  return SEED_THOUGHT_POOLS.default;
}

function CBTModule({ onComplete, onBack, userTestScores = {} }) {
  const { useState, useEffect, useRef } = React;

  const TOTAL_BRANCHES = 3;

  const SEED_THOUGHTS = getSeedThoughts(userTestScores);

  const [step, setStep]         = useState('intro');   // intro | input | transform | confirm | done | crisis
  const [crisis, setCrisis]     = useState(null);      // ⚠️ 위기 신호 감지 시 안전 안내 데이터
  const [branches, setBranches] = useState([]);         // 완성된 가지들
  const [current, setCurrent]   = useState({ original:'', transformed:'', editing:false });
  const [inputText, setInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState('');
  const [sessionSec, setSessionSec] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSec(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectSeed = (text) => {
    setInputText(text);
    setStep('input');
  };

  const handleRequestAI = async () => {
    const text = inputText.trim();
    if (!text || text.length < 3) { setAiError(t('생각을 더 써주세요', 'Please write a bit more')); return; }
    setAiLoading(true); setAiError('');
    try {
      const res = await GameEngine.transformSentence(text);
      // ⚠️ 안전: 위기 신호가 감지되면 긍정 확언으로 변환하지 않고 안전 안내 화면으로 분기
      if (res.success && res.data?.crisis) {
        setCrisis(res.data);
        setStep('crisis');
        setAiLoading(false);
        return;
      }
      if (res.success) {
        setCurrent({ original: text, transformed: res.data.result, editing: false });
        setStep('transform');
      } else {
        setAiError(res.error || t('AI 변환 실패', 'AI transformation failed'));
      }
    } catch {
      setAiError(t('연결 오류. 다시 시도해주세요.', 'Connection error. Please try again.'));
    }
    setAiLoading(false);
  };

  const handleAccept = (transformed) => {
    const newBranch = { original: current.original, transformed };
    setBranches(prev => {
      const next = [...prev, newBranch];
      if (next.length >= TOTAL_BRANCHES) {
        setFinished(true);
        setStep('done');
      } else {
        setInputText('');
        setStep('input');
      }
      return next;
    });
    setCurrent({ original:'', transformed:'', editing:false });
  };

  const handleFinish = async () => {
    const score = branches.length * 40 + Math.min(sessionSec * 0.5, 40);
    try {
      const res = await GameEngine.saveSession({
        gameId:'garden', moduleType:'cbt',
        score: Math.round(score), durationSec: sessionSec,
        metadata: { branches_completed: branches.length, branch_texts: branches.map(b=>b.original) },
      });
      onComplete?.({ score:Math.round(score), expGained:res.data?.expGained||0, leveledUp:res.data?.leveledUp, newAchievements:res.data?.newAchievements||[] });
    } catch {
      onComplete?.({ score:Math.round(score), expGained:0, leveledUp:false, newAchievements:[] });
    }
  };

  // TreeSVG는 모듈 상단에 정의되어 있음

  // ── 완료 화면 ─────────────────────────────────────────────
  // ⚠️ 안전 안내 — 위기 신호 감지 시 변환 대신 이 화면. 게임 요소(경험치·다음단계) 일절 노출하지 않음.
  if (step === 'crisis' && crisis) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        background:'linear-gradient(160deg, #FFF6F2, #FFEDE4)',
        padding:24, animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🫂</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#8A3A1E', marginBottom:12, fontFamily:"'Noto Serif KR', serif" }}>
            {t('잠시 멈출게요', "Let's pause here")}
          </h2>
          <p style={{ fontSize:14, color:'#7A4A38', lineHeight:1.9, whiteSpace:'pre-wrap' }}>
            {crisis.message}
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
          {(crisis.resources || []).map((r, i) => (
            <a key={i} href={`tel:${String(r.tel).replace(/-/g,'')}`}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'#fff', border:'1px solid #F0CDBB', borderRadius:14,
                padding:'14px 16px', textDecoration:'none',
              }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#8A3A1E' }}>{r.label}</span>
              <span style={{ fontSize:15, fontWeight:800, color:'#C0552B' }}>📞 {r.tel}</span>
            </a>
          ))}
        </div>

        <p style={{ fontSize:12, color:'#A2705C', textAlign:'center', lineHeight:1.7, marginBottom:16 }}>
          {t('24시간 언제든 연결됩니다. 지금 바로 이야기해도 괜찮아요.', 'Available 24/7. It is okay to reach out right now.')}
        </p>

        <button onClick={() => { setCrisis(null); setInputText(''); setStep('input'); }}
          style={{
            padding:'12px', borderRadius:12, border:'1px solid #E5C4B4',
            background:'transparent', color:'#A2705C', fontSize:13, cursor:'pointer',
          }}>
          {t('돌아가기', 'Go back')}
        </button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${GC.sagePale}, #D4EAD0)`,
        padding:24, animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ height:180 }}><TreeSVG branchCount={TOTAL_BRANCHES}/></div>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:GC.dark, marginBottom:8, fontFamily:"'Noto Serif KR', serif" }}>
            {t('꽃이 피었습니다 🌸', 'Flowers Have Bloomed 🌸')}
          </h2>
          <p style={{ fontSize:13, color:GC.muted, lineHeight:1.8 }}>
            {t(`${TOTAL_BRANCHES}개의 생각을 새롭게 바꿨어요.`, `You transformed ${TOTAL_BRANCHES} thoughts.`)}<br/>
            {t('이 변화가 마음에 스며들고 있어요.', 'This change is seeping into your heart.')}
          </p>
        </div>

        {/* 변환 요약 */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {branches.map((b, i) => (
            <div key={i} style={{
              background:'white', borderRadius:14, padding:'14px 16px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:GC.muted, marginBottom:5 }}>{t('이전 생각', 'Previous Thought')}</div>
              <div style={{ fontSize:13, color:GC.muted, marginBottom:8, textDecoration:'line-through' }}>{b.original}</div>
              <div style={{ fontSize:11, fontWeight:700, color:GC.sage, marginBottom:5 }}>{t('새로운 생각', 'New Thought')} ✓</div>
              <div style={{ fontSize:13, color:GC.dark, fontWeight:500, lineHeight:1.6 }}>{b.transformed}</div>
            </div>
          ))}
        </div>

        <button onClick={handleFinish}
          style={{ ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`), padding:'14px', fontSize:15, textAlign:'center' }}>
          {t('경험치 받기', 'Claim EXP')} →
        </button>
      </div>
    );
  }

  // ── 메인 UI ───────────────────────────────────────────────
  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, #F0EDE5, ${GC.cream})`,
      overflow:'hidden',
    }}>

      {/* 헤더 */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px',
        background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
        borderBottom:'1px solid rgba(0,0,0,0.06)',
      }}>
        <button onClick={onBack} style={{
          ...gbtn('rgba(0,0,0,0.06)', GC.muted, { borderRadius:9 }),
          padding:'6px 14px', fontSize:12,
        }}>{t('← 뒤로', '← Back')}</button>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Array.from({length: TOTAL_BRANCHES}).map((_,i) => (
            <div key={i} style={{
              width:10, height:10, borderRadius:'50%',
              background: i < branches.length ? GC.sage : 'rgba(0,0,0,0.12)',
              transition:'background 0.4s',
            }}/>
          ))}
        </div>
        <div style={{ fontSize:11, color:GC.muted, fontWeight:600 }}>
          {branches.length}/{TOTAL_BRANCHES} {t('완성', 'done')}
        </div>
      </div>

      {/* 나무 비주얼 */}
      <div style={{ height:190, padding:'0 24px', flexShrink:0 }}>
        <TreeSVG branchCount={branches.length}/>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px 24px' }}>

        {/* 인트로 */}
        {step === 'intro' && (
          <div style={{ animation:'fadeUp 0.4s ease' }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:GC.dark, marginBottom:8, fontFamily:"'Noto Serif KR', serif" }}>
              {t('생각의 가지치기', 'Thought Pruning')}
            </h2>
            <p style={{ fontSize:13, color:GC.muted, lineHeight:1.75, marginBottom:20 }}>
              {t('마음속 부정적인 생각을 하나씩 꺼내어', 'Bring out your negative thoughts one by one')}<br/>
              {t('새로운 시선으로 바라봐요.', 'and see them from a new perspective.')}<br/>
              {t(`${TOTAL_BRANCHES}개의 가지에 꽃을 피워보세요.`, `Let flowers bloom on ${TOTAL_BRANCHES} branches.`)}
            </p>
            <div style={{ fontSize:12, fontWeight:700, color:GC.muted, marginBottom:10 }}>{t('자주 드는 생각을 선택하거나', 'Choose a common thought, or')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {SEED_THOUGHTS.slice(0,4).map(t => (
                <button key={t} onClick={() => handleSelectSeed(t)}
                  style={{
                    ...gbtn('rgba(255,255,255,0.8)', GC.dark, { fontWeight:400, textAlign:'left', borderRadius:12 }),
                    padding:'11px 14px', fontSize:13, lineHeight:1.5,
                    border:'1px solid rgba(0,0,0,0.08)',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
                  }}>
                  "{t}"
                </button>
              ))}
            </div>
            <button onClick={() => { setInputText(''); setStep('input'); }}
              style={{ ...gbtn(GC.sagePale, GC.sage, { borderRadius:12 }), padding:'10px 20px', fontSize:13, width:'100%' }}>
              {t('직접 입력하기', 'Type your own')}
            </button>
          </div>
        )}

        {/* 입력 */}
        {step === 'input' && (
          <div style={{ animation:'fadeUp 0.4s ease' }}>
            <div style={{ fontSize:13, fontWeight:700, color:GC.dark, marginBottom:6 }}>
              {t(`${branches.length + 1}번째 생각`, `Thought #${branches.length + 1}`)}
            </div>
            <p style={{ fontSize:12, color:GC.muted, marginBottom:14 }}>
              {t('지금 마음속에 자주 떠오르는 부정적인 생각을 솔직하게 써주세요.', 'Write down a negative thought that often comes to mind, honestly.')}
            </p>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={t('예) 나는 늘 혼자인 것 같다.', 'e.g. I always feel alone.')}
              rows={3}
              style={{
                width:'100%', padding:'13px 14px',
                border:`1.5px solid ${GC.sage}44`, borderRadius:12,
                fontSize:14, fontFamily:"'Noto Sans KR', sans-serif",
                outline:'none', resize:'none', lineHeight:1.65,
                background:'rgba(255,255,255,0.9)',
                color:GC.dark, marginBottom:12,
              }}
              onFocus={e => e.target.style.borderColor = GC.sage}
              onBlur={e => e.target.style.borderColor = `${GC.sage}44`}
            />
            {aiError && (
              <div style={{ fontSize:12, color:'#C05050', marginBottom:10 }}>{aiError}</div>
            )}
            <div style={{ display:'flex', gap:9 }}>
              <button onClick={() => setStep('intro')}
                style={{ ...gbtn('rgba(0,0,0,0.07)', GC.muted, { borderRadius:12, flex:1 }), padding:'11px' }}>
                {t('다시 선택', 'Re-select')}
              </button>
              <button onClick={handleRequestAI} disabled={aiLoading || !inputText.trim()}
                style={{
                  ...gbtn(
                    aiLoading || !inputText.trim() ? 'rgba(0,0,0,0.1)' : `linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`,
                    aiLoading || !inputText.trim() ? GC.muted : 'white',
                    { borderRadius:12, flex:2 }
                  ), padding:'11px',
                }}>
                {aiLoading ? t('변환 중...', 'Transforming...') : `🌱 ${t('AI로 새롭게 보기', 'See it differently with AI')}`}
              </button>
            </div>
          </div>
        )}

        {/* AI 변환 결과 */}
        {step === 'transform' && (
          <div style={{ animation:'fadeUp 0.4s ease' }}>
            {/* 이전 생각 */}
            <div style={{
              background:'rgba(0,0,0,0.05)', borderRadius:12,
              padding:'12px 14px', marginBottom:14,
              borderLeft:`3px solid ${GC.muted}`,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:GC.muted, marginBottom:5 }}>{t('이전 생각', 'Previous Thought')}</div>
              <div style={{ fontSize:13, color:GC.muted, lineHeight:1.6, textDecoration:'line-through' }}>
                {current.original}
              </div>
            </div>

            {/* 새로운 생각 */}
            <div style={{
              background:`${GC.sagePale}CC`, borderRadius:12,
              padding:'14px', marginBottom:16,
              border:`1.5px solid ${GC.sage}44`,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:GC.sage, marginBottom:8 }}>
                🌸 {t('새로운 시선', 'New Perspective')}
              </div>
              {current.editing ? (
                <textarea
                  value={current.transformed}
                  onChange={e => setCurrent(c => ({...c, transformed:e.target.value}))}
                  rows={3}
                  style={{
                    width:'100%', padding:'10px', border:`1px solid ${GC.sage}66`,
                    borderRadius:9, fontSize:13, fontFamily:"'Noto Sans KR', sans-serif",
                    outline:'none', resize:'none', lineHeight:1.65,
                    background:'white', color:GC.dark,
                  }}
                />
              ) : (
                <div style={{ fontSize:14, color:GC.dark, lineHeight:1.75, fontWeight:500 }}>
                  {current.transformed}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:9, marginBottom:10 }}>
              <button onClick={() => setCurrent(c => ({...c, editing:!c.editing}))}
                style={{ ...gbtn('rgba(0,0,0,0.07)', GC.muted, { borderRadius:12, flex:1 }), padding:'10px', fontSize:12 }}>
                {current.editing ? t('완료', 'Done') : `✏️ ${t('수정', 'Edit')}`}
              </button>
              <button onClick={() => { setStep('input'); setAiError(''); }}
                style={{ ...gbtn(GC.sand, GC.muted, { borderRadius:12, flex:1, border:`1px solid rgba(0,0,0,0.08)` }), padding:'10px', fontSize:12 }}>
                {t('다시 쓰기', 'Try Again')}
              </button>
            </div>

            {/* 수용 버튼 */}
            <button onClick={() => handleAccept(current.transformed)}
              style={{
                ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`),
                width:'100%', padding:'14px', fontSize:14,
                borderRadius:14, boxShadow:`0 4px 16px ${GC.sage}40`,
              }}>
              {t('이 생각을 받아들이기', 'Accept This Thought')} 🌸
            </button>

            {/* 완성된 가지 요약 (있을 때) */}
            {branches.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:GC.muted, marginBottom:6 }}>{t('완성된 가지', 'Completed Branches')}</div>
                {branches.map((b, i) => (
                  <div key={i} style={{ fontSize:12, color:GC.sage, marginBottom:4, paddingLeft:8, borderLeft:`2px solid ${GC.sageL}` }}>
                    {b.transformed}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// GardenGame — 마음의 정원 메인 (모듈 선택 + 실행 + 완료)
// ════════════════════════════════════════════════════════════
function GardenGame({ onExit, userTestScores = {} }) {
  const { useState } = React;

  const [screen, setScreen]   = useState('select');  // select | breathing | cbt | result
  const [result, setResult]   = useState(null);

  const MODULES = [
    {
      id:      'breathing',
      name:    t('숨 쉬는 호수', 'Breathing Lake'),
      emoji:   '💧',
      desc:    t('4-4-4 박스 호흡으로 몸과 마음을 고요하게', 'Calm body and mind with 4-4-4 box breathing'),
      duration:t('약 5분', 'About 5 min'),
      tags:    [t('이완', 'Relax'), t('스트레스', 'Stress')],
      color:   GC.dusty,
      colorL:  GC.dustyL,
      bgFrom:  '#1A2A3A',
      bgTo:    '#2A3F55',
    },
    {
      id:      'cbt',
      name:    t('생각의 가지치기', 'Thought Pruning'),
      emoji:   '🌱',
      desc:    t('부정적인 생각을 AI와 함께 긍정 확언으로 변환', 'Transform negative thoughts into positive affirmations with AI'),
      duration:t('약 7~10분', 'About 7–10 min'),
      tags:    [t('인지교정', 'Cognitive'), 'CBT'],
      color:   GC.sage,
      colorL:  GC.sageL,
      bgFrom:  '#F0EDE5',
      bgTo:    GC.cream,
    },
  ];

  const handleModuleComplete = (res) => {
    setResult(res);
    setScreen('result');
  };

  // ── 모듈 선택 화면 ──────────────────────────────────────
  if (screen === 'select') {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${GC.sagePale}, ${GC.cream})`,
      }}>
        {/* 헤더 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px',
          background:'rgba(255,255,255,0.75)', backdropFilter:'blur(10px)',
          borderBottom:'1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>🌿</span>
            <span style={{ fontSize:15, fontWeight:700, color:GC.dark, fontFamily:"'Noto Serif KR', serif" }}>{t('마음의 정원', 'Mind Garden')}</span>
          </div>
          <button onClick={onExit}
            style={{ ...gbtn('rgba(0,0,0,0.06)', GC.muted, { borderRadius:9 }), padding:'6px 13px', fontSize:12 }}>
            {t('허브로', 'Hub')} →
          </button>
        </div>

        <div style={{ flex:1, padding:'24px 20px', overflowY:'auto' }}>
          {/* 오늘의 안내 */}
          <div style={{
            background:'rgba(255,255,255,0.7)', borderRadius:18, padding:'16px 18px',
            marginBottom:22, backdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,0.6)',
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:GC.muted, marginBottom:5 }}>{t('오늘의 정원', "Today's Garden")}</div>
            <div style={{ fontSize:15, color:GC.dark, fontWeight:500 }}>
              {t('어떤 훈련을 해볼까요?', 'Which practice will you try?')}
            </div>
            <div style={{ fontSize:12, color:GC.muted, marginTop:4, lineHeight:1.6 }}>
              {t('호흡으로 몸을 안정시키거나,', 'Calm your body with breathing,')}<br/>
              {t('생각을 새롭게 가꿔보세요.', 'or reshape your thoughts.')}
            </div>
          </div>

          {/* 모듈 카드 */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {MODULES.map(m => (
              <button key={m.id} onClick={() => setScreen(m.id)}
                style={{
                  ...gbtn('transparent', GC.dark, { textAlign:'left', borderRadius:20 }),
                  padding:0, overflow:'hidden',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
                  border:`1px solid rgba(255,255,255,0.7)`,
                }}>
                {/* 모듈 상단 컬러 밴드 */}
                <div style={{
                  height:6,
                  background:`linear-gradient(90deg, ${m.color}, ${m.colorL})`,
                }}/>
                <div style={{ padding:'18px 18px 16px', background:'rgba(255,255,255,0.85)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:32, lineHeight:1 }}>{m.emoji}</span>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:GC.dark }}>{m.name}</div>
                      <div style={{ fontSize:11, color:m.color, fontWeight:600 }}>{m.duration}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:GC.muted, lineHeight:1.6, marginBottom:10 }}>{m.desc}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {m.tags.map(t => (
                      <span key={t} style={{
                        fontSize:10, padding:'2px 9px', borderRadius:100,
                        background:`${m.color}18`, color:m.color, fontWeight:600,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 결과 화면 ────────────────────────────────────────────
  if (screen === 'result') {
    const r = result || {};
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:28, textAlign:'center',
        background:`linear-gradient(160deg, ${GC.sagePale}, #D4EAD0)`,
        animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ fontSize:72, marginBottom:16 }}>
          {r.leveledUp ? '🎉' : '🌿'}
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:GC.dark, marginBottom:10, fontFamily:"'Noto Serif KR', serif" }}>
          {r.leveledUp ? t('레벨 업!', 'Level Up!') : t('오늘도 수고했어요', 'Great work today')}
        </h2>
        <div style={{
          background:'white', borderRadius:18, padding:'20px 32px',
          boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:24,
          display:'flex', gap:28,
        }}>
          <div>
            <div style={{ fontSize:26, fontWeight:700, color:GC.sage }}>+{r.expGained}</div>
            <div style={{ fontSize:12, color:GC.muted }}>{t('경험치', 'EXP')}</div>
          </div>
          {r.newAchievements?.length > 0 && (
            <>
              <div style={{ width:1, background:'rgba(0,0,0,0.08)' }}/>
              <div>
                <div style={{ fontSize:26, fontWeight:700, color:GC.amber }}>
                  {r.newAchievements.map(id => GameEngine.getAchievementInfo(id).emoji).join('')}
                </div>
                <div style={{ fontSize:12, color:GC.muted }}>{t('새 업적', 'New Achievement')}</div>
              </div>
            </>
          )}
        </div>

        {r.newAchievements?.length > 0 && (
          <div style={{
            background:`${GC.amberL}33`, borderRadius:12, padding:'10px 20px',
            marginBottom:20,
          }}>
            {r.newAchievements.map(id => {
              const a = GameEngine.getAchievementInfo(id);
              return (
                <div key={id} style={{ fontSize:13, color:GC.amber, fontWeight:600 }}>
                  {a.emoji} {a.name} {t('달성!', 'Unlocked!')}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display:'flex', gap:10, width:'100%', maxWidth:280 }}>
          <button onClick={() => setScreen('select')}
            style={{ ...gbtn(GC.sagePale, GC.sage, { borderRadius:13, flex:1 }), padding:'12px', fontSize:13 }}>
            {t('한 번 더', 'Try Again')}
          </button>
          <button onClick={onExit}
            style={{
              ...gbtn(`linear-gradient(135deg, ${GC.sage}, ${GC.sageL})`),
              flex:2, padding:'12px', fontSize:13, borderRadius:13,
            }}>
            {t('허브로', 'Hub')} →
          </button>
        </div>
      </div>
    );
  }

  // ── 게임 모듈 실행 ───────────────────────────────────────
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      {screen === 'breathing' && (
        <BreathingModule
          onComplete={handleModuleComplete}
          onBack={() => setScreen('select')}
        />
      )}
      {screen === 'cbt' && (
        <CBTModule
          onComplete={handleModuleComplete}
          onBack={() => setScreen('select')}
          userTestScores={userTestScores}
        />
      )}
    </div>
  );
}
