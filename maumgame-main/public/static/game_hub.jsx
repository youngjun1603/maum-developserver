// ============================================================
// game_hub.jsx  —  마음의 정원 허브 메인 페이지
// 치유 · 자연 · 따뜻한 수채화 컨셉
// ============================================================
const { useState, useEffect, useRef, useCallback } = React;

// ── 팔레트 ──────────────────────────────────────────────────
const C = {
  sage:    '#4A7C59',
  sageL:   '#7BA88A',
  sagePale:'#EAF2EC',
  cream:   '#FDFCF7',
  sand:    '#F5EFE0',
  dusty:   '#6B8FA8',
  dustyL:  '#A8C4D4',
  amber:   '#D4954A',
  amberL:  '#E8C47A',
  muted:   '#8A8A78',
  dark:    '#2C2C20',
  fogGray: '#9BA8B0',
};

// ── 공통 스타일 헬퍼 ────────────────────────────────────────
const btn = (extra='') => ({
  fontFamily: "'Noto Sans KR', sans-serif",
  cursor: 'pointer', border: 'none', outline: 'none', ...{}
});

// ──────────────────────────────────────────────────────────
// GardenSVG — 정원 상태별 SVG 일러스트
// ──────────────────────────────────────────────────────────
function GardenSVG({ status = 'clearing', level = 1, style = {} }) {
  const theme = {
    foggy: {
      skyTop:'#7A8E9A', skyBot:'#B0BFC8',
      ground:'#6A7A6A', groundDark:'#4A5A4A',
      treeTrunk:'#5A4A3A', treeLeaf:'#556655',
      fogOpacity: 0.55, flowersVisible: false,
      sunVisible: false, birdsVisible: false,
    },
    clearing: {
      skyTop:'#5A8AC0', skyBot:'#A0C8E0',
      ground:'#5A8A4A', groundDark:'#3E6A32',
      treeTrunk:'#6B4F3A', treeLeaf:'#4A8A3A',
      fogOpacity: 0.2, flowersVisible: true,
      sunVisible: true, birdsVisible: false,
    },
    blooming: {
      skyTop:'#3A7AC0', skyBot:'#80C0E0',
      ground:'#4A8A3A', groundDark:'#2E6A22',
      treeTrunk:'#7B5F4A', treeLeaf:'#3A9A2A',
      fogOpacity: 0, flowersVisible: true,
      sunVisible: true, birdsVisible: true,
    },
  }[status] || {};

  const leafCount = Math.min(1 + Math.floor(level * 0.8), 6);

  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%', ...style }}>
      {/* 하늘 그라데이션 */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.skyTop}/>
          <stop offset="100%" stopColor={theme.skyBot}/>
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.ground}/>
          <stop offset="100%" stopColor={theme.groundDark}/>
        </linearGradient>
        <filter id="softBlur"><feGaussianBlur stdDeviation="2"/></filter>
        <filter id="fogBlur"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>

      {/* 하늘 배경 */}
      <rect width="320" height="200" fill="url(#skyGrad)"/>

      {/* 태양 */}
      {theme.sunVisible && (
        <g>
          <circle cx="260" cy="38" r="22" fill={C.amberL} opacity="0.9"/>
          <circle cx="260" cy="38" r="17" fill="#FFE08A"/>
          {[0,45,90,135,180,225,270,315].map(a=>(
            <line key={a} x1={260+Math.cos(a*Math.PI/180)*20} y1={38+Math.sin(a*Math.PI/180)*20}
              x2={260+Math.cos(a*Math.PI/180)*27} y2={38+Math.sin(a*Math.PI/180)*27}
              stroke="#FFE08A" strokeWidth="2" strokeLinecap="round"/>
          ))}
        </g>
      )}

      {/* 구름 */}
      {status !== 'foggy' && (
        <g opacity="0.85">
          <ellipse cx="80" cy="55" rx="28" ry="14" fill="white" opacity="0.9"/>
          <ellipse cx="95" cy="48" rx="18" ry="12" fill="white" opacity="0.9"/>
          <ellipse cx="65" cy="52" rx="16" ry="10" fill="white" opacity="0.9"/>
          <ellipse cx="195" cy="40" rx="22" ry="11" fill="white" opacity="0.75"/>
          <ellipse cx="208" cy="34" rx="14" ry="9" fill="white" opacity="0.75"/>
        </g>
      )}

      {/* 새 */}
      {theme.birdsVisible && (
        <g fill="none" stroke={C.dusty} strokeWidth="1.5" strokeLinecap="round">
          <path d="M 150 50 Q 154 46 158 50"/>
          <path d="M 162 44 Q 166 40 170 44"/>
          <path d="M 130 62 Q 133 58 136 62"/>
        </g>
      )}

      {/* 지면 */}
      <ellipse cx="160" cy="185" rx="190" ry="30" fill="url(#groundGrad)"/>
      <rect x="0" y="172" width="320" height="28" fill={theme.groundDark}/>

      {/* 풀 */}
      {status !== 'foggy' && (
        <g fill={theme.ground} opacity="0.8">
          {[30,55,90,130,190,230,265,290].map((x,i)=>(
            <g key={x}>
              <line x1={x} y1="172" x2={x-4} y2={162-i%3*4} stroke={theme.treeLeaf} strokeWidth="2" strokeLinecap="round"/>
              <line x1={x} y1="172" x2={x+3} y2={163-i%2*5} stroke={theme.treeLeaf} strokeWidth="2" strokeLinecap="round"/>
            </g>
          ))}
        </g>
      )}

      {/* 나무 몸통 */}
      <rect x="152" y="110" width="16" height="62" rx="5" fill={theme.treeTrunk}/>
      <rect x="155" y="128" width="10" height="44" rx="3" fill={theme.treeTrunk} opacity="0.6"/>

      {/* 나무 잎 (레벨에 따라 점점 풍성) */}
      {leafCount >= 1 && <ellipse cx="160" cy="105" rx="30" ry="26" fill={theme.treeLeaf} opacity="0.95"/>}
      {leafCount >= 2 && <ellipse cx="142" cy="115" rx="22" ry="18" fill={theme.treeLeaf} opacity="0.9"/>}
      {leafCount >= 3 && <ellipse cx="178" cy="113" rx="22" ry="19" fill={theme.treeLeaf} opacity="0.9"/>}
      {leafCount >= 4 && <ellipse cx="160" cy="88" rx="22" ry="18" fill={theme.treeLeaf} opacity="0.85"/>}
      {leafCount >= 5 && <ellipse cx="145" cy="97" rx="16" ry="14" fill={theme.treeLeaf} opacity="0.8"/>}
      {leafCount >= 6 && <ellipse cx="175" cy="96" rx="16" ry="13" fill={theme.treeLeaf} opacity="0.8"/>}

      {/* 꽃 */}
      {theme.flowersVisible && (
        <g>
          {[{x:60,c:'#F9A8D4'},{x:100,c:'#FCD34D'},{x:200,c:'#86EFAC'},{x:240,c:'#F9A8D4'},{x:280,c:'#FCD34D'}].map(({x,c},i)=>(
            level >= i ? (
              <g key={x}>
                <circle cx={x} cy="170" r="5" fill={c} opacity="0.95"/>
                <circle cx={x-5} cy="167" r="3.5" fill={c} opacity="0.8"/>
                <circle cx={x+5} cy="167" r="3.5" fill={c} opacity="0.8"/>
                <circle cx={x} cy="163" r="3.5" fill={c} opacity="0.8"/>
                <circle cx={x} cy="170" r="3" fill="#FFF" opacity="0.7"/>
              </g>
            ) : null
          ))}
        </g>
      )}

      {/* 안개 오버레이 */}
      {theme.fogOpacity > 0 && (
        <g>
          <rect width="320" height="200" fill={C.fogGray} opacity={theme.fogOpacity} filter="url(#fogBlur)"/>
          <ellipse cx="80" cy="170" rx="120" ry="40" fill={C.fogGray} opacity={theme.fogOpacity * 0.8} filter="url(#fogBlur)"/>
          <ellipse cx="240" cy="165" rx="100" ry="35" fill={C.fogGray} opacity={theme.fogOpacity * 0.7} filter="url(#fogBlur)"/>
        </g>
      )}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// LevelBar — 경험치 바
