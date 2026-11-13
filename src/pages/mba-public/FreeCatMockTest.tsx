import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Card,
  Cite,
  Container,
  FaqList,
  Hero,
  HowToSteps,
  MbaConversion,
  MbaToolsNav,
  PageShell,
  RelatedMbaPages,
  Section,
  SourcesList,
  StartCatPrepButton,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import {
  CAT_2026_KEY_DATES,
  CAT_LATEST,
  CAT_MARKING_SOURCE,
  CAT_PATTERN_PATH,
  FREE_MOCKS_PATH,
  PYQ_PAPERS_PATH,
  SCORE_CALCULATOR_PATH,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  isPublished,
  mbaCrumbs,
  type Faq,
  type HowToStep,
} from "@/lib/mbaPublic";

const YEAR = CAT_LATEST.year;
const SECTIONS = CAT_LATEST.sections;
const perSection = SECTIONS[0]?.durationMinutes;
const sameDuration = SECTIONS.every((s) => s.durationMinutes === perSection);
const examDate = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const mcq = CAT_LATEST.marking.find((m) => m.type === "MCQ");
const tita = CAT_LATEST.marking.find((m) => m.type === "TITA");
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** What the student app's mock section holds (procounsel-neet-api CAT bank). */
const FULL_MOCKS = 3;
const SECTIONALS = 9;
const QUESTIONS = 204;
const STUDENT_MOCKS_PATH = "/mba/mocks";

const CRUMBS = mbaCrumbs({ name: "Entrance exams", to: "/mba-entrance-exams" }, { name: "Free CAT mock tests" });

const FEATURES: { title: string; body: string }[] = [
  {
    title: `${FULL_MOCKS} full-length CAT mocks`,
    body: `${SECTIONS.length} sections in the CAT order (${SECTIONS.map((s) => s.id).join(", ")})${sameDuration ? `, ${perSection} minutes each` : ""}, with the section timer locked the way the real test is.`,
  },
  {
    title: `${SECTIONALS} sectional tests`,
    body: "Timed tests for VARC, DILR and QA on their own, for working on one section at a time.",
  },
  {
    title: `${QUESTIONS} original questions with solutions`,
    body: "Every question has a step-by-step solution you can open after you answer.",
  },
  {
    title: "Timer that survives a refresh",
    body: "Your timer and answers are saved on our server, so you can close the tab and resume where you left off.",
  },
  {
    title: "Results with section analysis",
    body: "Score, accuracy and time per section after every test, using the CAT marking scheme.",
  },
  {
    title: "Mistake notebook",
    body: "Questions you got wrong are collected in one place to revisit before the exam.",
  },
  {
    title: "Daily challenge",
    body: "A short set of questions each day to keep practice going between mocks.",
  },
  {
    title: "AI hints after you answer",
    body: "Once you have answered, ask for a hint or an explanation of the approach. Hints never appear before you attempt.",
  },
];

const STEPS: HowToStep[] = [
  {
    name: "Take it in one sitting",
    text: `Sit the full ${CAT_LATEST.totalDurationMinutes} minutes at the time of day your CAT slot is, with no breaks and no phone.`,
  },
  {
    name: "Check section scores and accuracy",
    text: "Look at each section's score, accuracy and time, not only the total. Low accuracy means attempting too many; low attempts with high accuracy means you can push.",
  },
  {
    name: "Review every question",
    text: "Read the solution for every wrong, skipped and slow question, including the ones you got right by guessing.",
  },
  {
    name: "Fix one thing before the next mock",
    text: "Pick the costliest pattern (a topic, a question type, time lost on one set) and practise it before the next full test.",
  },
];

const FAQS: Faq[] = [
  {
    q: "How should I analyse a CAT mock test?",
    a: "Spend at least as long reviewing as taking it. For each section note attempts, accuracy and time; then go through every wrong, skipped and slow question and write down why (concept gap, misread, calculation, poor choice of question). The pattern across two or three mocks tells you what to practise next.",
  },
  {
    q: "Are these CAT mock tests really free?",
    a: `Yes. All ${FULL_MOCKS} full-length mocks, ${SECTIONALS} sectional tests, solutions, results, the mistake notebook, the daily challenge and AI hints are free. You need a free ProCounsel account so your attempts and timer can be saved.`,
  },
  {
    q: "Are the questions from past CAT papers?",
    a: "No. Every question is an original written by ProCounsel in the CAT pattern: the same sections, question types (multiple choice and type-in) and timing. They are not past CAT papers and not official IIM material.",
  },
  {
    q: "Do the mocks follow the CAT 2026 pattern?",
    a: `They follow the pattern in the CAT ${YEAR} press release: ${SECTIONS.length} sections in a fixed order${sameDuration ? `, ${perSection} minutes each` : ""}, ${CAT_LATEST.totalDurationMinutes} minutes in all${mcq && tita ? `, marked ${signed(mcq.correct)} for a correct answer, ${signed(mcq.incorrect)} for a wrong MCQ and ${tita.incorrect} for a wrong type-in answer` : ""}. The number of questions per section in CAT ${YEAR} is announced only after the exam.`,
  },
  {
    q: "Can I pause a mock and come back later?",
    a: "Yes. The timer and your answers are saved on the server as you go, so if your connection drops or you close the tab, you resume from the same point.",
  },
  {
    q: "Will my mock score tell me my CAT percentile?",
    a: "No. A mock score shows how you did on our questions; it cannot give an official CAT percentile, which the IIMs publish only with the result. Use it to find weak sections and track progress.",
  },
  {
    q: "How many mocks should I take before CAT?",
    a: `With the exam${examDate ? ` on ${examDate.value.split(",").slice(0, 2).join(",")}` : " close"}, take a full-length mock every few days, then spend at least as long reviewing it as taking it. The review, not the number of mocks, is where scores improve.`,
  },
];

