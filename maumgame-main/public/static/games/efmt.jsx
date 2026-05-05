// ============================================================
// efmt.jsx  —  감정꽃 찾기 (EFMT)
// Emotional Flower Matching Task
// PHQ-9 점수에 따라 난이도 자동 조정
// ============================================================

const GE = { // 팔레트
  sage:'#4A7C59', sageL:'#7BA88A', sagePale:'#EAF2EC',
  cream:'#FDFCF7', muted:'#8A8A78', dark:'#2C2C20',
  amber:'#D4954A', rose:'#C97B8A', dusty:'#6B8FA8',
  warn:'#C05050',
};

// ── 감정 꽃 정의 (색상 + 형태로 이중 구분 → 색약 접근성) ──
const EMOTIONS = {
  happy: {
    name:'기쁨', label:'기쁜 꽃',
    petalColor:'#FCD34D', centerColor:'#F59E0B',
    stemColor:'#4A7C59',
    face: 'happy', // 위로 굽은 미소
    isTarget: true,
  },
  sad: {
    name:'슬픔', label:'슬픈 꽃',
    petalColor:'#93C5FD', centerColor:'#3B82F6',
    stemColor:'#5A7A9A',
    face: 'sad',   // 아래로 굽은 입
    isTarget: false,
  },
  anxious: {
    name:'불안', label:'불안한 꽃',
    petalColor:'#C4B5FD', centerColor:'#7C3AED',
    stemColor:'#6B5A8A',
    face: 'anxious', // 물결 입
    isTarget: false,
  },
  angry: {
    name:'화남', label:'화난 꽃',
    petalColor:'#FCA5A5', centerColor:'#EF4444',
    stemColor:'#8A4A4A',
    face: 'angry',  // 눌린 미간 + 직선 입
    isTarget: false,
  },
  neutral: {
    name:'무표정', label:'무표정 꽃',
    petalColor:'#D1D5DB', centerColor:'#9CA3AF',
    stemColor:'#7A7A6A',
    face: 'neutral', // 직선 입
    isTarget: false,
  },
};

