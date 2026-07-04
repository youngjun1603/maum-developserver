// ============================================================================
// 마음부부 (MaumBubu) 프론트 — React 18 (esbuild 사전컴파일, 마음커플 방식)
// 진입: 마음풀 /api/bubu-token → ?t= → localStorage('bubu_token')
// ============================================================================
const { useState, useEffect, useRef } = React;

// ── 브랜드 ──────────────────────────────────────────────────────────────────
const GREEN = '#2d6a4f', GREEN2 = '#52b788', LGREEN = '#d8f3dc', BG = '#eef6f1';
const INK = '#1a2b22', MUT = '#5a6b62', LINE = '#dbe7e0';
const ACCENT = { psychology: '#2d6a4f', christian: '#3b6fb5' };

// ── API ─────────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('bubu_token') || '';
async function api(path, method, body) {
  const opt = { method: method || 'GET', headers: { Authorization: 'Bearer ' + token() } };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch('/api' + path, opt);
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, ...data };
}

// ── 설정(온보딩) 저장 ─────────────────────────────────────────────────────────
const loadConfig = () => { try { return JSON.parse(localStorage.getItem('bubu_config') || 'null'); } catch { return null; } };
const saveConfig = (c) => localStorage.setItem('bubu_config', JSON.stringify(c));

// ── 4모드 ──────────────────────────────────────────────────────────────────
const MODES = [
  { key: 'receive', emoji: '👂', title: '수신 통역', desc: '"저 말이 무슨 뜻이야?"', placeholder: '배우자에게서 들은 말을 그대로 붙여넣어 보세요.' },
  { key: 'send', emoji: '✍️', title: '발신 통역', desc: '"이걸 어떻게 말하지?"', placeholder: '배우자에게 하고 싶은 말을 적어 보세요.' },
  { key: 'mediate', emoji: '🕊️', title: '중재 통역', desc: '싸운 대화 전체 분석', placeholder: '주고받은 대화(카톡 등)를 통째로 붙여넣어 보세요.' },
  { key: 'perspective', emoji: '🔄', title: '관점 통역', desc: '"상대는 어떻게 느꼈을까?"', placeholder: '어떤 사건이나 대화를 적어 보세요. 배우자 입장에서 통역해 드려요.' },
];

// ── 통역 결과 필드 라벨 (모드 공통 렌더) ─────────────────────────────────────────
const FIELD = {
  surface: '표면적으로는', translation: '그 아래 마음 (가설)', hidden_need: '숨어 있을 수 있는 요청',
  check_question: '이렇게 물어보면 어떨까요', micro_action: '오늘 해볼 작은 행동', caution: '이 통역의 한계',
  original_intent: '진짜 전하고 싶은 마음', risk_in_original: '원래 표현이 들릴 수 있는 방식',
  rewritten: '이렇게 말해보세요', alternative: '다른 톤 버전', timing_tip: '타이밍', avoid: '피할 표현',
  miss_point: '서로 놓친 결정적 지점', cycle: '반복되는 패턴', next_word: '먼저 건넬 한마디',
  your_feeling_first: '먼저, 당신의 마음', partner_view: '배우자의 눈에는', partner_feeling: '그때 배우자의 감정',
  blind_spot: '놓쳤을 수 있는 것', bridge: '두 관점을 잇는 다리',
};
const REACTIONS = [
  { key: 'positive', label: '좋았어요 😊' }, { key: 'awkward', label: '어색했어요 😅' },
  { key: 'cold', label: '냉담했어요 😐' }, { key: 'conflict', label: '오히려 싸웠어요 😞' },
];
const ROOMS = [
  { key: 'couple', label: '부부 이야기' }, { key: 'holiday', label: '명절·양가' },
  { key: 'teen_parent', label: '자녀·육아' }, { key: 'caregiving', label: '돌봄·간병' },
];

// ── 공통 UI ──────────────────────────────────────────────────────────────────
function Shell({ children, title, onBack, right }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', minHeight: '100vh', background: '#fff', boxShadow: '0 0 40px rgba(0,0,0,.04)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: GREEN, color: '#fff', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', fontSize: 16 }}>‹</button>}
        <div style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>{title || '💬 마음부부'}</div>
        {right}
      </div>
      <div style={{ padding: 18, animation: 'fadeUp .25s ease' }}>{children}</div>
    </div>
  );
}
function Btn({ children, onClick, disabled, kind, style }) {
  const bg = kind === 'ghost' ? '#fff' : (disabled ? '#cfe3d6' : GREEN);
  const col = kind === 'ghost' ? GREEN : '#fff';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '14px', borderRadius: 13, border: kind === 'ghost' ? `1.5px solid ${LINE}` : 'none',
        background: bg, color: col, fontSize: 15, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', ...style }}>
      {children}
    </button>
  );
}
function Card({ children, style }) {
  return <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18, ...style }}>{children}</div>;
}

