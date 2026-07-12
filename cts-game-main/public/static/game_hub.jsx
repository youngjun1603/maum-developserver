// ============================================================
// game_hub.jsx  —  마음의 정원 허브 메인 페이지
// 치유 · 자연 · 따뜻한 수채화 컨셉
// ============================================================
const { useState, useEffect, useRef, useCallback } = React;

// ── 팔레트 ──────────────────────────────────────────────────
const C = {
  sage:    '#6B21A8',
  sageL:   '#A78BFA',
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
            <div style={{ fontSize:11, color:C.muted }}>{t('다음 레벨까지', 'Next level in')} {maxExp - currentExp} EXP</div>
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
  PHQ9:    { label:'PHQ-9',   emoji:'🌱', desc:t('우울 선별', 'Depression') },
  GAD7:    { label:'GAD-7',   emoji:'💙', desc:t('불안 선별', 'Anxiety') },
  DASS21:  { label:'DASS-21', emoji:'🌊', desc:t('스트레스', 'Stress') },
  BIG5:    { label:'Big5',    emoji:'🧠', desc:t('성격 분석', 'Personality') },
  SCT:     { label:'SCT',     emoji:'✍️', desc:t('문장 완성', 'Sentence Completion') },
  DSI:     { label:'DSI',     emoji:'🪞', desc:t('자아 분화', 'Self Differentiation') },
  BURNOUT: { label:'K-MBI+',  emoji:'🔥', desc:t('번아웃', 'Burnout') },
  LOST:    { label:'LOST',    emoji:'🧭', desc:t('행동 양식', 'Behavior Pattern') },
};

function TestBadgeRow({ completedTests = [] }) {
  const allTests = Object.keys(TEST_META_HUB);
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:10, letterSpacing:'0.5px' }}>{t('연결된 심리검사', 'Linked Tests')}</div>
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
          {t('심리검사를 완료하면 게임이 더 풍성해져요.', 'Complete psych tests to enrich your game experience.')}{' '}
          <a href={PHYWEB_URL} style={{ color:C.sage, fontWeight:600, textDecoration:'none' }}>
            {t('The Light of Life에서 검사하기 →', 'Take a test on The Light of Life →')}
          </a>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GameCardSkeleton — 로딩 스켈레톤 (4번: UX 개선)
