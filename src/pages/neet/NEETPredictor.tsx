import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2, Lock, Search, Sparkles, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageSEO from "@/components/SEO/PageSEO";
import IndiaStateMap from "@/components/neet/IndiaStateMap";
import NEETCollegeCard from "@/components/neet/NEETCollegeCard";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import CounsellingCTA from "@/components/predictors/CounsellingCTA";
import AdSenseUnit from "@/components/ads/AdSenseUnit";
import { useAuthStore } from "@/store/AuthStore";
import { persistPredictorSearch } from "@/lib/predictorIntent";
import {
  buildCollegeListPdf,
  collegeListFileName,
  predictionFileName,
} from "@/lib/neetCollegePdf";
import {
  getAllNEETColleges,
  getNEETColleges,
  getNEETStates,
  predictNEETColleges,
  formatRank,
  NEET_CATEGORIES,
  NEET_COLLEGE_TYPES,
  NEET_TARGET_TYPES,
  type NEETTargetType,
} from "@/api/neetCounselling";

/**
 * NEET predictor — /neet-college-predictor
 *
 * Two tabs. The predictor leads, because it is what the page is for and what
 * inbound traffic arrives wanting; the directory sits behind it as the browse
 * option. Both are gated the same way — the result loads for everyone and part
 * of it renders behind a lock, because leads are the point of the page:
 *
 *   1. The prediction RUNS for everyone, and the first few matches render in
 *      the clear. Refusing to compute until login loses people at the worst
 *      moment, and a wholly blurred list reads as a paywall over nothing —
 *      showing real colleges first proves the answer exists, and the rest is
 *      what signing in buys. The search is persisted before the gate
 *      (predictorIntent.ts), so the lead created at login carries what they
 *      were looking for, and nothing re-runs after — the mutation's data
 *      survives the auth change.
 *   2. "Colleges by state" fetches the directory (a state's, or all of India
 *      when no state is picked) and blurs it for signed-out visitors, so they
 *      can see a real result is sitting there. The whole list, unblurred and as
 *      a branded PDF, is what logging in buys.
 *
 * All three endpoints go through React Query, so the state list and each
 * state's directory are cached and deduped instead of refetched per tab switch.
 *
 * Built on the v1 counselling API (src/api/neetCounselling.ts), replacing the
 * older rank/college/probability endpoints. The URL is unchanged on purpose —
 * it is indexed and has inbound links, so the page was rebuilt in place.
 */

const ACCENT = "#059669";
const RESULTS_PAGE_SIZE = 8;
/**
 * Matches shown in the clear to a signed-out visitor before the lock. Enough to
 * prove the list is real and specific to their rank; few enough that the rest
 * is still worth signing in for.
 */
const FREE_PREVIEW = 3;
/** Rows rendered in the on-page list. The PDF fetches the lot separately. */
const DIRECTORY_LIMIT = 300;
/** Sentinel for the state <Select>; the query treats it as "no state filter". */
const ALL_INDIA = "__all_india__";
const SITE = "https://procounsel.co.in";
const SHELL_MAX = "max-w-[1400px]";
const SHELL = `mx-auto w-full ${SHELL_MAX} px-4 md:px-8`;

