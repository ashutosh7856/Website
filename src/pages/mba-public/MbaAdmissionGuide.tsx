import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CalendarClock, ClipboardList, NotebookPen, Sparkles, Timer } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import CollegeTable from "@/components/mba-public/CollegeTable";
import {
  Card,
  Cite,
  Container,
  FaqList,
  Hero,
  LinkCards,
  LinkChips,
  MbaConversion,
  MinimumsCaveat,
  PageShell,
  Section,
  SourcesList,
  StartCatPrepButton,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_EXAM_OVERVIEW } from "@/content/mbaExamsOverview";
import { MBA_GUIDES } from "@/content/mbaGuides";
import {
  ALL_COLLEGES,
  CAT_2026_KEY_DATES,
  CAT_LATEST,
  CAT_PATTERN_PATH,
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  LAST_VERIFIED_ISO,
  MBA_COUNSELLING_PATH,
  MBA_HUB_PATH,
  MBA_INSTITUTES,
  NIRF,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  isPublished,
  overallRange,
  joinNames,
  type Crumb,
  type Faq,
} from "@/lib/mbaPublic";
import {
  MBA_CITIES,
  MBA_EXAMS,
  MBA_PATHS,
  MBA_PERCENTILES,
  cityPath,
  examPath,
  percentilePath,
} from "@/lib/mbaRoutes.mjs";

const COUNT = MBA_INSTITUTES.length;
const examDate = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const resultDate = CAT_2026_KEY_DATES.find((d) => d.label === "Result");
const perSection = CAT_LATEST.sections[0]?.durationMinutes;
const GENERAL = overallRange("General");
const TOP5 = NIRF?.rankings.slice(0, 5) ?? [];

const CRUMBS: Crumb[] = [{ name: "Home", to: "/" }, { name: "MBA Admission 2027" }];
const TITLE = "MBA Admission 2027: Exams, Colleges, Fees and Process";
const DESCRIPTION =
  "MBA admission 2027 guide: CAT 2026 dates, which entrance exam to take, official IIM cut-offs, fees and placements, and how shortlisting and interviews work";

const STEPS = [
  {
    title: "Take an entrance exam",
    text: `CAT for the IIMs and most top B-schools; XAT, SNAP, NMAT, CMAT or MAH-CET for the institutes that use them. CAT ${CAT_LATEST.year} is ${examDate ? examDate.value.split(",").slice(0, 2).join(",") : "scheduled for late November"}.`,
  },
  {
    title: "Apply to each institute",
    text: "The IIMs use your CAT registration; most other schools need their own application, often with a deadline close to the exam date. Check each one.",
  },
  {
    title: "Clear the minimums and get shortlisted",
    text: "Each institute sets minimum percentiles, then ranks eligible applicants on a composite of the score, Class X/XII and graduation marks, work experience and diversity.",
  },
  {
    title: "Write, discuss, interview",
    text: "Shortlisted candidates face a written ability test, group discussion and/or personal interview. The final offer list re-weights everything; the exam score alone never decides.",
  },
];

const FEATURES = [
  { icon: BookOpenCheck, title: "Section-wise practice", text: "VARC, DILR and QA questions by topic; the answer and solution open only after you attempt one." },
  { icon: Timer, title: "Mocks with real section timers", text: `${perSection}-minute locked sections, the way the CAT runs, with a full score breakdown.` },
  { icon: NotebookPen, title: "Mistakes notebook", text: "Every wrong answer is saved, tagged by why it went wrong and brought back for spaced review." },
  { icon: CalendarClock, title: "Daily challenge", text: "A short set every day to keep the streak going between mocks." },
  { icon: Sparkles, title: "Step-by-step hints", text: "Ask for a nudge, an approach or a full explanation after you attempt a question." },
  { icon: ClipboardList, title: "IIM shortlist tracker", text: "Check your percentile against IIM minimums and track each application's status and deadline." },
];

const FAQS: Faq[] = [
  {
    q: "When is CAT 2026, and when will the result come out?",
    a: `CAT ${CAT_LATEST.year} is on ${examDate?.value ?? "the date in the official bulletin"}. ${resultDate ? `The bulletin says the result is ${resultDate.value}.` : ""} The score is used for admission to the 2027–29 MBA batch.`,
  },
  {
    q: "Which entrance exam should I take for MBA admission in 2027?",
    a: "Take CAT if you want an IIM or most top B-schools. Add XAT for XLRI, SNAP for Symbiosis, NMAT for NMIMS, MAH-CET for MBA/MMS seats in Maharashtra, and CMAT or MAT as back-ups for colleges that accept them. Pick by the colleges you want, not by which test feels easier.",
  },
  {
    q: "What CAT percentile do the IIMs require?",
    a: `For a General, non-PwD candidate, the IIMs' published overall minimums range from ${GENERAL.min} (${joinNames(GENERAL.minNames)}) to ${GENERAL.max} (${joinNames(GENERAL.maxNames)}). These are eligibility thresholds; interview calls usually need more, and sectional minimums apply too.`,
  },
  {
    q: "Can I get an MBA admission without CAT?",
    a: "Yes. Many good institutes admit through XAT, SNAP, NMAT, CMAT, MAH-CET, MAT or GMAT, and some private colleges have institute-level seats with their own process. Our guide to MBA without CAT explains the routes and what to check before paying anyone.",
  },
  {
    q: "Does ProCounsel guarantee MBA admission?",
    a: "No, and no honest counsellor can. We help you choose exams and colleges, build a shortlist, prepare applications and interviews, and understand direct-admission options at private colleges. Admission decisions are always the institute's.",
  },
];

