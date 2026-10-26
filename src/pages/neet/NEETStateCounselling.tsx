import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  ExternalLink,
  ShieldCheck,
  Search,
  Users,
  Stethoscope,
  ArrowRight,
  Landmark,
  TableProperties,
} from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import { neetCounsellingContent } from "@/components/SEO/seoContent";
import { getStateCounselling } from "@/api/neetV2";
import AdSenseUnit from "@/components/ads/AdSenseUnit";
import {
  STATE_COUNSELLING_AUTHORITIES,
  type CounsellingAuthority,
} from "@/data/neetDirectory";

const ACCENT = "#059669";

export default function NEETStateCounselling() {
  const navigate = useNavigate();
  // Seed with the embedded static snapshot so the page is fully crawlable at
  // prerender time (react-snap skips the API); refresh live in the browser.
  const [authorities, setAuthorities] = useState<CounsellingAuthority[]>(
    STATE_COUNSELLING_AUTHORITIES,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    getStateCounselling()
      .then((live) => {
        if (live && live.length) setAuthorities(live);
      })
      .catch(() => {});
  }, []);

  const aiq = authorities[0];
  const stateRows = authorities.slice(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stateRows;
    return stateRows.filter(
      (a) =>
        a.state.toLowerCase().includes(q) ||
        a.authority.toLowerCase().includes(q),
    );
  }, [stateRows, query]);

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "NEET UG 2026 State-wise Counselling Authorities & Registration Links",
        description:
          "Official NEET UG counselling authorities and registration websites for the All India Quota (MCC) and every state and union territory.",
        url: "https://procounsel.co.in/neet-counselling",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "NEET UG Counselling Authorities in India",
        numberOfItems: authorities.length,
        itemListElement: authorities.slice(0, 40).map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${a.state} — ${a.authority}`,
          url: a.url,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: neetCounsellingContent.faqs.map((f) => ({
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
          { "@type": "ListItem", position: 2, name: "NEET Counselling", item: "https://procounsel.co.in/neet-counselling" },
        ],
      },
    ],
    [authorities],
  );

  return (
    <>
      <PageSEO
        title="NEET UG 2026 Counselling — State-wise Authorities & Official Registration Links"
        description="State-wise NEET UG 2026 counselling authorities with official registration links for the All India Quota (MCC) and every state — Karnataka KEA, Maharashtra CETCELL, Bihar BCECEB, Telangana KNRUHS and more. Register on the right portal, on time."
        canonical="/neet-counselling"
        keywords="NEET counselling 2026, NEET UG counselling, state wise NEET counselling, MCC counselling, NEET counselling registration link, AIQ counselling, state quota MBBS counselling, NEET counselling authority, MCC nic in, KEA Karnataka, CETCELL Maharashtra, BCECEB, KNRUHS, medical counselling committee"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F4FBF8] pb-4">
        {/* Breadcrumb */}
        <div className="w-full border-b border-[#D6EFE4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">NEET Counselling</span>
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
              <Landmark className="h-3.5 w-3.5" />
              NEET UG 2026 · Counselling Authorities
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              NEET UG 2026 Counselling — State-wise Authorities &amp; Links
            </h1>
            <p className="mt-3 text-emerald-50/90 text-sm md:text-base max-w-2xl mx-auto">
              The official counselling authority and direct registration website for the All
              India Quota (MCC) and every state &amp; union territory. Register on the right
              portal, on time — and only on official sites.
            </p>
          </div>
        </div>

        {/* AIQ highlight + search */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-emerald-900/5 p-5 sm:p-6">
            {aiq && (
              <a
                href={aiq.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      All India Quota (15% seats)
                    </p>
                    <p className="font-bold text-gray-800 leading-snug">{aiq.authority}</p>
                  </div>
                </div>
                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white group-hover:bg-emerald-700">
                  Register on MCC <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            )}

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your state or counselling authority…"
                className="w-full h-12 pl-10 pr-4 border border-emerald-200 rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Authorities table */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              State &amp; UT Counselling Authorities
            </h2>
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "authority" : "authorities"}
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50/70 text-emerald-900">
                    <th className="text-left font-bold px-4 py-3 w-16">#</th>
                    <th className="text-left font-bold px-4 py-3 min-w-[180px]">State / UT</th>
                    <th className="text-left font-bold px-4 py-3 min-w-[240px]">Counselling Authority</th>
                    <th className="text-center font-bold px-4 py-3 whitespace-nowrap">Official Portal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => (
                    <tr key={a.sno} className="border-t border-gray-100 hover:bg-emerald-50/30">
                      <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {a.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{a.authority}</td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Register <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((a) => (
              <div key={a.sno} className="bg-white rounded-xl border border-emerald-100 p-4">
                <p className="inline-flex items-center gap-1.5 font-bold text-gray-800">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  {a.state}
                </p>
                <p className="mt-1 text-sm text-gray-600">{a.authority}</p>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Register on official portal <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center text-gray-500">
              No authority matches “{query}”. Try another state name.
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">
            Links point to official government / university counselling portals. Always verify
            the domain (.nic.in / .gov.in / recognised universities) and never pay an agent or
            share your NEET credentials outside the official site.
          </p>

          {/* Cross-links */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate("/mbbs-colleges")}
              className="group text-left rounded-2xl border border-emerald-100 bg-white p-5 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Landmark className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-800">MBBS Colleges in India</h3>
                  <p className="text-xs text-gray-500">State-wise list, seats &amp; fees</p>
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
                  Registered on the portal? The real game is choice-filling.
                </h2>
                <p className="mt-2 text-emerald-50/90 text-sm sm:text-base">
                  The order of your preference list decides your seat. Talk to verified MBBS
                  seniors and counsellors who guide your MCC &amp; state choice-filling — so you
                  don't lose a seat you deserved.
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
          title={neetCounsellingContent.title}
          intro={neetCounsellingContent.intro}
          sections={neetCounsellingContent.sections}
          faqs={neetCounsellingContent.faqs}
          accent={ACCENT}
          className="mt-4"
        />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-2">
          <button
            type="button"
            onClick={() => navigate("/neet-college-predictor")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:gap-2.5 transition-all cursor-pointer"
          >
            Predict my MBBS colleges from rank <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <AdSenseUnit />
        <OtherPredictors currentPath="/neet-counselling" accent={ACCENT} />
      </div>
    </>
  );
}
