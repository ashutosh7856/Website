import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Globe2,
  GraduationCap,
  Loader2,
  Plane,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import PageSEO from "@/components/SEO/PageSEO";
import AdSenseUnit from "@/components/ads/AdSenseUnit";
import { createForeignStudent } from "@/api/foreignStudent";
import {
  predictStudyAbroadColleges,
  type StudyAbroadPrediction,
  type StudyAbroadPredictorInput,
} from "@/api/studyAbroadPredictor";
import { getTrackedSource } from "@/lib/leadSource";

const SITE = "https://procounsel.co.in";
const COUNTRIES = [
  { name: "United States", short: "USA", flag: "🇺🇸" },
  { name: "United Kingdom", short: "UK", flag: "🇬🇧" },
  { name: "Canada", short: "Canada", flag: "🇨🇦" },
  { name: "Australia", short: "Australia", flag: "🇦🇺" },
  { name: "Germany", short: "Germany", flag: "🇩🇪" },
  { name: "Ireland", short: "Ireland", flag: "🇮🇪" },
  { name: "New Zealand", short: "New Zealand", flag: "🇳🇿" },
  { name: "United Arab Emirates", short: "UAE", flag: "🇦🇪" },
] as const;

const STUDY_LEVELS = ["Bachelors", "Masters", "MBA", "PhD"] as const;
const SCORE_SCALES = ["Percentage", "CGPA out of 10", "GPA out of 4"] as const;
const ENGLISH_TESTS = ["Not taken", "IELTS", "TOEFL", "PTE", "Duolingo"] as const;
const BUDGETS = [
  "Under INR 15 lakh per year",
  "INR 15-25 lakh per year",
  "INR 25-40 lakh per year",
  "Above INR 40 lakh per year",
] as const;
const INTAKES = ["January 2027", "May 2027", "September 2027", "January 2028", "Flexible"] as const;

const FAQS = [
  {
    q: "How does the Study Abroad College Predictor work?",
    a: "It compares your study level, academic score, backlogs, English-test status, budget, intake and preferred countries to prepare an indicative country and university shortlist. The result is a planning aid, not an admission decision.",
  },
  {
    q: "Are the university matches guaranteed?",
    a: "No. Universities review complete applications and requirements change by course and intake. Verify every course, fee, deadline and eligibility rule on the university's official website before applying.",
  },
  {
    q: "Can I use the predictor before taking IELTS or another English test?",
    a: "Yes. Select Not taken and the report will treat your language score as a next step. A final shortlist should be reviewed again after you receive the required test score.",
  },
  {
    q: "What do Ambitious, Target and Safer mean?",
    a: "Ambitious options may require a stronger profile, Target options broadly align with the details entered, and Safer options may have a more achievable academic fit. Safer never means guaranteed.",
  },
];

