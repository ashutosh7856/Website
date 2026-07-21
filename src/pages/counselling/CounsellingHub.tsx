import { Link, useNavigate } from "react-router-dom";
import { MapPin, ArrowRight, Users, Stethoscope, GraduationCap } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { COUNSELLING_CITIES } from "@/lib/counsellingCities";

const ACCENT = "#2F43F2";

const REGION_ORDER = ["North", "South", "West", "East", "Central", "Northeast"] as const;

export default function CounsellingHub() {
  const navigate = useNavigate();

  const byRegion = REGION_ORDER.map((region) => ({
    region,
    cities: COUNSELLING_CITIES.filter((c) => c.region === region).sort((a, b) =>
      a.city.localeCompare(b.city),
    ),
  })).filter((g) => g.cities.length > 0);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "College admission & career counselling",
      provider: { "@type": "Organization", name: "ProCounsel", url: "https://www.procounsel.co.in" },
      areaServed: { "@type": "Country", name: "India" },
      description:
        "Expert college admission and career counselling across India — connect with verified counsellors and college seniors for JEE, NEET, CUET, state exams, study abroad and course selection.",
      url: "https://www.procounsel.co.in/counselling",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.procounsel.co.in/" },
        { "@type": "ListItem", position: 2, name: "Counselling", item: "https://www.procounsel.co.in/counselling" },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title="College Admission Counselling in India – City-wise Career Guidance"
        description="Find expert college admission and career counselling in your city across India. Connect with verified counsellors and college seniors for JEE, NEET, CUET, state exams, study abroad and course selection — online, one-on-one."
        canonical="/counselling"
        keywords="college admission counselling in India, career counselling near me, education consultant India, career counsellor, study abroad counselling, college admission guidance"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F6F8FE] pb-4">
        <div className="w-full border-b border-[#E3E8F4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">Counselling</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#0E1629]">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#2F43F2]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-12 pb-14 text-center">
            <h1 className="text-3xl md:text-[42px] font-bold text-white leading-tight">
              College Admission Counselling in India
            </h1>
            <p className="mt-4 text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Personalised, one-on-one guidance from verified education counsellors and college
              seniors — for college shortlisting, entrance exams, counselling rounds, course
              selection and studying abroad. Pick your city to find counsellors near you.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/counsellor-listing")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0E1629] hover:opacity-95 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                Browse all counsellors
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

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-10 space-y-8">
          {byRegion.map(({ region, cities }) => (
            <div key={region}>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} />
                <h2 className="font-bold text-[18px] md:text-[22px] text-[#0E1629]">
                  {region} India
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/counselling/${c.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3.5 hover:border-[#2F43F2]/30 hover:shadow-md transition-all"
                  >
                    <span>
                      <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <MapPin className="h-3.5 w-3.5 text-[#2F43F2]" />
                        {c.city}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-400">{c.state}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#2F43F2] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-6 w-6 shrink-0" style={{ color: ACCENT }} />
              <div>
                <h2 className="font-bold text-lg text-gray-800">Don't see your city?</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  All ProCounsel counselling is online — connect with the best counsellors from
                  anywhere in India.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/counsellor-listing")}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer hover:opacity-95"
              style={{ backgroundColor: ACCENT }}
            >
              Find a counsellor <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <SeoArticle
          eyebrow="ProCounsel Guide"
          title="Finding the Right College Admission & Career Counselling in India"
          intro="Choosing a college and career is one of the biggest decisions a student makes — and doing it well is far less about collecting information and far more about the right guidance. ProCounsel connects students and parents across India with verified counsellors and real college seniors, so every decision is grounded in honest, personalised advice."
          sections={[
            {
              heading: "Why personalised counselling beats generic advice",
              paragraphs: [
                "The internet has no shortage of college rankings, cut-off lists and opinions. What it can't give you is advice that fits your marks, budget, goals and situation. A good counsellor doesn't hand you a list — they help you think through the decision so the choice is genuinely yours.",
                "That's why students increasingly look for a career counsellor near them rather than relying solely on forums and videos: a one-on-one conversation surfaces things a search never will.",
              ],
            },
            {
              heading: "Counselling for every exam and path",
              paragraphs: [
                "ProCounsel counsellors help with national entrance exams like JEE Main, NEET and CUET, state-level CETs, and every path beyond them — engineering, medical, management, law, design and studying abroad. From shortlisting and eligibility to choice-filling order, quotas and document verification, you get step-by-step support through the entire admission season.",
                "And with ProBuddies, you can pair that professional guidance with honest, ground-level insight from current students at the colleges you're considering.",
              ],
            },
          ]}
          faqs={[
            {
              question: "How do I find college admission counselling near me in India?",
              answer:
                "Pick your city above to see verified counsellors serving your area, or browse all counsellors. Because ProCounsel works online, you can also connect with the best counsellors anywhere in India, regardless of your city.",
            },
            {
              question: "What does a college admission counsellor actually help with?",
              answer:
                "College shortlisting based on your marks and goals, entrance-exam strategy, understanding cut-offs and quotas, choice-filling order, counselling rounds, document verification, and course/career direction — plus study-abroad planning if that's your path.",
            },
            {
              question: "Is online counselling as effective as meeting in person?",
              answer:
                "Yes. Online counselling gives you access to experienced counsellors and college seniors regardless of location, using the same one-on-one sessions and assessments, with far more flexibility around school and coaching.",
            },
          ]}
          accent={ACCENT}
        />
      </div>
    </>
  );
}