export default function NEETPredictor() {
  const { isAuthenticated, toggleLogin } = useAuthStore();
  const [tab, setTab] = useState<"predict" | "colleges">("predict");

  /* ---------------- state directory (public) ---------------- */

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All types");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: states = [], isError: statesFailed } = useQuery({
    queryKey: ["neet", "states"],
    queryFn: getNEETStates,
    staleTime: Infinity,
  });

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: directory,
    isFetching: directoryLoading,
    isError: directoryFailed,
  } = useQuery({
    queryKey: ["neet", "colleges", selectedState, typeFilter, debouncedQuery],
    queryFn: () =>
      getNEETColleges({
        state: selectedState ?? undefined,
        college_type: typeFilter === "All types" ? undefined : typeFilter,
        q: debouncedQuery || undefined,
        limit: DIRECTORY_LIMIT,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const colleges = directory?.items ?? [];

  /** Directory rows held back behind the lock for a signed-out visitor. */
  const lockedDirectoryCount = Math.max(
    (directory?.total ?? colleges.length) - FREE_PREVIEW,
    0,
  );

  const handleSelectState = useCallback((state: string) => {
    setSelectedState(state);
    setQuery("");
  }, []);

  // Only the selected state's count is known — the directory endpoint is
  // per-state, so counting all 34 up front would be 34 requests for a caption.
  const stateCounts = useMemo(
    () => (selectedState && directory ? { [selectedState]: directory.total } : {}),
    [selectedState, directory],
  );

  /* ---------------- college-list PDF (login-gated) ---------------- */

  const [pdfBusy, setPdfBusy] = useState(false);

  /**
   * Refetches the list with the cap lifted — the on-page list is capped at
   * DIRECTORY_LIMIT rows for render cost, but the download is meant to be the
   * complete thing, all of India included.
   */
  const downloadCollegeList = useCallback(async () => {
    setPdfBusy(true);
    try {
      // Paged internally — the API caps `limit` at 500 and 422s above it, so
      // "every college in India" is several requests.
      const full = await getAllNEETColleges({
        state: selectedState ?? undefined,
        college_type: typeFilter === "All types" ? undefined : typeFilter,
        q: debouncedQuery || undefined,
      });

      if (!full.items.length) {
        toast.error("Nothing to download for these filters.");
        return;
      }

      // jsPDF is heavy and only this one button needs it.
      const { jsPDF } = await import("jspdf");
      const pdf = buildCollegeListPdf(
        new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" }),
        full.items,
        {
          state: selectedState,
          collegeType: typeFilter,
          query: debouncedQuery,
          total: full.total,
        },
      );
      pdf.save(collegeListFileName(selectedState, typeFilter));
      toast.success("Your college list PDF is downloading.");
    } catch {
      toast.error("Could not build the PDF just now. Please try again.");
    } finally {
      setPdfBusy(false);
    }
  }, [selectedState, typeFilter, debouncedQuery]);

  /**
   * The gate. The search is persisted first so the lead captured at login
   * carries what they were looking at, and the download is handed to
   * `toggleLogin` as its success callback — so signing in delivers the file
   * without the student having to find the button again.
   */
  const handleDownloadClick = () => {
    persistPredictorSearch({
      exam: "NEET",
      tool: "College List PDF",
      summary: [
        selectedState ?? "All India",
        typeFilter !== "All types" ? typeFilter : null,
        debouncedQuery || null,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    if (!isAuthenticated) {
      toast("Log in and the PDF downloads straight away.", { icon: "🔒" });
      toggleLogin(() => {
        void downloadCollegeList();
      });
      return;
    }
    void downloadCollegeList();
  };

  /* ---------------- prediction ---------------- */

  const [air, setAir] = useState("");
  const [score, setScore] = useState("");
  const [domicile, setDomicile] = useState("All India");
  const [category, setCategory] = useState<string>("General");
  const [targetType, setTargetType] = useState<NEETTargetType>("All types");
  const [shownResults, setShownResults] = useState(RESULTS_PAGE_SIZE);

  /**
   * Scrolled to the moment a prediction is requested, so the student sees the
   * skeleton rather than a page that looks unchanged.
   */
  const resultsRef = useRef<HTMLElement | null>(null);
  /**
   * Scrolled to again once the matches actually render. The card grows when the
   * results land, so a scroll fired at submit time leaves the colleges below
   * the fold — this one puts the cards themselves on screen.
   */
  const matchesRef = useRef<HTMLDivElement | null>(null);

  const predict = useMutation({ mutationFn: predictNEETColleges });
  const prediction = predict.data ?? null;

  /** Matches held back behind the lock for a signed-out visitor. */
  const lockedCount = Math.max((prediction?.items.length ?? 0) - FREE_PREVIEW, 0);

  /**
   * The matched list as a PDF. Nothing is refetched — the prediction already
   * sits in the mutation, so this is the same result they are looking at.
   */
  const downloadPrediction = useCallback(async () => {
    if (!prediction?.items.length) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = buildCollegeListPdf(
        new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" }),
        prediction.items,
        {
          state: null,
          mode: "prediction",
          subtitle: `${prediction.rank_label} ${formatRank(prediction.rank_used)}`,
          collegeType: targetType,
          total: prediction.items.length,
        },
      );
      pdf.save(predictionFileName(prediction.rank_label, prediction.rank_used));
      toast.success("Your prediction PDF is downloading.");
    } catch {
      toast.error("Could not build the PDF just now. Please try again.");
    } finally {
      setPdfBusy(false);
    }
  }, [prediction, targetType]);

  const handlePredictionDownload = () => {
    if (!isAuthenticated) {
      toast("Log in and the PDF downloads straight away.", { icon: "🔒" });
      toggleLogin(() => {
        void downloadPrediction();
      });
      return;
    }
    void downloadPrediction();
  };

  const domicileOptions = useMemo(() => ["All India", ...states], [states]);

  const runPrediction = () => {
    const airValue = air.trim() ? Number(air) : null;
    const scoreValue = score.trim() ? Number(score) : null;

    if (airValue === null && scoreValue === null) {
      toast.error("Enter your NEET AIR, or your score if you do not have the rank yet.");
      return;
    }
    if (airValue !== null && (!Number.isFinite(airValue) || airValue < 1)) {
      toast.error("Enter a valid All India Rank.");
      return;
    }
    if (
      scoreValue !== null &&
      (!Number.isFinite(scoreValue) || scoreValue < 1 || scoreValue > 720)
    ) {
      toast.error("NEET score must be between 1 and 720.");
      return;
    }

    // Persisted before anything else, so the lead created at login carries the
    // search whether they sign in now or after seeing the locked result.
    persistPredictorSearch({
      exam: "NEET",
      tool: "College Predictor",
      summary: [
        airValue !== null ? `AIR ${airValue}` : `${scoreValue}/720 marks`,
        category,
        domicile,
        targetType !== "All types" ? targetType : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    setShownResults(RESULTS_PAGE_SIZE);

    // Move to the results card now rather than on success: the skeleton is
    // already rendering there, so the student watches the answer arrive instead
    // of wondering whether the button did anything.
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    predict.mutate(
      {
        neet_air: airValue,
        neet_score: airValue === null ? scoreValue : null,
        domicile,
        category,
        // Counselling is no longer asked for — the widest option is the honest
        // default, since narrowing it silently drops colleges the student
        // never chose to exclude.
        counselling: "All types",
        target_type: targetType,
        limit: 40,
      },
      {
        onSuccess: (res) => {
          // After paint, so the grown card is measured before we scroll to it.
          requestAnimationFrame(() => {
            (matchesRef.current ?? resultsRef.current)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
          if (!res.items.length) {
            toast("No colleges matched. Try a different college type or domicile.", {
              icon: "🔍",
            });
          }
        },
      },
    );
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "ProCounsel NEET College Predictor",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: `${SITE}/neet-college-predictor`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Predictors", item: `${SITE}/predictors` },
        {
          "@type": "ListItem",
          position: 3,
          name: "NEET College Predictor",
          item: `${SITE}/neet-college-predictor`,
        },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title="NEET College Predictor 2026 — Medical Colleges by Rank & State | ProCounsel"
        description="Predict the MBBS colleges you can get with your NEET rank or score, and browse every medical college state by state with cutoffs, seats and fees."
        canonical="/neet-college-predictor"
        keywords="neet college predictor, neet rank predictor, mbbs college predictor, neet counselling, medical colleges by state, neet cutoff"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-[#F6F8FE] pb-16">
        {/* Hero */}
        <section className={`${SHELL} pt-8 md:pt-12`}>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden />
            NEET 2026
          </span>
          <h1 className="mt-4 max-w-3xl font-[Poppins] text-[26px] font-semibold leading-tight text-[#0E1629] md:text-[38px]">
            NEET College Predictor and Medical College Directory
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 md:text-base">
            Browse medical colleges state by state for free, then use your NEET rank or score to
            see which of them you can realistically target — with round-wise closing ranks, seat
            counts and fees on every card.
          </p>
        </section>

        {/* Tabs — both tools named up front so neither sits below the fold. */}
        <div className={`${SHELL} mt-8`}>
          <div
            role="tablist"
            aria-label="NEET tools"
            className="inline-flex w-full gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-auto"
          >
            {(
              [
                { id: "predict", label: "Predict my colleges" },
                { id: "colleges", label: "Colleges by state" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-colors sm:flex-none sm:px-6 ${
                  tab === t.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- Colleges by state (public) ---------------- */}
        {tab === "colleges" && (
          <section className={`${SHELL} mt-6`}>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-[Poppins] text-[20px] font-semibold text-[#0E1629] md:text-[26px]">
                    Explore colleges by state
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-[14px] text-slate-600">
                    Click any state to open its medical college directory, or leave the state
                    blank to browse every MBBS &amp; BDS college in India — then download the whole
                    list as a PDF.
                  </p>
                </div>

                {/* The download is the reason to sign in, so it sits at the top
                    of the card rather than under a 300-row scroller. */}
                <Button
                  onClick={handleDownloadClick}
                  disabled={pdfBusy}
                  className="h-11 shrink-0 cursor-pointer rounded-xl px-5 text-[14px] font-semibold text-white hover:opacity-95"
                  style={{ backgroundColor: ACCENT }}
                >
                  {pdfBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Building PDF…
                    </>
                  ) : (
                    <>
                      {isAuthenticated ? (
                        <Download className="mr-2 h-4 w-4" aria-hidden />
                      ) : (
                        <Lock className="mr-2 h-4 w-4" aria-hidden />
                      )}
                      Download {selectedState ?? "all-India"} list (PDF)
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] lg:items-stretch">
                <IndiaStateMap
                  availableStates={states}
                  selected={selectedState}
                  onSelect={handleSelectState}
                  counts={stateCounts}
                />

                <div className="min-w-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          selectedState ? `Search colleges in ${selectedState}` : "Search colleges"
                        }
                        aria-label="Search colleges in the selected state"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    {/* Blank state = All India. The map cannot express "no
                        state", so the select is the only way back out of one. */}
                    <Select
                      value={selectedState ?? ALL_INDIA}
                      onValueChange={(v) => setSelectedState(v === ALL_INDIA ? null : v)}
                    >
                      <SelectTrigger className={`${selectClass} sm:w-[170px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value={ALL_INDIA}>All India</SelectItem>
                        {states.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className={`${selectClass} sm:w-[150px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEET_COLLEGE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-5">
                    {directoryLoading ? (
                      <CollegeListSkeleton />
                    ) : statesFailed || directoryFailed ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] text-amber-900">
                        Could not load colleges right now. Please retry shortly.
                      </div>
                    ) : colleges.length === 0 ? (
                      <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
                        <div>
                          <p className="text-[14px] font-medium text-slate-700">
                            No colleges match this filter
                          </p>
                          <p className="mt-1 text-[13px] text-slate-500">
                            Try clearing the search or switching the college type back to all.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`min-h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-3 ${
                          isAuthenticated
                            ? "max-h-[calc(100vh-320px)] overflow-y-auto [scrollbar-width:thin]"
                            : ""
                        }`}
                      >
                        {/* The first few read in the clear, same as the
                            predictor's results: real college names prove the
                            directory is there, and the lock then sits on
                            something the visitor can already see the value of.
                            A wholly blurred list reads as a paywall over
                            nothing. */}
                        <div className="flex flex-col gap-3">
                          {colleges
                            .slice(0, isAuthenticated ? colleges.length : FREE_PREVIEW)
                            .map((c, i) => (
                              <NEETCollegeCard key={`${c.name}-${i}`} college={c} />
                            ))}
                        </div>

                        {isAuthenticated ? (
                          colleges.length > 6 && (
                            <p className="pt-3 text-center text-[12px] text-slate-400">
                              Showing {colleges.length} of {directory?.total ?? colleges.length}{" "}
                              colleges · scroll for more
                            </p>
                          )
                        ) : lockedDirectoryCount > 0 ? (
                          <div className="relative mt-3">
                            <div
                              className="pointer-events-none select-none blur-[6px]"
                              aria-hidden
                            >
                              <div className="flex flex-col gap-3">
                                {colleges.slice(FREE_PREVIEW, FREE_PREVIEW + 4).map((c, i) => (
                                  <NEETCollegeCard key={`locked-${c.name}-${i}`} college={c} />
                                ))}
                              </div>
                            </div>

                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 px-6 text-center backdrop-blur-[1px]">
                              <Lock className="h-9 w-9" style={{ color: ACCENT }} aria-hidden />
                              <p className="mt-3 text-[16px] font-semibold text-slate-800">
                                {lockedDirectoryCount} more{" "}
                                {selectedState ? `in ${selectedState}` : "across India"}
                              </p>
                              <p className="mt-1 max-w-sm text-[13px] text-slate-600">
                                You are seeing the first {FREE_PREVIEW}. Log in to read the whole
                                list — seats, fees and closing ranks on every college — and to
                                download it as a ProCounsel PDF.
                              </p>
                              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <Button
                                  onClick={() => toggleLogin()}
                                  className="cursor-pointer rounded-xl px-7 py-2.5 font-semibold text-white hover:opacity-95"
                                  style={{ backgroundColor: ACCENT }}
                                >
                                  Log in to view
                                </Button>
                                <Button
                                  onClick={handleDownloadClick}
                                  variant="outline"
                                  className="cursor-pointer rounded-xl border-emerald-200 px-5 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Download className="mr-2 h-4 w-4" aria-hidden />
                                  Get the PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Standing provenance note. The per-card source line was
                      removed because it buried the numbers, so the caveat lives
                      here instead — it must not disappear entirely. */}
                  <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
                    Seats, fees and round-wise closing ranks are compiled from public counselling
                    sources and are indicative only. Ranks shown in green are parsed from a
                    counselling authority&rsquo;s own document; hover any rank to see its source.
                    Verify every figure against the official authority before acting on it.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Predict: form card, then a separate results card ---- */}
        {tab === "predict" && (
          <>
            <section className={`${SHELL} mt-6`}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
                <h2 className="font-[Poppins] text-[20px] font-semibold text-[#0E1629] md:text-[26px]">
                  Predict your colleges
                </h2>
                <p className="mt-1.5 max-w-2xl text-[14px] text-slate-600">
                  Enter your rank if you have it — it is far more accurate than a score. Fields
                  marked <span aria-hidden>*</span> are required.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="NEET AIR *" hint="More accurate when available">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={air}
                      onChange={(e) => setAir(e.target.value)}
                      placeholder="e.g. 52339"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="NEET score" hint="Used only when AIR is blank">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={720}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="out of 720"
                      disabled={air.trim() !== ""}
                      className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                    />
                  </Field>

                  <Field label="Domicile">
                    <Select value={domicile} onValueChange={setDomicile}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {domicileOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Category">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEET_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="College type">
                    <Select
                      value={targetType}
                      onValueChange={(v) => setTargetType(v as NEETTargetType)}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEET_TARGET_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* The invisible label spacer matches the real labels'
                      metrics, so the button's top edge lines up with every
                      input on the row rather than sitting a label's height
                      low. */}
                  <div className="flex flex-col">
                    <span
                      aria-hidden
                      className="mb-1.5 block text-[13px] font-medium leading-normal"
                    >
                      &nbsp;
                    </span>
                    <Button
                      onClick={runPrediction}
                      disabled={predict.isPending}
                      className="h-11 w-full cursor-pointer rounded-xl text-[15px] font-semibold text-white hover:opacity-95"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {predict.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Predicting…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" aria-hidden /> Predict colleges
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section ref={resultsRef} className={`${SHELL} mt-5 scroll-mt-[76px] md:scroll-mt-[120px]`}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-[Poppins] text-[18px] font-semibold text-[#0E1629] md:text-[22px]">
                    Matched colleges
                  </h2>
                  {prediction && prediction.items.length > 0 && (
                    <Button
                      onClick={handlePredictionDownload}
                      disabled={pdfBusy}
                      className="h-10 cursor-pointer rounded-xl px-5 text-[13.5px] font-semibold text-white hover:opacity-95"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {pdfBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Building
                          PDF…
                        </>
                      ) : (
                        <>
                          {isAuthenticated ? (
                            <Download className="mr-2 h-4 w-4" aria-hidden />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" aria-hidden />
                          )}
                          Download my list (PDF)
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {predict.isPending ? (
                  <div className="mt-5">
                    <CollegeListSkeleton rows={4} bare />
                  </div>
                ) : predict.isError ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] text-amber-900">
                    The predictor is not responding right now. Please try again in a moment.
                  </div>
                ) : !prediction ? (
                  <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-500">
                    <Stethoscope className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                    Your matched colleges appear here once you enter a rank or score.
                  </p>
                ) : prediction ? (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-slate-50 px-4 py-3">
                      <Stat label={prediction.rank_label} value={formatRank(prediction.rank_used)} />
                      <Stat label="Matches" value={String(prediction.items.length)} />
                      <Stat label="Ranked pool" value={String(prediction.ranked_pool)} />
                    </div>

                    {prediction.category_warning && (
                      <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-100">
                        {prediction.category_warning}
                      </p>
                    )}

                    {prediction.items.length === 0 ? (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center">
                        <p className="text-[14px] font-medium text-slate-700">
                          No recommendation to show yet
                        </p>
                        <p className="mt-1 text-[13px] text-slate-500">
                          Try a different college type, or widen the domicile to All India.
                        </p>
                      </div>
                    ) : (
                      <div ref={matchesRef} className={`mt-5 scroll-mt-[76px] md:scroll-mt-[120px]`}>
                        {/* The result is already computed, so a signed-out
                            visitor reads the first few matches in full. Real
                            college names against their own rank prove the
                            answer exists; a wholly blurred list reads as a
                            paywall over nothing and converts worse. */}
                        <div className="grid gap-3 lg:grid-cols-2">
                          {prediction.items
                            .slice(0, isAuthenticated ? shownResults : FREE_PREVIEW)
                            .map((c, i) => (
                              <NEETCollegeCard key={`${c.name}-${i}`} college={c} />
                            ))}
                        </div>

                        {isAuthenticated ? (
                          shownResults < prediction.items.length && (
                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => setShownResults((n) => n + RESULTS_PAGE_SIZE)}
                                className="cursor-pointer text-[13px] font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                              >
                                See more ({prediction.items.length - shownResults} left)
                              </button>
                            </div>
                          )
                        ) : lockedCount > 0 ? (
                          <div className="relative mt-3">
                            {/* A couple of blurred rows under the free ones, so
                                the lock sits on visible substance rather than
                                on empty space. */}
                            <div
                              className="pointer-events-none select-none blur-[6px]"
                              aria-hidden
                            >
                              <div className="grid gap-3 lg:grid-cols-2">
                                {prediction.items
                                  .slice(FREE_PREVIEW, FREE_PREVIEW + 4)
                                  .map((c, i) => (
                                    <NEETCollegeCard key={`locked-${c.name}-${i}`} college={c} />
                                  ))}
                              </div>
                            </div>

                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 px-6 text-center backdrop-blur-[1px]">
                              <Lock className="h-10 w-10" style={{ color: ACCENT }} aria-hidden />
                              <p className="mt-3 text-[16px] font-semibold text-slate-800">
                                {lockedCount} more {lockedCount === 1 ? "college" : "colleges"}{" "}
                                matched your rank
                              </p>
                              <p className="mt-1 max-w-sm text-[13px] text-slate-600">
                                You are seeing the top {FREE_PREVIEW}. Log in to open the full
                                list — your result is ready, signing in reveals it straight away
                                and nothing is re-run.
                              </p>
                              <Button
                                onClick={() => toggleLogin()}
                                className="mt-4 cursor-pointer rounded-xl px-8 py-2.5 font-semibold text-white hover:opacity-95"
                                style={{ backgroundColor: ACCENT }}
                              >
                                Log in to see all {prediction.items.length}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <p className="mt-5 text-[12px] leading-relaxed text-slate-500">
                      Predictions are based on previous-year closing ranks compiled from public
                      sources and are indicative only. Actual allotment depends on the counselling
                      authority, seat matrix and the current year's candidate pool. Verify every
                      figure against the official counselling authority before acting on it.
                    </p>
                  </>
                ) : null}
              </div>
            </section>
          </>
        )}

        {/* These bring their own container, so they are not wrapped in SHELL —
            they just need the same width cap as the cards above. */}
        <div className="mt-6">
          <AdSenseUnit className={SHELL_MAX} />
          <CounsellingCTA accent={ACCENT} exam="NEET" containerClass={SHELL_MAX} />
        </div>
        <OtherPredictors
          currentPath="/neet-college-predictor"
          accent={ACCENT}
          containerClass={SHELL_MAX}
        />
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const selectClass = "h-11 w-full cursor-pointer rounded-xl border-slate-200 text-[14px]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="block text-[16px] font-semibold tabular-nums text-slate-800">{value}</span>
    </div>
  );
}

/**
 * Placeholder rows in exactly the container the real list uses, so switching
 * state does not collapse the panel and snap it back open.
 */
function CollegeListSkeleton({ rows = 5, bare = false }: { rows?: number; bare?: boolean }) {
  return (
    <div
      className={
        bare
          ? ""
          : "max-h-[calc(100vh-320px)] min-h-[320px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
      }
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading colleges…</span>
      <div className={bare ? "grid gap-3 lg:grid-cols-2" : "flex flex-col gap-3"}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-3"
            aria-hidden
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-[15px] w-[70%] rounded" />
                <Skeleton className="mt-2 h-[11px] w-[35%] rounded" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="mt-3 h-[11px] w-[45%] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
