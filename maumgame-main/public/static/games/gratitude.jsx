// ============================================================
// gratitude.jsx  —  별빛 감사 일기
// 3가지 감사 질문에 답하며 밤하늘에 별을 밝히는 마음챙김 게임
// 매일 긍정적 습관 빌더 · 긍정심리학(PPT) 기반
// ============================================================

const GV = {
  night:'#0D1B2A', nightM:'#1A2E42', nightL:'#254B6A',
  star:'#FFE08A', starL:'#FFF5C8',
  rose:'#C97B8A', rosePale:'#FCF0F2',
  sage:'#4A7C59', sagePale:'#EAF2EC',
  cream:'#FDFCF7', muted:'#8A8A78', dark:'#2C2C20',
  dusty:'#6B8FA8', dustyL:'#A8C4D4',
  amber:'#D4954A',
};

// ── 감사 질문 풀 (매일 다르게) ──────────────────────────────
const QUESTION_POOL = [
  [
    { id:'q1', prompt:'오늘 작은 기쁨을 준 것은?', placeholder:'따뜻한 커피 한 잔, 맑은 하늘... 아주 작아도 좋아요', emoji:'☕' },
    { id:'q2', prompt:'나에게 감사한 내 모습은?', placeholder:'끝까지 포기하지 않았던 것, 잘 견뎌낸 것...', emoji:'💪' },
    { id:'q3', prompt:'내일 기대되는 한 가지는?', placeholder:'아주 작은 것도 괜찮아요', emoji:'🌅' },
  ],
  [
    { id:'q1', prompt:'오늘 나를 미소 짓게 한 것은?', placeholder:'어떤 순간이든 좋아요', emoji:'😊' },
    { id:'q2', prompt:'오늘 내가 잘한 한 가지는?', placeholder:'아무리 작아도 진짜 잘한 거예요', emoji:'✨' },
    { id:'q3', prompt:'나의 삶에 있어서 감사한 것은?', placeholder:'사람, 공간, 상황... 무엇이든', emoji:'🙏' },
  ],
  [
    { id:'q1', prompt:'오늘 나에게 친절했던 것은?', placeholder:'나 자신이거나 다른 누군가', emoji:'💙' },
    { id:'q2', prompt:'힘들었지만 버텨낸 것이 있다면?', placeholder:'당신은 이미 잘하고 있어요', emoji:'🌿' },
    { id:'q3', prompt:'지금 이 순간 느끼는 좋은 감각은?', placeholder:'따뜻함, 조용함, 편안함...', emoji:'🍃' },
  ],
];

// ── SVG 별 컴포넌트 ──────────────────────────────────────────
function Star({ x, y, r, opacity = 1, twinkle = false, color = GV.star }) {
  return (
    <circle cx={x} cy={y} r={r} fill={color} opacity={opacity}
      style={twinkle ? {
        animation: `shimmer ${1.5 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`,
      } : {}}
    />
  );
}

// ── 5각 별 SVG ───────────────────────────────────────────────
function StarShape({ x, y, size = 12, glow = false }) {
  const pts = Array.from({length:5}, (_,i) => {
    const a  = (i * 72 - 90) * Math.PI / 180;
    const ai = ((i * 72 + 36) - 90) * Math.PI / 180;
    const or = size, ir = size * 0.4;
    return [
      x + Math.cos(a)*or, y + Math.sin(a)*or,
      x + Math.cos(ai)*ir, y + Math.sin(ai)*ir,
    ];
  }).flat();
  const d = `M ${pts[0]},${pts[1]} ` +
    pts.slice(2).reduce((acc,v,i) => acc + (i%2===0 ? `L ${v},` : `${v} `), '') + 'Z';

  return (
    <g>
      {glow && <path d={d} fill={GV.star} opacity="0.2"
        transform={`scale(1.6) translate(${x*(1-1/1.6)},${y*(1-1/1.6)})`}/>}
      <path d={d} fill={GV.star}
        style={{ animation: glow ? 'shimmer 2s ease-in-out infinite' : 'none' }}/>
    </g>
  );
}

