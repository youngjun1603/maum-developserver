// ============================================================
// couple_hub.jsx  —  마음커플 메인 앱
// 마음게임과 동일한 UX 패턴 · 커플 로즈 테마
// ============================================================
const { useState, useEffect, useRef, useCallback } = React;

// ── 팔레트 (커플 로즈/라벤더 테마) ───────────────────────
const C = {
  rose:     '#B5556A',
  roseL:    '#D4849A',
  rosePale: '#FCF0F3',
  cream:    '#FDFCF7',
  sand:     '#F5EFE0',
  lavender: '#7A6EA8',
  lavL:     '#A89ED4',
  lavPale:  '#F0EEF8',
  amber:    '#D4954A',
  amberL:   '#E8C47A',
  muted:    '#8A8A7A',
  dark:     '#2C2020',
  heartRed: '#E05C7A',
};

// ── 상수 ──────────────────────────────────────────────────
const TOKEN_KEY   = 'couple_token';
const MAUMFUL_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
  if (h.includes('maumcouple-dev') || h.includes('-dev.')) return 'https://maumful-dev.limyj007.workers.dev';
  return 'https://maumful.com';
})();

const COST_FULL  = 45;  // BIG5+LOST+DSI
const COST_TWO   = 35;  // 2개 조합
const COST_ONE   = 20;  // 단독

// ── API 헬퍼 ─────────────────────────────────────────────
const api = {
  _h() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
             : { 'Content-Type': 'application/json' };
  },
  async get(path) {
    const r = await fetch(path, { headers: this._h() });
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  },
  async patch(path, body = {}) {
    const r = await fetch(path, { method: 'PATCH', headers: this._h(), body: JSON.stringify(body) });
    return r.json();
  },
};

// ── 유틸 ─────────────────────────────────────────────────
function displayName(user) {
  return user?.nickname || user?.email?.split('@')[0] || '나';
}
function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}
function scoreColor(score) {
  if (score >= 80) return '#4A9A5A';
  if (score >= 60) return C.rose;
  return C.amber;
}
function scoreLabel(score) {
  if (score >= 85) return '천생연분 💕';
  if (score >= 70) return '잘 맞는 커플 💑';
  if (score >= 55) return '노력하면 완벽 🌸';
  return '다름 속의 매력 🌈';
}

// ── HeartSVG 일러스트 ─────────────────────────────────────
function HeartIllust({ score = 75, style = {} }) {
  const fill = scoreColor(score);
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', ...style }}>
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCF0F3"/>
          <stop offset="100%" stopColor="#F0EEF8"/>
        </linearGradient>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.roseL}/>
          <stop offset="100%" stopColor={C.rose}/>
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="320" height="200" fill="url(#bgGrad)"/>

      {/* 작은 별/하트 장식 */}
      {[[30,40],[280,35],[55,160],[265,155],[150,20]].map(([x,y],i) => (
        <text key={i} x={x} y={y} fontSize={i===4?14:10} textAnchor="middle"
          fill={C.roseL} opacity="0.4">✦</text>
      ))}

      {/* 메인 하트 */}
      <g transform="translate(160,100)" filter="url(#softGlow)">
        <path d="M0,20 C0,-20 -50,-40 -50,0 C-50,35 0,70 0,70 C0,70 50,35 50,0 C50,-40 0,-20 0,20 Z"
          fill="url(#heartGrad)" opacity="0.9"/>
      </g>

      {/* 점수 텍스트 */}
      <text x="160" y="108" textAnchor="middle" fontSize="26" fontWeight="700"
        fill="white" fontFamily="'Noto Sans KR', sans-serif">{score}</text>
      <text x="160" y="122" textAnchor="middle" fontSize="10" fill="white" opacity="0.9"
        fontFamily="'Noto Sans KR', sans-serif">/ 100</text>

      {/* A ↔ B 연결선 */}
      <g opacity="0.6">
        <circle cx="68" cy="100" r="22" fill="white" stroke={C.roseL} strokeWidth="1.5"/>
        <text x="68" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.rose}
          fontFamily="'Noto Sans KR', sans-serif">A</text>
        <circle cx="252" cy="100" r="22" fill="white" stroke={C.lavL} strokeWidth="1.5"/>
        <text x="252" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.lavender}
          fontFamily="'Noto Sans KR', sans-serif">B</text>
        <line x1="92" y1="100" x2="108" y2="100" stroke={C.roseL} strokeWidth="1.5" strokeDasharray="3,3"/>
        <line x1="212" y1="100" x2="228" y2="100" stroke={C.lavL} strokeWidth="1.5" strokeDasharray="3,3"/>
      </g>
    </svg>
  );
}

