import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope,
  MapPin,
  Building2,
  TableProperties,
  ArrowRight,
  Users,
  Info,
} from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import CollegeAutocomplete from "@/components/predictors/CollegeAutocomplete";
import { neetCutoffContent } from "@/components/SEO/seoContent";
import {
  getRoundCutoffs,
  getNEETOptions,
  quotaLabel,
  NEET_COMMON_CATEGORIES,
  NEET_FALLBACK_OPTIONS,
  type NEETCutoffRow,
  type NEETOptions,
} from "@/api/neetV2";

const ACCENT = "#059669";
const GROUPS_PER_PAGE = 15;

interface CutoffGroup {
  key: string;
  college: string;
  state: string;
  type: string;
  quota: string;
  category: string;
  year: number;
  byRound: Map<number, NEETCutoffRow>;
  bestClosingRank: number;
}

export default function NEETCutoffAnalyzer() {
  const navigate = useNavigate();

  const [options, setOptions] = useState<NEETOptions>(NEET_FALLBACK_OPTIONS);
  const [college, setCollege] = useState("");
  const [state, setState] = useState("All");
  const [type, setType] = useState("All");
  const [quota, setQuota] = useState("AIQ");
  const [category, setCategory] = useState("GN");
  const [year, setYear] = useState<number>(2025);

  const [rows, setRows] = useState<NEETCutoffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const reqId = useRef(0);

  useEffect(() => {
    getNEETOptions().then(setOptions).catch(() => {});
  }, []);

  // Run the query whenever a filter changes (college handled via its own effect debounce).
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    getRoundCutoffs({
      college: college || undefined,
      state,
      type,
      quota,
      category,
      year,
      limit: 3000,
    })
      .then((res) => {
        if (id !== reqId.current) return;
        setRows(res.cutoffs ?? []);
        setPage(1);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(e instanceof Error ? e.message : "Failed to load cutoffs");
        setRows([]);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [college, state, type, quota, category, year]);

  // Pivot flat rows into round-wise groups (one row per college / quota / category).
  const groups = useMemo<CutoffGroup[]>(() => {
    const map = new Map<string, CutoffGroup>();
    for (const r of rows) {
      const key = `${r.college}||${r.state}||${r.quota}||${r.category}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          college: r.college,
          state: r.state,
          type: r.type,
          quota: r.quota,
          category: r.category,
          year: r.year,
          byRound: new Map(),
          bestClosingRank: Number.POSITIVE_INFINITY,
        };
        map.set(key, g);
      }
      const existing = g.byRound.get(r.round);
      // Keep the largest closing rank per round (last allotment in that round).
      if (!existing || r.closing_rank > existing.closing_rank) g.byRound.set(r.round, r);
      if (r.closing_rank && r.closing_rank < g.bestClosingRank) g.bestClosingRank = r.closing_rank;
    }
    return Array.from(map.values()).sort((a, b) => a.bestClosingRank - b.bestClosingRank);
  }, [rows]);

  // Union of rounds present, for the table columns.
  const roundColumns = useMemo(() => {
    const set = new Set<number>();
    for (const g of groups) for (const r of g.byRound.keys()) set.add(r);
    return Array.from(set).sort((a, b) => a - b);
  }, [groups]);

  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const pageGroups = groups.slice((page - 1) * GROUPS_PER_PAGE, page * GROUPS_PER_PAGE);

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "NEET 2026 Round-wise Cutoff Analyzer",
        applicationCategory: "EducationApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description:
          "Free tool to look up round-wise NEET UG closing ranks and closing scores for every MBBS/BDS college in India across AIQ and state quota, to plan NEET 2026 admissions.",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: neetCutoffContent.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.procounsel.co.in/" },
          { "@type": "ListItem", position: 2, name: "NEET 2026 Cutoff", item: "https://www.procounsel.co.in/neet-cutoffs" },
        ],
      },
    ],
    [],
  );

  return (
    <>
      <PageSEO
        title="NEET 2026 Cutoff – Round-wise Closing Ranks for All MBBS Colleges"
        description="Free NEET 2026 cutoff analyzer: round-wise closing ranks and scores for every MBBS & BDS college in India, for AIQ and state quota, across all categories. Based on NEET 2025, 2024, 2023 & 2022 counselling data — plan your NEET 2026 college choices."
        canonical="/neet-cutoffs"
        keywords="NEET 2026 cutoff, NEET cutoff 2026, NEET round wise cutoff, NEET closing rank 2026, MBBS cutoff 2026, NEET college cutoff, NEET cutoff analyzer, AIQ cutoff, state quota MBBS cutoff, NEET closing rank government colleges, MBBS admission cutoff, NEET 2025 cutoff, medical college cutoff India"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F4FBF8] pb-4">
        {/* Breadcrumb */}
        <div className="w-full border-b border-[#D6EFE4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">NEET Cutoffs</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(120deg, #064E3B 0%, #047857 45%, #059669 100%)" }}
          />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-10 pb-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-white/25">
              <TableProperties className="h-3.5 w-3.5" />
              NEET UG 2026 · Round-wise Cutoff Analyzer
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              NEET 2026 Cutoff — Round-wise Closing Ranks
            </h1>
            <p className="mt-3 text-emerald-50/90 text-sm md:text-base max-w-2xl mx-auto">
              See the last rank that got a seat in each MBBS/BDS college, in every counselling
              round — for All India Quota and state quota, in every category. Based on the latest
              NEET 2025 counselling data to help you plan your NEET 2026 college choices.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-emerald-900/5 p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <Label>College</Label>
                <CollegeAutocomplete value={college} onChange={setCollege} state={state} />
              </div>

              <div className="md:col-span-2">
                <Label>State</Label>
                <FilterSelect value={state} onChange={setState} items={options.states} />
              </div>
              <div className="md:col-span-2">
                <Label>Quota</Label>
                <FilterSelect
                  value={quota}
                  onChange={setQuota}
                  items={options.quotas}
                  labelFor={quotaLabel}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Category</Label>
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
              </div>
              <div className="md:col-span-2">
                <Label>Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label>College Type</Label>
              <div className="flex flex-wrap gap-2">
                {["All", ...options.types].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      type === t
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {t === "All" ? "All Types" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-6">
          {/* What is this / how to read it */}
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-2.5">
              <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  What this shows &amp; how to use it
                </h2>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  NEET counselling happens in several rounds. In each round, the{" "}
                  <strong className="text-gray-800">closing rank</strong> is the last (highest)
                  All India Rank that got a seat in that college. Because more seats open up
                  later, the closing rank usually goes <em>up</em> each round — so a college can
                  still be within reach in Round 2 or 3 even if it closed at a better rank in
                  Round 1.
                </p>
                <div className="mt-3 grid sm:grid-cols-3 gap-2.5">
                  <Step n={1} text="Search a college, or filter by state, quota & category." />
                  <Step n={2} text="Read across the rounds to see how the closing rank rises." />
                  <Step n={3} text="Compare it with your rank to judge your realistic chances." />
                </div>
                <p className="mt-3 text-xs text-gray-500 bg-emerald-50/70 rounded-lg px-3 py-2">
                  Example: if a college closes at <strong>12,352</strong> in Round 1 and{" "}
                  <strong>20,147</strong> by Round 3, a rank near 20,000 could still get a seat in
                  the later rounds.
                </p>
              </div>
            </div>
          </div>

          {/* Summary line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-600">
              {loading ? (
                "Loading cutoffs…"
              ) : (
                <>
                  <span className="font-bold text-gray-800">{groups.length.toLocaleString("en-IN")}</span>{" "}
                  {college ? "matching entries" : "colleges"} · {category} ·{" "}
                  {quotaLabel(quota)} · {year}
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate("/neet-college-predictor")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:gap-2.5 transition-all cursor-pointer"
            >
              Predict my colleges from rank <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-emerald-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-rose-600">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center">
              <Building2 className="h-12 w-12 text-emerald-300 mb-4 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No cutoffs for these filters</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Try a different quota, category or year — or clear the college search to
                browse all colleges.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: round-wise table */}
              <div className="hidden md:block bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-emerald-50/70 text-emerald-900">
                        <th className="text-left font-bold px-4 py-3 sticky left-0 bg-emerald-50/70 min-w-[240px]">
                          College
                        </th>
                        <th className="text-center font-bold px-3 py-3 whitespace-nowrap">Seats</th>
                        {roundColumns.map((r) => (
                          <th key={r} className="text-center font-bold px-3 py-3 whitespace-nowrap">
                            Round {r}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageGroups.map((g) => {
                        const totalSeats = Array.from(g.byRound.values()).reduce(
                          (s, r) => s + (r.seats || 0),
                          0,
                        );
                        return (
                          <tr key={g.key} className="border-t border-gray-100 hover:bg-emerald-50/30">
                            <td className="px-4 py-3 sticky left-0 bg-white">
                              <p className="font-semibold text-gray-800 leading-snug">{g.college}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {g.state}
                                </span>
                                {g.type && <span>· {g.type}</span>}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-600 font-medium">
                              {totalSeats || "-"}
                            </td>
                            {roundColumns.map((r) => {
                              const row = g.byRound.get(r);
                              return (
                                <td key={r} className="px-3 py-3 text-center">
                                  {row ? (
                                    <div>
                                      <p className="font-bold text-emerald-700 whitespace-nowrap">
                                        {row.closing_rank?.toLocaleString("en-IN")}
                                      </p>
                                      {row.closing_score != null && (
                                        <p className="text-[11px] text-gray-400">
                                          {row.closing_score} sc
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: one card per college with round chips */}
              <div className="md:hidden space-y-3">
                {pageGroups.map((g) => {
                  const totalSeats = Array.from(g.byRound.values()).reduce(
                    (s, r) => s + (r.seats || 0),
                    0,
                  );
                  return (
                    <div key={g.key} className="bg-white rounded-xl border border-emerald-100 p-4">
                      <p className="font-bold text-gray-800 leading-snug">{g.college}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {g.state}
                        </span>
                        {g.type && <span>· {g.type}</span>}
                        {totalSeats > 0 && <span>· {totalSeats} seats</span>}
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {roundColumns.map((r) => {
                          const row = g.byRound.get(r);
                          if (!row) return null;
                          return (
                            <div
                              key={r}
                              className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-2 text-center"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Round {r}
                              </p>
                              <p className="mt-0.5 text-sm font-extrabold text-gray-800">
                                {row.closing_rank?.toLocaleString("en-IN")}
                              </p>
                              {row.closing_score != null && (
                                <p className="text-[10px] text-gray-400">{row.closing_score} score</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Numbers are the closing rank (last allotted All India Rank) for each round;
                “sc” / “score” is the closing NEET score. A missing round means no seat was
                allotted in that round for this college / quota / category.
              </p>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 h-10 rounded-lg border border-emerald-200 text-sm font-medium hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 h-10 rounded-lg border border-emerald-200 text-sm font-medium hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Counselling CTA band */}
          <div className="mt-8 rounded-2xl overflow-hidden">
            <div
              className="relative px-6 py-8 sm:px-10 sm:py-9 text-white"
              style={{ background: "linear-gradient(120deg, #047857 0%, #059669 60%, #10B981 100%)" }}
            >
              <div className="relative max-w-3xl">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Numbers tell you where you can get in. People tell you where you’ll thrive.
                </h2>
                <p className="mt-2 text-emerald-50/90 text-sm sm:text-base">
                  Cutoffs are only half the decision. Talk to verified MBBS seniors from these
                  colleges and to counsellors who guide your MCC & state choice-filling — so
                  you fill your preference list in the right order and don’t lose a seat you deserved.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/counsellor-listing")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:opacity-95 cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    Talk to a counsellor
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/pro-buddies")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-900/30 ring-1 ring-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900/40 cursor-pointer"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Connect with a senior
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Long-form SEO content */}
        <SeoArticle
          eyebrow="NEET Counselling Guide"
          title={neetCutoffContent.title}
          intro={neetCutoffContent.intro}
          sections={neetCutoffContent.sections}
          faqs={neetCutoffContent.faqs}
          accent={ACCENT}
          className="mt-4"
        />

        <OtherPredictors currentPath="/neet-cutoffs" accent={ACCENT} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

const selectClass =
  "w-full h-12 border border-emerald-200 rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 cursor-pointer";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-gray-700 mb-1.5">{children}</label>;
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
        {n}
      </span>
      <span className="text-xs text-gray-600 leading-snug">{text}</span>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  items,
  labelFor,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
  labelFor?: (v: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={selectClass}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {items.map((it) => (
          <SelectItem key={it} value={it}>
            {labelFor ? labelFor(it) : it}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
