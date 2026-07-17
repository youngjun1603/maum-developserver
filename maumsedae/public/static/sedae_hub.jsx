// ============================================================================
// 마음세대 (MaumSedae) — 부모-자녀 세대 통역 프론트. 마음부부에서 파생.
// 진입: 마음풀 /api/sedae-token → ?t= → localStorage('sedae_token')
// ⚠️ 부부와 근본 차이: **다중 관계**(아버지·어머니·자녀별 각각) — 모든 화면은 선택된 relation 스코프.
// ⚠️ 청소년(만14~18) 사용자가 핵심 — teen은 커뮤니티·공유·멀티모달 미노출(서버도 403으로 이중 차단).
// ============================================================================
const { useState, useEffect, useRef } = React;

// ── 브랜드 ──────────────────────────────────────────────────────────────────
const GREEN = '#2d6a4f', GREEN2 = '#52b788', LGREEN = '#d8f3dc', BG = '#eef6f1';
const INK = '#1a2b22', MUT = '#5a6b62', LINE = '#dbe7e0';
const ACCENT = { psychology: '#2d6a4f', christian: '#3b6fb5' };

// ── API ─────────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('sedae_token') || '';
async function api(path, method, body) {
  const opt = { method: method || 'GET', headers: { Authorization: 'Bearer ' + token() } };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch('/api' + path, opt);
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, ...data };
}

// ── 설정(온보딩) 저장 ─────────────────────────────────────────────────────────
const loadConfig = () => { try { return JSON.parse(localStorage.getItem('sedae_config') || 'null'); } catch { return null; } };
const saveConfig = (c) => localStorage.setItem('sedae_config', JSON.stringify(c));

// ── 4모드 ──────────────────────────────────────────────────────────────────
const MODES = [
  { key: 'receive', emoji: '👂', title: '수신 통역', desc: '"저 말이 무슨 뜻이야?"', ex: '그 말의 속뜻이 궁금할 때', placeholder: '들은 말을 그대로 붙여넣어 보세요.' },
  { key: 'send', emoji: '✍️', title: '발신 통역', desc: '"이걸 어떻게 말하지?"', ex: '부딪히지 않게 말하고 싶을 때', placeholder: '하고 싶은 말을 적어 보세요.' },
  { key: 'mediate', emoji: '🕊️', title: '중재 통역', desc: '부딪힌 대화 전체를 분석', ex: '다툰 대화를 통째로 짚어보고 싶을 때', placeholder: '주고받은 대화(카톡 등)를 통째로 붙여넣어 보세요.' },
  { key: 'perspective', emoji: '🔄', title: '관점 통역', desc: '"상대는 어떻게 느꼈을까?"', ex: '상대 입장이 도무지 이해 안 될 때', placeholder: '어떤 사건이나 대화를 적어 보세요. 상대 입장에서 통역해 드려요.' },
];

// ── 통역 결과 필드 라벨 (모드 공통 렌더) ─────────────────────────────────────────
const FIELD = {
  surface: '표면적으로는', translation: '그 아래 마음 (가설)', hidden_need: '숨어 있을 수 있는 요청',
  check_question: '이렇게 물어보면 어떨까요', micro_action: '오늘 해볼 작은 행동', caution: '이 통역의 한계',
  original_intent: '진짜 전하고 싶은 마음', risk_in_original: '원래 표현이 들릴 수 있는 방식',
  rewritten: '이렇게 말해보세요', alternative: '다른 톤 버전', timing_tip: '타이밍', avoid: '피할 표현',
  miss_point: '서로 놓친 결정적 지점', cycle: '반복되는 패턴', next_word: '먼저 건넬 한마디',
  your_feeling_first: '먼저, 당신의 마음', partner_view: '상대의 눈에는', partner_feeling: '그때 상대의 감정',
  blind_spot: '놓쳤을 수 있는 것', bridge: '두 관점을 잇는 다리',
};
const REACTIONS = [
  { key: 'positive', label: '좋았어요 😊' }, { key: 'awkward', label: '어색했어요 😅' },
  { key: 'cold', label: '냉담했어요 😐' }, { key: 'conflict', label: '오히려 싸웠어요 😞' },
];
// 커뮤니티 방 (DEV_01 §3) — 성인 전용. 청소년 방은 1차 출시 제외(그루밍 등 접촉 위험).
const ROOMS = [
  { key: 'teen_parent', label: '사춘기 자녀' }, { key: 'retire_dad', label: '은퇴한 아버지' },
  { key: 'holiday', label: '명절' }, { key: 'caregiving', label: '간병' }, { key: 'kangaroo', label: '한집살이' },
];

// ── 온디바이스 표정 분석 (마음수달 방식: face-api.js CDN 지연로드, 원본 미저장·미전송) ──
const EXPR_LABEL = { happy: '웃음', neutral: '무표정', sad: '시무룩·슬픔', angry: '화남·찡그림', surprised: '놀람', fearful: '긴장·불안', disgusted: '불쾌' };
let _faceApi = null;
function loadFaceApi() {
  if (_faceApi) return _faceApi;
  _faceApi = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    s.onload = async () => {
      try {
        const M = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(M);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(M);
        resolve(window.faceapi);
      } catch (e) { reject(e); }
    };
    s.onerror = reject; document.head.appendChild(s);
  });
  return _faceApi;
}
// 표정 카운트 → 요약 텍스트(비언어 visualCues)
function exprSummary(counts) {
  const ent = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ent.length) return '';
  return '표정은 주로 ' + ent.slice(0, 2).map(([k]) => EXPR_LABEL[k] || k).join(', ') + '으로 나타났어요';
}
// 어조 요약(Web Audio 온디바이스 — 음량 평균/피크). 원본 오디오 미저장·미전송
function toneSummary(vol) {
  if (!vol.n) return '';
  const avg = vol.sum / vol.n;
  const level = avg > 0.14 ? '전반적으로 큰 편' : avg > 0.06 ? '보통' : '차분한 편';
  const spikes = vol.spikes > 2 ? `, 목소리가 크게 높아진 순간이 ${vol.spikes}회` : '';
  return `말할 때 음량은 ${level}${spikes}이었어요`;
}