const initialProfile: StudyAbroadPredictorInput = {
  studyLevel: "Masters",
  fieldOfStudy: "",
  currentQualification: "Bachelor's degree",
  score: 0,
  scoreScale: "Percentage",
  backlogs: 0,
  englishTest: "Not taken",
  englishScore: "",
  annualBudget: "INR 15-25 lakh per year",
  intake: "September 2027",
  preferredCountries: [],
  workExperienceYears: 0,
};
export default function StudyAbroadPredictor() {
  const [profile, setProfile] = useState<StudyAbroadPredictorInput>(initialProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyAbroadPrediction | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const leadCaptured = useRef(false);

  const maxScore = profile.scoreScale === "Percentage" ? 100 : profile.scoreScale === "CGPA out of 10" ? 10 : 4;
  const scoreLabel = profile.scoreScale === "Percentage" ? "Percentage" : profile.scoreScale;
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);

  const canSubmit = useMemo(
    () =>
      profile.fieldOfStudy.trim().length >= 2 &&
      profile.currentQualification.trim().length >= 2 &&
      profile.score > 0 && profile.score <= maxScore &&
      profile.preferredCountries.length > 0 &&
      name.trim().length >= 2 && phoneDigits.length === 10 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()),
    [email, maxScore, name, phoneDigits, profile],
  );

  const update = <K extends keyof StudyAbroadPredictorInput>(key: K, value: StudyAbroadPredictorInput[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const toggleCountry = (country: string) => {
    setProfile((current) => ({
      ...current,
      preferredCountries: current.preferredCountries.includes(country)
        ? current.preferredCountries.filter((item) => item !== country)
        : current.preferredCountries.length < 5
          ? [...current.preferredCountries, country]
          : current.preferredCountries,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Complete your profile and contact details to see your matches.");
      return;
    }

    setLoading(true);
    setResult(null);
    const { source, landingPage } = getTrackedSource();
    const remarks = [
      "AI Study Abroad College Predictor",
      `Source: ${source || "direct"}`,
      `Landing page: ${landingPage || "/study-abroad/university-predictor"}`,
      `Level: ${profile.studyLevel}`,
      `Field: ${profile.fieldOfStudy.trim()}`,
      `Academics: ${profile.score} ${profile.scoreScale}`,
      `Backlogs: ${profile.backlogs}`,
      `English test: ${profile.englishTest}${profile.englishScore ? ` ${profile.englishScore}` : ""}`,
      `Budget: ${profile.annualBudget}`,
      `Intake: ${profile.intake}`,
      `Countries: ${profile.preferredCountries.join(", ")}`,
    ].join(". ");

    const leadRequest = leadCaptured.current
      ? Promise.resolve(true)
      : createForeignStudent({
          name: name.trim(),
          phone: phoneDigits,
          email: email.trim(),
          qualification: profile.currentQualification.trim(),
          interestedCountry: profile.preferredCountries.join(", "),
          startYear: profile.intake.match(/\d{4}/)?.[0] || "2027",
          remarks,
        })
          .then(() => {
            leadCaptured.current = true;
            return true;
          })
          .catch((error) => {
            console.error("[ProCounsel] Study abroad predictor lead failed", error);
            return false;
          });

    try {
      const [prediction, saved] = await Promise.all([
        predictStudyAbroadColleges(profile),
        leadRequest,
      ]);
      setResult(prediction);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "study_abroad_predictor_completed",
        study_level: profile.studyLevel,
        intake: profile.intake,
        countries: profile.preferredCountries.join("|"),
        lead_saved: saved,
      });
      if (saved && typeof window.fbq === "function") {
        window.fbq("track", "Lead", { content_name: "Study Abroad College Predictor" });
      }
      if (!saved) toast.error("Your matches are ready, but the callback request was not saved. Please retry later.");
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your matches.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ProCounsel Study Abroad College Predictor",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: `${SITE}/study-abroad/university-predictor`,
      description: "Free AI-assisted university and country matching tool for Indian students planning to study abroad.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Study Abroad", item: `${SITE}/study-abroad` },
        { "@type": "ListItem", position: 3, name: "University Predictor", item: `${SITE}/study-abroad/university-predictor` },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title="Study Abroad College Predictor 2027 – AI University Match"
        description="Use our free Study Abroad College Predictor to find country and university matches based on your marks, budget, course, English test and 2027 intake."
        canonical="/study-abroad/university-predictor"
        keywords="study abroad college predictor, university predictor, university finder for Indian students, study abroad eligibility, AI university matching, colleges abroad"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-[#F4F6FC] pb-16 text-[#0E1629]">
        <section className="relative overflow-hidden bg-[#08142C]">
          <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_15%_15%,#2F43F2_0,transparent_36%),radial-gradient(circle_at_85%_80%,#13B8A6_0,transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-10 xl:px-12">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <Link to="/" className="hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
              <Link to="/study-abroad" className="hover:text-white">Study Abroad</Link><ChevronRight className="h-3.5 w-3.5" />
              <span className="text-white">College Predictor</span>
            </div>
            <div className="mt-9 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> AI-assisted · Free profile match
                </span>
                <h1 className="mt-5 max-w-3xl font-[Poppins] text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-[48px]">
                  Study Abroad College Predictor
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-300 sm:text-base">
                  Turn your marks, budget and target intake into a practical country and university shortlist—split into ambitious, target and safer options.
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                {[['8', 'countries'], ['6', 'matches'], ['Free', 'to use']].map(([value, label]) => (
                  <div key={label} className="px-3 text-center">
                    <p className="text-xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-1 grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-10 xl:px-12">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,22,41,0.08)]">
            <FormSection icon={<GraduationCap />} number="01" title="Your academic profile" subtitle="Tell us where you are now and what you want to study.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Study level">
                  <select value={profile.studyLevel} onChange={(e) => update("studyLevel", e.target.value as StudyAbroadPredictorInput["studyLevel"])} className={inputClass}>
                    {STUDY_LEVELS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Field of study">
                  <input value={profile.fieldOfStudy} onChange={(e) => update("fieldOfStudy", e.target.value)} className={inputClass} placeholder="e.g. Computer Science" maxLength={100} />
                </Field>
                <Field label="Current qualification">
                  <input value={profile.currentQualification} onChange={(e) => update("currentQualification", e.target.value)} className={inputClass} placeholder="e.g. B.Tech in IT" maxLength={120} />
                </Field>
                <div className="grid grid-cols-[1fr_1.35fr] gap-3">
                  <Field label={scoreLabel}>
                    <input type="number" min="0" max={maxScore} step="0.01" value={profile.score || ""} onChange={(e) => update("score", Number(e.target.value))} className={inputClass} placeholder={String(maxScore)} />
                  </Field>
                  <Field label="Scoring system">
                    <select value={profile.scoreScale} onChange={(e) => { update("scoreScale", e.target.value as StudyAbroadPredictorInput["scoreScale"]); update("score", 0); }} className={inputClass}>
                      {SCORE_SCALES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Active backlogs">
                  <input type="number" min="0" max="30" value={profile.backlogs} onChange={(e) => update("backlogs", Number(e.target.value))} className={inputClass} />
                </Field>
                <Field label="Work experience (years)">
                  <input type="number" min="0" max="40" step="0.5" value={profile.workExperienceYears} onChange={(e) => update("workExperienceYears", Number(e.target.value))} className={inputClass} />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<Globe2 />} number="02" title="Destination and intake" subtitle="Choose up to five countries you genuinely want to compare.">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {COUNTRIES.map((country) => {
                  const selected = profile.preferredCountries.includes(country.name);
                  return (
                    <button key={country.name} type="button" onClick={() => toggleCountry(country.name)} aria-pressed={selected} className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 text-left text-sm transition ${selected ? "border-[#2F43F2] bg-[#EEF1FF] text-[#2135D5] shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
                      <span className="text-lg">{country.flag}</span><span className="font-medium">{country.short}</span>{selected && <Check className="ml-auto h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">{profile.preferredCountries.length}/5 selected</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Target intake">
                  <select value={profile.intake} onChange={(e) => update("intake", e.target.value as StudyAbroadPredictorInput["intake"])} className={inputClass}>
                    {INTAKES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Annual tuition budget">
                  <select value={profile.annualBudget} onChange={(e) => update("annualBudget", e.target.value as StudyAbroadPredictorInput["annualBudget"])} className={inputClass}>
                    {BUDGETS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<BookOpen />} number="03" title="Tests and contact" subtitle="Your report and counselling follow-up are tied to these details.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="English test">
                  <select value={profile.englishTest} onChange={(e) => update("englishTest", e.target.value as StudyAbroadPredictorInput["englishTest"])} className={inputClass}>
                    {ENGLISH_TESTS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Test score (optional)">
                  <input value={profile.englishScore} onChange={(e) => update("englishScore", e.target.value)} disabled={profile.englishTest === "Not taken"} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`} placeholder="e.g. 7.5" maxLength={30} />
                </Field>
                <Field label="Full name">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" placeholder="Your name" maxLength={80} />
                </Field>
                <Field label="Mobile number">
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ -]/g, ""))} className={inputClass} inputMode="tel" autoComplete="tel" placeholder="10-digit number" maxLength={14} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Email address">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" placeholder="you@example.com" maxLength={120} />
                  </Field>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-[#F7F8FD] p-4 text-xs leading-5 text-slate-500">
                By generating matches, you agree that ProCounsel may contact you about this study-abroad enquiry. Your contact details are sent to ProCounsel’s study-abroad desk, not to the AI model.
              </div>
              <button type="submit" disabled={loading} className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#2F43F2] px-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(47,67,242,0.25)] transition hover:bg-[#2438DD] disabled:cursor-not-allowed disabled:opacity-65">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Building your shortlist…</> : <><Sparkles className="h-5 w-5" /> Find my university matches</>}
              </button>
            </FormSection>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#2F43F2]">What you receive</p>
              <ul className="mt-5 space-y-4">
                {[
                  [Target, "6 university matches", "Two ambitious, two target and two safer options"],
                  [Globe2, "Country fit comparison", "Budget reality and the main watch-out for each"],
                  [Clock3, "Four next actions", "The most useful work to do before applications"],
                  [ShieldCheck, "No false guarantee", "Every result stays an estimate until officially verified"],
                ].map(([Icon, title, text]) => (
                  <li key={String(title)} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2F43F2]"><Icon className="h-4.5 w-4.5" /></span>
                    <div><p className="text-sm font-semibold">{String(title)}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{String(text)}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#0E1629] p-6 text-white">
              <p className="text-lg font-semibold">A shortlist is the beginning.</p>
              <p className="mt-2 text-sm leading-6 text-white/65">A counsellor can verify course availability, entry rules, deadlines and the documents your exact profile needs.</p>
              <Link to="/study-abroad" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#AEB8FF]">Explore free counselling <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>
        </section>

        {result && <PredictionResults ref={resultRef} result={result} onReset={reset} />}

        <AdSenseUnit />

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2F43F2]">How to use the result</p>
              <h2 className="mt-3 font-[Poppins] text-2xl font-semibold sm:text-3xl">A realistic first shortlist—not an admission promise</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">The predictor gives you a focused place to begin. University decisions depend on the complete application, course capacity, prerequisites, documents and current intake rules. Treat every suggested institution as a research candidate and verify it on official sources.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Check the course", "Confirm that the exact program is offered in your intake and matches your academic background."],
                ["02", "Verify the numbers", "Review current tuition, living costs, scholarships and deposit requirements on official pages."],
                ["03", "Build the application", "Prepare tests, transcripts, recommendations and a statement that reflects your real profile."],
              ].map(([number, title, body]) => (
                <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-xs font-bold text-[#2F43F2]">{number}</span><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
          <h2 className="text-center font-[Poppins] text-2xl font-semibold">Study Abroad Predictor FAQs</h2>
          <div className="mt-7 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            {FAQS.map((faq) => <details key={faq.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{faq.q}<span className="text-[#2F43F2] group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{faq.a}</p></details>)}
          </div>
        </section>
      </main>
    </>
  );
}

const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#0E1629] outline-none transition placeholder:text-slate-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

function FormSection({ icon, number, title, subtitle, children }: { icon: React.ReactNode; number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="border-b border-slate-100 p-5 last:border-b-0 sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2F43F2] [&_svg]:h-5 [&_svg]:w-5">{icon}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Step {number}</p><h2 className="mt-0.5 text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div></div>{children}</section>;
}

const PredictionResults = ({ result, onReset, ref }: { result: StudyAbroadPrediction; onReset: () => void; ref: React.Ref<HTMLDivElement> }) => {
  const bandStyle = { Ambitious: "bg-amber-50 text-amber-700 ring-amber-200", Target: "bg-blue-50 text-blue-700 ring-blue-200", Safer: "bg-emerald-50 text-emerald-700 ring-emerald-200" } as const;
  return (
    <section ref={ref} className="scroll-mt-24 border-y border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex flex-col gap-6 rounded-3xl bg-[#0E1629] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div><span className="inline-flex items-center gap-2 text-xs font-semibold text-[#AEB8FF]"><Sparkles className="h-4 w-4" /> Your AI-assisted match report</span><h2 className="mt-3 max-w-3xl font-[Poppins] text-2xl font-semibold sm:text-3xl">{result.profileSummary}</h2><p className="mt-3 text-xs text-white/50">Confidence: {result.confidence} · Generated {new Date(result.generatedAt).toLocaleDateString("en-IN")}</p></div>
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 border-white/10 bg-white/[0.06]"><span className="text-3xl font-bold">{result.readinessScore}</span><span className="text-[10px] text-white/55">readiness</span></div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {result.countryMatches.map((item) => <article key={item.country} className="rounded-2xl border border-slate-200 bg-[#FAFBFE] p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{item.country}</h3><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#2F43F2] ring-1 ring-slate-200">{item.fit}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{item.reason}</p><div className="mt-5 space-y-3 border-t border-slate-200 pt-4"><p className="flex gap-2 text-xs leading-5 text-slate-600"><CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item.budgetReality}</p><p className="flex gap-2 text-xs leading-5 text-slate-600"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{item.watchOut}</p></div></article>)}
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#2F43F2]">University shortlist</p><h2 className="mt-2 font-[Poppins] text-2xl font-semibold">Your six initial matches</h2></div><button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Edit profile</button></div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {result.universityMatches.map((university) => <article key={`${university.name}-${university.fitBand}`} className="rounded-2xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(14,22,41,0.04)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-slate-400">{university.country}</p><h3 className="mt-1 text-lg font-semibold">{university.name}</h3><p className="mt-1 text-sm font-medium text-[#2F43F2]">{university.suggestedProgram}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ring-1 ${bandStyle[university.fitBand]}`}>{university.fitBand}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{university.whyItFits}</p><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Budget fit</p><p className="mt-1 text-xs font-semibold leading-5">{university.budgetFit}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Check before applying</p><p className="mt-1 text-xs leading-5 text-slate-600">{university.admissionWatchOut}</p></div></div></article>)}
        </div>

        <div className="mt-10 grid gap-6 rounded-2xl border border-[#2F43F2]/15 bg-[#F5F6FF] p-6 lg:grid-cols-[1fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#2F43F2]">Your next four actions</p><p className="mt-3 text-sm leading-6 text-slate-600">{result.importantNote}</p></div><ol className="grid gap-3 sm:grid-cols-2">{result.nextSteps.map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-white p-4 text-sm leading-5 text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2F43F2] text-[10px] font-bold text-white">{index + 1}</span>{step}</li>)}</ol></div>
        <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#2F43F2] p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><h3 className="text-xl font-semibold">Verify this shortlist with a study-abroad counsellor</h3><p className="mt-2 text-sm text-white/75">Your enquiry is already with the study-abroad desk. They can check the current course and intake details.</p></div><Link to="/study-abroad" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2F43F2]">View counselling support <Plane className="h-4 w-4" /></Link></div>
      </div>
    </section>
  );
};
