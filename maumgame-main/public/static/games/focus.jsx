// ============================================================
// focus.jsx  —  마음 집중력 (Mindful Focus)
// 숫자 기억 + 그리드 패턴 훈련 혼합
// GAD-7/PHQ-9 점수 기반 난이도 자동 조정
// ============================================================

const FC = {
  sage:'#4A7C59', sageL:'#7BA88A', sagePale:'#EAF2EC',
  cream:'#FDFCF7', muted:'#8A8A78', dark:'#2C2C20',
  amber:'#D4954A', amberL:'#E8C47A',
  sky:'#5A9BBF', skyL:'#A0C8E0', skyPale:'#E8F4FA',
  rose:'#C97B8A', rosePale:'#FAE8EC',
  indigo:'#5B6FA8', indigoPale:'#EEF0FA',
  warn:'#C05050',
};

// ── 숫자 기억 라운드 설정 ─────────────────────────────────
// span: 표시할 숫자 개수, showMs: 각 숫자 표시 시간(ms)
function getRoundConfig(phq9Score, gad7Score) {
  const stress = Math.max(phq9Score ?? 5, gad7Score ?? 5);
  if (stress >= 15) return [
    { type:'number', span:3, showMs:1200 },
    { type:'grid',   size:3, lights:3 },
    { type:'number', span:4, showMs:1100 },
    { type:'grid',   size:3, lights:4 },
    { type:'number', span:4, showMs:1000 },
  ];
  if (stress >= 8) return [
    { type:'number', span:4, showMs:1000 },
    { type:'grid',   size:3, lights:4 },
    { type:'number', span:5, showMs:950 },
    { type:'grid',   size:4, lights:5 },
    { type:'number', span:5, showMs:900 },
  ];
  return [
    { type:'number', span:5, showMs:900 },
    { type:'grid',   size:4, lights:5 },
    { type:'number', span:6, showMs:850 },
    { type:'grid',   size:4, lights:6 },
    { type:'number', span:7, showMs:800 },
  ];
}

// 랜덤 숫자 배열 생성 (연속 중복 없이)
function genNumbers(span) {
  const arr = [];
  for (let i = 0; i < span; i++) {
    let n;
    do { n = Math.floor(Math.random() * 10); } while (n === arr[arr.length - 1]);
    arr.push(n);
  }
  return arr;
}

// 랜덤 그리드 패턴 생성
function genGridPattern(size, lights) {
  const total = size * size;
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, lights));
}

// ── 점수 계산 ────────────────────────────────────────────
function calcRoundScore(type, correct, total, perfect) {
  if (type === 'number') {
    return correct * 10 + (perfect ? 30 : 0);
  }
  return correct * 8 + (perfect ? 25 : 0);
}