// ── 하트 장식 (대기 화면용) ──────────────────────────────
function WaitingIllust({ style = {} }) {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', ...style }}>
      <rect width="320" height="200" fill="#FCF0F3"/>
      {/* 파트너 A (실선) */}
      <g transform="translate(95,100)">
        <path d="M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z"
          fill={C.roseL} opacity="0.85"/>
      </g>
      {/* 파트너 B (점선 — 대기중) */}
      <g transform="translate(225,100)">
        <path d="M0,14 C0,-14 -35,-28 -35,0 C-35,24 0,48 0,48 C0,48 35,24 35,0 C35,-28 0,-14 0,14 Z"
          fill="none" stroke={C.lavL} strokeWidth="2" strokeDasharray="5,4" opacity="0.7"/>
      </g>
      {/* 연결 점선 */}
      <line x1="132" y1="100" x2="188" y2="100" stroke={C.muted}
        strokeWidth="1.5" strokeDasharray="4,4" opacity="0.4"/>
      {/* 물음표 */}
      <text x="225" y="107" textAnchor="middle" fontSize="22" fill={C.lavL} opacity="0.7">?</text>
      {/* 텍스트 */}
      <text x="160" y="168" textAnchor="middle" fontSize="12" fill={C.muted}
        fontFamily="'Noto Sans KR', sans-serif">파트너를 기다리는 중...</text>
    </svg>
  );
}

