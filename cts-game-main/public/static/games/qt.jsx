// ============================================================
// qt.jsx — QT 체크인 게임 (The Light of Life CTS 전용)
// 매일 성경 말씀 묵상 기록 + 30일 달력 시각화
// ============================================================

;(function injectQTStyles() {
  if (document.getElementById('qt-styles')) return;
  const s = document.createElement('style');
  s.id = 'qt-styles';
  s.textContent = `
    @keyframes qtFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes qtGlow { 0%,100%{box-shadow:0 0 8px rgba(107,33,168,0.3)} 50%{box-shadow:0 0 24px rgba(107,33,168,0.6)} }
    .qt-card { animation: qtFadeIn 0.4s ease both; }
    .qt-dot-filled { background: linear-gradient(135deg,#6B21A8,#9333EA); }
    .qt-dot-today { border: 3px solid #D4AF37 !important; }
    .qt-dot-empty { background: #F3E8FF; }
    .qt-book-open { animation: qtGlow 2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
})();

const QTGame = ({ onExit }) => {
  const R = React;
  const [screen, setScreen] = R.useState('intro');
  const [book, setBook]     = R.useState('');
  const [chapter, setChapter] = R.useState('');
  const [verse, setVerse]   = R.useState('');
  const [meditation, setMeditation] = R.useState('');
  const [prayer, setPrayer] = R.useState('');
  const [history, setHistory] = R.useState([]);
  const [doneData, setDoneData] = R.useState(null);
  const [saving, setSaving] = R.useState(false);
  const [tab, setTab] = R.useState('write'); // 'write' | 'calendar'

  const TODAY = new Date();
  const todayKey = TODAY.toISOString().slice(0, 10);

  R.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lol_qt_history') || '[]');
      setHistory(saved);
    } catch {}
  }, []);

  const todayDone = history.some(h => h.date === todayKey);

  async function handleSubmit() {
    if (!book.trim() || !meditation.trim()) return;
    setSaving(true);

    const entry = {
      date: todayKey,
      book: book.trim(),
      chapter: chapter.trim(),
      verse: verse.trim(),
      meditation: meditation.trim(),
      prayer: prayer.trim(),
    };

    const newHistory = [entry, ...history.filter(h => h.date !== todayKey)];
    try { localStorage.setItem('lol_qt_history', JSON.stringify(newHistory.slice(0, 90))); } catch {}
    setHistory(newHistory);

    const sec = Math.floor((Date.now() - window._qtStart) / 1000) || 120;
    let expGained = 0;
    try {
      const res = await GameEngine.saveSession({
        gameId: 'qt', moduleType: 'MINDFULNESS', score: 50, durationSec: sec,
        metadata: { book: entry.book, chapter: entry.chapter, has_prayer: !!entry.prayer },
      });
      expGained = res.data?.expGained || 0;
    } catch {}

    setSaving(false);
    setDoneData({ expGained });
    setScreen('done');
  }

  // ── 인트로 화면 ─────────────────────────────────────────────
  if (screen === 'intro') {
    window._qtStart = Date.now();
    return (
      <div className="qt-card" style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:'linear-gradient(160deg,#F3E8FF 0%,#FDFBFF 60%)',
        padding:32, textAlign:'center', fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        <div className="qt-book-open" style={{
          width:80, height:80, borderRadius:'50%',
          background:'linear-gradient(135deg,#6B21A8,#9333EA)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:40, marginBottom:24,
        }}>📖</div>

        <h1 style={{fontSize:26,fontWeight:700,color:'#4C1D95',marginBottom:8}}>{t('QT 체크인', 'QT Check-in')}</h1>
        <p style={{fontSize:16,color:'#6B21A8',fontWeight:500,marginBottom:4}}>{t('오늘의 말씀 묵상을 기록하세요', "Record today's Scripture meditation")}</p>
        <p style={{fontSize:13,color:'#7C3AED',marginBottom:28,lineHeight:1.6}}>
          {t(<>"오직 여호와의 율법을 즐거워하여<br/>그의 율법을 주야로 묵상하는도다"<br/></>,
             <>"But his delight is in the law of the LORD,<br/>and he meditates on it day and night."<br/></>)}
          <span style={{fontSize:11,color:'#9333EA'}}>{t('시편 1:2', 'Psalm 1:2')}</span>
        </p>

        {todayDone && (
          <div style={{
            background:'linear-gradient(135deg,#D4AF37,#F59E0B)', color:'white',
            borderRadius:12, padding:'10px 20px', marginBottom:20, fontSize:14, fontWeight:600,
          }}>
            {t('✅ 오늘 QT를 완료했어요!', '✅ You completed QT today!')}
          </div>
        )}

        <div style={{display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center'}}>
          <button
            onClick={() => setScreen('write')}
            style={{
              background:'linear-gradient(135deg,#6B21A8,#9333EA)', color:'white',
              border:'none', borderRadius:14, padding:'14px 28px',
              fontSize:16, fontWeight:700, cursor:'pointer',
            }}
          >
            {todayDone ? t('다시 기록하기', 'Record again') : t('📖 오늘 QT 시작', '📖 Start Today\'s QT')}
          </button>
          <button
            onClick={() => setScreen('calendar')}
            style={{
              background:'#F3E8FF', color:'#6B21A8',
              border:'2px solid #C4B5FD', borderRadius:14, padding:'14px 28px',
              fontSize:15, fontWeight:600, cursor:'pointer',
            }}
          >
            {t('📅 QT 달력 보기', '📅 View QT Calendar')}
          </button>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:20,color:'#9333EA',fontSize:13}}>
          <span>{t(`연속 ${history.length > 0 ? calcStreak(history) : 0}일 QT 중`, `${history.length > 0 ? calcStreak(history) : 0}-day QT streak`)}</span>
          <span>🔥</span>
        </div>

        <button onClick={() => onExit(null)}
          style={{marginTop:24,background:'none',border:'none',color:'#9CA3AF',fontSize:13,cursor:'pointer'}}>
          {t('← 게임 목록으로', '← Back to games')}
        </button>
      </div>
    );
  }

  // ── QT 입력 화면 ───────────────────────────────────────────
  if (screen === 'write') {
    return (
      <div className="qt-card" style={{
        minHeight:'100vh', background:'#FDFBFF',
        fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        {/* 헤더 */}
        <div style={{
          background:'linear-gradient(135deg,#6B21A8,#9333EA)',
          padding:'16px 20px', display:'flex', alignItems:'center', gap:12,
        }}>
          <button onClick={() => setScreen('intro')}
            style={{background:'none',border:'none',color:'rgba(255,255,255,0.8)',fontSize:20,cursor:'pointer'}}>
            ←
          </button>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:17}}>{t('📖 오늘의 QT', "📖 Today's QT")}</div>
            <div style={{color:'rgba(255,255,255,0.8)',fontSize:12}}>{todayKey}</div>
          </div>
        </div>

        <div style={{maxWidth:480, margin:'0 auto', padding:'24px 20px'}}>

          {/* 말씀 정보 */}
          <div style={{background:'white',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 12px rgba(107,33,168,0.08)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6B21A8',marginBottom:12}}>{t('📚 오늘 읽은 성경', '📚 Scripture I read today')}</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:11,color:'#7C3AED',fontWeight:600}}>{t('책 이름 *', 'Book *')}</label>
                <input
                  value={book} onChange={e => setBook(e.target.value)}
                  placeholder={t('예: 시편', 'e.g., Psalm')}
                  style={{
                    width:'100%', border:'1.5px solid #DDD6FE', borderRadius:10,
                    padding:'9px 12px', fontSize:14, outline:'none', marginTop:4,
                    fontFamily:"'Noto Sans KR',sans-serif",
                  }}
                />
              </div>
              <div>
                <label style={{fontSize:11,color:'#7C3AED',fontWeight:600}}>{t('장', 'Ch.')}</label>
                <input
                  value={chapter} onChange={e => setChapter(e.target.value)}
                  placeholder="1"
                  style={{
                    width:'100%', border:'1.5px solid #DDD6FE', borderRadius:10,
                    padding:'9px 12px', fontSize:14, outline:'none', marginTop:4,
                    fontFamily:"'Noto Sans KR',sans-serif",
                  }}
                />
              </div>
              <div>
                <label style={{fontSize:11,color:'#7C3AED',fontWeight:600}}>{t('절', 'Verse')}</label>
                <input
                  value={verse} onChange={e => setVerse(e.target.value)}
                  placeholder="1-10"
                  style={{
                    width:'100%', border:'1.5px solid #DDD6FE', borderRadius:10,
                    padding:'9px 12px', fontSize:14, outline:'none', marginTop:4,
                    fontFamily:"'Noto Sans KR',sans-serif",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 묵상 내용 */}
          <div style={{background:'white',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 12px rgba(107,33,168,0.08)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6B21A8',marginBottom:8}}>
              {t('🌱 오늘 말씀에서 받은 은혜 *', '🌱 The grace I received from the Word today *')}
            </div>
            <textarea
              value={meditation} onChange={e => setMeditation(e.target.value)}
              placeholder={t('오늘 읽은 말씀이 내 마음에 어떻게 다가왔나요? 깨달은 것, 위로 받은 것, 도전 받은 것을 자유롭게 적어보세요.', 'How did today\'s Scripture speak to your heart? Freely write what you realized, were comforted by, or were challenged by.')}
              rows={5}
              style={{
                width:'100%', border:'1.5px solid #DDD6FE', borderRadius:12,
                padding:'12px 14px', fontSize:14, outline:'none', resize:'vertical',
                fontFamily:"'Noto Sans KR',sans-serif", lineHeight:1.6, color:'#1A1A1A',
              }}
            />
          </div>

          {/* 기도 제목 */}
          <div style={{background:'white',borderRadius:16,padding:20,marginBottom:24,boxShadow:'0 2px 12px rgba(107,33,168,0.08)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6B21A8',marginBottom:8}}>
              {t('🙏 오늘의 기도 제목 (선택)', '🙏 Today\'s prayer request (optional)')}
            </div>
            <textarea
              value={prayer} onChange={e => setPrayer(e.target.value)}
              placeholder={t('오늘 말씀을 통해 드리고 싶은 기도를 적어보세요.', 'Write a prayer you\'d like to offer through today\'s Word.')}
              rows={3}
              style={{
                width:'100%', border:'1.5px solid #DDD6FE', borderRadius:12,
                padding:'12px 14px', fontSize:14, outline:'none', resize:'vertical',
                fontFamily:"'Noto Sans KR',sans-serif", lineHeight:1.6, color:'#1A1A1A',
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!book.trim() || !meditation.trim() || saving}
            style={{
              width:'100%', background: (book.trim() && meditation.trim() && !saving)
                ? 'linear-gradient(135deg,#6B21A8,#9333EA)' : '#E5E7EB',
              color: (book.trim() && meditation.trim()) ? 'white' : '#9CA3AF',
              border:'none', borderRadius:14, padding:'15px',
              fontSize:16, fontWeight:700, cursor: (book.trim() && meditation.trim() && !saving) ? 'pointer' : 'not-allowed',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}
          >
            {saving ? t('저장 중...', 'Saving...') : t('✅ QT 완료하기', '✅ Complete QT')}
          </button>
        </div>
      </div>
    );
  }

  // ── QT 달력 화면 ───────────────────────────────────────────
  if (screen === 'calendar') {
    const year  = TODAY.getFullYear();
    const month = TODAY.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];
    for (let i = 0; i < firstDay; i++) monthDates.push(null);
    for (let d = 1; d <= daysInMonth; d++) monthDates.push(d);

    return (
      <div className="qt-card" style={{
        minHeight:'100vh', background:'#FDFBFF',
        fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        <div style={{
          background:'linear-gradient(135deg,#6B21A8,#9333EA)',
          padding:'16px 20px', display:'flex', alignItems:'center', gap:12,
        }}>
          <button onClick={() => setScreen('intro')}
            style={{background:'none',border:'none',color:'rgba(255,255,255,0.8)',fontSize:20,cursor:'pointer'}}>
            ←
          </button>
          <div style={{color:'white',fontWeight:700,fontSize:17}}>{t('📅 QT 달력', '📅 QT Calendar')}</div>
        </div>

        <div style={{maxWidth:480, margin:'0 auto', padding:'24px 20px'}}>
          <div style={{textAlign:'center', marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:700,color:'#4C1D95'}}>
              {t(`${year}년 ${month + 1}월`, new Date(year, month).toLocaleDateString('en-US',{month:'long',year:'numeric'}))}
            </div>
            <div style={{fontSize:13,color:'#7C3AED',marginTop:4}}>
              {t(`이번 달 ${history.filter(h=>h.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length}회 QT 완료`, `${history.filter(h=>h.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} QT done this month`)}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8}}>
            {[t('일','Su'),t('월','Mo'),t('화','Tu'),t('수','We'),t('목','Th'),t('금','Fr'),t('토','Sa')].map(d => (
              <div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,color:'#7C3AED',padding:'4px 0'}}>{d}</div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {monthDates.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const done = history.some(h => h.date === dateKey);
              const isToday = dateKey === todayKey;
              return (
                <div key={i} style={{
                  aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight: isToday ? 700 : 400,
                  background: done ? 'linear-gradient(135deg,#6B21A8,#9333EA)' : '#F3E8FF',
                  color: done ? 'white' : isToday ? '#6B21A8' : '#9CA3AF',
                  border: isToday ? '2px solid #D4AF37' : 'none',
                  cursor: done ? 'pointer' : 'default',
                }}>
                  {done ? '✝️' : d}
                </div>
              );
            })}
          </div>

          {/* 최근 QT 기록 */}
          <div style={{marginTop:24}}>
            <div style={{fontSize:14,fontWeight:700,color:'#4C1D95',marginBottom:12}}>{t('최근 QT 기록', 'Recent QT Records')}</div>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} style={{
                background:'white', borderRadius:14, padding:'14px 16px', marginBottom:10,
                boxShadow:'0 2px 8px rgba(107,33,168,0.07)',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#6B21A8'}}>
                    📖 {h.book} {h.chapter && t(`${h.chapter}장`, `ch.${h.chapter}`)}{h.verse && t(` ${h.verse}절`, `:${h.verse}`)}
                  </span>
                  <span style={{fontSize:11,color:'#9CA3AF'}}>{h.date}</span>
                </div>
                <p style={{fontSize:13,color:'#374151',lineHeight:1.5,margin:0,
                  display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                  {h.meditation}
                </p>
                {h.prayer && (
                  <p style={{fontSize:12,color:'#7C3AED',marginTop:6,marginBottom:0}}>
                    🙏 {h.prayer.slice(0, 50)}{h.prayer.length > 50 ? '...' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setScreen('write')}
            style={{
              width:'100%', marginTop:8,
              background:'linear-gradient(135deg,#6B21A8,#9333EA)', color:'white',
              border:'none', borderRadius:14, padding:'14px',
              fontSize:15, fontWeight:700, cursor:'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}
          >
            {t('📖 오늘 QT 하기', "📖 Do Today's QT")}
          </button>
        </div>
      </div>
    );
  }

  // ── 완료 화면 ─────────────────────────────────────────────
  if (screen === 'done') {
    const streak = calcStreak(history);
    return (
      <div className="qt-card" style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:'linear-gradient(160deg,#F3E8FF 0%,#FDFBFF 60%)',
        padding:32, textAlign:'center', fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        <div style={{
          width:90, height:90, borderRadius:'50%',
          background:'linear-gradient(135deg,#D4AF37,#F59E0B)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:44, marginBottom:20,
        }}>✝️</div>

        <h2 style={{fontSize:24,fontWeight:700,color:'#4C1D95',marginBottom:8}}>
          {t('말씀이 임했습니다!', 'The Word has come!')}
        </h2>
        <p style={{fontSize:15,color:'#6B21A8',marginBottom:4}}>
          {t('오늘의 QT를 완료했어요', "You completed today's QT")}
        </p>
        {streak >= 3 && (
          <div style={{
            background:'linear-gradient(135deg,#6B21A8,#9333EA)', color:'white',
            borderRadius:20, padding:'6px 18px', marginBottom:16, fontSize:13, fontWeight:600,
          }}>
            {t(`🔥 ${streak}일 연속 QT 중!`, `🔥 ${streak}-day QT streak!`)}
          </div>
        )}
        {doneData?.expGained > 0 && (
          <div style={{color:'#D4AF37', fontSize:16, fontWeight:700, marginBottom:16}}>
            {t(`+${doneData.expGained} EXP 획득`, `+${doneData.expGained} EXP earned`)}
          </div>
        )}

        <p style={{
          fontSize:13, color:'#7C3AED', marginBottom:28,
          lineHeight:1.8, background:'#F3E8FF', borderRadius:12, padding:'12px 20px',
        }}>
          {t(<>"여호와의 말씀은 순결함이여<br/>흙 도가니에 일곱 번 단련한 은 같도다"<br/></>,
             <>"The words of the LORD are flawless,<br/>like silver refined seven times in a furnace."<br/></>)}
          <span style={{fontSize:11}}>{t('시편 12:6', 'Psalm 12:6')}</span>
        </p>

        <div style={{display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center'}}>
          <button
            onClick={() => setScreen('calendar')}
            style={{
              background:'#F3E8FF', color:'#6B21A8', border:'2px solid #C4B5FD',
              borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:600, cursor:'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}
          >
            {t('📅 달력 보기', '📅 View Calendar')}
          </button>
          <button
            onClick={() => onExit({ score: 50, expGained: doneData?.expGained || 0 })}
            style={{
              background:'linear-gradient(135deg,#6B21A8,#9333EA)', color:'white',
              border:'none', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:600, cursor:'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}
          >
            {t('게임 목록으로 →', 'Back to games →')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

function calcStreak(history) {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cur = new Date();
  for (const h of sorted) {
    const d = new Date(h.date);
    const diff = Math.round((cur - d) / 86400000);
    if (diff <= 1) { streak++; cur = d; }
    else break;
  }
  return streak;
}