// ──────────────────────────────────────────────────────────
// NumberRound — 숫자 기억 라운드
// ──────────────────────────────────────────────────────────
function NumberRound({ config, roundIndex, totalRounds, onDone }) {
  const { useState, useEffect, useRef } = React;
  const [phase, setPhase] = useState('breathe'); // breathe → show → input → result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numbers]  = useState(() => genNumbers(config.span));
  const [input, setInput] = useState([]);
  const [result, setResult] = useState(null);
  const [breathCount, setBreathCount] = useState(3);
  const inputRef = useRef(null);

  // ── 호흡 카운트다운 ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'breathe') return;
    if (breathCount <= 0) { setPhase('show'); setCurrentIdx(0); return; }
    const t = setTimeout(() => setBreathCount(v => v - 1), 800);
    return () => clearTimeout(t);
  }, [phase, breathCount]);

  // ── 숫자 순차 표시 ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'show') return;
    if (currentIdx >= numbers.length) {
      setTimeout(() => setPhase('input'), 600);
      return;
    }
    const t = setTimeout(() => setCurrentIdx(v => v + 1), config.showMs);
    return () => clearTimeout(t);
  }, [phase, currentIdx, numbers, config.showMs]);

  // 입력 포커스
  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus();
  }, [phase]);

  const handleDigit = (d) => {
    if (phase !== 'input') return;
    const next = [...input, d];
    setInput(next);
    if (next.length === numbers.length) {
      const correct = next.filter((v, i) => v === numbers[i]).length;
      const perfect = correct === numbers.length;
      const score   = calcRoundScore('number', correct, numbers.length, perfect);
      setResult({ correct, total: numbers.length, perfect, score });
      setPhase('result');
    }
  };

  const handleBackspace = () => {
    if (phase !== 'input' || input.length === 0) return;
    setInput(v => v.slice(0, -1));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, padding:'0 24px' }}>
      {/* 라운드 헤더 */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        width:'100%', marginBottom:24,
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:FC.muted }}>
          {t('라운드', 'Round')} {roundIndex + 1} / {totalRounds}
        </div>
        <div style={{
          background:FC.indigoPale, color:FC.indigo,
          fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:100,
        }}>🔢 {t('숫자 기억', 'Number Memory')}</div>
      </div>

      {/* 호흡 준비 단계 */}
      {phase === 'breathe' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{
            width:100, height:100, borderRadius:'50%',
            background:`radial-gradient(circle, ${FC.skyPale}, ${FC.sky}33)`,
            border:`3px solid ${FC.sky}55`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:42,
            animation: breathCount > 0 ? 'pulse 0.8s ease-in-out' : 'none',
          }}>
            {breathCount > 0 ? breathCount : '🌿'}
          </div>
          <div style={{ fontSize:16, fontWeight:600, color:FC.dark }}>{t('잠깐 마음을 가다듬어요', 'Take a moment to settle your mind')}</div>
          <div style={{ fontSize:13, color:FC.muted, textAlign:'center', lineHeight:1.7 }}>
            {t('숫자가 하나씩 나타날 거예요', 'Numbers will appear one by one')}<br/>{t('순서대로 기억해 두세요', 'Remember them in order')}
          </div>
          <div style={{ fontSize:13, color:FC.sky, fontWeight:700 }}>
            {t(`${config.span}자리 숫자를 기억하세요`, `Memorize the ${config.span}-digit number`)}
          </div>
        </div>
      )}

      {/* 숫자 표시 단계 */}
      {phase === 'show' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
          <div style={{
            fontSize:13, fontWeight:600, color:FC.muted,
            display:'flex', gap:8, alignItems:'center',
          }}>
            {numbers.map((_, i) => (
              <div key={i} style={{
                width:10, height:10, borderRadius:'50%',
                background: i < currentIdx ? FC.sky : i === currentIdx ? FC.amber : 'rgba(0,0,0,0.1)',
                transition:'all 0.3s',
              }}/>
            ))}
          </div>

          <div style={{
            width:140, height:140, borderRadius:28,
            background:`linear-gradient(135deg, ${FC.sky}22, ${FC.skyPale})`,
            border:`3px solid ${FC.sky}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 12px 40px ${FC.sky}22`,
          }}>
            {currentIdx < numbers.length ? (
              <div style={{
                fontSize:72, fontWeight:900, color:FC.sky,
                animation:'fadeUp 0.25s ease',
                fontFamily:'monospace',
              }}>
                {numbers[currentIdx]}
              </div>
            ) : (
              <div style={{ fontSize:36, animation:'pulse 0.5s ease' }}>✓</div>
            )}
          </div>

          <div style={{ fontSize:13, color:FC.muted }}>
            {currentIdx < numbers.length
              ? `${currentIdx + 1} / ${numbers.length}`
              : t('이제 입력하세요!', 'Now enter the numbers!')}
          </div>
        </div>
      )}

      {/* 입력 단계 */}
      {phase === 'input' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, width:'100%' }}>
          <div style={{ fontSize:15, fontWeight:700, color:FC.dark }}>
            {t('기억한 숫자를 순서대로 입력하세요', 'Enter the numbers in order')}
          </div>

          {/* 입력 디스플레이 */}
          <div style={{
            display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap',
            minHeight:64, alignItems:'center',
          }}>
            {Array.from({ length: numbers.length }).map((_, i) => (
              <div key={i} style={{
                width:52, height:52, borderRadius:14,
                background: i < input.length ? FC.sky : 'rgba(0,0,0,0.06)',
                border: `2px solid ${i < input.length ? FC.sky : 'rgba(0,0,0,0.12)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, fontWeight:900,
                color: i < input.length ? 'white' : FC.muted,
                fontFamily:'monospace',
                transition:'all 0.2s',
                boxShadow: i < input.length ? `0 4px 12px ${FC.sky}44` : 'none',
              }}>
                {i < input.length ? input[i] : ''}
              </div>
            ))}
          </div>

          {/* 숫자 버튼 패드 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, maxWidth:260, width:'100%' }}>
            {[1,2,3,4,5,6,7,8,9,'←',0,'✓'].map((d, i) => {
              const isBack = d === '←';
              const isEnter = d === '✓';
              const disabled = input.length === 0 && isBack;
              return (
                <button key={i} onClick={() => {
                  if (isBack) handleBackspace();
                  else if (!isEnter) handleDigit(d);
                }} disabled={disabled} style={{
                  fontFamily:"'Noto Sans KR', monospace",
                  padding:'16px', borderRadius:14, border:'none',
                  background: isBack ? FC.rosePale : isEnter ? FC.sagePale : 'white',
                  color: isBack ? FC.rose : isEnter ? FC.sage : FC.dark,
                  fontSize: typeof d === 'number' ? 22 : 18,
                  fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                  opacity: disabled ? 0.3 : 1,
                  transition:'all 0.15s',
                }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 결과 단계 */}
      {phase === 'result' && result && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{ fontSize:52 }}>{result.perfect ? '🎉' : result.correct >= result.total / 2 ? '👍' : '💪'}</div>
          <div style={{ fontSize:20, fontWeight:700, color:FC.dark }}>
            {result.perfect ? t('완벽해요!', 'Perfect!') : t(`${result.correct}/${result.total} 맞췄어요`, `Got ${result.correct}/${result.total} correct`)}
          </div>

          {/* 결과 비교 */}
          <div style={{
            display:'flex', gap:8, justifyContent:'center',
            background:'rgba(0,0,0,0.04)', borderRadius:16, padding:'14px 20px',
          }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:FC.muted, marginBottom:4 }}>{t('입력', 'Input')}</div>
              <div style={{ display:'flex', gap:5 }}>
                {input.map((d, i) => (
                  <div key={i} style={{
                    width:34, height:34, borderRadius:8,
                    background: d === numbers[i] ? FC.sage : FC.warn,
                    color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, fontWeight:700, fontFamily:'monospace',
                  }}>{d}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize:13, color:FC.muted }}>
            {t('정답', 'Answer')}: {numbers.join(' - ')}
          </div>

          <div style={{
            fontSize:16, fontWeight:700,
            color: result.perfect ? FC.amber : FC.sage,
          }}>
            +{result.score}{t('점', 'pts')}
          </div>

          <button onClick={() => onDone(result.score)} style={{
            fontFamily:"'Noto Sans KR',sans-serif",
            background:`linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`,
            color:'white', border:'none', borderRadius:14,
            padding:'13px 36px', fontSize:14, fontWeight:700, cursor:'pointer',
            boxShadow:`0 6px 20px ${FC.sage}44`,
          }}>
            {t('다음', 'Next')} →
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GridRound — 그리드 패턴 기억 라운드
// ──────────────────────────────────────────────────────────
function GridRound({ config, roundIndex, totalRounds, onDone }) {
  const { useState, useEffect } = React;
  const [phase, setPhase] = useState('show'); // show → input → result
  const [pattern]   = useState(() => genGridPattern(config.size, config.lights));
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  const [showCountdown, setShowCountdown] = useState(3);

  const total = config.size * config.size;

  // 패턴 표시 카운트다운
  useEffect(() => {
    if (phase !== 'show') return;
    if (showCountdown <= 0) {
      setTimeout(() => setPhase('input'), 400);
      return;
    }
    const t = setTimeout(() => setShowCountdown(v => v - 1), 900);
    return () => clearTimeout(t);
  }, [phase, showCountdown]);

  const handleCell = (i) => {
    if (phase !== 'input') return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = [...pattern].filter(i => selected.has(i)).length;
    const wrong   = [...selected].filter(i => !pattern.has(i)).length;
    const net     = Math.max(0, correct - wrong);
    const perfect = correct === pattern.size && wrong === 0;
    const score   = calcRoundScore('grid', net, pattern.size, perfect);
    setResult({ correct, wrong, total: pattern.size, perfect, score });
    setPhase('result');
  };

  const cellSize = config.size === 4 ? 62 : 76;
  const gap = config.size === 4 ? 8 : 10;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, padding:'0 24px' }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        width:'100%', marginBottom:24,
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:FC.muted }}>
          {t('라운드', 'Round')} {roundIndex + 1} / {totalRounds}
        </div>
        <div style={{
          background:FC.sagePale, color:FC.sage,
          fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:100,
        }}>🟢 {t('패턴 기억', 'Pattern Memory')}</div>
      </div>

      {/* 패턴 표시 단계 */}
      {phase === 'show' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:FC.dark, textAlign:'center' }}>
            {showCountdown > 0 ? t(`${showCountdown}초 후 패턴이 사라져요`, `Pattern disappears in ${showCountdown}s`) : t('패턴을 기억하세요!', 'Memorize the pattern!')}
          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${config.size}, ${cellSize}px)`,
            gap,
          }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width:cellSize, height:cellSize, borderRadius:14,
                background: pattern.has(i)
                  ? `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`
                  : 'rgba(0,0,0,0.06)',
                boxShadow: pattern.has(i) ? `0 4px 16px ${FC.sage}44` : 'none',
                transition:'all 0.3s',
              }}/>
            ))}
          </div>

          <div style={{ fontSize:13, color:FC.muted }}>
            {t(`${config.lights}개 칸의 위치를 기억하세요`, `Remember the position of ${config.lights} cells`)}
          </div>
        </div>
      )}

      {/* 입력 단계 */}
      {phase === 'input' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:FC.dark }}>
            {t('기억한 칸을 눌러보세요', 'Tap the cells you remember')}
          </div>
          <div style={{ fontSize:12, color:FC.muted }}>
            ({selected.size} / {config.lights}{t('개 선택됨', ' selected')})
          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${config.size}, ${cellSize}px)`,
            gap,
          }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} onClick={() => handleCell(i)} style={{
                width:cellSize, height:cellSize, borderRadius:14,
                background: selected.has(i)
                  ? `linear-gradient(135deg, ${FC.sky}, ${FC.skyL})`
                  : 'rgba(0,0,0,0.06)',
                border: `2px solid ${selected.has(i) ? FC.sky : 'transparent'}`,
                boxShadow: selected.has(i) ? `0 4px 16px ${FC.sky}44` : 'none',
                cursor:'pointer', transition:'all 0.2s',
                transform: selected.has(i) ? 'scale(1.05)' : 'scale(1)',
              }}/>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            style={{
              fontFamily:"'Noto Sans KR',sans-serif",
              background: selected.size > 0
                ? `linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`
                : 'rgba(0,0,0,0.1)',
              color: selected.size > 0 ? 'white' : FC.muted,
              border:'none', borderRadius:14,
              padding:'13px 36px', fontSize:14, fontWeight:700,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
            }}>
            {t('확인', 'Confirm')} →
          </button>
        </div>
      )}

      {/* 결과 단계 */}
      {phase === 'result' && result && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{ fontSize:52 }}>{result.perfect ? '✨' : result.correct >= result.total / 2 ? '🌿' : '💪'}</div>
          <div style={{ fontSize:20, fontWeight:700, color:FC.dark }}>
            {result.perfect ? t('완벽해요!', 'Perfect!') : t(`${result.correct}개 맞추고 ${result.wrong}개 틀렸어요`, `Got ${result.correct} right, ${result.wrong} wrong`)}
          </div>

          {/* 결과 그리드 */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${config.size}, 36px)`,
            gap:5,
          }}>
            {Array.from({ length: total }).map((_, i) => {
              const wasPattern = pattern.has(i);
              const wasSelected = selected.has(i);
              let bg = 'rgba(0,0,0,0.06)';
              if (wasPattern && wasSelected) bg = FC.sage;        // 정답
              else if (wasPattern && !wasSelected) bg = FC.amber; // 놓침
              else if (!wasPattern && wasSelected) bg = FC.warn;  // 오답
              return <div key={i} style={{ width:36, height:36, borderRadius:8, background:bg, transition:'all 0.3s' }}/>;
            })}
          </div>

          <div style={{ display:'flex', gap:14, fontSize:11 }}>
            <span style={{ color:FC.sage }}>■ {t('정답', 'Correct')}</span>
            <span style={{ color:FC.amber }}>■ {t('놓침', 'Missed')}</span>
            <span style={{ color:FC.warn }}>■ {t('오답', 'Wrong')}</span>
          </div>

          <div style={{ fontSize:16, fontWeight:700, color: result.perfect ? FC.amber : FC.sage }}>
            +{result.score}{t('점', 'pts')}
          </div>

          <button onClick={() => onDone(result.score)} style={{
            fontFamily:"'Noto Sans KR',sans-serif",
            background:`linear-gradient(135deg, ${FC.sage}, ${FC.sageL})`,
            color:'white', border:'none', borderRadius:14,
            padding:'13px 36px', fontSize:14, fontWeight:700, cursor:'pointer',
            boxShadow:`0 6px 20px ${FC.sage}44`,
          }}>
            {t('다음', 'Next')} →
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// FocusGame — 메인 컴포넌트
// ──────────────────────────────────────────────────────────
function FocusGame({ onExit }) {
  const { useState, useEffect, useRef } = React;

  const [screen, setScreen] = useState('intro'); // intro → playing → done
  const [roundIndex, setRoundIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [phq9, setPhq9]   = useState(null);
  const [gad7, setGad7]   = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const rounds = getRoundConfig(phq9, gad7);
  const totalRounds = rounds.length;

  // 개인 최고 기록 로드
  useEffect(() => {
    GameEngine.getGameStats().then(res => {
      if (res.success) {
        const focusStat = res.data?.perGame?.find(g => g.game_id === 'focus');
        if (focusStat?.best_score) setPersonalBest(focusStat.best_score);
      }
    }).catch(() => {});
  }, []);

  // PHQ9/GAD7 점수 로드 (게임 조정용)
  useEffect(() => {
    GameEngine.getMe().then(res => {
      if (res.success) {
        const scores = res.data?.userTestScores || {};
        setPhq9(scores.PHQ9 ?? null);
        setGad7(scores.GAD7 ?? null);
      }
    }).catch(() => {});
  }, []);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const maxPossible = rounds.reduce((acc, r) => {
    if (r.type === 'number') return acc + r.span * 10 + 30;
    return acc + r.lights * 8 + 25;
  }, 0);
  const accuracy = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  const handleStart = () => {
    setStartTime(Date.now());
    setScreen('playing');
  };

  const handleRoundDone = (score) => {
    const next = [...scores, score];
    setScores(next);
    if (roundIndex + 1 >= totalRounds) {
      setScreen('done');
    } else {
      setRoundIndex(v => v + 1);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const durationSec = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    try {
      await GameEngine.saveSession({
        gameId: 'focus',
        moduleType: 'focus_training',
        score: totalScore,
        durationSec,
        metadata: { rounds: totalRounds, accuracy },
      });
    } catch (e) {}
    setIsSaving(false);
    onExit({ newAchievements: [] });
  };

  const isNewRecord = personalBest !== null && totalScore > personalBest;

  // ── 인트로 화면 ─────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={{
      minHeight:'100%', display:'flex', flexDirection:'column',
      background:`linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`,
    }}>
      <div style={{ maxWidth:440, margin:'0 auto', padding:'32px 24px', display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <button onClick={() => onExit({})} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:22, padding:'4px 8px', color:FC.muted,
          }}>←</button>
          <div style={{ fontSize:16, fontWeight:700, color:FC.dark }}>{t('마음 집중력', 'Mind Focus')}</div>
          {personalBest !== null && (
            <div style={{
              marginLeft:'auto', fontSize:11, fontWeight:700,
              background:FC.amberL + '55', color:FC.amber,
              padding:'3px 10px', borderRadius:100,
            }}>
              {t('최고', 'Best')} {personalBest}{t('점', 'pts')}
            </div>
          )}
        </div>

        {/* 히어로 */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:72, marginBottom:16, animation:'float 3s ease-in-out infinite' }}>🧠</div>
          <h1 style={{
            fontSize:26, fontWeight:700, color:FC.dark, marginBottom:10,
            fontFamily:"'Noto Serif KR', serif", lineHeight:1.4,
          }}>
            {t('마음 집중력 훈련', 'Mind Focus Training')}
          </h1>
          <p style={{ fontSize:14, color:FC.muted, lineHeight:1.8 }}>
            {t('숫자 기억과 패턴 찾기로', 'Practice focusing on the present moment')}<br/>
            {t('지금 이 순간에 집중하는 연습을 해요', 'with number memory and pattern recall')}
          </p>
        </div>

        {/* 게임 소개 카드들 */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
          {[
            { emoji:'🔢', title:t('숫자 기억', 'Number Memory'), desc:t('순서대로 나타나는 숫자를 기억해 입력해요', 'Remember and enter the numbers in sequence'), color:FC.sky },
            { emoji:'🟢', title:t('패턴 기억', 'Pattern Memory'), desc:t('그리드에 표시된 위치를 기억하고 재현해요', 'Remember and reproduce the highlighted positions on the grid'), color:FC.sage },
          ].map(c => (
            <div key={c.title} style={{
              display:'flex', alignItems:'center', gap:14,
              background:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)',
              borderRadius:16, padding:'14px 16px',
              border:`1px solid ${c.color}22`,
            }}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background:`linear-gradient(135deg, ${c.color}22, ${c.color}10)`,
                border:`1.5px solid ${c.color}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22,
              }}>{c.emoji}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:FC.dark, marginBottom:3 }}>{c.title}</div>
                <div style={{ fontSize:12, color:FC.muted, lineHeight:1.5 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 라운드 수 안내 */}
        <div style={{
          background:`linear-gradient(135deg, ${FC.indigoPale}, rgba(255,255,255,0.7))`,
          borderRadius:14, padding:'12px 16px', marginBottom:28,
          border:`1px solid ${FC.indigo}22`, textAlign:'center',
        }}>
          <div style={{ fontSize:13, color:FC.indigo, fontWeight:600 }}>
            {t(`총 ${totalRounds}라운드 · 숫자 기억 + 패턴 기억 교차 진행`, `${totalRounds} rounds total · Number Memory + Pattern Memory alternating`)}
          </div>
        </div>

        <button onClick={handleStart} style={{
          fontFamily:"'Noto Sans KR',sans-serif",
          background:`linear-gradient(135deg, ${FC.sky}, ${FC.skyL})`,
          color:'white', border:'none', borderRadius:16,
          padding:'16px', fontSize:16, fontWeight:700, cursor:'pointer',
          boxShadow:`0 8px 28px ${FC.sky}44`,
          width:'100%',
        }}>
          {t('집중 훈련 시작하기', 'Start Focus Training')} →
        </button>
      </div>
    </div>
  );

  // ── 게임 진행 화면 ─────────────────────────────────────
  if (screen === 'playing') {
    const round = rounds[roundIndex];

    return (
      <div style={{
        minHeight:'100%', display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`,
      }}>
        <div style={{ maxWidth:440, margin:'0 auto', padding:'24px 0 32px', display:'flex', flexDirection:'column', minHeight:'100vh', width:'100%' }}>

          {/* 상단 헤더 + 진행 바 */}
          <div style={{ padding:'0 24px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:11, color:FC.muted }}>{t('진행', 'Progress')} {roundIndex} / {totalRounds}</span>
              <button onClick={() => onExit(null)} style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                background:'rgba(0,0,0,0.06)', color:FC.muted,
                border:'none', borderRadius:8, padding:'5px 11px',
                fontSize:11, cursor:'pointer',
              }}>{t('허브로', 'Hub')} →</button>
            </div>
            <div style={{ height:5, background:'rgba(0,0,0,0.07)', borderRadius:10, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:10,
                width:`${(roundIndex / totalRounds) * 100}%`,
                background:`linear-gradient(90deg, ${FC.sky}, ${FC.sage})`,
                transition:'width 0.4s ease',
              }}/>
            </div>
          </div>

          {round.type === 'number' ? (
            <NumberRound
              key={`n-${roundIndex}`}
              config={round}
              roundIndex={roundIndex}
              totalRounds={totalRounds}
              onDone={handleRoundDone}
            />
          ) : (
            <GridRound
              key={`g-${roundIndex}`}
              config={round}
              roundIndex={roundIndex}
              totalRounds={totalRounds}
              onDone={handleRoundDone}
            />
          )}
        </div>
      </div>
    );
  }

  // ── 완료 화면 ──────────────────────────────────────────
  if (screen === 'done') {
    const grade = accuracy >= 85 ? { label:t('탁월해요', 'Excellent'), emoji:'🏆', color:FC.amber }
                : accuracy >= 65 ? { label:t('잘 했어요', 'Well done'), emoji:'🌟', color:FC.sage }
                : accuracy >= 45 ? { label:t('좋은 시도예요', 'Good try'), emoji:'🌿', color:FC.sky }
                : { label:t('계속 연습해요', 'Keep practicing'), emoji:'💪', color:FC.muted };

    return (
      <div style={{
        minHeight:'100%', display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${FC.skyPale}, ${FC.cream}, ${FC.sagePale})`,
      }}>
        <div style={{ maxWidth:440, margin:'0 auto', padding:'32px 24px 40px', minHeight:'100vh' }}>

          {/* 상단 */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:72, marginBottom:12, animation:'fadeUp 0.5s ease' }}>
              {grade.emoji}
            </div>
            <h2 style={{ fontSize:24, fontWeight:700, color:FC.dark, marginBottom:8, fontFamily:"'Noto Serif KR',serif" }}>
              {t('훈련 완료!', 'Training Complete!')}
            </h2>
            <div style={{ fontSize:15, color:grade.color, fontWeight:700 }}>{grade.label}</div>

            {/* 신기록 배지 */}
            {isNewRecord && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                marginTop:12,
                background:`linear-gradient(135deg, ${FC.amber}, ${FC.amberL})`,
                color:'white', borderRadius:100, padding:'6px 16px',
                fontSize:13, fontWeight:700,
                animation:'pulse 1.5s ease-in-out infinite',
              }}>
                🏆 {t('신기록!', 'New Record!')}
              </div>
            )}
          </div>

          {/* 점수 카드 */}
          <div style={{
            background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)',
            borderRadius:22, padding:'24px', marginBottom:20,
            border:'1px solid rgba(255,255,255,0.7)',
            boxShadow:'0 8px 32px rgba(0,0,0,0.06)',
          }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:52, fontWeight:900, color:grade.color, fontFamily:'monospace' }}>
                {totalScore}
              </div>
              <div style={{ fontSize:13, color:FC.muted }}>{t('최종 점수', 'Final Score')}</div>
              {personalBest !== null && !isNewRecord && (
                <div style={{ fontSize:12, color:FC.muted, marginTop:4 }}>
                  {t('최고 기록', 'Best')} {personalBest}{t('점', 'pts')} · {t('차이', 'Gap')} {personalBest - totalScore}{t('점', 'pts')}
                </div>
              )}
              {personalBest === null && (
                <div style={{ fontSize:12, color:FC.sage, marginTop:4 }}>{t('첫 기록이에요!', 'First record!')} 🎉</div>
              )}
            </div>

            {/* 통계 그리드 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:t('정확도', 'Accuracy'), value:`${accuracy}%`,   color: accuracy >= 85 ? FC.amber : FC.sage },
                { label:t('완료 라운드', 'Rounds Done'), value:`${totalRounds}R`, color:FC.sky },
              ].map(s => (
                <div key={s.label} style={{
                  background:FC.cream, borderRadius:14, padding:'12px 14px', textAlign:'center',
                }}>
                  <div style={{ fontSize:11, color:FC.muted, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 라운드별 점수 */}
          <div style={{
            background:'rgba(255,255,255,0.7)', borderRadius:16, padding:'16px',
            marginBottom:24, border:'1px solid rgba(255,255,255,0.6)',
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:FC.muted, marginBottom:10 }}>{t('라운드별 점수', 'Score per Round')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {scores.map((s, i) => {
                const r = rounds[i];
                const maxR = r.type === 'number' ? r.span * 10 + 30 : r.lights * 8 + 25;
                const pct = Math.round((s / maxR) * 100);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:12, color:FC.muted, width:60, flexShrink:0 }}>
                      {r.type === 'number' ? '🔢' : '🟢'} R{i + 1}
                    </div>
                    <div style={{ flex:1, height:8, background:'rgba(0,0,0,0.06)', borderRadius:10, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', width:`${pct}%`, borderRadius:10,
                        background: pct >= 80 ? FC.amber : pct >= 50 ? FC.sage : FC.sky,
                        transition:'width 0.6s ease',
                      }}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:FC.dark, width:40, textAlign:'right' }}>
                      {s}{t('점', 'pts')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => onExit(null)} style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                flex:1, padding:'14px', borderRadius:14, border:'none',
                background:'rgba(255,255,255,0.8)', color:FC.muted,
                fontSize:13, fontWeight:600, cursor:'pointer',
              }}>
                {t('허브로', 'Hub')} →
              </button>
              <button onClick={handleSave} disabled={isSaving} style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                flex:2, padding:'14px', borderRadius:14, border:'none',
                background:`linear-gradient(135deg, ${FC.sky}, ${FC.skyL})`,
                color:'white', fontSize:14, fontWeight:700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow:`0 6px 20px ${FC.sky}44`,
              }}>
                {isSaving ? t('저장 중...', 'Saving...') : t('✓ 저장하고 나가기', '✓ Claim EXP')}
              </button>
            </div>
            <button onClick={() => {
              const text = t(
                `🧠 마음 집중력 훈련\n점수 ${totalScore}점 · 정확도 ${accuracy}%\n${totalRounds}라운드 완료${isNewRecord ? ' 🏆 신기록!' : ''}\n\n#마음풀 #마음게임 #집중력훈련`,
                `🧠 Mind Focus Training\nScore ${totalScore}pts · Accuracy ${accuracy}%\n${totalRounds} rounds complete${isNewRecord ? ' 🏆 New Record!' : ''}\n\n#Maumful #MindGame #FocusTraining`
              );
              if (navigator.share) navigator.share({ title: t('마음 집중력', 'Mind Focus'), text }).catch(()=>{});
              else navigator.clipboard?.writeText(text).then(()=>alert(t('복사됐어요!', 'Copied!'))).catch(()=>{});
            }} style={{
              fontFamily:"'Noto Sans KR',sans-serif",
              width:'100%', padding:'11px', borderRadius:14, border:'none',
              background:'rgba(255,255,255,0.6)', color:FC.muted,
              fontSize:13, fontWeight:600, cursor:'pointer',
            }}>
              {t('공유', 'Share')} 🔗
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
