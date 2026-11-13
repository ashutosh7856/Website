import { Link, Navigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
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
  StartCatPrepButton,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import type { ExamVersion, OfficialSource } from "@/api/mba";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import type { PyqPaper } from "@/data/mbaSnapshotTypes";
import {
  CAT_EXAM,
  CAT_PATTERN_PATH,
  FREE_MOCKS_PATH,
  PYQ_PAPERS_PATH,
  SCORE_CALCULATOR_PATH,
  breadcrumbJsonLd,
  faqJsonLd,
  isPublished,
  itemListJsonLd,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";

/**
 * /cat-previous-year-papers — the actual CAT papers the student app offers as
 * timed tests. Renders only the papers' identity, question counts and each
 * year's official pattern (cat_exam.json); no question, answer or solution is
 * ever on this page. Published only when at least one paper is in the snapshot.
 */

const STUDENT_PYQ_PATH = "/mba/pyq";
const PAPERS: PyqPaper[] = MBA_SNAPSHOT.pyqPapers ?? [];
const CRUMBS = mbaCrumbs({ name: "Entrance exams", to: "/mba-entrance-exams" }, { name: "CAT previous year papers" });

interface YearRow {
  year: number;
  papers: PyqPaper[];
  version: ExamVersion | null;
  /** Section pattern: official counts from cat_exam.json, else the papers' own counts. */
  sections: { id: string; name: string; questions: number | null; minutes: number | null }[];
  questions: number | null;
  minutes: number | null;
}

const versionFor = (year: number): ExamVersion | null => CAT_EXAM.versions.find((v) => v.year === year) ?? null;

function sameCount(papers: PyqPaper[], sid: string): number | null {
  const counts = new Set(papers.map((p) => p.sections.find((s) => s.id === sid)?.questionCount ?? 0));
  return counts.size === 1 ? [...counts][0] || null : null;
}

function yearRow(year: number, papers: PyqPaper[]): YearRow {
  const version = versionFor(papers[0]?.examVersionYear ?? year);
  const ids = version ? version.sections.map((s) => s.id) : papers[0].sections.map((s) => s.id);
  const sections = ids.map((id) => {
    const vs = version?.sections.find((s) => s.id === id);
    return {
      id,
      name: vs?.name ?? id,
      questions: vs?.questionCount ?? sameCount(papers, id),
      minutes: vs?.durationMinutes ?? null,
    };
  });
  const questions = sections.every((s) => s.questions !== null)
    ? sections.reduce((n, s) => n + (s.questions ?? 0), 0)
    : null;
  return { year, papers, version, sections, questions, minutes: version?.totalDurationMinutes ?? null };
}

const YEARS: YearRow[] = [...new Set(PAPERS.map((p) => p.year))]
  .sort((a, b) => b - a)
  .map((year) => yearRow(year, PAPERS.filter((p) => p.year === year).sort((a, b) => a.slot - b.slot)));

const FIRST = YEARS[YEARS.length - 1]?.year;
const LAST = YEARS[0]?.year;
const SPAN = FIRST === LAST ? String(LAST ?? "") : `${FIRST}–${LAST}`;
const WITH_SOLUTIONS = PAPERS.filter((p) => p.solutionCount > 0).length;
const ALL_SOLVED = PAPERS.length > 0 && PAPERS.every((p) => p.solutionCount >= p.questionCount);

const sectionMinutes = (row: YearRow): number | null => {
  const m = new Set(row.sections.map((s) => s.minutes));
  return m.size === 1 ? [...m][0] : null;
};

/** Consecutive years that share a pattern (questions + time per section), oldest first. */
function patternEras(): { from: number; to: number; questions: number | null; perSection: number | null; total: number | null }[] {
  const eras: { from: number; to: number; questions: number | null; perSection: number | null; total: number | null }[] = [];
  for (const row of [...YEARS].reverse()) {
    const perSection = sectionMinutes(row);
    const last = eras[eras.length - 1];
    if (last && last.questions === row.questions && last.perSection === perSection && last.total === row.minutes) {
      last.to = row.year;
    } else {
      eras.push({ from: row.year, to: row.year, questions: row.questions, perSection, total: row.minutes });
    }
  }
  return eras;
}

const ERAS = patternEras().filter((e) => e.questions !== null && e.perSection !== null);
const yearsLabel = (from: number, to: number) => (from === to ? `CAT ${from}` : `CAT ${from} to ${to}`);
const eraSentence = ERAS.map(
  (e) => `${yearsLabel(e.from, e.to)} had ${e.questions} questions with ${e.perSection} minutes per section`,
).join("; ");

const slotLabel = (p: PyqPaper) => `Slot ${p.slot}`;

const FEATURES: { title: string; body: string }[] = [
  {
    title: `${PAPERS.length} actual CAT papers`,
    body: `Every slot we have from ${SPAN}, as a full paper or one section at a time.`,
  },
  {
    title: "Timed like that year's exam",
    body: "Each paper runs with its own year's section order and section timer, and the timer survives a refresh.",
  },
  {
    title: "Scored with the CAT marking scheme",
    body: "Results show your score, accuracy and time per section, with negative marking only on multiple-choice questions.",
  },
  {
    title: ALL_SOLVED ? "Step-by-step solutions" : "Solutions where written",
    body: ALL_SOLVED
      ? "Every question has a worked solution you can open after you submit."
      : "Questions with a worked solution show it after you submit; we are still writing the rest.",
  },
  {
    title: "Your standing among ProCounsel students",
    body: "Once enough students have taken the same paper, see where your score stands among them. This is not the official CAT percentile.",
  },
  {
    title: "Free, with a free account",
    body: "No fee and no trial. Sign in so your attempts, timer and results are saved.",
  },
];

const FAQS: Faq[] = [
  {
    q: "Are these the actual CAT question papers?",
    a: `Yes. These are the papers from the CAT exams of ${SPAN}, one test per slot, put into our test player with each year's timing. Each paper's source is listed on this page. They are not official IIM practice material, and the IIMs do not endorse ProCounsel.`,
  },
  {
    q: "Are the CAT previous year papers free?",
    a: "Yes. Every paper, its sectional tests and your results are free. You need a free ProCounsel account so your timer and answers can be saved.",
  },
  {
    q: "Do the papers come with answers and solutions?",
    a: ALL_SOLVED
      ? "Yes. After you submit, you see the answer key and a step-by-step solution for every question. We do not publish answers on this page, so you can attempt each paper fresh."
      : `After you submit, you see the answer key for every question and a step-by-step solution where we have written one (${WITH_SOLUTIONS} of ${PAPERS.length} papers have solutions so far). We do not publish answers on this page, so you can attempt each paper fresh.`,
  },
  {
    q: "Will a previous year paper tell me my CAT percentile?",
    a: "No. Only the IIMs can give a CAT percentile, with the official result, and there is no official table that converts a score into a percentile. After a paper we show where your score stands among ProCounsel students who took the same paper, once at least 20 others have. That is a comparison with our students, not your CAT percentile.",
  },
  ...(ERAS.length > 1
    ? [
        {
          q: "Has the CAT pattern changed over the years?",
          a: `Yes. ${eraSentence}. Each paper here is timed by its own year's pattern, so older papers feel longer.`,
        },
      ]
    : []),
  {
    q: "Which year's paper should I start with?",
    a: `Start with the most recent papers${LAST ? ` (CAT ${LAST})` : ""}: they follow the current pattern most closely. Use older papers for extra practice by section, for example reading comprehension or data sets, rather than as a guide to today's timing.`,
  },
  {
    q: "Should I take the full paper or one section at a time?",
    a: "Take full papers to practise the section timer and switching between sections, and sectional tests to work on a weak section. Spend at least as long reviewing a paper as taking it.",
  },
];

const PAPER_SOURCES: OfficialSource[] = (() => {
  const seen = new Map<string, OfficialSource>();
  for (const p of PAPERS) if (!seen.has(p.source.url + p.source.title)) seen.set(p.source.url + p.source.title, p.source);
  return [...seen.values()];
})();

const PATTERN_SOURCES: OfficialSource[] = YEARS.map((y) => y.version?.source).filter(
  (s): s is OfficialSource => Boolean(s),
);

export default function CatPreviousYearPapers() {
  if (!isPublished(PYQ_PAPERS_PATH) || PAPERS.length === 0) return <Navigate to={FREE_MOCKS_PATH} replace />;

  const jsonLd = [
    faqJsonLd(FAQS),
    breadcrumbJsonLd(CRUMBS, PYQ_PAPERS_PATH),
    itemListJsonLd(
      "CAT previous year papers",
      PAPERS.map((p) => ({ name: `CAT ${p.year} ${slotLabel(p)}` })),
    ),
  ];

  return (
    <>
      <PageSEO
        title={`Free CAT Previous Year Papers ${SPAN}`}
        description={`Take ${PAPERS.length} actual CAT papers from ${SPAN} free, timed by each year's pattern, with results and your standing among ProCounsel students.`}
        canonical={PYQ_PAPERS_PATH}
        jsonLd={jsonLd}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow={`Free CAT prep · ${PAPERS.length} papers`}
          title={`CAT previous year papers ${SPAN}`}
          officialData={false}
          answer={
            <p>
              ProCounsel has {PAPERS.length} actual CAT papers from {SPAN}, every slot as a free timed test. Take a whole
              paper with that year's section timer or one section at a time, get your score with the CAT marking scheme,
              and see where you stand among ProCounsel students who took the same paper. Questions and answers are inside
              the free app, not on this page.
            </p>
          }
        >
          <div className="mt-6">
            <StartCatPrepButton label="Take a past paper free" studentTo={STUDENT_PYQ_PATH} />
          </div>
        </Hero>

        <Container className="mt-8 space-y-12">
          <Section
            id="papers"
            title="Which CAT papers can you take?"
            lead={<p>Every paper by year and slot, with the pattern it is timed and marked by.</p>}
          >
            <div className="space-y-4">
              {YEARS.map((row) => (
                <Card key={row.year}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="font-[Poppins] text-[17px] font-semibold">CAT {row.year}</h3>
                    <p className="text-[13px] text-slate-600">
                      {row.papers.length} {row.papers.length === 1 ? "slot" : "slots"}
                      {row.questions !== null && ` · ${row.questions} questions`}
                      {row.minutes !== null && ` · ${row.minutes} min`}
                    </p>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label={`CAT ${row.year} slots`}>
                    {row.papers.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700"
                      >
                        <span className="font-semibold text-slate-900">{slotLabel(p)}</span> · {p.questionCount} questions
                        <span className="block text-[12px] text-slate-500">
                          Full paper + {p.sections.length} sectionals
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <TableWrap caption={`CAT ${row.year} sections, questions and timing`}>
                      <thead>
                        <tr>
                          <Th>Order</Th>
                          <Th>Section</Th>
                          <Th className="text-right">Questions</Th>
                          <Th className="text-right">Time</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.sections.map((s, i) => (
                          <tr key={s.id}>
                            <Td>{i + 1}</Td>
                            <Td>
                              <strong className="font-semibold">{s.id}</strong>
                              {s.name !== s.id && <span className="block text-[12.5px] text-slate-500">{s.name}</span>}
                            </Td>
                            <Td className="text-right tabular-nums">{s.questions ?? "Varies by slot"}</Td>
                            <Td className="text-right tabular-nums">{s.minutes !== null ? `${s.minutes} min` : "—"}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  </div>
                  <p className="mt-2 space-x-3">
                    {row.version && <Cite source={row.version.source} prefix="Pattern" />}
                    {row.papers[0] && <Cite source={row.papers[0].source} prefix="Paper" />}
                  </p>
                </Card>
              ))}
            </div>
          </Section>

          {ERAS.length > 1 && (
            <Section
              id="pattern-changes"
              title="How has the CAT pattern changed?"
              lead={<p>Each paper is timed by its own year's official pattern.</p>}
            >
              <TableWrap caption="CAT pattern by year">
                <thead>
                  <tr>
                    <Th>Years</Th>
                    <Th className="text-right">Questions</Th>
                    <Th className="text-right">Per section</Th>
                    <Th className="text-right">Total time</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...ERAS].reverse().map((e) => (
                    <tr key={e.from}>
                      <Td>{e.from === e.to ? e.from : `${e.from}–${e.to}`}</Td>
                      <Td className="text-right tabular-nums">{e.questions}</Td>
                      <Td className="text-right tabular-nums">{e.perSection} min</Td>
                      <Td className="text-right tabular-nums">{e.total !== null ? `${e.total} min` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <p className="mt-3 text-[13.5px]">
                <Link to={CAT_PATTERN_PATH} className="font-medium text-[#2F43F2] hover:underline">
                  The current CAT pattern, dates and marking scheme
                </Link>
              </p>
            </Section>
          )}

          <Section id="what-you-get" title="What do you get with each paper?">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-[Poppins] text-[15.5px] font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-slate-600">{f.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
              Your standing among ProCounsel students compares your first attempt with other students' first attempts
              at the same paper. It is not the official CAT percentile, which only the IIMs publish with the result.
            </p>
          </Section>

          <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[Poppins] text-[18px] font-semibold">Ready to take a past paper?</h2>
              <p className="mt-1 text-[14px] text-slate-600">
                Sign in for free and pick a year and slot. Want more practice in the same pattern? Try our{" "}
                <Link to={FREE_MOCKS_PATH} className="font-medium text-[#2F43F2] underline">
                  free CAT mock tests
                </Link>{" "}
                or work out a raw score with the{" "}
                <Link to={SCORE_CALCULATOR_PATH} className="font-medium text-[#2F43F2] underline">
                  CAT score calculator
                </Link>
                .
              </p>
            </div>
            <StartCatPrepButton label="Take a past paper free" studentTo={STUDENT_PYQ_PATH} />
          </Card>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <RelatedMbaPages current={PYQ_PAPERS_PATH} />

          <MbaConversion
            intent="CAT previous year papers enquiry"
            formId="cat_previous_year_papers_page"
            subheading="Get help planning your CAT preparation and choosing where to apply after it. Free call, no login needed. We guide; admission decisions are always the institute's."
          />

          <SourcesList sources={[...PATTERN_SOURCES, ...PAPER_SOURCES]} />
        </Container>
      </PageShell>
    </>
  );
}
