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
  MapPin,
  Building2,
  Search,
  GraduationCap,
  Users,
  Stethoscope,
  ArrowRight,
  Landmark,
  TableProperties,
} from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import { mbbsCollegesContent } from "@/components/SEO/seoContent";
import { getInstitutes, type NEETInstitute } from "@/api/neetV2";
import AdSenseUnit from "@/components/ads/AdSenseUnit";
import {
  STATE_INSTITUTE_SUMMARY,
  INSTITUTE_TOTALS,
} from "@/data/neetDirectory";

const ACCENT = "#059669";
const PER_PAGE = 30;

export default function NEETMedicalColleges() {
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<NEETInstitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("All");
  const [type, setType] = useState("All"); // College Type — "All Types" by default
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const directoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getInstitutes()
      .then((res) => {
        if (res) {
          const flat = res.states.flatMap((s) => s.colleges);
          setColleges(flat);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const stateOptions = useMemo(
    () => ["All", ...STATE_INSTITUTE_SUMMARY.map((s) => s.state)],
    [],
  );

  // College Type pills derived from live data (raw NMC types), "All" default.
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of colleges) if (c.type) set.add(c.type);
    return Array.from(set).sort();
  }, [colleges]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colleges.filter((c) => {
      if (state !== "All" && c.state !== state) return false;
      if (type !== "All" && c.type !== type) return false;
      if (q && !c.college.toLowerCase().includes(q) && !c.district.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [colleges, state, type, query]);

  useEffect(() => setPage(1), [state, type, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const filteredSeats = useMemo(
    () => filtered.reduce((s, c) => s + (c.seats || 0), 0),
    [filtered],
  );

  const scrollToDirectory = (nextState: string) => {
    setState(nextState);
    setTimeout(
      () => directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  };

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "MBBS Colleges in India 2026 — State-wise List, Seats & Fees",
        description:
          "Directory of 820+ MBBS medical colleges in India with 1.29 lakh+ seats across 34 states — university, management type, year established and seat count.",
        url: "https://procounsel.co.in/mbbs-colleges",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "MBBS Colleges by State in India",
        numberOfItems: STATE_INSTITUTE_SUMMARY.length,
        itemListElement: STATE_INSTITUTE_SUMMARY.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${s.state} — ${s.count} MBBS colleges, ${s.totalSeats} seats`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: mbbsCollegesContent.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://procounsel.co.in/" },
          { "@type": "ListItem", position: 2, name: "MBBS Colleges", item: "https://procounsel.co.in/mbbs-colleges" },
        ],
      },
    ],
    [],
  );

  return (
    <>
      <PageSEO
        title="MBBS Colleges in India 2026 — State-wise List, Seats & Fees"
        description="Complete list of MBBS medical colleges in India 2026: 820+ colleges and 1.29 lakh+ seats across 34 states. Browse by state and college type with affiliating university, management, year established and MBBS seats for your NEET counselling choices."
        canonical="/mbbs-colleges"
        keywords="MBBS colleges in India, medical colleges in India, MBBS colleges list, state wise MBBS colleges, MBBS seats in India, government medical colleges, private medical colleges, deemed medical universities, MBBS college directory, NEET colleges, medical college seats, MBBS fees India"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F4FBF8] pb-4">
        {/* Breadcrumb */}
        <div className="w-full border-b border-[#D6EFE4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">MBBS Colleges</span>
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
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-10 pb-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-white/25">
              <GraduationCap className="h-3.5 w-3.5" />
              NEET UG 2026 · MBBS College Directory
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              MBBS Colleges in India — State-wise List &amp; Seats
            </h1>
            <p className="mt-3 text-emerald-50/90 text-sm md:text-base max-w-2xl mx-auto">
              Every recognised MBBS college in India with its university, management type, year
              established and seat count — browse by state and college type to plan your NEET
              counselling choices.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Stat label="Colleges" value={INSTITUTE_TOTALS.colleges.toLocaleString("en-IN")} />
              <Stat label="MBBS Seats" value={INSTITUTE_TOTALS.seats.toLocaleString("en-IN")} />
              <Stat label="States / UTs" value={String(INSTITUTE_TOTALS.states)} />
            </div>
          </div>
        </div>

        {/* State summary grid (static, crawlable) */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-emerald-900/5 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">MBBS Colleges &amp; Seats by State</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tap a state to see every medical college in it.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {STATE_INSTITUTE_SUMMARY.map((s) => (
                <button
                  key={s.state}
                  type="button"
                  onClick={() => scrollToDirectory(s.state)}
                  className="text-left rounded-xl border border-emerald-100 bg-emerald-50/40 px-3.5 py-3 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{s.state}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-bold text-emerald-700">{s.count}</span> colleges ·{" "}
                    <span className="font-bold text-emerald-700">
                      {s.totalSeats.toLocaleString("en-IN")}
                    </span>{" "}
                    seats
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory */}
        <div ref={directoryRef} className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-6 scroll-mt-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>State / UT</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {stateOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s === "All" ? "All States" : s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Search college</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. AIIMS, Grant Medical College, Nagpur…"
                    className="w-full h-12 pl-10 pr-4 border border-emerald-200 rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {typeOptions.length > 0 && (
              <div className="mt-4">
                <Label>College Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["All", ...typeOptions].map((t) => (
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
            )}
          </div>

          {/* Summary line */}
          <div className="flex flex-wrap items-center justify-between gap-3 my-4">
            <p className="text-sm text-gray-600">
              {loading ? (
                "Loading full college directory…"
              ) : (
                <>
                  <span className="font-bold text-gray-800">
                    {filtered.length.toLocaleString("en-IN")}
                  </span>{" "}
                  colleges
                  {state !== "All" ? ` in ${state}` : ""} ·{" "}
                  <span className="font-bold text-gray-800">
                    {filteredSeats.toLocaleString("en-IN")}
                  </span>{" "}
                  MBBS seats
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate("/neet-cutoffs")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:gap-2.5 transition-all cursor-pointer"
            >
              See closing ranks (cutoffs) <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-emerald-100 animate-pulse" />
              ))}
            </div>
          ) : colleges.length === 0 ? (
            // API unavailable (e.g. at prerender) — the static per-state summary above
            // remains the crawlable content; nudge the visitor to browse by state.
            <div className="bg-white rounded-2xl border border-emerald-100 p-10 text-center">
              <Building2 className="h-12 w-12 text-emerald-300 mb-4 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Browse colleges by state</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Pick a state from the grid above to explore its medical colleges, or refresh the
                page to load the full searchable directory.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center">
              <Building2 className="h-12 w-12 text-emerald-300 mb-4 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No colleges match these filters</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Try a different state or college type, or clear your search.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-emerald-50/70 text-emerald-900">
                        <th className="text-left font-bold px-4 py-3 min-w-[260px]">College</th>
                        <th className="text-left font-bold px-4 py-3 min-w-[200px]">University</th>
                        <th className="text-left font-bold px-4 py-3 whitespace-nowrap">Management</th>
                        <th className="text-center font-bold px-3 py-3 whitespace-nowrap">Estd.</th>
                        <th className="text-center font-bold px-3 py-3 whitespace-nowrap">Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((c, i) => (
                        <tr key={`${c.college}-${i}`} className="border-t border-gray-100 hover:bg-emerald-50/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800 leading-snug">{c.college}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {c.district ? `${c.district}, ` : ""}{c.state}
                              </span>
                              {c.type && (
                                <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-semibold">
                                  {c.type}
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{c.university || "—"}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.management || "—"}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{c.established || "—"}</td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-700">
                            {c.seats || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pageRows.map((c, i) => (
                  <div key={`${c.college}-${i}`} className="bg-white rounded-xl border border-emerald-100 p-4">
                    <p className="font-bold text-gray-800 leading-snug">{c.college}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.district ? `${c.district}, ` : ""}{c.state}
                      </span>
                      {c.type && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-semibold">
                          {c.type}
                        </span>
                      )}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Estd.</p>
                        <p className="font-semibold text-gray-700">{c.established || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Seats</p>
                        <p className="font-semibold text-emerald-700">{c.seats || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="font-semibold text-gray-700">{c.management || "—"}</p>
                      </div>
                    </div>
                    {c.university && (
                      <p className="mt-2 text-xs text-gray-500">{c.university}</p>
                    )}
                  </div>
                ))}
              </div>

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

          {/* Cross-links */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate("/neet-counselling")}
              className="group text-left rounded-2xl border border-emerald-100 bg-white p-5 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Landmark className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-800">NEET Counselling Authorities</h3>
                  <p className="text-xs text-gray-500">State-wise registration links</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate("/neet-cutoffs")}
              className="group text-left rounded-2xl border border-emerald-100 bg-white p-5 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <TableProperties className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-800">NEET Round-wise Cutoffs</h3>
                  <p className="text-xs text-gray-500">Closing ranks for every college</p>
                </div>
              </div>
            </button>
          </div>

          {/* Counselling CTA band */}
          <div className="mt-8 rounded-2xl overflow-hidden">
            <div
              className="relative px-6 py-8 sm:px-10 sm:py-9 text-white"
              style={{ background: "linear-gradient(120deg, #047857 0%, #059669 60%, #10B981 100%)" }}
            >
              <div className="relative max-w-3xl">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Found colleges you like? Talk to someone who studies there.
                </h2>
                <p className="mt-2 text-emerald-50/90 text-sm sm:text-base">
                  Seats and fees are only part of the picture. Connect with verified MBBS seniors
                  from these colleges and with counsellors who help you shortlist and order your
                  NEET choices the right way.
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
          eyebrow="MBBS Admission Guide"
          title={mbbsCollegesContent.title}
          intro={mbbsCollegesContent.intro}
          sections={mbbsCollegesContent.sections}
          faqs={mbbsCollegesContent.faqs}
          accent={ACCENT}
          className="mt-4"
        />

        <AdSenseUnit />
        <OtherPredictors currentPath="/mbbs-colleges" accent={ACCENT} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/12 backdrop-blur px-4 py-2.5 ring-1 ring-white/20 text-center min-w-[96px]">
      <p className="text-xl font-extrabold text-white leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-emerald-50/80">{label}</p>
    </div>
  );
}