// ── 온보딩 ──────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [track, setTrack] = useState('psychology');
  const [emotionDepth, setEmotionDepth] = useState(2);
  const [theologyLevel, setTheologyLevel] = useState(2);
  const [pastoralTone, setPastoralTone] = useState('grace');
  const [step, setStep] = useState(0);

  const TrackCard = ({ v, title, desc }) => (
    <div onClick={() => setTrack(v)} style={{ cursor: 'pointer', border: `2px solid ${track === v ? ACCENT[v] : LINE}`, background: track === v ? '#f4faf6' : '#fff', borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ fontWeight: 800, color: track === v ? ACCENT[v] : INK, fontSize: 16 }}>{title}</div>
      <div style={{ color: MUT, fontSize: 13, marginTop: 4 }}>{desc}</div>
    </div>
  );
  const Slider = ({ label, val, set, marks }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {marks.map((m, i) => (
          <div key={i} onClick={() => set(i + 1)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${val === i + 1 ? GREEN : LINE}`, background: val === i + 1 ? LGREEN : '#fff', color: val === i + 1 ? GREEN : MUT }}>{m}</div>
        ))}
      </div>
    </div>
  );

  return (
    <Shell title="시작하기">
      {step === 0 && (<>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>어떤 언어로 통역할까요?</div>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 16 }}>나에게 맞는 경로를 고르세요. 나중에 바꿀 수 있어요.</div>
        <TrackCard v="psychology" title="🌱 심리상담 트랙" desc="애착·정서(EFT) 기반으로 마음을 풀어드려요." />
        <TrackCard v="christian" title="✝️ 기독교 트랙" desc="복음의 순서(경청·은혜·회복)로 언약적 관점을 더해요." />
        <div style={{ height: 12 }} />
        <Btn onClick={() => setStep(1)}>다음</Btn>
      </>)}
      {step === 1 && (<>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>강도를 맞춰볼까요?</div>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 16 }}>편한 만큼만. 언제든 조절돼요.</div>
        {track === 'psychology'
          ? <Slider label="감정 깊이" val={emotionDepth} set={setEmotionDepth} marks={['표면', '중간', '심층']} />
          : (<>
            <Slider label="신학 강도" val={theologyLevel} set={setTheologyLevel} marks={['통합형', '균형형', '성경형']} />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>목양 톤</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[['grace', '경청·은혜형'], ['direct', '제한적 직면형']].map(([k, l]) => (
                <div key={k} onClick={() => setPastoralTone(k)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${pastoralTone === k ? GREEN : LINE}`, background: pastoralTone === k ? LGREEN : '#fff', color: pastoralTone === k ? GREEN : MUT }}>{l}</div>
              ))}
            </div>
          </>)}
        <div style={{ height: 12 }} />
        <Btn onClick={() => setStep(2)}>다음</Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" onClick={() => setStep(0)}>이전</Btn>
      </>)}
      {step === 2 && (<>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>먼저 확인해 주세요</div>
        <Card style={{ background: '#fef9ec', border: '1px solid #fde68a', color: '#78350f', fontSize: 13.5, lineHeight: 1.8 }}>
          <b>안전이 우선입니다.</b><br />
          신체적 폭력·강압적 통제·위협이 있는 상황이라면, 이 서비스는 대화 기술의 문제로 다루지 않습니다.<br />
          긴급 시 <b>112</b> · 여성긴급전화 <b>1366</b> · 청소년 <b>1388</b> · 노인보호 <b>1577-1389</b>.<br />
          마음부부는 의료·상담을 대체하지 않는 <b>통역 도구</b>이며, 모든 통역은 단정이 아닌 <b>가설</b>로 제안됩니다.
        </Card>
        <div style={{ height: 14 }} />
        <Btn onClick={() => { saveConfig({ track, emotionDepth, theologyLevel, pastoralTone }); onDone(); }}>동의하고 시작하기</Btn>
      </>)}
    </Shell>
  );
}

