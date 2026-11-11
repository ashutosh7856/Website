import { Link, Navigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import { SrcLink } from "@/components/mba-public/CollegeTable";
import {
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
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import type { ProgramDetail } from "@/api/mba";
import {
  ALL_COLLEGES,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  formatInr,
  formatLakh,
  institutePath,
  isPublished,
  itemListJsonLd,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { MBA_PATHS } from "@/lib/mbaRoutes.mjs";

type Mode = "fees" | "placements";

interface Entry {
  college: MbaCollege;
  program: ProgramDetail;
  value: number;
}

/** One entry per programme with the figure, highest first. */
function entries(mode: Mode): Entry[] {
  return ALL_COLLEGES.flatMap((college) =>
    college.programs
      .map((program) => ({ college, program, value: mode === "fees" ? program.feeTotal : program.medianSalary }))
      .filter((e): e is Entry => e.value !== null && (mode === "fees" ? !!e.program.feeSource : !!e.program.salarySource)),
  ).sort((a, b) => b.value - a.value);
}

const label = (e: Entry) => (e.college.programs.length > 1 ? `${e.college.shortName} (${e.program.code})` : e.college.shortName);

function FeesOrPlacements({ mode }: { mode: Mode }) {
  const fees = mode === "fees";
  const path = fees ? MBA_PATHS.fees : MBA_PATHS.placements;
  const list = entries(mode);
  const crumbs = mbaCrumbs({ name: "MBA colleges", to: MBA_PATHS.colleges }, { name: fees ? "MBA fees" : "MBA placements" });
  const hi = list[0];
  const lo = list[list.length - 1];
  const iims = list.filter((e) => e.college.group === "IIM");
  const iimHi = iims[0];
  const iimLo = iims[iims.length - 1];
  const title = fees ? "MBA Fees in India: IIMs and Top B-Schools Compared" : "MBA Placements in India: Median Salaries Compared";
  const description = fees
    ? `Total MBA fees at ${list.length} programmes, from ${formatLakh(lo.value)} to ${formatLakh(hi.value)}, from each institute's own fee document.`
    : `Median MBA salaries at ${list.length} programmes from official placement reports, ${formatLakh(lo.value)} to ${formatLakh(hi.value)} a year, with year and source.`;

  const answer = fees ? (
    <p>
      Total programme fees for the {list.length} MBA programmes we have verified range from {formatLakh(lo.value)} ({label(lo)}) to{" "}
      {formatLakh(hi.value)} ({label(hi)}).
      {iimHi && iimLo ? ` At the IIMs the stated flagship fee runs from ${formatLakh(iimLo.value)} (${label(iimLo)}) to ${formatLakh(iimHi.value)} (${label(iimHi)}).` : ""}{" "}
      Fees cover different things — some include hostel and food, some do not — so read the note under each before comparing.
    </p>
  ) : (
    <p>
      Median salaries in the official placement reports we have verified range from {formatLakh(lo.value)} ({label(lo)}) to{" "}
      {formatLakh(hi.value)} ({label(hi)}) a year. Reports cover different graduating years and define salary in their own way,
      so each figure carries its year and source. Past medians describe a past batch; they do not promise yours.
    </p>
  );

  const faqs: Faq[] = fees
    ? [
        {
          q: "What is the fee for an MBA at an IIM?",
          a: iimHi && iimLo ? `The IIMs' stated flagship fees range from ${formatInr(iimLo.value)} (${label(iimLo)}) to ${formatInr(iimHi.value)} (${label(iimHi)}), each for the batch the institute last announced.` : "Each IIM states its own fee; see the table.",
        },
        {
          q: "Which MBA colleges have the lowest fees?",
          a: `Among the programmes we have verified, the lowest stated total fee is ${formatInr(lo.value)} at ${label(lo)}. University departments are generally the least expensive, though their seats are highly competitive.`,
        },
        {
          q: "Do MBA fees include hostel and food?",
          a: "It depends on the institute. Some quote one figure including boarding and lodging, others quote tuition and list hostel separately. The note under each fee says what the institute includes.",
        },
        {
          q: "How can I pay for an MBA?",
          a: "Most students combine savings, education loans from banks and institute need-based financial aid or scholarships. Check each institute's financial-aid page; terms vary widely.",
        },
      ]
    : [
        {
          q: "Which MBA college has the highest median salary?",
          a: `Among the reports we have verified, the highest median is ${formatInr(hi.value)} a year at ${label(hi)}${hi.program.medianSalaryYear ? ` (${hi.program.medianSalaryYear})` : ""}.`,
        },
        {
          q: "Why the median and not the average or highest package?",
          a: "The median is the salary of the middle graduate, so a few very large offers cannot pull it up. The highest package describes one person. We show medians only and never mix them with averages.",
        },
        {
          q: "Do past placements guarantee a job after an MBA?",
          a: "No. Placements depend on the economy, your specialisation, prior experience and your own performance. Use the figures to compare institutes, not to predict your salary.",
        },
      ];

  const sources = list.map((e) => (fees ? e.program.feeSource : e.program.salarySource)).filter((s) => !!s).map((s) => s!);

  return (
    <>
      <PageSEO
        title={fees ? "MBA Fees in India: IIM and B-School Fees" : "MBA Placements: Median Salaries Compared"}
        description={description}
        canonical={path}
        jsonLd={[
          articleJsonLd({ headline: title, description, path, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(crumbs, path),
          itemListJsonLd(title, list.map((e) => ({ name: label(e), path: institutePath(e.college.slug) }))),
          faqJsonLd(faqs),
        ]}
      />
      <PageShell>
        <Hero crumbs={crumbs} eyebrow={fees ? "MBA fees · official figures" : "MBA placements · official reports"} title={title} answer={answer} />
        <Container className="mt-8 space-y-12">
          <Section
            id="table"
            title={fees ? "How much does an MBA cost at each college?" : "What is the median MBA salary at each college?"}
            lead={<p>{fees ? "Total fee for the whole programme, as the institute states it." : "Median annual salary, graduating year in brackets."}</p>}
          >
            <TableWrap caption={title}>
              <thead>
                <tr>
                  <Th>Institute</Th>
                  <Th>Programme</Th>
                  <Th className="text-right">{fees ? "Total fee" : "Median salary"}</Th>
                  <Th>What it covers</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={`${e.college.slug}-${e.program.code}`}>
                    <Td>
                      <Link to={institutePath(e.college.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                        {e.college.shortName}
                      </Link>
                      {e.college.city && <span className="block text-[12px] text-slate-500">{e.college.city}</span>}
                    </Td>
                    <Td className="text-[13px]">{e.program.code}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {formatInr(e.value)}
                      {!fees && e.program.medianSalaryYear ? <span className="text-slate-400"> ({e.program.medianSalaryYear})</span> : null}
                      <SrcLink url={(fees ? e.program.feeSource : e.program.salarySource)?.url} label={`${e.college.shortName} ${fees ? "fee" : "salary"}`} />
                    </Td>
                    <Td className="max-w-[420px] text-[12.5px] leading-5 text-slate-600">{(fees ? e.program.feeNote : e.program.salaryNote) ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>

          <Section id="how-to-compare" title={fees ? "How should you compare MBA fees?" : "How should you read MBA placement figures?"}>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
              {fees ? (
                <>
                  <li>Compare total programme fees, not first-year fees: some institutes quote per year or per term.</li>
                  <li>Check whether hostel, food, laptop and exchange components are included — the notes above say.</li>
                  <li>Set the fee against the median salary and the two years of income you give up, not against the highest package.</li>
                  <li>Ask about need-based aid early; many institutes offer it, on their own terms.</li>
                </>
              ) : (
                <>
                  <li>Use the median, and check how many of the batch sought and got placements.</li>
                  <li>Compare the same graduating year where you can; markets move from year to year.</li>
                  <li>Look at the median for your intended specialisation if the report gives one.</li>
                  <li>Treat any figure not in an official report on the institute&rsquo;s own website with caution.</li>
                </>
              )}
            </ul>
            <div className="mt-4">
              <LinkChips
                label="Related"
                items={[
                  fees ? { to: MBA_PATHS.placements, label: "MBA placements compared" } : { to: MBA_PATHS.fees, label: "MBA fees compared" },
                  { to: MBA_PATHS.roiCalculator, label: "MBA fees & ROI calculator" },
                  { to: MBA_PATHS.compare, label: "Compare MBA colleges" },
                  { to: "/mba-resources/how-to-choose-mba-college", label: "How to choose an MBA college" },
                  { to: MBA_PATHS.colleges, label: "Best MBA colleges in India" },
                ].filter((x) => isPublished(x.to))}
              />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </Section>

          <SourcesList sources={sources} />

          <MbaConversion intent={fees ? "MBA fees enquiry" : "MBA placements enquiry"} formId={fees ? "mba_fees_page" : "mba_placements_page"} />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaFeesPlacements({ mode }: { mode: Mode }) {
  const path = mode === "fees" ? MBA_PATHS.fees : MBA_PATHS.placements;
  if (!isPublished(path)) return <Navigate to={MBA_PATHS.colleges} replace />;
  return <FeesOrPlacements mode={mode} />;
}