// ──────────────────────────────────────────────────────────
function LevelBar({ levelInfo }) {
  const { level, name, emoji, progress, currentExp, maxExp } = levelInfo || {};
  return (
    <div style={{ padding:'16px 20px', background:'rgba(255,255,255,0.7)', borderRadius:16, backdropFilter:'blur(8px)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>{emoji}</span>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>Lv.{level} {name}</div>
            <div style={{ fontSize:11, color:C.muted }}>다음 레벨까지 {maxExp - currentExp} EXP</div>
          </div>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:C.sage }}>{currentExp} EXP</div>
      </div>
      <div style={{ height:10, background:'rgba(0,0,0,0.08)', borderRadius:100, overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${progress}%`,
          background:`linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
          borderRadius:100, transition:'width 1s ease',
          boxShadow:`0 0 8px ${C.sage}60`,
        }}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// TestBadge — 연결된 검사 표시
// ──────────────────────────────────────────────────────────
const TEST_META_HUB = {
  PHQ9:    { label:'PHQ-9',   emoji:'🌱', desc:'우울 선별' },
  GAD7:    { label:'GAD-7',   emoji:'💙', desc:'불안 선별' },
  DASS21:  { label:'DASS-21', emoji:'🌊', desc:'스트레스' },
  BIG5:    { label:'Big5',    emoji:'🧠', desc:'성격 분석' },
  SCT:     { label:'SCT',     emoji:'✍️', desc:'문장 완성' },
  DSI:     { label:'DSI',     emoji:'🪞', desc:'자아 분화' },
  BURNOUT: { label:'K-MBI+',  emoji:'🔥', desc:'번아웃' },
  LOST:    { label:'LOST',    emoji:'🧭', desc:'행동 양식' },
};

function TestBadgeRow({ completedTests = [] }) {
  const allTests = Object.keys(TEST_META_HUB);
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:10, letterSpacing:'0.5px' }}>연결된 심리검사</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
        {allTests.map(t => {
          const meta = TEST_META_HUB[t];
          const done = completedTests.includes(t);
          return (
            <div key={t} style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'5px 10px', borderRadius:100,
              background: done ? C.sagePale : 'rgba(0,0,0,0.05)',
              border: `1px solid ${done ? C.sage+'44' : 'transparent'}`,
              opacity: done ? 1 : 0.5,
            }}>
              <span style={{ fontSize:13 }}>{meta.emoji}</span>
              <span style={{ fontSize:11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted }}>
                {meta.label}
              </span>
              {done && <span style={{ fontSize:10, color:C.sage }}>✓</span>}
            </div>
          );
        })}
      </div>
      {completedTests.length === 0 && (
        <div style={{ marginTop:10, fontSize:12, color:C.muted, lineHeight:1.6 }}>
          심리검사를 완료하면 게임이 더 풍성해져요.{' '}
          <a href={PHYWEB_URL} style={{ color:C.sage, fontWeight:600, textDecoration:'none' }}>
            마음풀에서 검사하기 →
          </a>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GameCard — 개별 게임 카드
// ──────────────────────────────────────────────────────────
function GameCard({ game, onPlay }) {
  const [hovered, setHovered] = useState(false);
  const locked = !game.canPlay;
  const comingSoon = !game.isAvailable;

  const cardBg = locked
    ? 'rgba(255,255,255,0.5)'
    : hovered
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(255,255,255,0.8)';

  return (
    <div
      onClick={() => !locked && onPlay(game.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        borderRadius: 20,
        padding: '24px 20px 20px',
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        transform: !locked && hovered ? 'translateY(-4px)' : 'none',
        boxShadow: !locked && hovered ? `0 12px 32px ${C.sage}22` : '0 2px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${!locked && hovered ? C.sage+'44' : 'rgba(255,255,255,0.6)'}`,
        backdropFilter: 'blur(8px)',
        position: 'relative',
        overflow: 'hidden',
        opacity: comingSoon ? 0.7 : 1,
      }}
    >
      {/* 준비 중 배지 */}
      {comingSoon && (
        <div style={{
          position:'absolute', top:12, right:12,
          background:'rgba(0,0,0,0.08)', color:C.muted,
          fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100,
          letterSpacing:'0.5px',
        }}>준비 중</div>
      )}

      {/* 레벨 잠금 표시 */}
      {!comingSoon && !game.isUnlocked && (
        <div style={{
          position:'absolute', top:12, right:12,
          background:C.sand, color:C.amber,
          fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100,
        }}>Lv.{game.unlockLevel} 해금</div>
      )}

      {/* 이모지 */}
      <div style={{
        fontSize:42, marginBottom:12, lineHeight:1,
        filter: locked ? 'grayscale(0.5)' : 'none',
        animation: !locked && hovered ? 'float 2s ease-in-out infinite' : 'none',
      }}>
        {game.emoji}
      </div>

      {/* 이름 */}
      <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:4 }}>
        {game.name}
      </div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.5 }}>
        {game.tagline}
      </div>

      {/* 태그 */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
        {game.tags.slice(0,3).map(tag => (
          <span key={tag} style={{
            fontSize:10, padding:'2px 8px', borderRadius:100,
            background:C.sagePale, color:C.sage, fontWeight:500,
          }}>{tag}</span>
        ))}
      </div>

      {/* 크레딧 비용 */}
      <div style={{ fontSize:11, fontWeight:600, marginBottom:4,
        color: game.creditCost > 0 ? '#D4954A' : '#4A7C59' }}>
        {game.creditCost > 0 ? `🌿 ${game.creditCost} 크레딧` : '무료'}
      </div>

      {/* 필요 검사 */}
      {game.requiredTests.length > 0 && (
        <div style={{ fontSize:11, color:C.dusty, marginBottom:12 }}>
          {game.requiredTests.map(t => TEST_META_HUB[t]?.label || t).join(' · ')} 연동
        </div>
      )}

      {/* 모듈 미리보기 */}
      {game.modules?.length > 0 && !comingSoon && (
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
          {game.modules.map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.muted }}>
              <span style={{ fontSize:14 }}>{m.emoji}</span>
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 버튼 */}
      <button
        disabled={locked}
        style={{
          ...btn(), width:'100%', padding:'10px 0',
          borderRadius:12, fontSize:13, fontWeight:700,
          background: locked ? 'rgba(0,0,0,0.07)' : `linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
          color: locked ? C.muted : 'white',
          transition:'all 0.2s',
          boxShadow: !locked ? `0 4px 12px ${C.sage}40` : 'none',
        }}
      >
        {comingSoon ? '곧 출시됩니다' : locked ? '🔒 잠금 해제 필요' : '시작하기 →'}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// StreakCalendar — 최근 7일 출석 캘린더
// ──────────────────────────────────────────────────────────
function StreakCalendar({ recentPlayDates = [], streakDays = 0 }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = ['일','월','화','수','목','금','토'][d.getDay()];
    days.push({ iso, dow, played: recentPlayDates.includes(iso) });
  }

  return (
    <div style={{ padding:'16px 20px', background:'rgba(255,255,255,0.7)', borderRadius:16, backdropFilter:'blur(8px)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          📅 최근 7일 출석
        </div>
        {streakDays > 0 && (
          <div style={{ fontSize:12, fontWeight:700, color:C.amber, display:'flex', alignItems:'center', gap:4 }}>
            🔥 {streakDays}일 연속
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:6, justifyContent:'space-between' }}>
        {days.map(({ iso, dow, played }) => (
          <div key={iso} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:500 }}>{dow}</div>
            <div style={{
              width:'100%', aspectRatio:'1',
              borderRadius:8,
              background: played
                ? `linear-gradient(135deg, ${C.sage}, ${C.sageL})`
                : 'rgba(0,0,0,0.06)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13,
              boxShadow: played ? `0 2px 8px ${C.sage}40` : 'none',
              transition:'all 0.3s',
            }}>
              {played ? '🌿' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// DailyTip — AI 일일 코치 메시지
// ──────────────────────────────────────────────────────────
function DailyTip({ hubData }) {
  const [tip,     setTip]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hubData) return;
    const { gameStatus, completedTests, userTestScores } = hubData;
    const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
    GameEngine.getDailyTip({
      streakDays:  gameStatus?.streak_days || 0,
      level:       levelInfo.level,
      testScores:  userTestScores || {},
      recentTests: (completedTests || []).slice(0, 3),
    }).then(res => {
      if (res.success) setTip(res.data?.message);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [hubData]);

  if (loading) return (
    <div style={{
      background:'rgba(255,255,255,0.5)', borderRadius:14, padding:'12px 16px',
      border:'1px solid rgba(255,255,255,0.5)', backdropFilter:'blur(8px)',
    }}>
      <div style={{ fontSize:12, color:C.muted, animation:'pulse 1.5s infinite',
        fontFamily:"'Noto Sans KR',sans-serif" }}>
        🤖 오늘의 코치 메시지를 불러오는 중...
      </div>
    </div>
  );

  if (!tip) return null;

  return (
    <div style={{
      background:`linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
      borderRadius:14, padding:'13px 16px',
      border:`1px solid ${C.sage}25`, backdropFilter:'blur(8px)',
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.sage, marginBottom:5, letterSpacing:'0.5px' }}>
        🤖 오늘의 코치 메시지
      </div>
      <div style={{ fontSize:13, color:C.dark, lineHeight:1.65, fontWeight:500,
        fontFamily:"'Noto Sans KR',sans-serif" }}>
        {tip}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Leaderboard — 상위 랭킹 표시
// ──────────────────────────────────────────────────────────
function Leaderboard({ currentUserEmail }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GameEngine.getLeaderboard().then(res => {
      if (res.success) setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <div style={{ fontSize:13, color:C.muted, animation:'pulse 1.5s infinite' }}>순위를 불러오는 중...</div>
    </div>
  );

  if (!data?.length) return (
    <div style={{ textAlign:'center', padding:'20px 0', color:C.muted, fontSize:13 }}>
      아직 순위 데이터가 없어요
    </div>
  );

  const MEDAL = ['🥇','🥈','🥉'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {data.map((entry, i) => {
        const levelInfo = GameEngine.getLevelInfo(entry.total_exp || 0);
        const isMe = entry.email && currentUserEmail && entry.email === currentUserEmail;
        const rank = MEDAL[i] || `${i+1}.`;
        return (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 14px', borderRadius:12,
            background: isMe ? C.sagePale : 'rgba(255,255,255,0.7)',
            border: `1px solid ${isMe ? C.sage+'44' : 'rgba(255,255,255,0.5)'}`,
            backdropFilter:'blur(6px)',
            boxShadow: isMe ? `0 2px 12px ${C.sage}20` : 'none',
          }}>
            <div style={{ fontSize:18, minWidth:28, textAlign:'center', fontWeight:700 }}>{rank}</div>
            <div style={{ fontSize:14 }}>{levelInfo.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:5 }}>
                {entry.nickname || entry.email?.split('@')[0] || '정원사'}
                {isMe && <span style={{ fontSize:10, background:C.sage, color:'white', borderRadius:4, padding:'1px 5px' }}>나</span>}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                Lv.{entry.garden_level} {levelInfo.name}
                {(entry.streak_days || 0) > 1 && ` · 🔥 ${entry.streak_days}일`}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.sage }}>
                {(entry.total_exp || 0).toLocaleString()}
              </div>
              <div style={{ fontSize:10, color:C.muted }}>EXP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// RecentActivity — 최근 플레이 기록
// ──────────────────────────────────────────────────────────
function RecentActivity({ sessions = [] }) {
  if (sessions.length === 0) return null;

  const MODULE_LABEL = {
    breathing:         { emoji:'💧', name:'호흡 훈련' },
    cbt:               { emoji:'🌱', name:'생각 교정' },
    efmt:              { emoji:'🌸', name:'감정 훈련' },
    relax:             { emoji:'🏞️', name:'이완 훈련' },
    missions:          { emoji:'🎯', name:'회복 미션' },
    city:              { emoji:'🏙️', name:'회복 도시' },
    weekly_report:     { emoji:'📊', name:'주간 리포트' },
    checkin:           { emoji:'🎨', name:'감정 체크인' },
    daily_quest_bonus: { emoji:'🎁', name:'데일리 퀘스트 보너스' },
  };

  return (
    <div style={{ marginTop:32 }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:16 }}>📜</span> 최근 플레이 기록
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {sessions.map((s, i) => {
          const m = MODULE_LABEL[s.module_type] || { emoji:'🎮', name:s.module_type };
          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 16px', borderRadius:12,
              background:'rgba(255,255,255,0.6)', backdropFilter:'blur(6px)',
              border:'1px solid rgba(255,255,255,0.5)',
            }}>
              <span style={{ fontSize:20 }}>{m.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.dark }}>{m.name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{GameEngine.formatRelativeTime(s.created_at)}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.sage }}>+{s.exp_gained} EXP</div>
                <div style={{ fontSize:11, color:C.muted }}>점수 {s.score}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// LoginGate — 미로그인 상태 안내
// ──────────────────────────────────────────────────────────
function LoginGate() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:`linear-gradient(160deg, ${C.sagePale}, ${C.cream}, #EBF4FA)`,
      padding:24, textAlign:'center',
    }}>
      <div style={{ fontSize:72, marginBottom:20, animation:'float 3s ease-in-out infinite' }}>🌿</div>
      <h1 style={{ fontSize:28, fontWeight:700, color:C.dark, marginBottom:10, fontFamily:"'Noto Serif KR', serif" }}>
        마음의 정원
      </h1>
      <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:32, maxWidth:300 }}>
        마음풀에서 로그인하면<br/>
        별도 로그인 없이 바로 이용할 수 있어요.<br/>
        심리검사 결과와 연결하여<br/>
        나만의 정원을 가꾸세요 🌿
      </p>
      <a href={PHYWEB_URL} style={{
        display:'inline-block', padding:'14px 36px',
        background:`linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
        color:'white', borderRadius:14, fontWeight:700,
        fontSize:15, textDecoration:'none',
        boxShadow:`0 8px 24px ${C.sage}44`,
        fontFamily:"'Noto Sans KR', sans-serif",
      }}>
        마음풀 로그인하고 시작하기 →
      </a>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// AchievementPanel — 획득 업적 + 미획득 업적 전체 표시
// ──────────────────────────────────────────────────────────

// 업적 전체 정의 (표시 순서용)
const ALL_ACHIEVEMENT_IDS = [
  // 연속 출석
  'streak_3', 'streak_7', 'streak_14', 'perfect_week',
  // 레벨
  'level_3', 'level_5',
  // 경험치
  'exp_500', 'exp_1000',
  // 게임별 숙련
  'first_play', 'breath_master', 'cbt_master', 'burnout_fighter',
  // 감정 수채화
  'mood_7', 'mood_30',
  // 감사 일기
  'gratitude_7',
  // 탐험
  'all_games',
];

// ── 게임 통계 섹션 ───────────────────────────────────────
const GAME_META = {
  garden:    { name:'마음 정원', emoji:'🌿' },
  mood:      { name:'감정 체크인', emoji:'🎨' },
  efmt:      { name:'감정 탐색', emoji:'💭' },
  gratitude: { name:'감사 일기', emoji:'⭐' },
  tree:      { name:'생각 나무', emoji:'🌳' },
  burnout:   { name:'번아웃 체크', emoji:'🔥' },
};

function GameStatsSection() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const load = React.useCallback(() => {
    if (stats) return; // 이미 로딩됨
    setLoading(true);
    GameEngine.getGameStats().then(res => {
      if (res.success) setStats(res.data);
    }).finally(() => setLoading(false));
  }, [stats]);

  const handleToggle = () => {
    if (!expanded) load();
    setExpanded(v => !v);
  };

  const { perGame = [], week = {}, month = {} } = stats || {};

  return (
    <div style={{ marginBottom:24 }}>
      <button onClick={handleToggle} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
        borderRadius:20, padding:'16px 20px', border:'1px solid rgba(255,255,255,0.6)',
        cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:16 }}>📊</span> 내 게임 통계
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{expanded ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>

      {expanded && (
        <div style={{
          background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
          borderRadius:'0 0 20px 20px', padding:'4px 20px 20px',
          border:'1px solid rgba(255,255,255,0.6)', borderTop:'none',
          marginTop:-4,
        }}>
          {loading && <div style={{ textAlign:'center', padding:'24px', color:C.muted, fontSize:13 }}>불러오는 중...</div>}
          {!loading && stats && (
            <>
              {/* 요약 카드 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16, paddingTop:16 }}>
                {[
                  { label:'이번 주 플레이', value:`${week.playCount||0}회`, sub:`+${week.expGained||0} EXP`, color:C.sage },
                  { label:'이번 달 플레이', value:`${month.playCount||0}회`, sub:`+${month.expGained||0} EXP`, color:C.amber },
                ].map(c => (
                  <div key={c.label} style={{
                    background:'white', borderRadius:14, padding:'14px 16px',
                    border:`1px solid ${c.color}22`,
                  }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:c.color }}>{c.value}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* 게임별 통계 */}
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:10, letterSpacing:'0.5px' }}>
                게임별 수행 현황
              </div>
              {perGame.length === 0 && (
                <div style={{ textAlign:'center', padding:'20px', color:C.muted, fontSize:13 }}>아직 플레이 기록이 없어요</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {perGame.map(g => {
                  const meta = GAME_META[g.game_id] || { name:g.game_id, emoji:'🎮' };
                  const lastDate = g.last_played ? new Date(g.last_played).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}) : '-';
                  return (
                    <div key={g.game_id} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:'white', borderRadius:12, padding:'12px 14px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>{meta.emoji}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:C.dark }}>{meta.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>마지막: {lastDate}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:15, fontWeight:700, color:C.sage }}>{(g.play_count||0)}회</div>
                        {(g.best_score||0) > 0 && (
                          <div style={{ fontSize:11, color:C.amber }}>베스트 {g.best_score}점</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AchievementPanel({ earned = [], isMaster = false }) {
  const [expanded, setExpanded] = React.useState(false);

  const earnedIds  = earned.map(e => e.achievement_id);
  const earnedSet  = new Set(earnedIds);
  const totalCount = ALL_ACHIEVEMENT_IDS.length;
  const earnedCount = isMaster ? totalCount : earnedIds.length;

  // 획득 업적 먼저, 미획득 뒤에
  const sorted = [
    ...ALL_ACHIEVEMENT_IDS.filter(id => earnedSet.has(id)),
    ...ALL_ACHIEVEMENT_IDS.filter(id => !earnedSet.has(id)),
  ];
  const visible = expanded ? sorted : sorted.slice(0, 6);

  return (
    <div style={{
      background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
      borderRadius:20, padding:'18px 20px', marginBottom:24,
      border:'1px solid rgba(255,255,255,0.6)',
    }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:16 }}>🏅</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>업적</span>
          <span style={{
            fontSize:11, fontWeight:700,
            background: earnedCount === totalCount ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
            color: earnedCount === totalCount ? 'white' : C.sage,
            borderRadius:100, padding:'2px 9px',
          }}>
            {earnedCount} / {totalCount}
          </span>
        </div>
        {/* 진행 바 */}
        <div style={{ flex:1, maxWidth:100, height:5, background:'rgba(0,0,0,0.08)', borderRadius:100, overflow:'hidden', marginLeft:12 }}>
          <div style={{
            height:'100%',
            width:`${Math.round((earnedCount / totalCount) * 100)}%`,
            background:`linear-gradient(90deg, ${C.sage}, ${C.sageL})`,
            borderRadius:100, transition:'width 0.6s ease',
          }}/>
        </div>
      </div>

      {/* 업적 목록 */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom: sorted.length > 6 ? 12 : 0 }}>
        {visible.map(id => {
          const a    = GameEngine.getAchievementInfo(id);
          const done = isMaster || earnedSet.has(id);
          return (
            <div key={id} style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'5px 11px', borderRadius:100,
              background: done ? C.sagePale : 'rgba(0,0,0,0.04)',
              border: `1px solid ${done ? C.sage+'33' : 'rgba(0,0,0,0.07)'}`,
              opacity: done ? 1 : 0.55,
              transition:'all 0.2s',
            }} title={a.desc}>
              <span style={{ fontSize:13, filter: done ? 'none' : 'grayscale(1)' }}>{a.emoji}</span>
              <span style={{ fontSize:11, fontWeight: done ? 600 : 400, color: done ? C.sage : C.muted }}>
                {a.name}
              </span>
              {done && <span style={{ fontSize:9, color:C.sage }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* 더보기 토글 */}
      {sorted.length > 6 && (
        <button onClick={() => setExpanded(v => !v)} style={{
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, fontWeight:600,
          fontFamily:"'Noto Sans KR',sans-serif", padding:'2px 0',
        }}>
          {expanded ? '접기 ▲' : `+${sorted.length - 6}개 더보기 ▼`}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// AchievementToast — 업적 달성 알림
// ──────────────────────────────────────────────────────────
function AchievementToast({ achievements = [], onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDismiss?.(); }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || achievements.length === 0) return null;

  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:1000,
      display:'flex', flexDirection:'column', gap:8,
      animation:'fadeUp 0.4s ease',
    }}>
      {achievements.map(id => {
        const a = GameEngine.getAchievementInfo(id);
        return (
          <div key={id} style={{
            display:'flex', alignItems:'center', gap:10,
            background:'white', borderRadius:14, padding:'12px 16px',
            boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
            border:`1px solid ${C.sage}33`,
          }}>
            <span style={{ fontSize:24 }}>{a.emoji}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>업적 달성!</div>
              <div style={{ fontSize:12, color:C.sage, fontWeight:600 }}>{a.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// BurnoutTrendSection — 번아웃 점수 이력 차트
// ──────────────────────────────────────────────────────────
const BURNOUT_LEVELS = [
  { max:  39, label:'낮음',   color:'#52B788', bg:'#D8F3DC' },
  { max:  59, label:'보통',   color:'#F59E0B', bg:'#FEF3C7' },
  { max:  79, label:'높음',   color:'#F97316', bg:'#FFEDD5' },
  { max: 100, label:'심각',   color:'#EF4444', bg:'#FEF2F2' },
];
function getBurnoutLevel(score) {
  return BURNOUT_LEVELS.find(l => score <= l.max) || BURNOUT_LEVELS[BURNOUT_LEVELS.length - 1];
}

function BurnoutTrendSection({ userTestScores }) {
  const [history, setHistory] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const handleToggle = () => {
    if (!expanded && !history) {
      setLoading(true);
      GameEngine.getBurnoutHistory()
        .then(res => { if (res.success) setHistory(res.data); })
        .finally(() => setLoading(false));
    }
    setExpanded(v => !v);
  };

  // 번아웃 게임 경험 없으면 렌더 안 함
  const burnoutScore = userTestScores?.BURNOUT;
  if (burnoutScore === undefined) return null;

  const level = getBurnoutLevel(burnoutScore);
  const entries = (history || []).slice().reverse(); // 오래된→최신

  // SVG 라인 차트 설정
  const W = 280, H = 70, PAD = 12;
  const plotW = W - PAD * 2, plotH = H - PAD;
  const maxY = 100, minY = 0;
  const toX = i => PAD + (entries.length > 1 ? i * (plotW / (entries.length - 1)) : plotW / 2);
  const toY = v => PAD + plotH - (v / (maxY - minY)) * plotH;
  const pts = entries.map((e, i) => ({ x: toX(i), y: toY(e.burnout_score ?? e.score), val: e.burnout_score ?? e.score, date: e.date }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{
      background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
      borderRadius:20, padding:'16px 20px', marginBottom:24,
      border:'1px solid rgba(255,255,255,0.6)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:16 }}>🔥</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>번아웃 지수 추이</span>
          <span style={{
            fontSize:11, fontWeight:700,
            background: level.bg, color: level.color,
            borderRadius:100, padding:'2px 8px',
          }}>현재 {burnoutScore}점 · {level.label}</span>
        </div>
        <button onClick={handleToggle} style={{
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, fontWeight:600,
          fontFamily:"'Noto Sans KR',sans-serif",
        }}>{expanded ? '접기 ▲' : '펼치기 ▼'}</button>
      </div>

      {expanded && (
        <div style={{ marginTop:14, animation:'fadeUp 0.3s ease' }}>
          {loading && <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>불러오는 중...</div>}
          {!loading && history && entries.length === 0 && (
            <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>
              아직 번아웃 게임 기록이 없어요.<br/>게임을 플레이하면 점수 변화를 확인할 수 있어요!
            </div>
          )}
          {!loading && entries.length >= 2 && (
            <div style={{
              background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12,
              border:`1px solid ${level.color}22`,
            }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>번아웃 점수 이력 (낮을수록 건강)</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
                {/* 위험 구간 배경 */}
                <rect x={PAD} y={PAD} width={plotW} height={toY(60) - PAD} fill="#FEF3C7" opacity="0.4" rx="2"/>
                <rect x={PAD} y={toY(60)} width={plotW} height={toY(40) - toY(60)} fill="#FFEDD5" opacity="0.3" rx="2"/>
                {/* 기준선 60점 */}
                <line x1={PAD} y1={toY(60)} x2={W-PAD} y2={toY(60)} stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2"/>
                <text x={W-PAD+2} y={toY(60)+3} fontSize="7" fill="#F59E0B">60</text>
                {/* 채움 */}
                <path d={`${pathD} L ${pts[pts.length-1].x} ${PAD+plotH} L ${pts[0].x} ${PAD+plotH} Z`}
                  fill={`${level.color}18`} stroke="none"/>
                {/* 라인 */}
                <path d={pathD} fill="none" stroke={level.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* 점 + 날짜 */}
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={level.color} strokeWidth="2"/>
                    <text x={p.x} y={H-1} textAnchor="middle" fontSize="7" fill="#C0C0C0">
                      {new Date(p.date+'T00:00:00').toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}
                    </text>
                  </g>
                ))}
                {/* 최신 값 강조 */}
                <text x={pts[pts.length-1].x} y={pts[pts.length-1].y-6}
                  textAnchor="middle" fontSize="9" fontWeight="bold" fill={level.color}>
                  {pts[pts.length-1].val}
                </text>
              </svg>
              {/* 전회 대비 */}
              {pts.length >= 2 && (() => {
                const diff = pts[pts.length-1].val - pts[pts.length-2].val;
                return (
                  <div style={{
                    marginTop:8, fontSize:12, fontWeight:600, textAlign:'center',
                    color: diff <= 0 ? '#52B788' : '#EF4444',
                  }}>
                    {diff <= 0 ? `✅ 지난 회 대비 ${Math.abs(diff)}점 개선됐어요!` : `⚠️ 지난 회 대비 ${diff}점 높아졌어요. 쉬어가세요.`}
                  </div>
                );
              })()}
            </div>
          )}
          {/* 레벨 가이드 */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {BURNOUT_LEVELS.map(l => (
              <div key={l.label} style={{
                fontSize:10, padding:'3px 8px', borderRadius:100,
                background:l.bg, color:l.color, fontWeight:600,
              }}>{l.label} ~{l.max}점</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// EmotionWeeklyReport — AI 감정 주간 분석 (접기/펼치기)
// ──────────────────────────────────────────────────────────
const EMOTION_DISPLAY = {
  happy:   { emoji:'😊', label:'행복', color:'#F59E0B' },
  calm:    { emoji:'😌', label:'평온', color:'#7BA88A' },
  tired:   { emoji:'😴', label:'피곤', color:'#9BA8B0' },
  anxious: { emoji:'😰', label:'불안', color:'#C4B5FD' },
  sad:     { emoji:'😢', label:'슬픔', color:'#93C5FD' },
  angry:   { emoji:'😤', label:'화남', color:'#FCA5A5' },
};

function EmotionWeeklyReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(false);

  useEffect(() => {
    GameEngine.getEmotionReport()
      .then(res => { if (res.success) setReportData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !reportData?.report) return null;

  const entries = reportData.entries || [];

  return (
    <div style={{
      background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
      borderRadius:20, padding:'16px 20px', marginBottom:24,
      border:'1px solid rgba(255,255,255,0.6)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:16 }}>📊</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>이번 주 감정 흐름</span>
          {entries.length > 0 && (
            <span style={{
              fontSize:11, fontWeight:600,
              background:C.sagePale, color:C.sage,
              borderRadius:100, padding:'2px 8px',
            }}>{entries.length}일 기록</span>
          )}
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, fontWeight:600,
          fontFamily:"'Noto Sans KR',sans-serif",
        }}>{expanded ? '접기 ▲' : '펼치기 ▼'}</button>
      </div>

      {expanded && (
        <div style={{ marginTop:14, animation:'fadeUp 0.3s ease' }}>
          {/* 감정 타임라인 */}
          {entries.length > 0 && (
            <div style={{
              display:'flex', gap:8, overflowX:'auto',
              paddingBottom:8, marginBottom:14,
            }}>
              {entries.map(e => {
                const em = EMOTION_DISPLAY[e.emotion] || { emoji:'😶', label:e.emotion, color:C.muted };
                return (
                  <div key={e.date} style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    minWidth:44, flexShrink:0,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:100,
                      background: em.color + '22', border:`2px solid ${em.color}44`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                    }}>{em.emoji}</div>
                    <div style={{ fontSize:9, color:C.muted, textAlign:'center' }}>
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })}
                    </div>
                    {/* 강도 점 */}
                    <div style={{
                      width: 4 + e.intensity * 1.5, height: 4 + e.intensity * 1.5,
                      borderRadius:100, background:em.color,
                      opacity: 0.3 + e.intensity * 0.14,
                    }}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI 분석 */}
          <div style={{
            background:`linear-gradient(135deg, ${C.sagePale}, rgba(255,255,255,0.92))`,
            borderRadius:14, padding:'14px 16px',
            border:`1px solid ${C.sage}22`,
          }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.sage, marginBottom:6, letterSpacing:'0.5px' }}>
              🤖 AI 감정 패턴 분석
            </div>
            <div style={{ fontSize:13, color:C.dark, lineHeight:1.75,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {reportData.report}
            </div>
            {reportData.cached && (
              <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>
                이번 주 분석 · 매주 월요일 갱신
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// TodayRecommendCard — 오늘의 게임 추천 (클라이언트 사이드)
// ──────────────────────────────────────────────────────────
const GAME_META = {
  garden:    { name:'마음의 정원',      emoji:'🌿' },
  mood:      { name:'감정 수채화',      emoji:'🎨' },
  efmt:      { name:'감정꽃 찾기',      emoji:'🌸' },
  gratitude: { name:'별빛 감사 일기',   emoji:'⭐' },
  tree:      { name:'내면의 나무',      emoji:'🌳' },
  burnout:   { name:'번아웃 회복',      emoji:'⚡' },
};

function TodayRecommendCard({ hubData, onPlay }) {
  if (!hubData) return null;
  const { userTestScores = {}, gameStatus, recentSessions = [], isMaster } = hubData;
  const levelInfo = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
  const level     = isMaster ? 6 : levelInfo.level;
  const recentIds = recentSessions.slice(0, 5).map(s => s.game_id);
  const phq9      = userTestScores.PHQ9;
  const burnout   = userTestScores.BURNOUT;

  let rec = null;

  if (phq9 !== undefined && phq9 >= 10) {
    rec = { gameId:'garden', reason:`PHQ-9 ${phq9}점 — 지금 호흡 훈련이 마음을 안정시켜줘요`, color:C.dusty };
  } else if (burnout !== undefined && burnout >= 60 && level >= 2) {
    rec = { gameId:'burnout', reason:`번아웃 지수 ${burnout}점 — 오늘 회복 미션을 시작해보세요`, color:C.amber };
  } else if (!recentIds.includes('mood')) {
    rec = { gameId:'mood', reason:'오늘 감정 기록을 아직 안 했어요 ✍️', color:C.sage };
  } else if (level >= 2 && !recentIds.includes('efmt')) {
    rec = { gameId:'efmt', reason:'감정꽃 찾기로 감정 인식력을 키워보세요 🌸', color:'#C97B8A' };
  } else if (level >= 2 && !recentIds.includes('gratitude')) {
    rec = { gameId:'gratitude', reason:'오늘의 감사 일기를 써볼까요? ⭐', color:C.amber };
  } else {
    rec = { gameId:'garden', reason:'잠깐 호흡을 가다듬고 정원을 가꿔볼까요? 🌿', color:C.sage };
  }

  const game = GAME_META[rec.gameId];

  return (
    <div style={{
      background:`linear-gradient(135deg, ${rec.color}12, rgba(255,255,255,0.82))`,
      backdropFilter:'blur(8px)',
      borderRadius:20, padding:'16px 20px', marginBottom:24,
      border:`1px solid ${rec.color}28`,
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:rec.color, marginBottom:10, letterSpacing:'0.5px' }}>
        ✨ 오늘의 추천
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:52, height:52, borderRadius:16, flexShrink:0,
          background:`linear-gradient(135deg, ${rec.color}22, ${rec.color}10)`,
          border:`1.5px solid ${rec.color}33`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
        }}>{game.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:3 }}>{game.name}</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{rec.reason}</div>
        </div>
        <button onClick={() => onPlay?.(rec.gameId)} style={{
          fontFamily:"'Noto Sans KR',sans-serif",
          background:`linear-gradient(135deg, ${rec.color}, ${rec.color}BB)`,
          color:'white', border:'none', borderRadius:12,
          padding:'9px 16px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0,
        }}>시작 →</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// DailyQuestCard — 데일리 퀘스트 (날짜 시드 기반)
// ──────────────────────────────────────────────────────────
const QUEST_POOL = [
  { id:'play_mood',      game:'mood',      module:'checkin',        text:'오늘의 감정 기록하기',           emoji:'🎨', exp:15 },
  { id:'play_breathing', game:'garden',    module:'breathing',      text:'호흡 훈련 한 번 완료하기',       emoji:'💧', exp:20 },
  { id:'play_cbt',       game:'garden',    module:'cbt',            text:'생각 교정 한 번 완료하기',       emoji:'🌱', exp:20 },
  { id:'play_gratitude', game:'gratitude', module:'gratitude_write',text:'감사 일기 쓰기',                emoji:'⭐', exp:20 },
  { id:'play_efmt',      game:'efmt',      module:'efmt_easy',      text:'감정꽃 찾기 한 번 완료하기',     emoji:'🌸', exp:20, minLevel:2 },
  { id:'play_burnout',   game:'burnout',   module:'missions',       text:'번아웃 회복 미션 완료하기',      emoji:'⚡', exp:20, minLevel:2 },
  { id:'play_tree',      game:'tree',      module:'roots',          text:'내면의 나무 탐험하기',           emoji:'🌳', exp:25, minLevel:4 },
  { id:'play_any',       game:null,        module:null,             text:'아무 게임이나 한 번 플레이하기',  emoji:'🎮', exp:10 },
];

function getDailyQuests(level = 1) {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let s = seed;
  const rand = () => { s = ((s * 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; };

  const eligible = QUEST_POOL.filter(q => !q.minLevel || level >= q.minLevel);
  const pool = [...eligible];
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function DailyQuestCard({ todaySessions = [], level = 1, onPlay, onBonusClaimed }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [bonusDone, setBonusDone] = useState(() => localStorage.getItem('quest_bonus_' + todayKey) === '1');
  const [bonusClaiming, setBonusClaiming] = useState(false);

  const quests = getDailyQuests(level);

  const isQuestDone = (q) => {
    if (!q.game) return todaySessions.length > 0;
    return todaySessions.some(s => s.game_id === q.game && (!q.module || s.module_type === q.module));
  };

  const doneCount = quests.filter(isQuestDone).length;
  const allDone = doneCount === quests.length;

  const claimBonus = async () => {
    if (bonusDone || !allDone || bonusClaiming) return;
    setBonusClaiming(true);
    try {
      await GameEngine.saveSession({ gameId: 'daily_quest', moduleType: 'daily_quest_bonus', score: 50, durationSec: 0, metadata: { date: todayKey } });
      localStorage.setItem('quest_bonus_' + todayKey, '1');
      setBonusDone(true);
      onBonusClaimed?.();
    } finally {
      setBonusClaiming(false);
    }
  };

  return (
    <div style={{
      background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
      borderRadius:20, padding:'18px 20px', marginBottom:24,
      border:'1px solid rgba(255,255,255,0.6)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:16 }}>📋</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>오늘의 퀘스트</span>
          <span style={{
            fontSize:11, fontWeight:700,
            background: allDone ? `linear-gradient(135deg, ${C.amber}, ${C.amberL})` : C.sagePale,
            color: allDone ? 'white' : C.sage,
            borderRadius:100, padding:'2px 9px',
          }}>
            {doneCount} / {quests.length}
          </span>
        </div>
        {allDone && !bonusDone && (
          <button onClick={claimBonus} disabled={bonusClaiming} style={{
            fontFamily:"'Noto Sans KR',sans-serif",
            background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
            color:'white', border:'none', borderRadius:100,
            padding:'5px 14px', fontSize:11, fontWeight:700, cursor:'pointer',
          }}>
            {bonusClaiming ? '...' : '🎁 +50 EXP'}
          </button>
        )}
        {bonusDone && <span style={{ fontSize:11, color:C.sage, fontWeight:700 }}>✓ 보너스 획득!</span>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {quests.map(q => {
          const done = isQuestDone(q);
          return (
            <div key={q.id} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 12px', borderRadius:12,
              background: done ? C.sagePale : 'rgba(0,0,0,0.03)',
              border:`1px solid ${done ? C.sage+'33' : 'rgba(0,0,0,0.06)'}`,
            }}>
              <span style={{ fontSize:18 }}>{q.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:12, fontWeight: done ? 700 : 500,
                  color: done ? C.sage : C.dark,
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {q.text}
                </div>
                <div style={{ fontSize:11, color:C.muted }}>+{q.exp} EXP</div>
              </div>
              {done ? (
                <span style={{ fontSize:16 }}>✅</span>
              ) : q.game && (
                <button onClick={() => onPlay?.(q.game)} style={{
                  fontFamily:"'Noto Sans KR',sans-serif",
                  background:`linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
                  color:'white', border:'none', borderRadius:8,
                  padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer',
                }}>
                  시작 →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// OnboardingOverlay — 첫 방문 온보딩 튜토리얼 (3단계)
