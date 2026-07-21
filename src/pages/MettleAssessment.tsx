import { useState, useEffect, useRef } from "react";
import PageSEO from "@/components/SEO/PageSEO";
import { useAuthStore } from "@/store/AuthStore";
import { LoginCard } from "@/components/cards/LoginCard";

const API = "https://college-search-api.vercel.app";

// Price of the Mettle career assessment (INR). Payment is NOT wired yet —
// see the backend API contract in METTLE_PAYMENT_TODO below.
const METTLE_PRICE = 2000;

/*
 * ─── PAYMENT TO BE WIRED LATER (backend endpoints required) ──────────────────
 * Build these two endpoints on the main wallet backend (API_CONFIG.baseUrl),
 * then gate `start()` behind them:
 *
 *   GET  /api/mettle/access?userId=<userName>
 *        → { "hasPaid": boolean }            // unlock instantly on return
 *
 *   POST /api/mettle/pay
 *        body: { userId, mode: "wallet" | "razorpay", paymentId?, amount }
 *        → { "status": boolean }             // mode=wallet deducts ₹2000 from
 *                                            // proCoins; mode=razorpay records
 *                                            // a verified Razorpay payment.
 *                                            // Either way marks the user paid.
 *
 * Frontend flow once live: open /mettle → check access → if unpaid show paywall
 *   → if wallet balance ≥ ₹2000 "Pay from Wallet" else Razorpay (reuse
 *   startRecharge + getLoggedInPhone/formatPhoneForRazorpay from src/lib/phone)
 *   → on success call /api/mettle/pay → unlock the assessment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// SEO structured data so /mettle can rank for career-test queries.
const METTLE_SEO_TITLE = "Mettle — AI Career Assessment Test for Students";
const METTLE_SEO_DESC =
  "Take ProCounsel's Mettle career assessment: 50 questions across 9 skill areas, scored by AI into your top career matches, strengths and a personalised roadmap. Get a downloadable career report.";
const METTLE_JSONLD = [
  {
    // Modelled as a Service (a paid online career assessment), NOT a retail
    // Product. Product markup makes Google's product-snippet parser expect
    // aggregateRating/review — and we won't fabricate reviews. Service keeps the
    // price via `offers` and is the accurate type. When real customer reviews
    // exist (after payment goes live), add a genuine aggregateRating here.
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "AI career assessment",
    name: "Mettle AI Career Assessment",
    provider: {
      "@type": "Organization",
      name: "ProCounsel",
      url: "https://www.procounsel.co.in",
    },
    areaServed: { "@type": "Country", name: "India" },
    description: METTLE_SEO_DESC,
    category: "Career Assessment",
    url: "https://www.procounsel.co.in/mettle",
    offers: {
      "@type": "Offer",
      price: String(METTLE_PRICE),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: "https://www.procounsel.co.in/mettle",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the Mettle career assessment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mettle is ProCounsel's AI-powered career assessment. You answer 50 statements across 9 skill areas, and AI maps your natural strengths to the careers best suited to you, with fit-scores and a step-by-step roadmap.",
        },
      },
      {
        "@type": "Question",
        name: "How long does the Mettle test take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "About 10 minutes. There are 50 short statements you rate on a 5-point scale, after which your personalised career report is generated instantly.",
        },
      },
      {
        "@type": "Question",
        name: "What do I get after completing the assessment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A full career report: your personality type and profile, your top 3 career matches with AI fit-scores, a scored breakdown of your strengths, development areas with tips, and a roadmap for each recommended career — all downloadable as a PDF.",
        },
      },
      {
        "@type": "Question",
        name: "How much does the Mettle assessment cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Mettle career assessment is a one-time ₹2,000 and includes your complete AI-generated career report.",
        },
      },
    ],
  },
];

// ── Categories ────────────────────────────────────────────────────────────────
const CATS = [
  { key: "Analytical",    name: "Analytical Thinking",     emoji: "🧠", color: "#4f46e5", light: "#eef2ff", mid: "#c7d2fe", catBg: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)" },
  { key: "Creative",      name: "Creative Expression",      emoji: "🎨", color: "#ea580c", light: "#fff7ed", mid: "#fed7aa", catBg: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)" },
  { key: "Social",        name: "Social & Empathy",         emoji: "🤝", color: "#0284c7", light: "#f0f9ff", mid: "#bae6fd", catBg: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)" },
  { key: "Leadership",    name: "Leadership",               emoji: "🚀", color: "#d97706", light: "#fffbeb", mid: "#fde68a", catBg: "linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)" },
  { key: "Technical",     name: "Technical Aptitude",       emoji: "⚙️",  color: "#059669", light: "#ecfdf5", mid: "#a7f3d0", catBg: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)" },
  { key: "Nature",        name: "Nature & Environment",     emoji: "🌿", color: "#16a34a", light: "#f0fdf4", mid: "#bbf7d0", catBg: "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)" },
  { key: "Organized",     name: "Organization & Structure", emoji: "📋", color: "#475569", light: "#f8fafc", mid: "#e2e8f0", catBg: "linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)" },
  { key: "Communication", name: "Communication",            emoji: "💬", color: "#db2777", light: "#fdf2f8", mid: "#fbcfe8", catBg: "linear-gradient(135deg,#fdf2f8 0%,#fce7f3 100%)" },
  { key: "Social Impact", name: "Social Impact",            emoji: "🌍", color: "#7c3aed", light: "#f5f3ff", mid: "#ddd6fe", catBg: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)" },
];

const QUESTIONS: { text: string; category: string }[] = [
  { text: "I enjoy working through complex problems step by step.", category: "Analytical" },
  { text: "I often see possibilities and ideas that others overlook.", category: "Creative" },
  { text: "I find genuine satisfaction in helping others work through their problems.", category: "Social" },
  { text: "I enjoy taking charge of a group and guiding it toward a shared goal.", category: "Leadership" },
  { text: "Understanding exactly how machines or technology works fascinates me.", category: "Technical" },
  { text: "Finding patterns in data or numbers comes naturally to me.", category: "Analytical" },
  { text: "Expressing ideas through visual, written, or artistic mediums excites me.", category: "Creative" },
  { text: "I can often sense how someone is feeling even before they say it.", category: "Social" },
  { text: "Making important decisions under uncertainty is something I can handle well.", category: "Leadership" },
  { text: "Hands-on experimentation — building, testing, and fixing — appeals to me greatly.", category: "Technical" },
  { text: "I feel most alive and at ease when I am outdoors or in natural settings.", category: "Nature" },
  { text: "When I face a challenge, I naturally map out all possibilities before deciding.", category: "Analytical" },
  { text: "I am drawn to work where no two days are the same and creativity is needed.", category: "Creative" },
  { text: "Spending time working with and for people gives me energy rather than draining me.", category: "Social" },
  { text: "Turning an idea into a real, tangible outcome is highly motivating for me.", category: "Leadership" },
  { text: "I am comfortable picking up new technical tools, software, or methods on my own.", category: "Technical" },
  { text: "I am comfortable managing large amounts of detailed information and documents.", category: "Organized" },
  { text: "I express my ideas clearly, whether speaking or writing.", category: "Communication" },
  { text: "Mathematics or logical reasoning energizes rather than tires me.", category: "Analytical" },
  { text: "I can easily picture how something will look, sound, or feel before it is made.", category: "Creative" },
  { text: "I have patience for people who are learning slowly or struggling.", category: "Social" },
  { text: "I naturally spot opportunities where others see only obstacles.", category: "Leadership" },
  { text: "I am drawn to scientific investigation and finding evidence-based answers.", category: "Technical" },
  { text: "I care deeply about environmental sustainability and conservation.", category: "Nature" },
  { text: "I prefer answers that are precise and verifiable over rough approximations.", category: "Analytical" },
  { text: "Telling stories — in any form — is something I genuinely enjoy.", category: "Creative" },
  { text: "Teaching or explaining things to others is something I enjoy deeply.", category: "Social" },
  { text: "Persuading others through reason and conviction is a skill I have.", category: "Leadership" },
  { text: "Precision and accuracy in technical work give me a deep sense of satisfaction.", category: "Technical" },
  { text: "I naturally create systems and routines to keep things organized and on track.", category: "Organized" },
  { text: "I enjoy debates and the challenge of making a well-reasoned argument.", category: "Communication" },
  { text: "I would rather spend time analyzing a situation deeply than react quickly.", category: "Analytical" },
  { text: "I prefer creating something new over improving something existing.", category: "Creative" },
  { text: "I am comfortable in emotionally sensitive or difficult conversations.", category: "Social" },
  { text: "I tend to take initiative rather than wait for instructions.", category: "Leadership" },
  { text: "Technology that solves real-world problems genuinely excites me.", category: "Technical" },
  { text: "Working with animals, plants, or natural ecosystems appeals to me deeply.", category: "Nature" },
  { text: "Following rules and structured procedures carefully gives me confidence and focus.", category: "Organized" },
  { text: "Writing — whether creative, analytical, or professional — is something I do well.", category: "Communication" },
  { text: "Building or understanding systems and how their parts connect interests me greatly.", category: "Analytical" },
  { text: "I find beauty and meaning in art, design, or music.", category: "Creative" },
  { text: "Understanding why people behave the way they do genuinely interests me.", category: "Social" },
  { text: "Thinking about long-term strategy and planning comes naturally to me.", category: "Leadership" },
  { text: "I enjoy the challenge of diagnosing why something is failing and fixing it.", category: "Technical" },
  { text: "I am curious about how living systems in nature interact and sustain themselves.", category: "Nature" },
  { text: "I find detail-oriented, structured work fulfilling rather than tedious.", category: "Organized" },
  { text: "I enjoy researching and investigating topics or stories in depth.", category: "Communication" },
  { text: "I am motivated by the idea of making a meaningful difference in society.", category: "Social Impact" },
  { text: "Presenting ideas to an audience, large or small, does not make me nervous.", category: "Communication" },
  { text: "I find work that serves communities or the public sector genuinely fulfilling.", category: "Social Impact" },
];

const CAT_QS = CATS.map(c => ({ ...c, qs: QUESTIONS.filter(q => q.category === c.key) }));

function gIdx(ci: number, qi: number) {
  let n = 0; for (let i = 0; i < ci; i++) n += CAT_QS[i].qs.length; return n + qi;
}

const SCALE_LABELS = ["", "Strongly\nDisagree", "Disagree", "Neutral", "Agree", "Strongly\nAgree"];

interface CareerPath { title: string; field: string; fitScore: number; description: string; whyYouFit: string; keySkills: string[]; steps: string[]; }
interface Strength    { name: string; score: number; description: string; }
interface DevArea     { name: string; tip: string; }
interface Report      { personalityType: string; personalityTagline: string; overallProfile: string; topCareers: CareerPath[]; strengths: Strength[]; developmentAreas: DevArea[]; nextSteps: string[]; }

// ── Shared styles ─────────────────────────────────────────────────────────────
const F   = "'Inter','Poppins',system-ui,sans-serif";
const GLASS = (opacity = 0.7, blur = 20) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
} as React.CSSProperties);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .ma { font-family:${F}; -webkit-font-smoothing:antialiased; }
  @keyframes maUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes maIn  { from{opacity:0;transform:scale(.95)}       to{opacity:1;transform:scale(1)}     }
  @keyframes maSpin{ to{transform:rotate(360deg)} }
  @keyframes maPop { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes maBar { from{width:0} }
  .ma-up  { animation:maUp  .45s cubic-bezier(.22,1,.36,1) both }
  .ma-in  { animation:maIn  .38s cubic-bezier(.22,1,.36,1) both }
  .ma-spin{ animation:maSpin 1s linear infinite }
  .ma-pop { animation:maPop 2s ease infinite }
  .ma-bar { animation:maBar .9s cubic-bezier(.22,1,.36,1) both }
  .ma-btn { transition:all .15s cubic-bezier(.22,1,.36,1); cursor:pointer; }
  .ma-btn:hover { transform:translateY(-1px); }
  .ma-card{ transition:transform .18s ease, box-shadow .18s ease; }
  .ma-card:hover{ transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.1) !important; }
  @media print{
    .ma-np{display:none!important;}
    .ma{background:white!important;}
    *{box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
  }
`;

const DEV = typeof window !== "undefined" && (window.location.hostname === "localhost" || new URLSearchParams(window.location.search).get("dev") === "true");

// ── Score ring ────────────────────────────────────────────────────────────────
function Ring({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = size * .37, cx = size / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size*.09} strokeOpacity=".12" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size*.09}
        strokeDasharray={`${((pct/100)*c).toFixed(1)} ${c.toFixed(1)}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx+2} textAnchor="middle" fontSize={size*.22} fontWeight="800" fill={color} fontFamily={F}>{pct}%</text>
      <text x={cx} y={cx+size*.18} textAnchor="middle" fontSize={size*.12} fill="#94a3b8" fontFamily={F}>fit</text>
    </svg>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function Dots({ ci }: { ci: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {CAT_QS.map((c, i) => (
        <div key={i} style={{ height: 6, width: i === ci ? 18 : 6, borderRadius: 99, background: i < ci ? c.color : i === ci ? c.color : "#e2e8f0", transition: "all .3s ease", opacity: i > ci ? .4 : 1 }} />
      ))}
    </div>
  );
}

type Screen = "start" | "cat-intro" | "quiz" | "loading" | "report" | "error";

export default function MettleAssessment() {
  const [screen, setScreen] = useState<Screen>("start");
  const [name, setName]     = useState("");
  const [ci, setCi]         = useState(0);
  const [qi, setQi]         = useState(0);
  const [ans, setAns]       = useState<Record<number, number>>({});
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr]       = useState("");
  const top = useRef<HTMLDivElement>(null);

  // Login is mandatory: we use the logged-in user's profile name, so there is
  // no name field — they fill their name during login/onboarding.
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoginToggle = useAuthStore((s) => s.isLoginToggle);
  const profileName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  useEffect(() => {
    const el = document.createElement("style"); el.textContent = CSS; document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  useEffect(() => { top.current?.scrollIntoView({ behavior: "smooth" }); }, [screen, ci, qi]);

  const cat  = CAT_QS[ci];
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  function beginAssessment() {
    const u = useAuthStore.getState().user;
    const n = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.userName || "Student";
    setName(n);
    setCi(0); setQi(0); setAns({}); setScreen("cat-intro");
  }

  function start() {
    const s = useAuthStore.getState();
    // Mandatory login — open the login flow and resume once signed in.
    if (!s.isAuthenticated || !s.user) {
      s.toggleLogin(() => beginAssessment());
      return;
    }
    beginAssessment();
  }

  function pick(s: number) { setAns(a => ({ ...a, [gIdx(ci, qi)]: s })); }

  function goNext() {
    if (!ans[gIdx(ci, qi)]) return;
    if (qi === cat.qs.length - 1 && ci === CAT_QS.length - 1) { submit(); return; }
    if (qi === cat.qs.length - 1) { setCi(c => c + 1); setQi(0); setScreen("cat-intro"); return; }
    setQi(q => q + 1);
  }

  function goPrev() {
    if (qi > 0) { setQi(q => q - 1); return; }
    if (ci > 0) { setCi(c => c - 1); setQi(CAT_QS[ci - 1].qs.length - 1); setScreen("quiz"); }
  }

  async function submit() {
    setScreen("loading");
    const payload = QUESTIONS.map((q, i) => ({
      question: q.text, category: q.category,
      answer: SCALE_LABELS[ans[i] ?? 3].replace("\n", " "),
      score: ans[i] ?? 3,
    }));
    try {
      const res = await fetch(`${API}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), answers: payload }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Server error"); }
      setReport(await res.json()); setScreen("report");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not reach the assessment server.");
      setScreen("error");
    }
  }

  function retake() { setName(""); setAns({}); setCi(0); setQi(0); setReport(null); setErr(""); setScreen("start"); }

  async function devSkip() {
    const n = name.trim() || "Test User"; setName(n); setScreen("loading");
    try {
      const res = await fetch(`${API}/assess`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, answers: QUESTIONS.map(q => ({ question: q.text, category: q.category, answer: "Strongly Agree", score: 5 })) }),
      });
      setReport(await res.json()); setScreen("report");
    } catch { setErr("Dev skip error"); setScreen("error"); }
  }

  // ────────────────────────────────── START ──────────────────────────────────
  if (screen === "start") return (
    <div ref={top} className="ma" style={{ minHeight: "100vh", background: "linear-gradient(145deg, #f0f4ff 0%, #fdf4ff 45%, #fff8f0 100%)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <PageSEO
        title={METTLE_SEO_TITLE}
        description={METTLE_SEO_DESC}
        canonical="/mettle"
        keywords="career assessment, AI career test, career test for students, psychometric test India, career counselling, find my career, ProCounsel Mettle"
        jsonLd={METTLE_JSONLD}
      />
      {/* Soft orbs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,.22) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,.18) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "45%", left: "35%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,.14) 0%, transparent 65%)", pointerEvents: "none" }} />

      <nav style={{ padding: "18px 28px", display: "flex", alignItems: "center", gap: 10 }} className="ma-np">
        <img loading="lazy" decoding="async" src="/logo.svg" alt="" style={{ width: 30, height: 30 }} />
        <span style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 16, fontFamily: F }}>ProCounsel</span>
      </nav>

      {DEV && (
        <div style={{ margin: "0 28px 8px", background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.4)", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#92400e", display: "flex", gap: 10, alignItems: "center" }} className="ma-np">
          <span style={{ background: "#fbbf24", color: "#000", padding: "1px 8px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>DEV</span>
          <button onClick={devSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "#b45309", fontWeight: 600, textDecoration: "underline", fontFamily: F }}>Skip → AI Report</button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 20px 48px" }}>
        <div className="ma-in" style={{ width: "100%", maxWidth: 980, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 28, alignItems: "center", textAlign: "left" }}>

          {/* ── Left: pitch ───────────────────────────────────────────── */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...GLASS(0.7, 16), borderRadius: 99, padding: "7px 18px", marginBottom: 18 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ color: "#4f46e5", fontSize: 12, fontWeight: 700, letterSpacing: .6, fontFamily: F }}>AI-Powered Career Assessment</span>
            </div>

            <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, color: "#1e1b4b", lineHeight: 1.1, margin: "0 0 14px", letterSpacing: "-1.5px", fontFamily: F }}>
              Find Your Perfect{" "}
              <span style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Career Path</span>
            </h1>

            <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.7, margin: "0 0 20px", fontFamily: F }}>
              50 thoughtful statements across 9 skill areas. Answer honestly — our AI maps your natural strengths to careers built for you.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", ...GLASS(0.65, 16), borderRadius: 16, overflow: "hidden", marginBottom: 18 }}>
              {[["9", "Sections"], ["50", "Questions"], ["~10m", "Duration"]].map(([v, l], i) => (
                <div key={l} style={{ flex: 1, padding: "12px 8px", borderRight: i < 2 ? "1px solid rgba(0,0,0,.05)" : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: "#1e1b4b", fontFamily: F }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, fontFamily: F }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Category chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATS.map(c => (
                <div key={c.key} style={{ ...GLASS(0.6, 12), borderRadius: 99, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{c.emoji}</span>
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, fontFamily: F }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: what you get + start ─────────────────────────────── */}
          <div>
            {/* What you'll get */}
            <div style={{ ...GLASS(0.7, 18), borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: 1, fontFamily: F }}>What you'll get</span>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", borderRadius: 99, padding: "5px 13px", boxShadow: "0 4px 14px rgba(79,70,229,.35)" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, fontFamily: F }}>₹{METTLE_PRICE.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, opacity: .85, fontFamily: F }}>one-time</span>
                </span>
              </div>
              {[
                ["✦", "Your personality type and how you think and work"],
                ["🎯", "Top 3 career matches with AI fit-scores"],
                ["📊", "Your strongest skill areas, scored out of 100"],
                ["🌱", "Development areas with practical tips"],
                ["🗺️", "A step-by-step roadmap into each career"],
                ["📄", "A polished report you can download as PDF"],
              ].map(([icon, text], i, arr) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 9 : 0 }}>
                  <span style={{ fontSize: 13, lineHeight: 1.45, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, fontFamily: F }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Start card — login mandatory; TODO: gate behind ₹2000 payment (see METTLE_PAYMENT_TODO). */}
            <div style={{ ...GLASS(0.75, 20), borderRadius: 20, padding: "20px 22px 18px" }}>
              {isAuthenticated && user ? (
                <>
                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 14, fontFamily: F }}>
                    Signed in as{" "}
                    <strong style={{ color: "#1e1b4b" }}>{profileName || user.userName}</strong>. Your report will be generated under this name.
                  </div>
                  <button onClick={start} className="ma-btn" style={{
                    width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: F,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white",
                    border: "none", borderRadius: 12, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(79,70,229,.35), inset 0 1px 0 rgba(255,255,255,.15)",
                  }}>Start Assessment →</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 14, fontFamily: F }}>
                    Sign in to begin — we'll use your profile name, so there's nothing to type.
                  </div>
                  <button onClick={start} className="ma-btn" style={{
                    width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: F,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white",
                    border: "none", borderRadius: 12, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(79,70,229,.35), inset 0 1px 0 rgba(255,255,255,.15)",
                  }}>Sign in & Start →</button>
                </>
              )}
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "10px 0 0", textAlign: "center", fontFamily: F }}>Personalised AI report · Instant results · Downloadable PDF</p>
            </div>
          </div>
        </div>
      </div>
      {isLoginToggle && <LoginCard />}
    </div>
  );

  // ─────────────────────────────── CATEGORY INTRO ────────────────────────────
  if (screen === "cat-intro") return (
    <div ref={top} className="ma" style={{ minHeight: "100vh", background: cat.catBg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}22 0%, transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}14 0%, transparent 65%)`, pointerEvents: "none" }} />

      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="ma-np">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img loading="lazy" decoding="async" src="/logo.svg" alt="" style={{ width: 24, height: 24, opacity: .5 }} />
          <span style={{ color: "#64748b", fontWeight: 600, fontSize: 13, fontFamily: F }}>ProCounsel</span>
        </div>
        <Dots ci={ci} />
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div className="ma-in" style={{ maxWidth: 400, textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: 72, marginBottom: 20, filter: `drop-shadow(0 4px 16px ${cat.color}40)` }}>{cat.emoji}</div>

          <div style={{ display: "inline-block", background: `${cat.color}14`, border: `1px solid ${cat.color}30`, borderRadius: 99, padding: "5px 16px", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: F }}>Section {ci + 1} of {CATS.length}</span>
          </div>

          <h2 style={{ fontSize: "clamp(26px,6vw,36px)", fontWeight: 900, color: "#1e1b4b", margin: "0 0 12px", letterSpacing: "-0.8px", lineHeight: 1.15, fontFamily: F }}>{cat.name}</h2>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, margin: "0 0 28px", fontFamily: F }}>{cat.qs.length} statements about your {cat.name.toLowerCase()} aptitude.</p>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
            {cat.qs.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: `${cat.color}30`, border: `1px solid ${cat.color}40` }} />)}
          </div>

          <button onClick={() => setScreen("quiz")} className="ma-btn" style={{
            padding: "14px 44px", fontSize: 15, fontWeight: 700, fontFamily: F,
            background: cat.color, color: "white", border: "none", borderRadius: 14, cursor: "pointer",
            boxShadow: `0 6px 24px ${cat.color}40, inset 0 1px 0 rgba(255,255,255,.2)`,
          }}>Start Section →</button>

          {ci > 0 && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, fontFamily: F }}>{Object.keys(ans).length} of {QUESTIONS.length} answered so far</p>}
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────── QUIZ ─────────────────────────────────────
  if (screen === "quiz") {
    const gi   = gIdx(ci, qi);
    const sel  = ans[gi];
    const last = ci === CAT_QS.length - 1 && qi === cat.qs.length - 1;
    const first = ci === 0 && qi === 0;
    const catPct = ((qi + 1) / cat.qs.length) * 100;

    return (
      <div ref={top} className="ma" style={{ minHeight: "100vh", background: cat.catBg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}18 0%, transparent 65%)`, pointerEvents: "none" }} />

        {/* Header */}
        <div className="ma-np">
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 16 }}>{cat.emoji}</span>
              <span style={{ color: cat.color, fontWeight: 700, fontSize: 13, fontFamily: F }}>{cat.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, fontFamily: F }}>{qi + 1}/{cat.qs.length}</span>
              <Dots ci={ci} />
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(0,0,0,.06)", margin: "0 20px" }}>
            <div style={{ height: "100%", width: `${catPct}%`, background: cat.color, borderRadius: 99, transition: "width .3s ease" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 48px" }}>
          <div className="ma-in" style={{ width: "100%", maxWidth: 560 }}>
            <div style={{ ...GLASS(0.78, 22), borderRadius: 22, padding: "30px 26px 26px" }}>

              <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontFamily: F }}>
                Question {qi + 1} of {cat.qs.length}
              </div>

              <p style={{ fontSize: "clamp(17px,3.5vw,20px)", fontWeight: 700, color: "#1e1b4b", lineHeight: 1.65, margin: "0 0 30px", fontFamily: F }}>
                {cat.qs[qi].text}
              </p>

              {/* Scale */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, fontFamily: F }}>Strongly Disagree</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, fontFamily: F }}>Strongly Agree</span>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {[1, 2, 3, 4, 5].map(s => {
                    const on = sel === s;
                    return (
                      <div key={s} className="ma-btn" onClick={() => pick(s)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: 1 }}>
                        <div style={{
                          width: "100%", maxWidth: 56, aspectRatio: "1", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 800, fontFamily: F,
                          background: on ? cat.color : "rgba(255,255,255,.85)",
                          border: `2px solid ${on ? cat.color : "rgba(0,0,0,.08)"}`,
                          color: on ? "white" : "#94a3b8",
                          boxShadow: on ? `0 4px 16px ${cat.color}45` : "0 1px 4px rgba(0,0,0,.06)",
                          transition: "all .15s ease",
                        }}>{s}</div>
                        <span style={{ fontSize: 9, color: on ? cat.color : "#94a3b8", textAlign: "center", lineHeight: 1.3, fontWeight: on ? 700 : 500, fontFamily: F, whiteSpace: "pre-line" }}>
                          {SCALE_LABELS[s]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!sel && <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 18, fontFamily: F }}>Tap a number to answer</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
                <button onClick={goPrev} disabled={first} className="ma-btn" style={{
                  padding: "12px 20px", borderRadius: 12, fontFamily: F, fontSize: 14, fontWeight: 600,
                  background: "rgba(255,255,255,.6)", border: "1.5px solid rgba(0,0,0,.08)", color: "#64748b",
                  cursor: first ? "not-allowed" : "pointer", opacity: first ? .4 : 1,
                }}>← Back</button>
                <button onClick={goNext} disabled={!sel} className="ma-btn" style={{
                  flex: 1, padding: "12px 20px", borderRadius: 12, fontFamily: F, fontSize: 14, fontWeight: 700,
                  background: sel ? cat.color : "rgba(0,0,0,.06)",
                  color: sel ? "white" : "#94a3b8", border: "none", cursor: sel ? "pointer" : "not-allowed",
                  boxShadow: sel ? `0 4px 16px ${cat.color}40` : "none", transition: "all .2s",
                }}>{last ? "Submit & Get Report →" : "Next →"}</button>
              </div>
            </div>

            {/* Overall progress */}
            <div style={{ marginTop: 14, padding: "0 4px" }}>
              <div style={{ height: 4, background: "rgba(0,0,0,.07)", borderRadius: 99, overflow: "hidden" }}>
                <div className="ma-bar" style={{ height: "100%", width: `${(Object.keys(ans).length / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg,#4f46e5,${cat.color})`, transition: "width .3s ease" }} />
              </div>
              <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 5, textAlign: "center", fontFamily: F }}>{Object.keys(ans).length} of {QUESTIONS.length} answered</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────── LOADING ──────────────────────────────────
  if (screen === "loading") return (
    <div ref={top} className="ma" style={{ minHeight: "100vh", background: "linear-gradient(145deg,#f0f4ff 0%,#fdf4ff 50%,#fff8f0 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 28px" }}>
        <div className="ma-spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #e0e7ff", borderTop: "3px solid #4f46e5" }} />
        <div className="ma-spin" style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "2px solid #fce7f3", borderTop: "2px solid #db2777", animationDirection: "reverse", animationDuration: "1.4s" }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🧠</span>
      </div>
      <h2 style={{ color: "#1e1b4b", fontSize: 22, fontWeight: 800, margin: "0 0 10px", fontFamily: F, textAlign: "center" }}>Analyzing your profile…</h2>
      <p className="ma-pop" style={{ color: "#64748b", fontSize: 14, maxWidth: 320, lineHeight: 1.8, fontFamily: F, textAlign: "center" }}>GPT-4o is mapping your 50 responses to career paths tailored just for you.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
        {["Mapping aptitudes", "Matching careers", "Writing report"].map((s, i) => (
          <div key={i} style={{ ...GLASS(0.65, 12), borderRadius: 99, padding: "6px 14px", fontSize: 11, color: "#64748b", fontFamily: F }}>{s}</div>
        ))}
      </div>
    </div>
  );

  // ──────────────────────────────── ERROR ────────────────────────────────────
  if (screen === "error") return (
    <div ref={top} className="ma" style={{ minHeight: "100vh", background: "linear-gradient(145deg,#fff5f5 0%,#fef2f2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="ma-in" style={{ ...GLASS(0.8, 20), borderRadius: 22, padding: "44px 32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", margin: "0 0 10px", fontFamily: F }}>Something went wrong</h2>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, marginBottom: 24, fontFamily: F }}>{err}</p>
        <button onClick={retake} className="ma-btn" style={{ background: "#1e1b4b", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Try Again</button>
      </div>
    </div>
  );

  // ─────────────────────────────── REPORT ───────────────────────────────────
  if (screen === "report" && report) {
    const FC: Record<string, string> = { Technology:"#4f46e5",Engineering:"#6366f1",Healthcare:"#059669",Business:"#d97706",Arts:"#db2777",Law:"#0284c7",Education:"#0ea5e9",Environment:"#16a34a",Science:"#0d9488",Media:"#db2777",Finance:"#d97706",Design:"#9333ea" };
    const fc = (f: string) => FC[f] || "#475569";

    return (
      <div ref={top} className="ma" style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0f4ff 0%,#fdf4ff 45%,#fff8f0 100%)" }}>
        {/* Nav */}
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, ...GLASS(0.8, 16), borderBottom: "1px solid rgba(0,0,0,.06)", position: "sticky", top: 0, zIndex: 10 }} className="ma-np">
          <img loading="lazy" decoding="async" src="/logo.svg" alt="" style={{ width: 26, height: 26 }} />
          <span style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 15, fontFamily: F }}>ProCounsel</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={retake} className="ma-btn" style={{ ...GLASS(0.6, 12), borderRadius: 9, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, color: "#64748b", border: "1.5px solid rgba(0,0,0,.08)" }}>Retake</button>
            <button onClick={() => window.print()} className="ma-btn" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", border: "none", borderRadius: 9, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 4px 14px rgba(79,70,229,.35)" }}>↓ Download PDF</button>
          </div>
        </div>

        <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px 60px" }}>

          {/* Hero card */}
          <div className="ma-up" style={{ ...GLASS(0.82, 24), borderRadius: 22, padding: "30px 34px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,.1), transparent 65%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧠</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2, fontFamily: F }}>ProCounsel · Mettle Assessment</div>
                <h1 style={{ color: "#1e1b4b", fontSize: 20, fontWeight: 800, margin: 0, fontFamily: F }}>{name}</h1>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, fontFamily: F }}>{date} · 50 questions · procounsel.co.in</div>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 16px", marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ color: "#4f46e5", fontWeight: 800, fontSize: 15, fontFamily: F }}>{report.personalityType}</span>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 14px", fontStyle: "italic", lineHeight: 1.6, fontFamily: F }}>"{report.personalityTagline}"</p>
            <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.8, margin: 0, padding: "14px 16px", background: "#eef2ff", borderRadius: 10, border: "1px solid #c7d2fe", borderLeft: "3px solid #4f46e5", fontFamily: F }}>
              {report.overallProfile}
            </p>
          </div>

          <Label>Top Career Matches</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 18 }}>
            {report.topCareers.map((c, i) => {
              const color = fc(c.field);
              return (
                <div key={i} className="ma-card" style={{ ...GLASS(0.8, 20), borderRadius: 18, overflow: "hidden", border: `1px solid ${color}20` }}>
                  <div style={{ padding: "18px 20px 14px", background: `linear-gradient(135deg,${color}10,${color}06)`, borderBottom: `1px solid ${color}15` }}>
                    {i === 0 && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color, textTransform: "uppercase", marginBottom: 7, fontFamily: F, background: `${color}14`, display: "inline-block", padding: "2px 8px", borderRadius: 99 }}>Best Match</div>}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <h3 style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 15, margin: "0 0 3px", fontFamily: F, lineHeight: 1.3 }}>{c.title}</h3>
                        <div style={{ fontSize: 11, color, fontWeight: 700, fontFamily: F }}>{c.field}</div>
                      </div>
                      <Ring pct={c.fitScore} color={color} size={64} />
                    </div>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, margin: "0 0 12px", fontFamily: F }}>{c.description}</p>
                    <div style={{ background: `${color}08`, border: `1px solid ${color}18`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4, fontFamily: F }}>Why You Fit</div>
                      <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.65, margin: 0, fontFamily: F }}>{c.whyYouFit}</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                      {c.keySkills.map((sk, j) => <span key={j} style={{ background: `${color}10`, color, padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: F, border: `1px solid ${color}20` }}>{sk}</span>)}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(0,0,0,.05)", paddingTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8, fontFamily: F }}>Path to Get There</div>
                      {c.steps.map((step, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{j + 1}</div>
                          <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.6, fontFamily: F }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Label>Your Key Strengths</Label>
          <div style={{ ...GLASS(0.8, 20), borderRadius: 18, padding: "24px 28px", marginBottom: 18 }}>
            {report.strengths.map((s, i) => {
              const sc = CATS[i % CATS.length].color;
              return (
                <div key={i} style={{ marginBottom: i < report.strengths.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b", fontFamily: F }}>{s.name}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: sc, fontFamily: F }}>{s.score}%</span>
                  </div>
                  <div style={{ height: 7, background: "rgba(0,0,0,.06)", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
                    <div className="ma-bar" style={{ height: "100%", width: `${s.score}%`, background: `linear-gradient(90deg,${sc},${sc}bb)`, borderRadius: 99 }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, margin: 0, fontFamily: F }}>{s.description}</p>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 18 }}>
            <div>
              <Label>Areas to Develop</Label>
              <div style={{ ...GLASS(0.78, 18), borderRadius: 18, padding: "20px 22px" }}>
                {report.developmentAreas.map((d, i) => (
                  <div key={i} style={{ marginBottom: i < report.developmentAreas.length - 1 ? 16 : 0, paddingBottom: i < report.developmentAreas.length - 1 ? 16 : 0, borderBottom: i < report.developmentAreas.length - 1 ? "1px solid rgba(0,0,0,.05)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b", fontFamily: F }}>{d.name}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, margin: "0 0 0 14px", fontFamily: F }}>{d.tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Your Next Steps</Label>
              <div style={{ ...GLASS(0.78, 18), borderRadius: 18, padding: "20px 22px" }}>
                {report.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < report.nextSteps.length - 1 ? 14 : 0, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(79,70,229,.3)" }}>{i + 1}</div>
                    <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, margin: 0, fontFamily: F }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ma-np" style={{ ...GLASS(0.75, 16), borderRadius: 16, padding: "15px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: F }}><strong style={{ color: "#1e1b4b" }}>ProCounsel</strong> · Powered by GPT-4o · procounsel.co.in</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={retake} className="ma-btn" style={{ ...GLASS(0.6, 12), borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, color: "#64748b", border: "1.5px solid rgba(0,0,0,.08)" }}>Retake</button>
              <button onClick={() => window.print()} className="ma-btn" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 4px 12px rgba(79,70,229,.35)" }}>↓ Download PDF</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontFamily: "'Inter','Poppins',system-ui,sans-serif" }}>{children}</div>;
}
