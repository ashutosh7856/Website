import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import StudyAbroadLeadForm from "@/components/study-abroad/StudyAbroadLeadForm";
import {
  DESTINATIONS,
  PROCESS,
  STUDY_ABROAD_FAQS,
  STUDY_ABROAD_KEYWORDS,
  HIGHLIGHTS,
  STUDY_ABROAD_SECTIONS,
  STUDY_ABROAD_UPDATED,
  type Destination,
} from "@/lib/studyAbroad";

const ACCENT = "#2F43F2";
const INK = "#0E1629";
/** The yellow the site's own illustrations use — here it marks your shortlist. */
const MARK = "#F5B93E";
const SITE = "https://procounsel.co.in";

const TITLE = "Study Abroad Consultants in India";
const DESCRIPTION =
  "Free counselling for studying abroad in the USA, UK, Canada, Australia, Germany, Ireland, New Zealand and Dubai. Get help with course shortlisting, funding, visas and departure.";

/**
 * /study-abroad — the lead-generation landing page for the overseas education
 * desk, and the destination for paid search traffic.
 *
 * The organising idea is a comparison board, not a card grid: a student
 * choosing between eight countries is comparing four numbers across them, and
 * rows on one surface do that where eight separate cards cannot. Ticking a row
 * adds that country to the single form beside it, so the thing you do while
 * reading is also the thing that submits the enquiry.
 *
 * All content is static (src/lib/studyAbroad.ts) and nothing is fetched, so the
 * page prerenders with its full copy and ranks on its own rather than on an API
 * that is unreachable at build time.
 */
