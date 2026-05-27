// ============================================================
// worry.jsx  —  걱정 풍선 (Worry Bubbles)
// 걱정을 풍선에 담아 터뜨리며 내려놓는 마음챙김 게임
// ACT(수용전념치료) 인지 탈융합(cognitive defusion) 기법 기반
// ============================================================

// ── 스타일 ────────────────────────────────────────────────────
(function () {
  const id = 'worry-bubble-styles';
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = `
    @keyframes wbFloat {
      0%,100% { transform: translateY(0px) translateX(0px) rotate(-1deg); }
      33%      { transform: translateY(-18px) translateX(7px) rotate(1.2deg); }
      66%      { transform: translateY(-9px) translateX(-5px) rotate(-0.6deg); }
    }
    @keyframes wbPop {
      0%   { transform: scale(1);   opacity: 1; }
      45%  { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(0);   opacity: 0; }
    }
    @keyframes wbAppear {
      from { opacity: 0; transform: scale(0.6) translateY(30px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes wbFadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .wb-float {
      animation: wbFloat var(--dur, 10s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
      position: absolute;
      transform-origin: center center;
    }
    .wb-float.wb-popped {
      animation: wbPop 0.35s ease-out forwards !important;
      pointer-events: none;
    }
    .wb-bubble {
      cursor: pointer;
      user-select: none;
      transition: filter 0.1s;
    }
    .wb-bubble:active { filter: brightness(0.92); }
    .wb-appear { animation: wbAppear 0.5s ease-out both; }
    .wb-fade-up { animation: wbFadeUp 0.5s ease-out both; }
  `;
  document.head.appendChild(s);
})();

// ── 팔레트 ────────────────────────────────────────────────────
const WB_COLORS = [
  { from: '#FFB5C8', to: '#FF8FAD', border: '#FF6B9940', shine: '#FF6B99', text: '#7A1A3A' },
  { from: '#FFD9A0', to: '#FFBB55', border: '#FF9A0040', shine: '#FF9A00', text: '#7A4A00' },
  { from: '#C5AEF0', to: '#A07EE0', border: '#7B4FD040', shine: '#7B4FD0', text: '#3A1A7A' },
  { from: '#A0D8B5', to: '#6FC08A', border: '#3A9A6A40', shine: '#3A9A6A', text: '#1A5A3A' },
  { from: '#A0CCEE', to: '#6AAAD8', border: '#3A88C040', shine: '#3A88C0', text: '#1A4A7A' },
];

const EXAMPLE_WORRIES_KO = [
  '요즘 일이 너무 많아요',
  '이 결정이 맞는 건지 모르겠어요',
  '관계가 어색해진 것 같아요',
  '미래가 불안해요',
  '내가 잘하고 있는 건지 걱정돼요',
  '몸이 자꾸 피곤해요',
  '중요한 일을 잊어버릴까 봐요',
  '마음이 공허한 느낌이에요',
  '혼자인 것 같은 기분이 들어요',
  '내일이 두렵고 불안해요',
];
const EXAMPLE_WORRIES_EN = [
  'I have way too much to do lately',
  "I'm not sure if this decision is right",
  'Things feel awkward in my relationship',
  'I feel anxious about the future',
  "I'm worried I'm not doing well enough",
  'My body keeps feeling tired',
  "I'm afraid I'll forget something important",
  'My heart feels empty',
  'I feel like I am alone',
  "I'm scared and anxious about tomorrow",
];
const EXAMPLE_WORRIES = GAME_LANG === 'en' ? EXAMPLE_WORRIES_EN : EXAMPLE_WORRIES_KO;

// 버블 위치 — 겹치지 않게 5개 슬롯을 미리 정의, 랜덤 오프셋 추가
const SLOT_POSITIONS = [
  [22, 18], [65, 25], [38, 52],
  [18, 68], [68, 62],
];