export default function FreeCatMockTest() {
  const jsonLd = [
    faqJsonLd(FAQS),
    howToJsonLd("How to take and analyse a CAT mock test", FREE_MOCKS_PATH, STEPS),
    breadcrumbJsonLd(CRUMBS, FREE_MOCKS_PATH),
  ];

  return (
    <>
      <PageSEO
        title={`Free CAT Mock Tests ${YEAR} with Solutions`}
        description={`${FULL_MOCKS} free full-length CAT ${YEAR} mocks and ${SECTIONALS} sectionals in the official pattern: ${QUESTIONS} original questions with step-by-step solutions.`}
        canonical={FREE_MOCKS_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow={`Free CAT prep · CAT ${YEAR}`}
          title={`Free CAT Mock Tests ${YEAR}`}
          officialData={false}
          answer={
            <p>
              ProCounsel gives you {FULL_MOCKS} full-length CAT mocks and {SECTIONALS} sectional tests for free, with{" "}
              {QUESTIONS} original questions, step-by-step solutions and section-wise results. The mocks follow the CAT{" "}
              {YEAR} pattern ({SECTIONS.length} timed sections, {CAT_LATEST.totalDurationMinutes} minutes). The questions
              are our own originals written in the CAT pattern, not past CAT papers.
            </p>
          }
        >
          <div className="mt-6">
            <StartCatPrepButton label="Start a free mock" studentTo={STUDENT_MOCKS_PATH} />
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section id="what-you-get" title="What do you get in the free CAT mock tests?">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-[Poppins] text-[15.5px] font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-slate-600">{f.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
              Everything listed is free. The questions are ProCounsel originals in the CAT pattern; they are not past CAT
              papers or official IIM material.
              {isPublished(PYQ_PAPERS_PATH) && (
                <>
                  {" "}
                  For the actual papers, take the{" "}
                  <Link to={PYQ_PAPERS_PATH} className="font-medium text-[#2F43F2] hover:underline">
                    CAT previous year papers
                  </Link>{" "}
                  as free timed tests.
                </>
              )}
            </p>
          </Section>

          <HowToSteps title="How do you get the most out of a CAT mock?" steps={STEPS} />

          <Section
            id="pattern"
            title="What pattern do the mocks follow?"
            lead={<p>The official CAT {YEAR} structure, which every full-length mock uses.</p>}
          >
            <TableWrap caption={`CAT ${YEAR} sections and timing`}>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Section</Th>
                  <Th className="text-right">Time</Th>
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s, i) => (
                  <tr key={s.id}>
                    <Td>{i + 1}</Td>
                    <Td>
                      <strong className="font-semibold">{s.id}</strong>
                      <span className="block text-[12.5px] text-slate-500">{s.name}</span>
                    </Td>
                    <Td className="text-right tabular-nums">{s.durationMinutes} min</Td>
                  </tr>
                ))}
                <tr>
                  <Td />
                  <Td className="font-semibold">Total</Td>
                  <Td className="text-right font-semibold tabular-nums">{CAT_LATEST.totalDurationMinutes} min</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="mt-2">
              <Cite source={CAT_LATEST.source} />
            </p>
            {mcq && tita && (
              <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
                Results use the CAT marking scheme: {signed(mcq.correct)} for a correct answer, {signed(mcq.incorrect)} for a
                wrong multiple-choice answer and {tita.incorrect} for a wrong type-in answer. <Cite source={CAT_MARKING_SOURCE} />
              </p>
            )}
            <p className="mt-3 text-[13.5px]">
              <Link to={CAT_PATTERN_PATH} className="font-medium text-[#2F43F2] hover:underline">
                Full CAT {YEAR} pattern, dates and marking scheme
              </Link>
            </p>
          </Section>

          <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[Poppins] text-[18px] font-semibold">Ready to take a mock?</h2>
              <p className="mt-1 text-[14px] text-slate-600">
                Sign in for free and pick a full-length or sectional test. After CAT, work out your raw
                score with the{" "}
                <Link to={SCORE_CALCULATOR_PATH} className="font-medium text-[#2F43F2] underline">
                  CAT score calculator
                </Link>
                .
              </p>
            </div>
            <StartCatPrepButton label="Start a free mock" studentTo={STUDENT_MOCKS_PATH} />
          </Card>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <MbaToolsNav current={FREE_MOCKS_PATH} />

          <RelatedMbaPages current={FREE_MOCKS_PATH} />

          <MbaConversion
            intent="Free CAT mock test enquiry"
            formId="free_cat_mock_test_page"
            subheading="Get help planning your last weeks before CAT and choosing where to apply after it. Free call, no login needed. We guide; admission decisions are always the institute's."
          />

          <SourcesList sources={[CAT_LATEST.source, CAT_MARKING_SOURCE]} />
        </Container>
      </PageShell>
    </>
  );
}
