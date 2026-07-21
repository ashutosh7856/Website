import { useMemo } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { MapPin, Star, ArrowRight, GraduationCap, Users, Stethoscope } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { useAllCounselors } from "@/hooks/useCounselors";
import { encodeCounselorId } from "@/lib/utils";
import { getCityBySlug, buildCityContent, COUNSELLING_CITIES } from "@/lib/counsellingCities";
import type { AllCounselor } from "@/types/academic";

const ACCENT = "#2F43F2";

export default function CounsellingCityPage() {
  const { city: slug } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const cityData = getCityBySlug(slug);
  const { data: counsellors = [] } = useAllCounselors();

  const content = useMemo(() => (cityData ? buildCityContent(cityData) : null), [cityData]);

  // Local counsellors: match on city first, then fall back to state, then to a
  // general top list so the page never looks empty.
  const localCounsellors = useMemo<AllCounselor[]>(() => {
    if (!cityData || counsellors.length === 0) return [];
    const cityLc = cityData.city.toLowerCase();
    const stateLc = cityData.state.toLowerCase();
    const byCity = counsellors.filter((c) => (c.city || "").toLowerCase().includes(cityLc));
    const byState = counsellors.filter((c) =>
      (c.states || []).some((s) => (s || "").toLowerCase().includes(stateLc)),
    );
    const merged = [...byCity, ...byState.filter((c) => !byCity.includes(c))];
    const pool = merged.length > 0 ? merged : counsellors;
    return [...pool]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [cityData, counsellors]);

  if (!slug) return <Navigate to="/counselling" replace />;
  if (!cityData || !content) return <Navigate to="/counselling" replace />;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "College admission & career counselling",
      provider: { "@type": "Organization", name: "ProCounsel", url: "https://www.procounsel.co.in" },
      areaServed: { "@type": "City", name: cityData.city, containedInPlace: { "@type": "State", name: cityData.state } },
      description: content.metaDescription,
      url: `https://www.procounsel.co.in/counselling/${cityData.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: "Counselling", item: "https://www.procounsel.co.in/counselling" },
        { "@type": "ListItem", position: 3, name: `Counselling in ${cityData.city}`, item: `https://www.procounsel.co.in/counselling/${cityData.slug}` },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title={content.metaTitle}
        description={content.metaDescription}
        canonical={`/counselling/${cityData.slug}`}
        keywords={content.keywords}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F6F8FE] pb-4">
        {/* Breadcrumb */}
        <div className="w-full border-b border-[#E3E8F4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <Link to="/counselling" className="hover:underline cursor-pointer">Counselling</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">{cityData.city}</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden bg-[#0E1629]">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#2F43F2]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-12 pb-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-semibold text-gray-100 ring-1 ring-white/20">
              <MapPin className="h-3.5 w-3.5" />
              {cityData.city}, {cityData.state}
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              {content.h1}
            </h1>
            <p className="mt-4 text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {content.intro}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/counsellor-listing")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0E1629] hover:opacity-95 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                Find a counsellor in {cityData.city}
              </button>
              <button
                type="button"
                onClick={() => navigate("/pro-buddies")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 cursor-pointer"
              >
                <Stethoscope className="h-4 w-4" />
                Talk to a college senior
              </button>
            </div>
          </div>
        </div>

        {/* Local counsellors */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} />
              <h2 className="font-bold text-[20px] md:text-[24px] text-[#0E1629]">
                Verified counsellors serving {cityData.city}
              </h2>
            </div>

            {localCounsellors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localCounsellors.map((c) => (
                  <CounsellorCard key={c.counsellorId} c={c} onClick={() => navigate(`/counsellor-details/${encodeCounselorId(c.counsellorId)}`)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Loading counsellors near {cityData.city}…{" "}
                <Link to="/counsellor-listing" className="font-semibold text-[#2F43F2] hover:underline">
                  Browse all counsellors
                </Link>
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/counsellor-listing")}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all cursor-pointer"
              style={{ color: ACCENT }}
            >
              View all counsellors <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Long-form, locally-relevant SEO content */}
        <SeoArticle
          eyebrow={`ProCounsel · ${cityData.city}`}
          title={`Career & College Admission Guidance in ${cityData.city}`}
          sections={content.sections}
          faqs={content.faqs}
          accent={ACCENT}
        />

        {/* Nearby cities (internal linking) */}
        <NearbyCities currentSlug={cityData.slug} region={cityData.region} />
      </div>
    </>
  );
}

function CounsellorCard({ c, onClick }: { c: AllCounselor; onClick: () => void }) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  const img = c.photoUrlSmall || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2F43F2&color=fff&size=200`;
  const exp = c.experience ? (c.experience.includes("year") ? c.experience : `${c.experience} yrs`) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-gray-100 bg-white hover:border-[#2F43F2]/30 hover:shadow-md transition-all p-4 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <img loading="lazy" src={img} alt={name} className="h-14 w-14 rounded-full object-cover border border-gray-100" />
        <div className="min-w-0">
          <p className="font-bold text-gray-800 leading-snug truncate">{name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {c.city || "India"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
        {(c.rating || 0) > 0 && (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {(c.rating || 0).toFixed(1)}
          </span>
        )}
        {exp && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {exp}
          </span>
        )}
      </div>
    </button>
  );
}

function NearbyCities({ currentSlug, region }: { currentSlug: string; region: string }) {
  const cities = useMemo(() => {
    const sameRegion = COUNSELLING_CITIES.filter((c) => c.region === region && c.slug !== currentSlug);
    const others = COUNSELLING_CITIES.filter((c) => c.region !== region && c.slug !== currentSlug);
    return [...sameRegion, ...others].slice(0, 8);
  }, [currentSlug, region]);

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} />
        <h2 className="font-bold text-[20px] md:text-[24px] text-[#0E1629]">Counselling in other cities</h2>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {cities.map((c) => (
          <Link
            key={c.slug}
            to={`/counselling/${c.slug}`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2] transition-colors"
          >
            Counselling in {c.city}
          </Link>
        ))}
      </div>
    </section>
  );
}