function buildBubbles(texts) {
  return texts
    .map((t, i) => ({
      id: i,
      text: t.trim(),
      xPct: SLOT_POSITIONS[i % 5][0] + (Math.random() - 0.5) * 6,
      yPct: SLOT_POSITIONS[i % 5][1] + (Math.random() - 0.5) * 6,
      size: Math.min(128, Math.max(92, 92 + t.length * 1.5)),
      dur: `${8 + Math.random() * 5}s`,
      delay: `${-(Math.random() * 7)}s`,
      colorIdx: i % WB_COLORS.length,
    }))
    .filter(b => b.text.length > 0);
}

// ── 헤더 공통 컴포넌트 ────────────────────────────────────────
function WBHeader({ title, left, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px', flexShrink: 0,
      background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ minWidth: 64 }}>{left}</div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#2C3E50', fontFamily: "'Noto Serif KR',serif" }}>
        {title}
      </span>
      <div style={{ minWidth: 64, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ── WorryGame ─────────────────────────────────────────────────
const WorryGame = ({ onExit }) => {
  const [screen, setScreen] = React.useState('intro');
  const [inputs, setInputs] = React.useState(['', '', '']);
  const [bubbles, setBubbles] = React.useState([]);
  const [poppedIds, setPoppedIds] = React.useState(new Set());
  const [saving, setSaving] = React.useState(false);
  const [doneData, setDoneData] = React.useState(null);
  const [startTime] = React.useState(Date.now());

  // ── 입력 → 풍선 만들기 ─────────────────────────────────────
  function handleStart() {
    const valid = inputs.filter(t => t.trim());
    if (!valid.length) return;
    setBubbles(buildBubbles(inputs));
    setPoppedIds(new Set());
    setScreen('pop');
  }

  // ── 풍선 팝 ────────────────────────────────────────────────
  function handlePop(id) {
    if (poppedIds.has(id)) return;
    const next = new Set(poppedIds);
    next.add(id);
    setPoppedIds(next);
    if (next.size === bubbles.length) {
      setTimeout(() => finishGame(next.size), 500);
    }
  }

  // ── 완료 저장 ──────────────────────────────────────────────
  async function finishGame(count) {
    setSaving(true);
    const sec = Math.round((Date.now() - startTime) / 1000);
    const score = count * 30;
    try {
      const res = await GameEngine.saveSession({
        gameId: 'worry',
        moduleType: 'RELAX',
        score,
        durationSec: sec,
        metadata: { worries_count: count, worries: bubbles.map(b => b.text) },
      });
      setDoneData({
        score,
        expGained: res.data?.expGained || 0,
        leveledUp: res.data?.leveledUp || false,
        newAchievements: res.data?.newAchievements || [],
      });
    } catch {
      setDoneData({ score, expGained: 0, leveledUp: false, newAchievements: [] });
    }
    setSaving(false);
    setScreen('done');
  }

  function fillExamples() {
    const shuffled = [...EXAMPLE_WORRIES].sort(() => Math.random() - 0.5);
    setInputs([shuffled[0], shuffled[1], shuffled[2]]);
  }

  const canStart = inputs.some(t => t.trim());

  // ────────────────────────────────────────────────────────────
  // 인트로
  // ────────────────────────────────────────────────────────────
  if (screen === 'intro') return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #DFF0F5, #EAE8F8, #E8F3EA)',
      height: '100%',
    }}>
      <WBHeader
        title={t('🫧 걱정 풍선', '🫧 Worry Bubbles')}
        right={
          <button onClick={() => onExit(null)} style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            background: 'rgba(0,0,0,0.06)', color: '#666',
            border: 'none', borderRadius: 9, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
          }}>{t('허브로 →', 'Hub →')}</button>
        }
      />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 24px 32px', gap: 20,
      }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'wbFloat 8s ease-in-out infinite' }}>🫧</div>

        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{
            fontSize: 22, fontWeight: 700, color: '#2C3E50',
            fontFamily: "'Noto Serif KR',serif", marginBottom: 10,
          }}>{t('걱정을 풍선에 담아요', 'Put your worries in a bubble')}</div>
          <div style={{ fontSize: 14, color: '#5A6A7A', lineHeight: 1.75 }}>
            {t(
              <>지금 마음을 무겁게 하는 걱정들을<br />풍선에 담고 하나씩 터뜨려 보세요.</>,
              <>Put the worries weighing on your heart<br />into bubbles and pop them one by one.</>
            )}<br />
            <span style={{ color: '#8A9AB0' }}>{t('내려놓는 연습이 마음을 가볍게 해요.', 'Letting go makes your heart feel lighter.')}</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.75)', borderRadius: 16, padding: '14px 20px',
          width: '100%', maxWidth: 300,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          {[
            { emoji: '✍️', text: t('걱정을 1~3가지 적어요', 'Write 1–3 worries') },
            { emoji: '🫧', text: t('걱정들이 풍선으로 떠오릅니다', 'Your worries rise up as bubbles') },
            { emoji: '💥', text: t('클릭해서 하나씩 터뜨려요', 'Click to pop them one by one') },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 18, minWidth: 26, textAlign: 'center' }}>{s.emoji}</span>
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{s.text}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setScreen('input')} style={{
          fontFamily: "'Noto Sans KR',sans-serif",
          background: 'linear-gradient(135deg, #7B9ED9, #5B7EC8)',
          color: 'white', border: 'none', borderRadius: 14,
          padding: '14px 0', fontSize: 16, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(91,126,200,0.4)',
          width: '100%', maxWidth: 300,
        }}>{t('시작하기', 'Start')}</button>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // 입력 화면
  // ────────────────────────────────────────────────────────────
  if (screen === 'input') return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #DFF0F5, #EAE8F8, #E8F3EA)',
      height: '100%',
    }}>
      <WBHeader
        title={t('걱정 적기', 'Enter your worry')}
        left={
          <button onClick={() => setScreen('intro')} style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            background: 'none', color: '#5A6A7A',
            border: 'none', fontSize: 13, cursor: 'pointer', padding: '4px 0',
          }}>{t('← 돌아가기', '← Back')}</button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50', fontFamily: "'Noto Serif KR',serif" }}>
            {t('지금 마음을 무겁게 하는 것들은?', "What's weighing on your mind right now?")}
          </div>
          <div style={{ fontSize: 12, color: '#8A9AB0', marginTop: 5 }}>
            {t('아주 작은 걱정도 괜찮아요 · 최소 1개 이상', 'Even tiny worries count · at least 1')}
          </div>
        </div>

        {inputs.map((val, i) => {
          const c = WB_COLORS[i];
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'white', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: '#8A9AB0' }}>
                  {t('걱정', 'Worry')} {i + 1}{i > 0 ? t(' (선택)', ' (optional)') : ''}
                </span>
              </div>
              <input
                type="text"
                value={val}
                onChange={e => {
                  const next = [...inputs];
                  next[i] = e.target.value;
                  setInputs(next);
                }}
                placeholder={i === 0 ? t('지금 가장 마음에 걸리는 것...', 'The thing bothering you most right now...') : t('또 다른 걱정이 있다면...', 'Another worry, if any...')}
                maxLength={35}
                style={{
                  fontFamily: "'Noto Sans KR',sans-serif",
                  width: '100%', padding: '11px 14px', fontSize: 14, color: '#2C3E50',
                  background: 'white',
                  border: `1.5px solid ${val.trim() ? c.shine + '99' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  boxShadow: val.trim() ? `0 0 0 3px ${c.shine}18` : 'none',
                }}
              />
            </div>
          );
        })}

        <button onClick={fillExamples} style={{
          fontFamily: "'Noto Sans KR',sans-serif",
          background: 'none',
          border: '1.5px dashed rgba(0,0,0,0.13)',
          borderRadius: 12, padding: '10px 16px',
          fontSize: 12, color: '#8A9AB0',
          cursor: 'pointer', width: '100%', marginTop: 2,
        }}>{t('✨ 예시로 채워보기', '✨ Fill with examples')}</button>
      </div>

      <div style={{ padding: '16px 24px 32px' }}>
        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            background: canStart
              ? 'linear-gradient(135deg, #7B9ED9, #5B7EC8)'
              : 'rgba(0,0,0,0.08)',
            color: canStart ? 'white' : '#AAA',
            border: 'none', borderRadius: 14, padding: '14px',
            fontSize: 16, fontWeight: 700,
            cursor: canStart ? 'pointer' : 'not-allowed',
            width: '100%',
            boxShadow: canStart ? '0 4px 14px rgba(91,126,200,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >{t('풍선 만들기 🫧', 'Make bubbles 🫧')}</button>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // 풍선 터뜨리기
  // ────────────────────────────────────────────────────────────
  if (screen === 'pop') {
    const totalCount = bubbles.length;
    const poppedCount = poppedIds.size;

    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #C8E8F5, #D8D4F0, #C8EAD8)',
        height: '100%', overflow: 'hidden',
      }}>
        <WBHeader
          title={saving ? t('저장 중...', 'Saving...') : `${poppedCount === totalCount ? '🎉' : '🫧'} ${poppedCount}/${totalCount} ${t('터뜨렸어요', 'popped')}`}
          left={
            !saving && (
              <button onClick={() => setScreen('input')} style={{
                fontFamily: "'Noto Sans KR',sans-serif",
                background: 'none', color: '#7A8A9A',
                border: 'none', fontSize: 12, cursor: 'pointer',
              }}>{t('← 다시 입력', '← Re-enter')}</button>
            )
          }
          right={
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {bubbles.map((b) => (
                <div key={b.id} style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: poppedIds.has(b.id)
                    ? 'rgba(0,0,0,0.12)'
                    : `linear-gradient(135deg, ${WB_COLORS[b.colorIdx].from}, ${WB_COLORS[b.colorIdx].to})`,
                  transition: 'background 0.4s',
                }} />
              ))}
            </div>
          }
        />

        {/* 풍선 영역 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {poppedCount === 0 && !saving && (
            <div style={{
              position: 'absolute', bottom: 24, left: 0, right: 0,
              textAlign: 'center', pointerEvents: 'none', zIndex: 0,
              color: 'rgba(90,106,122,0.45)', fontSize: 13,
            }}>
              {t('풍선을 눌러서 터뜨려 보세요 💥', 'Tap a bubble to pop it 💥')}
            </div>
          )}

          {saving && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: 13, color: '#5A6A7A', animation: 'pulse 1.5s infinite' }}>
                {t('걱정들이 사라지는 중... 🌈', 'Your worries are fading away... 🌈')}
              </div>
            </div>
          )}

          {bubbles.map((b) => {
            const c = WB_COLORS[b.colorIdx];
            const isPopped = poppedIds.has(b.id);
            const sz = b.size;

            return (
              <div
                key={b.id}
                className={`wb-float wb-appear${isPopped ? ' wb-popped' : ''}`}
                style={{
                  left: `${b.xPct}%`,
                  top: `${b.yPct}%`,
                  '--dur': b.dur,
                  '--delay': b.delay,
                  marginLeft: -sz / 2,
                  marginTop: -sz / 2,
                  animationDelay: `${0.1 * b.id}s`,
                  zIndex: 10,
                }}
                onClick={() => !isPopped && !saving && handlePop(b.id)}
              >
                <div className="wb-bubble" style={{
                  width: sz, height: sz, borderRadius: '50%',
                  background: `radial-gradient(circle at 38% 35%, ${c.from}F0, ${c.to}CC)`,
                  border: `2px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: 10,
                  boxShadow: `0 8px 28px ${c.to}50, inset 0 -4px 8px rgba(0,0,0,0.05), inset 0 4px 10px rgba(255,255,255,0.55)`,
                  position: 'relative', overflow: 'hidden',
                  cursor: isPopped ? 'default' : 'pointer',
                }}>
                  {/* 반짝이 */}
                  <div style={{
                    position: 'absolute', top: 10, left: 11,
                    width: 13, height: 9, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.65)',
                    transform: 'rotate(-30deg)', pointerEvents: 'none',
                  }} />
                  <span style={{
                    fontSize: sz < 108 ? 11 : 12,
                    fontFamily: "'Noto Sans KR',sans-serif",
                    fontWeight: 600, color: c.text,
                    lineHeight: 1.45,
                    maxWidth: sz - 26,
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                  }}>{b.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // 완료 화면
  // ────────────────────────────────────────────────────────────
  if (screen === 'done') return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #E0EFF8, #ECE8F8, #E2F2E6)',
      height: '100%',
    }}>
      <WBHeader
        title={t('🫧 걱정 풍선', '🫧 Worry Bubbles')}
        right={
          <button onClick={() => onExit(doneData || null)} style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            background: 'rgba(0,0,0,0.06)', color: '#666',
            border: 'none', borderRadius: 9, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
          }}>{t('허브로 →', 'Hub →')}</button>
        }
      />

      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 24px 32px', gap: 18,
      }}>
        <div style={{ fontSize: 64, lineHeight: 1, animation: 'wbAppear 0.6s ease' }}>🌈</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 22, fontWeight: 700, color: '#2C3E50',
            fontFamily: "'Noto Serif KR',serif",
          }}>{t('걱정들이 날아갔어요!', 'Your worries have flown away!')}</div>
          <div style={{ fontSize: 14, color: '#5A6A7A', marginTop: 8, lineHeight: 1.75 }}>
            {t(
              <>{bubbles.length}개의 걱정을 풍선에 담고<br />모두 터뜨려 내려놓았어요 ✨</>,
              <>You put {bubbles.length} {bubbles.length === 1 ? 'worry' : 'worries'} in bubbles<br />and let them all go ✨</>
            )}
          </div>
        </div>

        {/* 점수 카드 */}
        {doneData && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '14px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            display: 'flex', gap: 28, textAlign: 'center',
            animation: 'wbFadeUp 0.5s ease 0.2s both',
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#5B7EC8' }}>{doneData.score}</div>
              <div style={{ fontSize: 11, color: '#8A9AB0', marginTop: 2 }}>{t('점수', 'Score')}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(0,0,0,0.07)' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4A8A5A' }}>+{doneData.expGained}</div>
              <div style={{ fontSize: 11, color: '#8A9AB0', marginTop: 2 }}>{t('경험치', 'EXP')}</div>
            </div>
          </div>
        )}

        {doneData?.leveledUp && (
          <div style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: 12, padding: '10px 20px',
            fontSize: 14, fontWeight: 700, color: 'white',
            animation: 'wbAppear 0.5s ease',
          }}>{t('🎉 레벨 업!', '🎉 Level Up!')}</div>
        )}

        {/* 내려놓은 걱정 목록 */}
        <div style={{
          background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: '14px 18px',
          width: '100%', maxWidth: 320,
          animation: 'wbFadeUp 0.5s ease 0.35s both',
        }}>
          <div style={{ fontSize: 12, color: '#8A9AB0', marginBottom: 10, textAlign: 'center' }}>
            {t('오늘 내려놓은 걱정들 🌿', "Today's released worries 🌿")}
          </div>
          {bubbles.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0',
              borderBottom: i < bubbles.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 13 }}>💨</span>
              <span style={{
                fontSize: 13, color: '#9AAABA',
                textDecoration: 'line-through', textDecorationColor: WB_COLORS[i % 5].shine + '99',
              }}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 13, color: '#8A9AB0', textAlign: 'center',
          maxWidth: 260, lineHeight: 1.75,
          animation: 'wbFadeUp 0.5s ease 0.5s both',
        }}>
          {t(
            <>걱정은 생각일 뿐이에요.<br />지금 이 순간 당신은 괜찮아요 💙</>,
            <>Worry is just a thought.<br />Right now, in this moment, you are okay 💙</>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 10, width: '100%', maxWidth: 320,
          animation: 'wbFadeUp 0.5s ease 0.6s both',
        }}>
          <button onClick={() => { setInputs(['', '', '']); setScreen('input'); }} style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            flex: 1, background: 'rgba(0,0,0,0.06)', color: '#5A6A7A',
            border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, cursor: 'pointer',
          }}>{t('다시 하기', 'Play again')}</button>
          <button onClick={() => onExit(doneData)} style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            flex: 2,
            background: 'linear-gradient(135deg, #7B9ED9, #5B7EC8)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(91,126,200,0.4)',
          }}>{t('정원으로 돌아가기 🌿', 'Back to hub 🌿')}</button>
        </div>
      </div>
    </div>
  );

  return null;
};