// ── 공통 UI ──────────────────────────────────────────────────────────────────
function Shell({ children, title, onBack, right }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', minHeight: '100vh', background: '#fff', boxShadow: '0 0 40px rgba(0,0,0,.04)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: GREEN, color: '#fff', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', fontSize: 16 }}>‹</button>}
        <div style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>{title || '🌿 마음세대'}</div>
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

  const TrackCard = ({ v, title, desc, tag }) => (
    <div onClick={() => setTrack(v)} style={{ cursor: 'pointer', border: `2px solid ${track === v ? ACCENT[v] : LINE}`, background: track === v ? '#f4faf6' : '#fff', borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ fontWeight: 800, color: track === v ? ACCENT[v] : INK, fontSize: 16 }}>{title}</div>
        {tag && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: GREEN2, borderRadius: 10, padding: '2px 8px' }}>{tag}</span>}
      </div>
      <div style={{ color: MUT, fontSize: 13, marginTop: 5, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
  const Slider = ({ label, help, val, set, marks, descs, hint }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
      {help && <div style={{ fontSize: 12.5, color: MUT, margin: '3px 0 8px' }}>{help}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {marks.map((m, i) => (
          <div key={i} onClick={() => set(i + 1)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${val === i + 1 ? GREEN : LINE}`, background: val === i + 1 ? LGREEN : '#fff', color: val === i + 1 ? GREEN : MUT }}>{m}</div>
        ))}
      </div>
      {descs && <div style={{ fontSize: 12.5, color: INK, marginTop: 8, lineHeight: 1.6, background: '#f6faf8', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 11px' }}>{descs[val - 1]}</div>}
      {hint && <div style={{ fontSize: 12, color: GREEN, marginTop: 6 }}>💡 {hint}</div>}
    </div>
  );

  return (
    <Shell title="시작하기">
      {step === 0 && (<>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>어떤 언어로 통역할까요?</div>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 16 }}>나에게 맞는 경로를 고르세요. 설정에서 언제든 바꿀 수 있어요.</div>
        <TrackCard v="psychology" title="🌱 심리상담 트랙" tag="처음이라면 추천" desc="신앙과 무관하게, 검증된 심리학(애착·정서)으로 마음을 풀어드려요." />
        <TrackCard v="christian" title="✝️ 기독교 트랙" desc="신앙 안에서, 성경적 관점(공경과 분리·회복)으로 통역해요. 신앙을 가진 가족에게 맞아요." />
        <div style={{ height: 12 }} />
        <Btn onClick={() => setStep(1)}>다음</Btn>
      </>)}
      {step === 1 && (<>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>강도를 맞춰볼까요?</div>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 16 }}>편한 만큼만. 언제든 조절돼요.</div>
        {track === 'psychology'
          ? <Slider label="감정 깊이" help="마음을 얼마나 깊이 들여다볼까요?" val={emotionDepth} set={setEmotionDepth}
              marks={['표면', '중간', '심층']}
              descs={['화남·서운함처럼 겉으로 드러난 감정까지만 짚어요.', '그 아래 두려움·외로움 같은 진짜 감정까지 통역해요.', '애착 욕구와 두 사람의 반복되는 악순환 고리까지 깊이 봐요.']}
              hint="잘 모르겠으면 '중간'을 추천해요." />
          : (<>
            <Slider label="신학 강도" help="심리학 언어를 얼마나 섞을까요?" val={theologyLevel} set={setTheologyLevel}
              marks={['통합형', '균형형', '성경형']}
              descs={['심리 언어(감정·애착)와 성경 관점을 자연스럽게 함께 써요.', '성경 관점을 중심에 두고, 감정 설명은 심리 언어를 보조로 써요.', '성경 언어(마음·언약·은혜·회개)로만 통역해요.']}
              hint="잘 모르겠으면 '통합형'을 추천해요." />
            <div style={{ fontSize: 14, fontWeight: 700 }}>목양 톤</div>
            <div style={{ fontSize: 12.5, color: MUT, margin: '3px 0 8px' }}>어떤 결로 말해드릴까요?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['grace', '경청·은혜형'], ['direct', '제한적 직면형']].map(([k, l]) => (
                <div key={k} onClick={() => setPastoralTone(k)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${pastoralTone === k ? GREEN : LINE}`, background: pastoralTone === k ? LGREEN : '#fff', color: pastoralTone === k ? GREEN : MUT }}>{l}</div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: INK, marginTop: 8, lineHeight: 1.6, background: '#f6faf8', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 11px' }}>
              {pastoralTone === 'grace' ? '먼저 충분히 듣고 이해한 뒤, 은혜 안에서 부드럽게 짚어드려요.' : '더 직접적인 권면을 원할 때만. 그래도 자책·수치를 강화하진 않아요.'}
            </div>
            <div style={{ fontSize: 12, color: GREEN, marginTop: 6 }}>💡 대부분 '경청·은혜형'을 추천해요.</div>
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
          긴급 시 <b>112</b> · 여성긴급전화 <b>1366</b> · 청소년 <b>1388</b> · 노인보호 <b>1577-1389</b> · 자살예방 상담 <b>109</b>(24시간).<br />
          마음세대는 의료·상담을 대체하지 않는 <b>통역 도구</b>이며, 모든 통역은 단정이 아닌 <b>가설</b>로 제안됩니다.
        </Card>
        <div style={{ height: 14 }} />
        <Btn onClick={() => { saveConfig({ track, emotionDepth, theologyLevel, pastoralTone }); onDone(); }}>동의하고 시작하기</Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" onClick={() => setStep(1)}>‹ 이전</Btn>
      </>)}
    </Shell>
  );
}

// ── 홈 ──────────────────────────────────────────────────────────────────────
function Home({ config, ageTier, relationId, picker, onMode, onMemory, onSettings }) {
  const [ask, setAsk] = useState(false);
  const depthLabel = ['표면', '중간', '심층'][(config.emotionDepth || 2) - 1];
  const theoLabel = ['통합형', '균형형', '성경형'][(config.theologyLevel || 2) - 1];
  const toneLabel = config.pastoralTone === 'direct' ? '제한적 직면형' : '경청·은혜형';
  return (
    <Shell right={<button onClick={() => setAsk(true)} style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>⚙️ 설정</button>}>
      {picker}
      <div style={{ fontSize: 15, color: MUT, marginBottom: 4 }}>
        {config.track === 'christian' ? '✝️ 기독교 트랙' : '🌱 심리상담 트랙'}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
        {ageTier === 'teen' ? '무슨 일이 있었어?' : '무엇을 통역해 드릴까요?'}
      </div>
      <div style={{ color: MUT, fontSize: 13, marginBottom: 16 }}>
        {ageTier === 'teen'
          ? '무슨 말을 들었는지 그대로 적어도 괜찮아. 네 잘못인지 아닌지부터 같이 봐줄게.'
          : '상황에 맞는 걸 고르세요. 아래 "이럴 때"를 참고하면 쉬워요.'}
      </div>
      {!relationId && (
        <Card style={{ background: '#f6faf8', marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, color: MUT, lineHeight: 1.7 }}>
            먼저 <b style={{ color: INK }}>누구와의 대화인지</b> 위에서 <b style={{ color: INK }}>+ 추가</b>로 만들어 주세요.
            아버지·어머니는 각각 다른 관계로 나눠서 기억해요.
          </div>
        </Card>
      )}
      {MODES.map(m => (
        <div key={m.key} onClick={() => relationId && onMode(m)} style={{ opacity: relationId ? 1 : .45, cursor: relationId ? 'pointer' : 'not-allowed', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, background: '#fff' }}>
          <div style={{ fontSize: 30 }}>{m.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{m.title}</div>
            <div style={{ color: MUT, fontSize: 13, marginTop: 2 }}>{m.desc}</div>
            <div style={{ color: GREEN, fontSize: 12, marginTop: 4 }}>이럴 때 · {m.ex}</div>
          </div>
          <div style={{ color: MUT, fontSize: 20 }}>›</div>
        </div>
      ))}
      {/* ⚠️ 멀티모달·수신함·커뮤니티 진입점은 노출하지 않는다.
           - 멀티모달: SPEC 6장 — 코드 동의 게이트가 노부모에게 비현실적이라 재설계 전까지 제외(서버 403).
           - 커뮤니티·공유: 3단계-f 예정(테이블 미생성, 서버 503).
           - 청소년: 위 전부가 코드 레벨로 금지(서버가 teenBlocked 403).
           구현할 때 이 주석과 함께 되살릴 것. */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Btn kind="ghost" onClick={onMemory} disabled={!relationId}>🧠 이 관계의 기억</Btn>
      </div>

      {ask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setAsk(false); }}>
          <div style={{ background: '#fff', borderRadius: 18, maxWidth: 400, width: '100%', padding: 22, animation: 'fadeUp .2s ease' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>⚙️ 통역 설정이란?</div>
            <div style={{ fontSize: 14, color: MUT, lineHeight: 1.75, marginBottom: 14 }}>
              통역에 쓰는 <b style={{ color: INK }}>트랙(심리상담/기독교)과 강도</b> 설정이에요. 지금 대화를 <b style={{ color: INK }}>어떤 언어와 깊이</b>로 통역할지 정합니다.
            </div>
            <Card style={{ background: '#f6faf8', marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 }}>지금 내 설정</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.9 }}>
                <div>· 트랙: <b>{config.track === 'christian' ? '✝️ 기독교' : '🌱 심리상담'}</b></div>
                {config.track === 'christian'
                  ? (<><div>· 신학 강도: <b>{theoLabel}</b></div><div>· 목양 톤: <b>{toneLabel}</b></div></>)
                  : (<div>· 감정 깊이: <b>{depthLabel}</b></div>)}
              </div>
            </Card>
            <div style={{ fontSize: 13.5, color: INK, marginBottom: 14, lineHeight: 1.7 }}>
              이 설정을 <b>다시 변경</b>할까요?<br />
              <span style={{ color: MUT, fontSize: 12.5 }}>지금까지의 관계 기억·기록은 그대로 유지돼요.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="ghost" onClick={() => setAsk(false)}>취소</Btn>
              <Btn onClick={() => { setAsk(false); onSettings(); }}>설정 변경하기</Btn>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ── 선택적 공유 (미리보기 확인 후 건별 전송, ADDENDUM 1) ──
function Share({ relationId, itemType, payload, preview, label }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const send = async () => {
    setBusy(true);
    const r = await api('/share/send', 'POST', { relationId, itemType, payload });
    setBusy(false); setOpen(false);
    if (r.ok) setDone(r.linked ? '배우자에게 보냈어요 ✓' : '보냈어요. 배우자가 아직 연결 전이면 수신함에서 "배우자 연결"로 초대하세요.');
    else if (r.status === 403) setDone('지금은 안전을 위해 공유가 제한돼요.');
    else setDone(r.error || '공유에 실패했어요.');
  };
  return (<>
    <Btn kind="ghost" onClick={() => setOpen(true)} style={{ fontSize: 13, padding: 11, marginTop: 8 }}>{label}</Btn>
    {done && <div style={{ fontSize: 12.5, color: GREEN, marginTop: 6, lineHeight: 1.6 }}>{done}</div>}
    {open && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div style={{ background: '#fff', borderRadius: 16, maxWidth: 400, width: '100%', padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>배우자에게 이렇게 보여요</div>
          <Card style={{ background: '#f6faf8', fontSize: 14, lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-wrap' }}>{preview}</Card>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="ghost" onClick={() => setOpen(false)}>취소</Btn>
            <Btn onClick={send} disabled={busy}>{busy ? '보내는 중…' : '보내기'}</Btn>
          </div>
        </div>
      </div>
    )}
  </>);
}

// ── 안전 안내 화면 (T1/T2 발동 시 — 모드 결과 대신, 공유·활동·커뮤니티 버튼 미노출) ──
function SafetyScreen({ s }) {
  return (
    <Card style={{ background: '#fff4ee', border: '1px solid #f5c6a5' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#b45309', marginBottom: 8 }}>🛟 지금은 안전이 먼저예요</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.8, color: '#78350f' }}>{s.response}</div>
      {s.reframe && <div style={{ fontSize: 14, lineHeight: 1.7, color: '#78350f', marginTop: 10 }}>{s.reframe}</div>}
      {s.protect_actions && s.protect_actions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#b45309', marginBottom: 6 }}>지금 할 수 있는 것</div>
          {s.protect_actions.map((a, i) => <div key={i} style={{ fontSize: 14, lineHeight: 1.7 }}>· {a}</div>)}
        </div>
      )}
      {s.resources && s.resources.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {s.resources.map((r, i) => {
            const num = (String(r).match(/1577-1389|1\d{3}|1\d{2}/) || [])[0];
            return <a key={i} href={num ? 'tel:' + num.replace(/-/g, '') : undefined} style={{ textDecoration: 'none', background: '#fff', border: '1px solid #f5c6a5', color: '#b45309', borderRadius: 20, padding: '8px 13px', fontSize: 13, fontWeight: 700 }}>📞 {r}</a>;
          })}
        </div>
      )}
      {s.door_open && <div style={{ fontSize: 13.5, color: MUT, marginTop: 14, lineHeight: 1.7 }}>{s.door_open}</div>}
    </Card>
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
      {/* ⚠️ 공유(Share)는 3단계-f 예정 — 서버 503. 되살릴 때 청소년은 반드시 미노출
           (teen은 공유 발신이 코드 레벨 금지: 부모에게 통역 결과가 가는 경로 차단). */}
    </Card>
  );
}

// ── 모드 화면 ─────────────────────────────────────────────────────────────────
function ModeView({ mode, config, relationId, ageTier, onBack }) {
  const [input, setInput] = useState('');
  // 입력 출처 (DEV_01 §2.3) — 부모 사용자만. 'observed'(아이 카톡·일기를 본 것)는
  // 통역 대신 신뢰 경계 안내가 먼저 나온다. 청소년에겐 이 선택 자체가 없다.
  const [src, setSrc] = useState('direct');
  const [boundary, setBoundary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const run = async (ack) => {
    if (!input.trim() || busy) return;
    setBoundary(null);
    setBusy(true); setErr(''); setResult(null);
    const r = await api('/translate', 'POST', {
      relationId, track: config.track, mode: mode.key, input: input.trim(),
      emotionDepth: config.emotionDepth, theologyLevel: config.theologyLevel, pastoralTone: config.pastoralTone,
      inputSource: src, acknowledgeBoundary: ack,
    });
    setBusy(false);
    if (r.status === 402) { setErr('크레딧이 부족해요. 마음풀에서 구매 후 이용해 주세요.'); return; }
    if (r.status === 429) { setErr(r.error || '오늘은 여기까지 이야기 나눴어요. 내일 다시 만나요.'); return; }
    if (r.boundaryNotice) { setBoundary(r.result); return; }
    if (!r.ok || !r.result) { setErr(r.error || '통역에 실패했어요. 다시 시도해 주세요.'); return; }
    setResult(r.result);
  };

  return (
    <Shell title={`${mode.emoji} ${mode.title}`} onBack={onBack}>
      {!result && (<>
        <div style={{ color: MUT, fontSize: 14, marginBottom: 10 }}>{mode.placeholder}</div>

        {/* 입력 출처 — 부모 사용자만(DEV_01 §2.3). 청소년에겐 이 선택 자체를 보여주지 않는다. */}
        {ageTier !== 'teen' && (mode.key === 'receive' || mode.key === 'perspective') && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: MUT, marginBottom: 5 }}>이 말을 어떻게 알게 되셨나요?</div>
            <div style={{ display: 'flex', gap: 7 }}>
              {[['direct', '저에게 직접 한 말'], ['observed', '카톡·일기 등을 봤어요']].map(([k, t]) => (
                <div key={k} onClick={() => { setSrc(k); setBoundary(null); }}
                  style={{ padding: '7px 12px', borderRadius: 100, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: '1px solid ' + (src === k ? GREEN : LINE), background: src === k ? GREEN : '#fff', color: src === k ? '#fff' : INK,
                    fontWeight: src === k ? 800 : 500 }}>{t}</div>
              ))}
            </div>
          </div>
        )}

        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="여기에 입력하세요"
          style={{ width: '100%', minHeight: 140, border: `1.5px solid ${LINE}`, borderRadius: 13, padding: 14, fontSize: 15, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
        {err && <div style={{ color: '#c0392b', fontSize: 13, margin: '8px 0' }}>{err}</div>}

        {/* 신뢰 경계 안내 — 통역보다 먼저. 다만 자해·위험 신호가 걱정이면 계속 진행할 수 있게 문을 열어둔다. */}
        {boundary && (
          <Card style={{ background: '#fff9ec', border: '1px solid #fde68a', marginTop: 10 }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.8, color: '#78350f' }}>{boundary.message}</div>
            {boundary.safety_note && <div style={{ fontSize: 13, lineHeight: 1.7, color: MUT, marginTop: 10 }}>{boundary.safety_note}</div>}
            <div style={{ height: 12 }} />
            <Btn kind="ghost" onClick={() => run(true)} disabled={busy}>그래도 통역해 주세요</Btn>
          </Card>
        )}

        <div style={{ height: 10 }} />
        {!boundary && <Btn onClick={() => run(false)} disabled={busy || !input.trim()}>{busy ? '통역 중…' : '통역하기'}</Btn>}
        {ageTier !== 'teen' && (
          <div style={{ fontSize: 12, color: MUT, textAlign: 'center', marginTop: 8 }}>
            {mode.key === 'mediate' || mode.key === 'perspective' ? '3 크레딧' : '2 크레딧'} 사용
          </div>
        )}
        {ageTier === 'teen' && (
          <div style={{ fontSize: 12, color: MUT, textAlign: 'center', marginTop: 8 }}>무료로 쓸 수 있어 · 하루 10번까지</div>
        )}
      </>)}
      {result && (<>
        {result.safety_tier
          ? <SafetyScreen s={result} />
          : (<>
            <ResultBlock result={result} />
            <Improvement imp={result.improvement} relationId={relationId} track={config.track} />
          </>)}
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
              {blocked.crisis_support && <div style={{ marginTop: 6 }}>자살예방 상담전화 <a href="tel:109" style={{ color: '#b45309', fontWeight: 700 }}>109</a>(24시간) · 긴급 시 112 · 1366 · 1388</div>}
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
            {mem.partnerPerspective && <Row label="상대의 인식 습관"><div style={{ fontSize: 14, lineHeight: 1.7 }}>{mem.partnerPerspective}</div></Row>}
          </>)}
    </Shell>
  );
}

// ── 멀티모달: 쌍방 동의 → 온디바이스 녹화 분석(마음수달 방식) → 통역 ──
function Multimodal({ relationId, config, onBack }) {
  const [phase, setPhase] = useState('intro'); // intro|request|accept|accepted|capturing|result
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [signals, setSignals] = useState(null);
  const [inputText, setInputText] = useState('');
  const [trResult, setTrResult] = useState(null);
  const [useCamera, setUseCamera] = useState(true); // true=녹화(영상+표정+어조) · false=녹음(음성만+어조)
  const videoRef = useRef(null), streamRef = useRef(null), detRef = useRef(null), exprRef = useRef({});
  const audioCtxRef = useRef(null), volRef = useRef({ sum: 0, n: 0, spikes: 0 }), rafRef = useRef(null);

  const request = async () => {
    setBusy(true); setMsg('');
    const r = await api('/consent/request', 'POST', { relationId, mediaType: useCamera ? 'video' : 'audio' });
    setBusy(false);
    if (r.ok && r.consentCode) { setCode(r.consentCode); setPhase('request'); } else setMsg(r.error || '요청에 실패했어요.');
  };
  const accept = async () => {
    if (!agreed || !inputCode.trim()) return; setBusy(true); setMsg('');
    const r = await api('/consent/accept', 'POST', { consentCode: inputCode.trim().toUpperCase(), agreed: true });
    setBusy(false);
    if (r.ok) { setPhase('accepted'); } else setMsg(r.error || '동의에 실패했어요 (코드 확인 · 요청자 본인은 동의 불가).');
  };
  const cleanup = () => {
    try { detRef.current && clearInterval(detRef.current); } catch {}
    try { rafRef.current && cancelAnimationFrame(rafRef.current); } catch {}
    try { audioCtxRef.current && audioCtxRef.current.close(); } catch {}
    try { streamRef.current && streamRef.current.getTracks().forEach(t => t.stop()); } catch {} // 원본 폐기
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);

  const startCapture = async () => {
    setBusy(true); setMsg('');
    try {
      // 녹음 모드(useCamera=false)면 카메라를 켜지 않고 마이크만. 녹화 모드면 영상+마이크.
      const stream = await navigator.mediaDevices.getUserMedia({ video: useCamera ? { facingMode: 'user' } : false, audio: true });
      streamRef.current = stream;
      exprRef.current = {}; volRef.current = { sum: 0, n: 0, spikes: 0 };
      // 표정 분석용 face-api는 카메라 모드에서만 미리 로드(원본 순서 유지: 로드 후 화면 전환)
      const fa = useCamera ? await loadFaceApi() : null;
      setPhase('capturing'); setBusy(false);
      if (useCamera) {
        setTimeout(() => { const v = videoRef.current; if (v) { v.srcObject = stream; v.muted = true; v.playsInline = true; v.play().catch(() => {}); } }, 100);
        detRef.current = setInterval(async () => {
          const v = videoRef.current; if (!v || v.readyState < 2) return;
          try {
            const res = await fa.detectSingleFace(v, new fa.TinyFaceDetectorOptions()).withFaceExpressions();
            if (res && res.expressions) { let top = '', mx = 0; for (const k in res.expressions) { if (res.expressions[k] > mx) { mx = res.expressions[k]; top = k; } } if (top && mx > 0.55) exprRef.current[top] = (exprRef.current[top] || 0) + 1; }
          } catch {}
        }, 1500);
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)(); audioCtxRef.current = ctx;
      const an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const tick = () => {
        an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
        const rms = Math.sqrt(sum / buf.length); volRef.current.sum += rms; volRef.current.n++; if (rms > 0.25) volRef.current.spikes++;
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { setBusy(false); setMsg('카메라·마이크를 시작할 수 없어요. 권한을 확인해 주세요.'); }
  };
  const stopCapture = () => {
    cleanup();
    setSignals({ visualCues: exprSummary(exprRef.current), toneAnalysis: toneSummary(volRef.current) });
    setPhase('result');
  };
  const revoke = async (sid) => { try { await api('/consent/revoke', 'POST', { consentSessionId: sid }); } catch {} };

  const translate = async () => {
    setBusy(true); setMsg('');
    const r = await api('/translate', 'POST', {
      relationId, track: config.track, mode: 'mediate', input: inputText.trim() || '방금 나눈 대화',
      emotionDepth: config.emotionDepth, theologyLevel: config.theologyLevel, pastoralTone: config.pastoralTone,
      multimodal: { consentSessionId: code, toneAnalysis: signals.toneAnalysis, visualCues: signals.visualCues },
    });
    setBusy(false);
    if (r.status === 403) { setMsg('배우자 동의가 아직 확인되지 않았어요. 배우자가 코드로 동의했는지 확인해 주세요.'); return; }
    if (r.status === 402) { setMsg('크레딧이 부족해요. 마음풀에서 구매 후 이용해 주세요.'); return; }
    if (r.ok && r.result) setTrResult(r.result); else setMsg(r.error || '통역에 실패했어요.');
  };

  return (
    <Shell title="🎥 함께 분석" onBack={() => { cleanup(); onBack(); }}>
      {phase === 'intro' && (<>
        <Card style={{ background: '#fef9ec', border: '1px solid #fde68a', color: '#78350f', fontSize: 13.5, lineHeight: 1.8, marginBottom: 14 }}>
          <b>쌍방 동의가 있어야만</b> 분석이 시작돼요. 원본 영상·음성은 <b>기기 밖으로 나가지 않고</b>, 분석(표정·어조 요약)이 끝나면 <b>삭제</b>돼요. 언제든 철회할 수 있어요.
        </Card>
        {/* 녹화(영상+표정+어조) ↔ 녹음(음성만+어조) 선택 */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>분석 방식을 선택하세요</div>
          {[
            { on: true, emoji: '🎥', label: '녹화 (영상)', desc: '표정 + 어조를 함께 분석' },
            { on: false, emoji: '🎙️', label: '녹음 (음성만)', desc: '카메라 없이 어조만 분석 — 부담이 덜해요' },
          ].map(opt => (
            <div key={String(opt.on)} onClick={() => setUseCamera(opt.on)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${useCamera === opt.on ? GREEN : LINE}`, background: useCamera === opt.on ? '#f6faf8' : '#fff' }}>
              <span style={{ fontSize: 22 }}>{opt.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{opt.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: MUT, marginTop: 2 }}>{opt.desc}</span>
              </span>
              <span style={{ color: useCamera === opt.on ? GREEN : LINE, fontWeight: 800 }}>{useCamera === opt.on ? '●' : '○'}</span>
            </div>
          ))}
        </Card>
        <Btn onClick={request} disabled={busy}>내가 {useCamera ? '녹화' : '녹음'} 분석을 요청할게요 (코드 발급)</Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" onClick={() => setPhase('accept')}>배우자에게 받은 코드로 동의하기</Btn>
        {msg && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{msg}</div>}
      </>)}

      {phase === 'request' && (<>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>배우자에게 이 코드를 전달하세요</div>
        <Card style={{ textAlign: 'center', marginBottom: 12 }}><div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: GREEN }}>{code}</div></Card>
        <div style={{ fontSize: 13.5, color: MUT, lineHeight: 1.7, marginBottom: 14 }}>배우자 휴대폰에서 <b>마음부부 → 함께 분석 → "코드로 동의하기"</b>에 입력하고 동의하면, 아래 "{useCamera ? '녹화' : '녹음'} 시작"이 동작해요.</div>
        <Btn onClick={startCapture} disabled={busy}>배우자가 동의했어요 · {useCamera ? '녹화' : '녹음'} 시작</Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" onClick={() => setPhase('intro')}>취소</Btn>
        {msg && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{msg}</div>}
      </>)}

      {phase === 'accept' && (<>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>배우자에게 받은 코드 입력</div>
        <input value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="예: A1B2C3D4"
          style={{ width: '100%', border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 14, fontSize: 18, textAlign: 'center', letterSpacing: 2, outline: 'none', marginBottom: 12 }} />
        <Card style={{ background: '#f6faf8', fontSize: 12.5, color: MUT, lineHeight: 1.7, marginBottom: 12 }}>동의하면 이 세션에서 <b>녹화·음성 분석</b>이 가능해져요. 수집은 표정·어조의 <b>요약</b>뿐, 원본은 저장·전송되지 않아요. 언제든 철회할 수 있어요.</Card>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> 위 내용을 확인했고 동의합니다.
        </label>
        <Btn onClick={accept} disabled={busy || !agreed || !inputCode.trim()}>동의하고 완료</Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" onClick={() => setPhase('intro')}>이전</Btn>
        {msg && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{msg}</div>}
      </>)}

      {phase === 'accepted' && (
        <Card style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 34 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 17, margin: '8px 0' }}>동의 완료</div>
          <div style={{ color: MUT, fontSize: 14, lineHeight: 1.7 }}>요청하신 분이 녹화를 시작할 수 있어요.<br />마음이 바뀌면 언제든 철회할 수 있어요.</div>
          <div style={{ height: 14 }} />
          <Btn kind="ghost" onClick={async () => { await revoke(inputCode.trim().toUpperCase()); onBack(); }}>동의 철회</Btn>
        </Card>
      )}

      {phase === 'capturing' && (<>
        {useCamera
          ? <video ref={videoRef} style={{ width: '100%', borderRadius: 14, background: '#000', marginBottom: 12 }} />
          : <Card style={{ textAlign: 'center', padding: '28px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 40 }}>🎙️</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 8 }}>음성만 분석 중</div>
              <div style={{ color: MUT, fontSize: 12.5, marginTop: 4 }}>카메라는 꺼져 있어요</div>
            </Card>}
        <div style={{ textAlign: 'center', color: MUT, fontSize: 13, marginBottom: 12 }}>🔴 기기 안에서만 분석 중… (원본은 저장·전송되지 않아요)</div>
        <Btn onClick={stopCapture}>{useCamera ? '녹화' : '녹음'} 종료 · 분석 보기</Btn>
      </>)}

      {phase === 'result' && (<>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 8 }}>온디바이스 분석 요약 (원본은 이미 삭제됨)</div>
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            {useCamera && (signals.visualCues ? <div>· {signals.visualCues}</div> : <div style={{ color: MUT }}>· 표정이 충분히 감지되지 않았어요</div>)}
            {signals.toneAnalysis ? <div>· {signals.toneAnalysis}</div> : <div style={{ color: MUT }}>· 어조가 충분히 감지되지 않았어요</div>}
          </div>
        </Card>
        <div style={{ fontSize: 13.5, marginBottom: 8 }}>방금 나눈 대화가 있으면 적어주세요 (선택).</div>
        <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="주고받은 말을 적으면 더 정확해요."
          style={{ width: '100%', minHeight: 90, border: `1.5px solid ${LINE}`, borderRadius: 12, padding: 12, fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 12 }} />
        {!trResult ? (<>
          <Btn onClick={translate} disabled={busy}>{busy ? '통역 중…' : '이 신호로 통역하기 (중재 · 3크레딧)'}</Btn>
          {msg && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{msg}</div>}
        </>) : trResult.safety_tier ? <SafetyScreen s={trResult} /> : (<>
          <ResultBlock result={trResult} />
          <Improvement imp={trResult.improvement} relationId={relationId} track={config.track} />
        </>)}
        <div style={{ height: 10 }} />
        <Btn kind="ghost" onClick={async () => { await revoke(code); onBack(); }}>동의 철회하고 종료</Btn>
      </>)}
    </Shell>
  );
}

// ── 수신함 + 배우자 연결 ──────────────────────────────────────────────────────
const SHARE_LABEL = { message: '✉️ 배우자가 다듬은 한마디', mediate_view: '🔗 중재 통역 함께 보기', perspective_view: '🔗 관점 통역 함께 보기', activity_invite: '💌 같이 해볼래?' };
function InboxItem({ it, onAccept }) {
  const p = it.payload || {};
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: GREEN, marginBottom: 6 }}>{SHARE_LABEL[it.item_type] || '공유'}</div>
      {it.item_type === 'message' && <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{p.text}</div>}
      {it.item_type === 'activity_invite' && (<>
        <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{p.action}</div>
        {it.status === 'accepted'
          ? <div style={{ fontSize: 13, color: GREEN, marginTop: 8 }}>같이 하기로 했어요 🌱</div>
          : <Btn onClick={() => onAccept(it.id)} style={{ marginTop: 10 }}>같이 할게요</Btn>}
      </>)}
      {(it.item_type === 'mediate_view' || it.item_type === 'perspective_view') && (
        <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {p.bridge || p.next_word || p.translation || p.surface || '함께 보기 내용'}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: MUT, marginTop: 8 }}>{(it.created_at || '').slice(0, 16).replace('T', ' ')}</div>
    </Card>
  );
}
function Inbox({ relationId, onBack, onSeen }) {
  const [items, setItems] = useState(null);
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [msg, setMsg] = useState('');
  const load = async () => { const r = await api(`/share/inbox?relationId=${relationId}`); setItems(r.ok ? (r.items || []) : []); if (onSeen) onSeen(); };
  useEffect(() => { load(); }, []);
  const makeInvite = async () => { const r = await api('/relation/invite', 'POST', { relationId }); if (r.ok) setCode(r.inviteCode); };
  const join = async () => {
    const c = joinCode.trim().toUpperCase(); if (!c) return;
    const r = await api('/relation/join', 'POST', { inviteCode: c });
    setMsg(r.ok ? '배우자와 연결됐어요 ✓ 이제 공유가 앱 안에서 바로 도착해요.' : (r.error || '연결에 실패했어요.'));
  };
  const accept = async (id) => { await api('/share/respond', 'POST', { shareId: id, action: 'accepted' }); load(); };
  return (
    <Shell title="📬 수신함" onBack={onBack}>
      <Card style={{ marginBottom: 14, background: '#f6faf8' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>🤝 배우자 연결</div>
        <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.65, marginBottom: 10 }}>연결하면 공유한 항목이 앱 안에서 바로 오갑니다. 한쪽이 코드를 만들고, 다른 쪽이 입력하면 끝.</div>
        <Btn kind="ghost" onClick={makeInvite}>내 초대코드 만들기</Btn>
        {code && <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: 3, color: GREEN, margin: '10px 0', fontFamily: 'monospace' }}>{code}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="배우자 코드 입력" maxLength={6}
            style={{ flex: 1, border: `1.5px solid ${LINE}`, borderRadius: 10, padding: 10, fontSize: 15, textTransform: 'uppercase', outline: 'none', fontFamily: 'monospace', letterSpacing: 2 }} />
          <Btn onClick={join} style={{ width: 'auto', padding: '10px 16px' }}>연결</Btn>
        </div>
        {msg && <div style={{ fontSize: 12.5, color: GREEN, marginTop: 8, lineHeight: 1.6 }}>{msg}</div>}
      </Card>
      {items === null ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>불러오는 중…</div>
        : items.length === 0 ? <div style={{ color: MUT, textAlign: 'center', padding: 30 }}>아직 받은 공유가 없어요.</div>
          : items.map(it => <InboxItem key={it.id} it={it} onAccept={accept} />)}
    </Shell>
  );
}

// ── 성인 연령 게이트 (만 19세+, ADDENDUM 01 §3) ──────────────────────────────
function AgeGate({ onPass }) {
  const [y, setY] = useState('');
  const [m, setM] = useState('');
  const [d, setD] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const box = { flex: 1, border: `1.5px solid ${LINE}`, borderRadius: 10, padding: 12, fontSize: 16, textAlign: 'center', outline: 'none' };
  const submit = async () => {
    setErr('');
    if (y.length !== 4 || !m || !d) { setErr('생년월일을 정확히 입력해 주세요.'); return; }
    setBusy(true);
    const r = await api('/age/verify', 'POST', { birthDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` });
    setBusy(false);
    if (r.ok) { onPass(); return; }
    setErr(r.minor ? (r.message || '만 19세 이상만 이용할 수 있어요.') : (r.error || '확인에 실패했어요.'));
  };
  return (
    <Shell>
      <Card style={{ marginTop: 30 }}>
        <div style={{ fontSize: 34, textAlign: 'center' }}>🔞</div>
        <div style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', margin: '10px 0 6px' }}>성인 확인</div>
        <div style={{ color: MUT, fontSize: 13.5, textAlign: 'center', lineHeight: 1.7, marginBottom: 18 }}>마음부부는 <b style={{ color: INK }}>만 19세 이상 성인 부부</b>를 위한 관계 통역 서비스예요. 생년월일로 한 번만 확인할게요.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input inputMode="numeric" value={y} onChange={e => setY(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="YYYY" style={box} />
          <input inputMode="numeric" value={m} onChange={e => setM(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="MM" style={{ ...box, maxWidth: 80 }} />
          <input inputMode="numeric" value={d} onChange={e => setD(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="DD" style={{ ...box, maxWidth: 80 }} />
        </div>
        {err && <div style={{ color: '#c0392b', fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>{err}</div>}
        <div style={{ height: 14 }} />
        <Btn onClick={submit} disabled={busy}>{busy ? '확인 중…' : '성인입니다 · 시작하기'}</Btn>
        <div style={{ fontSize: 11.5, color: MUT, textAlign: 'center', marginTop: 10 }}>생년월일은 성인 여부 확인에만 쓰여요.</div>
      </Card>
    </Shell>
  );
}

// ── 연령 확인 (만14+ / 3층 산출) ─────────────────────────────────────────────
// ⚠️ 마음부부의 "성인 19+ 게이트"와 다르다. 이 앱은 만 14세부터 쓴다.
//    14세 하한 근거: 만14세 미만은 법정대리인 동의 필요 → 부모와의 갈등을 다루는 앱에
//    부모 동의를 요구하면 서비스가 성립하지 않는다.
function AgeCheck({ onPass }) {
  const [d, setD] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return; setBusy(true); setMsg('');
    const r = await api('/age/verify', 'POST', { birthDate: d });
    setBusy(false);
    if (r.ok) return onPass(r.ageTier);
    setMsg(r.message || r.error || '확인에 실패했어요.');
  };
  return (
    <Shell title="🌿 마음세대">
      <Card style={{ marginTop: 30 }}>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>먼저 나이를 알려주세요</div>
        <div style={{ color: MUT, fontSize: 13.5, lineHeight: 1.7, marginBottom: 14 }}>
          나이에 따라 안내 방식이 달라져요. 청소년에게는 청소년에게 맞는 방식으로 도와드려요.
        </div>
        {msg && <div style={{ background: '#fff4ee', border: '1px solid #f5c6a5', color: '#b45309', borderRadius: 10, padding: '10px 13px', fontSize: 13.5, lineHeight: 1.7, marginBottom: 12 }}>{msg}</div>}
        <input type="date" value={d} onChange={e => setD(e.target.value)}
          style={{ width: '100%', padding: '12px 13px', border: '1.5px solid ' + LINE, borderRadius: 10, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }} />
        <Btn onClick={submit} disabled={!d || busy}>확인</Btn>
        <div style={{ color: MUT, fontSize: 12, marginTop: 12, lineHeight: 1.7 }}>
          생년월일은 나이 확인에만 쓰고, 다른 곳에 보여주지 않아요.
        </div>
      </Card>
    </Shell>
  );
}

// ── 관계 선택·생성 (이 앱의 근본 구조: 다중 관계) ───────────────────────────────
// 아버지·어머니는 완전히 다른 관계다. 통역·기억·활동은 전부 선택된 관계 스코프에서만 동작한다.
function RelationPicker({ relations, current, onPick, onCreated, ageTier }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(ageTier === 'teen' ? 'child' : '');
  const [label, setLabel] = useState('');
  const [ctx, setCtx] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const create = async () => {
    if (busy) return; setBusy(true); setErr('');
    const r = await api('/relation', 'POST', { ownerRole: role, counterpartLabel: label.trim(), counterpartContext: ctx.trim() || undefined });
    setBusy(false);
    if (!r.ok) return setErr(r.error || '만들지 못했어요.');
    setOpen(false); setLabel(''); setCtx('');
    onCreated(r.relationId);
  };
  const chip = (on) => ({
    padding: '7px 13px', borderRadius: 100, fontSize: 13.5, fontWeight: on ? 800 : 500, cursor: 'pointer',
    border: '1px solid ' + (on ? GREEN : LINE), background: on ? GREEN : '#fff', color: on ? '#fff' : INK, whiteSpace: 'nowrap',
  });
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: MUT, marginBottom: 6 }}>누구와의 대화인가요?</div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {relations.map(r => (
          <div key={r.id} onClick={() => onPick(r.id)} style={chip(r.id === current)}>{r.counterpart_label}</div>
        ))}
        <div onClick={() => setOpen(true)} style={{ ...chip(false), borderStyle: 'dashed', color: GREEN }}>+ 추가</div>
      </div>
      {open && (
        <Card style={{ marginTop: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>관계 추가</div>
          {err && <div style={{ background: '#fff4ee', color: '#b45309', borderRadius: 8, padding: '8px 11px', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          {ageTier !== 'teen' && (
            <div>
              <div style={{ fontSize: 12.5, color: MUT, marginBottom: 5 }}>나는 이 관계에서</div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                <div onClick={() => setRole('child')} style={chip(role === 'child')}>자녀예요</div>
                <div onClick={() => setRole('parent')} style={chip(role === 'parent')}>부모예요</div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: MUT, marginBottom: 5 }}>상대를 뭐라고 부르나요?</div>
          <input value={label} onChange={e => setLabel(e.target.value)} maxLength={20}
            placeholder={role === 'parent' ? '예: 큰딸, 아들' : '예: 아버지, 어머니'}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + LINE, borderRadius: 9, fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ fontSize: 12.5, color: MUT, marginBottom: 5 }}>상대에 대해 알려주실 것 (선택)</div>
          <input value={ctx} onChange={e => setCtx(e.target.value)} maxLength={200}
            placeholder="예: 70대, 은퇴 2년차 / 고2, 입시 준비 중"
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid ' + LINE, borderRadius: 9, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" onClick={() => setOpen(false)}>취소</Btn>
            <Btn onClick={create} disabled={!role || !label.trim() || busy}>만들기</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── 앱 라우터 ─────────────────────────────────────────────────────────────────
function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [ageTier, setAgeTier] = useState(null);
  const [relations, setRelations] = useState([]);
  const [relationId, setRelationId] = useState(null);
  const [config, setConfig] = useState(loadConfig());
  const [view, setView] = useState('home');
  const [mode, setMode] = useState(null);

  const loadRelations = async (pick) => {
    const r = await api('/relations');
    if (r.ok) {
      const list = r.relations || [];
      setRelations(list);
      setRelationId(pick || (list[0] && list[0].id) || null);
    }
  };

  useEffect(() => {
    (async () => {
      if (!token()) { setAuthed(false); setReady(true); return; }
      const me = await api('/me');
      if (me.status === 401) { setAuthed(false); setReady(true); return; }
      if (me.ok && me.ageTier) { setAgeTier(me.ageTier); await loadRelations(); }
      setReady(true);
    })();
  }, []);

  if (!ready) return <Shell><div style={{ textAlign: 'center', color: MUT, padding: 50 }}>불러오는 중…</div></Shell>;

  if (!authed) return (
    <Shell>
      <Card style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 40 }}>🌿</div>
        <div style={{ fontSize: 20, fontWeight: 800, margin: '10px 0' }}>마음세대</div>
        <div style={{ color: MUT, fontSize: 14, lineHeight: 1.7 }}>마음풀에 로그인한 뒤,<br />메뉴의 <b>🌿 마음세대</b>로 들어와 주세요.</div>
        <div style={{ height: 16 }} />
        <Btn onClick={() => window.open('https://maumful.com', '_blank')}>마음풀로 가기</Btn>
      </Card>
    </Shell>
  );

  if (!ageTier) return <AgeCheck onPass={async (t) => { setAgeTier(t); await loadRelations(); }} />;
  if (!config) return <Onboarding onDone={() => setConfig(loadConfig())} ageTier={ageTier} />;

  if (view === 'mode' && mode && relationId) {
    return <ModeView mode={mode} config={config} relationId={relationId} ageTier={ageTier}
      onBack={() => setView('home')} />;
  }
  if (view === 'memory' && relationId) return <Memory relationId={relationId} onBack={() => setView('home')} />;

  return <Home config={config} ageTier={ageTier} relationId={relationId}
    picker={<RelationPicker relations={relations} current={relationId} ageTier={ageTier}
      onPick={setRelationId} onCreated={(id) => loadRelations(id)} />}
    onMode={(m) => { setMode(m); setView('mode'); }}
    onMemory={() => setView('memory')}
    onSettings={() => { localStorage.removeItem('sedae_config'); setConfig(null); }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
