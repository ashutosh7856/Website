import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
  Card,
  Cite,
  Container,
  FaqList,
  Hero,
  LinkChips,
  MbaConversion,
  PageShell,
  RelatedMbaPages,
  Section,
  SourcesList,
  StartCatPrepButton,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import type { ExamVersion, MarkingRule } from "@/api/mba";
import CollegeTable from "@/components/mba-public/CollegeTable";
import FactsTable from "@/components/mba-public/FactsTable";
import {
  ALL_COLLEGES,
  CAT_2025_MEDIA_RELEASE,
  CAT_2026_KEY_DATES,
  CAT_EXAM,
  CAT_LATEST,
  CAT_MARKING_SOURCE,
  CAT_PATTERN_PATH,
  ELIGIBILITY_TOOL_PATH,
  LAST_VERIFIED,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  examInfo,
  faqJsonLd,
  isPublished,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_PATHS, MBA_PERCENTILES, percentilePath } from "@/lib/mbaRoutes.mjs";

/** Eligibility, fees, validity and the like from exams/cat.json (the pattern itself is cat_exam.json). */
const CAT_INFO = examInfo("cat");
const CAT_FACTS = (CAT_INFO?.facts ?? []).filter((f) => !/^(Conducted by|Exam cycle)$/.test(f.label));
const CAT_COLLEGES = ALL_COLLEGES.filter((c) => c.acceptedExams.includes("cat"));
const PERCENTILE_LINKS = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p))).map((p) => ({
  to: percentilePath(p),
  label: `MBA colleges at ${p} percentile`,
}));

const YEAR = CAT_LATEST.year;
/** Most recent version whose question counts have been published. */
const COUNTED: ExamVersion | undefined = CAT_EXAM.versions.find((v) => v.sections.every((s) => s.questionCount !== null));
const countedTotal = COUNTED ? COUNTED.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0) : null;
const countsAnnounced = CAT_LATEST.sections.every((s) => s.questionCount !== null);
const mcq = CAT_LATEST.marking.find((m) => m.type === "MCQ");
const tita = CAT_LATEST.marking.find((m) => m.type === "TITA");
const examDate = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const resultDate = CAT_2026_KEY_DATES.find((d) => d.label === "Result");
const sectionOrder = CAT_LATEST.sections.map((s) => s.id).join(", ");
const perSection = CAT_LATEST.sections[0]?.durationMinutes;
const sameDuration = CAT_LATEST.sections.every((s) => s.durationMinutes === perSection);

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const markingLabel = (m: MarkingRule) => (m.type === "TITA" ? "TITA (type in the answer)" : "MCQ (multiple choice)");

const CRUMBS = mbaCrumbs({ name: "Entrance exams", to: MBA_PATHS.exams }, { name: "CAT" });

const FAQS: Faq[] = [
  {
    q: `How many questions will CAT ${YEAR} have?`,
    a: countsAnnounced
      ? `CAT ${YEAR} has ${CAT_LATEST.sections.map((s) => `${s.questionCount} in ${s.id}`).join(", ")}.`
      : `The CAT Centre has not announced it. Question counts are published only after the test.${COUNTED ? ` CAT ${COUNTED.year} had ${countedTotal} questions: ${COUNTED.sections.map((s) => `${s.id} ${s.questionCount}`).join(", ")}, and the official mock says the number of questions may vary from year to year.` : ""}`,
  },
  {
    q: "Is there negative marking in CAT?",
    a: mcq && tita
      ? `Yes, for multiple-choice questions: a wrong MCQ answer costs ${Math.abs(mcq.incorrect)} mark, while a wrong type-in (TITA) answer costs ${Math.abs(tita.incorrect)}. A correct answer earns ${mcq.correct} marks and an unanswered question scores 0. This is the scheme in the latest official statement (CAT 2023 result release); the 2024 to ${YEAR} documents do not restate it.`
      : "The latest official documents do not restate the marking scheme.",
  },
  {
    q: "Can I move between sections or choose the order in CAT?",
    a: CAT_LATEST.sectionOrderLocked
      ? `No. The sections come in a fixed order (${sectionOrder})${sameDuration ? ` and each is timed at exactly ${perSection} minutes` : ""}. You cannot go back to a section once its time is over, or move ahead early.`
      : "The official documents allow candidates to move between sections.",
  },
  {
    q: `When will the CAT ${YEAR} result be declared?`,
    a: resultDate
      ? `The CAT ${YEAR} Information Bulletin says the result is ${resultDate.value}. Treat this as tentative until the CAT Centre announces a date.`
      : "No result date has been published.",
  },
  {
    q: "How much time do PwD candidates get?",
    a: "In CAT 2024 and CAT 2025 the official media releases gave PwD candidates 160 minutes in total instead of 120. Check your own admit card for the time allowed this year.",
  },
];

