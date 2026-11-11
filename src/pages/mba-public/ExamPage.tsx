import { Link, Navigate, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import CollegeTable from "@/components/mba-public/CollegeTable";
import CapCutoffTable from "@/components/mba-public/CapCutoffTable";
import {
  Cite,
  Container,
  FaqList,
  Hero,
  LinkChips,
  MbaConversion,
  PageShell,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { examOverview } from "@/content/mbaExamsOverview";
import type { ExamInfo } from "@/data/mbaSnapshotTypes";
import FactsTable from "@/components/mba-public/FactsTable";
import {
  ALL_COLLEGES,
  examInfo,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  isPublished,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { CAP_META } from "@/lib/mahCap";
import { MBA_EXAMS, MBA_PATHS, cityPath, examPath } from "@/lib/mbaRoutes.mjs";

const factValue = (e: ExamInfo, label: string) => e.facts.find((f) => f.label === label)?.value ?? null;

function buildFaqs(e: ExamInfo): Faq[] {
  const faqs: Faq[] = [];
  const examDay = e.dates.find((d) => /exam|test date/i.test(d.label) && !/admit|registration/i.test(d.label));
  if (examDay) {
    faqs.push({
      q: `When is ${e.shortName}?`,
      a: `${examDay.label}: ${examDay.value}${examDay.tentative ? " (tentative)" : ""}, per the official notice. Check ${e.officialUrl} for changes.`,
    });
  }
  if (e.sections.length) {
    const total = e.sections.every((s) => s.questionCount !== null) ? e.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0) : null;
    faqs.push({
      q: `What is the ${e.shortName} exam pattern?`,
      a: `${e.shortName} has ${e.sections.length} sections: ${e.sections.map((s) => s.name).join("; ")}${total ? `, ${total} questions in all` : ""}${e.totalDurationMinutes ? `, in ${e.totalDurationMinutes} minutes` : ""}.${e.markingText ? ` Marking: ${e.markingText}` : ""}`,
    });
  }
  const elig = factValue(e, "Eligibility");
  if (elig) faqs.push({ q: `Who can take ${e.shortName}?`, a: elig });
  const validity = factValue(e, "Score validity");
  if (validity) faqs.push({ q: `How long is a ${e.shortName} score valid?`, a: validity });
  if (e.resultAndCounselling) faqs.push({ q: `How are ${e.shortName} results used for admission?`, a: e.resultAndCounselling });
  return faqs;
}

function Page({ e }: { e: ExamInfo }) {
  const path = examPath(e.id);
  const crumbs = mbaCrumbs({ name: "Entrance exams", to: MBA_PATHS.exams }, { name: e.shortName });
  const overview = examOverview(e.id);
  const accepting = ALL_COLLEGES.filter((c) => c.acceptedExams.includes(e.id));
  const faqs = buildFaqs(e);
  const examDay = e.dates.find((d) => /exam|test date/i.test(d.label) && !/admit|registration/i.test(d.label));
  const fees = e.facts.filter((f) => f.label.startsWith("Fee"));
  const otherFacts = e.facts.filter((f) => !f.label.startsWith("Fee"));
  const siblings = MBA_EXAMS.filter((x) => x.id !== e.id && isPublished(examPath(x.id)));
  const isMah = e.id === "mah-mba-cet";
  const mahCities = isMah ? ["mumbai", "pune", "nagpur"].filter((c) => isPublished(cityPath(c))) : [];

  const title = `${e.shortName} ${e.year ?? ""} Exam: Pattern, Dates, Fees`.replace("  ", " ");
  const description = `${e.name}: ${examDay ? `exam on ${examDay.value}, ` : ""}pattern, marking, eligibility, fees and the colleges that use it, from official notices.`;

  const answer = (
    <p>
      {e.shortName} ({e.name.replace(/ \(.*\)$/, "")}) is conducted by {e.conductingBody ?? overview?.conductedBy ?? "its exam body"}
      {overview ? ` and is used for ${overview.usedFor.charAt(0).toLowerCase()}${overview.usedFor.slice(1)}` : ""}.{" "}
      {examDay ? `${examDay.label}: ${examDay.value}${examDay.tentative ? " (tentative)" : ""}. ` : ""}
      {e.sections.length ? `It has ${e.sections.length} sections${e.totalDurationMinutes ? ` in ${e.totalDurationMinutes} minutes` : ""}. ` : ""}
      Every detail below links to the official notice it comes from.
    </p>
  );

  return (
    <>
      <PageSEO
        title={title}
        description={description.length > 155 ? `${description.slice(0, 152)}…` : description}
        canonical={path}
        jsonLd={[
          articleJsonLd({ headline: title, description, path, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(crumbs, path),
          ...(faqs.length ? [faqJsonLd(faqs)] : []),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} leadExam={e.shortName} eyebrow="MBA entrance exam" title={`${e.shortName}: Exam Pattern, Dates, Eligibility and Fees`} answer={answer}>
          <a
            href={e.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-600 hover:text-[#2F43F2]"
          >
            Official {e.shortName} website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Hero>

        <Container className="mt-8 space-y-12">
          {e.dates.length > 0 && (
            <Section id="dates" title={`What are the important ${e.shortName} dates?`}>
              <FactsTable facts={e.dates} caption={`${e.shortName} key dates`} />
              {isPublished(MBA_PATHS.deadlines) && (
                <p className="mt-3 text-[13.5px]">
                  <Link to={MBA_PATHS.deadlines} className="font-medium text-[#2F43F2] hover:underline">
                    All MBA 2027 admission deadlines, with colleges&rsquo; own application dates
                  </Link>
                </p>
              )}
            </Section>
          )}

          {e.sections.length > 0 && (
            <Section id="pattern" title={`What is the ${e.shortName} exam pattern?`}>
              <TableWrap caption={`${e.shortName} sections`}>
                <thead>
                  <tr>
                    <Th>Section</Th>
                    <Th className="text-right">Questions</Th>
                    <Th className="text-right">Time</Th>
                  </tr>
                </thead>
                <tbody>
                  {e.sections.map((s) => (
                    <tr key={s.name}>
                      <Td>{s.name}</Td>
                      <Td className="text-right tabular-nums">{s.questionCount ?? <span className="text-slate-400">Not stated</span>}</Td>
                      <Td className="text-right tabular-nums">{s.durationMinutes ? `${s.durationMinutes} min` : <span className="text-slate-400">—</span>}</Td>
                    </tr>
                  ))}
                  {e.totalDurationMinutes && (
                    <tr>
                      <Td className="font-semibold">Total time</Td>
                      <Td />
                      <Td className="text-right font-semibold tabular-nums">{e.totalDurationMinutes} min</Td>
                    </tr>
                  )}
                </tbody>
              </TableWrap>
              {e.markingText && (
                <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">
                  <strong>Marking:</strong> {e.markingText}
                </p>
              )}
              {e.patternNotes && <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-600">{e.patternNotes}</p>}
              <p className="mt-2">
                <Cite source={e.patternSource} />
              </p>
            </Section>
          )}

          {e.syllabusAreas.length > 0 && (
            <Section id="syllabus" title={`What does ${e.shortName} test?`}>
              <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-[14px] leading-7 text-slate-700">
                {e.syllabusAreas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Section>
          )}

          {otherFacts.length > 0 && (
            <Section id="facts" title={`Who can take ${e.shortName}, and how is it run?`}>
              <FactsTable facts={otherFacts} caption={`${e.shortName} key facts`} />
            </Section>
          )}

          {fees.length > 0 && (
            <Section id="fees" title={`What is the ${e.shortName} application fee?`}>
              <FactsTable facts={fees.map((f) => ({ ...f, label: f.label.replace(/^Fee: /, "") }))} caption={`${e.shortName} fees`} />
            </Section>
          )}

          {(e.acceptedBy.length > 0 || accepting.length > 0) && (
            <Section id="colleges" title={`Which colleges accept ${e.shortName}?`}>
              {accepting.length > 0 && (
                <div className="mb-4">
                  <CollegeTable colleges={accepting} caption={`Colleges with verified data that accept ${e.shortName}`} columns={["city", "nirf", "fee"]} />
                </div>
              )}
              {e.acceptedBy.length > 0 && (
                <>
                  <p className="text-[13.5px] text-slate-600">Institutes the exam body names:</p>
                  <ul className="mt-2 grid gap-1.5 text-[13.5px] text-slate-700 sm:grid-cols-2">
                    {e.acceptedBy.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </>
              )}
              {e.acceptedByNote && <p className="mt-2 text-[13px] text-slate-600">{e.acceptedByNote}</p>}
              {e.acceptedByUrl && (
                <a href={e.acceptedByUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#2F43F2] hover:underline">
                  Full official list <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </Section>
          )}

          {isMah && CAP_META && (
            <Section
              id="cap-cutoffs"
              title="What MAH-CET percentile do Maharashtra MBA colleges close at?"
              lead={
                <p>
                  Official CAP closing percentiles for every MBA/MMS course in the list, OPEN columns. Filter by city or
                  search for an institute. These are <strong>MAH-MBA/MMS CET percentiles</strong>, not CAT percentiles.
                </p>
              }
            >
              <CapCutoffTable />
              {mahCities.length > 0 && (
                <div className="mt-4">
                  <LinkChips label="MBA colleges by city" items={mahCities.map((c) => ({ to: cityPath(c), label: `MBA colleges in ${c.charAt(0).toUpperCase()}${c.slice(1)}` }))} />
                </div>
              )}
            </Section>
          )}

          {faqs.length > 0 && (
            <Section id="faq" title="Frequently asked questions">
              <FaqList faqs={faqs} />
            </Section>
          )}

          <SourcesList sources={[...e.sources, ...(isMah && CAP_META ? [CAP_META.source] : [])]} />

          <Section id="other-exams" title="Other MBA entrance exams">
            <LinkChips label="Other MBA entrance exams" items={siblings.map((x) => ({ to: examPath(x.id), label: x.short }))} />
            <p className="mt-3 text-[13.5px]">
              <Link to="/mba-resources/cat-vs-xat-vs-snap-vs-nmat" className="font-medium text-[#2F43F2] hover:underline">
                CAT vs XAT vs SNAP vs NMAT: which to take
              </Link>
            </p>
          </Section>

          <MbaConversion intent={`${e.shortName} exam page enquiry`} formId="mba_exam_page" exam={e.shortName} />
        </Container>
      </PageShell>
    </>
  );
}

export default function ExamPage() {
  const { exam } = useParams<{ exam: string }>();
  const info = exam ? examInfo(exam) : undefined;
  if (!info || info.id === "cat" || !isPublished(examPath(info.id))) return <Navigate to={MBA_PATHS.exams} replace />;
  return <Page e={info} />;
}
