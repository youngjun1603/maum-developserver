// ============================================================
// mood.jsx — 🎨 감정 수채화 일기
// 매일 1회 감정 체크인 + 30일 감정 캘린더
// ============================================================

const MOOD_EMOTIONS = [
  { id:'happy',   emoji:'😊', label:t('행복','Joyful'),  color:'#F5C842', bg:'#FFFAE0', textColor:'#8B6800' },
  { id:'calm',    emoji:'😌', label:t('평온','Calm'),    color:'#7BC4A0', bg:'#E8F5EE', textColor:'#2A6B4A' },
  { id:'tired',   emoji:'😴', label:t('피곤','Tired'),   color:'#9BB0C0', bg:'#EEF3F7', textColor:'#3A5060' },
  { id:'anxious', emoji:'😰', label:t('불안','Anxious'), color:'#F5A050', bg:'#FEF0E4', textColor:'#8B4000' },
  { id:'sad',     emoji:'😢', label:t('슬픔','Sad'),     color:'#6B9ACB', bg:'#EAF1F9', textColor:'#2A4A7A' },
  { id:'angry',   emoji:'😤', label:t('화남','Angry'),   color:'#E86C6C', bg:'#FDEAEA', textColor:'#7A2020' },
];

const MOOD_MAP = Object.fromEntries(MOOD_EMOTIONS.map(e => [e.id, e]));

const MC = {
  bg:     '#F8F5F0',
  card:   '#FFFFFF',
  text:   '#2C2520',
  muted:  '#8A8078',
  accent: '#7BC4A0',
};

const mbtn = (bg, color='white', extra={}) => ({
  fontFamily:"'Noto Sans KR', sans-serif",
  cursor:'pointer', border:'none', outline:'none',
  background:bg, color, borderRadius:14,
  fontWeight:700, transition:'all 0.2s',
  ...extra,
});

// ── 감정 분포 인사이트 계산 ─────────────────────────────────
function getMoodInsight(history) {
  if (history.length < 3) return null;
  const counts = {};
  MOOD_EMOTIONS.forEach(e => { counts[e.id] = 0; });
  history.forEach(d => { if (counts[d.emotion] !== undefined) counts[d.emotion]++; });
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  if (!top || top[1] === 0) return null;
  const e = MOOD_MAP[top[0]];
  const msgs = {
    happy:   t('최근 행복한 날이 많았어요. 그 에너지를 계속 이어가세요 🌟', 'You\'ve had many joyful days recently. Keep that energy going 🌟'),
    calm:    t('평온함을 자주 느끼고 있어요. 마음이 안정되어 있네요 🌿', 'You\'ve been feeling calm often. Your mind is at peace 🌿'),
    tired:   t('피로가 쌓여 있는 것 같아요. 충분한 휴식이 필요해요 😴', 'It seems fatigue has been building up. You need enough rest 😴'),
    anxious: t('불안한 날이 많았네요. 호흡 훈련이 도움이 될 수 있어요 💧', 'You\'ve had many anxious days. Breathing exercises can help 💧'),
    sad:     t('슬픈 감정이 많이 찾아왔군요. 감정은 지나가요. 괜찮아요 🌧️', 'Sadness has visited often. Feelings pass. It\'s okay 🌧️'),
    angry:   t('화가 많이 났던 시간이었네요. 그 감정도 소중해요 🔥', 'It\'s been a time of much anger. That feeling matters too 🔥'),
  };
  return { emoji: e.emoji, label: e.label, color: e.color, bg: e.bg, textColor: e.textColor, msg: msgs[top[0]] };
}

