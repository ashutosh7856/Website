import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import { PREDICTORS } from "@/components/predictors/predictorList";

export default function PredictorsHub() {
  return (
    <>
      <PageSEO
        title="Free Rank & College Predictors – NEET, JEE, MHT-CET, CAT | ProCounsel"
        description="Free rank and college predictors for NEET, JEE Main, MHT-CET and CAT, plus a study abroad university predictor. No login needed to see your results."
        canonical="/predictors"
        keywords="college predictor, rank predictor, NEET rank predictor, NEET college predictor, JEE rank predictor, JEE college predictor, MHT CET college predictor, CAT college predictor, study abroad university predictor"
      />

      <div className="min-h-screen bg-[#F6F8FE] pb-16">
        {/* Breadcrumb */}
        <div className="w-full border-b border-[#E3E8F4] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">Predictors</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden bg-[#0E1629]">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#2F43F2]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-12 pb-14 text-center">
            <h1 className="text-3xl md:text-[42px] font-bold text-white leading-tight">
              All Rank & College Predictors
            </h1>
            <p className="mt-3 text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Everything in one place, free and with no login. Pick your exam to estimate
              your rank or find the colleges you can get into, based on past cut-off data.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PREDICTORS.map((p) => (
              <Link
                key={p.path}
                to={p.path}
                className="group block text-left rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2F43F2]/30"
                style={{ background: p.tint }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center justify-center h-12 w-12 rounded-xl text-white"
                    style={{ backgroundColor: p.accent }}
                  >
                    {p.icon}
                  </div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${p.accent}1A`, color: p.accent }}
                  >
                    {p.exam}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-gray-900">{p.title}</h2>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{p.description}</p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                  style={{ color: p.accent }}
                >
                  Open predictor
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
