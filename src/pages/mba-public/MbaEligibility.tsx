import { Link, Navigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import {
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
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import type { ExamInfo, SourcedFact } from "@/data/mbaSnapshotTypes";
import {
  ELIGIBILITY_TOOL_PATH,
  IIM_CUTOFFS_PATH,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  isPublished,
  joinNames,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_EXAMS, MBA_PATHS, examPath, examsWithEligibility } from "@/lib/mbaRoutes.mjs";

const PATH = MBA_PATHS.eligibility;
const CRUMBS = mbaCrumbs({ name: "Entrance exams", to: MBA_PATHS.exams }, { name: "MBA eligibility" });

interface Row {
  exam: ExamInfo;
  fact: SourcedFact;
  /** The minimum graduation percentage the wording states, if any (first "NN%"). */
  minPct: number | null;
  /** The lower figure for some categories, if the wording states one ("45% for SC, ST ..."). */
  reservedPct: number | null;
  finalYear: boolean;
  noAge: boolean;
}

const ORDER = MBA_EXAMS.map((e) => e.id);
const ROWS: Row[] = examsWithEligibility(MBA_SNAPSHOT)
  .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
  .map((exam) => {
    const fact = exam.facts.find((f) => f.label === "Eligibility")!;
    const pcts = [...fact.value.matchAll(/(\d{2})\s*%/g)].map((m) => Number(m[1]));
    return {
      exam,
      fact,
      minPct: pcts[0] ?? null,
      reservedPct: pcts.length > 1 && pcts[1] < pcts[0] ? pcts[1] : null,
      finalYear: /final[- ]year|final exams|appearing for (the|their) final|awaiting results/i.test(fact.value),
      noAge: /no age (bar|restriction)/i.test(fact.value),
    };
  });

const short = (r: Row) => MBA_EXAMS.find((e) => e.id === r.exam.id)?.short ?? r.exam.shortName;
const withPct = ROWS.filter((r) => r.minPct !== null);
const withoutPct = ROWS.filter((r) => r.minPct === null && r.exam.id !== "gmat");
const finalYear = ROWS.filter((r) => r.finalYear);
const GMAT = ROWS.find((r) => r.exam.id === "gmat" && /\bage|years old/i.test(r.fact.value));
const noAge = ROWS.filter((r) => r.noAge);
const pctPhrase = (rows: Row[]) =>
  joinNames(rows.map((r) => `${short(r)} (${r.minPct}%${r.reservedPct ? `, ${r.reservedPct}% for some reserved categories` : ""})`));

const FAQS: Faq[] = [
  {
    q: "What is the minimum percentage for an MBA in India?",
    a: `It depends on the entrance exam and then on the institute. ${withPct.length ? `${pctPhrase(withPct)} state a minimum graduation percentage. ` : ""}${withoutPct.length ? `${joinNames(withoutPct.map(short))} state no minimum percentage of their own; the institutes using them set their own. ` : ""}Read the official wording in the table above.`,
  },
  {
    q: "Can I apply for an MBA in my final year of graduation?",
    a: finalYear.length
      ? `Yes, for most exams. The official eligibility of ${joinNames(finalYear.map(short))} allows final-year students, subject to completing the degree by the date each states. The institute confirms your admission only after you submit the final marks.`
      : "Check each exam's official eligibility wording; it states whether final-year students can apply.",
  },
  {
    q: "Is there an age limit for MBA entrance exams?",
    a: `${noAge.length ? `${joinNames(noAge.map(short))} explicitly set no age limit. ` : ""}${GMAT ? "GMAT sets a minimum age; its official wording is in the table above. " : ""}The other exams' eligibility wording does not mention age.`,
  },
  {
    q: "Is work experience required for an MBA?",
    a: "Not for the two-year programmes these exams lead to: none of their official eligibility rules asks for it. Many institutes do give work experience some weight in their final selection, and executive and one-year programmes usually require it. Each IIM's admission policy states how it counts.",
  },
  {
    q: "Does meeting the eligibility mean I will get admission?",
    a: "No. Eligibility only lets you sit the exam and apply. Admission then depends on your score, the institute's shortlisting, its written test or group discussion and interview, and its composite score. No institute promises admission for meeting the eligibility.",
  },
];

function Page() {
  const title = "MBA Eligibility 2027: Degree, Marks and Exams";
  const description = `MBA eligibility 2027: the degree and marks each entrance exam (${ROWS.map(short).slice(0, 5).join(", ")} and more) asks for, in its official wording, with sources.`;
  const sources = ROWS.map((r) => r.fact.source);
  return (
    <>
      <PageSEO
        title="MBA Eligibility 2027: Marks & Exams"
        description={description.length > 155 ? `${description.slice(0, 152)}…` : description}
        canonical={PATH}
        jsonLd={[
          articleJsonLd({ headline: title, description, path: PATH, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(CRUMBS, PATH),
          faqJsonLd(FAQS),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA admission · eligibility"
          title={title}
          answer={
            <p>
              To join an MBA in India you need a bachelor&rsquo;s degree in any discipline, and final-year students can
              usually apply. The marks bar comes from the entrance exam: {withPct.length ? `${pctPhrase(withPct)} state a minimum graduation percentage, ` : ""}
              while {joinNames(withoutPct.map(short))} set none of their own. Institutes may add their own rules on top.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Section
            id="by-exam"
            title="What does each MBA entrance exam require?"
            lead={<p>The eligibility rule each exam body publishes, in its own words, with the minimum percentage it states.</p>}
          >
            <TableWrap caption="MBA entrance exam eligibility, official wording">
              <thead>
                <tr>
                  <Th>Exam</Th>
                  <Th>Minimum graduation marks stated</Th>
                  <Th>Official eligibility</Th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.exam.id}>
                    <Td>
                      {isPublished(examPath(r.exam.id)) ? (
                        <Link to={examPath(r.exam.id)} className="font-semibold text-[#2F43F2] hover:underline">
                          {short(r)}
                        </Link>
                      ) : (
                        <span className="font-semibold">{short(r)}</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {r.minPct !== null ? (
                        <span className="font-semibold tabular-nums">
                          {r.minPct}%{r.reservedPct ? <span className="font-normal text-slate-500"> ({r.reservedPct}% some categories)</span> : null}
                        </span>
                      ) : (
                        <span className="text-slate-500">None stated</span>
                      )}
                    </Td>
                    <Td className="max-w-[560px] text-[13px] leading-6 text-slate-700">
                      {r.fact.value}
                      <span className="mt-1 block">
                        <Cite source={r.fact.source} />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>

          <Section id="final-year" title="Can final-year students apply for an MBA?">
            <p className="max-w-3xl text-[14.5px] leading-7 text-slate-700">{FAQS[1].a}</p>
          </Section>

          <Section id="age-work" title="Is there an age limit or a work-experience requirement?">
            <p className="max-w-3xl text-[14.5px] leading-7 text-slate-700">
              {FAQS[2].a} {FAQS[3].a}
            </p>
          </Section>

          <Section id="institutes" title="What do institutes add on top of exam eligibility?">
            <p className="max-w-3xl text-[14.5px] leading-7 text-slate-700">
              Each institute applies its own rules after the exam. The IIMs publish minimum CAT percentiles (overall and
              by section) for each category, and some also set minimum Class X, XII or graduation marks; programmes such
              as executive MBAs ask for work experience. Check the minimums in the{" "}
              <Link to={IIM_CUTOFFS_PATH} className="font-medium text-[#2F43F2] underline">
                IIM CAT cut-offs table
              </Link>{" "}
              or test your percentile with the{" "}
              <Link to={ELIGIBILITY_TOOL_PATH} className="font-medium text-[#2F43F2] underline">
                CAT college predictor
              </Link>
              .
            </p>
            <div className="mt-4">
              <LinkChips
                label="Related"
                items={[
                  { to: MBA_PATHS.exams, label: "MBA entrance exams compared" },
                  { to: MBA_PATHS.courses, label: "Types of MBA courses" },
                  { to: MBA_PATHS.deadlines, label: "MBA admission deadlines" },
                  { to: "/mba-resources/mba-without-work-experience", label: "MBA without work experience" },
                  { to: "/mba-resources/mba-admission-process", label: "MBA admission process" },
                ].filter((x) => isPublished(x.to))}
              />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <SourcesList sources={sources} />

          <RelatedMbaPages current={PATH} />

          <MbaConversion intent="MBA eligibility enquiry" formId="mba_eligibility_page" />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaEligibility() {
  if (!isPublished(PATH)) return <Navigate to={MBA_PATHS.exams} replace />;
  return <Page />;
}
