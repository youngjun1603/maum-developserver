const TEST_META = [
  {
    id: "PHQ9",
    label: "PHQ-9",
    icon: "\u{1F331}",
    color: "green",
    free: true,
    name: "\uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80",
    nameEn: "Depression Screening",
    desc: "\uC9C0\uB09C 2\uC8FC\uAC04 \uC815\uC11C\uC801 \uC0C1\uD0DC\uB97C 9\uAC1C \uBB38\uD56D\uC73C\uB85C \uAC00\uBCCD\uAC8C \uCCB4\uD06C\uD569\uB2C8\uB2E4. \uC804\uBB38\uAC00\uB4E4\uC774 \uD65C\uC6A9\uD558\uB294 \uD45C\uC900 \uC790\uAC00\uC810\uAC80 \uB3C4\uAD6C\uC785\uB2C8\uB2E4.",
    descEn: "Check your emotional state over the past 2 weeks with 9 items. A standard screening tool used by professionals worldwide.",
    time: "5\uBD84",
    timeEn: "5 min",
    count: "9\uBB38\uD56D",
    countEn: "9 items"
  },
  {
    id: "GAD7",
    label: "GAD-7",
    icon: "\u{1F499}",
    color: "blue",
    free: true,
    name: "\uBD88\uC548 \uC790\uAC00\uC810\uAC80",
    nameEn: "Anxiety Screening",
    desc: "7\uAC1C \uBB38\uD56D\uC73C\uB85C \uBD88\uC548\uACFC \uAE34\uC7A5 \uC218\uC900\uC744 \uBE60\uB974\uAC8C \uC810\uAC80\uD569\uB2C8\uB2E4. WHO\uAC00 \uAD8C\uC7A5\uD558\uB294 \uD45C\uC900 \uC790\uAC00\uC810\uAC80 \uB3C4\uAD6C\uC785\uB2C8\uB2E4.",
    descEn: "Quickly assess your anxiety and tension levels with 7 items. A WHO-recommended standard screening tool.",
    time: "5\uBD84",
    timeEn: "5 min",
    count: "7\uBB38\uD56D",
    countEn: "7 items"
  },
  {
    id: "DASS21",
    label: "DASS-21",
    icon: "\u{1F30A}",
    color: "teal",
    free: false,
    name: "\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uC2A4\uD2B8\uB808\uC2A4",
    nameEn: "Depression\xB7Anxiety\xB7Stress",
    desc: "\uC6B0\uC6B8, \uBD88\uC548, \uC2A4\uD2B8\uB808\uC2A4 \uC138 \uAC00\uC9C0 \uC815\uC11C \uC0C1\uD0DC\uB97C \uB3D9\uC2DC\uC5D0 \uCE21\uC815\uD558\uB294 \uC885\uD569 \uC815\uC11C \uAC80\uC0AC\uC785\uB2C8\uB2E4.",
    descEn: "A comprehensive emotional assessment that simultaneously measures depression, anxiety, and stress.",
    time: "10\uBD84",
    timeEn: "10 min",
    count: "21\uBB38\uD56D",
    countEn: "21 items"
  },
  {
    id: "BIG5",
    label: "Big5",
    icon: "\u{1F9E0}",
    color: "purple",
    free: false,
    name: "\uC131\uACA9 5\uC694\uC778 \uAC80\uC0AC",
    nameEn: "Big Five Personality",
    desc: "\uAC1C\uBC29\uC131\xB7\uC131\uC2E4\uC131\xB7\uC678\uD5A5\uC131\xB7\uCE5C\uD654\uC131\xB7\uC2E0\uACBD\uC99D 5\uAC00\uC9C0 \uC131\uACA9 \uCC28\uC6D0\uC744 \uACFC\uD559\uC801\uC73C\uB85C \uBD84\uC11D\uD569\uB2C8\uB2E4.",
    descEn: "Scientifically analyzes 5 personality dimensions: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
    time: "15\uBD84",
    timeEn: "15 min",
    count: "50\uBB38\uD56D",
    countEn: "50 items"
  },
  {
    id: "LOST",
    label: "LOST",
    icon: "\u{1F9ED}",
    color: "amber",
    free: false,
    name: "\uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4 \uAC80\uC0AC",
    nameEn: "Behavioral Style Assessment",
    desc: "\uC5D0\uB108\uC9C0 \uBC29\uD5A5\xB7\uC758\uC0AC\uACB0\uC815\xB7\uD589\uB3D9 \uBC29\uC2DD\xB7\uAD00\uACC4 \uC131\uD5A5 \uB4F1 6\uAC00\uC9C0 \uCD95\uC73C\uB85C \uB098\uC758 \uD589\uB3D9 \uC720\uD615\uC744 16\uAC00\uC9C0 \uC911 \uD558\uB098\uB85C \uD30C\uC545\uD569\uB2C8\uB2E4.",
    descEn: "Identifies your behavioral type among 16 styles across 6 axes \u2014 energy direction, decision-making, action style, relationship orientation, and more.",
    time: "15\uBD84",
    timeEn: "15 min",
    count: "60\uBB38\uD56D",
    countEn: "60 items"
  },
  {
    id: "SCT",
    label: "SRCI",
    icon: "\u270D\uFE0F",
    color: "coral",
    free: false,
    name: "\uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC",
    nameEn: "Self-Response Completion",
    desc: "\uAC08\uB4F1\xB7\uC555\uBC15 \uC0C1\uD669\uC5D0\uC11C \uB098\uD0C0\uB098\uB294 \uC790\uAE30\uC785\uC7A5, \uC815\uC11C\uBC18\uC751, \uAD00\uACC4 \uD328\uD134\uC744 \uBB38\uC7A5\uC644\uC131 \uBC29\uC2DD\uC73C\uB85C \uD0D0\uC0C9\uD569\uB2C8\uB2E4.",
    descEn: "Explore self-position, emotional responses, and relationship patterns in conflict and pressure situations.",
    time: "20\uBD84",
    timeEn: "20 min",
    count: "25\uBB38\uD56D",
    countEn: "25 items"
  },
  {
    id: "DSI",
    label: "SDRI",
    icon: "\u{1FA9E}",
    color: "pink",
    free: false,
    name: "\uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC",
    nameEn: "Self-Differentiation Index",
    desc: "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0\xB7\uC815\uC11C\uBC18\uC751\uC131\xB7\uC815\uC11C\uC801 \uB2E8\uC808\xB7\uC735\uD569 \uB4F1 4\uAC1C \uC18C\uCC99\uB3C4\uB85C \uC790\uAE30\uBD84\uD654 \uC218\uC900\uC744 \uD3C9\uC815\uD569\uB2C8\uB2E4.",
    descEn: "Rates self-differentiation level across 4 subscales: self-position, emotional reactivity, emotional cutoff, and fusion.",
    time: "15\uBD84",
    timeEn: "15 min",
    count: "25\uBB38\uD56D",
    countEn: "25 items"
  },
  {
    id: "BURNOUT",
    label: "K-MBI+",
    icon: "\u{1F525}",
    color: "red",
    free: false,
    name: "\uBC88\uC544\uC6C3 \uC790\uAC00\uC810\uAC80",
    nameEn: "Burnout Screening",
    desc: "\uC815\uC11C\uC801 \uACE0\uAC08\xB7\uB0C9\uC18C\xB7\uD6A8\uB2A5\uAC10 3\uAC00\uC9C0 \uC18C\uC9C4 \uC2E0\uD638\uB97C \uCCB4\uD06C\uD569\uB2C8\uB2E4. \uC9C1\uC7A5\uC778\xB7\uC758\uB8CC\uC9C4\xB7\uAD50\uC721\uC790\uC5D0\uAC8C \uD2B9\uD654\uB41C \uC790\uAC00\uC810\uAC80\uC785\uB2C8\uB2E4.",
    descEn: "Checks 3 burnout signals: emotional exhaustion, cynicism, and efficacy. Specialized for workers, medical staff, and educators.",
    time: "15\uBD84",
    timeEn: "15 min",
    count: "50\uBB38\uD56D",
    countEn: "50 items"
  },
  {
    id: "RIASEC",
    label: "Holland RIASEC",
    icon: "\u{1F50D}",
    color: "violet",
    free: false,
    name: "\uC9C1\uC5C5 \uD765\uBBF8 \uC720\uD615 \uAC80\uC0AC",
    nameEn: "Career Interest Type",
    desc: "\uB098\uC758 \uC9C1\uC5C5\uC801 \uC801\uC131\uACFC \uD765\uBBF8\uB97C \uC2E4\uC7AC\uD615\xB7\uD0D0\uAD6C\uD615\xB7\uC608\uC220\uD615\xB7\uC0AC\uD68C\uD615\xB7\uC9C4\uCDE8\uD615\xB7\uAD00\uC2B5\uD615 6\uAC00\uC9C0 \uC720\uD615\uC73C\uB85C \uBD84\uC11D\uD569\uB2C8\uB2E4.",
    descEn: "Analyzes your career aptitude and interests across 6 Holland types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.",
    time: "8\uBD84",
    timeEn: "8 min",
    count: "30\uBB38\uD56D",
    countEn: "30 items"
  },
  {
    id: "VALUES",
    label: "\uC9C1\uC5C5\uAC00\uCE58\uAD00",
    icon: "\u{1F48E}",
    color: "gold",
    free: false,
    name: "\uC9C1\uC5C5\uAC00\uCE58\uAD00 \uAC80\uC0AC",
    nameEn: "Work Values Assessment",
    desc: "\uC77C\uC5D0\uC11C \uBB34\uC5C7\uC744 \uC911\uC2DC\uD558\uB294\uC9C0 \uC131\uCDE8\xB7\uBD09\uC0AC\xB7\uC548\uC815\xB7\uC790\uC728\xB7\uCC3D\uC758\xB7\uC601\uD5A5\uB825 \uB4F1 10\uAC00\uC9C0 \uAC00\uCE58\uC694\uC778\uC73C\uB85C \uCE21\uC815\uD569\uB2C8\uB2E4.",
    descEn: "Measures what you value most at work across 10 factors: achievement, service, stability, autonomy, creativity, influence, and more.",
    time: "8\uBD84",
    timeEn: "8 min",
    count: "30\uBB38\uD56D",
    countEn: "30 items"
  }
];
const COLOR_MAP = {
  green: { bar: "#2D6A4F", bg: "#D8F3DC", text: "#1A6B3C" },
  blue: { bar: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8" },
  teal: { bar: "#14B8A6", bg: "#F0FDFA", text: "#0D7A6E" },
  purple: { bar: "#7C3AED", bg: "#F5F3FF", text: "#5B21B6" },
  amber: { bar: "#F59E0B", bg: "#FFFBEB", text: "#B45309" },
  coral: { bar: "#F97316", bg: "#FFF7ED", text: "#C2410C" },
  pink: { bar: "#EC4899", bg: "#FDF2F8", text: "#9D174D" },
  red: { bar: "#EF4444", bg: "#FEF2F2", text: "#991B1B" },
  violet: { bar: "#6D28D9", bg: "#EDE9FE", text: "#5B21B6" },
  gold: { bar: "#D97706", bg: "#FEF3C7", text: "#92400E" }
};
function GlobalNav({ setView, isLoggedIn, currentUser, credits, activeView, lang, onLangToggle }) {
  const { useState: useS, useEffect: useE } = React;
  const [scrolled, setScrolled] = useS(false);
  const [mobileOpen, setMobileOpen] = useS(false);
  const [seriesOpen, setSeriesOpen] = useS(false);
  const tl = (ko, en) => lang === "en" ? en : ko;
  useE(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const navItems = [
    { label: tl("\uAC80\uC0AC \uC18C\uAC1C", "Assessments"), view: "testsIntro" },
    { label: tl("\uC2EC\uB9AC\uAC80\uC0AC", "My Tests"), view: "memberDashboard", guestView: "testsIntro" },
    { label: tl("AI \uC0C1\uB2F4", "AI Counseling"), view: "aiCounsel", requireLogin: true },
    { label: tl("\uB9C8\uC74C \uAC8C\uC784", "Healing Games"), view: "gameIntro", isGame: true }
  ];
  const seriesItems = [
    { emoji: "\u{1F495}", label: tl("\uB9C8\uC74C\uCEE4\uD50C", "Maumful Couple"), desc: tl("\uD30C\uD2B8\uB108\uC640 \uC2EC\uB9AC \uAD81\uD569", "Couple compatibility"), isCouple: true },
    { emoji: "\u{1F9A6}", label: tl("\uB9C8\uC74C\uC218\uB2EC", "Maumotter"), desc: tl("\uC544\uC774\uC758 \uC18D\uB9C8\uC74C \uD1B5\uC5ED", "Child feelings"), isOtter: true },
    { emoji: "\u{1F43E}", label: tl("\uB9C8\uC74C\uACC1", "Maumgyeot"), desc: tl("\uBC18\uB824\uB3D9\uBB3C \uB9C8\uC74C \uD1B5\uC5ED", "Pet behavior"), isGyeot: true },
    { emoji: "\u{1F4AC}", label: tl("\uB9C8\uC74C\uBD80\uBD80", "Maumful Bubu"), desc: tl("\uBD80\uBD80 \uB300\uD654 \uD1B5\uC5ED", "Couple dialogue"), isBubu: true },
    { emoji: "\u{1F33F}", label: tl("\uB9C8\uC74C\uC138\uB300", "Maumful Sedae"), desc: tl("\uBD80\uBAA8\xB7\uC790\uB140 \uB9C8\uC74C \uD1B5\uC5ED", "Parent-child"), isSedae: true }
  ];
  const handleNavClick = (item) => {
    setMobileOpen(false);
    if (item.isGame) {
      if (!isLoggedIn) {
        setView("memberLogin");
        return;
      }
      const token = localStorage.getItem("access_token") || "";
      const gameUrl = `https://game.maumful.com${token ? "?t=" + encodeURIComponent(token) : ""}`;
      window.open(gameUrl, "_blank", "noopener noreferrer");
      return;
    }
    if (item.isCouple) {
      if (!isLoggedIn) {
        setView("memberLogin");
        return;
      }
      const h = window.location.hostname;
      const coupleBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
      fetch("/api/couple-token", {
        headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") }
      }).then((r) => r.json()).then((data) => {
        const token = data.success ? data.coupleToken : localStorage.getItem("access_token") || "";
        window.open(`${coupleBase}?t=${encodeURIComponent(token)}`, "_blank", "noopener noreferrer");
      }).catch(() => {
        const token = localStorage.getItem("access_token") || "";
        window.open(`${coupleBase}${token ? "?t=" + encodeURIComponent(token) : ""}`, "_blank", "noopener noreferrer");
      });
      return;
    }
    if (item.isGyeot) {
      window.open("https://maumgyeot.com", "_blank", "noopener noreferrer");
      return;
    }
    if (item.isOtter) {
      if (!isLoggedIn) {
        window.open("https://maumotter.com", "_blank", "noopener noreferrer");
        return;
      }
      fetch("/api/maum-sso-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
        if (data.success && data.ssoToken) window.open("https://maumotter.com/?sso=" + encodeURIComponent(data.ssoToken), "_blank", "noopener noreferrer");
        else window.open("https://maumotter.com", "_blank", "noopener noreferrer");
      }).catch(() => window.open("https://maumotter.com", "_blank", "noopener noreferrer"));
      return;
    }
    if (item.isSedae) {
      if (!isLoggedIn) {
        setView("memberLogin");
        return;
      }
      const sedaeBase = "https://sedae.maumful.com";
      fetch("/api/sedae-token", {
        headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") }
      }).then((r) => r.json()).then((data) => {
        if (data.success && data.sedaeToken) {
          window.open(`${sedaeBase}/?t=${encodeURIComponent(data.sedaeToken)}`, "_blank", "noopener noreferrer");
        } else {
          window.open(sedaeBase, "_blank", "noopener noreferrer");
        }
      }).catch(() => window.open(sedaeBase, "_blank", "noopener noreferrer"));
      return;
    }
    if (item.isBubu) {
      if (!isLoggedIn) {
        setView("memberLogin");
        return;
      }
      const h = window.location.hostname;
      const bubuBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumbubu.limyj007.workers.dev" : "https://bubu.maumful.com";
      fetch("/api/bubu-token", {
        headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") }
      }).then((r) => r.json()).then((data) => {
        const token = data.success ? data.bubuToken : localStorage.getItem("access_token") || "";
        window.open(`${bubuBase}?t=${encodeURIComponent(token)}`, "_blank", "noopener noreferrer");
      }).catch(() => {
        const token = localStorage.getItem("access_token") || "";
        window.open(`${bubuBase}${token ? "?t=" + encodeURIComponent(token) : ""}`, "_blank", "noopener noreferrer");
      });
      return;
    }
    if (item.requireLogin && !isLoggedIn) {
      setView("memberLogin");
      return;
    }
    if (item.guestView && !isLoggedIn) {
      setView(item.guestView);
      return;
    }
    setView(item.view);
  };
  return /* @__PURE__ */ React.createElement("nav", { style: {
    position: "sticky",
    top: 0,
    zIndex: 1e3,
    background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)",
    backdropFilter: "blur(16px)",
    borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
    boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
    transition: "all 0.3s ease"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("landing"),
      "aria-label": "\uB9C8\uC74C\uD480 \uD648",
      style: {
        display: "flex",
        alignItems: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0
      }
    },
    /* @__PURE__ */ React.createElement(
      "img",
      {
        src: "/static/maumful-logo.png?v=1",
        alt: "\uB9C8\uC74C\uD480 (Maumful)",
        style: { height: 30, width: "auto", display: "block" }
      }
    )
  ), /* @__PURE__ */ React.createElement("div", { className: "nav-desktop-links", style: { display: "flex", alignItems: "center", gap: 2 } }, navItems.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.view + item.label,
      onClick: () => handleNavClick(item),
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 400,
        color: activeView === item.view ? "#2D6A4F" : "#5A5A5A",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.15s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#F0FAF4";
        e.currentTarget.style.color = "#2D6A4F";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = activeView === item.view ? "#2D6A4F" : "#5A5A5A";
      }
    },
    item.label
  )), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSeriesOpen((o) => !o),
      style: {
        background: seriesOpen ? "#F0FAF4" : "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 400,
        color: seriesOpen ? "#2D6A4F" : "#5A5A5A",
        fontFamily: "'Noto Sans KR', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#F0FAF4";
        e.currentTarget.style.color = "#2D6A4F";
      },
      onMouseLeave: (e) => {
        if (!seriesOpen) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "#5A5A5A";
        }
      }
    },
    tl("\uB9C8\uC74C \uC2DC\uB9AC\uC988", "Maum Series"),
    " ",
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10 } }, "\u25BE")
  ), seriesOpen && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { onClick: () => setSeriesOpen(false), style: { position: "fixed", inset: 0, zIndex: 1e3 } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 0,
    top: "100%",
    marginTop: 6,
    width: 248,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 10px 34px rgba(0,0,0,0.14)",
    border: "1px solid rgba(0,0,0,0.06)",
    padding: 6,
    zIndex: 1001
  } }, seriesItems.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.label,
      onClick: () => {
        setSeriesOpen(false);
        handleNavClick(s);
      },
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "9px 10px",
        borderRadius: 8,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#F0FAF4";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, lineHeight: 1.2 } }, s.emoji),
    /* @__PURE__ */ React.createElement("span", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 14, fontWeight: 600, color: "#1A1A1A" } }, s.label), /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 11, color: "#9CA3AF" } }, s.desc))
  )))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, isLoggedIn ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("memberDashboard"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#F0FAF4",
        border: "1px solid #B7E4C7",
        borderRadius: 8,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 600,
        color: "#2D6A4F",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F33F}"),
    /* @__PURE__ */ React.createElement("span", null, credits, " ", tl("\uD06C\uB808\uB527", "Credits"))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("myPage"),
      style: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2D6A4F, #52B788)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        color: "white",
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif"
      },
      title: "\uB9C8\uC774\uD398\uC774\uC9C0"
    },
    ((currentUser == null ? void 0 : currentUser.nickname) || (currentUser == null ? void 0 : currentUser.email) || "?")[0].toUpperCase()
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("memberLogin"),
      style: {
        background: "none",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 500,
        color: "#5A5A5A",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.15s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#F5F5F5";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
      }
    },
    tl("\uB85C\uADF8\uC778", "Sign In")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"),
      style: {
        background: "#2D6A4F",
        border: "none",
        borderRadius: 8,
        padding: "8px 18px",
        fontSize: 14,
        fontWeight: 600,
        color: "white",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.15s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#1B5138";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#2D6A4F";
      }
    },
    tl("\uBB34\uB8CC \uC2DC\uC791 \u2192", "Get Started \u2192")
  )), onLangToggle && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onLangToggle(lang === "en" ? "ko" : "en"),
      style: {
        background: "none",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 6,
        padding: "4px 9px",
        fontSize: 12,
        fontWeight: 600,
        color: "#5A5A5A",
        cursor: "pointer",
        letterSpacing: "0.3px"
      },
      title: lang === "en" ? "\uD55C\uAD6D\uC5B4\uB85C \uBCF4\uAE30" : "Switch to English"
    },
    lang === "en" ? "\uD55C" : "EN"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "nav-mobile-btn",
      onClick: () => setMobileOpen((o) => !o),
      style: {
        display: "none",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 6,
        fontSize: 20
      }
    },
    mobileOpen ? "\u2715" : "\u2630"
  ))), mobileOpen && /* @__PURE__ */ React.createElement("div", { style: {
    borderTop: "1px solid rgba(0,0,0,0.07)",
    background: "white",
    padding: "12px 24px 20px"
  } }, navItems.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.view + item.label,
      onClick: () => handleNavClick(item),
      style: {
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "12px 0",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontSize: 15,
        color: "#1A1A1A",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    item.label
  )), /* @__PURE__ */ React.createElement("div", { style: { paddingTop: 10, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.4px", marginBottom: 2 } }, tl("\uB9C8\uC74C \uC2DC\uB9AC\uC988", "MAUM SERIES")), seriesItems.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.label,
      onClick: () => handleNavClick(s),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "11px 0",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17 } }, s.emoji),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, color: "#1A1A1A" } }, s.label),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#9CA3AF" } }, "\xB7 ", s.desc)
  ))), !isLoggedIn && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 16 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setMobileOpen(false);
        setView("memberLogin");
      },
      style: {
        flex: 1,
        padding: "11px 0",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "none",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    tl("\uB85C\uADF8\uC778", "Sign In")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setMobileOpen(false);
        setView(isLoggedIn ? "memberDashboard" : "testsIntro");
      },
      style: {
        flex: 1,
        padding: "11px 0",
        borderRadius: 8,
        border: "none",
        background: "#2D6A4F",
        color: "white",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif"
      }
    },
    tl("\uBB34\uB8CC \uC2DC\uC791", "Get Started")
  ))), (() => {
    try {
      const isPartner = !!(new URLSearchParams(location.search).get("p") || sessionStorage.getItem("maumful_partner_cfg"));
      return !isPartner;
    } catch {
      return true;
    }
  })() && /* @__PURE__ */ React.createElement("div", { style: { background: "#f4faf6", borderTop: "1px solid rgba(45,106,79,0.10)", padding: "7px 20px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#2d6a4f", lineHeight: 1.6, fontStyle: "italic" } }, 'John 3:16 "For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life."')));
}
function MfSnsHeroBtn({ tl }) {
  const share = () => {
    const k = window.Kakao;
    if (!k) return;
    if (!k.isInitialized()) k.init(window.KAKAO_APP_KEY);
    k.Share.sendDefault({
      objectType: "feed",
      content: { title: "\uB9C8\uC74C\uD480 \u2014 \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD558\uB294 \uC11C\uBE44\uC2A4", description: "\uC2EC\uB9AC\uAC80\uC0AC\uB85C \uB098\uB97C, \uCEE4\uD50C\xB7\uBD80\uBD80\xB7\uC138\uB300\xB7\uC544\uC774\uC758 \uB9C8\uC74C\uC740 \uAD00\uACC4 \uD1B5\uC5ED\uC73C\uB85C \uC77D\uC5B4 \uC804\uD574\uC694.", imageUrl: window.location.origin + "/static/og-share.png?v=20260731", link: { mobileWebUrl: window.location.origin, webUrl: window.location.origin } },
      buttons: [{ title: tl("\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30", "Get Started"), link: { mobileWebUrl: window.location.origin, webUrl: window.location.origin } }]
    });
  };
  if (!window.KAKAO_APP_KEY) return null;
  return /* @__PURE__ */ React.createElement("button", { onClick: share, style: { marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "#FEE500", color: "#3C1E1E", border: "none", borderRadius: 24, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", boxShadow: "0 2px 10px rgba(254,229,0,0.4)" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: { width: 17, height: 17, flexShrink: 0 }, fill: "#3C1E1E" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2C6.48 2 2 6.02 2 11c0 2.75 1.3 5.2 3.35 6.88L4 22l4.67-2.34C9.73 19.87 10.84 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2z" })), tl("\uCE74\uCE74\uC624\uD1A1\uC73C\uB85C \uACF5\uC720\uD558\uAE30", "Share on KakaoTalk"));
}
function MfSnsFooter({ tl }) {
  const { useState: useS } = React;
  const [cp, setCp] = useS(false);
  const url = window.location.origin;
  const ttl = "\uB9C8\uC74C\uD480 \u2014 \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD558\uB294 \uC11C\uBE44\uC2A4";
  const enc = encodeURIComponent;
  const pop = (u) => window.open(u, "_blank", "width=600,height=500,noopener,noreferrer");
  const cpy = () => navigator.clipboard.writeText(url).then(() => {
    setCp(true);
    setTimeout(() => setCp(false), 2500);
  });
  const kakao = () => {
    const k = window.Kakao;
    if (!k) return;
    if (!k.isInitialized()) k.init(window.KAKAO_APP_KEY);
    k.Share.sendDefault({ objectType: "feed", content: { title: ttl, description: "\uC2EC\uB9AC\uAC80\uC0AC\uB85C \uB098\uB97C, \uCEE4\uD50C\xB7\uBD80\uBD80\xB7\uC138\uB300\xB7\uC544\uC774\uC758 \uB9C8\uC74C\uC740 \uAD00\uACC4 \uD1B5\uC5ED\uC73C\uB85C \uC77D\uC5B4 \uC804\uD574\uC694.", imageUrl: url + "/static/og-share.png?v=20260731", link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: tl("\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30", "Get Started"), link: { mobileWebUrl: url, webUrl: url } }] });
  };
  const S = { width: 20, height: 20, flexShrink: 0 };
  const IG = "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";
  const btns = [
    {
      id: "kakao",
      lbl: tl("\uCE74\uCE74\uC624\uD1A1", "KakaoTalk"),
      bg: "#FEE500",
      fn: kakao,
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "#3C1E1E" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2C6.48 2 2 6.02 2 11c0 2.75 1.3 5.2 3.35 6.88L4 22l4.67-2.34C9.73 19.87 10.84 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2z" }))
    },
    {
      id: "facebook",
      lbl: "Facebook",
      bg: "#1877F2",
      fn: () => pop("https://www.facebook.com/sharer/sharer.php?u=" + enc(url)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "none", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }))
    },
    {
      id: "x",
      lbl: "X",
      bg: "#101010",
      fn: () => pop("https://twitter.com/intent/tweet?url=" + enc(url) + "&text=" + enc(ttl)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "white" }, /* @__PURE__ */ React.createElement("path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.257 5.636 5.907-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z" }))
    },
    {
      id: "instagram",
      lbl: "Instagram",
      bg: IG,
      fn: () => navigator.share ? navigator.share({ title: ttl, url }) : cpy(),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "4" }), /* @__PURE__ */ React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5", strokeWidth: "3" }))
    },
    {
      id: "naver",
      lbl: tl("\uB124\uC774\uBC84", "Naver"),
      bg: "#03C75A",
      fn: () => pop("https://share.naver.com/web/shareView?url=" + enc(url) + "&title=" + enc(ttl)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "white" }, /* @__PURE__ */ React.createElement("path", { d: "M16 3v7.5L9.5 3H3v18h5V13.5L14.5 21H21V3z" }))
    },
    {
      id: "line",
      lbl: "LINE",
      bg: "#06C755",
      fn: () => pop("https://social-plugins.line.me/lineit/share?url=" + enc(url)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "white" }, /* @__PURE__ */ React.createElement("path", { d: "M19.5 10.5C19.5 6.36 15.64 3 11 3S2.5 6.36 2.5 10.5c0 3.6 2.93 6.6 7.07 7.38.28.06.65.18.75.42.09.22.06.56 0 .78l-.12.93c-.04.22-.17.85.74.46s5-2.91 6.82-5.03C19.32 13.75 19.5 12.15 19.5 10.5z" }))
    },
    {
      id: "whatsapp",
      lbl: "WhatsApp",
      bg: "#25D366",
      fn: () => pop("https://wa.me/?text=" + enc(ttl + "\n" + url)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" }))
    },
    {
      id: "telegram",
      lbl: "Telegram",
      bg: "#2AABEE",
      fn: () => pop("https://t.me/share/url?url=" + enc(url) + "&text=" + enc(ttl)),
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), /* @__PURE__ */ React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" }))
    },
    {
      id: "threads",
      lbl: "Threads",
      bg: "#101010",
      fn: () => pop("https://www.threads.net/intent/post?text=" + enc(ttl + " " + url)),
      ico: /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 900, color: "white", fontFamily: "serif", lineHeight: 1 } }, "@")
    },
    {
      id: "copy",
      lbl: cp ? tl("\uBCF5\uC0AC\uB428 \u2713", "Copied \u2713") : tl("\uB9C1\uD06C\uBCF5\uC0AC", "Copy Link"),
      bg: "#5B6678",
      fn: cpy,
      ico: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", style: S, fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ React.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }))
    }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "24px 0 8px", borderTop: "1px solid rgba(255,255,255,0.06)" } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 14, textAlign: "center", fontFamily: "'Noto Sans KR',sans-serif" } }, tl("\uC774 \uC11C\uBE44\uC2A4\uB97C \uACF5\uC720\uD574 \uBCF4\uC138\uC694", "Share This Service")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" } }, btns.map((b) => /* @__PURE__ */ React.createElement("button", { key: b.id, onClick: b.fn, title: b.lbl, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 42, height: 42, borderRadius: 11, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" } }, b.ico), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap" } }, b.lbl)))));
}
function LandingPage({ setView, isLoggedIn, lang, setMyPageTab, loadTestHistory, setAutoOpenExternal }) {
  const tl = (ko, en) => lang === "en" ? en : ko;
  const openOtter = () => {
    if (!isLoggedIn) {
      window.open("https://maumotter.com", "_blank", "noopener noreferrer");
      return;
    }
    fetch("/api/maum-sso-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
      if (data.success && data.ssoToken) window.open("https://maumotter.com/?sso=" + encodeURIComponent(data.ssoToken), "_blank", "noopener noreferrer");
      else window.open("https://maumotter.com", "_blank", "noopener noreferrer");
    }).catch(() => window.open("https://maumotter.com", "_blank", "noopener noreferrer"));
  };
  const openGame = () => {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    fetch("/api/game-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
      const t = data.success ? data.gameToken : localStorage.getItem("access_token") || "";
      window.open(`https://game.maumful.com${t ? "?t=" + encodeURIComponent(t) : ""}`, "_blank", "noopener noreferrer");
    }).catch(() => window.open("https://game.maumful.com", "_blank", "noopener noreferrer"));
  };
  const openCouple = () => {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    const h = window.location.hostname;
    const coupleBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
    fetch("/api/couple-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
      const t = data.success ? data.coupleToken : localStorage.getItem("access_token") || "";
      window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, "_blank", "noopener noreferrer");
    }).catch(() => window.open(coupleBase, "_blank", "noopener noreferrer"));
  };
  const openBubu = () => {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    const h = window.location.hostname;
    const bubuBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumbubu.limyj007.workers.dev" : "https://bubu.maumful.com";
    fetch("/api/bubu-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
      const t = data.success ? data.bubuToken : localStorage.getItem("access_token") || "";
      window.open(`${bubuBase}?t=${encodeURIComponent(t)}`, "_blank", "noopener noreferrer");
    }).catch(() => window.open(bubuBase, "_blank", "noopener noreferrer"));
  };
  const openSedae = () => {
    if (!isLoggedIn) {
      setView("memberLogin");
      return;
    }
    fetch("/api/sedae-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
      if (data.success && data.sedaeToken) window.open("https://sedae.maumful.com/?t=" + encodeURIComponent(data.sedaeToken), "_blank", "noopener noreferrer");
      else window.open("https://sedae.maumful.com", "_blank", "noopener noreferrer");
    }).catch(() => window.open("https://sedae.maumful.com", "_blank", "noopener noreferrer"));
  };
  const { useState: useS, useEffect: useE, useRef } = React;
  const STORY_BAR_KEY = "story_bar_dismissed";
  const [showStoryBar, setShowStoryBar] = useS(() => {
    try {
      const ts = Number(localStorage.getItem(STORY_BAR_KEY) || 0);
      return !ts || Date.now() - ts > 30 * 24 * 60 * 60 * 1e3;
    } catch {
      return true;
    }
  });
  const [activeTestIdx, setActiveTestIdx] = useS(0);
  const [visibleSections, setVisibleSections] = useS({});
  const [slideIdx, setSlideIdx] = useS(0);
  const pausedRef = useRef(false);
  useE(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useE(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setSlideIdx((p) => (p + 1) % SHOWCASE.length);
    }, 5e3);
    return () => clearInterval(id);
  }, []);
  const fadeIn = (id) => ({
    opacity: visibleSections[id] ? 1 : 0,
    transform: visibleSections[id] ? "translateY(0)" : "translateY(28px)",
    transition: "opacity 0.6s ease, transform 0.6s ease"
  });
  const SHOWCASE = [
    {
      key: "test",
      accent: "#2D6A4F",
      header: tl("\u{1F50D} \uC2EC\uB9AC\uAC80\uC0AC \uC120\uD0DD", "\u{1F50D} Select Assessment"),
      badge: { icon: "\u2705", title: tl("PHQ-9 \uC644\uB8CC", "PHQ-9 done"), sub: tl("\uAC80\uC0AC \uD6C4 AI \uBD84\uC11D", "AI analysis ready") },
      cta: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"),
      ctaLabel: tl("\uC804\uCCB4 \uAC80\uC0AC 10\uC885 \uBCF4\uAE30 \u2192", "View all 10 \u2192"),
      rows: TEST_META.slice(0, 4).map((t) => ({ icon: t.icon, bg: COLOR_MAP[t.color].bg, name: tl(t.name, t.nameEn), sub: tl(t.time, t.timeEn) + " \xB7 " + tl(t.count, t.countEn), tag: t.free ? tl("\uBB34\uB8CC", "Free") : tl("10 \uD06C\uB808\uB527", "10 Cr"), free: t.free }))
    },
    {
      key: "game",
      accent: "#7C3AED",
      header: tl("\u{1F3AE} \uB9C8\uC74C\uAC8C\uC784 \xB7 \uCE58\uC720 \uAC8C\uC784 8\uC885", "\u{1F3AE} Healing Games"),
      badge: { icon: "\u{1F331}", title: tl("\uD558\uB8E8 \uD55C \uD310, \uB9C8\uC74C \uC27C", "A daily breather"), sub: tl("\uBB34\uB8CC\uB85C \uC2DC\uC791", "Free to start") },
      cta: () => openGame(),
      ctaLabel: tl("\uAC8C\uC784 \uBCF4\uB7EC\uAC00\uAE30 \u2192", "Explore games \u2192"),
      rows: [
        { icon: "\u{1F331}", bg: "#F3E8FF", name: tl("\uB9C8\uC74C \uC815\uC6D0", "Mind Garden"), sub: tl("\uAC10\uC815 \uC2DD\uBB3C \uD0A4\uC6B0\uAE30", "Grow your mood"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1F4D3}", bg: "#F3E8FF", name: tl("\uAC10\uC0AC \uC77C\uAE30", "Gratitude Diary"), sub: tl("3\uC904 \uAC10\uC0AC \uAE30\uB85D", "3 lines a day"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1FAC1}", bg: "#F3E8FF", name: tl("\uD638\uD761 \uD6C8\uB828", "Breathing"), sub: tl("\uBD88\uC548 \uC9C4\uC815 4-7-8", "Calm 4-7-8"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1F4E6}", bg: "#F3E8FF", name: tl("\uAC71\uC815 \uC0C1\uC790", "Worry Box"), sub: tl("\uAC71\uC815 \uBE44\uC6B0\uAE30", "Let worries go"), tag: tl("\uBB34\uB8CC", "Free") }
      ]
    },
    {
      key: "couple",
      accent: "#E05A8A",
      header: tl("\u{1F495} \uB9C8\uC74C\uCEE4\uD50C \xB7 \uAD00\uACC4 \uC778\uC0AC\uC774\uD2B8", "\u{1F495} Couple Insights"),
      badge: { icon: "\u{1F495}", title: tl("\uC6B0\uB9AC \uAD81\uD569 \uBD84\uC11D", "Compatibility"), sub: tl("BIG5 \uAE30\uBC18 \xB7 \uBB34\uB8CC", "BIG5-based \xB7 Free") },
      cta: () => openCouple(),
      ctaLabel: tl("\uB9C8\uC74C\uCEE4\uD50C \uC2DC\uC791 \u2192", "Start Couple \u2192"),
      rows: [
        { icon: "\u{1F495}", bg: "#FFE4EE", name: tl("BIG5 \uAD81\uD569 \uBD84\uC11D", "BIG5 Match"), sub: tl("\uC131\uACA9 \uCC28\uC774\uB97C \uAC15\uC810\uC73C\uB85C", "Differences\u2192strengths"), tag: tl("\uC778\uAE30", "Hot") },
        { icon: "\u{1F916}", bg: "#FFE4EE", name: tl("AI \uCEE4\uD50C \uB9AC\uD3EC\uD2B8", "AI Report"), sub: tl("\uB9DE\uCDA4 \uAD00\uACC4 \uC778\uC0AC\uC774\uD2B8", "Tailored insights"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1F4CA}", bg: "#FFE4EE", name: tl("\uAD00\uACC4 \uAC74\uAC15\uB3C4 \uCCB4\uD06C", "Check-In"), sub: tl("\uC6D4 1\uD68C \uBB34\uB8CC", "Free monthly"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1F5D3}\uFE0F", bg: "#FFE4EE", name: tl("\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", "Date Ideas"), sub: tl("\uCDE8\uD5A5 \uAE30\uBC18 AI", "AI-personalized"), tag: tl("AI", "AI") }
      ]
    },
    {
      key: "otter",
      accent: "#3B6FB5",
      header: tl("\u{1F9A6} \uB9C8\uC74C\uC218\uB2EC \xB7 \uC544\uC774 \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD574\uC694", "\u{1F9A6} Maumotter"),
      badge: { icon: "\u{1F9A6}", title: tl("\uB610\uB610\uC640 \uB300\uD654", "Talk with Otto"), sub: tl("\uD45C\uC815 \uC601\uC0C1 \uBB34\uC800\uC7A5", "Video not stored") },
      cta: () => openOtter(),
      ctaLabel: tl("\uB9C8\uC74C\uC218\uB2EC \uBCF4\uB7EC\uAC00\uAE30 \u2192", "Open Maumotter \u2192"),
      rows: [
        { icon: "\u{1F9A6}", bg: "#E7F0FB", name: tl("\uB610\uB610\uC640 \uB300\uD654", "Talk with Otto"), sub: tl("\uC544\uC774\uAC00 \uD3B8\uD558\uAC8C \uC18D\uB9C8\uC74C", "kids open up"), tag: tl("\uB300\uD654", "Chat") },
        { icon: "\u{1F916}", bg: "#E7F0FB", name: tl("\uB9C8\uC74C \uC77D\uC5B4 \uC804\uD558\uAE30", "Heart, read & shared"), sub: tl("\uBD80\uBAA8\uB2D8\uAED8 \uB530\uB73B\uD558\uAC8C", "gently for parents"), tag: tl("\uC77D\uAE30", "Read") },
        { icon: "\u{1F4F7}", bg: "#E7F0FB", name: tl("\uD45C\uC815 \uC601\uC0C1 \uBD84\uC11D", "Facial Reading"), sub: tl("\uAE30\uAE30 \uB0B4\xB7\uC800\uC7A5 \uC548 \uD568", "on-device"), tag: tl("\uBB34\uC800\uC7A5", "No-save") },
        { icon: "\u{1F512}", bg: "#E7F0FB", name: tl("\uC548\uC804 \uC124\uACC4", "Safe Design"), sub: tl("\uBD80\uBAA8 PIN\xB7\uC704\uAE30 \uC548\uB0B4", "PIN\xB7crisis"), tag: tl("\uC548\uC804", "Safe") }
      ]
    },
    {
      key: "bubu",
      accent: "#B45309",
      header: tl("\u{1F4AC} \uB9C8\uC74C\uBD80\uBD80 \xB7 \uBD80\uBD80 \uB300\uD654 \uD1B5\uC5ED", "\u{1F4AC} Maumful Bubu"),
      badge: { icon: "\u{1F4AC}", title: tl("\uB9D0\uACFC \uB9C8\uC74C\uC758 \uAC04\uADF9", "Words vs feelings"), sub: tl("\uCCAB 3\uD68C \uBB34\uB8CC", "3 free to start") },
      cta: () => openBubu(),
      ctaLabel: tl("\uB9C8\uC74C\uBD80\uBD80 \uC2DC\uC791 \u2192", "Start Bubu \u2192"),
      rows: [
        { icon: "\u{1F4AC}", bg: "#FEF3C7", name: tl("\uB300\uD654 \uD1B5\uC5ED", "Translate talk"), sub: tl("\uB9D0 \uC18D \uC9C4\uC9DC \uB9C8\uC74C", "the real meaning"), tag: tl("\uD1B5\uC5ED", "Read") },
        { icon: "\u{1F54A}\uFE0F", bg: "#FEF3C7", name: tl("\uC2F8\uC6C0 \uC911\uC7AC", "Mediation"), sub: tl("\uAC08\uB4F1 \uB300\uD654 \uBD84\uC11D", "analyze conflicts"), tag: tl("\uC911\uC7AC", "Calm") },
        { icon: "\u{1F497}", bg: "#FEF3C7", name: tl("\uAD00\uC810 \uBC14\uAFD4\uBCF4\uAE30", "Perspective"), sub: tl("\uC0C1\uB300 \uC785\uC7A5\uC5D0\uC11C", "partner's view"), tag: tl("\uACF5\uAC10", "Care") },
        { icon: "\u271D\uFE0F", bg: "#FEF3C7", name: tl("\uC2EC\uB9AC\xB7\uAE30\uB3C5\uAD50 \uD2B8\uB799", "Two tracks"), sub: tl("\uC6D0\uD558\uB294 \uAD00\uC810 \uC120\uD0DD", "psych & faith"), tag: tl("\uD2B8\uB799", "Track") }
      ]
    },
    {
      key: "sedae",
      accent: "#0E7490",
      header: tl("\u{1F33F} \uB9C8\uC74C\uC138\uB300 \xB7 \uBD80\uBAA8-\uC790\uB140 \uD1B5\uC5ED", "\u{1F33F} Maumful Sedae"),
      badge: { icon: "\u{1F33F}", title: tl("\uC138\uB300 \uC0AC\uC774 \uD1B5\uC5ED", "Across generations"), sub: tl("\uCCAD\uC18C\uB144 \uBB34\uB8CC", "Free for teens") },
      cta: () => openSedae(),
      ctaLabel: tl("\uB9C8\uC74C\uC138\uB300 \uC2DC\uC791 \u2192", "Start Sedae \u2192"),
      rows: [
        { icon: "\u{1F33F}", bg: "#CFFAFE", name: tl("\uBD80\uBAA8-\uC790\uB140 \uD1B5\uC5ED", "Parent-child"), sub: tl("\uC138\uB300 \uAC04 \uB9D0\uC758 \uAC04\uADF9", "the generation gap"), tag: tl("\uD1B5\uC5ED", "Read") },
        { icon: "\u{1F9D2}", bg: "#CFFAFE", name: tl("\uCCAD\uC18C\uB144 \uC548\uC804 \uC6B0\uC120", "Teen safety"), sub: tl("\uBCF4\uD638\uAC00 \uBA3C\uC800", "protection first"), tag: tl("\uBB34\uB8CC", "Free") },
        { icon: "\u{1F4E8}", bg: "#CFFAFE", name: tl("\uC6F9\uBDF0\uB85C \uACF5\uC720", "Web share"), sub: tl("\uC571 \uC5C6\uC774 \uC5F4\uB78C", "no app needed"), tag: tl("\uACF5\uC720", "Share") },
        { icon: "\u{1F91D}", bg: "#CFFAFE", name: tl("\uAC00\uC871 \uCEE4\uBBA4\uB2C8\uD2F0", "Community"), sub: tl("\uC131\uC778 \uC804\uC6A9 \uBC29", "adults only"), tag: tl("\uC18C\uD1B5", "Talk") }
      ]
    }
  ];
  const slide = SHOWCASE[slideIdx] || SHOWCASE[0];
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR', sans-serif", color: "#1A1A1A", background: "#FAFAF8" } }, showStoryBar && /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(90deg, #1B4332 0%, #2D6A4F 100%)",
    color: "white",
    fontSize: 13,
    position: "relative"
  } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "/story/",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "9px 44px 9px 16px",
        color: "white",
        textDecoration: "none",
        textAlign: "center"
      }
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u{1F33F}"),
    /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.92 } }, tl("\uB9C8\uC74C\uD480\uC740 \uB2F9\uC2E0\uB3C4 \uC54C\uC9C0 \uBABB\uD558\uB358 \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD569\uB2C8\uB2E4", "Maumful reads the heart you didn't know you had")),
    /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, whiteSpace: "nowrap", textDecoration: "underline", textUnderlineOffset: 3 } }, tl("\uC774\uC57C\uAE30 \uBCF4\uAE30 \u2192", "Our story \u2192"))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setShowStoryBar(false);
        try {
          localStorage.setItem(STORY_BAR_KEY, String(Date.now()));
        } catch {
        }
      },
      "aria-label": tl("\uBC30\uB108 \uB2EB\uAE30", "Dismiss banner"),
      style: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "rgba(255,255,255,.65)",
        fontSize: 16,
        lineHeight: 1,
        cursor: "pointer",
        padding: 6
      }
    },
    "\xD7"
  )), /* @__PURE__ */ React.createElement("section", { style: {
    minHeight: "88vh",
    display: "flex",
    alignItems: "center",
    background: "linear-gradient(150deg, #F0FAF4 0%, #FAFAF8 45%, #FFF8F3 100%)",
    padding: "80px 24px",
    position: "relative",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 480,
    height: 480,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(82,183,136,0.10) 0%, transparent 70%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(244,162,97,0.09) 0%, transparent 70%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" },
      className: "hero-grid"
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "#D8F3DC",
      color: "#2D6A4F",
      padding: "6px 14px",
      borderRadius: 100,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 24
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 8, animation: "pulse 2s infinite" } }, "\u25CF"), tl("\uB9C8\uC74C\uC744 \uC77D\uB294 \uC77C", "The work of reading hearts")), /* @__PURE__ */ React.createElement("h1", { style: {
      fontSize: 52,
      lineHeight: 1.2,
      fontWeight: 700,
      marginBottom: 20,
      letterSpacing: "-1px"
    } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB2F9\uC2E0\uB3C4 \uC54C\uC9C0 \uBABB\uD558\uB358", /* @__PURE__ */ React.createElement("br", null), "\uB9C8\uC74C\uC744 \uC77D\uC5B4\uC11C", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uC804\uD574\xA0\uB4DC\uB9BD\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement(React.Fragment, null, "We read the heart", /* @__PURE__ */ React.createElement("br", null), "you didn't know you had \u2014", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "and bring it to you.")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 17, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 36 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB9C8\uC74C\uC740 \uB298 \uB9D0\uBCF4\uB2E4 \uD55C \uAC78\uC74C \uB4A4\uC5D0 \uC788\uC2B5\uB2C8\uB2E4. \uB9C8\uC74C\uD480\uC740 \uADF8 \uB2FF\uC9C0 \uBABB\uD55C \uB9C8\uC74C\uC744 \uC77D\uC5B4 ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "\uB2F9\uC2E0\uC5D0\uAC8C \uAC74\uB124\uB294 \uC11C\uBE44\uC2A4"), "\uC785\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "\uC2EC\uB9AC\uAC80\uC0AC\uB85C \uB0B4 \uB9C8\uC74C\uC744, ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "\uAD00\uACC4 \uD1B5\uC5ED"), "\uC73C\uB85C \uC0C1\uB300\uC758 \uB9C8\uC74C\uC744 \uC77D\uACE0, ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "\uB9C8\uC74C\uAC8C\uC784"), "\uC73C\uB85C \uC9C0\uCE5C \uB9C8\uC74C\uC740 \uC2A4\uC2A4\uB85C \uB2E4\uB3C5\uC5EC\uC694. \uB2F5\uB2F5\uD560 \uB550 ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "AI"), "\uC640 \uB098\uB204\uBA70 \uC9C0\uAE08 \uB0B4 \uB9C8\uC74C\uC744 \uD655\uC778\uD574 \uBCF4\uC138\uC694. \uB9C8\uC74C\uD480\uC774 ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "\uB2F9\uC2E0\uC758 \uCE5C\uAD6C"), "\uAC00 \uB418\uC5B4 \uB4DC\uB9B4\uAC8C\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "The heart is always one step behind our words. Maumful ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "reads those unspoken feelings and brings them to you"), ".", /* @__PURE__ */ React.createElement("br", null), "See your own heart through assessments, others' through ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "relationship interpreting"), ", and soothe a weary heart yourself with ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "Maum Games"), ". When it weighs on you, share it with ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "AI"), " \u2014 Maumful will be ", /* @__PURE__ */ React.createElement("b", { style: { color: "#3A3A3A" } }, "your friend"), "."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setView(isLoggedIn ? "memberDashboard" : "startTest:PHQ9"),
        style: {
          background: "#2D6A4F",
          color: "white",
          border: "none",
          padding: "14px 32px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "'Noto Sans KR', sans-serif"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#1B5138";
          e.currentTarget.style.transform = "translateY(-1px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#2D6A4F";
          e.currentTarget.style.transform = "none";
        }
      },
      tl("\uBB34\uB8CC \uAC80\uC0AC \uC2DC\uC791\uD558\uAE30", "Start Free Assessment")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setView("testsIntro"),
        style: {
          background: "transparent",
          color: "#2D6A4F",
          border: "1.5px solid #2D6A4F",
          padding: "14px 28px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "'Noto Sans KR', sans-serif"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#D8F3DC";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "transparent";
        }
      },
      tl("\uAC80\uC0AC \uC18C\uAC1C \uBCF4\uAE30", "View Assessments")
    )), /* @__PURE__ */ React.createElement(MfSnsHeroBtn, { tl }), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      gap: 36,
      marginTop: 48,
      paddingTop: 36,
      borderTop: "1px solid rgba(0,0,0,0.08)"
    } }, [
      { num: "10", label: tl("\uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC", "Assessments") },
      { num: "10", label: tl("\uAC00\uC785 \uC989\uC2DC \uD06C\uB808\uB527", "Free Credits") },
      { num: "AI", label: tl("\uACB0\uACFC \uBD84\uC11D \uC0C1\uB2F4", "Result Analysis") }
    ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 700, color: "#2D6A4F", lineHeight: 1 } }, s.num), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginTop: 4 } }, s.label))))),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { position: "relative" },
        className: "hero-visual",
        onMouseEnter: () => {
          pausedRef.current = true;
        },
        onMouseLeave: () => {
          pausedRef.current = false;
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -16, right: -10, zIndex: 10, background: "white", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 30px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, slide.badge.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600 } }, slide.badge.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9A9A9A" } }, slide.badge.sub))),
      /* @__PURE__ */ React.createElement("div", { style: { position: "relative", background: "white", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.10)", padding: "28px 30px 22px", overflow: "hidden", minHeight: 392 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSlideIdx((slideIdx + SHOWCASE.length - 1) % SHOWCASE.length), "aria-label": tl("\uC774\uC804", "Prev"), style: { position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "1px solid #E8E8E8", background: "white", cursor: "pointer", fontSize: 18, color: "#666", zIndex: 5, lineHeight: "28px" } }, "\u2039"), /* @__PURE__ */ React.createElement("button", { onClick: () => setSlideIdx((slideIdx + 1) % SHOWCASE.length), "aria-label": tl("\uB2E4\uC74C", "Next"), style: { position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "1px solid #E8E8E8", background: "white", cursor: "pointer", fontSize: 18, color: "#666", zIndex: 5, lineHeight: "28px" } }, "\u203A"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: slide.accent, marginBottom: 16, letterSpacing: "0.3px", textAlign: "center" } }, slide.header), slide.rows.map((r, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: slide.key + i,
          onClick: slide.cta,
          style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, background: i === 0 ? r.bg : "#F9F9F7", cursor: "pointer", marginBottom: 8, border: i === 0 ? `1px solid ${slide.accent}33` : "1px solid transparent", transition: "all 0.2s" }
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 } }, r.icon),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#1A1A1A" } }, r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A" } }, r.sub)),
        /* @__PURE__ */ React.createElement("div", { style: {
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 9px",
          borderRadius: 100,
          whiteSpace: "nowrap",
          background: slide.key === "test" ? r.free ? "#D8F3DC" : "#FFF0E6" : slide.accent + "18",
          color: slide.key === "test" ? r.free ? "#1A6B3C" : "#C05621" : slide.accent
        } }, r.tag)
      )), /* @__PURE__ */ React.createElement("button", { onClick: slide.cta, style: { width: "100%", marginTop: 10, padding: "10px 0", background: slide.accent + "12", border: `1px solid ${slide.accent}44`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: slide.accent, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" } }, slide.ctaLabel)),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginTop: 16 } }, SHOWCASE.map((s, i) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: s.key,
          onClick: () => setSlideIdx(i),
          role: "button",
          "aria-label": String(i + 1),
          style: { width: i === slideIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === slideIdx ? slide.accent : "#D5D5D5", cursor: "pointer", transition: "all 0.25s" }
        }
      )))
    )
  )), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "white" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { id: "sec-tests", "data-animate": true, style: { textAlign: "center", marginBottom: 56, ...fadeIn("sec-tests") } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#D8F3DC",
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 14
  } }, "Psychological Tests"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "10\uAC00\uC9C0 \uC804\uBB38 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uC2EC\uB9AC\xB7\uC9C4\uB85C \uAC80\uC0AC")), /* @__PURE__ */ React.createElement(React.Fragment, null, "10 Professional ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "Assessments")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", maxWidth: 480, margin: "0 auto" } }, tl("\uC815\uC2E0\uAC74\uAC15 \uBD84\uC57C\uC5D0\uC11C \uB110\uB9AC \uD65C\uC6A9\uB418\uB294 \uD45C\uC900\uD654\uB41C \uC790\uAC00\uC810\uAC80 \uB3C4\uAD6C\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4", "Standardized self-check tools widely used in the mental wellness field"))), /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 18
  }, className: "tests-grid" }, TEST_META.map((t, i) => {
    const c = COLOR_MAP[t.color];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t.id,
        onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"),
        style: {
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          padding: "24px 22px",
          cursor: "pointer",
          transition: "all 0.25s",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderTop: `3px solid ${c.bar}`,
          position: "relative",
          overflow: "hidden"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)";
          e.currentTarget.style.transform = "translateY(-4px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30 } }, t.icon),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#9A9A9A", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 } }, t.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, tl(t.name, t.nameEn)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#6A6A6A", lineHeight: 1.6 } }, tl(t.desc, t.descEn).substring(0, 55), "...")),
      /* @__PURE__ */ React.createElement("div", { style: { marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#9A9A9A" } }, "\u23F1 ", tl(t.time, t.timeEn), " \xB7 ", tl(t.count, t.countEn)), /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        background: t.free ? "#D8F3DC" : "#FFF0E6",
        color: t.free ? "#1A6B3C" : "#C05621"
      } }, t.free ? tl("\uBB34\uB8CC", "Free") : tl("10 \uD06C\uB808\uB527", "10 Credits")))
    );
  })), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 40 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("testsIntro"),
      style: {
        background: "transparent",
        color: "#2D6A4F",
        border: "1.5px solid #2D6A4F",
        borderRadius: 10,
        padding: "12px 32px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#D8F3DC";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
      }
    },
    tl("\uAC01 \uAC80\uC0AC \uC0C1\uC138 \uC18C\uAC1C \uBCF4\uAE30 \u2192", "View detailed assessment info \u2192")
  )))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#F5F5F0" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { id: "sec-feat", "data-animate": true, style: { textAlign: "center", marginBottom: 52, ...fadeIn("sec-feat") } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#EEF0FF",
    color: "#5B21B6",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 14
  } }, "Why \uB9C8\uC74C\uD480"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 34, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC2E0\uB8B0\uD560 \uC218 \uC788\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uC2EC\uB9AC\uAC80\uC0AC"), "\uAC00 \uD544\uC694\uD55C \uC774\uC720"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Why you need a", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "trusted assessment"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }, className: "features-grid" }, [
    {
      icon: "\u{1F4CB}",
      bg: "#D8F3DC",
      title: tl("\uD45C\uC900\uD654 \uC2EC\uB9AC\uAC80\uC0AC", "Standardized Tools"),
      desc: tl("PHQ-9, GAD-7 \uB4F1 \uAD6D\uC81C\uC801\uC73C\uB85C \uB110\uB9AC \uC4F0\uC774\uB294 \uD45C\uC900 \uC790\uAC00\uC810\uAC80 \uBB38\uD56D\uC744 \uBC14\uD0D5\uC73C\uB85C \uAD6C\uC131\uD588\uC2B5\uB2C8\uB2E4. \uC804\uBB38\uAC00\uB4E4\uC774 \uC2E0\uB8B0\uD558\uB294 \uBB38\uD56D \uAE30\uC900\uC744 \uB530\uB985\uB2C8\uB2E4.", "Built on internationally recognized standard self-check items such as PHQ-9 and GAD-7 \u2014 following criteria trusted by professionals.")
    },
    {
      icon: "\u{1F916}",
      bg: "#EEF0FF",
      title: tl("AI \uACB0\uACFC \uD574\uC11D \uC0C1\uB2F4", "AI-Powered Interpretation"),
      desc: tl("\uAC80\uC0AC \uC644\uB8CC \uD6C4 Anthropic Claude AI\uC640 1:1 \uB300\uD654\uB85C \uB098\uC758 \uACB0\uACFC\uB97C \uB354 \uAE4A\uC774 \uC774\uD574\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB2E8\uC21C \uC810\uC218\uB97C \uB118\uC5B4\uC120 \uC778\uC0AC\uC774\uD2B8\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4.", "After completing a test, have a 1:1 conversation with Anthropic Claude AI to deeply understand your results \u2014 insights beyond just scores.")
    },
    {
      icon: "\u{1F512}",
      bg: "#FEF3C7",
      title: tl("\uC644\uC804\uD55C \uD504\uB77C\uC774\uBC84\uC2DC \uBCF4\uD638", "Full Privacy Protection"),
      desc: tl("\uAC80\uC0AC \uACB0\uACFC\uB294 \uBCF8\uC778 \uACC4\uC815\uC5D0\uB9CC \uC800\uC7A5\uB429\uB2C8\uB2E4. \uAC1C\uC778 \uC2DD\uBCC4 \uC815\uBCF4\uC640 \uBD84\uB9AC \uBCF4\uAD00\uD558\uC5EC \uC775\uBA85\uC131\uC744 \uBCF4\uC7A5\uD569\uB2C8\uB2E4.", "Your results are stored only in your account, kept separate from personal identifiers to guarantee anonymity.")
    }
  ].map((f) => /* @__PURE__ */ React.createElement("div", { key: f.title, style: {
    background: "white",
    borderRadius: 14,
    padding: "32px 28px",
    border: "1px solid rgba(0,0,0,0.07)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: f.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    marginBottom: 18
  } }, f.icon), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 18, fontWeight: 700, marginBottom: 10 } }, f.title), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.75 } }, f.desc)))))), /* @__PURE__ */ React.createElement("section", { style: {
    padding: "80px 24px",
    background: "linear-gradient(135deg, #1A3D2B 0%, #2D6A4F 100%)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }, className: "ai-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 20
  } }, "AI Counseling"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, color: "white", marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC80\uC0AC \uACB0\uACFC,", /* @__PURE__ */ React.createElement("br", null), "AI\uC640 \uD568\uAED8", /* @__PURE__ */ React.createElement("br", null), "\uC774\uD574\uD558\uC138\uC694"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Understand your", /* @__PURE__ */ React.createElement("br", null), "results with", /* @__PURE__ */ React.createElement("br", null), "AI counseling"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB2E8\uC21C\uD55C \uC810\uC218 \uD655\uC778\uC744 \uB118\uC5B4,", /* @__PURE__ */ React.createElement("br", null), "\uB0B4 \uACB0\uACFC\uC758 \uC758\uBBF8\uC640 \uC55E\uC73C\uB85C\uC758 \uBC29\uD5A5\uC744 \uB300\uD654\uB85C \uD0D0\uC0C9\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Beyond just seeing a score \u2014 explore the meaning of your results and your path forward through conversation."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 } }, tl(["\u{1F4CA} \uACB0\uACFC \uD574\uC11D", "\u{1F4AD} \uAC10\uC815 \uD0D0\uC0C9", "\u{1F5FA} \uB300\uCC98 \uBC29\uBC95", "\u{1F504} \uCD94\uAC00 \uAC80\uC0AC \uCD94\uCC9C"], ["\u{1F4CA} Result Interpretation", "\u{1F4AD} Emotion Exploration", "\u{1F5FA} Coping Strategies", "\u{1F504} Test Recommendations"]).map((chip) => /* @__PURE__ */ React.createElement("span", { key: chip, style: {
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.9)",
    padding: "6px 14px",
    borderRadius: 100,
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.2)"
  } }, chip))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (isLoggedIn) {
          setView("aiCounsel");
        } else {
          setView("testsIntro");
        }
      },
      style: {
        background: "#F4A261",
        border: "none",
        borderRadius: 12,
        padding: "14px 32px",
        fontSize: 16,
        fontWeight: 700,
        color: "white",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#E76F51";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#F4A261";
      }
    },
    tl("AI \uC0C1\uB2F4 \uCCB4\uD5D8\uD558\uAE30 \u2192", "Try AI Counseling \u2192")
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" } }, tl("PHQ-9 \uC6B0\uC6B8 \uAC80\uC0AC(\uBB34\uB8CC) \u2192 \uACB0\uACFC \uD655\uC778 \u2192 AI \uC0C1\uB2F4", "PHQ-9 Depression (Free) \u2192 View Results \u2192 AI Counseling"))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: "24px"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingBottom: 16,
    marginBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#D8F3DC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
  } }, "\u{1F916}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "white" } }, tl("\uB9C8\uC74C\uC774 (AI \uC0C1\uB2F4)", "Maumi (AI Counselor)")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.45)" } }, "\u25CF ", tl("\uC628\uB77C\uC778", "Online")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, tl([
    { type: "ai", text: "PHQ-9 \uACB0\uACFC\uB97C \uD655\uC778\uD588\uC5B4\uC694. \uC9C0\uB09C 2\uC8FC\uAC04 \uC6B0\uC6B8\uAC10\uC774 \uB2E4\uC18C \uB192\uAC8C \uB098\uD0C0\uB0AC\uB294\uB370, \uD2B9\uD788 \uC218\uBA74\uACFC \uC9D1\uC911\uB825 \uBD80\uBD84\uC774 \uB208\uC5D0 \uB744\uB124\uC694. \uC880 \uB354 \uC774\uC57C\uAE30\uD574\uBCFC\uAE4C\uC694?" },
    { type: "user", text: "\uB124, \uC694\uC998 \uC7A0\uC744 \uC798 \uBABB \uC790\uACE0 \uC788\uC5B4\uC694" },
    { type: "ai", text: "\uC218\uBA74 \uC5B4\uB824\uC6C0\uC774 \uC5BC\uB9C8\uB098 \uB410\uB294\uC9C0 \uC54C \uC218 \uC788\uC744\uAE4C\uC694? \uCD5C\uADFC\uC5D0 \uD2B9\uBCC4\uD788 \uC2A4\uD2B8\uB808\uC2A4\uBC1B\uB294 \uC77C\uC774 \uC788\uC5C8\uB098\uC694?" }
  ], [
    { type: "ai", text: "I've looked at your PHQ-9 results. Your mood has been somewhat low over the past two weeks \u2014 sleep and concentration stand out in particular. Want to talk more about it?" },
    { type: "user", text: "Yes, I've been having a hard time sleeping lately." },
    { type: "ai", text: "How long have you been struggling with sleep? Has anything particularly stressful been happening recently?" }
  ]).map((msg, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    maxWidth: "82%",
    padding: "11px 15px",
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.65,
    alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
    background: msg.type === "ai" ? "rgba(255,255,255,0.12)" : "#52B788",
    color: msg.type === "ai" ? "rgba(255,255,255,0.88)" : "white",
    borderBottomLeftRadius: msg.type === "ai" ? 4 : 14,
    borderBottomRightRadius: msg.type === "user" ? 4 : 14
  } }, msg.text))), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 14,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "11px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 13
  } }, /* @__PURE__ */ React.createElement("span", null, tl("\uBA54\uC2DC\uC9C0\uB97C \uC785\uB825\uD558\uC138\uC694...", "Type your message...")), /* @__PURE__ */ React.createElement("span", null, "\u2191")))))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#F8F8F5" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { id: "sec-diff", "data-animate": true, style: { textAlign: "center", marginBottom: 52, ...fadeIn("sec-diff") } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#FEF3C7",
    color: "#B45309",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 14
  } }, tl("\uB9C8\uC74C\uD480\uB9CC\uC758 \uCC28\uC774", "What makes Maumful different")), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 34, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "ChatGPT\uC5D0\uAC8C \uBB3C\uC5B4\uBCF4\uB294 \uAC83\uACFC", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uBB34\uC5C7\uC774 \uB2E4\uB978\uAC00\uC694?")), /* @__PURE__ */ React.createElement(React.Fragment, null, "How is this different", /* @__PURE__ */ React.createElement("br", null), "from ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "asking ChatGPT?")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", maxWidth: 520, margin: "0 auto" } }, tl("\uC77C\uD68C\uC131 \uB300\uD654\uAC00 \uC544\uB2CC, \uAC80\uC0AC \uAE30\uBC18 \uC9C0\uC18D \uAD00\uB9AC \uC0C1\uB2F4\uC785\uB2C8\uB2E4", "Not a one-off chat \u2014 ongoing, assessment-based mental wellness support"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 56 }, className: "compare-grid" }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "white",
    borderRadius: 16,
    padding: "32px 28px",
    border: "2px solid rgba(0,0,0,0.08)",
    opacity: 0.75
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22
  } }, "\u{1F916}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#555" } }, tl("\uC77C\uBC18 AI (ChatGPT \uB4F1)", "Generic AI (ChatGPT etc.)")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A" } }, tl("\uC77C\uD68C\uC131 \uB300\uD654 \uC11C\uBE44\uC2A4", "One-off conversation")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, tl([
    "\uB0B4 \uC2EC\uB9AC \uC0C1\uD0DC\uB97C \uC804\uD600 \uBAA8\uB978 \uCC44 \uB2F5\uBCC0",
    "\uC624\uB298 \uB300\uD654\uB294 \uB0B4\uC77C\uC774\uBA74 \uAE30\uC5B5 \uBABB\uD568",
    "\uAC80\uC0AC \uADFC\uAC70 \uC5C6\uB294 \uC77C\uBC18\uC801 \uC870\uC5B8",
    "\uC2DC\uAC04\uC774 \uC9C0\uB098\uB3C4 \uBCC0\uD654 \uCD94\uC801 \uBD88\uAC00",
    "\uB204\uAD6C\uC5D0\uAC8C\uB098 \uB3D9\uC77C\uD55C \uB2F5\uBCC0 \uD328\uD134"
  ], [
    "Responds with no knowledge of your mental state",
    "Today's conversation is forgotten tomorrow",
    "Generic advice with no assessment basis",
    "No tracking of changes over time",
    "Same response pattern for everyone"
  ]).map((t) => /* @__PURE__ */ React.createElement("div", { key: t, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#D1D5DB", fontSize: 16, flexShrink: 0 } }, "\u2717"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#888" } }, t))))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(135deg, #F0FAF4, #FAFAF8)",
    borderRadius: 16,
    padding: "32px 28px",
    border: "2px solid #52B788",
    position: "relative",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "#2D6A4F",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 100
  } }, tl("\uB9C8\uC74C\uD480 \uBC29\uC2DD", "Maumful Approach")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#D8F3DC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22
  } }, "\u{1F33F}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#1A1A1A" } }, tl("\uB9C8\uC74C\uD480 AI \uC0C1\uB2F4", "Maumful AI Counseling")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#52B788" } }, tl("\uC2EC\uB9AC\uAC80\uC0AC \uAE30\uBC18 \uC9C0\uC18D \uAD00\uB9AC", "Assessment-based continuous care")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, tl([
    "PHQ-9, GAD-7 \uB4F1 \uAC80\uC0AC \uACB0\uACFC\uB97C \uC774\uBBF8 \uC54C\uACE0 \uB300\uD654",
    "\uC774\uC804 \uAC80\uC0AC \uC774\uB825\xB7\uAC10\uC815 \uAE30\uB85D\uC744 \uAE30\uC5B5\uD574 \uB9E5\uB77D \uC720\uC9C0",
    "\uB0B4 \uC810\uC218\uC640 \uC751\uB2F5 \uD328\uD134 \uAE30\uBC18 \uAC1C\uC778\uD654 \uC0C1\uB2F4",
    "\uC2DC\uAC04 \uACBD\uACFC\uC5D0 \uB530\uB978 \uC2EC\uB9AC \uBCC0\uD654 \uD2B8\uB80C\uB4DC \uCD94\uC801",
    "\uB098\uB9CC\uC758 \uB370\uC774\uD130 \uD504\uB85C\uD544\uB85C \uC815\uBC00\uD55C \uC778\uC0AC\uC774\uD2B8"
  ], [
    "Already knows your PHQ-9, GAD-7 results when you chat",
    "Maintains context from your past test history and mood logs",
    "Personalized counseling based on your scores and response patterns",
    "Tracks your psychological changes and trends over time",
    "Precise insights powered by your personal data profile"
  ]).map((t) => /* @__PURE__ */ React.createElement("div", { key: t, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#52B788", fontSize: 16, flexShrink: 0 } }, "\u2713"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#3A3A3A" } }, t)))))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(135deg, #1A3D2B, #2D6A4F)",
    borderRadius: 20,
    padding: "40px 48px",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 40,
    alignItems: "center"
  }, className: "pdf-banner" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1px",
    padding: "4px 12px",
    borderRadius: 100,
    marginBottom: 16
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"), " NEW FEATURE"), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 26, fontWeight: 700, color: "white", marginBottom: 12, lineHeight: 1.4, wordBreak: "keep-all" } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "MBTI, MMPI, K-WAIS\u2026", /* @__PURE__ */ React.createElement("br", null), "\uC678\uBD80 \uAC80\uC0AC\uACB0\uACFC\uB3C4 AI\uAC00 \uD574\uC11D\uD574 \uB4DC\uB9BD\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement(React.Fragment, null, "MBTI, MMPI, K-WAIS\u2026", /* @__PURE__ */ React.createElement("br", null), "AI interprets your external test results too"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 20 } }, tl("\uB2E4\uB978 \uAE30\uAD00\uC5D0\uC11C \uBC1B\uC740 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC9C0\uB97C \uC5C5\uB85C\uB4DC\uD558\uAC70\uB098 \uC810\uC218\uB97C \uC785\uB825\uD558\uBA74, \uB9C8\uC74C\uD480 AI\uAC00 \uC804\uBB38\uC801\uC73C\uB85C \uD574\uC11D\uD558\uACE0 \uB9C8\uC74C\uD480 \uD504\uB85C\uD544\uC5D0 \uD1B5\uD569\uD569\uB2C8\uB2E4. \uC774\uD6C4 AI \uC0C1\uB2F4\uC774 \uC774 \uACB0\uACFC\uAE4C\uC9C0 \uBC18\uC601\uD574 \uB354 \uAE4A\uC774 \uC788\uB294 \uB300\uD654\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4.", "Upload a report or enter scores from any assessment you received elsewhere \u2014 Maumful AI interprets them professionally and integrates them into your profile, so future AI counseling conversations reflect the full picture.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, tl(["\u{1F4CE} PDF \uC5C5\uB85C\uB4DC", "\u270F\uFE0F \uC810\uC218 \uC9C1\uC811 \uC785\uB825", "\u{1F517} \uC0C1\uB2F4 \uC774\uB825 \uD1B5\uD569", "\u{1F4AC} AI \uD574\uC11D \uC989\uC2DC \uC81C\uACF5"], ["\u{1F4CE} PDF Upload", "\u270F\uFE0F Enter Scores Manually", "\u{1F517} Integrated History", "\u{1F4AC} Instant AI Interpretation"]).map((chip) => /* @__PURE__ */ React.createElement("span", { key: chip, style: {
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.88)",
    padding: "5px 12px",
    borderRadius: 100,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.2)"
  } }, chip)))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", flexShrink: 0 }, className: "pdf-banner-btn-wrap" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (isLoggedIn) {
          if (setAutoOpenExternal) setAutoOpenExternal(true);
        } else {
          setView("memberLogin");
        }
      },
      style: {
        background: "#F4A261",
        border: "none",
        borderRadius: 12,
        padding: "14px 28px",
        fontSize: 15,
        fontWeight: 700,
        color: "white",
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s",
        whiteSpace: "nowrap"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#E76F51";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#F4A261";
      }
    },
    tl("\uC678\uBD80 \uACB0\uACFC \uD574\uC11D\uD558\uAE30 \u2192", "Interpret External Results \u2192")
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" } }, tl("\uB85C\uADF8\uC778 \uD6C4 \uB9C8\uC774\uD398\uC774\uC9C0 \u2192 \uAC80\uC0AC\uC774\uB825\uC5D0\uC11C \uC0AC\uC6A9", "Sign in \u2192 My Page \u2192 Test History")))))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "white" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 52 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#FEF3C7",
    color: "#B45309",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 14
  } }, "How It Works"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 34, fontWeight: 700 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "3\uB2E8\uACC4\uB85C ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uAC04\uB2E8\uD558\uAC8C"), " \uC2DC\uC791"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Get started in ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "3 simple steps"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, position: "relative" }, className: "steps-grid" }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 32,
    left: "16.67%",
    right: "16.67%",
    height: 1,
    background: "linear-gradient(90deg, #B7E4C7, #52B788, #B7E4C7)",
    zIndex: 0
  } }), [
    { step: "01", icon: "\u{1F4CB}", title: tl("\uD68C\uC6D0\uAC00\uC785", "Sign Up"), desc: tl("\uC774\uBA54\uC77C\uB85C 30\uCD08 \uB9CC\uC5D0 \uAC00\uC785. \uC989\uC2DC 20 \uD06C\uB808\uB527 \uC9C0\uAE09\uB429\uB2C8\uB2E4.", "Sign up with email in 30 seconds. Receive 20 credits instantly."), note: tl("\uBB34\uB8CC\uAC80\uC0AC 2\uC885 + 20 \uD06C\uB808\uB527", "2 free tests + 20 credits") },
    { step: "02", icon: "\u{1F50D}", title: tl("\uAC80\uC0AC \uC120\uD0DD & \uC218\uD589", "Pick & Take a Test"), desc: tl("10\uAC00\uC9C0 \uAC80\uC0AC \uC911 \uC6D0\uD558\uB294 \uAC83\uC744 \uC120\uD0DD. \uC9C8\uBB38\uC5D0 \uC194\uC9C1\uD558\uAC8C \uB2F5\uD558\uC138\uC694.", "Choose from 10 assessments. Answer the questions honestly."), note: tl("\uCD5C\uC18C 5\uBD84\uC774\uBA74 \uC644\uB8CC", "Done in as little as 5 min") },
    { step: "03", icon: "\u{1F4AC}", title: tl("AI\uC640 \uACB0\uACFC \uC0C1\uB2F4", "AI Result Counseling"), desc: tl("\uAC80\uC0AC \uC644\uB8CC \uC989\uC2DC AI \uC0C1\uB2F4\uC0AC\uC640 \uB300\uD654\uB85C \uACB0\uACFC\uB97C \uBD84\uC11D\uD569\uB2C8\uB2E4.", "Right after your test, analyze your results through conversation with an AI counselor."), note: tl("\uB0B4 \uC5B8\uC5B4\uB85C \uC27D\uAC8C \uC774\uD574", "Understand in plain language") }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.step, style: { padding: "0 32px", textAlign: "center", position: "relative", zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "white",
    border: "2px solid #B7E4C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    margin: "0 auto 20px",
    boxShadow: "0 4px 16px rgba(45,106,79,0.12)"
  } }, s.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#52B788", letterSpacing: "1px", marginBottom: 8 } }, "STEP ", s.step), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 20, fontWeight: 700, marginBottom: 10 } }, s.title), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.7, marginBottom: 10 } }, s.desc), /* @__PURE__ */ React.createElement("span", { style: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    background: "#D8F3DC",
    color: "#2D6A4F",
    padding: "4px 12px",
    borderRadius: 100
  } }, s.note)))))), /* @__PURE__ */ React.createElement("section", { style: { background: "#2D6A4F", padding: 0 } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" },
      className: "stats-grid"
    },
    [
      { num: "10", label: tl("\uC804\uBB38 \uC2EC\uB9AC\xB7\uC9C4\uB85C \uAC80\uC0AC", "Professional Assessments") },
      { num: "10", label: tl("\uAC00\uC785 \uC989\uC2DC \uBB34\uB8CC \uD06C\uB808\uB527", "Free Credits on Signup") },
      { num: "5min~", label: tl("\uCD5C\uC18C \uAC80\uC0AC \uC18C\uC694\uC2DC\uAC04", "Minimum Test Duration") },
      { num: "100%", label: tl("\uB370\uC774\uD130 \uD504\uB77C\uC774\uBC84\uC2DC", "Data Privacy") }
    ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.label, style: {
      padding: "52px 20px",
      textAlign: "center",
      borderRight: i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 42, fontWeight: 700, color: "white", lineHeight: 1, marginBottom: 10 } }, s.num), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,0.65)" } }, s.label)))
  )), /* @__PURE__ */ React.createElement("section", { style: {
    padding: "100px 24px",
    textAlign: "center",
    background: "linear-gradient(135deg, #D8F3DC, #B7E4C7)"
  } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 40, fontWeight: 700, marginBottom: 16 } }, tl("\uC9C0\uAE08 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694", "Start your journey today")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 17, color: "#5A5A5A", marginBottom: 36 } }, tl("\uAC00\uC785 \uC989\uC2DC 20 \uD06C\uB808\uB527 \uC9C0\uAE09 \u2014 \uC2EC\uB9AC\uAC80\uC0AC 4\uD68C + AI \uC0C1\uB2F4 5\uD68C \uBB34\uB8CC", "Get 20 credits instantly on signup \u2014 4 assessments + 5 AI chats free")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView(isLoggedIn ? "memberDashboard" : "testsIntro"),
      style: {
        background: "#2D6A4F",
        color: "white",
        border: "none",
        padding: "16px 40px",
        borderRadius: 12,
        fontSize: 17,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#1B5138";
        e.currentTarget.style.transform = "translateY(-2px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#2D6A4F";
        e.currentTarget.style.transform = "none";
      }
    },
    tl("\uBB34\uB8CC \uD68C\uC6D0\uAC00\uC785 \u2192", "Sign up free \u2192")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("testsIntro"),
      style: {
        background: "white",
        color: "#2D6A4F",
        border: "1.5px solid #2D6A4F",
        borderRadius: 12,
        padding: "16px 36px",
        fontSize: 17,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#F0FAF4";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "white";
      }
    },
    tl("\uAC80\uC0AC \uBAA9\uB85D \uB458\uB7EC\uBCF4\uAE30", "Browse assessments")
  ))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "white" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }, className: "ai-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#D8F3DC",
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 20
  } }, "Counseling Centers"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC00\uAE4C\uC6B4 \uC0C1\uB2F4\uC13C\uD130\uB97C", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uBC14\uB85C \uCC3E\uC544\uBCF4\uC138\uC694")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Find a counseling center", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "near you")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC80\uC0AC \uACB0\uACFC\uB97C \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uBCF4\uC5EC\uC8FC\uBA74 \uCCAB \uC0C1\uB2F4\uBD80\uD130", /* @__PURE__ */ React.createElement("br", null), "\uB354 \uAE4A\uC774 \uC788\uB294 \uB300\uD654\uB97C \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Sharing your test results with a counselor helps you skip the small talk and dive deeper from the very first session."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
    { icon: "\u{1F4CD}", text: "\uCE74\uCE74\uC624\uB9F5\uC73C\uB85C \uB0B4 \uADFC\uCC98 \uC0C1\uB2F4\uC13C\uD130 \uC989\uC2DC \uAC80\uC0C9" },
    { icon: "\u{1F9E0}", text: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC \xB7 \uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130 \xB7 \uBCF5\uC9C0\uC13C\uD130" },
    { icon: "\u{1F4DE}", text: "24\uC2DC\uAC04 \uBB34\uB8CC \uC0C1\uB2F4\uC804\uD654 \uBC14\uB85C \uC5F0\uACB0" }
  ], [
    { icon: "\u{1F4CD}", text: "Search nearby centers instantly via Kakao Maps" },
    { icon: "\u{1F9E0}", text: "Psychiatry \xB7 Counseling centers \xB7 Community centers" },
    { icon: "\u{1F4DE}", text: "24-hour free crisis hotline direct connection" }
  ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setView("counseling"),
      style: {
        background: "#2D6A4F",
        color: "white",
        border: "none",
        borderRadius: 12,
        padding: "14px 32px",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#1B4332";
        e.currentTarget.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#2D6A4F";
        e.currentTarget.style.transform = "none";
      }
    },
    "\u{1F3E5} ",
    tl("\uC0C1\uB2F4\uC13C\uD130 \uCC3E\uAE30 \u2192", "Find a Center \u2192")
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, tl([
    { emoji: "\u{1F3E5}", name: "\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130", desc: "\uC6B0\uC6B8\xB7\uBD88\uC548\xB7\uB300\uC778\uAD00\uACC4\xB7\uBC88\uC544\uC6C3 \uC804\uBB38", color: "#2D6A4F", bg: "#D8F3DC", query: "\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130" },
    { emoji: "\u{1F9E0}", name: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC", desc: "\uC804\uBB38\uC758 \uC9C4\uB8CC \xB7 \uAC74\uAC15\uBCF4\uD5D8 \uC801\uC6A9", color: "#0284C7", bg: "#E0F2FE", query: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC" },
    { emoji: "\u{1F3E2}", name: "\uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130", desc: "\uC2DC\xB7\uAD70\xB7\uAD6C \uC6B4\uC601 \xB7 \uBB34\uB8CC \uBC29\uBB38 \uC0C1\uB2F4", color: "#D97706", bg: "#FEF3C7", query: "\uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130" }
  ], [
    { emoji: "\u{1F3E5}", name: "Counseling Centers", desc: "Depression \xB7 Anxiety \xB7 Relationships \xB7 Burnout", color: "#2D6A4F", bg: "#D8F3DC", query: "\uC2EC\uB9AC\uC0C1\uB2F4\uC13C\uD130" },
    { emoji: "\u{1F9E0}", name: "Psychiatry Clinics", desc: "Specialist care \xB7 National health insurance", color: "#0284C7", bg: "#E0F2FE", query: "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC" },
    { emoji: "\u{1F3E2}", name: "Community Mental Health Centers", desc: "Gov-run \xB7 Free walk-in counseling", color: "#D97706", bg: "#FEF3C7", query: "\uC815\uC2E0\uAC74\uAC15\uBCF5\uC9C0\uC13C\uD130" }
  ]).map((card) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: card.name,
      onClick: () => window.open(`https://map.kakao.com/?q=${encodeURIComponent(card.query)}`, "_blank", "noopener"),
      style: {
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
        borderLeft: `4px solid ${card.color}`,
        display: "flex",
        alignItems: "center",
        gap: 14
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateX(4px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, width: 44, height: 44, background: card.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, card.emoji),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, card.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#6B7280" } }, card.desc)),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: card.color, background: card.bg, padding: "3px 9px", borderRadius: 100, whiteSpace: "nowrap", flexShrink: 0 } }, tl("\uC9C0\uB3C4 \uAC80\uC0C9", "Map Search"))
  )))))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#F5F5F0" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" },
      className: "ai-grid"
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-block",
      background: "#D8F3DC",
      color: "#2D6A4F",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      padding: "5px 14px",
      borderRadius: 100,
      marginBottom: 20
    } }, "Healing Games"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB9C8\uC74C\uC744 \uAC00\uAFB8\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uCE58\uC720 \uAC8C\uC784")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Games that", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "nurture your mind")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 \uC5F0\uB3D9\uB41C \uB9C8\uC74C \uB3CC\uBD04 \uAC8C\uC784\uC73C\uB85C", /* @__PURE__ */ React.createElement("br", null), "\uC77C\uC0C1 \uC18D\uC5D0\uC11C \uB098\uC758 \uB9C8\uC74C\uC744 \uB3CC\uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Mind-care games linked to your test results \u2014 take care of your mind in everyday life."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
      { icon: "\u{1F33F}", text: "\uB9C8\uC74C\uC758 \uC815\uC6D0 \u2014 \uD638\uD761 \uD6C8\uB828 + \uC778\uC9C0 \uAD50\uC815 (\uBB34\uB8CC)" },
      { icon: "\u{1F338}", text: "\uAC10\uC815\uAF43 \uCC3E\uAE30 \u2014 \uAC10\uC815 \uC778\uC2DD \uD6C8\uB828" },
      { icon: "\u2B50", text: "\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30 \u2014 \uAE0D\uC815\uC2EC\uB9AC\uD559 \uB8E8\uD2F4" },
      { icon: "\u{1F333}", text: "\uB0B4\uBA74\uC758 \uB098\uBB34 \u2014 ACT \uAE30\uBC18 \uC790\uC544 \uC131\uC7A5" }
    ], [
      { icon: "\u{1F33F}", text: "Mind Garden \u2014 Breathing + Cognitive Training (Free)" },
      { icon: "\u{1F338}", text: "Emotion Flower \u2014 Emotional Awareness Training" },
      { icon: "\u2B50", text: "Starlight Gratitude \u2014 Positive Psychology Routine" },
      { icon: "\u{1F333}", text: "Inner Tree \u2014 ACT-Based Self Growth" }
    ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (!isLoggedIn) {
            setView("memberLogin");
            return;
          }
          const token = localStorage.getItem("access_token") || "";
          window.open(`https://game.maumful.com${token ? "?t=" + encodeURIComponent(token) : ""}`, "_blank", "noopener noreferrer");
        },
        style: {
          background: "#2D6A4F",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px 32px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR', sans-serif",
          transition: "all 0.2s"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#1B5138";
          e.currentTarget.style.transform = "translateY(-1px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#2D6A4F";
          e.currentTarget.style.transform = "none";
        }
      },
      tl("\uB9C8\uC74C \uAC8C\uC784 \uC2DC\uC791\uD558\uAE30 \u2192", "Start Healing Games \u2192")
    ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "#9A9A9A" } }, tl("\uB85C\uADF8\uC778 \uD6C4 \uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4", "No separate login needed \u2014 seamlessly linked after sign-in"))),
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, tl([
      { emoji: "\u{1F33F}", name: "\uB9C8\uC74C\uC758 \uC815\uC6D0", tag: "\uB808\uBCA8 1 \xB7 \uBB34\uB8CC", color: "#2D6A4F", bg: "#D8F3DC" },
      { emoji: "\u{1F338}", name: "\uAC10\uC815\uAF43 \uCC3E\uAE30", tag: "PHQ-9 \uC5F0\uB3D9", color: "#EC4899", bg: "#FDF2F8" },
      { emoji: "\u2B50", name: "\uBCC4\uBE5B \uAC10\uC0AC \uC77C\uAE30", tag: "\uB808\uBCA8 2", color: "#F59E0B", bg: "#FFFBEB" },
      { emoji: "\u{1F333}", name: "\uB0B4\uBA74\uC758 \uB098\uBB34", tag: "SDRI \uC5F0\uB3D9", color: "#059669", bg: "#ECFDF5" }
    ], [
      { emoji: "\u{1F33F}", name: "Mind Garden", tag: "Level 1 \xB7 Free", color: "#2D6A4F", bg: "#D8F3DC" },
      { emoji: "\u{1F338}", name: "Emotion Flower", tag: "PHQ-9 Linked", color: "#EC4899", bg: "#FDF2F8" },
      { emoji: "\u2B50", name: "Starlight Gratitude", tag: "Level 2", color: "#F59E0B", bg: "#FFFBEB" },
      { emoji: "\u{1F333}", name: "Inner Tree", tag: "SDRI Linked", color: "#059669", bg: "#ECFDF5" }
    ]).map((g) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: g.name,
        onClick: () => {
          if (!isLoggedIn) {
            setView("memberLogin");
            return;
          }
          const token = localStorage.getItem("access_token") || "";
          window.open(`https://game.maumful.com${token ? "?t=" + encodeURIComponent(token) : ""}`, "_blank", "noopener noreferrer");
        },
        style: {
          background: g.bg,
          borderRadius: 16,
          padding: "22px 18px",
          cursor: "pointer",
          transition: "all 0.2s",
          border: `1.5px solid ${g.color}22`
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, g.emoji),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, g.name),
      /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        background: "white",
        color: g.color,
        border: `1px solid ${g.color}44`
      } }, g.tag)
    )))
  ))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#FFF1F5" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" },
      className: "ai-grid"
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, tl([
      { emoji: "\u{1F495}", name: "BIG5 \uAD81\uD569 \uBD84\uC11D", tag: "\uC131\uACA9 \uCC28\uC774\uB97C \uAC15\uC810\uC73C\uB85C", color: "#E05A8A", bg: "#FFE4EE" },
      { emoji: "\u{1F916}", name: "AI \uCEE4\uD50C \uB9AC\uD3EC\uD2B8", tag: "\uB9DE\uCDA4 \uAD00\uACC4 \uC778\uC0AC\uC774\uD2B8", color: "#9333EA", bg: "#F3E8FF" },
      { emoji: "\u{1F4CA}", name: "\uAD00\uACC4 \uAC74\uAC15\uB3C4 \uCCB4\uD06C\uC778", tag: "\uC6D4 1\uD68C \uBB34\uB8CC", color: "#0891B2", bg: "#E0F7FA" },
      { emoji: "\u{1F5D3}\uFE0F", name: "\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C", tag: "AI \uAC1C\uC778\uD654 \uCD94\uCC9C", color: "#D97706", bg: "#FEF3C7" }
    ], [
      { emoji: "\u{1F495}", name: "BIG5 Compatibility", tag: "Turn differences into strengths", color: "#E05A8A", bg: "#FFE4EE" },
      { emoji: "\u{1F916}", name: "AI Couple Report", tag: "Personalized relationship insights", color: "#9333EA", bg: "#F3E8FF" },
      { emoji: "\u{1F4CA}", name: "Relationship Check-In", tag: "Free once a month", color: "#0891B2", bg: "#E0F7FA" },
      { emoji: "\u{1F5D3}\uFE0F", name: "Date Ideas", tag: "AI-personalized picks", color: "#D97706", bg: "#FEF3C7" }
    ]).map((g) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: g.name,
        onClick: () => {
          if (!isLoggedIn) {
            setView("memberLogin");
            return;
          }
          const h = window.location.hostname;
          const coupleBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
          fetch("/api/couple-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
            const t = data.success ? data.coupleToken : localStorage.getItem("access_token") || "";
            window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, "_blank", "noopener noreferrer");
          }).catch(() => window.open(coupleBase, "_blank", "noopener noreferrer"));
        },
        style: {
          background: g.bg,
          borderRadius: 16,
          padding: "22px 18px",
          cursor: "pointer",
          transition: "all 0.2s",
          border: `1.5px solid ${g.color}22`
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, g.emoji),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, g.name),
      /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        background: "white",
        color: g.color,
        border: `1px solid ${g.color}44`
      } }, g.tag)
    ))),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-block",
      background: "#FFE4EE",
      color: "#E05A8A",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      padding: "5px 14px",
      borderRadius: 100,
      marginBottom: 20
    } }, "Couple Insights"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uD568\uAED8 \uC131\uC7A5\uD558\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#E05A8A" } }, "\uB9C8\uC74C\uCEE4\uD50C")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Grow together with", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#E05A8A" } }, "Maumful Couple")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "BIG5 \uC131\uACA9 \uAC80\uC0AC\uB97C \uAE30\uBC18\uC73C\uB85C \uC6B0\uB9AC \uB458\uC758 \uAD81\uD569\uC744 \uBD84\uC11D\uD558\uACE0,", /* @__PURE__ */ React.createElement("br", null), "AI\uAC00 \uC0DD\uC131\uD55C \uB9DE\uCDA4 \uAD00\uACC4 \uB9AC\uD3EC\uD2B8\uB85C \uB354 \uAE4A\uC774 \uC774\uD574\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Analyze your compatibility based on BIG5 personality scores \u2014 and understand each other more deeply through AI-generated relationship reports."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
      { icon: "\u{1F495}", text: "BIG5 \uAD81\uD569 \uBD84\uC11D \u2014 \uC131\uACA9 \uCC28\uC774\uB97C \uAC15\uC810\uC73C\uB85C \uC804\uD658" },
      { icon: "\u{1F916}", text: "AI \uCEE4\uD50C \uB9AC\uD3EC\uD2B8 \u2014 \uD30C\uD2B8\uB108\uC640 \uD568\uAED8 \uBD84\uC11D (\uBB34\uB8CC)" },
      { icon: "\u{1F4CA}", text: "\uAD00\uACC4 \uAC74\uAC15\uB3C4 \uCCB4\uD06C\uC778 \u2014 \uC6D4 1\uD68C \uBB34\uB8CC" },
      { icon: "\u{1F5D3}\uFE0F", text: "\uB370\uC774\uD2B8 \uCF54\uC2A4 \uCD94\uCC9C \u2014 \uCDE8\uD5A5 \uAE30\uBC18 AI \uAC1C\uC778\uD654" }
    ], [
      { icon: "\u{1F495}", text: "BIG5 Compatibility \u2014 Turn personality differences into strengths" },
      { icon: "\u{1F916}", text: "AI Couple Report \u2014 Analyze together with your partner (Free)" },
      { icon: "\u{1F4CA}", text: "Relationship Check-In \u2014 Free, once a month" },
      { icon: "\u{1F5D3}\uFE0F", text: "Date Ideas \u2014 AI-personalized for your tastes" }
    ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (!isLoggedIn) {
            setView("memberLogin");
            return;
          }
          const h = window.location.hostname;
          const coupleBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
          fetch("/api/couple-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
            const t = data.success ? data.coupleToken : localStorage.getItem("access_token") || "";
            window.open(`${coupleBase}?t=${encodeURIComponent(t)}`, "_blank", "noopener noreferrer");
          }).catch(() => window.open(coupleBase, "_blank", "noopener noreferrer"));
        },
        style: {
          background: "#E05A8A",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px 32px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR', sans-serif",
          transition: "all 0.2s"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#C0456F";
          e.currentTarget.style.transform = "translateY(-1px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#E05A8A";
          e.currentTarget.style.transform = "none";
        }
      },
      tl("\uB9C8\uC74C\uCEE4\uD50C \uC2DC\uC791\uD558\uAE30 \u2192", "Start Maumful Couple \u2192")
    ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "#9A9A9A" } }, tl("\uB85C\uADF8\uC778 \uD6C4 \uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4", "No separate login needed \u2014 seamlessly linked after sign-in")))
  ))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#EEF5FD" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" },
      className: "ai-grid"
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, tl([
      { emoji: "\u{1F9A6}", name: "\uB610\uB610\uC640 \uB300\uD654", tag: "\uC544\uC774\uC758 \uB9C8\uC74C \uCE5C\uAD6C", color: "#3B6FB5", bg: "#E7F0FB" },
      { emoji: "\u{1F916}", name: "\uB9C8\uC74C \uC77D\uC5B4 \uC804\uD558\uAE30", tag: "\uBD80\uBAA8\uB2D8\uAED8 \uB530\uB73B\uD558\uAC8C", color: "#9333EA", bg: "#F3E8FF" },
      { emoji: "\u{1F4F7}", name: "\uD45C\uC815 \uC601\uC0C1 \uBD84\uC11D", tag: "\uAE30\uAE30 \uB0B4\xB7\uC800\uC7A5 \uC548 \uD568", color: "#0891B2", bg: "#E0F7FA" },
      { emoji: "\u{1F512}", name: "\uC548\uC804 \uC124\uACC4", tag: "PIN\xB7\uC704\uAE30 \uC548\uB0B4", color: "#16A34A", bg: "#E7F6EC" }
    ], [
      { emoji: "\u{1F9A6}", name: "Talk with Otto", tag: "A child's heart-friend", color: "#3B6FB5", bg: "#E7F0FB" },
      { emoji: "\u{1F916}", name: "AI Emotion Read", tag: "Coaching report for parents", color: "#9333EA", bg: "#F3E8FF" },
      { emoji: "\u{1F4F7}", name: "Facial Reading", tag: "On-device \xB7 not stored", color: "#0891B2", bg: "#E0F7FA" },
      { emoji: "\u{1F512}", name: "Safe by Design", tag: "Parent PIN \xB7 crisis flags", color: "#16A34A", bg: "#E7F6EC" }
    ]).map((g) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: g.name,
        onClick: openOtter,
        style: {
          background: g.bg,
          borderRadius: 16,
          padding: "22px 18px",
          cursor: "pointer",
          transition: "all 0.2s",
          border: `1.5px solid ${g.color}22`
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, g.emoji),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, g.name),
      /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 100,
        background: "white",
        color: g.color,
        border: `1px solid ${g.color}44`
      } }, g.tag)
    ))),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      display: "inline-block",
      background: "#E1EDFB",
      color: "#3B6FB5",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      padding: "5px 14px",
      borderRadius: 100,
      marginBottom: 20
    } }, "Maumotter"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC544\uC774\uC758 \uC18D\uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD558\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#3B6FB5" } }, "\uB9C8\uC74C\uC218\uB2EC")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Reading your child's heart", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#3B6FB5" } }, "Maumotter")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC544\uC774\uAC00 \uC218\uB2EC \uCE5C\uAD6C '\uB610\uB610'\uC640 \uB3C4\uB780\uB3C4\uB780 \uC774\uC57C\uAE30\uD558\uBA74,", /* @__PURE__ */ React.createElement("br", null), "\uADF8 \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uBD80\uBAA8\uB2D8\uC774 \uC774\uD574\xB7\uD589\uB3D9\uD560 \uC218 \uC788\uB294 \uB530\uB73B\uD55C \uCF54\uCE6D\uC73C\uB85C \uC804\uD574 \uB4DC\uB824\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "When your child chats with the otter friend 'Otto',", /* @__PURE__ */ React.createElement("br", null), "we read their heart and share it as warm coaching parents can act on."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
      { icon: "\u{1F9A6}", text: "\uB610\uB610\uC640 \uB300\uD654 \u2014 \uC544\uC774\uAC00 \uD3B8\uD558\uAC8C \uC18D\uB9C8\uC74C\uC744 \uAEBC\uB0B4\uC694" },
      { icon: "\u{1F916}", text: "\uB9C8\uC74C \uC77D\uC5B4 \uC804\uD558\uAE30 \u2014 \uBD80\uBAA8\uB2D8\uAED8 \uB530\uB73B\uD55C \uCF54\uCE6D\uC73C\uB85C" },
      { icon: "\u{1F4F7}", text: "\uD45C\uC815 \uC601\uC0C1 \u2014 \uAE30\uAE30 \uB0B4 \uBD84\uC11D\xB7\uC800\uC7A5 \uC548 \uD568" },
      { icon: "\u{1F512}", text: "\uC548\uC804 \uC124\uACC4 \u2014 \uBD80\uBAA8 PIN\xB7\uC704\uAE30 \uC2E0\uD638 \uC548\uB0B4" }
    ], [
      { icon: "\u{1F9A6}", text: "Talk with Otto \u2014 kids open up comfortably" },
      { icon: "\u{1F916}", text: "AI Emotion Read \u2014 coaching report for parents" },
      { icon: "\u{1F4F7}", text: "Facial Reading \u2014 analyzed on-device, not stored" },
      { icon: "\u{1F512}", text: "Safe by Design \u2014 parent PIN \xB7 crisis flags" }
    ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: openOtter,
        style: {
          background: "#3B6FB5",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px 32px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR', sans-serif",
          transition: "all 0.2s"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#2F5C99";
          e.currentTarget.style.transform = "translateY(-1px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#3B6FB5";
          e.currentTarget.style.transform = "none";
        }
      },
      tl("\uB9C8\uC74C\uC218\uB2EC \uC2DC\uC791\uD558\uAE30 \u2192", "Start Maumotter \u2192")
    ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "#9A9A9A" } }, tl("\uB85C\uADF8\uC778 \uC2DC \uBCC4\uB3C4 \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4 (\uB9C8\uC74C\uC218\uB2EC\uC740 \uBCC4\uB3C4 \uC11C\uBE44\uC2A4\uC608\uC694)", "Seamless single sign-on when logged in (Maumotter is a separate service)")))
  ))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#FDF6EC" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }, className: "ai-grid" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, tl([
    { emoji: "\u{1F4AC}", name: "\uB300\uD654 \uD1B5\uC5ED", tag: "\uB9D0 \uC18D \uC9C4\uC9DC \uB9C8\uC74C", color: "#B45309", bg: "#FEF3C7" },
    { emoji: "\u{1F54A}\uFE0F", name: "\uC2F8\uC6C0 \uC911\uC7AC", tag: "\uAC08\uB4F1 \uB300\uD654 \uBD84\uC11D", color: "#C2410C", bg: "#FFEDD5" },
    { emoji: "\u{1F497}", name: "\uAD00\uC810 \uBC14\uAFD4\uBCF4\uAE30", tag: "\uC0C1\uB300 \uC785\uC7A5\uC5D0\uC11C", color: "#DB2777", bg: "#FCE7F3" },
    { emoji: "\u271D\uFE0F", name: "\uC2EC\uB9AC\xB7\uAE30\uB3C5\uAD50 \uD2B8\uB799", tag: "\uAD00\uC810 \uC120\uD0DD \uAC00\uB2A5", color: "#7C3AED", bg: "#F3E8FF" }
  ], [
    { emoji: "\u{1F4AC}", name: "Translate talk", tag: "the real meaning", color: "#B45309", bg: "#FEF3C7" },
    { emoji: "\u{1F54A}\uFE0F", name: "Mediation", tag: "analyze conflicts", color: "#C2410C", bg: "#FFEDD5" },
    { emoji: "\u{1F497}", name: "Perspective", tag: "partner's view", color: "#DB2777", bg: "#FCE7F3" },
    { emoji: "\u271D\uFE0F", name: "Two tracks", tag: "psych & faith", color: "#7C3AED", bg: "#F3E8FF" }
  ]).map((g) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: g.name,
      onClick: openBubu,
      style: { background: g.bg, borderRadius: 16, padding: "22px 18px", cursor: "pointer", transition: "all 0.2s", border: `1.5px solid ${g.color}22` },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, g.emoji),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, g.name),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "white", color: g.color, border: `1px solid ${g.color}44` } }, g.tag)
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", background: "#FBE8C9", color: "#B45309", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 20 } }, "Maumful Bubu"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uBD80\uBD80\uC758 \uB9D0\uACFC \uB9C8\uC74C\uC744 \uD1B5\uC5ED\uD558\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#B45309" } }, "\uB9C8\uC74C\uBD80\uBD80")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Interpreting words & hearts", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#B45309" } }, "Maumful Bubu")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uAC19\uC740 \uB9D0\uB3C4 \uC11C\uB85C \uB2E4\uB974\uAC8C \uB4E4\uB9AC\uB294 \uBD80\uBD80 \uC0AC\uC774,", /* @__PURE__ */ React.createElement("br", null), "\uB9D0 \uC18D\uC5D0 \uB2F4\uAE34 \uC9C4\uC9DC \uB9C8\uC74C\uC744 \uC77D\uC5B4 \uC804\uD558\uACE0 \uAC08\uB4F1\uC744 \uC911\uC7AC\uD574 \uB4DC\uB824\uC694. \uCCAB 3\uD68C\uB294 \uBB34\uB8CC\uC608\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Couples often hear the same words differently.", /* @__PURE__ */ React.createElement("br", null), "We read the real heart behind them and help mediate conflict. First 3 free."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
    { icon: "\u{1F4AC}", text: "\uB300\uD654 \uD1B5\uC5ED \u2014 \uB9D0 \uC18D\uC5D0 \uB2F4\uAE34 \uC9C4\uC9DC \uB9C8\uC74C\uC744 \uC77D\uC5B4\uC694" },
    { icon: "\u{1F54A}\uFE0F", text: "\uC2F8\uC6C0 \uC911\uC7AC \u2014 \uAC08\uB4F1\uC774 \uB41C \uB300\uD654\uB97C \uD568\uAED8 \uD480\uC5B4\uC694" },
    { icon: "\u{1F497}", text: "\uAD00\uC810 \uBC14\uAFD4\uBCF4\uAE30 \u2014 \uC0C1\uB300\uC758 \uC785\uC7A5\uC5D0\uC11C \uB2E4\uC2DC \uB4E4\uC5B4\uC694" },
    { icon: "\u271D\uFE0F", text: "\uC2EC\uB9AC \uC0C1\uB2F4\xB7\uAE30\uB3C5\uAD50 \uD2B8\uB799 \uC911 \uC6D0\uD558\uB294 \uAD00\uC810 \uC120\uD0DD" }
  ], [
    { icon: "\u{1F4AC}", text: "Translate talk \u2014 read the real meaning behind words" },
    { icon: "\u{1F54A}\uFE0F", text: "Mediation \u2014 work through the conversation that hurt" },
    { icon: "\u{1F497}", text: "Perspective \u2014 hear it again from their side" },
    { icon: "\u271D\uFE0F", text: "Choose a psychology or Christian track" }
  ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openBubu,
      style: { background: "#B45309", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s" },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#92400E";
        e.currentTarget.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#B45309";
        e.currentTarget.style.transform = "none";
      }
    },
    tl("\uB9C8\uC74C\uBD80\uBD80 \uC2DC\uC791\uD558\uAE30 \u2192", "Start Maumful Bubu \u2192")
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "#9A9A9A" } }, tl("\uB9CC 19\uC138 \uC774\uC0C1 \uBD80\uBD80 \uB300\uC0C1 \xB7 \uC6D0\uBB38\uC740 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC544\uC694", "For married couples 19+ \xB7 your words are not stored")))))), /* @__PURE__ */ React.createElement("section", { style: { padding: "80px 24px", background: "#ECFBFD" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }, className: "ai-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", background: "#CFF3F7", color: "#0E7490", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 20 } }, "Maumful Sedae"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 36, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uBD80\uBAA8\uC640 \uC790\uB140 \uC0AC\uC774\uB97C \uC787\uB294", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#0E7490" } }, "\uB9C8\uC74C\uC138\uB300")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Bridging parent and child", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#0E7490" } }, "Maumful Sedae")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", lineHeight: 1.8, marginBottom: 28 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC138\uB300\uAC00 \uB2E4\uB974\uBA74 \uAC19\uC740 \uB9D0\uB3C4 \uB2E4\uB974\uAC8C \uB2FF\uC544\uC694.", /* @__PURE__ */ React.createElement("br", null), "\uBD80\uBAA8\uC640 \uC790\uB140 \uC0AC\uC774\uC5D0 \uB193\uC778 \uB9D0\uC758 \uAC04\uADF9\uC744 \uD1B5\uC5ED\uD574 \uC804\uD574 \uB4DC\uB824\uC694. \uCCAD\uC18C\uB144\uC740 \uBB34\uB8CC\uB85C \uC774\uC6A9\uD574\uC694."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Across generations, the same words land differently.", /* @__PURE__ */ React.createElement("br", null), "We interpret the gap between parent and child. Free for teens."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 } }, tl([
    { icon: "\u{1F33F}", text: "\uBD80\uBAA8-\uC790\uB140 \uD1B5\uC5ED \u2014 \uC138\uB300 \uC0AC\uC774 \uB9D0\uC758 \uAC04\uADF9\uC744 \uC77D\uC5B4\uC694" },
    { icon: "\u{1F9D2}", text: "\uCCAD\uC18C\uB144 \uC548\uC804 \uC6B0\uC120 \u2014 \uC544\uC774 \uBCF4\uD638\uAC00 \uC5B8\uC81C\uB098 \uBA3C\uC800" },
    { icon: "\u{1F4E8}", text: "\uC6F9\uBDF0 \uACF5\uC720 \u2014 \uC571 \uC124\uCE58 \uC5C6\uC774 \uB9C1\uD06C\uB85C \uC5F4\uB78C" },
    { icon: "\u{1F91D}", text: "\uAC00\uC871 \uCEE4\uBBA4\uB2C8\uD2F0 \u2014 \uC131\uC778 \uC804\uC6A9 \uBC29\uC5D0\uC11C \uD568\uAED8 \uB098\uB220\uC694" }
  ], [
    { icon: "\u{1F33F}", text: "Parent-child \u2014 read the generation gap in words" },
    { icon: "\u{1F9D2}", text: "Teen safety first \u2014 protecting the child always comes first" },
    { icon: "\u{1F4E8}", text: "Web share \u2014 open via link, no app install" },
    { icon: "\u{1F91D}", text: "Family community \u2014 adults-only rooms to talk" }
  ]).map((item) => /* @__PURE__ */ React.createElement("div", { key: item.text, style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, item.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#5A5A5A" } }, item.text)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openSedae,
      style: { background: "#0E7490", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s" },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "#0B5A70";
        e.currentTarget.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "#0E7490";
        e.currentTarget.style.transform = "none";
      }
    },
    tl("\uB9C8\uC74C\uC138\uB300 \uC2DC\uC791\uD558\uAE30 \u2192", "Start Maumful Sedae \u2192")
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontSize: 12, color: "#9A9A9A" } }, tl("\uCCAD\uC18C\uB144(\uB9CC14~18)\uC740 \uBB34\uB8CC \xB7 \uC544\uC774 \uBCF4\uD638\uAC00 \uC6B0\uC120\uC778 \uC548\uC804 \uC124\uACC4", "Free for teens (14\u201318) \xB7 safety-first for children"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, tl([
    { emoji: "\u{1F33F}", name: "\uBD80\uBAA8-\uC790\uB140 \uD1B5\uC5ED", tag: "\uC138\uB300 \uAC04 \uB9D0\uC758 \uAC04\uADF9", color: "#0E7490", bg: "#CFFAFE" },
    { emoji: "\u{1F9D2}", name: "\uCCAD\uC18C\uB144 \uC548\uC804 \uC6B0\uC120", tag: "\uBCF4\uD638\uAC00 \uBA3C\uC800", color: "#16A34A", bg: "#E7F6EC" },
    { emoji: "\u{1F4E8}", name: "\uC6F9\uBDF0\uB85C \uACF5\uC720", tag: "\uC571 \uC5C6\uC774 \uC5F4\uB78C", color: "#2563EB", bg: "#E0EAFF" },
    { emoji: "\u{1F91D}", name: "\uAC00\uC871 \uCEE4\uBBA4\uB2C8\uD2F0", tag: "\uC131\uC778 \uC804\uC6A9 \uBC29", color: "#9333EA", bg: "#F3E8FF" }
  ], [
    { emoji: "\u{1F33F}", name: "Parent-child", tag: "the generation gap", color: "#0E7490", bg: "#CFFAFE" },
    { emoji: "\u{1F9D2}", name: "Teen safety", tag: "protection first", color: "#16A34A", bg: "#E7F6EC" },
    { emoji: "\u{1F4E8}", name: "Web share", tag: "no app needed", color: "#2563EB", bg: "#E0EAFF" },
    { emoji: "\u{1F91D}", name: "Community", tag: "adults only", color: "#9333EA", bg: "#F3E8FF" }
  ]).map((g) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: g.name,
      onClick: openSedae,
      style: { background: g.bg, borderRadius: 16, padding: "22px 18px", cursor: "pointer", transition: "all 0.2s", border: `1.5px solid ${g.color}22` },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, g.emoji),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 } }, g.name),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "white", color: g.color, border: `1px solid ${g.color}44` } }, g.tag)
  )))))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F0FDF4",
    borderTop: "1px solid #86EFAC",
    borderBottom: "1px solid #86EFAC",
    padding: "10px 24px",
    textAlign: "center",
    fontSize: 12,
    color: "#166534",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap"
  } }, /* @__PURE__ */ React.createElement("span", null, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, tl(
    /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("strong", null, "\uBCF8 \uC11C\uBE44\uC2A4\uB294 \uC790\uAE30\uC774\uD574 \uBC0F \uC815\uBCF4 \uC81C\uACF5 \uBAA9\uC801\uC758 \uCF58\uD150\uCE20 \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4."), " ", "\uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uC640 AI \uC0C1\uB2F4\uC740 \uC758\uB8CC\uC801 \uC9C4\uB2E8\xB7\uCE58\uB8CC\uB97C \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", " ", "\uB9C8\uC74C\uC774 \uD798\uB4DC\uC2E4 \uB550 \uC0C1\uB2F4 \uC5F0\uACB0\uC744 \uC774\uC6A9\uD574 \uBCF4\uC138\uC694."),
    /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("strong", null, "This service is for self-understanding and informational purposes only."), " ", "Test results and AI counseling do not replace medical diagnosis or treatment.", " ", "If you are struggling, please reach out for professional support.")
  ))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FFF8E1",
    borderTop: "1px solid #F4A261",
    padding: "10px 24px",
    textAlign: "center",
    fontSize: 13,
    color: "#854D0E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap"
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F198}"), /* @__PURE__ */ React.createElement("strong", null, tl("\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654", "Suicide Prevention Hotline"), " 109"), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("strong", null, tl("\uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654", "Mental Health Crisis Line"), " 1577-0199"), /* @__PURE__ */ React.createElement("span", null, "\u2014"), /* @__PURE__ */ React.createElement("span", null, tl("24\uC2DC\uAC04 \uBB34\uB8CC \xB7 \uBCF4\uAC74\uBCF5\uC9C0\uBD80", "24/7 Free \xB7 Ministry of Health and Welfare (Korea)"))), /* @__PURE__ */ React.createElement("section", { style: { background: "#FAFAF7", padding: "36px 24px", borderTop: "1px solid #ECEAE3" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1160, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("h3", { style: { textAlign: "center", fontSize: 18, fontWeight: 700, color: "#2C2C2C", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" } }, tl("\uD568\uAED8\uD558\uBA74 \uC88B\uC740 \uB9C8\uC74C \uC11C\uBE44\uC2A4", "Related Services")), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", fontSize: 13, color: "#8A8A82", marginBottom: 22 } }, tl("\uB9C8\uC74C\uD480\uACFC \uD568\uAED8 \uC774\uC6A9\uD558\uBA74 \uC88B\uC740 \uC11C\uBE44\uC2A4\uB4E4\uC774\uC5D0\uC694", "Services that pair well with Maumful")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" } }, [
    { emoji: "\u271D\uFE0F", name: "The Light of Life", desc: tl("\uC131\uACBD\uC801 \uC0C1\uB2F4\xB7\uC2EC\uB9AC\uAC80\uC0AC", "Biblical counseling & assessments"), url: "https://jesusmaum.com", domain: "jesusmaum.com", accent: "#0F2044" },
    { emoji: "\u{1F43E}", name: tl("\uB9C8\uC74C\uACC1", "Maumgyeot"), desc: tl("\uBC18\uB824\uB3D9\uBB3C \uB9C8\uC74C \uC77D\uC5B4 \uC804\uD558\uAE30", "Read your pet's feelings"), url: "https://maumgyeot.com", domain: "maumgyeot.com", accent: "#2E8B7A" },
    { emoji: "\u{1F3E2}", name: "phyweb", desc: tl("\uAE30\uC5C5\xB7\uAE30\uAD00 \uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC", "Assessments for organizations"), url: "https://phyweb.pages.dev", domain: "phyweb.pages.dev", accent: "#2E7D6B" }
  ].map((s) => /* @__PURE__ */ React.createElement(
    "a",
    {
      key: s.domain,
      href: s.url,
      target: "_blank",
      rel: "noopener noreferrer",
      style: { flex: "1 1 230px", maxWidth: 280, display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", background: "white", border: "1px solid #ECEAE3", borderRadius: 14, textDecoration: "none", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: 11, background: s.accent + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 } }, s.emoji),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#2C2C2C", fontFamily: "'Noto Sans KR', sans-serif" } }, s.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#8A8A82", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, s.desc), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: s.accent, marginTop: 3, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, s.domain, " \u2192"))
  ))))), /* @__PURE__ */ React.createElement("footer", { className: "landing-footer", style: { background: "#141414", color: "rgba(255,255,255,0.55)", padding: "56px 40px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1200, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 40 },
      className: "footer-grid"
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 20,
      fontWeight: 700,
      color: "white",
      marginBottom: 12,
      fontFamily: "'Noto Sans KR', sans-serif"
    } }, "\u{1F33F} \uB9C8\uC74C\uD480"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, lineHeight: 1.8 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uB098\uB97C \uC774\uD574\uD558\uB294 \uCCAB\uAC78\uC74C.", /* @__PURE__ */ React.createElement("br", null), "\uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC\uC640 AI \uC0C1\uB2F4\uC744 \uD55C \uACF3\uC5D0\uC11C."), /* @__PURE__ */ React.createElement(React.Fragment, null, "Your journey to self-understanding.", /* @__PURE__ */ React.createElement("br", null), "Assessments & AI counseling in one place.")))),
    tl([
      {
        title: "\uC2EC\uB9AC\uAC80\uC0AC",
        links: ["PHQ-9 \uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80", "GAD-7 \uBD88\uC548", "DASS-21", "Big5 \uC131\uACA9", "\uC804\uCCB4 \uAC80\uC0AC \uBCF4\uAE30"]
      },
      {
        title: "\uC11C\uBE44\uC2A4",
        links: ["AI \uC0C1\uB2F4", "\uB9C8\uC74C \uAC8C\uC784", "\uB9C8\uC74C\uCEE4\uD50C", "\uD06C\uB808\uB527 \uCDA9\uC804"]
      },
      {
        title: "\uACE0\uAC1D\uC9C0\uC6D0",
        links: ["\uC774\uC6A9\uC57D\uAD00", "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68", "FAQ", "\uBB38\uC758\uD558\uAE30"]
      }
    ], [
      {
        title: "Assessments",
        links: ["PHQ-9 Depression", "GAD-7 Anxiety", "DASS-21", "Big5 Personality", "View All Assessments"]
      },
      {
        title: "Services",
        links: ["AI Counseling", "Healing Games", "Maumful Couple", "Buy Credits"]
      },
      {
        title: "Support",
        links: ["Terms of Service", "Privacy Policy", "FAQ", "Contact Us"]
      }
    ]).map((col) => /* @__PURE__ */ React.createElement("div", { key: col.title }, /* @__PURE__ */ React.createElement("h4", { style: { color: "white", fontSize: 14, fontWeight: 600, marginBottom: 14 } }, col.title), col.links.map((l) => /* @__PURE__ */ React.createElement("div", { key: l, style: { marginBottom: 9 } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: { fontSize: 13, color: "rgba(255,255,255,0.45)", cursor: "pointer" },
        onMouseEnter: (e) => e.currentTarget.style.color = "rgba(255,255,255,0.8)",
        onMouseLeave: (e) => e.currentTarget.style.color = "rgba(255,255,255,0.45)",
        onClick: () => {
          if (l === "\uC774\uC6A9\uC57D\uAD00" || l === "Terms of Service") setView("terms");
          if (l === "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68" || l === "Privacy Policy") setView("privacy");
          if (l === "\uC5B4\uB4DC\uBBFC") setView("counselingAdmin");
          if (l === "\uB9C8\uC74C\uCEE4\uD50C") {
            if (!isLoggedIn) {
              setView("memberLogin");
              return;
            }
            const h = window.location.hostname;
            const coupleBase = h.includes("workers.dev") || h.includes("-dev.") ? "https://maumcouple-dev.limyj007.workers.dev" : "https://couple.maumful.com";
            fetch("/api/couple-token", { headers: { Authorization: "Bearer " + (localStorage.getItem("access_token") || "") } }).then((r) => r.json()).then((data) => {
              window.open(`${coupleBase}?t=${encodeURIComponent(data.coupleToken || "")}`, "_blank", "noopener noreferrer");
            }).catch(() => window.open(coupleBase, "_blank", "noopener noreferrer"));
          }
        }
      },
      l
    )))))
  ), /* @__PURE__ */ React.createElement(MfSnsFooter, { tl }), /* @__PURE__ */ React.createElement("div", { style: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 24,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.9
  } }, /* @__PURE__ */ React.createElement("p", { style: { marginBottom: 6 } }, "\uBCF8 \uC11C\uBE44\uC2A4\uB294 \uC790\uAE30\uC774\uD574 \uBC0F \uC815\uBCF4 \uC81C\uACF5 \uBAA9\uC801\uC758 \uCF58\uD150\uCE20 \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4. \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC \uBC0F AI \uC0C1\uB2F4\uC740 \uC758\uB8CC\uC801 \uC9C4\uB2E8\xB7\uCE58\uB8CC\uB97C \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9C8\uC74C\uC774 \uB9CE\uC774 \uD798\uB4DC\uC2E4 \uB550 \uC544\uB798 \uBB34\uB8CC \uC0C1\uB2F4\uC744 \uC774\uC6A9\uD574 \uBCF4\uC138\uC694. \uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654 109 \xB7 \uC815\uC2E0\uAC74\uAC15\uC704\uAE30\uC0C1\uB2F4\uC804\uD654 1577-0199 (24\uC2DC\uAC04)"), /* @__PURE__ */ React.createElement("p", { style: { marginBottom: 4 } }, "\uC0C1\uD638: \uB9C8\uC74C\uC11C\uBE44\uC2A4 \xB7 \uB300\uD45C\uC790: \uAE40\uADFC\uD61C \xB7 \uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638: 780-31-01832 \xB7 \uD1B5\uC2E0\uD310\uB9E4\uC5C5 \uC2E0\uACE0\uBC88\uD638: \uC81C 2026-\uC11C\uC6B8\uC601\uB4F1\uD3EC-1157 \uD638"), /* @__PURE__ */ React.createElement("p", { style: { marginBottom: 6 } }, "\uC0AC\uC5C5\uC7A5: \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC601\uB4F1\uD3EC\uAD6C \uBB38\uB798\uB85C26\uAE38 6, 102\uB3D9 1603\uD638 (\uBB38\uB798\uB3D93\uAC00) \xB7 \uC774\uBA54\uC77C: support@maumful.com \xB7 \uC5F0\uB77D\uCC98: 050-6789-0845"), /* @__PURE__ */ React.createElement("p", { style: { marginBottom: 6 } }, "\uAC1C\uC778\uC815\uBCF4 \uCE68\uD574\uC2E0\uACE0: \uAC1C\uC778\uC815\uBCF4\uBCF4\uD638\uC704\uC6D0\uD68C 182 \xB7 \uD638\uC2A4\uD305: Cloudflare, Inc."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", null, "\xA9 2026 \uB9C8\uC74C\uC11C\uBE44\uC2A4(\uB9C8\uC74C\uD480). All rights reserved."), /* @__PURE__ */ React.createElement("button", { onClick: () => setView("admin"), style: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" } }, tl("\uAD00\uB9AC\uC790", "Admin")))))));
}
function TestsIntroPage({ setView, isLoggedIn, lang }) {
  const tl = (ko, en) => lang === "en" ? en : ko;
  const { useState: useS } = React;
  const [selected, setSelected] = useS(null);
  const tm = selected !== null ? TEST_META[selected] : null;
  const c = tm ? COLOR_MAP[tm.color] : null;
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Noto Sans KR', sans-serif", background: "#FAFAF8", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "linear-gradient(135deg, #F0FAF4, #FAFAF8)",
    borderBottom: "1px solid rgba(0,0,0,0.07)",
    padding: "60px 24px 48px",
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-block",
    background: "#D8F3DC",
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 100,
    marginBottom: 16
  } }, "Psychological Tests"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 40, fontWeight: 700, marginBottom: 14 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC2EC\uB9AC\uAC80\uC0AC ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "\uC18C\uAC1C")), /* @__PURE__ */ React.createElement(React.Fragment, null, "Assessment ", /* @__PURE__ */ React.createElement("span", { style: { color: "#2D6A4F" } }, "Overview")))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "#5A5A5A", maxWidth: 480, margin: "0 auto" } }, tl("\uAC01 \uAC80\uC0AC\uB97C \uC120\uD0DD\uD558\uBA74 \uC0C1\uC138 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4", "Select an assessment to view detailed information"))), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { maxWidth: 1200, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
      className: "intro-grid"
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, TEST_META.map((test, i) => {
      const cc = COLOR_MAP[test.color];
      const isActive = selected === i;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: test.id,
          onClick: () => setSelected(i),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 20px",
            borderRadius: 14,
            cursor: "pointer",
            background: isActive ? cc.bg : "white",
            border: isActive ? `2px solid ${cc.bar}` : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.2s"
          },
          onMouseEnter: (e) => {
            if (!isActive) e.currentTarget.style.borderColor = cc.bar + "66";
          },
          onMouseLeave: (e) => {
            if (!isActive) e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: {
          width: 48,
          height: 48,
          borderRadius: 13,
          flexShrink: 0,
          background: cc.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          border: `2px solid ${cc.bar}33`
        } }, test.icon),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: "#1A1A1A" } }, tl(test.name, test.nameEn)), /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 100,
          background: test.free ? "#D8F3DC" : "#FFF0E6",
          color: test.free ? "#1A6B3C" : "#C05621"
        } }, test.free ? tl("\uBB34\uB8CC", "Free") : tl("10 \uD06C\uB808\uB527", "10 Credits"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#9A9A9A" } }, test.label, " \xB7 ", tl(test.time, test.timeEn), " \xB7 ", tl(test.count, test.countEn))),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, color: isActive ? cc.bar : "#CACACA" } }, "\u203A")
      );
    }))),
    /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", top: 80, alignSelf: "start" } }, !tm ? /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 20,
      padding: "60px 40px",
      border: "1px solid rgba(0,0,0,0.08)",
      textAlign: "center",
      color: "#9A9A9A"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "\u{1F446}"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15 } }, tl(/* @__PURE__ */ React.createElement(React.Fragment, null, "\uC67C\uCABD\uC5D0\uC11C \uAC80\uC0AC\uB97C \uC120\uD0DD\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uC0C1\uC138 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement(React.Fragment, null, "Select an assessment on the left", /* @__PURE__ */ React.createElement("br", null), "to view detailed information")))) : /* @__PURE__ */ React.createElement("div", { style: {
      background: "white",
      borderRadius: 20,
      border: `1px solid ${c.bar}33`,
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      background: c.bg,
      padding: "32px 32px 28px",
      borderBottom: `1px solid ${c.bar}22`
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, tm.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: c.bar, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 } }, tm.label), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 } }, tl(tm.name, tm.nameEn)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.7 } }, tl(tm.desc, tm.descEn))), /* @__PURE__ */ React.createElement("div", { style: { padding: "24px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 } }, [
      { label: tl("\uC18C\uC694 \uC2DC\uAC04", "Duration"), value: tl(tm.time, tm.timeEn) },
      { label: tl("\uBB38\uD56D \uC218", "Items"), value: tl(tm.count, tm.countEn) },
      { label: tl("\uBE44\uC6A9", "Cost"), value: tm.free ? tl("\uBB34\uB8CC", "Free") : tl("10 \uD06C\uB808\uB527", "10 Credits") }
    ].map((info) => /* @__PURE__ */ React.createElement("div", { key: info.label, style: {
      background: "#F9F9F7",
      borderRadius: 10,
      padding: "14px",
      textAlign: "center"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A9A9A", marginBottom: 4 } }, info.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#1A1A1A" } }, info.value)))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h4", { style: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#1A1A1A" } }, "\u{1F4CC} ", tl("\uCE21\uC815 \uC601\uC5ED", "What It Measures")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "#5A5A5A", lineHeight: 1.75, background: "#F9F9F7", borderRadius: 10, padding: "14px 16px" } }, tm.id === "PHQ9" && tl("\uC6B0\uC6B8\uD55C \uAE30\uBD84 \xB7 \uD765\uBBF8/\uC990\uAC70\uC6C0 \uAC10\uC18C \xB7 \uC218\uBA74 \uBCC0\uD654 \xB7 \uD53C\uB85C\uAC10 \xB7 \uC2DD\uC695 \uBCC0\uD654 \xB7 \uC790\uAE30\uBE44\uB09C \xB7 \uC9D1\uC911\uB825 \xB7 \uC815\uC2E0\uC6B4\uB3D9 \uBCC0\uD654 \xB7 \uC790\uC0B4\uC0AC\uACE0", "Depressed mood \xB7 Loss of interest \xB7 Sleep changes \xB7 Fatigue \xB7 Appetite changes \xB7 Self-blame \xB7 Concentration \xB7 Psychomotor changes \xB7 Suicidal thoughts"), tm.id === "GAD7" && tl("\uBD88\uC548\uAC10 \xB7 \uAC71\uC815 \uC870\uC808 \uC5B4\uB824\uC6C0 \xB7 \uC5EC\uB7EC \uAC71\uC815 \xB7 \uAE34\uC7A5\uAC10 \xB7 \uC548\uC808\uBD80\uC808 \xB7 \uACFC\uBBFC\uD568 \xB7 \uB098\uC05C \uC77C\uC5D0 \uB300\uD55C \uB450\uB824\uC6C0", "Anxiety \xB7 Uncontrollable worry \xB7 Multiple worries \xB7 Tension \xB7 Restlessness \xB7 Irritability \xB7 Fear of something bad happening"), tm.id === "DASS21" && tl("\uC6B0\uC6B8(D) \u2014 \uBB34\uAE30\uB825\xB7\uC808\uB9DD\xB7\uC790\uAE30\uBE44\uD558 / \uBD88\uC548(A) \u2014 \uC790\uC728\uC2E0\uACBD \uAC01\uC131\xB7\uC0C1\uD669\uBD88\uC548 / \uC2A4\uD2B8\uB808\uC2A4(S) \u2014 \uB9CC\uC131\uC801 \uAC01\uC131\xB7\uAE34\uC7A5", "Depression (D) \u2014 hopelessness, self-deprecation / Anxiety (A) \u2014 autonomic arousal, situational anxiety / Stress (S) \u2014 chronic arousal, tension"), tm.id === "BIG5" && tl("\uAC1C\uBC29\uC131(O) \xB7 \uC131\uC2E4\uC131(C) \xB7 \uC678\uD5A5\uC131(E) \xB7 \uCE5C\uD654\uC131(A) \xB7 \uC2E0\uACBD\uC99D(N) \u2014 5\uAC00\uC9C0 \uC131\uACA9 \uD575\uC2EC \uCC28\uC6D0", "Openness (O) \xB7 Conscientiousness (C) \xB7 Extraversion (E) \xB7 Agreeableness (A) \xB7 Neuroticism (N) \u2014 5 core personality dimensions"), tm.id === "LOST" && tl("\uC5D0\uB108\uC9C0 \uBC29\uD5A5 \xB7 \uC758\uC0AC\uACB0\uC815 \uBC29\uC2DD \xB7 \uD589\uB3D9 \uC18D\uB3C4 \xB7 \uC548\uC815\uC131 \xB7 \uAD00\uACC4 \uBBFC\uAC10\uB3C4 \xB7 \uC2A4\uD2B8\uB808\uC2A4 \uBC18\uC751 \u2014 6\uAC00\uC9C0 \uCD95\uC73C\uB85C 16\uAC00\uC9C0 \uD589\uB3D9\uC720\uD615\uC744 \uD30C\uC545\uD569\uB2C8\uB2E4", "Energy direction \xB7 Decision style \xB7 Action speed \xB7 Stability \xB7 Relationship sensitivity \xB7 Stress response \u2014 identifies 16 behavioral types across 6 axes"), tm.id === "SCT" && tl("\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0 \xB7 \uC815\uC11C\uBC18\uC751\uC131 \xB7 \uC815\uC11C\uC801 \uB2E8\uC808 \xB7 \uC735\uD569\xB7\uAD00\uACC4\uC758\uC874 \uB4F1 4\uAC1C \uC601\uC5ED\uC758 \uC790\uAE30\uBC18\uC751 \uD328\uD134\uC744 \uBB38\uC7A5\uC644\uC131\uC73C\uB85C \uD0D0\uC0C9\uD569\uB2C8\uB2E4", "Explores 4 domains of self-response patterns through sentence completion: self-position, emotional reactivity, emotional cutoff, and fusion/dependency"), tm.id === "DSI" && tl("\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0 \xB7 \uC815\uC11C\uBC18\uC751\uC131 \xB7 \uC815\uC11C\uC801 \uB2E8\uC808 \xB7 \uC735\uD569\xB7\uAD00\uACC4\uC758\uC874 \u2014 4\uAC1C \uC18C\uCC99\uB3C4 \uD3C9\uC815\uD615 25\uBB38\uD56D\uC73C\uB85C \uC790\uAE30\uBD84\uD654 \uC218\uC900\uC744 \uCE21\uC815\uD569\uB2C8\uB2E4", "Self-position \xB7 Emotional reactivity \xB7 Emotional cutoff \xB7 Fusion/dependency \u2014 4 subscales, 25 rating items measuring self-differentiation"), tm.id === "BURNOUT" && tl("\uC815\uC11C\uC801 \uACE0\uAC08 \xB7 \uB0C9\uC18C \xB7 \uD6A8\uB2A5\uAC10 \uC800\uD558 3\uAC00\uC9C0 \uC18C\uC9C4 \uC2E0\uD638 \uC790\uAC00\uC810\uAC80 \u2014 \uC9C1\uC7A5\uC778\xB7\uAD50\uC721\xB7\uC11C\uBE44\uC2A4\uC9C1 \uD2B9\uD654", "Emotional exhaustion \xB7 Cynicism \xB7 Reduced efficacy \u2014 3 burnout signals, specialized for workers, educators, and service professionals"), tm.id === "RIASEC" && tl("\uC2E4\uC7AC\uD615(R) \xB7 \uD0D0\uAD6C\uD615(I) \xB7 \uC608\uC220\uD615(A) \xB7 \uC0AC\uD68C\uD615(S) \xB7 \uC9C4\uCDE8\uD615(E) \xB7 \uAD00\uC2B5\uD615(C) \u2014 6\uAC00\uC9C0 Holland \uC720\uD615\uBCC4 \uC810\uC218\uC640 \uC6B0\uC138 \uC9C1\uC5C5 \uD765\uBBF8 \uCF54\uB4DC(2\uC790\uB9AC)\uB97C \uB3C4\uCD9C\uD569\uB2C8\uB2E4", "Realistic (R) \xB7 Investigative (I) \xB7 Artistic (A) \xB7 Social (S) \xB7 Enterprising (E) \xB7 Conventional (C) \u2014 scores for all 6 Holland types, with a 2-letter dominant career code"), tm.id === "VALUES" && tl("\uC131\uCDE8 \xB7 \uBD09\uC0AC \xB7 \uC548\uC815 \xB7 \uC790\uC728 \xB7 \uCC3D\uC758 \xB7 \uC601\uD5A5\uB825 \xB7 \uC9C0\uC2DD\uCD94\uAD6C \xB7 \uC6CC\uB77C\uBC38 \xB7 \uC0AC\uD68C\uC778\uC815 \xB7 \uACBD\uC81C\uC801 \uBCF4\uC0C1 \u2014 10\uAC00\uC9C0 \uAC00\uCE58\uC694\uC778\uC758 \uC911\uC694\uB3C4\uB97C 100\uC810 \uCC99\uB3C4\uB85C \uD658\uC0B0\uD574 \uC21C\uC704\uB97C \uC81C\uC2DC\uD569\uB2C8\uB2E4", "Achievement \xB7 Service \xB7 Stability \xB7 Autonomy \xB7 Creativity \xB7 Influence \xB7 Knowledge \xB7 Work-Life Balance \xB7 Social Recognition \xB7 Economic Reward \u2014 10 value factors ranked on a 100-point scale"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const FREE = ["PHQ9", "GAD7"];
          if (!isLoggedIn && !FREE.includes(tm.id)) {
            setView("memberSignup");
            return;
          }
          setView("startTest:" + tm.id);
        },
        style: {
          width: "100%",
          padding: "14px 0",
          background: c.bar,
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR', sans-serif",
          transition: "opacity 0.2s"
        },
        onMouseEnter: (e) => e.currentTarget.style.opacity = "0.88",
        onMouseLeave: (e) => e.currentTarget.style.opacity = "1"
      },
      tl(tm.name, tm.nameEn),
      " ",
      tl("\uC2DC\uC791\uD558\uAE30", "Start"),
      " ",
      tm.free ? tl("(\uBB34\uB8CC)", "(Free)") : "\u2192"
    ))))
  ));
}