// ── 홈 ──────────────────────────────────────────────────────────────────────
function Home({ config, onMode, onCommunity, onMemory, onSettings }) {
  return (
    <Shell right={<button onClick={onSettings} style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>설정</button>}>
      <div style={{ fontSize: 15, color: MUT, marginBottom: 4 }}>
        {config.track === 'christian' ? '✝️ 기독교 트랙' : '🌱 심리상담 트랙'}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>무엇을 통역해 드릴까요?</div>
      {MODES.map(m => (
        <div key={m.key} onClick={() => onMode(m)} style={{ cursor: 'pointer', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, background: '#fff' }}>
          <div style={{ fontSize: 30 }}>{m.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{m.title}</div>
            <div style={{ color: MUT, fontSize: 13, marginTop: 2 }}>{m.desc}</div>
          </div>
          <div style={{ color: MUT, fontSize: 20 }}>›</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="ghost" onClick={onMemory}>🧠 관계 기억</Btn>
        <Btn kind="ghost" onClick={onCommunity}>💬 커뮤니티</Btn>
      </div>
    </Shell>
  );
}

// ── 통역 결과 렌더 ─────────────────────────────────────────────────────────────
function ResultBlock({ result }) {
  const entries = Object.keys(result).filter(k => k !== 'improvement');
  const renderVal = (v) => {
    if (v && typeof v === 'object') {
      // mediate: person_a/person_b {said, underneath}
      return (
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>
          {v.said && <div><b>말한 것</b> · {v.said}</div>}
          {v.underneath && <div style={{ color: MUT, marginTop: 3 }}><b>그 아래</b> · {v.underneath}</div>}
        </div>
      );
    }
    return <div style={{ fontSize: 14.5, lineHeight: 1.75 }}>{v}</div>;
  };
  return (
    <div>
      {entries.map(k => (
        <Card key={k} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 }}>
            {FIELD[k] || (k === 'person_a' ? '한 사람' : k === 'person_b' ? '다른 사람' : k)}
          </div>
          {renderVal(result[k])}
        </Card>
      ))}
    </div>
  );
}

// ── 개선 활동 + 피드백 ──────────────────────────────────────────────────────────
function Improvement({ imp, relationId, track }) {
  const [sent, setSent] = useState(false);
  const [reframe, setReframe] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!imp) return null;

  const send = async (status, reaction) => {
    if (busy) return; setBusy(true);
    const r = await api('/feedback', 'POST', { relationId, track, feedback: { activity: imp.action, status, reaction } });
    setBusy(false); setSent(true);
    if (r.ok && r.result) setReframe(r.result);
  };

  return (
    <Card style={{ background: '#f4faf6', border: `1.5px solid ${GREEN2}`, marginTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>🌱 오늘 해볼 작은 행동</div>
      <div style={{ fontSize: 16, fontWeight: 700, margin: '8px 0' }}>{imp.action}</div>
      {imp.why_this && <div style={{ fontSize: 13, color: MUT, lineHeight: 1.6 }}>{imp.why_this}</div>}
      {imp.expect && <div style={{ fontSize: 12.5, color: '#8a7a3a', marginTop: 8, background: '#fef9ec', borderRadius: 8, padding: '8px 10px' }}>💡 {imp.expect}</div>}
      {imp.checkin && <div style={{ fontSize: 12.5, color: MUT, marginTop: 8 }}>확인 질문 · {imp.checkin}</div>}

      {!sent ? (
        <div style={{ marginTop: 14, borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>해보셨나요?</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <Btn kind="ghost" onClick={() => send('done')} disabled={busy} style={{ fontSize: 13, padding: 10 }}>해봤어요</Btn>
            <Btn kind="ghost" onClick={() => send('partial')} disabled={busy} style={{ fontSize: 13, padding: 10 }}>하다 말았어요</Btn>
            <Btn kind="ghost" onClick={() => send('not_done')} disabled={busy} style={{ fontSize: 13, padding: 10 }}>못 했어요</Btn>
          </div>
          <div style={{ fontSize: 12, color: MUT, marginBottom: 6 }}>상대 반응 (선택)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {REACTIONS.map(r => (
              <button key={r.key} onClick={() => send('done', r.key)} disabled={busy}
                style={{ border: `1px solid ${LINE}`, background: '#fff', borderRadius: 20, padding: '7px 12px', fontSize: 12.5, cursor: 'pointer' }}>{r.label}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
          {reframe ? (
            <div style={{ fontSize: 14, lineHeight: 1.75 }}>
              <div>{reframe.response}</div>
              {reframe.reframe && <div style={{ color: MUT, marginTop: 8 }}>{reframe.reframe}</div>}
              {reframe.next_suggestion && <div style={{ marginTop: 8, color: GREEN }}>다음엔 · {reframe.next_suggestion}</div>}
            </div>
          ) : <div style={{ fontSize: 14, color: MUT }}>기록했어요. 씨앗은 심겼어요 🌱</div>}
        </div>
      )}
    </Card>
  );
}

// ── 모드 화면 ─────────────────────────────────────────────────────────────────
function ModeView({ mode, config, relationId, onBack }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!input.trim() || busy) return;
    setBusy(true); setErr(''); setResult(null);
    const r = await api('/translate', 'POST', {
      relationId, track: config.track, mode: mode.key, input: input.trim(),
      emotionDepth: config.emotionDepth, theologyLevel: config.theologyLevel, pastoralTone: config.pastoralTone,
    });
    setBusy(false);
    if (r.status === 402) { setErr('크레딧이 부족해요. 마음풀에서 구매 후 이용해 주세요.'); return; }
    if (!r.ok || !r.result) { setErr(r.error || '통역에 실패했어요. 다시 시도해 주세요.'); return; }
    setResult(r.result);
  };

  return (
    <Shell title={`${mode.emoji} ${mode.title}`} onBack={onBack}>
      {!result && (<>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 10 }}>{mode.placeholder}</div>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="여기에 입력하세요"
          style={{ width: '100%', minHeight: 140, border: `1.5px solid ${LINE}`, borderRadius: 13, padding: 14, fontSize: 15, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
        {err && <div style={{ color: '#c0392b', fontSize: 13, margin: '8px 0' }}>{err}</div>}
        <div style={{ height: 10 }} />
        <Btn onClick={run} disabled={busy || !input.trim()}>{busy ? '통역 중…' : '통역하기'}</Btn>
        <div style={{ fontSize: 12, color: MUT, textAlign: 'center', marginTop: 8 }}>
          {mode.key === 'mediate' || mode.key === 'perspective' ? '3 크레딧' : '2 크레딧'} 사용
        </div>
      </>)}
      {result && (<>
        <ResultBlock result={result} />
        <Improvement imp={result.improvement} relationId={relationId} track={config.track} />
        <div style={{ height: 12 }} />
        <Btn kind="ghost" onClick={() => { setResult(null); setInput(''); }}>다시 통역하기</Btn>
      </>)}
    </Shell>
  );
}

// ── 커뮤니티 ─────────────────────────────────────────────────────────────────
function Community({ onBack }) {
  const [room, setRoom] = useState('couple');
  const [posts, setPosts] = useState(null);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [writing, setWriting] = useState(false);

  const load = async (rm) => { setPosts(null); const r = await api(`/community/posts?room=${rm}&limit=30`); setPosts(r.ok ? (r.posts || []) : []); };
  useEffect(() => { load(room); }, [room]);

  const submit = async () => {
    if (!content.trim() || busy) return; setBusy(true); setBlocked(null);
    const r = await api('/community/post', 'POST', { room, content: content.trim() });
    setBusy(false);
    if (r.ok) { setContent(''); setWriting(false); load(room); return; }
    if (r.blocked) { setBlocked(r); return; }
  };

  return (
    <Shell title="💬 커뮤니티" onBack={onBack} right={<button onClick={() => setWriting(w => !w)} style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>{writing ? '닫기' : '글쓰기'}</button>}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {ROOMS.map(r => (
          <button key={r.key} onClick={() => setRoom(r.key)} style={{ border: `1px solid ${room === r.key ? GREEN : LINE}`, background: room === r.key ? LGREEN : '#fff', color: room === r.key ? GREEN : MUT, borderRadius: 20, padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{r.label}</button>
        ))}
      </div>

      {writing && (
        <Card style={{ marginBottom: 14 }}>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="상황 → 시도한 것 → 결과. 익명으로 공유돼요. (특정인 식별 정보는 빼주세요)"
            style={{ width: '100%', minHeight: 100, border: `1.5px solid ${LINE}`, borderRadius: 11, padding: 12, fontSize: 14, resize: 'vertical', outline: 'none' }} />
          {blocked && (
            <div style={{ marginTop: 10, background: blocked.crisis_support ? '#fff4ee' : '#fef9ec', border: `1px solid ${blocked.crisis_support ? '#f5c6a5' : '#fde68a'}`, borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.7, color: '#78350f' }}>
              {blocked.message}
              {blocked.suggested_fix && <div style={{ marginTop: 6, color: GREEN }}>수정 제안 · {blocked.suggested_fix}</div>}
              {blocked.crisis_support && <div style={{ marginTop: 6 }}>긴급 시 112 · 1366 · 1388</div>}
            </div>
          )}
          <div style={{ height: 10 }} />
          <Btn onClick={submit} disabled={busy || !content.trim()}>{busy ? '검토 중…' : '게시하기'}</Btn>
          <div style={{ fontSize: 11.5, color: MUT, textAlign: 'center', marginTop: 6 }}>게시 전 AI가 먼저 검토해요 (특정인 식별·욕설 등)</div>
        </Card>
      )}

      {posts === null ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>불러오는 중…</div>
        : posts.length === 0 ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>아직 글이 없어요. 첫 이야기를 나눠보세요.</div>
          : posts.map(p => (
            <Card key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{p.content}</div>
              <div style={{ fontSize: 12, color: MUT, marginTop: 8 }}>🤍 {p.empathy_count || 0} · {(p.created_at || '').slice(0, 10)}</div>
            </Card>
          ))}
    </Shell>
  );
}

// ── 관계 기억 ─────────────────────────────────────────────────────────────────
function Memory({ relationId, onBack }) {
  const [mem, setMem] = useState(undefined);
  useEffect(() => { (async () => { const r = await api(`/memory?relationId=${relationId}`); setMem(r.ok ? r.memory : null); })(); }, []);
  const Row = ({ label, children }) => <Card style={{ marginBottom: 10 }}><div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 }}>{label}</div>{children}</Card>;
  return (
    <Shell title="🧠 관계 기억" onBack={onBack}>
      {mem === undefined ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>불러오는 중…</div>
        : !mem ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>아직 쌓인 기억이 없어요.<br />통역을 이어갈수록 이 부부에 맞는 통역이 됩니다.</div>
          : (<>
            {mem.recurringTopics?.length > 0 && <Row label="반복되는 주제"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{mem.recurringTopics.map((t, i) => <span key={i} style={{ background: LGREEN, color: GREEN, borderRadius: 16, padding: '5px 11px', fontSize: 13, fontWeight: 700 }}>{t}</span>)}</div></Row>}
            {mem.successPatterns?.length > 0 && <Row label="이 부부에게 통했던 것">{mem.successPatterns.map((s, i) => <div key={i} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>· {s}</div>)}</Row>}
            {mem.psychologyProfile && <Row label="상호작용 패턴"><div style={{ fontSize: 14, lineHeight: 1.7 }}>{mem.psychologyProfile}</div></Row>}
            {mem.christianProfile && <Row label="마음의 패턴"><div style={{ fontSize: 14, lineHeight: 1.7 }}>{mem.christianProfile}</div></Row>}
            {mem.partnerPerspective && <Row label="배우자의 인식 습관"><div style={{ fontSize: 14, lineHeight: 1.7 }}>{mem.partnerPerspective}</div></Row>}
          </>)}
    </Shell>
  );
}

// ── 앱 라우터 ─────────────────────────────────────────────────────────────────
function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [relationId, setRelationId] = useState(null);
  const [config, setConfig] = useState(loadConfig());
  const [view, setView] = useState('home');   // home | mode | community | memory
  const [mode, setMode] = useState(null);

  useEffect(() => {
    (async () => {
      if (!token()) { setAuthed(false); setReady(true); return; }
      const r = await api('/relation', 'POST', {});
      if (r.status === 401) { setAuthed(false); setReady(true); return; }
      if (r.ok) setRelationId(r.relationId);
      setReady(true);
    })();
  }, []);

  if (!ready) return <Shell><div style={{ textAlign: 'center', color: MUT, padding: 50 }}>불러오는 중…</div></Shell>;

  if (!authed) return (
    <Shell>
      <Card style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 40 }}>💬</div>
        <div style={{ fontSize: 20, fontWeight: 800, margin: '10px 0' }}>마음부부</div>
        <div style={{ color: MUT, fontSize: 14, lineHeight: 1.7 }}>마음풀에 로그인한 뒤,<br />메뉴의 <b>💬 마음부부</b>로 들어와 주세요.</div>
        <div style={{ height: 16 }} />
        <Btn onClick={() => window.open('https://maumful.com', '_blank')}>마음풀로 가기</Btn>
      </Card>
    </Shell>
  );

  if (!config) return <Onboarding onDone={() => setConfig(loadConfig())} />;

  if (view === 'mode' && mode) return <ModeView mode={mode} config={config} relationId={relationId} onBack={() => setView('home')} />;
  if (view === 'community') return <Community onBack={() => setView('home')} />;
  if (view === 'memory') return <Memory relationId={relationId} onBack={() => setView('home')} />;

  return <Home config={config}
    onMode={(m) => { setMode(m); setView('mode'); }}
    onCommunity={() => setView('community')}
    onMemory={() => setView('memory')}
    onSettings={() => { localStorage.removeItem('bubu_config'); setConfig(null); }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