// ── 꽃 SVG 컴포넌트 ─────────────────────────────────────────
function FlowerSVG({ emotion, size = 72, blooming = false, wilting = false, onClick, disabled }) {
  const e = EMOTIONS[emotion];
  const { useState: useS } = React;
  const [hovered, setHovered] = useS(false);

  const scale = blooming ? 1.15 : wilting ? 0.85 : hovered && !disabled ? 1.06 : 1;
  const opacity = wilting ? 0.55 : 1;

  // 꽃잎 6장 (육각형 배치)
  const petalAngles = [0, 60, 120, 180, 240, 300];
  const pr = size * 0.28; // 꽃잎 중심까지 거리
  const cx = size / 2, cy = size / 2;
  const petalRx = size * 0.155, petalRy = size * 0.1;

  // 표정 패스 (얼굴 크기에 맞게)
  const fr = size * 0.145; // 얼굴 반지름
  const ey = cy - size * 0.036; // 눈 y
  const ew = size * 0.02;       // 눈 크기
  const ex1 = cx - size * 0.06, ex2 = cx + size * 0.06; // 눈 x 위치
  const mouth = {
    happy:   `M ${cx - size*0.07} ${cy + size*0.04} Q ${cx} ${cy + size*0.1} ${cx + size*0.07} ${cy + size*0.04}`,
    sad:     `M ${cx - size*0.07} ${cy + size*0.08} Q ${cx} ${cy + size*0.02} ${cx + size*0.07} ${cy + size*0.08}`,
    anxious: `M ${cx - size*0.07} ${cy + size*0.055} Q ${cx - size*0.03} ${cy + size*0.04} ${cx} ${cy + size*0.065} Q ${cx + size*0.03} ${cy + size*0.085} ${cx + size*0.07} ${cy + size*0.055}`,
    angry:   `M ${cx - size*0.07} ${cy + size*0.07} L ${cx + size*0.07} ${cy + size*0.07}`,
    neutral: `M ${cx - size*0.07} ${cy + size*0.06} L ${cx + size*0.07} ${cy + size*0.06}`,
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size} height={size}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        transform: `scale(${scale})`,
        opacity,
        transition: 'transform 0.2s ease, opacity 0.3s ease',
        filter: blooming ? `drop-shadow(0 0 6px ${e.petalColor})` : 'none',
      }}
    >
      {/* 줄기 */}
      <line x1={cx} y1={size * 0.75} x2={cx} y2={size * 0.95}
        stroke={e.stemColor} strokeWidth={size * 0.04} strokeLinecap="round"/>
      {/* 작은 잎 */}
      <ellipse cx={cx + size*0.1} cy={size*0.82} rx={size*0.08} ry={size*0.04}
        fill={e.stemColor} opacity="0.7" transform={`rotate(30 ${cx + size*0.1} ${size*0.82})`}/>

      {/* 꽃잎 6장 */}
      {petalAngles.map(a => (
        <ellipse key={a}
          cx={cx + Math.cos(a * Math.PI/180) * pr}
          cy={cy + Math.sin(a * Math.PI/180) * pr}
          rx={petalRx} ry={petalRy}
          fill={e.petalColor}
          transform={`rotate(${a}, ${cx + Math.cos(a*Math.PI/180)*pr}, ${cy + Math.sin(a*Math.PI/180)*pr})`}
          opacity={blooming ? 1 : 0.9}
        />
      ))}
      {/* angry 눈썹 */}
      {emotion === 'angry' && <>
        <line x1={ex1 - size*0.035} y1={ey - size*0.04} x2={ex1 + size*0.025} y2={ey - size*0.015}
          stroke="#7A2A2A" strokeWidth={size*0.025} strokeLinecap="round"/>
        <line x1={ex2 - size*0.025} y1={ey - size*0.015} x2={ex2 + size*0.035} y2={ey - size*0.04}
          stroke="#7A2A2A" strokeWidth={size*0.025} strokeLinecap="round"/>
      </>}

      {/* 꽃 중심 (얼굴) */}
      <circle cx={cx} cy={cy} r={fr} fill={e.centerColor} opacity={0.95}/>
      <circle cx={cx} cy={cy} r={fr * 0.88} fill={e.centerColor} opacity={0.6}/>

      {/* 눈 */}
      <circle cx={ex1} cy={ey} r={ew} fill="#2C2C20" opacity={0.8}/>
      <circle cx={ex2} cy={ey} r={ew} fill="#2C2C20" opacity={0.8}/>

      {/* 표정 입 */}
      <path d={mouth[emotion] || mouth.neutral}
        fill="none" stroke="#2C2C20" strokeWidth={size*0.025} strokeLinecap="round"/>

      {/* 정답 클릭 효과 */}
      {blooming && (
        <circle cx={cx} cy={cy} r={fr * 1.4}
          fill="none" stroke={e.petalColor} strokeWidth="2" opacity="0.5"
          style={{ animation: 'ripple 0.6s ease-out forwards' }}/>
      )}
    </svg>
  );
}

// ── 난이도 계산 (PHQ-9 기반) ────────────────────────────────
function calcDifficulty(phq9Score = null) {
  // 0~4: easy, 5~9: medium, 10~14: hard, 15+: very_hard
  if (phq9Score === null) return 'medium';
  if (phq9Score <= 4)  return 'easy';
  if (phq9Score <= 9)  return 'medium';
  if (phq9Score <= 14) return 'hard';
  return 'very_hard';
}

const DIFFICULTY_CONFIG = {
  easy:      { grid:4, targetRatio:0.4, roundSec:35, rounds:3, label:'기초', desc:'4×4 · 35초 · 목표 40%' },
  medium:    { grid:4, targetRatio:0.28, roundSec:28, rounds:3, label:'보통', desc:'4×4 · 28초 · 목표 28%' },
  hard:      { grid:5, targetRatio:0.2,  roundSec:25, rounds:3, label:'심화', desc:'5×5 · 25초 · 목표 20%' },
  very_hard: { grid:5, targetRatio:0.15, roundSec:20, rounds:3, label:'도전', desc:'5×5 · 20초 · 목표 15%' },
};

