const { useState, useEffect, useRef, useCallback } = React;

// ============================================================
// 토큰 저장소 (localStorage)
// ============================================================
const tokenStore = {
  getAccess:   ()  => localStorage.getItem('access_token'),
  getRefresh:  ()  => localStorage.getItem('refresh_token'),
  setTokens:   (a, r) => { localStorage.setItem('access_token', a); if (r) localStorage.setItem('refresh_token', r); },
  clear:       ()  => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('current_user'); },
  getUser:     ()  => { try { return JSON.parse(localStorage.getItem('current_user') || 'null'); } catch { return null; } },
  setUser:     (u) => localStorage.setItem('current_user', JSON.stringify(u)),
};

// ============================================================
// 검사·AI 정책 상수
// ============================================================
const FREE_TESTS      = ['PHQ9', 'GAD7'];            // 무료 검사 2종 (PHQ-9·GAD-7)
const AI_LIMIT_FREE   = 5;   // 로그인(크레딧 없음): 하루 5회
const AI_LIMIT_KEY    = 'ai_chat_used_v2';           // localStorage 키 (로그인 사용자 일일 카운터)
const AI_GUEST_TOTAL  = 3;   // 비회원 평생 체험 횟수
const AI_GUEST_KEY    = 'maumful_guest_ai_total';    // localStorage 키 (비회원 누적, 절대 초기화 안 함)
const AI_DISCLAIMER   = '⚠️ 이 분석은 AI가 생성한 참고 정보입니다. 의학적 진단이나 치료를 대체하지 않습니다. 심리적 어려움이 지속된다면 반드시 전문가와 상담하세요.';

// ============================================================
// B2C API 헬퍼 — 모든 인증 요청에 Bearer 토큰 자동 주입
// ============================================================
const api = {
  // 인증 헤더 반환
  _authHeader() {
    const t = tokenStore.getAccess();
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  },

  // 공통 fetch — 401 시 refresh 자동 시도
  async _fetch(url, opts = {}, retry = true) {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...this._authHeader(), ...(opts.headers || {}) },
    });
    if (res.status === 401 && retry) {
      const ok = await this.refreshToken();
      if (ok) return this._fetch(url, opts, false);
    }
    return res;
  },

  // accessToken 만료 임박(또는 만료) 시 미리 갱신 — SSE 스트리밍처럼 _fetch(401 재시도)를 못 쓰는
  // 직접 fetch 호출부에서 전송 직전에 부른다. 갱신 실패해도 기존 토큰으로 진행(막지 않음).
  // 만료 판단: JWT exp를 디코드해 60초 이내면 갱신. 디코드 실패 시 안전하게 갱신 시도.
  async ensureToken() {
    const t = tokenStore.getAccess();
    if (!t) return;
    let needsRefresh = true;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp) needsRefresh = (payload.exp - 60) <= Math.floor(Date.now() / 1000);
    } catch { needsRefresh = true; }
    if (needsRefresh) await this.refreshToken();
  },

  // 토큰 갱신
  async refreshToken() {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return false;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) { tokenStore.clear(); return false; }
      const { data } = await res.json();
      tokenStore.setTokens(data.accessToken, null);
      return true;
    } catch { tokenStore.clear(); return false; }
  },

  // ── 인증 ──────────────────────────────────────────────────
  async register(email, password, nickname, partnerCode, marketingAgreed = false, locale = 'ko', gender = null, age_range = null, phone = null) {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ email, password, nickname, locale, partnerCode: partnerCode || undefined, marketingAgreed, gender: gender || undefined, age_range: age_range || undefined, phone: phone || undefined }) });
    return r.json();
  },
  async login(email, password) {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async loginGoogle(idToken) {
    const r = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ idToken }) });
    return r.json();
  },
  async loginKakao(accessToken) {
    const r = await fetch('/api/auth/kakao', { method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ accessToken }) });
    return r.json();
  },
  async logout() {
    await this._fetch('/api/auth/logout', { method: 'POST' });
    tokenStore.clear();
  },
  async forgotPassword(email) {
    const r = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ email }) });
    return r.json();
  },

  // ── 사용자 ────────────────────────────────────────────────
  async getMe() {
    const r = await this._fetch('/api/user/me');
    return r.json();
  },
  async getCredits() {
    const r = await this._fetch('/api/user/credits');
    return r.json();
  },
  async updateMe(data) {
    const r = await this._fetch('/api/user/me', { method: 'PATCH', body: JSON.stringify(data) });
    return r.json();
  },
  async deleteMe() {
    const r = await this._fetch('/api/user/me', { method: 'DELETE' });
    return r.json();
  },

  // ── 검사 ──────────────────────────────────────────────────
  async startTest(testType, lang = 'ko') {
    const r = await this._fetch('/api/test/start', { method: 'POST', body: JSON.stringify({ testType, lang }) });
    return r.json();
  },
  async getTestHistory() {
    const r = await this._fetch('/api/test/history');
    return r.json();
  },
  async saveTestScore(testType, score, level = '') {
    const r = await this._fetch('/api/test/save-score', {
      method: 'POST', body: JSON.stringify({ test_type: testType, score, level }),
    });
    return r.json();
  },

  // ── 지역 설정 ─────────────────────────────────────────────
  async getRegionConfig() {
    const r = await fetch('/api/config/region');
    return r.json();
  },

  // ── 크레딧 충전 ───────────────────────────────────────────
  async prepareCharge(packageKey, pg) {
    const r = await this._fetch('/api/credits/prepare-charge', { method: 'POST', body: JSON.stringify({ packageKey, pg }) });
    return r.json();
  },
  async tossCheckout(packageKey) {
    const r = await this._fetch('/api/payment/toss/checkout', { method: 'POST', body: JSON.stringify({ packageKey }) });
    return r.json();
  },
};

// ============================================================
// LocalStorage 결과 저장소 (검사 결과는 서버 미저장 원칙 유지)
// ============================================================
const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch { return false; } },
  remove: (key) => { try { localStorage.removeItem(key); return true; } catch { return false; } },
};

// ============================================================
// 콘텐츠 보호 — 보호 대상 뷰 목록
// ============================================================
const PROTECTED_VIEWS = new Set([
  'phq9Test','phq9Result',
  'gad7Test','gad7Result',
  'dass21Test','dass21Result',
  'big5Test','big5Result',
  'burnoutTest','burnoutResult',
  'lostTest','lostResult',
  'sctTest','sctResult',
  'dsiTest','dsiResult',
  'riasecTest','riasecResult',
  'valuesTest','valuesResult',
]);

// 워터마크 오버레이 — SVG 반복 패턴 (캡처 추적용)
function WatermarkOverlay({ email }) {
  const label = (email || '마음풀') + '  ·  maumful.com  ·  무단배포금지';
  // SVG foreignObject는 일부 브라우저에서 제한 — text element 사용
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8900,
      pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="wm" x="0" y="0" width="320" height="130"
            patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
            <text x="10" y="55" fill="rgba(0,0,0,0.048)"
              fontSize="12" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700"
              letterSpacing="0.5">{label}</text>
            <text x="10" y="100" fill="rgba(0,0,0,0.025)"
              fontSize="10" fontFamily="Arial,Helvetica,sans-serif">© 마음풀 콘텐츠 무단복제 금지</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)" />
      </svg>
    </div>
  );
}

// Google Sign-In 버튼 컴포넌트 (App 외부에 정의해야 Hook 규칙 준수)
function GoogleSignInBtn({ onLogin, btnText = 'signin_with' }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!window.google?.accounts?.id || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: (response) => onLogin(response.credential),
    });
    window.google.accounts.id.renderButton(ref.current, {
      type: 'standard', theme: 'outline', size: 'large',
      text: btnText, shape: 'rectangular', width: ref.current.offsetWidth || 340,
    });
  }, []);
  return <div ref={ref} className="w-full" style={{ minHeight: 44 }} />;
}

// 카카오 로그인 버튼 (App 외부에 정의해야 Hook 규칙 준수)
function KakaoLoginBtn({ onLogin }) {
  const handleClick = async () => {
    if (!window.KAKAO_APP_KEY) return;
    try {
      const { url } = await fetch('/api/auth/kakao/url').then(r => r.json());
      if (!url) return;
      const popup = window.open(url, 'kakao_login', 'width=500,height=640,top=100,left=200');
      const handler = (e) => {
        if (e.origin !== window.location.origin) return;
        if (e.data?.type === 'kakao_login') {
          window.removeEventListener('message', handler);
          onLogin(e.data);
        } else if (e.data?.type === 'kakao_error') {
          window.removeEventListener('message', handler);
          console.error('카카오 로그인 오류:', e.data.error);
        }
      };
      window.addEventListener('message', handler);
      const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); window.removeEventListener('message', handler); } }, 500);
    } catch {}
  };
  if (!window.KAKAO_APP_KEY) return null;
  return (
    <button onClick={handleClick}
      style={{ background: '#FEE500', border: 'none', borderRadius: 8, width: '100%', height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', fontWeight: 'bold', fontSize: 14, color: '#3C1E1E' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
        <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.67 5.02 4.2 6.43L6.2 20.5l4.03-2.66c.57.08 1.17.12 1.77.12 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
      </svg>
      카카오로 계속하기
    </button>
  );
}

// 네이버 로그인 버튼 (App 외부에 정의 — Hook 규칙 준수)
function NaverLoginBtn({ onLogin }) {
  const handleClick = async () => {
    if (!window.NAVER_CLIENT_ID) return;
    try {
      const { url } = await fetch('/api/auth/naver/url').then(r => r.json());
      if (!url) return;
      const popup = window.open(url, 'naver_login', 'width=500,height=640,top=100,left=200');
      const handler = (e) => {
        if (e.origin !== window.location.origin) return;
        if (e.data?.type === 'naver_login') {
          window.removeEventListener('message', handler);
          onLogin(e.data);
        } else if (e.data?.type === 'naver_error') {
          window.removeEventListener('message', handler);
          console.error('네이버 로그인 오류:', e.data.error);
        }
      };
      window.addEventListener('message', handler);
      const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); window.removeEventListener('message', handler); } }, 500);
    } catch {}
  };
  if (!window.NAVER_CLIENT_ID) return null;
  return (
    <button onClick={handleClick}
      style={{ background: '#03C75A', border: 'none', borderRadius: 8, width: '100%', height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', fontWeight: 'bold', fontSize: 14, color: '#fff', fontFamily: "'Noto Sans KR',sans-serif" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
      </svg>
      네이버로 계속하기
    </button>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================
function PsychologicalTestSystem() {

  // ── 인증 & 사용자 상태 ──────────────────────────────────
  const [currentUser, setCurrentUser]   = useState(null);   // { id, email, nickname, credits, locale }
  const [isLoggedIn, setIsLoggedIn]      = useState(false);
  const [regionConfig, setRegionConfig]  = useState(null);  // 지역별 설정

  // ── 뷰 라우터 ─────────────────────────────────────────────
  const [view, setView] = useState('landing');
  const [initializing, setInitializing] = useState(true);
  const [returnToCouple, setReturnToCouple] = useState(() => !!sessionStorage.getItem('return_to_couple'));
  const [partnerMode, setPartnerMode]       = useState(null);
  // partnerMode: { sessionCode, testType, hostName, pendingTests: ['BIG5',...], completedResults: {} }

  // ── 크레딧 ────────────────────────────────────────────────
  const [credits, setCredits]             = useState(0);
  const [creditTxns, setCreditTxns]       = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);   // 크레딧 부족 모달
  const [showChargeView, setShowChargeView]   = useState(false);   // 충전 화면
  const [pendingTestAfterCharge, setPendingTestAfterCharge] = useState(null); // 충전 후 자동 재시작할 검사

  // ── 메시지 & 폼 ─────────────────────────────────────────
  const [loginMsg, setLoginMsg]     = useState({ type: '', text: '' });
  const [formMsg, setFormMsg]       = useState({ type: '', text: '' });
  const [saveStatus, setSaveStatus] = useState('');

  // ── 검사 진행 상태 (기존 로직 유지) ─────────────────────
  const [sessionId, setSessionId]         = useState(() => genId('session'));
  const [pendingTests, setPendingTests]   = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [multiSessionIds, setMultiSessionIds]   = useState([]);
  const [submitted, setSubmitted]         = useState([]);

  // ── 검사 응답 상태 (기존 유지) ───────────────────────────
  const [srciResponses, setSrciResponses]       = useState({});  // SRCI 자기반응 완성검사 응답
  const [sctSummaries, setSctSummaries]         = useState({});
  const [loadingSummary, setLoadingSummary]     = useState({});
  const [sdriResponses, setSdriResponses]               = useState({});     // SDRI 자기분화 반응성 검사 응답
  const [dsiRec, setDsiRec]                     = useState('');
  const [loadingRec, setLoadingRec]             = useState(false);
  const [phq9Responses, setPhq9Responses]       = useState({});
  const [gad7Responses, setGad7Responses]       = useState({});
  const [riasecResponses, setRiasecResponses]   = useState({});
  const [valuesResponses, setValuesResponses]   = useState({});
  const [dass21Responses, setDass21Responses]   = useState({});
  const [big5Responses, setBig5Responses]       = useState({});
  const [burnoutResponses, setBurnoutResponses] = useState({});
  const [lostResponses, setLostResponses]       = useState({});
  const [aiAnalysis, setAiAnalysis]             = useState({});
  const [aiLoading, setAiLoading]               = useState({});
  const [aiError, setAiError]                   = useState({});
  const [followupQs, setFollowupQs]             = useState({});  // C: 검사별 후속 질문(해석에서 파싱) → ChatBox 칩
  const [analysisFeedback, setAnalysisFeedback] = useState({});  // A: 단일 해석 👍/👎 기록(검사별)
  // 🧩 통합 심층 해석 (여러 검사 종합) 전용 state — 기존 aiAnalysis와 분리
  const [integratedText, setIntegratedText]       = useState('');
  const [integratedLoading, setIntegratedLoading] = useState(false);
  const [integratedErr, setIntegratedErr]         = useState('');
  const [integratedFeedback, setIntegratedFeedback] = useState('');
  // 📄 내 검사 리포트 (검사 이력 → 클릭)
  const [reportId, setReportId]           = useState(null);
  const [report, setReport]               = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportErr, setReportErr]         = useState('');


  // ── AI 채팅 상태 (기존 유지) ─────────────────────────────
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatError, setChatError]       = useState('');

  // ── 관리자 API 설정 (기존 유지) ─────────────────────────
  const [apiSettings, setApiSettings]       = useState([]);
  const [apiSettingForm, setApiSettingForm] = useState({ key_name: 'ANTHROPIC_API_KEY', key_value: '', description: 'Claude AI 심리분석용 API 키' });
  const [apiSettingMsg, setApiSettingMsg]   = useState({ type: '', text: '' });
  const [apiSettingLoading, setApiSettingLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput]     = useState(false);

  // ── B2C 전용 상태 ────────────────────────────────────────
  const [signupForm, setSignupForm] = useState({ email: '', password: '', pwConfirm: '', nickname: '', gender: '', age_range: '', phone: '' });
  const [signupConsents, setSignupConsents] = useState({ terms: false, privacy: false, sensitive: false, overseas: false, age: false, marketing: false });
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState(''); // 이메일 인증 대기 중인 계정

  // ── AI 상담 횟수 제한 상태 ────────────────────────────────
  const [aiChatUsed, setAiChatUsed] = useState(() => {
    try { return parseInt(localStorage.getItem(AI_LIMIT_KEY) || '0', 10); } catch { return 0; }
  });
  // 비회원 평생 누적 카운터 (로그아웃해도 초기화 안 함)
  const [guestAiTotal, setGuestAiTotal] = useState(() => {
    try { return parseInt(localStorage.getItem(AI_GUEST_KEY) || '0', 10); } catch { return 0; }
  });
  const [showAiLimitModal, setShowAiLimitModal] = useState(false);
  const [signupVerifyEmail, setSignupVerifyEmail] = useState(null);  // 가입 후 이메일 인증 안내 모달(null=숨김)
  // 공지사항 — 목록 페이지 + 중요 공지 상단 배너(닫으면 그 공지는 다시 안 뜸)
  const [notices, setNotices] = useState(null);  // null=미로드
  const [noticeDismissed, setNoticeDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notice_dismissed') || '[]'); } catch { return []; }
  });
  const dismissNotice = (id) => {
    setNoticeDismissed(prev => {
      const next = [...new Set([...prev, id])].slice(-50);  // 오래된 것부터 정리
      try { localStorage.setItem('notice_dismissed', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ── 상담 모드 (심리상담 / 기독교 상담) ───────────────────
  // localStorage에 저장 → 로그인 유지 시 기억
  const [counselingMode, setCounselingMode] = useState(() => {
    try { return localStorage.getItem('counseling_mode') || 'psychological'; } catch { return 'psychological'; }
  });
  function updateCounselingMode(mode) {
    setCounselingMode(mode);
    try { localStorage.setItem('counseling_mode', mode); } catch {}
  }

  const [langOverride, setLangOverride] = useState(() => {
    try { return localStorage.getItem('maumful_lang') || ''; } catch { return ''; }
  });
  function updateLang(l) {
    setLangOverride(l);
    try { localStorage.setItem('maumful_lang', l); } catch {}
  }

  // ── GDPR 쿠키 동의 ────────────────────────────────────────
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    // EU 국가 코드 목록
    const EU_COUNTRIES = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];
    const accepted = localStorage.getItem('cookie_consent');
    if (accepted) return false;
    // 브라우저 언어로 EU 여부 추정 (cf-ipcountry는 초기에는 알 수 없음)
    const lang = navigator.language?.slice(0,2);
    const euLangs = ['de','fr','it','es','pl','nl','pt','sv','fi','da','cs','ro','hu','sk','bg','hr','et','lv','lt','sl','mt'];
    return euLangs.includes(lang);
  });
  const [testHistory, setTestHistory] = useState([]);
  const [moodTrend, setMoodTrend] = useState([]);
  const [dailyCtxCard, setDailyCtxCard] = useState(null); // { greeting, chatContext } — AI 인사말 카드
  const [myPageTab, setMyPageTab]     = useState('credits'); // 'credits' | 'history' | 'settings' | 'appointments'
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [changePwMsg, setChangePwMsg] = useState({ type: '', text: '' });
  const [pushStatus, setPushStatus]   = useState('unknown'); // 'unknown'|'unsupported'|'denied'|'subscribed'|'idle'
  const [devToolsOpen, setDevToolsOpen] = useState(false);  // 개발자도구 감지
  const [creditSubTab, setCreditSubTab] = useState('usage');   // 'usage' | 'charge'
  const [selectedTests, setSelectedTests] = useState(['PHQ9']); // 대시보드에서 선택한 검사

  // ── 친구 초대 상태 ────────────────────────────────────────
  const [referralData, setReferralData]   = useState(null);   // { code, inviteUrl, stats, rewards }
  const [referralList, setReferralList]   = useState([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMsg, setReferralMsg]     = useState({ type: '', text: '' });
  const [referralInput, setReferralInput] = useState('');     // 초대 코드 입력

  // ── 관리자 대시보드 상태 ─────────────────────────────────
  const [adminStats, setAdminStats]       = useState(null);
  const [adminDaily, setAdminDaily]       = useState(null);
  const [adminTestStats, setAdminTestStats] = useState([]);
  const [adminUsers, setAdminUsers]       = useState({ users: [], pagination: {} });
  const [adminPayments, setAdminPayments] = useState({ payments: [], pagination: {} });
  const [adminTab, setAdminTab]           = useState('overview');  // overview|users|payments|tests|coupons|loop
  const [adminLoop, setAdminLoop]         = useState(null);        // 검사↔게임 루프 퍼널
  const [adminFb, setAdminFb]             = useState(null);        // AI 해석 피드백 집계
  const [adminSearch, setAdminSearch]     = useState('');
  const [adminSecretInput, setAdminSecretInput] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading]   = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminMsg, setAdminMsg]           = useState({ type: '', text: '' });
  const [creditGrantForm, setCreditGrantForm] = useState({ userId: '', amount: '', type: 'gain', reason: 'admin_grant' });

  // 🔒 레거시 화면 호환 useState (다른 AI 분석에서 발견)
  const [userInfo, setUserInfo] = useState({ phone: '', password: '' });
  const [linkInput, setLinkInput] = useState('');
  const [counselorForm, setCounselorForm] = useState({ name: '', phone: '', password: '', certification: '', education: '', experience: '' });
  const [biblicalRefs, setBiblicalRefs] = useState([]);
  const [biblicalForm, setBiblicalForm] = useState({ id: null, title: '', category: 'general', content: '', sort_order: 0 });
  const [showBiblicalForm, setShowBiblicalForm] = useState(false);
  const [biblicalMsg, setBiblicalMsg] = useState({ type: '', text: '' });
  const [biblicalLoading, setBiblicalLoading] = useState(false);
  const [subscription, setSubscriptionState] = useState(null);


  // ============================================================
  // 🔒 누락된 state 안전망 (B2B/Master/Org 잔재)
  // ============================================================
  const [isMaster, setIsMaster] = useState(false);
  const [masterInfo, setMasterInfo] = useState(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [orgAdminInfo, setOrgAdminInfo] = useState(null);
  // 🔒 B2B 잔재 setter stubs (logout 등 호환용)
  const setActiveLinkId = (...args) => {};
  const setSubscription = setSubscriptionState;  // 🔗 useState setter 위임

  // ── 언어 설정 ────────────────────────────────────────────────
  const lang = langOverride || regionConfig?.lang || 'ko';
  const t = (ko, en) => lang === 'en' ? en : ko;

  // ============================================================
  // ✅ main.jsx 에서 복구한 헬퍼 함수 및 검사 데이터
  // ============================================================
  function getToken() {
      try {
        const token = localStorage.getItem('psy_token');
        return token || '';
      } catch (e) {
        console.error('[getToken] localStorage 접근 실패:', e);
        return '';
      }
    }

  function saveToken(tok) {
      try {
        if (!tok) {
          console.warn('[saveToken] 빈 토큰 저장 시도 무시');
          return false;
        }
        localStorage.setItem('psy_token', tok);
        console.log('[saveToken] 토큰 저장 성공, 길이:', tok.length);
        return true;
      } catch (e) {
        console.error('[saveToken] localStorage 저장 실패:', e);
        return false;
      }
    }

  async function restoreLoginState() {
      // B2C 전환 완료: 로그인 복원은 아래 두 번째 useEffect의 tokenStore 기반 로직이 담당
      // 구 B2B current_login 데이터가 남아있으면 정리
      storage.remove("current_login");
      return false;
    }

  function saveLoginState(loginData) {
      // 토큰도 함께 저장하여 복원 시 사용
      const token = getToken();
      storage.set("current_login", JSON.stringify({ ...loginData, _token: token }));
    }

  function clearLoginState() {
      storage.remove("current_login");
    }

  function loadAllSubmitted() {
      const r = storage.get("submitted_list");
      const list = r ? JSON.parse(r.value) : [];
      setSubmitted(list);
    }

  async function loadApiSettings() {
      try {
        const res = await authFetch('/api/admin/api-settings');
        const data = await res.json();
        if (data.success) setApiSettings(data.data || []);
      } catch (e) {
      }
    }

  function checkAndCleanExpiredSessions() {
      const listRaw = storage.get("submitted_list");
      if (!listRaw) return;
    
      const list = JSON.parse(listRaw.value);
      const now = Date.now();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7일 (밀리초)

      const validSessions = [];
      let deletedCount = 0;

      list.forEach(session => {
        const createdTime = new Date(session.createdAt).getTime();
        const age = now - createdTime;

        if (age >= SEVEN_DAYS) {
          // 7일 경과 - 삭제
          storage.remove("session_" + session.sessionId);
          deletedCount++;
        } else {
          validSessions.push(session);
        }
      });
    
      if (deletedCount > 0) {
        storage.set("submitted_list", JSON.stringify(validSessions));
        setSubmitted(validSessions);
      } else {
      }
    }

  function loadLink(id) {
      const r = storage.get("link_" + id);
      return r ? JSON.parse(r.value) : null;
    }

  function storeLink(d) {
      storage.set("link_" + d.linkId, JSON.stringify(d));
    }

  function checkEdu(edu) {
      if (!edu) return { ok: false, kws: [] };
      const kws = counselingKw.filter(k => edu.toLowerCase().includes(k));
      return { ok: kws.length > 0, kws };
    }

  const getBurnoutDomains = () => [
      { id: "EE", name: "정서적 소진",  nameEn: "Emotional Exhaustion",           icon: "😰", color: "#f97316", max: 72, questions: burnoutQ.filter(q => q.domain === "EE") },
      { id: "DP", name: "비인격화",     nameEn: "Depersonalization",              icon: "😶", color: "#ef4444", max: 48, questions: burnoutQ.filter(q => q.domain === "DP") },
      { id: "PA", name: "성취감 저하",  nameEn: "Reduced Accomplishment",         icon: "📉", color: "#c084fc", max: 60, questions: burnoutQ.filter(q => q.domain === "PA") },
      { id: "WO", name: "업무 과부하",  nameEn: "Work Overload",                  icon: "⚡", color: "#f59e0b", max: 60, questions: burnoutQ.filter(q => q.domain === "WO") },
      { id: "PC", name: "신체·인지",    nameEn: "Physical & Cognitive",           icon: "🤕", color: "#4ade80", max: 60, questions: burnoutQ.filter(q => q.domain === "PC") },
    ];

  const phq9Q = [
      { num: 1, content: t("기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다", "Feeling down, depressed, or hopeless") },
      { num: 2, content: t("평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다", "Little interest or pleasure in doing things") },
      { num: 3, content: t("잠들기가 어렵거나 자주 깼다 / 혹은 너무 많이 잤다", "Trouble falling or staying asleep, or sleeping too much") },
      { num: 4, content: t("피곤하다고 느끼거나 기력이 거의 없었다", "Feeling tired or having little energy") },
      { num: 5, content: t("식욕이 줄었다 / 혹은 평소보다 많이 먹었다", "Poor appetite or overeating") },
      { num: 6, content: t("내 자신이 실패자라고 느꼈다 / 혹은 자신과 가족을 실망시켰다고 느꼈다", "Feeling bad about yourself — or that you are a failure or have let yourself or your family down") },
      { num: 7, content: t("신문을 읽거나 TV를 보는 것과 같은 일에 집중하기가 어려웠다", "Trouble concentrating on things, such as reading the newspaper or watching television") },
      { num: 8, content: t("다른 사람들이 알아챌 정도로 평소보다 말과 행동이 느려졌다 / 혹은 너무 안절부절 못해서 가만히 앉아 있을 수 없었다", "Moving or speaking so slowly that other people could have noticed — or being so fidgety that you moved around more than usual") },
      { num: 9, content: t("차라리 죽는 것이 낫겠다고 생각했다 / 혹은 자해할 생각을 했다", "Thoughts that you would be better off dead, or of hurting yourself in some way") },
    ];

  const gad7Q = [
      { num: 1, content: t("초조하거나 불안하거나 조마조마하게 느낀다", "Feeling nervous, anxious, or on edge") },
      { num: 2, content: t("걱정하는 것을 멈추거나 조절할 수가 없다", "Not being able to stop or control worrying") },
      { num: 3, content: t("여러 가지 것들에 대해 걱정을 너무 많이 한다", "Worrying too much about different things") },
      { num: 4, content: t("편하게 있기가 어렵다", "Trouble relaxing") },
      { num: 5, content: t("너무 안절부절 못해서 가만히 있기 힘들다", "Being so restless that it is hard to sit still") },
      { num: 6, content: t("쉽게 짜증이 나거나 쉽게 성을 낸다", "Becoming easily annoyed or irritable") },
      { num: 7, content: t("마치 끔찍한 일이 생길 것처럼 두렵게 느낀다", "Feeling afraid, as if something awful might happen") },
    ];

  const dass21Q = [
      { num: 1,  content: t("나는 안정을 취하기 힘들었다", "I found it hard to wind down"), scale: "스트레스" },
      { num: 2,  content: t("입이 바싹 마르는 느낌이 들었다", "I was aware of dryness of my mouth"), scale: "불안" },
      { num: 3,  content: t("어떤 것에도 긍정적인 감정을 느낄 수가 없었다", "I couldn't seem to experience any positive feeling at all"), scale: "우울" },
      { num: 4,  content: t("호흡 곤란을 경험했다 (예: 과도하게 빠른 호흡, 힘든 일을 하지 않았는데도 숨이 참)", "I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)"), scale: "불안" },
      { num: 5,  content: t("무언가를 해야겠다는 의욕이 들지 않았다", "I found it difficult to work up the initiative to do things"), scale: "우울" },
      { num: 6,  content: t("사소한 일에도 과민반응을 보이는 경향이 있었다", "I tended to over-react to situations"), scale: "스트레스" },
      { num: 7,  content: t("손이 떨렸다 (예: 글을 쓸 때)", "I experienced trembling (e.g., in the hands)"), scale: "불안" },
      { num: 8,  content: t("신경을 많이 쓰고 있다는 느낌이 들었다", "I felt that I was using a lot of nervous energy"), scale: "스트레스" },
      { num: 9,  content: t("나쁜 일이 일어날까봐 걱정스러웠다", "I was worried about situations in which I might panic and make a fool of myself"), scale: "불안" },
      { num: 10, content: t("삶에 대해 열정을 느낄 수 없었다", "I felt that I had nothing to look forward to"), scale: "우울" },
      { num: 11, content: t("쉽게 동요하게 되었다", "I found myself getting agitated"), scale: "스트레스" },
      { num: 12, content: t("긴장을 풀기 어려웠다", "I found it difficult to relax"), scale: "스트레스" },
      { num: 13, content: t("우울하고 슬펐다", "I felt down-hearted and blue"), scale: "우울" },
      { num: 14, content: t("내가 좋아하는 것을 방해받는 것에 대해 참을 수 없었다", "I was intolerant of anything that kept me from getting on with what I was doing"), scale: "스트레스" },
      { num: 15, content: t("공황상태에 빠질 것만 같았다", "I felt I was close to panic"), scale: "불안" },
      { num: 16, content: t("어떤 것에도 기대할 것이 없었다", "I was unable to become enthusiastic about anything"), scale: "우울" },
      { num: 17, content: t("나 자신이 가치가 없는 사람으로 느껴졌다", "I felt I wasn't worth much as a person"), scale: "우울" },
      { num: 18, content: t("사소한 일에도 쉽게 언짢아졌다", "I felt that I was rather touchy"), scale: "스트레스" },
      { num: 19, content: t("심장이 이유 없이 두근거렸다 (예: 심장 박동수가 증가하거나 빠르게 뛰는 느낌)", "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)"), scale: "불안" },
      { num: 20, content: t("이유 없이 무서웠다", "I felt scared without any good reason"), scale: "불안" },
      { num: 21, content: t("삶이 무의미하게 느껴졌다", "I felt that life was meaningless"), scale: "우울" },
    ];

  const big5Q = [
      // 외향성 (Extraversion) - 10문항
      { num: 1,  content: t("나는 파티의 주인공이다", "I am the life of the party"), factor: "외향성", rev: false },
      { num: 2,  content: t("나는 다른 사람들과 대화하는 것을 좋아하지 않는다", "I don't talk a lot"), factor: "외향성", rev: true },
      { num: 3,  content: t("나는 편안하게 사람들과 어울린다", "I feel comfortable around people"), factor: "외향성", rev: false },
      { num: 4,  content: t("나는 배경에 머물러 있다", "I keep in the background"), factor: "외향성", rev: true },
      { num: 5,  content: t("나는 대화를 시작한다", "I start conversations"), factor: "외향성", rev: false },
      { num: 6,  content: t("나는 많은 사람들에게 말을 거의 하지 않는다", "I have little to say"), factor: "외향성", rev: true },
      { num: 7,  content: t("나는 많은 사람들과 대화하는 것이 좋다", "I talk to a lot of different people at parties"), factor: "외향성", rev: false },
      { num: 8,  content: t("나는 대화를 시작하는 것을 어려워한다", "I don't like to draw attention to myself"), factor: "외향성", rev: true },
      { num: 9,  content: t("나는 관심의 중심이 되는 것을 좋아한다", "I don't mind being the center of attention"), factor: "외향성", rev: false },
      { num: 10, content: t("나는 낯선 사람과 말하고 싶지 않다", "I am quiet around strangers"), factor: "외향성", rev: true },

      // 친화성 (Agreeableness) - 10문항
      { num: 11, content: t("나는 다른 사람들의 감정에 관심이 있다", "I am interested in other people's feelings"), factor: "친화성", rev: false },
      { num: 12, content: t("나는 다른 사람들의 감정에 관심이 없다", "I am not interested in other people's feelings"), factor: "친화성", rev: true },
      { num: 13, content: t("나는 다른 사람들을 편안하게 해준다", "I make people feel at ease"), factor: "친화성", rev: false },
      { num: 14, content: t("나는 다른 사람들을 모욕한다", "I insult people"), factor: "친화성", rev: true },
      { num: 15, content: t("나는 사람들의 마음을 부드럽게 한다", "I have a warm, gentle nature"), factor: "친화성", rev: false },
      { num: 16, content: t("나는 다른 사람들에게 별 관심이 없다", "I am indifferent to other people's concerns"), factor: "친화성", rev: true },
      { num: 17, content: t("나는 다른 사람들에게 시간을 내준다", "I find time for others"), factor: "친화성", rev: false },
      { num: 18, content: t("나는 다른 사람들의 문제에 신경 쓰지 않는다", "I don't care about other people's problems"), factor: "친화성", rev: true },
      { num: 19, content: t("나는 다른 사람들을 느끼고 이해한다", "I understand others' feelings easily"), factor: "친화성", rev: false },
      { num: 20, content: t("나는 다른 사람들에게 차갑고 무관심하다", "I am cold and indifferent to others"), factor: "친화성", rev: true },

      // 성실성 (Conscientiousness) - 10문항
      { num: 21, content: t("나는 항상 준비되어 있다", "I am always prepared"), factor: "성실성", rev: false },
      { num: 22, content: t("나는 내 물건을 어질러 놓는다", "I leave my belongings around"), factor: "성실성", rev: true },
      { num: 23, content: t("나는 세부사항에 주의를 기울인다", "I pay attention to details"), factor: "성실성", rev: false },
      { num: 24, content: t("나는 종종 물건을 어디에 두었는지 잊어버린다", "I often forget where I put things"), factor: "성실성", rev: true },
      { num: 25, content: t("나는 일을 제때 끝낸다", "I get things done right away"), factor: "성실성", rev: false },
      { num: 26, content: t("나는 일을 망치곤 한다", "I often make a mess of things"), factor: "성실성", rev: true },
      { num: 27, content: t("나는 일에 진지하게 임한다", "I take my work seriously"), factor: "성실성", rev: false },
      { num: 28, content: t("나는 내 의무를 회피한다", "I shirk my duties"), factor: "성실성", rev: true },
      { num: 29, content: t("나는 계획을 따른다", "I follow a plan"), factor: "성실성", rev: false },
      { num: 30, content: t("나는 즉시 일을 시작하지 않는다", "I don't start tasks right away"), factor: "성실성", rev: true },

      // 신경성 (Neuroticism) - 10문항
      { num: 31, content: t("나는 쉽게 스트레스를 받는다", "I get stressed out easily"), factor: "신경성", rev: false },
      { num: 32, content: t("나는 쉽게 진정한다", "I calm down easily"), factor: "신경성", rev: true },
      { num: 33, content: t("나는 변화에 쉽게 동요한다", "I am easily upset"), factor: "신경성", rev: false },
      { num: 34, content: t("나는 거의 걱정하지 않는다", "I rarely worry about things"), factor: "신경성", rev: true },
      { num: 35, content: t("나는 쉽게 짜증이 난다", "I get irritated easily"), factor: "신경성", rev: false },
      { num: 36, content: t("나는 대부분의 경우 편안하다", "I am relaxed most of the time"), factor: "신경성", rev: true },
      { num: 37, content: t("나는 긴장감을 자주 느낀다", "I often feel tense"), factor: "신경성", rev: false },
      { num: 38, content: t("나는 두려움을 거의 느끼지 않는다", "I rarely feel afraid"), factor: "신경성", rev: true },
      { num: 39, content: t("나는 작은 일에도 걱정한다", "I worry a lot"), factor: "신경성", rev: false },
      { num: 40, content: t("나는 항상 여유롭다", "I am always at ease"), factor: "신경성", rev: true },

      // 개방성 (Openness) - 10문항
      { num: 41, content: t("나는 풍부한 어휘력을 가지고 있다", "I have a rich vocabulary"), factor: "개방성", rev: false },
      { num: 42, content: t("나는 추상적인 아이디어를 이해하기 어렵다", "I find abstract ideas difficult to understand"), factor: "개방성", rev: true },
      { num: 43, content: t("나는 생생한 상상력을 가지고 있다", "I have a vivid imagination"), factor: "개방성", rev: false },
      { num: 44, content: t("나는 새로운 것에 관심이 없다", "I am not interested in new things"), factor: "개방성", rev: true },
      { num: 45, content: t("나는 많은 것에 대해 생각한다", "I think a lot"), factor: "개방성", rev: false },
      { num: 46, content: t("나는 예술에 관심이 없다", "I am not interested in art"), factor: "개방성", rev: true },
      { num: 47, content: t("나는 철학적 논의를 즐긴다", "I enjoy philosophical discussions"), factor: "개방성", rev: false },
      { num: 48, content: t("나는 복잡한 것을 좋아하지 않는다", "I don't like complex things"), factor: "개방성", rev: true },
      { num: 49, content: t("나는 빠른 이해력을 가지고 있다", "I understand things quickly"), factor: "개방성", rev: false },
      { num: 50, content: t("나는 창의적인 해결책을 찾기 어렵다", "I find it difficult to come up with creative solutions"), factor: "개방성", rev: true },
    ];

  // SDRI 소척도 정의 (문장완성형 문항번호 매핑)
  const sdriCompletionCategories = {
    "자기입장 유지": [1,2,3,8,9,11,12,15,16,18,19,20,21,23,24,25],
    "정서반응성":    [4,5,6,7,10],
    "정서적 단절":   [13,17,22],
    "융합·관계의존": [14],
  };

  const sdriCompletionQ = [
    // ── 자기입장 유지 (16문항) ──────────────────────────────
    { num:1,  prompt:"갈등 상황에서 나는",                       scale:"자기입장 유지" },
    { num:2,  prompt:"가족이 내 계획에 반대하면, 나는",           scale:"자기입장 유지" },
    { num:3,  prompt:"중요한 결정을 할 때 나는",                  scale:"자기입장 유지" },
    { num:8,  prompt:"요구가 지나치게 무리하다고 느낄 때 나는",   scale:"자기입장 유지" },
    { num:9,  prompt:"상대가 먼저 사과하지 않으면, 나는",         scale:"자기입장 유지" },
    { num:11, prompt:"내 생각과 다른 의견이 강하게 제시되면, 나는", scale:"자기입장 유지" },
    { num:12, prompt:"설득해야 할 목표가 있을 때, 나는",          scale:"자기입장 유지" },
    { num:15, prompt:"누군가 나를 기다리게 하면, 나는",           scale:"자기입장 유지" },
    { num:16, prompt:"약속한 일을 완수하지 못할 것 같으면, 나는", scale:"자기입장 유지" },
    { num:18, prompt:"어려운 일을 맡으면, 나는",                  scale:"자기입장 유지" },
    { num:19, prompt:"중요한 일에서 실망을 느낄 때, 나는",        scale:"자기입장 유지" },
    { num:20, prompt:"사람이 많은 모임에서 의견이 엇갈리면, 나는", scale:"자기입장 유지" },
    { num:21, prompt:"친한 사람과 의견이 갈라지면, 나는",         scale:"자기입장 유지" },
    { num:23, prompt:"책임을 떠넘기고 싶을 때, 나는",             scale:"자기입장 유지" },
    { num:24, prompt:"문제가 복잡해지면, 나는",                   scale:"자기입장 유지" },
    { num:25, prompt:"힘든 상황에서, 나는",                       scale:"자기입장 유지" },
    // ── 정서반응성 (5문항) ──────────────────────────────────
    { num:4,  prompt:"내가 실수를 하면, 나는",                    scale:"정서반응성" },
    { num:5,  prompt:"친구가 나를 비난하면, 나는",                scale:"정서반응성" },
    { num:6,  prompt:"압박감을 느낄 때, 나는",                    scale:"정서반응성" },
    { num:7,  prompt:"감정이 북받칠 때 나는",                     scale:"정서반응성" },
    { num:10, prompt:"일이 잘 풀리지 않으면, 나는",               scale:"정서반응성" },
    // ── 정서적 단절 (3문항) ─────────────────────────────────
    { num:13, prompt:"타인이 나를 무시하면, 나는",                scale:"정서적 단절" },
    { num:17, prompt:"타인이 화를 내면, 나는",                    scale:"정서적 단절" },
    { num:22, prompt:"스트레스를 받을 때, 나는",                  scale:"정서적 단절" },
    // ── 융합·관계의존 (1문항) ───────────────────────────────
    { num:14, prompt:"친구가 나에게 지나치게 의존하면, 나는",     scale:"융합·관계의존" },
  ];

  const sdriLikertQ = [
  // ── 자기입장 유지 ───────────────────────────────────────
  { num:1,  content:"가족·친구와 의견이 달라도 나는 의연하게 내 생각을 표현한다.",      en:"Even when my family or friends disagree, I calmly express my own views.",                       scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:2,  content:"상대의 요구에 쉽게 휘둘리지 않는다.",                            en:"I am not easily swayed by others' demands.",                                                      scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:5,  content:"중요한 목표를 위해서는 사람들이 뭐라 하든 내 기준을 고수한다.",   en:"I hold to my own standards regardless of what others say, when it matters.",                     scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:6,  content:"나는 보통 상대의 기대에 먼저 내 생각을 맞추는 편이다.",          en:"I usually adjust my thinking to fit others' expectations first.",                                 scale:"자기입장 유지", scaleEn:"Self-Position", rev:true  },
  { num:8,  content:"어려운 상황에서도 나는 대화를 통해 문제를 해결하려 한다.",        en:"Even in difficult situations, I try to resolve problems through dialogue.",                       scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:12, content:"내 기분이 나빠도 중요한 약속은 미루지 않고 지키려 한다.",         en:"Even when I'm in a bad mood, I keep important commitments without delay.",                        scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:15, content:"가족이나 친구가 내 생각과 달라도 나는 내 입장을 유지한다.",       en:"I maintain my position even when family or friends think differently.",                           scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:18, content:"내 의견이 틀릴 수도 있지만, 우선 내 기준을 지키려고 한다.",      en:"My opinion may be wrong, but I still try to uphold my own standards first.",                      scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:21, content:"타인을 먼저 만족시키기보다 우선 내 기준을 지킨다.",              en:"I uphold my own standards before trying to satisfy others.",                                       scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  { num:24, content:"중요한 결정을 내리기 전에는 혼자 충분히 고민한다.",              en:"Before making important decisions, I take time to reflect on my own.",                             scale:"자기입장 유지", scaleEn:"Self-Position", rev:false },
  // ── 정서반응성 ─────────────────────────────────────────
  { num:3,  content:"갈등 상황에서도 나는 감정적 폭발을 억누르고 상황을 정리하려 한다.", en:"Even in conflict, I suppress emotional outbursts and try to calm the situation.",               scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:7,  content:"다른 사람의 말 한마디에 나는 쉽게 기분이 달라진다.",             en:"My mood is easily changed by a single word from someone else.",                                    scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:9,  content:"화가 나도 나는 곧바로 감정을 터뜨리지 않는다.",                 en:"Even when angry, I do not immediately express my emotions.",                                       scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:14, content:"갈등 시 나는 감정을 억제하고 대화를 이어가려 한다.",             en:"During conflict, I suppress my emotions and try to continue the conversation.",                    scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:16, content:"내 기분에 따라 주변 사람들의 행동이 쉽게 달라진다.",             en:"My mood easily affects how the people around me behave.",                                          scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:23, content:"친구가 화를 내면 나는 바로 우울해진다.",                        en:"When a friend gets angry, I immediately feel depressed.",                                          scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  { num:25, content:"긴장되는 상황에서는 혼자만의 시간을 가지며 마음을 가라앉힌다.",  en:"In tense situations, I take time alone to calm my mind.",                                         scale:"정서반응성", scaleEn:"Emotional Reactivity", rev:false },
  // ── 정서적 단절 ────────────────────────────────────────
  { num:4,  content:"스트레스 상황이 되면 나는 대인관계에서 거리를 두려는 편이다.",    en:"When stressed, I tend to distance myself from others.",                                           scale:"정서적 단절", scaleEn:"Emotional Cutoff", rev:false },
  { num:10, content:"갈등이 생기면 나는 먼저 뒤로 물러서는 편이다.",                 en:"When conflict arises, I tend to step back first.",                                                 scale:"정서적 단절", scaleEn:"Emotional Cutoff", rev:true  },
  { num:17, content:"갈등이 생기면 나는 혼자 생각에 잠기며 자리를 피하려 든다.",      en:"When conflict arises, I tend to withdraw and lose myself in thought.",                            scale:"정서적 단절", scaleEn:"Emotional Cutoff", rev:false },
  { num:22, content:"혼자 있으면 편하지만, 가족 모임 등에는 부담을 느낀다.",          en:"I'm comfortable alone but feel burdened by family gatherings and similar events.",                 scale:"정서적 단절", scaleEn:"Emotional Cutoff", rev:true  },
  // ── 융합·관계의존 ──────────────────────────────────────
  { num:11, content:"사람들의 부탁을 거절하기 어려운 편이다.",                        en:"I find it difficult to refuse others' requests.",                                                  scale:"융합·관계의존", scaleEn:"Fusion/Dependence", rev:true  },
  { num:13, content:"타인이 먼저 양보해 주지 않으면 보통 내가 먼저 양보한다.",         en:"If others don't yield first, I usually yield first.",                                              scale:"융합·관계의존", scaleEn:"Fusion/Dependence", rev:true  },
  { num:19, content:"타인의 감정에 너무 쉽게 동조하는 편이다.",                       en:"I tend to go along with others' emotions too easily.",                                             scale:"융합·관계의존", scaleEn:"Fusion/Dependence", rev:false },
  { num:20, content:"사람들을 기쁘게 하기 위해 가끔 내 생각을 접어둔다.",             en:"I sometimes set aside my own views to please others.",                                             scale:"융합·관계의존", scaleEn:"Fusion/Dependence", rev:false },
];

  const burnoutQ = [
      // I. 정서적 소진 (12문항)
      { num: 1,  content: "업무로 인해 감정적으로 완전히 소진된 느낌이 든다",                en: "I feel emotionally drained by my work.",                                                                  domain: "EE", rev: false },
      { num: 2,  content: "퇴근 후에도 업무 생각으로 머리가 꽉 차 있다",                    en: "Even after work, my mind is filled with work-related thoughts.",                                          domain: "EE", rev: false },
      { num: 3,  content: "아침에 출근할 생각만 해도 기력이 없고 피곤하다",                  en: "Just thinking about going to work in the morning makes me feel tired.",                                    domain: "EE", rev: false },
      { num: 4,  content: "하루 종일 일하고 나면 극도로 지쳐 아무것도 하기 싫다",            en: "After working all day, I feel so exhausted I don't want to do anything.",                                  domain: "EE", rev: false },
      { num: 5,  content: "사람들을 응대하거나 돕는 것이 감정적으로 너무 힘들다",            en: "Dealing with or helping people is emotionally too draining.",                                              domain: "EE", rev: false },
      { num: 6,  content: "직장 생활이 나를 내부에서 태워 없애는 느낌이 든다",              en: "My work life feels like it is burning me out from the inside.",                                            domain: "EE", rev: false },
      { num: 7,  content: "감정을 쏟아내다가 이제 더 이상 줄 것이 없다는 느낌이 든다",      en: "I feel I have nothing left to give emotionally.",                                                          domain: "EE", rev: false },
      { num: 8,  content: "업무나 동료에 대한 정서적 여유가 전혀 없다",                      en: "I have no emotional capacity left for my work or colleagues.",                                             domain: "EE", rev: false },
      { num: 9,  content: "일과 중 작은 일에도 감정적으로 폭발할 것 같다",                  en: "Even minor things at work feel like they could push me to an emotional breaking point.",                   domain: "EE", rev: false },
      { num: 10, content: "직장 일이 나의 개인 삶 전체를 잠식하는 것 같다",                  en: "Work feels like it is consuming my entire personal life.",                                                 domain: "EE", rev: false },
      { num: 11, content: "이직이나 퇴직을 진지하게 고민하고 있다",                          en: "I am seriously considering changing jobs or quitting.",                                                    domain: "EE", rev: false },
      { num: 12, content: "업무를 마친 후에도 회복이 되지 않고 지속적으로 지쳐 있다",        en: "Even after finishing work, I cannot recover and remain persistently exhausted.",                           domain: "EE", rev: false },
      // II. 비인격화 (8문항)
      { num: 13, content: "고객이나 동료가 마치 무감각한 대상처럼 느껴진다",                en: "Clients or colleagues feel like impersonal objects to me.",                                                domain: "DP", rev: false },
      { num: 14, content: "요즘 들어 나 자신이 점점 냉담하고 무감각해졌다",                  en: "Lately I have become increasingly cold and emotionally numb.",                                             domain: "DP", rev: false },
      { num: 15, content: "업무 관련 사람들의 문제에 무관심해지거나 귀찮아진다",              en: "I have become indifferent to or annoyed by the problems of people at work.",                               domain: "DP", rev: false },
      { num: 16, content: "사람을 대하는 일이 내 에너지를 심하게 소모시킨다",                en: "Dealing with people drains my energy severely.",                                                           domain: "DP", rev: false },
      { num: 17, content: "회사나 조직의 방향성·목표가 무의미하게 느껴진다",                en: "The direction and goals of my company or organization feel meaningless.",                                   domain: "DP", rev: false },
      { num: 18, content: "이 직장이 나에게 아무 의미도 없다는 생각이 든다",                en: "I feel that this job means nothing to me.",                                                                domain: "DP", rev: false },
      { num: 19, content: "사람들의 감정적 문제에 실제로 관심이 없어졌다",                  en: "I have genuinely lost interest in people's emotional problems.",                                           domain: "DP", rev: false },
      { num: 20, content: "일하면서 점점 공감 능력을 잃어가는 것 같다",                      en: "I feel like I am gradually losing my ability to empathize at work.",                                       domain: "DP", rev: false },
      // III. 성취감 저하 (10문항, 역채점)
      { num: 21, content: "이 일을 통해 다른 사람의 삶에 긍정적인 영향을 준다고 느낀다",    en: "I feel I am positively influencing others' lives through my work.",                                        domain: "PA", rev: true  },
      { num: 22, content: "업무에서 가치 있는 일을 해내고 있다는 보람을 느낀다",            en: "I feel a sense of fulfillment in doing worthwhile work.",                                                  domain: "PA", rev: true  },
      { num: 23, content: "어려운 문제를 스스로 해결했을 때 뿌듯함을 느낀다",              en: "I feel proud when I solve a difficult problem on my own.",                                                 domain: "PA", rev: true  },
      { num: 24, content: "내 업무가 조직에 의미 있게 기여한다고 생각한다",                  en: "I believe my work contributes meaningfully to the organization.",                                          domain: "PA", rev: true  },
      { num: 25, content: "직장에서 나 자신이 성장하고 있다는 느낌이 든다",                  en: "I feel I am growing as a person at work.",                                                                domain: "PA", rev: true  },
      { num: 26, content: "업무 중 즐거움이나 몰입을 경험한다",                              en: "I experience enjoyment or flow during my work.",                                                          domain: "PA", rev: true  },
      { num: 27, content: "내 직업 선택이 옳았다는 확신이 있다",                            en: "I am confident that I made the right career choice.",                                                     domain: "PA", rev: true  },
      { num: 28, content: "사람들을 효과적으로 도왔다는 만족감을 느낀다",                    en: "I feel satisfied that I have helped people effectively.",                                                  domain: "PA", rev: true  },
      { num: 29, content: "이 일을 통해 내가 사회에 기여하고 있다는 자긍심이 있다",          en: "I take pride in contributing to society through my work.",                                                 domain: "PA", rev: true  },
      { num: 30, content: "현재 내 역량이 잘 발휘되고 있다고 느낀다",                        en: "I feel my abilities are being well utilized right now.",                                                   domain: "PA", rev: true  },
      // IV. 업무 과부하 (10문항)
      { num: 31, content: "업무량이 나 혼자 감당하기에 너무 많다",                          en: "The workload is too much for me to handle on my own.",                                                    domain: "WO", rev: false },
      { num: 32, content: "업무 마감이나 요구사항이 불합리하게 느껴진다",                    en: "Work deadlines or requirements feel unreasonable.",                                                        domain: "WO", rev: false },
      { num: 33, content: "업무 방식이나 우선순위에 대한 결정권이 없다고 느낀다",            en: "I feel I have no say in how I work or what to prioritize.",                                               domain: "WO", rev: false },
      { num: 34, content: "야근이나 초과 근무가 일상화되어 있다",                            en: "Overtime or overwork has become a daily norm.",                                                           domain: "WO", rev: false },
      { num: 35, content: "모순되거나 충돌하는 업무 지시를 동시에 받는다",                  en: "I receive contradictory or conflicting work instructions simultaneously.",                                  domain: "WO", rev: false },
      { num: 36, content: "업무 성과에 비해 인정·보상이 부족하다고 느낀다",                en: "I feel underrecognized or underrewarded relative to my performance.",                                      domain: "WO", rev: false },
      { num: 37, content: "직장 내 공정성이 부족하다고 느낀다",                              en: "I feel there is a lack of fairness in my workplace.",                                                     domain: "WO", rev: false },
      { num: 38, content: "개인 삶과 업무 간의 균형을 맞추기 어렵다",                        en: "I find it difficult to maintain a balance between personal life and work.",                                 domain: "WO", rev: false },
      { num: 39, content: "업무 중 지속적인 방해나 중단으로 집중이 불가능하다",              en: "Constant interruptions at work make it impossible to concentrate.",                                         domain: "WO", rev: false },
      { num: 40, content: "조직의 가치관이 내 개인 가치관과 심하게 충돌한다",                en: "The organization's values seriously conflict with my personal values.",                                     domain: "WO", rev: false },
      // V. 신체·인지 (10문항)
      { num: 41, content: "충분히 잤는데도 개운하지 않고 지속적으로 피로하다",              en: "Even after enough sleep, I still feel unrefreshed and persistently tired.",                                 domain: "PC", rev: false },
      { num: 42, content: "두통, 근육 긴장, 어깨·목 통증이 자주 생긴다",                    en: "I frequently experience headaches, muscle tension, or shoulder and neck pain.",                             domain: "PC", rev: false },
      { num: 43, content: "업무 중 기억력이나 집중력이 현저히 저하된 것 같다",              en: "My memory and concentration seem significantly impaired at work.",                                          domain: "PC", rev: false },
      { num: 44, content: "소화불량, 위경련, 식욕 변화 등 소화 문제가 있다",                en: "I have digestive issues such as indigestion, stomach cramps, or changes in appetite.",                     domain: "PC", rev: false },
      { num: 45, content: "잠들기 어렵거나 중간에 자꾸 깬다",                              en: "I have trouble falling asleep or wake up frequently during the night.",                                    domain: "PC", rev: false },
      { num: 46, content: "면역력이 떨어져 자주 감기나 잔병에 걸린다",                      en: "My immunity seems weakened and I frequently catch colds or minor illnesses.",                               domain: "PC", rev: false },
      { num: 47, content: "카페인·알코올·약물에 점점 더 의존하게 된다",                    en: "I am becoming increasingly dependent on caffeine, alcohol, or other substances.",                           domain: "PC", rev: false },
      { num: 48, content: "업무 외 취미·운동 등 즐기던 활동을 완전히 포기했다",            en: "I have completely given up hobbies or activities I used to enjoy outside of work.",                         domain: "PC", rev: false },
      { num: 49, content: "간단한 결정도 내리기 어렵고 판단력이 흐려졌다",                  en: "Even simple decisions are hard to make and my judgment feels clouded.",                                    domain: "PC", rev: false },
      { num: 50, content: "심장 두근거림, 식은땀, 만성 긴장감 등 신체 증상이 있다",          en: "I experience physical symptoms such as heart palpitations, cold sweats, or chronic tension.",               domain: "PC", rev: false },
    ];

  const lostQ = [
      // ── 축 1. 에너지 방향 (Energy Direction)
      { num:1,  content:t("낯선 사람들과 쉽게 어울리며 에너지를 얻는다", "I easily socialize with strangers and gain energy from it"), axis:"E", dir:"E", rev:false },
      { num:2,  content:t("혼자 조용히 지내면 오히려 마음이 편안하다", "Spending time alone quietly feels more comfortable to me"), axis:"E", dir:"I", rev:true  },
      { num:3,  content:t("파티나 모임에 가면 활기가 생긴다", "I feel energized at parties or gatherings"), axis:"E", dir:"E", rev:false },
      { num:4,  content:t("큰 모임보다 친한 친구 몇 명과 시간 보내는 것을 선호한다", "I prefer spending time with a few close friends over large groups"), axis:"E", dir:"I", rev:true  },
      { num:5,  content:t("새로운 사람과 대화하면 금방 친해지는 편이다", "I warm up to new people quickly in conversation"), axis:"E", dir:"E", rev:false },
      { num:6,  content:t("사람들 앞에서 이야기할 때 긴장한다", "I feel nervous speaking in front of others"), axis:"E", dir:"I", rev:true  },
      { num:7,  content:t("친목 모임에서 주도적으로 행동하는 편이다", "I tend to take the lead at social events"), axis:"E", dir:"E", rev:false },
      { num:8,  content:t("오랜만에 만난 친한 친구보다 혼자 쉬는 것이 더 좋다", "I prefer resting alone over meeting a close friend I haven't seen in a while"), axis:"E", dir:"I", rev:true  },
      { num:9,  content:t("낯선 환경에서 처음 만난 사람들과 빨리 친해진다", "I make friends quickly in unfamiliar settings"), axis:"E", dir:"E", rev:false },
      { num:10, content:t("혼자만의 시간이 부족하면 금방 지친다", "If I don't get enough alone time, I feel drained quickly"), axis:"E", dir:"I", rev:true  },

      // ── 축 2. 의사결정 방식 (Decision Style)
      { num:11, content:t("결정을 내릴 때 감정보다 사실과 논리를 우선한다", "When making decisions, I prioritize facts and logic over emotions"), axis:"D", dir:"T", rev:false },
      { num:12, content:t("데이터와 사실을 기반으로 결정을 내리는 편이다", "I tend to make decisions based on data and facts"), axis:"D", dir:"T", rev:false },
      { num:13, content:t("중요한 결정을 할 때 주변 사람들의 감정도 함께 고려한다", "When making important decisions, I also consider the feelings of people around me"), axis:"D", dir:"F", rev:true  },
      { num:14, content:t("감정이나 분위기에 따라 내 판단이 크게 달라지는 편이다", "My judgments are often strongly influenced by emotions or mood"), axis:"D", dir:"F", rev:true  },
      { num:15, content:t("문제를 분석할 때 감정보다 이성이 앞선다", "When analyzing problems, reason takes precedence over emotion"), axis:"D", dir:"T", rev:false },
      { num:16, content:t("의사결정에서 타인의 기분과 조화를 이루려 한다", "I try to maintain harmony with others' feelings in decision-making"), axis:"D", dir:"F", rev:true  },
      { num:17, content:t("논리적 설명이 없으면 중요한 결정을 믿기 어렵다", "Without a logical explanation, I find it hard to trust important decisions"), axis:"D", dir:"T", rev:false },
      { num:18, content:t("다른 사람이 우울해 보이면 내 기분도 영향을 받는다", "When someone around me seems sad, my own mood is affected"), axis:"D", dir:"F", rev:true  },
      { num:19, content:t("객관적인 데이터가 없으면 결정을 내리기 어렵다", "Without objective data, I find it hard to make decisions"), axis:"D", dir:"T", rev:false },
      { num:20, content:t("나를 화나게 한 사람을 쉽게 용서해 주지 못한다", "I have difficulty forgiving someone who has upset me"), axis:"D", dir:"F", rev:false },

      // ── 축 3. 행동 속도 (Action Speed)
      { num:21, content:t("급한 일이 생기면 즉시 행동하는 편이다", "When something urgent comes up, I act immediately"), axis:"S", dir:"P", rev:false },
      { num:22, content:t("충분히 계획하지 않으면 불안해서 실행하기 어렵다", "Without sufficient planning, I feel anxious and struggle to act"), axis:"S", dir:"J", rev:true  },
      { num:23, content:t("일을 할 때 신속함보다 꼼꼼함이 더 중요하다고 생각한다", "I think thoroughness is more important than speed when doing work"), axis:"S", dir:"J", rev:true  },
      { num:24, content:t("일을 처리할 때 즉흥적으로 진행하는 것을 좋아한다", "I enjoy proceeding with tasks spontaneously"), axis:"S", dir:"P", rev:false },
      { num:25, content:t("계획대로 움직이는 것보다 빠르게 결정을 바꾸는 편이다", "I tend to change decisions quickly rather than stick to a plan"), axis:"S", dir:"P", rev:false },
      { num:26, content:t("시간이 허락할 때는 깊이 고민한 뒤 행동한다", "When time allows, I prefer to think deeply before acting"), axis:"S", dir:"J", rev:true  },
      { num:27, content:t("마감이 임박하면 효율보다 속도를 중시한다", "When a deadline is near, I prioritize speed over thoroughness"), axis:"S", dir:"P", rev:false },
      { num:28, content:t("충동적으로 결정하면 나중에 후회할 때가 많다", "I often regret impulsive decisions later"), axis:"S", dir:"J", rev:true  },
      { num:29, content:t("빠른 실행은 중요하지만 실수가 생길까 걱정된다", "Quick execution matters, but I worry about making mistakes"), axis:"S", dir:"J", rev:true  },
      { num:30, content:t("상황에 따라 행동 방식을 즉시 바꾸는 편이다", "I tend to change my approach immediately depending on the situation"), axis:"S", dir:"P", rev:false },

      // ── 축 4. 안정성 (Stability)
      { num:31, content:t("변화는 나를 설레게 한다", "Change excites me"), axis:"N", dir:"C", rev:false },
      { num:32, content:t("익숙한 환경이 안전하다고 느낀다", "Familiar environments feel safe to me"), axis:"N", dir:"N", rev:true  },
      { num:33, content:t("새로운 도전이 주는 자극을 즐긴다", "I enjoy the stimulation that new challenges bring"), axis:"N", dir:"C", rev:false },
      { num:34, content:t("안정적인 일과를 벗어나면 불안감이 크다", "Stepping away from a stable routine makes me anxious"), axis:"N", dir:"N", rev:true  },
      { num:35, content:t("새로운 프로젝트보다 익숙한 일에 집중하는 편이다", "I tend to focus on familiar tasks rather than new projects"), axis:"N", dir:"N", rev:true  },
      { num:36, content:t("변화를 맞이할 때 흥미를 느낀다", "I feel excited when facing change"), axis:"N", dir:"C", rev:false },
      { num:37, content:t("예측 가능한 환경에서 일하는 것이 편안하다", "Working in a predictable environment feels comfortable"), axis:"N", dir:"N", rev:true  },
      { num:38, content:t("일상의 틀에서 벗어나 새로운 방식을 시도한다", "I step outside my daily routine to try new approaches"), axis:"N", dir:"C", rev:false },
      { num:39, content:t("새로운 아이디어가 떠오르면 신나지만 걱정도 된다", "New ideas excite me, but I also feel some worry"), axis:"N", dir:"C", rev:false },
      { num:40, content:t("일상의 변화가 크면 긴장한다", "Large changes in my daily routine make me tense"), axis:"N", dir:"N", rev:true  },

      // ── 축 5. 관계 민감도 (Relation Sensitivity)
      { num:41, content:t("팀의 목표를 위해 다른 사람과 협력하는 것을 중요하게 생각한다", "I believe cooperation with others is important for achieving team goals"), axis:"R", dir:"R", rev:false },
      { num:42, content:t("내 생각을 고집하기보다 주변 의견에 따라 결정을 바꾸기도 한다", "I sometimes change my decisions based on others' opinions rather than insisting on my own"), axis:"R", dir:"R", rev:false },
      { num:43, content:t("혼자 일하는 것보다 팀워크가 잘 맞는 일을 좋아한다", "I prefer teamwork-oriented work over working alone"), axis:"R", dir:"R", rev:false },
      { num:44, content:t("중요한 결정은 주로 나 혼자 판단으로 한다", "I mostly make important decisions on my own judgment"), axis:"R", dir:"I", rev:true  },
      { num:45, content:t("동료나 친구와의 조화를 위해 양보하는 경우가 많다", "I often compromise to maintain harmony with colleagues or friends"), axis:"R", dir:"R", rev:false },
      { num:46, content:t("자신의 의견보다 팀의 목표를 우선한다", "I prioritize team goals over my personal opinions"), axis:"R", dir:"R", rev:false },
      { num:47, content:t("반드시 다른 사람의 도움 없이 처리하고 싶어 하는 편이다", "I prefer to handle things on my own without others' help"), axis:"R", dir:"I", rev:true  },
      { num:48, content:t("친밀한 관계를 맺는 것이 나에게 큰 의미가 있다", "Building close relationships is very meaningful to me"), axis:"R", dir:"R", rev:false },
      { num:49, content:t("혼자 있을 때 오히려 더 생산적이라고 느낀다", "I feel more productive when I'm alone"), axis:"R", dir:"I", rev:false },
      { num:50, content:t("다른 사람의 기분을 금방 파악하는 편이다", "I quickly pick up on others' moods"), axis:"R", dir:"R", rev:false },

      // ── 축 6. 스트레스 반응 (Stress Response)
      { num:51, content:t("문제가 생기면 즉시 피하거나 회피하려고 한다", "When a problem arises, I tend to avoid or escape it immediately"), axis:"T", dir:"V", rev:true  },
      { num:52, content:t("어려운 일이 생기면 바로 대응하면서 해결책을 찾는다", "When something difficult happens, I respond immediately and look for solutions"), axis:"T", dir:"A", rev:false },
      { num:53, content:t("스트레스를 받으면 쉬어야만 진정될 수 있다고 느낀다", "When stressed, I feel I can only calm down by resting"), axis:"T", dir:"V", rev:true  },
      { num:54, content:t("위기 상황에서 침착하게 문제를 해결하려 노력한다", "I try to stay calm and solve problems even in crisis situations"), axis:"T", dir:"A", rev:false },
      { num:55, content:t("갈등 상황은 피해야 한다고 생각한다", "I think conflict situations should be avoided"), axis:"T", dir:"V", rev:true  },
      { num:56, content:t("문제가 생기면 적극적으로 빠르게 해결하려 한다", "When a problem arises, I actively try to resolve it quickly"), axis:"T", dir:"A", rev:false },
      { num:57, content:t("스트레스를 받으면 상황을 회피하고 싶어진다", "When stressed, I want to avoid the situation"), axis:"T", dir:"V", rev:true  },
      { num:58, content:t("곤란한 상황에서도 당면 과제에 집중하는 편이다", "Even in difficult situations, I focus on the task at hand"), axis:"T", dir:"A", rev:false },
      { num:59, content:t("문제 상황에서 주변 사람에게 도움 청하는 것을 꺼린다", "I am reluctant to ask others for help in difficult situations"), axis:"T", dir:"V", rev:true  },
      { num:60, content:t("긴장되는 상황에서도 먼저 해결책을 모색한다", "Even in tense situations, I look for solutions first"), axis:"T", dir:"A", rev:false },
    ];

  function calcPhq9() {
      let total = 0;
      phq9Q.forEach(q => {
        const r = phq9Responses[q.num];
        if (r) total += r;
      });
      let level = t("안정", "Minimal");
      let color = "green";
      if (total >= 20) { level = t("전문 지원 필요", "Severe"); color = "red"; }
      else if (total >= 15) { level = t("적극적 지원 필요", "Moderately Severe"); color = "orange"; }
      else if (total >= 10) { level = t("지원 필요", "Moderate"); color = "orange"; }
      else if (total >= 5) { level = t("주의 필요", "Mild"); color = "yellow"; }
      return { total, level, color };
    }

  function calcGad7() {
      let total = 0;
      gad7Q.forEach(q => {
        const r = gad7Responses[q.num];
        if (r) total += r;
      });
      let level = t("안정", "Minimal");
      let color = "green";
      if (total >= 15) { level = t("전문 지원 필요", "Severe"); color = "red"; }
      else if (total >= 10) { level = t("지원 필요", "Moderate"); color = "orange"; }
      else if (total >= 5) { level = t("주의 필요", "Mild"); color = "yellow"; }
      return { total, level, color };
    }

  function calcDass21() {
      let depression = 0, anxiety = 0, stress = 0;
      dass21Q.forEach(q => {
        const r = dass21Responses[q.num];
        if (r) {
          const score = r - 1; // 0-3 범위로 변환
          if (q.scale === "우울") depression += score;
          else if (q.scale === "불안") anxiety += score;
          else if (q.scale === "스트레스") stress += score;
        }
      });
      // 곱하기 2 (DASS-42 점수로 변환)
      depression *= 2;
      anxiety *= 2;
      stress *= 2;

      const getLevel = (score, type) => {
        const L = (ko, en) => t(ko, en);
        if (type === "우울") {
          if (score >= 28) return { level: L("적극적 지원 필요", "Extremely Severe"), color: "red" };
          if (score >= 21) return { level: L("지원 필요", "Severe"), color: "orange" };
          if (score >= 14) return { level: L("관리 필요", "Moderate"), color: "yellow" };
          if (score >= 10) return { level: L("주의", "Mild"), color: "blue" };
          return { level: L("안정", "Normal"), color: "green" };
        } else if (type === "불안") {
          if (score >= 20) return { level: L("적극적 지원 필요", "Extremely Severe"), color: "red" };
          if (score >= 15) return { level: L("지원 필요", "Severe"), color: "orange" };
          if (score >= 10) return { level: L("관리 필요", "Moderate"), color: "yellow" };
          if (score >= 8) return { level: L("주의", "Mild"), color: "blue" };
          return { level: L("안정", "Normal"), color: "green" };
        } else { // 스트레스
          if (score >= 34) return { level: L("적극적 지원 필요", "Extremely Severe"), color: "red" };
          if (score >= 26) return { level: L("지원 필요", "Severe"), color: "orange" };
          if (score >= 19) return { level: L("관리 필요", "Moderate"), color: "yellow" };
          if (score >= 15) return { level: L("주의", "Mild"), color: "blue" };
          return { level: L("안정", "Normal"), color: "green" };
        }
      };

      return {
        depression: { score: depression, ...getLevel(depression, "우울") },
        anxiety: { score: anxiety, ...getLevel(anxiety, "불안") },
        stress: { score: stress, ...getLevel(stress, "스트레스") }
      };
    }

  function calcBig5() {
      const factors = { "외향성": 0, "친화성": 0, "성실성": 0, "신경성": 0, "개방성": 0 };
      const counts = { "외향성": 0, "친화성": 0, "성실성": 0, "신경성": 0, "개방성": 0 };
    
      big5Q.forEach(q => {
        const r = big5Responses[q.num];
        if (r) {
          const score = q.rev ? (6 - r) : r;
          factors[q.factor] += score;
          counts[q.factor]++;
        }
      });

      // 평균 점수 계산 (1-5 범위)
      Object.keys(factors).forEach(f => {
        if (counts[f] > 0) {
          factors[f] = (factors[f] / counts[f]).toFixed(2);
        }
      });

      return factors;
    }

  function calcBurnout() {
    
      let total = 0;
      const domains = {};
    
      // 영역별 초기화
      const domainConfigs = getBurnoutDomains();
    
      domainConfigs.forEach(d => {
        domains[d.id] = { name: d.name, score: 0, max: d.max, color: d.color };
      });

      burnoutQ.forEach(q => {
        const r = burnoutResponses[q.num];
        if (r !== undefined) {
          const score = q.rev ? (6 - r) : r;
          total += score;
          domains[q.domain].score += score;
        }
      });
    

      // 전체 레벨 판단 (0-240점)
      const percentage = Math.round((total / 240) * 100);
      const pct = total / 240;
      let level = "매우 낮음";
      let levelColor = "#4ade80";
      let levelDesc = "번아웃 위험이 낮습니다. 현재 상태를 잘 유지하세요.";
    
      if (pct >= 0.86) {
        level = "매우 높음";
        levelColor = "#dc2626";
        levelDesc = "소진 신호가 매우 높습니다. 지금 쉬어가는 것이 중요합니다. 전문가 상담을 권합니다.";
      } else if (pct >= 0.71) {
        level = "높음";
        levelColor = "#f97316";
        levelDesc = "높은 수준의 번아웃입니다. 전문 상담을 권장합니다.";
      } else if (pct >= 0.51) {
        level = "보통";
        levelColor = "#f59e0b";
        levelDesc = "번아웃 증상이 보통 수준입니다. 관리가 필요합니다.";
      } else if (pct >= 0.31) {
        level = "낮음";
        levelColor = "#eab308";
        levelDesc = "가벼운 번아웃 증상이 나타나고 있습니다. 주의가 필요합니다.";
      }

      // 각 영역별 레벨 판단 및 설명
      const domainList = [];
      const domainCrisis = [];
    
      Object.entries(domains).forEach(([id, d]) => {
        const domainPct = (d.score / d.max) * 100;
        d.percentage = Math.round(domainPct); // 퍼센테이지 저장
        d.id = id; // 영역 ID 저장
      
        if (domainPct >= 85) {
          d.level = "매우 높음";
          d.description = "이 영역에서 심각한 번아웃 증상을 보이고 있습니다.";
          domainCrisis.push(d.name);
        } else if (domainPct >= 70) {
          d.level = "높음";
          d.description = "이 영역에서 높은 수준의 스트레스를 경험하고 있습니다.";
        } else if (domainPct >= 50) {
          d.level = "보통";
          d.description = "이 영역에서 보통 수준의 피로를 느끼고 있습니다.";
        } else if (domainPct >= 30) {
          d.level = "낮음";
          d.description = "이 영역에서 약간의 스트레스가 있습니다.";
        } else {
          d.level = "매우 낮음";
          d.description = "이 영역은 건강한 상태입니다.";
        }
      
        domainList.push(d);
      });

      const crisis = pct >= 0.75 || domainCrisis.length > 0;

      return { 
        totalScore: total,
        percentage,
        domains: domainList, 
        level, 
        levelColor, 
        levelDesc, 
        crisis,
        domainCrisis
      };
    }

  // SRCI: 문장완성형 완성 수 계산
  function calcSrci() {
    const filled = sdriCompletionQ.filter(q => srciResponses[q.num]?.trim()).length;
    const byScale = {};
    sdriCompletionQ.forEach(q => {
      if (!byScale[q.scale]) byScale[q.scale] = [];
      if (srciResponses[q.num]?.trim()) byScale[q.scale].push({ prompt: q.prompt, answer: srciResponses[q.num] });
    });
    return { filled, total: sdriCompletionQ.length, byScale };
  }

  // SDRI: 평정형 소척도 점수 계산
  function calcSdri() {
    const scales = { "자기입장 유지": 0, "정서반응성": 0, "정서적 단절": 0, "융합·관계의존": 0 };
    const counts = { "자기입장 유지": 0, "정서반응성": 0, "정서적 단절": 0, "융합·관계의존": 0 };
    sdriLikertQ.forEach(q => {
      const r = sdriResponses[q.num];
      if (r) {
        const s = q.rev ? 6 - r : r;
        scales[q.scale] += s;
        counts[q.scale]++;
      }
    });
    const total = Object.values(scales).reduce((a,b) => a+b, 0);
    return { scales, counts, total };
  }

  const LOST_TYPES = {
    ETPR:{ icon:"🦁", name:t("실행 리더","Action Leader"), eng:"Action Leader", desc:t("빠른 실행력과 관계 중심으로 팀을 이끄는 카리스마형 리더입니다.","A charismatic leader who drives results quickly while keeping relationships central."), traits:[t("추진력","Drive"),t("사교성","Sociability"),t("결단력","Decisiveness"),t("팀십","Teamwork")], strength:[t("빠른 의사결정과 실행","Fast decision-making and execution"),t("사람들을 동기부여하는 능력","Ability to motivate people"),t("목표 달성 집중력","Goal-focused concentration")], weakness:[t("급하게 결론 내리는 경향","Tendency to rush to conclusions"),t("타인의 속도를 기다리기 어려움","Difficulty waiting for others"),t("감정보다 결과 우선","Results over feelings")], work:t("팀을 빠르게 움직이며 성과를 만들어냅니다.","Moves the team quickly to deliver results."), love:t("적극적으로 표현하고 파트너를 이끌려는 경향이 있습니다.","Expressive and tends to take the lead in relationships."), stress:t("압박을 받으면 더욱 강하게 밀어붙이거나 지시적이 됩니다.","Under pressure, may push harder or become directive."), match:["IFJR","EFJR"], conflict:["IFJC","IFPC"] },
    ETPC:{ icon:"🦅", name:t("개척자","Pioneer"), eng:"Pioneer", desc:t("논리와 속도로 새로운 길을 여는 독립적인 혁신가입니다.","An independent innovator who opens new paths with logic and speed."), traits:[t("혁신","Innovation"),t("독립성","Independence"),t("속도","Speed"),t("논리","Logic")], strength:[t("새로운 방식으로 문제를 해결","Solving problems in novel ways"),t("빠른 판단과 실행","Quick judgment and action"),t("자기 동기부여","Self-motivation")], weakness:[t("팀워크보다 단독 행동 선호","Prefers solo action over teamwork"),t("타인 감정 고려 부족","May overlook others' feelings"),t("규칙·절차에 답답함 느낌","Frustrated by rules and procedures")], work:t("혼자 빠르게 결과를 만들어내는 역할에 강합니다.","Excels in roles where independent, fast results are needed."), love:t("자유를 중시하며 서로 독립적인 관계를 선호합니다.","Values freedom and prefers mutually independent relationships."), stress:t("압박 시 혼자 해결하려 하거나 상황을 회피합니다.","Under stress, tends to handle things alone or avoid situations."), match:["IFJC","ETJR"], conflict:["IFJR","EFPR"] },
    ETJR:{ icon:"🦊", name:t("전략 조율가","Strategic Coordinator"), eng:"Strategic Coordinator", desc:t("사람과 시스템을 연결하여 체계적으로 목표를 달성하는 유형입니다.","Achieves goals systematically by connecting people and systems."), traits:[t("전략적","Strategic"),t("체계적","Systematic"),t("사교적","Sociable"),t("신중함","Careful")], strength:[t("장기 계획 수립과 실행","Long-term planning and execution"),t("팀 합의 형성","Building team consensus"),t("구조화된 소통","Structured communication")], weakness:[t("유연성이 부족할 수 있음","May lack flexibility"),t("변화에 느리게 적응","Slow to adapt to change"),t("과도한 계획으로 실행 지연","Over-planning can delay action")], work:t("명확한 목표 아래 팀을 조율하며 체계를 만들어갑니다.","Coordinates teams under clear goals to build effective systems."), love:t("안정적이고 계획적인 관계를 지향합니다.","Seeks stable, planned relationships."), stress:t("계획이 어긋날 때 통제를 강화하려는 경향이 있습니다.","When plans go awry, tends to tighten control."), match:["IFPR","EFPR"], conflict:["ETPC","IFPC"] },
    ETJC:{ icon:"🏗️", name:t("시스템 구축자","System Builder"), eng:"System Builder", desc:t("효율적인 구조와 시스템을 설계하는 논리적인 외향가입니다.","A logical extrovert who designs efficient structures and systems."), traits:[t("체계성","Structure"),t("논리","Logic"),t("외향성","Extroversion"),t("독립성","Independence")], strength:[t("복잡한 시스템 설계","Designing complex systems"),t("효율성 최적화","Optimizing efficiency"),t("외부 발표와 소통","Presenting and communicating")], weakness:[t("감정적 요소 간과","Overlooking emotional factors"),t("지나친 완벽주의","Excessive perfectionism"),t("협업보다 지시 선호","Prefers directing over collaborating")], work:t("명확한 역할과 프로세스를 만들어 팀을 이끕니다.","Leads teams by creating clear roles and processes."), love:t("감정보다 실용적인 관점에서 관계를 바라봅니다.","Views relationships from a practical rather than emotional lens."), stress:t("문제를 시스템 오류로 인식하고 재설계하려 합니다.","Sees problems as system errors and tries to redesign."), match:["IFPC","ITPR"], conflict:["EFPR","IFJR"] },
    EFPR:{ icon:"🌟", name:t("관계 활력가","Social Energizer"), eng:"Social Energizer", desc:t("에너지와 감성으로 주변을 밝히는 외향적 관계 중심 유형입니다.","An extroverted, relationship-centered type who brightens surroundings with energy and warmth."), traits:[t("에너지","Energy"),t("공감","Empathy"),t("사교성","Sociability"),t("자발성","Spontaneity")], strength:[t("분위기를 밝게 만드는 능력","Ability to brighten the atmosphere"),t("빠른 공감과 지지","Quick empathy and support"),t("네트워크 형성","Network building")], weakness:[t("깊은 집중이 어려울 수 있음","May struggle with deep focus"),t("감정적 충동으로 실수","Impulsive emotional mistakes"),t("비판에 민감","Sensitive to criticism")], work:t("팀 분위기를 살리고 사람들을 연결하는 역할이 맞습니다.","Thrives in roles that energize team morale and connect people."), love:t("적극적으로 감정을 표현하고 함께하는 시간을 소중히 합니다.","Expresses feelings actively and values time together."), stress:t("스트레스를 사람들과 이야기하며 해소하려 합니다.","Relieves stress by talking things out with others."), match:["ITJR","ETJR"], conflict:["ITJC","ETJC"] },
    EFPC:{ icon:"🎨", name:t("창의 표현가","Creative Expresser"), eng:"Creative Expresser", desc:t("자유로운 감성과 창의성으로 독자적인 세계를 만들어가는 유형입니다.","Creates an independent world through free-spirited emotion and creativity."), traits:[t("창의성","Creativity"),t("자유","Freedom"),t("감성","Sensitivity"),t("즉흥성","Improvisation")], strength:[t("독창적인 아이디어 생성","Generating original ideas"),t("예술적·감성적 표현","Artistic and emotional expression"),t("유연한 적응력","Flexible adaptability")], weakness:[t("장기 계획이 약함","Weak at long-term planning"),t("마감·규칙 준수 어려움","Difficulty meeting deadlines and rules"),t("일관성 유지 힘듦","Hard to maintain consistency")], work:t("창의적 자유가 주어진 환경에서 최고 성과를 냅니다.","Performs best in environments that allow creative freedom."), love:t("파트너에게 창의적이고 감성적인 방식으로 사랑을 표현합니다.","Expresses love in creative and emotional ways."), stress:t("압박 시 예술적 활동이나 혼자만의 시간으로 회복합니다.","Recovers through artistic activities or alone time."), match:["ITJC","ETJC"], conflict:["ITJR","ETJR"] },
    EFJR:{ icon:"🌿", name:t("협력 추진자","Collaborative Driver"), eng:"Collaborative Driver", desc:t("따뜻한 마음으로 팀을 이끌고 협력을 통해 목표를 이루는 유형입니다.","A warm-hearted type who leads teams and achieves goals through collaboration."), traits:[t("협력","Collaboration"),t("따뜻함","Warmth"),t("추진력","Drive"),t("신뢰","Trust")], strength:[t("팀 화합과 동기부여","Team harmony and motivation"),t("공감 기반 리더십","Empathy-based leadership"),t("계획적 협업","Planned collaboration")], weakness:[t("갈등 회피 경향","Tendency to avoid conflict"),t("타인 감정에 지나치게 영향받음","Overly influenced by others' emotions"),t("자기 욕구 뒤로 미룸","Puts own needs last")], work:t("구성원의 강점을 이끌어내는 협력적 리더입니다.","A collaborative leader who draws out each member's strengths."), love:t("헌신적이고 따뜻한 파트너로 관계에 에너지를 쏟습니다.","Dedicated and warm, pours energy into the relationship."), stress:t("내면 갈등을 숨기다가 감정이 폭발하는 패턴이 있습니다.","May suppress inner conflict until emotions overflow."), match:["ETPR","ITJR"], conflict:["ITJC","ETPC"] },
    EFJC:{ icon:"🕊️", name:t("소통 전략가","Communication Strategist"), eng:"Communication Strategist", desc:t("감성과 전략을 결합하여 다리 역할을 하는 조율사입니다.","A mediator who bridges people by combining empathy with strategy."), traits:[t("소통","Communication"),t("공감","Empathy"),t("계획","Planning"),t("독립성","Independence")], strength:[t("대화와 협상 능력","Dialogue and negotiation skills"),t("감성적 이해와 전략적 사고","Emotional intelligence with strategic thinking"),t("중재 역할","Mediating role")], weakness:[t("우유부단할 수 있음","May be indecisive"),t("깊은 감정을 표현하기 어려움","Difficulty expressing deep emotions"),t("혼자 결정 내리기 힘듦","Hard to decide alone")], work:t("조직 내 소통 허브로서 갈등 조율에 탁월합니다.","Excels as a communication hub and conflict mediator in organizations."), love:t("파트너의 말을 잘 듣고 감성적으로 지지합니다.","Listens well and provides emotional support to partners."), stress:t("스트레스 시 대화를 통해 문제를 풀어가려 합니다.","Tries to resolve stress through dialogue."), match:["ETPC","ITJR"], conflict:["ITPR","ETPR"] },
    ITPR:{ icon:"🦉", name:t("분석 지원가","Analytical Supporter"), eng:"Analytical Supporter", desc:t("냉철한 분석과 빠른 판단으로 팀을 뒤에서 지원하는 유형입니다.","Supports the team from behind with sharp analysis and quick judgment."), traits:[t("분석력","Analysis"),t("신속함","Speed"),t("지원","Support"),t("내향성","Introversion")], strength:[t("빠른 데이터 분석","Quick data analysis"),t("조용하지만 효율적인 실행","Quiet but efficient execution"),t("상황 판단력","Situational judgment")], weakness:[t("혼자 일하는 것 선호로 협업 어려울 수 있음","May find collaboration difficult, preferring solo work"),t("감정 표현 부족","Lacks emotional expression"),t("과부하 시 번아웃","Burnout risk when overloaded")], work:t("분석이 필요한 업무에서 조용하고 빠르게 성과를 냅니다.","Quietly and quickly delivers results in analysis-heavy work."), love:t("말보다 행동으로 사랑을 표현하는 편입니다.","Tends to express love through actions rather than words."), stress:t("혼자 분석하고 해결책을 찾으며 회복합니다.","Recovers by analyzing problems and finding solutions alone."), match:["ETJC","EFJR"], conflict:["EFPR","IFPC"] },
    ITPC:{ icon:"⚡", name:t("독자 혁신가","Independent Innovator"), eng:"Independent Innovator", desc:t("혼자 빠르게 새로운 해법을 만들어내는 독립적 혁신 유형입니다.","An independent innovator who quickly creates new solutions on their own."), traits:[t("혁신","Innovation"),t("독립성","Independence"),t("분석","Analysis"),t("속도","Speed")], strength:[t("독창적 문제 해결","Original problem-solving"),t("빠른 독립적 실행","Fast independent execution"),t("기술적 숙련도","Technical proficiency")], weakness:[t("협력보다 단독 행동 선호","Prefers solo action over collaboration"),t("타인 관점 수용 어려울 수 있음","May struggle to accept others' viewpoints"),t("결과 중심으로 과정 무시","Results-focused, may ignore process")], work:t("기술적 도전이 있는 독립적 업무에서 빛을 발합니다.","Shines in independent work with technical challenges."), love:t("파트너에게 지적 자극을 주고받는 관계를 선호합니다.","Prefers relationships that offer mutual intellectual stimulation."), stress:t("혼자만의 공간을 찾아 분석·해결에 집중합니다.","Seeks solitude to focus on analyzing and solving the problem."), match:["ETJR","EFJR"], conflict:["EFPC","IFJR"] },
    ITJR:{ icon:"🏔️", name:t("정밀 계획가","Precision Planner"), eng:"Precision Planner", desc:t("체계적인 계획과 관계 지향으로 안정적인 성과를 내는 유형입니다.","Delivers stable results with systematic planning and a relationship-oriented approach."), traits:[t("정밀성","Precision"),t("계획성","Planning"),t("신뢰성","Reliability"),t("관계지향","Relationship-oriented")], strength:[t("빈틈없는 계획 수립","Thorough planning"),t("신뢰할 수 있는 실행","Reliable execution"),t("장기적 관계 유지","Maintaining long-term relationships")], weakness:[t("변화에 느리게 반응","Slow to respond to change"),t("새로운 시도에 보수적","Conservative about new attempts"),t("과도한 완벽주의","Excessive perfectionism")], work:t("장기 프로젝트를 꼼꼼하게 관리하는 역할에 뛰어납니다.","Excels at carefully managing long-term projects."), love:t("깊고 안정적인 관계를 선호하며 신뢰를 쌓아갑니다.","Prefers deep, stable relationships built on trust."), stress:t("계획이 흔들릴 때 더 많이 준비하고 확인합니다.","When plans waver, prepares and verifies more intensively."), match:["EFPR","EFJR"], conflict:["EFPC","ETPC"] },
    ITJC:{ icon:"🔬", name:t("완벽 탐구자","Perfectionist Explorer"), eng:"Perfectionist Explorer", desc:t("깊이 있는 분석과 완벽함 추구로 전문성을 쌓는 독립적 내향형입니다.","An independent introvert who builds expertise through deep analysis and pursuit of perfection."), traits:[t("완벽주의","Perfectionism"),t("탐구심","Curiosity"),t("독립성","Independence"),t("집중력","Focus")], strength:[t("깊은 전문 지식","Deep specialized knowledge"),t("꼼꼼한 오류 검토","Thorough error checking"),t("독립적 연구 능력","Independent research ability")], weakness:[t("완벽주의로 결정 지연","Perfectionism causes decision delays"),t("대인 관계가 어려울 수 있음","May find interpersonal relationships difficult"),t("피드백 수용이 어려울 때 있음","Sometimes struggles to accept feedback")], work:t("전문성이 요구되는 깊은 연구·분석 업무에 강합니다.","Strong in deep research and analysis requiring expertise."), love:t("소수와 깊고 의미있는 관계를 지향합니다.","Seeks deep, meaningful relationships with a few people."), stress:t("더 많이 파고들며 완벽한 해답을 찾으려 합니다.","Digs deeper, seeking a perfect answer."), match:["EFPC","ETJC"], conflict:["EFPR","ETPR"] },
    IFPR:{ icon:"🌸", name:t("공감 실행가","Empathetic Doer"), eng:"Empathetic Doer", desc:t("따뜻한 마음으로 빠르게 사람을 돕는 내향적 관계 지향 유형입니다.","An introverted, relationship-oriented type who warmly and quickly helps others."), traits:[t("공감","Empathy"),t("자발성","Spontaneity"),t("돌봄","Care"),t("민감성","Sensitivity")], strength:[t("타인 감정에 빠르게 반응","Quick response to others' emotions"),t("자연스러운 지지와 돌봄","Natural support and care"),t("진실된 공감 능력","Genuine empathy")], weakness:[t("자기 경계 설정이 어려움","Difficulty setting personal boundaries"),t("타인 감정에 지나치게 영향받음","Overly affected by others' emotions"),t("번아웃 위험","Burnout risk")], work:t("사람을 돌보는 상담·교육·서비스 분야에 탁월합니다.","Excels in counseling, education, and service roles."), love:t("파트너의 감정 변화에 섬세하게 반응하며 헌신합니다.","Responds sensitively to partner's emotional changes, with dedication."), stress:t("타인 걱정으로 자신을 잊고 소진되는 패턴이 있습니다.","Pattern of neglecting self while worrying about others, leading to exhaustion."), match:["ETJR","EFJR"], conflict:["ETPC","ITPC"] },
    IFPC:{ icon:"🦋", name:t("자유 탐색자","Free Explorer"), eng:"Free Explorer", desc:t("감성과 자유를 따르며 자신만의 길을 탐색하는 내향적 유형입니다.","An introverted type who follows emotion and freedom to explore their own path."), traits:[t("자유","Freedom"),t("감성","Sensitivity"),t("탐색","Exploration"),t("자발성","Spontaneity")], strength:[t("깊은 감수성과 예술적 감각","Deep sensibility and artistic sense"),t("유연한 적응","Flexible adaptation"),t("자기만의 독창적 관점","Unique personal perspective")], weakness:[t("결정 미루는 경향","Tendency to postpone decisions"),t("장기 계획 어려움","Difficulty with long-term plans"),t("외부 기대에 부담감","Burdened by external expectations")], work:t("창의적 자율성이 보장된 환경에서 꽃을 피웁니다.","Flourishes in environments that guarantee creative autonomy."), love:t("깊은 감성적 연결을 원하지만 혼자만의 시간도 필요합니다.","Wants deep emotional connection but also needs personal time."), stress:t("자신만의 공간으로 물러나 감정을 정리합니다.","Retreats to personal space to process emotions."), match:["ETJC","EFJC"], conflict:["ETJR","ITJR"] },
    IFJR:{ icon:"🌙", name:t("신중 지지자","Mindful Supporter"), eng:"Mindful Supporter", desc:t("조용하지만 깊이 있게 타인을 지지하는 신뢰의 내향형입니다.","A trustworthy introvert who quietly but deeply supports others."), traits:[t("신중함","Mindfulness"),t("지지","Support"),t("신뢰","Trust"),t("공감","Empathy")], strength:[t("깊은 신뢰 관계 형성","Building deep trust relationships"),t("조용한 헌신과 지속성","Quiet dedication and consistency"),t("타인의 필요를 잘 파악","Reading others' needs well")], weakness:[t("자기 감정 표현이 서툼","Clumsy at expressing own emotions"),t("갈등 회피로 불만 축적","Conflict avoidance leads to pent-up dissatisfaction"),t("과도한 자기 희생","Excessive self-sacrifice")], work:t("신뢰 기반의 지원·조력 역할에서 깊은 가치를 발휘합니다.","Brings deep value in trust-based support and helper roles."), love:t("말보다 행동으로 사랑을 보여주는 조용한 헌신자입니다.","A quiet devotee who shows love through actions rather than words."), stress:t("혼자 감내하다가 돌연 감정적으로 무너지는 패턴이 있습니다.","Pattern of enduring alone until suddenly emotionally overwhelmed."), match:["ETPR","EFPR"], conflict:["ETPC","ITPC"] },
    IFJC:{ icon:"🌌", name:t("성찰 독자","Reflective Individual"), eng:"Reflective Individual", desc:t("깊은 내면 세계를 탐구하며 조용히 자신만의 가치를 추구하는 유형입니다.","A type that explores a deep inner world and quietly pursues personal values."), traits:[t("성찰","Reflection"),t("독립성","Independence"),t("깊이","Depth"),t("가치지향","Values-driven")], strength:[t("깊은 자기 이해","Deep self-understanding"),t("진정성 있는 관계","Authentic relationships"),t("독자적인 사고와 통찰","Independent thinking and insight")], weakness:[t("타인과의 연결이 어려울 수 있음","May find it hard to connect with others"),t("과도한 내면 집중으로 현실 괴리","Excessive introspection can disconnect from reality"),t("변화 대응 느림","Slow to respond to change")], work:t("가치 있는 목적을 위해 혼자 깊이 집중하는 작업에 강합니다.","Strong at solo deep-focus work with meaningful purpose."), love:t("진정성 있는 깊은 연결을 원하며 가치관 공유를 중시합니다.","Seeks authentic deep connection and values sharing the same values."), stress:t("깊은 성찰과 혼자만의 시간으로 에너지를 회복합니다.","Restores energy through deep reflection and solitary time."), match:["ETPC","EFPC"], conflict:["ETPR","ITPR"] },
  };

  function calcLost() {
      const axisScores = { E:0, D:0, S:0, N:0, R:0, T:0 };
      const axisCount  = { E:0, D:0, S:0, N:0, R:0, T:0 };
      lostQ.forEach(q => {
        const r = lostResponses[q.num];
        if (r === undefined) return;
        const score = q.rev ? (6 - r) : r;
        axisScores[q.axis] += score;
        axisCount[q.axis]++;
      });
      const avg = {};
      Object.keys(axisScores).forEach(k => {
        avg[k] = axisCount[k] > 0 ? (axisScores[k] / axisCount[k]) : 3;
      });
      // 4축 유형 코드 결정 (각 축 평균 3.0 기준)
      const EI = avg.E >= 3.0 ? "E" : "I";
      const TF = avg.D >= 3.0 ? "T" : "F";
      const PJ = avg.S >= 3.0 ? "P" : "J";
      const RC = avg.R >= 3.0 ? "R" : "C";
      // 스트레스 반응 부가 축 (직면=A 또는 회피=V)
      const TV = avg.T >= 3.0 ? "A" : "V";
      // 안정성 부가 정보
      const NC = avg.N >= 3.0 ? "변화선호" : "안정선호";
      const typeCode = EI + TF + PJ + RC;
      const typeInfo = LOST_TYPES[typeCode] || LOST_TYPES["ETPR"];
      return { axisAvg: avg, typeCode, typeInfo, stressStyle: TV, stabilityStyle: NC };
    }

  // ⚠️ main.jsx 에 없던 함수 — stub
  const startTest = (...args) => {};
  const forgotPassword = (...args) => {};

  // ── 파트너 모드: 비로그인 직접 검사 시작 (chargeForTest 불필요) ──
  // 공지 로드 — 대시보드·공지목록에 들어올 때 1회만. 실패해도 조용히 무시(기존 화면 무영향).
  useEffect(() => {
    if (notices !== null) return;
    if (view !== 'memberDashboard' && view !== 'notices') return;
    let alive = true;
    fetch('/api/notices')
      .then(r => r.json())
      .then(d => { if (alive && d.success) setNotices(d.data || []); })
      .catch(() => { if (alive) setNotices([]); });
    return () => { alive = false; };
  }, [view, notices]);

  useEffect(() => {
    if (!view.startsWith('partnerTest:')) return;
    const key = view.split(':')[1];
    if (key === 'BIG5') setView('big5Test');
    else if (key === 'LOST') setView('lostTest');
    else if (key === 'DSI') setView('dsiTest');
  }, [view]);

  // ============================================================
  // ── 검사 소개 페이지에서 바로 검사 시작 처리 ────────────────
  useEffect(() => {
    if (!view || !view.startsWith('startTest:')) return;
    const testId = view.split(':')[1];  // 예: 'PHQ9', 'SCT', 'DSI' 등
    const TEST_VIEW_MAP = {
      PHQ9: 'phq9Test', GAD7: 'gad7Test', DASS21: 'dass21Test',
      BIG5: 'big5Test', BURNOUT: 'burnoutTest', LOST: 'lostTest',
      SCT: 'sctTest', DSI: 'dsiTest', RIASEC: 'riasecTest', VALUES: 'valuesTest',
    };
    const targetView = TEST_VIEW_MAP[testId];
    if (!targetView) { setView('memberDashboard'); return; }

    // 비로그인 + 유료 검사 → 로그인 유도
    // 비로그인 + 무료 검사(PHQ9·GAD7) → 바로 허용
    if (!currentUser && !FREE_TESTS.includes(testId)) {
      setView('memberSignup'); return;
    }

    // 비로그인 무료 검사: 크레딧 차감 없이 바로 시작
    if (!currentUser && FREE_TESTS.includes(testId)) {
      setPendingTests([testId]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId('session'));
      setPhq9Responses({});
      setGad7Responses({});
      resetChat();
      setView(targetView);
      return;
    }

    // 로그인 상태: 크레딧 차감 후 검사 시작
    (async () => {
      const ok = await chargeForTest(testId);
      if (!ok) { setView('memberDashboard'); return; }
      setPendingTests([testId]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId('session'));
      setSaveStatus('');
      setRiasecResponses({}); setValuesResponses({});
      setPhq9Responses({}); setGad7Responses({}); setDass21Responses({});
      setBig5Responses({}); setBurnoutResponses({}); setLostResponses({});
      setSrciResponses({}); setSdriResponses({});
      resetChat();
      setView(targetView);
    })();
  }, [view]);

  // ── 비로그인 결과/완료 화면 진입 시 ChatBox 초기화 ─────────────
  useEffect(() => {
    if (view === 'phq9Result' || view === 'gad7Result') {
      if (!isLoggedIn) setChatOpen(true);
    }
    // complete: 비로그인 검사 완료 시 채팅 메시지 초기화
    if (view === 'complete' && !isLoggedIn) {
      setChatMessages([]);
      setChatOpen(false);
    }
  }, [view]);

  // ── 브라우저 뒤로가기 차단 (검사 진행 중 이탈 방지) ──────────
  useEffect(() => {
    const TEST_VIEWS = [
      'sctTest','dsiTest','phq9Test','gad7Test','dass21Test',
      'burnoutTest','big5Test','lostTest','riasecTest','valuesTest',
      'sctResult','dsiResult','phq9Result','gad7Result','dass21Result',
      'burnoutResult','big5Result','lostResult','riasecResult','valuesResult',
      'memberDashboard','counseling',
    ];

    const isTestView = TEST_VIEWS.includes(view);

    if (isTestView) {
      // 현재 상태를 history에 push해서 뒤로갈 곳을 만들어 둠
      window.history.pushState({ maumful: true }, '', window.location.href);

      const handlePopState = (e) => {
        // 뒤로가기 감지 → 다시 push해서 이탈 차단 + 메인으로 이동
        window.history.pushState({ maumful: true }, '', window.location.href);
        setView('landing');
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [view]);

  // ⏬ 원래 component 하단에 있던 useEffect 두 개 (React #310 수정)
  // ============================================================
// ✅ 컴포넌트 마운트 시 데이터 로드 및 로그인 상태 복원
  useEffect(() => {
    const init = async () => {
      console.log('🔄 앱 초기화 - LocalStorage 데이터 로드 시작');
      
      // 🕐 만료된 검사 결과 자동 삭제 (최우선)
      checkAndCleanExpiredSessions();
      
      // ✅ 로그인 상태 복원
      const restored = await restoreLoginState();
      if (restored) {
        console.log('✅ 로그인 상태 자동 복원 완료');
      } else {
        console.log('ℹ️ 복원할 로그인 정보 없음 - 로그인 화면 표시');
      }
      
      // 디버깅: LocalStorage 키 확인
      const keys = Object.keys(localStorage);
      console.log('📦 저장된 키 목록:', keys.filter(k => 
        k.includes('counselor') || k.includes('submitted') || k.includes('link_') || k.includes('session_') || k.includes('login')
      ));
      
      // 승인된 상담사 수 확인
      const approvedData = storage.get("approved_counselors");
      if (approvedData) {
        const approved = JSON.parse(approvedData.value);
        console.log('✅ 승인된 상담사:', approved.length + '명');
      }
      
      // 대기 중인 상담사 수 확인
      const pendingData = storage.get("counselor_requests");
      if (pendingData) {
        const pending = JSON.parse(pendingData.value).filter(c => c.status === "pending");
        console.log('⏳ 대기 중인 상담사:', pending.length + '명');
      }
      
      // 📖 성경적 참고자료 로드 (관리자만)
      if (isAdmin) {
        await loadBiblicalRefs();
      }
    };
    
    init();
    
    // 제출된 검사 수 확인
    const submittedData = storage.get("submitted_list");
    if (submittedData) {
      const submitted = JSON.parse(submittedData.value);
      console.log('📊 제출된 검사:', submitted.length + '건');
    }
    
    console.log('✅ 데이터 로드 완료');
    
    // 🔄 1분마다 만료 체크 (백그라운드)
    const intervalId = setInterval(() => {
      checkAndCleanExpiredSessions();
    }, 60000); // 1분
    
    return () => clearInterval(intervalId);
  }, []); // 한 번만 실행

  // 📄 리포트 로드 (검사 이력 → 클릭)
  useEffect(() => {
    if (view !== 'testReport' || !reportId) return;
    (async () => {
      setReportLoading(true); setReportErr(''); setReport(null);
      try {
        const res = await api._fetch(`/api/test/report?id=${reportId}`);   // ⚠️ api.get은 존재하지 않음 — _fetch는 Response 반환
        const r = await res.json();
        if (r.success) { setReport(r.data); logLoopEvent('report_view', r.data.test_type); }
        else setReportErr(r.error || t('리포트를 불러오지 못했어요.', 'Failed to load report.'));
      } catch {
        setReportErr(t('리포트를 불러오지 못했어요.', 'Failed to load report.'));
      } finally {
        setReportLoading(false);
      }
    })();
  }, [view, reportId]);

  // 검사 결과 화면 진입 시 result_json 자동 저장 + 마음커플 복귀
  useEffect(() => {
    if (!isLoggedIn) return;
    const saveMap = {
      big5Result:  () => ({ test_type: 'BIG5',  result_json: calcBig5() }),
      lostResult:  () => ({ test_type: 'LOST',  result_json: (() => { const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost(); return { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle }; })() }),
      dsiResult:   () => ({ test_type: 'DSI',   result_json: (() => { const { scales, total } = calcSdri(); return { scales, total }; })() }),
    };
    const fn = saveMap[view];
    if (!fn) return;
    try {
      const payload = fn();
      fetch('/api/test/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify(payload),
      }).then(() => {
        // 결과 저장 후 2.5초 뒤 자동 복귀 (버튼으로 수동 이동도 가능)
        if (returnToCouple) setTimeout(() => goBackToCouple(), 2500);
      }).catch(() => {
        setSaveStatus('⚠️ 결과 저장에 실패했습니다. 페이지를 새로고침하면 재시도됩니다.');
      });
    } catch { /* 결과 계산 실패 시 무시 */ }
  }, [view, isLoggedIn]);

  // complete 뷰 + returnToCouple → 2.5초 후 자동 복귀
  useEffect(() => {
    if (view !== 'complete' || !returnToCouple) return;
    const t = setTimeout(() => goBackToCouple(), 2500);
    return () => clearTimeout(t);
  }, [view, returnToCouple]);

  // ── 하위 호환: 기존 검사 코드가 참조하는 변수들 ─────────
  // activeLinkData → 로그인 회원 정보로 대체
  const activeLinkData = currentUser ? {
    clientName:    currentUser.nickname || currentUser.email,
    counselingType: counselingMode,   // 사용자가 설정한 상담 모드 반영
    testTypes:     selectedTests,
    testType:      selectedTests[0],
    lang:          currentUser.locale || 'ko',
  } : null;
  const activeLinkId   = currentUser ? 'member_' + currentUser.id : null;
  // 기존 코드가 isCounselor/isAdmin 체크하는 곳 → 항상 false
  const isCounselor    = false;
  const isAdmin        = false;
  const counselorPhone = '';
  // no-op stubs — B2B 레거시 코드 호환용
  const setIsAdmin           = () => {};
  const setIsCounselor       = () => {};
  const setCounselorPhone    = () => {};
  const setActiveLinkData    = () => {};
  const setApiTestLoading     = () => {};
  const setApiTestResult      = () => {};

  // ============================================================
  // 초기화: 로그인 복원 + 지역 설정 로드
  // ============================================================
  useEffect(() => {
    (async () => {
      // 지역 설정 먼저 로드
      try {
        const cfg = await api.getRegionConfig();
        setRegionConfig(cfg);
      } catch { /* 무시 */ }

      // 저장된 토큰으로 자동 로그인 복원
      const savedUser = tokenStore.getUser();
      const accessToken = tokenStore.getAccess();
      let isAuthenticated = false;
      if (savedUser && accessToken) {
        try {
          const result = await api.getMe();
          if (result.success) {
            setCurrentUser(result.data);
            setCredits(result.data.credits);
            setIsLoggedIn(true);
            isAuthenticated = true;
            loadTestHistory();
            checkAndCleanExpiredSessions();
          } else {
            tokenStore.clear();
          }
        } catch { tokenStore.clear(); }
      }

      // 로컬 제출 목록 복원
      loadAllSubmitted();

      // URL 파라미터 일괄 처리
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const resetToken    = urlParams.get('reset_token');
      const startTest     = urlParams.get('start');
      const urlHash       = window.location.hash;

      // ── 제휴 채널 파라미터 처리 (?p=PARTNER_CODE) ──────────────
      // ?sso_token= 이 함께 오면 파트너 SSO 자동 로그인 시도
      const channelCode = urlParams.get('p');
      const ssoToken    = urlParams.get('sso_token');
      if (channelCode) {
        const upperCode = channelCode.toUpperCase();
        try { localStorage.setItem('maumful_partner_code', upperCode); } catch {}
        window.history.replaceState({}, '', '/');

        // 파트너 설정 조회 → sessionStorage 캐시 (환영 배너용)
        try {
          const cfgRes = await fetch(`/api/partner/config?p=${upperCode}`);
          const cfgData = await cfgRes.json();
          if (cfgData.success) {
            sessionStorage.setItem('maumful_partner_cfg', JSON.stringify(cfgData.data));
          }
        } catch { /* 설정 조회 실패 무시 */ }

        if (ssoToken && !isAuthenticated) {
          // 파트너 SSO 자동 로그인
          try {
            const r = await fetch('/api/auth/partner-sso', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partnerCode: upperCode, ssoToken }),
            });
            const d = await r.json();
            if (d.success) {
              const { accessToken, refreshToken, user } = d.data;
              tokenStore.setTokens(accessToken, refreshToken);
              tokenStore.setUser(user);
              setCurrentUser(user);
              setCredits(user.credits);
              setIsLoggedIn(true);
              isAuthenticated = true;
            }
          } catch { /* SSO 실패 시 일반 랜딩으로 진행 */ }
        }
      }

      // 마음커플 → 비로그인 파트너 검사 링크 (?partner=SESSION_CODE) — 최우선 처리
      const partnerCode = urlParams.get('partner');
      if (partnerCode) {
        window.history.replaceState({}, '', '/');
        try {
          const coupleBase = getCoupleBaseUrl();
          const r = await fetch(`${coupleBase}/api/couple/partner-info/${partnerCode.toUpperCase()}`);
          const d = await r.json();
          if (d.success) {
            const tests = d.data.test_type.split('+');
            setPartnerMode({ sessionCode: partnerCode.toUpperCase(), testType: d.data.test_type, hostName: d.data.host_name, pendingTests: tests, completedResults: {} });
            setView('partnerIntro');
          } else {
            setView('landing');
          }
        } catch { setView('landing'); }
        setInitializing(false);
        return;
      }

      // 마음게임 고위험 감지 → 상담 페이지 자동 이동 (?go=counseling)
      if (urlParams.get('go') === 'counseling') {
        window.history.replaceState({}, '', '/');
        if (isAuthenticated) {
          setView('counseling');
        } else {
          sessionStorage.setItem('post_login_view', 'counseling');
          setView('memberLogin');
        }
        setInitializing(false);
        return;
      }

      // 마음커플 → 특정 검사 direct link (?start=BIG5|LOST|DSI) — 최우선 처리
      if (startTest) {
        window.history.replaceState({}, '', '/');
        sessionStorage.setItem('return_to_couple', '1');
        setReturnToCouple(true); // 결과 화면에 마음커플 복귀 버튼 표시
        const testKey = startTest.toUpperCase();
        if (['BIG5', 'LOST', 'DSI'].includes(testKey)) {
          const startView = 'startTest:' + testKey; // chargeForTest 경유로 test_history 행 생성
          if (isAuthenticated) {
            setView(startView);
          } else {
            sessionStorage.setItem('post_login_view', startView);
            setView('memberLogin');
          }
        }
        setInitializing(false);
        return;
      }

      // ── 마음풀 내부 딥링크 (?go=) — 마음게임 주간 리포트 이메일 등에서 진입 ──
      //    ?go=history      → 마이페이지 검사 이력(리포트 목록)
      //    ?go=test:PHQ9    → 해당 검사 시작
      //    ?start=(마음커플 전용, 복귀 버튼 표시)와 분리 — 복귀 배지가 잘못 뜨지 않도록.
      const goParam = urlParams.get('go');
      if (goParam) {
        window.history.replaceState({}, '', '/');
        const [goKind, goArg] = goParam.split(':');
        let goView = null;
        if (goKind === 'history') {
          goView = 'myPage';
        } else if (goKind === 'test' && goArg) {
          const k = goArg.toUpperCase();
          if (['PHQ9','GAD7','DASS21','BIG5','LOST','SCT','DSI','BURNOUT','RIASEC','VALUES'].includes(k)) goView = 'startTest:' + k;
        }
        if (goView) {
          if (goKind === 'history') setMyPageTab('history');
          if (isAuthenticated) {
            setView(goView);
          } else {
            sessionStorage.setItem('post_login_view', goView);
            setView('memberLogin');
          }
          setInitializing(false);
          return;
        }
      }

      // 로그인 복원 후 기본 화면
      if (isAuthenticated) setView('memberDashboard');

      // 결제 완료 후 URL 파라미터 처리 (?payment=success|fail|cancel)
      if (paymentStatus === 'success') {
        window.history.replaceState({}, '', '/');
        setTimeout(async () => {
          try {
            const r = await fetch('/api/payment/stripe/verify', { headers: api._authHeader() });
            const d = await r.json();
            if (d.success) setCredits(d.data.credits);
          } catch { /* 무시 */ }
          setLoginMsg({ type: 'success', text: '✦ 크레딧 구매가 완료되었습니다!' });
          setTimeout(() => setLoginMsg({ type: '', text: '' }), 4000);
        }, 1500);
      } else if (paymentStatus === 'fail' || paymentStatus === 'cancel') {
        window.history.replaceState({}, '', '/');
        setLoginMsg({ type: 'error', text: '결제가 취소되었거나 실패했습니다.' });
        setTimeout(() => setLoginMsg({ type: '', text: '' }), 4000);
      }

      // 비밀번호 재설정 토큰 처리
      if (resetToken) {
        window.history.replaceState({}, '', '/');
        setView('resetPassword');
        window.__resetToken = resetToken;
      }

      // 마음커플 → 상담 예약 deep link (#counseling?type=couple|bowen)
      if (urlHash.startsWith('#counseling')) {
        const hashParams = new URLSearchParams(urlHash.slice('#counseling'.length + 1));
        const ctype = hashParams.get('type');
        window.history.replaceState({}, '', '/');
        if (isAuthenticated) {
          setView('counseling');
          if (ctype) {
            try { localStorage.setItem('couple_counseling_type', ctype); } catch {}
          }
        } else {
          setView('memberLogin');
        }
      }

      // 친구 초대 ?ref= 파라미터 처리
      // 로그인 전 접속이면 sessionStorage에 저장 → 회원가입 완료 후 자동 적용
      const refCode = urlParams.get('ref');
      if (refCode) {
        sessionStorage.setItem('pending_ref_code', refCode.toUpperCase());
        window.history.replaceState({}, '', '/');
      }

      // UTM 파라미터 저장 (마케팅 채널 분석용 — 회원가입 시 서버로 전달하지 않고 분석 참고용)
      const utmSource = urlParams.get('utm_source');
      if (utmSource) {
        try { localStorage.setItem('maumful_utm_source', utmSource); } catch {}
      }

      setInitializing(false);
    })();
  }, []);

  // ============================================================
  // 인증 함수
  // ============================================================
  async function handleLogin(e) {
    if (e) e.preventDefault();
    const email    = (document.getElementById('login-email')?.value || '').trim();
    const password = document.getElementById('login-pw')?.value || '';
    if (!email || !password) { setLoginMsg({ type: 'error', text: t('이메일과 비밀번호를 입력해주세요.','Please enter your email and password.') }); return; }

    setLoginMsg({ type: 'loading', text: t('로그인 중...','Signing in...') });
    const result = await api.login(email, password);
    if (!result.success) {
      if (result.requiresVerification) {
        setLoginMsg({
          type: 'error',
          text: t(`📧 이메일 인증이 필요합니다. ${result.email || ''}로 발송된 인증 메일을 확인해주세요.`,`📧 Email verification required. Please check the email sent to ${result.email || ''}.`),
        });
        setPendingVerifyEmail(result.email || '');
      } else {
        setLoginMsg({ type: 'error', text: result.error || t('로그인에 실패했습니다.','Login failed.') });
      }
      return;
    }

    const { accessToken, refreshToken, user } = result.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setLoginMsg({ type: '', text: '' });
    const postLoginView = sessionStorage.getItem('post_login_view');
    if (postLoginView) {
      sessionStorage.removeItem('post_login_view');
      setView(postLoginView);
    } else {
      setView('memberDashboard');
    }
    loadTestHistory();

    // 초대 코드 자동 적용 (가입 전 ?ref= 링크로 접속한 경우)
    const pendingRef = sessionStorage.getItem('pending_ref_code');
    if (pendingRef) {
      sessionStorage.removeItem('pending_ref_code');
      fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ code: pendingRef }),
      }).then(r => r.json()).then(r => {
        if (r.success) {
          setCredits(r.data.balance);
          setLoginMsg({ type: 'success', text: t(`초대 코드 적용! +${r.data.credits} 크레딧이 지급되었습니다.`,`Referral applied! +${r.data.credits} credits added.`) });
          setTimeout(() => setLoginMsg({ type: '', text: '' }), 4000);
        }
      }).catch(() => {});
    }
  }

  // Google Sign-In 콜백 — GSI 라이브러리가 credential 반환 시 호출
  async function handleGoogleLogin(credential) {
    setLoginMsg({ type: 'loading', text: t('Google 로그인 중...','Signing in with Google...') });
    const result = await api.loginGoogle(credential);
    if (!result.success) {
      setLoginMsg({ type: 'error', text: result.error || t('Google 로그인에 실패했습니다.','Google sign-in failed.') });
      return;
    }
    const { accessToken, refreshToken, user } = result.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setLoginMsg({ type: '', text: '' });
    const postLoginView = sessionStorage.getItem('post_login_view');
    if (postLoginView) { sessionStorage.removeItem('post_login_view'); setView(postLoginView); }
    else setView('memberDashboard');
    loadTestHistory();
  }

  // 카카오 로그인 콜백
  async function handleKakaoLogin(data) {
    if (!data?.accessToken) { setLoginMsg({ type: 'error', text: t('카카오 로그인에 실패했습니다.','Kakao sign-in failed.') }); return; }
    const { accessToken, refreshToken, user } = data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits || 0);
    setIsLoggedIn(true);
    setLoginMsg({ type: '', text: '' });
    const postLoginView = sessionStorage.getItem('post_login_view');
    if (postLoginView) { sessionStorage.removeItem('post_login_view'); setView(postLoginView); }
    else setView('memberDashboard');
    loadTestHistory();
  }

  // 네이버 로그인 콜백 (팝업 postMessage로 받은 JWT 데이터 처리)
  async function handleNaverLogin(data) {
    if (!data?.accessToken) { setLoginMsg({ type: 'error', text: t('네이버 로그인에 실패했습니다.','Naver sign-in failed.') }); return; }
    const { accessToken, refreshToken, user } = data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits || 0);
    setIsLoggedIn(true);
    setLoginMsg({ type: '', text: '' });
    const postLoginView = sessionStorage.getItem('post_login_view');
    if (postLoginView) { sessionStorage.removeItem('post_login_view'); setView(postLoginView); }
    else setView('memberDashboard');
    loadTestHistory();
  }

  async function handleSignup(e) {
    if (e) e.preventDefault();
    const { email, password, pwConfirm, nickname, gender, age_range, phone } = signupForm;
    if (!email || !password) { setFormMsg({ type: 'error', text: t('이메일과 비밀번호는 필수입니다.','Email and password are required.') }); return; }
    if (password !== pwConfirm) { setFormMsg({ type: 'error', text: t('비밀번호가 일치하지 않습니다.','Passwords do not match.') }); return; }
    if (password.length < 8) { setFormMsg({ type: 'error', text: t('비밀번호는 8자 이상이어야 합니다.','Password must be at least 8 characters.') }); return; }
    if (phone && !/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) {
      setFormMsg({ type: 'error', text: t('핸드폰번호 형식을 확인해 주세요. (예: 010-1234-5678)','Check phone format: 010-1234-5678') }); return;
    }

    // 필수 동의 확인 (개인정보보호법 제22조)
    const { terms, privacy, sensitive, overseas, age } = signupConsents;
    if (!terms || !privacy || !sensitive || !overseas || !age) {
      setFormMsg({ type: 'error', text: t('모든 필수 항목에 동의해 주세요.','Please agree to all required terms.') }); return;
    }

    setFormMsg({ type: 'loading', text: t('가입 처리 중...','Creating your account...') });
    let savedPartnerCode = null;
    try { savedPartnerCode = localStorage.getItem('maumful_partner_code'); } catch {}
    const result = await api.register(email, password, nickname || email.split('@')[0], savedPartnerCode, signupConsents.marketing, 'ko', gender || null, age_range || null, phone || null);
    if (!result.success) { setFormMsg({ type: 'error', text: result.error || t('가입에 실패했습니다.','Sign-up failed. Please try again.') }); return; }

    // 이메일 인증 강제 — 인증 전엔 로그인 불가. 자동로그인 시도하지 말고 인증 안내 모달을 띄운다.
    if (result.data?.requiresVerification || result.requiresVerification) {
      setSignupVerifyEmail(result.data?.email || email);
      setFormMsg({ type: '', text: '' });
      setSignupForm({ email: '', password: '', pwConfirm: '', nickname: '', gender: '', age_range: '', phone: '' });
      setSignupConsents({ terms: false, privacy: false, sensitive: false, overseas: false, age: false, marketing: false });
      return;
    }

    // 가입 성공(인증 불필요 케이스) → 자동 로그인
    setFormMsg({ type: 'loading', text: t('잠시만요...','Just a moment...') });
    const loginResult = await api.login(email, password);
    if (!loginResult.success) {
      setFormMsg({ type: 'success', text: t('가입 완료! 아래에서 로그인해주세요.','Account created! Please sign in below.') });
      setTimeout(() => { setView('memberLogin'); setFormMsg({ type: '', text: '' }); }, 1500);
      return;
    }
    const { accessToken, refreshToken, user } = loginResult.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setFormMsg({ type: '', text: '' });
    setSignupForm({ email: '', password: '', pwConfirm: '', nickname: '', gender: '', age_range: '', phone: '' });
    setSignupConsents({ terms: false, privacy: false, sensitive: false, overseas: false, age: false, marketing: false });

    // 초대 코드 자동 적용
    const pendingRef = sessionStorage.getItem('pending_ref_code');
    if (pendingRef) {
      sessionStorage.removeItem('pending_ref_code');
      fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ code: pendingRef }),
      }).then(r => r.json()).then(r => { if (r.success) setCredits(r.data.balance); }).catch(() => {});
    }

    setView('memberOnboarding');
  }

  async function handleLogout() {
    await api.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCredits(0);
    setView('memberLogin');
    setLoginMsg({ type: '', text: '' });
    // AI 채팅 일일 횟수 초기화
    setAiChatUsed(0);
    try { localStorage.removeItem(AI_LIMIT_KEY); } catch {}
  }

  // ============================================================
  // 크레딧 함수
  // ============================================================
  async function refreshCredits() {
    if (!isLoggedIn) return;
    try {
      const r = await api.getCredits();
      if (r.success) { setCredits(r.data.balance); setCreditTxns(r.data.transactions); }
    } catch { /* 무시 */ }
  }

  // 검사 시작 시 크레딧 차감 요청
  async function chargeForTest(testType) {
    // 무료 검사 3종 (PHQ-9·GAD-7·Big5): 크레딧 차감 없이 바로 시작
    if (FREE_TESTS.includes(testType)) return true;

    // 유료 검사: 크레딧 10 차감
    const result = await api.startTest(testType, currentUser?.locale || 'ko');
    if (!result.success) {
      if (result.needsCharge) { setPendingTestAfterCharge(testType); setShowCreditModal(true); }
      return false;
    }
    setCredits(result.data.balance);
    return true;
  }

  // ============================================================
  // 마음 게임 SSO 연동 (JWT 토큰 전달 → 별도 로그인 불필요)
  // ============================================================
  function getCoupleBaseUrl() {
    const h = window.location.hostname;
    return (h.includes('workers.dev') || h.includes('-dev.'))
      ? 'https://maumcouple-dev.limyj007.workers.dev'
      : 'https://couple.maumful.com';
  }

  function goBackToCouple() {
    setReturnToCouple(false);
    sessionStorage.removeItem('return_to_couple');
    window.location.href = getCoupleBaseUrl();
  }

  // 검사 제출 시점에 result_json 저장 (complete 뷰로 이동 전 호출)
  function saveCoupleResult(testType, resultJson) {
    if (!isLoggedIn) return;
    fetch('/api/test/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ test_type: testType, result_json: resultJson }),
    }).catch(() => {});
  }

  async function submitPartnerResults(results) {
    const coupleBase = getCoupleBaseUrl();
    try {
      const r = await fetch(`${coupleBase}/api/couple/partner-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_code: partnerMode.sessionCode, results }),
      });
      const d = await r.json();
      if (d.success) { setView('partnerComplete'); }
      else { setSaveStatus('제출 실패: ' + (d.error || '다시 시도해주세요.')); }
    } catch { setSaveStatus('네트워크 오류. 다시 시도해주세요.'); }
  }

  async function openMaumCouple(inviteCode = null) {
    if (!isLoggedIn) {
      setView('memberLogin');
      return;
    }
    const base = getCoupleBaseUrl();
    try {
      const res = await fetch('/api/couple-token', { headers: api._authHeader() });
      const data = await res.json();
      const token = data.success ? data.coupleToken : tokenStore.getAccess();
      const codeParam = inviteCode ? `&code=${encodeURIComponent(inviteCode)}` : '';
      const langParam = lang === 'en' ? '&lang=en' : '';
      window.open(`${base}${token ? '?t=' + encodeURIComponent(token) + codeParam + langParam : ''}`, '_blank', 'noopener noreferrer');
    } catch {
      const token = tokenStore.getAccess();
      const langParam = lang === 'en' ? '&lang=en' : '';
      window.open(`${base}${token ? '?t=' + encodeURIComponent(token) + langParam : ''}`, '_blank', 'noopener noreferrer');
    }
  }

  async function openMaumGame(gameKey = null) {
    if (!isLoggedIn) {
      setView('memberLogin');
      return;
    }
    try {
      // 게임 전용 장기 토큰 발급 (7일) — accessToken(1시간) 만료로 인한 로그인 풀림 방지
      const res = await fetch('/api/game-token', { headers: api._authHeader() });
      const data = await res.json();
      const token = data.success ? data.gameToken : tokenStore.getAccess();
      const gameParam = gameKey ? `&game=${encodeURIComponent(gameKey)}` : '';
      const langParam = lang === 'en' ? '&lang=en' : '';
      const gameUrl = `https://game.maumful.com${token ? '?t=' + encodeURIComponent(token) + gameParam + langParam : ''}`;
      window.open(gameUrl, '_blank', 'noopener noreferrer');
    } catch {
      // 실패 시 기존 토큰으로 fallback
      const token = tokenStore.getAccess();
      const langParam = lang === 'en' ? '&lang=en' : '';
      const gameUrl = `https://game.maumful.com${token ? '?t=' + encodeURIComponent(token) + langParam : ''}`;
      window.open(gameUrl, '_blank', 'noopener noreferrer');
    }
  }

  // 마음수달 — 마음풀 계정으로 단일로그인(SSO) 진입. 미설정/실패 시 일반 링크로 폴백.
  async function openMaumOtter() {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    try {
      const res = await fetch('/api/maum-sso-token', { headers: api._authHeader() });
      const data = await res.json();
      if (data.success && data.ssoToken) {
        window.open('https://maumotter.com/?sso=' + encodeURIComponent(data.ssoToken), '_blank', 'noopener noreferrer');
        return;
      }
    } catch {}
    window.open('https://maumotter.com', '_blank', 'noopener noreferrer');
  }

  // 마음부부 — 마음풀 계정 SSO(bubu-token) 진입. 미설정/실패 시 일반 링크 폴백.
  async function openMaumBubu() {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    try {
      const res = await fetch('/api/bubu-token', { headers: api._authHeader() });
      const data = await res.json();
      if (data.success && data.bubuToken) {
        window.open('https://bubu.maumful.com/?t=' + encodeURIComponent(data.bubuToken), '_blank', 'noopener noreferrer');
        return;
      }
    } catch {}
    window.open('https://bubu.maumful.com', '_blank', 'noopener noreferrer');
  }

  // 마음세대(부모-자녀 세대 통역) 진입 — 마음부부와 동일 패턴(?t= 토큰 SSO)
  async function openMaumSedae() {
    if (!isLoggedIn) { setView('memberLogin'); return; }
    try {
      const res = await fetch('/api/sedae-token', { headers: api._authHeader() });
      const data = await res.json();
      if (data.success && data.sedaeToken) {
        window.open('https://sedae.maumful.com/?t=' + encodeURIComponent(data.sedaeToken), '_blank', 'noopener noreferrer');
        return;
      }
    } catch {}
    window.open('https://sedae.maumful.com', '_blank', 'noopener noreferrer');
  }

  // ============================================================
  // 검사 이력 로드
  // ============================================================
  async function loadTestHistory() {
    try {
      const r = await api.getTestHistory();
      if (r.success) setTestHistory(r.data);
    } catch { /* 무시 */ }
    try {
      const mr = await api._fetch('/api/chat/mood-trend?days=14');
      const md = await mr.json();
      if (md.success) setMoodTrend(md.data);
    } catch { /* 무시 */ }
    // daily context — 하루 1회 캐시
    try {
      const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      const cacheKey = `maumful_daily_ctx_${today}`;
      const dismissed = localStorage.getItem(`maumful_ai_checkin_${today}`);
      if (dismissed) return;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setDailyCtxCard(JSON.parse(cached)); return; }
      const res = await api._fetch('/api/user/daily-context');
      const data = await res.json();
      if (data.success && data.hasData) {
        const card = { greeting: data.greeting, chatContext: data.chatContext };
        localStorage.setItem(cacheKey, JSON.stringify(card));
        setDailyCtxCard(card);
      }
    } catch { /* 무시 */ }
  }

  // ============================================================
  // Web Push 구독
  // ============================================================
  async function checkPushStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported'); return;
    }
    if (Notification.permission === 'denied') { setPushStatus('denied'); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushStatus(sub ? 'subscribed' : 'idle');
    } catch { setPushStatus('idle'); }
  }

  async function subscribePush() {
    try {
      const { key } = await fetch('/api/push/vapid-key').then(r => r.json());
      if (!key) { alert('알림 서비스가 준비 중이에요. 잠시 후 다시 시도해 주세요.'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const { endpoint, keys } = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ endpoint, p256dh: keys?.p256dh, auth: keys?.auth, service: 'maumful' }),
      });
      setPushStatus('subscribed');
    } catch (e) {
      if (e.name === 'NotAllowedError') { setPushStatus('denied'); }
      else { alert('알림 구독 중 오류가 발생했어요: ' + e.message); }
    }
  }

  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setPushStatus('idle');
    } catch {}
  }

  // ============================================================
  // 콘텐츠 보호 — 이벤트 차단 (보호 뷰 진입/이탈 시 토글)
  // ============================================================
  useEffect(() => {
    const isProtected = PROTECTED_VIEWS.has(view);

    // body 텍스트 선택 차단
    document.body.style.userSelect         = isProtected ? 'none' : '';
    document.body.style.webkitUserSelect   = isProtected ? 'none' : '';
    document.body.style.mozUserSelect      = isProtected ? 'none' : '';

    // 인쇄 차단 style 태그 주입/제거
    const styleId = 'maumful-print-block';
    let printStyle = document.getElementById(styleId);
    if (isProtected) {
      if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = styleId;
        printStyle.textContent = '@media print { body { display:none !important; } }';
        document.head.appendChild(printStyle);
      }
    } else {
      printStyle?.remove();
    }

    if (!isProtected) return;

    const noCtxMenu  = (e) => e.preventDefault();
    const noCopy     = (e) => e.preventDefault();
    const noDrag     = (e) => e.preventDefault();
    const noKeys     = (e) => {
      const k = e.key?.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // 복사·저장·인쇄·소스·전체선택
      if (ctrl && ['c','s','p','u','a'].includes(k)) { e.preventDefault(); e.stopPropagation(); }
      // 개발자도구 단축키
      if (k === 'f12' || (ctrl && e.shiftKey && ['i','j','c'].includes(k))) e.preventDefault();
    };
    const noPrint = (e) => { e.preventDefault(); e.stopPropagation(); };

    document.addEventListener('contextmenu', noCtxMenu,  { capture: true });
    document.addEventListener('copy',        noCopy,     { capture: true });
    document.addEventListener('dragstart',   noDrag,     { capture: true });
    document.addEventListener('keydown',     noKeys,     { capture: true });
    window.addEventListener('beforeprint',   noPrint,    { capture: true });

    return () => {
      document.removeEventListener('contextmenu', noCtxMenu,  { capture: true });
      document.removeEventListener('copy',        noCopy,     { capture: true });
      document.removeEventListener('dragstart',   noDrag,     { capture: true });
      document.removeEventListener('keydown',     noKeys,     { capture: true });
      window.removeEventListener('beforeprint',   noPrint,    { capture: true });
    };
  }, [view]);

  // 개발자도구 감지 (창 크기 비교 방식)
  useEffect(() => {
    if (!PROTECTED_VIEWS.has(view)) { setDevToolsOpen(false); return; }
    const THRESHOLD = 160;
    const check = () => {
      const open =
        (window.outerWidth  - window.innerWidth)  > THRESHOLD ||
        (window.outerHeight - window.innerHeight) > THRESHOLD;
      setDevToolsOpen(open);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [view]);

  // ============================================================
  // 친구 초대 함수
  // ============================================================
  async function loadReferralData() {
    setReferralLoading(true);
    try {
      const [codeRes, listRes] = await Promise.all([
        fetch('/api/referral/code', { headers: api._authHeader() }).then(r => r.json()),
        fetch('/api/referral/list', { headers: api._authHeader() }).then(r => r.json()),
      ]);
      if (codeRes.success) setReferralData(codeRes.data);
      if (listRes.success) setReferralList(listRes.data);
    } catch (e) { console.error('referral load error', e); }
    setReferralLoading(false);
  }

  async function applyReferralCode() {
    const code = referralInput.trim().toUpperCase();
    if (!code) { setReferralMsg({ type: 'error', text: '초대 코드를 입력해주세요.' }); return; }
    setReferralMsg({ type: 'loading', text: '적용 중...' });
    const r = await fetch('/api/referral/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...api._authHeader() },
      body: JSON.stringify({ code }),
    }).then(r => r.json());
    if (r.success) {
      setReferralMsg({ type: 'success', text: r.message });
      setCredits(r.data.balance);
      setReferralInput('');
    } else {
      setReferralMsg({ type: 'error', text: r.error || '적용 실패' });
    }
  }

  function copyInviteLink(url) {
    navigator.clipboard?.writeText(url).then(() => {
      setReferralMsg({ type: 'success', text: '초대 링크가 복사되었습니다!' });
      setTimeout(() => setReferralMsg({ type: '', text: '' }), 2000);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setReferralMsg({ type: 'success', text: '링크 복사 완료!' });
      setTimeout(() => setReferralMsg({ type: '', text: '' }), 2000);
    });
  }

  // ============================================================
  // 관리자 함수
  // ============================================================
  async function adminFetch(path, opts = {}) {
    return fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminSecretInput,
        ...(opts.headers || {}),
      },
    }).then(r => r.json());
  }

  // 관리자 로그인 — 입력한 비밀번호로 실제 검증 후 통과 (틀리면 에러, 패널 안 열림)
  async function tryAdminLogin() {
    if (!adminSecretInput.trim() || adminLoading) { if (!adminSecretInput.trim()) setAdminAuthError('비밀번호를 입력해주세요.'); return; }
    setAdminAuthError(''); setAdminLoading(true);
    try {
      const r = await adminFetch('/api/admin/stats');
      if (r && r.success) {
        setAdminStats(r.data);
        setAdminAuthenticated(true);
        loadAdminOverview();
      } else {
        setAdminAuthError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setAdminAuthError('네트워크 오류. 다시 시도해주세요.');
    } finally { setAdminLoading(false); }
  }

  async function loadAdminOverview() {
    setAdminLoading(true);
    try {
      const [stats, daily, tests] = await Promise.all([
        adminFetch('/api/admin/stats'),
        adminFetch('/api/admin/stats/daily?days=30'),
        adminFetch('/api/admin/stats/tests'),
      ]);
      if (stats.success)  setAdminStats(stats.data);
      if (daily.success)  setAdminDaily(daily.data);
      if (tests.success)  setAdminTestStats(tests.data);
    } catch(e) { setAdminMsg({ type:'error', text:'로드 실패: '+e.message }); }
    setAdminLoading(false);
  }

  // 검사 ↔ 게임 루프 퍼널 (③ 정방향 / ⑥ 역방향)
  async function loadAdminLoop() {
    setAdminLoading(true);
    try {
      const r = await adminFetch('/api/admin/loop-metrics?days=30');
      if (r.success) setAdminLoop(r.data);
      else setAdminMsg({ type:'error', text: r.error || '루프 지표 로드 실패' });
    } catch(e) { setAdminMsg({ type:'error', text:'로드 실패: '+e.message }); }
    setAdminLoading(false);
  }

  // A(a1): AI 해석 피드백 집계
  async function loadAdminFb() {
    setAdminLoading(true);
    try {
      const r = await adminFetch('/api/admin/feedback-metrics?days=30');
      if (r.success) setAdminFb(r.data);
      else setAdminMsg({ type:'error', text: r.error || '피드백 지표 로드 실패' });
    } catch(e) { setAdminMsg({ type:'error', text:'로드 실패: '+e.message }); }
    setAdminLoading(false);
  }

  async function loadAdminUsers(page = 1) {
    setAdminLoading(true);
    try {
      const r = await adminFetch(`/api/admin/users?page=${page}&limit=20${adminSearch ? '&search='+encodeURIComponent(adminSearch) : ''}`);
      if (r.success) setAdminUsers(r.data);
      else setAdminMsg({ type:'error', text: r.error });
    } catch(e) { setAdminMsg({ type:'error', text: e.message }); }
    setAdminLoading(false);
  }

  async function loadAdminPayments(page = 1) {
    setAdminLoading(true);
    try {
      const r = await adminFetch(`/api/admin/payments?page=${page}&limit=20`);
      if (r.success) setAdminPayments(r.data);
      else setAdminMsg({ type:'error', text: r.error });
    } catch(e) { setAdminMsg({ type:'error', text: e.message }); }
    setAdminLoading(false);
  }

  async function grantCredits() {
    const { userId, amount, type, reason } = creditGrantForm;
    if (!userId || !amount) { setAdminMsg({ type:'error', text:'사용자 ID와 금액을 입력하세요.' }); return; }
    const r = await adminFetch(`/api/admin/users/${userId}/credits`, {
      method: 'POST',
      body: JSON.stringify({ amount: parseInt(amount), type, reason }),
    });
    if (r.success) {
      setAdminMsg({ type:'success', text: r.message });
      setCreditGrantForm({ userId: '', amount: '', type: 'gain', reason: 'admin_grant' });
    } else {
      setAdminMsg({ type:'error', text: r.error });
    }
  }

  async function processRefund(chargeId) {
    if (!confirm(`결제 ID ${chargeId} 환불 처리하시겠습니까?\n크레딧이 회수되고 PG 취소는 별도 처리가 필요합니다.`)) return;
    const r = await adminFetch(`/api/admin/payments/${chargeId}/refund`, { method: 'POST' });
    if (r.success) {
      setAdminMsg({ type:'success', text: r.message });
      loadAdminPayments();
    } else {
      setAdminMsg({ type:'error', text: r.error });
    }
  }

  // ============================================================
  // 기존 검사 로직 유지용 함수들 (하위 호환)
  // ============================================================
  function genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function storeSession(data) {
    // 비로그인 체험 세션은 localStorage에 저장하지 않음 (누적 방지)
    if (!isLoggedIn && !activeLinkId) return;
    storage.set('session_' + data.sessionId, JSON.stringify(data));
    const listRaw = storage.get('submitted_list');
    const list    = listRaw ? JSON.parse(listRaw.value) : [];
    // 최대 20개 유지
    list.unshift({ sessionId: data.sessionId, testType: data.testType, createdAt: data.createdAt, linkId: data.linkId });
    if (list.length > 20) list.splice(20);
    storage.set('submitted_list', JSON.stringify(list));
    setSubmitted(list);
  }

  function loadAllSubmitted() {
    const r    = storage.get('submitted_list');
    const list = r ? JSON.parse(r.value) : [];
    setSubmitted(list);
  }

  function getSession(sessionId) {
    const r = storage.get('session_' + sessionId);
    return r ? JSON.parse(r.value) : null;
  }

  // ============================================================
  // AI 채팅 — Authorization 헤더 추가
  // ============================================================
  function buildTestSummary(testType) {
    const en = lang === 'en';
    try {
      if (testType === 'SCT') {
        const { filled, byScale } = calcSrci();
        const sample = Object.entries(byScale).map(([s,items]) => `[${s}] ${items.slice(0,1).map(a=>a.answer).join(' / ')}`).join('\n');
        return en
          ? `SRCI Self-Response Completion (${filled}/25 completed)\n${sample}`
          : `SRCI 자기반응 완성검사 (완성 ${filled}/25)\n${sample}`;
      }
      if (testType === 'DSI') {
        const { scales, total } = calcSdri();
        const scalesStr = Object.entries(scales).map(([k,v])=>`${k}: ${v}`).join(', ');
        return en
          ? `SDRI Self-Differentiation total: ${total}\n${scalesStr}`
          : `SDRI 자기분화 반응성 검사 총점: ${total}점\n${scalesStr}`;
      }
      if (testType === 'PHQ9') {
        const r = calcPhq9();
        const items = Object.entries(phq9Responses).map(([k, v]) => `Q${+k+1}:${v}`).join(', ');
        return en
          ? `PHQ-9 total: ${r.total}/27 (${r.level})\n${items}`
          : `PHQ-9 총점: ${r.total}/27 (${r.level})\n${items}`;
      }
      if (testType === 'GAD7') {
        const r = calcGad7();
        return en
          ? `GAD-7 total: ${r.total}/21 (${r.level})`
          : `GAD-7 총점: ${r.total}/21 (${r.level})`;
      }
      if (testType === 'DASS21') {
        const r = calcDass21();
        return en
          ? `DASS-21 — Depression:${r.depression.score}(${r.depression.level}), Anxiety:${r.anxiety.score}(${r.anxiety.level}), Stress:${r.stress.score}(${r.stress.level})`
          : `DASS-21 — 우울:${r.depression.score}(${r.depression.level}), 불안:${r.anxiety.score}(${r.anxiety.level}), 스트레스:${r.stress.score}(${r.stress.level})`;
      }
      if (testType === 'BIG5') {
        const r = calcBig5();
        const factors = Object.entries(r).map(([k,v]) => `${k}:${v}`).join(', ');
        return en
          ? `Big Five personality: ${factors}`
          : `Big5 성격검사: ${factors}`;
      }
      if (testType === 'BURNOUT') {
        const r = calcBurnout();
        return en
          ? `K-MBI+ Burnout: ${r.totalScore}/240 (${r.percentage}%)`
          : `K-MBI+ 번아웃: ${r.totalScore}/240 (${r.percentage}%, ${r.level})`;
      }
      if (testType === 'LOST') {
        const r = calcLost();
        const axisLabel = en
          ? { E:"Energy",D:"Decision",S:"Speed",N:"Stability",R:"Relation",T:"Stress" }
          : { E:"에너지",D:"의사결정",S:"행동속도",N:"안정성",R:"관계민감도",T:"스트레스반응" };
        const axisText = Object.entries(r.axisAvg).map(([k,v]) => `${axisLabel[k]}:${Number(v).toFixed(1)}`).join(', ');
        return en
          ? `LOST type: ${r.typeCode} (${r.typeInfo?.eng || r.typeInfo?.name})\nAxes: ${axisText}`
          : `LOST 행동유형: ${r.typeCode} (${r.typeInfo?.name})\n축별: ${axisText}`;
      }
      if (testType === 'RIASEC') {
        const { sorted, dominantType } = calcRiasec();
        const top2 = sorted.slice(0,2).map(([k,s]) => `${k}:${s}`).join(', ');
        return en
          ? `Holland RIASEC dominant type: ${dominantType} (top2: ${top2})`
          : `Holland RIASEC 우세 유형: ${dominantType}형 (상위2: ${top2})`;
      }
      if (testType === 'VALUES') {
        const { sorted } = calcValues();
        const top3 = sorted.slice(0,3).map(([k,s]) => `${VALUES_DOMAIN_INFO[k]?.label || k}:${s}`).join(', ');
        return en
          ? `Work Values top 3: ${top3}`
          : `직업가치관 상위 3: ${top3}`;
      }
      if (testType === 'GENERAL' || !testType) {
        return en ? 'General counseling (no test result)' : '일반 AI 상담 (검사 결과 없음 — 자유 상담)';
      }
    } catch { /* 무시 */ }
    return '';
  }

  // AI 채팅 횟수 증가 + localStorage 저장
  function incrementAiChatUsed() {
    if (!isLoggedIn) {
      // 비회원: 평생 누적 카운터 증가
      const next = guestAiTotal + 1;
      setGuestAiTotal(next);
      try { localStorage.setItem(AI_GUEST_KEY, String(next)); } catch {}
      return next;
    }
    const next = aiChatUsed + 1;
    setAiChatUsed(next);
    try { localStorage.setItem(AI_LIMIT_KEY, String(next)); } catch {}
    return next;
  }

  // AI 채팅 한도 초과 여부
  function isAiChatExhausted() {
    if (!isLoggedIn) return guestAiTotal >= AI_GUEST_TOTAL;
    if (credits <= 0) return aiChatUsed >= AI_LIMIT_FREE;
    return false; // 크레딧 보유 시 무제한 — 횟수 기준 소진 없음
  }

  async function sendChatMessage(testType) {
    const input = chatInput.trim();
    if (!input || chatStreaming) return;

    // 횟수 초과 확인
    if (isAiChatExhausted()) {
      setShowAiLimitModal(true);
      return;
    }

    const summary = buildTestSummary(testType);
    const userMsg = { role: 'user', content: input, id: Date.now() };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatStreaming(true);
    setChatError('');

    const assistantId = Date.now() + 1;
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);

    try {
      await api.ensureToken();   // ⚠️ 만료 토큰이면 서버가 게스트로 강등→429. 전송 전 갱신.
      const history = [...chatMessages.filter(m => m.content && m.content.trim() && !m.streaming), userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() }));
      const res     = await fetch('/api/ai-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body:    JSON.stringify({ messages: history, testContext: { testType, counselingType: counselingMode || 'psychological', summary, lang }, dailyContext: dailyCtxCard?.chatContext || null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setShowCreditModal(true);
          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
          setChatStreaming(false);
          return;
        }
        // 429: 한도 초과 → 항상 모달
        if (res.status === 429) {
          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
          setChatStreaming(false);
          if (!isLoggedIn) {
            setGuestAiTotal(AI_GUEST_TOTAL);
            try { localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL)); } catch {}
          } else {
            setAiChatUsed(AI_LIMIT_FREE);
          }
          setShowAiLimitModal(true);
          return;
        }
        throw new Error(err.error || '서버 오류');
      }

      // 크레딧 차감됐으므로 잔액 갱신
      refreshCredits();

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
            }
          } catch { /* 무시 */ }
        }
      }
      // [MOOD:N] 태그 추출 후 제거
      const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
      const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
      const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, '').trimEnd();
      incrementAiChatUsed();
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m));
      if (moodScore !== null && isLoggedIn) {
        api._fetch('/api/chat/mood-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moodScore, testType }) }).catch(() => {});
      }
    } catch (e) {
      const errMsg = e.message || 'AI 채팅 중 오류가 발생했습니다.';
      // 502는 API 키 미설정 가능성 안내
      setChatError(errMsg.includes('502') || errMsg.includes('Bad Gateway')
        ? 'AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.'
        : errMsg);
      setChatMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setChatStreaming(false);
    }
  }

  function resetChat() { setChatMessages([]); setChatInput(''); setChatError(''); setChatStreaming(false); }

  // ============================================================
  // 공통 UI 컴포넌트
  // ============================================================
  const Msg = ({ msg, extra }) => !msg.text ? null : (
    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
      msg.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
      msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
      msg.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
      'bg-gray-50 text-gray-700 border border-gray-200'
    }`}>
      {msg.text}
      {extra}
    </div>
  );

  // 크레딧 표시 배지
  const CreditBadge = () => (
    <button
      onClick={() => setShowChargeView(true)}
      className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-green-100 transition"
    >
      ✦ {credits} {t('크레딧','cr')}
    </button>
  );

  // 크레딧 부족 모달
  const CreditModal = () => !showCreditModal ? null : (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">✦</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">{t('크레딧이 부족합니다', 'Not Enough Credits')}</h2>
          <p className="text-sm text-gray-500">{t('심리검사 1회 = 10 크레딧', 'Assessment = 10 credits')}<br/>{t('AI 채팅 1회 = 2 크레딧', 'AI chat = 2 credits')}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 mb-5 text-center">
          <span className="text-green-800 font-semibold">{t('현재 잔액', 'Balance')}: {credits} {t('크레딧', 'credits')}</span>
        </div>
        <button
          onClick={() => { setShowCreditModal(false); setShowChargeView(true); }}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-3"
        >{t('크레딧 구매하기', 'Buy Credits')}</button>
        <button
          onClick={() => setShowCreditModal(false)}
          className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
        >{t('나중에', 'Later')}</button>
      </div>
    </div>
  );

  // ── AI 횟수 초과 모달 ─────────────────────────────────────
  // 가입 직후 이메일 인증 안내 모달 — "인증해야 가입 완료" + 재발송
  const SignupVerifyModal = () => !signupVerifyEmail ? null : (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setSignupVerifyEmail(null)}>
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">📧</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{t('이메일 인증이 필요해요','Verify your email')}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-1">
          {t(<><span className="font-bold text-emerald-700 break-all">{signupVerifyEmail}</span> 로<br />인증 메일을 보냈어요.</>, <>We sent a verification email to<br /><span className="font-bold text-emerald-700 break-all">{signupVerifyEmail}</span>.</>)}
        </p>
        <p className="text-sm text-gray-700 font-semibold leading-relaxed mb-1">{t('메일 속 링크를 눌러 인증을 완료해야 가입이 완료돼요.','Click the link in the email to complete your sign-up.')}</p>
        <p className="text-xs text-gray-400 mb-5">{t('메일이 안 보이면 스팸함도 확인해 주세요.',"If you don't see it, please check your spam folder.")}</p>
        <button onClick={async () => {
          setFormMsg({ type: 'loading', text: t('재발송 중...','Resending...') });
          try {
            const r = await fetch('/api/auth/resend-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: signupVerifyEmail }) }).then(r => r.json());
            window.alert(r.success ? t('✅ 인증 메일을 재발송했어요. 메일함을 확인해 주세요.','✅ Verification email resent. Please check your inbox.') : (r.error || t('재발송 실패','Resend failed')));
          } catch { window.alert(t('재발송 실패','Resend failed')); }
          setFormMsg({ type: '', text: '' });
        }} className="w-full mb-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition">{t('📧 인증 메일 재발송','Resend verification email')}</button>
        <button onClick={() => { setSignupVerifyEmail(null); setView('memberLogin'); }} className="w-full text-gray-500 text-sm py-2 hover:text-gray-700">{t('인증 후 로그인하기','I\'ll log in after verifying')}</button>
      </div>
    </div>
  );

  const AiLimitModal = () => !showAiLimitModal ? null : (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
        {!isLoggedIn ? (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🌿</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("무료 체험이 끝났습니다","Free trial ended")}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t(<>AI 상담 <strong>{AI_GUEST_TOTAL}회</strong>를 모두 사용했어요.<br/>회원가입하면 <span className="text-green-700 font-bold">20 크레딧 즉시 지급</span> +<br/>검사 결과 저장 · 하루 5회 AI 상담이 제공됩니다.</>, <>You've used all <strong>{AI_GUEST_TOTAL}</strong> free AI sessions.<br/>Sign up to get <span className="text-green-700 font-bold">20 credits instantly</span> +<br/>saved history & 5 AI chats per day.</>)}
              </p>
            </div>
            <div className="space-y-2 mb-4">
              {window.KAKAO_APP_KEY && (
                <button onClick={() => { sessionStorage.setItem('post_login_view', 'aiCounsel'); setShowAiLimitModal(false); fetch('/api/auth/kakao/url').then(r=>r.json()).then(({url})=>{ if(!url)return; const p=window.open(url,'kakao_login','width=500,height=640,top=100,left=200'); window.addEventListener('message',function h(e){if(e.origin!==location.origin)return;if(e.data?.type==='kakao_login'){window.removeEventListener('message',h);handleKakaoLogin(e.data);}else if(e.data?.type==='kakao_error'){window.removeEventListener('message',h);} const t=setInterval(()=>{if(p?.closed)clearInterval(t),window.removeEventListener('message',h)},500);}); }).catch(()=>{}); }}
                  style={{ background:'#FEE500', border:'none', borderRadius:10, width:'100%', height:44,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    cursor:'pointer', fontWeight:'bold', fontSize:14, color:'#3C1E1E' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.67 5.02 4.2 6.43L6.2 20.5l4.03-2.66c.57.08 1.17.12 1.77.12 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/></svg>
                  {t("카카오로 1초 가입","Sign up with Kakao")}
                </button>
              )}
              {window.GOOGLE_CLIENT_ID && (
                <div onClick={() => { sessionStorage.setItem('post_login_view', 'aiCounsel'); setShowAiLimitModal(false); }}>
                  <GoogleSignInBtn onLogin={handleGoogleLogin} btnText="signup_with" />
                </div>
              )}
              <button onClick={() => { sessionStorage.setItem('post_login_view', 'aiCounsel'); setShowAiLimitModal(false); setView('memberSignup'); }}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition text-sm">
                {t("이메일로 무료 가입하기","Sign up free with email")}
              </button>
            </div>
            <button onClick={() => { setShowAiLimitModal(false); setView('memberLogin'); }}
              className="w-full text-green-700 text-sm py-1 hover:underline">{t("이미 계정이 있어요 → 로그인","Already have an account? Sign in")}</button>
            <button onClick={() => setShowAiLimitModal(false)}
              className="w-full text-gray-300 text-xs py-1 hover:text-gray-500 mt-1">{t("닫기","Close")}</button>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">💬</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("AI 상담 횟수를 모두 사용했습니다","Daily AI sessions used up")}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {credits <= 0
                  ? t(`크레딧이 없으면 AI 상담을 하루 ${AI_LIMIT_FREE}회까지 이용할 수 있습니다.`, `Without credits you can use ${AI_LIMIT_FREE} AI sessions per day.`)
                  : t(`크레딧 보유 시 AI 상담을 크레딧이 소진될 때까지 무제한 이용할 수 있습니다. (1회 = 2 크레딧)`, `With credits, use AI chat unlimited until credits run out. (2 credits per chat)`)}
              </p>
            </div>
            <div className="space-y-3 mb-4">
              <button onClick={() => { setShowAiLimitModal(false); setShowChargeView(true); }}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition text-sm">
                ✦ {t("크레딧 구매하여 계속 상담하기","Top up credits to continue")}
              </button>
            </div>
            <button onClick={() => setShowAiLimitModal(false)}
              className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition">{t("닫기","Close")}</button>
          </>
        )}
      </div>
    </div>
  );

  // ── 회복 루틴 카드: 3일 재방문 CTA + 게임 루틴 추천 ──────────
  function RecoveryCard({ testType, score, level, stressScore }) {
    // 검사 유형 + 점수 기반 게임 루틴 결정
    function getGameRoutine() {
      const isHighStress = (stressScore || score || 0) >= 15;
      const isHighRisk   = level === 'high';
      const isMidRisk    = level === 'mid';

      if (testType === 'BURNOUT' || isHighRisk) {
        return {
          day1: { key: 'burnout',   emoji: '⚡', label: t('번아웃 회복','Burnout Recovery') },
          day2: { key: 'gratitude', emoji: '🙏', label: t('감사 일기','Gratitude') },
          day3: { key: 'garden',    emoji: '🌱', label: t('마음 정원','Mind Garden') },
          reason: t('소진 신호가 높을 때는 번아웃 회복 → 감사 → 정원 순서가 효과적입니다.','When burnout is high: Recovery → Gratitude → Garden works best.'),
        };
      }
      if (testType === 'PHQ9' || testType === 'DASS21') {
        return {
          day1: { key: 'gratitude', emoji: '🙏', label: t('감사 일기','Gratitude') },
          day2: { key: 'garden',    emoji: '🌱', label: t('마음 정원','Mind Garden') },
          day3: { key: 'tree',      emoji: '🌳', label: t('마음 나무','Mind Tree') },
          reason: t('감정 안정에는 감사 → 정원 → 나무 루틴이 도움이 됩니다.','Gratitude → Garden → Tree helps stabilize emotions.'),
        };
      }
      if (testType === 'GAD7') {
        return {
          day1: { key: 'garden',    emoji: '🌱', label: t('마음 정원','Mind Garden') },
          day2: { key: 'tree',      emoji: '🌳', label: t('마음 나무','Mind Tree') },
          day3: { key: 'gratitude', emoji: '🙏', label: t('감사 일기','Gratitude') },
          reason: t('불안이 높을 때는 정원 → 나무 → 감사 순서로 천천히 이완하세요.','When anxiety is high: Garden → Tree → Gratitude for gradual relaxation.'),
        };
      }
      if (testType === 'LOST' || testType === 'BIG5') {
        return {
          day1: { key: 'efmt',      emoji: '😊', label: t('감정 표현','Express Emotions') },
          day2: { key: 'tree',      emoji: '🌳', label: t('마음 나무','Mind Tree') },
          day3: { key: 'garden',    emoji: '🌱', label: t('마음 정원','Mind Garden') },
          reason: t('자기이해 검사 후에는 감정 표현 → 나무 → 정원 루틴을 추천합니다.','After self-insight tests: Express → Tree → Garden routine is recommended.'),
        };
      }
      return {
        day1: { key: 'garden',    emoji: '🌱', label: t('마음 정원','Mind Garden') },
        day2: { key: 'gratitude', emoji: '🙏', label: t('감사 일기','Gratitude') },
        day3: { key: 'efmt',      emoji: '😊', label: t('감정 표현','Express Emotions') },
        reason: t('오늘부터 3일간 짧은 루틴으로 마음을 돌봐보세요.','Try a short routine for 3 days starting today.'),
      };
    }

    async function launchGame(gameKey) {
      if (!isLoggedIn) {
        alert(t('마음 게임은 로그인 후 이용 가능합니다.','MaumGame requires login.'));
        return;
      }
      // openMaumGame과 동일하게 7일 게임 토큰 사용
      await openMaumGame(gameKey);
    }

    const routine = getGameRoutine();
    const checkinDate = new Date();
    checkinDate.setDate(checkinDate.getDate() + 3);
    const checkinLabel = lang === 'en'
      ? checkinDate.toLocaleDateString('en-US', { month:'short', day:'numeric' })
      : `${checkinDate.getMonth()+1}월 ${checkinDate.getDate()}일`;

    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 mt-4">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h3 className="font-bold text-emerald-800 text-base">{t("오늘부터 3일 회복 루틴","3-Day Recovery Routine")}</h3>
            <p className="text-xs text-emerald-600">{routine.reason}</p>
          </div>
        </div>

        {/* 게임 루틴 3일 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { day: 'Day 1', game: routine.day1 },
            { day: 'Day 2', game: routine.day2 },
            { day: 'Day 3', game: routine.day3 },
          ].map(({ day, game }) => (
            <button
              key={day}
              onClick={() => launchGame(game.key)}
              className="bg-white rounded-xl p-3 text-center border border-emerald-100 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
            >
              <p className="text-xs text-emerald-500 font-semibold mb-1">{day}</p>
              <p className="text-xl mb-1">{game.emoji}</p>
              <p className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">{game.label}</p>
            </button>
          ))}
        </div>

        {/* 3일 재방문 CTA */}
        <div className="bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-800">📅 {checkinLabel} {t("변화 체크","check-in")}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t("3일 후 다시 체크하면 마음의 변화를 비교해 드려요","Check back in 3 days to track how you feel")}</p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('maumful_checkin_date', checkinDate.toISOString());
              localStorage.setItem('maumful_checkin_test', testType);
              alert(t(`✅ ${checkinLabel}에 다시 체크하도록 기억해 드릴게요!\n\n마음풀에 다시 방문해 같은 검사를 진행하시면\n이전 결과와 비교해 드립니다.`,`✅ We'll remind you to check in on ${checkinLabel}!\n\nVisit Maumful and take the same test again to compare your progress.`));
            }}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition whitespace-nowrap"
          >
            {t("기억하기 →","Remind me →")}
          </button>
        </div>

        {/* 면책 */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          {t("본 결과는 자기이해를 위한 참고 자료이며, 의학적 진단이 아닙니다.","These results are for self-understanding only and are not a medical diagnosis.")}
        </p>
      </div>
    );
  }

  // ── 상담 연결 CTA (결과 화면 하단 공통) ──────────────────────
  function ExpertCTA({ testType, score, level, onContinueAI }) {
    const limit = !isLoggedIn ? AI_GUEST_TOTAL : (credits > 0 ? null : AI_LIMIT_FREE); // null = 무제한
    const usedCount = !isLoggedIn ? guestAiTotal : aiChatUsed;
    return (
      <div className="rounded-2xl border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-green-50 p-5 mt-4">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤝</span>
          <div>
            <h3 className="font-bold text-teal-800 text-base">{t("더 깊은 이야기, 함께해요","Let's explore deeper together")}</h3>
            <p className="text-xs text-gray-500">{t("검사 결과는 자기이해를 위한 참고 자료입니다. 의학적 진단이 아닙니다.","Results are for self-understanding only, not medical diagnosis.")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {onContinueAI && (
            <button onClick={isAiChatExhausted() ? () => setShowAiLimitModal(true) : onContinueAI}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition
                ${isAiChatExhausted()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-teal-200 text-teal-700 hover:bg-teal-50'}`}>
              {isAiChatExhausted()
                ? t(`💬 AI 상담 ${usedCount}/${limit ?? '∞'}회 완료`,`💬 AI sessions used ${usedCount}/${limit ?? '∞'}`)
                : t(`💬 AI와 더 이야기하기 (${limit == null ? t('무제한','unlimited') : `${usedCount}/${limit}회`})`,`💬 Talk more with AI (${limit == null ? 'unlimited' : `${usedCount}/${limit}`})`)}
            </button>
          )}
          <button
            onClick={() => { setView('counseling'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition text-white bg-teal-600 hover:bg-teal-700">
            🏥 {t("상담센터 찾기","Find a Center")}
          </button>
        </div>

        <div className="bg-white/80 rounded-xl p-4 border border-teal-100">
          <p className="text-xs font-bold text-gray-500 mb-3">📞 {t("언제든 이용할 수 있는 무료 상담","Free counseling resources")}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{t("자살예방상담전화","Suicide Prevention Hotline")}</p>
                <p className="text-xs text-gray-400">{t("24시간 무료 · 보건복지부","24/7 Free · Ministry of Health")}</p>
              </div>
              <a href="tel:109"
                className="bg-rose-50 text-rose-600 font-bold text-xl px-4 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition">
                109
              </a>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{t("정신건강위기상담전화","Mental Health Crisis Line")}</p>
                <p className="text-xs text-gray-400">{t("24시간 무료 · 전국 연결","24/7 Free · Nationwide")}</p>
              </div>
              <a href="tel:15770199"
                className="bg-blue-50 text-blue-600 font-bold text-sm px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap">
                1577-0199
              </a>
            </div>
            <div className="h-px bg-gray-100" />
            <a href="https://blutouch.net/facility/center" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-1 rounded-lg hover:bg-teal-50 transition group">
              <div>
                <p className="text-sm font-semibold text-gray-800">{t("지역 정신건강복지센터 찾기","Find a Local Mental Health Center")}</p>
                <p className="text-xs text-gray-400">{t("전국 시·군·구 무료 방문 상담 · 블루터치","Free in-person counseling nationwide · Blutouch")}</p>
              </div>
              <span className="text-teal-500 text-sm font-bold group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 쿠키 동의 배너 (EU 사용자용)
  const CookieBanner = () => !showCookieBanner ? null : (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-2xl">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm flex-1 text-gray-200">
          {t("저희 서비스는 필수 쿠키만 사용합니다. 로그인 상태 유지와 서비스 제공에 필요한 최소한의 정보만 저장됩니다.","We use only essential cookies — the minimum needed to keep you logged in and deliver the service.")}{' '}
          <button onClick={() => setView('privacy')} className="underline text-green-400 hover:text-green-100">{t("자세히 보기","Learn more")}</button>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { localStorage.setItem('cookie_consent', 'accepted'); setShowCookieBanner(false); }}
            className="bg-green-600 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >{t("동의","Accept")}</button>
          <button
            onClick={() => { localStorage.setItem('cookie_consent', 'essential'); setShowCookieBanner(false); }}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded-lg transition"
          >{t("필수만","Essential only")}</button>
        </div>
      </div>
    </div>
  );

  // 초기화 완료 전 — 빈 화면 (랜딩 플래시 방지)
  if (initializing) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 32 }}>🌿</div>
    </div>
  );

  // ── 보호 레이어 (보호 뷰에서 항상 최상단 렌더) ──────────────
  const isProtectedView = PROTECTED_VIEWS.has(view);
  const ProtectionLayers = isProtectedView ? (
    <>
      {/* 워터마크 — 사용자 이메일 반복 (캡처 추적) */}
      <WatermarkOverlay email={currentUser?.email} />
      {/* 개발자도구 감지 시 콘텐츠 블러 오버레이 */}
      {devToolsOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.93)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            개발자 도구가 감지되었습니다
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 1.8 }}>
            콘텐츠 보호를 위해 개발자 도구를 닫아주세요.<br/>
            닫으면 자동으로 해제됩니다.
          </div>
        </div>
      )}
    </>
  ) : null;

  // ============================================================
  // 뷰: 랜딩 홈 페이지 (비로그인 기본 진입점)
  // ============================================================
  if (view === 'partnerIntro') return (
    <div style={{ minHeight: '100vh', background: '#FDF7F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>💕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D2D2D', marginBottom: 8 }}>
          {partnerMode?.hostName}님의 커플 분석 초대
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.8 }}>
          함께 심리검사를 완료하면<br/>커플 궁합 리포트를 받아볼 수 있어요.
        </div>
        <div style={{ background: '#FFF0F4', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#C06080', fontWeight: 600 }}>
          필요한 검사: {(partnerMode?.testType || '').split('+').map((t, i, arr) => (
            <span key={t}>{t === 'DSI' ? 'SDRI 자아분화' : t}{i < arr.length - 1 ? ' + ' : ''}</span>
          ))}
        </div>
        <button
          onClick={() => setView('partnerTest:' + partnerMode?.pendingTests[0])}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #E87090, #F5A0B5)', color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif" }}
        >검사 시작하기</button>
        <div style={{ fontSize: 11, color: '#BBB', marginTop: 12 }}>로그인 없이 참여 가능합니다</div>
      </div>
    </div>
  );

  if (view === 'partnerComplete') return (
    <div style={{ minHeight: '100vh', background: '#FDF7F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D2D2D', marginBottom: 12 }}>검사 완료!</div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>
          {partnerMode?.hostName}님이 이제<br/>커플 리포트를 확인할 수 있어요.<br/>
          <span style={{ color: '#BBB', fontSize: 12 }}>창을 닫아도 됩니다.</span>
        </div>
      </div>
    </div>
  );

  // 공지사항 목록 — 약관이 약속한 고지 기록. 비로그인도 볼 수 있음.
  if (view === 'notices') return (
    <>
      <GlobalNav
        setView={setView}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        credits={credits}
        activeView="notices"
        lang={lang}
        onLangToggle={updateLang}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => setView(isLoggedIn ? 'memberDashboard' : 'landing')}
            className="text-gray-400 hover:text-green-700 text-sm mb-5 flex items-center gap-1">← {t('뒤로','Back')}</button>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">📢</span>
            <h1 className="text-2xl font-bold text-gray-800">{t('공지사항','Notices')}</h1>
          </div>

          {notices === null && <div className="text-sm text-gray-400 text-center py-12">{t('불러오는 중...','Loading...')}</div>}
          {notices && notices.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <div className="text-4xl mb-3">🌿</div>
              <div className="text-sm text-gray-400">{t('아직 등록된 공지가 없습니다.','No notices yet.')}</div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {(notices || []).map(n => (
              <div key={n.id} className={`bg-white rounded-2xl p-5 border ${n.is_important ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {!!n.is_important && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">{t('중요','Important')}</span>}
                  <h2 className="text-base font-bold text-gray-800">{n.title}</h2>
                </div>
                <div className="text-xs text-gray-400 mb-3">{(n.created_at || '').slice(0, 10)}</div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (view === 'landing') return (
    <>
      <GlobalNav
        setView={setView}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        credits={credits}
        activeView="landing"
        lang={lang}
        onLangToggle={updateLang}
      />
      <LandingPage setView={setView} isLoggedIn={isLoggedIn} lang={lang} setMyPageTab={setMyPageTab} loadTestHistory={loadTestHistory} setAutoOpenExternal={setShowExternalModal} />
      {/* 랜딩 뷰에서도 외부검사 모달 호출 가능 (hideTrigger: 버튼 없이 모달만) */}
      {isLoggedIn && <ExternalResultSection onSaved={loadTestHistory} hideTrigger externalShow={showExternalModal} setExternalShow={setShowExternalModal} />}
      {isMaster && <MasterDebugPanel />}
    </>
  );

  // ============================================================
  // 뷰: 검사 소개 페이지 (비로그인 접근 가능)
  // ============================================================
  if (view === 'testsIntro') return (
    <>
      <GlobalNav
        setView={setView}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        credits={credits}
        activeView="testsIntro"
        lang={lang}
        onLangToggle={updateLang}
      />
      <TestsIntroPage setView={setView} isLoggedIn={isLoggedIn} lang={lang} />
    </>
  );

  // ============================================================
  // 뷰: 상담센터 플랫폼
  // ============================================================
  if (view === 'counseling') return (
    <>
      <GlobalNav
        setView={setView}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        credits={credits}
        activeView="counseling"
        lang={lang}
        onLangToggle={updateLang}
      />
      <CounselingPage
        setView={setView}
        lang={lang}
      />
    </>
  );

  // ============================================================
  // 뷰: 상담 어드민 (별도 인증)
  // ============================================================
  if (view === 'counselingAdmin') return (
    <CounselingAdminPage setView={setView} />
  );

  // ============================================================
  // 뷰: 게임 소개 (추후 개발 — 임시 안내)
  // ============================================================
  if (view === 'gameIntro') return (
    <>
      <GlobalNav
        setView={setView}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        credits={credits}
        activeView="gameIntro"
        lang={lang}
        onLangToggle={updateLang}
      />
      <div style={{minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:"'Noto Sans KR',sans-serif"}}>
        <div style={{fontSize:64}}>🎮</div>
        <h2 style={{fontSize:28, fontWeight:700}}>마음 게임</h2>
        <p style={{color:'#5A5A5A', fontSize:16}}>현재 개발 중입니다. 곧 출시됩니다!</p>
        <button onClick={() => setView('landing')} style={{marginTop:8, background:'#2D6A4F', color:'white', border:'none', borderRadius:10, padding:'12px 28px', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif"}}>← 홈으로</button>
      </div>
    </>
  );

  // ============================================================
  // 뷰: 로그인
  // ============================================================
  if (!isLoggedIn && view === 'memberLogin') return (
    <div className="bg-gradient-to-br from-slate-50 to-green-100 flex flex-col items-center px-4 py-10" style={{minHeight:'100dvh'}}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={() => setView('landing')}
          className="flex items-center gap-1 text-gray-400 hover:text-green-700 text-sm mb-4 transition">
          {t("← 홈으로","← Home")}
        </button>
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-3xl font-bold text-gray-800">Maumful</h1>
          <p className="text-gray-400 text-sm mt-1">{t("나를 이해하는 첫걸음","Your first step to self-understanding")}</p>
        </div>

        {sessionStorage.getItem('pending_ref_code') && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
            {t(<>🎁 초대 링크로 접속하셨습니다! 가입 후 <strong>+10 크레딧</strong>이 추가 지급됩니다.</>, <>🎁 You joined via invite! Sign up to get <strong>+10 bonus credits</strong>.</>)}
          </div>
        )}
        <Msg msg={loginMsg} extra={
          loginMsg.type === 'error' && pendingVerifyEmail ? (
            <button
              onClick={async () => {
                const r = await fetch('/api/auth/resend-verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: pendingVerifyEmail }),
                });
                const d = await r.json();
                setLoginMsg({ type: d.success ? 'success' : 'error',
                  text: d.success ? t('✅ 인증 메일을 재발송했습니다. 메일함을 확인해주세요.','✅ Verification email resent. Please check your inbox.') : (d.error || t('재발송 실패','Resend failed')) });
                if (d.success) setPendingVerifyEmail('');
              }}
              className="mt-2 block text-xs font-semibold underline text-red-500 hover:text-red-700 cursor-pointer"
            >
              {t("📧 인증 메일 재발송하기","📧 Resend verification email")}
            </button>
          ) : null
        } />
        <div className="space-y-3 mb-5">
          <input id="login-email" type="email" placeholder={t("이메일","Email")} autoComplete="email"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
            onKeyDown={e => e.key === 'Enter' && document.getElementById('login-pw').focus()} />
          <input id="login-pw" type="password" placeholder={t("비밀번호 (8자 이상)","Password (min. 8 chars)")} autoComplete="current-password"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button onClick={handleLogin}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-4 text-base">
          {t("로그인","Sign In")}
        </button>
        {(window.KAKAO_APP_KEY || window.GOOGLE_CLIENT_ID || window.NAVER_CLIENT_ID) && (
          <div className="space-y-2 mb-4">
            {window.KAKAO_APP_KEY && <KakaoLoginBtn onLogin={handleKakaoLogin} />}
            {window.NAVER_CLIENT_ID && <NaverLoginBtn onLogin={handleNaverLogin} />}
            {window.GOOGLE_CLIENT_ID && <GoogleSignInBtn onLogin={handleGoogleLogin} btnText="signin_with" />}
          </div>
        )}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div>
          <div className="relative flex justify-center"><span className="px-3 bg-white text-gray-400 text-xs">{t("또는","or")}</span></div>
        </div>
        <button
          onClick={() => setView('memberSignup')}
          className="w-full bg-white border-2 border-green-200 text-green-800 py-3 rounded-xl font-semibold hover:bg-green-50 transition mb-3">
          {t("이메일로 회원가입","Sign up with email")}
        </button>
        <button
          onClick={() => { setLoginMsg({ type: '', text: '' }); setView('forgotPassword'); }}
          className="w-full text-center text-gray-400 text-sm hover:text-gray-600 py-1">
          {t("비밀번호를 잊으셨나요?","Forgot your password?")}
        </button>
        <button
          onClick={async () => {
            const email = document.getElementById('login-email')?.value.trim();
            if (!email) { setLoginMsg({ type:'error', text:t('이메일을 먼저 입력해주세요.','Please enter your email first.') }); return; }
            setLoginMsg({ type:'loading', text:t('인증 메일 발송 중...','Sending verification email...') });
            const r = await fetch('/api/auth/resend-verify', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ email }),
            }).then(r => r.json());
            setLoginMsg({ type: r.success ? 'success' : 'error', text: r.message || r.error });
            setTimeout(() => setLoginMsg({ type:'', text:'' }), 5000);
          }}
          className="w-full text-center text-gray-300 text-xs hover:text-gray-500 py-1">
          {t("인증 메일을 받지 못하셨나요? 재발송","Didn't receive verification email? Resend")}
        </button>
        <div className="flex justify-center gap-4 mt-3">
          <button onClick={() => setView('notices')} className="text-xs text-gray-300 hover:text-gray-500">{t("공지사항","Notices")}</button>
          <span className="text-gray-200 text-xs">|</span>
          <button onClick={() => setView('privacy')} className="text-xs text-gray-300 hover:text-gray-500">{t("개인정보 처리방침","Privacy Policy")}</button>
          <span className="text-gray-200 text-xs">|</span>
          <button onClick={() => setView('terms')}   className="text-xs text-gray-300 hover:text-gray-500">{t("이용약관","Terms of Service")}</button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // 뷰: 회원가입
  // ============================================================
  if (!isLoggedIn && view === 'memberSignup') return (
    <div className="bg-gradient-to-br from-slate-50 to-green-100 flex flex-col items-center px-4 py-10" style={{minHeight:'100dvh'}}>
      <SignupVerifyModal />
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={() => { setView('memberLogin'); setFormMsg({ type: '', text: '' }); setSignupForm({ email: '', password: '', pwConfirm: '', nickname: '' }); }}
          className="text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1">← {t("뒤로","Back")}</button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-2xl font-bold text-gray-800">{t("회원가입","Sign Up")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t(<>가입 시 <span className="text-green-700 font-semibold">20 크레딧</span> 즉시 지급</>, <>Get <span className="text-green-700 font-semibold">20 credits</span> instantly on signup</>)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 mb-5 text-sm text-green-800 space-y-0.5">
          <p>✦ {t("가입 보너스 20 크레딧 (검사 2회)","Signup bonus: 20 credits (2 tests)")}</p>
          <p>✦ {t("PHQ9·GAD7 심리검사 무료 제공","PHQ-9 & GAD-7 assessments free")}</p>
          <p>✦ {t("AI 채팅 하루 5회 무료","5 free AI chats per day")}</p>
        </div>
        <Msg msg={formMsg} />
        <div className="space-y-3 mb-5">
          <input type="email" placeholder={t("이메일","Email")} value={signupForm.email}
            onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
          <input type="text" placeholder={t("닉네임 (AI 상담에서 이름으로 불려요)","Nickname (used in AI sessions)")} value={signupForm.nickname}
            onChange={e => setSignupForm(p => ({ ...p, nickname: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
          {/* 성별 */}
          <div className="flex gap-2">
            {[['남성',t('남성','Male')],['여성',t('여성','Female')],['선택안함',t('선택안함','Prefer not to say')]].map(([val,lbl]) => (
              <button key={val} type="button"
                onClick={() => setSignupForm(p => ({ ...p, gender: p.gender === val ? '' : val }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${signupForm.gender === val ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500'}`}>
                {lbl}
              </button>
            ))}
          </div>
          {/* 연령대 */}
          <select value={signupForm.age_range} onChange={e => setSignupForm(p => ({ ...p, age_range: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm text-gray-600 bg-white">
            <option value="">{t('연령대 선택 (선택)','Age range (optional)')}</option>
            {['10대','20대','30대','40대','50대','60대이상'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {/* 핸드폰번호 */}
          <input type="tel" placeholder={t("핸드폰번호 (선택) — 010-1234-5678","Phone (optional) — 010-1234-5678")}
            value={signupForm.phone}
            onChange={e => {
              const v = e.target.value.replace(/[^\d-]/g,'');
              setSignupForm(p => ({ ...p, phone: v }));
            }}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
          <input type="password" placeholder={t("비밀번호 (8자 이상)","Password (min. 8 chars)")} value={signupForm.password}
            onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
          <input type="password" placeholder={t("비밀번호 확인","Confirm password")} value={signupForm.pwConfirm}
            onChange={e => setSignupForm(p => ({ ...p, pwConfirm: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSignup()} />
        </div>
        <div className="mb-4 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 space-y-2">
          {(() => {
            const allRequired = signupConsents.terms && signupConsents.privacy && signupConsents.sensitive && signupConsents.overseas && signupConsents.age;
            const allIncMarketing = allRequired && signupConsents.marketing;
            return (
              <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-200">
                <input type="checkbox" className="w-4 h-4 accent-green-600"
                  checked={allIncMarketing}
                  onChange={e => {
                    const v = e.target.checked;
                    setSignupConsents({ terms: v, privacy: v, sensitive: v, overseas: v, age: v, marketing: v });
                  }} />
                <span className="font-bold text-gray-800 text-sm">{t("전체 동의 (필수 + 선택 포함)","Agree to all (required + optional)")}</span>
              </label>
            );
          })()}

          <p className="text-gray-400 font-semibold pt-1">{t("— 필수 동의 항목 —","— Required —")}</p>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.terms}
              onChange={e => setSignupConsents(p => ({ ...p, terms: e.target.checked }))} />
            <span>
              <button type="button" onClick={() => setView('terms')} className="text-green-600 underline font-semibold">{t("이용약관","Terms of Service")}</button> {t("동의","agree")}
              <span className="text-red-500 ml-1">{t("(필수)","(required)")}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.privacy}
              onChange={e => setSignupConsents(p => ({ ...p, privacy: e.target.checked }))} />
            <span>
              <button type="button" onClick={() => setView('privacy')} className="text-green-600 underline font-semibold">{t("개인정보 수집·이용","Privacy Collection & Use")}</button> {t("동의","agree")}
              <span className="text-gray-400 ml-1">{t("(이메일·닉네임·성별·연령대·연락처·이용기록 / 서비스 제공 / 탈퇴 시까지)","(email·nickname·gender·age·phone·usage / service / until withdrawal)")}</span>
              <span className="text-red-500 ml-1">{t("(필수)","(required)")}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.sensitive}
              onChange={e => setSignupConsents(p => ({ ...p, sensitive: e.target.checked }))} />
            <span><strong>{t("민감정보(정신건강 정보)","Sensitive Info (Mental Health)")}</strong> {t("수집·처리 동의","Collection & Processing")}
              <span className="text-gray-400 ml-1">{t("(심리검사·AI 상담 내용)","(assessments & AI sessions)")}</span>
              <span className="text-red-500 ml-1">{t("(필수)","(required)")}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.overseas}
              onChange={e => setSignupConsents(p => ({ ...p, overseas: e.target.checked }))} />
            <span><strong>{t("개인정보 제3자 제공","Third-party Data Transfer")}</strong> {t("동의","agree")}
              <span className="text-gray-400 ml-1">{t("(Anthropic Inc., 미국 / AI 상담 기능 제공)","(Anthropic Inc., USA / AI counseling)")}</span>
              <span className="text-red-500 ml-1">{t("(필수)","(required)")}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.age}
              onChange={e => setSignupConsents(p => ({ ...p, age: e.target.checked }))} />
            <span>{t(<>본인은 <strong>만 14세 이상</strong>임을 확인합니다.</>,<>I confirm I am <strong>14 years or older</strong>.</>)}
              <span className="text-red-500 ml-1">{t("(필수)","(required)")}</span>
            </span>
          </label>

          <p className="text-gray-400 font-semibold pt-2">{t("— 선택 동의 항목 —","— Optional —")}</p>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
              checked={signupConsents.marketing}
              onChange={e => setSignupConsents(p => ({ ...p, marketing: e.target.checked }))} />
            <span>{t("마케팅 정보 수신 동의","Marketing communications")}
              <span className="text-gray-400 ml-1">{t("(신규 기능·이벤트·혜택 안내, 이메일)","(new features, events, offers via email)")}</span>
              <span className="text-gray-400 ml-1">{t("(선택 — 미동의 시에도 서비스 이용 가능)","(optional — service available without consent)")}</span>
            </span>
          </label>
        </div>

        <button onClick={handleSignup}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-4">
          {t("가입하기","Sign Up")}
        </button>
        {(window.KAKAO_APP_KEY || window.GOOGLE_CLIENT_ID || window.NAVER_CLIENT_ID) && (
          <>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div>
              <div className="relative flex justify-center"><span className="px-3 bg-white text-gray-400 text-xs">{t("또는 소셜 계정으로 시작","or continue with social")}</span></div>
            </div>
            <div className="space-y-2">
              {window.KAKAO_APP_KEY && <KakaoLoginBtn onLogin={handleKakaoLogin} />}
              {window.NAVER_CLIENT_ID && <NaverLoginBtn onLogin={handleNaverLogin} />}
              {window.GOOGLE_CLIENT_ID && <GoogleSignInBtn onLogin={handleGoogleLogin} btnText="signup_with" />}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ============================================================
  // 뷰: 신규 회원 온보딩 (가입 직후 자동 이동)
  // ============================================================
  if (isLoggedIn && view === 'memberOnboarding') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🌿</div>
          <h2 className="text-2xl font-bold text-gray-800">{t(`환영합니다, ${currentUser?.nickname || '회원'}님!`, `Welcome, ${currentUser?.nickname || 'member'}!`)}</h2>
          <p className="text-sm text-gray-400 mt-2">{t(<>마음풀을 시작하기 전에<br/>AI 상담 해석 방식을 선택해주세요</>, <>Before you start<br/>choose how AI interprets your results</>)}</p>
        </div>

        <p className="text-xs text-gray-400 text-center mb-3">{t("검사 결과를 어떤 관점으로 해석할까요?","How should we interpret your results?")}</p>
        <div className="grid gap-3 mb-6">
          {[
            { mode: 'psychological', icon: '🧠',
              label: t('심리상담 (기본)','Psychology (default)'),
              desc: t('심리학 이론과 과학적 근거를 바탕으로 해석합니다','Interpreted through psychological theory and scientific evidence'),
              activeClass: 'border-green-500 bg-green-50', checkClass: 'text-green-600' },
            { mode: 'biblical', icon: '✝️',
              label: t('기독교 상담','Christian Counseling'),
              desc: t('성경 말씀과 기독교 신앙을 기반으로 해석합니다','Interpreted through Scripture and Christian faith'),
              activeClass: 'border-purple-400 bg-purple-50', checkClass: 'text-purple-600' },
          ].map(({ mode, icon, label, desc, activeClass, checkClass }) => (
            <button key={mode} onClick={() => updateCounselingMode(mode)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition w-full
                ${counselingMode === mode ? activeClass : 'border-gray-100 hover:border-gray-300'}`}>
              <span className="text-2xl mt-0.5">{icon}</span>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${counselingMode === mode ? checkClass : 'text-gray-700'}`}>{label}</div>
                <div className="text-xs text-gray-400 mt-1">{desc}</div>
              </div>
              {counselingMode === mode && <span className={`${checkClass} font-bold text-lg`}>✓</span>}
            </button>
          ))}
        </div>

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-green-800">✦ {t("가입 보너스 10 크레딧 지급 완료!","Signup bonus of 10 credits applied!")}</p>
          <p className="text-xs text-green-600 mt-1">{t("심리검사 1회 + AI 채팅 2회를 무료로 이용할 수 있어요","Use 1 assessment + 2 AI chats for free")}</p>
        </div>

        <button onClick={() => { loadTestHistory(); setView('memberDashboard'); }}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition text-base">
          {t("심리검사 시작하기 →","Start Assessments →")}
        </button>
        <p className="text-xs text-gray-300 text-center mt-3">{t("마이페이지 → 설정에서 언제든 변경할 수 있어요","You can change this anytime in My Info → Settings")}</p>
      </div>
    </div>
  );

  // ============================================================
  // 뷰: 비밀번호 찾기
  // ============================================================
  if (!isLoggedIn && view === 'forgotPassword') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={() => setView('memberLogin')} className="text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1">{t("← 뒤로","← Back")}</button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-2xl font-bold text-gray-800">{t("비밀번호 찾기","Forgot Password")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("가입한 이메일로 재설정 링크를 보내드립니다","We'll send a reset link to your registered email")}</p>
        </div>
        <Msg msg={formMsg} />
        <input id="forgot-email" type="email" placeholder={t("가입한 이메일","Registered email")}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm mb-4" />
        <button
          onClick={async () => {
            const email = document.getElementById('forgot-email')?.value.trim();
            if (!email) { setFormMsg({ type: 'error', text: t('이메일을 입력해주세요.','Please enter your email.') }); return; }
            setFormMsg({ type: 'loading', text: t('전송 중...','Sending...') });
            const r = await api.forgotPassword(email);
            setFormMsg({ type: 'success', text: r.message || t('재설정 링크를 발송했습니다.','Reset link sent.') });
          }}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition">
          {t("재설정 링크 전송","Send Reset Link")}
        </button>
      </div>
    </div>
  );

  // ============================================================
  // 법적 페이지 공통 래퍼
  // ============================================================
  function LegalPage({ title, onBack, children }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
            <span className="font-bold text-gray-800">{title}</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8 prose prose-sm text-gray-700">{children}</main>
      </div>
    );
  }

  // ============================================================
  // 뷰: AI 상담
  // ============================================================
  if (view === 'aiCounsel') {
    // 현재 세션에 응답 데이터가 있는 검사 목록 계산
    const hasResponses = {
      PHQ9:    Object.keys(phq9Responses).length > 0,
      GAD7:    Object.keys(gad7Responses).length > 0,
      BIG5:    Object.keys(big5Responses || {}).length > 0,
      DASS21:  Object.keys(dass21Responses || {}).length > 0,
      LOST:    Object.keys(lostResponses || {}).length > 0,
      DSI:     Object.keys(sdriResponses || {}).length >= sdriLikertQ.length,
      BURNOUT: Object.keys(burnoutResponses || {}).length > 0,
    };
    const resultViews = {
      PHQ9:'phq9Result', GAD7:'gad7Result', BIG5:'big5Result',
      DASS21:'dass21Result', LOST:'lostResult', DSI:'dsiResult', BURNOUT:'burnoutResult',
    };
    const completedThisSession = Object.entries(hasResponses).filter(([,v]) => v).map(([k]) => k);
    const recentTests = testHistory.slice(0, 5);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setView('memberDashboard')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">{t("← 뒤로","← Back")}</button>
            <span className="font-bold text-gray-800">🤖 {t("AI 상담","AI Counseling")}</span>
            <CreditBadge />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">🧠</span>
              <div className="flex-1">
                <h2 className="font-bold text-gray-800 text-lg mb-1">{t("AI 심리 상담","AI Psychological Counseling")}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t(<>검사 결과를 바탕으로 AI와 심층 상담하세요.<br/>검사 결과가 있으면 AI가 결과를 분석하여 맞춤 상담을 제공합니다.</>, <>Have a deep conversation with AI based on your test results.<br/>When results are available, AI provides personalized guidance.</>)}
                </p>
                {(() => {
                  const trendTypes = ['PHQ9','GAD7','BURNOUT','DSI'].filter(tt => testHistory.filter(h => h.test_type === tt && h.score != null).length >= 3);
                  if (trendTypes.length === 0) return null;
                  return (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {trendTypes.map(tt => (
                        <span key={tt} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-200">
                          📈 {tt} {t("트렌드 분석 활성","trend analysis active")}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              ⚠️ <strong>{t("참고 안내:","Note:")}</strong> {t("AI 상담은 자기 이해를 위한 참고 정보입니다. 의학적 진단이나 치료를 대체하지 않으며, 모든 답변은 확정적 결론이 아닙니다.","AI counseling is for self-understanding only. It does not replace medical diagnosis or treatment, and responses are not definitive conclusions.")}
            </div>
          </div>

          {completedThisSession.length > 0 && (
            <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5">
              <p className="text-sm font-bold text-green-800 mb-3">
                ✅ {t("방금 완료한 검사 결과로 AI 상담하기","Chat with AI about your just-completed results")}
              </p>
              <p className="text-xs text-green-600 mb-3">
                {t("검사 결과 화면에서 AI와 상담하면 검사 데이터가 자동으로 전달됩니다.","Your test data is automatically shared when you chat from the result screen.")}
              </p>
              <div className="flex flex-wrap gap-2">
                {completedThisSession.map(tt => {
                  const metaMap = {
                    PHQ9:t('😔 PHQ-9 우울','😔 PHQ-9 Depression'), GAD7:t('😰 GAD-7 불안','😰 GAD-7 Anxiety'), BIG5:t('🌟 Big5 성격','🌟 Big Five'),
                    DASS21:'📊 DASS-21', LOST:t('🧭 LOST 행동','🧭 LOST Style'), DSI:'🪞 SDRI', BURNOUT:'🔥 K-MBI+',
                  };
                  return (
                    <button key={tt}
                      onClick={() => setView(resultViews[tt])}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition">
                      <span>{metaMap[tt]}</span>
                      <span>{t("결과 보고 상담 →","View & chat →")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-1">💡 {t("새 검사 후 상담하기 (더 정확한 상담)","Take a new test then chat (more accurate)")}</p>
            <p className="text-xs text-gray-400 mb-3">{t("검사 완료 후 결과 화면에서 AI 상담 버튼을 누르세요","After the test, tap the AI chat button on the result screen")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id:'PHQ9',  label:t('PHQ-9 우울','PHQ-9 Depression'), emoji:'🌱', view:'phq9Test'  },
                { id:'GAD7',  label:t('GAD-7 불안','GAD-7 Anxiety'),   emoji:'💙', view:'gad7Test'  },
                { id:'LOST',  label:t('LOST 행동','LOST Style'),        emoji:'🧭', view:'lostTest'  },
              ].map(tt => (
                <button key={tt.id} onClick={() => setView(tt.view)}
                  className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-100 transition">
                  <span>{tt.emoji}</span><span>{tt.label}</span>
                  <span className="text-green-400">{t("무료","Free")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-semibold text-gray-700 mb-1">💬 {t("검사 없이 바로 상담하기","Chat without a test")}</p>
              <p className="text-xs text-gray-400">{t("검사 결과 없이 AI와 자유롭게 대화할 수 있습니다","Talk freely with AI without any test results")}</p>
            </div>
            <ChatBox testType="GENERAL" initialPrompts={t([
              "요즘 마음이 무겁고 지쳐있어요. 어떻게 하면 좋을까요?",
              "불안감이 자주 생기는데 어떻게 다루면 좋을까요?",
              "직장 스트레스로 힘든데 도움이 필요해요",
              "스스로를 이해하고 싶어요. 어디서부터 시작할까요?",
            ],[
              "I've been feeling heavy and exhausted lately. What should I do?",
              "I often feel anxious. How can I manage it better?",
              "Work stress is overwhelming me. I need some help.",
              "I want to understand myself better. Where do I start?",
            ])} />
          </div>

          <ExpertCTA testType="GENERAL" score={0} level="low" onContinueAI={null} />
        </div>
      </div>
    );
  }

  // ── 개인정보 처리방침  // ── 개인정보 처리방침 ──────────────────────────────────────
  if (view === 'privacy') return (
    <LegalPage title="개인정보 처리방침" onBack={() => setView(isLoggedIn ? 'memberDashboard' : 'memberLogin')}>
      <h2>개인정보 처리방침</h2>
      <p>마음풀(이하 "서비스")은 「개인정보 보호법」을 준수하며 이용자의 개인정보를 보호합니다.</p>

      <h3>1. 수집하는 개인정보 항목</h3>
      <p><strong>일반 개인정보 (필수)</strong></p>
      <ul>
        <li>이메일 주소, 닉네임, 접속 국가 코드</li>
      </ul>
      <p><strong>일반 개인정보 (선택 — 미제공 시에도 서비스 이용 가능)</strong></p>
      <ul>
        <li>성별, 연령대, 핸드폰번호</li>
      </ul>
      <p><strong>민감정보 (별도 동의 후 수집)</strong></p>
      <ul>
        <li>심리검사 응답 데이터 및 결과 (PHQ-9, GAD-7, DASS-21, BIG5 등)</li>
        <li>AI 상담 채팅 내용 (정신건강 관련 정보 포함 가능)</li>
      </ul>
      <p style={{color:'#dc2626', fontSize:'13px'}}>※ 민감정보는 회원가입 시 별도 동의를 받으며, 동의를 거부하실 경우 서비스 이용이 제한될 수 있습니다.</p>

      <h3>2. 개인정보 이용 목적</h3>
      <ul>
        <li>회원 식별 및 로그인 처리</li>
        <li>심리검사 결과 제공 및 AI 상담 서비스 운영</li>
        <li>크레딧 잔액 관리 및 결제 처리</li>
        <li>서비스 이메일 발송 (인증, 안내)</li>
        <li>서비스 개선을 위한 통계 분석 (익명 처리)</li>
      </ul>

      <h3>3. 개인정보 보유 및 파기</h3>
      <ul>
        <li><strong>회원 정보:</strong> 탈퇴 즉시 익명화 처리</li>
        <li><strong>결제 기록:</strong> 전자상거래법에 따라 5년 보관</li>
        <li><strong>검사 기록:</strong> 탈퇴 즉시 삭제</li>
        <li><strong>AI 채팅 내용:</strong> 서비스에 저장되지 않으며 처리 후 즉시 폐기</li>
      </ul>

      <h3>4. 개인정보 처리 위탁 및 국외 이전</h3>
      <p><strong>국내 위탁</strong></p>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px', marginBottom:'8px'}}>
        <thead>
          <tr style={{background:'#F9FAFB'}}>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>수탁업체</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>위탁 목적</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>이전 항목</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>보유·이용기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>토스페이먼츠(주)</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>국내 결제 처리</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>이메일, 결제금액, 주문번호</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>결제 완료 후 5년 (전자상거래법)</td>
          </tr>
        </tbody>
      </table>
      <p><strong>국외 이전 (개인정보 보호법 제28조의8)</strong></p>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px', marginBottom:'8px'}}>
        <thead>
          <tr style={{background:'#F9FAFB'}}>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>업체 (국가)</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>목적</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>이전 항목</th>
            <th style={{border:'1px solid #E5E7EB', padding:'6px 8px', textAlign:'left'}}>보유기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>Anthropic, Inc. (미국)</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>Claude AI API 서비스 제공</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>채팅 내용 (비식별화, 저장 안 됨)</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>처리 후 즉시 파기</td>
          </tr>
          <tr>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>Cloudflare, Inc. (미국·EU)</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>서버 인프라·DB 운영</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>이메일, 닉네임, 성별, 연령대, 핸드폰번호 등 가입 정보</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>회원 탈퇴 시까지</td>
          </tr>
          <tr>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>Resend, Inc. (미국)</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>인증·안내 이메일 발송</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>이메일 주소</td>
            <td style={{border:'1px solid #E5E7EB', padding:'6px 8px'}}>발송 완료 후 파기</td>
          </tr>
        </tbody>
      </table>
      <p style={{color:'#dc2626', fontSize:'13px'}}>※ 이용자는 국외 이전에 동의하지 않을 권리가 있으나, 미동의 시 해당 서비스(AI 상담 등) 이용이 불가합니다.</p>

      <h3>5. 자동화된 의사결정</h3>
      <p>AI 분석 기능은 알고리즘에 의해 자동으로 결과를 생성합니다. 이는 <strong>참고용 정보</strong>이며 의료적 진단이 아닙니다. 이용자는 AI 분석 결과에 이의를 제기하거나 사람에 의한 재검토를 요청할 수 있습니다.</p>

      <h3>6. 만 14세 미만 이용자</h3>
      <p>만 14세 미만의 아동은 서비스를 이용할 수 없습니다. 만 14세 미만으로 확인될 경우 수집된 개인정보를 즉시 파기합니다.</p>

      <h3>7. 이용자의 권리</h3>
      <ul>
        <li>개인정보 열람, 수정, 삭제 요청: 마이페이지 → 설정 → 회원 탈퇴</li>
        <li>처리 정지 요청: support@maumful.com</li>
        <li>개인정보 이동권: 요청 시 CSV 형태로 제공</li>
      </ul>

      <h3>8. 개인정보 보호책임자 및 문의</h3>
      <ul>
        <li><strong>상호:</strong> 마음서비스</li>
        <li><strong>대표자:</strong> 김근혜</li>
        <li><strong>사업자등록번호:</strong> 780-31-01832</li>
        <li><strong>통신판매업 신고번호:</strong> 제 2026-서울영등포-1157 호</li>
        <li><strong>사업장 소재지:</strong> 서울특별시 영등포구 문래로26길 6 (문래동3가)</li>
        <li><strong>이메일:</strong> support@maumful.com</li>
        <li>개인정보 침해 신고: 개인정보보호위원회 (privacy.go.kr / 182)</li>
      </ul>
      <p style={{color:'#9ca3af', fontSize:'12px'}}>최종 업데이트: 2026년 5월 24일</p>
    </LegalPage>
  );

  // ── 이용약관 ───────────────────────────────────────────────
  if (view === 'terms') return (
    <LegalPage title="이용약관" onBack={() => setView(isLoggedIn ? 'memberDashboard' : 'memberLogin')}>
      <h2>이용약관</h2>
      <p>마음풀(이하 "서비스") 이용 전 반드시 읽어주세요.</p>
      <p style={{fontSize:'13px', color:'#6b7280'}}>운영사: 마음서비스 | 대표자: 김근혜 | 사업자등록번호: 780-31-01832 | 통신판매업 신고번호: 제 2026-서울영등포-1157 호 | 서울특별시 영등포구 문래로26길 6</p>

      <h3>제1조 (목적)</h3>
      <p>본 약관은 마음서비스(이하 "회사")가 운영하는 마음풀 서비스의 이용 조건, 절차 및 이용자와 회사 간의 권리·의무를 규정합니다.</p>

      <h3>제2조 (서비스의 성격 및 의료 면책)</h3>
      <p><strong>본 서비스는 자기이해 및 정보 제공 목적의 콘텐츠 서비스입니다.</strong></p>
      <ul>
        <li>심리검사 결과 및 AI 상담은 의료적 진단, 치료, 처방이 아닙니다.</li>
        <li>검사 결과를 의학적 판단의 근거로 사용하지 마십시오.</li>
        <li>AI는 의료인이 아니며, AI 답변은 참고용 정보입니다.</li>
        <li>심리적 어려움이 지속되면 반드시 정신건강의학과 전문의 또는 공인 심리상담사의 도움을 받으십시오.</li>
        <li>위기 상황 시: 자살예방상담전화 109 (24시간), 정신건강위기상담전화 1577-0199 (24시간)</li>
      </ul>

      <h3>제3조 (이용 자격)</h3>
      <ul>
        <li>본 서비스는 만 14세 이상만 이용할 수 있습니다.</li>
        <li>만 14세 미만의 경우 법정대리인의 동의가 필요하며, 동의 없이 가입한 사실이 확인되면 계정을 즉시 삭제합니다.</li>
      </ul>

      <h3>제4조 (크레딧 운영 정책)</h3>
      <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'8px'}}>「전자상거래 등에서의 소비자보호에 관한 법률」 제17조, 제19조 및 「콘텐츠산업 진흥법」 제28조에 근거합니다.</p>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>① 크레딧의 성격</h4>
      <ul>
        <li>크레딧은 마음풀 서비스 내에서만 사용 가능한 선불 전자적 수단입니다.</li>
        <li>크레딧은 타인에게 양도·거래·환전할 수 없습니다.</li>
        <li><strong>유료 구매 크레딧</strong>: 토스페이먼츠(KRW) 또는 Stripe(USD)를 통해 구매한 크레딧</li>
        <li><strong>무상 지급 크레딧</strong>: 가입 보너스, 이벤트·프로모션, 추천 보상으로 지급된 크레딧 (환불 제외)</li>
      </ul>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>② 크레딧 유효기간</h4>
      <ul>
        <li>유료 구매 크레딧: 구매일로부터 <strong>5년</strong> (「콘텐츠산업 진흥법」 제28조 기준)</li>
        <li>무상 지급 크레딧: 지급일로부터 <strong>1년</strong> (별도 안내 시 해당 기간 적용)</li>
        <li>유효기간 만료 시 자동 소멸되며, 소멸 30일 전 이메일로 사전 고지합니다.</li>
      </ul>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>③ 청약철회 및 환불</h4>
      <ul>
        <li>유료 구매 크레딧은 구매일로부터 <strong>7일 이내</strong>, 미사용 크레딧에 한해 청약철회 및 전액 환불이 가능합니다. (「전자상거래법」 제17조)</li>
        <li>단, 구매한 크레딧의 <strong>일부라도 사용한 경우</strong>에는 「전자상거래법」 제17조 제2항 제5호에 따라 청약철회가 제한됩니다. 이 사실은 결제 시 화면에 명시됩니다.</li>
        <li>결제 후 7일 초과 시, 잔여 크레딧의 10%를 위약금으로 공제 후 환불합니다. (단, 회사 귀책 사유로 인한 경우 전액 환불)</li>
        <li>무상 지급 크레딧(보너스·이벤트·추천 보상)은 환불 대상에서 제외됩니다.</li>
        <li>서비스 오류로 크레딧이 소실된 경우 동일 수량을 보상합니다.</li>
      </ul>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>④ 환불 신청 방법</h4>
      <ul>
        <li>환불 신청: <strong>support@maumful.com</strong> (제목: "[환불신청] 이메일 / 구매일자 / 환불 사유")</li>
        <li>처리 기간: 신청 접수 후 영업일 기준 <strong>3~5일</strong> 이내</li>
        <li>환불 수단: 원칙적으로 결제 수단과 동일한 방법으로 환불 (카드 결제 → 카드사 취소)</li>
      </ul>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>⑤ 서비스 종료 시 처리</h4>
      <ul>
        <li>서비스 종료 시 최소 <strong>30일 전</strong> 이메일·공지사항으로 사전 고지합니다.</li>
        <li>고지 후 잔여 유료 구매 크레딧은 환불 신청 기간(30일) 내 환불 가능합니다.</li>
        <li>환불 신청 기간 경과 후 남은 크레딧은 소멸됩니다.</li>
      </ul>
      <h4 style={{fontSize:'13px',fontWeight:600,margin:'8px 0 4px'}}>⑥ 부정 사용 처리</h4>
      <ul>
        <li>비정상적 방법(중복 가입, 시스템 오류 악용 등)으로 취득한 크레딧은 회수하며, 해당 계정을 이용 정지할 수 있습니다.</li>
      </ul>

      <h3>제5조 (AI 서비스 책임 제한)</h3>
      <ul>
        <li>AI 상담 결과의 정확성을 보장하지 않습니다.</li>
        <li>AI 답변에 근거한 의사결정으로 발생한 손해에 대해 서비스는 책임을 지지 않습니다.</li>
        <li>AI는 자동화된 알고리즘으로 응답하며, 인간 상담사를 대체하지 않습니다.</li>
      </ul>

      <h3>제6조 (금지 행위)</h3>
      <ul>
        <li>타인의 계정 무단 사용</li>
        <li>크레딧 시스템 부정 이용 (중복 가입, 우회 충전 등)</li>
        <li>서비스 내 타인 비방·혐오 표현</li>
        <li>서비스를 상업적 목적으로 무단 이용</li>
        <li>자해·타해를 조장하는 콘텐츠 입력</li>
      </ul>

      <h3>제7조 (서비스 변경 및 중단)</h3>
      <p>서비스는 운영상 필요에 따라 변경·중단될 수 있으며, 7일 전 사전 고지를 원칙으로 합니다. 긴급한 경우 사후 고지할 수 있습니다.</p>

      <h3>제8조 (약관의 효력 및 개정)</h3>
      <ul>
        <li>본 약관은 서비스 가입 시 동의함으로써 효력이 발생합니다.</li>
        <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있습니다.</li>
        <li>약관 개정 시 적용일 및 개정 내용을 <strong>시행 7일 전</strong>(이용자에게 불리한 개정의 경우 30일 전) 서비스 공지사항 및 가입 이메일로 고지합니다.</li>
        <li>고지 기간 내 이의를 제기하지 않으면 개정 약관에 동의한 것으로 간주합니다.</li>
        <li>개정 약관에 동의하지 않는 경우 서비스 탈퇴 및 환불(해당 시)을 신청할 수 있습니다.</li>
      </ul>

      <h3>제9조 (분쟁 해결 및 준거법)</h3>
      <ul>
        <li>본 약관은 대한민국 법률에 따라 해석됩니다.</li>
        <li>분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.</li>
        <li>문의: support@maumful.com</li>
      </ul>
      <h3>운영사 정보</h3>
      <ul>
        <li><strong>상호:</strong> 마음서비스</li>
        <li><strong>대표자:</strong> 김근혜</li>
        <li><strong>사업자등록번호:</strong> 780-31-01832</li>
        <li><strong>통신판매업 신고번호:</strong> 제 2026-서울영등포-1157 호</li>
        <li><strong>사업장 소재지:</strong> 서울특별시 영등포구 문래로26길 6 (문래동3가)</li>
        <li><strong>이메일:</strong> support@maumful.com</li>
      </ul>
      <p style={{color:'#9ca3af', fontSize:'12px'}}>최종 업데이트: 2026년 5월</p>
    </LegalPage>
  );

  // ============================================================
  // 뷰: 비밀번호 재설정 (이메일 링크 클릭 후)
  // ============================================================
  if (!isLoggedIn && view === 'resetPassword') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">{t("새 비밀번호 설정","Set New Password")}</h2>
        </div>
        <Msg msg={formMsg} />
        <div className="space-y-3 mb-5">
          <input id="new-pw"  type="password" placeholder={t("새 비밀번호 (8자 이상)","New password (min. 8 chars)")}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
          <input id="new-pw2" type="password" placeholder={t("새 비밀번호 확인","Confirm new password")}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
        </div>
        <button
          onClick={async () => {
            const pw  = document.getElementById('new-pw')?.value  || '';
            const pw2 = document.getElementById('new-pw2')?.value || '';
            if (pw.length < 8) { setFormMsg({ type: 'error', text: t('비밀번호는 8자 이상이어야 합니다.','Password must be at least 8 characters.') }); return; }
            if (pw !== pw2)    { setFormMsg({ type: 'error', text: t('비밀번호가 일치하지 않습니다.','Passwords do not match.') }); return; }
            setFormMsg({ type: 'loading', text: t('변경 중...','Updating...') });
            const r = await fetch('/api/auth/reset-password', {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...api._authHeader() },
              body: JSON.stringify({ token: window.__resetToken, newPassword: pw }),
            }).then(r => r.json());
            if (r.success) { setFormMsg({ type: 'success', text: t('비밀번호가 변경되었습니다.','Password updated successfully.') }); setTimeout(() => { setView('memberLogin'); setFormMsg({ type:'',text:'' }); }, 1500); }
            else setFormMsg({ type: 'error', text: r.error || t('변경 실패','Update failed') });
          }}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition">
          {t("비밀번호 변경","Change Password")}
        </button>
      </div>
    </div>
  );

  // ============================================================
  // 뷰: 메인 대시보드 (검사 선택)
  // ============================================================
  // ============================================================
  // 📄 뷰: 내 검사 리포트 (검사 이력 클릭 → 열람 · 인쇄/PDF 저장)
  // ============================================================
  if (isLoggedIn && view === 'testReport') {
    const RP_LABEL = { PHQ9:t('PHQ-9 우울 자가점검','PHQ-9 Depression'), GAD7:t('GAD-7 불안 자가점검','GAD-7 Anxiety'), DASS21:t('DASS-21 우울·불안·스트레스','DASS-21'), BIG5:t('Big5 성격검사','Big Five'), LOST:t('LOST 행동유형','LOST'), SCT:t('SRCI 자기반응 완성','SRCI'), DSI:t('SDRI 자기분화','SDRI'), BURNOUT:t('K-MBI+ 번아웃','K-MBI+ Burnout'), RIASEC:t('Holland RIASEC 직업흥미','Holland RIASEC'), VALUES:t('직업가치관','Work Values') };
    const RP_EMOJI = { PHQ9:'😔', GAD7:'😰', DASS21:'📊', BIG5:'🌟', LOST:'🧭', SCT:'✍️', DSI:'🪞', BURNOUT:'🔥', RIASEC:'🔍', VALUES:'💎' };
    const d = report;
    const detail = d && d.result ? summarizeReportResult(d.test_type, d.result) : '';
    const diff = (d && d.prev && d.score != null && d.prev.score != null) ? d.score - d.prev.score : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 print:bg-white">
        <style>{`@media print { .no-print{display:none !important;} body{background:#fff !important;} @page{margin:14mm;} }`}</style>

        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 no-print">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => { setView('myPage'); setMyPageTab('history'); }} className="text-gray-500 hover:text-gray-700 text-sm">← {t("검사 이력","History")}</button>
            <span className="font-bold text-gray-800 text-sm">📄 {t("내 검사 리포트","My Report")}</span>
            <button onClick={() => window.print()} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition">🖨 {t("인쇄 / PDF","Print / PDF")}</button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {reportLoading && <div className="text-center text-gray-400 py-16 text-sm">{t("리포트를 불러오는 중…","Loading report…")}</div>}
          {reportErr && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{reportErr}</div>}

          {d && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:shadow-none print:border-0 print:rounded-none">
              {/* 표지 */}
              <div className="border-b-2 border-emerald-600 pb-4 mb-6">
                <div className="text-xs font-bold text-emerald-700 mb-1">✨ {t("AI 심리분석 리포트","AI Insight Report")}</div>
                <h1 className="text-2xl font-bold text-gray-800">{RP_EMOJI[d.test_type] || '📋'} {RP_LABEL[d.test_type] || d.test_type}</h1>
                <p className="text-xs text-gray-400 mt-1">📅 {new Date(d.performed_at).toLocaleDateString('ko-KR')} · 마음풀 (maumful.com)</p>
              </div>

              {/* 1. 한눈에 보기 */}
              <section className="mb-6">
                <h2 className="text-sm font-bold text-emerald-700 mb-3">▌ 1. {t("한눈에 보기","At a Glance")}</h2>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {d.score != null && <span className="text-3xl font-bold text-gray-800">{d.score}<span className="text-base text-gray-400 ml-0.5">{t("점","")}</span></span>}
                  {d.level && <span className="text-sm font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">{d.level}</span>}
                  {diff != null && diff !== 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${diff > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {t("지난 검사 대비","vs last")} {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
                {detail && <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{detail}</pre>}
              </section>

              {/* 2. 나의 해석 */}
              <section className="mb-6">
                <h2 className="text-sm font-bold text-emerald-700 mb-3">▌ 2. {t("나의 해석","Your Insight")}</h2>
                {d.ai_analysis
                  ? <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{d.ai_analysis}</div>
                  : <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
                      {t("이 검사는 AI 해석이 저장되기 전에 진행됐어요. 같은 검사를 다시 하고 결과 화면에서 'AI 분석'을 실행하면 해석이 리포트에 함께 저장됩니다.","This test was taken before AI insights were saved. Retake it and run 'AI Analysis' on the result screen to save the insight to your report.")}
                    </div>}
              </section>

              {/* 3. 변화 흐름 */}
              {d.prev && (
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-emerald-700 mb-3">▌ 3. {t("변화 흐름","Change Over Time")}</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {t(`지난 검사(${new Date(d.prev.performed_at).toLocaleDateString('ko-KR')}) ${d.prev.score}점 → 이번 ${d.score}점`, `Last (${new Date(d.prev.performed_at).toLocaleDateString('en-US')}): ${d.prev.score} → Now: ${d.score}`)}
                    {diff != null && diff !== 0 && <span className="ml-1 text-gray-500">({diff > 0 ? '+' : ''}{diff})</span>}
                  </p>
                </section>
              )}

              {/* 4. 게임으로 본 나의 변화 — 검사는 '그 시점의 나', 게임은 '실제로 해온 행동' */}
              {d.game && (
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-emerald-700 mb-3">▌ 4. {t("게임으로 본 나의 변화","Your Practice, in Games")}</h2>
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                      <span>🎮 {t("최근 30일","Last 30 days")} <b className="text-gray-800">{d.game.totalSessions}{t("회","")}</b></span>
                      <span>🔥 {t("연속 실천","Streak")} <b className="text-gray-800">{d.game.streakDays}{t("일","d")}</b></span>
                      <span>🌱 {t("정원 레벨","Garden Lv")} <b className="text-gray-800">{d.game.level}</b></span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {d.game.byGame.slice(0, 4).map(g => `${g.name} ${g.count}${t("회","")}`).join(' · ')}
                    </p>
                    {d.game.mood && d.game.mood.recentAvg != null && (
                      <p className="text-sm text-gray-700 leading-relaxed mt-3 pt-3 border-t border-emerald-100">
                        {t(`감정 기록 ${d.game.mood.count}회 — 최근 평균 강도 ${d.game.mood.recentAvg}`, `${d.game.mood.count} mood logs — recent avg intensity ${d.game.mood.recentAvg}`)}
                        {d.game.mood.prevAvg != null && t(` (이전 ${d.game.mood.prevAvg})`, ` (earlier ${d.game.mood.prevAvg})`)}
                        {d.game.mood.topEmotions?.length > 0 && t(` · 자주 기록된 감정: ${d.game.mood.topEmotions.join('·')}`, ` · most logged: ${d.game.mood.topEmotions.join(', ')}`)}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* 5. 다음 단계 — ③ 검사 결과에 맞춘 게임 처방(딥링크) */}
              <section className="mb-6 no-print">
                <h2 className="text-sm font-bold text-emerald-700 mb-3">▌ {d.game ? '5' : '4'}. {t("다음 단계","Next Steps")}</h2>
                <div className="space-y-2 mb-3">
                  {gamePrescription(d.test_type, d.score).map(g => (
                    <button key={g.key} onClick={() => { logLoopEvent('rx_click', g.key); openMaumGame(g.key); }}
                      className="w-full flex items-start gap-3 text-left p-3 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 transition">
                      <span className="text-xl leading-none mt-0.5">{g.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-emerald-800">{g.name}</span>
                        <span className="block text-[11px] text-gray-500 leading-relaxed mt-0.5">{g.why}</span>
                      </span>
                      <span className="text-emerald-400 text-xs mt-1">→</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setView('aiCounsel')} className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">💬 {t("이 결과로 AI 상담","Discuss with AI")}</button>
                  <button onClick={() => setView('testsIntro')} className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition">✨ {t("다른 검사 받기","More tests")}</button>
                </div>
              </section>

              {/* 면책 */}
              <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-4 leading-relaxed">
                📌 {t("본 리포트는 자기이해를 위한 참고 자료이며, 의학적 진단이나 치료를 대체하지 않습니다. 마음이 많이 힘드실 땐 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)를 이용해 보세요.","This report is a reference for self-understanding only and does not replace medical diagnosis or treatment.")}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (isLoggedIn && view === 'memberDashboard') {
    const allTests = regionConfig?.availableTests || ['PHQ9','GAD7','DASS21','BIG5','LOST','SCT','DSI','BURNOUT','RIASEC','VALUES'];
    const testMeta = {
      PHQ9:    { label: 'PHQ-9',   desc: t('우울 자가점검','Depression Screening'),       emoji: '😔', view: 'phq9Test',    summary: t('최근 2주간 기분·수면·의욕의 변화를 점검합니다','Check mood, sleep, and motivation changes over the past 2 weeks'),              questions: 9,  time: t('2분','2 min')  },
      GAD7:    { label: 'GAD-7',   desc: t('불안 자가점검','Anxiety Screening'),           emoji: '😰', view: 'gad7Test',    summary: t('일상 속 걱정·긴장·불안의 정도를 확인합니다','Assess your level of daily worry, tension, and anxiety'),                  questions: 7,  time: t('2분','2 min')  },
      DASS21:  { label: 'DASS-21', desc: t('우울/불안/스트레스','Depression/Anxiety/Stress'), emoji: '📊', view: 'dass21Test',  summary: t('우울·불안·스트레스 세 가지를 한 번에 측정합니다','Measures depression, anxiety, and stress all at once'),               questions: 21, time: t('5분','5 min')  },
      BIG5:    { label: 'Big5',    desc: t('성격 5요인','Big Five Personality'),            emoji: '🌟', view: 'big5Test',    summary: t('나만의 성격 패턴 5가지를 심층 분석합니다','Deep analysis of your five personality dimensions'),                     questions: 50, time: t('15분','15 min') },
      LOST:    { label: 'LOST',    desc: t('행동 운영체계','Behavioral Style'),             emoji: '🧭', view: 'lostTest',    summary: t('내 행동을 에너지·의사결정·관계 등 6가지 축으로 16가지 유형으로 파악합니다','Identify your behavioral type among 16 styles across 6 axes'),     questions: 60, time: t('15분','15 min') },
      SCT:     { label: 'SRCI',    desc: t('자기반응 완성','Self-Response Completion'),     emoji: '✍️', view: 'sctTest',     summary: t('문장 완성으로 나도 몰랐던 내면의 자아 반응을 탐색합니다','Explore hidden inner reactions through sentence completion'),        questions: 25, time: t('20분','20 min') },
      DSI:     { label: 'SDRI',    desc: t('자기분화 반응성','Self-Differentiation'),       emoji: '🪞', view: 'dsiTest',     summary: t('가족·연인 관계에서 감정 반응성과 자아 독립 정도를 측정합니다','Measures emotional reactivity and independence in relationships'),   questions: 25, time: t('15분','15 min') },
      BURNOUT: { label: 'K-MBI+',  desc: t('번아웃 증후군','Burnout Screening'),            emoji: '🔥', view: 'burnoutTest', summary: t('직장·일상에서 쌓인 신체·정서적 소진을 점검합니다','Check physical and emotional exhaustion from work and daily life'),               questions: 50, time: t('15분','15 min') },
      RIASEC:  { label: 'Holland RIASEC', desc: t('직업 흥미 유형','Career Interest Type'), emoji: '🔍', view: 'riasecTest', summary: t('나의 직업적 적성과 흥미를 6가지 유형으로 분석합니다','Analyze career aptitude and interests across 6 Holland types'),          questions: 30, time: t('8분','8 min')  },
      VALUES:  { label: t('직업가치관','Work Values'), desc: t('일의 의미 탐색','Work Values Assessment'), emoji: '💎', view: 'valuesTest', summary: t('일에서 무엇을 중시하는지 10가지 가치요인으로 측정합니다','Measures what you value most in work across 10 value factors'),        questions: 30, time: t('8분','8 min')  },
    };

    async function startSelectedTest(testType) {
      const ok = await chargeForTest(testType);
      if (!ok) return;
      setPendingTests([testType]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId('session'));
      setSaveStatus('');
      setRiasecResponses({}); setValuesResponses({});
      setPhq9Responses({}); setGad7Responses({}); setDass21Responses({});
      setBig5Responses({}); setBurnoutResponses({}); setLostResponses({});
      setSrciResponses({}); setSdriResponses({});
      resetChat();
      setView(testMeta[testType]?.view || 'phq9Test');
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setView('landing')}
              className="flex items-center gap-2 hover:opacity-70 transition">
              <span className="text-2xl">🌿</span>
              <span className="font-bold text-gray-800">마음풀</span>
            </button>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <CreditBadge />
              {/* 마음 시리즈 진입 (마음풀 하위 서비스 — 접두어 생략, 로고 컬러로 구분) */}
              {/* 마음 게임: 로그인 상태면 JWT SSO로 자동 연동 */}
              <button onClick={() => openMaumGame()}
                className="text-gray-500 hover:text-green-700 text-sm px-1.5 py-1.5 rounded-lg hover:bg-green-50 transition flex items-center gap-1 whitespace-nowrap"
                title="마음 게임 — 별도 로그인 없이 바로 이동">
                🎮 <span className="hidden md:inline">{t("게임","Games")}</span>
              </button>
              {/* 마음커플 */}
              <button onClick={() => openMaumCouple()}
                className="text-gray-500 hover:text-rose-600 text-sm px-1.5 py-1.5 rounded-lg hover:bg-rose-50 transition flex items-center gap-1 whitespace-nowrap"
                title="마음커플 — 파트너와 심리 궁합 분석">
                💕 <span className="hidden md:inline">{t("커플","Couple")}</span>
              </button>
              {/* 마음수달 */}
              <button onClick={() => openMaumOtter()}
                className="text-gray-500 hover:text-sky-600 text-sm px-1.5 py-1.5 rounded-lg hover:bg-sky-50 transition flex items-center gap-1 whitespace-nowrap"
                title="마음수달 — 아이의 속마음 통역">
                🦦 <span className="hidden md:inline">{t("수달","Otter")}</span>
              </button>
              {/* 마음부부 */}
              <button onClick={() => openMaumBubu()}
                className="text-gray-500 hover:text-emerald-700 text-sm px-1.5 py-1.5 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1 whitespace-nowrap"
                title="마음부부 — 부부 대화 통역">
                💬 <span className="hidden md:inline">{t("부부","Bubu")}</span>
              </button>
              {/* 마음세대 */}
              <button onClick={() => openMaumSedae()}
                className="text-gray-500 hover:text-emerald-700 text-sm px-1.5 py-1.5 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1 whitespace-nowrap"
                title="마음세대 — 부모·자녀 마음 통역">
                🌿 <span className="hidden md:inline">{t("세대","Sedae")}</span>
              </button>
              <button onClick={() => setView('myPage')} className="text-gray-500 hover:text-gray-700 text-sm px-1.5 py-1.5 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 whitespace-nowrap">
                👤 <span className="hidden sm:inline">{currentUser?.nickname || t('내 정보','My Info')}</span>
              </button>
              <button onClick={() => { setAdminAuthenticated(false); setAdminMsg({type:'',text:''}); setView('admin'); }}
                className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-1.5 rounded-lg hover:bg-gray-100 transition">
                🔐
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* 중요 공지 배너 — 닫으면 그 공지는 다시 안 뜸. 공지가 없으면 아무것도 렌더하지 않음 */}
          {(notices || []).filter(n => n.is_important && !noticeDismissed.includes(n.id)).slice(0, 1).map(n => (
            <div key={n.id} className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">📢</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-amber-900">{n.title}</div>
                <div className="text-xs text-amber-800 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-3">{n.content}</div>
                <button onClick={() => setView('notices')} className="text-xs font-semibold text-amber-700 underline mt-1.5 hover:text-amber-900">
                  {t('공지 전체 보기','View all notices')}
                </button>
              </div>
              <button onClick={() => dismissNotice(n.id)} className="text-amber-400 hover:text-amber-700 text-sm shrink-0" title={t('닫기','Dismiss')}>✕</button>
            </div>
          ))}
          {/* 모바일: 검사 목록 빠른 이동 */}
          <div className="sm:hidden flex justify-end mb-3">
            <a href="#test-list"
              className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition flex items-center gap-1">
              📋 {t("검사 목록 바로가기 ↓", "Go to assessments ↓")}
            </a>
          </div>

          {/* 3일 재방문 알림 배너 */}
          {(() => {
            const checkinDate = localStorage.getItem('maumful_checkin_date');
            const checkinTest = localStorage.getItem('maumful_checkin_test');
            if (!checkinDate) return null;
            const target = new Date(checkinDate);
            const now = new Date();
            const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
            const testMeta2 = { PHQ9:t('우울 자가점검','Depression Check'), GAD7:t('불안 자가점검','Anxiety Check'), DASS21:'DASS-21', BIG5:'Big5', BURNOUT:'K-MBI+', LOST:'LOST', SCT:'SRCI', DSI:'SDRI', RIASEC:'Holland RIASEC', VALUES:t('직업가치관','Work Values') };
            const testLabel = testMeta2[checkinTest] || checkinTest;
            if (diffDays > 0) {
              return (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">📅 {t(`${diffDays}일 후 변화 체크 예정`,`Check-in scheduled in ${diffDays} days`)}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{t(`${testLabel} 재검사로 마음의 변화를 비교해 드려요`,`Retest ${testLabel} to compare how you've changed`)}</p>
                  </div>
                  <button
                    onClick={() => { localStorage.removeItem('maumful_checkin_date'); localStorage.removeItem('maumful_checkin_test'); }}
                    className="text-xs text-emerald-400 hover:text-emerald-600 shrink-0">✕</button>
                </div>
              );
            }
            if (diffDays <= 0) {
              return (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-amber-800">🔔 {t(`오늘 ${testLabel} 재검사 날이에요!`,`Today is your ${testLabel} check-in day!`)}</p>
                    <button
                      onClick={() => { localStorage.removeItem('maumful_checkin_date'); localStorage.removeItem('maumful_checkin_test'); }}
                      className="text-xs text-amber-400 hover:text-amber-600">✕</button>
                  </div>
                  <p className="text-xs text-amber-700 mb-3">{t("이전 결과와 비교해 마음의 변화를 확인하세요","Compare with your previous results to see how you've changed")}</p>
                  <button
                    onClick={async () => {
                      const testViews = { PHQ9:'phq9Test', GAD7:'gad7Test', DASS21:'dass21Test', BIG5:'big5Test', BURNOUT:'burnoutTest', LOST:'lostTest', SCT:'sctTest', DSI:'dsiTest', RIASEC:'riasecTest', VALUES:'valuesTest' };
                      const ok = await chargeForTest(checkinTest);
                      if (!ok) return;
                      setPendingTests([checkinTest]);
                      setCurrentTestIndex(0);
                      setMultiSessionIds([]);
                      setSessionId(genId('session'));
                      setSaveStatus('');
                      setRiasecResponses({}); setValuesResponses({});
                      setPhq9Responses({}); setGad7Responses({}); setDass21Responses({});
                      setBig5Responses({}); setBurnoutResponses({}); setLostResponses({});
                      setSrciResponses({}); setSdriResponses({});
                      resetChat();
                      localStorage.removeItem('maumful_checkin_date');
                      localStorage.removeItem('maumful_checkin_test');
                      setView(testViews[checkinTest] || 'phq9Test');
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 rounded-xl transition">
                    {t("지금 바로 재검사하기 →","Retest now →")}
                  </button>
                </div>
              );
            }
            return null;
          })()}

          {/* 파트너 채널 환영 배너 */}
          {(() => {
            const dismissKey = 'maumful_partner_banner_dismissed';
            if (localStorage.getItem(dismissKey)) return null;
            let cfg = null;
            try { cfg = JSON.parse(sessionStorage.getItem('maumful_partner_cfg') || 'null'); } catch {}
            if (!cfg) return null;
            const borderColor = cfg.primary_color || '#2D6A4F';
            return (
              <div className="rounded-2xl p-4 mb-5 border-l-4" style={{ borderColor, backgroundColor: borderColor + '18' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {cfg.logo_url && <img src={cfg.logo_url} alt={cfg.name} className="h-6 mb-2 object-contain" />}
                    <p className="text-sm font-bold" style={{ color: borderColor }}>{cfg.name}을 통해 오셨군요!</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {cfg.welcome_message || '마음풀의 심리검사와 AI 상담 서비스를 자유롭게 이용해 보세요.'}
                    </p>
                    {cfg.featured_tests && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cfg.featured_tests.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: borderColor }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { localStorage.setItem(dismissKey, '1'); setView('memberDashboard'); }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
                </div>
              </div>
            );
          })()}

          {/* 신규 회원 시작 가이드 */}
          {testHistory.length === 0 && !localStorage.getItem('maumful_guide_dismissed') && (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-green-800">🌿 {t("마음풀 시작하기", "Getting Started with Maumful")}</p>
                <button onClick={() => { localStorage.setItem('maumful_guide_dismissed', '1'); setView('memberDashboard'); }}
                  className="text-xs text-green-400 hover:text-green-600">✕ {t("닫기","Close")}</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { step: '1', icon: '📋', title: t('검사 선택','Pick a Test'), desc: t('아래에서 원하는 심리검사를 선택하세요','Choose an assessment below') },
                  { step: '2', icon: '🧠', title: t('AI 분석','AI Analysis'), desc: t('검사 완료 후 AI가 결과를 해석해 드려요','AI interprets your results after the test') },
                  { step: '3', icon: '💬', title: t('AI 상담','AI Counseling'), desc: t('궁금한 점을 AI 상담사에게 물어보세요','Ask the AI counselor any questions') },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} className="bg-white rounded-xl p-3 text-center border border-green-100">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-xs font-bold text-green-800">STEP {step}</div>
                    <div className="text-xs font-semibold text-gray-700 mt-0.5">{title}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-600 text-center">{t("아래 검사 카드를 눌러 지금 바로 시작해 보세요 👇", "Tap a test card below to get started right now 👇")}</p>
            </div>
          )}

          {/* 인사말 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-800">{t(`안녕하세요, ${currentUser?.nickname || '회원'}님 👋`, `Hello, ${currentUser?.nickname || 'there'} 👋`)}</h2>
              {counselingMode === 'biblical' && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">✝️ 기독교 상담</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">{t("검사 1회에 10 크레딧이 차감됩니다", "10 credits per assessment")}</p>
          </div>

          {/* 크레딧 현황 카드 */}
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-5 text-white mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-80">{t("현재 크레딧", "Current Credits")}</span>
              <button onClick={() => setShowChargeView(true)} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition">{t("구매 →", "Buy →")}</button>
            </div>
            <div className="text-4xl font-bold">✦ {credits}</div>
            <div className="text-xs opacity-70 mt-1">{t(`검사 ${Math.floor(credits / 10)}회 · AI 채팅 ${Math.floor(credits / 2)}회 가능`, `${Math.floor(credits / 10)} tests · ${Math.floor(credits / 2)} AI chats available`)}</div>
          </div>

          {/* 추천 검사 카드 — 이력 기반 개인화 */}
          {(() => {
            if (testHistory.length === 0) return null;
            const now = new Date();
            const doneTypes = new Set(testHistory.map(h => h.test_type));
            const lastDoneMap = {};
            testHistory.forEach(h => { if (!lastDoneMap[h.test_type]) lastDoneMap[h.test_type] = new Date(h.performed_at); });
            const daysSince = t => Math.floor((now - (lastDoneMap[t] || now)) / 86400000);
            const recs = [];

            // 우선순위별 추천 로직
            if (!doneTypes.has('PHQ9'))
              recs.push({ type:'PHQ9', emoji:'😔', reason:t('우울 상태를 아직 확인하지 않았어요', "You haven't checked your depression yet"), free: true });
            else if (daysSince('PHQ9') >= 30)
              recs.push({ type:'PHQ9', emoji:'😔', reason:t(`마지막 우울 검사가 ${daysSince('PHQ9')}일 전이에요`, `Your last depression check was ${daysSince('PHQ9')} days ago`), free: true });

            if (!doneTypes.has('GAD7'))
              recs.push({ type:'GAD7', emoji:'😰', reason:t('불안 검사를 아직 받지 않았어요', "You haven't taken an anxiety check yet"), free: true });
            else if (daysSince('GAD7') >= 30)
              recs.push({ type:'GAD7', emoji:'😰', reason:t(`마지막 불안 검사가 ${daysSince('GAD7')}일 전이에요`, `Your last anxiety check was ${daysSince('GAD7')} days ago`), free: true });

            if (!doneTypes.has('BIG5'))
              recs.push({ type:'BIG5', emoji:'🌟', reason:t('성격 5요인으로 자신을 더 깊이 이해해 보세요', 'Understand yourself more deeply with Big Five'), free: false });
            else if (daysSince('BIG5') >= 90)
              recs.push({ type:'BIG5', emoji:'🌟', reason:t(`성격 검사 이후 ${daysSince('BIG5')}일이 지났어요`, `It's been ${daysSince('BIG5')} days since your personality test`), free: false });

            if (!doneTypes.has('BURNOUT') && doneTypes.has('PHQ9'))
              recs.push({ type:'BURNOUT', emoji:'🔥', reason:t('번아웃 위험도를 함께 확인해 보세요', 'Check your burnout risk while you\'re at it'), free: false });

            const top = recs.slice(0, 2);
            if (top.length === 0) return null;
            return (
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">✨ {t("추천 검사", "Recommended Tests")}</h3>
                <div className={top.length > 1 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
                  {top.map(r => (
                    <button key={r.type} onClick={() => startSelectedTest(r.type)}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-left border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-md transition group">
                      <div className="text-2xl mb-1">{r.emoji}</div>
                      <div className="font-bold text-gray-800 text-sm">{testMeta[r.type]?.label}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">{r.reason}</div>
                      <div className="mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.free ? t('✓ 무료','✓ Free') : t('10 크레딧','10 Credits')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* AI 개인화 인사말 카드 — 3개 서비스 데이터 기반, 하루 1회 */}
          {dailyCtxCard && !localStorage.getItem(`maumful_ai_checkin_${new Date(Date.now()+9*3600000).toISOString().slice(0,10)}`) && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-lg">🤖</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-500 mb-1 uppercase tracking-wide">{t('AI 상담사', 'AI Counselor')}</p>
                  <p className="text-sm text-violet-800 mb-3 leading-relaxed font-medium">"{dailyCtxCard.greeting}"</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const today = new Date(Date.now()+9*3600000).toISOString().slice(0,10);
                        localStorage.setItem(`maumful_ai_checkin_${today}`, '1');
                        setView('aiCounsel');
                      }}
                      className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
                      💬 {t('AI와 대화하기', 'Chat with AI')}
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date(Date.now()+9*3600000).toISOString().slice(0,10);
                        localStorage.setItem(`maumful_ai_checkin_${today}`, 'dismissed');
                        setDailyCtxCard(null);
                      }}
                      className="text-xs text-violet-400 hover:text-violet-600 px-3 py-2 rounded-xl hover:bg-violet-100 transition">
                      {t('나중에', 'Later')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 장기 트렌드 예측 카드 — 3회 이상 검사한 유형이 있을 때 */}
          {(() => {
            const trendTypes = ['PHQ9','GAD7','BURNOUT'].filter(t =>
              testHistory.filter(h => h.test_type === t && h.score != null).length >= 3
            );
            if (!trendTypes.length) return null;
            return (
              <TrendPredictionCard
                testType={trendTypes[0]}
                onStartTest={() => startSelectedTest(trendTypes[0])}
              />
            );
          })()}

          {/* 맞춤 8주 CBT 자기관리 플랜 */}
          <CbtPlanCard
            testHistory={testHistory}
            onPlay={(gameId) => openMaumGame(gameId)}
          />

          {/* 검사 목록 */}
          <div className="flex items-center justify-between mb-3">
            <h3 id="test-list" className="font-bold text-gray-700">{t("심리검사 선택", "Select Assessment")}</h3>
            <span className="text-xs text-gray-400">{t(`총 ${allTests.length}종`, `${allTests.length} total`)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {allTests.map(type => {
              const m = testMeta[type];
              if (!m) return null;
              return (
                <button
                  key={type}
                  onClick={() => startSelectedTest(type)}
                  className="bg-white rounded-2xl p-4 text-left border-2 border-gray-100 hover:border-green-300 hover:shadow-md transition group relative overflow-hidden flex sm:flex-col items-start gap-3 sm:gap-0"
                >
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    FREE_TESTS.includes(type) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {FREE_TESTS.includes(type) ? t('✓ 무료','✓ Free') : t('10 크레딧','10 Credits')}
                  </div>
                  <div className="text-3xl sm:mb-2 shrink-0 mt-0.5">{m.emoji}</div>
                  <div className="flex-1 min-w-0 pr-14 sm:pr-0">
                    <div className="font-bold text-gray-800 text-sm">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                    <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{m.summary}</div>
                    <div className="text-xs text-gray-300 mt-1.5 flex items-center gap-1">
                      <span>📋 {m.questions}{t('문항','Q')}</span>
                      <span>·</span>
                      <span>⏱ {t('약','')} {m.time}</span>
                    </div>
                    <div className="mt-2 text-xs text-green-600 font-semibold sm:opacity-0 sm:group-hover:opacity-100 transition">
                      {FREE_TESTS.includes(type) ? t('바로 시작 →','Start now →') : t('크레딧으로 이용 →','Use credits →')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 🧩 통합 심층 해석 — 서로 다른 검사 2개 이상 완료 시 노출 */}
          {new Set(testHistory.map(h => h.test_type)).size >= 2 && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">🧩</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{t("통합 심층 해석", "Integrated Deep Insight")}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t("여러 검사를 한 사람의 관점으로 종합해, 검사 간 연결·강점·변화 흐름과 다음 단계를 AI가 짚어드려요.", "AI weaves your multiple assessments into one coherent picture — connections, strengths, changes, and next steps.")}</p>
                </div>
              </div>
              {!integratedText && !integratedLoading && (
                <button onClick={runIntegratedAnalysis} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">
                  ✨ {t("통합 해석 생성하기", "Generate integrated insight")}
                </button>
              )}
              {integratedLoading && !integratedText && (
                <div className="text-center py-4 text-indigo-600 text-sm animate-pulse">{t("여러 검사를 종합하는 중…", "Synthesizing your assessments…")}</div>
              )}
              {integratedErr && <div className="text-sm text-red-500 mt-2">{integratedErr}</div>}
              {integratedText && (
                <div className="mt-1">
                  <div className="bg-white rounded-xl p-4 border border-indigo-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{integratedText}</div>
                  {!integratedLoading && (
                    <div className="mt-3">
                      {/* ⑦⑨ 결과 기반 클릭형 액션 */}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setView('aiCounsel')} className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition">💬 {t("이 결과로 AI 상담", "Discuss with AI")}</button>
                        <button onClick={() => openMaumGame()} className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition">🎮 {t("추천 힐링 게임", "Healing games")}</button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <button onClick={runIntegratedAnalysis} className="text-xs text-indigo-500 hover:text-indigo-700">🔄 {t("다시 생성", "Regenerate")}</button>
                        {integratedFeedback
                          ? <span className="text-xs text-gray-400">{t("피드백 감사합니다 🙏", "Thanks for your feedback 🙏")}</span>
                          : <span className="flex items-center gap-2 text-xs text-gray-400">
                              {t("도움이 됐나요?", "Helpful?")}
                              <button onClick={() => sendIntegratedFeedback('up')} className="text-base hover:scale-110 transition" title={t("도움됨","Helpful")}>👍</button>
                              <button onClick={() => sendIntegratedFeedback('down')} className="text-base hover:scale-110 transition" title={t("아쉬움","Not helpful")}>👎</button>
                            </span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2">{t("자기이해를 위한 참고 자료이며 의학적 진단이 아닙니다.", "For self-understanding only, not a medical diagnosis.")}</p>
            </div>
          )}

          {/* 최근 검사 이력 */}
          {testHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700">{t("최근 검사", "Recent Tests")}</h3>
                <button onClick={() => setView('myPage')} className="text-xs text-green-600 hover:text-green-800">{t("전체 보기 →", "View all →")}</button>
              </div>
              <div className="space-y-2">
                {testHistory.slice(0, 5).map((h, i) => {
                  // 같은 검사 이전 기록 찾기 (변화 비교용)
                  const prevSame = testHistory.slice(i + 1).find(p => p.test_type === h.test_type);
                  const daysSince = Math.floor((new Date() - new Date(h.performed_at)) / (1000 * 60 * 60 * 24));
                  const testEmoji2 = { PHQ9:'😔', GAD7:'😰', DASS21:'📊', BIG5:'🌟', LOST:'🧭', SCT:'✍️', DSI:'🪞', BURNOUT:'🔥', RIASEC:'🔍', VALUES:'💎' };
                  return (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 hover:border-emerald-200 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{testEmoji2[h.test_type] || '📋'}</span>
                          <div>
                            <span className="font-semibold text-gray-700 text-sm">{h.test_type}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {daysSince === 0 ? t('오늘','Today') : daysSince === 1 ? t('어제','Yesterday') : t(`${daysSince}일 전`, `${daysSince} days ago`)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {prevSame && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                              {t("재검사", "Retest")}
                            </span>
                          )}
                          <span className="text-xs text-red-300">-{h.credits_spent}cr</span>
                        </div>
                      </div>
                      {daysSince >= 3 && !prevSame && (
                        <button
                          onClick={async () => {
                            const testViews = { PHQ9:'phq9Test', GAD7:'gad7Test', DASS21:'dass21Test', BIG5:'big5Test', BURNOUT:'burnoutTest', LOST:'lostTest', SCT:'sctTest', DSI:'dsiTest', RIASEC:'riasecTest', VALUES:'valuesTest' };
                            const ok = await chargeForTest(h.test_type);
                            if (!ok) return;
                            setPendingTests([h.test_type]);
                            setCurrentTestIndex(0);
                            setMultiSessionIds([]);
                            setSessionId(genId('session'));
                            setSaveStatus('');
                            setRiasecResponses({}); setValuesResponses({});
                            setPhq9Responses({}); setGad7Responses({}); setDass21Responses({});
                            setBig5Responses({}); setBurnoutResponses({}); setLostResponses({});
                            setSrciResponses({}); setSdriResponses({});
                            resetChat();
                            setView(testViews[h.test_type] || 'phq9Test');
                          }}
                          className="mt-2 w-full text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg py-1.5 font-semibold transition">
                          🔄 {t(`${daysSince}일 후 재검사로 변화 확인하기`, `Retest after ${daysSince} days to track your progress`)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 공지사항 진입 (조용한 링크 — 헤더가 붐벼서 하단에 둠) */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <button onClick={() => setView('notices')} className="text-xs text-gray-400 hover:text-green-700 transition">
              📢 {t('공지사항','Notices')}
            </button>
          </div>
        </main>

        <CreditModal />
        <AiLimitModal />
        <SignupVerifyModal />
        <CookieBanner />
        {showChargeView && <ChargeView onClose={async () => {
          setShowChargeView(false);
          await refreshCredits();
          if (pendingTestAfterCharge) {
            const t = pendingTestAfterCharge;
            setPendingTestAfterCharge(null);
            setView('startTest:' + t);
          }
        }} credits={credits} regionConfig={regionConfig} />}
      </div>
    );
  }

  // ============================================================
  // 뷰: 마이페이지
  // ============================================================
  // 🎟️ 쿠폰 등록 카드 (마이페이지) — 신규, 기존 로직 미변경
  function CouponCard() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const submit = async () => {
      const cc = code.trim();
      if (!cc || loading) return;
      setLoading(true); setMsg(null);
      try {
        const r = await fetch('/api/coupon/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...api._authHeader() },
          body: JSON.stringify({ code: cc }),
        });
        const d = await r.json();
        if (d.success) {
          setMsg({ type: 'success', text: d.message || t(`🎟️ ${d.credits} 크레딧이 지급되었습니다!`, `🎟️ ${d.credits} credits added!`) });
          setCode('');
          refreshCredits();
        } else {
          setMsg({ type: 'error', text: d.error || t('쿠폰 등록에 실패했습니다.', 'Failed to redeem coupon.') });
        }
      } catch {
        setMsg({ type: 'error', text: t('네트워크 오류. 다시 시도해주세요.', 'Network error. Please try again.') });
      } finally { setLoading(false); }
    };
    return (
      <div className="bg-white rounded-2xl p-5 mb-5 border border-gray-100">
        <div className="text-sm font-bold text-gray-700 mb-1">🎟️ {t('쿠폰 등록', 'Redeem Coupon')}</div>
        <div className="text-xs text-gray-400 mb-3">{t('받으신 쿠폰 코드를 입력하면 크레딧이 지급됩니다.', 'Enter your coupon code to receive credits.')}</div>
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={t('쿠폰 코드 입력', 'Enter coupon code')} maxLength={20}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 tracking-widest" />
          <button onClick={submit} disabled={loading || !code.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 transition whitespace-nowrap">
            {loading ? t('확인 중...', '...') : t('등록', 'Redeem')}
          </button>
        </div>
        {msg && <div className={`mt-2 text-xs font-semibold ${msg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</div>}
      </div>
    );
  }

  // 🎟️ 마스터 전용 쿠폰 발행·관리 패널 (마이페이지) — 신규
  // 🤝 제휴 파트너 관리 — 코드 발급/수익쉐어율/귀속기간 + 정산 원장 조회·CSV 다운로드
  // 공지사항 관리 — 어드민에서 등록·수정·삭제. 사용자 노출은 목록 페이지 + 중요 공지 배너.
  function MasterNoticePanel() {
    const [list, setList] = useState(null);
    const [editId, setEditId] = useState(null);       // null=신규 작성 폼 닫힘, 0=신규, N=수정
    const [f, setF] = useState({ title:'', content:'', is_important:false, is_published:true });
    const [nmsg, setNmsg] = useState('');

    const load = async () => {
      try { const d = await adminFetch('/api/admin/notices'); if (d.success) setList(d.data||[]); else setNmsg(d.error||'불러오기 실패'); }
      catch { setNmsg('네트워크 오류'); }
    };
    React.useEffect(() => { load(); }, []);

    const openNew  = () => { setEditId(0); setF({ title:'', content:'', is_important:false, is_published:true }); setNmsg(''); };
    const openEdit = (n) => { setEditId(n.id); setF({ title:n.title, content:n.content, is_important:!!n.is_important, is_published:!!n.is_published }); setNmsg(''); };
    const close    = () => { setEditId(null); setNmsg(''); };

    const save = async () => {
      if (!f.title.trim() || !f.content.trim()) { setNmsg('제목과 내용을 입력해 주세요'); return; }
      const isNew = editId === 0;
      try {
        const d = await adminFetch(isNew ? '/api/admin/notices' : `/api/admin/notices/${editId}`,
          { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(f) });
        if (d.success) { setNmsg(isNew ? '공지 등록 완료' : '공지 수정 완료'); close(); load(); }
        else setNmsg(d.error || '저장 실패');
      } catch { setNmsg('네트워크 오류'); }
    };
    const remove = async (n) => {
      if (!window.confirm(`"${n.title}"\n이 공지를 삭제할까요? 되돌릴 수 없습니다.`)) return;
      try { const d = await adminFetch(`/api/admin/notices/${n.id}`, { method:'DELETE' }); if (d.success) { setNmsg('삭제 완료'); load(); } } catch {}
    };

    const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400";
    return (
      <div className="bg-white rounded-2xl p-5 mb-5 border-2 border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-indigo-700">📢 공지사항 관리 {list ? `(${list.length}건)` : ''}</div>
          <button onClick={() => editId === null ? openNew() : close()}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700">
            {editId === null ? '+ 공지 등록' : '✕ 닫기'}
          </button>
        </div>
        {nmsg && <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${nmsg.includes('완료') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{nmsg}</div>}

        {editId !== null && (
          <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">제목</div>
            <input value={f.title} onChange={e => setF(o => ({ ...o, title:e.target.value }))} className={inp} placeholder="예: 시스템 점검 안내" />
            <div className="text-xs text-gray-500 mb-1 mt-3">내용</div>
            <textarea value={f.content} onChange={e => setF(o => ({ ...o, content:e.target.value }))} rows={6}
              className={inp + ' resize-y'} placeholder="줄바꿈 그대로 표시됩니다." />
            <div className="flex flex-wrap gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={f.is_important} onChange={e => setF(o => ({ ...o, is_important:e.target.checked }))} />
                ⭐ 중요 공지 (로그인 후 대시보드 상단 배너에 노출)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={f.is_published} onChange={e => setF(o => ({ ...o, is_published:e.target.checked }))} />
                공개 (끄면 임시저장 — 사용자에게 안 보임)
              </label>
            </div>
            <button onClick={save} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">
              {editId === 0 ? '등록하기' : '수정 저장'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {list === null && <div className="text-xs text-gray-400 p-4 text-center">로딩 중...</div>}
          {list && list.length === 0 && <div className="text-xs text-gray-400 p-4 text-center bg-gray-50 rounded-xl">등록된 공지가 없습니다</div>}
          {(list||[]).map(n => (
            <div key={n.id} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!!n.is_important && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">중요</span>}
                  {!n.is_published && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-bold">비공개</span>}
                  <span className="text-sm font-semibold text-gray-800 truncate">{n.title}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{(n.created_at||'').slice(0,16).replace('T',' ')}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(n)} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">수정</button>
                <button onClick={() => remove(n)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function MasterPartnerPanel() {
    const EMPTY_F = { code:'', name:'', revenue_share_rate:'0.2', sso_secret:'', contact_email:'', commission_start:'', commission_end:'', primary_color:'', logo_url:'', featured_tests:'', welcome_message:'', entry_headline:'', entry_subcopy:'', entry_benefit:'', entry_cta_label:'', entry_cta_go:'' };
    const [partners, setPartners] = useState(null);
    const [sel, setSel] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editCode, setEditCode] = useState(null);   // null=신규 등록, 'CODE'=수정
    const [f, setF] = useState(EMPTY_F);
    const [pmsg, setPmsg] = useState('');
    const isoD = (d) => d.toISOString().slice(0,10);
    const [from, setFrom] = useState(() => isoD(new Date(Date.now()-30*86400000)));
    const [to, setTo] = useState(() => isoD(new Date()));
    const [ledger, setLedger] = useState(null);
    const won = (n) => '₩' + (Number(n)||0).toLocaleString('ko-KR');

    const loadPartners = async () => { try { const d = await adminFetch('/api/admin/partners'); if (d.success) setPartners(d.data||[]); } catch {} };
    React.useEffect(() => { loadPartners(); }, []);

    const openNew = () => { setEditCode(null); setF(EMPTY_F); setPmsg(''); setShowForm(true); };
    const openEdit = (p) => {
      setEditCode(p.code);
      setF({
        code: p.code||'', name: p.name||'', revenue_share_rate: String(p.revenue_share_rate ?? 0.2),
        sso_secret: p.sso_secret||'', contact_email: p.contact_email||'',
        commission_start: p.commission_start||'', commission_end: p.commission_end||'',
        primary_color: p.primary_color||'', logo_url: p.logo_url||'', featured_tests: p.featured_tests||'',
        welcome_message: p.welcome_message||'',
        entry_headline: p.entry_headline||'', entry_subcopy: p.entry_subcopy||'', entry_benefit: p.entry_benefit||'',
        entry_cta_label: p.entry_cta_label||'', entry_cta_go: p.entry_cta_go||'',
      });
      setPmsg(''); setShowForm(true);
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    };
    const closeForm = () => { setShowForm(false); setEditCode(null); setPmsg(''); };
    const save = async () => {
      if (!f.code.trim() || !f.name.trim()) { setPmsg('코드·파트너명은 필수예요'); return; }
      const isNew = !editCode;
      const body = {};   // 빈칸은 null로 정리(선택 필드 비우기), 숫자는 변환
      Object.keys(EMPTY_F).forEach(k => { const v = (f[k] ?? '').toString(); body[k] = v.trim() === '' ? null : v; });
      body.revenue_share_rate = Number(f.revenue_share_rate) || 0;
      body.code = f.code.trim();
      try {
        const url = isNew ? '/api/admin/partners' : `/api/admin/partners/${encodeURIComponent(editCode)}`;
        const d = await adminFetch(url, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(body) });
        if (d.success) { setShowForm(false); setEditCode(null); setPmsg(isNew ? '파트너 등록 완료' : '수정 완료'); loadPartners(); }
        else setPmsg(d.error || (isNew ? '등록 실패' : '수정 실패'));
      } catch { setPmsg('네트워크 오류'); }
    };
    const loadLedger = async (code) => {
      const c = code || sel; if (!c) return;
      try { const d = await adminFetch(`/api/admin/partner-commissions?code=${encodeURIComponent(c)}&from=${from}&to=${to}`); if (d.success) setLedger(d.data); } catch {}
    };
    const pick = async (code) => { setSel(code); setLedger(null); await loadLedger(code); };
    const downloadCsv = () => {
      if (!ledger || !(ledger.rows||[]).length) return;
      const hdr = ['결제ID','일시','회원(마스킹)','상품','결제액','쉐어율','쉐어액','통화','상태'];
      const esc = (v) => { const s = String(v==null?'':v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
      const lines = ledger.rows.map(r => [r.charge_id, r.created_at, r.user_email_masked, r.package_key||'', r.charge_amount, r.rate, r.share_amount, r.currency, r.status].map(esc).join(','));
      const csv = '﻿' + [hdr.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `정산_${sel}_${from}_${to}.csv`; a.click(); URL.revokeObjectURL(a.href);
    };
    const settle = async () => {
      if (!window.confirm(`${sel} · ${from}~${to}\n이 기간의 미정산 건을 '정산완료'로 표시할까요? (실제 지급은 별도)`)) return;
      const ref = window.prompt('정산 참조(선택, 예: 2026-07 이체)', '') || undefined;
      try { const d = await adminFetch('/api/admin/partner-commissions/settle', { method:'POST', body: JSON.stringify({ code: sel, from, to, ref }) }); if (d.success) { window.alert(`${d.settled}건 정산완료 처리`); loadLedger(sel); } } catch {}
    };
    const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400";
    // 선택 가능한 값은 드롭다운/체크칩으로, 자유입력만 예시(placeholder) 표기
    const TEST_OPTIONS = [['PHQ9','우울 PHQ-9'],['GAD7','불안 GAD-7'],['DASS21','우울·불안·스트레스 DASS-21'],['BIG5','성격 5요인 BIG5'],['LOST','상실 LOST'],['SCT','문장완성 SCT'],['DSI','자아분화 DSI'],['BURNOUT','번아웃 K-MBI+'],['RIASEC','직업흥미 RIASEC'],['VALUES','직업가치관']];
    const RATE_OPTIONS = [0,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.5];
    const COLOR_OPTIONS = [['','지정 안 함'],['#2D6A4F','마음풀 그린'],['#1E7A54','딥그린'],['#3B82F6','블루'],['#4F46E5','인디고'],['#7C3AED','퍼플'],['#EC4899','핑크'],['#F59E0B','오렌지'],['#EF4444','레드'],['#14B8A6','틸'],['#475569','슬레이트']];
    const GO_OPTIONS = [['','설정 안 함 (코어 홈으로)'], ...TEST_OPTIONS.map(([c, l]) => ['test:' + c, l + ' 검사']), ['history','내 검사 이력'], ['counseling','상담 연결']];
    const FIELDS = [
      { k:'code', label:'파트너 코드 (영문 대문자)', kind:'text', ph:'SAMA', newOnly:true },
      { k:'name', label:'파트너명', kind:'text', ph:'삼아인터내셔널' },
      { k:'revenue_share_rate', label:'수익쉐어율', kind:'rate' },
      { k:'sso_secret', label:'SSO 시크릿 (자동로그인용·제휴처와 공유)', kind:'text', ph:'영문·숫자 32자 이상 권장' },
      { k:'contact_email', label:'정산 담당자 이메일', kind:'text', ph:'billing@partner.com' },
      { k:'commission_start', label:'정산 귀속 시작일 (비우면 무기한)', kind:'date' },
      { k:'commission_end', label:'정산 귀속 종료일 (선택)', kind:'date' },
      { k:'primary_color', label:'브랜드 색상', kind:'color' },
      { k:'logo_url', label:'로고 이미지 URL (선택)', kind:'text', ph:'https://partner.com/logo.png' },
      { k:'featured_tests', label:'추천 검사 (여러 개 선택 가능)', kind:'tests', full:true },
      { k:'welcome_message', label:'환영 메시지 (로그인 후 대시보드 배너)', kind:'area', ph:'삼아 회원님, 마음풀에 오신 걸 환영합니다 :)', full:true },
      { k:'entry_headline', label:'[진입화면] 헤드라인 (줄바꿈 가능·비우면 기본문구)', kind:'area', ph:'삼아 회원님,\n마음풀에 오신 걸 환영해요', full:true },
      { k:'entry_subcopy', label:'[진입화면] 서브 카피 (비우면 환영 메시지/기본문구)', kind:'area', ph:'3분 심리검사로 지금 내 마음 상태를 확인해 보세요.', full:true },
      { k:'entry_benefit', label:'[진입화면] 제휴 전용 혜택 문구 (비우면 숨김)', kind:'text', ph:'삼아 회원 전용 무료 검사 1회' },
      { k:'entry_cta_label', label:'[진입화면] CTA 버튼 문구', kind:'text', ph:'무료로 내 마음 검사 시작' },
      { k:'entry_cta_go', label:'[진입화면] CTA 연결 (검사·이력 등 선택)', kind:'go' },
    ];
    const testSet = new Set(String(f.featured_tests || '').split(',').map(s => s.trim()).filter(Boolean));
    const toggleTest = (code) => {
      const next = new Set(testSet);
      if (next.has(code)) next.delete(code); else next.add(code);
      const ordered = TEST_OPTIONS.map(([c]) => c).filter(c => next.has(c));
      setF(o => ({ ...o, featured_tests: ordered.join(',') }));
    };
    return (
      <div className="bg-white rounded-2xl p-5 mb-5 border-2 border-emerald-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-emerald-700">🤝 제휴 파트너 관리 {partners ? `(${partners.length}개)` : ''}</div>
          <button onClick={() => showForm ? closeForm() : openNew()} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">{showForm ? '✕ 닫기' : '+ 파트너 등록'}</button>
        </div>
        {pmsg && <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${pmsg.includes('완료') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{pmsg}</div>}
        {showForm && (
          <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
            <div className="text-xs font-bold text-gray-600 mb-2">{editCode ? `✏️ ${editCode} 수정` : '＋ 새 파트너 등록'}</div>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((fd) => {
                const dis = !!(fd.newOnly && editCode);
                const set = (v) => setF(o => ({ ...o, [fd.k]: v }));
                let ctrl;
                if (fd.kind === 'area') {
                  ctrl = <textarea value={f[fd.k] || ''} onChange={e => set(e.target.value)} rows={2} placeholder={fd.ph} className={inp + ' resize-y'} />;
                } else if (fd.kind === 'rate') {
                  ctrl = (
                    <select value={String(Number(f.revenue_share_rate) || 0)} onChange={e => set(e.target.value)} className={inp}>
                      {RATE_OPTIONS.map(r => <option key={r} value={String(r)}>{Math.round(r * 100)}%{r === 0 ? ' (쉐어 없음)' : ''}</option>)}
                    </select>
                  );
                } else if (fd.kind === 'date') {
                  ctrl = <input type="date" value={f[fd.k] || ''} onChange={e => set(e.target.value)} className={inp} />;
                } else if (fd.kind === 'color') {
                  const cur = f.primary_color || '';
                  const inList = COLOR_OPTIONS.some(([v]) => v === cur);
                  ctrl = (
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-9 rounded-md border border-gray-200 shrink-0" style={{ background: cur || '#ffffff' }} />
                      <select value={cur} onChange={e => set(e.target.value)} className={inp}>
                        {!inList && cur && <option value={cur}>{cur} (현재값)</option>}
                        {COLOR_OPTIONS.map(([v, l]) => <option key={v || 'none'} value={v}>{l}{v ? ` ${v}` : ''}</option>)}
                      </select>
                    </div>
                  );
                } else if (fd.kind === 'go') {
                  ctrl = (
                    <select value={f.entry_cta_go || ''} onChange={e => set(e.target.value)} className={inp}>
                      {GO_OPTIONS.map(([v, l]) => <option key={v || 'none'} value={v}>{l}</option>)}
                    </select>
                  );
                } else if (fd.kind === 'tests') {
                  ctrl = (
                    <div className="flex flex-wrap gap-1.5">
                      {TEST_OPTIONS.map(([c, l]) => {
                        const on = testSet.has(c);
                        return <button key={c} type="button" onClick={() => toggleTest(c)} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${on ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}>{on ? '✓ ' : ''}{l}</button>;
                      })}
                    </div>
                  );
                } else {
                  ctrl = <input value={f[fd.k] || ''} onChange={e => set(e.target.value)} placeholder={fd.ph} disabled={dis} className={inp + (dis ? ' bg-gray-100 text-gray-400' : '')} />;
                }
                return (
                  <div key={fd.k} className={fd.full ? 'col-span-2' : ''}>
                    <div className="text-xs text-gray-500 mb-1">{fd.label}</div>
                    {ctrl}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={save} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">{editCode ? '수정 저장' : '등록하기'}</button>
              <button onClick={closeForm} className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-100">취소</button>
            </div>
            <div className="text-[11px] text-gray-400 mt-2">💡 진입화면 설정은 저장 즉시 <b>/p</b> 제휴 랜딩에 반영돼요(배포 불필요).</div>
          </div>
        )}
        <div className="grid md:grid-cols-[280px_1fr] gap-4 items-start">
          {/* 파트너 목록 */}
          <div className="flex flex-col gap-2">
            {partners === null && <div className="text-xs text-gray-400 p-4 text-center">로딩 중...</div>}
            {partners && partners.length === 0 && <div className="text-xs text-gray-400 p-4 text-center bg-gray-50 rounded-xl">등록된 파트너가 없습니다</div>}
            {(partners||[]).map(p => (
              <div key={p.code} onClick={() => pick(p.code)} className={`bg-white border-2 rounded-xl p-3 cursor-pointer ${sel === p.code ? 'border-emerald-500' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">✏️ 수정</button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_active ? '활성' : '비활성'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 mb-1">코드: {p.code} · 쉐어 {((p.revenue_share_rate||0)*100).toFixed(0)}%</div>
                <div className="text-[11px] text-gray-500">유입 {(p.total_users||0).toLocaleString()}명 · 매출 {won(p.total_revenue)}</div>
              </div>
            ))}
          </div>
          {/* 정산 원장 */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            {!sel ? (
              <div className="text-center text-gray-400 text-sm py-10">파트너를 선택하면 정산 내역을 조회하고 CSV로 받을 수 있어요</div>
            ) : (
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="text-sm font-bold">📒 {sel} 정산 원장</div>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-2 py-1 border border-gray-200 rounded text-xs" />
                    <span className="text-gray-400">~</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-2 py-1 border border-gray-200 rounded text-xs" />
                    <button onClick={() => loadLedger(sel)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">조회</button>
                  </div>
                </div>
                {ledger && (
                  <div>
                    <div className="flex gap-4 flex-wrap text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-2.5 mb-3">
                      <span>건수 <b>{(ledger.totals?.cnt||0).toLocaleString()}</b></span>
                      <span>결제액 <b>{won(ledger.totals?.revenue)}</b></span>
                      <span>쉐어 합계 <b className="text-amber-700">{won(ledger.totals?.share)}</b></span>
                      <span>미정산 <b className="text-orange-600">{won(ledger.totals?.unsettled)}</b></span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={downloadCsv} disabled={!(ledger.rows||[]).length} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${(ledger.rows||[]).length ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>⬇ CSV 다운로드</button>
                      <button onClick={settle} disabled={!(ledger.totals?.unsettled)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${(ledger.totals?.unsettled) ? 'border-amber-300 text-amber-700 bg-white' : 'border-gray-200 text-gray-400'}`}>이 기간 정산완료 처리</button>
                    </div>
                    {(ledger.rows||[]).length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-6">해당 기간 적립 내역이 없습니다 (실결제가 쌓이면 표시돼요)</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse">
                          <thead><tr className="bg-gray-100 text-left text-gray-500">{['일시','회원','상품','결제액','율','쉐어액','상태'].map(h => <th key={h} className="px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
                          <tbody>
                            {ledger.rows.map(r => (
                              <tr key={r.charge_id} className="border-b border-gray-50">
                                <td className="px-2 py-1.5 text-gray-500">{(r.created_at||'').slice(0,10)}</td>
                                <td className="px-2 py-1.5">{r.user_email_masked}</td>
                                <td className="px-2 py-1.5">{r.package_key||'-'}</td>
                                <td className="px-2 py-1.5">{won(r.charge_amount)}</td>
                                <td className="px-2 py-1.5">{((r.rate||0)*100).toFixed(0)}%</td>
                                <td className="px-2 py-1.5 font-bold text-amber-700">{won(r.share_amount)}</td>
                                <td className="px-2 py-1.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'settled' ? 'bg-green-100 text-green-700' : r.status === 'reversed' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'settled' ? '정산완료' : r.status === 'reversed' ? '환불' : '미정산'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function MasterCouponPanel() {
    const [mode, setMode] = useState('single');
    const [value, setValue] = useState(50);
    const [count, setCount] = useState(10);
    const [code, setCode] = useState('');
    const [maxR, setMaxR] = useState('');
    const [source, setSource] = useState('');
    const [until, setUntil] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [batches, setBatches] = useState(null);

    const create = async () => {
      if (busy) return; setBusy(true); setResult(null);
      const body = { mode, value: parseInt(value, 10) };
      if (source.trim()) body.source = source.trim();
      if (until) body.valid_until = new Date(until + 'T23:59:59').toISOString();
      if (mode === 'single') body.count = parseInt(count, 10) || 1;
      else { if (code.trim()) body.code = code.trim(); if (maxR) body.max_redemptions = parseInt(maxR, 10); }
      try {
        const d = await adminFetch('/api/admin/coupon/create', { method: 'POST', body: JSON.stringify(body) });
        setResult(d); if (d.success) loadBatches();
      } catch { setResult({ success: false, error: '네트워크 오류' }); }
      finally { setBusy(false); }
    };
    const loadBatches = async () => {
      try { const d = await adminFetch('/api/admin/coupon/list'); if (d.success) setBatches(d.batches); } catch {}
    };
    const downloadCsv = async (batch) => {
      try {
        const r = await fetch(`/api/admin/coupon/list?csv=1&batch=${encodeURIComponent(batch)}`, { headers: { 'Authorization': 'Bearer ' + adminSecretInput } });
        const blob = await r.blob(); const u = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = u; a.download = `coupons_${batch}.csv`; a.click(); URL.revokeObjectURL(u);
      } catch {}
    };
    const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400";
    const lbl = "block text-xs font-semibold text-gray-500 mb-1";
    return (
      <div className="bg-white rounded-2xl p-5 mb-5 border-2 border-purple-100">
        <div className="text-sm font-bold text-purple-700 mb-3">🎟️ 쿠폰 발행·관리</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className={lbl}>쿠폰 유형</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className={inp}>
              <option value="single">1회용 고유코드 N개</option>
              <option value="campaign">공용 캠페인코드 1개</option>
            </select>
          </div>
          <div>
            <label className={lbl}>지급 크레딧 (등록 시 받는 크레딧)</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="예: 50" className={inp} />
          </div>
          {mode === 'single'
            ? <div>
                <label className={lbl}>발행 개수 (만들 코드 수)</label>
                <input type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="예: 10" className={inp} />
              </div>
            : <div>
                <label className={lbl}>코드 (빈칸=자동 생성)</label>
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="예: WELCOME2026" className={inp} />
              </div>}
          {mode === 'campaign' && <div>
            <label className={lbl}>전체 한도 (빈칸=무제한)</label>
            <input type="number" value={maxR} onChange={e => setMaxR(e.target.value)} placeholder="예: 100" className={inp} />
          </div>}
          <div>
            <label className={lbl}>배포처/캠페인 라벨 (관리용 메모)</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="예: 네이버블로그" className={inp} />
          </div>
          <div>
            <label className={lbl}>유효기간 (종료일, 빈칸=무기한)</label>
            <input type="date" value={until} onChange={e => setUntil(e.target.value)} className={inp} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={create} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300">{busy ? '발행 중...' : '발행'}</button>
          <button onClick={loadBatches} className="px-4 py-2 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100">목록 불러오기</button>
        </div>
        {result && (result.success
          ? <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg p-3 break-all">
              ✅ {result.count ?? result.codes?.length}개 발행 (batch {result.batchId})<br />
              <span className="text-gray-600">{(result.codes || []).join(', ')}</span>
            </div>
          : <div className="mt-2 text-xs text-red-500">{result.error}</div>)}
        {batches && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="text-xs font-bold text-gray-500 mb-2">발행 배치</div>
            {batches.length === 0 && <div className="text-xs text-gray-400">아직 발행 내역이 없습니다.</div>}
            {batches.map(b => (
              <div key={b.batch_id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                <span className="text-gray-700">{b.source || b.batch_id} · {b.value}cr · {b.redeemed}/{b.total} 사용</span>
                <button onClick={() => downloadCsv(b.batch_id)} className="text-purple-600 font-semibold hover:underline">CSV</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoggedIn && view === 'myPage') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setView('memberDashboard')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">{t("← 뒤로","← Back")}</button>
          <span className="font-bold text-gray-800">{t("마이페이지","My Page")}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => openMaumGame()}
              className="text-green-600 hover:text-green-800 text-sm px-2 py-1.5 rounded-lg hover:bg-green-50 transition"
              title="마음 게임">
              🎮
            </button>
            <button onClick={() => openMaumCouple()}
              className="text-rose-500 hover:text-rose-700 text-sm px-2 py-1.5 rounded-lg hover:bg-rose-50 transition"
              title="마음커플">
              💕
            </button>
            <CreditBadge />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 프로필 */}
        <div className="bg-white rounded-2xl p-5 mb-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">👤</div>
            <div>
              <div className="font-bold text-gray-800">{currentUser?.nickname || t('회원','member')}</div>
              <div className="text-sm text-gray-500 mt-0.5">📧 {t('계정 이메일','Account email')} · <span className="text-gray-700 font-medium">{currentUser?.email}</span></div>
            </div>
          </div>
        </div>

        {/* 🎟️ 쿠폰 등록 (사용자) */}
        <CouponCard />

        {/* 탭 */}
        <div className="flex gap-2 mb-5">
          {[[`credits`,t('크레딧 내역','Credits')],[`history`,t('검사 이력','History')],[`appointments`,t('상담 예약','Sessions')],[`referral`,t('친구 초대','Referral')],[`settings`,t('설정','Settings')]].map(([tab, label]) => (
            <button key={tab} onClick={() => { setMyPageTab(tab); if (tab === 'credits') refreshCredits(); if (tab === 'history') loadTestHistory(); if (tab === 'referral') loadReferralData(); if (tab === 'settings') checkPushStatus(); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${myPageTab === tab ? 'bg-green-700 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-green-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* 크레딧 & 결제 내역 */}
        {myPageTab === 'credits' && (() => {
          const usageTxns   = creditTxns.filter(tx => tx.type === 'spend');
          const chargeTxns  = creditTxns.filter(tx => tx.type === 'gain');

          const reasonLabel = (r) => ({
            signup_bonus:t('가입 보너스','Signup Bonus'),
            test:t('심리검사','Assessment'), chat:t('AI 채팅','AI Chat'),
            charge:t('크레딧 구매','Credit Purchase'), refund_api_error:t('오류 환불','Error Refund'),
            admin_grant:t('관리자 지급','Admin Grant'), referral:t('친구 초대','Referral'),
            couple:t('마음커플 분석','MaumCouple Analysis'), couple_session:t('마음커플 세션','MaumCouple Session'),
            game:t('마음게임','MaumGame'), game_spend:t('마음게임 아이템','MaumGame Item'),
            solo_analysis:t('이상형 성향 분석','Ideal Type Analysis'), date_course:t('데이트 코스 추천','Date Course'),
            coach:t('관계 코치','Relationship Coach'), counseling:t('상담 예약','Session Booking'),
            ai_refund:t('AI 오류 환불','AI Error Refund'), bonus:t('보너스 지급','Bonus'),
          }[r] || r);

          const reasonIcon = (tx) => {
            if (tx.type === 'spend') {
              if (tx.reason === 'test') return '📋';
              if (tx.reason === 'chat') return '💬';
              if (tx.reason?.startsWith('couple') || tx.reason === 'solo_analysis' || tx.reason === 'date_course' || tx.reason === 'coach') return '💕';
              if (tx.reason?.startsWith('game')) return '🌿';
              if (tx.reason === 'counseling') return '🏥';
              return '💸';
            }
            if (tx.reason === 'charge') return '💳';
            if (tx.reason === 'signup_bonus' || tx.reason === 'bonus') return '🎁';
            if (tx.reason === 'referral') return '🤝';
            if (tx.reason?.includes('refund')) return '↩️';
            if (tx.reason === 'admin_grant') return '⭐';
            return '✦';
          };

          const fmtDt = (d) => new Date(d).toLocaleString(lang === 'en' ? 'en-US' : 'ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

          return (
            <div>
              {/* 잔액 카드 */}
              <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-5 text-white mb-5"
                style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs opacity-75 mb-1">{t("현재 잔액","Current Balance")}</div>
                    <div className="text-4xl font-bold">✦ {credits}</div>
                    <div className="text-xs opacity-75 mt-1">{t(`심리검사 ${Math.floor(credits/10)}회 가능`,`${Math.floor(credits/10)} assessments available`)}</div>
                  </div>
                  <button onClick={() => setShowChargeView(true)}
                    className="text-sm bg-white text-green-700 font-bold px-5 py-2.5 rounded-full hover:bg-green-50 transition"
                    style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
                    {t("구매하기 →","Top up →")}
                  </button>
                </div>

                {/* 빠른 통계 */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label:t('총 구매','Total charged'), val: chargeTxns.filter(tx=>tx.reason==='charge').reduce((s,tx)=>s+tx.amount,0) + ' cr' },
                    { label:t('사용 건수','Usage count'), val: usageTxns.length + t('건',' uses') },
                    { label:t('이번 달 사용','This month'), val: usageTxns.filter(tx=>new Date(tx.created_at).getMonth()===new Date().getMonth()).reduce((s,tx)=>s+tx.amount,0) + ' cr' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/15 rounded-xl p-2 text-center">
                      <div className="text-xs opacity-75">{s.label}</div>
                      <div className="font-bold text-sm mt-0.5">{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 소탭 */}
              <div className="flex gap-2 mb-4">
                {[['usage',t('사용 내역','Usage')],['charge',t('구매/지급 내역','Charges')]].map(([tab,l]) => (
                  <button key={tab} onClick={() => setCreditSubTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${creditSubTab===tab ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                    style={{fontFamily:"'Noto Sans KR',sans-serif"}}>{l}</button>
                ))}
              </div>

              {/* 사용 내역 */}
              {creditSubTab === 'usage' && (
                <div className="space-y-2">
                  {usageTxns.length === 0 && <p className="text-gray-400 text-sm text-center py-6">{t("사용 내역이 없습니다","No usage history")}</p>}
                  {usageTxns.map((tx, i) => (
                    <div key={i} className="bg-white rounded-xl p-3.5 flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-base">
                          {reasonIcon(tx)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-700">{reasonLabel(tx.reason)}</div>
                          <div className="text-xs text-gray-400">{fmtDt(tx.created_at)}</div>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-red-500">-{tx.amount} cr</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 충전/지급 내역 */}
              {creditSubTab === 'charge' && (
                <div className="space-y-2">
                  {chargeTxns.length === 0 && <p className="text-gray-400 text-sm text-center py-6">{t("구매 내역이 없습니다","No charge history")}</p>}
                  {chargeTxns.map((tx, i) => {
                    // 환불 가능: 카드결제(charge)·완료상태·구매 7일 이내
                    const doneMs = Date.parse(String(tx.pg_completed_at || tx.created_at || '').replace(' ', 'T') + 'Z');
                    const days = (Date.now() - doneMs) / 86400000;
                    const refundable = tx.reason === 'charge' && tx.pg_status === 'completed' && tx.pg_amount && days >= 0 && days <= 7;
                    const isRefunded = tx.reason === 'charge' && tx.pg_status === 'refunded';
                    return (
                    <div key={i} className="bg-white rounded-xl p-3.5 flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-base">
                          {reasonIcon(tx)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-700">{reasonLabel(tx.reason)}</div>
                          <div className="text-xs text-gray-400">{fmtDt(tx.created_at)}</div>
                          {tx.reason==='charge' && tx.pg_amount && (
                            <div className={`text-xs mt-0.5 ${isRefunded ? 'text-gray-400' : 'text-blue-500'}`}>
                              ₩{Number(tx.pg_amount).toLocaleString('ko-KR')} {isRefunded ? t("환불됨","refunded") : t("결제 완료","payment complete")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-bold text-sm ${isRefunded ? 'text-gray-400 line-through' : 'text-green-600'}`}>+{tx.amount} cr</span>
                        {refundable && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(t(
                                `이 결제를 환불할까요?\n${tx.amount} 크레딧이 회수되고 ₩${Number(tx.pg_amount).toLocaleString('ko-KR')}이 카드로 환불돼요.\n(미사용 크레딧만 환불 가능)`,
                                `Refund this payment?\n${tx.amount} credits reclaimed and ₩${Number(tx.pg_amount).toLocaleString('ko-KR')} refunded to your card.`))) return;
                              try {
                                const r = await api._fetch('/api/credits/refund', { method: 'POST', body: JSON.stringify({ pgTid: tx.ref_id }) }).then(res => res.json());
                                if (r.success) { window.alert(r.message || t('환불이 완료됐어요.', 'Refunded.')); refreshCredits(); }
                                else window.alert(r.error || t('환불에 실패했어요.', 'Refund failed.'));
                              } catch { window.alert(t('환불 처리 중 오류가 발생했어요.', 'Refund error.')); }
                            }}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                            {t('환불 요청', 'Refund')}
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {chargeTxns.length > 0 && (
                    <div className="mt-2 bg-blue-50 rounded-xl p-3 text-center">
                      <button onClick={() => setShowChargeView(true)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
                        + {t("크레딧 구매하기","Top up credits")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* 검사 이력 */}
        {myPageTab === 'history' && (
          <div>
            <ExternalResultSection onSaved={loadTestHistory} externalShow={showExternalModal} setExternalShow={setShowExternalModal} />
            {testHistory.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{t("검사 이력이 없습니다","No assessment history")}</p>}
            {/* 점수가 있는 검사의 트렌드 요약 */}
            {(() => {
              const scored = ['PHQ9','GAD7','BURNOUT','DSI'];
              const scoreMax = { PHQ9: 27, GAD7: 21, BURNOUT: 240, DSI: 125 };
              const scoreColor = (type, score) => {
                if (type === 'PHQ9') return score >= 15 ? '#ef4444' : score >= 10 ? '#f97316' : score >= 5 ? '#eab308' : '#22c55e';
                if (type === 'GAD7') return score >= 15 ? '#ef4444' : score >= 10 ? '#f97316' : score >= 5 ? '#eab308' : '#22c55e';
                if (type === 'BURNOUT') { const p = score/240; return p >= 0.71 ? '#ef4444' : p >= 0.51 ? '#f97316' : p >= 0.31 ? '#eab308' : '#22c55e'; }
                if (type === 'DSI') return score >= 90 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
                return '#6b7280';
              };
              const summaries = scored.map(type => {
                const rows = testHistory.filter(h => h.test_type === type && h.score != null);
                if (rows.length === 0) return null;
                return { type, rows };
              }).filter(Boolean);
              if (summaries.length === 0) return null;
              return (
                <div className="mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-700 mb-3">📈 {t("점수 추이","Score Trends")}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {summaries.map(({ type, rows }) => {
                      const latest = rows[0];
                      const prev = rows[1];
                      const diff = prev ? latest.score - prev.score : null;
                      const max = scoreMax[type] || 100;
                      const pct = Math.round((latest.score / max) * 100);
                      const color = scoreColor(type, latest.score);
                      const testLabel = { PHQ9:t('우울(PHQ-9)','Depression(PHQ-9)'), GAD7:t('불안(GAD-7)','Anxiety(GAD-7)'), BURNOUT:t('번아웃','Burnout'), DSI:t('자아분화','Self-Diff.') };
                      return (
                        <div key={type} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="text-xs text-gray-400 mb-1">{testLabel[type]}</div>
                          <div className="flex items-end gap-1 mb-1">
                            <span className="text-xl font-bold" style={{ color }}>{latest.score}</span>
                            <span className="text-xs text-gray-400 mb-0.5">/{max}</span>
                            {diff !== null && (
                              <span className="text-xs font-semibold ml-1" style={{ color: type === 'DSI' ? (diff > 0 ? '#22c55e' : '#ef4444') : (diff > 0 ? '#ef4444' : '#22c55e') }}>
                                {diff > 0 ? `▲${diff}` : diff < 0 ? `▼${Math.abs(diff)}` : '→'}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          {latest.level && <div className="text-xs mt-1" style={{ color }}>{latest.level}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* SVG 라인 차트 — 시계열 추이 */}
            {(() => {
              const scored = ['PHQ9','GAD7','BURNOUT','DSI'];
              const scoreMax = { PHQ9: 27, GAD7: 21, BURNOUT: 240, DSI: 125 };
              const colors   = { PHQ9:'#6366f1', GAD7:'#f43f5e', BURNOUT:'#f97316', DSI:'#10b981' };
              const labels   = { PHQ9:'PHQ-9', GAD7:'GAD-7', BURNOUT:t('번아웃','Burnout'), DSI:t('자아분화','Self-Diff.') };
              const series = scored.map(type => {
                const rows = testHistory
                  .filter(h => h.test_type === type && h.score != null)
                  .slice().sort((a,b) => new Date(a.performed_at) - new Date(b.performed_at));
                return rows.length >= 2 ? { type, rows } : null;
              }).filter(Boolean);
              if (series.length === 0) return null;

              const W = 320, H = 110, PAD = { top:10, bottom:30, left:28, right:10 };
              const innerW = W - PAD.left - PAD.right;
              const innerH = H - PAD.top - PAD.bottom;

              const allDates = [...new Set(series.flatMap(s => s.rows.map(r => r.performed_at)))].sort();
              const xScale = idx => allDates.length < 2 ? PAD.left + innerW/2 : PAD.left + (idx / (allDates.length - 1)) * innerW;
              const yScale = (score, max) => PAD.top + innerH - (score / max) * innerH;
              const dateLabel = d => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };

              return (
                <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="text-xs font-bold text-gray-600 mb-2">📉 {t("점수 시계열 차트","Score Timeline")}</div>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {series.map(s => (
                      <div key={s.type} className="flex items-center gap-1">
                        <div className="w-3 h-1.5 rounded-full" style={{background:colors[s.type]}}/>
                        <span className="text-xs text-gray-500">{labels[s.type]}</span>
                      </div>
                    ))}
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',overflow:'visible'}}>
                    {/* 격자선 */}
                    {[25,50,75,100].map(pct => {
                      const y = PAD.top + innerH - (pct/100)*innerH;
                      return (
                        <g key={pct}>
                          <line x1={PAD.left} y1={y} x2={W-PAD.right} y2={y} stroke="#f0f0f0" strokeWidth="1"/>
                          <text x={PAD.left-4} y={y+3} textAnchor="end" fontSize="7" fill="#ccc">{pct}</text>
                        </g>
                      );
                    })}
                    {/* X축 날짜 레이블 */}
                    {allDates.filter((_, i) => allDates.length <= 6 || i % Math.ceil(allDates.length/5) === 0 || i === allDates.length-1).map((d,i,arr) => (
                      <text key={d} x={xScale(allDates.indexOf(d))} y={H-2} textAnchor="middle" fontSize="7" fill="#aaa">{dateLabel(d)}</text>
                    ))}
                    {/* 라인 + 점 */}
                    {series.map(s => {
                      const max = scoreMax[s.type] || 100;
                      const pts = s.rows.map(r => {
                        const xi = allDates.indexOf(r.performed_at);
                        return [xScale(xi), yScale(r.score, max)];
                      });
                      const d = 'M ' + pts.map(p => p.join(',')).join(' L ');
                      return (
                        <g key={s.type}>
                          <path d={d} fill="none" stroke={colors[s.type]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          {pts.map(([x,y],i) => (
                            <circle key={i} cx={x} cy={y} r="3" fill={colors[s.type]}/>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* 감정 추이 위젯 */}
            {moodTrend.length >= 2 && (() => {
              const W = 320, H = 80, PAD = { top: 10, bottom: 20, left: 16, right: 8 };
              const innerW = W - PAD.left - PAD.right;
              const innerH = H - PAD.top - PAD.bottom;
              const xScale = i => PAD.left + (i / (moodTrend.length - 1)) * innerW;
              const yScale = s => PAD.top + innerH - (s / 100) * innerH;
              const pts = moodTrend.map((d, i) => [xScale(i), yScale(d.avg_score)]);
              const pathD = 'M ' + pts.map(p => p.join(',')).join(' L ');
              const areaD = `${pathD} L ${pts[pts.length-1][0]},${PAD.top+innerH} L ${pts[0][0]},${PAD.top+innerH} Z`;
              const lastScore = moodTrend[moodTrend.length - 1]?.avg_score;
              const moodColor = lastScore >= 70 ? '#22c55e' : lastScore >= 40 ? '#f59e0b' : '#ef4444';
              const moodLabel = lang === 'en'
                ? (lastScore >= 70 ? 'Good' : lastScore >= 40 ? 'Moderate' : 'Struggling')
                : (lastScore >= 70 ? '양호' : lastScore >= 40 ? '보통' : '힘듦');
              return (
                <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-gray-600">💙 {t("AI 상담 감정 추이","Mood Trend from AI Sessions")}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{color:moodColor}}>{Math.round(lastScore)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:moodColor+'20',color:moodColor}}>{moodLabel}</span>
                    </div>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',overflow:'visible'}}>
                    <path d={areaD} fill={moodColor} fillOpacity="0.08"/>
                    <path d={pathD} fill="none" stroke={moodColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    {pts.map(([x,y],i) => (
                      <circle key={i} cx={x} cy={y} r="3" fill={moodColor}/>
                    ))}
                    {moodTrend.filter((_,i) => moodTrend.length <= 7 || i % Math.ceil(moodTrend.length/5) === 0 || i === moodTrend.length-1).map((d,_,arr) => {
                      const i = moodTrend.indexOf(d);
                      const dt = new Date(d.day); const label = `${dt.getMonth()+1}/${dt.getDate()}`;
                      return <text key={d.day} x={xScale(i)} y={H-2} textAnchor="middle" fontSize="7" fill="#aaa">{label}</text>;
                    })}
                  </svg>
                  <p className="text-xs text-gray-400 mt-1">{t(`최근 ${moodTrend.length}회 AI 상담 기반`,`Based on last ${moodTrend.length} AI sessions`)}</p>
                </div>
              );
            })()}

            {/* 전체 이력 목록 */}
            <div className="space-y-2">
              {testHistory.map((h, i) => {
                const prevSame = testHistory.slice(i + 1).find(p => p.test_type === h.test_type);
                const testEmoji2 = { PHQ9:'😔', GAD7:'😰', DASS21:'📊', BIG5:'🌟', LOST:'🧭', SCT:'✍️', DSI:'🪞', BURNOUT:'🔥', RIASEC:'🔍', VALUES:'💎' };
                return (
                  <div key={i}
                    onClick={() => { if (h.id) { setReportId(h.id); setView('testReport'); } }}
                    title={t("리포트 보기","View report")}
                    className="bg-white rounded-xl p-3 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{testEmoji2[h.test_type] || '📋'}</span>
                        <div>
                          <span className="font-semibold text-gray-700 text-sm">{h.test_type}</span>
                          <span className="text-xs text-gray-400 ml-2">{new Date(h.performed_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {h.score != null && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {h.score}점
                          </span>
                        )}
                        {h.level && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            {h.level}
                          </span>
                        )}
                        {h.has_analysis ? (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">📄 {t("리포트","Report")}</span>
                        ) : prevSame ? (
                          <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{t("재검사","Retest")}</span>
                        ) : null}
                        <span className="text-gray-300 text-sm">›</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 친구 초대 */}
        {myPageTab === 'referral' && (
          <div>
            <Msg msg={referralMsg} />
            {referralLoading ? (
              <div className="text-center py-8 text-gray-400">{t("로딩 중...","Loading...")}</div>
            ) : referralData ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-5 text-white">
                  <p className="text-xs opacity-75 mb-1">{t("내 초대 코드","My Invite Code")}</p>
                  <div className="text-3xl font-bold tracking-widest mb-3">{referralData.code}</div>
                  <button
                    onClick={() => copyInviteLink(referralData.inviteUrl)}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >🔗 {t("초대 링크 복사","Copy invite link")}</button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                  <p className="font-bold text-amber-800 text-sm mb-2">🎁 {t("초대 보상","Referral Rewards")}</p>
                  <p className="text-sm text-amber-700">✦ {t(<>친구가 링크로 가입하면 친구에게 <strong>+10 크레딧</strong></>, <>Friend gets <strong>+10 credits</strong> when they sign up</>)}</p>
                  <p className="text-sm text-amber-700">✦ {t(<>친구가 첫 결제 완료 시 나에게 <strong>+30 크레딧</strong></>, <>You get <strong>+30 credits</strong> when friend makes first purchase</>)}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[[t('초대','Invited'), referralData.stats.totalInvited],[t('완료','Done'), referralData.stats.completed],[t('획득','Earned'), referralData.stats.totalEarned + ' cr']].map(([label, val]) => (
                    <div key={label} className="bg-white rounded-2xl p-4 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-green-700">{val}</div>
                      <div className="text-xs text-gray-400 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {referralList.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 text-sm mb-2">{t("초대 목록","Invite List")}</p>
                    <div className="space-y-2">
                      {referralList.map((r, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 flex items-center justify-between border border-gray-100">
                          <div>
                            <span className="text-sm font-medium text-gray-700">{r.referee_email_masked}</span>
                            <span className="text-xs text-gray-400 ml-2">{new Date(r.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.status === 'completed' ? t('완료','Done') +' +'+r.referrer_bonus+'cr' : t('대기 중','Pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={loadReferralData} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition">{t("초대 코드 불러오기","Load invite code")}</button>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="font-semibold text-gray-700 text-sm mb-2">{t("친구 초대 코드 입력","Enter a friend's invite code")}</p>
              <div className="flex gap-2">
                <input
                  type="text" placeholder={t("PSY코드 입력","Enter PSY code")}
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm font-mono"
                />
                <button onClick={applyReferralCode} className="bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-800 transition">{t("적용","Apply")}</button>
              </div>
            </div>
          </div>
        )}

        {/* 설정 */}
        {myPageTab === 'appointments' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-4">
            <div className="text-5xl">🏥</div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{t("전문 상담 기관 안내","Professional Counseling Centers")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t(<>마음풀은 심리검사 및 AI 상담 서비스를 제공합니다.<br/>전문 상담사와의 상담은 각 기관에 직접 연락하시거나<br/>아래 버튼을 눌러 가까운 상담센터를 찾아보세요.</>, <>Maumful provides psychological assessments and AI counseling.<br/>For professional counseling, contact a center directly or<br/>tap below to find one near you.</>)}
              </p>
            </div>
            <button onClick={() => { setView('counseling'); window.scrollTo({ top:0, behavior:'smooth' }); }}
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition">
              🏥 {t("상담센터 찾기 →","Find a Center →")}
            </button>
          </div>
        )}
                {myPageTab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h4 className="font-bold text-gray-700 mb-3">{t("언어 설정","Language")}</h4>
              <div className="flex gap-2">
                {[['ko','한국어'],['en','English']].map(([lang, label]) => (
                  <button key={lang} onClick={async () => { await api.updateMe({ locale: lang }); setCurrentUser(p => ({ ...p, locale: lang })); tokenStore.setUser({ ...currentUser, locale: lang }); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${currentUser?.locale === lang ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 🧠 AI 상담 해석 방식 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h4 className="font-bold text-gray-700 mb-1">{t("AI 상담 해석 방식","AI Counseling Mode")}</h4>
              <p className="text-xs text-gray-400 mb-3">{t("검사 결과를 어떤 관점으로 해석할지 선택합니다","Choose how AI interprets your results")}</p>
              <div className="grid gap-2">
                {[
                  { mode: 'psychological', icon: '🧠',
                    label: t('심리상담 (기본)','Psychology (default)'),
                    desc: t('심리학 이론과 과학적 근거를 바탕으로 해석합니다','Interpreted through psychological theory and scientific evidence'),
                    activeClass: 'border-green-500 bg-green-50', checkClass: 'text-green-600' },
                  { mode: 'biblical', icon: '✝️',
                    label: t('기독교 상담','Christian Counseling'),
                    desc: t('성경 말씀과 기독교 신앙을 기반으로 해석합니다','Interpreted through Scripture and Christian faith'),
                    activeClass: 'border-purple-400 bg-purple-50', checkClass: 'text-purple-600' },
                ].map(({ mode, icon, label, desc, activeClass, checkClass }) => (
                  <button key={mode} onClick={() => updateCounselingMode(mode)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition w-full
                      ${counselingMode === mode ? activeClass : 'border-gray-100 hover:border-gray-300'}`}>
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${counselingMode === mode ? checkClass : 'text-gray-700'}`}>{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                    </div>
                    {counselingMode === mode && <span className={`${checkClass} font-bold text-sm`}>✓</span>}
                  </button>
                ))}
              </div>
              {counselingMode === 'biblical' && (
                <p className="text-xs text-purple-600 mt-2 bg-purple-50 rounded-lg p-2 leading-relaxed">
                  ✝️ {t("기독교 상담 모드 적용 중 — AI 분석과 채팅 상담에 성경적 관점의 해석과 권장사항이 포함됩니다","Christian counseling mode active — AI analysis and chat include biblical perspectives and recommendations")}
                </p>
              )}
            </div>

            {/* 🔔 Web Push 알림 */}
            {pushStatus !== 'unsupported' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-1">🔔 {t("푸시 알림","Push Notifications")}</h4>
                <p className="text-xs text-gray-400 mb-3">{t("검사 결과 업데이트, 상담 알림을 바로 받아보세요","Get instant alerts for result updates and sessions")}</p>
                {pushStatus === 'denied' ? (
                  <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3">{t("브라우저 알림이 차단되어 있어요. 주소 표시줄의 잠금 아이콘에서 알림 권한을 허용해 주세요.","Notifications are blocked. Allow them from the lock icon in your address bar.")}</p>
                ) : pushStatus === 'subscribed' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-semibold">✅ {t("알림 켜져 있음","Notifications on")}</span>
                    <button onClick={unsubscribePush} className="text-xs text-gray-400 hover:text-gray-600 underline">{t("끄기","Turn off")}</button>
                  </div>
                ) : (
                  <button onClick={subscribePush} className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 transition">
                    🔔 {t("알림 켜기","Enable notifications")}
                  </button>
                )}
              </div>
            )}

            {currentUser?.email && !currentUser?.social_provider && !currentUser?.is_email_verified && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <h4 className="font-bold text-amber-800 mb-1">📧 {t("이메일 미인증","Email Not Verified")}</h4>
                <p className="text-xs text-amber-700 mb-3">{t("이메일 인증을 완료하면 계정을 안전하게 보호할 수 있어요","Verify your email to keep your account secure")}</p>
                <button onClick={async () => {
                  const r = await fetch('/api/auth/resend-verify', { method:'POST', headers:{ 'Content-Type':'application/json', ...api._authHeader() }, body: JSON.stringify({ email: currentUser.email }) }).then(r=>r.json());
                  alert(r.success ? t('인증 이메일을 발송했어요!','Verification email sent!') : r.error || t('발송 실패','Send failed'));
                }} className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition">
                  📧 {t("인증 이메일 재발송","Resend verification email")}
                </button>
              </div>
            )}

            {currentUser?.email && !currentUser?.social_provider && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-3">{t("비밀번호 변경","Change Password")}</h4>
                <div className="space-y-2 mb-3">
                  <input id="cp-current" type="password" placeholder={t("현재 비밀번호","Current password")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
                  <input id="cp-new" type="password" placeholder={t("새 비밀번호 (8자 이상)","New password (min. 8 chars)")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
                  <input id="cp-confirm" type="password" placeholder={t("새 비밀번호 확인","Confirm new password")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" />
                </div>
                {changePwMsg.text && (
                  <p className={`text-xs mb-3 px-3 py-2 rounded-lg ${changePwMsg.type === 'success' ? 'bg-green-50 text-green-700' : changePwMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    {changePwMsg.text}
                  </p>
                )}
                <button onClick={async () => {
                  const cur  = document.getElementById('cp-current')?.value || '';
                  const nw   = document.getElementById('cp-new')?.value || '';
                  const conf = document.getElementById('cp-confirm')?.value || '';
                  if (!cur || !nw || !conf) { setChangePwMsg({ type: 'error', text: t('모든 항목을 입력해주세요.','Please fill in all fields.') }); return; }
                  if (nw.length < 8) { setChangePwMsg({ type: 'error', text: t('비밀번호는 8자 이상이어야 합니다.','Password must be at least 8 characters.') }); return; }
                  if (nw !== conf) { setChangePwMsg({ type: 'error', text: t('새 비밀번호가 일치하지 않습니다.','Passwords do not match.') }); return; }
                  setChangePwMsg({ type: 'loading', text: t('변경 중...','Updating...') });
                  const r = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...api._authHeader() },
                    body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
                  }).then(r => r.json());
                  if (r.success) {
                    setChangePwMsg({ type: 'success', text: t('비밀번호가 변경되었습니다.','Password updated successfully.') });
                    document.getElementById('cp-current').value = '';
                    document.getElementById('cp-new').value = '';
                    document.getElementById('cp-confirm').value = '';
                  } else {
                    setChangePwMsg({ type: 'error', text: r.error || t('변경 실패','Update failed') });
                  }
                }} className="w-full bg-green-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-800 transition">
                  {t("비밀번호 변경","Change Password")}
                </button>
              </div>
            )}

            <button onClick={async () => { if (window.confirm(t('정말 탈퇴하시겠습니까?','Are you sure you want to delete your account?'))) { await api.deleteMe(); handleLogout(); } }}
              className="w-full bg-red-50 text-red-500 border border-red-200 py-3 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
              {t("회원 탈퇴","Delete Account")}
            </button>
            <button onClick={handleLogout}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
              로그아웃
            </button>
          </div>
        )}
      </main>
      {showChargeView && <ChargeView onClose={() => { setShowChargeView(false); refreshCredits(); }} credits={credits} regionConfig={regionConfig} />}
    </div>
  );

  // ============================================================
  // 충전 화면 컴포넌트 (인라인)
  // ============================================================
  // ============================================================
  // 크레딧 충전 결제 화면 (토스페이먼츠 / 스트라이프)
  // ============================================================
  function ChargeView({ onClose, credits, regionConfig }) {
    const { useState: useS, useEffect: useE } = React;
    // 결제 준비중 플래그 — 토스 정식 결제 승인 완료, 결제 버튼 활성화
    const PAYMENT_LIVE = true;
    const isKorea   = !regionConfig || regionConfig.pg === 'toss';
    const currency  = isKorea ? 'KRW' : 'USD';

    // 단품 상품 (하이브리드: 구매 시 해당 크레딧 지급, 화면은 단품으로 표기). 백엔드 PACKAGES와 키·금액 일치
    const PACKAGES_KR = [
      { key:'test_one', credits:10, amount:2000, label:t('심리검사 1회','Assessment'),      desc:t('검사 1회 + 결과 해석','1 test + report'),  badge:null },
      { key:'ai_10',    credits:20, amount:2900, label:t('AI 상담 10회권','AI chat ×10'),    desc:t('AI 채팅 10회','10 AI chats'),            badge:t('인기','Popular') },
      { key:'pdf_one',  credits:3,  amount:1000, label:t('PDF 결과해석','PDF report'),        desc:t('심층 해석 PDF 1회','In-depth PDF'),       badge:null },
      { key:'allinone', credits:33, amount:3900, label:t('올인원 패키지','All-in-One'),       desc:t('검사+AI 10회+PDF','Test+AI+PDF'),        badge:t('추천','Best') },
      // ── 서비스별 프리미엄 상품(마음풀 크레딧 지급 → 각 서비스에서 사용) ──
      { key:'integrated_one', credits:40, amount:4500, label:t('통합 심층 해석 1회','Integrated Insight'), desc:t('여러 검사를 한 사람으로 종합','All tests, one deep read'), badge:t('심층','Deep') },
      { key:'bubu_pack10',    credits:25, amount:3300, label:t('마음부부 통역 10회팩','Maum Bubu ×10'),     desc:t('부부 대화 통역 10회','10 couple translations'),        badge:null },
      { key:'sedae_pack10',   credits:25, amount:3300, label:t('마음세대 통역팩','Maum Sedae pack'),        desc:t('부모-자녀 통역(성인)','Parent-child (adult)'),         badge:null },
      // ── 외부 서비스 상품(결제 시 각 서비스로 자동 지급 — 마음풀 크레딧 아님) ──
      { key:'otter_light',  credits:0, amount:7900,  label:t('마음수달 라이트','Maumotter Light'),  desc:t('월 30세션 · 아이 마음 통역','30 sessions/mo'),   badge:null },
      { key:'otter_pro',    credits:0, amount:14900, label:t('마음수달 프로','Maumotter Pro'),      desc:t('월 100세션','100 sessions/mo'),                 badge:null },
      { key:'otter_pack10', credits:0, amount:6900,  label:t('마음수달 10회팩','Maumotter ×10'),    desc:t('10회 · 60일','10 sessions · 60d'),              badge:null },
      { key:'gyeot_light',  credits:0, amount:7900,  label:t('마음곁 라이트','Maumgyeot Light'),    desc:t('월 30세션 · 반려동물 통역','30 sessions/mo'),   badge:null },
      { key:'gyeot_pro',    credits:0, amount:14900, label:t('마음곁 프로','Maumgyeot Pro'),        desc:t('월 100세션','100 sessions/mo'),                 badge:null },
      { key:'gyeot_pack10', credits:0, amount:6900,  label:t('마음곁 10회팩','Maumgyeot ×10'),      desc:t('10회 · 60일','10 sessions · 60d'),              badge:null },
    ];
    const PACKAGES_GLOBAL = [
      { key:'starter_g',  credits:50,  amount:2.99,  label:'Starter',  badge:null },
      { key:'standard_g', credits:120, amount:5.99,  label:'Standard', badge:'Popular' },
      { key:'premium_g',  credits:300, amount:12.99, label:'Premium',  badge:'Best' },
      { key:'pro_g',      credits:700, amount:24.99, label:'Pro',      badge:null },
    ];
    const pkgs = isKorea ? PACKAGES_KR : PACKAGES_GLOBAL;
    const fmt  = (amt) => isKorea ? amt.toLocaleString('ko-KR') + '원' : '$' + amt.toFixed(2);

    const [activeTab, setActiveTab]  = useS('credits');    // 'credits' | 'plans'
    const [selected, setSelected]   = useS(pkgs[1].key); // 표준 기본선택
    const [loading,  setLoading]    = useS(false);
    const [errMsg,   setErrMsg]     = useS('');
    const [billingCycle, setBillingCycle] = useS('monthly'); // 'monthly' | 'annual'
    const selPkg = pkgs.find(p => p.key === selected);

    const handlePay = async () => {
      if (!currentUser) { onClose(); setView('memberLogin'); return; }
      setLoading(true); setErrMsg('');
      let lastOrderId = '';  // catch에서 토스 로그 대조용 주문번호를 쓰기 위해 밖으로 뺌
      try {
        if (isKorea) {
          // 토스페이먼츠 v1 결제창(카드 팝업) — 표준 클라이언트키(ck) 사용. 상점에 ck 키가 있어 원래 방식 유지.
          const res = await api.tossCheckout(selected);
          if (!res.success) { setErrMsg(res.error || t('결제 준비 실패','Payment preparation failed')); setLoading(false); return; }
          const d = res.data;
          lastOrderId = d.orderId || '';
          if (typeof window.TossPayments !== 'function') {
            setErrMsg(t('결제 SDK 로드 실패. 페이지를 새로고침(Ctrl+Shift+R) 후 다시 시도해주세요.', 'Payment SDK failed to load. Please hard-refresh and try again.'));
            setLoading(false); return;
          }
          const tossPayments = window.TossPayments(d.clientKey);
          await tossPayments.requestPayment('카드', {
            amount:        d.amount,
            orderId:       d.orderId,
            orderName:     d.orderName,
            customerName:  d.customerName,
            customerEmail: d.customerEmail,
            successUrl:    d.successUrl,
            failUrl:       d.failUrl,
          });
        } else {
          // 스트라이프 — checkoutUrl로 리다이렉트
          const res = await api.prepareCharge(selected, 'stripe');
          if (!res.success) { setErrMsg(res.error || t('결제 준비 실패','Payment preparation failed')); setLoading(false); return; }
          const d = res.data;
          if (d.checkoutUrl) window.location.href = d.checkoutUrl;
        }
      } catch (err) {
        // 토스 에러 객체의 모든 필드를 콘솔에 남긴다(비열거 속성 포함) — 원인 파악용.
        try { console.error('[Toss] 결제 에러 전체:', JSON.stringify(err, Object.getOwnPropertyNames(err || {})), err); }
        catch { console.error('[Toss] 결제 에러:', err); }
        // 사용자 취소는 오류로 표시하지 않는다.
        if (err?.code !== 'USER_CANCEL' && err?.code !== 'USER_CANCEL_PAYMENT') {
          const code = err?.code || 'UNKNOWN';
          const msg  = err?.message || t('알 수 없는 오류','Unknown error');
          const oid  = lastOrderId ? (t(' · 주문번호 ',' · order ') + lastOrderId) : '';
          // 토스가 준 코드·메시지를 그대로 노출(다음 디버깅 시 DevTools 없이 원인 확인).
          setErrMsg(t(`결제 오류 [${code}] ${msg}${oid}`, `Payment error [${code}] ${msg}${oid}`));
        }
        setLoading(false);
      }
    };

    const F = "'Noto Sans KR',sans-serif";

    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background:'white', borderRadius:22, maxWidth:420, width:'100%',
          boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden', fontFamily:F,
          display:'flex', flexDirection:'column', maxHeight:'92vh' }}>

          {/* 헤더 */}
          <div style={{ background:'linear-gradient(135deg,#2D6A4F,#40916C)', padding:'22px 24px', color:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>{t("현재 잔액","Balance")}</div>
                <div style={{ fontSize:28, fontWeight:800 }}>✦ {credits}</div>
                <div style={{ fontSize:12, opacity:0.75, marginTop:2 }}>{t("크레딧","credits")}</div>
              </div>
              <button onClick={onClose}
                style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8,
                  width:32, height:32, cursor:'pointer', color:'white', fontSize:18, display:'flex',
                  alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ marginTop:14, fontSize:12, opacity:0.85,
              background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 12px', display:'inline-block' }}>
              {isKorea
                ? t("필요한 것만 단품으로 구매하세요 · 무료검사(PHQ-9·GAD-7)는 그대로 무료","Buy only what you need · Free tests (PHQ-9·GAD-7) stay free")
                : t("심리검사 1회 = 10 크레딧 · AI 채팅 1회 = 2 크레딧","Assessment = 10 cr · AI chat = 2 cr")}
            </div>
          </div>

          {/* 탭 */}
          <div style={{ display:'flex', borderBottom:'1px solid #E5E7EB' }}>
            {(isKorea ? [['credits',t('🛒 상품 구매','🛒 Shop')]] : [['credits',t('✦ 크레딧 구매','✦ Top Up')],['plans',t('💎 멤버십 플랜','💎 Plans')]]).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  flex:1, padding:'12px', border:'none', cursor:'pointer', fontFamily:F,
                  fontSize:13, fontWeight:700, background:'white',
                  color: activeTab===tab ? '#2D6A4F' : '#9CA3AF',
                  borderBottom: activeTab===tab ? '2px solid #2D6A4F' : '2px solid transparent',
                  transition:'all 0.15s',
                }}>{label}</button>
            ))}
          </div>

          <div style={{ padding:'20px 24px 24px', maxHeight:'65vh', overflowY:'auto' }}>

            {/* ── 크레딧 충전 탭 ── */}
            {activeTab === 'credits' && (<>
              <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:12 }}>{t(isKorea?'상품 선택':'패키지 선택', isKorea?'Select a Product':'Select a Package')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:18 }}>
                {pkgs.map(pkg => {
                  const isSel = selected === pkg.key;
                  const perCredit = isKorea
                    ? Math.round(pkg.amount / pkg.credits) + '원/cr'
                    : ('$' + (pkg.amount / pkg.credits).toFixed(2) + '/cr');
                  return (
                    <button key={pkg.key} onClick={() => setSelected(pkg.key)}
                      style={{ position:'relative', padding:'12px', border:'2px solid',
                        borderColor: isSel ? '#2D6A4F' : 'rgba(0,0,0,0.1)',
                        borderRadius:13, cursor:'pointer', background: isSel ? '#F0FAF4' : 'white',
                        textAlign:'left', transition:'all 0.15s', fontFamily:F }}>
                      {pkg.badge && (
                        <div style={{ position:'absolute', top:-8, right:8,
                          background: isSel ? '#2D6A4F' : '#F59E0B',
                          color:'white', fontSize:9, fontWeight:800,
                          padding:'2px 7px', borderRadius:20 }}>{pkg.badge}</div>
                      )}
                      {isKorea ? (<>
                        <div style={{ fontSize:12.5, fontWeight:800, color: isSel ? '#2D6A4F' : '#374151',
                          marginBottom:3 }}>{pkg.label}</div>
                        <div style={{ fontSize:11, color:'#6B7280', marginBottom:8, minHeight:30, lineHeight:1.35 }}>{pkg.desc}</div>
                        <div style={{ fontSize:18, fontWeight:800, color: isSel ? '#2D6A4F' : '#111' }}>{fmt(pkg.amount)}</div>
                      </>) : (<>
                        <div style={{ fontSize:12, fontWeight:700, color: isSel ? '#2D6A4F' : '#374151',
                          marginBottom:3 }}>{pkg.label}</div>
                        <div style={{ fontSize:20, fontWeight:800,
                          color: isSel ? '#2D6A4F' : '#111' }}>✦ {pkg.credits}</div>
                        <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>{perCredit}</div>
                        <div style={{ fontSize:14, fontWeight:700, color: isSel ? '#2D6A4F' : '#374151',
                          marginTop:5 }}>{fmt(pkg.amount)}</div>
                      </>)}
                    </button>
                  );
                })}
              </div>
              {selPkg && (
                <div style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 16px',
                  marginBottom:10, border:'1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6B7280' }}>
                    <span>{selPkg.label}{isKorea ? (selPkg.desc ? ' · ' + selPkg.desc : '') : (' · ✦ ' + selPkg.credits + ' ' + t("크레딧","cr"))}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'#111', fontSize:15 }}>
                        {fmt(selPkg.amount)}
                        <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:400, marginLeft:4 }}>({t("VAT 포함","incl. VAT")})</span>
                      </div>
                      {isKorea && (
                        <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>
                          {t("공급가","Net")} {Math.round(selPkg.amount / 1.1).toLocaleString('ko-KR')}원 + {t("부가세","VAT")} {Math.round(selPkg.amount - selPkg.amount / 1.1).toLocaleString('ko-KR')}원
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop:6, fontSize:11, color:'#9CA3AF' }}>
                    {t(`구매 후 잔액: ✦ ${credits + selPkg.credits} 크레딧 · 검사 ${Math.floor((credits + selPkg.credits) / 10)}회 가능`,
                       `After purchase: ✦ ${credits + selPkg.credits} cr · ${Math.floor((credits + selPkg.credits) / 10)} assessments`)}
                  </div>
                </div>
              )}

              {/* 결제 전 법적 고지 (전자상거래법 제17조 제2항) */}
              <div style={{ background:'#FEF9EC', border:'1px solid #FDE68A', borderRadius:10,
                padding:'11px 14px', marginBottom:10, fontSize:11, color:'#78350F', lineHeight:1.8 }}>
                <div style={{ fontWeight:700, marginBottom:4, color:'#92400E' }}>⚠ {t("결제 전 확인하세요","Before you pay")}</div>
                <ul style={{ margin:0, paddingLeft:14 }}>
                  {t(<li>크레딧을 <strong>1개라도 사용한 경우</strong> 청약철회가 제한됩니다. (전자상거래법 제17조 제2항 제5호)</li>,
                     <li>Refunds are restricted once <strong>any credit is used</strong>. (Korean E-commerce Act §17②⑤)</li>)}
                  {t(<li>미사용 크레딧은 구매일로부터 <strong>7일 이내</strong> 전액 환불 가능합니다.</li>,
                     <li>Unused credits are fully refundable within <strong>7 days</strong> of purchase.</li>)}
                  {/* TODO: PG 정식 승인 후 삭제 — 한시적 유효기간 안내 문구 */}
                  {t(<li>구매한 크레딧은 구매일로부터 <strong>1년간 유효</strong>합니다.</li>,
                     <li>Charged credits are valid for <strong>1 year</strong> from the date of purchase.</li>)}
                  {isKorea && t(<li>결제 시 이메일·결제금액이 <strong>토스페이먼츠(주)</strong>에 제공됩니다. (결제 처리 목적)</li>,
                                <li>Your email and payment amount will be shared with <strong>TossPayments</strong> for processing.</li>)}
                  <li>{t("환불 문의:","Refund inquiries:")} support@maumful.com</li>
                </ul>
              </div>


            </>)}

            {/* ── 멤버십 플랜 탭 ── */}
            {activeTab === 'plans' && (<>
<div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                <div style={{ background:'#F3F4F6', borderRadius:12, padding:3, display:'inline-flex', gap:2 }}>
                  {[['monthly',t('월간','Monthly')],['annual',t('연간 🎉 20% 할인','Annual 🎉 20% off')]].map(([cyc, lbl]) => (
                    <button key={cyc} onClick={() => setBillingCycle(cyc)} style={{
                      padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:F,
                      background: billingCycle===cyc ? 'white' : 'transparent',
                      color: billingCycle===cyc ? '#1F2937' : '#9CA3AF',
                      boxShadow: billingCycle===cyc ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
              {[
                {
                  name: t('마음풀 Plus','Maumful Plus'), priceKrw: 5900, priceUsd: 5.99,
                  color: '#2D6A4F', colorL: '#F0FAF4', emoji: '🧠',
                  features: [t('월 100 크레딧 지급','100 credits/month'), t('AI 채팅 무제한','Unlimited AI chat'), t('검사 이력 무제한 보관','Unlimited history'), t('우선 고객 지원','Priority support')],
                },
                {
                  name: t('마음커플 Plus','MaumCouple Plus'), priceKrw: 9900, priceUsd: 9.99,
                  color: '#B5556A', colorL: '#FCF0F3', emoji: '💕',
                  features: [t('월 150 크레딧 지급','150 credits/month'), t('월 1회 커플 리포트 포함','1 couple report/month'), t('AI 관계 코치 무제한','Unlimited AI relationship coach'), t('데이트 코스 무제한','Unlimited date courses')],
                },
                {
                  name: t('마음가족 플랜','Maumful Family'), priceKrw: 14900, priceUsd: 14.99,
                  color: '#7C3AED', colorL: '#F5F3FF', emoji: '👨‍👩‍👧‍👦',
                  features: [t('최대 4인 가족 계정 공유','Up to 4 family members'), t('월 500 크레딧 공유','500 shared credits/month'), t('AI 채팅 가족 전원 이용','AI chat for all members'), t('월 1회 가족 심리 리포트','1 family wellness report/month'), t('검사 이력 무제한 보관','Unlimited history')],
                },
              ].map(plan => {
                const isAnnual = billingCycle === 'annual';
                const monthlyKrw = isAnnual ? Math.round(plan.priceKrw * 0.8) : plan.priceKrw;
                const monthlyUsd = isAnnual ? Math.round(plan.priceUsd * 0.8 * 100) / 100 : plan.priceUsd;
                const priceLabel = isKorea
                  ? `월 ${monthlyKrw.toLocaleString('ko-KR')}원`
                  : `$${monthlyUsd.toFixed(2)}/mo`;
                const billingLabel = isAnnual
                  ? (isKorea ? `연 ${(monthlyKrw*12).toLocaleString('ko-KR')}원 ${t('일시결제','billed annually')}` : `$${(monthlyUsd*12).toFixed(2)}/yr`)
                  : t('월 자동 결제','billed monthly');
                return (
                <div key={plan.name} style={{
                  borderRadius:16, border:`2px solid ${plan.color}22`,
                  marginBottom:14, overflow:'hidden', fontFamily:F,
                }}>
                  <div style={{ background:`linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`,
                    padding:'14px 18px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:11, opacity:0.85, marginBottom:2 }}>{plan.emoji} {t("구독 플랜","Subscription")}</div>
                      <div style={{ fontSize:17, fontWeight:800 }}>{plan.name}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:18, fontWeight:800 }}>{priceLabel}</div>
                      <div style={{ fontSize:10, opacity:0.8, marginTop:2 }}>{billingLabel}</div>
                      {isAnnual && (
                        <div style={{ fontSize:10, background:'rgba(255,255,255,0.25)', borderRadius:6, padding:'1px 6px', marginTop:3 }}>
                          {isKorea ? `월 ${plan.priceKrw.toLocaleString()}원 대비 20% 절약` : `vs $${plan.priceUsd}/mo save 20%`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ background:plan.colorL, padding:'12px 18px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize:13, color:'#374151', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:plan.color, fontWeight:700 }}>✓</span> {f}
                      </div>
                    ))}
                    <button onClick={async () => {
                      const email = currentUser?.email || '';
                      if (!email) { alert(t('로그인 후 관심 등록이 가능합니다.','Please sign in to register your interest.')); return; }
                      await api._fetch('/api/credits/notify-plan', { method:'POST',
                        body: JSON.stringify({ plan: plan.name, email }) });
                      alert(t(`${plan.name} 오픈 알림을 신청했습니다! 준비되면 이메일로 알려드릴게요 🎉`,`You're on the waitlist for ${plan.name}! We'll email you when it's ready 🎉`));
                    }} style={{
                      marginTop:10, width:'100%', padding:'10px', borderRadius:10,
                      background:plan.color, color:'white', border:'none', cursor:'pointer',
                      fontSize:13, fontWeight:700, fontFamily:F,
                    }}>
                      {t('🔔 오픈 알림 신청','🔔 Notify Me')}
                    </button>
                  </div>
                </div>
              ); })}
              <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4, lineHeight:1.8 }}>
                <div>{t('* 구독 플랜은 토스페이먼츠 심사 완료 후 정식 출시됩니다','* Subscription plans will launch after payment provider review is complete')}</div>
                <div>{t('* 모든 금액은 부가가치세(VAT 10%) 포함 가격입니다','* All prices include VAT (10%)')}</div>
                <div>{t('* 만 19세 미만 미성년자의 구독 결제는 법정대리인 동의가 필요합니다 (민법 제5조)','* Minors under 19 require parental consent for subscription purchases')}</div>
              </div>
            </>)}
          </div>

          {/* 결제 버튼 — 크레딧 탭 전용 고정 푸터 */}
          {activeTab === 'credits' && (
            <div style={{ padding:'14px 24px 20px', borderTop:'1px solid #E5E7EB' }}>
              {errMsg && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10,
                  padding:'10px 14px', marginBottom:10, fontSize:12, color:'#DC2626' }}>
                  {errMsg}
                </div>
              )}
              <button onClick={PAYMENT_LIVE ? handlePay : undefined} disabled={!PAYMENT_LIVE || loading || !selPkg}
                style={{ width:'100%', padding:'14px', borderRadius:13, border:'none',
                  cursor: !PAYMENT_LIVE ? 'not-allowed' : (loading||!selPkg ? 'default' : 'pointer'),
                  background: !PAYMENT_LIVE ? '#E5E7EB' : (loading||!selPkg ? '#D1FAE5' : 'linear-gradient(135deg,#2D6A4F,#40916C)'),
                  color: !PAYMENT_LIVE ? '#9CA3AF' : 'white', fontSize:15, fontWeight:800, fontFamily:F,
                  opacity: !PAYMENT_LIVE ? 1 : (loading||!selPkg ? 0.7 : 1) }}>
                {!PAYMENT_LIVE
                  ? t('🔧 결제 준비 중입니다', '🔧 Payment coming soon')
                  : loading
                    ? t('결제 준비 중...', 'Processing...')
                    : selPkg
                      ? (isKorea
                          ? t(`${selPkg.label} 결제하기`, `Pay · ${selPkg.label}`)
                          : t(`${selPkg.label} · ✦ ${selPkg.credits} 크레딧 결제하기`, `Pay · ✦ ${selPkg.credits} Credits`))
                      : t('패키지를 선택하세요', 'Select a package')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 결과 화면에서 대시보드로 돌아가는 버튼 처리 (기존 코드가 isCounselor/isAdmin 체크)
  // → setView('memberDashboard') 로 리디렉션



  // ⏱️ 남은 시간 계산 (밀리초 → 시:분:초)
  function getTimeRemaining(createdAt) {
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const elapsed = now - createdTime;
    const remaining = TWENTY_FOUR_HOURS - elapsed;
    
    if (remaining <= 0) {
      return { expired: true, text: "만료됨", color: "text-red-600" };
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    let color = "text-green-600";
    if (hours < 3) color = "text-red-600";
    else if (hours < 6) color = "text-orange-600";
    
    return {
      expired: false,
      text: `${hours}시간 ${minutes}분 ${seconds}초`,
      color: color,
      hours: hours
    };
  }

  // 💾 JSON 파일로 검사 결과 다운로드
  function downloadSessionJson(sessionId) {
    const r = storage.get("session_" + sessionId);
    if (!r) {
      alert('❌ 검사 결과를 찾을 수 없습니다.');
      return;
    }
    
    const sessionData = JSON.parse(r.value);
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `검사결과_${sessionData.testType}_${sessionId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 JSON 다운로드:', sessionId);
    alert('✅ 검사 결과가 JSON 파일로 다운로드되었습니다!');
  }

  // 📂 JSON 파일에서 검사 결과 불러오기
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sessionData = JSON.parse(e.target.result);
        console.log('📂 JSON 파일 로드:', sessionData.sessionId);
        
        // 세션 데이터 복원
        if (sessionData.testType === "SCT") {
          setSrciResponses(sessionData.responses?.byScale ? {} : (sessionData.responses || {}));
          setSctSummaries(sessionData.summaries || {});
        } else if (sessionData.testType === "DSI") {
          setSdriResponses((sessionData.responses?.likert) || {});
          setDsiRec(sessionData.recommendation || "");
        }
        
        setSessionId(sessionData.sessionId);
        setUserInfo({ phone: sessionData.userPhone || "", password: "" });
        setView("sctResult");
        
        alert(`✅ ${sessionData.testType} 검사 결과를 불러왔습니다!\n세션 ID: ${sessionData.sessionId}`);
      } catch (error) {
        console.error('❌ JSON 파싱 오류:', error);
        alert('❌ 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  }

  function copyLink(linkId) {
    const text = linkId;
    try {
      navigator.clipboard.writeText(text).then(() => {
        
      }).catch(() => fallbackCopy(linkId, text));
    } catch {
      fallbackCopy(linkId, text);
    }
  }
  
  function fallbackCopy(linkId, text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    
  }

  // jsPDF async 로드 대기 (최대 8초)
  function waitForJsPDF() {
    if (window.jspdf) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      const id = setInterval(() => {
        if (window.jspdf) { clearInterval(id); resolve(); }
        else if (Date.now() - t0 > 8000) { clearInterval(id); reject(new Error('jsPDF 로드 시간 초과')); }
      }, 100);
    });
  }

  // 📄 PDF 생성 함수들
  async function generateSctPdf(sessionData) {
    try {
      console.log('📄 SRCI PDF 생성 시작...');
      await waitForJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 한글 폰트 설정 (기본 폰트 사용)
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // 헤더 (영문만 사용)
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('SRCI 자기반응 완성 검사 결과', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Sentence Completion Test', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // 기본 정보
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 1. Basic Information ]', margin, yPos);
      yPos += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Session ID: ${sessionData.sessionId}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Test Date: ${new Date(sessionData.createdAt).toLocaleDateString('en-US')}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Phone: ${sessionData.userPhone || 'N/A'}`, margin + 5, yPos);
      yPos += 10;

      // 카테고리별 응답 (AI 분석은 제외 - 한글 문제)
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 2. Responses by Category ]', margin, yPos);
      yPos += 8;

      // 카테고리 이름 영문 매핑
      const categoryMap = {
        "어머니에 대한 태도": "Attitude toward Mother",
        "아버지에 대한 태도": "Attitude toward Father",
        "가족 관계": "Family Relationships",
        "이성 관계": "Romantic Relationships",
        "친구 관계": "Friendships",
        "권위자에 대한 태도": "Attitude toward Authority",
        "두려움": "Fears",
        "죄책감": "Guilt",
        "능력에 대한 인식": "Perception of Abilities",
        "과거": "Past",
        "미래": "Future",
        "목표": "Goals"
      };

      for (const cat of sctCategories) {
        // 페이지 넘김 체크
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }

        const englishCatName = categoryMap[cat.name] || cat.name;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${cat.emoji} ${englishCatName}`, margin + 5, yPos);
        yPos += 7;

        const catQs = sdriCompletionQ.filter(q => q.scale === cat);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        for (const q of catQs) {
          const answer = sessionData.responses[q.num] || '(No answer)';
          
          // 질문 (한글 제목 제외, 번호만)
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }
          
          doc.text(`Q${q.num}:`, margin + 10, yPos);
          yPos += 5;
          
          // 답변 (영문/숫자만 표시)
          const answerText = `Answer: ${answer}`;
          doc.setTextColor(0, 102, 204);
          doc.text(answerText, margin + 10, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 7;
        }

        // AI 분석은 한글 문제로 제외
        yPos += 5;
      }

      // 푸터
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated: ${new Date().toLocaleDateString('en-US')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // 다운로드
      const fileName = `SCT_Report_${sessionData.sessionId}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      console.log('✅ SRCI PDF 생성 완료:', fileName);
      alert('✅ SCT PDF downloaded successfully!');
    } catch (error) {
      console.error('❌ PDF 생성 실패:', error);
      alert('❌ PDF generation failed: ' + error.message);
    }
  }

  async function generateDsiPdf(sessionData) {
    try {
      console.log('📄 SDRI PDF 생성 시작...');
      await waitForJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // 임시로 응답 복원
      const tempDsiResponses = sessionData.responses;
      
      // 점수 계산
      let total = 0;
      const areas = { "가족불화": 0, "부모관계": 0, "형제관계": 0, "가족퇴행": 0, "투사": 0 };
      sdriLikertQ.forEach(q => {
        const r = tempDsiResponses[q.num];
        if (r) {
          const s = q.rev ? 6 - r : r;
          total += s;
          areas[q.area] += s;
        }
      });

      // 헤더 (영문만 사용)
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('SDRI 자기분화 반응성 검사 결과', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Differentiation of Self Inventory', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // 기본 정보
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 1. Basic Information ]', margin, yPos);
      yPos += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Session ID: ${sessionData.sessionId}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Test Date: ${new Date(sessionData.createdAt).toLocaleString('en-US')}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Phone: ${sessionData.userPhone || 'N/A'}`, margin + 5, yPos);
      yPos += 12;

      // 종합 점수
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 2. Overall Score ]', margin, yPos);
      yPos += 8;

      const level = total >= 109 ? 'High' : total >= 73 ? 'Medium' : 'Low';
      const levelColor = total >= 109 ? [76, 175, 80] : total >= 73 ? [255, 193, 7] : [255, 87, 87];

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Score: ${total} / 180`, margin + 5, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...levelColor);
      doc.text(`Level: ${level}`, margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      // 영역별 점수
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 3. Area Scores ]', margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      // 영역 이름을 영문으로 매핑
      const areaNameMap = {
        "가족불화": "Family Conflict",
        "부모관계": "Parent Relationship", 
        "형제관계": "Sibling Relationship",
        "가족퇴행": "Family Regression",
        "투사": "Projection"
      };

      const areaNames = Object.keys(areas);
      for (const areaName of areaNames) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        const score = areas[areaName];
        const areaQs = sdriLikertQ.filter(q => q.scale === areaName);
        const maxScore = areaQs.length * 5;
        const avgScore = (score / areaQs.length).toFixed(1);
        const englishName = areaNameMap[areaName] || areaName;

        doc.text(`${englishName}: ${score}/${maxScore} (Avg: ${avgScore})`, margin + 5, yPos);
        
        // 진행 바
        const barWidth = 100;
        const barHeight = 4;
        const fillWidth = (score / maxScore) * barWidth;
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(margin + 60, yPos - 3, barWidth, barHeight);
        
        doc.setFillColor(...levelColor);
        doc.rect(margin + 60, yPos - 3, fillWidth, barHeight, 'F');
        
        yPos += 8;
      }

      yPos += 5;

      // 상세 응답
      doc.addPage();
      yPos = margin;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('[ 4. Detailed Responses ]', margin, yPos);
      yPos += 8;

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');

      for (const q of sdriLikertQ) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }

        const answer = tempDsiResponses[q.num] || 'N/A';
        const scoreText = q.rev ? `(Reversed, Score: ${6 - parseInt(answer)})` : `(Score: ${answer})`;
        const englishArea = areaNameMap[q.area] || q.area;
        
        const questionText = `Q${q.num}. [${englishArea}]`;
        doc.text(questionText, margin + 5, yPos);
        yPos += 4;
        
        doc.setTextColor(0, 102, 204);
        doc.text(`Answer: ${answer} ${scoreText}`, margin + 5, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }

      // AI 권장사항은 한글 지원 문제로 PDF에서 제외
      // 웹 화면에서 확인 가능

      // 푸터
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated: ${new Date().toLocaleDateString('en-US')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // 다운로드
      const fileName = `DSI_Report_${sessionData.sessionId}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      console.log('✅ SDRI PDF 생성 완료:', fileName);
      alert('✅ DSI PDF downloaded successfully!');
    } catch (error) {
      console.error('❌ PDF 생성 실패:', error);
      alert('❌ PDF generation failed: ' + error.message);
    }
  }

  function copyLink(linkId) {
    const text = linkId;
    try {
      navigator.clipboard.writeText(text).then(() => {
        
      }).catch(() => fallbackCopy(linkId, text));
    } catch {
      fallbackCopy(linkId, text);
    }
  }
  
  function fallbackCopy(linkId, text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    
  }

  function enterByLinkId() {
    const id = linkInput.trim();
    if (!id) {
      setLoginMsg({ type: "error", text: "링크 ID를 입력해주세요." });
      return;
    }
    const data = loadLink(id);
    if (!data) {
      setLoginMsg({ type: "error", text: "유효하지 않은 링크 ID입니다. 상담사에게 다시 확인하세요." });
      return;
    }
    setActiveLinkId(id);
    setActiveLinkData(data);
    setLoginMsg({ type: "", text: "" });
    setView("clientLogin");
  }

  function clientLogin() {
    if (!userInfo.phone || !userInfo.password) {
      setLoginMsg({ type: "error", text: "전화번호와 비밀번호를 모두 입력해주세요." });
      return;
    }
    if (!activeLinkData) {
      setLoginMsg({ type: "error", text: "링크 정보가 없습니다." });
      return;
    }
    const inp = userInfo.phone.replace(/-/g, "");
    const reg = activeLinkData.clientPhone.replace(/-/g, "");
    if (inp !== reg) {
      setLoginMsg({ type: "error", text: "등록된 전화번호와 일치하지 않습니다." });
      return;
    }
    setLoginMsg({ type: "", text: "" });
    setSrciResponses({});
    setSctSummaries({});
    setSdriResponses({});
    setPhq9Responses({});
    setGad7Responses({});
    setDass21Responses({});
    setBig5Responses({});
    setBurnoutResponses({});
    setSessionId(genId("session"));
    setMultiSessionIds([]);
    
    // 멀티 검사 큐 초기화 (testTypes 배열 우선, 없으면 testType 단일 사용)
    const tests = activeLinkData.testTypes && activeLinkData.testTypes.length > 0
      ? activeLinkData.testTypes
      : [activeLinkData.testType || "SCT"];
    setPendingTests(tests);
    setCurrentTestIndex(0);
    
    // 첫 번째 검사 화면으로 이동
    const testViews = {
      "SCT": "sctTest", "DSI": "dsiTest", "PHQ9": "phq9Test",
      "GAD7": "gad7Test", "DASS21": "dass21Test", "BIG5": "big5Test",
      "BURNOUT": "burnoutTest", "LOST": "lostTest", "RIASEC": "riasecTest", "VALUES": "valuesTest"
    };
    setView(testViews[tests[0]] || "sctTest");
  }



  // 💬 AI 상담 채팅 함수
  // 검사 결과 요약 텍스트 생성 (채팅 컨텍스트용)
  function buildTestSummary(testType) {
    const en = lang === 'en';
    try {
      if (testType === 'SCT') {
        const { filled, byScale } = calcSrci();
        const sample = Object.entries(byScale).map(([s,items]) => `[${s}] ${items.slice(0,1).map(a=>a.answer).join(' / ')}`).join('\n');
        return en
          ? `SRCI Self-Response Completion (${filled}/25 completed)\n${sample}`
          : `SRCI 자기반응 완성검사 (완성 ${filled}/25)\n${sample}`;
      }
      if (testType === 'DSI') {
        const { scales, total } = calcSdri();
        const scalesStr = Object.entries(scales).map(([k,v])=>`${k}: ${v}`).join(', ');
        return en
          ? `SDRI Self-Differentiation total: ${total}\n${scalesStr}`
          : `SDRI 자기분화 반응성 검사 총점: ${total}점\n${scalesStr}`;
      }
      if (testType === 'PHQ9') {
        const r = calcPhq9();
        return en
          ? `PHQ-9 total: ${r.total}/27 (${r.level})`
          : `PHQ-9 총점: ${r.total}/27 (${r.level})`;
      }
      if (testType === 'GAD7') {
        const r = calcGad7();
        return en
          ? `GAD-7 total: ${r.total}/21 (${r.level})`
          : `GAD-7 총점: ${r.total}/21 (${r.level})`;
      }
      if (testType === 'DASS21') {
        const r = calcDass21();
        return en
          ? `DASS-21 — Depression:${r.depression.score}(${r.depression.level}), Anxiety:${r.anxiety.score}(${r.anxiety.level}), Stress:${r.stress.score}(${r.stress.level})`
          : `DASS-21 — 우울:${r.depression.score}(${r.depression.level}), 불안:${r.anxiety.score}(${r.anxiety.level}), 스트레스:${r.stress.score}(${r.stress.level})`;
      }
      if (testType === 'BIG5') {
        const r = calcBig5();
        const factors = Object.entries(r).map(([k,v]) => `${k}:${v}`).join(', ');
        return en
          ? `Big Five personality: ${factors}`
          : `Big5 성격검사: ${factors}`;
      }
      if (testType === 'BURNOUT') {
        const r = calcBurnout();
        return en
          ? `K-MBI+ Burnout: ${r.totalScore}/240 (${r.percentage}%)`
          : `K-MBI+ 번아웃: ${r.totalScore}/240 (${r.percentage}%, ${r.level})`;
      }
      if (testType === 'LOST') {
        const r = calcLost();
        const axisLabel = en
          ? { E:"Energy",D:"Decision",S:"Speed",N:"Stability",R:"Relation",T:"Stress" }
          : { E:"에너지",D:"의사결정",S:"행동속도",N:"안정성",R:"관계민감도",T:"스트레스반응" };
        const axisText = Object.entries(r.axisAvg).map(([k,v]) => `${axisLabel[k]}:${Number(v).toFixed(1)}`).join(', ');
        return en
          ? `LOST type: ${r.typeCode} (${r.typeInfo?.eng || r.typeInfo?.name})\nAxes: ${axisText}`
          : `LOST 행동유형: ${r.typeCode} (${r.typeInfo?.name})\n축별: ${axisText}`;
      }
      if (testType === 'RIASEC') {
        const { sorted, dominantType } = calcRiasec();
        const top2 = sorted.slice(0,2).map(([k,s]) => `${k}:${s}`).join(', ');
        return en
          ? `Holland RIASEC dominant type: ${dominantType} (top2: ${top2})`
          : `Holland RIASEC 우세 유형: ${dominantType}형 (상위2: ${top2})`;
      }
      if (testType === 'VALUES') {
        const { sorted } = calcValues();
        const top3 = sorted.slice(0,3).map(([k,s]) => `${VALUES_DOMAIN_INFO[k]?.label || k}:${s}`).join(', ');
        return en
          ? `Work Values top 3: ${top3}`
          : `직업가치관 상위 3: ${top3}`;
      }
      if (testType === 'GENERAL' || !testType) {
        return en ? 'General counseling (no test result)' : '일반 AI 상담 (검사 결과 없음)';
      }
    } catch(e) {
      return en ? 'Assessment result' : '검사 결과';
    }
    return en ? 'Assessment result' : '검사 결과';
  }

  // 채팅 전송 함수
  async function sendChatMessage(testType) {
    const input = chatInput.trim();
    if (!input || chatStreaming) return;

    const counselingType = activeLinkData?.counselingType || 'psychological';
    const summary = buildTestSummary(testType);
    const userMsg = { role: 'user', content: input, id: Date.now() };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatStreaming(true);
    setChatError('');

    const assistantId = Date.now() + 1;
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);

    try {
      await api.ensureToken();   // ⚠️ 만료 토큰이면 서버가 게스트로 강등→429. 전송 전 갱신.
      const history = [...chatMessages.filter(m => m.content && m.content.trim() && !m.streaming), userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() }));
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({
          messages: history,
          testContext: { testType, counselingType, summary, lang }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
          setChatStreaming(false);
          setShowCreditModal(true);
          return;
        }
        if (res.status === 429) {
          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
          setChatStreaming(false);
          setAiChatUsed(AI_LIMIT_FREE);
          setShowAiLimitModal(true);
          return;
        }
        throw new Error(err.error || '서버 오류');
      }

      refreshCredits();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setChatMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullText } : m
              ));
            }
          } catch {}
        }
      }
      const moodMatch2 = fullText.match(/\[MOOD:(\d+)\]/);
      const moodScore2 = moodMatch2 ? parseInt(moodMatch2[1], 10) : null;
      const cleanText2 = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, '').trimEnd();
      incrementAiChatUsed();
      setChatMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: cleanText2, streaming: false } : m
      ));
      if (moodScore2 !== null && isLoggedIn) {
        api._fetch('/api/chat/mood-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moodScore: moodScore2, testType }) }).catch(() => {});
      }
    } catch(e) {
      setChatError(e.message || 'AI 채팅 중 오류가 발생했습니다.');
      setChatMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setChatStreaming(false);
    }
  }

  // 채팅 초기화
  function resetChat() {
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setChatStreaming(false);
  }

  // 채팅창 컴포넌트
  // 채팅 메시지 마크다운 렌더러 (bold, bullet)
  function renderMdText(text) {
    const parseBold = (str) => str.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
      /^\*\*[^*]+\*\*$/.test(p)
        ? <strong key={j} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>
        : p
    );
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      if (/^[-•]\s/.test(line)) return (
        <div key={i} className="flex gap-1.5 items-start mt-1">
          <span className="text-green-500 font-bold shrink-0 leading-5">•</span>
          <span className="leading-5">{parseBold(line.replace(/^[-•]\s/, ''))}</span>
        </div>
      );
      return <div key={i} className="leading-5">{parseBold(line)}</div>;
    });
  }

  function ChatBox({ testType, initialPrompts }) {
    // C: 이 검사 해석에서 나온 후속 질문을 빠른질문 앞에 병합(개인화). 없으면 기존 그대로.
    const quickPrompts = [...(followupQs[testType] || []), ...(initialPrompts || [])];
    const messagesEndRef = React.useRef(null);
    const chatContainerRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const prevMsgCountRef = React.useRef(0);
    const [isListening, setIsListening] = React.useState(false);
    const [hasMemory, setHasMemory] = React.useState(false);
    const [speakingMsgId, setSpeakingMsgId] = React.useState(null);
    // ── 핸즈프리 음성 상담 모드 (추가 기능 — 기존 음성 입출력은 그대로) ──
    const [voiceMode, setVoiceMode] = React.useState(false);
    const voiceModeRef = React.useRef(false);
    const voiceRecRef = React.useRef(null);
    const sendBtnRef = React.useRef(null);
    const streamingRef = React.useRef(false);
    const speakingRef = React.useRef(false);
    const lastSpokenRef = React.useRef(null);
    const lastSpokenTextRef = React.useRef('');   // 방금 AI가 말한 텍스트(에코 필터용)
    React.useEffect(() => { streamingRef.current = chatStreaming; }, [chatStreaming]);
    React.useEffect(() => { speakingRef.current = (speakingMsgId !== null); }, [speakingMsgId]);

    // 이전 대화 기억 여부 확인
    React.useEffect(() => {
      if (!isLoggedIn) return;
      // ⚠️ 직접 fetch라 _fetch의 401 자동 refresh를 안 탄다 → 만료 토큰이면 401. 전송 전 토큰 보장.
      api.ensureToken()
        .then(() => fetch('/api/ai-chat/memory', { headers: api._authHeader() }))
        .then(r => r.json())
        .then(d => {
          if (d.success && d.memories) {
            const key = testType || 'GENERAL';
            setHasMemory(!!(d.memories[key] || d.memories['GENERAL']));
          }
        }).catch(() => {});
    }, [testType]);

    async function clearMemory() {
      await api.ensureToken();   // 만료 토큰이면 401 → 삭제 실패. 전송 전 갱신.
      await fetch('/api/ai-chat/memory', { method: 'DELETE', headers: api._authHeader() });
      setHasMemory(false);
    }

    function speakText(text, msgId) {
      if (!window.speechSynthesis) return;
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#`_~>]/g, '').replace(/\n+/g, ' ').trim();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'ko-KR';
      utt.rate = 1.0;
      utt.pitch = 1.0;
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const koVoice = voices.find(v => v.lang.startsWith('ko'));
        if (koVoice) utt.voice = koVoice;
        utt.onend = () => setSpeakingMsgId(null);
        utt.onerror = () => setSpeakingMsgId(null);
        setSpeakingMsgId(msgId);
        window.speechSynthesis.speak(utt);
      };
      if (window.speechSynthesis.getVoices().length) {
        trySpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = trySpeak;
      }
    }

    function startVoiceInput() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR || isListening || chatStreaming) return;
      const recognition = new SR();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;
      setIsListening(true);
      recognition.start();
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (inputRef.current) {
          inputRef.current.value = inputRef.current.value
            ? inputRef.current.value + ' ' + text
            : text;
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }

    // ── 핸즈프리 음성 상담: AI 말하는 동안 마이크 정지(에코 루프 방지) ──
    const pausedForSpeechRef = React.useRef(false);
    function speakVoice(text, id) {
      if (!window.speechSynthesis) return;
      pausedForSpeechRef.current = true;                 // 발화 중·직후 인식 무시(에코 방지). 마이크는 끄지 않음 → 모바일 자동 재개(제스처 불필요)
      setIsListening(false);                             // 표시는 '말하는 중'
      window.speechSynthesis.cancel();
      const clean = String(text).replace(/[*#`_~>]/g, '').replace(/\n+/g, ' ').trim();
      if (!clean) { pausedForSpeechRef.current = false; return; }
      lastSpokenTextRef.current = clean;                  // 에코 필터: 이 텍스트가 다시 인식되면 무시
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = lang === 'en' ? 'en-US' : 'ko-KR'; utt.rate = 1.0; utt.pitch = 1.0;
      const vs = window.speechSynthesis.getVoices() || [];
      const pref = vs.find(v => v.lang && v.lang.toLowerCase().startsWith(lang === 'en' ? 'en' : 'ko'));
      if (pref) utt.voice = pref;
      setSpeakingMsgId(id);
      const after = () => { setSpeakingMsgId(null); setTimeout(() => { pausedForSpeechRef.current = false; if (voiceModeRef.current) { setIsListening(true); try { voiceRecRef.current && voiceRecRef.current.start(); } catch {} } }, 800); };
      utt.onend = after; utt.onerror = after;
      window.speechSynthesis.speak(utt);
    }
    function startVoiceMode() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { setChatError(t('이 브라우저는 음성 인식을 지원하지 않아요. 크롬을 권장해요.','Speech recognition not supported. Try Chrome.')); return; }
      voiceModeRef.current = true; setVoiceMode(true); setChatError('');
      try {
        const rec = new SR();
        rec.lang = lang === 'en' ? 'en-US' : 'ko-KR'; rec.continuous = true; rec.interimResults = false;
        rec.onresult = (e) => {
          if (streamingRef.current || speakingRef.current || pausedForSpeechRef.current) return; // AI 음성/응답 중엔 무시
          let txt = ''; for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) txt += e.results[i][0].transcript; }
          txt = txt.trim();
          if (!txt) return;
          // 내용 기반 에코 필터: 인식된 말이 방금 AI가 말한 텍스트의 일부면 자기 목소리 → 무시
          const norm = s => String(s || '').replace(/[^가-힣a-zA-Z0-9]/g, '');
          const nt = norm(txt), ns = norm(lastSpokenTextRef.current);
          if (nt.length >= 5 && ns && (ns.indexOf(nt) !== -1 || ns.indexOf(nt.slice(0, 12)) !== -1)) return;
          if (inputRef.current && sendBtnRef.current) { inputRef.current.value = txt; sendBtnRef.current.click(); }
        };
        rec.onerror = (ev) => { if (ev && (ev.error === 'not-allowed' || ev.error === 'service-not-allowed')) stopVoiceMode(); };
        rec.onend = () => { if (voiceModeRef.current && !pausedForSpeechRef.current) { try { rec.start(); } catch {} } };
        voiceRecRef.current = rec;
      } catch {}
      // 인사말 먼저 → 끝난 뒤 마이크 시작(인사 에코 방지). speakVoice가 0.6초 후 마이크 켬.
      speakVoice(t('네, 편하게 말씀하세요.','Yes, please speak.'), 'voice-hello');
    }
    function stopVoiceMode() {
      voiceModeRef.current = false; setVoiceMode(false); setIsListening(false); pausedForSpeechRef.current = false;
      try { voiceRecRef.current && voiceRecRef.current.stop(); } catch {}
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
    }
    // 음성 모드일 때 완료된 AI 답변 자동 낭독(speakVoice가 마이크 정지/재개 처리)
    React.useEffect(() => {
      if (!voiceMode) return;
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        const m = chatMessages[i];
        if (m.role === 'assistant' && !m.streaming && m.content) {
          if (lastSpokenRef.current !== m.id) { lastSpokenRef.current = m.id; speakVoice(m.content, m.id); }
          break;
        }
      }
    }, [chatMessages, voiceMode]);
    React.useEffect(() => () => { voiceModeRef.current = false; try { voiceRecRef.current && voiceRecRef.current.stop(); } catch {} try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {} }, []);

    // 스트리밍 중 화면 떨림 방지:
    //  - scrollIntoView(smooth)는 내부 컨테이너뿐 아니라 '창(window)'까지 움직여 페이지가 흔들린다 → 쓰지 않는다.
    //  - 토큰마다 동기 스크롤하면 진행 중인 애니메이션과 충돌해 진동한다 → requestAnimationFrame으로 프레임당 1회만.
    //  - 컨테이너 내부만, 즉시(behavior 없음) 스크롤한다. 사용자가 위로 올려둔 상태면 방해하지 않는다.
    const scrollRafRef = React.useRef(0);
    React.useEffect(() => {
      const container = chatContainerRef.current;
      if (!container) return;
      const isNewMessage = chatMessages.length !== prevMsgCountRef.current;
      prevMsgCountRef.current = chatMessages.length;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
      // 새 메시지는 무조건 하단으로, 스트리밍 토큰은 하단 근처일 때만 따라간다.
      if (!isNewMessage && !isNearBottom) return;
      if (scrollRafRef.current) return;   // 이미 이번 프레임 예약됨 → 중복 스크롤 방지
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        const el = chatContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;   // 컨테이너 내부만, 즉시 — 창은 건드리지 않는다
      });
    }, [chatMessages]);
    React.useEffect(() => () => { if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current); }, []);

    return (
      <div className="mt-6 rounded-xl overflow-hidden border border-gray-200">
        {/* 컴팩트 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <span className="font-bold text-sm text-gray-800">{t('AI 상담 대화','AI Counseling')}</span>
            {hasMemory && (
              <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                {t('📝 이전 대화 기억 중','📝 Memory active')}
                <button onClick={clearMemory} className="ml-1 text-indigo-300 hover:text-indigo-500" title={t('기억 초기화','Clear memory')}>✕</button>
              </span>
            )}
            {chatMessages.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {t(`${chatMessages.filter(m => m.role === 'user').length}회 대화`,`${chatMessages.filter(m => m.role === 'user').length} chats`)}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {isLoggedIn && credits > 0
              ? t(`오늘 ${aiChatUsed}회 사용 (무제한)`, `Today: ${aiChatUsed} used (unlimited)`)
              : t(`오늘 ${aiChatUsed}/${AI_LIMIT_FREE}회 사용`, `Today: ${aiChatUsed}/${AI_LIMIT_FREE} used`)}
          </span>
        </div>

          <div className="bg-white">
            {/* ⚠️ 한 줄 면책 고지 */}
            <p className="px-4 pt-2 pb-1 text-xs text-gray-400">{t('⚠️ AI 상담은 참고용이며 의학적 진단을 대체하지 않습니다','⚠️ AI counseling is for reference only and does not replace medical diagnosis.')}</p>
            {/* 빠른 질문 버튼 */}
            {chatMessages.length === 0 && (
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-semibold">{(followupQs[testType] || []).length ? `🔎 ${t('내 결과로 이어서 물어보기','Ask about your result')}` : `💡 ${t('자주 묻는 질문','Common questions')}`}</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { 
                        // 빠른 질문 버튼: 즉시 전송 (chatInput 우회)
                        const userMsg = { role: 'user', content: prompt, id: Date.now() };
                        setChatMessages(prev => [...prev, userMsg]);
                        setChatStreaming(true);
                        setChatError('');
                        const counselingType = activeLinkData?.counselingType || 'psychological';
                        const summary = buildTestSummary(testType);
                        const assistantId = Date.now() + 1;
                        setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);
                        
                        // ⚠️ 만료 토큰이면 서버가 게스트로 강등→429. 전송 전 토큰 갱신 후 요청.
                        api.ensureToken().then(() => fetch('/api/ai-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...api._authHeader() },
                          body: JSON.stringify({
                            messages: [...chatMessages.filter(m => m.content && m.content.trim() && !m.streaming), userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() })),
                            testContext: { testType, counselingType, summary, lang }
                          })
                        }))
                        .then(async res => {
                          if (!res.ok) {
                            const errD = await res.json().catch(() => ({}));
                            setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                            setChatStreaming(false);
                            // 429: 비로그인 한도 초과 or 로그인 한도 초과 → 모달
                            if (res.status === 429) {
                              if (!isLoggedIn) {
                                setGuestAiTotal(AI_GUEST_TOTAL);
                                try { localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL)); } catch {}
                              } else {
                                setAiChatUsed(AI_LIMIT_FREE);
                              }
                              setShowAiLimitModal(true);
                              return;
                            }
                            setChatError(errD.error || '서버 오류');
                            return;
                          }
                          const reader = res.body.getReader();
                          const decoder = new TextDecoder();
                          let buffer = '';
                          let fullText = '';
                          
                          function processStream() {
                            reader.read().then(({ done, value }) => {
                              if (done) {
                                const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                                const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                                const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, '').trimEnd();
                                setChatMessages(prev => prev.map(m =>
                                  m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                                ));
                                setChatStreaming(false);
                                if (moodScore !== null && isLoggedIn) {
                                  api._fetch('/api/chat/mood-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moodScore, testType: 'chat' }) }).catch(() => {});
                                }
                                return;
                              }
                              buffer += decoder.decode(value, { stream: true });
                              const lines = buffer.split('\n');
                              buffer = lines.pop();
                              for (const line of lines) {
                                if (!line.startsWith('data: ')) continue;
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') break;
                                try {
                                  const parsed = JSON.parse(data);
                                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    fullText += parsed.delta.text;
                                    setChatMessages(prev => prev.map(m =>
                                      m.id === assistantId ? { ...m, content: fullText } : m
                                    ));
                                  }
                                } catch {}
                              }
                              processStream();
                            });
                          }
                          processStream();
                        })
                        .catch(e => {
                          setChatError(e.message || t('AI 채팅 중 오류가 발생했습니다.','An error occurred during AI chat.'));
                          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                          setChatStreaming(false);
                        });
                      }}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 메시지 목록 */}
            {/* ⚠️ overflowAnchor:'none' — 스트리밍 중 화면 '위아래 덜덜덜' 떨림의 근본 원인 제거.
                컨테이너가 넘칠 때(좁은 레이아웃·긴 답변) 브라우저 스크롤 앵커링이 내용 성장에 맞춰
                스크롤을 매 프레임 보정하며 진동한다(넓은 레이아웃은 안 넘쳐서 앵커링 미발동 → 안 떨림).
                하단 추적은 아래 rAF(scrollTop=scrollHeight)가 담당하므로 앵커링은 꺼도 무방. */}
            <div ref={chatContainerRef} className="h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ overflowAnchor: 'none' }}>
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-4xl mb-3">🤝</p>
                  <p className="text-sm font-semibold text-gray-600">{t('검사 결과에 대해 AI와 대화해 보세요','Chat with AI about your test results')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('상담 전략, 해석 방법, 활용 방안 등을 질문하세요','Ask about counseling strategies, interpretation, and how to apply results')}</p>
                  {!isLoggedIn && (
                    <p className="text-xs text-blue-500 mt-2 font-semibold">
                      {t(`💬 무료 체험 ${AI_LIMIT_FREE}회 · 가입하면 더 많이 이용 가능`,`💬 ${AI_LIMIT_FREE} free sessions · Sign up for more`)}
                    </p>
                  )}
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">AI</div>
                  )}
                  <div className={`max-w-[75%] min-w-0 px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content
                      ? <div className="text-sm space-y-0.5">
                          {renderMdText(msg.content)}
                          {msg.streaming && <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle rounded"></span>}
                          {!msg.streaming && msg.role === 'assistant' && window.speechSynthesis && (
                            <div className="flex justify-end mt-2 pt-1.5 border-t border-gray-100">
                              <button
                                onClick={() => speakText(msg.content, msg.id)}
                                className={`text-xs flex items-center gap-1 transition ${speakingMsgId === msg.id ? 'text-blue-500 font-semibold' : 'text-gray-300 hover:text-gray-500'}`}
                                title={speakingMsgId === msg.id ? t('음성 정지','Stop audio') : t('음성으로 듣기','Listen')}
                              >
                                {speakingMsgId === msg.id ? t('⏸ 정지','⏸ Stop') : t('🔊 듣기','🔊 Listen')}
                              </button>
                            </div>
                          )}
                        </div>
                      : <div className="flex gap-1 items-center py-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                        </div>
                    }
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 mt-0.5 shrink-0">나</div>
                  )}
                </div>
              ))}
              {chatError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  ⚠️ {chatError}
                  <button onClick={() => setChatError('')} className="ml-2 underline">{t('닫기','Close')}</button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  defaultValue={chatInput}
                  onKeyDown={e => {
                    console.log('⌨️ ChatBox keydown:', e.key, 'composing:', e.nativeEvent.isComposing);
                    // IME 조합 중이 아닐 때만 Enter 처리 (한글 입력 문제 해결)
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      const currentValue = inputRef.current?.value || '';
                      console.log('📤 Sending message:', currentValue);
                      if (currentValue.trim()) {
                        // 직접 메시지 전송 (상태 우회)
                        const userMsg = { role: 'user', content: currentValue.trim(), id: Date.now() };
                        setChatMessages(prev => [...prev, userMsg]);
                        inputRef.current.value = '';
                        setChatStreaming(true);
                        setChatError('');
                        const counselingType = activeLinkData?.counselingType || 'psychological';
                        const summary = buildTestSummary(testType);
                        const assistantId = Date.now() + 1;
                        setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);
                        
                        // ⚠️ 만료 토큰이면 서버가 게스트로 강등→429. 전송 전 토큰 갱신 후 요청.
                        api.ensureToken().then(() => fetch('/api/ai-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...api._authHeader() },
                          body: JSON.stringify({
                            messages: [...chatMessages.filter(m => m.content && m.content.trim() && !m.streaming), userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() })),
                            testContext: { testType, counselingType, summary, lang }
                          })
                        }))
                        .then(async res => {
                          if (!res.ok) {
                            const errD = await res.json().catch(() => ({}));
                            setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                            setChatStreaming(false);
                            // 429: 비로그인 한도 초과 or 로그인 한도 초과 → 모달
                            if (res.status === 429) {
                              if (!isLoggedIn) {
                                setGuestAiTotal(AI_GUEST_TOTAL);
                                try { localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL)); } catch {}
                              } else {
                                setAiChatUsed(AI_LIMIT_FREE);
                              }
                              setShowAiLimitModal(true);
                              return;
                            }
                            setChatError(errD.error || '서버 오류');
                            return;
                          }
                          const reader = res.body.getReader();
                          const decoder = new TextDecoder();
                          let buffer = '';
                          let fullText = '';
                          
                          function processStream() {
                            reader.read().then(({ done, value }) => {
                              if (done) {
                                const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                                const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                                const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, '').trimEnd();
                                setChatMessages(prev => prev.map(m =>
                                  m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                                ));
                                setChatStreaming(false);
                                if (moodScore !== null && isLoggedIn) {
                                  api._fetch('/api/chat/mood-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moodScore, testType: 'chat' }) }).catch(() => {});
                                }
                                return;
                              }
                              buffer += decoder.decode(value, { stream: true });
                              const lines = buffer.split('\n');
                              buffer = lines.pop();
                              for (const line of lines) {
                                if (!line.startsWith('data: ')) continue;
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') break;
                                try {
                                  const parsed = JSON.parse(data);
                                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    fullText += parsed.delta.text;
                                    setChatMessages(prev => prev.map(m =>
                                      m.id === assistantId ? { ...m, content: fullText } : m
                                    ));
                                  }
                                } catch {}
                              }
                              processStream();
                            });
                          }
                          processStream();
                        })
                        .catch(e => {
                          setChatError(e.message || 'AI 채팅 중 오류가 발생했습니다.');
                          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                          setChatStreaming(false);
                        });
                      }
                    }
                  }}
                  placeholder={t("검사 결과 활용 방법, 상담 전략 등을 질문하세요... (Enter 전송, Shift+Enter 줄바꿈)","Ask about your results, counseling strategies... (Enter to send, Shift+Enter for newline)")}
                  rows={2}
                  disabled={chatStreaming}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
                />
                {(window.SpeechRecognition || window.webkitSpeechRecognition) && !voiceMode && (
                  <button
                    onClick={startVoiceInput}
                    disabled={isListening || chatStreaming}
                    title={isListening ? t('듣는 중...','Listening...') : t('음성 입력','Voice input')}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40'}`}
                  >🎤</button>
                )}
                {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
                  <button
                    onClick={voiceMode ? stopVoiceMode : startVoiceMode}
                    title={voiceMode ? t('탭하면 음성 상담 종료','Tap to stop') : t('핸즈프리 음성 상담 — 누르고 그냥 말하면 돼요','Hands-free voice — tap and just speak')}
                    className={`shrink-0 h-10 px-3 rounded-xl flex items-center justify-center text-sm font-bold whitespace-nowrap transition ${voiceMode ? (speakingMsgId ? 'bg-gray-400 text-white' : 'bg-red-500 text-white animate-pulse') : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                  >{voiceMode ? (speakingMsgId ? t('🔈 말하는 중','🔈 Speaking') : t('🎙️ 듣는 중·탭=끝','🎙️ Listening')) : t('🔊 음성 상담','🔊 Voice')}</button>
                )}
                <div className="flex flex-col gap-1.5">
                  <button
                    ref={sendBtnRef}
                    onClick={() => {
                      if (isAiChatExhausted()) { setShowAiLimitModal(true); return; }
                      const currentValue = inputRef.current?.value || '';
                      if (currentValue.trim() && !chatStreaming) {
                        const userMsg = { role: 'user', content: currentValue.trim(), id: Date.now() };
                        setChatMessages(prev => [...prev, userMsg]);
                        inputRef.current.value = '';
                        setChatStreaming(true);
                        setChatError('');
                        const counselingType = activeLinkData?.counselingType || 'psychological';
                        const summary = buildTestSummary(testType);
                        const assistantId = Date.now() + 1;
                        setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);
                        
                        // ⚠️ 만료 토큰이면 서버가 게스트로 강등→429. 전송 전 토큰 갱신 후 요청.
                        api.ensureToken().then(() => fetch('/api/ai-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...api._authHeader() },
                          body: JSON.stringify({
                            messages: [...chatMessages.filter(m => m.content && m.content.trim() && !m.streaming), userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() })),
                            testContext: { testType, counselingType, summary, lang }
                          })
                        }))
                        .then(async res => {
                          if (!res.ok) {
                            const errD = await res.json().catch(() => ({}));
                            setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                            setChatStreaming(false);
                            // 429: 비로그인 한도 초과 or 로그인 한도 초과 → 모달
                            if (res.status === 429) {
                              if (!isLoggedIn) {
                                setGuestAiTotal(AI_GUEST_TOTAL);
                                try { localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL)); } catch {}
                              } else {
                                setAiChatUsed(AI_LIMIT_FREE);
                              }
                              setShowAiLimitModal(true);
                              return;
                            }
                            setChatError(errD.error || '서버 오류');
                            return;
                          }
                          const reader = res.body.getReader();
                          const decoder = new TextDecoder();
                          let buffer = '';
                          let fullText = '';
                          
                          function processStream() {
                            reader.read().then(({ done, value }) => {
                              if (done) {
                                const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                                const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                                const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, '').trimEnd();
                                setChatMessages(prev => prev.map(m =>
                                  m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                                ));
                                setChatStreaming(false);
                                if (moodScore !== null && isLoggedIn) {
                                  api._fetch('/api/chat/mood-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moodScore, testType: 'chat' }) }).catch(() => {});
                                }
                                return;
                              }
                              buffer += decoder.decode(value, { stream: true });
                              const lines = buffer.split('\n');
                              buffer = lines.pop();
                              for (const line of lines) {
                                if (!line.startsWith('data: ')) continue;
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') break;
                                try {
                                  const parsed = JSON.parse(data);
                                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    fullText += parsed.delta.text;
                                    setChatMessages(prev => prev.map(m =>
                                      m.id === assistantId ? { ...m, content: fullText } : m
                                    ));
                                  }
                                } catch {}
                              }
                              processStream();
                            });
                          }
                          processStream();
                        })
                        .catch(e => {
                          setChatError(e.message || 'AI 채팅 중 오류가 발생했습니다.');
                          setChatMessages(prev => prev.filter(m => m.id !== assistantId));
                          setChatStreaming(false);
                        });
                      }
                    }}
                    disabled={chatStreaming}
                    className={`${isAiChatExhausted() ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed'} text-white px-4 py-2 rounded-xl text-sm font-bold transition`}
                  >
                    {chatStreaming ? '•••' : isAiChatExhausted() ? t('가입하기','Sign up') : t('전송','Send')}
                  </button>
                  {chatMessages.length > 0 && (
                    <button
                      onClick={resetChat}
                      className="text-xs text-gray-400 hover:text-gray-600 text-center"
                    >{t('초기화','Clear')}</button>
                  )}
                </div>
              </div>
            </div>

            {/* 🏥 전문가 상담 연결 버튼 */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setView('counseling'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full py-2.5 bg-white border border-teal-200 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50 hover:border-teal-400 transition flex items-center justify-center gap-2 group">
                <span>🏥</span>
                <span>{t('전문 상담 기관 찾기','Find a Counseling Center')}</span>
                <span className="text-teal-300 group-hover:text-teal-500 transition">→</span>
              </button>
              <p className="text-center text-xs text-gray-400 mt-1">{t('AI 상담은 참고용입니다. 전문 상담사의 도움이 필요하시면 클릭하세요.','AI counseling is for reference only. Click if you need professional support.')}</p>
            </div>
          </div>
      </div>
    );
  }

  // 📖 기독교 상담 참고자료 관리 함수
  async function loadBiblicalRefs() {
    try {
      const res = await fetch('/api/admin/biblical-references');
      const data = await res.json();
      if (data.success) setBiblicalRefs(data.data || []);
    } catch (e) { console.error('참고자료 로드 실패:', e); }
  }

  async function saveBiblicalRef() {
    if (!biblicalForm.title.trim() || !biblicalForm.content.trim()) {
      setBiblicalMsg({ type: 'error', text: '제목과 내용을 모두 입력해주세요.' });
      return;
    }
    setBiblicalLoading(true);
    setBiblicalMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/biblical-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify(biblicalForm)
      });
      const data = await res.json();
      if (data.success) {
        setBiblicalMsg({ type: 'success', text: '✅ ' + data.message });
        setBiblicalForm({ id: null, title: '', category: 'general', content: '', sort_order: 0 });
        setShowBiblicalForm(false);
        await loadBiblicalRefs();
      } else {
        setBiblicalMsg({ type: 'error', text: '❌ ' + (data.error || '저장 실패') });
      }
    } catch (e) {
      setBiblicalMsg({ type: 'error', text: '❌ 서버 오류: ' + e.message });
    } finally {
      setBiblicalLoading(false);
    }
  }

  async function deleteBiblicalRef(id, title) {
    if (!confirm(`"${title}" 자료를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/biblical-references/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBiblicalMsg({ type: 'success', text: '✅ 삭제되었습니다.' });
        await loadBiblicalRefs();
      }
    } catch (e) {
      setBiblicalMsg({ type: 'error', text: '❌ 삭제 실패' });
    }
  }

  async function toggleBiblicalRef(id) {
    try {
      await fetch(`/api/admin/biblical-references/${id}/toggle`, { method: 'PATCH' });
      await loadBiblicalRefs();
    } catch (e) { console.error('토글 실패:', e); }
  }

  function editBiblicalRef(ref) {
    setBiblicalForm({ id: ref.id, title: ref.title, category: ref.category, content: ref.content, sort_order: ref.sort_order || 0 });
    setShowBiblicalForm(true);
    setBiblicalMsg({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBiblicalFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) {
      setBiblicalMsg({ type: 'error', text: '❌ 파일 크기는 500KB 이내여야 합니다.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setBiblicalForm(f => ({
        ...f,
        title: f.title || file.name.replace(/\.[^.]+$/, ''),
        content: text
      }));
      setBiblicalMsg({ type: 'success', text: `✅ "${file.name}" 파일 불러오기 완료. 내용 확인 후 저장하세요.` });
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  // 🔢 쿼터 수정 시작

  // 🔢 쿼터 수정 취소

  // 🔢 쿼터 수정 저장


  // ===================================================
  // 멀티 검사 진행 헬퍼: 현재 검사 저장 후 다음으로 이동
  // ===================================================
  function advanceToNextTest(currentTestType, sessionData) {
    storeSession(sessionData);
    const completedIds = [...multiSessionIds, sessionData.sessionId];
    setMultiSessionIds(completedIds);
    const nextIndex = currentTestIndex + 1;
    if (nextIndex < pendingTests.length) {
      setCurrentTestIndex(nextIndex);
      const nextType = pendingTests[nextIndex];
      const newSessionId = genId("session");
      setSessionId(newSessionId);
      setSrciResponses({}); setSdriResponses({}); setDsiRec("");
      setPhq9Responses({}); setGad7Responses({});
      setRiasecResponses({}); setValuesResponses({});
      setDass21Responses({}); setBig5Responses({});
      setBurnoutResponses({}); setLostResponses({}); setSaveStatus("");
      const testViews = { "SCT":"sctTest","DSI":"dsiTest","PHQ9":"phq9Test","GAD7":"gad7Test","DASS21":"dass21Test","BIG5":"big5Test","BURNOUT":"burnoutTest","LOST":"lostTest","RIASEC":"riasecTest","VALUES":"valuesTest" };
      console.log("nextTest: " + nextType + " (" + (nextIndex+1) + "/" + pendingTests.length + ")");
      setView(testViews[nextType] || "sctTest");
    } else {
      if (activeLinkId) {
        const ld = loadLink(activeLinkId);
        if (ld) { ld.status = "completed"; ld.completedSessionIds = completedIds; storeLink(ld); }
      }
      const singleResultViews = { RIASEC: "riasecResult", VALUES: "valuesResult" };
      setView(singleResultViews[currentTestType] || "complete");
    }
  }

  // SRCI 제출 (SCT 자리 — 문장완성형)
  function submitSrci() {
    const { filled, total, byScale } = calcSrci();
    if (filled < total) {
      setSaveStatus("⚠️ " + (total - filled) + "개 문항이 남아있습니다.");
      return;
    }
    const data = {
      sessionId, testType: "SCT",
      responses: { byScale, filled },
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 SRCI 검사 제출:', sessionId);
    advanceToNextTest("SCT", data);
  }

  // SDRI 제출 (DSI 자리 — 평정형)
  function submitSdri() {
    const likertFilled = Object.keys(sdriResponses).length;
    if (likertFilled < sdriLikertQ.length) {
      setSaveStatus("⚠️ " + (sdriLikertQ.length - likertFilled) + "개 문항이 남아있습니다.");
      return;
    }
    if (partnerMode) {
      const { scales, total } = calcSdri();
      const result = { scales, total };
      const newCompleted = { ...partnerMode.completedResults, dsi: result };
      const remaining = partnerMode.pendingTests.filter(t => t !== 'DSI');
      setPartnerMode(prev => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) { submitPartnerResults(newCompleted); }
      else { setView('partnerTest:' + remaining[0]); }
      return;
    }
    const { scales, total } = calcSdri();
    saveCoupleResult('DSI', { scales, total });
    if (isLoggedIn) api.saveTestScore("DSI", total, total >= 90 ? '건강한 분화' : total >= 60 ? '중간 분화' : '낮은 분화').catch(() => {});
    const data = {
      sessionId, testType: "DSI",
      responses: { scales, total, answers: sdriResponses },
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 SDRI 검사 제출:', sessionId);
    advanceToNextTest("DSI", data);
  }

  // PHQ-9 제출 함수
  function submitPhq9() {
    if (Object.keys(phq9Responses).length < 9) {
      setSaveStatus("⚠️ " + (9 - Object.keys(phq9Responses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { total, level } = calcPhq9();
    if (isLoggedIn) api.saveTestScore("PHQ9", total, level).catch(() => {});
    const data = {
      sessionId, testType: "PHQ9",
      responses: phq9Responses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 PHQ-9 검사 제출:', sessionId);
    advanceToNextTest("PHQ9", data);
  }

  // GAD-7 제출 함수
  function submitGad7() {
    if (Object.keys(gad7Responses).length < 7) {
      setSaveStatus("⚠️ " + (7 - Object.keys(gad7Responses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { total, level } = calcGad7();
    if (isLoggedIn) api.saveTestScore("GAD7", total, level).catch(() => {});
    const data = {
      sessionId, testType: "GAD7",
      responses: gad7Responses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 GAD-7 검사 제출:', sessionId);
    advanceToNextTest("GAD7", data);
  }

  // ============================================================
  // Holland RIASEC — 문항·유형 정보·calc·submit
  // ============================================================
  const RIASEC_Q = [
    { id:1,  type:'R', text:t('손으로 직접 물건을 만들거나 수리하는 것을 좋아한다', 'I enjoy making or repairing things with my hands') },
    { id:2,  type:'R', text:t('기계나 도구를 다루는 작업이 즐겁다', 'I find working with machines and tools enjoyable') },
    { id:3,  type:'R', text:t('정원 가꾸기, 목공예 등 실용적인 활동에 흥미가 있다', 'I am interested in hands-on activities like gardening or woodworking') },
    { id:4,  type:'R', text:t('야외 활동이나 신체적 작업을 즐긴다', 'I enjoy outdoor activities or physical work') },
    { id:5,  type:'R', text:t('설계도, 도면, 지도를 읽고 이해하는 것이 어렵지 않다', 'I can easily read and understand blueprints, drawings, or maps') },
    { id:6,  type:'I', text:t('복잡한 문제를 분석하고 해결책을 찾는 것이 흥미롭다', 'I find it interesting to analyze complex problems and find solutions') },
    { id:7,  type:'I', text:t('새로운 지식이나 이론을 탐구하는 것을 즐긴다', 'I enjoy exploring new knowledge and theories') },
    { id:8,  type:'I', text:t('데이터나 수치를 분석하는 작업이 재미있다', 'I find analyzing data or numbers enjoyable') },
    { id:9,  type:'I', text:t('궁금한 것이 있으면 끝까지 파헤치는 편이다', 'When curious about something, I dig deep until I find the answer') },
    { id:10, type:'I', text:t('논리적이고 체계적으로 생각하는 것을 좋아한다', 'I enjoy thinking logically and systematically') },
    { id:11, type:'A', text:t('글쓰기, 강연, 창작 등 자신을 표현하는 활동을 즐긴다', 'I enjoy expressive activities like writing, speaking, or creating') },
    { id:12, type:'A', text:t('나만의 독창적인 방식으로 아이디어를 표현하고 싶다', 'I want to express ideas in my own unique way') },
    { id:13, type:'A', text:t('틀에 박힌 방식보다 자유롭게 일하는 것이 좋다', 'I prefer working freely rather than following set methods') },
    { id:14, type:'A', text:t('새로운 아이디어를 생각해내는 것이 즐겁다', 'I enjoy generating new ideas') },
    { id:15, type:'A', text:t('예술, 문화, 콘텐츠 분야에 관심이 많다', 'I have a strong interest in art, culture, or content creation') },
    { id:16, type:'S', text:t('어려움에 처한 사람을 돕는 것이 보람 있다', 'I find it rewarding to help people who are in need') },
    { id:17, type:'S', text:t('무언가를 가르치거나 코칭하는 역할이 즐겁다', 'I enjoy teaching or coaching others') },
    { id:18, type:'S', text:t('사람들의 이야기를 듣고 조언해 주는 것을 좋아한다', 'I like listening to people and giving them advice') },
    { id:19, type:'S', text:t('봉사활동이나 사회 기여 활동에 관심이 있다', 'I am interested in volunteer work or community service') },
    { id:20, type:'S', text:t('혼자보다 다른 사람과 함께 협력하며 일하는 것이 좋다', 'I prefer working cooperatively with others rather than alone') },
    { id:21, type:'E', text:t('새로운 사업 아이디어를 실행에 옮기는 것이 즐겁다', 'I enjoy turning new business ideas into reality') },
    { id:22, type:'E', text:t('사람들을 설득하거나 협상하는 것이 자신 있다', 'I am confident in persuading or negotiating with people') },
    { id:23, type:'E', text:t('리더십을 발휘하여 팀을 이끄는 역할이 좋다', 'I enjoy leading a team and exercising leadership') },
    { id:24, type:'E', text:t('도전적인 목표를 세우고 성취하는 것에서 동기부여를 받는다', 'I am motivated by setting and achieving challenging goals') },
    { id:25, type:'E', text:t('경쟁적인 환경에서도 적극적으로 참여하는 편이다', 'I actively participate even in competitive environments') },
    { id:26, type:'C', text:t('정해진 절차와 규칙을 따르는 것이 편하다', 'I feel comfortable following established procedures and rules') },
    { id:27, type:'C', text:t('데이터를 정리하고 문서를 체계적으로 관리하는 것이 즐겁다', 'I enjoy organizing data and managing documents systematically') },
    { id:28, type:'C', text:t('꼼꼼하고 정확한 작업을 선호한다', 'I prefer careful and precise work') },
    { id:29, type:'C', text:t('숫자나 문서를 다루는 사무적인 업무가 어렵지 않다', 'I can handle administrative tasks involving numbers or documents') },
    { id:30, type:'C', text:t('일관성 있고 체계적으로 업무를 처리하는 편이다', 'I tend to handle tasks consistently and systematically') },
  ];
  const RIASEC_TYPE_INFO = {
    R: { name:t('실재형','Realistic'), emoji:'🔧', desc:t('도구·기계·자연을 다루는 실용적이고 구체적인 활동을 좋아합니다. 현장감 있는 환경에서 직접 만들고 운영하는 일에서 보람을 느낍니다.','You enjoy practical, hands-on activities involving tools, machines, or nature. You find fulfillment in building and operating things in real-world environments.'), careers:t(['기술교육강사','시설·안전관리','원예·농업 전문가','제조·품질관리'],['Technical Trainer','Facilities & Safety Manager','Horticulture / Agriculture','Manufacturing & QC']) },
    I: { name:t('탐구형','Investigative'), emoji:'🔬', desc:t('연구·분석·지식 탐구를 즐깁니다. 쌓아온 노하우를 분석하고 체계화하는 일에서 성취감을 느낍니다.','You enjoy research, analysis, and intellectual exploration. You gain a sense of achievement by systematizing accumulated knowledge.'), careers:t(['경영컨설턴트','데이터분석가','교육과정개발자','연구·기획전문가'],['Management Consultant','Data Analyst','Curriculum Developer','Research & Planning']) },
    A: { name:t('예술형','Artistic'), emoji:'🎨', desc:t('창의적 표현과 자유로운 환경을 선호합니다. 강의, 글쓰기, 콘텐츠 창작에서 두각을 나타냅니다.','You prefer creative expression and open environments. You excel in teaching, writing, and content creation.'), careers:t(['강사·교육전문가','작가·칼럼니스트','콘텐츠크리에이터','기업교육전문가'],['Instructor / Educator','Writer / Columnist','Content Creator','Corporate Trainer']) },
    S: { name:t('사회형','Social'), emoji:'🤝', desc:t('사람을 돕고 가르치고 상담하는 것을 좋아합니다. 풍부한 경험과 노하우를 나누는 멘토·코치 역할에 잘 맞습니다.','You enjoy helping, teaching, and counseling others. The mentor and coach roles suit you well.'), careers:t(['커리어코치·멘토','심리상담사','사회복지사','직업훈련강사'],['Career Coach / Mentor','Counselor','Social Worker','Vocational Trainer']) },
    E: { name:t('진취형','Enterprising'), emoji:'🚀', desc:t('리더십·설득·사업 도전을 즐깁니다. 업무 경험을 바탕으로 한 창업, 영업·컨설팅에 적합합니다.','You enjoy leadership, persuasion, and business challenges. Entrepreneurship, sales, and consulting suit you well.'), careers:t(['창업가·소상공인','영업컨설턴트','HR·조직관리','비즈니스개발'],['Entrepreneur','Sales Consultant','HR & Org Management','Business Development']) },
    C: { name:t('관습형','Conventional'), emoji:'📋', desc:t('체계적이고 정확한 데이터 처리를 선호합니다. 행정·관리·감리 분야에서 강점을 발휘합니다.','You prefer systematic, accurate data processing. You excel in administration, management, and inspection roles.'), careers:t(['세무·회계전문가','품질·인증관리','행정·기획관리자','감리·안전감독'],['Tax & Accounting','Quality & Certification','Administrative Manager','Safety Inspector']) },
  };
  function calcRiasec() {
    const scores = { R:0, I:0, A:0, S:0, E:0, C:0 };
    for (const q of RIASEC_Q) scores[q.type] += (riasecResponses[q.id] || 3);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return { scores, sorted, dominantType: sorted[0][0] + sorted[1][0] };
  }
  function submitRiasec() {
    if (Object.keys(riasecResponses).length < 30) {
      setSaveStatus("⚠️ " + (30 - Object.keys(riasecResponses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { scores, sorted, dominantType } = calcRiasec();
    if (isLoggedIn) {
      api.saveTestScore("RIASEC", sorted[0][1], dominantType).catch(() => {});
      fetch('/api/test/save-result', {
        method:'POST', headers:{ 'Content-Type':'application/json', ...api._authHeader() },
        body: JSON.stringify({ test_type:'RIASEC', result_json:{ scores, dominant_type:dominantType } }),
      }).catch(() => {});
    }
    const data = { sessionId, testType:"RIASEC", responses:{ scores, dominant_type:dominantType }, createdAt:new Date().toISOString(), userPhone:userInfo.phone||"미확인", linkId:activeLinkId||null };
    advanceToNextTest("RIASEC", data);
  }

  // ============================================================
  // 직업가치관 — 문항·도메인 정보·calc·submit
  // ============================================================
  const VALUES_Q = [
    { id:1,  domain:'achievement', text:t('어렵고 도전적인 목표를 달성했을 때 가장 큰 보람을 느낀다.', 'I feel the greatest fulfillment when I achieve a difficult, challenging goal.') },
    { id:2,  domain:'achievement', text:t('내 분야에서 최고 수준의 성과를 내는 것이 중요하다.', 'It is important to me to perform at the highest level in my field.') },
    { id:3,  domain:'achievement', text:t('뚜렷한 성과와 결과물이 있는 일에서 동기부여를 받는다.', 'I am motivated by work that produces clear results and outcomes.') },
    { id:4,  domain:'service',     text:t('내 일이 다른 사람들의 삶에 긍정적인 영향을 미치는 것이 중요하다.', 'It is important that my work has a positive impact on other people\'s lives.') },
    { id:5,  domain:'service',     text:t('사회적으로 의미 있는 일을 하고 싶다.', 'I want to do work that is meaningful to society.') },
    { id:6,  domain:'service',     text:t('어려운 사람을 돕는 일에서 진정한 보람을 느낀다.', 'I feel true fulfillment in work that helps people in need.') },
    { id:7,  domain:'stability',   text:t('고용이 보장되고 안정적인 직장을 가장 우선시한다.', 'Job security and a stable workplace are my top priorities.') },
    { id:8,  domain:'stability',   text:t('예측 가능하고 변화가 적은 환경에서 일하는 것을 선호한다.', 'I prefer working in a predictable environment with few changes.') },
    { id:9,  domain:'stability',   text:t('위험 부담이 적은 안정된 선택을 하는 것이 중요하다.', 'Making safe, low-risk choices is important to me.') },
    { id:10, domain:'autonomy',    text:t('스스로 업무 방식과 일정을 결정할 수 있는 자율성이 중요하다.', 'Having autonomy to decide my own working methods and schedule is important.') },
    { id:11, domain:'autonomy',    text:t('지시를 받기보다 스스로 판단하여 일하는 방식을 선호한다.', 'I prefer making my own judgments at work rather than following instructions.') },
    { id:12, domain:'autonomy',    text:t('독립적으로 일하면서 나만의 방식을 만들어가는 것이 중요하다.', 'It is important to work independently and develop my own approach.') },
    { id:13, domain:'creativity',  text:t('새로운 것을 만들고 창조하는 일에서 큰 즐거움을 느낀다.', 'I find great joy in work that involves creating and building something new.') },
    { id:14, domain:'creativity',  text:t('기존 틀을 깨고 혁신적인 방법을 시도하는 것을 즐긴다.', 'I enjoy breaking existing norms and trying innovative approaches.') },
    { id:15, domain:'creativity',  text:t('예술적·창의적 표현이 가능한 일에 매력을 느낀다.', 'I am attracted to work that allows artistic or creative expression.') },
    { id:16, domain:'influence',   text:t('조직이나 사회에서 영향력 있는 위치에 있는 것이 중요하다.', 'It is important to me to hold an influential position in my organization or society.') },
    { id:17, domain:'influence',   text:t('중요한 결정에 참여하고 의사결정 과정에서 주도적 역할을 하고 싶다.', 'I want to participate in important decisions and play a leading role in the process.') },
    { id:18, domain:'influence',   text:t('다른 사람들의 생각과 행동에 긍정적 변화를 이끌고 싶다.', 'I want to drive positive change in others\' thinking and behavior.') },
    { id:19, domain:'knowledge',   text:t('지속적으로 새로운 지식과 기술을 배우는 것이 중요하다.', 'Continuously learning new knowledge and skills is important to me.') },
    { id:20, domain:'knowledge',   text:t('특정 분야에서 깊은 전문성을 쌓는 것에 큰 의미를 둔다.', 'Building deep expertise in a specific field is very meaningful to me.') },
    { id:21, domain:'knowledge',   text:t('지적 자극이 있는 복잡하고 어려운 문제를 다루는 일을 좋아한다.', 'I enjoy tackling complex, intellectually challenging problems.') },
    { id:22, domain:'balance',     text:t('일과 개인 생활의 균형이 무엇보다 중요하다.', 'Maintaining a balance between work and personal life is my top priority.') },
    { id:23, domain:'balance',     text:t('가족과 함께하는 시간과 개인 취미를 충분히 누릴 수 있는 직업을 원한다.', 'I want a job that allows enough time for family and personal hobbies.') },
    { id:24, domain:'balance',     text:t('과도한 업무 부담보다 적정한 수준의 책임이 있는 일을 선호한다.', 'I prefer work with a reasonable level of responsibility over an excessive workload.') },
    { id:25, domain:'social',      text:t('주변 사람들에게 인정받고 존경받는 직업을 갖는 것이 중요하다.', 'Having a job that is respected and admired by people around me is important.') },
    { id:26, domain:'social',      text:t('사회적으로 명망 있고 위상이 높은 직업을 갖고 싶다.', 'I want to have a socially prestigious and high-profile career.') },
    { id:27, domain:'social',      text:t('내 직업이 타인에게 긍정적으로 평가받는 것이 중요하다.', 'It is important that others view my job positively.') },
    { id:28, domain:'economic',    text:t('높은 수입을 올릴 수 있는 직업을 원한다.', 'I want a job that allows me to earn a high income.') },
    { id:29, domain:'economic',    text:t('충분한 경제적 보상이 있어야 일에서 만족감을 느낀다.', 'I can only feel satisfied at work when there is sufficient financial compensation.') },
    { id:30, domain:'economic',    text:t('성과에 따른 높은 인센티브를 제공하는 직업을 선호한다.', 'I prefer jobs that offer high incentives based on performance.') },
  ];
  const VALUES_DOMAIN_INFO = {
    achievement: { label:t('성취','Achievement'),          emoji:'🏆', desc:t('높은 목표를 달성하고 성공을 추구합니다.','You pursue high goals and strive for success.') },
    service:     { label:t('봉사','Service'),              emoji:'🌱', desc:t('타인을 돕고 사회에 기여하는 것에서 의미를 찾습니다.','You find meaning in helping others and contributing to society.') },
    stability:   { label:t('안정','Job Security'),         emoji:'🛡️', desc:t('직업 안정성과 예측 가능한 환경을 선호합니다.','You prefer job security and a predictable environment.') },
    autonomy:    { label:t('자율','Autonomy'),             emoji:'🦋', desc:t('스스로 결정하고 독립적으로 일하는 것을 중시합니다.','You value making your own decisions and working independently.') },
    creativity:  { label:t('창의','Creativity'),           emoji:'🎨', desc:t('새로운 것을 만들고 혁신하는 일에서 즐거움을 느낍니다.','You find joy in creating new things and driving innovation.') },
    influence:   { label:t('영향력','Influence'),          emoji:'📢', desc:t('다른 사람과 조직에 영향을 미치는 것을 중시합니다.','You value having influence over others and your organization.') },
    knowledge:   { label:t('지식추구','Knowledge'),        emoji:'📚', desc:t('지속적인 학습과 전문성 개발에 가치를 둡니다.','You place value on continuous learning and developing expertise.') },
    balance:     { label:t('워라밸','Work-Life Balance'),  emoji:'⚖️', desc:t('일과 삶의 균형을 중요하게 생각합니다.','You consider work-life balance a top priority.') },
    social:      { label:t('사회인정','Social Recognition'),emoji:'🌟', desc:t('타인으로부터 인정과 존경을 받는 것을 중시합니다.','You value receiving recognition and respect from others.') },
    economic:    { label:t('경제적 보상','Economic Reward'),emoji:'💰', desc:t('높은 수입과 경제적 여유를 중요하게 생각합니다.','You consider high income and financial security important.') },
  };
  function calcValues() {
    const sums = {}, counts = {};
    for (const q of VALUES_Q) {
      if (!sums[q.domain]) { sums[q.domain] = 0; counts[q.domain] = 0; }
      sums[q.domain] += (valuesResponses[q.id] || 3);
      counts[q.domain]++;
    }
    const scores = {};
    for (const d of Object.keys(sums)) scores[d] = Math.round((sums[d] / counts[d]) * 20);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return { scores, sorted };
  }
  function submitValues() {
    if (Object.keys(valuesResponses).length < 30) {
      setSaveStatus("⚠️ " + (30 - Object.keys(valuesResponses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { scores, sorted } = calcValues();
    if (isLoggedIn) {
      api.saveTestScore("VALUES", sorted[0][1], sorted[0][0]).catch(() => {});
      fetch('/api/test/save-result', {
        method:'POST', headers:{ 'Content-Type':'application/json', ...api._authHeader() },
        body: JSON.stringify({ test_type:'VALUES', result_json:{ scores } }),
      }).catch(() => {});
    }
    const data = { sessionId, testType:"VALUES", responses:{ scores }, createdAt:new Date().toISOString(), userPhone:userInfo.phone||"미확인", linkId:activeLinkId||null };
    advanceToNextTest("VALUES", data);
  }

  // DASS-21 제출 함수
  function submitDass21() {
    if (Object.keys(dass21Responses).length < 21) {
      setSaveStatus("⚠️ " + (21 - Object.keys(dass21Responses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { depression } = calcDass21();
    if (isLoggedIn) api.saveTestScore("DASS21", depression.score, depression.level).catch(() => {});
    const data = {
      sessionId, testType: "DASS21",
      responses: dass21Responses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 DASS-21 검사 제출:', sessionId);
    advanceToNextTest("DASS21", data);
  }

  // Big5 제출 함수
  function submitBig5() {
    if (Object.keys(big5Responses).length < 50) {
      setSaveStatus("⚠️ " + (50 - Object.keys(big5Responses).length) + "개 문항이 남아있습니다.");
      return;
    }
    if (partnerMode) {
      const result = calcBig5();
      const newCompleted = { ...partnerMode.completedResults, big5: result };
      const remaining = partnerMode.pendingTests.filter(t => t !== 'BIG5');
      setPartnerMode(prev => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) { submitPartnerResults(newCompleted); }
      else { setView('partnerTest:' + remaining[0]); }
      return;
    }
    const data = {
      sessionId, testType: "BIG5",
      responses: big5Responses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    saveCoupleResult('BIG5', calcBig5());
    console.log('📝 Big5 검사 제출:', sessionId);
    advanceToNextTest("BIG5", data);
  }

  function submitBurnout() {
    if (Object.keys(burnoutResponses).length < 50) {
      setSaveStatus("⚠️ " + (50 - Object.keys(burnoutResponses).length) + "개 문항이 남아있습니다.");
      return;
    }
    const { totalScore, level } = calcBurnout();
    if (isLoggedIn) api.saveTestScore("BURNOUT", totalScore, level).catch(() => {});
    const data = {
      sessionId, testType: "BURNOUT",
      responses: burnoutResponses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    console.log('📝 번아웃 검사 제출:', sessionId);
    advanceToNextTest("BURNOUT", data);
  }

  function submitLost() {
    if (Object.keys(lostResponses).length < 60) {
      setSaveStatus("⚠️ " + (60 - Object.keys(lostResponses).length) + "개 문항이 남아있습니다.");
      return;
    }
    if (partnerMode) {
      const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
      const result = { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle };
      const newCompleted = { ...partnerMode.completedResults, lost: result };
      const remaining = partnerMode.pendingTests.filter(t => t !== 'LOST');
      setPartnerMode(prev => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) { submitPartnerResults(newCompleted); }
      else { setView('partnerTest:' + remaining[0]); }
      return;
    }
    const data = {
      sessionId, testType: "LOST",
      responses: lostResponses,
      createdAt: new Date().toISOString(),
      userPhone: userInfo.phone || "미확인", linkId: activeLinkId || null
    };
    const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
    saveCoupleResult('LOST', { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle });
    console.log('📝 LOST 검사 제출:', sessionId);
    advanceToNextTest("LOST", data);
  }

  function viewSession(sid, returnDataOnly = false) {
    console.log('🔍 viewSession 호출:', sid, 'returnDataOnly:', returnDataOnly);
    
    const r = storage.get("session_" + sid);
    if (!r) {
      console.log('❌ 세션을 찾을 수 없습니다:', sid);
      return null;
    }
    
    const data = JSON.parse(r.value);
    console.log('✅ 세션 데이터 로드:', data.testType, data.userPhone);
    
    // PDF 생성을 위해 데이터만 반환하는 경우
    if (returnDataOnly) {
      console.log('📄 PDF 생성용 데이터 반환');
      return data;
    }
    
    // linkId가 있으면 링크 데이터 복원 (상담 유형 정보 포함)
    if (data.linkId) {
      const linkData = loadLink(data.linkId);
      if (linkData) {
        console.log('🔗 링크 데이터 복원:', linkData.counselingType);
        setActiveLinkData(linkData);
      }
    }
    
    // 일반 뷰어 모드
    if (data.testType === "SCT") {
      setSrciResponses(data.responses?.byScale ? {} : (data.responses || {}));
      setSctSummaries(data.summaries || {});
      console.log('📝 SCT 응답 설정 완료');
    } else if (data.testType === "DSI") {
      setSdriResponses(data.responses?.answers || data.responses || {});
      setDsiRec(data.recommendation || "");
      console.log('🔍 SDRI 응답 설정 완료');
    } else if (data.testType === "PHQ9") {
      setPhq9Responses(data.responses || {});
      console.log('😔 PHQ-9 응답 설정 완료');
    } else if (data.testType === "GAD7") {
      setGad7Responses(data.responses || {});
      console.log('😰 GAD-7 응답 설정 완료');
    } else if (data.testType === "DASS21") {
      setDass21Responses(data.responses || {});
      console.log('📊 DASS-21 응답 설정 완료');
    } else if (data.testType === "BIG5") {
      setBig5Responses(data.responses || {});
      console.log('🌟 Big5 응답 설정 완료');
    } else if (data.testType === "BURNOUT") {
      setBurnoutResponses(data.responses || {});
      console.log('🔥 번아웃 응답 설정 완료');
    } else if (data.testType === "LOST") {
      setLostResponses(data.responses || {});
      console.log('🧭 LOST 응답 설정 완료');
    }
    
    setSessionId(sid);
    setUserInfo({ phone: data.userPhone || "", password: "" });
    
    // 검사 유형에 따라 결과 화면 설정
    const resultViews = {
      "SCT": "sctResult",
      "DSI": "sctResult",
      "PHQ9": "phq9Result",
      "GAD7": "gad7Result",
      "DASS21": "dass21Result",
      "BIG5": "big5Result",
      "BURNOUT": "burnoutResult",
      "LOST": "lostResult"
    };
    const targetView = resultViews[data.testType] || "sctResult";
    console.log('🎯 뷰 전환:', targetView);
    setView(targetView);
    
    return data;
  }

  // ═══════════════════════════════════════════════════════
  // 🔑 API 설정 관리 함수 (관리자 전용)
  // ═══════════════════════════════════════════════════════

  // API 설정 목록 로드
  async function loadApiSettings() {
    try {
      const res = await fetch('/api/admin/api-settings');
      const data = await res.json();
      if (data.success) setApiSettings(data.data || []);
    } catch (e) {
      console.error('API 설정 로드 실패:', e);
    }
  }

  // API 키 저장
  async function saveApiSetting() {
    if (!apiSettingForm.key_value.trim()) {
      setApiSettingMsg({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }
    setApiSettingLoading(true);
    setApiSettingMsg({ type: '', text: '' });
    setApiTestResult({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/api-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify(apiSettingForm)
      });
      const data = await res.json();
      if (data.success) {
        setApiSettingMsg({ type: 'success', text: '✅ ' + data.message });
        setApiSettingForm(f => ({ ...f, key_value: '' }));
        setShowApiKeyInput(false);
        await loadApiSettings();
      } else {
        setApiSettingMsg({ type: 'error', text: '❌ ' + (data.error || '저장 실패') });
      }
    } catch (e) {
      setApiSettingMsg({ type: 'error', text: '❌ 서버 오류: ' + e.message });
    } finally {
      setApiSettingLoading(false);
    }
  }

  // API 키 연결 테스트
  async function testApiConnection() {
    setApiTestLoading(true);
    setApiTestResult({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/api-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({
          key_name: apiSettingForm.key_name,
          key_value: apiSettingForm.key_value || undefined
        })
      });
      const data = await res.json();
      setApiTestResult({
        type: data.success ? 'success' : 'error',
        text: data.success ? data.message : '❌ ' + (data.error || '연결 실패')
      });
    } catch (e) {
      setApiTestResult({ type: 'error', text: '❌ 서버 오류: ' + e.message });
    } finally {
      setApiTestLoading(false);
    }
  }

  // API 키 비활성화
  async function deactivateApiKey(keyName) {
    if (!confirm(`${keyName} 키를 비활성화하시겠습니까?\nAI 분석 기능이 중단됩니다.`)) return;
    try {
      const res = await fetch(`/api/admin/api-settings/${keyName}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApiSettingMsg({ type: 'success', text: '✅ ' + data.message });
        await loadApiSettings();
      }
    } catch (e) {
      setApiSettingMsg({ type: 'error', text: '❌ 비활성화 실패' });
    }
  }

  // ═══════════════════════════════════════════════════════
  // 🤖 AI 실시간 분석 (Claude API 스트리밍) - 공통 함수
  // ═══════════════════════════════════════════════════════
  async function runAiAnalysis(key, testType, responses, category) {
    const counselingType = activeLinkData?.counselingType || "psychological";
    // B2C: AI 채팅 일일 횟수 제한 체크
    if (isAiChatExhausted()) {
      setShowAiLimitModal(true);
      return;
    }
    // ────────────────────────────────────────────────────────

    setAiLoading(p => ({ ...p, [key]: true }));
    setAiError(p => ({ ...p, [key]: "" }));
    setAiAnalysis(p => ({ ...p, [key]: "" }));
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ testType, counselingType, responses, category, lang })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("로그인이 필요합니다.");
        if (res.status === 429) throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        throw new Error(err.error || "서버 오류가 발생했습니다.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              full += parsed.delta.text;
              setAiAnalysis(p => ({ ...p, [key]: (p[key] || "") + parsed.delta.text }));
            }
          } catch {}
        }
      }
      if (full.trim()) saveReportData(testType, responses, full);   // 📄 리포트용 저장(실패해도 UX 무영향)
    } catch (e) {
      setAiError(p => ({ ...p, [key]: e.message || "AI 분석 중 오류가 발생했습니다." }));
    } finally {
      setAiLoading(p => ({ ...p, [key]: false }));
    }
  }

  // 📄 리포트용 저장 — 생성된 AI 해석 + 검사 결과.
  //    ⚠️ BIG5/LOST/DSI의 result_json은 마음커플·통합해석이 참조하는 기존 형태(진입 시 saveMap이 저장)라 덮어쓰지 않음.
  async function saveReportData(testType, responses, analysisText) {
    const hdr = { 'Content-Type': 'application/json', ...api._authHeader() };
    try {
      await fetch('/api/test/save-analysis', { method: 'POST', headers: hdr, body: JSON.stringify({ test_type: testType, ai_analysis: analysisText }) });
    } catch { /* 무시 */ }
    if (!['BIG5', 'LOST', 'DSI'].includes(testType)) {
      try {
        await fetch('/api/test/save-result', { method: 'POST', headers: hdr, body: JSON.stringify({ test_type: testType, result_json: responses }) });
      } catch { /* 무시 */ }
    }
  }

  // 📄 저장된 result_json → 리포트 상세 텍스트
  function summarizeReportResult(testType, r) {
    try {
      if (!r) return '';
      if (testType === 'BIG5')   return Object.entries(r).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k}: ${v}/5`).join('\n');
      if (testType === 'LOST')   return `유형: ${r.typeCode}${r.typeInfo?.name ? ` (${r.typeInfo.name})` : ''}\n` + Object.entries(r.axisAvg || {}).map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`).join('\n');
      if (testType === 'DSI')    return `총점: ${r.total}\n` + Object.entries(r.scales || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
      if (testType === 'DASS21') return ['depression', 'anxiety', 'stress'].map(k => r[k] ? `${k}: ${r[k].score}점 (${r[k].level})` : '').filter(Boolean).join('\n');
      if (testType === 'PHQ9' || testType === 'GAD7') return (r.items || []).map((it, i) => `${i + 1}. ${it.question}: ${it.score}점`).join('\n');
      if (testType === 'BURNOUT') return (r.domains || []).map(d => `${d.name}: ${d.score}/${d.max} (${d.level})`).join('\n');
      if (testType === 'RIASEC') return `우세 유형: ${r.dominant_type}\n` + Object.entries(r.scores || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
      if (testType === 'VALUES') return (r.top3 || []).map((v, i) => `${i + 1}위 ${v.label}: ${v.score}점`).join('\n');
      if (testType === 'SCT')    return Object.entries(r.byScale || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length + '문항' : v}`).join('\n');
      return '';
    } catch { return ''; }
  }

  // 검사↔게임 루프 계측 — 집계 전용. 실패해도 화면 동작에 영향 없음(fire-and-forget).
  function logLoopEvent(event, meta) {
    try {
      fetch('/api/loop-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ event, meta: meta || null }),
      }).catch(() => {});
    } catch { /* 계측 실패 무시 */ }
  }

  // ③ 검사 → 마음게임 개인화 처방. 검사 결과에 맞는 치유게임을 딥링크(openMaumGame(key))로 연결.
  //    game.maumful.com은 ?game=<key>를 받아 자동 진입 (garden·efmt·gratitude·tree·burnout·mood·focus·worry)
  function gamePrescription(testType, score) {
    const G = {
      garden:    { emoji: '🌱', name: t('마음의 정원', 'Mind Garden') },
      worry:     { emoji: '📦', name: t('걱정상자', 'Worry Box') },
      mood:      { emoji: '🎨', name: t('감정 수채화', 'Mood Palette') },
      burnout:   { emoji: '🔥', name: t('번아웃 회복', 'Burnout Recovery') },
      tree:      { emoji: '🌳', name: t('내면의 나무', 'Inner Tree') },
      gratitude: { emoji: '⭐', name: t('별빛 감사일기', 'Gratitude Diary') },
      focus:     { emoji: '🎯', name: t('마음 집중력', 'Focus Trainer') },
      efmt:      { emoji: '🌸', name: t('감정꽃 찾기', 'Emotion Bloom') },
    };
    const W = {
      gardenCBT:   t('나를 힘들게 하는 생각을 알아차리고 다르게 바라보는 연습(CBT)이에요.', 'Practice noticing and reframing the thoughts that weigh on you (CBT).'),
      worryBox:    t('머릿속을 맴도는 걱정을 밖에 꺼내 놓고 거리를 두는 연습이에요.', 'Put circling worries outside your head and step back from them.'),
      moodTrack:   t('매일 기분을 기록하면 다음 리포트의 변화 흐름이 훨씬 정확해져요.', 'Logging your mood daily makes the next report’s change trend far more accurate.'),
      burnoutRec:  t('소진된 에너지를 회복하는 짧은 루틴을 단계별로 따라가요.', 'Follow short step-by-step routines to restore drained energy.'),
      treeRoot:    t('관계 속에서 흔들리지 않는 나만의 뿌리를 키우는 시간이에요.', 'Grow roots that keep you steady inside close relationships.'),
      gratitudeRx: t('하루 한 가지 감사를 적는 것만으로 마음의 기본 온도가 올라가요.', 'One gratitude a day slowly raises your baseline warmth.'),
      focusRx:     t('산만해진 주의를 지금 이 순간으로 데려오는 짧은 훈련이에요.', 'A short drill to bring scattered attention back to the present.'),
      efmtRx:      t('내 감정에 정확한 이름을 붙이는 연습이에요.', 'Practice giving your feelings their precise names.'),
    };
    const RX = {
      PHQ9:    [['garden', 'gardenCBT'], ['mood', 'moodTrack']],
      GAD7:    [['worry', 'worryBox'], ['garden', 'gardenCBT']],
      DASS21:  [['garden', 'gardenCBT'], ['worry', 'worryBox']],
      BURNOUT: [['burnout', 'burnoutRec'], ['focus', 'focusRx']],
      DSI:     [['tree', 'treeRoot'], ['efmt', 'efmtRx']],
      SCT:     [['tree', 'treeRoot'], ['gratitude', 'gratitudeRx']],
      BIG5:    [['gratitude', 'gratitudeRx'], ['mood', 'moodTrack']],
      LOST:    [['efmt', 'efmtRx'], ['gratitude', 'gratitudeRx']],
      RIASEC:  [['focus', 'focusRx'], ['gratitude', 'gratitudeRx']],
      VALUES:  [['gratitude', 'gratitudeRx'], ['focus', 'focusRx']],
    };
    let list = RX[testType] || [['gratitude', 'gratitudeRx'], ['mood', 'moodTrack']];
    // 우울·불안이 중등도 이상이면 매일 기분 기록을 함께 권함(변화 추적이 중요해지는 구간)
    if ((testType === 'PHQ9' || testType === 'GAD7') && typeof score === 'number' && score >= 10 && !list.some(([k]) => k === 'mood')) {
      list = [...list, ['mood', 'moodTrack']];
    }
    return list.map(([key, why]) => ({ key, ...G[key], why: W[why] }));
  }

  // 🧩 통합 심층 해석 — 여러 검사를 종합 (/api/ai-analyze/integrated, 기존 runAiAnalysis와 별개)
  async function runIntegratedAnalysis() {
    // 게이팅은 서버가 판단(첫 1회 무료 → 이후 크레딧). 402면 구매 유도.
    setIntegratedLoading(true); setIntegratedErr(''); setIntegratedText('');
    try {
      const res = await fetch('/api/ai-analyze/integrated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ counselingType: counselingMode || 'psychological', lang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error(t('로그인이 필요합니다.', 'Login required.'));
        if (res.status === 429) throw new Error(t('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'Too many requests. Please try again shortly.'));
        if (res.status === 402) { setShowChargeView(true); setIntegratedLoading(false); return; }   // 무료 소진 → 이용권 구매
        throw new Error(err.error || t('서버 오류가 발생했습니다.', 'A server error occurred.'));
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              setIntegratedText(p => p + parsed.delta.text);
            }
          } catch {}
        }
      }
    } catch (e) {
      setIntegratedErr(e.message || t('AI 분석 중 오류가 발생했습니다.', 'An error occurred during analysis.'));
    } finally {
      setIntegratedLoading(false);
    }
  }

  // ⑩ 통합해석 품질 피드백 (👍/👎) — 실패해도 UX 무영향
  async function sendIntegratedFeedback(rating) {
    setIntegratedFeedback(rating);
    try {
      await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ feature: 'integrated', rating }),
      });
    } catch { /* 무시 */ }
  }

  // A: AI 해석 피드백 전송(공통) — feature 예: 'analyze:PHQ9'. reason은 down일 때만 선택. 실패해도 UX 무영향.
  async function sendAiFeedback(feature, rating, reason) {
    try {
      await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api._authHeader() },
        body: JSON.stringify({ feature, rating, reason: reason || undefined }),
      });
    } catch { /* 무시 */ }
  }

  // C: 해석 텍스트에서 [이어서 물어보기]/[Ask Next] 섹션의 질문(- 로 시작)을 파싱.
  //    반환: { body: 그 섹션을 제외한 본문, questions: [...] }
  function parseFollowups(text) {
    if (!text) return { body: '', questions: [] };
    const m = text.split(/\n?\s*\[(?:이어서 물어보기|Ask Next)\]\s*/);
    if (m.length < 2) return { body: text, questions: [] };
    const questions = m[1].split('\n')
      .map(l => l.replace(/^\s*[-·•]\s*/, '').trim())
      .filter(l => l.length > 0 && !/^\[/.test(l))
      .slice(0, 3);
    return { body: m[0].trimEnd(), questions };
  }

  // ── 마스터 전용 에러 로그 뷰어 ─────────────────────────
  function MasterDebugPanel() {
    const [open, setOpen] = React.useState(false);
    const [logs, setLogs] = React.useState([]);
    const [serverLogs, setServerLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('local');

    const loadLocal = () => setLogs([...(window.__ERR_LOG || [])]);
    const loadServer = async () => {
      setLoading(true);
      try { const res = await api._fetch('/api/debug/client-errors'); const d = await res.json(); setServerLogs(d.errors || []); }  // api.get 미존재 버그 수정
      catch { setServerLogs([]); }
      finally { setLoading(false); }
    };
    const onOpen = () => { loadLocal(); setOpen(true); };

    const errCount = (window.__ERR_LOG || []).length;

    if (!open) return (
      <button onClick={onOpen} title="Debug Log" style={{
        position:'fixed', bottom:80, right:16, zIndex:9999,
        width:40, height:40, borderRadius:'50%', border:'none',
        background: errCount > 0 ? '#DC2626' : '#6B7280',
        color:'white', fontSize:18, cursor:'pointer',
        boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>🐛</button>
    );

    const display = activeTab === 'local' ? logs : serverLogs;

    return (
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:16 }}
        onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div style={{ width:'100%', maxWidth:520, maxHeight:'85vh', background:'#1E1E1E', borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', color:'white', fontFamily:'monospace' }}>
          {/* 헤더 */}
          <div style={{ padding:'12px 16px', background:'#2D2D2D', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #444' }}>
            <span style={{ fontSize:14, fontWeight:700 }}>🐛 Error Log <span style={{ fontSize:11, color:'#888' }}>master only</span></span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { loadLocal(); if (activeTab === 'server') loadServer(); }} style={{ background:'#3D3D3D', border:'none', color:'#CCC', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>↺</button>
              <button onClick={() => { window.__ERR_LOG = []; setLogs([]); }} style={{ background:'#3D3D3D', border:'none', color:'#F87171', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>지우기</button>
              <button onClick={() => setOpen(false)} style={{ background:'#3D3D3D', border:'none', color:'#CCC', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>✕</button>
            </div>
          </div>
          {/* 탭 */}
          <div style={{ display:'flex', background:'#2D2D2D', borderBottom:'1px solid #444' }}>
            {[['local','로컬 (메모리)'],['server','서버 (KV 7일)']].map(([k,l]) => (
              <button key={k} onClick={() => { setActiveTab(k); if (k === 'server' && !serverLogs.length) loadServer(); }}
                style={{ flex:1, padding:'8px', border:'none', background: activeTab===k ? '#1E1E1E' : 'transparent', color: activeTab===k ? '#60A5FA' : '#888', fontSize:12, cursor:'pointer', borderBottom: activeTab===k ? '2px solid #60A5FA' : '2px solid transparent' }}>
                {l} ({k==='local' ? logs.length : serverLogs.length})
              </button>
            ))}
          </div>
          {/* 로그 */}
          <div style={{ flex:1, overflowY:'auto', padding:8 }}>
            {loading && <div style={{ textAlign:'center', color:'#888', padding:20, fontSize:12 }}>로딩 중...</div>}
            {!loading && display.length === 0 && <div style={{ textAlign:'center', color:'#4ADE80', padding:20, fontSize:12 }}>✓ 에러 없음</div>}
            {display.map((e, i) => (
              <div key={i} style={{ background:'#2D2D2D', borderRadius:8, padding:'8px 10px', marginBottom:6, borderLeft:`3px solid ${e.type==='error'?'#F87171':'#FB923C'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, color: e.type==='error'?'#F87171':'#FB923C', fontWeight:700 }}>{(e.type||'').toUpperCase()}</span>
                  <span style={{ fontSize:10, color:'#666' }}>{(e.t||e.time||'').slice(11,19)}</span>
                </div>
                <div style={{ fontSize:12, color:'#E5E7EB', wordBreak:'break-all', marginBottom:2 }}>{e.msg||e.message}</div>
                {(e.src||e.source) && <div style={{ fontSize:10, color:'#666' }}>{e.src||e.source}{e.line?`:${e.line}`:''}</div>}
                {e.stack && <details><summary style={{ fontSize:10, color:'#888', cursor:'pointer' }}>스택 ▸</summary><pre style={{ fontSize:10, color:'#9CA3AF', whiteSpace:'pre-wrap', margin:'4px 0 0', maxHeight:100, overflow:'auto' }}>{e.stack}</pre></details>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 외부 검사 결과 입력 + PDF AI 분석 (별도 컴포넌트 — hooks 규칙 준수)
  // hideTrigger=true: 트리거 버튼 숨김 (최상위 렌더링 시 사용)
  // externalShow/setExternalShow: 외부에서 모달 상태 제어 시 사용
  function ExternalResultSection({ onSaved, hideTrigger, externalShow, setExternalShow }) {
    const [_showModal, _setShowModal] = React.useState(false);
    const showModal = externalShow !== undefined ? externalShow : _showModal;
    const setShowModal = (v) => { _setShowModal(v); if (setExternalShow) setExternalShow(v); };
    const [tab, setTab] = React.useState('manual'); // 'manual' | 'pdf'
    // manual tab
    const [extType, setExtType] = React.useState('PHQ9');
    const [extScore, setExtScore] = React.useState('');
    const [extDate, setExtDate] = React.useState(new Date().toISOString().slice(0,10));
    const [extNote, setExtNote] = React.useState('');
    const [manualMsg, setManualMsg] = React.useState('');
    const [manualLoading, setManualLoading] = React.useState(false);
    // pdf tab
    const [pdfType, setPdfType] = React.useState('MBTI');
    const [pdfFile, setPdfFile] = React.useState(null);
    const [pdfStatus, setPdfStatus] = React.useState(''); // 'extracting' | 'ready' | 'analyzing' | 'done' | 'error'
    const [pdfText, setPdfText] = React.useState('');
    const [pdfPageCount, setPdfPageCount] = React.useState(0);
    const [pdfAnalysis, setPdfAnalysis] = React.useState('');
    const [pdfGames, setPdfGames] = React.useState([]);
    const [pdfFollowup, setPdfFollowup] = React.useState([]);
    const [pdfMsg, setPdfMsg] = React.useState('');

    const manualTypes = [
      { id:'PHQ9', label:'PHQ-9 우울' }, { id:'GAD7', label:'GAD-7 불안' },
      { id:'BURNOUT', label:'번아웃' }, { id:'BIG5', label:'Big5 성격' },
      { id:'DASS21', label:'DASS-21' }, { id:'DSI', label:'자아분화(DSI)' },
      { id:'LOST', label:'LOST 행동' }, { id:'CUSTOM', label:'기타' },
    ];
    const pdfTypes = [
      { id:'MBTI', label:'MBTI 성격유형' }, { id:'TCI', label:'TCI 기질/성격' },
      { id:'MMPI', label:'MMPI 다면적인성' }, { id:'RORSCHACH', label:'로샤 검사' },
      { id:'SCT', label:'문장완성검사(SCT)' }, { id:'HTP', label:'HTP 투사검사' },
      { id:'WAIS', label:'WAIS 지능검사' }, { id:'K-WISC', label:'K-WISC 아동지능' },
      { id:'ENNEAGRAM', label:'에니어그램' }, { id:'DISC', label:'DISC 행동유형' },
      { id:'HOLLAND', label:'홀랜드 진로' }, { id:'OTHER', label:'기타 전문검사' },
    ];
    const gamesMeta = {
      mood: { label:'감정 온도계', emoji:'🌡️' }, garden: { label:'마음 정원', emoji:'🌱' },
      efmt: { label:'감정꽃', emoji:'🌸' }, gratitude: { label:'감사 일기', emoji:'📖' },
      tree: { label:'마음나무', emoji:'🌳' }, burnout: { label:'번아웃 측정', emoji:'🔥' },
      worry: { label:'걱정 풍선', emoji:'🫧' }, focus: { label:'마음 집중력', emoji:'🎯' },
    };
    const followupMeta = {
      PHQ9:'😔 우울 자가점검', GAD7:'😰 불안 자가점검', BURNOUT:'🔥 번아웃', BIG5:'🌟 Big5 성격', LOST:'🧭 LOST', DSI:'🪞 자아분화',
    };

    const loadPdfJs = () => new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });

    const handlePdfFile = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== 'application/pdf') { setPdfMsg('PDF 파일만 첨부 가능합니다'); return; }
      if (file.size > 10 * 1024 * 1024) { setPdfMsg('파일 크기는 10MB 이하여야 합니다'); return; }
      setPdfFile(file); setPdfStatus('extracting'); setPdfMsg(''); setPdfText(''); setPdfAnalysis(''); setPdfGames([]); setPdfFollowup([]);
      try {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfPageCount(pdf.numPages);
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        if (fullText.trim().length < 50) {
          setPdfStatus('error');
          setPdfMsg('텍스트를 읽을 수 없어요. 이 PDF는 이미지로만 구성되어 있습니다.\n\n💡 해결 방법: 검사기관에 "텍스트 PDF"나 "디지털 결과지"를 요청하거나, 결과 내용을 직접 텍스트로 복사해 점수 입력 탭을 이용해 주세요.');
          return;
        }
        setPdfText(fullText);
        setPdfStatus('ready');
      } catch(err) {
        setPdfStatus('error');
        setPdfMsg('PDF 읽기 오류: ' + (err.message || '알 수 없는 오류'));
      }
    };

    const analyzePdf = async () => {
      if (!pdfText) return;
      setPdfStatus('analyzing'); setPdfMsg('');
      try {
        const res = await api._fetch('/api/test/analyze-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: pdfType, pdfText, fileName: pdfFile?.name }),
        });
        const data = await res.json();
        if (res.status === 402) {
          setPdfMsg(data.error || '크레딧이 부족합니다. 구매 후 이용해 주세요.');
          setPdfStatus('error');
        } else if (data.success) {
          setPdfAnalysis(data.analysis);
          setPdfGames(data.suggestedGames || []);
          setPdfFollowup(data.followUpTests || []);
          setPdfStatus('done');
        } else {
          setPdfMsg(data.error || '분석 실패');
          setPdfStatus('error');
        }
      } catch(e) {
        setPdfMsg('오류: ' + e.message);
        setPdfStatus('error');
      }
    };

    const submitManual = async () => {
      const scoreNum = parseInt(extScore, 10);
      if (isNaN(scoreNum) || scoreNum < 0) { setManualMsg('올바른 점수를 입력하세요'); return; }
      setManualLoading(true);
      try {
        const res = await api._fetch('/api/test/external-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: extType, score: scoreNum, note: extNote || undefined, conductedAt: extDate ? new Date(extDate).toISOString() : undefined }),
        });
        const data = await res.json();
        if (data.success) {
          setManualMsg('저장되었습니다!');
          setTimeout(() => { setShowModal(false); setManualMsg(''); setExtScore(''); setExtNote(''); onSaved && onSaved(); }, 1200);
        } else { setManualMsg(data.error || '저장 실패'); }
      } catch(e) { setManualMsg('오류가 발생했습니다'); }
      finally { setManualLoading(false); }
    };

    const closeModal = () => {
      setShowModal(false); setTab('manual'); setPdfFile(null); setPdfStatus('');
      setPdfText(''); setPdfAnalysis(''); setPdfGames([]); setPdfFollowup([]); setPdfMsg('');
      setManualMsg(''); setExtScore(''); setExtNote('');
      onSaved && onSaved();
    };

    return (
      <>
        {!hideTrigger && (
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowModal(true)}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-semibold">
              {t('📥 외부 검사 결과 입력 · AI 해석','📥 Enter External Results · AI Analysis')}
            </button>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
              {/* 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
                <h3 className="font-bold text-gray-800 text-base">📥 외부 검사 결과</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              </div>
              {/* 탭 */}
              <div className="flex border-b border-gray-100 px-5 pt-3">
                {[['manual','✏️ 점수 직접 입력'],['pdf','📄 PDF 업로드 + AI 해석']].map(([t,l]) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition mr-2 ${tab===t ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* ── 수동 입력 탭 ── */}
                {tab === 'manual' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">검사 점수를 직접 입력하면 트렌드 차트에 기록됩니다.</p>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">검사 유형</label>
                      <select value={extType} onChange={e => setExtType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                        {manualTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">점수</label>
                      <input type="number" value={extScore} onChange={e => setExtScore(e.target.value)} placeholder="숫자 입력" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">검사 날짜</label>
                      <input type="date" value={extDate} onChange={e => setExtDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">메모 (선택)</label>
                      <textarea value={extNote} onChange={e => setExtNote(e.target.value)} placeholder="검사 기관, 특이사항 등..." rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
                    </div>
                    {manualMsg && <p className={`text-xs text-center font-semibold ${manualMsg.includes('저장') ? 'text-green-600' : 'text-red-500'}`}>{manualMsg}</p>}
                    <button onClick={submitManual} disabled={manualLoading || !extScore} className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white text-sm font-bold py-2.5 rounded-xl transition">
                      {manualLoading ? '저장 중...' : '결과 저장하기'}
                    </button>
                  </div>
                )}

                {/* ── PDF 탭 ── */}
                {tab === 'pdf' && (
                  <div>
                    {pdfStatus !== 'done' && (
                      <>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 text-xs text-indigo-700 leading-relaxed">
                          <p className="font-bold mb-1">📄 지원 검사 예시</p>
                          <p>MBTI · TCI · MMPI · 로샤 · SCT · HTP · WAIS · 에니어그램 · DISC · 홀랜드 등</p>
                          <p className="mt-1 text-indigo-500">※ 병원·검사기관에서 컴퓨터로 출력한 PDF는 대부분 바로 분석됩니다. 종이를 스캔한 PDF는 분석이 어려울 수 있습니다.</p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">검사 종류</label>
                            <select value={pdfType} onChange={e => setPdfType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                              {pdfTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">PDF 파일 첨부</label>
                            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition ${pdfFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                              {pdfStatus === 'extracting' ? (
                                <><span className="text-2xl animate-spin">⚙️</span><span className="text-xs text-gray-500">텍스트 추출 중...</span></>
                              ) : pdfStatus === 'ready' ? (
                                <><span className="text-2xl">✅</span><span className="text-xs font-semibold text-indigo-700">{pdfFile?.name}</span><span className="text-xs text-gray-400">{pdfPageCount}페이지 · {Math.round(pdfText.length/1000)}K 자 추출됨</span></>
                              ) : pdfStatus === 'error' ? (
                                <><span className="text-2xl">❌</span><span className="text-xs text-red-500 text-center">{pdfMsg}</span><span className="text-xs text-gray-400 mt-1">다른 파일을 선택하려면 여기를 클릭하세요</span></>
                              ) : (
                                <><span className="text-3xl">📂</span><span className="text-sm font-semibold text-gray-600">PDF 파일 선택</span><span className="text-xs text-gray-400">최대 10MB</span></>
                              )}
                              <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfFile} />
                            </label>
                          </div>
                        </div>
                        {pdfStatus === 'ready' && (
                          <button onClick={analyzePdf} className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                            ✨ AI 해석 시작 (3 크레딧)
                          </button>
                        )}
                        {pdfStatus === 'analyzing' && (
                          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                              {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:d+'ms'}}/>)}
                            </div>
                            <p className="text-sm text-indigo-700 font-semibold">AI가 검사 결과를 분석 중입니다...</p>
                            <p className="text-xs text-indigo-400 mt-1">약 20~30초 소요됩니다</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* 분석 결과 */}
                    {pdfStatus === 'done' && (
                      <div>
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">✨</span>
                            <span className="font-bold text-indigo-800 text-sm">AI 해석 결과 — {pdfTypes.find(t=>t.id===pdfType)?.label}</span>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {pdfAnalysis.split('**').map((part, i) =>
                              i % 2 === 1 ? <strong key={i} className="text-indigo-800">{part}</strong> : part
                            )}
                          </div>
                          <p className="text-xs text-indigo-400 mt-3 border-t border-indigo-100 pt-2">
                            ⚠️ 이 해석은 비임상적 참고 정보입니다. 정확한 해석은 전문가와 상담하세요.
                          </p>
                        </div>

                        {/* 추천 게임 */}
                        {pdfGames.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold text-gray-600 mb-2">🎮 결과 맞춤 마음풀 게임</p>
                            <div className="grid grid-cols-2 gap-2">
                              {pdfGames.filter(g => gamesMeta[g]).map(g => (
                                <button key={g} onClick={() => { closeModal(); openMaumGame(g); }}
                                  className="flex items-center gap-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl px-3 py-2.5 text-left transition">
                                  <span className="text-xl">{gamesMeta[g]?.emoji}</span>
                                  <div>
                                    <div className="text-xs font-semibold text-gray-700">{gamesMeta[g]?.label}</div>
                                    <div className="text-xs text-emerald-600">바로 시작 →</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 마음풀 검사 연결 */}
                        {pdfFollowup.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold text-gray-600 mb-2">📋 연결 검사 (더 깊이 알아보기)</p>
                            <div className="flex flex-wrap gap-2">
                              {pdfFollowup.filter(t => followupMeta[t]).map(t => (
                                <button key={t} onClick={() => { closeModal(); startSelectedTest(t); }}
                                  className="text-xs bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl transition font-semibold">
                                  {followupMeta[t]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 재분석 */}
                        <button onClick={() => { setPdfStatus(''); setPdfFile(null); setPdfText(''); setPdfAnalysis(''); setPdfGames([]); setPdfFollowup([]); }}
                          className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 border border-gray-200 rounded-xl transition">
                          다른 파일 분석하기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 맞춤 8주 CBT 자기관리 플랜 카드
  function CbtPlanCard({ testHistory, onPlay }) {
    const [plan, setPlan] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const [doneWeeks, setDoneWeeks] = React.useState(() => {
      try { return JSON.parse(localStorage.getItem('cbt_done_weeks') || '[]'); } catch { return []; }
    });
    const [expandedWeek, setExpandedWeek] = React.useState(null);

    const GAME_NAMES = {
      mood:'😊 감정 체크인', garden:'🌿 마음의 정원', efmt:'🌸 감정꽃',
      gratitude:'🙏 감사 일기', burnout:'🔋 번아웃 회복', focus:'🧠 집중력 훈련',
      worry:'🫧 걱정 풍선', tree:'🌲 마음 나무',
    };

    const hasEligibleTest = (testHistory || []).some(h =>
      ['PHQ9','GAD7','BURNOUT','DASS21'].includes(h.test_type)
    );
    if (!hasEligibleTest) return null;

    async function loadPlan() {
      if (plan) { setExpanded(e => !e); return; }
      setLoading(true); setExpanded(true);
      try {
        const r = await fetch('/api/test/cbt-plan', { headers: api._authHeader() });
        const d = await r.json();
        if (d.success) setPlan(d);
      } catch {}
      setLoading(false);
    }

    function toggleWeekDone(week) {
      setDoneWeeks(prev => {
        const next = prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week];
        localStorage.setItem('cbt_done_weeks', JSON.stringify(next));
        return next;
      });
    }

    const completedCount = doneWeeks.filter(w => w >= 1 && w <= 8).length;
    const progress = Math.round((completedCount / 8) * 100);

    return (
      <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden mb-4 shadow-sm">
        <button onClick={loadPlan} className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div className="text-left">
              <div className="font-bold text-emerald-800 text-sm">{t('맞춤 8주 자기관리 플랜','Personalized 8-Week Self-Care Plan')}</div>
              {plan
                ? <div className="text-xs text-emerald-600 mt-0.5">{completedCount}/{t('8주 진행 중','wks done')} · {progress}% {t('완료','complete')}</div>
                : <div className="text-xs text-gray-400 mt-0.5">{t('검사 결과 기반 AI 맞춤 8주 플랜','AI-personalized 8-week plan based on your results')}</div>
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plan && (
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width:`${progress}%`}} />
              </div>
            )}
            <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>
        {expanded && (
          <div className="border-t border-emerald-100">
            {loading && (
              <div className="flex items-center justify-center py-8 gap-2 text-emerald-600">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t('AI가 맞춤 플랜을 생성 중이에요...','AI is generating your personalized plan...')}</span>
              </div>
            )}
            {plan && !loading && (
              <>
                {plan.summary && (
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                    <div className="text-xs text-emerald-700 leading-relaxed mb-2">{plan.summary}</div>
                    {plan.scores && Object.keys(plan.scores).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(plan.scores).map(([type, score]) => {
                          const cMap = { PHQ9:'#0EA5E9', GAD7:'#8B5CF6', BURNOUT:'#F97316', DASS21:'#EC4899' };
                          const nMap = lang === 'en'
                            ? { PHQ9:'Depression', GAD7:'Anxiety', BURNOUT:'Burnout', DASS21:'Stress' }
                            : { PHQ9:'우울', GAD7:'불안', BURNOUT:'번아웃', DASS21:'스트레스' };
                          const c = cMap[type] || '#6B7280';
                          return (
                            <span key={type} style={{ background:`${c}18`, border:`1px solid ${c}35`, borderRadius:6, padding:'2px 7px', fontSize:10, color:c, fontWeight:700 }}>
                              {nMap[type]||type} {score}{t('점','pts')}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="divide-y divide-gray-50">
                  {(plan.plan || []).map(wk => {
                    const done = doneWeeks.includes(wk.week);
                    const isOpen = expandedWeek === wk.week;
                    return (
                      <div key={wk.week} className={`transition ${done ? 'bg-emerald-50' : 'bg-white'}`}>
                        <button
                          onClick={() => setExpandedWeek(isOpen ? null : wk.week)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-emerald-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {done ? '✓' : wk.week}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm ${done ? 'text-emerald-700 line-through opacity-70' : 'text-gray-800'}`}>{wk.title}</div>
                            <div className="text-xs text-gray-400 truncate">{wk.theme}</div>
                          </div>
                          <span className="text-gray-300 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-2">
                            <div className="bg-blue-50 rounded-xl px-3 py-2">
                              <div className="text-xs font-bold text-blue-700 mb-0.5">{t('매일 실천','Daily Practice')}</div>
                              <div className="text-xs text-blue-800">{wk.practice}</div>
                            </div>
                            {wk.game && GAME_NAMES[wk.game] && (
                              <button
                                onClick={() => onPlay && onPlay(wk.game)}
                                className="w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl px-3 py-2 text-left transition"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-emerald-700 mb-0.5">{t('추천 게임','Recommended Game')}</div>
                                  <div className="text-xs text-emerald-400">▶ {t('시작','Start')}</div>
                                </div>
                                <div className="text-xs text-emerald-800">{GAME_NAMES[wk.game]}</div>
                                <div className="text-xs text-emerald-500 mt-0.5 opacity-70">{t(`검사 결과 기반 · ${wk.week}주차 맞춤`,`Based on results · Week ${wk.week}`)}</div>
                              </button>
                            )}
                            {wk.tip && (
                              <div className="text-xs text-gray-500 italic px-1">💚 {wk.tip}</div>
                            )}
                            <button
                              onClick={() => toggleWeekDone(wk.week)}
                              className={`w-full mt-1 py-2 rounded-xl text-xs font-bold transition ${done ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                            >
                              {done ? t('↩ 완료 취소','↩ Undo') : t('✅ 이번 주 완료','✅ Complete Week')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {progress === 100 && (
                  <div className="px-4 py-4 bg-emerald-500 text-white text-center text-sm font-bold">
                    {t('🎉 8주 플랜 완주! 꾸준한 실천이 빛났어요!','🎉 8-Week Plan Complete! Your consistency paid off!')}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  function TrendSparkline({ data, predicted, testType }) {
    if (!data || data.length < 2) return null;
    const allS = [...data.map(d => d.score), predicted];
    const maxS = Math.max(...allS, 10);
    const minS = Math.max(0, Math.min(...allS) - 5);
    const rng = maxS - minS || 10;
    const W = 255, H = 60, LX = 28, TY = 8;
    const cols = { PHQ9:'#0EA5E9', GAD7:'#8B5CF6', BURNOUT:'#F97316' };
    const col = cols[testType] || '#0EA5E9';
    const toX = (i) => LX + (i / data.length) * W;
    const toY = (s) => TY + ((maxS - s) / rng) * H;
    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.score), s: d.score, date: d.performed_at }));
    const predX = toX(data.length), predY = toY(predicted);
    const pathD = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return (
      React.createElement('svg', { viewBox:'0 0 300 88', width:'100%', height:'80', style:{ display:'block', marginTop:8, marginBottom:2 } },
        [0.25, 0.5, 0.75].map(t =>
          React.createElement('line', { key:t, x1:LX, x2:LX+W+18, y1:TY+t*H, y2:TY+t*H, stroke:'#E0F2FE', strokeWidth:1 })
        ),
        React.createElement('path', { d:pathD, fill:'none', stroke:col, strokeWidth:'2.5', strokeLinejoin:'round' }),
        React.createElement('line', { x1:pts[pts.length-1].x, y1:pts[pts.length-1].y, x2:predX, y2:predY,
          stroke:col, strokeWidth:'1.5', strokeDasharray:'4,3', opacity:'0.5' }),
        pts.map((p, i) =>
          React.createElement(React.Fragment, { key:i },
            React.createElement('circle', { cx:p.x, cy:p.y, r:4, fill:col }),
            React.createElement('text', { x:p.x, y:p.y-8, textAnchor:'middle', fontSize:9, fill:'#475569' }, p.s),
            (i===0 || i===pts.length-1) && React.createElement('text', { x:p.x, y:86, textAnchor:'middle', fontSize:8, fill:'#94A3B8' }, p.date.slice(5,10))
          )
        ),
        React.createElement('circle', { cx:predX, cy:predY, r:5, fill:'white', stroke:col, strokeWidth:2, opacity:'0.8' }),
        React.createElement('text', { x:predX, y:predY-9, textAnchor:'middle', fontSize:9, fill:col, fontWeight:'700' }, predicted+'?'),
        React.createElement('text', { x:predX, y:86, textAnchor:'middle', fontSize:8, fill:col, opacity:'0.8' }, '예측')
      )
    );
  }

  // 결과 공유 버튼 컴포넌트 (Web Share API / clipboard fallback)
  function TrendPredictionCard({ testType, onStartTest }) {
    const [pred, setPred] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const labelMap = { PHQ9:'PHQ-9 우울', GAD7:'GAD-7 불안', BURNOUT:'번아웃' };
    const emojiMap = { PHQ9:'😔', GAD7:'😰', BURNOUT:'🔥' };

    async function load() {
      if (pred || loading) { setExpanded(e => !e); return; }
      setLoading(true);
      setExpanded(true);
      try {
        const r = await fetch(`/api/test/trend-prediction?type=${testType}`, { headers: api._authHeader() });
        const d = await r.json();
        if (d.success) setPred(d);
      } catch {}
      setLoading(false);
    }

    const trendColor = pred?.trend === '호전' ? '#16a34a' : pred?.trend === '악화' ? '#dc2626' : '#6b7280';
    const trendEmoji = pred?.trend === '호전' ? '📉' : pred?.trend === '악화' ? '📈' : '➡️';

    return (
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 mb-4">
        <button onClick={load} className="w-full text-left flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emojiMap[testType]}</span>
            <div>
              <p className="text-sm font-bold text-sky-800">{labelMap[testType]} 트렌드 예측</p>
              <p className="text-xs text-sky-500">지금까지의 변화 흐름으로 다음 상태를 예측해요</p>
            </div>
          </div>
          <span className="text-sky-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-sky-100">
            {loading && <p className="text-xs text-sky-400 text-center py-2">예측 분석 중...</p>}
            {pred && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">예측 점수</p>
                    <p className="text-2xl font-black" style={{ color: trendColor }}>{pred.predicted}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: trendColor }}>
                      {trendEmoji} {pred.trend} 추세 · {pred.diffText}
                    </p>
                    {pred.comment && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{pred.comment}</p>
                    )}
                  </div>
                </div>
                <TrendSparkline data={pred.data} predicted={pred.predicted} testType={testType} />
                <button onClick={onStartTest}
                  className="w-full mt-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition">
                  📋 {labelMap[testType]} 재검사하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function ShareResultButton({ text, testLabel, scoreText, levelText, colorHex }) {
    async function shareAsImage() {
      try {
        const W = 800, H = 450;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 배경 그라디언트
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, colorHex || '#1B4332');
        bg.addColorStop(1, '#2D6A4F');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // 반투명 카드
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        const [cx, cy, cw, ch, cr] = [40, 40, W - 80, H - 80, 20];
        ctx.moveTo(cx + cr, cy);
        ctx.lineTo(cx + cw - cr, cy); ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + cr);
        ctx.lineTo(cx + cw, cy + ch - cr); ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - cr, cy + ch);
        ctx.lineTo(cx + cr, cy + ch); ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - cr);
        ctx.lineTo(cx, cy + cr); ctx.quadraticCurveTo(cx, cy, cx + cr, cy);
        ctx.closePath(); ctx.fill();

        // 브랜드
        ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        ctx.fillText('마음풀', 72, 108);

        // 검사명
        ctx.font = '20px "Noto Sans KR", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillText(testLabel || '심리검사 결과', 72, 150);

        // 점수 (크게)
        ctx.font = 'bold 80px "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scoreText || '', 72, 265);

        // 레벨
        if (levelText) {
          ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText(levelText, 72, 315);
        }

        // 하단 구분선
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(72, 345); ctx.lineTo(W - 72, 345); ctx.stroke();

        // 푸터
        ctx.font = '16px "Noto Sans KR", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText(t('maumful.com  |  AI 마음 상담 플랫폼','maumful.com  |  AI Mental Wellness Platform'), 72, 378);

        await new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            if (!blob) { resolve(); return; }
            // 네이티브 파일 공유 시도
            if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'x.png', { type: 'image/png' })] })) {
              try {
                await navigator.share({ title: t('마음풀 검사 결과','Maumful Result'), files: [new File([blob], 'maumful-result.png', { type: 'image/png' })], text });
                resolve(); return;
              } catch {}
            }
            // fallback: 이미지 다운로드
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'maumful-result.png'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve();
          }, 'image/png');
        });
      } catch {
        // Canvas 실패 시 텍스트 공유 fallback
        if (navigator.share) navigator.share({ title: t('마음풀 검사 결과','Maumful Result'), text }).catch(() => {});
        else navigator.clipboard?.writeText(text).then(() => alert('클립보드에 복사됐어요!')).catch(() => {});
      }
    }

    function shareText() {
      if (navigator.share) navigator.share({ title: t('마음풀 검사 결과','Maumful Result'), text }).catch(() => {});
      else navigator.clipboard?.writeText(text).then(() => alert(t('클립보드에 복사됐어요!','Copied to clipboard!'))).catch(() => {});
    }

    return (
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={shareAsImage}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition border border-gray-200 hover:border-emerald-300">
          🖼️ {t("카드 공유","Share Card")}
        </button>
        <button onClick={shareText}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition border border-gray-200 hover:border-emerald-300">
          🔗 {t("링크 공유","Share Link")}
        </button>
      </div>
    );
  }

  // AI 분석 결과 박스 컴포넌트 (인라인)
  function AiAnalysisBox({ aiKey, onRun }) {
    const text = aiAnalysis[aiKey] || "";
    const loading = aiLoading[aiKey] || false;
    const error = aiError[aiKey] || "";
    const done = !loading && text.length > 0;
    // C: 후속질문 섹션은 본문에서 떼어내 칩으로. (스트리밍 중에도 raw 섹션 미노출)
    const { body: displayText, questions: followups } = parseFollowups(text);
    // 완료 시 한 번만 후속질문을 공유 state에 저장 → 아래 ChatBox가 칩으로 렌더
    React.useEffect(() => {
      if (done && followups.length && (followupQs[aiKey] || []).join('|') !== followups.join('|')) {
        setFollowupQs(p => ({ ...p, [aiKey]: followups }));
      }
    }, [done, text]);
    const fb = analysisFeedback[aiKey];  // undefined | 'up' | 'down'

    // B2C: 크레딧 기반 제한 (크레딧 없으면 무료 플랜)
    const isFree = !isLoggedIn || credits <= 0;
    const limit = isFree ? AI_LIMIT_FREE : null; // null = 크레딧 보유 시 무제한
    const remainingFree = limit != null ? Math.max(0, limit - aiChatUsed) : Infinity;

    // ── 유료 플랜 업그레이드 유도 (5회 초과) ──────────────
    if (error === "UPGRADE_REQUIRED") {
      return (
        <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm mb-1">{t("무료 AI 분석 횟수를 모두 사용했습니다","You've used all your free AI analyses")}</p>
              <p className="text-xs text-amber-700 mb-3">
                {t(<>무료 플랜은 AI 실시간 분석을 <strong>{AI_LIMIT_FREE}회</strong>까지 제공합니다.<br/>유료 플랜으로 업그레이드하면 <strong>무제한</strong>으로 사용할 수 있습니다.</>,<>The free plan includes <strong>{AI_LIMIT_FREE}</strong> AI analyses.<br/>Upgrade to a paid plan for <strong>unlimited</strong> access.</>)}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowChargeView(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow">
                  💎 {t("플랜 업그레이드","Upgrade Plan")}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const showButton = !text && !loading && !error;

    return (
      <div className="mt-4">
        {showButton && (
          <div className="flex items-center gap-3">
            <button onClick={onRun}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-violet-700 hover:to-green-700 transition shadow">
              ✨ {t("AI 실시간 분석","AI Live Analysis")}
            </button>
            {isFree && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                remainingFree <= 1 ? "bg-red-100 text-red-700"
                : remainingFree <= 3 ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
              }`}>
                {t(`무료 ${remainingFree}회 남음`,`${remainingFree} free left`)}
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></div>
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></div>
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></div>
              <span className="text-xs text-violet-600 font-semibold">{t("AI가 실시간으로 분석 중...","AI is analyzing...")}</span>
            </div>
            {text && (
              <p className="text-sm text-violet-800 whitespace-pre-wrap leading-relaxed">{displayText}<span className="inline-block w-1 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle"></span></p>
            )}
          </div>
        )}

        {done && (
          <div className="bg-gradient-to-br from-violet-50 to-green-50 border border-violet-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">✨</span>
                <p className="text-xs font-bold text-violet-700">{t("AI 실시간 분석 결과","AI Live Analysis")}</p>
              </div>
              <button onClick={() => setAiAnalysis(p => ({ ...p, [aiKey]: "" }))} className="text-xs text-violet-400 hover:text-violet-600">
                {t("다시 분석","Re-analyze")}
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{displayText}</p>

            {/* A: 해석 품질 피드백 (👍/👎 + 👎 사유) — 검사별 feature */}
            <div className="mt-3 pt-2.5 border-t border-violet-100">
              {!fb ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{t("이 해석이 도움이 됐나요?","Was this helpful?")}</span>
                  <button onClick={() => { setAnalysisFeedback(p => ({ ...p, [aiKey]: 'up' })); sendAiFeedback(`analyze:${aiKey}`, 'up'); }}
                    className="text-sm hover:scale-110 transition" title={t("도움됨","Helpful")}>👍</button>
                  <button onClick={() => setAnalysisFeedback(p => ({ ...p, [aiKey]: 'down' }))}
                    className="text-sm hover:scale-110 transition" title={t("아쉬움","Not helpful")}>👎</button>
                </div>
              ) : fb === 'up' ? (
                <span className="text-xs text-green-600">{t("의견 고마워요 🙂","Thanks for your feedback 🙂")}</span>
              ) : fb === 'done' ? (
                <span className="text-xs text-gray-400">{t("의견이 반영에 도움이 돼요. 고마워요.","Thanks — this helps us improve.")}</span>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-gray-400 mr-1">{t("어떤 점이 아쉬웠나요?","What was off?")}</span>
                  {[['generic',t('너무 일반적','Too generic')],['mismatch',t('내 결과와 안 맞음','Doesn’t fit me')],['long',t('너무 길다','Too long')],['other',t('기타','Other')]].map(([r,label]) => (
                    <button key={r} onClick={() => { sendAiFeedback(`analyze:${aiKey}`, 'down', r); setAnalysisFeedback(p => ({ ...p, [aiKey]: 'done' })); }}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 transition">{label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && error !== "UPGRADE_REQUIRED" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-600 mb-1">⚠️ {t("오류","Error")}</p>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={onRun} className="mt-2 text-xs text-red-600 underline hover:text-red-800">{t("다시 시도","Retry")}</button>
          </div>
        )}
      </div>
    );
  }

  // ✅ SCT AI 권장사항 생성 (룰 기반 - 상담 유형별)
  function generateSctRecommendation(cat, nums) {
    
    // 응답 수집
    const responses = nums.map(n => ({
      question: sdriCompletionQ.find(q=>q.num===Number(n))?.prompt || n,
      answer: srciResponses[n] || "(미응답)"
    }));
    
    // 키워드 분석
    const allText = responses.map(r => r.answer).join(" ").toLowerCase();
    
    // 상담 유형에 따라 분석 분기
    let analysis = "";
    let recommendations = [];
    
    if (counselingType === "biblical") {
      // 🕊️ 기독교 상담 분석
      analysis = generateBiblicalSctAnalysis(cat, allText);
      recommendations = generateBiblicalSctRecommendations(cat, allText);
    } else {
      // 🧠 심리상담 분석 (기존 로직)
      analysis = generatePsychologicalSctAnalysis(cat, allText);
      recommendations = generatePsychologicalSctRecommendations(allText);
    }
    
    const finalSummary = analysis + (recommendations.length > 0 ? "\n\n[권장사항]\n" + recommendations.join("\n") : "");
    
    setTimeout(() => {
      setSctSummaries(p => ({ ...p, [cat]: finalSummary }));
      setLoadingSummary(p => ({ ...p, [cat]: false }));
    }, 800);
  }

  // 🧠 심리상담 SCT 분석
  function generatePsychologicalSctAnalysis(cat, allText) {
    let analysis = "";
    
    if (cat.includes("어머니")) {
      if (allText.includes("좋") || allText.includes("사랑") || allText.includes("따뜻")) {
        analysis = "어머니와의 관계가 긍정적으로 형성되어 있습니다. 애착 관계가 안정적이며, 이는 대인관계 형성의 긍정적 기반이 됩니다.";
      } else if (allText.includes("힘들") || allText.includes("어렵") || allText.includes("갈등")) {
        analysis = "어머니와의 관계에서 일부 어려움이 관찰됩니다. 이는 정서적 지지 체계 강화가 필요함을 시사합니다. 상담을 통한 관계 개선이 도움이 될 수 있습니다.";
      } else {
        analysis = "어머니와의 관계에 대한 복합적인 감정이 나타납니다. 애착 패턴을 탐색하고 긍정적 측면을 강화하는 것이 도움이 될 수 있습니다.";
      }
    } else if (cat.includes("아버지")) {
      if (allText.includes("존경") || allText.includes("좋") || allText.includes("따뜻")) {
        analysis = "아버지와의 관계가 긍정적입니다. 권위 인물에 대한 건강한 태도가 형성되어 있으며, 이는 사회적응에 긍정적 영향을 줍니다.";
      } else if (allText.includes("무섭") || allText.includes("엄격") || allText.includes("거리")) {
        analysis = "아버지와의 관계에서 심리적 거리감이 느껴집니다. 권위에 대한 양가감정이 있을 수 있으며, 이는 상담을 통해 탐색할 필요가 있습니다.";
      } else {
        analysis = "아버지 상에 대한 다층적인 인식이 나타납니다. 권위 관계에 대한 이해를 심화하는 것이 성장에 도움이 될 수 있습니다.";
      }
    } else if (cat.includes("가족")) {
      if (allText.includes("화목") || allText.includes("행복") || allText.includes("사랑")) {
        analysis = "가족 관계가 전반적으로 긍정적입니다. 안정적인 가족 기반은 심리적 안녕감의 중요한 자원입니다.";
      } else if (allText.includes("갈등") || allText.includes("힘들") || allText.includes("불화")) {
        analysis = "가족 내 역동에 어려움이 있는 것으로 보입니다. 가족 상담이나 의사소통 개선이 도움이 될 수 있습니다.";
      } else {
        analysis = "가족 관계에 대한 복합적 인식이 나타납니다. 가족 내 자신의 역할과 위치를 재정립하는 것이 도움이 될 수 있습니다.";
      }
    } else if (cat.includes("두려움")) {
      if (allText.includes("없") || allText.includes("괜찮")) {
        analysis = "불안 수준이 낮고 심리적 안정감이 양호합니다. 현재의 대처 방식을 유지하는 것이 좋습니다.";
      } else if (allText.includes("실패") || allText.includes("거절") || allText.includes("혼자")) {
        analysis = "특정 영역에 대한 불안감이 나타날 수 있습니다. 이는 자존감과 연결될 수 있으며, 인지행동(CBT) 기반 접근이 도움이 될 수 있습니다.";
      } else {
        analysis = "다양한 두려움 요인이 나타납니다. 불안 관리 기법을 학습하고 대처 자원을 강화하는 것이 권장됩니다.";
      }
    } else if (cat.includes("죄책감")) {
      if (allText.includes("없") || allText.includes("후회")) {
        analysis = "죄책감이 적절한 수준으로 관리되고 있습니다. 자기 성찰 능력이 있으나 과도하지 않습니다.";
      } else if (allText.includes("많") || allText.includes("미안") || allText.includes("잘못")) {
        analysis = "죄책감 수준이 다소 높게 나타납니다. 자기 비난 패턴을 탐색하고 자기 용서를 연습하는 것이 도움이 될 수 있습니다.";
      } else {
        analysis = "죄책감에 대한 복합적 인식이 나타납니다. 과거 경험을 재해석하고 수용하는 과정이 필요할 수 있습니다.";
      }
    } else if (cat.includes("능력")) {
      if (allText.includes("잘") || allText.includes("자신") || allText.includes("능력")) {
        analysis = "자기 효능감이 양호합니다. 자신의 능력에 대한 긍정적 인식은 목표 달성의 중요한 자원입니다.";
      } else if (allText.includes("부족") || allText.includes("못") || allText.includes("없")) {
        analysis = "자기 효능감이 다소 낮게 나타납니다. 작은 성공 경험을 축적하고 강점을 재발견하는 것이 도움이 될 수 있습니다.";
      } else {
        analysis = "자기 능력에 대한 현실적 평가가 나타납니다. 강점을 더욱 발전시키고 약점을 보완하는 균형적 접근이 권장됩니다.";
      }
    } else if (cat.includes("미래")) {
      if (allText.includes("밝") || allText.includes("희망") || allText.includes("기대")) {
        analysis = "미래에 대한 낙관적 태도가 나타납니다. 긍정적 미래 전망은 현재의 동기와 에너지를 높입니다.";
      } else if (allText.includes("불안") || allText.includes("걱정") || allText.includes("어두")) {
        analysis = "미래에 대한 불안감이 관찰됩니다. 구체적 목표 설정과 단계적 계획이 불안을 감소시킬 수 있습니다.";
      } else {
        analysis = "미래에 대한 현실적 태도가 나타납니다. 희망과 준비를 균형있게 유지하는 것이 중요합니다.";
      }
    } else if (cat.includes("목표")) {
      if (allText.includes("명확") || allText.includes("계획") || allText.includes("꿈")) {
        analysis = "목표가 명확하고 동기 수준이 양호합니다. 구체적 실행 계획을 수립하면 목표 달성 가능성이 높습니다.";
      } else if (allText.includes("모르") || allText.includes("없") || allText.includes("막연")) {
        analysis = "목표가 불명확한 상태입니다. 자기 탐색을 통해 가치관과 방향성을 명료화하는 것이 필요합니다.";
      } else {
        analysis = "목표에 대한 탐색 과정에 있습니다. 다양한 가능성을 열어두고 점진적으로 방향을 설정하는 것이 도움이 됩니다.";
      }
    } else {
      analysis = "이 영역에 대한 응답을 종합적으로 분석한 결과, 개인의 고유한 경험과 인식이 반영되어 있습니다. 상담을 통해 더 깊이 탐색할 수 있습니다.";
    }
    
    return analysis;
  }
  
  // 🧠 심리상담 SCT 권장사항
  function generatePsychologicalSctRecommendations(allText) {
    const recommendations = [];
    if (allText.includes("힘들") || allText.includes("어렵") || allText.includes("갈등")) {
      recommendations.push("• 정기적인 심리 상담을 통한 감정 표현 및 해소");
      recommendations.push("• 인지행동(CBT) 관점에서 사고 패턴 돌아보기");
    }
    if (allText.includes("불안") || allText.includes("걱정") || allText.includes("두렵")) {
      recommendations.push("• 이완 훈련 및 마음챙김 명상 실천");
      recommendations.push("• 불안 관리 기법 학습 (복식호흡, 점진적 근육 이완)");
    }
    if (allText.includes("없") || allText.includes("모르")) {
      recommendations.push("• 자기 탐색 활동 및 가치관 명료화 작업");
      recommendations.push("• 진로 상담 및 심리검사를 통한 자기 이해");
    }
    if (allText.includes("우울") || allText.includes("슬프") || allText.includes("의욕")) {
      recommendations.push("• 우울감 관리를 위한 행동 활성화 전략");
      recommendations.push("• 규칙적인 운동과 충분한 수면");
    }
    return recommendations;
  }
  
  // 🕊️ 기독교 상담 SCT 분석
  function generateBiblicalSctAnalysis(cat, allText) {
    let analysis = "";
    
    if (cat.includes("어머니")) {
      if (allText.includes("좋") || allText.includes("사랑") || allText.includes("따뜻")) {
        analysis = "어머니와의 관계에서 하나님의 사랑과 돌보심이 반영되어 있습니다. '어머니가 자식을 위로함같이 내가 너희를 위로하리니'(이사야 66:13)라는 말씀처럼, 건강한 어머니상은 하나님의 사랑을 경험하는 통로가 됩니다.";
      } else if (allText.includes("힘들") || allText.includes("어렵") || allText.includes("갈등")) {
        analysis = "어머니와의 관계에서 어려움이 있지만, 하나님께서는 '고아의 아버지'(시편 68:5)이시며 모든 관계의 상처를 치유하실 수 있습니다. 용서와 화해의 과정을 통해 하나님의 회복을 경험할 수 있습니다.";
      } else {
        analysis = "어머니와의 관계에 대한 복합적인 감정이 나타납니다. 이는 모든 인간 관계의 불완전함을 보여주며, 완전한 사랑은 오직 하나님 안에서만 발견됩니다(요한일서 4:19).";
      }
    } else if (cat.includes("아버지")) {
      if (allText.includes("존경") || allText.includes("좋") || allText.includes("따뜻")) {
        analysis = "아버지와의 긍정적 관계는 하늘 아버지를 이해하는 데 도움이 됩니다. '아버지께서 자식을 긍휼히 여기심같이 여호와께서는 자기를 경외하는 자를 긍휼히 여기시나니'(시편 103:13).";
      } else if (allText.includes("무섭") || allText.includes("엄격") || allText.includes("거리")) {
        analysis = "아버지와의 관계에서 두려움이나 거리감이 느껴지지만, 하나님 아버지는 '사랑의 아버지시오 모든 위로의 하나님이시며'(고린도후서 1:3) 우리를 완전히 받아주십니다. 땅의 아버지의 불완전함이 하늘 아버지의 완전한 사랑을 가리지 않도록 기도가 필요합니다.";
      } else {
        analysis = "아버지 상에 대한 다층적인 인식이 나타납니다. 하나님은 완전한 아버지이시며, 땅의 아버지와의 관계를 통해 하나님의 아버지 되심을 더 깊이 이해할 수 있습니다.";
      }
    } else if (cat.includes("가족")) {
      if (allText.includes("화목") || allText.includes("행복") || allText.includes("사랑")) {
        analysis = "가족 관계가 전반적으로 긍정적입니다. '보라 형제가 연합하여 동거함이 어찌 그리 선하고 아름다운고'(시편 133:1). 감사함으로 이 축복을 지키고 더욱 발전시켜 나가세요.";
      } else if (allText.includes("갈등") || allText.includes("힘들") || allText.includes("불화")) {
        analysis = "가족 내 어려움이 있지만, '그리스도의 평강이 너희 마음을 주장하게 하라'(골로새서 3:15). 용서와 화해는 성경적 가족 회복의 핵심입니다. 먼저 자신의 죄를 인정하고 용서를 구하는 것부터 시작하세요.";
      } else {
        analysis = "가족 관계에 대한 복합적 인식이 나타납니다. 가족은 하나님이 세우신 첫 번째 공동체이며, '서로 사랑하라'(요한복음 13:34)는 명령이 가장 먼저 실천되어야 할 곳입니다.";
      }
    } else if (cat.includes("두려움")) {
      if (allText.includes("없") || allText.includes("괜찮")) {
        analysis = "두려움이 적은 것은 하나님을 신뢰하는 믿음의 표현일 수 있습니다. '두려워하지 말라 내가 너와 함께함이라'(이사야 41:10)는 약속을 계속 붙들으세요.";
      } else if (allText.includes("실패") || allText.includes("거절") || allText.includes("혼자")) {
        analysis = "두려움이 관찰되지만, 성경은 '두려워 말라'를 365번 말씀합니다. 하나님은 '너를 버리지 아니하고 너를 떠나지 아니하시리라'(히브리서 13:5)고 약속하십니다. 두려움은 하나님께 맡기고 말씀 안에서 평안을 찾으세요.";
      } else {
        analysis = "다양한 두려움이 나타납니다. '완전한 사랑이 두려움을 내쫓나니'(요한일서 4:18). 하나님의 사랑을 더 깊이 경험할수록 두려움은 줄어듭니다.";
      }
    } else if (cat.includes("죄책감")) {
      if (allText.includes("없") || allText.includes("후회")) {
        analysis = "적절한 죄책감은 회개로 이끄는 건강한 양심의 표현입니다. '우리가 우리 죄를 자백하면 그는 미쁘시고 의로우사 우리 죄를 사하시며'(요한일서 1:9).";
      } else if (allText.includes("많") || allText.includes("미안") || allText.includes("잘못")) {
        analysis = "과도한 죄책감이 나타납니다. 그리스도 안에서 '정죄함이 없나니'(로마서 8:1). 이미 용서받았다면 계속 죄책감에 매여 있는 것은 사탄의 전략입니다. 하나님의 완전한 용서를 믿고 받아들이세요.";
      } else {
        analysis = "죄책감에 대한 복합적 인식이 나타납니다. 성경적으로 죄는 인정하되, 그리스도의 십자가를 통해 이미 용서받았음을 기억하세요(에베소서 1:7).";
      }
    } else if (cat.includes("능력")) {
      if (allText.includes("잘") || allText.includes("자신") || allText.includes("능력")) {
        analysis = "자신의 능력을 긍정적으로 인식하고 있습니다. 이는 하나님이 주신 은사를 잘 활용하는 것입니다. '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라'(빌립보서 4:13).";
      } else if (allText.includes("부족") || allText.includes("못") || allText.includes("없")) {
        analysis = "자신의 부족함을 인식하는 것은 겸손의 시작입니다. '내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라'(고린도후서 12:9). 하나님은 약한 자를 통해 일하십니다.";
      } else {
        analysis = "자기 능력에 대한 현실적 평가가 나타납니다. 성경은 '자기를 낮추는 자는 높아지고'(마태복음 23:12)라고 말씀합니다. 겸손과 자신감의 균형을 유지하세요.";
      }
    } else if (cat.includes("미래")) {
      if (allText.includes("밝") || allText.includes("희망") || allText.includes("기대")) {
        analysis = "미래에 대한 희망적 태도가 나타납니다. '너희를 향한 나의 생각을 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라'(예레미야 29:11).";
      } else if (allText.includes("불안") || allText.includes("걱정") || allText.includes("어두")) {
        analysis = "미래에 대한 불안이 관찰됩니다. '내일 일을 위하여 염려하지 말라... 한 날의 괴로움은 그 날로 족하니라'(마태복음 6:34). 하나님이 인도하시는 미래를 신뢰하세요.";
      } else {
        analysis = "미래에 대한 현실적 태도가 나타납니다. '사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라'(잠언 16:9).";
      }
    } else if (cat.includes("목표")) {
      if (allText.includes("명확") || allText.includes("계획") || allText.includes("꿈")) {
        analysis = "목표가 명확한 것은 좋은 청지기의 모습입니다. '네가 하는 일을 여호와께 맡기라 그리하면 네가 경영하는 것이 이루어지리라'(잠언 16:3). 하나님의 뜻 안에서 목표를 추구하세요.";
      } else if (allText.includes("모르") || allText.includes("없") || allText.includes("막연")) {
        analysis = "목표가 불명확한 상태입니다. '너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라'(마태복음 6:33). 하나님의 뜻을 구하는 기도부터 시작하세요.";
      } else {
        analysis = "목표에 대한 탐색 과정에 있습니다. '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라'(잠언 3:5-6).";
      }
    } else {
      analysis = "이 영역에 대한 응답을 종합적으로 분석한 결과, 하나님의 형상으로 지음 받은 개인의 고유한 경험과 인식이 반영되어 있습니다. 기독교 상담을 통해 더 깊이 탐색하고 하나님의 뜻을 발견할 수 있습니다.";
    }
    
    return analysis;
  }
  
  // 🕊️ 기독교 상담 SCT 권장사항
  function generateBiblicalSctRecommendations(cat, allText) {
    const recommendations = [];
    
    if (allText.includes("힘들") || allText.includes("어렵") || allText.includes("갈등")) {
      recommendations.push("• 매일 성경 읽기와 기도로 하나님과의 관계 깊이하기");
      recommendations.push("• 기독교 상담을 통해 관계 회복과 용서의 과정 경험하기");
      recommendations.push("• 소그룹이나 셀 모임에서 영적 지지 받기");
    }
    
    if (allText.includes("불안") || allText.includes("걱정") || allText.includes("두렵")) {
      recommendations.push("• 시편 말씀 묵상과 암송 (시편 23, 27, 46편 등)");
      recommendations.push("• 염려를 기도로 전환하기 (빌립보서 4:6-7)");
      recommendations.push("• 찬양과 경배를 통한 영적 평안 경험");
    }
    
    if (allText.includes("없") || allText.includes("모르")) {
      recommendations.push("• 하나님의 뜻을 구하는 기도 생활 (야고보서 1:5)");
      recommendations.push("• 성경적 비전 발견을 위한 금식기도");
      recommendations.push("• 영적 멘토나 목회자와의 정기적 만남");
    }
    
    if (allText.includes("죄책") || allText.includes("잘못") || allText.includes("미안")) {
      recommendations.push("• 십자가 복음 묵상과 용서의 확신 갖기");
      recommendations.push("• 필요시 화해와 용서를 구하는 실천");
      recommendations.push("• '그리스도 안에서의 새로운 피조물' 정체성 확립 (고린도후서 5:17)");
    }
    
    if (allText.includes("우울") || allText.includes("슬프") || allText.includes("의욕")) {
      recommendations.push("• 시편 기도로 하나님께 감정 토로하기");
      recommendations.push("• 성도들과의 교제를 통한 영적 회복");
      recommendations.push("• 감사 일기 쓰기 (데살로니가전서 5:18)");
    }
    
    // 모든 경우에 공통 권장사항
    recommendations.push("• 정기적인 교회 출석과 말씀 사역 참여");
    recommendations.push("• 성경 통독 및 QT(Quiet Time) 습관화");
    
    return recommendations;
  }

  // ✅ DSI AI 권장사항 생성 (상담 유형별 분기)
  function generateDsiRecommendation() {
    setLoadingRec(true);
    setDsiRec("");
    
    // 상담 유형 확인 (기본값: 심리상담)
    const counselingType = activeLinkData?.counselingType || "psychological";
    
    const { scales: areas, total } = calcSdri();
    
    let finalRec = "";
    if (counselingType === "biblical") {
      // 🕊️ 기독교 상담 분석
      finalRec = generateBiblicalDsiAnalysis(total, areas);
    } else {
      // 🧠 심리상담 분석
      finalRec = generatePsychologicalDsiAnalysis(total, areas);
    }
    
    setTimeout(() => {
      setDsiRec(finalRec);
      setLoadingRec(false);
    }, 1000);
  }
  
  // 🧠 심리상담 DSI 분석
  function generatePsychologicalDsiAnalysis(total, areas) {
    const level = total >= 120 ? "높음(양호)" : total >= 80 ? "중간(보통)" : "낮음(취약)";
    
    // 영역별 분석
    const areaAnalysis = [];
    const weakAreas = [];
    const strongAreas = [];
    
    Object.entries(areas).forEach(([area, score]) => {
      const maxScore = 36;
      const percentage = (score / maxScore) * 100;
      
      if (percentage >= 70) {
        strongAreas.push(area);
      } else if (percentage < 50) {
        weakAreas.push(area);
      }
      
      let areaComment = "";
      if (area === "인지적 기능") {
        if (percentage >= 70) {
          areaComment = "감정 조절과 의사결정 능력이 우수합니다. 충동성이 낮고 논리적 사고가 가능합니다.";
        } else if (percentage < 50) {
          areaComment = "충동성 조절에 어려움이 있을 수 있습니다. 감정과 사고를 분리하는 연습이 필요합니다.";
        } else {
          areaComment = "감정 조절 능력이 보통 수준입니다. 스트레스 관리 기법을 익히면 도움이 됩니다.";
        }
      } else if (area === "자아통합") {
        if (percentage >= 70) {
          areaComment = "자기 정체성이 명확하고 가치관이 일관됩니다. 자율성이 높습니다.";
        } else if (percentage < 50) {
          areaComment = "타인의 영향을 많이 받는 편입니다. 자기 가치관을 명료화하는 작업이 필요합니다.";
        } else {
          areaComment = "자아 정체성 형성 과정에 있습니다. 자기 탐색을 통해 더 강화할 수 있습니다.";
        }
      } else if (area === "가족투사") {
        if (percentage >= 70) {
          areaComment = "가족 문제로부터 건강하게 분리되어 있습니다. 객관적 시각을 유지합니다.";
        } else if (percentage < 50) {
          areaComment = "가족 문제가 현재 삶에 영향을 주고 있습니다. 가족 상담이 도움이 될 수 있습니다.";
        } else {
          areaComment = "가족 영향을 인식하고 있습니다. 건강한 경계 설정이 필요합니다.";
        }
      } else if (area === "정서적 단절") {
        if (percentage >= 70) {
          areaComment = "가족과 적절한 거리를 유지합니다. 독립성과 친밀감의 균형이 좋습니다.";
        } else if (percentage < 50) {
          areaComment = "가족으로부터 과도하게 단절되어 있을 수 있습니다. 연결감 회복이 필요합니다.";
        } else {
          areaComment = "가족과의 거리감이 적절합니다. 현재 수준을 유지하는 것이 좋습니다.";
        }
      } else if (area === "가족퇴행") {
        if (percentage >= 70) {
          areaComment = "가족 스트레스 상황에서도 성숙하게 대응합니다. 퇴행 경향이 낮습니다.";
        } else if (percentage < 50) {
          areaComment = "가족 상황에서 스트레스를 많이 받습니다. 감정 조절 기법이 필요합니다.";
        } else {
          areaComment = "가족 상황 대처가 보통입니다. 스트레스 관리를 강화하면 좋습니다.";
        }
      }
      
      areaAnalysis.push(`${area} (${score}/${maxScore}점, ${percentage.toFixed(0)}%):\n${areaComment}`);
    });
    
    // 종합 분석
    let overallAnalysis = `전반적인 자아분화 수준이 ${level}입니다. `;
    if (total >= 120) {
      overallAnalysis += "자기 자신에 대한 이해가 깊고, 타인과의 관계에서 건강한 경계를 유지할 수 있습니다. 정서적으로 안정적이며 독립적인 의사결정이 가능합니다.";
    } else if (total >= 80) {
      overallAnalysis += "기본적인 자아분화가 이루어져 있으나, 일부 영역에서 개선의 여지가 있습니다. 지속적인 자기 성찰과 성장이 도움이 됩니다.";
    } else {
      overallAnalysis += "자아분화 수준이 다소 낮은 편입니다. 가족이나 타인의 영향을 많이 받을 수 있으며, 전문적인 상담을 통한 지원이 권장됩니다.";
    }
    
    // 권장사항
    const recommendations = [];
    
    if (weakAreas.length > 0) {
      recommendations.push(`[취약 영역 개선]\n취약한 영역: ${weakAreas.join(", ")}\n• 해당 영역에 초점을 맞춘 상담 진행\n• 자기 인식 강화 활동 (일기 쓰기, 자기 성찰)\n• 가족과의 건강한 경계 설정 연습`);
    }
    
    if (total < 120) {
      recommendations.push("[전문 상담 시 참고할 수 있는 접근]\n• Bowen 가족체계 관점\n• 자아분화 이해 높이기\n• 정서 조절 연습\n• 관계 패턴 돌아보기");
    }
    
    if (strongAreas.length > 0) {
      recommendations.push(`[강점 활용]\n강점 영역: ${strongAreas.join(", ")}\n• 강점을 활용한 대처 전략 강화\n• 긍정적 경험 확대 적용`);
    }
    
    recommendations.push("[단기 목표 (1-3개월)]\n• 주 1회 정기 상담 참여\n• 감정 일지 작성 (일일)\n• 이완 훈련 실천 (주 3회)");
    
    recommendations.push("[장기 목표 (6-12개월)]\n• 자아분화 수준 20% 향상\n• 가족과의 건강한 관계 재정립\n• 스트레스 상황에서의 대처 능력 강화");
    
    return `${overallAnalysis}\n\n[영역별 상세 분석]\n${areaAnalysis.join("\n\n")}\n\n${recommendations.join("\n\n")}\n\n[주의사항]\n본 권장사항은 자동 분석 결과이며, 전문 상담사의 해석과 병행되어야 합니다. 개인의 고유한 맥락을 고려한 맞춤형 상담이 중요합니다.`;
  }
  
  // 🕊️ 기독교 상담 DSI 분석
  function generateBiblicalDsiAnalysis(total, areas) {
    const level = total >= 120 ? "높음(양호)" : total >= 80 ? "중간(보통)" : "낮음(취약)";
    
    // 영역별 분석
    const areaAnalysis = [];
    const weakAreas = [];
    const strongAreas = [];
    
    Object.entries(areas).forEach(([area, score]) => {
      const maxScore = 36;
      const percentage = (score / maxScore) * 100;
      
      if (percentage >= 70) {
        strongAreas.push(area);
      } else if (percentage < 50) {
        weakAreas.push(area);
      }
      
      let areaComment = "";
      if (area === "인지적 기능") {
        if (percentage >= 70) {
          areaComment = "감정을 잘 조절하고 논리적으로 사고합니다. '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라'(로마서 12:2). 하나님이 주신 이성의 선물을 잘 사용하고 있습니다.";
        } else if (percentage < 50) {
          areaComment = "충동적인 반응이 나타날 수 있습니다. '사람의 성내는 것이 하나님의 의를 이루지 못함이라'(야고보서 1:20). 감정에 휘둘리기 전에 기도하며 하나님의 지혜를 구하세요.";
        } else {
          areaComment = "감정 조절 능력이 보통입니다. '너희 안에 이 마음을 품으라 곧 그리스도 예수의 마음이니'(빌립보서 2:5). 그리스도의 마음을 품고 성령의 열매를 구하세요.";
        }
      } else if (area === "자아통합") {
        if (percentage >= 70) {
          areaComment = "자기 정체성이 명확합니다. '그리스도 안에서 새로운 피조물'(고린도후서 5:17)로서의 정체성을 잘 확립하고 있습니다. 하나님의 자녀로서 확신 있게 살아가고 있습니다.";
        } else if (percentage < 50) {
          areaComment = "타인의 영향을 많이 받습니다. '사람을 기쁘게 하는 자가 되려 하였더라면 그리스도의 종이 아니니라'(갈라디아서 1:10). 하나님 안에서 자신의 정체성을 찾고, 하나님만을 기쁘시게 하는 삶을 추구하세요.";
        } else {
          areaComment = "자아 정체성 형성 중입니다. '너희 믿음을 시험하여 너희가 믿음 안에 있는가 너희 자신을 확증하라'(고린도후서 13:5). 그리스도 안에서 자신이 누구인지 확인하는 시간을 가지세요.";
        }
      } else if (area === "가족투사") {
        if (percentage >= 70) {
          areaComment = "가족 문제로부터 건강하게 분리되어 있습니다. '그러므로 사람이 부모를 떠나 그의 아내와 합하여 둘이 한 몸을 이룰지로다'(창세기 2:24). 성경적 독립과 분리를 이루었습니다.";
        } else if (percentage < 50) {
          areaComment = "가족 문제가 현재 삶에 영향을 줍니다. '또 다른 사람들도 건지고자 하여 두려움으로 붙들어 끌어내며'(유다서 1:23). 가족을 사랑하되, 가족의 문제가 당신의 정체성을 정의하지 않도록 기도하세요. 용서와 경계 설정이 필요합니다.";
        } else {
          areaComment = "가족 영향을 인식하고 있습니다. '내 멍에는 쉽고 내 짐은 가벼우니라'(마태복음 11:30). 가족의 짐을 주님께 맡기고 건강한 경계를 세우세요.";
        }
      } else if (area === "정서적 단절") {
        if (percentage >= 70) {
          areaComment = "가족과 적절한 거리를 유지합니다. '각 사람은 자기 자신의 행위를 살피라 그리하면 자랑할 것이 자기에게만 있고 남에게는 있지 아니하리니'(갈라디아서 6:4). 독립성과 친밀감의 균형이 좋습니다.";
        } else if (percentage < 50) {
          areaComment = "가족으로부터 과도하게 단절되어 있을 수 있습니다. '네 부모를 공경하라'(출애굽기 20:12)는 명령을 기억하세요. 상처가 있더라도 용서하고 화해를 추구하세요.";
        } else {
          areaComment = "가족과의 거리가 적절합니다. '모든 사람과 더불어 화평함과 거룩함을 따르라'(히브리서 12:14). 관계를 유지하며 성장하세요.";
        }
      } else if (area === "가족퇴행") {
        if (percentage >= 70) {
          areaComment = "가족 스트레스에도 성숙하게 대응합니다. '내가 어렸을 때에는 말하는 것이 어린 아이와 같고... 장성한 사람이 되어서는 어린 아이의 일을 버렸노라'(고린도전서 13:11). 영적 성숙함이 나타납니다.";
        } else if (percentage < 50) {
          areaComment = "가족 상황에서 스트레스를 많이 받습니다. '너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라'(베드로전서 5:7). 가족 문제를 하나님께 맡기고 평안을 찾으세요.";
        } else {
          areaComment = "가족 상황 대처가 보통입니다. '주 안에서 항상 기뻐하라'(빌립보서 4:4). 어려운 상황에서도 주님을 바라보세요.";
        }
      }
      
      areaAnalysis.push(`${area} (${score}/${maxScore}점, ${percentage.toFixed(0)}%):\n${areaComment}`);
    });
    
    // 종합 분석
    let overallAnalysis = `전반적인 자아분화 수준이 ${level}입니다. `;
    if (total >= 120) {
      overallAnalysis += "하나님께서 주신 건강한 자아가 잘 형성되어 있습니다. '그리스도 안에서 자유롭게 하는 것'(갈라디아서 5:1)을 경험하고 있으며, 타인과의 관계에서도 그리스도의 사랑으로 균형을 유지합니다. 이 은혜를 감사히 여기며 다른 이들을 세우는 데 사용하세요.";
    } else if (total >= 80) {
      overallAnalysis += "기본적인 자아분화가 이루어져 있습니다. '선을 행하되 낙심하지 말지니 포기하지 아니하면 때가 이르매 거두리라'(갈라디아서 6:9). 더 깊은 영적 성숙을 향해 나아가세요.";
    } else {
      overallAnalysis += "자아분화 수준이 낮은 편입니다. 그러나 하나님은 '연약한 자들을 강하게 하시는'(고린도후서 12:9) 분이십니다. 주님의 능력이 약한 데서 온전하여집니다. 겸손히 도움을 구하고 기독교 상담을 받으세요.";
    }
    
    // 성경적 권장사항
    const recommendations = [];
    
    if (weakAreas.length > 0) {
      recommendations.push(`[취약 영역의 영적 치유]\n취약한 영역: ${weakAreas.join(", ")}\n• 해당 영역에 대한 성경 말씀 묵상과 암송\n• 기독교 상담을 통한 하나님의 관점 회복\n• 기도와 금식으로 영적 돌파 경험\n• 소그룹에서 중보기도 받기`);
    }
    
    if (total < 120) {
      recommendations.push("[영적 성장 전략]\n• 매일 성경 읽기와 QT로 하나님과의 관계 깊이하기\n• 십자가 복음 묵상 - 정체성의 근원 확인\n• 용서와 화해의 실천 (가족 관계 회복)\n• 성령 충만과 성령의 열매 구하기");
    }
    
    if (strongAreas.length > 0) {
      recommendations.push(`[강점을 통한 섬김]\n강점 영역: ${strongAreas.join(", ")}\n• 이 은사를 교회와 이웃 섬김에 사용하기\n• 약한 자들을 돌보고 격려하기\n• 하나님께 감사와 찬양 드리기`);
    }
    
    recommendations.push("[단기 영적 목표 (1-3개월)]\n• 주 1회 기독교 상담 참여\n• 매일 성경 묵상과 기도 일기 작성\n• 주일 예배 및 소그룹 모임 참석\n• 가족을 위한 중보기도");
    
    recommendations.push("[장기 영적 목표 (6-12개월)]\n• 그리스도 안에서의 정체성 확립\n• 가족과의 성경적 관계 회복\n• 영적 성숙을 통한 자아분화 향상\n• 섬김과 사역을 통한 은사 개발");
    
    recommendations.push("[추천 성경 구절 묵상]\n• 정체성: 고린도후서 5:17, 갈라디아서 2:20\n• 가족 관계: 에베소서 6:1-4, 골로새서 3:18-21\n• 감정 조절: 잠언 16:32, 야고보서 1:19-20\n• 자유와 성숙: 갈라디아서 5:1, 고린도전서 13:11");
    
    return `${overallAnalysis}\n\n[영역별 상세 분석]\n${areaAnalysis.join("\n\n")}\n\n${recommendations.join("\n\n")}\n\n[기독교 상담의 원칙]\n본 권장사항은 성경 말씀에 기초한 분석이며, 숙련된 기독교 상담사와 함께 더 깊이 탐색하시기를 권장합니다. '모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니'(디모데후서 3:16). 하나님의 말씀이 당신을 인도하고 치유하시기를 기도합니다.`;
  }

  function logout() {
    // B2C 로그아웃 — handleLogout 위임
    clearLoginState();
    setSrciResponses({});
    setSctSummaries({});
    setSdriResponses({});
    setDsiRec("");
    setActiveLinkId(null);
    setSubmitted([]);
    setLinkInput("");
    setPendingTests([]);
    setCurrentTestIndex(0);
    setMultiSessionIds([]);
    // AI 채팅 횟수 초기화
    setAiChatUsed(0);
    try { localStorage.removeItem(AI_LIMIT_KEY); } catch {}
    setView('memberDashboard');
  }

  // ========== VIEWS ==========
  console.log('🎬 렌더링 시작 - current view:', view);

  if (view === "login") {
    console.log('🎬 로그인 화면 렌더링');
  }
  
  if (view === "login") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold text-gray-800">심리검사 시스템</h1>
          <p className="text-gray-400 text-sm mt-1">상담사에게 받은 링크 ID로 검사를 시작하세요</p>
        </div>
        <Msg msg={loginMsg} />
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-5">
          <p className="text-sm font-bold text-green-800 mb-3">📋 검사 응시 (내담자)</p>
          <input
            className="w-full px-4 py-3 border-2 border-green-300 rounded-lg outline-none focus:border-green-500 text-sm mb-3 font-mono"
            placeholder="상담사에게 받은 링크 ID를 여기에 붙여넣으세요"
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && enterByLinkId()}
          />
          <button onClick={enterByLinkId} className="w-full bg-green-700 text-white py-3 rounded-lg font-bold hover:bg-green-800 transition text-base">
            검사 시작하기 →
          </button>
        </div>
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          </div>
      </div>
    </div>
  );

  if (view === "clientLogin") return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={() => { setView("login"); setLoginMsg({ type: "", text: "" }); }} className="text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1">
          ← 뒤로
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧪</div>
          <h1 className="text-2xl font-bold text-gray-800">
            심리검사 시작
          </h1>
          <div className="mt-2 inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
            내담자: {activeLinkData?.clientName}
          </div>
          {activeLinkData && (activeLinkData.testTypes || [activeLinkData.testType]).length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1.5">진행할 검사 ({(activeLinkData.testTypes || [activeLinkData.testType]).length}개)</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(activeLinkData.testTypes || [activeLinkData.testType]).map((t, i) => (
                  <span key={t} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-200">
                    {i+1}. {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-700">
          ✅ 링크 확인 완료. 전화번호와 비밀번호를 입력해 검사를 시작하세요.
        </div>
        <Msg msg={loginMsg} />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호</label>
            <input type="tel" value={userInfo.phone} onChange={e => setUserInfo({ ...userInfo, phone: e.target.value })} placeholder="010-1234-5678" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
            <input type="password" value={userInfo.password} onChange={e => setUserInfo({ ...userInfo, password: e.target.value })} placeholder="사용하실 비밀번호를 입력하세요" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 outline-none" onKeyDown={e => e.key === "Enter" && clientLogin()} />
            <p className="text-xs text-gray-400 mt-1">* 본인이 직접 설정하는 비밀번호입니다</p>
          </div>
          <button onClick={clientLogin} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition text-lg">
            검사 시작 →
          </button>
        </div>
      </div>
    </div>
  );

  // ── SRCI: 자기반응 완성 검사 (SCT 자리, 문장완성형 25문항) ──
  if (view === "sctTest") {
    const filled = sdriCompletionQ.filter(q => srciResponses[q.num]?.trim()).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
        {ProtectionLayers}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          {pendingTests.length > 1 && (
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
              <div className="flex gap-2 flex-wrap">
                {pendingTests.map((t, i) => (
                  <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                    {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-3">
              <span className="text-violet-600 font-bold text-sm">✍️ SRCI</span>
              <span className="text-violet-400 text-xs">{t("자기반응 완성 검사","Sentence Completion Test")}</span>
            </div>
            <h1 className="text-2xl font-bold text-violet-900 mb-1">{t("자기반응 완성 검사","Sentence Completion Test")}</h1>
            <p className="text-gray-400 text-sm">{t("빈칸에 가장 먼저 떠오르는 것을 솔직하게 완성해 주세요 (25문항)","Complete each sentence with the first thought that comes to mind (25 items)")}</p>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-5 text-xs text-violet-800 text-center">
            {t("진행:","Progress:")} <strong>{filled}</strong> / {sdriCompletionQ.length} {t("문항","items")}
            <div className="mt-2 bg-violet-200 rounded-full h-1.5">
              <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{width:`${(filled/sdriCompletionQ.length)*100}%`}}/>
            </div>
          </div>
          {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
          <div className="space-y-4">
            {[...sdriCompletionQ].sort((a,b) => a.num - b.num).map((q, idx) => (
              <div key={q.num} className="border-b border-gray-100 pb-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0 mt-0.5 bg-violet-100 text-violet-700">
                    {idx + 1}
                  </span>
                  <label className="font-semibold text-gray-700 text-sm leading-relaxed">
                    {q.prompt} <span className="text-gray-300 font-normal">___________</span>
                  </label>
                </div>
                <input type="text"
                  value={srciResponses[q.num] || ''}
                  onChange={e => setSrciResponses(p => ({...p, [q.num]: e.target.value}))}
                  placeholder={t("떠오르는 대로 자유롭게...","Write freely what comes to mind...")}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none text-sm transition ${srciResponses[q.num]?.trim() ? 'border-violet-300 bg-violet-50 focus:border-violet-500' : 'border-gray-200 focus:border-violet-400'}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={submitSrci}
              className="bg-violet-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-violet-700 transition">
              {pendingTests.length > 1 && currentTestIndex < pendingTests.length - 1
                ? t(`다음 검사로 → (${currentTestIndex+1}/${pendingTests.length})`,`Next → (${currentTestIndex+1}/${pendingTests.length})`)
                : t('검사 제출','Submit')} ({filled}/{sdriCompletionQ.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SDRI: 자기분화 반응성 검사 (DSI 자리, 평정형 25문항) ──
  if (view === "dsiTest") {
    const likertFilled = Object.keys(sdriResponses).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
        {ProtectionLayers}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          {pendingTests.length > 1 && (
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
              <div className="flex gap-2 flex-wrap">
                {pendingTests.map((t, i) => (
                  <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-teal-600 text-white border-teal-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                    {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 mb-3">
              <span className="text-teal-600 font-bold text-sm">🪞 SDRI</span>
              <span className="text-teal-400 text-xs">{t("자기분화 반응성 검사","Self-Differentiation Response Index")}</span>
            </div>
            <h1 className="text-2xl font-bold text-teal-900 mb-1">{t("자기분화 반응성 검사","Self-Differentiation Response Index")}</h1>
            <p className="text-gray-400 text-sm">{t("각 문항이 나와 얼마나 일치하는지 선택해 주세요 (25문항)","Indicate how much each statement describes you (25 items)")}</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-5 text-xs text-teal-800">
            <div className="flex flex-wrap gap-3 justify-center mb-2">
              {t(["1: 전혀 아니다","2: 거의 아니다","3: 가끔 그렇다","4: 자주 그렇다","5: 항상 그렇다"],["1: Never","2: Rarely","3: Sometimes","4: Often","5: Always"]).map(s => (
                <span key={s} className="font-semibold">{s}</span>
              ))}
            </div>
            <div className="bg-teal-200 rounded-full h-1.5">
              <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{width:`${(likertFilled/sdriLikertQ.length)*100}%`}}/>
            </div>
            <div className="text-center mt-1">{t("진행:","Progress:")} <strong>{likertFilled}</strong> / {sdriLikertQ.length}</div>
          </div>
          {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
          <div className="space-y-3">
            {sdriLikertQ.map(q => (
              <div key={q.num} className={`border-2 rounded-xl p-4 transition ${sdriResponses[q.num] ? 'border-teal-300 bg-teal-50' : 'border-gray-100'}`}>
                <div className="flex items-start gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${
                    q.scale === '자기입장 유지' ? 'bg-indigo-100 text-indigo-700' :
                    q.scale === '정서반응성'   ? 'bg-rose-100 text-rose-700' :
                    q.scale === '정서적 단절'  ? 'bg-amber-100 text-amber-700' :
                                                 'bg-purple-100 text-purple-700'}`}>
                    {t(q.scale, q.scaleEn)}
                  </span>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                    {q.num}. {t(q.content, q.en)}
                    {q.rev && <span className="ml-1 text-gray-400 font-normal text-xs">{t("(역문항)","(R)")}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s}
                      onClick={() => setSdriResponses(p => ({...p, [q.num]: s}))}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition ${sdriResponses[q.num] === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-500 hover:border-teal-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={submitSdri} disabled={likertFilled < sdriLikertQ.length}
              className="bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
              {pendingTests.length > 1 && currentTestIndex < pendingTests.length - 1
                ? t(`다음 검사로 → (${currentTestIndex+1}/${pendingTests.length})`,`Next → (${currentTestIndex+1}/${pendingTests.length})`)
                : t('검사 제출','Submit')} ({likertFilled}/{sdriLikertQ.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "phq9Test") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-green-800 mb-1">😔 {t("우울 자가점검", "Depression Screening")} (PHQ-9)</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("지난 2주간 얼마나 자주 다음의 문제들로 어려움을 겪었는지 표시해 주세요 (9문항)", "Over the last 2 weeks, how often have you been bothered by the following? (9 items)")}</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-800">
          <div className="flex flex-wrap gap-3">
            {t(["0: 전혀 없음", "1: 여러 날 동안", "2: 7일 이상", "3: 거의 매일"], ["0: Not at all", "1: Several days", "2: More than half", "3: Nearly every day"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(phq9Responses).length}</strong> / 9 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-3">
          {phq9Q.map(q => (
            <div key={q.num} className="border-b border-gray-100 pb-3">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{q.num}. {q.content}</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(v => (
                  <button key={v} onClick={() => setPhq9Responses(p => ({ ...p, [q.num]: v }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${phq9Responses[q.num] === v ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitPhq9} className="bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition">
            {t("검사 제출", "Submit")} ({Object.keys(phq9Responses).length}/9)
          </button>
        </div>
      </div>
    </div>
  );

  // GAD-7 검사 화면
  if (view === "gad7Test") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-orange-800 mb-1">😰 {t("불안 자가점검", "Anxiety Screening")} (GAD-7)</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("지난 2주간 다음의 문제들로 얼마나 자주 시달렸는지 표시해 주세요 (7문항)", "Over the last 2 weeks, how often have you been bothered by the following? (7 items)")}</p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-800">
          <div className="flex flex-wrap gap-3">
            {t(["0: 전혀 없음", "1: 여러 날 동안", "2: 7일 이상", "3: 거의 매일"], ["0: Not at all", "1: Several days", "2: More than half", "3: Nearly every day"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(gad7Responses).length}</strong> / 7 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-3">
          {gad7Q.map(q => (
            <div key={q.num} className="border-b border-gray-100 pb-3">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{q.num}. {q.content}</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(v => (
                  <button key={v} onClick={() => setGad7Responses(p => ({ ...p, [q.num]: v }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${gad7Responses[q.num] === v ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitGad7} className="bg-orange-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-orange-700 transition">
            {t("검사 제출", "Submit")} ({Object.keys(gad7Responses).length}/7)
          </button>
        </div>
      </div>
    </div>
  );

  // ── Holland RIASEC 검사 화면 ────────────────────────────────
  if (view === "riasecTest") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-violet-800 mb-1">🔍 {t("Holland RIASEC 직업 흥미 검사", "Holland RIASEC Career Interest Test")}</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("나의 직업적 적성과 흥미를 6가지 유형으로 분석합니다 (30문항)", "Analyze your career aptitude and interests across 6 types (30 items)")}</p>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4 text-xs text-violet-800">
          <div className="flex flex-wrap gap-3">
            {t(["1: 전혀 아니다", "2: 아니다", "3: 보통", "4: 그렇다", "5: 매우 그렇다"], ["1: Strongly Disagree", "2: Disagree", "3: Neutral", "4: Agree", "5: Strongly Agree"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-2 text-xs text-violet-800 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(riasecResponses).length}</strong> / 30 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-4">
          {RIASEC_Q.map(q => (
            <div key={q.id} className="border-b border-gray-100 pb-4">
              <label className="block mb-3 font-semibold text-gray-700 text-sm">{q.id}. {q.text}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setRiasecResponses(p => ({ ...p, [q.id]: v }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${riasecResponses[q.id] === v ? "bg-violet-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-violet-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitRiasec} className="bg-violet-700 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-violet-800 transition">
            {t("검사 제출", "Submit")} ({Object.keys(riasecResponses).length}/30)
          </button>
        </div>
      </div>
    </div>
  );

  // ── 직업가치관 검사 화면 ──────────────────────────────────────
  if (view === "valuesTest") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-1">💎 {t("직업가치관 검사", "Work Values Assessment")}</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("일에서 무엇을 중시하는지 10가지 가치요인으로 측정합니다 (30문항)", "Measure what you value most at work across 10 value factors (30 items)")}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          <div className="flex flex-wrap gap-3">
            {t(["1: 전혀 중요하지 않다", "2: 중요하지 않다", "3: 보통", "4: 중요하다", "5: 매우 중요하다"], ["1: Not important at all", "2: Not important", "3: Neutral", "4: Important", "5: Very important"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(valuesResponses).length}</strong> / 30 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-4">
          {VALUES_Q.map(q => (
            <div key={q.id} className="border-b border-gray-100 pb-4">
              <label className="block mb-3 font-semibold text-gray-700 text-sm">{q.id}. {q.text}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setValuesResponses(p => ({ ...p, [q.id]: v }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${valuesResponses[q.id] === v ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitValues} className="bg-amber-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-amber-700 transition">
            {t("검사 제출", "Submit")} ({Object.keys(valuesResponses).length}/30)
          </button>
        </div>
      </div>
    </div>
  );

  // DASS-21 검사 화면
  if (view === "dass21Test") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-teal-800 mb-1">📊 {t("우울/불안/스트레스 척도 (DASS-21)", "Depression/Anxiety/Stress Scale (DASS-21)")}</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("지난 일주일 동안 자신에게 해당되는 정도를 표시해 주세요 (21문항)", "Rate how much each statement applied to you over the past week (21 items)")}</p>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-xs text-teal-800">
          <div className="flex flex-wrap gap-2">
            {t(["1: 전혀 아님", "2: 가끔", "3: 자주", "4: 대부분"], ["1: Did not apply", "2: Applied sometimes", "3: Applied often", "4: Applied most of the time"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 text-xs text-teal-700 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(dass21Responses).length}</strong> / 21 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-3">
          {dass21Q.map(q => (
            <div key={q.num} className="border-b border-gray-100 pb-3">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{q.num}. {q.content}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(v => (
                  <button key={v} onClick={() => setDass21Responses(p => ({ ...p, [q.num]: v }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${dass21Responses[q.num] === v ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-teal-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitDass21} className="bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 transition">
            {t("검사 제출", "Submit")} ({Object.keys(dass21Responses).length}/21)
          </button>
        </div>
      </div>
    </div>
  );

  // Big5 검사 화면
  // 번아웃 검사 화면
  if (view === "burnoutTest") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-center text-red-600 mb-2">🔥 {t("번아웃 증후군 검사 (K-MBI+)","Burnout Syndrome Test (K-MBI+)")}</h1>
        <p className="text-center text-gray-500 text-sm mb-4">
          {t("최근 한 달간 경험한 빈도를 선택해 주세요 (50문항)","Rate how often you experienced each over the past month (50 items)")}
        </p>
        
        {/* 응답 옵션 안내 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-7 gap-1 text-xs text-center font-semibold text-red-800">
            {t(["0: 전혀없음","1: 1년에 몇번","2: 한달에 한번","3: 한달에 몇번","4: 일주일에 한번","5: 일주일에 몇번","6: 매일"],
               ["0: Never","1: Few/year","2: Once/month","3: Few/month","4: Once/week","5: Few/week","6: Daily"]).map(s => (
              <div key={s}>{s}</div>
            ))}
          </div>
        </div>
        
        {/* 진행 상태 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-center">
          <div className="text-sm text-red-700 mb-2">
            {t("진행:","Progress:")} <strong className="text-xl">{Object.keys(burnoutResponses).length}</strong> / 50 {t("문항","items")}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(burnoutResponses).length / 50) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* 문항 섹션별 렌더링 */}
        <div className="space-y-6">
          {getBurnoutDomains().map((domain, dIdx) => (
            <div key={dIdx} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-red-600">{domain.icon}</span>
                {t(domain.name, domain.nameEn)} ({domain.questions.length} {t("문항","items")})
              </h2>
              <div className="space-y-3">
                {domain.questions.map((q, qIdx) => (
                  <div key={q.num} className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="block mb-2 font-semibold text-gray-700 text-sm">
                      {q.num}. {t(q.content, q.en)}
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map(v => (
                        <button
                          key={v}
                          onClick={() => setBurnoutResponses(p => ({ ...p, [q.num]: v }))}
                          className={`py-2 px-1 rounded-lg text-xs font-bold transition ${
                            burnoutResponses[q.num] === v 
                              ? "bg-red-600 text-white shadow-lg scale-105" 
                              : "bg-gray-100 text-gray-600 hover:bg-red-100"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* 제출 버튼 */}
        <div className="mt-8 text-center">
          <button 
            onClick={submitBurnout} 
            className="bg-red-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-lg transform hover:scale-105"
          >
            🔥 {t("검사 제출","Submit")} ({Object.keys(burnoutResponses).length}/50)
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "big5Test") return (
    <div className="min-h-screen bg-gray-50 p-4">
      {ProtectionLayers}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        {pendingTests.length > 1 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
            <div className="flex gap-2 flex-wrap">
              {pendingTests.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                  {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                </span>
              ))}
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{width: `${((currentTestIndex) / pendingTests.length) * 100}%`}}></div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-purple-800 mb-1">🌟 {t("Big5 성격검사", "Big Five Personality Test")}</h1>
        <p className="text-center text-gray-400 text-sm mb-2">{t("각 문장이 자신을 얼마나 잘 설명하는지 표시해 주세요 (50문항)", "Rate how accurately each statement describes you (50 items)")}</p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-xs text-purple-800">
          <div className="flex flex-wrap gap-2">
            {t(["1: 전혀 아님", "2: 아님", "3: 보통", "4: 그러함", "5: 매우 그러함"], ["1: Strongly Disagree", "2: Disagree", "3: Neutral", "4: Agree", "5: Strongly Agree"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700 mb-6 text-center">
          {t("진행:", "Progress:")} <strong>{Object.keys(big5Responses).length}</strong> / 50 {t("문항", "items")}
        </div>
        {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
        <div className="space-y-3">
          {big5Q.map(q => (
            <div key={q.num} className="border-b border-gray-100 pb-3">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{q.num}. {q.content}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setBig5Responses(p => ({ ...p, [q.num]: v }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${big5Responses[q.num] === v ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-purple-100"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button onClick={submitBig5} className="bg-purple-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition">
            {t("검사 제출", "Submit")} ({Object.keys(big5Responses).length}/50)
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "lostTest") {
    const AXIS_INFO = [
      { axis:"E", label:t("에너지 방향","Energy Direction"),       range:[1,10],  color:"teal",   desc:t("외향(E) vs 내향(I)","Extroversion (E) vs Introversion (I)") },
      { axis:"D", label:t("의사결정 방식","Decision-Making"),      range:[11,20], color:"blue",   desc:t("논리(T) vs 감정(F)","Logic (T) vs Feeling (F)") },
      { axis:"S", label:t("행동 속도","Action Speed"),             range:[21,30], color:"orange", desc:t("빠름(P) vs 신중(J)","Spontaneous (P) vs Judicious (J)") },
      { axis:"N", label:t("안정성","Stability"),                   range:[31,40], color:"green",  desc:t("변화(C) vs 안정(N)","Change (C) vs Stability (N)") },
      { axis:"R", label:t("관계 민감도","Relational Sensitivity"), range:[41,50], color:"purple", desc:t("관계중심(R) vs 독립(I)","Relationship (R) vs Independence (I)") },
      { axis:"T", label:t("스트레스 반응","Stress Response"),      range:[51,60], color:"red",    desc:t("직면(A) vs 회피(V)","Confronting (A) vs Avoiding (V)") },
    ];
    const btnActiveMap = {
      teal:"bg-teal-600 text-white", blue:"bg-blue-600 text-white",
      orange:"bg-orange-500 text-white", green:"bg-green-600 text-white",
      purple:"bg-purple-600 text-white", red:"bg-red-500 text-white",
    };
    const headerMap = {
      teal:"bg-teal-50 border-teal-200 text-teal-800",
      blue:"bg-blue-50 border-blue-200 text-blue-800",
      orange:"bg-orange-50 border-orange-200 text-orange-800",
      green:"bg-green-50 border-green-200 text-green-800",
      purple:"bg-purple-50 border-purple-200 text-purple-800",
      red:"bg-red-50 border-red-200 text-red-800",
    };
    const answered = Object.keys(lostResponses).length;
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
          {pendingTests.length > 1 && (
            <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-xs font-bold text-teal-700 mb-2">{t("📋 검사 진행 현황","📋 Test Progress")} ({currentTestIndex + 1}/{pendingTests.length})</p>
              <div className="flex gap-2 flex-wrap">
                {pendingTests.map((t, i) => (
                  <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-teal-600 text-white border-teal-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
                    {i < currentTestIndex ? "✅ " : i === currentTestIndex ? "▶ " : ""}{t}
                  </span>
                ))}
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{width:`${(currentTestIndex/pendingTests.length)*100}%`}}></div>
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-center text-teal-800 mb-1">🧭 {t("행동 운영체계 검사 (LOST)", "Behavioral Operating System Test (LOST)")}</h1>
          <p className="text-center text-gray-500 text-sm mb-1">{t("나는 어떻게 행동하고 결정하는가 — 6개 축, 60문항", "How do you act and decide? — 6 axes, 60 items")}</p>
          <p className="text-center text-gray-400 text-xs mb-4">{t("Big Five · HEXACO · TCI 이론 기반 | 한국 문화 요소 반영", "Based on Big Five · HEXACO · TCI | Culturally adapted")}</p>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-3 text-xs text-teal-800 flex flex-wrap gap-3">
            {t(["1: 전혀 아님","2: 아님","3: 보통","4: 그러함","5: 매우 그러함"], ["1: Strongly Disagree","2: Disagree","3: Neutral","4: Agree","5: Strongly Agree"]).map(s => <span key={s} className="font-semibold">{s}</span>)}
          </div>
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t("전체 진행률", "Overall Progress")}</span>
              <span className="font-bold text-teal-700">{answered} / 60 {t("문항", "items")}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full transition-all" style={{width:`${(answered/60)*100}%`}}></div>
            </div>
          </div>
          {saveStatus && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center">{saveStatus}</div>}
          <div className="space-y-6">
            {AXIS_INFO.map(({ axis, label, range, color, desc }) => {
              const axisQs = lostQ.filter(q => q.num >= range[0] && q.num <= range[1]);
              const axisAnswered = axisQs.filter(q => lostResponses[q.num] !== undefined).length;
              return (
                <div key={axis} className={`border-2 rounded-xl overflow-hidden ${axisAnswered === 10 ? "border-teal-300" : "border-gray-200"}`}>
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${headerMap[color]}`}>
                    <div>
                      <span className="font-bold text-sm">{label}</span>
                      <span className="ml-2 text-xs opacity-75">({desc})</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${axisAnswered === 10 ? "bg-teal-600 text-white" : "bg-white/60 text-gray-600"}`}>
                      {axisAnswered}/10
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    {axisQs.map(q => (
                      <div key={q.num} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <label className="block mb-2 font-medium text-gray-700 text-sm">
                          <span className="text-gray-400 mr-1">{q.num}.</span>{q.content}
                        </label>
                        <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(v => (
                            <button key={v}
                              onClick={() => setLostResponses(p => ({...p, [q.num]: v}))}
                              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${lostResponses[q.num] === v ? btnActiveMap[color] : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >{v}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <button onClick={submitLost} className="bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 transition">
              {t("검사 제출", "Submit")} ({answered}/60)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "complete") {
    const completedTest = pendingTests[0] || 'PHQ9';
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-start pt-10"
        style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl text-center mb-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t("검사 완료!", "Assessment Complete!")}</h1>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {pendingTests.map(t => (
              <span key={t} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
                ✅ {t}
              </span>
            ))}
          </div>

          {/* 검사 결과 먼저 보기 — 결과를 보고 상담하는 흐름이 더 자연스럽다(사용자 요청 2026-07-19) */}
          <button
            onClick={() => { const rv={SCT:'sctResult',DSI:'dsiResult',PHQ9:'phq9Result',GAD7:'gad7Result',DASS21:'dass21Result',BIG5:'big5Result',BURNOUT:'burnoutResult',LOST:'lostResult',RIASEC:'riasecResult',VALUES:'valuesResult'}; setView(rv[completedTest]||'phq9Result'); }}
            className="w-full mb-5 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm">
            📄 {t("검사 결과 자세히 보기", "View detailed results")}
          </button>

          {/* AI 상담 체험 (결과 확인 후) */}
          <div className="mb-4 text-left">
            <div className="text-sm font-bold text-blue-800 mb-1">💬 {t("결과를 본 뒤, AI 상담 체험하기", "After reviewing, try AI counseling")}</div>
            <div className="text-xs text-blue-600 mb-3">{t("검사 결과를 바탕으로 AI와 3회 무료 상담을 받아보세요", "Get 3 free AI counseling sessions based on your results")}</div>
            <ChatBox testType={completedTest} initialPrompts={
              ['PHQ9','GAD7'].includes(completedTest) ? (lang === 'en' ? [
                'What do my results mean?',
                'What can I do in my daily life?',
                'Do I need professional counseling?'
              ] : [
                '제 검사 결과가 어떤 의미인지 설명해주세요',
                '일상에서 할 수 있는 것이 있나요?',
                '전문가 상담이 필요한 수준인가요?'
              ]) : (lang === 'en' ? [
                'Please explain my overall results.',
                'What should I pay most attention to?'
              ] : [
                '검사 결과 전체적으로 설명해주세요',
                '가장 주목해야 할 부분은 무엇인가요?'
              ])
            } />
          </div>

          {/* 비로그인: 회원가입 유도 */}
          {!isLoggedIn && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="text-sm font-bold text-green-800 mb-1">🌱 {t("결과를 저장하고 싶으신가요?", "Want to save your results?")}</div>
              <div className="text-xs text-green-700 mb-3">{t("무료 가입하면 검사 이력 저장 + 20 크레딧이 지급됩니다", "Sign up free to save your history and get 20 credits")}</div>
              <button onClick={() => setView('memberSignup')}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition">
                {t("무료로 가입하기 →", "Sign up free →")}
              </button>
            </div>
          )}

          {/* 다음 검사 추천 */}
          {(() => {
            const NEXT = {
              PHQ9:    [{ id:'GAD7',    name:t('불안 자가점검','Anxiety Screening'),     emoji:'💙', free:true  }, { id:'DASS21',  name:t('우울·불안·스트레스','Depression·Anxiety·Stress'), emoji:'🌊', free:false }],
              GAD7:    [{ id:'PHQ9',    name:t('우울 자가점검','Depression Screening'),  emoji:'🌱', free:true  }, { id:'DASS21',  name:t('우울·불안·스트레스','Depression·Anxiety·Stress'), emoji:'🌊', free:false }],
              DASS21:  [{ id:'BIG5',    name:t('성격 5요인','Big Five'),                 emoji:'🧠', free:false }, { id:'BURNOUT', name:t('번아웃 자가점검','Burnout Screening'),     emoji:'🔥', free:false }],
              BIG5:    [{ id:'LOST',    name:t('행동 운영체계','Behavioral Style'),      emoji:'🧭', free:false }, { id:'DSI',     name:t('자기분화 반응성','Self-Differentiation'), emoji:'🪞', free:false }],
              LOST:    [{ id:'BIG5',    name:t('성격 5요인','Big Five'),                 emoji:'🧠', free:false }, { id:'BURNOUT', name:t('번아웃 자가점검','Burnout Screening'),     emoji:'🔥', free:false }],
              BURNOUT: [{ id:'PHQ9',    name:t('우울 자가점검','Depression Screening'),  emoji:'🌱', free:true  }, { id:'DASS21',  name:t('우울·불안·스트레스','Depression·Anxiety·Stress'), emoji:'🌊', free:false }],
              SCT:     [{ id:'DSI',     name:t('자기분화 반응성','Self-Differentiation'),emoji:'🪞', free:false }, { id:'BIG5',    name:t('성격 5요인','Big Five'),                  emoji:'🧠', free:false }],
              DSI:     [{ id:'SCT',     name:t('자기반응 완성','Self-Response'),         emoji:'✍️', free:false }, { id:'BIG5',    name:t('성격 5요인','Big Five'),                  emoji:'🧠', free:false }],
              RIASEC:  [{ id:'VALUES',  name:t('직업가치관','Work Values'),              emoji:'💎', free:false }, { id:'BIG5',    name:t('성격 5요인','Big Five'),                  emoji:'🧠', free:false }],
              VALUES:  [{ id:'RIASEC',  name:'Holland RIASEC',                           emoji:'🔍', free:false }, { id:'BIG5',    name:t('성격 5요인','Big Five'),                  emoji:'🧠', free:false }],
            };
            const suggestions = NEXT[completedTest];
            if (!suggestions) return null;
            return (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 text-left">📋 {t("이런 검사도 해보세요", "Try these assessments too")}</p>
                <div className="flex gap-2">
                  {suggestions.map(s => (
                    <button key={s.id}
                      onClick={() => setView('startTest:' + s.id)}
                      className="flex-1 bg-green-50 border border-green-200 rounded-xl py-2.5 px-3 text-left hover:bg-green-100 transition">
                      <div className="text-base mb-0.5">{s.emoji}</div>
                      <div className="text-xs font-bold text-green-800">{s.name}</div>
                      <div className="text-xs text-green-600">{s.free ? t('무료','Free') : '10 cr'}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {returnToCouple && (
            <button onClick={goBackToCouple}
              className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-pink-600 transition mb-2">
              💕 마음커플로 돌아가기
            </button>
          )}
          <button
            onClick={() => { if (isLoggedIn) { setView('memberDashboard'); } else { setView('landing'); } }}
            className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
            {isLoggedIn ? t('대시보드로 →','Dashboard →') : t('시작화면으로','Home')}
          </button>
        </div>
      </div>
    );
  }
  if (view === "sctResult") {
    const { filled, byScale } = calcSrci();
    const counselingType = activeLinkData?.counselingType || "psychological";
    const counselingTypeLabel = counselingType === "biblical" ? t("🕊️ 기독교 상담","🕊️ Christian Counseling") : t("🧠 심리상담","🧠 Psychology");

    const SCALE_META = {
      "자기입장 유지": { emoji:'🎯', color:'violet', border:'border-violet-200', bg:'bg-violet-50', text:'text-violet-700' },
      "정서반응성":    { emoji:'💫', color:'rose',   border:'border-rose-200',   bg:'bg-rose-50',   text:'text-rose-700'   },
      "정서적 단절":   { emoji:'🌿', color:'amber',  border:'border-amber-200',  bg:'bg-amber-50',  text:'text-amber-700'  },
      "융합·관계의존": { emoji:'🔗', color:'purple', border:'border-purple-200', bg:'bg-purple-50', text:'text-purple-700' },
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-violet-900">✍️ {t("SRCI 검사 결과","SRCI Result")}</h1>
              <p className="text-sm text-gray-400 mt-1">{t("자기반응 완성 검사 — 문장완성형 25문항","Self-Response Completion — 25 sentence-completion items")}</p>
            </div>
            <button onClick={() => setView("memberDashboard")} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">← {t("목록","Back")}</button>
          </div>
          <div className="border rounded-lg p-4 mb-6 bg-violet-50 border-violet-200 text-violet-700">
            <p className="text-sm"><strong>{t("상담 유형:","Counseling Type:")}</strong> {counselingTypeLabel}</p>
            <p className="text-sm mt-1"><strong>{t("완성 문항:","Completed Items:")}</strong> {filled}/25</p>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("소척도별 응답","Responses by Subscale")}</h2>
          <div className="space-y-4 mb-8">
            {Object.entries(SCALE_META).map(([scaleName, meta]) => {
              const answers = byScale[scaleName] || [];
              return (
                <div key={scaleName} className={`border ${meta.border} rounded-xl p-5 ${meta.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className={`font-bold text-sm ${meta.text}`}>{scaleName}</span>
                    <span className="text-xs text-gray-400 ml-auto">{answers.length} {t("문항 완성","completed")}</span>
                  </div>
                  {answers.length > 0 ? (
                    <div className="space-y-2">
                      {answers.map((a, i) => (
                        <div key={i} className={`pl-3 border-l-2 ${meta.border}`}>
                          <p className="text-xs text-gray-400">{a.prompt}</p>
                          <p className="text-sm text-gray-700 mt-0.5 font-medium">{a.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">{t("응답 없음","No responses")}</p>
                  )}
                </div>
              );
            })}
          </div>

          <AiAnalysisBox aiKey="SCT"
            onRun={() => {
              const { byScale } = calcSrci();
              const sample = Object.entries(byScale).flatMap(([scale, items]) =>
                items.slice(0,2).map(a => ({ scale, prompt: a.prompt, answer: a.answer }))
              );
              runAiAnalysis("SCT", "SCT", { completionSample: sample });
            }}
          />
          <ShareResultButton text={t(`✍️ SRCI 자기반응완성 검사 결과\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #심리검사`,`✍️ SRCI Self-Response Completion Result\nTested on Maumful! https://maumful.com`)} />
          <button
            onClick={() => generateSctPdf({ sessionId, createdAt: new Date().toISOString(), userPhone: userInfo?.phone, responses: srciResponses })}
            className="w-full mb-3 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          >
            📄 {t("PDF 보고서 다운로드","Download PDF Report")}
          </button>
          <RecoveryCard testType="SCT" score={0} level="low" />
          <ExpertCTA testType="SCT" score={0} level="low"
            onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
          <ChatBox testType="SCT" initialPrompts={t([
            "SRCI 검사 결과에서 주목해야 할 패턴은 무엇인가요?",
            "자기입장 유지와 관련된 응답을 분석해 주세요",
            "정서반응성을 건강하게 조절하려면 어떻게 해야 하나요?",
            "대인관계에서 건강한 경계를 설정하는 방법을 알려주세요",
          ],[
            "What patterns in my SRCI results should I pay attention to?",
            "Please analyze my responses related to maintaining my own perspective",
            "How can I regulate emotional reactivity in a healthy way?",
            "How do I set healthy boundaries in interpersonal relationships?",
          ])} />
        </div>
      </div>
    );
  }

  // ── SDRI 결과 화면 (평정형) ────────────────────────────────
  if (view === "dsiResult") {
    const { scales, total } = calcSdri();
    const counselingType = activeLinkData?.counselingType || "psychological";
    const counselingTypeLabel = counselingType === "biblical" ? t("🕊️ 기독교 상담","🕊️ Christian Counseling") : t("🧠 심리상담","🧠 Psychology");

    const SCALE_META = {
      "자기입장 유지": { emoji:'🎯', max:50, colorBar:'bg-indigo-500', bg:'bg-indigo-50 border-indigo-200', text:'text-indigo-700',
        desc:t('타인 압력에도 자신의 기준을 유지하는 능력','Ability to maintain own standards under social pressure') },
      "정서반응성":    { emoji:'💫', max:35, colorBar:'bg-rose-500',   bg:'bg-rose-50 border-rose-200',     text:'text-rose-700',
        desc:t('갈등·스트레스 상황에서 감정적으로 반응하는 정도','Degree of emotional reactivity in conflict/stress situations') },
      "정서적 단절":   { emoji:'🌿', max:20, colorBar:'bg-amber-500',  bg:'bg-amber-50 border-amber-200',   text:'text-amber-700',
        desc:t('갈등 시 정서적 거리를 두거나 대화를 피하는 경향','Tendency to create emotional distance or avoid dialogue during conflict') },
      "융합·관계의존": { emoji:'🔗', max:20, colorBar:'bg-purple-500', bg:'bg-purple-50 border-purple-200', text:'text-purple-700',
        desc:t('타인 감정에 과도하게 동화되거나 의존하는 정도','Degree of over-identification with or dependence on others\' emotions') },
    };

    const getLevel = (score, max) => {
      const pct = score / max;
      if (pct >= 0.75) return { label:t('높음','High'), color:'text-emerald-600' };
      if (pct >= 0.45) return { label:t('보통','Moderate'), color:'text-blue-600' };
      return               { label:t('낮음','Low'), color:'text-amber-600' };
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-teal-900">🪞 {t("SDRI 검사 결과","SDRI Result")}</h1>
              <p className="text-sm text-gray-400 mt-1">{t("자기분화 반응성 검사 — 평정형 25문항","Self-Differentiation Reactivity — 25 rating-scale items")}</p>
            </div>
            <button onClick={() => setView("memberDashboard")} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">← {t("목록","Back")}</button>
          </div>
          <div className="border rounded-lg p-4 mb-6 bg-teal-50 border-teal-200 text-teal-700">
            <p className="text-sm"><strong>{t("상담 유형:","Counseling Type:")}</strong> {counselingTypeLabel}</p>
            <p className="text-lg font-bold mt-2">{t("총점:","Total:")} {total}{t("점","")}</p>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("소척도별 결과","Results by Subscale")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(SCALE_META).map(([scaleName, meta]) => {
              const score = scales[scaleName] || 0;
              const pct   = Math.round((score / meta.max) * 100);
              const level = getLevel(score, meta.max);
              return (
                <div key={scaleName} className={`border rounded-xl p-5 ${meta.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.emoji}</span>
                      <span className={`font-bold text-sm ${meta.text}`}>{scaleName}</span>
                    </div>
                    <span className={`text-sm font-bold ${level.color}`}>{level.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{meta.desc}</p>
                  <div className="bg-white bg-opacity-60 rounded-full h-3 mb-1 overflow-hidden">
                    <div className={`${meta.colorBar} h-3 rounded-full`} style={{width:`${pct}%`, transition:'width 0.5s'}}/>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{score}{t("점","")}</span><span>{t("최대","Max")} {meta.max}{t("점","")} ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <AiAnalysisBox aiKey="DSI"
            onRun={() => {
              const { scales, total } = calcSdri();
              runAiAnalysis("DSI", "DSI", { scales, total });
            }}
          />
          <ShareResultButton text={t(`🪞 SDRI 자기분화 검사 결과\n총점: ${calcSdri().total}점\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #심리검사`,`🪞 SDRI Self-Differentiation Result\nTotal: ${calcSdri().total}\nTested on Maumful! https://maumful.com`)} />
          <button
            onClick={() => generateDsiPdf({ sessionId, createdAt: new Date().toISOString(), userPhone: userInfo?.phone, scales, total })}
            className="w-full mb-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          >
            📄 {t("PDF 보고서 다운로드","Download PDF Report")}
          </button>
          <RecoveryCard testType="DSI" score={0} level="low" />
          <ExpertCTA testType="DSI" score={0} level="low"
            onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
          <ChatBox testType="DSI" initialPrompts={t([
            "SDRI 소척도 결과가 어떤 의미인지 설명해 주세요",
            "자기입장 유지 능력을 높이는 방법이 있나요?",
            "정서적 단절 경향을 어떻게 이해하면 좋을까요?",
            "융합·관계의존이 높을 때 어떻게 경계를 설정하나요?",
          ],[
            "What do my SDRI subscale results mean?",
            "How can I improve my ability to maintain my own position?",
            "How should I understand a tendency toward emotional detachment?",
            "How do I set boundaries when fusion or relationship dependency is high?",
          ])} />
          {returnToCouple && (
            <button onClick={goBackToCouple}
              className="w-full mt-4 bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition">
              💕 마음커플로 돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === "phq9Result") {
    const result = calcPhq9();
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-green-800">😔 {t("PHQ-9 우울 자가점검 결과", "PHQ-9 Depression Screening Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <p className="text-sm"><strong>{t("세션 ID:", "Session ID:")}</strong> {sessionId}</p>
            <p className="text-sm"><strong>{t("전화번호:", "Phone:")}</strong> {userInfo.phone || "N/A"}</p>
            <p className="text-lg font-bold mt-2">{t("총점:", "Total:")} {result.total}/27 ({result.level})</p>
          </div>
          <div className={`p-4 rounded-lg mb-6 ${result.color === 'green' ? 'bg-green-50 border border-green-200' : result.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' : result.color === 'orange' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-bold mb-2">{t("해석", "Interpretation")}</h3>
            <p className="text-sm">
              {result.total < 5 && t("지금 마음이 비교적 안정적입니다.", "Your mind seems relatively stable right now.")}
              {result.total >= 5 && result.total < 10 && t("마음이 조금 무거운 편입니다. 가벼운 자기돌봄이 도움이 될 수 있어요.", "You may be feeling a bit low. Light self-care can help.")}
              {result.total >= 10 && result.total < 15 && t("요즘 마음이 꽤 힘드신 것 같아요. 믿을 수 있는 누군가와 이야기 나눠보세요.", "It seems things have been quite tough. Try talking to someone you trust.")}
              {result.total >= 15 && result.total < 20 && t("많이 지치셨군요. 아래 상담 연결을 통해 이야기 나눠보시는 것도 좋아요.", "You seem very worn out. Reaching out for support would be a good step.")}
              {result.total >= 20 && t("지금 많이 힘드신 것 같아요. 혼자 감당하지 않아도 됩니다. 아래 상담 연결을 이용해 보세요.", "You seem to be going through a very hard time. You don't have to face this alone — please reach out for support.")}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold mb-2">{t("응답 내역", "Response History")}</h3>
            {phq9Q.map(q => (
              <div key={q.num} className="border-b pb-2">
                <p className="text-sm text-gray-600">{q.num}. {q.content}</p>
                <p className="text-sm font-semibold">{t("응답:", "Score:")} {phq9Responses[q.num] ?? '-'}{t("점", "")}</p>
              </div>
            ))}
          </div>
          <AiAnalysisBox
            aiKey="PHQ9"
            onRun={() => {
              const r = calcPhq9();
              runAiAnalysis("PHQ9", "PHQ9", {
                total: r.total, level: r.level,
                items: phq9Q.map(q => ({ question: q.content, score: phq9Responses[q.num] || 0 }))
              });
            }}
          />
          {(() => { const r = calcPhq9(); return <ShareResultButton text={t(`😔 PHQ-9 우울 검사 결과\n총점: ${r.total}/27 (${r.level})\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #심리검사`,`😔 PHQ-9 Depression Result\nTotal: ${r.total}/27 (${r.level})\nTested on Maumful! https://maumful.com`)} testLabel={t("PHQ-9 우울 자가점검","PHQ-9 Depression Screening")} scoreText={`${r.total}/27`} levelText={r.level} colorHex="#1B4332" />; })()}


          {/* 🤝 전문가 상담 CTA */}
          {(() => {
            const r = calcPhq9();
            const lvl = r.total >= 15 ? 'high' : r.total >= 10 ? 'mid' : 'low';
            return (<>
            {!isLoggedIn && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl text-center">
                <div className="text-2xl mb-2">🌱</div>
                <div className="font-bold text-green-800 mb-1">{t("결과를 저장하고 싶으신가요?", "Want to save your results?")}</div>
                <div className="text-sm text-green-700 mb-3">{t("무료 가입하면 검사 이력 저장 + 20 크레딧이 지급됩니다", "Sign up free to save your history and get 20 credits")}</div>
                <button onClick={() => setView('memberSignup')}
                  className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition"
                  style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
                  {t("무료로 가입하기 →", "Sign up free →")}
                </button>
              </div>
            )}
              <RecoveryCard testType="PHQ9" score={r.total} level={lvl} />
              <ExpertCTA testType="PHQ9" score={r.total} level={lvl}
              onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
            </>);
          })()}
{/* 💬 AI 상담 채팅 */}
          <ChatBox testType="PHQ9" initialPrompts={lang === 'en' ? [
            "What does my PHQ-9 result mean?",
            "What is my mental state based on this score?",
            "What can I do daily to improve depressive symptoms?",
            "Do I need professional counseling based on this result?"
          ] : [
            "제 PHQ-9 검사 결과가 어떤 의미인지 설명해주세요",
            "이 점수로 보아 저는 어떤 상태인가요?",
            "우울 증상을 개선하기 위해 일상에서 할 수 있는 것이 있나요?",
            "전문가 상담이 필요한 수준인지 판단해주세요"
          ]} />
        </div>
      </div>
    );
  }
  if (view === "gad7Result") {
    const result = calcGad7();
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-orange-800">😰 {t("GAD-7 불안 자가점검 결과", "GAD-7 Anxiety Screening Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <p className="text-sm"><strong>{t("세션 ID:", "Session ID:")}</strong> {sessionId}</p>
            <p className="text-sm"><strong>{t("전화번호:", "Phone:")}</strong> {userInfo.phone || "N/A"}</p>
            <p className="text-lg font-bold mt-2">{t("총점:", "Total:")} {result.total}/21 ({result.level})</p>
          </div>
          <div className={`p-4 rounded-lg mb-6 ${result.color === 'green' ? 'bg-green-50 border border-green-200' : result.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' : result.color === 'orange' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-bold mb-2">{t("해석", "Interpretation")}</h3>
            <p className="text-sm">
              {result.total < 5 && t("지금 마음이 비교적 안정적입니다.", "Your anxiety level seems minimal right now.")}
              {result.total >= 5 && result.total < 10 && t("마음이 조금 조여드는 편입니다. 충분히 쉬어가는 것이 도움이 될 수 있어요.", "You may be feeling some tension. Getting enough rest can help.")}
              {result.total >= 10 && result.total < 15 && t("많이 긴장하고 걱정이 많으신 것 같아요. 부담을 나눌 수 있는 공간을 찾아보세요.", "It seems you're quite tense and worried. Find a space to share the burden.")}
              {result.total >= 15 && t("요즘 마음이 많이 불안하신 것 같아요. 아래 상담 연결을 통해 도움을 받아보세요.", "Your anxiety seems quite high. Please reach out for support below.")}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold mb-2">{t("응답 내역", "Response History")}</h3>
            {gad7Q.map(q => (
              <div key={q.num} className="border-b pb-2">
                <p className="text-sm text-gray-600">{q.num}. {q.content}</p>
                <p className="text-sm font-semibold">{t("응답:", "Score:")} {gad7Responses[q.num] ?? '-'}{t("점", "")}</p>
              </div>
            ))}
          </div>
          <AiAnalysisBox
            aiKey="GAD7"
            onRun={() => {
              const r = calcGad7();
              runAiAnalysis("GAD7", "GAD7", {
                total: r.total, level: r.level,
                items: gad7Q.map(q => ({ question: q.content, score: gad7Responses[q.num] || 0 }))
              });
            }}
          />
          {(() => { const r = calcGad7(); return <ShareResultButton text={t(`😰 GAD-7 불안 검사 결과\n총점: ${r.total}/21 (${r.level})\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #심리검사`,`😰 GAD-7 Anxiety Result\nTotal: ${r.total}/21 (${r.level})\nTested on Maumful! https://maumful.com`)} testLabel={t("GAD-7 불안 자가점검","GAD-7 Anxiety Screening")} scoreText={`${r.total}/21`} levelText={r.level} colorHex="#1a3a5c" />; })()}


          {/* 🤝 전문가 상담 CTA */}
          {(() => {
            const r = calcGad7();
            const lvl = r.total >= 15 ? 'high' : r.total >= 10 ? 'mid' : 'low';
            return (<>
            {!isLoggedIn && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center">
                <div className="text-2xl mb-2">💙</div>
                <div className="font-bold text-blue-800 mb-1">{t("결과를 저장하고 싶으신가요?", "Want to save your results?")}</div>
                <div className="text-sm text-blue-700 mb-3">{t("무료 가입하면 검사 이력 저장 + 20 크레딧이 지급됩니다", "Sign up free to save your history and get 20 credits")}</div>
                <button onClick={() => setView('memberSignup')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition"
                  style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
                  {t("무료로 가입하기 →", "Sign up free →")}
                </button>
              </div>
            )}
              <RecoveryCard testType="GAD7" score={r.total} level={lvl} />
              <ExpertCTA testType="GAD7" score={r.total} level={lvl}
              onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
            </>);
          })()}
{/* 💬 AI 상담 채팅 */}
          <ChatBox testType="GAD7" initialPrompts={lang === 'en' ? [
            "What does my GAD-7 result mean?",
            "Are there specific items in the GAD-7 I should pay attention to?",
            "How are anxiety and daily functioning related?",
            "What are immediate strategies to reduce anxiety?"
          ] : [
            "불안 증상이 심한 경우 초기 상담 전략은 무엇인가요?",
            "GAD-7 결과에서 특히 주목해야 할 문항이 있나요?",
            "불안과 일상 기능 저하의 관계를 어떻게 이해하면 좋을까요?",
            "불안 완화를 위한 즉각적인 개입 방법을 알려주세요"
          ]} />
        </div>
      </div>
    );
  }

  // ── Holland RIASEC 결과 화면 ────────────────────────────────
  if (view === "riasecResult") {
    if (Object.keys(riasecResponses).length === 0) {
      setView(isLoggedIn ? "memberDashboard" : "testsIntro");
      return null;
    }
    const { scores, sorted, dominantType } = calcRiasec();
    const top1 = RIASEC_TYPE_INFO[sorted[0][0]];
    const top2 = RIASEC_TYPE_INFO[sorted[1][0]];
    const maxScore = 25;
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-violet-800">🔍 {t("Holland RIASEC 결과", "Holland RIASEC Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>

          {/* 주요 유형 뱃지 */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-6 text-center">
            <div className="text-4xl mb-2">{top1.emoji}{top2.emoji}</div>
            <div className="text-xl font-bold text-violet-800 mb-1">{dominantType}{t("형", "")} — {top1.name}·{top2.name}</div>
            <p className="text-sm text-gray-600 mt-2">{top1.desc}</p>
          </div>

          {/* 6개 유형 점수 바 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">{t("유형별 점수", "Scores by Type")}</h3>
            <div className="space-y-3">
              {sorted.map(([type, score], i) => {
                const info = RIASEC_TYPE_INFO[type];
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{info.emoji} {type} {info.name}</span>
                      <span className="text-sm font-bold text-violet-700">{score}/{maxScore}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${i === 0 ? 'bg-violet-600' : i === 1 ? 'bg-violet-400' : 'bg-violet-200'}`}
                        style={{width: `${(score / maxScore) * 100}%`}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 추천 직업 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">{t("추천 직업·역할", "Recommended Careers & Roles")}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[...top1.careers, ...top2.careers].map((c, i) => (
                <div key={i} className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-sm font-semibold text-violet-800 text-center">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <AiAnalysisBox
            aiKey="RIASEC"
            onRun={() => {
              runAiAnalysis("RIASEC", "RIASEC", {
                dominant_type: dominantType,
                top1: { type: sorted[0][0], name: top1.name, score: sorted[0][1] },
                top2: { type: sorted[1][0], name: top2.name, score: sorted[1][1] },
                scores,
              });
            }}
          />
          <ShareResultButton
            text={`🔍 Holland RIASEC 검사 결과\n${dominantType}형 (${top1.name}·${top2.name})\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #진로검사`}
            testLabel="Holland RIASEC 직업 흥미 검사"
            scoreText={`${dominantType}형`}
            levelText={`${top1.name}·${top2.name}`}
            colorHex="#5b21b6"
          />
          {isLoggedIn && (
            <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl text-center">
              <div className="text-sm font-semibold text-violet-800 mb-2">🎯 {t("이 결과를 AI 상담에 활용하세요", "Use this result in AI counseling")}</div>
              <button onClick={() => { setChatOpen(true); window.scrollTo(0, document.body.scrollHeight); }}
                className="bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-violet-800 transition">
                {t("AI 상담사에게 진로 조언 받기 →", "Get Career Advice from AI →")}
              </button>
            </div>
          )}
          <ChatBox testType="RIASEC" initialPrompts={t([
            `제 RIASEC 결과 ${dominantType}형이 어떤 의미인지 설명해주세요`,
            "이 유형에 맞는 진로 방향을 추천해 주세요",
            "현재 하는 일과 제 흥미 유형의 적합도가 어떤가요?",
            "강점을 살릴 수 있는 구체적인 직업 활동은 무엇인가요?",
          ],[
            `What does my RIASEC type ${dominantType} mean?`,
            "What career paths suit my interest type?",
            "How well does my current job match my interest type?",
            "What specific work activities best leverage my strengths?",
          ])} />
        </div>
      </div>
    );
  }

  // ── 직업가치관 결과 화면 ──────────────────────────────────────
  if (view === "valuesResult") {
    if (Object.keys(valuesResponses).length === 0) {
      setView(isLoggedIn ? "memberDashboard" : "testsIntro");
      return null;
    }
    const { scores, sorted } = calcValues();
    const top3 = sorted.slice(0, 3);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-amber-800">💎 {t("직업가치관 결과", "Work Values Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>

          {/* 핵심 가치 Top 3 */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-amber-800 mb-3 text-center">{t("나의 핵심 직업 가치", "My Top Work Values")}</h3>
            <div className="grid grid-cols-3 gap-3">
              {top3.map(([key, score], i) => {
                const info = VALUES_DOMAIN_INFO[key];
                return (
                  <div key={key} className="bg-white border border-amber-200 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{info.emoji}</div>
                    <div className={`text-xs font-bold mb-1 ${i === 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}{info.label}
                    </div>
                    <div className="text-sm font-bold text-gray-800">{score}{t("점", "")}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-amber-700 mt-3 text-center">
              {VALUES_DOMAIN_INFO[top3[0][0]].desc}
            </p>
          </div>

          {/* 전체 가치 순위 바 차트 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">{t("전체 가치 순위", "Full Value Rankings")}</h3>
            <div className="space-y-3">
              {sorted.map(([key, score], i) => {
                const info = VALUES_DOMAIN_INFO[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{info.emoji} {info.label}</span>
                      <span className="text-sm font-bold text-amber-700">{score}{t("점", "")}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full transition-all ${i < 3 ? 'bg-amber-500' : 'bg-amber-200'}`}
                        style={{width: `${score}%`}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AiAnalysisBox
            aiKey="VALUES"
            onRun={() => {
              runAiAnalysis("VALUES", "VALUES", {
                top3: top3.map(([key, score]) => ({ key, label: VALUES_DOMAIN_INFO[key].label, score })),
                scores,
              });
            }}
          />
          <ShareResultButton
            text={`💎 직업가치관 검사 결과\n1위: ${VALUES_DOMAIN_INFO[top3[0][0]].emoji}${VALUES_DOMAIN_INFO[top3[0][0]].label} (${top3[0][1]}점)\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #진로검사`}
            testLabel="직업가치관 검사"
            scoreText={`${VALUES_DOMAIN_INFO[top3[0][0]].label} 1위`}
            levelText={`${top3[0][1]}점`}
            colorHex="#92400e"
          />
          {isLoggedIn && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <div className="text-sm font-semibold text-amber-800 mb-2">💡 {t("나의 가치에 맞는 직업을 탐색해 보세요", "Explore careers that match your values")}</div>
              <button onClick={() => { setChatOpen(true); window.scrollTo(0, document.body.scrollHeight); }}
                className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition">
                {t("AI 상담사에게 진로 조언 받기 →", "Get Career Advice from AI →")}
              </button>
            </div>
          )}
          <ChatBox testType="VALUES" initialPrompts={t([
            `제 1위 가치인 '${VALUES_DOMAIN_INFO[top3[0][0]].label}'가 어떤 의미인지 설명해주세요`,
            "이 가치관에 맞는 직업을 추천해 주세요",
            "현재 직업과 제 가치관이 얼마나 맞는지 분석해 주세요",
            "직업 선택 시 이 가치관을 어떻게 활용하면 좋을까요?",
          ],[
            `What does my top work value '${VALUES_DOMAIN_INFO[top3[0][0]].label}' mean?`,
            "What careers align with my work values?",
            "How well does my current job match my values?",
            "How can I use these values when choosing a career?",
          ])} />
        </div>
      </div>
    );
  }

  // DASS-21 결과 화면
  if (view === "dass21Result") {
    const result = calcDass21();
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-teal-800">📊 {t("DASS-21 결과", "DASS-21 Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 ${result.depression.color === 'green' ? 'border-green-300 bg-green-50' : result.depression.color === 'blue' ? 'border-blue-300 bg-blue-50' : result.depression.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' : result.depression.color === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
              <h3 className="font-bold text-lg mb-2">😔 {t("우울", "Depression")}</h3>
              <p className="text-2xl font-bold">{result.depression.score}</p>
              <p className="text-sm mt-1">{result.depression.level}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${result.anxiety.color === 'green' ? 'border-green-300 bg-green-50' : result.anxiety.color === 'blue' ? 'border-blue-300 bg-blue-50' : result.anxiety.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' : result.anxiety.color === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
              <h3 className="font-bold text-lg mb-2">😰 {t("불안", "Anxiety")}</h3>
              <p className="text-2xl font-bold">{result.anxiety.score}</p>
              <p className="text-sm mt-1">{result.anxiety.level}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${result.stress.color === 'green' ? 'border-green-300 bg-green-50' : result.stress.color === 'blue' ? 'border-blue-300 bg-blue-50' : result.stress.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' : result.stress.color === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
              <h3 className="font-bold text-lg mb-2">😓 {t("스트레스", "Stress")}</h3>
              <p className="text-2xl font-bold">{result.stress.score}</p>
              <p className="text-sm mt-1">{result.stress.level}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold mb-2">{t("응답 내역", "Response History")}</h3>
            {dass21Q.map(q => (
              <div key={q.num} className="border-b pb-2">
                <p className="text-sm text-gray-600">{q.num}. {q.content} <span className="text-xs text-gray-400">({q.scale})</span></p>
                <p className="text-sm font-semibold">{t("응답:", "Score:")} {dass21Responses[q.num]}</p>
              </div>
            ))}
          </div>
          <AiAnalysisBox
            aiKey="DASS21"
            onRun={() => {
              const r = calcDass21();
              runAiAnalysis("DASS21", "DASS21", {
                depression: { score: r.depression.score, level: r.depression.level },
                anxiety: { score: r.anxiety.score, level: r.anxiety.level },
                stress: { score: r.stress.score, level: r.stress.level }
              });
            }}
          />
          {(() => { const r = calcDass21(); return <ShareResultButton text={t(`📊 DASS-21 결과\n우울: ${r.depression.score}점 / 불안: ${r.anxiety.score}점 / 스트레스: ${r.stress.score}점\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #심리검사`,`📊 DASS-21 Result\nDepression: ${r.depression.score} / Anxiety: ${r.anxiety.score} / Stress: ${r.stress.score}\nTested on Maumful! https://maumful.com`)} testLabel={t("DASS-21 종합 정서검사","DASS-21 Comprehensive Emotional Assessment")} scoreText={t(`우울 ${r.depression.score} / 불안 ${r.anxiety.score}`,`D:${r.depression.score} / A:${r.anxiety.score}`)} levelText={t(`스트레스 ${r.stress.score}점`,`Stress: ${r.stress.score}`)} colorHex="#2c5364" />; })()}


          {/* 🤝 전문가 상담 CTA */}
          {(() => {
            const r = calcDass21();
            const lvl = r.depression >= 21 || r.anxiety >= 15 || r.stress >= 27 ? 'high' : r.depression >= 14 || r.anxiety >= 10 ? 'mid' : 'low';
            return (<>
              <RecoveryCard testType="DASS21" score={0} level={lvl} stressScore={r.stress?.score} />
              <ExpertCTA testType="DASS21" score={0} level={lvl}
              onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
            </>);
          })()}
{/* 💬 AI 상담 채팅 */}
          <ChatBox testType="DASS21" initialPrompts={t([
            "우울/불안/스트레스가 모두 높을 때 우선순위는 무엇인가요?",
            "DASS-21 결과에서 가장 시급한 개입 영역은 어디인가요?",
            "세 가지 영역 간의 상호작용을 어떻게 이해해야 하나요?",
            "각 영역별 맞춤 상담 전략을 제안해주세요"
          ],[
            "What should I prioritize when depression, anxiety, and stress are all high?",
            "Which area of my DASS-21 results needs the most urgent attention?",
            "How should I understand the interaction between the three domains?",
            "Can you suggest tailored strategies for each domain?"
          ])} />
        </div>
      </div>
    );
  }

  // Big5 결과 화면
  if (view === "burnoutResult") {
    if (Object.keys(burnoutResponses).length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t("데이터 오류","Data Error")}</h1>
            <p className="text-gray-600 mb-4">{t("검사 응답 데이터를 찾을 수 없습니다.","No response data found.")}</p>
            <p className="text-sm text-gray-500 mb-4">{t("세션 ID:","Session ID:")} {sessionId || 'N/A'}</p>
            <button onClick={() => setView("memberDashboard")} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">
              ← {t("돌아가기","Back")}
            </button>
          </div>
        </div>
      );
    }

    try {
      const result = calcBurnout();

      if (!result || !result.domains) {
        return (
          <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t("데이터 오류","Data Error")}</h1>
              <p className="text-gray-600 mb-4">{t("검사 결과를 계산할 수 없습니다.","Unable to calculate results.")}</p>
              <button onClick={() => setView("memberDashboard")} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">
                ← {t("돌아가기","Back")}
              </button>
            </div>
          </div>
        );
      }

      const { domains, totalScore, percentage, level, crisis, domainCrisis } = result;

      const levelConfig = {
        "매우 낮음": { color: "bg-green-100 text-green-800 border-green-300", icon: "😊", en: "Very Low" },
        "낮음":      { color: "bg-blue-100 text-blue-800 border-blue-300",   icon: "🙂", en: "Low" },
        "보통":      { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "😐", en: "Moderate" },
        "높음":      { color: "bg-orange-100 text-orange-800 border-orange-300", icon: "😰", en: "High" },
        "매우 높음": { color: "bg-red-100 text-red-800 border-red-300",       icon: "🔥", en: "Very High" },
      };

      const config = levelConfig[level] || levelConfig["보통"];
      const levelLabel = lang === 'en' ? (config.en || level) : level;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-red-600">🔥 {t("번아웃 증후군 검사 결과 (K-MBI+)","Burnout Syndrome Result (K-MBI+)")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록","Back")}
            </button>
          </div>

          {/* 위기 경고 배너 */}
          {crisis && (
            <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔴</span>
                <div>
                  <h3 className="text-lg font-bold text-orange-700 mb-2">{t("소진 신호가 높아요","High Burnout Signal Detected")}</h3>
                  <p className="text-sm text-orange-700 mb-2">
                    {t("번아웃 신호가 전반적으로 높게 나타났습니다.","Your burnout indicators are significantly elevated across multiple areas.")}
                  </p>
                  <p className="text-sm text-orange-700 font-semibold">
                    {t("지금 잠시 멈추고, 충분히 쉬어가는 시간이 필요합니다. 혼자 감당하지 않아도 돼요.","It's important to pause and rest. You don't have to carry this alone.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 전체 점수 카드 */}
          <div className={`border-2 rounded-lg p-6 mb-6 ${config.color}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t("전체 번아웃 수준","Overall Burnout Level")}</h2>
              <span className="text-5xl">{config.icon}</span>
            </div>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-5xl font-bold">{totalScore}</span>
              <span className="text-2xl text-gray-600">/ {t("240점","240")}</span>
              <span className="text-3xl font-bold ml-4">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 mb-3">
              <div
                className={`h-6 rounded-full ${percentage >= 75 ? 'bg-red-600' : percentage >= 50 ? 'bg-orange-500' : percentage >= 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-xl font-bold">{levelLabel}</p>
          </div>

          {/* 영역별 점수 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📊 {t("영역별 분석","Domain Analysis")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domains.map((domain, idx) => {
                const isCrisis = domainCrisis.includes(domain.name);
                return (
                  <div key={domain.id || idx} className={`border rounded-lg p-4 ${isCrisis ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">{domain.name}</h3>
                      {isCrisis && <span className="text-red-600 font-bold text-sm">⚠️ {t("위기","Critical")}</span>}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold">{domain.score}</span>
                      <span className="text-sm text-gray-600">/ {domain.max}{t("점","")}</span>
                      <span className="text-xl font-bold ml-2">{domain.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full ${isCrisis ? 'bg-red-600' : 'bg-blue-500'}`}
                        style={{ width: `${domain.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>{t("수준:","Level:")}</strong> {domain.level}
                    </p>
                    <p className="text-sm text-gray-700">{domain.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 해석 및 권고사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-800">💡 {t("결과 해석 및 권고사항","Results & Recommendations")}</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-bold text-base mb-1">📌 {t("점수 해석 기준:","Score Guide:")}</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>{t("0-30%: 매우 낮음 (건강한 상태)","0–30%: Very Low (Healthy)")}</li>
                  <li>{t("31-50%: 낮음 (주의 필요)","31–50%: Low (Worth monitoring)")}</li>
                  <li>{t("51-70%: 보통 (관리 필요)","51–70%: Moderate (Needs management)")}</li>
                  <li>{t("71-85%: 높음 (상담 권장)","71–85%: High (Counseling recommended)")}</li>
                  <li>{t("86-100%: 매우 높음 (즉시 개입 필요)","86–100%: Very High (Immediate attention needed)")}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-base mb-1">🩺 {t("권장 조치:","Recommended Actions:")}</p>
                <ul className="list-disc ml-5 space-y-1">
                  {percentage < 30 && <li>{t("현재 건강한 상태를 유지하고 있습니다. 지속적인 자기 관리를 권장합니다.","You are in a healthy state. Keep up your self-care routines.")}</li>}
                  {percentage >= 30 && percentage < 50 && <li>{t("가벼운 번아웃 증상이 나타나고 있습니다. 충분한 휴식과 스트레스 관리가 필요합니다.","Mild burnout signs are present. Rest and stress management will help.")}</li>}
                  {percentage >= 50 && percentage < 70 && <li>{t("번아웃 증상이 보통 수준입니다. 전문가 상담 및 생활 습관 개선을 고려해 보세요.","Moderate burnout detected. Consider professional counseling and lifestyle adjustments.")}</li>}
                  {percentage >= 70 && percentage < 85 && <li>{t("높은 수준의 번아웃입니다. 전문 상담사와의 상담을 권장합니다.","High burnout level. We recommend speaking with a professional counselor.")}</li>}
                  {percentage >= 85 && <li>{t("소진 신호가 매우 높습니다. 지금 쉬어가는 것이 중요합니다. 전문가 상담을 권합니다.","Burnout signals are very high. Rest is essential right now. Please seek professional support.")}</li>}
                </ul>
              </div>
              <div>
                <p className="font-bold text-base mb-1">🌱 {t("자가 관리 팁:","Self-Care Tips:")}</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>{t("규칙적인 수면 패턴 유지 (하루 7-8시간)","Maintain a regular sleep schedule (7–8 hours/day)")}</li>
                  <li>{t("업무와 개인 시간의 명확한 경계 설정","Set clear boundaries between work and personal time")}</li>
                  <li>{t("취미 활동 및 사회적 관계 유지","Keep up hobbies and social connections")}</li>
                  <li>{t("정기적인 신체 활동 (주 3회 이상)","Regular physical activity (3+ times/week)")}</li>
                  <li>{t("마음챙김 명상 및 이완 기법 연습","Practice mindfulness and relaxation techniques")}</li>
                </ul>
              </div>
            </div>
          </div>
          <AiAnalysisBox
            aiKey="BURNOUT"
            onRun={() => {
              const r = calcBurnout();
              runAiAnalysis("BURNOUT", "BURNOUT", {
                totalScore: r.totalScore,
                percentage: r.percentage,
                level: r.level,
                domains: r.domains
              });
            }}
          />
          {(() => { const r = calcBurnout(); const lvlEn = ({매우낮음:"Very Low",낮음:"Low",보통:"Moderate",높음:"High",매우높음:"Very High"})[r.level?.replace(/\s/g,'')] || r.level; return <ShareResultButton text={t(`🔥 K-MBI+ 번아웃 검사 결과\n${r.level} (${r.percentage}%)\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #번아웃`,`🔥 K-MBI+ Burnout Result\n${lvlEn} (${r.percentage}%)\nTested on Maumful! https://maumful.com`)} testLabel={t("K-MBI+ 번아웃 검사","K-MBI+ Burnout Assessment")} scoreText={`${r.percentage}%`} levelText={lang==='en'?lvlEn:r.level} colorHex="#4a1942" />; })()}


          {/* 🤝 전문가 상담 CTA */}
          {(() => {
            const r = calcBurnout();
            const lvl = r.ee >= 27 ? 'high' : r.ee >= 17 ? 'mid' : 'low';
            return (<>
              <RecoveryCard testType="BURNOUT" score={result.totalScore} level={lvl} />
              <ExpertCTA testType="BURNOUT" score={0} level={lvl}
              onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
            </>);
          })()}
{/* 💬 AI 상담 채팅 */}
          <ChatBox testType="BURNOUT" initialPrompts={t([
            "소진 수준이 높은 내담자를 위한 즉각적인 개입 방법은?",
            "K-MBI+ 결과에서 가장 우선적으로 다뤄야 할 영역은?",
            "업무 복귀를 위한 단계적 접근 방법을 알려주세요",
            "번아웃 회복을 위한 장기적인 전략을 제안해주세요"
          ],[
            "What immediate interventions help someone with high burnout?",
            "Which K-MBI+ area should I address first?",
            "What is a step-by-step approach to returning to work?",
            "Can you suggest a long-term strategy for burnout recovery?"
          ])} />
        </div>
      </div>
    );
    } catch (error) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t("오류 발생","Error")}</h1>
            <p className="text-gray-600 mb-4">{t("결과 화면을 표시할 수 없습니다.","Unable to display results.")}</p>
            <p className="text-sm text-gray-500 mb-4">{error.toString()}</p>
            <button onClick={() => setView("memberDashboard")} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">
              ← {t("돌아가기","Back")}
            </button>
          </div>
        </div>
      );
    }
  }

  if (view === "big5Result") {
    const result = calcBig5();
    const big5FactorLabel = {
      "외향성": t("외향성", "Extraversion"),
      "친화성": t("친화성", "Agreeableness"),
      "성실성": t("성실성", "Conscientiousness"),
      "신경성": t("신경성", "Neuroticism"),
      "개방성": t("개방성", "Openness"),
    };
    const big5FactorDesc = {
      "외향성": score => score >= 3.5 ? t("사교적이고 활동적입니다", "Sociable and energetic") : t("조용하고 내성적입니다", "Quiet and introspective"),
      "친화성": score => score >= 3.5 ? t("협조적이고 친절합니다", "Cooperative and kind") : t("독립적이고 경쟁적입니다", "Independent and competitive"),
      "성실성": score => score >= 3.5 ? t("계획적이고 책임감이 강합니다", "Organized and responsible") : t("융통성 있고 자발적입니다", "Flexible and spontaneous"),
      "신경성": score => score >= 3.5 ? t("감정적으로 민감합니다", "Emotionally sensitive") : t("정서적으로 안정적입니다", "Emotionally stable"),
      "개방성": score => score >= 3.5 ? t("창의적이고 호기심이 많습니다", "Creative and curious") : t("실용적이고 현실적입니다", "Practical and realistic"),
    };
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">🌟 {t("Big5 성격검사 결과", "Big Five Personality Result")}</h1>
            <button onClick={() => setView(isLoggedIn ? "memberDashboard" : "testsIntro")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">
              ← {t("목록", "Back")}
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(result).map(([factor, score]) => (
              <div key={factor} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{big5FactorLabel[factor] || factor}</h3>
                  <span className="text-2xl font-bold text-purple-600">{score}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${(score / 5) * 100}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {big5FactorDesc[factor] && big5FactorDesc[factor](score)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold mb-2">{t("해석 안내", "How to Read Your Results")}</h3>
            <p className="text-sm text-gray-700">
              {t("각 요인은 1-5점 범위로 측정됩니다. 3.5점 이상은 해당 특성이 강함을, 2.5점 이하는 해당 특성이 약함을 의미합니다. 중간 범위(2.5-3.5)는 균형 잡힌 특성을 나타냅니다.", "Each factor is scored on a 1–5 scale. A score of 3.5 or above indicates a strong trait, below 2.5 a weak trait, and the middle range (2.5–3.5) reflects a balanced characteristic.")}
            </p>
          </div>
          <AiAnalysisBox
            aiKey="BIG5"
            onRun={() => {
              const r = calcBig5();
              runAiAnalysis("BIG5", "BIG5", { factors: r });
            }}
          />
          {(() => {
            const r = calcBig5();
            const top = Object.entries(r).sort(([,a],[,b]) => b-a)[0];
            return <ShareResultButton text={t(`🌟 Big5 성격검사 결과\n가장 높은 특성: ${top?.[0]} (${top?.[1]}/5)\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #성격검사`,`🌟 Big Five Personality Result\nTop trait: ${top?.[0]} (${top?.[1]}/5)\nTested on Maumful! https://maumful.com`)} testLabel={t("Big5 성격 5요인 검사","Big Five Personality Test")} scoreText={top?.[0] || ''} levelText={`${top?.[1]}/5`} colorHex="#3b1f8c" />;
          })()}


          {/* 🤝 전문가 상담 CTA */}
          <RecoveryCard testType="BIG5" score={0} level="low" />
          <ExpertCTA testType="BIG5" score={0} level="low"
            onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
{/* 💬 AI 상담 채팅 */}
          <ChatBox testType="BIG5" initialPrompts={t([
            "성격 특성을 상담에 어떻게 활용할 수 있나요?",
            "Big-5 결과에서 가장 주목해야 할 요인은 무엇인가요?",
            "성격 강점을 발견하고 개발하는 방법은?",
            "성격 특성 간의 상호작용이 삶에 어떤 영향을 미치나요?"
          ],[
            "How can I use personality traits in counseling?",
            "Which Big-5 factor should I pay most attention to?",
            "How can I discover and develop my personality strengths?",
            "How do personality traits interact and affect my life?"
          ])} />
          {returnToCouple && (
            <button onClick={goBackToCouple}
              className="w-full mt-4 bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition">
              💕 마음커플로 돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === "lostResult") {
    const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
    const counselingType = activeLinkData?.counselingType || "psychological";
    const counselingLabel = counselingType === "biblical" ? "🕊️ 기독교 상담" : "🧠 심리상담";
    const counselingColor = counselingType === "biblical" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-teal-50 border-teal-200 text-teal-700";

    const AXIS_LABELS = {
      E: { label:t("에너지 방향","Energy Direction"), low:t("내향(I)","Introversion (I)"), high:t("외향(E)","Extroversion (E)"), color:"teal" },
      D: { label:t("의사결정","Decision-Making"),     low:t("감정(F)","Feeling (F)"),       high:t("논리(T)","Logic (T)"),         color:"blue" },
      S: { label:t("행동 속도","Action Speed"),       low:t("신중(J)","Judicious (J)"),     high:t("빠름(P)","Spontaneous (P)"),   color:"orange" },
      N: { label:t("안정성","Stability"),             low:t("안정(N)","Stability (N)"),     high:t("변화(C)","Change (C)"),        color:"green" },
      R: { label:t("관계 민감도","Rel. Sensitivity"), low:t("독립(I)","Independence (I)"),  high:t("관계중심(R)","Relational (R)"), color:"purple" },
      T: { label:t("스트레스","Stress"),              low:t("회피(V)","Avoiding (V)"),      high:t("직면(A)","Confronting (A)"),   color:"red" },
    };
    const barColorMap = { teal:"bg-teal-500", blue:"bg-blue-500", orange:"bg-orange-400", green:"bg-green-500", purple:"bg-purple-500", red:"bg-red-400" };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {ProtectionLayers}
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 헤더 */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-teal-800">🧭 {t("LOST 행동 운영체계 검사 결과", "LOST Behavioral Style Result")}</h1>
              <button onClick={() => setView("memberDashboard")} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500">← {t("목록", "Back")}</button>
            </div>

            {/* 유형 카드 */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white text-center mb-4">
              <div className="text-6xl mb-2">{typeInfo.icon}</div>
              <div className="text-3xl font-black mb-1">{typeInfo.name}</div>
              <div className="text-teal-200 text-sm font-semibold mb-2">{typeInfo.eng} · {t("유형 코드:", "Type Code:")} {typeCode}</div>
              <p className="text-teal-100 text-sm leading-relaxed max-w-md mx-auto">{typeInfo.desc}</p>
              <div className="mt-3 flex justify-center gap-2 flex-wrap">
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {t("스트레스:", "Stress:")} {stressStyle === "A" ? t("직면형","Confronting") : t("회피형","Avoiding")}
                </span>
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {t("변화 선호도:", "Change Preference:")} {stabilityStyle === "변화선호" ? t("변화선호","Prefers Change") : t("안정선호","Prefers Stability")}
                </span>
              </div>
            </div>

            {/* 핵심 특징 */}
            <div className="flex flex-wrap gap-2 justify-center mb-2">
              {typeInfo.traits.map(tr => (
                <span key={tr} className="bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">{tr}</span>
              ))}
            </div>
          </div>

          {/* 6축 레이더/바 차트 */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📊 {t("6축 프로파일", "6-Axis Profile")}</h2>
            <div className="space-y-4">
              {Object.entries(AXIS_LABELS).map(([k, info]) => {
                const val = axisAvg[k] || 3;
                const pct = ((val - 1) / 4) * 100;
                return (
                  <div key={k}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{info.label}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400">{info.low}</span>
                        <span className="text-sm font-bold text-gray-800">{Number(val).toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{info.high}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div className={`h-3 rounded-full transition-all ${barColorMap[info.color]}`} style={{width:`${pct}%`}}></div>
                      <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-400 opacity-50"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>1.0</span><span>3.0 ({t("중립","Neutral")})</span><span>5.0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 강점 · 약점 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-base font-bold text-green-700 mb-3">💪 {t("강점","Strengths")}</h2>
              <ul className="space-y-2">
                {typeInfo.strength.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-green-500 font-bold mt-0.5">✓</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-base font-bold text-orange-600 mb-3">⚠️ {t("성장 포인트","Growth Areas")}</h2>
              <ul className="space-y-2">
                {typeInfo.weakness.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-orange-400 font-bold mt-0.5">△</span>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 상황별 행동 팁 */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3">💡 {t("상황별 행동 팁","Situational Tips")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-bold text-blue-700 mb-1">🏢 {t("직장","Workplace")}</p>
                <p className="text-sm text-gray-700">{typeInfo.work}</p>
              </div>
              <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                <p className="text-xs font-bold text-pink-700 mb-1">💑 {t("연애·관계","Relationships")}</p>
                <p className="text-sm text-gray-700">{typeInfo.love}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <p className="text-xs font-bold text-yellow-700 mb-1">😤 {t("스트레스","Stress")}</p>
                <p className="text-sm text-gray-700">{typeInfo.stress}</p>
              </div>
            </div>
          </div>

          {/* 궁합 유형 */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3">🤝 {t("유형 궁합","Type Compatibility")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2">✅ {t("잘 맞는 유형","Compatible Types")}</p>
                <div className="flex flex-wrap gap-2">
                  {typeInfo.match.map(m => {
                    const matchType = LOST_TYPES[m];
                    return (
                      <span key={m} className="bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {matchType ? matchType.icon : "🤝"} {matchType ? matchType.name : m}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600 mb-2">⚡ {t("마찰이 있을 수 있는 유형","Potentially Challenging Types")}</p>
                <div className="flex flex-wrap gap-2">
                  {typeInfo.conflict.map(c => {
                    const conflictType = LOST_TYPES[c];
                    return (
                      <span key={c} className="bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {conflictType ? conflictType.icon : "⚡"} {conflictType ? conflictType.name : c}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 전체 16유형 맵 */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3">🗺️ {t("전체 16유형 맵","All 16 Types")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(LOST_TYPES).map(([code, typ]) => (
                <div key={code} className={`rounded-lg p-2 border text-center text-xs transition ${code === typeCode ? "border-teal-500 bg-teal-50 shadow-md scale-105" : "border-gray-200 bg-gray-50"}`}>
                  <div className="text-xl mb-0.5">{typ.icon}</div>
                  <div className={`font-bold text-xs ${code === typeCode ? "text-teal-800" : "text-gray-700"}`}>{typ.name}</div>
                  <div className="text-gray-400 text-xs">{code}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 분석 */}
          <div className="bg-white rounded-xl shadow p-5">
            <AiAnalysisBox
              aiKey="LOST"
              onRun={() => {
                const r = calcLost();
                runAiAnalysis("LOST", "LOST", {
                  typeCode: r.typeCode,
                  typeName: r.typeInfo.name,
                  axisAvg: r.axisAvg,
                  stressStyle: r.stressStyle,
                  stabilityStyle: r.stabilityStyle,
                });
              }}
            />
          </div>
          {(() => { const r = calcLost(); return <ShareResultButton text={t(`🧭 LOST 행동 유형 검사 결과\n유형: ${r.typeCode} ${r.typeInfo.name}\n마음풀에서 검사해봤어요! https://maumful.com #마음풀 #LOST`,`🧭 LOST Behavioral Style Result\nType: ${r.typeCode} ${r.typeInfo?.eng || r.typeInfo?.name}\nTested on Maumful! https://maumful.com`)} testLabel={t("LOST 행동 운영체계 검사","LOST Behavioral System Assessment")} scoreText={r.typeCode} levelText={r.typeInfo?.eng || r.typeInfo?.name} colorHex="#7c4f1e" />; })()}


          {/* 🤝 전문가 상담 CTA */}
          {(() => {
            const r = calcLost();
            const lvl = 'low';
            return (<>
              <RecoveryCard testType="LOST" score={0} level={lvl} />
              <ExpertCTA testType="LOST" score={0} level={lvl}
              onContinueAI={() => { setChatOpen(true); window.scrollTo(0,document.body.scrollHeight); }} />
            </>);
          })()}
{/* AI 채팅 */}
          <div className="bg-white rounded-xl shadow p-5">
            <ChatBox testType="LOST" initialPrompts={t([
              "이 유형의 가장 큰 강점을 상담에서 어떻게 활용할 수 있나요?",
              "행동 유형이 대인관계에 미치는 영향을 설명해 주세요",
              "스트레스 반응 방식을 개선하는 방법은 무엇인가요?",
              "이 내담자에게 가장 적합한 상담 접근법은?"
            ],[
              "How can the key strengths of this behavioral type be used in counseling?",
              "How does this behavioral style affect interpersonal relationships?",
              "What are ways to improve stress response patterns?",
              "What counseling approach is best suited for this type?"
            ])} />
          </div>
          {returnToCouple && (
            <button onClick={goBackToCouple}
              className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition">
              💕 마음커플로 돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 관리자 대시보드 ─────────────────────────────────────────
  if (view === 'admin') {
    const S = { card:'bg-white rounded-xl border border-gray-100 shadow-sm p-5', tabBtn:(active) => `px-4 py-2 text-sm font-semibold rounded-lg transition ${active?'bg-indigo-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}` };
    if (!adminAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🔐</div>
              <h1 className="text-xl font-bold text-gray-800">관리자 로그인</h1>
            </div>
            <input type="password" placeholder="관리자 비밀번호"
              value={adminSecretInput} onChange={e => { setAdminSecretInput(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && tryAdminLogin()}
              className={`w-full border rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 ${adminAuthError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-300'}`} />
            {adminAuthError && <div className="text-xs text-red-500 font-semibold mb-3">{adminAuthError}</div>}
            <button onClick={tryAdminLogin} disabled={adminLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-xl font-bold transition mt-2">
              {adminLoading ? '확인 중...' : '로그인'}
            </button>
            <button onClick={() => setView('memberDashboard')} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-3 text-center">← 돌아가기</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <span className="font-bold text-gray-800">마음풀 관리자</span>
            </div>
            <div className="flex items-center gap-2">
              {adminLoading && <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
              <button onClick={() => setView('memberDashboard')} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg">← 대시보드</button>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {adminMsg.text && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${adminMsg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-red-50 text-red-700 border border-red-200'}`}>
              {adminMsg.text}
              <button onClick={() => setAdminMsg({type:'',text:''})} className="ml-3 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[['overview','📊 개요'],['users','👥 사용자'],['payments','💳 결제'],['tests','📋 검사'],['coupons','🎟️ 쿠폰'],['partners','🤝 파트너'],['notices','📢 공지'],['loop','🔁 루프'],['feedback','🙂 해석 피드백']].map(([tab, label]) => (
              <button key={tab} onClick={() => { setAdminTab(tab); if(tab==='overview') loadAdminOverview(); else if(tab==='users') loadAdminUsers(); else if(tab==='payments') loadAdminPayments(); else if(tab==='loop') loadAdminLoop(); else if(tab==='feedback') loadAdminFb(); }}
                className={S.tabBtn(adminTab===tab)}>{label}</button>
            ))}
          </div>

          {adminTab === 'coupons' && <MasterCouponPanel />}
          {adminTab === 'partners' && <MasterPartnerPanel />}
          {adminTab === 'notices' && <MasterNoticePanel />}

          {adminTab === 'loop' && (
            <div className="space-y-6">
              {!adminLoop && <div className="text-sm text-gray-400 py-8 text-center">불러오는 중…</div>}
              {adminLoop && (
                <>
                  <p className="text-xs text-gray-500">최근 {adminLoop.days}일 · 각 단계는 <b>사람 수(중복 제거)</b>입니다.</p>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-emerald-700 mb-4">③ 검사 → 게임 (정방향)</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        ['검사 완료', adminLoop.forward.tested],
                        ['리포트 열람', adminLoop.forward.reportView],
                        ['게임 처방 클릭', adminLoop.forward.rxClick],
                        ['게임 플레이', adminLoop.forward.played],
                      ].map(([label, val], i, arr) => (
                        <div key={label} className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{val}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{label}</div>
                          {i > 0 && arr[i-1][1] > 0 && (
                            <div className="text-[10px] text-emerald-600 mt-0.5">{Math.round(val / arr[i-1][1] * 100)}%</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {adminLoop.forward.byGame.length > 0 && (
                      <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                        처방 클릭: {adminLoop.forward.byGame.map(g => `${g.meta} ${g.c}회`).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-emerald-700 mb-4">⑥ 게임 → 검사 (역방향)</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        ['게임 플레이', adminLoop.reverse.played],
                        ['검사 제안 노출', adminLoop.reverse.suggestionView],
                        ['제안 클릭', adminLoop.reverse.suggestionClick],
                        ['실제 검사 완료', adminLoop.reverse.testCompleted],
                      ].map(([label, val], i, arr) => (
                        <div key={label} className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{val}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{label}</div>
                          {i > 0 && arr[i-1][1] > 0 && (
                            <div className="text-[10px] text-emerald-600 mt-0.5">{Math.round(val / arr[i-1][1] * 100)}%</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {adminLoop.reverse.byTest.length > 0 && (
                      <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                        제안 클릭: {adminLoop.reverse.byTest.map(t => `${t.meta} ${t.c}회`).join(' · ')}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                      ‘실제 검사 완료’는 제안을 누른 뒤 그 검사를 끝낸 사람 수입니다. 이 숫자가 루프가 닫혔는지를 보여줍니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {adminTab === 'feedback' && (
            <div className="space-y-6">
              {!adminFb && <div className="text-sm text-gray-400 py-8 text-center">불러오는 중…</div>}
              {adminFb && (
                <>
                  <p className="text-xs text-gray-500">최근 {adminFb.days}일 · AI 해석 👍/👎 (검사별 feature)</p>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-emerald-700 mb-4">기능별 만족도</h3>
                    {adminFb.byFeature.length === 0 ? (
                      <p className="text-sm text-gray-400">아직 수집된 피드백이 없어요.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {adminFb.byFeature.map(f => {
                          const pct = f.total > 0 ? Math.round(f.up / f.total * 100) : 0;
                          return (
                            <div key={f.feature} className="flex items-center gap-3">
                              <span className="text-xs font-mono text-gray-600 w-32 shrink-0 truncate">{f.feature}</span>
                              <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500 w-28 text-right tabular-nums">👍{f.up} · 👎{f.down} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-emerald-700 mb-4">👎 아쉬운 이유</h3>
                    {adminFb.downReasons.length === 0 ? (
                      <p className="text-sm text-gray-400">아직 없어요.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {adminFb.downReasons.map(r => {
                          const label = { generic:'너무 일반적', mismatch:'내 결과와 안 맞음', long:'너무 길다', other:'기타' }[r.reason] || r.reason;
                          return <span key={r.reason} className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100">{label} <b className="tabular-nums">{r.c}</b></span>;
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">👎가 많은 기능·사유를 보고 프롬프트를 개선하세요. (예: ‘너무 길다’가 많으면 섹션 압축)</p>
                  </div>
                </>
              )}
            </div>
          )}

          {adminTab === 'overview' && adminStats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label:'총 가입자', val:(adminStats.users?.total||0).toLocaleString(), sub:`오늘 +${adminStats.users?.today||0}`, color:'text-indigo-600' },
                  { label:'이번달 매출', val:`₩${(adminStats.revenue?.thisMonthAmount||0).toLocaleString()}`, sub:`결제 ${adminStats.revenue?.thisMonthCount||0}건`, color:'text-emerald-600' },
                  { label:'총 검사 수', val:adminStats.tests?.total?.toLocaleString(), sub:`오늘 ${adminStats.tests?.today}건`, color:'text-orange-600' },
                  { label:'AI 상담', val:adminStats.chats?.total?.toLocaleString(), sub:`오늘 ${adminStats.chats?.today}건`, color:'text-purple-600' },
                ].map(c => (
                  <div key={c.label} className={S.card}>
                    <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                    <div className={`text-2xl font-black ${c.color}`}>{c.val ?? '—'}</div>
                    <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
                  </div>
                ))}
              </div>
              <div className={S.card + ' mb-4'}>
                <h3 className="font-bold text-gray-700 mb-3 text-sm">크레딧 지급</h3>
                <div className="flex flex-wrap gap-2">
                  {[['userId','사용자 ID'],['amount','금액']].map(([key, ph]) => (
                    <input key={key} placeholder={ph} value={creditGrantForm[key]}
                      onChange={e => setCreditGrantForm(f => ({...f, [key]:e.target.value}))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-24 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  ))}
                  <select value={creditGrantForm.type} onChange={e => setCreditGrantForm(f=>({...f, type:e.target.value}))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="gain">지급</option><option value="loss">회수</option>
                  </select>
                  <button onClick={grantCredits} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">실행</button>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'users' && (
            <div>
              <div className="flex gap-2 mb-4">
                <input placeholder="이메일 또는 닉네임 검색" value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadAdminUsers()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={() => loadAdminUsers()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">검색</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">이메일</th>
                    <th className="px-3 py-2 text-left">닉네임</th>
                    <th className="px-3 py-2 text-right">크레딧</th>
                    <th className="px-3 py-2 text-right">검사</th>
                    <th className="px-3 py-2 text-right">결제합계</th>
                    <th className="px-3 py-2 text-left">가입일</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(adminUsers.users || []).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400 text-xs">{u.id}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">{u.nickname || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold text-indigo-600">✦ {u.credits}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{u.test_count}</td>
                        <td className="px-3 py-2 text-right text-emerald-600">₩{(u.total_paid||0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{u.created_at?.slice(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adminUsers.pagination && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>총 {adminUsers.pagination.total}명</span>
                  <div className="flex gap-1">
                    {adminUsers.pagination.page > 1 && <button onClick={() => loadAdminUsers(adminUsers.pagination.page-1)} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">이전</button>}
                    <span className="px-3 py-1">{adminUsers.pagination.page}/{adminUsers.pagination.pages}</span>
                    {adminUsers.pagination.page < adminUsers.pagination.pages && <button onClick={() => loadAdminUsers(adminUsers.pagination.page+1)} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">다음</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'payments' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">이메일</th>
                    <th className="px-3 py-2 text-right">금액</th>
                    <th className="px-3 py-2 text-right">크레딧</th>
                    <th className="px-3 py-2 text-center">상태</th>
                    <th className="px-3 py-2 text-left">날짜</th>
                    <th className="px-3 py-2 text-center">작업</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(adminPayments.payments || []).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400 text-xs">{p.id}</td>
                        <td className="px-3 py-2 text-xs">{p.email}</td>
                        <td className="px-3 py-2 text-right font-semibold">₩{(p.amount||0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-indigo-600">✦ {p.credits}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status==='completed'?'bg-emerald-100 text-emerald-700':p.status==='refunded'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>
                            {p.status==='completed'?'완료':p.status==='refunded'?'환불':p.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400">{p.created_at?.slice(0,10)}</td>
                        <td className="px-3 py-2 text-center">
                          {p.status === 'completed' && (
                            <button onClick={() => processRefund(p.id)}
                              className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                              환불
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adminPayments.pagination && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>총 {adminPayments.pagination.total}건</span>
                  <div className="flex gap-1">
                    {adminPayments.pagination.page > 1 && <button onClick={() => loadAdminPayments(adminPayments.pagination.page-1)} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">이전</button>}
                    <span className="px-3 py-1">{adminPayments.pagination.page}/{adminPayments.pagination.pages}</span>
                    {adminPayments.pagination.page < adminPayments.pagination.pages && <button onClick={() => loadAdminPayments(adminPayments.pagination.page+1)} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">다음</button>}
                  </div>
                </div>
              )}
              <div className="mt-4 text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                ⚠️ 환불 버튼은 DB 크레딧만 회수합니다. PG(토스페이먼츠) 실제 취소는 토스 파트너센터에서 별도 처리하세요.
              </div>
            </div>
          )}

          {adminTab === 'tests' && (
            <div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-3 py-2 text-left">검사 유형</th>
                  <th className="px-3 py-2 text-left">언어</th>
                  <th className="px-3 py-2 text-right">건수</th>
                  <th className="px-3 py-2 text-right">크레딧 소비</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {adminTestStats.map(t => (
                    <tr key={t.test_type+t.lang} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{t.test_type}</td>
                      <td className="px-3 py-2 text-gray-400">{t.lang}</td>
                      <td className="px-3 py-2 text-right font-semibold text-indigo-600">{t.cnt?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">✦ {(t.credits||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    );
  }
}

function SessionList({ sessions, onView }) {
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  
  // 1초마다 시간 업데이트 (카운트다운)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (sessions.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-5xl mb-3">📋</div>
      <p>제출된 검사가 없습니다</p>
    </div>
  );
  
  // 만료 시간 계산 함수
  const getTimeRemaining = (createdAt) => {
    const now = currentTime;
    const createdTime = new Date(createdAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const elapsed = now - createdTime;
    const remaining = TWENTY_FOUR_HOURS - elapsed;
    
    if (remaining <= 0) {
      return { expired: true, text: "만료됨", color: "text-red-600" };
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    let color = "text-green-600";
    if (hours < 3) color = "text-red-600";
    else if (hours < 6) color = "text-orange-600";
    
    return {
      expired: false,
      text: `${hours}시간 ${minutes}분 ${seconds}초`,
      color: color,
      hours: hours
    };
  };
  
  // JSON 다운로드 함수
  const downloadJson = (sessionId, e) => {
    e.stopPropagation();
    const r = localStorage.getItem("session_" + sessionId);
    if (!r) {
      alert('❌ 검사 결과를 찾을 수 없습니다.');
      return;
    }
    
    const sessionData = JSON.parse(r);
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `검사결과_${sessionData.testType}_${sessionId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 검사 결과가 JSON 파일로 다운로드되었습니다!');
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-semibold">⚠️ 검사 결과는 24시간 후 자동 삭제됩니다</p>
        <p className="text-xs text-yellow-700 mt-1">중요한 결과는 <strong>💾 JSON 저장</strong> 버튼으로 로컬에 저장해주세요!</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {["#", "검사 유형", "전화번호", "제출 시간", "⏱️ 남은 시간", "액션"].map(h => <th key={h} className="border p-2 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const timeInfo = getTimeRemaining(s.createdAt);
              return (
                <tr key={s.sessionId} className={`hover:bg-gray-50 ${timeInfo.expired ? 'opacity-50 bg-red-50' : ''}`}>
                  <td className="border p-2 text-center text-gray-400">{i + 1}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      s.testType === "SCT" ? "bg-blue-100 text-blue-800" : 
                      s.testType === "DSI" ? "bg-green-100 text-green-800" : 
                      s.testType === "PHQ9" ? "bg-yellow-100 text-yellow-800" : 
                      s.testType === "GAD7" ? "bg-orange-100 text-orange-800" : 
                      s.testType === "DASS21" ? "bg-pink-100 text-pink-800" : 
                      s.testType === "BIG5" ? "bg-purple-100 text-purple-800" : 
                      s.testType === "BURNOUT" ? "bg-red-100 text-red-800" : 
                      s.testType === "LOST" ? "bg-teal-100 text-teal-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {s.testType === "SCT" ? "📝 문장완성" : 
                       s.testType === "DSI" ? "🔍 자아분화" : 
                       s.testType === "PHQ9" ? "😔 PHQ-9" : 
                       s.testType === "GAD7" ? "😰 GAD-7" : 
                       s.testType === "DASS21" ? "📊 DASS-21" : 
                       s.testType === "BIG5" ? "🌟 Big5" : 
                       s.testType === "BURNOUT" ? "🔥 번아웃" : 
                       s.testType === "LOST" ? "🧭 LOST" :
                       s.testType}
                    </span>
                  </td>
                  <td className="border p-2">{s.userPhone}</td>
                  <td className="border p-2 text-xs text-gray-600">{new Date(s.createdAt).toLocaleString("ko-KR")}</td>
                  <td className="border p-2">
                    <span className={`font-bold text-xs ${timeInfo.color}`}>
                      {timeInfo.expired ? '🔴 만료됨' : `⏱️ ${timeInfo.text}`}
                    </span>
                    {!timeInfo.expired && timeInfo.hours < 6 && (
                      <div className="text-xs text-red-600 mt-1 font-semibold">
                        ⚠️ 곧 삭제됩니다!
                      </div>
                    )}
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-col gap-1">
                      {!timeInfo.expired ? (
                        <>
                          <button 
                            onClick={() => onView(s.sessionId)} 
                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 w-full"
                          >
                            📊 결과 보기
                          </button>
                          <button 
                            onClick={(e) => downloadJson(s.sessionId, e)} 
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-green-700 w-full"
                            title="로컬에 JSON 파일로 저장"
                          >
                            💾 저장
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-red-600 font-semibold px-2 py-1">삭제됨</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

}


// ── 마스터 전용 에러 뷰어 래퍼 (모든 뷰 위에 z-index:9999 overlay) ──
function AppWithDebug() {
  return (
    <>
      <PsychologicalTestSystem />
      <MasterDebugOverlay />
    </>
  );
}

// PsychologicalTestSystem 외부에서 isMaster 여부를 판단해 오버레이 표시
function MasterDebugOverlay() {
  const [open, setOpen] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [serverLogs, setServerLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('local');

  // access_token이 있고 마스터 이메일인지 확인
  const tok = localStorage.getItem('access_token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('current_user') || 'null'); } catch { return null; } })();
  const MASTER_EMAILS = ['limyj007@gmail.com'];
  const isMasterUser = !!(user?.email && MASTER_EMAILS.includes(user.email.toLowerCase()));
  if (!isMasterUser) return null;

  const loadLocal = () => setLogs([...(window.__ERR_LOG || [])]);
  const loadServer = async () => {
    setLoading(true);
    try {
      const freshTok = localStorage.getItem('access_token'); // 호출 시점 토큰 재조회 (stale 방지)
      const r = await fetch('/api/debug/client-errors', { headers: { 'Authorization': `Bearer ${freshTok}` } });
      const d = await r.json();
      setServerLogs(d.errors || []);
    } catch { setServerLogs([]); }
    finally { setLoading(false); }
  };
  const onOpen = () => { loadLocal(); setOpen(true); };

  const errCount = (window.__ERR_LOG || []).length;
  if (!open) return (
    <button onClick={onOpen} title="Error Log" style={{
      position:'fixed', bottom:80, right:16, zIndex:9999,
      width:42, height:42, borderRadius:'50%', border:'none',
      background: errCount > 0 ? '#DC2626' : '#6B7280',
      color:'white', fontSize:20, cursor:'pointer',
      boxShadow:'0 2px 10px rgba(0,0,0,0.4)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>🐛</button>
  );

  const display = activeTab === 'local' ? logs : serverLogs;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div style={{ width:'100%', maxWidth:520, maxHeight:'85vh', background:'#1E1E1E', borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', color:'white', fontFamily:'monospace' }}>
        <div style={{ padding:'12px 16px', background:'#2D2D2D', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #444' }}>
          <span style={{ fontSize:14, fontWeight:700 }}>🐛 Error Log <span style={{ fontSize:11, color:'#888' }}>master only</span></span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => { loadLocal(); if (activeTab==='server') loadServer(); }} style={{ background:'#3D3D3D', border:'none', color:'#CCC', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>↺</button>
            <button onClick={() => { window.__ERR_LOG = []; setLogs([]); }} style={{ background:'#3D3D3D', border:'none', color:'#F87171', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>지우기</button>
            <button onClick={() => setOpen(false)} style={{ background:'#3D3D3D', border:'none', color:'#CCC', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>✕</button>
          </div>
        </div>
        <div style={{ display:'flex', background:'#2D2D2D', borderBottom:'1px solid #444' }}>
          {[['local','로컬 (메모리)'],['server','서버 KV']].map(([k,l]) => (
            <button key={k} onClick={() => { setActiveTab(k); if (k==='server' && !serverLogs.length) loadServer(); }}
              style={{ flex:1, padding:'8px', border:'none', background: activeTab===k ? '#1E1E1E' : 'transparent', color: activeTab===k ? '#60A5FA' : '#888', fontSize:12, cursor:'pointer', borderBottom: activeTab===k ? '2px solid #60A5FA' : '2px solid transparent' }}>
              {l} ({k==='local' ? logs.length : serverLogs.length})
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:8 }}>
          {loading && <div style={{ textAlign:'center', color:'#888', padding:20, fontSize:12 }}>로딩 중...</div>}
          {!loading && display.length === 0 && <div style={{ textAlign:'center', color:'#4ADE80', padding:20, fontSize:12 }}>✓ 에러 없음</div>}
          {display.map((e, i) => (
            <div key={i} style={{ background:'#2D2D2D', borderRadius:8, padding:'8px 10px', marginBottom:6, borderLeft:`3px solid ${(e.type||'')===('error')?'#F87171':'#FB923C'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:10, color:(e.type||'')==='error'?'#F87171':'#FB923C', fontWeight:700 }}>{(e.type||'').toUpperCase()}</span>
                <span style={{ fontSize:10, color:'#666' }}>{(e.t||e.time||'').slice(11,19)}</span>
              </div>
              <div style={{ fontSize:12, color:'#E5E7EB', wordBreak:'break-all', marginBottom:2 }}>{e.msg||e.message}</div>
              {(e.src||e.source) && <div style={{ fontSize:10, color:'#666' }}>{e.src||e.source}{e.line?`:${e.line}`:''}</div>}
              {e.stack && <details><summary style={{ fontSize:10, color:'#888', cursor:'pointer' }}>스택 ▸</summary><pre style={{ fontSize:10, color:'#9CA3AF', whiteSpace:'pre-wrap', margin:'4px 0 0', maxHeight:100, overflow:'auto' }}>{e.stack}</pre></details>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWithDebug />);