// ── 밤하늘 씬 ─────────────────────────────────────────────────
function NightSky({ litStars = 0, width = 320, height = 200 }) {
  // 배경 별들 (항상 보임)
  const bgStars = [
    {x:30,y:30,r:1},{x:80,y:15,r:1.2},{x:140,y:25,r:0.8},
    {x:200,y:10,r:1},{x:260,y:30,r:1.3},{x:290,y:55,r:0.9},
    {x:50,y:70,r:0.8},{x:110,y:55,r:1.1},{x:175,y:45,r:0.9},
    {x:235,y:65,r:1},{x:310,y:80,r:0.8},{x:20,y:100,r:1.2},
  ];

  // 감사 별 3개 (답변 완료 시 순서대로 밝아짐)
  const answerStars = [
    { x:110, y:85,  size:16 },
    { x:175, y:62,  size:18 },
    { x:240, y:88,  size:14 },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width:'100%', height:'100%' }}>
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor={GV.nightL}/>
          <stop offset="100%" stopColor={GV.night}/>
        </radialGradient>
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* 하늘 */}
      <rect width={width} height={height} fill="url(#skyGrad)"/>

      {/* 지평선 언덕 */}
      <ellipse cx={width*0.3} cy={height} rx={width*0.55} ry={height*0.22} fill={GV.nightM}/>
      <ellipse cx={width*0.75} cy={height} rx={width*0.45} ry={height*0.16} fill={GV.nightM} opacity="0.8"/>

      {/* 배경 별 */}
      {bgStars.map((s,i) => (
        <Star key={i} x={s.x} y={s.y} r={s.r}
          opacity={0.4 + (i%3)*0.1} color="white" twinkle/>
      ))}

      {/* 달 */}
      <circle cx={width*0.82} cy={height*0.18} r={18} fill="#F5E8B0" opacity={0.9}/>
      <circle cx={width*0.82+6} cy={height*0.18-4} r={15} fill={GV.nightM} opacity={0.2}/>

      {/* 감사 별 (답변 순서대로 빛남) */}
      {answerStars.map((s, i) => (
        <g key={i} opacity={i < litStars ? 1 : 0.15}
          style={{ transition:'opacity 0.8s ease' }}
          filter={i < litStars ? "url(#starGlow)" : "none"}>
          <StarShape x={s.x} y={s.y} size={s.size} glow={i < litStars}/>
          {i < litStars && (
            <text x={s.x} y={s.y + s.size + 12}
              textAnchor="middle" fill={GV.starL}
              style={{ fontSize:9, fontFamily:"'Noto Sans KR',sans-serif", fontWeight:600 }}>
              {i === 0 ? '기쁨' : i === 1 ? '나' : '내일'}
            </text>
          )}
        </g>
      ))}

      {/* 은하수 (3개 완료 시) */}
      {litStars >= 3 && (
        <g opacity="0.15">
          {Array.from({length:20},(_,i)=>(
            <circle key={i} cx={50+i*12} cy={120+Math.sin(i*0.8)*18}
              r={0.8+Math.random()*0.5} fill="white"/>
          ))}
        </g>
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
// GratitudeGame — 메인
// ════════════════════════════════════════════════════════════
function GratitudeGame({ onExit }) {
  const { useState, useEffect, useRef } = React;

  const [screen, setScreen]   = useState('intro');   // intro|writing|done
  const [answers, setAnswers] = useState({});
  const [activeQ, setActiveQ] = useState(0);         // 현재 질문 인덱스
  const [litStars, setLitStars] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(false);
  const [sessionSec, setSessionSec] = useState(0);
  const startRef = useRef(Date.now());

  // 오늘 날짜 기반 질문 선택
  const dayIdx = new Date().getDay() % QUESTION_POOL.length;
  const questions = QUESTION_POOL[dayIdx];

  useEffect(() => {
    if (screen !== 'writing') return;
    const t = setInterval(() => {
      setSessionSec(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [screen]);

  const handleAnswer = (qIdx, val) => {
    setAnswers(prev => ({ ...prev, [questions[qIdx].id]: val }));
  };

  const handleConfirm = (qIdx) => {
    const val = answers[questions[qIdx].id]?.trim();
    if (!val || val.length < 2) return;
    // 별 켜기 애니메이션
    setAnimatingStar(true);
    setTimeout(() => {
      setLitStars(qIdx + 1);
      setAnimatingStar(false);
      if (qIdx + 1 < questions.length) {
        setActiveQ(qIdx + 1);
      } else {
        setTimeout(() => setScreen('done'), 600);
      }
    }, 400);
  };

  const handleFinish = async () => {
    const score = Object.values(answers).filter(a => a?.trim().length >= 2).length * 35;
    const answerTexts = Object.values(answers).filter(Boolean);
    const totalChars = answerTexts.reduce((a, v) => a + v.length, 0);
    const bonusScore = Math.min(totalChars, 30);

    try {
      const res = await GameEngine.saveSession({
        gameId:'gratitude', moduleType:'RELAX',
        score: score + bonusScore, durationSec: sessionSec,
        metadata: {
          questions_answered: litStars,
          answer_count: answerTexts.length,
          total_chars: totalChars,
        },
      });
      onExit?.({
        score: score + bonusScore,
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || [],
      });
    } catch {
      onExit?.({ score: score + bonusScore, expGained:0, leveledUp:false, newAchievements:[] });
    }
  };

  // ── 인트로 ────────────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${GV.night}, ${GV.nightM})`,
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px',
        background:'rgba(0,0,0,0.2)', backdropFilter:'blur(8px)',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>⭐</span>
          <span style={{ fontSize:15, fontWeight:700, color:'white', fontFamily:"'Noto Serif KR',serif" }}>별빛 감사 일기</span>
        </div>
        <button onClick={()=>onExit(null)} style={{
          fontFamily:"'Noto Sans KR',sans-serif",
          background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)',
          border:'none', borderRadius:9, padding:'6px 13px', fontSize:12, cursor:'pointer',
        }}>허브로 →</button>
      </div>

      <div style={{ height:200 }}>
        <NightSky litStars={0}/>
      </div>

      <div style={{ flex:1, padding:'24px 20px', overflowY:'auto' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:10, fontFamily:"'Noto Serif KR',serif" }}>
          오늘의 별을 밝혀요
        </h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.8, marginBottom:24 }}>
          3가지 질문에 솔직하게 답하면<br/>
          밤하늘에 감사의 별 3개가 빛나요.<br/>
          아주 작은 것도 충분해요.
        </p>

        {/* 오늘의 질문 미리보기 */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 14px',
              background:'rgba(255,255,255,0.07)', borderRadius:12,
              border:'1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize:20 }}>{q.emoji}</span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.5 }}>{q.prompt}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { startRef.current = Date.now(); setScreen('writing'); }}
          style={{
            fontFamily:"'Noto Sans KR',sans-serif", width:'100%',
            padding:'14px', background:`linear-gradient(135deg, #4A5A8A, ${GV.dusty})`,
            color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
            boxShadow:`0 4px 16px rgba(107,143,168,0.4)`,
          }}>
          별 밝히기 시작 ⭐
        </button>
      </div>
    </div>
  );

  // ── 글쓰기 화면 ───────────────────────────────────────────
  if (screen === 'writing') return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${GV.night}, ${GV.nightM})`,
    }}>
      {/* 밤하늘 + 별 */}
      <div style={{ height:190, position:'relative' }}>
        <NightSky litStars={litStars}/>
        {/* 별이 켜질 때 반짝 효과 */}
        {animatingStar && (
          <div style={{
            position:'absolute', inset:0, display:'flex',
            alignItems:'center', justifyContent:'center',
            pointerEvents:'none',
          }}>
            <div style={{
              fontSize:48, animation:'ripple 0.5s ease-out forwards',
            }}>✨</div>
          </div>
        )}
        {/* 진행 표시 */}
        <div style={{
          position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
          display:'flex', gap:8,
        }}>
          {questions.map((_,i) => (
            <div key={i} style={{
              width:8, height:8, borderRadius:'50%',
              background: i < litStars ? GV.star : 'rgba(255,255,255,0.25)',
              transition:'background 0.5s ease',
            }}/>
          ))}
        </div>
      </div>

      {/* 질문 카드 */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 18px 24px' }}>
        {questions.map((q, i) => {
          const isActive = i === activeQ;
          const isDone = i < litStars;
          const isPending = i > activeQ;

          return (
            <div key={q.id} style={{
              marginBottom:14, borderRadius:18, overflow:'hidden',
              border:`1px solid ${isDone ? 'rgba(255,224,138,0.3)' : isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
              background: isDone ? 'rgba(255,224,138,0.08)' : isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              transition:'all 0.4s ease',
              opacity: isPending ? 0.5 : 1,
            }}>
              <div style={{
                padding:'14px 16px',
                display:'flex', alignItems:'center', gap:10,
                borderBottom: isActive ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <span style={{ fontSize:20, opacity: isDone ? 1 : 0.8 }}>{q.emoji}</span>
                <span style={{ fontSize:13, color: isDone ? GV.starL : 'rgba(255,255,255,0.85)', fontWeight:600, flex:1, lineHeight:1.5 }}>
                  {q.prompt}
                </span>
                {isDone && <span style={{ fontSize:16 }}>⭐</span>}
              </div>

              {isActive && (
                <div style={{ padding:'12px 14px' }}>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => handleAnswer(i, e.target.value)}
                    placeholder={q.placeholder}
                    rows={3}
                    autoFocus
                    style={{
                      width:'100%', padding:'11px 12px',
                      background:'rgba(255,255,255,0.07)',
                      border:'1px solid rgba(255,255,255,0.15)',
                      borderRadius:10, color:'white',
                      fontSize:14, fontFamily:"'Noto Sans KR',sans-serif",
                      outline:'none', resize:'none', lineHeight:1.65,
                    }}
                    onFocus={e => e.target.style.borderColor='rgba(255,224,138,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.15)'}
                  />
                  <button
                    onClick={() => handleConfirm(i)}
                    disabled={!(answers[q.id]?.trim().length >= 2)}
                    style={{
                      fontFamily:"'Noto Sans KR',sans-serif", marginTop:10,
                      width:'100%', padding:'11px',
                      background: answers[q.id]?.trim().length >= 2
                        ? `linear-gradient(135deg, #7A6A30, ${GV.amber})`
                        : 'rgba(255,255,255,0.08)',
                      color: answers[q.id]?.trim().length >= 2 ? 'white' : 'rgba(255,255,255,0.3)',
                      border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer',
                      transition:'all 0.2s',
                    }}>
                    {i === questions.length - 1 ? '마지막 별 밝히기 ⭐' : '별 밝히기 ⭐'}
                  </button>
                </div>
              )}

              {isDone && (
                <div style={{ padding:'10px 16px 12px', fontSize:13, color:'rgba(255,224,138,0.8)', lineHeight:1.6, fontStyle:'italic' }}>
                  "{answers[q.id]}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── 완료 화면 ─────────────────────────────────────────────
  if (screen === 'done') return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${GV.night}, ${GV.nightM})`,
      animation:'fadeUp 0.5s ease',
    }}>
      <div style={{ height:200 }}>
        <NightSky litStars={3}/>
      </div>

      <div style={{ flex:1, padding:'24px 20px', overflowY:'auto' }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'white', marginBottom:8, fontFamily:"'Noto Serif KR',serif", textAlign:'center' }}>
          밤하늘에 별 3개가 떴어요 ⭐
        </h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.8, marginBottom:22, textAlign:'center' }}>
          감사한 마음이 밤하늘을 수놓았어요.<br/>
          오늘도 수고 많으셨어요.
        </p>

        {/* 답변 요약 */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{
              background:'rgba(255,224,138,0.08)', borderRadius:14,
              border:'1px solid rgba(255,224,138,0.2)', padding:'13px 14px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <span style={{ fontSize:14 }}>{q.emoji}</span>
                <span style={{ fontSize:11, color:'rgba(255,224,138,0.7)', fontWeight:600 }}>{q.prompt}</span>
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.6 }}>
                {answers[q.id]}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleFinish}
          style={{
            fontFamily:"'Noto Sans KR',sans-serif", width:'100%',
            padding:'14px', background:`linear-gradient(135deg, #4A5A8A, ${GV.dusty})`,
            color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
          }}>
          경험치 받기 →
        </button>
      </div>
    </div>
  );

  return null;
}