// ════════════════════════════════════════════════════════════
// MoodGame — 메인
// ════════════════════════════════════════════════════════════
function MoodGame({ onExit }) {
  const { useState, useEffect, useCallback } = React;

  const [screen,      setScreen]      = useState('loading');
  const [history,     setHistory]     = useState([]);
  const [todayDone,   setTodayDone]   = useState(false);
  const [todayEntry,  setTodayEntry]  = useState(null);
  const [selEmotion,  setSelEmotion]  = useState(null);
  const [intensity,   setIntensity]   = useState(3);
  const [note,        setNote]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [result,      setResult]      = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    GameEngine.getMoodHistory(30).then(res => {
      if (res.success) {
        const data = res.data || [];
        setHistory(data);
        const entry = data.find(d => d.date === today);
        if (entry) { setTodayDone(true); setTodayEntry(entry); }
      }
      setScreen('home');
    }).catch(() => setScreen('home'));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selEmotion) return;
    setSaving(true);
    const score = intensity * 20;
    try {
      const res = await GameEngine.saveSession({
        gameId: 'mood', moduleType: 'checkin',
        score, durationSec: 60,
        metadata: { emotion: selEmotion, intensity, note: note.trim() || null },
      });
      const newEntry = { date: today, emotion: selEmotion, intensity, note: note.trim() || null };
      setResult({ expGained: res.data?.expGained || 0, leveledUp: res.data?.leveledUp, newAchievements: res.data?.newAchievements || [] });
      setTodayDone(true); setTodayEntry(newEntry);
      setHistory(prev => [newEntry, ...prev.filter(d => d.date !== today)]);
      setScreen('done');
    } catch {
      setResult({ expGained: 0 });
      setScreen('done');
    }
    setSaving(false);
  }, [selEmotion, intensity, note, today]);

  // ── Loading ──────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        background:MC.bg, flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:40, animation:'float 2s ease-in-out infinite' }}>🎨</div>
        <div style={{ fontSize:13, color:MC.muted, fontFamily:"'Noto Sans KR',sans-serif" }}>
          {t('감정 기록을 불러오는 중...', 'Loading emotion log...')}
        </div>
      </div>
    );
  }

  function shareMood() {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    const stars = '⭐'.repeat(intensity);
    const text = `${e.emoji} ${t('오늘의 감정','Today\'s Emotion')}: ${e.label} ${stars}${note ? `\n"${note}"` : ''}\n\n${t('마음게임에서 함께해요','Join us on MaumGame')} 💕\nhttps://game.maumful.com`;
    navigator.share
      ? navigator.share({ title: t('오늘의 감정 기록', 'Today\'s Emotion Log'), text }).catch(() => {})
      : navigator.clipboard?.writeText(text).catch(() => {});
  }

  // ── Done ─────────────────────────────────────────────────
  if (screen === 'done') {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${e.bg}, ${MC.bg})`,
        padding:28, alignItems:'center', justifyContent:'center', textAlign:'center',
        animation:'fadeUp 0.5s ease',
      }}>
        <div style={{ fontSize:72, marginBottom:16 }}>{e.emoji}</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:MC.text, marginBottom:8,
          fontFamily:"'Noto Serif KR',serif" }}>
          {t('오늘의 감정이 기록됐어요', 'Today\'s Emotion Logged')}
        </h2>
        <div style={{ fontSize:14, color:MC.muted, marginBottom:24, lineHeight:1.8 }}>
          {e.label} · {t('강도','Intensity')} {'⭐'.repeat(intensity)}
          {note && <><br/><span style={{ fontStyle:'italic', color:MC.text }}>"{note}"</span></>}
        </div>
        {result?.expGained > 0 && (
          <div style={{
            background:'rgba(255,255,255,0.8)', borderRadius:16, padding:'14px 28px', marginBottom:24,
          }}>
            <div style={{ fontSize:24, fontWeight:700, color:MC.accent }}>+{result.expGained}</div>
            <div style={{ fontSize:12, color:MC.muted }}>{t('경험치','EXP')}</div>
          </div>
        )}
        <button onClick={shareMood} style={{
          ...mbtn('rgba(255,255,255,0.85)', MC.muted, { borderRadius:13, width:'100%', maxWidth:280 }),
          padding:'11px', fontSize:13, marginBottom:10,
        }}>
          💕 {t('파트너와 공유하기','Share with Partner')}
        </button>
        <div style={{ display:'flex', gap:10, width:'100%', maxWidth:280 }}>
          <button onClick={() => setScreen('calendar')} style={{
            ...mbtn('rgba(255,255,255,0.85)', MC.muted, { borderRadius:13, flex:1 }),
            padding:'12px', fontSize:13,
          }}>
            📅 {t('달력 보기','Calendar')}
          </button>
          <button onClick={onExit} style={{
            ...mbtn(`linear-gradient(135deg, ${MC.accent}, #5AA888)`, 'white', { flex:2, borderRadius:13 }),
            padding:'12px', fontSize:13, boxShadow:`0 4px 16px ${MC.accent}50`,
          }}>
            {t('허브로 →','Hub →')}
          </button>
        </div>
      </div>
    );
  }

  // ── Calendar ─────────────────────────────────────────────
  if (screen === 'calendar') {
    const histMap = Object.fromEntries(history.map(d => [d.date, d]));
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ iso, day: d.getDate(), entry: histMap[iso] });
    }
    const insight = getMoodInsight(history);

    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:MC.bg, overflow:'hidden' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(10px)',
          borderBottom:'1px solid rgba(0,0,0,0.06)',
        }}>
          <button onClick={() => setScreen('home')} style={{
            ...mbtn('rgba(0,0,0,0.06)', MC.muted, { borderRadius:9 }),
            padding:'6px 14px', fontSize:12,
          }}>{t('← 뒤로','← Back')}</button>
          <div style={{ fontSize:15, fontWeight:700, color:MC.text, fontFamily:"'Noto Serif KR',serif" }}>
            🎨 {t('30일 감정 달력','30-Day Emotion Calendar')}
          </div>
          <div style={{ width:64 }}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 16px 28px' }}>

          {/* 인사이트 배너 */}
          {insight && (
            <div style={{
              background:`linear-gradient(135deg, ${insight.bg}, rgba(255,255,255,0.9))`,
              border:`1px solid ${insight.color}40`, borderRadius:16,
              padding:'14px 16px', marginBottom:20,
              boxShadow:`0 2px 12px ${insight.color}20`,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:insight.textColor, marginBottom:5, letterSpacing:'0.5px' }}>
                {insight.emoji} {t('최근 30일 감정 인사이트','Last 30 Days Emotion Insight')}
              </div>
              <div style={{ fontSize:13, color:MC.text, lineHeight:1.6 }}>{insight.msg}</div>
            </div>
          )}

          {/* 감정 범례 */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16, justifyContent:'center' }}>
            {MOOD_EMOTIONS.map(e => (
              <div key={e.id} style={{
                display:'flex', alignItems:'center', gap:3,
                padding:'3px 8px', borderRadius:100,
                background:e.bg, border:`1px solid ${e.color}40`,
              }}>
                <span style={{ fontSize:11 }}>{e.emoji}</span>
                <span style={{ fontSize:10, fontWeight:600, color:e.textColor }}>{e.label}</span>
              </div>
            ))}
          </div>

          {/* 달력 그리드 — 6열 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:5, marginBottom:20 }}>
            {days.map(({ iso, day, entry }) => {
              const e = entry ? MOOD_MAP[entry.emotion] : null;
              const isToday = iso === today;
              return (
                <div key={iso} style={{
                  aspectRatio:'1', borderRadius:10,
                  background: e ? e.bg : 'rgba(0,0,0,0.04)',
                  border: isToday
                    ? `2px solid ${MC.accent}`
                    : `1px solid ${e ? e.color+'30' : 'rgba(0,0,0,0.06)'}`,
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                }}>
                  {e ? (
                    <>
                      <div style={{ fontSize:14 }}>{e.emoji}</div>
                      <div style={{ fontSize:8, color:e.textColor, fontWeight:600 }}>{day}</div>
                    </>
                  ) : (
                    <div style={{ fontSize:9, color:'rgba(0,0,0,0.18)', fontWeight:500 }}>{day}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 감정 분포 */}
          {history.length > 0 && (
            <div style={{
              background:'rgba(255,255,255,0.8)', borderRadius:14, padding:'14px',
              border:'1px solid rgba(0,0,0,0.06)', marginBottom:16,
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:MC.text, marginBottom:10 }}>📊 {t('감정 분포','Emotion Distribution')}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {MOOD_EMOTIONS.map(e => {
                  const count = history.filter(d => d.emotion === e.id).length;
                  if (count === 0) return null;
                  const pct = Math.round((count / history.length) * 100);
                  return (
                    <div key={e.id} style={{
                      display:'flex', alignItems:'center', gap:4,
                      padding:'5px 10px', borderRadius:100,
                      background:e.bg, border:`1px solid ${e.color}40`,
                    }}>
                      <span style={{ fontSize:12 }}>{e.emoji}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:e.textColor }}>{count}{t('일','d')} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 최근 기록 목록 */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:MC.text, marginBottom:10 }}>{t('최근 기록','Recent Logs')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {history.slice(0, 7).map((entry, i) => {
                  const e = MOOD_MAP[entry.emotion] || MOOD_MAP.calm;
                  return (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:12,
                      background:'rgba(255,255,255,0.8)', borderRadius:12, padding:'10px 14px',
                      border:`1px solid ${e.color}25`,
                    }}>
                      <span style={{ fontSize:22 }}>{e.emoji}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:MC.text }}>
                          {e.label} · {'⭐'.repeat(entry.intensity || 3)}
                        </div>
                        {entry.note && (
                          <div style={{ fontSize:11, color:MC.muted, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {entry.note}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:MC.muted, flexShrink:0 }}>{entry.date?.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Checkin — 감정 선택 ──────────────────────────────────
  if (screen === 'checkin_emotion') {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:MC.bg, overflow:'hidden' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(10px)',
          borderBottom:'1px solid rgba(0,0,0,0.06)',
        }}>
          <button onClick={() => setScreen('home')} style={{
            ...mbtn('rgba(0,0,0,0.06)', MC.muted, { borderRadius:9 }),
            padding:'6px 14px', fontSize:12,
          }}>{t('← 뒤로','← Back')}</button>
          <div style={{ fontSize:15, fontWeight:700, color:MC.text, fontFamily:"'Noto Serif KR',serif" }}>
            {t('오늘의 감정','Today\'s Emotion')}
          </div>
          <div style={{ width:64 }}/>
        </div>

        <div style={{ flex:1, padding:'28px 20px 24px', display:'flex', flexDirection:'column' }}>
          <p style={{ fontSize:15, color:MC.muted, textAlign:'center', marginBottom:28, lineHeight:1.7,
            fontFamily:"'Noto Sans KR',sans-serif" }}>
            {t('지금 이 순간, 어떤 감정이','Right now, which emotion')}
            <br/>
            {t('가장 크게 느껴지나요?','feels the strongest?')}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {MOOD_EMOTIONS.map(e => (
              <button key={e.id}
                onClick={() => { setSelEmotion(e.id); setIntensity(3); setNote(''); setScreen('checkin_detail'); }}
                style={{
                  background:e.bg, border:`2px solid ${e.color}70`,
                  borderRadius:18, padding:'18px 10px',
                  cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  transition:'all 0.2s', boxShadow:`0 2px 12px ${e.color}25`,
                }}>
                <span style={{ fontSize:32 }}>{e.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color:e.textColor }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Checkin — 강도 + 메모 ────────────────────────────────
  if (screen === 'checkin_detail') {
    const e = MOOD_MAP[selEmotion] || MOOD_MAP.calm;
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        background:`linear-gradient(160deg, ${e.bg}, ${MC.bg})`, overflow:'hidden' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', background:'rgba(255,255,255,0.75)', backdropFilter:'blur(10px)',
          borderBottom:'1px solid rgba(0,0,0,0.06)',
        }}>
          <button onClick={() => setScreen('checkin_emotion')} style={{
            ...mbtn('rgba(0,0,0,0.06)', MC.muted, { borderRadius:9 }),
            padding:'6px 14px', fontSize:12,
          }}>{t('← 뒤로','← Back')}</button>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:15, fontWeight:700, color:MC.text,
            fontFamily:"'Noto Serif KR',serif" }}>
            <span>{e.emoji}</span> {e.label}
          </div>
          <div style={{ width:64 }}/>
        </div>

        <div style={{ flex:1, padding:'28px 20px 24px', display:'flex', flexDirection:'column' }}>
          {/* 강도 선택 */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:14, fontWeight:700, color:MC.text, marginBottom:12, textAlign:'center',
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {t('감정의 강도는?','How intense is the emotion?')}
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setIntensity(n)} style={{
                  fontSize:30, background:'none', border:'none', cursor:'pointer', padding:4,
                  opacity: n <= intensity ? 1 : 0.2,
                  transform: n <= intensity ? 'scale(1.1)' : 'scale(1)',
                  transition:'all 0.15s',
                }}>⭐</button>
              ))}
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:MC.muted, marginTop:8,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {[
                '',
                t('매우 약하게','Very Mild'),
                t('약하게','Mild'),
                t('보통','Moderate'),
                t('강하게','Strong'),
                t('매우 강하게','Very Strong'),
              ][intensity]}
            </div>
          </div>

          {/* 메모 */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:MC.text, marginBottom:8,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {t('한 마디','A note')} <span style={{ color:MC.muted, fontWeight:400 }}>({t('선택사항','optional')})</span>
            </div>
            <textarea
              value={note}
              onChange={ev => setNote(ev.target.value)}
              placeholder={t('오늘 이 감정이 든 이유나 메모를 남겨요...','Leave a note about why you feel this way today...')}
              rows={3}
              maxLength={100}
              style={{
                width:'100%', padding:'12px 14px',
                border:`1.5px solid ${e.color}60`, borderRadius:12,
                fontSize:14, fontFamily:"'Noto Sans KR',sans-serif",
                outline:'none', resize:'none', lineHeight:1.65,
                background:'rgba(255,255,255,0.9)', color:MC.text,
              }}
              onFocus={ev => ev.target.style.borderColor = e.color}
              onBlur={ev => ev.target.style.borderColor = `${e.color}60`}
            />
            <div style={{ textAlign:'right', fontSize:10, color:MC.muted, marginTop:3 }}>{note.length}/100</div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            ...mbtn(
              saving ? 'rgba(0,0,0,0.1)' : `linear-gradient(135deg, ${e.color}, ${e.color}CC)`,
              saving ? MC.muted : 'white'
            ),
            padding:'14px', fontSize:15,
            boxShadow: saving ? 'none' : `0 4px 16px ${e.color}40`,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? t('저장 중...','Saving...') : t('오늘의 감정 기록하기 🎨','Log Today\'s Emotion 🎨')}
          </button>
        </div>
      </div>
    );
  }

  // ── Home ─────────────────────────────────────────────────
  const histMap = Object.fromEntries(history.map(d => [d.date, d]));
  const recentDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const DOW_KO = ['일','월','화','수','목','금','토'];
    const DOW_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    recentDays.push({ iso, dow:t(DOW_KO[d.getDay()], DOW_EN[d.getDay()]), entry:histMap[iso] });
  }
  const todayEmotionData = todayEntry ? MOOD_MAP[todayEntry.emotion] : null;
  const insight = getMoodInsight(history);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:MC.bg, overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🎨</span>
          <span style={{ fontSize:15, fontWeight:700, color:MC.text, fontFamily:"'Noto Serif KR',serif" }}>
            {t('감정 수채화','Emotion Watercolor')}
          </span>
        </div>
        <button onClick={onExit} style={{
          ...mbtn('rgba(0,0,0,0.06)', MC.muted, { borderRadius:9 }),
          padding:'6px 13px', fontSize:12,
        }}>{t('허브로 →','Hub →')}</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px 32px' }}>

        {/* 오늘의 감정 카드 */}
        {todayDone && todayEmotionData ? (
          <div style={{
            background:`linear-gradient(135deg, ${todayEmotionData.bg}, white)`,
            border:`1px solid ${todayEmotionData.color}40`, borderRadius:20, padding:'20px',
            marginBottom:20, boxShadow:`0 4px 20px ${todayEmotionData.color}20`,
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:MC.muted, marginBottom:8, letterSpacing:'0.5px',
              fontFamily:"'Noto Sans KR',sans-serif" }}>{t('오늘의 감정','Today\'s Emotion')} ✓</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:40 }}>{todayEmotionData.emoji}</span>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:MC.text, marginBottom:3,
                  fontFamily:"'Noto Sans KR',sans-serif" }}>
                  {todayEmotionData.label} · {'⭐'.repeat(todayEntry.intensity || 3)}
                </div>
                {todayEntry.note && (
                  <div style={{ fontSize:12, color:MC.muted, fontStyle:'italic' }}>"{todayEntry.note}"</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background:'rgba(255,255,255,0.92)', borderRadius:20, padding:'22px 20px',
            marginBottom:20, boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
            border:'1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:MC.muted, marginBottom:6, letterSpacing:'0.5px',
              fontFamily:"'Noto Sans KR',sans-serif" }}>{t('오늘의 감정','Today\'s Emotion')}</div>
            <div style={{ fontSize:14, color:MC.text, fontWeight:500, marginBottom:16, lineHeight:1.7,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {t('오늘의 감정을 기록해보세요.','Record today\'s emotion.')}<br/>
              <span style={{ color:MC.muted, fontSize:12 }}>{t('감정을 알아차리는 것이 치유의 시작이에요.','Recognizing your emotions is the beginning of healing.')}</span>
            </div>
            <button onClick={() => setScreen('checkin_emotion')} style={{
              ...mbtn(`linear-gradient(135deg, ${MC.accent}, #5AA888)`),
              width:'100%', padding:'13px', fontSize:14,
              boxShadow:`0 4px 16px ${MC.accent}40`,
            }}>
              🎨 {t('오늘의 감정 기록하기','Log Today\'s Emotion')}
            </button>
          </div>
        )}

        {/* 7일 미니 캘린더 */}
        <div style={{
          background:'rgba(255,255,255,0.8)', borderRadius:16, padding:'16px',
          marginBottom:20, backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.6)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:MC.text, fontFamily:"'Noto Sans KR',sans-serif" }}>
              📅 {t('최근 7일','Last 7 Days')}
            </div>
            <button onClick={() => setScreen('calendar')} style={{
              background:'none', border:'none', fontSize:11, color:MC.accent, fontWeight:700, cursor:'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}>{t('전체 보기 →','View All →')}</button>
          </div>
          <div style={{ display:'flex', gap:6, justifyContent:'space-between' }}>
            {recentDays.map(({ iso, dow, entry }) => {
              const e = entry ? MOOD_MAP[entry.emotion] : null;
              const isToday = iso === today;
              return (
                <div key={iso} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:10, color:MC.muted, fontWeight:500 }}>{dow}</div>
                  <div style={{
                    width:'100%', aspectRatio:'1', borderRadius:9,
                    background: e ? e.bg : 'rgba(0,0,0,0.05)',
                    border: isToday ? `2px solid ${MC.accent}` : (e ? `1px solid ${e.color}40` : 'none'),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: e ? 14 : 0, transition:'all 0.2s',
                  }}>
                    {e ? e.emoji : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 인사이트 배너 */}
        {insight && (
          <div style={{
            background:`linear-gradient(135deg, ${insight.bg}, rgba(255,255,255,0.9))`,
            border:`1px solid ${insight.color}30`, borderRadius:14, padding:'14px 16px',
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:insight.textColor, marginBottom:5, letterSpacing:'0.5px',
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {insight.emoji} {t('감정 인사이트','Emotion Insight')}
            </div>
            <div style={{ fontSize:13, color:MC.text, lineHeight:1.6, fontFamily:"'Noto Sans KR',sans-serif" }}>
              {insight.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
