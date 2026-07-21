import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  predictNEETRank,
  predictNEETColleges,
  getAdmissionProbability,
  estimateNEETRank,
  quotaLabel,
  getNEETOptions,
  NEET_COMMON_CATEGORIES,
  NEET_FALLBACK_OPTIONS,
  type NEETCollegeRow,
  type NEETCollegePredictionResponse,
  type NEETAdmissionProbabilityResponse,
  type NEETOptions,
} from "@/api/neetV2";
import {
  Loader2,
  Stethoscope,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";
import PageSEO from "@/components/SEO/PageSEO";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import CutoffBanner from "@/components/predictors/CutoffBanner";
import { persistPredictorSearch } from "@/lib/predictorIntent";

const ACCENT = "#059669";
type InputMode = "marks" | "rank";

export default function NEETCollegePredictorV2() {
  const [options, setOptions] = useState<NEETOptions>(NEET_FALLBACK_OPTIONS);
  const [mode, setMode] = useState<InputMode>("marks");
  const [marks, setMarks] = useState("");
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("GN");
  const [quota, setQuota] = useState("AIQ");
  const [state, setState] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<NEETCollegePredictionResponse | null>(null);
  const [probability, setProbability] = useState<NEETAdmissionProbabilityResponse | null>(null);
  const [derivedRank, setDerivedRank] = useState<number | null>(null);
  const { isAuthenticated, toggleLogin } = useAuthStore();

  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("probability");
  const [currentPage, setCurrentPage] = useState(1);
  const collegesPerPage = 10;

  const lastParamsRef = useRef<string | null>(null);

  useEffect(() => {
    getNEETOptions().then(setOptions).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let rankValue: number;
    let marksValue: number | null = null;

    if (mode === "marks") {
      if (!marks) return toast.error("Please enter your NEET marks");
      marksValue = parseFloat(marks);
      if (isNaN(marksValue) || marksValue < 0 || marksValue > 720)
        return toast.error("Please enter valid NEET marks (0 - 720)");
      rankValue = estimateNEETRank(marksValue);
    } else {
      if (!rank) return toast.error("Please enter your NEET rank");
      rankValue = parseInt(rank, 10);
      if (isNaN(rankValue) || rankValue < 1) return toast.error("Please enter a valid rank");
    }

    persistPredictorSearch({
      exam: "NEET",
      tool: "College Predictor",
      summary: [
        mode === "marks" ? `${marksValue}/720 marks` : `rank ${rankValue}`,
        category,
        quota,
        state !== "All" ? state : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    setIsLoading(true);
    setPrediction(null);
    setProbability(null);

    const currentParams = JSON.stringify({ mode, marks, rank, category, quota, state });
    const paramsChanged = lastParamsRef.current !== currentParams;

    try {
      if (!isAuthenticated) {
        setDerivedRank(rankValue);
        setPrediction(buildDummyPrediction(rankValue, category, quota, state));
        setProbability(buildDummyProbability(rankValue, category, quota, state));
        lastParamsRef.current = currentParams;
        toast.success("Prediction ready! Login to view the full college list.");
      } else if (paramsChanged) {
        if (mode === "marks" && marksValue !== null) {
          const rankResp = await predictNEETRank({ marks: marksValue });
          rankValue = rankResp.predicted_rank;
        }
        setDerivedRank(rankValue);

        const [collegesResp, probResp] = await Promise.all([
          predictNEETColleges({ rank: rankValue, category, quota, state, limit: 200 }),
          getAdmissionProbability({ rank: rankValue, category, quota, state, top: 5 }).catch(
            () => null,
          ),
        ]);
        setPrediction(collegesResp);
        setProbability(probResp);
        lastParamsRef.current = currentParams;
        setCurrentPage(1);
        toast.success(`Found ${collegesResp.count} matching colleges!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to predict colleges");
      setPrediction(null);
      setProbability(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPrediction(null);
    setProbability(null);
  }, [category, quota, state]);

  const collegeTypes = useMemo(() => {
    if (!prediction?.colleges) return ["All"];
    const set = new Set(prediction.colleges.map((c) => c.type).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [prediction?.colleges]);

  const filteredColleges = useMemo(() => {
    if (!prediction?.colleges) return [];
    let list = [...prediction.colleges];
    if (typeFilter !== "All") list = list.filter((c) => c.type === typeFilter);
    list.sort((a, b) => {
      if (sortBy === "probability") return b.probability - a.probability;
      if (sortBy === "closing_rank") return a.closing_rank - b.closing_rank;
      if (sortBy === "seats") return b.seats - a.seats;
      return 0;
    });
    return list;
  }, [prediction?.colleges, typeFilter, sortBy]);

  const totalPages = Math.ceil(filteredColleges.length / collegesPerPage);
  const startIndex = (currentPage - 1) * collegesPerPage;
  const paginatedColleges = filteredColleges.slice(startIndex, startIndex + collegesPerPage);

  useEffect(() => setCurrentPage(1), [typeFilter, sortBy]);

  return (
    <>
      <PageSEO
        title="NEET College Predictor 2026 – MBBS Colleges by Rank, Category & Quota"
        description="Predict the MBBS & BDS colleges you can get with your NEET rank, category, quota and state — with an admission-probability score and safe/moderate/ambitious breakdown for each. Free NEET UG college predictor by ProCounsel."
        canonical="/neet-college-predictor"
        keywords="NEET college predictor, MBBS college predictor, NEET rank college list, admission probability NEET, AIQ state quota MBBS, NEET counselling college predictor"
      />

      <div className="min-h-screen bg-[#F4FBF8] pb-12">
        {/* Breadcrumb */}
        <div className="hidden sm:block w-full border-b border-[#D6EFE4] bg-white">
          <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">NEET College Predictor</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(120deg, #064E3B 0%, #047857 45%, #059669 100%)" }}
          />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-10 pb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-white/25">
              <Stethoscope className="h-3.5 w-3.5" />
              NEET UG 2026 · College Predictor + Admission Probability
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              NEET College Predictor
            </h1>
            <p className="mt-3 text-emerald-50/90 text-sm md:text-base max-w-2xl mx-auto">
              Enter your rank or marks and get a ranked list of MBBS & BDS colleges you can
              target — each scored with a real admission probability from 2025 counselling data.
            </p>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 -mt-7 relative z-10">
          <CutoffBanner className="mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <aside className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-xl ring-1 ring-emerald-900/5 p-6 lg:sticky lg:top-24">
                <div className="flex p-1 mb-5 bg-emerald-50 rounded-xl">
                  {(["marks", "rank"] as InputMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setPrediction(null);
                        setProbability(null);
                      }}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                        mode === m ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      {m === "marks" ? "By Marks" : "By Rank"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "marks" ? (
                    <Field label="Your NEET Marks (out of 720)">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="720"
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="e.g. 600"
                        className={inputClass}
                        required
                      />
                    </Field>
                  ) : (
                    <Field label="Your NEET All India Rank">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        placeholder="e.g. 25000"
                        className={inputClass}
                        required
                      />
                    </Field>
                  )}

                  <Field label="Category">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {NEET_COMMON_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Quota">
                    <Select value={quota} onValueChange={setQuota}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.quotas.map((q) => (
                          <SelectItem key={q} value={q}>{quotaLabel(q)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="State">
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {options.states.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-white text-base font-semibold rounded-xl transition-all cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      "Predict Colleges"
                    )}
                  </Button>
                </form>
              </div>
            </aside>

            {/* Results */}
            <section className="lg:col-span-8 relative">
              {!prediction && !isLoading ? (
                <div className="bg-white rounded-2xl border border-emerald-100 p-10 text-center h-full flex flex-col items-center justify-center min-h-[320px]">
                  <Building2 className="h-12 w-12 text-emerald-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Your matched colleges appear here
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Enter your NEET marks or rank with your category, quota and state to see the
                    medical colleges you can target and your admission probability.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className={`${!isAuthenticated ? "blur-sm select-none pointer-events-none" : ""}`}>
                    {/* Admission-probability summary */}
                    {probability && (
                      <ProbabilitySummary prob={probability} derivedRank={derivedRank} mode={mode} />
                    )}

                    {/* Filter / sort bar */}
                    {prediction && (
                      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100 mb-4">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="h-9 w-auto min-w-[140px] border border-emerald-200 rounded-lg text-sm cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {collegeTypes.map((t) => (
                              <SelectItem key={t} value={t}>{t === "All" ? "All Types" : t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Sort by</span>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-auto min-w-[150px] border border-emerald-200 rounded-lg text-sm cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="probability">Admission Chance</SelectItem>
                              <SelectItem value="closing_rank">Closing Rank</SelectItem>
                              <SelectItem value="seats">Seats</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
                            <div className="grid grid-cols-4 gap-3">
                              {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-10 bg-gray-200 rounded" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : paginatedColleges.length > 0 ? (
                      <div className="space-y-4">
                        {paginatedColleges.map((college, idx) => (
                          <CollegeCard key={`${college.college}-${idx}`} college={college} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-emerald-100">
                        No colleges found for these filters. Try a different category or quota.
                      </div>
                    )}

                    {totalPages > 1 && !isLoading && (
                      <div className="flex items-center justify-center gap-2 pt-6">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-emerald-200 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                currentPage === pageNum
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white border border-emerald-200 text-gray-700 hover:bg-emerald-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-emerald-200 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAuthenticated && prediction && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-2xl z-10">
                      <Lock className="h-14 w-14 mb-3" style={{ color: ACCENT }} />
                      <h4 className="text-xl font-bold text-gray-800 mb-1">Login to View Results</h4>
                      <p className="text-sm text-gray-600 text-center mb-5 max-w-md px-4">
                        Please login to unlock your personalized list of NEET colleges and your
                        admission probability.
                      </p>
                      <Button
                        onClick={() => toggleLogin()}
                        className="text-white px-8 py-2 rounded-xl font-semibold cursor-pointer hover:opacity-95"
                        style={{ backgroundColor: ACCENT }}
                      >
                        Login Now
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Info / SEO */}
          <section className="mt-10 bg-white rounded-2xl border border-emerald-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-5 text-gray-800">About the NEET College Predictor</h2>
            <div className="grid md:grid-cols-2 gap-7 text-sm text-gray-600 leading-relaxed">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">How does it work?</h3>
                <p>
                  We compare your NEET rank against real closing ranks from the latest MCC and
                  state counselling rounds for your chosen category, quota and state. Each college
                  is scored with an admission probability so you can build a balanced list of safe,
                  moderate and ambitious options.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Disclaimer</h3>
                <p>
                  Results are based on historical cutoffs and are for guidance only. Final
                  allotment depends on this year's seat matrix, reservation rules, and the choices
                  filled by other candidates during counselling.
                </p>
              </div>
            </div>
          </section>
        </div>

        <OtherPredictors currentPath="/neet-college-predictor" accent="#0D9488" />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Admission-probability summary panel                                */
/* ------------------------------------------------------------------ */

function ProbabilitySummary({
  prob,
  derivedRank,
  mode,
}: {
  prob: NEETAdmissionProbabilityResponse;
  derivedRank: number | null;
  mode: InputMode;
}) {
  const pct = Math.max(0, Math.min(100, prob.admission_probability));
  const style = chanceStyle(prob.verdict);
  const breakdownEntries: [string, number][] = [
    ["Very High", prob.breakdown["Very High"]],
    ["High", prob.breakdown.High],
    ["Moderate", prob.breakdown.Moderate],
    ["Low", prob.breakdown.Low],
    ["Very Low", prob.breakdown["Very Low"]],
  ];
  const maxBar = Math.max(1, ...breakdownEntries.map(([, v]) => v));

  return (
    <div className="mb-5 rounded-2xl bg-white border border-emerald-100 overflow-hidden">
      <div
        className="px-5 py-4 sm:px-6 sm:py-5 text-white flex flex-wrap items-center justify-between gap-4"
        style={{ background: "linear-gradient(120deg, #047857 0%, #059669 60%, #10B981 100%)" }}
      >
        <div>
          <p className="text-emerald-50/80 text-xs font-semibold uppercase tracking-wider">
            {mode === "marks" ? "Estimated All India Rank" : "Your All India Rank"}
          </p>
          <p className="text-2xl font-extrabold">
            {derivedRank !== null ? derivedRank.toLocaleString("en-IN") : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-emerald-50/80 text-xs font-semibold uppercase tracking-wider">
            Overall admission chance
          </p>
          <p className="text-3xl font-extrabold">{pct}%</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {prob.verdict}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MiniStat
            icon={<Building2 className="h-4 w-4" />}
            label="Colleges in reach"
            value={prob.colleges_in_reach.toLocaleString("en-IN")}
          />
          <MiniStat
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Safe colleges"
            value={prob.safe_colleges.toLocaleString("en-IN")}
          />
          <MiniStat
            icon={<Gauge className="h-4 w-4" />}
            label="Total matched"
            value={prob.colleges_matched.toLocaleString("en-IN")}
          />
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Colleges by admission chance
        </p>
        <div className="space-y-2">
          {breakdownEntries.map(([label, count]) => {
            const s = chanceStyle(label);
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-gray-600 shrink-0">{label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxBar) * 100}%`, backgroundColor: s.bar }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
        <p className="sr-only">{style.badge}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">{icon}</div>
      <p className="text-lg font-extrabold text-gray-800 leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase font-bold text-gray-400">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared subcomponents & helpers                                     */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full h-12 px-4 bg-white border border-emerald-200 rounded-xl text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

const selectClass =
  "w-full h-12 border border-emerald-200 rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 cursor-pointer";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function chanceStyle(chance: string) {
  const c = (chance || "").toLowerCase();
  if (c.includes("very high")) return { badge: "bg-emerald-100 text-emerald-700", bar: "#059669" };
  if (c.includes("high")) return { badge: "bg-green-100 text-green-700", bar: "#16A34A" };
  if (c.includes("moderate") || c.includes("medium")) return { badge: "bg-amber-100 text-amber-700", bar: "#F59E0B" };
  if (c.includes("very low")) return { badge: "bg-rose-100 text-rose-700", bar: "#E11D48" };
  if (c.includes("low")) return { badge: "bg-rose-100 text-rose-700", bar: "#F43F5E" };
  return { badge: "bg-gray-100 text-gray-600", bar: "#9CA3AF" };
}

function CollegeCard({ college }: { college: NEETCollegeRow }) {
  const style = chanceStyle(college.chance);
  const prob = Math.max(0, Math.min(100, college.probability));
  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-snug">{college.college}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {college.state}
            </span>
            {college.type && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {college.type}
              </span>
            )}
          </div>
        </div>
        <span className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${style.badge}`}>
          {college.chance}
        </span>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-gray-500">Admission Probability</span>
          <span className="font-bold text-gray-800">{prob}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${prob}%`, backgroundColor: style.bar }} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Closing Rank" value={college.closing_rank?.toLocaleString("en-IN") ?? "-"} highlight />
        <Stat label="Closing Score" value={college.closing_score != null ? `${college.closing_score}` : "-"} />
        <Stat label="Seats" value={college.seats != null ? `${college.seats}` : "-"} />
        <Stat label="Quota" value={college.quota || "-"} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function buildDummyPrediction(
  rank: number,
  category: string,
  quota: string,
  state: string,
): NEETCollegePredictionResponse {
  const names = [
    "Government Medical College",
    "All India Institute of Medical Sciences",
    "Grant Government Medical College",
    "King George's Medical University",
    "Maulana Azad Medical College",
    "Seth GS Medical College",
    "Bangalore Medical College",
    "Government Stanley Medical College",
  ];
  const states = ["Maharashtra", "Delhi", "Tamil Nadu", "Karnataka", "Uttar Pradesh", "West Bengal"];
  const chances = ["Very High", "High", "Moderate", "Low"];
  const colleges: NEETCollegeRow[] = names.map((name, i) => {
    const closing = Math.max(1, rank + (i - 3) * Math.max(800, Math.floor(rank * 0.12)));
    const prob = Math.max(8, Math.min(96, 90 - i * 11));
    return {
      college: name,
      state: states[i % states.length],
      type: i % 2 === 0 ? "Govt-State" : "Govt-Central",
      quota,
      category,
      year: 2025,
      closing_rank: closing,
      seats: 50 + i * 7,
      closing_score: Math.max(0, 600 - i * 18),
      diff: rank - closing,
      probability: prob,
      chance: chances[Math.min(chances.length - 1, Math.floor(i / 2))],
      url: "",
    };
  });
  return { rank, category, quota, state, count: colleges.length, colleges };
}

function buildDummyProbability(
  rank: number,
  category: string,
  quota: string,
  state: string,
): NEETAdmissionProbabilityResponse {
  return {
    rank,
    category,
    quota,
    state,
    admission_probability: 82,
    verdict: "High",
    colleges_matched: 120,
    colleges_in_reach: 84,
    safe_colleges: 40,
    breakdown: { "Very High": 40, High: 30, Moderate: 20, Low: 18, "Very Low": 12 },
    top_colleges: [],
  };
}
