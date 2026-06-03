const { useState, useEffect, useRef, useCallback } = React;
const tokenStore = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setTokens: (a, r) => {
    localStorage.setItem("access_token", a);
    if (r) localStorage.setItem("refresh_token", r);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_user");
  },
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("current_user") || "null");
    } catch {
      return null;
    }
  },
  setUser: (u) => localStorage.setItem("current_user", JSON.stringify(u))
};
const FREE_TESTS = ["PHQ9", "GAD7"];
const AI_LIMIT_FREE = 5;
const AI_LIMIT_KEY = "ai_chat_used_v2";
const AI_GUEST_TOTAL = 3;
const AI_GUEST_KEY = "maumful_guest_ai_total";
const AI_DISCLAIMER = "\u26A0\uFE0F \uC774 \uBD84\uC11D\uC740 AI\uAC00 \uC0DD\uC131\uD55C \uCC38\uACE0 \uC815\uBCF4\uC785\uB2C8\uB2E4. \uC758\uD559\uC801 \uC9C4\uB2E8\uC774\uB098 \uCE58\uB8CC\uB97C \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2EC\uB9AC\uC801 \uC5B4\uB824\uC6C0\uC774 \uC9C0\uC18D\uB41C\uB2E4\uBA74 \uBC18\uB4DC\uC2DC \uC804\uBB38\uAC00\uC640 \uC0C1\uB2F4\uD558\uC138\uC694.";
const api = {
  // 인증 헤더 반환
  _authHeader() {
    const t = tokenStore.getAccess();
    return t ? { "Authorization": "Bearer " + t } : {};
  },
  // 공통 fetch — 401 시 refresh 자동 시도
  async _fetch(url, opts = {}, retry = true) {
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...this._authHeader(), ...opts.headers || {} }
    });
    if (res.status === 401 && retry) {
      const ok = await this.refreshToken();
      if (ok) return this._fetch(url, opts, false);
    }
    return res;
  },
  // 토큰 갱신
  async refreshToken() {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return false;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ refreshToken: refresh })
      });
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const { data } = await res.json();
      tokenStore.setTokens(data.accessToken, null);
      return true;
    } catch {
      tokenStore.clear();
      return false;
    }
  },
  // ── 인증 ──────────────────────────────────────────────────
  async register(email, password, nickname, partnerCode, marketingAgreed = false, locale = "ko", gender = null, age_range = null, phone = null) {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ email, password, nickname, locale, partnerCode: partnerCode || void 0, marketingAgreed, gender: gender || void 0, age_range: age_range || void 0, phone: phone || void 0 })
    });
    return r.json();
  },
  async login(email, password) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },
  async loginGoogle(idToken) {
    const r = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ idToken })
    });
    return r.json();
  },
  async loginKakao(accessToken) {
    const r = await fetch("/api/auth/kakao", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ accessToken })
    });
    return r.json();
  },
  async logout() {
    await this._fetch("/api/auth/logout", { method: "POST" });
    tokenStore.clear();
  },
  async forgotPassword(email) {
    const r = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ email })
    });
    return r.json();
  },
  // ── 사용자 ────────────────────────────────────────────────
  async getMe() {
    const r = await this._fetch("/api/user/me");
    return r.json();
  },
  async getCredits() {
    const r = await this._fetch("/api/user/credits");
    return r.json();
  },
  async updateMe(data) {
    const r = await this._fetch("/api/user/me", { method: "PATCH", body: JSON.stringify(data) });
    return r.json();
  },
  async deleteMe() {
    const r = await this._fetch("/api/user/me", { method: "DELETE" });
    return r.json();
  },
  // ── 검사 ──────────────────────────────────────────────────
  async startTest(testType, lang = "ko") {
    const r = await this._fetch("/api/test/start", { method: "POST", body: JSON.stringify({ testType, lang }) });
    return r.json();
  },
  async getTestHistory() {
    const r = await this._fetch("/api/test/history");
    return r.json();
  },
  async saveTestScore(testType, score, level = "") {
    const r = await this._fetch("/api/test/save-score", {
      method: "POST",
      body: JSON.stringify({ test_type: testType, score, level })
    });
    return r.json();
  },
  // ── 지역 설정 ─────────────────────────────────────────────
  async getRegionConfig() {
    const r = await fetch("/api/config/region");
    return r.json();
  },
  // ── 크레딧 충전 ───────────────────────────────────────────
  async prepareCharge(packageKey, pg) {
    const r = await this._fetch("/api/credits/prepare-charge", { method: "POST", body: JSON.stringify({ packageKey, pg }) });
    return r.json();
  },
  async tossCheckout(packageKey) {
    const r = await this._fetch("/api/payment/toss/checkout", { method: "POST", body: JSON.stringify({ packageKey }) });
    return r.json();
  }
};
const storage = {
  get: (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};
const PROTECTED_VIEWS = /* @__PURE__ */ new Set([
  "phq9Test",
  "phq9Result",
  "gad7Test",
  "gad7Result",
  "dass21Test",
  "dass21Result",
  "big5Test",
  "big5Result",
  "burnoutTest",
  "burnoutResult",
  "lostTest",
  "lostResult",
  "sctTest",
  "sctResult",
  "dsiTest",
  "dsiResult",
  "riasecTest",
  "riasecResult",
  "valuesTest",
  "valuesResult"
]);
function WatermarkOverlay({ email }) {
  const label = (email || "\uB9C8\uC74C\uD480") + "  \xB7  maumful.com  \xB7  \uBB34\uB2E8\uBC30\uD3EC\uAE08\uC9C0";
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 8900,
    pointerEvents: "none",
    userSelect: "none",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: "100%",
      height: "100%",
      xmlns: "http://www.w3.org/2000/svg",
      style: { position: "absolute", inset: 0 }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement(
      "pattern",
      {
        id: "wm",
        x: "0",
        y: "0",
        width: "320",
        height: "130",
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(-28)"
      },
      /* @__PURE__ */ React.createElement(
        "text",
        {
          x: "10",
          y: "55",
          fill: "rgba(0,0,0,0.048)",
          fontSize: "12",
          fontFamily: "Arial,Helvetica,sans-serif",
          fontWeight: "700",
          letterSpacing: "0.5"
        },
        label
      ),
      /* @__PURE__ */ React.createElement(
        "text",
        {
          x: "10",
          y: "100",
          fill: "rgba(0,0,0,0.025)",
          fontSize: "10",
          fontFamily: "Arial,Helvetica,sans-serif"
        },
        "\xA9 \uB9C8\uC74C\uD480 \uCF58\uD150\uCE20 \uBB34\uB2E8\uBCF5\uC81C \uAE08\uC9C0"
      )
    )),
    /* @__PURE__ */ React.createElement("rect", { width: "100%", height: "100%", fill: "url(#wm)" })
  ));
}
function GoogleSignInBtn({ onLogin, btnText = "signin_with" }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    var _a, _b;
    if (!((_b = (_a = window.google) == null ? void 0 : _a.accounts) == null ? void 0 : _b.id) || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: (response) => onLogin(response.credential)
    });
    window.google.accounts.id.renderButton(ref.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: btnText,
      shape: "rectangular",
      width: ref.current.offsetWidth || 340
    });
  }, []);
  return /* @__PURE__ */ React.createElement("div", { ref, className: "w-full", style: { minHeight: 44 } });
}
function KakaoLoginBtn({ onLogin }) {
  const handleClick = async () => {
    if (!window.KAKAO_APP_KEY) return;
    try {
      const { url } = await fetch("/api/auth/kakao/url").then((r) => r.json());
      if (!url) return;
      const popup = window.open(url, "kakao_login", "width=500,height=640,top=100,left=200");
      const handler = (e) => {
        var _a, _b;
        if (e.origin !== window.location.origin) return;
        if (((_a = e.data) == null ? void 0 : _a.type) === "kakao_login") {
          window.removeEventListener("message", handler);
          onLogin(e.data);
        } else if (((_b = e.data) == null ? void 0 : _b.type) === "kakao_error") {
          window.removeEventListener("message", handler);
          console.error("\uCE74\uCE74\uC624 \uB85C\uADF8\uC778 \uC624\uB958:", e.data.error);
        }
      };
      window.addEventListener("message", handler);
      const timer = setInterval(() => {
        if (popup == null ? void 0 : popup.closed) {
          clearInterval(timer);
          window.removeEventListener("message", handler);
        }
      }, 500);
    } catch {
    }
  };
  if (!window.KAKAO_APP_KEY) return null;
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClick,
      style: {
        background: "#FEE500",
        border: "none",
        borderRadius: 8,
        width: "100%",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: 14,
        color: "#3C1E1E"
      }
    },
    /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "#3C1E1E" }, /* @__PURE__ */ React.createElement("path", { d: "M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.67 5.02 4.2 6.43L6.2 20.5l4.03-2.66c.57.08 1.17.12 1.77.12 4.97 0 9-3.36 9-7.5S16.97 3 12 3z" })),
    "\uCE74\uCE74\uC624\uB85C \uACC4\uC18D\uD558\uAE30"
  );
}
function NaverLoginBtn({ onLogin }) {
  const handleClick = async () => {
    if (!window.NAVER_CLIENT_ID) return;
    try {
      const { url } = await fetch("/api/auth/naver/url").then((r) => r.json());
      if (!url) return;
      const popup = window.open(url, "naver_login", "width=500,height=640,top=100,left=200");
      const handler = (e) => {
        var _a, _b;
        if (e.origin !== window.location.origin) return;
        if (((_a = e.data) == null ? void 0 : _a.type) === "naver_login") {
          window.removeEventListener("message", handler);
          onLogin(e.data);
        } else if (((_b = e.data) == null ? void 0 : _b.type) === "naver_error") {
          window.removeEventListener("message", handler);
          console.error("\uB124\uC774\uBC84 \uB85C\uADF8\uC778 \uC624\uB958:", e.data.error);
        }
      };
      window.addEventListener("message", handler);
      const timer = setInterval(() => {
        if (popup == null ? void 0 : popup.closed) {
          clearInterval(timer);
          window.removeEventListener("message", handler);
        }
      }, 500);
    } catch {
    }
  };
  if (!window.NAVER_CLIENT_ID) return null;
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClick,
      style: {
        background: "#03C75A",
        border: "none",
        borderRadius: 8,
        width: "100%",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: 14,
        color: "#fff",
        fontFamily: "'Noto Sans KR',sans-serif"
      }
    },
    /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "white" }, /* @__PURE__ */ React.createElement("path", { d: "M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" })),
    "\uB124\uC774\uBC84\uB85C \uACC4\uC18D\uD558\uAE30"
  );
}
function PsychologicalTestSystem() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [regionConfig, setRegionConfig] = useState(null);
  const [view, setView] = useState("landing");
  const [initializing, setInitializing] = useState(true);
  const [returnToCouple, setReturnToCouple] = useState(() => !!sessionStorage.getItem("return_to_couple"));
  const [partnerMode, setPartnerMode] = useState(null);
  const [credits, setCredits] = useState(0);
  const [creditTxns, setCreditTxns] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showChargeView, setShowChargeView] = useState(false);
  const [pendingTestAfterCharge, setPendingTestAfterCharge] = useState(null);
  const [loginMsg, setLoginMsg] = useState({ type: "", text: "" });
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });
  const [saveStatus, setSaveStatus] = useState("");
  const [sessionId, setSessionId] = useState(() => genId("session"));
  const [pendingTests, setPendingTests] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [multiSessionIds, setMultiSessionIds] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [srciResponses, setSrciResponses] = useState({});
  const [sctSummaries, setSctSummaries] = useState({});
  const [loadingSummary, setLoadingSummary] = useState({});
  const [sdriResponses, setSdriResponses] = useState({});
  const [dsiRec, setDsiRec] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [phq9Responses, setPhq9Responses] = useState({});
  const [gad7Responses, setGad7Responses] = useState({});
  const [riasecResponses, setRiasecResponses] = useState({});
  const [valuesResponses, setValuesResponses] = useState({});
  const [dass21Responses, setDass21Responses] = useState({});
  const [big5Responses, setBig5Responses] = useState({});
  const [burnoutResponses, setBurnoutResponses] = useState({});
  const [lostResponses, setLostResponses] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiError, setAiError] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatError, setChatError] = useState("");
  const [apiSettings, setApiSettings] = useState([]);
  const [apiSettingForm, setApiSettingForm] = useState({ key_name: "ANTHROPIC_API_KEY", key_value: "", description: "Claude AI \uC2EC\uB9AC\uBD84\uC11D\uC6A9 API \uD0A4" });
  const [apiSettingMsg, setApiSettingMsg] = useState({ type: "", text: "" });
  const [apiSettingLoading, setApiSettingLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [signupForm, setSignupForm] = useState({ email: "", password: "", pwConfirm: "", nickname: "", gender: "", age_range: "", phone: "" });
  const [signupConsents, setSignupConsents] = useState({ terms: false, privacy: false, sensitive: false, overseas: false, age: false, marketing: false });
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");
  const [aiChatUsed, setAiChatUsed] = useState(() => {
    try {
      return parseInt(localStorage.getItem(AI_LIMIT_KEY) || "0", 10);
    } catch {
      return 0;
    }
  });
  const [guestAiTotal, setGuestAiTotal] = useState(() => {
    try {
      return parseInt(localStorage.getItem(AI_GUEST_KEY) || "0", 10);
    } catch {
      return 0;
    }
  });
  const [showAiLimitModal, setShowAiLimitModal] = useState(false);
  const [counselingMode, setCounselingMode] = useState(() => {
    try {
      return localStorage.getItem("counseling_mode") || "psychological";
    } catch {
      return "psychological";
    }
  });
  function updateCounselingMode(mode) {
    setCounselingMode(mode);
    try {
      localStorage.setItem("counseling_mode", mode);
    } catch {
    }
  }
  const [langOverride, setLangOverride] = useState(() => {
    try {
      return localStorage.getItem("maumful_lang") || "";
    } catch {
      return "";
    }
  });
  function updateLang(l) {
    setLangOverride(l);
    try {
      localStorage.setItem("maumful_lang", l);
    } catch {
    }
  }
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    var _a2;
    const EU_COUNTRIES = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
    const accepted = localStorage.getItem("cookie_consent");
    if (accepted) return false;
    const lang2 = (_a2 = navigator.language) == null ? void 0 : _a2.slice(0, 2);
    const euLangs = ["de", "fr", "it", "es", "pl", "nl", "pt", "sv", "fi", "da", "cs", "ro", "hu", "sk", "bg", "hr", "et", "lv", "lt", "sl", "mt"];
    return euLangs.includes(lang2);
  });
  const [testHistory, setTestHistory] = useState([]);
  const [moodTrend, setMoodTrend] = useState([]);
  const [dailyCtxCard, setDailyCtxCard] = useState(null);
  const [myPageTab, setMyPageTab] = useState("credits");
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [changePwMsg, setChangePwMsg] = useState({ type: "", text: "" });
  const [pushStatus, setPushStatus] = useState("unknown");
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [creditSubTab, setCreditSubTab] = useState("usage");
  const [selectedTests, setSelectedTests] = useState(["PHQ9"]);
  const [referralData, setReferralData] = useState(null);
  const [referralList, setReferralList] = useState([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMsg, setReferralMsg] = useState({ type: "", text: "" });
  const [referralInput, setReferralInput] = useState("");
  const [adminStats, setAdminStats] = useState(null);
  const [adminDaily, setAdminDaily] = useState(null);
  const [adminTestStats, setAdminTestStats] = useState([]);
  const [adminUsers, setAdminUsers] = useState({ users: [], pagination: {} });
  const [adminPayments, setAdminPayments] = useState({ payments: [], pagination: {} });
  const [adminTab, setAdminTab] = useState("overview");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSecretInput, setAdminSecretInput] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: "", text: "" });
  const [creditGrantForm, setCreditGrantForm] = useState({ userId: "", amount: "", type: "gain", reason: "admin_grant" });
  const [userInfo, setUserInfo] = useState({ phone: "", password: "" });
  const [linkInput, setLinkInput] = useState("");
  const [counselorForm, setCounselorForm] = useState({ name: "", phone: "", password: "", certification: "", education: "", experience: "" });
  const [biblicalRefs, setBiblicalRefs] = useState([]);
  const [biblicalForm, setBiblicalForm] = useState({ id: null, title: "", category: "general", content: "", sort_order: 0 });
  const [showBiblicalForm, setShowBiblicalForm] = useState(false);
  const [biblicalMsg, setBiblicalMsg] = useState({ type: "", text: "" });
  const [biblicalLoading, setBiblicalLoading] = useState(false);
  const [subscription, setSubscriptionState] = useState(null);
  const [isMaster, setIsMaster] = useState(false);
  const [masterInfo, setMasterInfo] = useState(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [orgAdminInfo, setOrgAdminInfo] = useState(null);
  const setActiveLinkId = (...args) => {
  };
  const setSubscription = setSubscriptionState;
  const lang = langOverride || (regionConfig == null ? void 0 : regionConfig.lang) || "ko";
  const t = (ko, en) => lang === "en" ? en : ko;
  function getToken() {
    try {
      const token = localStorage.getItem("psy_token");
      return token || "";
    } catch (e) {
      console.error("[getToken] localStorage \uC811\uADFC \uC2E4\uD328:", e);
      return "";
    }
  }
  function saveToken(tok) {
    try {
      if (!tok) {
        console.warn("[saveToken] \uBE48 \uD1A0\uD070 \uC800\uC7A5 \uC2DC\uB3C4 \uBB34\uC2DC");
        return false;
      }
      localStorage.setItem("psy_token", tok);
      console.log("[saveToken] \uD1A0\uD070 \uC800\uC7A5 \uC131\uACF5, \uAE38\uC774:", tok.length);
      return true;
    } catch (e) {
      console.error("[saveToken] localStorage \uC800\uC7A5 \uC2E4\uD328:", e);
      return false;
    }
  }
  async function restoreLoginState() {
    storage.remove("current_login");
    return false;
  }
  function saveLoginState(loginData) {
    const token = getToken();
    storage.set("current_login", JSON.stringify({ ...loginData, _token: token }));
  }
  function clearLoginState() {
    storage.remove("current_login");
  }
  async function loadMasterData() {
    const token = getToken();
    if (!token) {
      console.warn("[loadMasterData] \uD1A0\uD070 \uC5C6\uC74C, \uB85C\uB4DC \uC2A4\uD0B5");
      return;
    }
    console.log("[loadMasterData] \uB370\uC774\uD130 \uB85C\uB4DC \uC2DC\uC791");
    try {
      await loadOrganizations();
      await loadMasterSessions();
      await loadNotifications("all");
      await loadNotices("all");
      const [pendingResult, approvedResult] = await Promise.all([
        api.getPendingCounselors(),
        api.getApprovedCounselors()
      ]);
      if (pendingResult && pendingResult.success) setPendingCounselors(pendingResult.data || []);
      if (approvedResult && approvedResult.success) setApprovedCounselors(approvedResult.data || []);
      console.log("[loadMasterData] \uB370\uC774\uD130 \uB85C\uB4DC \uC644\uB8CC");
    } catch (error) {
      console.error("[loadMasterData] \uC624\uB958:", error);
    }
  }
  function loadAllSubmitted() {
    const r = storage.get("submitted_list");
    const list = r ? JSON.parse(r.value) : [];
    setSubmitted(list);
  }
  async function loadApiSettings() {
    try {
      const res = await authFetch("/api/admin/api-settings");
      const data = await res.json();
      if (data.success) setApiSettings(data.data || []);
    } catch (e) {
    }
  }
  async function loadOrgCounselors(orgId) {
    try {
      const response = await authFetch(`/api/organizations/${orgId}/counselors`);
      const data = await response.json();
      if (data.success) setOrgCounselors(data.data || []);
      else setOrgCounselors([]);
    } catch (error) {
    }
  }
  function checkAndCleanExpiredSessions() {
    const listRaw = storage.get("submitted_list");
    if (!listRaw) return;
    const list = JSON.parse(listRaw.value);
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
    const validSessions = [];
    let deletedCount = 0;
    list.forEach((session) => {
      const createdTime = new Date(session.createdAt).getTime();
      const age = now - createdTime;
      if (age >= SEVEN_DAYS) {
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
    const kws = counselingKw.filter((k) => edu.toLowerCase().includes(k));
    return { ok: kws.length > 0, kws };
  }
  const getBurnoutDomains = () => [
    { id: "EE", name: "\uC815\uC11C\uC801 \uC18C\uC9C4", nameEn: "Emotional Exhaustion", icon: "\u{1F630}", color: "#f97316", max: 72, questions: burnoutQ.filter((q) => q.domain === "EE") },
    { id: "DP", name: "\uBE44\uC778\uACA9\uD654", nameEn: "Depersonalization", icon: "\u{1F636}", color: "#ef4444", max: 48, questions: burnoutQ.filter((q) => q.domain === "DP") },
    { id: "PA", name: "\uC131\uCDE8\uAC10 \uC800\uD558", nameEn: "Reduced Accomplishment", icon: "\u{1F4C9}", color: "#c084fc", max: 60, questions: burnoutQ.filter((q) => q.domain === "PA") },
    { id: "WO", name: "\uC5C5\uBB34 \uACFC\uBD80\uD558", nameEn: "Work Overload", icon: "\u26A1", color: "#f59e0b", max: 60, questions: burnoutQ.filter((q) => q.domain === "WO") },
    { id: "PC", name: "\uC2E0\uCCB4\xB7\uC778\uC9C0", nameEn: "Physical & Cognitive", icon: "\u{1F915}", color: "#4ade80", max: 60, questions: burnoutQ.filter((q) => q.domain === "PC") }
  ];
  const phq9Q = [
    { num: 1, content: t("\uAE30\uBD84\uC774 \uAC00\uB77C\uC549\uAC70\uB098, \uC6B0\uC6B8\uD558\uAC70\uB098, \uD76C\uB9DD\uC774 \uC5C6\uB2E4\uACE0 \uB290\uAF08\uB2E4", "Feeling down, depressed, or hopeless") },
    { num: 2, content: t("\uD3C9\uC18C \uD558\uB358 \uC77C\uC5D0 \uB300\uD55C \uD765\uBBF8\uAC00 \uC5C6\uC5B4\uC9C0\uAC70\uB098 \uC990\uAC70\uC6C0\uC744 \uB290\uB07C\uC9C0 \uBABB\uD588\uB2E4", "Little interest or pleasure in doing things") },
    { num: 3, content: t("\uC7A0\uB4E4\uAE30\uAC00 \uC5B4\uB835\uAC70\uB098 \uC790\uC8FC \uAE7C\uB2E4 / \uD639\uC740 \uB108\uBB34 \uB9CE\uC774 \uC7A4\uB2E4", "Trouble falling or staying asleep, or sleeping too much") },
    { num: 4, content: t("\uD53C\uACE4\uD558\uB2E4\uACE0 \uB290\uB07C\uAC70\uB098 \uAE30\uB825\uC774 \uAC70\uC758 \uC5C6\uC5C8\uB2E4", "Feeling tired or having little energy") },
    { num: 5, content: t("\uC2DD\uC695\uC774 \uC904\uC5C8\uB2E4 / \uD639\uC740 \uD3C9\uC18C\uBCF4\uB2E4 \uB9CE\uC774 \uBA39\uC5C8\uB2E4", "Poor appetite or overeating") },
    { num: 6, content: t("\uB0B4 \uC790\uC2E0\uC774 \uC2E4\uD328\uC790\uB77C\uACE0 \uB290\uAF08\uB2E4 / \uD639\uC740 \uC790\uC2E0\uACFC \uAC00\uC871\uC744 \uC2E4\uB9DD\uC2DC\uCF30\uB2E4\uACE0 \uB290\uAF08\uB2E4", "Feeling bad about yourself \u2014 or that you are a failure or have let yourself or your family down") },
    { num: 7, content: t("\uC2E0\uBB38\uC744 \uC77D\uAC70\uB098 TV\uB97C \uBCF4\uB294 \uAC83\uACFC \uAC19\uC740 \uC77C\uC5D0 \uC9D1\uC911\uD558\uAE30\uAC00 \uC5B4\uB824\uC6E0\uB2E4", "Trouble concentrating on things, such as reading the newspaper or watching television") },
    { num: 8, content: t("\uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC774 \uC54C\uC544\uCC4C \uC815\uB3C4\uB85C \uD3C9\uC18C\uBCF4\uB2E4 \uB9D0\uACFC \uD589\uB3D9\uC774 \uB290\uB824\uC84C\uB2E4 / \uD639\uC740 \uB108\uBB34 \uC548\uC808\uBD80\uC808 \uBABB\uD574\uC11C \uAC00\uB9CC\uD788 \uC549\uC544 \uC788\uC744 \uC218 \uC5C6\uC5C8\uB2E4", "Moving or speaking so slowly that other people could have noticed \u2014 or being so fidgety that you moved around more than usual") },
    { num: 9, content: t("\uCC28\uB77C\uB9AC \uC8FD\uB294 \uAC83\uC774 \uB0AB\uACA0\uB2E4\uACE0 \uC0DD\uAC01\uD588\uB2E4 / \uD639\uC740 \uC790\uD574\uD560 \uC0DD\uAC01\uC744 \uD588\uB2E4", "Thoughts that you would be better off dead, or of hurting yourself in some way") }
  ];
  const gad7Q = [
    { num: 1, content: t("\uCD08\uC870\uD558\uAC70\uB098 \uBD88\uC548\uD558\uAC70\uB098 \uC870\uB9C8\uC870\uB9C8\uD558\uAC8C \uB290\uB080\uB2E4", "Feeling nervous, anxious, or on edge") },
    { num: 2, content: t("\uAC71\uC815\uD558\uB294 \uAC83\uC744 \uBA48\uCD94\uAC70\uB098 \uC870\uC808\uD560 \uC218\uAC00 \uC5C6\uB2E4", "Not being able to stop or control worrying") },
    { num: 3, content: t("\uC5EC\uB7EC \uAC00\uC9C0 \uAC83\uB4E4\uC5D0 \uB300\uD574 \uAC71\uC815\uC744 \uB108\uBB34 \uB9CE\uC774 \uD55C\uB2E4", "Worrying too much about different things") },
    { num: 4, content: t("\uD3B8\uD558\uAC8C \uC788\uAE30\uAC00 \uC5B4\uB835\uB2E4", "Trouble relaxing") },
    { num: 5, content: t("\uB108\uBB34 \uC548\uC808\uBD80\uC808 \uBABB\uD574\uC11C \uAC00\uB9CC\uD788 \uC788\uAE30 \uD798\uB4E4\uB2E4", "Being so restless that it is hard to sit still") },
    { num: 6, content: t("\uC27D\uAC8C \uC9DC\uC99D\uC774 \uB098\uAC70\uB098 \uC27D\uAC8C \uC131\uC744 \uB0B8\uB2E4", "Becoming easily annoyed or irritable") },
    { num: 7, content: t("\uB9C8\uCE58 \uB054\uCC0D\uD55C \uC77C\uC774 \uC0DD\uAE38 \uAC83\uCC98\uB7FC \uB450\uB835\uAC8C \uB290\uB080\uB2E4", "Feeling afraid, as if something awful might happen") }
  ];
  const dass21Q = [
    { num: 1, content: t("\uB098\uB294 \uC548\uC815\uC744 \uCDE8\uD558\uAE30 \uD798\uB4E4\uC5C8\uB2E4", "I found it hard to wind down"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 2, content: t("\uC785\uC774 \uBC14\uC2F9 \uB9C8\uB974\uB294 \uB290\uB08C\uC774 \uB4E4\uC5C8\uB2E4", "I was aware of dryness of my mouth"), scale: "\uBD88\uC548" },
    { num: 3, content: t("\uC5B4\uB5A4 \uAC83\uC5D0\uB3C4 \uAE0D\uC815\uC801\uC778 \uAC10\uC815\uC744 \uB290\uB084 \uC218\uAC00 \uC5C6\uC5C8\uB2E4", "I couldn't seem to experience any positive feeling at all"), scale: "\uC6B0\uC6B8" },
    { num: 4, content: t("\uD638\uD761 \uACE4\uB780\uC744 \uACBD\uD5D8\uD588\uB2E4 (\uC608: \uACFC\uB3C4\uD558\uAC8C \uBE60\uB978 \uD638\uD761, \uD798\uB4E0 \uC77C\uC744 \uD558\uC9C0 \uC54A\uC558\uB294\uB370\uB3C4 \uC228\uC774 \uCC38)", "I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)"), scale: "\uBD88\uC548" },
    { num: 5, content: t("\uBB34\uC5B8\uAC00\uB97C \uD574\uC57C\uACA0\uB2E4\uB294 \uC758\uC695\uC774 \uB4E4\uC9C0 \uC54A\uC558\uB2E4", "I found it difficult to work up the initiative to do things"), scale: "\uC6B0\uC6B8" },
    { num: 6, content: t("\uC0AC\uC18C\uD55C \uC77C\uC5D0\uB3C4 \uACFC\uBBFC\uBC18\uC751\uC744 \uBCF4\uC774\uB294 \uACBD\uD5A5\uC774 \uC788\uC5C8\uB2E4", "I tended to over-react to situations"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 7, content: t("\uC190\uC774 \uB5A8\uB838\uB2E4 (\uC608: \uAE00\uC744 \uC4F8 \uB54C)", "I experienced trembling (e.g., in the hands)"), scale: "\uBD88\uC548" },
    { num: 8, content: t("\uC2E0\uACBD\uC744 \uB9CE\uC774 \uC4F0\uACE0 \uC788\uB2E4\uB294 \uB290\uB08C\uC774 \uB4E4\uC5C8\uB2E4", "I felt that I was using a lot of nervous energy"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 9, content: t("\uB098\uC05C \uC77C\uC774 \uC77C\uC5B4\uB0A0\uAE4C\uBD10 \uAC71\uC815\uC2A4\uB7EC\uC6E0\uB2E4", "I was worried about situations in which I might panic and make a fool of myself"), scale: "\uBD88\uC548" },
    { num: 10, content: t("\uC0B6\uC5D0 \uB300\uD574 \uC5F4\uC815\uC744 \uB290\uB084 \uC218 \uC5C6\uC5C8\uB2E4", "I felt that I had nothing to look forward to"), scale: "\uC6B0\uC6B8" },
    { num: 11, content: t("\uC27D\uAC8C \uB3D9\uC694\uD558\uAC8C \uB418\uC5C8\uB2E4", "I found myself getting agitated"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 12, content: t("\uAE34\uC7A5\uC744 \uD480\uAE30 \uC5B4\uB824\uC6E0\uB2E4", "I found it difficult to relax"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 13, content: t("\uC6B0\uC6B8\uD558\uACE0 \uC2AC\uD390\uB2E4", "I felt down-hearted and blue"), scale: "\uC6B0\uC6B8" },
    { num: 14, content: t("\uB0B4\uAC00 \uC88B\uC544\uD558\uB294 \uAC83\uC744 \uBC29\uD574\uBC1B\uB294 \uAC83\uC5D0 \uB300\uD574 \uCC38\uC744 \uC218 \uC5C6\uC5C8\uB2E4", "I was intolerant of anything that kept me from getting on with what I was doing"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 15, content: t("\uACF5\uD669\uC0C1\uD0DC\uC5D0 \uBE60\uC9C8 \uAC83\uB9CC \uAC19\uC558\uB2E4", "I felt I was close to panic"), scale: "\uBD88\uC548" },
    { num: 16, content: t("\uC5B4\uB5A4 \uAC83\uC5D0\uB3C4 \uAE30\uB300\uD560 \uAC83\uC774 \uC5C6\uC5C8\uB2E4", "I was unable to become enthusiastic about anything"), scale: "\uC6B0\uC6B8" },
    { num: 17, content: t("\uB098 \uC790\uC2E0\uC774 \uAC00\uCE58\uAC00 \uC5C6\uB294 \uC0AC\uB78C\uC73C\uB85C \uB290\uAEF4\uC84C\uB2E4", "I felt I wasn't worth much as a person"), scale: "\uC6B0\uC6B8" },
    { num: 18, content: t("\uC0AC\uC18C\uD55C \uC77C\uC5D0\uB3C4 \uC27D\uAC8C \uC5B8\uC9E2\uC544\uC84C\uB2E4", "I felt that I was rather touchy"), scale: "\uC2A4\uD2B8\uB808\uC2A4" },
    { num: 19, content: t("\uC2EC\uC7A5\uC774 \uC774\uC720 \uC5C6\uC774 \uB450\uADFC\uAC70\uB838\uB2E4 (\uC608: \uC2EC\uC7A5 \uBC15\uB3D9\uC218\uAC00 \uC99D\uAC00\uD558\uAC70\uB098 \uBE60\uB974\uAC8C \uB6F0\uB294 \uB290\uB08C)", "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)"), scale: "\uBD88\uC548" },
    { num: 20, content: t("\uC774\uC720 \uC5C6\uC774 \uBB34\uC11C\uC6E0\uB2E4", "I felt scared without any good reason"), scale: "\uBD88\uC548" },
    { num: 21, content: t("\uC0B6\uC774 \uBB34\uC758\uBBF8\uD558\uAC8C \uB290\uAEF4\uC84C\uB2E4", "I felt that life was meaningless"), scale: "\uC6B0\uC6B8" }
  ];
  const big5Q = [
    // 외향성 (Extraversion) - 10문항
    { num: 1, content: t("\uB098\uB294 \uD30C\uD2F0\uC758 \uC8FC\uC778\uACF5\uC774\uB2E4", "I am the life of the party"), factor: "\uC678\uD5A5\uC131", rev: false },
    { num: 2, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uACFC \uB300\uD654\uD558\uB294 \uAC83\uC744 \uC88B\uC544\uD558\uC9C0 \uC54A\uB294\uB2E4", "I don't talk a lot"), factor: "\uC678\uD5A5\uC131", rev: true },
    { num: 3, content: t("\uB098\uB294 \uD3B8\uC548\uD558\uAC8C \uC0AC\uB78C\uB4E4\uACFC \uC5B4\uC6B8\uB9B0\uB2E4", "I feel comfortable around people"), factor: "\uC678\uD5A5\uC131", rev: false },
    { num: 4, content: t("\uB098\uB294 \uBC30\uACBD\uC5D0 \uBA38\uBB3C\uB7EC \uC788\uB2E4", "I keep in the background"), factor: "\uC678\uD5A5\uC131", rev: true },
    { num: 5, content: t("\uB098\uB294 \uB300\uD654\uB97C \uC2DC\uC791\uD55C\uB2E4", "I start conversations"), factor: "\uC678\uD5A5\uC131", rev: false },
    { num: 6, content: t("\uB098\uB294 \uB9CE\uC740 \uC0AC\uB78C\uB4E4\uC5D0\uAC8C \uB9D0\uC744 \uAC70\uC758 \uD558\uC9C0 \uC54A\uB294\uB2E4", "I have little to say"), factor: "\uC678\uD5A5\uC131", rev: true },
    { num: 7, content: t("\uB098\uB294 \uB9CE\uC740 \uC0AC\uB78C\uB4E4\uACFC \uB300\uD654\uD558\uB294 \uAC83\uC774 \uC88B\uB2E4", "I talk to a lot of different people at parties"), factor: "\uC678\uD5A5\uC131", rev: false },
    { num: 8, content: t("\uB098\uB294 \uB300\uD654\uB97C \uC2DC\uC791\uD558\uB294 \uAC83\uC744 \uC5B4\uB824\uC6CC\uD55C\uB2E4", "I don't like to draw attention to myself"), factor: "\uC678\uD5A5\uC131", rev: true },
    { num: 9, content: t("\uB098\uB294 \uAD00\uC2EC\uC758 \uC911\uC2EC\uC774 \uB418\uB294 \uAC83\uC744 \uC88B\uC544\uD55C\uB2E4", "I don't mind being the center of attention"), factor: "\uC678\uD5A5\uC131", rev: false },
    { num: 10, content: t("\uB098\uB294 \uB0AF\uC120 \uC0AC\uB78C\uACFC \uB9D0\uD558\uACE0 \uC2F6\uC9C0 \uC54A\uB2E4", "I am quiet around strangers"), factor: "\uC678\uD5A5\uC131", rev: true },
    // 친화성 (Agreeableness) - 10문항
    { num: 11, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC758 \uAC10\uC815\uC5D0 \uAD00\uC2EC\uC774 \uC788\uB2E4", "I am interested in other people's feelings"), factor: "\uCE5C\uD654\uC131", rev: false },
    { num: 12, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC758 \uAC10\uC815\uC5D0 \uAD00\uC2EC\uC774 \uC5C6\uB2E4", "I am not interested in other people's feelings"), factor: "\uCE5C\uD654\uC131", rev: true },
    { num: 13, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC744 \uD3B8\uC548\uD558\uAC8C \uD574\uC900\uB2E4", "I make people feel at ease"), factor: "\uCE5C\uD654\uC131", rev: false },
    { num: 14, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC744 \uBAA8\uC695\uD55C\uB2E4", "I insult people"), factor: "\uCE5C\uD654\uC131", rev: true },
    { num: 15, content: t("\uB098\uB294 \uC0AC\uB78C\uB4E4\uC758 \uB9C8\uC74C\uC744 \uBD80\uB4DC\uB7FD\uAC8C \uD55C\uB2E4", "I have a warm, gentle nature"), factor: "\uCE5C\uD654\uC131", rev: false },
    { num: 16, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC5D0\uAC8C \uBCC4 \uAD00\uC2EC\uC774 \uC5C6\uB2E4", "I am indifferent to other people's concerns"), factor: "\uCE5C\uD654\uC131", rev: true },
    { num: 17, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC5D0\uAC8C \uC2DC\uAC04\uC744 \uB0B4\uC900\uB2E4", "I find time for others"), factor: "\uCE5C\uD654\uC131", rev: false },
    { num: 18, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC758 \uBB38\uC81C\uC5D0 \uC2E0\uACBD \uC4F0\uC9C0 \uC54A\uB294\uB2E4", "I don't care about other people's problems"), factor: "\uCE5C\uD654\uC131", rev: true },
    { num: 19, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC744 \uB290\uB07C\uACE0 \uC774\uD574\uD55C\uB2E4", "I understand others' feelings easily"), factor: "\uCE5C\uD654\uC131", rev: false },
    { num: 20, content: t("\uB098\uB294 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC5D0\uAC8C \uCC28\uAC11\uACE0 \uBB34\uAD00\uC2EC\uD558\uB2E4", "I am cold and indifferent to others"), factor: "\uCE5C\uD654\uC131", rev: true },
    // 성실성 (Conscientiousness) - 10문항
    { num: 21, content: t("\uB098\uB294 \uD56D\uC0C1 \uC900\uBE44\uB418\uC5B4 \uC788\uB2E4", "I am always prepared"), factor: "\uC131\uC2E4\uC131", rev: false },
    { num: 22, content: t("\uB098\uB294 \uB0B4 \uBB3C\uAC74\uC744 \uC5B4\uC9C8\uB7EC \uB193\uB294\uB2E4", "I leave my belongings around"), factor: "\uC131\uC2E4\uC131", rev: true },
    { num: 23, content: t("\uB098\uB294 \uC138\uBD80\uC0AC\uD56D\uC5D0 \uC8FC\uC758\uB97C \uAE30\uC6B8\uC778\uB2E4", "I pay attention to details"), factor: "\uC131\uC2E4\uC131", rev: false },
    { num: 24, content: t("\uB098\uB294 \uC885\uC885 \uBB3C\uAC74\uC744 \uC5B4\uB514\uC5D0 \uB450\uC5C8\uB294\uC9C0 \uC78A\uC5B4\uBC84\uB9B0\uB2E4", "I often forget where I put things"), factor: "\uC131\uC2E4\uC131", rev: true },
    { num: 25, content: t("\uB098\uB294 \uC77C\uC744 \uC81C\uB54C \uB05D\uB0B8\uB2E4", "I get things done right away"), factor: "\uC131\uC2E4\uC131", rev: false },
    { num: 26, content: t("\uB098\uB294 \uC77C\uC744 \uB9DD\uCE58\uACE4 \uD55C\uB2E4", "I often make a mess of things"), factor: "\uC131\uC2E4\uC131", rev: true },
    { num: 27, content: t("\uB098\uB294 \uC77C\uC5D0 \uC9C4\uC9C0\uD558\uAC8C \uC784\uD55C\uB2E4", "I take my work seriously"), factor: "\uC131\uC2E4\uC131", rev: false },
    { num: 28, content: t("\uB098\uB294 \uB0B4 \uC758\uBB34\uB97C \uD68C\uD53C\uD55C\uB2E4", "I shirk my duties"), factor: "\uC131\uC2E4\uC131", rev: true },
    { num: 29, content: t("\uB098\uB294 \uACC4\uD68D\uC744 \uB530\uB978\uB2E4", "I follow a plan"), factor: "\uC131\uC2E4\uC131", rev: false },
    { num: 30, content: t("\uB098\uB294 \uC989\uC2DC \uC77C\uC744 \uC2DC\uC791\uD558\uC9C0 \uC54A\uB294\uB2E4", "I don't start tasks right away"), factor: "\uC131\uC2E4\uC131", rev: true },
    // 신경성 (Neuroticism) - 10문항
    { num: 31, content: t("\uB098\uB294 \uC27D\uAC8C \uC2A4\uD2B8\uB808\uC2A4\uB97C \uBC1B\uB294\uB2E4", "I get stressed out easily"), factor: "\uC2E0\uACBD\uC131", rev: false },
    { num: 32, content: t("\uB098\uB294 \uC27D\uAC8C \uC9C4\uC815\uD55C\uB2E4", "I calm down easily"), factor: "\uC2E0\uACBD\uC131", rev: true },
    { num: 33, content: t("\uB098\uB294 \uBCC0\uD654\uC5D0 \uC27D\uAC8C \uB3D9\uC694\uD55C\uB2E4", "I am easily upset"), factor: "\uC2E0\uACBD\uC131", rev: false },
    { num: 34, content: t("\uB098\uB294 \uAC70\uC758 \uAC71\uC815\uD558\uC9C0 \uC54A\uB294\uB2E4", "I rarely worry about things"), factor: "\uC2E0\uACBD\uC131", rev: true },
    { num: 35, content: t("\uB098\uB294 \uC27D\uAC8C \uC9DC\uC99D\uC774 \uB09C\uB2E4", "I get irritated easily"), factor: "\uC2E0\uACBD\uC131", rev: false },
    { num: 36, content: t("\uB098\uB294 \uB300\uBD80\uBD84\uC758 \uACBD\uC6B0 \uD3B8\uC548\uD558\uB2E4", "I am relaxed most of the time"), factor: "\uC2E0\uACBD\uC131", rev: true },
    { num: 37, content: t("\uB098\uB294 \uAE34\uC7A5\uAC10\uC744 \uC790\uC8FC \uB290\uB080\uB2E4", "I often feel tense"), factor: "\uC2E0\uACBD\uC131", rev: false },
    { num: 38, content: t("\uB098\uB294 \uB450\uB824\uC6C0\uC744 \uAC70\uC758 \uB290\uB07C\uC9C0 \uC54A\uB294\uB2E4", "I rarely feel afraid"), factor: "\uC2E0\uACBD\uC131", rev: true },
    { num: 39, content: t("\uB098\uB294 \uC791\uC740 \uC77C\uC5D0\uB3C4 \uAC71\uC815\uD55C\uB2E4", "I worry a lot"), factor: "\uC2E0\uACBD\uC131", rev: false },
    { num: 40, content: t("\uB098\uB294 \uD56D\uC0C1 \uC5EC\uC720\uB86D\uB2E4", "I am always at ease"), factor: "\uC2E0\uACBD\uC131", rev: true },
    // 개방성 (Openness) - 10문항
    { num: 41, content: t("\uB098\uB294 \uD48D\uBD80\uD55C \uC5B4\uD718\uB825\uC744 \uAC00\uC9C0\uACE0 \uC788\uB2E4", "I have a rich vocabulary"), factor: "\uAC1C\uBC29\uC131", rev: false },
    { num: 42, content: t("\uB098\uB294 \uCD94\uC0C1\uC801\uC778 \uC544\uC774\uB514\uC5B4\uB97C \uC774\uD574\uD558\uAE30 \uC5B4\uB835\uB2E4", "I find abstract ideas difficult to understand"), factor: "\uAC1C\uBC29\uC131", rev: true },
    { num: 43, content: t("\uB098\uB294 \uC0DD\uC0DD\uD55C \uC0C1\uC0C1\uB825\uC744 \uAC00\uC9C0\uACE0 \uC788\uB2E4", "I have a vivid imagination"), factor: "\uAC1C\uBC29\uC131", rev: false },
    { num: 44, content: t("\uB098\uB294 \uC0C8\uB85C\uC6B4 \uAC83\uC5D0 \uAD00\uC2EC\uC774 \uC5C6\uB2E4", "I am not interested in new things"), factor: "\uAC1C\uBC29\uC131", rev: true },
    { num: 45, content: t("\uB098\uB294 \uB9CE\uC740 \uAC83\uC5D0 \uB300\uD574 \uC0DD\uAC01\uD55C\uB2E4", "I think a lot"), factor: "\uAC1C\uBC29\uC131", rev: false },
    { num: 46, content: t("\uB098\uB294 \uC608\uC220\uC5D0 \uAD00\uC2EC\uC774 \uC5C6\uB2E4", "I am not interested in art"), factor: "\uAC1C\uBC29\uC131", rev: true },
    { num: 47, content: t("\uB098\uB294 \uCCA0\uD559\uC801 \uB17C\uC758\uB97C \uC990\uAE34\uB2E4", "I enjoy philosophical discussions"), factor: "\uAC1C\uBC29\uC131", rev: false },
    { num: 48, content: t("\uB098\uB294 \uBCF5\uC7A1\uD55C \uAC83\uC744 \uC88B\uC544\uD558\uC9C0 \uC54A\uB294\uB2E4", "I don't like complex things"), factor: "\uAC1C\uBC29\uC131", rev: true },
    { num: 49, content: t("\uB098\uB294 \uBE60\uB978 \uC774\uD574\uB825\uC744 \uAC00\uC9C0\uACE0 \uC788\uB2E4", "I understand things quickly"), factor: "\uAC1C\uBC29\uC131", rev: false },
    { num: 50, content: t("\uB098\uB294 \uCC3D\uC758\uC801\uC778 \uD574\uACB0\uCC45\uC744 \uCC3E\uAE30 \uC5B4\uB835\uB2E4", "I find it difficult to come up with creative solutions"), factor: "\uAC1C\uBC29\uC131", rev: true }
  ];
  const sdriCompletionCategories = {
    "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": [1, 2, 3, 8, 9, 11, 12, 15, 16, 18, 19, 20, 21, 23, 24, 25],
    "\uC815\uC11C\uBC18\uC751\uC131": [4, 5, 6, 7, 10],
    "\uC815\uC11C\uC801 \uB2E8\uC808": [13, 17, 22],
    "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": [14]
  };
  const sdriCompletionQ = [
    // ── 자기입장 유지 (16문항) ──────────────────────────────
    { num: 1, prompt: "\uAC08\uB4F1 \uC0C1\uD669\uC5D0\uC11C \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 2, prompt: "\uAC00\uC871\uC774 \uB0B4 \uACC4\uD68D\uC5D0 \uBC18\uB300\uD558\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 3, prompt: "\uC911\uC694\uD55C \uACB0\uC815\uC744 \uD560 \uB54C \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 8, prompt: "\uC694\uAD6C\uAC00 \uC9C0\uB098\uCE58\uAC8C \uBB34\uB9AC\uD558\uB2E4\uACE0 \uB290\uB084 \uB54C \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 9, prompt: "\uC0C1\uB300\uAC00 \uBA3C\uC800 \uC0AC\uACFC\uD558\uC9C0 \uC54A\uC73C\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 11, prompt: "\uB0B4 \uC0DD\uAC01\uACFC \uB2E4\uB978 \uC758\uACAC\uC774 \uAC15\uD558\uAC8C \uC81C\uC2DC\uB418\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 12, prompt: "\uC124\uB4DD\uD574\uC57C \uD560 \uBAA9\uD45C\uAC00 \uC788\uC744 \uB54C, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 15, prompt: "\uB204\uAD70\uAC00 \uB098\uB97C \uAE30\uB2E4\uB9AC\uAC8C \uD558\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 16, prompt: "\uC57D\uC18D\uD55C \uC77C\uC744 \uC644\uC218\uD558\uC9C0 \uBABB\uD560 \uAC83 \uAC19\uC73C\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 18, prompt: "\uC5B4\uB824\uC6B4 \uC77C\uC744 \uB9E1\uC73C\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 19, prompt: "\uC911\uC694\uD55C \uC77C\uC5D0\uC11C \uC2E4\uB9DD\uC744 \uB290\uB084 \uB54C, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 20, prompt: "\uC0AC\uB78C\uC774 \uB9CE\uC740 \uBAA8\uC784\uC5D0\uC11C \uC758\uACAC\uC774 \uC5C7\uAC08\uB9AC\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 21, prompt: "\uCE5C\uD55C \uC0AC\uB78C\uACFC \uC758\uACAC\uC774 \uAC08\uB77C\uC9C0\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 23, prompt: "\uCC45\uC784\uC744 \uB5A0\uB118\uAE30\uACE0 \uC2F6\uC744 \uB54C, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 24, prompt: "\uBB38\uC81C\uAC00 \uBCF5\uC7A1\uD574\uC9C0\uBA74, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    { num: 25, prompt: "\uD798\uB4E0 \uC0C1\uD669\uC5D0\uC11C, \uB098\uB294", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" },
    // ── 정서반응성 (5문항) ──────────────────────────────────
    { num: 4, prompt: "\uB0B4\uAC00 \uC2E4\uC218\uB97C \uD558\uBA74, \uB098\uB294", scale: "\uC815\uC11C\uBC18\uC751\uC131" },
    { num: 5, prompt: "\uCE5C\uAD6C\uAC00 \uB098\uB97C \uBE44\uB09C\uD558\uBA74, \uB098\uB294", scale: "\uC815\uC11C\uBC18\uC751\uC131" },
    { num: 6, prompt: "\uC555\uBC15\uAC10\uC744 \uB290\uB084 \uB54C, \uB098\uB294", scale: "\uC815\uC11C\uBC18\uC751\uC131" },
    { num: 7, prompt: "\uAC10\uC815\uC774 \uBD81\uBC1B\uCE60 \uB54C \uB098\uB294", scale: "\uC815\uC11C\uBC18\uC751\uC131" },
    { num: 10, prompt: "\uC77C\uC774 \uC798 \uD480\uB9AC\uC9C0 \uC54A\uC73C\uBA74, \uB098\uB294", scale: "\uC815\uC11C\uBC18\uC751\uC131" },
    // ── 정서적 단절 (3문항) ─────────────────────────────────
    { num: 13, prompt: "\uD0C0\uC778\uC774 \uB098\uB97C \uBB34\uC2DC\uD558\uBA74, \uB098\uB294", scale: "\uC815\uC11C\uC801 \uB2E8\uC808" },
    { num: 17, prompt: "\uD0C0\uC778\uC774 \uD654\uB97C \uB0B4\uBA74, \uB098\uB294", scale: "\uC815\uC11C\uC801 \uB2E8\uC808" },
    { num: 22, prompt: "\uC2A4\uD2B8\uB808\uC2A4\uB97C \uBC1B\uC744 \uB54C, \uB098\uB294", scale: "\uC815\uC11C\uC801 \uB2E8\uC808" },
    // ── 융합·관계의존 (1문항) ───────────────────────────────
    { num: 14, prompt: "\uCE5C\uAD6C\uAC00 \uB098\uC5D0\uAC8C \uC9C0\uB098\uCE58\uAC8C \uC758\uC874\uD558\uBA74, \uB098\uB294", scale: "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874" }
  ];
  const sdriLikertQ = [
    // ── 자기입장 유지 ───────────────────────────────────────
    { num: 1, content: "\uAC00\uC871\xB7\uCE5C\uAD6C\uC640 \uC758\uACAC\uC774 \uB2EC\uB77C\uB3C4 \uB098\uB294 \uC758\uC5F0\uD558\uAC8C \uB0B4 \uC0DD\uAC01\uC744 \uD45C\uD604\uD55C\uB2E4.", en: "Even when my family or friends disagree, I calmly express my own views.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 2, content: "\uC0C1\uB300\uC758 \uC694\uAD6C\uC5D0 \uC27D\uAC8C \uD718\uB458\uB9AC\uC9C0 \uC54A\uB294\uB2E4.", en: "I am not easily swayed by others' demands.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 5, content: "\uC911\uC694\uD55C \uBAA9\uD45C\uB97C \uC704\uD574\uC11C\uB294 \uC0AC\uB78C\uB4E4\uC774 \uBB50\uB77C \uD558\uB4E0 \uB0B4 \uAE30\uC900\uC744 \uACE0\uC218\uD55C\uB2E4.", en: "I hold to my own standards regardless of what others say, when it matters.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 6, content: "\uB098\uB294 \uBCF4\uD1B5 \uC0C1\uB300\uC758 \uAE30\uB300\uC5D0 \uBA3C\uC800 \uB0B4 \uC0DD\uAC01\uC744 \uB9DE\uCD94\uB294 \uD3B8\uC774\uB2E4.", en: "I usually adjust my thinking to fit others' expectations first.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: true },
    { num: 8, content: "\uC5B4\uB824\uC6B4 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uB098\uB294 \uB300\uD654\uB97C \uD1B5\uD574 \uBB38\uC81C\uB97C \uD574\uACB0\uD558\uB824 \uD55C\uB2E4.", en: "Even in difficult situations, I try to resolve problems through dialogue.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 12, content: "\uB0B4 \uAE30\uBD84\uC774 \uB098\uBE60\uB3C4 \uC911\uC694\uD55C \uC57D\uC18D\uC740 \uBBF8\uB8E8\uC9C0 \uC54A\uACE0 \uC9C0\uD0A4\uB824 \uD55C\uB2E4.", en: "Even when I'm in a bad mood, I keep important commitments without delay.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 15, content: "\uAC00\uC871\uC774\uB098 \uCE5C\uAD6C\uAC00 \uB0B4 \uC0DD\uAC01\uACFC \uB2EC\uB77C\uB3C4 \uB098\uB294 \uB0B4 \uC785\uC7A5\uC744 \uC720\uC9C0\uD55C\uB2E4.", en: "I maintain my position even when family or friends think differently.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 18, content: "\uB0B4 \uC758\uACAC\uC774 \uD2C0\uB9B4 \uC218\uB3C4 \uC788\uC9C0\uB9CC, \uC6B0\uC120 \uB0B4 \uAE30\uC900\uC744 \uC9C0\uD0A4\uB824\uACE0 \uD55C\uB2E4.", en: "My opinion may be wrong, but I still try to uphold my own standards first.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 21, content: "\uD0C0\uC778\uC744 \uBA3C\uC800 \uB9CC\uC871\uC2DC\uD0A4\uAE30\uBCF4\uB2E4 \uC6B0\uC120 \uB0B4 \uAE30\uC900\uC744 \uC9C0\uD0A8\uB2E4.", en: "I uphold my own standards before trying to satisfy others.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    { num: 24, content: "\uC911\uC694\uD55C \uACB0\uC815\uC744 \uB0B4\uB9AC\uAE30 \uC804\uC5D0\uB294 \uD63C\uC790 \uCDA9\uBD84\uD788 \uACE0\uBBFC\uD55C\uB2E4.", en: "Before making important decisions, I take time to reflect on my own.", scale: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0", scaleEn: "Self-Position", rev: false },
    // ── 정서반응성 ─────────────────────────────────────────
    { num: 3, content: "\uAC08\uB4F1 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uB098\uB294 \uAC10\uC815\uC801 \uD3ED\uBC1C\uC744 \uC5B5\uB204\uB974\uACE0 \uC0C1\uD669\uC744 \uC815\uB9AC\uD558\uB824 \uD55C\uB2E4.", en: "Even in conflict, I suppress emotional outbursts and try to calm the situation.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 7, content: "\uB2E4\uB978 \uC0AC\uB78C\uC758 \uB9D0 \uD55C\uB9C8\uB514\uC5D0 \uB098\uB294 \uC27D\uAC8C \uAE30\uBD84\uC774 \uB2EC\uB77C\uC9C4\uB2E4.", en: "My mood is easily changed by a single word from someone else.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 9, content: "\uD654\uAC00 \uB098\uB3C4 \uB098\uB294 \uACE7\uBC14\uB85C \uAC10\uC815\uC744 \uD130\uB728\uB9AC\uC9C0 \uC54A\uB294\uB2E4.", en: "Even when angry, I do not immediately express my emotions.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 14, content: "\uAC08\uB4F1 \uC2DC \uB098\uB294 \uAC10\uC815\uC744 \uC5B5\uC81C\uD558\uACE0 \uB300\uD654\uB97C \uC774\uC5B4\uAC00\uB824 \uD55C\uB2E4.", en: "During conflict, I suppress my emotions and try to continue the conversation.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 16, content: "\uB0B4 \uAE30\uBD84\uC5D0 \uB530\uB77C \uC8FC\uBCC0 \uC0AC\uB78C\uB4E4\uC758 \uD589\uB3D9\uC774 \uC27D\uAC8C \uB2EC\uB77C\uC9C4\uB2E4.", en: "My mood easily affects how the people around me behave.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 23, content: "\uCE5C\uAD6C\uAC00 \uD654\uB97C \uB0B4\uBA74 \uB098\uB294 \uBC14\uB85C \uC6B0\uC6B8\uD574\uC9C4\uB2E4.", en: "When a friend gets angry, I immediately feel depressed.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    { num: 25, content: "\uAE34\uC7A5\uB418\uB294 \uC0C1\uD669\uC5D0\uC11C\uB294 \uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04\uC744 \uAC00\uC9C0\uBA70 \uB9C8\uC74C\uC744 \uAC00\uB77C\uC549\uD78C\uB2E4.", en: "In tense situations, I take time alone to calm my mind.", scale: "\uC815\uC11C\uBC18\uC751\uC131", scaleEn: "Emotional Reactivity", rev: false },
    // ── 정서적 단절 ────────────────────────────────────────
    { num: 4, content: "\uC2A4\uD2B8\uB808\uC2A4 \uC0C1\uD669\uC774 \uB418\uBA74 \uB098\uB294 \uB300\uC778\uAD00\uACC4\uC5D0\uC11C \uAC70\uB9AC\uB97C \uB450\uB824\uB294 \uD3B8\uC774\uB2E4.", en: "When stressed, I tend to distance myself from others.", scale: "\uC815\uC11C\uC801 \uB2E8\uC808", scaleEn: "Emotional Cutoff", rev: false },
    { num: 10, content: "\uAC08\uB4F1\uC774 \uC0DD\uAE30\uBA74 \uB098\uB294 \uBA3C\uC800 \uB4A4\uB85C \uBB3C\uB7EC\uC11C\uB294 \uD3B8\uC774\uB2E4.", en: "When conflict arises, I tend to step back first.", scale: "\uC815\uC11C\uC801 \uB2E8\uC808", scaleEn: "Emotional Cutoff", rev: true },
    { num: 17, content: "\uAC08\uB4F1\uC774 \uC0DD\uAE30\uBA74 \uB098\uB294 \uD63C\uC790 \uC0DD\uAC01\uC5D0 \uC7A0\uAE30\uBA70 \uC790\uB9AC\uB97C \uD53C\uD558\uB824 \uB4E0\uB2E4.", en: "When conflict arises, I tend to withdraw and lose myself in thought.", scale: "\uC815\uC11C\uC801 \uB2E8\uC808", scaleEn: "Emotional Cutoff", rev: false },
    { num: 22, content: "\uD63C\uC790 \uC788\uC73C\uBA74 \uD3B8\uD558\uC9C0\uB9CC, \uAC00\uC871 \uBAA8\uC784 \uB4F1\uC5D0\uB294 \uBD80\uB2F4\uC744 \uB290\uB080\uB2E4.", en: "I'm comfortable alone but feel burdened by family gatherings and similar events.", scale: "\uC815\uC11C\uC801 \uB2E8\uC808", scaleEn: "Emotional Cutoff", rev: true },
    // ── 융합·관계의존 ──────────────────────────────────────
    { num: 11, content: "\uC0AC\uB78C\uB4E4\uC758 \uBD80\uD0C1\uC744 \uAC70\uC808\uD558\uAE30 \uC5B4\uB824\uC6B4 \uD3B8\uC774\uB2E4.", en: "I find it difficult to refuse others' requests.", scale: "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874", scaleEn: "Fusion/Dependence", rev: true },
    { num: 13, content: "\uD0C0\uC778\uC774 \uBA3C\uC800 \uC591\uBCF4\uD574 \uC8FC\uC9C0 \uC54A\uC73C\uBA74 \uBCF4\uD1B5 \uB0B4\uAC00 \uBA3C\uC800 \uC591\uBCF4\uD55C\uB2E4.", en: "If others don't yield first, I usually yield first.", scale: "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874", scaleEn: "Fusion/Dependence", rev: true },
    { num: 19, content: "\uD0C0\uC778\uC758 \uAC10\uC815\uC5D0 \uB108\uBB34 \uC27D\uAC8C \uB3D9\uC870\uD558\uB294 \uD3B8\uC774\uB2E4.", en: "I tend to go along with others' emotions too easily.", scale: "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874", scaleEn: "Fusion/Dependence", rev: false },
    { num: 20, content: "\uC0AC\uB78C\uB4E4\uC744 \uAE30\uC058\uAC8C \uD558\uAE30 \uC704\uD574 \uAC00\uB054 \uB0B4 \uC0DD\uAC01\uC744 \uC811\uC5B4\uB454\uB2E4.", en: "I sometimes set aside my own views to please others.", scale: "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874", scaleEn: "Fusion/Dependence", rev: false }
  ];
  const burnoutQ = [
    // I. 정서적 소진 (12문항)
    { num: 1, content: "\uC5C5\uBB34\uB85C \uC778\uD574 \uAC10\uC815\uC801\uC73C\uB85C \uC644\uC804\uD788 \uC18C\uC9C4\uB41C \uB290\uB08C\uC774 \uB4E0\uB2E4", en: "I feel emotionally drained by my work.", domain: "EE", rev: false },
    { num: 2, content: "\uD1F4\uADFC \uD6C4\uC5D0\uB3C4 \uC5C5\uBB34 \uC0DD\uAC01\uC73C\uB85C \uBA38\uB9AC\uAC00 \uAF49 \uCC28 \uC788\uB2E4", en: "Even after work, my mind is filled with work-related thoughts.", domain: "EE", rev: false },
    { num: 3, content: "\uC544\uCE68\uC5D0 \uCD9C\uADFC\uD560 \uC0DD\uAC01\uB9CC \uD574\uB3C4 \uAE30\uB825\uC774 \uC5C6\uACE0 \uD53C\uACE4\uD558\uB2E4", en: "Just thinking about going to work in the morning makes me feel tired.", domain: "EE", rev: false },
    { num: 4, content: "\uD558\uB8E8 \uC885\uC77C \uC77C\uD558\uACE0 \uB098\uBA74 \uADF9\uB3C4\uB85C \uC9C0\uCCD0 \uC544\uBB34\uAC83\uB3C4 \uD558\uAE30 \uC2EB\uB2E4", en: "After working all day, I feel so exhausted I don't want to do anything.", domain: "EE", rev: false },
    { num: 5, content: "\uC0AC\uB78C\uB4E4\uC744 \uC751\uB300\uD558\uAC70\uB098 \uB3D5\uB294 \uAC83\uC774 \uAC10\uC815\uC801\uC73C\uB85C \uB108\uBB34 \uD798\uB4E4\uB2E4", en: "Dealing with or helping people is emotionally too draining.", domain: "EE", rev: false },
    { num: 6, content: "\uC9C1\uC7A5 \uC0DD\uD65C\uC774 \uB098\uB97C \uB0B4\uBD80\uC5D0\uC11C \uD0DC\uC6CC \uC5C6\uC560\uB294 \uB290\uB08C\uC774 \uB4E0\uB2E4", en: "My work life feels like it is burning me out from the inside.", domain: "EE", rev: false },
    { num: 7, content: "\uAC10\uC815\uC744 \uC3DF\uC544\uB0B4\uB2E4\uAC00 \uC774\uC81C \uB354 \uC774\uC0C1 \uC904 \uAC83\uC774 \uC5C6\uB2E4\uB294 \uB290\uB08C\uC774 \uB4E0\uB2E4", en: "I feel I have nothing left to give emotionally.", domain: "EE", rev: false },
    { num: 8, content: "\uC5C5\uBB34\uB098 \uB3D9\uB8CC\uC5D0 \uB300\uD55C \uC815\uC11C\uC801 \uC5EC\uC720\uAC00 \uC804\uD600 \uC5C6\uB2E4", en: "I have no emotional capacity left for my work or colleagues.", domain: "EE", rev: false },
    { num: 9, content: "\uC77C\uACFC \uC911 \uC791\uC740 \uC77C\uC5D0\uB3C4 \uAC10\uC815\uC801\uC73C\uB85C \uD3ED\uBC1C\uD560 \uAC83 \uAC19\uB2E4", en: "Even minor things at work feel like they could push me to an emotional breaking point.", domain: "EE", rev: false },
    { num: 10, content: "\uC9C1\uC7A5 \uC77C\uC774 \uB098\uC758 \uAC1C\uC778 \uC0B6 \uC804\uCCB4\uB97C \uC7A0\uC2DD\uD558\uB294 \uAC83 \uAC19\uB2E4", en: "Work feels like it is consuming my entire personal life.", domain: "EE", rev: false },
    { num: 11, content: "\uC774\uC9C1\uC774\uB098 \uD1F4\uC9C1\uC744 \uC9C4\uC9C0\uD558\uAC8C \uACE0\uBBFC\uD558\uACE0 \uC788\uB2E4", en: "I am seriously considering changing jobs or quitting.", domain: "EE", rev: false },
    { num: 12, content: "\uC5C5\uBB34\uB97C \uB9C8\uCE5C \uD6C4\uC5D0\uB3C4 \uD68C\uBCF5\uC774 \uB418\uC9C0 \uC54A\uACE0 \uC9C0\uC18D\uC801\uC73C\uB85C \uC9C0\uCCD0 \uC788\uB2E4", en: "Even after finishing work, I cannot recover and remain persistently exhausted.", domain: "EE", rev: false },
    // II. 비인격화 (8문항)
    { num: 13, content: "\uACE0\uAC1D\uC774\uB098 \uB3D9\uB8CC\uAC00 \uB9C8\uCE58 \uBB34\uAC10\uAC01\uD55C \uB300\uC0C1\uCC98\uB7FC \uB290\uAEF4\uC9C4\uB2E4", en: "Clients or colleagues feel like impersonal objects to me.", domain: "DP", rev: false },
    { num: 14, content: "\uC694\uC998 \uB4E4\uC5B4 \uB098 \uC790\uC2E0\uC774 \uC810\uC810 \uB0C9\uB2F4\uD558\uACE0 \uBB34\uAC10\uAC01\uD574\uC84C\uB2E4", en: "Lately I have become increasingly cold and emotionally numb.", domain: "DP", rev: false },
    { num: 15, content: "\uC5C5\uBB34 \uAD00\uB828 \uC0AC\uB78C\uB4E4\uC758 \uBB38\uC81C\uC5D0 \uBB34\uAD00\uC2EC\uD574\uC9C0\uAC70\uB098 \uADC0\uCC2E\uC544\uC9C4\uB2E4", en: "I have become indifferent to or annoyed by the problems of people at work.", domain: "DP", rev: false },
    { num: 16, content: "\uC0AC\uB78C\uC744 \uB300\uD558\uB294 \uC77C\uC774 \uB0B4 \uC5D0\uB108\uC9C0\uB97C \uC2EC\uD558\uAC8C \uC18C\uBAA8\uC2DC\uD0A8\uB2E4", en: "Dealing with people drains my energy severely.", domain: "DP", rev: false },
    { num: 17, content: "\uD68C\uC0AC\uB098 \uC870\uC9C1\uC758 \uBC29\uD5A5\uC131\xB7\uBAA9\uD45C\uAC00 \uBB34\uC758\uBBF8\uD558\uAC8C \uB290\uAEF4\uC9C4\uB2E4", en: "The direction and goals of my company or organization feel meaningless.", domain: "DP", rev: false },
    { num: 18, content: "\uC774 \uC9C1\uC7A5\uC774 \uB098\uC5D0\uAC8C \uC544\uBB34 \uC758\uBBF8\uB3C4 \uC5C6\uB2E4\uB294 \uC0DD\uAC01\uC774 \uB4E0\uB2E4", en: "I feel that this job means nothing to me.", domain: "DP", rev: false },
    { num: 19, content: "\uC0AC\uB78C\uB4E4\uC758 \uAC10\uC815\uC801 \uBB38\uC81C\uC5D0 \uC2E4\uC81C\uB85C \uAD00\uC2EC\uC774 \uC5C6\uC5B4\uC84C\uB2E4", en: "I have genuinely lost interest in people's emotional problems.", domain: "DP", rev: false },
    { num: 20, content: "\uC77C\uD558\uBA74\uC11C \uC810\uC810 \uACF5\uAC10 \uB2A5\uB825\uC744 \uC783\uC5B4\uAC00\uB294 \uAC83 \uAC19\uB2E4", en: "I feel like I am gradually losing my ability to empathize at work.", domain: "DP", rev: false },
    // III. 성취감 저하 (10문항, 역채점)
    { num: 21, content: "\uC774 \uC77C\uC744 \uD1B5\uD574 \uB2E4\uB978 \uC0AC\uB78C\uC758 \uC0B6\uC5D0 \uAE0D\uC815\uC801\uC778 \uC601\uD5A5\uC744 \uC900\uB2E4\uACE0 \uB290\uB080\uB2E4", en: "I feel I am positively influencing others' lives through my work.", domain: "PA", rev: true },
    { num: 22, content: "\uC5C5\uBB34\uC5D0\uC11C \uAC00\uCE58 \uC788\uB294 \uC77C\uC744 \uD574\uB0B4\uACE0 \uC788\uB2E4\uB294 \uBCF4\uB78C\uC744 \uB290\uB080\uB2E4", en: "I feel a sense of fulfillment in doing worthwhile work.", domain: "PA", rev: true },
    { num: 23, content: "\uC5B4\uB824\uC6B4 \uBB38\uC81C\uB97C \uC2A4\uC2A4\uB85C \uD574\uACB0\uD588\uC744 \uB54C \uBFCC\uB4EF\uD568\uC744 \uB290\uB080\uB2E4", en: "I feel proud when I solve a difficult problem on my own.", domain: "PA", rev: true },
    { num: 24, content: "\uB0B4 \uC5C5\uBB34\uAC00 \uC870\uC9C1\uC5D0 \uC758\uBBF8 \uC788\uAC8C \uAE30\uC5EC\uD55C\uB2E4\uACE0 \uC0DD\uAC01\uD55C\uB2E4", en: "I believe my work contributes meaningfully to the organization.", domain: "PA", rev: true },
    { num: 25, content: "\uC9C1\uC7A5\uC5D0\uC11C \uB098 \uC790\uC2E0\uC774 \uC131\uC7A5\uD558\uACE0 \uC788\uB2E4\uB294 \uB290\uB08C\uC774 \uB4E0\uB2E4", en: "I feel I am growing as a person at work.", domain: "PA", rev: true },
    { num: 26, content: "\uC5C5\uBB34 \uC911 \uC990\uAC70\uC6C0\uC774\uB098 \uBAB0\uC785\uC744 \uACBD\uD5D8\uD55C\uB2E4", en: "I experience enjoyment or flow during my work.", domain: "PA", rev: true },
    { num: 27, content: "\uB0B4 \uC9C1\uC5C5 \uC120\uD0DD\uC774 \uC633\uC558\uB2E4\uB294 \uD655\uC2E0\uC774 \uC788\uB2E4", en: "I am confident that I made the right career choice.", domain: "PA", rev: true },
    { num: 28, content: "\uC0AC\uB78C\uB4E4\uC744 \uD6A8\uACFC\uC801\uC73C\uB85C \uB3C4\uC654\uB2E4\uB294 \uB9CC\uC871\uAC10\uC744 \uB290\uB080\uB2E4", en: "I feel satisfied that I have helped people effectively.", domain: "PA", rev: true },
    { num: 29, content: "\uC774 \uC77C\uC744 \uD1B5\uD574 \uB0B4\uAC00 \uC0AC\uD68C\uC5D0 \uAE30\uC5EC\uD558\uACE0 \uC788\uB2E4\uB294 \uC790\uAE0D\uC2EC\uC774 \uC788\uB2E4", en: "I take pride in contributing to society through my work.", domain: "PA", rev: true },
    { num: 30, content: "\uD604\uC7AC \uB0B4 \uC5ED\uB7C9\uC774 \uC798 \uBC1C\uD718\uB418\uACE0 \uC788\uB2E4\uACE0 \uB290\uB080\uB2E4", en: "I feel my abilities are being well utilized right now.", domain: "PA", rev: true },
    // IV. 업무 과부하 (10문항)
    { num: 31, content: "\uC5C5\uBB34\uB7C9\uC774 \uB098 \uD63C\uC790 \uAC10\uB2F9\uD558\uAE30\uC5D0 \uB108\uBB34 \uB9CE\uB2E4", en: "The workload is too much for me to handle on my own.", domain: "WO", rev: false },
    { num: 32, content: "\uC5C5\uBB34 \uB9C8\uAC10\uC774\uB098 \uC694\uAD6C\uC0AC\uD56D\uC774 \uBD88\uD569\uB9AC\uD558\uAC8C \uB290\uAEF4\uC9C4\uB2E4", en: "Work deadlines or requirements feel unreasonable.", domain: "WO", rev: false },
    { num: 33, content: "\uC5C5\uBB34 \uBC29\uC2DD\uC774\uB098 \uC6B0\uC120\uC21C\uC704\uC5D0 \uB300\uD55C \uACB0\uC815\uAD8C\uC774 \uC5C6\uB2E4\uACE0 \uB290\uB080\uB2E4", en: "I feel I have no say in how I work or what to prioritize.", domain: "WO", rev: false },
    { num: 34, content: "\uC57C\uADFC\uC774\uB098 \uCD08\uACFC \uADFC\uBB34\uAC00 \uC77C\uC0C1\uD654\uB418\uC5B4 \uC788\uB2E4", en: "Overtime or overwork has become a daily norm.", domain: "WO", rev: false },
    { num: 35, content: "\uBAA8\uC21C\uB418\uAC70\uB098 \uCDA9\uB3CC\uD558\uB294 \uC5C5\uBB34 \uC9C0\uC2DC\uB97C \uB3D9\uC2DC\uC5D0 \uBC1B\uB294\uB2E4", en: "I receive contradictory or conflicting work instructions simultaneously.", domain: "WO", rev: false },
    { num: 36, content: "\uC5C5\uBB34 \uC131\uACFC\uC5D0 \uBE44\uD574 \uC778\uC815\xB7\uBCF4\uC0C1\uC774 \uBD80\uC871\uD558\uB2E4\uACE0 \uB290\uB080\uB2E4", en: "I feel underrecognized or underrewarded relative to my performance.", domain: "WO", rev: false },
    { num: 37, content: "\uC9C1\uC7A5 \uB0B4 \uACF5\uC815\uC131\uC774 \uBD80\uC871\uD558\uB2E4\uACE0 \uB290\uB080\uB2E4", en: "I feel there is a lack of fairness in my workplace.", domain: "WO", rev: false },
    { num: 38, content: "\uAC1C\uC778 \uC0B6\uACFC \uC5C5\uBB34 \uAC04\uC758 \uADE0\uD615\uC744 \uB9DE\uCD94\uAE30 \uC5B4\uB835\uB2E4", en: "I find it difficult to maintain a balance between personal life and work.", domain: "WO", rev: false },
    { num: 39, content: "\uC5C5\uBB34 \uC911 \uC9C0\uC18D\uC801\uC778 \uBC29\uD574\uB098 \uC911\uB2E8\uC73C\uB85C \uC9D1\uC911\uC774 \uBD88\uAC00\uB2A5\uD558\uB2E4", en: "Constant interruptions at work make it impossible to concentrate.", domain: "WO", rev: false },
    { num: 40, content: "\uC870\uC9C1\uC758 \uAC00\uCE58\uAD00\uC774 \uB0B4 \uAC1C\uC778 \uAC00\uCE58\uAD00\uACFC \uC2EC\uD558\uAC8C \uCDA9\uB3CC\uD55C\uB2E4", en: "The organization's values seriously conflict with my personal values.", domain: "WO", rev: false },
    // V. 신체·인지 (10문항)
    { num: 41, content: "\uCDA9\uBD84\uD788 \uC7A4\uB294\uB370\uB3C4 \uAC1C\uC6B4\uD558\uC9C0 \uC54A\uACE0 \uC9C0\uC18D\uC801\uC73C\uB85C \uD53C\uB85C\uD558\uB2E4", en: "Even after enough sleep, I still feel unrefreshed and persistently tired.", domain: "PC", rev: false },
    { num: 42, content: "\uB450\uD1B5, \uADFC\uC721 \uAE34\uC7A5, \uC5B4\uAE68\xB7\uBAA9 \uD1B5\uC99D\uC774 \uC790\uC8FC \uC0DD\uAE34\uB2E4", en: "I frequently experience headaches, muscle tension, or shoulder and neck pain.", domain: "PC", rev: false },
    { num: 43, content: "\uC5C5\uBB34 \uC911 \uAE30\uC5B5\uB825\uC774\uB098 \uC9D1\uC911\uB825\uC774 \uD604\uC800\uD788 \uC800\uD558\uB41C \uAC83 \uAC19\uB2E4", en: "My memory and concentration seem significantly impaired at work.", domain: "PC", rev: false },
    { num: 44, content: "\uC18C\uD654\uBD88\uB7C9, \uC704\uACBD\uB828, \uC2DD\uC695 \uBCC0\uD654 \uB4F1 \uC18C\uD654 \uBB38\uC81C\uAC00 \uC788\uB2E4", en: "I have digestive issues such as indigestion, stomach cramps, or changes in appetite.", domain: "PC", rev: false },
    { num: 45, content: "\uC7A0\uB4E4\uAE30 \uC5B4\uB835\uAC70\uB098 \uC911\uAC04\uC5D0 \uC790\uAFB8 \uAE6C\uB2E4", en: "I have trouble falling asleep or wake up frequently during the night.", domain: "PC", rev: false },
    { num: 46, content: "\uBA74\uC5ED\uB825\uC774 \uB5A8\uC5B4\uC838 \uC790\uC8FC \uAC10\uAE30\uB098 \uC794\uBCD1\uC5D0 \uAC78\uB9B0\uB2E4", en: "My immunity seems weakened and I frequently catch colds or minor illnesses.", domain: "PC", rev: false },
    { num: 47, content: "\uCE74\uD398\uC778\xB7\uC54C\uCF54\uC62C\xB7\uC57D\uBB3C\uC5D0 \uC810\uC810 \uB354 \uC758\uC874\uD558\uAC8C \uB41C\uB2E4", en: "I am becoming increasingly dependent on caffeine, alcohol, or other substances.", domain: "PC", rev: false },
    { num: 48, content: "\uC5C5\uBB34 \uC678 \uCDE8\uBBF8\xB7\uC6B4\uB3D9 \uB4F1 \uC990\uAE30\uB358 \uD65C\uB3D9\uC744 \uC644\uC804\uD788 \uD3EC\uAE30\uD588\uB2E4", en: "I have completely given up hobbies or activities I used to enjoy outside of work.", domain: "PC", rev: false },
    { num: 49, content: "\uAC04\uB2E8\uD55C \uACB0\uC815\uB3C4 \uB0B4\uB9AC\uAE30 \uC5B4\uB835\uACE0 \uD310\uB2E8\uB825\uC774 \uD750\uB824\uC84C\uB2E4", en: "Even simple decisions are hard to make and my judgment feels clouded.", domain: "PC", rev: false },
    { num: 50, content: "\uC2EC\uC7A5 \uB450\uADFC\uAC70\uB9BC, \uC2DD\uC740\uB540, \uB9CC\uC131 \uAE34\uC7A5\uAC10 \uB4F1 \uC2E0\uCCB4 \uC99D\uC0C1\uC774 \uC788\uB2E4", en: "I experience physical symptoms such as heart palpitations, cold sweats, or chronic tension.", domain: "PC", rev: false }
  ];
  const lostQ = [
    // ── 축 1. 에너지 방향 (Energy Direction)
    { num: 1, content: t("\uB0AF\uC120 \uC0AC\uB78C\uB4E4\uACFC \uC27D\uAC8C \uC5B4\uC6B8\uB9AC\uBA70 \uC5D0\uB108\uC9C0\uB97C \uC5BB\uB294\uB2E4", "I easily socialize with strangers and gain energy from it"), axis: "E", dir: "E", rev: false },
    { num: 2, content: t("\uD63C\uC790 \uC870\uC6A9\uD788 \uC9C0\uB0B4\uBA74 \uC624\uD788\uB824 \uB9C8\uC74C\uC774 \uD3B8\uC548\uD558\uB2E4", "Spending time alone quietly feels more comfortable to me"), axis: "E", dir: "I", rev: true },
    { num: 3, content: t("\uD30C\uD2F0\uB098 \uBAA8\uC784\uC5D0 \uAC00\uBA74 \uD65C\uAE30\uAC00 \uC0DD\uAE34\uB2E4", "I feel energized at parties or gatherings"), axis: "E", dir: "E", rev: false },
    { num: 4, content: t("\uD070 \uBAA8\uC784\uBCF4\uB2E4 \uCE5C\uD55C \uCE5C\uAD6C \uBA87 \uBA85\uACFC \uC2DC\uAC04 \uBCF4\uB0B4\uB294 \uAC83\uC744 \uC120\uD638\uD55C\uB2E4", "I prefer spending time with a few close friends over large groups"), axis: "E", dir: "I", rev: true },
    { num: 5, content: t("\uC0C8\uB85C\uC6B4 \uC0AC\uB78C\uACFC \uB300\uD654\uD558\uBA74 \uAE08\uBC29 \uCE5C\uD574\uC9C0\uB294 \uD3B8\uC774\uB2E4", "I warm up to new people quickly in conversation"), axis: "E", dir: "E", rev: false },
    { num: 6, content: t("\uC0AC\uB78C\uB4E4 \uC55E\uC5D0\uC11C \uC774\uC57C\uAE30\uD560 \uB54C \uAE34\uC7A5\uD55C\uB2E4", "I feel nervous speaking in front of others"), axis: "E", dir: "I", rev: true },
    { num: 7, content: t("\uCE5C\uBAA9 \uBAA8\uC784\uC5D0\uC11C \uC8FC\uB3C4\uC801\uC73C\uB85C \uD589\uB3D9\uD558\uB294 \uD3B8\uC774\uB2E4", "I tend to take the lead at social events"), axis: "E", dir: "E", rev: false },
    { num: 8, content: t("\uC624\uB79C\uB9CC\uC5D0 \uB9CC\uB09C \uCE5C\uD55C \uCE5C\uAD6C\uBCF4\uB2E4 \uD63C\uC790 \uC26C\uB294 \uAC83\uC774 \uB354 \uC88B\uB2E4", "I prefer resting alone over meeting a close friend I haven't seen in a while"), axis: "E", dir: "I", rev: true },
    { num: 9, content: t("\uB0AF\uC120 \uD658\uACBD\uC5D0\uC11C \uCC98\uC74C \uB9CC\uB09C \uC0AC\uB78C\uB4E4\uACFC \uBE68\uB9AC \uCE5C\uD574\uC9C4\uB2E4", "I make friends quickly in unfamiliar settings"), axis: "E", dir: "E", rev: false },
    { num: 10, content: t("\uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04\uC774 \uBD80\uC871\uD558\uBA74 \uAE08\uBC29 \uC9C0\uCE5C\uB2E4", "If I don't get enough alone time, I feel drained quickly"), axis: "E", dir: "I", rev: true },
    // ── 축 2. 의사결정 방식 (Decision Style)
    { num: 11, content: t("\uACB0\uC815\uC744 \uB0B4\uB9B4 \uB54C \uAC10\uC815\uBCF4\uB2E4 \uC0AC\uC2E4\uACFC \uB17C\uB9AC\uB97C \uC6B0\uC120\uD55C\uB2E4", "When making decisions, I prioritize facts and logic over emotions"), axis: "D", dir: "T", rev: false },
    { num: 12, content: t("\uB370\uC774\uD130\uC640 \uC0AC\uC2E4\uC744 \uAE30\uBC18\uC73C\uB85C \uACB0\uC815\uC744 \uB0B4\uB9AC\uB294 \uD3B8\uC774\uB2E4", "I tend to make decisions based on data and facts"), axis: "D", dir: "T", rev: false },
    { num: 13, content: t("\uC911\uC694\uD55C \uACB0\uC815\uC744 \uD560 \uB54C \uC8FC\uBCC0 \uC0AC\uB78C\uB4E4\uC758 \uAC10\uC815\uB3C4 \uD568\uAED8 \uACE0\uB824\uD55C\uB2E4", "When making important decisions, I also consider the feelings of people around me"), axis: "D", dir: "F", rev: true },
    { num: 14, content: t("\uAC10\uC815\uC774\uB098 \uBD84\uC704\uAE30\uC5D0 \uB530\uB77C \uB0B4 \uD310\uB2E8\uC774 \uD06C\uAC8C \uB2EC\uB77C\uC9C0\uB294 \uD3B8\uC774\uB2E4", "My judgments are often strongly influenced by emotions or mood"), axis: "D", dir: "F", rev: true },
    { num: 15, content: t("\uBB38\uC81C\uB97C \uBD84\uC11D\uD560 \uB54C \uAC10\uC815\uBCF4\uB2E4 \uC774\uC131\uC774 \uC55E\uC120\uB2E4", "When analyzing problems, reason takes precedence over emotion"), axis: "D", dir: "T", rev: false },
    { num: 16, content: t("\uC758\uC0AC\uACB0\uC815\uC5D0\uC11C \uD0C0\uC778\uC758 \uAE30\uBD84\uACFC \uC870\uD654\uB97C \uC774\uB8E8\uB824 \uD55C\uB2E4", "I try to maintain harmony with others' feelings in decision-making"), axis: "D", dir: "F", rev: true },
    { num: 17, content: t("\uB17C\uB9AC\uC801 \uC124\uBA85\uC774 \uC5C6\uC73C\uBA74 \uC911\uC694\uD55C \uACB0\uC815\uC744 \uBBFF\uAE30 \uC5B4\uB835\uB2E4", "Without a logical explanation, I find it hard to trust important decisions"), axis: "D", dir: "T", rev: false },
    { num: 18, content: t("\uB2E4\uB978 \uC0AC\uB78C\uC774 \uC6B0\uC6B8\uD574 \uBCF4\uC774\uBA74 \uB0B4 \uAE30\uBD84\uB3C4 \uC601\uD5A5\uC744 \uBC1B\uB294\uB2E4", "When someone around me seems sad, my own mood is affected"), axis: "D", dir: "F", rev: true },
    { num: 19, content: t("\uAC1D\uAD00\uC801\uC778 \uB370\uC774\uD130\uAC00 \uC5C6\uC73C\uBA74 \uACB0\uC815\uC744 \uB0B4\uB9AC\uAE30 \uC5B4\uB835\uB2E4", "Without objective data, I find it hard to make decisions"), axis: "D", dir: "T", rev: false },
    { num: 20, content: t("\uB098\uB97C \uD654\uB098\uAC8C \uD55C \uC0AC\uB78C\uC744 \uC27D\uAC8C \uC6A9\uC11C\uD574 \uC8FC\uC9C0 \uBABB\uD55C\uB2E4", "I have difficulty forgiving someone who has upset me"), axis: "D", dir: "F", rev: false },
    // ── 축 3. 행동 속도 (Action Speed)
    { num: 21, content: t("\uAE09\uD55C \uC77C\uC774 \uC0DD\uAE30\uBA74 \uC989\uC2DC \uD589\uB3D9\uD558\uB294 \uD3B8\uC774\uB2E4", "When something urgent comes up, I act immediately"), axis: "S", dir: "P", rev: false },
    { num: 22, content: t("\uCDA9\uBD84\uD788 \uACC4\uD68D\uD558\uC9C0 \uC54A\uC73C\uBA74 \uBD88\uC548\uD574\uC11C \uC2E4\uD589\uD558\uAE30 \uC5B4\uB835\uB2E4", "Without sufficient planning, I feel anxious and struggle to act"), axis: "S", dir: "J", rev: true },
    { num: 23, content: t("\uC77C\uC744 \uD560 \uB54C \uC2E0\uC18D\uD568\uBCF4\uB2E4 \uAF3C\uAF3C\uD568\uC774 \uB354 \uC911\uC694\uD558\uB2E4\uACE0 \uC0DD\uAC01\uD55C\uB2E4", "I think thoroughness is more important than speed when doing work"), axis: "S", dir: "J", rev: true },
    { num: 24, content: t("\uC77C\uC744 \uCC98\uB9AC\uD560 \uB54C \uC989\uD765\uC801\uC73C\uB85C \uC9C4\uD589\uD558\uB294 \uAC83\uC744 \uC88B\uC544\uD55C\uB2E4", "I enjoy proceeding with tasks spontaneously"), axis: "S", dir: "P", rev: false },
    { num: 25, content: t("\uACC4\uD68D\uB300\uB85C \uC6C0\uC9C1\uC774\uB294 \uAC83\uBCF4\uB2E4 \uBE60\uB974\uAC8C \uACB0\uC815\uC744 \uBC14\uAFB8\uB294 \uD3B8\uC774\uB2E4", "I tend to change decisions quickly rather than stick to a plan"), axis: "S", dir: "P", rev: false },
    { num: 26, content: t("\uC2DC\uAC04\uC774 \uD5C8\uB77D\uD560 \uB54C\uB294 \uAE4A\uC774 \uACE0\uBBFC\uD55C \uB4A4 \uD589\uB3D9\uD55C\uB2E4", "When time allows, I prefer to think deeply before acting"), axis: "S", dir: "J", rev: true },
    { num: 27, content: t("\uB9C8\uAC10\uC774 \uC784\uBC15\uD558\uBA74 \uD6A8\uC728\uBCF4\uB2E4 \uC18D\uB3C4\uB97C \uC911\uC2DC\uD55C\uB2E4", "When a deadline is near, I prioritize speed over thoroughness"), axis: "S", dir: "P", rev: false },
    { num: 28, content: t("\uCDA9\uB3D9\uC801\uC73C\uB85C \uACB0\uC815\uD558\uBA74 \uB098\uC911\uC5D0 \uD6C4\uD68C\uD560 \uB54C\uAC00 \uB9CE\uB2E4", "I often regret impulsive decisions later"), axis: "S", dir: "J", rev: true },
    { num: 29, content: t("\uBE60\uB978 \uC2E4\uD589\uC740 \uC911\uC694\uD558\uC9C0\uB9CC \uC2E4\uC218\uAC00 \uC0DD\uAE38\uAE4C \uAC71\uC815\uB41C\uB2E4", "Quick execution matters, but I worry about making mistakes"), axis: "S", dir: "J", rev: true },
    { num: 30, content: t("\uC0C1\uD669\uC5D0 \uB530\uB77C \uD589\uB3D9 \uBC29\uC2DD\uC744 \uC989\uC2DC \uBC14\uAFB8\uB294 \uD3B8\uC774\uB2E4", "I tend to change my approach immediately depending on the situation"), axis: "S", dir: "P", rev: false },
    // ── 축 4. 안정성 (Stability)
    { num: 31, content: t("\uBCC0\uD654\uB294 \uB098\uB97C \uC124\uB808\uAC8C \uD55C\uB2E4", "Change excites me"), axis: "N", dir: "C", rev: false },
    { num: 32, content: t("\uC775\uC219\uD55C \uD658\uACBD\uC774 \uC548\uC804\uD558\uB2E4\uACE0 \uB290\uB080\uB2E4", "Familiar environments feel safe to me"), axis: "N", dir: "N", rev: true },
    { num: 33, content: t("\uC0C8\uB85C\uC6B4 \uB3C4\uC804\uC774 \uC8FC\uB294 \uC790\uADF9\uC744 \uC990\uAE34\uB2E4", "I enjoy the stimulation that new challenges bring"), axis: "N", dir: "C", rev: false },
    { num: 34, content: t("\uC548\uC815\uC801\uC778 \uC77C\uACFC\uB97C \uBC97\uC5B4\uB098\uBA74 \uBD88\uC548\uAC10\uC774 \uD06C\uB2E4", "Stepping away from a stable routine makes me anxious"), axis: "N", dir: "N", rev: true },
    { num: 35, content: t("\uC0C8\uB85C\uC6B4 \uD504\uB85C\uC81D\uD2B8\uBCF4\uB2E4 \uC775\uC219\uD55C \uC77C\uC5D0 \uC9D1\uC911\uD558\uB294 \uD3B8\uC774\uB2E4", "I tend to focus on familiar tasks rather than new projects"), axis: "N", dir: "N", rev: true },
    { num: 36, content: t("\uBCC0\uD654\uB97C \uB9DE\uC774\uD560 \uB54C \uD765\uBBF8\uB97C \uB290\uB080\uB2E4", "I feel excited when facing change"), axis: "N", dir: "C", rev: false },
    { num: 37, content: t("\uC608\uCE21 \uAC00\uB2A5\uD55C \uD658\uACBD\uC5D0\uC11C \uC77C\uD558\uB294 \uAC83\uC774 \uD3B8\uC548\uD558\uB2E4", "Working in a predictable environment feels comfortable"), axis: "N", dir: "N", rev: true },
    { num: 38, content: t("\uC77C\uC0C1\uC758 \uD2C0\uC5D0\uC11C \uBC97\uC5B4\uB098 \uC0C8\uB85C\uC6B4 \uBC29\uC2DD\uC744 \uC2DC\uB3C4\uD55C\uB2E4", "I step outside my daily routine to try new approaches"), axis: "N", dir: "C", rev: false },
    { num: 39, content: t("\uC0C8\uB85C\uC6B4 \uC544\uC774\uB514\uC5B4\uAC00 \uB5A0\uC624\uB974\uBA74 \uC2E0\uB098\uC9C0\uB9CC \uAC71\uC815\uB3C4 \uB41C\uB2E4", "New ideas excite me, but I also feel some worry"), axis: "N", dir: "C", rev: false },
    { num: 40, content: t("\uC77C\uC0C1\uC758 \uBCC0\uD654\uAC00 \uD06C\uBA74 \uAE34\uC7A5\uD55C\uB2E4", "Large changes in my daily routine make me tense"), axis: "N", dir: "N", rev: true },
    // ── 축 5. 관계 민감도 (Relation Sensitivity)
    { num: 41, content: t("\uD300\uC758 \uBAA9\uD45C\uB97C \uC704\uD574 \uB2E4\uB978 \uC0AC\uB78C\uACFC \uD611\uB825\uD558\uB294 \uAC83\uC744 \uC911\uC694\uD558\uAC8C \uC0DD\uAC01\uD55C\uB2E4", "I believe cooperation with others is important for achieving team goals"), axis: "R", dir: "R", rev: false },
    { num: 42, content: t("\uB0B4 \uC0DD\uAC01\uC744 \uACE0\uC9D1\uD558\uAE30\uBCF4\uB2E4 \uC8FC\uBCC0 \uC758\uACAC\uC5D0 \uB530\uB77C \uACB0\uC815\uC744 \uBC14\uAFB8\uAE30\uB3C4 \uD55C\uB2E4", "I sometimes change my decisions based on others' opinions rather than insisting on my own"), axis: "R", dir: "R", rev: false },
    { num: 43, content: t("\uD63C\uC790 \uC77C\uD558\uB294 \uAC83\uBCF4\uB2E4 \uD300\uC6CC\uD06C\uAC00 \uC798 \uB9DE\uB294 \uC77C\uC744 \uC88B\uC544\uD55C\uB2E4", "I prefer teamwork-oriented work over working alone"), axis: "R", dir: "R", rev: false },
    { num: 44, content: t("\uC911\uC694\uD55C \uACB0\uC815\uC740 \uC8FC\uB85C \uB098 \uD63C\uC790 \uD310\uB2E8\uC73C\uB85C \uD55C\uB2E4", "I mostly make important decisions on my own judgment"), axis: "R", dir: "I", rev: true },
    { num: 45, content: t("\uB3D9\uB8CC\uB098 \uCE5C\uAD6C\uC640\uC758 \uC870\uD654\uB97C \uC704\uD574 \uC591\uBCF4\uD558\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uB2E4", "I often compromise to maintain harmony with colleagues or friends"), axis: "R", dir: "R", rev: false },
    { num: 46, content: t("\uC790\uC2E0\uC758 \uC758\uACAC\uBCF4\uB2E4 \uD300\uC758 \uBAA9\uD45C\uB97C \uC6B0\uC120\uD55C\uB2E4", "I prioritize team goals over my personal opinions"), axis: "R", dir: "R", rev: false },
    { num: 47, content: t("\uBC18\uB4DC\uC2DC \uB2E4\uB978 \uC0AC\uB78C\uC758 \uB3C4\uC6C0 \uC5C6\uC774 \uCC98\uB9AC\uD558\uACE0 \uC2F6\uC5B4 \uD558\uB294 \uD3B8\uC774\uB2E4", "I prefer to handle things on my own without others' help"), axis: "R", dir: "I", rev: true },
    { num: 48, content: t("\uCE5C\uBC00\uD55C \uAD00\uACC4\uB97C \uB9FA\uB294 \uAC83\uC774 \uB098\uC5D0\uAC8C \uD070 \uC758\uBBF8\uAC00 \uC788\uB2E4", "Building close relationships is very meaningful to me"), axis: "R", dir: "R", rev: false },
    { num: 49, content: t("\uD63C\uC790 \uC788\uC744 \uB54C \uC624\uD788\uB824 \uB354 \uC0DD\uC0B0\uC801\uC774\uB77C\uACE0 \uB290\uB080\uB2E4", "I feel more productive when I'm alone"), axis: "R", dir: "I", rev: false },
    { num: 50, content: t("\uB2E4\uB978 \uC0AC\uB78C\uC758 \uAE30\uBD84\uC744 \uAE08\uBC29 \uD30C\uC545\uD558\uB294 \uD3B8\uC774\uB2E4", "I quickly pick up on others' moods"), axis: "R", dir: "R", rev: false },
    // ── 축 6. 스트레스 반응 (Stress Response)
    { num: 51, content: t("\uBB38\uC81C\uAC00 \uC0DD\uAE30\uBA74 \uC989\uC2DC \uD53C\uD558\uAC70\uB098 \uD68C\uD53C\uD558\uB824\uACE0 \uD55C\uB2E4", "When a problem arises, I tend to avoid or escape it immediately"), axis: "T", dir: "V", rev: true },
    { num: 52, content: t("\uC5B4\uB824\uC6B4 \uC77C\uC774 \uC0DD\uAE30\uBA74 \uBC14\uB85C \uB300\uC751\uD558\uBA74\uC11C \uD574\uACB0\uCC45\uC744 \uCC3E\uB294\uB2E4", "When something difficult happens, I respond immediately and look for solutions"), axis: "T", dir: "A", rev: false },
    { num: 53, content: t("\uC2A4\uD2B8\uB808\uC2A4\uB97C \uBC1B\uC73C\uBA74 \uC26C\uC5B4\uC57C\uB9CC \uC9C4\uC815\uB420 \uC218 \uC788\uB2E4\uACE0 \uB290\uB080\uB2E4", "When stressed, I feel I can only calm down by resting"), axis: "T", dir: "V", rev: true },
    { num: 54, content: t("\uC704\uAE30 \uC0C1\uD669\uC5D0\uC11C \uCE68\uCC29\uD558\uAC8C \uBB38\uC81C\uB97C \uD574\uACB0\uD558\uB824 \uB178\uB825\uD55C\uB2E4", "I try to stay calm and solve problems even in crisis situations"), axis: "T", dir: "A", rev: false },
    { num: 55, content: t("\uAC08\uB4F1 \uC0C1\uD669\uC740 \uD53C\uD574\uC57C \uD55C\uB2E4\uACE0 \uC0DD\uAC01\uD55C\uB2E4", "I think conflict situations should be avoided"), axis: "T", dir: "V", rev: true },
    { num: 56, content: t("\uBB38\uC81C\uAC00 \uC0DD\uAE30\uBA74 \uC801\uADF9\uC801\uC73C\uB85C \uBE60\uB974\uAC8C \uD574\uACB0\uD558\uB824 \uD55C\uB2E4", "When a problem arises, I actively try to resolve it quickly"), axis: "T", dir: "A", rev: false },
    { num: 57, content: t("\uC2A4\uD2B8\uB808\uC2A4\uB97C \uBC1B\uC73C\uBA74 \uC0C1\uD669\uC744 \uD68C\uD53C\uD558\uACE0 \uC2F6\uC5B4\uC9C4\uB2E4", "When stressed, I want to avoid the situation"), axis: "T", dir: "V", rev: true },
    { num: 58, content: t("\uACE4\uB780\uD55C \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uB2F9\uBA74 \uACFC\uC81C\uC5D0 \uC9D1\uC911\uD558\uB294 \uD3B8\uC774\uB2E4", "Even in difficult situations, I focus on the task at hand"), axis: "T", dir: "A", rev: false },
    { num: 59, content: t("\uBB38\uC81C \uC0C1\uD669\uC5D0\uC11C \uC8FC\uBCC0 \uC0AC\uB78C\uC5D0\uAC8C \uB3C4\uC6C0 \uCCAD\uD558\uB294 \uAC83\uC744 \uAEBC\uB9B0\uB2E4", "I am reluctant to ask others for help in difficult situations"), axis: "T", dir: "V", rev: true },
    { num: 60, content: t("\uAE34\uC7A5\uB418\uB294 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uBA3C\uC800 \uD574\uACB0\uCC45\uC744 \uBAA8\uC0C9\uD55C\uB2E4", "Even in tense situations, I look for solutions first"), axis: "T", dir: "A", rev: false }
  ];
  function calcPhq9() {
    let total = 0;
    phq9Q.forEach((q) => {
      const r = phq9Responses[q.num];
      if (r) total += r;
    });
    let level = t("\uC548\uC815", "Minimal");
    let color = "green";
    if (total >= 20) {
      level = t("\uC804\uBB38 \uC9C0\uC6D0 \uD544\uC694", "Severe");
      color = "red";
    } else if (total >= 15) {
      level = t("\uC801\uADF9\uC801 \uC9C0\uC6D0 \uD544\uC694", "Moderately Severe");
      color = "orange";
    } else if (total >= 10) {
      level = t("\uC9C0\uC6D0 \uD544\uC694", "Moderate");
      color = "orange";
    } else if (total >= 5) {
      level = t("\uC8FC\uC758 \uD544\uC694", "Mild");
      color = "yellow";
    }
    return { total, level, color };
  }
  function calcGad7() {
    let total = 0;
    gad7Q.forEach((q) => {
      const r = gad7Responses[q.num];
      if (r) total += r;
    });
    let level = t("\uC548\uC815", "Minimal");
    let color = "green";
    if (total >= 15) {
      level = t("\uC804\uBB38 \uC9C0\uC6D0 \uD544\uC694", "Severe");
      color = "red";
    } else if (total >= 10) {
      level = t("\uC9C0\uC6D0 \uD544\uC694", "Moderate");
      color = "orange";
    } else if (total >= 5) {
      level = t("\uC8FC\uC758 \uD544\uC694", "Mild");
      color = "yellow";
    }
    return { total, level, color };
  }
  function calcDass21() {
    let depression = 0, anxiety = 0, stress = 0;
    dass21Q.forEach((q) => {
      const r = dass21Responses[q.num];
      if (r) {
        const score = r - 1;
        if (q.scale === "\uC6B0\uC6B8") depression += score;
        else if (q.scale === "\uBD88\uC548") anxiety += score;
        else if (q.scale === "\uC2A4\uD2B8\uB808\uC2A4") stress += score;
      }
    });
    depression *= 2;
    anxiety *= 2;
    stress *= 2;
    const getLevel = (score, type) => {
      const L = (ko, en) => t(ko, en);
      if (type === "\uC6B0\uC6B8") {
        if (score >= 28) return { level: L("\uC801\uADF9\uC801 \uC9C0\uC6D0 \uD544\uC694", "Extremely Severe"), color: "red" };
        if (score >= 21) return { level: L("\uC9C0\uC6D0 \uD544\uC694", "Severe"), color: "orange" };
        if (score >= 14) return { level: L("\uAD00\uB9AC \uD544\uC694", "Moderate"), color: "yellow" };
        if (score >= 10) return { level: L("\uC8FC\uC758", "Mild"), color: "blue" };
        return { level: L("\uC548\uC815", "Normal"), color: "green" };
      } else if (type === "\uBD88\uC548") {
        if (score >= 20) return { level: L("\uC801\uADF9\uC801 \uC9C0\uC6D0 \uD544\uC694", "Extremely Severe"), color: "red" };
        if (score >= 15) return { level: L("\uC9C0\uC6D0 \uD544\uC694", "Severe"), color: "orange" };
        if (score >= 10) return { level: L("\uAD00\uB9AC \uD544\uC694", "Moderate"), color: "yellow" };
        if (score >= 8) return { level: L("\uC8FC\uC758", "Mild"), color: "blue" };
        return { level: L("\uC548\uC815", "Normal"), color: "green" };
      } else {
        if (score >= 34) return { level: L("\uC801\uADF9\uC801 \uC9C0\uC6D0 \uD544\uC694", "Extremely Severe"), color: "red" };
        if (score >= 26) return { level: L("\uC9C0\uC6D0 \uD544\uC694", "Severe"), color: "orange" };
        if (score >= 19) return { level: L("\uAD00\uB9AC \uD544\uC694", "Moderate"), color: "yellow" };
        if (score >= 15) return { level: L("\uC8FC\uC758", "Mild"), color: "blue" };
        return { level: L("\uC548\uC815", "Normal"), color: "green" };
      }
    };
    return {
      depression: { score: depression, ...getLevel(depression, "\uC6B0\uC6B8") },
      anxiety: { score: anxiety, ...getLevel(anxiety, "\uBD88\uC548") },
      stress: { score: stress, ...getLevel(stress, "\uC2A4\uD2B8\uB808\uC2A4") }
    };
  }
  function calcBig5() {
    const factors = { "\uC678\uD5A5\uC131": 0, "\uCE5C\uD654\uC131": 0, "\uC131\uC2E4\uC131": 0, "\uC2E0\uACBD\uC131": 0, "\uAC1C\uBC29\uC131": 0 };
    const counts = { "\uC678\uD5A5\uC131": 0, "\uCE5C\uD654\uC131": 0, "\uC131\uC2E4\uC131": 0, "\uC2E0\uACBD\uC131": 0, "\uAC1C\uBC29\uC131": 0 };
    big5Q.forEach((q) => {
      const r = big5Responses[q.num];
      if (r) {
        const score = q.rev ? 6 - r : r;
        factors[q.factor] += score;
        counts[q.factor]++;
      }
    });
    Object.keys(factors).forEach((f) => {
      if (counts[f] > 0) {
        factors[f] = (factors[f] / counts[f]).toFixed(2);
      }
    });
    return factors;
  }
  function calcBurnout() {
    let total = 0;
    const domains = {};
    const domainConfigs = getBurnoutDomains();
    domainConfigs.forEach((d) => {
      domains[d.id] = { name: d.name, score: 0, max: d.max, color: d.color };
    });
    burnoutQ.forEach((q) => {
      const r = burnoutResponses[q.num];
      if (r !== void 0) {
        const score = q.rev ? 6 - r : r;
        total += score;
        domains[q.domain].score += score;
      }
    });
    const percentage = Math.round(total / 240 * 100);
    const pct = total / 240;
    let level = "\uB9E4\uC6B0 \uB0AE\uC74C";
    let levelColor = "#4ade80";
    let levelDesc = "\uBC88\uC544\uC6C3 \uC704\uD5D8\uC774 \uB0AE\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uC0C1\uD0DC\uB97C \uC798 \uC720\uC9C0\uD558\uC138\uC694.";
    if (pct >= 0.86) {
      level = "\uB9E4\uC6B0 \uB192\uC74C";
      levelColor = "#dc2626";
      levelDesc = "\uC18C\uC9C4 \uC2E0\uD638\uAC00 \uB9E4\uC6B0 \uB192\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uC26C\uC5B4\uAC00\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4. \uC804\uBB38\uAC00 \uC0C1\uB2F4\uC744 \uAD8C\uD569\uB2C8\uB2E4.";
    } else if (pct >= 0.71) {
      level = "\uB192\uC74C";
      levelColor = "#f97316";
      levelDesc = "\uB192\uC740 \uC218\uC900\uC758 \uBC88\uC544\uC6C3\uC785\uB2C8\uB2E4. \uC804\uBB38 \uC0C1\uB2F4\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.";
    } else if (pct >= 0.51) {
      level = "\uBCF4\uD1B5";
      levelColor = "#f59e0b";
      levelDesc = "\uBC88\uC544\uC6C3 \uC99D\uC0C1\uC774 \uBCF4\uD1B5 \uC218\uC900\uC785\uB2C8\uB2E4. \uAD00\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";
    } else if (pct >= 0.31) {
      level = "\uB0AE\uC74C";
      levelColor = "#eab308";
      levelDesc = "\uAC00\uBCBC\uC6B4 \uBC88\uC544\uC6C3 \uC99D\uC0C1\uC774 \uB098\uD0C0\uB098\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC8FC\uC758\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";
    }
    const domainList = [];
    const domainCrisis = [];
    Object.entries(domains).forEach(([id, d]) => {
      const domainPct = d.score / d.max * 100;
      d.percentage = Math.round(domainPct);
      d.id = id;
      if (domainPct >= 85) {
        d.level = "\uB9E4\uC6B0 \uB192\uC74C";
        d.description = "\uC774 \uC601\uC5ED\uC5D0\uC11C \uC2EC\uAC01\uD55C \uBC88\uC544\uC6C3 \uC99D\uC0C1\uC744 \uBCF4\uC774\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
        domainCrisis.push(d.name);
      } else if (domainPct >= 70) {
        d.level = "\uB192\uC74C";
        d.description = "\uC774 \uC601\uC5ED\uC5D0\uC11C \uB192\uC740 \uC218\uC900\uC758 \uC2A4\uD2B8\uB808\uC2A4\uB97C \uACBD\uD5D8\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
      } else if (domainPct >= 50) {
        d.level = "\uBCF4\uD1B5";
        d.description = "\uC774 \uC601\uC5ED\uC5D0\uC11C \uBCF4\uD1B5 \uC218\uC900\uC758 \uD53C\uB85C\uB97C \uB290\uB07C\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
      } else if (domainPct >= 30) {
        d.level = "\uB0AE\uC74C";
        d.description = "\uC774 \uC601\uC5ED\uC5D0\uC11C \uC57D\uAC04\uC758 \uC2A4\uD2B8\uB808\uC2A4\uAC00 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        d.level = "\uB9E4\uC6B0 \uB0AE\uC74C";
        d.description = "\uC774 \uC601\uC5ED\uC740 \uAC74\uAC15\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.";
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
  function calcSrci() {
    const filled = sdriCompletionQ.filter((q) => {
      var _a2;
      return (_a2 = srciResponses[q.num]) == null ? void 0 : _a2.trim();
    }).length;
    const byScale = {};
    sdriCompletionQ.forEach((q) => {
      var _a2;
      if (!byScale[q.scale]) byScale[q.scale] = [];
      if ((_a2 = srciResponses[q.num]) == null ? void 0 : _a2.trim()) byScale[q.scale].push({ prompt: q.prompt, answer: srciResponses[q.num] });
    });
    return { filled, total: sdriCompletionQ.length, byScale };
  }
  function calcSdri() {
    const scales = { "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": 0, "\uC815\uC11C\uBC18\uC751\uC131": 0, "\uC815\uC11C\uC801 \uB2E8\uC808": 0, "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": 0 };
    const counts = { "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": 0, "\uC815\uC11C\uBC18\uC751\uC131": 0, "\uC815\uC11C\uC801 \uB2E8\uC808": 0, "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": 0 };
    sdriLikertQ.forEach((q) => {
      const r = sdriResponses[q.num];
      if (r) {
        const s = q.rev ? 6 - r : r;
        scales[q.scale] += s;
        counts[q.scale]++;
      }
    });
    const total = Object.values(scales).reduce((a, b) => a + b, 0);
    return { scales, counts, total };
  }
  const LOST_TYPES = {
    ETPR: { icon: "\u{1F981}", name: t("\uC2E4\uD589 \uB9AC\uB354", "Action Leader"), eng: "Action Leader", desc: t("\uBE60\uB978 \uC2E4\uD589\uB825\uACFC \uAD00\uACC4 \uC911\uC2EC\uC73C\uB85C \uD300\uC744 \uC774\uB044\uB294 \uCE74\uB9AC\uC2A4\uB9C8\uD615 \uB9AC\uB354\uC785\uB2C8\uB2E4.", "A charismatic leader who drives results quickly while keeping relationships central."), traits: [t("\uCD94\uC9C4\uB825", "Drive"), t("\uC0AC\uAD50\uC131", "Sociability"), t("\uACB0\uB2E8\uB825", "Decisiveness"), t("\uD300\uC2ED", "Teamwork")], strength: [t("\uBE60\uB978 \uC758\uC0AC\uACB0\uC815\uACFC \uC2E4\uD589", "Fast decision-making and execution"), t("\uC0AC\uB78C\uB4E4\uC744 \uB3D9\uAE30\uBD80\uC5EC\uD558\uB294 \uB2A5\uB825", "Ability to motivate people"), t("\uBAA9\uD45C \uB2EC\uC131 \uC9D1\uC911\uB825", "Goal-focused concentration")], weakness: [t("\uAE09\uD558\uAC8C \uACB0\uB860 \uB0B4\uB9AC\uB294 \uACBD\uD5A5", "Tendency to rush to conclusions"), t("\uD0C0\uC778\uC758 \uC18D\uB3C4\uB97C \uAE30\uB2E4\uB9AC\uAE30 \uC5B4\uB824\uC6C0", "Difficulty waiting for others"), t("\uAC10\uC815\uBCF4\uB2E4 \uACB0\uACFC \uC6B0\uC120", "Results over feelings")], work: t("\uD300\uC744 \uBE60\uB974\uAC8C \uC6C0\uC9C1\uC774\uBA70 \uC131\uACFC\uB97C \uB9CC\uB4E4\uC5B4\uB0C5\uB2C8\uB2E4.", "Moves the team quickly to deliver results."), love: t("\uC801\uADF9\uC801\uC73C\uB85C \uD45C\uD604\uD558\uACE0 \uD30C\uD2B8\uB108\uB97C \uC774\uB04C\uB824\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.", "Expressive and tends to take the lead in relationships."), stress: t("\uC555\uBC15\uC744 \uBC1B\uC73C\uBA74 \uB354\uC6B1 \uAC15\uD558\uAC8C \uBC00\uC5B4\uBD99\uC774\uAC70\uB098 \uC9C0\uC2DC\uC801\uC774 \uB429\uB2C8\uB2E4.", "Under pressure, may push harder or become directive."), match: ["IFJR", "EFJR"], conflict: ["IFJC", "IFPC"] },
    ETPC: { icon: "\u{1F985}", name: t("\uAC1C\uCC99\uC790", "Pioneer"), eng: "Pioneer", desc: t("\uB17C\uB9AC\uC640 \uC18D\uB3C4\uB85C \uC0C8\uB85C\uC6B4 \uAE38\uC744 \uC5EC\uB294 \uB3C5\uB9BD\uC801\uC778 \uD601\uC2E0\uAC00\uC785\uB2C8\uB2E4.", "An independent innovator who opens new paths with logic and speed."), traits: [t("\uD601\uC2E0", "Innovation"), t("\uB3C5\uB9BD\uC131", "Independence"), t("\uC18D\uB3C4", "Speed"), t("\uB17C\uB9AC", "Logic")], strength: [t("\uC0C8\uB85C\uC6B4 \uBC29\uC2DD\uC73C\uB85C \uBB38\uC81C\uB97C \uD574\uACB0", "Solving problems in novel ways"), t("\uBE60\uB978 \uD310\uB2E8\uACFC \uC2E4\uD589", "Quick judgment and action"), t("\uC790\uAE30 \uB3D9\uAE30\uBD80\uC5EC", "Self-motivation")], weakness: [t("\uD300\uC6CC\uD06C\uBCF4\uB2E4 \uB2E8\uB3C5 \uD589\uB3D9 \uC120\uD638", "Prefers solo action over teamwork"), t("\uD0C0\uC778 \uAC10\uC815 \uACE0\uB824 \uBD80\uC871", "May overlook others' feelings"), t("\uADDC\uCE59\xB7\uC808\uCC28\uC5D0 \uB2F5\uB2F5\uD568 \uB290\uB08C", "Frustrated by rules and procedures")], work: t("\uD63C\uC790 \uBE60\uB974\uAC8C \uACB0\uACFC\uB97C \uB9CC\uB4E4\uC5B4\uB0B4\uB294 \uC5ED\uD560\uC5D0 \uAC15\uD569\uB2C8\uB2E4.", "Excels in roles where independent, fast results are needed."), love: t("\uC790\uC720\uB97C \uC911\uC2DC\uD558\uBA70 \uC11C\uB85C \uB3C5\uB9BD\uC801\uC778 \uAD00\uACC4\uB97C \uC120\uD638\uD569\uB2C8\uB2E4.", "Values freedom and prefers mutually independent relationships."), stress: t("\uC555\uBC15 \uC2DC \uD63C\uC790 \uD574\uACB0\uD558\uB824 \uD558\uAC70\uB098 \uC0C1\uD669\uC744 \uD68C\uD53C\uD569\uB2C8\uB2E4.", "Under stress, tends to handle things alone or avoid situations."), match: ["IFJC", "ETJR"], conflict: ["IFJR", "EFPR"] },
    ETJR: { icon: "\u{1F98A}", name: t("\uC804\uB7B5 \uC870\uC728\uAC00", "Strategic Coordinator"), eng: "Strategic Coordinator", desc: t("\uC0AC\uB78C\uACFC \uC2DC\uC2A4\uD15C\uC744 \uC5F0\uACB0\uD558\uC5EC \uCCB4\uACC4\uC801\uC73C\uB85C \uBAA9\uD45C\uB97C \uB2EC\uC131\uD558\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "Achieves goals systematically by connecting people and systems."), traits: [t("\uC804\uB7B5\uC801", "Strategic"), t("\uCCB4\uACC4\uC801", "Systematic"), t("\uC0AC\uAD50\uC801", "Sociable"), t("\uC2E0\uC911\uD568", "Careful")], strength: [t("\uC7A5\uAE30 \uACC4\uD68D \uC218\uB9BD\uACFC \uC2E4\uD589", "Long-term planning and execution"), t("\uD300 \uD569\uC758 \uD615\uC131", "Building team consensus"), t("\uAD6C\uC870\uD654\uB41C \uC18C\uD1B5", "Structured communication")], weakness: [t("\uC720\uC5F0\uC131\uC774 \uBD80\uC871\uD560 \uC218 \uC788\uC74C", "May lack flexibility"), t("\uBCC0\uD654\uC5D0 \uB290\uB9AC\uAC8C \uC801\uC751", "Slow to adapt to change"), t("\uACFC\uB3C4\uD55C \uACC4\uD68D\uC73C\uB85C \uC2E4\uD589 \uC9C0\uC5F0", "Over-planning can delay action")], work: t("\uBA85\uD655\uD55C \uBAA9\uD45C \uC544\uB798 \uD300\uC744 \uC870\uC728\uD558\uBA70 \uCCB4\uACC4\uB97C \uB9CC\uB4E4\uC5B4\uAC11\uB2C8\uB2E4.", "Coordinates teams under clear goals to build effective systems."), love: t("\uC548\uC815\uC801\uC774\uACE0 \uACC4\uD68D\uC801\uC778 \uAD00\uACC4\uB97C \uC9C0\uD5A5\uD569\uB2C8\uB2E4.", "Seeks stable, planned relationships."), stress: t("\uACC4\uD68D\uC774 \uC5B4\uAE0B\uB0A0 \uB54C \uD1B5\uC81C\uB97C \uAC15\uD654\uD558\uB824\uB294 \uACBD\uD5A5\uC774 \uC788\uC2B5\uB2C8\uB2E4.", "When plans go awry, tends to tighten control."), match: ["IFPR", "EFPR"], conflict: ["ETPC", "IFPC"] },
    ETJC: { icon: "\u{1F3D7}\uFE0F", name: t("\uC2DC\uC2A4\uD15C \uAD6C\uCD95\uC790", "System Builder"), eng: "System Builder", desc: t("\uD6A8\uC728\uC801\uC778 \uAD6C\uC870\uC640 \uC2DC\uC2A4\uD15C\uC744 \uC124\uACC4\uD558\uB294 \uB17C\uB9AC\uC801\uC778 \uC678\uD5A5\uAC00\uC785\uB2C8\uB2E4.", "A logical extrovert who designs efficient structures and systems."), traits: [t("\uCCB4\uACC4\uC131", "Structure"), t("\uB17C\uB9AC", "Logic"), t("\uC678\uD5A5\uC131", "Extroversion"), t("\uB3C5\uB9BD\uC131", "Independence")], strength: [t("\uBCF5\uC7A1\uD55C \uC2DC\uC2A4\uD15C \uC124\uACC4", "Designing complex systems"), t("\uD6A8\uC728\uC131 \uCD5C\uC801\uD654", "Optimizing efficiency"), t("\uC678\uBD80 \uBC1C\uD45C\uC640 \uC18C\uD1B5", "Presenting and communicating")], weakness: [t("\uAC10\uC815\uC801 \uC694\uC18C \uAC04\uACFC", "Overlooking emotional factors"), t("\uC9C0\uB098\uCE5C \uC644\uBCBD\uC8FC\uC758", "Excessive perfectionism"), t("\uD611\uC5C5\uBCF4\uB2E4 \uC9C0\uC2DC \uC120\uD638", "Prefers directing over collaborating")], work: t("\uBA85\uD655\uD55C \uC5ED\uD560\uACFC \uD504\uB85C\uC138\uC2A4\uB97C \uB9CC\uB4E4\uC5B4 \uD300\uC744 \uC774\uB055\uB2C8\uB2E4.", "Leads teams by creating clear roles and processes."), love: t("\uAC10\uC815\uBCF4\uB2E4 \uC2E4\uC6A9\uC801\uC778 \uAD00\uC810\uC5D0\uC11C \uAD00\uACC4\uB97C \uBC14\uB77C\uBD05\uB2C8\uB2E4.", "Views relationships from a practical rather than emotional lens."), stress: t("\uBB38\uC81C\uB97C \uC2DC\uC2A4\uD15C \uC624\uB958\uB85C \uC778\uC2DD\uD558\uACE0 \uC7AC\uC124\uACC4\uD558\uB824 \uD569\uB2C8\uB2E4.", "Sees problems as system errors and tries to redesign."), match: ["IFPC", "ITPR"], conflict: ["EFPR", "IFJR"] },
    EFPR: { icon: "\u{1F31F}", name: t("\uAD00\uACC4 \uD65C\uB825\uAC00", "Social Energizer"), eng: "Social Energizer", desc: t("\uC5D0\uB108\uC9C0\uC640 \uAC10\uC131\uC73C\uB85C \uC8FC\uBCC0\uC744 \uBC1D\uD788\uB294 \uC678\uD5A5\uC801 \uAD00\uACC4 \uC911\uC2EC \uC720\uD615\uC785\uB2C8\uB2E4.", "An extroverted, relationship-centered type who brightens surroundings with energy and warmth."), traits: [t("\uC5D0\uB108\uC9C0", "Energy"), t("\uACF5\uAC10", "Empathy"), t("\uC0AC\uAD50\uC131", "Sociability"), t("\uC790\uBC1C\uC131", "Spontaneity")], strength: [t("\uBD84\uC704\uAE30\uB97C \uBC1D\uAC8C \uB9CC\uB4DC\uB294 \uB2A5\uB825", "Ability to brighten the atmosphere"), t("\uBE60\uB978 \uACF5\uAC10\uACFC \uC9C0\uC9C0", "Quick empathy and support"), t("\uB124\uD2B8\uC6CC\uD06C \uD615\uC131", "Network building")], weakness: [t("\uAE4A\uC740 \uC9D1\uC911\uC774 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC74C", "May struggle with deep focus"), t("\uAC10\uC815\uC801 \uCDA9\uB3D9\uC73C\uB85C \uC2E4\uC218", "Impulsive emotional mistakes"), t("\uBE44\uD310\uC5D0 \uBBFC\uAC10", "Sensitive to criticism")], work: t("\uD300 \uBD84\uC704\uAE30\uB97C \uC0B4\uB9AC\uACE0 \uC0AC\uB78C\uB4E4\uC744 \uC5F0\uACB0\uD558\uB294 \uC5ED\uD560\uC774 \uB9DE\uC2B5\uB2C8\uB2E4.", "Thrives in roles that energize team morale and connect people."), love: t("\uC801\uADF9\uC801\uC73C\uB85C \uAC10\uC815\uC744 \uD45C\uD604\uD558\uACE0 \uD568\uAED8\uD558\uB294 \uC2DC\uAC04\uC744 \uC18C\uC911\uD788 \uD569\uB2C8\uB2E4.", "Expresses feelings actively and values time together."), stress: t("\uC2A4\uD2B8\uB808\uC2A4\uB97C \uC0AC\uB78C\uB4E4\uACFC \uC774\uC57C\uAE30\uD558\uBA70 \uD574\uC18C\uD558\uB824 \uD569\uB2C8\uB2E4.", "Relieves stress by talking things out with others."), match: ["ITJR", "ETJR"], conflict: ["ITJC", "ETJC"] },
    EFPC: { icon: "\u{1F3A8}", name: t("\uCC3D\uC758 \uD45C\uD604\uAC00", "Creative Expresser"), eng: "Creative Expresser", desc: t("\uC790\uC720\uB85C\uC6B4 \uAC10\uC131\uACFC \uCC3D\uC758\uC131\uC73C\uB85C \uB3C5\uC790\uC801\uC778 \uC138\uACC4\uB97C \uB9CC\uB4E4\uC5B4\uAC00\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "Creates an independent world through free-spirited emotion and creativity."), traits: [t("\uCC3D\uC758\uC131", "Creativity"), t("\uC790\uC720", "Freedom"), t("\uAC10\uC131", "Sensitivity"), t("\uC989\uD765\uC131", "Improvisation")], strength: [t("\uB3C5\uCC3D\uC801\uC778 \uC544\uC774\uB514\uC5B4 \uC0DD\uC131", "Generating original ideas"), t("\uC608\uC220\uC801\xB7\uAC10\uC131\uC801 \uD45C\uD604", "Artistic and emotional expression"), t("\uC720\uC5F0\uD55C \uC801\uC751\uB825", "Flexible adaptability")], weakness: [t("\uC7A5\uAE30 \uACC4\uD68D\uC774 \uC57D\uD568", "Weak at long-term planning"), t("\uB9C8\uAC10\xB7\uADDC\uCE59 \uC900\uC218 \uC5B4\uB824\uC6C0", "Difficulty meeting deadlines and rules"), t("\uC77C\uAD00\uC131 \uC720\uC9C0 \uD798\uB4E6", "Hard to maintain consistency")], work: t("\uCC3D\uC758\uC801 \uC790\uC720\uAC00 \uC8FC\uC5B4\uC9C4 \uD658\uACBD\uC5D0\uC11C \uCD5C\uACE0 \uC131\uACFC\uB97C \uB0C5\uB2C8\uB2E4.", "Performs best in environments that allow creative freedom."), love: t("\uD30C\uD2B8\uB108\uC5D0\uAC8C \uCC3D\uC758\uC801\uC774\uACE0 \uAC10\uC131\uC801\uC778 \uBC29\uC2DD\uC73C\uB85C \uC0AC\uB791\uC744 \uD45C\uD604\uD569\uB2C8\uB2E4.", "Expresses love in creative and emotional ways."), stress: t("\uC555\uBC15 \uC2DC \uC608\uC220\uC801 \uD65C\uB3D9\uC774\uB098 \uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04\uC73C\uB85C \uD68C\uBCF5\uD569\uB2C8\uB2E4.", "Recovers through artistic activities or alone time."), match: ["ITJC", "ETJC"], conflict: ["ITJR", "ETJR"] },
    EFJR: { icon: "\u{1F33F}", name: t("\uD611\uB825 \uCD94\uC9C4\uC790", "Collaborative Driver"), eng: "Collaborative Driver", desc: t("\uB530\uB73B\uD55C \uB9C8\uC74C\uC73C\uB85C \uD300\uC744 \uC774\uB04C\uACE0 \uD611\uB825\uC744 \uD1B5\uD574 \uBAA9\uD45C\uB97C \uC774\uB8E8\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "A warm-hearted type who leads teams and achieves goals through collaboration."), traits: [t("\uD611\uB825", "Collaboration"), t("\uB530\uB73B\uD568", "Warmth"), t("\uCD94\uC9C4\uB825", "Drive"), t("\uC2E0\uB8B0", "Trust")], strength: [t("\uD300 \uD654\uD569\uACFC \uB3D9\uAE30\uBD80\uC5EC", "Team harmony and motivation"), t("\uACF5\uAC10 \uAE30\uBC18 \uB9AC\uB354\uC2ED", "Empathy-based leadership"), t("\uACC4\uD68D\uC801 \uD611\uC5C5", "Planned collaboration")], weakness: [t("\uAC08\uB4F1 \uD68C\uD53C \uACBD\uD5A5", "Tendency to avoid conflict"), t("\uD0C0\uC778 \uAC10\uC815\uC5D0 \uC9C0\uB098\uCE58\uAC8C \uC601\uD5A5\uBC1B\uC74C", "Overly influenced by others' emotions"), t("\uC790\uAE30 \uC695\uAD6C \uB4A4\uB85C \uBBF8\uB8F8", "Puts own needs last")], work: t("\uAD6C\uC131\uC6D0\uC758 \uAC15\uC810\uC744 \uC774\uB04C\uC5B4\uB0B4\uB294 \uD611\uB825\uC801 \uB9AC\uB354\uC785\uB2C8\uB2E4.", "A collaborative leader who draws out each member's strengths."), love: t("\uD5CC\uC2E0\uC801\uC774\uACE0 \uB530\uB73B\uD55C \uD30C\uD2B8\uB108\uB85C \uAD00\uACC4\uC5D0 \uC5D0\uB108\uC9C0\uB97C \uC3DF\uC2B5\uB2C8\uB2E4.", "Dedicated and warm, pours energy into the relationship."), stress: t("\uB0B4\uBA74 \uAC08\uB4F1\uC744 \uC228\uAE30\uB2E4\uAC00 \uAC10\uC815\uC774 \uD3ED\uBC1C\uD558\uB294 \uD328\uD134\uC774 \uC788\uC2B5\uB2C8\uB2E4.", "May suppress inner conflict until emotions overflow."), match: ["ETPR", "ITJR"], conflict: ["ITJC", "ETPC"] },
    EFJC: { icon: "\u{1F54A}\uFE0F", name: t("\uC18C\uD1B5 \uC804\uB7B5\uAC00", "Communication Strategist"), eng: "Communication Strategist", desc: t("\uAC10\uC131\uACFC \uC804\uB7B5\uC744 \uACB0\uD569\uD558\uC5EC \uB2E4\uB9AC \uC5ED\uD560\uC744 \uD558\uB294 \uC870\uC728\uC0AC\uC785\uB2C8\uB2E4.", "A mediator who bridges people by combining empathy with strategy."), traits: [t("\uC18C\uD1B5", "Communication"), t("\uACF5\uAC10", "Empathy"), t("\uACC4\uD68D", "Planning"), t("\uB3C5\uB9BD\uC131", "Independence")], strength: [t("\uB300\uD654\uC640 \uD611\uC0C1 \uB2A5\uB825", "Dialogue and negotiation skills"), t("\uAC10\uC131\uC801 \uC774\uD574\uC640 \uC804\uB7B5\uC801 \uC0AC\uACE0", "Emotional intelligence with strategic thinking"), t("\uC911\uC7AC \uC5ED\uD560", "Mediating role")], weakness: [t("\uC6B0\uC720\uBD80\uB2E8\uD560 \uC218 \uC788\uC74C", "May be indecisive"), t("\uAE4A\uC740 \uAC10\uC815\uC744 \uD45C\uD604\uD558\uAE30 \uC5B4\uB824\uC6C0", "Difficulty expressing deep emotions"), t("\uD63C\uC790 \uACB0\uC815 \uB0B4\uB9AC\uAE30 \uD798\uB4E6", "Hard to decide alone")], work: t("\uC870\uC9C1 \uB0B4 \uC18C\uD1B5 \uD5C8\uBE0C\uB85C\uC11C \uAC08\uB4F1 \uC870\uC728\uC5D0 \uD0C1\uC6D4\uD569\uB2C8\uB2E4.", "Excels as a communication hub and conflict mediator in organizations."), love: t("\uD30C\uD2B8\uB108\uC758 \uB9D0\uC744 \uC798 \uB4E3\uACE0 \uAC10\uC131\uC801\uC73C\uB85C \uC9C0\uC9C0\uD569\uB2C8\uB2E4.", "Listens well and provides emotional support to partners."), stress: t("\uC2A4\uD2B8\uB808\uC2A4 \uC2DC \uB300\uD654\uB97C \uD1B5\uD574 \uBB38\uC81C\uB97C \uD480\uC5B4\uAC00\uB824 \uD569\uB2C8\uB2E4.", "Tries to resolve stress through dialogue."), match: ["ETPC", "ITJR"], conflict: ["ITPR", "ETPR"] },
    ITPR: { icon: "\u{1F989}", name: t("\uBD84\uC11D \uC9C0\uC6D0\uAC00", "Analytical Supporter"), eng: "Analytical Supporter", desc: t("\uB0C9\uCCA0\uD55C \uBD84\uC11D\uACFC \uBE60\uB978 \uD310\uB2E8\uC73C\uB85C \uD300\uC744 \uB4A4\uC5D0\uC11C \uC9C0\uC6D0\uD558\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "Supports the team from behind with sharp analysis and quick judgment."), traits: [t("\uBD84\uC11D\uB825", "Analysis"), t("\uC2E0\uC18D\uD568", "Speed"), t("\uC9C0\uC6D0", "Support"), t("\uB0B4\uD5A5\uC131", "Introversion")], strength: [t("\uBE60\uB978 \uB370\uC774\uD130 \uBD84\uC11D", "Quick data analysis"), t("\uC870\uC6A9\uD558\uC9C0\uB9CC \uD6A8\uC728\uC801\uC778 \uC2E4\uD589", "Quiet but efficient execution"), t("\uC0C1\uD669 \uD310\uB2E8\uB825", "Situational judgment")], weakness: [t("\uD63C\uC790 \uC77C\uD558\uB294 \uAC83 \uC120\uD638\uB85C \uD611\uC5C5 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC74C", "May find collaboration difficult, preferring solo work"), t("\uAC10\uC815 \uD45C\uD604 \uBD80\uC871", "Lacks emotional expression"), t("\uACFC\uBD80\uD558 \uC2DC \uBC88\uC544\uC6C3", "Burnout risk when overloaded")], work: t("\uBD84\uC11D\uC774 \uD544\uC694\uD55C \uC5C5\uBB34\uC5D0\uC11C \uC870\uC6A9\uD558\uACE0 \uBE60\uB974\uAC8C \uC131\uACFC\uB97C \uB0C5\uB2C8\uB2E4.", "Quietly and quickly delivers results in analysis-heavy work."), love: t("\uB9D0\uBCF4\uB2E4 \uD589\uB3D9\uC73C\uB85C \uC0AC\uB791\uC744 \uD45C\uD604\uD558\uB294 \uD3B8\uC785\uB2C8\uB2E4.", "Tends to express love through actions rather than words."), stress: t("\uD63C\uC790 \uBD84\uC11D\uD558\uACE0 \uD574\uACB0\uCC45\uC744 \uCC3E\uC73C\uBA70 \uD68C\uBCF5\uD569\uB2C8\uB2E4.", "Recovers by analyzing problems and finding solutions alone."), match: ["ETJC", "EFJR"], conflict: ["EFPR", "IFPC"] },
    ITPC: { icon: "\u26A1", name: t("\uB3C5\uC790 \uD601\uC2E0\uAC00", "Independent Innovator"), eng: "Independent Innovator", desc: t("\uD63C\uC790 \uBE60\uB974\uAC8C \uC0C8\uB85C\uC6B4 \uD574\uBC95\uC744 \uB9CC\uB4E4\uC5B4\uB0B4\uB294 \uB3C5\uB9BD\uC801 \uD601\uC2E0 \uC720\uD615\uC785\uB2C8\uB2E4.", "An independent innovator who quickly creates new solutions on their own."), traits: [t("\uD601\uC2E0", "Innovation"), t("\uB3C5\uB9BD\uC131", "Independence"), t("\uBD84\uC11D", "Analysis"), t("\uC18D\uB3C4", "Speed")], strength: [t("\uB3C5\uCC3D\uC801 \uBB38\uC81C \uD574\uACB0", "Original problem-solving"), t("\uBE60\uB978 \uB3C5\uB9BD\uC801 \uC2E4\uD589", "Fast independent execution"), t("\uAE30\uC220\uC801 \uC219\uB828\uB3C4", "Technical proficiency")], weakness: [t("\uD611\uB825\uBCF4\uB2E4 \uB2E8\uB3C5 \uD589\uB3D9 \uC120\uD638", "Prefers solo action over collaboration"), t("\uD0C0\uC778 \uAD00\uC810 \uC218\uC6A9 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC74C", "May struggle to accept others' viewpoints"), t("\uACB0\uACFC \uC911\uC2EC\uC73C\uB85C \uACFC\uC815 \uBB34\uC2DC", "Results-focused, may ignore process")], work: t("\uAE30\uC220\uC801 \uB3C4\uC804\uC774 \uC788\uB294 \uB3C5\uB9BD\uC801 \uC5C5\uBB34\uC5D0\uC11C \uBE5B\uC744 \uBC1C\uD569\uB2C8\uB2E4.", "Shines in independent work with technical challenges."), love: t("\uD30C\uD2B8\uB108\uC5D0\uAC8C \uC9C0\uC801 \uC790\uADF9\uC744 \uC8FC\uACE0\uBC1B\uB294 \uAD00\uACC4\uB97C \uC120\uD638\uD569\uB2C8\uB2E4.", "Prefers relationships that offer mutual intellectual stimulation."), stress: t("\uD63C\uC790\uB9CC\uC758 \uACF5\uAC04\uC744 \uCC3E\uC544 \uBD84\uC11D\xB7\uD574\uACB0\uC5D0 \uC9D1\uC911\uD569\uB2C8\uB2E4.", "Seeks solitude to focus on analyzing and solving the problem."), match: ["ETJR", "EFJR"], conflict: ["EFPC", "IFJR"] },
    ITJR: { icon: "\u{1F3D4}\uFE0F", name: t("\uC815\uBC00 \uACC4\uD68D\uAC00", "Precision Planner"), eng: "Precision Planner", desc: t("\uCCB4\uACC4\uC801\uC778 \uACC4\uD68D\uACFC \uAD00\uACC4 \uC9C0\uD5A5\uC73C\uB85C \uC548\uC815\uC801\uC778 \uC131\uACFC\uB97C \uB0B4\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "Delivers stable results with systematic planning and a relationship-oriented approach."), traits: [t("\uC815\uBC00\uC131", "Precision"), t("\uACC4\uD68D\uC131", "Planning"), t("\uC2E0\uB8B0\uC131", "Reliability"), t("\uAD00\uACC4\uC9C0\uD5A5", "Relationship-oriented")], strength: [t("\uBE48\uD2C8\uC5C6\uB294 \uACC4\uD68D \uC218\uB9BD", "Thorough planning"), t("\uC2E0\uB8B0\uD560 \uC218 \uC788\uB294 \uC2E4\uD589", "Reliable execution"), t("\uC7A5\uAE30\uC801 \uAD00\uACC4 \uC720\uC9C0", "Maintaining long-term relationships")], weakness: [t("\uBCC0\uD654\uC5D0 \uB290\uB9AC\uAC8C \uBC18\uC751", "Slow to respond to change"), t("\uC0C8\uB85C\uC6B4 \uC2DC\uB3C4\uC5D0 \uBCF4\uC218\uC801", "Conservative about new attempts"), t("\uACFC\uB3C4\uD55C \uC644\uBCBD\uC8FC\uC758", "Excessive perfectionism")], work: t("\uC7A5\uAE30 \uD504\uB85C\uC81D\uD2B8\uB97C \uAF3C\uAF3C\uD558\uAC8C \uAD00\uB9AC\uD558\uB294 \uC5ED\uD560\uC5D0 \uB6F0\uC5B4\uB0A9\uB2C8\uB2E4.", "Excels at carefully managing long-term projects."), love: t("\uAE4A\uACE0 \uC548\uC815\uC801\uC778 \uAD00\uACC4\uB97C \uC120\uD638\uD558\uBA70 \uC2E0\uB8B0\uB97C \uC313\uC544\uAC11\uB2C8\uB2E4.", "Prefers deep, stable relationships built on trust."), stress: t("\uACC4\uD68D\uC774 \uD754\uB4E4\uB9B4 \uB54C \uB354 \uB9CE\uC774 \uC900\uBE44\uD558\uACE0 \uD655\uC778\uD569\uB2C8\uB2E4.", "When plans waver, prepares and verifies more intensively."), match: ["EFPR", "EFJR"], conflict: ["EFPC", "ETPC"] },
    ITJC: { icon: "\u{1F52C}", name: t("\uC644\uBCBD \uD0D0\uAD6C\uC790", "Perfectionist Explorer"), eng: "Perfectionist Explorer", desc: t("\uAE4A\uC774 \uC788\uB294 \uBD84\uC11D\uACFC \uC644\uBCBD\uD568 \uCD94\uAD6C\uB85C \uC804\uBB38\uC131\uC744 \uC313\uB294 \uB3C5\uB9BD\uC801 \uB0B4\uD5A5\uD615\uC785\uB2C8\uB2E4.", "An independent introvert who builds expertise through deep analysis and pursuit of perfection."), traits: [t("\uC644\uBCBD\uC8FC\uC758", "Perfectionism"), t("\uD0D0\uAD6C\uC2EC", "Curiosity"), t("\uB3C5\uB9BD\uC131", "Independence"), t("\uC9D1\uC911\uB825", "Focus")], strength: [t("\uAE4A\uC740 \uC804\uBB38 \uC9C0\uC2DD", "Deep specialized knowledge"), t("\uAF3C\uAF3C\uD55C \uC624\uB958 \uAC80\uD1A0", "Thorough error checking"), t("\uB3C5\uB9BD\uC801 \uC5F0\uAD6C \uB2A5\uB825", "Independent research ability")], weakness: [t("\uC644\uBCBD\uC8FC\uC758\uB85C \uACB0\uC815 \uC9C0\uC5F0", "Perfectionism causes decision delays"), t("\uB300\uC778 \uAD00\uACC4\uAC00 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC74C", "May find interpersonal relationships difficult"), t("\uD53C\uB4DC\uBC31 \uC218\uC6A9\uC774 \uC5B4\uB824\uC6B8 \uB54C \uC788\uC74C", "Sometimes struggles to accept feedback")], work: t("\uC804\uBB38\uC131\uC774 \uC694\uAD6C\uB418\uB294 \uAE4A\uC740 \uC5F0\uAD6C\xB7\uBD84\uC11D \uC5C5\uBB34\uC5D0 \uAC15\uD569\uB2C8\uB2E4.", "Strong in deep research and analysis requiring expertise."), love: t("\uC18C\uC218\uC640 \uAE4A\uACE0 \uC758\uBBF8\uC788\uB294 \uAD00\uACC4\uB97C \uC9C0\uD5A5\uD569\uB2C8\uB2E4.", "Seeks deep, meaningful relationships with a few people."), stress: t("\uB354 \uB9CE\uC774 \uD30C\uACE0\uB4E4\uBA70 \uC644\uBCBD\uD55C \uD574\uB2F5\uC744 \uCC3E\uC73C\uB824 \uD569\uB2C8\uB2E4.", "Digs deeper, seeking a perfect answer."), match: ["EFPC", "ETJC"], conflict: ["EFPR", "ETPR"] },
    IFPR: { icon: "\u{1F338}", name: t("\uACF5\uAC10 \uC2E4\uD589\uAC00", "Empathetic Doer"), eng: "Empathetic Doer", desc: t("\uB530\uB73B\uD55C \uB9C8\uC74C\uC73C\uB85C \uBE60\uB974\uAC8C \uC0AC\uB78C\uC744 \uB3D5\uB294 \uB0B4\uD5A5\uC801 \uAD00\uACC4 \uC9C0\uD5A5 \uC720\uD615\uC785\uB2C8\uB2E4.", "An introverted, relationship-oriented type who warmly and quickly helps others."), traits: [t("\uACF5\uAC10", "Empathy"), t("\uC790\uBC1C\uC131", "Spontaneity"), t("\uB3CC\uBD04", "Care"), t("\uBBFC\uAC10\uC131", "Sensitivity")], strength: [t("\uD0C0\uC778 \uAC10\uC815\uC5D0 \uBE60\uB974\uAC8C \uBC18\uC751", "Quick response to others' emotions"), t("\uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC9C0\uC9C0\uC640 \uB3CC\uBD04", "Natural support and care"), t("\uC9C4\uC2E4\uB41C \uACF5\uAC10 \uB2A5\uB825", "Genuine empathy")], weakness: [t("\uC790\uAE30 \uACBD\uACC4 \uC124\uC815\uC774 \uC5B4\uB824\uC6C0", "Difficulty setting personal boundaries"), t("\uD0C0\uC778 \uAC10\uC815\uC5D0 \uC9C0\uB098\uCE58\uAC8C \uC601\uD5A5\uBC1B\uC74C", "Overly affected by others' emotions"), t("\uBC88\uC544\uC6C3 \uC704\uD5D8", "Burnout risk")], work: t("\uC0AC\uB78C\uC744 \uB3CC\uBCF4\uB294 \uC0C1\uB2F4\xB7\uAD50\uC721\xB7\uC11C\uBE44\uC2A4 \uBD84\uC57C\uC5D0 \uD0C1\uC6D4\uD569\uB2C8\uB2E4.", "Excels in counseling, education, and service roles."), love: t("\uD30C\uD2B8\uB108\uC758 \uAC10\uC815 \uBCC0\uD654\uC5D0 \uC12C\uC138\uD558\uAC8C \uBC18\uC751\uD558\uBA70 \uD5CC\uC2E0\uD569\uB2C8\uB2E4.", "Responds sensitively to partner's emotional changes, with dedication."), stress: t("\uD0C0\uC778 \uAC71\uC815\uC73C\uB85C \uC790\uC2E0\uC744 \uC78A\uACE0 \uC18C\uC9C4\uB418\uB294 \uD328\uD134\uC774 \uC788\uC2B5\uB2C8\uB2E4.", "Pattern of neglecting self while worrying about others, leading to exhaustion."), match: ["ETJR", "EFJR"], conflict: ["ETPC", "ITPC"] },
    IFPC: { icon: "\u{1F98B}", name: t("\uC790\uC720 \uD0D0\uC0C9\uC790", "Free Explorer"), eng: "Free Explorer", desc: t("\uAC10\uC131\uACFC \uC790\uC720\uB97C \uB530\uB974\uBA70 \uC790\uC2E0\uB9CC\uC758 \uAE38\uC744 \uD0D0\uC0C9\uD558\uB294 \uB0B4\uD5A5\uC801 \uC720\uD615\uC785\uB2C8\uB2E4.", "An introverted type who follows emotion and freedom to explore their own path."), traits: [t("\uC790\uC720", "Freedom"), t("\uAC10\uC131", "Sensitivity"), t("\uD0D0\uC0C9", "Exploration"), t("\uC790\uBC1C\uC131", "Spontaneity")], strength: [t("\uAE4A\uC740 \uAC10\uC218\uC131\uACFC \uC608\uC220\uC801 \uAC10\uAC01", "Deep sensibility and artistic sense"), t("\uC720\uC5F0\uD55C \uC801\uC751", "Flexible adaptation"), t("\uC790\uAE30\uB9CC\uC758 \uB3C5\uCC3D\uC801 \uAD00\uC810", "Unique personal perspective")], weakness: [t("\uACB0\uC815 \uBBF8\uB8E8\uB294 \uACBD\uD5A5", "Tendency to postpone decisions"), t("\uC7A5\uAE30 \uACC4\uD68D \uC5B4\uB824\uC6C0", "Difficulty with long-term plans"), t("\uC678\uBD80 \uAE30\uB300\uC5D0 \uBD80\uB2F4\uAC10", "Burdened by external expectations")], work: t("\uCC3D\uC758\uC801 \uC790\uC728\uC131\uC774 \uBCF4\uC7A5\uB41C \uD658\uACBD\uC5D0\uC11C \uAF43\uC744 \uD53C\uC6C1\uB2C8\uB2E4.", "Flourishes in environments that guarantee creative autonomy."), love: t("\uAE4A\uC740 \uAC10\uC131\uC801 \uC5F0\uACB0\uC744 \uC6D0\uD558\uC9C0\uB9CC \uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04\uB3C4 \uD544\uC694\uD569\uB2C8\uB2E4.", "Wants deep emotional connection but also needs personal time."), stress: t("\uC790\uC2E0\uB9CC\uC758 \uACF5\uAC04\uC73C\uB85C \uBB3C\uB7EC\uB098 \uAC10\uC815\uC744 \uC815\uB9AC\uD569\uB2C8\uB2E4.", "Retreats to personal space to process emotions."), match: ["ETJC", "EFJC"], conflict: ["ETJR", "ITJR"] },
    IFJR: { icon: "\u{1F319}", name: t("\uC2E0\uC911 \uC9C0\uC9C0\uC790", "Mindful Supporter"), eng: "Mindful Supporter", desc: t("\uC870\uC6A9\uD558\uC9C0\uB9CC \uAE4A\uC774 \uC788\uAC8C \uD0C0\uC778\uC744 \uC9C0\uC9C0\uD558\uB294 \uC2E0\uB8B0\uC758 \uB0B4\uD5A5\uD615\uC785\uB2C8\uB2E4.", "A trustworthy introvert who quietly but deeply supports others."), traits: [t("\uC2E0\uC911\uD568", "Mindfulness"), t("\uC9C0\uC9C0", "Support"), t("\uC2E0\uB8B0", "Trust"), t("\uACF5\uAC10", "Empathy")], strength: [t("\uAE4A\uC740 \uC2E0\uB8B0 \uAD00\uACC4 \uD615\uC131", "Building deep trust relationships"), t("\uC870\uC6A9\uD55C \uD5CC\uC2E0\uACFC \uC9C0\uC18D\uC131", "Quiet dedication and consistency"), t("\uD0C0\uC778\uC758 \uD544\uC694\uB97C \uC798 \uD30C\uC545", "Reading others' needs well")], weakness: [t("\uC790\uAE30 \uAC10\uC815 \uD45C\uD604\uC774 \uC11C\uD23C", "Clumsy at expressing own emotions"), t("\uAC08\uB4F1 \uD68C\uD53C\uB85C \uBD88\uB9CC \uCD95\uC801", "Conflict avoidance leads to pent-up dissatisfaction"), t("\uACFC\uB3C4\uD55C \uC790\uAE30 \uD76C\uC0DD", "Excessive self-sacrifice")], work: t("\uC2E0\uB8B0 \uAE30\uBC18\uC758 \uC9C0\uC6D0\xB7\uC870\uB825 \uC5ED\uD560\uC5D0\uC11C \uAE4A\uC740 \uAC00\uCE58\uB97C \uBC1C\uD718\uD569\uB2C8\uB2E4.", "Brings deep value in trust-based support and helper roles."), love: t("\uB9D0\uBCF4\uB2E4 \uD589\uB3D9\uC73C\uB85C \uC0AC\uB791\uC744 \uBCF4\uC5EC\uC8FC\uB294 \uC870\uC6A9\uD55C \uD5CC\uC2E0\uC790\uC785\uB2C8\uB2E4.", "A quiet devotee who shows love through actions rather than words."), stress: t("\uD63C\uC790 \uAC10\uB0B4\uD558\uB2E4\uAC00 \uB3CC\uC5F0 \uAC10\uC815\uC801\uC73C\uB85C \uBB34\uB108\uC9C0\uB294 \uD328\uD134\uC774 \uC788\uC2B5\uB2C8\uB2E4.", "Pattern of enduring alone until suddenly emotionally overwhelmed."), match: ["ETPR", "EFPR"], conflict: ["ETPC", "ITPC"] },
    IFJC: { icon: "\u{1F30C}", name: t("\uC131\uCC30 \uB3C5\uC790", "Reflective Individual"), eng: "Reflective Individual", desc: t("\uAE4A\uC740 \uB0B4\uBA74 \uC138\uACC4\uB97C \uD0D0\uAD6C\uD558\uBA70 \uC870\uC6A9\uD788 \uC790\uC2E0\uB9CC\uC758 \uAC00\uCE58\uB97C \uCD94\uAD6C\uD558\uB294 \uC720\uD615\uC785\uB2C8\uB2E4.", "A type that explores a deep inner world and quietly pursues personal values."), traits: [t("\uC131\uCC30", "Reflection"), t("\uB3C5\uB9BD\uC131", "Independence"), t("\uAE4A\uC774", "Depth"), t("\uAC00\uCE58\uC9C0\uD5A5", "Values-driven")], strength: [t("\uAE4A\uC740 \uC790\uAE30 \uC774\uD574", "Deep self-understanding"), t("\uC9C4\uC815\uC131 \uC788\uB294 \uAD00\uACC4", "Authentic relationships"), t("\uB3C5\uC790\uC801\uC778 \uC0AC\uACE0\uC640 \uD1B5\uCC30", "Independent thinking and insight")], weakness: [t("\uD0C0\uC778\uACFC\uC758 \uC5F0\uACB0\uC774 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC74C", "May find it hard to connect with others"), t("\uACFC\uB3C4\uD55C \uB0B4\uBA74 \uC9D1\uC911\uC73C\uB85C \uD604\uC2E4 \uAD34\uB9AC", "Excessive introspection can disconnect from reality"), t("\uBCC0\uD654 \uB300\uC751 \uB290\uB9BC", "Slow to respond to change")], work: t("\uAC00\uCE58 \uC788\uB294 \uBAA9\uC801\uC744 \uC704\uD574 \uD63C\uC790 \uAE4A\uC774 \uC9D1\uC911\uD558\uB294 \uC791\uC5C5\uC5D0 \uAC15\uD569\uB2C8\uB2E4.", "Strong at solo deep-focus work with meaningful purpose."), love: t("\uC9C4\uC815\uC131 \uC788\uB294 \uAE4A\uC740 \uC5F0\uACB0\uC744 \uC6D0\uD558\uBA70 \uAC00\uCE58\uAD00 \uACF5\uC720\uB97C \uC911\uC2DC\uD569\uB2C8\uB2E4.", "Seeks authentic deep connection and values sharing the same values."), stress: t("\uAE4A\uC740 \uC131\uCC30\uACFC \uD63C\uC790\uB9CC\uC758 \uC2DC\uAC04\uC73C\uB85C \uC5D0\uB108\uC9C0\uB97C \uD68C\uBCF5\uD569\uB2C8\uB2E4.", "Restores energy through deep reflection and solitary time."), match: ["ETPC", "EFPC"], conflict: ["ETPR", "ITPR"] }
  };
  function calcLost() {
    const axisScores = { E: 0, D: 0, S: 0, N: 0, R: 0, T: 0 };
    const axisCount = { E: 0, D: 0, S: 0, N: 0, R: 0, T: 0 };
    lostQ.forEach((q) => {
      const r = lostResponses[q.num];
      if (r === void 0) return;
      const score = q.rev ? 6 - r : r;
      axisScores[q.axis] += score;
      axisCount[q.axis]++;
    });
    const avg = {};
    Object.keys(axisScores).forEach((k) => {
      avg[k] = axisCount[k] > 0 ? axisScores[k] / axisCount[k] : 3;
    });
    const EI = avg.E >= 3 ? "E" : "I";
    const TF = avg.D >= 3 ? "T" : "F";
    const PJ = avg.S >= 3 ? "P" : "J";
    const RC = avg.R >= 3 ? "R" : "C";
    const TV = avg.T >= 3 ? "A" : "V";
    const NC = avg.N >= 3 ? "\uBCC0\uD654\uC120\uD638" : "\uC548\uC815\uC120\uD638";
    const typeCode = EI + TF + PJ + RC;
    const typeInfo = LOST_TYPES[typeCode] || LOST_TYPES["ETPR"];
    return { axisAvg: avg, typeCode, typeInfo, stressStyle: TV, stabilityStyle: NC };
  }
  const startTest = (...args) => {
  };
  const forgotPassword = (...args) => {
  };
  useEffect(() => {
    if (!view.startsWith("partnerTest:")) return;
    const key = view.split(":")[1];
    if (key === "BIG5") setView("big5Test");
    else if (key === "LOST") setView("lostTest");
    else if (key === "DSI") setView("dsiTest");
  }, [view]);
  useEffect(() => {
    if (!view || !view.startsWith("startTest:")) return;
    const testId = view.split(":")[1];
    const TEST_VIEW_MAP = {
      PHQ9: "phq9Test",
      GAD7: "gad7Test",
      DASS21: "dass21Test",
      BIG5: "big5Test",
      BURNOUT: "burnoutTest",
      LOST: "lostTest",
      SCT: "sctTest",
      DSI: "dsiTest",
      RIASEC: "riasecTest",
      VALUES: "valuesTest"
    };
    const targetView = TEST_VIEW_MAP[testId];
    if (!targetView) {
      setView("memberDashboard");
      return;
    }
    if (!currentUser && !FREE_TESTS.includes(testId)) {
      setView("memberSignup");
      return;
    }
    if (!currentUser && FREE_TESTS.includes(testId)) {
      setPendingTests([testId]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId("session"));
      setPhq9Responses({});
      setGad7Responses({});
      resetChat();
      setView(targetView);
      return;
    }
    (async () => {
      const ok = await chargeForTest(testId);
      if (!ok) {
        setView("memberDashboard");
        return;
      }
      setPendingTests([testId]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId("session"));
      setSaveStatus("");
      setRiasecResponses({});
      setValuesResponses({});
      setPhq9Responses({});
      setGad7Responses({});
      setDass21Responses({});
      setBig5Responses({});
      setBurnoutResponses({});
      setLostResponses({});
      setSrciResponses({});
      setSdriResponses({});
      resetChat();
      setView(targetView);
    })();
  }, [view]);
  useEffect(() => {
    if (view === "phq9Result" || view === "gad7Result") {
      if (!isLoggedIn) setChatOpen(true);
    }
    if (view === "complete" && !isLoggedIn) {
      setChatMessages([]);
      setChatOpen(false);
    }
  }, [view]);
  useEffect(() => {
    const TEST_VIEWS = [
      "sctTest",
      "dsiTest",
      "phq9Test",
      "gad7Test",
      "dass21Test",
      "burnoutTest",
      "big5Test",
      "lostTest",
      "riasecTest",
      "valuesTest",
      "sctResult",
      "dsiResult",
      "phq9Result",
      "gad7Result",
      "dass21Result",
      "burnoutResult",
      "big5Result",
      "lostResult",
      "riasecResult",
      "valuesResult",
      "memberDashboard",
      "counseling"
    ];
    const isTestView = TEST_VIEWS.includes(view);
    if (isTestView) {
      window.history.pushState({ maumful: true }, "", window.location.href);
      const handlePopState = (e) => {
        window.history.pushState({ maumful: true }, "", window.location.href);
        setView("landing");
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [view]);
  useEffect(() => {
    const init = async () => {
      console.log("\u{1F504} \uC571 \uCD08\uAE30\uD654 - LocalStorage \uB370\uC774\uD130 \uB85C\uB4DC \uC2DC\uC791");
      checkAndCleanExpiredSessions();
      const restored = await restoreLoginState();
      if (restored) {
        console.log("\u2705 \uB85C\uADF8\uC778 \uC0C1\uD0DC \uC790\uB3D9 \uBCF5\uC6D0 \uC644\uB8CC");
      } else {
        console.log("\u2139\uFE0F \uBCF5\uC6D0\uD560 \uB85C\uADF8\uC778 \uC815\uBCF4 \uC5C6\uC74C - \uB85C\uADF8\uC778 \uD654\uBA74 \uD45C\uC2DC");
      }
      const keys = Object.keys(localStorage);
      console.log("\u{1F4E6} \uC800\uC7A5\uB41C \uD0A4 \uBAA9\uB85D:", keys.filter(
        (k) => k.includes("counselor") || k.includes("submitted") || k.includes("link_") || k.includes("session_") || k.includes("login")
      ));
      const approvedData = storage.get("approved_counselors");
      if (approvedData) {
        const approved = JSON.parse(approvedData.value);
        console.log("\u2705 \uC2B9\uC778\uB41C \uC0C1\uB2F4\uC0AC:", approved.length + "\uBA85");
      }
      const pendingData = storage.get("counselor_requests");
      if (pendingData) {
        const pending = JSON.parse(pendingData.value).filter((c) => c.status === "pending");
        console.log("\u23F3 \uB300\uAE30 \uC911\uC778 \uC0C1\uB2F4\uC0AC:", pending.length + "\uBA85");
      }
      if (isAdmin) {
        await loadBiblicalRefs();
      }
    };
    init();
    const submittedData = storage.get("submitted_list");
    if (submittedData) {
      const submitted2 = JSON.parse(submittedData.value);
      console.log("\u{1F4CA} \uC81C\uCD9C\uB41C \uAC80\uC0AC:", submitted2.length + "\uAC74");
    }
    console.log("\u2705 \uB370\uC774\uD130 \uB85C\uB4DC \uC644\uB8CC");
    const intervalId = setInterval(() => {
      checkAndCleanExpiredSessions();
    }, 6e4);
    return () => clearInterval(intervalId);
  }, []);
  useEffect(() => {
    if (!isLoggedIn) return;
    const saveMap = {
      big5Result: () => ({ test_type: "BIG5", result_json: calcBig5() }),
      lostResult: () => ({ test_type: "LOST", result_json: (() => {
        const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
        return { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle };
      })() }),
      dsiResult: () => ({ test_type: "DSI", result_json: (() => {
        const { scales, total } = calcSdri();
        return { scales, total };
      })() })
    };
    const fn = saveMap[view];
    if (!fn) return;
    try {
      const payload = fn();
      fetch("/api/test/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify(payload)
      }).then(() => {
        if (returnToCouple) setTimeout(() => goBackToCouple(), 2500);
      }).catch(() => {
        setSaveStatus("\u26A0\uFE0F \uACB0\uACFC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uD398\uC774\uC9C0\uB97C \uC0C8\uB85C\uACE0\uCE68\uD558\uBA74 \uC7AC\uC2DC\uB3C4\uB429\uB2C8\uB2E4.");
      });
    } catch {
    }
  }, [view, isLoggedIn]);
  useEffect(() => {
    if (view !== "complete" || !returnToCouple) return;
    const t2 = setTimeout(() => goBackToCouple(), 2500);
    return () => clearTimeout(t2);
  }, [view, returnToCouple]);
  const activeLinkData = currentUser ? {
    clientName: currentUser.nickname || currentUser.email,
    counselingType: counselingMode,
    // 사용자가 설정한 상담 모드 반영
    testTypes: selectedTests,
    testType: selectedTests[0],
    lang: currentUser.locale || "ko"
  } : null;
  const activeLinkId = currentUser ? "member_" + currentUser.id : null;
  const isCounselor = false;
  const isAdmin = false;
  const counselorPhone = "";
  const setIsAdmin = () => {
  };
  const setIsCounselor = () => {
  };
  const setCounselorPhone = () => {
  };
  const setActiveLinkData = () => {
  };
  const setApprovedCounselors = () => {
  };
  const setPendingCounselors = () => {
  };
  const setOrgCounselors = () => {
  };
  const setQuotaEditingPhone = () => {
  };
  const setQuotaEditingValue = () => {
  };
  const setApiTestLoading = () => {
  };
  const setApiTestResult = () => {
  };
  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.getRegionConfig();
        setRegionConfig(cfg);
      } catch {
      }
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
        } catch {
          tokenStore.clear();
        }
      }
      loadAllSubmitted();
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get("payment");
      const resetToken = urlParams.get("reset_token");
      const startTest2 = urlParams.get("start");
      const urlHash = window.location.hash;
      const channelCode = urlParams.get("p");
      const ssoToken = urlParams.get("sso_token");
      if (channelCode) {
        const upperCode = channelCode.toUpperCase();
        try {
          localStorage.setItem("maumful_partner_code", upperCode);
        } catch {
        }
        window.history.replaceState({}, "", "/");
        try {
          const cfgRes = await fetch(`/api/partner/config?p=${upperCode}`);
          const cfgData = await cfgRes.json();
          if (cfgData.success) {
            sessionStorage.setItem("maumful_partner_cfg", JSON.stringify(cfgData.data));
          }
        } catch {
        }
        if (ssoToken && !isAuthenticated) {
          try {
            const r = await fetch("/api/auth/partner-sso", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ partnerCode: upperCode, ssoToken })
            });
            const d = await r.json();
            if (d.success) {
              const { accessToken: accessToken2, refreshToken, user } = d.data;
              tokenStore.setTokens(accessToken2, refreshToken);
              tokenStore.setUser(user);
              setCurrentUser(user);
              setCredits(user.credits);
              setIsLoggedIn(true);
              isAuthenticated = true;
            }
          } catch {
          }
        }
      }
      const partnerCode = urlParams.get("partner");
      if (partnerCode) {
        window.history.replaceState({}, "", "/");
        try {
          const coupleBase = getCoupleBaseUrl();
          const r = await fetch(`${coupleBase}/api/couple/partner-info/${partnerCode.toUpperCase()}`);
          const d = await r.json();
          if (d.success) {
            const tests = d.data.test_type.split("+");
            setPartnerMode({ sessionCode: partnerCode.toUpperCase(), testType: d.data.test_type, hostName: d.data.host_name, pendingTests: tests, completedResults: {} });
            setView("partnerIntro");
          } else {
            setView("landing");
          }
        } catch {
          setView("landing");
        }
        setInitializing(false);
        return;
      }
      if (urlParams.get("go") === "counseling") {
        window.history.replaceState({}, "", "/");
        if (isAuthenticated) {
          setView("counseling");
        } else {
          sessionStorage.setItem("post_login_view", "counseling");
          setView("memberLogin");
        }
        setInitializing(false);
        return;
      }
      if (startTest2) {
        window.history.replaceState({}, "", "/");
        sessionStorage.setItem("return_to_couple", "1");
        setReturnToCouple(true);
        const testKey = startTest2.toUpperCase();
        if (["BIG5", "LOST", "DSI"].includes(testKey)) {
          const startView = "startTest:" + testKey;
          if (isAuthenticated) {
            setView(startView);
          } else {
            sessionStorage.setItem("post_login_view", startView);
            setView("memberLogin");
          }
        }
        setInitializing(false);
        return;
      }
      if (isAuthenticated) setView("memberDashboard");
      if (paymentStatus === "success") {
        window.history.replaceState({}, "", "/");
        setTimeout(async () => {
          try {
            const r = await fetch("/api/payment/stripe/verify", { headers: api._authHeader() });
            const d = await r.json();
            if (d.success) setCredits(d.data.credits);
          } catch {
          }
          setLoginMsg({ type: "success", text: "\u2726 \uD06C\uB808\uB527 \uCDA9\uC804\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!" });
          setTimeout(() => setLoginMsg({ type: "", text: "" }), 4e3);
        }, 1500);
      } else if (paymentStatus === "fail" || paymentStatus === "cancel") {
        window.history.replaceState({}, "", "/");
        setLoginMsg({ type: "error", text: "\uACB0\uC81C\uAC00 \uCDE8\uC18C\uB418\uC5C8\uAC70\uB098 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
        setTimeout(() => setLoginMsg({ type: "", text: "" }), 4e3);
      }
      if (resetToken) {
        window.history.replaceState({}, "", "/");
        setView("resetPassword");
        window.__resetToken = resetToken;
      }
      if (urlHash.startsWith("#counseling")) {
        const hashParams = new URLSearchParams(urlHash.slice("#counseling".length + 1));
        const ctype = hashParams.get("type");
        window.history.replaceState({}, "", "/");
        if (isAuthenticated) {
          setView("counseling");
          if (ctype) {
            try {
              localStorage.setItem("couple_counseling_type", ctype);
            } catch {
            }
          }
        } else {
          setView("memberLogin");
        }
      }
      const refCode = urlParams.get("ref");
      if (refCode) {
        sessionStorage.setItem("pending_ref_code", refCode.toUpperCase());
        window.history.replaceState({}, "", "/");
      }
      const utmSource = urlParams.get("utm_source");
      if (utmSource) {
        try {
          localStorage.setItem("maumful_utm_source", utmSource);
        } catch {
        }
      }
      setInitializing(false);
    })();
  }, []);
  async function handleLogin(e) {
    var _a2, _b2;
    if (e) e.preventDefault();
    const email = (((_a2 = document.getElementById("login-email")) == null ? void 0 : _a2.value) || "").trim();
    const password = ((_b2 = document.getElementById("login-pw")) == null ? void 0 : _b2.value) || "";
    if (!email || !password) {
      setLoginMsg({ type: "error", text: t("\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.", "Please enter your email and password.") });
      return;
    }
    setLoginMsg({ type: "loading", text: t("\uB85C\uADF8\uC778 \uC911...", "Signing in...") });
    const result = await api.login(email, password);
    if (!result.success) {
      if (result.requiresVerification) {
        setLoginMsg({
          type: "error",
          text: t(`\u{1F4E7} \uC774\uBA54\uC77C \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. ${result.email || ""}\uB85C \uBC1C\uC1A1\uB41C \uC778\uC99D \uBA54\uC77C\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.`, `\u{1F4E7} Email verification required. Please check the email sent to ${result.email || ""}.`)
        });
        setPendingVerifyEmail(result.email || "");
      } else {
        setLoginMsg({ type: "error", text: result.error || t("\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", "Login failed.") });
      }
      return;
    }
    const { accessToken, refreshToken, user } = result.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setLoginMsg({ type: "", text: "" });
    const postLoginView = sessionStorage.getItem("post_login_view");
    if (postLoginView) {
      sessionStorage.removeItem("post_login_view");
      setView(postLoginView);
    } else {
      setView("memberDashboard");
    }
    loadTestHistory();
    const pendingRef = sessionStorage.getItem("pending_ref_code");
    if (pendingRef) {
      sessionStorage.removeItem("pending_ref_code");
      fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ code: pendingRef })
      }).then((r) => r.json()).then((r) => {
        if (r.success) {
          setCredits(r.data.balance);
          setLoginMsg({ type: "success", text: t(`\uCD08\uB300 \uCF54\uB4DC \uC801\uC6A9! +${r.data.credits} \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, `Referral applied! +${r.data.credits} credits added.`) });
          setTimeout(() => setLoginMsg({ type: "", text: "" }), 4e3);
        }
      }).catch(() => {
      });
    }
  }
  async function handleGoogleLogin(credential) {
    setLoginMsg({ type: "loading", text: t("Google \uB85C\uADF8\uC778 \uC911...", "Signing in with Google...") });
    const result = await api.loginGoogle(credential);
    if (!result.success) {
      setLoginMsg({ type: "error", text: result.error || t("Google \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", "Google sign-in failed.") });
      return;
    }
    const { accessToken, refreshToken, user } = result.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setLoginMsg({ type: "", text: "" });
    const postLoginView = sessionStorage.getItem("post_login_view");
    if (postLoginView) {
      sessionStorage.removeItem("post_login_view");
      setView(postLoginView);
    } else setView("memberDashboard");
    loadTestHistory();
  }
  async function handleKakaoLogin(data) {
    if (!(data == null ? void 0 : data.accessToken)) {
      setLoginMsg({ type: "error", text: t("\uCE74\uCE74\uC624 \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", "Kakao sign-in failed.") });
      return;
    }
    const { accessToken, refreshToken, user } = data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits || 0);
    setIsLoggedIn(true);
    setLoginMsg({ type: "", text: "" });
    const postLoginView = sessionStorage.getItem("post_login_view");
    if (postLoginView) {
      sessionStorage.removeItem("post_login_view");
      setView(postLoginView);
    } else setView("memberDashboard");
    loadTestHistory();
  }
  async function handleNaverLogin(data) {
    if (!(data == null ? void 0 : data.accessToken)) {
      setLoginMsg({ type: "error", text: t("\uB124\uC774\uBC84 \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", "Naver sign-in failed.") });
      return;
    }
    const { accessToken, refreshToken, user } = data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits || 0);
    setIsLoggedIn(true);
    setLoginMsg({ type: "", text: "" });
    const postLoginView = sessionStorage.getItem("post_login_view");
    if (postLoginView) {
      sessionStorage.removeItem("post_login_view");
      setView(postLoginView);
    } else setView("memberDashboard");
    loadTestHistory();
  }
  async function handleSignup(e) {
    if (e) e.preventDefault();
    const { email, password, pwConfirm, nickname, gender, age_range, phone } = signupForm;
    if (!email || !password) {
      setFormMsg({ type: "error", text: t("\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4.", "Email and password are required.") });
      return;
    }
    if (password !== pwConfirm) {
      setFormMsg({ type: "error", text: t("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Passwords do not match.") });
      return;
    }
    if (password.length < 8) {
      setFormMsg({ type: "error", text: t("\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.", "Password must be at least 8 characters.") });
      return;
    }
    if (phone && !/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) {
      setFormMsg({ type: "error", text: t("\uD578\uB4DC\uD3F0\uBC88\uD638 \uD615\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694. (\uC608: 010-1234-5678)", "Check phone format: 010-1234-5678") });
      return;
    }
    const { terms, privacy, sensitive, overseas, age } = signupConsents;
    if (!terms || !privacy || !sensitive || !overseas || !age) {
      setFormMsg({ type: "error", text: t("\uBAA8\uB4E0 \uD544\uC218 \uD56D\uBAA9\uC5D0 \uB3D9\uC758\uD574 \uC8FC\uC138\uC694.", "Please agree to all required terms.") });
      return;
    }
    setFormMsg({ type: "loading", text: t("\uAC00\uC785 \uCC98\uB9AC \uC911...", "Creating your account...") });
    let savedPartnerCode = null;
    try {
      savedPartnerCode = localStorage.getItem("maumful_partner_code");
    } catch {
    }
    const result = await api.register(email, password, nickname || email.split("@")[0], savedPartnerCode, signupConsents.marketing, "ko", gender || null, age_range || null, phone || null);
    if (!result.success) {
      setFormMsg({ type: "error", text: result.error || t("\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", "Sign-up failed. Please try again.") });
      return;
    }
    setFormMsg({ type: "loading", text: t("\uC7A0\uC2DC\uB9CC\uC694...", "Just a moment...") });
    const loginResult = await api.login(email, password);
    if (!loginResult.success) {
      setFormMsg({ type: "success", text: t("\uAC00\uC785 \uC644\uB8CC! \uC544\uB798\uC5D0\uC11C \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.", "Account created! Please sign in below.") });
      setTimeout(() => {
        setView("memberLogin");
        setFormMsg({ type: "", text: "" });
      }, 1500);
      return;
    }
    const { accessToken, refreshToken, user } = loginResult.data;
    tokenStore.setTokens(accessToken, refreshToken);
    tokenStore.setUser(user);
    setCurrentUser(user);
    setCredits(user.credits);
    setIsLoggedIn(true);
    setFormMsg({ type: "", text: "" });
    setSignupForm({ email: "", password: "", pwConfirm: "", nickname: "", gender: "", age_range: "", phone: "" });
    setSignupConsents({ terms: false, privacy: false, sensitive: false, overseas: false, age: false, marketing: false });
    const pendingRef = sessionStorage.getItem("pending_ref_code");
    if (pendingRef) {
      sessionStorage.removeItem("pending_ref_code");
      fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ code: pendingRef })
      }).then((r) => r.json()).then((r) => {
        if (r.success) setCredits(r.data.balance);
      }).catch(() => {
      });
    }
    setView("memberOnboarding");
  }
  async function handleLogout() {
    await api.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCredits(0);
    setView("memberLogin");
    setLoginMsg({ type: "", text: "" });
    setAiChatUsed(0);
    try {
      localStorage.removeItem(AI_LIMIT_KEY);
    } catch {
    }
  }
  async function refreshCredits() {
    if (!isLoggedIn) return;
    try {
      const r = await api.getCredits();
      if (r.success) {
        setCredits(r.data.balance);
        setCreditTxns(r.data.transactions);
      }
    } catch {
    }
  }
  async function chargeForTest(testType) {
    if (FREE_TESTS.includes(testType)) return true;
    const result = await api.startTest(testType, (currentUser == null ? void 0 : currentUser.locale) || "ko");
    if (!result.success) {
      if (result.needsCharge) {
        setPendingTestAfterCharge(testType);
        setShowCreditModal(true);
      }
      return false;
    }
    setCredits(result.data.balance);
    return true;
  }
  function getCoupleBaseUrl() {
    const h = window.location.hostname;
    return h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
  }
  function goBackToCouple() {
    setReturnToCouple(false);
    sessionStorage.removeItem("return_to_couple");
    window.location.href = getCoupleBaseUrl();
  }
  function saveCoupleResult(testType, resultJson) {
    if (!isLoggedIn) return;
    fetch("/api/test/save-result", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ test_type: testType, result_json: resultJson })
    }).catch(() => {
    });
  }
  async function submitPartnerResults(results) {
    const coupleBase = getCoupleBaseUrl();
    try {
      const r = await fetch(`${coupleBase}/api/couple/partner-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code: partnerMode.sessionCode, results })
      });
      const d = await r.json();
      if (d.success) {
        setView("partnerComplete");
      } else {
        setSaveStatus("\uC81C\uCD9C \uC2E4\uD328: " + (d.error || "\uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."));
      }
    } catch {
      setSaveStatus("\uB124\uD2B8\uC6CC\uD06C \uC624\uB958. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
    }
  }
  async function openMaumCouple(inviteCode = null) {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    const base = getCoupleBaseUrl();
    try {
      const res = await fetch("/api/couple-token", { headers: api._authHeader() });
      const data = await res.json();
      const token = data.success ? data.coupleToken : tokenStore.getAccess();
      const codeParam = inviteCode ? `&code=${encodeURIComponent(inviteCode)}` : "";
      const langParam = lang === "en" ? "&lang=en" : "";
      window.open(`${base}${token ? "?t=" + encodeURIComponent(token) + codeParam + langParam : ""}`, "_blank", "noopener noreferrer");
    } catch {
      const token = tokenStore.getAccess();
      const langParam = lang === "en" ? "&lang=en" : "";
      window.open(`${base}${token ? "?t=" + encodeURIComponent(token) + langParam : ""}`, "_blank", "noopener noreferrer");
    }
  }
  async function openMaumGame(gameKey = null) {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    try {
      const res = await fetch("/api/game-token", { headers: api._authHeader() });
      const data = await res.json();
      const token = data.success ? data.gameToken : tokenStore.getAccess();
      const gameParam = gameKey ? `&game=${encodeURIComponent(gameKey)}` : "";
      const langParam = lang === "en" ? "&lang=en" : "";
      const gameUrl = `https://game.maumful.com${token ? "?t=" + encodeURIComponent(token) + gameParam + langParam : ""}`;
      window.open(gameUrl, "_blank", "noopener noreferrer");
    } catch {
      const token = tokenStore.getAccess();
      const langParam = lang === "en" ? "&lang=en" : "";
      const gameUrl = `https://game.maumful.com${token ? "?t=" + encodeURIComponent(token) + langParam : ""}`;
      window.open(gameUrl, "_blank", "noopener noreferrer");
    }
  }
  async function loadTestHistory() {
    try {
      const r = await api.getTestHistory();
      if (r.success) setTestHistory(r.data);
    } catch {
    }
    try {
      const mr = await api._fetch("/api/chat/mood-trend?days=14");
      const md = await mr.json();
      if (md.success) setMoodTrend(md.data);
    } catch {
    }
    try {
      const today = new Date(Date.now() + 9 * 3600 * 1e3).toISOString().slice(0, 10);
      const cacheKey = `maumful_daily_ctx_${today}`;
      const dismissed = localStorage.getItem(`maumful_ai_checkin_${today}`);
      if (dismissed) return;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setDailyCtxCard(JSON.parse(cached));
        return;
      }
      const res = await api._fetch("/api/user/daily-context");
      const data = await res.json();
      if (data.success && data.hasData) {
        const card = { greeting: data.greeting, chatContext: data.chatContext };
        localStorage.setItem(cacheKey, JSON.stringify(card));
        setDailyCtxCard(card);
      }
    } catch {
    }
  }
  async function checkPushStatus() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushStatus("denied");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushStatus(sub ? "subscribed" : "idle");
    } catch {
      setPushStatus("idle");
    }
  }
  async function subscribePush() {
    try {
      const { key } = await fetch("/api/push/vapid-key").then((r) => r.json());
      if (!key) {
        alert("\uC54C\uB9BC \uC11C\uBE44\uC2A4\uAC00 \uC900\uBE44 \uC911\uC774\uC5D0\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key
      });
      const { endpoint, keys } = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ endpoint, p256dh: keys == null ? void 0 : keys.p256dh, auth: keys == null ? void 0 : keys.auth, service: "maumful" })
      });
      setPushStatus("subscribed");
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setPushStatus("denied");
      } else {
        alert("\uC54C\uB9BC \uAD6C\uB3C5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694: " + e.message);
      }
    }
  }
  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setPushStatus("idle");
    } catch {
    }
  }
  useEffect(() => {
    const isProtected = PROTECTED_VIEWS.has(view);
    document.body.style.userSelect = isProtected ? "none" : "";
    document.body.style.webkitUserSelect = isProtected ? "none" : "";
    document.body.style.mozUserSelect = isProtected ? "none" : "";
    const styleId = "maumful-print-block";
    let printStyle = document.getElementById(styleId);
    if (isProtected) {
      if (!printStyle) {
        printStyle = document.createElement("style");
        printStyle.id = styleId;
        printStyle.textContent = "@media print { body { display:none !important; } }";
        document.head.appendChild(printStyle);
      }
    } else {
      printStyle == null ? void 0 : printStyle.remove();
    }
    if (!isProtected) return;
    const noCtxMenu = (e) => e.preventDefault();
    const noCopy = (e) => e.preventDefault();
    const noDrag = (e) => e.preventDefault();
    const noKeys = (e) => {
      var _a2;
      const k = (_a2 = e.key) == null ? void 0 : _a2.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ["c", "s", "p", "u", "a"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (k === "f12" || ctrl && e.shiftKey && ["i", "j", "c"].includes(k)) e.preventDefault();
    };
    const noPrint = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("contextmenu", noCtxMenu, { capture: true });
    document.addEventListener("copy", noCopy, { capture: true });
    document.addEventListener("dragstart", noDrag, { capture: true });
    document.addEventListener("keydown", noKeys, { capture: true });
    window.addEventListener("beforeprint", noPrint, { capture: true });
    return () => {
      document.removeEventListener("contextmenu", noCtxMenu, { capture: true });
      document.removeEventListener("copy", noCopy, { capture: true });
      document.removeEventListener("dragstart", noDrag, { capture: true });
      document.removeEventListener("keydown", noKeys, { capture: true });
      window.removeEventListener("beforeprint", noPrint, { capture: true });
    };
  }, [view]);
  useEffect(() => {
    if (!PROTECTED_VIEWS.has(view)) {
      setDevToolsOpen(false);
      return;
    }
    const THRESHOLD = 160;
    const check = () => {
      const open = window.outerWidth - window.innerWidth > THRESHOLD || window.outerHeight - window.innerHeight > THRESHOLD;
      setDevToolsOpen(open);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [view]);
  async function loadReferralData() {
    setReferralLoading(true);
    try {
      const [codeRes, listRes] = await Promise.all([
        fetch("/api/referral/code", { headers: api._authHeader() }).then((r) => r.json()),
        fetch("/api/referral/list", { headers: api._authHeader() }).then((r) => r.json())
      ]);
      if (codeRes.success) setReferralData(codeRes.data);
      if (listRes.success) setReferralList(listRes.data);
    } catch (e) {
      console.error("referral load error", e);
    }
    setReferralLoading(false);
  }
  async function applyReferralCode() {
    const code = referralInput.trim().toUpperCase();
    if (!code) {
      setReferralMsg({ type: "error", text: "\uCD08\uB300 \uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    setReferralMsg({ type: "loading", text: "\uC801\uC6A9 \uC911..." });
    const r = await fetch("/api/referral/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ code })
    }).then((r2) => r2.json());
    if (r.success) {
      setReferralMsg({ type: "success", text: r.message });
      setCredits(r.data.balance);
      setReferralInput("");
    } else {
      setReferralMsg({ type: "error", text: r.error || "\uC801\uC6A9 \uC2E4\uD328" });
    }
  }
  function copyInviteLink(url) {
    var _a2;
    (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(url).then(() => {
      setReferralMsg({ type: "success", text: "\uCD08\uB300 \uB9C1\uD06C\uAC00 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!" });
      setTimeout(() => setReferralMsg({ type: "", text: "" }), 2e3);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setReferralMsg({ type: "success", text: "\uB9C1\uD06C \uBCF5\uC0AC \uC644\uB8CC!" });
      setTimeout(() => setReferralMsg({ type: "", text: "" }), 2e3);
    });
  }
  async function adminFetch(path, opts = {}) {
    return fetch(path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + adminSecretInput,
        ...opts.headers || {}
      }
    }).then((r) => r.json());
  }
  async function loadAdminOverview() {
    setAdminLoading(true);
    try {
      const [stats, daily, tests] = await Promise.all([
        adminFetch("/api/admin/stats"),
        adminFetch("/api/admin/stats/daily?days=30"),
        adminFetch("/api/admin/stats/tests")
      ]);
      if (stats.success) setAdminStats(stats.data);
      if (daily.success) setAdminDaily(daily.data);
      if (tests.success) setAdminTestStats(tests.data);
    } catch (e) {
      setAdminMsg({ type: "error", text: "\uB85C\uB4DC \uC2E4\uD328: " + e.message });
    }
    setAdminLoading(false);
  }
  async function loadAdminUsers(page = 1) {
    setAdminLoading(true);
    try {
      const r = await adminFetch(`/api/admin/users?page=${page}&limit=20${adminSearch ? "&search=" + encodeURIComponent(adminSearch) : ""}`);
      if (r.success) setAdminUsers(r.data);
      else setAdminMsg({ type: "error", text: r.error });
    } catch (e) {
      setAdminMsg({ type: "error", text: e.message });
    }
    setAdminLoading(false);
  }
  async function loadAdminPayments(page = 1) {
    setAdminLoading(true);
    try {
      const r = await adminFetch(`/api/admin/payments?page=${page}&limit=20`);
      if (r.success) setAdminPayments(r.data);
      else setAdminMsg({ type: "error", text: r.error });
    } catch (e) {
      setAdminMsg({ type: "error", text: e.message });
    }
    setAdminLoading(false);
  }
  async function grantCredits() {
    const { userId, amount, type, reason } = creditGrantForm;
    if (!userId || !amount) {
      setAdminMsg({ type: "error", text: "\uC0AC\uC6A9\uC790 ID\uC640 \uAE08\uC561\uC744 \uC785\uB825\uD558\uC138\uC694." });
      return;
    }
    const r = await adminFetch(`/api/admin/users/${userId}/credits`, {
      method: "POST",
      body: JSON.stringify({ amount: parseInt(amount), type, reason })
    });
    if (r.success) {
      setAdminMsg({ type: "success", text: r.message });
      setCreditGrantForm({ userId: "", amount: "", type: "gain", reason: "admin_grant" });
    } else {
      setAdminMsg({ type: "error", text: r.error });
    }
  }
  async function processRefund(chargeId) {
    if (!confirm(`\uACB0\uC81C ID ${chargeId} \uD658\uBD88 \uCC98\uB9AC\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?
\uD06C\uB808\uB527\uC774 \uD68C\uC218\uB418\uACE0 PG \uCDE8\uC18C\uB294 \uBCC4\uB3C4 \uCC98\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.`)) return;
    const r = await adminFetch(`/api/admin/payments/${chargeId}/refund`, { method: "POST" });
    if (r.success) {
      setAdminMsg({ type: "success", text: r.message });
      loadAdminPayments();
    } else {
      setAdminMsg({ type: "error", text: r.error });
    }
  }
  function genId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }
  function storeSession(data) {
    if (!isLoggedIn && !activeLinkId) return;
    storage.set("session_" + data.sessionId, JSON.stringify(data));
    const listRaw = storage.get("submitted_list");
    const list = listRaw ? JSON.parse(listRaw.value) : [];
    list.unshift({ sessionId: data.sessionId, testType: data.testType, createdAt: data.createdAt, linkId: data.linkId });
    if (list.length > 20) list.splice(20);
    storage.set("submitted_list", JSON.stringify(list));
    setSubmitted(list);
  }
  function loadAllSubmitted() {
    const r = storage.get("submitted_list");
    const list = r ? JSON.parse(r.value) : [];
    setSubmitted(list);
  }
  function getSession(sessionId2) {
    const r = storage.get("session_" + sessionId2);
    return r ? JSON.parse(r.value) : null;
  }
  function buildTestSummary(testType) {
    var _a2, _b2, _c2;
    const en = lang === "en";
    try {
      if (testType === "SCT") {
        const { filled, byScale } = calcSrci();
        const sample = Object.entries(byScale).map(([s, items]) => `[${s}] ${items.slice(0, 1).map((a) => a.answer).join(" / ")}`).join("\n");
        return en ? `SRCI Self-Response Completion (${filled}/25 completed)
${sample}` : `SRCI \uC790\uAE30\uBC18\uC751 \uC644\uC131\uAC80\uC0AC (\uC644\uC131 ${filled}/25)
${sample}`;
      }
      if (testType === "DSI") {
        const { scales, total } = calcSdri();
        const scalesStr = Object.entries(scales).map(([k, v]) => `${k}: ${v}`).join(", ");
        return en ? `SDRI Self-Differentiation total: ${total}
${scalesStr}` : `SDRI \uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC \uCD1D\uC810: ${total}\uC810
${scalesStr}`;
      }
      if (testType === "PHQ9") {
        const r = calcPhq9();
        const items = Object.entries(phq9Responses).map(([k, v]) => `Q${+k + 1}:${v}`).join(", ");
        return en ? `PHQ-9 total: ${r.total}/27 (${r.level})
${items}` : `PHQ-9 \uCD1D\uC810: ${r.total}/27 (${r.level})
${items}`;
      }
      if (testType === "GAD7") {
        const r = calcGad7();
        return en ? `GAD-7 total: ${r.total}/21 (${r.level})` : `GAD-7 \uCD1D\uC810: ${r.total}/21 (${r.level})`;
      }
      if (testType === "DASS21") {
        const r = calcDass21();
        return en ? `DASS-21 \u2014 Depression:${r.depression.score}(${r.depression.level}), Anxiety:${r.anxiety.score}(${r.anxiety.level}), Stress:${r.stress.score}(${r.stress.level})` : `DASS-21 \u2014 \uC6B0\uC6B8:${r.depression.score}(${r.depression.level}), \uBD88\uC548:${r.anxiety.score}(${r.anxiety.level}), \uC2A4\uD2B8\uB808\uC2A4:${r.stress.score}(${r.stress.level})`;
      }
      if (testType === "BIG5") {
        const r = calcBig5();
        const factors = Object.entries(r).map(([k, v]) => `${k}:${v}`).join(", ");
        return en ? `Big Five personality: ${factors}` : `Big5 \uC131\uACA9\uAC80\uC0AC: ${factors}`;
      }
      if (testType === "BURNOUT") {
        const r = calcBurnout();
        return en ? `K-MBI+ Burnout: ${r.totalScore}/240 (${r.percentage}%)` : `K-MBI+ \uBC88\uC544\uC6C3: ${r.totalScore}/240 (${r.percentage}%, ${r.level})`;
      }
      if (testType === "LOST") {
        const r = calcLost();
        const axisLabel = en ? { E: "Energy", D: "Decision", S: "Speed", N: "Stability", R: "Relation", T: "Stress" } : { E: "\uC5D0\uB108\uC9C0", D: "\uC758\uC0AC\uACB0\uC815", S: "\uD589\uB3D9\uC18D\uB3C4", N: "\uC548\uC815\uC131", R: "\uAD00\uACC4\uBBFC\uAC10\uB3C4", T: "\uC2A4\uD2B8\uB808\uC2A4\uBC18\uC751" };
        const axisText = Object.entries(r.axisAvg).map(([k, v]) => `${axisLabel[k]}:${Number(v).toFixed(1)}`).join(", ");
        return en ? `LOST type: ${r.typeCode} (${((_a2 = r.typeInfo) == null ? void 0 : _a2.eng) || ((_b2 = r.typeInfo) == null ? void 0 : _b2.name)})
Axes: ${axisText}` : `LOST \uD589\uB3D9\uC720\uD615: ${r.typeCode} (${(_c2 = r.typeInfo) == null ? void 0 : _c2.name})
\uCD95\uBCC4: ${axisText}`;
      }
      if (testType === "RIASEC") {
        const { sorted, dominantType } = calcRiasec();
        const top2 = sorted.slice(0, 2).map(([k, s]) => `${k}:${s}`).join(", ");
        return en ? `Holland RIASEC dominant type: ${dominantType} (top2: ${top2})` : `Holland RIASEC \uC6B0\uC138 \uC720\uD615: ${dominantType}\uD615 (\uC0C1\uC7042: ${top2})`;
      }
      if (testType === "VALUES") {
        const { sorted } = calcValues();
        const top3 = sorted.slice(0, 3).map(([k, s]) => {
          var _a3;
          return `${((_a3 = VALUES_DOMAIN_INFO[k]) == null ? void 0 : _a3.label) || k}:${s}`;
        }).join(", ");
        return en ? `Work Values top 3: ${top3}` : `\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uC0C1\uC704 3: ${top3}`;
      }
      if (testType === "GENERAL" || !testType) {
        return en ? "General counseling (no test result)" : "\uC77C\uBC18 AI \uC0C1\uB2F4 (\uAC80\uC0AC \uACB0\uACFC \uC5C6\uC74C \u2014 \uC790\uC720 \uC0C1\uB2F4)";
      }
    } catch {
    }
    return "";
  }
  function incrementAiChatUsed() {
    if (!isLoggedIn) {
      const next2 = guestAiTotal + 1;
      setGuestAiTotal(next2);
      try {
        localStorage.setItem(AI_GUEST_KEY, String(next2));
      } catch {
      }
      return next2;
    }
    const next = aiChatUsed + 1;
    setAiChatUsed(next);
    try {
      localStorage.setItem(AI_LIMIT_KEY, String(next));
    } catch {
    }
    return next;
  }
  function isAiChatExhausted() {
    if (!isLoggedIn) return guestAiTotal >= AI_GUEST_TOTAL;
    if (credits <= 0) return aiChatUsed >= AI_LIMIT_FREE;
    return false;
  }
  async function sendChatMessage(testType) {
    var _a2;
    const input = chatInput.trim();
    if (!input || chatStreaming) return;
    if (isAiChatExhausted()) {
      setShowAiLimitModal(true);
      return;
    }
    const summary = buildTestSummary(testType);
    const userMsg = { role: "user", content: input, id: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatStreaming(true);
    setChatError("");
    const assistantId = Date.now() + 1;
    setChatMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId, streaming: true }]);
    try {
      const history = [...chatMessages.filter((m) => m.content && m.content.trim() && !m.streaming), userMsg].map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.trim() }));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ messages: history, testContext: { testType, counselingType: counselingMode || "psychological", summary, lang }, dailyContext: (dailyCtxCard == null ? void 0 : dailyCtxCard.chatContext) || null })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setShowCreditModal(true);
          setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setChatStreaming(false);
          return;
        }
        if (res.status === 429) {
          setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setChatStreaming(false);
          if (!isLoggedIn) {
            setGuestAiTotal(AI_GUEST_TOTAL);
            try {
              localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL));
            } catch {
            }
          } else {
            setAiChatUsed(AI_LIMIT_FREE);
          }
          setShowAiLimitModal(true);
          return;
        }
        throw new Error(err.error || "\uC11C\uBC84 \uC624\uB958");
      }
      refreshCredits();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullText = "";
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
            if (parsed.type === "content_block_delta" && ((_a2 = parsed.delta) == null ? void 0 : _a2.text)) {
              fullText += parsed.delta.text;
              setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m));
            }
          } catch {
          }
        }
      }
      const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
      const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
      const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, "").trimEnd();
      incrementAiChatUsed();
      setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m));
      if (moodScore !== null && isLoggedIn) {
        api._fetch("/api/chat/mood-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodScore, testType }) }).catch(() => {
        });
      }
    } catch (e) {
      const errMsg = e.message || "AI \uCC44\uD305 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.";
      setChatError(errMsg.includes("502") || errMsg.includes("Bad Gateway") ? "AI \uC11C\uBE44\uC2A4\uC5D0 \uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uAC70\uB098 \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC138\uC694." : errMsg);
      setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setChatStreaming(false);
    }
  }
  function resetChat() {
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setChatStreaming(false);
  }
  const Msg = ({ msg, extra }) => !msg.text ? null : /* @__PURE__ */ React.createElement("div", { className: `mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : msg.type === "loading" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-700 border border-gray-200"}` }, msg.text, extra);
  const CreditBadge = () => /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowChargeView(true),
      className: "flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-green-100 transition"
    },
    "\u2726 ",
    credits,
    " ",
    t("\uD06C\uB808\uB527", "cr")
  );
  const CreditModal = () => !showCreditModal ? null : /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-3" }, "\u2726"), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-1" }, t("\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4", "Not Enough Credits")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, t("\uC2EC\uB9AC\uAC80\uC0AC 1\uD68C = 10 \uD06C\uB808\uB527", "Assessment = 10 credits"), /* @__PURE__ */ React.createElement("br", null), t("AI \uCC44\uD305 1\uD68C = 2 \uD06C\uB808\uB527", "AI chat = 2 credits"))), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 rounded-xl p-3 mb-5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-800 font-semibold" }, t("\uD604\uC7AC \uC794\uC561", "Balance"), ": ", credits, " ", t("\uD06C\uB808\uB527", "credits"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setShowCreditModal(false);
        setShowChargeView(true);
      },
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-3"
    },
    t("\uD06C\uB808\uB527 \uCDA9\uC804\uD558\uAE30", "Buy Credits")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowCreditModal(false),
      className: "w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
    },
    t("\uB098\uC911\uC5D0", "Later")
  )));
  const AiLimitModal = () => !showAiLimitModal ? null : /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm" }, !isLoggedIn ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-3" }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-2" }, t("\uBB34\uB8CC \uCCB4\uD5D8\uC774 \uB05D\uB0AC\uC2B5\uB2C8\uB2E4", "Free trial ended")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "AI \uC0C1\uB2F4 ", /* @__PURE__ */ React.createElement("strong", null, AI_GUEST_TOTAL, "\uD68C"), "\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uD68C\uC6D0\uAC00\uC785\uD558\uBA74 ", /* @__PURE__ */ React.createElement("span", { className: "text-green-700 font-bold" }, "20 \uD06C\uB808\uB527 \uC989\uC2DC \uC9C0\uAE09"), " +", /* @__PURE__ */ React.createElement("br", null), "\uAC80\uC0AC \uACB0\uACFC \uC800\uC7A5 \xB7 \uD558\uB8E8 5\uD68C AI \uC0C1\uB2F4\uC774 \uC81C\uACF5\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "You've used all ", /* @__PURE__ */ React.createElement("strong", null, AI_GUEST_TOTAL), " free AI sessions.", /* @__PURE__ */ React.createElement("br", null), "Sign up to get ", /* @__PURE__ */ React.createElement("span", { className: "text-green-700 font-bold" }, "20 credits instantly"), " +", /* @__PURE__ */ React.createElement("br", null), "saved history & 5 AI chats per day.")))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-4" }, window.KAKAO_APP_KEY && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        sessionStorage.setItem("post_login_view", "aiCounsel");
        setShowAiLimitModal(false);
        fetch("/api/auth/kakao/url").then((r) => r.json()).then(({ url }) => {
          if (!url) return;
          const p = window.open(url, "kakao_login", "width=500,height=640,top=100,left=200");
          window.addEventListener("message", function h(e) {
            var _a2, _b2;
            if (e.origin !== location.origin) return;
            if (((_a2 = e.data) == null ? void 0 : _a2.type) === "kakao_login") {
              window.removeEventListener("message", h);
              handleKakaoLogin(e.data);
            } else if (((_b2 = e.data) == null ? void 0 : _b2.type) === "kakao_error") {
              window.removeEventListener("message", h);
            }
            const t2 = setInterval(() => {
              if (p == null ? void 0 : p.closed) clearInterval(t2), window.removeEventListener("message", h);
            }, 500);
          });
        }).catch(() => {
        });
      },
      style: {
        background: "#FEE500",
        border: "none",
        borderRadius: 10,
        width: "100%",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: 14,
        color: "#3C1E1E"
      }
    },
    /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "#3C1E1E" }, /* @__PURE__ */ React.createElement("path", { d: "M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.67 5.02 4.2 6.43L6.2 20.5l4.03-2.66c.57.08 1.17.12 1.77.12 4.97 0 9-3.36 9-7.5S16.97 3 12 3z" })),
    t("\uCE74\uCE74\uC624\uB85C 1\uCD08 \uAC00\uC785", "Sign up with Kakao")
  ), window.GOOGLE_CLIENT_ID && /* @__PURE__ */ React.createElement("div", { onClick: () => {
    sessionStorage.setItem("post_login_view", "aiCounsel");
    setShowAiLimitModal(false);
  } }, /* @__PURE__ */ React.createElement(GoogleSignInBtn, { onLogin: handleGoogleLogin, btnText: "signup_with" })), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        sessionStorage.setItem("post_login_view", "aiCounsel");
        setShowAiLimitModal(false);
        setView("memberSignup");
      },
      className: "w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition text-sm"
    },
    t("\uC774\uBA54\uC77C\uB85C \uBB34\uB8CC \uAC00\uC785\uD558\uAE30", "Sign up free with email")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setShowAiLimitModal(false);
        setView("memberLogin");
      },
      className: "w-full text-green-700 text-sm py-1 hover:underline"
    },
    t("\uC774\uBBF8 \uACC4\uC815\uC774 \uC788\uC5B4\uC694 \u2192 \uB85C\uADF8\uC778", "Already have an account? Sign in")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowAiLimitModal(false),
      className: "w-full text-gray-300 text-xs py-1 hover:text-gray-500 mt-1"
    },
    t("\uB2EB\uAE30", "Close")
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-3" }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-2" }, t("AI \uC0C1\uB2F4 \uD69F\uC218\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4", "Daily AI sessions used up")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, credits <= 0 ? t(`\uD06C\uB808\uB527\uC774 \uC5C6\uC73C\uBA74 AI \uC0C1\uB2F4\uC744 \uD558\uB8E8 ${AI_LIMIT_FREE}\uD68C\uAE4C\uC9C0 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`, `Without credits you can use ${AI_LIMIT_FREE} AI sessions per day.`) : t(`\uD06C\uB808\uB527 \uBCF4\uC720 \uC2DC AI \uC0C1\uB2F4\uC744 \uD06C\uB808\uB527\uC774 \uC18C\uC9C4\uB420 \uB54C\uAE4C\uC9C0 \uBB34\uC81C\uD55C \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. (1\uD68C = 2 \uD06C\uB808\uB527)`, `With credits, use AI chat unlimited until credits run out. (2 credits per chat)`))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 mb-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setShowAiLimitModal(false);
        setShowChargeView(true);
      },
      className: "w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition text-sm"
    },
    "\u2726 ",
    t("\uD06C\uB808\uB527 \uCDA9\uC804\uD558\uC5EC \uACC4\uC18D \uC0C1\uB2F4\uD558\uAE30", "Top up credits to continue")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowAiLimitModal(false),
      className: "w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition"
    },
    t("\uB2EB\uAE30", "Close")
  ))));
  function RecoveryCard({ testType, score, level, stressScore }) {
    function getGameRoutine() {
      const isHighStress = (stressScore || score || 0) >= 15;
      const isHighRisk = level === "high";
      const isMidRisk = level === "mid";
      if (testType === "BURNOUT" || isHighRisk) {
        return {
          day1: { key: "burnout", emoji: "\u26A1", label: t("\uBC88\uC544\uC6C3 \uD68C\uBCF5", "Burnout Recovery") },
          day2: { key: "gratitude", emoji: "\u{1F64F}", label: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude") },
          day3: { key: "garden", emoji: "\u{1F331}", label: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden") },
          reason: t("\uC18C\uC9C4 \uC2E0\uD638\uAC00 \uB192\uC744 \uB54C\uB294 \uBC88\uC544\uC6C3 \uD68C\uBCF5 \u2192 \uAC10\uC0AC \u2192 \uC815\uC6D0 \uC21C\uC11C\uAC00 \uD6A8\uACFC\uC801\uC785\uB2C8\uB2E4.", "When burnout is high: Recovery \u2192 Gratitude \u2192 Garden works best.")
        };
      }
      if (testType === "PHQ9" || testType === "DASS21") {
        return {
          day1: { key: "gratitude", emoji: "\u{1F64F}", label: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude") },
          day2: { key: "garden", emoji: "\u{1F331}", label: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden") },
          day3: { key: "tree", emoji: "\u{1F333}", label: t("\uB9C8\uC74C \uB098\uBB34", "Mind Tree") },
          reason: t("\uAC10\uC815 \uC548\uC815\uC5D0\uB294 \uAC10\uC0AC \u2192 \uC815\uC6D0 \u2192 \uB098\uBB34 \uB8E8\uD2F4\uC774 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4.", "Gratitude \u2192 Garden \u2192 Tree helps stabilize emotions.")
        };
      }
      if (testType === "GAD7") {
        return {
          day1: { key: "garden", emoji: "\u{1F331}", label: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden") },
          day2: { key: "tree", emoji: "\u{1F333}", label: t("\uB9C8\uC74C \uB098\uBB34", "Mind Tree") },
          day3: { key: "gratitude", emoji: "\u{1F64F}", label: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude") },
          reason: t("\uBD88\uC548\uC774 \uB192\uC744 \uB54C\uB294 \uC815\uC6D0 \u2192 \uB098\uBB34 \u2192 \uAC10\uC0AC \uC21C\uC11C\uB85C \uCC9C\uCC9C\uD788 \uC774\uC644\uD558\uC138\uC694.", "When anxiety is high: Garden \u2192 Tree \u2192 Gratitude for gradual relaxation.")
        };
      }
      if (testType === "LOST" || testType === "BIG5") {
        return {
          day1: { key: "efmt", emoji: "\u{1F60A}", label: t("\uAC10\uC815 \uD45C\uD604", "Express Emotions") },
          day2: { key: "tree", emoji: "\u{1F333}", label: t("\uB9C8\uC74C \uB098\uBB34", "Mind Tree") },
          day3: { key: "garden", emoji: "\u{1F331}", label: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden") },
          reason: t("\uC790\uAE30\uC774\uD574 \uAC80\uC0AC \uD6C4\uC5D0\uB294 \uAC10\uC815 \uD45C\uD604 \u2192 \uB098\uBB34 \u2192 \uC815\uC6D0 \uB8E8\uD2F4\uC744 \uCD94\uCC9C\uD569\uB2C8\uB2E4.", "After self-insight tests: Express \u2192 Tree \u2192 Garden routine is recommended.")
        };
      }
      return {
        day1: { key: "garden", emoji: "\u{1F331}", label: t("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden") },
        day2: { key: "gratitude", emoji: "\u{1F64F}", label: t("\uAC10\uC0AC \uC77C\uAE30", "Gratitude") },
        day3: { key: "efmt", emoji: "\u{1F60A}", label: t("\uAC10\uC815 \uD45C\uD604", "Express Emotions") },
        reason: t("\uC624\uB298\uBD80\uD130 3\uC77C\uAC04 \uC9E7\uC740 \uB8E8\uD2F4\uC73C\uB85C \uB9C8\uC74C\uC744 \uB3CC\uBD10\uBCF4\uC138\uC694.", "Try a short routine for 3 days starting today.")
      };
    }
    async function launchGame(gameKey) {
      if (!isLoggedIn) {
        alert(t("\uB9C8\uC74C \uAC8C\uC784\uC740 \uB85C\uADF8\uC778 \uD6C4 \uC774\uC6A9 \uAC00\uB2A5\uD569\uB2C8\uB2E4.", "MaumGame requires login."));
        return;
      }
      await openMaumGame(gameKey);
    }
    const routine = getGameRoutine();
    const checkinDate = /* @__PURE__ */ new Date();
    checkinDate.setDate(checkinDate.getDate() + 3);
    const checkinLabel = lang === "en" ? checkinDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `${checkinDate.getMonth() + 1}\uC6D4 ${checkinDate.getDate()}\uC77C`;
    return /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 mt-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-emerald-800 text-base" }, t("\uC624\uB298\uBD80\uD130 3\uC77C \uD68C\uBCF5 \uB8E8\uD2F4", "3-Day Recovery Routine")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-600" }, routine.reason))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 mb-4" }, [
      { day: "Day 1", game: routine.day1 },
      { day: "Day 2", game: routine.day2 },
      { day: "Day 3", game: routine.day3 }
    ].map(({ day, game }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: day,
        onClick: () => launchGame(game.key),
        className: "bg-white rounded-xl p-3 text-center border border-emerald-100 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
      },
      /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-500 font-semibold mb-1" }, day),
      /* @__PURE__ */ React.createElement("p", { className: "text-xl mb-1" }, game.emoji),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs font-medium text-gray-700 group-hover:text-emerald-700" }, game.label)
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-gray-800" }, "\u{1F4C5} ", checkinLabel, " ", t("\uBCC0\uD654 \uCCB4\uD06C", "check-in")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, t("3\uC77C \uD6C4 \uB2E4\uC2DC \uCCB4\uD06C\uD558\uBA74 \uB9C8\uC74C\uC758 \uBCC0\uD654\uB97C \uBE44\uAD50\uD574 \uB4DC\uB824\uC694", "Check back in 3 days to track how you feel"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          localStorage.setItem("maumful_checkin_date", checkinDate.toISOString());
          localStorage.setItem("maumful_checkin_test", testType);
          alert(t(`\u2705 ${checkinLabel}\uC5D0 \uB2E4\uC2DC \uCCB4\uD06C\uD558\uB3C4\uB85D \uAE30\uC5B5\uD574 \uB4DC\uB9B4\uAC8C\uC694!

\uB9C8\uC74C\uD480\uC5D0 \uB2E4\uC2DC \uBC29\uBB38\uD574 \uAC19\uC740 \uAC80\uC0AC\uB97C \uC9C4\uD589\uD558\uC2DC\uBA74
\uC774\uC804 \uACB0\uACFC\uC640 \uBE44\uAD50\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.`, `\u2705 We'll remind you to check in on ${checkinLabel}!

Visit Maumful and take the same test again to compare your progress.`));
        },
        className: "shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition whitespace-nowrap"
      },
      t("\uAE30\uC5B5\uD558\uAE30 \u2192", "Remind me \u2192")
    )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-3 text-center" }, t("\uBCF8 \uACB0\uACFC\uB294 \uC790\uAE30\uC774\uD574\uB97C \uC704\uD55C \uCC38\uACE0 \uC790\uB8CC\uC774\uBA70, \uC758\uD559\uC801 \uC9C4\uB2E8\uC774 \uC544\uB2D9\uB2C8\uB2E4.", "These results are for self-understanding only and are not a medical diagnosis.")));
  }
  function ExpertCTA({ testType, score, level, onContinueAI }) {
    const limit = !isLoggedIn ? AI_GUEST_TOTAL : credits > 0 ? null : AI_LIMIT_FREE;
    const usedCount = !isLoggedIn ? guestAiTotal : aiChatUsed;
    return /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-green-50 p-5 mt-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F91D}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-teal-800 text-base" }, t("\uB354 \uAE4A\uC740 \uC774\uC57C\uAE30, \uD568\uAED8\uD574\uC694", "Let's explore deeper together")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, t("\uAC80\uC0AC \uACB0\uACFC\uB294 \uC790\uAE30\uC774\uD574\uB97C \uC704\uD55C \uCC38\uACE0 \uC790\uB8CC\uC785\uB2C8\uB2E4. \uC758\uD559\uC801 \uC9C4\uB2E8\uC774 \uC544\uB2D9\uB2C8\uB2E4.", "Results are for self-understanding only, not medical diagnosis.")))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-2 mb-4" }, onContinueAI && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: isAiChatExhausted() ? () => setShowAiLimitModal(true) : onContinueAI,
        className: `flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition
                ${isAiChatExhausted() ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-teal-200 text-teal-700 hover:bg-teal-50"}`
      },
      isAiChatExhausted() ? t(`\u{1F4AC} AI \uC0C1\uB2F4 ${usedCount}/${limit ?? "\u221E"}\uD68C \uC644\uB8CC`, `\u{1F4AC} AI sessions used ${usedCount}/${limit ?? "\u221E"}`) : t(`\u{1F4AC} AI\uC640 \uB354 \uC774\uC57C\uAE30\uD558\uAE30 (${limit == null ? t("\uBB34\uC81C\uD55C", "unlimited") : `${usedCount}/${limit}\uD68C`})`, `\u{1F4AC} Talk more with AI (${limit == null ? "unlimited" : `${usedCount}/${limit}`})`)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setView("counseling");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        className: "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition text-white bg-teal-600 hover:bg-teal-700"
      },
      "\u{1F3E5} ",
      t("\uC0C1\uB2F4\uC13C\uD130 \uCC3E\uAE30", "Find a Center")
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 rounded-xl p-4 border border-teal-100" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-500 mb-3" }, "\u{1F4DE} ", t("\uC5B8\uC81C\uB4E0 \uC774\uC6A9\uD560 \uC218 \uC788\uB294 \uBB34\uB8CC \uC0C1\uB2F4", "Free counseling resources")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-800" }, t("\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654", "Suicide Prevention Hotline")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, t("24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uBCF4\uAC74\uBCF5\uC9C0\uBD80", "24/7 Free \xB7 Ministry of Health"))), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "tel:109",
        className: "bg-rose-50 text-rose-600 font-bold text-xl px-4 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition"
      },
      "109"
    )), /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-100" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-800" }, t("\uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654", "Mental Health Crisis Line")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, t("24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uC804\uAD6D \uC5F0\uACB0", "24/7 Free \xB7 Nationwide"))), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "tel:15770199",
        className: "bg-blue-50 text-blue-600 font-bold text-sm px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap"
      },
      "1577-0199"
    )), /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-100" }), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "https://blutouch.net/facility/center",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "flex items-center justify-between p-1 rounded-lg hover:bg-teal-50 transition group"
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-800" }, t("\uC9C0\uC5ED \uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130 \uCC3E\uAE30", "Find a Local Mental Health Center")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, t("\uC804\uAD6D \uC2DC\xB7\uAD70\xB7\uAD6C \uBB34\uB8CC \uBC29\uBB38 \uC0C1\uB2F4 \xB7 \uBE14\uB8E8\uD130\uCE58", "Free in-person counseling nationwide \xB7 Blutouch"))),
      /* @__PURE__ */ React.createElement("span", { className: "text-teal-500 text-sm font-bold group-hover:translate-x-0.5 transition-transform" }, "\u2192")
    ))));
  }
  const CookieBanner = () => !showCookieBanner ? null : /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm flex-1 text-gray-200" }, t("\uC800\uD76C \uC11C\uBE44\uC2A4\uB294 \uD544\uC218 \uCFE0\uD0A4\uB9CC \uC0AC\uC6A9\uD569\uB2C8\uB2E4. \uB85C\uADF8\uC778 \uC0C1\uD0DC \uC720\uC9C0\uC640 \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC5D0 \uD544\uC694\uD55C \uCD5C\uC18C\uD55C\uC758 \uC815\uBCF4\uB9CC \uC800\uC7A5\uB429\uB2C8\uB2E4.", "We use only essential cookies \u2014 the minimum needed to keep you logged in and deliver the service."), " ", /* @__PURE__ */ React.createElement("button", { onClick: () => setView("privacy"), className: "underline text-green-400 hover:text-green-100" }, t("\uC790\uC138\uD788 \uBCF4\uAE30", "Learn more"))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 shrink-0" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        localStorage.setItem("cookie_consent", "accepted");
        setShowCookieBanner(false);
      },
      className: "bg-green-600 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
    },
    t("\uB3D9\uC758", "Accept")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        localStorage.setItem("cookie_consent", "essential");
        setShowCookieBanner(false);
      },
      className: "bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded-lg transition"
    },
    t("\uD544\uC218\uB9CC", "Essential only")
  ))));
  if (initializing) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32 } }, "\u{1F33F}"));
  const isProtectedView = PROTECTED_VIEWS.has(view);
  const ProtectionLayers = isProtectedView ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(WatermarkOverlay, { email: currentUser == null ? void 0 : currentUser.email }), devToolsOpen && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.93)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Noto Sans KR', sans-serif"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, marginBottom: 16 } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", { style: { color: "white", fontSize: 20, fontWeight: 700, marginBottom: 10 } }, "\uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uAC00 \uAC10\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { color: "#9CA3AF", fontSize: 14, textAlign: "center", lineHeight: 1.8 } }, "\uCF58\uD150\uCE20 \uBCF4\uD638\uB97C \uC704\uD574 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uB97C \uB2EB\uC544\uC8FC\uC138\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uB2EB\uC73C\uBA74 \uC790\uB3D9\uC73C\uB85C \uD574\uC81C\uB429\uB2C8\uB2E4."))) : null;
  if (view === "partnerIntro") return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#FDF7F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 400, width: "100%", background: "white", borderRadius: 24, padding: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, marginBottom: 16 } }, "\u{1F495}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 } }, partnerMode == null ? void 0 : partnerMode.hostName, "\uB2D8\uC758 \uCEE4\uD50C \uBD84\uC11D \uCD08\uB300"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.8 } }, "\uD568\uAED8 \uC2EC\uB9AC\uAC80\uC0AC\uB97C \uC644\uB8CC\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uCEE4\uD50C \uAD81\uD569 \uB9AC\uD3EC\uD2B8\uB97C \uBC1B\uC544\uBCFC \uC218 \uC788\uC5B4\uC694."), /* @__PURE__ */ React.createElement("div", { style: { background: "#FFF0F4", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#C06080", fontWeight: 600 } }, "\uD544\uC694\uD55C \uAC80\uC0AC: ", ((partnerMode == null ? void 0 : partnerMode.testType) || "").split("+").map((t2, i, arr) => /* @__PURE__ */ React.createElement("span", { key: t2 }, t2 === "DSI" ? "SDRI \uC790\uC544\uBD84\uD654" : t2, i < arr.length - 1 ? " + " : ""))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("partnerTest:" + (partnerMode == null ? void 0 : partnerMode.pendingTests[0])),
      style: { width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #E87090, #F5A0B5)", color: "white", fontWeight: 700, fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif" }
    },
    "\uAC80\uC0AC \uC2DC\uC791\uD558\uAE30"
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#BBB", marginTop: 12 } }, "\uB85C\uADF8\uC778 \uC5C6\uC774 \uCC38\uC5EC \uAC00\uB2A5\uD569\uB2C8\uB2E4")));
  if (view === "partnerComplete") return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#FDF7F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 400, width: "100%", background: "white", borderRadius: 24, padding: 40, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 56, marginBottom: 16 } }, "\u{1F389}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#2D2D2D", marginBottom: 12 } }, "\uAC80\uC0AC \uC644\uB8CC!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#888", lineHeight: 1.8 } }, partnerMode == null ? void 0 : partnerMode.hostName, "\uB2D8\uC774 \uC774\uC81C", /* @__PURE__ */ React.createElement("br", null), "\uCEE4\uD50C \uB9AC\uD3EC\uD2B8\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#BBB", fontSize: 12 } }, "\uCC3D\uC744 \uB2EB\uC544\uB3C4 \uB429\uB2C8\uB2E4."))));
  if (view === "landing") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    GlobalNav,
    {
      setView,
      isLoggedIn,
      currentUser,
      credits,
      activeView: "landing",
      lang,
      onLangToggle: updateLang
    }
  ), /* @__PURE__ */ React.createElement(LandingPage, { setView, isLoggedIn, lang, setMyPageTab, loadTestHistory, setAutoOpenExternal: setShowExternalModal }), isLoggedIn && /* @__PURE__ */ React.createElement(ExternalResultSection, { onSaved: loadTestHistory, hideTrigger: true, externalShow: showExternalModal, setExternalShow: setShowExternalModal }), isMaster && /* @__PURE__ */ React.createElement(MasterDebugPanel, null));
  if (view === "testsIntro") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    GlobalNav,
    {
      setView,
      isLoggedIn,
      currentUser,
      credits,
      activeView: "testsIntro",
      lang,
      onLangToggle: updateLang
    }
  ), /* @__PURE__ */ React.createElement(TestsIntroPage, { setView, isLoggedIn, lang }));
  if (view === "counseling") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    GlobalNav,
    {
      setView,
      isLoggedIn,
      currentUser,
      credits,
      activeView: "counseling",
      lang,
      onLangToggle: updateLang
    }
  ), /* @__PURE__ */ React.createElement(
    CounselingPage,
    {
      setView,
      lang
    }
  ));
  if (view === "counselingAdmin") return /* @__PURE__ */ React.createElement(CounselingAdminPage, { setView });
  if (view === "gameIntro") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    GlobalNav,
    {
      setView,
      isLoggedIn,
      currentUser,
      credits,
      activeView: "gameIntro",
      lang,
      onLangToggle: updateLang
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Noto Sans KR',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 64 } }, "\u{1F3AE}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 28, fontWeight: 700 } }, "\uB9C8\uC74C \uAC8C\uC784"), /* @__PURE__ */ React.createElement("p", { style: { color: "#5A5A5A", fontSize: 16 } }, "\uD604\uC7AC \uAC1C\uBC1C \uC911\uC785\uB2C8\uB2E4. \uACE7 \uCD9C\uC2DC\uB429\uB2C8\uB2E4!"), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("landing"), style: { marginTop: 8, background: "#2D6A4F", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" } }, "\u2190 \uD648\uC73C\uB85C")));
  if (!isLoggedIn && view === "memberLogin") return /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-slate-50 to-green-100 flex flex-col items-center px-4 py-10", style: { minHeight: "100dvh" } }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("landing"),
      className: "flex items-center gap-1 text-gray-400 hover:text-green-700 text-sm mb-4 transition"
    },
    t("\u2190 \uD648\uC73C\uB85C", "\u2190 Home")
  ), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-7" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl mb-3" }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-800" }, "Maumful"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm mt-1" }, t("\uB098\uB97C \uC774\uD574\uD558\uB294 \uCCAB\uAC78\uC74C", "Your first step to self-understanding"))), sessionStorage.getItem("pending_ref_code") && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F381} \uCD08\uB300 \uB9C1\uD06C\uB85C \uC811\uC18D\uD558\uC168\uC2B5\uB2C8\uB2E4! \uAC00\uC785 \uD6C4 ", /* @__PURE__ */ React.createElement("strong", null, "+10 \uD06C\uB808\uB527"), "\uC774 \uCD94\uAC00 \uC9C0\uAE09\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F381} You joined via invite! Sign up to get ", /* @__PURE__ */ React.createElement("strong", null, "+10 bonus credits"), "."))), /* @__PURE__ */ React.createElement(Msg, { msg: loginMsg, extra: loginMsg.type === "error" && pendingVerifyEmail ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        const r = await fetch("/api/auth/resend-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingVerifyEmail })
        });
        const d = await r.json();
        setLoginMsg({
          type: d.success ? "success" : "error",
          text: d.success ? t("\u2705 \uC778\uC99D \uBA54\uC77C\uC744 \uC7AC\uBC1C\uC1A1\uD588\uC2B5\uB2C8\uB2E4. \uBA54\uC77C\uD568\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.", "\u2705 Verification email resent. Please check your inbox.") : d.error || t("\uC7AC\uBC1C\uC1A1 \uC2E4\uD328", "Resend failed")
        });
        if (d.success) setPendingVerifyEmail("");
      },
      className: "mt-2 block text-xs font-semibold underline text-red-500 hover:text-red-700 cursor-pointer"
    },
    t("\u{1F4E7} \uC778\uC99D \uBA54\uC77C \uC7AC\uBC1C\uC1A1\uD558\uAE30", "\u{1F4E7} Resend verification email")
  ) : null }), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 mb-5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "login-email",
      type: "email",
      placeholder: t("\uC774\uBA54\uC77C", "Email"),
      autoComplete: "email",
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm",
      onKeyDown: (e) => e.key === "Enter" && document.getElementById("login-pw").focus()
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "login-pw",
      type: "password",
      placeholder: t("\uBE44\uBC00\uBC88\uD638 (8\uC790 \uC774\uC0C1)", "Password (min. 8 chars)"),
      autoComplete: "current-password",
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm",
      onKeyDown: (e) => e.key === "Enter" && handleLogin()
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleLogin,
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-4 text-base"
    },
    t("\uB85C\uADF8\uC778", "Sign In")
  ), (window.KAKAO_APP_KEY || window.GOOGLE_CLIENT_ID || window.NAVER_CLIENT_ID) && /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-4" }, window.NAVER_CLIENT_ID && /* @__PURE__ */ React.createElement(NaverLoginBtn, { onLogin: handleNaverLogin }), window.GOOGLE_CLIENT_ID && /* @__PURE__ */ React.createElement(GoogleSignInBtn, { onLogin: handleGoogleLogin, btnText: "signin_with" })), /* @__PURE__ */ React.createElement("div", { className: "relative mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full border-t border-gray-200" })), /* @__PURE__ */ React.createElement("div", { className: "relative flex justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 bg-white text-gray-400 text-xs" }, t("\uB610\uB294", "or")))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("memberSignup"),
      className: "w-full bg-white border-2 border-green-200 text-green-800 py-3 rounded-xl font-semibold hover:bg-green-50 transition mb-3"
    },
    t("\uC774\uBA54\uC77C\uB85C \uD68C\uC6D0\uAC00\uC785", "Sign up with email")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setLoginMsg({ type: "", text: "" });
        setView("forgotPassword");
      },
      className: "w-full text-center text-gray-400 text-sm hover:text-gray-600 py-1"
    },
    t("\uBE44\uBC00\uBC88\uD638\uB97C \uC78A\uC73C\uC168\uB098\uC694?", "Forgot your password?")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        var _a2;
        const email = (_a2 = document.getElementById("login-email")) == null ? void 0 : _a2.value.trim();
        if (!email) {
          setLoginMsg({ type: "error", text: t("\uC774\uBA54\uC77C\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694.", "Please enter your email first.") });
          return;
        }
        setLoginMsg({ type: "loading", text: t("\uC778\uC99D \uBA54\uC77C \uBC1C\uC1A1 \uC911...", "Sending verification email...") });
        const r = await fetch("/api/auth/resend-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        }).then((r2) => r2.json());
        setLoginMsg({ type: r.success ? "success" : "error", text: r.message || r.error });
        setTimeout(() => setLoginMsg({ type: "", text: "" }), 5e3);
      },
      className: "w-full text-center text-gray-300 text-xs hover:text-gray-500 py-1"
    },
    t("\uC778\uC99D \uBA54\uC77C\uC744 \uBC1B\uC9C0 \uBABB\uD558\uC168\uB098\uC694? \uC7AC\uBC1C\uC1A1", "Didn't receive verification email? Resend")
  ), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-4 mt-3" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("privacy"), className: "text-xs text-gray-300 hover:text-gray-500" }, t("\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68", "Privacy Policy")), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 text-xs" }, "|"), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("terms"), className: "text-xs text-gray-300 hover:text-gray-500" }, t("\uC774\uC6A9\uC57D\uAD00", "Terms of Service")))));
  if (!isLoggedIn && view === "memberSignup") return /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-slate-50 to-green-100 flex flex-col items-center px-4 py-10", style: { minHeight: "100dvh" } }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setView("memberLogin");
        setFormMsg({ type: "", text: "" });
        setSignupForm({ email: "", password: "", pwConfirm: "", nickname: "" });
      },
      className: "text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1"
    },
    "\u2190 ",
    t("\uB4A4\uB85C", "Back")
  ), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-2" }, "\u2728"), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-800" }, t("\uD68C\uC6D0\uAC00\uC785", "Sign Up")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-1" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC00\uC785 \uC2DC ", /* @__PURE__ */ React.createElement("span", { className: "text-green-700 font-semibold" }, "20 \uD06C\uB808\uB527"), " \uC989\uC2DC \uC9C0\uAE09"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Get ", /* @__PURE__ */ React.createElement("span", { className: "text-green-700 font-semibold" }, "20 credits"), " instantly on signup")))), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 rounded-xl p-3 mb-5 text-sm text-green-800 space-y-0.5" }, /* @__PURE__ */ React.createElement("p", null, "\u2726 ", t("\uAC00\uC785 \uBCF4\uB108\uC2A4 20 \uD06C\uB808\uB527 (\uAC80\uC0AC 2\uD68C)", "Signup bonus: 20 credits (2 tests)")), /* @__PURE__ */ React.createElement("p", null, "\u2726 ", t("PHQ9\xB7GAD7 \uC2EC\uB9AC\uAC80\uC0AC \uBB34\uB8CC \uC81C\uACF5", "PHQ-9 & GAD-7 assessments free")), /* @__PURE__ */ React.createElement("p", null, "\u2726 ", t("AI \uCC44\uD305 \uD558\uB8E8 5\uD68C \uBB34\uB8CC", "5 free AI chats per day"))), /* @__PURE__ */ React.createElement(Msg, { msg: formMsg }), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 mb-5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      placeholder: t("\uC774\uBA54\uC77C", "Email"),
      value: signupForm.email,
      onChange: (e) => setSignupForm((p) => ({ ...p, email: e.target.value })),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: t("\uB2C9\uB124\uC784 (AI \uC0C1\uB2F4\uC5D0\uC11C \uC774\uB984\uC73C\uB85C \uBD88\uB824\uC694)", "Nickname (used in AI sessions)"),
      value: signupForm.nickname,
      onChange: (e) => setSignupForm((p) => ({ ...p, nickname: e.target.value })),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [["\uB0A8\uC131", t("\uB0A8\uC131", "Male")], ["\uC5EC\uC131", t("\uC5EC\uC131", "Female")], ["\uC120\uD0DD\uC548\uD568", t("\uC120\uD0DD\uC548\uD568", "Prefer not to say")]].map(([val, lbl]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: val,
      type: "button",
      onClick: () => setSignupForm((p) => ({ ...p, gender: p.gender === val ? "" : val })),
      className: `flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${signupForm.gender === val ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500"}`
    },
    lbl
  ))), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: signupForm.age_range,
      onChange: (e) => setSignupForm((p) => ({ ...p, age_range: e.target.value })),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm text-gray-600 bg-white"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t("\uC5F0\uB839\uB300 \uC120\uD0DD (\uC120\uD0DD)", "Age range (optional)")),
    ["10\uB300", "20\uB300", "30\uB300", "40\uB300", "50\uB300", "60\uB300\uC774\uC0C1"].map((a) => /* @__PURE__ */ React.createElement("option", { key: a, value: a }, a))
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      placeholder: t("\uD578\uB4DC\uD3F0\uBC88\uD638 (\uC120\uD0DD) \u2014 010-1234-5678", "Phone (optional) \u2014 010-1234-5678"),
      value: signupForm.phone,
      onChange: (e) => {
        const v = e.target.value.replace(/[^\d-]/g, "");
        setSignupForm((p) => ({ ...p, phone: v }));
      },
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      placeholder: t("\uBE44\uBC00\uBC88\uD638 (8\uC790 \uC774\uC0C1)", "Password (min. 8 chars)"),
      value: signupForm.password,
      onChange: (e) => setSignupForm((p) => ({ ...p, password: e.target.value })),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      placeholder: t("\uBE44\uBC00\uBC88\uD638 \uD655\uC778", "Confirm password"),
      value: signupForm.pwConfirm,
      onChange: (e) => setSignupForm((p) => ({ ...p, pwConfirm: e.target.value })),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm",
      onKeyDown: (e) => e.key === "Enter" && handleSignup()
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "mb-4 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 space-y-2" }, (() => {
    const allRequired = signupConsents.terms && signupConsents.privacy && signupConsents.sensitive && signupConsents.overseas && signupConsents.age;
    const allIncMarketing = allRequired && signupConsents.marketing;
    return /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-200" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        className: "w-4 h-4 accent-green-600",
        checked: allIncMarketing,
        onChange: (e) => {
          const v = e.target.checked;
          setSignupConsents({ terms: v, privacy: v, sensitive: v, overseas: v, age: v, marketing: v });
        }
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800 text-sm" }, t("\uC804\uCCB4 \uB3D9\uC758 (\uD544\uC218 + \uC120\uD0DD \uD3EC\uD568)", "Agree to all (required + optional)")));
  })(), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 font-semibold pt-1" }, t("\u2014 \uD544\uC218 \uB3D9\uC758 \uD56D\uBAA9 \u2014", "\u2014 Required \u2014")), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.terms,
      onChange: (e) => setSignupConsents((p) => ({ ...p, terms: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setView("terms"), className: "text-green-600 underline font-semibold" }, t("\uC774\uC6A9\uC57D\uAD00", "Terms of Service")), " ", t("\uB3D9\uC758", "agree"), /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, t("(\uD544\uC218)", "(required)")))), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.privacy,
      onChange: (e) => setSignupConsents((p) => ({ ...p, privacy: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setView("privacy"), className: "text-green-600 underline font-semibold" }, t("\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1\xB7\uC774\uC6A9", "Privacy Collection & Use")), " ", t("\uB3D9\uC758", "agree"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 ml-1" }, t("(\uC774\uBA54\uC77C\xB7\uB2C9\uB124\uC784\xB7\uC131\uBCC4\xB7\uC5F0\uB839\uB300\xB7\uC5F0\uB77D\uCC98\xB7\uC774\uC6A9\uAE30\uB85D / \uC11C\uBE44\uC2A4 \uC81C\uACF5 / \uD0C8\uD1F4 \uC2DC\uAE4C\uC9C0)", "(email\xB7nickname\xB7gender\xB7age\xB7phone\xB7usage / service / until withdrawal)")), /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, t("(\uD544\uC218)", "(required)")))), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.sensitive,
      onChange: (e) => setSignupConsents((p) => ({ ...p, sensitive: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, t("\uBBFC\uAC10\uC815\uBCF4(\uC815\uC2E0\uAC74\uAC15 \uC815\uBCF4)", "Sensitive Info (Mental Health)")), " ", t("\uC218\uC9D1\xB7\uCC98\uB9AC \uB3D9\uC758", "Collection & Processing"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 ml-1" }, t("(\uC2EC\uB9AC\uAC80\uC0AC\xB7AI \uC0C1\uB2F4 \uB0B4\uC6A9)", "(assessments & AI sessions)")), /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, t("(\uD544\uC218)", "(required)")))), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.overseas,
      onChange: (e) => setSignupConsents((p) => ({ ...p, overseas: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, t("\uAC1C\uC778\uC815\uBCF4 \uC81C3\uC790 \uC81C\uACF5", "Third-party Data Transfer")), " ", t("\uB3D9\uC758", "agree"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 ml-1" }, t("(Anthropic Inc., \uBBF8\uAD6D / AI \uC0C1\uB2F4 \uAE30\uB2A5 \uC81C\uACF5)", "(Anthropic Inc., USA / AI counseling)")), /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, t("(\uD544\uC218)", "(required)")))), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.age,
      onChange: (e) => setSignupConsents((p) => ({ ...p, age: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uBCF8\uC778\uC740 ", /* @__PURE__ */ React.createElement("strong", null, "\uB9CC 14\uC138 \uC774\uC0C1"), "\uC784\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "I confirm I am ", /* @__PURE__ */ React.createElement("strong", null, "14 years or older"), ".")), /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, t("(\uD544\uC218)", "(required)")))), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 font-semibold pt-2" }, t("\u2014 \uC120\uD0DD \uB3D9\uC758 \uD56D\uBAA9 \u2014", "\u2014 Optional \u2014")), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0",
      checked: signupConsents.marketing,
      onChange: (e) => setSignupConsents((p) => ({ ...p, marketing: e.target.checked }))
    }
  ), /* @__PURE__ */ React.createElement("span", null, t("\uB9C8\uCF00\uD305 \uC815\uBCF4 \uC218\uC2E0 \uB3D9\uC758", "Marketing communications"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 ml-1" }, t("(\uC2E0\uADDC \uAE30\uB2A5\xB7\uC774\uBCA4\uD2B8\xB7\uD61C\uD0DD \uC548\uB0B4, \uC774\uBA54\uC77C)", "(new features, events, offers via email)")), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 ml-1" }, t("(\uC120\uD0DD \u2014 \uBBF8\uB3D9\uC758 \uC2DC\uC5D0\uB3C4 \uC11C\uBE44\uC2A4 \uC774\uC6A9 \uAC00\uB2A5)", "(optional \u2014 service available without consent)"))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSignup,
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition mb-4"
    },
    t("\uAC00\uC785\uD558\uAE30", "Sign Up")
  ), (window.KAKAO_APP_KEY || window.GOOGLE_CLIENT_ID || window.NAVER_CLIENT_ID) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "relative mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full border-t border-gray-200" })), /* @__PURE__ */ React.createElement("div", { className: "relative flex justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 bg-white text-gray-400 text-xs" }, t("\uB610\uB294 \uC18C\uC15C \uACC4\uC815\uC73C\uB85C \uC2DC\uC791", "or continue with social")))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, window.NAVER_CLIENT_ID && /* @__PURE__ */ React.createElement(NaverLoginBtn, { onLogin: handleNaverLogin }), window.GOOGLE_CLIENT_ID && /* @__PURE__ */ React.createElement(GoogleSignInBtn, { onLogin: handleGoogleLogin, btnText: "signup_with" })))));
  if (isLoggedIn && view === "memberOnboarding") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-7" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl mb-3" }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-800" }, t(`\uD658\uC601\uD569\uB2C8\uB2E4, ${(currentUser == null ? void 0 : currentUser.nickname) || "\uD68C\uC6D0"}\uB2D8!`, `Welcome, ${(currentUser == null ? void 0 : currentUser.nickname) || "member"}!`)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-2" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB9C8\uC74C\uD480\uC744 \uC2DC\uC791\uD558\uAE30 \uC804\uC5D0", /* @__PURE__ */ React.createElement("br", null), "AI \uC0C1\uB2F4 \uD574\uC11D \uBC29\uC2DD\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Before you start", /* @__PURE__ */ React.createElement("br", null), "choose how AI interprets your results")))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 text-center mb-3" }, t("\uAC80\uC0AC \uACB0\uACFC\uB97C \uC5B4\uB5A4 \uAD00\uC810\uC73C\uB85C \uD574\uC11D\uD560\uAE4C\uC694?", "How should we interpret your results?")), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3 mb-6" }, [
    {
      mode: "psychological",
      icon: "\u{1F9E0}",
      label: t("\uC2EC\uB9AC\uC0C1\uB2F4 (\uAE30\uBCF8)", "Psychology (default)"),
      desc: t("\uC2EC\uB9AC\uD559 \uC774\uB860\uACFC \uACFC\uD559\uC801 \uADFC\uAC70\uB97C \uBC14\uD0D5\uC73C\uB85C \uD574\uC11D\uD569\uB2C8\uB2E4", "Interpreted through psychological theory and scientific evidence"),
      activeClass: "border-green-500 bg-green-50",
      checkClass: "text-green-600"
    },
    {
      mode: "biblical",
      icon: "\u271D\uFE0F",
      label: t("\uAE30\uB3C5\uAD50 \uC0C1\uB2F4", "Christian Counseling"),
      desc: t("\uC131\uACBD \uB9D0\uC500\uACFC \uAE30\uB3C5\uAD50 \uC2E0\uC559\uC744 \uAE30\uBC18\uC73C\uB85C \uD574\uC11D\uD569\uB2C8\uB2E4", "Interpreted through Scripture and Christian faith"),
      activeClass: "border-purple-400 bg-purple-50",
      checkClass: "text-purple-600"
    }
  ].map(({ mode, icon, label, desc, activeClass, checkClass }) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: mode,
      onClick: () => updateCounselingMode(mode),
      className: `flex items-start gap-3 p-4 rounded-xl border-2 text-left transition w-full
                ${counselingMode === mode ? activeClass : "border-gray-100 hover:border-gray-300"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "text-2xl mt-0.5" }, icon),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: `font-semibold text-sm ${counselingMode === mode ? checkClass : "text-gray-700"}` }, label), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-1" }, desc)),
    counselingMode === mode && /* @__PURE__ */ React.createElement("span", { className: `${checkClass} font-bold text-lg` }, "\u2713")
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 rounded-xl p-4 mb-6" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-green-800" }, "\u2726 ", t("\uAC00\uC785 \uBCF4\uB108\uC2A4 10 \uD06C\uB808\uB527 \uC9C0\uAE09 \uC644\uB8CC!", "Signup bonus of 10 credits applied!")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 mt-1" }, t("\uC2EC\uB9AC\uAC80\uC0AC 1\uD68C + AI \uCC44\uD305 2\uD68C\uB97C \uBB34\uB8CC\uB85C \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694", "Use 1 assessment + 2 AI chats for free"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        loadTestHistory();
        setView("memberDashboard");
      },
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition text-base"
    },
    t("\uC2EC\uB9AC\uAC80\uC0AC \uC2DC\uC791\uD558\uAE30 \u2192", "Start Assessments \u2192")
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-300 text-center mt-3" }, t("\uB9C8\uC774\uD398\uC774\uC9C0 \u2192 \uC124\uC815\uC5D0\uC11C \uC5B8\uC81C\uB4E0 \uBCC0\uACBD\uD560 \uC218 \uC788\uC5B4\uC694", "You can change this anytime in My Info \u2192 Settings"))));
  if (!isLoggedIn && view === "forgotPassword") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberLogin"), className: "text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1" }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-2" }, "\u{1F511}"), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-800" }, t("\uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30", "Forgot Password")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-1" }, t("\uAC00\uC785\uD55C \uC774\uBA54\uC77C\uB85C \uC7AC\uC124\uC815 \uB9C1\uD06C\uB97C \uBCF4\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4", "We'll send a reset link to your registered email"))), /* @__PURE__ */ React.createElement(Msg, { msg: formMsg }), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "forgot-email",
      type: "email",
      placeholder: t("\uAC00\uC785\uD55C \uC774\uBA54\uC77C", "Registered email"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm mb-4"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        var _a2;
        const email = (_a2 = document.getElementById("forgot-email")) == null ? void 0 : _a2.value.trim();
        if (!email) {
          setFormMsg({ type: "error", text: t("\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.", "Please enter your email.") });
          return;
        }
        setFormMsg({ type: "loading", text: t("\uC804\uC1A1 \uC911...", "Sending...") });
        const r = await api.forgotPassword(email);
        setFormMsg({ type: "success", text: r.message || t("\uC7AC\uC124\uC815 \uB9C1\uD06C\uB97C \uBC1C\uC1A1\uD588\uC2B5\uB2C8\uB2E4.", "Reset link sent.") });
      },
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition"
    },
    t("\uC7AC\uC124\uC815 \uB9C1\uD06C \uC804\uC1A1", "Send Reset Link")
  )));
  function LegalPage({ title, onBack, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-3 flex items-center gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, className: "text-gray-400 hover:text-gray-600 text-sm" }, "\u2190 \uB4A4\uB85C"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, title))), /* @__PURE__ */ React.createElement("main", { className: "max-w-2xl mx-auto px-4 py-8 prose prose-sm text-gray-700" }, children));
  }
  if (view === "aiCounsel") {
    const hasResponses = {
      PHQ9: Object.keys(phq9Responses).length > 0,
      GAD7: Object.keys(gad7Responses).length > 0,
      BIG5: Object.keys(big5Responses || {}).length > 0,
      DASS21: Object.keys(dass21Responses || {}).length > 0,
      LOST: Object.keys(lostResponses || {}).length > 0,
      DSI: Object.keys(sdriResponses || {}).length >= sdriLikertQ.length,
      BURNOUT: Object.keys(burnoutResponses || {}).length > 0
    };
    const resultViews = {
      PHQ9: "phq9Result",
      GAD7: "gad7Result",
      BIG5: "big5Result",
      DASS21: "dass21Result",
      LOST: "lostResult",
      DSI: "dsiResult",
      BURNOUT: "burnoutResult"
    };
    const completedThisSession = Object.entries(hasResponses).filter(([, v]) => v).map(([k]) => k);
    const recentTests = testHistory.slice(0, 5);
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-50" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm" }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, "\u{1F916} ", t("AI \uC0C1\uB2F4", "AI Counseling")), /* @__PURE__ */ React.createElement(CreditBadge, null))), /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F9E0}"), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-gray-800 text-lg mb-1" }, t("AI \uC2EC\uB9AC \uC0C1\uB2F4", "AI Psychological Counseling")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C AI\uC640 \uC2EC\uCE35 \uC0C1\uB2F4\uD558\uC138\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uAC80\uC0AC \uACB0\uACFC\uAC00 \uC788\uC73C\uBA74 AI\uAC00 \uACB0\uACFC\uB97C \uBD84\uC11D\uD558\uC5EC \uB9DE\uCDA4 \uC0C1\uB2F4\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Have a deep conversation with AI based on your test results.", /* @__PURE__ */ React.createElement("br", null), "When results are available, AI provides personalized guidance."))), (() => {
      const trendTypes = ["PHQ9", "GAD7", "BURNOUT", "DSI"].filter((tt) => testHistory.filter((h) => h.test_type === tt && h.score != null).length >= 3);
      if (trendTypes.length === 0) return null;
      return /* @__PURE__ */ React.createElement("div", { className: "mt-2 flex flex-wrap gap-1.5" }, trendTypes.map((tt) => /* @__PURE__ */ React.createElement("span", { key: tt, className: "text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-200" }, "\u{1F4C8} ", tt, " ", t("\uD2B8\uB80C\uB4DC \uBD84\uC11D \uD65C\uC131", "trend analysis active"))));
    })())), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed" }, "\u26A0\uFE0F ", /* @__PURE__ */ React.createElement("strong", null, t("\uCC38\uACE0 \uC548\uB0B4:", "Note:")), " ", t("AI \uC0C1\uB2F4\uC740 \uC790\uAE30 \uC774\uD574\uB97C \uC704\uD55C \uCC38\uACE0 \uC815\uBCF4\uC785\uB2C8\uB2E4. \uC758\uD559\uC801 \uC9C4\uB2E8\uC774\uB098 \uCE58\uB8CC\uB97C \uB300\uCCB4\uD558\uC9C0 \uC54A\uC73C\uBA70, \uBAA8\uB4E0 \uB2F5\uBCC0\uC740 \uD655\uC815\uC801 \uACB0\uB860\uC774 \uC544\uB2D9\uB2C8\uB2E4.", "AI counseling is for self-understanding only. It does not replace medical diagnosis or treatment, and responses are not definitive conclusions."))), completedThisSession.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border-2 border-green-300 rounded-2xl p-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-green-800 mb-3" }, "\u2705 ", t("\uBC29\uAE08 \uC644\uB8CC\uD55C \uAC80\uC0AC \uACB0\uACFC\uB85C AI \uC0C1\uB2F4\uD558\uAE30", "Chat with AI about your just-completed results")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 mb-3" }, t("\uAC80\uC0AC \uACB0\uACFC \uD654\uBA74\uC5D0\uC11C AI\uC640 \uC0C1\uB2F4\uD558\uBA74 \uAC80\uC0AC \uB370\uC774\uD130\uAC00 \uC790\uB3D9\uC73C\uB85C \uC804\uB2EC\uB429\uB2C8\uB2E4.", "Your test data is automatically shared when you chat from the result screen.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, completedThisSession.map((tt) => {
      const metaMap = {
        PHQ9: t("\u{1F614} PHQ-9 \uC6B0\uC6B8", "\u{1F614} PHQ-9 Depression"),
        GAD7: t("\u{1F630} GAD-7 \uBD88\uC548", "\u{1F630} GAD-7 Anxiety"),
        BIG5: t("\u{1F31F} Big5 \uC131\uACA9", "\u{1F31F} Big Five"),
        DASS21: "\u{1F4CA} DASS-21",
        LOST: t("\u{1F9ED} LOST \uD589\uB3D9", "\u{1F9ED} LOST Style"),
        DSI: "\u{1FA9E} SDRI",
        BURNOUT: "\u{1F525} K-MBI+"
      };
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: tt,
          onClick: () => setView(resultViews[tt]),
          className: "flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition"
        },
        /* @__PURE__ */ React.createElement("span", null, metaMap[tt]),
        /* @__PURE__ */ React.createElement("span", null, t("\uACB0\uACFC \uBCF4\uACE0 \uC0C1\uB2F4 \u2192", "View & chat \u2192"))
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-700 mb-1" }, "\u{1F4A1} ", t("\uC0C8 \uAC80\uC0AC \uD6C4 \uC0C1\uB2F4\uD558\uAE30 (\uB354 \uC815\uD655\uD55C \uC0C1\uB2F4)", "Take a new test then chat (more accurate)")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-3" }, t("\uAC80\uC0AC \uC644\uB8CC \uD6C4 \uACB0\uACFC \uD654\uBA74\uC5D0\uC11C AI \uC0C1\uB2F4 \uBC84\uD2BC\uC744 \uB204\uB974\uC138\uC694", "After the test, tap the AI chat button on the result screen")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, [
      { id: "PHQ9", label: t("PHQ-9 \uC6B0\uC6B8", "PHQ-9 Depression"), emoji: "\u{1F331}", view: "phq9Test" },
      { id: "GAD7", label: t("GAD-7 \uBD88\uC548", "GAD-7 Anxiety"), emoji: "\u{1F499}", view: "gad7Test" },
      { id: "LOST", label: t("LOST \uD589\uB3D9", "LOST Style"), emoji: "\u{1F9ED}", view: "lostTest" }
    ].map((tt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tt.id,
        onClick: () => setView(tt.view),
        className: "flex items-center gap-1.5 bg-white border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-100 transition"
      },
      /* @__PURE__ */ React.createElement("span", null, tt.emoji),
      /* @__PURE__ */ React.createElement("span", null, tt.label),
      /* @__PURE__ */ React.createElement("span", { className: "text-green-400" }, t("\uBB34\uB8CC", "Free"))
    )))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "px-5 pt-4 pb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-700 mb-1" }, "\u{1F4AC} ", t("\uAC80\uC0AC \uC5C6\uC774 \uBC14\uB85C \uC0C1\uB2F4\uD558\uAE30", "Chat without a test")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, t("\uAC80\uC0AC \uACB0\uACFC \uC5C6\uC774 AI\uC640 \uC790\uC720\uB86D\uAC8C \uB300\uD654\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4", "Talk freely with AI without any test results"))), /* @__PURE__ */ React.createElement(ChatBox, { testType: "GENERAL", initialPrompts: t([
      "\uC694\uC998 \uB9C8\uC74C\uC774 \uBB34\uAC81\uACE0 \uC9C0\uCCD0\uC788\uC5B4\uC694. \uC5B4\uB5BB\uAC8C \uD558\uBA74 \uC88B\uC744\uAE4C\uC694?",
      "\uBD88\uC548\uAC10\uC774 \uC790\uC8FC \uC0DD\uAE30\uB294\uB370 \uC5B4\uB5BB\uAC8C \uB2E4\uB8E8\uBA74 \uC88B\uC744\uAE4C\uC694?",
      "\uC9C1\uC7A5 \uC2A4\uD2B8\uB808\uC2A4\uB85C \uD798\uB4E0\uB370 \uB3C4\uC6C0\uC774 \uD544\uC694\uD574\uC694",
      "\uC2A4\uC2A4\uB85C\uB97C \uC774\uD574\uD558\uACE0 \uC2F6\uC5B4\uC694. \uC5B4\uB514\uC11C\uBD80\uD130 \uC2DC\uC791\uD560\uAE4C\uC694?"
    ], [
      "I've been feeling heavy and exhausted lately. What should I do?",
      "I often feel anxious. How can I manage it better?",
      "Work stress is overwhelming me. I need some help.",
      "I want to understand myself better. Where do I start?"
    ]) })), /* @__PURE__ */ React.createElement(ExpertCTA, { testType: "GENERAL", score: 0, level: "low", onContinueAI: null })));
  }
  if (view === "privacy") return /* @__PURE__ */ React.createElement(LegalPage, { title: "\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68", onBack: () => setView(isLoggedIn ? "memberDashboard" : "memberLogin") }, /* @__PURE__ */ React.createElement("h2", null, "\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68"), /* @__PURE__ */ React.createElement("p", null, '\uB9C8\uC74C\uD480(\uC774\uD558 "\uC11C\uBE44\uC2A4")\uC740 \u300C\uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638\uBC95\u300D\uC744 \uC900\uC218\uD558\uBA70 \uC774\uC6A9\uC790\uC758 \uAC1C\uC778\uC815\uBCF4\uB97C \uBCF4\uD638\uD569\uB2C8\uB2E4.'), /* @__PURE__ */ React.createElement("h3", null, "1. \uC218\uC9D1\uD558\uB294 \uAC1C\uC778\uC815\uBCF4 \uD56D\uBAA9"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uC77C\uBC18 \uAC1C\uC778\uC815\uBCF4 (\uD544\uC218)")), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC774\uBA54\uC77C \uC8FC\uC18C, \uB2C9\uB124\uC784, \uC811\uC18D \uAD6D\uAC00 \uCF54\uB4DC")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uC77C\uBC18 \uAC1C\uC778\uC815\uBCF4 (\uC120\uD0DD \u2014 \uBBF8\uC81C\uACF5 \uC2DC\uC5D0\uB3C4 \uC11C\uBE44\uC2A4 \uC774\uC6A9 \uAC00\uB2A5)")), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC131\uBCC4, \uC5F0\uB839\uB300, \uD578\uB4DC\uD3F0\uBC88\uD638")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uBBFC\uAC10\uC815\uBCF4 (\uBCC4\uB3C4 \uB3D9\uC758 \uD6C4 \uC218\uC9D1)")), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC2EC\uB9AC\uAC80\uC0AC \uC751\uB2F5 \uB370\uC774\uD130 \uBC0F \uACB0\uACFC (PHQ-9, GAD-7, DASS-21, BIG5 \uB4F1)"), /* @__PURE__ */ React.createElement("li", null, "AI \uC0C1\uB2F4 \uCC44\uD305 \uB0B4\uC6A9 (\uC815\uC2E0\uAC74\uAC15 \uAD00\uB828 \uC815\uBCF4 \uD3EC\uD568 \uAC00\uB2A5)")), /* @__PURE__ */ React.createElement("p", { style: { color: "#dc2626", fontSize: "13px" } }, "\u203B \uBBFC\uAC10\uC815\uBCF4\uB294 \uD68C\uC6D0\uAC00\uC785 \uC2DC \uBCC4\uB3C4 \uB3D9\uC758\uB97C \uBC1B\uC73C\uBA70, \uB3D9\uC758\uB97C \uAC70\uBD80\uD558\uC2E4 \uACBD\uC6B0 \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC774 \uC81C\uD55C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h3", null, "2. \uAC1C\uC778\uC815\uBCF4 \uC774\uC6A9 \uBAA9\uC801"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uD68C\uC6D0 \uC2DD\uBCC4 \uBC0F \uB85C\uADF8\uC778 \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("li", null, "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC \uC81C\uACF5 \uBC0F AI \uC0C1\uB2F4 \uC11C\uBE44\uC2A4 \uC6B4\uC601"), /* @__PURE__ */ React.createElement("li", null, "\uD06C\uB808\uB527 \uC794\uC561 \uAD00\uB9AC \uBC0F \uACB0\uC81C \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4 \uC774\uBA54\uC77C \uBC1C\uC1A1 (\uC778\uC99D, \uC548\uB0B4)"), /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4 \uAC1C\uC120\uC744 \uC704\uD55C \uD1B5\uACC4 \uBD84\uC11D (\uC775\uBA85 \uCC98\uB9AC)")), /* @__PURE__ */ React.createElement("h3", null, "3. \uAC1C\uC778\uC815\uBCF4 \uBCF4\uC720 \uBC0F \uD30C\uAE30"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uD68C\uC6D0 \uC815\uBCF4:"), " \uD0C8\uD1F4 \uC989\uC2DC \uC775\uBA85\uD654 \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uACB0\uC81C \uAE30\uB85D:"), " \uC804\uC790\uC0C1\uAC70\uB798\uBC95\uC5D0 \uB530\uB77C 5\uB144 \uBCF4\uAD00"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uAC80\uC0AC \uAE30\uB85D:"), " \uD0C8\uD1F4 \uC989\uC2DC \uC0AD\uC81C"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "AI \uCC44\uD305 \uB0B4\uC6A9:"), " \uC11C\uBE44\uC2A4\uC5D0 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC73C\uBA70 \uCC98\uB9AC \uD6C4 \uC989\uC2DC \uD3D0\uAE30")), /* @__PURE__ */ React.createElement("h3", null, "4. \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC \uC704\uD0C1 \uBC0F \uAD6D\uC678 \uC774\uC804"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uAD6D\uB0B4 \uC704\uD0C1")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#F9FAFB" } }, /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uC218\uD0C1\uC5C5\uCCB4"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uC704\uD0C1 \uBAA9\uC801"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uC774\uC804 \uD56D\uBAA9"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uBCF4\uC720\xB7\uC774\uC6A9\uAE30\uAC04"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20(\uC8FC)"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uAD6D\uB0B4 \uACB0\uC81C \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uC774\uBA54\uC77C, \uACB0\uC81C\uAE08\uC561, \uC8FC\uBB38\uBC88\uD638"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uACB0\uC81C \uC644\uB8CC \uD6C4 5\uB144 (\uC804\uC790\uC0C1\uAC70\uB798\uBC95)")))), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uAD6D\uC678 \uC774\uC804 (\uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638\uBC95 \uC81C28\uC870\uC7588)")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#F9FAFB" } }, /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uC5C5\uCCB4 (\uAD6D\uAC00)"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uBAA9\uC801"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uC774\uC804 \uD56D\uBAA9"), /* @__PURE__ */ React.createElement("th", { style: { border: "1px solid #E5E7EB", padding: "6px 8px", textAlign: "left" } }, "\uBCF4\uC720\uAE30\uAC04"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "Anthropic, Inc. (\uBBF8\uAD6D)"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "Claude AI API \uC11C\uBE44\uC2A4 \uC81C\uACF5"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uCC44\uD305 \uB0B4\uC6A9 (\uBE44\uC2DD\uBCC4\uD654, \uC800\uC7A5 \uC548 \uB428)"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uCC98\uB9AC \uD6C4 \uC989\uC2DC \uD30C\uAE30")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "Cloudflare, Inc. (\uBBF8\uAD6D\xB7EU)"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uC11C\uBC84 \uC778\uD504\uB77C\xB7DB \uC6B4\uC601"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uC774\uBA54\uC77C, \uB2C9\uB124\uC784, \uC131\uBCC4, \uC5F0\uB839\uB300, \uD578\uB4DC\uD3F0\uBC88\uD638 \uB4F1 \uAC00\uC785 \uC815\uBCF4"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uD68C\uC6D0 \uD0C8\uD1F4 \uC2DC\uAE4C\uC9C0")), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "Resend, Inc. (\uBBF8\uAD6D)"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uC778\uC99D\xB7\uC548\uB0B4 \uC774\uBA54\uC77C \uBC1C\uC1A1"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uC774\uBA54\uC77C \uC8FC\uC18C"), /* @__PURE__ */ React.createElement("td", { style: { border: "1px solid #E5E7EB", padding: "6px 8px" } }, "\uBC1C\uC1A1 \uC644\uB8CC \uD6C4 \uD30C\uAE30")))), /* @__PURE__ */ React.createElement("p", { style: { color: "#dc2626", fontSize: "13px" } }, "\u203B \uC774\uC6A9\uC790\uB294 \uAD6D\uC678 \uC774\uC804\uC5D0 \uB3D9\uC758\uD558\uC9C0 \uC54A\uC744 \uAD8C\uB9AC\uAC00 \uC788\uC73C\uB098, \uBBF8\uB3D9\uC758 \uC2DC \uD574\uB2F9 \uC11C\uBE44\uC2A4(AI \uC0C1\uB2F4 \uB4F1) \uC774\uC6A9\uC774 \uBD88\uAC00\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h3", null, "5. \uC790\uB3D9\uD654\uB41C \uC758\uC0AC\uACB0\uC815"), /* @__PURE__ */ React.createElement("p", null, "AI \uBD84\uC11D \uAE30\uB2A5\uC740 \uC54C\uACE0\uB9AC\uC998\uC5D0 \uC758\uD574 \uC790\uB3D9\uC73C\uB85C \uACB0\uACFC\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4. \uC774\uB294 ", /* @__PURE__ */ React.createElement("strong", null, "\uCC38\uACE0\uC6A9 \uC815\uBCF4"), "\uC774\uBA70 \uC758\uB8CC\uC801 \uC9C4\uB2E8\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC774\uC6A9\uC790\uB294 AI \uBD84\uC11D \uACB0\uACFC\uC5D0 \uC774\uC758\uB97C \uC81C\uAE30\uD558\uAC70\uB098 \uC0AC\uB78C\uC5D0 \uC758\uD55C \uC7AC\uAC80\uD1A0\uB97C \uC694\uCCAD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h3", null, "6. \uB9CC 14\uC138 \uBBF8\uB9CC \uC774\uC6A9\uC790"), /* @__PURE__ */ React.createElement("p", null, "\uB9CC 14\uC138 \uBBF8\uB9CC\uC758 \uC544\uB3D9\uC740 \uC11C\uBE44\uC2A4\uB97C \uC774\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9CC 14\uC138 \uBBF8\uB9CC\uC73C\uB85C \uD655\uC778\uB420 \uACBD\uC6B0 \uC218\uC9D1\uB41C \uAC1C\uC778\uC815\uBCF4\uB97C \uC989\uC2DC \uD30C\uAE30\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h3", null, "7. \uC774\uC6A9\uC790\uC758 \uAD8C\uB9AC"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uAC1C\uC778\uC815\uBCF4 \uC5F4\uB78C, \uC218\uC815, \uC0AD\uC81C \uC694\uCCAD: \uB9C8\uC774\uD398\uC774\uC9C0 \u2192 \uC124\uC815 \u2192 \uD68C\uC6D0 \uD0C8\uD1F4"), /* @__PURE__ */ React.createElement("li", null, "\uCC98\uB9AC \uC815\uC9C0 \uC694\uCCAD: support@maumful.com"), /* @__PURE__ */ React.createElement("li", null, "\uAC1C\uC778\uC815\uBCF4 \uC774\uB3D9\uAD8C: \uC694\uCCAD \uC2DC CSV \uD615\uD0DC\uB85C \uC81C\uACF5")), /* @__PURE__ */ React.createElement("h3", null, "8. \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638\uCC45\uC784\uC790 \uBC0F \uBB38\uC758"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0C1\uD638:"), " \uB9C8\uC74C\uC11C\uBE44\uC2A4"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uB300\uD45C\uC790:"), " \uAE40\uADFC\uD61C"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638:"), " 780-31-01832"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uD1B5\uC2E0\uD310\uB9E4\uC5C5 \uC2E0\uACE0\uBC88\uD638:"), " \uC81C 2026-\uC11C\uC6B8\uC601\uB4F1\uD3EC-1157 \uD638"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0AC\uC5C5\uC7A5 \uC18C\uC7AC\uC9C0:"), " \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC601\uB4F1\uD3EC\uAD6C \uBB38\uB798\uB85C26\uAE38 6 (\uBB38\uB798\uB3D93\uAC00)"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC774\uBA54\uC77C:"), " support@maumful.com"), /* @__PURE__ */ React.createElement("li", null, "\uAC1C\uC778\uC815\uBCF4 \uCE68\uD574 \uC2E0\uACE0: \uAC1C\uC778\uC815\uBCF4\uBCF4\uD638\uC704\uC6D0\uD68C (privacy.go.kr / 182)")), /* @__PURE__ */ React.createElement("p", { style: { color: "#9ca3af", fontSize: "12px" } }, "\uCD5C\uC885 \uC5C5\uB370\uC774\uD2B8: 2026\uB144 5\uC6D4 24\uC77C"));
  if (view === "terms") return /* @__PURE__ */ React.createElement(LegalPage, { title: "\uC774\uC6A9\uC57D\uAD00", onBack: () => setView(isLoggedIn ? "memberDashboard" : "memberLogin") }, /* @__PURE__ */ React.createElement("h2", null, "\uC774\uC6A9\uC57D\uAD00"), /* @__PURE__ */ React.createElement("p", null, '\uB9C8\uC74C\uD480(\uC774\uD558 "\uC11C\uBE44\uC2A4") \uC774\uC6A9 \uC804 \uBC18\uB4DC\uC2DC \uC77D\uC5B4\uC8FC\uC138\uC694.'), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "13px", color: "#6b7280" } }, "\uC6B4\uC601\uC0AC: \uB9C8\uC74C\uC11C\uBE44\uC2A4 | \uB300\uD45C\uC790: \uAE40\uADFC\uD61C | \uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638: 780-31-01832 | \uD1B5\uC2E0\uD310\uB9E4\uC5C5 \uC2E0\uACE0\uBC88\uD638: \uC81C 2026-\uC11C\uC6B8\uC601\uB4F1\uD3EC-1157 \uD638 | \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC601\uB4F1\uD3EC\uAD6C \uBB38\uB798\uB85C26\uAE38 6"), /* @__PURE__ */ React.createElement("h3", null, "\uC81C1\uC870 (\uBAA9\uC801)"), /* @__PURE__ */ React.createElement("p", null, '\uBCF8 \uC57D\uAD00\uC740 \uB9C8\uC74C\uC11C\uBE44\uC2A4(\uC774\uD558 "\uD68C\uC0AC")\uAC00 \uC6B4\uC601\uD558\uB294 \uB9C8\uC74C\uD480 \uC11C\uBE44\uC2A4\uC758 \uC774\uC6A9 \uC870\uAC74, \uC808\uCC28 \uBC0F \uC774\uC6A9\uC790\uC640 \uD68C\uC0AC \uAC04\uC758 \uAD8C\uB9AC\xB7\uC758\uBB34\uB97C \uADDC\uC815\uD569\uB2C8\uB2E4.'), /* @__PURE__ */ React.createElement("h3", null, "\uC81C2\uC870 (\uC11C\uBE44\uC2A4\uC758 \uC131\uACA9 \uBC0F \uC758\uB8CC \uBA74\uCC45)"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "\uBCF8 \uC11C\uBE44\uC2A4\uB294 \uC790\uAE30\uC774\uD574 \uBC0F \uC815\uBCF4 \uC81C\uACF5 \uBAA9\uC801\uC758 \uCF58\uD150\uCE20 \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC \uBC0F AI \uC0C1\uB2F4\uC740 \uC758\uB8CC\uC801 \uC9C4\uB2E8, \uCE58\uB8CC, \uCC98\uBC29\uC774 \uC544\uB2D9\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uAC80\uC0AC \uACB0\uACFC\uB97C \uC758\uD559\uC801 \uD310\uB2E8\uC758 \uADFC\uAC70\uB85C \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624."), /* @__PURE__ */ React.createElement("li", null, "AI\uB294 \uC758\uB8CC\uC778\uC774 \uC544\uB2C8\uBA70, AI \uB2F5\uBCC0\uC740 \uCC38\uACE0\uC6A9 \uC815\uBCF4\uC785\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uC2EC\uB9AC\uC801 \uC5B4\uB824\uC6C0\uC774 \uC9C0\uC18D\uB418\uBA74 \uBC18\uB4DC\uC2DC \uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC \uC804\uBB38\uC758 \uB610\uB294 \uACF5\uC778 \uC2EC\uB9AC\uC0C1\uB2F4\uC0AC\uC758 \uB3C4\uC6C0\uC744 \uBC1B\uC73C\uC2ED\uC2DC\uC624."), /* @__PURE__ */ React.createElement("li", null, "\uC704\uAE30 \uC0C1\uD669 \uC2DC: \uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654 109 (24\uC2DC\uAC04), \uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654 1577-0199 (24\uC2DC\uAC04)")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C3\uC870 (\uC774\uC6A9 \uC790\uACA9)"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uBCF8 \uC11C\uBE44\uC2A4\uB294 \uB9CC 14\uC138 \uC774\uC0C1\uB9CC \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uB9CC 14\uC138 \uBBF8\uB9CC\uC758 \uACBD\uC6B0 \uBC95\uC815\uB300\uB9AC\uC778\uC758 \uB3D9\uC758\uAC00 \uD544\uC694\uD558\uBA70, \uB3D9\uC758 \uC5C6\uC774 \uAC00\uC785\uD55C \uC0AC\uC2E4\uC774 \uD655\uC778\uB418\uBA74 \uACC4\uC815\uC744 \uC989\uC2DC \uC0AD\uC81C\uD569\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C4\uC870 (\uD06C\uB808\uB527 \uC6B4\uC601 \uC815\uCC45)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "#6b7280", marginBottom: "8px" } }, "\u300C\uC804\uC790\uC0C1\uAC70\uB798 \uB4F1\uC5D0\uC11C\uC758 \uC18C\uBE44\uC790\uBCF4\uD638\uC5D0 \uAD00\uD55C \uBC95\uB960\u300D \uC81C17\uC870, \uC81C19\uC870 \uBC0F \u300C\uCF58\uD150\uCE20\uC0B0\uC5C5 \uC9C4\uD765\uBC95\u300D \uC81C28\uC870\uC5D0 \uADFC\uAC70\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2460 \uD06C\uB808\uB527\uC758 \uC131\uACA9"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uD06C\uB808\uB527\uC740 \uB9C8\uC74C\uD480 \uC11C\uBE44\uC2A4 \uB0B4\uC5D0\uC11C\uB9CC \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC120\uBD88 \uC804\uC790\uC801 \uC218\uB2E8\uC785\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uD06C\uB808\uB527\uC740 \uD0C0\uC778\uC5D0\uAC8C \uC591\uB3C4\xB7\uAC70\uB798\xB7\uD658\uC804\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC720\uB8CC \uAD6C\uB9E4 \uD06C\uB808\uB527"), ": \uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20(KRW) \uB610\uB294 Stripe(USD)\uB97C \uD1B5\uD574 \uAD6C\uB9E4\uD55C \uD06C\uB808\uB527"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uBB34\uC0C1 \uC9C0\uAE09 \uD06C\uB808\uB527"), ": \uAC00\uC785 \uBCF4\uB108\uC2A4, \uC774\uBCA4\uD2B8\xB7\uD504\uB85C\uBAA8\uC158, \uCD94\uCC9C \uBCF4\uC0C1\uC73C\uB85C \uC9C0\uAE09\uB41C \uD06C\uB808\uB527 (\uD658\uBD88 \uC81C\uC678)")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2461 \uD06C\uB808\uB527 \uC720\uD6A8\uAE30\uAC04"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC720\uB8CC \uAD6C\uB9E4 \uD06C\uB808\uB527: \uAD6C\uB9E4\uC77C\uB85C\uBD80\uD130 ", /* @__PURE__ */ React.createElement("strong", null, "5\uB144"), " (\u300C\uCF58\uD150\uCE20\uC0B0\uC5C5 \uC9C4\uD765\uBC95\u300D \uC81C28\uC870 \uAE30\uC900)"), /* @__PURE__ */ React.createElement("li", null, "\uBB34\uC0C1 \uC9C0\uAE09 \uD06C\uB808\uB527: \uC9C0\uAE09\uC77C\uB85C\uBD80\uD130 ", /* @__PURE__ */ React.createElement("strong", null, "1\uB144"), " (\uBCC4\uB3C4 \uC548\uB0B4 \uC2DC \uD574\uB2F9 \uAE30\uAC04 \uC801\uC6A9)"), /* @__PURE__ */ React.createElement("li", null, "\uC720\uD6A8\uAE30\uAC04 \uB9CC\uB8CC \uC2DC \uC790\uB3D9 \uC18C\uBA78\uB418\uBA70, \uC18C\uBA78 30\uC77C \uC804 \uC774\uBA54\uC77C\uB85C \uC0AC\uC804 \uACE0\uC9C0\uD569\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2462 \uCCAD\uC57D\uCCA0\uD68C \uBC0F \uD658\uBD88"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC720\uB8CC \uAD6C\uB9E4 \uD06C\uB808\uB527\uC740 \uAD6C\uB9E4\uC77C\uB85C\uBD80\uD130 ", /* @__PURE__ */ React.createElement("strong", null, "7\uC77C \uC774\uB0B4"), ", \uBBF8\uC0AC\uC6A9 \uD06C\uB808\uB527\uC5D0 \uD55C\uD574 \uCCAD\uC57D\uCCA0\uD68C \uBC0F \uC804\uC561 \uD658\uBD88\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4. (\u300C\uC804\uC790\uC0C1\uAC70\uB798\uBC95\u300D \uC81C17\uC870)"), /* @__PURE__ */ React.createElement("li", null, "\uB2E8, \uAD6C\uB9E4\uD55C \uD06C\uB808\uB527\uC758 ", /* @__PURE__ */ React.createElement("strong", null, "\uC77C\uBD80\uB77C\uB3C4 \uC0AC\uC6A9\uD55C \uACBD\uC6B0"), "\uC5D0\uB294 \u300C\uC804\uC790\uC0C1\uAC70\uB798\uBC95\u300D \uC81C17\uC870 \uC81C2\uD56D \uC81C5\uD638\uC5D0 \uB530\uB77C \uCCAD\uC57D\uCCA0\uD68C\uAC00 \uC81C\uD55C\uB429\uB2C8\uB2E4. \uC774 \uC0AC\uC2E4\uC740 \uACB0\uC81C \uC2DC \uD654\uBA74\uC5D0 \uBA85\uC2DC\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uACB0\uC81C \uD6C4 7\uC77C \uCD08\uACFC \uC2DC, \uC794\uC5EC \uD06C\uB808\uB527\uC758 10%\uB97C \uC704\uC57D\uAE08\uC73C\uB85C \uACF5\uC81C \uD6C4 \uD658\uBD88\uD569\uB2C8\uB2E4. (\uB2E8, \uD68C\uC0AC \uADC0\uCC45 \uC0AC\uC720\uB85C \uC778\uD55C \uACBD\uC6B0 \uC804\uC561 \uD658\uBD88)"), /* @__PURE__ */ React.createElement("li", null, "\uBB34\uC0C1 \uC9C0\uAE09 \uD06C\uB808\uB527(\uBCF4\uB108\uC2A4\xB7\uC774\uBCA4\uD2B8\xB7\uCD94\uCC9C \uBCF4\uC0C1)\uC740 \uD658\uBD88 \uB300\uC0C1\uC5D0\uC11C \uC81C\uC678\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4 \uC624\uB958\uB85C \uD06C\uB808\uB527\uC774 \uC18C\uC2E4\uB41C \uACBD\uC6B0 \uB3D9\uC77C \uC218\uB7C9\uC744 \uBCF4\uC0C1\uD569\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2463 \uD658\uBD88 \uC2E0\uCCAD \uBC29\uBC95"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uD658\uBD88 \uC2E0\uCCAD: ", /* @__PURE__ */ React.createElement("strong", null, "support@maumful.com"), ' (\uC81C\uBAA9: "[\uD658\uBD88\uC2E0\uCCAD] \uC774\uBA54\uC77C / \uAD6C\uB9E4\uC77C\uC790 / \uD658\uBD88 \uC0AC\uC720")'), /* @__PURE__ */ React.createElement("li", null, "\uCC98\uB9AC \uAE30\uAC04: \uC2E0\uCCAD \uC811\uC218 \uD6C4 \uC601\uC5C5\uC77C \uAE30\uC900 ", /* @__PURE__ */ React.createElement("strong", null, "3~5\uC77C"), " \uC774\uB0B4"), /* @__PURE__ */ React.createElement("li", null, "\uD658\uBD88 \uC218\uB2E8: \uC6D0\uCE59\uC801\uC73C\uB85C \uACB0\uC81C \uC218\uB2E8\uACFC \uB3D9\uC77C\uD55C \uBC29\uBC95\uC73C\uB85C \uD658\uBD88 (\uCE74\uB4DC \uACB0\uC81C \u2192 \uCE74\uB4DC\uC0AC \uCDE8\uC18C)")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2464 \uC11C\uBE44\uC2A4 \uC885\uB8CC \uC2DC \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4 \uC885\uB8CC \uC2DC \uCD5C\uC18C ", /* @__PURE__ */ React.createElement("strong", null, "30\uC77C \uC804"), " \uC774\uBA54\uC77C\xB7\uACF5\uC9C0\uC0AC\uD56D\uC73C\uB85C \uC0AC\uC804 \uACE0\uC9C0\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uACE0\uC9C0 \uD6C4 \uC794\uC5EC \uC720\uB8CC \uAD6C\uB9E4 \uD06C\uB808\uB527\uC740 \uD658\uBD88 \uC2E0\uCCAD \uAE30\uAC04(30\uC77C) \uB0B4 \uD658\uBD88 \uAC00\uB2A5\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uD658\uBD88 \uC2E0\uCCAD \uAE30\uAC04 \uACBD\uACFC \uD6C4 \uB0A8\uC740 \uD06C\uB808\uB527\uC740 \uC18C\uBA78\uB429\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", fontWeight: 600, margin: "8px 0 4px" } }, "\u2465 \uBD80\uC815 \uC0AC\uC6A9 \uCC98\uB9AC"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uBE44\uC815\uC0C1\uC801 \uBC29\uBC95(\uC911\uBCF5 \uAC00\uC785, \uC2DC\uC2A4\uD15C \uC624\uB958 \uC545\uC6A9 \uB4F1)\uC73C\uB85C \uCDE8\uB4DD\uD55C \uD06C\uB808\uB527\uC740 \uD68C\uC218\uD558\uBA70, \uD574\uB2F9 \uACC4\uC815\uC744 \uC774\uC6A9 \uC815\uC9C0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C5\uC870 (AI \uC11C\uBE44\uC2A4 \uCC45\uC784 \uC81C\uD55C)"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "AI \uC0C1\uB2F4 \uACB0\uACFC\uC758 \uC815\uD655\uC131\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "AI \uB2F5\uBCC0\uC5D0 \uADFC\uAC70\uD55C \uC758\uC0AC\uACB0\uC815\uC73C\uB85C \uBC1C\uC0DD\uD55C \uC190\uD574\uC5D0 \uB300\uD574 \uC11C\uBE44\uC2A4\uB294 \uCC45\uC784\uC744 \uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "AI\uB294 \uC790\uB3D9\uD654\uB41C \uC54C\uACE0\uB9AC\uC998\uC73C\uB85C \uC751\uB2F5\uD558\uBA70, \uC778\uAC04 \uC0C1\uB2F4\uC0AC\uB97C \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C6\uC870 (\uAE08\uC9C0 \uD589\uC704)"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uD0C0\uC778\uC758 \uACC4\uC815 \uBB34\uB2E8 \uC0AC\uC6A9"), /* @__PURE__ */ React.createElement("li", null, "\uD06C\uB808\uB527 \uC2DC\uC2A4\uD15C \uBD80\uC815 \uC774\uC6A9 (\uC911\uBCF5 \uAC00\uC785, \uC6B0\uD68C \uCDA9\uC804 \uB4F1)"), /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4 \uB0B4 \uD0C0\uC778 \uBE44\uBC29\xB7\uD610\uC624 \uD45C\uD604"), /* @__PURE__ */ React.createElement("li", null, "\uC11C\uBE44\uC2A4\uB97C \uC0C1\uC5C5\uC801 \uBAA9\uC801\uC73C\uB85C \uBB34\uB2E8 \uC774\uC6A9"), /* @__PURE__ */ React.createElement("li", null, "\uC790\uD574\xB7\uD0C0\uD574\uB97C \uC870\uC7A5\uD558\uB294 \uCF58\uD150\uCE20 \uC785\uB825")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C7\uC870 (\uC11C\uBE44\uC2A4 \uBCC0\uACBD \uBC0F \uC911\uB2E8)"), /* @__PURE__ */ React.createElement("p", null, "\uC11C\uBE44\uC2A4\uB294 \uC6B4\uC601\uC0C1 \uD544\uC694\uC5D0 \uB530\uB77C \uBCC0\uACBD\xB7\uC911\uB2E8\uB420 \uC218 \uC788\uC73C\uBA70, 7\uC77C \uC804 \uC0AC\uC804 \uACE0\uC9C0\uB97C \uC6D0\uCE59\uC73C\uB85C \uD569\uB2C8\uB2E4. \uAE34\uAE09\uD55C \uACBD\uC6B0 \uC0AC\uD6C4 \uACE0\uC9C0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("h3", null, "\uC81C8\uC870 (\uC57D\uAD00\uC758 \uD6A8\uB825 \uBC0F \uAC1C\uC815)"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uBCF8 \uC57D\uAD00\uC740 \uC11C\uBE44\uC2A4 \uAC00\uC785 \uC2DC \uB3D9\uC758\uD568\uC73C\uB85C\uC368 \uD6A8\uB825\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uD68C\uC0AC\uB294 \u300C\uC804\uC790\uC0C1\uAC70\uB798 \uB4F1\uC5D0\uC11C\uC758 \uC18C\uBE44\uC790\uBCF4\uD638\uC5D0 \uAD00\uD55C \uBC95\uB960\u300D, \u300C\uC57D\uAD00\uC758 \uADDC\uC81C\uC5D0 \uAD00\uD55C \uBC95\uB960\u300D \uB4F1 \uAD00\uB828 \uBC95\uB839\uC744 \uC704\uBC18\uD558\uC9C0 \uC54A\uB294 \uBC94\uC704\uC5D0\uC11C \uC57D\uAD00\uC744 \uAC1C\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uC57D\uAD00 \uAC1C\uC815 \uC2DC \uC801\uC6A9\uC77C \uBC0F \uAC1C\uC815 \uB0B4\uC6A9\uC744 ", /* @__PURE__ */ React.createElement("strong", null, "\uC2DC\uD589 7\uC77C \uC804"), "(\uC774\uC6A9\uC790\uC5D0\uAC8C \uBD88\uB9AC\uD55C \uAC1C\uC815\uC758 \uACBD\uC6B0 30\uC77C \uC804) \uC11C\uBE44\uC2A4 \uACF5\uC9C0\uC0AC\uD56D \uBC0F \uAC00\uC785 \uC774\uBA54\uC77C\uB85C \uACE0\uC9C0\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uACE0\uC9C0 \uAE30\uAC04 \uB0B4 \uC774\uC758\uB97C \uC81C\uAE30\uD558\uC9C0 \uC54A\uC73C\uBA74 \uAC1C\uC815 \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD55C \uAC83\uC73C\uB85C \uAC04\uC8FC\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uAC1C\uC815 \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD558\uC9C0 \uC54A\uB294 \uACBD\uC6B0 \uC11C\uBE44\uC2A4 \uD0C8\uD1F4 \uBC0F \uD658\uBD88(\uD574\uB2F9 \uC2DC)\uC744 \uC2E0\uCCAD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("h3", null, "\uC81C9\uC870 (\uBD84\uC7C1 \uD574\uACB0 \uBC0F \uC900\uAC70\uBC95)"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "\uBCF8 \uC57D\uAD00\uC740 \uB300\uD55C\uBBFC\uAD6D \uBC95\uB960\uC5D0 \uB530\uB77C \uD574\uC11D\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uBD84\uC7C1 \uBC1C\uC0DD \uC2DC \uC11C\uC6B8\uC911\uC559\uC9C0\uBC29\uBC95\uC6D0\uC744 \uC81C1\uC2EC \uAD00\uD560 \uBC95\uC6D0\uC73C\uB85C \uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("li", null, "\uBB38\uC758: support@maumful.com")), /* @__PURE__ */ React.createElement("h3", null, "\uC6B4\uC601\uC0AC \uC815\uBCF4"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0C1\uD638:"), " \uB9C8\uC74C\uC11C\uBE44\uC2A4"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uB300\uD45C\uC790:"), " \uAE40\uADFC\uD61C"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638:"), " 780-31-01832"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uD1B5\uC2E0\uD310\uB9E4\uC5C5 \uC2E0\uACE0\uBC88\uD638:"), " \uC81C 2026-\uC11C\uC6B8\uC601\uB4F1\uD3EC-1157 \uD638"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC0AC\uC5C5\uC7A5 \uC18C\uC7AC\uC9C0:"), " \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC601\uB4F1\uD3EC\uAD6C \uBB38\uB798\uB85C26\uAE38 6 (\uBB38\uB798\uB3D93\uAC00)"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "\uC774\uBA54\uC77C:"), " support@maumful.com")), /* @__PURE__ */ React.createElement("p", { style: { color: "#9ca3af", fontSize: "12px" } }, "\uCD5C\uC885 \uC5C5\uB370\uC774\uD2B8: 2026\uB144 5\uC6D4"));
  if (!isLoggedIn && view === "resetPassword") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-2" }, "\u{1F510}"), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-800" }, t("\uC0C8 \uBE44\uBC00\uBC88\uD638 \uC124\uC815", "Set New Password"))), /* @__PURE__ */ React.createElement(Msg, { msg: formMsg }), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 mb-5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "new-pw",
      type: "password",
      placeholder: t("\uC0C8 \uBE44\uBC00\uBC88\uD638 (8\uC790 \uC774\uC0C1)", "New password (min. 8 chars)"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "new-pw2",
      type: "password",
      placeholder: t("\uC0C8 \uBE44\uBC00\uBC88\uD638 \uD655\uC778", "Confirm new password"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        var _a2, _b2;
        const pw = ((_a2 = document.getElementById("new-pw")) == null ? void 0 : _a2.value) || "";
        const pw2 = ((_b2 = document.getElementById("new-pw2")) == null ? void 0 : _b2.value) || "";
        if (pw.length < 8) {
          setFormMsg({ type: "error", text: t("\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.", "Password must be at least 8 characters.") });
          return;
        }
        if (pw !== pw2) {
          setFormMsg({ type: "error", text: t("\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Passwords do not match.") });
          return;
        }
        setFormMsg({ type: "loading", text: t("\uBCC0\uACBD \uC911...", "Updating...") });
        const r = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...api._authHeader() },
          body: JSON.stringify({ token: window.__resetToken, newPassword: pw })
        }).then((r2) => r2.json());
        if (r.success) {
          setFormMsg({ type: "success", text: t("\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "Password updated successfully.") });
          setTimeout(() => {
            setView("memberLogin");
            setFormMsg({ type: "", text: "" });
          }, 1500);
        } else setFormMsg({ type: "error", text: r.error || t("\uBCC0\uACBD \uC2E4\uD328", "Update failed") });
      },
      className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition"
    },
    t("\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD", "Change Password")
  )));
  if (isLoggedIn && view === "memberDashboard") {
    const allTests = (regionConfig == null ? void 0 : regionConfig.availableTests) || ["PHQ9", "GAD7", "DASS21", "BIG5", "LOST", "SCT", "DSI", "BURNOUT", "RIASEC", "VALUES"];
    const testMeta = {
      PHQ9: { label: "PHQ-9", desc: t("\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "Depression Screening"), emoji: "\u{1F614}", view: "phq9Test", summary: t("\uCD5C\uADFC 2\uC8FC\uAC04 \uAE30\uBD84\xB7\uC218\uBA74\xB7\uC758\uC695\uC758 \uBCC0\uD654\uB97C \uC810\uAC80\uD569\uB2C8\uB2E4", "Check mood, sleep, and motivation changes over the past 2 weeks"), questions: 9, time: t("2\uBD84", "2 min") },
      GAD7: { label: "GAD-7", desc: t("\uBD88\uC548 \uC790\uAC00\uC810\uAC80", "Anxiety Screening"), emoji: "\u{1F630}", view: "gad7Test", summary: t("\uC77C\uC0C1 \uC18D \uAC71\uC815\xB7\uAE34\uC7A5\xB7\uBD88\uC548\uC758 \uC815\uB3C4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4", "Assess your level of daily worry, tension, and anxiety"), questions: 7, time: t("2\uBD84", "2 min") },
      DASS21: { label: "DASS-21", desc: t("\uC6B0\uC6B8/\uBD88\uC548/\uC2A4\uD2B8\uB808\uC2A4", "Depression/Anxiety/Stress"), emoji: "\u{1F4CA}", view: "dass21Test", summary: t("\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC2A4\uD2B8\uB808\uC2A4 \uC138 \uAC00\uC9C0\uB97C \uD55C \uBC88\uC5D0 \uCE21\uC815\uD569\uB2C8\uB2E4", "Measures depression, anxiety, and stress all at once"), questions: 21, time: t("5\uBD84", "5 min") },
      BIG5: { label: "Big5", desc: t("\uC131\uACA9 5\uC694\uC778", "Big Five Personality"), emoji: "\u{1F31F}", view: "big5Test", summary: t("\uB098\uB9CC\uC758 \uC131\uACA9 \uD328\uD134 5\uAC00\uC9C0\uB97C \uC2EC\uCE35 \uBD84\uC11D\uD569\uB2C8\uB2E4", "Deep analysis of your five personality dimensions"), questions: 44, time: t("10\uBD84", "10 min") },
      LOST: { label: "LOST", desc: t("\uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4", "Behavioral Style"), emoji: "\u{1F9ED}", view: "lostTest", summary: t("\uB0B4 \uD589\uB3D9\uC774 \uAC10\uC815 vs \uC774\uC131 \uC911 \uC5B4\uB290 \uCABD\uC5D0 \uAE30\uBC18\uD558\uB294\uC9C0 \uD30C\uC545\uD569\uB2C8\uB2E4", "Understand whether your behavior is driven by emotion or reason"), questions: 40, time: t("8\uBD84", "8 min") },
      SCT: { label: "SRCI", desc: t("\uC790\uAE30\uBC18\uC751 \uC644\uC131", "Self-Response Completion"), emoji: "\u270D\uFE0F", view: "sctTest", summary: t("\uBB38\uC7A5 \uC644\uC131\uC73C\uB85C \uB098\uB3C4 \uBAB0\uB790\uB358 \uB0B4\uBA74\uC758 \uC790\uC544 \uBC18\uC751\uC744 \uD0D0\uC0C9\uD569\uB2C8\uB2E4", "Explore hidden inner reactions through sentence completion"), questions: 30, time: t("8\uBD84", "8 min") },
      DSI: { label: "SDRI", desc: t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131", "Self-Differentiation"), emoji: "\u{1FA9E}", view: "dsiTest", summary: t("\uAC00\uC871\xB7\uC5F0\uC778 \uAD00\uACC4\uC5D0\uC11C \uAC10\uC815 \uBC18\uC751\uC131\uACFC \uC790\uC544 \uB3C5\uB9BD \uC815\uB3C4\uB97C \uCE21\uC815\uD569\uB2C8\uB2E4", "Measures emotional reactivity and independence in relationships"), questions: 35, time: t("8\uBD84", "8 min") },
      BURNOUT: { label: "K-MBI+", desc: t("\uBC88\uC544\uC6C3 \uC99D\uD6C4\uAD70", "Burnout Screening"), emoji: "\u{1F525}", view: "burnoutTest", summary: t("\uC9C1\uC7A5\xB7\uC77C\uC0C1\uC5D0\uC11C \uC313\uC778 \uC2E0\uCCB4\xB7\uC815\uC11C\uC801 \uC18C\uC9C4\uC744 \uC810\uAC80\uD569\uB2C8\uB2E4", "Check physical and emotional exhaustion from work and daily life"), questions: 22, time: t("5\uBD84", "5 min") },
      RIASEC: { label: "Holland RIASEC", desc: t("\uC9C1\uC5C5 \uD765\uBBF8 \uC720\uD615", "Career Interest Type"), emoji: "\u{1F50D}", view: "riasecTest", summary: t("\uB098\uC758 \uC9C1\uC5C5\uC801 \uC801\uC131\uACFC \uD765\uBBF8\uB97C 6\uAC00\uC9C0 \uC720\uD615\uC73C\uB85C \uBD84\uC11D\uD569\uB2C8\uB2E4", "Analyze career aptitude and interests across 6 Holland types"), questions: 30, time: t("8\uBD84", "8 min") },
      VALUES: { label: t("\uC9C1\uC5C5\uAC00\uCE58\uAD00", "Work Values"), desc: t("\uC77C\uC758 \uC758\uBBF8 \uD0D0\uC0C9", "Work Values Assessment"), emoji: "\u{1F48E}", view: "valuesTest", summary: t("\uC77C\uC5D0\uC11C \uBB34\uC5C7\uC744 \uC911\uC2DC\uD558\uB294\uC9C0 10\uAC00\uC9C0 \uAC00\uCE58\uC694\uC778\uC73C\uB85C \uCE21\uC815\uD569\uB2C8\uB2E4", "Measures what you value most in work across 10 value factors"), questions: 30, time: t("8\uBD84", "8 min") }
    };
    async function startSelectedTest2(testType) {
      var _a2;
      const ok = await chargeForTest(testType);
      if (!ok) return;
      setPendingTests([testType]);
      setCurrentTestIndex(0);
      setMultiSessionIds([]);
      setSessionId(genId("session"));
      setSaveStatus("");
      setRiasecResponses({});
      setValuesResponses({});
      setPhq9Responses({});
      setGad7Responses({});
      setDass21Responses({});
      setBig5Responses({});
      setBurnoutResponses({});
      setLostResponses({});
      setSrciResponses({});
      setSdriResponses({});
      resetChat();
      setView(((_a2 = testMeta[testType]) == null ? void 0 : _a2.view) || "phq9Test");
    }
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-50" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setView("landing"),
        className: "flex items-center gap-2 hover:opacity-70 transition"
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F33F}"),
      /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, "\uB9C8\uC74C\uD480")
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(CreditBadge, null), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => openMaumGame(),
        className: "text-gray-500 hover:text-green-700 text-sm px-2 py-1.5 rounded-lg hover:bg-green-50 transition flex items-center gap-1",
        title: "\uB9C8\uC74C \uAC8C\uC784 \u2014 \uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uB3D9"
      },
      "\u{1F3AE} ",
      /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, t("\uB9C8\uC74C \uAC8C\uC784", "MaumGame"))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => openMaumCouple(),
        className: "text-gray-500 hover:text-rose-600 text-sm px-2 py-1.5 rounded-lg hover:bg-rose-50 transition flex items-center gap-1",
        title: "\uB9C8\uC74C\uCEE4\uD50C \u2014 \uD30C\uD2B8\uB108\uC640 \uC2EC\uB9AC \uAD81\uD569 \uBD84\uC11D"
      },
      "\u{1F495} ",
      /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, t("\uB9C8\uC74C\uCEE4\uD50C", "MaumCouple"))
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("myPage"), className: "text-gray-500 hover:text-gray-700 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-100 transition" }, "\u{1F464} ", (currentUser == null ? void 0 : currentUser.nickname) || t("\uB0B4 \uC815\uBCF4", "My Info")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setAdminAuthenticated(false);
          setAdminMsg({ type: "", text: "" });
          setView("admin");
        },
        className: "text-gray-400 hover:text-gray-600 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
      },
      "\u{1F510}"
    )))), /* @__PURE__ */ React.createElement("main", { className: "max-w-2xl mx-auto px-4 py-6" }, /* @__PURE__ */ React.createElement("div", { className: "sm:hidden flex justify-end mb-3" }, /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "#test-list",
        className: "text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition flex items-center gap-1"
      },
      "\u{1F4CB} ",
      t("\uAC80\uC0AC \uBAA9\uB85D \uBC14\uB85C\uAC00\uAE30 \u2193", "Go to assessments \u2193")
    )), (() => {
      const checkinDate = localStorage.getItem("maumful_checkin_date");
      const checkinTest = localStorage.getItem("maumful_checkin_test");
      if (!checkinDate) return null;
      const target = new Date(checkinDate);
      const now = /* @__PURE__ */ new Date();
      const diffDays = Math.ceil((target - now) / (1e3 * 60 * 60 * 24));
      const testMeta2 = { PHQ9: t("\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "Depression Check"), GAD7: t("\uBD88\uC548 \uC790\uAC00\uC810\uAC80", "Anxiety Check"), DASS21: "DASS-21", BIG5: "Big5", BURNOUT: "K-MBI+", LOST: "LOST", SCT: "SRCI", DSI: "SDRI", RIASEC: "Holland RIASEC", VALUES: t("\uC9C1\uC5C5\uAC00\uCE58\uAD00", "Work Values") };
      const testLabel = testMeta2[checkinTest] || checkinTest;
      if (diffDays > 0) {
        return /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-emerald-800" }, "\u{1F4C5} ", t(`${diffDays}\uC77C \uD6C4 \uBCC0\uD654 \uCCB4\uD06C \uC608\uC815`, `Check-in scheduled in ${diffDays} days`)), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-600 mt-0.5" }, t(`${testLabel} \uC7AC\uAC80\uC0AC\uB85C \uB9C8\uC74C\uC758 \uBCC0\uD654\uB97C \uBE44\uAD50\uD574 \uB4DC\uB824\uC694`, `Retest ${testLabel} to compare how you've changed`))), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              localStorage.removeItem("maumful_checkin_date");
              localStorage.removeItem("maumful_checkin_test");
            },
            className: "text-xs text-emerald-400 hover:text-emerald-600 shrink-0"
          },
          "\u2715"
        ));
      }
      if (diffDays <= 0) {
        return /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-amber-800" }, "\u{1F514} ", t(`\uC624\uB298 ${testLabel} \uC7AC\uAC80\uC0AC \uB0A0\uC774\uC5D0\uC694!`, `Today is your ${testLabel} check-in day!`)), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              localStorage.removeItem("maumful_checkin_date");
              localStorage.removeItem("maumful_checkin_test");
            },
            className: "text-xs text-amber-400 hover:text-amber-600"
          },
          "\u2715"
        )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700 mb-3" }, t("\uC774\uC804 \uACB0\uACFC\uC640 \uBE44\uAD50\uD574 \uB9C8\uC74C\uC758 \uBCC0\uD654\uB97C \uD655\uC778\uD558\uC138\uC694", "Compare with your previous results to see how you've changed")), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: async () => {
              const testViews = { PHQ9: "phq9Test", GAD7: "gad7Test", DASS21: "dass21Test", BIG5: "big5Test", BURNOUT: "burnoutTest", LOST: "lostTest", SCT: "sctTest", DSI: "dsiTest", RIASEC: "riasecTest", VALUES: "valuesTest" };
              const ok = await chargeForTest(checkinTest);
              if (!ok) return;
              setPendingTests([checkinTest]);
              setCurrentTestIndex(0);
              setMultiSessionIds([]);
              setSessionId(genId("session"));
              setSaveStatus("");
              setRiasecResponses({});
              setValuesResponses({});
              setPhq9Responses({});
              setGad7Responses({});
              setDass21Responses({});
              setBig5Responses({});
              setBurnoutResponses({});
              setLostResponses({});
              setSrciResponses({});
              setSdriResponses({});
              resetChat();
              localStorage.removeItem("maumful_checkin_date");
              localStorage.removeItem("maumful_checkin_test");
              setView(testViews[checkinTest] || "phq9Test");
            },
            className: "w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 rounded-xl transition"
          },
          t("\uC9C0\uAE08 \uBC14\uB85C \uC7AC\uAC80\uC0AC\uD558\uAE30 \u2192", "Retest now \u2192")
        ));
      }
      return null;
    })(), (() => {
      const dismissKey = "maumful_partner_banner_dismissed";
      if (localStorage.getItem(dismissKey)) return null;
      let cfg = null;
      try {
        cfg = JSON.parse(sessionStorage.getItem("maumful_partner_cfg") || "null");
      } catch {
      }
      if (!cfg) return null;
      const borderColor = cfg.primary_color || "#2D6A4F";
      return /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl p-4 mb-5 border-l-4", style: { borderColor, backgroundColor: borderColor + "18" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, cfg.logo_url && /* @__PURE__ */ React.createElement("img", { src: cfg.logo_url, alt: cfg.name, className: "h-6 mb-2 object-contain" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold", style: { color: borderColor } }, cfg.name, "\uC744 \uD1B5\uD574 \uC624\uC168\uAD70\uC694!"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-1" }, cfg.welcome_message || "\uB9C8\uC74C\uD480\uC758 \uC2EC\uB9AC\uAC80\uC0AC\uC640 AI \uC0C1\uB2F4 \uC11C\uBE44\uC2A4\uB97C \uC790\uC720\uB86D\uAC8C \uC774\uC6A9\uD574 \uBCF4\uC138\uC694."), cfg.featured_tests && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 mt-2" }, cfg.featured_tests.split(",").map((t2) => t2.trim()).filter(Boolean).map((t2) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: t2,
          className: "text-xs px-2 py-0.5 rounded-full text-white font-medium",
          style: { backgroundColor: borderColor }
        },
        t2
      )))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            localStorage.setItem(dismissKey, "1");
            setView("memberDashboard");
          },
          className: "text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
        },
        "\u2715"
      )));
    })(), testHistory.length === 0 && !localStorage.getItem("maumful_guide_dismissed") && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-5 mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-green-800" }, "\u{1F33F} ", t("\uB9C8\uC74C\uD480 \uC2DC\uC791\uD558\uAE30", "Getting Started with Maumful")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          localStorage.setItem("maumful_guide_dismissed", "1");
          setView("memberDashboard");
        },
        className: "text-xs text-green-400 hover:text-green-600"
      },
      "\u2715 ",
      t("\uB2EB\uAE30", "Close")
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 mb-3" }, [
      { step: "1", icon: "\u{1F4CB}", title: t("\uAC80\uC0AC \uC120\uD0DD", "Pick a Test"), desc: t("\uC544\uB798\uC5D0\uC11C \uC6D0\uD558\uB294 \uC2EC\uB9AC\uAC80\uC0AC\uB97C \uC120\uD0DD\uD558\uC138\uC694", "Choose an assessment below") },
      { step: "2", icon: "\u{1F9E0}", title: t("AI \uBD84\uC11D", "AI Analysis"), desc: t("\uAC80\uC0AC \uC644\uB8CC \uD6C4 AI\uAC00 \uACB0\uACFC\uB97C \uD574\uC11D\uD574 \uB4DC\uB824\uC694", "AI interprets your results after the test") },
      { step: "3", icon: "\u{1F4AC}", title: t("AI \uC0C1\uB2F4", "AI Counseling"), desc: t("\uAD81\uAE08\uD55C \uC810\uC744 AI \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uBB3C\uC5B4\uBCF4\uC138\uC694", "Ask the AI counselor any questions") }
    ].map(({ step, icon, title, desc }) => /* @__PURE__ */ React.createElement("div", { key: step, className: "bg-white rounded-xl p-3 text-center border border-green-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl mb-1" }, icon), /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-green-800" }, "STEP ", step), /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold text-gray-700 mt-0.5" }, title), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-0.5 leading-tight" }, desc)))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 text-center" }, t("\uC544\uB798 \uAC80\uC0AC \uCE74\uB4DC\uB97C \uB20C\uB7EC \uC9C0\uAE08 \uBC14\uB85C \uC2DC\uC791\uD574 \uBCF4\uC138\uC694 \u{1F447}", "Tap a test card below to get started right now \u{1F447}"))), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-800" }, t(`\uC548\uB155\uD558\uC138\uC694, ${(currentUser == null ? void 0 : currentUser.nickname) || "\uD68C\uC6D0"}\uB2D8 \u{1F44B}`, `Hello, ${(currentUser == null ? void 0 : currentUser.nickname) || "there"} \u{1F44B}`)), counselingMode === "biblical" && /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium" }, "\u271D\uFE0F \uAE30\uB3C5\uAD50 \uC0C1\uB2F4")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 text-sm mt-1" }, t("\uAC80\uC0AC 1\uD68C\uC5D0 10 \uD06C\uB808\uB527\uC774 \uCC28\uAC10\uB429\uB2C8\uB2E4", "10 credits per assessment"))), /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-5 text-white mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm opacity-80" }, t("\uD604\uC7AC \uD06C\uB808\uB527", "Current Credits")), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowChargeView(true), className: "text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition" }, t("\uCDA9\uC804 \u2192", "Top up \u2192"))), /* @__PURE__ */ React.createElement("div", { className: "text-4xl font-bold" }, "\u2726 ", credits), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-70 mt-1" }, t(`\uAC80\uC0AC ${Math.floor(credits / 10)}\uD68C \xB7 AI \uCC44\uD305 ${Math.floor(credits / 2)}\uD68C \uAC00\uB2A5`, `${Math.floor(credits / 10)} tests \xB7 ${Math.floor(credits / 2)} AI chats available`))), (() => {
      if (testHistory.length === 0) return null;
      const now = /* @__PURE__ */ new Date();
      const doneTypes = new Set(testHistory.map((h) => h.test_type));
      const lastDoneMap = {};
      testHistory.forEach((h) => {
        if (!lastDoneMap[h.test_type]) lastDoneMap[h.test_type] = new Date(h.performed_at);
      });
      const daysSince = (t2) => Math.floor((now - (lastDoneMap[t2] || now)) / 864e5);
      const recs = [];
      if (!doneTypes.has("PHQ9"))
        recs.push({ type: "PHQ9", emoji: "\u{1F614}", reason: t("\uC6B0\uC6B8 \uC0C1\uD0DC\uB97C \uC544\uC9C1 \uD655\uC778\uD558\uC9C0 \uC54A\uC558\uC5B4\uC694", "You haven't checked your depression yet"), free: true });
      else if (daysSince("PHQ9") >= 30)
        recs.push({ type: "PHQ9", emoji: "\u{1F614}", reason: t(`\uB9C8\uC9C0\uB9C9 \uC6B0\uC6B8 \uAC80\uC0AC\uAC00 ${daysSince("PHQ9")}\uC77C \uC804\uC774\uC5D0\uC694`, `Your last depression check was ${daysSince("PHQ9")} days ago`), free: true });
      if (!doneTypes.has("GAD7"))
        recs.push({ type: "GAD7", emoji: "\u{1F630}", reason: t("\uBD88\uC548 \uAC80\uC0AC\uB97C \uC544\uC9C1 \uBC1B\uC9C0 \uC54A\uC558\uC5B4\uC694", "You haven't taken an anxiety check yet"), free: true });
      else if (daysSince("GAD7") >= 30)
        recs.push({ type: "GAD7", emoji: "\u{1F630}", reason: t(`\uB9C8\uC9C0\uB9C9 \uBD88\uC548 \uAC80\uC0AC\uAC00 ${daysSince("GAD7")}\uC77C \uC804\uC774\uC5D0\uC694`, `Your last anxiety check was ${daysSince("GAD7")} days ago`), free: true });
      if (!doneTypes.has("BIG5"))
        recs.push({ type: "BIG5", emoji: "\u{1F31F}", reason: t("\uC131\uACA9 5\uC694\uC778\uC73C\uB85C \uC790\uC2E0\uC744 \uB354 \uAE4A\uC774 \uC774\uD574\uD574 \uBCF4\uC138\uC694", "Understand yourself more deeply with Big Five"), free: false });
      else if (daysSince("BIG5") >= 90)
        recs.push({ type: "BIG5", emoji: "\u{1F31F}", reason: t(`\uC131\uACA9 \uAC80\uC0AC \uC774\uD6C4 ${daysSince("BIG5")}\uC77C\uC774 \uC9C0\uB0AC\uC5B4\uC694`, `It's been ${daysSince("BIG5")} days since your personality test`), free: false });
      if (!doneTypes.has("BURNOUT") && doneTypes.has("PHQ9"))
        recs.push({ type: "BURNOUT", emoji: "\u{1F525}", reason: t("\uBC88\uC544\uC6C3 \uC704\uD5D8\uB3C4\uB97C \uD568\uAED8 \uD655\uC778\uD574 \uBCF4\uC138\uC694", "Check your burnout risk while you're at it"), free: false });
      const top = recs.slice(0, 2);
      if (top.length === 0) return null;
      return /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700 mb-3" }, "\u2728 ", t("\uCD94\uCC9C \uAC80\uC0AC", "Recommended Tests")), /* @__PURE__ */ React.createElement("div", { className: top.length > 1 ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3" }, top.map((r) => {
        var _a2;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: r.type,
            onClick: () => startSelectedTest2(r.type),
            className: "bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-left border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-md transition group"
          },
          /* @__PURE__ */ React.createElement("div", { className: "text-2xl mb-1" }, r.emoji),
          /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800 text-sm" }, (_a2 = testMeta[r.type]) == null ? void 0 : _a2.label),
          /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-1 leading-tight" }, r.reason),
          /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-bold px-2 py-0.5 rounded-full ${r.free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}` }, r.free ? t("\u2713 \uBB34\uB8CC", "\u2713 Free") : t("10 \uD06C\uB808\uB527", "10 Credits")))
        );
      })));
    })(), dailyCtxCard && !localStorage.getItem(`maumful_ai_checkin_${new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10)}`) && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-lg" }, "\u{1F916}"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-violet-500 mb-1 uppercase tracking-wide" }, t("AI \uC0C1\uB2F4\uC0AC", "AI Counselor")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-violet-800 mb-3 leading-relaxed font-medium" }, '"', dailyCtxCard.greeting, '"'), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const today = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
          localStorage.setItem(`maumful_ai_checkin_${today}`, "1");
          setView("aiCounsel");
        },
        className: "bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
      },
      "\u{1F4AC} ",
      t("AI\uC640 \uB300\uD654\uD558\uAE30", "Chat with AI")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const today = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
          localStorage.setItem(`maumful_ai_checkin_${today}`, "dismissed");
          setDailyCtxCard(null);
        },
        className: "text-xs text-violet-400 hover:text-violet-600 px-3 py-2 rounded-xl hover:bg-violet-100 transition"
      },
      t("\uB098\uC911\uC5D0", "Later")
    ))))), (() => {
      const trendTypes = ["PHQ9", "GAD7", "BURNOUT"].filter(
        (t2) => testHistory.filter((h) => h.test_type === t2 && h.score != null).length >= 3
      );
      if (!trendTypes.length) return null;
      return /* @__PURE__ */ React.createElement(
        TrendPredictionCard,
        {
          testType: trendTypes[0],
          onStartTest: () => startSelectedTest2(trendTypes[0])
        }
      );
    })(), /* @__PURE__ */ React.createElement(
      CbtPlanCard,
      {
        testHistory,
        onPlay: (gameId) => openMaumGame(gameId)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("h3", { id: "test-list", className: "font-bold text-gray-700" }, t("\uC2EC\uB9AC\uAC80\uC0AC \uC120\uD0DD", "Select Assessment")), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, t(`\uCD1D ${allTests.length}\uC885`, `${allTests.length} total`))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" }, allTests.map((type) => {
      const m = testMeta[type];
      if (!m) return null;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: type,
          onClick: () => startSelectedTest2(type),
          className: "bg-white rounded-2xl p-4 text-left border-2 border-gray-100 hover:border-green-300 hover:shadow-md transition group relative overflow-hidden flex sm:flex-col items-start gap-3 sm:gap-0"
        },
        /* @__PURE__ */ React.createElement("div", { className: `absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${FREE_TESTS.includes(type) ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}` }, FREE_TESTS.includes(type) ? t("\u2713 \uBB34\uB8CC", "\u2713 Free") : t("10 \uD06C\uB808\uB527", "10 Credits")),
        /* @__PURE__ */ React.createElement("div", { className: "text-3xl sm:mb-2 shrink-0 mt-0.5" }, m.emoji),
        /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 pr-14 sm:pr-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800 text-sm" }, m.label), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-0.5" }, m.desc), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-1.5 leading-relaxed" }, m.summary), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-300 mt-1.5 flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB} ", m.questions, t("\uBB38\uD56D", "Q")), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("span", null, "\u23F1 ", t("\uC57D", ""), " ", m.time)), /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-xs text-green-600 font-semibold sm:opacity-0 sm:group-hover:opacity-100 transition" }, FREE_TESTS.includes(type) ? t("\uBC14\uB85C \uC2DC\uC791 \u2192", "Start now \u2192") : t("\uD06C\uB808\uB527\uC73C\uB85C \uC774\uC6A9 \u2192", "Use credits \u2192")))
      );
    })), testHistory.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700" }, t("\uCD5C\uADFC \uAC80\uC0AC", "Recent Tests")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("myPage"), className: "text-xs text-green-600 hover:text-green-800" }, t("\uC804\uCCB4 \uBCF4\uAE30 \u2192", "View all \u2192"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, testHistory.slice(0, 5).map((h, i) => {
      const prevSame = testHistory.slice(i + 1).find((p) => p.test_type === h.test_type);
      const daysSince = Math.floor((/* @__PURE__ */ new Date() - new Date(h.performed_at)) / (1e3 * 60 * 60 * 24));
      const testEmoji2 = { PHQ9: "\u{1F614}", GAD7: "\u{1F630}", DASS21: "\u{1F4CA}", BIG5: "\u{1F31F}", LOST: "\u{1F9ED}", SCT: "\u270D\uFE0F", DSI: "\u{1FA9E}", BURNOUT: "\u{1F525}", RIASEC: "\u{1F50D}", VALUES: "\u{1F48E}" };
      return /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-white rounded-xl p-3 border border-gray-100 hover:border-emerald-200 transition" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, testEmoji2[h.test_type] || "\u{1F4CB}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-700 text-sm" }, h.test_type), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 ml-2" }, daysSince === 0 ? t("\uC624\uB298", "Today") : daysSince === 1 ? t("\uC5B4\uC81C", "Yesterday") : t(`${daysSince}\uC77C \uC804`, `${daysSince} days ago`)))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, prevSame && /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100" }, t("\uC7AC\uAC80\uC0AC", "Retest")), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-red-300" }, "-", h.credits_spent, "cr"))), daysSince >= 3 && !prevSame && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: async () => {
            const testViews = { PHQ9: "phq9Test", GAD7: "gad7Test", DASS21: "dass21Test", BIG5: "big5Test", BURNOUT: "burnoutTest", LOST: "lostTest", SCT: "sctTest", DSI: "dsiTest", RIASEC: "riasecTest", VALUES: "valuesTest" };
            const ok = await chargeForTest(h.test_type);
            if (!ok) return;
            setPendingTests([h.test_type]);
            setCurrentTestIndex(0);
            setMultiSessionIds([]);
            setSessionId(genId("session"));
            setSaveStatus("");
            setRiasecResponses({});
            setValuesResponses({});
            setPhq9Responses({});
            setGad7Responses({});
            setDass21Responses({});
            setBig5Responses({});
            setBurnoutResponses({});
            setLostResponses({});
            setSrciResponses({});
            setSdriResponses({});
            resetChat();
            setView(testViews[h.test_type] || "phq9Test");
          },
          className: "mt-2 w-full text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg py-1.5 font-semibold transition"
        },
        "\u{1F504} ",
        t(`${daysSince}\uC77C \uD6C4 \uC7AC\uAC80\uC0AC\uB85C \uBCC0\uD654 \uD655\uC778\uD558\uAE30`, `Retest after ${daysSince} days to track your progress`)
      ));
    })))), /* @__PURE__ */ React.createElement(CreditModal, null), /* @__PURE__ */ React.createElement(AiLimitModal, null), /* @__PURE__ */ React.createElement(CookieBanner, null), showChargeView && /* @__PURE__ */ React.createElement(ChargeView, { onClose: async () => {
      setShowChargeView(false);
      await refreshCredits();
      if (pendingTestAfterCharge) {
        const t2 = pendingTestAfterCharge;
        setPendingTestAfterCharge(null);
        setView("startTest:" + t2);
      }
    }, credits, regionConfig }));
  }
  if (isLoggedIn && view === "myPage") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-50" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm" }, t("\u2190 \uB4A4\uB85C", "\u2190 Back")), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, t("\uB9C8\uC774\uD398\uC774\uC9C0", "My Page")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openMaumGame(),
      className: "text-green-600 hover:text-green-800 text-sm px-2 py-1.5 rounded-lg hover:bg-green-50 transition",
      title: "\uB9C8\uC74C \uAC8C\uC784"
    },
    "\u{1F3AE}"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openMaumCouple(),
      className: "text-rose-500 hover:text-rose-700 text-sm px-2 py-1.5 rounded-lg hover:bg-rose-50 transition",
      title: "\uB9C8\uC74C\uCEE4\uD50C"
    },
    "\u{1F495}"
  ), /* @__PURE__ */ React.createElement(CreditBadge, null)))), /* @__PURE__ */ React.createElement("main", { className: "max-w-2xl mx-auto px-4 py-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 mb-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl" }, "\u{1F464}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800" }, (currentUser == null ? void 0 : currentUser.nickname) || t("\uD68C\uC6D0", "member")), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-400" }, currentUser == null ? void 0 : currentUser.email)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-5" }, [[`credits`, t("\uD06C\uB808\uB527 \uB0B4\uC5ED", "Credits")], [`history`, t("\uAC80\uC0AC \uC774\uB825", "History")], [`appointments`, t("\uC0C1\uB2F4 \uC608\uC57D", "Sessions")], [`referral`, t("\uCE5C\uAD6C \uCD08\uB300", "Referral")], [`settings`, t("\uC124\uC815", "Settings")]].map(([tab, label]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tab,
      onClick: () => {
        setMyPageTab(tab);
        if (tab === "credits") refreshCredits();
        if (tab === "history") loadTestHistory();
        if (tab === "referral") loadReferralData();
        if (tab === "settings") checkPushStatus();
      },
      className: `px-4 py-2 rounded-full text-sm font-semibold transition ${myPageTab === tab ? "bg-green-700 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-green-300"}`
    },
    label
  ))), myPageTab === "credits" && (() => {
    const usageTxns = creditTxns.filter((tx) => tx.type === "spend");
    const chargeTxns = creditTxns.filter((tx) => tx.type === "gain");
    const reasonLabel = (r) => ({
      signup_bonus: t("\uAC00\uC785 \uBCF4\uB108\uC2A4", "Signup Bonus"),
      test: t("\uC2EC\uB9AC\uAC80\uC0AC", "Assessment"),
      chat: t("AI \uCC44\uD305", "AI Chat"),
      charge: t("\uD06C\uB808\uB527 \uCDA9\uC804", "Credit Purchase"),
      refund_api_error: t("\uC624\uB958 \uD658\uBD88", "Error Refund"),
      admin_grant: t("\uAD00\uB9AC\uC790 \uC9C0\uAE09", "Admin Grant"),
      referral: t("\uCE5C\uAD6C \uCD08\uB300", "Referral"),
      couple: t("\uB9C8\uC74C\uCEE4\uD50C \uBD84\uC11D", "MaumCouple Analysis"),
      couple_session: t("\uB9C8\uC74C\uCEE4\uD50C \uC138\uC158", "MaumCouple Session"),
      game: t("\uB9C8\uC74C\uAC8C\uC784", "MaumGame"),
      game_spend: t("\uB9C8\uC74C\uAC8C\uC784 \uC544\uC774\uD15C", "MaumGame Item"),
      solo_analysis: t("\uC774\uC0C1\uD615 \uC131\uD5A5 \uBD84\uC11D", "Ideal Type Analysis"),
      date_course: t("\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "Date Course"),
      coach: t("\uAD00\uACC4 \uCF54\uCE58", "Relationship Coach"),
      counseling: t("\uC0C1\uB2F4 \uC608\uC57D", "Session Booking"),
      ai_refund: t("AI \uC624\uB958 \uD658\uBD88", "AI Error Refund"),
      bonus: t("\uBCF4\uB108\uC2A4 \uC9C0\uAE09", "Bonus")
    })[r] || r;
    const reasonIcon = (tx) => {
      var _a2, _b2, _c2;
      if (tx.type === "spend") {
        if (tx.reason === "test") return "\u{1F4CB}";
        if (tx.reason === "chat") return "\u{1F4AC}";
        if (((_a2 = tx.reason) == null ? void 0 : _a2.startsWith("couple")) || tx.reason === "solo_analysis" || tx.reason === "date_course" || tx.reason === "coach") return "\u{1F495}";
        if ((_b2 = tx.reason) == null ? void 0 : _b2.startsWith("game")) return "\u{1F33F}";
        if (tx.reason === "counseling") return "\u{1F3E5}";
        return "\u{1F4B8}";
      }
      if (tx.reason === "charge") return "\u{1F4B3}";
      if (tx.reason === "signup_bonus" || tx.reason === "bonus") return "\u{1F381}";
      if (tx.reason === "referral") return "\u{1F91D}";
      if ((_c2 = tx.reason) == null ? void 0 : _c2.includes("refund")) return "\u21A9\uFE0F";
      if (tx.reason === "admin_grant") return "\u2B50";
      return "\u2726";
    };
    const fmtDt = (d) => new Date(d).toLocaleString(lang === "en" ? "en-US" : "ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-5 text-white mb-5",
        style: { fontFamily: "'Noto Sans KR',sans-serif" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-end justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75 mb-1" }, t("\uD604\uC7AC \uC794\uC561", "Current Balance")), /* @__PURE__ */ React.createElement("div", { className: "text-4xl font-bold" }, "\u2726 ", credits), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75 mt-1" }, t(`\uC2EC\uB9AC\uAC80\uC0AC ${Math.floor(credits / 10)}\uD68C \uAC00\uB2A5`, `${Math.floor(credits / 10)} assessments available`))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowChargeView(true),
          className: "text-sm bg-white text-green-700 font-bold px-5 py-2.5 rounded-full hover:bg-green-50 transition",
          style: { fontFamily: "'Noto Sans KR',sans-serif" }
        },
        t("\uCDA9\uC804\uD558\uAE30 \u2192", "Top up \u2192")
      )),
      /* @__PURE__ */ React.createElement("div", { className: "mt-4 grid grid-cols-3 gap-2" }, [
        { label: t("\uCD1D \uCDA9\uC804", "Total charged"), val: chargeTxns.filter((tx) => tx.reason === "charge").reduce((s, tx) => s + tx.amount, 0) + " cr" },
        { label: t("\uC0AC\uC6A9 \uAC74\uC218", "Usage count"), val: usageTxns.length + t("\uAC74", " uses") },
        { label: t("\uC774\uBC88 \uB2EC \uC0AC\uC6A9", "This month"), val: usageTxns.filter((tx) => new Date(tx.created_at).getMonth() === (/* @__PURE__ */ new Date()).getMonth()).reduce((s, tx) => s + tx.amount, 0) + " cr" }
      ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "bg-white/15 rounded-xl p-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75" }, s.label), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-sm mt-0.5" }, s.val))))
    ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, [["usage", t("\uC0AC\uC6A9 \uB0B4\uC5ED", "Usage")], ["charge", t("\uCDA9\uC804/\uC9C0\uAE09 \uB0B4\uC5ED", "Charges")]].map(([tab, l]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tab,
        onClick: () => setCreditSubTab(tab),
        className: `px-4 py-1.5 rounded-full text-xs font-bold transition ${creditSubTab === tab ? "bg-gray-800 text-white" : "bg-white text-gray-500 border border-gray-200"}`,
        style: { fontFamily: "'Noto Sans KR',sans-serif" }
      },
      l
    ))), creditSubTab === "usage" && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, usageTxns.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm text-center py-6" }, t("\uC0AC\uC6A9 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4", "No usage history")), usageTxns.map((tx, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-white rounded-xl p-3.5 flex items-center justify-between border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-base" }, reasonIcon(tx)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-700" }, reasonLabel(tx.reason)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400" }, fmtDt(tx.created_at)))), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm text-red-500" }, "-", tx.amount, " cr")))), creditSubTab === "charge" && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, chargeTxns.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm text-center py-6" }, t("\uCDA9\uC804 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4", "No charge history")), chargeTxns.map((tx, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-white rounded-xl p-3.5 flex items-center justify-between border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-base" }, reasonIcon(tx)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-700" }, reasonLabel(tx.reason)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400" }, fmtDt(tx.created_at)), tx.reason === "charge" && tx.pg_amount && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-blue-500 mt-0.5" }, "\u20A9", Number(tx.pg_amount).toLocaleString("ko-KR"), " ", t("\uACB0\uC81C \uC644\uB8CC", "payment complete")))), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm text-green-600" }, "+", tx.amount, " cr"))), chargeTxns.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-blue-50 rounded-xl p-3 text-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowChargeView(true),
        className: "text-sm font-bold text-blue-600 hover:text-blue-800",
        style: { fontFamily: "'Noto Sans KR',sans-serif" }
      },
      "+ ",
      t("\uD06C\uB808\uB527 \uCDA9\uC804\uD558\uAE30", "Top up credits")
    ))));
  })(), myPageTab === "history" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ExternalResultSection, { onSaved: loadTestHistory, externalShow: showExternalModal, setExternalShow: setShowExternalModal }), testHistory.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm text-center py-4" }, t("\uAC80\uC0AC \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4", "No assessment history")), (() => {
    const scored = ["PHQ9", "GAD7", "BURNOUT", "DSI"];
    const scoreMax = { PHQ9: 27, GAD7: 21, BURNOUT: 240, DSI: 125 };
    const scoreColor = (type, score) => {
      if (type === "PHQ9") return score >= 15 ? "#ef4444" : score >= 10 ? "#f97316" : score >= 5 ? "#eab308" : "#22c55e";
      if (type === "GAD7") return score >= 15 ? "#ef4444" : score >= 10 ? "#f97316" : score >= 5 ? "#eab308" : "#22c55e";
      if (type === "BURNOUT") {
        const p = score / 240;
        return p >= 0.71 ? "#ef4444" : p >= 0.51 ? "#f97316" : p >= 0.31 ? "#eab308" : "#22c55e";
      }
      if (type === "DSI") return score >= 90 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
      return "#6b7280";
    };
    const summaries = scored.map((type) => {
      const rows = testHistory.filter((h) => h.test_type === type && h.score != null);
      if (rows.length === 0) return null;
      return { type, rows };
    }).filter(Boolean);
    if (summaries.length === 0) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-emerald-700 mb-3" }, "\u{1F4C8} ", t("\uC810\uC218 \uCD94\uC774", "Score Trends")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, summaries.map(({ type, rows }) => {
      const latest = rows[0];
      const prev = rows[1];
      const diff = prev ? latest.score - prev.score : null;
      const max = scoreMax[type] || 100;
      const pct = Math.round(latest.score / max * 100);
      const color = scoreColor(type, latest.score);
      const testLabel = { PHQ9: t("\uC6B0\uC6B8(PHQ-9)", "Depression(PHQ-9)"), GAD7: t("\uBD88\uC548(GAD-7)", "Anxiety(GAD-7)"), BURNOUT: t("\uBC88\uC544\uC6C3", "Burnout"), DSI: t("\uC790\uC544\uBD84\uD654", "Self-Diff.") };
      return /* @__PURE__ */ React.createElement("div", { key: type, className: "bg-white rounded-xl p-3 border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mb-1" }, testLabel[type]), /* @__PURE__ */ React.createElement("div", { className: "flex items-end gap-1 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-bold", style: { color } }, latest.score), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 mb-0.5" }, "/", max), diff !== null && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold ml-1", style: { color: type === "DSI" ? diff > 0 ? "#22c55e" : "#ef4444" : diff > 0 ? "#ef4444" : "#22c55e" } }, diff > 0 ? `\u25B2${diff}` : diff < 0 ? `\u25BC${Math.abs(diff)}` : "\u2192")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-gray-100 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full transition-all", style: { width: `${pct}%`, background: color } })), latest.level && /* @__PURE__ */ React.createElement("div", { className: "text-xs mt-1", style: { color } }, latest.level));
    })));
  })(), (() => {
    const scored = ["PHQ9", "GAD7", "BURNOUT", "DSI"];
    const scoreMax = { PHQ9: 27, GAD7: 21, BURNOUT: 240, DSI: 125 };
    const colors = { PHQ9: "#6366f1", GAD7: "#f43f5e", BURNOUT: "#f97316", DSI: "#10b981" };
    const labels = { PHQ9: "PHQ-9", GAD7: "GAD-7", BURNOUT: t("\uBC88\uC544\uC6C3", "Burnout"), DSI: t("\uC790\uC544\uBD84\uD654", "Self-Diff.") };
    const series = scored.map((type) => {
      const rows = testHistory.filter((h) => h.test_type === type && h.score != null).slice().sort((a, b) => new Date(a.performed_at) - new Date(b.performed_at));
      return rows.length >= 2 ? { type, rows } : null;
    }).filter(Boolean);
    if (series.length === 0) return null;
    const W = 320, H = 110, PAD = { top: 10, bottom: 30, left: 28, right: 10 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const allDates = [...new Set(series.flatMap((s) => s.rows.map((r) => r.performed_at)))].sort();
    const xScale = (idx) => allDates.length < 2 ? PAD.left + innerW / 2 : PAD.left + idx / (allDates.length - 1) * innerW;
    const yScale = (score, max) => PAD.top + innerH - score / max * innerH;
    const dateLabel = (d) => {
      const dt = new Date(d);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-4 bg-white rounded-2xl border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-gray-600 mb-2" }, "\u{1F4C9} ", t("\uC810\uC218 \uC2DC\uACC4\uC5F4 \uCC28\uD2B8", "Score Timeline")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3 mb-2" }, series.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.type, className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-1.5 rounded-full", style: { background: colors[s.type] } }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500" }, labels[s.type])))), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", overflow: "visible" } }, [25, 50, 75, 100].map((pct) => {
      const y = PAD.top + innerH - pct / 100 * innerH;
      return /* @__PURE__ */ React.createElement("g", { key: pct }, /* @__PURE__ */ React.createElement("line", { x1: PAD.left, y1: y, x2: W - PAD.right, y2: y, stroke: "#f0f0f0", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("text", { x: PAD.left - 4, y: y + 3, textAnchor: "end", fontSize: "7", fill: "#ccc" }, pct));
    }), allDates.filter((_, i) => allDates.length <= 6 || i % Math.ceil(allDates.length / 5) === 0 || i === allDates.length - 1).map((d, i, arr) => /* @__PURE__ */ React.createElement("text", { key: d, x: xScale(allDates.indexOf(d)), y: H - 2, textAnchor: "middle", fontSize: "7", fill: "#aaa" }, dateLabel(d))), series.map((s) => {
      const max = scoreMax[s.type] || 100;
      const pts = s.rows.map((r) => {
        const xi = allDates.indexOf(r.performed_at);
        return [xScale(xi), yScale(r.score, max)];
      });
      const d = "M " + pts.map((p) => p.join(",")).join(" L ");
      return /* @__PURE__ */ React.createElement("g", { key: s.type }, /* @__PURE__ */ React.createElement("path", { d, fill: "none", stroke: colors[s.type], strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: "3", fill: colors[s.type] })));
    })));
  })(), moodTrend.length >= 2 && (() => {
    var _a2;
    const W = 320, H = 80, PAD = { top: 10, bottom: 20, left: 16, right: 8 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xScale = (i) => PAD.left + i / (moodTrend.length - 1) * innerW;
    const yScale = (s) => PAD.top + innerH - s / 100 * innerH;
    const pts = moodTrend.map((d, i) => [xScale(i), yScale(d.avg_score)]);
    const pathD = "M " + pts.map((p) => p.join(",")).join(" L ");
    const areaD = `${pathD} L ${pts[pts.length - 1][0]},${PAD.top + innerH} L ${pts[0][0]},${PAD.top + innerH} Z`;
    const lastScore = (_a2 = moodTrend[moodTrend.length - 1]) == null ? void 0 : _a2.avg_score;
    const moodColor = lastScore >= 70 ? "#22c55e" : lastScore >= 40 ? "#f59e0b" : "#ef4444";
    const moodLabel = lang === "en" ? lastScore >= 70 ? "Good" : lastScore >= 40 ? "Moderate" : "Struggling" : lastScore >= 70 ? "\uC591\uD638" : lastScore >= 40 ? "\uBCF4\uD1B5" : "\uD798\uB4E6";
    return /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-4 bg-white rounded-2xl border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-gray-600" }, "\u{1F499} ", t("AI \uC0C1\uB2F4 \uAC10\uC815 \uCD94\uC774", "Mood Trend from AI Sessions")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold", style: { color: moodColor } }, Math.round(lastScore)), /* @__PURE__ */ React.createElement("span", { className: "text-xs px-2 py-0.5 rounded-full font-semibold", style: { background: moodColor + "20", color: moodColor } }, moodLabel))), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", overflow: "visible" } }, /* @__PURE__ */ React.createElement("path", { d: areaD, fill: moodColor, fillOpacity: "0.08" }), /* @__PURE__ */ React.createElement("path", { d: pathD, fill: "none", stroke: moodColor, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: "3", fill: moodColor })), moodTrend.filter((_, i) => moodTrend.length <= 7 || i % Math.ceil(moodTrend.length / 5) === 0 || i === moodTrend.length - 1).map((d, _, arr) => {
      const i = moodTrend.indexOf(d);
      const dt = new Date(d.day);
      const label = `${dt.getMonth() + 1}/${dt.getDate()}`;
      return /* @__PURE__ */ React.createElement("text", { key: d.day, x: xScale(i), y: H - 2, textAnchor: "middle", fontSize: "7", fill: "#aaa" }, label);
    })), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, t(`\uCD5C\uADFC ${moodTrend.length}\uD68C AI \uC0C1\uB2F4 \uAE30\uBC18`, `Based on last ${moodTrend.length} AI sessions`)));
  })(), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, testHistory.map((h, i) => {
    const prevSame = testHistory.slice(i + 1).find((p) => p.test_type === h.test_type);
    const testEmoji2 = { PHQ9: "\u{1F614}", GAD7: "\u{1F630}", DASS21: "\u{1F4CA}", BIG5: "\u{1F31F}", LOST: "\u{1F9ED}", SCT: "\u270D\uFE0F", DSI: "\u{1FA9E}", BURNOUT: "\u{1F525}", RIASEC: "\u{1F50D}", VALUES: "\u{1F48E}" };
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-white rounded-xl p-3 border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, testEmoji2[h.test_type] || "\u{1F4CB}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-700 text-sm" }, h.test_type), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 ml-2" }, new Date(h.performed_at).toLocaleDateString("ko-KR")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, h.score != null && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100" }, h.score, "\uC810"), h.level && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100" }, h.level), prevSame && /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100" }, t("\uC7AC\uAC80\uC0AC", "Retest")))));
  }))), myPageTab === "referral" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Msg, { msg: referralMsg }), referralLoading ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 text-gray-400" }, t("\uB85C\uB529 \uC911...", "Loading...")) : referralData ? /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-5 text-white" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs opacity-75 mb-1" }, t("\uB0B4 \uCD08\uB300 \uCF54\uB4DC", "My Invite Code")), /* @__PURE__ */ React.createElement("div", { className: "text-3xl font-bold tracking-widest mb-3" }, referralData.code), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => copyInviteLink(referralData.inviteUrl),
      className: "w-full bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-xl font-semibold text-sm transition"
    },
    "\u{1F517} ",
    t("\uCD08\uB300 \uB9C1\uD06C \uBCF5\uC0AC", "Copy invite link")
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-amber-800 text-sm mb-2" }, "\u{1F381} ", t("\uCD08\uB300 \uBCF4\uC0C1", "Referral Rewards")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-amber-700" }, "\u2726 ", t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uCE5C\uAD6C\uAC00 \uB9C1\uD06C\uB85C \uAC00\uC785\uD558\uBA74 \uCE5C\uAD6C\uC5D0\uAC8C ", /* @__PURE__ */ React.createElement("strong", null, "+10 \uD06C\uB808\uB527")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Friend gets ", /* @__PURE__ */ React.createElement("strong", null, "+10 credits"), " when they sign up"))), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-amber-700" }, "\u2726 ", t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uCE5C\uAD6C\uAC00 \uCCAB \uACB0\uC81C \uC644\uB8CC \uC2DC \uB098\uC5D0\uAC8C ", /* @__PURE__ */ React.createElement("strong", null, "+30 \uD06C\uB808\uB527")), /* @__PURE__ */ React.createElement(React.Fragment, null, "You get ", /* @__PURE__ */ React.createElement("strong", null, "+30 credits"), " when friend makes first purchase")))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, [[t("\uCD08\uB300", "Invited"), referralData.stats.totalInvited], [t("\uC644\uB8CC", "Done"), referralData.stats.completed], [t("\uD68D\uB4DD", "Earned"), referralData.stats.totalEarned + " cr"]].map(([label, val]) => /* @__PURE__ */ React.createElement("div", { key: label, className: "bg-white rounded-2xl p-4 text-center border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-green-700" }, val), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-1" }, label)))), referralList.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-gray-700 text-sm mb-2" }, t("\uCD08\uB300 \uBAA9\uB85D", "Invite List")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, referralList.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-white rounded-xl p-3 flex items-center justify-between border border-gray-100" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-gray-700" }, r.referee_email_masked), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 ml-2" }, new Date(r.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR"))), /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold px-2 py-1 rounded-full ${r.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}` }, r.status === "completed" ? t("\uC644\uB8CC", "Done") + " +" + r.referrer_bonus + "cr" : t("\uB300\uAE30 \uC911", "Pending"))))))) : /* @__PURE__ */ React.createElement("button", { onClick: loadReferralData, className: "w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition" }, t("\uCD08\uB300 \uCF54\uB4DC \uBD88\uB7EC\uC624\uAE30", "Load invite code")), /* @__PURE__ */ React.createElement("div", { className: "mt-5 pt-5 border-t border-gray-100" }, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-gray-700 text-sm mb-2" }, t("\uCE5C\uAD6C \uCD08\uB300 \uCF54\uB4DC \uC785\uB825", "Enter a friend's invite code")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: t("PSY\uCF54\uB4DC \uC785\uB825", "Enter PSY code"),
      value: referralInput,
      onChange: (e) => setReferralInput(e.target.value.toUpperCase()),
      className: "flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm font-mono"
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: applyReferralCode, className: "bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-800 transition" }, t("\uC801\uC6A9", "Apply"))))), myPageTab === "appointments" && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl" }, "\u{1F3E5}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-800 text-lg mb-1" }, t("\uC804\uBB38 \uC0C1\uB2F4 \uAE30\uAD00 \uC548\uB0B4", "Professional Counseling Centers")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB9C8\uC74C\uD480\uC740 \uC2EC\uB9AC\uAC80\uC0AC \uBC0F AI \uC0C1\uB2F4 \uC11C\uBE44\uC2A4\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640\uC758 \uC0C1\uB2F4\uC740 \uAC01 \uAE30\uAD00\uC5D0 \uC9C1\uC811 \uC5F0\uB77D\uD558\uC2DC\uAC70\uB098", /* @__PURE__ */ React.createElement("br", null), "\uC544\uB798 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uAC00\uAE4C\uC6B4 \uC0C1\uB2F4\uC13C\uD130\uB97C \uCC3E\uC544\uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Maumful provides psychological assessments and AI counseling.", /* @__PURE__ */ React.createElement("br", null), "For professional counseling, contact a center directly or", /* @__PURE__ */ React.createElement("br", null), "tap below to find one near you.")))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setView("counseling");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      className: "inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition"
    },
    "\u{1F3E5} ",
    t("\uC0C1\uB2F4\uC13C\uD130 \uCC3E\uAE30 \u2192", "Find a Center \u2192")
  )), myPageTab === "settings" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-700 mb-3" }, t("\uC5B8\uC5B4 \uC124\uC815", "Language")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [["ko", "\uD55C\uAD6D\uC5B4"], ["en", "English"]].map(([lang2, label]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: lang2,
      onClick: async () => {
        await api.updateMe({ locale: lang2 });
        setCurrentUser((p) => ({ ...p, locale: lang2 }));
        tokenStore.setUser({ ...currentUser, locale: lang2 });
      },
      className: `px-4 py-2 rounded-full text-sm font-semibold transition ${(currentUser == null ? void 0 : currentUser.locale) === lang2 ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`
    },
    label
  )))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-700 mb-1" }, t("AI \uC0C1\uB2F4 \uD574\uC11D \uBC29\uC2DD", "AI Counseling Mode")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-3" }, t("\uAC80\uC0AC \uACB0\uACFC\uB97C \uC5B4\uB5A4 \uAD00\uC810\uC73C\uB85C \uD574\uC11D\uD560\uC9C0 \uC120\uD0DD\uD569\uB2C8\uB2E4", "Choose how AI interprets your results")), /* @__PURE__ */ React.createElement("div", { className: "grid gap-2" }, [
    {
      mode: "psychological",
      icon: "\u{1F9E0}",
      label: t("\uC2EC\uB9AC\uC0C1\uB2F4 (\uAE30\uBCF8)", "Psychology (default)"),
      desc: t("\uC2EC\uB9AC\uD559 \uC774\uB860\uACFC \uACFC\uD559\uC801 \uADFC\uAC70\uB97C \uBC14\uD0D5\uC73C\uB85C \uD574\uC11D\uD569\uB2C8\uB2E4", "Interpreted through psychological theory and scientific evidence"),
      activeClass: "border-green-500 bg-green-50",
      checkClass: "text-green-600"
    },
    {
      mode: "biblical",
      icon: "\u271D\uFE0F",
      label: t("\uAE30\uB3C5\uAD50 \uC0C1\uB2F4", "Christian Counseling"),
      desc: t("\uC131\uACBD \uB9D0\uC500\uACFC \uAE30\uB3C5\uAD50 \uC2E0\uC559\uC744 \uAE30\uBC18\uC73C\uB85C \uD574\uC11D\uD569\uB2C8\uB2E4", "Interpreted through Scripture and Christian faith"),
      activeClass: "border-purple-400 bg-purple-50",
      checkClass: "text-purple-600"
    }
  ].map(({ mode, icon, label, desc, activeClass, checkClass }) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: mode,
      onClick: () => updateCounselingMode(mode),
      className: `flex items-start gap-3 p-4 rounded-xl border-2 text-left transition w-full
                      ${counselingMode === mode ? activeClass : "border-gray-100 hover:border-gray-300"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "text-xl mt-0.5" }, icon),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: `font-semibold text-sm ${counselingMode === mode ? checkClass : "text-gray-700"}` }, label), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-0.5" }, desc)),
    counselingMode === mode && /* @__PURE__ */ React.createElement("span", { className: `${checkClass} font-bold text-sm` }, "\u2713")
  ))), counselingMode === "biblical" && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-purple-600 mt-2 bg-purple-50 rounded-lg p-2 leading-relaxed" }, "\u271D\uFE0F ", t("\uAE30\uB3C5\uAD50 \uC0C1\uB2F4 \uBAA8\uB4DC \uC801\uC6A9 \uC911 \u2014 AI \uBD84\uC11D\uACFC \uCC44\uD305 \uC0C1\uB2F4\uC5D0 \uC131\uACBD\uC801 \uAD00\uC810\uC758 \uD574\uC11D\uACFC \uAD8C\uC7A5\uC0AC\uD56D\uC774 \uD3EC\uD568\uB429\uB2C8\uB2E4", "Christian counseling mode active \u2014 AI analysis and chat include biblical perspectives and recommendations"))), pushStatus !== "unsupported" && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-700 mb-1" }, "\u{1F514} ", t("\uD478\uC2DC \uC54C\uB9BC", "Push Notifications")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-3" }, t("\uAC80\uC0AC \uACB0\uACFC \uC5C5\uB370\uC774\uD2B8, \uC0C1\uB2F4 \uC54C\uB9BC\uC744 \uBC14\uB85C \uBC1B\uC544\uBCF4\uC138\uC694", "Get instant alerts for result updates and sessions")), pushStatus === "denied" ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 bg-red-50 rounded-xl p-3" }, t("\uBE0C\uB77C\uC6B0\uC800 \uC54C\uB9BC\uC774 \uCC28\uB2E8\uB418\uC5B4 \uC788\uC5B4\uC694. \uC8FC\uC18C \uD45C\uC2DC\uC904\uC758 \uC7A0\uAE08 \uC544\uC774\uCF58\uC5D0\uC11C \uC54C\uB9BC \uAD8C\uD55C\uC744 \uD5C8\uC6A9\uD574 \uC8FC\uC138\uC694.", "Notifications are blocked. Allow them from the lock icon in your address bar.")) : pushStatus === "subscribed" ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-green-700 font-semibold" }, "\u2705 ", t("\uC54C\uB9BC \uCF1C\uC838 \uC788\uC74C", "Notifications on")), /* @__PURE__ */ React.createElement("button", { onClick: unsubscribePush, className: "text-xs text-gray-400 hover:text-gray-600 underline" }, t("\uB044\uAE30", "Turn off"))) : /* @__PURE__ */ React.createElement("button", { onClick: subscribePush, className: "w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 transition" }, "\u{1F514} ", t("\uC54C\uB9BC \uCF1C\uAE30", "Enable notifications"))), (currentUser == null ? void 0 : currentUser.email) && !(currentUser == null ? void 0 : currentUser.social_provider) && !(currentUser == null ? void 0 : currentUser.is_email_verified) && /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 rounded-2xl p-4 border border-amber-200" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-amber-800 mb-1" }, "\u{1F4E7} ", t("\uC774\uBA54\uC77C \uBBF8\uC778\uC99D", "Email Not Verified")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700 mb-3" }, t("\uC774\uBA54\uC77C \uC778\uC99D\uC744 \uC644\uB8CC\uD558\uBA74 \uACC4\uC815\uC744 \uC548\uC804\uD558\uAC8C \uBCF4\uD638\uD560 \uC218 \uC788\uC5B4\uC694", "Verify your email to keep your account secure")), /* @__PURE__ */ React.createElement("button", { onClick: async () => {
    const r = await fetch("/api/auth/resend-verify", { method: "POST", headers: { "Content-Type": "application/json", ...api._authHeader() }, body: JSON.stringify({ email: currentUser.email }) }).then((r2) => r2.json());
    alert(r.success ? t("\uC778\uC99D \uC774\uBA54\uC77C\uC744 \uBC1C\uC1A1\uD588\uC5B4\uC694!", "Verification email sent!") : r.error || t("\uBC1C\uC1A1 \uC2E4\uD328", "Send failed"));
  }, className: "w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition" }, "\u{1F4E7} ", t("\uC778\uC99D \uC774\uBA54\uC77C \uC7AC\uBC1C\uC1A1", "Resend verification email"))), (currentUser == null ? void 0 : currentUser.email) && !(currentUser == null ? void 0 : currentUser.social_provider) && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-5 border border-gray-100" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-700 mb-3" }, t("\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD", "Change Password")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-3" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "cp-current",
      type: "password",
      placeholder: t("\uD604\uC7AC \uBE44\uBC00\uBC88\uD638", "Current password"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "cp-new",
      type: "password",
      placeholder: t("\uC0C8 \uBE44\uBC00\uBC88\uD638 (8\uC790 \uC774\uC0C1)", "New password (min. 8 chars)"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "cp-confirm",
      type: "password",
      placeholder: t("\uC0C8 \uBE44\uBC00\uBC88\uD638 \uD655\uC778", "Confirm new password"),
      className: "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm"
    }
  )), changePwMsg.text && /* @__PURE__ */ React.createElement("p", { className: `text-xs mb-3 px-3 py-2 rounded-lg ${changePwMsg.type === "success" ? "bg-green-50 text-green-700" : changePwMsg.type === "error" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}` }, changePwMsg.text), /* @__PURE__ */ React.createElement("button", { onClick: async () => {
    var _a2, _b2, _c2;
    const cur = ((_a2 = document.getElementById("cp-current")) == null ? void 0 : _a2.value) || "";
    const nw = ((_b2 = document.getElementById("cp-new")) == null ? void 0 : _b2.value) || "";
    const conf = ((_c2 = document.getElementById("cp-confirm")) == null ? void 0 : _c2.value) || "";
    if (!cur || !nw || !conf) {
      setChangePwMsg({ type: "error", text: t("\uBAA8\uB4E0 \uD56D\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.", "Please fill in all fields.") });
      return;
    }
    if (nw.length < 8) {
      setChangePwMsg({ type: "error", text: t("\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.", "Password must be at least 8 characters.") });
      return;
    }
    if (nw !== conf) {
      setChangePwMsg({ type: "error", text: t("\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Passwords do not match.") });
      return;
    }
    setChangePwMsg({ type: "loading", text: t("\uBCC0\uACBD \uC911...", "Updating...") });
    const r = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...api._authHeader() },
      body: JSON.stringify({ currentPassword: cur, newPassword: nw })
    }).then((r2) => r2.json());
    if (r.success) {
      setChangePwMsg({ type: "success", text: t("\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "Password updated successfully.") });
      document.getElementById("cp-current").value = "";
      document.getElementById("cp-new").value = "";
      document.getElementById("cp-confirm").value = "";
    } else {
      setChangePwMsg({ type: "error", text: r.error || t("\uBCC0\uACBD \uC2E4\uD328", "Update failed") });
    }
  }, className: "w-full bg-green-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-800 transition" }, t("\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD", "Change Password"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        if (window.confirm(t("\uC815\uB9D0 \uD0C8\uD1F4\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?", "Are you sure you want to delete your account?"))) {
          await api.deleteMe();
          handleLogout();
        }
      },
      className: "w-full bg-red-50 text-red-500 border border-red-200 py-3 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
    },
    t("\uD68C\uC6D0 \uD0C8\uD1F4", "Delete Account")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleLogout,
      className: "w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
    },
    "\uB85C\uADF8\uC544\uC6C3"
  ))), showChargeView && /* @__PURE__ */ React.createElement(ChargeView, { onClose: () => {
    setShowChargeView(false);
    refreshCredits();
  }, credits, regionConfig }));
  function ChargeView({ onClose, credits: credits2, regionConfig: regionConfig2 }) {
    const { useState: useS, useEffect: useE } = React;
    const isKorea = !regionConfig2 || regionConfig2.pg === "toss";
    const currency = isKorea ? "KRW" : "USD";
    const PACKAGES_KR = [
      { key: "starter_kr", credits: 50, amount: 2900, label: t("\uC2A4\uD0C0\uD130", "Starter"), badge: null },
      { key: "standard_kr", credits: 120, amount: 5900, label: t("\uD45C\uC900", "Standard"), badge: t("\uC778\uAE30", "Popular") },
      { key: "premium_kr", credits: 300, amount: 12900, label: t("\uD504\uB9AC\uBBF8\uC5C4", "Premium"), badge: t("\uCD94\uCC9C", "Best") },
      { key: "pro_kr", credits: 700, amount: 24900, label: t("\uB300\uC6A9\uB7C9", "Pro"), badge: null }
    ];
    const PACKAGES_GLOBAL = [
      { key: "starter_g", credits: 50, amount: 2.99, label: "Starter", badge: null },
      { key: "standard_g", credits: 120, amount: 5.99, label: "Standard", badge: "Popular" },
      { key: "premium_g", credits: 300, amount: 12.99, label: "Premium", badge: "Best" },
      { key: "pro_g", credits: 700, amount: 24.99, label: "Pro", badge: null }
    ];
    const pkgs = isKorea ? PACKAGES_KR : PACKAGES_GLOBAL;
    const fmt = (amt) => isKorea ? amt.toLocaleString("ko-KR") + "\uC6D0" : "$" + amt.toFixed(2);
    const [activeTab, setActiveTab] = useS("credits");
    const [selected, setSelected] = useS(pkgs[1].key);
    const [loading, setLoading] = useS(false);
    const [errMsg, setErrMsg] = useS("");
    const [billingCycle, setBillingCycle] = useS("monthly");
    const selPkg = pkgs.find((p) => p.key === selected);
    const handlePay = async () => {
      if (!currentUser) {
        onClose();
        setView("memberLogin");
        return;
      }
      setLoading(true);
      setErrMsg("");
      try {
        if (isKorea) {
          const res = await api.tossCheckout(selected);
          if (!res.success) {
            setErrMsg(res.error || t("\uACB0\uC81C \uC900\uBE44 \uC2E4\uD328", "Payment preparation failed"));
            setLoading(false);
            return;
          }
          const d = res.data;
          if (typeof window.TossPayments !== "function") {
            setErrMsg(t("\uACB0\uC81C SDK \uB85C\uB4DC \uC2E4\uD328. \uD398\uC774\uC9C0\uB97C \uC0C8\uB85C\uACE0\uCE68(Ctrl+Shift+R) \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "Payment SDK failed to load. Please hard-refresh and try again."));
            setLoading(false);
            return;
          }
          const tossPayments = window.TossPayments(d.clientKey);
          await tossPayments.requestPayment("\uCE74\uB4DC", {
            amount: d.amount,
            orderId: d.orderId,
            orderName: d.orderName,
            customerName: d.customerName,
            customerEmail: d.customerEmail,
            successUrl: d.successUrl,
            failUrl: d.failUrl
          });
        } else {
          const res = await api.prepareCharge(selected, "stripe");
          if (!res.success) {
            setErrMsg(res.error || t("\uACB0\uC81C \uC900\uBE44 \uC2E4\uD328", "Payment preparation failed"));
            setLoading(false);
            return;
          }
          const d = res.data;
          if (d.checkoutUrl) window.location.href = d.checkoutUrl;
        }
      } catch (err) {
        console.error("[Toss] \uACB0\uC81C \uC5D0\uB7EC:", err);
        if ((err == null ? void 0 : err.code) !== "USER_CANCEL") {
          const detail = (err == null ? void 0 : err.message) ? ` (${err.code || ""}: ${err.message})` : "";
          setErrMsg(t("\uACB0\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." + detail, "Payment error: " + detail));
        }
        setLoading(false);
      }
    };
    const F = "'Noto Sans KR',sans-serif";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 1e3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        },
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        background: "white",
        borderRadius: 22,
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        overflow: "hidden",
        fontFamily: F,
        display: "flex",
        flexDirection: "column",
        maxHeight: "92vh"
      } }, /* @__PURE__ */ React.createElement("div", { style: { background: "linear-gradient(135deg,#2D6A4F,#40916C)", padding: "22px 24px", color: "white" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, opacity: 0.8, marginBottom: 4 } }, t("\uD604\uC7AC \uC794\uC561", "Balance")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 800 } }, "\u2726 ", credits2), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, opacity: 0.75, marginTop: 2 } }, t("\uD06C\uB808\uB527", "credits"))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          style: {
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: "pointer",
            color: "white",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }
        },
        "\xD7"
      )), /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 14,
        fontSize: 12,
        opacity: 0.85,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "6px 12px",
        display: "inline-block"
      } }, t("\uC2EC\uB9AC\uAC80\uC0AC 1\uD68C = 10 \uD06C\uB808\uB527 \xB7 AI \uCC44\uD305 1\uD68C = 2 \uD06C\uB808\uB527", "Assessment = 10 cr \xB7 AI chat = 2 cr"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderBottom: "1px solid #E5E7EB" } }, [["credits", t("\u2726 \uD06C\uB808\uB527 \uCDA9\uC804", "\u2726 Top Up")], ["plans", t("\u{1F48E} \uBA64\uBC84\uC2ED \uD50C\uB79C", "\u{1F48E} Plans")]].map(([tab, label]) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: tab,
          onClick: () => setActiveTab(tab),
          style: {
            flex: 1,
            padding: "12px",
            border: "none",
            cursor: "pointer",
            fontFamily: F,
            fontSize: 13,
            fontWeight: 700,
            background: "white",
            color: activeTab === tab ? "#2D6A4F" : "#9CA3AF",
            borderBottom: activeTab === tab ? "2px solid #2D6A4F" : "2px solid transparent",
            transition: "all 0.15s"
          }
        },
        label
      ))), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px 24px", maxHeight: "65vh", overflowY: "auto" } }, activeTab === "credits" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 } }, t("\uD328\uD0A4\uC9C0 \uC120\uD0DD", "Select Package")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 18 } }, pkgs.map((pkg) => {
        const isSel = selected === pkg.key;
        const perCredit = isKorea ? Math.round(pkg.amount / pkg.credits) + "\uC6D0/cr" : "$" + (pkg.amount / pkg.credits).toFixed(2) + "/cr";
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: pkg.key,
            onClick: () => setSelected(pkg.key),
            style: {
              position: "relative",
              padding: "12px",
              border: "2px solid",
              borderColor: isSel ? "#2D6A4F" : "rgba(0,0,0,0.1)",
              borderRadius: 13,
              cursor: "pointer",
              background: isSel ? "#F0FAF4" : "white",
              textAlign: "left",
              transition: "all 0.15s",
              fontFamily: F
            }
          },
          pkg.badge && /* @__PURE__ */ React.createElement("div", { style: {
            position: "absolute",
            top: -8,
            right: 8,
            background: isSel ? "#2D6A4F" : "#F59E0B",
            color: "white",
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 7px",
            borderRadius: 20
          } }, pkg.badge),
          /* @__PURE__ */ React.createElement("div", { style: {
            fontSize: 12,
            fontWeight: 700,
            color: isSel ? "#2D6A4F" : "#374151",
            marginBottom: 3
          } }, pkg.label),
          /* @__PURE__ */ React.createElement("div", { style: {
            fontSize: 20,
            fontWeight: 800,
            color: isSel ? "#2D6A4F" : "#111"
          } }, "\u2726 ", pkg.credits),
          /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#6B7280", marginTop: 1 } }, perCredit),
          /* @__PURE__ */ React.createElement("div", { style: {
            fontSize: 14,
            fontWeight: 700,
            color: isSel ? "#2D6A4F" : "#374151",
            marginTop: 5
          } }, fmt(pkg.amount))
        );
      })), selPkg && /* @__PURE__ */ React.createElement("div", { style: {
        background: "#F9FAFB",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 10,
        border: "1px solid rgba(0,0,0,0.07)"
      } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280" } }, /* @__PURE__ */ React.createElement("span", null, selPkg.label, " \xB7 \u2726 ", selPkg.credits, " ", t("\uD06C\uB808\uB527", "cr")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#111", fontSize: 15 } }, fmt(selPkg.amount), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#9CA3AF", fontWeight: 400, marginLeft: 4 } }, "(", t("VAT \uD3EC\uD568", "incl. VAT"), ")")), isKorea && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#9CA3AF", marginTop: 2 } }, t("\uACF5\uAE09\uAC00", "Net"), " ", Math.round(selPkg.amount / 1.1).toLocaleString("ko-KR"), "\uC6D0 + ", t("\uBD80\uAC00\uC138", "VAT"), " ", Math.round(selPkg.amount - selPkg.amount / 1.1).toLocaleString("ko-KR"), "\uC6D0"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 11, color: "#9CA3AF" } }, t(
        `\uCDA9\uC804 \uD6C4 \uC794\uC561: \u2726 ${credits2 + selPkg.credits} \uD06C\uB808\uB527 \xB7 \uAC80\uC0AC ${Math.floor((credits2 + selPkg.credits) / 10)}\uD68C \uAC00\uB2A5`,
        `After top-up: \u2726 ${credits2 + selPkg.credits} cr \xB7 ${Math.floor((credits2 + selPkg.credits) / 10)} assessments`
      ))), /* @__PURE__ */ React.createElement("div", { style: {
        background: "#FEF9EC",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        padding: "11px 14px",
        marginBottom: 10,
        fontSize: 11,
        color: "#78350F",
        lineHeight: 1.8
      } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 4, color: "#92400E" } }, "\u26A0 ", t("\uACB0\uC81C \uC804 \uD655\uC778\uD558\uC138\uC694", "Before you pay")), /* @__PURE__ */ React.createElement("ul", { style: { margin: 0, paddingLeft: 14 } }, t(
        /* @__PURE__ */ React.createElement("li", null, "\uD06C\uB808\uB527\uC744 ", /* @__PURE__ */ React.createElement("strong", null, "1\uAC1C\uB77C\uB3C4 \uC0AC\uC6A9\uD55C \uACBD\uC6B0"), " \uCCAD\uC57D\uCCA0\uD68C\uAC00 \uC81C\uD55C\uB429\uB2C8\uB2E4. (\uC804\uC790\uC0C1\uAC70\uB798\uBC95 \uC81C17\uC870 \uC81C2\uD56D \uC81C5\uD638)"),
        /* @__PURE__ */ React.createElement("li", null, "Refunds are restricted once ", /* @__PURE__ */ React.createElement("strong", null, "any credit is used"), ". (Korean E-commerce Act \xA717\u2461\u2464)")
      ), t(
        /* @__PURE__ */ React.createElement("li", null, "\uBBF8\uC0AC\uC6A9 \uD06C\uB808\uB527\uC740 \uAD6C\uB9E4\uC77C\uB85C\uBD80\uD130 ", /* @__PURE__ */ React.createElement("strong", null, "7\uC77C \uC774\uB0B4"), " \uC804\uC561 \uD658\uBD88 \uAC00\uB2A5\uD569\uB2C8\uB2E4."),
        /* @__PURE__ */ React.createElement("li", null, "Unused credits are fully refundable within ", /* @__PURE__ */ React.createElement("strong", null, "7 days"), " of purchase.")
      ), t(
        /* @__PURE__ */ React.createElement("li", null, "\uCDA9\uC804\uD55C \uD06C\uB808\uB527\uC740 \uCDA9\uC804\uC77C\uB85C\uBD80\uD130 ", /* @__PURE__ */ React.createElement("strong", null, "1\uB144\uAC04 \uC720\uD6A8"), "\uD569\uB2C8\uB2E4."),
        /* @__PURE__ */ React.createElement("li", null, "Charged credits are valid for ", /* @__PURE__ */ React.createElement("strong", null, "1 year"), " from the date of purchase.")
      ), isKorea && t(
        /* @__PURE__ */ React.createElement("li", null, "\uACB0\uC81C \uC2DC \uC774\uBA54\uC77C\xB7\uACB0\uC81C\uAE08\uC561\uC774 ", /* @__PURE__ */ React.createElement("strong", null, "\uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20(\uC8FC)"), "\uC5D0 \uC81C\uACF5\uB429\uB2C8\uB2E4. (\uACB0\uC81C \uCC98\uB9AC \uBAA9\uC801)"),
        /* @__PURE__ */ React.createElement("li", null, "Your email and payment amount will be shared with ", /* @__PURE__ */ React.createElement("strong", null, "TossPayments"), " for processing.")
      ), /* @__PURE__ */ React.createElement("li", null, t("\uD658\uBD88 \uBB38\uC758:", "Refund inquiries:"), " support@maumful.com")))), activeTab === "plans" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F3F4F6", borderRadius: 12, padding: 3, display: "inline-flex", gap: 2 } }, [["monthly", t("\uC6D4\uAC04", "Monthly")], ["annual", t("\uC5F0\uAC04 \u{1F389} 20% \uD560\uC778", "Annual \u{1F389} 20% off")]].map(([cyc, lbl]) => /* @__PURE__ */ React.createElement("button", { key: cyc, onClick: () => setBillingCycle(cyc), style: {
        padding: "6px 14px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        fontFamily: F,
        background: billingCycle === cyc ? "white" : "transparent",
        color: billingCycle === cyc ? "#1F2937" : "#9CA3AF",
        boxShadow: billingCycle === cyc ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
      } }, lbl)))), [
        {
          name: t("\uB9C8\uC74C\uD480 Plus", "Maumful Plus"),
          priceKrw: 5900,
          priceUsd: 5.99,
          color: "#2D6A4F",
          colorL: "#F0FAF4",
          emoji: "\u{1F9E0}",
          features: [t("\uC6D4 100 \uD06C\uB808\uB527 \uC9C0\uAE09", "100 credits/month"), t("AI \uCC44\uD305 \uBB34\uC81C\uD55C", "Unlimited AI chat"), t("\uAC80\uC0AC \uC774\uB825 \uBB34\uC81C\uD55C \uBCF4\uAD00", "Unlimited history"), t("\uC6B0\uC120 \uACE0\uAC1D \uC9C0\uC6D0", "Priority support")]
        },
        {
          name: t("\uB9C8\uC74C\uCEE4\uD50C Plus", "MaumCouple Plus"),
          priceKrw: 9900,
          priceUsd: 9.99,
          color: "#B5556A",
          colorL: "#FCF0F3",
          emoji: "\u{1F495}",
          features: [t("\uC6D4 150 \uD06C\uB808\uB527 \uC9C0\uAE09", "150 credits/month"), t("\uC6D4 1\uD68C \uCEE4\uD50C \uB9AC\uD3EC\uD2B8 \uD3EC\uD568", "1 couple report/month"), t("AI \uAD00\uACC4 \uCF54\uCE58 \uBB34\uC81C\uD55C", "Unlimited AI relationship coach"), t("\uB370\uC774\uD2B8 \uCF54\uC2A4 \uBB34\uC81C\uD55C", "Unlimited date courses")]
        },
        {
          name: t("\uB9C8\uC74C\uAC00\uC871 \uD50C\uB79C", "Maumful Family"),
          priceKrw: 14900,
          priceUsd: 14.99,
          color: "#7C3AED",
          colorL: "#F5F3FF",
          emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
          features: [t("\uCD5C\uB300 4\uC778 \uAC00\uC871 \uACC4\uC815 \uACF5\uC720", "Up to 4 family members"), t("\uC6D4 500 \uD06C\uB808\uB527 \uACF5\uC720", "500 shared credits/month"), t("AI \uCC44\uD305 \uAC00\uC871 \uC804\uC6D0 \uC774\uC6A9", "AI chat for all members"), t("\uC6D4 1\uD68C \uAC00\uC871 \uC2EC\uB9AC \uB9AC\uD3EC\uD2B8", "1 family wellness report/month"), t("\uAC80\uC0AC \uC774\uB825 \uBB34\uC81C\uD55C \uBCF4\uAD00", "Unlimited history")]
        }
      ].map((plan) => {
        const isAnnual = billingCycle === "annual";
        const monthlyKrw = isAnnual ? Math.round(plan.priceKrw * 0.8) : plan.priceKrw;
        const monthlyUsd = isAnnual ? Math.round(plan.priceUsd * 0.8 * 100) / 100 : plan.priceUsd;
        const priceLabel = isKorea ? `\uC6D4 ${monthlyKrw.toLocaleString("ko-KR")}\uC6D0` : `$${monthlyUsd.toFixed(2)}/mo`;
        const billingLabel = isAnnual ? isKorea ? `\uC5F0 ${(monthlyKrw * 12).toLocaleString("ko-KR")}\uC6D0 ${t("\uC77C\uC2DC\uACB0\uC81C", "billed annually")}` : `$${(monthlyUsd * 12).toFixed(2)}/yr` : t("\uC6D4 \uC790\uB3D9 \uACB0\uC81C", "billed monthly");
        return /* @__PURE__ */ React.createElement("div", { key: plan.name, style: {
          borderRadius: 16,
          border: `2px solid ${plan.color}22`,
          marginBottom: 14,
          overflow: "hidden",
          fontFamily: F
        } }, /* @__PURE__ */ React.createElement("div", { style: {
          background: `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`,
          padding: "14px 18px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.85, marginBottom: 2 } }, plan.emoji, " ", t("\uAD6C\uB3C5 \uD50C\uB79C", "Subscription")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800 } }, plan.name)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800 } }, priceLabel), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, opacity: 0.8, marginTop: 2 } }, billingLabel), isAnnual && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, background: "rgba(255,255,255,0.25)", borderRadius: 6, padding: "1px 6px", marginTop: 3 } }, isKorea ? `\uC6D4 ${plan.priceKrw.toLocaleString()}\uC6D0 \uB300\uBE44 20% \uC808\uC57D` : `vs $${plan.priceUsd}/mo save 20%`))), /* @__PURE__ */ React.createElement("div", { style: { background: plan.colorL, padding: "12px 18px" } }, plan.features.map((f) => /* @__PURE__ */ React.createElement("div", { key: f, style: { fontSize: 13, color: "#374151", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { color: plan.color, fontWeight: 700 } }, "\u2713"), " ", f)), /* @__PURE__ */ React.createElement("button", { onClick: async () => {
          const email = (currentUser == null ? void 0 : currentUser.email) || "";
          if (!email) {
            alert(t("\uB85C\uADF8\uC778 \uD6C4 \uAD00\uC2EC \uB4F1\uB85D\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4.", "Please sign in to register your interest."));
            return;
          }
          await api._fetch("/api/credits/notify-plan", {
            method: "POST",
            body: JSON.stringify({ plan: plan.name, email })
          });
          alert(t(`${plan.name} \uC624\uD508 \uC54C\uB9BC\uC744 \uC2E0\uCCAD\uD588\uC2B5\uB2C8\uB2E4! \uC900\uBE44\uB418\uBA74 \uC774\uBA54\uC77C\uB85C \uC54C\uB824\uB4DC\uB9B4\uAC8C\uC694 \u{1F389}`, `You're on the waitlist for ${plan.name}! We'll email you when it's ready \u{1F389}`));
        }, style: {
          marginTop: 10,
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          background: plan.color,
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: F
        } }, t("\u{1F514} \uC624\uD508 \uC54C\uB9BC \uC2E0\uCCAD", "\u{1F514} Notify Me"))));
      }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9CA3AF", marginTop: 4, lineHeight: 1.8 } }, /* @__PURE__ */ React.createElement("div", null, t("* \uAD6C\uB3C5 \uD50C\uB79C\uC740 \uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20 \uC2EC\uC0AC \uC644\uB8CC \uD6C4 \uC815\uC2DD \uCD9C\uC2DC\uB429\uB2C8\uB2E4", "* Subscription plans will launch after payment provider review is complete")), /* @__PURE__ */ React.createElement("div", null, t("* \uBAA8\uB4E0 \uAE08\uC561\uC740 \uBD80\uAC00\uAC00\uCE58\uC138(VAT 10%) \uD3EC\uD568 \uAC00\uACA9\uC785\uB2C8\uB2E4", "* All prices include VAT (10%)")), /* @__PURE__ */ React.createElement("div", null, t("* \uB9CC 19\uC138 \uBBF8\uB9CC \uBBF8\uC131\uB144\uC790\uC758 \uAD6C\uB3C5 \uACB0\uC81C\uB294 \uBC95\uC815\uB300\uB9AC\uC778 \uB3D9\uC758\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4 (\uBBFC\uBC95 \uC81C5\uC870)", "* Minors under 19 require parental consent for subscription purchases"))))), activeTab === "credits" && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 24px 20px", borderTop: "1px solid #E5E7EB" } }, errMsg && /* @__PURE__ */ React.createElement("div", { style: {
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 10,
        fontSize: 12,
        color: "#DC2626"
      } }, errMsg), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handlePay,
          disabled: loading || !selPkg,
          style: {
            width: "100%",
            padding: "14px",
            borderRadius: 13,
            border: "none",
            cursor: loading || !selPkg ? "default" : "pointer",
            background: loading || !selPkg ? "#D1FAE5" : "linear-gradient(135deg,#2D6A4F,#40916C)",
            color: "white",
            fontSize: 15,
            fontWeight: 800,
            fontFamily: F,
            opacity: loading || !selPkg ? 0.7 : 1
          }
        },
        loading ? t("\uACB0\uC81C \uC900\uBE44 \uC911...", "Processing...") : selPkg ? t(`${selPkg.label} \xB7 \u2726 ${selPkg.credits} \uD06C\uB808\uB527 \uACB0\uC81C\uD558\uAE30`, `Pay \xB7 \u2726 ${selPkg.credits} Credits`) : t("\uD328\uD0A4\uC9C0\uB97C \uC120\uD0DD\uD558\uC138\uC694", "Select a package")
      )))
    );
  }
  function getTimeRemaining(createdAt) {
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1e3;
    const elapsed = now - createdTime;
    const remaining = TWENTY_FOUR_HOURS - elapsed;
    if (remaining <= 0) {
      return { expired: true, text: "\uB9CC\uB8CC\uB428", color: "text-red-600" };
    }
    const hours = Math.floor(remaining / (60 * 60 * 1e3));
    const minutes = Math.floor(remaining % (60 * 60 * 1e3) / (60 * 1e3));
    const seconds = Math.floor(remaining % (60 * 1e3) / 1e3);
    let color = "text-green-600";
    if (hours < 3) color = "text-red-600";
    else if (hours < 6) color = "text-orange-600";
    return {
      expired: false,
      text: `${hours}\uC2DC\uAC04 ${minutes}\uBD84 ${seconds}\uCD08`,
      color,
      hours
    };
  }
  function downloadSessionJson(sessionId2) {
    const r = storage.get("session_" + sessionId2);
    if (!r) {
      alert("\u274C \uAC80\uC0AC \uACB0\uACFC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const sessionData = JSON.parse(r.value);
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `\uAC80\uC0AC\uACB0\uACFC_${sessionData.testType}_${sessionId2}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("\u{1F4BE} JSON \uB2E4\uC6B4\uB85C\uB4DC:", sessionId2);
    alert("\u2705 \uAC80\uC0AC \uACB0\uACFC\uAC00 JSON \uD30C\uC77C\uB85C \uB2E4\uC6B4\uB85C\uB4DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
  }
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      var _a2, _b2;
      try {
        const sessionData = JSON.parse(e.target.result);
        console.log("\u{1F4C2} JSON \uD30C\uC77C \uB85C\uB4DC:", sessionData.sessionId);
        if (sessionData.testType === "SCT") {
          setSrciResponses(((_a2 = sessionData.responses) == null ? void 0 : _a2.byScale) ? {} : sessionData.responses || {});
          setSctSummaries(sessionData.summaries || {});
        } else if (sessionData.testType === "DSI") {
          setSdriResponses(((_b2 = sessionData.responses) == null ? void 0 : _b2.likert) || {});
          setDsiRec(sessionData.recommendation || "");
        }
        setSessionId(sessionData.sessionId);
        setUserInfo({ phone: sessionData.userPhone || "", password: "" });
        setView("sctResult");
        alert(`\u2705 ${sessionData.testType} \uAC80\uC0AC \uACB0\uACFC\uB97C \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4!
\uC138\uC158 ID: ${sessionData.sessionId}`);
      } catch (error) {
        console.error("\u274C JSON \uD30C\uC2F1 \uC624\uB958:", error);
        alert("\u274C \uD30C\uC77C \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
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
  function waitForJsPDF() {
    if (window.jspdf) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      const id = setInterval(() => {
        if (window.jspdf) {
          clearInterval(id);
          resolve();
        } else if (Date.now() - t0 > 8e3) {
          clearInterval(id);
          reject(new Error("jsPDF \uB85C\uB4DC \uC2DC\uAC04 \uCD08\uACFC"));
        }
      }, 100);
    });
  }
  async function generateSctPdf(sessionData) {
    try {
      console.log("\u{1F4C4} SRCI PDF \uC0DD\uC131 \uC2DC\uC791...");
      await waitForJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;
      doc.setFontSize(20);
      doc.setFont(void 0, "bold");
      doc.text("SRCI \uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC \uACB0\uACFC", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(void 0, "normal");
      doc.text("Sentence Completion Test", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 1. Basic Information ]", margin, yPos);
      yPos += 8;
      doc.setFont(void 0, "normal");
      doc.setFontSize(10);
      doc.text(`Session ID: ${sessionData.sessionId}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Test Date: ${new Date(sessionData.createdAt).toLocaleDateString("en-US")}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Phone: ${sessionData.userPhone || "N/A"}`, margin + 5, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 2. Responses by Category ]", margin, yPos);
      yPos += 8;
      const categoryMap = {
        "\uC5B4\uBA38\uB2C8\uC5D0 \uB300\uD55C \uD0DC\uB3C4": "Attitude toward Mother",
        "\uC544\uBC84\uC9C0\uC5D0 \uB300\uD55C \uD0DC\uB3C4": "Attitude toward Father",
        "\uAC00\uC871 \uAD00\uACC4": "Family Relationships",
        "\uC774\uC131 \uAD00\uACC4": "Romantic Relationships",
        "\uCE5C\uAD6C \uAD00\uACC4": "Friendships",
        "\uAD8C\uC704\uC790\uC5D0 \uB300\uD55C \uD0DC\uB3C4": "Attitude toward Authority",
        "\uB450\uB824\uC6C0": "Fears",
        "\uC8C4\uCC45\uAC10": "Guilt",
        "\uB2A5\uB825\uC5D0 \uB300\uD55C \uC778\uC2DD": "Perception of Abilities",
        "\uACFC\uAC70": "Past",
        "\uBBF8\uB798": "Future",
        "\uBAA9\uD45C": "Goals"
      };
      for (const cat of sctCategories) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        const englishCatName = categoryMap[cat.name] || cat.name;
        doc.setFontSize(10);
        doc.setFont(void 0, "bold");
        doc.text(`${cat.emoji} ${englishCatName}`, margin + 5, yPos);
        yPos += 7;
        const catQs = sdriCompletionQ.filter((q) => q.scale === cat);
        doc.setFont(void 0, "normal");
        doc.setFontSize(9);
        for (const q of catQs) {
          const answer = sessionData.responses[q.num] || "(No answer)";
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(`Q${q.num}:`, margin + 10, yPos);
          yPos += 5;
          const answerText = `Answer: ${answer}`;
          doc.setTextColor(0, 102, 204);
          doc.text(answerText, margin + 10, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 7;
        }
        yPos += 5;
      }
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }
      const fileName = `SCT_Report_${sessionData.sessionId}_${(/* @__PURE__ */ new Date()).getTime()}.pdf`;
      doc.save(fileName);
      console.log("\u2705 SRCI PDF \uC0DD\uC131 \uC644\uB8CC:", fileName);
      alert("\u2705 SCT PDF downloaded successfully!");
    } catch (error) {
      console.error("\u274C PDF \uC0DD\uC131 \uC2E4\uD328:", error);
      alert("\u274C PDF generation failed: " + error.message);
    }
  }
  async function generateDsiPdf(sessionData) {
    try {
      console.log("\u{1F4C4} SDRI PDF \uC0DD\uC131 \uC2DC\uC791...");
      await waitForJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;
      const tempDsiResponses = sessionData.responses;
      let total = 0;
      const areas = { "\uAC00\uC871\uBD88\uD654": 0, "\uBD80\uBAA8\uAD00\uACC4": 0, "\uD615\uC81C\uAD00\uACC4": 0, "\uAC00\uC871\uD1F4\uD589": 0, "\uD22C\uC0AC": 0 };
      sdriLikertQ.forEach((q) => {
        const r = tempDsiResponses[q.num];
        if (r) {
          const s = q.rev ? 6 - r : r;
          total += s;
          areas[q.area] += s;
        }
      });
      doc.setFontSize(20);
      doc.setFont(void 0, "bold");
      doc.text("SDRI \uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC \uACB0\uACFC", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(void 0, "normal");
      doc.text("Differentiation of Self Inventory", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 1. Basic Information ]", margin, yPos);
      yPos += 8;
      doc.setFont(void 0, "normal");
      doc.setFontSize(10);
      doc.text(`Session ID: ${sessionData.sessionId}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Test Date: ${new Date(sessionData.createdAt).toLocaleString("en-US")}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Phone: ${sessionData.userPhone || "N/A"}`, margin + 5, yPos);
      yPos += 12;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 2. Overall Score ]", margin, yPos);
      yPos += 8;
      const level = total >= 109 ? "High" : total >= 73 ? "Medium" : "Low";
      const levelColor = total >= 109 ? [76, 175, 80] : total >= 73 ? [255, 193, 7] : [255, 87, 87];
      doc.setFontSize(10);
      doc.setFont(void 0, "normal");
      doc.text(`Total Score: ${total} / 180`, margin + 5, yPos);
      yPos += 6;
      doc.setFont(void 0, "bold");
      doc.setTextColor(...levelColor);
      doc.text(`Level: ${level}`, margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 3. Area Scores ]", margin, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont(void 0, "normal");
      const areaNameMap = {
        "\uAC00\uC871\uBD88\uD654": "Family Conflict",
        "\uBD80\uBAA8\uAD00\uACC4": "Parent Relationship",
        "\uD615\uC81C\uAD00\uACC4": "Sibling Relationship",
        "\uAC00\uC871\uD1F4\uD589": "Family Regression",
        "\uD22C\uC0AC": "Projection"
      };
      const areaNames = Object.keys(areas);
      for (const areaName of areaNames) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        const score = areas[areaName];
        const areaQs = sdriLikertQ.filter((q) => q.scale === areaName);
        const maxScore = areaQs.length * 5;
        const avgScore = (score / areaQs.length).toFixed(1);
        const englishName = areaNameMap[areaName] || areaName;
        doc.text(`${englishName}: ${score}/${maxScore} (Avg: ${avgScore})`, margin + 5, yPos);
        const barWidth = 100;
        const barHeight = 4;
        const fillWidth = score / maxScore * barWidth;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(margin + 60, yPos - 3, barWidth, barHeight);
        doc.setFillColor(...levelColor);
        doc.rect(margin + 60, yPos - 3, fillWidth, barHeight, "F");
        yPos += 8;
      }
      yPos += 5;
      doc.addPage();
      yPos = margin;
      doc.setFontSize(11);
      doc.setFont(void 0, "bold");
      doc.text("[ 4. Detailed Responses ]", margin, yPos);
      yPos += 8;
      doc.setFontSize(8);
      doc.setFont(void 0, "normal");
      for (const q of sdriLikertQ) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }
        const answer = tempDsiResponses[q.num] || "N/A";
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
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }
      const fileName = `DSI_Report_${sessionData.sessionId}_${(/* @__PURE__ */ new Date()).getTime()}.pdf`;
      doc.save(fileName);
      console.log("\u2705 SDRI PDF \uC0DD\uC131 \uC644\uB8CC:", fileName);
      alert("\u2705 DSI PDF downloaded successfully!");
    } catch (error) {
      console.error("\u274C PDF \uC0DD\uC131 \uC2E4\uD328:", error);
      alert("\u274C PDF generation failed: " + error.message);
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
      setLoginMsg({ type: "error", text: "\uB9C1\uD06C ID\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    const data = loadLink(id);
    if (!data) {
      setLoginMsg({ type: "error", text: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9C1\uD06C ID\uC785\uB2C8\uB2E4. \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uB2E4\uC2DC \uD655\uC778\uD558\uC138\uC694." });
      return;
    }
    setActiveLinkId(id);
    setActiveLinkData(data);
    setLoginMsg({ type: "", text: "" });
    setView("clientLogin");
  }
  function clientLogin() {
    if (!userInfo.phone || !userInfo.password) {
      setLoginMsg({ type: "error", text: "\uC804\uD654\uBC88\uD638\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    if (!activeLinkData) {
      setLoginMsg({ type: "error", text: "\uB9C1\uD06C \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
      return;
    }
    const inp = userInfo.phone.replace(/-/g, "");
    const reg = activeLinkData.clientPhone.replace(/-/g, "");
    if (inp !== reg) {
      setLoginMsg({ type: "error", text: "\uB4F1\uB85D\uB41C \uC804\uD654\uBC88\uD638\uC640 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
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
    const tests = activeLinkData.testTypes && activeLinkData.testTypes.length > 0 ? activeLinkData.testTypes : [activeLinkData.testType || "SCT"];
    setPendingTests(tests);
    setCurrentTestIndex(0);
    const testViews = {
      "SCT": "sctTest",
      "DSI": "dsiTest",
      "PHQ9": "phq9Test",
      "GAD7": "gad7Test",
      "DASS21": "dass21Test",
      "BIG5": "big5Test",
      "BURNOUT": "burnoutTest",
      "LOST": "lostTest",
      "RIASEC": "riasecTest",
      "VALUES": "valuesTest"
    };
    setView(testViews[tests[0]] || "sctTest");
  }
  function buildTestSummary(testType) {
    var _a2, _b2, _c2;
    const en = lang === "en";
    try {
      if (testType === "SCT") {
        const { filled, byScale } = calcSrci();
        const sample = Object.entries(byScale).map(([s, items]) => `[${s}] ${items.slice(0, 1).map((a) => a.answer).join(" / ")}`).join("\n");
        return en ? `SRCI Self-Response Completion (${filled}/25 completed)
${sample}` : `SRCI \uC790\uAE30\uBC18\uC751 \uC644\uC131\uAC80\uC0AC (\uC644\uC131 ${filled}/25)
${sample}`;
      }
      if (testType === "DSI") {
        const { scales, total } = calcSdri();
        const scalesStr = Object.entries(scales).map(([k, v]) => `${k}: ${v}`).join(", ");
        return en ? `SDRI Self-Differentiation total: ${total}
${scalesStr}` : `SDRI \uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC \uCD1D\uC810: ${total}\uC810
${scalesStr}`;
      }
      if (testType === "PHQ9") {
        const r = calcPhq9();
        return en ? `PHQ-9 total: ${r.total}/27 (${r.level})` : `PHQ-9 \uCD1D\uC810: ${r.total}/27 (${r.level})`;
      }
      if (testType === "GAD7") {
        const r = calcGad7();
        return en ? `GAD-7 total: ${r.total}/21 (${r.level})` : `GAD-7 \uCD1D\uC810: ${r.total}/21 (${r.level})`;
      }
      if (testType === "DASS21") {
        const r = calcDass21();
        return en ? `DASS-21 \u2014 Depression:${r.depression.score}(${r.depression.level}), Anxiety:${r.anxiety.score}(${r.anxiety.level}), Stress:${r.stress.score}(${r.stress.level})` : `DASS-21 \u2014 \uC6B0\uC6B8:${r.depression.score}(${r.depression.level}), \uBD88\uC548:${r.anxiety.score}(${r.anxiety.level}), \uC2A4\uD2B8\uB808\uC2A4:${r.stress.score}(${r.stress.level})`;
      }
      if (testType === "BIG5") {
        const r = calcBig5();
        const factors = Object.entries(r).map(([k, v]) => `${k}:${v}`).join(", ");
        return en ? `Big Five personality: ${factors}` : `Big5 \uC131\uACA9\uAC80\uC0AC: ${factors}`;
      }
      if (testType === "BURNOUT") {
        const r = calcBurnout();
        return en ? `K-MBI+ Burnout: ${r.totalScore}/240 (${r.percentage}%)` : `K-MBI+ \uBC88\uC544\uC6C3: ${r.totalScore}/240 (${r.percentage}%, ${r.level})`;
      }
      if (testType === "LOST") {
        const r = calcLost();
        const axisLabel = en ? { E: "Energy", D: "Decision", S: "Speed", N: "Stability", R: "Relation", T: "Stress" } : { E: "\uC5D0\uB108\uC9C0", D: "\uC758\uC0AC\uACB0\uC815", S: "\uD589\uB3D9\uC18D\uB3C4", N: "\uC548\uC815\uC131", R: "\uAD00\uACC4\uBBFC\uAC10\uB3C4", T: "\uC2A4\uD2B8\uB808\uC2A4\uBC18\uC751" };
        const axisText = Object.entries(r.axisAvg).map(([k, v]) => `${axisLabel[k]}:${Number(v).toFixed(1)}`).join(", ");
        return en ? `LOST type: ${r.typeCode} (${((_a2 = r.typeInfo) == null ? void 0 : _a2.eng) || ((_b2 = r.typeInfo) == null ? void 0 : _b2.name)})
Axes: ${axisText}` : `LOST \uD589\uB3D9\uC720\uD615: ${r.typeCode} (${(_c2 = r.typeInfo) == null ? void 0 : _c2.name})
\uCD95\uBCC4: ${axisText}`;
      }
      if (testType === "RIASEC") {
        const { sorted, dominantType } = calcRiasec();
        const top2 = sorted.slice(0, 2).map(([k, s]) => `${k}:${s}`).join(", ");
        return en ? `Holland RIASEC dominant type: ${dominantType} (top2: ${top2})` : `Holland RIASEC \uC6B0\uC138 \uC720\uD615: ${dominantType}\uD615 (\uC0C1\uC7042: ${top2})`;
      }
      if (testType === "VALUES") {
        const { sorted } = calcValues();
        const top3 = sorted.slice(0, 3).map(([k, s]) => {
          var _a3;
          return `${((_a3 = VALUES_DOMAIN_INFO[k]) == null ? void 0 : _a3.label) || k}:${s}`;
        }).join(", ");
        return en ? `Work Values top 3: ${top3}` : `\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uC0C1\uC704 3: ${top3}`;
      }
      if (testType === "GENERAL" || !testType) {
        return en ? "General counseling (no test result)" : "\uC77C\uBC18 AI \uC0C1\uB2F4 (\uAC80\uC0AC \uACB0\uACFC \uC5C6\uC74C)";
      }
    } catch (e) {
      return en ? "Assessment result" : "\uAC80\uC0AC \uACB0\uACFC";
    }
    return en ? "Assessment result" : "\uAC80\uC0AC \uACB0\uACFC";
  }
  async function sendChatMessage(testType) {
    var _a2;
    const input = chatInput.trim();
    if (!input || chatStreaming) return;
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    const summary = buildTestSummary(testType);
    const userMsg = { role: "user", content: input, id: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatStreaming(true);
    setChatError("");
    const assistantId = Date.now() + 1;
    setChatMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId, streaming: true }]);
    try {
      const history = [...chatMessages.filter((m) => m.content && m.content.trim() && !m.streaming), userMsg].map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.trim() }));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({
          messages: history,
          testContext: { testType, counselingType: counselingType2, summary, lang }
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setChatStreaming(false);
          setShowCreditModal(true);
          return;
        }
        if (res.status === 429) {
          setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setChatStreaming(false);
          setAiChatUsed(AI_LIMIT_FREE);
          setShowAiLimitModal(true);
          return;
        }
        throw new Error(err.error || "\uC11C\uBC84 \uC624\uB958");
      }
      refreshCredits();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
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
            if (parsed.type === "content_block_delta" && ((_a2 = parsed.delta) == null ? void 0 : _a2.text)) {
              fullText += parsed.delta.text;
              setChatMessages((prev) => prev.map(
                (m) => m.id === assistantId ? { ...m, content: fullText } : m
              ));
            }
          } catch {
          }
        }
      }
      const moodMatch2 = fullText.match(/\[MOOD:(\d+)\]/);
      const moodScore2 = moodMatch2 ? parseInt(moodMatch2[1], 10) : null;
      const cleanText2 = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, "").trimEnd();
      incrementAiChatUsed();
      setChatMessages((prev) => prev.map(
        (m) => m.id === assistantId ? { ...m, content: cleanText2, streaming: false } : m
      ));
      if (moodScore2 !== null && isLoggedIn) {
        api._fetch("/api/chat/mood-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodScore: moodScore2, testType }) }).catch(() => {
        });
      }
    } catch (e) {
      setChatError(e.message || "AI \uCC44\uD305 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
      setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setChatStreaming(false);
    }
  }
  function resetChat() {
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setChatStreaming(false);
  }
  function renderMdText(text) {
    const parseBold = (str) => str.split(/(\*\*[^*]+\*\*)/).map(
      (p, j) => /^\*\*[^*]+\*\*$/.test(p) ? /* @__PURE__ */ React.createElement("strong", { key: j, className: "font-semibold text-gray-900" }, p.slice(2, -2)) : p
    );
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return /* @__PURE__ */ React.createElement("div", { key: i, className: "h-2" });
      if (/^[-•]\s/.test(line)) return /* @__PURE__ */ React.createElement("div", { key: i, className: "flex gap-1.5 items-start mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-500 font-bold shrink-0 leading-5" }, "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "leading-5" }, parseBold(line.replace(/^[-•]\s/, ""))));
      return /* @__PURE__ */ React.createElement("div", { key: i, className: "leading-5" }, parseBold(line));
    });
  }
  function ChatBox({ testType, initialPrompts }) {
    const messagesEndRef = React.useRef(null);
    const chatContainerRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const prevMsgCountRef = React.useRef(0);
    const [isListening, setIsListening] = React.useState(false);
    const [hasMemory, setHasMemory] = React.useState(false);
    const [speakingMsgId, setSpeakingMsgId] = React.useState(null);
    React.useEffect(() => {
      if (!isLoggedIn) return;
      fetch("/api/ai-chat/memory", { headers: api._authHeader() }).then((r) => r.json()).then((d) => {
        if (d.success && d.memories) {
          const key = testType || "GENERAL";
          setHasMemory(!!(d.memories[key] || d.memories["GENERAL"]));
        }
      }).catch(() => {
      });
    }, [testType]);
    async function clearMemory() {
      await fetch("/api/ai-chat/memory", { method: "DELETE", headers: api._authHeader() });
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
      const clean = text.replace(/[*#`_~>]/g, "").replace(/\n+/g, " ").trim();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = "ko-KR";
      utt.rate = 1;
      utt.pitch = 1;
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const koVoice = voices.find((v) => v.lang.startsWith("ko"));
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
      recognition.lang = "ko-KR";
      recognition.continuous = false;
      recognition.interimResults = false;
      setIsListening(true);
      recognition.start();
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (inputRef.current) {
          inputRef.current.value = inputRef.current.value ? inputRef.current.value + " " + text : text;
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
    React.useEffect(() => {
      const container = chatContainerRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const isNewMessage = chatMessages.length !== prevMsgCountRef.current;
      prevMsgCountRef.current = chatMessages.length;
      if (isNewMessage) {
        container.scrollTop = container.scrollHeight;
        setTimeout(() => {
          var _a2;
          (_a2 = messagesEndRef.current) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      } else if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }, [chatMessages]);
    return /* @__PURE__ */ React.createElement("div", { className: "mt-6 rounded-xl overflow-hidden border border-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm text-gray-800" }, t("AI \uC0C1\uB2F4 \uB300\uD654", "AI Counseling")), hasMemory && /* @__PURE__ */ React.createElement("span", { className: "bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1" }, t("\u{1F4DD} \uC774\uC804 \uB300\uD654 \uAE30\uC5B5 \uC911", "\u{1F4DD} Memory active"), /* @__PURE__ */ React.createElement("button", { onClick: clearMemory, className: "ml-1 text-indigo-300 hover:text-indigo-500", title: t("\uAE30\uC5B5 \uCD08\uAE30\uD654", "Clear memory") }, "\u2715")), chatMessages.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold" }, t(`${chatMessages.filter((m) => m.role === "user").length}\uD68C \uB300\uD654`, `${chatMessages.filter((m) => m.role === "user").length} chats`))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, isLoggedIn && credits > 0 ? t(`\uC624\uB298 ${aiChatUsed}\uD68C \uC0AC\uC6A9 (\uBB34\uC81C\uD55C)`, `Today: ${aiChatUsed} used (unlimited)`) : t(`\uC624\uB298 ${aiChatUsed}/${AI_LIMIT_FREE}\uD68C \uC0AC\uC6A9`, `Today: ${aiChatUsed}/${AI_LIMIT_FREE} used`))), /* @__PURE__ */ React.createElement("div", { className: "bg-white" }, /* @__PURE__ */ React.createElement("p", { className: "px-4 pt-2 pb-1 text-xs text-gray-400" }, t("\u26A0\uFE0F AI \uC0C1\uB2F4\uC740 \uCC38\uACE0\uC6A9\uC774\uBA70 \uC758\uD559\uC801 \uC9C4\uB2E8\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4", "\u26A0\uFE0F AI counseling is for reference only and does not replace medical diagnosis.")), chatMessages.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-gray-100" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-2 font-semibold" }, "\u{1F4A1} ", t("\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38", "Common questions")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, (initialPrompts || []).map((prompt, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i,
        onClick: () => {
          const userMsg = { role: "user", content: prompt, id: Date.now() };
          setChatMessages((prev) => [...prev, userMsg]);
          setChatStreaming(true);
          setChatError("");
          const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
          const summary = buildTestSummary(testType);
          const assistantId = Date.now() + 1;
          setChatMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId, streaming: true }]);
          fetch("/api/ai-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...api._authHeader() },
            body: JSON.stringify({
              messages: [...chatMessages.filter((m) => m.content && m.content.trim() && !m.streaming), userMsg].map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.trim() })),
              testContext: { testType, counselingType: counselingType2, summary, lang }
            })
          }).then(async (res) => {
            if (!res.ok) {
              const errD = await res.json().catch(() => ({}));
              setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
              setChatStreaming(false);
              if (res.status === 429) {
                if (!isLoggedIn) {
                  setGuestAiTotal(AI_GUEST_TOTAL);
                  try {
                    localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL));
                  } catch {
                  }
                } else {
                  setAiChatUsed(AI_LIMIT_FREE);
                }
                setShowAiLimitModal(true);
                return;
              }
              setChatError(errD.error || "\uC11C\uBC84 \uC624\uB958");
              return;
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let fullText = "";
            function processStream() {
              reader.read().then(({ done, value }) => {
                var _a2;
                if (done) {
                  const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                  const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                  const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, "").trimEnd();
                  setChatMessages((prev) => prev.map(
                    (m) => m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                  ));
                  setChatStreaming(false);
                  if (moodScore !== null && isLoggedIn) {
                    api._fetch("/api/chat/mood-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodScore, testType: "chat" }) }).catch(() => {
                    });
                  }
                  return;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") break;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "content_block_delta" && ((_a2 = parsed.delta) == null ? void 0 : _a2.text)) {
                      fullText += parsed.delta.text;
                      setChatMessages((prev) => prev.map(
                        (m) => m.id === assistantId ? { ...m, content: fullText } : m
                      ));
                    }
                  } catch {
                  }
                }
                processStream();
              });
            }
            processStream();
          }).catch((e) => {
            setChatError(e.message || t("AI \uCC44\uD305 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "An error occurred during AI chat."));
            setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setChatStreaming(false);
          });
        },
        className: "text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
      },
      prompt
    )))), /* @__PURE__ */ React.createElement("div", { ref: chatContainerRef, className: "h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50" }, chatMessages.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-4xl mb-3" }, "\u{1F91D}"), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-600" }, t("\uAC80\uC0AC \uACB0\uACFC\uC5D0 \uB300\uD574 AI\uC640 \uB300\uD654\uD574 \uBCF4\uC138\uC694", "Chat with AI about your test results")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, t("\uC0C1\uB2F4 \uC804\uB7B5, \uD574\uC11D \uBC29\uBC95, \uD65C\uC6A9 \uBC29\uC548 \uB4F1\uC744 \uC9C8\uBB38\uD558\uC138\uC694", "Ask about counseling strategies, interpretation, and how to apply results")), !isLoggedIn && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-blue-500 mt-2 font-semibold" }, t(`\u{1F4AC} \uBB34\uB8CC \uCCB4\uD5D8 ${AI_LIMIT_FREE}\uD68C \xB7 \uAC00\uC785\uD558\uBA74 \uB354 \uB9CE\uC774 \uC774\uC6A9 \uAC00\uB2A5`, `\u{1F4AC} ${AI_LIMIT_FREE} free sessions \xB7 Sign up for more`))), chatMessages.map((msg) => /* @__PURE__ */ React.createElement("div", { key: msg.id, className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}` }, msg.role === "assistant" && /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0" }, "AI"), /* @__PURE__ */ React.createElement("div", { className: `max-w-[75%] min-w-0 px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"}` }, msg.content ? /* @__PURE__ */ React.createElement("div", { className: "text-sm space-y-0.5" }, renderMdText(msg.content), msg.streaming && /* @__PURE__ */ React.createElement("span", { className: "inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle rounded" }), !msg.streaming && msg.role === "assistant" && window.speechSynthesis && /* @__PURE__ */ React.createElement("div", { className: "flex justify-end mt-2 pt-1.5 border-t border-gray-100" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => speakText(msg.content, msg.id),
        className: `text-xs flex items-center gap-1 transition ${speakingMsgId === msg.id ? "text-blue-500 font-semibold" : "text-gray-300 hover:text-gray-500"}`,
        title: speakingMsgId === msg.id ? t("\uC74C\uC131 \uC815\uC9C0", "Stop audio") : t("\uC74C\uC131\uC73C\uB85C \uB4E3\uAE30", "Listen")
      },
      speakingMsgId === msg.id ? t("\u23F8 \uC815\uC9C0", "\u23F8 Stop") : t("\u{1F50A} \uB4E3\uAE30", "\u{1F50A} Listen")
    ))) : /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 items-center py-1" }, /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "0ms" } }), /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "150ms" } }), /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "300ms" } }))), msg.role === "user" && /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 mt-0.5 shrink-0" }, "\uB098"))), chatError && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700" }, "\u26A0\uFE0F ", chatError, /* @__PURE__ */ React.createElement("button", { onClick: () => setChatError(""), className: "ml-2 underline" }, t("\uB2EB\uAE30", "Close"))), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef })), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-t border-gray-200 bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 items-end" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        ref: inputRef,
        defaultValue: chatInput,
        onKeyDown: (e) => {
          var _a2;
          console.log("\u2328\uFE0F ChatBox keydown:", e.key, "composing:", e.nativeEvent.isComposing);
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            const currentValue = ((_a2 = inputRef.current) == null ? void 0 : _a2.value) || "";
            console.log("\u{1F4E4} Sending message:", currentValue);
            if (currentValue.trim()) {
              const userMsg = { role: "user", content: currentValue.trim(), id: Date.now() };
              setChatMessages((prev) => [...prev, userMsg]);
              inputRef.current.value = "";
              setChatStreaming(true);
              setChatError("");
              const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
              const summary = buildTestSummary(testType);
              const assistantId = Date.now() + 1;
              setChatMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId, streaming: true }]);
              fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...api._authHeader() },
                body: JSON.stringify({
                  messages: [...chatMessages.filter((m) => m.content && m.content.trim() && !m.streaming), userMsg].map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.trim() })),
                  testContext: { testType, counselingType: counselingType2, summary, lang }
                })
              }).then(async (res) => {
                if (!res.ok) {
                  const errD = await res.json().catch(() => ({}));
                  setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
                  setChatStreaming(false);
                  if (res.status === 429) {
                    if (!isLoggedIn) {
                      setGuestAiTotal(AI_GUEST_TOTAL);
                      try {
                        localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL));
                      } catch {
                      }
                    } else {
                      setAiChatUsed(AI_LIMIT_FREE);
                    }
                    setShowAiLimitModal(true);
                    return;
                  }
                  setChatError(errD.error || "\uC11C\uBC84 \uC624\uB958");
                  return;
                }
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let fullText = "";
                function processStream() {
                  reader.read().then(({ done, value }) => {
                    var _a3;
                    if (done) {
                      const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                      const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                      const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, "").trimEnd();
                      setChatMessages((prev) => prev.map(
                        (m) => m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                      ));
                      setChatStreaming(false);
                      if (moodScore !== null && isLoggedIn) {
                        api._fetch("/api/chat/mood-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodScore, testType: "chat" }) }).catch(() => {
                        });
                      }
                      return;
                    }
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();
                    for (const line of lines) {
                      if (!line.startsWith("data: ")) continue;
                      const data = line.slice(6).trim();
                      if (data === "[DONE]") break;
                      try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === "content_block_delta" && ((_a3 = parsed.delta) == null ? void 0 : _a3.text)) {
                          fullText += parsed.delta.text;
                          setChatMessages((prev) => prev.map(
                            (m) => m.id === assistantId ? { ...m, content: fullText } : m
                          ));
                        }
                      } catch {
                      }
                    }
                    processStream();
                  });
                }
                processStream();
              }).catch((e2) => {
                setChatError(e2.message || "AI \uCC44\uD305 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
                setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
                setChatStreaming(false);
              });
            }
          }
        },
        placeholder: t("\uAC80\uC0AC \uACB0\uACFC \uD65C\uC6A9 \uBC29\uBC95, \uC0C1\uB2F4 \uC804\uB7B5 \uB4F1\uC744 \uC9C8\uBB38\uD558\uC138\uC694... (Enter \uC804\uC1A1, Shift+Enter \uC904\uBC14\uAFC8)", "Ask about your results, counseling strategies... (Enter to send, Shift+Enter for newline)"),
        rows: 2,
        disabled: chatStreaming,
        className: "flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
      }
    ), (window.SpeechRecognition || window.webkitSpeechRecognition) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: startVoiceInput,
        disabled: isListening || chatStreaming,
        title: isListening ? t("\uB4E3\uB294 \uC911...", "Listening...") : t("\uC74C\uC131 \uC785\uB825", "Voice input"),
        className: `shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40"}`
      },
      "\u{1F3A4}"
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          var _a2;
          if (isAiChatExhausted()) {
            setShowAiLimitModal(true);
            return;
          }
          const currentValue = ((_a2 = inputRef.current) == null ? void 0 : _a2.value) || "";
          if (currentValue.trim() && !chatStreaming) {
            const userMsg = { role: "user", content: currentValue.trim(), id: Date.now() };
            setChatMessages((prev) => [...prev, userMsg]);
            inputRef.current.value = "";
            setChatStreaming(true);
            setChatError("");
            const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
            const summary = buildTestSummary(testType);
            const assistantId = Date.now() + 1;
            setChatMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId, streaming: true }]);
            fetch("/api/ai-chat", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...api._authHeader() },
              body: JSON.stringify({
                messages: [...chatMessages.filter((m) => m.content && m.content.trim() && !m.streaming), userMsg].map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.trim() })),
                testContext: { testType, counselingType: counselingType2, summary, lang }
              })
            }).then(async (res) => {
              if (!res.ok) {
                const errD = await res.json().catch(() => ({}));
                setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
                setChatStreaming(false);
                if (res.status === 429) {
                  if (!isLoggedIn) {
                    setGuestAiTotal(AI_GUEST_TOTAL);
                    try {
                      localStorage.setItem(AI_GUEST_KEY, String(AI_GUEST_TOTAL));
                    } catch {
                    }
                  } else {
                    setAiChatUsed(AI_LIMIT_FREE);
                  }
                  setShowAiLimitModal(true);
                  return;
                }
                setChatError(errD.error || "\uC11C\uBC84 \uC624\uB958");
                return;
              }
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              let fullText = "";
              function processStream() {
                reader.read().then(({ done, value }) => {
                  var _a3;
                  if (done) {
                    const moodMatch = fullText.match(/\[MOOD:(\d+)\]/);
                    const moodScore = moodMatch ? parseInt(moodMatch[1], 10) : null;
                    const cleanText = fullText.replace(/\s*\[MOOD:\d+\]\s*$/, "").trimEnd();
                    setChatMessages((prev) => prev.map(
                      (m) => m.id === assistantId ? { ...m, content: cleanText, streaming: false } : m
                    ));
                    setChatStreaming(false);
                    if (moodScore !== null && isLoggedIn) {
                      api._fetch("/api/chat/mood-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodScore, testType: "chat" }) }).catch(() => {
                      });
                    }
                    return;
                  }
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop();
                  for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (data === "[DONE]") break;
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.type === "content_block_delta" && ((_a3 = parsed.delta) == null ? void 0 : _a3.text)) {
                        fullText += parsed.delta.text;
                        setChatMessages((prev) => prev.map(
                          (m) => m.id === assistantId ? { ...m, content: fullText } : m
                        ));
                      }
                    } catch {
                    }
                  }
                  processStream();
                });
              }
              processStream();
            }).catch((e) => {
              setChatError(e.message || "AI \uCC44\uD305 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
              setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
              setChatStreaming(false);
            });
          }
        },
        disabled: chatStreaming,
        className: `${isAiChatExhausted() ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"} text-white px-4 py-2 rounded-xl text-sm font-bold transition`
      },
      chatStreaming ? "\u2022\u2022\u2022" : isAiChatExhausted() ? t("\uAC00\uC785\uD558\uAE30", "Sign up") : t("\uC804\uC1A1", "Send")
    ), chatMessages.length > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: resetChat,
        className: "text-xs text-gray-400 hover:text-gray-600 text-center"
      },
      t("\uCD08\uAE30\uD654", "Clear")
    )))), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 border-t border-gray-100 bg-gray-50" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setView("counseling");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        className: "w-full py-2.5 bg-white border border-teal-200 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50 hover:border-teal-400 transition flex items-center justify-center gap-2 group"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3E5}"),
      /* @__PURE__ */ React.createElement("span", null, t("\uC804\uBB38 \uC0C1\uB2F4 \uAE30\uAD00 \uCC3E\uAE30", "Find a Counseling Center")),
      /* @__PURE__ */ React.createElement("span", { className: "text-teal-300 group-hover:text-teal-500 transition" }, "\u2192")
    ), /* @__PURE__ */ React.createElement("p", { className: "text-center text-xs text-gray-400 mt-1" }, t("AI \uC0C1\uB2F4\uC740 \uCC38\uACE0\uC6A9\uC785\uB2C8\uB2E4. \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC758 \uB3C4\uC6C0\uC774 \uD544\uC694\uD558\uC2DC\uBA74 \uD074\uB9AD\uD558\uC138\uC694.", "AI counseling is for reference only. Click if you need professional support.")))));
  }
  async function loadBiblicalRefs() {
    try {
      const res = await fetch("/api/admin/biblical-references");
      const data = await res.json();
      if (data.success) setBiblicalRefs(data.data || []);
    } catch (e) {
      console.error("\uCC38\uACE0\uC790\uB8CC \uB85C\uB4DC \uC2E4\uD328:", e);
    }
  }
  async function saveBiblicalRef() {
    if (!biblicalForm.title.trim() || !biblicalForm.content.trim()) {
      setBiblicalMsg({ type: "error", text: "\uC81C\uBAA9\uACFC \uB0B4\uC6A9\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    setBiblicalLoading(true);
    setBiblicalMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/biblical-references", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify(biblicalForm)
      });
      const data = await res.json();
      if (data.success) {
        setBiblicalMsg({ type: "success", text: "\u2705 " + data.message });
        setBiblicalForm({ id: null, title: "", category: "general", content: "", sort_order: 0 });
        setShowBiblicalForm(false);
        await loadBiblicalRefs();
      } else {
        setBiblicalMsg({ type: "error", text: "\u274C " + (data.error || "\uC800\uC7A5 \uC2E4\uD328") });
      }
    } catch (e) {
      setBiblicalMsg({ type: "error", text: "\u274C \uC11C\uBC84 \uC624\uB958: " + e.message });
    } finally {
      setBiblicalLoading(false);
    }
  }
  async function deleteBiblicalRef(id, title) {
    if (!confirm(`"${title}" \uC790\uB8CC\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    try {
      const res = await fetch(`/api/admin/biblical-references/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBiblicalMsg({ type: "success", text: "\u2705 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
        await loadBiblicalRefs();
      }
    } catch (e) {
      setBiblicalMsg({ type: "error", text: "\u274C \uC0AD\uC81C \uC2E4\uD328" });
    }
  }
  async function toggleBiblicalRef(id) {
    try {
      await fetch(`/api/admin/biblical-references/${id}/toggle`, { method: "PATCH" });
      await loadBiblicalRefs();
    } catch (e) {
      console.error("\uD1A0\uAE00 \uC2E4\uD328:", e);
    }
  }
  function editBiblicalRef(ref) {
    setBiblicalForm({ id: ref.id, title: ref.title, category: ref.category, content: ref.content, sort_order: ref.sort_order || 0 });
    setShowBiblicalForm(true);
    setBiblicalMsg({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleBiblicalFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5e5) {
      setBiblicalMsg({ type: "error", text: "\u274C \uD30C\uC77C \uD06C\uAE30\uB294 500KB \uC774\uB0B4\uC5EC\uC57C \uD569\uB2C8\uB2E4." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setBiblicalForm((f) => ({
        ...f,
        title: f.title || file.name.replace(/\.[^.]+$/, ""),
        content: text
      }));
      setBiblicalMsg({ type: "success", text: `\u2705 "${file.name}" \uD30C\uC77C \uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC. \uB0B4\uC6A9 \uD655\uC778 \uD6C4 \uC800\uC7A5\uD558\uC138\uC694.` });
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }
  async function approveCounselor(phone) {
    console.log("\u{1F504} \uC0C1\uB2F4\uC0AC \uC2B9\uC778 \uC2DC\uC791:", phone);
    try {
      const result = await api.approveCounselor(phone);
      if (result.success) {
        console.log("\u2705 \uC2B9\uC778 \uC644\uB8CC:", phone);
        const pendingResult = await api.getPendingCounselors();
        if (pendingResult.success) {
          setPendingCounselors(pendingResult.data);
        }
        const approvedResult = await api.getApprovedCounselors();
        if (approvedResult.success) {
          setApprovedCounselors(approvedResult.data);
          console.log("\u2705 \uC2B9\uC778\uB41C \uC0C1\uB2F4\uC0AC \uBAA9\uB85D \uC5C5\uB370\uC774\uD2B8:", approvedResult.data.length + "\uBA85");
        }
        alert(`\u2705 ${phone} \uC0C1\uB2F4\uC0AC\uAC00 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4! (\uBB34\uB8CC 5\uD68C \uCCB4\uD5D8 \uC81C\uACF5)`);
      } else {
        alert("\u274C \uC2B9\uC778 \uC2E4\uD328: " + result.error);
      }
    } catch (error) {
      console.error("\u274C \uC0C1\uB2F4\uC0AC \uC2B9\uC778 \uC911 \uC624\uB958:", error);
      alert("\u274C \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  function startEditQuota(phone, currentQuota) {
    setQuotaEditingPhone(phone);
    setQuotaEditingValue(currentQuota.toString());
  }
  function cancelEditQuota() {
    setQuotaEditingPhone(null);
    setQuotaEditingValue("");
  }
  async function saveQuotaEdit(phone, name) {
    const newQuota = parseInt(quotaEditingValue, 10);
    if (isNaN(newQuota) || newQuota < 0) {
      alert("\u274C \uCFFC\uD130\uB294 0 \uC774\uC0C1\uC758 \uC22B\uC790\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
      return;
    }
    console.log("\u{1F504} \uCFFC\uD130 \uBCC0\uACBD \uC2DC\uC791:", phone, "\u2192", newQuota);
    try {
      const result = await api.updateCounselorQuota(phone, newQuota);
      if (result.success) {
        console.log("\u2705 \uCFFC\uD130 \uBCC0\uACBD \uC644\uB8CC:", result.data);
        const approvedResult = await api.getApprovedCounselors();
        if (approvedResult.success) {
          setApprovedCounselors(approvedResult.data);
        }
        setQuotaEditingPhone(null);
        setQuotaEditingValue("");
        alert(`\u2705 ${name}(${phone}) \uC0C1\uB2F4\uC0AC\uC758 \uCFFC\uD130\uAC00 ${newQuota}\uD68C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uB0A8\uC740 \uCFFC\uD130: ${result.data.quotaRemaining}\uD68C`);
      } else {
        alert("\u274C \uCFFC\uD130 \uBCC0\uACBD \uC2E4\uD328: " + result.error);
      }
    } catch (error) {
      console.error("\u274C \uCFFC\uD130 \uBCC0\uACBD \uC911 \uC624\uB958:", error);
      alert("\u274C \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  async function approveCounselor_OLD(phone) {
    console.log("\u{1F504} \uC0C1\uB2F4\uC0AC \uC2B9\uC778 \uC2DC\uC791:", phone);
    try {
      const result = await api.approveCounselor(phone);
      if (result.success) {
        console.log("\u2705 \uC2B9\uC778 \uC644\uB8CC:", phone);
        const pendingResult = await api.getPendingCounselors();
        if (pendingResult.success) {
          setPendingCounselors(pendingResult.data);
        }
        const approvedResult = await api.getApprovedCounselors();
        if (approvedResult.success) {
          setApprovedCounselors(approvedResult.data);
          console.log("\u2705 \uC2B9\uC778\uB41C \uC0C1\uB2F4\uC0AC \uBAA9\uB85D \uC5C5\uB370\uC774\uD2B8:", approvedResult.data.length + "\uBA85");
        }
        alert(`\u2705 ${phone} \uC0C1\uB2F4\uC0AC\uAC00 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4! (\uBB34\uB8CC 5\uD68C \uCCB4\uD5D8 \uC81C\uACF5)`);
      } else {
        alert("\u274C \uC2B9\uC778 \uC2E4\uD328: " + result.error);
      }
    } catch (error) {
      console.error("\u274C \uC2B9\uC778 \uC624\uB958:", error);
      alert("\u274C \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  async function rejectCounselor(phone) {
    console.log("\u{1F504} \uC0C1\uB2F4\uC0AC \uAC70\uBD80:", phone);
    const r = storage.get("counselor_requests");
    let list = r ? JSON.parse(r.value) : [];
    list = list.filter((c) => c.phone !== phone);
    storage.set("counselor_requests", JSON.stringify(list));
    console.log("\u{1F4DD} \uB300\uAE30 \uBAA9\uB85D \uC5C5\uB370\uC774\uD2B8:", list.length + "\uAC74 \uB0A8\uC74C");
    setPendingCounselors(list.filter((c) => c.status === "pending"));
    alert(`\u274C ${phone} \uC0C1\uB2F4\uC0AC\uB97C \uAC70\uBD80\uD588\uC2B5\uB2C8\uB2E4.`);
  }
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
      setSrciResponses({});
      setSdriResponses({});
      setDsiRec("");
      setPhq9Responses({});
      setGad7Responses({});
      setRiasecResponses({});
      setValuesResponses({});
      setDass21Responses({});
      setBig5Responses({});
      setBurnoutResponses({});
      setLostResponses({});
      setSaveStatus("");
      const testViews = { "SCT": "sctTest", "DSI": "dsiTest", "PHQ9": "phq9Test", "GAD7": "gad7Test", "DASS21": "dass21Test", "BIG5": "big5Test", "BURNOUT": "burnoutTest", "LOST": "lostTest", "RIASEC": "riasecTest", "VALUES": "valuesTest" };
      console.log("nextTest: " + nextType + " (" + (nextIndex + 1) + "/" + pendingTests.length + ")");
      setView(testViews[nextType] || "sctTest");
    } else {
      if (activeLinkId) {
        const ld = loadLink(activeLinkId);
        if (ld) {
          ld.status = "completed";
          ld.completedSessionIds = completedIds;
          storeLink(ld);
        }
      }
      const singleResultViews = { RIASEC: "riasecResult", VALUES: "valuesResult" };
      setView(singleResultViews[currentTestType] || "complete");
    }
  }
  function submitSrci() {
    const { filled, total, byScale } = calcSrci();
    if (filled < total) {
      setSaveStatus("\u26A0\uFE0F " + (total - filled) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const data = {
      sessionId,
      testType: "SCT",
      responses: { byScale, filled },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} SRCI \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("SCT", data);
  }
  function submitSdri() {
    const likertFilled = Object.keys(sdriResponses).length;
    if (likertFilled < sdriLikertQ.length) {
      setSaveStatus("\u26A0\uFE0F " + (sdriLikertQ.length - likertFilled) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (partnerMode) {
      const { scales: scales2, total: total2 } = calcSdri();
      const result = { scales: scales2, total: total2 };
      const newCompleted = { ...partnerMode.completedResults, dsi: result };
      const remaining = partnerMode.pendingTests.filter((t2) => t2 !== "DSI");
      setPartnerMode((prev) => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) {
        submitPartnerResults(newCompleted);
      } else {
        setView("partnerTest:" + remaining[0]);
      }
      return;
    }
    const { scales, total } = calcSdri();
    saveCoupleResult("DSI", { scales, total });
    if (isLoggedIn) api.saveTestScore("DSI", total, total >= 90 ? "\uAC74\uAC15\uD55C \uBD84\uD654" : total >= 60 ? "\uC911\uAC04 \uBD84\uD654" : "\uB0AE\uC740 \uBD84\uD654").catch(() => {
    });
    const data = {
      sessionId,
      testType: "DSI",
      responses: { scales, total, answers: sdriResponses },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} SDRI \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("DSI", data);
  }
  function submitPhq9() {
    if (Object.keys(phq9Responses).length < 9) {
      setSaveStatus("\u26A0\uFE0F " + (9 - Object.keys(phq9Responses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { total, level } = calcPhq9();
    if (isLoggedIn) api.saveTestScore("PHQ9", total, level).catch(() => {
    });
    const data = {
      sessionId,
      testType: "PHQ9",
      responses: phq9Responses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} PHQ-9 \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("PHQ9", data);
  }
  function submitGad7() {
    if (Object.keys(gad7Responses).length < 7) {
      setSaveStatus("\u26A0\uFE0F " + (7 - Object.keys(gad7Responses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { total, level } = calcGad7();
    if (isLoggedIn) api.saveTestScore("GAD7", total, level).catch(() => {
    });
    const data = {
      sessionId,
      testType: "GAD7",
      responses: gad7Responses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} GAD-7 \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("GAD7", data);
  }
  const RIASEC_Q = [
    { id: 1, type: "R", text: t("\uC190\uC73C\uB85C \uC9C1\uC811 \uBB3C\uAC74\uC744 \uB9CC\uB4E4\uAC70\uB098 \uC218\uB9AC\uD558\uB294 \uAC83\uC744 \uC88B\uC544\uD55C\uB2E4", "I enjoy making or repairing things with my hands") },
    { id: 2, type: "R", text: t("\uAE30\uACC4\uB098 \uB3C4\uAD6C\uB97C \uB2E4\uB8E8\uB294 \uC791\uC5C5\uC774 \uC990\uAC81\uB2E4", "I find working with machines and tools enjoyable") },
    { id: 3, type: "R", text: t("\uC815\uC6D0 \uAC00\uAFB8\uAE30, \uBAA9\uACF5\uC608 \uB4F1 \uC2E4\uC6A9\uC801\uC778 \uD65C\uB3D9\uC5D0 \uD765\uBBF8\uAC00 \uC788\uB2E4", "I am interested in hands-on activities like gardening or woodworking") },
    { id: 4, type: "R", text: t("\uC57C\uC678 \uD65C\uB3D9\uC774\uB098 \uC2E0\uCCB4\uC801 \uC791\uC5C5\uC744 \uC990\uAE34\uB2E4", "I enjoy outdoor activities or physical work") },
    { id: 5, type: "R", text: t("\uC124\uACC4\uB3C4, \uB3C4\uBA74, \uC9C0\uB3C4\uB97C \uC77D\uACE0 \uC774\uD574\uD558\uB294 \uAC83\uC774 \uC5B4\uB835\uC9C0 \uC54A\uB2E4", "I can easily read and understand blueprints, drawings, or maps") },
    { id: 6, type: "I", text: t("\uBCF5\uC7A1\uD55C \uBB38\uC81C\uB97C \uBD84\uC11D\uD558\uACE0 \uD574\uACB0\uCC45\uC744 \uCC3E\uB294 \uAC83\uC774 \uD765\uBBF8\uB86D\uB2E4", "I find it interesting to analyze complex problems and find solutions") },
    { id: 7, type: "I", text: t("\uC0C8\uB85C\uC6B4 \uC9C0\uC2DD\uC774\uB098 \uC774\uB860\uC744 \uD0D0\uAD6C\uD558\uB294 \uAC83\uC744 \uC990\uAE34\uB2E4", "I enjoy exploring new knowledge and theories") },
    { id: 8, type: "I", text: t("\uB370\uC774\uD130\uB098 \uC218\uCE58\uB97C \uBD84\uC11D\uD558\uB294 \uC791\uC5C5\uC774 \uC7AC\uBBF8\uC788\uB2E4", "I find analyzing data or numbers enjoyable") },
    { id: 9, type: "I", text: t("\uAD81\uAE08\uD55C \uAC83\uC774 \uC788\uC73C\uBA74 \uB05D\uAE4C\uC9C0 \uD30C\uD5E4\uCE58\uB294 \uD3B8\uC774\uB2E4", "When curious about something, I dig deep until I find the answer") },
    { id: 10, type: "I", text: t("\uB17C\uB9AC\uC801\uC774\uACE0 \uCCB4\uACC4\uC801\uC73C\uB85C \uC0DD\uAC01\uD558\uB294 \uAC83\uC744 \uC88B\uC544\uD55C\uB2E4", "I enjoy thinking logically and systematically") },
    { id: 11, type: "A", text: t("\uAE00\uC4F0\uAE30, \uAC15\uC5F0, \uCC3D\uC791 \uB4F1 \uC790\uC2E0\uC744 \uD45C\uD604\uD558\uB294 \uD65C\uB3D9\uC744 \uC990\uAE34\uB2E4", "I enjoy expressive activities like writing, speaking, or creating") },
    { id: 12, type: "A", text: t("\uB098\uB9CC\uC758 \uB3C5\uCC3D\uC801\uC778 \uBC29\uC2DD\uC73C\uB85C \uC544\uC774\uB514\uC5B4\uB97C \uD45C\uD604\uD558\uACE0 \uC2F6\uB2E4", "I want to express ideas in my own unique way") },
    { id: 13, type: "A", text: t("\uD2C0\uC5D0 \uBC15\uD78C \uBC29\uC2DD\uBCF4\uB2E4 \uC790\uC720\uB86D\uAC8C \uC77C\uD558\uB294 \uAC83\uC774 \uC88B\uB2E4", "I prefer working freely rather than following set methods") },
    { id: 14, type: "A", text: t("\uC0C8\uB85C\uC6B4 \uC544\uC774\uB514\uC5B4\uB97C \uC0DD\uAC01\uD574\uB0B4\uB294 \uAC83\uC774 \uC990\uAC81\uB2E4", "I enjoy generating new ideas") },
    { id: 15, type: "A", text: t("\uC608\uC220, \uBB38\uD654, \uCF58\uD150\uCE20 \uBD84\uC57C\uC5D0 \uAD00\uC2EC\uC774 \uB9CE\uB2E4", "I have a strong interest in art, culture, or content creation") },
    { id: 16, type: "S", text: t("\uC5B4\uB824\uC6C0\uC5D0 \uCC98\uD55C \uC0AC\uB78C\uC744 \uB3D5\uB294 \uAC83\uC774 \uBCF4\uB78C \uC788\uB2E4", "I find it rewarding to help people who are in need") },
    { id: 17, type: "S", text: t("\uBB34\uC5B8\uAC00\uB97C \uAC00\uB974\uCE58\uAC70\uB098 \uCF54\uCE6D\uD558\uB294 \uC5ED\uD560\uC774 \uC990\uAC81\uB2E4", "I enjoy teaching or coaching others") },
    { id: 18, type: "S", text: t("\uC0AC\uB78C\uB4E4\uC758 \uC774\uC57C\uAE30\uB97C \uB4E3\uACE0 \uC870\uC5B8\uD574 \uC8FC\uB294 \uAC83\uC744 \uC88B\uC544\uD55C\uB2E4", "I like listening to people and giving them advice") },
    { id: 19, type: "S", text: t("\uBD09\uC0AC\uD65C\uB3D9\uC774\uB098 \uC0AC\uD68C \uAE30\uC5EC \uD65C\uB3D9\uC5D0 \uAD00\uC2EC\uC774 \uC788\uB2E4", "I am interested in volunteer work or community service") },
    { id: 20, type: "S", text: t("\uD63C\uC790\uBCF4\uB2E4 \uB2E4\uB978 \uC0AC\uB78C\uACFC \uD568\uAED8 \uD611\uB825\uD558\uBA70 \uC77C\uD558\uB294 \uAC83\uC774 \uC88B\uB2E4", "I prefer working cooperatively with others rather than alone") },
    { id: 21, type: "E", text: t("\uC0C8\uB85C\uC6B4 \uC0AC\uC5C5 \uC544\uC774\uB514\uC5B4\uB97C \uC2E4\uD589\uC5D0 \uC62E\uAE30\uB294 \uAC83\uC774 \uC990\uAC81\uB2E4", "I enjoy turning new business ideas into reality") },
    { id: 22, type: "E", text: t("\uC0AC\uB78C\uB4E4\uC744 \uC124\uB4DD\uD558\uAC70\uB098 \uD611\uC0C1\uD558\uB294 \uAC83\uC774 \uC790\uC2E0 \uC788\uB2E4", "I am confident in persuading or negotiating with people") },
    { id: 23, type: "E", text: t("\uB9AC\uB354\uC2ED\uC744 \uBC1C\uD718\uD558\uC5EC \uD300\uC744 \uC774\uB044\uB294 \uC5ED\uD560\uC774 \uC88B\uB2E4", "I enjoy leading a team and exercising leadership") },
    { id: 24, type: "E", text: t("\uB3C4\uC804\uC801\uC778 \uBAA9\uD45C\uB97C \uC138\uC6B0\uACE0 \uC131\uCDE8\uD558\uB294 \uAC83\uC5D0\uC11C \uB3D9\uAE30\uBD80\uC5EC\uB97C \uBC1B\uB294\uB2E4", "I am motivated by setting and achieving challenging goals") },
    { id: 25, type: "E", text: t("\uACBD\uC7C1\uC801\uC778 \uD658\uACBD\uC5D0\uC11C\uB3C4 \uC801\uADF9\uC801\uC73C\uB85C \uCC38\uC5EC\uD558\uB294 \uD3B8\uC774\uB2E4", "I actively participate even in competitive environments") },
    { id: 26, type: "C", text: t("\uC815\uD574\uC9C4 \uC808\uCC28\uC640 \uADDC\uCE59\uC744 \uB530\uB974\uB294 \uAC83\uC774 \uD3B8\uD558\uB2E4", "I feel comfortable following established procedures and rules") },
    { id: 27, type: "C", text: t("\uB370\uC774\uD130\uB97C \uC815\uB9AC\uD558\uACE0 \uBB38\uC11C\uB97C \uCCB4\uACC4\uC801\uC73C\uB85C \uAD00\uB9AC\uD558\uB294 \uAC83\uC774 \uC990\uAC81\uB2E4", "I enjoy organizing data and managing documents systematically") },
    { id: 28, type: "C", text: t("\uAF3C\uAF3C\uD558\uACE0 \uC815\uD655\uD55C \uC791\uC5C5\uC744 \uC120\uD638\uD55C\uB2E4", "I prefer careful and precise work") },
    { id: 29, type: "C", text: t("\uC22B\uC790\uB098 \uBB38\uC11C\uB97C \uB2E4\uB8E8\uB294 \uC0AC\uBB34\uC801\uC778 \uC5C5\uBB34\uAC00 \uC5B4\uB835\uC9C0 \uC54A\uB2E4", "I can handle administrative tasks involving numbers or documents") },
    { id: 30, type: "C", text: t("\uC77C\uAD00\uC131 \uC788\uACE0 \uCCB4\uACC4\uC801\uC73C\uB85C \uC5C5\uBB34\uB97C \uCC98\uB9AC\uD558\uB294 \uD3B8\uC774\uB2E4", "I tend to handle tasks consistently and systematically") }
  ];
  const RIASEC_TYPE_INFO = {
    R: { name: t("\uC2E4\uC7AC\uD615", "Realistic"), emoji: "\u{1F527}", desc: t("\uB3C4\uAD6C\xB7\uAE30\uACC4\xB7\uC790\uC5F0\uC744 \uB2E4\uB8E8\uB294 \uC2E4\uC6A9\uC801\uC774\uACE0 \uAD6C\uCCB4\uC801\uC778 \uD65C\uB3D9\uC744 \uC88B\uC544\uD569\uB2C8\uB2E4. \uD604\uC7A5\uAC10 \uC788\uB294 \uD658\uACBD\uC5D0\uC11C \uC9C1\uC811 \uB9CC\uB4E4\uACE0 \uC6B4\uC601\uD558\uB294 \uC77C\uC5D0\uC11C \uBCF4\uB78C\uC744 \uB290\uB08D\uB2C8\uB2E4.", "You enjoy practical, hands-on activities involving tools, machines, or nature. You find fulfillment in building and operating things in real-world environments."), careers: t(["\uAE30\uC220\uAD50\uC721\uAC15\uC0AC", "\uC2DC\uC124\xB7\uC548\uC804\uAD00\uB9AC", "\uC6D0\uC608\xB7\uB18D\uC5C5 \uC804\uBB38\uAC00", "\uC81C\uC870\xB7\uD488\uC9C8\uAD00\uB9AC"], ["Technical Trainer", "Facilities & Safety Manager", "Horticulture / Agriculture", "Manufacturing & QC"]) },
    I: { name: t("\uD0D0\uAD6C\uD615", "Investigative"), emoji: "\u{1F52C}", desc: t("\uC5F0\uAD6C\xB7\uBD84\uC11D\xB7\uC9C0\uC2DD \uD0D0\uAD6C\uB97C \uC990\uAE41\uB2C8\uB2E4. \uC313\uC544\uC628 \uB178\uD558\uC6B0\uB97C \uBD84\uC11D\uD558\uACE0 \uCCB4\uACC4\uD654\uD558\uB294 \uC77C\uC5D0\uC11C \uC131\uCDE8\uAC10\uC744 \uB290\uB08D\uB2C8\uB2E4.", "You enjoy research, analysis, and intellectual exploration. You gain a sense of achievement by systematizing accumulated knowledge."), careers: t(["\uACBD\uC601\uCEE8\uC124\uD134\uD2B8", "\uB370\uC774\uD130\uBD84\uC11D\uAC00", "\uAD50\uC721\uACFC\uC815\uAC1C\uBC1C\uC790", "\uC5F0\uAD6C\xB7\uAE30\uD68D\uC804\uBB38\uAC00"], ["Management Consultant", "Data Analyst", "Curriculum Developer", "Research & Planning"]) },
    A: { name: t("\uC608\uC220\uD615", "Artistic"), emoji: "\u{1F3A8}", desc: t("\uCC3D\uC758\uC801 \uD45C\uD604\uACFC \uC790\uC720\uB85C\uC6B4 \uD658\uACBD\uC744 \uC120\uD638\uD569\uB2C8\uB2E4. \uAC15\uC758, \uAE00\uC4F0\uAE30, \uCF58\uD150\uCE20 \uCC3D\uC791\uC5D0\uC11C \uB450\uAC01\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4.", "You prefer creative expression and open environments. You excel in teaching, writing, and content creation."), careers: t(["\uAC15\uC0AC\xB7\uAD50\uC721\uC804\uBB38\uAC00", "\uC791\uAC00\xB7\uCE7C\uB7FC\uB2C8\uC2A4\uD2B8", "\uCF58\uD150\uCE20\uD06C\uB9AC\uC5D0\uC774\uD130", "\uAE30\uC5C5\uAD50\uC721\uC804\uBB38\uAC00"], ["Instructor / Educator", "Writer / Columnist", "Content Creator", "Corporate Trainer"]) },
    S: { name: t("\uC0AC\uD68C\uD615", "Social"), emoji: "\u{1F91D}", desc: t("\uC0AC\uB78C\uC744 \uB3D5\uACE0 \uAC00\uB974\uCE58\uACE0 \uC0C1\uB2F4\uD558\uB294 \uAC83\uC744 \uC88B\uC544\uD569\uB2C8\uB2E4. \uD48D\uBD80\uD55C \uACBD\uD5D8\uACFC \uB178\uD558\uC6B0\uB97C \uB098\uB204\uB294 \uBA58\uD1A0\xB7\uCF54\uCE58 \uC5ED\uD560\uC5D0 \uC798 \uB9DE\uC2B5\uB2C8\uB2E4.", "You enjoy helping, teaching, and counseling others. The mentor and coach roles suit you well."), careers: t(["\uCEE4\uB9AC\uC5B4\uCF54\uCE58\xB7\uBA58\uD1A0", "\uC2EC\uB9AC\uC0C1\uB2F4\uC0AC", "\uC0AC\uD68C\uBCF5\uC9C0\uC0AC", "\uC9C1\uC5C5\uD6C8\uB828\uAC15\uC0AC"], ["Career Coach / Mentor", "Counselor", "Social Worker", "Vocational Trainer"]) },
    E: { name: t("\uC9C4\uCDE8\uD615", "Enterprising"), emoji: "\u{1F680}", desc: t("\uB9AC\uB354\uC2ED\xB7\uC124\uB4DD\xB7\uC0AC\uC5C5 \uB3C4\uC804\uC744 \uC990\uAE41\uB2C8\uB2E4. \uC5C5\uBB34 \uACBD\uD5D8\uC744 \uBC14\uD0D5\uC73C\uB85C \uD55C \uCC3D\uC5C5, \uC601\uC5C5\xB7\uCEE8\uC124\uD305\uC5D0 \uC801\uD569\uD569\uB2C8\uB2E4.", "You enjoy leadership, persuasion, and business challenges. Entrepreneurship, sales, and consulting suit you well."), careers: t(["\uCC3D\uC5C5\uAC00\xB7\uC18C\uC0C1\uACF5\uC778", "\uC601\uC5C5\uCEE8\uC124\uD134\uD2B8", "HR\xB7\uC870\uC9C1\uAD00\uB9AC", "\uBE44\uC988\uB2C8\uC2A4\uAC1C\uBC1C"], ["Entrepreneur", "Sales Consultant", "HR & Org Management", "Business Development"]) },
    C: { name: t("\uAD00\uC2B5\uD615", "Conventional"), emoji: "\u{1F4CB}", desc: t("\uCCB4\uACC4\uC801\uC774\uACE0 \uC815\uD655\uD55C \uB370\uC774\uD130 \uCC98\uB9AC\uB97C \uC120\uD638\uD569\uB2C8\uB2E4. \uD589\uC815\xB7\uAD00\uB9AC\xB7\uAC10\uB9AC \uBD84\uC57C\uC5D0\uC11C \uAC15\uC810\uC744 \uBC1C\uD718\uD569\uB2C8\uB2E4.", "You prefer systematic, accurate data processing. You excel in administration, management, and inspection roles."), careers: t(["\uC138\uBB34\xB7\uD68C\uACC4\uC804\uBB38\uAC00", "\uD488\uC9C8\xB7\uC778\uC99D\uAD00\uB9AC", "\uD589\uC815\xB7\uAE30\uD68D\uAD00\uB9AC\uC790", "\uAC10\uB9AC\xB7\uC548\uC804\uAC10\uB3C5"], ["Tax & Accounting", "Quality & Certification", "Administrative Manager", "Safety Inspector"]) }
  };
  function calcRiasec() {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const q of RIASEC_Q) scores[q.type] += riasecResponses[q.id] || 3;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return { scores, sorted, dominantType: sorted[0][0] + sorted[1][0] };
  }
  function submitRiasec() {
    if (Object.keys(riasecResponses).length < 30) {
      setSaveStatus("\u26A0\uFE0F " + (30 - Object.keys(riasecResponses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { scores, sorted, dominantType } = calcRiasec();
    if (isLoggedIn) {
      api.saveTestScore("RIASEC", sorted[0][1], dominantType).catch(() => {
      });
      fetch("/api/test/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ test_type: "RIASEC", result_json: { scores, dominant_type: dominantType } })
      }).catch(() => {
      });
    }
    const data = { sessionId, testType: "RIASEC", responses: { scores, dominant_type: dominantType }, createdAt: (/* @__PURE__ */ new Date()).toISOString(), userPhone: userInfo.phone || "\uBBF8\uD655\uC778", linkId: activeLinkId || null };
    advanceToNextTest("RIASEC", data);
  }
  const VALUES_Q = [
    { id: 1, domain: "achievement", text: t("\uC5B4\uB835\uACE0 \uB3C4\uC804\uC801\uC778 \uBAA9\uD45C\uB97C \uB2EC\uC131\uD588\uC744 \uB54C \uAC00\uC7A5 \uD070 \uBCF4\uB78C\uC744 \uB290\uB080\uB2E4.", "I feel the greatest fulfillment when I achieve a difficult, challenging goal.") },
    { id: 2, domain: "achievement", text: t("\uB0B4 \uBD84\uC57C\uC5D0\uC11C \uCD5C\uACE0 \uC218\uC900\uC758 \uC131\uACFC\uB97C \uB0B4\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "It is important to me to perform at the highest level in my field.") },
    { id: 3, domain: "achievement", text: t("\uB69C\uB837\uD55C \uC131\uACFC\uC640 \uACB0\uACFC\uBB3C\uC774 \uC788\uB294 \uC77C\uC5D0\uC11C \uB3D9\uAE30\uBD80\uC5EC\uB97C \uBC1B\uB294\uB2E4.", "I am motivated by work that produces clear results and outcomes.") },
    { id: 4, domain: "service", text: t("\uB0B4 \uC77C\uC774 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC758 \uC0B6\uC5D0 \uAE0D\uC815\uC801\uC778 \uC601\uD5A5\uC744 \uBBF8\uCE58\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "It is important that my work has a positive impact on other people's lives.") },
    { id: 5, domain: "service", text: t("\uC0AC\uD68C\uC801\uC73C\uB85C \uC758\uBBF8 \uC788\uB294 \uC77C\uC744 \uD558\uACE0 \uC2F6\uB2E4.", "I want to do work that is meaningful to society.") },
    { id: 6, domain: "service", text: t("\uC5B4\uB824\uC6B4 \uC0AC\uB78C\uC744 \uB3D5\uB294 \uC77C\uC5D0\uC11C \uC9C4\uC815\uD55C \uBCF4\uB78C\uC744 \uB290\uB080\uB2E4.", "I feel true fulfillment in work that helps people in need.") },
    { id: 7, domain: "stability", text: t("\uACE0\uC6A9\uC774 \uBCF4\uC7A5\uB418\uACE0 \uC548\uC815\uC801\uC778 \uC9C1\uC7A5\uC744 \uAC00\uC7A5 \uC6B0\uC120\uC2DC\uD55C\uB2E4.", "Job security and a stable workplace are my top priorities.") },
    { id: 8, domain: "stability", text: t("\uC608\uCE21 \uAC00\uB2A5\uD558\uACE0 \uBCC0\uD654\uAC00 \uC801\uC740 \uD658\uACBD\uC5D0\uC11C \uC77C\uD558\uB294 \uAC83\uC744 \uC120\uD638\uD55C\uB2E4.", "I prefer working in a predictable environment with few changes.") },
    { id: 9, domain: "stability", text: t("\uC704\uD5D8 \uBD80\uB2F4\uC774 \uC801\uC740 \uC548\uC815\uB41C \uC120\uD0DD\uC744 \uD558\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "Making safe, low-risk choices is important to me.") },
    { id: 10, domain: "autonomy", text: t("\uC2A4\uC2A4\uB85C \uC5C5\uBB34 \uBC29\uC2DD\uACFC \uC77C\uC815\uC744 \uACB0\uC815\uD560 \uC218 \uC788\uB294 \uC790\uC728\uC131\uC774 \uC911\uC694\uD558\uB2E4.", "Having autonomy to decide my own working methods and schedule is important.") },
    { id: 11, domain: "autonomy", text: t("\uC9C0\uC2DC\uB97C \uBC1B\uAE30\uBCF4\uB2E4 \uC2A4\uC2A4\uB85C \uD310\uB2E8\uD558\uC5EC \uC77C\uD558\uB294 \uBC29\uC2DD\uC744 \uC120\uD638\uD55C\uB2E4.", "I prefer making my own judgments at work rather than following instructions.") },
    { id: 12, domain: "autonomy", text: t("\uB3C5\uB9BD\uC801\uC73C\uB85C \uC77C\uD558\uBA74\uC11C \uB098\uB9CC\uC758 \uBC29\uC2DD\uC744 \uB9CC\uB4E4\uC5B4\uAC00\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "It is important to work independently and develop my own approach.") },
    { id: 13, domain: "creativity", text: t("\uC0C8\uB85C\uC6B4 \uAC83\uC744 \uB9CC\uB4E4\uACE0 \uCC3D\uC870\uD558\uB294 \uC77C\uC5D0\uC11C \uD070 \uC990\uAC70\uC6C0\uC744 \uB290\uB080\uB2E4.", "I find great joy in work that involves creating and building something new.") },
    { id: 14, domain: "creativity", text: t("\uAE30\uC874 \uD2C0\uC744 \uAE68\uACE0 \uD601\uC2E0\uC801\uC778 \uBC29\uBC95\uC744 \uC2DC\uB3C4\uD558\uB294 \uAC83\uC744 \uC990\uAE34\uB2E4.", "I enjoy breaking existing norms and trying innovative approaches.") },
    { id: 15, domain: "creativity", text: t("\uC608\uC220\uC801\xB7\uCC3D\uC758\uC801 \uD45C\uD604\uC774 \uAC00\uB2A5\uD55C \uC77C\uC5D0 \uB9E4\uB825\uC744 \uB290\uB080\uB2E4.", "I am attracted to work that allows artistic or creative expression.") },
    { id: 16, domain: "influence", text: t("\uC870\uC9C1\uC774\uB098 \uC0AC\uD68C\uC5D0\uC11C \uC601\uD5A5\uB825 \uC788\uB294 \uC704\uCE58\uC5D0 \uC788\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "It is important to me to hold an influential position in my organization or society.") },
    { id: 17, domain: "influence", text: t("\uC911\uC694\uD55C \uACB0\uC815\uC5D0 \uCC38\uC5EC\uD558\uACE0 \uC758\uC0AC\uACB0\uC815 \uACFC\uC815\uC5D0\uC11C \uC8FC\uB3C4\uC801 \uC5ED\uD560\uC744 \uD558\uACE0 \uC2F6\uB2E4.", "I want to participate in important decisions and play a leading role in the process.") },
    { id: 18, domain: "influence", text: t("\uB2E4\uB978 \uC0AC\uB78C\uB4E4\uC758 \uC0DD\uAC01\uACFC \uD589\uB3D9\uC5D0 \uAE0D\uC815\uC801 \uBCC0\uD654\uB97C \uC774\uB04C\uACE0 \uC2F6\uB2E4.", "I want to drive positive change in others' thinking and behavior.") },
    { id: 19, domain: "knowledge", text: t("\uC9C0\uC18D\uC801\uC73C\uB85C \uC0C8\uB85C\uC6B4 \uC9C0\uC2DD\uACFC \uAE30\uC220\uC744 \uBC30\uC6B0\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "Continuously learning new knowledge and skills is important to me.") },
    { id: 20, domain: "knowledge", text: t("\uD2B9\uC815 \uBD84\uC57C\uC5D0\uC11C \uAE4A\uC740 \uC804\uBB38\uC131\uC744 \uC313\uB294 \uAC83\uC5D0 \uD070 \uC758\uBBF8\uB97C \uB454\uB2E4.", "Building deep expertise in a specific field is very meaningful to me.") },
    { id: 21, domain: "knowledge", text: t("\uC9C0\uC801 \uC790\uADF9\uC774 \uC788\uB294 \uBCF5\uC7A1\uD558\uACE0 \uC5B4\uB824\uC6B4 \uBB38\uC81C\uB97C \uB2E4\uB8E8\uB294 \uC77C\uC744 \uC88B\uC544\uD55C\uB2E4.", "I enjoy tackling complex, intellectually challenging problems.") },
    { id: 22, domain: "balance", text: t("\uC77C\uACFC \uAC1C\uC778 \uC0DD\uD65C\uC758 \uADE0\uD615\uC774 \uBB34\uC5C7\uBCF4\uB2E4 \uC911\uC694\uD558\uB2E4.", "Maintaining a balance between work and personal life is my top priority.") },
    { id: 23, domain: "balance", text: t("\uAC00\uC871\uACFC \uD568\uAED8\uD558\uB294 \uC2DC\uAC04\uACFC \uAC1C\uC778 \uCDE8\uBBF8\uB97C \uCDA9\uBD84\uD788 \uB204\uB9B4 \uC218 \uC788\uB294 \uC9C1\uC5C5\uC744 \uC6D0\uD55C\uB2E4.", "I want a job that allows enough time for family and personal hobbies.") },
    { id: 24, domain: "balance", text: t("\uACFC\uB3C4\uD55C \uC5C5\uBB34 \uBD80\uB2F4\uBCF4\uB2E4 \uC801\uC815\uD55C \uC218\uC900\uC758 \uCC45\uC784\uC774 \uC788\uB294 \uC77C\uC744 \uC120\uD638\uD55C\uB2E4.", "I prefer work with a reasonable level of responsibility over an excessive workload.") },
    { id: 25, domain: "social", text: t("\uC8FC\uBCC0 \uC0AC\uB78C\uB4E4\uC5D0\uAC8C \uC778\uC815\uBC1B\uACE0 \uC874\uACBD\uBC1B\uB294 \uC9C1\uC5C5\uC744 \uAC16\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "Having a job that is respected and admired by people around me is important.") },
    { id: 26, domain: "social", text: t("\uC0AC\uD68C\uC801\uC73C\uB85C \uBA85\uB9DD \uC788\uACE0 \uC704\uC0C1\uC774 \uB192\uC740 \uC9C1\uC5C5\uC744 \uAC16\uACE0 \uC2F6\uB2E4.", "I want to have a socially prestigious and high-profile career.") },
    { id: 27, domain: "social", text: t("\uB0B4 \uC9C1\uC5C5\uC774 \uD0C0\uC778\uC5D0\uAC8C \uAE0D\uC815\uC801\uC73C\uB85C \uD3C9\uAC00\uBC1B\uB294 \uAC83\uC774 \uC911\uC694\uD558\uB2E4.", "It is important that others view my job positively.") },
    { id: 28, domain: "economic", text: t("\uB192\uC740 \uC218\uC785\uC744 \uC62C\uB9B4 \uC218 \uC788\uB294 \uC9C1\uC5C5\uC744 \uC6D0\uD55C\uB2E4.", "I want a job that allows me to earn a high income.") },
    { id: 29, domain: "economic", text: t("\uCDA9\uBD84\uD55C \uACBD\uC81C\uC801 \uBCF4\uC0C1\uC774 \uC788\uC5B4\uC57C \uC77C\uC5D0\uC11C \uB9CC\uC871\uAC10\uC744 \uB290\uB080\uB2E4.", "I can only feel satisfied at work when there is sufficient financial compensation.") },
    { id: 30, domain: "economic", text: t("\uC131\uACFC\uC5D0 \uB530\uB978 \uB192\uC740 \uC778\uC13C\uD2F0\uBE0C\uB97C \uC81C\uACF5\uD558\uB294 \uC9C1\uC5C5\uC744 \uC120\uD638\uD55C\uB2E4.", "I prefer jobs that offer high incentives based on performance.") }
  ];
  const VALUES_DOMAIN_INFO = {
    achievement: { label: t("\uC131\uCDE8", "Achievement"), emoji: "\u{1F3C6}", desc: t("\uB192\uC740 \uBAA9\uD45C\uB97C \uB2EC\uC131\uD558\uACE0 \uC131\uACF5\uC744 \uCD94\uAD6C\uD569\uB2C8\uB2E4.", "You pursue high goals and strive for success.") },
    service: { label: t("\uBD09\uC0AC", "Service"), emoji: "\u{1F331}", desc: t("\uD0C0\uC778\uC744 \uB3D5\uACE0 \uC0AC\uD68C\uC5D0 \uAE30\uC5EC\uD558\uB294 \uAC83\uC5D0\uC11C \uC758\uBBF8\uB97C \uCC3E\uC2B5\uB2C8\uB2E4.", "You find meaning in helping others and contributing to society.") },
    stability: { label: t("\uC548\uC815", "Job Security"), emoji: "\u{1F6E1}\uFE0F", desc: t("\uC9C1\uC5C5 \uC548\uC815\uC131\uACFC \uC608\uCE21 \uAC00\uB2A5\uD55C \uD658\uACBD\uC744 \uC120\uD638\uD569\uB2C8\uB2E4.", "You prefer job security and a predictable environment.") },
    autonomy: { label: t("\uC790\uC728", "Autonomy"), emoji: "\u{1F98B}", desc: t("\uC2A4\uC2A4\uB85C \uACB0\uC815\uD558\uACE0 \uB3C5\uB9BD\uC801\uC73C\uB85C \uC77C\uD558\uB294 \uAC83\uC744 \uC911\uC2DC\uD569\uB2C8\uB2E4.", "You value making your own decisions and working independently.") },
    creativity: { label: t("\uCC3D\uC758", "Creativity"), emoji: "\u{1F3A8}", desc: t("\uC0C8\uB85C\uC6B4 \uAC83\uC744 \uB9CC\uB4E4\uACE0 \uD601\uC2E0\uD558\uB294 \uC77C\uC5D0\uC11C \uC990\uAC70\uC6C0\uC744 \uB290\uB08D\uB2C8\uB2E4.", "You find joy in creating new things and driving innovation.") },
    influence: { label: t("\uC601\uD5A5\uB825", "Influence"), emoji: "\u{1F4E2}", desc: t("\uB2E4\uB978 \uC0AC\uB78C\uACFC \uC870\uC9C1\uC5D0 \uC601\uD5A5\uC744 \uBBF8\uCE58\uB294 \uAC83\uC744 \uC911\uC2DC\uD569\uB2C8\uB2E4.", "You value having influence over others and your organization.") },
    knowledge: { label: t("\uC9C0\uC2DD\uCD94\uAD6C", "Knowledge"), emoji: "\u{1F4DA}", desc: t("\uC9C0\uC18D\uC801\uC778 \uD559\uC2B5\uACFC \uC804\uBB38\uC131 \uAC1C\uBC1C\uC5D0 \uAC00\uCE58\uB97C \uB461\uB2C8\uB2E4.", "You place value on continuous learning and developing expertise.") },
    balance: { label: t("\uC6CC\uB77C\uBC38", "Work-Life Balance"), emoji: "\u2696\uFE0F", desc: t("\uC77C\uACFC \uC0B6\uC758 \uADE0\uD615\uC744 \uC911\uC694\uD558\uAC8C \uC0DD\uAC01\uD569\uB2C8\uB2E4.", "You consider work-life balance a top priority.") },
    social: { label: t("\uC0AC\uD68C\uC778\uC815", "Social Recognition"), emoji: "\u{1F31F}", desc: t("\uD0C0\uC778\uC73C\uB85C\uBD80\uD130 \uC778\uC815\uACFC \uC874\uACBD\uC744 \uBC1B\uB294 \uAC83\uC744 \uC911\uC2DC\uD569\uB2C8\uB2E4.", "You value receiving recognition and respect from others.") },
    economic: { label: t("\uACBD\uC81C\uC801 \uBCF4\uC0C1", "Economic Reward"), emoji: "\u{1F4B0}", desc: t("\uB192\uC740 \uC218\uC785\uACFC \uACBD\uC81C\uC801 \uC5EC\uC720\uB97C \uC911\uC694\uD558\uAC8C \uC0DD\uAC01\uD569\uB2C8\uB2E4.", "You consider high income and financial security important.") }
  };
  function calcValues() {
    const sums = {}, counts = {};
    for (const q of VALUES_Q) {
      if (!sums[q.domain]) {
        sums[q.domain] = 0;
        counts[q.domain] = 0;
      }
      sums[q.domain] += valuesResponses[q.id] || 3;
      counts[q.domain]++;
    }
    const scores = {};
    for (const d of Object.keys(sums)) scores[d] = Math.round(sums[d] / counts[d] * 20);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return { scores, sorted };
  }
  function submitValues() {
    if (Object.keys(valuesResponses).length < 30) {
      setSaveStatus("\u26A0\uFE0F " + (30 - Object.keys(valuesResponses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { scores, sorted } = calcValues();
    if (isLoggedIn) {
      api.saveTestScore("VALUES", sorted[0][1], sorted[0][0]).catch(() => {
      });
      fetch("/api/test/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ test_type: "VALUES", result_json: { scores } })
      }).catch(() => {
      });
    }
    const data = { sessionId, testType: "VALUES", responses: { scores }, createdAt: (/* @__PURE__ */ new Date()).toISOString(), userPhone: userInfo.phone || "\uBBF8\uD655\uC778", linkId: activeLinkId || null };
    advanceToNextTest("VALUES", data);
  }
  function submitDass21() {
    if (Object.keys(dass21Responses).length < 21) {
      setSaveStatus("\u26A0\uFE0F " + (21 - Object.keys(dass21Responses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { depression } = calcDass21();
    if (isLoggedIn) api.saveTestScore("DASS21", depression.score, depression.level).catch(() => {
    });
    const data = {
      sessionId,
      testType: "DASS21",
      responses: dass21Responses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} DASS-21 \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("DASS21", data);
  }
  function submitBig5() {
    if (Object.keys(big5Responses).length < 50) {
      setSaveStatus("\u26A0\uFE0F " + (50 - Object.keys(big5Responses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (partnerMode) {
      const result = calcBig5();
      const newCompleted = { ...partnerMode.completedResults, big5: result };
      const remaining = partnerMode.pendingTests.filter((t2) => t2 !== "BIG5");
      setPartnerMode((prev) => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) {
        submitPartnerResults(newCompleted);
      } else {
        setView("partnerTest:" + remaining[0]);
      }
      return;
    }
    const data = {
      sessionId,
      testType: "BIG5",
      responses: big5Responses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    saveCoupleResult("BIG5", calcBig5());
    console.log("\u{1F4DD} Big5 \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("BIG5", data);
  }
  function submitBurnout() {
    if (Object.keys(burnoutResponses).length < 50) {
      setSaveStatus("\u26A0\uFE0F " + (50 - Object.keys(burnoutResponses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const { totalScore, level } = calcBurnout();
    if (isLoggedIn) api.saveTestScore("BURNOUT", totalScore, level).catch(() => {
    });
    const data = {
      sessionId,
      testType: "BURNOUT",
      responses: burnoutResponses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    console.log("\u{1F4DD} \uBC88\uC544\uC6C3 \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("BURNOUT", data);
  }
  function submitLost() {
    if (Object.keys(lostResponses).length < 60) {
      setSaveStatus("\u26A0\uFE0F " + (60 - Object.keys(lostResponses).length) + "\uAC1C \uBB38\uD56D\uC774 \uB0A8\uC544\uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (partnerMode) {
      const { axisAvg: axisAvg2, typeCode: typeCode2, typeInfo: typeInfo2, stressStyle: stressStyle2, stabilityStyle: stabilityStyle2 } = calcLost();
      const result = { axisAvg: axisAvg2, typeCode: typeCode2, typeInfo: typeInfo2, stressStyle: stressStyle2, stabilityStyle: stabilityStyle2 };
      const newCompleted = { ...partnerMode.completedResults, lost: result };
      const remaining = partnerMode.pendingTests.filter((t2) => t2 !== "LOST");
      setPartnerMode((prev) => ({ ...prev, completedResults: newCompleted, pendingTests: remaining }));
      if (remaining.length === 0) {
        submitPartnerResults(newCompleted);
      } else {
        setView("partnerTest:" + remaining[0]);
      }
      return;
    }
    const data = {
      sessionId,
      testType: "LOST",
      responses: lostResponses,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userPhone: userInfo.phone || "\uBBF8\uD655\uC778",
      linkId: activeLinkId || null
    };
    const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
    saveCoupleResult("LOST", { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle });
    console.log("\u{1F4DD} LOST \uAC80\uC0AC \uC81C\uCD9C:", sessionId);
    advanceToNextTest("LOST", data);
  }
  function viewSession(sid, returnDataOnly = false) {
    var _a2, _b2;
    console.log("\u{1F50D} viewSession \uD638\uCD9C:", sid, "returnDataOnly:", returnDataOnly);
    const r = storage.get("session_" + sid);
    if (!r) {
      console.log("\u274C \uC138\uC158\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4:", sid);
      return null;
    }
    const data = JSON.parse(r.value);
    console.log("\u2705 \uC138\uC158 \uB370\uC774\uD130 \uB85C\uB4DC:", data.testType, data.userPhone);
    if (returnDataOnly) {
      console.log("\u{1F4C4} PDF \uC0DD\uC131\uC6A9 \uB370\uC774\uD130 \uBC18\uD658");
      return data;
    }
    if (data.linkId) {
      const linkData = loadLink(data.linkId);
      if (linkData) {
        console.log("\u{1F517} \uB9C1\uD06C \uB370\uC774\uD130 \uBCF5\uC6D0:", linkData.counselingType);
        setActiveLinkData(linkData);
      }
    }
    if (data.testType === "SCT") {
      setSrciResponses(((_a2 = data.responses) == null ? void 0 : _a2.byScale) ? {} : data.responses || {});
      setSctSummaries(data.summaries || {});
      console.log("\u{1F4DD} SCT \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "DSI") {
      setSdriResponses(((_b2 = data.responses) == null ? void 0 : _b2.answers) || data.responses || {});
      setDsiRec(data.recommendation || "");
      console.log("\u{1F50D} SDRI \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "PHQ9") {
      setPhq9Responses(data.responses || {});
      console.log("\u{1F614} PHQ-9 \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "GAD7") {
      setGad7Responses(data.responses || {});
      console.log("\u{1F630} GAD-7 \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "DASS21") {
      setDass21Responses(data.responses || {});
      console.log("\u{1F4CA} DASS-21 \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "BIG5") {
      setBig5Responses(data.responses || {});
      console.log("\u{1F31F} Big5 \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "BURNOUT") {
      setBurnoutResponses(data.responses || {});
      console.log("\u{1F525} \uBC88\uC544\uC6C3 \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    } else if (data.testType === "LOST") {
      setLostResponses(data.responses || {});
      console.log("\u{1F9ED} LOST \uC751\uB2F5 \uC124\uC815 \uC644\uB8CC");
    }
    setSessionId(sid);
    setUserInfo({ phone: data.userPhone || "", password: "" });
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
    console.log("\u{1F3AF} \uBDF0 \uC804\uD658:", targetView);
    setView(targetView);
    return data;
  }
  async function loadApiSettings() {
    try {
      const res = await fetch("/api/admin/api-settings");
      const data = await res.json();
      if (data.success) setApiSettings(data.data || []);
    } catch (e) {
      console.error("API \uC124\uC815 \uB85C\uB4DC \uC2E4\uD328:", e);
    }
  }
  async function saveApiSetting() {
    if (!apiSettingForm.key_value.trim()) {
      setApiSettingMsg({ type: "error", text: "API \uD0A4\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    setApiSettingLoading(true);
    setApiSettingMsg({ type: "", text: "" });
    setApiTestResult({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/api-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify(apiSettingForm)
      });
      const data = await res.json();
      if (data.success) {
        setApiSettingMsg({ type: "success", text: "\u2705 " + data.message });
        setApiSettingForm((f) => ({ ...f, key_value: "" }));
        setShowApiKeyInput(false);
        await loadApiSettings();
      } else {
        setApiSettingMsg({ type: "error", text: "\u274C " + (data.error || "\uC800\uC7A5 \uC2E4\uD328") });
      }
    } catch (e) {
      setApiSettingMsg({ type: "error", text: "\u274C \uC11C\uBC84 \uC624\uB958: " + e.message });
    } finally {
      setApiSettingLoading(false);
    }
  }
  async function testApiConnection() {
    setApiTestLoading(true);
    setApiTestResult({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/api-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({
          key_name: apiSettingForm.key_name,
          key_value: apiSettingForm.key_value || void 0
        })
      });
      const data = await res.json();
      setApiTestResult({
        type: data.success ? "success" : "error",
        text: data.success ? data.message : "\u274C " + (data.error || "\uC5F0\uACB0 \uC2E4\uD328")
      });
    } catch (e) {
      setApiTestResult({ type: "error", text: "\u274C \uC11C\uBC84 \uC624\uB958: " + e.message });
    } finally {
      setApiTestLoading(false);
    }
  }
  async function deactivateApiKey(keyName) {
    if (!confirm(`${keyName} \uD0A4\uB97C \uBE44\uD65C\uC131\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?
AI \uBD84\uC11D \uAE30\uB2A5\uC774 \uC911\uB2E8\uB429\uB2C8\uB2E4.`)) return;
    try {
      const res = await fetch(`/api/admin/api-settings/${keyName}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setApiSettingMsg({ type: "success", text: "\u2705 " + data.message });
        await loadApiSettings();
      }
    } catch (e) {
      setApiSettingMsg({ type: "error", text: "\u274C \uBE44\uD65C\uC131\uD654 \uC2E4\uD328" });
    }
  }
  async function runAiAnalysis(key, testType, responses, category) {
    var _a2;
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    if (isAiChatExhausted()) {
      setShowAiLimitModal(true);
      return;
    }
    setAiLoading((p) => ({ ...p, [key]: true }));
    setAiError((p) => ({ ...p, [key]: "" }));
    setAiAnalysis((p) => ({ ...p, [key]: "" }));
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...api._authHeader() },
        body: JSON.stringify({ testType, counselingType: counselingType2, responses, category, lang })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
        if (res.status === 429) throw new Error("\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
        throw new Error(err.error || "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            if (parsed.type === "content_block_delta" && ((_a2 = parsed.delta) == null ? void 0 : _a2.text)) {
              setAiAnalysis((p) => ({ ...p, [key]: (p[key] || "") + parsed.delta.text }));
            }
          } catch {
          }
        }
      }
    } catch (e) {
      setAiError((p) => ({ ...p, [key]: e.message || "AI \uBD84\uC11D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." }));
    } finally {
      setAiLoading((p) => ({ ...p, [key]: false }));
    }
  }
  function MasterDebugPanel() {
    const [open, setOpen] = React.useState(false);
    const [logs, setLogs] = React.useState([]);
    const [serverLogs, setServerLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("local");
    const loadLocal = () => setLogs([...window.__ERR_LOG || []]);
    const loadServer = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/debug/client-errors");
        setServerLogs(res.errors || []);
      } catch {
        setServerLogs([]);
      } finally {
        setLoading(false);
      }
    };
    const onOpen = () => {
      loadLocal();
      setOpen(true);
    };
    const errCount = (window.__ERR_LOG || []).length;
    if (!open) return /* @__PURE__ */ React.createElement("button", { onClick: onOpen, title: "Debug Log", style: {
      position: "fixed",
      bottom: 80,
      right: 16,
      zIndex: 9999,
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: "none",
      background: errCount > 0 ? "#DC2626" : "#6B7280",
      color: "white",
      fontSize: 18,
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    } }, "\u{1F41B}");
    const display = activeTab === "local" ? logs : serverLogs;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 16 },
        onClick: (e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 520, maxHeight: "85vh", background: "#1E1E1E", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", color: "white", fontFamily: "monospace" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", background: "#2D2D2D", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #444" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, "\u{1F41B} Error Log ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#888" } }, "master only")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
        loadLocal();
        if (activeTab === "server") loadServer();
      }, style: { background: "#3D3D3D", border: "none", color: "#CCC", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\u21BA"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
        window.__ERR_LOG = [];
        setLogs([]);
      }, style: { background: "#3D3D3D", border: "none", color: "#F87171", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\uC9C0\uC6B0\uAE30"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(false), style: { background: "#3D3D3D", border: "none", color: "#CCC", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\u2715"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", background: "#2D2D2D", borderBottom: "1px solid #444" } }, [["local", "\uB85C\uCEEC (\uBA54\uBAA8\uB9AC)"], ["server", "\uC11C\uBC84 (KV 7\uC77C)"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: k,
          onClick: () => {
            setActiveTab(k);
            if (k === "server" && !serverLogs.length) loadServer();
          },
          style: { flex: 1, padding: "8px", border: "none", background: activeTab === k ? "#1E1E1E" : "transparent", color: activeTab === k ? "#60A5FA" : "#888", fontSize: 12, cursor: "pointer", borderBottom: activeTab === k ? "2px solid #60A5FA" : "2px solid transparent" }
        },
        l,
        " (",
        k === "local" ? logs.length : serverLogs.length,
        ")"
      ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 8 } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#888", padding: 20, fontSize: 12 } }, "\uB85C\uB529 \uC911..."), !loading && display.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#4ADE80", padding: 20, fontSize: 12 } }, "\u2713 \uC5D0\uB7EC \uC5C6\uC74C"), display.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: "#2D2D2D", borderRadius: 8, padding: "8px 10px", marginBottom: 6, borderLeft: `3px solid ${e.type === "error" ? "#F87171" : "#FB923C"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: e.type === "error" ? "#F87171" : "#FB923C", fontWeight: 700 } }, (e.type || "").toUpperCase()), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#666" } }, (e.t || e.time || "").slice(11, 19))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#E5E7EB", wordBreak: "break-all", marginBottom: 2 } }, e.msg || e.message), (e.src || e.source) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#666" } }, e.src || e.source, e.line ? `:${e.line}` : ""), e.stack && /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", { style: { fontSize: 10, color: "#888", cursor: "pointer" } }, "\uC2A4\uD0DD \u25B8"), /* @__PURE__ */ React.createElement("pre", { style: { fontSize: 10, color: "#9CA3AF", whiteSpace: "pre-wrap", margin: "4px 0 0", maxHeight: 100, overflow: "auto" } }, e.stack))))))
    );
  }
  function ExternalResultSection({ onSaved, hideTrigger, externalShow, setExternalShow }) {
    var _a2;
    const [_showModal, _setShowModal] = React.useState(false);
    const showModal = externalShow !== void 0 ? externalShow : _showModal;
    const setShowModal = (v) => {
      _setShowModal(v);
      if (setExternalShow) setExternalShow(v);
    };
    const [tab, setTab] = React.useState("manual");
    const [extType, setExtType] = React.useState("PHQ9");
    const [extScore, setExtScore] = React.useState("");
    const [extDate, setExtDate] = React.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
    const [extNote, setExtNote] = React.useState("");
    const [manualMsg, setManualMsg] = React.useState("");
    const [manualLoading, setManualLoading] = React.useState(false);
    const [pdfType, setPdfType] = React.useState("MBTI");
    const [pdfFile, setPdfFile] = React.useState(null);
    const [pdfStatus, setPdfStatus] = React.useState("");
    const [pdfText, setPdfText] = React.useState("");
    const [pdfPageCount, setPdfPageCount] = React.useState(0);
    const [pdfAnalysis, setPdfAnalysis] = React.useState("");
    const [pdfGames, setPdfGames] = React.useState([]);
    const [pdfFollowup, setPdfFollowup] = React.useState([]);
    const [pdfMsg, setPdfMsg] = React.useState("");
    const manualTypes = [
      { id: "PHQ9", label: "PHQ-9 \uC6B0\uC6B8" },
      { id: "GAD7", label: "GAD-7 \uBD88\uC548" },
      { id: "BURNOUT", label: "\uBC88\uC544\uC6C3" },
      { id: "BIG5", label: "Big5 \uC131\uACA9" },
      { id: "DASS21", label: "DASS-21" },
      { id: "DSI", label: "\uC790\uC544\uBD84\uD654(DSI)" },
      { id: "LOST", label: "LOST \uD589\uB3D9" },
      { id: "CUSTOM", label: "\uAE30\uD0C0" }
    ];
    const pdfTypes = [
      { id: "MBTI", label: "MBTI \uC131\uACA9\uC720\uD615" },
      { id: "TCI", label: "TCI \uAE30\uC9C8/\uC131\uACA9" },
      { id: "MMPI", label: "MMPI \uB2E4\uBA74\uC801\uC778\uC131" },
      { id: "RORSCHACH", label: "\uB85C\uC0E4 \uAC80\uC0AC" },
      { id: "SCT", label: "\uBB38\uC7A5\uC644\uC131\uAC80\uC0AC(SCT)" },
      { id: "HTP", label: "HTP \uD22C\uC0AC\uAC80\uC0AC" },
      { id: "WAIS", label: "WAIS \uC9C0\uB2A5\uAC80\uC0AC" },
      { id: "K-WISC", label: "K-WISC \uC544\uB3D9\uC9C0\uB2A5" },
      { id: "ENNEAGRAM", label: "\uC5D0\uB2C8\uC5B4\uADF8\uB7A8" },
      { id: "DISC", label: "DISC \uD589\uB3D9\uC720\uD615" },
      { id: "HOLLAND", label: "\uD640\uB79C\uB4DC \uC9C4\uB85C" },
      { id: "OTHER", label: "\uAE30\uD0C0 \uC804\uBB38\uAC80\uC0AC" }
    ];
    const gamesMeta = {
      mood: { label: "\uAC10\uC815 \uC628\uB3C4\uACC4", emoji: "\u{1F321}\uFE0F" },
      garden: { label: "\uB9C8\uC74C \uC815\uC6D0", emoji: "\u{1F331}" },
      efmt: { label: "\uAC10\uC815\uAF43", emoji: "\u{1F338}" },
      gratitude: { label: "\uAC10\uC0AC \uC77C\uAE30", emoji: "\u{1F4D6}" },
      tree: { label: "\uB9C8\uC74C\uB098\uBB34", emoji: "\u{1F333}" },
      burnout: { label: "\uBC88\uC544\uC6C3 \uCE21\uC815", emoji: "\u{1F525}" },
      worry: { label: "\uAC71\uC815 \uD48D\uC120", emoji: "\u{1FAE7}" },
      focus: { label: "\uB9C8\uC74C \uC9D1\uC911\uB825", emoji: "\u{1F3AF}" }
    };
    const followupMeta = {
      PHQ9: "\u{1F614} \uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80",
      GAD7: "\u{1F630} \uBD88\uC548 \uC790\uAC00\uC810\uAC80",
      BURNOUT: "\u{1F525} \uBC88\uC544\uC6C3",
      BIG5: "\u{1F31F} Big5 \uC131\uACA9",
      LOST: "\u{1F9ED} LOST",
      DSI: "\u{1FA9E} \uC790\uC544\uBD84\uD654"
    };
    const loadPdfJs = () => new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    const handlePdfFile = async (e) => {
      var _a3;
      const file = (_a3 = e.target.files) == null ? void 0 : _a3[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        setPdfMsg("PDF \uD30C\uC77C\uB9CC \uCCA8\uBD80 \uAC00\uB2A5\uD569\uB2C8\uB2E4");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setPdfMsg("\uD30C\uC77C \uD06C\uAE30\uB294 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4");
        return;
      }
      setPdfFile(file);
      setPdfStatus("extracting");
      setPdfMsg("");
      setPdfText("");
      setPdfAnalysis("");
      setPdfGames([]);
      setPdfFollowup([]);
      try {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfPageCount(pdf.numPages);
        let fullText = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item) => item.str).join(" ") + "\n";
        }
        if (fullText.trim().length < 50) {
          setPdfStatus("error");
          setPdfMsg('\uD14D\uC2A4\uD2B8\uB97C \uC77D\uC744 \uC218 \uC5C6\uC5B4\uC694. \uC774 PDF\uB294 \uC774\uBBF8\uC9C0\uB85C\uB9CC \uAD6C\uC131\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.\n\n\u{1F4A1} \uD574\uACB0 \uBC29\uBC95: \uAC80\uC0AC\uAE30\uAD00\uC5D0 "\uD14D\uC2A4\uD2B8 PDF"\uB098 "\uB514\uC9C0\uD138 \uACB0\uACFC\uC9C0"\uB97C \uC694\uCCAD\uD558\uAC70\uB098, \uACB0\uACFC \uB0B4\uC6A9\uC744 \uC9C1\uC811 \uD14D\uC2A4\uD2B8\uB85C \uBCF5\uC0AC\uD574 \uC810\uC218 \uC785\uB825 \uD0ED\uC744 \uC774\uC6A9\uD574 \uC8FC\uC138\uC694.');
          return;
        }
        setPdfText(fullText);
        setPdfStatus("ready");
      } catch (err) {
        setPdfStatus("error");
        setPdfMsg("PDF \uC77D\uAE30 \uC624\uB958: " + (err.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"));
      }
    };
    const analyzePdf = async () => {
      if (!pdfText) return;
      setPdfStatus("analyzing");
      setPdfMsg("");
      try {
        const res = await api._fetch("/api/test/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testType: pdfType, pdfText, fileName: pdfFile == null ? void 0 : pdfFile.name })
        });
        const data = await res.json();
        if (res.status === 402) {
          setPdfMsg(data.error || "\uD06C\uB808\uB527\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. \uCDA9\uC804 \uD6C4 \uC774\uC6A9\uD574 \uC8FC\uC138\uC694.");
          setPdfStatus("error");
        } else if (data.success) {
          setPdfAnalysis(data.analysis);
          setPdfGames(data.suggestedGames || []);
          setPdfFollowup(data.followUpTests || []);
          setPdfStatus("done");
        } else {
          setPdfMsg(data.error || "\uBD84\uC11D \uC2E4\uD328");
          setPdfStatus("error");
        }
      } catch (e) {
        setPdfMsg("\uC624\uB958: " + e.message);
        setPdfStatus("error");
      }
    };
    const submitManual = async () => {
      const scoreNum = parseInt(extScore, 10);
      if (isNaN(scoreNum) || scoreNum < 0) {
        setManualMsg("\uC62C\uBC14\uB978 \uC810\uC218\uB97C \uC785\uB825\uD558\uC138\uC694");
        return;
      }
      setManualLoading(true);
      try {
        const res = await api._fetch("/api/test/external-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testType: extType, score: scoreNum, note: extNote || void 0, conductedAt: extDate ? new Date(extDate).toISOString() : void 0 })
        });
        const data = await res.json();
        if (data.success) {
          setManualMsg("\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
          setTimeout(() => {
            setShowModal(false);
            setManualMsg("");
            setExtScore("");
            setExtNote("");
            onSaved && onSaved();
          }, 1200);
        } else {
          setManualMsg(data.error || "\uC800\uC7A5 \uC2E4\uD328");
        }
      } catch (e) {
        setManualMsg("\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4");
      } finally {
        setManualLoading(false);
      }
    };
    const closeModal = () => {
      setShowModal(false);
      setTab("manual");
      setPdfFile(null);
      setPdfStatus("");
      setPdfText("");
      setPdfAnalysis("");
      setPdfGames([]);
      setPdfFollowup([]);
      setPdfMsg("");
      setManualMsg("");
      setExtScore("");
      setExtNote("");
      onSaved && onSaved();
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, !hideTrigger && /* @__PURE__ */ React.createElement("div", { className: "flex justify-end mb-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowModal(true),
        className: "text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-semibold"
      },
      t("\u{1F4E5} \uC678\uBD80 \uAC80\uC0AC \uACB0\uACFC \uC785\uB825 \xB7 AI \uD574\uC11D", "\u{1F4E5} Enter External Results \xB7 AI Analysis")
    )), showModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-800 text-base" }, "\u{1F4E5} \uC678\uBD80 \uAC80\uC0AC \uACB0\uACFC"), /* @__PURE__ */ React.createElement("button", { onClick: closeModal, className: "text-gray-400 hover:text-gray-600 text-xl leading-none" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "flex border-b border-gray-100 px-5 pt-3" }, [["manual", "\u270F\uFE0F \uC810\uC218 \uC9C1\uC811 \uC785\uB825"], ["pdf", "\u{1F4C4} PDF \uC5C5\uB85C\uB4DC + AI \uD574\uC11D"]].map(([t2, l]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t2,
        onClick: () => setTab(t2),
        className: `pb-2.5 px-3 text-sm font-semibold border-b-2 transition mr-2 ${tab === t2 ? "border-indigo-500 text-indigo-700" : "border-transparent text-gray-400 hover:text-gray-600"}`
      },
      l
    ))), /* @__PURE__ */ React.createElement("div", { className: "p-5" }, tab === "manual" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, "\uAC80\uC0AC \uC810\uC218\uB97C \uC9C1\uC811 \uC785\uB825\uD558\uBA74 \uD2B8\uB80C\uB4DC \uCC28\uD2B8\uC5D0 \uAE30\uB85D\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "\uAC80\uC0AC \uC720\uD615"), /* @__PURE__ */ React.createElement("select", { value: extType, onChange: (e) => setExtType(e.target.value), className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" }, manualTypes.map((t2) => /* @__PURE__ */ React.createElement("option", { key: t2.id, value: t2.id }, t2.label)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "\uC810\uC218"), /* @__PURE__ */ React.createElement("input", { type: "number", value: extScore, onChange: (e) => setExtScore(e.target.value), placeholder: "\uC22B\uC790 \uC785\uB825", min: "0", className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "\uAC80\uC0AC \uB0A0\uC9DC"), /* @__PURE__ */ React.createElement("input", { type: "date", value: extDate, onChange: (e) => setExtDate(e.target.value), className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "\uBA54\uBAA8 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement("textarea", { value: extNote, onChange: (e) => setExtNote(e.target.value), placeholder: "\uAC80\uC0AC \uAE30\uAD00, \uD2B9\uC774\uC0AC\uD56D \uB4F1...", rows: 2, className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" })), manualMsg && /* @__PURE__ */ React.createElement("p", { className: `text-xs text-center font-semibold ${manualMsg.includes("\uC800\uC7A5") ? "text-green-600" : "text-red-500"}` }, manualMsg), /* @__PURE__ */ React.createElement("button", { onClick: submitManual, disabled: manualLoading || !extScore, className: "w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white text-sm font-bold py-2.5 rounded-xl transition" }, manualLoading ? "\uC800\uC7A5 \uC911..." : "\uACB0\uACFC \uC800\uC7A5\uD558\uAE30")), tab === "pdf" && /* @__PURE__ */ React.createElement("div", null, pdfStatus !== "done" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 text-xs text-indigo-700 leading-relaxed" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold mb-1" }, "\u{1F4C4} \uC9C0\uC6D0 \uAC80\uC0AC \uC608\uC2DC"), /* @__PURE__ */ React.createElement("p", null, "MBTI \xB7 TCI \xB7 MMPI \xB7 \uB85C\uC0E4 \xB7 SCT \xB7 HTP \xB7 WAIS \xB7 \uC5D0\uB2C8\uC5B4\uADF8\uB7A8 \xB7 DISC \xB7 \uD640\uB79C\uB4DC \uB4F1"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-indigo-500" }, "\u203B \uBCD1\uC6D0\xB7\uAC80\uC0AC\uAE30\uAD00\uC5D0\uC11C \uCEF4\uD4E8\uD130\uB85C \uCD9C\uB825\uD55C PDF\uB294 \uB300\uBD80\uBD84 \uBC14\uB85C \uBD84\uC11D\uB429\uB2C8\uB2E4. \uC885\uC774\uB97C \uC2A4\uCE94\uD55C PDF\uB294 \uBD84\uC11D\uC774 \uC5B4\uB824\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "\uAC80\uC0AC \uC885\uB958"), /* @__PURE__ */ React.createElement("select", { value: pdfType, onChange: (e) => setPdfType(e.target.value), className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" }, pdfTypes.map((t2) => /* @__PURE__ */ React.createElement("option", { key: t2.id, value: t2.id }, t2.label)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-600 block mb-1" }, "PDF \uD30C\uC77C \uCCA8\uBD80"), /* @__PURE__ */ React.createElement("label", { className: `flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition ${pdfFile ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}` }, pdfStatus === "extracting" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-2xl animate-spin" }, "\u2699\uFE0F"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500" }, "\uD14D\uC2A4\uD2B8 \uCD94\uCD9C \uC911...")) : pdfStatus === "ready" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u2705"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-indigo-700" }, pdfFile == null ? void 0 : pdfFile.name), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, pdfPageCount, "\uD398\uC774\uC9C0 \xB7 ", Math.round(pdfText.length / 1e3), "K \uC790 \uCD94\uCD9C\uB428")) : pdfStatus === "error" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u274C"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-red-500 text-center" }, pdfMsg), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 mt-1" }, "\uB2E4\uB978 \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uB824\uBA74 \uC5EC\uAE30\uB97C \uD074\uB9AD\uD558\uC138\uC694")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F4C2}"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-gray-600" }, "PDF \uD30C\uC77C \uC120\uD0DD"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, "\uCD5C\uB300 10MB")), /* @__PURE__ */ React.createElement("input", { type: "file", accept: ".pdf,application/pdf", className: "hidden", onChange: handlePdfFile })))), pdfStatus === "ready" && /* @__PURE__ */ React.createElement("button", { onClick: analyzePdf, className: "w-full mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold py-3 rounded-xl transition flex items-center justify-center gap-2" }, "\u2728 AI \uD574\uC11D \uC2DC\uC791 (3 \uD06C\uB808\uB527)"), pdfStatus === "analyzing" && /* @__PURE__ */ React.createElement("div", { className: "mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5 mb-2" }, [0, 150, 300].map((d) => /* @__PURE__ */ React.createElement("div", { key: d, className: "w-2 h-2 bg-indigo-500 rounded-full animate-bounce", style: { animationDelay: d + "ms" } }))), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-indigo-700 font-semibold" }, "AI\uAC00 \uAC80\uC0AC \uACB0\uACFC\uB97C \uBD84\uC11D \uC911\uC785\uB2C8\uB2E4..."), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-indigo-400 mt-1" }, "\uC57D 20~30\uCD08 \uC18C\uC694\uB429\uB2C8\uB2E4"))), pdfStatus === "done" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-4 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, "\u2728"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-indigo-800 text-sm" }, "AI \uD574\uC11D \uACB0\uACFC \u2014 ", (_a2 = pdfTypes.find((t2) => t2.id === pdfType)) == null ? void 0 : _a2.label)), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" }, pdfAnalysis.split("**").map(
      (part, i) => i % 2 === 1 ? /* @__PURE__ */ React.createElement("strong", { key: i, className: "text-indigo-800" }, part) : part
    )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-indigo-400 mt-3 border-t border-indigo-100 pt-2" }, "\u26A0\uFE0F \uC774 \uD574\uC11D\uC740 \uBE44\uC784\uC0C1\uC801 \uCC38\uACE0 \uC815\uBCF4\uC785\uB2C8\uB2E4. \uC815\uD655\uD55C \uD574\uC11D\uC740 \uC804\uBB38\uAC00\uC640 \uC0C1\uB2F4\uD558\uC138\uC694.")), pdfGames.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-600 mb-2" }, "\u{1F3AE} \uACB0\uACFC \uB9DE\uCDA4 \uB9C8\uC74C\uD480 \uAC8C\uC784"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, pdfGames.filter((g) => gamesMeta[g]).map((g) => {
      var _a3, _b2;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: g,
          onClick: () => {
            closeModal();
            openMaumGame(g);
          },
          className: "flex items-center gap-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl px-3 py-2.5 text-left transition"
        },
        /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, (_a3 = gamesMeta[g]) == null ? void 0 : _a3.emoji),
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-semibold text-gray-700" }, (_b2 = gamesMeta[g]) == null ? void 0 : _b2.label), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-600" }, "\uBC14\uB85C \uC2DC\uC791 \u2192"))
      );
    }))), pdfFollowup.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-600 mb-2" }, "\u{1F4CB} \uC5F0\uACB0 \uAC80\uC0AC (\uB354 \uAE4A\uC774 \uC54C\uC544\uBCF4\uAE30)"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, pdfFollowup.filter((t2) => followupMeta[t2]).map((t2) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t2,
        onClick: () => {
          closeModal();
          startSelectedTest(t2);
        },
        className: "text-xs bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl transition font-semibold"
      },
      followupMeta[t2]
    )))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setPdfStatus("");
          setPdfFile(null);
          setPdfText("");
          setPdfAnalysis("");
          setPdfGames([]);
          setPdfFollowup([]);
        },
        className: "w-full text-xs text-gray-400 hover:text-gray-600 py-2 border border-gray-200 rounded-xl transition"
      },
      "\uB2E4\uB978 \uD30C\uC77C \uBD84\uC11D\uD558\uAE30"
    )))))));
  }
  function CbtPlanCard({ testHistory: testHistory2, onPlay }) {
    const [plan, setPlan] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const [doneWeeks, setDoneWeeks] = React.useState(() => {
      try {
        return JSON.parse(localStorage.getItem("cbt_done_weeks") || "[]");
      } catch {
        return [];
      }
    });
    const [expandedWeek, setExpandedWeek] = React.useState(null);
    const GAME_NAMES = {
      mood: "\u{1F60A} \uAC10\uC815 \uCCB4\uD06C\uC778",
      garden: "\u{1F33F} \uB9C8\uC74C\uC758 \uC815\uC6D0",
      efmt: "\u{1F338} \uAC10\uC815\uAF43",
      gratitude: "\u{1F64F} \uAC10\uC0AC \uC77C\uAE30",
      burnout: "\u{1F50B} \uBC88\uC544\uC6C3 \uD68C\uBCF5",
      focus: "\u{1F9E0} \uC9D1\uC911\uB825 \uD6C8\uB828",
      worry: "\u{1FAE7} \uAC71\uC815 \uD48D\uC120",
      tree: "\u{1F332} \uB9C8\uC74C \uB098\uBB34"
    };
    const hasEligibleTest = (testHistory2 || []).some(
      (h) => ["PHQ9", "GAD7", "BURNOUT", "DASS21"].includes(h.test_type)
    );
    if (!hasEligibleTest) return null;
    async function loadPlan() {
      if (plan) {
        setExpanded((e) => !e);
        return;
      }
      setLoading(true);
      setExpanded(true);
      try {
        const r = await fetch("/api/test/cbt-plan", { headers: api._authHeader() });
        const d = await r.json();
        if (d.success) setPlan(d);
      } catch {
      }
      setLoading(false);
    }
    function toggleWeekDone(week) {
      setDoneWeeks((prev) => {
        const next = prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week];
        localStorage.setItem("cbt_done_weeks", JSON.stringify(next));
        return next;
      });
    }
    const completedCount = doneWeeks.filter((w) => w >= 1 && w <= 8).length;
    const progress = Math.round(completedCount / 8 * 100);
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-emerald-200 overflow-hidden mb-4 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: loadPlan, className: "w-full flex items-center justify-between p-4 hover:bg-emerald-50 transition" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F4C5}"), /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-emerald-800 text-sm" }, t("\uB9DE\uCDA4 8\uC8FC \uC790\uAE30\uAD00\uB9AC \uD50C\uB79C", "Personalized 8-Week Self-Care Plan")), plan ? /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-600 mt-0.5" }, completedCount, "/", t("8\uC8FC \uC9C4\uD589 \uC911", "wks done"), " \xB7 ", progress, "% ", t("\uC644\uB8CC", "complete")) : /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-0.5" }, t("\uAC80\uC0AC \uACB0\uACFC \uAE30\uBC18 AI \uB9DE\uCDA4 8\uC8FC \uD50C\uB79C", "AI-personalized 8-week plan based on your results")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, plan && /* @__PURE__ */ React.createElement("div", { className: "w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-emerald-400 rounded-full transition-all", style: { width: `${progress}%` } })), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-sm" }, expanded ? "\u25B2" : "\u25BC"))), expanded && /* @__PURE__ */ React.createElement("div", { className: "border-t border-emerald-100" }, loading && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center py-8 gap-2 text-emerald-600" }, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, t("AI\uAC00 \uB9DE\uCDA4 \uD50C\uB79C\uC744 \uC0DD\uC131 \uC911\uC774\uC5D0\uC694...", "AI is generating your personalized plan..."))), plan && !loading && /* @__PURE__ */ React.createElement(React.Fragment, null, plan.summary && /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 bg-emerald-50 border-b border-emerald-100" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-700 leading-relaxed mb-2" }, plan.summary), plan.scores && Object.keys(plan.scores).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, Object.entries(plan.scores).map(([type, score]) => {
      const cMap = { PHQ9: "#0EA5E9", GAD7: "#8B5CF6", BURNOUT: "#F97316", DASS21: "#EC4899" };
      const nMap = lang === "en" ? { PHQ9: "Depression", GAD7: "Anxiety", BURNOUT: "Burnout", DASS21: "Stress" } : { PHQ9: "\uC6B0\uC6B8", GAD7: "\uBD88\uC548", BURNOUT: "\uBC88\uC544\uC6C3", DASS21: "\uC2A4\uD2B8\uB808\uC2A4" };
      const c = cMap[type] || "#6B7280";
      return /* @__PURE__ */ React.createElement("span", { key: type, style: { background: `${c}18`, border: `1px solid ${c}35`, borderRadius: 6, padding: "2px 7px", fontSize: 10, color: c, fontWeight: 700 } }, nMap[type] || type, " ", score, t("\uC810", "pts"));
    }))), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-50" }, (plan.plan || []).map((wk) => {
      const done = doneWeeks.includes(wk.week);
      const isOpen = expandedWeek === wk.week;
      return /* @__PURE__ */ React.createElement("div", { key: wk.week, className: `transition ${done ? "bg-emerald-50" : "bg-white"}` }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setExpandedWeek(isOpen ? null : wk.week),
          className: "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
        },
        /* @__PURE__ */ React.createElement("div", { className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-emerald-400 text-white" : "bg-gray-100 text-gray-500"}` }, done ? "\u2713" : wk.week),
        /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: `font-semibold text-sm ${done ? "text-emerald-700 line-through opacity-70" : "text-gray-800"}` }, wk.title), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 truncate" }, wk.theme)),
        /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 text-xs shrink-0" }, isOpen ? "\u25B2" : "\u25BC")
      ), isOpen && /* @__PURE__ */ React.createElement("div", { className: "px-4 pb-4 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 rounded-xl px-3 py-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-blue-700 mb-0.5" }, t("\uB9E4\uC77C \uC2E4\uCC9C", "Daily Practice")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-blue-800" }, wk.practice)), wk.game && GAME_NAMES[wk.game] && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onPlay && onPlay(wk.game),
          className: "w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl px-3 py-2 text-left transition"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-emerald-700 mb-0.5" }, t("\uCD94\uCC9C \uAC8C\uC784", "Recommended Game")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-400" }, "\u25B6 ", t("\uC2DC\uC791", "Start"))),
        /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-800" }, GAME_NAMES[wk.game]),
        /* @__PURE__ */ React.createElement("div", { className: "text-xs text-emerald-500 mt-0.5 opacity-70" }, t(`\uAC80\uC0AC \uACB0\uACFC \uAE30\uBC18 \xB7 ${wk.week}\uC8FC\uCC28 \uB9DE\uCDA4`, `Based on results \xB7 Week ${wk.week}`))
      ), wk.tip && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 italic px-1" }, "\u{1F49A} ", wk.tip), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => toggleWeekDone(wk.week),
          className: `w-full mt-1 py-2 rounded-xl text-xs font-bold transition ${done ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-emerald-500 text-white hover:bg-emerald-600"}`
        },
        done ? t("\u21A9 \uC644\uB8CC \uCDE8\uC18C", "\u21A9 Undo") : t("\u2705 \uC774\uBC88 \uC8FC \uC644\uB8CC", "\u2705 Complete Week")
      )));
    })), progress === 100 && /* @__PURE__ */ React.createElement("div", { className: "px-4 py-4 bg-emerald-500 text-white text-center text-sm font-bold" }, t("\u{1F389} 8\uC8FC \uD50C\uB79C \uC644\uC8FC! \uAFB8\uC900\uD55C \uC2E4\uCC9C\uC774 \uBE5B\uB0AC\uC5B4\uC694!", "\u{1F389} 8-Week Plan Complete! Your consistency paid off!")))));
  }
  function TrendSparkline({ data, predicted, testType }) {
    if (!data || data.length < 2) return null;
    const allS = [...data.map((d) => d.score), predicted];
    const maxS = Math.max(...allS, 10);
    const minS = Math.max(0, Math.min(...allS) - 5);
    const rng = maxS - minS || 10;
    const W = 255, H = 60, LX = 28, TY = 8;
    const cols = { PHQ9: "#0EA5E9", GAD7: "#8B5CF6", BURNOUT: "#F97316" };
    const col = cols[testType] || "#0EA5E9";
    const toX = (i) => LX + i / data.length * W;
    const toY = (s) => TY + (maxS - s) / rng * H;
    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.score), s: d.score, date: d.performed_at }));
    const predX = toX(data.length), predY = toY(predicted);
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return React.createElement(
      "svg",
      { viewBox: "0 0 300 88", width: "100%", height: "80", style: { display: "block", marginTop: 8, marginBottom: 2 } },
      [0.25, 0.5, 0.75].map(
        (t2) => React.createElement("line", { key: t2, x1: LX, x2: LX + W + 18, y1: TY + t2 * H, y2: TY + t2 * H, stroke: "#E0F2FE", strokeWidth: 1 })
      ),
      React.createElement("path", { d: pathD, fill: "none", stroke: col, strokeWidth: "2.5", strokeLinejoin: "round" }),
      React.createElement("line", {
        x1: pts[pts.length - 1].x,
        y1: pts[pts.length - 1].y,
        x2: predX,
        y2: predY,
        stroke: col,
        strokeWidth: "1.5",
        strokeDasharray: "4,3",
        opacity: "0.5"
      }),
      pts.map(
        (p, i) => React.createElement(
          React.Fragment,
          { key: i },
          React.createElement("circle", { cx: p.x, cy: p.y, r: 4, fill: col }),
          React.createElement("text", { x: p.x, y: p.y - 8, textAnchor: "middle", fontSize: 9, fill: "#475569" }, p.s),
          (i === 0 || i === pts.length - 1) && React.createElement("text", { x: p.x, y: 86, textAnchor: "middle", fontSize: 8, fill: "#94A3B8" }, p.date.slice(5, 10))
        )
      ),
      React.createElement("circle", { cx: predX, cy: predY, r: 5, fill: "white", stroke: col, strokeWidth: 2, opacity: "0.8" }),
      React.createElement("text", { x: predX, y: predY - 9, textAnchor: "middle", fontSize: 9, fill: col, fontWeight: "700" }, predicted + "?"),
      React.createElement("text", { x: predX, y: 86, textAnchor: "middle", fontSize: 8, fill: col, opacity: "0.8" }, "\uC608\uCE21")
    );
  }
  function TrendPredictionCard({ testType, onStartTest }) {
    const [pred, setPred] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const labelMap = { PHQ9: "PHQ-9 \uC6B0\uC6B8", GAD7: "GAD-7 \uBD88\uC548", BURNOUT: "\uBC88\uC544\uC6C3" };
    const emojiMap = { PHQ9: "\u{1F614}", GAD7: "\u{1F630}", BURNOUT: "\u{1F525}" };
    async function load() {
      if (pred || loading) {
        setExpanded((e) => !e);
        return;
      }
      setLoading(true);
      setExpanded(true);
      try {
        const r = await fetch(`/api/test/trend-prediction?type=${testType}`, { headers: api._authHeader() });
        const d = await r.json();
        if (d.success) setPred(d);
      } catch {
      }
      setLoading(false);
    }
    const trendColor = (pred == null ? void 0 : pred.trend) === "\uD638\uC804" ? "#16a34a" : (pred == null ? void 0 : pred.trend) === "\uC545\uD654" ? "#dc2626" : "#6b7280";
    const trendEmoji = (pred == null ? void 0 : pred.trend) === "\uD638\uC804" ? "\u{1F4C9}" : (pred == null ? void 0 : pred.trend) === "\uC545\uD654" ? "\u{1F4C8}" : "\u27A1\uFE0F";
    return /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 mb-4" }, /* @__PURE__ */ React.createElement("button", { onClick: load, className: "w-full text-left flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, emojiMap[testType]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-sky-800" }, labelMap[testType], " \uD2B8\uB80C\uB4DC \uC608\uCE21"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-sky-500" }, "\uC9C0\uAE08\uAE4C\uC9C0\uC758 \uBCC0\uD654 \uD750\uB984\uC73C\uB85C \uB2E4\uC74C \uC0C1\uD0DC\uB97C \uC608\uCE21\uD574\uC694"))), /* @__PURE__ */ React.createElement("span", { className: "text-sky-400 text-xs" }, expanded ? "\u25B2" : "\u25BC")), expanded && /* @__PURE__ */ React.createElement("div", { className: "mt-3 pt-3 border-t border-sky-100" }, loading && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-sky-400 text-center py-2" }, "\uC608\uCE21 \uBD84\uC11D \uC911..."), pred && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "\uC608\uCE21 \uC810\uC218"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-black", style: { color: trendColor } }, pred.predicted)), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold", style: { color: trendColor } }, trendEmoji, " ", pred.trend, " \uCD94\uC138 \xB7 ", pred.diffText), pred.comment && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-1 leading-relaxed" }, pred.comment))), /* @__PURE__ */ React.createElement(TrendSparkline, { data: pred.data, predicted: pred.predicted, testType }), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onStartTest,
        className: "w-full mt-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition"
      },
      "\u{1F4CB} ",
      labelMap[testType],
      " \uC7AC\uAC80\uC0AC\uD558\uAE30"
    ))));
  }
  function ShareResultButton({ text, testLabel, scoreText, levelText, colorHex }) {
    async function shareAsImage() {
      var _a2;
      try {
        const W = 800, H = 450;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, colorHex || "#1B4332");
        bg.addColorStop(1, "#2D6A4F");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.beginPath();
        const [cx, cy, cw, ch, cr] = [40, 40, W - 80, H - 80, 20];
        ctx.moveTo(cx + cr, cy);
        ctx.lineTo(cx + cw - cr, cy);
        ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + cr);
        ctx.lineTo(cx + cw, cy + ch - cr);
        ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - cr, cy + ch);
        ctx.lineTo(cx + cr, cy + ch);
        ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - cr);
        ctx.lineTo(cx, cy + cr);
        ctx.quadraticCurveTo(cx, cy, cx + cr, cy);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.90)";
        ctx.fillText("\uB9C8\uC74C\uD480", 72, 108);
        ctx.font = '20px "Noto Sans KR", sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(testLabel || "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC", 72, 150);
        ctx.font = 'bold 80px "Noto Sans KR", sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(scoreText || "", 72, 265);
        if (levelText) {
          ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(levelText, 72, 315);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(72, 345);
        ctx.lineTo(W - 72, 345);
        ctx.stroke();
        ctx.font = '16px "Noto Sans KR", sans-serif';
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(t("maumful.com  |  AI \uB9C8\uC74C \uC0C1\uB2F4 \uD50C\uB7AB\uD3FC", "maumful.com  |  AI Mental Wellness Platform"), 72, 378);
        await new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            var _a3;
            if (!blob) {
              resolve();
              return;
            }
            if (navigator.share && ((_a3 = navigator.canShare) == null ? void 0 : _a3.call(navigator, { files: [new File([blob], "x.png", { type: "image/png" })] }))) {
              try {
                await navigator.share({ title: t("\uB9C8\uC74C\uD480 \uAC80\uC0AC \uACB0\uACFC", "Maumful Result"), files: [new File([blob], "maumful-result.png", { type: "image/png" })], text });
                resolve();
                return;
              } catch {
              }
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "maumful-result.png";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1e3);
            resolve();
          }, "image/png");
        });
      } catch {
        if (navigator.share) navigator.share({ title: t("\uB9C8\uC74C\uD480 \uAC80\uC0AC \uACB0\uACFC", "Maumful Result"), text }).catch(() => {
        });
        else (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(text).then(() => alert("\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB410\uC5B4\uC694!")).catch(() => {
        });
      }
    }
    function shareText() {
      var _a2;
      if (navigator.share) navigator.share({ title: t("\uB9C8\uC74C\uD480 \uAC80\uC0AC \uACB0\uACFC", "Maumful Result"), text }).catch(() => {
      });
      else (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(text).then(() => alert(t("\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB410\uC5B4\uC694!", "Copied to clipboard!"))).catch(() => {
      });
    }
    return /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex justify-end gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: shareAsImage,
        className: "flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition border border-gray-200 hover:border-emerald-300"
      },
      "\u{1F5BC}\uFE0F ",
      t("\uCE74\uB4DC \uACF5\uC720", "Share Card")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: shareText,
        className: "flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition border border-gray-200 hover:border-emerald-300"
      },
      "\u{1F517} ",
      t("\uB9C1\uD06C \uACF5\uC720", "Share Link")
    ));
  }
  function AiAnalysisBox({ aiKey, onRun }) {
    const text = aiAnalysis[aiKey] || "";
    const loading = aiLoading[aiKey] || false;
    const error = aiError[aiKey] || "";
    const done = !loading && text.length > 0;
    const isFree = !isLoggedIn || credits <= 0;
    const limit = isFree ? AI_LIMIT_FREE : null;
    const remainingFree = limit != null ? Math.max(0, limit - aiChatUsed) : Infinity;
    if (error === "UPGRADE_REQUIRED") {
      return /* @__PURE__ */ React.createElement("div", { className: "mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-amber-800 text-sm mb-1" }, t("\uBB34\uB8CC AI \uBD84\uC11D \uD69F\uC218\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4", "You've used all your free AI analyses")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700 mb-3" }, t(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uBB34\uB8CC \uD50C\uB79C\uC740 AI \uC2E4\uC2DC\uAC04 \uBD84\uC11D\uC744 ", /* @__PURE__ */ React.createElement("strong", null, AI_LIMIT_FREE, "\uD68C"), "\uAE4C\uC9C0 \uC81C\uACF5\uD569\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC720\uB8CC \uD50C\uB79C\uC73C\uB85C \uC5C5\uADF8\uB808\uC774\uB4DC\uD558\uBA74 ", /* @__PURE__ */ React.createElement("strong", null, "\uBB34\uC81C\uD55C"), "\uC73C\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "The free plan includes ", /* @__PURE__ */ React.createElement("strong", null, AI_LIMIT_FREE), " AI analyses.", /* @__PURE__ */ React.createElement("br", null), "Upgrade to a paid plan for ", /* @__PURE__ */ React.createElement("strong", null, "unlimited"), " access."))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowChargeView(true), className: "bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow" }, "\u{1F48E} ", t("\uD50C\uB79C \uC5C5\uADF8\uB808\uC774\uB4DC", "Upgrade Plan"))))));
    }
    const showButton = !text && !loading && !error;
    return /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, showButton && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onRun,
        className: "flex items-center gap-2 bg-gradient-to-r from-violet-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-violet-700 hover:to-green-700 transition shadow"
      },
      "\u2728 ",
      t("AI \uC2E4\uC2DC\uAC04 \uBD84\uC11D", "AI Live Analysis")
    ), isFree && /* @__PURE__ */ React.createElement("span", { className: `text-xs px-2.5 py-1 rounded-full font-semibold ${remainingFree <= 1 ? "bg-red-100 text-red-700" : remainingFree <= 3 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}` }, t(`\uBB34\uB8CC ${remainingFree}\uD68C \uB0A8\uC74C`, `${remainingFree} free left`))), loading && /* @__PURE__ */ React.createElement("div", { className: "bg-violet-50 border border-violet-200 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-violet-500 rounded-full animate-bounce", style: { animationDelay: "0ms" } }), /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-violet-500 rounded-full animate-bounce", style: { animationDelay: "150ms" } }), /* @__PURE__ */ React.createElement("div", { className: "w-2 h-2 bg-violet-500 rounded-full animate-bounce", style: { animationDelay: "300ms" } }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-violet-600 font-semibold" }, t("AI\uAC00 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uBD84\uC11D \uC911...", "AI is analyzing..."))), text && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-violet-800 whitespace-pre-wrap leading-relaxed" }, text, /* @__PURE__ */ React.createElement("span", { className: "inline-block w-1 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle" }))), done && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-violet-50 to-green-50 border border-violet-200 rounded-xl p-4 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u2728"), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-violet-700" }, t("AI \uC2E4\uC2DC\uAC04 \uBD84\uC11D \uACB0\uACFC", "AI Live Analysis"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setAiAnalysis((p) => ({ ...p, [aiKey]: "" })), className: "text-xs text-violet-400 hover:text-violet-600" }, t("\uB2E4\uC2DC \uBD84\uC11D", "Re-analyze"))), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" }, text)), error && error !== "UPGRADE_REQUIRED" && /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-red-600 mb-1" }, "\u26A0\uFE0F ", t("\uC624\uB958", "Error")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-700" }, error), /* @__PURE__ */ React.createElement("button", { onClick: onRun, className: "mt-2 text-xs text-red-600 underline hover:text-red-800" }, t("\uB2E4\uC2DC \uC2DC\uB3C4", "Retry"))));
  }
  function generateSctRecommendation(cat, nums) {
    const responses = nums.map((n) => {
      var _a2;
      return {
        question: ((_a2 = sdriCompletionQ.find((q) => q.num === Number(n))) == null ? void 0 : _a2.prompt) || n,
        answer: srciResponses[n] || "(\uBBF8\uC751\uB2F5)"
      };
    });
    const allText = responses.map((r) => r.answer).join(" ").toLowerCase();
    let analysis = "";
    let recommendations = [];
    if (counselingType === "biblical") {
      analysis = generateBiblicalSctAnalysis(cat, allText);
      recommendations = generateBiblicalSctRecommendations(cat, allText);
    } else {
      analysis = generatePsychologicalSctAnalysis(cat, allText);
      recommendations = generatePsychologicalSctRecommendations(allText);
    }
    const finalSummary = analysis + (recommendations.length > 0 ? "\n\n[\uAD8C\uC7A5\uC0AC\uD56D]\n" + recommendations.join("\n") : "");
    setTimeout(() => {
      setSctSummaries((p) => ({ ...p, [cat]: finalSummary }));
      setLoadingSummary((p) => ({ ...p, [cat]: false }));
    }, 800);
  }
  function generatePsychologicalSctAnalysis(cat, allText) {
    let analysis = "";
    if (cat.includes("\uC5B4\uBA38\uB2C8")) {
      if (allText.includes("\uC88B") || allText.includes("\uC0AC\uB791") || allText.includes("\uB530\uB73B")) {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uAC00 \uAE0D\uC815\uC801\uC73C\uB85C \uD615\uC131\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC560\uCC29 \uAD00\uACC4\uAC00 \uC548\uC815\uC801\uC774\uBA70, \uC774\uB294 \uB300\uC778\uAD00\uACC4 \uD615\uC131\uC758 \uAE0D\uC815\uC801 \uAE30\uBC18\uC774 \uB429\uB2C8\uB2E4.";
      } else if (allText.includes("\uD798\uB4E4") || allText.includes("\uC5B4\uB835") || allText.includes("\uAC08\uB4F1")) {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uC5D0\uC11C \uC77C\uBD80 \uC5B4\uB824\uC6C0\uC774 \uAD00\uCC30\uB429\uB2C8\uB2E4. \uC774\uB294 \uC815\uC11C\uC801 \uC9C0\uC9C0 \uCCB4\uACC4 \uAC15\uD654\uAC00 \uD544\uC694\uD568\uC744 \uC2DC\uC0AC\uD569\uB2C8\uB2E4. \uC0C1\uB2F4\uC744 \uD1B5\uD55C \uAD00\uACC4 \uAC1C\uC120\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801\uC778 \uAC10\uC815\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC560\uCC29 \uD328\uD134\uC744 \uD0D0\uC0C9\uD558\uACE0 \uAE0D\uC815\uC801 \uCE21\uBA74\uC744 \uAC15\uD654\uD558\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uC544\uBC84\uC9C0")) {
      if (allText.includes("\uC874\uACBD") || allText.includes("\uC88B") || allText.includes("\uB530\uB73B")) {
        analysis = "\uC544\uBC84\uC9C0\uC640\uC758 \uAD00\uACC4\uAC00 \uAE0D\uC815\uC801\uC785\uB2C8\uB2E4. \uAD8C\uC704 \uC778\uBB3C\uC5D0 \uB300\uD55C \uAC74\uAC15\uD55C \uD0DC\uB3C4\uAC00 \uD615\uC131\uB418\uC5B4 \uC788\uC73C\uBA70, \uC774\uB294 \uC0AC\uD68C\uC801\uC751\uC5D0 \uAE0D\uC815\uC801 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4.";
      } else if (allText.includes("\uBB34\uC12D") || allText.includes("\uC5C4\uACA9") || allText.includes("\uAC70\uB9AC")) {
        analysis = "\uC544\uBC84\uC9C0\uC640\uC758 \uAD00\uACC4\uC5D0\uC11C \uC2EC\uB9AC\uC801 \uAC70\uB9AC\uAC10\uC774 \uB290\uAEF4\uC9D1\uB2C8\uB2E4. \uAD8C\uC704\uC5D0 \uB300\uD55C \uC591\uAC00\uAC10\uC815\uC774 \uC788\uC744 \uC218 \uC788\uC73C\uBA70, \uC774\uB294 \uC0C1\uB2F4\uC744 \uD1B5\uD574 \uD0D0\uC0C9\uD560 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uC544\uBC84\uC9C0 \uC0C1\uC5D0 \uB300\uD55C \uB2E4\uCE35\uC801\uC778 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uAD8C\uC704 \uAD00\uACC4\uC5D0 \uB300\uD55C \uC774\uD574\uB97C \uC2EC\uD654\uD558\uB294 \uAC83\uC774 \uC131\uC7A5\uC5D0 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uAC00\uC871")) {
      if (allText.includes("\uD654\uBAA9") || allText.includes("\uD589\uBCF5") || allText.includes("\uC0AC\uB791")) {
        analysis = "\uAC00\uC871 \uAD00\uACC4\uAC00 \uC804\uBC18\uC801\uC73C\uB85C \uAE0D\uC815\uC801\uC785\uB2C8\uB2E4. \uC548\uC815\uC801\uC778 \uAC00\uC871 \uAE30\uBC18\uC740 \uC2EC\uB9AC\uC801 \uC548\uB155\uAC10\uC758 \uC911\uC694\uD55C \uC790\uC6D0\uC785\uB2C8\uB2E4.";
      } else if (allText.includes("\uAC08\uB4F1") || allText.includes("\uD798\uB4E4") || allText.includes("\uBD88\uD654")) {
        analysis = "\uAC00\uC871 \uB0B4 \uC5ED\uB3D9\uC5D0 \uC5B4\uB824\uC6C0\uC774 \uC788\uB294 \uAC83\uC73C\uB85C \uBCF4\uC785\uB2C8\uB2E4. \uAC00\uC871 \uC0C1\uB2F4\uC774\uB098 \uC758\uC0AC\uC18C\uD1B5 \uAC1C\uC120\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uAC00\uC871 \uAD00\uACC4\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uAC00\uC871 \uB0B4 \uC790\uC2E0\uC758 \uC5ED\uD560\uACFC \uC704\uCE58\uB97C \uC7AC\uC815\uB9BD\uD558\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uB450\uB824\uC6C0")) {
      if (allText.includes("\uC5C6") || allText.includes("\uAD1C\uCC2E")) {
        analysis = "\uBD88\uC548 \uC218\uC900\uC774 \uB0AE\uACE0 \uC2EC\uB9AC\uC801 \uC548\uC815\uAC10\uC774 \uC591\uD638\uD569\uB2C8\uB2E4. \uD604\uC7AC\uC758 \uB300\uCC98 \uBC29\uC2DD\uC744 \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
      } else if (allText.includes("\uC2E4\uD328") || allText.includes("\uAC70\uC808") || allText.includes("\uD63C\uC790")) {
        analysis = "\uD2B9\uC815 \uC601\uC5ED\uC5D0 \uB300\uD55C \uBD88\uC548\uAC10\uC774 \uAD00\uCC30\uB429\uB2C8\uB2E4. \uC774\uB294 \uC790\uC874\uAC10\uACFC \uC5F0\uACB0\uB420 \uC218 \uC788\uC73C\uBA70, \uC778\uC9C0\uD589\uB3D9\uCE58\uB8CC\uC801 \uC811\uADFC\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uB2E4\uC591\uD55C \uB450\uB824\uC6C0 \uC694\uC778\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uBD88\uC548 \uAD00\uB9AC \uAE30\uBC95\uC744 \uD559\uC2B5\uD558\uACE0 \uB300\uCC98 \uC790\uC6D0\uC744 \uAC15\uD654\uD558\uB294 \uAC83\uC774 \uAD8C\uC7A5\uB429\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uC8C4\uCC45\uAC10")) {
      if (allText.includes("\uC5C6") || allText.includes("\uD6C4\uD68C")) {
        analysis = "\uC8C4\uCC45\uAC10\uC774 \uC801\uC808\uD55C \uC218\uC900\uC73C\uB85C \uAD00\uB9AC\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC790\uAE30 \uC131\uCC30 \uB2A5\uB825\uC774 \uC788\uC73C\uB098 \uACFC\uB3C4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
      } else if (allText.includes("\uB9CE") || allText.includes("\uBBF8\uC548") || allText.includes("\uC798\uBABB")) {
        analysis = "\uC8C4\uCC45\uAC10 \uC218\uC900\uC774 \uB2E4\uC18C \uB192\uAC8C \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC790\uAE30 \uBE44\uB09C \uD328\uD134\uC744 \uD0D0\uC0C9\uD558\uACE0 \uC790\uAE30 \uC6A9\uC11C\uB97C \uC5F0\uC2B5\uD558\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uC8C4\uCC45\uAC10\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uACFC\uAC70 \uACBD\uD5D8\uC744 \uC7AC\uD574\uC11D\uD558\uACE0 \uC218\uC6A9\uD558\uB294 \uACFC\uC815\uC774 \uD544\uC694\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uB2A5\uB825")) {
      if (allText.includes("\uC798") || allText.includes("\uC790\uC2E0") || allText.includes("\uB2A5\uB825")) {
        analysis = "\uC790\uAE30 \uD6A8\uB2A5\uAC10\uC774 \uC591\uD638\uD569\uB2C8\uB2E4. \uC790\uC2E0\uC758 \uB2A5\uB825\uC5D0 \uB300\uD55C \uAE0D\uC815\uC801 \uC778\uC2DD\uC740 \uBAA9\uD45C \uB2EC\uC131\uC758 \uC911\uC694\uD55C \uC790\uC6D0\uC785\uB2C8\uB2E4.";
      } else if (allText.includes("\uBD80\uC871") || allText.includes("\uBABB") || allText.includes("\uC5C6")) {
        analysis = "\uC790\uAE30 \uD6A8\uB2A5\uAC10\uC774 \uB2E4\uC18C \uB0AE\uAC8C \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC791\uC740 \uC131\uACF5 \uACBD\uD5D8\uC744 \uCD95\uC801\uD558\uACE0 \uAC15\uC810\uC744 \uC7AC\uBC1C\uACAC\uD558\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uC790\uAE30 \uB2A5\uB825\uC5D0 \uB300\uD55C \uD604\uC2E4\uC801 \uD3C9\uAC00\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uAC15\uC810\uC744 \uB354\uC6B1 \uBC1C\uC804\uC2DC\uD0A4\uACE0 \uC57D\uC810\uC744 \uBCF4\uC644\uD558\uB294 \uADE0\uD615\uC801 \uC811\uADFC\uC774 \uAD8C\uC7A5\uB429\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uBBF8\uB798")) {
      if (allText.includes("\uBC1D") || allText.includes("\uD76C\uB9DD") || allText.includes("\uAE30\uB300")) {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uB099\uAD00\uC801 \uD0DC\uB3C4\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uAE0D\uC815\uC801 \uBBF8\uB798 \uC804\uB9DD\uC740 \uD604\uC7AC\uC758 \uB3D9\uAE30\uC640 \uC5D0\uB108\uC9C0\uB97C \uB192\uC785\uB2C8\uB2E4.";
      } else if (allText.includes("\uBD88\uC548") || allText.includes("\uAC71\uC815") || allText.includes("\uC5B4\uB450")) {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uBD88\uC548\uAC10\uC774 \uAD00\uCC30\uB429\uB2C8\uB2E4. \uAD6C\uCCB4\uC801 \uBAA9\uD45C \uC124\uC815\uACFC \uB2E8\uACC4\uC801 \uACC4\uD68D\uC774 \uBD88\uC548\uC744 \uAC10\uC18C\uC2DC\uD0AC \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uD604\uC2E4\uC801 \uD0DC\uB3C4\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uD76C\uB9DD\uACFC \uC900\uBE44\uB97C \uADE0\uD615\uC788\uAC8C \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uBAA9\uD45C")) {
      if (allText.includes("\uBA85\uD655") || allText.includes("\uACC4\uD68D") || allText.includes("\uAFC8")) {
        analysis = "\uBAA9\uD45C\uAC00 \uBA85\uD655\uD558\uACE0 \uB3D9\uAE30 \uC218\uC900\uC774 \uC591\uD638\uD569\uB2C8\uB2E4. \uAD6C\uCCB4\uC801 \uC2E4\uD589 \uACC4\uD68D\uC744 \uC218\uB9BD\uD558\uBA74 \uBAA9\uD45C \uB2EC\uC131 \uAC00\uB2A5\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4.";
      } else if (allText.includes("\uBAA8\uB974") || allText.includes("\uC5C6") || allText.includes("\uB9C9\uC5F0")) {
        analysis = "\uBAA9\uD45C\uAC00 \uBD88\uBA85\uD655\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4. \uC790\uAE30 \uD0D0\uC0C9\uC744 \uD1B5\uD574 \uAC00\uCE58\uAD00\uACFC \uBC29\uD5A5\uC131\uC744 \uBA85\uB8CC\uD654\uD558\uB294 \uAC83\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
      } else {
        analysis = "\uBAA9\uD45C\uC5D0 \uB300\uD55C \uD0D0\uC0C9 \uACFC\uC815\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uC591\uD55C \uAC00\uB2A5\uC131\uC744 \uC5F4\uC5B4\uB450\uACE0 \uC810\uC9C4\uC801\uC73C\uB85C \uBC29\uD5A5\uC744 \uC124\uC815\uD558\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4.";
      }
    } else {
      analysis = "\uC774 \uC601\uC5ED\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uC885\uD569\uC801\uC73C\uB85C \uBD84\uC11D\uD55C \uACB0\uACFC, \uAC1C\uC778\uC758 \uACE0\uC720\uD55C \uACBD\uD5D8\uACFC \uC778\uC2DD\uC774 \uBC18\uC601\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC0C1\uB2F4\uC744 \uD1B5\uD574 \uB354 \uAE4A\uC774 \uD0D0\uC0C9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
    }
    return analysis;
  }
  function generatePsychologicalSctRecommendations(allText) {
    const recommendations = [];
    if (allText.includes("\uD798\uB4E4") || allText.includes("\uC5B4\uB835") || allText.includes("\uAC08\uB4F1")) {
      recommendations.push("\u2022 \uC815\uAE30\uC801\uC778 \uC2EC\uB9AC \uC0C1\uB2F4\uC744 \uD1B5\uD55C \uAC10\uC815 \uD45C\uD604 \uBC0F \uD574\uC18C");
      recommendations.push("\u2022 \uC778\uC9C0\uD589\uB3D9\uCE58\uB8CC(CBT) \uAE30\uBC95\uC744 \uD1B5\uD55C \uC0AC\uACE0 \uD328\uD134 \uAC1C\uC120");
    }
    if (allText.includes("\uBD88\uC548") || allText.includes("\uAC71\uC815") || allText.includes("\uB450\uB835")) {
      recommendations.push("\u2022 \uC774\uC644 \uD6C8\uB828 \uBC0F \uB9C8\uC74C\uCC59\uAE40 \uBA85\uC0C1 \uC2E4\uCC9C");
      recommendations.push("\u2022 \uBD88\uC548 \uAD00\uB9AC \uAE30\uBC95 \uD559\uC2B5 (\uBCF5\uC2DD\uD638\uD761, \uC810\uC9C4\uC801 \uADFC\uC721 \uC774\uC644)");
    }
    if (allText.includes("\uC5C6") || allText.includes("\uBAA8\uB974")) {
      recommendations.push("\u2022 \uC790\uAE30 \uD0D0\uC0C9 \uD65C\uB3D9 \uBC0F \uAC00\uCE58\uAD00 \uBA85\uB8CC\uD654 \uC791\uC5C5");
      recommendations.push("\u2022 \uC9C4\uB85C \uC0C1\uB2F4 \uBC0F \uC2EC\uB9AC\uAC80\uC0AC\uB97C \uD1B5\uD55C \uC790\uAE30 \uC774\uD574");
    }
    if (allText.includes("\uC6B0\uC6B8") || allText.includes("\uC2AC\uD504") || allText.includes("\uC758\uC695")) {
      recommendations.push("\u2022 \uC6B0\uC6B8\uAC10 \uAD00\uB9AC\uB97C \uC704\uD55C \uD589\uB3D9 \uD65C\uC131\uD654 \uC804\uB7B5");
      recommendations.push("\u2022 \uADDC\uCE59\uC801\uC778 \uC6B4\uB3D9\uACFC \uCDA9\uBD84\uD55C \uC218\uBA74");
    }
    return recommendations;
  }
  function generateBiblicalSctAnalysis(cat, allText) {
    let analysis = "";
    if (cat.includes("\uC5B4\uBA38\uB2C8")) {
      if (allText.includes("\uC88B") || allText.includes("\uC0AC\uB791") || allText.includes("\uB530\uB73B")) {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uC5D0\uC11C \uD558\uB098\uB2D8\uC758 \uC0AC\uB791\uACFC \uB3CC\uBCF4\uC2EC\uC774 \uBC18\uC601\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. '\uC5B4\uBA38\uB2C8\uAC00 \uC790\uC2DD\uC744 \uC704\uB85C\uD568\uAC19\uC774 \uB0B4\uAC00 \uB108\uD76C\uB97C \uC704\uB85C\uD558\uB9AC\uB2C8'(\uC774\uC0AC\uC57C 66:13)\uB77C\uB294 \uB9D0\uC500\uCC98\uB7FC, \uAC74\uAC15\uD55C \uC5B4\uBA38\uB2C8\uC0C1\uC740 \uD558\uB098\uB2D8\uC758 \uC0AC\uB791\uC744 \uACBD\uD5D8\uD558\uB294 \uD1B5\uB85C\uAC00 \uB429\uB2C8\uB2E4.";
      } else if (allText.includes("\uD798\uB4E4") || allText.includes("\uC5B4\uB835") || allText.includes("\uAC08\uB4F1")) {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uC5D0\uC11C \uC5B4\uB824\uC6C0\uC774 \uC788\uC9C0\uB9CC, \uD558\uB098\uB2D8\uAED8\uC11C\uB294 '\uACE0\uC544\uC758 \uC544\uBC84\uC9C0'(\uC2DC\uD3B8 68:5)\uC774\uC2DC\uBA70 \uBAA8\uB4E0 \uAD00\uACC4\uC758 \uC0C1\uCC98\uB97C \uCE58\uC720\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC6A9\uC11C\uC640 \uD654\uD574\uC758 \uACFC\uC815\uC744 \uD1B5\uD574 \uD558\uB098\uB2D8\uC758 \uD68C\uBCF5\uC744 \uACBD\uD5D8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        analysis = "\uC5B4\uBA38\uB2C8\uC640\uC758 \uAD00\uACC4\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801\uC778 \uAC10\uC815\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC774\uB294 \uBAA8\uB4E0 \uC778\uAC04 \uAD00\uACC4\uC758 \uBD88\uC644\uC804\uD568\uC744 \uBCF4\uC5EC\uC8FC\uBA70, \uC644\uC804\uD55C \uC0AC\uB791\uC740 \uC624\uC9C1 \uD558\uB098\uB2D8 \uC548\uC5D0\uC11C\uB9CC \uBC1C\uACAC\uB429\uB2C8\uB2E4(\uC694\uD55C\uC77C\uC11C 4:19).";
      }
    } else if (cat.includes("\uC544\uBC84\uC9C0")) {
      if (allText.includes("\uC874\uACBD") || allText.includes("\uC88B") || allText.includes("\uB530\uB73B")) {
        analysis = "\uC544\uBC84\uC9C0\uC640\uC758 \uAE0D\uC815\uC801 \uAD00\uACC4\uB294 \uD558\uB298 \uC544\uBC84\uC9C0\uB97C \uC774\uD574\uD558\uB294 \uB370 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4. '\uC544\uBC84\uC9C0\uAED8\uC11C \uC790\uC2DD\uC744 \uAE0D\uD73C\uD788 \uC5EC\uAE30\uC2EC\uAC19\uC774 \uC5EC\uD638\uC640\uAED8\uC11C\uB294 \uC790\uAE30\uB97C \uACBD\uC678\uD558\uB294 \uC790\uB97C \uAE0D\uD73C\uD788 \uC5EC\uAE30\uC2DC\uB098\uB2C8'(\uC2DC\uD3B8 103:13).";
      } else if (allText.includes("\uBB34\uC12D") || allText.includes("\uC5C4\uACA9") || allText.includes("\uAC70\uB9AC")) {
        analysis = "\uC544\uBC84\uC9C0\uC640\uC758 \uAD00\uACC4\uC5D0\uC11C \uB450\uB824\uC6C0\uC774\uB098 \uAC70\uB9AC\uAC10\uC774 \uB290\uAEF4\uC9C0\uC9C0\uB9CC, \uD558\uB098\uB2D8 \uC544\uBC84\uC9C0\uB294 '\uC0AC\uB791\uC758 \uC544\uBC84\uC9C0\uC2DC\uC624 \uBAA8\uB4E0 \uC704\uB85C\uC758 \uD558\uB098\uB2D8\uC774\uC2DC\uBA70'(\uACE0\uB9B0\uB3C4\uD6C4\uC11C 1:3) \uC6B0\uB9AC\uB97C \uC644\uC804\uD788 \uBC1B\uC544\uC8FC\uC2ED\uB2C8\uB2E4. \uB545\uC758 \uC544\uBC84\uC9C0\uC758 \uBD88\uC644\uC804\uD568\uC774 \uD558\uB298 \uC544\uBC84\uC9C0\uC758 \uC644\uC804\uD55C \uC0AC\uB791\uC744 \uAC00\uB9AC\uC9C0 \uC54A\uB3C4\uB85D \uAE30\uB3C4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";
      } else {
        analysis = "\uC544\uBC84\uC9C0 \uC0C1\uC5D0 \uB300\uD55C \uB2E4\uCE35\uC801\uC778 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uD558\uB098\uB2D8\uC740 \uC644\uC804\uD55C \uC544\uBC84\uC9C0\uC774\uC2DC\uBA70, \uB545\uC758 \uC544\uBC84\uC9C0\uC640\uC758 \uAD00\uACC4\uB97C \uD1B5\uD574 \uD558\uB098\uB2D8\uC758 \uC544\uBC84\uC9C0 \uB418\uC2EC\uC744 \uB354 \uAE4A\uC774 \uC774\uD574\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uAC00\uC871")) {
      if (allText.includes("\uD654\uBAA9") || allText.includes("\uD589\uBCF5") || allText.includes("\uC0AC\uB791")) {
        analysis = "\uAC00\uC871 \uAD00\uACC4\uAC00 \uC804\uBC18\uC801\uC73C\uB85C \uAE0D\uC815\uC801\uC785\uB2C8\uB2E4. '\uBCF4\uB77C \uD615\uC81C\uAC00 \uC5F0\uD569\uD558\uC5EC \uB3D9\uAC70\uD568\uC774 \uC5B4\uCC0C \uADF8\uB9AC \uC120\uD558\uACE0 \uC544\uB984\uB2E4\uC6B4\uACE0'(\uC2DC\uD3B8 133:1). \uAC10\uC0AC\uD568\uC73C\uB85C \uC774 \uCD95\uBCF5\uC744 \uC9C0\uD0A4\uACE0 \uB354\uC6B1 \uBC1C\uC804\uC2DC\uCF1C \uB098\uAC00\uC138\uC694.";
      } else if (allText.includes("\uAC08\uB4F1") || allText.includes("\uD798\uB4E4") || allText.includes("\uBD88\uD654")) {
        analysis = "\uAC00\uC871 \uB0B4 \uC5B4\uB824\uC6C0\uC774 \uC788\uC9C0\uB9CC, '\uADF8\uB9AC\uC2A4\uB3C4\uC758 \uD3C9\uAC15\uC774 \uB108\uD76C \uB9C8\uC74C\uC744 \uC8FC\uC7A5\uD558\uAC8C \uD558\uB77C'(\uACE8\uB85C\uC0C8\uC11C 3:15). \uC6A9\uC11C\uC640 \uD654\uD574\uB294 \uC131\uACBD\uC801 \uAC00\uC871 \uD68C\uBCF5\uC758 \uD575\uC2EC\uC785\uB2C8\uB2E4. \uBA3C\uC800 \uC790\uC2E0\uC758 \uC8C4\uB97C \uC778\uC815\uD558\uACE0 \uC6A9\uC11C\uB97C \uAD6C\uD558\uB294 \uAC83\uBD80\uD130 \uC2DC\uC791\uD558\uC138\uC694.";
      } else {
        analysis = "\uAC00\uC871 \uAD00\uACC4\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uAC00\uC871\uC740 \uD558\uB098\uB2D8\uC774 \uC138\uC6B0\uC2E0 \uCCAB \uBC88\uC9F8 \uACF5\uB3D9\uCCB4\uC774\uBA70, '\uC11C\uB85C \uC0AC\uB791\uD558\uB77C'(\uC694\uD55C\uBCF5\uC74C 13:34)\uB294 \uBA85\uB839\uC774 \uAC00\uC7A5 \uBA3C\uC800 \uC2E4\uCC9C\uB418\uC5B4\uC57C \uD560 \uACF3\uC785\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uB450\uB824\uC6C0")) {
      if (allText.includes("\uC5C6") || allText.includes("\uAD1C\uCC2E")) {
        analysis = "\uB450\uB824\uC6C0\uC774 \uC801\uC740 \uAC83\uC740 \uD558\uB098\uB2D8\uC744 \uC2E0\uB8B0\uD558\uB294 \uBBFF\uC74C\uC758 \uD45C\uD604\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. '\uB450\uB824\uC6CC\uD558\uC9C0 \uB9D0\uB77C \uB0B4\uAC00 \uB108\uC640 \uD568\uAED8\uD568\uC774\uB77C'(\uC774\uC0AC\uC57C 41:10)\uB294 \uC57D\uC18D\uC744 \uACC4\uC18D \uBD99\uB4E4\uC73C\uC138\uC694.";
      } else if (allText.includes("\uC2E4\uD328") || allText.includes("\uAC70\uC808") || allText.includes("\uD63C\uC790")) {
        analysis = "\uB450\uB824\uC6C0\uC774 \uAD00\uCC30\uB418\uC9C0\uB9CC, \uC131\uACBD\uC740 '\uB450\uB824\uC6CC \uB9D0\uB77C'\uB97C 365\uBC88 \uB9D0\uC500\uD569\uB2C8\uB2E4. \uD558\uB098\uB2D8\uC740 '\uB108\uB97C \uBC84\uB9AC\uC9C0 \uC544\uB2C8\uD558\uACE0 \uB108\uB97C \uB5A0\uB098\uC9C0 \uC544\uB2C8\uD558\uC2DC\uB9AC\uB77C'(\uD788\uBE0C\uB9AC\uC11C 13:5)\uACE0 \uC57D\uC18D\uD558\uC2ED\uB2C8\uB2E4. \uB450\uB824\uC6C0\uC740 \uD558\uB098\uB2D8\uAED8 \uB9E1\uAE30\uACE0 \uB9D0\uC500 \uC548\uC5D0\uC11C \uD3C9\uC548\uC744 \uCC3E\uC73C\uC138\uC694.";
      } else {
        analysis = "\uB2E4\uC591\uD55C \uB450\uB824\uC6C0\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. '\uC644\uC804\uD55C \uC0AC\uB791\uC774 \uB450\uB824\uC6C0\uC744 \uB0B4\uCAD3\uB098\uB2C8'(\uC694\uD55C\uC77C\uC11C 4:18). \uD558\uB098\uB2D8\uC758 \uC0AC\uB791\uC744 \uB354 \uAE4A\uC774 \uACBD\uD5D8\uD560\uC218\uB85D \uB450\uB824\uC6C0\uC740 \uC904\uC5B4\uB4ED\uB2C8\uB2E4.";
      }
    } else if (cat.includes("\uC8C4\uCC45\uAC10")) {
      if (allText.includes("\uC5C6") || allText.includes("\uD6C4\uD68C")) {
        analysis = "\uC801\uC808\uD55C \uC8C4\uCC45\uAC10\uC740 \uD68C\uAC1C\uB85C \uC774\uB044\uB294 \uAC74\uAC15\uD55C \uC591\uC2EC\uC758 \uD45C\uD604\uC785\uB2C8\uB2E4. '\uC6B0\uB9AC\uAC00 \uC6B0\uB9AC \uC8C4\uB97C \uC790\uBC31\uD558\uBA74 \uADF8\uB294 \uBBF8\uC058\uC2DC\uACE0 \uC758\uB85C\uC6B0\uC0AC \uC6B0\uB9AC \uC8C4\uB97C \uC0AC\uD558\uC2DC\uBA70'(\uC694\uD55C\uC77C\uC11C 1:9).";
      } else if (allText.includes("\uB9CE") || allText.includes("\uBBF8\uC548") || allText.includes("\uC798\uBABB")) {
        analysis = "\uACFC\uB3C4\uD55C \uC8C4\uCC45\uAC10\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C '\uC815\uC8C4\uD568\uC774 \uC5C6\uB098\uB2C8'(\uB85C\uB9C8\uC11C 8:1). \uC774\uBBF8 \uC6A9\uC11C\uBC1B\uC558\uB2E4\uBA74 \uACC4\uC18D \uC8C4\uCC45\uAC10\uC5D0 \uB9E4\uC5EC \uC788\uB294 \uAC83\uC740 \uC0AC\uD0C4\uC758 \uC804\uB7B5\uC785\uB2C8\uB2E4. \uD558\uB098\uB2D8\uC758 \uC644\uC804\uD55C \uC6A9\uC11C\uB97C \uBBFF\uACE0 \uBC1B\uC544\uB4E4\uC774\uC138\uC694.";
      } else {
        analysis = "\uC8C4\uCC45\uAC10\uC5D0 \uB300\uD55C \uBCF5\uD569\uC801 \uC778\uC2DD\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC131\uACBD\uC801\uC73C\uB85C \uC8C4\uB294 \uC778\uC815\uD558\uB418, \uADF8\uB9AC\uC2A4\uB3C4\uC758 \uC2ED\uC790\uAC00\uB97C \uD1B5\uD574 \uC774\uBBF8 \uC6A9\uC11C\uBC1B\uC558\uC74C\uC744 \uAE30\uC5B5\uD558\uC138\uC694(\uC5D0\uBCA0\uC18C\uC11C 1:7).";
      }
    } else if (cat.includes("\uB2A5\uB825")) {
      if (allText.includes("\uC798") || allText.includes("\uC790\uC2E0") || allText.includes("\uB2A5\uB825")) {
        analysis = "\uC790\uC2E0\uC758 \uB2A5\uB825\uC744 \uAE0D\uC815\uC801\uC73C\uB85C \uC778\uC2DD\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC774\uB294 \uD558\uB098\uB2D8\uC774 \uC8FC\uC2E0 \uC740\uC0AC\uB97C \uC798 \uD65C\uC6A9\uD558\uB294 \uAC83\uC785\uB2C8\uB2E4. '\uB0B4\uAC8C \uB2A5\uB825 \uC8FC\uC2DC\uB294 \uC790 \uC548\uC5D0\uC11C \uB0B4\uAC00 \uBAA8\uB4E0 \uAC83\uC744 \uD560 \uC218 \uC788\uB290\uB2C8\uB77C'(\uBE4C\uB9BD\uBCF4\uC11C 4:13).";
      } else if (allText.includes("\uBD80\uC871") || allText.includes("\uBABB") || allText.includes("\uC5C6")) {
        analysis = "\uC790\uC2E0\uC758 \uBD80\uC871\uD568\uC744 \uC778\uC2DD\uD558\uB294 \uAC83\uC740 \uACB8\uC190\uC758 \uC2DC\uC791\uC785\uB2C8\uB2E4. '\uB0B4 \uC740\uD61C\uAC00 \uB124\uAC8C \uC871\uD558\uB3C4\uB2E4 \uC774\uB294 \uB0B4 \uB2A5\uB825\uC774 \uC57D\uD55C \uB370\uC11C \uC628\uC804\uD558\uC5EC\uC9D0\uC774\uB77C'(\uACE0\uB9B0\uB3C4\uD6C4\uC11C 12:9). \uD558\uB098\uB2D8\uC740 \uC57D\uD55C \uC790\uB97C \uD1B5\uD574 \uC77C\uD558\uC2ED\uB2C8\uB2E4.";
      } else {
        analysis = "\uC790\uAE30 \uB2A5\uB825\uC5D0 \uB300\uD55C \uD604\uC2E4\uC801 \uD3C9\uAC00\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uC131\uACBD\uC740 '\uC790\uAE30\uB97C \uB0AE\uCD94\uB294 \uC790\uB294 \uB192\uC544\uC9C0\uACE0'(\uB9C8\uD0DC\uBCF5\uC74C 23:12)\uB77C\uACE0 \uB9D0\uC500\uD569\uB2C8\uB2E4. \uACB8\uC190\uACFC \uC790\uC2E0\uAC10\uC758 \uADE0\uD615\uC744 \uC720\uC9C0\uD558\uC138\uC694.";
      }
    } else if (cat.includes("\uBBF8\uB798")) {
      if (allText.includes("\uBC1D") || allText.includes("\uD76C\uB9DD") || allText.includes("\uAE30\uB300")) {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uD76C\uB9DD\uC801 \uD0DC\uB3C4\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. '\uB108\uD76C\uB97C \uD5A5\uD55C \uB098\uC758 \uC0DD\uAC01\uC744 \uC544\uB098\uB2C8 \uD3C9\uC548\uC774\uC694 \uC7AC\uC559\uC774 \uC544\uB2C8\uB2C8\uB77C \uB108\uD76C\uC5D0\uAC8C \uBBF8\uB798\uC640 \uD76C\uB9DD\uC744 \uC8FC\uB294 \uAC83\uC774\uB2C8\uB77C'(\uC608\uB808\uBBF8\uC57C 29:11).";
      } else if (allText.includes("\uBD88\uC548") || allText.includes("\uAC71\uC815") || allText.includes("\uC5B4\uB450")) {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uBD88\uC548\uC774 \uAD00\uCC30\uB429\uB2C8\uB2E4. '\uB0B4\uC77C \uC77C\uC744 \uC704\uD558\uC5EC \uC5FC\uB824\uD558\uC9C0 \uB9D0\uB77C... \uD55C \uB0A0\uC758 \uAD34\uB85C\uC6C0\uC740 \uADF8 \uB0A0\uB85C \uC871\uD558\uB2C8\uB77C'(\uB9C8\uD0DC\uBCF5\uC74C 6:34). \uD558\uB098\uB2D8\uC774 \uC778\uB3C4\uD558\uC2DC\uB294 \uBBF8\uB798\uB97C \uC2E0\uB8B0\uD558\uC138\uC694.";
      } else {
        analysis = "\uBBF8\uB798\uC5D0 \uB300\uD55C \uD604\uC2E4\uC801 \uD0DC\uB3C4\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. '\uC0AC\uB78C\uC774 \uB9C8\uC74C\uC73C\uB85C \uC790\uAE30\uC758 \uAE38\uC744 \uACC4\uD68D\uD560\uC9C0\uB77C\uB3C4 \uADF8\uC758 \uAC78\uC74C\uC744 \uC778\uB3C4\uD558\uC2DC\uB294 \uC774\uB294 \uC5EC\uD638\uC640\uC2DC\uB2C8\uB77C'(\uC7A0\uC5B8 16:9).";
      }
    } else if (cat.includes("\uBAA9\uD45C")) {
      if (allText.includes("\uBA85\uD655") || allText.includes("\uACC4\uD68D") || allText.includes("\uAFC8")) {
        analysis = "\uBAA9\uD45C\uAC00 \uBA85\uD655\uD55C \uAC83\uC740 \uC88B\uC740 \uCCAD\uC9C0\uAE30\uC758 \uBAA8\uC2B5\uC785\uB2C8\uB2E4. '\uB124\uAC00 \uD558\uB294 \uC77C\uC744 \uC5EC\uD638\uC640\uAED8 \uB9E1\uAE30\uB77C \uADF8\uB9AC\uD558\uBA74 \uB124\uAC00 \uACBD\uC601\uD558\uB294 \uAC83\uC774 \uC774\uB8E8\uC5B4\uC9C0\uB9AC\uB77C'(\uC7A0\uC5B8 16:3). \uD558\uB098\uB2D8\uC758 \uB73B \uC548\uC5D0\uC11C \uBAA9\uD45C\uB97C \uCD94\uAD6C\uD558\uC138\uC694.";
      } else if (allText.includes("\uBAA8\uB974") || allText.includes("\uC5C6") || allText.includes("\uB9C9\uC5F0")) {
        analysis = "\uBAA9\uD45C\uAC00 \uBD88\uBA85\uD655\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4. '\uB108\uD76C\uB294 \uBA3C\uC800 \uADF8\uC758 \uB098\uB77C\uC640 \uADF8\uC758 \uC758\uB97C \uAD6C\uD558\uB77C \uADF8\uB9AC\uD558\uBA74 \uC774 \uBAA8\uB4E0 \uAC83\uC744 \uB108\uD76C\uC5D0\uAC8C \uB354\uD558\uC2DC\uB9AC\uB77C'(\uB9C8\uD0DC\uBCF5\uC74C 6:33). \uD558\uB098\uB2D8\uC758 \uB73B\uC744 \uAD6C\uD558\uB294 \uAE30\uB3C4\uBD80\uD130 \uC2DC\uC791\uD558\uC138\uC694.";
      } else {
        analysis = "\uBAA9\uD45C\uC5D0 \uB300\uD55C \uD0D0\uC0C9 \uACFC\uC815\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. '\uB108\uB294 \uB9C8\uC74C\uC744 \uB2E4\uD558\uC5EC \uC5EC\uD638\uC640\uB97C \uC2E0\uB8B0\uD558\uACE0 \uB124 \uBA85\uCCA0\uC744 \uC758\uC9C0\uD558\uC9C0 \uB9D0\uB77C \uB108\uB294 \uBC94\uC0AC\uC5D0 \uADF8\uB97C \uC778\uC815\uD558\uB77C \uADF8\uB9AC\uD558\uBA74 \uB124 \uAE38\uC744 \uC9C0\uB3C4\uD558\uC2DC\uB9AC\uB77C'(\uC7A0\uC5B8 3:5-6).";
      }
    } else {
      analysis = "\uC774 \uC601\uC5ED\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uC885\uD569\uC801\uC73C\uB85C \uBD84\uC11D\uD55C \uACB0\uACFC, \uD558\uB098\uB2D8\uC758 \uD615\uC0C1\uC73C\uB85C \uC9C0\uC74C \uBC1B\uC740 \uAC1C\uC778\uC758 \uACE0\uC720\uD55C \uACBD\uD5D8\uACFC \uC778\uC2DD\uC774 \uBC18\uC601\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC744 \uD1B5\uD574 \uB354 \uAE4A\uC774 \uD0D0\uC0C9\uD558\uACE0 \uD558\uB098\uB2D8\uC758 \uB73B\uC744 \uBC1C\uACAC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
    }
    return analysis;
  }
  function generateBiblicalSctRecommendations(cat, allText) {
    const recommendations = [];
    if (allText.includes("\uD798\uB4E4") || allText.includes("\uC5B4\uB835") || allText.includes("\uAC08\uB4F1")) {
      recommendations.push("\u2022 \uB9E4\uC77C \uC131\uACBD \uC77D\uAE30\uC640 \uAE30\uB3C4\uB85C \uD558\uB098\uB2D8\uACFC\uC758 \uAD00\uACC4 \uAE4A\uC774\uD558\uAE30");
      recommendations.push("\u2022 \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC744 \uD1B5\uD574 \uAD00\uACC4 \uD68C\uBCF5\uACFC \uC6A9\uC11C\uC758 \uACFC\uC815 \uACBD\uD5D8\uD558\uAE30");
      recommendations.push("\u2022 \uC18C\uADF8\uB8F9\uC774\uB098 \uC140 \uBAA8\uC784\uC5D0\uC11C \uC601\uC801 \uC9C0\uC9C0 \uBC1B\uAE30");
    }
    if (allText.includes("\uBD88\uC548") || allText.includes("\uAC71\uC815") || allText.includes("\uB450\uB835")) {
      recommendations.push("\u2022 \uC2DC\uD3B8 \uB9D0\uC500 \uBB35\uC0C1\uACFC \uC554\uC1A1 (\uC2DC\uD3B8 23, 27, 46\uD3B8 \uB4F1)");
      recommendations.push("\u2022 \uC5FC\uB824\uB97C \uAE30\uB3C4\uB85C \uC804\uD658\uD558\uAE30 (\uBE4C\uB9BD\uBCF4\uC11C 4:6-7)");
      recommendations.push("\u2022 \uCC2C\uC591\uACFC \uACBD\uBC30\uB97C \uD1B5\uD55C \uC601\uC801 \uD3C9\uC548 \uACBD\uD5D8");
    }
    if (allText.includes("\uC5C6") || allText.includes("\uBAA8\uB974")) {
      recommendations.push("\u2022 \uD558\uB098\uB2D8\uC758 \uB73B\uC744 \uAD6C\uD558\uB294 \uAE30\uB3C4 \uC0DD\uD65C (\uC57C\uACE0\uBCF4\uC11C 1:5)");
      recommendations.push("\u2022 \uC131\uACBD\uC801 \uBE44\uC804 \uBC1C\uACAC\uC744 \uC704\uD55C \uAE08\uC2DD\uAE30\uB3C4");
      recommendations.push("\u2022 \uC601\uC801 \uBA58\uD1A0\uB098 \uBAA9\uD68C\uC790\uC640\uC758 \uC815\uAE30\uC801 \uB9CC\uB0A8");
    }
    if (allText.includes("\uC8C4\uCC45") || allText.includes("\uC798\uBABB") || allText.includes("\uBBF8\uC548")) {
      recommendations.push("\u2022 \uC2ED\uC790\uAC00 \uBCF5\uC74C \uBB35\uC0C1\uACFC \uC6A9\uC11C\uC758 \uD655\uC2E0 \uAC16\uAE30");
      recommendations.push("\u2022 \uD544\uC694\uC2DC \uD654\uD574\uC640 \uC6A9\uC11C\uB97C \uAD6C\uD558\uB294 \uC2E4\uCC9C");
      recommendations.push("\u2022 '\uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C\uC758 \uC0C8\uB85C\uC6B4 \uD53C\uC870\uBB3C' \uC815\uCCB4\uC131 \uD655\uB9BD (\uACE0\uB9B0\uB3C4\uD6C4\uC11C 5:17)");
    }
    if (allText.includes("\uC6B0\uC6B8") || allText.includes("\uC2AC\uD504") || allText.includes("\uC758\uC695")) {
      recommendations.push("\u2022 \uC2DC\uD3B8 \uAE30\uB3C4\uB85C \uD558\uB098\uB2D8\uAED8 \uAC10\uC815 \uD1A0\uB85C\uD558\uAE30");
      recommendations.push("\u2022 \uC131\uB3C4\uB4E4\uACFC\uC758 \uAD50\uC81C\uB97C \uD1B5\uD55C \uC601\uC801 \uD68C\uBCF5");
      recommendations.push("\u2022 \uAC10\uC0AC \uC77C\uAE30 \uC4F0\uAE30 (\uB370\uC0B4\uB85C\uB2C8\uAC00\uC804\uC11C 5:18)");
    }
    recommendations.push("\u2022 \uC815\uAE30\uC801\uC778 \uAD50\uD68C \uCD9C\uC11D\uACFC \uB9D0\uC500 \uC0AC\uC5ED \uCC38\uC5EC");
    recommendations.push("\u2022 \uC131\uACBD \uD1B5\uB3C5 \uBC0F QT(Quiet Time) \uC2B5\uAD00\uD654");
    return recommendations;
  }
  function generateDsiRecommendation() {
    setLoadingRec(true);
    setDsiRec("");
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    const { scales: areas, total } = calcSdri();
    let finalRec = "";
    if (counselingType2 === "biblical") {
      finalRec = generateBiblicalDsiAnalysis(total, areas);
    } else {
      finalRec = generatePsychologicalDsiAnalysis(total, areas);
    }
    setTimeout(() => {
      setDsiRec(finalRec);
      setLoadingRec(false);
    }, 1e3);
  }
  function generatePsychologicalDsiAnalysis(total, areas) {
    const level = total >= 120 ? "\uB192\uC74C(\uC591\uD638)" : total >= 80 ? "\uC911\uAC04(\uBCF4\uD1B5)" : "\uB0AE\uC74C(\uCDE8\uC57D)";
    const areaAnalysis = [];
    const weakAreas = [];
    const strongAreas = [];
    Object.entries(areas).forEach(([area, score]) => {
      const maxScore = 36;
      const percentage = score / maxScore * 100;
      if (percentage >= 70) {
        strongAreas.push(area);
      } else if (percentage < 50) {
        weakAreas.push(area);
      }
      let areaComment = "";
      if (area === "\uC778\uC9C0\uC801 \uAE30\uB2A5") {
        if (percentage >= 70) {
          areaComment = "\uAC10\uC815 \uC870\uC808\uACFC \uC758\uC0AC\uACB0\uC815 \uB2A5\uB825\uC774 \uC6B0\uC218\uD569\uB2C8\uB2E4. \uCDA9\uB3D9\uC131\uC774 \uB0AE\uACE0 \uB17C\uB9AC\uC801 \uC0AC\uACE0\uAC00 \uAC00\uB2A5\uD569\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uCDA9\uB3D9\uC131 \uC870\uC808\uC5D0 \uC5B4\uB824\uC6C0\uC774 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAC10\uC815\uACFC \uC0AC\uACE0\uB97C \uBD84\uB9AC\uD558\uB294 \uC5F0\uC2B5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        } else {
          areaComment = "\uAC10\uC815 \uC870\uC808 \uB2A5\uB825\uC774 \uBCF4\uD1B5 \uC218\uC900\uC785\uB2C8\uB2E4. \uC2A4\uD2B8\uB808\uC2A4 \uAD00\uB9AC \uAE30\uBC95\uC744 \uC775\uD788\uBA74 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4.";
        }
      } else if (area === "\uC790\uC544\uD1B5\uD569") {
        if (percentage >= 70) {
          areaComment = "\uC790\uAE30 \uC815\uCCB4\uC131\uC774 \uBA85\uD655\uD558\uACE0 \uAC00\uCE58\uAD00\uC774 \uC77C\uAD00\uB429\uB2C8\uB2E4. \uC790\uC728\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uD0C0\uC778\uC758 \uC601\uD5A5\uC744 \uB9CE\uC774 \uBC1B\uB294 \uD3B8\uC785\uB2C8\uB2E4. \uC790\uAE30 \uAC00\uCE58\uAD00\uC744 \uBA85\uB8CC\uD654\uD558\uB294 \uC791\uC5C5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        } else {
          areaComment = "\uC790\uC544 \uC815\uCCB4\uC131 \uD615\uC131 \uACFC\uC815\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uC790\uAE30 \uD0D0\uC0C9\uC744 \uD1B5\uD574 \uB354 \uAC15\uD654\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
        }
      } else if (area === "\uAC00\uC871\uD22C\uC0AC") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871 \uBB38\uC81C\uB85C\uBD80\uD130 \uAC74\uAC15\uD558\uAC8C \uBD84\uB9AC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uAC1D\uAD00\uC801 \uC2DC\uAC01\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871 \uBB38\uC81C\uAC00 \uD604\uC7AC \uC0B6\uC5D0 \uC601\uD5A5\uC744 \uC8FC\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC00\uC871 \uC0C1\uB2F4\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
        } else {
          areaComment = "\uAC00\uC871 \uC601\uD5A5\uC744 \uC778\uC2DD\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC74\uAC15\uD55C \uACBD\uACC4 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        }
      } else if (area === "\uC815\uC11C\uC801 \uB2E8\uC808") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871\uACFC \uC801\uC808\uD55C \uAC70\uB9AC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4. \uB3C5\uB9BD\uC131\uACFC \uCE5C\uBC00\uAC10\uC758 \uADE0\uD615\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871\uC73C\uB85C\uBD80\uD130 \uACFC\uB3C4\uD558\uAC8C \uB2E8\uC808\uB418\uC5B4 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC5F0\uACB0\uAC10 \uD68C\uBCF5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        } else {
          areaComment = "\uAC00\uC871\uACFC\uC758 \uAC70\uB9AC\uAC10\uC774 \uC801\uC808\uD569\uB2C8\uB2E4. \uD604\uC7AC \uC218\uC900\uC744 \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
        }
      } else if (area === "\uAC00\uC871\uD1F4\uD589") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871 \uC2A4\uD2B8\uB808\uC2A4 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uC131\uC219\uD558\uAC8C \uB300\uC751\uD569\uB2C8\uB2E4. \uD1F4\uD589 \uACBD\uD5A5\uC774 \uB0AE\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871 \uC0C1\uD669\uC5D0\uC11C \uC2A4\uD2B8\uB808\uC2A4\uB97C \uB9CE\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. \uAC10\uC815 \uC870\uC808 \uAE30\uBC95\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        } else {
          areaComment = "\uAC00\uC871 \uC0C1\uD669 \uB300\uCC98\uAC00 \uBCF4\uD1B5\uC785\uB2C8\uB2E4. \uC2A4\uD2B8\uB808\uC2A4 \uAD00\uB9AC\uB97C \uAC15\uD654\uD558\uBA74 \uC88B\uC2B5\uB2C8\uB2E4.";
        }
      }
      areaAnalysis.push(`${area} (${score}/${maxScore}\uC810, ${percentage.toFixed(0)}%):
${areaComment}`);
    });
    let overallAnalysis = `\uC804\uBC18\uC801\uC778 \uC790\uC544\uBD84\uD654 \uC218\uC900\uC774 ${level}\uC785\uB2C8\uB2E4. `;
    if (total >= 120) {
      overallAnalysis += "\uC790\uAE30 \uC790\uC2E0\uC5D0 \uB300\uD55C \uC774\uD574\uAC00 \uAE4A\uACE0, \uD0C0\uC778\uACFC\uC758 \uAD00\uACC4\uC5D0\uC11C \uAC74\uAC15\uD55C \uACBD\uACC4\uB97C \uC720\uC9C0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC815\uC11C\uC801\uC73C\uB85C \uC548\uC815\uC801\uC774\uBA70 \uB3C5\uB9BD\uC801\uC778 \uC758\uC0AC\uACB0\uC815\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4.";
    } else if (total >= 80) {
      overallAnalysis += "\uAE30\uBCF8\uC801\uC778 \uC790\uC544\uBD84\uD654\uAC00 \uC774\uB8E8\uC5B4\uC838 \uC788\uC73C\uB098, \uC77C\uBD80 \uC601\uC5ED\uC5D0\uC11C \uAC1C\uC120\uC758 \uC5EC\uC9C0\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC9C0\uC18D\uC801\uC778 \uC790\uAE30 \uC131\uCC30\uACFC \uC131\uC7A5\uC774 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4.";
    } else {
      overallAnalysis += "\uC790\uC544\uBD84\uD654 \uC218\uC900\uC774 \uB2E4\uC18C \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uAC00\uC871\uC774\uB098 \uD0C0\uC778\uC758 \uC601\uD5A5\uC744 \uB9CE\uC774 \uBC1B\uC744 \uC218 \uC788\uC73C\uBA70, \uC804\uBB38\uC801\uC778 \uC0C1\uB2F4\uC744 \uD1B5\uD55C \uC9C0\uC6D0\uC774 \uAD8C\uC7A5\uB429\uB2C8\uB2E4.";
    }
    const recommendations = [];
    if (weakAreas.length > 0) {
      recommendations.push(`[\uCDE8\uC57D \uC601\uC5ED \uAC1C\uC120]
\uCDE8\uC57D\uD55C \uC601\uC5ED: ${weakAreas.join(", ")}
\u2022 \uD574\uB2F9 \uC601\uC5ED\uC5D0 \uCD08\uC810\uC744 \uB9DE\uCD98 \uC0C1\uB2F4 \uC9C4\uD589
\u2022 \uC790\uAE30 \uC778\uC2DD \uAC15\uD654 \uD65C\uB3D9 (\uC77C\uAE30 \uC4F0\uAE30, \uC790\uAE30 \uC131\uCC30)
\u2022 \uAC00\uC871\uACFC\uC758 \uAC74\uAC15\uD55C \uACBD\uACC4 \uC124\uC815 \uC5F0\uC2B5`);
    }
    if (total < 120) {
      recommendations.push("[\uC0C1\uB2F4 \uC811\uADFC\uBC95]\n\u2022 Bowen \uAC00\uC871\uCE58\uB8CC \uAE30\uBC95 \uD65C\uC6A9\n\u2022 \uC790\uC544\uBD84\uD654 \uD5A5\uC0C1 \uD504\uB85C\uADF8\uB7A8 \uCC38\uC5EC\n\u2022 \uC815\uC11C \uC870\uC808 \uAE30\uC220 \uD6C8\uB828\n\u2022 \uAC00\uC871 \uAD00\uACC4 \uC7AC\uAD6C\uC870\uD654 \uC791\uC5C5");
    }
    if (strongAreas.length > 0) {
      recommendations.push(`[\uAC15\uC810 \uD65C\uC6A9]
\uAC15\uC810 \uC601\uC5ED: ${strongAreas.join(", ")}
\u2022 \uAC15\uC810\uC744 \uD65C\uC6A9\uD55C \uB300\uCC98 \uC804\uB7B5 \uAC15\uD654
\u2022 \uAE0D\uC815\uC801 \uACBD\uD5D8 \uD655\uB300 \uC801\uC6A9`);
    }
    recommendations.push("[\uB2E8\uAE30 \uBAA9\uD45C (1-3\uAC1C\uC6D4)]\n\u2022 \uC8FC 1\uD68C \uC815\uAE30 \uC0C1\uB2F4 \uCC38\uC5EC\n\u2022 \uAC10\uC815 \uC77C\uC9C0 \uC791\uC131 (\uC77C\uC77C)\n\u2022 \uC774\uC644 \uD6C8\uB828 \uC2E4\uCC9C (\uC8FC 3\uD68C)");
    recommendations.push("[\uC7A5\uAE30 \uBAA9\uD45C (6-12\uAC1C\uC6D4)]\n\u2022 \uC790\uC544\uBD84\uD654 \uC218\uC900 20% \uD5A5\uC0C1\n\u2022 \uAC00\uC871\uACFC\uC758 \uAC74\uAC15\uD55C \uAD00\uACC4 \uC7AC\uC815\uB9BD\n\u2022 \uC2A4\uD2B8\uB808\uC2A4 \uC0C1\uD669\uC5D0\uC11C\uC758 \uB300\uCC98 \uB2A5\uB825 \uAC15\uD654");
    return `${overallAnalysis}

[\uC601\uC5ED\uBCC4 \uC0C1\uC138 \uBD84\uC11D]
${areaAnalysis.join("\n\n")}

${recommendations.join("\n\n")}

[\uC8FC\uC758\uC0AC\uD56D]
\uBCF8 \uAD8C\uC7A5\uC0AC\uD56D\uC740 \uC790\uB3D9 \uBD84\uC11D \uACB0\uACFC\uC774\uBA70, \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC758 \uD574\uC11D\uACFC \uBCD1\uD589\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uAC1C\uC778\uC758 \uACE0\uC720\uD55C \uB9E5\uB77D\uC744 \uACE0\uB824\uD55C \uB9DE\uCDA4\uD615 \uC0C1\uB2F4\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.`;
  }
  function generateBiblicalDsiAnalysis(total, areas) {
    const level = total >= 120 ? "\uB192\uC74C(\uC591\uD638)" : total >= 80 ? "\uC911\uAC04(\uBCF4\uD1B5)" : "\uB0AE\uC74C(\uCDE8\uC57D)";
    const areaAnalysis = [];
    const weakAreas = [];
    const strongAreas = [];
    Object.entries(areas).forEach(([area, score]) => {
      const maxScore = 36;
      const percentage = score / maxScore * 100;
      if (percentage >= 70) {
        strongAreas.push(area);
      } else if (percentage < 50) {
        weakAreas.push(area);
      }
      let areaComment = "";
      if (area === "\uC778\uC9C0\uC801 \uAE30\uB2A5") {
        if (percentage >= 70) {
          areaComment = "\uAC10\uC815\uC744 \uC798 \uC870\uC808\uD558\uACE0 \uB17C\uB9AC\uC801\uC73C\uB85C \uC0AC\uACE0\uD569\uB2C8\uB2E4. '\uB108\uD76C\uB294 \uC774 \uC138\uB300\uB97C \uBCF8\uBC1B\uC9C0 \uB9D0\uACE0 \uC624\uC9C1 \uB9C8\uC74C\uC744 \uC0C8\uB86D\uAC8C \uD568\uC73C\uB85C \uBCC0\uD654\uB97C \uBC1B\uC544 \uD558\uB098\uB2D8\uC758 \uC120\uD558\uC2DC\uACE0 \uAE30\uBED0\uD558\uC2DC\uACE0 \uC628\uC804\uD558\uC2E0 \uB73B\uC774 \uBB34\uC5C7\uC778\uC9C0 \uBD84\uBCC4\uD558\uB3C4\uB85D \uD558\uB77C'(\uB85C\uB9C8\uC11C 12:2). \uD558\uB098\uB2D8\uC774 \uC8FC\uC2E0 \uC774\uC131\uC758 \uC120\uBB3C\uC744 \uC798 \uC0AC\uC6A9\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uCDA9\uB3D9\uC801\uC778 \uBC18\uC751\uC774 \uB098\uD0C0\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4. '\uC0AC\uB78C\uC758 \uC131\uB0B4\uB294 \uAC83\uC774 \uD558\uB098\uB2D8\uC758 \uC758\uB97C \uC774\uB8E8\uC9C0 \uBABB\uD568\uC774\uB77C'(\uC57C\uACE0\uBCF4\uC11C 1:20). \uAC10\uC815\uC5D0 \uD718\uB458\uB9AC\uAE30 \uC804\uC5D0 \uAE30\uB3C4\uD558\uBA70 \uD558\uB098\uB2D8\uC758 \uC9C0\uD61C\uB97C \uAD6C\uD558\uC138\uC694.";
        } else {
          areaComment = "\uAC10\uC815 \uC870\uC808 \uB2A5\uB825\uC774 \uBCF4\uD1B5\uC785\uB2C8\uB2E4. '\uB108\uD76C \uC548\uC5D0 \uC774 \uB9C8\uC74C\uC744 \uD488\uC73C\uB77C \uACE7 \uADF8\uB9AC\uC2A4\uB3C4 \uC608\uC218\uC758 \uB9C8\uC74C\uC774\uB2C8'(\uBE4C\uB9BD\uBCF4\uC11C 2:5). \uADF8\uB9AC\uC2A4\uB3C4\uC758 \uB9C8\uC74C\uC744 \uD488\uACE0 \uC131\uB839\uC758 \uC5F4\uB9E4\uB97C \uAD6C\uD558\uC138\uC694.";
        }
      } else if (area === "\uC790\uC544\uD1B5\uD569") {
        if (percentage >= 70) {
          areaComment = "\uC790\uAE30 \uC815\uCCB4\uC131\uC774 \uBA85\uD655\uD569\uB2C8\uB2E4. '\uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C \uC0C8\uB85C\uC6B4 \uD53C\uC870\uBB3C'(\uACE0\uB9B0\uB3C4\uD6C4\uC11C 5:17)\uB85C\uC11C\uC758 \uC815\uCCB4\uC131\uC744 \uC798 \uD655\uB9BD\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uD558\uB098\uB2D8\uC758 \uC790\uB140\uB85C\uC11C \uD655\uC2E0 \uC788\uAC8C \uC0B4\uC544\uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uD0C0\uC778\uC758 \uC601\uD5A5\uC744 \uB9CE\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. '\uC0AC\uB78C\uC744 \uAE30\uC058\uAC8C \uD558\uB294 \uC790\uAC00 \uB418\uB824 \uD558\uC600\uB354\uB77C\uBA74 \uADF8\uB9AC\uC2A4\uB3C4\uC758 \uC885\uC774 \uC544\uB2C8\uB2C8\uB77C'(\uAC08\uB77C\uB514\uC544\uC11C 1:10). \uD558\uB098\uB2D8 \uC548\uC5D0\uC11C \uC790\uC2E0\uC758 \uC815\uCCB4\uC131\uC744 \uCC3E\uACE0, \uD558\uB098\uB2D8\uB9CC\uC744 \uAE30\uC058\uC2DC\uAC8C \uD558\uB294 \uC0B6\uC744 \uCD94\uAD6C\uD558\uC138\uC694.";
        } else {
          areaComment = "\uC790\uC544 \uC815\uCCB4\uC131 \uD615\uC131 \uC911\uC785\uB2C8\uB2E4. '\uB108\uD76C \uBBFF\uC74C\uC744 \uC2DC\uD5D8\uD558\uC5EC \uB108\uD76C\uAC00 \uBBFF\uC74C \uC548\uC5D0 \uC788\uB294\uAC00 \uB108\uD76C \uC790\uC2E0\uC744 \uD655\uC99D\uD558\uB77C'(\uACE0\uB9B0\uB3C4\uD6C4\uC11C 13:5). \uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C \uC790\uC2E0\uC774 \uB204\uAD6C\uC778\uC9C0 \uD655\uC778\uD558\uB294 \uC2DC\uAC04\uC744 \uAC00\uC9C0\uC138\uC694.";
        }
      } else if (area === "\uAC00\uC871\uD22C\uC0AC") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871 \uBB38\uC81C\uB85C\uBD80\uD130 \uAC74\uAC15\uD558\uAC8C \uBD84\uB9AC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. '\uADF8\uB7EC\uBBC0\uB85C \uC0AC\uB78C\uC774 \uBD80\uBAA8\uB97C \uB5A0\uB098 \uADF8\uC758 \uC544\uB0B4\uC640 \uD569\uD558\uC5EC \uB458\uC774 \uD55C \uBAB8\uC744 \uC774\uB8F0\uC9C0\uB85C\uB2E4'(\uCC3D\uC138\uAE30 2:24). \uC131\uACBD\uC801 \uB3C5\uB9BD\uACFC \uBD84\uB9AC\uB97C \uC774\uB8E8\uC5C8\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871 \uBB38\uC81C\uAC00 \uD604\uC7AC \uC0B6\uC5D0 \uC601\uD5A5\uC744 \uC90D\uB2C8\uB2E4. '\uB610 \uB2E4\uB978 \uC0AC\uB78C\uB4E4\uB3C4 \uAC74\uC9C0\uACE0\uC790 \uD558\uC5EC \uB450\uB824\uC6C0\uC73C\uB85C \uBD99\uB4E4\uC5B4 \uB04C\uC5B4\uB0B4\uBA70'(\uC720\uB2E4\uC11C 1:23). \uAC00\uC871\uC744 \uC0AC\uB791\uD558\uB418, \uAC00\uC871\uC758 \uBB38\uC81C\uAC00 \uB2F9\uC2E0\uC758 \uC815\uCCB4\uC131\uC744 \uC815\uC758\uD558\uC9C0 \uC54A\uB3C4\uB85D \uAE30\uB3C4\uD558\uC138\uC694. \uC6A9\uC11C\uC640 \uACBD\uACC4 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
        } else {
          areaComment = "\uAC00\uC871 \uC601\uD5A5\uC744 \uC778\uC2DD\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. '\uB0B4 \uBA4D\uC5D0\uB294 \uC27D\uACE0 \uB0B4 \uC9D0\uC740 \uAC00\uBCBC\uC6B0\uB2C8\uB77C'(\uB9C8\uD0DC\uBCF5\uC74C 11:30). \uAC00\uC871\uC758 \uC9D0\uC744 \uC8FC\uB2D8\uAED8 \uB9E1\uAE30\uACE0 \uAC74\uAC15\uD55C \uACBD\uACC4\uB97C \uC138\uC6B0\uC138\uC694.";
        }
      } else if (area === "\uC815\uC11C\uC801 \uB2E8\uC808") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871\uACFC \uC801\uC808\uD55C \uAC70\uB9AC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4. '\uAC01 \uC0AC\uB78C\uC740 \uC790\uAE30 \uC790\uC2E0\uC758 \uD589\uC704\uB97C \uC0B4\uD53C\uB77C \uADF8\uB9AC\uD558\uBA74 \uC790\uB791\uD560 \uAC83\uC774 \uC790\uAE30\uC5D0\uAC8C\uB9CC \uC788\uACE0 \uB0A8\uC5D0\uAC8C\uB294 \uC788\uC9C0 \uC544\uB2C8\uD558\uB9AC\uB2C8'(\uAC08\uB77C\uB514\uC544\uC11C 6:4). \uB3C5\uB9BD\uC131\uACFC \uCE5C\uBC00\uAC10\uC758 \uADE0\uD615\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871\uC73C\uB85C\uBD80\uD130 \uACFC\uB3C4\uD558\uAC8C \uB2E8\uC808\uB418\uC5B4 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. '\uB124 \uBD80\uBAA8\uB97C \uACF5\uACBD\uD558\uB77C'(\uCD9C\uC560\uAD7D\uAE30 20:12)\uB294 \uBA85\uB839\uC744 \uAE30\uC5B5\uD558\uC138\uC694. \uC0C1\uCC98\uAC00 \uC788\uB354\uB77C\uB3C4 \uC6A9\uC11C\uD558\uACE0 \uD654\uD574\uB97C \uCD94\uAD6C\uD558\uC138\uC694.";
        } else {
          areaComment = "\uAC00\uC871\uACFC\uC758 \uAC70\uB9AC\uAC00 \uC801\uC808\uD569\uB2C8\uB2E4. '\uBAA8\uB4E0 \uC0AC\uB78C\uACFC \uB354\uBD88\uC5B4 \uD654\uD3C9\uD568\uACFC \uAC70\uB8E9\uD568\uC744 \uB530\uB974\uB77C'(\uD788\uBE0C\uB9AC\uC11C 12:14). \uAD00\uACC4\uB97C \uC720\uC9C0\uD558\uBA70 \uC131\uC7A5\uD558\uC138\uC694.";
        }
      } else if (area === "\uAC00\uC871\uD1F4\uD589") {
        if (percentage >= 70) {
          areaComment = "\uAC00\uC871 \uC2A4\uD2B8\uB808\uC2A4\uC5D0\uB3C4 \uC131\uC219\uD558\uAC8C \uB300\uC751\uD569\uB2C8\uB2E4. '\uB0B4\uAC00 \uC5B4\uB838\uC744 \uB54C\uC5D0\uB294 \uB9D0\uD558\uB294 \uAC83\uC774 \uC5B4\uB9B0 \uC544\uC774\uC640 \uAC19\uACE0... \uC7A5\uC131\uD55C \uC0AC\uB78C\uC774 \uB418\uC5B4\uC11C\uB294 \uC5B4\uB9B0 \uC544\uC774\uC758 \uC77C\uC744 \uBC84\uB838\uB178\uB77C'(\uACE0\uB9B0\uB3C4\uC804\uC11C 13:11). \uC601\uC801 \uC131\uC219\uD568\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4.";
        } else if (percentage < 50) {
          areaComment = "\uAC00\uC871 \uC0C1\uD669\uC5D0\uC11C \uC2A4\uD2B8\uB808\uC2A4\uB97C \uB9CE\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. '\uB108\uD76C \uC5FC\uB824\uB97C \uB2E4 \uC8FC\uAED8 \uB9E1\uAE30\uB77C \uC774\uB294 \uADF8\uAC00 \uB108\uD76C\uB97C \uB3CC\uBCF4\uC2EC\uC774\uB77C'(\uBCA0\uB4DC\uB85C\uC804\uC11C 5:7). \uAC00\uC871 \uBB38\uC81C\uB97C \uD558\uB098\uB2D8\uAED8 \uB9E1\uAE30\uACE0 \uD3C9\uC548\uC744 \uCC3E\uC73C\uC138\uC694.";
        } else {
          areaComment = "\uAC00\uC871 \uC0C1\uD669 \uB300\uCC98\uAC00 \uBCF4\uD1B5\uC785\uB2C8\uB2E4. '\uC8FC \uC548\uC5D0\uC11C \uD56D\uC0C1 \uAE30\uBED0\uD558\uB77C'(\uBE4C\uB9BD\uBCF4\uC11C 4:4). \uC5B4\uB824\uC6B4 \uC0C1\uD669\uC5D0\uC11C\uB3C4 \uC8FC\uB2D8\uC744 \uBC14\uB77C\uBCF4\uC138\uC694.";
        }
      }
      areaAnalysis.push(`${area} (${score}/${maxScore}\uC810, ${percentage.toFixed(0)}%):
${areaComment}`);
    });
    let overallAnalysis = `\uC804\uBC18\uC801\uC778 \uC790\uC544\uBD84\uD654 \uC218\uC900\uC774 ${level}\uC785\uB2C8\uB2E4. `;
    if (total >= 120) {
      overallAnalysis += "\uD558\uB098\uB2D8\uAED8\uC11C \uC8FC\uC2E0 \uAC74\uAC15\uD55C \uC790\uC544\uAC00 \uC798 \uD615\uC131\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. '\uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C \uC790\uC720\uB86D\uAC8C \uD558\uB294 \uAC83'(\uAC08\uB77C\uB514\uC544\uC11C 5:1)\uC744 \uACBD\uD5D8\uD558\uACE0 \uC788\uC73C\uBA70, \uD0C0\uC778\uACFC\uC758 \uAD00\uACC4\uC5D0\uC11C\uB3C4 \uADF8\uB9AC\uC2A4\uB3C4\uC758 \uC0AC\uB791\uC73C\uB85C \uADE0\uD615\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4. \uC774 \uC740\uD61C\uB97C \uAC10\uC0AC\uD788 \uC5EC\uAE30\uBA70 \uB2E4\uB978 \uC774\uB4E4\uC744 \uC138\uC6B0\uB294 \uB370 \uC0AC\uC6A9\uD558\uC138\uC694.";
    } else if (total >= 80) {
      overallAnalysis += "\uAE30\uBCF8\uC801\uC778 \uC790\uC544\uBD84\uD654\uAC00 \uC774\uB8E8\uC5B4\uC838 \uC788\uC2B5\uB2C8\uB2E4. '\uC120\uC744 \uD589\uD558\uB418 \uB099\uC2EC\uD558\uC9C0 \uB9D0\uC9C0\uB2C8 \uD3EC\uAE30\uD558\uC9C0 \uC544\uB2C8\uD558\uBA74 \uB54C\uAC00 \uC774\uB974\uB9E4 \uAC70\uB450\uB9AC\uB77C'(\uAC08\uB77C\uB514\uC544\uC11C 6:9). \uB354 \uAE4A\uC740 \uC601\uC801 \uC131\uC219\uC744 \uD5A5\uD574 \uB098\uC544\uAC00\uC138\uC694.";
    } else {
      overallAnalysis += "\uC790\uC544\uBD84\uD654 \uC218\uC900\uC774 \uB0AE\uC740 \uD3B8\uC785\uB2C8\uB2E4. \uADF8\uB7EC\uB098 \uD558\uB098\uB2D8\uC740 '\uC5F0\uC57D\uD55C \uC790\uB4E4\uC744 \uAC15\uD558\uAC8C \uD558\uC2DC\uB294'(\uACE0\uB9B0\uB3C4\uD6C4\uC11C 12:9) \uBD84\uC774\uC2ED\uB2C8\uB2E4. \uC8FC\uB2D8\uC758 \uB2A5\uB825\uC774 \uC57D\uD55C \uB370\uC11C \uC628\uC804\uD558\uC5EC\uC9D1\uB2C8\uB2E4. \uACB8\uC190\uD788 \uB3C4\uC6C0\uC744 \uAD6C\uD558\uACE0 \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC744 \uBC1B\uC73C\uC138\uC694.";
    }
    const recommendations = [];
    if (weakAreas.length > 0) {
      recommendations.push(`[\uCDE8\uC57D \uC601\uC5ED\uC758 \uC601\uC801 \uCE58\uC720]
\uCDE8\uC57D\uD55C \uC601\uC5ED: ${weakAreas.join(", ")}
\u2022 \uD574\uB2F9 \uC601\uC5ED\uC5D0 \uB300\uD55C \uC131\uACBD \uB9D0\uC500 \uBB35\uC0C1\uACFC \uC554\uC1A1
\u2022 \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC744 \uD1B5\uD55C \uD558\uB098\uB2D8\uC758 \uAD00\uC810 \uD68C\uBCF5
\u2022 \uAE30\uB3C4\uC640 \uAE08\uC2DD\uC73C\uB85C \uC601\uC801 \uB3CC\uD30C \uACBD\uD5D8
\u2022 \uC18C\uADF8\uB8F9\uC5D0\uC11C \uC911\uBCF4\uAE30\uB3C4 \uBC1B\uAE30`);
    }
    if (total < 120) {
      recommendations.push("[\uC601\uC801 \uC131\uC7A5 \uC804\uB7B5]\n\u2022 \uB9E4\uC77C \uC131\uACBD \uC77D\uAE30\uC640 QT\uB85C \uD558\uB098\uB2D8\uACFC\uC758 \uAD00\uACC4 \uAE4A\uC774\uD558\uAE30\n\u2022 \uC2ED\uC790\uAC00 \uBCF5\uC74C \uBB35\uC0C1 - \uC815\uCCB4\uC131\uC758 \uADFC\uC6D0 \uD655\uC778\n\u2022 \uC6A9\uC11C\uC640 \uD654\uD574\uC758 \uC2E4\uCC9C (\uAC00\uC871 \uAD00\uACC4 \uD68C\uBCF5)\n\u2022 \uC131\uB839 \uCDA9\uB9CC\uACFC \uC131\uB839\uC758 \uC5F4\uB9E4 \uAD6C\uD558\uAE30");
    }
    if (strongAreas.length > 0) {
      recommendations.push(`[\uAC15\uC810\uC744 \uD1B5\uD55C \uC12C\uAE40]
\uAC15\uC810 \uC601\uC5ED: ${strongAreas.join(", ")}
\u2022 \uC774 \uC740\uC0AC\uB97C \uAD50\uD68C\uC640 \uC774\uC6C3 \uC12C\uAE40\uC5D0 \uC0AC\uC6A9\uD558\uAE30
\u2022 \uC57D\uD55C \uC790\uB4E4\uC744 \uB3CC\uBCF4\uACE0 \uACA9\uB824\uD558\uAE30
\u2022 \uD558\uB098\uB2D8\uAED8 \uAC10\uC0AC\uC640 \uCC2C\uC591 \uB4DC\uB9AC\uAE30`);
    }
    recommendations.push("[\uB2E8\uAE30 \uC601\uC801 \uBAA9\uD45C (1-3\uAC1C\uC6D4)]\n\u2022 \uC8FC 1\uD68C \uAE30\uB3C5\uAD50 \uC0C1\uB2F4 \uCC38\uC5EC\n\u2022 \uB9E4\uC77C \uC131\uACBD \uBB35\uC0C1\uACFC \uAE30\uB3C4 \uC77C\uAE30 \uC791\uC131\n\u2022 \uC8FC\uC77C \uC608\uBC30 \uBC0F \uC18C\uADF8\uB8F9 \uBAA8\uC784 \uCC38\uC11D\n\u2022 \uAC00\uC871\uC744 \uC704\uD55C \uC911\uBCF4\uAE30\uB3C4");
    recommendations.push("[\uC7A5\uAE30 \uC601\uC801 \uBAA9\uD45C (6-12\uAC1C\uC6D4)]\n\u2022 \uADF8\uB9AC\uC2A4\uB3C4 \uC548\uC5D0\uC11C\uC758 \uC815\uCCB4\uC131 \uD655\uB9BD\n\u2022 \uAC00\uC871\uACFC\uC758 \uC131\uACBD\uC801 \uAD00\uACC4 \uD68C\uBCF5\n\u2022 \uC601\uC801 \uC131\uC219\uC744 \uD1B5\uD55C \uC790\uC544\uBD84\uD654 \uD5A5\uC0C1\n\u2022 \uC12C\uAE40\uACFC \uC0AC\uC5ED\uC744 \uD1B5\uD55C \uC740\uC0AC \uAC1C\uBC1C");
    recommendations.push("[\uCD94\uCC9C \uC131\uACBD \uAD6C\uC808 \uBB35\uC0C1]\n\u2022 \uC815\uCCB4\uC131: \uACE0\uB9B0\uB3C4\uD6C4\uC11C 5:17, \uAC08\uB77C\uB514\uC544\uC11C 2:20\n\u2022 \uAC00\uC871 \uAD00\uACC4: \uC5D0\uBCA0\uC18C\uC11C 6:1-4, \uACE8\uB85C\uC0C8\uC11C 3:18-21\n\u2022 \uAC10\uC815 \uC870\uC808: \uC7A0\uC5B8 16:32, \uC57C\uACE0\uBCF4\uC11C 1:19-20\n\u2022 \uC790\uC720\uC640 \uC131\uC219: \uAC08\uB77C\uB514\uC544\uC11C 5:1, \uACE0\uB9B0\uB3C4\uC804\uC11C 13:11");
    return `${overallAnalysis}

[\uC601\uC5ED\uBCC4 \uC0C1\uC138 \uBD84\uC11D]
${areaAnalysis.join("\n\n")}

${recommendations.join("\n\n")}

[\uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC758 \uC6D0\uCE59]
\uBCF8 \uAD8C\uC7A5\uC0AC\uD56D\uC740 \uC131\uACBD \uB9D0\uC500\uC5D0 \uAE30\uCD08\uD55C \uBD84\uC11D\uC774\uBA70, \uC219\uB828\uB41C \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC0AC\uC640 \uD568\uAED8 \uB354 \uAE4A\uC774 \uD0D0\uC0C9\uD558\uC2DC\uAE30\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4. '\uBAA8\uB4E0 \uC131\uACBD\uC740 \uD558\uB098\uB2D8\uC758 \uAC10\uB3D9\uC73C\uB85C \uB41C \uAC83\uC73C\uB85C \uAD50\uD6C8\uACFC \uCC45\uB9DD\uACFC \uBC14\uB974\uAC8C \uD568\uACFC \uC758\uB85C \uAD50\uC721\uD558\uAE30\uC5D0 \uC720\uC775\uD558\uB2C8'(\uB514\uBAA8\uB370\uD6C4\uC11C 3:16). \uD558\uB098\uB2D8\uC758 \uB9D0\uC500\uC774 \uB2F9\uC2E0\uC744 \uC778\uB3C4\uD558\uACE0 \uCE58\uC720\uD558\uC2DC\uAE30\uB97C \uAE30\uB3C4\uD569\uB2C8\uB2E4.`;
  }
  function logout() {
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
    setAiChatUsed(0);
    try {
      localStorage.removeItem(AI_LIMIT_KEY);
    } catch {
    }
    setView("memberDashboard");
  }
  function getCounselorSessions() {
    return submitted.filter((s) => {
      if (!s.linkId) return false;
      const linkData = loadLink(s.linkId);
      return false;
    });
  }
  console.log("\u{1F3AC} \uB80C\uB354\uB9C1 \uC2DC\uC791 - current view:", view);
  if (view === "login") {
    console.log("\u{1F3AC} \uB85C\uADF8\uC778 \uD654\uBA74 \uB80C\uB354\uB9C1");
  }
  if (view === "login") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-green-100 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl mb-3" }, "\u{1F9E0}"), /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-800" }, "\uC2EC\uB9AC\uAC80\uC0AC \uC2DC\uC2A4\uD15C"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm mt-1" }, "\uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uBC1B\uC740 \uB9C1\uD06C ID\uB85C \uAC80\uC0AC\uB97C \uC2DC\uC791\uD558\uC138\uC694")), /* @__PURE__ */ React.createElement(Msg, { msg: loginMsg }), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-green-800 mb-3" }, "\u{1F4CB} \uAC80\uC0AC \uC751\uC2DC (\uB0B4\uB2F4\uC790)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "w-full px-4 py-3 border-2 border-green-300 rounded-lg outline-none focus:border-green-500 text-sm mb-3 font-mono",
      placeholder: "\uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uBC1B\uC740 \uB9C1\uD06C ID\uB97C \uC5EC\uAE30\uC5D0 \uBD99\uC5EC\uB123\uC73C\uC138\uC694",
      value: linkInput,
      onChange: (e) => setLinkInput(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && enterByLinkId()
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: enterByLinkId, className: "w-full bg-green-700 text-white py-3 rounded-lg font-bold hover:bg-green-800 transition text-base" }, "\uAC80\uC0AC \uC2DC\uC791\uD558\uAE30 \u2192")), /* @__PURE__ */ React.createElement("div", { className: "relative mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full border-t border-gray-200" })))));
  if (view === "clientLogin") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setView("login");
    setLoginMsg({ type: "", text: "" });
  }, className: "text-gray-400 hover:text-gray-600 text-sm mb-5 flex items-center gap-1" }, "\u2190 \uB4A4\uB85C"), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-2" }, "\u{1F9EA}"), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-800" }, "\uC2EC\uB9AC\uAC80\uC0AC \uC2DC\uC791"), /* @__PURE__ */ React.createElement("div", { className: "mt-2 inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold" }, "\uB0B4\uB2F4\uC790: ", activeLinkData == null ? void 0 : activeLinkData.clientName), activeLinkData && (activeLinkData.testTypes || [activeLinkData.testType]).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-1.5" }, "\uC9C4\uD589\uD560 \uAC80\uC0AC (", (activeLinkData.testTypes || [activeLinkData.testType]).length, "\uAC1C)"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-1.5" }, (activeLinkData.testTypes || [activeLinkData.testType]).map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: "px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-200" }, i + 1, ". ", t2))))), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-700" }, "\u2705 \uB9C1\uD06C \uD655\uC778 \uC644\uB8CC. \uC804\uD654\uBC88\uD638\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uAC80\uC0AC\uB97C \uC2DC\uC791\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement(Msg, { msg: loginMsg }), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-semibold text-gray-700 mb-1" }, "\uC804\uD654\uBC88\uD638"), /* @__PURE__ */ React.createElement("input", { type: "tel", value: userInfo.phone, onChange: (e) => setUserInfo({ ...userInfo, phone: e.target.value }), placeholder: "010-1234-5678", className: "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 outline-none" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-semibold text-gray-700 mb-1" }, "\uBE44\uBC00\uBC88\uD638"), /* @__PURE__ */ React.createElement("input", { type: "password", value: userInfo.password, onChange: (e) => setUserInfo({ ...userInfo, password: e.target.value }), placeholder: "\uC0AC\uC6A9\uD558\uC2E4 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694", className: "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 outline-none", onKeyDown: (e) => e.key === "Enter" && clientLogin() }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "* \uBCF8\uC778\uC774 \uC9C1\uC811 \uC124\uC815\uD558\uB294 \uBE44\uBC00\uBC88\uD638\uC785\uB2C8\uB2E4")), /* @__PURE__ */ React.createElement("button", { onClick: clientLogin, className: "w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition text-lg" }, "\uAC80\uC0AC \uC2DC\uC791 \u2192"))));
  if (view === "sctTest") {
    const filled = sdriCompletionQ.filter((q) => {
      var _a2;
      return (_a2 = srciResponses[q.num]) == null ? void 0 : _a2.trim();
    }).length;
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2)))), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-violet-600 font-bold text-sm" }, "\u270D\uFE0F SRCI"), /* @__PURE__ */ React.createElement("span", { className: "text-violet-400 text-xs" }, t("\uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC", "Sentence Completion Test"))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-violet-900 mb-1" }, t("\uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC", "Sentence Completion Test")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm" }, t("\uBE48\uCE78\uC5D0 \uAC00\uC7A5 \uBA3C\uC800 \uB5A0\uC624\uB974\uB294 \uAC83\uC744 \uC194\uC9C1\uD558\uAC8C \uC644\uC131\uD574 \uC8FC\uC138\uC694 (25\uBB38\uD56D)", "Complete each sentence with the first thought that comes to mind (25 items)"))), /* @__PURE__ */ React.createElement("div", { className: "bg-violet-50 border border-violet-200 rounded-lg p-3 mb-5 text-xs text-violet-800 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, filled), " / ", sdriCompletionQ.length, " ", t("\uBB38\uD56D", "items"), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-violet-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-violet-500 h-1.5 rounded-full transition-all", style: { width: `${filled / sdriCompletionQ.length * 100}%` } }))), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, [...sdriCompletionQ].sort((a, b) => a.num - b.num).map((q, idx) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0 mt-0.5 bg-violet-100 text-violet-700" }, idx + 1), /* @__PURE__ */ React.createElement("label", { className: "font-semibold text-gray-700 text-sm leading-relaxed" }, q.prompt, " ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-normal" }, "___________"))), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: srciResponses[q.num] || "",
          onChange: (e) => setSrciResponses((p) => ({ ...p, [q.num]: e.target.value })),
          placeholder: t("\uB5A0\uC624\uB974\uB294 \uB300\uB85C \uC790\uC720\uB86D\uAC8C...", "Write freely what comes to mind..."),
          className: `w-full px-4 py-2.5 border-2 rounded-lg outline-none text-sm transition ${((_a2 = srciResponses[q.num]) == null ? void 0 : _a2.trim()) ? "border-violet-300 bg-violet-50 focus:border-violet-500" : "border-gray-200 focus:border-violet-400"}`
        }
      ));
    })), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: submitSrci,
        className: "bg-violet-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-violet-700 transition"
      },
      pendingTests.length > 1 && currentTestIndex < pendingTests.length - 1 ? t(`\uB2E4\uC74C \uAC80\uC0AC\uB85C \u2192 (${currentTestIndex + 1}/${pendingTests.length})`, `Next \u2192 (${currentTestIndex + 1}/${pendingTests.length})`) : t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"),
      " (",
      filled,
      "/",
      sdriCompletionQ.length,
      ")"
    ))));
  }
  if (view === "dsiTest") {
    const likertFilled = Object.keys(sdriResponses).length;
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-teal-600 text-white border-teal-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2)))), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-teal-600 font-bold text-sm" }, "\u{1FA9E} SDRI"), /* @__PURE__ */ React.createElement("span", { className: "text-teal-400 text-xs" }, t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC", "Self-Differentiation Response Index"))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-teal-900 mb-1" }, t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC", "Self-Differentiation Response Index")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm" }, t("\uAC01 \uBB38\uD56D\uC774 \uB098\uC640 \uC5BC\uB9C8\uB098 \uC77C\uCE58\uD558\uB294\uC9C0 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694 (25\uBB38\uD56D)", "Indicate how much each statement describes you (25 items)"))), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-3 mb-5 text-xs text-teal-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3 justify-center mb-2" }, t(["1: \uC804\uD600 \uC544\uB2C8\uB2E4", "2: \uAC70\uC758 \uC544\uB2C8\uB2E4", "3: \uAC00\uB054 \uADF8\uB807\uB2E4", "4: \uC790\uC8FC \uADF8\uB807\uB2E4", "5: \uD56D\uC0C1 \uADF8\uB807\uB2E4"], ["1: Never", "2: Rarely", "3: Sometimes", "4: Often", "5: Always"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s))), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-teal-500 h-1.5 rounded-full transition-all", style: { width: `${likertFilled / sdriLikertQ.length * 100}%` } })), /* @__PURE__ */ React.createElement("div", { className: "text-center mt-1" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, likertFilled), " / ", sdriLikertQ.length)), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, sdriLikertQ.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: `border-2 rounded-xl p-4 transition ${sdriResponses[q.num] ? "border-teal-300 bg-teal-50" : "border-gray-100"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${q.scale === "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0" ? "bg-indigo-100 text-indigo-700" : q.scale === "\uC815\uC11C\uBC18\uC751\uC131" ? "bg-rose-100 text-rose-700" : q.scale === "\uC815\uC11C\uC801 \uB2E8\uC808" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}` }, t(q.scale, q.scaleEn)), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-700 leading-relaxed" }, q.num, ". ", t(q.content, q.en), q.rev && /* @__PURE__ */ React.createElement("span", { className: "ml-1 text-gray-400 font-normal text-xs" }, t("(\uC5ED\uBB38\uD56D)", "(R)")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [1, 2, 3, 4, 5].map((s) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s,
        onClick: () => setSdriResponses((p) => ({ ...p, [q.num]: s })),
        className: `flex-1 py-2 rounded-lg font-bold text-sm border-2 transition ${sdriResponses[q.num] === s ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-300 text-gray-500 hover:border-teal-400"}`
      },
      s
    )))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: submitSdri,
        disabled: likertFilled < sdriLikertQ.length,
        className: "bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      },
      pendingTests.length > 1 && currentTestIndex < pendingTests.length - 1 ? t(`\uB2E4\uC74C \uAC80\uC0AC\uB85C \u2192 (${currentTestIndex + 1}/${pendingTests.length})`, `Next \u2192 (${currentTestIndex + 1}/${pendingTests.length})`) : t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"),
      " (",
      likertFilled,
      "/",
      sdriLikertQ.length,
      ")"
    ))));
  }
  if (view === "phq9Test") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-green-800 mb-1" }, "\u{1F614} ", t("\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "Depression Screening"), " (PHQ-9)"), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uC9C0\uB09C 2\uC8FC\uAC04 \uC5BC\uB9C8\uB098 \uC790\uC8FC \uB2E4\uC74C\uC758 \uBB38\uC81C\uB4E4\uB85C \uC5B4\uB824\uC6C0\uC744 \uACAA\uC5C8\uB294\uC9C0 \uD45C\uC2DC\uD574 \uC8FC\uC138\uC694 (9\uBB38\uD56D)", "Over the last 2 weeks, how often have you been bothered by the following? (9 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3" }, t(["0: \uC804\uD600 \uC5C6\uC74C", "1: \uC5EC\uB7EC \uB0A0 \uB3D9\uC548", "2: 7\uC77C \uC774\uC0C1", "3: \uAC70\uC758 \uB9E4\uC77C"], ["0: Not at all", "1: Several days", "2: More than half", "3: Nearly every day"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(phq9Responses).length), " / 9 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, phq9Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-3" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-semibold text-gray-700 text-sm" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [0, 1, 2, 3].map((v) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setPhq9Responses((p) => ({ ...p, [q.num]: v })), className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${phq9Responses[q.num] === v ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100"}` }, v)))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitPhq9, className: "bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(phq9Responses).length, "/9)"))));
  if (view === "gad7Test") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-orange-800 mb-1" }, "\u{1F630} ", t("\uBD88\uC548 \uC790\uAC00\uC810\uAC80", "Anxiety Screening"), " (GAD-7)"), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uC9C0\uB09C 2\uC8FC\uAC04 \uB2E4\uC74C\uC758 \uBB38\uC81C\uB4E4\uB85C \uC5BC\uB9C8\uB098 \uC790\uC8FC \uC2DC\uB2EC\uB838\uB294\uC9C0 \uD45C\uC2DC\uD574 \uC8FC\uC138\uC694 (7\uBB38\uD56D)", "Over the last 2 weeks, how often have you been bothered by the following? (7 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3" }, t(["0: \uC804\uD600 \uC5C6\uC74C", "1: \uC5EC\uB7EC \uB0A0 \uB3D9\uC548", "2: 7\uC77C \uC774\uC0C1", "3: \uAC70\uC758 \uB9E4\uC77C"], ["0: Not at all", "1: Several days", "2: More than half", "3: Nearly every day"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(gad7Responses).length), " / 7 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, gad7Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-3" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-semibold text-gray-700 text-sm" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [0, 1, 2, 3].map((v) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setGad7Responses((p) => ({ ...p, [q.num]: v })), className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${gad7Responses[q.num] === v ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-100"}` }, v)))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitGad7, className: "bg-orange-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-orange-700 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(gad7Responses).length, "/7)"))));
  if (view === "riasecTest") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-violet-800 mb-1" }, "\u{1F50D} ", t("Holland RIASEC \uC9C1\uC5C5 \uD765\uBBF8 \uAC80\uC0AC", "Holland RIASEC Career Interest Test")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uB098\uC758 \uC9C1\uC5C5\uC801 \uC801\uC131\uACFC \uD765\uBBF8\uB97C 6\uAC00\uC9C0 \uC720\uD615\uC73C\uB85C \uBD84\uC11D\uD569\uB2C8\uB2E4 (30\uBB38\uD56D)", "Analyze your career aptitude and interests across 6 types (30 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4 text-xs text-violet-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3" }, t(["1: \uC804\uD600 \uC544\uB2C8\uB2E4", "2: \uC544\uB2C8\uB2E4", "3: \uBCF4\uD1B5", "4: \uADF8\uB807\uB2E4", "5: \uB9E4\uC6B0 \uADF8\uB807\uB2E4"], ["1: Strongly Disagree", "2: Disagree", "3: Neutral", "4: Agree", "5: Strongly Agree"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-violet-50 border border-violet-200 rounded-lg p-2 text-xs text-violet-800 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(riasecResponses).length), " / 30 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, RIASEC_Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.id, className: "border-b border-gray-100 pb-4" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-3 font-semibold text-gray-700 text-sm" }, q.id, ". ", q.text), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5" }, [1, 2, 3, 4, 5].map((v) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: v,
      onClick: () => setRiasecResponses((p) => ({ ...p, [q.id]: v })),
      className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${riasecResponses[q.id] === v ? "bg-violet-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-violet-100"}`
    },
    v
  )))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitRiasec, className: "bg-violet-700 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-violet-800 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(riasecResponses).length, "/30)"))));
  if (view === "valuesTest") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-amber-800 mb-1" }, "\u{1F48E} ", t("\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uAC80\uC0AC", "Work Values Assessment")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uC77C\uC5D0\uC11C \uBB34\uC5C7\uC744 \uC911\uC2DC\uD558\uB294\uC9C0 10\uAC00\uC9C0 \uAC00\uCE58\uC694\uC778\uC73C\uB85C \uCE21\uC815\uD569\uB2C8\uB2E4 (30\uBB38\uD56D)", "Measure what you value most at work across 10 value factors (30 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-3" }, t(["1: \uC804\uD600 \uC911\uC694\uD558\uC9C0 \uC54A\uB2E4", "2: \uC911\uC694\uD558\uC9C0 \uC54A\uB2E4", "3: \uBCF4\uD1B5", "4: \uC911\uC694\uD558\uB2E4", "5: \uB9E4\uC6B0 \uC911\uC694\uD558\uB2E4"], ["1: Not important at all", "2: Not important", "3: Neutral", "4: Important", "5: Very important"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(valuesResponses).length), " / 30 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, VALUES_Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.id, className: "border-b border-gray-100 pb-4" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-3 font-semibold text-gray-700 text-sm" }, q.id, ". ", q.text), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5" }, [1, 2, 3, 4, 5].map((v) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: v,
      onClick: () => setValuesResponses((p) => ({ ...p, [q.id]: v })),
      className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${valuesResponses[q.id] === v ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-100"}`
    },
    v
  )))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitValues, className: "bg-amber-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-amber-700 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(valuesResponses).length, "/30)"))));
  if (view === "dass21Test") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-teal-800 mb-1" }, "\u{1F4CA} ", t("\uC6B0\uC6B8/\uBD88\uC548/\uC2A4\uD2B8\uB808\uC2A4 \uCC99\uB3C4 (DASS-21)", "Depression/Anxiety/Stress Scale (DASS-21)")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uC9C0\uB09C \uC77C\uC8FC\uC77C \uB3D9\uC548 \uC790\uC2E0\uC5D0\uAC8C \uD574\uB2F9\uB418\uB294 \uC815\uB3C4\uB97C \uD45C\uC2DC\uD574 \uC8FC\uC138\uC694 (21\uBB38\uD56D)", "Rate how much each statement applied to you over the past week (21 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-xs text-teal-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, t(["1: \uC804\uD600 \uC544\uB2D8", "2: \uAC00\uB054", "3: \uC790\uC8FC", "4: \uB300\uBD80\uBD84"], ["1: Did not apply", "2: Applied sometimes", "3: Applied often", "4: Applied most of the time"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-2 text-xs text-teal-700 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(dass21Responses).length), " / 21 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, dass21Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-3" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-semibold text-gray-700 text-sm" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [1, 2, 3, 4].map((v) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setDass21Responses((p) => ({ ...p, [q.num]: v })), className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${dass21Responses[q.num] === v ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-teal-100"}` }, v)))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitDass21, className: "bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(dass21Responses).length, "/21)"))));
  if (view === "burnoutTest") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-center text-red-600 mb-2" }, "\u{1F525} ", t("\uBC88\uC544\uC6C3 \uC99D\uD6C4\uAD70 \uAC80\uC0AC (K-MBI+)", "Burnout Syndrome Test (K-MBI+)")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-500 text-sm mb-4" }, t("\uCD5C\uADFC \uD55C \uB2EC\uAC04 \uACBD\uD5D8\uD55C \uBE48\uB3C4\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694 (50\uBB38\uD56D)", "Rate how often you experienced each over the past month (50 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1 text-xs text-center font-semibold text-red-800" }, t(
    ["0: \uC804\uD600\uC5C6\uC74C", "1: 1\uB144\uC5D0 \uBA87\uBC88", "2: \uD55C\uB2EC\uC5D0 \uD55C\uBC88", "3: \uD55C\uB2EC\uC5D0 \uBA87\uBC88", "4: \uC77C\uC8FC\uC77C\uC5D0 \uD55C\uBC88", "5: \uC77C\uC8FC\uC77C\uC5D0 \uBA87\uBC88", "6: \uB9E4\uC77C"],
    ["0: Never", "1: Few/year", "2: Once/month", "3: Few/month", "4: Once/week", "5: Few/week", "6: Daily"]
  ).map((s) => /* @__PURE__ */ React.createElement("div", { key: s }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-red-700 mb-2" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", { className: "text-xl" }, Object.keys(burnoutResponses).length), " / 50 ", t("\uBB38\uD56D", "items")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-3" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-red-600 h-3 rounded-full transition-all duration-300",
      style: { width: `${Object.keys(burnoutResponses).length / 50 * 100}%` }
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, getBurnoutDomains().map((domain, dIdx) => /* @__PURE__ */ React.createElement("div", { key: dIdx, className: "border-2 border-gray-200 rounded-lg p-4 bg-gray-50" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-800 mb-3 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-600" }, domain.icon), t(domain.name, domain.nameEn), " (", domain.questions.length, " ", t("\uBB38\uD56D", "items"), ")"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, domain.questions.map((q, qIdx) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "bg-white border border-gray-200 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-semibold text-gray-700 text-sm" }, q.num, ". ", t(q.content, q.en)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1" }, [0, 1, 2, 3, 4, 5, 6].map((v) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: v,
      onClick: () => setBurnoutResponses((p) => ({ ...p, [q.num]: v })),
      className: `py-2 px-1 rounded-lg text-xs font-bold transition ${burnoutResponses[q.num] === v ? "bg-red-600 text-white shadow-lg scale-105" : "bg-gray-100 text-gray-600 hover:bg-red-100"}`
    },
    v
  ))))))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: submitBurnout,
      className: "bg-red-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-lg transform hover:scale-105"
    },
    "\u{1F525} ",
    t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"),
    " (",
    Object.keys(burnoutResponses).length,
    "/50)"
  ))));
  if (view === "big5Test") return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-purple-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-purple-800 mb-1" }, "\u{1F31F} ", t("Big5 \uC131\uACA9\uAC80\uC0AC", "Big Five Personality Test")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-sm mb-2" }, t("\uAC01 \uBB38\uC7A5\uC774 \uC790\uC2E0\uC744 \uC5BC\uB9C8\uB098 \uC798 \uC124\uBA85\uD558\uB294\uC9C0 \uD45C\uC2DC\uD574 \uC8FC\uC138\uC694 (50\uBB38\uD56D)", "Rate how accurately each statement describes you (50 items)")), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-xs text-purple-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, t(["1: \uC804\uD600 \uC544\uB2D8", "2: \uC544\uB2D8", "3: \uBCF4\uD1B5", "4: \uADF8\uB7EC\uD568", "5: \uB9E4\uC6B0 \uADF8\uB7EC\uD568"], ["1: Strongly Disagree", "2: Disagree", "3: Neutral", "4: Agree", "5: Strongly Agree"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700 mb-6 text-center" }, t("\uC9C4\uD589:", "Progress:"), " ", /* @__PURE__ */ React.createElement("strong", null, Object.keys(big5Responses).length), " / 50 ", t("\uBB38\uD56D", "items")), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, big5Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-3" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-semibold text-gray-700 text-sm" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [1, 2, 3, 4, 5].map((v) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setBig5Responses((p) => ({ ...p, [q.num]: v })), className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${big5Responses[q.num] === v ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-purple-100"}` }, v)))))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitBig5, className: "bg-purple-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", Object.keys(big5Responses).length, "/50)"))));
  if (view === "lostTest") {
    const AXIS_INFO = [
      { axis: "E", label: t("\uC5D0\uB108\uC9C0 \uBC29\uD5A5", "Energy Direction"), range: [1, 10], color: "teal", desc: t("\uC678\uD5A5(E) vs \uB0B4\uD5A5(I)", "Extroversion (E) vs Introversion (I)") },
      { axis: "D", label: t("\uC758\uC0AC\uACB0\uC815 \uBC29\uC2DD", "Decision-Making"), range: [11, 20], color: "blue", desc: t("\uB17C\uB9AC(T) vs \uAC10\uC815(F)", "Logic (T) vs Feeling (F)") },
      { axis: "S", label: t("\uD589\uB3D9 \uC18D\uB3C4", "Action Speed"), range: [21, 30], color: "orange", desc: t("\uBE60\uB984(P) vs \uC2E0\uC911(J)", "Spontaneous (P) vs Judicious (J)") },
      { axis: "N", label: t("\uC548\uC815\uC131", "Stability"), range: [31, 40], color: "green", desc: t("\uBCC0\uD654(C) vs \uC548\uC815(N)", "Change (C) vs Stability (N)") },
      { axis: "R", label: t("\uAD00\uACC4 \uBBFC\uAC10\uB3C4", "Relational Sensitivity"), range: [41, 50], color: "purple", desc: t("\uAD00\uACC4\uC911\uC2EC(R) vs \uB3C5\uB9BD(I)", "Relationship (R) vs Independence (I)") },
      { axis: "T", label: t("\uC2A4\uD2B8\uB808\uC2A4 \uBC18\uC751", "Stress Response"), range: [51, 60], color: "red", desc: t("\uC9C1\uBA74(A) vs \uD68C\uD53C(V)", "Confronting (A) vs Avoiding (V)") }
    ];
    const btnActiveMap = {
      teal: "bg-teal-600 text-white",
      blue: "bg-blue-600 text-white",
      orange: "bg-orange-500 text-white",
      green: "bg-green-600 text-white",
      purple: "bg-purple-600 text-white",
      red: "bg-red-500 text-white"
    };
    const headerMap = {
      teal: "bg-teal-50 border-teal-200 text-teal-800",
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800",
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      red: "bg-red-50 border-red-200 text-red-800"
    };
    const answered = Object.keys(lostResponses).length;
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto bg-white rounded-xl shadow p-6" }, pendingTests.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-teal-50 border border-teal-200 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-teal-700 mb-2" }, t("\u{1F4CB} \uAC80\uC0AC \uC9C4\uD589 \uD604\uD669", "\u{1F4CB} Test Progress"), " (", currentTestIndex + 1, "/", pendingTests.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap" }, pendingTests.map((t2, i) => /* @__PURE__ */ React.createElement("span", { key: t2, className: `px-3 py-1 rounded-full text-xs font-bold border ${i < currentTestIndex ? "bg-green-100 border-green-300 text-green-700" : i === currentTestIndex ? "bg-teal-600 text-white border-teal-600" : "bg-gray-100 border-gray-300 text-gray-400"}` }, i < currentTestIndex ? "\u2705 " : i === currentTestIndex ? "\u25B6 " : "", t2))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 bg-gray-200 rounded-full h-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-teal-500 h-1.5 rounded-full transition-all", style: { width: `${currentTestIndex / pendingTests.length * 100}%` } }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-center text-teal-800 mb-1" }, "\u{1F9ED} ", t("\uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4 \uAC80\uC0AC (LOST)", "Behavioral Operating System Test (LOST)")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-500 text-sm mb-1" }, t("\uB098\uB294 \uC5B4\uB5BB\uAC8C \uD589\uB3D9\uD558\uACE0 \uACB0\uC815\uD558\uB294\uAC00 \u2014 6\uAC1C \uCD95, 60\uBB38\uD56D", "How do you act and decide? \u2014 6 axes, 60 items")), /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-400 text-xs mb-4" }, t("Big Five \xB7 HEXACO \xB7 TCI \uC774\uB860 \uAE30\uBC18 | \uD55C\uAD6D \uBB38\uD654 \uC694\uC18C \uBC18\uC601", "Based on Big Five \xB7 HEXACO \xB7 TCI | Culturally adapted")), /* @__PURE__ */ React.createElement("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-3 mb-3 text-xs text-teal-800 flex flex-wrap gap-3" }, t(["1: \uC804\uD600 \uC544\uB2D8", "2: \uC544\uB2D8", "3: \uBCF4\uD1B5", "4: \uADF8\uB7EC\uD568", "5: \uB9E4\uC6B0 \uADF8\uB7EC\uD568"], ["1: Strongly Disagree", "2: Disagree", "3: Neutral", "4: Agree", "5: Strongly Agree"]).map((s) => /* @__PURE__ */ React.createElement("span", { key: s, className: "font-semibold" }, s))), /* @__PURE__ */ React.createElement("div", { className: "mb-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs text-gray-500 mb-1" }, /* @__PURE__ */ React.createElement("span", null, t("\uC804\uCCB4 \uC9C4\uD589\uB960", "Overall Progress")), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-teal-700" }, answered, " / 60 ", t("\uBB38\uD56D", "items"))), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-teal-500 h-2 rounded-full transition-all", style: { width: `${answered / 60 * 100}%` } }))), saveStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800 text-center" }, saveStatus), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, AXIS_INFO.map(({ axis, label, range, color, desc }) => {
      const axisQs = lostQ.filter((q) => q.num >= range[0] && q.num <= range[1]);
      const axisAnswered = axisQs.filter((q) => lostResponses[q.num] !== void 0).length;
      return /* @__PURE__ */ React.createElement("div", { key: axis, className: `border-2 rounded-xl overflow-hidden ${axisAnswered === 10 ? "border-teal-300" : "border-gray-200"}` }, /* @__PURE__ */ React.createElement("div", { className: `px-4 py-2 border-b flex justify-between items-center ${headerMap[color]}` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm" }, label), /* @__PURE__ */ React.createElement("span", { className: "ml-2 text-xs opacity-75" }, "(", desc, ")")), /* @__PURE__ */ React.createElement("span", { className: `text-xs font-bold px-2 py-0.5 rounded-full ${axisAnswered === 10 ? "bg-teal-600 text-white" : "bg-white/60 text-gray-600"}` }, axisAnswered, "/10")), /* @__PURE__ */ React.createElement("div", { className: "p-3 space-y-3" }, axisQs.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b border-gray-100 pb-3 last:border-0 last:pb-0" }, /* @__PURE__ */ React.createElement("label", { className: "block mb-2 font-medium text-gray-700 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 mr-1" }, q.num, "."), q.content), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5" }, [1, 2, 3, 4, 5].map((v) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: v,
          onClick: () => setLostResponses((p) => ({ ...p, [q.num]: v })),
          className: `flex-1 py-2 rounded-lg text-sm font-semibold transition ${lostResponses[q.num] === v ? btnActiveMap[color] : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`
        },
        v
      )))))));
    })), /* @__PURE__ */ React.createElement("div", { className: "mt-8 text-center" }, /* @__PURE__ */ React.createElement("button", { onClick: submitLost, className: "bg-teal-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-teal-700 transition" }, t("\uAC80\uC0AC \uC81C\uCD9C", "Submit"), " (", answered, "/60)"))));
  }
  if (view === "complete") {
    const completedTest = pendingTests[0] || "PHQ9";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-start pt-10",
        style: { fontFamily: "'Noto Sans KR',sans-serif" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4" }, /* @__PURE__ */ React.createElement("svg", { className: "w-10 h-10 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }))), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-800 mb-2" }, t("\uAC80\uC0AC \uC644\uB8CC!", "Assessment Complete!")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-2 mb-6" }, pendingTests.map((t2) => /* @__PURE__ */ React.createElement("span", { key: t2, className: "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-300" }, "\u2705 ", t2))), /* @__PURE__ */ React.createElement("div", { className: "mb-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-blue-800 mb-1" }, "\u{1F4AC} ", t("AI \uC0C1\uB2F4 \uCCB4\uD5D8\uD558\uAE30", "Try AI Counseling")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-blue-600 mb-3" }, t("\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C AI\uC640 3\uD68C \uBB34\uB8CC \uC0C1\uB2F4\uC744 \uBC1B\uC544\uBCF4\uC138\uC694", "Get 3 free AI counseling sessions based on your results")), /* @__PURE__ */ React.createElement(ChatBox, { testType: completedTest, initialPrompts: ["PHQ9", "GAD7"].includes(completedTest) ? lang === "en" ? [
        "What do my results mean?",
        "What can I do in my daily life?",
        "Do I need professional counseling?"
      ] : [
        "\uC81C \uAC80\uC0AC \uACB0\uACFC\uAC00 \uC5B4\uB5A4 \uC758\uBBF8\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
        "\uC77C\uC0C1\uC5D0\uC11C \uD560 \uC218 \uC788\uB294 \uAC83\uC774 \uC788\uB098\uC694?",
        "\uC804\uBB38\uAC00 \uC0C1\uB2F4\uC774 \uD544\uC694\uD55C \uC218\uC900\uC778\uAC00\uC694?"
      ] : lang === "en" ? [
        "Please explain my overall results.",
        "What should I pay most attention to?"
      ] : [
        "\uAC80\uC0AC \uACB0\uACFC \uC804\uCCB4\uC801\uC73C\uB85C \uC124\uBA85\uD574\uC8FC\uC138\uC694",
        "\uAC00\uC7A5 \uC8FC\uBAA9\uD574\uC57C \uD560 \uBD80\uBD84\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?"
      ] })), !isLoggedIn && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-4 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-green-800 mb-1" }, "\u{1F331} ", t("\uACB0\uACFC\uB97C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC73C\uC2E0\uAC00\uC694?", "Want to save your results?")), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-green-700 mb-3" }, t("\uBB34\uB8CC \uAC00\uC785\uD558\uBA74 \uAC80\uC0AC \uC774\uB825 \uC800\uC7A5 + 20 \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB429\uB2C8\uB2E4", "Sign up free to save your history and get 20 credits")), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setView("memberSignup"),
          className: "w-full bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition"
        },
        t("\uBB34\uB8CC\uB85C \uAC00\uC785\uD558\uAE30 \u2192", "Sign up free \u2192")
      )), (() => {
        const NEXT = {
          PHQ9: [{ id: "GAD7", name: t("\uBD88\uC548 \uC790\uAC00\uC810\uAC80", "Anxiety Screening"), emoji: "\u{1F499}", free: true }, { id: "DASS21", name: t("\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC2A4\uD2B8\uB808\uC2A4", "Depression\xB7Anxiety\xB7Stress"), emoji: "\u{1F30A}", free: false }],
          GAD7: [{ id: "PHQ9", name: t("\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "Depression Screening"), emoji: "\u{1F331}", free: true }, { id: "DASS21", name: t("\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC2A4\uD2B8\uB808\uC2A4", "Depression\xB7Anxiety\xB7Stress"), emoji: "\u{1F30A}", free: false }],
          DASS21: [{ id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }, { id: "BURNOUT", name: t("\uBC88\uC544\uC6C3 \uC790\uAC00\uC810\uAC80", "Burnout Screening"), emoji: "\u{1F525}", free: false }],
          BIG5: [{ id: "LOST", name: t("\uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4", "Behavioral Style"), emoji: "\u{1F9ED}", free: false }, { id: "DSI", name: t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131", "Self-Differentiation"), emoji: "\u{1FA9E}", free: false }],
          LOST: [{ id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }, { id: "BURNOUT", name: t("\uBC88\uC544\uC6C3 \uC790\uAC00\uC810\uAC80", "Burnout Screening"), emoji: "\u{1F525}", free: false }],
          BURNOUT: [{ id: "PHQ9", name: t("\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "Depression Screening"), emoji: "\u{1F331}", free: true }, { id: "DASS21", name: t("\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC2A4\uD2B8\uB808\uC2A4", "Depression\xB7Anxiety\xB7Stress"), emoji: "\u{1F30A}", free: false }],
          SCT: [{ id: "DSI", name: t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131", "Self-Differentiation"), emoji: "\u{1FA9E}", free: false }, { id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }],
          DSI: [{ id: "SCT", name: t("\uC790\uAE30\uBC18\uC751 \uC644\uC131", "Self-Response"), emoji: "\u270D\uFE0F", free: false }, { id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }],
          RIASEC: [{ id: "VALUES", name: t("\uC9C1\uC5C5\uAC00\uCE58\uAD00", "Work Values"), emoji: "\u{1F48E}", free: false }, { id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }],
          VALUES: [{ id: "RIASEC", name: "Holland RIASEC", emoji: "\u{1F50D}", free: false }, { id: "BIG5", name: t("\uC131\uACA9 5\uC694\uC778", "Big Five"), emoji: "\u{1F9E0}", free: false }]
        };
        const suggestions = NEXT[completedTest];
        if (!suggestions) return null;
        return /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-500 mb-2 text-left" }, "\u{1F4CB} ", t("\uC774\uB7F0 \uAC80\uC0AC\uB3C4 \uD574\uBCF4\uC138\uC694", "Try these assessments too")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, suggestions.map((s) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: s.id,
            onClick: () => setView("startTest:" + s.id),
            className: "flex-1 bg-green-50 border border-green-200 rounded-xl py-2.5 px-3 text-left hover:bg-green-100 transition"
          },
          /* @__PURE__ */ React.createElement("div", { className: "text-base mb-0.5" }, s.emoji),
          /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-green-800" }, s.name),
          /* @__PURE__ */ React.createElement("div", { className: "text-xs text-green-600" }, s.free ? t("\uBB34\uB8CC", "Free") : "10 cr")
        ))));
      })(), returnToCouple && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: goBackToCouple,
          className: "w-full bg-pink-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-pink-600 transition mb-2"
        },
        "\u{1F495} \uB9C8\uC74C\uCEE4\uD50C\uB85C \uB3CC\uC544\uAC00\uAE30"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            if (isLoggedIn) {
              setView("memberDashboard");
            } else {
              setView("landing");
            }
          },
          className: "w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
        },
        isLoggedIn ? t("\uB300\uC2DC\uBCF4\uB4DC\uB85C \u2192", "Dashboard \u2192") : t("\uC2DC\uC791\uD654\uBA74\uC73C\uB85C", "Home")
      ))
    );
  }
  if (view === "sctResult") {
    const { filled, byScale } = calcSrci();
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    const counselingTypeLabel = counselingType2 === "biblical" ? t("\u{1F54A}\uFE0F \uAE30\uB3C5\uAD50 \uC0C1\uB2F4", "\u{1F54A}\uFE0F Christian Counseling") : t("\u{1F9E0} \uC2EC\uB9AC\uC0C1\uB2F4", "\u{1F9E0} Psychology");
    const SCALE_META = {
      "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": { emoji: "\u{1F3AF}", color: "violet", border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700" },
      "\uC815\uC11C\uBC18\uC751\uC131": { emoji: "\u{1F4AB}", color: "rose", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
      "\uC815\uC11C\uC801 \uB2E8\uC808": { emoji: "\u{1F33F}", color: "amber", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
      "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": { emoji: "\u{1F517}", color: "purple", border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700" }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-violet-900" }, "\u270D\uFE0F ", t("SRCI \uAC80\uC0AC \uACB0\uACFC", "SRCI Result")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-1" }, t("\uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC \u2014 \uBB38\uC7A5\uC644\uC131\uD615 25\uBB38\uD56D", "Self-Response Completion \u2014 25 sentence-completion items"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "border rounded-lg p-4 mb-6 bg-violet-50 border-violet-200 text-violet-700" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC0C1\uB2F4 \uC720\uD615:", "Counseling Type:")), " ", counselingTypeLabel), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-1" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC644\uC131 \uBB38\uD56D:", "Completed Items:")), " ", filled, "/25")), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-800 mb-4" }, t("\uC18C\uCC99\uB3C4\uBCC4 \uC751\uB2F5", "Responses by Subscale")), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 mb-8" }, Object.entries(SCALE_META).map(([scaleName, meta]) => {
      const answers = byScale[scaleName] || [];
      return /* @__PURE__ */ React.createElement("div", { key: scaleName, className: `border ${meta.border} rounded-xl p-5 ${meta.bg}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, meta.emoji), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-sm ${meta.text}` }, scaleName), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 ml-auto" }, answers.length, " ", t("\uBB38\uD56D \uC644\uC131", "completed"))), answers.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, answers.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `pl-3 border-l-2 ${meta.border}` }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, a.prompt), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700 mt-0.5 font-medium" }, a.answer)))) : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, t("\uC751\uB2F5 \uC5C6\uC74C", "No responses")));
    })), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "SCT",
        onRun: () => {
          const { byScale: byScale2 } = calcSrci();
          const sample = Object.entries(byScale2).flatMap(
            ([scale, items]) => items.slice(0, 2).map((a) => ({ scale, prompt: a.prompt, answer: a.answer }))
          );
          runAiAnalysis("SCT", "SCT", { completionSample: sample });
        }
      }
    ), /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u270D\uFE0F SRCI \uC790\uAE30\uBC18\uC751\uC644\uC131 \uAC80\uC0AC \uACB0\uACFC
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC2EC\uB9AC\uAC80\uC0AC`, `\u270D\uFE0F SRCI Self-Response Completion Result
Tested on Maumful! https://maumful.com`) }), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => generateSctPdf({ sessionId, createdAt: (/* @__PURE__ */ new Date()).toISOString(), userPhone: userInfo == null ? void 0 : userInfo.phone, responses: srciResponses }),
        className: "w-full mb-3 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
      },
      "\u{1F4C4} ",
      t("PDF \uBCF4\uACE0\uC11C \uB2E4\uC6B4\uB85C\uB4DC", "Download PDF Report")
    ), /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "SCT", score: 0, level: "low" }), /* @__PURE__ */ React.createElement(
      ExpertCTA,
      {
        testType: "SCT",
        score: 0,
        level: "low",
        onContinueAI: () => {
          setChatOpen(true);
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    ), /* @__PURE__ */ React.createElement(ChatBox, { testType: "SCT", initialPrompts: t([
      "SRCI \uAC80\uC0AC \uACB0\uACFC\uC5D0\uC11C \uC8FC\uBAA9\uD574\uC57C \uD560 \uD328\uD134\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
      "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0\uC640 \uAD00\uB828\uB41C \uC751\uB2F5\uC744 \uBD84\uC11D\uD574 \uC8FC\uC138\uC694",
      "\uC815\uC11C\uBC18\uC751\uC131\uC744 \uAC74\uAC15\uD558\uAC8C \uC870\uC808\uD558\uB824\uBA74 \uC5B4\uB5BB\uAC8C \uD574\uC57C \uD558\uB098\uC694?",
      "\uB300\uC778\uAD00\uACC4\uC5D0\uC11C \uAC74\uAC15\uD55C \uACBD\uACC4\uB97C \uC124\uC815\uD558\uB294 \uBC29\uBC95\uC744 \uC54C\uB824\uC8FC\uC138\uC694"
    ], [
      "What patterns in my SRCI results should I pay attention to?",
      "Please analyze my responses related to maintaining my own perspective",
      "How can I regulate emotional reactivity in a healthy way?",
      "How do I set healthy boundaries in interpersonal relationships?"
    ]) })));
  }
  if (view === "dsiResult") {
    const { scales, total } = calcSdri();
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    const counselingTypeLabel = counselingType2 === "biblical" ? t("\u{1F54A}\uFE0F \uAE30\uB3C5\uAD50 \uC0C1\uB2F4", "\u{1F54A}\uFE0F Christian Counseling") : t("\u{1F9E0} \uC2EC\uB9AC\uC0C1\uB2F4", "\u{1F9E0} Psychology");
    const SCALE_META = {
      "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": {
        emoji: "\u{1F3AF}",
        max: 50,
        colorBar: "bg-indigo-500",
        bg: "bg-indigo-50 border-indigo-200",
        text: "text-indigo-700",
        desc: t("\uD0C0\uC778 \uC555\uB825\uC5D0\uB3C4 \uC790\uC2E0\uC758 \uAE30\uC900\uC744 \uC720\uC9C0\uD558\uB294 \uB2A5\uB825", "Ability to maintain own standards under social pressure")
      },
      "\uC815\uC11C\uBC18\uC751\uC131": {
        emoji: "\u{1F4AB}",
        max: 35,
        colorBar: "bg-rose-500",
        bg: "bg-rose-50 border-rose-200",
        text: "text-rose-700",
        desc: t("\uAC08\uB4F1\xB7\uC2A4\uD2B8\uB808\uC2A4 \uC0C1\uD669\uC5D0\uC11C \uAC10\uC815\uC801\uC73C\uB85C \uBC18\uC751\uD558\uB294 \uC815\uB3C4", "Degree of emotional reactivity in conflict/stress situations")
      },
      "\uC815\uC11C\uC801 \uB2E8\uC808": {
        emoji: "\u{1F33F}",
        max: 20,
        colorBar: "bg-amber-500",
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        desc: t("\uAC08\uB4F1 \uC2DC \uC815\uC11C\uC801 \uAC70\uB9AC\uB97C \uB450\uAC70\uB098 \uB300\uD654\uB97C \uD53C\uD558\uB294 \uACBD\uD5A5", "Tendency to create emotional distance or avoid dialogue during conflict")
      },
      "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": {
        emoji: "\u{1F517}",
        max: 20,
        colorBar: "bg-purple-500",
        bg: "bg-purple-50 border-purple-200",
        text: "text-purple-700",
        desc: t("\uD0C0\uC778 \uAC10\uC815\uC5D0 \uACFC\uB3C4\uD558\uAC8C \uB3D9\uD654\uB418\uAC70\uB098 \uC758\uC874\uD558\uB294 \uC815\uB3C4", "Degree of over-identification with or dependence on others' emotions")
      }
    };
    const getLevel = (score, max) => {
      const pct = score / max;
      if (pct >= 0.75) return { label: t("\uB192\uC74C", "High"), color: "text-emerald-600" };
      if (pct >= 0.45) return { label: t("\uBCF4\uD1B5", "Moderate"), color: "text-blue-600" };
      return { label: t("\uB0AE\uC74C", "Low"), color: "text-amber-600" };
    };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-teal-900" }, "\u{1FA9E} ", t("SDRI \uAC80\uC0AC \uACB0\uACFC", "SDRI Result")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-1" }, t("\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC \u2014 \uD3C9\uC815\uD615 25\uBB38\uD56D", "Self-Differentiation Reactivity \u2014 25 rating-scale items"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "border rounded-lg p-4 mb-6 bg-teal-50 border-teal-200 text-teal-700" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC0C1\uB2F4 \uC720\uD615:", "Counseling Type:")), " ", counselingTypeLabel), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold mt-2" }, t("\uCD1D\uC810:", "Total:"), " ", total, t("\uC810", ""))), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-800 mb-4" }, t("\uC18C\uCC99\uB3C4\uBCC4 \uACB0\uACFC", "Results by Subscale")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" }, Object.entries(SCALE_META).map(([scaleName, meta]) => {
      const score = scales[scaleName] || 0;
      const pct = Math.round(score / meta.max * 100);
      const level = getLevel(score, meta.max);
      return /* @__PURE__ */ React.createElement("div", { key: scaleName, className: `border rounded-xl p-5 ${meta.bg}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, meta.emoji), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-sm ${meta.text}` }, scaleName)), /* @__PURE__ */ React.createElement("span", { className: `text-sm font-bold ${level.color}` }, level.label)), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-3 leading-relaxed" }, meta.desc), /* @__PURE__ */ React.createElement("div", { className: "bg-white bg-opacity-60 rounded-full h-3 mb-1 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: `${meta.colorBar} h-3 rounded-full`, style: { width: `${pct}%`, transition: "width 0.5s" } })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs text-gray-400 mt-1" }, /* @__PURE__ */ React.createElement("span", null, score, t("\uC810", "")), /* @__PURE__ */ React.createElement("span", null, t("\uCD5C\uB300", "Max"), " ", meta.max, t("\uC810", ""), " (", pct, "%)")));
    })), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "DSI",
        onRun: () => {
          const { scales: scales2, total: total2 } = calcSdri();
          runAiAnalysis("DSI", "DSI", { scales: scales2, total: total2 });
        }
      }
    ), /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1FA9E} SDRI \uC790\uAE30\uBD84\uD654 \uAC80\uC0AC \uACB0\uACFC
\uCD1D\uC810: ${calcSdri().total}\uC810
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC2EC\uB9AC\uAC80\uC0AC`, `\u{1FA9E} SDRI Self-Differentiation Result
Total: ${calcSdri().total}
Tested on Maumful! https://maumful.com`) }), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => generateDsiPdf({ sessionId, createdAt: (/* @__PURE__ */ new Date()).toISOString(), userPhone: userInfo == null ? void 0 : userInfo.phone, scales, total }),
        className: "w-full mb-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
      },
      "\u{1F4C4} ",
      t("PDF \uBCF4\uACE0\uC11C \uB2E4\uC6B4\uB85C\uB4DC", "Download PDF Report")
    ), /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "DSI", score: 0, level: "low" }), /* @__PURE__ */ React.createElement(
      ExpertCTA,
      {
        testType: "DSI",
        score: 0,
        level: "low",
        onContinueAI: () => {
          setChatOpen(true);
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    ), /* @__PURE__ */ React.createElement(ChatBox, { testType: "DSI", initialPrompts: t([
      "SDRI \uC18C\uCC99\uB3C4 \uACB0\uACFC\uAC00 \uC5B4\uB5A4 \uC758\uBBF8\uC778\uC9C0 \uC124\uBA85\uD574 \uC8FC\uC138\uC694",
      "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0 \uB2A5\uB825\uC744 \uB192\uC774\uB294 \uBC29\uBC95\uC774 \uC788\uB098\uC694?",
      "\uC815\uC11C\uC801 \uB2E8\uC808 \uACBD\uD5A5\uC744 \uC5B4\uB5BB\uAC8C \uC774\uD574\uD558\uBA74 \uC88B\uC744\uAE4C\uC694?",
      "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874\uC774 \uB192\uC744 \uB54C \uC5B4\uB5BB\uAC8C \uACBD\uACC4\uB97C \uC124\uC815\uD558\uB098\uC694?"
    ], [
      "What do my SDRI subscale results mean?",
      "How can I improve my ability to maintain my own position?",
      "How should I understand a tendency toward emotional detachment?",
      "How do I set boundaries when fusion or relationship dependency is high?"
    ]) }), returnToCouple && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: goBackToCouple,
        className: "w-full mt-4 bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition"
      },
      "\u{1F495} \uB9C8\uC74C\uCEE4\uD50C\uB85C \uB3CC\uC544\uAC00\uAE30"
    )));
  }
  if (view === "phq9Result") {
    const result = calcPhq9();
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-green-800" }, "\u{1F614} ", t("PHQ-9 \uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80 \uACB0\uACFC", "PHQ-9 Depression Screening Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "border rounded-lg p-4 mb-6 bg-gray-50" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC138\uC158 ID:", "Session ID:")), " ", sessionId), /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC804\uD654\uBC88\uD638:", "Phone:")), " ", userInfo.phone || "N/A"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold mt-2" }, t("\uCD1D\uC810:", "Total:"), " ", result.total, "/27 (", result.level, ")")), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-lg mb-6 ${result.color === "green" ? "bg-green-50 border border-green-200" : result.color === "yellow" ? "bg-yellow-50 border border-yellow-200" : result.color === "orange" ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"}` }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uD574\uC11D", "Interpretation")), /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, result.total < 5 && t("\uC9C0\uAE08 \uB9C8\uC74C\uC774 \uBE44\uAD50\uC801 \uC548\uC815\uC801\uC785\uB2C8\uB2E4.", "Your mind seems relatively stable right now."), result.total >= 5 && result.total < 10 && t("\uB9C8\uC74C\uC774 \uC870\uAE08 \uBB34\uAC70\uC6B4 \uD3B8\uC785\uB2C8\uB2E4. \uAC00\uBCBC\uC6B4 \uC790\uAE30\uB3CC\uBD04\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC5B4\uC694.", "You may be feeling a bit low. Light self-care can help."), result.total >= 10 && result.total < 15 && t("\uC694\uC998 \uB9C8\uC74C\uC774 \uAF64 \uD798\uB4DC\uC2E0 \uAC83 \uAC19\uC544\uC694. \uBBFF\uC744 \uC218 \uC788\uB294 \uB204\uAD70\uAC00\uC640 \uC774\uC57C\uAE30 \uB098\uB220\uBCF4\uC138\uC694.", "It seems things have been quite tough. Try talking to someone you trust."), result.total >= 15 && result.total < 20 && t("\uB9CE\uC774 \uC9C0\uCE58\uC168\uAD70\uC694. \uC544\uB798 \uC0C1\uB2F4 \uC5F0\uACB0\uC744 \uD1B5\uD574 \uC774\uC57C\uAE30 \uB098\uB220\uBCF4\uC2DC\uB294 \uAC83\uB3C4 \uC88B\uC544\uC694.", "You seem very worn out. Reaching out for support would be a good step."), result.total >= 20 && t("\uC9C0\uAE08 \uB9CE\uC774 \uD798\uB4DC\uC2E0 \uAC83 \uAC19\uC544\uC694. \uD63C\uC790 \uAC10\uB2F9\uD558\uC9C0 \uC54A\uC544\uB3C4 \uB429\uB2C8\uB2E4. \uC544\uB798 \uC0C1\uB2F4 \uC5F0\uACB0\uC744 \uC774\uC6A9\uD574 \uBCF4\uC138\uC694.", "You seem to be going through a very hard time. You don't have to face this alone \u2014 please reach out for support."))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uC751\uB2F5 \uB0B4\uC5ED", "Response History")), phq9Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b pb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold" }, t("\uC751\uB2F5:", "Score:"), " ", phq9Responses[q.num] ?? "-", t("\uC810", ""))))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "PHQ9",
        onRun: () => {
          const r = calcPhq9();
          runAiAnalysis("PHQ9", "PHQ9", {
            total: r.total,
            level: r.level,
            items: phq9Q.map((q) => ({ question: q.content, score: phq9Responses[q.num] || 0 }))
          });
        }
      }
    ), (() => {
      const r = calcPhq9();
      return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F614} PHQ-9 \uC6B0\uC6B8 \uAC80\uC0AC \uACB0\uACFC
\uCD1D\uC810: ${r.total}/27 (${r.level})
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC2EC\uB9AC\uAC80\uC0AC`, `\u{1F614} PHQ-9 Depression Result
Total: ${r.total}/27 (${r.level})
Tested on Maumful! https://maumful.com`), testLabel: t("PHQ-9 \uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "PHQ-9 Depression Screening"), scoreText: `${r.total}/27`, levelText: r.level, colorHex: "#1B4332" });
    })(), (() => {
      const r = calcPhq9();
      const lvl = r.total >= 15 ? "high" : r.total >= 10 ? "mid" : "low";
      return /* @__PURE__ */ React.createElement(React.Fragment, null, !isLoggedIn && /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-2xl mb-2" }, "\u{1F331}"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-800 mb-1" }, t("\uACB0\uACFC\uB97C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC73C\uC2E0\uAC00\uC694?", "Want to save your results?")), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-green-700 mb-3" }, t("\uBB34\uB8CC \uAC00\uC785\uD558\uBA74 \uAC80\uC0AC \uC774\uB825 \uC800\uC7A5 + 20 \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB429\uB2C8\uB2E4", "Sign up free to save your history and get 20 credits")), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setView("memberSignup"),
          className: "bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition",
          style: { fontFamily: "'Noto Sans KR',sans-serif" }
        },
        t("\uBB34\uB8CC\uB85C \uAC00\uC785\uD558\uAE30 \u2192", "Sign up free \u2192")
      )), /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "PHQ9", score: r.total, level: lvl }), /* @__PURE__ */ React.createElement(
        ExpertCTA,
        {
          testType: "PHQ9",
          score: r.total,
          level: lvl,
          onContinueAI: () => {
            setChatOpen(true);
            window.scrollTo(0, document.body.scrollHeight);
          }
        }
      ));
    })(), /* @__PURE__ */ React.createElement(ChatBox, { testType: "PHQ9", initialPrompts: lang === "en" ? [
      "What does my PHQ-9 result mean?",
      "What is my mental state based on this score?",
      "What can I do daily to improve depressive symptoms?",
      "Do I need professional counseling based on this result?"
    ] : [
      "\uC81C PHQ-9 \uAC80\uC0AC \uACB0\uACFC\uAC00 \uC5B4\uB5A4 \uC758\uBBF8\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
      "\uC774 \uC810\uC218\uB85C \uBCF4\uC544 \uC800\uB294 \uC5B4\uB5A4 \uC0C1\uD0DC\uC778\uAC00\uC694?",
      "\uC6B0\uC6B8 \uC99D\uC0C1\uC744 \uAC1C\uC120\uD558\uAE30 \uC704\uD574 \uC77C\uC0C1\uC5D0\uC11C \uD560 \uC218 \uC788\uB294 \uAC83\uC774 \uC788\uB098\uC694?",
      "\uC804\uBB38\uAC00 \uC0C1\uB2F4\uC774 \uD544\uC694\uD55C \uC218\uC900\uC778\uC9C0 \uD310\uB2E8\uD574\uC8FC\uC138\uC694"
    ] })));
  }
  if (view === "gad7Result") {
    const result = calcGad7();
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-orange-800" }, "\u{1F630} ", t("GAD-7 \uBD88\uC548 \uC790\uAC00\uC810\uAC80 \uACB0\uACFC", "GAD-7 Anxiety Screening Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "border rounded-lg p-4 mb-6 bg-gray-50" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC138\uC158 ID:", "Session ID:")), " ", sessionId), /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC804\uD654\uBC88\uD638:", "Phone:")), " ", userInfo.phone || "N/A"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold mt-2" }, t("\uCD1D\uC810:", "Total:"), " ", result.total, "/21 (", result.level, ")")), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-lg mb-6 ${result.color === "green" ? "bg-green-50 border border-green-200" : result.color === "yellow" ? "bg-yellow-50 border border-yellow-200" : result.color === "orange" ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"}` }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uD574\uC11D", "Interpretation")), /* @__PURE__ */ React.createElement("p", { className: "text-sm" }, result.total < 5 && t("\uC9C0\uAE08 \uB9C8\uC74C\uC774 \uBE44\uAD50\uC801 \uC548\uC815\uC801\uC785\uB2C8\uB2E4.", "Your anxiety level seems minimal right now."), result.total >= 5 && result.total < 10 && t("\uB9C8\uC74C\uC774 \uC870\uAE08 \uC870\uC5EC\uB4DC\uB294 \uD3B8\uC785\uB2C8\uB2E4. \uCDA9\uBD84\uD788 \uC26C\uC5B4\uAC00\uB294 \uAC83\uC774 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uC5B4\uC694.", "You may be feeling some tension. Getting enough rest can help."), result.total >= 10 && result.total < 15 && t("\uB9CE\uC774 \uAE34\uC7A5\uD558\uACE0 \uAC71\uC815\uC774 \uB9CE\uC73C\uC2E0 \uAC83 \uAC19\uC544\uC694. \uBD80\uB2F4\uC744 \uB098\uB20C \uC218 \uC788\uB294 \uACF5\uAC04\uC744 \uCC3E\uC544\uBCF4\uC138\uC694.", "It seems you're quite tense and worried. Find a space to share the burden."), result.total >= 15 && t("\uC694\uC998 \uB9C8\uC74C\uC774 \uB9CE\uC774 \uBD88\uC548\uD558\uC2E0 \uAC83 \uAC19\uC544\uC694. \uC544\uB798 \uC0C1\uB2F4 \uC5F0\uACB0\uC744 \uD1B5\uD574 \uB3C4\uC6C0\uC744 \uBC1B\uC544\uBCF4\uC138\uC694.", "Your anxiety seems quite high. Please reach out for support below."))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uC751\uB2F5 \uB0B4\uC5ED", "Response History")), gad7Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b pb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, q.num, ". ", q.content), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold" }, t("\uC751\uB2F5:", "Score:"), " ", gad7Responses[q.num] ?? "-", t("\uC810", ""))))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "GAD7",
        onRun: () => {
          const r = calcGad7();
          runAiAnalysis("GAD7", "GAD7", {
            total: r.total,
            level: r.level,
            items: gad7Q.map((q) => ({ question: q.content, score: gad7Responses[q.num] || 0 }))
          });
        }
      }
    ), (() => {
      const r = calcGad7();
      return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F630} GAD-7 \uBD88\uC548 \uAC80\uC0AC \uACB0\uACFC
\uCD1D\uC810: ${r.total}/21 (${r.level})
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC2EC\uB9AC\uAC80\uC0AC`, `\u{1F630} GAD-7 Anxiety Result
Total: ${r.total}/21 (${r.level})
Tested on Maumful! https://maumful.com`), testLabel: t("GAD-7 \uBD88\uC548 \uC790\uAC00\uC810\uAC80", "GAD-7 Anxiety Screening"), scoreText: `${r.total}/21`, levelText: r.level, colorHex: "#1a3a5c" });
    })(), (() => {
      const r = calcGad7();
      const lvl = r.total >= 15 ? "high" : r.total >= 10 ? "mid" : "low";
      return /* @__PURE__ */ React.createElement(React.Fragment, null, !isLoggedIn && /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-2xl mb-2" }, "\u{1F499}"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-blue-800 mb-1" }, t("\uACB0\uACFC\uB97C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC73C\uC2E0\uAC00\uC694?", "Want to save your results?")), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-blue-700 mb-3" }, t("\uBB34\uB8CC \uAC00\uC785\uD558\uBA74 \uAC80\uC0AC \uC774\uB825 \uC800\uC7A5 + 20 \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB429\uB2C8\uB2E4", "Sign up free to save your history and get 20 credits")), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setView("memberSignup"),
          className: "bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition",
          style: { fontFamily: "'Noto Sans KR',sans-serif" }
        },
        t("\uBB34\uB8CC\uB85C \uAC00\uC785\uD558\uAE30 \u2192", "Sign up free \u2192")
      )), /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "GAD7", score: r.total, level: lvl }), /* @__PURE__ */ React.createElement(
        ExpertCTA,
        {
          testType: "GAD7",
          score: r.total,
          level: lvl,
          onContinueAI: () => {
            setChatOpen(true);
            window.scrollTo(0, document.body.scrollHeight);
          }
        }
      ));
    })(), /* @__PURE__ */ React.createElement(ChatBox, { testType: "GAD7", initialPrompts: lang === "en" ? [
      "What does my GAD-7 result mean?",
      "Are there specific items in the GAD-7 I should pay attention to?",
      "How are anxiety and daily functioning related?",
      "What are immediate strategies to reduce anxiety?"
    ] : [
      "\uBD88\uC548 \uC99D\uC0C1\uC774 \uC2EC\uD55C \uACBD\uC6B0 \uCD08\uAE30 \uC0C1\uB2F4 \uC804\uB7B5\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
      "GAD-7 \uACB0\uACFC\uC5D0\uC11C \uD2B9\uD788 \uC8FC\uBAA9\uD574\uC57C \uD560 \uBB38\uD56D\uC774 \uC788\uB098\uC694?",
      "\uBD88\uC548\uACFC \uC77C\uC0C1 \uAE30\uB2A5 \uC800\uD558\uC758 \uAD00\uACC4\uB97C \uC5B4\uB5BB\uAC8C \uC774\uD574\uD558\uBA74 \uC88B\uC744\uAE4C\uC694?",
      "\uBD88\uC548 \uC644\uD654\uB97C \uC704\uD55C \uC989\uAC01\uC801\uC778 \uAC1C\uC785 \uBC29\uBC95\uC744 \uC54C\uB824\uC8FC\uC138\uC694"
    ] })));
  }
  if (view === "riasecResult") {
    if (Object.keys(riasecResponses).length === 0) {
      setView(isLoggedIn ? "memberDashboard" : "testsIntro");
      return null;
    }
    const { scores, sorted, dominantType } = calcRiasec();
    const top1 = RIASEC_TYPE_INFO[sorted[0][0]];
    const top2 = RIASEC_TYPE_INFO[sorted[1][0]];
    const maxScore = 25;
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-violet-800" }, "\u{1F50D} ", t("Holland RIASEC \uACB0\uACFC", "Holland RIASEC Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-6 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-2" }, top1.emoji, top2.emoji), /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-violet-800 mb-1" }, dominantType, t("\uD615", ""), " \u2014 ", top1.name, "\xB7", top2.name), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mt-2" }, top1.desc)), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700 mb-3" }, t("\uC720\uD615\uBCC4 \uC810\uC218", "Scores by Type")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, sorted.map(([type, score], i) => {
      const info = RIASEC_TYPE_INFO[type];
      return /* @__PURE__ */ React.createElement("div", { key: type }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-gray-700" }, info.emoji, " ", type, " ", info.name), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-violet-700" }, score, "/", maxScore)), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-100 rounded-full h-3" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-3 rounded-full transition-all ${i === 0 ? "bg-violet-600" : i === 1 ? "bg-violet-400" : "bg-violet-200"}`,
          style: { width: `${score / maxScore * 100}%` }
        }
      )));
    }))), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700 mb-3" }, t("\uCD94\uCC9C \uC9C1\uC5C5\xB7\uC5ED\uD560", "Recommended Careers & Roles")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, [...top1.careers, ...top2.careers].map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "bg-violet-50 border border-violet-100 rounded-xl p-3 text-sm font-semibold text-violet-800 text-center" }, c)))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "RIASEC",
        onRun: () => {
          runAiAnalysis("RIASEC", "RIASEC", {
            dominant_type: dominantType,
            top1: { type: sorted[0][0], name: top1.name, score: sorted[0][1] },
            top2: { type: sorted[1][0], name: top2.name, score: sorted[1][1] },
            scores
          });
        }
      }
    ), /* @__PURE__ */ React.createElement(
      ShareResultButton,
      {
        text: `\u{1F50D} Holland RIASEC \uAC80\uC0AC \uACB0\uACFC
${dominantType}\uD615 (${top1.name}\xB7${top2.name})
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC9C4\uB85C\uAC80\uC0AC`,
        testLabel: "Holland RIASEC \uC9C1\uC5C5 \uD765\uBBF8 \uAC80\uC0AC",
        scoreText: `${dominantType}\uD615`,
        levelText: `${top1.name}\xB7${top2.name}`,
        colorHex: "#5b21b6"
      }
    ), isLoggedIn && /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-violet-800 mb-2" }, "\u{1F3AF} ", t("\uC774 \uACB0\uACFC\uB97C AI \uC0C1\uB2F4\uC5D0 \uD65C\uC6A9\uD558\uC138\uC694", "Use this result in AI counseling")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setChatOpen(true);
          window.scrollTo(0, document.body.scrollHeight);
        },
        className: "bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-violet-800 transition"
      },
      t("AI \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC9C4\uB85C \uC870\uC5B8 \uBC1B\uAE30 \u2192", "Get Career Advice from AI \u2192")
    )), /* @__PURE__ */ React.createElement(ChatBox, { testType: "RIASEC", initialPrompts: t([
      `\uC81C RIASEC \uACB0\uACFC ${dominantType}\uD615\uC774 \uC5B4\uB5A4 \uC758\uBBF8\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694`,
      "\uC774 \uC720\uD615\uC5D0 \uB9DE\uB294 \uC9C4\uB85C \uBC29\uD5A5\uC744 \uCD94\uCC9C\uD574 \uC8FC\uC138\uC694",
      "\uD604\uC7AC \uD558\uB294 \uC77C\uACFC \uC81C \uD765\uBBF8 \uC720\uD615\uC758 \uC801\uD569\uB3C4\uAC00 \uC5B4\uB5A4\uAC00\uC694?",
      "\uAC15\uC810\uC744 \uC0B4\uB9B4 \uC218 \uC788\uB294 \uAD6C\uCCB4\uC801\uC778 \uC9C1\uC5C5 \uD65C\uB3D9\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?"
    ], [
      `What does my RIASEC type ${dominantType} mean?`,
      "What career paths suit my interest type?",
      "How well does my current job match my interest type?",
      "What specific work activities best leverage my strengths?"
    ]) })));
  }
  if (view === "valuesResult") {
    if (Object.keys(valuesResponses).length === 0) {
      setView(isLoggedIn ? "memberDashboard" : "testsIntro");
      return null;
    }
    const { scores, sorted } = calcValues();
    const top3 = sorted.slice(0, 3);
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-amber-800" }, "\u{1F48E} ", t("\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uACB0\uACFC", "Work Values Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-amber-800 mb-3 text-center" }, t("\uB098\uC758 \uD575\uC2EC \uC9C1\uC5C5 \uAC00\uCE58", "My Top Work Values")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, top3.map(([key, score], i) => {
      const info = VALUES_DOMAIN_INFO[key];
      return /* @__PURE__ */ React.createElement("div", { key, className: "bg-white border border-amber-200 rounded-xl p-3 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl mb-1" }, info.emoji), /* @__PURE__ */ React.createElement("div", { className: `text-xs font-bold mb-1 ${i === 0 ? "text-amber-600" : "text-gray-700"}` }, i === 0 ? "\u{1F947} " : i === 1 ? "\u{1F948} " : "\u{1F949} ", info.label), /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-gray-800" }, score, t("\uC810", "")));
    })), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700 mt-3 text-center" }, VALUES_DOMAIN_INFO[top3[0][0]].desc)), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700 mb-3" }, t("\uC804\uCCB4 \uAC00\uCE58 \uC21C\uC704", "Full Value Rankings")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, sorted.map(([key, score], i) => {
      const info = VALUES_DOMAIN_INFO[key];
      return /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-gray-700" }, info.emoji, " ", info.label), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-amber-700" }, score, t("\uC810", ""))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-100 rounded-full h-2.5" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-2.5 rounded-full transition-all ${i < 3 ? "bg-amber-500" : "bg-amber-200"}`,
          style: { width: `${score}%` }
        }
      )));
    }))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "VALUES",
        onRun: () => {
          runAiAnalysis("VALUES", "VALUES", {
            top3: top3.map(([key, score]) => ({ key, label: VALUES_DOMAIN_INFO[key].label, score })),
            scores
          });
        }
      }
    ), /* @__PURE__ */ React.createElement(
      ShareResultButton,
      {
        text: `\u{1F48E} \uC9C1\uC5C5\uAC00\uCE58\uAD00 \uAC80\uC0AC \uACB0\uACFC
1\uC704: ${VALUES_DOMAIN_INFO[top3[0][0]].emoji}${VALUES_DOMAIN_INFO[top3[0][0]].label} (${top3[0][1]}\uC810)
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC9C4\uB85C\uAC80\uC0AC`,
        testLabel: "\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uAC80\uC0AC",
        scoreText: `${VALUES_DOMAIN_INFO[top3[0][0]].label} 1\uC704`,
        levelText: `${top3[0][1]}\uC810`,
        colorHex: "#92400e"
      }
    ), isLoggedIn && /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-amber-800 mb-2" }, "\u{1F4A1} ", t("\uB098\uC758 \uAC00\uCE58\uC5D0 \uB9DE\uB294 \uC9C1\uC5C5\uC744 \uD0D0\uC0C9\uD574 \uBCF4\uC138\uC694", "Explore careers that match your values")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setChatOpen(true);
          window.scrollTo(0, document.body.scrollHeight);
        },
        className: "bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition"
      },
      t("AI \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC9C4\uB85C \uC870\uC5B8 \uBC1B\uAE30 \u2192", "Get Career Advice from AI \u2192")
    )), /* @__PURE__ */ React.createElement(ChatBox, { testType: "VALUES", initialPrompts: t([
      `\uC81C 1\uC704 \uAC00\uCE58\uC778 '${VALUES_DOMAIN_INFO[top3[0][0]].label}'\uAC00 \uC5B4\uB5A4 \uC758\uBBF8\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694`,
      "\uC774 \uAC00\uCE58\uAD00\uC5D0 \uB9DE\uB294 \uC9C1\uC5C5\uC744 \uCD94\uCC9C\uD574 \uC8FC\uC138\uC694",
      "\uD604\uC7AC \uC9C1\uC5C5\uACFC \uC81C \uAC00\uCE58\uAD00\uC774 \uC5BC\uB9C8\uB098 \uB9DE\uB294\uC9C0 \uBD84\uC11D\uD574 \uC8FC\uC138\uC694",
      "\uC9C1\uC5C5 \uC120\uD0DD \uC2DC \uC774 \uAC00\uCE58\uAD00\uC744 \uC5B4\uB5BB\uAC8C \uD65C\uC6A9\uD558\uBA74 \uC88B\uC744\uAE4C\uC694?"
    ], [
      `What does my top work value '${VALUES_DOMAIN_INFO[top3[0][0]].label}' mean?`,
      "What careers align with my work values?",
      "How well does my current job match my values?",
      "How can I use these values when choosing a career?"
    ]) })));
  }
  if (view === "dass21Result") {
    const result = calcDass21();
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-teal-800" }, "\u{1F4CA} ", t("DASS-21 \uACB0\uACFC", "DASS-21 Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-lg border-2 ${result.depression.color === "green" ? "border-green-300 bg-green-50" : result.depression.color === "blue" ? "border-blue-300 bg-blue-50" : result.depression.color === "yellow" ? "border-yellow-300 bg-yellow-50" : result.depression.color === "orange" ? "border-orange-300 bg-orange-50" : "border-red-300 bg-red-50"}` }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg mb-2" }, "\u{1F614} ", t("\uC6B0\uC6B8", "Depression")), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, result.depression.score), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-1" }, result.depression.level)), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-lg border-2 ${result.anxiety.color === "green" ? "border-green-300 bg-green-50" : result.anxiety.color === "blue" ? "border-blue-300 bg-blue-50" : result.anxiety.color === "yellow" ? "border-yellow-300 bg-yellow-50" : result.anxiety.color === "orange" ? "border-orange-300 bg-orange-50" : "border-red-300 bg-red-50"}` }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg mb-2" }, "\u{1F630} ", t("\uBD88\uC548", "Anxiety")), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, result.anxiety.score), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-1" }, result.anxiety.level)), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-lg border-2 ${result.stress.color === "green" ? "border-green-300 bg-green-50" : result.stress.color === "blue" ? "border-blue-300 bg-blue-50" : result.stress.color === "yellow" ? "border-yellow-300 bg-yellow-50" : result.stress.color === "orange" ? "border-orange-300 bg-orange-50" : "border-red-300 bg-red-50"}` }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg mb-2" }, "\u{1F613} ", t("\uC2A4\uD2B8\uB808\uC2A4", "Stress")), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, result.stress.score), /* @__PURE__ */ React.createElement("p", { className: "text-sm mt-1" }, result.stress.level))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uC751\uB2F5 \uB0B4\uC5ED", "Response History")), dass21Q.map((q) => /* @__PURE__ */ React.createElement("div", { key: q.num, className: "border-b pb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, q.num, ". ", q.content, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, "(", q.scale, ")")), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold" }, t("\uC751\uB2F5:", "Score:"), " ", dass21Responses[q.num])))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "DASS21",
        onRun: () => {
          const r = calcDass21();
          runAiAnalysis("DASS21", "DASS21", {
            depression: { score: r.depression.score, level: r.depression.level },
            anxiety: { score: r.anxiety.score, level: r.anxiety.level },
            stress: { score: r.stress.score, level: r.stress.level }
          });
        }
      }
    ), (() => {
      const r = calcDass21();
      return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F4CA} DASS-21 \uACB0\uACFC
\uC6B0\uC6B8: ${r.depression.score}\uC810 / \uBD88\uC548: ${r.anxiety.score}\uC810 / \uC2A4\uD2B8\uB808\uC2A4: ${r.stress.score}\uC810
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC2EC\uB9AC\uAC80\uC0AC`, `\u{1F4CA} DASS-21 Result
Depression: ${r.depression.score} / Anxiety: ${r.anxiety.score} / Stress: ${r.stress.score}
Tested on Maumful! https://maumful.com`), testLabel: t("DASS-21 \uC885\uD569 \uC815\uC11C\uAC80\uC0AC", "DASS-21 Comprehensive Emotional Assessment"), scoreText: t(`\uC6B0\uC6B8 ${r.depression.score} / \uBD88\uC548 ${r.anxiety.score}`, `D:${r.depression.score} / A:${r.anxiety.score}`), levelText: t(`\uC2A4\uD2B8\uB808\uC2A4 ${r.stress.score}\uC810`, `Stress: ${r.stress.score}`), colorHex: "#2c5364" });
    })(), (() => {
      var _a2;
      const r = calcDass21();
      const lvl = r.depression >= 21 || r.anxiety >= 15 || r.stress >= 27 ? "high" : r.depression >= 14 || r.anxiety >= 10 ? "mid" : "low";
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "DASS21", score: 0, level: lvl, stressScore: (_a2 = r.stress) == null ? void 0 : _a2.score }), /* @__PURE__ */ React.createElement(
        ExpertCTA,
        {
          testType: "DASS21",
          score: 0,
          level: lvl,
          onContinueAI: () => {
            setChatOpen(true);
            window.scrollTo(0, document.body.scrollHeight);
          }
        }
      ));
    })(), /* @__PURE__ */ React.createElement(ChatBox, { testType: "DASS21", initialPrompts: t([
      "\uC6B0\uC6B8/\uBD88\uC548/\uC2A4\uD2B8\uB808\uC2A4\uAC00 \uBAA8\uB450 \uB192\uC744 \uB54C \uC6B0\uC120\uC21C\uC704\uB294 \uBB34\uC5C7\uC778\uAC00\uC694?",
      "DASS-21 \uACB0\uACFC\uC5D0\uC11C \uAC00\uC7A5 \uC2DC\uAE09\uD55C \uAC1C\uC785 \uC601\uC5ED\uC740 \uC5B4\uB514\uC778\uAC00\uC694?",
      "\uC138 \uAC00\uC9C0 \uC601\uC5ED \uAC04\uC758 \uC0C1\uD638\uC791\uC6A9\uC744 \uC5B4\uB5BB\uAC8C \uC774\uD574\uD574\uC57C \uD558\uB098\uC694?",
      "\uAC01 \uC601\uC5ED\uBCC4 \uB9DE\uCDA4 \uC0C1\uB2F4 \uC804\uB7B5\uC744 \uC81C\uC548\uD574\uC8FC\uC138\uC694"
    ], [
      "What should I prioritize when depression, anxiety, and stress are all high?",
      "Which area of my DASS-21 results needs the most urgent attention?",
      "How should I understand the interaction between the three domains?",
      "Can you suggest tailored strategies for each domain?"
    ]) })));
  }
  if (view === "burnoutResult") {
    if (Object.keys(burnoutResponses).length === 0) {
      return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-red-600 mb-4" }, "\u26A0\uFE0F ", t("\uB370\uC774\uD130 \uC624\uB958", "Data Error")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-4" }, t("\uAC80\uC0AC \uC751\uB2F5 \uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "No response data found.")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mb-4" }, t("\uC138\uC158 ID:", "Session ID:"), " ", sessionId || "N/A"), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500" }, "\u2190 ", t("\uB3CC\uC544\uAC00\uAE30", "Back"))));
    }
    try {
      const result = calcBurnout();
      if (!result || !result.domains) {
        return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-red-600 mb-4" }, "\u26A0\uFE0F ", t("\uB370\uC774\uD130 \uC624\uB958", "Data Error")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-4" }, t("\uAC80\uC0AC \uACB0\uACFC\uB97C \uACC4\uC0B0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "Unable to calculate results.")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500" }, "\u2190 ", t("\uB3CC\uC544\uAC00\uAE30", "Back"))));
      }
      const { domains, totalScore, percentage, level, crisis, domainCrisis } = result;
      const levelConfig = {
        "\uB9E4\uC6B0 \uB0AE\uC74C": { color: "bg-green-100 text-green-800 border-green-300", icon: "\u{1F60A}", en: "Very Low" },
        "\uB0AE\uC74C": { color: "bg-blue-100 text-blue-800 border-blue-300", icon: "\u{1F642}", en: "Low" },
        "\uBCF4\uD1B5": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "\u{1F610}", en: "Moderate" },
        "\uB192\uC74C": { color: "bg-orange-100 text-orange-800 border-orange-300", icon: "\u{1F630}", en: "High" },
        "\uB9E4\uC6B0 \uB192\uC74C": { color: "bg-red-100 text-red-800 border-red-300", icon: "\u{1F525}", en: "Very High" }
      };
      const config = levelConfig[level] || levelConfig["\uBCF4\uD1B5"];
      const levelLabel = lang === "en" ? config.en || level : level;
      return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-red-600" }, "\u{1F525} ", t("\uBC88\uC544\uC6C3 \uC99D\uD6C4\uAD70 \uAC80\uC0AC \uACB0\uACFC (K-MBI+)", "Burnout Syndrome Result (K-MBI+)")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), crisis && /* @__PURE__ */ React.createElement("div", { className: "mb-6 bg-orange-50 border-2 border-orange-300 rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F534}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-orange-700 mb-2" }, t("\uC18C\uC9C4 \uC2E0\uD638\uAC00 \uB192\uC544\uC694", "High Burnout Signal Detected")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-orange-700 mb-2" }, t("\uBC88\uC544\uC6C3 \uC2E0\uD638\uAC00 \uC804\uBC18\uC801\uC73C\uB85C \uB192\uAC8C \uB098\uD0C0\uB0AC\uC2B5\uB2C8\uB2E4.", "Your burnout indicators are significantly elevated across multiple areas.")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-orange-700 font-semibold" }, t("\uC9C0\uAE08 \uC7A0\uC2DC \uBA48\uCD94\uACE0, \uCDA9\uBD84\uD788 \uC26C\uC5B4\uAC00\uB294 \uC2DC\uAC04\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. \uD63C\uC790 \uAC10\uB2F9\uD558\uC9C0 \uC54A\uC544\uB3C4 \uB3FC\uC694.", "It's important to pause and rest. You don't have to carry this alone."))))), /* @__PURE__ */ React.createElement("div", { className: `border-2 rounded-lg p-6 mb-6 ${config.color}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, t("\uC804\uCCB4 \uBC88\uC544\uC6C3 \uC218\uC900", "Overall Burnout Level")), /* @__PURE__ */ React.createElement("span", { className: "text-5xl" }, config.icon)), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-4 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-5xl font-bold" }, totalScore), /* @__PURE__ */ React.createElement("span", { className: "text-2xl text-gray-600" }, "/ ", t("240\uC810", "240")), /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-bold ml-4" }, percentage, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-6 mb-3" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-6 rounded-full ${percentage >= 75 ? "bg-red-600" : percentage >= 50 ? "bg-orange-500" : percentage >= 30 ? "bg-yellow-500" : "bg-green-500"}`,
          style: { width: `${percentage}%` }
        }
      )), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold" }, levelLabel)), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold mb-4 text-gray-800" }, "\u{1F4CA} ", t("\uC601\uC5ED\uBCC4 \uBD84\uC11D", "Domain Analysis")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, domains.map((domain, idx) => {
        const isCrisis = domainCrisis.includes(domain.name);
        return /* @__PURE__ */ React.createElement("div", { key: domain.id || idx, className: `border rounded-lg p-4 ${isCrisis ? "bg-red-50 border-red-300" : "bg-white"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg" }, domain.name), isCrisis && /* @__PURE__ */ React.createElement("span", { className: "text-red-600 font-bold text-sm" }, "\u26A0\uFE0F ", t("\uC704\uAE30", "Critical"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-bold" }, domain.score), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-600" }, "/ ", domain.max, t("\uC810", "")), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-bold ml-2" }, domain.percentage, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-3 mb-2" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `h-3 rounded-full ${isCrisis ? "bg-red-600" : "bg-blue-500"}`,
            style: { width: `${domain.percentage}%` }
          }
        )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mb-2" }, /* @__PURE__ */ React.createElement("strong", null, t("\uC218\uC900:", "Level:")), " ", domain.level), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700" }, domain.description));
      }))), /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold mb-4 text-blue-800" }, "\u{1F4A1} ", t("\uACB0\uACFC \uD574\uC11D \uBC0F \uAD8C\uACE0\uC0AC\uD56D", "Results & Recommendations")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 text-sm text-gray-700" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-base mb-1" }, "\u{1F4CC} ", t("\uC810\uC218 \uD574\uC11D \uAE30\uC900:", "Score Guide:")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ml-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, t("0-30%: \uB9E4\uC6B0 \uB0AE\uC74C (\uAC74\uAC15\uD55C \uC0C1\uD0DC)", "0\u201330%: Very Low (Healthy)")), /* @__PURE__ */ React.createElement("li", null, t("31-50%: \uB0AE\uC74C (\uC8FC\uC758 \uD544\uC694)", "31\u201350%: Low (Worth monitoring)")), /* @__PURE__ */ React.createElement("li", null, t("51-70%: \uBCF4\uD1B5 (\uAD00\uB9AC \uD544\uC694)", "51\u201370%: Moderate (Needs management)")), /* @__PURE__ */ React.createElement("li", null, t("71-85%: \uB192\uC74C (\uC0C1\uB2F4 \uAD8C\uC7A5)", "71\u201385%: High (Counseling recommended)")), /* @__PURE__ */ React.createElement("li", null, t("86-100%: \uB9E4\uC6B0 \uB192\uC74C (\uC989\uC2DC \uAC1C\uC785 \uD544\uC694)", "86\u2013100%: Very High (Immediate attention needed)")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-base mb-1" }, "\u{1FA7A} ", t("\uAD8C\uC7A5 \uC870\uCE58:", "Recommended Actions:")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ml-5 space-y-1" }, percentage < 30 && /* @__PURE__ */ React.createElement("li", null, t("\uD604\uC7AC \uAC74\uAC15\uD55C \uC0C1\uD0DC\uB97C \uC720\uC9C0\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC9C0\uC18D\uC801\uC778 \uC790\uAE30 \uAD00\uB9AC\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.", "You are in a healthy state. Keep up your self-care routines.")), percentage >= 30 && percentage < 50 && /* @__PURE__ */ React.createElement("li", null, t("\uAC00\uBCBC\uC6B4 \uBC88\uC544\uC6C3 \uC99D\uC0C1\uC774 \uB098\uD0C0\uB098\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uCDA9\uBD84\uD55C \uD734\uC2DD\uACFC \uC2A4\uD2B8\uB808\uC2A4 \uAD00\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", "Mild burnout signs are present. Rest and stress management will help.")), percentage >= 50 && percentage < 70 && /* @__PURE__ */ React.createElement("li", null, t("\uBC88\uC544\uC6C3 \uC99D\uC0C1\uC774 \uBCF4\uD1B5 \uC218\uC900\uC785\uB2C8\uB2E4. \uC804\uBB38\uAC00 \uC0C1\uB2F4 \uBC0F \uC0DD\uD65C \uC2B5\uAD00 \uAC1C\uC120\uC744 \uACE0\uB824\uD574 \uBCF4\uC138\uC694.", "Moderate burnout detected. Consider professional counseling and lifestyle adjustments.")), percentage >= 70 && percentage < 85 && /* @__PURE__ */ React.createElement("li", null, t("\uB192\uC740 \uC218\uC900\uC758 \uBC88\uC544\uC6C3\uC785\uB2C8\uB2E4. \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640\uC758 \uC0C1\uB2F4\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.", "High burnout level. We recommend speaking with a professional counselor.")), percentage >= 85 && /* @__PURE__ */ React.createElement("li", null, t("\uC18C\uC9C4 \uC2E0\uD638\uAC00 \uB9E4\uC6B0 \uB192\uC2B5\uB2C8\uB2E4. \uC9C0\uAE08 \uC26C\uC5B4\uAC00\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4. \uC804\uBB38\uAC00 \uC0C1\uB2F4\uC744 \uAD8C\uD569\uB2C8\uB2E4.", "Burnout signals are very high. Rest is essential right now. Please seek professional support.")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-base mb-1" }, "\u{1F331} ", t("\uC790\uAC00 \uAD00\uB9AC \uD301:", "Self-Care Tips:")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ml-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, t("\uADDC\uCE59\uC801\uC778 \uC218\uBA74 \uD328\uD134 \uC720\uC9C0 (\uD558\uB8E8 7-8\uC2DC\uAC04)", "Maintain a regular sleep schedule (7\u20138 hours/day)")), /* @__PURE__ */ React.createElement("li", null, t("\uC5C5\uBB34\uC640 \uAC1C\uC778 \uC2DC\uAC04\uC758 \uBA85\uD655\uD55C \uACBD\uACC4 \uC124\uC815", "Set clear boundaries between work and personal time")), /* @__PURE__ */ React.createElement("li", null, t("\uCDE8\uBBF8 \uD65C\uB3D9 \uBC0F \uC0AC\uD68C\uC801 \uAD00\uACC4 \uC720\uC9C0", "Keep up hobbies and social connections")), /* @__PURE__ */ React.createElement("li", null, t("\uC815\uAE30\uC801\uC778 \uC2E0\uCCB4 \uD65C\uB3D9 (\uC8FC 3\uD68C \uC774\uC0C1)", "Regular physical activity (3+ times/week)")), /* @__PURE__ */ React.createElement("li", null, t("\uB9C8\uC74C\uCC59\uAE40 \uBA85\uC0C1 \uBC0F \uC774\uC644 \uAE30\uBC95 \uC5F0\uC2B5", "Practice mindfulness and relaxation techniques")))))), /* @__PURE__ */ React.createElement(
        AiAnalysisBox,
        {
          aiKey: "BURNOUT",
          onRun: () => {
            const r = calcBurnout();
            runAiAnalysis("BURNOUT", "BURNOUT", {
              totalScore: r.totalScore,
              percentage: r.percentage,
              level: r.level,
              domains: r.domains
            });
          }
        }
      ), (() => {
        var _a2;
        const r = calcBurnout();
        const lvlEn = { \uB9E4\uC6B0\uB0AE\uC74C: "Very Low", \uB0AE\uC74C: "Low", \uBCF4\uD1B5: "Moderate", \uB192\uC74C: "High", \uB9E4\uC6B0\uB192\uC74C: "Very High" }[(_a2 = r.level) == null ? void 0 : _a2.replace(/\s/g, "")] || r.level;
        return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F525} K-MBI+ \uBC88\uC544\uC6C3 \uAC80\uC0AC \uACB0\uACFC
${r.level} (${r.percentage}%)
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uBC88\uC544\uC6C3`, `\u{1F525} K-MBI+ Burnout Result
${lvlEn} (${r.percentage}%)
Tested on Maumful! https://maumful.com`), testLabel: t("K-MBI+ \uBC88\uC544\uC6C3 \uAC80\uC0AC", "K-MBI+ Burnout Assessment"), scoreText: `${r.percentage}%`, levelText: lang === "en" ? lvlEn : r.level, colorHex: "#4a1942" });
      })(), (() => {
        const r = calcBurnout();
        const lvl = r.ee >= 27 ? "high" : r.ee >= 17 ? "mid" : "low";
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "BURNOUT", score: result.totalScore, level: lvl }), /* @__PURE__ */ React.createElement(
          ExpertCTA,
          {
            testType: "BURNOUT",
            score: 0,
            level: lvl,
            onContinueAI: () => {
              setChatOpen(true);
              window.scrollTo(0, document.body.scrollHeight);
            }
          }
        ));
      })(), /* @__PURE__ */ React.createElement(ChatBox, { testType: "BURNOUT", initialPrompts: t([
        "\uC18C\uC9C4 \uC218\uC900\uC774 \uB192\uC740 \uB0B4\uB2F4\uC790\uB97C \uC704\uD55C \uC989\uAC01\uC801\uC778 \uAC1C\uC785 \uBC29\uBC95\uC740?",
        "K-MBI+ \uACB0\uACFC\uC5D0\uC11C \uAC00\uC7A5 \uC6B0\uC120\uC801\uC73C\uB85C \uB2E4\uB904\uC57C \uD560 \uC601\uC5ED\uC740?",
        "\uC5C5\uBB34 \uBCF5\uADC0\uB97C \uC704\uD55C \uB2E8\uACC4\uC801 \uC811\uADFC \uBC29\uBC95\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
        "\uBC88\uC544\uC6C3 \uD68C\uBCF5\uC744 \uC704\uD55C \uC7A5\uAE30\uC801\uC778 \uC804\uB7B5\uC744 \uC81C\uC548\uD574\uC8FC\uC138\uC694"
      ], [
        "What immediate interventions help someone with high burnout?",
        "Which K-MBI+ area should I address first?",
        "What is a step-by-step approach to returning to work?",
        "Can you suggest a long-term strategy for burnout recovery?"
      ]) })));
    } catch (error) {
      return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-red-600 mb-4" }, "\u26A0\uFE0F ", t("\uC624\uB958 \uBC1C\uC0DD", "Error")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-4" }, t("\uACB0\uACFC \uD654\uBA74\uC744 \uD45C\uC2DC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "Unable to display results.")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mb-4" }, error.toString()), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500" }, "\u2190 ", t("\uB3CC\uC544\uAC00\uAE30", "Back"))));
    }
  }
  if (view === "big5Result") {
    const result = calcBig5();
    const big5FactorLabel = {
      "\uC678\uD5A5\uC131": t("\uC678\uD5A5\uC131", "Extraversion"),
      "\uCE5C\uD654\uC131": t("\uCE5C\uD654\uC131", "Agreeableness"),
      "\uC131\uC2E4\uC131": t("\uC131\uC2E4\uC131", "Conscientiousness"),
      "\uC2E0\uACBD\uC131": t("\uC2E0\uACBD\uC131", "Neuroticism"),
      "\uAC1C\uBC29\uC131": t("\uAC1C\uBC29\uC131", "Openness")
    };
    const big5FactorDesc = {
      "\uC678\uD5A5\uC131": (score) => score >= 3.5 ? t("\uC0AC\uAD50\uC801\uC774\uACE0 \uD65C\uB3D9\uC801\uC785\uB2C8\uB2E4", "Sociable and energetic") : t("\uC870\uC6A9\uD558\uACE0 \uB0B4\uC131\uC801\uC785\uB2C8\uB2E4", "Quiet and introspective"),
      "\uCE5C\uD654\uC131": (score) => score >= 3.5 ? t("\uD611\uC870\uC801\uC774\uACE0 \uCE5C\uC808\uD569\uB2C8\uB2E4", "Cooperative and kind") : t("\uB3C5\uB9BD\uC801\uC774\uACE0 \uACBD\uC7C1\uC801\uC785\uB2C8\uB2E4", "Independent and competitive"),
      "\uC131\uC2E4\uC131": (score) => score >= 3.5 ? t("\uACC4\uD68D\uC801\uC774\uACE0 \uCC45\uC784\uAC10\uC774 \uAC15\uD569\uB2C8\uB2E4", "Organized and responsible") : t("\uC735\uD1B5\uC131 \uC788\uACE0 \uC790\uBC1C\uC801\uC785\uB2C8\uB2E4", "Flexible and spontaneous"),
      "\uC2E0\uACBD\uC131": (score) => score >= 3.5 ? t("\uAC10\uC815\uC801\uC73C\uB85C \uBBFC\uAC10\uD569\uB2C8\uB2E4", "Emotionally sensitive") : t("\uC815\uC11C\uC801\uC73C\uB85C \uC548\uC815\uC801\uC785\uB2C8\uB2E4", "Emotionally stable"),
      "\uAC1C\uBC29\uC131": (score) => score >= 3.5 ? t("\uCC3D\uC758\uC801\uC774\uACE0 \uD638\uAE30\uC2EC\uC774 \uB9CE\uC2B5\uB2C8\uB2E4", "Creative and curious") : t("\uC2E4\uC6A9\uC801\uC774\uACE0 \uD604\uC2E4\uC801\uC785\uB2C8\uB2E4", "Practical and realistic")
    };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-purple-800" }, "\u{1F31F} ", t("Big5 \uC131\uACA9\uAC80\uC0AC \uACB0\uACFC", "Big Five Personality Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, Object.entries(result).map(([factor, score]) => /* @__PURE__ */ React.createElement("div", { key: factor, className: "border rounded-lg p-4 bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg" }, big5FactorLabel[factor] || factor), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-bold text-purple-600" }, score)), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-purple-600 h-3 rounded-full", style: { width: `${score / 5 * 100}%` } })), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, big5FactorDesc[factor] && big5FactorDesc[factor](score))))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 p-4 bg-purple-50 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold mb-2" }, t("\uD574\uC11D \uC548\uB0B4", "How to Read Your Results")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700" }, t("\uAC01 \uC694\uC778\uC740 1-5\uC810 \uBC94\uC704\uB85C \uCE21\uC815\uB429\uB2C8\uB2E4. 3.5\uC810 \uC774\uC0C1\uC740 \uD574\uB2F9 \uD2B9\uC131\uC774 \uAC15\uD568\uC744, 2.5\uC810 \uC774\uD558\uB294 \uD574\uB2F9 \uD2B9\uC131\uC774 \uC57D\uD568\uC744 \uC758\uBBF8\uD569\uB2C8\uB2E4. \uC911\uAC04 \uBC94\uC704(2.5-3.5)\uB294 \uADE0\uD615 \uC7A1\uD78C \uD2B9\uC131\uC744 \uB098\uD0C0\uB0C5\uB2C8\uB2E4.", "Each factor is scored on a 1\u20135 scale. A score of 3.5 or above indicates a strong trait, below 2.5 a weak trait, and the middle range (2.5\u20133.5) reflects a balanced characteristic."))), /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "BIG5",
        onRun: () => {
          const r = calcBig5();
          runAiAnalysis("BIG5", "BIG5", { factors: r });
        }
      }
    ), (() => {
      const r = calcBig5();
      const top = Object.entries(r).sort(([, a], [, b]) => b - a)[0];
      return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F31F} Big5 \uC131\uACA9\uAC80\uC0AC \uACB0\uACFC
\uAC00\uC7A5 \uB192\uC740 \uD2B9\uC131: ${top == null ? void 0 : top[0]} (${top == null ? void 0 : top[1]}/5)
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #\uC131\uACA9\uAC80\uC0AC`, `\u{1F31F} Big Five Personality Result
Top trait: ${top == null ? void 0 : top[0]} (${top == null ? void 0 : top[1]}/5)
Tested on Maumful! https://maumful.com`), testLabel: t("Big5 \uC131\uACA9 5\uC694\uC778 \uAC80\uC0AC", "Big Five Personality Test"), scoreText: (top == null ? void 0 : top[0]) || "", levelText: `${top == null ? void 0 : top[1]}/5`, colorHex: "#3b1f8c" });
    })(), /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "BIG5", score: 0, level: "low" }), /* @__PURE__ */ React.createElement(
      ExpertCTA,
      {
        testType: "BIG5",
        score: 0,
        level: "low",
        onContinueAI: () => {
          setChatOpen(true);
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    ), /* @__PURE__ */ React.createElement(ChatBox, { testType: "BIG5", initialPrompts: t([
      "\uC131\uACA9 \uD2B9\uC131\uC744 \uC0C1\uB2F4\uC5D0 \uC5B4\uB5BB\uAC8C \uD65C\uC6A9\uD560 \uC218 \uC788\uB098\uC694?",
      "Big-5 \uACB0\uACFC\uC5D0\uC11C \uAC00\uC7A5 \uC8FC\uBAA9\uD574\uC57C \uD560 \uC694\uC778\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
      "\uC131\uACA9 \uAC15\uC810\uC744 \uBC1C\uACAC\uD558\uACE0 \uAC1C\uBC1C\uD558\uB294 \uBC29\uBC95\uC740?",
      "\uC131\uACA9 \uD2B9\uC131 \uAC04\uC758 \uC0C1\uD638\uC791\uC6A9\uC774 \uC0B6\uC5D0 \uC5B4\uB5A4 \uC601\uD5A5\uC744 \uBBF8\uCE58\uB098\uC694?"
    ], [
      "How can I use personality traits in counseling?",
      "Which Big-5 factor should I pay most attention to?",
      "How can I discover and develop my personality strengths?",
      "How do personality traits interact and affect my life?"
    ]) }), returnToCouple && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: goBackToCouple,
        className: "w-full mt-4 bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition"
      },
      "\u{1F495} \uB9C8\uC74C\uCEE4\uD50C\uB85C \uB3CC\uC544\uAC00\uAE30"
    )));
  }
  if (view === "lostResult") {
    const { axisAvg, typeCode, typeInfo, stressStyle, stabilityStyle } = calcLost();
    const counselingType2 = (activeLinkData == null ? void 0 : activeLinkData.counselingType) || "psychological";
    const counselingLabel = counselingType2 === "biblical" ? "\u{1F54A}\uFE0F \uAE30\uB3C5\uAD50 \uC0C1\uB2F4" : "\u{1F9E0} \uC2EC\uB9AC\uC0C1\uB2F4";
    const counselingColor = counselingType2 === "biblical" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-teal-50 border-teal-200 text-teal-700";
    const AXIS_LABELS = {
      E: { label: t("\uC5D0\uB108\uC9C0 \uBC29\uD5A5", "Energy Direction"), low: t("\uB0B4\uD5A5(I)", "Introversion (I)"), high: t("\uC678\uD5A5(E)", "Extroversion (E)"), color: "teal" },
      D: { label: t("\uC758\uC0AC\uACB0\uC815", "Decision-Making"), low: t("\uAC10\uC815(F)", "Feeling (F)"), high: t("\uB17C\uB9AC(T)", "Logic (T)"), color: "blue" },
      S: { label: t("\uD589\uB3D9 \uC18D\uB3C4", "Action Speed"), low: t("\uC2E0\uC911(J)", "Judicious (J)"), high: t("\uBE60\uB984(P)", "Spontaneous (P)"), color: "orange" },
      N: { label: t("\uC548\uC815\uC131", "Stability"), low: t("\uC548\uC815(N)", "Stability (N)"), high: t("\uBCC0\uD654(C)", "Change (C)"), color: "green" },
      R: { label: t("\uAD00\uACC4 \uBBFC\uAC10\uB3C4", "Rel. Sensitivity"), low: t("\uB3C5\uB9BD(I)", "Independence (I)"), high: t("\uAD00\uACC4\uC911\uC2EC(R)", "Relational (R)"), color: "purple" },
      T: { label: t("\uC2A4\uD2B8\uB808\uC2A4", "Stress"), low: t("\uD68C\uD53C(V)", "Avoiding (V)"), high: t("\uC9C1\uBA74(A)", "Confronting (A)"), color: "red" }
    };
    const barColorMap = { teal: "bg-teal-500", blue: "bg-blue-500", orange: "bg-orange-400", green: "bg-green-500", purple: "bg-purple-500", red: "bg-red-400" };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 p-4" }, ProtectionLayers, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-teal-800" }, "\u{1F9ED} ", t("LOST \uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4 \uAC80\uC0AC \uACB0\uACFC", "LOST Behavioral Style Result")), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500" }, "\u2190 ", t("\uBAA9\uB85D", "Back"))), /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white text-center mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-6xl mb-2" }, typeInfo.icon), /* @__PURE__ */ React.createElement("div", { className: "text-3xl font-black mb-1" }, typeInfo.name), /* @__PURE__ */ React.createElement("div", { className: "text-teal-200 text-sm font-semibold mb-2" }, typeInfo.eng, " \xB7 ", t("\uC720\uD615 \uCF54\uB4DC:", "Type Code:"), " ", typeCode), /* @__PURE__ */ React.createElement("p", { className: "text-teal-100 text-sm leading-relaxed max-w-md mx-auto" }, typeInfo.desc), /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex justify-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold" }, t("\uC2A4\uD2B8\uB808\uC2A4:", "Stress:"), " ", stressStyle === "A" ? t("\uC9C1\uBA74\uD615", "Confronting") : t("\uD68C\uD53C\uD615", "Avoiding")), /* @__PURE__ */ React.createElement("span", { className: "bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold" }, t("\uBCC0\uD654 \uC120\uD638\uB3C4:", "Change Preference:"), " ", stabilityStyle === "\uBCC0\uD654\uC120\uD638" ? t("\uBCC0\uD654\uC120\uD638", "Prefers Change") : t("\uC548\uC815\uC120\uD638", "Prefers Stability")))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 justify-center mb-2" }, typeInfo.traits.map((tr) => /* @__PURE__ */ React.createElement("span", { key: tr, className: "bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold" }, tr)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-800 mb-4" }, "\u{1F4CA} ", t("6\uCD95 \uD504\uB85C\uD30C\uC77C", "6-Axis Profile")), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, Object.entries(AXIS_LABELS).map(([k, info]) => {
      const val = axisAvg[k] || 3;
      const pct = (val - 1) / 4 * 100;
      return /* @__PURE__ */ React.createElement("div", { key: k }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-gray-700" }, info.label), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, info.low), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-gray-800" }, Number(val).toFixed(2)), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, info.high))), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-3 relative" }, /* @__PURE__ */ React.createElement("div", { className: `h-3 rounded-full transition-all ${barColorMap[info.color]}`, style: { width: `${pct}%` } }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-1/2 w-0.5 h-3 bg-gray-400 opacity-50" })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs text-gray-400 mt-0.5" }, /* @__PURE__ */ React.createElement("span", null, "1.0"), /* @__PURE__ */ React.createElement("span", null, "3.0 (", t("\uC911\uB9BD", "Neutral"), ")"), /* @__PURE__ */ React.createElement("span", null, "5.0")));
    }))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-green-700 mb-3" }, "\u{1F4AA} ", t("\uAC15\uC810", "Strengths")), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2" }, typeInfo.strength.map((s, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex gap-2 text-sm text-gray-700" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-500 font-bold mt-0.5" }, "\u2713"), s)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-orange-600 mb-3" }, "\u26A0\uFE0F ", t("\uC131\uC7A5 \uD3EC\uC778\uD2B8", "Growth Areas")), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2" }, typeInfo.weakness.map((w, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex gap-2 text-sm text-gray-700" }, /* @__PURE__ */ React.createElement("span", { className: "text-orange-400 font-bold mt-0.5" }, "\u25B3"), w))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-800 mb-3" }, "\u{1F4A1} ", t("\uC0C1\uD669\uBCC4 \uD589\uB3D9 \uD301", "Situational Tips")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 border border-blue-100 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-blue-700 mb-1" }, "\u{1F3E2} ", t("\uC9C1\uC7A5", "Workplace")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700" }, typeInfo.work)), /* @__PURE__ */ React.createElement("div", { className: "bg-pink-50 border border-pink-100 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-pink-700 mb-1" }, "\u{1F491} ", t("\uC5F0\uC560\xB7\uAD00\uACC4", "Relationships")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700" }, typeInfo.love)), /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-50 border border-yellow-100 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-yellow-700 mb-1" }, "\u{1F624} ", t("\uC2A4\uD2B8\uB808\uC2A4", "Stress")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700" }, typeInfo.stress)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-800 mb-3" }, "\u{1F91D} ", t("\uC720\uD615 \uAD81\uD569", "Type Compatibility")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-green-700 mb-2" }, "\u2705 ", t("\uC798 \uB9DE\uB294 \uC720\uD615", "Compatible Types")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, typeInfo.match.map((m) => {
      const matchType = LOST_TYPES[m];
      return /* @__PURE__ */ React.createElement("span", { key: m, className: "bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold" }, matchType ? matchType.icon : "\u{1F91D}", " ", matchType ? matchType.name : m);
    }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-red-600 mb-2" }, "\u26A1 ", t("\uB9C8\uCC30\uC774 \uC788\uC744 \uC218 \uC788\uB294 \uC720\uD615", "Potentially Challenging Types")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, typeInfo.conflict.map((c) => {
      const conflictType = LOST_TYPES[c];
      return /* @__PURE__ */ React.createElement("span", { key: c, className: "bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-semibold" }, conflictType ? conflictType.icon : "\u26A1", " ", conflictType ? conflictType.name : c);
    }))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-800 mb-3" }, "\u{1F5FA}\uFE0F ", t("\uC804\uCCB4 16\uC720\uD615 \uB9F5", "All 16 Types")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2" }, Object.entries(LOST_TYPES).map(([code, typ]) => /* @__PURE__ */ React.createElement("div", { key: code, className: `rounded-lg p-2 border text-center text-xs transition ${code === typeCode ? "border-teal-500 bg-teal-50 shadow-md scale-105" : "border-gray-200 bg-gray-50"}` }, /* @__PURE__ */ React.createElement("div", { className: "text-xl mb-0.5" }, typ.icon), /* @__PURE__ */ React.createElement("div", { className: `font-bold text-xs ${code === typeCode ? "text-teal-800" : "text-gray-700"}` }, typ.name), /* @__PURE__ */ React.createElement("div", { className: "text-gray-400 text-xs" }, code))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement(
      AiAnalysisBox,
      {
        aiKey: "LOST",
        onRun: () => {
          const r = calcLost();
          runAiAnalysis("LOST", "LOST", {
            typeCode: r.typeCode,
            typeName: r.typeInfo.name,
            axisAvg: r.axisAvg,
            stressStyle: r.stressStyle,
            stabilityStyle: r.stabilityStyle
          });
        }
      }
    )), (() => {
      var _a2, _b2, _c2, _d2;
      const r = calcLost();
      return /* @__PURE__ */ React.createElement(ShareResultButton, { text: t(`\u{1F9ED} LOST \uD589\uB3D9 \uC720\uD615 \uAC80\uC0AC \uACB0\uACFC
\uC720\uD615: ${r.typeCode} ${r.typeInfo.name}
\uB9C8\uC74C\uD480\uC5D0\uC11C \uAC80\uC0AC\uD574\uBD24\uC5B4\uC694! https://maumful.com #\uB9C8\uC74C\uD480 #LOST`, `\u{1F9ED} LOST Behavioral Style Result
Type: ${r.typeCode} ${((_a2 = r.typeInfo) == null ? void 0 : _a2.eng) || ((_b2 = r.typeInfo) == null ? void 0 : _b2.name)}
Tested on Maumful! https://maumful.com`), testLabel: t("LOST \uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4 \uAC80\uC0AC", "LOST Behavioral System Assessment"), scoreText: r.typeCode, levelText: ((_c2 = r.typeInfo) == null ? void 0 : _c2.eng) || ((_d2 = r.typeInfo) == null ? void 0 : _d2.name), colorHex: "#7c4f1e" });
    })(), (() => {
      const r = calcLost();
      const lvl = "low";
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RecoveryCard, { testType: "LOST", score: 0, level: lvl }), /* @__PURE__ */ React.createElement(
        ExpertCTA,
        {
          testType: "LOST",
          score: 0,
          level: lvl,
          onContinueAI: () => {
            setChatOpen(true);
            window.scrollTo(0, document.body.scrollHeight);
          }
        }
      ));
    })(), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow p-5" }, /* @__PURE__ */ React.createElement(ChatBox, { testType: "LOST", initialPrompts: t([
      "\uC774 \uC720\uD615\uC758 \uAC00\uC7A5 \uD070 \uAC15\uC810\uC744 \uC0C1\uB2F4\uC5D0\uC11C \uC5B4\uB5BB\uAC8C \uD65C\uC6A9\uD560 \uC218 \uC788\uB098\uC694?",
      "\uD589\uB3D9 \uC720\uD615\uC774 \uB300\uC778\uAD00\uACC4\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC744 \uC124\uBA85\uD574 \uC8FC\uC138\uC694",
      "\uC2A4\uD2B8\uB808\uC2A4 \uBC18\uC751 \uBC29\uC2DD\uC744 \uAC1C\uC120\uD558\uB294 \uBC29\uBC95\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?",
      "\uC774 \uB0B4\uB2F4\uC790\uC5D0\uAC8C \uAC00\uC7A5 \uC801\uD569\uD55C \uC0C1\uB2F4 \uC811\uADFC\uBC95\uC740?"
    ], [
      "How can the key strengths of this behavioral type be used in counseling?",
      "How does this behavioral style affect interpersonal relationships?",
      "What are ways to improve stress response patterns?",
      "What counseling approach is best suited for this type?"
    ]) })), returnToCouple && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: goBackToCouple,
        className: "w-full bg-pink-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-600 transition"
      },
      "\u{1F495} \uB9C8\uC74C\uCEE4\uD50C\uB85C \uB3CC\uC544\uAC00\uAE30"
    )));
  }
  if (view === "admin") {
    const S = { card: "bg-white rounded-xl border border-gray-100 shadow-sm p-5", tabBtn: (active) => `px-4 py-2 text-sm font-semibold rounded-lg transition ${active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}` };
    if (!adminAuthenticated) {
      return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-3xl mb-2" }, "\u{1F510}"), /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold text-gray-800" }, "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778")), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          placeholder: "\uAD00\uB9AC\uC790 \uBE44\uBC00\uBC88\uD638",
          value: adminSecretInput,
          onChange: (e) => setAdminSecretInput(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && (setAdminAuthenticated(true), loadAdminOverview()),
          className: "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setAdminAuthenticated(true);
            loadAdminOverview();
          },
          className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition"
        },
        "\uB85C\uADF8\uC778"
      ), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "w-full text-sm text-gray-400 hover:text-gray-600 mt-3 text-center" }, "\u2190 \uB3CC\uC544\uAC00\uAE30")));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-200 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto px-4 py-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F6E0}\uFE0F"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, "\uB9C8\uC74C\uD480 \uAD00\uB9AC\uC790")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, adminLoading && /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("memberDashboard"), className: "text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg" }, "\u2190 \uB300\uC2DC\uBCF4\uB4DC")))), /* @__PURE__ */ React.createElement("main", { className: "max-w-5xl mx-auto px-4 py-6" }, adminMsg.text && /* @__PURE__ */ React.createElement("div", { className: `mb-4 px-4 py-3 rounded-xl text-sm font-medium ${adminMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}` }, adminMsg.text, /* @__PURE__ */ React.createElement("button", { onClick: () => setAdminMsg({ type: "", text: "" }), className: "ml-3 opacity-60 hover:opacity-100" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-6 flex-wrap" }, [["overview", "\u{1F4CA} \uAC1C\uC694"], ["users", "\u{1F465} \uC0AC\uC6A9\uC790"], ["payments", "\u{1F4B3} \uACB0\uC81C"], ["tests", "\u{1F4CB} \uAC80\uC0AC"]].map(([tab, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tab,
        onClick: () => {
          setAdminTab(tab);
          if (tab === "overview") loadAdminOverview();
          else if (tab === "users") loadAdminUsers();
          else if (tab === "payments") loadAdminPayments();
        },
        className: S.tabBtn(adminTab === tab)
      },
      label
    ))), adminTab === "overview" && adminStats && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" }, [
      { label: "\uCD1D \uAC00\uC785\uC790", val: (_b = (_a = adminStats.users) == null ? void 0 : _a.total) == null ? void 0 : _b.toLocaleString(), sub: `\uC624\uB298 +${(_c = adminStats.users) == null ? void 0 : _c.today}`, color: "text-indigo-600" },
      { label: "\uC774\uBC88\uB2EC \uB9E4\uCD9C", val: `\u20A9${(_e = (_d = adminStats.revenue) == null ? void 0 : _d.monthly) == null ? void 0 : _e.toLocaleString()}`, sub: `\uACB0\uC81C ${(_f = adminStats.payments) == null ? void 0 : _f.monthly}\uAC74`, color: "text-emerald-600" },
      { label: "\uCD1D \uAC80\uC0AC \uC218", val: (_h = (_g = adminStats.tests) == null ? void 0 : _g.total) == null ? void 0 : _h.toLocaleString(), sub: `\uC624\uB298 ${(_i = adminStats.tests) == null ? void 0 : _i.today}\uAC74`, color: "text-orange-600" },
      { label: "AI \uC0C1\uB2F4", val: (_k = (_j = adminStats.chats) == null ? void 0 : _j.total) == null ? void 0 : _k.toLocaleString(), sub: `\uC624\uB298 ${(_l = adminStats.chats) == null ? void 0 : _l.today}\uAC74`, color: "text-purple-600" }
    ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, className: S.card }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mb-1" }, c.label), /* @__PURE__ */ React.createElement("div", { className: `text-2xl font-black ${c.color}` }, c.val ?? "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 mt-1" }, c.sub)))), /* @__PURE__ */ React.createElement("div", { className: S.card + " mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-700 mb-3 text-sm" }, "\uD06C\uB808\uB527 \uC9C0\uAE09"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, [["userId", "\uC0AC\uC6A9\uC790 ID"], ["amount", "\uAE08\uC561"]].map(([key, ph]) => /* @__PURE__ */ React.createElement(
      "input",
      {
        key,
        placeholder: ph,
        value: creditGrantForm[key],
        onChange: (e) => setCreditGrantForm((f) => ({ ...f, [key]: e.target.value })),
        className: "border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      }
    )), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: creditGrantForm.type,
        onChange: (e) => setCreditGrantForm((f) => ({ ...f, type: e.target.value })),
        className: "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "gain" }, "\uC9C0\uAE09"),
      /* @__PURE__ */ React.createElement("option", { value: "loss" }, "\uD68C\uC218")
    ), /* @__PURE__ */ React.createElement("button", { onClick: grantCredits, className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition" }, "\uC2E4\uD589")))), adminTab === "users" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "\uC774\uBA54\uC77C \uB610\uB294 \uB2C9\uB124\uC784 \uAC80\uC0C9",
        value: adminSearch,
        onChange: (e) => setAdminSearch(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && loadAdminUsers(),
        className: "flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      }
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => loadAdminUsers(), className: "bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition" }, "\uAC80\uC0C9")), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 text-xs text-gray-500" }, /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "ID"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uC774\uBA54\uC77C"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uB2C9\uB124\uC784"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uD06C\uB808\uB527"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uAC80\uC0AC"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uACB0\uC81C\uD569\uACC4"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uAC00\uC785\uC77C"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, (adminUsers.users || []).map((u) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("tr", { key: u.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-gray-400 text-xs" }, u.id), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, u.email), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, u.nickname || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right font-semibold text-indigo-600" }, "\u2726 ", u.credits), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right text-gray-500" }, u.test_count), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right text-emerald-600" }, "\u20A9", (u.total_paid || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-xs text-gray-400" }, (_a2 = u.created_at) == null ? void 0 : _a2.slice(0, 10)));
    })))), adminUsers.pagination && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-4 text-sm text-gray-500" }, /* @__PURE__ */ React.createElement("span", null, "\uCD1D ", adminUsers.pagination.total, "\uBA85"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, adminUsers.pagination.page > 1 && /* @__PURE__ */ React.createElement("button", { onClick: () => loadAdminUsers(adminUsers.pagination.page - 1), className: "px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" }, "\uC774\uC804"), /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1" }, adminUsers.pagination.page, "/", adminUsers.pagination.pages), adminUsers.pagination.page < adminUsers.pagination.pages && /* @__PURE__ */ React.createElement("button", { onClick: () => loadAdminUsers(adminUsers.pagination.page + 1), className: "px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" }, "\uB2E4\uC74C")))), adminTab === "payments" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 text-xs text-gray-500" }, /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "ID"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uC774\uBA54\uC77C"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uAE08\uC561"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uD06C\uB808\uB527"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-center" }, "\uC0C1\uD0DC"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uB0A0\uC9DC"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-center" }, "\uC791\uC5C5"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, (adminPayments.payments || []).map((p) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("tr", { key: p.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-gray-400 text-xs" }, p.id), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-xs" }, p.email), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right font-semibold" }, "\u20A9", (p.amount || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right text-indigo-600" }, "\u2726 ", p.credits), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "completed" ? "bg-emerald-100 text-emerald-700" : p.status === "refunded" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}` }, p.status === "completed" ? "\uC644\uB8CC" : p.status === "refunded" ? "\uD658\uBD88" : p.status)), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-xs text-gray-400" }, (_a2 = p.created_at) == null ? void 0 : _a2.slice(0, 10)), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-center" }, p.status === "completed" && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => processRefund(p.id),
          className: "text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition"
        },
        "\uD658\uBD88"
      )));
    })))), adminPayments.pagination && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-4 text-sm text-gray-500" }, /* @__PURE__ */ React.createElement("span", null, "\uCD1D ", adminPayments.pagination.total, "\uAC74"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, adminPayments.pagination.page > 1 && /* @__PURE__ */ React.createElement("button", { onClick: () => loadAdminPayments(adminPayments.pagination.page - 1), className: "px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" }, "\uC774\uC804"), /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1" }, adminPayments.pagination.page, "/", adminPayments.pagination.pages), adminPayments.pagination.page < adminPayments.pagination.pages && /* @__PURE__ */ React.createElement("button", { onClick: () => loadAdminPayments(adminPayments.pagination.page + 1), className: "px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" }, "\uB2E4\uC74C"))), /* @__PURE__ */ React.createElement("div", { className: "mt-4 text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-xl p-3" }, "\u26A0\uFE0F \uD658\uBD88 \uBC84\uD2BC\uC740 DB \uD06C\uB808\uB527\uB9CC \uD68C\uC218\uD569\uB2C8\uB2E4. PG(\uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20) \uC2E4\uC81C \uCDE8\uC18C\uB294 \uD1A0\uC2A4 \uD30C\uD2B8\uB108\uC13C\uD130\uC5D0\uC11C \uBCC4\uB3C4 \uCC98\uB9AC\uD558\uC138\uC694.")), adminTab === "tests" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 text-xs text-gray-500" }, /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uAC80\uC0AC \uC720\uD615"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left" }, "\uC5B8\uC5B4"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uAC74\uC218"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-right" }, "\uD06C\uB808\uB527 \uC18C\uBE44"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, adminTestStats.map((t2) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("tr", { key: t2.test_type + t2.lang, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 font-medium" }, t2.test_type), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-gray-400" }, t2.lang), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right font-semibold text-indigo-600" }, (_a2 = t2.cnt) == null ? void 0 : _a2.toLocaleString()), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-right text-emerald-600" }, "\u2726 ", (t2.credits || 0).toLocaleString()));
    }))))));
  }
}
function SessionList({ sessions, onView }) {
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  if (sessions.length === 0) return /* @__PURE__ */ React.createElement("div", { className: "text-center py-12 text-gray-400" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl mb-3" }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("p", null, "\uC81C\uCD9C\uB41C \uAC80\uC0AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"));
  const getTimeRemaining = (createdAt) => {
    const now = currentTime;
    const createdTime = new Date(createdAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1e3;
    const elapsed = now - createdTime;
    const remaining = TWENTY_FOUR_HOURS - elapsed;
    if (remaining <= 0) {
      return { expired: true, text: "\uB9CC\uB8CC\uB428", color: "text-red-600" };
    }
    const hours = Math.floor(remaining / (60 * 60 * 1e3));
    const minutes = Math.floor(remaining % (60 * 60 * 1e3) / (60 * 1e3));
    const seconds = Math.floor(remaining % (60 * 1e3) / 1e3);
    let color = "text-green-600";
    if (hours < 3) color = "text-red-600";
    else if (hours < 6) color = "text-orange-600";
    return {
      expired: false,
      text: `${hours}\uC2DC\uAC04 ${minutes}\uBD84 ${seconds}\uCD08`,
      color,
      hours
    };
  };
  const downloadJson = (sessionId, e) => {
    e.stopPropagation();
    const r = localStorage.getItem("session_" + sessionId);
    if (!r) {
      alert("\u274C \uAC80\uC0AC \uACB0\uACFC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const sessionData = JSON.parse(r);
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `\uAC80\uC0AC\uACB0\uACFC_${sessionData.testType}_${sessionId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("\u2705 \uAC80\uC0AC \uACB0\uACFC\uAC00 JSON \uD30C\uC77C\uB85C \uB2E4\uC6B4\uB85C\uB4DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-yellow-800 font-semibold" }, "\u26A0\uFE0F \uAC80\uC0AC \uACB0\uACFC\uB294 24\uC2DC\uAC04 \uD6C4 \uC790\uB3D9 \uC0AD\uC81C\uB429\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-yellow-700 mt-1" }, "\uC911\uC694\uD55C \uACB0\uACFC\uB294 ", /* @__PURE__ */ React.createElement("strong", null, "\u{1F4BE} JSON \uC800\uC7A5"), " \uBC84\uD2BC\uC73C\uB85C \uB85C\uCEEC\uC5D0 \uC800\uC7A5\uD574\uC8FC\uC138\uC694!")), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-100" }, ["#", "\uAC80\uC0AC \uC720\uD615", "\uC804\uD654\uBC88\uD638", "\uC81C\uCD9C \uC2DC\uAC04", "\u23F1\uFE0F \uB0A8\uC740 \uC2DC\uAC04", "\uC561\uC158"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, className: "border p-2 text-left" }, h)))), /* @__PURE__ */ React.createElement("tbody", null, sessions.map((s, i) => {
    const timeInfo = getTimeRemaining(s.createdAt);
    return /* @__PURE__ */ React.createElement("tr", { key: s.sessionId, className: `hover:bg-gray-50 ${timeInfo.expired ? "opacity-50 bg-red-50" : ""}` }, /* @__PURE__ */ React.createElement("td", { className: "border p-2 text-center text-gray-400" }, i + 1), /* @__PURE__ */ React.createElement("td", { className: "border p-2" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${s.testType === "SCT" ? "bg-blue-100 text-blue-800" : s.testType === "DSI" ? "bg-green-100 text-green-800" : s.testType === "PHQ9" ? "bg-yellow-100 text-yellow-800" : s.testType === "GAD7" ? "bg-orange-100 text-orange-800" : s.testType === "DASS21" ? "bg-pink-100 text-pink-800" : s.testType === "BIG5" ? "bg-purple-100 text-purple-800" : s.testType === "BURNOUT" ? "bg-red-100 text-red-800" : s.testType === "LOST" ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-800"}` }, s.testType === "SCT" ? "\u{1F4DD} \uBB38\uC7A5\uC644\uC131" : s.testType === "DSI" ? "\u{1F50D} \uC790\uC544\uBD84\uD654" : s.testType === "PHQ9" ? "\u{1F614} PHQ-9" : s.testType === "GAD7" ? "\u{1F630} GAD-7" : s.testType === "DASS21" ? "\u{1F4CA} DASS-21" : s.testType === "BIG5" ? "\u{1F31F} Big5" : s.testType === "BURNOUT" ? "\u{1F525} \uBC88\uC544\uC6C3" : s.testType === "LOST" ? "\u{1F9ED} LOST" : s.testType)), /* @__PURE__ */ React.createElement("td", { className: "border p-2" }, s.userPhone), /* @__PURE__ */ React.createElement("td", { className: "border p-2 text-xs text-gray-600" }, new Date(s.createdAt).toLocaleString("ko-KR")), /* @__PURE__ */ React.createElement("td", { className: "border p-2" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold text-xs ${timeInfo.color}` }, timeInfo.expired ? "\u{1F534} \uB9CC\uB8CC\uB428" : `\u23F1\uFE0F ${timeInfo.text}`), !timeInfo.expired && timeInfo.hours < 6 && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-red-600 mt-1 font-semibold" }, "\u26A0\uFE0F \uACE7 \uC0AD\uC81C\uB429\uB2C8\uB2E4!")), /* @__PURE__ */ React.createElement("td", { className: "border p-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, !timeInfo.expired ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onView(s.sessionId),
        className: "bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 w-full"
      },
      "\u{1F4CA} \uACB0\uACFC \uBCF4\uAE30"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => downloadJson(s.sessionId, e),
        className: "bg-green-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-green-700 w-full",
        title: "\uB85C\uCEEC\uC5D0 JSON \uD30C\uC77C\uB85C \uC800\uC7A5"
      },
      "\u{1F4BE} \uC800\uC7A5"
    )) : /* @__PURE__ */ React.createElement("span", { className: "text-xs text-red-600 font-semibold px-2 py-1" }, "\uC0AD\uC81C\uB428"))));
  })))));
}
function AppWithDebug() {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PsychologicalTestSystem, null), /* @__PURE__ */ React.createElement(MasterDebugOverlay, null));
}
function MasterDebugOverlay() {
  const [open, setOpen] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [serverLogs, setServerLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("local");
  const tok = localStorage.getItem("access_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("current_user") || "null");
    } catch {
      return null;
    }
  })();
  const MASTER_EMAILS = ["limyj007@gmail.com"];
  const isMasterUser = !!((user == null ? void 0 : user.email) && MASTER_EMAILS.includes(user.email.toLowerCase()));
  if (!isMasterUser) return null;
  const loadLocal = () => setLogs([...window.__ERR_LOG || []]);
  const loadServer = async () => {
    setLoading(true);
    try {
      const freshTok = localStorage.getItem("access_token");
      const r = await fetch("/api/debug/client-errors", { headers: { "Authorization": `Bearer ${freshTok}` } });
      const d = await r.json();
      setServerLogs(d.errors || []);
    } catch {
      setServerLogs([]);
    } finally {
      setLoading(false);
    }
  };
  const onOpen = () => {
    loadLocal();
    setOpen(true);
  };
  const errCount = (window.__ERR_LOG || []).length;
  if (!open) return /* @__PURE__ */ React.createElement("button", { onClick: onOpen, title: "Error Log", style: {
    position: "fixed",
    bottom: 80,
    right: 16,
    zIndex: 9999,
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "none",
    background: errCount > 0 ? "#DC2626" : "#6B7280",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, "\u{1F41B}");
  const display = activeTab === "local" ? logs : serverLogs;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 16 },
      onClick: (e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 520, maxHeight: "85vh", background: "#1E1E1E", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", color: "white", fontFamily: "monospace" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", background: "#2D2D2D", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #444" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, "\u{1F41B} Error Log ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#888" } }, "master only")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      loadLocal();
      if (activeTab === "server") loadServer();
    }, style: { background: "#3D3D3D", border: "none", color: "#CCC", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\u21BA"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      window.__ERR_LOG = [];
      setLogs([]);
    }, style: { background: "#3D3D3D", border: "none", color: "#F87171", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\uC9C0\uC6B0\uAE30"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(false), style: { background: "#3D3D3D", border: "none", color: "#CCC", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "\u2715"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", background: "#2D2D2D", borderBottom: "1px solid #444" } }, [["local", "\uB85C\uCEEC (\uBA54\uBAA8\uB9AC)"], ["server", "\uC11C\uBC84 KV"]].map(([k, l]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: k,
        onClick: () => {
          setActiveTab(k);
          if (k === "server" && !serverLogs.length) loadServer();
        },
        style: { flex: 1, padding: "8px", border: "none", background: activeTab === k ? "#1E1E1E" : "transparent", color: activeTab === k ? "#60A5FA" : "#888", fontSize: 12, cursor: "pointer", borderBottom: activeTab === k ? "2px solid #60A5FA" : "2px solid transparent" }
      },
      l,
      " (",
      k === "local" ? logs.length : serverLogs.length,
      ")"
    ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 8 } }, loading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#888", padding: 20, fontSize: 12 } }, "\uB85C\uB529 \uC911..."), !loading && display.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#4ADE80", padding: 20, fontSize: 12 } }, "\u2713 \uC5D0\uB7EC \uC5C6\uC74C"), display.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: "#2D2D2D", borderRadius: 8, padding: "8px 10px", marginBottom: 6, borderLeft: `3px solid ${(e.type || "") === "error" ? "#F87171" : "#FB923C"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: (e.type || "") === "error" ? "#F87171" : "#FB923C", fontWeight: 700 } }, (e.type || "").toUpperCase()), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#666" } }, (e.t || e.time || "").slice(11, 19))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#E5E7EB", wordBreak: "break-all", marginBottom: 2 } }, e.msg || e.message), (e.src || e.source) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#666" } }, e.src || e.source, e.line ? `:${e.line}` : ""), e.stack && /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", { style: { fontSize: 10, color: "#888", cursor: "pointer" } }, "\uC2A4\uD0DD \u25B8"), /* @__PURE__ */ React.createElement("pre", { style: { fontSize: 10, color: "#9CA3AF", whiteSpace: "pre-wrap", margin: "4px 0 0", maxHeight: 100, overflow: "auto" } }, e.stack))))))
  );
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(AppWithDebug, null));