export default function CatExamPattern() {
  const title = `CAT ${YEAR} Exam Pattern, Dates and Marking Scheme`;
  const description = `CAT ${YEAR} from official CAT Centre documents: ${CAT_LATEST.totalDurationMinutes} minutes, ${CAT_LATEST.sections.length} fixed-order sections, marking scheme, dates and colleges that accept CAT.`;
  const jsonLd = [
    articleJsonLd({ headline: title, description, path: CAT_PATTERN_PATH, dateModified: LAST_VERIFIED_ISO }),
    breadcrumbJsonLd(CRUMBS, CAT_PATTERN_PATH),
    faqJsonLd(FAQS),
  ];

  return (
    <>
      <PageSEO
        title={`CAT ${YEAR} Exam: Pattern, Dates & Marking Scheme`}
        description={description}
        canonical={CAT_PATTERN_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow={`MBA entrance exam · CAT ${YEAR}`}
          title={title}
          answer={
            <p>
              CAT {YEAR} is a {CAT_LATEST.totalDurationMinutes}-minute computer-based test
              {examDate ? ` on ${examDate.value.split(",").slice(0, 2).join(",")}` : ""}, with {CAT_LATEST.sections.length}{" "}
              sections in a fixed order ({sectionOrder}){sameDuration ? ` and exactly ${perSection} minutes for each` : ""}.
              {mcq && tita
                ? ` A correct answer earns ${signed(mcq.correct)}; a wrong multiple-choice answer costs ${Math.abs(mcq.incorrect)} mark and a wrong type-in answer costs nothing, per the latest official statement of the marking scheme.`
                : ""}
              {!countsAnnounced && COUNTED
                ? ` Question counts for ${YEAR} are published only after the test; CAT ${COUNTED.year} had ${countedTotal}.`
                : ""}
            </p>
          }
        >
          <div className="mt-6">
            <StartCatPrepButton />
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section
            id="sections"
            title={`What are the sections in CAT ${YEAR}?`}
            lead={<p>Conducted by the {CAT_EXAM.conductingBody}.</p>}
          >
            <TableWrap caption={`CAT ${YEAR} sections`}>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Section</Th>
                  <Th className="text-right">Time</Th>
                  <Th className="text-right">Questions</Th>
                </tr>
              </thead>
              <tbody>
                {CAT_LATEST.sections.map((s, i) => (
                  <tr key={s.id}>
                    <Td>{i + 1}</Td>
                    <Td>
                      <strong className="font-semibold">{s.id}</strong>
                      <span className="block text-[12.5px] text-slate-500">{s.name}</span>
                    </Td>
                    <Td className="text-right tabular-nums">{s.durationMinutes} min</Td>
                    <Td className="text-right">
                      {s.questionCount ?? <span className="text-slate-500">Not announced yet</span>}
                    </Td>
                  </tr>
                ))}
                <tr>
                  <Td />
                  <Td className="font-semibold">Total</Td>
                  <Td className="text-right font-semibold tabular-nums">{CAT_LATEST.totalDurationMinutes} min</Td>
                  <Td className="text-right text-slate-500">{countsAnnounced ? CAT_LATEST.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0) : "—"}</Td>
                </tr>
              </tbody>
            </TableWrap>
            <p className="mt-2">
              <Cite source={CAT_LATEST.source} />
            </p>
            {CAT_LATEST.sectionOrderLocked && (
              <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
                The section timer is strict: when a section&rsquo;s {perSection} minutes end, the test moves on, and you
                cannot return to it or skip ahead. Plan your time per section rather than across the whole paper.
              </p>
            )}
          </Section>

          <Section
            id="marking"
            title="How is CAT marked, and is there negative marking?"
            lead={
              <p>
                The marking scheme below is taken from the latest official statement of it, the CAT 2023 result release.
                The CAT 2024, 2025 and {YEAR} bulletins and releases do not restate it, so treat it as the expected
                scheme until the CAT Centre confirms otherwise.
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
                    <Td className="font-medium">{markingLabel(m)}</Td>
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
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
              Officially, type-in questions are called &ldquo;Non-MCQ&rdquo; or short-answer questions; &ldquo;TITA&rdquo;
              is the common name for them. The split between MCQ and type-in questions in each section is not officially
              published.
            </p>
            <p className="mt-3 text-[13.5px]">
              <Link to={MBA_PATHS.scoreCalculator} className="font-medium text-[#2F43F2] hover:underline">
                Work out your raw score with the CAT score calculator
              </Link>
              {" · "}
              <Link to={MBA_PATHS.freeMocks} className="font-medium text-[#2F43F2] hover:underline">
                Take a free CAT mock test
              </Link>
            </p>
          </Section>

          <Section id="dates" title={`When is CAT ${YEAR}, and when is the result?`}>
            <TableWrap caption={`CAT ${YEAR} key dates`}>
              <tbody>
                {CAT_2026_KEY_DATES.map((d) => (
                  <tr key={d.label}>
                    <Td className="w-[190px] font-medium text-slate-600">{d.label}</Td>
                    <Td>
                      <span className="font-semibold text-[#0E1629]">{d.value}</span>
                      {d.tentative && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Tentative
                        </span>
                      )}
                      <span className="mt-1 block">
                        <Cite source={d.source} />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            {isPublished(MBA_PATHS.deadlines) && (
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.deadlines} className="font-medium text-[#2F43F2] hover:underline">
                  Colleges&rsquo; own 2027 application deadlines, with calendar export
                </Link>
              </p>
            )}
          </Section>

          {CAT_FACTS.length > 0 && (
            <Section id="eligibility-fees" title={`Who can take CAT ${YEAR}, and what does it cost?`}>
              <FactsTable
                facts={CAT_FACTS.map((f) => ({ ...f, label: f.label.replace(/^Fee: /, "Fee — ") }))}
                caption={`CAT ${YEAR} eligibility, fees and score validity`}
              />
            </Section>
          )}

          <Section id="history" title="Has the CAT pattern changed in recent years?">
            <TableWrap caption="CAT pattern by year">
              <thead>
                <tr>
                  <Th>Year</Th>
                  {CAT_LATEST.sections.map((s) => (
                    <Th key={s.id} className="text-right">
                      {s.id} questions
                    </Th>
                  ))}
                  <Th className="text-right">Time</Th>
                  <Th>Official source</Th>
                </tr>
              </thead>
              <tbody>
                {CAT_EXAM.versions.map((v) => (
                  <tr key={v.year}>
                    <Td className="font-semibold">CAT {v.year}</Td>
                    {v.sections.map((s) => (
                      <Td key={s.id} className="text-right tabular-nums">
                        {s.questionCount ?? <span className="text-slate-400">Not yet</span>}
                      </Td>
                    ))}
                    <Td className="text-right tabular-nums">{v.totalDurationMinutes} min</Td>
                    <Td>
                      {v.source.url ? (
                        <a href={v.source.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-500 underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]">
                          {v.source.title}
                        </a>
                      ) : (
                        v.source.title
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
              The structure &mdash; three sections, {perSection} minutes each, {CAT_LATEST.totalDurationMinutes} minutes in
              all &mdash; has stayed the same across these years. PwD candidates were given 160 minutes in CAT 2024 and
              2025. <Cite source={CAT_2025_MEDIA_RELEASE} />
            </p>
          </Section>

          <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[Poppins] text-[18px] font-semibold">Already have a mock percentile?</h2>
              <p className="mt-1 text-[14px] text-slate-600">
                See which IIMs&rsquo; published minimums it clears with the{" "}
                <Link to={ELIGIBILITY_TOOL_PATH} className="font-medium text-[#2F43F2] underline">
                  CAT percentile eligibility checker
                </Link>
                .
              </p>
            </div>
            <StartCatPrepButton />
          </Card>

          {CAT_COLLEGES.length > 0 && (
            <Section
              id="colleges"
              title="Which colleges accept CAT scores?"
              lead={
                <p>
                  All {CAT_COLLEGES.length} institutes below use CAT in their official admission documents. Many more
                  B-schools accept CAT; we list only those whose data we have verified.
                </p>
              }
            >
              <CollegeTable colleges={CAT_COLLEGES} caption="Colleges that accept CAT, with verified data" columns={["city", "nirf", "fee"]} />
            </Section>
          )}

          {PERCENTILE_LINKS.length > 0 && (
            <Section id="percentile" title="What CAT percentile do you need for each college?">
              <LinkChips label="MBA colleges by CAT percentile" items={PERCENTILE_LINKS} />
              <p className="mt-3 text-[13.5px]">
                <Link to={MBA_PATHS.iimCutoffs} className="font-medium text-[#2F43F2] underline">
                  IIM CAT cut-offs by category
                </Link>
              </p>
            </Section>
          )}

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <SourcesList
            sources={[
              ...CAT_EXAM.versions.map((v) => v.source),
              CAT_MARKING_SOURCE,
              CAT_2025_MEDIA_RELEASE,
              ...CAT_2026_KEY_DATES.map((d) => d.source),
              ...CAT_FACTS.map((f) => f.source),
            ]}
            intro={<>Official CAT Centre documents ({CAT_EXAM.officialUrl}), last checked on {LAST_VERIFIED}.</>}
          />

          <RelatedMbaPages current={CAT_PATTERN_PATH} />

          <MbaConversion intent="CAT exam page enquiry" formId="cat_exam_page" />
        </Container>
      </PageShell>
    </>
  );
}