// ── LoginGate ─────────────────────────────────────────────
function LoginGate() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream}, ${C.lavPale})`,
      padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'heartbeat 2s ease-in-out infinite' }}>💕</div>
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: C.dark, marginBottom: 10,
        fontFamily: "'Noto Serif KR', serif",
      }}>마음커플</h1>
      <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.9, marginBottom: 32, maxWidth: 300 }}>
        마음풀에서 로그인하면<br/>
        별도 로그인 없이 바로 이용할 수 있어요.<br/>
        심리검사 결과로 파트너와의<br/>
        궁합과 관계 패턴을 분석해보세요 💑
      </p>
      <a href={MAUMFUL_URL} style={{
        display: 'inline-block', padding: '14px 36px',
        background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
        color: 'white', borderRadius: 14, fontWeight: 700,
        fontSize: 15, textDecoration: 'none',
        boxShadow: `0 8px 24px ${C.rose}44`,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        마음풀 로그인하고 시작하기 →
      </a>
    </div>
  );
}

// ── TestResultBadge ───────────────────────────────────────
function TestResultBadge({ type, result, date }) {
  const hasResult = !!result;
  const meta = {
    BIG5: { emoji: '🧬', label: 'BIG5 성격검사',   color: C.rose,     pale: C.rosePale,  accentL: C.roseL },
    LOST: { emoji: '⚙️', label: 'LOST 행동유형',   color: C.lavender, pale: C.lavPale,   accentL: C.lavL  },
    DSI:  { emoji: '🪞', label: 'SDRI 자아분화검사', color: '#5A8A7A',  pale: '#EAF3F0',   accentL: '#7ABAA8' },
  }[type] || { emoji: '📋', label: type, color: C.muted, pale: '#F5F5F5', accentL: C.muted };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: hasResult ? meta.pale : '#F5F5F5',
      border: `1px solid ${hasResult ? meta.accentL + '44' : '#E0E0E0'}`,
    }}>
      <span style={{ fontSize: 22 }}>{meta.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hasResult ? C.dark : C.muted }}>
          {meta.label}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {hasResult ? `✓ 완료 · ${fmtDate(date)}` : '아직 검사 결과 없음'}
        </div>
      </div>
      {hasResult && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 100, background: meta.color, color: 'white',
        }}>완료</span>
      )}
    </div>
  );
}

// ── ScoreGauge ────────────────────────────────────────────
function ScoreGauge({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{ textAlign: 'center', margin: '16px 0' }}>
      <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>/ 100점</div>
      <div style={{
        display: 'inline-block', marginTop: 8,
        padding: '5px 16px', borderRadius: 100,
        background: color + '18', color, fontWeight: 700, fontSize: 13,
      }}>{scoreLabel(score)}</div>
      {/* 게이지 바 */}
      <div style={{
        margin: '12px auto 0', width: '80%', maxWidth: 260,
        height: 8, borderRadius: 100, background: '#F0E0E8', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 100,
          width: `${score}%`,
          background: `linear-gradient(90deg, ${C.roseL}, ${color})`,
          transition: 'width 1.2s ease',
        }}/>
      </div>
    </div>
  );
}

// ── CodeInput ─────────────────────────────────────────────
function CodeInput({ onJoin, loading }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { setError('6자리 코드를 입력해주세요.'); return; }
    setError('');
    const result = await onJoin(c);
    if (!result.success) setError(result.error || '참여 실패');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="6자리 코드 입력"
          maxLength={6}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 18,
            border: `2px solid ${error ? '#E05555' : '#E8D0D8'}`,
            fontFamily: "'Noto Sans KR', monospace", letterSpacing: 4,
            textAlign: 'center', fontWeight: 700, color: C.dark,
            outline: 'none', background: 'white',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: code.length === 6 ? `linear-gradient(135deg, ${C.lavender}, ${C.lavL})` : '#E0E0E0',
            color: 'white', fontWeight: 700, fontSize: 14,
            fontFamily: "'Noto Sans KR', sans-serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : '참여'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#E05555', textAlign: 'center' }}>{error}</div>}
    </div>
  );
}

// ── CoupleReportView ──────────────────────────────────────
function CoupleReportView({ session, myRole, partnerName, userName, onBack }) {
  const [report, setReport]     = useState(session?.ai_report_text || '');
  const [score, setScore]       = useState(session?.compatibility_score || 0);
  const [generating, setGen]    = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!report && session?.status === 'both_done') {
      generateReport();
    }
  }, []);

  async function generateReport() {
    setGen(true); setError('');
    try {
      const res = await api.post('/api/couple/report', { session_code: session.session_code });
      if (res.success) {
        setReport(res.data.report);
        setScore(res.data.compatibility_score);
      } else {
        setError(res.error || '리포트 생성 실패');
      }
    } catch { setError('서버 오류가 발생했습니다.'); }
    finally { setGen(false); }
  }

  // BUG-23 FIX: JSON.parse 예외 처리
  const hasDsi = (() => {
    try { return !!(session?.host_result_json && JSON.parse(session.host_result_json || '{}').dsi); }
    catch { return false; }
  })();
  const testLabel = session?.test_type || 'BIG5+LOST+DSI';
  const hostLabel  = myRole === 'host' ? `${userName} (나)` : partnerName;
  const guestLabel = myRole === 'guest' ? `${userName} (나)` : partnerName;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})` }}>
      {/* 헤더 */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
          color: C.dark, display: 'flex', alignItems: 'center', gap: 6,
        }}>← <span style={{ fontSize: 14, fontWeight: 600 }}>결과</span></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
          💕 커플 분석 리포트 {hasDsi && <span style={{ fontSize: 11, background:'#5A8A7A', color:'white', borderRadius:6, padding:'2px 7px', fontWeight:700, marginLeft:4 }}>자아분화 포함</span>}
        </span>
        <div style={{ width: 60 }}/>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* 히어로 */}
        <div style={{
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          marginBottom: 20, background: 'white',
        }}>
          <div style={{ height: 200, position: 'relative' }}>
            <HeartIllust score={score}/>
            <div style={{
              position: 'absolute', bottom: 12, left: 16,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
              padding: '5px 14px', borderRadius: 100,
              fontSize: 12, fontWeight: 600, color: C.dark,
            }}>
              {hostLabel} 💕 {guestLabel}
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {generating ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, animation: 'heartbeat 1s infinite' }}>💕</div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>
                  AI가 두 사람의 궁합을 분석하는 중...
                </div>
              </div>
            ) : score > 0 ? (
              <ScoreGauge score={score}/>
            ) : null}
          </div>
        </div>

        {/* 리포트 본문 */}
        {error && (
          <div style={{
            padding: 16, borderRadius: 12, background: '#FFF0F0',
            border: '1px solid #FFD0D0', color: '#D05555', fontSize: 14, marginBottom: 16,
          }}>{error}</div>
        )}

        {report ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '24px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              fontSize: 13, color: C.dark, lineHeight: 2,
              whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
            }}>{report}</div>
          </div>
        ) : !generating && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <button onClick={generateReport} style={{
              padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
              color: 'white', fontWeight: 700, fontSize: 15,
              fontFamily: "'Noto Sans KR', sans-serif",
              boxShadow: `0 8px 24px ${C.rose}44`,
            }}>
              💕 커플 리포트 생성하기
            </button>
          </div>
        )}

        {/* 마음풀 상담 연결 */}
        {report && (
          <div style={{ marginTop: 20 }}>
            {/* 리포트 공유 */}
            <div style={{
              padding: '16px 20px', borderRadius: 16, marginBottom: 12,
              background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: `1px solid ${C.roseL}22`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>
                📤 리포트 공유하기
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  const text = `💕 마음커플 분석 결과\n\n궁합 점수: ${score}점 (${scoreLabel(score)})\n\n${report.slice(0, 200)}...\n\nhttps://couple.maumful.com`;
                  navigator.share ? navigator.share({ title: '마음커플 분석 결과', text }) : navigator.clipboard?.writeText(text);
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.roseL}44`,
                  background: C.rosePale, color: C.rose, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  📋 결과 복사
                </button>
                <button onClick={() => {
                  const el = document.createElement('a');
                  el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`마음커플 분석 리포트\n궁합: ${score}점\n\n${report}`);
                  el.download = `couple_report_${new Date().toISOString().slice(0,10)}.txt`;
                  el.click();
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.lavL}44`,
                  background: C.lavPale, color: C.lavender, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}>
                  💾 텍스트 저장
                </button>
              </div>
            </div>

            {/* 전문 상담사 연결 */}
            <div style={{
              padding: '20px', borderRadius: 16,
              background: `linear-gradient(135deg, ${C.rosePale}, ${C.lavPale})`,
              border: `1px solid ${C.roseL}33`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
                💬 전문 상담사와 더 깊이 나눠보세요
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>
                AI 분석 결과를 바탕으로 커플·부부 전문 상담사와 1:1 심층 상담을 받아보세요.
                자아분화 향상 프로그램, Bowen 가족치료 기법 등 전문적인 지원을 받을 수 있습니다.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={`${MAUMFUL_URL}/#counseling?type=couple&score=${score}`} style={{
                  display: 'block', padding: '12px 20px', textAlign: 'center',
                  background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                  color: 'white', borderRadius: 12,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  boxShadow: `0 6px 20px ${C.rose}44`,
                }}>
                  커플 전문 상담사 예약하기 →
                </a>
                {hasDsi && (
                  <a href={`${MAUMFUL_URL}/#counseling?type=bowen&score=${score}`} style={{
                    display: 'block', padding: '10px 20px', textAlign: 'center',
                    background: 'white', border: '1.5px solid #5A8A7A44',
                    color: '#5A8A7A', borderRadius: 12,
                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    🪞 자아분화 전문 상담사 예약하기 →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SessionWaitingView ────────────────────────────────────
function SessionWaitingView({ session, myRole, onRefresh, onReport, onCancel }) {
  const [polling, setPolling] = useState(false);
  const code = session?.session_code || '';

  function copyCode() {
    const msg = `마음커플 초대코드: ${code}\n함께 심리 분석해봐요 💕\nhttps://couple.maumful.com/?code=${code}`;
    navigator.clipboard?.writeText(msg).catch(() => {});
  }

  function copyPartnerLink() {
    const base = window.location.hostname.includes('workers.dev') || window.location.hostname.includes('-dev.')
      ? 'https://maumful-dev.limyj007.workers.dev'
      : 'https://maumful.com';
    navigator.clipboard?.writeText(`${base}?partner=${code}`).catch(() => {});
  }

  // 폴링: 파트너 미참여 시 30초, 참여 후 10초 간격
  const pollInterval = isGuestDone || isHostDone ? 10000 : 30000;
  useEffect(() => {
    const timer = setInterval(async () => {
      setPolling(true);
      await onRefresh();
      setPolling(false);
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval]);

  // 세션 만료 체크
  const isExpired = session?.expires_at && new Date(session.expires_at) < new Date();
  if (isExpired) {
    return (
      <div style={{
        background: 'white', borderRadius: 20, padding: '32px 20px', textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>세션이 만료되었습니다</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>72시간이 지나 세션이 만료되었습니다. 새 세션을 만들어 다시 시작해보세요.</div>
      </div>
    );
  }

  const isHostDone  = !!session?.host_result_json;
  const isGuestDone = !!session?.guest_result_json;
  const bothDone    = session?.status === 'both_done' || (isHostDone && isGuestDone);

  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 20,
    }}>
      <div style={{ height: 180 }}>
        {bothDone ? <HeartIllust score={75}/> : <WaitingIllust/>}
      </div>
      <div style={{ padding: '20px 20px 24px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
          {bothDone ? '🎉 두 사람 모두 준비 완료!' : '파트너를 기다리는 중'}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          {bothDone
            ? '이제 커플 분석 리포트를 생성할 수 있습니다.'
            : '파트너 링크를 공유하세요. 파트너는 로그인 없이 바로 검사에 참여할 수 있어요.'}
        </div>

        {/* 진행 상태 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { label: myRole === 'host' ? '나 (host)' : '파트너 A', done: isHostDone },
            { label: myRole === 'guest' ? '나 (guest)' : '파트너 B', done: isGuestDone },
          ].map(({ label, done }, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
              background: done ? C.rosePale : '#F5F5F5',
              border: `1px solid ${done ? C.roseL + '44' : '#E0E0E0'}`,
            }}>
              <div style={{ fontSize: 18 }}>{done ? '✅' : '⏳'}</div>
              <div style={{ fontSize: 11, color: done ? C.rose : C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 초대코드 */}
        {!bothDone && (
          <div style={{
            background: C.rosePale, borderRadius: 14, padding: '16px',
            border: `1px solid ${C.roseL}33`, marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>파트너에게 공유할 초대코드</div>
            <div style={{
              fontSize: 32, fontWeight: 800, letterSpacing: 8,
              color: C.rose, fontFamily: 'monospace', textAlign: 'center', marginBottom: 12,
            }}>{code}</div>
            <button onClick={copyPartnerLink} style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: C.rose, color: 'white', fontWeight: 700, fontSize: 13,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              🔗 파트너 검사 링크 복사 (로그인 불필요)
            </button>
            <button onClick={copyCode} style={{
              width: '100%', padding: '8px', borderRadius: 10, marginTop: 8,
              border: `1px solid ${C.rose}44`, cursor: 'pointer',
              background: 'white', color: C.rose, fontWeight: 600, fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              📋 마음커플 코드 복사 (계정 있는 파트너)
            </button>
          </div>
        )}

        {/* 만료 시간 */}
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 8 }}>
          ⏰ 세션 만료: {fmtDate(session?.expires_at)} {polling ? '(확인 중...)' : ''}
        </div>

        {/* host만 취소 가능 */}
        {myRole === 'host' && !bothDone && (
          <button onClick={onCancel} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: `1px solid #E0D0D0`,
            background: 'white', color: '#A07070', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', marginBottom: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            세션 취소하기
          </button>
        )}

        {/* 리포트 생성 버튼 */}
        {bothDone && (
          <button onClick={onReport} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
            color: 'white', fontWeight: 700, fontSize: 15,
            fontFamily: "'Noto Sans KR', sans-serif",
            boxShadow: `0 8px 24px ${C.rose}44`,
          }}>
            💕 커플 리포트 보기
          </button>
        )}
      </div>
    </div>
  );
}

// ── CoupleHubApp ──────────────────────────────────────────
function CoupleHubApp() {
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState('');
  const [view, setView]           = useState('hub');  // 'hub' | 'report' | 'join'
  const [sessionData, setSession] = useState(null);
  const [partnerName, setPartner] = useState('파트너');
  const [myRole, setMyRole]       = useState('host');
  const [creating, setCreating]   = useState(false);
  const [joining, setJoining]     = useState(false);
  const [creditModal, setCredit]  = useState(null);
  const [toast, setToast]         = useState('');

  const isLoggedIn = !!localStorage.getItem(TOKEN_KEY);

  // 초기 데이터 로드
  const loadMe = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const res = await api.get('/api/couple/me');
      if (res.success) {
        setData(res.data);
        // 활성 세션 있으면 자동 세팅
        if (res.data.activeSession) {
          setSession(res.data.activeSession);
          setMyRole(res.data.activeSession.host_user_id === res.data.user.id ? 'host' : 'guest');
        }
      } else setError(res.error || '데이터 조회 실패');
    } catch { setError('서버 연결 실패'); }
    finally { setLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { loadMe(); }, []);

  // URL 코드 파라미터 자동 처리
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && isLoggedIn) {
      // BUG-4 FIX: URL cleanup을 setTimeout 안으로 이동 (handleJoin 실행과 동시에)
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.toString());
        handleJoin(codeParam);
      }, 800);
    }
  }, []);

  // BUG-5 FIX: useRef로 toast timeout 관리하여 cleanup
  const toastTimerRef = React.useRef(null);
  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  }

  // 세션 생성
  async function handleCreateSession(testType = 'BIG5+LOST') {
    setCreating(true);
    try {
      const res = await api.post('/api/couple/session', { test_type: testType });
      if (res.success) {
        setSession(res.data.session);
        setMyRole('host');
        setCredit(null);
        showToast(res.data.isExisting ? '기존 세션을 불러왔습니다.' : '세션이 생성되었습니다!');
        if (!res.data.isExisting) refreshCredits(); // 크레딧 차감 즉시 반영
      } else if (res.needsCharge) {
        setCredit({ message: res.error, balance: data?.user?.credits });
      } else {
        showToast(res.error || '생성 실패');
      }
    } catch { showToast('서버 오류'); }
    finally { setCreating(false); }
  }

  // 코드로 참여
  async function handleJoin(code) {
    setJoining(true);
    try {
      const res = await api.post('/api/couple/join', { code });
      if (res.success) {
        setSession(res.data.session);
        setMyRole('guest');
        showToast('세션에 참여했습니다! 💕');
        // 파트너 이름 조회
        const s = await api.get(`/api/couple/session/${res.data.session.session_code}`);
        if (s.success) setPartner(s.data.partnerName);
      } else {
        return { success: false, error: res.error };
      }
    } catch { return { success: false, error: '서버 오류' }; }
    finally { setJoining(false); }
    return { success: true };
  }

  // 세션 갱신
  async function refreshSession() {
    if (!sessionData?.session_code) return;
    const res = await api.get(`/api/couple/session/${sessionData.session_code}`);
    if (res.success) {
      setSession(res.data.session);
      setPartner(res.data.partnerName);
    }
  }

  // 세션 취소
  async function handleCancelSession() {
    if (!sessionData?.session_code) return;
    if (!window.confirm('세션을 취소하시겠습니까? 크레딧은 환불되지 않습니다.')) return;
    try {
      const res = await api.patch(`/api/couple/session/${sessionData.session_code}/cancel`);
      if (res.success) {
        setSession(null);
        showToast('세션이 취소되었습니다.');
        // 크레딧 갱신
        const cr = await api.get('/api/couple/credits');
        if (cr.success) setData(prev => prev ? { ...prev, user: { ...prev.user, credits: cr.data.balance } } : prev);
      } else {
        showToast(res.error || '취소 실패');
      }
    } catch { showToast('서버 오류'); }
  }

  // 크레딧 갱신
  async function refreshCredits() {
    try {
      const res = await api.get('/api/couple/credits');
      if (res.success) setData(prev => prev ? { ...prev, user: { ...prev.user, credits: res.data.balance } } : prev);
    } catch {}
  }

  if (!isLoggedIn) return <LoginGate />;

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(160deg, ${C.rosePale}, ${C.cream})`,
    }}>
      <div style={{ fontSize: 56, animation: 'heartbeat 1.5s ease-in-out infinite' }}>💕</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 16, animation: 'pulse 1.5s infinite' }}>
        마음커플을 불러오는 중...
      </div>
    </div>
  );

  // 리포트 뷰
  if (view === 'report' && sessionData) {
    return (
      <CoupleReportView
        session={sessionData}
        myRole={myRole}
        partnerName={partnerName}
        userName={displayName(data?.user)}
        onBack={() => setView('hub')}
      />
    );
  }

  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.cream, padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🌧️</div>
      <div style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>{error}</div>
      <a href={MAUMFUL_URL} style={{
        padding: '10px 24px', background: C.rose, color: 'white',
        borderRadius: 10, fontSize: 14, fontWeight: 600,
        textDecoration: 'none', fontFamily: "'Noto Sans KR', sans-serif",
      }}>마음풀로 돌아가기</a>
    </div>
  );

  const { user, testResults, recentReports, isMaster } = data || {};
  const hasActive = !!sessionData;
  const hasBig5   = !!testResults?.big5;
  const hasLost   = !!testResults?.lost;
  const hasDsiTest = !!testResults?.dsi;
  const hasAny    = hasBig5 || hasLost || hasDsiTest; // BUG-7 FIX: DSI 포함

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.rosePale} 0%, ${C.cream} 40%, ${C.lavPale} 100%)` }}>

      {/* ── 네비게이션 ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,252,247,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(181,85,106,0.12)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💕</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark, fontFamily: "'Noto Serif KR', serif" }}>
            마음커플
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: C.rose,
            background: C.rosePale, padding: '4px 12px', borderRadius: 100,
            border: `1px solid ${C.roseL}44`,
          }}>
            ✦ {user?.credits ?? 0} 크레딧
          </div>
          <a href={MAUMFUL_URL} style={{
            fontSize: 12, color: C.muted, textDecoration: 'none',
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.6)',
          }}>← 마음풀</a>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── 인사 카드 ── */}
        <div style={{
          borderRadius: 20, padding: '20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
            안녕하세요, {displayName(user)}님 👋
            {isMaster && <span style={{ fontSize: 11, background: C.rose, color: 'white', borderRadius: 6, padding: '2px 8px', fontWeight: 700, marginLeft: 6 }}>MASTER</span>}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            심리검사 결과로 파트너와의 관계 패턴을 함께 탐색해보세요.
          </div>
        </div>

        {/* ── 검사 결과 현황 ── */}
        <div style={{
          borderRadius: 20, padding: '20px', marginBottom: 20,
          background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>
            📋 내 검사 결과
          </div>
          {/* 커플 탐색 그룹 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 6 }}>💑 커플 탐색</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TestResultBadge type="BIG5" result={testResults?.big5} date={testResults?.big5?.performed_at}/>
              <TestResultBadge type="LOST" result={testResults?.lost} date={testResults?.lost?.performed_at}/>
            </div>
          </div>
          {/* 관계 심층 분석 그룹 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5A8A7A', marginBottom: 6 }}>👨‍👩‍👧 관계 심층 분석</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TestResultBadge type="DSI"  result={testResults?.dsi}  date={testResults?.dsi?.performed_at}/>
            </div>
          </div>
          {!hasAny ? (
            <div style={{
              padding: '16px', borderRadius: 14, background: '#FFF8F0',
              border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>💡 검사를 먼저 완료해주세요</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 2 }}>💑 커플 탐색</div>
                {[
                  { key: 'BIG5', emoji: '🧬', label: 'BIG5 성격검사', desc: '성격 5요인 — 커플 궁합 핵심' },
                  { key: 'LOST', emoji: '⚙️', label: 'LOST 행동유형', desc: '의사결정·에너지 스타일 비교' },
                ].map(t => (
                  <a key={t.key} href={`${MAUMFUL_URL}?start=${t.key}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'white', border: '1px solid #FFD8A0',
                    textDecoration: 'none', color: C.dark,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
                    </div>
                    <span style={{ color: C.rose, fontSize: 12, fontWeight: 700 }}>시작 →</span>
                  </a>
                ))}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5A8A7A', marginTop: 8, marginBottom: 2 }}>👨‍👩‍👧 관계 심층 분석</div>
                {[
                  { key: 'DSI', emoji: '🪞', label: 'SDRI 자아분화', desc: '부부·가족 관계 어려움 — Bowen 이론 기반' },
                ].map(t => (
                  <a key={t.key} href={`${MAUMFUL_URL}?start=${t.key}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'white', border: '1px solid #B8D8D0',
                    textDecoration: 'none', color: C.dark,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
                    </div>
                    <span style={{ color: '#5A8A7A', fontSize: 12, fontWeight: 700 }}>시작 →</span>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>마음풀에서 하나 이상 완료하면 바로 커플 분석이 가능해요.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                ✓ 커플 분석에 사용할 최신 결과가 준비되어 있습니다.
                {testResults?.dsi && <span style={{ marginLeft: 6, color: '#5A8A7A', fontWeight: 600 }}>자아분화 포함 ✦</span>}
              </div>
              {/* 미완료 검사 빠른 이동 */}
              {(['BIG5','LOST','DSI'].some(t => !{BIG5:testResults?.big5,LOST:testResults?.lost,DSI:testResults?.dsi}[t])) && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: '#FFFBF0', border: '1px solid #FFE8A0',
                  fontSize: 12, color: '#9A7030',
                }}>
                  💡 {['BIG5','LOST','DSI'].filter(t => !{BIG5:testResults?.big5,LOST:testResults?.lost,DSI:testResults?.dsi}[t]).map((t, i, arr) => (
                    <React.Fragment key={t}>
                      <a href={`${MAUMFUL_URL}?start=${t}`} style={{ color: C.rose, fontWeight: 700, textDecoration: 'none' }}>{t}</a>
                      {i < arr.length - 1 && ' + '}
                    </React.Fragment>
                  ))} 검사도 완료하면 더 정밀한 분석이 가능해요 →
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 활성 세션 / 세션 시작 ── */}
        {hasActive ? (
          <SessionWaitingView
            session={sessionData}
            myRole={myRole}
            onRefresh={refreshSession}
            onReport={() => setView('report')}
            onCancel={handleCancelSession}
          />
        ) : (
          <div style={{
            borderRadius: 20, padding: '20px', marginBottom: 20,
            background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              💑 커플 분석 시작하기
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
              검사 조합을 선택해 세션을 만들거나, 파트너가 보낸 코드로 참여하세요.
            </div>

            {/* 검사 조합 선택 */}
            {hasAny && (() => {
              const coupleOptions = [
                ...(testResults?.big5 && testResults?.lost ? [
                  { key: 'BIG5+LOST', label: 'BIG5 + LOST', badge: '추천', cost: COST_TWO,
                    desc: '성격·행동유형 비교 — 커플 어울림 핵심', color: C.rose }
                ] : []),
                ...(testResults?.big5 && !testResults?.lost ? [
                  { key: 'BIG5', label: 'BIG5만', badge: null, cost: COST_ONE,
                    desc: '성격 5요인 비교', color: C.rose }
                ] : []),
                ...(!testResults?.big5 && testResults?.lost ? [
                  { key: 'LOST', label: 'LOST만', badge: null, cost: COST_ONE,
                    desc: '의사결정·에너지 스타일 비교', color: C.lavender }
                ] : []),
              ];
              const deepOptions = !testResults?.dsi ? [] : [
                ...(testResults?.big5 && testResults?.lost ? [
                  { key: 'BIG5+LOST+DSI', label: 'BIG5 + LOST + 자아분화', badge: '추천', cost: COST_FULL,
                    desc: '성격·행동유형·자아분화 통합 분석 (부부상담 최적)', color: '#5A8A7A' }
                ] : []),
                ...(testResults?.big5 && !testResults?.lost ? [
                  { key: 'BIG5+DSI', label: 'BIG5 + 자아분화', badge: '추천', cost: COST_TWO,
                    desc: '성격 특성과 분화 수준 비교', color: '#5A8A7A' }
                ] : []),
                ...(!testResults?.big5 && testResults?.lost ? [
                  { key: 'LOST+DSI', label: 'LOST + 자아분화', badge: '추천', cost: COST_TWO,
                    desc: '행동유형과 분화 수준 비교', color: '#5A8A7A' }
                ] : []),
                ...(!testResults?.big5 && !testResults?.lost ? [
                  { key: 'DSI', label: 'SDRI 자아분화만', badge: null, cost: COST_ONE,
                    desc: '관계 분화 수준 집중 분석', color: '#5A8A7A' }
                ] : []),
              ];

              const renderOptions = (opts) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opts.map(opt => (
                    <button key={opt.key}
                      onClick={() => handleCreateSession(opt.key)}
                      disabled={creating}
                      style={{
                        padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${opt.color}33`,
                        background: opt.badge ? `linear-gradient(135deg, ${opt.color}12, ${opt.color}06)` : 'white',
                        cursor: 'pointer', textAlign: 'left', opacity: creating ? 0.7 : 1,
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{opt.label}</span>
                          {opt.badge && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 100,
                              background: opt.color, color: 'white',
                            }}>{opt.badge}</span>
                          )}
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: opt.color,
                          whiteSpace: 'nowrap', marginLeft: 12,
                        }}>{isMaster ? '무료' : `${opt.cost}cr`}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );

              return (
                <div style={{ marginBottom: 16 }}>
                  {coupleOptions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 2 }}>💑 커플 탐색</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>성격·행동유형으로 서로를 알아가는 가벼운 분석</div>
                      {renderOptions(coupleOptions)}
                    </div>
                  )}
                  {deepOptions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#5A8A7A', marginBottom: 2 }}>👨‍👩‍👧 관계 심층 분석</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>자아분화 기반 · 부부·가족 관계 어려움 탐색</div>
                      {renderOptions(deepOptions)}
                    </div>
                  )}
                </div>
              );
            })()}

            {!hasAny && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: '#FFF8F0',
                border: '1px solid #FFD8A0', fontSize: 13, color: '#A07040', marginBottom: 16,
              }}>
                💡 마음풀에서 BIG5, LOST, SDRI 검사 중 하나 이상을 완료해야 세션을 만들 수 있어요.
              </div>
            )}

            {/* 코드로 참여 */}
            <div style={{
              padding: '16px', borderRadius: 14,
              background: C.lavPale, border: `1px solid ${C.lavL}33`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.lavender, marginBottom: 10 }}>
                📨 파트너 코드로 참여하기
              </div>
              <CodeInput onJoin={handleJoin} loading={joining}/>
            </div>
          </div>
        )}

        {/* ── 이전 리포트 ── */}
        {recentReports?.length > 0 && (
          <div style={{
            borderRadius: 20, padding: '20px',
            background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>
              📜 이전 분석 리포트
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentReports.map(r => (
                <button key={r.id} onClick={() => { setSession(r); setView('report'); }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.roseL}33`,
                  background: C.rosePale, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 100,
                    background: `linear-gradient(135deg, ${C.rose}, ${C.roseL})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>{r.compatibility_score || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                      {r.test_type} 분석 · {scoreLabel(r.compatibility_score || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {fmtDate(r.created_at)}
                    </div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 크레딧 부족 모달 ── */}
      {creditModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 28,
            maxWidth: 320, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>크레딧 부족</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              {creditModal.message}
            </div>
            <a href={`${MAUMFUL_URL}/#charge`} style={{
              display: 'block', padding: '12px', borderRadius: 12,
              background: C.rose, color: 'white', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', marginBottom: 10,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>마음풀에서 충전하기</a>
            <button onClick={() => setCredit(null)} style={{
              background: 'none', border: 'none', color: C.muted,
              fontSize: 13, cursor: 'pointer', padding: '8px',
            }}>취소</button>
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, background: C.dark, color: 'white',
          padding: '12px 24px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeUp 0.3s ease',
          fontFamily: "'Noto Sans KR', sans-serif",
          whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </div>
  );
}

// ── 마운트 ───────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CoupleHubApp/>);