// ──────────────────────────────────────────────────────────
function GameCardSkeleton() {
  return (
    <div style={{
      background:'rgba(255,255,255,0.7)', borderRadius:20,
      padding:'24px 20px 20px', overflow:'hidden',
    }}>
      <div className="skeleton-shimmer" style={{ width:42, height:42, borderRadius:10, marginBottom:12 }}/>
      <div className="skeleton-shimmer" style={{ width:'65%', height:14, borderRadius:7, marginBottom:8 }}/>
      <div className="skeleton-shimmer" style={{ width:'90%', height:11, borderRadius:6, marginBottom:4 }}/>
      <div className="skeleton-shimmer" style={{ width:'70%', height:11, borderRadius:6, marginBottom:16 }}/>
      <div className="skeleton-shimmer" style={{ width:'50%', height:28, borderRadius:9 }}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GameHubSkeleton — 전체 허브 스켈레톤 (4번: UX 개선)
// ──────────────────────────────────────────────────────────
function GameHubSkeleton() {
  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(160deg, ${C.sagePale}, ${C.cream})`,
    }}>
      <div className="hub-top-bar"/>
      {/* 헤더 스켈레톤 */}
      <div style={{
        height:60, background:'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)',
        borderBottom:`1px solid ${C.sagePale}`,
        display:'flex', alignItems:'center', padding:'0 20px', gap:12,
      }}>
        <div className="skeleton-shimmer" style={{ width:32, height:32, borderRadius:'50%' }}/>
        <div className="skeleton-shimmer" style={{ width:120, height:14, borderRadius:7 }}/>
        <div style={{ flex:1 }}/>
        <div className="skeleton-shimmer" style={{ width:60, height:28, borderRadius:9 }}/>
      </div>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 40px' }}>
        {/* 정원 카드 스켈레톤 */}
        <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:24, padding:'20px 20px', marginBottom:20, height:160 }}>
          <div className="skeleton-shimmer" style={{ width:'60%', height:18, borderRadius:9, marginBottom:12 }}/>
          <div className="skeleton-shimmer" style={{ width:'80%', height:12, borderRadius:6, marginBottom:8 }}/>
          <div className="skeleton-shimmer" style={{ width:'40%', height:12, borderRadius:6 }}/>
        </div>
        {/* 게임 카드 그리드 스켈레톤 */}
        <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18 }}>🎮</span>
          <div className="skeleton-shimmer" style={{ width:70, height:14, borderRadius:7 }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
          {[0,1,2,3].map(i => <GameCardSkeleton key={i}/>)}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// GameCard — 개별 게임 카드
// ──────────────────────────────────────────────────────────
function GameCard({ game, onPlay, enterDelay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
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
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !locked && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => !locked && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="game-card-enter"
      style={{
        background: cardBg,
        borderRadius: 20,
        padding: '24px 20px 20px',
        cursor: locked ? 'not-allowed' : 'pointer',
        animationDelay: `${enterDelay}ms`,
        transition: 'all 0.22s ease',
        transform: pressed ? 'scale(0.96)' : (!locked && hovered ? 'translateY(-4px)' : 'none'),
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
        }}>{t('준비 중', 'Coming Soon')}</div>
      )}

      {/* 레벨 잠금 표시 */}
      {!comingSoon && !game.isUnlocked && (
        <div style={{
          position:'absolute', top:12, right:12,
          background:C.sand, color:C.amber,
          fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100,
        }}>Lv.{game.unlockLevel} {t('해금', 'Unlock')}</div>
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
        color: game.creditCost > 0 ? '#D4954A' : '#6B21A8' }}>
        {game.creditCost > 0 ? t(`🌿 ${game.creditCost} 크레딧`, `🌿 ${game.creditCost} cr`) : t('무료', 'Free')}
      </div>

      {/* 필요 검사 */}
      {game.requiredTests.length > 0 && (
        <div style={{ fontSize:11, color:C.dusty, marginBottom:12 }}>
          {game.requiredTests.map(rt => TEST_META_HUB[rt]?.label || rt).join(' · ')} {t('연동', 'linked')}
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
        {comingSoon ? t('곧 출시됩니다', 'Coming Soon') : locked ? t('🔒 잠금 해제 필요', '🔒 Unlock required') : t('시작하기 →', 'Start →')}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// StreakCalendar — 최근 7일 출석 캘린더
// ──────────────────────────────────────────────────────────
function StreakCalendar({ recentPlayDates = [], streakDays = 0, streakRecover = 0, onRecover }) {
  const [recovering, setRecovering] = useState(false);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = [t('일','Su'),t('월','Mo'),t('화','Tu'),t('수','We'),t('목','Th'),t('금','Fr'),t('토','Sa')][d.getDay()];
    days.push({ iso, dow, played: recentPlayDates.includes(iso) });
  }

  const MILESTONES = [3, 7, 14, 30, 60, 90];
  const nextMilestone = MILESTONES.find(m => m > streakDays);
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= streakDays) || 0;
  const milestoneProgress = nextMilestone
    ? Math.round(((streakDays - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  const fireEmoji = streakDays >= 30 ? '🔥🔥🔥' : streakDays >= 14 ? '🔥🔥' : streakDays >= 3 ? '🔥' : '';

  const handleRecover = async () => {
    if (recovering || streakRecover <= 0) return;
    setRecovering(true);
    const r = await GameEngine.recoverStreak().catch(() => ({ success: false }));
    setRecovering(false);
    if (r.success) onRecover?.();
  };

  return (
    <div style={{ padding:'16px 20px', background:'rgba(255,255,255,0.7)', borderRadius:16, backdropFilter:'blur(8px)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          📅 {t('최근 7일 출석', 'Last 7 Days')}
        </div>
        {streakDays > 0 && (
          <div style={{ fontSize:12, fontWeight:700, color:C.amber, display:'flex', alignItems:'center', gap:4 }}>
            {fireEmoji} {t(`${streakDays}일 연속`, `${streakDays}-day streak`)}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:6, justifyContent:'space-between', marginBottom:12 }}>
        {days.map(({ iso, dow, played }) => (
          <div key={iso} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:500 }}>{dow}</div>
            <div style={{
              width:'100%', aspectRatio:'1', borderRadius:8,
              background: played ? `linear-gradient(135deg, ${C.sage}, ${C.sageL})` : 'rgba(0,0,0,0.06)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
              boxShadow: played ? `0 2px 8px ${C.sage}40` : 'none', transition:'all 0.3s',
            }}>
              {played ? '🌿' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* 마일스톤 프로그레스 */}
      {nextMilestone && (
        <div style={{ marginBottom: streakRecover > 0 && streakDays === 0 ? 10 : 0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginBottom:4 }}>
            <span>{t('다음 목표:', 'Next goal:')} {t(`${nextMilestone}일 연속`, `${nextMilestone}-day streak`)} 🏅</span>
            <span>{streakDays} / {nextMilestone}{t('일', 'd')}</span>
          </div>
          <div style={{ height:5, borderRadius:10, background:'rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:10, transition:'width 0.5s',
              width: `${milestoneProgress}%`,
              background: `linear-gradient(90deg, ${C.amber}, ${C.amberL})`,
            }}/>
          </div>
          {hitMilestone => null /* milestone 달성 시 배지는 서버에서 처리 */}
        </div>
      )}

      {/* 복구권 사용 버튼 (streak=0 && recover>0) */}
      {streakRecover > 0 && streakDays === 0 && (
        <button onClick={handleRecover} disabled={recovering} style={{
          width:'100%', marginTop:10, padding:'8px 0', borderRadius:10, border:'none',
          background:`linear-gradient(135deg, ${C.amber}CC, ${C.amberL})`,
          color:'white', fontSize:12, fontWeight:700, cursor: recovering ? 'not-allowed' : 'pointer',
          fontFamily:"'Noto Sans KR',sans-serif",
        }}>
          {recovering ? t('복구 중...', 'Restoring...') : t(`🛡️ 복구권 사용하여 스트릭 복원 (${streakRecover}개 보유)`, `🛡️ Restore streak with a recovery pass (${streakRecover} left)`)}
        </button>
      )}

      {/* 복구권 보유 안내 (streak>0 상태) */}
      {streakRecover > 0 && streakDays > 0 && (
        <div style={{ marginTop:8, fontSize:10, color:C.amber, fontWeight:600, textAlign:'right' }}>
          🛡️ {t(`복구권 ${streakRecover}개 보유 (연속 끊길 때 자동 사용 가능)`, `${streakRecover} recovery pass(es) — auto-used when a streak breaks`)}
        </div>
      )}
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
        🤖 {t('오늘의 코치 메시지를 불러오는 중...', "Loading today's coach message...")}
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
        🤖 {t('오늘의 코치 메시지', "Today's Coach Message")}
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
      <div style={{ fontSize:13, color:C.muted, animation:'pulse 1.5s infinite' }}>{t('순위를 불러오는 중...', 'Loading rankings...')}</div>
    </div>
  );

  if (!data?.length) return (
    <div style={{ textAlign:'center', padding:'20px 0', color:C.muted, fontSize:13 }}>
      {t('아직 순위 데이터가 없어요', 'No ranking data yet')}
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
                {entry.nickname || entry.email?.split('@')[0] || t('정원사', 'Gardener')}
                {isMe && <span style={{ fontSize:10, background:C.sage, color:'white', borderRadius:4, padding:'1px 5px' }}>{t('나', 'Me')}</span>}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                Lv.{entry.garden_level} {levelInfo.name}
                {(entry.streak_days || 0) > 1 && t(` · 🔥 ${entry.streak_days}일`, ` · 🔥 ${entry.streak_days}d`)}
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
    breathing:         { emoji:'💧', name:t('호흡 훈련', 'Breathing Training') },
    cbt:               { emoji:'🌱', name:t('생각 교정', 'Thought Reframing') },
    efmt:              { emoji:'🌸', name:t('감정 훈련', 'Emotion Training') },
    relax:             { emoji:'🏞️', name:t('이완 훈련', 'Relaxation Training') },
    missions:          { emoji:'🎯', name:t('회복 미션', 'Recovery Mission') },
    city:              { emoji:'🏙️', name:t('회복 도시', 'Recovery City') },
    weekly_report:     { emoji:'📊', name:t('주간 리포트', 'Weekly Report') },
    checkin:           { emoji:'🎨', name:t('감정 체크인', 'Emotion Check-in') },
    daily_quest_bonus: { emoji:'🎁', name:t('데일리 퀘스트 보너스', 'Daily Quest Bonus') },
  };

  return (
    <div style={{ marginTop:32 }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:16 }}>📜</span> {t('최근 플레이 기록', 'Recent Activity')}
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
                <div style={{ fontSize:11, color:C.muted }}>{t('점수', 'Score')} {s.score}</div>
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
        {t('마음의 정원', 'Mind Garden')}
      </h1>
      <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:32, maxWidth:300 }}>
        {t(<>The Light of Life에서 로그인하면<br/>별도 로그인 없이 바로 이용할 수 있어요.<br/>심리검사 결과와 연결하여<br/>나만의 정원을 가꾸세요 🌿</>,
           <>Log in to The Light of Life<br/>and use it instantly — no separate login.<br/>Connect your test results<br/>and tend your own garden 🌿</>)}
      </p>
      <a href={PHYWEB_URL} style={{
        display:'inline-block', padding:'14px 36px',
        background:`linear-gradient(135deg, ${C.sage}, ${C.sageL})`,
        color:'white', borderRadius:14, fontWeight:700,
        fontSize:15, textDecoration:'none',
        boxShadow:`0 8px 24px ${C.sage}44`,
        fontFamily:"'Noto Sans KR', sans-serif",
      }}>
        {t('The Light of Life 로그인하고 시작하기 →', 'Log in to The Light of Life →')}
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

// ──────────────────────────────────────────────────────────
// CampaignSection — 스토리 캠페인 모드
// ──────────────────────────────────────────────────────────
const CAMPAIGN_DEF = [
  {
    id: 'ch1',
    title: t('첫 발걸음', 'First Steps'),
    subtitle: t('마음 챙기기', 'Mindfulness'),
    emoji: '🌱',
    color: '#6B21A8',
    colorLight: '#EAF2EC',
    desc: t('나의 감정을 알아채고 마음을 돌보는 첫 여정을 시작해요', 'Begin your first journey to notice your emotions and care for your mind.'),
    steps: [
      { game:'mood',      module:'checkin',         name:t('감정 수채화 — 오늘 감정 기록하기', 'Altar of Thanks — Record today\'s emotion'),    emoji:'🎨' },
      { game:'garden',    module:'breathing',        name:t('마음의 정원 — 호흡 훈련 완료하기', 'Mind Garden — Complete breathing training'),    emoji:'💧' },
      { game:'gratitude', module:'gratitude_write',  name:t('별빛 감사 일기 — 감사 일기 쓰기', 'Starlight Gratitude — Write a gratitude journal'),    emoji:'⭐' },
    ],
    rewardCredits: 30,
    rewardBadge: '🌱',
    rewardName: t('마음 씨앗', 'Mind Seed'),
    unlockLevel: 1,
  },
  {
    id: 'ch2',
    title: t('마음 교정', 'Mind Correction'),
    subtitle: t('인지 훈련', 'Cognitive Training'),
    emoji: '🌸',
    color: '#C97B8A',
    colorLight: '#FAE8EC',
    desc: t('부정적인 생각 패턴을 인식하고 감정 인지 능력을 키워요', 'Recognize negative thought patterns and develop emotional awareness.'),
    steps: [
      { game:'garden',  module:'cbt',       name:t('마음의 정원 — 생각 교정 완료하기', 'Mind Garden — Complete thought reframing'),         emoji:'🌱' },
      { game:'efmt',    module:null,        name:t('감정꽃 찾기 — 감정 인식 훈련 완료하기', 'Emotion Flower — Complete emotion recognition training'),    emoji:'🌸' },
      { game:'burnout', module:'missions',  name:t('번아웃 회복 — 회복 미션 완료하기', 'BURNOUT Recovery — Complete a recovery mission'),          emoji:'⚡' },
    ],
    rewardCredits: 50,
    rewardBadge: '🌸',
    rewardName: t('마음 꽃봉오리', 'Mind Bud'),
    unlockLevel: 2,
  },
  {
    id: 'ch3',
    title: t('깊은 성장', 'Deep Growth'),
    subtitle: t('자아 탐험', 'Self Exploration'),
    emoji: '🌳',
    color: '#5A9BBF',
    colorLight: '#E8F4FA',
    desc: t('집중력과 내면의 나무를 통해 자아를 깊이 탐험해요', 'Deeply explore yourself through focus and your inner tree.'),
    steps: [
      { game:'focus', module:null, name:t('마음 집중력 — 집중력 훈련 완료하기', 'Mind Focus — Complete focus training'),  emoji:'🧠' },
      { game:'tree',  module:null, name:t('내면의 나무 — 자아 탐험하기', 'Inner Tree — Explore your inner self'),         emoji:'🌳' },
      { game:'efmt',  module:null, name:t('감정꽃 찾기 — 감정 인식 재도전하기', 'Emotion Flower — Retry emotion recognition'),  emoji:'💭' },
    ],
    rewardCredits: 80,
    rewardBadge: '🌳',
    rewardName: t('마음 만개', 'Mind Full Bloom'),
    unlockLevel: 3,
  },
];

function CampaignSection({ onPlay }) {
  const [expanded, setExpanded] = React.useState(false);
  const [data, setData]         = React.useState(null);
  const [loading, setLoading]   = React.useState(false);
  const [claiming, setClaiming] = React.useState(null);
  const [claimResult, setClaimResult] = React.useState(null); // { chapterId, credits }

  const load = React.useCallback(() => {
    if (data) return;
    setLoading(true);
    GameEngine.getCampaign()
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [data]);

  const handleToggle = () => {
    if (!expanded) load();
    setExpanded(v => !v);
  };

  const handleClaim = async (chapterId) => {
    if (claiming) return;
    setClaiming(chapterId);
    try {
      const res = await GameEngine.claimCampaign(chapterId);
      if (res.success) {
        setClaimResult({ chapterId, credits: res.data.credits });
        // 데이터 갱신
        const fresh = await GameEngine.getCampaign();
        if (fresh.success) setData(fresh.data);
      } else {
        alert(res.error || t('보상 수령 실패', 'Failed to claim reward'));
      }
    } finally {
      setClaiming(null);
    }
  };

  // 챕터 잠금 여부: 이전 챕터 rewarded 여부 기준
  const isChapterLocked = (idx) => {
    if (idx === 0) return false;
    if (!data) return true;
    return !data.chapters[idx - 1]?.rewarded;
  };

  // 완료된 챕터 수 (로컬 계산용 — 데이터 없으면 0)
  const rewardedCount = data?.chapters?.filter(ch => ch.rewarded).length || 0;

  return (
    <div style={{ marginBottom:24 }}>
      <button onClick={handleToggle} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
        borderRadius: expanded ? '20px 20px 0 0' : 20,
        padding:'16px 20px', border:'1px solid rgba(255,255,255,0.6)',
        borderBottom: expanded ? '1px solid rgba(0,0,0,0.06)' : undefined,
        cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif",
        transition:'border-radius 0.2s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>📖</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>{t('스토리 캠페인', 'Story Campaign')}</span>
          {rewardedCount > 0 && (
            <span style={{
              fontSize:11, fontWeight:700,
              background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
              color:'white', borderRadius:100, padding:'2px 9px',
            }}>
              {rewardedCount} / {CAMPAIGN_DEF.length} {t('완료', 'done')}
            </span>
          )}
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{expanded ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</span>
      </button>

      {expanded && (
        <div style={{
          background:'rgba(255,255,255,0.65)', backdropFilter:'blur(8px)',
          borderRadius:'0 0 20px 20px', padding:'4px 20px 20px',
          border:'1px solid rgba(255,255,255,0.6)', borderTop:'none',
        }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'24px', color:C.muted, fontSize:13 }}>
              {t('불러오는 중...', 'Loading...')}
            </div>
          )}

          {/* 보상 수령 성공 배너 */}
          {claimResult && (
            <div style={{
              margin:'12px 0 16px',
              background:`linear-gradient(135deg, ${C.amber}22, ${C.amberL}22)`,
              border:`1px solid ${C.amber}44`, borderRadius:14, padding:'12px 16px',
              display:'flex', alignItems:'center', gap:10,
              animation:'fadeUp 0.3s ease',
            }}>
              <span style={{ fontSize:24 }}>🎉</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.amber }}>
                  {t('챕터 보상 수령 완료!', 'Chapter reward claimed!')}
                </div>
                <div style={{ fontSize:12, color:C.muted }}>
                  {t(`+${claimResult.credits} 크레딧이 지급됐어요`, `+${claimResult.credits} credits awarded`)}
                </div>
              </div>
              <button onClick={() => setClaimResult(null)} style={{
                marginLeft:'auto', background:'none', border:'none',
                cursor:'pointer', fontSize:14, color:C.muted,
              }}>✕</button>
            </div>
          )}

          {!loading && data && (
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:16 }}>
              {CAMPAIGN_DEF.map((ch, idx) => {
                const serverCh = data.chapters[idx];
                const locked   = isChapterLocked(idx);
                const rewarded = serverCh?.rewarded || false;
                const allDone  = serverCh?.allDone || false;
                const stepsDone = serverCh?.stepsDone || ch.steps.map(() => false);
                const doneCount = stepsDone.filter(Boolean).length;
                const canClaim  = allDone && !rewarded && !locked;

                return (
                  <div key={ch.id} style={{
                    borderRadius:18, overflow:'hidden',
                    border: rewarded ? `2px solid ${ch.color}44` : locked ? '1px solid rgba(0,0,0,0.06)' : `1px solid ${ch.color}28`,
                    background: rewarded ? `${ch.colorLight}` : locked ? 'rgba(0,0,0,0.02)' : 'white',
                    opacity: locked ? 0.6 : 1,
                    transition:'all 0.3s',
                  }}>
                    {/* 챕터 헤더 */}
                    <div style={{
                      padding:'14px 16px',
                      background: rewarded
                        ? `linear-gradient(135deg, ${ch.color}22, ${ch.colorLight})`
                        : locked
                          ? 'rgba(0,0,0,0.02)'
                          : `linear-gradient(135deg, ${ch.color}12, white)`,
                      display:'flex', alignItems:'center', gap:12,
                    }}>
                      {/* 챕터 아이콘 */}
                      <div style={{
                        width:44, height:44, borderRadius:14, flexShrink:0,
                        background: locked
                          ? 'rgba(0,0,0,0.08)'
                          : `linear-gradient(135deg, ${ch.color}33, ${ch.color}11)`,
                        border: `1.5px solid ${locked ? 'rgba(0,0,0,0.1)' : ch.color + '33'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: locked ? 18 : 22,
                        filter: locked ? 'grayscale(1)' : 'none',
                      }}>
                        {locked ? '🔒' : rewarded ? '✅' : ch.emoji}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                          <span style={{ fontSize:14, fontWeight:700, color: locked ? C.muted : C.dark }}>
                            {ch.title}
                          </span>
                          <span style={{
                            fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:100,
                            background: rewarded ? `${ch.color}22` : `rgba(0,0,0,0.06)`,
                            color: rewarded ? ch.color : C.muted,
                          }}>
                            {ch.subtitle}
                          </span>
                        </div>
                        <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{ch.desc}</div>
                      </div>

                      {/* 스텝 진행 배지 */}
                      {!locked && !rewarded && (
                        <div style={{
                          fontSize:11, fontWeight:700, flexShrink:0,
                          color: allDone ? ch.color : C.muted,
                        }}>
                          {doneCount}/{ch.steps.length}
                        </div>
                      )}
                    </div>

                    {/* 스텝 목록 */}
                    {!locked && (
                      <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:7 }}>
                        {ch.steps.map((step, si) => {
                          const done = stepsDone[si] || false;
                          return (
                            <div key={step.game + si} style={{
                              display:'flex', alignItems:'center', gap:10,
                              padding:'8px 10px', borderRadius:10,
                              background: done ? `${ch.color}12` : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${done ? ch.color + '28' : 'transparent'}`,
                            }}>
                              <span style={{
                                fontSize:16,
                                filter: done ? 'none' : 'grayscale(0.5) opacity(0.6)',
                              }}>{step.emoji}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{
                                  fontSize:12, fontWeight: done ? 600 : 400,
                                  color: done ? C.dark : C.muted,
                                  textDecoration: done ? 'none' : 'none',
                                }}>
                                  {step.name}
                                </div>
                              </div>
                              {done ? (
                                <span style={{ fontSize:14, color:ch.color }}>✓</span>
                              ) : (
                                <button onClick={() => onPlay?.(step.game)} style={{
                                  fontFamily:"'Noto Sans KR',sans-serif",
                                  background:`linear-gradient(135deg, ${ch.color}CC, ${ch.color}99)`,
                                  color:'white', border:'none', borderRadius:8,
                                  padding:'4px 10px', fontSize:10, fontWeight:700, cursor:'pointer',
                                }}>
                                  {t('하기 →', 'Go →')}
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* 보상 섹션 */}
                        <div style={{
                          marginTop:4, padding:'10px 12px', borderRadius:12,
                          background: rewarded
                            ? `${ch.color}15`
                            : canClaim
                              ? `linear-gradient(135deg, ${C.amber}18, ${C.amberL}18)`
                              : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${rewarded ? ch.color + '30' : canClaim ? C.amber + '44' : 'rgba(0,0,0,0.06)'}`,
                          display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                        }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color: rewarded ? ch.color : canClaim ? C.amber : C.muted }}>
                              {rewarded ? t(`✅ ${ch.rewardBadge} ${ch.rewardName} 획득!`, `✅ Earned ${ch.rewardBadge} ${ch.rewardName}!`) : t(`🎁 챕터 완료 보상: +${ch.rewardCredits} 크레딧 · ${ch.rewardBadge} ${ch.rewardName}`, `🎁 Chapter reward: +${ch.rewardCredits} cr · ${ch.rewardBadge} ${ch.rewardName}`)}
                            </div>
                            {rewarded && (
                              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{t('보상이 지급됐어요', 'Reward has been sent.')}</div>
                            )}
                          </div>
                          {canClaim && (
                            <button
                              onClick={() => handleClaim(ch.id)}
                              disabled={claiming === ch.id}
                              style={{
                                fontFamily:"'Noto Sans KR',sans-serif",
                                background:`linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
                                color:'white', border:'none', borderRadius:10,
                                padding:'7px 14px', fontSize:11, fontWeight:700,
                                cursor: claiming === ch.id ? 'not-allowed' : 'pointer',
                                flexShrink:0,
                                boxShadow:`0 4px 12px ${C.amber}44`,
                              }}>
                              {claiming === ch.id ? '...' : t('보상 받기 🎁', 'Claim 🎁')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 잠금 안내 */}
                    {locked && (
                      <div style={{ padding:'10px 16px 14px', textAlign:'center', fontSize:12, color:C.muted }}>
                        {t('이전 챕터를 완료하면 해금돼요', 'Complete the previous chapter to unlock.')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 게임 통계 섹션 ───────────────────────────────────────
const STATS_GAME_META = {
  garden:    { name:t('마음 정원', 'Mind Garden'), emoji:'🌿' },
  mood:      { name:t('감정 체크인', 'Emotion Check-in'), emoji:'🎨' },
  efmt:      { name:t('감정 탐색', 'Emotion Exploration'), emoji:'💭' },
  gratitude: { name:t('감사 일기', 'Gratitude Journal'), emoji:'⭐' },
  tree:      { name:t('생각 나무', 'Thought Tree'), emoji:'🌳' },
  burnout:   { name:t('번아웃 체크', 'BURNOUT Check'), emoji:'🔥' },
  focus:     { name:t('마음 집중력', 'Mind Focus'), emoji:'🧠' },
  worry:     { name:t('걱정 풍선', 'Worry Balloon'), emoji:'🫧' },
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
          <span style={{ fontSize:16 }}>📊</span> {t('내 게임 통계', 'My Game Stats')}
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{expanded ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</span>
      </button>

      {expanded && (
        <div style={{
          background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
          borderRadius:'0 0 20px 20px', padding:'4px 20px 20px',
          border:'1px solid rgba(255,255,255,0.6)', borderTop:'none',
          marginTop:-4,
        }}>
          {loading && <div style={{ textAlign:'center', padding:'24px', color:C.muted, fontSize:13 }}>{t('불러오는 중...', 'Loading...')}</div>}
          {!loading && stats && (
            <>
              {/* 요약 카드 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16, paddingTop:16 }}>
                {[
                  { label:t('이번 주 플레이', 'This Week'), value:t(`${week.playCount||0}회`, `${week.playCount||0}x`), sub:`+${week.expGained||0} EXP`, color:C.sage },
                  { label:t('이번 달 플레이', 'This Month'), value:t(`${month.playCount||0}회`, `${month.playCount||0}x`), sub:`+${month.expGained||0} EXP`, color:C.amber },
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
                {t('게임별 수행 현황', 'Performance by Game')}
              </div>
              {perGame.length === 0 && (
                <div style={{ textAlign:'center', padding:'20px', color:C.muted, fontSize:13 }}>{t('아직 플레이 기록이 없어요', 'No play records yet')}</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {perGame.map(g => {
                  const meta = STATS_GAME_META[g.game_id] || { name:g.game_id, emoji:'🎮' };
                  const lastDate = g.last_played ? new Date(g.last_played).toLocaleDateString(GAME_LANG === 'en' ? 'en-US' : 'ko-KR',{month:'short',day:'numeric'}) : '-';
                  return (
                    <div key={g.game_id} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:'white', borderRadius:12, padding:'12px 14px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>{meta.emoji}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:C.dark }}>{meta.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{t('마지막:', 'Last:')} {lastDate}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:15, fontWeight:700, color:C.sage }}>{(g.play_count||0)}{t('회', 'x')}</div>
                        {(g.best_score||0) > 0 && (
                          <div style={{ fontSize:11, color:C.amber }}>{t('베스트', 'Best')} {g.best_score}{t('점', 'pts')}</div>
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
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t('업적', 'Achievements')}</span>
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
          {expanded ? t('접기 ▲', 'Collapse ▲') : t(`+${sorted.length - 6}개 더보기 ▼`, `+${sorted.length - 6} more ▼`)}
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
              <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t('업적 달성!', 'Achievement Unlocked!')}</div>
              <div style={{ fontSize:12, color:C.sage, fontWeight:600 }}>{a.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
// GameHistorySection — 최근 게임 플레이 이력
// ──────────────────────────────────────────────────────────
const HISTORY_GAME_META = {
  mood:     { name:t('감정 수채화', 'Emotion Watercolor'), emoji:'😊', color:'#6366F1' },
  garden:   { name:t('마음의 정원', 'Mind Garden'), emoji:'🌿', color:'#22C55E' },
  efmt:     { name:t('감정꽃', 'Emotion Flower'),     emoji:'🌸', color:'#EC4899' },
  gratitude:{ name:t('감사 일기', 'Gratitude Journal'),  emoji:'🌟', color:'#F59E0B' },
  burnout:  { name:t('번아웃 회복', 'BURNOUT Recovery'),emoji:'⚡', color:'#F97316' },
  focus:    { name:t('집중력 훈련', 'Focus Training'),emoji:'🎯', color:'#0EA5E9' },
  worry:    { name:t('기도 풍선', 'Prayer Balloons'),  emoji:'🎈', color:'#8B5CF6' },
  tree:     { name:t('믿음의 나무', 'Tree of Faith'),  emoji:'🌲', color:'#16A34A' },
  qt:       { name:t('QT 묵상', 'QT Devotion'),    emoji:'✝️', color:'#7C3AED' },
};
function GameHistorySection() {
  const [sessions, setSessions] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const handleToggle = () => {
    if (!expanded && !sessions) {
      setLoading(true);
      GameEngine.getRecentSessions(20)
        .then(res => { if (res.success) setSessions(res.data); })
        .finally(() => setLoading(false));
    }
    setExpanded(v => !v);
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)', borderRadius:20, padding:'16px 20px', marginBottom:24, border:'1px solid rgba(255,255,255,0.6)' }}>
      <button onClick={handleToggle} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          <span>📅</span> {t('게임 플레이 이력', 'Game Play History')}
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{expanded ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</span>
      </button>
      {expanded && (
        <div style={{ marginTop:14 }}>
          {loading && <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>{t('불러오는 중...', 'Loading...')}</div>}
          {!loading && sessions && sessions.length === 0 && (
            <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>{t('아직 플레이 기록이 없어요', 'No play records yet')}</div>
          )}
          {!loading && sessions && sessions.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {sessions.map((s, i) => {
                const meta = HISTORY_GAME_META[s.game_id] || { name:s.game_id, emoji:'🎮', color:'#6B7280' };
                const date = new Date(s.created_at);
                const dateStr = date.toLocaleDateString('ko-KR', { month:'short', day:'numeric' });
                const timeStr = date.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' });
                const dur = s.duration_sec > 0 ? (s.duration_sec >= 60 ? t(`${Math.floor(s.duration_sec/60)}분`, `${Math.floor(s.duration_sec/60)}m`) : t(`${s.duration_sec}초`, `${s.duration_sec}s`)) : null;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'10px 14px', borderLeft:`3px solid ${meta.color}` }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{meta.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{meta.name}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{dateStr} {timeStr}{dur ? ` · ${dur}` : ''}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {s.score > 0 && <div style={{ fontSize:14, fontWeight:700, color:meta.color }}>{s.score}{t('점', 'pts')}</div>}
                      <div style={{ fontSize:11, color:C.muted }}>+{s.exp_gained || 0} EXP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// BurnoutTrendSection — 번아웃 점수 이력 차트
// ──────────────────────────────────────────────────────────
const BURNOUT_LEVELS = [
  { max:  39, label:t('낮음', 'Low'),   color:'#9333EA', bg:'#F3E8FF' },
  { max:  59, label:t('보통', 'Medium'),   color:'#F59E0B', bg:'#FEF3C7' },
  { max:  79, label:t('높음', 'High'),   color:'#F97316', bg:'#FFEDD5' },
  { max: 100, label:t('심각', 'Severe'),   color:'#EF4444', bg:'#FEF2F2' },
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
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t('번아웃 지수 추이', 'BURNOUT Score Trend')}</span>
          <span style={{
            fontSize:11, fontWeight:700,
            background: level.bg, color: level.color,
            borderRadius:100, padding:'2px 8px',
          }}>{t('현재', 'Current')} {burnoutScore}{t('점', 'pts')} · {level.label}</span>
        </div>
        <button onClick={handleToggle} style={{
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, fontWeight:600,
          fontFamily:"'Noto Sans KR',sans-serif",
        }}>{expanded ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</button>
      </div>

      {expanded && (
        <div style={{ marginTop:14, animation:'fadeUp 0.3s ease' }}>
          {loading && <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>{t('불러오는 중...', 'Loading...')}</div>}
          {!loading && history && entries.length === 0 && (
            <div style={{ textAlign:'center', padding:16, color:C.muted, fontSize:12 }}>
              {t('아직 번아웃 게임 기록이 없어요.', 'No BURNOUT game records yet.')}<br/>{t('게임을 플레이하면 점수 변화를 확인할 수 있어요!', 'Play the game to track score changes!')}
            </div>
          )}
          {!loading && entries.length >= 2 && (
            <div style={{
              background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12,
              border:`1px solid ${level.color}22`,
            }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{t('번아웃 점수 이력 (낮을수록 건강)', 'BURNOUT score history (lower is healthier)')}</div>
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
                    color: diff <= 0 ? '#9333EA' : '#EF4444',
                  }}>
                    {diff <= 0 ? t(`✅ 지난 회 대비 ${Math.abs(diff)}점 개선됐어요!`, `✅ Improved by ${Math.abs(diff)} pts vs last time!`) : t(`⚠️ 지난 회 대비 ${diff}점 높아졌어요. 쉬어가세요.`, `⚠️ Up ${diff} pts vs last time. Take a rest.`)}
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
              }}>{l.label} ~{l.max}{t('점', 'pts')}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// AIDiarySection — 오늘의 AI 마음 일기 (일 1회 생성)
// ──────────────────────────────────────────────────────────
function AIDiarySection() {
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [noData, setNoData] = useState(false);

  async function loadDiary() {
    setLoading(true);
    try {
      const r = await GameEngine.apiFetch('/api/game/ai-diary');
      const d = await r.json();
      if (d.success) {
        setDiary(d.data.diary);
        setNoData(!!d.data.noData);
      }
    } catch { /**/ }
    setLoading(false);
    setChecked(true);
  }

  function share() {
    if (!diary) return;
    const text = t(`📔 오늘의 마음 일기\n${diary}\n\n치유 게임에서 기록했어요 🌿 https://jesusmaum.com`, `📔 Today's Mind Diary\n${diary}\n\nRecorded on The Light of Life 🌿 https://jesusmaum.com`);
    if (navigator.share) { navigator.share({ title: t('마음 일기', 'Mind Diary'), text }).catch(() => {}); }
    else { navigator.clipboard?.writeText(text).then(() => alert(t('복사됐어요!', 'Copied!'))); }
  }

  if (!checked && !diary) {
    return (
      <div style={{background:'white',borderRadius:16,padding:'16px 18px',marginBottom:12,border:'1px solid rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>📔</span>
            <span style={{fontSize:14,fontWeight:700,color:'#6B21A8'}}>{t('오늘의 마음 일기', 'Today\'s Mind Diary')}</span>
          </div>
          <button onClick={loadDiary} disabled={loading}
            style={{fontSize:12,background:'#6B21A8',color:'white',border:'none',borderRadius:20,padding:'5px 14px',cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
            {loading ? t('생성 중...', 'Generating...') : t('✍️ 일기 생성', '✍️ Generate Diary')}
          </button>
        </div>
        <p style={{fontSize:12,color:'#9A9A9A',margin:0}}>{t('오늘의 감정 기록을 바탕으로 AI가 마음 일기를 작성해 드려요.', 'AI writes a mind diary based on your emotion records today.')}</p>
      </div>
    );
  }

  if (noData) return null;
  if (!diary) return null;

  const todayStr = new Date().toLocaleDateString(GAME_LANG === 'en' ? 'en-US' : 'ko-KR', { month:'long', day:'numeric', weekday:'short' });
  return (
    <div style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',borderRadius:16,padding:'16px 18px',marginBottom:12,border:'1px solid #bbf7d0'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>📔</span>
          <div>
            <span style={{fontSize:14,fontWeight:700,color:'#15803d'}}>{t('오늘의 마음 일기', 'Today\'s Mind Diary')}</span>
            <span style={{fontSize:11,color:'#86efac',marginLeft:8}}>{todayStr}</span>
          </div>
        </div>
        <button onClick={share}
          style={{fontSize:11,background:'transparent',color:'#16a34a',border:'1px solid #86efac',borderRadius:20,padding:'4px 10px',cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
          {t('공유 🔗', 'Share 🔗')}
        </button>
      </div>
      <p style={{fontSize:14,color:'#166534',lineHeight:1.7,margin:0,fontStyle:'italic'}}>{diary}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// WeekMoodSummaryCard — 이번 주 감정 흐름 요약 (5번: 인사이트 강화)
// ──────────────────────────────────────────────────────────
const MOOD_EMOJI_MAP = {
  happy:'😊', calm:'😌', tired:'😴', anxious:'😰', sad:'😢',
  angry:'😤', hopeful:'🌟', bored:'😑',
};
const DAY_LABELS = [t('일','Su'),t('월','Mo'),t('화','Tu'),t('수','We'),t('목','Th'),t('금','Fr'),t('토','Sa')];

function WeekMoodSummaryCard() {
  const [entries, setEntries] = useState(null);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    GameEngine.getMoodHistory(7)
      .then(res => { if (res.success) setEntries(res.data || []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !entries || entries.length === 0) return null;

  // 요일별 최신 감정 매핑
  const byDay = {};
  entries.forEach(e => {
    const d = new Date(e.recorded_at);
    const day = d.getDay();
    if (!byDay[day]) byDay[day] = e;
  });

  // 이번 주 시작 (일요일)
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() - i + 7) % 7 - (today.getDay() < i ? 7 : 0));
    return { dayIdx: d.getDay(), date: d, entry: byDay[d.getDay()] };
  });

  // 주요 감정 집계
  const emotionCount = {};
  entries.forEach(e => { emotionCount[e.emotion] = (emotionCount[e.emotion] || 0) + 1; });
  const dominant = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];
  const dominantEmoji = dominant ? (MOOD_EMOJI_MAP[dominant[0]] || '🎨') : '🎨';

  return (
    <div style={{
      background:'rgba(255,255,255,0.72)', backdropFilter:'blur(8px)',
      borderRadius:20, padding:'16px 20px', marginBottom:16,
      border:'1px solid rgba(255,255,255,0.6)',
      animation:'cardEnter .4s ease both',
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12,
      }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
          {dominantEmoji} {t('이번 주 감정 흐름', "This Week's Mood Flow")}
        </div>
        <div style={{ fontSize:11, color:C.muted }}>{t(`${entries.length}일 기록`, `${entries.length} days`)}</div>
      </div>

      {/* 7일 도트 차트 */}
      <div style={{ display:'flex', gap:6, justifyContent:'space-between' }}>
        {weekDays.map(({ dayIdx, date, entry }, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const emoji = entry ? (MOOD_EMOJI_MAP[entry.emotion] || '🎨') : null;
          const intensity = entry ? (entry.intensity || 3) : 0;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: entry
                  ? `hsla(${140 + (intensity - 1) * 20}, 50%, ${85 - intensity * 4}%, 0.9)`
                  : 'rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                border: isToday ? `2px solid ${C.sage}` : '2px solid transparent',
                transition: 'all .2s',
              }}>{emoji || (isToday ? '·' : '')}</div>
              <span style={{
                fontSize: 9, color: isToday ? C.sage : C.muted,
                fontWeight: isToday ? 700 : 400,
              }}>{DAY_LABELS[dayIdx]}</span>
            </div>
          );
        })}
      </div>

      {dominant && (
        <div style={{ fontSize:12, color:C.muted, marginTop:10, textAlign:'center' }}>
          {t('이번 주 주요 감정:', 'Main emotion this week:')}{' '}
          <span style={{ color:C.dark, fontWeight:600 }}>
            {dominantEmoji} {dominant[0] === 'happy' ? t('행복', 'Happy') : dominant[0] === 'calm' ? t('평온', 'Calm') : dominant[0] === 'tired' ? t('피곤', 'Tired') : dominant[0] === 'anxious' ? t('불안', 'Anxious') : dominant[0] === 'sad' ? t('슬픔', 'Sad') : dominant[0]}
          </span>{' '}
          ({t(`${dominant[1]}일`, `${dominant[1]} days`)})
        </div>
      )}
    </div>
  );
}

// EmotionWeeklyReport — AI 감정 주간 분석 (접기/펼치기)
// ──────────────────────────────────────────────────────────
const EMOTION_DISPLAY = {
  happy:   { emoji:'😊', label:t('행복', 'Happy'), color:'#F59E0B' },
  calm:    { emoji:'😌', label:t('평온', 'Calm'), color:'#A78BFA' },
  tired:   { emoji:'😴', label:t('피곤', 'Tired'), color:'#9BA8B0' },
  anxious: { emoji:'😰', label:t('불안', 'Anxious'), color:'#C4B5FD' },
  sad:     { emoji:'😢', label:t('슬픔', 'Sad'), color:'#93C5FD' },
  angry:   { emoji:'😤', label:t('화남', 'Angry'), color:'#FCA5A5' },
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
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t('이번 주 감정 흐름', 'This Week\'s Mood Flow')}</span>
          {entries.length > 0 && (
            <span style={{
              fontSize:11, fontWeight:600,
              background:C.sagePale, color:C.sage,
              borderRadius:100, padding:'2px 8px',
            }}>{t(`${entries.length}일 기록`, `${entries.length} days`)}</span>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {expanded && reportData?.report && (
            <button onClick={() => {
              const topEmotion = entries.length > 0
                ? (EMOTION_DISPLAY[entries[entries.length-1]?.emotion] || { emoji:'😶', label:entries[entries.length-1]?.emotion })
                : null;
              const text = t(`🌿 이번 주 마음의 정원\n${topEmotion ? topEmotion.emoji + ' ' + topEmotion.label + ' ' : ''}${entries.length}일 감정 기록\n\n${reportData.report.slice(0,80)}...\n\n#The Light of Life #치유게임 #감정기록`, `🌿 This Week's Mind Garden\n${topEmotion ? topEmotion.emoji + ' ' + topEmotion.label + ' ' : ''}${entries.length} days of emotion records\n\n${reportData.report.slice(0,80)}...\n\n#TheLightOfLife #HealingGames #MoodLog`);
              if (navigator.share) {
                navigator.share({ title:t('이번 주 감정 흐름', 'This Week\'s Mood Flow'), text }).catch(()=>{});
              } else {
                navigator.clipboard?.writeText(text).then(()=>alert(t('복사됐어요!', 'Copied!'))).catch(()=>{});
              }
            }} style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:12, color:C.muted, fontWeight:600,
              fontFamily:"'Noto Sans KR',sans-serif",
            }}>{t('공유 🔗', 'Share 🔗')}</button>
          )}
          <button onClick={() => setExpanded(v => !v)} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:12, color:C.muted, fontWeight:600,
            fontFamily:"'Noto Sans KR',sans-serif",
          }}>{expanded ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</button>
        </div>
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
                      {new Date(e.date + 'T00:00:00').toLocaleDateString(GAME_LANG === 'en' ? 'en-US' : 'ko-KR', { month:'numeric', day:'numeric' })}
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
              🤖 {t('AI 감정 패턴 분석', 'AI Emotion Pattern Analysis')}
            </div>
            <div style={{ fontSize:13, color:C.dark, lineHeight:1.75,
              fontFamily:"'Noto Sans KR',sans-serif" }}>
              {reportData.report}
            </div>
            {reportData.cached && (
              <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>
                {t('이번 주 분석 · 매주 월요일 갱신', "This week's analysis · updated every Monday")}
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
  garden:    { name:t('마음의 정원', 'Mind Garden'),      emoji:'🌿' },
  mood:      { name:t('감정 수채화', 'Emotion Watercolor'),      emoji:'🎨' },
  efmt:      { name:t('감정꽃 찾기', 'Emotion Flower'),      emoji:'🌸' },
  gratitude: { name:t('별빛 감사 일기', 'Starlight Gratitude'),   emoji:'⭐' },
  tree:      { name:t('내면의 나무', 'Inner Tree'),      emoji:'🌳' },
  burnout:   { name:t('번아웃 회복', 'BURNOUT Recovery'),      emoji:'⚡' },
  focus:     { name:t('마음 집중력', 'Mind Focus'),      emoji:'🧠' },
  worry:     { name:t('걱정 풍선', 'Worry Balloon'),        emoji:'🫧' },
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

  const gad7 = userTestScores.GAD7;

  if (phq9 !== undefined && phq9 >= 15) {
    rec = { gameId:'garden', reason:t(`PHQ-9 ${phq9}점 — 지금 호흡 훈련이 마음을 안정시켜줘요`, `PHQ-9 ${phq9} — breath prayer can steady your heart now`), color:C.dusty };
  } else if (gad7 !== undefined && gad7 >= 10) {
    rec = { gameId:'worry', reason:t(`GAD-7 ${gad7}점 — 불안한 생각을 풍선에 담아 내려놓아요 🫧`, `GAD-7 ${gad7} — place anxious thoughts in a balloon and lift them up 🫧`), color:'#7B9ED9' };
  } else if (burnout !== undefined && burnout >= 60 && level >= 2) {
    rec = { gameId:'burnout', reason:t(`번아웃 지수 ${burnout}점 — 오늘 회복 미션을 시작해보세요`, `Burnout ${burnout} — start a recovery mission today`), color:C.amber };
  } else if (!recentIds.includes('mood')) {
    rec = { gameId:'mood', reason:t('오늘 감정 기록을 아직 안 했어요 ✍️', 'You haven\'t recorded your emotions today ✍️'), color:C.sage };
  } else if (phq9 !== undefined && phq9 >= 5) {
    rec = { gameId:'worry', reason:t('마음속 걱정을 풍선에 담아 날려 보낼까요? 🫧', 'Float away your worries in a balloon? 🫧'), color:'#7B9ED9' };
  } else if (level >= 2 && !recentIds.includes('efmt')) {
    rec = { gameId:'efmt', reason:t('감정꽃 찾기로 감정 인식력을 키워보세요 🌸', 'Build emotional awareness with Emotion Flower 🌸'), color:'#C97B8A' };
  } else if (level >= 2 && !recentIds.includes('gratitude')) {
    rec = { gameId:'gratitude', reason:t('오늘의 감사 일기를 써볼까요? ⭐', 'Write today\'s gratitude journal? ⭐'), color:C.amber };
  } else if (!recentIds.includes('worry')) {
    rec = { gameId:'worry', reason:t('걱정 풍선으로 마음속 짐을 가볍게 해보세요 🫧', 'Lighten your mental load with Worry Balloon 🫧'), color:'#7B9ED9' };
  } else {
    rec = { gameId:'garden', reason:t('잠깐 호흡을 가다듬고 정원을 가꿔볼까요? 🌿', 'Take a breath and tend your garden? 🌿'), color:C.sage };
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
        ✨ {t('오늘의 추천', "Today's Pick")}
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
        }}>{t('시작 →', 'Start →')}</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// DailyQuestCard — 데일리 퀘스트 (날짜 시드 기반)
// ──────────────────────────────────────────────────────────
const QUEST_POOL = [
  { id:'play_mood',      game:'mood',      module:'checkin',        text:t('오늘의 감정 기록하기', 'Record today\'s emotion'),           emoji:'🎨', exp:15 },
  { id:'play_breathing', game:'garden',    module:'breathing',      text:t('호흡 훈련 한 번 완료하기', 'Complete one breathing training'),       emoji:'💧', exp:20 },
  { id:'play_cbt',       game:'garden',    module:'cbt',            text:t('생각 교정 한 번 완료하기', 'Complete one thought reframing'),       emoji:'🌱', exp:20 },
  { id:'play_gratitude', game:'gratitude', module:'gratitude_write',text:t('감사 일기 쓰기', 'Write a gratitude journal'),                emoji:'⭐', exp:20 },
  { id:'play_efmt',      game:'efmt',      module:'efmt_easy',      text:t('감정꽃 찾기 한 번 완료하기', 'Complete one Emotion Flower session'),     emoji:'🌸', exp:20, minLevel:2 },
  { id:'play_burnout',   game:'burnout',   module:'missions',       text:t('번아웃 회복 미션 완료하기', 'Complete a BURNOUT recovery mission'),      emoji:'⚡', exp:20, minLevel:2 },
  { id:'play_tree',      game:'tree',      module:'roots',          text:t('내면의 나무 탐험하기', 'Explore the Inner Tree'),           emoji:'🌳', exp:25, minLevel:4 },
  { id:'play_focus',     game:'focus',     module:'focus_training', text:t('집중력 훈련 한 번 완료하기', 'Complete one focus training session'),      emoji:'🧠', exp:20, minLevel:3 },
  { id:'play_any',       game:null,        module:null,             text:t('아무 게임이나 한 번 플레이하기', 'Play any game once'),  emoji:'🎮', exp:10 },
];

function getDailyQuests(level = 1, userId = 0) {
  const now = new Date();
  // userId 포함 시드 → 유저마다 다른 퀘스트 배정
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let s = dateSeed * 31337 + (userId || 1);
  const rand = () => { s = ((s * 1103515245) + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };

  const eligible = QUEST_POOL.filter(q => !q.minLevel || level >= q.minLevel);
  const pool = [...eligible];
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function DailyQuestCard({ todaySessions = [], level = 1, userId = 0, streakRecover = 0, onPlay, onBonusClaimed }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [bonusDone, setBonusDone] = useState(() => localStorage.getItem('quest_bonus_' + todayKey) === '1');
  const [bonusClaiming, setBonusClaiming] = useState(false);

  const quests = getDailyQuests(level, userId);

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
          <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t('오늘의 퀘스트', 'Today\'s Quests')}</span>
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
        {bonusDone && (
          <span style={{ fontSize:11, color:C.sage, fontWeight:700 }}>
            {t('✓ 보너스 획득!', '✓ Bonus earned!')}{streakRecover > 0 && ` 🛡️${streakRecover}`}
          </span>
        )}
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
                  {t('시작 →', 'Start →')}
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
      title: t('마음의 정원에 오신 것을 환영해요', 'Welcome to Mind Garden'),
      body: t('The Light of Life의 심리검사 결과와 연동하여 나만의 치유 공간을 가꾸는 게임 플랫폼이에요. 게임을 즐기며 마음을 돌보세요.', 'A game platform that links with your psychological test results on The Light of Life to cultivate your own healing space. Enjoy the games and care for your heart.'),
    },
    {
      emoji: '🌱',
      title: t('레벨업으로 새 게임을 해금해요', 'Level up to unlock new games'),
      body: t('게임을 플레이하면 EXP가 쌓여 레벨업해요. 레벨 2부터 감정꽃 찾기·번아웃 회복 등 더 많은 게임이 열립니다.', 'Playing games earns EXP and levels you up. From level 2, more games like Emotion Flower and BURNOUT Recovery unlock.'),
    },
    {
      emoji: '🎨',
      title: t('먼저 오늘의 감정을 기록해볼까요?', 'Let\'s record today\'s emotion first!'),
      body: t('감정 수채화는 매일 내 감정을 기록하는 기초 게임이에요. 레벨 1부터 무료로 즐길 수 있어요!', 'Emotion Watercolor is a basic game to record your daily emotions. Free from level 1!'),
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
          {isLast ? t('🌿 정원 탐험 시작하기', '🌿 Start Exploring') : t('다음 →', 'Next →')}
        </button>
        <button onClick={dismiss} style={{
          fontFamily:"'Noto Sans KR', sans-serif",
          background:'none', border:'none', cursor:'pointer',
          fontSize:12, color:C.muted, marginTop:10, padding:'4px 0',
          display:'block', width:'100%',
        }}>
          {t('건너뛰기', 'Skip')}
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
  const [sessionFeedback, setSessionFeedback] = useState(null); // { gameId, score, feedback, emoji }

  const isLoggedIn = !!localStorage.getItem('game_token');

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    const fallback = setTimeout(() => setLoading(false), 10000);
    GameEngine.getMe()
      .then(res => {
        if (res.success) {
          setData(res.data);
          if ((res.data.gameStatus?.total_exp || 0) === 0 && !localStorage.getItem('onboarding_done')) {
            setShowOnboarding(true);
          }
        } else setError(res.error || t('데이터 조회 실패', 'Failed to load data'));
      })
      .catch(() => setError(t('서버 연결 실패', 'Server connection failed')))
      .finally(() => { clearTimeout(fallback); setLoading(false); });
    return () => clearTimeout(fallback);
  }, []);

  // ── URL 파라미터 ?game=xxx 자동 실행 ──────────────────────
  // The Light of Life RecoveryCard에서 추천 게임 클릭 시 자동 진입
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (!gameParam) return;
    const valid = ['garden', 'efmt', 'gratitude', 'tree', 'burnout', 'mood', 'focus', 'worry'];
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
    const gid = activeGame;
    setActiveGame(null);
    setCreditModal(null);
    // 허브 데이터 새로고침 (경험치 + 크레딧 잔액 반영)
    GameEngine.getMe().then(res => {
      if (res.success) setData(res.data);
      if (result?.newAchievements?.length) setNewAchievements(result.newAchievements);
    });
    // 게임 완료 AI 피드백 요청 (비동기, 실패해도 무방)
    if (gid && result?.score !== undefined) {
      const meta = HISTORY_GAME_META[gid] || { emoji:'🎮' };
      GameEngine.getSessionFeedback(gid, result.score || 0, result.moduleType || gid)
        .then(res => {
          if (res.success && res.data?.feedback) {
            setSessionFeedback({ gameId: gid, score: result.score, feedback: res.data.feedback, emoji: meta.emoji });
            setTimeout(() => setSessionFeedback(null), 8000);
          }
        }).catch(() => {});
    }
  }, [activeGame]);

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
        alert(res.error || t('크레딧 차감 실패. 다시 시도해주세요.', 'Credit deduction failed. Please try again.'));
      }
    } catch {
      alert(t('네트워크 오류. 다시 시도해주세요.', 'Network error. Please try again.'));
    }
    setSpendLoading(false);
  }, [creditModal]);

  if (!isLoggedIn) return <LoginGate />;

  if (loading) return <GameHubSkeleton />;

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

  if (activeGame === 'focus') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <FocusGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'worry') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <WorryGame onExit={handleGameExit}/>
    </div>
  );

  if (activeGame === 'qt') return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {typeof QTGame !== 'undefined'
        ? <QTGame onExit={handleGameExit}/>
        : <div style={{padding:32,textAlign:'center',color:'#6B21A8'}}>{t('QT 게임을 불러오는 중...', 'Loading QT game...')}</div>
      }
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
      }}>{t('The Light of Life으로 돌아가기', 'Back to The Light of Life')}</a>
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
            {t('마음의 정원', 'Mind Garden')}
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
          }}>← The Light of Life</a>
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
                🔥 {t(`${gameStatus.streak_days}일 연속`, `${gameStatus.streak_days}-day streak`)}
              </div>
            )}
          </div>

          {/* 인사 + 레벨바 + streak + AI 팁 */}
          <div style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:C.dark, marginBottom:4 }}>
                  {t('안녕하세요,', 'Hello,')} {user?.nickname || user?.email?.split('@')[0]}{t('님 👋', ' 👋')}{isMaster && <span style={{fontSize:11,background:'#6B21A8',color:'white',borderRadius:6,padding:'2px 8px',fontWeight:700,marginLeft:6}}>MASTER</span>}
                </div>
                <div style={{ fontSize:13, color:C.muted }}>{gardenTheme.desc}</div>
              </div>
              <button onClick={toggleGameLang} title="Language" style={{ flexShrink:0, fontSize:12, fontWeight:700, color:C.muted, cursor:'pointer', padding:'5px 10px', borderRadius:8, border:'1px solid rgba(0,0,0,0.1)', background:'rgba(255,255,255,0.7)' }}>{GAME_LANG === 'en' ? '한' : 'EN'}</button>
            </div>
            <DailyTip hubData={data} />
            <LevelBar levelInfo={levelInfo} />
            <StreakCalendar
              recentPlayDates={data?.recentPlayDates || []}
              streakDays={gameStatus?.streak_days || 0}
              streakRecover={gameStatus?.streak_recover || 0}
              onRecover={() => GameEngine.getMe().then(res => { if (res.success) setData(res.data); })}
            />
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

        {/* ── 이번 주 감정 흐름 요약 ── */}
        <WeekMoodSummaryCard />

        {/* ── 오늘의 AI 마음 일기 ── */}
        <AIDiarySection />

        {/* ── 감정 AI 주간 리포트 ── */}
        <EmotionWeeklyReport />

        {/* ── 오늘의 추천 게임 ── */}
        <TodayRecommendCard hubData={data} onPlay={handlePlay} />

        {/* ── 데일리 퀘스트 ── */}
        <DailyQuestCard
          todaySessions={data?.todaySessions || []}
          level={levelInfo.level}
          userId={user?.id || 0}
          streakRecover={gameStatus?.streak_recover || 0}
          onPlay={handlePlay}
          onBonusClaimed={() => GameEngine.getMe().then(res => { if (res.success) setData(res.data); })}
        />

        {/* ── 게임 목록 ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:18 }}>🎮</span> {t('치유 게임', 'Healing Games')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }} className="game-grid">
            {games.map((game, i) => (
              <GameCard key={game.id} game={game} onPlay={handlePlay} enterDelay={i * 50} />
            ))}
          </div>
        </div>

        {/* ── 스토리 캠페인 ── */}
        <CampaignSection onPlay={handlePlay} />

        {/* ── 게임 플레이 이력 ── */}
        <GameHistorySection />

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
              <span style={{ fontSize:16 }}>🏆</span> {t('정원사 순위', 'Gardener Rankings')}
            </div>
            <span style={{ fontSize:12, color:C.muted }}>{showLeaderboard ? t('접기 ▲', 'Collapse ▲') : t('펼치기 ▼', 'Expand ▼')}</span>
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
                {t('이 게임은 플레이 시 크레딧이 차감됩니다', 'Credits will be deducted to play this game')}
              </p>
            </div>

            {/* 잔액 vs 비용 */}
            <div style={{
              background:'#F5EFE0', borderRadius:14, padding:'14px 16px', marginBottom:18,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                <span style={{ color:'#8A8A78' }}>{t('현재 크레딧', 'Current Credits')}</span>
                <span style={{ fontWeight:700, color:'#2C2C20' }}>{t(`${creditModal.balance} 크레딧`, `${creditModal.balance} cr`)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'#8A8A78' }}>{t('차감 예정', 'To be deducted')}</span>
                <span style={{ fontWeight:700, color:'#D4954A' }}>- {t(`${creditModal.cost} 크레딧`, `${creditModal.cost} cr`)}</span>
              </div>
              <div style={{ height:1, background:'rgba(0,0,0,0.08)', margin:'10px 0' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ fontWeight:700, color:'#2C2C20' }}>{t('차감 후 잔액', 'Balance after')}</span>
                <span style={{
                  fontWeight:700,
                  color: creditModal.balance >= creditModal.cost ? '#6B21A8' : '#C05050',
                }}>
                  {t(`${Math.max(0, creditModal.balance - creditModal.cost)} 크레딧`, `${Math.max(0, creditModal.balance - creditModal.cost)} cr`)}
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
                {t('크레딧이 부족해요. The Light of Life에서 크레딧을 충전한 후 다시 시도해주세요.', 'Not enough credits. Please recharge on The Light of Life and try again.')}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setCreditModal(null)} style={{
                fontFamily:"'Noto Sans KR',sans-serif",
                flex:1, padding:'12px', background:'rgba(0,0,0,0.07)',
                color:'#8A8A78', border:'none', borderRadius:12, fontSize:13,
                fontWeight:600, cursor:'pointer',
              }}>{t('취소', 'Cancel')}</button>

              {creditModal.balance < creditModal.cost ? (
                <a href={PHYWEB_URL} style={{
                  flex:2, padding:'12px', textAlign:'center',
                  background:`linear-gradient(135deg, #D4954A, #E8C47A)`,
                  color:'white', border:'none', borderRadius:12, fontSize:13,
                  fontWeight:700, cursor:'pointer', textDecoration:'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Noto Sans KR',sans-serif",
                }}>{t('크레딧 충전하기 →', 'Recharge Credits →')}</a>
              ) : (
                <button
                  onClick={handleCreditConfirm}
                  disabled={spendLoading}
                  style={{
                    fontFamily:"'Noto Sans KR',sans-serif",
                    flex:2, padding:'12px',
                    background: spendLoading
                      ? 'rgba(0,0,0,0.1)'
                      : 'linear-gradient(135deg, #6B21A8, #A78BFA)',
                    color: spendLoading ? '#8A8A78' : 'white',
                    border:'none', borderRadius:12, fontSize:13,
                    fontWeight:700, cursor: spendLoading ? 'not-allowed' : 'pointer',
                  }}>
                  {spendLoading ? t('처리 중...', 'Processing...') : t(`${creditModal.cost} 크레딧으로 시작`, `Start for ${creditModal.cost} cr`)}
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

      {/* 게임 완료 AI 피드백 플로팅 카드 */}
      {sessionFeedback && (
        <div style={{
          position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
          background:'white', borderRadius:20, padding:'16px 20px',
          boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
          maxWidth:340, width:'calc(100% - 48px)', zIndex:1000,
          border:'1px solid rgba(124,58,237,0.15)',
          animation:'fadeUp 0.4s ease',
        }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:24, flexShrink:0, lineHeight:1.2 }}>{sessionFeedback.emoji}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7C3AED', marginBottom:4 }}>
                {t('게임 완료! 🎉', 'Game Complete! 🎉')}
              </div>
              <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>
                {sessionFeedback.feedback}
              </div>
            </div>
            <button
              onClick={() => setSessionFeedback(null)}
              style={{ fontSize:16, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:'0 4px', flexShrink:0 }}>
              ✕
            </button>
          </div>
        </div>
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