export default function MbaAdmissionGuide() {
  const examRows = MBA_EXAMS.map((e) => ({ exam: e, overview: MBA_EXAM_OVERVIEW.find((o) => o.id === e.id) }));
  const percentileLinks = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p))).map((p) => ({
    to: percentilePath(p),
    label: `At ${p} percentile`,
  }));
  const cityLinks = MBA_CITIES.filter((c) => isPublished(cityPath(c.slug))).map((c) => ({
    to: cityPath(c.slug),
    label: `MBA colleges in ${c.name}`,
  }));
  const guides = MBA_GUIDES.map((g) => ({ to: g.path, label: g.h1, detail: g.cardDetail }));

  const jsonLd = [
    articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: MBA_HUB_PATH, dateModified: LAST_VERIFIED_ISO }),
    breadcrumbJsonLd(CRUMBS, MBA_HUB_PATH),
    faqJsonLd(FAQS),
  ];

  return (
    <>
      <PageSEO title="MBA Admission 2027: Exams, Colleges & Fees" description={DESCRIPTION} canonical={MBA_HUB_PATH} jsonLd={jsonLd} />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA Admission Guide 2027"
          title={TITLE}
          answer={
            <p>
              MBA admission for the 2027–29 batch starts with an entrance exam &mdash; CAT for the {COUNT} IIMs and most top
              B-schools, or XAT, SNAP, NMAT, CMAT and MAH-CET for the institutes that use them. CAT {CAT_LATEST.year} is{" "}
              {examDate ? `on ${examDate.value.split(",").slice(0, 2).join(",")}` : "in late November"}. Clearing an
              institute&rsquo;s minimum percentile gets you considered; a composite score, written test and interview
              decide the offer.
            </p>
          }
        >
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={ELIGIBILITY_TOOL_PATH}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[14.5px] font-semibold text-white hover:bg-[#2335d0]"
            >
              Try the CAT college predictor <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={MBA_COUNSELLING_PATH}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14.5px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
            >
              Get MBA admission counselling
            </Link>
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section id="process" title="How does MBA admission work in India?">
            <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1FF] text-[13px] font-bold text-[#2F43F2]">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-[Poppins] text-[15.5px] font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
            {isPublished("/mba-resources/mba-admission-process") && (
              <p className="mt-3 text-[13.5px]">
                <Link to="/mba-resources/mba-admission-process" className="font-medium text-[#2F43F2] hover:underline">
                  The MBA admission process, step by step
                </Link>
              </p>
            )}
          </Section>

          <Section
            id="exams"
            title="Which entrance exams lead to an MBA in 2027?"
            lead={<p>Who runs each exam and which institutes use it. Dates and fees are on each exam&rsquo;s own page as official notices are verified.</p>}
          >
            <TableWrap caption="MBA entrance exams">
              <thead>
                <tr>
                  <Th>Exam</Th>
                  <Th>Conducted by</Th>
                  <Th>Used for</Th>
                </tr>
              </thead>
              <tbody>
                {examRows.map(({ exam, overview }) => (
                  <tr key={exam.id}>
                    <Td>
                      {isPublished(examPath(exam.id)) ? (
                        <Link to={examPath(exam.id)} className="font-semibold text-[#2F43F2] hover:underline">
                          {exam.short}
                        </Link>
                      ) : (
                        <strong className="font-semibold">{exam.short}</strong>
                      )}
                      <span className="block text-[12px] text-slate-500">{exam.name}</span>
                    </Td>
                    <Td className="text-[13px]">{overview?.conductedBy}</Td>
                    <Td className="text-[13px]">{overview?.usedFor}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-3 text-[13.5px]">
              <Link to={MBA_PATHS.exams} className="font-medium text-[#2F43F2] hover:underline">
                Compare all MBA entrance exams
              </Link>
            </p>
          </Section>

          <Section id="cat-dates" title={`What are the key CAT ${CAT_LATEST.year} dates?`}>
            <TableWrap caption={`CAT ${CAT_LATEST.year} key dates`}>
              <tbody>
                {CAT_2026_KEY_DATES.map((d) => (
                  <tr key={d.label}>
                    <Td className="w-[190px] font-medium text-slate-600">{d.label}</Td>
                    <Td>
                      <span className="font-semibold text-[#0E1629]">{d.value}</span>
                      {d.tentative && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Tentative</span>
                      )}
                      <span className="mt-1 block">
                        <Cite source={d.source} />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-3 text-[13.5px]">
              <Link to={CAT_PATTERN_PATH} className="font-medium text-[#2F43F2] hover:underline">
                CAT {CAT_LATEST.year} pattern, marking scheme and colleges that accept it
              </Link>
            </p>
            <p className="mt-1.5 text-[13.5px]">
              <Link to={MBA_PATHS.freeMocks} className="font-medium text-[#2F43F2] hover:underline">
                Free CAT mock tests
              </Link>
              {" · "}
              <Link to={MBA_PATHS.scoreCalculator} className="font-medium text-[#2F43F2] hover:underline">
                CAT score calculator
              </Link>
            </p>
          </Section>

          <Section
            id="colleges"
            title="Which are the top MBA colleges, and what do they cost?"
            lead={
              TOP5.length > 0 && NIRF ? (
                <p>
                  In the NIRF {NIRF.year} Management ranking, the top five are {joinNames(TOP5.map((r) => r.name))}.{" "}
                  <Cite source={NIRF.source} /> Below are the institutes whose fees, cut-offs and placements we have
                  verified from their own documents.
                </p>
              ) : undefined
            }
          >
            <CollegeTable colleges={ALL_COLLEGES} caption="MBA colleges with verified fees and placements" />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
              <Link to={MBA_PATHS.colleges} className="font-medium text-[#2F43F2] hover:underline">
                Best MBA colleges in India (NIRF top 100)
              </Link>
              {isPublished(MBA_PATHS.fees) && (
                <Link to={MBA_PATHS.fees} className="font-medium text-[#2F43F2] hover:underline">
                  MBA fees compared
                </Link>
              )}
              {isPublished(MBA_PATHS.placements) && (
                <Link to={MBA_PATHS.placements} className="font-medium text-[#2F43F2] hover:underline">
                  MBA placements compared
                </Link>
              )}
              {isPublished(MBA_PATHS.compare) && (
                <Link to={MBA_PATHS.compare} className="font-medium text-[#2F43F2] hover:underline">
                  Compare colleges side by side
                </Link>
              )}
              {isPublished(MBA_PATHS.roiCalculator) && (
                <Link to={MBA_PATHS.roiCalculator} className="font-medium text-[#2F43F2] hover:underline">
                  MBA fees &amp; ROI calculator
                </Link>
              )}
            </div>
            {cityLinks.length > 0 && (
              <div className="mt-4">
                <LinkChips label="MBA colleges by city" items={cityLinks} />
              </div>
            )}
          </Section>

          <Section
            id="percentile"
            title="What CAT percentile do you need?"
            lead={
              <p>
                For General, non-PwD candidates the IIMs&rsquo; published overall minimums run from {GENERAL.min} to{" "}
                {GENERAL.max}. See which colleges each band reaches, or every category in the{" "}
                <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] underline">
                  IIM CAT cut-offs
                </Link>
                .
              </p>
            }
          >
            <LinkChips label="MBA colleges by CAT percentile" items={percentileLinks} />
            <div className="mt-4">
              <MinimumsCaveat />
            </div>
          </Section>

          {guides.length > 0 && (
            <Section id="guides" title="What else should you read before applying?">
              <LinkCards label="MBA guides" items={guides} />
              <div className="mt-4">
                <LinkChips
                  label="MBA planning pages"
                  items={[
                    { to: MBA_PATHS.deadlines, label: "MBA admission deadlines 2027" },
                    { to: MBA_PATHS.eligibility, label: "MBA eligibility" },
                    { to: MBA_PATHS.courses, label: "Types of MBA courses" },
                  ].filter((x) => isPublished(x.to))}
                />
              </div>
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.resources} className="font-medium text-[#2F43F2] hover:underline">
                  All MBA resources
                </Link>
              </p>
            </Section>
          )}

          <Section
            id="free-prep"
            title="How can you prepare for CAT for free on ProCounsel?"
            lead={
              <p>
                Practice questions are ProCounsel originals written to the CAT pattern and reviewed by faculty. The IIMs do
                not publish past CAT papers, so none of these are presented as official questions.
              </p>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card key={title}>
                  <Icon className="h-5 w-5 text-[#2F43F2]" aria-hidden />
                  <h3 className="mt-3 font-[Poppins] text-[15px] font-semibold">{title}</h3>
                  <p className="mt-1 text-[13.5px] leading-6 text-slate-600">{text}</p>
                </Card>
              ))}
            </div>
            <div className="mt-5">
              <StartCatPrepButton />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <SourcesList
            sources={[
              ...CAT_2026_KEY_DATES.map((d) => d.source),
              CAT_LATEST.source,
              ...(NIRF ? [NIRF.source] : []),
              ...ALL_COLLEGES.flatMap((c) => [c.programs[0]?.feeSource, c.programs[0]?.salarySource]).filter((x) => !!x).map((x) => x!),
            ]}
          />

          <MbaConversion intent="MBA admission 2027 guide enquiry" formId="mba_admission_guide" />
        </Container>
      </PageShell>
    </>
  );
}
