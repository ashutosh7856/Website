import { useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import {
  Card,
  Cite,
  Container,
  FaqList,
  Hero,
  MbaConversion,
  PageShell,
  RelatedMbaPages,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import {
  CAT_2025_MEDIA_RELEASE,
  CAT_2026_KEY_DATES,
  CAT_EXAM,
  CAT_LATEST,
  CAT_MARKING_SOURCE,
  CAT_PATTERN_PATH,
  ELIGIBILITY_TOOL_PATH,
  FREE_MOCKS_PATH,
  LAST_VERIFIED_ISO,
  SCORE_CALCULATOR_PATH,
  breadcrumbJsonLd,
  faqJsonLd,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import {
  ATTEMPT_FIELDS,
  EMPTY_SECTION_DRAFT,
  UNKNOWN_COUNT_MAX,
  cleanCount,
  schemeFromMarking,
  scoreCat,
  scoreSection,
  scoreSummary,
  sectionLimit,
  validateSection,
  whatsappShareUrl,
  type AttemptField,
  type CatScore,
  type CatSectionId,
  type SectionDraft,
  type SectionErrors,
} from "@/lib/catScore";
import { absoluteUrl } from "@/lib/siteUrl.mjs";

const YEAR = CAT_LATEST.year;
const SECTIONS = CAT_LATEST.sections;
const SCHEME = schemeFromMarking(CAT_LATEST.marking);
const COUNTS_KNOWN = SECTIONS.every((s) => s.questionCount !== null);
/** Most recent year whose question counts are published (CAT 2025 today). */
const COUNTED = CAT_EXAM.versions.find((v) => v.sections.every((s) => s.questionCount !== null));
const countedText = COUNTED ? COUNTED.sections.map((s) => `${s.id} ${s.questionCount}`).join(", ") : "";
const resultDate = CAT_2026_KEY_DATES.find((d) => d.label === "Result");
const examDate = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const CRUMBS = mbaCrumbs({ name: "Entrance exams", to: "/mba-entrance-exams" }, { name: "CAT score calculator" });

const FIELD_LABEL: Record<AttemptField, string> = {
  mcqCorrect: "MCQ correct",
  mcqWrong: "MCQ wrong",
  titaCorrect: "TITA correct",
};

const FAQS: Faq[] = [
  {
    q: `How is the CAT ${YEAR} score calculated?`,
    a: SCHEME
      ? `Each correct answer earns ${SCHEME.mcqCorrect} marks. A wrong multiple-choice (MCQ) answer costs ${Math.abs(SCHEME.mcqWrong)} mark, a wrong type-in (TITA) answer costs ${Math.abs(SCHEME.titaWrong)}, and an unanswered question scores 0. A section's raw score is the sum of these, and your total is the sum of the three sections. This is the scheme in the latest official statement of it (the CAT 2023 result release); later CAT documents do not restate it.`
      : "The latest official CAT documents do not state the marking scheme.",
  },
  {
    q: "Can this calculator predict my CAT percentile?",
    a: `No. The IIMs do not publish a table that converts a raw score into a percentile, and the percentile depends on how every candidate in your session and slot performed, after the scores are normalised across sessions. The official percentiles come with the result, which the CAT ${YEAR} bulletin says is likely in the first week of January 2027. Once you have yours, use the CAT college predictor to check it against IIM minimums.`,
  },
  {
    q: "Why does the calculator not ask for wrong TITA answers?",
    a: SCHEME && SCHEME.titaWrong === 0
      ? "Because they do not change your score. A wrong type-in answer carries no negative mark, so only correct TITA answers count."
      : "Wrong TITA answers are scored as the official scheme states.",
  },
  {
    q: `How many questions are there in each CAT ${YEAR} section?`,
    a: COUNTS_KNOWN
      ? `CAT ${YEAR} has ${SECTIONS.map((s) => `${s.questionCount} questions in ${s.id}`).join(", ")}.`
      : `The CAT Centre announces question counts only after the exam.${COUNTED ? ` CAT ${COUNTED.year} had ${countedText}.` : ""} Until the ${YEAR} counts are out, the calculator accepts up to ${UNKNOWN_COUNT_MAX} answers per section.`,
  },
  {
    q: "Is my score from this calculator my official CAT score?",
    a: "No. It is the raw score your counts produce under the official marking scheme. The CAT Centre normalises scores across exam sessions before converting them to percentiles, so your scaled score on the scorecard can differ from the raw score. Use the official response sheet and final answer key to get exact counts.",
  },
  {
    q: "Do you store the numbers I enter?",
    a: "No. The calculation runs in your browser and nothing you type into the calculator is sent anywhere. Sharing your phone number in the callback form is optional.",
  },
];

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15";
const labelClass = "mb-1.5 block text-[12.5px] font-medium text-slate-600";

type Drafts = Record<CatSectionId, SectionDraft>;
type Errors = Partial<Record<CatSectionId, SectionErrors>>;

const EMPTY_DRAFTS = Object.fromEntries(SECTIONS.map((s) => [s.id, EMPTY_SECTION_DRAFT])) as Drafts;

export default function CatScoreCalculator() {
  const uid = useId();
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [errors, setErrors] = useState<Errors>({});
  const [score, setScore] = useState<CatScore | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const set = (id: CatSectionId, field: AttemptField, value: string) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: cleanCount(value) } }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!SCHEME) return;
    const found: Errors = {};
    const scored = SECTIONS.map((s) => {
      const limit = sectionLimit(s.questionCount);
      const { attempt, errors: errs } = validateSection(drafts[s.id], limit);
      if (!attempt) found[s.id] = errs;
      return attempt ? scoreSection(s.id, attempt, SCHEME, limit) : null;
    });
    setErrors(found);
    if (scored.some((s) => s === null)) {
      setScore(null);
      return;
    }
    setScore(scoreCat(scored.filter((s) => s !== null), COUNTS_KNOWN));
    requestAnimationFrame(() => resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `CAT ${YEAR} Score Calculator`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: absoluteUrl(SCORE_CALCULATOR_PATH),
      description: `Works out section-wise and total CAT ${YEAR} raw scores from correct and wrong answers, using the official marking scheme.`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      ...(LAST_VERIFIED_ISO ? { dateModified: LAST_VERIFIED_ISO } : {}),
    },
    faqJsonLd(FAQS),
    breadcrumbJsonLd(CRUMBS, SCORE_CALCULATOR_PATH),
  ];

  return (
    <>
      <PageSEO
        title={`CAT ${YEAR} Score Calculator: Raw Score by Section`}
        description={`Free CAT ${YEAR} score calculator: enter correct and wrong answers per section for your VARC, DILR, QA and total raw score on the official marking scheme.`}
        canonical={SCORE_CALCULATOR_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          lead={false}
          crumbs={CRUMBS}
          eyebrow="Free tool · no login"
          title={`CAT ${YEAR} Score Calculator: Work Out Your Raw Score`}
          answer={
            <p>
              Enter how many multiple-choice (MCQ) answers you got right and wrong, and how many type-in (TITA) answers
              you got right, in each section. The calculator applies the official CAT marking scheme
              {SCHEME
                ? ` (${signed(SCHEME.mcqCorrect)} for a correct answer, ${signed(SCHEME.mcqWrong)} for a wrong MCQ, ${SCHEME.titaWrong} for a wrong TITA)`
                : ""}{" "}
              and gives your VARC, DILR, QA and total raw score. It does not estimate a percentile: the IIMs publish
              percentiles only with the result.
            </p>
          }
        />

        <Container className="mt-8 space-y-12">
          <Card>
            <h2 className="font-[Poppins] text-[18px] font-semibold">Enter your answers by section</h2>
            <form onSubmit={submit} noValidate className="mt-4 space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                {SECTIONS.map((s) => {
                  const limit = sectionLimit(s.questionCount);
                  const errs = errors[s.id] ?? {};
                  return (
                    <fieldset key={s.id} className="rounded-xl border border-slate-200 p-4">
                      <legend className="px-1 font-[Poppins] text-[14.5px] font-semibold">
                        {s.id}{" "}
                        <span className="font-sans text-[12px] font-normal text-slate-500">
                          {s.questionCount ? `${s.questionCount} questions` : `up to ${limit} answers`}
                        </span>
                      </legend>
                      <p className="text-[12px] text-slate-500">{s.name}</p>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {ATTEMPT_FIELDS.map((f) => {
                          const id = `${uid}-${s.id}-${f}`;
                          return (
                            <div key={f}>
                              <label htmlFor={id} className={labelClass}>
                                {FIELD_LABEL[f]}
                              </label>
                              <input
                                id={id}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="0"
                                aria-label={`${s.id} ${FIELD_LABEL[f]}`}
                                value={drafts[s.id][f]}
                                onChange={(e) => set(s.id, f, e.target.value)}
                                aria-invalid={!!errs[f] || !!errs.total}
                                className={fieldClass}
                              />
                              {errs[f] && <p className="mt-1 text-[12px] text-red-600">{errs[f]}</p>}
                            </div>
                          );
                        })}
                      </div>
                      {errs.total && <p className="mt-2 text-[12px] text-red-600">{errs.total}</p>}
                    </fieldset>
                  );
                })}
              </div>
              <p className="text-[12px] leading-5 text-slate-500">
                Leave a box blank for 0. Wrong TITA answers carry no penalty, so they are not asked for.{" "}
                {COUNTS_KNOWN
                  ? null
                  : `Question counts for CAT ${YEAR} are announced after the exam, so each section accepts up to ${UNKNOWN_COUNT_MAX} answers for now${COUNTED ? ` (CAT ${COUNTED.year} had ${countedText})` : ""}.`}
              </p>
              <button
                type="submit"
                disabled={!SCHEME}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2335d0] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Calculate my score
              </button>
            </form>
          </Card>

          {score && (
            <div ref={resultRef} className="scroll-mt-24 space-y-8">
              <Section title="Your CAT raw score">
                <TableWrap caption={`Your CAT ${YEAR} raw score by section`}>
                  <thead>
                    <tr>
                      <Th>Section</Th>
                      <Th className="text-right">Correct</Th>
                      <Th className="text-right">Wrong MCQ</Th>
                      <Th className="text-right">MCQ marks</Th>
                      <Th className="text-right">TITA marks</Th>
                      <Th className="text-right">Raw score</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {score.sections.map((s) => (
                      <tr key={s.id}>
                        <Td className="font-semibold">{s.id}</Td>
                        <Td className="text-right tabular-nums">{s.attempt.mcqCorrect + s.attempt.titaCorrect}</Td>
                        <Td className="text-right tabular-nums">{s.attempt.mcqWrong}</Td>
                        <Td className="text-right tabular-nums">{s.mcqMarks}</Td>
                        <Td className="text-right tabular-nums">{s.titaMarks}</Td>
                        <Td className="text-right font-semibold tabular-nums">{s.raw}</Td>
                      </tr>
                    ))}
                    <tr>
                      <Td className="font-semibold">Total</Td>
                      <Td className="text-right tabular-nums">{score.correct}</Td>
                      <Td className="text-right tabular-nums">{score.wrong}</Td>
                      <Td />
                      <Td />
                      <Td className="text-right text-[16px] font-semibold tabular-nums text-[#2F43F2]">
                        {score.total}
                        {score.max !== null && <span className="text-[13px] text-slate-500"> / {score.max}</span>}
                      </Td>
                    </tr>
                  </tbody>
                </TableWrap>
                <p className="mt-2">
                  <Cite source={CAT_MARKING_SOURCE} prefix="Marking scheme" />
                </p>
                <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
                  This is a raw score, not your percentile. The IIMs publish percentiles with the result
                  {resultDate ? ", tentatively in the first week of January 2027" : ""}. Once you have yours, check it
                  against IIM minimums with the{" "}
                  <Link to={ELIGIBILITY_TOOL_PATH} className="font-medium text-[#2F43F2] underline">
                    CAT college predictor
                  </Link>
                  .
                </p>
                <a
                  href={whatsappShareUrl(scoreSummary(score, YEAR), absoluteUrl(SCORE_CALCULATOR_PATH))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Share on WhatsApp
                </a>
              </Section>
              <QuickLeadForm
                intent="CAT score calculator result"
                course="MBA"
                exam="CAT"
                formId="cat_score_calculator_result"
                heading="Get your score reviewed and a college plan from an MBA counsellor"
                subheading="A ProCounsel MBA counsellor can go through your score, academics and work experience and help you plan where to apply. Free call, no login needed."
              />
            </div>
          )}

          <Section
            id="marking"
            title="How is the CAT score calculated?"
            lead={
              <p>
                The marks per answer below are from the latest official statement of the CAT marking scheme, the CAT
                2023 result release. The CAT 2024, 2025 and {YEAR} documents do not restate it, so it is the expected
                scheme until the CAT Centre says otherwise.
              </p>
            }
          >
            <TableWrap caption="CAT marking scheme">
              <thead>
                <tr>
                  <Th>Question type</Th>
                  <Th className="text-right">Correct</Th>
                  <Th className="text-right">Wrong</Th>
                  <Th className="text-right">Not answered</Th>
                </tr>
              </thead>
              <tbody>
                {CAT_LATEST.marking.map((m) => (
                  <tr key={m.type}>
                    <Td className="font-medium">{m.type === "TITA" ? "TITA (type in the answer)" : "MCQ (multiple choice)"}</Td>
                    <Td className="text-right tabular-nums">{signed(m.correct)}</Td>
                    <Td className="text-right tabular-nums">{signed(m.incorrect)}</Td>
                    <Td className="text-right tabular-nums">{m.unanswered}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-2">
              <Cite source={CAT_MARKING_SOURCE} />
            </p>
            {SCHEME && (
              <Card className="mt-4">
                <h3 className="font-[Poppins] text-[15.5px] font-semibold">Worked example</h3>
                <p className="mt-2 text-[14px] leading-7 text-slate-700">
                  In one section you get 12 MCQs right, 4 MCQs wrong and 5 TITA questions right. MCQ marks are 12 &times;{" "}
                  {SCHEME.mcqCorrect} &minus; 4 &times; {Math.abs(SCHEME.mcqWrong)} ={" "}
                  {12 * SCHEME.mcqCorrect + 4 * SCHEME.mcqWrong}; TITA marks are 5 &times; {SCHEME.titaCorrect} ={" "}
                  {5 * SCHEME.titaCorrect}. The section&rsquo;s raw score is{" "}
                  {12 * SCHEME.mcqCorrect + 4 * SCHEME.mcqWrong + 5 * SCHEME.titaCorrect}.
                </p>
              </Card>
            )}
          </Section>

          <Section
            id="response-sheet"
            title="How do I check my score with the response sheet and answer key?"
            lead={
              <p>
                After the exam{examDate ? ` on ${examDate.value.split(",").slice(0, 2).join(",")}` : ""}, the CAT Centre
                releases each candidate&rsquo;s response sheet and a provisional answer key on the official website,
                then a final key after objections. Exact release dates are announced on iimcat.ac.in.
              </p>
            }
          >
            <Card>
              <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
                <li>
                  Log in at{" "}
                  <a
                    href={CAT_EXAM.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#2F43F2] underline"
                  >
                    iimcat.ac.in
                  </a>{" "}
                  when the response sheet is released and download it with the answer key for your slot.
                </li>
                <li>
                  For each section, compare the answer you marked with the key. Count MCQs right, MCQs wrong and type-in
                  answers right; skip questions you left unanswered.
                </li>
                <li>Enter the counts above. Recount with the final answer key if any answer changes after objections.</li>
                <li>
                  Your scorecard will show scaled scores and percentiles after normalisation across slots, so it can differ
                  from the raw score here.
                </li>
              </ol>
            </Card>
          </Section>

          <Section id="percentile" title="Can I convert my CAT score into a percentile?">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] leading-7 text-amber-900">
              Not reliably. No official table maps a CAT raw score to a percentile: the percentile depends on how every
              candidate scored, after normalisation across the three sessions, and the IIMs publish it only with the
              result{resultDate ? `, which the CAT ${YEAR} bulletin says is ${resultDate.value}` : ""}. Score-to-percentile
              charts you see online are estimates from past years, not official figures.
            </div>
            <p className="mt-3 text-[14px] leading-7 text-slate-700">
              Still preparing? Practise under the real section timer with our{" "}
              <Link to={FREE_MOCKS_PATH} className="font-medium text-[#2F43F2] underline">
                free CAT mock tests
              </Link>
              , or read the{" "}
              <Link to={CAT_PATTERN_PATH} className="font-medium text-[#2F43F2] underline">
                CAT {YEAR} exam pattern
              </Link>
              .
            </p>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <RelatedMbaPages current={SCORE_CALCULATOR_PATH} />

          <MbaConversion intent="CAT score calculator enquiry" formId="cat_score_calculator_page" />

          <SourcesList sources={[CAT_MARKING_SOURCE, CAT_LATEST.source, CAT_2025_MEDIA_RELEASE]} />
        </Container>
      </PageShell>
    </>
  );
}