// ── 그리드 생성 ─────────────────────────────────────────────
function generateGrid(gridSize, targetRatio) {
  const total = gridSize * gridSize;
  const targetCount = Math.max(2, Math.round(total * targetRatio));
  const nonTargetTypes = ['sad', 'anxious', 'angry', 'neutral'];

  const cells = [];
  // 목표 꽃 (기쁨) 배치
  const targetIndices = new Set();
  while (targetIndices.size < targetCount) {
    targetIndices.add(Math.floor(Math.random() * total));
  }
  for (let i = 0; i < total; i++) {
    if (targetIndices.has(i)) {
      cells.push({ id: i, emotion: 'happy', state: 'idle' });
    } else {
      const nt = nonTargetTypes[Math.floor(Math.random() * nonTargetTypes.length)];
      cells.push({ id: i, emotion: nt, state: 'idle' });
    }
  }
  return cells;
}

// ════════════════════════════════════════════════════════════
// EFMTGame — 메인
// ════════════════════════════════════════════════════════════
function EFMTGame({ onExit }) {
  const { useState, useEffect, useRef, useCallback } = React;

  const [screen, setScreen]      = useState('intro');   // intro|round|result|done
  const [difficulty, setDiff]    = useState('medium');
  const [round, setRound]        = useState(1);
  const [cells, setCells]        = useState([]);
  const [timeLeft, setTimeLeft]  = useState(28);
  const [roundStats, setRoundStats] = useState([]); // 라운드별 결과
  const [sessionSec, setSessionSec] = useState(0);
  const [correct, setCorrect]    = useState(0);
  const [incorrect, setIncorrect]= useState(0);
  const [reactionTimes, setReactionTimes] = useState([]); // ms
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [totalTargets, setTotalTargets] = useState(0);
  const [finished, setFinished]  = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0); // UI 표시용
  const [comboTierAnim, setComboTierAnim] = useState(null); // 배율 변화 팝업 텍스트
  const [personalBest, setPersonalBest]  = useState(null); // 이전 최고점
  const [computedScore, setComputedScore] = useState(0);   // done 화면 점수

  const timerRef     = useRef(null);
  const sessionRef   = useRef(Date.now());
  const comboRef     = useRef(0); // 현재 연속 정답 수
  const maxComboRef  = useRef(0); // 이번 라운드 최대 콤보

  const cfg = DIFFICULTY_CONFIG[difficulty];

  // ── 개인 베스트 로드 ──────────────────────────────────────
  useEffect(() => {
    GameEngine.getGameStats().then(r => {
      if (r.success) {
        const s = (r.data?.perGame || []).find(g => g.game_id === 'efmt');
        if (s?.best_score) setPersonalBest(s.best_score);
      }
    }).catch(() => {});
  }, []);

  // ── 라운드 시작 ───────────────────────────────────────────
  const startRound = useCallback((r, diff) => {
    const c = DIFFICULTY_CONFIG[diff || difficulty];
    const grid = generateGrid(c.grid, c.targetRatio);
    const targets = grid.filter(g => EMOTIONS[g.emotion].isTarget).length;
    setCells(grid);
    setTotalTargets(targets);
    setTimeLeft(c.roundSec);
    setCorrect(0); setIncorrect(0); setReactionTimes([]);
    setRoundStartTime(Date.now());
    comboRef.current = 0; maxComboRef.current = 0;
    setComboDisplay(0);
    setRound(r);
    setScreen('round');
  }, [difficulty]);

  // ── 타이머 ────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'round') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, round]);

  // ── 라운드 종료 ───────────────────────────────────────────
  const endRound = useCallback(() => {
    clearInterval(timerRef.current);
    setRoundStats(prev => {
      const stat = {
        round,
        correct, incorrect, totalTargets,
        avgReaction: reactionTimes.length > 0
          ? Math.round(reactionTimes.reduce((a,b)=>a+b,0) / reactionTimes.length)
          : 0,
        missedTargets: Math.max(0, totalTargets - correct),
        maxCombo: maxComboRef.current,
      };
      const next = [...prev, stat];
      if (round >= cfg.rounds) {
        setFinished(true);
        setSessionSec(Math.round((Date.now() - sessionRef.current) / 1000));
        // 최종 점수 미리 계산 (done 화면 표시용)
        const tc = next.reduce((a,s)=>a+s.correct,0);
        const ti = next.reduce((a,s)=>a+s.incorrect,0);
        const tt = next.reduce((a,s)=>a+s.totalTargets,0);
        const ar = next.filter(s=>s.avgReaction>0).reduce((a,s,_,arr)=>a+s.avgReaction/arr.length,0);
        const bc = Math.max(...next.map(s=>s.maxCombo||0),0);
        const acc = tt > 0 ? Math.round(tc/tt*100) : 0;
        const cBonus = bc >= 10 ? bc*15 : bc >= 5 ? bc*10 : bc >= 3 ? bc*6 : 0;
        const aBonus = acc >= 90 ? 30 : acc >= 75 ? 15 : 0;
        const sc = Math.max(0, tc*20 - ti*5 + Math.max(0, 50 - Math.round(ar/100)) + cBonus + aBonus);
        setComputedScore(sc);
        setScreen('done');
      } else {
        setScreen('result');
      }
      return next;
    });
  }, [round, correct, incorrect, totalTargets, reactionTimes, cfg.rounds]);

  // ── 꽃 클릭 ───────────────────────────────────────────────
  const handleFlowerClick = useCallback((cellId) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || cell.state !== 'idle') return;

    const rt = Date.now() - roundStartTime;
    const isTarget = EMOTIONS[cell.emotion].isTarget;

    setCells(prev => prev.map(c =>
      c.id === cellId ? { ...c, state: isTarget ? 'blooming' : 'wilting' } : c
    ));

    if (isTarget) {
      setCorrect(n => n + 1);
      setReactionTimes(prev => [...prev, rt]);
      // 콤보 배율 티어 감지 (3→×1.5, 5→×2.0, 10→×3.0)
      const prevTier = comboRef.current >= 10 ? 3 : comboRef.current >= 5 ? 2 : comboRef.current >= 3 ? 1 : 0;
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      setComboDisplay(comboRef.current);
      const newTier = comboRef.current >= 10 ? 3 : comboRef.current >= 5 ? 2 : comboRef.current >= 3 ? 1 : 0;
      if (newTier > prevTier) {
        const tLabels = ['', '× 1.5', '× 2.0', '× 3.0'];
        setComboTierAnim(tLabels[newTier]);
        setTimeout(() => setComboTierAnim(null), 1400);
      }
      // 잠시 후 꽃 숨기기
      setTimeout(() => {
        setCells(prev => prev.map(c =>
          c.id === cellId ? { ...c, state: 'found' } : c
        ));
      }, 400);
    } else {
      setIncorrect(n => n + 1);
      // 콤보 초기화
      comboRef.current = 0;
      setComboDisplay(0);
      setTimeout(() => {
        setCells(prev => prev.map(c =>
          c.id === cellId ? { ...c, state: 'idle' } : c
        ));
      }, 500);
    }
  }, [cells, roundStartTime]);

  // ── 최종 저장 ─────────────────────────────────────────────
  const handleFinish = async () => {
    const totalCorrect   = roundStats.reduce((a,s) => a + s.correct, 0);
    const totalIncorrect = roundStats.reduce((a,s) => a + s.incorrect, 0);
    const totalTarget    = roundStats.reduce((a,s) => a + s.totalTargets, 0);
    const avgRT          = roundStats.filter(s=>s.avgReaction>0).reduce((a,s,_,arr) => a + s.avgReaction/arr.length, 0);
    const accuracy       = totalTarget > 0 ? Math.round(totalCorrect / totalTarget * 100) : 0;
    const bestCombo      = Math.max(...roundStats.map(s => s.maxCombo || 0), 0);
    const comboBonus     = bestCombo >= 10 ? bestCombo*15 : bestCombo >= 5 ? bestCombo*10 : bestCombo >= 3 ? bestCombo*6 : 0;
    const accuracyBonus  = accuracy >= 90 ? 30 : accuracy >= 75 ? 15 : 0;
    const score          = Math.max(0, totalCorrect * 20 - totalIncorrect * 5 + Math.max(0, 50 - Math.round(avgRT/100)) + comboBonus + accuracyBonus);

    try {
      const res = await GameEngine.saveSession({
        gameId:'efmt', moduleType:'EFMT',
        score, durationSec: sessionSec,
        metadata: {
          difficulty, rounds: cfg.rounds,
          total_correct: totalCorrect, total_incorrect: totalIncorrect,
          accuracy_pct: accuracy, avg_reaction_ms: Math.round(avgRT),
          round_stats: roundStats,
        },
      });
      const expGained = res.data?.expGained || 0;
      const leveledUp = res.data?.leveledUp || false;
      const newAchievements = res.data?.newAchievements || [];
      // 결과 후 허브로
      setTimeout(() => onExit({ score, expGained, leveledUp, newAchievements }), 200);
    } catch {
      setTimeout(() => onExit({ score, expGained:0, leveledUp:false, newAchievements:[] }), 200);
    }
  };

  // ── 타이머바 색상 ─────────────────────────────────────────
  const timerColor = timeLeft > cfg.roundSec * 0.4 ? GE.sage
    : timeLeft > cfg.roundSec * 0.2 ? GE.amber : GE.warn;

  // ════ 화면 분기 ════════════════════════════════════════════

  // ── 인트로 ────────────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, #FFF8E8, ${GE.cream})`,
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px',
        background:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)',
        borderBottom:'1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🌸</span>
          <span style={{ fontSize:15, fontWeight:700, color:GE.dark, fontFamily:"'Noto Serif KR',serif" }}>감정꽃 찾기</span>
        </div>
        <button onClick={()=>onExit(null)} style={{
          fontFamily:"'Noto Sans KR',sans-serif", background:'rgba(0,0,0,0.06)',
          color:GE.muted, border:'none', borderRadius:9, padding:'6px 13px', fontSize:12, cursor:'pointer',
        }}>허브로 →</button>
      </div>

      <div style={{ flex:1, padding:'24px 20px', overflowY:'auto' }}>
        {/* 꽃 예시 */}
        <div style={{
          background:'rgba(255,255,255,0.8)', borderRadius:20, padding:'20px',
          marginBottom:22, backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.7)',
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:GE.muted, marginBottom:12, textAlign:'center' }}>
            기쁜 꽃만 빠르게 클릭하세요
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
            {Object.entries(EMOTIONS).map(([key, e]) => (
              <div key={key} style={{ textAlign:'center' }}>
                <FlowerSVG emotion={key} size={56} disabled/>
                <div style={{
                  fontSize:10, fontWeight:700, marginTop:4,
                  color: e.isTarget ? GE.sage : GE.muted,
                  background: e.isTarget ? GE.sagePale : 'transparent',
                  padding:'2px 6px', borderRadius:100,
                }}>{e.name}{e.isTarget ? ' ✓' : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 난이도 선택 */}
        <div style={{ fontSize:12, fontWeight:700, color:GE.muted, marginBottom:10 }}>난이도 선택</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:22 }}>
          {Object.entries(DIFFICULTY_CONFIG).map(([key, d]) => (
            <button key={key}
              onClick={() => setDiff(key)}
              style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                padding:'13px 10px', borderRadius:13, cursor:'pointer', border:'1.5px solid',
                borderColor: difficulty === key ? GE.sage : 'rgba(0,0,0,0.1)',
                background: difficulty === key ? GE.sagePale : 'rgba(255,255,255,0.8)',
                textAlign:'left', transition:'all 0.15s',
              }}>
              <div style={{ fontSize:14, fontWeight:700, color: difficulty===key ? GE.sage : GE.dark, marginBottom:3 }}>
                {d.label}
              </div>
              <div style={{ fontSize:11, color:GE.muted }}>{d.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize:12, color:GE.muted, lineHeight:1.7, marginBottom:20,
          background:'rgba(255,255,255,0.6)', borderRadius:12, padding:'12px 14px' }}>
          💡 PHQ-9 점수가 높을수록 심화 난이도를 권장해요.<br/>
          슬픈·불안한 꽃이 많이 보여도 기쁜 꽃을 찾는 연습이<br/>
          감정 인식 능력을 키워줍니다.
        </div>

        {/* 개인 베스트 배지 */}
        {personalBest !== null && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:16, padding:'10px 16px',
            background:`linear-gradient(135deg, ${GE.amber}15, ${GE.amber}08)`,
            borderRadius:12, border:`1px solid ${GE.amber}33`,
          }}>
            <span style={{ fontSize:16 }}>🏆</span>
            <span style={{ fontSize:13, fontWeight:700, color:GE.amber }}>
              내 최고 기록: {personalBest.toLocaleString()}점
            </span>
          </div>
        )}

        <button
          onClick={() => startRound(1, difficulty)}
          style={{
            fontFamily:"'Noto Sans KR',sans-serif", width:'100%',
            padding:'14px', background:`linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
            color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700,
            cursor:'pointer', boxShadow:`0 4px 16px ${GE.amber}44`,
          }}>
          시작하기 🌸
        </button>
      </div>
    </div>
  );

  // ── 라운드 진행 ───────────────────────────────────────────
  if (screen === 'round') {
    const remaining = cells.filter(c => EMOTIONS[c.emotion].isTarget && c.state !== 'found').length;
    const gs = cfg.grid;
    const flowerSize = gs === 4 ? 74 : 60;

    // 콤보 배율 계산
    const comboMultiplier = comboDisplay >= 10 ? '× 3.0' : comboDisplay >= 5 ? '× 2.0' : comboDisplay >= 3 ? '× 1.5' : null;
    const comboColor = comboDisplay >= 10 ? '#E53E3E' : comboDisplay >= 5 ? GE.rose : GE.amber;

    // 타이머 긴박감
    const isCritical = timeLeft <= 3;
    const isUrgent   = timeLeft <= 5;

    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background: isCritical
          ? `linear-gradient(160deg, #FFF0F0, #FFF8E8)`
          : `linear-gradient(160deg, #FFFBF0, ${GE.cream})`,
        transition:'background 0.5s',
      }}>
        {/* 라운드 헤더 */}
        <div style={{
          padding:'10px 16px',
          background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)',
          borderBottom:`1px solid ${isCritical ? '#FCA5A555' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:GE.dark }}>
                라운드 {round} / {cfg.rounds}
              </div>
              {comboDisplay >= 3 && (
                <div style={{
                  fontSize:12, fontWeight:800, color: comboColor,
                  background: comboColor + '18', borderRadius:100, padding:'2px 10px',
                  animation:'pulse 0.4s ease',
                  display:'flex', alignItems:'center', gap:4,
                }}>
                  {comboDisplay >= 10 ? '🔥🔥🔥' : comboDisplay >= 5 ? '🔥🔥' : '🔥'}
                  {comboDisplay} 콤보
                  {comboMultiplier && <span style={{ fontSize:10, opacity:0.8 }}>{comboMultiplier}</span>}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:14, fontSize:13 }}>
              <span style={{ color:GE.sage, fontWeight:700 }}>✓ {correct}</span>
              <span style={{ color:GE.warn, fontWeight:700 }}>✗ {incorrect}</span>
              <span style={{
                color: timerColor, fontWeight:700, minWidth:28, textAlign:'right',
                fontSize: isUrgent ? 17 : 13,
                animation: isCritical ? 'pulse 0.5s infinite' : isUrgent ? 'pulse 0.8s infinite' : 'none',
              }}>{timeLeft}s</span>
            </div>
          </div>
          {/* 타이머 바 */}
          <div style={{ height:5, background:'rgba(0,0,0,0.08)', borderRadius:100, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:100, transition:'width 1s linear, background 0.5s',
              width:`${(timeLeft / cfg.roundSec) * 100}%`,
              background: timerColor,
            }}/>
          </div>
        </div>

        {/* 안내 */}
        <div style={{
          textAlign:'center', padding:'8px 0 4px',
          fontSize:12, color: isCritical ? GE.warn : GE.muted, fontWeight:600,
          transition:'color 0.3s',
        }}>
          {isCritical ? '⏰ 서둘러요!' : `기쁜 꽃 ${remaining}개 남았어요 · 다른 꽃은 클릭하지 마세요`}
        </div>

        {/* 꽃 그리드 (상대 위치 컨테이너 — 팝업용) */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 12px', position:'relative' }}>
          {/* 콤보 배율 변화 팝업 */}
          {comboTierAnim && (
            <div style={{
              position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)',
              zIndex:10, pointerEvents:'none',
              background:'linear-gradient(135deg, #F59E0B, #FCD34D)',
              color:'white', fontWeight:900, fontSize:22,
              padding:'10px 24px', borderRadius:100,
              boxShadow:'0 4px 20px rgba(245,158,11,0.5)',
              animation:'fadeUp 0.4s ease, pulse 0.6s ease 0.4s',
              fontFamily:"'Noto Sans KR',sans-serif",
              whiteSpace:'nowrap',
            }}>
              🔥 콤보 {comboTierAnim}
            </div>
          )}

          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${gs}, ${flowerSize}px)`,
            gap: gs === 4 ? 8 : 5,
          }}>
            {cells.map(cell => (
              <div key={cell.id} style={{
                width:flowerSize, height:flowerSize + 14,
                display:'flex', alignItems:'center', justifyContent:'center',
                opacity: cell.state === 'found' ? 0 : 1,
                transition:'opacity 0.3s ease',
              }}>
                {cell.state !== 'found' && (
                  <FlowerSVG
                    emotion={cell.emotion}
                    size={flowerSize}
                    blooming={cell.state === 'blooming'}
                    wilting={cell.state === 'wilting'}
                    disabled={cell.state !== 'idle'}
                    onClick={() => handleFlowerClick(cell.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 라운드 결과 ───────────────────────────────────────────
  if (screen === 'result') {
    const last = roundStats[roundStats.length - 1] || {};
    const acc  = last.totalTargets > 0 ? Math.round(last.correct / last.totalTargets * 100) : 0;
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:28, textAlign:'center',
        background:`linear-gradient(160deg, #FFF8E8, ${GE.cream})`,
        animation:'fadeUp 0.4s ease',
      }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{acc >= 80 ? '🌟' : acc >= 50 ? '🌸' : '🌼'}</div>
        <h3 style={{ fontSize:20, fontWeight:700, color:GE.dark, marginBottom:8, fontFamily:"'Noto Serif KR',serif" }}>
          라운드 {last.round} 완료
        </h3>
        <div style={{
          display:'flex', gap:20, marginBottom:24,
          background:'rgba(255,255,255,0.8)', borderRadius:16, padding:'16px 24px',
          boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <div><div style={{ fontSize:22, fontWeight:700, color:GE.sage }}>{last.correct}</div><div style={{ fontSize:11, color:GE.muted }}>발견</div></div>
          <div><div style={{ fontSize:22, fontWeight:700, color:GE.warn }}>{last.missed}</div><div style={{ fontSize:11, color:GE.muted }}>놓침</div></div>
          <div><div style={{ fontSize:22, fontWeight:700, color:GE.amber }}>{acc}%</div><div style={{ fontSize:11, color:GE.muted }}>정확도</div></div>
          {last.avgReaction > 0 && <div><div style={{ fontSize:22, fontWeight:700, color:GE.dusty }}>{(last.avgReaction/1000).toFixed(1)}s</div><div style={{ fontSize:11, color:GE.muted }}>반응속도</div></div>}
        </div>
        <button
          onClick={() => startRound(round + 1, difficulty)}
          style={{
            fontFamily:"'Noto Sans KR',sans-serif",
            padding:'13px 40px', background:`linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
            color:'white', border:'none', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer',
          }}>
          다음 라운드 →
        </button>
      </div>
    );
  }

  // ── 최종 완료 ─────────────────────────────────────────────
  if (screen === 'done') {
    const totalC    = roundStats.reduce((a,s)=>a+s.correct,0);
    const totalT    = roundStats.reduce((a,s)=>a+s.totalTargets,0);
    const totalW    = roundStats.reduce((a,s)=>a+s.incorrect,0);
    const avgAcc    = totalT > 0 ? Math.round(totalC/totalT*100) : 0;
    const bestCombo = Math.max(...roundStats.map(s => s.maxCombo || 0), 0);
    const isNewRecord = personalBest !== null && computedScore > personalBest;

    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column', padding:24,
        background:`linear-gradient(160deg, #FFF8E8, #F0FAF0)`,
        animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:60, marginBottom:10 }}>🌺</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:GE.dark, fontFamily:"'Noto Serif KR',serif" }}>
            감정 훈련 완료!
          </h2>

          {/* 이번 점수 + 신기록 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:10 }}>
            <span style={{ fontSize:28, fontWeight:900, color:GE.amber }}>
              {computedScore.toLocaleString()}점
            </span>
            {isNewRecord && (
              <span style={{
                fontSize:12, fontWeight:800, color:'white',
                background:`linear-gradient(135deg, ${GE.amber}, #E8C47A)`,
                borderRadius:100, padding:'3px 10px',
                animation:'pulse 0.6s ease',
              }}>🏆 신기록!</span>
            )}
          </div>
          {personalBest !== null && !isNewRecord && (
            <div style={{ fontSize:11, color:GE.muted, marginTop:4 }}>
              최고 기록 {personalBest.toLocaleString()}점
              {computedScore > 0 && ` · 차이 ${(personalBest - computedScore).toLocaleString()}점`}
            </div>
          )}
          {personalBest === null && (
            <div style={{ fontSize:11, color:GE.sage, marginTop:4 }}>첫 기록이에요! 🎉</div>
          )}
        </div>

        {/* 종합 스탯 */}
        <div style={{
          background:'white', borderRadius:18, padding:'18px 20px', marginBottom:16,
          boxShadow:'0 4px 16px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize:12, fontWeight:700, color:GE.muted, marginBottom:12 }}>훈련 결과</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 20px' }}>
            {[
              { label:'기쁜 꽃 발견', val:`${totalC}개`, color:GE.sage },
              { label:'전체 정확도', val:`${avgAcc}%`, color: avgAcc >= 90 ? GE.sage : avgAcc >= 75 ? GE.amber : GE.warn },
              { label:'오클릭', val:`${totalW}회`, color:GE.warn },
              { label:'최대 콤보', val:`${bestCombo}연속`, color: bestCombo >= 10 ? '#E53E3E' : bestCombo >= 5 ? GE.rose : GE.amber },
            ].map(({label,val,color})=>(
              <div key={label}>
                <div style={{ fontSize:11, color:GE.muted, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:20, fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>
          {/* 보너스 내역 */}
          {(bestCombo >= 3 || avgAcc >= 75) && (
            <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(0,0,0,0.06)', display:'flex', gap:8, flexWrap:'wrap' }}>
              {bestCombo >= 3 && (
                <span style={{ fontSize:11, color:GE.amber, fontWeight:700,
                  background:GE.amber+'15', borderRadius:6, padding:'2px 8px' }}>
                  🔥 콤보 보너스 +{bestCombo >= 10 ? bestCombo*15 : bestCombo >= 5 ? bestCombo*10 : bestCombo*6}점
                </span>
              )}
              {avgAcc >= 75 && (
                <span style={{ fontSize:11, color:GE.sage, fontWeight:700,
                  background:GE.sage+'15', borderRadius:6, padding:'2px 8px' }}>
                  🎯 정확도 보너스 +{avgAcc >= 90 ? 30 : 15}점
                </span>
              )}
            </div>
          )}
        </div>

        {/* 라운드별 */}
        <div style={{ flex:1, overflowY:'auto', marginBottom:16 }}>
          {roundStats.map(s => (
            <div key={s.round} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 14px', marginBottom:8,
              background:'rgba(255,255,255,0.7)', borderRadius:12,
            }}>
              <div style={{ fontSize:20 }}>
                {s.correct >= s.totalTargets * 0.8 ? '⭐' : s.correct >= s.totalTargets * 0.5 ? '🌸' : '🌼'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:GE.dark }}>라운드 {s.round}</div>
                <div style={{ fontSize:11, color:GE.muted }}>
                  {s.correct}/{s.totalTargets} 발견 · 오클릭 {s.incorrect}회
                  {s.avgReaction > 0 && ` · ${(s.avgReaction/1000).toFixed(1)}s`}
                </div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:GE.sage }}>
                {s.totalTargets > 0 ? Math.round(s.correct/s.totalTargets*100) : 0}%
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleFinish}
          style={{
            fontFamily:"'Noto Sans KR',sans-serif", padding:'14px',
            background:`linear-gradient(135deg, ${GE.sage}, ${GE.sageL})`,
            color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
          }}>
          경험치 받기 →
        </button>
      </div>
    );
  }

  return null;
}