export default function StudyAbroad() {
  const [selected, setSelected] = useState<string[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const formRef = useRef<HTMLElement | null>(null);
  const [formOnScreen, setFormOnScreen] = useState(true);

  /**
   * Phones are most of this page's traffic and the form sits at the top, so
   * once a reader has scrolled past it there is nothing on screen to act on.
   * This watches the form and turns on a floating button whenever it is out of
   * view — the desktop keeps the form itself in a sticky rail instead.
   */
  useEffect(() => {
    const node = formRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormOnScreen(entry.isIntersecting),
      { rootMargin: "-80px 0px -120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Study Abroad Counselling",
      name: "Study abroad counselling for Indian students",
      provider: { "@type": "Organization", name: "ProCounsel", url: SITE },
      areaServed: { "@type": "Country", name: "India" },
      description: DESCRIPTION,
      url: `${SITE}/study-abroad`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "Free first profile review call with a study abroad counsellor",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Study destinations",
        itemListElement: DESTINATIONS.map((d) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: `Study in ${d.name}` },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: STUDY_ABROAD_FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Study Abroad", item: `${SITE}/study-abroad` },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title={TITLE}
        description={DESCRIPTION}
        canonical="/study-abroad"
        keywords={STUDY_ABROAD_KEYWORDS}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F6F8FE]">
        <div className="mx-auto max-w-7xl px-5 pt-4 sm:px-6 lg:px-10 xl:px-12">
          <p className="text-[13px] text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-800">Study Abroad</span>
          </p>
        </div>

        {/* The board and the form it feeds share one grid so both are on screen
            together on desktop. On mobile the form follows the headline, where
            paid traffic needs it. */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-12 gap-y-10 px-5 pt-8 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_386px] lg:px-10 xl:px-12">
          <header>
            <h1
              className="max-w-xl font-[Poppins] text-[27px] font-semibold leading-[1.2] tracking-[-0.015em] md:text-[36px]"
              style={{ color: INK }}
            >
              Study abroad from India with{" "}
              <span className="study-free-highlight">free 1:1 counselling</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-gray-600 md:text-[16px]">
              Get a realistic country and university shortlist based on your marks, budget and
              target intake. Your first 1:1 counselling session is{" "}
              <span className="study-free-highlight">completely free</span>.
            </p>
            <Link
              to="/study-abroad/university-predictor"
              className="mt-6 inline-flex items-center rounded-xl bg-[#2F43F2] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(47,67,242,0.22)] transition-colors hover:bg-[#2438DD]"
            >
              Try the free college predictor
            </Link>

            <dl className="mt-7 grid max-w-xl grid-cols-3 gap-x-4 gap-y-6 border-t border-gray-200/80 pt-6 sm:gap-x-6">
              {HIGHLIGHTS.map((h) => (
                <div key={h.label}>
                  <dt className="sr-only">{h.label}</dt>
                  <dd>
                    <span
                      className={`block font-[Poppins] text-[22px] font-semibold leading-none tracking-[-0.01em] md:text-[24px] ${h.value === "Free" ? "study-free-highlight" : ""}`}
                      style={{ color: h.value === "Free" ? undefined : INK }}
                    >
                      {h.value}
                    </span>
                    <span className="mt-2 block text-[12px] leading-snug text-gray-500 md:text-[12.5px]">
                      {h.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </header>

          <aside ref={formRef} className="lg:sticky lg:top-24 lg:row-span-2 lg:self-start">
            <StudyAbroadLeadForm
              id="lead-form"
              selected={selected}
              onToggle={toggle}
              onBooked={() => setBooked(true)}
            />
          </aside>

          <section aria-labelledby="board-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2
                id="board-heading"
                className="font-[Poppins] text-[21px] font-semibold tracking-[-0.01em] md:text-[25px]"
                style={{ color: INK }}
              >
                Compare the eight destinations
              </h2>
              <p className="text-[12.5px] text-gray-400">
                Indicative ranges for {STUDY_ABROAD_UPDATED}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
              {/* Column headings — desktop only; on mobile each value labels
                  itself, which is what the row markup below does. */}
              <div className="hidden border-b border-gray-200/80 bg-[#FBFCFF] px-5 py-3 text-[11.5px] font-medium text-gray-400 md:grid md:grid-cols-[minmax(0,2.05fr)_minmax(0,1.4fr)_minmax(0,0.95fr)_minmax(0,1.05fr)_28px] md:gap-x-6">
                <span>Destination</span>
                <span>Tuition a year</span>
                <span>Intakes</span>
                <span>Stay back after</span>
                <span className="sr-only">Details</span>
              </div>

              <ul className="divide-y divide-gray-200/70">
                {DESTINATIONS.map((d) => (
                  <DestinationRow
                    key={d.slug}
                    destination={d}
                    checked={selected.includes(d.slug)}
                    onCheck={() => toggle(d.slug)}
                    open={openRow === d.slug}
                    onOpen={() => setOpenRow((cur) => (cur === d.slug ? null : d.slug))}
                  />
                ))}
              </ul>
            </div>

            <p className="mt-3 text-[12.5px] leading-relaxed text-gray-500">
              Fees and visa rules change every year and per course. Your counsellor confirms the
              current figures for the programmes on your shortlist.
            </p>
          </section>
        </div>

        {/* The engagement as a timeline. One rail, no boxes — the sequence is
            the point, so the design carries it rather than eight tiles. */}
        <section
          aria-labelledby="itinerary-heading"
          className="border-y border-gray-200/70 bg-white"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 gap-y-10 px-5 py-16 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-10 xl:px-12">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2
                id="itinerary-heading"
                className="font-[Poppins] text-[24px] font-semibold leading-tight tracking-[-0.01em] md:text-[30px]"
                style={{ color: INK }}
              >
                How the year runs
              </h2>
              <p className="mt-4 text-[14.5px] leading-relaxed text-gray-600">
                From the first call to the flight, and who does what at each point. One
                counsellor stays with you the whole way.
              </p>
              <a
                href="#lead-form"
                className="mt-6 inline-block text-[14px] font-semibold hover:underline"
                style={{ color: ACCENT }}
              >
                Book a free session
              </a>
            </div>

            <ol className="relative border-l border-gray-200 pl-8 sm:pl-10">
              {PROCESS.map((step, i) => (
                <li key={step.title} className={i === PROCESS.length - 1 ? "" : "pb-11"}>
                  <span
                    aria-hidden="true"
                    className="absolute -left-[13px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-[11.5px] font-semibold"
                    style={{ color: ACCENT, boxShadow: `inset 0 0 0 1.5px ${ACCENT}` }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[12.5px] font-medium tracking-[0.01em] text-gray-400">
                    {step.when}
                  </p>
                  <h3
                    className="mt-1.5 font-[Poppins] text-[18px] font-semibold md:text-[20px]"
                    style={{ color: INK }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.7] text-gray-600">
                    {step.body}
                  </p>
                  <ul className="mt-4 max-w-2xl space-y-2">
                    {step.works.map((w) => (
                      <li key={w} className="relative pl-5 text-[13.5px] leading-relaxed text-gray-500">
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-[9px] h-[5px] w-[5px] rounded-full"
                          style={{ backgroundColor: MARK }}
                        />
                        {w}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why us — three columns divided by hairlines rather than three cards. */}
        <section
          aria-labelledby="why-heading"
          className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-10 xl:px-12"
        >
          <h2
            id="why-heading"
            className="font-[Poppins] text-[24px] font-semibold tracking-[-0.01em] md:text-[30px]"
            style={{ color: INK }}
          >
            Why students plan it here
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-10 md:divide-x md:divide-gray-200/80">
            <div className="md:pr-10">
              <h3 className="font-[Poppins] text-[16.5px] font-semibold" style={{ color: INK }}>
                Counsellors you can check first
              </h3>
              <p className="mt-2.5 text-[14px] leading-[1.7] text-gray-600">
                Every counsellor has a public profile with their experience, specialisation and
                reviews.{" "}
                <Link to="/counsellor-listing" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                  Browse counsellors
                </Link>{" "}
                before you speak to one.
              </p>
            </div>
            <div className="md:px-10">
              <h3 className="font-[Poppins] text-[16.5px] font-semibold" style={{ color: INK }}>
                Students who are already there
              </h3>
              <p className="mt-2.5 text-[14px] leading-[1.7] text-gray-600">
                ProBuddies are current students who answer what a brochure will not.{" "}
                <Link to="/pro-buddies" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                  Talk to a ProBuddy
                </Link>{" "}
                about the campus you are considering.
              </p>
            </div>
            <div className="md:pl-10">
              <h3 className="font-[Poppins] text-[16.5px] font-semibold" style={{ color: INK }}>
                Advice, not a sales pitch
              </h3>
              <p className="mt-2.5 text-[14px] leading-[1.7] text-gray-600">
                We are not paid to fill one university's seats. If India is the better answer for
                your budget, our{" "}
                <Link to="/counselling" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                  admission counselling
                </Link>{" "}
                covers that too.
              </p>
            </div>
          </div>
        </section>

        <SeoArticle
          title="A practical guide to studying abroad from India"
          intro="What it costs, how the intakes work, which tests you actually need, and what the visa file is really testing. Written for students deciding this year."
          sections={STUDY_ABROAD_SECTIONS}
          faqs={STUDY_ABROAD_FAQS}
          accent={ACCENT}
          eyebrow="Study Abroad Guide"
        />

        {/* Closing call to action — an anchor back to the one form on the page,
            not a second copy of it. */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-10 xl:px-12">
          <div
            className="flex flex-col items-start gap-7 rounded-2xl px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12"
            style={{ backgroundColor: INK }}
          >
            <div className="max-w-lg">
              <h2 className="font-[Poppins] text-[23px] font-semibold leading-tight text-white md:text-[28px]">
                Still comparing countries?
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                Tell us your marks, budget and intake. A counsellor will tell you which two of the
                eight are worth your applications, and what the deadlines look like from here.
              </p>
            </div>
            <a
              href="#lead-form"
              className="inline-flex shrink-0 items-center justify-center rounded-xl px-7 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Book my free session
            </a>
          </div>
        </section>

        {/* Internal links out, so the page is not a dead end for a crawler. */}
        <nav
          aria-label="Related pages"
          className="mx-auto max-w-7xl border-t border-gray-200/70 px-5 py-10 sm:px-6 lg:px-10 xl:px-12"
        >
          <h2 className="mb-4 font-[Poppins] text-[15px] font-semibold" style={{ color: INK }}>
            Also on ProCounsel
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {[
              { to: "/study-abroad/university-predictor", label: "Study Abroad College Predictor" },
              { to: "/counselling", label: "Admission counselling" },
              { to: "/engineering-counselling", label: "Engineering counselling" },
              { to: "/medical-counselling", label: "Medical counselling" },
              { to: "/mba-counselling", label: "MBA counselling" },
              { to: "/career-counselling", label: "Career counselling" },
              { to: "/colleges", label: "Colleges in India" },
              { to: "/predictors", label: "Rank and college predictors" },
              { to: "/admissions/blogs", label: "Admission blogs" },
              { to: "/mettle", label: "Mettle career test" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13.5px] text-gray-600 underline-offset-4 transition-colors hover:text-[#2F43F2] hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile only: the chatbot bubble owns the bottom-right corner, so this
          sits bottom-left and clears it. Gone once the form is on screen or the
          session is booked — a call to action for something already done is
          just clutter. */}
      {!booked && !formOnScreen && (
        <a
          href="#lead-form"
          className="fixed bottom-4 left-4 z-40 inline-flex items-center rounded-full px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(47,67,242,0.45)] lg:hidden"
          style={{ backgroundColor: ACCENT }}
        >
          Book a free session
        </a>
      )}
    </>
  );
}

interface RowProps {
  destination: Destination;
  checked: boolean;
  onCheck: () => void;
  open: boolean;
  onOpen: () => void;
}

/**
 * One line of the board. The checkbox is the page's country picker — it writes
 * into the same selection the form reads — and the chevron opens the detail
 * that does not belong in a comparison row.
 */
function DestinationRow({ destination: d, checked, onCheck, open, onOpen }: RowProps) {
  const detailId = `detail-${d.slug}`;

  return (
    <li className={checked ? "bg-[#FFFCF4]" : ""}>
      <div className="relative px-5 py-[18px] md:grid md:grid-cols-[minmax(0,2.05fr)_minmax(0,1.4fr)_minmax(0,0.95fr)_minmax(0,1.05fr)_28px] md:items-start md:gap-x-6">
        {/* Marks the row when it is on your shortlist. */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-[3px] transition-opacity"
          style={{ backgroundColor: MARK, opacity: checked ? 1 : 0 }}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={checked} onChange={onCheck} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={`mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2F43F2]/40 ${
                checked ? "border-transparent" : "border-gray-300 bg-white"
              }`}
              style={checked ? { backgroundColor: ACCENT } : undefined}
            >
              {checked && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M2 6.2 4.7 9 10 3.2"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-[16px] leading-none" aria-hidden="true">
                  {d.flag}
                </span>
                <span
                  className="font-[Poppins] text-[15.5px] font-semibold leading-snug"
                  style={{ color: INK }}
                >
                  {d.name}
                </span>
              </span>
              <span className="mt-1 block text-[12.5px] leading-snug text-gray-500">
                {d.headline}
              </span>
            </span>
          </label>
        </div>

        <RowValue label="Tuition" value={d.tuition} note={d.tuitionNote} nowrap />

        <RowValue label="Intakes">
          <span className="flex flex-wrap gap-1">
            {d.intakes.map((month) => (
              <span
                key={month}
                className="rounded-md bg-[#F1F4FD] px-2 py-[3px] text-[12px] font-medium text-[#48507A] tabular-nums"
              >
                {month}
              </span>
            ))}
          </span>
        </RowValue>

        <RowValue label="Stay back" value={d.stayBack} note={d.stayBackNote} desktopOnly />

        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          aria-controls={detailId}
          className="mt-2 -ml-1 flex min-h-[44px] cursor-pointer items-center gap-1.5 px-1 text-[13px] font-medium text-gray-500 transition-colors hover:text-[#2F43F2] md:mt-0 md:ml-0 md:h-7 md:min-h-0 md:w-7 md:justify-center md:gap-0 md:rounded-full md:px-0 md:hover:bg-[#F6F8FE]"
        >
          <span className="md:sr-only">{open ? "Hide details" : "Show details"}</span>
          <span className="sr-only"> for {d.name}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Always in the DOM so a crawler reads it; hidden until asked for. */}
      <div id={detailId} hidden={!open} className="px-5 pb-5 md:pl-[42px]">
        <h3
          className="border-t border-gray-200/70 pt-4 font-[Poppins] text-[14px] font-semibold"
          style={{ color: INK }}
        >
          Study in {d.name}
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
          <div className="md:hidden">
            <dt className="text-[12px] text-gray-400">Stay back after</dt>
            <dd className="mt-0.5 text-[13.5px] text-gray-700">
              {d.stayBack}. {d.stayBackNote}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-gray-400">Living costs a year</dt>
            <dd className="mt-0.5 text-[13.5px] text-gray-700">{d.living}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-gray-400">Tests you will need</dt>
            <dd className="mt-0.5 text-[13.5px] text-gray-700">{d.tests}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12px] text-gray-400">Work rights after you graduate</dt>
            <dd className="mt-0.5 max-w-3xl text-[13.5px] leading-relaxed text-gray-700">
              {d.workRights}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12px] text-gray-400">Worth knowing</dt>
            <dd className="mt-0.5 max-w-3xl text-[13.5px] leading-relaxed text-gray-700">
              {d.watchOut}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12px] text-gray-400">What Indian students study there</dt>
            <dd className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-gray-600">
              {d.popular.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

function RowValue({
  label,
  value,
  note,
  children,
  nowrap = false,
  desktopOnly = false,
}: {
  label: string;
  /** The figure. Set on the numeric columns; `children` covers the rest. */
  value?: string;
  /** The caveat under it — a phrase, not a sentence. */
  note?: string;
  /** Only for figures that must never break mid-number, like a fee range. */
  nowrap?: boolean;
  children?: React.ReactNode;
  /** Hidden on phones, where it is shown in the detail panel instead. */
  desktopOnly?: boolean;
}) {
  return (
    <div
      className={`mt-2.5 flex gap-3 md:mt-0 md:block ${desktopOnly ? "hidden md:block" : ""}`}
    >
      <span className="w-[72px] shrink-0 pt-[1px] text-[12.5px] text-gray-400 md:hidden">
        {label}
      </span>
      <span className="min-w-0">
        {value ? (
          <>
            <span
              className={`block text-[14px] font-semibold leading-snug tabular-nums ${
                nowrap ? "md:whitespace-nowrap" : ""
              }`}
              style={{ color: INK }}
            >
              {value}
            </span>
            {note && (
              <span className="mt-1 block text-[12px] leading-snug text-gray-400">{note}</span>
            )}
          </>
        ) : (
          children
        )}
      </span>
    </div>
  );
}