// ──────────────────────────────────────────────────────────
function OnboardingOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      emoji: '🌿',
      title: '마음의 정원에 오신 것을 환영해요',
      body: '마음풀의 심리검사 결과와 연동하여 나만의 치유 공간을 가꾸는 게임 플랫폼이에요. 게임을 즐기며 마음을 돌보세요.',
    },
    {
      emoji: '🌱',
      title: '레벨업으로 새 게임을 해금해요',
      body: '게임을 플레이하면 EXP가 쌓여 레벨업해요. 레벨 2부터 감정꽃 찾기·번아웃 회복 등 더 많은 게임이 열립니다.',
    },
    {
      emoji: '🎨',
      title: '먼저 오늘의 감정을 기록해볼까요?',
      body: '감정 수채화는 매일 내 감정을 기록하는 기초 게임이에요. 레벨 1부터 무료로 즐길 수 있어요!',
    },
  ];
  const isLast = step === steps.length - 1;
  const s = steps[step];

  const dismiss = () => { localStorage.setItem('onboarding_done', '1'); onDone?.(); };
  const handleNext = () => { if (isLast) dismiss(); else setStep(v => v + 1); };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:2000, padding:20, backdropFilter:'blur(4px)',
    }}>
      <div style={{
        background:'white', borderRadius:24, padding:'32px 28px',
        width:'100%', maxWidth:380, textAlign:'center',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        animation:'fadeUp 0.3s ease',
      }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{s.emoji}</div>
        <h2 style={{
          fontSize:18, fontWeight:700, color:C.dark, marginBottom:12,
          fontFamily:"'Noto Serif KR', serif", lineHeight:1.5,
        }}>{s.title}</h2>
        <p style={{
          fontSize:13, color:C.muted, lineHeight:1.8, marginBottom:24,
          fontFamily:"'Noto Sans KR', sans-serif",
        }}>{s.body}</p>

        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height:8, borderRadius:100,
              background: i === step ? C.sage : C.sagePale,
              transition:'all 0.3s',
            }}/>
          ))}
        </div>

        <button onClick={handleNext} style={{
          fontFamily:"'Noto Sans KR', sans-serif",
          width:'100%', padding:'14px', borderRadius:14,
          background:`linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
          color:'white', border:'none', fontSize:14, fontWeight:700,
          cursor:'pointer', boxShadow:`0 8px 24px ${C.sage}44`,
        }}>
          {isLast ? '🌿 정원 탐험 시작하기' : '다음 →'}
        </button>
        <button onClick={dismiss} style={{
          fontFamily:"'Noto Sans KR', sans-serif",
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, marginTop:10, padding:'4px 0',
          display:'block', width:'100%',
        }}>
          건너뛰기
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GameHubApp — 메인 앱
// ──────────────────────────────────────────────────────────
function GameHubApp() {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [newAchievements, setNewAchievements] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [creditModal, setCreditModal] = useState(null); // { gameId, cost, balance }
  const [spendLoading, setSpendLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isLoggedIn = !!localStorage.getItem('game_token');

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    GameEngine.getMe()
      .then(res => {
        if (res.success) {
          setData(res.data);
          if ((res.data.gameStatus?.total_exp || 0) === 0 && !localStorage.getItem('onboarding_done')) {
            setShowOnboarding(true);
          }
        } else setError(res.error || '데이터 조회 실패');
      })
      .catch(() => setError('서버 연결 실패'))
      .finally(() => setLoading(false));
  }, []);

  // ── URL 파라미터 ?game=xxx 자동 실행 ──────────────────────
  // 마음풀 RecoveryCard에서 추천 게임 클릭 시 자동 진입
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (!gameParam) return;
    const valid = ['garden', 'efmt', 'gratitude', 'tree', 'burnout', 'mood'];
    if (!valid.includes(gameParam)) return;
    // 로딩 완료 후 자동 실행 (약간 딜레이로 데이터 로드 대기)
    const timer = setTimeout(() => {
      setActiveGame(gameParam);
      // URL에서 game 파라미터 제거 (뒤로가기 시 중복 실행 방지)
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.toString());
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handlePlay = useCallback(async (gameId) => {
    const game = getGameById(gameId);
    if (!game) return;

    // 무료 게임은 바로 시작
    if (!game.creditCost || game.creditCost <= 0) {
      setActiveGame(gameId);
      return;
    }

    // 유료 게임: 실시간 잔액 확인 후 모달 표시
    try {
      const res = await GameEngine.getCredits();
      const balance = res.success ? res.data.balance : (data?.user?.credits || 0);
      setCreditModal({ gameId, cost: game.creditCost, balance, gameName: game.name, gameEmoji: game.emoji });
    } catch {
      // 네트워크 오류 시 캐시 잔액 사용
      const balance = data?.user?.credits || 0;
      setCreditModal({ gameId, cost: game.creditCost, balance, gameName: game.name, gameEmoji: game.emoji });
    }
  }, [data]);

  const handleGameExit = useCallback((result) => {
    setActiveGame(null);
    setCreditModal(null);
    // 허브 데이터 새로고침 (경험치 + 크레딧 잔액 반영)
    GameEngine.getMe().then(res => {
      if (res.success) setData(res.data);
      if (result?.newAchievements?.length) setNewAchievements(result.newAchievements);
    });
  }, []);

  // 크레딧 차감 확인 후 게임 시작
  const handleCreditConfirm = useCallback(async () => {
    if (!creditModal) return;
    const { gameId, cost, balance } = creditModal;
    if (balance < cost) return; // 잔액 부족 — 버튼이 비활성이므로 여기 안 옴

    setSpendLoading(true);
    try {
      const res = await GameEngine.spendCredit(gameId, cost);
      if (res.success) {
        // 잔액 즉시 반영
        setData(prev => prev ? { ...prev, user: { ...prev.user, credits: res.data.balance } } : prev);
        setCreditModal(null);
        setActiveGame(gameId);
      } else if (res.errorCode === 'insufficient_credits') {
        setCreditModal(prev => ({ ...prev, balance: res.balance, insufficient: true }));
      } else {
        alert(res.error || '크레딧 차감 실패. 다시 시도해주세요.');
      }
    } catch {
      alert('네트워크 오류. 다시 시도해주세요.');
    }
    setSpendLoading(false);
  }, [creditModal]);

  if (!isLoggedIn) return <LoginGate />;

  if (loading) return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:`linear-gradient(160deg, ${C.sagePale}, ${C.cream})`,
    }}>
      <div style={{ fontSize:56, marginBottom:16, animation:'float 2s ease-in-out infinite' }}>🌿</div>
      <div style={{ fontSize:14, color:C.muted, animation:'pulse 1.5s infinite' }}>정원을 불러오는 중...</div>
    </div>
  );

  // 게임 실행 중
  if (activeGame === 'mood') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <MoodGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'garden') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <GardenGame userTestScores={data?.userTestScores || {}} onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'efmt') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <EFMTGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'gratitude') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <GratitudeGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'tree') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <TreeGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'burnout') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <BurnoutGame userTestResults={data?.userTestScores || {}} onSessionEnd={handleGameExit}/>
    </div>
  );

  if (error) return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:C.cream, padding:24, textAlign:'center',
    }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🌧️</div>
      <div style={{ fontSize:15, color:C.muted, marginBottom:20 }}>{error}</div>
      <a href={PHYWEB_URL} style={{
        padding:'10px 24px', background:C.sage, color:'white',
        borderRadius:10, fontSize:14, fontWeight:600,
        textDecoration:'none', fontFamily:"'Noto Sans KR', sans-serif",
      }}>마음풀으로 돌아가기</a>
    </div>
  );

  const { user, gameStatus, recentSessions, completedTests, achievements } = data || {};
  const levelInfo    = GameEngine.getLevelInfo(gameStatus?.total_exp || 0);
  const gardenTheme  = GameEngine.getGardenTheme(gameStatus?.visual_status || 'clearing');
  const isMaster     = data?.isMaster || false;
  const games        = isMaster
    ? getPlayableGames(completedTests, 6).map(g => ({ ...g, canPlay: true, isUnlocked: true, hasRequiredTests: true }))
    : getPlayableGames(completedTests, gameStatus?.garden_level || 1);

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${C.sagePale} 0%, ${C.cream} 40%, #EBF4FA 100%)` }}>

      {/* ── 네비게이션 ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(253,252,247,0.88)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(74,124,89,0.12)',
        padding:'0 20px', height:56,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🌿</span>
          <span style={{ fontSize:16, fontWeight:700, color:C.dark, fontFamily:"'Noto Serif KR', serif" }}>
            마음의 정원
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            fontSize:12, fontWeight:600, color:C.sage,
            background:C.sagePale, padding:'4px 12px', borderRadius:100,
          }}>
            Lv.{levelInfo.level} {levelInfo.emoji}
          </div>
          <a href={PHYWEB_URL} style={{
            fontSize:12, color:C.muted, textDecoration:'none',
            padding:'5px 12px', borderRadius:8,
            border:`1px solid rgba(0,0,0,0.08)`,
            background:'rgba(255,255,255,0.6)',
          }}>← 마음풀</a>
        </div>
      </nav>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 20px 40px' }}>

        {/* ── 정원 히어로 섹션 ── */}
        <div style={{
          borderRadius:24, overflow:'hidden',
          boxShadow:'0 8px 32px rgba(0,0,0,0.08)',
          marginBottom:24, background:'white',
        }}>
          {/* 정원 SVG */}
          <div style={{ height:200, position:'relative' }}>
            <GardenSVG status={gameStatus?.visual_status || 'clearing'} level={levelInfo.level}/>
            {/* 정원 상태 라벨 */}
            <div style={{
              position:'absolute', bottom:12, left:16,
              background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)',
              padding:'6px 14px', borderRadius:100,
              fontSize:12, fontWeight:600, color:C.dark,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {gardenTheme.label}
            </div>
            {/* 연속 출석 */}
            {(gameStatus?.streak_days || 0) > 1 && (
              <div style={{
                position:'absolute', top:12, right:12,
                background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)',
                padding:'5px 12px', borderRadius:100,
                fontSize:11, fontWeight:700, color:C.amber,
                display:'flex', alignItems:'center', gap:5,
              }}>
                🔥 {gameStatus.streak_days}일 연속
              </div>
            )}
          </div>

          {/* 인사 + 레벨바 + streak + AI 팁 */}
          <div style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:C.dark, marginBottom:4 }}>
                안녕하세요, {user?.nickname || user?.email?.split('@')[0]}님 👋{isMaster && <span style={{fontSize:11,background:'#2D6A4F',color:'white',borderRadius:6,padding:'2px 8px',fontWeight:700,marginLeft:6}}>MASTER</span>}
              </div>
              <div style={{ fontSize:13, color:C.muted }}>{gardenTheme.desc}</div>
            </div>
            <DailyTip hubData={data} />
            <LevelBar levelInfo={levelInfo} />
            <StreakCalendar recentPlayDates={data?.recentPlayDates || []} streakDays={gameStatus?.streak_days || 0} />
          </div>
        </div>

        {/* ── 연결된 검사 ── */}
        <div style={{
          background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
          borderRadius:20, padding:'18px 20px', marginBottom:24,
          border:'1px solid rgba(255,255,255,0.6)',
        }}>
          <TestBadgeRow completedTests={completedTests || []} />
        </div>

        {/* ── 번아웃 트렌드 ── */}
        <BurnoutTrendSection userTestScores={data?.userTestScores} />

        {/* ── 감정 AI 주간 리포트 ── */}
        <EmotionWeeklyReport />

        {/* ── 오늘의 추천 게임 ── */}
        <TodayRecommendCard hubData={data} onPlay={handlePlay} />

        {/* ── 데일리 퀘스트 ── */}
        <DailyQuestCard
          todaySessions={data?.todaySessions || []}
          level={levelInfo.level}
          onPlay={handlePlay}
          onBonusClaimed={() => GameEngine.getMe().then(res => { if (res.success) setData(res.data); })}
        />

        {/* ── 게임 목록 ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:18 }}>🎮</span> 치유 게임
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }} className="game-grid">
            {games.map(game => (
              <GameCard key={game.id} game={game} onPlay={handlePlay} />
            ))}
          </div>
        </div>

        {/* ── 게임 통계 ── */}
        <GameStatsSection />

        {/* ── 업적 ── */}
        <AchievementPanel
          earned={achievements || []}
          isMaster={isMaster}
        />

        {/* ── 최근 활동 ── */}
        <RecentActivity sessions={recentSessions || []} />

        {/* ── 리더보드 ── */}
        <div style={{ marginTop:32 }}>
          <button
            onClick={() => setShowLeaderboard(v => !v)}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
              borderRadius:20, padding:'16px 20px', border:'1px solid rgba(255,255,255,0.6)',
              cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
            }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16 }}>🏆</span> 정원사 순위
            </div>
            <span style={{ fontSize:12, color:C.muted }}>{showLeaderboard ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
          {showLeaderboard && (
            <div style={{ marginTop:10 }}>
              <Leaderboard currentUserEmail={user?.email} />
            </div>
          )}
        </div>

      </div>

      {/* 크레딧 차감 확인 모달 */}
      {creditModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:20,
        }} onClick={e => { if(e.target===e.currentTarget) setCreditModal(null); }}>
          <div style={{
            background:'white', borderRadius:22, padding:'28px 24px',
            width:'100%', maxWidth:360,
            boxShadow:'0 16px 48px rgba(0,0,0,0.18)',
            animation:'fadeUp 0.3s ease',
          }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:48, marginBottom:10 }}>{creditModal.gameEmoji}</div>
              <h3 style={{
                fontSize:18, fontWeight:700, color:'#2C2C20', marginBottom:6,
                fontFamily:"'Noto Serif KR', sans-serif",
              }}>{creditModal.gameName}</h3>
              <p style={{ fontSize:13, color:'#8A8A78', lineHeight:1.6 }}>
                이 게임은 플레이 시 크레딧이 차감됩니다
              </p>
            </div>

            {/* 잔액 vs 비용 */}
            <div style={{
              background:'#F5EFE0', borderRadius:14, padding:'14px 16px', marginBottom:18,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                <span style={{ color:'#8A8A78' }}>현재 크레딧</span>
                <span style={{ fontWeight:700, color:'#2C2C20' }}>{creditModal.balance} 크레딧</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'#8A8A78' }}>차감 예정</span>
                <span style={{ fontWeight:700, color:'#D4954A' }}>- {creditModal.cost} 크레딧</span>
              </div>
              <div style={{ height:1, background:'rgba(0,0,0,0.08)', margin:'10px 0' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ fontWeight:700, color:'#2C2C20' }}>차감 후 잔액</span>
                <span style={{
                  fontWeight:700,
                  color: creditModal.balance >= creditModal.cost ? '#4A7C59' : '#C05050',
                }}>
                  {Math.max(0, creditModal.balance - creditModal.cost)} 크레딧
                </span>
              </div>
            </div>

            {/* 잔액 부족 경고 */}
            {(creditModal.insufficient || creditModal.balance < creditModal.cost) && (
              <div style={{
                background:'#FEF2F2', border:'1px solid rgba(192,80,80,0.2)',
                borderRadius:10, padding:'10px 14px', marginBottom:14,
                fontSize:12, color:'#C05050', lineHeight:1.6,
              }}>
                크레딧이 부족해요. 마음풀에서 크레딧을 충전한 후 다시 시도해주세요.
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setCreditModal(null)} style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                flex:1, padding:'12px', background:'rgba(0,0,0,0.07)',
                color:'#8A8A78', border:'none', borderRadius:12, fontSize:13,
                fontWeight:600, cursor:'pointer',
              }}>취소</button>

              {creditModal.balance < creditModal.cost ? (
                <a href={PHYWEB_URL} style={{
                  flex:2, padding:'12px', textAlign:'center',
                  background:`linear-gradient(135deg, #D4954A, #E8C47A)`,
                  color:'white', border:'none', borderRadius:12, fontSize:13,
                  fontWeight:700, cursor:'pointer', textDecoration:'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Noto Sans KR',sans-serif",
                }}>크레딧 충전하기 →</a>
              ) : (
                <button
                  onClick={handleCreditConfirm}
                  disabled={spendLoading}
                  style={{
                    fontFamily:"'Noto Sans KR',sans-serif",
                    flex:2, padding:'12px',
                    background: spendLoading
                      ? 'rgba(0,0,0,0.1)'
                      : 'linear-gradient(135deg, #4A7C59, #7BA88A)',
                    color: spendLoading ? '#8A8A78' : 'white',
                    border:'none', borderRadius:12, fontSize:13,
                    fontWeight:700, cursor: spendLoading ? 'not-allowed' : 'pointer',
                  }}>
                  {spendLoading ? '처리 중...' : `${creditModal.cost} 크레딧으로 시작`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 업적 토스트 */}
      {newAchievements.length > 0 && (
        <AchievementToast achievements={newAchievements} onDismiss={() => setNewAchievements([])} />
      )}

      {/* 온보딩 튜토리얼 */}
      {showOnboarding && <OnboardingOverlay onDone={() => setShowOnboarding(false)} />}

      {/* 반응형 CSS */}
      <style>{`
        @media (max-width: 480px) {
          .game-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── 앱 마운트 ───────────────────────────────────────────────
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(React.createElement(GameHubApp));
}
